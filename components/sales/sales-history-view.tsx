"use client";

import { useEffect, useState } from "react";
import { fetchRecentSlipsAction } from "@/lib/actions/sales-actions";
import { useSalesStore } from "@/lib/store/use-sales-store";
import { SalesSlipDetailDialog } from "./sales-slip-detail-dialog";
import type { Shop } from "@/lib/supabase/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ReceiptText, CheckCircle2, ChevronRight, Clock, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

interface SalesHistoryViewProps {
  shop: Shop | null;
}

export function SalesHistoryView({ shop }: SalesHistoryViewProps) {
  const recentSlips = useSalesStore((s) => s.recentSlips);
  const setRecentSlips = useSalesStore((s) => s.setRecentSlips);
  const [selectedSlip, setSelectedSlip] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

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

  if (loading && recentSlips.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
        <RefreshCw className="h-4 w-4 animate-spin text-primary" />
        <span>Loading sales slips history...</span>
      </div>
    );
  }

  if (recentSlips.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-8 text-center space-y-2 bg-card">
        <ReceiptText className="h-9 w-9 text-muted-foreground mx-auto" />
        <p className="text-sm font-semibold text-foreground">No Recorded Sales Yet</p>
        <p className="text-xs text-muted-foreground">
          Sales slips confirmed on the counter will appear here with stock deduction records.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Recent confirmed sales ({recentSlips.length})</span>
        <button
          type="button"
          onClick={loadSlips}
          className="flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="divide-y divide-border rounded-xl border border-border bg-card shadow-xs overflow-hidden">
        {recentSlips.map((slip) => {
          const lines = slip.lines || [];
          const dateStr = new Date(slip.created_at || slip.slip_date).toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
          });

          return (
            <button
              key={slip.id}
              type="button"
              onClick={() => setSelectedSlip(slip)}
              className="w-full text-left p-3.5 hover:bg-muted/30 transition-colors flex items-center justify-between gap-3 text-xs cursor-pointer group"
            >
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {slip.slip_number}
                  </span>
                  <Badge variant="secondary" className="text-[10px] py-0 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-2.5 w-2.5 inline mr-1" />
                    Deducted
                  </Badge>
                </div>
                <p className="text-muted-foreground truncate text-[11px]">
                  {lines.map((l: any) => `${l.raw_item_name} (×${l.quantity})`).join(", ")}
                </p>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <div className="text-right">
                  <span className="font-extrabold text-sm text-foreground block font-heading">
                    ₹{Number(slip.total_amount || 0).toFixed(0)}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{dateStr}</span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
            </button>
          );
        })}
      </div>

      <SalesSlipDetailDialog
        slip={selectedSlip}
        open={Boolean(selectedSlip)}
        onOpenChange={(open) => !open && setSelectedSlip(null)}
      />
    </div>
  );
}
