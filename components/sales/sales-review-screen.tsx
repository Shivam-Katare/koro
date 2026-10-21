"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { Shop, Product } from "@/lib/supabase/types";
import { useSalesStore, type SaleDraftLine } from "@/lib/store/use-sales-store";
import { recordSaleSlipAction } from "@/lib/actions/sales-actions";
import { SalesLinkDialog } from "./sales-link-dialog";
import {
  ShoppingCart,
  Trash2,
  Minus,
  Plus,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
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
      <Card className="border-border shadow-xs">
        <CardContent className="p-8 text-center space-y-2">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
            <ShoppingCart className="h-6 w-6" />
          </div>
          <p className="text-sm font-semibold text-foreground">Sale Counter is Empty</p>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            Tap items from the left or type a custom product name to record a sale deduction.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border shadow-xs flex flex-col">
      <CardHeader className="p-4 border-b border-border flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base font-heading font-bold">Review Counter Sale</CardTitle>
          <p className="text-[11px] text-muted-foreground">Slip #{slipNumber} • {lines.length} items</p>
        </div>
        <Button variant="ghost" size="xs" onClick={clearDraft} className="text-xs text-muted-foreground hover:text-destructive gap-1">
          <RotateCcw className="h-3 w-3" /> Clear
        </Button>
      </CardHeader>

      <CardContent className="p-4 space-y-3 flex-1">
        <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
          {lines.map((line) => {
            const matchedProduct = products.find((p) => p.id === line.productId);
            const currentStock = matchedProduct ? matchedProduct.current_stock : null;
            const newStock = currentStock !== null ? currentStock - line.quantity : null;
            const isNegative = newStock !== null && newStock < 0;

            return (
              <div key={line.id} className="p-3 rounded-xl border border-border bg-muted/20 space-y-2 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <span className="font-semibold text-foreground truncate block">{line.rawItemName}</span>
                    {matchedProduct && (
                      <span className="text-[11px] text-muted-foreground">{matchedProduct.category}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center border border-border rounded-md bg-background px-1.5 h-7 focus-within:ring-1 focus-within:ring-primary shadow-2xs">
                      <span className="text-[11px] font-bold text-muted-foreground">₹</span>
                      <Input
                        type="number"
                        min="0"
                        placeholder="Price"
                        value={line.unitPrice !== null && line.unitPrice !== undefined ? line.unitPrice : ""}
                        onChange={(e) => {
                          const val = e.target.value === "" ? null : Number(e.target.value);
                          updateLinePrice(line.id, val);
                        }}
                        className="w-16 h-full border-0 text-xs font-bold font-heading p-0 pl-1 text-foreground focus-visible:ring-0"
                      />
                    </div>
                    {line.quantity > 1 && line.unitPrice !== null && (
                      <span className="text-[11px] font-bold text-muted-foreground font-heading hidden sm:inline">
                        = ₹{(line.unitPrice * line.quantity).toFixed(0)}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeLine(line.id)}
                      className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border/40">
                  <div className="flex items-center gap-1.5 text-[11px]">
                    {currentStock !== null ? (
                      <span className="flex items-center gap-1">
                        <span>Stock: <strong>{currentStock}</strong></span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <strong className={isNegative ? "text-amber-500" : "text-emerald-600 dark:text-emerald-400"}>
                          {newStock} units
                        </strong>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setLinkingLine(line)}
                        className="text-amber-600 dark:text-amber-400 underline font-medium flex items-center gap-1"
                      >
                        <Link2 className="h-3 w-3" /> Unlinked (Click to match)
                      </button>
                    )}
                  </div>

                  <div className="flex items-center border border-border rounded-md bg-background overflow-hidden h-7">
                    <button
                      type="button"
                      onClick={() => updateLineQuantity(line.id, line.quantity - 1)}
                      disabled={line.quantity <= 1}
                      className="px-2 h-full text-muted-foreground hover:bg-muted disabled:opacity-30"
                    >
                      <Minus className="h-2.5 w-2.5" />
                    </button>
                    <span className="w-8 text-center text-xs font-semibold">{line.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateLineQuantity(line.id, line.quantity + 1)}
                      className="px-2 h-full text-muted-foreground hover:bg-muted"
                    >
                      <Plus className="h-2.5 w-2.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <Input
          placeholder="Customer or Slip Note (Optional)..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="h-8 text-xs"
        />
      </CardContent>

      <CardFooter className="p-4 border-t border-border flex flex-col gap-3 bg-muted/10">
        <div className="flex items-center justify-between w-full">
          <span className="text-xs text-muted-foreground font-medium">Total Sale Value:</span>
          <span className="text-xl font-extrabold text-foreground font-heading">
            ₹{totalAmount.toFixed(0)}
          </span>
        </div>

        <Button
          type="button"
          onClick={handleConfirmSale}
          disabled={isSubmitting}
          className="w-full bg-[#00BAF2] hover:bg-[#009ecc] text-white font-bold h-11 text-sm shadow-md gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Deducting Stock...</span>
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4" />
              <span>Confirm &amp; Deduct Stock (बिक्री दर्ज करें)</span>
            </>
          )}
        </Button>
      </CardFooter>

      <SalesLinkDialog
        line={linkingLine}
        products={products}
        open={Boolean(linkingLine)}
        onOpenChange={(open) => !open && setLinkingLine(null)}
      />
    </Card>
  );
}
