"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SHOP_CATEGORIES } from "@/lib/validations/auth";
import { ProductFormAttributes } from "./product-form-attributes";
import { createProductAction } from "@/lib/actions/product-actions";
import {
  PlusCircle,
  Loader2,
  PackagePlus,
  SlidersHorizontal,
  ChevronDown,
  Barcode,
} from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

interface AddProductDialogProps {
  shopId: string;
  defaultCategory?: string;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AddProductDialog({
  shopId,
  defaultCategory = "General Store",
  trigger,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: AddProductDialogProps) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = setControlledOpen || setInternalOpen;

  const [name, setName] = useState("");
  const [category, setCategory] = useState(defaultCategory);
  const [openingStock, setOpeningStock] = useState<number | string>(0);
  const [brand, setBrand] = useState("");
  const [sellingPrice, setSellingPrice] = useState<number | string>("");
  const [storageLocation, setStorageLocation] = useState("");
  const [minStockThreshold, setMinStockThreshold] = useState<number | string>(5);
  const [barcode, setBarcode] = useState("");
  const [attributes, setAttributes] = useState<Record<string, any>>({});

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const resetForm = () => {
    setName("");
    setOpeningStock(0);
    setBrand("");
    setSellingPrice("");
    setStorageLocation("");
    setMinStockThreshold(5);
    setBarcode("");
    setAttributes({});
    setErrors({});
    setShowAdvanced(false);
  };

  const extraFieldCount = [
    Boolean(brand.trim()),
    Boolean(barcode.trim()),
    minStockThreshold !== 5 && minStockThreshold !== "" && minStockThreshold !== "5",
    Object.keys(attributes).length > 0,
  ].filter(Boolean).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrors({ name: "Product name is required" });
      return;
    }

    setLoading(true);
    setErrors({});

    const res = await createProductAction({
      shopId,
      name: name.trim(),
      category,
      openingStock: Number(openingStock) || 0,
      brand: brand.trim() || undefined,
      barcode: barcode.trim() || undefined,
      sellingPrice: sellingPrice !== "" ? Number(sellingPrice) : null,
      minStockThreshold: minStockThreshold !== "" ? Number(minStockThreshold) : 5,
      storageLocation: storageLocation.trim() || undefined,
      attributes,
    });

    setLoading(false);

