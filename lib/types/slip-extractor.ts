export interface ExtractedSlipLine {
  id: string;
  rawItemName: string;
  quantity: number;
  unitPrice: number | null;
  confidence?: number;
  productId: string | null;
  isTracked: boolean;
  status: "matched" | "untracked" | "unresolved";
  matchedProductName?: string | null;
}

export interface SlipExtractionResult {
  success: boolean;
  method: "gemini" | "local_ocr" | "text_parser";
  lines: ExtractedSlipLine[];
  rawText?: string;
  error?: string;
}

export interface CatalogProductSummary {
  id: string;
  name: string;
  selling_price?: number | null;
  current_stock?: number | null;
  storage_location?: string | null;
  category?: string | null;
}
