import type { ExtractedSlipLine, CatalogProductSummary } from "@/lib/types/slip-extractor";

// Common non-item words in retail slips and invoices
const IGNORED_HEADER_KEYWORDS = [
  "total",
  "subtotal",
  "grand total",
  "bill",
  "invoice",
  "date",
  "time",
  "gst",
  "tax",
  "cgst",
  "sgst",
  "thank you",
  "visit again",
  "cash",
  "online",
  "phonepe",
  "paytm",
  "gpay",
  "balance",
  "paid",
  "customer",
  "phone",
  "mobile",
  "shop",
  "store",
];

/**
 * Fuzzy matches a raw item name against the shop's product catalog.
 */
export function matchItemWithCatalog(
  rawName: string,
  catalog: CatalogProductSummary[]
): CatalogProductSummary | null {
  const cleanRaw = rawName.trim().toLowerCase();
  if (!cleanRaw || catalog.length === 0) return null;

  // 1. Exact match
  const exact = catalog.find((p) => p.name.trim().toLowerCase() === cleanRaw);
  if (exact) return exact;

  // 2. Starts with / Contains match
  const containsMatch = catalog.find((p) => {
    const pName = p.name.trim().toLowerCase();
    return pName.includes(cleanRaw) || cleanRaw.includes(pName);
  });
  if (containsMatch) return containsMatch;

  // 3. Word token overlap match (e.g. "Nivea cream 50ml" matches "Nivea cream")
  const rawTokens = cleanRaw.split(/\s+/).filter((t) => t.length > 2);
  let bestMatch: CatalogProductSummary | null = null;
  let highestOverlap = 0;

  for (const product of catalog) {
    const prodTokens = product.name.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
    let overlap = 0;
    for (const t of rawTokens) {
      if (prodTokens.some((pt) => pt.includes(t) || t.includes(pt))) {
        overlap++;
      }
    }
    if (overlap > highestOverlap) {
      highestOverlap = overlap;
      bestMatch = product;
    }
  }

  if (highestOverlap >= 1 && bestMatch) {
    return bestMatch;
  }

  return null;
}

/**
 * Rule-based heuristic parser for raw slip/bill text.
 * Converts lines like:
 *   "Lakme cream 2 100"
 *   "Nivea 1 x 50"
 *   "3 Tata Tea"
 * into structured ExtractedSlipLine records with catalog linking.
 */
export function parseRawSlipText(
  rawText: string,
  catalog: CatalogProductSummary[] = []
): ExtractedSlipLine[] {
  if (!rawText || !rawText.trim()) return [];

  const lines = rawText.split(/\r?\n/);
  const result: ExtractedSlipLine[] = [];

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed.length < 2) continue;

    const lower = trimmed.toLowerCase();

    // Skip headers and summary lines (e.g. "DATE: ...", "TOTAL: ...")
    const isHeaderOrFooter = IGNORED_HEADER_KEYWORDS.some((kw) => {
      return (
        lower === kw ||
        lower.startsWith(kw + " ") ||
        lower.startsWith(kw + ":") ||
        lower.startsWith(kw + "-") ||
        lower.includes(kw + ":")
      );
    });
    if (isHeaderOrFooter) continue;

    // Pattern A: Leading Quantity (e.g. "2 Nivea cream 100" or "2 x Lakme")
    const leadingQtyMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*(?:x|\*|\-|\:)?\s*(.+?)(?:\s+(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?))?$/i);
    // Pattern B: Trailing Quantity & Price (e.g. "Nivea cream 2 100" or "Lakme 2pc 50")
    const trailingMatch = trimmed.match(/^(.+?)\s+(\d+(?:\.\d+)?)\s*(?:pcs?|units?|x|pkt)?(?:\s+(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?))?$/i);

    let extractedName = trimmed;
    let extractedQty = 1;
    let extractedPrice: number | null = null;

    if (leadingQtyMatch && leadingQtyMatch[2] && isNaN(Number(leadingQtyMatch[2]))) {
      extractedQty = parseFloat(leadingQtyMatch[1]);
      extractedName = leadingQtyMatch[2].trim();
      if (leadingQtyMatch[3]) {
        extractedPrice = parseFloat(leadingQtyMatch[3]);
      }
    } else if (trailingMatch && trailingMatch[1] && isNaN(Number(trailingMatch[1]))) {
      extractedName = trailingMatch[1].trim();
      const numVal = parseFloat(trailingMatch[2]);
      if (trailingMatch[3]) {
        extractedQty = numVal;
        extractedPrice = parseFloat(trailingMatch[3]);
      } else {
        // Single trailing number: if > 25 it's almost certainly the price (e.g. "Chudi laal 80")
        if (numVal > 25) {
          extractedPrice = numVal;
          extractedQty = 1;
        } else {
          extractedQty = numVal;
        }
      }
    } else {
      // Clean isolated punctuation or price tags at end of line (e.g. "Lakme cream Rs. 50")
      const priceOnlyMatch = trimmed.match(/^(.+?)\s+(?:₹|rs\.?|inr)\s*(\d+(?:\.\d+)?)$/i);
      if (priceOnlyMatch) {
        extractedName = priceOnlyMatch[1].trim();
        extractedPrice = parseFloat(priceOnlyMatch[2]);
        extractedQty = 1;
      }
    }

    // Clean name from lingering dashes or slashes
    extractedName = extractedName.replace(/^[-*•\d\.\s]+/, "").trim();
    if (!extractedName || extractedName.length < 2) continue;

    // Match with catalog
    const matchedProduct = matchItemWithCatalog(extractedName, catalog);

    const unitPrice =
      extractedPrice !== null
        ? extractedPrice
        : matchedProduct?.selling_price !== undefined && matchedProduct?.selling_price !== null
        ? Number(matchedProduct.selling_price)
        : null;

    result.push({
      id: `line-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      rawItemName: extractedName,
      quantity: Math.max(0.1, extractedQty),
      unitPrice,
      productId: matchedProduct ? matchedProduct.id : null,
      isTracked: Boolean(matchedProduct),
      status: matchedProduct ? "matched" : "unresolved",
      matchedProductName: matchedProduct ? matchedProduct.name : null,
      confidence: matchedProduct ? 0.9 : 0.6,
    });
  }

  return result;
}
