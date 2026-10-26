"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRestockStore } from "@/lib/store/use-restock-store";
import { quickAddRestockItemAction } from "@/lib/actions/restock-actions";
import type { Product } from "@/lib/supabase/types";
import { Sparkles, Plus, Minus, Loader2, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

interface RestockAddTrendingDialogProps {
  shopId: string | null;
  shopCategory?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialName?: string;
  onItemAdded?: (product: Product) => void;
}

export function RestockAddTrendingDialog({
  shopId,
  shopCategory,
  open,
  onOpenChange,
  initialName = "",
  onItemAdded,
}: RestockAddTrendingDialogProps) {
  const [name, setName] = useState(initialName);
  const [quantity, setQuantity] = useState(10);
  const [brand, setBrand] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addCustomProductToOrder = useRestockStore((s) => s.addCustomProductToOrder);

  useEffect(() => {
    if (open) {
      setName(initialName);
      setQuantity(10);
      setBrand("");
      setNotes("");
    }
  }, [open, initialName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopId) {
      toast.error("Shop ID not found");
      return;
    }

    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      toast.error("Please enter a valid item name (at least 2 letters)");
      return;
    }

    if (quantity < 1) {
      toast.error("Order quantity must be at least 1 unit");
      return;
    }

    setIsSubmitting(true);
    const res = await quickAddRestockItemAction({
      shopId,
      name: trimmedName,
      quantity,
      brand: brand.trim() || undefined,
      category: shopCategory?.trim() || undefined,
      notes: notes.trim() || undefined,
    });
    setIsSubmitting(false);

    if (!res.success || !res.product) {
      toast.error(res.error || "Failed to add item to order");
      return;
    }

    // Add directly to the reorder draft in the store
    addCustomProductToOrder(res.product, quantity);

    if (onItemAdded) {
      onItemAdded(res.product);
    }

    if (res.isNew) {
      toast.success(
        `Added "${res.product.name}" (${quantity} units) as a new item to your order slip!`
      );
    } else {
      toast.success(
        `Added "${res.product.name}" (${quantity} units) to your purchase list!`
      );
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg w-[calc(100vw-2rem)] p-0 rounded-3xl border border-border bg-card shadow-2xl overflow-hidden max-h-[85vh] flex flex-col no-scrollbar">
        {/* Pinned Header */}
        <div className="p-5 sm:p-6 pb-4 border-b border-border/70 shrink-0 bg-card">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-500">
                  Restock Order
                </span>
              </div>
              <DialogTitle className="text-xl sm:text-2xl font-bold font-heading text-foreground">
                Order New / Trending Item
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
                Add fast-moving market items or new stock directly to your purchase order slip.
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Scrollable Form Body (no-scrollbar, responsive) */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
          <div className="flex-1 overflow-y-auto no-scrollbar p-5 sm:p-6 space-y-4 sm:space-y-5">
            {/* Item Name (Hero Field) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="trending-item-name" className="text-sm font-semibold text-foreground">
                  Item Name <span className="text-destructive">*</span>
                </Label>
                <span className="text-xs text-muted-foreground font-normal">Required</span>
              </div>
              <Input
                id="trending-item-name"
                placeholder="e.g. Viral Korean Serum, Maybelline 05, Lakme Primer"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSubmitting}
                autoFocus
                className="h-12 rounded-2xl text-base px-4 bg-muted/20 border-border focus:bg-background transition-colors"
                required
              />
            </div>

            {/* Order Quantity Stepper & Chips */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold text-foreground">
                  Order Quantity <span className="text-destructive">*</span>
                </Label>
                <span className="text-xs text-muted-foreground font-normal">Units to purchase</span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {/* Stepper */}
                <div className="flex items-center border border-border rounded-2xl bg-muted/20 overflow-hidden h-11 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1 || isSubmitting}
                    className="px-3.5 h-full text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-30 transition-colors cursor-pointer"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val) && val >= 1) setQuantity(val);
                    }}
                    disabled={isSubmitting}
                    className="w-16 text-center text-base font-bold bg-transparent outline-none text-foreground"
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    disabled={isSubmitting}
                    className="px-3.5 h-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                {/* Quick increment chips */}
                <div className="flex items-center gap-2">
                  {[5, 10, 20, 50].map((quickVal) => (
                    <button
                      key={quickVal}
                      type="button"
                      onClick={() => setQuantity(quickVal)}
                      disabled={isSubmitting}
                      className={cn(
                        "h-11 px-3.5 text-xs font-semibold rounded-2xl border transition-all cursor-pointer",
                        quantity === quickVal
                          ? "border-primary bg-primary/10 text-primary font-bold shadow-2xs"
                          : "border-border bg-muted/20 text-muted-foreground hover:text-foreground hover:bg-muted/40"
                      )}
                    >
                      +{quickVal}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Brand & Note / Variant */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="trending-item-brand" className="text-sm font-medium text-foreground">
                  Brand / Make <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
                </Label>
                <Input
                  id="trending-item-brand"
                  placeholder="e.g. Maybelline, Lakme"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  disabled={isSubmitting}
                  className="h-11 rounded-xl text-sm px-3.5 bg-muted/20 border-border focus:bg-background transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="trending-item-notes" className="text-sm font-medium text-foreground">
                  Note / Variant <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
                </Label>
                <Input
                  id="trending-item-notes"
                  placeholder="e.g. Shade 02, 50ml pack"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={isSubmitting}
                  className="h-11 rounded-xl text-sm px-3.5 bg-muted/20 border-border focus:bg-background transition-colors"
                />
              </div>
            </div>

            {/* Info Banner */}
            <div className="flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl bg-muted/25 border border-border/80 text-xs sm:text-sm text-muted-foreground">
              <div className="h-6 w-6 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0 mt-0.5">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <div className="space-y-0.5">
                <span className="font-semibold text-foreground text-xs sm:text-sm">Instant Purchase Slip Sync</span>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  This item is added directly to your restock purchase list and WhatsApp supplier slip. When the delivery arrives, you can record arrival into your catalog with one click.
                </p>
              </div>
            </div>
          </div>

          {/* Pinned Bottom Footer */}
          <div className="flex items-center justify-end gap-3 p-4 px-6 border-t border-border/70 bg-muted/15 shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="h-11 px-5 rounded-full text-sm font-semibold border-border hover:bg-muted cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="h-11 px-7 rounded-full text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Adding to Slip...</span>
                </>
              ) : (
                <>
                  <span>Add to Order Slip</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
