import Link from "next/link";
import { Store, ShieldCheck } from "lucide-react";
import { SignUpForm } from "@/components/auth/signup-form";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-background">
      <div className="w-full max-w-lg space-y-6">
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
            Register your store for voice lookup, slip extraction, and restock reports
          </p>
        </div>

        {/* Signup Card */}
        <Card className="border-border shadow-lg">
          <CardHeader className="space-y-1 text-center pb-4">
            <CardTitle className="text-xl font-bold">Register Your Shop</CardTitle>
            <CardDescription className="text-xs">
              Create an owner account and set up your shop profile in seconds.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <GoogleAuthButton label="Sign up with Google" />

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Or register with details
                </span>
              </div>
            </div>

            <SignUpForm />

            <div className="pt-2 text-center text-xs text-muted-foreground border-t border-border">
              Already have a shop account?{" "}
              <Link
                href="/login"
                className="font-semibold text-primary underline underline-offset-4 hover:opacity-90"
              >
                Sign in to your shop
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Security guarantee */}
        <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" />
          <span>Cross-shop RLS isolation • Private business data</span>
        </div>
      </div>
    </div>
  );
}
