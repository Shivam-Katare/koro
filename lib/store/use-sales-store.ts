import { create } from "zustand";
import type { Product, SalesSlip } from "@/lib/supabase/types";

export interface SaleDraftLine {
  id: string;
  rawItemName: string;
  quantity: number;
  unitPrice: number | null;
  productId: string | null;
  isTracked: boolean;
  status: "matched" | "untracked" | "unresolved";
}

interface SalesState {
  lines: SaleDraftLine[];
  notes: string;
  slipNumber: string;
  activeSubView: "counter" | "history";
  recentSlips: any[];
  selectedSlipForDetail: any | null;
  isSubmitting: boolean;

  // Actions
  addItemFromProduct: (product: Product, quantity?: number) => void;
  addCustomItem: (rawName: string, products: Product[], quantity?: number, price?: number) => void;
  updateLineQuantity: (lineId: string, quantity: number) => void;
  updateLinePrice: (lineId: string, price: number | null) => void;
  linkProductToLine: (lineId: string, product: Product) => void;
  setLineUntracked: (lineId: string) => void;
  removeLine: (lineId: string) => void;
  clearDraft: () => void;
  setNotes: (notes: string) => void;
  setSlipNumber: (num: string) => void;
  setActiveSubView: (view: "counter" | "history") => void;
  setRecentSlips: (slips: any[]) => void;
  setSelectedSlipForDetail: (slip: any | null) => void;
  setIsSubmitting: (loading: boolean) => void;
  addExtractedLines: (lines: SaleDraftLine[]) => void;
}

function generateSlipNumber(): string {
  const now = new Date();
  const timePart = now.toTimeString().split(" ")[0].replace(/:/g, "");
  const rand = Math.floor(100 + Math.random() * 900);
  return `SLIP-${timePart}-${rand}`;
}

export const useSalesStore = create<SalesState>((set, get) => ({
  lines: [],
  notes: "",
  slipNumber: generateSlipNumber(),
  activeSubView: "counter",
  recentSlips: [],
  selectedSlipForDetail: null,
  isSubmitting: false,

  addItemFromProduct: (product: Product, quantity = 1) => {
    const currentLines = get().lines;
    const existingIndex = currentLines.findIndex((l) => l.productId === product.id);

    if (existingIndex > -1) {
      const updated = [...currentLines];
      updated[existingIndex].quantity += quantity;
      set({ lines: updated });
    } else {
      const newLine: SaleDraftLine = {
        id: `line-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        rawItemName: product.name,
        quantity,
        unitPrice: product.selling_price ? Number(product.selling_price) : null,
        productId: product.id,
        isTracked: true,
        status: "matched",
      };
      set({ lines: [...currentLines, newLine] });
    }
  },

  addCustomItem: (rawName: string, products: Product[], quantity = 1, price) => {
    const trimmed = rawName.trim();
    if (!trimmed) return;

    // Attempt intelligent matching against shop catalog
    const q = trimmed.toLowerCase();
    const matched = products.find(
      (p) =>
        p.name.toLowerCase() === q ||
        (p.barcode && p.barcode.toLowerCase() === q) ||
        p.name.toLowerCase().includes(q)
    );

    const newLine: SaleDraftLine = {
      id: `line-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      rawItemName: trimmed,
      quantity: Math.max(1, quantity),
      unitPrice: price ?? (matched?.selling_price ? Number(matched.selling_price) : null),
      productId: matched ? matched.id : null,
      isTracked: Boolean(matched),
      status: matched ? "matched" : "unresolved",
    };

    set({ lines: [...get().lines, newLine] });
  },

  updateLineQuantity: (lineId: string, quantity: number) => {
    const validQty = Math.max(0.1, quantity);
    const updated = get().lines.map((l) => (l.id === lineId ? { ...l, quantity: validQty } : l));
    set({ lines: updated });
  },

  updateLinePrice: (lineId: string, price: number | null) => {
    const updated = get().lines.map((l) => (l.id === lineId ? { ...l, unitPrice: price } : l));
    set({ lines: updated });
  },

  linkProductToLine: (lineId: string, product: Product) => {
    const updated = get().lines.map((l) =>
      l.id === lineId
        ? {
            ...l,
            productId: product.id,
            rawItemName: product.name,
            unitPrice: product.selling_price ? Number(product.selling_price) : l.unitPrice,
            isTracked: true,
            status: "matched" as const,
          }
        : l
    );
    set({ lines: updated });
  },

  setLineUntracked: (lineId: string) => {
    const updated = get().lines.map((l) =>
      l.id === lineId
        ? {
            ...l,
            productId: null,
            isTracked: false,
            status: "untracked" as const,
          }
        : l
    );
    set({ lines: updated });
  },

  removeLine: (lineId: string) => {
    set({ lines: get().lines.filter((l) => l.id !== lineId) });
  },

  clearDraft: () => {
    set({
      lines: [],
      notes: "",
      slipNumber: generateSlipNumber(),
      isSubmitting: false,
    });
  },

  setNotes: (notes: string) => set({ notes }),
  setSlipNumber: (slipNumber: string) => set({ slipNumber }),
  setActiveSubView: (activeSubView: "counter" | "history") => set({ activeSubView }),
  setRecentSlips: (recentSlips: any[]) => set({ recentSlips }),
  setSelectedSlipForDetail: (selectedSlipForDetail: any | null) => set({ selectedSlipForDetail }),
  setIsSubmitting: (isSubmitting: boolean) => set({ isSubmitting }),
  addExtractedLines: (newLines: SaleDraftLine[]) => {
    set({ lines: [...get().lines, ...newLines] });
  },
}));
