"""
LiveKit Voice AI Movie Recommendation Agent (Flicker)
Powered by:
- LiveKit Agents v1.8
- LLM: Groq (llama-3.3-70b-versatile) / OpenAI fallback
- STT: Deepgram Nova-3
- TTS: Deepgram Aura
- VAD: Silero VAD (tuned for natural conversational pauses)
- Real-time WebRTC Data Channel synchronizer for dynamic UI updates
"""

import asyncio
import json
import logging
import os
import sys
import time
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv

# Ensure local package resolution
sys.path.append(str(Path(__file__).resolve().parent))

# Robustly load .env
env_file = Path(__file__).resolve().parents[1] / ".env"
if env_file.exists():
    load_dotenv(dotenv_path=env_file)
else:
    load_dotenv()

from livekit.agents import (
    AutoSubscribe,
    JobContext,
    WorkerOptions,
    cli,
    function_tool,
    room_io,
)
from livekit.agents.voice import Agent, AgentSession
from livekit.plugins import deepgram, openai, silero

from prompts import AGENT_INSTRUCTIONS, WELCOME_MESSAGE
from tools.tmdb import (
    discover_movies,
    get_movie_details_and_extras,
    search_movies,
)

logger = logging.getLogger("flicker-agent")


class MovieTools:
    """Tools available to the LLM for TMDB search and discovery."""

    def __init__(self, room):
        self.room = room
        self.active_movies: list[dict] = []

    def _format_active_summary(self, movies: list[dict]) -> str:
        """Format movies with explicit ordinal positions (#1, #2, etc.) for referential grounding."""
        ordinals = ["first", "second", "third", "fourth", "fifth", "sixth"]
        summary = []
        for i, m in enumerate(movies[:6]):
            summary.append({
                "position": i + 1,
                "ordinal": ordinals[i] if i < len(ordinals) else f"#{i+1}",
                "title": m.get("title"),
                "release_year": (m.get("release_date") or "").split("-")[0],
                "rating": m.get("rating"),
                "tmdb_id": m.get("id"),
                "overview": m.get("overview"),
            })
        return json.dumps(summary)

    async def _broadcast(self, event_type: str, data: dict):
        """Broadcast structured movie events over LiveKit data channel."""
        if not self.room or not self.room.local_participant:
            return
        payload = json.dumps({
            "type": event_type,
            "timestamp": int(time.time() * 1000),
            "data": data,
        })
        try:
            await self.room.local_participant.publish_data(
                payload.encode("utf-8"),
                topic="movie_data",
                reliable=True,
            )
            logger.info(f"Broadcasted '{event_type}' on topic 'movie_data'")
        except Exception as e:
            logger.error(f"Failed to broadcast data channel event: {e}")

    @function_tool(
        description="Recommend a specific curated list of movies by title (e.g. titles=['Enthiran', 'Ra.One', '2.0'] or titles=['Blade Runner 2049', 'Solaris', 'Under the Skin']). Call this ONCE after the user has completely finished speaking so matching posters land on screen."
    )
    async def recommend_movies_by_titles(self, titles: list[str]) -> str:
        """Fetch and display movie cards for specific titles chosen by the sommelier."""
        curated_movies = []
        for title in titles[:6]:
            results = await search_movies(query=title.strip())
            if results:
                curated_movies.append(results[0])
        if curated_movies:
            self.active_movies = curated_movies
            await self._broadcast("MOVIE_RECOMMENDATIONS", {
                "genre": "Curated Selection",
                "movies": curated_movies,
            })
            return self._format_active_summary(curated_movies)
        return json.dumps([])

    @function_tool(
        description="Discover movie recommendations by genre (e.g. 'sci-fi', 'thriller', 'neo-noir', 'horror', 'action', 'comedy', 'romance', 'drama'), release years, or minimum rating."
    )
    async def discover_movies(
        self,
        genre: Optional[str] = None,
        year_gte: Optional[int] = None,
        year_lte: Optional[int] = None,
        min_rating: float = 6.0,
    ) -> str:
        """Discover movies matching specific criteria."""
        clean_genre = (genre or "").lower().strip()
        if "noir" in clean_genre:
            clean_genre = "neo noir"
        movies = await discover_movies(
            genre=clean_genre if clean_genre else genre,
            year_gte=year_gte,
            year_lte=year_lte,
            min_rating=min_rating,
        )
        if movies:
            self.active_movies = movies
            await self._broadcast("MOVIE_RECOMMENDATIONS", {"genre": genre or "curated", "movies": movies})
            return self._format_active_summary(movies)
        return json.dumps([])

    @function_tool(
        description="Search for movies by specific title, director, or query string (e.g. 'Inception', 'The Dark Knight', 'Blade Runner')."
    )
    async def search_movies(self, query: str, year: Optional[int] = None) -> str:
        """Search movies in TMDB database."""
        movies = await search_movies(query=query, year=year)
        if movies:
            self.active_movies = movies
            await self._broadcast("MOVIE_SEARCH_RESULTS", {"query": query, "movies": movies})
            return self._format_active_summary(movies)
        return json.dumps([])

    @function_tool(
        description="Get movie details including YouTube trailer and streaming providers (Netflix, Prime, Disney+, JioCinema) using the TMDB movie ID."
    )
    async def get_movie_details_and_extras(self, movie_id: int) -> str:
        """Fetch synopsis, trailers, and where to stream in India/US."""
        details = await get_movie_details_and_extras(movie_id=movie_id, region="IN")
        await self._broadcast("MOVIE_DETAILS", details)
        return json.dumps(details)

    @function_tool(
        description="Get the list of movies currently on the user's shelf when the user asks follow-up questions (e.g. 'What was the first movie again?', 'Which movies are currently on my screen?')."
    )
    async def get_active_on_screen_movies(self) -> str:
        """Fetch active recommendations currently visible on screen."""
        if not self.active_movies:
            return "No movies currently on screen."
        return self._format_active_summary(self.active_movies)


