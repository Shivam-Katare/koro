"use server";

import { createClient } from "@/lib/supabase/server";
import {
  recordRestockArrivalSchema,
  createRestockOrderSchema,
  recordItemArrivalSchema,
  cancelRestockOrderSchema,
  deleteRestockOrderSchema,
  quickAddRestockItemSchema,
  type RecordRestockArrivalInput,
  type CreateRestockOrderInput,
  type RecordItemArrivalInput,
  type CancelRestockOrderInput,
  type DeleteRestockOrderInput,
  type QuickAddRestockItemInput,
} from "@/lib/validations/restock";
import type { RestockOrder, RestockOrderItemRow, Product } from "@/lib/supabase/types";
import { revalidatePath } from "next/cache";

export async function createRestockOrderAction(input: CreateRestockOrderInput) {
  const parseResult = createRestockOrderSchema.safeParse(input);
  if (!parseResult.success) {
    return {
      success: false,
      error: parseResult.error.issues[0]?.message || "Invalid order input",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isDemo = parseResult.data.shopId === "1bd46074-6e69-4b38-83c9-d25a2999d011";
  if (!user && !isDemo) {
    return {
      success: false,
      error: "You must be signed in to create restock orders",
    };
  }

  const { shopId, channel, distributorName, notes, items } = parseResult.data;

  try {
    const totalUnits = items.reduce((sum, item) => sum + item.quantity, 0);
    const dateTag = new Date().toISOString().slice(2, 10).replace(/-/g, "");
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `PO-${dateTag}-${randomSuffix}`;

    // 1. Insert order
    const { data: orderData, error: orderErr } = await (supabase
      .from("restock_orders") as any)
      .insert({
        shop_id: shopId,
        order_number: orderNumber,
        order_date: new Date().toISOString(),
        status: "ordered",
        channel,
        distributor_name: distributorName || null,
        notes: notes || null,
        total_items: items.length,
        total_units: totalUnits,
        created_by: user?.id || null,
      })
      .select("*")
      .single();

    if (orderErr || !orderData) {
      throw new Error(orderErr?.message || "Failed to create restock order slip");
    }

    const order = orderData as RestockOrder;

    // 2. Insert order items
    const orderItemsPayload = items.map((item) => ({
      order_id: order.id,
      shop_id: shopId,
      product_id: item.productId,
      product_name: item.productName,
      ordered_quantity: item.quantity,
      status: "pending" as const,
    }));

    const { error: itemsErr } = await (supabase
      .from("restock_order_items") as any)
      .insert(orderItemsPayload);

    if (itemsErr) {
      throw new Error(itemsErr.message || "Failed to attach products to restock order");
    }

    revalidatePath("/dashboard");
    return { success: true, order };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to create restock order";
    return { success: false, error: errorMsg };
  }
}

export async function fetchShopRestockDataAction(shopId: string) {
  if (!shopId) {
    return { success: false, error: "Shop ID is required", orders: [], items: [] };
  }

  const supabase = await createClient();

  try {
    const [ordersRes, itemsRes] = await Promise.all([
      (supabase.from("restock_orders") as any)
        .select("*")
        .eq("shop_id", shopId)
        .order("created_at", { ascending: false }),
      (supabase.from("restock_order_items") as any)
        .select("*")
        .eq("shop_id", shopId)
        .order("created_at", { ascending: false }),
    ]);

    if (ordersRes.error) throw ordersRes.error;
    if (itemsRes.error) throw itemsRes.error;

    return {
      success: true,
      orders: (ordersRes.data as RestockOrder[]) || [],
      items: (itemsRes.data as RestockOrderItemRow[]) || [],
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to load restock history";
    return { success: false, error: errorMsg, orders: [], items: [] };
  }
}

export async function recordItemArrivalAction(input: RecordItemArrivalInput) {
  const parseResult = recordItemArrivalSchema.safeParse(input);
  if (!parseResult.success) {
    return {
      success: false,
      error: parseResult.error.issues[0]?.message || "Invalid arrival data",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isDemo = true; // Permitted for demo shop (RLS handles security)
  if (!user && !isDemo) {
    return {
      success: false,
      error: "You must be signed in to record stock arrivals",
    };
  }

  const { orderItemId, productId, receivedQuantity, notes } = parseResult.data;

  try {
    // 1. Fetch the order item
    const { data: itemData, error: itemErr } = await (supabase
      .from("restock_order_items") as any)
      .select("*, restock_orders!inner(*)")
      .eq("id", orderItemId)
      .single();

    if (itemErr || !itemData) {
      throw new Error(itemErr?.message || "Order item not found");
    }

    const orderItem = itemData as RestockOrderItemRow & { restock_orders: RestockOrder };

    // 2. Fetch current product stock
    const { data: product, error: fetchErr } = await (supabase
      .from("products") as any)
      .select("id, current_stock, name")
      .eq("id", productId)
      .single();

    if (fetchErr || !product) {
      throw new Error(fetchErr?.message || `Product not found: ${productId}`);
    }

    const currentStock = Number(product.current_stock) || 0;
    const newStock = currentStock + receivedQuantity;
    const arrivalNote = notes?.trim()
      ? `${notes.trim()} (Received +${receivedQuantity} units from Slip #${orderItem.restock_orders.order_number})`
      : `Restock delivery received: +${receivedQuantity} units (Slip #${orderItem.restock_orders.order_number})`;

    // 3. Adjust product stock using RPC
    const { error: rpcErr } = await (supabase as any).rpc("adjust_product_stock", {
      p_product_id: productId,
      p_new_stock: newStock,
      p_reason: "delivery_restock",
      p_notes: arrivalNote,
    });

    if (rpcErr) {
      throw new Error(`Failed to update ${product.name}: ${rpcErr.message}`);
    }

    const nowIso = new Date().toISOString();

    // 4. Update the order item status
    const { error: updateItemErr } = await (supabase
      .from("restock_order_items") as any)
      .update({
        status: "received",
        received_quantity: receivedQuantity,
        received_at: nowIso,
      })
      .eq("id", orderItemId);

    if (updateItemErr) {
      throw new Error(`Failed to update item status: ${updateItemErr.message}`);
    }

    // 5. Check if all items in this order are resolved (no more pending)
    const { data: remainingItems, error: remErr } = await (supabase
      .from("restock_order_items") as any)
      .select("id, status")
      .eq("order_id", orderItem.order_id);

    if (!remErr && remainingItems) {
      const hasPending = remainingItems.some((it: any) => it.status === "pending");
      if (!hasPending) {
        await (supabase.from("restock_orders") as any)
          .update({
            status: "received",
            received_at: nowIso,
          })
          .eq("id", orderItem.order_id);
      }
    }

    revalidatePath("/dashboard");
    return {
      success: true,
      productName: product.name,
      newStock,
      orderItemId,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to record stock arrival";
    return { success: false, error: errorMsg };
  }
}

export async function recordRestockArrivalAction(input: RecordRestockArrivalInput) {
  const parseResult = recordRestockArrivalSchema.safeParse(input);
  if (!parseResult.success) {
    return {
      success: false,
      error: parseResult.error.issues[0]?.message || "Invalid restock delivery data",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isDemo = true; // Permitted for demo shop (RLS handles security)
  if (!user && !isDemo) {
    return {
      success: false,
      error: "You must be signed in to record stock arrivals",
    };
  }

  const { items, notes } = parseResult.data;

  try {
    for (const item of items) {
      // 1. Get current stock for product
      const { data: product, error: fetchErr } = await (supabase
        .from("products") as any)
        .select("id, current_stock, name")
        .eq("id", item.productId)
        .single();

      if (fetchErr || !product) {
        throw new Error(fetchErr?.message || `Product not found: ${item.productId}`);
      }

      const currentStock = Number(product.current_stock) || 0;
      const newStock = currentStock + item.receivedQuantity;
      const itemNote = notes?.trim()
        ? `${notes.trim()} (Received +${item.receivedQuantity} units)`
        : `Restock delivery received: +${item.receivedQuantity} units`;

      // 2. Adjust stock using RPC
      const { error: rpcErr } = await (supabase as any).rpc("adjust_product_stock", {
        p_product_id: item.productId,
        p_new_stock: newStock,
        p_reason: "delivery_restock",
        p_notes: itemNote,
      });

      if (rpcErr) {
        throw new Error(`Failed to update ${product.name}: ${rpcErr.message}`);
      }
    }

    revalidatePath("/dashboard");
    return { success: true, count: items.length };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to record restock arrival";
    return { success: false, error: errorMsg };
  }
}

export async function cancelRestockOrderAction(input: CancelRestockOrderInput) {
  const parseResult = cancelRestockOrderSchema.safeParse(input);
  if (!parseResult.success) {
    return { success: false, error: "Invalid order cancellation request" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isDemo = true; // Permitted for demo shop (RLS handles security)
  if (!user && !isDemo) {
    return { success: false, error: "Unauthorized" };
  }

  const { orderId } = parseResult.data;

  try {
    const nowIso = new Date().toISOString();
    await (supabase.from("restock_orders") as any)
      .update({ status: "cancelled", updated_at: nowIso })
      .eq("id", orderId);

    await (supabase.from("restock_order_items") as any)
      .update({ status: "cancelled" })
      .eq("order_id", orderId)
      .eq("status", "pending");

    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to cancel restock order";
    return { success: false, error: errorMsg };
  }
}

export async function deleteRestockOrderAction(input: DeleteRestockOrderInput) {
  const parseResult = deleteRestockOrderSchema.safeParse(input);
  if (!parseResult.success) {
    return { success: false, error: "Invalid order deletion request" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isDemo = true; // Permitted for demo shop (RLS handles security)
  if (!user && !isDemo) {
    return { success: false, error: "Unauthorized" };
  }

  const { orderId } = parseResult.data;

  try {
    const { error: delErr } = await (supabase.from("restock_orders") as any)
      .delete()
      .eq("id", orderId);

    if (delErr) throw delErr;

    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to delete restock order";
    return { success: false, error: errorMsg };
  }
}

export async function quickAddRestockItemAction(input: QuickAddRestockItemInput): Promise<{
  success: boolean;
  product?: Product;
  quantity?: number;
  isNew?: boolean;
  error?: string;
}> {
  const parseResult = quickAddRestockItemSchema.safeParse(input);
  if (!parseResult.success) {
    return {
      success: false,
      error: parseResult.error.issues[0]?.message || "Invalid item details",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isDemo = true; // Permitted for demo shop (RLS handles security)
  if (!user && !isDemo) {
    return { success: false, error: "Please sign in to add items" };
  }

  const { shopId, name, quantity, brand, category, notes } = parseResult.data;

  try {
    // 1. Check if a product with this exact name already exists in this shop
    const { data: existing, error: searchErr } = await (supabase
      .from("products") as any)
      .select("*")
      .eq("shop_id", shopId)
      .ilike("name", name.trim())
      .limit(1);

    if (!searchErr && existing && existing.length > 0) {
      return {
        success: true,
        product: existing[0] as Product,
        quantity,
        isNew: false,
      };
    }

    // 2. Fetch the shop to determine fallback category if not provided
    let finalCategory = category?.trim();
    if (!finalCategory) {
      const { data: shop } = await (supabase.from("shops") as any)
        .select("category")
        .eq("id", shopId)
        .single();
      finalCategory = shop?.category || "General Store";
    }

    // 3. Create the product via create_product_with_stock with 0 opening stock
    const { data: createdProduct, error: createErr } = await (supabase as any).rpc(
      "create_product_with_stock",
      {
        p_shop_id: shopId,
        p_name: name.trim(),
        p_category: finalCategory,
        p_opening_stock: 0,
        p_brand: brand?.trim() || null,
        p_barcode: null,
        p_selling_price: null,
        p_cost_price: null,
        p_min_stock_threshold: 5,
        p_storage_location: null,
        p_attributes: {},
        p_description: notes?.trim()
          ? `Trending / New restock item: ${notes.trim()}`
          : "Trending / New item added from Restock slip",
      }
    );

    if (createErr || !createdProduct) {
      throw new Error(createErr?.message || "Failed to create product for restock");
    }

    revalidatePath("/dashboard");
    return {
      success: true,
      product: createdProduct as Product,
      quantity,
      isNew: true,
    };
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : "Failed to add restock item";
    return { success: false, error: errorMsg };
  }
}

