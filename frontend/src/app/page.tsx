"use client";

import React, { useState, useEffect } from "react";
import {
  Mic,
  Film,
  Sparkles,
  Tv,
  ShieldCheck,
  Zap,
  Clapperboard,
  Ticket,
  Flame,
  CornerDownRight,
  Eye,
} from "lucide-react";
import { VoiceRoom } from "@/components/VoiceRoom";
import { FairUsageModal } from "@/components/FairUsageModal";
import { MatrixRainCanvas } from "@/components/MatrixRainCanvas";

export default function Home() {
  const [token, setToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isFairUsageOpen, setIsFairUsageOpen] = useState<boolean>(false);

  // Easter Egg 1: The Matrix Theme
  const [isMatrixMode, setIsMatrixMode] = useState<boolean>(false);
  const [keyBuffer, setKeyBuffer] = useState<string>("");

  // Easter Egg 2: Clapperboard snap
  const [headerTakes, setHeaderTakes] = useState<number>(1);
  const [isClappingHeader, setIsClappingHeader] = useState<boolean>(false);

  // Easter Egg 3: Secret VIP Ticket Stamp
  const [isVipStamped, setIsVipStamped] = useState<boolean>(false);

  // Secret keystroke listener for "matrix" or "neo"
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (e.key === "Escape" && isMatrixMode) {
        setIsMatrixMode(false);
        return;
      }

      const updated = (keyBuffer + e.key.toLowerCase()).slice(-8);
      setKeyBuffer(updated);

      if (updated.includes("matrix") || updated.includes("neo")) {
        setIsMatrixMode((prev) => !prev);
        setKeyBuffer("");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [keyBuffer, isMatrixMode]);

  const snapHeaderClapper = () => {
    setIsClappingHeader(true);
    setHeaderTakes((prev) => prev + 1);
    setTimeout(() => setIsClappingHeader(false), 300);
  };

  const startVoiceChat = async () => {
    setIsConnecting(true);
    setError(null);
    try {
      const sessionRoom = `cinebot-${Math.random().toString(36).substring(2, 9)}`;
      const res = await fetch(`/api/token?room=${sessionRoom}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch LiveKit room token");
      }
      setToken(data.token);
      setServerUrl(data.url);
    } catch (err: any) {
      console.error(err);
      setError(
        err?.message ||
          "Could not connect to LiveKit room. Check your connection or try again shortly."
      );
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setToken(null);
    setServerUrl(null);
  };

  return (
    <main
      className={`relative flex min-h-screen flex-col transition-colors duration-700 ${
        isMatrixMode ? "bg-[#060a08] text-[#00FF41]" : "bg-[#08090d] text-gray-100"
      }`}
    >
      {/* Matrix Cascading Digital Rain Background (Active in Matrix Easter Egg mode) */}
      <MatrixRainCanvas active={isMatrixMode} />

      {/* Cinematic Projector Volumetric Light Cone */}
      <div
        className={`pointer-events-none fixed inset-0 z-0 h-[600px] w-full transition-opacity duration-700 ${
          isMatrixMode ? "projector-beam-matrix opacity-70" : "projector-beam opacity-90"
        }`}
      />

      {/* Fair Usage Policy Modal */}
      <FairUsageModal
        isOpen={isFairUsageOpen}
        onClose={() => setIsFairUsageOpen(false)}
      />

      {/* Retro Cinema Marquee Header */}
      <header
        className={`sticky top-0 z-30 flex flex-col border-b backdrop-blur-md transition-all duration-500 ${
          isMatrixMode
            ? "border-[#00FF41]/30 bg-[#061008]/85"
            : "border-[#1d2433] bg-[#090c12]/90 shadow-xl shadow-black/60"
        }`}
      >
        {/* Top Marquee Bulb Chaser Bar */}
        <div className="flex justify-between items-center px-4 py-1 border-b border-white/5 text-[10px] font-mono tracking-widest text-amber-400/80 bg-black/40 select-none overflow-hidden">
          <div className="flex items-center gap-2">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400 animate-bulb-odd" />
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-500 animate-bulb-even" />
            <span className="hidden sm:inline font-bold">NOW SHOWING</span>
            <span className="hidden md:inline text-gray-500">• SCREEN 1: 35MM STEREO DOLBY</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Clapperboard Take Counter (Easter Egg) */}
            <button
              onClick={snapHeaderClapper}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded border transition-transform ${
                isClappingHeader ? "scale-95" : ""
              } ${
                isMatrixMode
                  ? "border-[#00FF41]/40 bg-[#00FF41]/10 text-[#00FF41]"
                  : "border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
              }`}
              title="Click to snap the Director's Clapperboard!"
            >
              <Clapperboard className="h-3 w-3" />
              <span>TAKE {headerTakes.toString().padStart(2, "0")}</span>
            </button>

            {/* Matrix Trigger / Exit Pill */}
            {isMatrixMode ? (
              <button
                onClick={() => setIsMatrixMode(false)}
                className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-600/30 border border-red-500/50 text-[10px] font-bold text-red-300 hover:bg-red-600 hover:text-white transition"
                title="Exit Matrix mode"
              >
                <span>💊 Blue Pill (Exit Matrix)</span>
              </button>
            ) : (
              <button
                onClick={() => setIsMatrixMode(true)}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] text-gray-500 hover:text-emerald-400 transition"
                title="There is no spoon... (or type 'matrix')"
              >
                <span>🕶️</span>
              </button>
            )}
          </div>
        </div>

        {/* Main Cinema Navigation Bar */}
        <div className="flex items-center justify-between px-6 py-3.5 lg:px-12">
          {/* Logo & Cinema Branding */}
          <div className="flex items-center gap-3.5">
            <div
              className={`group flex h-11 w-11 items-center justify-center rounded-2xl border transition-all duration-500 shadow-lg ${
                isMatrixMode
                  ? "border-[#00FF41] bg-[#00FF41]/20 text-[#00FF41] shadow-[#00FF41]/30"
                  : "border-amber-500/40 bg-gradient-to-br from-red-600 to-amber-600 text-white shadow-red-700/40"
              }`}
            >
              <Film className="h-5 w-5 spin-reel" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1
                  className={`text-xl font-black tracking-wider uppercase ${
                    isMatrixMode
                      ? "font-mono text-[#00FF41] matrix-text-glow"
                      : "text-white drop-shadow-[0_2px_8px_rgba(229,9,20,0.5)]"
                  }`}
                >
                  CineBot
                </h1>
                <span
                  className={`rounded-md px-2 py-0.5 text-[10px] font-extrabold font-mono tracking-wider border ${
                    isMatrixMode
                      ? "border-[#00FF41]/40 bg-[#00FF41]/15 text-[#00FF41]"
                      : "border-amber-500/30 bg-amber-500/10 text-amber-300"
                  }`}
                >
                  {isMatrixMode ? "OPERATOR // LIVE" : "35MM THEATER"}
                </span>
              </div>
              <p
                className={`text-[11px] ${
                  isMatrixMode ? "font-mono text-emerald-400" : "text-gray-400"
                }`}
              >
                Conversational Cinema Sommelier • Powered by LiveKit
              </p>
            </div>
          </div>

          {/* Right Navigation & Status Stubs */}
          <div className="flex items-center gap-3">
            {/* Vintage Ticket Stub (Clickable Easter Egg!) */}
            <div
              onClick={() => setIsVipStamped((prev) => !prev)}
              className={`hidden sm:flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-1.5 transition select-none ${
                isVipStamped
                  ? "border-amber-400 bg-amber-400/20 text-amber-300 shadow-lg shadow-amber-400/20"
                  : isMatrixMode
                  ? "border-[#00FF41]/30 bg-black/60 text-[#00FF41]"
                  : "border-[#252f42] bg-[#0f1420] text-gray-300 hover:border-amber-500/40"
              }`}
              title="Click to stamp your cinema ticket!"
            >
              <Ticket className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-xs font-mono font-bold">
                {isVipStamped ? "VIP CRITIC PASS ★" : "ADMIT ONE // ROW C"}
              </span>
            </div>

            {/* Fair Usage Modal Button */}
            <button
              onClick={() => setIsFairUsageOpen(true)}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition ${
                isMatrixMode
                  ? "border-[#00FF41]/30 bg-black/60 text-[#00FF41] hover:bg-[#00FF41]/20"
                  : "border-[#252f42] bg-[#0f1420] text-gray-300 hover:text-white hover:border-red-500/40"
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5 text-red-400" />
              <span className="hidden sm:inline">Fair Usage</span>
            </button>

            {token && (
              <button
                onClick={handleDisconnect}
                className="text-xs font-bold text-red-400 hover:text-red-300 transition px-2 py-1"
              >
                Leave Room
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Theater Soundstage */}
      <div className="relative z-10 flex flex-1 flex-col px-4 sm:px-6 py-8 lg:px-12 max-w-7xl mx-auto w-full">
        {token && serverUrl ? (
          <VoiceRoom
            token={token}
            serverUrl={serverUrl}
            isMatrixMode={isMatrixMode}
            onDisconnect={handleDisconnect}
          />
        ) : (
          <div className="flex flex-col items-center justify-center flex-1 my-auto text-center space-y-10 py-10">
            {/* Cinema Stage Header Marquee Badge */}
            <div
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-mono font-bold tracking-wider ${
                isMatrixMode
                  ? "border-[#00FF41]/50 bg-[#00FF41]/10 text-[#00FF41] matrix-box-glow"
                  : "border-amber-500/30 bg-amber-500/10 text-amber-300 shadow-lg shadow-amber-500/10"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{isMatrixMode ? "NEO // LIVE VOICE INTERACTION" : "PREMIERE: REAL-TIME CONVERSATIONAL CINEMA"}</span>
            </div>

            {/* Cinema Title Heading */}
            <div className="space-y-4 max-w-3xl">
              <h2
                className={`text-4xl font-black tracking-tight sm:text-6xl ${
                  isMatrixMode
                    ? "font-mono text-[#00FF41] matrix-text-glow uppercase"
                    : "text-white"
                }`}
              >
                {isMatrixMode ? (
                  <>
                    WAKE UP, MOVIE LOVER. <br />
                    <span className="text-white">THE MATRIX HAS YOU.</span>
                  </>
                ) : (
                  <>
                    Step inside the theater. <br />
                    <span className="bg-gradient-to-r from-red-500 via-amber-400 to-yellow-300 bg-clip-text text-transparent">
                      Talk to your personal Sommelier.
                    </span>
                  </>
                )}
              </h2>
              <p
                className={`text-base sm:text-lg max-w-2xl mx-auto leading-relaxed ${
                  isMatrixMode ? "font-mono text-emerald-300/90" : "text-gray-300"
                }`}
              >
                No endless scrolling. No text walls. Ask for mood, eras, actors, or follow-ups like{" "}
                <span className="italic font-semibold text-white">&ldquo;Who directed the second one?&rdquo;</span> or{" "}
                <span className="italic font-semibold text-white">&ldquo;Compare the first two&rdquo;</span>.
                Posters and streaming options project onto your screen live as CineBot speaks.
              </p>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="w-full max-w-lg rounded-2xl border border-red-500/50 bg-red-500/10 p-4 text-xs text-red-300 flex items-start gap-3 text-left shadow-lg shadow-red-500/10 animate-fade-in">
                <ShieldCheck className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-white">Notice</p>
                  <p className="mt-0.5 text-red-300/90 leading-relaxed">{error}</p>
                </div>
              </div>
            )}

            {/* Main Cinema CTA Button */}
            <div className="flex flex-col items-center gap-3">
              <button
                onClick={startVoiceChat}
                disabled={isConnecting}
                className={`group relative inline-flex items-center gap-3.5 overflow-hidden rounded-2xl px-8 py-4.5 text-base font-extrabold tracking-wide shadow-2xl active:scale-95 transition-all duration-300 disabled:opacity-50 ${
                  isMatrixMode
                    ? "bg-[#00FF41] text-black hover:bg-[#00cc33] shadow-[#00FF41]/40 font-mono"
                    : "bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white shadow-red-600/40 hover:brightness-110"
                }`}
              >
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${
                    isMatrixMode ? "bg-black/20" : "bg-white/20 group-hover:scale-110"
                  }`}
                >
                  <Mic className="h-5 w-5 fill-current" />
                </div>
                <span>
                  {isConnecting
                    ? isMatrixMode
                      ? "JACKING INTO LIVEKIT ROOM..."
                      : "Connecting to Theater Soundstage..."
                    : isMatrixMode
                    ? "ENTER THE CONSTRUCT"
                    : "Start Voice Conversation"}
                </span>
              </button>

              <button
                onClick={() => setIsFairUsageOpen(true)}
                className={`text-[11px] underline underline-offset-4 transition ${
                  isMatrixMode ? "font-mono text-emerald-400/80 hover:text-[#00FF41]" : "text-gray-400 hover:text-gray-200"
                }`}
              >
                10-min session cap • 6 sessions/15m • Fair Usage Policy
              </button>
            </div>

            {/* Interactive Cinema Lobby Stalls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-10 max-w-4xl w-full text-left">
              {/* Feature 1 */}
              <div
                className={`rounded-2xl border p-6 transition-all duration-300 ${
                  isMatrixMode
                    ? "border-[#00FF41]/30 bg-[#06110a]/80"
                    : "border-[#222938] bg-gradient-to-b from-[#131924]/80 to-[#0c1017]/90 shadow-xl"
                }`}
              >
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl mb-4 border ${
                    isMatrixMode
                      ? "border-[#00FF41]/50 bg-[#00FF41]/10 text-[#00FF41]"
                      : "border-red-500/30 bg-red-600/10 text-red-400"
                  }`}
                >
                  <Zap className="h-5 w-5" />
                </div>
                <h3 className={`text-base font-extrabold ${isMatrixMode ? "font-mono text-[#00FF41]" : "text-white"}`}>
                  Sub-300ms Conversational Voice
                </h3>
                <p className={`mt-1.5 text-xs leading-relaxed ${isMatrixMode ? "font-mono text-emerald-300/80" : "text-gray-400"}`}>
                  Full-duplex WebRTC via LiveKit Agents, Groq LLM reasoning, and Deepgram Nova-3 voice synthesis with natural cutscene skipping.
                </p>
              </div>

              {/* Feature 2 */}
              <div
                className={`rounded-2xl border p-6 transition-all duration-300 ${
                  isMatrixMode
                    ? "border-[#00FF41]/30 bg-[#06110a]/80"
                    : "border-[#222938] bg-gradient-to-b from-[#131924]/80 to-[#0c1017]/90 shadow-xl"
                }`}
              >
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl mb-4 border ${
                    isMatrixMode
                      ? "border-[#00FF41]/50 bg-[#00FF41]/10 text-[#00FF41]"
                      : "border-amber-500/30 bg-amber-500/10 text-amber-400"
                  }`}
                >
                  <Sparkles className="h-5 w-5" />
                </div>
                <h3 className={`text-base font-extrabold ${isMatrixMode ? "font-mono text-[#00FF41]" : "text-white"}`}>
                  Referential Follow-Ups
                </h3>
                <p className={`mt-1.5 text-xs leading-relaxed ${isMatrixMode ? "font-mono text-emerald-300/80" : "text-gray-400"}`}>
                  Ask &ldquo;Who directed the first one?&rdquo;, &ldquo;Which is scarier?&rdquo;, or &ldquo;Compare the two&rdquo; with grounded in-memory awareness.
                </p>
              </div>

              {/* Feature 3 */}
              <div
                className={`rounded-2xl border p-6 transition-all duration-300 ${
                  isMatrixMode
                    ? "border-[#00FF41]/30 bg-[#06110a]/80"
                    : "border-[#222938] bg-gradient-to-b from-[#131924]/80 to-[#0c1017]/90 shadow-xl"
                }`}
              >
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl mb-4 border ${
                    isMatrixMode
                      ? "border-[#00FF41]/50 bg-[#00FF41]/10 text-[#00FF41]"
                      : "border-cyan-500/30 bg-cyan-500/10 text-cyan-400"
                  }`}
                >
                  <Tv className="h-5 w-5" />
                </div>
                <h3 className={`text-base font-extrabold ${isMatrixMode ? "font-mono text-[#00FF41]" : "text-white"}`}>
                  Trailers & Streaming Sync
                </h3>
                <p className={`mt-1.5 text-xs leading-relaxed ${isMatrixMode ? "font-mono text-emerald-300/80" : "text-gray-400"}`}>
                  Integrated with TMDB to synchronize official YouTube trailers and streaming providers (Netflix, Prime, Disney+) live on screen.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Vintage Cinema Footer with 35mm Sprocket Border */}
      <footer
        className={`relative z-10 border-t py-6 text-center text-xs flex flex-col sm:flex-row items-center justify-center gap-3 transition-colors ${
          isMatrixMode
            ? "border-[#00FF41]/20 bg-[#061008] text-emerald-400 font-mono"
            : "border-[#1d2433] bg-[#07090f] text-gray-400"
        }`}
      >
        <span>
          CineBot Cinema &bull; Built with LiveKit Cloud &bull; Groq LPU &bull; Deepgram Nova-3 &bull; TMDB API
        </span>
        <span className="hidden sm:inline">&bull;</span>
        <button
          onClick={() => setIsFairUsageOpen(true)}
          className="text-amber-400 hover:text-amber-300 underline underline-offset-2 transition"
        >
          Fair Usage Policy
        </button>
        <span className="hidden sm:inline">&bull;</span>
        <button
          onClick={() => setIsMatrixMode((prev) => !prev)}
          className="hover:text-white transition"
          title="Toggle Matrix Easter Egg"
        >
          {isMatrixMode ? "[Exit Matrix]" : "[Easter Egg: 🕶️]"}
        </button>
      </footer>
    </main>
  );
}
