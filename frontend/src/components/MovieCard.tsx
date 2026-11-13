"use client";

import React from "react";
import { Star, Play, Tv, Film } from "lucide-react";
import { MovieItem } from "@/types/movie";

interface MovieCardProps {
  movie: MovieItem;
  onWatchTrailer?: (movieId: number, title: string) => void;
  onCheckProviders?: (movieId: number) => void;
}

export function MovieCard({ movie, onWatchTrailer, onCheckProviders }: MovieCardProps) {
  const year = movie.release_date ? movie.release_date.split("-")[0] : null;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-cine-border bg-cine-card transition-all duration-300 hover:-translate-y-1 hover:border-red-500/50 hover:shadow-xl hover:shadow-red-500/10">
      {/* Poster Image */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-gray-900">
        {movie.poster_url ? (
          <img
            src={movie.poster_url}
            alt={movie.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-800 text-gray-500">
            <Film className="h-12 w-12 stroke-[1.5]" />
          </div>
        )}

        {/* Rating & Year Overlay */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-black/70 px-2.5 py-1 text-xs font-semibold text-yellow-400 backdrop-blur-md">
          <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
          <span>{movie.rating.toFixed(1)}</span>
        </div>

        {year && (
          <div className="absolute top-3 right-3 rounded-full bg-black/70 px-2.5 py-1 text-xs font-medium text-gray-300 backdrop-blur-md">
            {year}
          </div>
        )}
      </div>

      {/* Movie Details */}
      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          <h3 className="line-clamp-1 text-base font-bold text-white transition group-hover:text-red-400">
            {movie.title}
          </h3>
          <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-gray-400">
            {movie.overview || "No overview available for this title."}
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="mt-4 flex items-center gap-2 pt-2 border-t border-cine-border/50">
          <button
            onClick={() => onWatchTrailer && onWatchTrailer(movie.id, movie.title)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-red-600/20 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-600 hover:text-white transition"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            Trailer
          </button>
          <button
            onClick={() => onCheckProviders && onCheckProviders(movie.id)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-white/5 px-3 py-2 text-xs font-semibold text-gray-300 hover:bg-white/10 hover:text-white transition"
          >
            <Tv className="h-3.5 w-3.5 text-cine-cyan" />
            Stream
          </button>
        </div>
      </div>
    </div>
  );
}
