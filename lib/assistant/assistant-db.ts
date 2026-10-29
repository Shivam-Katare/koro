import type { SupabaseClient } from "@supabase/supabase-js";
import { computeGentleReminders } from "@/lib/utils/home-reminders";

export type AssistantSaleLineItem = {
  productId?: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  currentStock?: number | null;
  newStock?: number | null;
  isUnlinked?: boolean;
  isOutOfStock?: boolean;
};

export type AssistantRestockOrderItem = {
  productId?: string;
  productName: string;
  quantity: number;
  currentStock?: number | null;
  isNewItem?: boolean;
};

export type AssistantPendingAction = {
  actionType:
    | "adjust_stock"
    | "create_product"
    | "update_location"
    | "update_price"
    | "delete_product"
    | "record_sale"
    | "record_order_arrival"
    | "create_restock_order";
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
  // For record_sale (supports single and multi-item slips)
  quantity?: number;
  unitPrice?: number;
  totalAmount?: number;
  isUnlinked?: boolean;
  hasOutOfStock?: boolean;
  items?: AssistantSaleLineItem[];
  notes?: string;
  // For record_order_arrival
  orderItemId?: string;
  orderNumber?: string;
  receivedQuantity?: number;
  // For create_restock_order
  orderItems?: AssistantRestockOrderItem[];
  distributorName?: string;
  shareText?: string;
  whatsappUrl?: string;
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
    | "daily_reminders"
    | "create_restock_order"
    | "recent_products"
    | "seasonal_market_trends"
    | "general";
  structuredData?: any;
  pendingAction?: AssistantPendingAction | null;
}

// -------------------------------------------------------------
// Indian Retail Semantic Dictionary & Multilingual Synonyms
// -------------------------------------------------------------
export const INDIAN_RETAIL_SYNONYMS: Record<string, string[]> = {
  mehendi: ["mehndi", "mendi", "henna", "cone"],
  mehndi: ["mehendi", "mendi", "henna", "cone"],
  mendi: ["mehendi", "mehndi", "henna", "cone"],
  henna: ["mehendi", "mehndi", "mendi", "cone"],

  bangle: ["bangles", "chudi", "choodi", "chudiyan", "choodiyan", "kangan", "kangans", "kada", "kadas", "churi"],
  bangles: ["bangle", "chudi", "choodi", "chudiyan", "choodiyan", "kangan", "kangans", "kada", "kadas", "churi"],
  chudi: ["choodi", "chudiyan", "choodiyan", "bangle", "bangles", "kangan", "kangans", "kada", "kadas"],
  choodi: ["chudi", "chudiyan", "choodiyan", "bangle", "bangles", "kangan", "kangans", "kada", "kadas"],
  chudiyan: ["chudi", "choodi", "bangle", "bangles", "kangan", "kada"],
  kangan: ["kangans", "bangle", "bangles", "chudi", "choodi", "kada", "kadas"],
  kangans: ["kangan", "bangle", "bangles", "chudi", "choodi", "kada", "kadas"],
  kada: ["kadas", "kangan", "kangans", "bangle", "bangles", "chudi"],
  kadas: ["kada", "kangan", "kangans", "bangle", "bangles", "chudi"],

  earring: ["earrings", "jhumka", "jhumkas", "jhumki", "jhumkis", "chandbali", "chandbalis", "tops", "ear tops", "ear drop", "drops", "kundan drop", "pearl drop"],
  earrings: ["earring", "jhumka", "jhumkas", "jhumki", "jhumkis", "chandbali", "chandbalis", "tops", "ear tops", "ear drop", "drops", "kundan drop", "pearl drop"],
  jhumka: ["jhumkas", "jhumki", "jhumkis", "earring", "earrings", "chandbali"],
  jhumkas: ["jhumka", "jhumki", "jhumkis", "earring", "earrings", "chandbali"],
  jhumki: ["jhumka", "jhumkas", "earring", "earrings"],
  chandbali: ["chandbalis", "earring", "earrings", "jhumka"],
  chandbalis: ["chandbali", "earring", "earrings", "jhumka"],
  tops: ["ear tops", "earrings"],
  eartops: ["ear tops", "earrings", "tops"],
  "ear tops": ["tops", "earrings", "eartops"],

  hairband: ["hairbands", "rubberband", "rubberbands", "rubber band", "rubber bands", "elastic", "band", "hair clip", "clips", "clutcher", "clutchers", "scrunchie", "scrunchies", "bobby pin", "bobby pins", "hairpin", "hairpins", "tic tac", "tictac", "claw clip", "claw clips"],
  hairbands: ["hairband", "rubberband", "rubberbands", "rubber band", "rubber bands", "elastic", "band", "hair clip", "clips", "clutcher", "clutchers", "scrunchie", "scrunchies"],
  rubberband: ["hairband", "hairbands", "rubber band", "elastic"],
  "rubber band": ["hairband", "hairbands", "rubberband", "elastic"],
  scrunchie: ["scrunchies", "hairband", "rubberband"],
  scrunchies: ["scrunchie", "hairband", "rubberband"],
  clutcher: ["clutchers", "hair clip", "clips", "claw clip", "banana clutcher"],
  clutchers: ["clutcher", "hair clip", "clips", "claw clip"],
  clip: ["clips", "hair clip", "hair clips", "tic tac", "tictac", "clutcher", "bobby pin"],
  clips: ["clip", "hair clip", "hair clips", "tic tac", "tictac", "clutcher", "bobby pin"],

  bindi: ["bindis", "bindiya", "bindiyas", "tikli", "bridal bindi", "velvet bindi", "stone bindi"],
  bindis: ["bindi", "bindiya", "bindiyas", "tikli"],
  bindiya: ["bindi", "bindis", "tikli"],

  kajal: ["kaajal", "eyeliner", "surma", "kohl"],
  kaajal: ["kajal", "eyeliner", "surma", "kohl"],
  eyeliner: ["kajal", "kaajal", "liquid eyeliner"],

  lipstick: ["lipsticks", "lip shade", "lip color", "lip colour", "liquid lipstick", "matte lipstick"],
  lipsticks: ["lipstick", "lip shade", "lip color", "lip colour"],

  "nail polish": ["nail paint", "nail lacquer", "nail enamel", "nail pops"],
  "nail paint": ["nail polish", "nail lacquer", "nail pops"],
  "nail pops": ["nail polish", "nail paint"],

  sindoor: ["sindur", "kumkum", "liquid sindoor"],
  sindur: ["sindoor", "kumkum"],

  cream: ["creams", "moisturizer", "moisturiser", "cold cream", "face cream", "lotion"],
  moisturizer: ["cream", "creams", "moisturiser", "cold cream", "lotion"],
  moisturiser: ["cream", "creams", "moisturizer", "cold cream", "lotion"],

  powder: ["powders", "talc", "talcum", "face talc", "face powder", "compact", "rose powder"],
  talc: ["powder", "talcum", "face powder"],
};

export function levenshteinDistance(a: string, b: string): number {
  const m = a.length, n = b.length;
  const d: number[][] = [];
  for (let i = 0; i <= m; i++) d[i] = [i];
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      d[i][j] = a[i - 1] === b[j - 1]
        ? d[i - 1][j - 1]
        : Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + 1);
    }
  }
  return d[m][n];
}

const QUERY_STOPWORDS = new Set([
  "ka", "ki", "ke", "ko", "se", "mein", "me", "par", "pe",
  "hai", "hain", "kahan", "kidhar", "kaha", "kya", "kitna", "kitne", "kitni",
  "show", "where", "the", "a", "an", "is", "are", "do", "does", "give", "tell",
  "batao", "bataiye", "dikhao", "dikhaye", "check", "please", "bhi", "aur", "and", "or",
  "product", "item", "samaan", "stock", "location"
]);

function getWordSynonyms(word: string): string[] {
  const list = [word];
  const stem = word.replace(/(?:es|s)$/i, "");
  if (stem !== word) list.push(stem);

  for (const [key, syns] of Object.entries(INDIAN_RETAIL_SYNONYMS)) {
    if (key === word || key === stem) list.push(...syns);
    if (syns.includes(word) || syns.includes(stem)) {
      list.push(key);
      list.push(...syns.filter((s) => s !== word));
    }
  }
  return Array.from(new Set(list));
}

function wordMatchesToken(queryWord: string, targetToken: string): boolean {
  if (queryWord === targetToken) return true;
  if (targetToken.startsWith(queryWord) || queryWord.startsWith(targetToken)) return true;

  const syns = getWordSynonyms(queryWord);
  if (syns.some((s) => s === targetToken || targetToken.includes(s) || s.includes(targetToken))) {
    return true;
  }

  // Levenshtein fuzzy match for typos and phonetic variations
  if (queryWord.length >= 4 && targetToken.length >= 4) {
    const maxDist = queryWord.length >= 7 ? 2 : 1;
    if (levenshteinDistance(queryWord, targetToken) <= maxDist) return true;
    for (const s of syns) {
      if (s.length >= 4 && levenshteinDistance(s, targetToken) <= maxDist) return true;
    }
  }
  return false;
}

