import type { SupabaseClient } from "@supabase/supabase-js";

export type AssistantPendingAction = {
  actionType:
    | "adjust_stock"
    | "create_product"
    | "update_location"
    | "update_price"
    | "delete_product"
    | "record_sale"
    | "record_order_arrival";
  productId?: string;
  productName: string;
  currentStock?: number | null;
  quantityDelta?: number;
  newStock?: number | null;
  reason?: string;
  openingStock?: number;
  sellingPrice?: number;
  costPrice?: number;
  category?: string;
  storageLocation?: string;
  currentLocation?: string;
  newLocation?: string;
  currentPrice?: number | null;
  newPrice?: number;
  // For record_sale
  quantity?: number;
  unitPrice?: number;
  totalAmount?: number;
  isUnlinked?: boolean;
  // For record_order_arrival
  orderItemId?: string;
  orderNumber?: string;
  receivedQuantity?: number;
};

export interface AssistantExecutionResult {
  content: string;
  taskType:
    | "find_product"
    | "check_stock"
    | "low_stock"
    | "price_history"
    | "adjust_stock"
    | "create_product"
    | "update_location"
    | "update_price"
    | "delete_product"
    | "record_sale"
    | "sales_history"
    | "restock_orders"
    | "record_order_arrival"
    | "inventory_summary"
    | "general";
  structuredData?: any;
  pendingAction?: AssistantPendingAction | null;
}

// Helper to resolve product matches, handling exact matches, partial matches, and duplicates
export function resolveProductMatch(products: any[], query: string): {
  matched: any[];
  bestMatch: any | null;
  distinctNames: string[];
} {
  const cleanQ = query.trim().toLowerCase();
  const matched = (products || []).filter((p: any) => {
    const pName = p.name.trim().toLowerCase();
    return pName.includes(cleanQ) || cleanQ.includes(pName);
  });

  const exactMatches = matched.filter(
    (p: any) => p.name.trim().toLowerCase() === cleanQ
  );

  const distinctNames = Array.from(new Set(matched.map((m: any) => m.name.trim())));

  let bestMatch: any | null = null;
  if (exactMatches.length > 0) {
    // If duplicates exist with the exact same name, prefer the one with the most filled information
    bestMatch = exactMatches.sort((a, b) => {
      const scoreA =
        (a.storage_location ? 1 : 0) +
        (a.selling_price ? 1 : 0) +
        (a.current_stock > 0 ? 1 : 0);
      const scoreB =
        (b.storage_location ? 1 : 0) +
        (b.selling_price ? 1 : 0) +
        (b.current_stock > 0 ? 1 : 0);
      return scoreB - scoreA;
    })[0];
  } else if (distinctNames.length === 1 && matched.length > 0) {
    bestMatch = matched[0];
  } else if (matched.length === 1) {
    bestMatch = matched[0];
  }

  return {
    matched,
    bestMatch,
    distinctNames,
  };
}

// -------------------------------------------------------------
// Core Database Business Logic Functions
// -------------------------------------------------------------

export async function executeFindLocation(
  supabase: any,
  shopId: string,
  query: string
): Promise<AssistantExecutionResult> {
  const cleanQ = query.trim().toLowerCase();
  const { data: allProds } = await supabase
    .from("products")
    .select("id, name, brand, category, storage_location, current_stock, selling_price")
    .eq("shop_id", shopId);

  const resolution = resolveProductMatch(allProds || [], cleanQ);

  if (!resolution.bestMatch && resolution.matched.length === 0) {
    return {
      content: `Could not find any product matching "${query}". Check spelling or add it in the Products tab.`,
      taskType: "find_product",
      structuredData: { found: false, query },
    };
  }

  if (!resolution.bestMatch && resolution.distinctNames.length > 1) {
    const names = resolution.distinctNames.map((n) => `"${n}"`).join(", ");
    return {
      content: `Aapke paas multiple milte-julte items hain: ${names}. Kripya batayein aap kiska location dekhna chahte hain?`,
      taskType: "find_product",
      structuredData: { ambiguous: true, options: resolution.distinctNames },
    };
  }

  const p = resolution.bestMatch!;
  const loc = p.storage_location || "Not assigned yet";
  return {
    content: `**${p.name}** is located at: **${loc}** (Stock: ${p.current_stock} units).`,
    taskType: "find_product",
    structuredData: { found: true, product: p, location: loc },
  };
}

export async function executeCheckStock(
  supabase: any,
  shopId: string,
  query: string
): Promise<AssistantExecutionResult> {
  const cleanQ = query.trim().toLowerCase();
  const { data: products } = await supabase
    .from("products")
    .select("id, name, brand, category, current_stock, min_stock_threshold, stock_status, storage_location")
    .eq("shop_id", shopId);

  const resolution = resolveProductMatch(products || [], cleanQ);

  if (!resolution.bestMatch && resolution.matched.length === 0) {
    return {
      content: `No item found matching "${query}" to check stock.`,
      taskType: "check_stock",
      structuredData: { found: false, query },
    };
  }

  if (!resolution.bestMatch && resolution.distinctNames.length > 1) {
    const names = resolution.distinctNames.map((n) => `"${n}"`).join(", ");
    return {
      content: `Aapke paas multiple milte-julte items hain: ${names}. Kripya batayein aap kiska stock check karna chahte hain?`,
      taskType: "check_stock",
      structuredData: { ambiguous: true, options: resolution.distinctNames },
    };
  }

  const p = resolution.bestMatch!;
  const min = p.min_stock_threshold ?? 5;
  let statusBadge = "Healthy stock";
  if (p.current_stock <= 0) statusBadge = "⚠️ Out of Stock!";
  else if (p.current_stock <= min) statusBadge = "⚠️ Low Stock!";

  return {
    content: `Current stock of **${p.name}** is **${p.current_stock} units** (Min alert: ${min}). Status: **${statusBadge}**. Location: ${p.storage_location || "Shelf"}`,
    taskType: "check_stock",
    structuredData: { found: true, product: p, status: statusBadge },
  };
}

export async function executeGetLowStock(
  supabase: any,
  shopId: string
): Promise<AssistantExecutionResult> {
  const { data: products } = await supabase
    .from("products")
    .select("id, name, current_stock, min_stock_threshold, stock_status, storage_location")
    .eq("shop_id", shopId)
    .order("current_stock", { ascending: true });

  const lowStockItems = (products || []).filter((p: any) => {
    const min = p.min_stock_threshold ?? 5;
    return p.current_stock <= min || p.stock_status === "low_stock" || p.stock_status === "out_of_stock";
  });

  if (lowStockItems.length === 0) {
    return {
      content: "All products have **healthy stock**! Nothing is low or out of stock.",
      taskType: "low_stock",
      structuredData: { count: 0, items: [] },
    };
  }

  const namesList = lowStockItems
    .map((p: any) => `• **${p.name}**: ${p.current_stock} units left (Min: ${p.min_stock_threshold ?? 5})`)
    .slice(0, 5)
    .join("\n");

  const extraCount = lowStockItems.length > 5 ? `\n...and ${lowStockItems.length - 5} more items.` : "";

  return {
    content: `Found **${lowStockItems.length} products needing restock**:\n${namesList}${extraCount}`,
    taskType: "low_stock",
    structuredData: { count: lowStockItems.length, items: lowStockItems },
  };
}

