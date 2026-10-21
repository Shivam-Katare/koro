"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
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
import type { Product, RestockOrder, RestockOrderItemRow } from "@/lib/supabase/types";
import {
  Search,
  Receipt,
  MessageSquare,
  Clipboard,
  Calendar,
  Clock,
  CheckCircle2,
  PackageCheck,
  RotateCcw,
  Trash2,
  XCircle,
  PlusCircle,
  Filter,
  Truck,
  ArrowUpDown,
  Building2,
} from "lucide-react";
import toast from "react-hot-toast";

interface RestockHistoryViewProps {
  products: Product[];
  orders: RestockOrder[];
  items: RestockOrderItemRow[];
}

export function RestockHistoryView({
  products,
  orders,
  items,
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

  // Delete modal state
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
    const receivedOrders = orders.filter((o) => o.status === "received").length;
    const totalUnitsOrdered = items.reduce(
      (sum, it) => sum + (Number(it.ordered_quantity) || 0),
      0
    );
    const totalUnitsReceived = items.reduce(
      (sum, it) => sum + (Number(it.received_quantity) || 0),
      0
    );

    return {
      totalOrders,
      pendingOrders,
      receivedOrders,
      totalUnitsOrdered,
      totalUnitsReceived,
    };
  }, [orders, items]);

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const orderItems = itemsByOrder.get(order.id) || [];

      // Product filter
      if (filterProductId !== "all") {
        const hasProduct = orderItems.some((it) => it.product_id === filterProductId);
        if (!hasProduct) return false;
      }

      // Status filter
      if (filterStatus !== "all" && order.status !== filterStatus) {
        return false;
      }

      // Channel filter
      if (filterChannel !== "all" && order.channel !== filterChannel) {
        return false;
      }

      // Search query
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

  const handleRecordItemArrival = (
    item: RestockOrderItemRow,
    order: RestockOrder
  ) => {
    const product = productsMap.get(item.product_id) || {
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
    router.refresh();
  };

  const handleQuickReorder = (productId: string) => {
    const prod = productsMap.get(productId);
    if (prod) {
      toggleProduct(prod);
      setActiveSubTab("draft");
      toast.success(`Added ${prod.name} to Reorder Draft`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top History KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border-border bg-card shadow-2xs p-3.5 sm:p-4">
          <p className="text-[11px] font-medium text-muted-foreground uppercase">
            Total Slips
          </p>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xl sm:text-2xl font-bold font-heading text-foreground">
              {stats.totalOrders}
            </span>
            <Receipt className="h-5 w-5 text-primary opacity-80" />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">Permanent accounting record</p>
        </Card>

        <Card className="border-border bg-card shadow-2xs p-3.5 sm:p-4">
          <p className="text-[11px] font-medium text-muted-foreground uppercase">
            Pending Delivery
          </p>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xl sm:text-2xl font-bold font-heading text-amber-600 dark:text-amber-400">
              {stats.pendingOrders}
            </span>
            <Clock className="h-5 w-5 text-amber-500 opacity-80" />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">Awaiting shop delivery</p>
        </Card>

        <Card className="border-border bg-card shadow-2xs p-3.5 sm:p-4">
          <p className="text-[11px] font-medium text-muted-foreground uppercase">
            Units Delivered
          </p>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xl sm:text-2xl font-bold font-heading text-emerald-600 dark:text-emerald-400">
              {stats.totalUnitsReceived}
            </span>
            <PackageCheck className="h-5 w-5 text-emerald-500 opacity-80" />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">Added to shop stock</p>
        </Card>

        <Card className="border-border bg-card shadow-2xs p-3.5 sm:p-4">
          <p className="text-[11px] font-medium text-muted-foreground uppercase">
            Units Ordered
          </p>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xl sm:text-2xl font-bold font-heading text-foreground">
              {stats.totalUnitsOrdered}
            </span>
            <Truck className="h-5 w-5 text-primary opacity-80" />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">Total across all orders</p>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl border border-border bg-card space-y-3 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search slip #, product name, or supplier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter by Product Dropdown */}
            <select
              value={filterProductId}
              onChange={(e) => setFilterProductId(e.target.value)}
              className="h-9 px-2.5 rounded-md border border-border bg-background text-xs font-medium text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
            >
              <option value="all">All Products ({products.length})</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            {/* Filter by Status */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="h-9 px-2.5 rounded-md border border-border bg-background text-xs font-medium text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
            >
              <option value="all">All Statuses</option>
              <option value="ordered">Pending Delivery</option>
              <option value="received">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>

            {/* Filter by Channel */}
            <select
              value={filterChannel}
              onChange={(e) => setFilterChannel(e.target.value as any)}
              className="h-9 px-2.5 rounded-md border border-border bg-background text-xs font-medium text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
            >
              <option value="all">All Channels</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="copy_clipboard">Clipboard</option>
              <option value="manual">Manual</option>
            </select>

            {(filterProductId !== "all" ||
              filterStatus !== "all" ||
              filterChannel !== "all" ||
              searchQuery.trim() !== "") && (
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => {
                  setFilterProductId("all");
                  setFilterStatus("all");
                  setFilterChannel("all");
                  setSearchQuery("");
                }}
                className="h-9 text-xs gap-1 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset</span>
              </Button>
            )}
          </div>
        </div>

        {filterProductId !== "all" && (
          <div className="pt-2 border-t border-border/50 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              Showing order slips for:{" "}
              <strong className="text-foreground">
                {productsMap.get(filterProductId)?.name || "Product"}
              </strong>
            </span>
            <Button
              type="button"
              variant="link"
              size="xs"
              onClick={() => handleQuickReorder(filterProductId)}
              className="h-auto p-0 text-primary font-semibold text-xs gap-1 cursor-pointer"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>Add to Reorder Draft</span>
            </Button>
          </div>
        )}
      </div>

      {/* Order Slips List */}
      {filteredOrders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center space-y-3 bg-card">
          <Receipt className="h-10 w-10 text-muted-foreground mx-auto" />
          <p className="text-base font-semibold text-foreground">
            No Restock Slips Found
          </p>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {orders.length === 0
              ? "You haven't created any restock orders yet. Prepare a draft on the 'Reorder Draft' tab and click Share on WhatsApp or Copy & Clear."
              : "No orders match your selected filters. Try adjusting the search keywords or filters."}
          </p>
          {orders.length === 0 && (
            <Button
              type="button"
              size="sm"
              onClick={() => setActiveSubTab("draft")}
              className="mt-2 text-xs font-semibold cursor-pointer"
            >
              Go to Reorder Draft
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const orderItems = itemsByOrder.get(order.id) || [];
            const isPending = order.status === "ordered";
            const isReceived = order.status === "received";
            const isCancelled = order.status === "cancelled";

            const orderDate = new Date(order.order_date).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <Card
                key={order.id}
                className={`border transition-all overflow-hidden shadow-2xs ${
                  isPending
                    ? "border-amber-500/40 bg-card"
                    : "border-border bg-card"
                }`}
              >
                {/* Slip Header */}
                <CardHeader className="p-4 border-b border-border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono font-bold text-sm text-foreground">
                      {order.order_number}
                    </span>

                    <Badge
                      variant="outline"
                      className="text-[11px] gap-1 font-medium bg-background"
                    >
                      {order.channel === "whatsapp" ? (
                        <>
                          <MessageSquare className="h-3 w-3 text-[#25D366]" />
                          <span className="text-[#25D366]">WhatsApp</span>
                        </>
                      ) : order.channel === "copy_clipboard" ? (
                        <>
                          <Clipboard className="h-3 w-3 text-blue-500" />
                          <span className="text-blue-500">Clipboard</span>
                        </>
                      ) : (
                        <span>Manual</span>
                      )}
                    </Badge>

                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{orderDate}</span>
                    </div>

                    {order.distributor_name && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1 bg-muted/60 px-2 py-0.5 rounded-md">
                        <Building2 className="h-3 w-3 text-primary" />
                        <span>Supplier: {order.distributor_name}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isPending && (
                      <Badge
                        variant="outline"
                        className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 gap-1 text-xs"
                      >
                        <Clock className="h-3 w-3" />
                        Pending Delivery
                      </Badge>
                    )}
                    {isReceived && (
                      <Badge
                        variant="outline"
                        className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 gap-1 text-xs"
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        Delivered
                      </Badge>
                    )}
                    {isCancelled && (
                      <Badge variant="secondary" className="gap-1 text-xs">
                        <XCircle className="h-3 w-3" />
                        Cancelled
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                {/* Items in Slip */}
                <CardContent className="p-4 space-y-2.5">
                  <div className="space-y-2">
                    {orderItems.map((item) => {
                      const itemIsPending = item.status === "pending";
                      const itemIsReceived = item.status === "received";
                      const prod = productsMap.get(item.product_id);

                      return (
                        <div
                          key={item.id}
                          className="p-3 rounded-lg border border-border/80 bg-muted/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs"
                        >
                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-foreground text-sm truncate">
                                {item.product_name}
                              </span>
                              {prod?.category && (
                                <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                                  {prod.category}
                                </Badge>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-3 text-muted-foreground text-[11px]">
                              <span>
                                Ordered:{" "}
                                <strong className="text-foreground">
                                  {item.ordered_quantity} units
                                </strong>
                              </span>
                              {itemIsReceived && (
                                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                                  • Received: {item.received_quantity ?? item.ordered_quantity} units
                                </span>
                              )}
                              {prod && (
                                <span>• Current Stock in Shop: {prod.current_stock}</span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {itemIsPending ? (
                              <Button
                                type="button"
                                size="xs"
                                onClick={() => handleRecordItemArrival(item, order)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs gap-1.5 h-7 shadow-xs cursor-pointer"
                              >
                                <PackageCheck className="h-3.5 w-3.5" />
                                <span>Record Arrival</span>
                              </Button>
                            ) : (
                              <Badge
                                variant="outline"
                                className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[11px] gap-1"
                              >
                                <CheckCircle2 className="h-3 w-3" />
                                Received
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {order.notes && (
                    <div className="p-2.5 rounded-md bg-muted/30 border border-border/50 text-xs text-muted-foreground">
                      <strong>Order Note:</strong> {order.notes}
                    </div>
                  )}
                </CardContent>

                {/* Slip Actions Footer */}
                <CardFooter className="px-4 py-2.5 border-t border-border bg-muted/10 flex items-center justify-between text-xs">
                  <div className="text-[11px] text-muted-foreground">
                    {orderItems.length} product{orderItems.length > 1 ? "s" : ""} •{" "}
                    {order.total_units} units total
                  </div>

                  <div className="flex items-center gap-2">
                    {isPending && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        onClick={() => handleCancelOrder(order.id)}
                        className="text-[11px] text-muted-foreground hover:text-amber-600 cursor-pointer"
                      >
                        Cancel Order
                      </Button>
                    )}

                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      onClick={() => setOrderToDelete(order)}
                      className="text-[11px] text-muted-foreground hover:text-destructive cursor-pointer gap-1"
                      title="Delete slip if entered by mistake"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Delete</span>
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={Boolean(orderToDelete)} onOpenChange={(open) => !open && setOrderToDelete(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              <span>Delete Restock Slip?</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Order slip <strong>#{orderToDelete?.order_number}</strong> will be permanently removed from your history. Normally slips should be kept for accounting history.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOrderToDelete(null)}
              disabled={isDeleting}
            >
              Keep Slip
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDeleteOrder}
              disabled={isDeleting}
              className="gap-1.5"
            >
              {isDeleting ? "Deleting..." : "Yes, Delete Slip"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
