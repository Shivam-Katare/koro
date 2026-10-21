"use client";

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@/lib/supabase/types";
import { useSalesStore, type SaleDraftLine } from "@/lib/store/use-sales-store";
import { Search, Link2, Ban, Check } from "lucide-react";

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
    if (!search.trim()) return products.slice(0, 8);
    const q = search.toLowerCase();
    return products
      .filter((p) => p.name.toLowerCase().includes(q) || (p.brand && p.brand.toLowerCase().includes(q)))
      .slice(0, 10);
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm sm:text-base font-bold">
            <Link2 className="h-4 w-4 text-primary" />
            <span>Link Item: &ldquo;{line.rawItemName}&rdquo;</span>
          </DialogTitle>
          <DialogDescription className="text-xs">
            Match this line with an existing inventory item for stock tracking, or mark it as untracked.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search product from inventory..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9 text-xs"
            />
          </div>

          <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1 divide-y divide-border/60">
            {filtered.map((prod) => (
              <button
                key={prod.id}
                type="button"
                onClick={() => handleLink(prod)}
                className="w-full text-left p-2 rounded-lg hover:bg-muted/50 transition-colors flex items-center justify-between gap-2 text-xs"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-foreground truncate">{prod.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    Stock: {prod.current_stock} units • {prod.category}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {prod.selling_price && (
                    <span className="font-semibold text-foreground">₹{prod.selling_price}</span>
                  )}
                  <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                    Link
                  </Badge>
                </div>
              </button>
            ))}
          </div>

          <div className="pt-2 border-t border-border flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleUntrack}
              className="text-xs text-muted-foreground gap-1.5"
            >
              <Ban className="h-3.5 w-3.5 text-amber-500" />
              <span>Leave Untracked</span>
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
