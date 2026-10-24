"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ReceiptPaper, ReceiptDivider } from "@/components/restock/receipt-paper";
import { ReceiptText, CheckCircle2, Calendar, FileText, MessageSquareShare, X } from "lucide-react";

interface SalesSlipDetailDialogProps {
  slip: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shopName?: string | null;
}

export function SalesSlipDetailDialog({
  slip,
  open,
  onOpenChange,
  shopName,
}: SalesSlipDetailDialogProps) {
  if (!slip) return null;

  const lines = slip.lines || [];
  const dateStr = new Date(slip.created_at || slip.slip_date).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const handleShareWhatsApp = () => {
    const slipLines = lines
      .map((l: any) => `• ${l.raw_item_name} × ${l.quantity} = ₹${Number(l.subtotal || 0).toFixed(0)}`)
      .join("\n");

    const message = [
      `*SALE RECEIPT / COUNTER SLIP*`,
      `*Shop:* ${shopName || "Our Retail Store"}`,
      `*Slip No:* ${slip.slip_number}`,
      `*Date:* ${dateStr}`,
      slip.notes ? `*Note:* ${slip.notes}` : "",
      ``,
      `*Items:*`,
      slipLines,
      ``,
      `*Total Amount:* ₹${Number(slip.total_amount || 0).toFixed(0)}`,
      `Thank you for shopping with us!`,
    ]
      .filter(Boolean)
      .join("\n");

    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-0 bg-transparent p-0 shadow-none">
        <DialogHeader className="sr-only">
          <DialogTitle>Sales Slip #{slip.slip_number}</DialogTitle>
        </DialogHeader>

        <ReceiptPaper>
          {/* Header */}
          <div className="flex items-start justify-between gap-3 p-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ReceiptText className="h-5 w-5 text-primary" />
                <h3 className="font-heading text-xl font-bold text-foreground">
                  {slip.slip_number}
                </h3>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span>{dateStr}</span>
              </div>
            </div>

            <span className="inline-flex items-center gap-1 rounded-full bg-[#e8f7ee] dark:bg-[#1c2b22] px-3 py-1 text-xs font-semibold text-[#0f7a39] dark:text-[#5fd68c]">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Stock Deducted</span>
            </span>
          </div>

          <ReceiptDivider />

          {/* Body */}
          <div className="p-5 space-y-4">
            {slip.notes && (
              <div className="flex items-start gap-2 rounded-2xl bg-muted/40 p-3 text-xs text-muted-foreground">
                <FileText className="h-4 w-4 shrink-0 text-foreground mt-0.5" />
                <span>{slip.notes}</span>
              </div>
            )}

            {/* Line items table */}
            <div className="no-scrollbar max-h-[260px] space-y-2 overflow-y-auto divide-y divide-border/60">
              {lines.map((line: any, idx: number) => (
                <div key={line.id || idx} className="pt-2 first:pt-0 flex items-center justify-between text-sm">
                  <div>
                    <p className="font-semibold text-foreground">{line.raw_item_name}</p>
                    <p className="text-xs text-muted-foreground">
                      Qty: {line.quantity} units {line.is_tracked ? "• Stock deducted" : "• Untracked sale"}
                    </p>
                  </div>
                  {line.subtotal !== null && (
                    <span className="font-heading font-bold text-foreground">
                      ₹{Number(line.subtotal).toFixed(0)}
                    </span>
                  )}
                </div>
              ))}
            </div>

            <ReceiptDivider className="mx-0" />

            {/* Total */}
            <div className="flex items-baseline justify-between pt-1">
              <span className="text-base font-semibold text-muted-foreground">Total Amount</span>
              <span className="font-heading text-2xl font-extrabold text-foreground">
                ₹{Number(slip.total_amount || 0).toFixed(0)}
              </span>
            </div>

            {/* WhatsApp Share Button */}
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="w-full h-12 cursor-pointer rounded-full bg-[#14a44d] hover:bg-[#118d42] text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <MessageSquareShare className="h-4 w-4" />
              <span>Share Receipt on WhatsApp</span>
            </button>
          </div>
        </ReceiptPaper>
      </DialogContent>
    </Dialog>
  );
}
