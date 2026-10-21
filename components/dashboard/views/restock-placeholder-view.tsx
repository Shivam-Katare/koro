"use client";

import { RestockView } from "@/components/restock/restock-view";
import type { Product, Shop } from "@/lib/supabase/types";

interface RestockPlaceholderViewProps {
  products: Product[];
  shop?: Shop | null;
}

export function RestockPlaceholderView({ products, shop = null }: RestockPlaceholderViewProps) {
  return <RestockView shop={shop} products={products} />;
}
