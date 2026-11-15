"use client";

import React from "react";
import { ShieldCheck, Clock, Zap, X, Cpu, Lock } from "lucide-react";

interface FairUsageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FairUsageModal({ isOpen, onClose }: FairUsageModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl border border-cine-border bg-[#0e131d] p-6 sm:p-8 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 flex h-9 w-9 items-center justify-center rounded-xl border border-cine-border bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-600/20 border border-red-500/30 text-red-500">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Fair Usage Policy</h3>
            <p className="text-xs text-gray-400">LiveKit Voice AI Portfolio Showcase</p>
          </div>
        </div>

        {/* Policy Highlights */}
        <div className="space-y-4 text-xs text-gray-300">
          <div className="flex items-start gap-3 rounded-2xl border border-cine-border/70 bg-[#161c29]/60 p-4">
            <Clock className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white">10-Minute Session Limit</p>
              <p className="mt-1 text-gray-400">
                To keep real-time cloud workers available for everyone, active WebRTC voice sessions are capped at 10 minutes each.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-cine-border/70 bg-[#161c29]/60 p-4">
            <Zap className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white">Rate Limiter (6 Sessions / 15 Mins)</p>
              <p className="mt-1 text-gray-400">
                Token requests are rate-limited per visitor IP to prevent automated scripts and protect API quotas across LiveKit, Deepgram, and Groq.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-cine-border/70 bg-[#161c29]/60 p-4">
            <Lock className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white">Privacy & Audio Handling</p>
              <p className="mt-1 text-gray-400">
                Voice streams are processed in-memory via WebRTC. Microphones are stopped immediately when muted. No audio is recorded or stored on any server.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-cine-border/70 bg-[#161c29]/60 p-4">
            <Cpu className="h-5 w-5 text-purple-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white">Portfolio Demonstration</p>
              <p className="mt-1 text-gray-400">
                CineBot is an open demonstration showcasing sub-300ms multimodal AI, WebRTC data channels, and real-time movie recommendation sommelier capabilities.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl bg-red-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-red-500 transition shadow-lg shadow-red-600/20"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
}
