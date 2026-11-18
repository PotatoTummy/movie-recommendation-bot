"""
TMDB (The Movie Database) API Client & Tools (Async via aiohttp with bulletproof urllib fallback)
Provides movie search, genre-based discovery, trailer fetching, and streaming provider lookups.
Features:
- Single parallel request with append_to_response=videos,watch/providers
- In-memory cache for details and providers
- Region-aware provider lookup (defaults to India 'IN' with US fallback)
"""

import asyncio
import json
import logging
import os
import ssl
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any, Dict, List, Optional

import aiohttp
from dotenv import load_dotenv

# Robustly load .env from agent directory or parent
_agent_env = Path(__file__).resolve().parents[2] / ".env"
if _agent_env.exists():
    load_dotenv(dotenv_path=_agent_env)
else:
    load_dotenv()

logger = logging.getLogger("tmdb-client")

TMDB_BASE_URL = "https://api.themoviedb.org/3"
TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500"

# In-memory LRU cache for movie details and providers: (movie_id, region) -> dict
_DETAILS_CACHE: Dict[str, Dict[str, Any]] = {}

BROWSER_UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)

GENRE_MAP: Dict[str, int] = {
    "action": 28,
    "adventure": 12,
    "animation": 16,
    "comedy": 35,
    "crime": 80,
    "documentary": 99,
    "drama": 18,
    "family": 10751,
    "fantasy": 14,
    "history": 36,
    "horror": 27,
    "music": 10402,
    "mystery": 9648,
    "romance": 10749,
    "sci-fi": 878,
    "science fiction": 878,
    "tv movie": 10770,
    "thriller": 53,
    "neo noir": 53,
    "neo-noir": 53,
    "noir": 53,
    "war": 10752,
    "western": 37,
}


def _get_headers() -> Dict[str, str]:
    """Retrieve auth headers using Read Access Token (v4) or API Key fallback."""
    token = os.environ.get("TMDB_READ_ACCESS_TOKEN", "").strip()
    headers = {
        "User-Agent": BROWSER_UA,
        "Accept": "application/json",
    }
    if token and not token.startswith("your_"):
        headers["Authorization"] = f"Bearer {token}"
    return headers


