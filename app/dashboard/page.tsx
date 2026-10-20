import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AddProductDialog } from "@/components/inventory/add-product-dialog";
import { InventoryStats } from "@/components/inventory/inventory-stats";
import { InventoryTable } from "@/components/inventory/inventory-table";
import { PlusCircle, PackageSearch, Mic, FileText } from "lucide-react";
import type { Shop, Profile, ShopMember, Product } from "@/lib/supabase/types";

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

  // Fetch shop products
  const { data: productsData } = await supabase
    .from("products")
    .select("*")
    .eq("shop_id", activeShop.id)
    .order("created_at", { ascending: false });

  const products = (productsData as unknown as Product[]) ?? [];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DashboardHeader shop={activeShop} profile={userProfile} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        {products.length === 0 ? (
          <>
            {/* Welcome & First Action Banner */}
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                    Step 1 of 3: Initial Inventory
                  </span>
                  <h2 className="font-heading text-2xl font-bold text-foreground">
                    Welcome to your store, {userProfile?.full_name || "Owner"}!
                  </h2>
                  <p className="text-sm text-muted-foreground max-w-2xl">
                    Your shop <span className="font-semibold text-foreground">&ldquo;{activeShop?.name}&rdquo;</span> is ready.
                    Add your first few frequently used products to start finding items and recording stock changes.
                  </p>
                </div>

                <div className="shrink-0">
                  <AddProductDialog
                    shopId={activeShop.id}
                    defaultCategory={activeShop.category}
                    trigger={
                      <Button className="h-11 px-5 font-semibold gap-2 shadow-sm">
                        <PlusCircle className="h-4 w-4" />
                        <span>Add Your First Product</span>
                      </Button>
                    }
                  />
                </div>
              </div>
            </div>

            {/* Empty Inventory Guidance */}
            <Card className="border-border border-dashed">
              <CardHeader className="text-center pb-2">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-2">
                  <PackageSearch className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg">No Products in Inventory Yet</CardTitle>
                <CardDescription className="max-w-md mx-auto text-xs">
                  Do not require a full inventory on day one. You can add items gradually with custom attributes (shade, color, size, box number).
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center pb-8 pt-2 space-y-4">
                <AddProductDialog
                  shopId={activeShop.id}
                  defaultCategory={activeShop.category}
                  trigger={
                    <Button variant="outline" className="font-semibold gap-2">
                      <PlusCircle className="h-4 w-4 text-primary" />
                      <span>Click Here to Add Product #1</span>
                    </Button>
                  }
                />

                <div className="inline-grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto text-left text-xs pt-4">
                  <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-1">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <Mic className="h-3.5 w-3.5 text-primary" />
                      Voice Search Ready
                    </span>
                    <p className="text-muted-foreground text-[11px]">
                      Once items are added, staff can find exact shelf and box locations using voice commands.
                    </p>
                  </div>

                  <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-1">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-primary" />
                      Slip Capture Ready
                    </span>
                    <p className="text-muted-foreground text-[11px]">
                      Photograph handwritten sales bills to extract line items and automatically deduct stock.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            {/* Top Inventory Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-heading text-2xl font-bold text-foreground">
                  Store Inventory
                </h2>
                <p className="text-xs text-muted-foreground">
                  Manage products, record storage locations (e.g. DRAW-TO-BOX-5), and update stock.
                </p>
              </div>

              <AddProductDialog
                shopId={activeShop.id}
                defaultCategory={activeShop.category}
              />
            </div>

            {/* KPI Statistics */}
            <InventoryStats products={products} />

            {/* Inventory List with Search & Edit */}
            <InventoryTable products={products} />
          </>
        )}
      </main>
    </div>
  );
}
