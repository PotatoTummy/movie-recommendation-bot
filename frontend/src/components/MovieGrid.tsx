"use client";

import React from "react";
import { Sparkles, Film } from "lucide-react";
import { MovieItem } from "@/types/movie";
import { PREMIERE_SHOWCASE } from "@/data/premiereMovies";
import { MovieCard } from "./MovieCard";

interface MovieGridProps {
  movies: MovieItem[];
  title?: string;
  activeTheme?: string | null;
  onWatchTrailer?: (movieId: number, title: string) => void;
  onCheckProviders?: (movieId: number) => void;
}

export function MovieGrid({
  movies,
  title = "Now Showing",
  activeTheme = null,
  onWatchTrailer,
  onCheckProviders,
}: MovieGridProps) {
  const isMatrix = activeTheme === "matrix";
  const isInterstellar = activeTheme === "interstellar";
  const isFightClub = activeTheme === "fightclub";

  // If movies is somehow empty, display PREMIERE_SHOWCASE so screen is never dark!
  const displayMovies = movies.length > 0 ? movies : PREMIERE_SHOWCASE;
  const displayTitle = movies.length > 0 ? title : "Sommelier's Curated Showcase";

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Curved Screen Marquee Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-lg border ${
              isMatrix
                ? "border-[#00FF41]/50 bg-[#00FF41]/20 text-[#00FF41]"
                : isInterstellar
                ? "border-amber-400/50 bg-amber-400/20 text-amber-400"
                : isFightClub
                ? "border-pink-500/50 bg-pink-500/20 text-pink-400"
                : "border-amber-500/40 bg-amber-500/10 text-amber-400"
            }`}
          >
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2
                className={`text-lg sm:text-xl font-extrabold tracking-wide ${
                  isMatrix
                    ? "font-mono text-[#00FF41] matrix-text-glow"
                    : isInterstellar
                    ? "font-mono text-amber-300"
                    : "text-white font-cinzel"
                }`}
              >
                {displayTitle}
              </h2>
              <span
                className={`rounded-md px-2 py-0.5 text-xs font-mono font-bold border ${
                  isMatrix
                    ? "border-[#00FF41]/40 bg-[#00FF41]/15 text-[#00FF41]"
                    : "border-white/10 bg-white/10 text-gray-300"
                }`}
              >
                {displayMovies.length} REELS
              </span>
            </div>
            <p className="text-xs text-gray-400">
              {movies.length > 0
                ? "Live recommendations projected from your conversational query."
                : "Auditorium loaded with premiere selections. Speak or ask follow-ups anytime!"}
            </p>
          </div>
        </div>
      </div>

      {/* Auditorium Projection Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {displayMovies.map((movie, idx) => (
          <MovieCard
            key={`${movie.id}-${idx}`}
            movie={movie}
            index={idx}
            activeTheme={activeTheme}
            onWatchTrailer={onWatchTrailer}
            onCheckProviders={onCheckProviders}
          />
        ))}
      </div>
    </div>
  );
}
