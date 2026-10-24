"use client";

import React, { useEffect, useState } from "react";
import { ArrowUp, Mic, MessageSquare, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { KoroFace } from "@/components/brand/koro-face";
import { cn } from "@/lib/utils";

export interface HomeHeroChip {
  label: string;
  query: string;
  icon: LucideIcon;
}

interface HomeHeroProps {
  firstName: string;
  query: string;
  onQueryChange: (value: string) => void;
  onSubmit: (queryOverride?: string) => void;
  onGoLive: () => void;
  onDictate: () => void;
  isDictating: boolean;
  onOpenChat: () => void;
  chips: HomeHeroChip[];
  todayEarnings?: number;
  todaySlipsCount?: number;
  onViewSales?: () => void;
}

function getGreeting(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function HomeHero({
  firstName,
  query,
  onQueryChange,
  onSubmit,
  onGoLive,
  onDictate,
  isDictating,
  onOpenChat,
  chips,
  todayEarnings = 0,
  todaySlipsCount = 0,
  onViewSales,
}: HomeHeroProps) {
  // Computed after mount so server and client markup never disagree on the hour.
  const [greeting, setGreeting] = useState("Hello");
  useEffect(() => {
    setGreeting(getGreeting(new Date().getHours()));
  }, []);

  return (
    <section
      aria-labelledby="home-greeting"
      className="relative"
    >
      {/* Greeting */}
      <div className="mx-auto max-w-3xl text-center">
        <h1
          id="home-greeting"
          className="font-heading text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl"
        >
          {greeting},{" "}
          <span className="inline-block rounded-md bg-[#ffb110] px-4 py-0.5 text-black">
            {firstName}
          </span>
        </h1>
        <p className="mt-3 text-lg text-muted-foreground sm:text-xl">
          Talk to Koro about your shop, in your own words.
        </p>
      </div>

      {/* Go Live: the big mic */}
      <div className="mt-8 flex flex-col items-center sm:mt-10">
        <div className="relative flex h-44 w-full max-w-md items-center justify-center">

          <span className="koro-ring absolute h-28 w-28 rounded-full bg-primary" aria-hidden="true" />
          <span
            className="koro-ring absolute h-28 w-28 rounded-full bg-primary [animation-delay:1.4s]"
            aria-hidden="true"
          />
          <button
            type="button"
            onClick={onGoLive}
            aria-label="Go live: talk to Koro hands-free"
            className="group relative flex h-28 w-28 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground ring-[3px] ring-card outline-[3px] outline-primary transition-transform duration-200 hover:scale-105 focus-visible:outline-offset-4 active:scale-95"
          >
            <Mic className="h-12 w-12" strokeWidth={2.2} />
          </button>
        </div>

        <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">Tap to talk live</p>
        <p className="mt-1 flex items-center gap-2 text-base text-muted-foreground">
          <span className="h-2.5 w-2.5 rounded-full bg-success" aria-hidden="true" />
          Hands-free voice conversation with Koro
        </p>
      </div>

      {/* Written question: ChatGPT / Claude style box */}
      <div className="mx-auto mt-10 max-w-3xl">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-1">
          <p className="text-base font-medium text-muted-foreground">
            Or write your question
          </p>

          {/* Today's Sales KPI Pill */}
          <button
            type="button"
            onClick={onViewSales}
            title="Click to view Sales & Slips"
            className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3.5 py-1 text-sm font-semibold text-emerald-600 transition-colors hover:bg-emerald-500/20 dark:border-emerald-400/25 dark:bg-emerald-400/10 dark:text-emerald-400 shadow-2xs"
          >
            <TrendingUp className="h-4 w-4" />
            <span>Today&apos;s sales:</span>
            <span className="font-heading font-extrabold text-foreground tabular-nums">
              ₹{todayEarnings.toFixed(0)}
            </span>
            {todaySlipsCount > 0 && (
              <span className="text-xs font-normal text-muted-foreground">
                ({todaySlipsCount} slip{todaySlipsCount > 1 ? "s" : ""})
              </span>
            )}
          </button>
        </div>
        <div className="rounded-3xl border border-input bg-card p-3 transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
          <textarea
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSubmit();
              }
            }}
            rows={2}
            aria-label="Ask Koro a question"
            placeholder="Ask anything, e.g. Where is Lakme kajal?"
            className="block w-full resize-none bg-transparent px-3 py-2 text-lg leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/70"
          />
          <div className="flex items-center justify-between gap-3 pt-1">
            <button
              type="button"
              onClick={onDictate}
              title={isDictating ? "Listening... tap to stop" : "Dictate: speak and your words are typed here"}
              className={cn(
                "inline-flex h-11 cursor-pointer items-center gap-2 rounded-full px-4 text-base font-medium transition-colors",
                isDictating
                  ? "animate-pulse bg-red-500/15 text-red-600 dark:text-red-400"
                  : "bg-muted text-foreground hover:bg-secondary hover:text-primary"
              )}
            >
              <Mic className="h-5 w-5" />
              <span>{isDictating ? "Listening..." : "Dictate"}</span>
            </button>

            <button
              type="button"
              onClick={() => onSubmit()}
              disabled={!query.trim()}
              aria-label="Send question"
              title="Send"
              className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ArrowUp className="h-5 w-5" strokeWidth={2.4} />
            </button>
          </div>
        </div>
        <p className="mt-3 text-center text-sm text-muted-foreground">
          Dictate types out what you say. For a full voice conversation, tap the big mic above.
        </p>
      </div>

      {/* Suggested questions */}
      <div className="mx-auto mt-8 max-w-3xl">
        <h2 className="mb-3 text-center text-base font-semibold text-foreground">Quick answers</h2>
        <div className="flex flex-wrap justify-center gap-2.5">
          {chips.map((chip) => {
            const Icon = chip.icon;
            return (
              <button
                key={chip.label}
                type="button"
                onClick={() => onSubmit(chip.query)}
                className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full bg-secondary px-4 py-2 text-base font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{chip.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
