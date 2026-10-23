"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { InventoryStats } from "@/components/inventory/inventory-stats";
import { AddProductDialog } from "@/components/inventory/add-product-dialog";
import { HomeRemindersFeed } from "@/components/dashboard/home-reminders-feed";
import { HomeHero } from "@/components/dashboard/home-hero";
import { KoroFace } from "@/components/brand/koro-face";
import { useDashboardNav } from "@/lib/hooks/use-dashboard-nav";
import { useAssistantStore } from "@/lib/store/use-assistant-store";
import { computeGentleReminders } from "@/lib/utils/home-reminders";
import { Button } from "@/components/ui/button";
import {
  PlusCircle,
  MapPin,
  Package,
  AlertTriangle,
  IndianRupee,
} from "lucide-react";
import type {
  Shop,
  Profile,
  Product,
  RestockOrder,
  StockMovement,
  SalesSlip,
} from "@/lib/supabase/types";
import toast from "react-hot-toast";

interface HomeViewProps {
  shop: Shop | null;
  profile: Profile | null;
  products: Product[];
  restockOrders?: RestockOrder[];
  stockMovements?: StockMovement[];
  salesSlips?: SalesSlip[];
}

export function HomeView({
  shop,
  profile,
  products,
  restockOrders = [],
  stockMovements = [],
  salesSlips = [],
}: HomeViewProps) {
  const { setActiveTab } = useDashboardNav();
  const { openDrawer } = useAssistantStore();

  // Home chat bar state
  const [homeQuery, setHomeQuery] = useState("");
  const [isHomeDictating, setIsHomeDictating] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const homeRecognitionRef = useRef<any>(null);

  const sampleProductName = products[0]?.name || "Lakme";
  const firstName = (profile?.full_name || "Owner").trim().split(/\s+/)[0] || "Owner";

  // Quick suggestion prompts (Notion AI style)
  const quickChips = [
    { label: `Where is ${sampleProductName}?`, query: `Where is ${sampleProductName}?`, icon: MapPin },
    { label: `Stock of ${sampleProductName}`, query: `Stock of ${sampleProductName}`, icon: Package },
    { label: "What is low on stock?", query: "What is low on stock?", icon: AlertTriangle },
    { label: `Price of ${sampleProductName}`, query: `Price of ${sampleProductName}`, icon: IndianRupee },
  ];

  // Initialize Speech Recognition for Home Chat Bar Dictation
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = "en-IN";

        recognition.onstart = () => {
          setIsHomeDictating(true);
        };

        recognition.onresult = (event: any) => {
          let currentTranscript = "";
          for (let i = 0; i < event.results.length; ++i) {
            currentTranscript += event.results[i][0].transcript;
          }
          if (currentTranscript) {
            setHomeQuery(currentTranscript);
          }
        };

        recognition.onerror = (event: any) => {
          console.warn("Home speech recognition error:", event.error);
          setIsHomeDictating(false);
          if (event.error === "not-allowed") {
            toast.error("Microphone permission denied.");
          }
        };

        recognition.onend = () => {
          setIsHomeDictating(false);
        };

        homeRecognitionRef.current = recognition;
      } else {
        setSpeechSupported(false);
      }
    }
  }, []);

  const toggleHomeDictate = () => {
    if (!speechSupported) {
      toast("Voice dictation is not supported in this browser.", { icon: "ℹ️" });
      return;
    }

    if (isHomeDictating) {
      homeRecognitionRef.current?.stop();
      setIsHomeDictating(false);
    } else {
      try {
        homeRecognitionRef.current?.start();
      } catch (err) {
        console.error("Failed to start speech recognition:", err);
      }
    }
  };

  // Submit query from Home chat bar -> opens Left Drawer in a fresh conversation
  const handleHomeSubmit = (queryOverride?: string) => {
    const q = (queryOverride || homeQuery).trim();
    if (!q) return;

    if (isHomeDictating) {
      homeRecognitionRef.current?.stop();
      setIsHomeDictating(false);
    }

    openDrawer({ query: q });
    setHomeQuery("");
  };

  // Launch Go Live from Home -> opens Left Drawer in a fresh conversation and starts live session
  const handleHomeGoLive = () => {
    if (isHomeDictating) {
      homeRecognitionRef.current?.stop();
      setIsHomeDictating(false);
    }
    openDrawer({ startLive: true });
  };

  const reminders = useMemo(() => {
    return computeGentleReminders({
      products,
      restockOrders,
      stockMovements,
      salesSlips,
      shopCategory: shop?.category,
    });
  }, [products, restockOrders, stockMovements, salesSlips, shop?.category]);

  const hero = (
    <HomeHero
      firstName={firstName}
      query={homeQuery}
      onQueryChange={setHomeQuery}
      onSubmit={handleHomeSubmit}
      onGoLive={handleHomeGoLive}
      onDictate={toggleHomeDictate}
      isDictating={isHomeDictating}
      onOpenChat={() => openDrawer()}
      chips={quickChips}
    />
  );

  // Empty store state
  if (products.length === 0) {
    return (
      <div className="space-y-8">
        {hero}

        {/* Action card for empty state */}
        <div className="flex flex-col items-center gap-5 rounded-3xl border border-dashed border-border bg-card/60 p-8 text-center sm:p-10">
          <KoroFace size={72} tone="sky" />
          <div className="space-y-2">
            <h2 className="font-heading text-2xl font-bold text-foreground">No products yet</h2>
            <p className="mx-auto max-w-md text-base text-muted-foreground">
              Add your first few products, or tap the big mic and speak to set up your inventory automatically.
            </p>
          </div>
          {shop && (
            <AddProductDialog
              shopId={shop.id}
              defaultCategory={shop.category}
              trigger={
                <Button className="h-12 cursor-pointer gap-2 px-6 text-base font-semibold shadow-xs">
                  <PlusCircle className="h-5 w-5" />
                  <span>Add your first product</span>
                </Button>
              }
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {hero}

      {/* Reminders */}
      <HomeRemindersFeed reminders={reminders} onNavigateTab={setActiveTab} />
    </div>
  );
}
