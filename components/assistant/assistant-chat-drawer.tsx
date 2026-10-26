"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { AssistantMessageItem } from "./assistant-message-item";
import { AssistantConfirmationCard } from "./assistant-confirmation-card";
import { KoroFace } from "@/components/brand/koro-face";
import { KoroVoiceVisualizer } from "./koro-voice-visualizer";
import { AssistantFloatingLivePill } from "./assistant-floating-live-pill";
import { useGeminiLive } from "@/lib/hooks/use-gemini-live";
import {
  queryAssistantAction,
  fetchAssistantConversationsAction,
  fetchAssistantConversationMessagesAction,
  deleteAssistantConversationAction,
  type AssistantConversationSummary,
} from "@/lib/actions/assistant-actions";
import type { Shop, Product } from "@/lib/supabase/types";
import {
  Mic,
  MicOff,
  ArrowUp,
  AudioLines,
  X,
  Loader2,
  MapPin,
  Package,
  AlertTriangle,
  IndianRupee,
  PhoneOff,
  History,
  Plus,
  Trash2,
  MessageSquare,
  ChevronLeft,
} from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

function formatConvTime(dateStr: string) {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) {
      return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    }
    return d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

// Each suggestion gets its own colour from the app palette
const CHIP_TONES = [
  "bg-[#e6f3fe] text-primary dark:bg-[#243442]",
  "bg-[#fff1cc] text-amber-700 dark:bg-[#3a2f12] dark:text-amber-300",
  "bg-[#ffe6e1] text-[#f64932] dark:bg-[#3b211d]",
  "bg-[#e8f7ee] text-[#14a44d] dark:bg-[#1c2b22]",
];

interface AssistantChatDrawerProps {
  shop: Shop | null;
  products: Product[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  pendingInitialQuery?: string;
  onClearPendingQuery?: () => void;
  pendingStartLive?: boolean;
  onClearPendingStartLive?: () => void;
  initialConversationId?: string | null;
  onClearInitialConversationId?: () => void;
}

export function AssistantChatDrawer({
  shop,
  products,
  isOpen,
  onOpenChange,
  pendingInitialQuery,
  onClearPendingQuery,
  pendingStartLive,
  onClearPendingStartLive,
  initialConversationId,
  onClearInitialConversationId,
}: AssistantChatDrawerProps) {
  // Drawer width state (resizable)
  const [drawerWidth, setDrawerWidth] = useState<number>(440);
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);

  // Conversation history state
  const [conversations, setConversations] = useState<AssistantConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string>(() => `conv_${Date.now()}`);
  const [activeMessages, setActiveMessages] = useState<
    Array<{
      id?: string;
      role: "user" | "assistant" | "system";
      content: string;
      taskType?: string | null;
      structuredData?: any;
      pendingAction?: any;
      pendingActions?: any[] | null;
    }>
  >([]);
  const [isHistoryViewOpen, setIsHistoryViewOpen] = useState(false);

