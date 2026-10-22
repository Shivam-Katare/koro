import { z } from "zod";

export const queryAssistantSchema = z.object({
  shopId: z.string().uuid("Invalid shop ID"),
  query: z.string().trim().min(1, "Please speak or type a question").max(500),
  conversationHistory: z
    .array(
      z.object({
        role: z.enum(["user", "assistant", "system"]),
        content: z.string(),
      })
    )
    .optional()
    .default([]),
});

export const confirmAssistantActionSchema = z.object({
  shopId: z.string().uuid("Invalid shop ID"),
  actionType: z.enum([
    "adjust_stock",
    "create_product",
    "update_location",
    "update_price",
  ]),
  productId: z.string().uuid().optional(),
  productName: z.string().min(1),
  quantityDelta: z.number().int().optional(),
  newStock: z.number().int().nonnegative().optional(),
  reason: z.string().optional(),
  openingStock: z.number().int().nonnegative().optional(),
  sellingPrice: z.number().nonnegative().optional(),
  costPrice: z.number().nonnegative().optional(),
  category: z.string().optional(),
  storageLocation: z.string().optional(),
  currentLocation: z.string().optional(),
  newLocation: z.string().optional(),
  currentPrice: z.number().optional().nullable(),
  newPrice: z.number().nonnegative().optional(),
});


export type QueryAssistantInput = z.infer<typeof queryAssistantSchema>;
export type ConfirmAssistantActionInput = z.infer<typeof confirmAssistantActionSchema>;
