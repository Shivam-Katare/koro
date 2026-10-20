"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/lib/store/use-auth-store";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Hydrate user and session on initial mount and keep in sync
    useAuthStore.getState().initialize();
  }, []);

  return <>{children}</>;
}
