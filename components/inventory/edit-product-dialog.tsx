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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProductFormAttributes } from "./product-form-attributes";
import { updateProductAction, adjustStockAction, deleteProductAction } from "@/lib/actions/product-actions";
import type { Product } from "@/lib/supabase/types";
import { Edit2, Loader2, Save, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

interface EditProductDialogProps {
  product: Product;
  trigger?: React.ReactNode;
}

export function EditProductDialog({ product, trigger }: EditProductDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(product.name);
  const [category, setCategory] = useState(product.category);
  const [sellingPrice, setSellingPrice] = useState<number | string>(product.selling_price ?? "");
  const [storageLocation, setStorageLocation] = useState(product.storage_location ?? "");
  const [minStockThreshold, setMinStockThreshold] = useState<number | string>(product.min_stock_threshold ?? 5);
  const [barcode, setBarcode] = useState(product.barcode ?? "");
  const [attributes, setAttributes] = useState<Record<string, any>>(product.attributes || {});
  const [stockToCorrect, setStockToCorrect] = useState<number | string>(product.current_stock);
  const [loading, setLoading] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // 1. Update product metadata
    const updateRes = await updateProductAction({
      productId: product.id,
      name: name.trim(),
      category,
      barcode: barcode.trim() || undefined,
      sellingPrice: sellingPrice !== "" ? Number(sellingPrice) : null,
      storageLocation: storageLocation.trim() || undefined,
      minStockThreshold: minStockThreshold !== "" ? Number(minStockThreshold) : 5,
      attributes,
    });

    if (!updateRes.success) {
      toast.error(updateRes.error || "Failed to update details");
      setLoading(false);
      return;
    }

    // 2. If stock quantity was adjusted, record movement
    const numericStock = Number(stockToCorrect);
    if (!isNaN(numericStock) && numericStock !== product.current_stock) {
      const stockRes = await adjustStockAction({
        productId: product.id,
        newStock: numericStock,
        reason: "correction",
        notes: "Stock corrected from Edit dialog",
      });
      if (!stockRes.success) {
        toast.error("Details saved, but stock adjustment failed: " + stockRes.error);
      }
    }

    setLoading(false);
    toast.success("Product updated successfully!");
    setOpen(false);
    router.refresh();
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${product.name}"?`)) return;
    setLoading(true);
    const res = await deleteProductAction(product.id);
    setLoading(false);
    if (res.success) {
      toast.success("Product removed from inventory");
      setOpen(false);
      router.refresh();
    } else {
      toast.error(res.error || "Failed to delete product");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger render={trigger as React.ReactElement} />
      ) : (
        <DialogTrigger render={<Button variant="ghost" size="sm" className="h-8 w-8 p-0" />}>
          <Edit2 className="h-3.5 w-3.5" />
        </DialogTrigger>
      )}

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit &ldquo;{product.name}&rdquo;</DialogTitle>
          <DialogDescription>
            Update pricing, storage location, custom tags, or correct stock count.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Product Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} disabled={loading} />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Current Stock Count</Label>
              <Input
                type="number"
                min="0"
                value={stockToCorrect}
                onChange={(e) => setStockToCorrect(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Selling Price (₹)</Label>
              <Input
                type="number"
                min="0"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Storage Location</Label>
              <Input
                placeholder="e.g. DRAW-TO-BOX-5"
                value={storageLocation}
                onChange={(e) => setStorageLocation(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <ProductFormAttributes
            category={category}
            attributes={attributes}
            onChange={setAttributes}
            disabled={loading}
          />

          <div className="flex items-center justify-between pt-3 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="text-destructive hover:text-destructive hover:bg-destructive/10 text-xs gap-1"
              disabled={loading}
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete</span>
            </Button>

            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="gap-1.5 font-semibold" disabled={loading}>
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                <span>Save Changes</span>
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
