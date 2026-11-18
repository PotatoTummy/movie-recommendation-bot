"use client";

import React, { useState } from "react";
import { MovieItem } from "@/types/movie";

interface MovieCardProps {
  movie: MovieItem;
  index: number;
  delayMs?: number;
  onWatchTrailer?: (movieId: number, title: string) => void;
  onCheckProviders?: (movieId: number) => void;
}

export function MovieCard({
  movie,
  index,
  delayMs = 0,
  onWatchTrailer,
  onCheckProviders,
}: MovieCardProps) {
  const [inlineWhere, setInlineWhere] = useState<string | null>(null);
  const [loadingWhere, setLoadingWhere] = useState(false);
  const year = movie.release_date ? movie.release_date.split("-")[0] : "";

  const handleToggleWhere = async () => {
    if (inlineWhere) {
      setInlineWhere(null);
      return;
    }
    if (onCheckProviders) {
      onCheckProviders(movie.id);
    }
  };

  return (
    <article
      className="film-drop flex flex-col gap-2 select-none group focus-within:outline-hidden"
      style={{ animationDelay: `${delayMs}ms` }}
    >
      {/* Poster Frame */}
      <div
        className="duotone-container relative aspect-[2/3] w-full overflow-hidden border-2 border-[var(--ink)] bg-[var(--wash)] p-3 flex flex-col justify-end transition-shadow"
        role="img"
        aria-label={`Poster: ${movie.title}`}
        tabIndex={0}
      >
        {movie.poster_url ? (
          <img
            src={movie.poster_url}
            alt={movie.title}
            className="duotone-poster absolute inset-0 h-full w-full object-cover"
            loading="lazy"
          />
        ) : null}

        {/* Backdrop tint layer for riso duotone look */}
        <div className="absolute inset-0 bg-[var(--ink)] opacity-20 pointer-events-none group-hover:opacity-0 transition-opacity" />

        {/* Spoken Ordinal (1, 2, 3...) in arrival order */}
        <span
          className="font-display absolute top-2 left-2 text-3xl sm:text-4xl leading-none text-[var(--hot)] z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
          aria-label={`Recommendation #${index + 1}`}
        >
          {index + 1}
        </span>

        {/* Title */}
        <b className="relative z-10 font-display text-lg sm:text-xl uppercase leading-tight tracking-tight text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
          {movie.title}
        </b>
      </div>

      {/* Meta (Year & Rating) */}
      <div className="flex justify-between items-baseline text-sm font-medium opacity-90">
        <span>{year || "—"}</span>
        <span>{movie.rating ? `${movie.rating.toFixed(1)} / 10` : "Unrated"}</span>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 flex-wrap text-sm pt-0.5">
        <button
          type="button"
          onClick={() => onWatchTrailer && onWatchTrailer(movie.id, movie.title)}
          className="border-b-2 border-[var(--ink)] pb-0.5 hover:text-[var(--hot)] hover:border-[var(--hot)] transition cursor-pointer font-medium"
        >
          Trailer
        </button>
        <button
          type="button"
          onClick={handleToggleWhere}
          className="border-b-2 border-[var(--ink)] pb-0.5 hover:text-[var(--hot)] hover:border-[var(--hot)] transition cursor-pointer font-medium"
        >
          Where to watch
        </button>
      </div>
    </article>
  );
}
