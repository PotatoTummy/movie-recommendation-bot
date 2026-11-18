"use client";

import React, { useEffect, useState } from "react";
import { Trophy, Sparkles, X } from "lucide-react";
import { EasterEgg, EASTER_EGGS } from "@/types/easterEggs";

interface EasterEggBannerProps {
  unlockedEgg: EasterEgg | null;
  onDismiss: () => void;
  totalUnlocked: number;
}

export function EasterEggBanner({
  unlockedEgg,
  onDismiss,
  totalUnlocked,
}: EasterEggBannerProps) {
  useEffect(() => {
    if (!unlockedEgg) return;
    const timer = setTimeout(() => {
      onDismiss();
    }, 6000);
    return () => clearTimeout(timer);
  }, [unlockedEgg, onDismiss]);

  if (!unlockedEgg) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full animate-bounce rounded-2xl border border-amber-400/80 bg-gradient-to-r from-[#181308] via-[#221a0d] to-[#120d04] p-4 text-white shadow-2xl shadow-amber-500/20 backdrop-blur-xl">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-400 text-black font-extrabold text-2xl shadow-lg shadow-amber-400/40 shrink-0">
          {unlockedEgg.icon}
        </div>
        <div className="flex-1 pr-2">
          <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-amber-400 uppercase tracking-widest">
            <Trophy className="h-3 w-3" />
            <span>SECRET REEL UNLOCKED ({totalUnlocked}/5)</span>
          </div>
          <h4 className="text-sm font-extrabold text-white mt-0.5">
            {unlockedEgg.title}
          </h4>
          <p className="text-xs text-amber-200/80 font-mono mt-0.5">
            {unlockedEgg.movie} ({unlockedEgg.year})
          </p>
          <p className="text-[11px] text-gray-300 mt-1 leading-tight">
            {unlockedEgg.description}
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="rounded-lg p-1 text-gray-400 hover:text-white transition"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
