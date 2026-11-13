"use client";

import React from "react";
import { X } from "lucide-react";

interface TrailerModalProps {
  youtubeKey: string | null;
  movieTitle: string;
  onClose: () => void;
}

export function TrailerModal({ youtubeKey, movieTitle, onClose }: TrailerModalProps) {
  if (!youtubeKey) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="relative w-full max-w-4xl overflow-hidden rounded-2xl border border-cine-border bg-cine-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-cine-border px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
            <h3 className="text-lg font-semibold text-white">Trailer: {movieTitle}</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-white/10 hover:text-white transition"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="relative aspect-video w-full bg-black">
          <iframe
            src={`https://www.youtube.com/embed/${youtubeKey}?autoplay=1&rel=0`}
            title={`Trailer for ${movieTitle}`}
            className="h-full w-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}
