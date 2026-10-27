import { Suspense } from "react";
import Link from "next/link";
import { ShieldCheck, Sparkles, ArrowRight } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { KoroWordmark } from "@/components/brand/koro-wordmark";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-8 sm:py-12 bg-background relative overflow-hidden">
      {/* Ambient decorative glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[500px] rounded-full bg-primary/10 blur-3xl opacity-50"
      />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand header - No logo, multi-colored Koro only */}
        <div className="flex flex-col items-center text-center space-y-2">
          <Link href="/" className="inline-flex transition-transform hover:scale-105">
            <KoroWordmark size="xl" />
          </Link>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-xs">
            Sign in to manage stock, sales slips, and store operations
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-2xl space-y-5">
          <div className="space-y-1 text-center pb-1">
            <h1 className="text-2xl sm:text-3xl font-bold font-heading text-foreground">
              Sign In to Your Shop
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Enter your credentials to access your Koro dashboard.
            </p>
          </div>

          {/* Instant Demo Shop Pill */}
          <Link
            href="/dashboard"
            className="group flex items-center justify-between gap-3 rounded-2xl border border-primary/30 bg-primary/10 p-3.5 transition-all hover:bg-primary/15 hover:border-primary/50 shadow-xs"
          >
            <div className="flex items-center gap-2.5">
              <Sparkles className="h-4 w-4 text-primary shrink-0 animate-pulse" />
              <div className="text-left">
                <p className="text-xs font-bold text-foreground">
                  Testing for Hackathon?
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Slide into Pooja Demo Store without signing in
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-primary group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
              Open Demo →
            </span>
          </Link>

          <GoogleAuthButton label="Sign in with Google" />

          <div className="relative py-1">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/70" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-wider font-semibold">
              <span className="bg-card px-3 text-muted-foreground">
                Or with email
              </span>
            </div>
          </div>

          <Suspense fallback={<div className="h-32 rounded-2xl bg-muted/30 animate-pulse" />}>
            <LoginForm />
          </Suspense>

          <div className="pt-3 text-center text-sm text-muted-foreground border-t border-border/70">
            Don&apos;t have a shop account yet?{" "}
            <Link
              href="/signup"
              className="font-semibold text-primary underline underline-offset-4 hover:opacity-90 ml-1"
            >
              Register your shop
            </Link>
          </div>
        </div>

        {/* Trust badge */}
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-border/70 bg-muted/20 px-4 py-2.5 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
          <span>RLS Isolated Data • Strict Shop Security</span>
        </div>
      </div>
    </div>
  );
}
