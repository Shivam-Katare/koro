"use client";

import React, { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { scanBillSlipAction } from "@/lib/actions/slip-scan-actions";
import { useSalesStore, type SaleDraftLine } from "@/lib/store/use-sales-store";
import type { ExtractedSlipLine } from "@/lib/types/slip-extractor";
import {
  Camera,
  UploadCloud,
  RotateCw,
  Sparkles,
  Loader2,
  Trash2,
  Plus,
  Minus,
  CheckCircle2,
  AlertCircle,
  Cpu,
  ArrowRight,
  ImageIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

interface SalesSlipScannerDialogProps {
  shopId: string | null;
  trigger?: React.ReactNode;
}

export function SalesSlipScannerDialog({ shopId, trigger }: SalesSlipScannerDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string>("image/jpeg");
  const [rotation, setRotation] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedLines, setExtractedLines] = useState<ExtractedSlipLine[]>([]);
  const [extractionMethod, setExtractionMethod] = useState<"gemini" | "local_ocr" | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const addExtractedLines = useSalesStore((s) => s.addExtractedLines);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (PNG, JPG, WEBP)");
      return;
    }

    setImageMime(file.type);
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setImagePreview(base64);
      setRotation(0);
      setExtractedLines([]);
      setExtractionMethod(null);
    };
    reader.readAsDataURL(file);
  };

  // Rotate image by 90 degrees
  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Convert current image with rotation into rotated base64
  const getRotatedBase64 = async (base64: string, deg: number): Promise<string> => {
    if (deg === 0) return base64;

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(base64);

        if (deg === 90 || deg === 270) {
          canvas.width = img.height;
          canvas.height = img.width;
        } else {
          canvas.width = img.width;
          canvas.height = img.height;
        }

        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((deg * Math.PI) / 180);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);

        resolve(canvas.toDataURL(imageMime || "image/jpeg"));
      };
      img.src = base64;
    });
  };

  // Trigger Hybrid Scan
  const handleScanImage = async () => {
    if (!shopId || !imagePreview) return;

    setIsProcessing(true);
    setExtractedLines([]);

    try {
      const orientedBase64 = await getRotatedBase64(imagePreview, rotation);

      const res = await scanBillSlipAction({
        shopId,
        imageBase64: orientedBase64,
        mimeType: imageMime,
      });

      if (!res.success || res.lines.length === 0) {
        toast.error(res.error || "No clear items found. Please check slip lighting.");
        return;
      }

      setExtractedLines(res.lines);
      setExtractionMethod(res.method === "gemini" ? "gemini" : "local_ocr");

      toast.success(
        res.method === "gemini"
          ? `Extracted ${res.lines.length} items via Cloud Vision AI!`
          : `Extracted ${res.lines.length} items via Local Engine!`
      );
    } catch (err: any) {
      toast.error(err?.message || "Failed to scan slip");
    } finally {
      setIsProcessing(false);
    }
  };

  // Edit quantity in extracted list
  const updateQuantity = (lineId: string, delta: number) => {
    setExtractedLines((prev) =>
      prev.map((l) => (l.id === lineId ? { ...l, quantity: Math.max(0.1, l.quantity + delta) } : l))
    );
  };

  // Edit price in extracted list
  const updatePrice = (lineId: string, val: string) => {
    const num = val === "" ? null : parseFloat(val);
    setExtractedLines((prev) =>
      prev.map((l) => (l.id === lineId ? { ...l, unitPrice: isNaN(num as number) ? null : num } : l))
    );
  };

  // Edit item name
  const updateItemName = (lineId: string, val: string) => {
    setExtractedLines((prev) =>
      prev.map((l) => (l.id === lineId ? { ...l, rawItemName: val } : l))
    );
  };

  // Remove line from preview
  const removeLine = (lineId: string) => {
    setExtractedLines((prev) => prev.filter((l) => l.id !== lineId));
  };

  // Feed extracted lines into Counter Sale draft
  const handleConfirmAndAddToSale = () => {
    if (extractedLines.length === 0) return;

    const draftLines: SaleDraftLine[] = extractedLines.map((l) => ({
      id: l.id,
      rawItemName: l.rawItemName,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      productId: l.productId,
      isTracked: l.isTracked,
      status: l.status,
    }));

    addExtractedLines(draftLines);
    toast.success(`Added ${draftLines.length} items to Counter Sale draft.`);
    setIsOpen(false);
    resetState();
  };

  const resetState = () => {
    setImagePreview(null);
    setRotation(0);
    setExtractedLines([]);
    setExtractionMethod(null);
    setIsProcessing(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const totalCalculated = extractedLines.reduce(
    (sum, l) => sum + (l.unitPrice !== null ? l.unitPrice * l.quantity : 0),
    0
  );

  return (
    <>
      {trigger ? (
        <div onClick={() => setIsOpen(true)}>{trigger}</div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(true)}
          className="h-8.5 px-3 rounded-lg border-border hover:bg-muted text-xs font-medium gap-2 cursor-pointer shadow-none"
        >
          <Camera className="h-3.5 w-3.5 text-primary" />
          <span>Scan Bill / Slip</span>
        </Button>
      )}

      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) resetState();
        }}
      >
        <DialogContent className="max-w-xl p-0 overflow-hidden border border-border/80 bg-card shadow-2xl">
          {/* Header */}
          <DialogHeader className="p-4 sm:p-5 border-b border-border/70 bg-muted/20">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Camera className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold font-heading text-foreground">
                  Scan Bill / Counter Slip
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Upload a photo of a counter slip or bill. Hybrid Vision AI &amp; Local OCR extracts sold items for instant stock deduction.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Body */}
          <div className="p-4 sm:p-5 space-y-4 max-h-[75vh] overflow-y-auto">
            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />

            {!imagePreview ? (
              /* Dropzone / Upload Prompt */
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border hover:border-primary/50 rounded-2xl p-8 sm:p-10 text-center cursor-pointer transition-colors bg-muted/10 hover:bg-muted/25 flex flex-col items-center justify-center space-y-3"
              >
                <div className="h-12 w-12 rounded-2xl bg-muted/60 border border-border flex items-center justify-center text-muted-foreground shadow-2xs">
                  <UploadCloud className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">
                    Click to capture or upload bill photo
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Supports handwritten counter parchi, printed receipts, or slips
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 rounded-lg text-xs gap-1.5 cursor-pointer shadow-none pointer-events-none mt-1"
                >
                  <Camera className="h-3.5 w-3.5" />
                  <span>Choose Image</span>
                </Button>
              </div>
            ) : (
              /* Image Preview & Scan Controls */
              <div className="space-y-4">
                <div className="relative rounded-xl border border-border bg-black/40 overflow-hidden flex items-center justify-center min-h-[200px] max-h-[280px]">
                  <img
                    src={imagePreview}
                    alt="Slip Preview"
                    style={{
                      transform: `rotate(${rotation}deg)`,
                      transition: "transform 0.2s ease-out",
                    }}
                    className="max-h-[260px] max-w-full object-contain"
                  />

                  {/* Toolbar overlay: Rotate / Flip & Retake */}
                  <div className="absolute bottom-2 right-2 flex items-center gap-1.5 bg-black/75 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10">
                    {/* Rotate / Flip Button */}
                    <button
                      type="button"
                      onClick={handleRotate}
                      title="Rotate 90° clockwise"
                      className="p-1.5 rounded-md hover:bg-white/20 text-white transition-colors cursor-pointer flex items-center gap-1 text-xs"
                    >
                      <RotateCw className="h-3.5 w-3.5" />
                      <span>Rotate {rotation > 0 ? `${rotation}°` : ""}</span>
                    </button>

                    <div className="h-3 w-px bg-white/20" />

                    {/* Change / Reset image */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      title="Upload different image"
                      className="p-1.5 rounded-md hover:bg-white/20 text-white transition-colors cursor-pointer text-xs"
                    >
                      Change
                    </button>
                  </div>
                </div>

                {/* Scan Action Button */}
                {extractedLines.length === 0 && (
                  <Button
                    type="button"
                    onClick={handleScanImage}
                    disabled={isProcessing}
                    className="w-full h-10 font-medium text-xs gap-2 cursor-pointer shadow-xs"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Analyzing Slip (Cloud Vision &amp; Local OCR)...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        <span>Extract Items from Slip</span>
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}

            {/* Extracted Items Review Table */}
            {extractedLines.length > 0 && (
              <div className="space-y-3 pt-2 border-t border-border/60">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">
                      Extracted Items ({extractedLines.length})
                    </span>
                    {extractionMethod === "gemini" ? (
                      <Badge variant="outline" className="text-[10px] py-0 px-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-medium gap-1">
                        <Sparkles className="h-2.5 w-2.5" /> Cloud Vision
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] py-0 px-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 font-medium gap-1">
                        <Cpu className="h-2.5 w-2.5" /> Local Engine
                      </Badge>
                    )}
                  </div>

                  <span className="text-xs font-bold text-foreground">
                    Total: ₹{totalCalculated.toFixed(0)}
                  </span>
                </div>

                <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                  {extractedLines.map((line) => (
                    <div
                      key={line.id}
                      className="p-2.5 rounded-xl border border-border/70 bg-background/80 hover:border-border transition-colors flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <Input
                          value={line.rawItemName}
                          onChange={(e) => updateItemName(line.id, e.target.value)}
                          className="h-7 text-xs font-medium px-2 bg-transparent border-border/60 focus:bg-background"
                        />
                        <div className="flex items-center gap-1.5 text-[10px]">
                          {line.isTracked ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-0.5">
                              <CheckCircle2 className="h-2.5 w-2.5" /> Matched: {line.matchedProductName}
                            </span>
                          ) : (
                            <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-0.5">
                              <AlertCircle className="h-2.5 w-2.5" /> Custom / Untracked
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Quantity Stepper */}
                      <div className="flex items-center gap-1 border border-border rounded-lg bg-muted/40 p-0.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => updateQuantity(line.id, -1)}
                          className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-6 text-center font-bold text-xs">
                          {line.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(line.id, 1)}
                          className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      {/* Unit Price Input */}
                      <div className="w-18 shrink-0">
                        <Input
                          type="number"
                          placeholder="₹ Price"
                          value={line.unitPrice !== null ? line.unitPrice : ""}
                          onChange={(e) => updatePrice(line.id, e.target.value)}
                          className="h-7 text-xs text-right font-medium px-1.5 bg-transparent border-border/60"
                        />
                      </div>

                      {/* Delete item */}
                      <button
                        type="button"
                        onClick={() => removeLine(line.id)}
                        className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors cursor-pointer"
                        title="Remove item"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex items-center justify-between gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleScanImage}
                    disabled={isProcessing}
                    className="h-9 px-3 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    Rescan
                  </Button>

                  <Button
                    type="button"
                    onClick={handleConfirmAndAddToSale}
                    className="h-9 px-4 font-semibold text-xs gap-1.5 cursor-pointer shadow-xs"
                  >
                    <span>Import to Counter Sale</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
