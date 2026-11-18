"use client";

import React, { useState } from "react";
import { Star, Play, Tv, Film, Ticket } from "lucide-react";
import { MovieItem } from "@/types/movie";

interface MovieCardProps {
  movie: MovieItem;
  index?: number;
  isMatrixMode?: boolean;
  onWatchTrailer?: (movieId: number, title: string) => void;
  onCheckProviders?: (movieId: number) => void;
}

export function MovieCard({
  movie,
  index = 0,
  isMatrixMode = false,
  onWatchTrailer,
  onCheckProviders,
}: MovieCardProps) {
  const year = movie.release_date ? movie.release_date.split("-")[0] : null;
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group relative flex flex-col overflow-hidden rounded-2xl border transition-all duration-300 hover:-translate-y-1.5 ${
        isMatrixMode
          ? "border-[#00FF41]/40 bg-[#06110a]/90 text-[#00FF41] hover:border-[#00FF41] hover:shadow-[0_0_25px_rgba(0,255,65,0.3)]"
          : "border-[#222938] bg-gradient-to-b from-[#131924] to-[#0d121b] text-gray-200 hover:border-amber-500/60 hover:shadow-2xl hover:shadow-red-950/40"
      }`}
    >
      {/* 35mm Film Sprocket Ribbon on top of card */}
      <div
        className={`h-3 w-full border-b ${
          isMatrixMode
            ? "border-[#00FF41]/30 bg-[#00220d] film-sprockets-h opacity-70"
            : "border-[#222938] bg-[#0c1017] film-sprockets-h opacity-60"
        }`}
      />

      {/* Poster Image Frame */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-black/90">
        {movie.poster_url ? (
          <img
            src={movie.poster_url}
            alt={movie.title}
            className={`h-full w-full object-cover transition-all duration-700 ${
              isHovered ? "scale-105 contrast-105" : "scale-100"
            } ${isMatrixMode ? "hue-rotate-[85deg] saturate-150" : ""}`}
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-900 text-gray-600">
            <Film className="h-12 w-12 stroke-[1.5]" />
          </div>
        )}

        {/* Vintage Order Number Tag (e.g. #1, #2) for clear referential follow-ups */}
        <div
          className={`absolute top-3 left-3 flex items-center justify-center h-6 w-6 rounded-md font-mono text-[11px] font-extrabold shadow-md ${
            isMatrixMode
              ? "bg-[#00FF41] text-black shadow-[#00FF41]/30"
              : "bg-red-600 text-white shadow-red-600/40"
          }`}
          title={`Movie #${index + 1}`}
        >
          #{index + 1}
        </div>

        {/* Golden Cinema Rating & Release Year */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-black/80 px-2.5 py-1 text-xs font-semibold backdrop-blur-md border border-white/10">
          <Star
            className={`h-3.5 w-3.5 fill-current ${
              isMatrixMode ? "text-[#00FF41]" : "text-amber-400"
            }`}
          />
          <span className={isMatrixMode ? "text-[#00FF41]" : "text-amber-300"}>
            {movie.rating.toFixed(1)}
          </span>
          {year && <span className="text-gray-400 font-normal">| {year}</span>}
        </div>
      </div>

      {/* Movie Details (Cinema Lobby Card Style) */}
      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          <h3
            className={`line-clamp-1 text-base font-bold tracking-tight transition ${
              isMatrixMode
                ? "font-mono text-[#00FF41] group-hover:text-white"
                : "text-white group-hover:text-amber-400"
            }`}
          >
            {movie.title}
          </h3>
          <p
            className={`mt-2 line-clamp-3 text-xs leading-relaxed ${
              isMatrixMode ? "text-emerald-300/80 font-mono" : "text-gray-400"
            }`}
          >
            {movie.overview || "No synopsis available for this title."}
          </p>
        </div>

        {/* Action Controls: Trailer & Streaming Options */}
        <div
          className={`mt-4 flex items-center gap-2 pt-3 border-t ${
            isMatrixMode ? "border-[#00FF41]/30" : "border-white/10"
          }`}
        >
          <button
            onClick={() => onWatchTrailer && onWatchTrailer(movie.id, movie.title)}
            className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
              isMatrixMode
                ? "bg-[#00FF41]/20 text-[#00FF41] hover:bg-[#00FF41] hover:text-black border border-[#00FF41]/40"
                : "bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white border border-red-500/30 shadow-md shadow-red-600/10"
            }`}
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span>Trailer</span>
          </button>

          <button
            onClick={() => onCheckProviders && onCheckProviders(movie.id)}
            className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
              isMatrixMode
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
