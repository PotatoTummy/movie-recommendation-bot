"use client";

import React from "react";
import { Trophy, X, Lock, CheckCircle2, Sparkles, Film, Compass } from "lucide-react";
import { EasterEgg, EASTER_EGGS } from "@/types/easterEggs";

interface EasterEggVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  unlockedIds: string[];
  activeTheme: string | null;
  onSelectTheme: (id: string | null) => void;
}

export function EasterEggVaultModal({
  isOpen,
  onClose,
  unlockedIds,
  activeTheme,
  onSelectTheme,
}: EasterEggVaultModalProps) {
  if (!isOpen) return null;

  const total = EASTER_EGGS.length;
  const count = unlockedIds.length;
  const progressPercent = Math.round((count / total) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-2xl rounded-3xl border border-amber-500/40 bg-[#0d1017] p-6 sm:p-8 shadow-2xl shadow-black/90">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-yellow-600/10 border border-amber-500/30 text-amber-400 shadow-lg shadow-amber-500/20">
            <Trophy className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-black text-white tracking-wide">
                Secret Cinema Vault
              </h3>
              <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-mono font-bold text-amber-400 border border-amber-500/20">
                {count} / {total} REELS
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Iconic film easter eggs hidden across CineBot. Find them all!
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6 space-y-1.5">
          <div className="flex justify-between text-[11px] font-mono text-gray-400">
            <span>DISCOVERY PROGRESS</span>
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
        <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
          {EASTER_EGGS.map((egg) => {
            const isUnlocked = unlockedIds.includes(egg.id);
            const isActive = activeTheme === egg.id;

            return (
              <div
                key={egg.id}
                className={`relative flex items-center justify-between rounded-2xl border p-4 transition-all duration-300 ${
                  isUnlocked
                    ? isActive
                      ? "border-amber-400 bg-amber-500/10 shadow-lg shadow-amber-500/10"
                      : "border-white/15 bg-white/5 hover:border-white/30"
                    : "border-white/5 bg-black/40 opacity-70"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl text-xl border ${
                      isUnlocked
                        ? "border-amber-500/40 bg-black/50"
                        : "border-white/10 bg-white/5 grayscale"
                    }`}
                  >
                    {isUnlocked ? egg.icon : <Lock className="h-4 w-4 text-gray-500" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4
                        className={`text-sm font-bold ${
                          isUnlocked ? "text-white" : "text-gray-400 font-mono"
                        }`}
                      >
                        {isUnlocked ? egg.title : "??? [CLASSIFIED REEL]"}
                      </h4>
                      {isUnlocked && (
                        <span className="text-[10px] font-mono text-gray-400">
                          ({egg.movie}, {egg.year})
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {isUnlocked ? (
                        egg.description
                      ) : (
                        <span className="italic text-amber-300/80 font-mono">
                          Hint: &ldquo;{egg.hint}&rdquo;
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Activation Switch */}
                {isUnlocked && (
                  <button
                    onClick={() => onSelectTheme(isActive ? null : egg.id)}
                    className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-mono font-bold transition ${
                      isActive
                        ? "bg-amber-400 text-black shadow-md shadow-amber-400/30"
                        : "border border-white/20 bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white"
                    }`}
                  >
                    {isActive ? "ACTIVE" : "ACTIVATE"}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="mt-6 flex items-center justify-between pt-4 border-t border-white/10 text-xs text-gray-400">
          <span className="flex items-center gap-1.5 font-mono text-[11px]">
            <Compass className="h-3.5 w-3.5 text-amber-400" />
            <span>Type movie secrets anywhere or click clues</span>
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
