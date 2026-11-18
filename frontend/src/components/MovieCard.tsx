"use client";

import React, { useState } from "react";
import { Star, Play, Tv, Film, Sparkles } from "lucide-react";
import { MovieItem } from "@/types/movie";

interface MovieCardProps {
  movie: MovieItem;
  index?: number;
  activeTheme?: string | null;
  onWatchTrailer?: (movieId: number, title: string) => void;
  onCheckProviders?: (movieId: number) => void;
}

export function MovieCard({
  movie,
  index = 0,
  activeTheme = null,
  onWatchTrailer,
  onCheckProviders,
}: MovieCardProps) {
  const year = movie.release_date ? movie.release_date.split("-")[0] : null;
  const [isHovered, setIsHovered] = useState(false);

  const isMatrix = activeTheme === "matrix";
  const isInterstellar = activeTheme === "interstellar";
  const isFightClub = activeTheme === "fightclub";
  const isGodfather = activeTheme === "godfather";

  // Cinema classification tag based on rating
  const certTag = movie.rating >= 7.5 ? "PG-13" : "PG";

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group relative flex flex-col overflow-hidden rounded-2xl border transition-all duration-500 hover:-translate-y-2 select-none ${
        isMatrix
          ? "border-[#00FF41]/40 bg-[#051309] text-[#00FF41] hover:border-[#00FF41] hover:shadow-[0_0_30px_rgba(0,255,65,0.35)]"
          : isInterstellar
          ? "border-amber-500/40 bg-[#080d1a] text-amber-200 hover:border-amber-400 hover:shadow-[0_0_30px_rgba(245,158,11,0.35)]"
          : isFightClub
          ? "border-pink-500/50 bg-[#160c14] text-pink-300 hover:border-pink-400 hover:shadow-[0_0_30px_rgba(236,72,153,0.35)]"
          : isGodfather
          ? "border-amber-900/60 bg-[#16120c] text-amber-100 hover:border-amber-600 hover:shadow-[0_0_30px_rgba(180,83,9,0.35)]"
          : "border-[#1e2738] bg-gradient-to-b from-[#131926] via-[#0d121c] to-[#080b10] text-gray-200 hover:border-amber-500/70 hover:shadow-2xl hover:shadow-black/90"
      }`}
    >
      {/* 35mm Film Sprocket Ribbon on top of card */}
      <div
        className={`h-3 w-full border-b ${
          isMatrix
            ? "border-[#00FF41]/30 bg-[#021f0b] film-sprockets-h opacity-70"
            : isInterstellar
            ? "border-amber-500/30 bg-[#0a1122] film-sprockets-h opacity-70"
            : isFightClub
            ? "border-pink-500/30 bg-[#250d1d] film-sprockets-h opacity-70"
            : "border-[#20293b] bg-[#0a0e16] film-sprockets-h opacity-60"
        }`}
      />

      {/* Poster Image Frame */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-black">
        {movie.poster_url ? (
          <img
            src={movie.poster_url}
            alt={movie.title}
            className={`h-full w-full object-cover transition-all duration-700 ${
              isHovered ? "scale-105" : "scale-100"
            } ${
              isMatrix
                ? "hue-rotate-[85deg] saturate-150 contrast-110"
                : isGodfather
                ? "sepia-[0.6] contrast-110"
                : ""
            }`}
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-950 text-gray-700">
            <Film className="h-12 w-12 stroke-[1.5]" />
          </div>
        )}

        {/* Vintage Order Number Tag (e.g. #1, #2) for clear referential follow-ups */}
        <div
          className={`absolute top-2.5 left-2.5 flex items-center justify-center h-6 w-6 rounded-md font-mono text-[11px] font-black shadow-lg ${
            isMatrix
              ? "bg-[#00FF41] text-black shadow-[#00FF41]/40"
              : isInterstellar
              ? "bg-amber-400 text-black shadow-amber-400/40"
              : isFightClub
              ? "bg-pink-500 text-white shadow-pink-500/40"
              : "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-red-600/50"
          }`}
          title={`Movie #${index + 1}`}
        >
          #{index + 1}
        </div>

        {/* Certificate Tag (PG / PG-13) */}
        <div className="absolute bottom-2.5 left-2.5 rounded bg-black/80 px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase text-gray-300 border border-white/10 backdrop-blur-md">
          {certTag}
        </div>

        {/* Golden Cinema Rating & Release Year */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 rounded-full bg-black/85 px-2.5 py-1 text-xs font-semibold backdrop-blur-md border border-white/15 shadow-md">
          <Star
            className={`h-3.5 w-3.5 fill-current ${
              isMatrix
                ? "text-[#00FF41]"
                : isFightClub
                ? "text-pink-400"
                : "text-amber-400"
            }`}
          />
          <span
            className={
              isMatrix
                ? "text-[#00FF41] font-mono"
                : isFightClub
                ? "text-pink-300 font-mono"
                : "text-amber-300 font-mono font-bold"
            }
          >
            {movie.rating.toFixed(1)}
          </span>
          {year && <span className="text-gray-400 text-[10px] ml-0.5">({year})</span>}
        </div>
      </div>

      {/* Movie Details (Cinema Lobby Card Style) */}
      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          <h3
            className={`line-clamp-1 text-base font-extrabold tracking-tight transition ${
              isMatrix
                ? "font-mono text-[#00FF41] group-hover:text-white"
                : isInterstellar
                ? "text-amber-200 group-hover:text-white"
                : isFightClub
                ? "text-pink-300 group-hover:text-white"
                : "text-white group-hover:text-amber-400"
            }`}
          >
            {movie.title}
          </h3>
          <p
            className={`mt-1.5 line-clamp-3 text-xs leading-relaxed ${
              isMatrix
                ? "text-emerald-300/80 font-mono"
                : isInterstellar
                ? "text-amber-100/70"
                : "text-gray-400"
            }`}
          >
            {movie.overview || "No synopsis available for this title."}
          </p>
        </div>

        {/* Action Controls: Trailer & Streaming Options */}
        <div
          className={`mt-4 flex items-center gap-2 pt-3 border-t ${
            isMatrix
              ? "border-[#00FF41]/30"
              : isInterstellar
              ? "border-amber-500/20"
              : isFightClub
              ? "border-pink-500/30"
              : "border-white/10"
          }`}
        >
          <button
            onClick={() => onWatchTrailer && onWatchTrailer(movie.id, movie.title)}
            className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition shadow-md ${
              isMatrix
                ? "bg-[#00FF41]/20 text-[#00FF41] hover:bg-[#00FF41] hover:text-black border border-[#00FF41]/40"
                : isInterstellar
                ? "bg-amber-400/20 text-amber-300 hover:bg-amber-400 hover:text-black border border-amber-400/40"
                : isFightClub
                ? "bg-pink-600/20 text-pink-300 hover:bg-pink-600 hover:text-white border border-pink-500/40"
                : "bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white border border-red-500/30 shadow-red-600/10"
            }`}
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span>Trailer</span>
          </button>

          <button
            onClick={() => onCheckProviders && onCheckProviders(movie.id)}
            className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition ${
              isMatrix
                ? "bg-black/60 text-emerald-300 hover:bg-[#00FF41]/30 border border-[#00FF41]/30"
                : "bg-white/5 text-gray-300 hover:bg-white/15 hover:text-white border border-white/10"
            }`}
          >
            <Tv className="h-3.5 w-3.5 text-cyan-400" />
            <span>Stream</span>
          </button>
        </div>
      </div>
    </div>
  );
}
