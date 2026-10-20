"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ProductFormCore } from "./product-form-core";
import { ProductFormDetails } from "./product-form-details";
import { ProductFormAttributes } from "./product-form-attributes";
import { createProductAction } from "@/lib/actions/product-actions";
import { PlusCircle, Loader2, PackagePlus } from "lucide-react";
import toast from "react-hot-toast";

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
  };

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
        <DialogTrigger render={<Button className="h-10 font-semibold gap-2 shadow-xs" />}>
          <PlusCircle className="h-4 w-4" />
          <span>Add Product</span>
        </DialogTrigger>
      )}

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary mb-1">
            <PackagePlus className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">Inventory Entry</span>
          </div>
          <DialogTitle>Add Product to Shop</DialogTitle>
          <DialogDescription>
            Enter opening stock and location. Category attributes and barcode can be customized dynamically.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <ProductFormCore
            name={name}
            category={category}
            openingStock={openingStock}
            brand={brand}
            onChange={(fields) => {
              if (fields.name !== undefined) setName(fields.name);
              if (fields.category !== undefined) setCategory(fields.category);
              if (fields.openingStock !== undefined) setOpeningStock(fields.openingStock);
              if (fields.brand !== undefined) setBrand(fields.brand);
            }}
            errors={errors}
            disabled={loading}
          />

          <ProductFormDetails
            sellingPrice={sellingPrice}
            storageLocation={storageLocation}
            minStockThreshold={minStockThreshold}
            barcode={barcode}
            onChange={(fields) => {
              if (fields.sellingPrice !== undefined) setSellingPrice(fields.sellingPrice);
              if (fields.storageLocation !== undefined) setStorageLocation(fields.storageLocation);
              if (fields.minStockThreshold !== undefined) setMinStockThreshold(fields.minStockThreshold);
              if (fields.barcode !== undefined) setBarcode(fields.barcode);
            }}
            disabled={loading}
          />

          <ProductFormAttributes
            category={category}
            attributes={attributes}
            onChange={setAttributes}
            disabled={loading}
          />

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" className="font-semibold gap-1.5" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <PlusCircle className="h-3.5 w-3.5" />
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
