"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useRestockStore } from "@/lib/store/use-restock-store";
import { buildWhatsAppRestockMessage } from "@/lib/utils/restock-formatters";
import { createRestockOrderAction } from "@/lib/actions/restock-actions";
import type { Shop } from "@/lib/supabase/types";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MessageSquareShare,
  ClipboardCopy,
  PackageCheck,
  Trash2,
  Minus,
  Plus,
  ShoppingCart,
  RotateCcw,
  CheckCheck,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

interface RestockPurchaseListProps {
  shop: Shop | null;
}

export function RestockPurchaseList({ shop }: RestockPurchaseListProps) {
  const router = useRouter();
  const orderItems = useRestockStore((s) => s.orderItems);
  const distributorName = useRestockStore((s) => s.distributorName);
  const notes = useRestockStore((s) => s.notes);
  const setDistributorName = useRestockStore((s) => s.setDistributorName);
  const setNotes = useRestockStore((s) => s.setNotes);
  const setQuantity = useRestockStore((s) => s.setQuantity);
  const removeProduct = useRestockStore((s) => s.removeProduct);
  const clearOrder = useRestockStore((s) => s.clearOrder);
  const openArrivalDialog = useRestockStore((s) => s.openArrivalDialog);

  const [isProcessing, setIsProcessing] = useState(false);

  const items = Object.values(orderItems);
  const totalUnits = items.reduce((sum, item) => sum + item.quantity, 0);

  const saveOrderToSlip = async (
    channel: "whatsapp" | "copy_clipboard" | "manual"
  ) => {
    if (!shop?.id) {
      toast.error("Shop details not found");
      return null;
    }
    if (items.length === 0) {
      toast.error("Please add products to your purchase list first");
      return null;
    }

    const payload = {
      shopId: shop.id,
      channel,
      distributorName: distributorName.trim() || undefined,
      notes: notes.trim() || undefined,
      items: items.map((it) => ({
        productId: it.product.id,
        productName: it.product.name,
        quantity: it.quantity,
      })),
    };

    const res = await createRestockOrderAction(payload);
    if (!res.success) {
      toast.error(res.error || "Failed to save order slip");
      return null;
    }

    return res.order;
  };

  const handleShareWhatsApp = async () => {
    if (items.length === 0) {
      toast.error("Please add products to your purchase list first");
      return;
    }

    setIsProcessing(true);
    const order = await saveOrderToSlip("whatsapp");
    setIsProcessing(false);

    if (!order) return;

    const message = buildWhatsAppRestockMessage({
      shopName: shop?.name || "My Store",
      items,
      distributorName,
      notes,
    });

    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");

    clearOrder();
    toast.success(
      `Slip #${order.order_number} saved & linked to item rows! WhatsApp opened.`
    );
    router.refresh();
  };

  const handleCopyAndClear = async () => {
    if (items.length === 0) return;

    setIsProcessing(true);
    const order = await saveOrderToSlip("copy_clipboard");
    setIsProcessing(false);

    if (!order) return;

    const message = buildWhatsAppRestockMessage({
      shopName: shop?.name || "My Store",
      items,
      distributorName,
      notes,
    });

    try {
      await navigator.clipboard.writeText(message);
      clearOrder();
      toast.success(
        `Slip #${order.order_number} saved & copied! Linked to item rows for delivery tracking.`
      );
      router.refresh();
    } catch {
      toast.error("Order saved, but clipboard access was denied");
      clearOrder();
      router.refresh();
    }
  };

  const handleCopyOnly = async () => {
    if (items.length === 0) return;

    setIsProcessing(true);
    const order = await saveOrderToSlip("copy_clipboard");
    setIsProcessing(false);

    if (!order) return;

    const message = buildWhatsAppRestockMessage({
      shopName: shop?.name || "My Store",
      items,
      distributorName,
      notes,
    });

    try {
      await navigator.clipboard.writeText(message);
      toast.success(
        `Slip #${order.order_number} recorded via Clipboard! Record Arrival button is attached to item rows.`
      );
      router.refresh();
    } catch {
      toast.error("Could not copy order to clipboard");
    }
  };

  const handleMarkSent = async () => {
    if (items.length === 0) return;

    setIsProcessing(true);
    const order = await saveOrderToSlip("manual");
    setIsProcessing(false);

    if (!order) return;

    clearOrder();
    toast.success(
      `Slip #${order.order_number} saved & marked as sent! Linked to item rows.`
    );
    router.refresh();
  };

  if (items.length === 0) {
    return (
      <Card className="border-border shadow-xs">
        <CardHeader className="pb-3 border-b border-border">
          <CardTitle className="text-base font-heading font-bold flex items-center justify-between">
            <span>Purchase List</span>
            <span className="text-xs font-normal text-muted-foreground">0 items</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 text-center space-y-2">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
            <ShoppingCart className="h-6 w-6" />
          </div>
          <p className="text-sm font-semibold text-foreground">Purchase List is Empty</p>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            Select products from the depleted list on the left to prepare an order for your distributor.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border shadow-xs flex flex-col">
      <CardHeader className="p-4 border-b border-border flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base font-heading font-bold">Purchase List</CardTitle>
          <p className="text-[11px] text-muted-foreground">
            {items.length} product{items.length > 1 ? "s" : ""} • {totalUnits} total units
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={clearOrder}
          disabled={isProcessing}
          className="text-xs text-muted-foreground hover:text-destructive gap-1 cursor-pointer"
        >
          <RotateCcw className="h-3 w-3" />
          <span>Clear</span>
        </Button>
      </CardHeader>

      <CardContent className="p-4 space-y-4 flex-1">
        <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
          {items.map(({ product, quantity }) => (
            <div
              key={product.id}
              className="p-2.5 rounded-lg border border-border bg-muted/20 flex items-center justify-between gap-2 text-xs"
            >
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate">{product.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  In stock: {product.current_stock} • Min: {product.min_stock_threshold ?? 5}
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <div className="flex items-center border border-border rounded-md bg-background overflow-hidden h-7">
                  <button
                    type="button"
                    onClick={() => setQuantity(product.id, quantity - 1)}
                    disabled={quantity <= 1 || isProcessing}
                    className="px-1.5 h-full text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30"
                  >
                    <Minus className="h-2.5 w-2.5" />
                  </button>
                  <span className="w-8 text-center text-xs font-semibold">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(product.id, quantity + 1)}
                    disabled={isProcessing}
                    className="px-1.5 h-full text-muted-foreground hover:text-foreground hover:bg-muted"
                  >
                    <Plus className="h-2.5 w-2.5" />
                  </button>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => removeProduct(product.id)}
                  disabled={isProcessing}
                  className="text-muted-foreground hover:text-destructive cursor-pointer"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-2 pt-2 border-t border-border">
          <Input
            placeholder="Distributor / Supplier Name (Optional)"
            value={distributorName}
            onChange={(e) => setDistributorName(e.target.value)}
            disabled={isProcessing}
            className="h-8 text-xs"
          />
          <Input
            placeholder="Order Notes (e.g. Deliver before Friday)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isProcessing}
            className="h-8 text-xs"
          />
        </div>
      </CardContent>

      <CardFooter className="p-4 border-t border-border flex flex-col gap-2.5 bg-muted/10">
        <Button
          type="button"
          onClick={handleShareWhatsApp}
          disabled={isProcessing}
          className="w-full bg-[#25D366] hover:bg-[#20ba59] text-white font-bold h-10 shadow-xs gap-2 cursor-pointer"
        >
          {isProcessing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MessageSquareShare className="h-4 w-4" />
          )}
          <span>Share on WhatsApp</span>
        </Button>

        {/* Clear & Save Slip Actions */}
        <div className="grid grid-cols-2 gap-2 w-full">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopyAndClear}
            disabled={isProcessing}
            className="h-8 text-xs gap-1.5 font-medium cursor-pointer"
            title="Save order slip, copy message to clipboard, and clear draft"
          >
            <ClipboardCopy className="h-3.5 w-3.5 text-primary" />
            <span>Copy &amp; Clear</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleMarkSent}
            disabled={isProcessing}
            className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground cursor-pointer"
            title="Save slip as sent order and clear draft"
          >
            <CheckCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span>Sent? Clear Draft</span>
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2 w-full pt-1 border-t border-border/40">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCopyOnly}
            disabled={isProcessing}
            className="h-7 text-[11px] text-muted-foreground gap-1 cursor-pointer"
            title="Copy order and save slip without clearing draft list"
          >
            <ClipboardCopy className="h-3 w-3" />
            <span>Copy Only</span>
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={openArrivalDialog}
            disabled={isProcessing}
            className="h-7 text-[11px] gap-1 font-medium text-primary cursor-pointer"
            title="Update inventory immediately if distributor is delivering now"
          >
            <PackageCheck className="h-3 w-3" />
            <span>Record Arrival</span>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
