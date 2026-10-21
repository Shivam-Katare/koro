"use client";

import { InventoryStats } from "@/components/inventory/inventory-stats";
import { InventoryTable } from "@/components/inventory/inventory-table";
import { AddProductDialog } from "@/components/inventory/add-product-dialog";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import type { Shop, Product } from "@/lib/supabase/types";

interface ProductsViewProps {
  shop: Shop | null;
  products: Product[];
}

export function ProductsView({ shop, products }: ProductsViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl font-bold text-foreground">Products &amp; Inventory</h2>
          <p className="text-xs text-muted-foreground">
            Search by name, storage location (e.g. DRAW-TO-BOX-5), category, or dynamic variant tags.
          </p>
        </div>

        {shop && (
          <AddProductDialog
            shopId={shop.id}
            defaultCategory={shop.category}
            trigger={
              <Button className="h-10 font-semibold gap-2 shadow-xs">
                <PlusCircle className="h-4 w-4" />
                <span>Add Product</span>
              </Button>
            }
          />
        )}
      </div>

      <InventoryStats products={products} />

      <InventoryTable products={products} />
    </div>
  );
}
