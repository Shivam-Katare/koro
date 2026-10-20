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
    <div className="space-y-3 pt-1 border-t border-border/60">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          Pricing &amp; Storage Details (Optional)
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="prod-price" className="text-xs font-medium text-foreground">
            Selling Price (₹)
          </Label>
          <Input
            id="prod-price"
            type="number"
            min="0"
            step="0.5"
            placeholder="0.00"
            value={sellingPrice}
            onChange={(e) => onChange({ sellingPrice: e.target.value })}
            disabled={disabled}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="prod-location" className="text-xs font-medium text-foreground">
            Storage Location
          </Label>
          <Input
            id="prod-location"
            placeholder="e.g. DRAW-TO-BOX-5, Rack 2"
            value={storageLocation}
            onChange={(e) => onChange({ storageLocation: e.target.value })}
            disabled={disabled}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label htmlFor="prod-threshold" className="text-xs font-medium text-foreground">
              Low Stock Alert Limit
            </Label>
            <span className="text-[10px] text-muted-foreground">Default: 5</span>
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
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="prod-barcode" className="text-xs font-medium text-foreground">
            Barcode / Item Code
          </Label>
          <Input
            id="prod-barcode"
            placeholder="e.g. 8901030384729"
            value={barcode}
            onChange={(e) => onChange({ barcode: e.target.value })}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
}
