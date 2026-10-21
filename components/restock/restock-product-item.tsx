"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Product, RestockOrder, RestockOrderItemRow } from "@/lib/supabase/types";
import { useRestockStore } from "@/lib/store/use-restock-store";
import {
  MapPin,
  Plus,
  Minus,
  Check,
  ShoppingCart,
  PackageCheck,
  Receipt,
  MessageSquare,
  Clipboard,
  Clock,
} from "lucide-react";

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

  return (
    <div
      className={`rounded-xl border transition-all overflow-hidden ${
        isSelected
          ? "border-primary/40 bg-primary/5 shadow-xs"
          : "border-border bg-card hover:border-border/80"
      }`}
    >
      {/* Main Product Info & Reorder Controls */}
      <div className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-sm text-foreground truncate">
              {product.name}
            </span>
            {product.brand && (
              <span className="text-xs text-muted-foreground">({product.brand})</span>
            )}
            <Badge variant="outline" className="text-[10px] py-0 px-1.5">
              {product.category}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {product.storage_location && (
              <span className="flex items-center gap-1 font-medium text-foreground bg-muted/70 px-1.5 py-0.5 rounded-md">
                <MapPin className="h-3 w-3 text-primary shrink-0" />
                {product.storage_location}
              </span>
            )}
            <span>
              Current: <strong className="text-foreground">{product.current_stock}</strong> (Min: {minThreshold})
            </span>
            {isOut && (
              <Badge variant="destructive" className="text-[10px] py-0">
                Out of stock
              </Badge>
            )}
            {isLow && (
              <span className="text-amber-600 dark:text-amber-400 font-medium text-[11px]">
                ⚠️ Low stock
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/60">
          <div className="flex items-center border border-border rounded-lg bg-background overflow-hidden h-8">
            <button
              type="button"
              onClick={() => handleStep(-1)}
              disabled={!isSelected || orderQty <= 1}
              aria-label="Decrease quantity"
              className="px-2 h-full text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 transition-colors"
            >
              <Minus className="h-3 w-3" />
            </button>
            <Input
              type="number"
              min="1"
              value={isSelected ? orderQty : ""}
              placeholder="Qty"
              onChange={handleQtyChange}
              className="w-14 h-full border-0 text-center text-xs font-semibold focus-visible:ring-0 p-0"
            />
            <button
              type="button"
              onClick={() => handleStep(1)}
              aria-label="Increase quantity"
              className="px-2 h-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>

          <Button
            type="button"
            size="sm"
            variant={isSelected ? "default" : "outline"}
            onClick={() => toggleProduct(product)}
            className={`h-8 text-xs font-medium gap-1.5 cursor-pointer ${
              isSelected ? "shadow-xs" : ""
            }`}
          >
            {isSelected ? (
              <>
                <Check className="h-3.5 w-3.5" />
                <span>Added</span>
              </>
            ) : (
              <>
                <ShoppingCart className="h-3.5 w-3.5" />
                <span>Add</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Attached Order Slip & Record Arrival Banner */}
      {latestPending ? (
        <div className="border-t border-amber-500/30 bg-amber-500/10 dark:bg-amber-950/20 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 text-xs min-w-0">
            <div className="h-7 w-7 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Clock className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-amber-900 dark:text-amber-200">
                  Ordered {latestPending.ordered_quantity} units
                </span>
                <span className="text-[11px] text-amber-800 dark:text-amber-300">
                  on{" "}
                  {new Date(latestPending.order.order_date).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-800 dark:text-amber-300">
                  ({latestPending.order.channel === "whatsapp" ? (
                    <>
                      <MessageSquare className="h-3 w-3 text-[#25D366]" />
                      <span>via WhatsApp</span>
                    </>
                  ) : latestPending.order.channel === "copy_clipboard" ? (
                    <>
                      <Clipboard className="h-3 w-3 text-blue-500" />
                      <span>via Clipboard</span>
                    </>
                  ) : (
                    <span>Manual</span>
                  )})
                </span>
              </div>
              <p className="text-[10px] text-amber-800/80 dark:text-amber-300/80 font-mono">
                Slip #{latestPending.order.order_number}
                {latestPending.order.distributor_name ? ` • ${latestPending.order.distributor_name}` : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {totalSlipsCount > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => openItemSlipsModal(product)}
                className="text-[11px] h-7 gap-1 text-muted-foreground hover:text-foreground cursor-pointer"
                title="View all past slips for this item"
              >
                <Receipt className="h-3 w-3" />
                <span>{totalSlipsCount} Slips</span>
              </Button>
            )}

            <Button
              type="button"
              size="xs"
              onClick={() => handleRecordArrival(latestPending)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs gap-1.5 h-7 shadow-xs cursor-pointer"
            >
              <PackageCheck className="h-3.5 w-3.5" />
              <span>Record Arrival</span>
            </Button>
          </div>
        </div>
      ) : totalSlipsCount > 0 ? (
        <div className="border-t border-border/40 bg-muted/20 px-3.5 py-1.5 flex items-center justify-between text-xs">
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Check className="h-3 w-3 text-emerald-500" />
            <span>All ordered stock delivered</span>
          </span>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => openItemSlipsModal(product)}
            className="text-[11px] h-6 gap-1 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <Receipt className="h-3 w-3" />
            <span>{totalSlipsCount} Past Restock Slips</span>
          </Button>
        </div>
      ) : null}
    </div>
  );
}