def _get_params(extra_params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    params = extra_params.copy() if extra_params else {}
    token = os.environ.get("TMDB_READ_ACCESS_TOKEN", "").strip()
    api_key = os.environ.get("TMDB_API_KEY", "").strip()
    if (not token or token.startswith("your_")) and api_key:
        params["api_key"] = api_key
    return params


def _sync_fetch(url: str, params: Dict[str, Any], headers: Dict[str, str]) -> Dict[str, Any]:
    """Synchronous urllib fetcher used as bulletproof fallback if aiohttp SSL drops."""
    try:
        query_str = urllib.parse.urlencode(params)
        full_url = f"{url}?{query_str}" if query_str else url
        req = urllib.request.Request(full_url, headers=headers)
        with urllib.request.urlopen(req, timeout=8) as response:
            return json.loads(response.read().decode("utf-8"))
    except Exception as e:
        logger.error(f"urllib fallback error for {url}: {e}")
        return {}


async def _safe_get(url: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Fetch JSON from TMDB with aiohttp, falling back to urllib on connection reset or SSL error."""
    headers = _get_headers()
    all_params = _get_params(params)

    try:
        timeout = aiohttp.ClientTimeout(total=8, connect=4)
        ssl_ctx = ssl.create_default_context()
        connector = aiohttp.TCPConnector(ssl=ssl_ctx)
        async with aiohttp.ClientSession(connector=connector, timeout=timeout) as session:
            async with session.get(url, headers=headers, params=all_params) as resp:
                if resp.status == 200:
                    return await resp.json()
                logger.warning(f"TMDB request returned status {resp.status} for {url}")
                return {}
    except Exception as e:
        logger.warning(f"aiohttp GET failed ({e}), falling back to urllib for {url}")
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(None, _sync_fetch, url, all_params, headers)


async def search_movies(query: str, year: Optional[int] = None) -> List[Dict[str, Any]]:
    """Search TMDB for movies matching a text query."""
    try:
        url = f"{TMDB_BASE_URL}/search/movie"
        params: Dict[str, Any] = {
            "query": query,
            "include_adult": "false",
            "language": "en-US",
            "page": "1",
        }
        if year:
            params["primary_release_year"] = str(year)

        data = await _safe_get(url, params)
        results = data.get("results", [])

        # If zero results with year filter, retry without year
        if not results and year:
            params.pop("primary_release_year", None)
            data = await _safe_get(url, params)
            results = data.get("results", [])

        movies = []
        for m in results[:6]:
            poster_path = m.get("poster_path")
            movies.append({
                "id": m.get("id"),
                "title": m.get("title"),
                "overview": m.get("overview"),
                "release_date": m.get("release_date"),
                "rating": round(float(m.get("vote_average", 0)), 1),
                "vote_count": m.get("vote_count", 0),
                "poster_url": f"{TMDB_IMAGE_BASE_URL}{poster_path}" if poster_path else None,
            })
        return movies
    except Exception as e:
        logger.error(f"Error in search_movies for '{query}': {e}")
        return []


async def discover_movies(
    genre: Optional[str] = None,
    year_gte: Optional[int] = None,
    year_lte: Optional[int] = None,
    min_rating: float = 6.0,
) -> List[Dict[str, Any]]:
    """Discover movies on TMDB based on genres, release dates, and ratings."""
    try:
        url = f"{TMDB_BASE_URL}/discover/movie"
        params: Dict[str, Any] = {
            "include_adult": "false",
            "include_video": "false",
            "language": "en-US",
            "page": "1",
            "sort_by": "popularity.desc",
            "vote_count.gte": "150",
            "vote_average.gte": str(min_rating),
        }

        if genre:
            clean_g = genre.lower().strip()
            genre_id = GENRE_MAP.get(clean_g)
            if genre_id:
                params["with_genres"] = str(genre_id)

        if year_gte:
            params["primary_release_date.gte"] = f"{year_gte}-01-01"
        if year_lte:
            params["primary_release_date.lte"] = f"{year_lte}-12-31"

        data = await _safe_get(url, params)
        results = data.get("results", [])

        movies = []
        for m in results[:6]:
            poster_path = m.get("poster_path")
            movies.append({
                "id": m.get("id"),
                "title": m.get("title"),
                "overview": m.get("overview"),
                "release_date": m.get("release_date"),
                "rating": round(float(m.get("vote_average", 0)), 1),
                "vote_count": m.get("vote_count", 0),
                "poster_url": f"{TMDB_IMAGE_BASE_URL}{poster_path}" if poster_path else None,
            })
        return movies
    except Exception as e:
        logger.error(f"Error discovering movies: {e}")
        return []


async def get_movie_details_and_extras(movie_id: int, region: str = "IN") -> Dict[str, Any]:
    """
    Fetch comprehensive details, YouTube trailer, and streaming providers in a SINGLE TMDB call
    using append_to_response=videos,watch/providers.
    Cached in memory to eliminate duplicate round trips.
    """
    cache_key = f"{movie_id}_{region}"
    if cache_key in _DETAILS_CACHE:
        return _DETAILS_CACHE[cache_key]

    try:
        # Single parallel call for details, trailers, and providers
        data = await _safe_get(
            f"{TMDB_BASE_URL}/movie/{movie_id}",
            {"append_to_response": "videos,watch/providers"}
        )

        if not data or "id" not in data:
            return {"id": movie_id, "error": "Movie not found"}

        # Extract videos / trailers
        videos = data.get("videos", {}).get("results", [])
        trailer_key = None
        for v in videos:
            if v.get("site") == "YouTube" and v.get("type") in ("Trailer", "Teaser"):
                trailer_key = v.get("key")
                if v.get("type") == "Trailer":
                    break

        # Extract region-aware providers (prefer requested region like 'IN', fallback to 'US')
        all_providers = data.get("watch/providers", {}).get("results", {})
        providers_data = all_providers.get(region) or all_providers.get("IN") or all_providers.get("US") or {}

        streaming = [p.get("provider_name") for p in providers_data.get("flatrate", [])]
        rent = [p.get("provider_name") for p in providers_data.get("rent", [])]

        poster_path = data.get("poster_path")
        backdrop_path = data.get("backdrop_path")

        result = {
            "id": movie_id,
            "title": data.get("title"),
            "tagline": data.get("tagline"),
            "overview": data.get("overview"),
            "runtime": data.get("runtime"),
            "release_date": data.get("release_date"),
            "rating": round(float(data.get("vote_average", 0)), 1),
            "genres": [g.get("name") for g in data.get("genres", [])],
            "poster_url": f"{TMDB_IMAGE_BASE_URL}{poster_path}" if poster_path else None,
            "backdrop_url": f"https://image.tmdb.org/t/p/w1280{backdrop_path}" if backdrop_path else None,
            "trailer_youtube_url": f"https://www.youtube.com/watch?v={trailer_key}" if trailer_key else None,
            "trailer_youtube_key": trailer_key,
            "streaming_providers": streaming,
            "rent_providers": rent,
        }

        # Cache result
        _DETAILS_CACHE[cache_key] = result
        return result
    except Exception as e:
        logger.error(f"Error fetching movie details for {movie_id}: {e}")
        return {"id": movie_id, "error": str(e)}
