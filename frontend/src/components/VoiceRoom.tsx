"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useVoiceAssistant,
  useRoomContext,
} from "@livekit/components-react";
import { RoomEvent } from "livekit-client";
import { MovieItem, MovieDetails } from "@/types/movie";
import { PREMIERE_SHOWCASE } from "@/data/premiereMovies";
import { EASTER_EGG_TRIGGERS } from "@/types/easterEggs";
import { MovieGrid } from "./MovieGrid";
import { TrailerModal } from "./TrailerModal";
import { StreamingModal } from "./StreamingModal";
import { EasterEggHintsDrawer } from "./EasterEggHintsDrawer";

interface LogItem {
  id: string;
  sender: "you" | "bot";
  text: string;
  isFinal: boolean;
}

interface VoiceRoomProps {
  token: string | null;
  serverUrl: string | null;
  isConnecting: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

/** FormattedText: Converts markdown asterisks (**bold**, ***bold-italic***) into real HTML strong/em tags */
function FormattedText({ text }: { text: string }) {
  const parts = text.split(/(\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return (
    <span>
      {parts.map((part, i) => {
        if (part.startsWith("***") && part.endsWith("***")) {
          return (
            <strong key={i} className="font-bold italic text-[var(--ink)]">
              {part.slice(3, -3)}
            </strong>
          );
        }
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={i} className="font-bold text-[var(--ink)]">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith("*") && part.endsWith("*")) {
          return (
            <em key={i} className="italic">
              {part.slice(1, -1)}
            </em>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}

export function VoiceRoom({
  token,
  serverUrl,
  isConnecting,
  onConnect,
  onDisconnect,
}: VoiceRoomProps) {
  if (token && serverUrl) {
    return (
      <LiveKitRoom
        token={token}
        serverUrl={serverUrl}
        connect={true}
        audio={true}
        video={false}
        onDisconnected={onDisconnect}
        className="contents"
      >
        <RoomAudioRenderer />
        <VoiceRoomInner
          isConnected={true}
          isConnecting={false}
          onConnect={onConnect}
          onDisconnect={onDisconnect}
        />
      </LiveKitRoom>
    );
  }

  return (
    <VoiceRoomInner
      isConnected={false}
      isConnecting={isConnecting}
      onConnect={onConnect}
      onDisconnect={onDisconnect}
    />
  );
}

function VoiceRoomInner({
  isConnected,
  isConnecting,
  onConnect,
  onDisconnect,
}: {
  isConnected: boolean;
  isConnecting: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}) {
  let room: any = null;
  let voiceAssistant: any = null;
  try {
    room = useRoomContext();
    voiceAssistant = useVoiceAssistant();
  } catch {}

  const agentState = voiceAssistant?.state || "disconnected";
  const [isMicOn, setIsMicOn] = useState<boolean>(true);
  const [isUserSpeaking, setIsUserSpeaking] = useState<boolean>(false);
  const [movies, setMovies] = useState<MovieItem[]>(PREMIERE_SHOWCASE);
  const [shelfCount, setShelfCount] = useState<string>("6 films, in the order I mention them");
  const [logItems, setLogItems] = useState<LogItem[]>([
    {
      id: "seed-1",
      sender: "you",
      text: "Try: “Something slow and strange, like Blade Runner.”",
      isFinal: true,
    },
  ]);
  const [typedInput, setTypedInput] = useState<string>("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isToastVisible, setIsToastVisible] = useState<boolean>(false);
  const [foundThemes, setFoundThemes] = useState<Set<string>>(new Set());
  const [isHintsOpen, setIsHintsOpen] = useState<boolean>(false);

  // Modals / Drawers
  const [activeTrailer, setActiveTrailer] = useState<{ key: string; title: string } | null>(null);
  const [activeDetails, setActiveDetails] = useState<MovieDetails | null>(null);

  // Meter Waveform State (48 bars)
  const [meterHeights, setMeterHeights] = useState<number[]>(() => new Array(48).fill(4));
  const meterIntervalRef = useRef<any>(null);

  // Load unlocked themes from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("flicker_found_themes");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setFoundThemes(new Set(parsed));
        }
      }
    } catch {}
  }, []);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setIsToastVisible(true);
    setTimeout(() => {
      setIsToastVisible(false);
    }, 2800);
  }, []);

  // Easter Egg Trigger Check
  const checkEasterEgg = useCallback(
    (raw: string) => {
      const q = raw.toLowerCase().trim();
      if (!q) return false;

      if (q === "reset") {
        delete document.documentElement.dataset.egg;
        showToast("Default theme restored");
        return true;
      }

      for (const t of EASTER_EGG_TRIGGERS) {
        if (q.includes(t.key)) {
          document.documentElement.dataset.egg = t.id;
          setFoundThemes((prev) => {
            const next = new Set(prev);
            next.add(t.id);
            try {
              localStorage.setItem("flicker_found_themes", JSON.stringify([...next]));
            } catch {}
            return next;
          });
          showToast(`${t.name} theme awakened`);
          return true;
        }
      }
      return false;
    },
    [showToast]
  );

  const handleSelectTheme = (id: string | null) => {
    if (!id) {
      delete document.documentElement.dataset.egg;
      showToast("Default theme restored");
    } else {
      document.documentElement.dataset.egg = id;
      showToast(`${id.toUpperCase()} theme active`);
    }
  };

  // Sync Hardware Microphone state
  useEffect(() => {
    if (!room?.localParticipant) return;
    setIsMicOn(room.localParticipant.isMicrophoneEnabled);

    const updateMicState = () => {
      if (room?.localParticipant) {
        setIsMicOn(room.localParticipant.isMicrophoneEnabled);
      }
    };

    room.on(RoomEvent.LocalTrackPublished, updateMicState);
    room.on(RoomEvent.LocalTrackUnpublished, updateMicState);
    room.on(RoomEvent.TrackMuted, updateMicState);
    room.on(RoomEvent.TrackUnmuted, updateMicState);

    return () => {
      room.off(RoomEvent.LocalTrackPublished, updateMicState);
      room.off(RoomEvent.LocalTrackUnpublished, updateMicState);
      room.off(RoomEvent.TrackMuted, updateMicState);
      room.off(RoomEvent.TrackUnmuted, updateMicState);
    };
  }, [room]);

  // Handle LiveKit Data Channel Events & Subtitles
  useEffect(() => {
    if (!room) return;

    const handleDataReceived = (payload: Uint8Array, participant: any, kind: any, topic?: string) => {
      if (topic && topic !== "movie_data") return;
      try {
        const raw = new TextDecoder().decode(payload);
        const event = JSON.parse(raw);

        if (event.type === "MOVIE_RECOMMENDATIONS" || event.type === "MOVIE_SEARCH_RESULTS") {
          const incoming: MovieItem[] = event.data?.movies || [];
          if (incoming.length > 0) {
            setMovies(incoming);
            setShelfCount(
              `${incoming.length} ${incoming.length === 1 ? "film" : "films"}, in the order I mention them`
            );
          }
        } else if (event.type === "MOVIE_DETAILS") {
          setActiveDetails(event.data);
        }
      } catch (err) {
        console.error("Failed to parse data channel message:", err);
      }
    };

    const handleTranscription = (transcriptions: any[]) => {
      transcriptions.forEach((trans) => {
        const text = trans.text.trim();
        if (!text) return;
        const isAgent = trans.participantIdentity !== room.localParticipant.identity;

        // Track active user speaking state
        if (!isAgent && !trans.final) {
          setIsUserSpeaking(true);
        } else if (!isAgent && trans.final) {
          setTimeout(() => setIsUserSpeaking(false), 500);
        }

        // Check for easter eggs in final speech transcription
        if (trans.final) {
          checkEasterEgg(text);
        }

        const sender: "you" | "bot" = isAgent ? "bot" : "you";

        setLogItems((prev) => {
          const existing = prev.find((m) => m.id === trans.id);
          if (existing) {
            return prev.map((m) => (m.id === trans.id ? { ...m, text, isFinal: trans.final } : m));
          }
          return [...prev, { id: trans.id, sender, text, isFinal: trans.final }].slice(-10);
        });
      });
    };

    room.on(RoomEvent.DataReceived, handleDataReceived);
    room.on(RoomEvent.TranscriptionReceived, handleTranscription);

    return () => {
      room.off(RoomEvent.DataReceived, handleDataReceived);
      room.off(RoomEvent.TranscriptionReceived, handleTranscription);
    };
  }, [room, checkEasterEgg]);

  // Waveform Meter strictly moves ONLY when someone is ACTUALLY speaking!
  useEffect(() => {
    // If mic is muted AND bot is not speaking, waveform MUST be 100% flat (4px)!
    const isBotSpeaking = agentState === "speaking";
    const isUserActuallySpeaking = isMicOn && isUserSpeaking;
    const isActivelyTalking = isBotSpeaking || isUserActuallySpeaking;

    const reducedMotion =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!isActivelyTalking || reducedMotion) {
      clearInterval(meterIntervalRef.current);
      setMeterHeights(new Array(48).fill(4));
      return;
    }

    // Only animate bars while sound is actively being emitted
    meterIntervalRef.current = setInterval(() => {
      setMeterHeights(new Array(48).fill(0).map(() => 4 + Math.random() * 42));
    }, 100);

    return () => clearInterval(meterIntervalRef.current);
  }, [agentState, isMicOn, isUserSpeaking]);

  // Toggle Microphone Hardware Access
  const handleToggleMic = async () => {
    if (!isConnected) {
      onConnect();
      return;
    }
    if (!room?.localParticipant) return;
    const target = !isMicOn;
    try {
      await room.localParticipant.setMicrophoneEnabled(target);
      setIsMicOn(target);
      if (!target) {
        setIsUserSpeaking(false);
      }
    } catch (err) {
      console.error("Failed to toggle microphone:", err);
    }
  };

  // Publish INTERRUPT_SPEECH
  const handleSkipSpeech = async () => {
    if (!room?.localParticipant) return;
    try {
      const payload = JSON.stringify({
        type: "INTERRUPT_SPEECH",
        timestamp: Date.now(),
      });
      await room.localParticipant.publishData(new TextEncoder().encode(payload), {
        reliable: true,
        topic: "movie_data",
      });
    } catch (err) {
      console.error("Error sending interrupt:", err);
    }
  };

  // Send Typed Request
  const handleSendText = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = typedInput.trim();
    if (!query) return;

    // Check Easter Egg
    const eggMatched = checkEasterEgg(query);
    setTypedInput("");

    // Add to log
    setLogItems((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        sender: "you",
        text: query,
        isFinal: true,
      },
    ]);