export async function executeGetPriceHistory(
  supabase: any,
  shopId: string,
  query: string
): Promise<AssistantExecutionResult> {
  const cleanQ = query.trim().toLowerCase();
  const { data: products } = await supabase
    .from("products")
    .select("id, name, selling_price, cost_price, created_at")
    .eq("shop_id", shopId);

  const resolution = resolveProductMatch(products || [], cleanQ);

  if (!resolution.bestMatch && resolution.matched.length === 0) {
    return {
      content: `No recorded item found matching "${query}" for price lookup.`,
      taskType: "price_history",
      structuredData: { found: false },
    };
  }

  if (!resolution.bestMatch && resolution.distinctNames.length > 1) {
    const names = resolution.distinctNames.map((n) => `"${n}"`).join(", ");
    return {
      content: `Aapke paas multiple milte-julte items hain: ${names}. Kripya batayein aap kiska price dekhna chahte hain?`,
      taskType: "price_history",
      structuredData: { ambiguous: true, options: resolution.distinctNames },
    };
  }

  const p = resolution.bestMatch!;
  const sellPrice = p.selling_price !== null ? `₹${p.selling_price}` : "Not set";
  const costPrice = p.cost_price !== null ? `₹${p.cost_price}` : "Not set";

  // Check recent sales slip line for this product
  const { data: recentSales } = await supabase
    .from("sales_slip_lines")
    .select("unit_price, created_at")
    .eq("shop_id", shopId)
    .eq("product_id", p.id)
    .order("created_at", { ascending: false })
    .limit(1);

  let recentSaleText = "";
  if (recentSales && recentSales.length > 0 && recentSales[0].unit_price !== null) {
    const saleDate = new Date(recentSales[0].created_at).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });
    recentSaleText = ` Last recorded sale on ${saleDate} was at **₹${recentSales[0].unit_price}**.`;
  }

  return {
    content: `**${p.name}**:\n• Selling Price: **${sellPrice}**\n• Cost Price: **${costPrice}**${recentSaleText}`,
    taskType: "price_history",
    structuredData: { product: p, sellingPrice: p.selling_price, costPrice: p.cost_price },
  };
}



export async function executeProposeCreateProduct(
  supabase: any,
  shopId: string,
  params: {
    productName: string;
    openingStock?: number;
    sellingPrice?: number;
    costPrice?: number;
    category?: string;
    storageLocation?: string;
    reason?: string;
  }
): Promise<AssistantExecutionResult> {
  const cleanName = params.productName.trim();
  const stock = params.openingStock !== undefined && params.openingStock >= 0 ? params.openingStock : 1;
  const category = params.category || "General Store";

  // Check if product ALREADY exists in the shop catalog
  const { data: products } = await supabase
    .from("products")
    .select("id, name, storage_location, selling_price, cost_price, current_stock, category")
    .eq("shop_id", shopId);

  const resolution = resolveProductMatch(products || [], cleanName);

  if (resolution.bestMatch) {
    const existing = resolution.bestMatch;

    // Case 1: Location was provided (e.g. user said "Add a Nivea cream to the location of shelf 2")
    // Update the existing product's location instead of creating duplicate!
    if (params.storageLocation && params.storageLocation.trim()) {
      return executeProposeUpdateLocation(
        supabase,
        shopId,
        existing.name,
        params.storageLocation.trim()
      );
    }

    // Case 2: Price was provided (e.g. user said "Add Nivea cream with price 50" or "Change price of Nivea cream to 50")
    // Update the existing product's price instead of creating duplicate!
    if (params.sellingPrice !== undefined && params.sellingPrice !== null && Number(params.sellingPrice) > 0) {
      return executeProposeUpdatePrice(
        supabase,
        shopId,
        existing.name,
        Number(params.sellingPrice)
      );
    }

    // Case 3: Stock quantity was provided > 1 (e.g. user said "Add 5 Nivea cream")
    if (params.openingStock !== undefined && params.openingStock > 1) {
      return executeProposeStockAdjustment(
        supabase,
        shopId,
        existing.name,
        params.openingStock
      );
    }

    // Case 4: Item already exists without specific action -> Inform the user instead of duplicating!
    const locText = existing.storage_location
      ? `location: **${existing.storage_location}**`
      : "location: not set";
    const priceText = existing.selling_price
      ? `price: **₹${existing.selling_price}**`
      : "price: not set";

    return {
      content: `**${existing.name}** already aapki inventory mein hai (Stock: **${existing.current_stock} units**, ${locText}, ${priceText}). Naya product add karne ke bajaye, kya aap iska stock, location ya price update karna chahte hain?`,
      taskType: "check_stock",
      structuredData: {
        alreadyExists: true,
        product: existing,
      },
      pendingAction: null,
    };
  }

  if (resolution.distinctNames.length > 1) {
    const names = resolution.distinctNames.map((n) => `"${n}"`).join(", ");
    return {
      content: `Inventory mein multiple milte-julte items hain: ${names}. Kripya exact product ka naam batayein jise update karna hai, ya naya product add karein.`,
      taskType: "create_product",
      pendingAction: null,
    };
  }

  // Genuinely brand-new product not present in store
  return {
    content: `${cleanName} nahi mili. Maine ise catalog mein add karne ke liye details taiyaar kar di hain. Ek baar check kar lijiye.`,
    taskType: "create_product",
    structuredData: {
      productName: cleanName,
      openingStock: stock,
      sellingPrice: params.sellingPrice || null,
      costPrice: params.costPrice || null,
      category,
      storageLocation: params.storageLocation || null,
    },
    pendingAction: {
      actionType: "create_product",
      productName: cleanName,
      openingStock: stock,
      sellingPrice: params.sellingPrice || undefined,
      costPrice: params.costPrice || undefined,
      category,
      storageLocation: params.storageLocation || undefined,
      reason: params.reason || "voice_assistant_new_product",
    },
  };
}

