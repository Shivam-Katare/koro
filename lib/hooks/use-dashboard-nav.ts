"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback } from "react";
import { useAuthStore } from "@/lib/store/use-auth-store";
import toast from "react-hot-toast";

export type DashboardTab = "home" | "products" | "sales" | "restock" | "settings";

export function useDashboardNav() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const signOut = useAuthStore((s) => s.signOut);

  const rawTab = searchParams.get("tab");
  const activeTab: DashboardTab =
    rawTab === "products" ||
    rawTab === "sales" ||
    rawTab === "restock" ||
    rawTab === "settings"
      ? rawTab
      : "home";

  const setActiveTab = useCallback(
    (tab: DashboardTab) => {
      const params = new URLSearchParams(searchParams.toString());
      if (tab === "home") {
        params.delete("tab");
      } else {
        params.set("tab", tab);
      }
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [searchParams, router, pathname]
  );

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
      toast.success("Signed out successfully");
      router.push("/login");
      router.refresh();
    } catch {
      toast.error("Failed to sign out");
    }
  }, [signOut, router]);

  return {
    activeTab,
    setActiveTab,
    handleSignOut,
  };
}
