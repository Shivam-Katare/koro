"use client";

import { KoroGlyph } from "@/components/brand/koro-face";
import type { Product } from "@/lib/supabase/types";
import { useRestockStore } from "@/lib/store/use-restock-store";
import { isProductDepleted } from "@/lib/utils/restock-formatters";

interface RestockStatsProps {
  products: Product[];
}

export function RestockStats({ products }: RestockStatsProps) {
  const orderItems = useRestockStore((s) => s.orderItems);
  const selectedProducts = Object.values(orderItems);

  const depletedCount = products.filter(isProductDepleted).length;
  const outOfStockCount = products.filter(
    (p) => p.current_stock <= 0 || p.stock_status === "out_of_stock"
  ).length;

  const totalOrderUnits = selectedProducts.reduce((sum, item) => sum + item.quantity, 0);

  const cards = [
    {
      label: "Needs reorder",
      value: depletedCount,
      note: depletedCount === 1 ? "item is running low" : "items are running low",
      glyph: "alert" as const,
      surface: "bg-[#ffb110] text-black",
    },
    {
      label: "Out of stock",
      value: outOfStockCount,
      note: outOfStockCount === 1 ? "item has none left" : "items have none left",
      glyph: "package" as const,
      surface: "bg-[#ffe6e1] dark:bg-[#3b211d]",
    },
    {
      label: "In your order",
      value: selectedProducts.length,
      note: `${totalOrderUnits} units to buy`,
      glyph: "trending-up" as const,
      surface: "bg-[#e6f3fe] dark:bg-[#243442]",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {cards.map((card) => (
        <div key={card.label} className={`flex items-center justify-between gap-4 rounded-3xl p-5 sm:p-6 ${card.surface}`}>
          <div className="min-w-0">
            <p className="text-base font-semibold">{card.label}</p>
            <p className="font-heading text-md md:text-5xl leading-none font-bold tracking-tight tabular-nums mt-2">{card.value}</p>
            <p className="mt-2 text-base opacity-70">{card.note}</p>
          </div>
          <KoroGlyph type={card.glyph} size={56} className="shrink-0" />
        </div>
      ))}
    </div>
  );
}
