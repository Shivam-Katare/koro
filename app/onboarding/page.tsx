import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Store, ShieldCheck, Sparkles } from "lucide-react";
import { OnboardingForm } from "@/components/auth/onboarding-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Profile } from "@/lib/supabase/types";

export default async function OnboardingPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check if user already has an active shop
  const { data: members } = await supabase
    .from("shop_members")
    .select("shop_id")
    .eq("user_id", user.id);

  if (members && members.length > 0) {
    redirect("/dashboard");
  }

  // Pre-fetch or sync profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const userProfile = (profile as unknown as Profile) ?? null;

  const displayName =
    userProfile?.full_name ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "Shop Owner";

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-background">
      <div className="w-full max-w-lg space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md">
            <Store className="h-6 w-6" />
          </div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
            Welcome to Zibbi, {displayName}!
          </h1>
          <p className="text-xs text-muted-foreground max-w-sm">
            Complete your shop details to start managing stock and preparing restock lists.
          </p>
        </div>

        {/* Setup Card */}
        <Card className="border-border shadow-lg">
          <CardHeader className="space-y-1 text-center pb-4">
            <div className="inline-flex items-center gap-1.5 mx-auto rounded-full bg-primary/10 border border-primary/20 px-3 py-0.5 text-xs font-semibold text-primary mb-1">
              <Sparkles className="h-3 w-3" />
              Final Step: Store Setup
            </div>
            <CardTitle className="text-xl font-bold">Register Your Store</CardTitle>
            <CardDescription className="text-xs">
              Enter your store name and select a category. Phone number is optional.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OnboardingForm initialFullName={displayName} initialEmail={user.email} />
          </CardContent>
        </Card>

        <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" />
          <span>Private Tenant • RLS Protected Data</span>
        </div>
      </div>
    </div>
  );
}
