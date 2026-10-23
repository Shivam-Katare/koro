import { create } from "zustand";

interface AssistantState {
  isOpen: boolean;
  selectedConversationId: string | null;
  pendingQuery: string;
  pendingStartLive: boolean;

  openDrawer: (opts?: {
    conversationId?: string;
    query?: string;
    startLive?: boolean;
  }) => void;
  closeDrawer: () => void;
  setIsOpen: (open: boolean) => void;
  clearPendingQuery: () => void;
  clearPendingStartLive: () => void;
  clearSelectedConversationId: () => void;
}

export const useAssistantStore = create<AssistantState>((set) => ({
  isOpen: false,
  selectedConversationId: null,
  pendingQuery: "",
  pendingStartLive: false,

  openDrawer: (opts) =>
    set({
      isOpen: true,
      selectedConversationId: opts?.conversationId || null,
      pendingQuery: opts?.query || "",
      pendingStartLive: Boolean(opts?.startLive),
    }),

  closeDrawer: () => set({ isOpen: false }),
  setIsOpen: (open) => set({ isOpen: open }),
  clearPendingQuery: () => set({ pendingQuery: "" }),
  clearPendingStartLive: () => set({ pendingStartLive: false }),
  clearSelectedConversationId: () => set({ selectedConversationId: null }),
}));
