import { z } from "zod";

export const queryAssistantSchema = z.object({
  shopId: z.string().uuid("Invalid shop ID"),
  query: z.string().trim().min(1, "Please speak or type a question").max(500),
  conversationId: z.string().optional(),
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
    "delete_product",
    "record_sale",
    "record_order_arrival",
  ]),
  productId: z.string().uuid().optional(),
  productName: z.string().min(1),
  quantityDelta: z.number().int().optional(),
  newStock: z.number().int().nonnegative().optional().nullable(),
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
  conversationId: z.string().optional(),
  // For record_sale
  quantity: z.number().int().positive().optional(),
  unitPrice: z.number().nonnegative().optional(),
  totalAmount: z.number().nonnegative().optional(),
  isUnlinked: z.boolean().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().uuid().optional(),
        productName: z.string().min(1),
        quantity: z.number().int().positive(),
        unitPrice: z.number().nonnegative(),
        lineTotal: z.number().nonnegative().optional(),
        currentStock: z.number().nullable().optional(),
        newStock: z.number().nullable().optional(),
        isUnlinked: z.boolean().optional(),
        isOutOfStock: z.boolean().optional(),
      })
    )
    .optional(),
  notes: z.string().optional(),
  // For record_order_arrival
  orderItemId: z.string().uuid().optional(),
  orderNumber: z.string().optional(),
  receivedQuantity: z.number().int().positive().optional(),
});


export type QueryAssistantInput = z.infer<typeof queryAssistantSchema>;
export type ConfirmAssistantActionInput = z.infer<typeof confirmAssistantActionSchema>;
