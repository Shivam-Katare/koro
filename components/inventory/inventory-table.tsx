"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EditProductDialog } from "./edit-product-dialog";
import type { Product } from "@/lib/supabase/types";
import { Search, MapPin, Tag, AlertCircle, CheckCircle2, Box } from "lucide-react";

interface InventoryTableProps {
  products: Product[];
}

export function InventoryTable({ products }: InventoryTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    return products.filter((p) => {
      // Status filter
      if (statusFilter === "low_stock" && p.stock_status !== "low_stock" && p.stock_status !== "out_of_stock") return false;
      if (statusFilter === "in_stock" && p.stock_status !== "in_stock") return false;

      // Text query across name, brand, category, storage_location, barcode, and dynamic attributes
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const inAttributes = Object.values(p.attributes || {}).some((v) => String(v).toLowerCase().includes(q));

      return (
        p.name.toLowerCase().includes(q) ||
        (p.brand && p.brand.toLowerCase().includes(q)) ||
        p.category.toLowerCase().includes(q) ||
        (p.storage_location && p.storage_location.toLowerCase().includes(q)) ||
        (p.barcode && p.barcode.toLowerCase().includes(q)) ||
        inAttributes
      );
    });
  }, [products, searchQuery, statusFilter]);

  return (
    <div className="space-y-4">
      {/* Controls: Search & Status Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, location (e.g. DRAW-TO-BOX-5), brand, shade..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "all", label: `All (${products.length})` },
            { id: "in_stock", label: "In Stock" },
            { id: "low_stock", label: "Low / Out of Stock" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === tab.id
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Product List */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center">
          <p className="text-sm font-medium text-foreground">No matching products found</p>
          <p className="text-xs text-muted-foreground mt-1">
            Try adjusting your search query or clear the filter to view all products.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border rounded-xl border border-border bg-card shadow-xs overflow-hidden">
          {filtered.map((product) => {
            const isLow = product.stock_status === "low_stock" || product.stock_status === "out_of_stock";
            return (
              <div
                key={product.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 hover:bg-muted/30 transition-colors"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-sm text-foreground truncate">{product.name}</h3>
                    {product.brand && (
                      <span className="text-xs text-muted-foreground">({product.brand})</span>
                    )}
                    <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                      {product.category}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {product.storage_location && (
                      <span className="flex items-center gap-1 font-medium text-foreground bg-muted/60 px-1.5 py-0.5 rounded-md">
                        <MapPin className="h-3 w-3 text-primary" />
                        {product.storage_location}
                      </span>
                    )}
                    {product.selling_price !== null && (
                      <span className="flex items-center gap-1 font-semibold text-foreground">
                        <Tag className="h-3 w-3 text-muted-foreground" />
                        ₹{Number(product.selling_price).toFixed(2)}
                      </span>
                    )}
                    {Object.entries(product.attributes || {}).map(([k, v]) => (
                      <span key={k} className="inline-flex items-center gap-1 text-[11px] bg-muted/40 px-1.5 py-0.5 rounded">
                        <Box className="h-2.5 w-2.5 text-muted-foreground" />
                        <span className="capitalize">{k.replace(/_/g, " ")}:</span> {String(v)}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                  <div className="text-right">
                    <div className="flex items-center gap-1.5 justify-end">
                      {isLow ? (
                        <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      )}
                      <span className="text-base font-bold font-heading text-foreground">
                        {product.current_stock}
                      </span>
                      <span className="text-xs text-muted-foreground">units</span>
                    </div>
                    <span className={`text-[10px] font-medium block ${isLow ? "text-amber-500" : "text-emerald-600 dark:text-emerald-400"}`}>
                      {product.stock_status.replace("_", " ")}
                    </span>
                  </div>

                  <EditProductDialog product={product} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
