"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Package, CheckCircle2, AlertTriangle, Layers } from "lucide-react";
import type { Product } from "@/lib/supabase/types";

interface InventoryStatsProps {
  products: Product[];
}

export function InventoryStats({ products }: InventoryStatsProps) {
  const totalProducts = products.length;
  const inStock = products.filter((p) => p.stock_status === "in_stock").length;
  const lowStock = products.filter((p) => p.stock_status === "low_stock").length;
  const outOfStock = products.filter((p) => p.stock_status === "out_of_stock").length;
  const totalUnits = products.reduce((sum, p) => sum + (Number(p.current_stock) || 0), 0);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <Card className="border-border shadow-xs">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Total Products
            </p>
            <p className="text-2xl font-bold font-heading text-foreground mt-0.5">
              {totalProducts}
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Package className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border shadow-xs">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              In Stock
            </p>
            <p className="text-2xl font-bold font-heading text-emerald-600 dark:text-emerald-400 mt-0.5">
              {inStock}
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border shadow-xs">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Low Stock Alerts
            </p>
            <p className="text-2xl font-bold font-heading text-amber-600 dark:text-amber-400 mt-0.5">
              {lowStock + outOfStock}
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
              Total Units
            </p>
            <p className="text-2xl font-bold font-heading text-foreground mt-0.5">
              {totalUnits}
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <Layers className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
