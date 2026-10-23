"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { KoroFace } from "@/components/brand/koro-face";
import {
  fetchAssistantConversationsAction,
  deleteAssistantConversationAction,
  type AssistantConversationSummary,
} from "@/lib/actions/assistant-actions";
import { useAssistantStore } from "@/lib/store/use-assistant-store";
import type { Shop, Product, Profile } from "@/lib/supabase/types";
import {
  MessageSquare,
  Radio,
  Search,
  Plus,
  Trash2,
  Clock,
  ArrowRight,
  Sparkles,
  RefreshCw,
  MessageCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

interface ChatsViewProps {
  shop: Shop | null;
  products: Product[];
  profile: Profile | null;
}

function formatChatDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24 && d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    }
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) {
      return d.toLocaleDateString("en-IN", { weekday: "short" });
    }
    return d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

export function ChatsView({ shop }: ChatsViewProps) {
  const { openDrawer } = useAssistantStore();
  const [conversations, setConversations] = useState<AssistantConversationSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "chat" | "live">("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadConversations = useCallback(
    async (showRefreshIndicator = false) => {
      if (!shop?.id) {
        setIsLoading(false);
        return;
      }
      if (showRefreshIndicator) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      try {
        const res = await fetchAssistantConversationsAction(shop.id);
        if (res.success && res.conversations) {
          setConversations(res.conversations);
        } else if (res.error) {
          toast.error(res.error);
        }
      } catch (err) {
        console.error("Failed to load conversations:", err);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [shop?.id]
  );

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const handleDeleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!shop?.id || deletingId) return;

    setDeletingId(convId);
    try {
      const res = await deleteAssistantConversationAction(shop.id, convId);
      if (res.success) {
        setConversations((prev) => prev.filter((c) => c.id !== convId));
        toast.success("Conversation deleted");
      } else {
        toast.error(res.error || "Failed to delete conversation");
      }
    } catch {
      toast.error("Failed to delete conversation");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredConversations = useMemo(() => {
    return conversations.filter((c) => {
      const matchesSearch =
        searchQuery === "" ||
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType =
        filterType === "all" ||
        (filterType === "live" && c.isLive) ||
        (filterType === "chat" && !c.isLive);

      return matchesSearch && matchesType;
    });
  }, [conversations, searchQuery, filterType]);

  const liveCount = useMemo(() => conversations.filter((c) => c.isLive).length, [conversations]);
  const textCount = conversations.length - liveCount;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Chats & AI History
            </h1>
            <Badge variant="secondary" className="font-medium text-xs rounded-full px-2.5 py-0.5">
              {conversations.length} {conversations.length === 1 ? "session" : "sessions"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Review past voice sessions, queries, and continue any conversation with Koro.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadConversations(true)}
            disabled={isRefreshing || isLoading}
            className="cursor-pointer gap-2 rounded-xl text-xs font-medium h-10 px-3.5"
            title="Refresh history"
          >
            <RefreshCw className={cn("size-4", isRefreshing && "animate-spin")} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          <Button
            onClick={() => openDrawer()}
            className="cursor-pointer gap-2 rounded-xl font-semibold h-10 px-4.5 shadow-xs"
          >
            <Plus className="size-4" />
            <span>New Chat</span>
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations by title or message..."
            className="pl-10 h-10 rounded-xl bg-card border-border/80 text-sm shadow-none focus-visible:ring-primary"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/60 border border-border/50 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setFilterType("all")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer",
              filterType === "all"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            All ({conversations.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType("chat")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer",
              filterType === "chat"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <MessageSquare className="size-3.5" />
            <span>Text ({textCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterType("live")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer",
              filterType === "live"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Radio className="size-3.5 text-red-500" />
            <span>Live Voice ({liveCount})</span>
          </button>
        </div>
      </div>

      {/* Conversations List / Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-border bg-card p-5 space-y-3 animate-pulse"
            >
              <div className="flex items-center justify-between">
                <div className="size-9 rounded-xl bg-muted" />
                <div className="h-4 w-16 rounded bg-muted" />
              </div>
              <div className="h-5 w-3/4 rounded bg-muted" />
              <div className="h-4 w-full rounded bg-muted/70" />
              <div className="h-4 w-1/2 rounded bg-muted/50" />
            </div>
          ))}
        </div>
      ) : filteredConversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-16 px-4 rounded-3xl border border-dashed border-border bg-card/50">
          <KoroFace size={64} tone="marigold" />
          <h3 className="font-heading text-lg font-bold text-foreground mt-4">
            {searchQuery || filterType !== "all"
              ? "No matching conversations found"
              : "No chat history yet"}
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm mt-1.5 mb-5">
            {searchQuery || filterType !== "all"
              ? "Try adjusting your search query or switching filters to find what you are looking for."
              : "Start a new conversation with Koro or talk via Live Voice mode to ask about product locations, check stock, or manage inventory."}
          </p>
          <Button
            onClick={() => openDrawer()}
            className="cursor-pointer gap-2 rounded-xl font-semibold px-5 shadow-xs"
          >
            <Plus className="size-4" />
            <span>Start a conversation</span>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {filteredConversations.map((c) => {
            const isDeleting = deletingId === c.id;
            return (
              <div
                key={c.id}
                onClick={() => openDrawer({ conversationId: c.id })}
                className={cn(
                  "group relative flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5",
                  "transition-all duration-200 cursor-pointer hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5",
                  isDeleting && "opacity-50 pointer-events-none"
                )}
              >
                <div>
                  {/* Top Bar: Icon, Session Type, Timestamp, Delete */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "size-9 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                          c.isLive
                            ? "bg-red-500/10 text-red-600 dark:text-red-400"
                            : "bg-primary/10 text-primary"
                        )}
                      >
                        {c.isLive ? (
                          <Radio className="size-4" />
                        ) : (
                          <MessageSquare className="size-4" />
                        )}
                      </div>
                      <Badge
                        variant="secondary"
                        className="text-[11px] font-medium rounded-md px-2 py-0.5"
                      >
                        {c.isLive ? "Live Voice" : "Text Chat"}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="size-3" />
                        {formatChatDate(c.lastTimestamp)}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => handleDeleteConversation(c.id, e)}
                        title="Delete conversation"
                        className="size-7 rounded-lg flex items-center justify-center text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all cursor-pointer"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="font-heading font-semibold text-foreground text-base line-clamp-1 group-hover:text-primary transition-colors">
                    {c.title || "Chat session"}
                  </h3>

                  {/* Message Snippet */}
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1.5 leading-relaxed">
                    {c.lastMessage || "No messages in this chat yet."}
                  </p>
                </div>

                {/* Footer action */}
                <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-xs font-semibold text-primary">
                  <span>Continue conversation</span>
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
