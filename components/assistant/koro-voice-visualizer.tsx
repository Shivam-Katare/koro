"use client";

import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface KoroVoiceVisualizerProps {
  variant?: "wave" | "orb";
  micVolume?: number; // 0 to 100
  assistantVolume?: number; // 0 to 100
  status?: string; // "idle" | "connecting" | "listening" | "speaking" | "processing" | "error"
  isMuted?: boolean;
  width?: number;
  height?: number;
  size?: number; // For orb variant
  className?: string;
}

/**
 * KoroVoiceVisualizer
 * High-performance, neon-glowing voice visualizer inspired by fluid AI waves and glowing iridescent orbs.
 * Reacts organically to live mic volume and assistant playback volume with smooth interpolation.
 */
export function KoroVoiceVisualizer({
  variant = "wave",
  micVolume = 0,
  assistantVolume = 0,
  status = "listening",
  isMuted = false,
  width = 160,
  height = 36,
  size = 36,
  className,
}: KoroVoiceVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);

  // Volume & phase animation refs for smooth 60fps interpolation
  const currentVolRef = useRef(0);
  const phaseRef = useRef(0);
  const isMutedRef = useRef(isMuted);
  const statusRef = useRef(status);

  // Determine active volume target (0..1)
  const rawVol = status === "speaking" ? assistantVolume : micVolume;
  const targetVol = isMuted ? 0 : Math.min(1, Math.max(0, rawVol / 100));

  useEffect(() => {
    isMutedRef.current = isMuted;
    statusRef.current = status;
  }, [isMuted, status]);

  // Waveform rendering loop
  useEffect(() => {
    if (variant !== "wave") return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Handle high-DPI displays
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    let isRunning = true;

    const render = () => {
      if (!isRunning) return;

      // Smooth volume interpolation (decay or ramp up)
      const smoothingFactor = currentVolRef.current < targetVol ? 0.22 : 0.12;
      currentVolRef.current += (targetVol - currentVolRef.current) * smoothingFactor;

      const vol = currentVolRef.current;
      const currentStatus = statusRef.current;
      const muted = isMutedRef.current;

      // Phase speed: faster when speaking or active, gentle idle when silent
      const speed = currentStatus === "speaking" ? 0.08 : vol > 0.05 ? 0.06 : 0.03;
      phaseRef.current += speed;
      const phase = phaseRef.current;

      ctx.clearRect(0, 0, width, height);

      const midY = height / 2;
      const effectiveAmp = muted
        ? 1.5
        : Math.max(2.5, vol * (height * 0.42) + (vol > 0.02 ? 3 : 1.5));

      // Wave configurations matching neon cyan, electric blue, and glowing violet/magenta
      const waves = [
        {
          color: "#00f2fe", // Neon Cyan
          glow: "rgba(0, 242, 254, 0.75)",
          lineWidth: 2.2,
          freq: 2.2,
          phaseOffset: 0,
          ampMult: 1.0,
        },
        {
          color: "#3b82f6", // Electric Sky/Blue
          glow: "rgba(59, 130, 246, 0.65)",
          lineWidth: 1.8,
          freq: 2.8,
          phaseOffset: Math.PI * 0.55,
          ampMult: 0.85,
        },
        {
          color: "#c084fc", // Glowing Violet / Magenta
          glow: "rgba(192, 132, 252, 0.6)",
          lineWidth: 1.6,
          freq: 1.8,
          phaseOffset: Math.PI * 1.15,
          ampMult: 0.7,
        },
      ];

      // Draw each sinusoidal wave
      waves.forEach((w) => {
        ctx.save();
        ctx.beginPath();

        ctx.strokeStyle = muted ? "rgba(156, 163, 175, 0.4)" : w.color;
        ctx.shadowColor = muted ? "transparent" : w.glow;
        ctx.shadowBlur = muted ? 0 : 8;
        ctx.lineWidth = w.lineWidth;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        const points = 48;
        for (let i = 0; i <= points; i++) {
          const x = (i / points) * width;
          // Normalised x position (-1 to 1) for natural parabolic windowing at ends
          const normX = (i / points) * 2 - 1;
          const envelope = Math.max(0, 1 - normX * normX); // 0 at edges, 1 at center

          const angle = (i / points) * Math.PI * 2 * w.freq + phase + w.phaseOffset;
          const y = midY + Math.sin(angle) * effectiveAmp * w.ampMult * envelope;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();

        // Optional tiny glowing node points at the left and right anchors
        if (!muted && vol > 0.02) {
          ctx.fillStyle = w.color;
          ctx.beginPath();
          ctx.arc(4, midY, 1.5, 0, Math.PI * 2);
          ctx.arc(width - 4, midY, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      });

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [variant, width, height, targetVol]);

  if (variant === "orb") {
    // Glowing Iridescent Fluid Orb matching Image 2
    const vol = isMuted ? 0 : Math.min(1, rawVol / 100);
    const pulseScale = 1 + vol * 0.28;
    const glowSpread = 12 + vol * 24;

    return (
      <div
        className={cn(
          "relative flex items-center justify-center shrink-0 select-none",
          className
        )}
        style={{ width: `${size}px`, height: `${size}px` }}
      >
        {/* Ambient Outer Diffuse Glow */}
        <div
          className={cn(
            "absolute inset-0 rounded-full transition-all duration-300 pointer-events-none",
            isMuted
              ? "opacity-30 bg-amber-500/20"
              : status === "speaking"
              ? "opacity-90 bg-fuchsia-500/30"
              : "opacity-80 bg-cyan-500/25"
          )}
          style={{
            filter: `blur(${glowSpread}px)`,
            transform: `scale(${pulseScale * 1.35})`,
          }}
        />

        {/* Outer Iridescent Fluid Gradient Ring */}
        <div
          className={cn(
            "absolute inset-0 rounded-full transition-transform duration-150 ease-out",
            isMuted
              ? "border border-amber-400/30 bg-zinc-900"
              : status === "speaking"
              ? "shadow-[0_0_18px_rgba(217,70,239,0.7),inset_0_0_12px_rgba(0,242,254,0.5)]"
              : "shadow-[0_0_18px_rgba(0,242,254,0.7),inset_0_0_12px_rgba(168,85,247,0.5)]"
          )}
          style={{
            transform: `scale(${pulseScale})`,
            background: isMuted
              ? "radial-gradient(circle, #27272a 40%, #18181b 90%)"
              : "radial-gradient(circle at 35% 35%, rgba(0,242,254,0.9), rgba(59,130,246,0.6) 45%, rgba(168,85,247,0.8) 75%, rgba(236,72,153,0.9) 100%)",
          }}
        >
          {/* Rotating aura overlay */}
          {!isMuted && (
            <div
              className="absolute inset-0 rounded-full animate-spin opacity-80"
              style={{
                animationDuration: status === "speaking" ? "2.5s" : "4.5s",
                background:
                  "conic-gradient(from 0deg, transparent 0%, #00f2fe 30%, #a855f7 60%, #ec4899 85%, transparent 100%)",
                mixBlendMode: "screen",
              }}
            />
          )}
        </div>

        {/* Inner Dark Glossy Glass Core */}
        <div
          className="relative z-10 rounded-full bg-zinc-950/90 dark:bg-black/90 backdrop-blur-sm flex items-center justify-center transition-all duration-150"
          style={{
            width: `${Math.round(size * 0.62)}px`,
            height: `${Math.round(size * 0.62)}px`,
          }}
        >
          {/* Inner core pulse dot */}
          <div
            className={cn(
              "rounded-full transition-all duration-100",
              isMuted
                ? "bg-amber-400/60"
                : status === "speaking"
                ? "bg-gradient-to-tr from-cyan-400 to-fuchsia-400 shadow-[0_0_8px_#ec4899]"
                : "bg-gradient-to-tr from-cyan-400 to-blue-400 shadow-[0_0_8px_#00f2fe]"
            )}
            style={{
              width: `${Math.max(4, Math.round(size * 0.24 * (1 + vol * 0.6)))}px`,
              height: `${Math.max(4, Math.round(size * 0.24 * (1 + vol * 0.6)))}px`,
            }}
          />
        </div>
      </div>
    );
  }

  // Waveform canvas
  return (
    <div
      className={cn("relative flex items-center justify-center shrink-0", className)}
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: `${width}px`, height: `${height}px` }}
        className="block"
      />
    </div>
  );
}
