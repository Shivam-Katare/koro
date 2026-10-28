"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { Pause } from "lucide-react";

interface MicAudioPlayerProps {
  audioSrc?: string;
}

export function MicAudioPlayer({ audioSrc = "/media/reminders.mp3" }: MicAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Default volume to 100% (high)
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 1.0;
    }
  }, []);

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
          .catch((err) => console.warn("Mic audio play error:", err));
      }
    }
  }, [isPlaying]);

  // Strictly no loop: when finished, stop and reset cleanly
  const handleEnded = () => {
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      togglePlay();
    }
  };

  return (
    <div className="relative flex flex-col items-center self-center my-1 select-none">
      {/* HTML5 Audio Element (preloaded metadata, no loop) */}
      <audio
        ref={audioRef}
        src={audioSrc}
        preload="metadata"
        loop={false}
        onEnded={handleEnded}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
      />

      {/* Mic Audio Button */}
      <button
        type="button"
        onClick={togglePlay}
        onKeyDown={handleKeyDown}
        aria-label={isPlaying ? "Stop voice reminder audio" : "Play voice reminder audio demo"}
        className={`mic cursor-pointer transition-transform duration-200 hover:scale-105 active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
          isPlaying ? "scale-105 shadow-[0_0_0_3px_#fff,0_0_0_7px_#0075de]" : ""
        }`}
        style={{
          border: 0,
          background: isPlaying
            ? "linear-gradient(135deg, #0075de 0%, #0056a8 100%)"
            : "var(--blue)",
        }}
      >
        {isPlaying ? (
          <Pause className="w-5 h-5 fill-white text-white" />
        ) : (
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <rect x="9" y="3" width="6" height="12" rx="3" />
            <path d="M5 11a7 7 0 0014 0M12 18v3" />
          </svg>
        )}
      </button>

      {/* Curvy arrow pointing to mic button on desktop / tablet */}
      <div className="absolute left-[calc(50%+36px)] top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1.5 pointer-events-none whitespace-nowrap">
        <svg
          width="26"
          height="22"
          viewBox="0 0 28 24"
          fill="none"
          className="text-[#0075de]"
          style={{ transform: "rotate(180deg) scaleY(-1)" }}
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
        <span
          className="text-xs font-semibold text-[#0075de] tracking-tight"
          style={{ fontFamily: "'Baloo 2', 'Inter', system-ui, sans-serif" }}
        >
          {isPlaying ? "Playing... tap to stop" : "Hear voice demo"}
        </span>
      </div>

      {/* Mobile label below the button */}
      <div className="sm:hidden -mt-2 mb-2 pointer-events-none select-none">
        <span
          className="text-[11px] font-semibold text-[#0075de]"
          style={{ fontFamily: "'Baloo 2', 'Inter', system-ui, sans-serif" }}
        >
          {isPlaying ? "Playing... tap to stop" : "Tap to listen"}
        </span>
      </div>
    </div>
  );
}