// Helper to resolve product matches, handling exact matches, token matching, synonyms, fuzzy spelling, and category inquiries
export function resolveProductMatch(
  products: any[],
  query: string,
  fallbackProductName?: string
): {
  matched: any[];
  bestMatch: any | null;
  distinctNames: string[];
  isCategoryMatch?: boolean;
} {
  let cleanQ = (query || "").trim().toLowerCase();

  // Conversational pronoun / context resolution
  const isPronounQuery =
    !cleanQ ||
    [
      "this product",
      "is product",
      "ye product",
      "this",
      "it",
      "its",
      "this item",
      "ye item",
      "is item",
      "the product",
      "product",
      "item",
      "isko",
      "iska",
      "iski",
      "use",
      "uska",
      "uski",
    ].includes(cleanQ);

  if (isPronounQuery && fallbackProductName && fallbackProductName.trim()) {
    cleanQ = fallbackProductName.trim().toLowerCase();
  }

  if (!cleanQ) {
    return { matched: [], bestMatch: null, distinctNames: [] };
  }

  // 1. Exact full match
  const exactMatches = (products || []).filter(
    (p: any) => (p.name || "").trim().toLowerCase() === cleanQ
  );
  if (exactMatches.length === 1) {
    return {
      matched: exactMatches,
      bestMatch: exactMatches[0],
      distinctNames: [exactMatches[0].name.trim()],
    };
  }

  // 2. Tokenize query and remove noise stopwords
  const rawTokens = cleanQ.split(/[\s,._-]+/).filter((w) => w && !QUERY_STOPWORDS.has(w));
  const searchTokens = rawTokens.length > 0 ? rawTokens : cleanQ.split(/[\s,._-]+/).filter(Boolean);

  const scored = (products || []).map((p: any) => {
    const pName = (p.name || "").toLowerCase();
    const pBrand = (p.brand || "").toLowerCase();
    const nameTokens = pName.split(/[\s,._-]+/).filter(Boolean);
    const brandTokens = pBrand.split(/[\s,._-]+/).filter(Boolean);
    const primaryTokens = [...nameTokens, ...brandTokens];

    // Exact name match
    if (pName === cleanQ) {
      return { p, score: 100, isExact: true };
    }
    // Substring match
    if (pName.includes(cleanQ)) {
      return { p, score: 90, isSubstring: true };
    }

    // Token-based matching against primary tokens (Name & Brand)
    let primaryMatches = 0;
    for (const qWord of searchTokens) {
      if (primaryTokens.some((t) => wordMatchesToken(qWord, t))) {
        primaryMatches++;
      }
    }

    if (primaryMatches === 0) return { p, score: 0 };

    const ratio = primaryMatches / searchTokens.length;
    let score = ratio * 85;

    // Boost if brand explicitly matches query
    if (searchTokens.some((q) => wordMatchesToken(q, pBrand))) {
      score += 10;
    }
    // Boost if all search tokens found
    if (primaryMatches === searchTokens.length) {
      score += 15;
    }

    return { p, score };
  });

  const matchingItems = scored
    .filter((s) => s.score >= 50)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.p);

  const distinctNames = Array.from(new Set(matchingItems.map((m: any) => m.name.trim())));

  // Check if query is a broad category inquiry (e.g. "chudi", "bangles", "earrings", "kangan")
  const isCategoryQuery =
    searchTokens.length === 1 &&
    [
      "chudi", "choodi", "bangle", "bangles", "kangan", "kangans", "kada",
      "earring", "earrings", "jhumka", "jhumkas", "tops",
      "hairband", "hairbands", "clip", "clips", "clutcher", "scrunchie",
      "lipstick", "lipsticks", "nail polish", "nail paint",
      "bindi", "bindis", "cream", "powder"
    ].some((term) => wordMatchesToken(searchTokens[0], term));

  let bestMatch: any | null = null;
  if (!isCategoryQuery) {
    if (matchingItems.length === 1) {
      bestMatch = matchingItems[0];
    } else if (matchingItems.length > 1) {
      const topScore = scored.find((s) => s.p.id === matchingItems[0].id)?.score || 0;
      const secondScore = scored.find((s) => s.p.id === matchingItems[1].id)?.score || 0;
      if (topScore >= 90 && topScore - secondScore >= 20) {
        bestMatch = matchingItems[0];
      }
    }
  }

  return {
    matched: matchingItems,
    bestMatch,
    distinctNames,
    isCategoryMatch: isCategoryQuery,
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

  // If multiple matching products are found (e.g. user asked for "earrings", "chudi", "kangan", etc.)
  if (resolution.matched.length > 1 && (!resolution.bestMatch || resolution.isCategoryMatch)) {
    const itemsList = resolution.matched
      .map(
        (p: any, idx: number) =>
          `${idx + 1}. **${p.name}**: ${p.storage_location || "Location not assigned yet"} (Stock: ${p.current_stock} units, ₹${p.selling_price || 0})`
      )
      .join("\n");

    return {
      content: `Aapke paas "${query}" ke ${resolution.matched.length} items hain:\n${itemsList}`,
      taskType: "find_product",
      structuredData: {
        found: true,
        multiple: true,
        products: resolution.matched,
        count: resolution.matched.length,
      },
    };
  }

  const p = resolution.bestMatch || resolution.matched[0];
  const loc = p.storage_location || "Not assigned yet";
  return {
    content: `**${p.name}** is located at: **${loc}** (Stock: ${p.current_stock} units, Price: ₹${p.selling_price || 0}).`,
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
    .select("id, name, brand, category, current_stock, min_stock_threshold, stock_status, storage_location, selling_price")
    .eq("shop_id", shopId);

  const resolution = resolveProductMatch(products || [], cleanQ);

  if (!resolution.bestMatch && resolution.matched.length === 0) {
    return {
      content: `No item found matching "${query}" to check stock.`,
      taskType: "check_stock",
      structuredData: { found: false, query },
    };
  }

  if (resolution.matched.length > 1 && (!resolution.bestMatch || resolution.isCategoryMatch)) {
    const stockList = resolution.matched
      .map(
        (p: any, idx: number) =>
          `${idx + 1}. **${p.name}**: **${p.current_stock} units** in stock (Location: ${p.storage_location || "Shelf"})`
      )
      .join("\n");

    return {
      content: `Aapke paas "${query}" ke ${resolution.matched.length} items hain:\n${stockList}`,
      taskType: "check_stock",
      structuredData: {
        found: true,
        multiple: true,
        products: resolution.matched,
      },
    };
  }

  const p = resolution.bestMatch || resolution.matched[0];
  const min = p.min_stock_threshold ?? 5;
  let statusBadge = "Healthy stock";
  if (p.current_stock <= 0) statusBadge = "⚠️ Out of Stock!";
  else if (p.current_stock <= min) statusBadge = "⚠️ Low Stock!";

  return {
    content: `Current stock of **${p.name}** is **${p.current_stock} units** (Min alert: ${min}). Status: **${statusBadge}**. Location: ${p.storage_location || "Shelf"}`,
    taskType: "check_stock",
    structuredData: { found: true, product: p, stock: p.current_stock, status: statusBadge },
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

export async function executeGetRecentAddedProducts(
  supabase: any,
  shopId: string,
  limit: number = 5,
  category?: string
): Promise<AssistantExecutionResult> {
  const fetchLimit = Math.min(20, Math.max(1, limit || 5));
  let query = (supabase.from("products") as any)
    .select("id, name, brand, category, selling_price, cost_price, current_stock, storage_location, created_at")
    .eq("shop_id", shopId)
    .order("created_at", { ascending: false })
    .limit(fetchLimit);

  if (category && category.trim()) {
    query = query.ilike("category", `%${category.trim()}%`);
  }

  const { data: products, error } = await query;

  if (error) {
    return {
      content: `Recent products load karne mein dikkat aayi: ${error.message}`,
      taskType: "recent_products",
      structuredData: { error: error.message },
    };
  }

  const list = products || [];
  if (list.length === 0) {
    return {
      content: category
        ? `Aapki shop mein "${category}" category ka koi product nahi mila.`
        : "Aapki shop inventory mein abhi koi product added nahi hai.",
      taskType: "recent_products",
      structuredData: { count: 0, products: [] },
    };
  }

  const formatTimeAgo = (dateStr: string) => {
    if (!dateStr) return "recently";
    const now = new Date();
    const created = new Date(dateStr);
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return diffMins <= 1 ? "abhi kuch der pehle" : `${diffMins} minute pehle`;
    }
    if (diffHours < 24) {
      return `${diffHours} ghante pehle`;
    }
    if (diffDays === 1) {
      return "kal (1 din pehle)";
    }
    if (diffDays < 30) {
      return `${diffDays} din pehle`;
    }
    return created.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  const mostRecent = list[0];
  const timeAgoStr = formatTimeAgo(mostRecent.created_at);
  const locationStr = mostRecent.storage_location ? `Location: **${mostRecent.storage_location}**` : "Location: unassigned";
  const priceStr = mostRecent.selling_price !== null && mostRecent.selling_price !== undefined ? `₹${mostRecent.selling_price}` : "Price: not set";
  const stockStr = `${mostRecent.current_stock ?? 0} units`;

  const topRecentSummary = list
    .slice(0, 5)
    .map((p: any, idx: number) => {
      const when = formatTimeAgo(p.created_at);
      const loc = p.storage_location ? `[${p.storage_location}]` : "[No location]";
      const rate = p.selling_price !== null && p.selling_price !== undefined ? `₹${p.selling_price}` : "-";
      return `${idx + 1}. **${p.name}** — ${rate}, Stock: ${p.current_stock ?? 0} (${when}) ${loc}`;
    })
    .join("\n");

  const content = `Aapka sabse recent added product **${mostRecent.name}** hai jo **${timeAgoStr}** add kiya gaya tha (${priceStr}, ${stockStr}, ${locationStr}).\n\n**Holiye mein add kiye gaye products**:\n${topRecentSummary}`;

  return {
    content,
    taskType: "recent_products",
    structuredData: {
      count: list.length,
      mostRecentProduct: {
        id: mostRecent.id,
        name: mostRecent.name,
        brand: mostRecent.brand,
        category: mostRecent.category,
        sellingPrice: mostRecent.selling_price,
        currentStock: mostRecent.current_stock,
        storageLocation: mostRecent.storage_location,
        createdAt: mostRecent.created_at,
        timeAgo: timeAgoStr,
      },
      products: list.map((p: any) => ({
        id: p.id,
        name: p.name,
        brand: p.brand,
        category: p.category,
        sellingPrice: p.selling_price,
        currentStock: p.current_stock,
        storageLocation: p.storage_location,
        createdAt: p.created_at,
      })),
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
// Sales Recording Proposal ("Today I sold 4 Nivea, 3 Lakme, 2 chudis")
// -------------------------------------------------------------
export async function executeProposeRecordSale(
  supabase: any,
  shopId: string,
  params: {
    productName?: string;
    quantity?: number;
    unitPrice?: number;
    notes?: string;
    items?: Array<{
      productName: string;
      quantity?: number;
      unitPrice?: number;
    }>;
  }
): Promise<AssistantExecutionResult> {
  // Normalize items list (supports both items array and single item params)
  let rawItems: Array<{ productName: string; quantity?: number; unitPrice?: number }> = [];
  if (params.items && Array.isArray(params.items) && params.items.length > 0) {
    rawItems = params.items.filter((i) => i && i.productName && i.productName.trim() !== "");
  } else if (params.productName && params.productName.trim() !== "") {
    rawItems = [
      {
        productName: params.productName.trim(),
        quantity: params.quantity,
        unitPrice: params.unitPrice,
      },
    ];
  }

  if (rawItems.length === 0) {
    return {
      content: "Kripya sale record karne ke liye product ka naam batayein (jaise: '2 Nivea cream, 1 Lakme').",
      taskType: "record_sale",
      pendingAction: null,
    };
  }

  const { data: products } = await supabase
    .from("products")
    .select("id, name, storage_location, selling_price, cost_price, current_stock, category")
    .eq("shop_id", shopId);

  const processedLines: AssistantSaleLineItem[] = [];
  const ambiguousItems: string[] = [];
  let hasOutOfStock = false;

  for (const item of rawItems) {
    const cleanName = item.productName.trim();
    const qty = item.quantity && item.quantity > 0 ? item.quantity : 1;
    const resolution = resolveProductMatch(products || [], cleanName);

    if (!resolution.bestMatch && resolution.distinctNames.length > 1) {
      ambiguousItems.push(`"${cleanName}" (options: ${resolution.distinctNames.map((n) => `"${n}"`).join(", ")})`);
      continue;
    }

    if (resolution.bestMatch) {
      const p = resolution.bestMatch;
      const currentStock = Number(p.current_stock) || 0;
      const unitPrice =
        item.unitPrice !== undefined && item.unitPrice > 0
          ? item.unitPrice
          : p.selling_price !== null && p.selling_price !== undefined
          ? Number(p.selling_price)
          : 0;
      const lineTotal = qty * unitPrice;
      const isOutOfStock = currentStock <= 0;
      if (isOutOfStock) hasOutOfStock = true;
      const newStock = Math.max(0, currentStock - qty);

      processedLines.push({
        productId: p.id,
        productName: p.name,
        quantity: qty,
        unitPrice,
        lineTotal,
        currentStock,
        newStock,
        isUnlinked: false,
        isOutOfStock,
      });
    } else {
      // Uncataloged / Custom item: Retailers frequently sell unlinked items (e.g. bangles, loose goods, milk)
      const unitPrice = item.unitPrice !== undefined && item.unitPrice > 0 ? item.unitPrice : 0;
      const lineTotal = qty * unitPrice;

      processedLines.push({
        productId: undefined,
        productName: cleanName,
        quantity: qty,
        unitPrice,
        lineTotal,
        currentStock: null,
        newStock: null,
        isUnlinked: true,
        isOutOfStock: false,
      });
    }
  }

  if (ambiguousItems.length > 0) {
    return {
      content: `Aapke paas multiple milte-julte items hain: ${ambiguousItems.join("; ")}. Kripya exact product batayein jo aapne becha hai.`,
      taskType: "record_sale",
      structuredData: { ambiguous: true },
      pendingAction: null,
    };
  }

  const totalAmount = processedLines.reduce((sum, l) => sum + l.lineTotal, 0);
  const totalUnits = processedLines.reduce((sum, l) => sum + l.quantity, 0);

  const linesListMarkdown = processedLines
    .map((l) => {
      const priceStr = l.unitPrice > 0 ? `₹${l.unitPrice} each = ₹${l.lineTotal}` : "₹0";
      const stockStr = l.isUnlinked
        ? "(↔ Unlinked Item)"
        : l.isOutOfStock
        ? "(⚠️ Out of Stock — 0 in system)"
        : `(Stock: ${l.currentStock} ➔ ${l.newStock} units)`;
      return `• **${l.quantity}x ${l.productName}** — ${priceStr} ${stockStr}`;
    })
    .join("\n");

  let outOfStockAlert = "";
  if (hasOutOfStock) {
    const oosNames = processedLines
      .filter((l) => l.isOutOfStock)
      .map((l) => l.productName)
      .join(", ");
    outOfStockAlert = `\n⚠️ **Stock Awareness:** **${oosNames}** system inventory mein out of stock (0 units) hai, lekin dukaan ke liye sales slip taiyaar kar di hai.`;
  }

  const noteMarkdown = params.notes ? `\n• Note: **"${params.notes}"**` : "";

  const title =
    processedLines.length > 1
      ? `**Counter Sales Slip (${processedLines.length} items)**:`
      : `**Sale Slip Details**:`;

  const content = `${title}\n${linesListMarkdown}\n• **Total Bill: ₹${totalAmount.toLocaleString("en-IN")}** (${totalUnits} total units)${noteMarkdown}${outOfStockAlert}\n\nNiche confirm par tap karke slip generate karein aur stock update karein.`;

  const primaryItem = processedLines[0];

  const pendingAction: AssistantPendingAction = {
    actionType: "record_sale",
    productId: processedLines.length === 1 ? primaryItem.productId : undefined,
    productName:
      processedLines.length === 1
        ? primaryItem.productName
        : `${processedLines.length} items (${processedLines.map((i) => i.productName).slice(0, 2).join(", ")}${processedLines.length > 2 ? "..." : ""})`,
    quantity: totalUnits,
    unitPrice: processedLines.length === 1 ? primaryItem.unitPrice : undefined,
    totalAmount,
    currentStock: processedLines.length === 1 ? primaryItem.currentStock : null,
    newStock: processedLines.length === 1 ? primaryItem.newStock : null,
    isUnlinked: processedLines.every((l) => l.isUnlinked),
    hasOutOfStock,
    items: processedLines,
    notes: params.notes,
    reason: params.notes || "counter_sale",
  };

  return {
    content,
    taskType: "record_sale",
    structuredData: {
      items: processedLines,
      totalAmount,
      totalUnits,
      hasOutOfStock,
      notes: params.notes,
    },
    pendingAction,
  };
}

// -------------------------------------------------------------
// Update Slip Note (e.g. "For the recent slip add note: udhar of ₹50")
// -------------------------------------------------------------
export async function executeUpdateSlipNote(
  supabase: any,
  shopId: string,
  params: {
    note: string;
    slipNumber?: string;
    itemHint?: string;
  }
): Promise<AssistantExecutionResult> {
  const cleanNote = (params.note || "").trim();
  if (!cleanNote) {
    return {
      content: "Kripya slip mein add karne ke liye note batayein (jaise: 'Udhar ₹50', 'Ramesh bhai').",
      taskType: "general",
      pendingAction: null,
    };
  }

  let targetSlip: any = null;

  // 1. If slipNumber provided, find by slip_number
  if (params.slipNumber && params.slipNumber.trim()) {
    const rawNum = params.slipNumber.trim();
    const { data: matchedSlips } = await (supabase.from("sales_slips") as any)
      .select("id, slip_number, total_amount, notes, created_at")
      .eq("shop_id", shopId)
      .ilike("slip_number", `%${rawNum}%`)
      .order("created_at", { ascending: false })
      .limit(1);

    if (matchedSlips && matchedSlips.length > 0) {
      targetSlip = matchedSlips[0];
    }
  }

  // 2. If no slipNumber or not found, but itemHint provided (e.g. "for chudi", "nivea")
  if (!targetSlip && params.itemHint && params.itemHint.trim()) {
    const hint = params.itemHint.trim().toLowerCase();
    const { data: matchedLines } = await (supabase.from("sales_slip_lines") as any)
      .select("slip_id, raw_item_name, created_at")
      .eq("shop_id", shopId)
      .ilike("raw_item_name", `%${hint}%`)
      .order("created_at", { ascending: false })
      .limit(1);

    if (matchedLines && matchedLines.length > 0) {
      const { data: slipData } = await (supabase.from("sales_slips") as any)
        .select("id, slip_number, total_amount, notes, created_at")
        .eq("id", matchedLines[0].slip_id)
        .single();
      if (slipData) {
        targetSlip = slipData;
      }
    }
  }

  // 3. Fallback: Most recent slip of this shop
  if (!targetSlip) {
    const { data: recentSlips } = await (supabase.from("sales_slips") as any)
      .select("id, slip_number, total_amount, notes, created_at")
      .eq("shop_id", shopId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (recentSlips && recentSlips.length > 0) {
      targetSlip = recentSlips[0];
    }
  }

  if (!targetSlip) {
    return {
      content: "Aapki shop mein koi sales slip nahi mila jisme note update kiya ja sake.",
      taskType: "general",
      pendingAction: null,
    };
  }

  const updatedNote = targetSlip.notes
    ? `${targetSlip.notes} | ${cleanNote}`
    : cleanNote;

  const { error: updateErr } = await (supabase.from("sales_slips") as any)
    .update({ notes: updatedNote, updated_at: new Date().toISOString() })
    .eq("id", targetSlip.id)
    .eq("shop_id", shopId);

  if (updateErr) {
    return {
      content: `Slip note update karne mein error aayi: ${updateErr.message}`,
      taskType: "general",
      pendingAction: null,
    };
  }

  const content = `✅ **Slip Note Updated!**\n• Slip: **#${targetSlip.slip_number}** (Total ₹${targetSlip.total_amount})\n• Note Added: **"${cleanNote}"**\nSlip history mein note darj kar diya gaya hai.`;

  return {
    content,
    taskType: "general",
    structuredData: {
      slipId: targetSlip.id,
      slipNumber: targetSlip.slip_number,
      note: cleanNote,
      totalAmount: targetSlip.total_amount,
    },
    pendingAction: null,
  };
}

// -------------------------------------------------------------
// Daily Store Reminders Lookup
// -------------------------------------------------------------
export async function executeGetDailyReminders(
  supabase: any,
  shopId: string
): Promise<AssistantExecutionResult> {
  const [prodsRes, ordersRes, movesRes, slipsRes, shopRes] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, current_stock, min_stock_threshold, stock_status, storage_location, description, brand")
      .eq("shop_id", shopId),
    (supabase.from("restock_orders") as any)
      .select("*")
      .eq("shop_id", shopId),
    (supabase.from("stock_movements") as any)
      .select("*")
      .eq("shop_id", shopId)
      .order("created_at", { ascending: false })
      .limit(20),
    (supabase.from("sales_slips") as any)
      .select("*")
      .eq("shop_id", shopId)
      .order("created_at", { ascending: false })
      .limit(20),
    (supabase.from("shops") as any)
      .select("name, category")
      .eq("id", shopId)
      .maybeSingle(),
  ]);

  const products = (prodsRes.data || []) as any[];
  const restockOrders = (ordersRes.data || []) as any[];
  const stockMovements = (movesRes.data || []) as any[];
  const salesSlips = (slipsRes.data || []) as any[];
  const shopCategory = shopRes.data?.category || "General Store";

  const reminders = computeGentleReminders({
    products,
    restockOrders,
    stockMovements,
    salesSlips,
    shopCategory,
  });

  if (reminders.length === 0) {
    return {
      content: "Aapki shop mein sabhi cheezein healthy hain! Koi item out of stock nahi hai aur na hi koi pending delivery hai.",
      taskType: "daily_reminders",
      structuredData: { reminders: [] },
    };
  }

  // Construct natural, conversational summary (avoid reading newspaper bullet lists)
  const highlights: string[] = [];
  const outOfStock = products.filter(
    (p) => p.current_stock <= 0 || p.stock_status === "out_of_stock"
  );
  if (outOfStock.length > 0) {
    const oosNames = outOfStock.slice(0, 2).map((p) => p.name).join(" aur ");
    highlights.push(`${outOfStock.length} items completely out of stock hain (${oosNames})`);
  }

  const unassigned = products.filter((p) => !p.storage_location || p.storage_location.trim() === "");
  if (unassigned.length > 0) {
    highlights.push(`${unassigned.length} item ka shelf location set nahi hai`);
  }

  const pending = restockOrders.filter((o) => o.status === "ordered");
  if (pending.length > 0) {
    highlights.push(`${pending.length} restock order ki delivery pending hai`);
  }

  const seasonal = reminders.find((r) => r.category === "seasonal");
  if (seasonal) {
    highlights.push(seasonal.title);
  }

  const spokenAnswer =
    highlights.length > 0
      ? `Aapke aaj ke reminders hain: ${highlights.join(", ")}.`
      : "Aapki dukaan ka stock aur orders bilkul up to date hain.";

  const markdownDetails = reminders.map((r) => `• **${r.title}**: ${r.description}`).join("\n");
  const content = `${spokenAnswer}\n\n${markdownDetails}`;

  return {
    content,
    taskType: "daily_reminders",
    structuredData: { reminders, highlights },
  };
}

// -------------------------------------------------------------
// Sales History, Line-Item Inspection & Earnings Lookup
// -------------------------------------------------------------
export async function executeGetSalesHistory(
  supabase: any,
  shopId: string,
  dateQuery?: string,
  options?: { unitPrice?: number; itemName?: string }
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
        lineItems: [],
      },
    };
  }

  const totalEarnings = slipList.reduce(
    (sum: number, s: any) => sum + (Number(s.total_amount) || 0),
    0
  );

  const slipIds = slipList.map((s: any) => s.id);
  const slipMap: Record<string, any> = {};
  for (const s of slipList) {
    slipMap[s.id] = s;
  }

  const { data: lines } = await (supabase
    .from("sales_slip_lines") as any)
    .select("id, slip_id, raw_item_name, quantity, unit_price, subtotal, is_tracked, created_at")
    .in("slip_id", slipIds);

  const linesList = lines || [];
  const totalUnitsSold = linesList.reduce(
    (sum: number, l: any) => sum + (Number(l.quantity) || 0),
    0
  );

  interface EnrichedLineItem {
    id: string;
    slipId: string;
    slipNumber: string;
    itemName: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    createdAt: string;
  }

  const enrichedLines: EnrichedLineItem[] = linesList.map((l: any): EnrichedLineItem => ({
    id: l.id,
    slipId: l.slip_id,
    slipNumber: slipMap[l.slip_id]?.slip_number || "Slip",
    itemName: l.raw_item_name || "Item",
    quantity: Number(l.quantity) || 1,
    unitPrice: l.unit_price !== null ? Number(l.unit_price) : 0,
    subtotal: l.subtotal !== null ? Number(l.subtotal) : 0,
    createdAt: l.created_at,
  }));

  // Case 1: Filter by specific price (e.g. "What's the one item that I sold that was ₹30?")
  if (options?.unitPrice !== undefined && options.unitPrice !== null && !isNaN(Number(options.unitPrice))) {
    const targetPrice = Number(options.unitPrice);
    const matchedLines = enrichedLines.filter(
      (l: EnrichedLineItem) => l.unitPrice === targetPrice || l.subtotal === targetPrice
    );

    if (matchedLines.length > 0) {
      const distinctMatched = Array.from(new Set(matchedLines.map((l: EnrichedLineItem) => l.itemName)));
      const itemsList = matchedLines
        .map((l: EnrichedLineItem) => `• **${l.quantity}x ${l.itemName}** (₹${l.unitPrice} each, Slip #${l.slipNumber})`)
        .join("\n");

      const primarySpoken =
        distinctMatched.length === 1
          ? `**${label}** ko **₹${targetPrice}** mein becha gaya item: **${distinctMatched[0]}** (Slip #${matchedLines[0].slipNumber}).`
          : `**${label}** ko **₹${targetPrice}** price par ye items beche gaye the:\n${itemsList}`;

      return {
        content: primarySpoken,
        taskType: "sales_history",
        structuredData: {
          dateLabel: label,
          unitPriceFilter: targetPrice,
          matchedItems: matchedLines,
          totalEarnings,
          slipCount,
          lineItems: enrichedLines,
        },
      };
    } else {
      return {
        content: `**${label}** ke sales slips mein **₹${targetPrice}** price par koi item nahi mila.`,
        taskType: "sales_history",
        structuredData: {
          dateLabel: label,
          unitPriceFilter: targetPrice,
          matchedItems: [],
          totalEarnings,
          slipCount,
          lineItems: enrichedLines,
        },
      };
    }
  }

  // Case 2: Filter by item name (e.g. "How many Kajals did I sell on 24 October?")
  if (options?.itemName && options.itemName.trim()) {
    const term = options.itemName.trim().toLowerCase();
    const matchedLines = enrichedLines.filter((l: EnrichedLineItem) => l.itemName.toLowerCase().includes(term));

    if (matchedLines.length > 0) {
      const totalItemQty = matchedLines.reduce((s: number, l: EnrichedLineItem) => s + l.quantity, 0);
      const totalItemRev = matchedLines.reduce((s: number, l: EnrichedLineItem) => s + l.subtotal, 0);
      const itemsList = matchedLines
        .map((l: EnrichedLineItem) => `• **${l.quantity}x ${l.itemName}** at ₹${l.unitPrice} each = ₹${l.subtotal} (Slip #${l.slipNumber})`)
        .join("\n");

      return {
        content: `**${label}** ko **${options.itemName}** ke total **${totalItemQty} items** beche gaye (Total: **₹${totalItemRev}**):\n${itemsList}`,
        taskType: "sales_history",
        structuredData: {
          dateLabel: label,
          itemNameFilter: options.itemName,
          totalQuantity: totalItemQty,
          totalRevenue: totalItemRev,
          matchedItems: matchedLines,
        },
      };
    } else {
      return {
        content: `**${label}** ko "${options.itemName}" ki koi sale record nahi hui.`,
        taskType: "sales_history",
        structuredData: { dateLabel: label, itemNameFilter: options.itemName, matchedItems: [] },
      };
    }
  }

  // Case 3: General daily summary with line-item breakdown
  const itemCounts: Record<string, number> = {};
  for (const l of enrichedLines) {
    itemCounts[l.itemName] = (itemCounts[l.itemName] || 0) + l.quantity;
  }

  const topItems = Object.entries(itemCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, qty]) => `${qty}x ${name}`)
    .join(", ");

  const lineItemsList = enrichedLines
    .slice(0, 8)
    .map((l: EnrichedLineItem) => `• ${l.quantity}x ${l.itemName} — ₹${l.unitPrice} each (Slip #${l.slipNumber})`)
    .join("\n");

  const extraLineCount = enrichedLines.length > 8 ? `\n...and ${enrichedLines.length - 8} more items.` : "";

  const recentSoldHighlight = enrichedLines.length > 0
    ? `Sabse recent bika hua item: **${enrichedLines[0].quantity}x ${enrichedLines[0].itemName}** (₹${enrichedLines[0].unitPrice} each, Slip #${enrichedLines[0].slipNumber}).\n\n`
    : "";

  const content = `${recentSoldHighlight}**${label} Sales Report**:\n• Total Earnings: **₹${totalEarnings.toLocaleString("en-IN")}**\n• Total Slips: **${slipCount} bills**\n• Total Units Sold: **${totalUnitsSold} items**\n\n**Sold Items Detail**:\n${lineItemsList}${extraLineCount}`;

  return {
    content,
    taskType: "sales_history",
    structuredData: {
      dateLabel: label,
      totalEarnings,
      slipCount,
      totalUnitsSold,
      topItems,
      mostRecentSoldItem: enrichedLines[0] || null,
      lineItems: enrichedLines,
    },
  };
}

