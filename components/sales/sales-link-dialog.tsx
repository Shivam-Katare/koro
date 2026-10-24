"use client";

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { Product } from "@/lib/supabase/types";
import { useSalesStore, type SaleDraftLine } from "@/lib/store/use-sales-store";
import { Search, Link2, Ban, X } from "lucide-react";

interface SalesLinkDialogProps {
  line: SaleDraftLine | null;
  products: Product[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SalesLinkDialog({ line, products, open, onOpenChange }: SalesLinkDialogProps) {
  const [search, setSearch] = useState("");
  const linkProductToLine = useSalesStore((s) => s.linkProductToLine);
  const setLineUntracked = useSalesStore((s) => s.setLineUntracked);

  const filtered = useMemo(() => {
    if (!search.trim()) return products.slice(0, 10);
    const q = search.toLowerCase();
    return products
      .filter((p) => p.name.toLowerCase().includes(q) || (p.brand && p.brand.toLowerCase().includes(q)))
      .slice(0, 15);
  }, [products, search]);

  if (!line) return null;

  const handleLink = (product: Product) => {
    linkProductToLine(line.id, product);
    onOpenChange(false);
  };

  const handleUntrack = () => {
    setLineUntracked(line.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl p-5 border border-border bg-card">
        <DialogHeader className="space-y-1">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold font-heading text-foreground">
            <Link2 className="h-5 w-5 text-primary" />
            <span>Link Item: &ldquo;{line.rawItemName}&rdquo;</span>
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Match this item with an inventory product for stock deduction, or sell it untracked.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              placeholder="Search product from inventory..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 w-full rounded-full border border-input bg-card pl-10 pr-4 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Products list */}
          <div className="no-scrollbar space-y-2 max-h-[260px] overflow-y-auto pr-1">
            {filtered.map((prod) => (
              <button
                key={prod.id}
                type="button"
                onClick={() => handleLink(prod)}
                className="w-full text-left p-3 rounded-2xl border border-border bg-muted/20 hover:border-primary/50 hover:bg-muted/40 transition-all flex items-center justify-between gap-3 text-sm cursor-pointer"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-foreground truncate">{prod.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Stock: {prod.current_stock} units {prod.category ? `• ${prod.category}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {prod.selling_price !== null && (
                    <span className="font-bold text-foreground font-heading">₹{prod.selling_price}</span>
                  )}
                  <span className="rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-semibold">
                    Link
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Footer Actions */}
          <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleUntrack}
              className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full border border-border px-4 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Ban className="h-3.5 w-3.5 text-amber-500" />
              <span>Leave Untracked</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="inline-flex h-10 cursor-pointer items-center px-4 rounded-full text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