    if (res.success) {
      toast.success(`"${name}" added to inventory!`);
      resetForm();
      setIsOpen(false);
      router.refresh();
    } else {
      toast.error(res.error || "Failed to create product");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger ? (
        <DialogTrigger render={trigger as React.ReactElement} />
      ) : (
        <DialogTrigger render={<Button className="h-10 font-semibold gap-2 shadow-xs rounded-full" />}>
          <PlusCircle className="h-4 w-4" />
          <span>Add Product</span>
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-xl w-[calc(100vw-2rem)] p-0 rounded-3xl border border-border bg-card shadow-2xl overflow-hidden max-h-[85vh] flex flex-col no-scrollbar">
        {/* Header (Pinned) */}
        <div className="p-5 sm:p-6 pb-4 border-b border-border/70 shrink-0 bg-card">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <PackagePlus className="h-5 w-5" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-primary">Inventory Entry</span>
              </div>
              <DialogTitle className="text-xl sm:text-2xl font-bold font-heading text-foreground">
                Add Product to Shop
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
                Enter the essential product info. Brand, barcode, and custom variants can be added if needed.
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Scrollable Form Body (hidden scrollbar, fully responsive) */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
          <div className="flex-1 overflow-y-auto no-scrollbar p-5 sm:p-6 space-y-4">
            {/* Product Name (Hero Field) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="prod-name" className="text-sm font-semibold text-foreground">
                  Product Name <span className="text-destructive">*</span>
                </Label>
                <span className="text-xs text-muted-foreground font-normal">Required</span>
              </div>
              <Input
                id="prod-name"
                placeholder="e.g. Lakme Matte Lipstick, Parle-G 250g, Maggi 70g"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
                }}
                disabled={loading}
                className={cn(
                  "h-12 rounded-2xl text-base px-4 bg-muted/20 border-border focus:bg-background transition-colors",
                  errors.name && "border-destructive focus-visible:ring-destructive"
                )}
                autoFocus
              />
              {errors.name && <p className="text-xs text-destructive font-medium">{errors.name}</p>}
            </div>

            {/* Category & Storage Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="prod-cat" className="text-sm font-semibold text-foreground">
                  Category <span className="text-destructive">*</span>
                </Label>
                <select
                  id="prod-cat"
                  className="flex h-11 w-full rounded-xl border border-border bg-muted/20 px-3.5 text-sm text-foreground shadow-2xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus:bg-background font-medium"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={loading}
                >
                  {SHOP_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat} className="bg-popover text-popover-foreground">
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="prod-location" className="text-sm font-medium text-foreground">
                  Storage Location <span className="text-xs text-muted-foreground font-normal">(Shelf / Box)</span>
                </Label>
                <Input
                  id="prod-location"
                  placeholder="e.g. Rack A-2, Drawer 5"
                  value={storageLocation}
                  onChange={(e) => setStorageLocation(e.target.value)}
                  disabled={loading}
                  className="h-11 rounded-xl text-sm px-3.5 bg-muted/20 border-border focus:bg-background transition-colors"
                />
              </div>
            </div>

            {/* Selling Price & Opening Stock */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="prod-price" className="text-sm font-medium text-foreground">
                  Selling Price (₹)
                </Label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                    ₹
                  </span>
                  <Input
                    id="prod-price"
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder="0.00"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    disabled={loading}
                    className="h-11 rounded-xl pl-8 text-sm font-semibold bg-muted/20 border-border focus:bg-background transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="prod-stock" className="text-sm font-semibold text-foreground">
                    Opening Stock <span className="text-destructive">*</span>
                  </Label>
                  <span className="text-xs text-muted-foreground font-normal">Units in hand</span>
                </div>
                <Input
                  id="prod-stock"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={openingStock}
                  onChange={(e) => setOpeningStock(e.target.value)}
                  disabled={loading}
                  className="h-11 rounded-xl text-sm font-semibold bg-muted/20 border-border focus:bg-background transition-colors"
                />
              </div>
            </div>

            {/* Collapsible More Options Section */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowAdvanced((prev) => !prev)}
                className="group flex w-full items-center justify-between rounded-2xl border border-dashed border-border bg-muted/15 px-4 py-3 text-left transition-all hover:border-primary/40 hover:bg-muted/30 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-background border border-border text-muted-foreground group-hover:text-primary transition-colors">
                    <SlidersHorizontal className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">
                        More Options (Brand, Barcode & Attributes)
                      </span>
                      {extraFieldCount > 0 && (
                        <span className="rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary">
                          {extraFieldCount} added
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Brand name, barcode, low stock threshold, and category variants.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-primary shrink-0 ml-2">
                  <span>{showAdvanced ? "Hide" : "Show"}</span>
                  <ChevronDown
                    className={cn("h-4 w-4 transition-transform duration-200", showAdvanced && "rotate-180")}
                  />
                </div>
              </button>

              {showAdvanced && (
                <div className="mt-3 space-y-4 rounded-2xl border border-border/80 bg-muted/10 p-4 sm:p-5 transition-all animate-in fade-in duration-200">
                  {/* Brand & Barcode */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1.5">
                      <Label htmlFor="prod-brand" className="text-sm font-medium text-foreground">
                        Brand / Manufacturer
                      </Label>
                      <Input
                        id="prod-brand"
                        placeholder="e.g. Lakme, Britannia, Havells"
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        disabled={loading}
                        className="h-11 rounded-xl text-sm bg-background border-border"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="prod-barcode" className="text-sm font-medium text-foreground flex items-center gap-1.5">
                        <Barcode className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>Barcode / Item Code</span>
                      </Label>
                      <Input
                        id="prod-barcode"
                        placeholder="e.g. 8901030384729"
                        value={barcode}
                        onChange={(e) => setBarcode(e.target.value)}
                        disabled={loading}
                        className="h-11 rounded-xl text-sm bg-background border-border"
                      />
                    </div>
                  </div>

                  {/* Low stock threshold */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="prod-threshold" className="text-sm font-medium text-foreground">
                        Low Stock Alert Threshold
                      </Label>
                      <span className="text-xs text-muted-foreground">Default: 5 units</span>
                    </div>
                    <Input
                      id="prod-threshold"
                      type="number"
                      min="0"
                      step="1"
                      placeholder="5"
                      value={minStockThreshold}
                      onChange={(e) => setMinStockThreshold(e.target.value)}
                      disabled={loading}
                      className="h-11 rounded-xl text-sm bg-background border-border max-w-xs"
                    />
                    <p className="text-xs text-muted-foreground">
                      The app will alert you to restock when inventory drops to or below this count.
                    </p>
                  </div>

                  {/* Category Attributes & Custom tags */}
                  <ProductFormAttributes
                    category={category}
                    attributes={attributes}
                    onChange={setAttributes}
                    disabled={loading}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Sticky Bottom Footer (Pinned) */}
          <div className="flex items-center justify-end gap-3 p-4 px-6 border-t border-border/70 bg-muted/15 shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={loading}
              className="h-11 px-5 rounded-full text-sm font-semibold border-border hover:bg-muted cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="h-11 px-7 rounded-full text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <PlusCircle className="h-4 w-4" />
                  <span>Save Product</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
