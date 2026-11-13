# CineBot 🎬 — LiveKit Voice AI Movie Sommelier

A real-time, voice-interactive AI movie assistant built with **LiveKit WebRTC**, **Grok (xAI)**, **Deepgram (STT & TTS)**, and the **TMDB (The Movie Database) API**.

CineBot synchronizes sub-300ms spoken conversations with real-time UI updates: as the AI voice agent talks about a movie recommendation, the frontend instantly renders high-res movie posters, IMDb/TMDB ratings, trailers, and where to stream (Netflix, Prime Video, Apple TV, Disney+) over **WebRTC Data Channels**.

---

## Architecture Overview

```
                      ┌──────────────────────────────────────────────┐
                      │              LiveKit Cloud                   │
                      │          (Audio/Video + Data Rooms)          │
                      └───────────────▲───────────────▲──────────────┘
                                      │               │
                                Audio / WebRTC   Audio + Data Channel
                                      │               │
                                      ▼               ▼
┌──────────────────────────────────────┐   ┌────────────────────────────────────────┐
│     Next.js / React Frontend         │   │   LiveKit Python Agent Worker          │
│  - @livekit/components-react         │   │  - VAD: Silero                         │
│  - Live Audio Visualizer / Mic       │   │  - STT: Deepgram Nova-2                │
│  - Real-time Movie Carousel & Detail │   │  - LLM: Grok (xAI grok-2-latest)       │
│  - WebRTC Data Channel Listener      │   │  - TTS: Deepgram Aura                  │
└──────────────────────────────────────┘   │  - Tools: TMDB Search & Discovery      │
                                           └────────────────────────────────────────┘
```

---

## Project Structure

```
movie-recommendation-bot/
├── agent/                         # Python Backend Worker (livekit-agents 1.8)
│   ├── .venv/                     # Python virtual environment
│   ├── src/
│   │   ├── agent.py               # LiveKit entrypoint & voice session
│   │   ├── prompts.py             # Agent persona & instructions
│   │   └── tools/
│   │       ├── __init__.py
│   │       └── tmdb.py            # Async TMDB API client (search, discover, trailers)
│   ├── requirements.txt
│   └── .env
│
├── frontend/                      # Next.js 15 TypeScript App
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/token/route.ts # LiveKit room JWT minting
│   │   │   ├── page.tsx           # Cinema dashboard & hero
│   │   │   └── globals.css
│   │   ├── components/
│   │   │   ├── VoiceRoom.tsx      # LiveKit room manager & data channel handler
│   │   │   ├── MovieGrid.tsx      # Dynamic recommendation grid
│   │   │   ├── MovieCard.tsx      # Movie poster, ratings, action buttons
│   │   │   ├── TrailerModal.tsx   # YouTube trailer player
│   │   │   └── StreamingModal.tsx # Streaming provider badges
│   │   └── types/
│   │       └── movie.ts
│   ├── package.json
│   └── .env.local
│
├── PROJECT_RULES.md               # Senior architectural guidelines & contracts
└── README.md
```

---

## Quickstart Guide

### 1. Run the Python Agent Backend
Open your first terminal window:
```bash
cd agent
source .venv/bin/activate
python src/agent.py dev
```
You will see:
```
INFO:livekit.agents:registered worker with id: ...
INFO:livekit.agents:waiting for job assignments...
```

### 2. Run the Next.js Frontend
Open your second terminal window:
```bash
cd frontend
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### 3. Start Talking!
1. Click **"Start Voice Conversation"** and allow microphone access.
2. CineBot will greet you verbally.
3. Try saying:
   - *"I want a mind-bending sci-fi thriller like Interstellar."*
   - *"Recommend high-rated horror movies from 2024."*
   - *"Tell me about Inception and show me the trailer."*
   - *"Where can I stream Dune?"*
4. Watch the movie cards slide onto your screen in real time with YouTube trailers and streaming providers!
