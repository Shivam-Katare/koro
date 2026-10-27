"use client";

import React from "react";
import { Mic, MicOff, PhoneOff, ChevronUp, Radio, Play, X, ArrowRight } from "lucide-react";
import { KoroVoiceVisualizer } from "./koro-voice-visualizer";
import { cn } from "@/lib/utils";

interface AssistantFloatingLivePillProps {
  isLive: boolean;
  isOpen: boolean;
  status: string;
  isMuted: boolean;
  micVolume: number;
  assistantVolume: number;
  hasRecentSession?: boolean;
  conversationTitle?: string | null;
  onToggleMute: () => void;
  onStop: () => void;
  onReopen: () => void;
  onResumeLive?: () => void;
  onDismissResume?: () => void;
}

export function AssistantFloatingLivePill({
  isLive,
  isOpen,
  status,
  isMuted,
  micVolume,
  assistantVolume,
  hasRecentSession = false,
  conversationTitle,
  onToggleMute,
  onStop,
  onReopen,
  onResumeLive,
  onDismissResume,
}: AssistantFloatingLivePillProps) {
  // If the drawer is already open, the user is directly viewing the drawer interface
  if (isOpen) {
    return null;
  }

  // State 1: Active ongoing live voice call
  if (isLive) {
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

  // State 2: Call cut / ended, but recent chat session exists -> Compact "Continue chat" pill
  if (hasRecentSession) {
    return (
      <div
        role="region"
        aria-label="Continue recent Koro conversation"
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 select-none animate-in fade-in slide-in-from-bottom-3 duration-300 pointer-events-auto"
      >
        <div
          className={cn(
            "relative flex items-center gap-2 rounded-full p-1.5 pl-2.5 sm:pl-3 pr-1.5 transition-all duration-300 group",
            "bg-zinc-950/90 dark:bg-black/90 text-white backdrop-blur-xl",
            "border border-cyan-500/35 hover:border-cyan-400/60",
            "shadow-[0_10px_30px_rgba(0,0,0,0.55),0_0_20px_rgba(0,242,254,0.25)] hover:shadow-[0_14px_40px_rgba(0,0,0,0.7),0_0_30px_rgba(0,242,254,0.45)]"
          )}
        >
          {/* Subtle cyan breathing background glow */}
          <div className="absolute -inset-1 rounded-full -z-10 blur-md opacity-35 group-hover:opacity-60 transition-opacity duration-300 bg-cyan-500/30 pointer-events-none" />

          {/* Main Action: Click to resume connecting with this chat */}
          <button
            type="button"
            onClick={onResumeLive}
            title="Click to continue live voice chat"
            className="flex items-center gap-2.5 cursor-pointer text-left outline-none pr-1 focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-full"
          >
            {/* Glowing mini live orb */}
            <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/35 group-hover:border-cyan-300 group-hover:bg-cyan-500/30 transition-all shrink-0 shadow-[0_0_10px_rgba(0,242,254,0.3)]">
              <span className="absolute h-2 w-2 rounded-full bg-cyan-400 animate-ping opacity-75" />
              <Radio className="h-4 w-4 text-cyan-300 relative z-10" />
            </div>

            {/* Label and Hint */}
            <div className="flex flex-col min-w-0 pr-1 max-w-[170px] sm:max-w-[220px]">
              <div className="flex items-center gap-1.5 truncate">
                <span className="text-xs sm:text-sm font-semibold tracking-tight text-white group-hover:text-cyan-300 transition-colors truncate">
                  {conversationTitle || "Continue chat"}
                </span>
                <span className="text-[10px] font-medium px-1.5 py-0.2 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-400/25 shrink-0">
                  Live
                </span>
              </div>
              <span className="text-[10px] text-zinc-400 tracking-tight flex items-center gap-0.5 group-hover:text-zinc-200 transition-colors">
                Tap to connect
                <ArrowRight className="h-2.5 w-2.5 inline-block transition-transform group-hover:translate-x-0.5 text-cyan-400" />
              </span>
            </div>
          </button>

          {/* Vertical divider */}
          <div className="h-5 w-px bg-white/15 shrink-0" aria-hidden="true" />

          {/* Secondary Controls: Direct Connect Button, Drawer Expand, and Dismiss */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Fast Connect Button */}
            <button
              type="button"
              onClick={onResumeLive}
              title="Connect live call"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_12px_rgba(0,242,254,0.5)] transition-all duration-200 cursor-pointer active:scale-95"
            >
              <Play className="h-3.5 w-3.5 fill-black text-black ml-0.5" />
            </button>

            {/* Open Drawer Button */}
            <button
              type="button"
              onClick={onReopen}
              title="Open chat drawer"
              className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <ChevronUp className="h-4 w-4" />
            </button>

            {/* Optional Dismiss 'X' */}
            {onDismissResume && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDismissResume();
                }}
                title="Dismiss"
                aria-label="Dismiss continue chat pill"
                className="flex h-6 w-6 items-center justify-center rounded-full text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-colors cursor-pointer ml-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