export async function executeProposeStockAdjustment(
  supabase: any,
  shopId: string,
  productName: string,
  quantityDelta: number,
  reason?: string
): Promise<AssistantExecutionResult> {
  const { data: products } = await supabase
    .from("products")
    .select("id, name, current_stock, min_stock_threshold, storage_location, selling_price")
    .eq("shop_id", shopId);

  const resolution = resolveProductMatch(products || [], productName);

  if (!resolution.bestMatch && resolution.matched.length === 0) {
    if (quantityDelta > 0) {
      return executeProposeCreateProduct(supabase, shopId, {
        productName,
        openingStock: quantityDelta,
        reason,
      });
    }

    return {
      content: `Cannot deduct stock: Product "${productName}" was not found in your inventory.`,
      taskType: "adjust_stock",
      pendingAction: null,
    };
  }

  if (!resolution.bestMatch && resolution.distinctNames.length > 1) {
    const names = resolution.distinctNames.map((m: any) => `"${m}"`).join(", ");
    return {
      content: `Found multiple matching items: ${names}. Which one would you like to update?`,
      taskType: "adjust_stock",
      pendingAction: null,
    };
  }

  const p = resolution.bestMatch!;
  const currentStock = Number(p.current_stock) || 0;
  const newStock = Math.max(0, currentStock + quantityDelta);

  const deltaStr = quantityDelta > 0 ? `+${quantityDelta}` : `${quantityDelta}`;
  return {
    content: `Please confirm stock update for **${p.name}**:\nCurrent: **${currentStock}** ➔ New: **${newStock}** (${deltaStr} units). Tap Confirm to apply.`,
    taskType: "adjust_stock",
    pendingAction: {
      actionType: "adjust_stock",
      productId: p.id,
      productName: p.name,
      currentStock,
      quantityDelta,
      newStock,
      reason: reason || "voice_assistant_adjustment",
    },
  };
}

export async function executeGetInventorySummary(
  supabase: any,
  shopId: string
): Promise<AssistantExecutionResult> {
  const { data: products } = await supabase
    .from("products")
    .select("id, name, current_stock, min_stock_threshold, stock_status")
    .eq("shop_id", shopId);

  const list = products || [];
  // Distinct product catalog names (ignoring case & extra whitespace)
  const uniqueNames = new Set(list.map((p: any) => p.name.trim().toLowerCase()));
  const totalProducts = uniqueNames.size; // Distinct catalog products count!
  const totalUnits = list.reduce(
    (sum: number, p: any) => sum + (Number(p.current_stock) || 0),
    0
  );

  const lowStockCount = list.filter((p: any) => {
    const min = p.min_stock_threshold ?? 5;
    return p.current_stock <= min || p.stock_status === "low_stock" || p.stock_status === "out_of_stock";
  }).length;

  let extraNote = "Sabhi products healthy stock mein hain.";
  if (lowStockCount > 0) {
    extraNote = `${lowStockCount} products low stock par hain.`;
  }

  const content = `Aapki shop mein total **${totalProducts} products** hain (aur total inventory **${totalUnits} units** ka stock hai). ${extraNote}`;

  return {
    content,
    taskType: "inventory_summary",
    structuredData: {
      totalProducts,
      totalUnits,
      lowStockCount,
    },
  };
}

export async function executeProposeUpdateLocation(
  supabase: any,
  shopId: string,
  productName: string,
  newLocation: string
): Promise<AssistantExecutionResult> {
  const { data: products } = await supabase
    .from("products")
    .select("id, name, storage_location, selling_price, current_stock")
    .eq("shop_id", shopId);

  const resolution = resolveProductMatch(products || [], productName);

  if (!resolution.bestMatch && resolution.matched.length === 0) {
    return {
      content: `Product "${productName}" inventory mein nahi mila. Location update karne ke liye pehle ise add kar lijiye.`,
      taskType: "update_location",
      pendingAction: null,
    };
  }

  if (!resolution.bestMatch && resolution.distinctNames.length > 1) {
    const names = resolution.distinctNames.map((n) => `"${n}"`).join(", ");
    return {
      content: `Multiple items match "${productName}": ${names}. Kripya exact product ka naam batayein.`,
      taskType: "update_location",
      pendingAction: null,
    };
  }

  const p = resolution.bestMatch!;
  const currentLocation = p.storage_location || "Not assigned yet";
  const targetLoc = newLocation.trim();

  return {
    content: `${p.name} ki nayi location "${targetLoc}" set karne ke liye details taiyaar hain. Ek baar confirm kar lijiye.`,
    taskType: "update_location",
    structuredData: {
      productId: p.id,
      productName: p.name,
      currentLocation,
      newLocation: targetLoc,
    },
    pendingAction: {
      actionType: "update_location",
      productId: p.id,
      productName: p.name,
      currentLocation,
      newLocation: targetLoc,
    },
  };
}

export async function executeProposeUpdatePrice(
  supabase: any,
  shopId: string,
  productName: string,
  newPrice: number
): Promise<AssistantExecutionResult> {
  const { data: products } = await supabase
    .from("products")
    .select("id, name, storage_location, selling_price, current_stock")
    .eq("shop_id", shopId);

  const resolution = resolveProductMatch(products || [], productName);

  if (!resolution.bestMatch && resolution.matched.length === 0) {
    return {
      content: `Product "${productName}" inventory mein nahi mila. Price update karne ke liye pehle ise add kar lijiye.`,
      taskType: "update_price",
      pendingAction: null,
    };
  }

  if (!resolution.bestMatch && resolution.distinctNames.length > 1) {
    const names = resolution.distinctNames.map((n) => `"${n}"`).join(", ");
    return {
      content: `Multiple items match "${productName}": ${names}. Kripya exact product ka naam batayein.`,
      taskType: "update_price",
      pendingAction: null,
    };
  }

  const p = resolution.bestMatch!;
  const currentPrice =
    p.selling_price !== null && p.selling_price !== undefined
      ? Number(p.selling_price)
      : null;
  const currentPriceText = currentPrice !== null ? `₹${currentPrice}` : "Not set";

  return {
    content: `${p.name} ka selling price (${currentPriceText} se badal kar ₹${newPrice}) set karne ke liye details taiyaar hain. Ek baar confirm kar lijiye.`,
    taskType: "update_price",
    structuredData: {
      productId: p.id,
      productName: p.name,
      currentPrice,
      newPrice,
    },
    pendingAction: {
      actionType: "update_price",
      productId: p.id,
      productName: p.name,
      currentPrice,
      newPrice,
    },
  };
}

