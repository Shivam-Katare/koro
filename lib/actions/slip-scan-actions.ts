"use server";

import { createClient } from "@/lib/supabase/server";
import { extractSlipItemsHybrid } from "@/lib/services/slip-extractor-service";
import { parseRawSlipText } from "@/lib/services/slip-text-parser";
import type { SlipExtractionResult, CatalogProductSummary } from "@/lib/types/slip-extractor";

interface ScanSlipInput {
  shopId: string;
  imageBase64: string;
  mimeType?: string;
}

interface ParseTextInput {
  shopId: string;
  text: string;
}

/**
 * Server Action: Scan bill/slip image using the Hybrid Pipeline (Gemini Vision -> Local Fallback).
 * Globally reusable across Sales Tab and Chat Assistant.
 */
export async function scanBillSlipAction(input: ScanSlipInput): Promise<SlipExtractionResult> {
  const { shopId, imageBase64, mimeType = "image/jpeg" } = input;
  if (!shopId || !imageBase64) {
    return {
      success: false,
      method: "local_ocr",
      lines: [],
      error: "Shop ID and image data are required.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      method: "local_ocr",
      lines: [],
      error: "Authentication required to scan sales slips.",
    };
  }

  try {
    // Fetch current catalog products for fuzzy matching and pricing
    const { data: products } = await (supabase.from("products") as any)
      .select("id, name, selling_price, current_stock, storage_location, category")
      .eq("shop_id", shopId)
      .order("name", { ascending: true })
      .limit(300);

    const catalog: CatalogProductSummary[] = (products || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      selling_price: p.selling_price ? Number(p.selling_price) : null,
      current_stock: p.current_stock ? Number(p.current_stock) : 0,
      storage_location: p.storage_location || null,
      category: p.category || null,
    }));

    const result = await extractSlipItemsHybrid({
      imageBase64,
      mimeType,
      catalog,
    });

    return result;
  } catch (err: any) {
    console.error("scanBillSlipAction error:", err);
    return {
      success: false,
      method: "local_ocr",
      lines: [],
      error: err?.message || "Failed to process slip image.",
    };
  }
}

/**
 * Server Action: Parse raw pasted or spoken text into structured sales lines.
 * Reusable for chat and fast manual entry.
 */
export async function parseSlipTextAction(input: ParseTextInput): Promise<SlipExtractionResult> {
  const { shopId, text } = input;
  if (!shopId || !text?.trim()) {
    return {
      success: false,
      method: "text_parser",
      lines: [],
      error: "Text content is required.",
    };
  }

  const supabase = await createClient();
  try {
    const { data: products } = await (supabase.from("products") as any)
      .select("id, name, selling_price, current_stock, storage_location, category")
      .eq("shop_id", shopId)
      .limit(300);

    const catalog: CatalogProductSummary[] = (products || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      selling_price: p.selling_price ? Number(p.selling_price) : null,
      current_stock: p.current_stock ? Number(p.current_stock) : 0,
      storage_location: p.storage_location || null,
      category: p.category || null,
    }));

    const lines = parseRawSlipText(text, catalog);
    return {
      success: true,
      method: "text_parser",
      lines,
      rawText: text,
    };
  } catch (err: any) {
    return {
      success: false,
      method: "text_parser",
      lines: [],
      error: err?.message || "Failed to parse text slip.",
    };
  }
}