// -------------------------------------------------------------
// Helper: Build WhatsApp Restock Message Text
// -------------------------------------------------------------
export function buildWhatsAppRestockMessageText(params: {
  shopName: string;
  items: AssistantRestockOrderItem[];
  distributorName?: string;
  notes?: string;
}): string {
  const dateStr = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const lines: string[] = [];
  lines.push(`📦 *PURCHASE ORDER / RESTOCK LIST*`);
  lines.push(`🏪 *Shop:* ${params.shopName || "My Retail Store"}`);
  lines.push(`📅 *Date:* ${dateStr}`);
  if (params.distributorName?.trim()) {
    lines.push(`👤 *Supplier / Distributor:* ${params.distributorName.trim()}`);
  }
  lines.push(``);
  lines.push(`*Items to Order:*`);

  params.items.forEach((item, index) => {
    const stockInfo = item.isNewItem
      ? `✨ New Item (Catalog mein naya)`
      : `Current Stock: ${item.currentStock ?? 0}`;
    lines.push(
      `${index + 1}. *${item.productName}*\n   👉 *Order: ${item.quantity} units* (${stockInfo})`
    );
  });

  const totalUnits = params.items.reduce((sum, item) => sum + item.quantity, 0);

  lines.push(``);
  lines.push(`----------------------------------------`);
  lines.push(`📋 *Total Products:* ${params.items.length} items`);
  lines.push(`🔢 *Total Order Quantity:* ${totalUnits} units`);
  if (params.notes?.trim()) {
    lines.push(`📝 *Note:* ${params.notes.trim()}`);
  }
  lines.push(``);
  lines.push(`_Generated via Zibbi Retail Assistant_`);

  return lines.join("\n");
}

