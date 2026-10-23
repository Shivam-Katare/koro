import React from "react";
import { cn } from "@/lib/utils";

/**
 * Receipt-style paper: a card with a scalloped bottom edge, like a torn slip.
 * Use <ReceiptDivider /> between sections for the dashed paper-tear line.
 */
export function ReceiptPaper({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <div className="rounded-t-3xl border border-b-0 border-border bg-card">{children}</div>
      <div className="receipt-edge" aria-hidden="true" />
    </div>
  );
}

export function ReceiptDivider({ className }: { className?: string }) {
  return <div className={cn("mx-5 border-t-2 border-dashed border-border", className)} aria-hidden="true" />;
}
