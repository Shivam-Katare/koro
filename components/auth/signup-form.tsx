"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/lib/store/use-auth-store";
import { signUpSchema, SHOP_CATEGORIES, type SignUpInput } from "@/lib/validations/auth";
import { Loader2, ArrowRight, MailCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function SignUpForm() {
  const router = useRouter();
  const [formData, setFormData] = useState<SignUpInput>({
    fullName: "",
    email: "",
    password: "",
    shopName: "",
    category: SHOP_CATEGORIES[0],
    whatsappNumber: "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof SignUpInput, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);

  const signUpWithOwner = useAuthStore((s) => s.signUpWithOwner);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = signUpSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof SignUpInput, string>> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof SignUpInput;
        fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    const res = await signUpWithOwner(result.data);
    setSubmitting(false);

    if (res.success) {
      if (res.needsConfirmation) {
        setNeedsVerification(true);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    }
  };

  if (needsVerification) {
    return (
      <div className="rounded-3xl border border-border bg-muted/30 p-6 sm:p-8 text-center space-y-4">
        <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mx-auto">
          <MailCheck className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h3 className="font-heading text-xl font-bold text-foreground">
            Check Your Inbox
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We sent a verification link to <span className="font-semibold text-foreground">{formData.email}</span>. Click the link in your email to complete shop registration and enter your Koro dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name and Email */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="space-y-1.5">
          <Label htmlFor="signup-name" className="text-sm font-semibold text-foreground">
            Owner Full Name
          </Label>
          <Input
            id="signup-name"
            placeholder="e.g. Ramesh Kumar"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            disabled={submitting}
            className={cn(
              "h-12 rounded-2xl text-sm sm:text-base px-4 bg-muted/20 border-border focus:bg-background transition-colors",
              errors.fullName && "border-destructive focus-visible:ring-destructive"
            )}
          />
          {errors.fullName && <p className="text-xs text-destructive font-medium">{errors.fullName}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="signup-email" className="text-sm font-semibold text-foreground">
            Email Address
          </Label>
          <Input
            id="signup-email"
            type="email"
            placeholder="ramesh@example.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            disabled={submitting}
            className={cn(
              "h-12 rounded-2xl text-sm sm:text-base px-4 bg-muted/20 border-border focus:bg-background transition-colors",
              errors.email && "border-destructive focus-visible:ring-destructive"
            )}
          />
          {errors.email && <p className="text-xs text-destructive font-medium">{errors.email}</p>}
        </div>
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="signup-password" className="text-sm font-semibold text-foreground">
            Password
          </Label>
          <span className="text-xs text-muted-foreground">At least 6 characters</span>
        </div>
        <Input
          id="signup-password"
          type="password"
          placeholder="••••••••"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          disabled={submitting}
          className={cn(
            "h-12 rounded-2xl text-sm sm:text-base px-4 bg-muted/20 border-border focus:bg-background transition-colors",
            errors.password && "border-destructive focus-visible:ring-destructive"
          )}
        />
        {errors.password && <p className="text-xs text-destructive font-medium">{errors.password}</p>}
      </div>

      {/* Shop Name and Category */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="space-y-1.5">
          <Label htmlFor="signup-shop" className="text-sm font-semibold text-foreground">
            Shop Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="signup-shop"
            placeholder="e.g. Anand General Store"
            value={formData.shopName}
            onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
            disabled={submitting}
            className={cn(
              "h-12 rounded-2xl text-sm sm:text-base px-4 bg-muted/20 border-border focus:bg-background transition-colors",
              errors.shopName && "border-destructive focus-visible:ring-destructive"
            )}
          />
          {errors.shopName && <p className="text-xs text-destructive font-medium">{errors.shopName}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="signup-category" className="text-sm font-semibold text-foreground">
            Shop Category <span className="text-destructive">*</span>
          </Label>
          <select
            id="signup-category"
            className="flex h-12 w-full rounded-2xl border border-border bg-muted/20 px-4 text-sm font-medium text-foreground shadow-2xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus:bg-background"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            disabled={submitting}
          >
            {SHOP_CATEGORIES.map((cat) => (
              <option key={cat} value={cat} className="bg-popover text-popover-foreground">
                {cat}
              </option>
            ))}
          </select>
          {errors.category && <p className="text-xs text-destructive font-medium">{errors.category}</p>}
        </div>
      </div>

      {/* WhatsApp / Phone Number */}
      <div className="space-y-1.5">
        <Label htmlFor="signup-whatsapp" className="text-sm font-medium text-foreground">
          WhatsApp / Phone Number <span className="text-muted-foreground text-xs font-normal">(Optional for restock slips)</span>
        </Label>
        <Input
          id="signup-whatsapp"
          placeholder="e.g. 9876543210 (leave blank if none)"
          value={formData.whatsappNumber}
          onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
          disabled={submitting}
          className="h-12 rounded-2xl text-sm sm:text-base px-4 bg-muted/20 border-border focus:bg-background transition-colors"
        />
        {errors.whatsappNumber && (
          <p className="text-xs text-destructive font-medium">{errors.whatsappNumber}</p>
        )}
      </div>

      {/* Submit Button */}
      <div className="pt-2">
        <Button
          type="submit"
          className="w-full h-12 rounded-full font-bold text-base bg-primary text-primary-foreground hover:bg-primary/90 shadow-md gap-2 cursor-pointer transition-all"
          disabled={submitting}
        >
          {submitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Creating Shop &amp; Account...</span>
            </>
          ) : (
            <>
              <span>Create Shop &amp; Enter Dashboard</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
