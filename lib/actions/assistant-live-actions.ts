"use server";

import { createClient } from "@/lib/supabase/server";
import { GoogleGenAI, Modality } from "@google/genai";
import {
  executeFindLocation,
  executeCheckStock,
  executeGetLowStock,
  executeGetPriceHistory,
  executeProposeStockAdjustment,
  executeProposeCreateProduct,
  executeGetInventorySummary,
  executeProposeUpdateLocation,
  executeProposeUpdatePrice,
  executeProposeDeleteProduct,
  executeProposeRecordSale,
  executeGetSalesHistory,
  executeGetRestockOrdersSummary,
  executeProposeRecordArrival,
} from "@/lib/assistant/assistant-db";

const LIVE_SYSTEM_INSTRUCTION = `You are "Koro", a fast, polite, and accurate female AI voice assistant for an Indian retail shopkeeper (kirana, cosmetics, general store, pharmacy, stationery).

Core Speaking Rules:
1. Native Multilingual Spoken Responses:
   - If the user speaks in Hindi, reply in clear, natural spoken Hindi.
   - If the user speaks in English, reply in natural English.
   - If the user speaks in Hinglish, reply in everyday Hinglish.
2. Rush-Hour Brevity (Very Important):
   - Shopkeepers are busy serving customers at the counter. Keep answers direct and to the point (1 or 2 short sentences maximum).
   - NEVER give long preambles, greetings, or repetitive intros. Get straight to the answer.
   - Example (Location): "Lakme is in Drawer 2 on the left." or "Lakme counter ke paas 2nd drawer mein rakha hai."
   - Example (Stock): "You have 7 units of Lakme in stock." or "Lakme ke 7 piece bache hain."
   - Example (Price): "Lakme is 150 rupees." or "Lakme ka rate 150 rupaye hai."
3. Mandatory Tool Calling:
   - To find an item location: ALWAYS call find_product_location.
   - To check quantity or stock status: ALWAYS call check_product_stock.
   - To find low or out of stock items: ALWAYS call get_low_stock_products.
   - To check price or past rates: ALWAYS call get_product_price_history.
   - To add, deduct, or adjust stock: ALWAYS call propose_stock_adjustment. Never update stock silently.
4. Total Products vs Stock Units (CRITICAL RULE):
   - When asked "how many products do I have in my total shop" / "total products kitne hain" / "shop mein kitna samaan hai":
     ALWAYS call get_store_inventory_summary.
   - DO NOT confuse distinct products with stock units!
     For example: If the shop has Nivea Cream (5 in stock) and Lakme (2 in stock), there are only 2 distinct PRODUCTS in the catalog, but 7 total UNITS/PIECES in stock.
   - State clearly: "Aapki shop mein total [X] products hain (aur [Y] units ka stock hai)." (In English: "You have [X] distinct products in your shop with a total stock of [Y] units.")
5. Updating or Adding Product Location (DO NOT CREATE DUPLICATE PRODUCT):
   - When the user asks to update, assign, add, put, or change an item's location (e.g. "Add a Nivea cream to the location of shelf 2", "Put Nivea cream at shelf 2", "Update Lakme location to Drawer 3", "Lakme location Shelf 2 kar do"):
     ALWAYS call propose_update_product_location. NEVER call propose_create_product!
   - Say: "[productName] ki nayi location ke liye details screen par open kar di hain. Ek baar check karke confirm kar lijiye."
6. Updating or Adding Product Price (DO NOT CREATE DUPLICATE PRODUCT):
   - When the user asks to update, set, add, or change an item's selling price (e.g. "Change the price of Nivea cream to 50", "Add price of 50 to Nivea cream", "Lakme ka price 150 kar do", "Update price of Lakme to 180"):
     ALWAYS call propose_update_product_price. NEVER call propose_create_product!
   - Say: "[productName] ka naya price set karne ke liye details screen par open kar di hain. Ek baar check karke confirm kar lijiye."
7. Adding Brand-New Products:
   - ONLY call propose_create_product if the user explicitly wants to add an unlisted, brand-new product to the catalog (e.g. "Add new product Dettol soap", "Naya product XYZ add karo").
   - NEVER call propose_create_product when the shopkeeper is simply telling where an item is stored or what price it has!
   - When calling propose_create_product, say politely: "[productName] add karne ke liye details taiyaar hain. Ek baar check kar lijiye."
8. Recording Counter Sales & Slips:
   - When the user says they sold items (e.g. "Today I sold 5 Lakme items", "Sold 5 Lakme at 50", "5 Lakme beche", "Maine abhi-abhi Bahubali ki lal chudi bechi hai. Use sale me add kar"):
     ALWAYS call propose_record_sale.
     CRITICAL FOR UNLINKED / CUSTOM ITEMS:
     If the item is not found in the inventory catalog, DO NOT REFUSE IT! The store explicitly supports unlinked / custom items. propose_record_sale will generate an unlinked sales slip confirmation card immediately without deducting stock.
     Say: "[Product] ka sale slip screen par create kar diya hai. Check karke confirm kar dijiye."
9. Sales History & Earnings Lookup:
   - When the user asks how much money they earned, how much sales happened on a date, or asks for recent slips (e.g. "On 20th January 2026 how much did I earn", "today's sales", "aaj kitni kamai hui"):
     ALWAYS call query_sales_history.
     Answer directly with total earnings, bill count, and units sold.
10. Restock Orders, Status & Queries:
    - When user asks about cancelled orders, waiting orders, delivered orders, unit counts, or whether they need to place a new order:
      ALWAYS call query_restock_orders.
      Give direct, short answers.
11. Restock Arrival:
    - When user says order or delivery arrived (e.g. "Lakme restock aa gaya", "Order PO-123 arrived"):
      ALWAYS call propose_record_order_arrival.
12. Deleting Products:
    - When user asks to delete an item (e.g. "Delete product Lakme", "Lakme delete kar do"):
      ALWAYS call propose_delete_product. Never delete silently.
13. Ambiguity Resolution:
    - If multiple matching products are found, the tools return distinct options. Ask the shopkeeper politely which specific product they meant before proceeding.`;

