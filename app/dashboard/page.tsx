import { redirect } from "next/navigation";
import { cookies } from "next/headers";
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

const DEMO_SHOP_ID = "1bd46074-6e69-4b38-83c9-d25a2999d011";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ demo?: string }>;
}) {
  const params = await searchParams;
  const isDemoParam = params?.demo === "true";
  const cookieStore = await cookies();
  const isDemoCookie = cookieStore.get("koro_demo_mode")?.value === "true";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let activeShop: Shop | null = null;
  let userProfile: Profile | null = null;

  // 1. If not logged in, or explicitly requested demo mode, load the Pooja Demo Shop
  if (!user || isDemoParam || isDemoCookie) {
    let { data: demoShop } = await supabase
      .from("shops")
      .select("*")
      .eq("id", DEMO_SHOP_ID)
      .maybeSingle();

    if (!demoShop) {
      const { data: anyDemo } = await supabase
        .from("shops")
        .select("*")
        .eq("is_demo", true)
        .limit(1)
        .maybeSingle();
      demoShop = anyDemo;
    }

    if (!demoShop) {
      demoShop = {
        id: DEMO_SHOP_ID,
        name: "Pooja",
        owner_id: "demo_owner",
        category: "Cosmetics & Bangles",
        whatsapp_number: "+91 98765 43210",
        address: "Shop 4, Main Market, Mumbai",
        is_demo: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as any;
    }

    activeShop = demoShop as unknown as Shop;
    userProfile = {
      id: user?.id || "demo_guest",
      full_name: "Shivam (Demo)",
      email: user?.email || "demo@koro.retail",
      phone: null,
      avatar_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  // 2. Authenticated user normal flow
  if (!activeShop && user) {
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

    userProfile = (profile as unknown as Profile) ?? null;

    // Fetch shop membership
    const { data: members } = await supabase
      .from("shop_members")
      .select("*")
      .eq("user_id", user.id);

    const memberList = (members as unknown as ShopMember[]) ?? [];
    const currentMember = memberList[0];

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
  }

  if (!activeShop) {
    redirect("/login");
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
