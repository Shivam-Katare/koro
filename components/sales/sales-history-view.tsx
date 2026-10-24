"use client";

import { useEffect, useState, useMemo } from "react";
import { fetchRecentSlipsAction } from "@/lib/actions/sales-actions";
import { useSalesStore } from "@/lib/store/use-sales-store";
import { SalesSlipDetailDialog } from "./sales-slip-detail-dialog";
import type { Shop, SalesSlip } from "@/lib/supabase/types";
import { KoroFace, KoroGlyph } from "@/components/brand/koro-face";
import {
  ReceiptText,
  CheckCircle2,
  ChevronRight,
  Search,
  RefreshCw,
  X,
  Calendar,
} from "lucide-react";
import {
  filterSlipsByPeriod,
  getSalesForSpecificDay,
  type SalesAnalyticsPeriod,
} from "@/lib/utils/sales-analytics";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

interface SalesHistoryViewProps {
  shop: Shop | null;
  initialSlips?: SalesSlip[];
}

export function SalesHistoryView({ shop, initialSlips = [] }: SalesHistoryViewProps) {
  const recentSlips = useSalesStore((s) => s.recentSlips);
  const setRecentSlips = useSalesStore((s) => s.setRecentSlips);
  const [selectedSlip, setSelectedSlip] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [periodFilter, setPeriodFilter] = useState<SalesAnalyticsPeriod>("all");
  const [customDate, setCustomDate] = useState<string>("");

  const loadSlips = async () => {
    if (!shop) return;
    setLoading(true);
    const res = await fetchRecentSlipsAction(shop.id);
    setLoading(false);
    if (res.success) {
      setRecentSlips(res.slips || []);
    } else {
      toast.error(res.error || "Failed to load recent slips");
    }
  };

  useEffect(() => {
    loadSlips();
  }, [shop?.id]);

  // Combine initial and recent slips
  const allSlips = useMemo(() => {
    const map = new Map<string, any>();
    for (const s of initialSlips) {
      if (s?.id) map.set(s.id, s);
    }
    for (const s of recentSlips) {
      if (s?.id) map.set(s.id, s);
    }
    return Array.from(map.values());
  }, [initialSlips, recentSlips]);

  const filteredSlips = useMemo(() => {
    let list = allSlips;

    // Apply custom date or period filter
    if (customDate) {
      list = getSalesForSpecificDay(list, customDate).slips;
    } else if (periodFilter !== "all") {
      list = filterSlipsByPeriod(list, periodFilter);
    }

    // Apply search query
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter((s) => {
        const matchNumber = s.slip_number?.toLowerCase().includes(q);
        const matchNotes = s.notes?.toLowerCase().includes(q);
        const matchLines = (s.lines || []).some((l: any) =>
          l.raw_item_name?.toLowerCase().includes(q)
        );
        return matchNumber || matchNotes || matchLines;
      });
    }

    return list;
  }, [allSlips, periodFilter, customDate, search]);

  const periodSegmentClass = (active: boolean) =>
    cn(
      "h-9 cursor-pointer rounded-full px-3.5 text-xs font-semibold transition-colors shrink-0",
      active ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
    );

  if (loading && allSlips.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-border bg-card p-12 text-center">
        <RefreshCw className="h-6 w-6 animate-spin text-primary" />
        <p className="text-base text-muted-foreground font-medium">Loading sales history...</p>
      </div>
    );
  }

  if (allSlips.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-border bg-card p-10 text-center">
        <KoroFace size={64} tone="sky" />
        <div className="space-y-1">
          <p className="text-xl font-semibold text-foreground">No recorded sales yet</p>
          <p className="mx-auto max-w-sm text-base text-muted-foreground">
            Counter sales confirmed on the counter will appear here with instant stock deduction records.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Period Filter Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Search by slip #, product name, or note..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-12 w-full rounded-full border border-input bg-card pr-10 pl-12 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={loadSlips}
            disabled={loading}
            className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-full border border-border bg-card px-5 text-sm sm:text-base font-semibold text-foreground transition-colors hover:bg-muted shrink-0"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* History Date Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="no-scrollbar flex items-center gap-1 overflow-x-auto rounded-full bg-muted p-1">
            <button
              type="button"
              onClick={() => {
                setPeriodFilter("all");
                setCustomDate("");
              }}
              className={periodSegmentClass(!customDate && periodFilter === "all")}
            >
              All Slips ({allSlips.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setPeriodFilter("today");
                setCustomDate("");
              }}
              className={periodSegmentClass(!customDate && periodFilter === "today")}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => {
                setPeriodFilter("yesterday");
                setCustomDate("");
              }}
              className={periodSegmentClass(!customDate && periodFilter === "yesterday")}
            >
              Yesterday
            </button>
            <button
              type="button"
              onClick={() => {
                setPeriodFilter("week");
                setCustomDate("");
              }}
              className={periodSegmentClass(!customDate && periodFilter === "week")}
            >
              This Week
            </button>
            <button
              type="button"
              onClick={() => {
                setPeriodFilter("month");
                setCustomDate("");
              }}
              className={periodSegmentClass(!customDate && periodFilter === "month")}
            >
              This Month
            </button>
          </div>

          {/* Specific date selector */}
          <div className="relative inline-flex items-center">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <input
              type="date"
              aria-label="Filter history by day"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="h-9 cursor-pointer rounded-full border border-input bg-card pl-8 pr-3 text-xs font-semibold text-foreground outline-none transition-colors hover:bg-muted/50 focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            {customDate && (
              <button
                type="button"
                onClick={() => setCustomDate("")}
                className="ml-1 text-xs text-muted-foreground hover:text-foreground cursor-pointer underline"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Slips List */}
      {filteredSlips.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-border bg-card p-10 text-center">
          <KoroFace size={56} tone="marigold" />
          <p className="text-lg font-semibold text-foreground">No slips matched this filter</p>
          <p className="text-sm text-muted-foreground">
            Try switching to &ldquo;All Slips&rdquo; or clearing your search.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSlips.map((slip) => {
            const lines = slip.lines || [];
            const dateStr = new Date(slip.created_at || slip.slip_date).toLocaleString("en-IN", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={slip.id}
                onClick={() => setSelectedSlip(slip)}
                className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-border bg-card p-4 sm:p-5 transition-all hover:border-primary/50 cursor-pointer shadow-xs"
              >
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#e8f7ee] dark:bg-[#1c2b22]">
                    <KoroGlyph type="check-circle" size={40} />
                  </span>

                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-heading text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                        {slip.slip_number}
                      </span>
                      <span className="rounded-full bg-[#e8f7ee] dark:bg-[#1c2b22] px-2.5 py-0.5 text-xs font-semibold text-[#0f7a39] dark:text-[#5fd68c] flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Deducted</span>
                      </span>
                    </div>

                    <p className="truncate text-sm text-muted-foreground">
                      {lines.map((l: any) => `${l.raw_item_name} (×${l.quantity})`).join(", ")}
                    </p>

                    <p className="text-xs text-muted-foreground">{dateStr}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
                  <div className="text-left sm:text-right">
                    <span className="font-heading text-xl font-bold text-foreground block">
                      ₹{Number(slip.total_amount || 0).toFixed(0)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {lines.length || slip.total_items || 1} item{lines.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <ChevronRight className="h-5 w-5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <SalesSlipDetailDialog
        slip={selectedSlip}
        open={Boolean(selectedSlip)}
        onOpenChange={(open) => !open && setSelectedSlip(null)}
        shopName={shop?.name}
      />
    </div>
  );
}
