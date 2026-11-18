"use client";

import React, { useState, useEffect } from "react";
import {
  Mic,
  Film,
  Sparkles,
  ShieldCheck,
  Ticket,
  Trophy,
  Compass,
  Star,
  Clapperboard,
  Tv,
} from "lucide-react";
import { VoiceRoom } from "@/components/VoiceRoom";
import { FairUsageModal } from "@/components/FairUsageModal";
import { MatrixRainCanvas } from "@/components/MatrixRainCanvas";
import { InterstellarCanvas } from "@/components/InterstellarCanvas";
import { StarWarsCrawl } from "@/components/StarWarsCrawl";
import { EasterEggVaultModal } from "@/components/EasterEggVaultModal";
import { EasterEggBanner } from "@/components/EasterEggBanner";
import { MovieCard } from "@/components/MovieCard";
import { TrailerModal } from "@/components/TrailerModal";
import { StreamingModal } from "@/components/StreamingModal";
import { PREMIERE_SHOWCASE } from "@/data/premiereMovies";
import { EasterEgg, EASTER_EGGS } from "@/types/easterEggs";
import { MovieDetails } from "@/types/movie";

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

  // Modals on landing page showcase
  const [activeTrailer, setActiveTrailer] = useState<{ key: string; title: string } | null>(null);
  const [activeDetails, setActiveDetails] = useState<MovieDetails | null>(null);

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

  // Global keystroke listener for desktop power users
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

  const handleWatchTrailer = async (movieId: number, title: string) => {
    try {
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
  };

  const handleCheckProviders = async (movieId: number) => {
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
      {/* Easter Egg Background Canvases */}
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

      {/* Easter Egg Treasure Hunt Vault Modal */}
      <EasterEggVaultModal
        isOpen={isVaultOpen}
        onClose={() => setIsVaultOpen(false)}
        unlockedIds={unlockedIds}
        activeTheme={activeTheme}
        onSelectTheme={(id) => setActiveTheme(id)}
        onSolveEgg={(id) => unlockEgg(id)}
      />

      {/* Achievement Banner Toast */}
      <EasterEggBanner
        unlockedEgg={newlyUnlockedEgg}
        onDismiss={() => setNewlyUnlockedEgg(null)}
        totalUnlocked={unlockedIds.length}
      />

      {/* Active Theme Bar */}
      {activeTheme && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 rounded-full border border-amber-400/50 bg-black/90 px-4 py-1.5 text-xs font-mono font-bold text-amber-300 shadow-2xl backdrop-blur-md animate-fade-in">
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

      {/* 1. Vintage Cinema Marquee Header */}
      <header
        className={`sticky top-0 z-30 flex flex-col border-b backdrop-blur-md transition-all duration-500 ${
          isMatrix
            ? "border-[#00FF41]/30 bg-[#051309]/90"
            : isInterstellar
            ? "border-amber-500/30 bg-[#070b16]/90"
            : "border-[#1c2436] bg-[#080b12]/95 shadow-2xl shadow-black/90"
        }`}
      >
        {/* Top Incandescent Bulb Chaser Bar */}
        <div className="flex justify-between items-center px-4 py-1.5 border-b border-white/5 text-[10px] font-mono tracking-widest text-amber-400 bg-black/75 select-none overflow-hidden">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-amber-400 animate-bulb-odd shadow-sm shadow-amber-400" />
            <span className="inline-block h-2 w-2 rounded-full bg-red-500 animate-bulb-even shadow-sm shadow-red-500" />
            <span className="font-extrabold text-white">NOW SCREENING</span>
            <span className="hidden sm:inline text-gray-400">• AUDITORIUM 1: 35MM STEREO DOLBY</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Interactive Treasure Hunt Button (Accessible on Mobile & Desktop!) */}
            <button
              onClick={() => setIsVaultOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition font-mono font-bold text-[11px] ${
                unlockedIds.length > 0
                  ? "border-amber-400 bg-amber-400/20 text-amber-300 shadow-md shadow-amber-400/30 animate-pulse"
                  : "border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
              }`}
              title="Open Easter Egg Treasure Hunt to solve film clues"
            >
              <Trophy className="h-3.5 w-3.5 text-amber-400" />
              <span>TREASURE HUNT: {unlockedIds.length}/5</span>
            </button>
          </div>
        </div>

        {/* Main Cinema Navigation Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 lg:px-12">
          {/* Logo & Cinema Branding */}
          <div className="flex items-center gap-3.5">
            <div
              className={`group flex h-11 w-11 items-center justify-center rounded-2xl border transition-all duration-500 shadow-xl ${
                isMatrix
                  ? "border-[#00FF41] bg-[#00FF41]/20 text-[#00FF41] shadow-[#00FF41]/30"
                  : isInterstellar
                  ? "border-amber-400 bg-amber-400/20 text-amber-300 shadow-amber-400/30"
                  : "border-amber-500/40 bg-gradient-to-br from-red-600 via-rose-600 to-amber-600 text-white shadow-red-700/40"
              }`}
            >
              <Film className="h-5 w-5 spin-reel" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1
                  className={`text-2xl font-black tracking-wider uppercase ${
                    isMatrix
                      ? "font-mono text-[#00FF41] matrix-text-glow"
                      : isInterstellar
                      ? "font-mono text-amber-300"
                      : "text-white font-cinzel drop-shadow-[0_2px_10px_rgba(229,9,20,0.5)]"
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
                Conversational Cinema Sommelier &bull; Powered by LiveKit
              </p>
            </div>
          </div>

          {/* Right Navigation & Status Stubs */}
          <div className="flex items-center gap-3">
            {/* Vintage Ticket Stub (Interactive Easter Egg) */}
            <div
              onClick={() => setIsVipStamped((prev) => !prev)}
              className={`hidden md:flex relative cursor-pointer items-center gap-2.5 rounded-xl border px-3.5 py-2 transition select-none ${
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
                  SEAT 14 &bull; LIVE WEBRTC
                </span>
              </div>
            </div>

            {/* Fair Usage Policy */}
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

      {/* Main Stage */}
      <div className="relative z-10 flex flex-1 flex-col px-4 sm:px-6 py-8 lg:px-12 max-w-7xl mx-auto w-full">
        {token && serverUrl ? (
          <VoiceRoom
            token={token}
            serverUrl={serverUrl}
            activeTheme={activeTheme}
            onDisconnect={handleDisconnect}
          />
        ) : (
          <div className="flex flex-col items-center justify-center space-y-12 py-6">
            {/* The Centerpiece: Physical Golden Admission Ticket Stub */}
            <div className="relative w-full max-w-2xl rounded-3xl border border-amber-500/50 bg-gradient-to-b from-[#181c26] via-[#10141d] to-[#0a0d14] p-6 sm:p-9 shadow-2xl shadow-black/95 overflow-hidden">
              {/* Ticket Jagged Perforations along borders */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-[#06070a] border-b border-amber-500/40" />
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-[#06070a] border-t border-amber-500/40" />

              <div className="flex flex-col items-center text-center space-y-6">
                {/* Header Ticket Badge */}
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-4 py-1.5 text-xs font-mono font-bold tracking-wider text-amber-300">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>★ CINEBOT GRAND PREMIERE ENGAGEMENT ★</span>
                </div>

                {/* Ticket Title */}
                <div className="space-y-3">
                  <h2 className="text-3xl sm:text-5xl font-black text-white font-cinzel tracking-tight leading-tight">
                    Step inside the auditorium. <br />
                    <span className="bg-gradient-to-r from-red-500 via-amber-400 to-yellow-300 bg-clip-text text-transparent">
                      Converse with your AI Sommelier.
                    </span>
                  </h2>
                  <p className="text-sm sm:text-base text-gray-300 max-w-xl mx-auto leading-relaxed">
                    No endless scrolling. No text walls. Speak freely for genres, actors, or follow-ups like{" "}
                    <span className="italic font-bold text-white">&ldquo;Who directed the second one?&rdquo;</span> or{" "}
                    <span className="italic font-bold text-white">&ldquo;Compare the first two&rdquo;</span>.
                    Movie posters and streaming options project onto your screen live as CineBot speaks.
                  </p>
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="w-full rounded-2xl border border-red-500/50 bg-red-500/10 p-4 text-xs text-red-300 flex items-start gap-3 text-left">
                    <ShieldCheck className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                    <p className="text-red-300/90 leading-relaxed">{error}</p>
                  </div>
                )}

                {/* Main Action Ticket Punch Button */}
                <div className="flex flex-col items-center gap-3 pt-2 w-full max-w-md">
                  <button
                    onClick={startVoiceChat}
                    disabled={isConnecting}
                    className="w-full group relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 px-8 py-4.5 text-base font-black tracking-wide text-white shadow-2xl shadow-red-600/40 hover:brightness-110 active:scale-95 transition-all duration-300 disabled:opacity-50"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 group-hover:scale-110 transition">
                      <Mic className="h-5 w-5 fill-current" />
                    </div>
                    <span>
                      {isConnecting
                        ? "CONNECTING TO SOUNDSTAGE..."
                        : "PUNCH TICKET & ENTER AUDITORIUM"}
                    </span>
                  </button>

                  <div className="flex items-center gap-2 text-[11px] font-mono text-gray-400">
                    <span>10-min session cap</span>
                    <span>&bull;</span>
                    <span>6 sessions/15m</span>
                    <span>&bull;</span>
                    <button
                      onClick={() => setIsFairUsageOpen(true)}
                      className="underline hover:text-white transition"
                    >
                      Fair Usage Policy
                    </button>
                  </div>
                </div>

                {/* Mobile Treasure Hunt Callout Banner */}
                <div className="w-full pt-2">
                  <button
                    onClick={() => setIsVaultOpen(true)}
                    className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/15 transition text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/40 shrink-0">
                        <Trophy className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span>Cinema Treasure Hunt</span>
                          <span className="rounded-full bg-amber-400/20 px-2 py-0.2 text-[10px] text-amber-300 font-mono">
                            {unlockedIds.length}/5 Discovered
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400">
                          Solve 5 film riddles (Matrix, Interstellar, &amp; more) to unlock secret themes!
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-amber-300 shrink-0">HUNT &rarr;</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 2. Sommelier's Curated Showcase Reel (Screen is NEVER empty!) */}
            <div className="w-full space-y-6 pt-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-400">
                    <Film className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white font-cinzel">
                      Sommelier&apos;s Featured Showcase
                    </h3>
                    <p className="text-xs text-gray-400">
                      Explore trending masterpieces or start a voice session above to tailor picks to your taste!
                    </p>
                  </div>
                </div>
              </div>

              {/* Showcase Movie Cards Grid */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {PREMIERE_SHOWCASE.map((movie, idx) => (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                    index={idx}
                    activeTheme={activeTheme}
                    onWatchTrailer={handleWatchTrailer}
                    onCheckProviders={handleCheckProviders}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
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
          className="hover:text-amber-300 transition flex items-center gap-1 font-mono font-bold text-amber-400"
        >
          <Trophy className="h-3.5 w-3.5" />
          <span>Treasure Hunt ({unlockedIds.length}/5)</span>
        </button>
      </footer>
    </main>
  );
}
