"use client";

import React, { useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AssistantConfirmationCard } from "./assistant-confirmation-card";
import { useGeminiLive, type LiveStatus } from "@/lib/hooks/use-gemini-live";
import type { Shop } from "@/lib/supabase/types";
import {
  Mic,
  MicOff,
  PhoneOff,
  Sparkles,
  Volume2,
  Radio,
  Loader2,
  AlertCircle,
  HelpCircle,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";

interface AssistantLiveModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  shop: Shop | null;
  onStockUpdated?: () => void;
}

export function AssistantLiveModal({
  isOpen,
  onOpenChange,
  shop,
  onStockUpdated,
}: AssistantLiveModalProps) {
  const {
    status,
    isLive,
    isMuted,
    micVolume,
    assistantVolume,
    userTranscript,
    assistantTranscript,
    history,
    pendingAction,
    errorMessage,
    startSession,
    stopSession,
    toggleMute,
    clearPendingAction,
  } = useGeminiLive({
    shopId: shop?.id || null,
    onStockAdjustmentProposed: (action) => {
      // Sound feedback or alert
      toast("Stock update proposed! Confirm below.", { icon: "📝" });
    },
  });

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-connect when modal opens
  useEffect(() => {
    if (isOpen && !isLive && status === "idle") {
      startSession();
    } else if (!isOpen && isLive) {
      stopSession();
    }
  }, [isOpen, isLive, status, startSession, stopSession]);

  // Scroll conversation into view
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, userTranscript, assistantTranscript]);

  const handleClose = () => {
    stopSession();
    onOpenChange(false);
  };

  // Status Badge Label & Color
  const getStatusBadge = () => {
    switch (status) {
      case "connecting":
        return {
          label: "Connecting...",
          className: "bg-amber-500/10 text-amber-500 border-amber-500/20",
          icon: <Loader2 className="h-3 w-3 animate-spin" />,
        };
      case "listening":
        return {
          label: "Listening... Bolo (Speak freely)",
          className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 animate-pulse",
          icon: <Radio className="h-3 w-3 animate-ping" />,
        };
      case "speaking":
        return {
          label: "Koro is speaking...",
          className: "bg-primary/10 text-primary border-primary/20",
          icon: <Volume2 className="h-3 w-3 animate-bounce" />,
        };
      case "processing":
        return {
          label: "Checking inventory...",
          className: "bg-sky-500/10 text-sky-500 border-sky-500/20",
          icon: <Loader2 className="h-3 w-3 animate-spin" />,
        };
      case "error":
        return {
          label: "Connection Issue",
          className: "bg-red-500/10 text-red-500 border-red-500/20",
          icon: <AlertCircle className="h-3 w-3" />,
        };
      default:
        return {
          label: "Idle",
          className: "bg-muted text-muted-foreground",
          icon: <Radio className="h-3 w-3" />,
        };
    }
  };

  const statusBadge = getStatusBadge();

  // Dynamic Orb Scale & Glow
  const orbScale =
    status === "speaking"
      ? 1 + (assistantVolume / 100) * 0.35
      : status === "listening" && !isMuted
      ? 1 + (micVolume / 100) * 0.3
      : 1;

  const orbColorClass =
    status === "speaking"
      ? "from-amber-400 via-primary to-rose-500 shadow-primary/30"
      : status === "listening" && !isMuted
      ? "from-emerald-400 via-teal-500 to-primary shadow-emerald-500/20"
      : status === "processing"
      ? "from-sky-400 via-indigo-500 to-primary animate-spin shadow-sky-500/20"
      : "from-zinc-500 to-zinc-700 shadow-zinc-500/10";

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg p-0 overflow-hidden border border-border/80 bg-background/95 backdrop-blur-md shadow-2xl">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border/60 bg-gradient-to-r from-primary/10 via-background to-background">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-base sm:text-lg font-bold font-heading">
                    Koro Live
                  </DialogTitle>
                  <Badge variant="outline" className="text-[10px] py-0 px-1.5 bg-red-500/10 text-red-500 border-red-500/20 font-semibold uppercase tracking-wider">
                    Live Call
                  </Badge>
                  <Badge variant="outline" className="text-[10px] py-0 px-1.5 bg-primary/10 text-primary border-primary/20 font-medium">
                    Female Voice
                  </Badge>
                </div>
                <DialogDescription className="text-xs text-muted-foreground">
                  Hindi & English real-time spoken conversation
                </DialogDescription>
              </div>
            </div>

            <Badge variant="outline" className={`text-xs py-1 px-2.5 gap-1.5 font-medium border ${statusBadge.className}`}>
              {statusBadge.icon}
              <span className="hidden sm:inline">{statusBadge.label}</span>
            </Badge>
          </div>
        </div>

        {/* Center Live Voice Orb */}
        <div className="flex flex-col items-center justify-center py-6 px-4 bg-radial from-primary/10 via-transparent to-transparent">
          <div className="relative flex items-center justify-center h-36 w-36 sm:h-40 sm:w-40">
            {/* Outer Soundwave Rings */}
            {isLive && (
              <>
                <div
                  className="absolute inset-0 rounded-full border border-primary/30 transition-transform duration-75 ease-out"
                  style={{
                    transform: `scale(${orbScale * 1.3})`,
                    opacity: status === "speaking" || status === "listening" ? 0.6 : 0.1,
                  }}
                />
                <div
                  className="absolute -inset-4 rounded-full border-2 border-primary/20 transition-transform duration-100 ease-out"
                  style={{
                    transform: `scale(${orbScale * 1.5})`,
                    opacity: status === "speaking" || status === "listening" ? 0.4 : 0.05,
                  }}
                />
              </>
            )}

            {/* Central Dynamic Voice Sphere */}
            <div
              className={`relative h-24 w-24 sm:h-28 sm:w-28 rounded-full bg-gradient-to-tr ${orbColorClass} flex flex-col items-center justify-center text-white shadow-xl transition-transform duration-75 ease-out`}
              style={{
                transform: `scale(${orbScale})`,
              }}
            >
              {status === "speaking" ? (
                <Volume2 className="h-10 w-10 animate-pulse drop-shadow-md" />
              ) : isMuted ? (
                <MicOff className="h-10 w-10 text-white/70" />
              ) : status === "processing" ? (
                <Sparkles className="h-10 w-10 animate-spin" />
              ) : (
                <Mic className="h-10 w-10 drop-shadow-md" />
              )}
            </div>
          </div>

          <p className="mt-2 text-xs font-semibold text-foreground/80">
            {isMuted
              ? "Microphone muted"
              : status === "speaking"
              ? "Speaking with you..."
              : status === "listening"
              ? "Listening... Ask anything!"
              : status === "processing"
              ? "Checking store records..."
              : "Connecting..."}
          </p>
        </div>

        {/* Live Captions & Stream */}
        <div className="px-4 py-2 border-y border-border/50 bg-muted/20 min-h-[140px] max-h-[220px] overflow-y-auto space-y-2.5 text-xs sm:text-sm">
          {history.length === 0 && !userTranscript && !assistantTranscript && (
            <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground space-y-1.5">
              <Sparkles className="h-5 w-5 text-primary/70 animate-pulse" />
              <p className="text-xs font-medium">Bolo Koro! Ask in Hindi or English</p>
              <p className="text-[11px] text-muted-foreground/80 max-w-xs">
                e.g. &ldquo;Lakme kahan rakha hai?&rdquo; &bull; &ldquo;How much stock of Tata Tea?&rdquo; &bull; &ldquo;What needs restock?&rdquo;
              </p>
            </div>
          )}

          {/* Past Turns in Current Live Call */}
          {history.map((item) => (
            <div
              key={item.id}
              className={`flex flex-col ${item.role === "user" ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2 ${
                  item.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-xs font-medium"
                    : "bg-card border border-border text-foreground rounded-bl-xs shadow-2xs"
                }`}
              >
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-0.5">
                  <span className="font-semibold text-foreground/70">
                    {item.role === "user" ? "Aap" : "Koro"}
                  </span>
                  <span>&bull;</span>
                  <span>{item.timestamp}</span>
                </div>
                <p className="leading-relaxed">{item.text}</p>
              </div>
            </div>
          ))}

          {/* Real-time In-Flight User Speech Transcript */}
          {userTranscript && (
            <div className="flex flex-col items-end animate-fadeIn">
              <div className="max-w-[85%] rounded-2xl px-3.5 py-2 bg-primary/20 border border-primary/40 text-foreground rounded-br-xs">
                <span className="text-[10px] text-primary font-bold block">You (Speaking...)</span>
                <p className="italic">{userTranscript}</p>
              </div>
            </div>
          )}

          {/* Real-time In-Flight Assistant Spoken Captions */}
          {assistantTranscript && (
            <div className="flex flex-col items-start animate-fadeIn">
              <div className="max-w-[85%] rounded-2xl px-3.5 py-2 bg-card border border-primary/30 text-foreground rounded-bl-xs shadow-xs">
                <span className="text-[10px] text-primary font-bold block flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Koro (Speaking...)
                </span>
                <p className="leading-relaxed">{assistantTranscript}</p>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Embedded Confirmation Card for Stock Updates or New Products */}
        {pendingAction && shop && (
          <div className="p-3 bg-muted/30 border-t border-border/80">
            <AssistantConfirmationCard
              shopId={shop.id}
              action={pendingAction}
              onSuccess={(msg) => {
                clearPendingAction();
                if (onStockUpdated) onStockUpdated();
              }}
              onCancel={() => {
                clearPendingAction();
                toast("Action cancelled");
              }}
            />
          </div>
        )}


        {/* Error Banner */}
        {errorMessage && (
          <div className="p-3 bg-red-500/10 border-t border-red-500/20 text-xs text-red-500 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <Button
              type="button"
              size="xs"
              variant="outline"
              onClick={startSession}
              className="text-xs gap-1 border-red-500/30 text-red-500 hover:bg-red-500/10"
            >
              <RefreshCw className="h-3 w-3" /> Retry
            </Button>
          </div>
        )}

        {/* Bottom Control Bar */}
        <div className="p-4 bg-card flex items-center justify-between gap-3 border-t border-border">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={isMuted ? "destructive" : "outline"}
              size="sm"
              onClick={toggleMute}
              disabled={!isLive}
              className="h-9 px-3 text-xs gap-1.5 cursor-pointer font-medium"
            >
              {isMuted ? (
                <>
                  <MicOff className="h-4 w-4" />
                  <span>Unmute</span>
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4" />
                  <span>Mute Mic</span>
                </>
              )}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleClose}
              className="h-9 px-4 text-xs font-bold gap-2 cursor-pointer shadow-xs"
            >
              <PhoneOff className="h-4 w-4" />
              <span>End Call</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
