"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/landing/theme-toggle";
import { useDashboardNav } from "@/lib/hooks/use-dashboard-nav";
import { AddProductDialog } from "@/components/inventory/add-product-dialog";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import type { Shop } from "@/lib/supabase/types";

interface DashboardHeaderBarProps {
  shop: Shop | null;
}

export function DashboardHeaderBar({ shop }: DashboardHeaderBarProps) {
  const { activeTab } = useDashboardNav();

  const tabTitles: Record<string, string> = {
    home: "Store Overview",
    products: "Products & Stock",
    sales: "Sales & Slips",
    restock: "Restock Orders",
    settings: "Shop Settings",
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur-xs">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer" />
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-foreground hidden sm:inline">
            {shop?.name || "My Store"}
          </span>
          <span className="text-muted-foreground hidden sm:inline">/</span>
          <span className="font-medium text-primary capitalize">
            {tabTitles[activeTab] || "Overview"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {shop && (
          <AddProductDialog
            shopId={shop.id}
            defaultCategory={shop.category}
            trigger={
              <Button size="sm" className="h-8 text-xs font-semibold gap-1.5 shadow-xs">
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Add Product</span>
              </Button>
            }
          />
        )}
        <div className="sm:hidden">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
