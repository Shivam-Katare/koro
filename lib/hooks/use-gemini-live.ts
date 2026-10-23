"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { GoogleGenAI } from "@google/genai";
import { AudioRecorder } from "@/lib/audio/audio-recorder";
import { AudioPlayer } from "@/lib/audio/audio-player";
import {
  getLiveSessionTokenAction,
  executeLiveToolCallAction,
  saveLiveTurnAction,
} from "@/lib/actions/assistant-live-actions";
import toast from "react-hot-toast";

export type LiveStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "listening"
  | "speaking"
  | "processing"
  | "error";

export interface LiveMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: string;
  pendingAction?: any;
}

interface UseGeminiLiveOptions {
  shopId: string | null;
  conversationId?: string | null;
  onStockAdjustmentProposed?: (action: any) => void;
  onTurnComplete?: (turn: { userText?: string; assistantText?: string; pendingAction?: any }) => void;
}

export function useGeminiLive({
  shopId,
  conversationId,
  onStockAdjustmentProposed,
  onTurnComplete,
}: UseGeminiLiveOptions) {
  const [status, setStatus] = useState<LiveStatus>("idle");
  const [isLive, setIsLive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [micVolume, setMicVolume] = useState(0);
  const [assistantVolume, setAssistantVolume] = useState(0);
  const [userTranscript, setUserTranscript] = useState("");
  const [assistantTranscript, setAssistantTranscript] = useState("");
  const [history, setHistory] = useState<LiveMessage[]>([]);
  const [pendingAction, setPendingAction] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const sessionRef = useRef<any>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const playerRef = useRef<AudioPlayer | null>(null);
  const lastUserTextRef = useRef("");
  const lastAssistantTextRef = useRef("");

  const stopSession = useCallback(() => {
    // 1. Close Live WebSocket Session
    if (sessionRef.current) {
      try {
        sessionRef.current.close();
      } catch (e) {
        // Ignore
      }
      sessionRef.current = null;
    }

    // 2. Stop audio recorder
    if (recorderRef.current) {
      recorderRef.current.stop();
      recorderRef.current = null;
    }

    // 3. Stop audio player
    if (playerRef.current) {
      playerRef.current.close();
      playerRef.current = null;
    }

    setStatus("idle");
    setIsLive(false);
    setMicVolume(0);
    setAssistantVolume(0);
    setUserTranscript("");
    setAssistantTranscript("");
    lastUserTextRef.current = "";
    lastAssistantTextRef.current = "";
  }, []);

  const startSession = useCallback(async () => {
    if (!shopId) {
      toast.error("Shop not found. Please refresh and try again.");
      return;
    }

    setErrorMessage(null);
    setStatus("connecting");
    setIsLive(true);
    setUserTranscript("");
    setAssistantTranscript("");
    lastUserTextRef.current = "";
    lastAssistantTextRef.current = "";

    try {
      // 1. Fetch short-lived ephemeral token from server
      const tokenRes = await getLiveSessionTokenAction(shopId);
      if (!tokenRes.success || !tokenRes.token) {
        throw new Error(tokenRes.error || "Failed to get Live session credentials");
      }

      // 2. Initialize audio player (24kHz speaker)
      const player = new AudioPlayer({
        sampleRate: 24000,
        onVolumeChange: (vol) => {
          setAssistantVolume(vol);
        },
        onPlaybackStateChange: (isPlaying) => {
          setStatus((prev) => {
            if (prev === "error" || prev === "idle") return prev;
            return isPlaying ? "speaking" : "listening";
          });
        },
      });
      playerRef.current = player;

      // 3. Initialize audio recorder (16kHz microphone)
      const recorder = new AudioRecorder({
        sampleRate: 16000,
        onVolumeChange: (vol) => {
          setMicVolume(vol);
        },
        onAudioData: (base64Chunk) => {
          if (sessionRef.current) {
            try {
              sessionRef.current.sendRealtimeInput({
                audio: {
                  data: base64Chunk,
                  mimeType: "audio/pcm;rate=16000",
                },
              });
            } catch (err) {
              console.warn("Failed to stream audio chunk:", err);
            }
          }
        },
      });
      recorderRef.current = recorder;

      // Start capturing microphone input
      await recorder.start();

      // 4. Connect to Gemini Live API via WebSockets
      const ai = new GoogleGenAI({
        apiKey: tokenRes.token,
        httpOptions: { apiVersion: "v1alpha" },
      });

      const session = await ai.live.connect({
        model: tokenRes.model || "models/gemini-3.8-live",
        callbacks: {
          onopen: () => {
            setStatus("listening");
          },
          onmessage: async (message) => {
            // Handle Tool Calling (Function Calls from Gemini)
            if (message.toolCall?.functionCalls) {
              setStatus("processing");
              const functionResponses: any[] = [];

              for (const fc of message.toolCall.functionCalls) {
                const callId = fc.id || "";
                const callName = fc.name || "";
                try {
                  const execResult = await executeLiveToolCallAction({
                    shopId,
                    toolName: callName,
                    args: (fc.args as Record<string, any>) || {},
                  });

                  if (execResult.success) {
                    functionResponses.push({
                      id: callId,
                      name: callName,
                      response: execResult.response,
                    });

                    // If a stock adjustment was proposed, pop up confirmation card
                    if (execResult.pendingAction) {
                      setPendingAction(execResult.pendingAction);
                      if (onStockAdjustmentProposed) {
                        onStockAdjustmentProposed(execResult.pendingAction);
                      }
                    }
                  } else {
                    functionResponses.push({
                      id: callId,
                      name: callName,
                      response: { error: execResult.error || "Operation failed" },
                    });
                  }
                } catch (e: any) {
                  functionResponses.push({
                    id: callId,
                    name: callName,
                    response: { error: e.message || "Failed to execute" },
                  });
                }
              }

              // Send tool outputs back to model
              if (sessionRef.current && functionResponses.length > 0) {
                sessionRef.current.sendToolResponse({ functionResponses });
              }
            }

            // Handle Server Content (Captions & Audio Output)
            const serverContent = message.serverContent;
            if (serverContent) {
              // Interruption handling (barge-in): stop playback immediately if user spoke
              if (serverContent.interrupted) {
                player.stop();
                setStatus("listening");
                setAssistantTranscript("");
                lastAssistantTextRef.current = "";
              }

              // Live User Transcription (Interim or Final)
              if (serverContent.inputTranscription?.text) {
                const userText = serverContent.inputTranscription.text;
                setUserTranscript(userText);
                lastUserTextRef.current = userText;
              }

              // Live Assistant Spoken Transcription
              if (serverContent.outputTranscription?.text) {
                const chunkText = serverContent.outputTranscription.text;
                setAssistantTranscript((prev) => {
                  const updated = prev ? `${prev} ${chunkText}` : chunkText;
                  lastAssistantTextRef.current = updated;
                  return updated;
                });
              }

              // Audio Output Streaming
              if (serverContent.modelTurn?.parts) {
                for (const part of serverContent.modelTurn.parts) {
                  if (part.inlineData?.data) {
                    player.playChunk(part.inlineData.data);
                  }
                }
              }

              // Turn Complete: Save to session history & Supabase
              if (serverContent.turnComplete) {
                const timeStr = new Date().toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                if (lastUserTextRef.current || lastAssistantTextRef.current) {
                  const userText = lastUserTextRef.current;
                  const assistantText = lastAssistantTextRef.current;

                  setHistory((prev) => [
                    ...prev,
                    ...(userText
                      ? [
                          {
                            id: `u-${Date.now()}`,
                            role: "user" as const,
                            text: userText,
                            timestamp: timeStr,
                          },
                        ]
                      : []),
                    ...(assistantText
                      ? [
                          {
                            id: `a-${Date.now()}`,
                            role: "assistant" as const,
                            text: assistantText,
                            timestamp: timeStr,
                            pendingAction: pendingAction || undefined,
                          },
                        ]
                      : []),
                  ]);

                  // Persist to Supabase assistant_messages
                  saveLiveTurnAction({
                    shopId,
                    conversationId: conversationId || undefined,
                    userText,
                    assistantText,
                    pendingAction,
                  });

                  if (onTurnComplete) {
                    onTurnComplete({
                      userText,
                      assistantText,
                      pendingAction,
                    });
                  }

                  // Reset active sentence captions for next turn (prevents duplicate messages)
                  lastUserTextRef.current = "";
                  lastAssistantTextRef.current = "";
                  setUserTranscript("");
                  setAssistantTranscript("");
                }
              }
            }
          },
          onerror: (err: any) => {
            console.error("Live session error:", err);
            setStatus("error");
            setErrorMessage(err?.message || "Connection error with Gemini Live");
            toast.error("Live assistant connection issue");
            stopSession();
          },
          onclose: (e: any) => {
            if (isLive) {
              stopSession();
            }
          },
        },
      });

      sessionRef.current = session;
    } catch (err: any) {
      console.error("Failed to start Live session:", err);
      setStatus("error");
      setErrorMessage(
        err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError"
          ? "Microphone permission was denied. Please allow microphone access to talk live."
          : err?.message || "Could not connect to Gemini Live"
      );
      toast.error(
        err?.name === "NotAllowedError"
          ? "Microphone permission denied"
          : "Could not start Live assistant"
      );
      stopSession();
    }
  }, [shopId, isLive, onStockAdjustmentProposed, pendingAction, stopSession]);

  const toggleMute = useCallback(() => {
    if (!recorderRef.current) return;
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    recorderRef.current.setMute(nextMuted);

    if (sessionRef.current && nextMuted) {
      try {
        sessionRef.current.sendRealtimeInput({ audioStreamEnd: true });
      } catch (e) {
        // Ignore
      }
    }
  }, [isMuted]);

  const clearPendingAction = useCallback(() => {
    setPendingAction(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSession();
    };
  }, [stopSession]);

  return {
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
  };
}
