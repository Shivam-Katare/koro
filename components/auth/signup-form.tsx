"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/lib/store/use-auth-store";
import { signUpSchema, SHOP_CATEGORIES, type SignUpInput } from "@/lib/validations/auth";
import { Loader2 } from "lucide-react";

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
      <div className="rounded-xl border border-border bg-muted/30 p-6 text-center space-y-3">
        <h3 className="font-heading text-lg font-bold text-foreground">
          Check Your Inbox
        </h3>
        <p className="text-sm text-muted-foreground">
          We sent a confirmation link to <span className="font-semibold text-foreground">{formData.email}</span>. Click the link to complete your shop setup and enter your dashboard.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="signup-name">Owner Full Name</Label>
          <Input
            id="signup-name"
            placeholder="e.g. Ramesh Kumar"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            disabled={submitting}
          />
          {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
        </div>

        <div className="space-y-1">
          <Label htmlFor="signup-email">Email Address</Label>
          <Input
            id="signup-email"
            type="email"
            placeholder="ramesh@example.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            disabled={submitting}
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="signup-password">Password</Label>
        <Input
          id="signup-password"
          type="password"
          placeholder="At least 6 characters"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          disabled={submitting}
        />
        {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="signup-shop">
            Shop Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="signup-shop"
            placeholder="e.g. Anand General Store"
            value={formData.shopName}
            onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
            disabled={submitting}
          />
          {errors.shopName && <p className="text-xs text-destructive">{errors.shopName}</p>}
        </div>

        <div className="space-y-1">
          <Label htmlFor="signup-category">
            Shop Category <span className="text-destructive">*</span>
          </Label>
          <select
            id="signup-category"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground"
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
          {errors.category && <p className="text-xs text-destructive">{errors.category}</p>}
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="signup-whatsapp">
          WhatsApp / Phone Number <span className="text-muted-foreground text-xs font-normal">(Optional)</span>
        </Label>
        <Input
          id="signup-whatsapp"
          placeholder="e.g. 9876543210 (leave blank if none)"
          value={formData.whatsappNumber}
          onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
          disabled={submitting}
        />
        {errors.whatsappNumber && (
          <p className="text-xs text-destructive">{errors.whatsappNumber}</p>
        )}
      </div>

      <Button type="submit" className="w-full h-11 font-semibold" disabled={submitting}>
        {submitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            <span>Creating Shop &amp; Account...</span>
          </>
        ) : (
          "Create Shop & Enter Dashboard"
        )}
      </Button>
    </form>
  );
}
