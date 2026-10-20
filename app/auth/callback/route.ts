import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data?.user) {
      const user = data.user;
      const meta = user.user_metadata || {};
      const fullName =
        meta.full_name ||
        meta.name ||
        user.email?.split("@")[0] ||
        "Shop Owner";
      const avatarUrl = meta.avatar_url || meta.picture || "";

      // Sync Google profile into zibbi.profiles
      await (supabase
        .from("profiles") as any)
        .upsert({
          id: user.id,
          full_name: fullName,
          email: user.email || "",
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        });

      // Check if user has an existing shop
      const { data: members } = await supabase
        .from("shop_members")
        .select("shop_id")
        .eq("user_id", user.id);

      if (!members || members.length === 0) {
        return NextResponse.redirect(`${origin}/onboarding`);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