// -------------------------------------------------------------
// Helper: Parse Date Range for Sales Queries
// -------------------------------------------------------------
export function parseDateRange(dateStr?: string): { startDate: string; endDate: string; label: string } {
  const now = new Date();
  if (!dateStr || dateStr.trim() === "" || dateStr.toLowerCase().includes("today") || dateStr.toLowerCase().includes("aaj")) {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    return { startDate: start.toISOString(), endDate: end.toISOString(), label: "Today" };
  }

  const clean = dateStr.trim().toLowerCase();

  if (clean.includes("yesterday") || clean.includes("kal")) {
    const y = new Date(now);
    y.setDate(y.getDate() - 1);
    const start = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 0, 0, 0, 0);
    const end = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 23, 59, 59, 999);
    return { startDate: start.toISOString(), endDate: end.toISOString(), label: "Yesterday" };
  }

  if (clean.includes("this month") || clean.includes("is mahine")) {
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const label = now.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
    return { startDate: start.toISOString(), endDate: end.toISOString(), label };
  }

  if (clean.includes("this week") || clean.includes("is hafte")) {
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    start.setHours(0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    return { startDate: start.toISOString(), endDate: end.toISOString(), label: "This Week" };
  }

  // Handle formats like "20th January 2026", "20 Jan 2026", "20/01/2026", "2026-01-20"
  // Strip ordinals 1st, 2nd, 3rd, 4th...
  const stripped = dateStr.replace(/(\d+)(st|nd|rd|th)/gi, "$1").trim();

  // Try parsing dd/mm/yyyy or dd-mm-yyyy
  const dmyMatch = stripped.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1;
    const year = parseInt(dmyMatch[3], 10);
    const start = new Date(year, month, day, 0, 0, 0, 0);
    const end = new Date(year, month, day, 23, 59, 59, 999);
    const label = start.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    return { startDate: start.toISOString(), endDate: end.toISOString(), label };
  }

  const parsed = new Date(stripped);
  if (!isNaN(parsed.getTime())) {
    const start = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 0, 0, 0, 0);
    const end = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 23, 59, 59, 999);
    const label = parsed.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    return { startDate: start.toISOString(), endDate: end.toISOString(), label };
  }

  // Fallback to recent 30 days
  const start = new Date(now);
  start.setDate(start.getDate() - 30);
  return { startDate: start.toISOString(), endDate: now.toISOString(), label: "Recent" };
}

// -------------------------------------------------------------
// Product Deletion Proposal
// -------------------------------------------------------------
export async function executeProposeDeleteProduct(
  supabase: any,
  shopId: string,
  productName: string
): Promise<AssistantExecutionResult> {
  const cleanName = productName.trim();
  const { data: products } = await supabase
    .from("products")
    .select("id, name, storage_location, selling_price, current_stock, category")
    .eq("shop_id", shopId);

  const resolution = resolveProductMatch(products || [], cleanName);

  if (!resolution.bestMatch && resolution.matched.length === 0) {
    return {
      content: `Product "${productName}" inventory mein nahi mila, isliye delete nahi kiya ja sakta.`,
      taskType: "delete_product",
      pendingAction: null,
    };
  }

  if (!resolution.bestMatch && resolution.distinctNames.length > 1) {
    const names = resolution.distinctNames.map((n) => `"${n}"`).join(", ");
    return {
      content: `Aapke paas multiple milte-julte items hain: ${names}. Kripya exact product ka naam batayein jise delete karna hai.`,
      taskType: "delete_product",
      structuredData: { ambiguous: true, options: resolution.distinctNames },
      pendingAction: null,
    };
  }

  const p = resolution.bestMatch!;
  const currentStock = Number(p.current_stock) || 0;

  return {
    content: `⚠️ **${p.name}** ko inventory catalog se permanently delete karne ke liye confirmation chahiye (Current stock: **${currentStock} units**). Niche Confirm par tap karein.`,
    taskType: "delete_product",
    structuredData: {
      productId: p.id,
      productName: p.name,
      currentStock,
      storageLocation: p.storage_location,
    },
    pendingAction: {
      actionType: "delete_product",
      productId: p.id,
      productName: p.name,
      currentStock,
      storageLocation: p.storage_location,
      sellingPrice: p.selling_price,
    },
  };
}

// -------------------------------------------------------------
// Sales Recording Proposal ("Today I sold 5 Lakme items at 50")
// -------------------------------------------------------------
export async function executeProposeRecordSale(
  supabase: any,
  shopId: string,
  params: {
    productName: string;
    quantity?: number;
    unitPrice?: number;
    notes?: string;
  }
): Promise<AssistantExecutionResult> {
  const cleanName = params.productName.trim();
  const quantity = params.quantity && params.quantity > 0 ? params.quantity : 1;

  const { data: products } = await supabase
    .from("products")
    .select("id, name, storage_location, selling_price, cost_price, current_stock, category")
    .eq("shop_id", shopId);

  const resolution = resolveProductMatch(products || [], cleanName);

  if (!resolution.bestMatch && resolution.matched.length === 0) {
    // Uncataloged / Custom item: Retailers frequently sell unlinked items (e.g. bangles, loose goods, milk)
    // We allow recording it as an Unlinked / Custom Item Sale without requiring prior catalog entry.
    const unitPrice =
      params.unitPrice !== undefined && params.unitPrice > 0
        ? params.unitPrice
        : 0;
    const totalAmount = quantity * unitPrice;
    const priceText =
      unitPrice > 0
        ? `₹${unitPrice} each (Total ₹${totalAmount})`
        : "₹0 (Card par price enter kar sakte hain)";

    return {
      content: `"${cleanName}" inventory catalog mein nahi mila, lekin ise **Unlinked / Custom Sale** ke roop mein sales slip mein add kiya ja sakta hai:\n• Item: **${quantity}x ${cleanName}** (↔ Unlinked Item)\n• Price: **${priceText}**\n• Stock: *Uncataloged (No inventory stock deduction)*\n\nNiche confirm par tap karke ise sales slip aur earnings history mein add karein.`,
      taskType: "record_sale",
      structuredData: {
        productId: null,
        productName: cleanName,
        quantity,
        unitPrice,
        totalAmount,
        currentStock: null,
        newStock: null,
        isUnlinked: true,
      },
      pendingAction: {
        actionType: "record_sale",
        productId: undefined,
        productName: cleanName,
        quantity,
        unitPrice,
        totalAmount,
        currentStock: null,
        newStock: null,
        isUnlinked: true,
        reason: params.notes || "Unlinked/Custom Counter Sale",
      },
    };
  }

  if (!resolution.bestMatch && resolution.distinctNames.length > 1) {
    const names = resolution.distinctNames.map((n) => `"${n}"`).join(", ");
    return {
      content: `Aapke paas multiple milte-julte items hain: ${names}. Kripya exact product batayein jo aapne becha hai.`,
      taskType: "record_sale",
      structuredData: { ambiguous: true, options: resolution.distinctNames },
      pendingAction: null,
    };
  }

  const p = resolution.bestMatch!;
  const currentStock = Number(p.current_stock) || 0;
  const unitPrice =
    params.unitPrice !== undefined && params.unitPrice > 0
      ? params.unitPrice
      : p.selling_price !== null && p.selling_price !== undefined
      ? Number(p.selling_price)
      : 0;

  const totalAmount = quantity * unitPrice;
  const newStock = Math.max(0, currentStock - quantity);

  let warning = "";
  if (currentStock < quantity) {
    warning = ` (⚠️ Note: Current stock is only ${currentStock} units; selling ${quantity} will deplete stock to 0).`;
  }

  const priceText = unitPrice > 0 ? `₹${unitPrice} each, Total ₹${totalAmount}` : `Total ₹${totalAmount}`;

  return {
    content: `Sale record karne ke liye details taiyaar hain:\n• Item: **${quantity}x ${p.name}**\n• Price: **${priceText}**\n• Stock update: **${currentStock} ➔ ${newStock} units**${warning}\n\nConfirm par tap karke sales slip generate karein aur stock deduct karein.`,
    taskType: "record_sale",
    structuredData: {
      productId: p.id,
      productName: p.name,
      quantity,
      unitPrice,
      totalAmount,
      currentStock,
      newStock,
    },
    pendingAction: {
      actionType: "record_sale",
      productId: p.id,
      productName: p.name,
      quantity,
      unitPrice,
      totalAmount,
      currentStock,
      newStock,
      isUnlinked: false,
      reason: params.notes || "counter_sale",
    },
  };
}