async def entrypoint(ctx: JobContext):
    logger.info(f"Connecting to room: {ctx.room.name}")
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

    # Wait for the user participant to join
    participant = await ctx.wait_for_participant()
    logger.info(f"Started Flicker session for participant: {participant.identity}")

    # Initialize tools with room context for WebRTC data broadcasts
    movie_tools = MovieTools(room=ctx.room)
    tools = [
        movie_tools.recommend_movies_by_titles,
        movie_tools.discover_movies,
        movie_tools.search_movies,
        movie_tools.get_movie_details_and_extras,
        movie_tools.get_active_on_screen_movies,
    ]

    # Flexible ultra-fast LLM provider resolution (prefer llama-3.3-70b-versatile on Groq for 300+ tok/s speed)
    groq_key = os.environ.get("GROQ_API_KEY", "").strip()
    openai_key = os.environ.get("OPENAI_API_KEY", "").strip()

    if groq_key and not groq_key.startswith("your_"):
        logger.info("Configuring Groq LLM (llama-3.3-70b-versatile for ultra-low latency)")
        llm = openai.LLM(
            base_url="https://api.groq.com/openai/v1",
            api_key=groq_key,
            model="llama-3.3-70b-versatile",
            temperature=0.6,
        )
    elif openai_key and not openai_key.startswith("your_"):
        logger.info("Configuring OpenAI LLM (gpt-4o-mini)")
        llm = openai.LLM(
            api_key=openai_key,
            model="gpt-4o-mini",
            temperature=0.6,
        )
    else:
        raise ValueError("No valid LLM key found. Please set GROQ_API_KEY or OPENAI_API_KEY in agent/.env")

    # Initialize Deepgram STT and TTS
    deepgram_key = os.environ.get("DEEPGRAM_API_KEY")
    stt = deepgram.STT(api_key=deepgram_key)
    tts = deepgram.TTS(api_key=deepgram_key, model="aura-asteria-en")

    # Initialize Silero VAD tuned for natural conversational speech
    # min_silence_duration=0.85 ensures short thinking pauses in speech don't prematurely trigger an interruption
    vad = silero.VAD.load(
        min_speech_duration=0.25,
        min_silence_duration=0.85,
    )

    # Session with generous endpointing delays so the user isn't cut off mid-thought
    session = AgentSession(
        stt=stt,
        vad=vad,
        llm=llm,
        tts=tts,
        min_endpointing_delay=0.85,
        max_endpointing_delay=2.5,
    )

    agent = Agent(
        instructions=AGENT_INSTRUCTIONS,
        tools=tools,
    )

    # Start the voice session inside the room
    await session.start(
        agent,
        room=ctx.room,
        room_options=room_io.RoomOptions(
            text_input=True,
            text_output=True,
            close_on_disconnect=False,
        ),
    )

    # Handle typed text input and skip signals from frontend
    @ctx.room.on("data_received")
    def on_data_received(data_packet):
        if data_packet.topic == "movie_data":
            try:
                msg = json.loads(data_packet.data.decode("utf-8"))
                if msg.get("type") == "USER_TEXT_MESSAGE":
                    text = msg.get("text", "").strip()
                    if text:
                        logger.info(f"Received text prompt from user: {text}")
                        session.generate_reply(user_input=text)
                elif msg.get("type") == "INTERRUPT_SPEECH":
                    logger.info("Received interrupt/skip signal from user")
                    session.interrupt(force=True)
            except Exception as e:
                logger.error(f"Error handling data channel message: {e}")

    # Friendly spoken welcome
    session.say(WELCOME_MESSAGE, allow_interruptions=True)


if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
        )
    )
