"use client";

import React from "react";
import { MovieItem } from "@/types/movie";
import { MovieCard } from "./MovieCard";

interface MovieGridProps {
  movies: MovieItem[];
  title?: string;
  countLabel?: string;
  onWatchTrailer?: (movieId: number, title: string) => void;
  onCheckProviders?: (movieId: number) => void;
}

export function MovieGrid({
  movies,
  title = "On the shelf",
  countLabel,
  onWatchTrailer,
  onCheckProviders,
}: MovieGridProps) {
  const countText =
    countLabel ||
    (movies.length > 0
      ? `${movies.length} ${movies.length === 1 ? "film" : "films"}, in the order I mention them`
      : "Nothing yet");

  return (
    <section aria-label="Recommendations" className="w-full">
      {/* Shelf Head */}
      <div className="flex justify-between items-baseline mb-4 pb-2 border-b-2 border-[var(--ink)]">
        <h2 className="font-display text-2xl sm:text-3xl uppercase tracking-wide">
          {title}
        </h2>
        <span className="text-sm font-medium opacity-75">{countText}</span>
      </div>

      {/* Shelf Items */}
      {movies.length === 0 ? (
        <div className="py-8">
          <p className="max-w-[36ch] text-base leading-relaxed opacity-75">
            Ask for a genre, an actor or a mood. Say &ldquo;the second one&rdquo; to dig into any film here.
          </p>
        </div>
      ) : (
        /* Responsive Shelf: Horizontal snap carousel on mobile, Grid on desktop */
        <div
          className="flex sm:grid sm:grid-cols-[repeat(auto-fill,minmax(11rem,1fr))] gap-5 overflow-x-auto sm:overflow-visible pb-4 sm:pb-0 snap-x snap-mandatory"
          tabIndex={0}
          aria-label="Movie shelf"
        >
          {movies.map((movie, idx) => (
            <div
              key={`${movie.id}-${idx}`}
              className="w-[160px] sm:w-auto shrink-0 snap-start"
            >
              <MovieCard
                movie={movie}
                index={idx}
                delayMs={Math.min(idx * 200, 1000)}
                onWatchTrailer={onWatchTrailer}
                onCheckProviders={onCheckProviders}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
