"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";

interface TrailerModalProps {
  youtubeKey: string | null;
  movieTitle: string;
  onClose: () => void;
}

export function TrailerModal({ youtubeKey, movieTitle, onClose }: TrailerModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (youtubeKey) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [youtubeKey, onClose]);

  if (!youtubeKey) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-stretch sm:justify-end bg-black/50 backdrop-blur-xs animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="trailer-title"
    >
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      {/* Drawer / Bottom sheet */}
      <div className="relative z-10 w-full sm:w-[480px] md:w-[560px] max-h-[90vh] sm:max-h-full sm:h-full bg-[var(--paper)] text-[var(--ink)] border-t-2 sm:border-t-0 sm:border-l-2 border-[var(--ink)] flex flex-col p-5 sm:p-6 overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b-2 border-[var(--ink)]">
          <h2 id="trailer-title" className="font-display text-2xl uppercase tracking-wide">
            Trailer: {movieTitle}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:text-[var(--hot)] transition focus-visible:outline-2"
            aria-label="Close drawer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 relative aspect-video w-full bg-black border-2 border-[var(--ink)] overflow-hidden">
          <iframe
            src={`https://www.youtube.com/embed/${youtubeKey}?autoplay=1&rel=0`}
            title={`Trailer for ${movieTitle}`}
            className="h-full w-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        <div className="mt-6 flex justify-between items-center text-sm">
          <p className="opacity-75">YouTube trailer stream via TMDB</p>
          <button
            onClick={onClose}
            className="border-b-2 border-[var(--ink)] pb-0.5 hover:text-[var(--hot)] hover:border-[var(--hot)] transition font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
