"use client";

import React, { useEffect, useState } from "react";
import { X } from "lucide-react";

interface StarWarsCrawlProps {
  active: boolean;
  onClose: () => void;
}

export function StarWarsCrawl({ active, onClose }: StarWarsCrawlProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (active) {
      setShow(true);
    } else {
      setShow(false);
    }
  }, [active]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black flex flex-col items-center justify-center select-none animate-fade-in">
      {/* Starfield Background */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] opacity-60 pointer-events-none" />

      {/* Exit Button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 z-50 flex items-center gap-2 rounded-full border border-yellow-400/40 bg-black/80 px-4 py-2 text-xs font-mono font-bold text-yellow-400 hover:bg-yellow-400 hover:text-black transition"
      >
        <X className="h-4 w-4" />
        <span>EXIT CRAWL</span>
      </button>

      {/* Perspective Container */}
      <div className="relative w-full max-w-2xl h-[75vh] overflow-hidden [perspective:350px]">
        <div className="absolute w-full text-center text-yellow-400 font-black tracking-wider leading-relaxed [transform-origin:50%_100%] animate-crawl text-lg sm:text-2xl space-y-6">
          <p className="text-yellow-300 font-mono text-sm tracking-widest uppercase">
            EPISODE IV &bull; A NEW SOMMELIER
          </p>
          <h2 className="text-3xl sm:text-5xl tracking-widest text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.6)]">
            CINEBOT
          </h2>
          <p className="text-base sm:text-xl text-yellow-300/90 font-medium">
            It is a period of endless scrolling. Rebel film lovers, searching across thousands of streaming titles, have grown weary of generic algorithmic picks.
          </p>
          <p className="text-base sm:text-xl text-yellow-300/90 font-medium">
            Pursued by mediocre remakes, the Cinephile Alliance dispatched CINEBOT—a real-time voice intelligence powered by sub-300ms WebRTC data links.
          </p>
          <p className="text-base sm:text-xl text-yellow-300/90 font-medium">
            Custodians of the ultimate cinema archives, they now hold the power to uncover timeless masterpieces and restore peace to movie night...
          </p>
        </div>
      </div>
    </div>
  );
}
