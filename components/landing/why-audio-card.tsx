"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { Play, Pause } from "lucide-react";

interface WhyAudioCardProps {
  iconHref: string;
  wasText: string;
  heading: string;
  fixText: string;
  audioSrc: string;
  audioLabel?: string;
}

export function WhyAudioCard({
  iconHref,
  wasText,
  heading,
  fixText,
  audioSrc,
  audioLabel = "Tap to listen",
}: WhyAudioCardProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

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
          .then(() => {
            setIsPlaying(true);
          })
          .catch((err) => {
            console.warn("Audio play notice:", err);
          });
      }
    }
  }, [isPlaying]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0);
      audioRef.current.volume = 1.0;
    }
  };

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

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      tabIndex={0}
      role="button"
      aria-label={`${heading} - ${isPlaying ? "Pause audio demonstration" : "Click to play audio demonstration"}`}
      onClick={togglePlay}
      onKeyDown={handleKeyDown}
      className={`card relative cursor-pointer select-none transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
        isPlaying
          ? "ring-2 ring-[#0075de] shadow-[0_12px_28px_-8px_rgba(0,117,222,0.25)]"
          : "hover:border-[#0075de]/40"
      }`}
      style={{
        borderColor: isPlaying ? "var(--blue)" : undefined,
      }}
    >
      {/* Hidden HTML5 Audio Element (preload metadata for fast initial load) */}
      <audio
        ref={audioRef}
        src={audioSrc}
        preload="metadata"
        loop={false}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
      />

      {/* Top Header Row: Icon on left, Curvy Arrow & Audio Trigger on right */}
      <div className="flex items-start justify-between mb-4">
        <svg className="m">
          <use href={iconHref} />
        </svg>

        {/* Handcrafted Curvy Arrow & Badge */}
        <div className="flex flex-col items-end pt-1">
          {/* Curvy arrow pointing down to button */}
          <div className="flex items-center gap-1.5 pointer-events-none select-none mb-1">
            <span
              className="text-xs font-semibold text-[#0075de] tracking-tight"
              style={{ fontFamily: "'Baloo 2', 'Inter', system-ui, sans-serif" }}
            >
              {isPlaying ? "Playing... tap to stop" : audioLabel}
            </span>
            <svg
              width="24"
              height="20"
              viewBox="0 0 28 24"
              fill="none"
              className="text-[#0075de] transition-transform duration-200"
              style={{ transform: isPlaying ? "rotate(-10deg)" : "rotate(5deg)" }}
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

          {/* Audio Action Pill */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
            aria-label={isPlaying ? "Pause audio" : "Play audio"}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 shadow-sm ${
              isPlaying
                ? "bg-[#0075de] text-white ring-2 ring-blue-300"
                : "bg-[#e6f3fe] text-[#0075de] hover:bg-[#d4eafd] border border-[#dbe7f3] hover:scale-105 active:scale-95"
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span className="font-mono text-[11px]">{formatTime(currentTime)}</span>
                {/* Animated Equalizer Bars */}
                <span className="inline-flex items-center gap-0.5 ml-0.5 h-3">
                  <span
                    className="w-0.5 bg-white rounded-full animate-bounce"
                    style={{ height: "6px", animationDuration: "0.6s", animationDelay: "0ms" }}
                  />
                  <span
                    className="w-0.5 bg-white rounded-full animate-bounce"
                    style={{ height: "10px", animationDuration: "0.6s", animationDelay: "150ms" }}
                  />
                  <span
                    className="w-0.5 bg-white rounded-full animate-bounce"
                    style={{ height: "5px", animationDuration: "0.6s", animationDelay: "300ms" }}
                  />
                </span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                <span>Hear Koro</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Card Content (Preserves Exact Existing Typography & Classes) */}
      <span className="was">{wasText}</span>
      <h3>{heading}</h3>
      <div className="fix relative overflow-hidden">
        <span>{fixText}</span>

        {/* Subtle Audio Progress Line along the bottom of the fix pill when active */}
        {isPlaying && (
          <div
            className="absolute bottom-0 left-0 h-0.5 bg-[#0075de] transition-all duration-150"
            style={{ width: `${progressPercent}%` }}
          />
        )}
      </div>
    </div>
  );
}
