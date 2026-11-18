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
} from "lucide-react";
import { MovieItem, MovieDetails, MovieDataEvent } from "@/types/movie";
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
  const isGodfather = activeTheme === "godfather";

  const [isMicOn, setIsMicOn] = useState<boolean>(true);
  const [movies, setMovies] = useState<MovieItem[]>([]);
  const [gridTitle, setGridTitle] = useState<string>("Now Showing");
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);
  const [typedMessage, setTypedMessage] = useState<string>("");
  const [isSearchingText, setIsSearchingText] = useState<boolean>(false);

  // Easter Egg: Clapperboard Take counter
  const [takeCount, setTakeCount] = useState<number>(1);
  const [isClapping, setIsClapping] = useState<boolean>(false);

  const handleClapSnap = () => {
    setIsClapping(true);
    setTakeCount((prev) => prev + 1);
    setTimeout(() => setIsClapping(false), 300);
  };

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

  // Send typed text message to agent via data channel
  const handleSendTextMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = typedMessage.trim();
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
          : "CineBot is searching & thinking...",
        color: isMatrix ? "bg-[#00FF41]" : isInterstellar ? "bg-amber-400" : "bg-amber-400",
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
          ? "AUDIO INPUT TERMINATED // TYPE BELOW"
          : "Mic Off • Type your request below",
        color: "bg-gray-500",
        ping: false,
      };
    }
    if (agentState === "listening") {
      return {
        text: isMatrix
          ? "AUDIO LINK OPEN // SPEAK FREELY"
          : isInterstellar
          ? "COMM LINK ACTIVE // SPEAK FREELY"
          : "Microphone Live • Speak naturally",
        color: isMatrix ? "bg-[#00FF41]" : isInterstellar ? "bg-amber-400" : "bg-emerald-500",
        ping: true,
      };
    }
    return {
      text: isMatrix
        ? "READY // STANDBY"
        : "Soundstage Ready • Ask anything",
      color: isMatrix ? "bg-[#00FF41]" : "bg-emerald-400",
      ping: false,
    };
  };

  const status = getAgentStatusBadge();

  return (
    <div className="flex flex-col flex-1 space-y-8 animate-fade-in">
      {/* Authentic Cinema Projection Stage & Console */}
      <div
        className={`relative overflow-hidden rounded-3xl border transition-all duration-500 cinema-screen-curve ${
          isMatrix
            ? "border-[#00FF41]/40 bg-[#051309]/95 matrix-box-glow"
            : isInterstellar
            ? "border-amber-500/40 bg-[#070b16]/95 shadow-amber-500/10"
            : isFightClub
            ? "border-pink-500/40 bg-[#140a12]/95"
            : "border-[#1e2738] bg-gradient-to-b from-[#111724] via-[#0b0f17] to-[#07090e]"
        }`}
      >
        {/* Top Diagonal Clapperboard Zebra Bar */}
        <div
          onClick={handleClapSnap}
          className={`h-7 w-full cursor-pointer relative flex items-center justify-between px-4 transition-transform duration-200 select-none ${
            isClapping ? "scale-y-95 -translate-y-0.5" : ""
          } ${isMatrix ? "clapper-stripes-matrix" : "clapper-stripes"}`}
          title="Click to snap the Director's Clapperboard!"
        >
          <div className="flex items-center gap-2 bg-black/90 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider text-white shadow">
            <Clapperboard className="h-3 w-3 text-amber-400" />
            <span>
              {isMatrix ? "MATRIX // TAKE" : isInterstellar ? "MISSION // TAKE" : "SCENE 1 // TAKE"}{" "}
              {takeCount.toString().padStart(2, "0")}
            </span>
          </div>

          <div className="flex items-center gap-3 bg-black/90 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider text-gray-300 shadow">
            <span>SOUND: 48kHz OPUS</span>
            <span className="hidden sm:inline">ROLL: 24 FPS</span>
          </div>
        </div>

        {/* 35mm Sprocket Accent Line */}
        <div
          className={`h-2.5 w-full film-sprockets-h opacity-40 border-b ${
            isMatrix ? "border-[#00FF41]/20 bg-[#001708]" : "border-white/5 bg-[#06080d]"
          }`}
        />

        <div className="p-6 sm:p-8">
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Clapperboard Identity & Live Status */}
            <div className="flex items-center gap-4">
              <div
                onClick={handleClapSnap}
                className={`cursor-pointer relative flex h-16 w-16 items-center justify-center rounded-2xl border transition-all duration-300 shadow-xl ${
                  isMatrix
                    ? "border-[#00FF41]/50 bg-[#00FF41]/10 text-[#00FF41] shadow-[#00FF41]/30"
                    : isInterstellar
                    ? "border-amber-400/50 bg-amber-400/10 text-amber-300 shadow-amber-400/20"
                    : isFightClub
                    ? "border-pink-500/50 bg-pink-500/10 text-pink-400 shadow-pink-500/20"
                    : "border-amber-500/30 bg-gradient-to-br from-red-600/20 to-amber-600/10 text-amber-400 shadow-red-900/30"
                }`}
                title="CineBot AI Sommelier • Click to snap take"
              >
                <Film className={`h-8 w-8 ${isClapping ? "scale-110" : ""}`} />
                {status.ping && (
                  <span className={`absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full ${status.color} animate-ping`} />
                )}
                <span className={`absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full ${status.color} border-2 border-black`} />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3
                    className={`text-xl font-black tracking-tight ${
                      isMatrix
                        ? "font-mono text-[#00FF41] matrix-text-glow"
                        : isInterstellar
                        ? "font-mono text-amber-300"
                        : "text-white"
                    }`}
                  >
                    CineBot
                  </h3>
                  <span
                    className={`rounded-md px-2.5 py-0.5 text-[10px] font-extrabold font-mono tracking-wider border ${
                      isMatrix
                        ? "border-[#00FF41]/40 bg-[#00FF41]/15 text-[#00FF41]"
                        : isInterstellar
                        ? "border-amber-400/40 bg-amber-400/15 text-amber-300"
                        : isFightClub
                        ? "border-pink-500/40 bg-pink-500/15 text-pink-300"
                        : "border-red-500/30 bg-red-600/15 text-red-400"
                    }`}
                  >
                    {isMatrix ? "OPERATOR" : isInterstellar ? "TESSERACT" : "CINEMA SOMMELIER"}
                  </span>
                </div>
                <p
                  className={`mt-1 flex items-center gap-2 text-xs sm:text-sm ${
                    isMatrix ? "font-mono text-emerald-300" : "text-gray-300"
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${status.color}`} />
                  {status.text}
                </p>
              </div>
            </div>

            {/* Optical Soundtrack VU Visualizer */}
            <div className="flex flex-1 max-w-xs items-center justify-center px-4">
              <div
                className={`flex h-14 w-full items-center justify-center rounded-2xl border px-3 py-1.5 shadow-inner ${
                  isMatrix
                    ? "border-[#00FF41]/30 bg-black/80"
                    : isInterstellar
                    ? "border-amber-500/30 bg-black/80"
                    : "border-[#1e2738] bg-[#07090f]/90"
                }`}
              >
                {audioTrack ? (
                  <BarVisualizer
                    state={agentState}
                    trackRef={audioTrack}
                    barCount={17}
                    className="h-10 w-full"
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
                    <span>Optical audio track standby</span>
                  </div>
                )}
              </div>
            </div>

            {/* Vintage Studio Controls: Skip Cutscene, Microphone, Leave Room */}
            <div className="flex items-center gap-3">
              {agentState === "speaking" && (
                <button
                  onClick={handleSkipSpeech}
                  className={`flex h-12 items-center gap-1.5 rounded-2xl border px-4 text-xs font-bold active:scale-95 transition-all shadow-lg animate-pulse ${
                    isMatrix
                      ? "border-[#00FF41]/50 bg-[#00FF41]/20 text-[#00FF41] hover:bg-[#00FF41] hover:text-black"
                      : "border-amber-500/50 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 shadow-amber-500/20"
                  }`}
                  title="Skip speaking dialogue like a game cutscene"
                >
                  <FastForward className="h-4 w-4 fill-current" />
                  <span>SKIP SCENE</span>
                </button>
              )}

              {/* Studio Microphone Button */}
              <button
                onClick={handleToggleMicrophone}
                className={`relative flex h-12 w-12 items-center justify-center rounded-2xl border transition-all duration-200 shadow-lg ${
                  isMicOn
                    ? isMatrix
                      ? "border-[#00FF41] bg-[#00FF41]/20 text-[#00FF41] shadow-[#00FF41]/30"
                      : isInterstellar
                      ? "border-amber-400 bg-amber-400/20 text-amber-300 shadow-amber-400/30"
                      : "border-emerald-500/50 bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 shadow-emerald-500/20"
                    : "border-red-500/50 bg-red-600/15 text-red-400 hover:bg-red-600/25 shadow-red-500/20"
                }`}
                title={isMicOn ? "Turn off Microphone (Stop audio capture)" : "Turn on Microphone (Start audio capture)"}
              >
                {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                {isMicOn && (
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </button>

              {/* Leave Room Button */}
              <button
                onClick={onDisconnect}
                className={`flex h-12 items-center gap-2 rounded-2xl border px-5 text-xs font-bold text-white shadow-lg active:scale-95 transition ${
                  isMatrix
                    ? "border-[#00FF41]/40 bg-[#003311] hover:bg-red-900/60"
                    : "border-red-500/40 bg-red-600 hover:bg-red-700 shadow-red-600/30"
                }`}
              >
                <PhoneOff className="h-4 w-4" />
                <span>EXIT CINEMA</span>
              </button>
            </div>
          </div>

          {/* Cinema Dialogue History Bar */}
          {transcripts.length > 0 && (
            <div
              className={`mt-6 border-t pt-4 ${
                isMatrix
                  ? "border-[#00FF41]/20"
                  : isInterstellar
                  ? "border-amber-500/20"
                  : "border-white/10"
              }`}
            >
              <div className="flex items-center gap-2 mb-3 text-xs font-mono font-semibold text-gray-400">
                <MessageSquare
                  className={`h-3.5 w-3.5 ${
                    isMatrix ? "text-[#00FF41]" : isInterstellar ? "text-amber-400" : "text-amber-400"
                  }`}
                />
                <span>Cinema Dialogue &amp; Follow-Up Memory</span>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
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
                          : isMatrix
                          ? "bg-[#00FF41]/20 text-[#00FF41] border border-[#00FF41]/40"
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
                        <span
                          className={`inline-block w-1.5 h-1.5 ml-1 rounded-full animate-ping ${
                            isMatrix ? "bg-[#00FF41]" : "bg-amber-400"
                          }`}
                        />
                      )}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Screenplay Teleprompter Text Input */}
          <form
            onSubmit={handleSendTextMessage}
            className={`mt-6 border-t pt-4 flex items-center gap-2 ${
              isMatrix ? "border-[#00FF41]/20" : "border-white/10"
            }`}
          >
            <div className="relative flex-1">
              <input
                type="text"
                value={typedMessage}
                onChange={(e) => setTypedMessage(e.target.value)}
                placeholder={
                  isMatrix
                    ? "Transmit query to Operator (e.g. 'Compare the first two films' or 'Who directed the second one?')..."
                    : "Ask CineBot: 'Recommend 90s action thrillers', 'Who directed the second one?', or 'Compare the first two'..."
                }
                className={`w-full rounded-xl border px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none transition ${
                  isMatrix
                    ? "border-[#00FF41]/40 bg-black/90 font-mono text-[#00FF41] focus:border-[#00FF41] focus:ring-1 focus:ring-[#00FF41]"
                    : "border-[#1e2738] bg-[#07090f]/90 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                }`}
              />
            </div>
            <button
              type="submit"
              disabled={!typedMessage.trim()}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold text-white transition disabled:opacity-40 ${
                isMatrix
                  ? "bg-[#00FF41] text-black hover:bg-[#00cc33] font-mono"
                  : "bg-red-600 hover:bg-red-500 shadow-md shadow-red-600/30"
              }`}
            >
              <Send className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">SEND</span>
            </button>
          </form>
        </div>
      </div>

      {/* Movie Recommendations Projection Grid */}
      <MovieGrid
        movies={movies}
        title={gridTitle}
        activeTheme={activeTheme}
        onWatchTrailer={handleWatchTrailer}
        onCheckProviders={handleCheckProviders}
      />

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
