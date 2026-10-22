"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AssistantMessageItem } from "./assistant-message-item";
import { AssistantConfirmationCard } from "./assistant-confirmation-card";
import { AssistantLiveModal } from "./assistant-live-modal";
import {
  queryAssistantAction,
  fetchAssistantHistoryAction,
  clearAssistantHistoryAction,
  type AssistantResponsePayload,
} from "@/lib/actions/assistant-actions";
import type { Shop, Product, AssistantMessage } from "@/lib/supabase/types";
import {
  Mic,
  MicOff,
  Send,
  Sparkles,
  RotateCcw,
  MapPin,
  Package,
  AlertTriangle,
  IndianRupee,
  PlusCircle,
  Loader2,
  Volume2,
  Radio,
} from "lucide-react";
import toast from "react-hot-toast";

interface AssistantVoiceCardProps {
  shop: Shop | null;
  products: Product[];
}

export function AssistantVoiceCard({ shop, products }: AssistantVoiceCardProps) {
  const [isLiveOpen, setIsLiveOpen] = useState(false);
  const [messages, setMessages] = useState<
    Array<{
      id?: string;
      role: "user" | "assistant" | "system";
      content: string;
      taskType?: string | null;
      structuredData?: any;
      pendingAction?: any;
    }>
  >([]);


  const [inputQuery, setInputQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [progressMsg, setProgressMsg] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [speechSupported, setSpeechSupported] = useState(true);

  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const sampleProductName = products[0]?.name || "Lakme";

  // Quick Action Chips (PhonePe / Google Pay Style)
  const quickChips = [
    { label: `📍 Where is ${sampleProductName}?`, query: `Where is ${sampleProductName}?` },
    { label: `📦 Stock of ${sampleProductName}`, query: `Stock of ${sampleProductName}` },
    { label: "⚠️ What is low on stock?", query: "What is low on stock?" },
    { label: `💰 Price of ${sampleProductName}`, query: `Price of ${sampleProductName}` },
    { label: `➕ Add 5 to ${sampleProductName}`, query: `Add 5 to ${sampleProductName}` },
  ];

  // Initialize Web Speech API
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = "en-IN"; // Supports English and Indian English/Hinglish

        recognition.onstart = () => {
          setIsListening(true);
          setInterimTranscript("");
        };

        recognition.onresult = (event: any) => {
          let currentInterim = "";
          let finalTranscript = "";

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              currentInterim += event.results[i][0].transcript;
            }
          }

          if (currentInterim) {
            setInterimTranscript(currentInterim);
          }

          if (finalTranscript) {
            setInterimTranscript(finalTranscript);
            handleSendQuery(finalTranscript);
          }
        };

        recognition.onerror = (event: any) => {
          console.warn("Speech recognition error:", event.error);
          setIsListening(false);
          setInterimTranscript("");
          if (event.error === "not-allowed") {
            toast.error("Microphone permission denied. You can type your question.");
          }
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      } else {
        setSpeechSupported(false);
      }
    }
  }, []);

  // Fetch past conversation messages for this shop on mount
  useEffect(() => {
    if (!shop?.id) return;
    fetchAssistantHistoryAction(shop.id).then((res) => {
      if (res.success && res.messages.length > 0) {
        setMessages(
          res.messages.map((m: AssistantMessage) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            taskType: m.task_type,
            structuredData: (m.metadata as any)?.structuredData,
            pendingAction: (m.metadata as any)?.pendingAction,
          }))
        );
      }
    });
  }, [shop?.id]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, interimTranscript, isLoading]);

  const toggleListening = () => {
    if (!speechSupported) {
      toast("Voice input not supported in this browser. Please type below.", { icon: "ℹ️" });
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current?.start();
      } catch (err) {
        console.error("Failed to start voice recognition:", err);
      }
    }
  };

  const handleSendQuery = async (queryText?: string) => {
    const q = (queryText || inputQuery).trim();
    if (!q || !shop?.id || isLoading) return;

    setInputQuery("");
    setInterimTranscript("");
    setIsLoading(true);

    // Simple, concise progress message
    if (q.toLowerCase().includes("where") || q.toLowerCase().includes("kahan")) {
      setProgressMsg("Finding location...");
    } else if (q.toLowerCase().includes("stock") || q.toLowerCase().includes("kitna")) {
      setProgressMsg("Checking inventory...");
    } else if (q.toLowerCase().includes("price") || q.toLowerCase().includes("rate")) {
      setProgressMsg("Looking up price...");
    } else {
      setProgressMsg("Checking store...");
    }

    // Add user message to UI immediately
    setMessages((prev) => [...prev, { role: "user", content: q }]);

    const res = await queryAssistantAction({
      shopId: shop.id,
      query: q,
      conversationHistory: messages.map((m) => ({ role: m.role, content: m.content })),
    });

    setIsLoading(false);
    setProgressMsg("");

    if (!res.success || !res.message) {
      toast.error(res.error || "Could not process request");
      return;
    }

    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: res.message.content,
        taskType: res.message.taskType,
        structuredData: res.message.structuredData,
        pendingAction: res.message.pendingAction,
      },
    ]);
  };

  const handleClearHistory = async () => {
    if (!shop?.id) return;
    await clearAssistantHistoryAction(shop.id);
    setMessages([]);
    toast.success("Chat history cleared");
  };

  return (
    <div className="rounded-2xl border border-primary/20 bg-gradient-to-b from-primary/5 via-card to-card p-4 sm:p-5 shadow-xs space-y-4">
      {/* Assistant Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border/60">
        <div className="flex items-center gap-2.5">
          <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-2xs">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading font-bold text-base text-foreground">
                Koro Voice Assistant
              </h3>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] py-0">
                Voice-First v1
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Bolo aur poocho: Stock check, product location, price, ya instant adjustment
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={() => setIsLiveOpen(true)}
            className="h-8 px-3 rounded-xl bg-gradient-to-r from-red-500 via-rose-500 to-amber-500 hover:from-red-600 hover:to-amber-600 text-white font-bold text-xs gap-1.5 shadow-sm hover:shadow-md active:scale-95 cursor-pointer transition-all border-0"
          >
            <Radio className="h-3.5 w-3.5 animate-pulse" />
            <span>Go Live</span>
          </Button>

          {messages.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={handleClearHistory}
              className="text-xs text-muted-foreground hover:text-foreground gap-1 cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" />
              <span className="hidden sm:inline">Clear Chat</span>
            </Button>
          )}
        </div>
      </div>


      {/* Hero Voice Tap Area (PhonePe / Google Pay Style) */}
      <div className="flex flex-col items-center justify-center py-3 sm:py-4 space-y-3">
        <div className="relative">
          {/* Animated Wave Rings when listening */}
          {isListening && (
            <>
              <div className="absolute inset-0 rounded-full bg-primary/30 animate-ping duration-1000" />
              <div className="absolute -inset-2 rounded-full border-2 border-primary/50 animate-pulse" />
            </>
          )}

          {/* Main Tactile Mic Button */}
          <button
            type="button"
            onClick={toggleListening}
            aria-label={isListening ? "Stop listening" : "Tap to speak with Koro"}
            className={`relative z-10 h-16 w-16 sm:h-20 sm:w-20 rounded-full flex flex-col items-center justify-center transition-all shadow-md cursor-pointer ${
              isListening
                ? "bg-red-500 text-white scale-105 ring-4 ring-red-400/40"
                : "bg-primary text-primary-foreground hover:scale-105 active:scale-95 hover:shadow-lg"
            }`}
          >
            {isListening ? (
              <MicOff className="h-7 w-7 sm:h-8 sm:w-8 animate-pulse" />
            ) : (
              <Mic className="h-7 w-7 sm:h-8 sm:w-8" />
            )}
          </button>
        </div>

        <div className="text-center space-y-0.5">
          <p className="text-xs sm:text-sm font-bold text-foreground">
            {isListening ? (
              <span className="text-red-500 animate-pulse font-semibold">
                Listening... Bolo, I am hearing you!
              </span>
            ) : (
              <span>Tap to Speak (&ldquo;Bolo Koro&rdquo;)</span>
            )}
          </p>
          <p className="text-[11px] text-muted-foreground">
            Fast answers for Indian shopkeepers during rush hours
          </p>
          <button
            type="button"
            onClick={() => setIsLiveOpen(true)}
            className="mt-1.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/25 transition-all cursor-pointer shadow-2xs hover:scale-102 active:scale-98"
          >
            <Radio className="h-3 w-3 animate-ping" />
            <span>Want real-time spoken Hindi & English? Go Live</span>
          </button>
        </div>

        {/* Live Interim Transcript Bubble while speaking */}
        {isListening && interimTranscript && (
          <div className="bg-primary/10 border border-primary/30 px-3.5 py-1.5 rounded-full text-xs text-primary font-medium flex items-center gap-2 max-w-sm truncate animate-pulse">
            <Volume2 className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">&ldquo;{interimTranscript}&rdquo;</span>
          </div>
        )}
      </div>

      {/* One-Tap Suggestion Chips (Paytm / Google Pay Style) */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
        {quickChips.map((chip, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSendQuery(chip.query)}
            disabled={isLoading}
            className="px-2.5 py-1 rounded-full text-[11px] font-medium border border-border bg-background hover:bg-muted/80 text-foreground transition-all active:scale-95 cursor-pointer shadow-2xs"
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Manual Input Bar (Typing Fallback) */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendQuery();
        }}
        className="flex items-center gap-2 pt-2"
      >
        <Input
          placeholder="Or type here... e.g. Where is Lakme? / Stock of Tata Tea"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          disabled={isLoading || isListening}
          className="h-10 text-xs sm:text-sm bg-background border-border"
        />
        <Button
          type="submit"
          size="sm"
          disabled={!inputQuery.trim() || isLoading}
          className="h-10 px-4 font-semibold text-xs gap-1.5 cursor-pointer shrink-0"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">Ask</span>
        </Button>
      </form>

      {/* Conversation Thread */}
      {messages.length > 0 && (
        <div className="pt-3 border-t border-border/60 space-y-3 max-h-[320px] overflow-y-auto pr-1">
          {messages.map((msg, index) => (
            <div key={msg.id || index} className="space-y-2">
              <AssistantMessageItem
                role={msg.role}
                content={msg.content}
                taskType={msg.taskType}
                structuredData={msg.structuredData}
              />

              {/* Confirmation Card for Pending Actions */}
              {msg.pendingAction && shop && (
                <AssistantConfirmationCard
                  shopId={shop.id}
                  action={msg.pendingAction}
                  onSuccess={(confirmMsg) => {
                    // Update state to remove pendingAction
                    setMessages((prev) =>
                      prev.map((m, i) =>
                        i === index ? { ...m, pendingAction: null, content: confirmMsg } : m
                      )
                    );
                  }}
                  onCancel={() => {
                    setMessages((prev) =>
                      prev.map((m, i) => (i === index ? { ...m, pendingAction: null } : m))
                    );
                    toast("Action cancelled");
                  }}
                />
              )}
            </div>
          ))}

          {/* Simple Loading Indicator */}
          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground p-2 rounded-lg bg-muted/40 max-w-xs animate-pulse">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              <span>{progressMsg || "Checking store..."}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Real-time Gemini Live Modal */}
      <AssistantLiveModal
        isOpen={isLiveOpen}
        onOpenChange={setIsLiveOpen}
        shop={shop}
        onStockUpdated={() => {
          if (shop?.id) {
            fetchAssistantHistoryAction(shop.id).then((res) => {
              if (res.success && res.messages) {
                setMessages(
                  res.messages.map((m: AssistantMessage) => ({
                    id: m.id,
                    role: m.role,
                    content: m.content,
                    taskType: m.task_type,
                    structuredData: (m.metadata as any)?.structuredData,
                    pendingAction: (m.metadata as any)?.pendingAction,
                  }))
                );
              }
            });
          }
        }}
      />
    </div>
  );
}
