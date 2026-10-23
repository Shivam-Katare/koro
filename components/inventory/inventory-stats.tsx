"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import { KoroGlyph } from "@/components/brand/koro-face";
import type { KoroGlyphType } from "@/components/brand/koro-face";
import type { DashboardTab } from "@/lib/hooks/use-dashboard-nav";
import type { Product } from "@/lib/supabase/types";

interface InventoryStatsProps {
  products: Product[];
  variant?: "home" | "full";
  onNavigate?: (tab: DashboardTab) => void;
}

export function InventoryStats({ products, variant = "home", onNavigate }: InventoryStatsProps) {
  const totalUnique = products.length;
  const inStock = products.filter((p) => p.stock_status === "in_stock").length;
  const lowStock = products.filter((p) => p.stock_status === "low_stock").length;
  const outOfStock = products.filter((p) => p.stock_status === "out_of_stock").length;
  const totalUnits = products.reduce((sum, p) => sum + (Number(p.current_stock) || 0), 0);
  const lowStockAlerts = lowStock + outOfStock;

  if (variant === "home") {
    const hasAlerts = lowStockAlerts > 0;
    const cards: {
      key: string;
      label: string;
      value: number;
      note: string;
      glyph: KoroGlyphType;
      tab: DashboardTab;
      linkLabel: string;
      surface: string;
    }[] = [
      {
        key: "unique",
        label: "Total unique products",
        value: totalUnique,
        note: "Distinct products in your catalog",
        glyph: "package",
        tab: "products",
        linkLabel: "See all items",
        surface: "bg-[#e6f3fe] dark:bg-[#243442]",
      },
      {
        key: "units",
        label: "Products in stock",
        value: totalUnits,
        note: `Units across your shelves (${inStock} items active)`,
        glyph: "trending-up",
        tab: "products",
        linkLabel: "View shelves",
        surface: "bg-card border border-border",
      },
      {
        key: "low",
        label: "Low-stock alerts",
        value: lowStockAlerts,
        note: hasAlerts ? "Items need reorder soon" : "All stock is healthy",
        glyph: hasAlerts ? "alert" : "check-circle",
        tab: "restock",
        linkLabel: hasAlerts ? "Open restock" : "View restock",
        surface: hasAlerts ? "bg-[#ffb110] text-black" : "bg-[#e8f7ee] dark:bg-[#1c2b22]",
      },
    ];

    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.key}
            className={cn("flex min-h-52 flex-col justify-between rounded-3xl p-6 sm:p-7", card.surface)}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-lg font-semibold leading-snug">{card.label}</p>
              <KoroGlyph type={card.glyph} size={52} className="shrink-0" />
            </div>

            <div>
              <p className="font-heading text-6xl font-bold leading-none tracking-tight tabular-nums">
                {card.value}
              </p>
              <p className="mt-3 text-base opacity-70">{card.note}</p>
            </div>

            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate(card.tab)}
                className="group mt-5 flex cursor-pointer items-center justify-between text-base font-semibold"
              >
                <span>{card.linkLabel}</span>
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black transition-transform group-hover:translate-x-0.5">
                  <ArrowRight className="h-5 w-5" />
                </span>
              </button>
            )}
          </div>
        ))}
      </div>
    );
  }

  // Full / Products view variant
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <div className="rounded-xl border border-border/70 bg-card p-4 shadow-2xs">
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
          Total Products
        </p>
        <p className="text-2xl font-bold font-heading text-foreground mt-1">
          {totalUnique}
        </p>
      </div>

      <div className="rounded-xl border border-border/70 bg-card p-4 shadow-2xs">
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
          In Stock
        </p>
        <p className="text-2xl font-bold font-heading text-foreground mt-1">
          {inStock}
        </p>
      </div>

      <div className="rounded-xl border border-border/70 bg-card p-4 shadow-2xs">
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
          Low Stock Alerts
        </p>
        <p
          className={cn(
            "text-2xl font-bold font-heading mt-1",
            lowStockAlerts > 0 ? "text-amber-600 dark:text-amber-400" : "text-foreground"
          )}
        >
          {lowStockAlerts}
        </p>
      </div>

      <div className="rounded-xl border border-border/70 bg-card p-4 shadow-2xs">
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
          Total Units
        </p>
        <p className="text-2xl font-bold font-heading text-foreground mt-1">
          {totalUnits}
        </p>
      </div>
    </div>
  );
}
