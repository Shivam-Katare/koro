"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ProductFormDetailsProps {
  sellingPrice: number | string;
  storageLocation: string;
  minStockThreshold: number | string;
  barcode: string;
  onChange: (fields: Partial<{
    sellingPrice: number | string;
    storageLocation: string;
    minStockThreshold: number | string;
    barcode: string;
  }>) => void;
  disabled?: boolean;
}

export function ProductFormDetails({
  sellingPrice,
  storageLocation,
  minStockThreshold,
  barcode,
  onChange,
  disabled,
}: ProductFormDetailsProps) {
  return (
    <div className="space-y-4 pt-3 border-t border-border/70">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Pricing &amp; Storage Details (Optional)
        </span>
      </div>

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
              onChange={(e) => onChange({ sellingPrice: e.target.value })}
              disabled={disabled}
              className="h-11 rounded-xl pl-8 text-sm font-semibold bg-muted/20 border-border focus:bg-background transition-colors"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="prod-location" className="text-sm font-medium text-foreground">
            Storage Location
          </Label>
          <Input
            id="prod-location"
            placeholder="e.g. DRAW-TO-BOX-5, Rack 2"
            value={storageLocation}
            onChange={(e) => onChange({ storageLocation: e.target.value })}
            disabled={disabled}
            className="h-11 rounded-xl text-sm px-3.5 bg-muted/20 border-border focus:bg-background transition-colors"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="prod-threshold" className="text-sm font-medium text-foreground">
              Low Stock Alert Limit
            </Label>
            <span className="text-xs text-muted-foreground">Default: 5</span>
          </div>
          <Input
            id="prod-threshold"
            type="number"
            min="0"
            step="1"
            placeholder="5"
            value={minStockThreshold}
            onChange={(e) => onChange({ minStockThreshold: e.target.value })}
            disabled={disabled}
            className="h-11 rounded-xl text-sm bg-muted/20 border-border focus:bg-background transition-colors"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="prod-barcode" className="text-sm font-medium text-foreground">
            Barcode / Item Code
          </Label>
          <Input
            id="prod-barcode"
            placeholder="e.g. 8901030384729"
            value={barcode}
            onChange={(e) => onChange({ barcode: e.target.value })}
            disabled={disabled}
            className="h-11 rounded-xl text-sm bg-muted/20 border-border focus:bg-background transition-colors"
          />
        </div>
      </div>
    </div>
  );
}
