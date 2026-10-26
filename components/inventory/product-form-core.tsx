"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SHOP_CATEGORIES } from "@/lib/validations/auth";
import { cn } from "@/lib/utils";

interface ProductFormCoreProps {
  name: string;
  category: string;
  openingStock: number | string;
  brand: string;
  onChange: (fields: Partial<{ name: string; category: string; openingStock: number | string; brand: string }>) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
}

export function ProductFormCore({
  name,
  category,
  openingStock,
  brand,
  onChange,
  errors,
  disabled,
}: ProductFormCoreProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="prod-name" className="text-sm font-semibold text-foreground">
            Product Name <span className="text-destructive">*</span>
          </Label>
          <span className="text-xs text-muted-foreground font-normal">Required</span>
        </div>
        <Input
          id="prod-name"
          placeholder="e.g. Lakme Matte Lipstick, Parle-G 250g"
          value={name}
          onChange={(e) => onChange({ name: e.target.value })}
          disabled={disabled}
          className={cn(
            "h-12 rounded-2xl text-base px-4 bg-muted/20 border-border focus:bg-background transition-colors",
            errors?.name && "border-destructive focus-visible:ring-destructive"
          )}
        />
        {errors?.name && <p className="text-xs text-destructive font-medium">{errors.name}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="space-y-1.5">
          <Label htmlFor="prod-cat" className="text-sm font-semibold text-foreground">
            Category <span className="text-destructive">*</span>
          </Label>
          <select
            id="prod-cat"
            className="flex h-11 w-full rounded-xl border border-border bg-muted/20 px-3.5 text-sm font-medium text-foreground shadow-2xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus:bg-background"
            value={category}
            onChange={(e) => onChange({ category: e.target.value })}
            disabled={disabled}
          >
            {SHOP_CATEGORIES.map((cat) => (
              <option key={cat} value={cat} className="bg-popover text-popover-foreground">
                {cat}
              </option>
            ))}
          </select>
          {errors?.category && <p className="text-xs text-destructive font-medium">{errors.category}</p>}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="prod-stock" className="text-sm font-semibold text-foreground">
              Opening Stock <span className="text-destructive">*</span>
            </Label>
            <span className="text-xs text-muted-foreground font-normal">Units</span>
          </div>
          <Input
            id="prod-stock"
            type="number"
            min="0"
            step="1"
            placeholder="0"
            value={openingStock}
            onChange={(e) => onChange({ openingStock: e.target.value })}
            disabled={disabled}
            className="h-11 rounded-xl text-sm font-semibold bg-muted/20 border-border focus:bg-background transition-colors"
          />
          {errors?.openingStock && <p className="text-xs text-destructive font-medium">{errors.openingStock}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="prod-brand" className="text-sm font-medium text-foreground">
          Brand / Manufacturer <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
        </Label>
        <Input
          id="prod-brand"
          placeholder="e.g. Lakme, Britannia, Havells"
          value={brand}
          onChange={(e) => onChange({ brand: e.target.value })}
          disabled={disabled}
          className="h-11 rounded-xl text-sm bg-muted/20 border-border focus:bg-background transition-colors"
        />
      </div>
    </div>
  );
}