// -------------------------------------------------------------
// Sales History & Earnings Lookup
// -------------------------------------------------------------
export async function executeGetSalesHistory(
  supabase: any,
  shopId: string,
  dateQuery?: string
): Promise<AssistantExecutionResult> {
  const { startDate, endDate, label } = parseDateRange(dateQuery);

  const { data: slips, error: slipsErr } = await (supabase
    .from("sales_slips") as any)
    .select("id, slip_number, slip_date, total_amount, total_items, status, created_at")
    .eq("shop_id", shopId)
    .gte("created_at", startDate)
    .lte("created_at", endDate)
    .order("created_at", { ascending: false });

  if (slipsErr) {
    return {
      content: `Sales history load karne mein dikkat aayi: ${slipsErr.message}`,
      taskType: "sales_history",
      structuredData: { error: slipsErr.message },
    };
  }

  const slipList = slips || [];
  const slipCount = slipList.length;

  if (slipCount === 0) {
    return {
      content: `**${label}** ko koi sales record nahi hui (Total Sales: **₹0**, 0 slips).`,
      taskType: "sales_history",
      structuredData: {
        dateLabel: label,
        totalEarnings: 0,
        slipCount: 0,
        unitsSold: 0,
      },
    };
  }

  const totalEarnings = slipList.reduce(
    (sum: number, s: any) => sum + (Number(s.total_amount) || 0),
    0
  );

  const slipIds = slipList.map((s: any) => s.id);
  const { data: lines } = await (supabase
    .from("sales_slip_lines") as any)
    .select("raw_item_name, quantity, unit_price, subtotal")
    .in("slip_id", slipIds);

  const linesList = lines || [];
  const totalUnitsSold = linesList.reduce(
    (sum: number, l: any) => sum + (Number(l.quantity) || 0),
    0
  );

  const itemCounts: Record<string, number> = {};
  for (const l of linesList) {
    const name = l.raw_item_name || "Item";
    itemCounts[name] = (itemCounts[name] || 0) + (Number(l.quantity) || 0);
  }

  const topItems = Object.entries(itemCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([name, qty]) => `${qty}x ${name}`)
    .join(", ");

  const itemsBreakdown = topItems ? `\n• Items sold: **${topItems}**` : "";

  const content = `**${label} Sales Report**:\n• Total Earnings: **₹${totalEarnings.toLocaleString("en-IN")}**\n• Total Slips: **${slipCount} bills**\n• Total Units Sold: **${totalUnitsSold} items**${itemsBreakdown}`;

  return {
    content,
    taskType: "sales_history",
    structuredData: {
      dateLabel: label,
      totalEarnings,
      slipCount,
      totalUnitsSold,
      topItems,
    },
  };
}

