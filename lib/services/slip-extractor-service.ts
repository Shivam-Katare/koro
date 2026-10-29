import { GoogleGenAI, Type } from "@google/genai";
import { parseRawSlipText, matchItemWithCatalog } from "./slip-text-parser";
import type {
  ExtractedSlipLine,
  SlipExtractionResult,
  CatalogProductSummary,
} from "@/lib/types/slip-extractor";

interface ExtractSlipOptions {
  imageBase64: string;
  mimeType?: string;
  catalog?: CatalogProductSummary[];
}

/**
 * Extracts raw text from an image using local Tesseract.js OCR.
 * Runs completely locally without third-party cloud API quota.
 */
async function extractWithLocalTesseract(
  imageBase64: string,
  mimeType = "image/jpeg"
): Promise<string> {
  try {
    const { createWorker } = await import("tesseract.js");
    const worker = await createWorker("eng");

    // Format data URL
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const dataUrl = `data:${mimeType};base64,${cleanBase64}`;

    const ret = await worker.recognize(dataUrl);
    await worker.terminate();

    return ret.data.text || "";
  } catch (err) {
    console.warn("Tesseract local OCR error:", err);
    return "";
  }
}

/**
 * Primary Hybrid Slip Extractor:
 * 1. Attempts Gemini Vision extraction for high accuracy with handwriting and mixed Hinglish.
 * 2. If Gemini quota is exhausted, offline, or unavailable, automatically falls back to local Tesseract OCR + rule-based heuristic parsing.
 */
export async function extractSlipItemsHybrid({
  imageBase64,
  mimeType = "image/jpeg",
  catalog = [],
}: ExtractSlipOptions): Promise<SlipExtractionResult> {
  const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  // -------------------------------------------------------------------------
  // Tier 1: Gemini Vision Multimodal Extraction
  // -------------------------------------------------------------------------
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });

      const catalogHint = catalog
        .slice(0, 80)
        .map((p) => `"${p.name}" (₹${p.selling_price || 0})`)
        .join(", ");

      const systemInstruction = `You are an expert OCR and receipt parsing engine for Indian retail shopkeepers (kirana, cosmetics, general store, hardware).
Your job is to read images and determine if they are retail counter bills/slips, and if so, extract the sold items with quantities and prices.

Known shop products: [${catalogHint}]

Rules & Guardrails:
1. VALIDATE DOCUMENT TYPE FIRST:
   - Check if this image is a retail store receipt, handwritten counter parchi, kirana bill, or sales slip.
   - If the image is NOT a retail store bill (e.g. it is a medical prescription/Rx, clinic slip, personal photo, selfie, identity document, restaurant menu, school notes, or unrelated image), set "isRetailBill": false.
   - For non-bills, provide a polite, clear explanation in "rejectionReason" (e.g., "This image appears to be a doctor's medical prescription, not a retail counter slip or store bill. Koro is designed to scan shop parchi and retail receipts.").
2. If "isRetailBill" is true:
   - Extract every distinct item sold into "items".
   - If an item matches or closely resembles one of the known shop products, prioritize that catalog name.
   - Quantity should be a positive number (default 1 if not specified).
   - Unit price should be in rupees if legible, or null if not written.
   - Ignore tax summaries, totals, cash tender, thank you notes, dates, and non-item lines.`;

      const response = await ai.models.generateContent({
        model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
        contents: [
          {
            inlineData: {
              mimeType,
              data: cleanBase64,
            },
          },
          {
            text: "Analyze this image. Determine if it is a retail store bill/slip. If yes, extract sold items as { itemName, quantity, unitPrice }. If it is not a bill (e.g. prescription, selfie, or random doc), flag isRetailBill as false.",
          },
        ],
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isRetailBill: {
                type: Type.BOOLEAN,
                description: "True if the image is a retail store receipt, handwritten counter parchi, kirana bill, or sales slip. False if it is a medical prescription, personal photo, or non-retail document.",
              },
              documentType: {
                type: Type.STRING,
                description: "Classification: 'retail_slip', 'medical_prescription', 'id_card', 'personal_photo', 'unrelated_document'",
              },
              rejectionReason: {
                type: Type.STRING,
                description: "If isRetailBill is false, clear explanation of what was detected instead.",
              },
              items: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    itemName: {
                      type: Type.STRING,
                      description: "Name of product or sold item",
                    },
                    quantity: {
                      type: Type.NUMBER,
                      description: "Quantity sold (e.g. 1, 2, 5)",
                    },
                    unitPrice: {
                      type: Type.NUMBER,
                      description: "Unit selling price in rupees if indicated, or null",
                    },
                  },
                  required: ["itemName", "quantity"],
                },
              },
            },
            required: ["isRetailBill", "documentType", "items"],
          },
          temperature: 0.1,
        },
      });

      const jsonText = response.text?.trim();
      if (jsonText) {
        const parsed = JSON.parse(jsonText);

        // Guardrail: Non-retail document detected (e.g. Medical Prescription)
        // DO NOT fall back to Tesseract OCR; return a helpful, polite message immediately
        if (parsed.isRetailBill === false) {
          const docTypeFormatted = (parsed.documentType || "document").replace(/_/g, " ");
          return {
            success: false,
            method: "gemini",
            lines: [],
            error:
              parsed.rejectionReason ||
              `Detected a ${docTypeFormatted}, not a retail sales slip or counter bill. Please upload a store receipt or try our Sample Bill.`,
          };
        }

        const rawItems = Array.isArray(parsed.items) ? parsed.items : [];
        if (rawItems.length > 0) {
          const lines: ExtractedSlipLine[] = rawItems.map((raw: any) => {
            const rawName = String(raw.itemName || "").trim();
            const qty = Math.max(0.1, Number(raw.quantity) || 1);
            const matched = matchItemWithCatalog(rawName, catalog);
            const unitPrice =
              raw.unitPrice !== undefined && raw.unitPrice !== null
                ? Number(raw.unitPrice)
                : matched?.selling_price !== undefined && matched?.selling_price !== null
                ? Number(matched.selling_price)
                : null;

            return {
              id: `line-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              rawItemName: rawName,
              quantity: qty,
              unitPrice,
              productId: matched ? matched.id : null,
              isTracked: Boolean(matched),
              status: matched ? "matched" : "unresolved",
              matchedProductName: matched ? matched.name : null,
              confidence: 0.95,
            };
          });

          return {
            success: true,
            method: "gemini",
            lines,
          };
        } else {
          return {
            success: false,
            method: "gemini",
            lines: [],
            error:
              parsed.rejectionReason ||
              "Could not identify legible sold items on this slip. Please verify lighting or enter items manually.",
          };
        }
      }
    } catch (geminiError: any) {
      console.warn(
        "Gemini Vision extraction failed or quota exhausted. Falling back to Local OCR Engine:",
        geminiError?.message || geminiError
      );
    }
  }

  // -------------------------------------------------------------------------
  // Tier 2: Local Tesseract OCR + Heuristic Rule Parser (Zero API Quota Fallback)
  // -------------------------------------------------------------------------
  try {
    const rawText = await extractWithLocalTesseract(cleanBase64, mimeType);
    if (rawText && rawText.trim()) {
      const lines = parseRawSlipText(rawText, catalog);
      if (lines.length > 0) {
        return {
          success: true,
          method: "local_ocr",
          lines,
          rawText,
        };
      }
    }
  } catch (localError: any) {
    console.error("Local OCR fallback error:", localError);
  }

  return {
    success: false,
    method: "local_ocr",
    lines: [],
    error: "Could not detect clear items from the image. Please verify lighting or enter items manually.",
  };
}
