import { create } from "zustand";
import type { Product } from "@/lib/supabase/types";
import {
  calculateSuggestedQuantity,
  isProductDepleted,
} from "@/lib/utils/restock-formatters";

export interface RestockOrderItem {
  product: Product;
  quantity: number;
}

export interface ItemArrivalTarget {
  orderItemId: string;
  orderId: string;
  orderNumber: string;
  orderDate: string;
  channel: string;
  distributorName?: string | null;
  product: Product;
  orderedQuantity: number;
  receivedQuantity: number;
}

interface RestockState {
  // Staging Draft
  orderItems: Record<string, RestockOrderItem>;
  distributorName: string;
  notes: string;
  searchQuery: string;
  filterTab: "depleted" | "all";
  isArrivalOpen: boolean;
  receivedQuantities: Record<string, number>;

  // Sub Tab Navigation
  activeSubTab: "draft" | "history";

  // Individual Item Arrival Modal
  selectedItemForArrival: ItemArrivalTarget | null;
  isItemArrivalOpen: boolean;

  // Individual Product Restock Slips View Modal
  selectedProductForSlips: Product | null;
  isItemSlipsModalOpen: boolean;

  // History Tab Filters
  historyFilterProductId: string;
  historyFilterStatus: "all" | "ordered" | "received" | "cancelled";
  historyFilterChannel: "all" | "whatsapp" | "copy_clipboard" | "manual";
  historySearchQuery: string;

  // Actions
  toggleProduct: (product: Product) => void;
  addCustomProductToOrder: (product: Product, quantity: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  removeProduct: (productId: string) => void;
  selectAllLowStock: (products: Product[]) => void;
  clearOrder: () => void;
  setDistributorName: (name: string) => void;
  setNotes: (notes: string) => void;
  setSearchQuery: (query: string) => void;
  setFilterTab: (tab: "depleted" | "all") => void;
  openArrivalDialog: () => void;
  closeArrivalDialog: () => void;
  setReceivedQuantity: (productId: string, quantity: number) => void;

  // Sub tab actions
  setActiveSubTab: (tab: "draft" | "history") => void;

  // Item Arrival Actions
  openItemArrivalModal: (target: ItemArrivalTarget) => void;
  closeItemArrivalModal: () => void;
  setItemReceivedQuantity: (quantity: number) => void;

  // Item Slips Actions
  openItemSlipsModal: (product: Product) => void;
  closeItemSlipsModal: () => void;

  // History Filter Actions
  setHistoryFilterProductId: (productId: string) => void;
  setHistoryFilterStatus: (status: "all" | "ordered" | "received" | "cancelled") => void;
  setHistoryFilterChannel: (channel: "all" | "whatsapp" | "copy_clipboard" | "manual") => void;
  setHistorySearchQuery: (query: string) => void;
}

export const useRestockStore = create<RestockState>((set, get) => ({
  orderItems: {},
  distributorName: "",
  notes: "",
  searchQuery: "",
  filterTab: "depleted",
  isArrivalOpen: false,
  receivedQuantities: {},

  activeSubTab: "draft",

  selectedItemForArrival: null,
  isItemArrivalOpen: false,

  selectedProductForSlips: null,
  isItemSlipsModalOpen: false,

  historyFilterProductId: "all",
  historyFilterStatus: "all",
  historyFilterChannel: "all",
  historySearchQuery: "",

  toggleProduct: (product: Product) => {
    const current = get().orderItems;
    if (current[product.id]) {
      const copy = { ...current };
      delete copy[product.id];
      set({ orderItems: copy });
    } else {
      const initialQty = calculateSuggestedQuantity(product);
      set({
        orderItems: {
          ...current,
          [product.id]: { product, quantity: initialQty },
        },
      });
    }
  },

  addCustomProductToOrder: (product: Product, quantity: number) => {
    const current = get().orderItems;
    const existing = current[product.id];
    const newQty = existing ? existing.quantity + quantity : Math.max(1, Math.floor(quantity) || 1);
    set({
      orderItems: {
        ...current,
        [product.id]: { product, quantity: newQty },
      },
    });
  },

  setQuantity: (productId: string, quantity: number) => {
    const validQty = Math.max(1, Math.floor(quantity) || 1);
    const item = get().orderItems[productId];
    if (!item) return;

    set({
      orderItems: {
        ...get().orderItems,
        [productId]: { ...item, quantity: validQty },
      },
    });
  },

  removeProduct: (productId: string) => {
    const copy = { ...get().orderItems };
    delete copy[productId];
    set({ orderItems: copy });
  },

  selectAllLowStock: (products: Product[]) => {
    const depleted = products.filter(isProductDepleted);
    const newItems: Record<string, RestockOrderItem> = { ...get().orderItems };

    for (const p of depleted) {
      if (!newItems[p.id]) {
        newItems[p.id] = {
          product: p,
          quantity: calculateSuggestedQuantity(p),
        };
      }
    }

    set({ orderItems: newItems });
  },

  clearOrder: () => {
    set({ orderItems: {}, distributorName: "", notes: "" });
  },

  setDistributorName: (distributorName: string) => set({ distributorName }),
  setNotes: (notes: string) => set({ notes }),
  setSearchQuery: (searchQuery: string) => set({ searchQuery }),
  setFilterTab: (filterTab: "depleted" | "all") => set({ filterTab }),

  openArrivalDialog: () => {
    const items = Object.values(get().orderItems);
    const receivedMap: Record<string, number> = {};
    items.forEach((item) => {
      receivedMap[item.product.id] = item.quantity;
    });
    set({ isArrivalOpen: true, receivedQuantities: receivedMap });
  },

  closeArrivalDialog: () => set({ isArrivalOpen: false }),

  setReceivedQuantity: (productId: string, quantity: number) => {
    const valid = Math.max(0, Math.floor(quantity) || 0);
    set({
      receivedQuantities: {
        ...get().receivedQuantities,
        [productId]: valid,
      },
    });
  },

  setActiveSubTab: (activeSubTab: "draft" | "history") => set({ activeSubTab }),

  openItemArrivalModal: (target: ItemArrivalTarget) =>
    set({ selectedItemForArrival: target, isItemArrivalOpen: true }),

  closeItemArrivalModal: () =>
    set({ selectedItemForArrival: null, isItemArrivalOpen: false }),

  setItemReceivedQuantity: (quantity: number) => {
    const current = get().selectedItemForArrival;
    if (!current) return;
    const valid = Math.max(0, Math.floor(quantity) || 0);
    set({ selectedItemForArrival: { ...current, receivedQuantity: valid } });
  },

  openItemSlipsModal: (product: Product) =>
    set({ selectedProductForSlips: product, isItemSlipsModalOpen: true }),

  closeItemSlipsModal: () =>
    set({ selectedProductForSlips: null, isItemSlipsModalOpen: false }),

  setHistoryFilterProductId: (historyFilterProductId: string) =>
    set({ historyFilterProductId }),

  setHistoryFilterStatus: (historyFilterStatus: "all" | "ordered" | "received" | "cancelled") =>
    set({ historyFilterStatus }),

  setHistoryFilterChannel: (
    historyFilterChannel: "all" | "whatsapp" | "copy_clipboard" | "manual"
  ) => set({ historyFilterChannel }),

  setHistorySearchQuery: (historySearchQuery: string) => set({ historySearchQuery }),
}));
