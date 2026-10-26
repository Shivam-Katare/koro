"use client";

import React from "react";
import { Mic, MicOff, PhoneOff, ChevronUp, Radio } from "lucide-react";
import { KoroVoiceVisualizer } from "./koro-voice-visualizer";
import { cn } from "@/lib/utils";

interface AssistantFloatingLivePillProps {
  isLive: boolean;
  isOpen: boolean;
  status: string;
  isMuted: boolean;
  micVolume: number;
  assistantVolume: number;
  onToggleMute: () => void;
  onStop: () => void;
  onReopen: () => void;
}

export function AssistantFloatingLivePill({
  isLive,
  isOpen,
  status,
  isMuted,
  micVolume,
  assistantVolume,
  onToggleMute,
  onStop,
  onReopen,
}: AssistantFloatingLivePillProps) {
  // Only render when live call is active and the main drawer is closed / minimized
  if (!isLive || isOpen) {
    return null;
  }

  const statusLabel = isMuted
    ? "Muted"
    : status === "speaking"
    ? "Speaking"
    : status === "listening"
    ? "Listening"
    : status === "processing"
    ? "Thinking"
    : "Connecting";

  return (
    <div
      role="region"
      aria-label="Active Koro live call controls"
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 select-none animate-in fade-in slide-in-from-bottom-4 duration-300 pointer-events-auto"
    >
      <div
        className={cn(
          "relative flex items-center gap-2 sm:gap-3 rounded-full p-1.5 pl-2.5 sm:pl-3 pr-2 transition-all duration-300",
          "bg-zinc-950/90 dark:bg-black/90 text-white backdrop-blur-xl",
          "border border-cyan-500/30 hover:border-cyan-400/50",
          "shadow-[0_12px_36px_rgba(0,0,0,0.6),0_0_24px_rgba(0,242,254,0.3)] hover:shadow-[0_14px_44px_rgba(0,0,0,0.7),0_0_32px_rgba(0,242,254,0.45)]"
        )}
      >
        {/* Subtle breathing background glow */}
        <div
          className={cn(
            "absolute -inset-1 rounded-full -z-10 blur-md opacity-40 transition-opacity duration-300 pointer-events-none",
            isMuted
              ? "bg-amber-500/30"
              : status === "speaking"
              ? "bg-fuchsia-500/40"
              : "bg-cyan-500/35"
          )}
        />

        {/* Left Interactive Section: Tapping reopens the chat drawer */}
        <button
          type="button"
          onClick={onReopen}
          title="Tap to reopen chat drawer"
          className="group flex items-center gap-2.5 sm:gap-3 cursor-pointer text-left outline-none pr-1 focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-full"
        >
          {/* Glowing Iridescent Orb / Pulse Visualizer */}
          <KoroVoiceVisualizer
            variant="orb"
            size={34}
            micVolume={micVolume}
            assistantVolume={assistantVolume}
            status={status}
            isMuted={isMuted}
          />

          {/* Mini dynamic wave on tablets & desktops */}
          <div className="hidden md:block">
            <KoroVoiceVisualizer
              variant="wave"
              width={76}
              height={24}
              micVolume={micVolume}
              assistantVolume={assistantVolume}
              status={status}
              isMuted={isMuted}
            />
          </div>

          {/* Status Text & Reopen Hint */}
          <div className="flex flex-col min-w-0 pr-1">
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  "h-2 w-2 rounded-full shrink-0 transition-all",
                  isMuted
                    ? "bg-amber-400"
                    : status === "speaking"
                    ? "bg-fuchsia-400 shadow-[0_0_6px_#d946ef] animate-pulse"
                    : status === "listening"
                    ? "bg-cyan-400 shadow-[0_0_6px_#00f2fe] animate-pulse"
                    : "bg-sky-400 animate-ping"
                )}
              />
              <span className="text-xs sm:text-sm font-semibold tracking-tight text-white group-hover:text-cyan-300 transition-colors">
                {statusLabel}
              </span>
            </div>
            <span className="text-[10px] text-zinc-400 tracking-tight flex items-center gap-0.5 group-hover:text-zinc-200 transition-colors">
              Tap to expand
              <ChevronUp className="h-3 w-3 inline-block transition-transform group-hover:-translate-y-0.5" />
            </span>
          </div>
        </button>

        {/* Vertical divider */}
        <div className="h-6 w-px bg-white/15 shrink-0" aria-hidden="true" />

        {/* Action Controls: Mute and End */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Mute / Unmute Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleMute();
            }}
            title={isMuted ? "Unmute microphone" : "Mute microphone"}
            aria-pressed={isMuted}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200 cursor-pointer active:scale-95",
              isMuted
                ? "bg-amber-500/25 border border-amber-400/50 text-amber-300 hover:bg-amber-500/35 shadow-[0_0_10px_rgba(251,191,36,0.3)] animate-pulse"
                : "bg-white/10 hover:bg-white/20 text-white/90 hover:text-white"
            )}
          >
            {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>

          {/* End Call Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onStop();
            }}
            title="End live conversation"
            aria-label="End conversation"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-red-600 hover:bg-red-500 text-white shadow-[0_0_14px_rgba(239,68,68,0.55)] transition-all duration-200 cursor-pointer active:scale-95"
          >
            <PhoneOff className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
