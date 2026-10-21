"use client";

import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, AlertCircle, ShoppingCart, Boxes } from "lucide-react";
import type { Product } from "@/lib/supabase/types";
import { useRestockStore } from "@/lib/store/use-restock-store";
import { isProductDepleted } from "@/lib/utils/restock-formatters";

interface RestockStatsProps {
  products: Product[];
}

export function RestockStats({ products }: RestockStatsProps) {
  const orderItems = useRestockStore((s) => s.orderItems);
  const selectedProducts = Object.values(orderItems);

  const depletedCount = products.filter(isProductDepleted).length;
  const outOfStockCount = products.filter(
    (p) => p.current_stock <= 0 || p.stock_status === "out_of_stock"
  ).length;

  const totalOrderUnits = selectedProducts.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <Card className="border-border shadow-xs">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Needs Reorder
            </p>
            <p className="text-2xl font-bold font-heading text-amber-600 dark:text-amber-400 mt-0.5">
              {depletedCount}
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border shadow-xs">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Out of Stock
            </p>
            <p className="text-2xl font-bold font-heading text-destructive mt-0.5">
              {outOfStockCount}
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
            <AlertCircle className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border shadow-xs">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Items in Draft
            </p>
            <p className="text-2xl font-bold font-heading text-primary mt-0.5">
              {selectedProducts.length}
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ShoppingCart className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border shadow-xs">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Units in Draft
            </p>
            <p className="text-2xl font-bold font-heading text-foreground mt-0.5">
              {totalOrderUnits}
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <Boxes className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
