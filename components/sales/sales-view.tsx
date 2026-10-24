"use client";

import type { Shop, Product, SalesSlip } from "@/lib/supabase/types";
import { useSalesStore } from "@/lib/store/use-sales-store";
import { SalesStats } from "./sales-stats";
import { SalesQuickCatalog } from "./sales-quick-catalog";
import { SalesReviewScreen } from "./sales-review-screen";
import { SalesHistoryView } from "./sales-history-view";
import { SalesSlipScannerDialog } from "./sales-slip-scanner-dialog";
import { cn } from "@/lib/utils";

interface SalesViewProps {
  shop: Shop | null;
  products: Product[];
  initialSlips?: SalesSlip[];
}

export function SalesView({ shop, products, initialSlips = [] }: SalesViewProps) {
  const activeSubView = useSalesStore((s) => s.activeSubView);
  const setActiveSubView = useSalesStore((s) => s.setActiveSubView);
  const lines = useSalesStore((s) => s.lines);

  const tabClass = (active: boolean) =>
    cn(
      "inline-flex h-9 sm:h-10 cursor-pointer items-center gap-1.5 sm:gap-2 rounded-full px-3.5 sm:px-4.5 text-xs sm:text-sm font-semibold transition-colors",
      active ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
    );

  return (
    <div className="space-y-8">
      {/* Title and Header Actions */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="space-y-1.5">
          <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Counter Sales
          </h1>
          <p className="text-base text-muted-foreground sm:text-lg">
            Record counter sales, deduct stock instantly, and review past slips.
          </p>
        </div>

        {/* Action Buttons & Sub-View Switcher */}
        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          {/* Bill / Slip Scanner Dialog */}
          <SalesSlipScannerDialog shopId={shop?.id || null} />

          {/* Mode Switcher */}
          <div className="flex shrink-0 items-center rounded-full bg-muted p-1">
            <button
              type="button"
              onClick={() => setActiveSubView("counter")}
              className={tabClass(activeSubView === "counter")}
            >
              <span>Counter sale</span>
              {lines.length > 0 && (
                <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground tabular-nums">
                  {lines.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveSubView("history")}
              className={tabClass(activeSubView === "history")}
            >
              <span>Past slips</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <SalesStats products={products} initialSlips={initialSlips} />

      {/* Main Content Area */}
      {activeSubView === "counter" ? (
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          {/* Left: Quick Tap Catalog */}
          <section aria-labelledby="sales-catalog" className="space-y-4 lg:col-span-7 xl:col-span-8">
            <div className="flex items-center justify-between">
              <h2 id="sales-catalog" className="font-heading text-2xl font-bold tracking-tight text-foreground">
                Products catalog
              </h2>
            </div>
            <SalesQuickCatalog products={products} />
          </section>

          {/* Right: Review & Stock Deduction Receipt */}
          <section
            aria-labelledby="sales-slip"
            className="space-y-4 lg:sticky lg:top-24 lg:col-span-5 xl:col-span-4"
          >
            <h2 id="sales-slip" className="font-heading text-2xl font-bold tracking-tight text-foreground">
              Sale slip
            </h2>
            <SalesReviewScreen shop={shop} products={products} />
          </section>
        </div>
      ) : (
        /* Slip History View */
        <div className="max-w-4xl space-y-4">
          <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground">
            Past sales slips
          </h2>
          <SalesHistoryView shop={shop} initialSlips={initialSlips} />
        </div>
      )}
    </div>
  );
}
