"use client";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { DashboardSidebar } from "./dashboard-sidebar";
import { DashboardHeaderBar } from "./dashboard-header-bar";
import { HomeView } from "./views/home-view";
import { ProductsView } from "./views/products-view";
import { SalesView } from "@/components/sales/sales-view";
import { RestockView } from "@/components/restock/restock-view";
import { useDashboardNav } from "@/lib/hooks/use-dashboard-nav";
import type {
  Shop,
  Profile,
  Product,
  RestockOrder,
  RestockOrderItemRow,
} from "@/lib/supabase/types";

interface DashboardShellProps {
  shop: Shop | null;
  profile: Profile | null;
  products: Product[];
  restockOrders?: RestockOrder[];
  restockOrderItems?: RestockOrderItemRow[];
}

export function DashboardShell({
  shop,
  profile,
  products,
  restockOrders = [],
  restockOrderItems = [],
}: DashboardShellProps) {
  const { activeTab } = useDashboardNav();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <DashboardSidebar shop={shop} profile={profile} products={products} />

        <SidebarInset className="flex flex-col flex-1 min-w-0">
          <DashboardHeaderBar shop={shop} />

          <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 sm:px-6 lg:px-8">
            {activeTab === "home" && (
              <HomeView shop={shop} profile={profile} products={products} />
            )}

            {activeTab === "products" && (
              <ProductsView shop={shop} products={products} />
            )}

            {activeTab === "sales" && (
              <SalesView shop={shop} products={products} />
            )}

            {activeTab === "restock" && (
              <RestockView
                shop={shop}
                products={products}
                initialOrders={restockOrders}
                initialItems={restockOrderItems}
              />
            )}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
