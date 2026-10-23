"use client";

import { useState, useMemo } from "react";
import { Search, Plus, ListPlus, PackageSearch } from "lucide-react";
import { KoroFace } from "@/components/brand/koro-face";
import type { Product, RestockOrder, RestockOrderItemRow } from "@/lib/supabase/types";
import { useRestockStore } from "@/lib/store/use-restock-store";
import { isProductDepleted } from "@/lib/utils/restock-formatters";
import { RestockProductItem, type PendingSlipItem } from "./restock-product-item";
import { RestockAddTrendingDialog } from "./restock-add-trending-dialog";
import { cn } from "@/lib/utils";

interface RestockProductListProps {
  products: Product[];
  orders?: RestockOrder[];
  items?: RestockOrderItemRow[];
  shopId?: string | null;
  shopCategory?: string | null;
  onProductAdded?: (product: Product) => void;
}

export function RestockProductList({
  products,
  orders = [],
  items = [],
  shopId = null,
  shopCategory = null,
  onProductAdded,
}: RestockProductListProps) {
  const [isAddTrendingOpen, setIsAddTrendingOpen] = useState(false);
  const [initialTrendingName, setInitialTrendingName] = useState("");

  const searchQuery = useRestockStore((s) => s.searchQuery);
  const setSearchQuery = useRestockStore((s) => s.setSearchQuery);
  const filterTab = useRestockStore((s) => s.filterTab);
  const setFilterTab = useRestockStore((s) => s.setFilterTab);
  const selectAllLowStock = useRestockStore((s) => s.selectAllLowStock);

  // Group pending orders and slips count per product
  const { pendingByProduct, slipsCountByProduct } = useMemo(() => {
    const ordersMap = new Map<string, RestockOrder>();
    orders.forEach((o) => ordersMap.set(o.id, o));

    const pendingMap = new Map<string, PendingSlipItem[]>();
    const countMap = new Map<string, number>();

    for (const item of items) {
      const order = ordersMap.get(item.order_id);
      if (!order) continue;

      countMap.set(item.product_id, (countMap.get(item.product_id) || 0) + 1);

      if (item.status === "pending" && order.status !== "cancelled") {
        const existing = pendingMap.get(item.product_id) || [];
        existing.push({ ...item, order });
        pendingMap.set(item.product_id, existing);
      }
    }

    return { pendingByProduct: pendingMap, slipsCountByProduct: countMap };
  }, [orders, items]);

  const depletedProducts = useMemo(
    () => products.filter(isProductDepleted),
    [products]
  );

  const filteredProducts = useMemo(() => {
    const base = filterTab === "depleted" ? depletedProducts : products;

    if (!searchQuery.trim()) return base;
    const q = searchQuery.toLowerCase().trim();

    return base.filter((p) => {
      const inAttributes = Object.values(p.attributes || {}).some((v) =>
        String(v).toLowerCase().includes(q)
      );

      return (
        p.name.toLowerCase().includes(q) ||
        (p.brand && p.brand.toLowerCase().includes(q)) ||
        p.category.toLowerCase().includes(q) ||
        (p.storage_location && p.storage_location.toLowerCase().includes(q)) ||
        (p.barcode && p.barcode.toLowerCase().includes(q)) ||
        inAttributes
      );
    });
  }, [filterTab, depletedProducts, products, searchQuery]);

  const openNewItem = (name: string) => {
    setInitialTrendingName(name);
    setIsAddTrendingOpen(true);
  };

  const segment = (active: boolean) =>
    cn(
      "h-10 cursor-pointer rounded-full px-4 text-base font-medium transition-colors",
      active ? "bg-card text-foreground" : "text-muted-foreground hover:text-foreground"
    );

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <input
          placeholder="Search by name, brand or shelf"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Search products"
          className="h-12 w-full rounded-full border border-input bg-card pr-4 pl-12 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* Two filters, one bulk action */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center rounded-full bg-muted p-1">
          <button type="button" onClick={() => setFilterTab("depleted")} className={segment(filterTab === "depleted")}>
            Needs reorder ({depletedProducts.length})
          </button>
          <button type="button" onClick={() => setFilterTab("all")} className={segment(filterTab === "all")}>
            All items ({products.length})
          </button>
        </div>

        {depletedProducts.length > 0 && (
          <button
            type="button"
            onClick={() => selectAllLowStock(products)}
            title="Add every low and out-of-stock item to the order"
            className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full bg-secondary px-5 text-base font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            <ListPlus className="h-5 w-5" />
            <span>Add all low stock</span>
          </button>
        )}
      </div>

      {/* Product List */}
      {filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-border bg-card p-10 text-center">
          {filterTab === "depleted" && !searchQuery.trim() ? (
            <>
              <KoroFace size={64} tone="mint" />
              <div className="space-y-1">
                <p className="text-xl font-semibold text-foreground">Everything is stocked</p>
                <p className="mx-auto max-w-sm text-base text-muted-foreground">
                  Nothing is low or out of stock right now. You can still order a new item.
                </p>
              </div>
              <button
                type="button"
                onClick={() => openNewItem("")}
                className="inline-flex h-12 cursor-pointer items-center gap-2 rounded-full bg-primary px-6 text-base font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                <Plus className="h-5 w-5" />
                <span>Order a new item</span>
              </button>
            </>
          ) : (
            <>
              <PackageSearch className="h-12 w-12 text-muted-foreground" />
              <div className="space-y-1">
                <p className="text-xl font-semibold text-foreground">
                  {searchQuery.trim() ? `Nothing found for "${searchQuery.trim()}"` : "No products found"}
                </p>
                <p className="mx-auto max-w-sm text-base text-muted-foreground">
                  {searchQuery.trim()
                    ? "Want to order it as a new item on your next slip?"
                    : "Try a different search, or order a new item."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => openNewItem(searchQuery.trim())}
                className="inline-flex h-12 cursor-pointer items-center gap-2 rounded-full bg-primary px-6 text-base font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                <Plus className="h-5 w-5" />
                <span>{searchQuery.trim() ? `Add "${searchQuery.trim()}" to order` : "Order a new item"}</span>
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredProducts.map((product) => (
            <RestockProductItem
              key={product.id}
              product={product}
              pendingItems={pendingByProduct.get(product.id) || []}
              totalSlipsCount={slipsCountByProduct.get(product.id) || 0}
            />
          ))}
        </div>
      )}

      {/* Quick Add Trending Item Dialog */}
      <RestockAddTrendingDialog
        shopId={shopId}
        shopCategory={shopCategory}
        open={isAddTrendingOpen}
        onOpenChange={setIsAddTrendingOpen}
        initialName={initialTrendingName}
        onItemAdded={onProductAdded}
      />
    </div>
  );
}
