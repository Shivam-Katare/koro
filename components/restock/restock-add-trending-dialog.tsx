"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-heading">
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Sparkles className="h-4 w-4" />
            </span>
            <span>Order New / Trending Item</span>
          </DialogTitle>
          <DialogDescription className="text-xs">
            Add trending market items or new stock to this restock order slip. It will appear on your purchase list and WhatsApp slip.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Item Name */}
          <div className="space-y-1.5">
            <Label htmlFor="trending-item-name" className="text-xs font-semibold">
              Item Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="trending-item-name"
              placeholder="e.g. Viral Korean Serum, Maybelline 05, Lakme Primer"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
              autoFocus
              className="h-9 text-xs"
              required
            />
          </div>

          {/* Quantity Stepper */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">
              Order Quantity <span className="text-destructive">*</span>
            </Label>
            <div className="flex items-center gap-2">
              <div className="flex items-center border border-border rounded-lg bg-background overflow-hidden h-9">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1 || isSubmitting}
                  className="px-3 h-full text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 cursor-pointer"
                >
                  <Minus className="h-3 w-3" />
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
                  className="w-16 text-center text-xs font-bold bg-transparent outline-none"
                />
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  disabled={isSubmitting}
                  className="px-3 h-full text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>

              {/* Quick increment chips */}
              <div className="flex items-center gap-1.5">
                {[5, 10, 20, 50].map((quickVal) => (
                  <button
                    key={quickVal}
                    type="button"
                    onClick={() => setQuantity(quickVal)}
                    disabled={isSubmitting}
                    className={`px-2 py-1 text-[11px] font-medium rounded-md border transition-colors cursor-pointer ${
                      quantity === quickVal
                        ? "border-primary bg-primary/10 text-primary font-bold"
                        : "border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    {quickVal}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Brand & Notes */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="trending-item-brand" className="text-xs font-medium text-muted-foreground">
                Brand / Make (Optional)
              </Label>
              <Input
                id="trending-item-brand"
                placeholder="e.g. Maybelline, Lakme"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                disabled={isSubmitting}
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="trending-item-notes" className="text-xs font-medium text-muted-foreground">
                Note / Variant (Optional)
              </Label>
              <Input
                id="trending-item-notes"
                placeholder="e.g. Shade 02, 50ml pack"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={isSubmitting}
                className="h-8 text-xs"
              />
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-muted/40 border border-border/60 text-[11px] text-muted-foreground space-y-1">
            <p className="flex items-center gap-1.5 text-foreground font-medium">
              💡 <span>Zero extra hassle</span>
            </p>
            <p>
              This item is added directly to your purchase order slip. When the delivery arrives, you can record arrival into your inventory with one click.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="h-9 text-xs cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || !name.trim()}
              className="h-9 text-xs font-semibold gap-1.5 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Adding to Slip...</span>
                </>
              ) : (
                <>
                  <span>Add to Order Slip</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
