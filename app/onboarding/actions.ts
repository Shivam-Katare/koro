"use server";

import { createClient } from "@/lib/supabase/server";
import { onboardingSchema, type OnboardingInput } from "@/lib/validations/auth";
import { revalidatePath } from "next/cache";

export async function createShopAction(input: OnboardingInput) {
  const result = onboardingSchema.safeParse(input);
  if (!result.success) {
    return {
      success: false,
      error: result.error.issues[0]?.message || "Invalid input data",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      error: "Authentication required. Please sign in again.",
    };
  }

  const fullName =
    result.data.fullName?.trim() ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "Shop Owner";

  const { data: rpcData, error: rpcError } = await (supabase as any).rpc(
    "create_shop_with_owner",
    {
      p_name: result.data.shopName.trim(),
      p_category: result.data.category,
      p_whatsapp_number: result.data.whatsappNumber?.trim() || "",
      p_full_name: fullName,
    }
  );

  if (rpcError) {
    return {
      success: false,
      error: rpcError.message || "Failed to create shop in database",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/onboarding");

  return {
    success: true,
    shop: rpcData,
  };
}
