import { z } from "zod";

export const salesLineInputSchema = z.object({
  productId: z.string().uuid().optional().nullable(),
  rawItemName: z.string().trim().min(1, "Item name is required").max(150),
  quantity: z.coerce.number().min(0.01, "Quantity must be greater than 0"),
  unitPrice: z.coerce.number().min(0).optional().nullable(),
  isTracked: z.boolean().default(true),
  status: z.enum(["matched", "untracked", "unresolved"]).default("matched"),
});

export const recordSaleSlipSchema = z.object({
  shopId: z.string().uuid("Invalid shop ID"),
  slipNumber: z.string().trim().min(1, "Slip number is required"),
  source: z.enum(["manual", "ocr_slip"]).default("manual"),
  notes: z.string().trim().max(300).optional().or(z.literal("")),
  idempotencyKey: z.string().optional().nullable(),
  lines: z.array(salesLineInputSchema).min(1, "Please add at least one item to the sale"),
});

export type SalesLineInput = z.infer<typeof salesLineInputSchema>;
export type RecordSaleSlipInput = z.infer<typeof recordSaleSlipSchema>;
