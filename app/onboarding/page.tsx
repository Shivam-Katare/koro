import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ShieldCheck, Sparkles } from "lucide-react";
import { OnboardingForm } from "@/components/auth/onboarding-form";
import { KoroWordmark } from "@/components/brand/koro-wordmark";
import type { Profile } from "@/lib/supabase/types";

export const instant = false;

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
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-8 sm:py-12 bg-background relative overflow-hidden">
      {/* Ambient decorative glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[500px] rounded-full bg-primary/10 blur-3xl opacity-50"
      />

      <div className="w-full max-w-xl space-y-6 relative z-10">
        {/* Brand Header - Multi-colored Koro only, no logo */}
        <div className="flex flex-col items-center text-center space-y-2">
          <KoroWordmark size="xl" />
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
            Welcome to Koro, {displayName}!
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-sm">
            Complete your shop profile to start managing stock, sales slips, and inventory.
          </p>
        </div>

        {/* Setup Card */}
        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-2xl space-y-5">
          <div className="space-y-1 text-center pb-1">
            <div className="inline-flex items-center gap-1.5 mx-auto rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-semibold text-primary mb-2">
              <Sparkles className="h-3.5 w-3.5" />
              Final Step: Store Setup
            </div>
            <h2 className="text-2xl font-bold font-heading text-foreground">
              Register Your Store
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Enter your store name and select a category. Phone number is optional.
            </p>
          </div>

          <OnboardingForm initialFullName={displayName} initialEmail={user.email} />
        </div>

        <div className="flex items-center justify-center gap-2 rounded-2xl border border-border/70 bg-muted/20 px-4 py-2.5 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
          <span>Private Tenant • RLS Protected Data</span>
        </div>
      </div>
    </div>
  );
}
