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
  Trophy,
  Compass,
  X,
} from "lucide-react";
import { VoiceRoom } from "@/components/VoiceRoom";
import { FairUsageModal } from "@/components/FairUsageModal";
import { MatrixRainCanvas } from "@/components/MatrixRainCanvas";
import { InterstellarCanvas } from "@/components/InterstellarCanvas";
import { StarWarsCrawl } from "@/components/StarWarsCrawl";
import { EasterEggVaultModal } from "@/components/EasterEggVaultModal";
import { EasterEggBanner } from "@/components/EasterEggBanner";
import { EasterEgg, EASTER_EGGS } from "@/types/easterEggs";

export default function Home() {
  const [token, setToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isFairUsageOpen, setIsFairUsageOpen] = useState<boolean>(false);

  // Easter Egg System State
  const [unlockedIds, setUnlockedIds] = useState<string[]>([]);
  const [activeTheme, setActiveTheme] = useState<string | null>(null);
  const [isVaultOpen, setIsVaultOpen] = useState<boolean>(false);
  const [newlyUnlockedEgg, setNewlyUnlockedEgg] = useState<EasterEgg | null>(null);
  const [keyBuffer, setKeyBuffer] = useState<string>("");

  // Clapperboard Take counter
  const [headerTakes, setHeaderTakes] = useState<number>(1);
  const [isClappingHeader, setIsClappingHeader] = useState<boolean>(false);

  // VIP Ticket Stamp Easter Egg
  const [isVipStamped, setIsVipStamped] = useState<boolean>(false);

  // Load unlocked Easter Eggs from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("cinebot_unlocked_reels");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setUnlockedIds(parsed);
        }
      }
    } catch (e) {
      // Ignore storage errors
    }
  }, []);

  // Unlock an Easter Egg & trigger celebration toast
  const unlockEgg = (eggId: string) => {
    const egg = EASTER_EGGS.find((e) => e.id === eggId);
    if (!egg) return;

    setActiveTheme(eggId);

    setUnlockedIds((prev) => {
      if (prev.includes(eggId)) return prev;
      const updated = [...prev, eggId];
      try {
        localStorage.setItem("cinebot_unlocked_reels", JSON.stringify(updated));
      } catch (e) {}
      setNewlyUnlockedEgg(egg);
      return updated;
    });
  };

  // Global keystroke listener for secret cinema keywords
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (e.key === "Escape" && activeTheme) {
        setActiveTheme(null);
        return;
      }

      const updated = (keyBuffer + e.key.toLowerCase()).slice(-10);
      setKeyBuffer(updated);

      for (const egg of EASTER_EGGS) {
        for (const trigger of egg.triggerKey) {
          if (updated.includes(trigger)) {
            unlockEgg(egg.id);
            setKeyBuffer("");
            return;
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [keyBuffer, activeTheme]);

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

  const isMatrix = activeTheme === "matrix";
  const isInterstellar = activeTheme === "interstellar";
  const isFightClub = activeTheme === "fightclub";
  const isGodfather = activeTheme === "godfather";

  return (
    <main
      className={`relative flex min-h-screen flex-col transition-colors duration-700 select-none ${
        isMatrix
          ? "bg-[#050a06] text-[#00FF41]"
          : isInterstellar
          ? "bg-[#04060c] text-amber-200"
          : isGodfather
          ? "bg-[#0e0b08] text-amber-100 theme-godfather"
          : isFightClub
          ? "bg-[#11070e] text-pink-300 theme-fightclub"
          : "bg-[#06070a] text-gray-100"
      }`}
    >
      {/* Easter Egg Dynamic Canvases */}
      <MatrixRainCanvas active={isMatrix} />
      <InterstellarCanvas active={isInterstellar} />
      <StarWarsCrawl
        active={activeTheme === "starwars"}
        onClose={() => setActiveTheme(null)}
      />

      {/* Cinematic Projector Light Beam Cone */}
      <div
        className={`pointer-events-none fixed inset-0 z-0 h-[650px] w-full transition-opacity duration-1000 ${
          isMatrix
            ? "projector-beam-matrix opacity-80"
            : isInterstellar
            ? "projector-beam-interstellar opacity-90"
            : "projector-beam opacity-90"
        }`}
      />

      {/* Fair Usage Policy Modal */}
      <FairUsageModal
        isOpen={isFairUsageOpen}
        onClose={() => setIsFairUsageOpen(false)}
      />

      {/* Easter Egg Vault Modal */}
      <EasterEggVaultModal
        isOpen={isVaultOpen}
        onClose={() => setIsVaultOpen(false)}
        unlockedIds={unlockedIds}
        activeTheme={activeTheme}
        onSelectTheme={(id) => setActiveTheme(id)}
      />

      {/* Achievement Banner Toast when unlocking an Easter Egg */}
      <EasterEggBanner
        unlockedEgg={newlyUnlockedEgg}
        onDismiss={() => setNewlyUnlockedEgg(null)}
        totalUnlocked={unlockedIds.length}
      />

      {/* Floating Active Theme Bar */}
      {activeTheme && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 rounded-full border border-amber-400/50 bg-black/85 px-4 py-1.5 text-xs font-mono font-bold text-amber-300 shadow-2xl backdrop-blur-md animate-fade-in">
          <span>THEME ACTIVE: &ldquo;{activeTheme.toUpperCase()}&rdquo;</span>
          <span className="text-gray-500">&bull;</span>
          <button
            onClick={() => setActiveTheme(null)}
            className="rounded bg-white/10 px-2 py-0.5 text-[10px] text-white hover:bg-white/20 transition"
          >
            DEFAULT CINEMA
          </button>
        </div>
      )}

      {/* Grand Cinema Marquee Header */}
      <header
        className={`sticky top-0 z-30 flex flex-col border-b backdrop-blur-md transition-all duration-500 ${
          isMatrix
            ? "border-[#00FF41]/30 bg-[#051309]/90"
            : isInterstellar
            ? "border-amber-500/30 bg-[#070b16]/90"
            : "border-[#1c2436] bg-[#080b12]/90 shadow-2xl shadow-black/80"
        }`}
      >
        {/* Top Marquee Bulb Chaser Bar */}
        <div className="flex justify-between items-center px-4 py-1.5 border-b border-white/5 text-[10px] font-mono tracking-widest text-amber-400 bg-black/60 select-none overflow-hidden">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-amber-400 animate-bulb-odd shadow-sm shadow-amber-400" />
            <span className="inline-block h-2 w-2 rounded-full bg-red-500 animate-bulb-even shadow-sm shadow-red-500" />
            <span className="font-extrabold text-white">NOW SHOWING</span>
            <span className="hidden sm:inline text-gray-400">• SCREEN 1: 35MM STEREO DOLBY</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Clapperboard Take Counter */}
            <button
              onClick={snapHeaderClapper}
              className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded border transition-transform ${
                isClappingHeader ? "scale-95" : ""
              } ${
                isMatrix
                  ? "border-[#00FF41]/40 bg-[#00FF41]/10 text-[#00FF41]"
                  : "border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
              }`}
              title="Click to snap the Director's Clapperboard!"
            >
              <Clapperboard className="h-3 w-3 text-amber-400" />
              <span>TAKE {headerTakes.toString().padStart(2, "0")}</span>
            </button>

            {/* Secret Easter Egg Vault Trigger & Discovery Counter */}
            <button
              onClick={() => setIsVaultOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-0.5 rounded-full border transition font-mono font-bold ${
                unlockedIds.length > 0
                  ? "border-amber-400/80 bg-amber-400/15 text-amber-300 shadow-md shadow-amber-400/20"
                  : "border-white/10 bg-white/5 text-gray-400 hover:text-white"
              }`}
              title="View secret cinema easter egg vault"
            >
              <Trophy className="h-3 w-3 text-amber-400" />
              <span>
                VAULT: {unlockedIds.length}/5 FOUND
              </span>
            </button>
          </div>
        </div>

        {/* Main Cinema Navigation Bar */}
        <div className="flex items-center justify-between px-6 py-4 lg:px-12">
          {/* Logo & Cinema Branding */}
          <div className="flex items-center gap-3.5">
            <div
              className={`group flex h-12 w-12 items-center justify-center rounded-2xl border transition-all duration-500 shadow-xl ${
                isMatrix
                  ? "border-[#00FF41] bg-[#00FF41]/20 text-[#00FF41] shadow-[#00FF41]/30"
                  : isInterstellar
                  ? "border-amber-400 bg-amber-400/20 text-amber-300 shadow-amber-400/30"
                  : "border-amber-500/40 bg-gradient-to-br from-red-600 to-amber-600 text-white shadow-red-700/40"
              }`}
            >
              <Film className="h-6 w-6 spin-reel" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1
                  className={`text-2xl font-black tracking-wider uppercase ${
                    isMatrix
                      ? "font-mono text-[#00FF41] matrix-text-glow"
                      : isInterstellar
                      ? "font-mono text-amber-300"
                      : "text-white drop-shadow-[0_2px_10px_rgba(229,9,20,0.5)]"
                  }`}
                >
                  CineBot
                </h1>
                <span
                  className={`rounded-md px-2.5 py-0.5 text-[10px] font-extrabold font-mono tracking-wider border ${
                    isMatrix
                      ? "border-[#00FF41]/40 bg-[#00FF41]/15 text-[#00FF41]"
                      : isInterstellar
                      ? "border-amber-400/40 bg-amber-400/15 text-amber-300"
                      : "border-amber-500/30 bg-amber-500/10 text-amber-300"
                  }`}
                >
                  {isMatrix ? "OPERATOR" : isInterstellar ? "TESSERACT" : "35MM THEATER"}
                </span>
              </div>
              <p
                className={`text-[11px] ${
                  isMatrix
                    ? "font-mono text-emerald-400"
                    : isInterstellar
                    ? "font-mono text-amber-200/80"
                    : "text-gray-400"
                }`}
              >
                Conversational Cinema Sommelier • Powered by LiveKit
              </p>
            </div>
          </div>

          {/* Right Navigation & Status Stubs */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Vintage Ticket Stub (Interactive Easter Egg) */}
            <div
              onClick={() => setIsVipStamped((prev) => !prev)}
              className={`hidden sm:flex relative cursor-pointer items-center gap-2 rounded-xl border px-3.5 py-2 transition select-none ${
                isVipStamped
                  ? "border-amber-400 bg-amber-400/20 text-amber-300 shadow-xl shadow-amber-400/20"
                  : "border-[#252f44] bg-[#0c1018] text-gray-300 hover:border-amber-500/50"
              }`}
              title="Click to stamp your cinema ticket!"
            >
              <Ticket className="h-4 w-4 text-amber-400" />
              <div className="flex flex-col text-left">
                <span className="text-[11px] font-mono font-bold leading-none">
                  {isVipStamped ? "VIP CRITIC PASS ★" : "ADMIT ONE // ROW C"}
                </span>
                <span className="text-[9px] text-gray-500 font-mono mt-0.5">
                  SEAT 14 &bull; LIVEKIT
                </span>
              </div>
            </div>

            {/* Fair Usage Modal Button */}
            <button
              onClick={() => setIsFairUsageOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-[#252f44] bg-[#0c1018] px-3.5 py-2 text-xs font-medium text-gray-300 hover:text-white hover:border-red-500/40 transition"
            >
              <ShieldCheck className="h-4 w-4 text-red-400" />
              <span className="hidden sm:inline">Fair Usage</span>
            </button>

            {token && (
              <button
                onClick={handleDisconnect}
                className="text-xs font-bold text-red-400 hover:text-red-300 transition px-2 py-1"
              >
                Exit Room
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Theater Stage */}
      <div className="relative z-10 flex flex-1 flex-col px-4 sm:px-6 py-8 lg:px-12 max-w-7xl mx-auto w-full">
        {token && serverUrl ? (
          <VoiceRoom
            token={token}
            serverUrl={serverUrl}
            activeTheme={activeTheme}
            onDisconnect={handleDisconnect}
          />
        ) : (
          <div className="flex flex-col items-center justify-center flex-1 my-auto text-center space-y-10 py-10">
            {/* Cinema Stage Header Marquee Badge */}
            <div
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-mono font-bold tracking-wider ${
                isMatrix
                  ? "border-[#00FF41]/50 bg-[#00FF41]/10 text-[#00FF41] matrix-box-glow"
                  : isInterstellar
                  ? "border-amber-400/50 bg-amber-400/10 text-amber-300"
                  : "border-amber-500/30 bg-amber-500/10 text-amber-300 shadow-lg shadow-amber-500/10"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>
                {isMatrix
                  ? "NEO // LIVE VOICE INTERACTION"
                  : isInterstellar
                  ? "GARGANTUA // REAL-TIME CONVERSATIONAL LINK"
                  : "PREMIERE: REAL-TIME CONVERSATIONAL CINEMA"}
              </span>
            </div>

            {/* Cinema Title Heading */}
            <div className="space-y-4 max-w-3xl">
              <h2
                className={`text-4xl font-black tracking-tight sm:text-6xl ${
                  isMatrix
                    ? "font-mono text-[#00FF41] matrix-text-glow uppercase"
                    : isInterstellar
                    ? "font-mono text-amber-300 drop-shadow-[0_0_20px_rgba(245,158,11,0.5)]"
                    : "text-white"
                }`}
              >
                {isMatrix ? (
                  <>
                    WAKE UP, MOVIE LOVER. <br />
                    <span className="text-white">THE MATRIX HAS YOU.</span>
                  </>
                ) : isInterstellar ? (
                  <>
                    LOVE TRANSCENDS DIMENSIONS. <br />
                    <span className="text-white">FIND YOUR NEXT MASTERPIECE.</span>
                  </>
                ) : (
                  <>
                    Step inside the theater. <br />
                    <span className="bg-gradient-to-r from-red-500 via-amber-400 to-yellow-300 bg-clip-text text-transparent drop-shadow-sm">
                      Talk to your personal Sommelier.
                    </span>
                  </>
                )}
              </h2>
              <p
                className={`text-base sm:text-lg max-w-2xl mx-auto leading-relaxed ${
                  isMatrix
                    ? "font-mono text-emerald-300/90"
                    : isInterstellar
                    ? "font-mono text-amber-100/90"
                    : "text-gray-300"
                }`}
              >
                No endless scrolling. No text walls. Ask for mood, eras, actors, or follow-ups like{" "}
                <span className="italic font-bold text-white">&ldquo;Who directed the second one?&rdquo;</span> or{" "}
                <span className="italic font-bold text-white">&ldquo;Compare the first two&rdquo;</span>.
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
                className={`group relative inline-flex items-center gap-3.5 overflow-hidden rounded-2xl px-8 py-4.5 text-base font-black tracking-wide shadow-2xl active:scale-95 transition-all duration-300 disabled:opacity-50 ${
                  isMatrix
                    ? "bg-[#00FF41] text-black hover:bg-[#00cc33] shadow-[#00FF41]/40 font-mono"
                    : isInterstellar
                    ? "bg-amber-400 text-black hover:bg-amber-300 shadow-amber-400/40 font-mono"
                    : "bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white shadow-red-600/40 hover:brightness-110"
                }`}
              >
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${
                    isMatrix ? "bg-black/20" : "bg-white/20 group-hover:scale-110"
                  }`}
                >
                  <Mic className="h-5 w-5 fill-current" />
                </div>
                <span>
                  {isConnecting
                    ? isMatrix
                      ? "JACKING INTO LIVEKIT ROOM..."
                      : "Connecting to Theater Soundstage..."
                    : isMatrix
                    ? "ENTER THE CONSTRUCT"
                    : "Start Voice Conversation"}
                </span>
              </button>

              <button
                onClick={() => setIsFairUsageOpen(true)}
                className={`text-[11px] underline underline-offset-4 transition ${
                  isMatrix
                    ? "font-mono text-emerald-400/80 hover:text-[#00FF41]"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                10-min session cap • 6 sessions/15m • Fair Usage Policy
              </button>
            </div>

            {/* Interactive Cinema Feature Stalls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-10 max-w-4xl w-full text-left">
              <div
                className={`rounded-2xl border p-6 transition-all duration-300 ${
                  isMatrix
                    ? "border-[#00FF41]/30 bg-[#051309]/80"
                    : isInterstellar
                    ? "border-amber-500/30 bg-[#070b16]/80"
                    : "border-[#1e2738] bg-gradient-to-b from-[#111724]/80 to-[#090d14]/90 shadow-xl"
                }`}
              >
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl mb-4 border ${
                    isMatrix
                      ? "border-[#00FF41]/50 bg-[#00FF41]/10 text-[#00FF41]"
                      : isInterstellar
                      ? "border-amber-400/50 bg-amber-400/10 text-amber-300"
                      : "border-red-500/30 bg-red-600/10 text-red-400"
                  }`}
                >
                  <Zap className="h-5 w-5" />
                </div>
                <h3
                  className={`text-base font-extrabold ${
                    isMatrix ? "font-mono text-[#00FF41]" : "text-white"
                  }`}
                >
                  Sub-300ms Conversational Voice
                </h3>
                <p
                  className={`mt-1.5 text-xs leading-relaxed ${
                    isMatrix ? "font-mono text-emerald-300/80" : "text-gray-400"
                  }`}
                >
                  Full-duplex WebRTC via LiveKit Agents, Groq LLM reasoning, and Deepgram Nova-3 voice synthesis with natural cutscene skipping.
                </p>
              </div>

              <div
                className={`rounded-2xl border p-6 transition-all duration-300 ${
                  isMatrix
                    ? "border-[#00FF41]/30 bg-[#051309]/80"
                    : isInterstellar
                    ? "border-amber-500/30 bg-[#070b16]/80"
                    : "border-[#1e2738] bg-gradient-to-b from-[#111724]/80 to-[#090d14]/90 shadow-xl"
                }`}
              >
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl mb-4 border ${
                    isMatrix
                      ? "border-[#00FF41]/50 bg-[#00FF41]/10 text-[#00FF41]"
                      : isInterstellar
                      ? "border-amber-400/50 bg-amber-400/10 text-amber-300"
                      : "border-amber-500/30 bg-amber-500/10 text-amber-400"
                  }`}
                >
                  <Sparkles className="h-5 w-5" />
                </div>
                <h3
                  className={`text-base font-extrabold ${
                    isMatrix ? "font-mono text-[#00FF41]" : "text-white"
                  }`}
                >
                  Referential Follow-Ups
                </h3>
                <p
                  className={`mt-1.5 text-xs leading-relaxed ${
                    isMatrix ? "font-mono text-emerald-300/80" : "text-gray-400"
                  }`}
                >
                  Ask &ldquo;Who directed the first one?&rdquo;, &ldquo;Which is scarier?&rdquo;, or &ldquo;Compare the two&rdquo; with grounded in-memory awareness.
                </p>
              </div>

              <div
                className={`rounded-2xl border p-6 transition-all duration-300 ${
                  isMatrix
                    ? "border-[#00FF41]/30 bg-[#051309]/80"
                    : isInterstellar
                    ? "border-amber-500/30 bg-[#070b16]/80"
                    : "border-[#1e2738] bg-gradient-to-b from-[#111724]/80 to-[#090d14]/90 shadow-xl"
                }`}
              >
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl mb-4 border ${
                    isMatrix
                      ? "border-[#00FF41]/50 bg-[#00FF41]/10 text-[#00FF41]"
                      : isInterstellar
                      ? "border-amber-400/50 bg-amber-400/10 text-amber-300"
                      : "border-cyan-500/30 bg-cyan-500/10 text-cyan-400"
                  }`}
                >
                  <Tv className="h-5 w-5" />
                </div>
                <h3
                  className={`text-base font-extrabold ${
                    isMatrix ? "font-mono text-[#00FF41]" : "text-white"
                  }`}
                >
                  Trailers &amp; Streaming Sync
                </h3>
                <p
                  className={`mt-1.5 text-xs leading-relaxed ${
                    isMatrix ? "font-mono text-emerald-300/80" : "text-gray-400"
                  }`}
                >
                  Integrated with TMDB to synchronize official YouTube trailers and streaming providers (Netflix, Prime, Disney+) live on screen.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Vintage Cinema Footer with 35mm Sprocket Perforations */}
      <footer
        className={`relative z-10 border-t py-6 text-center text-xs flex flex-col sm:flex-row items-center justify-center gap-3 transition-colors ${
          isMatrix
            ? "border-[#00FF41]/20 bg-[#051008] text-emerald-400 font-mono"
            : isInterstellar
            ? "border-amber-500/20 bg-[#050810] text-amber-300 font-mono"
            : "border-[#1c2436] bg-[#07090f] text-gray-400"
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
          onClick={() => setIsVaultOpen(true)}
          className="hover:text-amber-300 transition flex items-center gap-1 font-mono"
        >
          <Trophy className="h-3 w-3 text-amber-400" />
          <span>Secret Vault ({unlockedIds.length}/5)</span>
        </button>
      </footer>
    </main>
  );
}