// -------------------------------------------------------------
// Propose Create Restock Order Draft & WhatsApp Share Link
// -------------------------------------------------------------
export async function executeProposeCreateRestockOrder(
  supabase: any,
  shopId: string,
  params: {
    items: Array<{ productName: string; quantity: number }>;
    distributorName?: string;
    notes?: string;
  }
): Promise<AssistantExecutionResult> {
  const rawItems = (params.items || []).filter(
    (i) => i && i.productName && i.productName.trim() !== ""
  );

  if (rawItems.length === 0) {
    return {
      content: "Kripya restock order ke liye items aur quantity batayein (jaise: '10 serum aur 10 Nivea cream order karo').",
      taskType: "create_restock_order",
      pendingAction: null,
    };
  }

  const [prodsRes, shopRes] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, current_stock, storage_location, brand, description, min_stock_threshold")
      .eq("shop_id", shopId),
    (supabase.from("shops") as any)
      .select("name, whatsapp_number")
      .eq("id", shopId)
      .maybeSingle(),
  ]);

  const allProds = prodsRes.data || [];
  const shopData = shopRes.data;

  const processedItems: AssistantRestockOrderItem[] = [];
  for (const item of rawItems) {
    const cleanName = item.productName.trim();
    const qty = item.quantity && item.quantity > 0 ? item.quantity : 1;
    const match = resolveProductMatch(allProds, cleanName);

    if (match.bestMatch) {
      const p = match.bestMatch;
      processedItems.push({
        productId: p.id,
        productName: p.name,
        quantity: qty,
        currentStock: Number(p.current_stock) || 0,
        isNewItem: false,
      });
    } else {
      // Brand new item not in catalog yet (e.g. "CRM", new trend)
      processedItems.push({
        productId: undefined,
        productName: cleanName,
        quantity: qty,
        currentStock: 0,
        isNewItem: true,
      });
    }
  }

  const shareText = buildWhatsAppRestockMessageText({
    shopName: shopData?.name || "My Store",
    items: processedItems,
    distributorName: params.distributorName,
    notes: params.notes,
  });

  const rawPhone = (shopData?.whatsapp_number || "").replace(/\D/g, "");
  let whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
  if (rawPhone.length >= 10) {
    const formattedPhone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;
    whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(shareText)}`;
  }

  const totalUnits = processedItems.reduce((s, it) => s + it.quantity, 0);
  const itemsSummaryMarkdown = processedItems
    .map(
      (it) =>
        `• **${it.quantity}x ${it.productName}** ${
          it.isNewItem ? "(✨ Naya item)" : `(Current stock: ${it.currentStock} units)`
        }`
    )
    .join("\n");

  const distributorText = params.distributorName ? `\n• Supplier: **${params.distributorName}**` : "";
  const noteText = params.notes ? `\n• Note: **${params.notes}**` : "";

  const content = `📦 **Restock Order Drafted (${processedItems.length} items, ${totalUnits} units)**:\n${itemsSummaryMarkdown}${distributorText}${noteText}\n\nNiche confirmation card se **WhatsApp par share** karein ya order save karein.`;

  const pendingAction: AssistantPendingAction = {
    actionType: "create_restock_order",
    productName: `${processedItems.length} items (${processedItems.map((i) => i.productName).slice(0, 2).join(", ")})`,
    orderItems: processedItems,
    distributorName: params.distributorName,
    notes: params.notes,
    shareText,
    whatsappUrl,
    reason: params.notes || "restock_order_draft",
  };

  return {
    content,
    taskType: "create_restock_order",
    structuredData: {
      items: processedItems,
      totalUnits,
      shareText,
      whatsappUrl,
      distributorName: params.distributorName,
      notes: params.notes,
    },
    pendingAction,
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

  // 3. Delivered Orders (and recent arrivals)
  if (qType.includes("deliver") || qType.includes("arrived") || qType.includes("recent") || qType.includes("received")) {
    if (deliveredOrders.length === 0) {
      return {
        content: "Abhi tak koi order delivered mark nahi hua hai.",
        taskType: "restock_orders",
        structuredData: { count: 0, orders: [] },
      };
    }

    const mostRecentOrder = deliveredOrders[0];
    const mostRecentOrderItems = items.filter((it) => it.order_id === mostRecentOrder.id);
    const mostRecentItemNames = mostRecentOrderItems.length > 0
      ? mostRecentOrderItems.map((it) => `${it.product_name} (${it.received_quantity || it.ordered_quantity} pcs)`).join(", ")
      : `${mostRecentOrder.total_units} units`;

    const deliveredSummaryList = deliveredOrders
      .slice(0, 3)
      .map((o) => {
        const orderItems = items.filter((it) => it.order_id === o.id);
        const itemNames = orderItems.length > 0
          ? orderItems.map((it) => `${it.product_name} (${it.received_quantity || it.ordered_quantity} pcs)`).join(", ")
          : `${o.total_units} units`;
        return `• Slip **#${o.order_number}**: ${itemNames} (${o.distributor_name || "Supplier"})`;
      })
      .join("\n");

    return {
      content: `Sabse recent deliver hua order: **Slip #${mostRecentOrder.order_number}** jisme **${mostRecentItemNames}** deliver hue hain (${mostRecentOrder.distributor_name || "Supplier"}).\n\nTotal **${deliveredOrders.length} restock orders deliver** ho chuke hain:\n${deliveredSummaryList}`,
      taskType: "restock_orders",
      structuredData: {
        count: deliveredOrders.length,
        units: deliveredUnits,
        mostRecentOrder: {
          id: mostRecentOrder.id,
          orderNumber: mostRecentOrder.order_number,
          distributor: mostRecentOrder.distributor_name || "Supplier",
          items: mostRecentOrderItems.map((it) => ({
            name: it.product_name,
            quantity: it.received_quantity || it.ordered_quantity,
          })),
        },
        orders: deliveredOrders.slice(0, 5),
      },
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

  let recentDeliveryHighlight = "";
  if (deliveredOrders.length > 0) {
    const mostRecent = deliveredOrders[0];
    const recItems = items.filter((it) => it.order_id === mostRecent.id);
    const recNames = recItems.length > 0
      ? recItems.map((it) => `${it.product_name} (${it.received_quantity || it.ordered_quantity})`).slice(0, 3).join(", ")
      : "";
    if (recNames) {
      recentDeliveryHighlight = `• 📦 **Recent Delivery**: Slip #${mostRecent.order_number} (${recNames})\n`;
    }
  }

  const content = `**Restock & Orders Summary**:\n• ⏳ **Waiting**: ${waitingOrders.length} orders (${waitingUnits} units aane baaki)\n• ✅ **Delivered**: ${deliveredOrders.length} orders (${deliveredUnits} units received)\n${recentDeliveryHighlight}• ❌ **Cancelled**: ${cancelledOrders.length} orders (${cancelledUnits} units)\n\n${orderAdvice}`;

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
// Helper: Parse multi-item sales from conversational sentences
// Examples: "Today I sold 4 Nivea creams, 3 Lakme Kajals, and 2 chudis", "2 Nivea creams, 1 Lakme of ₹50, and the ₹20 one"
// -------------------------------------------------------------
export function parseMultiItemSaleText(text: string): AssistantSaleLineItem[] | null {
  const clean = text.trim();
  const lower = clean.toLowerCase();

  // Exclude note updates, restock queries, earnings queries, locations, or inventory checks
  if (
    lower.includes("note") ||
    lower.includes("udhar") ||
    lower.includes("order") ||
    lower.includes("arrived") ||
    lower.includes("how much") ||
    lower.includes("kitna") ||
    lower.includes("kitni") ||
    lower.includes("history") ||
    lower.includes("where is") ||
    lower.includes("kahan") ||
    lower.includes("check stock")
  ) {
    return null;
  }

  // Must contain an explicit sale verb or slip-creation phrase
  const isSaleQuery =
    /\b(?:sold|sell|sale|becha|beche|bechi|bika|biki|bikri)\b/i.test(clean) ||
    /(?:add\s+to\s+(?:a\s+)?slip|added\s+to\s+(?:a\s+)?slip|slip\s+(?:me|mein)\s+daal|slip\s+banao|slip\s+create)/i.test(clean);

  if (!isSaleQuery) {
    return null;
  }

  const stripped = clean
    .replace(/^(?:today\s+)?(?:i\s+)?sold\s+/i, "")
    .replace(/^(?:aaj\s+)?(?:maine\s+|mene\s+|humne\s+)?(?:abhi[- ]abhi\s+)?/i, "")
    .replace(/(?:\s+(?:bechi|becha|beche|bika|biki|sell kiya|sale kiya)(?:\s+hai|\s+tha)?)+$/i, "")
    .replace(/(?:\s+(?:use\s+)?(?:sale|slip)(?:\s+me|\s+mein)?\s+(?:add|daal)(?:\s+kar|\s+karo|\s+karein|\s+kar do)?)+$/i, "")
    .replace(/(?:\s+(?:added\s+to\s+a?\s*slip|add\s+to\s+a?\s*slip))+$/i, "")
    .trim();

  if (!/[,&+]|\band\b|\baur\b/i.test(stripped)) {
    return null;
  }

  const segments = stripped.split(/,\s*(?:and\s+|aur\s+)?|\s+and\s+|\s+aur\s+|[+&]/i);
  if (segments.length < 2) return null;

  const wordNumbers: Record<string, number> = {
    one: 1, ek: 1,
    two: 2, do: 2,
    three: 3, teen: 3,
    four: 4, char: 4,
    five: 5, panch: 5,
    six: 6, chheh: 6,
    seven: 7, saat: 7,
    eight: 8, aath: 8,
    nine: 9, nau: 9,
    ten: 10, das: 10,
  };

  const items: AssistantSaleLineItem[] = [];

  for (const rawSeg of segments) {
    let seg = rawSeg.trim();
    if (!seg) continue;

    let qty = 1;
    let unitPrice: number | undefined = undefined;

    const priceOneMatch =
      seg.match(/^(?:the\s+)?(?:₹|rs\.?)\s*(\d+(?:\.\d+)?)\s*(?:one|waala|wala)?$/i) ||
      seg.match(/^(?:the\s+)?(\d+(?:\.\d+)?)\s*(?:rupaye|rs\.?|₹)?\s*(?:one|waala|wala)$/i);

    if (priceOneMatch) {
      unitPrice = parseFloat(priceOneMatch[1]);
      items.push({
        productName: `Item @ ₹${unitPrice}`,
        quantity: 1,
        unitPrice,
        lineTotal: unitPrice,
      });
      continue;
    }

    const priceMatch = seg.match(/(?:of|at|@|for|rs\.?|₹|me|mein|rupaye me)\s*(?:₹|rs\.?)?\s*(\d+(?:\.\d+)?)/i);
    if (priceMatch) {
      unitPrice = parseFloat(priceMatch[1]);
      seg = seg.replace(/(?:of|at|@|for|rs\.?|₹|me|mein|rupaye me)\s*(?:₹|rs\.?)?\s*(\d+(?:\.\d+)?)/gi, "").trim();
    }

    const wordQtyMatch = seg.match(/^(one|two|three|four|five|six|seven|eight|nine|ten|ek|do|teen|char|panch|chheh|saat|aath|nau|das)\s+(.+)/i);
    const leadingQtyMatch = seg.match(/^(\d+(?:\.\d+)?)\s*(?:x|\*|\-|\:)?\s*(.+)/i);

    if (leadingQtyMatch) {
      qty = parseInt(leadingQtyMatch[1], 10) || 1;
      seg = leadingQtyMatch[2].trim();
    } else if (wordQtyMatch) {
      qty = wordNumbers[wordQtyMatch[1].toLowerCase()] || 1;
      seg = wordQtyMatch[2].trim();
    } else {
      const trailingQtyMatch = seg.match(/^(.+?)\s+(\d+)\s*(?:pcs?|units?|items?|pieces?|piece|packets?)?$/i);
      if (trailingQtyMatch) {
        seg = trailingQtyMatch[1].trim();
        qty = parseInt(trailingQtyMatch[2], 10) || 1;
      }
    }

    seg = seg
      .replace(/^(?:of\s+)/i, "")
      .replace(/\s+(?:items?|units?|pieces?|piece|packets?)$/i, "")
      .trim();

    if (seg.length > 0) {
      items.push({
        productName: seg,
        quantity: qty,
        unitPrice: unitPrice !== undefined ? unitPrice : 0,
        lineTotal: qty * (unitPrice !== undefined ? unitPrice : 0),
      });
    }
  }

  return items.length >= 2 ? items : null;
}

// -------------------------------------------------------------
// Helper: Parse restock order items from conversational text
// Examples: "Add 10 units of serum and Nivea cream to my slip", "Order 10 serum and 5 nivea", "add CRM to order"
// -------------------------------------------------------------
export function parseRestockOrderItems(text: string): Array<{ productName: string; quantity: number }> | null {
  const clean = text.trim();
  const lower = clean.toLowerCase();

  if (
    lower.includes("cancel") ||
    lower.includes("waiting") ||
    lower.includes("pending") ||
    lower.includes("delivered") ||
    lower.includes("arrived") ||
    lower.includes("status") ||
    lower.includes("summary")
  ) {
    return null;
  }

  // Remove prefixes like "add", "order", "draft", "to my slip", "to restock slip"
  let stripped = clean
    .replace(/^(?:please\s+)?(?:draft\s+)?(?:restock\s+slip\s+banao\s+|restock\s+order\s+banao\s+|create\s+restock\s+order\s+|order\s+|add\s+|restock\s+)/i, "")
    .replace(/(?:\s+(?:to\s+(?:my\s+)?(?:order\s+|restock\s+)?slip|to\s+restock|in\s+restock|mangwa\s+lo|order\s+kar\s+do|order\s+karo))+$/i, "")
    .trim();

  const segments = stripped.split(/,\s*(?:and\s+|aur\s+)?|\s+and\s+|\s+aur\s+|[+&]/i);
  const items: Array<{ productName: string; quantity: number }> = [];

  const wordNumbers: Record<string, number> = {
    one: 1, ek: 1, two: 2, do: 2, three: 3, teen: 3, four: 4, char: 4, five: 5, panch: 5,
    six: 6, chheh: 6, seven: 7, saat: 7, eight: 8, aath: 8, nine: 9, nau: 9, ten: 10, das: 10,
  };

  let defaultQty = 10;

  for (let i = 0; i < segments.length; i++) {
    let seg = segments[i].trim();
    if (!seg) continue;

    let qty: number | null = null;
    const numMatch = seg.match(/^(\d+)\s*(?:x|\*|\-|\:|\s+units?|\s+pcs?|\s+pieces?)?\s+(?:of\s+)?(.+)/i);
    const wordMatch = seg.match(/^(one|two|three|four|five|six|seven|eight|nine|ten|ek|do|teen|char|panch|chheh|saat|aath|nau|das)\s+(?:units?\s+of\s+|pcs?\s+of\s+)?(.+)/i);

    if (numMatch) {
      qty = parseInt(numMatch[1], 10);
      seg = numMatch[2].trim();
      defaultQty = qty;
    } else if (wordMatch) {
      qty = wordNumbers[wordMatch[1].toLowerCase()] || 10;
      seg = wordMatch[2].trim();
      defaultQty = qty;
    } else {
      const trailingMatch = seg.match(/^(.+?)\s+(\d+)\s*(?:pcs?|units?|pieces?)?$/i);
      if (trailingMatch) {
        seg = trailingMatch[1].trim();
        qty = parseInt(trailingMatch[2], 10);
      } else {
        qty = defaultQty;
      }
    }

    seg = seg
      .replace(/^(?:units?\s+of\s+|pieces?\s+of\s+|of\s+)/i, "")
      .replace(/\s+(?:items?|units?|pieces?|piece|packets?)$/i, "")
      .trim();

    if (seg.length > 0) {
      items.push({
        productName: seg,
        quantity: qty || defaultQty,
      });
    }
  }

  return items.length > 0 ? items : null;
}

// -------------------------------------------------------------
// Fast Local Intent Matcher (0 Tokens, Zero-Latency Fallback)
// -------------------------------------------------------------
export function matchLocalIntent(query: string, lastFocusedProduct?: string) {
  const q = query.toLowerCase().trim();

  const resolveTarget = (item: string) => {
    const clean = item.trim();
    const isPronoun = [
      "this product",
      "is product",
      "ye product",
      "this",
      "it",
      "its",
      "this item",
      "the product",
      "product",
      "item",
      "isko",
      "iska",
      "iski",
      "use",
      "uska",
      "uski",
    ].includes(clean.toLowerCase());

    if (isPronoun && lastFocusedProduct && lastFocusedProduct.trim()) {
      return lastFocusedProduct.trim();
    }
    return clean;
  };

  // 0. Daily Reminders Intent: "what's today's reminder", "what are my today's reminders", "reminders", "aaj ke reminder"
  const isFollowUpOrOther =
    q.includes("aur koi") ||
    q.includes("any other") ||
    q.includes("anything else") ||
    q.includes("something else") ||
    q.includes("aur kuch") ||
    q.includes("kuch aur") ||
    q.includes("is that all") ||
    q.includes("bacha hai") ||
    q.includes("thank you") ||
    q.includes("thanks") ||
    q.includes("shukriya");

  if (
    !isFollowUpOrOther &&
    (q.includes("reminder") ||
      q.includes("reminders") ||
      q.includes("aaj ke reminder") ||
      q.includes("kya reminder") ||
      q.includes("remind me"))
  ) {
    return { intent: "daily_reminders" };
  }

  // 0b. Recent Added Products Intent: "what's the recent product I added", "recent product added", "latest added products", "abhi kaunsa product add kiya", "2 din pehle kaunsa product add kiya"
  const isRecentProductsQuery =
    (q.includes("recent") || q.includes("latest") || q.includes("abhi") || q.includes("naya") || q.includes("haliye") || q.includes("pehle")) &&
    (q.includes("product") || q.includes("item") || q.includes("samaan")) &&
    (q.includes("add") || q.includes("added") || q.includes("daala") || q.includes("joda") || q.includes("banaya")) &&
    !q.includes("location") &&
    !q.includes("price") &&
    !q.includes("sale") &&
    !q.includes("sold") &&
    !q.includes("order") &&
    !q.includes("restock");

  if (isRecentProductsQuery) {
    return { intent: "recent_products" };
  }

  // 1. Delete Product: "delete product lakme", "lakme ko delete kar do", "delete this product"
  const delMatch1 = q.match(/(?:delete|remove) (?:product |item )?(.+?)(?: ko delete kar do| delete karo| hata do)?$/i);
  if (q.startsWith("delete ") || q.startsWith("remove ") || q.includes(" ko delete kar do") || q.includes(" delete karo")) {
    const rawItem = q
      .replace(/^delete (?:product |item )?/i, "")
      .replace(/^remove (?:product |item )?/i, "")
      .replace(/ ko delete kar do/i, "")
      .replace(/ delete karo/i, "")
      .replace(/ hata do/i, "")
      .replace(/\?/g, "")
      .trim();
    const item = resolveTarget(rawItem);
    if (item && !item.includes("order")) {
      return { intent: "delete_product", target: item };
    }
  }

  // 1b. Draft Restock Order Intent: "add 10 units of serum and nivea cream to my slip", "order 10 serum and nivea"
  // 1b. Draft Restock Order Intent: "add 10 units of serum and nivea cream to my slip", "order 10 serum and nivea"
  const isRestockOrderDraft =
    (q.includes("order") || q.includes("restock") || q.includes("mangwa") || q.includes("mangwana") || (q.includes("slip") && (q.includes("add") || q.includes("units") || q.includes("banao")) && !q.includes("sale") && !q.includes("sold") && !q.includes("bech"))) &&
    (q.includes("add") || q.includes("draft") || q.includes("banao") || q.includes("karo") || q.includes("kar do") || q.includes("units") || q.includes("slip") || q.includes("order") || /\d+/.test(q)) &&
    !q.includes("cancel") &&
    !q.includes("waiting") &&
    !q.includes("pending") &&
    !q.includes("delivered") &&
    !q.includes("arrived") &&
    !q.includes("status") &&
    !q.includes("summary");

  if (isRestockOrderDraft) {
    const parsedOrderItems = parseRestockOrderItems(query);
    if (parsedOrderItems && parsedOrderItems.length > 0) {
      return {
        intent: "create_restock_order",
        items: parsedOrderItems,
      };
    }
  }

  // 2a. Multi-item sales recording: "today i sold 4 nivea creams, 3 lakme kajals, and 2 chudis"
  const multiItems = parseMultiItemSaleText(q);
  if (multiItems && multiItems.length >= 2) {
    return { intent: "record_sale", items: multiItems };
  }

  // Guard against treating multi-item sentences as a single product:
  const hasMultipleItemsPattern =
    /[,\+]|\band\b|\baur\b/.test(q) &&
    (q.match(/\d+|one|two|three|four|five|ek|do|teen|char|panch/gi) || []).length >= 2;

  if (!hasMultipleItemsPattern) {
    // 2b. Single item sales recording: "today i sold 5 lakme items", "sold 5 lakme at 50", "5 lakme beche"
    const saleMatch1 = q.match(/(?:today )?(?:i )?sold (\d+) (?:units |packets |pieces |items )?(?:of )?(.+?)(?: at | for | @ | me | mein )?(?:rs\.?|₹)?\s*(\d+(?:\.\d+)?)?$/i);
    if (saleMatch1) {
      const qty = parseInt(saleMatch1[1], 10);
      const prod = resolveTarget(saleMatch1[2].replace(/ items?| units?| packets?| pieces?/gi, "").trim());
      const price = saleMatch1[3] ? parseFloat(saleMatch1[3]) : undefined;
      return { intent: "record_sale", quantity: qty, target: prod, unitPrice: price };
    }

    const isQuestion = q.includes("kya ") || q.includes("what ") || q.includes("which ") || q.includes("kitna ") || q.includes("how much ") || /\b(?:january|february|march|april|may|june|july|august|september|october|november|december)\b/i.test(q);
    if (!isQuestion) {
      const saleMatch2 = q.match(/(\d+) (.+?) (?:beche|becha|sell kiya|sale kiya)/i);
      if (saleMatch2) {
        const qty = parseInt(saleMatch2[1], 10);
        const prod = resolveTarget(saleMatch2[2].replace(/ items?| units?| packets?| pieces?/gi, "").trim());
        return { intent: "record_sale", quantity: qty, target: prod };
      }
    }

    // 2c. Hindi / Hinglish sales: "maine abhi-abhi ... bechi hai", "use sale me add kar"
    const hindiSaleMatch = q.match(/(?:maine |mene |humne )?(?:abhi[- ]abhi )?(.+?) (?:bechi|becha|beche|bika|biki|sell kiya|sale kiya)(?: hai| tha)?/i);
    if (hindiSaleMatch && !isQuestion) {
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
      const prod = resolveTarget(rawItem);
      if (prod.length > 1) {
        return { intent: "record_sale", quantity: qty, target: prod, unitPrice };
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
      return { intent: "record_sale", quantity: qty, target: resolveTarget(rawItem) };
    }
  }

  // 3a. Specific line item in past slips by price:
  // e.g. "on 24 october what's the one item that i sold that was 30", "item sold at 30", "24 october ko 30 rupaye me kya becha tha"
  const soldAtPrice =
    q.match(/(?:sold|bika|becha|bechi|tha).*(?:at|for|₹|rs\.?|rupaye me|me|mein|worth|that was)\s*(?:₹|rs\.?)?\s*(\d+(?:\.\d+)?)/i) ||
    q.match(/(?:at|for|₹|rs\.?)\s*(\d+(?:\.\d+)?).*(?:sold|bika|becha|bechi)/i) ||
    q.match(/(\d+(?:\.\d+)?)\s*(?:rupaye|rs\.?|₹)\s*(?:me|mein|par)?.*(?:sold|bika|becha|bechi)/i) ||
    q.match(/(?:that was|worth)\s*(?:₹|rs\.?)?\s*(\d+(?:\.\d+)?)/i);

  if ((q.includes("sold") || q.includes("becha") || q.includes("bika") || q.includes("bechi")) && soldAtPrice) {
    let datePart = "";
    const onDateMatch =
      q.match(/(?:on |for |tarikh )([0-9a-zA-Z\s\/\-]+)/i) ||
      q.match(/^([0-9a-zA-Z\s\/\-]+?)(?: ko| tarikh)/i);

    if (onDateMatch) {
      datePart = onDateMatch[1].replace(/what.*|which.*|item.*|\?/gi, "").trim();
    } else if (q.includes("yesterday") || q.includes("kal")) {
      datePart = "yesterday";
    } else {
      datePart = "today";
    }
    const unitPrice = parseFloat(soldAtPrice[1]);
    return { intent: "sales_history", dateQuery: datePart, unitPrice };
  }

  // 3. Sales History & Earnings: "on 20th january 2026 how much money did i earn", "how much money did i sell", "total sales", "today sales"
  if (
    q.includes("how much money did i earn") ||
    q.includes("how much money did i sell") ||
    q.includes("how much did i sell") ||
    q.includes("how much did i earn") ||
    q.includes("how much i sold") ||
    q.includes("how much sales") ||
    q.includes("total sale") ||
    q.includes("total sales") ||
    q.includes("kitni kamai") ||
    q.includes("kitni sale") ||
    q.includes("kitna bika") ||
    q.includes("kitne ka samaan bika") ||
    q.includes("sales happened") ||
    q.startsWith("sales on ") ||
    q.startsWith("earnings on ") ||
    q.includes("today sales") ||
    q.includes("today's sales") ||
    q.includes("aaj ki sale")
  ) {
    let datePart = "";
    const onDateMatch = q.match(/(?:on |for |tarikh )([0-9a-zA-Z\s\/\-]+)/i);
    if (onDateMatch) {
      datePart = onDateMatch[1].replace(/how much.+|kitni.+|\?/gi, "").trim();
    } else if (q.includes("yesterday") || q.includes("kal")) {
      datePart = "yesterday";
    } else if (q.includes("this month") || q.includes("is mahine")) {
      datePart = "this month";
    } else if (q.includes("this week") || q.includes("is hafte")) {
      datePart = "this week";
    } else {
      datePart = "today";
    }
    return { intent: "sales_history", dateQuery: datePart };
  }

  // 3b. Update Slip Note (e.g. "for recent slip add note: udhar of ₹50", "slip me note add karo")
  if (
    q.includes("add note") ||
    q.includes("note add") ||
    q.includes("update note") ||
    q.includes("note update") ||
    q.includes("add a note") ||
    q.includes("slip note") ||
    q.includes("udhar note")
  ) {
    let noteText = "";
    const noteMatch = q.match(/(?:note as well,? like |note: |note add karo:? |note daal do:? |note |add a note:? )(.+)/i);
    if (noteMatch) {
      noteText = noteMatch[1].replace(/^it'?s (?:an? )?/i, "").replace(/^like /i, "").trim();
    }

    let slipNum = "";
    const slipNumMatch = q.match(/(?:slip number\s*(?:is\s*|hai\s*|:\s*)?|slip no\.?\s*(?:is\s*|:\s*)?|slip\s*#\s*)([a-zA-Z0-9\-]+)/i);
    if (slipNumMatch && !["is", "was", "hai", "that", "the"].includes(slipNumMatch[1].toLowerCase())) {
      slipNum = slipNumMatch[1].trim();
    } else {
      const standaloneSlip = q.match(/\b(SLIP-[0-9A-Z\-]+|\d{4,10})\b/i);
      if (standaloneSlip) {
        slipNum = standaloneSlip[1];
      }
    }

    let itemHint = "";
    const itemHintMatch = q.match(/(?:for |ke liye )(?:the )?(?:recent )?(?:slip (?:that you (?:have )?created )?(?:for )?)?([a-zA-Z0-9]+)/i);
    if (itemHintMatch && !["the", "recent", "slip"].includes(itemHintMatch[1].toLowerCase())) {
      itemHint = itemHintMatch[1].trim();
    }

    return {
      intent: "update_slip_note",
      note: noteText || q,
      slipNumber: slipNum || undefined,
      itemHint: itemHint || undefined,
    };
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

  // 5. Location intent: "where is lakme", "where are earrings", "location of tata tea", "lakme kahan hai", "chudi dikhao"
  if (
    q.startsWith("where is ") ||
    q.startsWith("where are ") ||
    q.startsWith("where's ") ||
    q.startsWith("location of ") ||
    q.includes(" kahan hai") ||
    q.includes(" kahan rakha") ||
    q.includes("kidhar hai") ||
    q.includes(" kahan milegi") ||
    q.includes(" kahan milega") ||
    q.endsWith(" dikhao") ||
    q.endsWith(" batao") ||
    q.endsWith(" dikhaye") ||
    q.endsWith(" bataiye")
  ) {
    const raw = q
      .replace(/^where is (?:the )?/i, "")
      .replace(/^where are (?:the )?/i, "")
      .replace(/^where's (?:the )?/i, "")
      .replace(/^location of (?:the )?/i, "")
      .replace(/ kahan hai/i, "")
      .replace(/ kahan rakha hai/i, "")
      .replace(/ kahan rakha/i, "")
      .replace(/ kidhar hai/i, "")
      .replace(/ kahan milegi/i, "")
      .replace(/ kahan milega/i, "")
      .replace(/ (?:mujhe )?(?:bhi )?(?:dikhao|batao|dikhaye|bataiye)/i, "")
      .replace(/\?/g, "")
      .trim();
    if (raw) {
      return { intent: "find_location", target: resolveTarget(raw) };
    }
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
    const raw = q
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
    return { intent: "check_stock", target: resolveTarget(raw) };
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
    const raw = q
      .replace(/^selling price of /i, "")
      .replace(/^price of /i, "")
      .replace(/^rate of /i, "")
      .replace(/ ka price/i, "")
      .replace(/ ka rate/i, "")
      .replace(/ kitne ka hai/i, "")
      .replace(/\?/g, "")
      .trim();
    return { intent: "price_history", target: resolveTarget(raw) };
  }

  // 9. Stock adjust: "add 10 to maggi", "deduct 2 lakme", "maggi mein 5 jodo"
  const addMatch = q.match(/add (\d+) (?:units |packets |pieces )?(?:to )?(.+)/i);
  if (addMatch) {
    return {
      intent: "adjust_stock",
      delta: parseInt(addMatch[1], 10),
      target: resolveTarget(addMatch[2].replace(/\?/g, "").trim()),
    };
  }

  const deductMatch = q.match(/(?:deduct|remove) (\d+) (?:units |packets |pieces )?(?:from )?(.+)/i);
  if (deductMatch) {
    return {
      intent: "adjust_stock",
      delta: -parseInt(deductMatch[1], 10),
      target: resolveTarget(deductMatch[2].replace(/\?/g, "").trim()),
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
      target: resolveTarget(locMatch1[1].trim()),
      newLocation: locMatch1[2].replace(/\?/g, "").trim(),
    };
  }
  const locMatchAdd = q.match(/(?:add|put|place|set) (?:a |an )?(.+?) (?:to the location of|to location|in location|at location|to shelf|in shelf|at shelf|to drawer|in drawer|at drawer|in rack|to rack|at rack) (.+)/i);
  if (locMatchAdd) {
    return {
      intent: "update_location",
      target: resolveTarget(locMatchAdd[1].trim()),
      newLocation: locMatchAdd[2].replace(/\?/g, "").trim(),
    };
  }
  const locMatch2 = q.match(/(.+) (?:ki|ka) location (.+) (?:kar do|rakh do|set karo|karo)/i);
  if (locMatch2) {
    return {
      intent: "update_location",
      target: resolveTarget(locMatch2[1].trim()),
      newLocation: locMatch2[2].replace(/\?/g, "").trim(),
    };
  }

  const locMatchHindiPronoun = q.match(/(?:isko|iska|ise|use|uska|is product ko|this product) (?:ko )?(.+?) (?:me|mein|par) (?:rakh do|daal do|set kar do|rakhein)/i);
  if (locMatchHindiPronoun && lastFocusedProduct) {
    return {
      intent: "update_location",
      target: lastFocusedProduct.trim(),
      newLocation: locMatchHindiPronoun[1].replace(/\?/g, "").trim(),
    };
  }

  // 13. Update Price
  const priceMatch1 = q.match(/(?:update|change|set|add) (?:the )?price (?:of )?(.+?) (?:to|as) (?:rs\.?|₹)?\s*(\d+(?:\.\d+)?)/i);
  if (priceMatch1) {
    return {
      intent: "update_price",
      target: resolveTarget(priceMatch1[1].trim()),
      newPrice: parseFloat(priceMatch1[2]),
    };
  }
  const priceMatchAdd = q.match(/(?:add|set|put) price (?:of )?(?:rs\.?|₹)?\s*(\d+(?:\.\d+)?) (?:to|for) (.+)/i);
  if (priceMatchAdd) {
    return {
      intent: "update_price",
      target: resolveTarget(priceMatchAdd[2].trim()),
      newPrice: parseFloat(priceMatchAdd[1]),
    };
  }
  const priceMatchDirect = q.match(/(?:set|add|change) (?:the )?(.+?) price (?:to|as) (?:rs\.?|₹)?\s*(\d+(?:\.\d+)?)/i);
  if (priceMatchDirect) {
    return {
      intent: "update_price",
      target: resolveTarget(priceMatchDirect[1].trim()),
      newPrice: parseFloat(priceMatchDirect[2]),
    };
  }
  const priceMatch2 = q.match(/(.+) (?:ka|ki) (?:price|rate) (?:rs\.?|₹)?\s*(\d+(?:\.\d+)?)/i);
  if (priceMatch2) {
    return {
      intent: "update_price",
      target: resolveTarget(priceMatch2[1].trim()),
      newPrice: parseFloat(priceMatch2[2]),
    };
  }

  // 14. Contextual Price Updates without product specified: "update this product's price as well to 50", "change its price to 50", "price 50 kar do"
  const implicitPriceMatch =
    q.match(/(?:update|change|set|add) (?:this product'?s? |its )?price (?:as well )?(?:to|as) (?:rs\.?|₹)?\s*(\d+(?:\.\d+)?)/i) ||
    q.match(/(?:iska|iski) price (?:rs\.?|₹)?\s*(\d+(?:\.\d+)?)(?: kar do| rakh do| karo)?/i) ||
    q.match(/^price (?:rs\.?|₹)?\s*(\d+(?:\.\d+)?)(?: kar do)?$/i);

  if (implicitPriceMatch && lastFocusedProduct && lastFocusedProduct.trim()) {
    return {
      intent: "update_price",
      target: lastFocusedProduct.trim(),
      newPrice: parseFloat(implicitPriceMatch[1]),
    };
  }

  return null;
}

/**
 * Retrieves AI-powered festive & seasonal market trends tailored to the shop's registered category,
 * past high-velocity sales slips, and current market demand.
 * Capable of answering specific follow-up questions (margins, types, wholesale tips).
 */
export async function executeGetSeasonalMarketTrends(
  supabase: any,
  shopId: string,
  params: {
    festivalOrSeason?: string;
    query?: string;
  }
): Promise<AssistantExecutionResult> {
  // 1. Fetch Shop details
  const { data: shop } = await (supabase.from("shops") as any)
    .select("name, category, description")
    .eq("id", shopId)
    .maybeSingle();

  const shopCategory = shop?.category || "Cosmetics & Bangles / Jewelry";
  const shopName = shop?.name || "Local Retail Store";

  // 2. Fetch Catalog products & recent sales slips for data grounding
  const [prodsRes, recentLinesRes] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, current_stock, selling_price, category")
      .eq("shop_id", shopId)
      .limit(60),
    (supabase.from("sales_slip_lines") as any)
      .select("product_name, quantity, unit_price")
      .eq("shop_id", shopId)
      .order("created_at", { ascending: false })
      .limit(80),
  ]);

  // Aggregate past sales volume to find proven bestsellers
  const itemCounts = new Map<string, number>();
  for (const line of recentLinesRes.data || []) {
    if (line.product_name) {
      itemCounts.set(
        line.product_name,
        (itemCounts.get(line.product_name) || 0) + Number(line.quantity || 1)
      );
    }
  }
  const topSellers = Array.from(itemCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, qty]) => `${name} (${qty} units sold recently)`);

  const existingCatalogNames = (prodsRes.data || []).slice(0, 25).map((p: any) => p.name);

  // 3. Determine real-world calendar season
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1 to 12
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const currentMonthName = monthNames[currentMonth - 1];

  let currentActiveSeason = "Upcoming Festive Shopping Season";
  if (currentMonth >= 9 && currentMonth <= 11) {
    currentActiveSeason = "Diwali, Karwa Chauth, Dhanteras, Bhai Dooj & Winter Wedding Season";
  } else if (currentMonth === 12 || currentMonth === 1) {
    currentActiveSeason = "Winter Season, Christmas, New Year & Republic Day";
  } else if (currentMonth >= 2 && currentMonth <= 4) {
    currentActiveSeason = "Holi, Spring & Summer Season";
  } else if (currentMonth >= 5 && currentMonth <= 7) {
    currentActiveSeason = "Summer Skincare, Refreshment & School Reopening";
  } else if (currentMonth === 8) {
    currentActiveSeason = "Raksha Bandhan, Teej & Independence Day";
  }

  const queryText =
    params.query?.trim() ||
    (params.festivalOrSeason
      ? `${params.festivalOrSeason} ke liye kya samaan layein?`
      : "Diwali ke liye dukaan par kya naya samaan layein?");

  // 4. Synthesize with Gemini using Google Search Grounding for live internet market trends
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  if (apiKey) {
    try {
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `You are "Koro", an expert retail business advisor on Indian local retail wholesale market trends and seasonal restocking for local dukandars.
Store Details:
- Store Name: "${shopName}"
- Store Category: "${shopCategory}"
- Current Real-World Calendar Month: ${currentMonthName} (Active Season in India: ${currentActiveSeason})
- Shopkeeper Inquiry: "${queryText}"
${params.festivalOrSeason ? `- Mentioned Festival / Event: "${params.festivalOrSeason}"` : ""}

CRITICAL ADVISORY & REAL-TIME TREND RULES:
1. Seasonality & Reality Check (NEVER BE A YES-MAN):
   - Compare the user's question or festival to the real-world calendar (${currentMonthName} / ${currentActiveSeason}):
   - If the user asks about an OFF-SEASON item or festival (e.g. asking about Holi colors, pichkari, or herbal gulal in October/Diwali season; or winter cold creams in May; or Diwali lights in February):
     DO NOT AGREE! DO NOT SAY YES!
     Firmly and politely explain why it is a bad business decision: the festival is months away (e.g. Holi is in March, ~5 months away), customers will not buy it now, and their cash/working capital will be locked in dead stock. Direct them to the active festival/season (${currentActiveSeason}) instead.
2. Category Appropriateness:
   - Match the advice to the store category: "${shopCategory}".
   - For Cosmetics & Bangles/Jewelry/General:
     * High-margin festive products: water-sensor LED diyas (water lights), artistic LED fairy/curtain lighting, velvet bangles with kundan latkan, stone jhumkas, cosmetics gift hampers, bridal makeup kits, Kaveri mehendi.
     * NEVER recommend firecrackers/explosives, medicines, or unrelated goods.
   - For Pharmacy: Burn care (Burnol/Silverex), pollution masks, eye irritation drops.
   - For Kirana: Dry fruit gift packs, pooja samagri, ghee, sweets.
3. Real Wholesale Market Trends (Ground via Google Search):
   - Bring fresh, viral wholesale trends that are actively performing in Indian wholesale markets right now.
   - Mention realistic wholesale buying prices, retail selling rates, and profit margins (e.g. 50-70% margin).
   - DO NOT just repeat existing catalog inventory; the shopkeeper wants fresh market trends and high-margin product ideas.
4. Tone & Format:
   - Start with a natural, warm, and direct 2-3 sentence spoken reply in friendly Hindi/Hinglish (spoken by an experienced mentor).
   - If recommending items, provide a clean markdown breakdown of 2-3 top trending wholesale items with reason and typical margin.`;

      const response = await ai.models.generateContent({
        model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const replyText = response.text?.trim();
      if (replyText) {
        return {
          content: replyText,
          taskType: "seasonal_market_trends",
          structuredData: {
            season: currentActiveSeason,
            category: shopCategory,
            query: queryText,
          },
          pendingAction: null,
        };
      }
    } catch (err: any) {
      console.warn("Gemini live search seasonal market trends generation error:", err?.message || err);
    }
  }

  // Graceful fallback if API or internet search is unreachable
  return {
    content: `Aapki ${shopCategory} dukaan ke liye ${currentActiveSeason} par water-sensor LED diyas, decorative fairy lights, aur festive bangles/jewellery sabse zyada bikte hain. Saath hi fast-moving items pehle se mangwa lijiye taaki festival rush mein samaan khatam na ho.`,
    taskType: "seasonal_market_trends",
    structuredData: { season: currentActiveSeason, category: shopCategory },
    pendingAction: null,
  };
}



