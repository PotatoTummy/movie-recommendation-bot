"use client";

import React, { useEffect } from "react";
import { X, Check, Lock } from "lucide-react";

export interface HintItem {
  id: "matrix" | "interstellar" | "fight" | "godfather" | "starwars";
  movie: string;
  year: number;
  riddle: string;
  phraseHint: string;
}

export const HINTS_LIST: HintItem[] = [
  {
    id: "matrix",
    movie: "The Matrix",
    year: 1999,
    riddle: "Follow the white rabbit into the construct. What is the iconic 4-word revelation about the cutlery in the Oracle's apartment?",
    phraseHint: "4 words (starts with 'there...')",
  },
  {
    id: "interstellar",
    movie: "Interstellar",
    year: 2014,
    riddle: "A father's frantic 1-word Morse code plea transmitted across spacetime through a girl's bedroom bookshelf...",
    phraseHint: "1 word, 4 letters (starts with 's...')",
  },
  {
    id: "fight",
    movie: "Fight Club",
    year: 1999,
    riddle: "The sacred golden rule whispered in basement brawls that you are never supposed to talk about...",
    phraseHint: "2 words (starts with 'first...')",
  },
  {
    id: "godfather",
    movie: "The Godfather",
    year: 1972,
    riddle: "Don Corleone's infamous Sicilian negotiation principle that guarantees compliance...",
    phraseHint: "6 words (starts with 'an offer...')",
  },
  {
    id: "starwars",
    movie: "Star Wars",
    year: 1980,
    riddle: "The dramatic 5-word familial revelation spoken by the dark lord to Luke in Cloud City...",
    phraseHint: "5 words (starts with 'i am...')",
  },
];

interface EasterEggHintsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  foundThemes: Set<string>;
  onSelectTheme: (id: string | null) => void;
}

export function EasterEggHintsDrawer({
  isOpen,
  onClose,
  foundThemes,
  onSelectTheme,
}: EasterEggHintsDrawerProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-stretch sm:justify-end bg-black/60 backdrop-blur-xs animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="hints-title"
    >
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      {/* Drawer */}
      <div className="relative z-10 w-full sm:w-[480px] md:w-[540px] max-h-[90vh] sm:max-h-full sm:h-full bg-[var(--paper)] text-[var(--ink)] border-t-2 sm:border-t-0 sm:border-l-2 border-[var(--ink)] flex flex-col p-5 sm:p-6 overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b-2 border-[var(--ink)]">
          <div>
            <h2 id="hints-title" className="font-display text-2xl uppercase tracking-wide">
              Secret Reels ({foundThemes.size} of 5)
            </h2>
            <p className="text-sm opacity-70 mt-0.5">
              Say or type a famous line to awaken that film&apos;s theme.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:text-[var(--hot)] transition focus-visible:outline-2"
            aria-label="Close drawer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Clue List */}
        <div className="mt-5 space-y-4 flex-1">
          {HINTS_LIST.map((h, idx) => {
            const isFound = foundThemes.has(h.id);
            return (
              <div
                key={h.id}
                className="border-2 border-[var(--ink)] p-4 flex flex-col gap-2 bg-[var(--wash)] transition-colors"
              >
                <div className="flex items-baseline justify-between">
                  <span className="font-display text-xl uppercase tracking-tight text-[var(--hot)]">
                    Reel #{idx + 1}: {h.movie} ({h.year})
                  </span>
                  {isFound ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-[var(--ink)]">
                      <Check className="h-3.5 w-3.5 stroke-[3]" /> Found
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium opacity-60">
                      <Lock className="h-3.5 w-3.5" /> Hidden
                    </span>
                  )}
                </div>

                <p className="text-sm leading-relaxed opacity-85">{h.riddle}</p>

                <div className="flex justify-between items-center text-xs pt-1 border-t border-[var(--ink)]/20">
                  <span className="italic opacity-70">Clue: {h.phraseHint}</span>
                  {isFound && (
                    <button
                      type="button"
                      onClick={() => {
                        onSelectTheme(h.id);
                        onClose();
                      }}
                      className="border-b-2 border-[var(--ink)] pb-0.5 font-bold hover:text-[var(--hot)] hover:border-[var(--hot)] transition"
                    >
                      Activate
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer controls */}
        <div className="mt-6 pt-4 border-t-2 border-[var(--ink)] flex justify-between items-center text-sm">
          <button
            type="button"
            onClick={() => {
              onSelectTheme(null);
              onClose();
            }}
            className="border-b-2 border-[var(--ink)] pb-0.5 font-bold hover:text-[var(--hot)] transition"
          >
            Reset to default
          </button>
          <button
            type="button"
            onClick={onClose}
            className="border-2 border-[var(--ink)] rounded-full px-4 py-1.5 font-bold text-xs hover:bg-[var(--wash)] transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
