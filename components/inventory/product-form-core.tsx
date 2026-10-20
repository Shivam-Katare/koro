"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SHOP_CATEGORIES } from "@/lib/validations/auth";

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
    <div className="space-y-3">
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label htmlFor="prod-name" className="text-xs font-semibold text-foreground">
            Product Name <span className="text-destructive">*</span>
          </Label>
          <span className="text-[10px] text-muted-foreground">Required</span>
        </div>
        <Input
          id="prod-name"
          placeholder="e.g. Lakme Matte Lipstick, Parle-G 250g"
          value={name}
          onChange={(e) => onChange({ name: e.target.value })}
          disabled={disabled}
        />
        {errors?.name && <p className="text-xs text-destructive">{errors.name}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label htmlFor="prod-cat" className="text-xs font-semibold text-foreground">
              Category <span className="text-destructive">*</span>
            </Label>
          </div>
          <select
            id="prod-cat"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground"
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
          {errors?.category && <p className="text-xs text-destructive">{errors.category}</p>}
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label htmlFor="prod-stock" className="text-xs font-semibold text-foreground">
              Opening Stock <span className="text-destructive">*</span>
            </Label>
            <span className="text-[10px] text-muted-foreground">Units</span>
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
          />
          {errors?.openingStock && <p className="text-xs text-destructive">{errors.openingStock}</p>}
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="prod-brand" className="text-xs font-medium text-muted-foreground">
          Brand / Manufacturer <span className="text-[10px]">(Optional)</span>
        </Label>
        <Input
          id="prod-brand"
          placeholder="e.g. Lakme, Britannia, Havells"
          value={brand}
          onChange={(e) => onChange({ brand: e.target.value })}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
