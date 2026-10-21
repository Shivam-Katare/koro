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
import { useRestockStore } from "@/lib/store/use-restock-store";
import { recordRestockArrivalAction } from "@/lib/actions/restock-actions";
import { Loader2, PackageCheck, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";

export function RestockArrivalDialog() {
  const router = useRouter();
  const isArrivalOpen = useRestockStore((s) => s.isArrivalOpen);
  const closeArrivalDialog = useRestockStore((s) => s.closeArrivalDialog);
  const orderItems = useRestockStore((s) => s.orderItems);
  const receivedQuantities = useRestockStore((s) => s.receivedQuantities);
  const setReceivedQuantity = useRestockStore((s) => s.setReceivedQuantity);
  const clearOrder = useRestockStore((s) => s.clearOrder);

  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const items = Object.values(orderItems);

  const handleConfirmArrival = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    setIsSubmitting(true);

    const payload = items
      .map((item) => ({
        productId: item.product.id,
        receivedQuantity: receivedQuantities[item.product.id] ?? item.quantity,
      }))
      .filter((item) => item.receivedQuantity > 0);

    if (payload.length === 0) {
      toast.error("Please enter a received quantity of at least 1 unit");
      setIsSubmitting(false);
      return;
    }

    const res = await recordRestockArrivalAction({
      items: payload,
      notes: deliveryNotes.trim() || undefined,
    });

    setIsSubmitting(false);

    if (!res.success) {
      toast.error(res.error || "Failed to record stock arrival");
      return;
    }

    toast.success(`Received ${payload.length} items! Inventory updated.`);
    clearOrder();
    closeArrivalDialog();
    router.refresh();
  };

  return (
    <Dialog open={isArrivalOpen} onOpenChange={(open) => !open && closeArrivalDialog()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackageCheck className="h-5 w-5 text-primary" />
            <span>Record Delivered Stock</span>
          </DialogTitle>
          <DialogDescription>
            Verify received quantities to update your inventory. Current stock remains unchanged until you confirm here.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleConfirmArrival} className="space-y-4 pt-2">
          <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
            {items.map(({ product, quantity }) => {
              const received = receivedQuantities[product.id] ?? quantity;
              const expectedNewStock = product.current_stock + received;

              return (
                <div
                  key={product.id}
                  className="p-3 rounded-lg border border-border bg-muted/20 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground truncate">{product.name}</span>
                    <span className="text-muted-foreground">Ordered: {quantity}</span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <span>Stock: {product.current_stock}</span>
                      <ArrowRight className="h-3 w-3" />
                      <strong className="text-emerald-600 dark:text-emerald-400">
                        {expectedNewStock} units
                      </strong>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Label className="text-[11px] font-medium">Received:</Label>
                      <Input
                        type="number"
                        min="0"
                        value={received}
                        onChange={(e) =>
                          setReceivedQuantity(product.id, parseInt(e.target.value, 10) || 0)
                        }
                        className="w-16 h-7 text-xs text-center font-semibold"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold">Delivery / Invoice Note (Optional)</Label>
            <Input
              placeholder="e.g. Invoice #4092 from Metro Wholesale"
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              className="h-8 text-xs"
              disabled={isSubmitting}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={closeArrivalDialog}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="gap-1.5 font-semibold"
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
                  <span>Confirm &amp; Update Stock</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