// -------------------------------------------------------------
// Restock Orders & History Lookup
// -------------------------------------------------------------
export async function executeGetRestockOrdersSummary(
  supabase: any,
  shopId: string,
  queryType?: string
): Promise<AssistantExecutionResult> {
  const [ordersRes, itemsRes, productsRes] = await Promise.all([
    (supabase.from("restock_orders") as any)
      .select("*")
      .eq("shop_id", shopId)
      .order("created_at", { ascending: false }),
    (supabase.from("restock_order_items") as any)
      .select("*")
      .eq("shop_id", shopId)
      .order("created_at", { ascending: false }),
    (supabase.from("products") as any)
      .select("id, name, current_stock, min_stock_threshold, stock_status")
      .eq("shop_id", shopId),
  ]);

  const orders = (ordersRes.data || []) as any[];
  const items = (itemsRes.data || []) as any[];
  const products = (productsRes.data || []) as any[];

  const waitingOrders = orders.filter((o) => o.status === "ordered" || o.status === "draft");
  const deliveredOrders = orders.filter((o) => o.status === "received");
  const cancelledOrders = orders.filter((o) => o.status === "cancelled");

  const waitingUnits = items
    .filter((it) => it.status === "pending" || waitingOrders.some((o) => o.id === it.order_id && o.status === "ordered"))
    .reduce((sum, it) => sum + (Number(it.ordered_quantity) || 0), 0);

  const deliveredUnits = items
    .filter((it) => it.status === "received" || deliveredOrders.some((o) => o.id === it.order_id))
    .reduce((sum, it) => sum + (Number(it.received_quantity || it.ordered_quantity) || 0), 0);

  const cancelledUnits = items
    .filter((it) => it.status === "cancelled" || cancelledOrders.some((o) => o.id === it.order_id))
    .reduce((sum, it) => sum + (Number(it.ordered_quantity) || 0), 0);

  const pendingProductIds = new Set(
    items.filter((it) => it.status === "pending").map((it) => it.product_id)
  );

  const lowStockItems = products.filter((p) => {
    const min = p.min_stock_threshold ?? 5;
    return (Number(p.current_stock) <= min || p.stock_status === "low_stock" || p.stock_status === "out_of_stock");
  });

  const unOrderedLowStock = lowStockItems.filter((p) => !pendingProductIds.has(p.id));
  const qType = (queryType || "").toLowerCase();

  // 1. Cancelled Orders
  if (qType.includes("cancel")) {
    if (cancelledOrders.length === 0) {
      return {
        content: "Aapke paas **koi cancelled order nahi hai**. Sabhi orders active ya delivered hain.",
        taskType: "restock_orders",
        structuredData: { count: 0, orders: [] },
      };
    }

    const cancelledList = cancelledOrders
      .slice(0, 4)
      .map((o) => `• Slip **#${o.order_number}** (${o.total_units} units) - ${o.distributor_name || "Supplier"}`)
      .join("\n");

    return {
      content: `Aapke total **${cancelledOrders.length} orders cancel** hue hain (${cancelledUnits} units):\n${cancelledList}`,
      taskType: "restock_orders",
      structuredData: { count: cancelledOrders.length, units: cancelledUnits, orders: cancelledOrders },
    };
  }

  // 2. Waiting Orders
  if (qType.includes("waiting") || qType.includes("pending")) {
    if (waitingOrders.length === 0) {
      return {
        content: "Filhal **koi order waiting nahi hai**. Sabhi pichhle orders deliver ho chuke hain.",
        taskType: "restock_orders",
        structuredData: { count: 0, orders: [] },
      };
    }

    const waitingList = waitingOrders
      .slice(0, 4)
      .map((o) => `• Slip **#${o.order_number}**: ${o.total_units} units waiting (${o.distributor_name || "Supplier"})`)
      .join("\n");

    return {
      content: `Aapke **${waitingOrders.length} restock orders waiting** par hain (Total **${waitingUnits} units** aane baaki hain):\n${waitingList}`,
      taskType: "restock_orders",
      structuredData: { count: waitingOrders.length, units: waitingUnits, orders: waitingOrders },
    };
  }

  // 3. Delivered Orders
  if (qType.includes("deliver") || qType.includes("arrived")) {
    if (deliveredOrders.length === 0) {
      return {
        content: "Abhi tak koi order delivered mark nahi hua hai.",
        taskType: "restock_orders",
        structuredData: { count: 0, orders: [] },
      };
    }

    return {
      content: `Total **${deliveredOrders.length} restock orders deliver** ho chuke hain (Total **${deliveredUnits} units** inventory mein add ho chuke hain).`,
      taskType: "restock_orders",
      structuredData: { count: deliveredOrders.length, units: deliveredUnits },
    };
  }

  // 4. Do I need to place a new order?
  if (qType.includes("need") || qType.includes("new order") || qType.includes("zarurat")) {
    if (unOrderedLowStock.length === 0) {
      if (waitingOrders.length > 0) {
        return {
          content: `Abhi naya order karne ki zarurat nahi hai. Jo items kam the, unke **${waitingOrders.length} orders already waiting** par hain.`,
          taskType: "restock_orders",
          structuredData: { needsReorder: false },
        };
      }
      return {
        content: "Aapke sabhi products ka stock healthy hai! Abhi naya restock order place karne ki zarurat nahi hai.",
        taskType: "restock_orders",
        structuredData: { needsReorder: false },
      };
    }

    const itemsNeeded = unOrderedLowStock
      .slice(0, 5)
      .map((p) => `• **${p.name}**: ${p.current_stock} bache hain (Min: ${p.min_stock_threshold ?? 5})`)
      .join("\n");

    return {
      content: `⚠️ **Haan, aapko naya restock order karna chahiye!**\nIn items ka stock kam hai aur inka koi pending order nahi hai:\n${itemsNeeded}\n\nAap Restock tab se inka order create kar sakte hain.`,
      taskType: "restock_orders",
      structuredData: { needsReorder: true, items: unOrderedLowStock },
    };
  }

  // 5. General Comprehensive Restock Overview
  let orderAdvice = "Sabhi stock safe hai.";
  if (unOrderedLowStock.length > 0) {
    orderAdvice = `⚠️ **${unOrderedLowStock.length} items** ka stock low hai jinhe restock order karne ki zarurat hai.`;
  }

  const content = `**Restock & Orders Summary**:\n• ⏳ **Waiting**: ${waitingOrders.length} orders (${waitingUnits} units aane baaki)\n• ✅ **Delivered**: ${deliveredOrders.length} orders (${deliveredUnits} units received)\n• ❌ **Cancelled**: ${cancelledOrders.length} orders (${cancelledUnits} units)\n\n${orderAdvice}`;

  return {
    content,
    taskType: "restock_orders",
    structuredData: {
      waitingCount: waitingOrders.length,
      waitingUnits,
      deliveredCount: deliveredOrders.length,
      deliveredUnits,
      cancelledCount: cancelledOrders.length,
      cancelledUnits,
      needsReorderCount: unOrderedLowStock.length,
    },
  };
}

// -------------------------------------------------------------
// Propose Record Order Arrival
// -------------------------------------------------------------
export async function executeProposeRecordArrival(
  supabase: any,
  shopId: string,
  params: {
    orderNumber?: string;
    productName?: string;
    quantity?: number;
  }
): Promise<AssistantExecutionResult> {
  const { data: items, error } = await (supabase
    .from("restock_order_items") as any)
    .select("id, order_id, product_id, product_name, ordered_quantity, status, restock_orders!inner(order_number, status)")
    .eq("shop_id", shopId)
    .eq("status", "pending");

  if (error || !items || items.length === 0) {
    return {
      content: "Koi pending restock order nahi mila jiska arrival record kiya ja sake.",
      taskType: "record_order_arrival",
      pendingAction: null,
    };
  }

  let targetItem: any = null;

  if (params.orderNumber) {
    const cleanNum = params.orderNumber.trim().toLowerCase();
    targetItem = items.find((it: any) =>
      it.restock_orders.order_number.toLowerCase().includes(cleanNum)
    );
  }

  if (!targetItem && params.productName) {
    const cleanName = params.productName.trim().toLowerCase();
    const matched = items.filter((it: any) =>
      it.product_name.toLowerCase().includes(cleanName)
    );

    if (matched.length > 1) {
      const names = matched.map((m: any) => `"${m.product_name}" (Slip #${m.restock_orders.order_number})`).join(", ");
      return {
        content: `Multiple pending deliveries mili hain: ${names}. Kripya exact item ya slip number batayein.`,
        taskType: "record_order_arrival",
        structuredData: { ambiguous: true, options: matched },
        pendingAction: null,
      };
    }
    if (matched.length === 1) {
      targetItem = matched[0];
    }
  }

  if (!targetItem && items.length === 1) {
    targetItem = items[0];
  }

  if (!targetItem) {
    return {
      content: `Pending order item "${params.productName || params.orderNumber || ""}" nahi mila. Kripya Restock tab mein slip number check karein.`,
      taskType: "record_order_arrival",
      pendingAction: null,
    };
  }

  const { data: prod } = await (supabase.from("products") as any)
    .select("current_stock")
    .eq("id", targetItem.product_id)
    .single();

  const currentStock = Number(prod?.current_stock) || 0;
  const receivedQty = params.quantity && params.quantity > 0 ? params.quantity : targetItem.ordered_quantity;
  const newStock = currentStock + receivedQty;

  return {
    content: `Delivery record karne ke liye details taiyaar hain:\n• Order: **Slip #${targetItem.restock_orders.order_number}**\n• Item: **${targetItem.product_name}**\n• Arrived Quantity: **+${receivedQty} units**\n• Stock Update: **${currentStock} ➔ ${newStock} units**\n\nConfirm par tap karke stock update karein.`,
    taskType: "record_order_arrival",
    structuredData: {
      orderItemId: targetItem.id,
      productId: targetItem.product_id,
      productName: targetItem.product_name,
      orderNumber: targetItem.restock_orders.order_number,
      receivedQuantity: receivedQty,
      currentStock,
      newStock,
    },
    pendingAction: {
      actionType: "record_order_arrival",
      orderItemId: targetItem.id,
      productId: targetItem.product_id,
      productName: targetItem.product_name,
      orderNumber: targetItem.restock_orders.order_number,
      receivedQuantity: receivedQty,
      currentStock,
      newStock,
    },
  };
}