    if (eggMatched) return;

    if (!isConnected) {
      onConnect();
      return;
    }

    if (room?.localParticipant) {
      try {
        const payload = JSON.stringify({
          type: "USER_TEXT_MESSAGE",
          text: query,
          timestamp: Date.now(),
        });
        await room.localParticipant.publishData(new TextEncoder().encode(payload), {
          reliable: true,
          topic: "movie_data",
        });
      } catch (err) {
        console.error("Failed to publish text query:", err);
      }
    }
  };

  // Fetch Trailer Modal
  const handleWatchTrailer = async (movieId: number, title: string) => {
    try {
      const res = await fetch(
        `https://api.themoviedb.org/3/movie/${movieId}/videos?api_key=48e9c4038a834223ba99f7d2be73eb8b`
      );
      if (res.ok) {
        const data = await res.json();
        const trailer = (data.results || []).find(
          (v: any) => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser")
        );
        if (trailer) {
          setActiveTrailer({ key: trailer.key, title });
        } else {
          showToast(`No trailer available for ${title}`);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch Streaming Modal
  const handleCheckProviders = async (movieId: number) => {
    try {
      const res = await fetch(
        `https://api.themoviedb.org/3/movie/${movieId}/watch/providers?api_key=48e9c4038a834223ba99f7d2be73eb8b`
      );
      const detailsRes = await fetch(
        `https://api.themoviedb.org/3/movie/${movieId}?api_key=48e9c4038a834223ba99f7d2be73eb8b`
      );
      if (res.ok && detailsRes.ok) {
        const pData = await res.json();
        const dData = await detailsRes.json();
        const inResults = pData.results?.IN || pData.results?.US || {};
        setActiveDetails({
          id: movieId,
          title: dData.title,
          overview: dData.overview,
          release_date: dData.release_date,
          rating: dData.vote_average,
          genres: (dData.genres || []).map((g: any) => g.name),
          poster_url: dData.poster_path ? `https://image.tmdb.org/t/p/w500${dData.poster_path}` : null,
          backdrop_url: dData.backdrop_path ? `https://image.tmdb.org/t/p/w1280${dData.backdrop_path}` : null,
          trailer_youtube_url: null,
          trailer_youtube_key: null,
          streaming_providers: (inResults.flatrate || []).map((p: any) => p.provider_name),
          rent_providers: (inResults.rent || []).map((p: any) => p.provider_name),
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const micButtonLabel = !isConnected
    ? isConnecting
      ? "Connecting..."
      : "Start talking"
    : isMicOn
    ? "Mute mic"
    : "Unmute mic";

  const isSpeaking = agentState === "speaking";

  return (
    <div className="min-h-screen flex flex-col justify-between">
      {/* Header */}
      <header className="flex justify-between items-baseline px-4 sm:px-8 lg:px-12 py-5">
        <span className="font-display text-3xl sm:text-4xl tracking-tight leading-none">
          Flicker
        </span>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setIsHintsOpen(true)}
            className="border-b-2 border-[var(--ink)] pb-0.5 text-sm font-medium hover:text-[var(--hot)] hover:border-[var(--hot)] transition cursor-pointer"
            aria-label="Hidden themes found"
          >
            Hidden themes: {foundThemes.size} of 5
          </button>
          {isConnected && (
            <button
              type="button"
              onClick={onDisconnect}
              className="text-sm font-medium border-b-2 border-[var(--hot)] text-[var(--hot)] pb-0.5 hover:opacity-75 transition cursor-pointer"
            >
              Disconnect
            </button>
          )}
        </div>
      </header>

      {/* Main Grid: 2 Columns on Desktop, 1 Column on Mobile */}
      <main className="grid grid-cols-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-8 lg:gap-14 px-4 sm:px-8 lg:px-12 py-4 pb-28 lg:pb-16 items-start flex-1">
        {/* Left Column: Conversation */}
        <section aria-label="Conversation" className="flex flex-col">
          <h1 className="font-display text-5xl sm:text-7xl lg:text-8xl leading-[0.88] tracking-tight mb-5">
            Say what<span className="headline-stroke">you’re in the mood for.</span>
          </h1>

          <p className="text-base sm:text-lg max-w-[34ch] mb-8 opacity-85 leading-relaxed">
            Talk to Flicker like a friend behind the video-store counter. Posters land on the shelf as it answers.
          </p>

          {/* Talk Row (Mic Button + Live Waveform Meter + Skip Button) */}
          <div className="flex items-center gap-4 mb-6">
            <button
              type="button"
              onClick={handleToggleMic}
              aria-pressed={isConnected && isMicOn}
              className={`rounded-full px-6 py-3.5 font-bold text-base transition-colors cursor-pointer select-none shrink-0 ${
                isConnected && isMicOn
                  ? "bg-[var(--hot)] text-white"
                  : "bg-[var(--ink)] text-[var(--paper)]"
              }`}
            >
              {micButtonLabel}
            </button>

            {/* Skip Button (active when bot speaks) */}
            {isSpeaking && (
              <button
                type="button"
                onClick={handleSkipSpeech}
                className="border-2 border-[var(--ink)] rounded-full px-4 py-3 font-bold text-sm hover:bg-[var(--wash)] transition cursor-pointer shrink-0"
              >
                Skip
              </button>
            )}

            {/* 48-bar Live Waveform Meter */}
            <div className="flex items-center gap-[3px] h-12 flex-1" aria-hidden="true">
              {meterHeights.map((h, i) => (
                <i
                  key={i}
                  style={{ height: `${h}px` }}
                  className="flex-1 min-w-[2px] max-w-[6px] bg-[var(--ink)] transition-[height] duration-100 ease-out"
                />
              ))}
            </div>
          </div>

          {/* Subtitle Log (aria-live="polite") with Bold Markdown Parser */}
          <div
            className="min-h-[9rem] border-l-4 border-[var(--hot)] pl-4 mb-6 space-y-3"
            aria-live="polite"
          >
            {logItems.map((item) => (
              <p
                key={item.id}
                className={`max-w-[42ch] transition-opacity leading-relaxed ${
                  item.sender === "you"
                    ? "opacity-65 text-base"
                    : "font-medium text-lg sm:text-xl leading-snug"
                }`}
              >
                <FormattedText text={item.text} />
              </p>
            ))}
          </div>

          {/* Desktop Type Request Form */}
          <form onSubmit={handleSendText} className="hidden lg:flex gap-2">
            <input
              type="text"
              value={typedInput}
              onChange={(e) => setTypedInput(e.target.value)}
              placeholder="Or type a request here"
              className="flex-1 bg-transparent border-0 border-b-2 border-[var(--ink)] py-2.5 px-0 placeholder:opacity-55 focus:outline-none"
              autoComplete="off"
              aria-label="Type a request"
            />
            <button
              type="submit"
              className="border-2 border-[var(--ink)] rounded-full px-5 py-2 text-sm font-bold hover:bg-[var(--wash)] transition cursor-pointer"
            >
              Send
            </button>
          </form>
        </section>

        {/* Right Column: On The Shelf */}
        <section aria-label="Recommendations" className="w-full">
          <MovieGrid
            movies={movies}
            title="On the shelf"
            countLabel={shelfCount}
            onWatchTrailer={handleWatchTrailer}
            onCheckProviders={handleCheckProviders}
          />
        </section>
      </main>

      {/* Mobile Pinned Bottom Bar: Mic & Form pinned at bottom on screens <860px */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--paper)]/95 backdrop-blur-md px-4 py-3 border-t-2 border-[var(--ink)]">
        <form onSubmit={handleSendText} className="flex gap-2 items-center">
          <button
            type="button"
            onClick={handleToggleMic}
            aria-pressed={isConnected && isMicOn}
            className={`rounded-full px-4 py-2 font-bold text-xs sm:text-sm shrink-0 transition-colors ${
              isConnected && isMicOn
                ? "bg-[var(--hot)] text-white"
                : "bg-[var(--ink)] text-[var(--paper)]"
            }`}
          >
            {isConnected ? (isMicOn ? "Mute" : "Unmute") : "Talk"}
          </button>
          {isSpeaking && (
            <button
              type="button"
              onClick={handleSkipSpeech}
              className="border border-[var(--ink)] rounded-full px-3 py-2 text-xs font-bold hover:bg-[var(--wash)]"
            >
              Skip
            </button>
          )}
          <input
            type="text"
            value={typedInput}
            onChange={(e) => setTypedInput(e.target.value)}
            placeholder="Type a request..."
            className="flex-1 min-w-0 bg-transparent border-0 border-b-2 border-[var(--ink)] py-1.5 px-0 text-sm placeholder:opacity-55 focus:outline-none"
            autoComplete="off"
            aria-label="Type a request"
          />
          <button
            type="submit"
            className="border-2 border-[var(--ink)] rounded-full px-3.5 py-1.5 text-xs font-bold hover:bg-[var(--wash)]"
          >
            Send
          </button>
        </form>
      </div>

      {/* Side Drawer on Desktop / Bottom Sheet on Mobile */}
      <TrailerModal
        youtubeKey={activeTrailer?.key || null}
        movieTitle={activeTrailer?.title || ""}
        onClose={() => setActiveTrailer(null)}
      />

      <StreamingModal
        movie={activeDetails}
        onClose={() => setActiveDetails(null)}
      />

      {/* Easter Egg Hints Drawer */}
      <EasterEggHintsDrawer
        isOpen={isHintsOpen}
        onClose={() => setIsHintsOpen(false)}
        foundThemes={foundThemes}
        onSelectTheme={handleSelectTheme}
      />

      {/* Easter Egg & General Toast */}
      <div
        className={`fixed left-1/2 bottom-5 -translate-x-1/2 bg-[var(--ink)] text-[var(--paper)] px-5 py-3 rounded-full text-sm font-medium z-50 transition-transform duration-300 max-w-[90vw] text-center shadow-lg ${
          isToastVisible ? "translate-y-0" : "translate-y-[200%]"
        }`}
        role="status"
      >
        {toastMessage}
      </div>
    </div>
  );
}
