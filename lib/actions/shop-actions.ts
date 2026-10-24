"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Shop } from "@/lib/supabase/types";

export interface UpdateShopSettingsInput {
  shopId: string;
  name: string;
  category: string;
  description?: string | null;
  whatsappNumber?: string | null;
}

export async function updateShopSettingsAction(
  input: UpdateShopSettingsInput
): Promise<{ success: boolean; shop?: Shop; error?: string }> {
  const cleanName = input.name?.trim();
  const cleanCategory = input.category?.trim();
  const cleanDescription = input.description?.trim() || null;
  const cleanWhatsapp = input.whatsappNumber?.trim() || null;

  if (!input.shopId) {
    return { success: false, error: "Shop ID is required." };
  }

  if (!cleanName || cleanName.length < 2) {
    return {
      success: false,
      error: "Shop name must be at least 2 characters long.",
    };
  }

  if (cleanName.length > 120) {
    return {
      success: false,
      error: "Shop name cannot exceed 120 characters.",
    };
  }

  if (!cleanCategory) {
    return { success: false, error: "Shop category is required." };
  }

  if (cleanDescription && cleanDescription.length > 1000) {
    return {
      success: false,
      error: "Shop description cannot exceed 1000 characters.",
    };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized. Please sign in." };
    }

    // Verify ownership via shop_members or direct owner_id check
    const { data: member } = await (supabase.from("shop_members") as any)
      .select("role")
      .eq("shop_id", input.shopId)
      .eq("user_id", user.id)
      .maybeSingle();

    const { data: existingShop } = await (supabase.from("shops") as any)
      .select("id, owner_id")
      .eq("id", input.shopId)
      .maybeSingle();

    if (!existingShop) {
      return { success: false, error: "Shop not found." };
    }

    const isOwner =
      member?.role === "owner" || existingShop?.owner_id === user.id;

    if (!isOwner) {
      return {
        success: false,
        error: "Only the shop owner is authorized to update store settings.",
      };
    }

    const { data: updatedShop, error: updateErr } = await (
      supabase.from("shops") as any
    )
      .update({
        name: cleanName,
        category: cleanCategory,
        description: cleanDescription,
        whatsapp_number: cleanWhatsapp,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.shopId)
      .select()
      .single();

    if (updateErr) {
      return {
        success: false,
        error: updateErr.message || "Failed to update shop details.",
      };
    }

    revalidatePath("/dashboard");
    return { success: true, shop: updatedShop as unknown as Shop };
  } catch (err: unknown) {
    console.error("Error in updateShopSettingsAction:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update store settings.",
    };
  }
}
