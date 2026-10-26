import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { SignUpForm } from "@/components/auth/signup-form";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { KoroWordmark } from "@/components/brand/koro-wordmark";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-8 sm:py-12 bg-background relative overflow-hidden">
      {/* Ambient decorative glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[500px] rounded-full bg-primary/10 blur-3xl opacity-50"
      />

      <div className="w-full max-w-xl space-y-6 relative z-10">
        {/* Brand header - No logo, multi-colored Koro only */}
        <div className="flex flex-col items-center text-center space-y-2">
          <Link href="/" className="inline-flex transition-transform hover:scale-105">
            <KoroWordmark size="xl" />
          </Link>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-sm">
            Smart Voice, Sales &amp; Restock Assistant for Retail Stores
          </p>
        </div>

        {/* Signup Card */}
        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-2xl space-y-5">
          <div className="space-y-1 text-center pb-1">
            <h1 className="text-2xl sm:text-3xl font-bold font-heading text-foreground">
              Register Your Shop
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Create an owner account and set up your shop profile in seconds.
            </p>
          </div>

          <GoogleAuthButton label="Sign up with Google" />

          <div className="relative py-1">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/70" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-wider font-semibold">
              <span className="bg-card px-3 text-muted-foreground">
                Or register with details
              </span>
            </div>
          </div>

          <SignUpForm />

          <div className="pt-3 text-center text-sm text-muted-foreground border-t border-border/70">
            Already have a shop account?{" "}
            <Link
              href="/login"
              className="font-semibold text-primary underline underline-offset-4 hover:opacity-90 ml-1"
            >
              Sign in to your shop
            </Link>
          </div>
        </div>

        {/* Security guarantee */}
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-border/70 bg-muted/20 px-4 py-2.5 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
          <span>Cross-shop RLS isolation • Private business data</span>
        </div>
      </div>
    </div>
  );
}
