import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import type {
  Shop,
  Profile,
  ShopMember,
  Product,
  RestockOrder,
  RestockOrderItemRow,
  StockMovement,
  SalesSlip,
} from "@/lib/supabase/types";

export const instant = false;

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch or upsert profile
  let { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    const meta = user.user_metadata || {};
    const fullName =
      meta.full_name ||
      meta.name ||
      user.email?.split("@")[0] ||
      "Shop Owner";
    const avatarUrl = meta.avatar_url || meta.picture || "";

    const { data: createdProfile } = await (supabase
      .from("profiles") as any)
      .upsert({
        id: user.id,
        full_name: fullName,
        email: user.email || "",
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      })
      .select("*")
      .maybeSingle();
    profile = createdProfile;
  }

  // Fetch shop membership
  const { data: members } = await supabase
    .from("shop_members")
    .select("*")
    .eq("user_id", user.id);

  const userProfile = (profile as unknown as Profile) ?? null;
  const memberList = (members as unknown as ShopMember[]) ?? [];
  const currentMember = memberList[0];
  let activeShop: Shop | null = null;

  if (currentMember?.shop_id) {
    const { data: shop } = await supabase
      .from("shops")
      .select("*")
      .eq("id", currentMember.shop_id)
      .maybeSingle();
    activeShop = (shop as unknown as Shop) ?? null;
  }

  // If user has no shop yet, redirect to onboarding
  if (!activeShop) {
    redirect("/onboarding");
  }

  // Fetch shop products, restock data, stock movements and sales slips in parallel (strictly scoped to activeShop.id)
  const [productsRes, restockOrdersRes, restockItemsRes, movementsRes, salesRes] = await Promise.all([
    supabase
      .from("products")
      .select("*")
      .eq("shop_id", activeShop.id)
      .order("created_at", { ascending: false }),
    (supabase.from("restock_orders") as any)
      .select("*")
      .eq("shop_id", activeShop.id)
      .order("created_at", { ascending: false }),
    (supabase.from("restock_order_items") as any)
      .select("*")
      .eq("shop_id", activeShop.id)
      .order("created_at", { ascending: false }),
    (supabase.from("stock_movements") as any)
      .select("*")
      .eq("shop_id", activeShop.id)
      .order("created_at", { ascending: false })
      .limit(15),
    (supabase.from("sales_slips") as any)
      .select("*")
      .eq("shop_id", activeShop.id)
      .order("created_at", { ascending: false })
      .limit(150),
  ]);

  const products = (productsRes.data as unknown as Product[]) ?? [];
  const restockOrders = (restockOrdersRes.data as unknown as RestockOrder[]) ?? [];
  const restockOrderItems = (restockItemsRes.data as unknown as RestockOrderItemRow[]) ?? [];
  const stockMovements = (movementsRes.data as unknown as StockMovement[]) ?? [];
  const salesSlips = (salesRes.data as unknown as SalesSlip[]) ?? [];

  return (
    <DashboardShell
      shop={activeShop}
      profile={userProfile}
      products={products}
      restockOrders={restockOrders}
      restockOrderItems={restockOrderItems}
      stockMovements={stockMovements}
      salesSlips={salesSlips}
    />
  );
}
