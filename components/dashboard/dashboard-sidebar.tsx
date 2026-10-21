"use client";

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuBadge,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/landing/theme-toggle";
import { useDashboardNav, type DashboardTab } from "@/lib/hooks/use-dashboard-nav";
import type { Shop, Profile, Product } from "@/lib/supabase/types";
import {
  Home,
  Package,
  ReceiptText,
  RefreshCw,
  Store,
  LogOut,
  User,
  Tag,
} from "lucide-react";

interface DashboardSidebarProps {
  shop: Shop | null;
  profile: Profile | null;
  products: Product[];
}

export function DashboardSidebar({ shop, profile, products }: DashboardSidebarProps) {
  const { activeTab, setActiveTab, handleSignOut } = useDashboardNav();

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
  ];

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar">
      {/* Brand & Store Header */}
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground shadow-xs">
            <Store className="h-5 w-5" />
          </div>
          <div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden">
            <span className="font-heading font-bold text-sm text-sidebar-foreground truncate">
              {shop?.name || "Retail Shop"}
            </span>
            <span className="text-[11px] text-muted-foreground flex items-center gap-1 truncate">
              <Tag className="h-3 w-3 shrink-0" />
              {shop?.category || "Store"}
            </span>
          </div>
        </div>
      </SidebarHeader>

      {/* Navigation Menu */}
      <SidebarContent className="p-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Main Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setActiveTab(item.id)}
                      tooltip={item.label}
                      className="gap-3 font-medium text-xs h-9 cursor-pointer"
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                    {item.badge !== undefined && (
                      <SidebarMenuBadge className={item.badgeVariant === "destructive" ? "bg-destructive/15 text-destructive font-semibold" : ""}>
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

      {/* Footer: User Details, Theme Toggle, Sign Out */}
      <SidebarFooter className="p-3 border-t border-sidebar-border space-y-2">
        <div className="flex items-center justify-between px-1 group-data-[collapsible=icon]:justify-center">
          <span className="text-[11px] font-medium text-muted-foreground group-data-[collapsible=icon]:hidden">
            Theme Mode
          </span>
          <ThemeToggle />
        </div>

        <SidebarSeparator />

        <div className="flex items-center justify-between gap-2 p-1.5 rounded-xl bg-sidebar-accent/50">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <User className="h-4 w-4" />
            </div>
            <div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden">
              <span className="text-xs font-semibold text-sidebar-foreground truncate">
                {profile?.full_name || "Owner"}
              </span>
              <span className="text-[10px] text-muted-foreground truncate">
                {profile?.email || ""}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            title="Sign out"
            aria-label="Sign out"
            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors group-data-[collapsible=icon]:hidden cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
