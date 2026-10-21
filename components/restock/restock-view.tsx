"use client";

import { useState, useEffect } from "react";
import type { Shop, Product, RestockOrder, RestockOrderItemRow } from "@/lib/supabase/types";
import { useRestockStore } from "@/lib/store/use-restock-store";
import { RestockStats } from "./restock-stats";
import { RestockProductList } from "./restock-product-list";
import { RestockPurchaseList } from "./restock-purchase-list";
import { RestockHistoryView } from "./restock-history-view";
import { RestockArrivalDialog } from "./restock-arrival-dialog";
import { RestockItemArrivalDialog } from "./restock-item-arrival-dialog";
import { RestockItemSlipsDialog } from "./restock-item-slips-dialog";
import { ShoppingCart, Receipt, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface RestockViewProps {
  shop: Shop | null;
  products: Product[];
  initialOrders?: RestockOrder[];
  initialItems?: RestockOrderItemRow[];
}

export function RestockView({
  shop,
  products,
  initialOrders = [],
  initialItems = [],
}: RestockViewProps) {
  const [orders, setOrders] = useState<RestockOrder[]>(initialOrders);
  const [items, setItems] = useState<RestockOrderItemRow[]>(initialItems);

  const activeSubTab = useRestockStore((s) => s.activeSubTab);
  const setActiveSubTab = useRestockStore((s) => s.setActiveSubTab);

  useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const pendingOrdersCount = orders.filter((o) => o.status === "ordered").length;

  return (
    <div className="space-y-6">
      {/* Header with Sub-tab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="font-heading text-2xl font-bold text-foreground">
            Restock Management
          </h2>
          <p className="text-xs text-muted-foreground">
            Prepare purchase orders, share via WhatsApp, track slips per product, and record stock arrival.
          </p>
        </div>

        {/* Sub-tab Pill Navigation */}
        <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-border text-xs shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveSubTab("draft")}
            className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === "draft"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ShoppingCart className="h-4 w-4 text-primary" />
            <span>Reorder Draft</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("history")}
            className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === "history"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Receipt className="h-4 w-4 text-primary" />
            <span>Restock Slips &amp; History</span>
            {pendingOrdersCount > 0 && (
              <Badge
                variant="outline"
                className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 text-[10px] py-0 px-1.5 font-bold gap-0.5"
              >
                <Clock className="h-2.5 w-2.5" />
                {pendingOrdersCount}
              </Badge>
            )}
          </button>
        </div>
      </div>

      {activeSubTab === "draft" ? (
        <>
          {/* Summary KPI Cards */}
          <RestockStats products={products} />

          {/* 2-Column Responsive Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Product Selector with Attached Slips & Arrival Button */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-4">
              <div className="space-y-1">
                <h3 className="font-heading font-semibold text-sm text-foreground">
                  Inventory Status &amp; Reorder Selection
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Items are filtered based on stock threshold. When orders are placed, slips and Record Arrival buttons stay attached to each row.
                </p>
              </div>
              <RestockProductList products={products} orders={orders} items={items} />
            </div>

            {/* Right: Live Purchase Order Draft */}
            <div className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-20 space-y-4">
              <div className="space-y-1">
                <h3 className="font-heading font-semibold text-sm text-foreground">
                  Active Purchase Order
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Review quantities, share on WhatsApp, or copy. Order slips are automatically created and tracked.
                </p>
              </div>
              <RestockPurchaseList shop={shop} />
            </div>
          </div>
        </>
      ) : (
        /* Full Restock History View */
        <RestockHistoryView products={products} orders={orders} items={items} />
      )}

      {/* Bulk Stock Arrival Dialog (from draft) */}
      <RestockArrivalDialog />

      {/* Individual Item Stock Arrival Dialog (attached to product row & slip) */}
      <RestockItemArrivalDialog />

      {/* Item Restock Slips History Dialog */}
      <RestockItemSlipsDialog orders={orders} items={items} />
    </div>
  );
}
