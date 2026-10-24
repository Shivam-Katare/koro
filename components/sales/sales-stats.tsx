"use client";

import { useSalesStore } from "@/lib/store/use-sales-store";
import { KoroGlyph } from "@/components/brand/koro-face";
import type { Product } from "@/lib/supabase/types";

interface SalesStatsProps {
  products: Product[];
}

export function SalesStats({ products }: SalesStatsProps) {
  const lines = useSalesStore((s) => s.lines);
  const recentSlips = useSalesStore((s) => s.recentSlips);

  const totalUnitsInSale = lines.reduce((sum, l) => sum + l.quantity, 0);
  const totalSaleAmount = lines.reduce(
    (sum, l) => sum + (l.unitPrice !== null ? l.unitPrice * l.quantity : 0),
    0
  );

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {/* Items in Current Sale */}
      <div className="flex items-center gap-4 rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-xs">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#e6f3fe] dark:bg-[#10243e]">
          <KoroGlyph type="package" size={44} />
        </span>
        <div className="min-w-0">
          <p className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl tabular-nums">
            {lines.length}
          </p>
          <p className="text-base font-semibold text-muted-foreground">
            {totalUnitsInSale > 0 ? `${totalUnitsInSale} units in draft` : "Items in draft"}
          </p>
        </div>
      </div>

      {/* Total Sale Value */}
      <div className="flex items-center gap-4 rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-xs">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#e8f7ee] dark:bg-[#1c2b22]">
          <KoroGlyph type="trending-up" size={44} />
        </span>
        <div className="min-w-0">
          <p className="font-heading text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 sm:text-4xl tabular-nums">
            ₹{totalSaleAmount.toFixed(0)}
          </p>
          <p className="text-base font-semibold text-muted-foreground">Current sale total</p>
        </div>
      </div>

      {/* Confirmed Slips */}
      <div className="flex items-center gap-4 rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-xs sm:col-span-2 lg:col-span-1">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#fff1cc] dark:bg-[#3a2f12]">
          <KoroGlyph type="check-circle" size={44} />
        </span>
        <div className="min-w-0">
          <p className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl tabular-nums">
            {recentSlips.length}
          </p>
          <p className="text-base font-semibold text-muted-foreground">Recorded sales slips</p>
        </div>
      </div>
    </div>
  );
}