const LIVE_TOOLS = [
  {
    functionDeclarations: [
      {
        name: "find_product_location",
        description: "Find a product and its physical shelf/drawer storage location in the store.",
        parameters: {
          type: "OBJECT",
          properties: {
            productName: {
              type: "STRING",
              description: "The name or keyword of the product (e.g. Lakme, Tata Tea, eyeliner, shampoo)",
            },
          },
          required: ["productName"],
        },
      },
      {
        name: "check_product_stock",
        description: "Check the current stock quantity and health status of a product.",
        parameters: {
          type: "OBJECT",
          properties: {
            productName: {
              type: "STRING",
              description: "The name or keyword of the product",
            },
          },
          required: ["productName"],
        },
      },
      {
        name: "get_low_stock_products",
        description: "List all products in the shop that are low on stock or completely depleted.",
        parameters: {
          type: "OBJECT",
          properties: {},
        },
      },
      {
        name: "get_product_price_history",
        description: "Retrieve recorded selling price, cost price, and sales price history for a product.",
        parameters: {
          type: "OBJECT",
          properties: {
            productName: {
              type: "STRING",
              description: "The name of the product",
            },
          },
          required: ["productName"],
        },
      },
      {
        name: "propose_stock_adjustment",
        description: "Propose an inventory stock change (add or deduct units). Never updates stock directly without shopkeeper confirmation.",
        parameters: {
          type: "OBJECT",
          properties: {
            productName: {
              type: "STRING",
              description: "Product name to adjust",
            },
            quantityDelta: {
              type: "INTEGER",
              description: "Quantity change (e.g. +10 to add stock, -2 to deduct)",
            },
            reason: {
              type: "STRING",
              description: "Reason for adjustment (e.g. counter sale, delivery arrival, damaged)",
            },
          },
          required: ["productName", "quantityDelta"],
        },
      },
      {
        name: "propose_create_product",
        description: "Propose creating a brand-new product in the store inventory ONLY when an item does NOT exist yet, or user explicitly says 'Add new product [name]'.",
        parameters: {
          type: "OBJECT",
          properties: {
            productName: {
              type: "STRING",
              description: "The name of the new product (e.g. Nivea cream, Lakme Eyeconic Kajal)",
            },
            openingStock: {
              type: "INTEGER",
              description: "Initial stock quantity (default 1 if not specified)",
            },
            sellingPrice: {
              type: "NUMBER",
              description: "Selling price in rupees if mentioned",
            },
            costPrice: {
              type: "NUMBER",
              description: "Cost price in rupees if mentioned",
            },
            category: {
              type: "STRING",
              description: "Category of product",
            },
            storageLocation: {
              type: "STRING",
              description: "Physical storage location, shelf, or drawer if mentioned",
            },
          },
          required: ["productName"],
        },
      },
      {
        name: "get_store_inventory_summary",
        description: "Count total distinct products vs total stock units in shop catalog, and check low stock items.",
        parameters: {
          type: "OBJECT",
          properties: {},
        },
      },
      {
        name: "propose_update_product_location",
        description: "Propose updating or assigning the shelf/drawer storage location of a product.",
        parameters: {
          type: "OBJECT",
          properties: {
            productName: {
              type: "STRING",
              description: "The name of the product to update",
            },
            newLocation: {
              type: "STRING",
              description: "The new shelf, drawer, or storage rack location",
            },
          },
          required: ["productName", "newLocation"],
        },
      },
      {
        name: "propose_update_product_price",
        description: "Propose updating or setting the selling price of a product.",
        parameters: {
          type: "OBJECT",
          properties: {
            productName: {
              type: "STRING",
              description: "The name of the product to update",
            },
            newPrice: {
              type: "NUMBER",
              description: "The new selling price in rupees",
            },
          },
          required: ["productName", "newPrice"],
        },
      },
      {
        name: "propose_delete_product",
        description: "Propose permanently deleting a product from inventory catalog with confirmation.",
        parameters: {
          type: "OBJECT",
          properties: {
            productName: {
              type: "STRING",
              description: "The name of the product to delete",
            },
          },
          required: ["productName"],
        },
      },
      {
        name: "propose_record_sale",
        description: "Propose recording a counter sale of products (e.g. 'Today I sold 5 Lakme items at 50', 'Maine Bahubali ki lal chudi bechi hai'). Also supports unlinked/custom items that are not yet in the inventory catalog (e.g. bangles, custom goods, loose items) without refusing.",
        parameters: {
          type: "OBJECT",
          properties: {
            productName: {
              type: "STRING",
              description: "Product sold",
            },
            quantity: {
              type: "INTEGER",
              description: "Number of units sold",
            },
            unitPrice: {
              type: "NUMBER",
              description: "Price per unit in rupees if mentioned",
            },
            notes: {
              type: "STRING",
              description: "Optional notes",
            },
          },
          required: ["productName", "quantity"],
        },
      },
      {
        name: "query_sales_history",
        description: "Lookup past sales slips and total earnings/revenue for a specific date or period (e.g. 'On 20th January 2026 how much did I earn', 'today sales', 'how much sales happened').",
        parameters: {
          type: "OBJECT",
          properties: {
            dateQuery: {
              type: "STRING",
              description: "Target date or period (e.g. '20th January 2026', '2026-01-20', 'today', 'yesterday')",
            },
          },
        },
      },
      {
        name: "query_restock_orders",
        description: "Query restock orders, past purchase orders, cancelled orders, waiting/pending orders, delivered orders, unit counts, and whether new restock orders are needed.",
        parameters: {
          type: "OBJECT",
          properties: {
            queryType: {
              type: "STRING",
              description: "Type of inquiry: 'cancelled', 'waiting', 'delivered', 'needs_reorder', or 'all'",
            },
          },
        },
      },
      {
        name: "propose_record_order_arrival",
        description: "Propose marking a restock delivery/order item as arrived with confirmation, adding the arrived units to stock.",
        parameters: {
          type: "OBJECT",
          properties: {
            productName: {
              type: "STRING",
              description: "The name of the product that arrived",
            },
            orderNumber: {
              type: "STRING",
              description: "Optional restock order/slip number (e.g. PO-260120-1234)",
            },
            quantity: {
              type: "INTEGER",
              description: "Units received",
            },
          },
        },
      },
    ],
  },
];


