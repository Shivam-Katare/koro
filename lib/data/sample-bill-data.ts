import type { ExtractedSlipLine } from "@/lib/types/slip-extractor";

export const SAMPLE_BILL_IMAGE_URL = "/demo/sample-slip.svg";

/**
 * Pre-verified sample bill lines matching products in the Pooja Demo Shop.
 * Enables instant 0-latency testing for hackathon judges with zero API quota consumption.
 */
export const SAMPLE_BILL_ITEMS: ExtractedSlipLine[] = [
  {
    id: "sample-line-1",
    rawItemName: "Kaveri Natural Herbal Mehendi Cone 25g",
    quantity: 5,
    unitPrice: 15,
    confidence: 0.99,
    productId: "d4c5f43a-590b-42ee-8ffa-87bb527aa91f",
    isTracked: true,
    status: "matched",
    matchedProductName: "Kaveri Natural Herbal Mehendi Cone 25g",
  },
  {
    id: "sample-line-2",
    rawItemName: "Maybelline Colossal Kajal Deep Black",
    quantity: 1,
    unitPrice: 199,
    confidence: 0.98,
    productId: "0b6d7aee-d8ff-4d49-bdbf-21b1cf3987fb",
    isTracked: true,
    status: "matched",
    matchedProductName: "Maybelline Colossal Kajal Deep Black",
  },
  {
    id: "sample-line-3",
    rawItemName: "Shilpa Velvet Round Red Bindi - Size 6 Card",
    quantity: 2,
    unitPrice: 20,
    confidence: 0.97,
    productId: "b64533ca-d029-4652-bdcc-b85debf023bf",
    isTracked: true,
    status: "matched",
    matchedProductName: "Shilpa Velvet Round Red Bindi - Size 6 Card",
  },
  {
    id: "sample-line-4",
    rawItemName: "Nivea cream",
    quantity: 1,
    unitPrice: 160,
    confidence: 0.98,
    productId: "5c0795b3-2242-4423-9afc-95140a72490a",
    isTracked: true,
    status: "matched",
    matchedProductName: "Nivea cream",
  },
  {
    id: "sample-line-5",
    rawItemName: "Boroline Antiseptic Ayurvedic Cream 20g",
    quantity: 2,
    unitPrice: 45,
    confidence: 0.99,
    productId: "ccc62286-8b7f-4650-96b8-fa21431bb907",
    isTracked: true,
    status: "matched",
    matchedProductName: "Boroline Antiseptic Ayurvedic Cream 20g",
  },
];
