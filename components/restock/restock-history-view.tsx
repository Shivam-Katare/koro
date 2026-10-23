"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useRestockStore } from "@/lib/store/use-restock-store";
import {
  cancelRestockOrderAction,
  deleteRestockOrderAction,
} from "@/lib/actions/restock-actions";
import { buildWhatsAppRestockMessage } from "@/lib/utils/restock-formatters";
import { KoroGlyph, KoroFace } from "@/components/brand/koro-face";
import { ReceiptPaper, ReceiptDivider } from "./receipt-paper";
import type { Product, RestockOrder, RestockOrderItemRow } from "@/lib/supabase/types";
import {
  Search,
  ChevronRight,
  MessageSquareShare,
  PackageCheck,
  CheckCircle2,
  RotateCcw,
  Trash2,
  Plus,
  Ban,
} from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

interface RestockHistoryViewProps {
  products: Product[];
  orders: RestockOrder[];
  items: RestockOrderItemRow[];
  shopName?: string | null;
}

const CHANNEL_LABEL: Record<string, string> = {
  whatsapp: "WhatsApp",
  copy_clipboard: "Copied to clipboard",
  manual: "Manual",
};

export function RestockHistoryView({
  products,
  orders,
  items,
  shopName,
}: RestockHistoryViewProps) {
  const router = useRouter();
  const openItemArrivalModal = useRestockStore((s) => s.openItemArrivalModal);
  const setActiveSubTab = useRestockStore((s) => s.setActiveSubTab);
  const toggleProduct = useRestockStore((s) => s.toggleProduct);

  const filterProductId = useRestockStore((s) => s.historyFilterProductId);
  const setFilterProductId = useRestockStore((s) => s.setHistoryFilterProductId);
  const filterStatus = useRestockStore((s) => s.historyFilterStatus);
  const setFilterStatus = useRestockStore((s) => s.setHistoryFilterStatus);
  const filterChannel = useRestockStore((s) => s.historyFilterChannel);
  const setFilterChannel = useRestockStore((s) => s.setHistoryFilterChannel);
  const searchQuery = useRestockStore((s) => s.historySearchQuery);
  const setSearchQuery = useRestockStore((s) => s.setHistorySearchQuery);

  // Receipt (open slip) and delete modal state
  const [openOrderId, setOpenOrderId] = useState<string | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<RestockOrder | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Map products by ID
  const productsMap = useMemo(() => {
    const map = new Map<string, Product>();
    products.forEach((p) => map.set(p.id, p));
    return map;
  }, [products]);

  // Group items by order_id
  const itemsByOrder = useMemo(() => {
    const map = new Map<string, RestockOrderItemRow[]>();
    for (const item of items) {
      const list = map.get(item.order_id) || [];
      list.push(item);
      map.set(item.order_id, list);
    }
    return map;
  }, [items]);

  // Overall statistics
  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const pendingOrders = orders.filter((o) => o.status === "ordered").length;
    const totalUnitsReceived = items.reduce(
      (sum, it) => sum + (Number(it.received_quantity) || 0),
      0
    );
    return { totalOrders, pendingOrders, totalUnitsReceived };
  }, [orders, items]);

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const orderItems = itemsByOrder.get(order.id) || [];

      if (filterProductId !== "all") {
        const hasProduct = orderItems.some((it) => it.product_id === filterProductId);
        if (!hasProduct) return false;
      }

      if (filterStatus !== "all" && order.status !== filterStatus) {
        return false;
      }

      if (filterChannel !== "all" && order.channel !== filterChannel) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesOrderNumber = order.order_number.toLowerCase().includes(q);
        const matchesSupplier =
          order.distributor_name && order.distributor_name.toLowerCase().includes(q);
        const matchesNotes = order.notes && order.notes.toLowerCase().includes(q);
        const matchesItems = orderItems.some((it) =>
          it.product_name.toLowerCase().includes(q)
        );

        if (!matchesOrderNumber && !matchesSupplier && !matchesNotes && !matchesItems) {
          return false;
        }
      }

      return true;
    });
  }, [
    orders,
    itemsByOrder,
    filterProductId,
    filterStatus,
    filterChannel,
    searchQuery,
  ]);

  const resolveProduct = (item: RestockOrderItemRow, order: RestockOrder): Product =>
    productsMap.get(item.product_id) || {
      id: item.product_id,
      name: item.product_name,
      current_stock: 0,
      min_stock_threshold: 5,
      category: "General",
      brand: null,
      barcode: null,
      selling_price: null,
      cost_price: null,
      storage_location: null,
      stock_status: "low_stock",
      attributes: {},
      description: null,
      shop_id: order.shop_id,
      created_at: item.created_at,
      updated_at: item.created_at,
    };

  const handleRecordItemArrival = (
    item: RestockOrderItemRow,
    order: RestockOrder
  ) => {
    const product = resolveProduct(item, order);

    // Close the receipt first so the arrival dialog is the only one open
    setOpenOrderId(null);

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

  // Re-send an existing slip on WhatsApp (does not create a new slip)
  const handleShareSlip = (order: RestockOrder) => {
    const orderItems = itemsByOrder.get(order.id) || [];
    const message = buildWhatsAppRestockMessage({
      shopName: shopName || "My Store",
      items: orderItems.map((it) => ({
        product: resolveProduct(it, order),
        quantity: Number(it.ordered_quantity) || 1,
      })),
      distributorName: order.distributor_name || undefined,
      notes: order.notes || undefined,
    });
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm("Are you sure you want to mark this order as cancelled?")) return;
    const res = await cancelRestockOrderAction({ orderId });
    if (!res.success) {
      toast.error(res.error || "Failed to cancel order");
      return;
    }
    toast.success("Order marked as cancelled");
    router.refresh();
  };

  const handleDeleteOrder = async () => {
    if (!orderToDelete) return;
    setIsDeleting(true);
    const res = await deleteRestockOrderAction({ orderId: orderToDelete.id });
    setIsDeleting(false);

    if (!res.success) {
      toast.error(res.error || "Failed to delete order slip");
      return;
    }

    toast.success(`Order slip #${orderToDelete.order_number} deleted`);
    setOrderToDelete(null);
    setOpenOrderId(null);
    router.refresh();
  };

  const handleQuickReorder = (productId: string) => {
    const prod = productsMap.get(productId);
    if (prod) {
      toggleProduct(prod);
      setActiveSubTab("draft");
      toast.success(`Added ${prod.name} to your new order`);
    }
  };

  const formatDate = (iso: string, withTime = false) =>
    new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
    });

  const statusMeta = (status: string) =>
    status === "ordered"
      ? { text: "Waiting for delivery", cls: "bg-[#fff1cc] text-amber-800 dark:bg-[#3a2f12] dark:text-amber-300" }
      : status === "received"
      ? { text: "Delivered", cls: "bg-[#e8f7ee] text-[#0f7a39] dark:bg-[#1c2b22] dark:text-[#5fd68c]" }
      : { text: "Cancelled", cls: "bg-muted text-muted-foreground" };

  const segment = (active: boolean) =>
    cn(
      "h-8 sm:h-8.5 cursor-pointer rounded-full px-3 sm:px-3.5 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap",
      active ? "bg-card text-foreground shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground"
    );

  const openOrder = openOrderId ? orders.find((o) => o.id === openOrderId) || null : null;
  const openOrderItems = openOrder ? itemsByOrder.get(openOrder.id) || [] : [];
  const hasActiveFilter =
    filterProductId !== "all" || filterStatus !== "all" || filterChannel !== "all" || searchQuery.trim() !== "";

  const statCards = [
    {
      label: "Waiting for delivery",
      value: stats.pendingOrders,
      glyph: "truck" as const,
      surface: "bg-[#ffb110] text-black",
    },
    {
      label: "Units delivered",
      value: stats.totalUnitsReceived,
      glyph: "check-circle" as const,
      surface: "bg-[#e8f7ee] dark:bg-[#1c2b22]",
    },
    {
      label: "Total slips",
      value: stats.totalOrders,
      glyph: "package" as const,
      surface: "bg-[#e6f3fe] dark:bg-[#243442]",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {statCards.map((card) => (
          <div
            key={card.label}
            className={`flex items-center justify-between gap-4 rounded-3xl p-5 sm:p-6 ${card.surface}`}
          >
            <div>
              <p className="text-base font-semibold">{card.label}</p>
              <p className="mt-2 font-heading text-5xl leading-none font-bold tracking-tight tabular-nums">
                {card.value}
              </p>
            </div>
            <KoroGlyph type={card.glyph} size={56} className="shrink-0" />
          </div>
        ))}
      </div>

      {/* Search and status filter */}
      <section aria-labelledby="restock-slips" className="space-y-4">
        <h2 id="restock-slips" className="font-heading text-2xl font-bold tracking-tight text-foreground">
          Your slips
        </h2>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Search by slip number, item or supplier"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search slips"
            className="h-12 w-full rounded-full border border-input bg-card pr-4 pl-12 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3">
          <div className="no-scrollbar flex max-w-full items-center gap-0.5 overflow-x-auto rounded-full bg-muted p-1">
            {(
              [
                ["all", "All"],
                ["ordered", "Waiting"],
                ["received", "Delivered"],
                ["cancelled", "Cancelled"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilterStatus(value)}
                className={segment(filterStatus === value)}
              >
                {label}
              </button>
            ))}
          </div>

          {hasActiveFilter && (
            <button
              type="button"
              onClick={() => {
                setFilterProductId("all");
                setFilterStatus("all");
                setFilterChannel("all");
                setSearchQuery("");
              }}
              className="inline-flex h-8 sm:h-8.5 shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-3 text-xs sm:text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {filterProductId !== "all" && (
          <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-2xl bg-secondary px-4 py-2.5">
            <span className="text-sm sm:text-base text-foreground">
              Slips for <strong>{productsMap.get(filterProductId)?.name || "this item"}</strong>
            </span>
            <button
              type="button"
              onClick={() => handleQuickReorder(filterProductId)}
              className="inline-flex h-8 sm:h-8.5 cursor-pointer items-center gap-1.5 rounded-full bg-primary px-3 text-xs sm:text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 shadow-xs"
            >
              <Plus className="h-4 w-4" />
              <span>Add to new order</span>
            </button>
          </div>
        )}

        {/* Slip list */}
        {filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-border bg-card p-10 text-center">
            <KoroFace size={64} tone="sky" />
            <div className="space-y-1">
              <p className="text-xl font-semibold text-foreground">No slips found</p>
              <p className="mx-auto max-w-sm text-base text-muted-foreground">
                {orders.length === 0
                  ? "When you share or copy an order, its slip will be saved here."
                  : "No slips match your search. Try a different word or reset."}
              </p>
            </div>
            {orders.length === 0 && (
              <button
                type="button"
                onClick={() => setActiveSubTab("draft")}
                className="inline-flex h-12 cursor-pointer items-center gap-2 rounded-full bg-primary px-6 text-base font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                Start a new order
              </button>
            )}
          </div>
        ) : (
          <ul className="space-y-3">
            {filteredOrders.map((order) => {
              const orderItems = itemsByOrder.get(order.id) || [];
              const status = statusMeta(order.status);
              const glyph =
                order.status === "ordered" ? "truck" : order.status === "received" ? "check-circle" : "calendar";
              const tile =
                order.status === "ordered"
                  ? "bg-[#fff1cc] dark:bg-[#3a2f12]"
                  : order.status === "received"
                  ? "bg-[#e8f7ee] dark:bg-[#1c2b22]"
                  : "bg-muted";

              return (
                <li key={order.id}>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setOpenOrderId(order.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setOpenOrderId(order.id);
                      }
                    }}
                    className="group flex cursor-pointer items-center gap-4 rounded-3xl border border-border bg-card p-4 transition-colors hover:border-primary/40 sm:p-5"
                  >
                    <span className={cn("flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl", tile)}>
                      <KoroGlyph type={glyph} size={44} />
                    </span>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <p className="text-lg font-semibold text-foreground">Slip {order.order_number}</p>
                        <span className={cn("rounded-full px-3 py-0.5 text-sm font-semibold", status.cls)}>
                          {status.text}
                        </span>
                      </div>
                      <p className="text-base text-muted-foreground">
                        {formatDate(order.order_date)}
                        {order.distributor_name ? `, ${order.distributor_name}` : ""}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {orderItems.length} item{orderItems.length === 1 ? "" : "s"}, {order.total_units} units
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShareSlip(order);
                      }}
                      title="Send this slip on WhatsApp"
                      aria-label={`Send slip ${order.order_number} on WhatsApp`}
                      className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#25D366] text-white transition-opacity hover:opacity-90"
                    >
                      <MessageSquareShare className="h-5 w-5" />
                    </button>

                    <ChevronRight className="hidden h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 sm:block" />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Receipt: an open slip, like a paper bill */}
      <Dialog open={Boolean(openOrder)} onOpenChange={(open) => !open && setOpenOrderId(null)}>
        <DialogContent className="max-w-md border-0 bg-transparent p-0 shadow-none">
          {openOrder && (
            <ReceiptPaper>
              <DialogHeader className="sr-only">
                <DialogTitle>Slip {openOrder.order_number}</DialogTitle>
                <DialogDescription>Restock slip details</DialogDescription>
              </DialogHeader>

              {/* Header */}
              <div className="flex flex-col items-center gap-2 px-6 pt-8 pb-6 text-center">
                <KoroGlyph
                  type={
                    openOrder.status === "ordered"
                      ? "truck"
                      : openOrder.status === "received"
                      ? "check-circle"
                      : "calendar"
                  }
                  size={56}
                />
                <p className="text-base text-muted-foreground">Restock slip</p>
                <p className="font-heading text-2xl font-bold tracking-tight text-foreground">
                  {openOrder.order_number}
                </p>
                <span
                  className={cn(
                    "rounded-full px-3 py-0.5 text-sm font-semibold",
                    statusMeta(openOrder.status).cls
                  )}
                >
                  {statusMeta(openOrder.status).text}
                </span>
              </div>

              <ReceiptDivider />

              {/* Details */}
              <dl className="space-y-3 px-6 py-5 text-base">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Date</dt>
                  <dd className="text-right font-medium text-foreground">{formatDate(openOrder.order_date, true)}</dd>
                </div>
                {openOrder.distributor_name && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Supplier</dt>
                    <dd className="text-right font-medium text-foreground">{openOrder.distributor_name}</dd>
                  </div>
                )}
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Sent by</dt>
                  <dd className="text-right font-medium text-foreground">
                    {CHANNEL_LABEL[openOrder.channel] || "Manual"}
                  </dd>
                </div>
              </dl>

              <ReceiptDivider />

              {/* Items */}
              <ul className="no-scrollbar max-h-72 space-y-1 overflow-y-auto px-4 py-4">
                {openOrderItems.map((item) => {
                  const itemIsPending = item.status === "pending";
                  return (
                    <li key={item.id} className="flex items-center justify-between gap-3 rounded-2xl px-2 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-base font-semibold text-foreground">{item.product_name}</p>
                        <p className="text-sm text-muted-foreground">
                          Ordered {item.ordered_quantity}
                          {!itemIsPending && ` , received ${item.received_quantity ?? item.ordered_quantity}`}
                        </p>
                      </div>

                      {itemIsPending && openOrder.status !== "cancelled" ? (
                        <button
                          type="button"
                          onClick={() => handleRecordItemArrival(item, openOrder)}
                          className="inline-flex h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-full bg-[#14a44d] px-4 text-base font-semibold text-white transition-opacity hover:opacity-90 active:scale-95"
                        >
                          <PackageCheck className="h-5 w-5" />
                          <span>Received</span>
                        </button>
                      ) : !itemIsPending ? (
                        <span className="inline-flex shrink-0 items-center gap-1.5 text-base font-medium text-[#14a44d]">
                          <CheckCircle2 className="h-5 w-5" />
                          Received
                        </span>
                      ) : null}
                    </li>
                  );
                })}
              </ul>

              <ReceiptDivider />

              {/* Total */}
              <div className="space-y-3 px-6 py-5">
                <div className="flex items-baseline justify-between">
                  <span className="text-base text-muted-foreground">
                    Total, {openOrderItems.length} item{openOrderItems.length === 1 ? "" : "s"}
                  </span>
                  <span className="font-heading text-2xl font-bold tabular-nums text-foreground">
                    {openOrder.total_units} units
                  </span>
                </div>
                {openOrder.notes && (
                  <p className="rounded-2xl bg-muted px-4 py-3 text-base text-muted-foreground">
                    Note: {openOrder.notes}
                  </p>
                )}
              </div>

              <ReceiptDivider />

              {/* Actions */}
              <div className="space-y-2 p-5">
                <button
                  type="button"
                  onClick={() => handleShareSlip(openOrder)}
                  className="inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[#25D366] text-base font-bold text-white transition-opacity hover:opacity-90"
                >
                  <MessageSquareShare className="h-5 w-5" />
                  <span>Send on WhatsApp</span>
                </button>

                <div className="flex items-center justify-center gap-1">
                  {openOrder.status === "ordered" && (
                    <button
                      type="button"
                      onClick={() => handleCancelOrder(openOrder.id)}
                      className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full px-4 text-base font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <Ban className="h-4 w-4" />
                      <span>Cancel order</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setOrderToDelete(openOrder)}
                    title="Delete slip if entered by mistake"
                    className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full px-4 text-base font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </ReceiptPaper>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={Boolean(orderToDelete)} onOpenChange={(open) => !open && setOrderToDelete(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              <span>Delete this slip?</span>
            </DialogTitle>
            <DialogDescription className="text-base">
              Slip <strong>#{orderToDelete?.order_number}</strong> will be removed from your history for good.
              Normally slips are kept for your records.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOrderToDelete(null)}
              disabled={isDeleting}
              className="h-11 cursor-pointer rounded-full px-5 text-base"
            >
              Keep slip
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteOrder}
              disabled={isDeleting}
              className="h-11 cursor-pointer gap-1.5 rounded-full px-5 text-base"
            >
              {isDeleting ? "Deleting..." : "Yes, delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
