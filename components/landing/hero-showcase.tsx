"use client";

import { useState } from "react";
import {
  Mic,
  FileText,
  MessageSquare,
  CheckCircle2,
  Clock,
  MapPin,
  Tag,
  ArrowRight,
  ShieldCheck,
  Share2,
} from "lucide-react";

type ActiveTab = "voice" | "slip" | "restock";

export function HeroShowcase() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("voice");

  return (
    <div className="w-full rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-xl">
      {/* 3 Jobs Navigation Tabs */}
      <div className="flex rounded-xl border border-border bg-muted/60 p-1.5 gap-1">
        <button
          type="button"
          onClick={() => setActiveTab("voice")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-xs sm:text-sm font-semibold transition-all ${
            activeTab === "voice"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Mic className="h-4 w-4 text-primary" />
          <span>1. Ask Shop</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("slip")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-xs sm:text-sm font-semibold transition-all ${
            activeTab === "slip"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileText className="h-4 w-4 text-primary" />
          <span>2. Slip OCR</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("restock")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-xs sm:text-sm font-semibold transition-all ${
            activeTab === "restock"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <MessageSquare className="h-4 w-4 text-primary" />
          <span>3. WhatsApp Restock</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="mt-5 min-h-[340px]">
        {/* TAB 1: Voice / Ask the Shop */}
        {activeTab === "voice" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-muted/30 p-3.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                <span className="flex items-center gap-1 font-medium">
                  <Mic className="h-3.5 w-3.5 text-primary animate-pulse" />
                  Hindi / Hinglish / English Voice Query
                </span>
                <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                  Tap-to-Talk
                </span>
              </div>
              <p className="font-heading text-sm sm:text-base font-semibold text-foreground">
                &ldquo;Blue velvet bangles box 4 kitne bache hain aur kahan rakhe
                hain?&rdquo;
              </p>
            </div>

            {/* Product Result Card */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-xs">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-heading text-base font-bold text-foreground">
                    Blue Velvet Bangles (Size 2.6)
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Unbarcoded item with custom attributes
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full border border-success/30 bg-success/15 px-2.5 py-0.5 text-xs font-semibold text-success">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  14 Sets in Stock
                </span>
              </div>

              {/* Attributes Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 p-2">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  <div>
                    <span className="text-[10px] text-muted-foreground block">
                      Saved Location
                    </span>
                    <span className="font-semibold text-foreground">
                      Rack B-2 • Shelf 3 • Box #04
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 p-2">
                  <Tag className="h-3.5 w-3.5 text-primary" />
                  <div>
                    <span className="text-[10px] text-muted-foreground block">
                      Known Price
                    </span>
                    <span className="font-semibold text-foreground">
                      ₹180 / set
                    </span>
                  </div>
                </div>
              </div>

              {/* Verification & Safety Note */}
              <div className="flex items-center justify-between border-t border-border pt-2.5 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Last verified: 2 hours ago (by Staff Arun)
                </span>
                <span className="flex items-center gap-1 font-medium text-foreground">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                  Never guesses count
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Handwritten Slip Capture */}
        {activeTab === "slip" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-muted/30 p-3.5 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-muted-foreground">
                  Extracted from Handwritten Sales Slip #108
                </span>
                <p className="text-xs sm:text-sm font-semibold text-foreground mt-0.5">
                  Captured at 11:42 AM • Ready for Owner Review
                </p>
              </div>
              <span className="rounded-md border border-border bg-secondary px-2 py-1 text-[11px] font-semibold text-secondary-foreground">
                Review & Confirm
              </span>
            </div>

            {/* Extracted Lines */}
            <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden text-xs sm:text-sm">
              <div className="p-3 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-foreground block">
                    Mustard Oil 1L Pouch
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Qty: 3 × ₹145
                  </span>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1 font-medium text-success text-xs">
                    <CheckCircle2 className="h-3 w-3" />
                    Stock: 18 → 15
                  </span>
                </div>
              </div>

              <div className="p-3 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-foreground block">
                    Blue Velvet Bangles (Box 4)
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Qty: 2 × ₹180
                  </span>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1 font-medium text-success text-xs">
                    <CheckCircle2 className="h-3 w-3" />
                    Stock: 14 → 12
                  </span>
                </div>
              </div>

              <div className="p-3 flex items-center justify-between bg-warning/5">
                <div>
                  <span className="font-semibold text-foreground block">
                    Bangles Red Set (Uncertain match)
                  </span>
                  <span className="text-[11px] text-warning font-medium">
                    Needs confirmation before commit
                  </span>
                </div>
                <button
                  type="button"
                  className="rounded border border-border bg-secondary px-2 py-1 text-[11px] font-semibold text-secondary-foreground hover:bg-accent"
                >
                  Select Variant
                </button>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-primary" />
              Duplicate slip prevention active. Confirmed sales update stock
              instantly.
            </p>
          </div>
        )}

        {/* TAB 3: WhatsApp Restock Preparation */}
        {activeTab === "restock" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-muted/30 p-3.5 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-muted-foreground">
                  Today&apos;s Restock Summary
                </span>
                <p className="text-xs sm:text-sm font-semibold text-foreground mt-0.5">
                  Generated from confirmed sales &amp; reorder limits
                </p>
              </div>
              <span className="rounded-full border border-success/30 bg-success/15 px-2.5 py-0.5 text-xs font-semibold text-success">
                2 Items to Reorder
              </span>
            </div>

            {/* Restock items */}
            <div className="rounded-xl border border-border bg-card p-3 space-y-2.5 text-xs sm:text-sm">
              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-2.5">
                <div>
                  <span className="font-semibold text-foreground block">
                    Mustard Oil 1L Pouch
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Current: 15 left (Reorder mark: 20)
                  </span>
                </div>
                <span className="rounded bg-warning/20 px-2 py-0.5 text-xs font-bold text-warning">
                  Order +24
                </span>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-2.5">
                <div>
                  <span className="font-semibold text-foreground block">
                    Cotton Pooja Wicks (50g)
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Current: 0 (Out of stock)
                  </span>
                </div>
                <span className="rounded bg-destructive/20 px-2 py-0.5 text-xs font-bold text-destructive">
                  Order +50
                </span>
              </div>
            </div>

            {/* WhatsApp Share Button */}
            <div className="rounded-xl border border-border bg-card p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Share2 className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium text-foreground">
                  Formatted WhatsApp message ready for distributor
                </span>
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground transition-opacity hover:opacity-90"
              >
                <span>Share WhatsApp</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
