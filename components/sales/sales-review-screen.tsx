"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Shop, Product } from "@/lib/supabase/types";
import { useSalesStore, type SaleDraftLine } from "@/lib/store/use-sales-store";
import { recordSaleSlipAction } from "@/lib/actions/sales-actions";
import { SalesLinkDialog } from "./sales-link-dialog";
import { ReceiptPaper, ReceiptDivider } from "@/components/restock/receipt-paper";
import { KoroFace } from "@/components/brand/koro-face";
import {
  Trash2,
  Minus,
  Plus,
  ArrowRight,
  CheckCircle2,
  RotateCcw,
  Loader2,
  Link2,
} from "lucide-react";
import toast from "react-hot-toast";

interface SalesReviewScreenProps {
  shop: Shop | null;
  products: Product[];
}

export function SalesReviewScreen({ shop, products }: SalesReviewScreenProps) {
  const router = useRouter();
  const lines = useSalesStore((s) => s.lines);
  const notes = useSalesStore((s) => s.notes);
  const slipNumber = useSalesStore((s) => s.slipNumber);
  const isSubmitting = useSalesStore((s) => s.isSubmitting);
  const setNotes = useSalesStore((s) => s.setNotes);
  const updateLineQuantity = useSalesStore((s) => s.updateLineQuantity);
  const removeLine = useSalesStore((s) => s.removeLine);
  const clearDraft = useSalesStore((s) => s.clearDraft);
  const setIsSubmitting = useSalesStore((s) => s.setIsSubmitting);
  const updateLinePrice = useSalesStore((s) => s.updateLinePrice);

  const [linkingLine, setLinkingLine] = useState<SaleDraftLine | null>(null);

  const totalUnits = lines.reduce((sum, l) => sum + l.quantity, 0);
  const totalAmount = lines.reduce(
    (sum, l) => sum + (l.unitPrice !== null ? l.unitPrice * l.quantity : 0),
    0
  );

  const handleConfirmSale = async () => {
    if (!shop) return;
    if (lines.length === 0) {
      toast.error("Please add at least one item to the sale");
      return;
    }

    setIsSubmitting(true);
    const idempotencyKey = `sale-${slipNumber}-${lines.length}-${Date.now()}`;

    const res = await recordSaleSlipAction({
      shopId: shop.id,
      slipNumber,
      source: "manual",
      notes: notes.trim() || undefined,
      idempotencyKey,
      lines: lines.map((l) => ({
        productId: l.productId,
        rawItemName: l.rawItemName,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        isTracked: l.isTracked,
        status: l.status,
      })),
    });

    setIsSubmitting(false);

    if (!res.success) {
      toast.error(res.error || "Failed to record sale");
      return;
    }

    toast.success(`Sale recorded! ₹${totalAmount.toFixed(0)} • Stock deducted.`);
    clearDraft();
    router.refresh();
  };

  if (lines.length === 0) {
    return (
      <ReceiptPaper>
        <div className="flex items-center justify-between gap-3 p-5">
          <h3 className="font-heading text-xl font-bold text-foreground">Sale slip</h3>
          <span className="text-base text-muted-foreground">0 items</span>
        </div>
        <ReceiptDivider />
        <div className="flex flex-col items-center gap-4 px-6 py-10 text-center">
          <KoroFace size={64} tone="sky" />
          <div className="space-y-1">
            <p className="text-lg font-semibold text-foreground">Sale slip is empty</p>
            <p className="mx-auto max-w-xs text-base text-muted-foreground">
              Tap items from the catalog on the left to add them to this sale.
            </p>
          </div>
        </div>
      </ReceiptPaper>
    );
  }

  return (
    <>
      <ReceiptPaper>
        {/* Receipt Header */}
        <div className="flex items-start justify-between gap-3 p-5">
          <div>
            <h3 className="font-heading text-xl font-bold text-foreground">Sale slip</h3>
            <p className="mt-0.5 text-base text-muted-foreground">
              #{slipNumber} • {lines.length} item{lines.length > 1 ? "s" : ""}, {totalUnits} units
            </p>
          </div>
          <button
            type="button"
            onClick={clearDraft}
            disabled={isSubmitting}
            title="Clear all items from this slip"
            className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full px-3 text-base font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Clear</span>
          </button>
        </div>

        <ReceiptDivider />

        {/* Line Items List */}
        <div className="no-scrollbar max-h-[360px] space-y-2.5 overflow-y-auto px-4 py-3">
          {lines.map((line) => {
            const matchedProduct = products.find((p) => p.id === line.productId);
            const currentStock = matchedProduct ? matchedProduct.current_stock : null;
            const newStock = currentStock !== null ? currentStock - line.quantity : null;
            const isNegative = newStock !== null && newStock < 0;

            return (
              <div
                key={line.id}
                className="rounded-2xl border border-border/80 bg-muted/20 p-3.5 space-y-2.5"
              >
                {/* Item Name & Price Row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-semibold text-foreground">
                      {line.rawItemName}
                    </p>
                    {matchedProduct?.category && (
                      <p className="text-xs text-muted-foreground">{matchedProduct.category}</p>
                    )}
                  </div>

                  {/* Price input & total */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center rounded-xl border border-input bg-card px-2 h-9">
                      <span className="text-xs font-bold text-muted-foreground">₹</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={line.unitPrice !== null && line.unitPrice !== undefined ? line.unitPrice : ""}
                        onChange={(e) => {
                          const val = e.target.value === "" ? null : Number(e.target.value);
                          updateLinePrice(line.id, val);
                        }}
                        className="w-16 border-0 bg-transparent text-sm font-bold font-heading pl-1 text-foreground outline-none"
                      />
                    </div>

                    {line.quantity > 1 && line.unitPrice !== null && (
                      <span className="font-heading text-xs font-bold text-muted-foreground hidden sm:inline">
                        = ₹{(line.unitPrice * line.quantity).toFixed(0)}
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => removeLine(line.id)}
                      className="text-muted-foreground hover:text-destructive p-1 rounded-lg transition-colors cursor-pointer"
                      title="Remove item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Stock Deduction Indicator & Stepper Row */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/50">
                  <div className="text-xs">
                    {currentStock !== null ? (
                      <span className="flex items-center gap-1.5 font-medium">
                        <span className="text-muted-foreground">Stock: {currentStock}</span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <span
                          className={
                            isNegative
                              ? "text-amber-500 font-bold"
                              : "text-emerald-600 dark:text-emerald-400 font-bold"
                          }
                        >
                          {newStock} left
                        </span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setLinkingLine(line)}
                        className="text-amber-600 dark:text-amber-400 underline font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Link2 className="h-3 w-3" />
                        <span>Link with stock</span>
                      </button>
                    )}
                  </div>

                  {/* Quantity Stepper */}
                  <div className="inline-flex h-8 items-center rounded-full border border-border bg-card p-0.5">
                    <button
                      type="button"
                      onClick={() => updateLineQuantity(line.id, line.quantity - 1)}
                      disabled={line.quantity <= 1}
                      aria-label="Decrease quantity"
                      className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-muted-foreground hover:bg-muted disabled:opacity-30"
                    >
                      <Minus className="h-3 w-3" />
                    </button>

                    <span className="w-8 text-center font-heading text-sm font-bold text-foreground">
                      {line.quantity}
                    </span>

                    <button
                      type="button"
                      onClick={() => updateLineQuantity(line.id, line.quantity + 1)}
                      aria-label="Increase quantity"
                      className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-foreground hover:bg-muted"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <ReceiptDivider />

        {/* Customer Note & Checkout Details */}
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">
              Note (optional)
            </label>
            <input
              placeholder="e.g. Customer name or counter note"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-11 w-full rounded-xl border border-input bg-card px-3.5 text-base text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex items-baseline justify-between pt-2">
            <span className="text-base font-semibold text-muted-foreground">Total sale value</span>
            <span className="font-heading text-3xl font-extrabold text-foreground">
              ₹{totalAmount.toFixed(0)}
            </span>
          </div>

          <button
            type="button"
            onClick={handleConfirmSale}
            disabled={isSubmitting}
            className="w-full h-12 sm:h-14 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Recording Sale...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-5 w-5" />
                <span>Complete Sale &amp; Deduct Stock</span>
              </>
            )}
          </button>
        </div>
      </ReceiptPaper>

      <SalesLinkDialog
        line={linkingLine}
        products={products}
        open={Boolean(linkingLine)}
        onOpenChange={(open) => !open && setLinkingLine(null)}
      />
    </>
  );
}
