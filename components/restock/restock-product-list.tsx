"use client";

import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, CheckCheck, CheckCircle2, PackageSearch } from "lucide-react";
import type { Product, RestockOrder, RestockOrderItemRow } from "@/lib/supabase/types";
import { useRestockStore } from "@/lib/store/use-restock-store";
import { isProductDepleted } from "@/lib/utils/restock-formatters";
import { RestockProductItem, type PendingSlipItem } from "./restock-product-item";

interface RestockProductListProps {
  products: Product[];
  orders?: RestockOrder[];
  items?: RestockOrderItemRow[];
}

export function RestockProductList({
  products,
  orders = [],
  items = [],
}: RestockProductListProps) {
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

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search low stock, brand, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-muted/60 p-0.5 rounded-lg border border-border text-xs">
            <button
              type="button"
              onClick={() => setFilterTab("depleted")}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                filterTab === "depleted"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Low Stock ({depletedProducts.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab("all")}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                filterTab === "all"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All ({products.length})
            </button>
          </div>

          {depletedProducts.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => selectAllLowStock(products)}
              className="h-9 text-xs font-medium gap-1.5 shrink-0 cursor-pointer"
              title="Add all low and out-of-stock items to order draft"
            >
              <CheckCheck className="h-3.5 w-3.5 text-primary" />
              <span className="hidden sm:inline">Select All Low Stock</span>
              <span className="sm:hidden">Select All</span>
            </Button>
          )}
        </div>
      </div>

      {/* Product List */}
      {filteredProducts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center space-y-2 bg-card">
          {filterTab === "depleted" && !searchQuery.trim() ? (
            <>
              <CheckCircle2 className="h-9 w-9 text-emerald-500 mx-auto" />
              <p className="text-sm font-semibold text-foreground">Stock is Healthy!</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                None of your products are currently low or out of stock. Switch to &ldquo;All&rdquo; tab if you want to reorder other items.
              </p>
            </>
          ) : (
            <>
              <PackageSearch className="h-9 w-9 text-muted-foreground mx-auto" />
              <p className="text-sm font-semibold text-foreground">No Products Found</p>
              <p className="text-xs text-muted-foreground">
                Try adjusting your search keywords or toggle the filter tab above.
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
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
    </div>
  );
}
