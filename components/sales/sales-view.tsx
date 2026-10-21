"use client";

import type { Shop, Product } from "@/lib/supabase/types";
import { useSalesStore } from "@/lib/store/use-sales-store";
import { SalesQuickCatalog } from "./sales-quick-catalog";
import { SalesReviewScreen } from "./sales-review-screen";
import { SalesHistoryView } from "./sales-history-view";
import { ShoppingBag, History, Sparkles } from "lucide-react";

interface SalesViewProps {
  shop: Shop | null;
  products: Product[];
}

export function SalesView({ shop, products }: SalesViewProps) {
  const activeSubView = useSalesStore((s) => s.activeSubView);
  const setActiveSubView = useSalesStore((s) => s.setActiveSubView);
  const lines = useSalesStore((s) => s.lines);

  return (
    <div className="space-y-6">
      {/* Header and Sub-Tab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="font-heading text-2xl font-bold text-foreground">
            Counter Sales &amp; Stock Deduction
          </h2>
          <p className="text-xs text-muted-foreground">
            Deduct counter sales with live Before &amp; After preview. Review previous slips to verify deductions.
          </p>
        </div>

        {/* View Mode Toggle: Counter vs History */}
        <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-border text-xs self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveSubView("counter")}
            className={`px-3.5 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeSubView === "counter"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ShoppingBag className="h-3.5 w-3.5 text-primary" />
            <span>Counter Sale</span>
            {lines.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-primary text-primary-foreground text-[10px]">
                {lines.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveSubView("history")}
            className={`px-3.5 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeSubView === "history"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <History className="h-3.5 w-3.5" />
            <span>Slip History</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {activeSubView === "counter" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Quick Tap Catalog */}
          <div className="lg:col-span-7 xl:col-span-7 space-y-3">
            <div className="space-y-0.5">
              <h3 className="font-heading font-semibold text-sm text-foreground">
                Tap Products or Add Custom Item
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Tap any product to add it to the counter sale, or type items sold without barcode.
              </p>
            </div>
            <SalesQuickCatalog products={products} />
          </div>

          {/* Right: Review & Stock Deduction Scene */}
          <div className="lg:col-span-5 xl:col-span-5 lg:sticky lg:top-20 space-y-3">
            <div className="space-y-0.5">
              <h3 className="font-heading font-semibold text-sm text-foreground">
                Sale Summary &amp; Proposed Stock
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Inspect before &amp; after stock counts before committing deduction.
              </p>
            </div>
            <SalesReviewScreen shop={shop} products={products} />
          </div>
        </div>
      ) : (
        <div className="max-w-3xl space-y-3">
          <SalesHistoryView shop={shop} />
        </div>
      )}
    </div>
  );
}
