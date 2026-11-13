"""
TMDB (The Movie Database) API Client & Tools (Async via aiohttp)
Provides movie search, genre-based discovery, trailer fetching, and streaming provider lookups.
"""

import os
import logging
from typing import Optional, Dict, Any, List
from pathlib import Path
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
    "war": 10752,
    "western": 37,
}


def _get_headers() -> Dict[str, str]:
    """Retrieve auth headers using Read Access Token (v4) or API Key fallback."""
    token = os.environ.get("TMDB_READ_ACCESS_TOKEN", "").strip()
    headers = {
        "User-Agent": "MovieBot/1.0",
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


async def search_movies(query: str, year: Optional[int] = None) -> List[Dict[str, Any]]:
    """Search for movies by title or query string."""
    try:
        url = f"{TMDB_BASE_URL}/search/movie"
        params = _get_params({"query": query, "include_adult": "false", "page": "1"})
        if year:
            params["year"] = str(year)

        async with aiohttp.ClientSession(headers=_get_headers()) as session:
            async with session.get(url, params=params, timeout=aiohttp.ClientTimeout(total=6)) as resp:
                if resp.status != 200:
                    text = await resp.text()
                    logger.error(f"TMDB search failed ({resp.status}): {text}")
                    return []
                data = await resp.json()
                results = data.get("results", [])

        movies = []
        for m in results[:5]:
            poster_path = m.get("poster_path")
            movies.append({
                "id": m.get("id"),
                "title": m.get("title"),
                "overview": m.get("overview"),
                "release_date": m.get("release_date"),
                "rating": round(float(m.get("vote_average", 0)), 1),
                "vote_count": m.get("vote_count"),
                "poster_url": f"{TMDB_IMAGE_BASE_URL}{poster_path}" if poster_path else None,
            })
        return movies
    except Exception as e:
        logger.error(f"Error searching movies for '{query}': {e}")
        return []


async def discover_movies(
    genre: Optional[str] = None,
    year_gte: Optional[int] = None,
    year_lte: Optional[int] = None,
    min_rating: float = 6.5,
    sort_by: str = "popularity.desc",
) -> List[Dict[str, Any]]:
    """Discover movies filtered by genre, release timeframe, and rating."""
    try:
        url = f"{TMDB_BASE_URL}/discover/movie"
        params = _get_params({
            "include_adult": "false",
            "sort_by": sort_by,
            "vote_count.gte": "100",
            "vote_average.gte": str(min_rating),
            "page": "1",
        })

        if genre and genre.lower() in GENRE_MAP:
            params["with_genres"] = str(GENRE_MAP[genre.lower()])

        if year_gte:
            params["primary_release_date.gte"] = f"{year_gte}-01-01"
        if year_lte:
            params["primary_release_date.lte"] = f"{year_lte}-12-31"

        async with aiohttp.ClientSession(headers=_get_headers()) as session:
            async with session.get(url, params=params, timeout=aiohttp.ClientTimeout(total=6)) as resp:
                if resp.status != 200:
                    text = await resp.text()
                    logger.error(f"TMDB discover failed ({resp.status}): {text}")
                    return []
                data = await resp.json()
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
                "vote_count": m.get("vote_count"),
                "poster_url": f"{TMDB_IMAGE_BASE_URL}{poster_path}" if poster_path else None,
            })
        return movies
    except Exception as e:
        logger.error(f"Error discovering movies: {e}")
        return []


async def get_movie_details_and_extras(movie_id: int, region: str = "US") -> Dict[str, Any]:
    """Fetch comprehensive details, YouTube trailer, and streaming providers for a movie."""
    try:
        async with aiohttp.ClientSession(headers=_get_headers()) as session:
            # 1. Main details
            async with session.get(f"{TMDB_BASE_URL}/movie/{movie_id}", params=_get_params(), timeout=aiohttp.ClientTimeout(total=6)) as r1:
                details = await r1.json() if r1.status == 200 else {}

            # 2. Videos / Trailers
            async with session.get(f"{TMDB_BASE_URL}/movie/{movie_id}/videos", params=_get_params(), timeout=aiohttp.ClientTimeout(total=6)) as r2:
                videos = (await r2.json()).get("results", []) if r2.status == 200 else []

            # 3. Watch Providers
            async with session.get(f"{TMDB_BASE_URL}/movie/{movie_id}/watch/providers", params=_get_params(), timeout=aiohttp.ClientTimeout(total=6)) as r3:
                providers_raw = await r3.json() if r3.status == 200 else {}
                providers_data = providers_raw.get("results", {}).get(region, {})

        trailer_key = None
        for v in videos:
            if v.get("site") == "YouTube" and v.get("type") in ("Trailer", "Teaser"):
                trailer_key = v.get("key")
                if v.get("type") == "Trailer":
                    break

        streaming = [p.get("provider_name") for p in providers_data.get("flatrate", [])]
        rent = [p.get("provider_name") for p in providers_data.get("rent", [])]

        poster_path = details.get("poster_path")
        backdrop_path = details.get("backdrop_path")

        return {
            "id": movie_id,
            "title": details.get("title"),
            "tagline": details.get("tagline"),
            "overview": details.get("overview"),
            "runtime": details.get("runtime"),
            "release_date": details.get("release_date"),
            "rating": round(float(details.get("vote_average", 0)), 1),
            "genres": [g.get("name") for g in details.get("genres", [])],
            "poster_url": f"{TMDB_IMAGE_BASE_URL}{poster_path}" if poster_path else None,
            "backdrop_url": f"https://image.tmdb.org/t/p/w1280{backdrop_path}" if backdrop_path else None,
            "trailer_youtube_url": f"https://www.youtube.com/watch?v={trailer_key}" if trailer_key else None,
            "trailer_youtube_key": trailer_key,
            "streaming_providers": streaming,
            "rent_providers": rent,
        }
    except Exception as e:
        logger.error(f"Error fetching movie details for {movie_id}: {e}")
        return {"id": movie_id, "error": str(e)}
