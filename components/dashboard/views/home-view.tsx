"use client";

import { InventoryStats } from "@/components/inventory/inventory-stats";
import { InventoryTable } from "@/components/inventory/inventory-table";
import { AddProductDialog } from "@/components/inventory/add-product-dialog";
import { Button } from "@/components/ui/button";
import { PlusCircle, PackageSearch, Sparkles } from "lucide-react";
import type { Shop, Profile, Product } from "@/lib/supabase/types";

interface HomeViewProps {
  shop: Shop | null;
  profile: Profile | null;
  products: Product[];
}

export function HomeView({ shop, profile, products }: HomeViewProps) {
  if (products.length === 0) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                Store Setup
              </span>
              <h2 className="font-heading text-2xl font-bold text-foreground">
                Welcome, {profile?.full_name || "Owner"}!
              </h2>
              <p className="text-sm text-muted-foreground max-w-xl">
                Your shop <span className="font-semibold text-foreground">&ldquo;{shop?.name}&rdquo;</span> is set up.
                Add your first few products to start finding items and recording stock changes.
              </p>
            </div>

            {shop && (
              <AddProductDialog
                shopId={shop.id}
                defaultCategory={shop.category}
                trigger={
                  <Button className="h-11 px-5 font-semibold gap-2 shadow-sm">
                    <PlusCircle className="h-4 w-4" />
                    <span>Add Your First Product</span>
                  </Button>
                }
              />
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-dashed border-border p-8 text-center space-y-3 bg-muted/10">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <PackageSearch className="h-6 w-6" />
          </div>
          <p className="text-base font-semibold text-foreground">No Products in Inventory Yet</p>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            You do not need a full inventory on day one. Start by adding a few frequently requested items.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="font-heading text-2xl font-bold text-foreground">
          Welcome back, {profile?.full_name || "Owner"}!
        </h2>
        <p className="text-xs text-muted-foreground">
          Quick summary of your store inventory and item counts.
        </p>
      </div>

      <InventoryStats products={products} />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-heading text-lg font-bold text-foreground">Store Inventory</h3>
            <p className="text-xs text-muted-foreground">Search and review product locations and stock levels.</p>
          </div>
        </div>

        <InventoryTable products={products} />
      </div>
    </div>
  );
}
