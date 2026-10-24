"use client";

import type React from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { DashboardSidebar } from "./dashboard-sidebar";
import { DashboardHeaderBar } from "./dashboard-header-bar";
import { HomeView } from "./views/home-view";
import { ProductsView } from "./views/products-view";
import { SalesView } from "@/components/sales/sales-view";
import { RestockView } from "@/components/restock/restock-view";
import { ChatsView } from "./views/chats-view";
import { AssistantChatDrawer } from "@/components/assistant/assistant-chat-drawer";
import { useDashboardNav } from "@/lib/hooks/use-dashboard-nav";
import { useAssistantStore } from "@/lib/store/use-assistant-store";
import type {
  Shop,
  Profile,
  Product,
  RestockOrder,
  RestockOrderItemRow,
  StockMovement,
  SalesSlip,
} from "@/lib/supabase/types";

interface DashboardShellProps {
  shop: Shop | null;
  profile: Profile | null;
  products: Product[];
  restockOrders?: RestockOrder[];
  restockOrderItems?: RestockOrderItemRow[];
  stockMovements?: StockMovement[];
  salesSlips?: SalesSlip[];
}

export function DashboardShell({
  shop,
  profile,
  products,
  restockOrders = [],
  restockOrderItems = [],
  stockMovements = [],
  salesSlips = [],
}: DashboardShellProps) {
  const { activeTab } = useDashboardNav();
  const {
    isOpen,
    setIsOpen,
    pendingQuery,
    clearPendingQuery,
    pendingStartLive,
    clearPendingStartLive,
    selectedConversationId,
    clearSelectedConversationId,
  } = useAssistantStore();

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "17rem",
          "--sidebar-width-icon": "4.5rem",
        } as React.CSSProperties
      }
    >
      <div className="flex min-h-screen w-full bg-background">
        <DashboardSidebar shop={shop} profile={profile} products={products} />

        <SidebarInset className="flex flex-col flex-1 min-w-0">
          <DashboardHeaderBar shop={shop} />

          <main className="flex-1 w-full mx-auto px-4 py-6 sm:px-6 lg:px-8">
            {activeTab === "home" && (
              <HomeView
                shop={shop}
                profile={profile}
                products={products}
                restockOrders={restockOrders}
                stockMovements={stockMovements}
                salesSlips={salesSlips}
              />
            )}

            {activeTab === "products" && (
              <ProductsView shop={shop} products={products} />
            )}

            {activeTab === "sales" && (
              <SalesView shop={shop} products={products} initialSlips={salesSlips} />
            )}

            {activeTab === "restock" && (
              <RestockView
                shop={shop}
                products={products}
                initialOrders={restockOrders}
                initialItems={restockOrderItems}
              />
            )}

            {activeTab === "chats" && (
              <ChatsView shop={shop} products={products} profile={profile} />
            )}
          </main>

          <AssistantChatDrawer
            shop={shop}
            products={products}
            isOpen={isOpen}
            onOpenChange={setIsOpen}
            pendingInitialQuery={pendingQuery}
            onClearPendingQuery={clearPendingQuery}
            pendingStartLive={pendingStartLive}
            onClearPendingStartLive={clearPendingStartLive}
            initialConversationId={selectedConversationId}
            onClearInitialConversationId={clearSelectedConversationId}
          />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
