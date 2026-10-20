"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/lib/store/use-auth-store";
import { onboardingSchema, SHOP_CATEGORIES, type OnboardingInput } from "@/lib/validations/auth";
import { createShopAction } from "@/app/onboarding/actions";
import { Loader2, Store } from "lucide-react";
import toast from "react-hot-toast";

interface OnboardingFormProps {
  initialFullName?: string;
  initialEmail?: string;
}

export function OnboardingForm({ initialFullName, initialEmail }: OnboardingFormProps) {
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const user = useAuthStore((s) => s.user);
  const createShopWithOwner = useAuthStore((s) => s.createShopWithOwner);
  const refreshUserData = useAuthStore((s) => s.refreshUserData);

  const [formData, setFormData] = useState<OnboardingInput>({
    fullName: initialFullName || "",
    shopName: "",
    category: SHOP_CATEGORIES[0],
    whatsappNumber: "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof OnboardingInput, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const defaultName =
      initialFullName ||
      profile?.full_name ||
      user?.user_metadata?.full_name ||
      user?.user_metadata?.name ||
      user?.email?.split("@")[0] ||
      initialEmail?.split("@")[0] ||
      "";
    if (defaultName && !formData.fullName) {
      setFormData((prev) => ({ ...prev, fullName: defaultName }));
    }
  }, [profile, user, initialFullName, initialEmail, formData.fullName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = onboardingSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof OnboardingInput, string>> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof OnboardingInput;
        fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    try {
      // 1. Try Server Action first (reads server cookies directly)
      const serverRes = await createShopAction(result.data);
      if (serverRes.success) {
        toast.success("Shop registered successfully!");
        await refreshUserData().catch(() => {});
        router.push("/dashboard");
        router.refresh();
        return;
      }

      // 2. Fallback to client RPC if server action reported auth issue
      const clientRes = await createShopWithOwner(result.data);
      if (clientRes.success) {
        router.push("/dashboard");
        router.refresh();
        return;
      }

      if (serverRes.error) {
        toast.error(serverRes.error);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create shop";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="onboard-owner">Owner Full Name</Label>
        <Input
          id="onboard-owner"
          placeholder="e.g. Ramesh Kumar"
          value={formData.fullName}
          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
          disabled={submitting}
        />
        {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label htmlFor="onboard-shop" className="font-semibold text-foreground">
            Shop Name <span className="text-destructive">*</span>
          </Label>
          <span className="text-[11px] text-muted-foreground">Required</span>
        </div>
        <Input
          id="onboard-shop"
          placeholder="e.g. Anand General Store"
          value={formData.shopName}
          onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
          disabled={submitting}
        />
        {errors.shopName && <p className="text-xs text-destructive">{errors.shopName}</p>}
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label htmlFor="onboard-category" className="font-semibold text-foreground">
            Shop Category <span className="text-destructive">*</span>
          </Label>
          <span className="text-[11px] text-muted-foreground">Required</span>
        </div>
        <select
          id="onboard-category"
          className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground"
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

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label htmlFor="onboard-phone">
            WhatsApp / Phone Number <span className="text-muted-foreground text-xs font-normal">(Optional)</span>
          </Label>
          <span className="text-[11px] text-muted-foreground">For restock reports</span>
        </div>
        <Input
          id="onboard-phone"
          placeholder="e.g. 9876543210 (leave blank if none)"
          value={formData.whatsappNumber}
          onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
          disabled={submitting}
        />
        {errors.whatsappNumber && (
          <p className="text-xs text-destructive">{errors.whatsappNumber}</p>
        )}
      </div>

      <Button type="submit" className="w-full h-11 font-semibold gap-2 mt-2" disabled={submitting}>
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Setting Up Shop...</span>
          </>
        ) : (
          <>
            <Store className="h-4 w-4" />
            <span>Complete Setup &amp; Open Dashboard</span>
          </>
        )}
      </Button>
    </form>
  );
}
