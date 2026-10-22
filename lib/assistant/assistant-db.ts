import type { SupabaseClient } from "@supabase/supabase-js";

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
    | "inventory_summary"
    | "general";
  structuredData?: any;
  pendingAction?: {
    actionType:
      | "adjust_stock"
      | "create_product"
      | "update_location"
      | "update_price";
    productId?: string;
    productName: string;
    currentStock?: number;
    quantityDelta?: number;
    newStock?: number;
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
  } | null;
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
  const { data: products } = await supabase
    .from("products")
    .select("id, name, brand, category, storage_location, current_stock, selling_price")
    .eq("shop_id", shopId)
    .ilike("name", `%${cleanQ}%`);

  if (!products || products.length === 0) {
    // Try broader search
    const { data: allProds } = await supabase
      .from("products")
      .select("id, name, brand, category, storage_location, current_stock, selling_price")
      .eq("shop_id", shopId)
      .limit(50);

    const match = allProds?.filter(
      (p: any) =>
        p.name.toLowerCase().includes(cleanQ) ||
        (p.brand && p.brand.toLowerCase().includes(cleanQ)) ||
        (p.storage_location && p.storage_location.toLowerCase().includes(cleanQ))
    );

    if (!match || match.length === 0) {
      return {
        content: `Could not find any product matching "${query}". Check spelling or add it in the Products tab.`,
        taskType: "find_product",
        structuredData: { found: false, query },
      };
    }

    const p = match[0];
    const loc = p.storage_location || "Not assigned yet";
    return {
      content: `**${p.name}** is stored at: **${loc}** (Stock: ${p.current_stock} units).`,
      taskType: "find_product",
      structuredData: { found: true, product: p, location: loc },
    };
  }

  const p = products[0];
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

  const matched = (products || []).filter(
    (p: any) =>
      p.name.toLowerCase().includes(cleanQ) ||
      (p.brand && p.brand.toLowerCase().includes(cleanQ))
  );

  if (matched.length === 0) {
    return {
      content: `No item found matching "${query}" to check stock.`,
      taskType: "check_stock",
      structuredData: { found: false, query },
    };
  }

  const p = matched[0];
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

  const matched = (products || []).filter((p: any) =>
    p.name.toLowerCase().includes(cleanQ)
  );

  if (matched.length === 0) {
    return {
      content: `No recorded item found matching "${query}" for price lookup.`,
      taskType: "price_history",
      structuredData: { found: false },
    };
  }

  const p = matched[0];
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


// Fast Local Intent Matcher (0 Tokens, Zero-Latency Fallback)
export function matchLocalIntent(query: string) {
  const q = query.toLowerCase().trim();

  // 1. Location intent: "where is lakme", "location of tata tea", "lakme kahan hai"
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

  // 2. Stock check: "stock of maggi", "how much maggi is left", "maggi kitna hai"
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

  // 3. Low stock: "what is low on stock", "low stock", "kya khatam hai"
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

  // 4. Price history: "price of colgate", "selling price of lakme", "rate of maggi"
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

  // 5. Stock adjust: "add 10 to maggi", "deduct 2 lakme", "maggi mein 5 jodo"
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

  // 6. Create product intent: "add new product xyz", "naya product xyz add karo", "naya item xyz"
  const newProductMatch = q.match(/(?:add new product|add new item|naya product|naya item) (.+)/i);
  if (newProductMatch) {
    return {
      intent: "create_product",
      target: newProductMatch[1].replace(/\?/g, "").trim(),
    };
  }

  // 7. Inventory Summary / Total Products count
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

  // 8. Update Location: "update location of Lakme to Shelf 2", "add a nivea cream to the location of shelf 2", "Lakme location Shelf 2 kar do"
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

  // 9. Update Price: "change the price of Nivea cream to 50", "update price of Lakme to 150", "Lakme ka price 150 kar do"
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


