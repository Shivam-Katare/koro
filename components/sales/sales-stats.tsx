"use client";

import React, { useState, useMemo } from "react";
import { useSalesStore } from "@/lib/store/use-sales-store";
import { KoroGlyph } from "@/components/brand/koro-face";
import type { Product, SalesSlip } from "@/lib/supabase/types";
import {
  calculateSalesAnalytics,
  getSalesForSpecificDay,
  type SalesAnalyticsPeriod,
} from "@/lib/utils/sales-analytics";
import { Calendar, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

interface SalesStatsProps {
  products: Product[];
  initialSlips?: SalesSlip[];
  onPeriodChange?: (period: SalesAnalyticsPeriod, specificDate?: string) => void;
}

export function SalesStats({
  products,
  initialSlips = [],
  onPeriodChange,
}: SalesStatsProps) {
  const lines = useSalesStore((s) => s.lines);
  const recentSlips = useSalesStore((s) => s.recentSlips);

  // Combine initialSlips and recentSlips (removing duplicates by id)
  const combinedSlips = useMemo(() => {
    const map = new Map<string, any>();
    for (const s of initialSlips) {
      if (s?.id) map.set(s.id, s);
    }
    for (const s of recentSlips) {
      if (s?.id) map.set(s.id, s);
    }
    return Array.from(map.values());
  }, [initialSlips, recentSlips]);

  const [period, setPeriod] = useState<SalesAnalyticsPeriod>("today");
  const [specificDate, setSpecificDate] = useState<string>("");

  const handlePeriodSelect = (p: SalesAnalyticsPeriod) => {
    setPeriod(p);
    setSpecificDate("");
    onPeriodChange?.(p, undefined);
  };

  const handleSpecificDateChange = (dateVal: string) => {
    setSpecificDate(dateVal);
    if (dateVal) {
      onPeriodChange?.("all", dateVal);
    } else {
      onPeriodChange?.(period, undefined);
    }
  };

  // Compute analytics based on period or specific date
  const stats = useMemo(() => {
    if (specificDate) {
      const dayStats = getSalesForSpecificDay(combinedSlips, specificDate);
      const formattedDate = new Date(specificDate).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      return {
        periodLabel: formattedDate,
        totalRevenue: dayStats.totalRevenue,
        totalSlips: dayStats.slipsCount,
        totalUnits: dayStats.unitsCount,
        averageSlipValue:
          dayStats.slipsCount > 0 ? Math.round(dayStats.totalRevenue / dayStats.slipsCount) : 0,
      };
    }

    const res = calculateSalesAnalytics(combinedSlips, period);
    return {
      periodLabel: res.periodLabel,
      totalRevenue: res.totalRevenue,
      totalSlips: res.totalSlips,
      totalUnits: res.totalUnits,
      averageSlipValue: res.averageSlipValue,
    };
  }, [combinedSlips, period, specificDate]);

  const draftUnits = lines.reduce((sum, l) => sum + l.quantity, 0);
  const draftTotal = lines.reduce(
    (sum, l) => sum + (l.unitPrice !== null ? l.unitPrice * l.quantity : 0),
    0
  );

  const segmentClass = (active: boolean) =>
    cn(
      "h-9 sm:h-10 cursor-pointer rounded-full px-3.5 sm:px-4 text-xs sm:text-sm font-semibold transition-colors shrink-0",
      active ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
    );

  return (
    <div className="space-y-4">
      {/* Date Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Period Pills */}
        <div className="no-scrollbar flex items-center gap-1 overflow-x-auto rounded-full bg-muted p-1">
          <button
            type="button"
            onClick={() => handlePeriodSelect("today")}
            className={segmentClass(!specificDate && period === "today")}
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => handlePeriodSelect("yesterday")}
            className={segmentClass(!specificDate && period === "yesterday")}
          >
            Yesterday
          </button>
          <button
            type="button"
            onClick={() => handlePeriodSelect("week")}
            className={segmentClass(!specificDate && period === "week")}
          >
            This Week
          </button>
          <button
            type="button"
            onClick={() => handlePeriodSelect("month")}
            className={segmentClass(!specificDate && period === "month")}
          >
            This Month
          </button>
          <button
            type="button"
            onClick={() => handlePeriodSelect("all")}
            className={segmentClass(!specificDate && period === "all")}
          >
            All Time
          </button>
        </div>

        {/* Specific Date Picker & Draft Indicator */}
        <div className="flex flex-wrap items-center gap-2">
          {draftUnits > 0 && (
            <div className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-semibold text-primary">
              <ShoppingBag className="h-3.5 w-3.5" />
              <span>
                Draft: {draftUnits} unit{draftUnits > 1 ? "s" : ""} (₹{draftTotal.toFixed(0)})
              </span>
            </div>
          )}

          {/* Date Picker */}
          <div className="relative inline-flex items-center">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="date"
              aria-label="Filter by specific date"
              value={specificDate}
              onChange={(e) => handleSpecificDateChange(e.target.value)}
              className="h-9 sm:h-10 cursor-pointer rounded-full border border-input bg-card pl-9 pr-3 text-xs sm:text-sm font-semibold text-foreground outline-none transition-colors hover:bg-muted/50 focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            {specificDate && (
              <button
                type="button"
                onClick={() => handleSpecificDateChange("")}
                className="ml-1 text-xs text-muted-foreground hover:text-foreground cursor-pointer underline"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3 Analytics KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Total Shop Earnings in Period */}
        <div className="flex items-center gap-4 rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-xs">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#e8f7ee] dark:bg-[#1c2b22]">
            <KoroGlyph type="trending-up" size={44} />
          </span>
          <div className="min-w-0">
            <p className="font-heading text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 sm:text-4xl tabular-nums">
              ₹{stats.totalRevenue.toFixed(0)}
            </p>
            <p className="text-base font-semibold text-muted-foreground">
              Total sales ({stats.periodLabel})
            </p>
          </div>
        </div>

        {/* Completed Slips Count */}
        <div className="flex items-center gap-4 rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-xs">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#fff1cc] dark:bg-[#3a2f12]">
            <KoroGlyph type="check-circle" size={44} />
          </span>
          <div className="min-w-0">
            <p className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl tabular-nums">
              {stats.totalSlips}
            </p>
            <p className="text-base font-semibold text-muted-foreground">
              Counter slips recorded
            </p>
          </div>
        </div>

        {/* Total Units / Average Slip */}
        <div className="flex items-center gap-4 rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-xs sm:col-span-2 lg:col-span-1">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#e6f3fe] dark:bg-[#10243e]">
            <KoroGlyph type="package" size={44} />
          </span>
          <div className="min-w-0">
            <p className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl tabular-nums">
              {stats.totalUnits}
            </p>
            <p className="text-base font-semibold text-muted-foreground">
              {stats.totalSlips > 0 ? `Units sold (avg ₹${stats.averageSlipValue}/slip)` : "Total units sold"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
