"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";
import { MovieDetails } from "@/types/movie";

interface StreamingModalProps {
  movie: MovieDetails | null;
  onClose: () => void;
}

export function StreamingModal({ movie, onClose }: StreamingModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (movie) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [movie, onClose]);

  if (!movie) return null;

  const hasStream = movie.streaming_providers && movie.streaming_providers.length > 0;
  const hasRent = movie.rent_providers && movie.rent_providers.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-stretch sm:justify-end bg-black/50 backdrop-blur-xs animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="streaming-title"
    >
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      {/* Drawer / Bottom sheet */}
      <div className="relative z-10 w-full sm:w-[480px] md:w-[540px] max-h-[90vh] sm:max-h-full sm:h-full bg-[var(--paper)] text-[var(--ink)] border-t-2 sm:border-t-0 sm:border-l-2 border-[var(--ink)] flex flex-col p-5 sm:p-6 overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b-2 border-[var(--ink)]">
          <div>
            <h2 id="streaming-title" className="font-display text-2xl uppercase tracking-wide">
              {movie.title}
            </h2>
            <p className="text-sm opacity-70 mt-0.5">Where to watch</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:text-[var(--hot)] transition focus-visible:outline-2"
            aria-label="Close drawer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 space-y-6 flex-1">
          {/* Subscription Streaming */}
          <div>
            <h3 className="font-display text-lg uppercase tracking-wider text-[var(--hot)] mb-2">
              Subscription
            </h3>
            {hasStream ? (
              <div className="flex flex-wrap gap-2">
                {movie.streaming_providers.map((p, idx) => (
                  <span
                    key={idx}
                    className="inline-block border border-[var(--ink)] bg-[var(--wash)] px-3 py-1 text-sm font-medium"
                  >
                    {p}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm opacity-70">No subscription service currently streaming this film.</p>
            )}
          </div>

          {/* Rent or Buy */}
          <div>
            <h3 className="font-display text-lg uppercase tracking-wider text-[var(--hot)] mb-2">
              Rent or buy
            </h3>
            {hasRent ? (
              <div className="flex flex-wrap gap-2">
                {movie.rent_providers.map((p, idx) => (
                  <span
                    key={idx}
                    className="inline-block border border-[var(--ink)] bg-[var(--wash)] px-3 py-1 text-sm font-medium"
                  >
                    {p}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm opacity-70">Not currently listed for digital rent or purchase.</p>
            )}
          </div>

          {/* Synopsis */}
          {movie.overview && (
            <div className="pt-4 border-t border-[var(--ink)]/20">
              <h3 className="font-display text-base uppercase tracking-wider opacity-80 mb-1">
                Overview
              </h3>
              <p className="text-sm leading-relaxed opacity-85">{movie.overview}</p>
            </div>
          )}
        </div>

        <div className="mt-8 pt-4 border-t-2 border-[var(--ink)] flex justify-between items-center text-xs opacity-75">
          <span>Streaming data via TMDB</span>
          <button
            onClick={onClose}
            className="border-b-2 border-[var(--ink)] pb-0.5 hover:text-[var(--hot)] hover:border-[var(--hot)] transition font-bold"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
