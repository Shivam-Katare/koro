"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/landing/theme-toggle";
import { useDashboardNav } from "@/lib/hooks/use-dashboard-nav";
import type { Shop } from "@/lib/supabase/types";

interface DashboardHeaderBarProps {
  shop: Shop | null;
}

// `shop` stays in the props for compatibility; the shop name now lives in the sidebar only.
export function DashboardHeaderBar(_props: DashboardHeaderBarProps) {
  const { activeTab } = useDashboardNav();

  const tabTitles: Record<string, string> = {
    home: "Home",
    products: "Products & Stock",
    sales: "Sales & Slips",
    restock: "Restock Orders",
    chats: "Chat History",
    settings: "Shop Settings",
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-border bg-background/95 px-4 backdrop-blur-xs sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <SidebarTrigger className="size-10 shrink-0 cursor-pointer rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground [&_svg]:size-5" />
        <p className="truncate font-heading text-lg font-semibold text-foreground sm:text-xl">
          {tabTitles[activeTab] || "Overview"}
        </p>
      </div>

      <div className="md:hidden">
        <ThemeToggle />
      </div>
    </header>
  );
}
