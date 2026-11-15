"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  BarVisualizer,
  useVoiceAssistant,
  useTrackToggle,
  useRoomContext,
} from "@livekit/components-react";
import { Track, RoomEvent } from "livekit-client";
import { Mic, MicOff, PhoneOff, Sparkles, Volume2, Film, MessageSquare, User, Send } from "lucide-react";
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
  onDisconnect: () => void;
}

export function VoiceRoom({ token, serverUrl, onDisconnect }: VoiceRoomProps) {
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
      <VoiceRoomContent onDisconnect={onDisconnect} />
    </LiveKitRoom>
  );
}

function VoiceRoomContent({ onDisconnect }: { onDisconnect: () => void }) {
  const room = useRoomContext();
  const { state: agentState, audioTrack } = useVoiceAssistant();
  const { buttonProps: micButtonProps, enabled: isMicEnabled } = useTrackToggle({
    source: Track.Source.Microphone,
  });

  const [movies, setMovies] = useState<MovieItem[]>([]);
  const [gridTitle, setGridTitle] = useState<string>("Live Recommendations");
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);
  const [typedMessage, setTypedMessage] = useState<string>("");

  // Modals state
  const [activeTrailer, setActiveTrailer] = useState<{ key: string; title: string } | null>(null);
  const [activeDetails, setActiveDetails] = useState<MovieDetails | null>(null);
  const [isLoadingTrailer, setIsLoadingTrailer] = useState<boolean>(false);

  // Send typed text message to agent via data channel
  const handleSendTextMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = typedMessage.trim();
    if (!text || !room) return;

    // Instantly append to local transcript UI (deduplicated)
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

    // Publish to Python agent over data channel
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
    }
  };

  // Listen to WebRTC Data Channel & Live Transcriptions
  useEffect(() => {
    if (!room) return;

    const handleDataReceived = (payload: Uint8Array, participant: any, kind: any, topic?: string) => {
      try {
        const str = new TextDecoder().decode(payload);
        const event: MovieDataEvent = JSON.parse(str);
        if (!event || !event.type) return;

        console.log("🎬 CineBot Data Channel Event received:", event.type, event.data);

        if (event.type === "MOVIE_RECOMMENDATIONS") {
          setMovies(event.data.movies || []);
          setGridTitle(
            event.data.genre
              ? `Recommendations: ${event.data.genre.toUpperCase()}`
              : "Curated Recommendations"
          );
        } else if (event.type === "MOVIE_SEARCH_RESULTS") {
          setMovies(event.data.movies || []);
          setGridTitle(`Search: "${event.data.query}"`);
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

          // 1. Match by segment ID if updating in-progress transcript
          const idx = updated.findIndex((t) => t.id === seg.id);
          if (idx >= 0) {
            updated[idx] = {
              ...updated[idx],
              text: cleanText,
              isFinal: !!seg.final,
            };
            continue;
          }

          // 2. Prevent duplicate entries from same sender with identical text
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

          // 3. Append new segment
          updated.push({
            id: seg.id || `seg-${Date.now()}`,
            sender: targetSender,
            text: cleanText,
            isFinal: !!seg.final,
          });
        }
        return updated.slice(-8); // Keep last 8 lines
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
    setIsLoadingTrailer(true);
    try {
      // Check if we already have it in activeDetails
      if (activeDetails && activeDetails.id === movieId && activeDetails.trailer_youtube_key) {
        setActiveTrailer({ key: activeDetails.trailer_youtube_key, title });
        return;
      }
      // Or send data channel message or fetch trailer
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
    } finally {
      setIsLoadingTrailer(false);
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

  // Format status badge
  const getAgentStatusBadge = () => {
    switch (agentState) {
      case "listening":
        return { text: "Listening to you...", color: "bg-emerald-500", ping: true };
      case "thinking":
        return { text: "CineBot is thinking & searching...", color: "bg-amber-400", ping: true };
      case "speaking":
        return { text: "CineBot is speaking...", color: "bg-red-500", ping: true };
      case "connecting":
        return { text: "Connecting to CineBot...", color: "bg-blue-500", ping: true };
      default:
        return { text: "Ready • Speak naturally", color: "bg-gray-400", ping: false };
    }
  };

  const status = getAgentStatusBadge();

  return (
    <div className="flex flex-col flex-1 space-y-8">
      {/* Top Interactive Voice Control Console */}
      <div className="relative overflow-hidden rounded-3xl border border-cine-border bg-gradient-to-b from-[#161c29] to-[#0e131d] p-6 sm:p-8 shadow-2xl">
        {/* Background glow effects */}
        <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-red-600/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-purple-600/10 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Agent Identity & Status */}
          <div className="flex items-center gap-4">
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-red-600/20 border border-red-500/30 text-red-500 shadow-lg shadow-red-500/20">
              <Film className="h-8 w-8" />
              {status.ping && (
                <span className={`absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full ${status.color} animate-ping`} />
              )}
              <span className={`absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full ${status.color} border-2 border-[#161c29]`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-white">CineBot</h3>
                <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-semibold text-red-400 border border-red-500/20">
                  AI SOMMELIER
                </span>
              </div>
              <p className="mt-1 flex items-center gap-2 text-sm text-gray-300">
                <span className={`h-2 w-2 rounded-full ${status.color}`} />
                {status.text}
              </p>
            </div>
          </div>

          {/* Real-time Audio Visualizer */}
          <div className="flex flex-1 max-w-xs items-center justify-center px-4">
            <div className="flex h-12 w-full items-center justify-center">
              {audioTrack ? (
                <BarVisualizer
                  state={agentState}
                  trackRef={audioTrack}
                  barCount={15}
                  className="h-10 w-full"
                />
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Volume2 className="h-4 w-4 animate-pulse" />
                  <span>Waiting for audio stream...</span>
                </div>
              )}
            </div>
          </div>

          {/* Call Controls: Mic Mute & Disconnect */}
          <div className="flex items-center gap-3">
            <button
              {...micButtonProps}
              className={`flex h-12 w-12 items-center justify-center rounded-2xl border transition-all duration-200 ${
                isMicEnabled
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                  : "border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20"
              }`}
              title={isMicEnabled ? "Mute Microphone" : "Unmute Microphone"}
            >
              {isMicEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </button>

            <button
              onClick={onDisconnect}
              className="flex h-12 items-center gap-2 rounded-2xl border border-red-500/30 bg-red-600 px-5 text-sm font-semibold text-white shadow-lg shadow-red-600/30 hover:bg-red-700 transition"
            >
              <PhoneOff className="h-4 w-4" />
              <span>Leave Room</span>
            </button>
          </div>
        </div>

        {/* Live Subtitles & Conversation Stream */}
        {transcripts.length > 0 && (
          <div className="mt-6 border-t border-cine-border/60 pt-4">
            <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-gray-400">
              <MessageSquare className="h-3.5 w-3.5 text-cine-cyan" />
              <span>Live Conversation Transcript</span>
            </div>
            <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
              {transcripts.map((t) => (
                <div
                  key={t.id}
                  className={`flex items-start gap-2.5 text-xs animate-fade-in ${
                    t.sender === "user" ? "text-gray-200" : "text-rose-200"
                  }`}
                >
                  <span
                    className={`mt-0.5 inline-flex items-center justify-center h-5 w-5 rounded-full text-[10px] font-bold shrink-0 ${
                      t.sender === "user"
                        ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                        : "bg-red-500/20 text-red-400 border border-red-500/30"
                    }`}
                  >
                    {t.sender === "user" ? "You" : "AI"}
                  </span>
                  <p className="leading-relaxed py-0.5">
                    <span className="font-semibold text-gray-400 mr-1.5">
                      {t.sender === "user" ? "You:" : "CineBot:"}
                    </span>
                    {t.text}
                    {!t.isFinal && (
                      <span className="inline-block w-1.5 h-1.5 ml-1 rounded-full bg-red-400 animate-ping" />
                    )}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Text Input Box for non-voice / typing users */}
        <form onSubmit={handleSendTextMessage} className="mt-6 border-t border-cine-border/60 pt-4 flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={typedMessage}
              onChange={(e) => setTypedMessage(e.target.value)}
              placeholder="Prefer typing? Type your request here (e.g. 'Recommend 90s action thrillers' or 'Show trailer for Inception')..."
              className="w-full rounded-xl border border-cine-border bg-[#080b11]/80 px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition"
            />
          </div>
          <button
            type="submit"
            disabled={!typedMessage.trim()}
            className="flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-red-500 disabled:opacity-40 transition"
          >
            <Send className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>

        {/* Quick Voice Hints */}
        <div className="mt-6 border-t border-cine-border/60 pt-4 flex flex-wrap items-center gap-2 text-xs text-gray-400">
          <span className="font-semibold text-gray-300">Try saying:</span>
          <span className="rounded-lg bg-white/5 px-2.5 py-1 text-gray-300">
            &ldquo;Recommend mind-bending sci-fi movies&rdquo;
          </span>
          <span className="rounded-lg bg-white/5 px-2.5 py-1 text-gray-300">
            &ldquo;Find Christopher Nolan thrillers&rdquo;
          </span>
          <span className="rounded-lg bg-white/5 px-2.5 py-1 text-gray-300">
            &ldquo;What are top horror movies from 2024?&rdquo;
          </span>
        </div>
      </div>

      {/* Dynamic Movie Grid synced with Agent via WebRTC Data Channel */}
      <MovieGrid
        movies={movies}
        title={gridTitle}
        onWatchTrailer={handleWatchTrailer}
        onCheckProviders={handleCheckProviders}
      />

      {/* Trailer Video Player Modal */}
      <TrailerModal
        youtubeKey={activeTrailer?.key || null}
        movieTitle={activeTrailer?.title || ""}
        onClose={() => setActiveTrailer(null)}
      />

      {/* Where to Watch / Streaming Modal */}
      <StreamingModal
        movie={activeDetails}
        onClose={() => setActiveDetails(null)}
      />
    </div>
  );
}
