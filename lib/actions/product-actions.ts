"use server";

import { createClient } from "@/lib/supabase/server";
import {
  createProductSchema,
  updateProductSchema,
  adjustStockSchema,
  type CreateProductInput,
  type UpdateProductInput,
  type AdjustStockInput,
} from "@/lib/validations/product";
import { revalidatePath } from "next/cache";

export async function createProductAction(input: CreateProductInput) {
  const result = createProductSchema.safeParse(input);
  if (!result.success) {
    return {
      success: false,
      error: result.error.issues[0]?.message || "Invalid product details",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Please sign in to add products" };
  }

  const { data, error } = await (supabase as any).rpc("create_product_with_stock", {
    p_shop_id: result.data.shopId,
    p_name: result.data.name,
    p_category: result.data.category,
    p_opening_stock: result.data.openingStock,
    p_brand: result.data.brand || null,
    p_barcode: result.data.barcode || null,
    p_selling_price: result.data.sellingPrice || null,
    p_cost_price: result.data.costPrice || null,
    p_min_stock_threshold: result.data.minStockThreshold,
    p_storage_location: result.data.storageLocation || null,
    p_attributes: result.data.attributes || {},
    p_description: result.data.description || null,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard");
  return { success: true, product: data };
}

export async function updateProductAction(input: UpdateProductInput) {
  const result = updateProductSchema.safeParse(input);
  if (!result.success) {
    return {
      success: false,
      error: result.error.issues[0]?.message || "Invalid product details",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Please sign in to edit products" };
  }

  const { data, error } = await (supabase.from("products") as any)
    .update({
      name: result.data.name,
      category: result.data.category,
      brand: result.data.brand || null,
      barcode: result.data.barcode || null,
      selling_price: result.data.sellingPrice || null,
      cost_price: result.data.costPrice || null,
      min_stock_threshold: result.data.minStockThreshold,
      storage_location: result.data.storageLocation || null,
      attributes: result.data.attributes || {},
      description: result.data.description || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", result.data.productId)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard");
  return { success: true, product: data };
}

export async function adjustStockAction(input: AdjustStockInput) {
  const result = adjustStockSchema.safeParse(input);
  if (!result.success) {
    return {
      success: false,
      error: result.error.issues[0]?.message || "Invalid stock adjustment",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Please sign in to adjust stock" };
  }

  const { data, error } = await (supabase as any).rpc("adjust_product_stock", {
    p_product_id: result.data.productId,
    p_new_stock: result.data.newStock,
    p_reason: result.data.reason,
    p_notes: result.data.notes || null,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard");
  return { success: true, product: data };
}

export async function deleteProductAction(productId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Please sign in to delete products" };
  }

  const { error } = await supabase.from("products").delete().eq("id", productId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard");
  return { success: true };
}
