"use client";

import { useState, useMemo } from "react";
import type { Product } from "@/lib/supabase/types";
import { useSalesStore } from "@/lib/store/use-sales-store";
import { KoroFace, KoroGlyph } from "@/components/brand/koro-face";
import {
  Search,
  Plus,
  Minus,
  MapPin,
  X,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SalesQuickCatalogProps {
  products: Product[];
}

const PAGE_SIZE = 24;

export function SalesQuickCatalog({ products }: SalesQuickCatalogProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [stockFilter, setStockFilter] = useState<"all" | "in_stock">("all");
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customPrice, setCustomPrice] = useState("");
  const [customQty, setCustomQty] = useState(1);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const lines = useSalesStore((s) => s.lines);
  const addItemFromProduct = useSalesStore((s) => s.addItemFromProduct);
  const addCustomItem = useSalesStore((s) => s.addCustomItem);
  const updateLineQuantity = useSalesStore((s) => s.updateLineQuantity);
  const removeLine = useSalesStore((s) => s.removeLine);

  // Map product IDs to draft line for quick quantity lookup
  const draftMap = useMemo(() => {
    const map = new Map<string, { id: string; quantity: number }>();
    for (const l of lines) {
      if (l.productId) {
        map.set(l.productId, { id: l.id, quantity: l.quantity });
      }
    }
    return map;
  }, [lines]);

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) {
      if (p.category) set.add(p.category);
    }
    return Array.from(set).sort();
  }, [products]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    const q = search.toLowerCase().trim();

    return products.filter((p) => {
      // Category filter
      if (selectedCategory !== "all" && p.category !== selectedCategory) {
        return false;
      }

      // Stock status filter
      if (stockFilter === "in_stock" && p.current_stock <= 0) {
        return false;
      }

      // Search query
      if (!q) return true;

      const inAttrs = Object.values(p.attributes || {}).some((v) =>
        String(v).toLowerCase().includes(q)
      );

      return (
        p.name.toLowerCase().includes(q) ||
        (p.brand && p.brand.toLowerCase().includes(q)) ||
        (p.barcode && p.barcode.toLowerCase().includes(q)) ||
        (p.storage_location && p.storage_location.toLowerCase().includes(q)) ||
        p.category.toLowerCase().includes(q) ||
        inAttrs
      );
    });
  }, [products, search, selectedCategory, stockFilter]);

  const displayedProducts = useMemo(() => {
    return filteredProducts.slice(0, visibleCount);
  }, [filteredProducts, visibleCount]);

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;
    const priceNum = customPrice.trim() !== "" ? Number(customPrice) : undefined;
    addCustomItem(customName, products, customQty, priceNum);
    setCustomName("");
    setCustomPrice("");
    setCustomQty(1);
    setShowCustomModal(false);
  };

  const handleOpenCustomForSearch = () => {
    setCustomName(search);
    setShowCustomModal(true);
  };

  const segmentClass = (active: boolean) =>
    cn(
      "h-10 cursor-pointer rounded-full px-4 text-sm sm:text-base font-semibold transition-colors shrink-0",
      active ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
    );

  return (
    <div className="space-y-4">
      {/* Search Input Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <input
          placeholder="Search by product name, barcode, shelf or brand..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setVisibleCount(PAGE_SIZE);
          }}
          aria-label="Search catalog"
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

      {/* Categories & Filter Pills */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Category switcher */}
        <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto rounded-full bg-muted p-1 max-w-full">
          <button
            type="button"
            onClick={() => {
              setSelectedCategory("all");
              setVisibleCount(PAGE_SIZE);
            }}
            className={segmentClass(selectedCategory === "all")}
          >
            All items ({products.length})
          </button>

          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setSelectedCategory(cat);
                setVisibleCount(PAGE_SIZE);
              }}
              className={segmentClass(selectedCategory === cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Custom Item Trigger Button */}
        <button
          type="button"
          onClick={() => setShowCustomModal(true)}
          className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full bg-secondary px-4 text-sm sm:text-base font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Add custom item</span>
        </button>
      </div>

      {/* Expandable Custom Item Panel */}
      {showCustomModal && (
        <form
          onSubmit={handleAddCustom}
          className="rounded-3xl border border-primary/30 bg-primary/[0.03] p-5 space-y-4 animate-in fade-in-50 duration-200"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Sparkles className="h-4 w-4" />
              </span>
              <h4 className="font-heading text-lg font-bold text-foreground">
                Quick Custom Sale Item
              </h4>
            </div>
            <button
              type="button"
              onClick={() => setShowCustomModal(false)}
              className="text-muted-foreground hover:text-foreground p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-6">
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Item description / name
              </label>
              <input
                required
                placeholder="e.g. Chudi laal 2-6, Loose milk, Extra pack..."
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="h-11 w-full rounded-xl border border-input bg-card px-3.5 text-base text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Selling price (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  className="h-11 w-full rounded-xl border border-input bg-card pl-8 pr-3.5 text-base font-semibold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="sm:col-span-3 flex items-end">
              <button
                type="submit"
                className="h-11 w-full cursor-pointer rounded-xl bg-primary px-4 text-base font-bold text-primary-foreground transition-opacity hover:opacity-90 flex items-center justify-center gap-1.5"
              >
                <Plus className="h-4 w-4" />
                <span>Add to sale</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Products List / Grid */}
      {displayedProducts.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-border bg-card p-10 text-center">
          <KoroFace size={64} tone="marigold" />
          <div className="space-y-1">
            <p className="text-xl font-semibold text-foreground">No matching items found</p>
            <p className="mx-auto max-w-sm text-base text-muted-foreground">
              {search
                ? `No catalog items matched "${search}". You can sell it as a custom unlisted item.`
                : "No items available in this category."}
            </p>
          </div>
          {search && (
            <button
              type="button"
              onClick={handleOpenCustomForSearch}
              className="inline-flex h-12 cursor-pointer items-center gap-2 rounded-full bg-primary px-6 text-base font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Plus className="h-5 w-5" />
              <span>Add &ldquo;{search}&rdquo; to sale</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {displayedProducts.map((p) => {
            const isOut = p.current_stock <= 0;
            const minThreshold = p.min_stock_threshold ?? 5;
            const isLow = !isOut && p.current_stock <= minThreshold;

            const inDraft = draftMap.get(p.id);
            const draftQty = inDraft?.quantity ?? 0;

            const tileTone = isOut
              ? "bg-[#ffe6e1] dark:bg-[#3b211d]"
              : isLow
              ? "bg-[#fff1cc] dark:bg-[#3a2f12]"
              : "bg-[#e6f3fe] dark:bg-[#10243e]";

            const faceTone = isOut ? "coral" : isLow ? "marigold" : "sky";

            const statusPill = isOut
              ? { text: "Out of stock", cls: "bg-[#ffe6e1] text-[#c4301c] dark:bg-[#3b211d] dark:text-[#ff8a78]" }
              : isLow
              ? { text: `Low: ${p.current_stock} left`, cls: "bg-[#fff1cc] text-amber-800 dark:bg-[#3a2f12] dark:text-amber-300" }
              : { text: `${p.current_stock} in stock`, cls: "bg-[#e8f7ee] text-[#0f7a39] dark:bg-[#1c2b22] dark:text-[#5fd68c]" };

            return (
              <div
                key={p.id}
                className={cn(
                  "flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border bg-card p-4 sm:p-5 transition-colors",
                  draftQty > 0 ? "border-primary/50 bg-primary/[0.015]" : "border-border"
                )}
              >
                {/* Product Avatar & Info */}
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <span className={cn("flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl", tileTone)}>
                    <KoroFace size={42} tone={faceTone} />
                  </span>

                  <div className="min-w-0 space-y-1">
                    <p className="truncate text-lg font-semibold text-foreground">
                      {p.name}
                    </p>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", statusPill.cls)}>
                        {statusPill.text}
                      </span>

                      {p.category && (
                        <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                          {p.category}
                        </span>
                      )}

                      {p.storage_location && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3 text-primary" />
                          <span>{p.storage_location}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Price and Add / Stepper Controls */}
                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
                  {p.selling_price !== null && (
                    <div className="text-left sm:text-right">
                      <span className="font-heading text-xl font-bold text-foreground">
                        ₹{Number(p.selling_price).toFixed(0)}
                      </span>
                    </div>
                  )}

                  {draftQty > 0 ? (
                    <div className="inline-flex h-11 items-center rounded-full border border-primary/40 bg-card p-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (draftQty <= 1) {
                            removeLine(inDraft!.id);
                          } else {
                            updateLineQuantity(inDraft!.id, draftQty - 1);
                          }
                        }}
                        aria-label="Decrease quantity"
                        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
                      >
                        <Minus className="h-4 w-4" />
                      </button>

                      <span className="min-w-[2.5rem] text-center font-heading text-base font-bold text-foreground">
                        {draftQty}
                      </span>

                      <button
                        type="button"
                        onClick={() => updateLineQuantity(inDraft!.id, draftQty + 1)}
                        aria-label="Increase quantity"
                        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => addItemFromProduct(p, 1)}
                      className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full bg-secondary px-5 text-base font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Load More Button for 10,000+ items scale */}
          {visibleCount < filteredProducts.length && (
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full border border-border bg-card px-6 text-base font-semibold text-foreground transition-colors hover:bg-muted"
              >
                <ChevronDown className="h-4 w-4" />
                <span>
                  Show more items ({filteredProducts.length - visibleCount} remaining)
                </span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
