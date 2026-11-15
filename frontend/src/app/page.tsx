"use client";

import React, { useState } from "react";
import { Mic, Film, Sparkles, Tv, ShieldCheck, Zap } from "lucide-react";
import { VoiceRoom } from "@/components/VoiceRoom";

export default function Home() {
  const [token, setToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const startVoiceChat = async () => {
    setIsConnecting(true);
    setError(null);
    try {
      // Generate a unique room ID per session so LiveKit Cloud dispatches a fresh dedicated agent
      const sessionRoom = `cinebot-${Math.random().toString(36).substring(2, 9)}`;
      const res = await fetch(`/api/token?room=${sessionRoom}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to fetch LiveKit room token");
      }
      const data = await res.json();
      setToken(data.token);
      setServerUrl(data.url);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Could not connect to LiveKit room. Check your .env.local configuration.");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setToken(null);
    setServerUrl(null);
  };

  return (
    <main className="flex min-h-screen flex-col bg-[#080b11]">
      {/* Header Navigation */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-cine-border/80 bg-[#080b11]/80 px-6 py-4 backdrop-blur-md lg:px-12">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 text-white shadow-lg shadow-red-600/30">
            <Film className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              CineBot <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">LIVEKIT</span>
            </h1>
            <p className="text-[11px] text-gray-400">Real-Time Voice AI Movie Sommelier</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 rounded-full border border-cine-border bg-cine-card px-3 py-1 text-xs text-gray-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>WebRTC Audio + Data Channels</span>
          </div>
          {token && (
            <button
              onClick={handleDisconnect}
              className="text-xs font-semibold text-red-400 hover:text-red-300 transition"
            >
              End Session
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col px-6 py-8 lg:px-12 max-w-7xl mx-auto w-full">
        {token && serverUrl ? (
          <VoiceRoom
            token={token}
            serverUrl={serverUrl}
            onDisconnect={handleDisconnect}
          />
        ) : (
          <div className="flex flex-col items-center justify-center flex-1 my-auto text-center space-y-10 py-12">
            {/* Hero Pill */}
            <div className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-4 py-1.5 text-xs font-semibold text-red-400">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Ultra-Low-Latency Voice Interaction</span>
            </div>

            {/* Hero Heading */}
            <div className="space-y-4 max-w-3xl">
              <h2 className="text-4xl font-extrabold tracking-tight sm:text-6xl text-white">
                Talk to your personal <br />
                <span className="bg-gradient-to-r from-red-500 via-rose-400 to-amber-300 bg-clip-text text-transparent">
                  AI Cinema Sommelier
                </span>
              </h2>
              <p className="text-base text-gray-400 sm:text-lg max-w-2xl mx-auto">
                No typing required. Just talk. Tell CineBot your mood, favorite actors, or desired genre. 
                Watch high-res movie cards, trailers, and streaming options pop up on your screen in real time.
              </p>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="w-full max-w-md rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-xs text-red-300">
                {error}
              </div>
            )}

            {/* Connect CTA Button */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <button
                onClick={startVoiceChat}
                disabled={isConnecting}
                className="group relative inline-flex items-center gap-3 overflow-hidden rounded-2xl bg-red-600 px-8 py-4 text-base font-bold text-white shadow-xl shadow-red-600/30 hover:bg-red-500 active:scale-95 transition-all duration-200 disabled:opacity-50"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 group-hover:scale-110 transition">
                  <Mic className="h-4 w-4 fill-white" />
                </div>
                <span>{isConnecting ? "Connecting to LiveKit Room..." : "Start Voice Conversation"}</span>
              </button>
            </div>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-12 max-w-4xl w-full text-left">
              <div className="rounded-2xl border border-cine-border bg-cine-card/60 p-6 backdrop-blur">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-400 mb-4">
                  <Zap className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-white">Sub-300ms Voice WebRTC</h3>
                <p className="mt-1 text-xs text-gray-400">
                  Powered by LiveKit Agents, Grok xAI reasoning, and Deepgram voice synthesis for natural conversational interruption.
                </p>
              </div>

              <div className="rounded-2xl border border-cine-border bg-cine-card/60 p-6 backdrop-blur">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 mb-4">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-white">Live Data Channel Sync</h3>
                <p className="mt-1 text-xs text-gray-400">
                  Movie posters and metadata slide onto your screen at the exact millisecond the agent speaks about them.
                </p>
              </div>

              <div className="rounded-2xl border border-cine-border bg-cine-card/60 p-6 backdrop-blur">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 mb-4">
                  <Tv className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-white">Trailers & Streaming</h3>
                <p className="mt-1 text-xs text-gray-400">
                  Integrated with TMDB & JustWatch to launch full YouTube trailers and reveal active streaming providers.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-cine-border/50 py-6 text-center text-xs text-gray-500">
        Built with LiveKit Cloud &bull; TMDB API &bull; Grok xAI &bull; Next.js 15
      </footer>
    </main>
  );
}
