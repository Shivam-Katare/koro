"use client";

import React, { useState, useEffect } from "react";
import { SHOP_CATEGORIES } from "@/lib/validations/auth";
import { updateShopSettingsAction } from "@/lib/actions/shop-actions";
import { useDashboardNav } from "@/lib/hooks/use-dashboard-nav";
import type { Shop, Profile } from "@/lib/supabase/types";
import { KoroGlyph } from "@/components/brand/koro-face";
import { Facehash } from "facehash";
import {
  Store,
  Tag,
  FileText,
  Phone,
  Save,
  Loader2,
  CheckCircle2,
  Copy,
  Check,
  Sparkles,
  ShieldCheck,
  Pencil,
  X,
  User,
  LogOut,
} from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

interface SettingsViewProps {
  shop: Shop | null;
  profile: Profile | null;
  productsCount?: number;
  salesCount?: number;
  onShopUpdated?: (updatedShop: Shop) => void;
}

const BRAND_COLORS = ["#ffb110", "#62aef0", "#0075de", "#4cc38a", "#f64932", "#ff9db1"];

export function SettingsView({
  shop,
  profile,
  productsCount = 0,
  salesCount = 0,
  onShopUpdated,
}: SettingsViewProps) {
  const { handleSignOut } = useDashboardNav();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(shop?.name || "");
  const [category, setCategory] = useState(shop?.category || SHOP_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState("");
  const [description, setDescription] = useState(shop?.description || "");
  const [whatsappNumber, setWhatsappNumber] = useState(shop?.whatsapp_number || "");
  const [isSaving, setIsSaving] = useState(false);
  const [hasCopiedId, setHasCopiedId] = useState(false);

  // Sync if shop prop changes
  useEffect(() => {
    if (shop) {
      setName(shop.name || "");
      const isPredefined = (SHOP_CATEGORIES as readonly string[]).includes(shop.category);
      if (isPredefined) {
        setCategory(shop.category);
        setCustomCategory("");
      } else {
        setCategory("Other Retail");
        setCustomCategory(shop.category || "");
      }
      setDescription(shop.description || "");
      setWhatsappNumber(shop.whatsapp_number || "");
    }
  }, [shop]);

  const activeCategory =
    category === "Other Retail" && customCategory.trim()
      ? customCategory.trim()
      : category;

  const handleCopyShopId = async () => {
    if (!shop?.id) return;
    try {
      await navigator.clipboard.writeText(shop.id);
      setHasCopiedId(true);
      toast.success("Shop ID copied to clipboard");
      setTimeout(() => setHasCopiedId(false), 2000);
    } catch {
      toast.error("Failed to copy Shop ID");
    }
  };

  const handleCancelEdit = () => {
    if (shop) {
      setName(shop.name || "");
      const isPredefined = (SHOP_CATEGORIES as readonly string[]).includes(shop.category);
      if (isPredefined) {
        setCategory(shop.category);
        setCustomCategory("");
      } else {
        setCategory("Other Retail");
        setCustomCategory(shop.category || "");
      }
      setDescription(shop.description || "");
      setWhatsappNumber(shop.whatsapp_number || "");
    }
    setIsEditing(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop?.id) return;

    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length < 2) {
      toast.error("Store name must be at least 2 characters long.");
      return;
    }

    const finalCategory = activeCategory.trim();
    if (!finalCategory) {
      toast.error("Please specify a store category.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await updateShopSettingsAction({
        shopId: shop.id,
        name: trimmedName,
        category: finalCategory,
        description: description.trim() || null,
        whatsappNumber: whatsappNumber.trim() || null,
      });

      if (!res.success || !res.shop) {
        toast.error(res.error || "Failed to update store settings.");
        return;
      }

      toast.success("Shop details saved successfully!");
      setIsEditing(false);
      if (onShopUpdated) {
        onShopUpdated(res.shop);
      }
    } catch (err: unknown) {
      console.error("Save error:", err);
      toast.error("An unexpected error occurred while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  const createdDate = shop?.created_at
    ? new Date(shop.created_at).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Recently";

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="space-y-1.5">
          <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Shop Settings
          </h1>
          <p className="text-base text-muted-foreground sm:text-lg">
            Manage your store profile, retail category, and account details.
          </p>
        </div>

        {/* Top Actions: Edit / Cancel / Save */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {!isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full bg-primary px-5 text-base font-semibold text-primary-foreground transition-opacity hover:opacity-90 shadow-sm"
            >
              <Pencil className="h-4 w-4" />
              <span>Edit Store Details</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={isSaving}
                className="inline-flex h-11 cursor-pointer items-center gap-1.5 rounded-full border border-border bg-card px-4 text-base font-semibold text-foreground transition-colors hover:bg-muted"
              >
                <X className="h-4 w-4" />
                <span>Cancel</span>
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSaving}
                className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full bg-primary px-6 text-base font-bold text-primary-foreground transition-opacity hover:opacity-90 shadow-md disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content: Left Details / Form & Right Diagnostics / Account */}
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        {/* Left Column: View Mode OR Edit Form */}
        <div className="lg:col-span-7 xl:col-span-7 space-y-6">
          {!isEditing ? (
            /* VIEW MODE: Clean, readable profile display */
            <div className="space-y-6">
              {/* Store Profile Card */}
              <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 space-y-6 shadow-xs">
                {/* Store Header Row with Facehash */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                  <Facehash
                    name={shop?.name || "Koro"}
                    size={80}
                    colors={BRAND_COLORS}
                    className="rounded-full overflow-hidden shrink-0 shadow-xs ring-4 ring-border/40"
                  />

                  <div className="min-w-0 space-y-2">
                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Store / Business Name
                      </span>
                      <h2 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground truncate">
                        {shop?.name || "Your Shop Name"}
                      </h2>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3.5 py-1 text-sm font-semibold">
                        <Tag className="h-3.5 w-3.5" />
                        <span>{shop?.category || "General Store"}</span>
                      </span>

                      <span className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-mono font-medium text-muted-foreground">
                        INR (₹)
                      </span>

                      <span className="inline-flex items-center gap-1 rounded-full bg-[#e8f7ee] dark:bg-[#1c2b22] px-3 py-1 text-xs font-semibold text-[#0f7a39] dark:text-[#5fd68c]">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        <span>RLS Tenant Active</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-border/60" />

                {/* About My Shop Section */}
                <div className="space-y-2">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <span>Store Story &amp; Details</span>
                  </h3>
                  {shop?.description ? (
                    <p className="text-base text-foreground leading-relaxed">
                      {shop.description}
                    </p>
                  ) : (
                    <p className="text-base text-muted-foreground italic">
                      No store story added yet. Click &ldquo;Edit Store Details&rdquo; to add your specialties, landmark, and store hours so Koro AI can tell customers about your shop.
                    </p>
                  )}
                </div>

                <div className="border-t border-border/60" />

                {/* Contact and Tenant ID Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-primary" />
                      <span>WhatsApp Number</span>
                    </span>
                    <p className="text-base font-semibold text-foreground">
                      {shop?.whatsapp_number ? `+91 ${shop.whatsapp_number}` : "Not configured"}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                      <Store className="h-3.5 w-3.5 text-primary" />
                      <span>Store ID</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyShopId}
                      className="inline-flex items-center gap-2 text-sm font-mono text-muted-foreground hover:text-foreground transition-colors cursor-pointer group"
                      title="Click to copy Shop ID"
                    >
                      <span className="truncate max-w-[160px]">{shop?.id || "N/A"}</span>
                      {hasCopiedId ? (
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5 group-hover:text-primary transition-colors" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* EDIT MODE: Large, comfortable inputs with clear labels */
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="rounded-3xl border border-primary/40 bg-card p-6 sm:p-8 space-y-6 shadow-xs animate-in fade-in-50 duration-200">
                <div className="flex items-center gap-4">
                  <Facehash
                    name={name.trim() || shop?.name || "Koro"}
                    size={64}
                    colors={BRAND_COLORS}
                    className="rounded-full overflow-hidden shrink-0 ring-4 ring-border/40"
                  />
                  <div>
                    <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground">
                      Edit Store Details
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Update your business name, retail category, and story below.
                    </p>
                  </div>
                </div>

                {/* Shop / Business Name */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="shopName" className="text-sm font-semibold text-foreground">
                      Shop / Business Name <span className="text-destructive">*</span>
                    </label>
                    <span className="text-xs text-muted-foreground">{name.length}/120</span>
                  </div>
                  <input
                    id="shopName"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Pooja Beauty Collection, Ramesh Kirana Store"
                    maxLength={120}
                    required
                    className="h-12 w-full rounded-2xl border border-input bg-card px-4 text-base font-medium text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                  <p className="text-xs text-muted-foreground">
                    Appears on counter receipts, WhatsApp slips, and is used by Koro in voice answers.
                  </p>
                </div>

                {/* Business Retail Category */}
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <span>Business Retail Category</span>
                    <span className="text-destructive">*</span>
                  </label>

                  <div className="flex flex-wrap gap-2">
                    {SHOP_CATEGORIES.map((cat) => {
                      const isSelected = category === cat;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setCategory(cat)}
                          className={cn(
                            "cursor-pointer rounded-full px-4 py-2 text-sm font-semibold transition-all",
                            isSelected
                              ? "bg-primary text-primary-foreground shadow-xs"
                              : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                          )}
                        >
                          {cat}
                        </button>
                      );
                    })}
                  </div>

                  {category === "Other Retail" && (
                    <div className="pt-1 space-y-1">
                      <label htmlFor="customCat" className="text-xs font-semibold text-muted-foreground">
                        Specific Category Name
                      </label>
                      <input
                        id="customCat"
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        placeholder="e.g. Hardware & Paints, Pet Mart..."
                        className="h-11 w-full rounded-2xl border border-input bg-card px-4 text-sm font-medium text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  )}
                </div>

                {/* About My Shop / Description */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="shopDescription" className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span>About My Shop (Store Story &amp; Details)</span>
                    </label>
                    <span className="text-xs text-muted-foreground">{description.length}/1000</span>
                  </div>
                  <textarea
                    id="shopDescription"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Tell customers and Koro about your shop, specialties, local landmark, store timings, or credit policy (e.g. 'We specialize in Lakme & Nivea cosmetics, daily Kirana, and bangles. Located near clock tower market. Open 9 AM - 9 PM daily.')."
                    rows={4}
                    maxLength={1000}
                    className="w-full rounded-2xl border border-input bg-card p-4 text-base leading-relaxed text-foreground outline-none resize-y placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    <span>Koro AI uses this context to give personalized answers when asked about your shop.</span>
                  </p>
                </div>

                {/* Store Contact / WhatsApp Number */}
                <div className="space-y-2">
                  <label htmlFor="shopWhatsapp" className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>Store WhatsApp Number (Optional)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
                      +91
                    </span>
                    <input
                      id="shopWhatsapp"
                      type="tel"
                      value={whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value)}
                      placeholder="9876543210"
                      className="h-12 w-full rounded-2xl border border-input bg-card pl-12 pr-4 text-base font-medium text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Used for sending automated restock orders via WhatsApp and sharing counter customer receipts.
                  </p>
                </div>

                {/* Footer Save / Cancel Controls */}
                <div className="pt-4 border-t border-border flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                    className="inline-flex h-11 cursor-pointer items-center gap-1.5 rounded-full border border-border px-5 text-base font-semibold text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full bg-primary px-7 text-base font-bold text-primary-foreground transition-opacity hover:opacity-90 shadow-md disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Right Column: Account / Owner Profile & Diagnostics */}
        <div className="lg:col-span-5 xl:col-span-5 space-y-6 lg:sticky lg:top-24">
          {/* Owner & Account Profile Card with Sign Out */}
          <div className="rounded-3xl border border-border bg-card p-6 space-y-5 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="font-heading text-lg font-bold text-foreground flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  <span>Account &amp; Owner</span>
                </h3>
                <p className="text-xs text-muted-foreground">
                  Registered user managing this store
                </p>
              </div>
              <span className="rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold">
                Shop Owner
              </span>
            </div>

            {/* User Profile Information */}
            <div className="flex items-center gap-4 rounded-2xl bg-muted/40 p-4 border border-border/50">
              <Facehash
                name={profile?.full_name || profile?.email || "Owner"}
                size={52}
                colors={["#0075de", "#4cc38a", "#ffb110", "#f64932", "#62aef0"]}
                className="rounded-full overflow-hidden shrink-0 ring-2 ring-border/50"
              />
              <div className="min-w-0 flex-1 space-y-1">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Registered Name
                  </span>
                  <p className="truncate text-base font-bold text-foreground">
                    {profile?.full_name || "Store Owner"}
                  </p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Login Account
                  </span>
                  <p className="truncate text-xs text-muted-foreground font-medium">
                    {profile?.email || "No email available"}
                  </p>
                </div>
              </div>
            </div>

            {/* Sign Out Button */}
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full border border-destructive/30 bg-destructive/5 px-5 text-sm font-semibold text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground shadow-2xs"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out of Account</span>
            </button>
          </div>

          {/* System Diagnostics KPI Card */}
          <div className="rounded-3xl border border-border bg-card p-6 space-y-4 shadow-xs">
            <h3 className="font-heading text-lg font-bold text-foreground flex items-center gap-2">
              <Store className="h-5 w-5 text-primary" />
              <span>Shop Overview</span>
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-border/50 text-sm">
                <span className="text-muted-foreground flex items-center gap-2">
                  <KoroGlyph type="calendar" size={24} />
                  <span>Store Registered</span>
                </span>
                <span className="font-semibold text-foreground">{createdDate}</span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-border/50 text-sm">
                <span className="text-muted-foreground flex items-center gap-2">
                  <KoroGlyph type="package" size={24} />
                  <span>Catalog Products</span>
                </span>
                <span className="font-heading font-bold text-foreground">{productsCount} products</span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-border/50 text-sm">
                <span className="text-muted-foreground flex items-center gap-2">
                  <KoroGlyph type="check-circle" size={24} />
                  <span>Sales Slips Recorded</span>
                </span>
                <span className="font-heading font-bold text-foreground">{salesCount} slips</span>
              </div>

              <div className="flex items-center justify-between py-2 text-sm">
                <span className="text-muted-foreground flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-500" />
                  <span>Tenant Database</span>
                </span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                  RLS Isolated
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