  // Input state
  const [inputQuery, setInputQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [progressMsg, setProgressMsg] = useState("");

  // Dictation state (Web Speech API)
  const [isDictating, setIsDictating] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const sampleProductName = products[0]?.name || "Lakme";

  // Quick action suggestions inside empty state
  const quickChips = [
    { label: `Where is ${sampleProductName}?`, query: `Where is ${sampleProductName}?`, icon: MapPin },
    { label: `Stock of ${sampleProductName}`, query: `Stock of ${sampleProductName}`, icon: Package },
    { label: "What is low on stock?", query: "What is low on stock?", icon: AlertTriangle },
    { label: `Price of ${sampleProductName}`, query: `Price of ${sampleProductName}`, icon: IndianRupee },
  ];

  // Refresh conversations list from Supabase
  const loadConversations = useCallback(async () => {
    if (!shop?.id) return;
    const res = await fetchAssistantConversationsAction(shop.id);
    if (res.success && res.conversations) {
      setConversations(res.conversations);
    }
  }, [shop?.id]);

  // Load conversation messages from Supabase
  const loadConversationMessages = useCallback(
    async (convId: string) => {
      if (!shop?.id || !convId) return;
      const res = await fetchAssistantConversationMessagesAction(shop.id, convId);
      if (res.success) {
        setActiveMessages(res.messages || []);
      }
    },
    [shop?.id]
  );

  const liveActionProposedInTurnRef = useRef<boolean>(false);

  // Gemini Live Hook directly integrated into the drawer workspace
  const {
    status: liveStatus,
    isLive,
    isMuted,
    micVolume,
    assistantVolume,
    userTranscript,
    assistantTranscript,
    startSession,
    stopSession,
    toggleMute,
  } = useGeminiLive({
    shopId: shop?.id || null,
    conversationId: activeConversationId,
    onTurnComplete: (turn) => {
      setActiveMessages((prev) => {
        const next = [...prev];

        // 1. If userText was spoken during this turn:
        if (turn.userText) {
          if (liveActionProposedInTurnRef.current) {
            // Find the last assistant card message that was added during this turn
            const lastAssistantCardIdx = next.length - 1;
            if (
              lastAssistantCardIdx >= 0 &&
              next[lastAssistantCardIdx].role === "assistant" &&
              next[lastAssistantCardIdx].pendingAction
            ) {
              // Insert user speech before the action card so order is User -> Assistant Card
              next.splice(lastAssistantCardIdx, 0, {
                role: "user" as const,
                content: turn.userText,
              });
            } else {
              next.push({ role: "user" as const, content: turn.userText });
            }
          } else {
            next.push({ role: "user" as const, content: turn.userText });
          }
        }

        // 2. If assistantText was spoken:
        if (turn.assistantText) {
          if (liveActionProposedInTurnRef.current) {
            // Card was already created by onStockAdjustmentProposed!
            // Update the card message's text with Koro's spoken answer so there is NO DUPLICATE CARD!
            const lastAssistantCardIdx = [...next]
              .reverse()
              .findIndex((m) => m.role === "assistant" && m.pendingAction);

            if (lastAssistantCardIdx !== -1) {
              const actualIdx = next.length - 1 - lastAssistantCardIdx;
              next[actualIdx] = {
                ...next[actualIdx],
                content: turn.assistantText,
              };
            }
          } else {
            // No action was proposed, just a normal assistant spoken answer
            next.push({
              role: "assistant" as const,
              content: turn.assistantText,
            });
          }
        }

        liveActionProposedInTurnRef.current = false;
        return next;
      });
      loadConversations();
    },
    onStockAdjustmentProposed: (action) => {
      liveActionProposedInTurnRef.current = true;
      let promptText = `Maine **${action.productName}** ke liye details taiyaar ki hain. Kripya niche confirm karein:`;
      if (action.actionType === "delete_product") {
        promptText = `⚠️ **${action.productName}** ko delete karne ke liye confirmation chahiye. Niche review karein:`;
      } else if (action.actionType === "record_sale") {
        promptText =
          action.items && action.items.length > 1
            ? `**${action.items.length} items** ka sales slip record karne ke liye details screen par taiyaar hain:`
            : `**${action.productName}** ka sale record karne ke liye details screen par taiyaar hain:`;
      } else if (action.actionType === "record_order_arrival") {
        promptText = `**${action.productName}** ka stock delivery arrival record karne ke liye details taiyaar hain:`;
      }
      setActiveMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: promptText,
          pendingAction: action,
        },
      ]);
    },
  });

  // Load saved drawer width on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("koro_chat_drawer_width");
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 340 && parsed <= 850) {
          setDrawerWidth(parsed);
        }
      }
    }
  }, []);

  // Fetch conversations on mount
  useEffect(() => {
    if (shop?.id) {
      loadConversations();
    }
  }, [shop?.id, loadConversations]);

  // Web Speech API for dictation into the drawer input
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = "en-IN";

        recognition.onstart = () => setIsDictating(true);
        recognition.onresult = (event: any) => {
          let currentTranscript = "";
          for (let i = 0; i < event.results.length; ++i) {
            currentTranscript += event.results[i][0].transcript;
          }
          if (currentTranscript) {
            setInputQuery(currentTranscript);
          }
        };
        recognition.onerror = (event: any) => {
          console.warn("Speech recognition error:", event.error);
          setIsDictating(false);
          if (event.error === "not-allowed") {
            toast.error("Microphone permission denied.");
          }
        };
        recognition.onend = () => setIsDictating(false);

        recognitionRef.current = recognition;
      } else {
        setSpeechSupported(false);
      }
    }
  }, []);

  // Scroll to bottom when messages or transcripts change
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeMessages, userTranscript, assistantTranscript, isLoading, isOpen]);

  // Send query handler for text/dictate chat
  const handleSendQuery = useCallback(
    async (queryText?: string, explicitConvId?: string) => {
      const q = (queryText || inputQuery).trim();
      const targetConvId = explicitConvId || activeConversationId;
      if (!q || !shop?.id || isLoading) return;

      setInputQuery("");
      setIsLoading(true);

      if (q.toLowerCase().includes("where") || q.toLowerCase().includes("kahan")) {
        setProgressMsg("Finding location...");
      } else if (q.toLowerCase().includes("stock") || q.toLowerCase().includes("kitna")) {
        setProgressMsg("Checking inventory...");
      } else if (q.toLowerCase().includes("price") || q.toLowerCase().includes("rate")) {
        setProgressMsg("Looking up price...");
      } else {
        setProgressMsg("Checking store...");
      }

      setActiveMessages((prev) => [...prev, { role: "user", content: q }]);

      const res = await queryAssistantAction({
        shopId: shop.id,
        query: q,
        conversationId: targetConvId,
        conversationHistory: activeMessages.map((m) => ({ role: m.role, content: m.content })),
      });

      setIsLoading(false);
      setProgressMsg("");

      if (!res.success || !res.message) {
        toast.error(res.error || "Could not process request");
        return;
      }

      setActiveMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: res.message.content,
          taskType: res.message.taskType,
          structuredData: res.message.structuredData,
          pendingAction: res.message.pendingAction,
          pendingActions: res.message.pendingActions || null,
        },
      ]);

      loadConversations();
    },
    [inputQuery, shop?.id, isLoading, activeMessages, activeConversationId, loadConversations]
  );

  // Start a fresh, new conversation
  const handleNewChat = useCallback(() => {
    if (isLive) {
      stopSession();
    }
    const freshId = `conv_${Date.now()}`;
    setActiveConversationId(freshId);
    setActiveMessages([]);
    setIsHistoryViewOpen(false);
    setInputQuery("");
  }, [isLive, stopSession]);

  // Select an existing conversation from chat history
  const handleSelectConversation = useCallback(
    async (convId: string) => {
      if (isLive) {
        stopSession();
      }
      setActiveConversationId(convId);
      setIsHistoryViewOpen(false);
      await loadConversationMessages(convId);
    },
    [isLive, stopSession, loadConversationMessages]
  );

  // Delete a single conversation from chat history
  const handleDeleteConversation = useCallback(
    async (convId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!shop?.id) return;
      await deleteAssistantConversationAction(shop.id, convId);
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      if (activeConversationId === convId) {
        handleNewChat();
      }
      toast.success("Conversation deleted");
    },
    [shop?.id, activeConversationId, handleNewChat]
  );

  // Handle pendingInitialQuery from Home page -> Always creates a new conversation by default
  useEffect(() => {
    if (isOpen && pendingInitialQuery && pendingInitialQuery.trim()) {
      const q = pendingInitialQuery.trim();
      onClearPendingQuery?.();
      const freshId = `conv_${Date.now()}`;
      setActiveConversationId(freshId);
      setActiveMessages([]);
      setIsHistoryViewOpen(false);
      handleSendQuery(q, freshId);
    }
  }, [isOpen, pendingInitialQuery, onClearPendingQuery, handleSendQuery]);

  // Handle pendingStartLive from Home page -> Always creates a new conversation by default
  useEffect(() => {
    if (isOpen && pendingStartLive) {
      onClearPendingStartLive?.();
      const freshId = `conv_${Date.now()}`;
      setActiveConversationId(freshId);
      setActiveMessages([]);
      setIsHistoryViewOpen(false);
      startSession();
    }
  }, [isOpen, pendingStartLive, onClearPendingStartLive, startSession]);

  // Handle initialConversationId from Chats page or external navigation
  useEffect(() => {
    if (isOpen && initialConversationId) {
      const convId = initialConversationId;
      onClearInitialConversationId?.();
      handleSelectConversation(convId);
    }
  }, [isOpen, initialConversationId, onClearInitialConversationId, handleSelectConversation]);

  // Toggle dictation
  const toggleDictation = () => {
    if (!speechSupported) {
      toast("Voice dictation is not supported in this browser.", { icon: "ℹ️" });
      return;
    }

    if (isDictating) {
      recognitionRef.current?.stop();
      setIsDictating(false);
    } else {
      try {
        recognitionRef.current?.start();
      } catch (err) {
        console.error("Failed to start voice recognition:", err);
      }
    }
  };

  // Drag-to-resize handlers (the drawer floats 12px from the left edge)
  const handleMouseDownResize = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    setIsDragging(true);
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const minW = 340;
      const maxW = Math.min(window.innerWidth - 48, 850);
      const newWidth = Math.max(minW, Math.min(maxW, moveEvent.clientX - 12));
      setDrawerWidth(newWidth);
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
      setIsDragging(false);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      setDrawerWidth((w) => {
        if (typeof window !== "undefined") {
          localStorage.setItem("koro_chat_drawer_width", w.toString());
        }
        return w;
      });
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const liveLabel = isMuted
    ? "Microphone muted"
    : liveStatus === "speaking"
    ? "Koro is speaking"
    : liveStatus === "listening"
    ? "Listening"
    : liveStatus === "processing"
    ? "Checking your store"
    : "Connecting";

  const headerButton =
    "inline-flex h-10 cursor-pointer items-center gap-2 rounded-full bg-muted px-3 text-base font-medium text-foreground transition-colors hover:bg-secondary hover:text-primary @sm:px-4";

  const hasThread = activeMessages.length > 0 || !!userTranscript || !!assistantTranscript;

  return (
    <>
      {/* Backdrop overlay */}
      {isOpen && (
        <div
          onClick={() => onOpenChange(false)}
          className="fixed inset-0 z-40 bg-foreground/25 backdrop-blur-[2px] transition-opacity duration-300 ease-out"
          aria-hidden="true"
        />
      )}

      {/* Floating drawer panel: rounded on every corner, inset from the screen edges on desktop */}
      <aside
        aria-label="Koro assistant"
        style={{
          width: typeof window !== "undefined" && window.innerWidth < 640 ? "100vw" : `${drawerWidth}px`,
        }}
        className={cn(
          "@container fixed inset-y-0 left-0 z-50 flex max-w-screen flex-col overflow-hidden border border-border bg-card shadow-2xl transition-transform duration-300 ease-out sm:inset-y-3 sm:left-3 sm:max-w-[calc(100vw-1.5rem)] sm:rounded-3xl",
          isDragging && "transition-none select-none",
          isOpen ? "translate-x-0" : "-translate-x-[calc(100%+1rem)] pointer-events-none"
        )}
      >
        {/* Right edge drag handle for resizing drawer width */}
        <div
          onMouseDown={handleMouseDownResize}
          className="group absolute inset-y-6 right-0 z-50 hidden w-3 cursor-col-resize items-center justify-center sm:flex"
          title="Drag to resize"
        >
          <div className="h-10 w-1 rounded-full bg-muted-foreground/0 transition-colors group-hover:bg-muted-foreground/40" />
        </div>

        {/* Header */}
        <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-border px-4 @sm:px-5">
          <div className="flex min-w-0 items-center gap-2.5">
            <KoroFace size={36} tone="marigold" className="shrink-0" />
            <span className="font-heading text-xl font-bold tracking-tight text-foreground">Koro</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsHistoryViewOpen((prev) => !prev)}
              title="Chat history"
              aria-pressed={isHistoryViewOpen}
              className={cn(headerButton, isHistoryViewOpen && "bg-secondary text-primary")}
            >
              <History className="h-5 w-5" />
              <span className="hidden @sm:inline">Chats</span>
              {conversations.length > 0 && (
                <span className="rounded-full bg-background px-2 text-sm font-semibold tabular-nums">
                  {conversations.length}
                </span>
              )}
            </button>

            <button type="button" onClick={handleNewChat} title="Start a new chat" className={headerButton}>
              <Plus className="h-5 w-5" />
              <span className="hidden @sm:inline">New chat</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenChange(false)}
              title="Close"
              aria-label="Close"
              className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Main Content Area: Chats History Panel or Active Conversation */}
        {isHistoryViewOpen ? (
          <div className="no-scrollbar flex-1 space-y-4 overflow-y-auto px-4 py-5 @sm:px-5">
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setIsHistoryViewOpen(false)}
                className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full pr-3 pl-2 text-base font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <ChevronLeft className="h-5 w-5" />
                Back
              </button>
              <h2 className="font-heading text-xl font-bold text-foreground">Chat history</h2>
            </div>

            {conversations.length === 0 ? (
              <div className="flex flex-col items-center gap-4 py-14 text-center">
                <KoroFace size={64} tone="sky" />
                <div className="space-y-1">
                  <p className="text-lg font-semibold text-foreground">No chats yet</p>
                  <p className="text-base text-muted-foreground">Your conversations will show up here.</p>
                </div>
              </div>
            ) : (
              <ul className="space-y-2">
                {conversations.map((c) => {
                  const isActive = c.id === activeConversationId;
                  return (
                    <li key={c.id}>
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => handleSelectConversation(c.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleSelectConversation(c.id);
                          }
                        }}
                        className={cn(
                          "group flex cursor-pointer items-center gap-3 rounded-2xl p-3 transition-colors",
                          isActive ? "bg-secondary" : "bg-muted/60 hover:bg-muted"
                        )}
                      >
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-card text-primary">
                          {c.isLive ? <AudioLines className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" />}
                        </span>

                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-base font-semibold text-foreground">{c.title}</span>
                          <span className="block truncate text-sm text-muted-foreground">{c.lastMessage}</span>
                        </span>

                        <span className="flex shrink-0 flex-col items-end gap-1">
                          <span className="text-sm text-muted-foreground">{formatConvTime(c.lastTimestamp)}</span>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteConversation(c.id, e)}
                            title="Delete conversation"
                            aria-label="Delete conversation"
                            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-opacity hover:bg-destructive/10 hover:text-destructive sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">
            {/* Message thread (scrolls, no scrollbar) */}
            <div className="no-scrollbar flex-1 space-y-4 overflow-y-auto px-4 py-5 @sm:px-5">
              {!hasThread ? (
                /* Centered empty state */
                <div className="mx-auto flex h-full max-w-md flex-col items-center justify-center gap-6 text-center">
                  {isLive ? (
                    <div className="flex flex-col items-center gap-4 py-2">
                      <KoroVoiceVisualizer
                        variant="orb"
                        size={84}
                        micVolume={micVolume}
                        assistantVolume={assistantVolume}
                        status={liveStatus}
                        isMuted={isMuted}
                      />
                      <KoroVoiceVisualizer
                        variant="wave"
                        width={210}
                        height={40}
                        micVolume={micVolume}
                        assistantVolume={assistantVolume}
                        status={liveStatus}
                        isMuted={isMuted}
                      />
                    </div>
                  ) : (
                    <KoroFace size={80} tone="marigold" />
                  )}

                  <div className="space-y-2">
                    <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground">
                      {isLive
                        ? isMuted
                          ? "Microphone is muted"
                          : liveStatus === "speaking"
                          ? "Koro is speaking..."
                          : liveStatus === "listening"
                          ? "Listening to you..."
                          : liveStatus === "processing"
                          ? "Checking store records..."
                          : "Connecting to Koro..."
                        : "How can I help you today?"}
                    </h2>
                    <p className="text-base text-muted-foreground">
                      {isLive
                        ? "Talk naturally in Hindi, English or Hinglish."
                        : "Ask in English, Hindi or Hinglish about your shop."}
                    </p>
                  </div>

                  {!isLive && (
                    <div className="w-full space-y-2.5">
                      {quickChips.map((chip, idx) => {
                        const Icon = chip.icon;
                        return (
                          <button
                            key={chip.label}
                            type="button"
                            onClick={() => handleSendQuery(chip.query)}
                            className="flex w-full cursor-pointer items-center gap-3 rounded-2xl bg-muted/70 p-2.5 pr-4 text-left text-base font-medium text-foreground transition-colors hover:bg-muted"
                          >
                            <span
                              className={cn(
                                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                                CHIP_TONES[idx % CHIP_TONES.length]
                              )}
                            >
                              <Icon className="h-5 w-5" />
                            </span>
                            <span className="truncate">{chip.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {activeMessages.map((msg, index) => (
                    <div key={msg.id || index} className="space-y-2.5">
                      <AssistantMessageItem
                        role={msg.role}
                        content={msg.content}
                        taskType={msg.taskType}
                        structuredData={msg.structuredData}
                      />

                      {/* Inline confirmation card for actions */}
                      {shop && (
                        <>
                          {msg.pendingActions && msg.pendingActions.length > 0 ? (
                            <div className="space-y-3">
                              {msg.pendingActions.map((act, actIdx) => (
                                <AssistantConfirmationCard
                                  key={actIdx}
                                  shopId={shop.id}
                                  action={act}
                                  onSuccess={(confirmMsg) => {
                                    setActiveMessages((prev) =>
                                      prev.map((m, i) => {
                                        if (i !== index) return m;
                                        const remaining = (m.pendingActions || []).filter((_, idx) => idx !== actIdx);
                                        return {
                                          ...m,
                                          pendingActions: remaining.length > 0 ? remaining : null,
                                          pendingAction: remaining[0] || null,
                                          content: `${m.content}\n\n${confirmMsg}`,
                                        };
                                      })
                                    );
                                    loadConversations();
                                  }}
                                  onCancel={() => {
                                    setActiveMessages((prev) =>
                                      prev.map((m, i) => {
                                        if (i !== index) return m;
                                        const remaining = (m.pendingActions || []).filter((_, idx) => idx !== actIdx);
                                        return {
                                          ...m,
                                          pendingActions: remaining.length > 0 ? remaining : null,
                                          pendingAction: remaining[0] || null,
                                        };
                                      })
                                    );
                                    toast("Action cancelled");
                                  }}
                                />
                              ))}
                            </div>
                          ) : msg.pendingAction ? (
                            <AssistantConfirmationCard
                              shopId={shop.id}
                              action={msg.pendingAction}
                              onSuccess={(confirmMsg) => {
                                setActiveMessages((prev) =>
                                  prev.map((m, i) =>
                                    i === index ? { ...m, pendingAction: null, content: confirmMsg } : m
                                  )
                                );
                                loadConversations();
                              }}
                              onCancel={() => {
                                setActiveMessages((prev) =>
                                  prev.map((m, i) => (i === index ? { ...m, pendingAction: null } : m))
                                );
                                toast("Action cancelled");
                              }}
                            />
                          ) : null}
                        </>
                      )}
                    </div>
                  ))}

                  {/* In-flight spoken transcript while talking in Live Mode */}
                  {userTranscript && (
                    <div className="flex justify-end">
                      <p className="max-w-[85%] rounded-3xl rounded-br-lg bg-secondary px-4 py-3 text-base leading-relaxed text-foreground italic">
                        {userTranscript}
                      </p>
                    </div>
                  )}

                  {/* In-flight assistant captions */}
                  {assistantTranscript && (
                    <div className="flex items-start gap-2.5">
                      <KoroFace size={32} tone="marigold" className="mt-0.5 shrink-0" />
                      <p className="min-w-0 max-w-[88%] rounded-3xl rounded-tl-lg bg-muted px-4 py-3 text-base leading-relaxed text-foreground">
                        {assistantTranscript}
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* Text query loading indicator */}
              {isLoading && (
                <div className="flex w-fit items-center gap-2.5 rounded-2xl bg-muted px-4 py-3 text-base text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span>{progressMsg || "Checking store..."}</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Bottom controls: Live call bar OR text input */}
            {isLive ? (
              <div className="flex shrink-0 items-center justify-between gap-2.5 sm:gap-3 border-t border-border bg-card/70 backdrop-blur-md px-3 sm:px-4 py-3.5 @sm:px-5">
                <button
                  type="button"
                  onClick={toggleMute}
                  title={isMuted ? "Unmute microphone" : "Mute microphone"}
                  aria-pressed={isMuted}
                  className={cn(
                    "inline-flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-full px-3.5 text-sm font-semibold transition-all @sm:px-4",
                    isMuted
                      ? "bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-400/30 shadow-[0_0_8px_rgba(251,191,36,0.25)] animate-pulse"
                      : "bg-muted text-foreground hover:bg-secondary hover:text-primary"
                  )}
                >
                  {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  <span className="hidden @sm:inline">{isMuted ? "Unmute" : "Mute"}</span>
                </button>

                <div className="flex min-w-0 items-center gap-2.5 sm:gap-3 overflow-hidden">
                  <KoroVoiceVisualizer
                    variant="wave"
                    width={140}
                    height={34}
                    micVolume={micVolume}
                    assistantVolume={assistantVolume}
                    status={liveStatus}
                    isMuted={isMuted}
                  />
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full shrink-0 transition-all",
                        isMuted
                          ? "bg-amber-400"
                          : liveStatus === "speaking"
                          ? "bg-fuchsia-400 shadow-[0_0_6px_#d946ef] animate-pulse"
                          : liveStatus === "listening"
                          ? "bg-cyan-400 shadow-[0_0_6px_#00f2fe] animate-pulse"
                          : "bg-sky-400 animate-ping"
                      )}
                    />
                    <span className="truncate text-xs sm:text-sm font-semibold text-foreground" aria-live="polite">
                      {liveLabel}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={stopSession}
                  title="End the live conversation"
                  className="inline-flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-full bg-red-600 hover:bg-red-500 px-3.5 sm:px-4 text-sm font-semibold text-white shadow-[0_0_12px_rgba(239,68,68,0.45)] transition-all hover:opacity-90 active:scale-95"
                >
                  <PhoneOff className="h-4 w-4" />
                  <span className="hidden @sm:inline">End</span>
                </button>
              </div>
            ) : (
              <div className="shrink-0 px-4 pt-2 pb-4 @sm:px-5">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendQuery();
                  }}
                  className="rounded-3xl border border-input bg-card p-2.5 transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20"
                >
                  <textarea
                    ref={inputRef}
                    value={inputQuery}
                    onChange={(e) => setInputQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendQuery();
                      }
                    }}
                    rows={2}
                    aria-label="Ask Koro a question"
                    placeholder="Ask about stock, location or price"
                    disabled={isLoading}
                    className="no-scrollbar block max-h-40 w-full resize-none bg-transparent px-2.5 py-2 text-base leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/70"
                  />

                  <div className="flex items-center justify-between gap-2 pt-1">
                    {/* Dictate: types what you say into the box */}
                    <button
                      type="button"
                      onClick={toggleDictation}
                      title={isDictating ? "Listening... tap to stop" : "Dictate: speak and your words are typed here"}
                      className={cn(
                        "inline-flex h-10 cursor-pointer items-center gap-2 rounded-full px-3.5 text-base font-medium transition-colors",
                        isDictating
                          ? "animate-pulse bg-destructive/10 text-destructive"
                          : "bg-muted text-foreground hover:bg-secondary hover:text-primary"
                      )}
                    >
                      <Mic className="h-5 w-5" />
                      <span>{isDictating ? "Listening" : "Dictate"}</span>
                    </button>

                    <div className="flex items-center gap-2">
                      {/* Go Live: hands-free voice conversation */}
                      <button
                        type="button"
                        onClick={startSession}
                        title="Go Live: talk with Koro hands-free"
                        className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-full bg-secondary px-3.5 text-base font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                      >
                        <AudioLines className="h-5 w-5" />
                        <span>Go Live</span>
                      </button>

                      <button
                        type="submit"
                        disabled={!inputQuery.trim() || isLoading}
                        title="Send"
                        aria-label="Send"
                        className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        {isLoading ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <ArrowUp className="h-5 w-5" strokeWidth={2.4} />
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
      </aside>

      {/* Floating live call pill in bottom-right when drawer is closed/minimized */}
      <AssistantFloatingLivePill
        isLive={isLive}
        isOpen={isOpen}
        status={liveStatus}
        isMuted={isMuted}
        micVolume={micVolume}
        assistantVolume={assistantVolume}
        onToggleMute={toggleMute}
        onStop={stopSession}
        onReopen={() => onOpenChange(true)}
      />
    </>
  );
}
