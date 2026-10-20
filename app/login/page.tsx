import { Suspense } from "react";
import Link from "next/link";
import { Store, ShieldCheck } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-background">
      <div className="w-full max-w-md space-y-6">
        {/* Brand header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Store className="h-5 w-5" />
            </div>
            <span className="font-heading text-2xl font-bold tracking-tight text-foreground">
              Zibbi
            </span>
          </Link>
          <p className="text-xs text-muted-foreground">
            Retail Operations Assistant for Local Shopkeepers
          </p>
        </div>

        {/* Login Card */}
        <Card className="border-border shadow-lg">
          <CardHeader className="space-y-1 text-center pb-4">
            <CardTitle className="text-xl font-bold">Sign In to Your Shop</CardTitle>
            <CardDescription className="text-xs">
              Enter your credentials to manage stock, search inventory, and review slips.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <GoogleAuthButton label="Sign in with Google" />

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Or with email
                </span>
              </div>
            </div>

            <Suspense fallback={<div className="h-32 rounded-lg bg-muted/40 animate-pulse" />}>
              <LoginForm />
            </Suspense>

            <div className="pt-2 text-center text-xs text-muted-foreground border-t border-border">
              Don&apos;t have a shop account yet?{" "}
              <Link
                href="/signup"
                className="font-semibold text-primary underline underline-offset-4 hover:opacity-90"
              >
                Register your shop
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Trust badge */}
        <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" />
          <span>RLS Isolated Data • Strict Shop Security</span>
        </div>
      </div>
    </div>
  );
}
