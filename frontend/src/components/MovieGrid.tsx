"use client";

import React from "react";
import { Sparkles, Film, Clapperboard } from "lucide-react";
import { MovieItem } from "@/types/movie";
import { MovieCard } from "./MovieCard";

interface MovieGridProps {
  movies: MovieItem[];
  title?: string;
  isMatrixMode?: boolean;
  onWatchTrailer?: (movieId: number, title: string) => void;
  onCheckProviders?: (movieId: number) => void;
}

export function MovieGrid({
  movies,
  title = "Live Recommendations",
  isMatrixMode = false,
  onWatchTrailer,
  onCheckProviders,
}: MovieGridProps) {
  if (movies.length === 0) {
    return (
      <div
        className={`flex flex-col items-center justify-center rounded-3xl border border-dashed p-12 text-center transition ${
          isMatrixMode
            ? "border-[#00FF41]/30 bg-[#06110a]/50 text-[#00FF41]"
            : "border-[#222938] bg-[#0c1017]/60 text-gray-400"
        }`}
      >
        <div
          className={`flex h-16 w-16 items-center justify-center rounded-2xl border ${
            isMatrixMode
              ? "border-[#00FF41]/40 bg-[#00FF41]/10 text-[#00FF41]"
              : "border-white/10 bg-white/5 text-gray-400"
          }`}
        >
          <Clapperboard className="h-8 w-8 stroke-[1.5]" />
        </div>
        <h4 className="mt-4 text-base font-bold tracking-tight text-white">
          {isMatrixMode ? "CONSTRUCT EMPTY: AWAITING QUERY" : "The Projection Screen is Dark"}
        </h4>
        <p className="mt-1 max-w-sm text-xs text-gray-400">
          {isMatrixMode
            ? "Speak into the receiver or transmit text to load cinematic programs into memory."
            : "Ask CineBot for any vibe, actor, or genre (e.g. 'Show me 90s sci-fi thrillers') to illuminate the screen!"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-lg border ${
              isMatrixMode
                ? "border-[#00FF41]/50 bg-[#00FF41]/20 text-[#00FF41]"
                : "border-amber-500/40 bg-amber-500/10 text-amber-400"
            }`}
          >
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2
                className={`text-lg sm:text-xl font-extrabold tracking-wide ${
                  isMatrixMode ? "font-mono text-[#00FF41] matrix-text-glow" : "text-white"
                }`}
              >
                {title}
              </h2>
              <span
                className={`rounded-md px-2 py-0.5 text-xs font-mono font-bold border ${
                  isMatrixMode
                    ? "border-[#00FF41]/40 bg-[#00FF41]/15 text-[#00FF41]"
                    : "border-white/10 bg-white/10 text-gray-300"
                }`}
              >
                {movies.length} {movies.length === 1 ? "TITLE" : "TITLES"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {movies.map((movie, idx) => (
          <MovieCard
            key={movie.id}
            movie={movie}
            index={idx}
            isMatrixMode={isMatrixMode}
            onWatchTrailer={onWatchTrailer}
            onCheckProviders={onCheckProviders}
          />
        ))}
      </div>
    </div>
  );
}
