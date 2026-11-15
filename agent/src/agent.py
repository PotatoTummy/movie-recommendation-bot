"""
LiveKit Voice AI Movie Recommendation Agent (CineBot)
Powered by:
- LiveKit Agents v1.8
- LLM: Grok (xAI) grok-2-latest
- STT: Deepgram Nova-2
- TTS: Deepgram Aura
- VAD: Silero VAD
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

logger = logging.getLogger("cinebot-agent")


class MovieTools:
    """Tools available to the LLM for TMDB search and discovery."""

    def __init__(self, room):
        self.room = room

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
        description="Search for movies by title or query string (e.g. 'Inception', 'The Dark Knight')."
    )
    async def search_movie(self, query: str, year: Optional[int] = None) -> str:
        """Search movies in TMDB database."""
        movies = await search_movies(query=query, year=year)
        await self._broadcast("MOVIE_SEARCH_RESULTS", {"query": query, "movies": movies})
        return json.dumps(movies)

    @function_tool(
        description="Discover movie recommendations by genre (e.g. 'sci-fi', 'thriller', 'horror', 'action', 'comedy', 'romance', 'drama'), release years, or minimum rating."
    )
    async def discover_movies_by_genre(
        self,
        genre: Optional[str] = None,
        year_gte: Optional[int] = None,
        year_lte: Optional[int] = None,
        min_rating: float = 6.5,
    ) -> str:
        """Discover movies matching specific criteria."""
        movies = await discover_movies(
            genre=genre,
            year_gte=year_gte,
            year_lte=year_lte,
            min_rating=min_rating,
        )
        await self._broadcast("MOVIE_RECOMMENDATIONS", {"genre": genre, "movies": movies})
        return json.dumps(movies)

    @function_tool(
        description="Get movie details including YouTube trailer and streaming providers (Netflix, Prime, Disney+) using the TMDB movie ID."
    )
    async def get_movie_extras(self, movie_id: int) -> str:
        """Fetch synopsis, trailers, and where to stream."""
        details = await get_movie_details_and_extras(movie_id=movie_id)
        await self._broadcast("MOVIE_DETAILS", details)
        return json.dumps(details)


async def entrypoint(ctx: JobContext):
    logger.info(f"Connecting to room: {ctx.room.name}")
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

    # Wait for the user participant to join
    participant = await ctx.wait_for_participant()
    logger.info(f"Started CineBot session for participant: {participant.identity}")

    # Initialize tools with room context for WebRTC data broadcasts
    movie_tools = MovieTools(room=ctx.room)
    tools = [
        movie_tools.search_movie,
        movie_tools.discover_movies_by_genre,
        movie_tools.get_movie_extras,
    ]

    # Flexible LLM provider resolution (Groq, OpenAI, or Grok/xAI)
    groq_key = os.environ.get("GROQ_API_KEY", "").strip()
    openai_key = os.environ.get("OPENAI_API_KEY", "").strip()
    grok_key = os.environ.get("GROK_API_KEY", "").strip() or os.environ.get("XAI_API_KEY", "").strip()

    if groq_key and not groq_key.startswith("your_"):
        logger.info("Configuring Groq LLM (openai/gpt-oss-120b)")
        llm = openai.LLM(
            base_url="https://api.groq.com/openai/v1",
            api_key=groq_key,
            model="openai/gpt-oss-120b",
            temperature=0.7,
        )
    elif openai_key and not openai_key.startswith("your_"):
        logger.info("Configuring OpenAI LLM (gpt-4o-mini)")
        llm = openai.LLM(
            api_key=openai_key,
            model="gpt-4o-mini",
            temperature=0.7,
        )
    elif grok_key and not grok_key.startswith("your_"):
        logger.info("Configuring Grok (xAI) LLM (grok-2-latest)")
        llm = openai.LLM.with_x_ai(
            api_key=grok_key,
            model="grok-2-latest",
            temperature=0.7,
        )
    else:
        raise ValueError("No valid LLM key found. Please set GROQ_API_KEY, OPENAI_API_KEY, or GROK_API_KEY in agent/.env")

    # Initialize Deepgram STT and TTS
    deepgram_key = os.environ.get("DEEPGRAM_API_KEY")
    stt = deepgram.STT(api_key=deepgram_key)
    tts = deepgram.TTS(api_key=deepgram_key, model="aura-asteria-en")

    # Initialize VAD
    vad = silero.VAD.load()

    # Create the agent session and agent instance
    session = AgentSession(
        stt=stt,
        vad=vad,
        llm=llm,
        tts=tts,
        min_endpointing_delay=0.4,
        max_endpointing_delay=1.2,
    )

    agent = Agent(
        instructions=AGENT_INSTRUCTIONS,
        tools=tools,
    )

    # Start the voice session inside the room with transcription and text enabled
    await session.start(
        agent,
        room=ctx.room,
        room_output_options=room_io.RoomOutputOptions(
            transcription_enabled=True,
            sync_transcription=True,
        ),
        room_input_options=room_io.RoomInputOptions(
            text_enabled=True,
        ),
    )

    async def broadcast_transcript(sender: str, text: str, is_final: bool):
        """Broadcast live transcript updates over the data channel."""
        if not ctx.room or not ctx.room.local_participant or not text.strip():
            return
        payload = json.dumps({
            "type": "TRANSCRIPT_UPDATE",
            "timestamp": int(time.time() * 1000),
            "data": {
                "id": str(int(time.time() * 1000)),
                "sender": sender,
                "text": text,
                "is_final": is_final,
            },
        })
        try:
            await ctx.room.local_participant.publish_data(
                payload.encode("utf-8"),
                topic="movie_data",
                reliable=True,
            )
        except Exception as e:
            logger.error(f"Error broadcasting transcript: {e}")

    @session.on("user_input_transcribed")
    def on_user_transcript(ev):
        if getattr(ev, "transcript", None):
            asyncio.create_task(broadcast_transcript("user", ev.transcript, ev.is_final))

    @session.on("conversation_item_added")
    def on_conversation_item(ev):
        if hasattr(ev, "item") and ev.item.role == "assistant":
            content = ""
            if isinstance(ev.item.content, str):
                content = ev.item.content
            elif isinstance(ev.item.content, list):
                content = " ".join([str(c) for c in ev.item.content])
            if content:
                asyncio.create_task(broadcast_transcript("agent", content, True))

    # Handle typed text input from frontend text box
    @ctx.room.on("data_received")
    def on_data_received(data_packet):
        if data_packet.topic == "movie_data":
            try:
                msg = json.loads(data_packet.data.decode("utf-8"))
                if msg.get("type") == "USER_TEXT_MESSAGE":
                    text = msg.get("text", "").strip()
                    if text:
                        logger.info(f"Received text prompt from user: {text}")
                        asyncio.create_task(broadcast_transcript("user", text, True))
                        session.generate_reply(user_input=text)
            except Exception as e:
                logger.error(f"Error handling user text message: {e}")

    # Give friendly spoken welcome to kick off conversation
    session.say(WELCOME_MESSAGE, allow_interruptions=True)


if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
        )
    )

