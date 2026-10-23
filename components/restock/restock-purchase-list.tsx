"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useRestockStore } from "@/lib/store/use-restock-store";
import { buildWhatsAppRestockMessage } from "@/lib/utils/restock-formatters";
import { createRestockOrderAction } from "@/lib/actions/restock-actions";
import type { Shop, Product } from "@/lib/supabase/types";
import { KoroFace } from "@/components/brand/koro-face";
import { ReceiptPaper, ReceiptDivider } from "./receipt-paper";
import { RestockAddTrendingDialog } from "./restock-add-trending-dialog";
import { MessageSquareShare, ClipboardCopy, Trash2, Minus, Plus, RotateCcw, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface RestockPurchaseListProps {
  shop: Shop | null;
  onProductAdded?: (product: Product) => void;
}

const fieldClass =
  "h-11 w-full rounded-xl border border-input bg-background px-3.5 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60";

export function RestockPurchaseList({ shop, onProductAdded }: RestockPurchaseListProps) {
  const router = useRouter();
  const [isAddTrendingOpen, setIsAddTrendingOpen] = useState(false);
  const orderItems = useRestockStore((s) => s.orderItems);
  const distributorName = useRestockStore((s) => s.distributorName);
  const notes = useRestockStore((s) => s.notes);
  const setDistributorName = useRestockStore((s) => s.setDistributorName);
  const setNotes = useRestockStore((s) => s.setNotes);
  const setQuantity = useRestockStore((s) => s.setQuantity);
  const removeProduct = useRestockStore((s) => s.removeProduct);
  const clearOrder = useRestockStore((s) => s.clearOrder);

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

  const addNewItemButton = (
    <button
      type="button"
      onClick={() => setIsAddTrendingOpen(true)}
      disabled={isProcessing}
      title="Order a new or trending item that is not in your list yet"
      className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full bg-secondary px-4 text-base font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-50"
    >
      <Plus className="h-5 w-5" />
      <span>New item</span>
    </button>
  );

  const addDialog = (
    <RestockAddTrendingDialog
      shopId={shop?.id || null}
      shopCategory={shop?.category}
      open={isAddTrendingOpen}
      onOpenChange={setIsAddTrendingOpen}
      onItemAdded={onProductAdded}
    />
  );

  if (items.length === 0) {
    return (
      <>
        <ReceiptPaper>
          <div className="flex items-center justify-between gap-3 p-5">
            <h3 className="font-heading text-xl font-bold text-foreground">Your order</h3>
            <span className="text-base text-muted-foreground">0 items</span>
          </div>
          <ReceiptDivider />
          <div className="flex flex-col items-center gap-4 px-6 py-10 text-center">
            <KoroFace size={64} tone="sky" />
            <div className="space-y-1">
              <p className="text-lg font-semibold text-foreground">Nothing in your order yet</p>
              <p className="mx-auto max-w-xs text-base text-muted-foreground">
                Tap Add to order on an item, or add a new one.
              </p>
            </div>
            {addNewItemButton}
          </div>
        </ReceiptPaper>
        {addDialog}
      </>
    );
  }

  return (
    <>
      <ReceiptPaper>
        {/* Receipt header */}
        <div className="flex items-start justify-between gap-3 p-5">
          <div>
            <h3 className="font-heading text-xl font-bold text-foreground">Your order</h3>
            <p className="mt-0.5 text-base text-muted-foreground">
              {items.length} item{items.length > 1 ? "s" : ""}, {totalUnits} units
            </p>
          </div>
          <button
            type="button"
            onClick={clearOrder}
            disabled={isProcessing}
            title="Remove everything from this order"
            className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full px-3 text-base font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Clear</span>
          </button>
        </div>

        <ReceiptDivider />

        {/* Line items */}
        <ul className="no-scrollbar max-h-[340px] space-y-1 overflow-y-auto px-3 py-3">
          {items.map(({ product, quantity }) => {
            const isNewItem =
              product.current_stock === 0 &&
              (product.description?.toLowerCase().includes("trending") ||
                product.description?.toLowerCase().includes("restock"));

            return (
              <li key={product.id} className="flex items-center justify-between gap-3 rounded-2xl px-2 py-2.5">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-base font-semibold text-foreground">{product.name}</p>
                    {isNewItem && (
                      <span className="shrink-0 rounded-full bg-[#fff1cc] px-2.5 py-0.5 text-sm font-semibold text-amber-800 dark:bg-[#3a2f12] dark:text-amber-300">
                        New
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    In stock {product.current_stock}, reorder at {product.min_stock_threshold ?? 5}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  <div className="flex h-10 items-center rounded-full bg-secondary">
                    <button
                      type="button"
                      onClick={() => setQuantity(product.id, quantity - 1)}
                      disabled={quantity <= 1 || isProcessing}
                      aria-label="Decrease quantity"
                      className="flex h-10 w-9 cursor-pointer items-center justify-center rounded-l-full text-primary transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-8 text-center text-base font-bold tabular-nums text-foreground">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity(product.id, quantity + 1)}
                      disabled={isProcessing}
                      aria-label="Increase quantity"
                      className="flex h-10 w-9 cursor-pointer items-center justify-center rounded-r-full text-primary transition-colors hover:bg-primary/10 disabled:opacity-50"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeProduct(product.id)}
                    disabled={isProcessing}
                    aria-label={`Remove ${product.name}`}
                    title="Remove"
                    className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center justify-between px-5 pb-4">
          {addNewItemButton}
          <p className="text-base text-muted-foreground">
            Total <span className="text-xl font-bold tabular-nums text-foreground">{totalUnits}</span> units
          </p>
        </div>

        <ReceiptDivider />

        {/* Optional details */}
        <div className="space-y-3 p-5">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-muted-foreground">Supplier (optional)</span>
            <input
              placeholder="Distributor name"
              value={distributorName}
              onChange={(e) => setDistributorName(e.target.value)}
              disabled={isProcessing}
              className={fieldClass}
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-muted-foreground">Note (optional)</span>
            <input
              placeholder="e.g. Deliver before Friday"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isProcessing}
              className={fieldClass}
            />
          </label>
        </div>

        <ReceiptDivider />

        {/* The only two actions */}
        <div className="space-y-2.5 p-5">
          <button
            type="button"
            onClick={handleShareWhatsApp}
            disabled={isProcessing}
            className="inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[#25D366] text-base font-bold text-white transition-opacity hover:opacity-90 active:scale-[0.99] disabled:opacity-60"
          >
            {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : <MessageSquareShare className="h-5 w-5" />}
            <span>Share on WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={handleCopyAndClear}
            disabled={isProcessing}
            title="Save the slip, copy the message, and start a fresh order"
            className="inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-muted text-base font-semibold text-foreground transition-colors hover:bg-secondary hover:text-primary disabled:opacity-60"
          >
            <ClipboardCopy className="h-5 w-5" />
            <span>Copy and clear</span>
          </button>
        </div>
      </ReceiptPaper>

      {addDialog}
    </>
  );
}
