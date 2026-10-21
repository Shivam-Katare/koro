"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@/lib/supabase/types";
import { useSalesStore } from "@/lib/store/use-sales-store";
import { Search, Plus, Sparkles, MapPin } from "lucide-react";

interface SalesQuickCatalogProps {
  products: Product[];
}

export function SalesQuickCatalog({ products }: SalesQuickCatalogProps) {
  const [search, setSearch] = useState("");
  const [customName, setCustomName] = useState("");
  const [customPrice, setCustomPrice] = useState("");
  const addItemFromProduct = useSalesStore((s) => s.addItemFromProduct);
  const addCustomItem = useSalesStore((s) => s.addCustomItem);

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products.slice(0, 12);
    const q = search.toLowerCase();
    return products
      .filter((p) => {
        const inAttrs = Object.values(p.attributes || {}).some((v) =>
          String(v).toLowerCase().includes(q)
        );
        return (
          p.name.toLowerCase().includes(q) ||
          (p.brand && p.brand.toLowerCase().includes(q)) ||
          (p.barcode && p.barcode.toLowerCase().includes(q)) ||
          (p.storage_location && p.storage_location.toLowerCase().includes(q)) ||
          inAttrs
        );
      })
      .slice(0, 16);
  }, [products, search]);

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;
    const priceNum = customPrice.trim() !== "" ? Number(customPrice) : undefined;
    addCustomItem(customName, products, 1, priceNum);
    setCustomName("");
    setCustomPrice("");
  };

  return (
    <div className="space-y-4">
      {/* Search and Custom Item Quick Add */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search item, location (DRAW-TO-BOX-5), barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 text-xs"
          />
        </div>

        {/* Quick Custom Item Input for non-catalog items with Price */}
        <form onSubmit={handleAddCustom} className="flex items-center gap-1.5">
          <Input
            placeholder="Quick-add custom item (e.g. Chudi laal 2-6, Milk)..."
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            className="h-8 text-xs bg-muted/30 flex-1"
          />
          <div className="flex items-center border border-border rounded-lg bg-muted/30 px-2 h-8 w-22 shrink-0">
            <span className="text-xs text-muted-foreground font-semibold">₹</span>
            <Input
              type="number"
              min="0"
              placeholder="Price"
              value={customPrice}
              onChange={(e) => setCustomPrice(e.target.value)}
              className="h-full border-0 text-xs font-semibold p-0 pl-1 focus-visible:ring-0"
            />
          </div>
          <Button type="submit" size="sm" variant="secondary" className="h-8 text-xs shrink-0 gap-1 font-semibold">
            <Plus className="h-3.5 w-3.5" />
            <span>Add</span>
          </Button>
        </form>
      </div>

      {/* Touch-Friendly Product Grid (PhonePe/POS style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[380px] overflow-y-auto pr-1">
        {filteredProducts.map((p) => {
          const isOut = p.current_stock <= 0;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => addItemFromProduct(p, 1)}
              className="p-3 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-muted/40 transition-all text-left flex items-start justify-between gap-2 shadow-2xs group cursor-pointer"
            >
              <div className="space-y-1 min-w-0 flex-1">
                <p className="font-semibold text-xs text-foreground truncate group-hover:text-primary transition-colors">
                  {p.name}
                </p>
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  {p.storage_location && (
                    <span className="flex items-center gap-0.5 text-foreground bg-muted px-1 rounded text-[10px]">
                      <MapPin className="h-2.5 w-2.5 text-primary" />
                      {p.storage_location}
                    </span>
                  )}
                  <span className={isOut ? "text-destructive font-semibold" : ""}>
                    {p.current_stock} left
                  </span>
                </div>
              </div>

              <div className="text-right shrink-0">
                {p.selling_price !== null && (
                  <span className="text-xs font-bold text-foreground block font-heading">
                    ₹{Number(p.selling_price).toFixed(0)}
                  </span>
                )}
                <span className="text-[10px] text-primary font-medium flex items-center justify-end gap-0.5 mt-0.5">
                  <Plus className="h-2.5 w-2.5" /> Tap
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
