"use client";

import { SalesView } from "@/components/sales/sales-view";
import type { Product, Shop } from "@/lib/supabase/types";

interface SalesPlaceholderViewProps {
  products?: Product[];
  shop?: Shop | null;
}

export function SalesPlaceholderView({ products = [], shop = null }: SalesPlaceholderViewProps) {
  return <SalesView shop={shop} products={products} />;
}
