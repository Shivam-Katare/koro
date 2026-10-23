"use client";

import React from "react";
import type { GentleReminder } from "@/lib/utils/home-reminders";
import type { DashboardTab } from "@/lib/hooks/use-dashboard-nav";
import { KoroGlyph } from "@/components/brand/koro-face";
import { ArrowRight } from "lucide-react";

interface HomeRemindersFeedProps {
  reminders: GentleReminder[];
  onNavigateTab: (tab: DashboardTab) => void;
}

// Tinted tile behind each Koro icon, by reminder category
const TILE_BG: Record<GentleReminder["category"], string> = {
  memory: "bg-[#e6f3fe] dark:bg-[#243442]",
  operational: "bg-[#fff1cc] dark:bg-[#3a2f12]",
  seasonal: "bg-[#ffe6e1] dark:bg-[#3b211d]",
  reassurance: "bg-[#e8f7ee] dark:bg-[#1c2b22]",
};

export function HomeRemindersFeed({ reminders, onNavigateTab }: HomeRemindersFeedProps) {
  if (reminders.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="home-reminders" className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 id="home-reminders" className="font-heading text-2xl font-bold tracking-tight text-foreground">
            Reminders
          </h2>
          <p className="mt-1 text-base text-muted-foreground">
            Gentle nudges about stock, deliveries and what is coming up.
          </p>
        </div>
        <span className="hidden shrink-0 text-sm text-muted-foreground sm:inline">Refreshed today</span>
      </div>

      <ul className="divide-y divide-border rounded-3xl border border-border bg-card px-2 sm:px-4">
        {reminders.map((reminder) => {
          const tab = reminder.actionTab;
          const actionText = reminder.actionLabel?.replace(/\s*→\s*$/, "");

          const content = (
            <>
              <span
                className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl sm:h-[72px] sm:w-[72px] ${TILE_BG[reminder.category] ?? TILE_BG.memory}`}
              >
                <KoroGlyph type={reminder.iconType} size={46} />
              </span>

              <span className="min-w-0 flex-1 text-left">
                <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="text-lg font-semibold leading-snug text-foreground">{reminder.title}</span>
                  {reminder.badgeText && (
                    <span className="rounded-full bg-muted px-3 py-0.5 text-sm font-medium text-foreground/80">
                      {reminder.badgeText}
                    </span>
                  )}
                </span>
                <span className="mt-1 block text-base leading-relaxed text-muted-foreground">
                  {reminder.description}
                </span>
                <span className="mt-1 block text-sm font-medium text-muted-foreground/80">
                  {reminder.timeTag}
                </span>
              </span>

              {tab && (
                <span className="flex shrink-0 items-center gap-3">
                  {actionText && (
                    <span className="hidden text-base font-semibold text-primary lg:inline">{actionText}</span>
                  )}
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <ArrowRight className="h-5 w-5" />
                  </span>
                </span>
              )}
            </>
          );

          const rowClass = "flex w-full items-center gap-4 py-5 sm:gap-5 sm:px-2";

          return (
            <li key={reminder.id}>
              {tab ? (
                <button
                  type="button"
                  onClick={() => onNavigateTab(tab)}
                  aria-label={actionText ? `${reminder.title}. ${actionText}` : reminder.title}
                  className={`group cursor-pointer rounded-2xl transition-colors hover:bg-muted/60 ${rowClass}`}
                >
                  {content}
                </button>
              ) : (
                <div className={rowClass}>{content}</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
