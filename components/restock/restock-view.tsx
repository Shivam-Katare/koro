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
import { cn } from "@/lib/utils";

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
  const [allProducts, setAllProducts] = useState<Product[]>(products);
  const [orders, setOrders] = useState<RestockOrder[]>(initialOrders);
  const [items, setItems] = useState<RestockOrderItemRow[]>(initialItems);

  const activeSubTab = useRestockStore((s) => s.activeSubTab);
  const setActiveSubTab = useRestockStore((s) => s.setActiveSubTab);

  useEffect(() => {
    setAllProducts(products);
  }, [products]);

  useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const handleProductAdded = (newProduct: Product) => {
    setAllProducts((prev) => {
      if (prev.some((p) => p.id === newProduct.id)) return prev;
      return [newProduct, ...prev];
    });
  };

  const pendingOrdersCount = orders.filter((o) => o.status === "ordered").length;

  const tabClass = (active: boolean) =>
    cn(
      "inline-flex h-9 sm:h-10 cursor-pointer items-center gap-1.5 sm:gap-2 rounded-full px-3.5 sm:px-4.5 text-xs sm:text-sm font-semibold transition-colors",
      active ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
    );

  return (
    <div className="space-y-8">
      {/* Title and the two views */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="space-y-1.5">
          <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Restock</h1>
          <p className="text-base text-muted-foreground sm:text-lg">
            Pick what to reorder, send it to your supplier, then mark it received.
          </p>
        </div>

        <div className="flex shrink-0 items-center self-start rounded-full bg-muted p-1 sm:self-auto">
          <button type="button" onClick={() => setActiveSubTab("draft")} className={tabClass(activeSubTab === "draft")}>
            New order
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab("history")}
            className={tabClass(activeSubTab === "history")}
          >
            <span>Past orders</span>
            {pendingOrdersCount > 0 && (
              <span className="rounded-full bg-[#ffb110] px-2 py-0.5 text-sm font-bold text-black tabular-nums">
                {pendingOrdersCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeSubTab === "draft" ? (
        <>
          {/* Summary KPI Cards */}
          <RestockStats products={allProducts} />

          {/* Workspace: items on the left, receipt on the right */}
          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
            <section aria-labelledby="restock-items" className="space-y-4 lg:col-span-7 xl:col-span-8">
              <h2 id="restock-items" className="font-heading text-2xl font-bold tracking-tight text-foreground">
                Your items
              </h2>
              <RestockProductList
                products={allProducts}
                orders={orders}
                items={items}
                shopId={shop?.id || null}
                shopCategory={shop?.category}
                onProductAdded={handleProductAdded}
              />
            </section>

            <section
              aria-labelledby="restock-order"
              className="space-y-4 lg:sticky lg:top-24 lg:col-span-5 xl:col-span-4"
            >
              <h2 id="restock-order" className="font-heading text-2xl font-bold tracking-tight text-foreground">
                Order slip
              </h2>
              <RestockPurchaseList shop={shop} onProductAdded={handleProductAdded} />
            </section>
          </div>
        </>
      ) : (
        /* Past orders as receipts */
        <RestockHistoryView
          products={allProducts}
          orders={orders}
          items={items}
          shopName={shop?.name}
        />
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
