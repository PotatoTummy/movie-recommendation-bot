"use client";

import React from "react";
import { Sparkles, Film } from "lucide-react";
import { MovieItem } from "@/types/movie";
import { MovieCard } from "./MovieCard";

interface MovieGridProps {
  movies: MovieItem[];
  title?: string;
  onWatchTrailer?: (movieId: number, title: string) => void;
  onCheckProviders?: (movieId: number) => void;
}

export function MovieGrid({
  movies,
  title = "Live Recommendations",
  onWatchTrailer,
  onCheckProviders,
}: MovieGridProps) {
  if (movies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-cine-border bg-cine-card/40 p-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 text-gray-500">
          <Film className="h-8 w-8 stroke-[1.5]" />
        </div>
        <h4 className="mt-4 text-base font-semibold text-gray-300">No movies displayed yet</h4>
        <p className="mt-1 max-w-sm text-xs text-gray-500">
          Click &ldquo;Start Voice Chat&rdquo; above and tell CineBot what kind of movies, vibe, or actors you like!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-yellow-400" />
          <h2 className="text-xl font-bold tracking-tight text-white">{title}</h2>
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-medium text-gray-300">
            {movies.length}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {movies.map((movie) => (
          <MovieCard
            key={movie.id}
            movie={movie}
            onWatchTrailer={onWatchTrailer}
            onCheckProviders={onCheckProviders}
          />
        ))}
      </div>
    </div>
  );
}
