"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  BarVisualizer,
  useVoiceAssistant,
  useRoomContext,
} from "@livekit/components-react";
import { RoomEvent } from "livekit-client";
import {
  Mic,
  MicOff,
  PhoneOff,
  Sparkles,
  Volume2,
  Film,
  MessageSquare,
  Send,
  FastForward,
  Clapperboard,
  Tv,
  HelpCircle,
} from "lucide-react";
import { MovieItem, MovieDetails, MovieDataEvent } from "@/types/movie";
import { PREMIERE_SHOWCASE } from "@/data/premiereMovies";
import { MovieGrid } from "./MovieGrid";
import { TrailerModal } from "./TrailerModal";
import { StreamingModal } from "./StreamingModal";

interface TranscriptItem {
  id: string;
  sender: "user" | "agent";
  text: string;
  isFinal: boolean;
}

interface VoiceRoomProps {
  token: string;
  serverUrl: string;
  activeTheme?: string | null;
  onDisconnect: () => void;
}

function FormattedTranscript({ text, activeTheme }: { text: string; activeTheme?: string | null }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  const isMatrix = activeTheme === "matrix";
  const isInterstellar = activeTheme === "interstellar";
  const isFightClub = activeTheme === "fightclub";

  return (
    <span>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong
              key={i}
              className={`font-bold px-1.5 py-0.5 rounded ${
                isMatrix
                  ? "text-[#00FF41] bg-[#00FF41]/20 border border-[#00FF41]/30 font-mono"
                  : isInterstellar
                  ? "text-amber-300 bg-amber-400/20 border border-amber-400/30 font-mono"
                  : isFightClub
                  ? "text-pink-300 bg-pink-500/20 border border-pink-500/30 font-mono"
                  : "text-amber-300 bg-amber-500/15 border border-amber-500/30 shadow-sm"
              }`}
            >
              {part.slice(2, -2)}
            </strong>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}

export function VoiceRoom({ token, serverUrl, activeTheme = null, onDisconnect }: VoiceRoomProps) {
  return (
    <LiveKitRoom
      token={token}
      serverUrl={serverUrl}
      connect={true}
      audio={true}
      video={false}
      onDisconnected={onDisconnect}
      className="flex flex-col flex-1"
    >
      <RoomAudioRenderer />
      <VoiceRoomContent activeTheme={activeTheme} onDisconnect={onDisconnect} />
    </LiveKitRoom>
  );
}

function VoiceRoomContent({
  activeTheme = null,
  onDisconnect,
}: {
  activeTheme?: string | null;
  onDisconnect: () => void;
}) {
  const room = useRoomContext();
  const { state: agentState, audioTrack } = useVoiceAssistant();

  const isMatrix = activeTheme === "matrix";
  const isInterstellar = activeTheme === "interstellar";
  const isFightClub = activeTheme === "fightclub";

  const [isMicOn, setIsMicOn] = useState<boolean>(true);
  // Screen is NEVER dark! Pre-populated with Sommelier's Showcase
  const [movies, setMovies] = useState<MovieItem[]>(PREMIERE_SHOWCASE);
  const [gridTitle, setGridTitle] = useState<string>("Sommelier's Curated Showcase");
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);
  const [typedMessage, setTypedMessage] = useState<string>("");
  const [isSearchingText, setIsSearchingText] = useState<boolean>(false);

  // Sync hardware microphone status
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

  // Turn microphone hardware track completely on/off
  const handleToggleMicrophone = async () => {
    if (!room?.localParticipant) return;
    const target = !isMicOn;
    try {
      await room.localParticipant.setMicrophoneEnabled(target);
      setIsMicOn(target);
    } catch (err) {
      console.error("Failed to toggle microphone hardware access:", err);
    }
  };

  // Reset searching state once agent speaks
  useEffect(() => {
    if (agentState === "speaking") {
      setIsSearchingText(false);
    }
  }, [agentState]);

  // Modals state
  const [activeTrailer, setActiveTrailer] = useState<{ key: string; title: string } | null>(null);
  const [activeDetails, setActiveDetails] = useState<MovieDetails | null>(null);

  // Send message helper
  const sendMessage = async (textToSend: string) => {
    const text = textToSend.trim();
    if (!text || !room) return;

    setIsSearchingText(true);

    setTranscripts((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.sender === "user" && last.text.toLowerCase() === text.toLowerCase()) {
        return prev;
      }
      return [
        ...prev,
        { id: `user-text-${Date.now()}`, sender: "user" as const, text, isFinal: true },
      ].slice(-8);
    });
    setTypedMessage("");

    const payload = JSON.stringify({
      type: "USER_TEXT_MESSAGE",
      text,
      timestamp: Date.now(),
    });
    try {
      await room.localParticipant.publishData(
        new TextEncoder().encode(payload),
        { reliable: true, topic: "movie_data" }
      );
    } catch (err) {
      console.error("Failed to publish text message to agent:", err);
      setIsSearchingText(false);
    }
  };

  const handleSendTextMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    sendMessage(typedMessage);
  };

  // Listen to WebRTC Data Channel & Live Transcriptions
  useEffect(() => {
    if (!room) return;

    const handleDataReceived = (payload: Uint8Array) => {
      try {
        const str = new TextDecoder().decode(payload);
        const event: MovieDataEvent = JSON.parse(str);
        if (!event || !event.type) return;

        console.log("🎬 CineBot Data Channel Event received:", event.type, event.data);

        if (event.type === "MOVIE_RECOMMENDATIONS") {
          setIsSearchingText(false);
          if (event.data.movies && event.data.movies.length > 0) {
            setMovies(event.data.movies);
            setGridTitle(
              event.data.genre
                ? `Recommendations: ${event.data.genre.toUpperCase()}`
                : "Curated Recommendations"
            );
          }
        } else if (event.type === "MOVIE_SEARCH_RESULTS") {
          setIsSearchingText(false);
          if (event.data.movies && event.data.movies.length > 0) {
            setMovies(event.data.movies);
            setGridTitle(`Search: "${event.data.query}"`);
          }
        } else if (event.type === "MOVIE_DETAILS") {
          setActiveDetails(event.data);
          if (event.data.trailer_youtube_key) {
            setActiveTrailer({
              key: event.data.trailer_youtube_key,
              title: event.data.title,
            });
          }
        }
      } catch (err) {
        // Ignore non-json packets
      }
    };

    const handleTranscription = (segments: any[], participant?: any) => {
      const isAgent = participant?.isAgent || participant?.identity?.toLowerCase().includes("agent") || false;
      const targetSender: "agent" | "user" = isAgent ? "agent" : "user";

      setTranscripts((prev) => {
        const updated = [...prev];
        for (const seg of segments) {
          if (!seg.text || !seg.text.trim()) continue;
          const cleanText = seg.text.trim();

          const idx = updated.findIndex((t) => t.id === seg.id);
          if (idx >= 0) {
            updated[idx] = {
              ...updated[idx],
              text: cleanText,
              isFinal: !!seg.final,
            };
            continue;
          }

          const lastIdx = updated.length - 1;
          if (lastIdx >= 0 && updated[lastIdx].sender === targetSender) {
            if (!updated[lastIdx].isFinal || updated[lastIdx].text.toLowerCase() === cleanText.toLowerCase()) {
              updated[lastIdx] = {
                ...updated[lastIdx],
                text: cleanText,
                isFinal: !!seg.final,
              };
              continue;
            }
          }

          updated.push({
            id: seg.id || `seg-${Date.now()}`,
            sender: targetSender,
            text: cleanText,
            isFinal: !!seg.final,
          });
        }
        return updated.slice(-8);
      });
    };

    room.on(RoomEvent.DataReceived, handleDataReceived);
    room.on(RoomEvent.TranscriptionReceived, handleTranscription);
    return () => {
      room.off(RoomEvent.DataReceived, handleDataReceived);
      room.off(RoomEvent.TranscriptionReceived, handleTranscription);
    };
  }, [room]);

  // Request trailer or details via TMDB
  const handleWatchTrailer = useCallback(async (movieId: number, title: string) => {
    try {
      if (activeDetails && activeDetails.id === movieId && activeDetails.trailer_youtube_key) {
        setActiveTrailer({ key: activeDetails.trailer_youtube_key, title });
        return;
      }
      const res = await fetch(`https://api.themoviedb.org/3/movie/${movieId}/videos?api_key=48e9c4038a834223ba99f7d2be73eb8b`);
      if (res.ok) {
        const data = await res.json();
        const trailer = (data.results || []).find(
          (v: any) => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser")
        );
        if (trailer) {
          setActiveTrailer({ key: trailer.key, title });
        } else {
          alert(`No YouTube trailer available for ${title}.`);
        }
      }
    } catch (e) {
      console.error("Error fetching trailer:", e);
    }
  }, [activeDetails]);

  const handleCheckProviders = useCallback(async (movieId: number) => {
    try {
      const res = await fetch(`https://api.themoviedb.org/3/movie/${movieId}/watch/providers?api_key=48e9c4038a834223ba99f7d2be73eb8b`);
      const detailsRes = await fetch(`https://api.themoviedb.org/3/movie/${movieId}?api_key=48e9c4038a834223ba99f7d2be73eb8b`);
      if (res.ok && detailsRes.ok) {
        const pData = await res.json();
        const dData = await detailsRes.json();
        const us = pData.results?.US || {};
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
          streaming_providers: (us.flatrate || []).map((p: any) => p.provider_name),
          rent_providers: (us.rent || []).map((p: any) => p.provider_name),
        });
      }
    } catch (e) {
      console.error("Error checking providers:", e);
    }
  }, []);

  // Skip / interrupt the bot's current speech
  const handleSkipSpeech = useCallback(async () => {
    if (!room) return;
    try {
      const payload = JSON.stringify({
        type: "INTERRUPT_SPEECH",
        timestamp: Date.now(),
      });
      await room.localParticipant.publishData(
        new TextEncoder().encode(payload),
        { reliable: true, topic: "movie_data" }
      );
    } catch (e) {
      console.error("Failed to send interrupt speech command:", e);
    }
  }, [room]);

  // Format status badge
  const getAgentStatusBadge = () => {
    if (isSearchingText || agentState === "thinking") {
      return {
        text: isMatrix
          ? "NEO // COMPUTING RECOMMENDATIONS..."
          : isInterstellar
          ? "COOPER // CALCULATING TRAJECTORY..."
          : "CineBot is searching the archive...",
        color: isMatrix ? "bg-[#00FF41]" : "bg-amber-400",
        ping: true,
      };
    }
    if (agentState === "speaking") {
      return {
        text: isMatrix
          ? "OPERATOR TRANSMITTING AUDIO..."
          : isInterstellar
          ? "TRANSMITTING FROM TESSERACT..."
          : "CineBot is speaking...",
        color: isMatrix ? "bg-[#00FF41]" : "bg-red-500",
        ping: true,
      };
    }
    if (agentState === "connecting") {
      return {
        text: isMatrix
          ? "INITIALIZING CONSTRUCT PROTOCOL..."
          : "Connecting to Soundstage...",
        color: isMatrix ? "bg-emerald-400" : "bg-blue-500",
        ping: true,
      };
    }
    if (!isMicOn) {
      return {
        text: isMatrix
          ? "AUDIO INPUT OFF // TYPE BELOW"
          : "Microphone Muted • Type request below",
        color: "bg-gray-500",
        ping: false,
      };
    }
    if (agentState === "listening") {
      return {
        text: isMatrix
          ? "AUDIO LINK LIVE // SPEAK FREELY"
          : isInterstellar
          ? "COMM LINK ACTIVE // SPEAK FREELY"
          : "Listening to you... Speak naturally",
        color: isMatrix ? "bg-[#00FF41]" : isInterstellar ? "bg-amber-400" : "bg-emerald-500",
        ping: true,
      };
    }
    return {
      text: isMatrix
        ? "OPERATOR READY // STANDBY"
        : "Soundstage Ready • Ask anything",
      color: isMatrix ? "bg-[#00FF41]" : "bg-emerald-400",
      ping: false,
    };
  };

  const status = getAgentStatusBadge();

  return (
    <div className="flex flex-col flex-1 space-y-8 animate-fade-in pb-12">
      {/* 1. TOP: The Movie Projection Stage (Screen 1 Auditorium) */}
      <div className="relative">
        <MovieGrid
          movies={movies}
          title={gridTitle}
          activeTheme={activeTheme}
          onWatchTrailer={handleWatchTrailer}
          onCheckProviders={handleCheckProviders}
        />
      </div>

      {/* 2. BOTTOM: Director's Soundstage & Voice Control Deck */}
      <div
        className={`relative overflow-hidden rounded-3xl border transition-all duration-500 shadow-2xl p-5 sm:p-7 ${
          isMatrix
            ? "border-[#00FF41]/40 bg-[#051309]/95 matrix-box-glow"
            : isInterstellar
            ? "border-amber-500/40 bg-[#080d1a]/95 shadow-amber-500/10"
            : "border-[#1e2738] bg-gradient-to-b from-[#111726] via-[#0b0e17] to-[#07090e] shadow-black/90"
        }`}
      >
        {/* Console Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-white/10 gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-2xl border transition-all duration-300 shadow-xl shrink-0 ${
                isMatrix
                  ? "border-[#00FF41]/50 bg-[#00FF41]/10 text-[#00FF41] shadow-[#00FF41]/20"
                  : isInterstellar
                  ? "border-amber-400/50 bg-amber-400/10 text-amber-300 shadow-amber-400/20"
                  : "border-amber-500/30 bg-gradient-to-br from-red-600/20 to-amber-600/10 text-amber-400 shadow-red-900/30"
              }`}
            >
              <Film className="h-6 w-6" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3
                  className={`text-lg font-black tracking-tight ${
                    isMatrix
                      ? "font-mono text-[#00FF41] matrix-text-glow"
                      : isInterstellar
                      ? "font-mono text-amber-300"
                      : "text-white font-cinzel"
                  }`}
                >
                  CineBot Live Voice Deck
                </h3>
                <span
                  className={`rounded-md px-2 py-0.5 text-[10px] font-extrabold font-mono tracking-wider border ${
                    isMatrix
                      ? "border-[#00FF41]/40 bg-[#00FF41]/15 text-[#00FF41]"
                      : isInterstellar
                      ? "border-amber-400/40 bg-amber-400/15 text-amber-300"
                      : "border-red-500/30 bg-red-600/15 text-red-400"
                  }`}
                >
                  {isMatrix ? "OPERATOR" : "AI SOMMELIER"}
                </span>
              </div>
              <p
                className={`mt-1 flex items-center gap-2 text-xs font-medium ${
                  isMatrix ? "font-mono text-emerald-300" : "text-gray-300"
                }`}
              >
                <span className={`h-2.5 w-2.5 rounded-full ${status.color} ${status.ping ? "animate-ping" : ""}`} />
                {status.text}
              </p>
            </div>
          </div>

          {/* Soundstage Control Buttons */}
          <div className="flex items-center gap-2.5 self-end sm:self-auto">
            {agentState === "speaking" && (
              <button
                onClick={handleSkipSpeech}
                className={`flex h-11 items-center gap-1.5 rounded-xl border px-3.5 text-xs font-bold active:scale-95 transition-all shadow-md animate-pulse ${
                  isMatrix
                    ? "border-[#00FF41]/50 bg-[#00FF41]/20 text-[#00FF41] hover:bg-[#00FF41] hover:text-black"
                    : "border-amber-500/50 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30"
                }`}
                title="Skip current speech cutscene"
              >
                <FastForward className="h-4 w-4 fill-current" />
                <span>SKIP SCENE</span>
              </button>
            )}

            {/* Studio Microphone Toggle */}
            <button
              onClick={handleToggleMicrophone}
              className={`relative flex h-11 items-center gap-2 rounded-xl border px-3.5 text-xs font-bold transition-all duration-200 shadow-md ${
                isMicOn
                  ? isMatrix
                    ? "border-[#00FF41] bg-[#00FF41]/20 text-[#00FF41]"
                    : "border-emerald-500/50 bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25"
                  : "border-red-500/50 bg-red-600/15 text-red-400 hover:bg-red-600/25"
              }`}
              title={isMicOn ? "Turn off Microphone (Stop audio capture)" : "Turn on Microphone (Start audio capture)"}
            >
              {isMicOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              <span>{isMicOn ? "MIC ON" : "MIC OFF"}</span>
            </button>

            {/* Leave Room Button */}
            <button
              onClick={onDisconnect}
              className="flex h-11 items-center gap-1.5 rounded-xl border border-red-500/40 bg-red-600 hover:bg-red-700 px-3.5 text-xs font-bold text-white shadow-lg active:scale-95 transition"
            >
              <PhoneOff className="h-4 w-4" />
              <span>EXIT THEATER</span>
            </button>
          </div>
        </div>

        {/* Dynamic Optical Soundtrack VU Meter */}
        <div className="py-4 flex items-center justify-center">
          <div
            className={`w-full max-w-md h-12 flex items-center justify-center rounded-2xl border px-4 shadow-inner ${
              isMatrix
                ? "border-[#00FF41]/30 bg-black/90"
                : isInterstellar
                ? "border-amber-500/30 bg-black/90"
                : "border-[#1e2738] bg-[#07090f]/90"
            }`}
          >
            {audioTrack ? (
              <BarVisualizer
                state={agentState}
                trackRef={audioTrack}
                barCount={21}
                className="h-9 w-full"
              />
            ) : (
              <div
                className={`flex items-center gap-2 text-xs font-mono ${
                  isMatrix
                    ? "text-[#00FF41]/70"
                    : isInterstellar
                    ? "text-amber-400/70"
                    : "text-gray-500"
                }`}
              >
                <Volume2 className="h-4 w-4 animate-pulse" />
                <span>35mm Optical Soundtrack Active &bull; Speak naturally</span>
              </div>
            )}
          </div>
        </div>

        {/* Subtitles & Dialogue Stream */}
        {transcripts.length > 0 && (
          <div className="border-t border-white/10 pt-4 mb-4">
            <div className="flex items-center gap-2 mb-2.5 text-xs font-mono font-semibold text-gray-400">
              <MessageSquare className="h-3.5 w-3.5 text-amber-400" />
              <span>Cinema Subtitles &amp; Dialogue Memory</span>
            </div>
            <div className="max-h-36 overflow-y-auto space-y-2 pr-2">
              {transcripts.map((t) => (
                <div
                  key={t.id}
                  className={`flex items-start gap-2.5 text-xs animate-fade-in ${
                    t.sender === "user"
                      ? "text-gray-300"
                      : isMatrix
                      ? "text-[#00FF41] font-mono"
                      : "text-amber-100"
                  }`}
                >
                  <span
                    className={`mt-0.5 inline-flex items-center justify-center h-5 w-5 rounded-full text-[10px] font-mono font-bold shrink-0 ${
                      t.sender === "user"
                        ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                        : "bg-red-600/20 text-red-400 border border-red-500/30"
                    }`}
                  >
                    {t.sender === "user" ? "YOU" : "BOT"}
                  </span>
                  <p className="leading-relaxed py-0.5 font-medium">
                    <span className="font-semibold text-gray-400 mr-1.5 font-mono">
                      {t.sender === "user" ? "You:" : "CineBot:"}
                    </span>
                    <FormattedTranscript text={t.text} activeTheme={activeTheme} />
                    {!t.isFinal && (
                      <span className="inline-block w-1.5 h-1.5 ml-1 rounded-full bg-amber-400 animate-ping" />
                    )}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Suggestion Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 text-[11px] font-mono text-gray-400">
          <span className="shrink-0 text-amber-400/80 font-bold">Try asking:</span>
          <button
            onClick={() => sendMessage("Recommend mind-bending 90s sci-fi movies")}
            className="shrink-0 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-gray-300 hover:border-amber-400/50 hover:text-white transition"
          >
            &ldquo;Recommend 90s sci-fi thrillers&rdquo;
          </button>
          <button
            onClick={() => sendMessage("Who directed the second movie?")}
            className="shrink-0 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-gray-300 hover:border-amber-400/50 hover:text-white transition"
          >
            &ldquo;Who directed the second one?&rdquo;
          </button>
          <button
            onClick={() => sendMessage("Compare the first two films on screen")}
            className="shrink-0 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-gray-300 hover:border-amber-400/50 hover:text-white transition"
          >
            &ldquo;Compare #1 and #2&rdquo;
          </button>
          <button
            onClick={() => sendMessage("What are the best Christopher Nolan movies?")}
            className="shrink-0 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-gray-300 hover:border-amber-400/50 hover:text-white transition"
          >
            &ldquo;Find Christopher Nolan thrillers&rdquo;
          </button>
        </div>

        {/* Screenplay Teleprompter Text Input */}
        <form onSubmit={handleSendTextMessage} className="mt-3 flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={typedMessage}
              onChange={(e) => setTypedMessage(e.target.value)}
              placeholder="Prefer typing? Ask about vibe, actors, or follow-ups like 'Tell me more about #1'..."
              className={`w-full rounded-xl border px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none transition ${
                isMatrix
                  ? "border-[#00FF41]/40 bg-black/90 font-mono text-[#00FF41] focus:border-[#00FF41]"
                  : "border-[#1e2738] bg-[#07090f]/90 focus:border-amber-500"
              }`}
            />
          </div>
          <button
            type="submit"
            disabled={!typedMessage.trim()}
            className="flex items-center gap-1.5 rounded-xl bg-red-600 hover:bg-red-500 px-4 py-2.5 text-xs font-bold text-white transition disabled:opacity-40 shadow-md shadow-red-600/30"
          >
            <Send className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">SEND</span>
          </button>
        </form>
      </div>

      {/* Trailer & Streaming Modals */}
      <TrailerModal
        youtubeKey={activeTrailer?.key || null}
        movieTitle={activeTrailer?.title || ""}
        onClose={() => setActiveTrailer(null)}
      />

      <StreamingModal
        movie={activeDetails}
        onClose={() => setActiveDetails(null)}
      />
    </div>
  );
}
