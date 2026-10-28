"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  Play,
  Pause,
  Volume2,
  Volume1,
  VolumeX,
  Maximize,
  Minimize,
  Sparkles,
} from "lucide-react";

export function DemoTrailerPlayer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [hasStarted, setHasStarted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferedPercent, setBufferedPercent] = useState(0);
  const [volume, setVolume] = useState(1.0); // High volume by default
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [flashIcon, setFlashIcon] = useState<"play" | "pause" | null>(null);

  // Set default volume to 100% (high) on video element
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = 1.0;
      videoRef.current.muted = false;
    }
  }, []);

  // Format mm:ss
  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds) || timeInSeconds < 0) return "0:00";
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      const activeFs = Boolean(
        document.fullscreenElement ||
          (document as unknown as { webkitFullscreenElement?: Element }).webkitFullscreenElement
      );
      setIsFullscreen(activeFs);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Controls auto-hide
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying && !isScrubbing) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 2600);
    }
  }, [isPlaying, isScrubbing]);

  const handleMouseMove = () => {
    resetControlsTimer();
  };

  const handleMouseLeave = () => {
    if (isPlaying && !isScrubbing) {
      setShowControls(false);
    }
  };

  // Play / Pause toggle
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (!hasStarted) {
      setHasStarted(true);
      video.volume = 1.0;
      video.muted = false;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
          })
          .catch((err) => {
            console.warn("Direct play notice:", err);
          });
      }
      return;
    }

    if (video.paused || video.ended) {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            setFlashIcon("play");
            setTimeout(() => setFlashIcon(null), 500);
          })
          .catch((err) => {
            console.warn("Play resume notice:", err);
          });
      }
    } else {
      video.pause();
      setIsPlaying(false);
      setFlashIcon("pause");
      setTimeout(() => setFlashIcon(null), 500);
    }
    resetControlsTimer();
  }, [hasStarted, resetControlsTimer]);

  // Toggle Mute
  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isMuted) {
      video.muted = false;
      setIsMuted(false);
      if (volume === 0) {
        video.volume = 1.0;
        setVolume(1.0);
      }
    } else {
      video.muted = true;
      setIsMuted(true);
    }
    resetControlsTimer();
  };

  // Volume slider
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    const video = videoRef.current;
    if (video) {
      video.volume = newVolume;
      if (newVolume === 0) {
        video.muted = true;
        setIsMuted(true);
      } else if (isMuted) {
        video.muted = false;
        setIsMuted(false);
      }
    }
    resetControlsTimer();
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container) return;

    const isFs = Boolean(
      document.fullscreenElement ||
        (document as unknown as { webkitFullscreenElement?: Element }).webkitFullscreenElement
    );

    if (!isFs) {
      if (container.requestFullscreen) {
        container.requestFullscreen().catch(() => {
          if ((video as unknown as { webkitEnterFullscreen?: () => void })?.webkitEnterFullscreen) {
            (video as unknown as { webkitEnterFullscreen: () => void }).webkitEnterFullscreen();
          }
        });
      } else if ((video as unknown as { webkitEnterFullscreen?: () => void })?.webkitEnterFullscreen) {
        (video as unknown as { webkitEnterFullscreen: () => void }).webkitEnterFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if (
        (document as unknown as { webkitExitFullscreen?: () => void })?.webkitExitFullscreen
      ) {
        (document as unknown as { webkitExitFullscreen: () => void }).webkitExitFullscreen();
      }
    }
    resetControlsTimer();
  };

  // Video time & buffer tracking
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    setCurrentTime(video.currentTime);

    if (video.buffered.length > 0) {
      const bufferedEnd = video.buffered.end(video.buffered.length - 1);
      const totalDuration = video.duration || 1;
      setBufferedPercent(Math.min(100, (bufferedEnd / totalDuration) * 100));
    }
  };

  // Seek bar scrub calculation
  const updateScrubTime = (clientX: number) => {
    const bar = progressBarRef.current;
    const video = videoRef.current;
    if (!bar || !video || !duration) return;

    const rect = bar.getBoundingClientRect();
    const offsetX = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const targetPercent = offsetX / rect.width;
    const targetTime = targetPercent * duration;

    video.currentTime = targetTime;
    setCurrentTime(targetTime);
  };

  const handleScrubberMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsScrubbing(true);
    updateScrubTime(e.clientX);

    const onMouseMove = (moveEvent: MouseEvent) => {
      updateScrubTime(moveEvent.clientX);
    };

    const onMouseUp = () => {
      setIsScrubbing(false);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const handleScrubberTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setIsScrubbing(true);
    updateScrubTime(e.touches[0].clientX);

    const onTouchMove = (moveEvent: TouchEvent) => {
      if (moveEvent.touches.length > 0) {
        updateScrubTime(moveEvent.touches[0].clientX);
      }
    };

    const onTouchEnd = () => {
      setIsScrubbing(false);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };

    window.addEventListener("touchmove", onTouchMove);
    window.addEventListener("touchend", onTouchEnd);
  };

  // Keyboard accessibility
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === " " || e.key === "k") {
      e.preventDefault();
      togglePlay();
    } else if (e.key === "m") {
      e.preventDefault();
      toggleMute();
    } else if (e.key === "f") {
      e.preventDefault();
      toggleFullscreen();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      if (videoRef.current) {
        videoRef.current.currentTime = Math.min(
          videoRef.current.duration,
          videoRef.current.currentTime + 5
        );
      }
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      if (videoRef.current) {
        videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 5);
      }
    }
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative w-full aspect-video rounded-xl sm:rounded-2xl overflow-hidden bg-slate-950 border border-slate-200/80 dark:border-slate-800 shadow-[0_25px_60px_-15px_rgba(0,60,120,0.22)] select-none group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all ${
        isFullscreen ? "rounded-none border-none max-w-none h-full" : "max-w-[1040px] mx-auto"
      }`}
      aria-label="Koro Product Demo Trailer Video Player"
    >
      {/* HTML5 Video Element */}
      <video
        ref={videoRef}
        src="/media/trailer.mp4"
        preload="metadata"
        playsInline
        onClick={togglePlay}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => {
          if (videoRef.current) {
            setDuration(videoRef.current.duration || 0);
            videoRef.current.volume = 1.0;
            videoRef.current.muted = false;
          }
        }}
        onPlay={() => {
          setIsPlaying(true);
          setHasStarted(true);
        }}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          setShowControls(true);
        }}
        className="w-full h-full object-contain bg-black cursor-pointer"
      />

      {/* Center Action Indicator Flash (when clicking on video) */}
      {flashIcon && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20">
          <div className="p-4 rounded-full bg-black/65 backdrop-blur-md text-white shadow-2xl scale-125 animate-out fade-out zoom-out duration-500">
            {flashIcon === "play" ? (
              <Play className="w-10 h-10 fill-white" />
            ) : (
              <Pause className="w-10 h-10 fill-white" />
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* BEAUTIFUL THUMBNAIL / POSTER OVERLAY (shown until user starts playing)   */}
      {/* ========================================================================= */}
      {!hasStarted && (
        <div
          onClick={togglePlay}
          className="absolute inset-0 z-30 cursor-pointer flex flex-col justify-between p-5 sm:p-8 md:p-10 transition-opacity duration-300 bg-gradient-to-br from-[#0c1a2e] via-[#091322] to-[#040810] text-white"
        >
          {/* Subtle Ambient Radial Lighting */}
          <div
            className="absolute inset-0 pointer-events-none opacity-40 mix-blend-screen"
            style={{
              background:
                "radial-gradient(ellipse at 50% 30%, rgba(0, 117, 222, 0.45) 0%, transparent 65%)",
            }}
          />

          {/* Top Bar of Thumbnail */}
          <div className="relative z-10 flex items-center justify-between">
          </div>

          {/* Center Play Button & Title */}
          <div className="relative z-10 flex flex-col items-center text-center my-auto px-4">
            {/* Play Button with Pulsing Ring */}
            <div className="relative group/play mb-4 sm:mb-5">
              <div className="absolute -inset-2 sm:-inset-3 rounded-full bg-blue-500/30 blur-md group-hover/play:bg-blue-500/50 transition-all duration-300 animate-pulse" />
              <button
                type="button"
                aria-label="Play demo video"
                className="relative flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-[#005db2] via-[#0075de] to-[#2593fc] text-white shadow-[0_10px_35px_rgba(0,117,222,0.55)] border border-white/30 transform transition-transform duration-200 group-hover/play:scale-110 active:scale-95"
              >
                <Play className="w-7 h-7 sm:w-9 sm:h-9 fill-white translate-x-0.5" />
              </button>
            </div>

            <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-white mb-2 max-w-xl">
              See How Koro Works For Local Shops
            </h3>
            <p className="text-xs sm:text-sm text-slate-300/90 max-w-md leading-relaxed hidden sm:block">
              Voice billing, instant shelf check, and restock lists in action. Click to play.
            </p>
          </div>

          {/* Bottom Bar of Thumbnail */}
          <div className="relative z-10 flex items-center justify-between text-xs text-slate-300/80 pt-2 border-t border-white/10">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-blue-400" />
              <span className="font-medium">Audio Enabled by Default</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400" />
              <span>Full Screen Available</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SLEEK, UNCLUTTERED CUSTOM CONTROLS OVERLAY                               */}
      {/* ========================================================================= */}
      {hasStarted && (
        <div
          className={`absolute inset-x-0 bottom-0 z-20 transition-opacity duration-300 ${
            showControls || !isPlaying
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          }`}
        >
          {/* Gradient backdrop */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent pointer-events-none -top-12" />

          <div className="relative px-3 sm:px-5 pb-3 sm:pb-4 pt-2">
            {/* Timeline / Scrubber Progress Bar */}
            <div
              ref={progressBarRef}
              onMouseDown={handleScrubberMouseDown}
              onTouchStart={handleScrubberTouchStart}
              className="relative w-full h-2.5 sm:h-3 flex items-center cursor-pointer group/scrub mb-2"
              role="slider"
              aria-label="Video scrubber"
              aria-valuemin={0}
              aria-valuemax={duration || 100}
              aria-valuenow={currentTime}
            >
              {/* Background Track */}
              <div className="w-full h-1 sm:h-1.5 bg-white/20 rounded-full overflow-hidden transition-all duration-150 group-hover/scrub:h-2">
                {/* Buffered Progress */}
                <div
                  className="h-full bg-white/25 transition-all duration-300"
                  style={{ width: `${bufferedPercent}%` }}
                />
              </div>

              {/* Played Progress Bar */}
              <div
                className="absolute top-1/2 -translate-y-1/2 left-0 h-1 sm:h-1.5 bg-gradient-to-r from-blue-500 to-[#0075de] rounded-full transition-all duration-75 group-hover/scrub:h-2"
                style={{ width: `${progressPercent}%` }}
              />

              {/* Scrubber Thumb */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 sm:w-3.5 sm:h-3.5 bg-white rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.5)] transform -translate-x-1/2 opacity-0 group-hover/scrub:opacity-100 transition-opacity duration-150 pointer-events-none"
                style={{ left: `${progressPercent}%` }}
              />
            </div>

            {/* Controls Row: Pause/Play, Time, Volume/Mute, Fullscreen */}
            <div className="flex items-center justify-between text-white text-sm">
              {/* Left Side: Play/Pause + Time */}
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={togglePlay}
                  aria-label={isPlaying ? "Pause video" : "Play video"}
                  className="p-1.5 sm:p-2 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white focus:outline-none focus:ring-1 focus:ring-blue-400"
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-white" />
                  ) : (
                    <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-white" />
                  )}
                </button>

                {/* Minimal Time Readout */}
                <span className="text-xs sm:text-sm font-mono tracking-tight text-slate-200 select-none">
                  {formatTime(currentTime)}{" "}
                  <span className="text-white/40">/</span> {formatTime(duration)}
                </span>
              </div>

              {/* Right Side: Volume & Fullscreen */}
              <div className="flex items-center gap-2 sm:gap-3.5">
                {/* Volume & Mute Controls */}
                <div className="flex items-center gap-1.5 sm:gap-2 group/vol">
                  <button
                    type="button"
                    onClick={toggleMute}
                    aria-label={isMuted ? "Unmute audio" : "Mute audio"}
                    className="p-1.5 sm:p-2 rounded-lg hover:bg-white/15 active:scale-95 transition-all text-slate-200 hover:text-white focus:outline-none focus:ring-1 focus:ring-blue-400"
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
                    ) : volume <= 0.5 ? (
                      <Volume1 className="w-4 h-4 sm:w-5 sm:h-5" />
                    ) : (
                      <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-300" />
                    )}
                  </button>

                  {/* Volume Slider Track */}
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    aria-label="Volume slider"
                    className="w-14 sm:w-20 h-1 bg-white/25 rounded-lg appearance-none cursor-pointer accent-blue-400 focus:outline-none"
                  />
                </div>

                {/* Fullscreen Toggle Button */}
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                  className="p-1.5 sm:p-2 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white focus:outline-none focus:ring-1 focus:ring-blue-400"
                >
                  {isFullscreen ? (
                    <Minimize className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    <Maximize className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
