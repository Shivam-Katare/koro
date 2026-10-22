"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { MapPin, Package, AlertTriangle, IndianRupee, CheckCircle2 } from "lucide-react";

interface AssistantMessageItemProps {
  role: "user" | "assistant" | "system";
  content: string;
  taskType?: string | null;
  structuredData?: any;
}

// Format markdown bold (**text**) into real <strong> tags so shopkeeper never sees raw asterisks
function formatContent(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-bold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

export function AssistantMessageItem({
  role,
  content,
  taskType,
  structuredData,
}: AssistantMessageItemProps) {
  const isUser = role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl rounded-tr-xs bg-primary text-primary-foreground px-4 py-2.5 text-xs sm:text-sm font-medium shadow-xs">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start space-y-1.5 w-full">
      <div className="max-w-[92%] sm:max-w-[85%] rounded-2xl rounded-tl-xs bg-muted/60 border border-border/80 px-4 py-3 text-xs sm:text-sm text-foreground shadow-2xs space-y-2">
        {/* Main Clean Formatted Text */}
        <div className="leading-relaxed whitespace-pre-line text-xs sm:text-sm">
          {formatContent(content)}
        </div>

        {/* Structured Task Chips (Location / Stock / Price) */}
        {taskType === "find_product" && structuredData?.found && structuredData?.location && (
          <div className="inline-flex items-center gap-1.5 bg-background border border-border px-2.5 py-1 rounded-md text-xs font-semibold text-primary">
            <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
            <span>Location: {structuredData.location}</span>
          </div>
        )}

        {taskType === "check_stock" && structuredData?.found && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Badge variant="outline" className="bg-background text-xs py-0.5 gap-1">
              <Package className="h-3 w-3 text-primary" />
              <span>Stock: {structuredData.product.current_stock} units</span>
            </Badge>
            {structuredData.product.storage_location && (
              <Badge variant="secondary" className="text-xs py-0.5 gap-1">
                <MapPin className="h-3 w-3" />
                <span>{structuredData.product.storage_location}</span>
              </Badge>
            )}
          </div>
        )}

        {taskType === "price_history" && structuredData?.product && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {structuredData.sellingPrice !== null && (
              <Badge variant="outline" className="bg-background text-xs py-0.5 gap-1 font-semibold text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                <IndianRupee className="h-3 w-3" />
                <span>Sell: ₹{structuredData.sellingPrice}</span>
              </Badge>
            )}
            {structuredData.costPrice !== null && (
              <Badge variant="secondary" className="text-xs py-0.5 gap-1">
                <span>Cost: ₹{structuredData.costPrice}</span>
              </Badge>
            )}
          </div>
        )}

        {taskType === "inventory_summary" && structuredData?.totalProducts !== undefined && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Badge variant="outline" className="bg-background text-xs py-0.5 gap-1 font-bold text-foreground border-primary/30">
              <Package className="h-3 w-3 text-primary" />
              <span>Catalog: {structuredData.totalProducts} Products</span>
            </Badge>
            <Badge variant="secondary" className="text-xs py-0.5 gap-1 font-medium">
              <span>Total Stock: {structuredData.totalUnits} Units</span>
            </Badge>
            {structuredData.lowStockCount > 0 && (
              <Badge variant="outline" className="border-amber-500/40 text-amber-700 dark:text-amber-300 text-xs py-0.5 gap-1">
                <AlertTriangle className="h-3 w-3 text-amber-500" />
                <span>{structuredData.lowStockCount} Low Stock</span>
              </Badge>
            )}
          </div>
        )}

        {taskType === "update_location" && structuredData?.newLocation && (
          <div className="inline-flex items-center gap-1.5 bg-background border border-indigo-500/30 px-2.5 py-1 rounded-md text-xs font-semibold text-indigo-600 dark:text-indigo-400">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span>Target Location: {structuredData.newLocation}</span>
          </div>
        )}

        {taskType === "update_price" && structuredData?.newPrice !== undefined && (
          <div className="inline-flex items-center gap-1.5 bg-background border border-emerald-500/30 px-2.5 py-1 rounded-md text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <IndianRupee className="h-3.5 w-3.5 shrink-0" />
            <span>Target Price: ₹{structuredData.newPrice}</span>
          </div>
        )}
      </div>
    </div>
  );
}
