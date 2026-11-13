"use client";

import React from "react";
import { X, Tv, Film } from "lucide-react";
import { MovieDetails } from "@/types/movie";

interface StreamingModalProps {
  movie: MovieDetails | null;
  onClose: () => void;
}

export function StreamingModal({ movie, onClose }: StreamingModalProps) {
  if (!movie) return null;

  const hasStream = movie.streaming_providers && movie.streaming_providers.length > 0;
  const hasRent = movie.rent_providers && movie.rent_providers.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-cine-border bg-cine-card p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-cine-border pb-4">
          <div className="flex items-center gap-3">
            <Tv className="h-6 w-6 text-cine-cyan" />
            <div>
              <h3 className="text-lg font-bold text-white">{movie.title}</h3>
              <p className="text-xs text-gray-400">Where to Watch (USA Region)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-white/10 hover:text-white transition"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 space-y-6">
          {/* Subscription Streaming */}
          <div>
            <h4 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-emerald-400">
              <Film className="h-4 w-4" /> Stream (Subscription)
            </h4>
            {hasStream ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {movie.streaming_providers.map((p, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-sm font-medium text-emerald-300"
                  >
                    {p}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-xs text-gray-400">No active flatrate subscription stream found.</p>
            )}
          </div>

          {/* Rent or Buy */}
          <div>
            <h4 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-amber-400">
              <Film className="h-4 w-4" /> Rent or Buy
            </h4>
            {hasRent ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {movie.rent_providers.map((p, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-sm font-medium text-amber-300"
                  >
                    {p}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-xs text-gray-400">Not available for digital rental or purchase.</p>
            )}
          </div>
        </div>

        <div className="mt-6 border-t border-cine-border pt-4 text-center">
          <p className="text-xs text-gray-500">Streaming availability data powered by JustWatch via TMDB</p>
        </div>
      </div>
    </div>
  );
}
