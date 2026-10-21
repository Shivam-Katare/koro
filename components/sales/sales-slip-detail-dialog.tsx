"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ReceiptText, CheckCircle2, Calendar, FileText } from "lucide-react";

interface SalesSlipDetailDialogProps {
  slip: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SalesSlipDetailDialog({ slip, open, onOpenChange }: SalesSlipDetailDialogProps) {
  if (!slip) return null;

  const lines = slip.lines || [];
  const dateStr = new Date(slip.created_at || slip.slip_date).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-base font-bold font-heading">
              <ReceiptText className="h-4 w-4 text-primary" />
              <span>{slip.slip_number}</span>
            </DialogTitle>
            <Badge variant="secondary" className="text-emerald-600 dark:text-emerald-400 gap-1 text-[10px] py-0.5">
              <CheckCircle2 className="h-3 w-3" />
              <span>Stock Deducted</span>
            </Badge>
          </div>
          <DialogDescription className="text-xs flex items-center gap-1.5 text-muted-foreground pt-1">
            <Calendar className="h-3.5 w-3.5" />
            <span>{dateStr}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-2">
          {slip.notes && (
            <div className="p-2.5 rounded-lg bg-muted/40 border border-border text-xs text-muted-foreground flex items-start gap-1.5">
              <FileText className="h-3.5 w-3.5 mt-0.5 shrink-0 text-foreground" />
              <span>{slip.notes}</span>
            </div>
          )}

          <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1 divide-y divide-border/60">
            {lines.map((line: any, idx: number) => (
              <div key={line.id || idx} className="py-2 flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-foreground">{line.raw_item_name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    Qty: {line.quantity} units {line.is_tracked ? "• Stock deducted" : "• Untracked sale"}
                  </p>
                </div>
                {line.subtotal !== null && (
                  <span className="font-bold text-foreground font-heading">
                    ₹{Number(line.subtotal).toFixed(0)}
                  </span>
                )}
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-border flex items-center justify-between text-sm font-bold">
            <span>Total Amount:</span>
            <span className="text-base text-primary font-heading">
              ₹{Number(slip.total_amount || 0).toFixed(0)}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
