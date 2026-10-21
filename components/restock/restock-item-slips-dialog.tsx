"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRestockStore } from "@/lib/store/use-restock-store";
import type { RestockOrder, RestockOrderItemRow } from "@/lib/supabase/types";
import {
  Receipt,
  PackageCheck,
  Calendar,
  MessageSquare,
  Clipboard,
  CheckCircle2,
  Clock,
  PlusCircle,
  XCircle,
} from "lucide-react";

interface RestockItemSlipsDialogProps {
  orders: RestockOrder[];
  items: RestockOrderItemRow[];
}

export function RestockItemSlipsDialog({ orders, items }: RestockItemSlipsDialogProps) {
  const isOpen = useRestockStore((s) => s.isItemSlipsModalOpen);
  const closeItemSlipsModal = useRestockStore((s) => s.closeItemSlipsModal);
  const product = useRestockStore((s) => s.selectedProductForSlips);
  const openItemArrivalModal = useRestockStore((s) => s.openItemArrivalModal);
  const toggleProduct = useRestockStore((s) => s.toggleProduct);

  if (!product) return null;

  // Filter items for this product
  const productOrderItems = items.filter((it) => it.product_id === product.id);

  // Map each order item to its parent order
  const ordersMap = new Map<string, RestockOrder>();
  orders.forEach((o) => ordersMap.set(o.id, o));

  const slips = productOrderItems.map((item) => ({
    item,
    order: ordersMap.get(item.order_id),
  }));

  const totalOrderedUnits = productOrderItems.reduce(
    (sum, it) => sum + (Number(it.ordered_quantity) || 0),
    0
  );
  const totalReceivedUnits = productOrderItems.reduce(
    (sum, it) => sum + (Number(it.received_quantity) || 0),
    0
  );
  const pendingCount = productOrderItems.filter((it) => it.status === "pending").length;

  const handleOpenArrival = (item: RestockOrderItemRow, order: RestockOrder) => {
    closeItemSlipsModal();
    openItemArrivalModal({
      orderItemId: item.id,
      orderId: order.id,
      orderNumber: order.order_number,
      orderDate: order.order_date,
      channel: order.channel,
      distributorName: order.distributor_name,
      product,
      orderedQuantity: Number(item.ordered_quantity) || 1,
      receivedQuantity: Number(item.ordered_quantity) || 1,
    });
  };

  const handleReorderNow = () => {
    toggleProduct(product);
    closeItemSlipsModal();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeItemSlipsModal()}>
      <DialogContent className="max-w-xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-5 pb-3 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" />
                <DialogTitle className="text-base font-heading font-bold">
                  Restock Slips History: {product.name}
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs">
                Complete record of all purchase orders, suppliers, and arrival tracking for this item.
              </DialogDescription>
            </div>
            <Button
              type="button"
              size="xs"
              variant="outline"
              onClick={handleReorderNow}
              className="gap-1.5 text-xs font-semibold shrink-0 cursor-pointer"
            >
              <PlusCircle className="h-3.5 w-3.5 text-primary" />
              <span>Order Again</span>
            </Button>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-2 pt-3">
            <div className="p-2 rounded-lg bg-muted/40 border border-border/60 text-center">
              <p className="text-[10px] text-muted-foreground uppercase font-medium">Orders</p>
              <p className="text-sm font-bold text-foreground">{productOrderItems.length}</p>
            </div>
            <div className="p-2 rounded-lg bg-muted/40 border border-border/60 text-center">
              <p className="text-[10px] text-muted-foreground uppercase font-medium">Units Ordered</p>
              <p className="text-sm font-bold text-foreground">{totalOrderedUnits}</p>
            </div>
            <div className="p-2 rounded-lg bg-muted/40 border border-border/60 text-center">
              <p className="text-[10px] text-muted-foreground uppercase font-medium">Delivered</p>
              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                {totalReceivedUnits} units
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Slips List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {slips.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Receipt className="h-8 w-8 text-muted-foreground mx-auto" />
              <p className="text-sm font-semibold text-foreground">No Restock Slips Found</p>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                Orders created for {product.name} via WhatsApp or Clipboard will be recorded here forever.
              </p>
            </div>
          ) : (
            slips.map(({ item, order }) => {
              if (!order) return null;
              const isPending = item.status === "pending";
              const isReceived = item.status === "received";
              const isCancelled = item.status === "cancelled";

              const orderDate = new Date(order.order_date).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-xl border transition-all space-y-2.5 ${
                    isPending
                      ? "border-amber-500/40 bg-amber-500/5 shadow-xs"
                      : "border-border bg-card"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-foreground">
                        {order.order_number}
                      </span>
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        {order.channel === "whatsapp" ? (
                          <span className="inline-flex items-center gap-1 text-[#25D366] font-medium">
                            <MessageSquare className="h-3 w-3" />
                            WhatsApp
                          </span>
                        ) : order.channel === "copy_clipboard" ? (
                          <span className="inline-flex items-center gap-1 text-blue-500 font-medium">
                            <Clipboard className="h-3 w-3" />
                            Clipboard
                          </span>
                        ) : (
                          <span>Manual</span>
                        )}
                      </div>
                    </div>

                    <div>
                      {isPending && (
                        <Badge
                          variant="outline"
                          className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 gap-1 text-[11px]"
                        >
                          <Clock className="h-3 w-3" />
                          Pending Delivery
                        </Badge>
                      )}
                      {isReceived && (
                        <Badge
                          variant="outline"
                          className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 gap-1 text-[11px]"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          Delivered
                        </Badge>
                      )}
                      {isCancelled && (
                        <Badge variant="secondary" className="gap-1 text-[11px]">
                          <XCircle className="h-3 w-3" />
                          Cancelled
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1 border-t border-border/50">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                        <Calendar className="h-3 w-3" />
                        <span>{orderDate}</span>
                        {order.distributor_name && (
                          <span>• Supplier: {order.distributor_name}</span>
                        )}
                      </div>
                      <p className="font-medium text-foreground">
                        Ordered: <strong>{item.ordered_quantity} units</strong>
                        {isReceived && (
                          <span className="text-emerald-600 dark:text-emerald-400 ml-2">
                            (Received: {item.received_quantity ?? item.ordered_quantity} units)
                          </span>
                        )}
                      </p>
                    </div>

                    {isPending && (
                      <Button
                        type="button"
                        size="xs"
                        onClick={() => handleOpenArrival(item, order)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs gap-1.5 h-7 shadow-xs cursor-pointer"
                      >
                        <PackageCheck className="h-3.5 w-3.5" />
                        <span>Record Arrival</span>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {pendingCount > 0 ? `⚠️ ${pendingCount} order pending delivery` : "All orders delivered"}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={closeItemSlipsModal}
            className="text-xs"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