export async function getLiveSessionTokenAction(shopId: string) {
  if (!shopId) {
    return { success: false, error: "Shop ID is required" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Please sign in to start a live session" };
  }

  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  if (!apiKey) {
    return { success: false, error: "GEMINI_API_KEY is not configured" };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const expireTime = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    const token = await ai.authTokens.create({
      config: {
        uses: 1,
        expireTime,
        liveConnectConstraints: {
          model: "models/gemini-3.8-live",
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: "Aoede", // Female voice by default
                },
              },
            },
            systemInstruction: {
              parts: [{ text: LIVE_SYSTEM_INSTRUCTION }],
            },
            tools: LIVE_TOOLS as any,
          },
        },
      },
    });

    return {
      success: true,
      token: token.name,
      model: "models/gemini-3.8-live",
    };
  } catch (err: unknown) {
    console.error("Failed to generate live session ephemeral token:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to initiate Gemini Live session",
    };
  }
}

export async function executeLiveToolCallAction(input: {
  shopId: string;
  toolName: string;
  args: Record<string, any>;
}) {
  const { shopId, toolName, args } = input;
  if (!shopId || !toolName) {
    return { success: false, error: "Missing shopId or toolName" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    let toolResult: any = null;

    if (toolName === "find_product_location") {
      toolResult = await executeFindLocation(supabase, shopId, args.productName || "");
    } else if (toolName === "check_product_stock") {
      toolResult = await executeCheckStock(supabase, shopId, args.productName || "");
    } else if (toolName === "get_low_stock_products") {
      toolResult = await executeGetLowStock(supabase, shopId);
    } else if (toolName === "get_product_price_history") {
      toolResult = await executeGetPriceHistory(supabase, shopId, args.productName || "");
    } else if (toolName === "propose_stock_adjustment") {
      toolResult = await executeProposeStockAdjustment(
        supabase,
        shopId,
        args.productName || "",
        Number(args.quantityDelta) || 0,
        args.reason
      );
    } else if (toolName === "propose_create_product") {
      toolResult = await executeProposeCreateProduct(supabase, shopId, {
        productName: args.productName || "",
        openingStock: args.openingStock !== undefined ? Number(args.openingStock) : 1,
        sellingPrice: args.sellingPrice !== undefined ? Number(args.sellingPrice) : undefined,
        costPrice: args.costPrice !== undefined ? Number(args.costPrice) : undefined,
        category: args.category,
        storageLocation: args.storageLocation,
        reason: "voice_assistant_new_product",
      });
    } else if (toolName === "get_store_inventory_summary") {
      toolResult = await executeGetInventorySummary(supabase, shopId);
    } else if (toolName === "propose_update_product_location") {
      toolResult = await executeProposeUpdateLocation(
        supabase,
        shopId,
        args.productName || "",
        args.newLocation || ""
      );
    } else if (toolName === "propose_update_product_price") {
      toolResult = await executeProposeUpdatePrice(
        supabase,
        shopId,
        args.productName || "",
        Number(args.newPrice) || 0
      );
    } else if (toolName === "propose_delete_product") {
      toolResult = await executeProposeDeleteProduct(
        supabase,
        shopId,
        args.productName || ""
      );
    } else if (toolName === "propose_record_sale") {
      toolResult = await executeProposeRecordSale(supabase, shopId, {
        productName: args.productName || "",
        quantity: Number(args.quantity) || 1,
        unitPrice: args.unitPrice !== undefined ? Number(args.unitPrice) : undefined,
        notes: args.notes,
      });
    } else if (toolName === "query_sales_history") {
      toolResult = await executeGetSalesHistory(
        supabase,
        shopId,
        args.dateQuery || ""
      );
    } else if (toolName === "query_restock_orders") {
      toolResult = await executeGetRestockOrdersSummary(
        supabase,
        shopId,
        args.queryType || ""
      );
    } else if (toolName === "propose_record_order_arrival") {
      toolResult = await executeProposeRecordArrival(supabase, shopId, {
        productName: args.productName,
        orderNumber: args.orderNumber,
        quantity: args.quantity ? Number(args.quantity) : undefined,
      });
    } else {
      return { success: false, error: `Unknown tool: ${toolName}` };
    }


    return {
      success: true,
      response: {
        content: toolResult.content,
        data: toolResult.structuredData || null,
        pendingAction: toolResult.pendingAction || null,
      },
      pendingAction: toolResult.pendingAction || null,
      speechText: toolResult.content,
      taskType: toolResult.taskType,
    };
  } catch (err: unknown) {
    console.error(`Error executing live tool ${toolName}:`, err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to execute tool",
    };
  }
}

export async function saveLiveTurnAction(input: {
  shopId: string;
  conversationId?: string;
  userText?: string;
  assistantText?: string;
  taskType?: string;
  pendingAction?: any;
}) {
  const { shopId, conversationId, userText, assistantText, taskType, pendingAction } = input;
  if (!shopId) return { success: false };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Unauthorized" };

  try {
    if (userText?.trim()) {
      await (supabase.from("assistant_messages") as any).insert({
        shop_id: shopId,
        user_id: user.id,
        role: "user",
        content: userText.trim(),
        task_type: "general",
        metadata: {
          conversationId: conversationId || null,
          liveSession: true,
        },
      });
    }

    if (assistantText?.trim()) {
      await (supabase.from("assistant_messages") as any).insert({
        shop_id: shopId,
        user_id: user.id,
        role: "assistant",
        content: assistantText.trim(),
        task_type: taskType || "general",
        metadata: {
          conversationId: conversationId || null,
          liveSession: true,
          pendingAction: pendingAction || null,
        },
      });
    }

    return { success: true };
  } catch (err) {
    console.error("Failed to save live turn:", err);
    return { success: false };
  }
}
