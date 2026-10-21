import { z } from "zod";

export const CATEGORY_ATTRIBUTE_PRESETS: Record<
  string,
  { label: string; key: string; placeholder: string }[]
> = {
  "Cosmetics & Bangles / Jewelry": [
    { label: "Shade / Variant", key: "shade", placeholder: "e.g. 04 Ruby, Maroon" },
    { label: "Color", key: "color", placeholder: "e.g. Golden, Pink, Red" },
    { label: "Size", key: "size", placeholder: "e.g. 2.4, 2.6, 2.8, Free Size" },
    { label: "Box / Drawer No", key: "box_number", placeholder: "e.g. BOX-5, Tray 12" },
  ],
  "Apparel & Garments": [
    { label: "Size", key: "size", placeholder: "e.g. S, M, L, XL, 32, 34" },
    { label: "Color", key: "color", placeholder: "e.g. Navy Blue, Maroon" },
    { label: "Fabric / Material", key: "fabric", placeholder: "e.g. Cotton, Denim" },
    { label: "Rack / Shelf", key: "box_number", placeholder: "e.g. Hanger Rack 2" },
  ],
  "Kirana & Grocery": [
    { label: "Pack Size / Weight", key: "pack_size", placeholder: "e.g. 1kg, 500g, 5L" },
    { label: "Batch / Expiry", key: "batch_no", placeholder: "e.g. Exp Nov 2026" },
    { label: "Sack / Shelf No", key: "box_number", placeholder: "e.g. Sack 4, Shelf 2" },
  ],
  "Hardware & Electrical": [
    { label: "Model / Wattage", key: "model", placeholder: "e.g. 9W LED, 1.5mm" },
    { label: "Gauge / Size", key: "size", placeholder: "e.g. 1/2 inch, 2 inch" },
    { label: "Bin / Rack No", key: "box_number", placeholder: "e.g. Bin B-12" },
  ],
  "Stationery & Books": [
    { label: "Class / Subject", key: "class_subject", placeholder: "e.g. Class 10 Maths" },
    { label: "Publisher / Brand", key: "publisher", placeholder: "e.g. NCERT, Classmate" },
    { label: "Rack / Shelf", key: "box_number", placeholder: "e.g. Shelf A-3" },
  ],
  "General Store": [
    { label: "Variant / Flavor", key: "variant", placeholder: "e.g. Refill, Regular" },
    { label: "Size / Pack", key: "size", placeholder: "e.g. Pack of 2" },
    { label: "Box / Drawer", key: "box_number", placeholder: "e.g. DRAW-TO-BOX-5" },
  ],
  "Other Retail": [
    { label: "Variant", key: "variant", placeholder: "e.g. Standard" },
    { label: "Box / Location", key: "box_number", placeholder: "e.g. Box 1" },
  ],
};

export const createProductSchema = z.object({
  shopId: z.string().uuid("Invalid shop ID"),
  name: z
    .string()
    .trim()
    .min(2, "Product name must be at least 2 characters")
    .max(150, "Product name is too long"),
  category: z.string().min(1, "Please select a category"),
  openingStock: z.coerce
    .number()
    .min(0, "Opening stock cannot be negative")
    .default(0),
  brand: z.string().trim().max(80).optional().or(z.literal("")),
  barcode: z.string().trim().max(80).optional().or(z.literal("")),
  sellingPrice: z.coerce
    .number()
    .min(0, "Price cannot be negative")
    .optional()
    .nullable(),
  costPrice: z.coerce
    .number()
    .min(0, "Cost cannot be negative")
    .optional()
    .nullable(),
  minStockThreshold: z.coerce
    .number()
    .min(0, "Threshold cannot be negative")
    .default(5),
  storageLocation: z.string().trim().max(100).optional().or(z.literal("")),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  attributes: z.record(z.string(), z.any()).default({}),
});

export const updateProductSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
  name: z
    .string()
    .trim()
    .min(2, "Product name must be at least 2 characters")
    .max(150, "Product name is too long"),
  category: z.string().min(1, "Please select a category"),
  brand: z.string().trim().max(80).optional().or(z.literal("")),
  barcode: z.string().trim().max(80).optional().or(z.literal("")),
  sellingPrice: z.coerce.number().min(0).optional().nullable(),
  costPrice: z.coerce.number().min(0).optional().nullable(),
  minStockThreshold: z.coerce.number().min(0).default(5),
  storageLocation: z.string().trim().max(100).optional().or(z.literal("")),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  attributes: z.record(z.string(), z.any()).default({}),
});

export const adjustStockSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
  newStock: z.coerce.number().min(0, "Stock cannot be negative"),
  reason: z
    .enum(["manual_adjustment", "delivery_restock", "correction", "opening_stock"])
    .default("correction"),
  notes: z.string().trim().max(250).optional().or(z.literal("")),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type AdjustStockInput = z.infer<typeof adjustStockSchema>;
