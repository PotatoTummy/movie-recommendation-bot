"use client";

import React, { useState } from "react";
import {
  Trophy,
  X,
  Lock,
  Sparkles,
  Compass,
  CheckCircle2,
  HelpCircle,
  KeyRound,
  Eye,
} from "lucide-react";
import { EasterEgg, EASTER_EGGS } from "@/types/easterEggs";

interface EasterEggVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  unlockedIds: string[];
  activeTheme: string | null;
  onSelectTheme: (id: string | null) => void;
  onSolveEgg: (id: string) => void;
}

export function EasterEggVaultModal({
  isOpen,
  onClose,
  unlockedIds,
  activeTheme,
  onSelectTheme,
  onSolveEgg,
}: EasterEggVaultModalProps) {
  const [userGuesses, setUserGuesses] = useState<Record<string, string>>({});
  const [errorMessages, setErrorMessages] = useState<Record<string, string>>({});
  const [revealedHints, setRevealedHints] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  const total = EASTER_EGGS.length;
  const count = unlockedIds.length;
  const progressPercent = Math.round((count / total) * 100);

  const handleAttemptSolve = (egg: EasterEgg) => {
    const rawGuess = (userGuesses[egg.id] || "").trim().toLowerCase();
    if (!rawGuess) return;

    const isMatch = egg.acceptedAnswers.some(
      (ans) => rawGuess === ans || rawGuess.includes(ans)
    );

    if (isMatch) {
      setErrorMessages((prev) => ({ ...prev, [egg.id]: "" }));
      setUserGuesses((prev) => ({ ...prev, [egg.id]: "" }));
      onSolveEgg(egg.id);
    } else {
      setErrorMessages((prev) => ({
        ...prev,
        [egg.id]: `Incorrect guess! Hint: ${egg.hint}`,
      }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-2xl rounded-3xl border border-amber-500/40 bg-[#0c0f17] p-5 sm:p-8 shadow-2xl shadow-black/95 max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-5 shrink-0">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-yellow-600/10 border border-amber-500/30 text-amber-400 shadow-lg shadow-amber-500/20 shrink-0">
            <Trophy className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg sm:text-xl font-black text-white tracking-wide">
                Cinema Easter Egg Hunt
              </h3>
              <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-mono font-bold text-amber-400 border border-amber-500/20">
                {count} / {total} DISCOVERED
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Solve cinematic film riddles below to unlock secret projection themes!
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-5 space-y-1.5 shrink-0">
          <div className="flex justify-between text-[11px] font-mono text-gray-400">
            <span>VAULT UNLOCK PROGRESS</span>
            <span className="text-amber-400 font-bold">{progressPercent}% COMPLETED</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/5 border border-white/10">
            <div
              className="h-full bg-gradient-to-r from-red-600 via-amber-500 to-yellow-400 transition-all duration-700 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Easter Eggs Grid */}
        <div className="space-y-4 overflow-y-auto pr-1 flex-1">
          {EASTER_EGGS.map((egg, index) => {
            const isUnlocked = unlockedIds.includes(egg.id);
            const isActive = activeTheme === egg.id;
            const hasError = !!errorMessages[egg.id];
            const isHintRevealed = !!revealedHints[egg.id];

            return (
              <div
                key={egg.id}
                className={`relative flex flex-col rounded-2xl border p-4 sm:p-5 transition-all duration-300 ${
                  isUnlocked
                    ? isActive
                      ? "border-amber-400 bg-amber-500/10 shadow-lg shadow-amber-500/10"
                      : "border-white/15 bg-white/5"
                    : "border-white/10 bg-black/50"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl text-xl border shrink-0 ${
                        isUnlocked
                          ? "border-amber-500/40 bg-black/60 shadow-inner"
                          : "border-white/10 bg-white/5 grayscale"
                      }`}
                    >
                      {isUnlocked ? egg.icon : <Lock className="h-4 w-4 text-gray-500" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider">
                          REEL #{index + 1}
                        </span>
                        <h4
                          className={`text-sm font-bold ${
                            isUnlocked ? "text-white" : "text-gray-300"
                          }`}
                        >
                          {isUnlocked ? egg.title : "Classified Secret Film"}
                        </h4>
                        {isUnlocked && (
                          <span className="text-[11px] font-mono text-gray-400">
                            ({egg.movie}, {egg.year})
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                        {isUnlocked ? (
                          egg.description
                        ) : (
                          <span className="text-amber-200/90 font-medium">
                            &ldquo;{egg.riddle}&rdquo;
                          </span>
                        )}
                      </p>

                      {!isUnlocked && (
                        <div className="mt-2 flex items-center gap-3">
                          <button
                            onClick={() =>
                              setRevealedHints((prev) => ({
                                ...prev,
                                [egg.id]: !prev[egg.id],
                              }))
                            }
                            className="inline-flex items-center gap-1 text-[11px] font-mono text-gray-400 hover:text-amber-300 transition"
                          >
                            <HelpCircle className="h-3 w-3" />
                            <span>{isHintRevealed ? "Hide extra hint" : "Show extra hint"}</span>
                          </button>
                        </div>
                      )}

                      {!isUnlocked && isHintRevealed && (
                        <p className="mt-1.5 rounded-lg border border-amber-500/20 bg-amber-500/10 p-2 text-[11px] text-amber-300/90 italic font-mono animate-fade-in">
                          Hint: {egg.hint}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Active theme toggle for unlocked eggs */}
                  {isUnlocked && (
                    <button
                      onClick={() => onSelectTheme(isActive ? null : egg.id)}
                      className={`shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-mono font-bold transition ${
                        isActive
                          ? "bg-amber-400 text-black shadow-md shadow-amber-400/30"
                          : "border border-white/20 bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white"
                      }`}
                    >
                      {isActive ? "ACTIVE" : "ACTIVATE"}
                    </button>
                  )}
                </div>

                {/* Mobile & Desktop Answer Input (Solves the hunt directly without physical keyboard!) */}
                {!isUnlocked && (
                  <div className="mt-3.5 pt-3 border-t border-white/5">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleAttemptSolve(egg);
                      }}
                      className="flex items-center gap-2"
                    >
                      <input
                        type="text"
                        value={userGuesses[egg.id] || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setUserGuesses((prev) => ({ ...prev, [egg.id]: val }));
                          setErrorMessages((prev) => ({ ...prev, [egg.id]: "" }));
                        }}
                        placeholder="Type movie name or answer..."
                        className="flex-1 rounded-xl border border-white/10 bg-black/60 px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 transition"
                      />
                      <button
                        type="submit"
                        disabled={!(userGuesses[egg.id] || "").trim()}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-mono font-bold text-black hover:bg-amber-400 disabled:opacity-40 transition shadow-md shadow-amber-500/20"
                      >
                        <KeyRound className="h-3.5 w-3.5" />
                        <span>SOLVE</span>
                      </button>
                    </form>
                    {hasError && (
                      <p className="mt-1.5 text-[11px] font-mono text-red-400 animate-fade-in">
                        {errorMessages[egg.id]}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-5 flex items-center justify-between pt-4 border-t border-white/10 text-xs text-gray-400 shrink-0">
          <span className="flex items-center gap-1.5 font-mono text-[11px]">
            <Compass className="h-3.5 w-3.5 text-amber-400" />
            <span>Works on mobile and desktop! Solve clues above.</span>
          </span>
          <button
            onClick={onClose}
            className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-500 transition shadow-md shadow-red-600/30"
          >
            Close Vault
          </button>
        </div>
      </div>
    </div>
  );
}
