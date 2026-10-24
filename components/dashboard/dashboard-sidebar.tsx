"use client";

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuBadge,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/landing/theme-toggle";
import { Facehash } from "facehash";
import { useDashboardNav, type DashboardTab } from "@/lib/hooks/use-dashboard-nav";
import type { Shop, Profile, Product } from "@/lib/supabase/types";
import { Home, Package, ReceiptText, RefreshCw, MessageSquare, Settings } from "lucide-react";
import { cn } from "cn";

interface DashboardSidebarProps {
  shop: Shop | null;
  profile: Profile | null;
  products: Product[];
}

export function DashboardSidebar({ shop, profile, products }: DashboardSidebarProps) {
  const { activeTab, setActiveTab } = useDashboardNav();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const lowStockCount = products.filter(
    (p) => p.stock_status === "low_stock" || p.stock_status === "out_of_stock"
  ).length;

  const navItems = [
    { id: "home" as DashboardTab, label: "Home", icon: Home },
    { id: "products" as DashboardTab, label: "Products", icon: Package, badge: products.length },
    { id: "sales" as DashboardTab, label: "Sales", icon: ReceiptText },
    {
      id: "restock" as DashboardTab,
      label: "Restock",
      icon: RefreshCw,
      badge: lowStockCount > 0 ? lowStockCount : undefined,
      badgeVariant: "destructive" as const,
    },
    { id: "chats" as DashboardTab, label: "Chats", icon: MessageSquare },
    { id: "settings" as DashboardTab, label: "Settings", icon: Settings },
  ];

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar">
      {/* Brand header: same height as the top bar so the lines meet */}
      <SidebarHeader
        className={cn(
          "h-16 shrink-0 justify-center border-b border-sidebar-border py-0 transition-all",
          isCollapsed ? "items-center px-0" : "px-4"
        )}
      >
        <div className={cn("flex min-w-0 items-center", isCollapsed ? "justify-center" : "gap-3")}>
          <Facehash
            name={shop?.name || "Koro"}
            size={40}
            colors={["#ffb110", "#62aef0", "#0075de", "#4cc38a", "#f64932", "#ff9db1"]}
            className="rounded-full overflow-hidden shrink-0 ring-2 ring-sidebar-border"
          />
          {!isCollapsed && (
            <div className="flex min-w-0 flex-col group-data-[collapsible=icon]:hidden">
              <span className="font-heading text-lg font-bold leading-tight text-sidebar-foreground">Koro</span>
              <span
                className="truncate text-sm leading-tight text-muted-foreground"
                title={shop?.category ? `${shop?.name} \u00b7 ${shop.category}` : shop?.name}
              >
                {shop?.name || "Your shop"}
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent className={cn("py-4", isCollapsed ? "px-0" : "px-3")}>
        <SidebarGroup className={cn("p-0", isCollapsed ? "items-center" : "")}>
          <SidebarGroupContent>
            <SidebarMenu className={cn("gap-1.5", isCollapsed ? "items-center" : "")}>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <SidebarMenuItem
                    key={item.id}
                    className={cn(
                      "transition-all",
                      isCollapsed ? "flex justify-center" : "w-full"
                    )}
                  >
                    <SidebarMenuButton
                      size="lg"
                      isActive={isActive}
                      onClick={() => setActiveTab(item.id)}
                      tooltip={item.label}
                      className={cn(
                        "cursor-pointer rounded-xl text-base font-medium transition-all data-active:font-semibold",
                        isCollapsed
                          ? "size-12! justify-center p-0!"
                          : "h-12 w-full gap-3 px-3.5"
                      )}
                    >
                      <Icon className="size-5 shrink-0" />
                      {!isCollapsed && (
                        <span className="truncate group-data-[collapsible=icon]:hidden">
                          {item.label}
                        </span>
                      )}
                    </SidebarMenuButton>
                    {!isCollapsed && item.badge !== undefined && (
                      <SidebarMenuBadge
                        className={
                          item.badgeVariant === "destructive"
                            ? "top-1/2! right-3 h-6 min-w-6 -translate-y-1/2 rounded-full bg-destructive/15 text-sm font-semibold text-destructive group-data-[collapsible=icon]:hidden"
                            : "top-1/2! right-3 h-6 min-w-6 -translate-y-1/2 rounded-full bg-muted text-sm group-data-[collapsible=icon]:hidden"
                        }
                      >
                        {item.badge}
                      </SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer: theme, profile, sign out */}
      <SidebarFooter className={cn("gap-3 p-3", isCollapsed ? "items-center px-0" : "")}>
        <div
          className={cn(
            "flex items-center",
            isCollapsed ? "justify-center px-0" : "justify-between px-2"
          )}
        >
          {!isCollapsed && (
            <span className="text-base font-medium text-sidebar-foreground group-data-[collapsible=icon]:hidden">
              Dark mode
            </span>
          )}
           <ThemeToggle />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
