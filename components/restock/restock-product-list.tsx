"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, CheckCheck, CheckCircle2, PackageSearch, Sparkles } from "lucide-react";
import type { Product, RestockOrder, RestockOrderItemRow } from "@/lib/supabase/types";
import { useRestockStore } from "@/lib/store/use-restock-store";
import { isProductDepleted } from "@/lib/utils/restock-formatters";
import { RestockProductItem, type PendingSlipItem } from "./restock-product-item";
import { RestockAddTrendingDialog } from "./restock-add-trending-dialog";

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

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setInitialTrendingName(searchQuery.trim());
              setIsAddTrendingOpen(true);
            }}
            className="h-9 text-xs font-semibold gap-1.5 shrink-0 border-amber-500/30 text-amber-700 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 cursor-pointer shadow-2xs"
            title="Order a new item or trending market stock directly on this restock slip"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">+ Order New / Trending Item</span>
            <span className="sm:hidden">+ New Item</span>
          </Button>
        </div>
      </div>

      {/* Product List */}
      {filteredProducts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center space-y-3 bg-card">
          {filterTab === "depleted" && !searchQuery.trim() ? (
            <>
              <CheckCircle2 className="h-9 w-9 text-emerald-500 mx-auto" />
              <p className="text-sm font-semibold text-foreground">Stock is Healthy!</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                None of your products are currently low or out of stock. Switch to &ldquo;All&rdquo; tab or order a new trending item below.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setInitialTrendingName("");
                  setIsAddTrendingOpen(true);
                }}
                className="h-8 text-xs font-semibold gap-1.5 mx-auto cursor-pointer border-amber-500/30 text-amber-700 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>+ Order New / Trending Item</span>
              </Button>
            </>
          ) : (
            <>
              <PackageSearch className="h-9 w-9 text-muted-foreground mx-auto" />
              <p className="text-sm font-semibold text-foreground">
                {searchQuery.trim()
                  ? `No Products Found for "${searchQuery.trim()}"`
                  : "No Products Found"}
              </p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {searchQuery.trim()
                  ? `Want to order "${searchQuery.trim()}" as a new or trending item directly on this restock slip?`
                  : "Try adjusting your search keywords or add a new trending item directly."}
              </p>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  setInitialTrendingName(searchQuery.trim());
                  setIsAddTrendingOpen(true);
                }}
                className="h-8 text-xs font-semibold gap-1.5 mx-auto cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>
                  {searchQuery.trim()
                    ? `Add "${searchQuery.trim()}" to Order Slip`
                    : "+ Order New / Trending Item"}
                </span>
              </Button>
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
