"use server";

import { createClient } from "@/lib/supabase/server";
import {
  recordSaleSlipSchema,
  type RecordSaleSlipInput,
} from "@/lib/validations/sales";
import { revalidatePath } from "next/cache";

export async function recordSaleSlipAction(input: RecordSaleSlipInput) {
  const parseResult = recordSaleSlipSchema.safeParse(input);
  if (!parseResult.success) {
    return {
      success: false,
      error: parseResult.error.issues[0]?.message || "Invalid sales slip data",
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
      error: "Please sign in to record sales",
    };
  }

  const { shopId, slipNumber, source, notes, idempotencyKey, lines } = parseResult.data;

  const rpcLines = lines.map((l) => ({
    product_id: l.productId || null,
    raw_item_name: l.rawItemName,
    quantity: l.quantity,
    unit_price: l.unitPrice !== undefined ? l.unitPrice : null,
    is_tracked: l.isTracked,
    status: l.status,
  }));

  try {
    const { data: result, error: rpcErr } = await (supabase as any).rpc(
      "record_sales_slip",
      {
        p_shop_id: shopId,
        p_slip_number: slipNumber,
        p_source: source,
        p_notes: notes || null,
        p_idempotency_key: idempotencyKey || null,
        p_lines: rpcLines,
      }
    );

    if (rpcErr) {
      return { success: false, error: rpcErr.message };
    }

    revalidatePath("/dashboard");
    return {
      success: true,
      slip: result?.slip,
      alreadyRecorded: Boolean(result?.already_recorded),
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to record sale";
    return { success: false, error: msg };
  }
}

export async function fetchRecentSlipsAction(shopId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isDemo = shopId === "1bd46074-6e69-4b38-83c9-d25a2999d011";
  if (!user && !isDemo) {
    return { success: false, error: "Not authenticated", slips: [] };
  }

  try {
    const { data: slips, error: slipsErr } = await (supabase
      .from("sales_slips") as any)
      .select("*")
      .eq("shop_id", shopId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (slipsErr) {
      return { success: false, error: slipsErr.message, slips: [] };
    }

    if (!slips || slips.length === 0) {
      return { success: true, slips: [] };
    }

    const slipIds = slips.map((s: any) => s.id);
    const { data: allLines } = await (supabase
      .from("sales_slip_lines") as any)
      .select("*")
      .in("slip_id", slipIds);

    const linesBySlip = (allLines || []).reduce((acc: Record<string, any[]>, line: any) => {
      acc[line.slip_id] = acc[line.slip_id] || [];
      acc[line.slip_id].push(line);
      return acc;
    }, {});

    const enriched = slips.map((s: any) => ({
      ...s,
      lines: linesBySlip[s.id] || [],
    }));

    return { success: true, slips: enriched };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load recent slips";
    return { success: false, error: msg, slips: [] };
  }
}
