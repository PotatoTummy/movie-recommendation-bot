# CineBot Project Overview & Architectural Reference (For Claude Redesign)

> **Purpose:** Use this document when feeding context to Claude (or Claude Projects) to redesign the CineBot frontend UI/UX without breaking the real-time LiveKit WebRTC backend or data channel contracts.

---

## 1. What is CineBot?

**CineBot** is a real-time, hands-free conversational AI Movie Sommelier.
- Users speak to CineBot via voice (WebRTC audio).
- CineBot speaks back in real time (<300ms latency) using **Deepgram STT**, **Groq/OpenAI LLM**, and **Deepgram Aura TTS**.
- **Crucial Feature:** While CineBot speaks verbally about movie recommendations, the backend simultaneously pushes structured movie data (posters, release dates, ratings, TMDB IDs, overviews) over a **WebRTC Data Channel**.
- The frontend dynamically updates to project movie posters, YouTube trailers, and streaming provider badges on screen in real time.

---

## 2. Architecture & Technology Stack

```
                             ┌───────────────────────────────────┐
                             │           LiveKit Cloud           │
                             │  (Audio + Data Channel Signaling) │
                             └───────────────▲───▲───────────────┘
                                             │   │
                         WebRTC Audio + Data │   │ WebRTC Audio + Data
                                             │   │
                                             ▼   ▼
┌──────────────────────────────────────┐       ┌──────────────────────────────────────┐
│       Frontend (Next.js 15)          │       │      Backend Worker (Python 3.11)    │
│ - React 19, TypeScript, Tailwind CSS │       │ - livekit-agents v1.8 (Voice Agent)  │
│ - @livekit/components-react          │       │ - VAD: Silero                        │
│ - livekit-client SDK                 │       │ - STT: Deepgram Nova-3               │
│ - Lucide Icons                       │       │ - LLM: Groq / OpenAI                 │
│ - In-memory API Rate Limiter         │       │ - TTS: Deepgram Aura                 │
│ - Themed Canvases (Easter Eggs)      │       │ - TMDB REST API Integration          │
└──────────────────────────────────────┘       └──────────────────────────────────────┘
```

---

## 3. How the Backend Works (`agent/`)

The backend is an autonomous LiveKit Agent worker (`agent/src/agent.py`):

1. **Worker Lifecycle:**
   - Connects to LiveKit Cloud rooms automatically when a user opens the web app.
   - Listens for the user's speech using **Silero VAD** (Voice Activity Detection).
   - Converts speech to text via **Deepgram Nova-3 STT**.
   - Streams conversational reasoning to **Groq / OpenAI LLM** with custom sommelier prompts (`agent/src/prompts.py`).
   - Converts response text to natural human voice using **Deepgram Aura TTS**.

2. **Function Tools (`agent/src/tools/tmdb.py`):**
   The LLM has access to Python function tools that call the TMDB (The Movie Database) API:
   - `recommend_movies_by_titles(titles: list[str])`: Looks up exact movie titles and broadcasts posters.
   - `discover_movies(genre, year_gte, year_lte, min_rating)`: Explores movies by criteria.
   - `search_movies(query, year)`: Direct search for actors, directors, franchises.
   - `get_movie_details_and_extras(movie_id)`: Fetches YouTube trailer keys and streaming availability (Netflix, Prime, Disney+).
   - `get_active_on_screen_movies()`: Resolves follow-ups like *"Who directed the second one?"* or *"Compare the first two films"*.

3. **Data Channel Event Broadcast (`topic: "movie_data"`):**
   When the agent fetches movies, it broadcasts JSON over LiveKit's reliable data channel:
   ```json
   {
     "type": "MOVIE_RECOMMENDATIONS",
     "timestamp": 1715000000000,
     "data": {
       "genre": "sci-fi",
       "movies": [
         {
           "id": 157336,
           "title": "Interstellar",
           "release_date": "2014-11-05",
           "rating": 8.4,
           "vote_count": 34890,
           "overview": "When Earth becomes uninhabitable...",
           "poster_url": "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg"
         }
       ]
     }
   }
   ```
   Event Types:
   - `MOVIE_RECOMMENDATIONS`: Pushes a list of movie objects.
   - `MOVIE_SEARCH_RESULTS`: Pushes search matches.
   - `MOVIE_DETAILS`: Pushes full movie details (overview, trailers, streaming providers).

