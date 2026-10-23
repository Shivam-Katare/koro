"use client";

import type { Product, RestockOrder, RestockOrderItemRow } from "@/lib/supabase/types";
import { useRestockStore } from "@/lib/store/use-restock-store";
import { KoroGlyph } from "@/components/brand/koro-face";
import { MapPin, Plus, Minus, X, PackageCheck, Receipt, Truck, MessageSquare, Clipboard } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PendingSlipItem extends RestockOrderItemRow {
  order: RestockOrder;
}

interface RestockProductItemProps {
  product: Product;
  pendingItems?: PendingSlipItem[];
  totalSlipsCount?: number;
}

export function RestockProductItem({
  product,
  pendingItems = [],
  totalSlipsCount = 0,
}: RestockProductItemProps) {
  const orderItems = useRestockStore((s) => s.orderItems);
  const toggleProduct = useRestockStore((s) => s.toggleProduct);
  const setQuantity = useRestockStore((s) => s.setQuantity);
  const openItemArrivalModal = useRestockStore((s) => s.openItemArrivalModal);
  const openItemSlipsModal = useRestockStore((s) => s.openItemSlipsModal);

  const selectedItem = orderItems[product.id];
  const isSelected = Boolean(selectedItem);
  const orderQty = selectedItem ? selectedItem.quantity : 1;

  const minThreshold = product.min_stock_threshold ?? 5;
  const isOut = product.current_stock <= 0 || product.stock_status === "out_of_stock";
  const isLow = !isOut && (product.current_stock <= minThreshold || product.stock_status === "low_stock");

  const latestPending = pendingItems[0];

  const handleQtyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val >= 1) {
      if (!isSelected) {
        toggleProduct(product);
      }
      setQuantity(product.id, val);
    }
  };

  const handleStep = (delta: number) => {
    if (!isSelected) {
      toggleProduct(product);
      return;
    }
    const newQty = Math.max(1, orderQty + delta);
    setQuantity(product.id, newQty);
  };

  const handleRecordArrival = (item: PendingSlipItem) => {
    openItemArrivalModal({
      orderItemId: item.id,
      orderId: item.order.id,
      orderNumber: item.order.order_number,
      orderDate: item.order.order_date,
      channel: item.order.channel,
      distributorName: item.order.distributor_name,
      product,
      orderedQuantity: Number(item.ordered_quantity) || 1,
      receivedQuantity: Number(item.ordered_quantity) || 1,
    });
  };

  const tileTone = isOut
    ? "bg-[#ffe6e1] dark:bg-[#3b211d]"
    : isLow
    ? "bg-[#fff1cc] dark:bg-[#3a2f12]"
    : "bg-[#e8f7ee] dark:bg-[#1c2b22]";

  const statusPill = isOut
    ? { text: "Out of stock", cls: "bg-[#ffe6e1] text-[#c4301c] dark:bg-[#3b211d] dark:text-[#ff8a78]" }
    : isLow
    ? { text: `Low: ${product.current_stock} left`, cls: "bg-[#fff1cc] text-amber-800 dark:bg-[#3a2f12] dark:text-amber-300" }
    : { text: `${product.current_stock} in stock`, cls: "bg-[#e8f7ee] text-[#0f7a39] dark:bg-[#1c2b22] dark:text-[#5fd68c]" };

  return (
    <div
      className={cn(
        "overflow-hidden rounded-3xl border bg-card transition-colors",
        isSelected ? "border-primary/50" : "border-border"
      )}
    >
      {/* Product info and the single "Add" control */}
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <span className={cn("flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl", tileTone)}>
            <KoroGlyph type={isOut || isLow ? "alert" : "check-circle"} size={44} />
          </span>

          <div className="min-w-0 space-y-1.5">
            <p className="truncate text-lg font-semibold leading-snug text-foreground">
              {product.name}
              {product.brand && <span className="font-normal text-muted-foreground"> ({product.brand})</span>}
            </p>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-muted-foreground">
              <span className={cn("rounded-full px-3 py-0.5 text-sm font-semibold", statusPill.cls)}>
                {statusPill.text}
              </span>
              <span>Reorder at {minThreshold}</span>
              {product.storage_location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-primary" />
                  {product.storage_location}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2">
          {isSelected ? (
            <>
              <div className="flex h-9 sm:h-9.5 items-center rounded-full bg-secondary">
                <button
                  type="button"
                  onClick={() => handleStep(-1)}
                  disabled={orderQty <= 1}
                  aria-label="Decrease quantity"
                  className="flex h-9 sm:h-9.5 w-8 cursor-pointer items-center justify-center rounded-l-full text-primary transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <input
                  type="number"
                  min="1"
                  value={orderQty}
                  onChange={handleQtyChange}
                  aria-label="Quantity to order"
                  className="h-9 sm:h-9.5 w-11 bg-transparent text-center text-sm font-bold tabular-nums text-foreground outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <button
                  type="button"
                  onClick={() => handleStep(1)}
                  aria-label="Increase quantity"
                  className="flex h-9 sm:h-9.5 w-8 cursor-pointer items-center justify-center rounded-r-full text-primary transition-colors hover:bg-primary/10"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => toggleProduct(product)}
                aria-label="Remove from order"
                title="Remove from order"
                className="flex h-9 sm:h-9.5 w-9 sm:w-9.5 cursor-pointer items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => toggleProduct(product)}
              className="inline-flex h-9 sm:h-9.5 cursor-pointer items-center gap-1.5 rounded-full bg-primary px-4 text-xs sm:text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 active:scale-95 shadow-xs"
            >
              <Plus className="h-4 w-4" />
              <span>Add to order</span>
            </button>
          )}
        </div>
      </div>

      {/* Waiting for delivery: arrival is recorded per item */}
      {latestPending ? (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#fff1cc]/70 px-4 py-2.5 sm:px-5 dark:bg-[#3a2f12]/70">
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            <Truck className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-amber-700 dark:text-amber-300" />
            <div className="min-w-0">
              <p className="text-sm sm:text-base font-semibold text-foreground">
                {latestPending.ordered_quantity} on the way
                <span className="font-normal text-muted-foreground">
                  {" "}
                  ordered{" "}
                  {new Date(latestPending.order.order_date).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              </p>
              <p className="flex flex-wrap items-center gap-x-2 text-xs sm:text-sm text-muted-foreground">
                <span>Slip {latestPending.order.order_number}</span>
                {latestPending.order.channel === "whatsapp" ? (
                  <span className="inline-flex items-center gap-1">
                    <MessageSquare className="h-3.5 w-3.5 text-[#25D366]" />
                    WhatsApp
                  </span>
                ) : latestPending.order.channel === "copy_clipboard" ? (
                  <span className="inline-flex items-center gap-1">
                    <Clipboard className="h-3.5 w-3.5" />
                    Copied
                  </span>
                ) : null}
                {latestPending.order.distributor_name && <span>{latestPending.order.distributor_name}</span>}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {totalSlipsCount > 1 && (
              <button
                type="button"
                onClick={() => openItemSlipsModal(product)}
                title="View all past slips for this item"
                className="inline-flex h-8 sm:h-8.5 cursor-pointer items-center gap-1.5 rounded-full px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-background/60 hover:text-foreground"
              >
                <Receipt className="h-3.5 w-3.5" />
                <span>{totalSlipsCount} slips</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => handleRecordArrival(latestPending)}
              className="inline-flex h-8 sm:h-8.5 cursor-pointer items-center gap-1.5 rounded-full bg-[#14a44d] px-3.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 active:scale-95 shadow-xs"
            >
              <PackageCheck className="h-4 w-4" />
              <span>Record arrival</span>
            </button>
          </div>
        </div>
      ) : totalSlipsCount > 0 ? (
        <div className="flex items-center justify-between gap-3 bg-muted/50 px-4 py-2.5 sm:px-5">
          <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <PackageCheck className="h-4 w-4 text-[#14a44d]" />
            All ordered stock delivered
          </span>
          <button
            type="button"
            onClick={() => openItemSlipsModal(product)}
            className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
          >
            <Receipt className="h-4 w-4" />
            <span>{totalSlipsCount} past slips</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
