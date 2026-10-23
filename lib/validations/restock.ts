import { z } from "zod";

export const restockItemSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
  receivedQuantity: z
    .number()
    .int("Quantity must be a whole number")
    .min(1, "Received quantity must be at least 1"),
});

export const recordRestockArrivalSchema = z.object({
  items: z.array(restockItemSchema).min(1, "Please select at least one item to restock"),
  notes: z.string().trim().max(250).optional().or(z.literal("")),
});

export type RestockItemInput = z.infer<typeof restockItemSchema>;
export type RecordRestockArrivalInput = z.infer<typeof recordRestockArrivalSchema>;

export const createRestockOrderSchema = z.object({
  shopId: z.string().uuid("Invalid shop ID"),
  channel: z.enum(["whatsapp", "copy_clipboard", "manual"]).default("whatsapp"),
  distributorName: z.string().trim().max(150).optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
  items: z
    .array(
      z.object({
        productId: z.string().uuid("Invalid product ID"),
        productName: z.string().min(1, "Product name required"),
        quantity: z.number().int().min(1, "Quantity must be at least 1"),
      })
    )
    .min(1, "Please select at least one item to restock"),
});

export const recordItemArrivalSchema = z.object({
  orderItemId: z.string().uuid("Invalid order item ID"),
  productId: z.string().uuid("Invalid product ID"),
  receivedQuantity: z
    .number()
    .int("Quantity must be a whole number")
    .min(1, "Received quantity must be at least 1"),
  notes: z.string().trim().max(250).optional().or(z.literal("")),
});

export const cancelRestockOrderSchema = z.object({
  orderId: z.string().uuid("Invalid order ID"),
});

export const deleteRestockOrderSchema = z.object({
  orderId: z.string().uuid("Invalid order ID"),
});

export const quickAddRestockItemSchema = z.object({
  shopId: z.string().uuid("Invalid shop ID"),
  name: z
    .string()
    .trim()
    .min(2, "Item name must be at least 2 characters")
    .max(150, "Item name is too long"),
  quantity: z
    .number()
    .int("Quantity must be a whole number")
    .min(1, "Order quantity must be at least 1"),
  brand: z.string().trim().max(80).optional().or(z.literal("")),
  category: z.string().trim().optional().or(z.literal("")),
  notes: z.string().trim().max(250).optional().or(z.literal("")),
});

export type CreateRestockOrderInput = z.infer<typeof createRestockOrderSchema>;
export type RecordItemArrivalInput = z.infer<typeof recordItemArrivalSchema>;
export type CancelRestockOrderInput = z.infer<typeof cancelRestockOrderSchema>;
export type DeleteRestockOrderInput = z.infer<typeof deleteRestockOrderSchema>;
export type QuickAddRestockItemInput = z.infer<typeof quickAddRestockItemSchema>;
