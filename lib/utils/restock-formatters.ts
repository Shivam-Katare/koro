import type { Product } from "@/lib/supabase/types";

export function calculateSuggestedQuantity(product: Product): number {
  const threshold = product.min_stock_threshold ?? 5;
  const targetStock = Math.max(threshold * 2, threshold + 5);
  const diff = targetStock - product.current_stock;
  return Math.max(1, diff);
}

export function isProductDepleted(product: Product): boolean {
  const threshold = product.min_stock_threshold ?? 5;
  return (
    product.current_stock <= threshold ||
    product.stock_status === "low_stock" ||
    product.stock_status === "out_of_stock"
  );
}

export function buildWhatsAppRestockMessage({
  shopName,
  items,
  notes,
  distributorName,
}: {
  shopName: string;
  items: { product: Product; quantity: number }[];
  notes?: string;
  distributorName?: string;
}): string {
  const dateStr = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const lines: string[] = [];
  lines.push(`📦 *PURCHASE ORDER / RESTOCK LIST*`);
  lines.push(`🏪 *Shop:* ${shopName || "My Retail Store"}`);
  lines.push(`📅 *Date:* ${dateStr}`);
  if (distributorName?.trim()) {
    lines.push(`👤 *Supplier / Distributor:* ${distributorName.trim()}`);
  }
  lines.push(``);
  lines.push(`*Items to Order:*`);

  items.forEach((item, index) => {
    const p = item.product;
    const detailsList: string[] = [];
    if (p.brand) detailsList.push(p.brand);
    if (p.storage_location) detailsList.push(`Loc: ${p.storage_location}`);
    if (p.attributes && typeof p.attributes === "object") {
      const topAttrs = Object.entries(p.attributes)
        .slice(0, 2)
        .map(([k, v]) => `${k}: ${v}`)
        .join(", ");
      if (topAttrs) detailsList.push(topAttrs);
    }

    const details = detailsList.length > 0 ? ` (${detailsList.join(" | ")})` : "";
    const minThreshold = p.min_stock_threshold ?? 5;

    lines.push(
      `${index + 1}. *${p.name}*${details}\n   👉 *Order: ${item.quantity} units* (Current: ${p.current_stock} | Min: ${minThreshold})`
    );
  });

  const totalUnits = items.reduce((sum, item) => sum + item.quantity, 0);

  lines.push(``);
  lines.push(`----------------------------------------`);
  lines.push(`📋 *Total Products:* ${items.length} items`);
  lines.push(`🔢 *Total Order Quantity:* ${totalUnits} units`);
  if (notes?.trim()) {
    lines.push(`📝 *Note:* ${notes.trim()}`);
  }
  lines.push(``);
  lines.push(`_Generated via Zibbi Retail Assistant_`);

  return lines.join("\n");
}
