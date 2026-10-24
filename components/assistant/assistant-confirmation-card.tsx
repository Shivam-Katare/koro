"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { confirmAssistantActionExecution } from "@/lib/actions/assistant-actions";
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  PackageCheck,
  PackagePlus,
  Sparkles,
  MapPin,
  IndianRupee,
  Layers,
  Trash2,
  ShoppingCart,
  Truck,
  Receipt,
} from "lucide-react";
import toast from "react-hot-toast";

const STORE_CATEGORIES = [
  "Cosmetics & Bangles / Jewelry",
  "Kirana & Grocery",
  "Apparel & Garments",
  "Hardware & Electrical",
  "Stationery & Books",
  "General Store",
  "Other Retail",
];

import type { AssistantPendingAction } from "@/lib/assistant/assistant-db";

interface AssistantConfirmationCardProps {
  shopId: string;
  action: AssistantPendingAction;
  onSuccess: (updatedMessage: string) => void;
  onCancel: () => void;
}

export function AssistantConfirmationCard({
  shopId,
  action,
  onSuccess,
  onCancel,
}: AssistantConfirmationCardProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [doneMessage, setDoneMessage] = useState("");

  // Editable fields for create_product
  const [name, setName] = useState(action.productName || "");
  const [openingStock, setOpeningStock] = useState<number>(
    action.openingStock !== undefined
      ? action.openingStock
      : action.quantityDelta && action.quantityDelta > 0
      ? action.quantityDelta
      : 1
  );
  const [sellingPrice, setSellingPrice] = useState<string>(
    action.sellingPrice !== undefined && action.sellingPrice !== null
      ? String(action.sellingPrice)
      : ""
  );
  const [category, setCategory] = useState<string>(
    action.category || "General Store"
  );
  const [storageLocation, setStorageLocation] = useState<string>(
    action.storageLocation || ""
  );

  // Editable fields for update_location and update_price
  const [newLocationInput, setNewLocationInput] = useState<string>(
    action.newLocation || action.storageLocation || ""
  );
  const [newPriceInput, setNewPriceInput] = useState<string>(
    action.newPrice !== undefined
      ? String(action.newPrice)
      : action.sellingPrice !== undefined
      ? String(action.sellingPrice)
      : ""
  );

  // Editable fields for record_sale (supports multi-line sales slips, notes, out-of-stock)
  const [saleLines, setSaleLines] = useState<
    Array<{
      productId?: string;
      productName: string;
      quantity: number;
      unitPrice: number;
      lineTotal?: number;
      currentStock?: number | null;
      newStock?: number | null;
      isUnlinked?: boolean;
      isOutOfStock?: boolean;
    }>
  >(() => {
    if (action.items && action.items.length > 0) {
      return action.items.map((it) => {
        const q = it.quantity && it.quantity > 0 ? it.quantity : 1;
        const p = it.unitPrice !== undefined ? it.unitPrice : 0;
        return {
          productId: it.productId,
          productName: it.productName,
          quantity: q,
          unitPrice: p,
          lineTotal: q * p,
          currentStock: it.currentStock,
          newStock: it.newStock,
          isUnlinked: it.isUnlinked,
          isOutOfStock:
            it.isOutOfStock ||
            (it.currentStock !== undefined && it.currentStock !== null && it.currentStock <= 0),
        };
      });
    }
    const q = action.quantity && action.quantity > 0 ? action.quantity : 1;
    const p =
      action.unitPrice !== undefined && action.unitPrice !== null
        ? action.unitPrice
        : action.sellingPrice !== undefined && action.sellingPrice !== null
        ? action.sellingPrice
        : 0;
    return [
      {
        productId: action.productId,
        productName: action.productName,
        quantity: q,
        unitPrice: p,
        lineTotal: q * p,
        currentStock: action.currentStock,
        newStock: action.newStock,
        isUnlinked: Boolean(action.isUnlinked || !action.productId),
        isOutOfStock: Boolean(
          action.hasOutOfStock ||
            (action.currentStock !== undefined && action.currentStock !== null && action.currentStock <= 0)
        ),
      },
    ];
  });

  const [customerNote, setCustomerNote] = useState<string>(
    action.notes || ""
  );

  // Editable fields for record_order_arrival
  const [arrivedQuantity, setArrivedQuantity] = useState<number>(
    action.receivedQuantity && action.receivedQuantity > 0
      ? action.receivedQuantity
      : action.quantity && action.quantity > 0
      ? action.quantity
      : 1
  );

  // 1. Handle Stock Adjustment Confirmation
  const handleConfirmAdjust = async () => {
    setIsSubmitting(true);
    const res = await confirmAssistantActionExecution({
      shopId,
      actionType: "adjust_stock",
      productId: action.productId,
      productName: action.productName,
      newStock: action.newStock,
      quantityDelta: action.quantityDelta,
      reason: action.reason,
    });
    setIsSubmitting(false);

    if (!res.success) {
      toast.error(res.error || "Failed to update stock");
      return;
    }

    setIsDone(true);
    setDoneMessage(`Stock updated: ${action.productName} is now ${action.newStock} units.`);
    toast.success(`Updated ${action.productName} stock to ${action.newStock} units!`);
    onSuccess(res.message || "Stock adjustment successfully recorded.");
  };

  // 1b. Handle Product Deletion Confirmation
  const handleConfirmDelete = async () => {
    setIsSubmitting(true);
    const res = await confirmAssistantActionExecution({
      shopId,
      actionType: "delete_product",
      productId: action.productId,
      productName: action.productName,
    });
    setIsSubmitting(false);

    if (!res.success) {
      toast.error(res.error || "Failed to delete product");
      return;
    }

    setIsDone(true);
    setDoneMessage(`Deleted ${action.productName} from inventory catalog.`);
    toast.success(`Deleted ${action.productName}!`);
    onSuccess(res.message || `Deleted product ${action.productName}`);
  };

  // 1c. Handle Sale Confirmation (creates sales slip & deducts stock)
  const handleConfirmSale = async () => {
    const validLines = saleLines.map((line) => {
      const q = Math.max(1, Number(line.quantity) || 1);
      const p = Math.max(0, Number(line.unitPrice) || 0);
      return {
        ...line,
        quantity: q,
        unitPrice: p,
        lineTotal: q * p,
      };
    });

    const totalBill = validLines.reduce((acc, it) => acc + (it.lineTotal || 0), 0);
    const anyUnlinked = validLines.some((it) => it.isUnlinked);

    setIsSubmitting(true);
    const res = await confirmAssistantActionExecution({
      shopId,
      actionType: "record_sale",
      productId: validLines.length === 1 ? validLines[0].productId : undefined,
      productName: validLines.length === 1 ? validLines[0].productName : `${validLines.length} Items Slip`,
      quantity: validLines.length === 1 ? validLines[0].quantity : undefined,
      unitPrice: validLines.length === 1 ? validLines[0].unitPrice : undefined,
      totalAmount: totalBill,
      items: validLines,
      notes: customerNote.trim() || undefined,
      reason: customerNote.trim() || action.reason || (anyUnlinked ? "unlinked_counter_sale" : "counter_sale"),
      isUnlinked: anyUnlinked,
    });
    setIsSubmitting(false);

    if (!res.success) {
      toast.error(res.error || "Failed to record sale");
      return;
    }

    setIsDone(true);
    const totalMsg =
      validLines.length > 1
        ? `Recorded sales slip: ${validLines.length} items (Total ₹${totalBill}).`
        : `Recorded sale: ${validLines[0].quantity}x ${validLines[0].productName} (Total ₹${totalBill}).`;
    setDoneMessage(totalMsg);
    toast.success(res.message || totalMsg);
    onSuccess(res.message || totalMsg);
  };

  // 1d. Handle Order Arrival Confirmation (increments stock & marks order item received)
  const handleConfirmArrival = async () => {
    const qty = Math.max(1, arrivedQuantity);

    setIsSubmitting(true);
    const res = await confirmAssistantActionExecution({
      shopId,
      actionType: "record_order_arrival",
      orderItemId: action.orderItemId,
      productId: action.productId,
      productName: action.productName,
      receivedQuantity: qty,
    });
    setIsSubmitting(false);

    if (!res.success) {
      toast.error(res.error || "Failed to record delivery arrival");
      return;
    }

    setIsDone(true);
    const arrivalMsg = `Stock arrival recorded: +${qty} units of ${action.productName} added.`;
    setDoneMessage(arrivalMsg);
    toast.success(`Stock added for ${action.productName}!`);
    onSuccess(res.message || arrivalMsg);
  };

  // 2. Handle New Product Creation Confirmation
  const handleConfirmCreate = async () => {
    const cleanName = name.trim();
    if (!cleanName) {
      toast.error("Please enter a valid product name");
      return;
    }

    setIsSubmitting(true);
    const parsedPrice = sellingPrice ? parseFloat(sellingPrice) : undefined;
    const res = await confirmAssistantActionExecution({
      shopId,
      actionType: "create_product",
      productName: cleanName,
      openingStock: Number(openingStock) >= 0 ? Number(openingStock) : 1,
      sellingPrice: parsedPrice && parsedPrice >= 0 ? parsedPrice : undefined,
      category,
      storageLocation: storageLocation.trim() || undefined,
    });
    setIsSubmitting(false);

    if (!res.success) {
      toast.error(res.error || "Failed to add product");
      return;
    }

    setIsDone(true);
    setDoneMessage(`Product added: ${cleanName} with ${openingStock} units in inventory.`);
    toast.success(`Added ${cleanName} to inventory!`);
    onSuccess(res.message || `Created product ${cleanName}`);
  };

  // 3. Handle Location Update Confirmation
  const handleConfirmUpdateLocation = async () => {
    const loc = newLocationInput.trim();
    if (!loc) {
      toast.error("Please enter a valid location");
      return;
    }

    setIsSubmitting(true);
    const res = await confirmAssistantActionExecution({
      shopId,
      actionType: "update_location",
      productId: action.productId,
      productName: action.productName,
      newLocation: loc,
    });
    setIsSubmitting(false);

    if (!res.success) {
      toast.error(res.error || "Failed to update location");
      return;
    }

    setIsDone(true);
    setDoneMessage(`Location updated: ${action.productName} is now at ${loc}.`);
    toast.success(`Updated ${action.productName} location to ${loc}!`);
    onSuccess(res.message || `Location updated to ${loc}`);
  };

  // 4. Handle Price Update Confirmation
  const handleConfirmUpdatePrice = async () => {
    const p = parseFloat(newPriceInput);
    if (isNaN(p) || p < 0) {
      toast.error("Please enter a valid price in rupees");
      return;
    }

    setIsSubmitting(true);
    const res = await confirmAssistantActionExecution({
      shopId,
      actionType: "update_price",
      productId: action.productId,
      productName: action.productName,
      newPrice: p,
      currentPrice: action.currentPrice,
    });
    setIsSubmitting(false);

    if (!res.success) {
      toast.error(res.error || "Failed to update price");
      return;
    }

    setIsDone(true);
    setDoneMessage(`Price updated: ${action.productName} selling price is now ₹${p}.`);
    toast.success(`Updated ${action.productName} price to ₹${p}!`);
    onSuccess(res.message || `Price updated to ₹${p}`);
  };

  // Done Success State
  if (isDone) {
    return (
      <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-950/20 flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-300 animate-fadeIn">
        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
        <span className="font-semibold">{doneMessage}</span>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // CREATE PRODUCT CARD
  // --------------------------------------------------------------------------
  if (action.actionType === "create_product") {
    return (
      <div className="p-3.5 sm:p-4 rounded-xl border border-primary/30 bg-card/95 shadow-md space-y-3 animate-fadeIn">
        <div className="flex items-center justify-between pb-2 border-b border-border/50">
          <div className="flex items-center gap-2 text-xs font-bold text-foreground">
            <div className="h-6 w-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <PackagePlus className="h-3.5 w-3.5" />
            </div>
            <span>Add New Product to Store</span>
          </div>
          <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5 text-[10px] py-0 px-1.5 font-semibold">
            New Item
          </Badge>
        </div>

        <div className="space-y-2.5 text-xs">
          {/* Product Name */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
              <span>Product Name</span>
              <span className="text-red-500">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Nivea Cream, Lakme Kajal"
              disabled={isSubmitting}
              className="h-8 text-xs font-semibold bg-background"
            />
          </div>

          {/* Opening Stock & Selling Price */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">
                Initial Stock
              </label>
              <Input
                type="number"
                min="0"
                value={openingStock}
                onChange={(e) => setOpeningStock(Math.max(0, parseInt(e.target.value, 10) || 0))}
                disabled={isSubmitting}
                className="h-8 text-xs bg-background"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-0.5">
                <IndianRupee className="h-3 w-3" />
                <span>Selling Price</span>
              </label>
              <Input
                type="number"
                min="0"
                step="0.5"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                placeholder="Optional (₹)"
                disabled={isSubmitting}
                className="h-8 text-xs bg-background"
              />
            </div>
          </div>

          {/* Storage Location & Category */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span>Storage Location</span>
              </label>
              <Input
                value={storageLocation}
                onChange={(e) => setStorageLocation(e.target.value)}
                placeholder="e.g. Shelf 2, Drawer 1"
                disabled={isSubmitting}
                className="h-8 text-xs bg-background"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                <Layers className="h-3 w-3" />
                <span>Category</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={isSubmitting}
                className="h-8 w-full rounded-lg border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {STORE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 pt-1 border-t border-border/50">
          <Button
            type="button"
            size="sm"
            onClick={handleConfirmCreate}
            disabled={isSubmitting || !name.trim()}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-8 gap-1.5 cursor-pointer shadow-xs flex-1 sm:flex-initial"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Adding to Inventory...</span>
              </>
            ) : (
              <>
                <PackagePlus className="h-3.5 w-3.5" />
                <span>Confirm &amp; Add Product</span>
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isSubmitting}
            className="text-xs h-8 cursor-pointer"
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // UPDATE LOCATION CARD
  // --------------------------------------------------------------------------
  if (action.actionType === "update_location") {
    const currentLoc = action.currentLocation || "Not assigned yet";
    return (
      <div className="p-3.5 sm:p-4 rounded-xl border border-indigo-500/30 bg-card/95 shadow-md space-y-3 animate-fadeIn">
        <div className="flex items-center justify-between pb-2 border-b border-border/50">
          <div className="flex items-center gap-2 text-xs font-bold text-foreground">
            <div className="h-6 w-6 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <MapPin className="h-3.5 w-3.5" />
            </div>
            <span>Update Storage Location</span>
          </div>
          <Badge
            variant="outline"
            className="border-indigo-500/30 text-indigo-600 dark:text-indigo-400 bg-indigo-500/5 text-[10px] py-0 px-1.5 font-semibold"
          >
            Location
          </Badge>
        </div>

        <div className="space-y-2.5 text-xs">
          <div>
            <span className="text-muted-foreground text-[11px]">Product:</span>
            <p className="font-bold text-foreground text-sm">{action.productName}</p>
          </div>

          <div className="rounded-lg bg-muted/40 p-2 text-[11px] text-muted-foreground flex items-center gap-1.5">
            <span>Current Location:</span>
            <strong className="text-foreground">{currentLoc}</strong>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3 text-indigo-500" />
              <span>New Location / Shelf / Drawer</span>
              <span className="text-red-500">*</span>
            </label>
            <Input
              value={newLocationInput}
              onChange={(e) => setNewLocationInput(e.target.value)}
              placeholder="e.g. Shelf 2, Drawer 3, Rack A"
              disabled={isSubmitting}
              className="h-8 text-xs font-semibold bg-background"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 pt-1 border-t border-border/50">
          <Button
            type="button"
            size="sm"
            onClick={handleConfirmUpdateLocation}
            disabled={isSubmitting || !newLocationInput.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs h-8 gap-1.5 cursor-pointer shadow-xs flex-1 sm:flex-initial"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Updating Location...</span>
              </>
            ) : (
              <>
                <MapPin className="h-3.5 w-3.5" />
                <span>Confirm &amp; Update Location</span>
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isSubmitting}
            className="text-xs h-8 cursor-pointer"
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // UPDATE PRICE CARD
  // --------------------------------------------------------------------------
  if (action.actionType === "update_price") {
    const currentPriceText =
      action.currentPrice !== null && action.currentPrice !== undefined
        ? `₹${action.currentPrice}`
        : "Not set yet";

    return (
      <div className="p-3.5 sm:p-4 rounded-xl border border-emerald-500/30 bg-card/95 shadow-md space-y-3 animate-fadeIn">
        <div className="flex items-center justify-between pb-2 border-b border-border/50">
          <div className="flex items-center gap-2 text-xs font-bold text-foreground">
            <div className="h-6 w-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <IndianRupee className="h-3.5 w-3.5" />
            </div>
            <span>Update Selling Price</span>
          </div>
          <Badge
            variant="outline"
            className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 text-[10px] py-0 px-1.5 font-semibold"
          >
            Price
          </Badge>
        </div>

        <div className="space-y-2.5 text-xs">
          <div>
            <span className="text-muted-foreground text-[11px]">Product:</span>
            <p className="font-bold text-foreground text-sm">{action.productName}</p>
          </div>

          <div className="rounded-lg bg-muted/40 p-2 text-[11px] text-muted-foreground flex items-center gap-1.5">
            <span>Current Price:</span>
            <strong className="text-foreground">{currentPriceText}</strong>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
              <IndianRupee className="h-3 w-3 text-emerald-600" />
              <span>New Selling Price (₹)</span>
              <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              step="0.5"
              min="0"
              value={newPriceInput}
              onChange={(e) => setNewPriceInput(e.target.value)}
              placeholder="e.g. 150"
              disabled={isSubmitting}
              className="h-8 text-xs font-semibold bg-background"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 pt-1 border-t border-border/50">
          <Button
            type="button"
            size="sm"
            onClick={handleConfirmUpdatePrice}
            disabled={isSubmitting || !newPriceInput.trim()}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-8 gap-1.5 cursor-pointer shadow-xs flex-1 sm:flex-initial"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Updating Price...</span>
              </>
            ) : (
              <>
                <IndianRupee className="h-3.5 w-3.5" />
                <span>Confirm &amp; Update Price</span>
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isSubmitting}
            className="text-xs h-8 cursor-pointer"
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // DELETE PRODUCT CARD
  // --------------------------------------------------------------------------
  if (action.actionType === "delete_product") {
    return (
      <div className="p-3.5 sm:p-4 rounded-xl border border-red-500/40 bg-red-500/5 dark:bg-red-950/20 space-y-3 shadow-xs animate-fadeIn">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-red-900 dark:text-red-200">
            <Trash2 className="h-4 w-4 text-red-600 shrink-0" />
            <span>Confirm Product Deletion</span>
          </div>
          <Badge variant="outline" className="border-red-500/30 text-red-800 dark:text-red-300 bg-red-500/10 text-[10px]">
            Permanent
          </Badge>
        </div>

        <div className="space-y-1.5 text-xs">
          <p className="font-bold text-foreground text-sm">{action.productName}</p>
          <p className="text-muted-foreground text-[11px] leading-relaxed">
            Are you sure you want to delete this item? Current stock is{" "}
            <strong className="text-foreground">{action.currentStock ?? 0} units</strong>
            {action.storageLocation ? ` (Location: ${action.storageLocation})` : ""}. This will permanently remove it from your inventory catalog.
          </p>
        </div>

        <div className="flex items-center gap-2 pt-1 border-t border-border/50">
          <Button
            type="button"
            size="sm"
            onClick={handleConfirmDelete}
            disabled={isSubmitting}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs h-8 gap-1.5 cursor-pointer shadow-xs"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="h-3.5 w-3.5" />
                <span>Confirm Delete</span>
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isSubmitting}
            className="text-xs h-8 cursor-pointer"
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // RECORD SALE CARD (Supports Multi-Item Slips, Out-of-Stock Awareness, Udhar / Notes)
  // --------------------------------------------------------------------------
  if (action.actionType === "record_sale") {
    const totalCalc = saleLines.reduce((acc, it) => acc + (it.quantity * it.unitPrice), 0);
    const anyUnlinked = saleLines.some((it) => it.isUnlinked);
    const anyOutOfStock = saleLines.some((it) => it.isOutOfStock);
    const isMultiItem = saleLines.length > 1;

    const updateLineItem = (index: number, patch: Partial<(typeof saleLines)[0]>) => {
      setSaleLines((prev) =>
        prev.map((item, idx) => {
          if (idx !== index) return item;
          const updated = { ...item, ...patch };
          updated.lineTotal = (updated.quantity || 1) * (updated.unitPrice || 0);
          return updated;
        })
      );
    };

    return (
      <div className="p-3.5 sm:p-4 rounded-xl border border-emerald-500/40 bg-card/95 shadow-md space-y-3 animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-border/50">
          <div className="flex items-center gap-2 text-xs font-bold text-foreground">
            <div className="h-6 w-6 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Receipt className="h-3.5 w-3.5" />
            </div>
            <span>
              {isMultiItem
                ? `Sales Slip (${saleLines.length} Items)`
                : anyUnlinked
                ? "Record Custom / Unlinked Sale"
                : "Record Sale & Deduct Stock"}
            </span>
          </div>
          <Badge
            variant="outline"
            className={
              anyUnlinked
                ? "border-amber-500/30 text-amber-700 dark:text-amber-400 bg-amber-500/10 text-[10px] py-0 px-1.5 font-semibold"
                : "border-emerald-500/30 text-emerald-700 dark:text-emerald-300 bg-emerald-500/5 text-[10px] py-0 px-1.5 font-semibold"
            }
          >
            {isMultiItem ? "Multi-Item Bill" : anyUnlinked ? "Unlinked Item" : "Sales Slip"}
          </Badge>
        </div>

        {/* Out of Stock Alert Banner */}
        {anyOutOfStock && (
          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold text-xs">⚠️ Item(s) Out of Stock (Stock 0 in system)</p>
              <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-tight">
                Dukaan mein physical stock aaya tha to aap yeh sale bina kisi rukawat ke record kar sakte hain. System stock 0 se deduct nahi hoga.
              </p>
            </div>
          </div>
        )}

        {/* Line Items List */}
        <div className="space-y-2 text-xs">
          {saleLines.map((line, idx) => {
            const lineCurrentStock = line.currentStock ?? 0;
            const lineNewStock = Math.max(0, lineCurrentStock - line.quantity);
            return (
              <div
                key={idx}
                className="p-2.5 rounded-lg border border-border/60 bg-muted/30 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-foreground text-xs truncate">
                    {line.productName}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    {line.isOutOfStock && (
                      <span className="text-[10px] font-semibold text-rose-700 dark:text-rose-300 bg-rose-500/15 px-1.5 py-0.5 rounded border border-rose-500/30">
                        ⚠️ Out of Stock
                      </span>
                    )}
                    {line.isUnlinked && (
                      <span className="text-[10px] font-medium text-amber-700 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                        ↔ Uncataloged
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground">Qty (Piece)</label>
                    <Input
                      type="number"
                      min="1"
                      value={line.quantity}
                      onChange={(e) =>
                        updateLineItem(idx, {
                          quantity: Math.max(1, parseInt(e.target.value, 10) || 1),
                        })
                      }
                      disabled={isSubmitting}
                      className="h-7 text-xs bg-background"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-0.5">
                      <IndianRupee className="h-2.5 w-2.5" />
                      <span>Price / Unit</span>
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step="0.5"
                      value={line.unitPrice}
                      onChange={(e) =>
                        updateLineItem(idx, {
                          unitPrice: Math.max(0, parseFloat(e.target.value) || 0),
                        })
                      }
                      disabled={isSubmitting}
                      className="h-7 text-xs bg-background"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40">
                  <span>
                    {line.isUnlinked ? (
                      <span className="text-amber-600 dark:text-amber-400 font-medium">No catalog deduction</span>
                    ) : line.isOutOfStock ? (
                      <span className="text-rose-600 dark:text-rose-400 font-medium">Stock: 0</span>
                    ) : (
                      <span>
                        Stock: <strong>{lineCurrentStock}</strong> ➔ <strong className="text-foreground">{lineNewStock}</strong>
                      </span>
                    )}
                  </span>
                  <span className="font-semibold text-foreground">
                    Subtotal: ₹{((line.quantity || 1) * (line.unitPrice || 0)).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Slip Note / Udhar Input */}
          <div className="space-y-1 pt-1">
            <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
              <span>📝 Note / Udhar / Customer info (optional):</span>
            </label>
            <Input
              type="text"
              placeholder="e.g. Ramesh Bhai udhar ₹50 / Paid via GPay"
              value={customerNote}
              onChange={(e) => setCustomerNote(e.target.value)}
              disabled={isSubmitting}
              className="h-8 text-xs bg-background"
            />
          </div>

          {/* Total Bill Box */}
          <div className="p-2.5 rounded-lg bg-emerald-500/10 dark:bg-emerald-950/20 border border-emerald-500/30 space-y-1 text-xs">
            <div className="flex items-center justify-between font-semibold">
              <span className="text-foreground font-bold">Total Bill Amount:</span>
              <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                ₹{totalCalc.toLocaleString("en-IN")}
              </span>
            </div>
            {customerNote.trim() && (
              <p className="text-[11px] text-muted-foreground truncate">
                📝 Note: <span className="text-foreground font-medium">{customerNote.trim()}</span>
              </p>
            )}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 pt-1 border-t border-border/50">
          <Button
            type="button"
            size="sm"
            onClick={handleConfirmSale}
            disabled={isSubmitting}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-8 gap-1.5 cursor-pointer shadow-xs flex-1 sm:flex-initial"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Recording Slip...</span>
              </>
            ) : (
              <>
                <Receipt className="h-3.5 w-3.5" />
                <span>Confirm &amp; Record Slip (बिक्री दर्ज करें)</span>
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isSubmitting}
            className="text-xs h-8 cursor-pointer"
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // RECORD ORDER ARRIVAL CARD
  // --------------------------------------------------------------------------
  if (action.actionType === "record_order_arrival") {
    const qty = Math.max(1, arrivedQuantity);
    const currentStock = action.currentStock ?? 0;
    const newStockCalc = currentStock + qty;

    return (
      <div className="p-3.5 sm:p-4 rounded-xl border border-blue-500/40 bg-card/95 shadow-md space-y-3 animate-fadeIn">
        <div className="flex items-center justify-between pb-2 border-b border-border/50">
          <div className="flex items-center gap-2 text-xs font-bold text-foreground">
            <div className="h-6 w-6 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <Truck className="h-3.5 w-3.5" />
            </div>
            <span>Record Restock Arrival</span>
          </div>
          <Badge variant="outline" className="border-blue-500/30 text-blue-700 dark:text-blue-300 bg-blue-500/5 text-[10px] py-0 px-1.5 font-semibold">
            {action.orderNumber ? `Slip #${action.orderNumber}` : "Delivery"}
          </Badge>
        </div>

        <div className="space-y-2 text-xs">
          <p className="font-bold text-foreground text-sm">{action.productName}</p>

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">Arrived Units to Add</label>
            <Input
              type="number"
              min="1"
              value={arrivedQuantity}
              onChange={(e) => setArrivedQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
              disabled={isSubmitting}
              className="h-8 text-xs bg-background"
            />
          </div>

          <div className="flex items-center gap-2 text-muted-foreground pt-1">
            <span>Stock: <strong className="text-foreground">{currentStock}</strong></span>
            <ArrowRight className="h-3 w-3 text-muted-foreground" />
            <span>New Stock: <strong className="text-emerald-600 dark:text-emerald-400">{newStockCalc}</strong></span>
            <span className="font-bold text-primary">(+{qty} units)</span>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1 border-t border-border/50">
          <Button
            type="button"
            size="sm"
            onClick={handleConfirmArrival}
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-8 gap-1.5 cursor-pointer shadow-xs"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Recording Arrival...</span>
              </>
            ) : (
              <>
                <PackageCheck className="h-3.5 w-3.5" />
                <span>Confirm Delivery Arrival</span>
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isSubmitting}
            className="text-xs h-8 cursor-pointer"
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // ADJUST EXISTING STOCK CARD
  // --------------------------------------------------------------------------
  const delta = action.quantityDelta ?? 0;
  const deltaText = delta > 0 ? `+${delta}` : `${delta}`;

  return (
    <div className="p-3.5 sm:p-4 rounded-xl border border-amber-500/40 bg-amber-500/5 dark:bg-amber-950/20 space-y-3 shadow-xs animate-fadeIn">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
          <span>Confirm Inventory Change</span>
        </div>
        <Badge variant="outline" className="border-amber-500/30 text-amber-800 dark:text-amber-300 text-[10px]">
          Action Required
        </Badge>
      </div>

      <div className="space-y-1 text-xs">
        <p className="font-bold text-foreground text-sm">{action.productName}</p>
        <div className="flex items-center gap-2 text-muted-foreground pt-1">
          <span>Current Stock: <strong className="text-foreground">{action.currentStock ?? 0}</strong></span>
          <ArrowRight className="h-3 w-3 text-muted-foreground" />
          <span>New Stock: <strong className="text-emerald-600 dark:text-emerald-400">{action.newStock}</strong></span>
          <span className="font-bold text-primary">({deltaText} units)</span>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1 border-t border-border/50">
        <Button
          type="button"
          size="sm"
          onClick={handleConfirmAdjust}
          disabled={isSubmitting}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-8 gap-1.5 cursor-pointer shadow-xs"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Applying...</span>
            </>
          ) : (
            <>
              <PackageCheck className="h-3.5 w-3.5" />
              <span>Confirm &amp; Update Stock</span>
            </>
          )}
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={isSubmitting}
          className="text-xs h-8 cursor-pointer"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
