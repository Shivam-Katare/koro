"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Badge } from "@/components/ui/badge";
import { useRestockStore } from "@/lib/store/use-restock-store";
import { recordItemArrivalAction } from "@/lib/actions/restock-actions";
import {
  Loader2,
  PackageCheck,
  ArrowRight,
  Minus,
  Plus,
  MessageSquare,
  Clipboard,
  Calendar,
} from "lucide-react";
import toast from "react-hot-toast";

export function RestockItemArrivalDialog() {
  const router = useRouter();
  const isOpen = useRestockStore((s) => s.isItemArrivalOpen);
  const closeItemArrivalModal = useRestockStore((s) => s.closeItemArrivalModal);
  const target = useRestockStore((s) => s.selectedItemForArrival);
  const setReceivedQuantity = useRestockStore((s) => s.setItemReceivedQuantity);

  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!target) return null;

  const currentStock = target.product.current_stock ?? 0;
  const receivedQty = target.receivedQuantity ?? target.orderedQuantity;
  const expectedNewStock = currentStock + receivedQty;

  const handleStep = (delta: number) => {
    const nextVal = Math.max(0, receivedQty + delta);
    setReceivedQuantity(nextVal);
  };

  const handleConfirmArrival = async (e: React.FormEvent) => {
    e.preventDefault();
    if (receivedQty <= 0) {
      toast.error("Received quantity must be at least 1 unit");
      return;
    }

    setIsSubmitting(true);

    const res = await recordItemArrivalAction({
      orderItemId: target.orderItemId,
      productId: target.product.id,
      receivedQuantity: receivedQty,
      notes: deliveryNotes.trim() || undefined,
    });

    setIsSubmitting(false);

    if (!res.success) {
      toast.error(res.error || "Failed to record delivery arrival");
      return;
    }

    toast.success(
      `Delivery recorded! ${target.product.name} stock updated: ${currentStock} to ${res.newStock} units`
    );
    closeItemArrivalModal();
    setDeliveryNotes("");
    router.refresh();
  };

  const formattedDate = target.orderDate
    ? new Date(target.orderDate).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Recent";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeItemArrivalModal()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <PackageCheck className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-heading font-bold">
                Record Delivery Arrival
              </DialogTitle>
              <DialogDescription className="text-xs">
                Confirm received quantity to update inventory for this product.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleConfirmArrival} className="space-y-4 pt-1">
          {/* Slip & Order Reference Box */}
          <div className="p-3 rounded-lg border border-border bg-muted/30 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-foreground text-sm truncate">
                {target.product.name}
              </span>
              <Badge variant="outline" className="text-[10px] uppercase font-mono">
                {target.orderNumber}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-muted-foreground text-[11px]">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Ordered on {formattedDate}
              </span>

              <span className="flex items-center gap-1 font-medium">
                {target.channel === "whatsapp" ? (
                  <>
                    <MessageSquare className="h-3 w-3 text-[#25D366]" />
                    <span className="text-[#25D366]">via WhatsApp</span>
                  </>
                ) : target.channel === "copy_clipboard" ? (
                  <>
                    <Clipboard className="h-3 w-3 text-blue-500" />
                    <span className="text-blue-500">via Clipboard</span>
                  </>
                ) : (
                  <span>via Manual Order</span>
                )}
              </span>

              {target.distributorName && (
                <span>• Supplier: {target.distributorName}</span>
              )}
            </div>
          </div>

          {/* Stock Calculation & Quantity Stepper */}
          <div className="p-3.5 rounded-lg border border-primary/20 bg-primary/5 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Ordered Quantity:</span>
              <span className="font-semibold text-foreground">
                {target.orderedQuantity} units
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2 border-t border-border/50">
              <div>
                <Label className="text-xs font-semibold text-foreground">
                  Actual Received Units:
                </Label>
                <p className="text-[10px] text-muted-foreground">
                  Change if shipment had partial or extra delivery
                </p>
              </div>

              <div className="flex items-center border border-border rounded-lg bg-background overflow-hidden h-9 shrink-0">
                <button
                  type="button"
                  onClick={() => handleStep(-1)}
                  disabled={receivedQty <= 1 || isSubmitting}
                  className="px-2.5 h-full text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 transition-colors"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <Input
                  type="number"
                  min="1"
                  value={receivedQty}
                  onChange={(e) =>
                    setReceivedQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))
                  }
                  className="w-14 h-full border-0 text-center text-sm font-bold focus-visible:ring-0 p-0"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => handleStep(1)}
                  disabled={isSubmitting}
                  className="px-2.5 h-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-border/50">
              <span className="text-muted-foreground">Inventory Impact:</span>
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">{currentStock}</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
                  {expectedNewStock} units
                </strong>
                <span className="text-[10px] text-emerald-600 font-medium">
                  (+{receivedQty})
                </span>
              </div>
            </div>
          </div>

          {/* Delivery Note */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-foreground">
              Delivery Notes (Optional)
            </Label>
            <Input
              placeholder="e.g. Received bill #9021, checked expiration date"
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              className="h-8 text-xs"
              disabled={isSubmitting}
            />
          </div>

          {/* Dialog Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={closeItemArrivalModal}
              disabled={isSubmitting}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="gap-1.5 font-semibold text-xs bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Updating Stock...</span>
                </>
              ) : (
                <>
                  <PackageCheck className="h-3.5 w-3.5" />
                  <span>Confirm Arrival &amp; Update Stock (+{receivedQty})</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
