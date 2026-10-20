"use client";

import { useRouter } from "next/navigation";
import { Store, LogOut, Phone, Tag, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/lib/store/use-auth-store";
import type { Shop, Profile } from "@/lib/supabase/types";

interface DashboardHeaderProps {
  shop: Shop | null;
  profile: Profile | null;
}

export function DashboardHeader({ shop, profile }: DashboardHeaderProps) {
  const router = useRouter();
  const signOut = useAuthStore((s) => s.signOut);

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
            <Store className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-xl font-bold text-foreground">
                {shop?.name || "My Retail Shop"}
              </h1>
              <Badge variant="secondary" className="text-[11px] font-semibold">
                <Tag className="mr-1 h-3 w-3 text-primary" />
                {shop?.category || "General Store"}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {profile?.full_name || "Owner"}
              </span>
              {shop?.whatsapp_number && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3 text-success" />
                  WA: {shop.whatsapp_number}
                </span>
              )}
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs font-semibold"
          onClick={handleSignOut}
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Sign Out</span>
        </Button>
      </div>
    </header>
  );
}