// -------------------------------------------------------------
// Fast Local Intent Matcher (0 Tokens, Zero-Latency Fallback)
// -------------------------------------------------------------
export function matchLocalIntent(query: string) {
  const q = query.toLowerCase().trim();

  // 1. Delete Product: "delete product lakme", "lakme ko delete kar do", "delete lakme"
  const delMatch1 = q.match(/(?:delete|remove) (?:product |item )?(.+?)(?: ko delete kar do| delete karo| hata do)?$/i);
  if (q.startsWith("delete ") || q.startsWith("remove ") || q.includes(" ko delete kar do") || q.includes(" delete karo")) {
    const item = q
      .replace(/^delete (?:product |item )?/i, "")
      .replace(/^remove (?:product |item )?/i, "")
      .replace(/ ko delete kar do/i, "")
      .replace(/ delete karo/i, "")
      .replace(/ hata do/i, "")
      .replace(/\?/g, "")
      .trim();
    if (item && !item.includes("order")) {
      return { intent: "delete_product", target: item };
    }
  }

  // 2. Sales recording: "today i sold 5 lakme items", "sold 5 lakme at 50", "5 lakme beche"
  const saleMatch1 = q.match(/(?:today )?(?:i )?sold (\d+) (?:units |packets |pieces |items )?(?:of )?(.+?)(?: at | for | @ | me | mein )?(?:rs\.?|₹)?\s*(\d+(?:\.\d+)?)?$/i);
  if (saleMatch1) {
    const qty = parseInt(saleMatch1[1], 10);
    const prod = saleMatch1[2].replace(/ items?| units?| packets?| pieces?/gi, "").trim();
    const price = saleMatch1[3] ? parseFloat(saleMatch1[3]) : undefined;
    return { intent: "record_sale", quantity: qty, target: prod, unitPrice: price };
  }

  const saleMatch2 = q.match(/(\d+) (.+?) (?:beche|becha|sell kiya|sale kiya)/i);
  if (saleMatch2) {
    const qty = parseInt(saleMatch2[1], 10);
    const prod = saleMatch2[2].replace(/ items?| units?| packets?| pieces?/gi, "").trim();
    return { intent: "record_sale", quantity: qty, target: prod };
  }

  // 2c. Hindi / Hinglish sales: "maine abhi-abhi ... bechi hai", "use sale me add kar"
  const hindiSaleMatch = q.match(/(?:maine |mene |humne )?(?:abhi[- ]abhi )?(.+?) (?:bechi|becha|beche|bika|biki|sell kiya|sale kiya)(?: hai| tha)?/i);
  if (hindiSaleMatch) {
    let rawItem = hindiSaleMatch[1]
      .replace(/^(?:aaj |today |abhi[- ]abhi |maine |mene )+/gi, "")
      .replace(/use sale me add kar.*|use sale mein.*|sale me add kar.*|sale mein daal.*/gi, "")
      .trim();
    let qty = 1;
    const qtyMatch = rawItem.match(/^(\d+)\s+(.+)/);
    if (qtyMatch) {
      qty = parseInt(qtyMatch[1], 10);
      rawItem = qtyMatch[2];
    }
    let unitPrice: number | undefined = undefined;
    const priceMatch = rawItem.match(/(?:for|at|rs\.?|₹|rupaye me|me|mein)\s*(\d+(?:\.\d+)?)/i);
    if (priceMatch) {
      unitPrice = parseFloat(priceMatch[1]);
      rawItem = rawItem.replace(/(?:for|at|rs\.?|₹|rupaye me|me|mein)\s*(\d+(?:\.\d+)?)/gi, "").trim();
    }
    if (rawItem.length > 1) {
      return { intent: "record_sale", quantity: qty, target: rawItem, unitPrice };
    }
  }

  // 2d. Explicit add to sale: "add to sale...", "sale me add kar...", "use sale me add kar"
  const saleAddMatch = q.match(/(?:add to sale|sale me add|sale mein add|bikri me add|sale me daal|sale mein daal|use sale me add) (?:kar |karo |kar do |karein )?(.+)/i);
  if (saleAddMatch) {
    let rawItem = saleAddMatch[1].trim();
    let qty = 1;
    const qtyMatch = rawItem.match(/^(\d+)\s+(.+)/);
    if (qtyMatch) {
      qty = parseInt(qtyMatch[1], 10);
      rawItem = qtyMatch[2];
    }
    return { intent: "record_sale", quantity: qty, target: rawItem };
  }

  // 3. Sales History & Earnings: "on 20th january 2026 how much money did i earn", "how much sales happened on 20th january", "today sales", "kitni sale hui"
  if (
    q.includes("how much money did i earn") ||
    q.includes("how much sales") ||
    q.includes("kitni kamai") ||
    q.includes("kitni sale") ||
    q.includes("sales happened") ||
    q.startsWith("sales on ") ||
    q.startsWith("earnings on ") ||
    q.includes("today sales") ||
    q.includes("today's sales") ||
    q.includes("aaj ki sale")
  ) {
    // Extract date if present
    let datePart = "";
    const onDateMatch = q.match(/(?:on |for |tarikh )([0-9a-zA-Z\s\/\-]+)/i);
    if (onDateMatch) {
      datePart = onDateMatch[1].replace(/how much.+|kitni.+|\?/gi, "").trim();
    } else if (q.includes("yesterday") || q.includes("kal")) {
      datePart = "yesterday";
    } else {
      datePart = "today";
    }
    return { intent: "sales_history", dateQuery: datePart };
  }

  // 4. Restock Queries
  if (q.includes("cancel order") || q.includes("cancelled order") || q.includes("cancelled orders")) {
    return { intent: "restock_orders", queryType: "cancelled" };
  }

  if (
    q.includes("is any order waiting") ||
    q.includes("waiting order") ||
    q.includes("waiting orders") ||
    q.includes("pending order") ||
    q.includes("pending orders") ||
    q.includes("order waiting")
  ) {
    return { intent: "restock_orders", queryType: "waiting" };
  }

  if (
    q.includes("orders are delivered") ||
    q.includes("how many orders are delivered") ||
    q.includes("how many orders delivered") ||
    q.includes("delivered order") ||
    q.includes("delivered orders")
  ) {
    return { intent: "restock_orders", queryType: "delivered" };
  }

  if (
    q.includes("do i also need to do any new order") ||
    q.includes("do i need to do any new order") ||
    q.includes("do i need to make a new order") ||
    q.includes("need to order") ||
    q.includes("kya naya order karna") ||
    q.includes("naya order karna hai")
  ) {
    return { intent: "restock_orders", queryType: "needs_reorder" };
  }

  if (
    q.includes("how many items and number of units arrived") ||
    q.includes("units arrived") ||
    q.includes("restock status") ||
    q.includes("orders summary")
  ) {
    return { intent: "restock_orders", queryType: "all" };
  }

  // 5. Location intent: "where is lakme", "location of tata tea", "lakme kahan hai"
  if (
    q.startsWith("where is ") ||
    q.startsWith("location of ") ||
    q.includes(" kahan hai") ||
    q.includes(" kahan rakha") ||
    q.includes("kidhar hai")
  ) {
    const item = q
      .replace(/^where is /i, "")
      .replace(/^location of /i, "")
      .replace(/ kahan hai/i, "")
      .replace(/ kahan rakha hai/i, "")
      .replace(/ kahan rakha/i, "")
      .replace(/ kidhar hai/i, "")
      .replace(/\?/g, "")
      .trim();
    return { intent: "find_location", target: item };
  }

  // 6. Low stock: "what is low on stock", "low stock", "kya khatam hai"
  if (
    q.includes("low stock") ||
    q.includes("out of stock") ||
    q.includes("what needs reorder") ||
    q.includes("depleted") ||
    q.includes("khatam") ||
    q.includes("kam stock")
  ) {
    return { intent: "low_stock", target: "" };
  }

  // 7. Stock check: "stock of maggi", "how much maggi is left", "maggi kitna hai"
  if (
    q.startsWith("stock of ") ||
    q.startsWith("check stock of ") ||
    q.startsWith("how much ") ||
    q.includes(" stock") ||
    q.includes(" kitna hai") ||
    q.includes(" kitna bacha")
  ) {
    const item = q
      .replace(/^check stock of /i, "")
      .replace(/^stock of /i, "")
      .replace(/^how much /i, "")
      .replace(/ is left/i, "")
      .replace(/ stock/i, "")
      .replace(/ kitna hai/i, "")
      .replace(/ kitna bacha hai/i, "")
      .replace(/ kitna bacha/i, "")
      .replace(/\?/g, "")
      .trim();
    return { intent: "check_stock", target: item };
  }

  // 8. Price history: "price of colgate", "selling price of lakme", "rate of maggi"
  if (
    q.startsWith("price of ") ||
    q.startsWith("rate of ") ||
    q.startsWith("selling price of ") ||
    q.includes(" ka price") ||
    q.includes(" ka rate") ||
    q.includes(" kitne ka hai")
  ) {
    const item = q
      .replace(/^selling price of /i, "")
      .replace(/^price of /i, "")
      .replace(/^rate of /i, "")
      .replace(/ ka price/i, "")
      .replace(/ ka rate/i, "")
      .replace(/ kitne ka hai/i, "")
      .replace(/\?/g, "")
      .trim();
    return { intent: "price_history", target: item };
  }

  // 9. Stock adjust: "add 10 to maggi", "deduct 2 lakme", "maggi mein 5 jodo"
  const addMatch = q.match(/add (\d+) (?:units |packets |pieces )?(?:to )?(.+)/i);
  if (addMatch) {
    return {
      intent: "adjust_stock",
      delta: parseInt(addMatch[1], 10),
      target: addMatch[2].replace(/\?/g, "").trim(),
    };
  }

  const deductMatch = q.match(/(?:deduct|remove) (\d+) (?:units |packets |pieces )?(?:from )?(.+)/i);
  if (deductMatch) {
    return {
      intent: "adjust_stock",
      delta: -parseInt(deductMatch[1], 10),
      target: deductMatch[2].replace(/\?/g, "").trim(),
    };
  }

  // 10. Create product intent: "add new product xyz", "naya product xyz add karo", "naya item xyz"
  const newProductMatch = q.match(/(?:add new product|add new item|naya product|naya item) (.+)/i);
  if (newProductMatch) {
    return {
      intent: "create_product",
      target: newProductMatch[1].replace(/\?/g, "").trim(),
    };
  }

  // 11. Inventory Summary / Total Products count
  if (
    q.includes("total product") ||
    q.includes("total products") ||
    q.includes("kitne product") ||
    q.includes("kitne items") ||
    q.includes("how many products") ||
    q.includes("how many total products") ||
    q.includes("inventory summary")
  ) {
    return { intent: "inventory_summary", target: "" };
  }

  // 12. Update Location
  const locMatch1 = q.match(/(?:update|change|set|add) (?:the )?(?:storage )?location (?:of )?(.+?) (?:to|at|in|as) (.+)/i);
  if (locMatch1) {
    return {
      intent: "update_location",
      target: locMatch1[1].trim(),
      newLocation: locMatch1[2].replace(/\?/g, "").trim(),
    };
  }
  const locMatchAdd = q.match(/(?:add|put|place|set) (?:a |an )?(.+?) (?:to the location of|to location|in location|at location|to shelf|in shelf|at shelf|to drawer|in drawer|at drawer|in rack|to rack|at rack) (.+)/i);
  if (locMatchAdd) {
    return {
      intent: "update_location",
      target: locMatchAdd[1].trim(),
      newLocation: locMatchAdd[2].replace(/\?/g, "").trim(),
    };
  }
  const locMatch2 = q.match(/(.+) (?:ki|ka) location (.+) (?:kar do|rakh do|set karo|karo)/i);
  if (locMatch2) {
    return {
      intent: "update_location",
      target: locMatch2[1].trim(),
      newLocation: locMatch2[2].replace(/\?/g, "").trim(),
    };
  }

  // 13. Update Price
  const priceMatch1 = q.match(/(?:update|change|set|add) (?:the )?price (?:of )?(.+?) (?:to|as) (?:rs\.?|₹)?\s*(\d+(?:\.\d+)?)/i);
  if (priceMatch1) {
    return {
      intent: "update_price",
      target: priceMatch1[1].trim(),
      newPrice: parseFloat(priceMatch1[2]),
    };
  }
  const priceMatchAdd = q.match(/(?:add|set|put) price (?:of )?(?:rs\.?|₹)?\s*(\d+(?:\.\d+)?) (?:to|for) (.+)/i);
  if (priceMatchAdd) {
    return {
      intent: "update_price",
      target: priceMatchAdd[2].trim(),
      newPrice: parseFloat(priceMatchAdd[1]),
    };
  }
  const priceMatchDirect = q.match(/(?:set|add|change) (?:the )?(.+?) price (?:to|as) (?:rs\.?|₹)?\s*(\d+(?:\.\d+)?)/i);
  if (priceMatchDirect) {
    return {
      intent: "update_price",
      target: priceMatchDirect[1].trim(),
      newPrice: parseFloat(priceMatchDirect[2]),
    };
  }
  const priceMatch2 = q.match(/(.+) (?:ka|ki) (?:price|rate) (?:rs\.?|₹)?\s*(\d+(?:\.\d+)?) (?:kar do|rakh do|karo)/i);
  if (priceMatch2) {
    return {
      intent: "update_price",
      target: priceMatch2[1].trim(),
      newPrice: parseFloat(priceMatch2[2]),
    };
  }

  return null;
}


