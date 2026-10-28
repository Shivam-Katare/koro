"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { Play, Pause } from "lucide-react";

interface MiniAudioCardProps {
  iconHref: string;
  title: string;
  description: string;
  audioSrc: string;
  audioLabel?: string;
}

export function MiniAudioCard({
  iconHref,
  title,
  description,
  audioSrc,
  audioLabel = "Tap to listen",
}: MiniAudioCardProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  // High volume by default
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 1.0;
    }
  }, []);

  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds) || timeInSeconds < 0) return "0:00";
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.volume = 1.0;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch((err) => console.warn("Wholesale audio play error:", err));
      }
    }
  }, [isPlaying]);

  // Strictly no loop: when finished, stop and reset cleanly
  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      togglePlay();
    }
  };

  return (
    <div
      tabIndex={0}
      role="button"
      aria-label={`${title} - ${isPlaying ? "Pause wholesale restock audio" : "Play wholesale restock audio demo"}`}
      onClick={togglePlay}
      onKeyDown={handleKeyDown}
      className={`relative bg-white border border-[#dbe7f3] rounded-xl p-5 cursor-pointer select-none transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 hover:-translate-y-1 hover:border-[#0075de] text-left ${
        isPlaying
          ? "ring-2 ring-[#0075de] border-[#0075de] shadow-[0_8px_22px_-6px_rgba(0,117,222,0.22)] -translate-y-0.5"
          : "hover:shadow-sm"
      }`}
    >
      {/* HTML5 Audio Element */}
      <audio
        ref={audioRef}
        src={audioSrc}
        preload="metadata"
        loop={false}
        onTimeUpdate={() => {
          if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
        }}
        onEnded={handleEnded}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
      />

      {/* Top Row: Icon on left, Curvy Arrow & Play Button on right */}
      <div className="flex items-start justify-between mb-3">
        <svg className="m" style={{ width: "48px", height: "48px", marginBottom: "0px" }}>
          <use href={iconHref} />
        </svg>

        {/* Handcrafted Curvy Arrow & Badge */}
        <div className="flex flex-col items-end">
          {/* Curvy arrow pointing down */}
          <div className="flex items-center gap-1 pointer-events-none select-none mb-1">
            <span
              className="text-[11px] font-semibold text-[#0075de] tracking-tight"
              style={{ fontFamily: "'Baloo 2', 'Inter', system-ui, sans-serif" }}
            >
              {isPlaying ? "Playing" : audioLabel}
            </span>
            <svg
              width="20"
              height="16"
              viewBox="0 0 28 24"
              fill="none"
              className="text-[#0075de]"
              style={{ transform: isPlaying ? "rotate(-8deg)" : "rotate(4deg)" }}
              aria-hidden="true"
            >
              <path
                d="M3 4 C 13 3, 23 7, 21 16"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <path
                d="M16 13 L21 17 L25 11"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* Action Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
            aria-label={isPlaying ? "Pause audio" : "Play audio"}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all duration-200 select-none shadow-sm ${
              isPlaying
                ? "bg-[#0075de] text-white ring-2 ring-blue-300"
                : "bg-[#e6f3fe] text-[#0075de] hover:bg-[#d4eafd] border border-[#dbe7f3] hover:scale-105 active:scale-95"
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3 h-3 fill-current" />
                <span className="font-mono text-[10px]">{formatTime(currentTime)}</span>
                <span className="inline-flex items-center gap-0.5 ml-0.5 h-2.5">
                  <span
                    className="w-0.5 bg-white rounded-full animate-bounce"
                    style={{ height: "5px", animationDuration: "0.5s", animationDelay: "0ms" }}
                  />
                  <span
                    className="w-0.5 bg-white rounded-full animate-bounce"
                    style={{ height: "9px", animationDuration: "0.5s", animationDelay: "150ms" }}
                  />
                  <span
                    className="w-0.5 bg-white rounded-full animate-bounce"
                    style={{ height: "4px", animationDuration: "0.5s", animationDelay: "300ms" }}
                  />
                </span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 fill-current ml-0.5" />
                <span>Listen</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Card Content */}
      <b className="block text-[16px] leading-[1.3] text-[#12315a] tracking-[-0.01em]">
        {title}
      </b>
      <span className="block text-[14px] leading-[1.5] text-[#627d98] mt-1">
        {description}
      </span>
    </div>
  );
}
