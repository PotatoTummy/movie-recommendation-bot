# PROJECT RULES & ARCHITECTURAL GUIDELINES
**Project:** LiveKit Voice Movie Recommendation Bot
**Standard:** Senior System Designer & Production-Ready Standards

All development in this repository must strictly adhere to the following rules:

---

## 1. Monorepo & Folder Boundaries
* **Strict Separation of Concerns:**
  - `agent/`: Dedicated exclusively to the Python LiveKit voice worker, AI model orchestration (STT/LLM/TTS), and backend tools (TMDB). Never mix JavaScript/TypeScript or frontend assets here.
  - `frontend/`: Dedicated exclusively to the Next.js React client, WebRTC media rendering, audio visualization, and UI components. Never execute direct database/backend agent logic here.
* **No Cross-Directory Pollution:**
  - `agent/` manages its own isolated virtual environment (`.venv`) and `requirements.txt`.
  - `frontend/` manages its own `package.json` and `node_modules`.
  - Shared protocols (such as WebRTC Data Channel JSON message contracts) must be explicitly typed in both TypeScript and Python data models.

---

## 2. Security & Secrets Management
* **Zero Secrets in Version Control:**
  - NEVER commit `.env`, `.env.local`, API keys, or private tokens to Git.
  - Always maintain updated `.env.example` templates with descriptive dummy values.
  - Verify `.gitignore` covers all sensitive files before any commit.
* **Client vs Server Key Exposure:**
  - Secrets like `LIVEKIT_API_SECRET`, `TMDB_API_KEY` (if used server-side), and `OPENAI_API_KEY` must NEVER be exposed to client-side frontend code (never prefix with `NEXT_PUBLIC_`).
  - The frontend only receives an ephemeral JWT room token minted by the Next.js API route (`/api/token`).

---

## 3. Communication Protocol (LiveKit WebRTC & Data Channel)
* **Real-time Synchronization:**
  - When the AI agent recommends a movie verbally, it MUST simultaneously publish a typed event over the LiveKit Room Data Channel with the topic `movie_data`.
  - The payload must adhere to a standardized JSON schema:
    ```json
    {
      "type": "MOVIE_RECOMMENDATION" | "NOW_PLAYING_TRAILER" | "STREAMING_INFO",
      "timestamp": 1234567890,
      "data": { ... }
    }
    ```
* **Graceful Degradation:**
  - If a network drop or WebRTC data packet is dropped, the UI must handle missing poster URLs, empty trailer arrays, or unverified providers without crashing.

---

## 4. Code Quality & Engineering Standards
* **Python (`agent/`):**
  - Python 3.10+ modern syntax (type hints, `asyncio`, Pydantic models for structured output).
  - Proper error handling and logging (using Python's `logging` module, not raw `print` statements).
  - Explicit function calling docstrings so LLMs can invoke TMDB tools accurately.
* **TypeScript & React (`frontend/`):**
  - Strict TypeScript mode enabled; no implicit `any`.
  - Clean modular components (SRP: Single Responsibility Principle).
  - Accessible UI with proper ARIA attributes, semantic HTML, and responsive design (Tailwind CSS).
  - Graceful audio state handling (mic permissions, autoplay policy handling, connection states).

---

## 5. Git & Version Control Hygiene
* Clean, atomic commit messages following conventional commits:
  - `feat(agent): ...`
  - `feat(frontend): ...`
  - `fix(tmdb): ...`
  - `chore: ...`