4. **User Interruption Handling:**
   - If the user clicks **"Skip Scene"** in the UI, the frontend publishes `{ "type": "INTERRUPT_SPEECH" }` to topic `"movie_data"` or speaks, which immediately cuts the bot's speech output.

---

## 4. How the Frontend Works (`frontend/`)

1. **Authentication & Token Minting (`frontend/src/app/api/token/route.ts`):**
   - The client calls `GET /api/token?room=cinebot-xyz`.
   - Generates a short-lived LiveKit WebRTC Access Token JWT using `livekit-server-sdk`.
   - Protected with an in-memory sliding window rate limiter (max 6 sessions per 15 minutes per IP).

2. **Landing Page (`frontend/src/app/page.tsx`):**
   - Displays the Box Office / Marquee admission ticket.
   - Previews **Sommelier's Featured Showcase** (pre-loaded with 6 real TMDB titles).
   - Manages Easter Egg state, Secret Vault modal, and theme canvases.
   - Handles the `"PUNCH TICKET & ENTER AUDITORIUM"` connection trigger.

3. **Active Voice Room (`frontend/src/components/VoiceRoom.tsx`):**
   - Wraps the session inside `<LiveKitRoom audio={true} video={false}>`.
   - Listens to `RoomEvent.DataReceived` on topic `"movie_data"` to parse incoming movie recommendations.
   - Listens to `RoomEvent.TranscriptionReceived` to display the conversation subtitles.
   - Controls hardware microphone mute (`room.localParticipant.setMicrophoneEnabled(boolean)`).
   - Provides text input fallback for typing requests while muted.

4. **Display Components:**
   - `MovieGrid.tsx`: Displays the grid of recommendation cards.
   - `MovieCard.tsx`: Lobby card with poster, ordinal badge (`#1`, `#2`), rating star, synopsis, "Watch Trailer" and "Streaming" buttons.
   - `TrailerModal.tsx`: YouTube trailer player dialog.
   - `StreamingModal.tsx`: Lists flatrate (subscription) and rental platforms.

5. **Easter Egg System (`frontend/src/types/easterEggs.ts` & `EasterEggVaultModal.tsx`):**
   - 5 hidden cinematic themes: Matrix, Interstellar, Fight Club, Star Wars, The Godfather.
   - Accessible via keyboard triggers (desktop) AND interactive riddle solve inputs in the Vault Modal (mobile & desktop).
   - Canvas animations: `MatrixRainCanvas.tsx`, `InterstellarCanvas.tsx`, `StarWarsCrawl.tsx`.

---

## 5. Critical Contracts to PRESERVE During Redesign

When redesigning the UI in Claude, **DO NOT break these contracts**:
1. **LiveKit Room Lifecycle:** Keep `<LiveKitRoom>`, `<RoomAudioRenderer>`, and `useVoiceAssistant()`.
2. **Data Channel Topic:** Must remain `topic: "movie_data"`.
3. **Data Channel Event Structure:** The frontend must continue handling `{ type: "MOVIE_RECOMMENDATIONS" | "MOVIE_SEARCH_RESULTS" | "MOVIE_DETAILS", data: ... }`.
4. **Token Fetch Endpoint:** `GET /api/token?room=${roomName}` returning `{ token, url }`.
5. **Microphone Toggle Method:** Use `room.localParticipant.setMicrophoneEnabled(boolean)` to ensure hardware mic access is actually cut.

---

## 6. What Can Be Redesigned & Reimagined

- **Visual Theme & Aesthetic:** Modern neo-noir, luxurious vintage IMAX theater, retro art-house cinema, minimal A24/Criterion editorial style, cyberpunk neon theater, etc.
- **Auditorium / Stage Layout:** How the movie cards, active recommendations, trailers, and subtitles are arranged.
- **Audio Visualizer & Voice HUD:** Waveforms, circular audio rings, vintage VU meters, floating soundstage bubbles.
- **Micro-interactions & Animations:** Card flip animations, ticket tear animations, modal transitions, hover poster spotlights.
- **Mobile Experience:** Bottom sheets, swipeable movie carousels, tactile audio controls.
