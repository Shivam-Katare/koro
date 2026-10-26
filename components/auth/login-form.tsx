"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/lib/store/use-auth-store";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { Loader2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";

  const [formData, setFormData] = useState<LoginInput>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof LoginInput, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  const signInWithEmail = useAuthStore((s) => s.signInWithEmail);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = loginSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof LoginInput, string>> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof LoginInput;
        fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    const { success, hasShop } = await signInWithEmail(result.data);
    setSubmitting(false);

    if (success) {
      if (hasShop === false) {
        router.push("/onboarding");
      } else {
        router.push(next);
      }
      router.refresh();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="login-email" className="text-sm font-semibold text-foreground">
          Email Address
        </Label>
        <Input
          id="login-email"
          type="email"
          placeholder="shopkeeper@example.com"
          autoComplete="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          disabled={submitting}
          className={cn(
            "h-12 rounded-2xl text-sm sm:text-base px-4 bg-muted/20 border-border focus:bg-background transition-colors",
            errors.email && "border-destructive focus-visible:ring-destructive"
          )}
        />
        {errors.email && (
          <p className="text-xs text-destructive font-medium">{errors.email}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="login-password" className="text-sm font-semibold text-foreground">
            Password
          </Label>
        </div>
        <Input
          id="login-password"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          value={formData.password}
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
          disabled={submitting}
          className={cn(
            "h-12 rounded-2xl text-sm sm:text-base px-4 bg-muted/20 border-border focus:bg-background transition-colors",
            errors.password && "border-destructive focus-visible:ring-destructive"
          )}
        />
        {errors.password && (
          <p className="text-xs text-destructive font-medium">{errors.password}</p>
        )}
      </div>

      <div className="pt-2">
        <Button
          type="submit"
          className="w-full h-12 rounded-full font-bold text-base bg-primary text-primary-foreground hover:bg-primary/90 shadow-md gap-2 cursor-pointer transition-all"
          disabled={submitting}
        >
          {submitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Signing In...</span>
            </>
          ) : (
            <>
              <span>Sign In to Shop</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
