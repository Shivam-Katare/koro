"use server";

import { createClient } from "@/lib/supabase/server";
import {
  queryAssistantSchema,
  confirmAssistantActionSchema,
  type QueryAssistantInput,
  type ConfirmAssistantActionInput,
} from "@/lib/validations/assistant";
import { GoogleGenAI, Type } from "@google/genai";
import { revalidatePath } from "next/cache";
import {
  recordItemArrivalAction,
  createRestockOrderAction,
  quickAddRestockItemAction,
} from "@/lib/actions/restock-actions";

export interface AssistantResponsePayload {
  role: "assistant";
  content: string;
  taskType:
    | "find_product"
    | "check_stock"
    | "low_stock"
    | "price_history"
    | "adjust_stock"
    | "create_product"
    | "update_location"
    | "update_price"
    | "delete_product"
    | "record_sale"
    | "sales_history"
    | "restock_orders"
    | "record_order_arrival"
    | "inventory_summary"
    | "daily_reminders"
    | "create_restock_order"
    | "recent_products"
    | "seasonal_market_trends"
    | "general";
  structuredData?: any;
  pendingAction?: AssistantPendingAction | null;
  pendingActions?: AssistantPendingAction[] | null;
}

import {
  type AssistantPendingAction,
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
  executeUpdateSlipNote,
  executeGetSalesHistory,
  executeGetRestockOrdersSummary,
  executeProposeRecordArrival,
  executeGetDailyReminders,
  executeProposeCreateRestockOrder,
  executeGetRecentAddedProducts,
  executeGetSeasonalMarketTrends,
  matchLocalIntent,
} from "@/lib/assistant/assistant-db";



// -------------------------------------------------------------
// Primary Assistant Query Server Action
// -------------------------------------------------------------
export async function queryAssistantAction(input: QueryAssistantInput) {
  const parseResult = queryAssistantSchema.safeParse(input);
  if (!parseResult.success) {
    return {
      success: false,
      error: parseResult.error.issues[0]?.message || "Invalid query input",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { shopId, query, conversationId } = parseResult.data;
  const isDemo = shopId === "1bd46074-6e69-4b38-83c9-d25a2999d011";

  if (!user && !isDemo) {
    return { success: false, error: "Please sign in to talk to your assistant" };
  }

  // 1. Record user message in Supabase
  await (supabase.from("assistant_messages") as any).insert({
    shop_id: shopId,
    user_id: user?.id || null,
    role: "user",
    content: query,
    task_type: "general",
    metadata: {
      conversationId: conversationId || null,
    },
  });

  // Extract recent conversational context & last focused product
  let lastFocusedProduct: string | undefined = undefined;
  const recentEvents: string[] = [];
  let loadedRecentMsgs: any[] = [];
  try {
    const { data: recentMsgs } = await (supabase.from("assistant_messages") as any)
      .select("role, metadata, content, task_type, created_at")
      .eq("shop_id", shopId)
      .order("created_at", { ascending: false })
      .limit(8);

    if (recentMsgs && recentMsgs.length > 0) {
      loadedRecentMsgs = recentMsgs;
      for (const m of recentMsgs) {
        const meta = (m.metadata as any) || {};
        if (!lastFocusedProduct) {
          if (meta.lastFocusedProduct) {
            lastFocusedProduct = meta.lastFocusedProduct;
          } else if (meta.pendingAction?.productName) {
            lastFocusedProduct = meta.pendingAction.productName;
          } else if (meta.productName) {
            lastFocusedProduct = meta.productName;
          } else if (meta.structuredData?.product?.name) {
            lastFocusedProduct = meta.structuredData.product.name;
          } else if (meta.structuredData?.matchedProduct?.name) {
            lastFocusedProduct = meta.structuredData.matchedProduct.name;
          }
        }

        const pending = meta.pendingAction;
        if (recentEvents.length < 6) {
          if (pending?.actionType === "record_sale" || m.task_type === "record_sale") {
            recentEvents.push(`Created sales slip for "${pending?.productName || meta.productName || "items"}"`);
          } else if (pending?.actionType === "create_restock_order" || m.task_type === "create_restock_order") {
            recentEvents.push(`Drafted restock order for "${pending?.productName || meta.productName || "items"}"`);
          } else if (pending?.actionType === "record_order_arrival" || m.task_type === "record_order_arrival") {
            recentEvents.push(`Marked restock delivery as arrived for "${pending?.productName || meta.productName || "delivery"}"`);
          } else if (pending?.actionType === "update_product_location") {
            recentEvents.push(`Updated location for "${pending?.productName}" to "${pending?.newLocation}"`);
          } else if (pending?.actionType === "update_product_price") {
            recentEvents.push(`Updated price for "${pending?.productName}" to ₹${pending?.newPrice}`);
          } else if (m.task_type === "daily_reminders") {
            recentEvents.push(`Checked daily reminders`);
          }
        }
      }
    }
  } catch (ctxErr) {
    // Non-blocking
  }

  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  // Check fast local intent first (saves 100% of LLM tokens for standard phrases)
  const localMatch = matchLocalIntent(query, lastFocusedProduct);
  if (localMatch) {
    let resultPayload: AssistantResponsePayload | null = null;

    if (localMatch.intent === "find_location" && localMatch.target) {
      const res = await executeFindLocation(supabase, shopId, localMatch.target);
      resultPayload = { role: "assistant", ...res };
    } else if (localMatch.intent === "check_stock" && localMatch.target) {
      const res = await executeCheckStock(supabase, shopId, localMatch.target);
      resultPayload = { role: "assistant", ...res };
    } else if (localMatch.intent === "low_stock") {
      const res = await executeGetLowStock(supabase, shopId);
      resultPayload = { role: "assistant", ...res };
    } else if (localMatch.intent === "price_history" && localMatch.target) {
      const res = await executeGetPriceHistory(supabase, shopId, localMatch.target);
      resultPayload = { role: "assistant", ...res };
    } else if (localMatch.intent === "adjust_stock" && localMatch.delta && localMatch.target) {
      const res = await executeProposeStockAdjustment(
        supabase,
        shopId,
        localMatch.target,
        localMatch.delta
      );
      resultPayload = { role: "assistant", ...res };
    } else if (localMatch.intent === "create_product" && localMatch.target) {
      const res = await executeProposeCreateProduct(supabase, shopId, {
        productName: localMatch.target,
        openingStock: 1,
      });
      resultPayload = { role: "assistant", ...res };
    } else if (localMatch.intent === "inventory_summary") {
      const res = await executeGetInventorySummary(supabase, shopId);
      resultPayload = { role: "assistant", ...res };
    } else if (localMatch.intent === "update_location" && localMatch.target) {
      const res = await executeProposeUpdateLocation(
        supabase,
        shopId,
        localMatch.target,
        (localMatch as any).newLocation || ""
      );
      resultPayload = { role: "assistant", ...res };
    } else if (localMatch.intent === "update_price" && localMatch.target) {
      const res = await executeProposeUpdatePrice(
        supabase,
        shopId,
        localMatch.target,
        (localMatch as any).newPrice || 0
      );
      resultPayload = { role: "assistant", ...res };
    } else if (localMatch.intent === "delete_product" && localMatch.target) {
      const res = await executeProposeDeleteProduct(supabase, shopId, localMatch.target);
      resultPayload = { role: "assistant", ...res };
    } else if (localMatch.intent === "record_sale" && (localMatch.target || (localMatch as any).items)) {
      const res = await executeProposeRecordSale(supabase, shopId, {
        items: (localMatch as any).items,
        productName: (localMatch as any).items ? undefined : localMatch.target,
        quantity: (localMatch as any).quantity,
        unitPrice: (localMatch as any).unitPrice,
      });
      resultPayload = { role: "assistant", ...res };
    } else if (localMatch.intent === "sales_history") {
      const res = await executeGetSalesHistory(
        supabase,
        shopId,
        (localMatch as any).dateQuery,
        {
          unitPrice: (localMatch as any).unitPrice,
          itemName: (localMatch as any).itemName,
        }
      );
      resultPayload = { role: "assistant", ...res };
    } else if (localMatch.intent === "update_slip_note") {
      const res = await executeUpdateSlipNote(supabase, shopId, {
        note: (localMatch as any).note,
        slipNumber: (localMatch as any).slipNumber,
        itemHint: (localMatch as any).itemHint,
      });
      resultPayload = { role: "assistant", ...res };
    } else if (localMatch.intent === "restock_orders") {
      const res = await executeGetRestockOrdersSummary(supabase, shopId, (localMatch as any).queryType);
      resultPayload = { role: "assistant", ...res };
    } else if (localMatch.intent === "daily_reminders") {
      const res = await executeGetDailyReminders(supabase, shopId);
      resultPayload = { role: "assistant", ...res };
    } else if (localMatch.intent === "recent_products") {
      const res = await executeGetRecentAddedProducts(supabase, shopId, 5);
      resultPayload = { role: "assistant", ...res };
    } else if (localMatch.intent === "create_restock_order" && ((localMatch as any).items?.length || (localMatch as any).target)) {
      const items = (localMatch as any).items || [
        { productName: (localMatch as any).target, quantity: (localMatch as any).quantity || 10 },
      ];
      const res = await executeProposeCreateRestockOrder(supabase, shopId, {
        items,
        distributorName: (localMatch as any).distributorName,
      });
      resultPayload = { role: "assistant", ...res };
    }

    if (resultPayload) {
      const focusedProd =
        resultPayload.pendingAction?.productName ||
        resultPayload.structuredData?.product?.name ||
        resultPayload.structuredData?.matchedProduct?.name ||
        lastFocusedProduct ||
        null;

      // Save assistant response to DB
      await (supabase.from("assistant_messages") as any).insert({
        shop_id: shopId,
        user_id: user?.id || null,
        role: "assistant",
        content: resultPayload.content,
        task_type: resultPayload.taskType,
        metadata: {
          conversationId: conversationId || null,
          structuredData: resultPayload.structuredData || null,
          pendingAction: resultPayload.pendingAction || null,
          lastFocusedProduct: focusedProd,
        },
      });

      return { success: true, message: resultPayload };
    }
  }

  // 2. If no local match, execute via Gemini API with Tool Calling
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });

      const tools: any = [
        {
          functionDeclarations: [
            {
              name: "find_product_location",
              description: "Find a product and its physical shelf/drawer storage location in the shop. Works with brand, item name, categories, varieties, and Indian colloquial terms (e.g. Kaveri Mehndi, chudi, earrings, kangan, bangles, pearl drop, bindi).",
              parameters: {
                type: Type.OBJECT,
                properties: {
                  productName: {
                    type: Type.STRING,
                    description: "The name, brand, variety, or Indian colloquial term of the product (e.g. Kaveri Mehndi, chudi, earrings, kangan, bangles, pearl drop, eyeliner)",
                  },
                },
                required: ["productName"],
              },
            },
            {
              name: "check_product_stock",
              description: "Check the current stock quantity and status of a product or category varieties.",
              parameters: {
                type: Type.OBJECT,
                properties: {
                  productName: {
                    type: Type.STRING,
                    description: "The name, brand, variety, or Indian colloquial term of the product (e.g. Kaveri Mehndi, chudi, earrings, kangan, bangles, pearl drop)",
                  },
                },
                required: ["productName"],
              },
            },
            {
              name: "get_low_stock_products",
              description: "List all products in the shop that are low on stock or completely out of stock",
              parameters: {
                type: Type.OBJECT,
                properties: {},
              },
            },
            {
              name: "get_product_price_history",
              description: "Retrieve recorded selling price, cost price, and sales price history for a product",
              parameters: {
                type: Type.OBJECT,
                properties: {
                  productName: {
                    type: Type.STRING,
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
                type: Type.OBJECT,
                properties: {
                  productName: {
                    type: Type.STRING,
                    description: "Product name to adjust",
                  },
                  quantityDelta: {
                    type: Type.INTEGER,
                    description: "Quantity change (e.g. +10 to add stock, -2 to deduct)",
                  },
                  reason: {
                    type: Type.STRING,
                    description: "Reason for adjustment (e.g. counter sale, delivery arrival, damaged)",
                  },
                },
                required: ["productName", "quantityDelta"],
              },
            },
            {
              name: "propose_create_product",
              description: "Propose adding a brand new product to store catalog when item is not found or shopkeeper asks to add it. Never creates without confirmation.",
              parameters: {
                type: Type.OBJECT,
                properties: {
                  productName: {
                    type: Type.STRING,
                    description: "The name of the new product",
                  },
                  openingStock: {
                    type: Type.INTEGER,
                    description: "Initial stock quantity (default 1)",
                  },
                  sellingPrice: {
                    type: Type.NUMBER,
                    description: "Selling price in rupees if mentioned",
                  },
                  costPrice: {
                    type: Type.NUMBER,
                    description: "Cost price in rupees if mentioned",
                  },
                  category: {
                    type: Type.STRING,
                    description: "Category of product",
                  },
                  storageLocation: {
                    type: Type.STRING,
                    description: "Physical shelf, drawer, or storage rack",
                  },
                },
                required: ["productName"],
              },
            },
            {
              name: "get_store_inventory_summary",
              description: "Count distinct products vs total stock units in store. Crucial: distinguish total catalog products (distinct items) from total units in stock.",
              parameters: {
                type: Type.OBJECT,
                properties: {},
              },
            },
            {
              name: "get_recent_added_products",
              description: "Lookup the most recent products added to the shop catalog (e.g. 'What is the recent product I added', 'Abhi kaunsa naya product add kiya', 'What product did I add 2 days ago', 'Latest added items'). Returns newly added products sorted by newest first with relative time, price, stock, and storage location.",
              parameters: {
                type: Type.OBJECT,
                properties: {
                  limit: {
                    type: Type.INTEGER,
                    description: "Number of recent products to return (default 5, max 20)",
                  },
                  category: {
                    type: Type.STRING,
                    description: "Optional category filter (e.g. 'cosmetics', 'kirana', 'jewelry')",
                  },
                },
              },
            },
            {
              name: "propose_update_product_location",
              description: "Propose updating or assigning the shelf/drawer storage location of an existing product with confirmation.",
              parameters: {
                type: Type.OBJECT,
                properties: {
                  productName: {
                    type: Type.STRING,
                    description: "The product name to update",
                  },
                  newLocation: {
                    type: Type.STRING,
                    description: "The new shelf or storage location",
                  },
                },
                required: ["productName", "newLocation"],
              },
            },
            {
              name: "propose_update_product_price",
              description: "Propose updating or assigning the selling price of an existing product with confirmation.",
              parameters: {
                type: Type.OBJECT,
                properties: {
                  productName: {
                    type: Type.STRING,
                    description: "The product name to update",
                  },
                  newPrice: {
                    type: Type.NUMBER,
                    description: "The new selling price in rupees",
                  },
                },
                required: ["productName", "newPrice"],
              },
            },
            {
              name: "propose_delete_product",
              description: "Propose permanently deleting a product from inventory catalog with shopkeeper confirmation.",
              parameters: {
                type: Type.OBJECT,
                properties: {
                  productName: {
                    type: Type.STRING,
                    description: "The name of the product to delete",
                  },
                },
                required: ["productName"],
              },
            },
            {
              name: "propose_record_sale",
              description: "Propose recording a counter sales slip with one or multiple items (e.g. 'Today I sold 4 Nivea creams, 3 Lakme Kajals, and 2 chudis', 'Sold 5 Lakme at 50'). Also supports unlinked/custom items that are not yet in the inventory catalog without refusing.",
              parameters: {
                type: Type.OBJECT,
                properties: {
                  items: {
                    type: Type.ARRAY,
                    description: "List of items sold together in this sales slip. Use this when one or more items are sold together in a transaction.",
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        productName: {
                          type: Type.STRING,
                          description: "Product name (e.g. 'Nivea cream', 'Lakme Kajal', 'Chudi')",
                        },
                        quantity: {
                          type: Type.INTEGER,
                          description: "Number of units sold (default 1)",
                        },
                        unitPrice: {
                          type: Type.NUMBER,
                          description: "Price per unit in rupees if mentioned",
                        },
                      },
                      required: ["productName"],
                    },
                  },
                  productName: {
                    type: Type.STRING,
                    description: "Single product name if only one item is sold",
                  },
                  quantity: {
                    type: Type.INTEGER,
                    description: "Number of units sold (if single item)",
                  },
                  unitPrice: {
                    type: Type.NUMBER,
                    description: "Price per unit in rupees (if single item)",
                  },
                  notes: {
                    type: Type.STRING,
                    description: "Optional customer or slip note (e.g. 'Udhar ₹50', customer name)",
                  },
                },
              },
            },
            {
              name: "update_slip_note",
              description: "Add or update customer notes or udhar note on an existing sales slip (e.g. 'For recent slip add note: udhar of 50', 'Slip 4567834 me note update karo: Ramesh udhar').",
              parameters: {
                type: Type.OBJECT,
                properties: {
                  note: {
                    type: Type.STRING,
                    description: "The note text to add or update (e.g. 'Udhar of ₹50', 'Ramesh bhai udhar')",
                  },
                  slipNumber: {
                    type: Type.STRING,
                    description: "Optional slip number if mentioned (e.g. '4567834', 'SLIP-261024-1234')",
                  },
                  itemHint: {
                    type: Type.STRING,
                    description: "Optional item name in the slip if referring to a recent item slip (e.g. 'chudi', 'nivea')",
                  },
                },
                required: ["note"],
              },
            },
            {
              name: "get_daily_reminders",
              description: "Get gentle daily store reminders (unassigned locations, out-of-stock items, pending supplier deliveries) for the shopkeeper. When speaking, highlight naturally without reading like a dry newspaper list.",
              parameters: {
                type: Type.OBJECT,
                properties: {},
              },
            },
            {
              name: "query_sales_history",
              description: "Lookup past sales slips, recent items sold, and total earnings/revenue for a specific date or period, or inspect specific line items sold (e.g. 'What is the recent item I sold', 'Abhi kaunsa item bika', 'How much money did I sell', 'On 20th January 2026 how much money did I earn', 'On 24 October what is the item I sold that was 30', 'Did I sell Lakme yesterday').",
              parameters: {
                type: Type.OBJECT,
                properties: {
                  dateQuery: {
                    type: Type.STRING,
                    description: "Target date or period (e.g. 'today', 'yesterday', 'this week', 'this month', '24 October', '20th January 2026')",
                  },
                  unitPrice: {
                    type: Type.NUMBER,
                    description: "Optional specific unit price to filter line items (e.g. 30 for 'item sold that was 30')",
                  },
                  itemName: {
                    type: Type.STRING,
                    description: "Optional product or item name to filter in past slips",
                  },
                },
              },
            },
            {
              name: "query_restock_orders",
              description: "Query restock orders, past purchase orders, cancelled orders, waiting/pending orders, delivered orders, recent arrivals (e.g. 'What is the recent item that got delivered', 'Abhi jo deliver hua wo kaunsa item tha', 'What did I bring recently'), and whether new restock orders are needed.",
              parameters: {
                type: Type.OBJECT,
                properties: {
                  queryType: {
                    type: Type.STRING,
                    description: "Type of inquiry: 'delivered' (for delivered orders or recent deliveries received), 'waiting', 'cancelled', 'needs_reorder', or 'all'",
                  },
                },
              },
            },
            {
              name: "propose_create_restock_order",
              description: "Draft a purchase restock order slip ONLY when the shopkeeper explicitly commands to order, buy, or prepare a supplier slip for specific items/quantities (e.g. 'Add 10 units of serum to my slip', 'Order 10 serum', 'Wholesaler ke liye 10 piece ka order bana do'). DO NOT call this when the shopkeeper is asking advice, asking what to buy, or asking questions about trends or festivals. Supports both existing catalog products and new unlisted products. Provides a confirmation card with WhatsApp supplier link.",
              parameters: {
                type: Type.OBJECT,
                properties: {
                  items: {
                    type: Type.ARRAY,
                    description: "Array of restock order line items with product name and quantity to order",
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        productName: {
                          type: Type.STRING,
                          description: "Name of the product to order",
                        },
                        quantity: {
                          type: Type.INTEGER,
                          description: "Units to order (default 10)",
                        },
                      },
                      required: ["productName"],
                    },
                  },
                  distributorName: {
                    type: Type.STRING,
                    description: "Optional supplier or distributor name",
                  },
                  notes: {
                    type: Type.STRING,
                    description: "Optional purchase order notes",
                  },
                },
                required: ["items"],
              },
            },
            {
              name: "propose_record_order_arrival",
              description: "Propose marking a restock delivery/order item as arrived with confirmation, adding the arrived units to stock.",
              parameters: {
                type: Type.OBJECT,
                properties: {
                  productName: {
                    type: Type.STRING,
                    description: "The name of the product that arrived",
                  },
                  orderNumber: {
                    type: Type.STRING,
                    description: "Optional restock order/slip number (e.g. PO-260120-1234)",
                  },
                  quantity: {
                    type: Type.INTEGER,
                    description: "Units received",
                  },
                },
              },
            },
            {
              name: "get_seasonal_market_trends",
              description: "Get category-specific festive and seasonal restocking advice, market trends, high-margin retail product ideas for Indian festivals (Diwali, Karwa Chauth, Eid, Christmas, New Year, Wedding season, Winter, Summer), and answer follow-up queries about wholesale margins, product varieties, or customer demand.",
              parameters: {
                type: Type.OBJECT,
                properties: {
                  festivalOrSeason: {
                    type: Type.STRING,
                    description: "The festival or season mentioned (e.g. 'diwali', 'christmas', 'winter', 'wedding_season', 'karwa_chauth', 'holi', 'eid', 'summer')",
                  },
                  query: {
                    type: Type.STRING,
                    description: "Specific user question, item inquiry, or follow-up question (e.g. 'fairy lights variety and rates', 'cold cream brands', 'what items to bring for diwali')",
                  },
                },
              },
            },
          ],
        },
      ];

      const [shopRes, ownerProfileRes, prodCountRes, slipsCountRes] = await Promise.all([
        (supabase.from("shops") as any)
          .select("name, category, description, created_at, owner_id, whatsapp_number")
          .eq("id", shopId)
          .maybeSingle(),
        user?.id
          ? (supabase.from("profiles") as any)
              .select("full_name, email")
              .eq("id", user.id)
              .maybeSingle()
          : Promise.resolve({ data: { full_name: "Shivam (Demo)", email: "demo@koro.retail" } }),
        (supabase.from("products") as any)
          .select("id", { count: "exact", head: true })
          .eq("shop_id", shopId),
        (supabase.from("sales_slips") as any)
          .select("id", { count: "exact", head: true })
          .eq("shop_id", shopId),
      ]);

      const currentShop = shopRes.data;
      const ownerProfile = ownerProfileRes.data;
      const totalCatalogProducts = prodCountRes.count ?? 0;
      const totalRecordedSlips = slipsCountRes.count ?? 0;

      const shopContext = currentShop
        ? `\nActive Store Context:
- Store Name: "${currentShop.name}"
- Category: "${currentShop.category}"${currentShop.description ? `\n- About Store / Specialties: "${currentShop.description}"` : ""}${ownerProfile?.full_name ? `\n- Owner / Manager Name: "${ownerProfile.full_name}"` : ""}${ownerProfile?.email ? `\n- Owner Email: "${ownerProfile.email}"` : ""}${currentShop.created_at ? `\n- Store Registered Since: "${new Date(currentShop.created_at).toLocaleDateString("en-IN")}"` : ""}${currentShop.whatsapp_number ? `\n- Configured WhatsApp Number: "${currentShop.whatsapp_number}"` : ""}
- Total Catalog Products: ${totalCatalogProducts}
- Total Sales Slips Recorded: ${totalRecordedSlips}
[PRIVACY GUARDRAIL]: Never reveal the store's phone number or personal details to unauthorized third parties or outside inquiries. Refer to store details accurately when the owner asks.`
        : "";

      const focusContext = lastFocusedProduct
        ? `\nActive Conversational Focus: The user recently discussed product "${lastFocusedProduct}". If they say "update this product", "change its price", "location update kar do", or use pronouns like "it", "this", "iska", "isko" without naming a new item, assume they mean "${lastFocusedProduct}".`
        : "";

      const sessionActivityContext = recentEvents.length > 0
        ? `\nRecent Activity in Current Session:\n${recentEvents.map((e) => `• ${e}`).join("\n")}\n(Keep this context in mind so you never forget recent actions you or the shopkeeper just took!)`
        : "";

      const systemInstruction = `You are "Koro", the AI assistant for an Indian retail shopkeeper (kirana, cosmetics, general store).${shopContext}${focusContext}${sessionActivityContext}
Rules:
1. Always be concise, fast, and polite. Shopkeepers use this during busy store rush hours.
2. Never invent stock counts, locations, or prices. Always call the corresponding tool.
3. If an inventory change is requested (e.g. add/deduct stock), call propose_stock_adjustment so the shopkeeper can confirm before anything changes.
4. If asked to add a new product, call propose_create_product.
5. If asked for total products or store inventory summary, call get_store_inventory_summary. Remember: total products = distinct catalog products (e.g. 2 items), total units = sum of stock quantities (e.g. 7 pieces). Do NOT confuse them.
6. If asked to update or assign location, call propose_update_product_location.
7. If asked to update or assign price, call propose_update_product_price.
8. Recording Counter Sales:
   - When user mentions selling items (e.g. "Today I sold 4 Nivea creams, 3 Lakme Kajals, and 2 chudis", "2 Nivea and 1 Lakme becha", "Someone bought this", "Ye bika"):
     By default, put all items sold together into ONE single sales slip using the items array of propose_record_sale!
   - ONLY split into separate slips if the shopkeeper explicitly asks (e.g. "Make 2 slips: in 1 slip put Lakme and Nivea, and in 2nd slip put chudi"). In that case, call propose_record_sale multiple times, once for each requested slip.
   - If an item is uncataloged/unlinked, DO NOT REFUSE IT. Propose it as an unlinked item in the sales slip.
   - Out-of-Stock Awareness: If an item is out of stock in the system (0 units), STILL include it in the sales slip (shopkeepers frequently sell newly arrived stock before entering purchase orders into the system), and politely acknowledge it.
9. Querying Earnings & Sales:
   - When asked "How much money did I sell?", "How much did I earn?", "Total sale kitni hui?", with no date specified, default date to "today" and call query_sales_history.
   - If asked for yesterday, this week, this month, or a specific date (e.g. "20th January 2026"), pass that to query_sales_history.
   - When asked about a specific line item in past slips (e.g. "On 24 October what is the item I sold that was 30", "item sold at 30"), pass unitPrice and/or itemName to query_sales_history.
10. Updating Slip Notes & Udhar:
   - When the user asks to add or update a note on a sales slip (e.g. "For the recent slip that you have created for chudi, add a note as well, like it's a udhar of ₹50", "Slip 4567834 me note update karo"):
     ALWAYS call update_slip_note with the note and optional slip number or item hint.
11. Daily Reminders:
   - When the user asks "What are my reminders today?", "Aaj ke reminder kya hain?", or about store tasks, call get_daily_reminders. Respond naturally and conversationally (highlighting unassigned locations, low stock, or pending deliveries), avoiding reading like a dry newspaper list.
12. Restock Orders, Status & Queries:
   - When user asks about cancelled orders, waiting orders, delivered orders, unit counts, or whether they need to place a new order, call query_restock_orders.
13. Drafting Restock Orders:
   - When user asks to draft or create a restock order/slip (e.g. "Add 10 units of serum and Nivea cream to my slip", "Order 10 serum", "I want to buy items from retailers/wholesalers", "Wholesaler se mangwana hai", "Today I want to buy something for the shop"), call propose_create_restock_order. This provides a draft confirmation card with WhatsApp share link.
14. If user says an order or restock arrived, call propose_record_order_arrival.
15. If user asks to delete a product (e.g. "Delete product Lakme"), call propose_delete_product. Never delete without confirmation.
16. Conversational Memory: If the user just updated or discussed a product (e.g. updated location of Lakme) and then says "update this product's price as well" or "price 50 kar do", remember that "this product" refers to the focused product without asking "which product".
17. Support English, Hindi, and Hinglish. Keep your final answer short and clear.
18. Multilingual Semantic Equivalence & Indian Retail Vocabulary (CRITICAL):
    - Real Indian shopkeepers speak with diverse regional vocabulary, colloquial terms, and Hindi/Hinglish phrasing. NEVER rely on exact catalog spelling or US English words!
    - Understand semantic intent and equivalence:
      * 'Mehndi' / 'Mehendi' / 'Mendi' / 'Henna' / 'Cone' -> all refer to mehndi products (e.g. Kaveri Natural Herbal Mehendi Cone).
      * 'Chudi' / 'Choodi' / 'Chudiyan' / 'Kangan' / 'Kada' / 'Bangles' -> all refer to bangles and wrist jewelry.
      * 'Earrings' / 'Jhumka' / 'Jhumki' / 'Chandbali' / 'Tops' / 'Pearl drop' -> all refer to earrings and ear jewelry.
      * 'Bindi' / 'Bindiya' / 'Tikli' -> bindi cards and booklets.
      * 'Kajal' / 'Kaajal' / 'Surma' / 'Eyeliner' -> eye makeup.
      * 'Hairband' / 'Rubber band' / 'Scrunchie' / 'Clutcher' / 'Clips' / 'Hairpins' -> hair accessories.
      * 'Cream' / 'Moisturizer' / 'Cold cream' -> face and body creams.
      * 'Nail polish' / 'Nail paint' / 'Nail pops' -> nail cosmetics.
      * 'Sindoor' / 'Sindur' / 'Kumkum' -> traditional sindoor.
    - When searching or looking up an item, call find_product_location or check_product_stock with the essential keyword(s) (e.g. 'Mehndi', 'Earrings', 'Chudi', 'Kangan', 'Pearl drop', 'Kaveri').
    - When multiple products match (for example, multiple chudis, kangans, or earrings), provide a clear, helpful breakdown of the available varieties and their storage locations.
19. Recent Activity Inquiries & Immediate Answers (CRITICAL):
    - When the shopkeeper asks about recent activity:
      * "What is the recent item that got delivered?" / "Abhi jo deliver hua wo kaunsa item tha?" / "What is the recent item I brought/received from supplier?":
        ALWAYS call query_restock_orders with queryType: "delivered".
        DO NOT recite a list of multiple slips or ask the shopkeeper for a slip number!
        Directly identify and state the exact recent item and slip number from the tool output:
        "Aapka sabse recent deliver hua item [Item Name] hai jo Slip #[OrderNumber] mein aaya tha."
      * "What is the recent item I sold?" / "Abhi kaunsa item bika?" / "Maine abhi kya becha?":
        ALWAYS call query_sales_history with dateQuery: "today".
        Directly state the most recent item sold, its quantity, and price from the top of the report:
        "Aapka sabse recent bika hua item [Item Name] hai (₹[Price], Slip #[SlipNumber])."
      * "What is the recent product I added?" / "Abhi jo product add kiya wo kaunsa tha?" / "What product did I add 2 days ago?" / "Maine pehle kya add kiya tha?":
        ALWAYS call get_recent_added_products.
        Directly state the recent product name, when it was added (e.g. 2 din pehle, abhi, kal), its price and location:
        "Aapka sabse recent added product [Product Name] hai jo [time ago] add hua tha."
    - If the shopkeeper previously took an action in the current session (e.g. created a restock order, recorded a sale, marked arrival), maintain context of what was just done and refer to it directly.
20. Conversational Follow-ups & Graceful Chit-Chat (CRITICAL):
    - Avoid Repetitive Tool Calling & Repetitive Lists:
      * If you just provided daily reminders, sales info, or order status, and the user follows up with:
        "Okay thank you. Is there something else?", "Theek hai, aur kuch hai kya?", "Is that all?", "Any other reminders left?", "Koi aur reminder bacha hai?", "Kuch aur bacha hai?":
        DO NOT call get_daily_reminders or any query tool again!
        DO NOT repeat the same list of reminders or data!
        Understand the intent: They are asking if anything ADDITIONAL is pending.
        Warmly and concisely reply:
        "Nahi, aur koi reminders ya pending kaam nahi hain. Bas yahi dhyan mein rakhna hai. Agar koi aur dukaan ka kaam ya naya sawaal ho toh batayein!"
        (In English: "No, you don't have any other reminders left. That's all for now. Let me know if there's anything else you need!")
      * If the user simply says "Thank you", "Theek hai shukriya", "Okay cool", "Accha":
        Reply politely in 1 short phrase (e.g. "Aapka swagat hai! Agar kuch aur kaam ho toh batayein.") without re-running any tools or repeating old information.
      * If an unexpected or conversational question occurs where the intent is unclear:
        DO NOT repeat previous answers or tools. Politely ask for clarification in 1 short sentence:
        "Main samjhi nahi, kya aap dukaan ke kisi specific product ya order ke baare mein puch rahe hain?"
21. Retail Intent Equivalence (Shopkeeper Buying vs Customer Sales):
    - Real shopkeepers use natural colloquial language rather than formal technical terms:
      * Shopkeeper Buying / Ordering for Store -> propose_create_restock_order:
        "I want to buy X from retailers / wholesalers"
        "Wholesaler se samaan mangwana hai / khareedna hai"
        "Today I want to buy something for the store"
        "Dukaan ke liye X lena hai / order karna hai"
        "Add an item I want to buy from retailers"
        -> Intent is purchasing/restocking for the shop. CALL propose_create_restock_order. NEVER propose_record_sale!
      * Customer Buying / Counter Sales -> propose_record_sale:
        "Someone brought / bought this"
        "Customer ne ye liya / kharida"
        "I sold these items" / "Ye bika" / "Sale hua"
        -> Intent is recording a counter sale to a customer. CALL propose_record_sale.
      * Delivery Arrival -> propose_record_order_arrival:
        "Samaan aa gaya" / "Item deliver ho gaya" / "Delivery aa gayi" / "Supplier ne bhej diya"
        -> Intent is recording the arrival of ordered stock. CALL propose_record_order_arrival.
      * CRITICAL GUARD - Questions & Advice vs Placing an Order:
        - When the shopkeeper asks ANY question, recommendation, advice, or feasibility (e.g. "Diwali aa rahi hai kya samaan layein?", "Kya mangwana chahiye?", "Fairy lights rakhna theek rahega?", "Winter mein kya chalega?"):
          THIS IS A QUESTION, NOT AN ORDER!
          NEVER call propose_create_restock_order! NEVER trigger an order confirmation popup!
          ALWAYS call get_seasonal_market_trends or provide answers in speech/text.
        - ONLY call propose_create_restock_order when the user gives an explicit command to draft or place an order (e.g. "10 piece fairy lights ka order bana do", "Wholesaler ke liye order slip taiyaar karo", "Ye samaan slip mein daal do").
22. Seasonal & Festive Market Restock Trends (Smart Wholesale Advice):
    - When the shopkeeper asks what to bring, stock, or prepare for an upcoming festival (Diwali, Karwa Chauth, Eid, Christmas, New Year), season (winter cold creams, summer, wedding season), or general market demand (e.g. "Diwali aa rahi hai kya samaan layein?", "Market mein kya naya chal raha hai?", "Winter ke liye kya mangwana chahiye?"):
      ALWAYS call get_seasonal_market_trends with 'festivalOrSeason' and 'query'.
    - When the shopkeeper asks a FOLLOW-UP question about those recommendations (e.g. "Fairy lights mein kaunse types zyada chalte hain?", "Cold cream mein margin kitna hota hai?", "Kaunse brands zyada bikte hain?"):
      ALWAYS call get_seasonal_market_trends with 'query' set to their exact follow-up question.
      DO NOT repeat the earlier general overview or list! Answer their specific question directly.
    - Sane Conversational Tone & Delivery:
      Speak in a natural, warm, and helpful tone (2-3 spoken sentences in clear Hindi/Hinglish). Balance new high-demand market items (e.g. fairy lights, festive jewellery, winter creams) with their proven catalog bestsellers. Never abruptly stop or read dry bullet points. Never suggest out-of-category or hazardous items (e.g. no firecrackers for cosmetics, no decor for medicine).
    - NEVER propose an order draft or confirmation popup during trend advisory or follow-up questions. Only provide clear spoken/written suggestions and guidance.`;

      const historyTurns = (loadedRecentMsgs || [])
        .slice(0, 4)
        .reverse()
        .filter((h: any) => h.content && h.content.trim() && h.content !== query);

      const conversationContents: any[] = [];
      for (const h of historyTurns) {
        conversationContents.push({
          role: h.role === "assistant" ? "model" : "user",
          parts: [{ text: h.content.slice(0, 600) }],
        });
      }
      conversationContents.push({
        role: "user",
        parts: [{ text: query }],
      });

      const response = await ai.models.generateContent({
        model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
        contents: conversationContents.length > 1 ? conversationContents : query,
        config: {
          systemInstruction,
          tools,
          temperature: 0.2,
        },
      });

      const functionCalls = response.functionCalls;
      if (functionCalls && functionCalls.length > 0) {
        const results: any[] = [];

        for (const call of functionCalls) {
          const args = (call.args as any) || {};
          let toolResult: any = null;

          if (call.name === "find_product_location") {
            toolResult = await executeFindLocation(supabase, shopId, args.productName || query);
          } else if (call.name === "check_product_stock") {
            toolResult = await executeCheckStock(supabase, shopId, args.productName || query);
          } else if (call.name === "get_low_stock_products") {
            toolResult = await executeGetLowStock(supabase, shopId);
          } else if (call.name === "get_product_price_history") {
            toolResult = await executeGetPriceHistory(supabase, shopId, args.productName || query);
          } else if (call.name === "propose_stock_adjustment") {
            toolResult = await executeProposeStockAdjustment(
              supabase,
              shopId,
              args.productName || query,
              args.quantityDelta || 0,
              args.reason
            );
          } else if (call.name === "propose_create_product") {
            toolResult = await executeProposeCreateProduct(supabase, shopId, {
              productName: args.productName || query,
              openingStock: args.openingStock !== undefined ? Number(args.openingStock) : 1,
              sellingPrice: args.sellingPrice !== undefined ? Number(args.sellingPrice) : undefined,
              costPrice: args.costPrice !== undefined ? Number(args.costPrice) : undefined,
              category: args.category,
              storageLocation: args.storageLocation,
            });
          } else if (call.name === "get_store_inventory_summary") {
            toolResult = await executeGetInventorySummary(supabase, shopId);
          } else if (call.name === "get_recent_added_products") {
            toolResult = await executeGetRecentAddedProducts(
              supabase,
              shopId,
              args.limit ? Number(args.limit) : 5,
              args.category
            );
          } else if (call.name === "propose_update_product_location") {
            toolResult = await executeProposeUpdateLocation(
              supabase,
              shopId,
              args.productName || query,
              args.newLocation || ""
            );
          } else if (call.name === "propose_update_product_price") {
            toolResult = await executeProposeUpdatePrice(
              supabase,
              shopId,
              args.productName || query,
              Number(args.newPrice) || 0
            );
          } else if (call.name === "propose_delete_product") {
            toolResult = await executeProposeDeleteProduct(
              supabase,
              shopId,
              args.productName || query
            );
          } else if (call.name === "propose_record_sale") {
            toolResult = await executeProposeRecordSale(supabase, shopId, {
              items: args.items,
              productName: args.productName || (!args.items ? query : undefined),
              quantity: args.quantity ? Number(args.quantity) : undefined,
              unitPrice: args.unitPrice !== undefined ? Number(args.unitPrice) : undefined,
              notes: args.notes,
            });
          } else if (call.name === "update_slip_note") {
            toolResult = await executeUpdateSlipNote(supabase, shopId, {
              note: args.note,
              slipNumber: args.slipNumber,
              itemHint: args.itemHint,
            });
          } else if (call.name === "get_daily_reminders") {
            toolResult = await executeGetDailyReminders(supabase, shopId);
          } else if (call.name === "propose_create_restock_order") {
            toolResult = await executeProposeCreateRestockOrder(supabase, shopId, {
              items: args.items,
              distributorName: args.distributorName,
              notes: args.notes,
            });
          } else if (call.name === "query_sales_history") {
            toolResult = await executeGetSalesHistory(
              supabase,
              shopId,
              args.dateQuery || "today",
              {
                unitPrice: args.unitPrice !== undefined ? Number(args.unitPrice) : undefined,
                itemName: args.itemName,
              }
            );
          } else if (call.name === "query_restock_orders") {
            toolResult = await executeGetRestockOrdersSummary(
              supabase,
              shopId,
              args.queryType || query
            );
          } else if (call.name === "propose_record_order_arrival") {
            toolResult = await executeProposeRecordArrival(supabase, shopId, {
              productName: args.productName,
              orderNumber: args.orderNumber,
              quantity: args.quantity ? Number(args.quantity) : undefined,
            });
          } else if (call.name === "get_seasonal_market_trends") {
            toolResult = await executeGetSeasonalMarketTrends(supabase, shopId, {
              festivalOrSeason: args.festivalOrSeason,
              query: args.query || query,
            });
          }

          if (toolResult) {
            results.push(toolResult);
          }
        }

        if (results.length > 0) {
          const mergedContent = results.map((r) => r.content).join("\n\n---\n\n");
          const primaryResult = results[0];
          const allPendingActions = results
            .map((r) => r.pendingAction)
            .filter(Boolean);

          const finalPayload: AssistantResponsePayload = {
            role: "assistant",
            content: mergedContent,
            taskType: primaryResult.taskType,
            structuredData: primaryResult.structuredData,
            pendingAction: allPendingActions[0] || null,
            pendingActions: allPendingActions.length > 1 ? allPendingActions : null,
          };

          await (supabase.from("assistant_messages") as any).insert({
            shop_id: shopId,
            user_id: user?.id || null,
            role: "assistant",
            content: finalPayload.content,
            task_type: finalPayload.taskType,
            metadata: {
              conversationId: conversationId || null,
              structuredData: finalPayload.structuredData || null,
              pendingAction: finalPayload.pendingAction || null,
              pendingActions: finalPayload.pendingActions || null,
            },
          });

          return { success: true, message: finalPayload };
        }
      }



      // If no function call, return the model's text response
      const text = response.text || "I didn't quite catch that. You can ask: 'Where is [item]?', 'Stock of [item]?', 'What is low on stock?', or 'Price of [item]'";
      const finalPayload: AssistantResponsePayload = {
        role: "assistant",
        content: text,
        taskType: "general",
      };

      await (supabase.from("assistant_messages") as any).insert({
        shop_id: shopId,
        user_id: user?.id || null,
        role: "assistant",
        content: text,
        task_type: "general",
        metadata: {
          conversationId: conversationId || null,
        },
      });

      return { success: true, message: finalPayload };
    } catch (err: unknown) {
      console.error("Gemini assistant error:", err);
      // Fallback gracefully to smart search
      const fallbackLocation = await executeFindLocation(supabase, shopId, query);
      const fallbackPayload: AssistantResponsePayload = {
        role: "assistant",
        content: fallbackLocation.content,
        taskType: fallbackLocation.taskType,
        structuredData: fallbackLocation.structuredData,
      };
      return {
        success: true,
        message: fallbackPayload,
      };
    }
  }

  // 3. Fallback when GEMINI_API_KEY is not set yet
  const fallbackLocation = await executeFindLocation(supabase, shopId, query);
  const fallbackPayload: AssistantResponsePayload = {
    role: "assistant",
    content: fallbackLocation.content,
    taskType: fallbackLocation.taskType,
    structuredData: fallbackLocation.structuredData,
  };
  return {
    success: true,
    message: fallbackPayload,
  };
}

// -------------------------------------------------------------
// Action Confirmation Execution Server Action
// -------------------------------------------------------------
export async function confirmAssistantActionExecution(input: ConfirmAssistantActionInput) {
  const parseResult = confirmAssistantActionSchema.safeParse(input);
  if (!parseResult.success) {
    return {
      success: false,
      error: parseResult.error.issues[0]?.message || "Invalid confirmation payload",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isDemo = parseResult.data.shopId === "1bd46074-6e69-4b38-83c9-d25a2999d011";
  if (!user && !isDemo) {
    return { success: false, error: "Unauthorized" };
  }
  const effectiveUserId = user?.id || null;

  const {
    shopId,
    actionType,
    productId,
    productName,
    newStock,
    quantityDelta,
    reason,
    openingStock,
    sellingPrice,
    costPrice,
    category,
    storageLocation,
    newLocation,
    currentLocation,
    newPrice,
    currentPrice,
  } = parseResult.data;

  try {
    if (actionType === "adjust_stock") {
      if (!productId || newStock === undefined) {
        throw new Error("Missing product ID or target stock count");
      }

      const noteText = `Updated via Voice Assistant: ${quantityDelta && quantityDelta > 0 ? "+" : ""}${quantityDelta} units`;

      const { data: adjustRes, error: rpcErr } = await (supabase as any).rpc(
        "adjust_product_stock",
        {
          p_product_id: productId,
          p_new_stock: newStock,
          p_reason: "manual_adjustment",
          p_notes: noteText,
        }
      );

      if (rpcErr) throw rpcErr;

      const confirmMsg = `✅ **Confirmed & Updated!** Stock for **${productName}** is now **${newStock} units**.`;

      // Save confirmation record to assistant messages
      await (supabase.from("assistant_messages") as any).insert({
        shop_id: shopId,
        user_id: effectiveUserId,
        role: "assistant",
        content: confirmMsg,
        task_type: "adjust_stock",
        metadata: {
          confirmed: true,
          productId,
          productName,
          newStock,
        },
      });

      revalidatePath("/dashboard");
      return { success: true, message: confirmMsg, newStock };
    }

    if (actionType === "create_product") {
      // Safety Check: Check if product with this name already exists in this shop
      const { data: existingList } = await (supabase as any)
        .from("products")
        .select("id, name, current_stock, storage_location, selling_price")
        .eq("shop_id", shopId)
        .ilike("name", productName.trim());

      if (existingList && existingList.length > 0) {
        // Product ALREADY exists! Update the existing product instead of creating a duplicate row!
        const existing = existingList[0];
        const updatePayload: any = {};
        if (storageLocation && storageLocation.trim()) {
          updatePayload.storage_location = storageLocation.trim();
        }
        if (sellingPrice !== undefined && sellingPrice !== null && Number(sellingPrice) > 0) {
          updatePayload.selling_price = Number(sellingPrice);
        }
        if (openingStock !== undefined && openingStock > 0) {
          updatePayload.current_stock = (Number(existing.current_stock) || 0) + Number(openingStock);
        }

        if (Object.keys(updatePayload).length > 0) {
          await (supabase as any)
            .from("products")
            .update(updatePayload)
            .eq("shop_id", shopId)
            .ilike("name", productName.trim());
        }

        const confirmMsg = `✅ **Updated Existing Item!** **${productName}** already catalog mein tha, isliye nayi details update kar di gayi hain.`;
        await (supabase.from("assistant_messages") as any).insert({
          shop_id: shopId,
          user_id: effectiveUserId,
          role: "assistant",
          content: confirmMsg,
          task_type: "create_product",
          metadata: {
            confirmed: true,
            productId: existing.id,
            productName,
            updatedExisting: true,
          },
        });

        revalidatePath("/dashboard");
        return { success: true, message: confirmMsg, product: existing };
      }

      // Brand-new product: Create via RPC
      const stockToAdd = openingStock !== undefined && openingStock >= 0 ? openingStock : 1;
      const { data: newProd, error: rpcErr } = await (supabase as any).rpc(
        "create_product_with_stock",
        {
          p_shop_id: shopId,
          p_name: productName,
          p_category: category || "General Store",
          p_opening_stock: stockToAdd,
          p_brand: null,
          p_barcode: null,
          p_selling_price: sellingPrice || null,
          p_cost_price: costPrice || null,
          p_min_stock_threshold: 5,
          p_storage_location: storageLocation || null,
          p_attributes: {},
          p_description: "Created via Koro Voice Assistant",
        }
      );

      if (rpcErr) throw rpcErr;

      const confirmMsg = `✅ **Added to Inventory!** **${productName}** has been created with stock **${stockToAdd} units**${storageLocation ? ` (Location: ${storageLocation})` : ""}${sellingPrice ? ` (Selling Price: ₹${sellingPrice})` : ""}.`;

      // Save confirmation record to assistant messages
      await (supabase.from("assistant_messages") as any).insert({
        shop_id: shopId,
        user_id: effectiveUserId,
        role: "assistant",
        content: confirmMsg,
        task_type: "create_product",
        metadata: {
          confirmed: true,
          productName,
          openingStock: stockToAdd,
          sellingPrice,
          storageLocation,
          category,
          productId: newProd?.id,
        },
      });

      revalidatePath("/dashboard");
      return { success: true, message: confirmMsg, product: newProd };
    }

    if (actionType === "update_location") {
      if (!productId) {
        throw new Error("Missing product ID for location update");
      }
      const locToSet = (newLocation || storageLocation || "").trim();
      if (!locToSet) {
        throw new Error("Please specify a location to set");
      }

      const { data: updatedProd, error: updateErr } = await (supabase as any)
        .from("products")
        .update({ storage_location: locToSet })
        .eq("id", productId)
        .eq("shop_id", shopId)
        .select("id, name, storage_location")
        .single();

      if (updateErr) throw updateErr;

      // Also sync any duplicate rows with the exact same name in this shop
      try {
        await (supabase as any)
          .from("products")
          .update({ storage_location: locToSet })
          .eq("shop_id", shopId)
          .ilike("name", productName.trim());
      } catch (syncErr) {
        // Non-blocking
      }

      const confirmMsg = `✅ **Location Updated!** **${productName}** ki location ab **"${locToSet}"** set ho gayi hai.`;

      await (supabase.from("assistant_messages") as any).insert({
        shop_id: shopId,
        user_id: effectiveUserId,
        role: "assistant",
        content: confirmMsg,
        task_type: "update_location",
        metadata: {
          confirmed: true,
          productId,
          productName,
          storageLocation: locToSet,
        },
      });

      revalidatePath("/dashboard");
      return { success: true, message: confirmMsg, product: updatedProd };
    }

    if (actionType === "update_price") {
      if (!productId) {
        throw new Error("Missing product ID for price update");
      }
      const priceToSet =
        newPrice !== undefined
          ? Number(newPrice)
          : sellingPrice !== undefined
          ? Number(sellingPrice)
          : null;

      if (priceToSet === null || isNaN(priceToSet) || priceToSet < 0) {
        throw new Error("Valid selling price required");
      }

      const { data: updatedProd, error: updateErr } = await (supabase as any)
        .from("products")
        .update({ selling_price: priceToSet })
        .eq("id", productId)
        .eq("shop_id", shopId)
        .select("id, name, selling_price")
        .single();

      if (updateErr) throw updateErr;

      // Also sync any duplicate rows with the exact same name in this shop
      try {
        await (supabase as any)
          .from("products")
          .update({ selling_price: priceToSet })
          .eq("shop_id", shopId)
          .ilike("name", productName.trim());
      } catch (syncErr) {
        // Non-blocking
      }

      const confirmMsg = `✅ **Price Updated!** **${productName}** ka selling price ab **₹${priceToSet}** set ho gaya hai.`;

      await (supabase.from("assistant_messages") as any).insert({
        shop_id: shopId,
        user_id: effectiveUserId,
        role: "assistant",
        content: confirmMsg,
        task_type: "update_price",
        metadata: {
          confirmed: true,
          productId,
          productName,
          sellingPrice: priceToSet,
        },
      });

      revalidatePath("/dashboard");
      return { success: true, message: confirmMsg, product: updatedProd };
    }

    if (actionType === "delete_product") {
      if (!productId) {
        throw new Error("Missing product ID for deletion");
      }

      const { error: delErr } = await (supabase as any)
        .from("products")
        .delete()
        .eq("id", productId)
        .eq("shop_id", shopId);

      if (delErr) throw delErr;

      const confirmMsg = `✅ **Product Deleted!** **${productName}** ko inventory catalog se permanently delete kar diya gaya hai.`;

      await (supabase.from("assistant_messages") as any).insert({
        shop_id: shopId,
        user_id: effectiveUserId,
        role: "assistant",
        content: confirmMsg,
        task_type: "delete_product",
        metadata: {
          confirmed: true,
          productId,
          productName,
        },
      });

      revalidatePath("/dashboard");
      return { success: true, message: confirmMsg };
    }

    if (actionType === "record_sale") {
      const rawItems = parseResult.data.items;
      const noteToSave = parseResult.data.notes || reason || "Recorded via Voice/Chat Assistant";
      const dateTag = new Date().toISOString().slice(2, 10).replace(/-/g, "");
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const slipNumber = `SLIP-${dateTag}-${randomSuffix}`;
      const idempotencyKey = `sale-${Date.now()}-${randomSuffix}`;

      let slipLines: Array<{
        product_id: string | null;
        raw_item_name: string;
        quantity: number;
        unit_price: number;
        is_tracked: boolean;
        status: string;
      }> = [];
      let totalEarned = 0;

      if (rawItems && rawItems.length > 0) {
        slipLines = rawItems.map((item) => ({
          product_id: item.productId || null,
          raw_item_name: item.productName,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          is_tracked: Boolean(item.productId),
          status: item.productId ? "matched" : "untracked",
        }));
        totalEarned = rawItems.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
      } else {
        const quantitySold = parseResult.data.quantity || 1;
        const unitPriceSold =
          parseResult.data.unitPrice !== undefined
            ? parseResult.data.unitPrice
            : sellingPrice !== undefined
            ? sellingPrice
            : 0;
        slipLines = [
          {
            product_id: productId || null,
            raw_item_name: productName,
            quantity: quantitySold,
            unit_price: unitPriceSold,
            is_tracked: Boolean(productId),
            status: productId ? "matched" : "untracked",
          },
        ];
        totalEarned = quantitySold * unitPriceSold;
      }

      const { data: saleResult, error: saleErr } = await (supabase as any).rpc("record_sales_slip", {
        p_shop_id: shopId,
        p_slip_number: slipNumber,
        p_source: "manual",
        p_notes: noteToSave,
        p_idempotency_key: idempotencyKey,
        p_lines: slipLines,
      });

      if (saleErr) throw saleErr;

      let confirmMsg = "";
      if (rawItems && rawItems.length > 1) {
        const itemsSummary = rawItems
          .map((it) => `• **${it.quantity}x ${it.productName}** @ ₹${it.unitPrice} = ₹${it.quantity * it.unitPrice}`)
          .join("\n");
        const noteSummary = parseResult.data.notes ? `\n📝 Note: "${parseResult.data.notes}"` : "";
        confirmMsg = `✅ **Sales Slip #${slipNumber} Recorded!** (Total: **₹${totalEarned}**)\n${itemsSummary}${noteSummary}\nInventory and earnings update ho gayi hain.`;
      } else if (rawItems && rawItems.length === 1) {
        const item = rawItems[0];
        const noteSummary = parseResult.data.notes ? ` (Note: "${parseResult.data.notes}")` : "";
        confirmMsg = item.productId
          ? `✅ **Sale Recorded & Stock Deducted!** Slip #${slipNumber} (${item.quantity}x ${item.productName}, Total: ₹${totalEarned})${noteSummary}.`
          : `✅ **Custom Sale Recorded!** **${item.quantity}x ${item.productName}** (Unlinked) ka slip #${slipNumber} create ho gaya hai (Total: ₹${totalEarned})${noteSummary}.`;
      } else {
        const quantitySold = parseResult.data.quantity || 1;
        let updatedStockText = "";
        if (productId) {
          const { data: updatedProd } = await (supabase as any)
            .from("products")
            .select("current_stock")
            .eq("id", productId)
            .single();
          if (updatedProd) {
            updatedStockText = ` Naya stock **${updatedProd.current_stock} units** hai.`;
          }
        }
        confirmMsg = productId
          ? `✅ **Sale Recorded & Stock Deducted!** Slip #${slipNumber} create ho gaya hai (Total: ₹${totalEarned}).${updatedStockText}`
          : `✅ **Custom Sale Recorded!** **${quantitySold}x ${productName}** (Unlinked) ka slip #${slipNumber} create ho gaya hai (Total: ₹${totalEarned}). Ise slip history aur earnings mein record kar liya gaya hai.`;
      }

      await (supabase.from("assistant_messages") as any).insert({
        shop_id: shopId,
        user_id: effectiveUserId,
        role: "assistant",
        content: confirmMsg,
        task_type: "record_sale",
        metadata: {
          confirmed: true,
          productId: productId || null,
          productName,
          quantity: rawItems && rawItems.length === 1 ? rawItems[0].quantity : parseResult.data.quantity || 1,
          unitPrice: rawItems && rawItems.length === 1 ? rawItems[0].unitPrice : parseResult.data.unitPrice || 0,
          totalAmount: totalEarned,
          slipNumber,
          notes: noteToSave,
          items: rawItems || null,
        },
      });

      revalidatePath("/dashboard");
      return { success: true, message: confirmMsg, slipNumber, totalAmount: totalEarned };
    }

    if (actionType === "record_order_arrival") {
      const orderItemId = parseResult.data.orderItemId;
      const quantityReceived = parseResult.data.receivedQuantity || parseResult.data.quantity || 1;

      if (!orderItemId || !productId) {
        throw new Error("Missing order item ID or product ID for arrival");
      }

      const res = await recordItemArrivalAction({
        orderItemId,
        productId,
        receivedQuantity: quantityReceived,
        notes: "Arrival recorded via Voice/Chat Assistant",
      });

      if (!res.success) throw new Error(res.error || "Failed to record order arrival");

      const confirmMsg = `✅ **Stock Arrival Recorded!** **${productName}** ke +${quantityReceived} units stock mein add ho gaye hain (Total: **${res.newStock} units**).`;

      await (supabase.from("assistant_messages") as any).insert({
        shop_id: shopId,
        user_id: effectiveUserId,
        role: "assistant",
        content: confirmMsg,
        task_type: "record_order_arrival",
        metadata: {
          confirmed: true,
          productId,
          productName,
          receivedQuantity: quantityReceived,
          newStock: res.newStock,
        },
      });

      revalidatePath("/dashboard");
      return { success: true, message: confirmMsg, newStock: res.newStock };
    }

    if (actionType === "create_restock_order") {
      const rawOrderItems = parseResult.data.orderItems || [];
      if (rawOrderItems.length === 0 && parseResult.data.productName) {
        rawOrderItems.push({
          productId: parseResult.data.productId,
          productName: parseResult.data.productName,
          quantity: parseResult.data.openingStock || 10,
        });
      }

      if (rawOrderItems.length === 0) {
        throw new Error("No restock items specified");
      }

      const finalItems: Array<{
        productId: string;
        productName: string;
        quantity: number;
      }> = [];

      for (const it of rawOrderItems) {
        let pId = it.productId;
        if (!pId) {
          // If brand new or unlinked item, create/link it via quickAddRestockItemAction
          const quickAddRes = await quickAddRestockItemAction({
            shopId,
            name: it.productName,
            quantity: it.quantity,
          });
          if (quickAddRes.success && quickAddRes.product) {
            pId = quickAddRes.product.id;
          }
        }

        if (pId) {
          finalItems.push({
            productId: pId,
            productName: it.productName,
            quantity: it.quantity,
          });
        }
      }

      if (finalItems.length === 0) {
        throw new Error("Could not prepare items for restock order");
      }

      const orderRes = await createRestockOrderAction({
        shopId,
        channel: "whatsapp",
        distributorName: parseResult.data.distributorName || undefined,
        notes: parseResult.data.reason || "Created via Koro Assistant",
        items: finalItems,
      });

      if (!orderRes.success || !orderRes.order) {
        throw new Error(orderRes.error || "Failed to create restock order");
      }

      const orderNumber = orderRes.order.order_number;
      const totalUnits = orderRes.order.total_units;
      const confirmMsg = `✅ **Restock Order Created!** Slip **#${orderNumber}** has been recorded with ${finalItems.length} items (${totalUnits} units total).`;

      await (supabase.from("assistant_messages") as any).insert({
        shop_id: shopId,
        user_id: effectiveUserId,
        role: "assistant",
        content: confirmMsg,
        task_type: "create_restock_order",
        metadata: {
          confirmed: true,
          orderNumber,
          orderId: orderRes.order.id,
          totalUnits,
          itemsCount: finalItems.length,
          lastFocusedProduct: finalItems[0]?.productName,
        },
      });

      revalidatePath("/dashboard");
      return { success: true, message: confirmMsg, order: orderRes.order };
    }

    return { success: false, error: "Unsupported action type" };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to execute action";
    return { success: false, error: errorMsg };
  }

}

// -------------------------------------------------------------
// Fetch All Conversations For Shop Server Action
// -------------------------------------------------------------
export interface AssistantConversationSummary {
  id: string;
  title: string;
  lastMessage: string;
  lastTimestamp: string;
  createdAt: string;
  isLive: boolean;
  messageCount: number;
}

export async function fetchAssistantConversationsAction(shopId: string) {
  if (!shopId) return { success: false, conversations: [] };

  const supabase = await createClient();
  try {
    const { data: messages, error } = await (supabase.from("assistant_messages") as any)
      .select("*")
      .eq("shop_id", shopId)
      .order("created_at", { ascending: false })
      .limit(300);

    if (error) throw error;

    const convMap = new Map<string, AssistantConversationSummary>();

    for (const msg of messages || []) {
      const meta = (msg.metadata as any) || {};
      const convId = meta.conversationId || "conv_legacy";

      if (!convMap.has(convId)) {
        convMap.set(convId, {
          id: convId,
          title: msg.role === "user" ? msg.content : (meta.title || "Store Conversation"),
          lastMessage: msg.content,
          lastTimestamp: msg.created_at,
          createdAt: msg.created_at,
          isLive: !!meta.liveSession,
          messageCount: 1,
        });
      } else {
        const existing = convMap.get(convId)!;
        existing.messageCount += 1;
        existing.createdAt = msg.created_at;
        if (msg.role === "user") {
          existing.title = msg.content;
        }
        if (meta.liveSession) {
          existing.isLive = true;
        }
      }
    }

    const conversations = Array.from(convMap.values()).sort(
      (a, b) => new Date(b.lastTimestamp).getTime() - new Date(a.lastTimestamp).getTime()
    );

    return { success: true, conversations };
  } catch (err) {
    console.error("Failed to load conversations:", err);
    return { success: false, conversations: [] };
  }
}

// -------------------------------------------------------------
// Fetch Messages For Specific Conversation Server Action
// -------------------------------------------------------------
export async function fetchAssistantConversationMessagesAction(
  shopId: string,
  conversationId: string
) {
  if (!shopId) return { success: false, messages: [] };

  const supabase = await createClient();
  try {
    const { data: messages, error } = await (supabase.from("assistant_messages") as any)
      .select("*")
      .eq("shop_id", shopId)
      .order("created_at", { ascending: true })
      .limit(200);

    if (error) throw error;

    const filtered = (messages || []).filter((m: any) => {
      const meta = (m.metadata as any) || {};
      const cId = meta.conversationId || "conv_legacy";
      return cId === conversationId;
    });

    return {
      success: true,
      messages: filtered.map((m: any) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        taskType: m.task_type,
        structuredData: (m.metadata as any)?.structuredData,
        pendingAction: (m.metadata as any)?.pendingAction,
        pendingActions: (m.metadata as any)?.pendingActions,
        createdAt: m.created_at,
      })),
    };
  } catch (err) {
    console.error("Failed to load conversation messages:", err);
    return { success: false, messages: [] };
  }
}

// -------------------------------------------------------------
// Delete Single Conversation Server Action
// -------------------------------------------------------------
export async function deleteAssistantConversationAction(
  shopId: string,
  conversationId: string
) {
  if (!shopId || !conversationId) return { success: false };

  const supabase = await createClient();
  try {
    const { data: messages } = await (supabase.from("assistant_messages") as any)
      .select("id, metadata")
      .eq("shop_id", shopId);

    const idsToDelete = (messages || [])
      .filter((m: any) => ((m.metadata as any)?.conversationId || "conv_legacy") === conversationId)
      .map((m: any) => m.id);

    if (idsToDelete.length > 0) {
      const { error } = await (supabase.from("assistant_messages") as any)
        .delete()
        .in("id", idsToDelete);
      if (error) throw error;
    }

    revalidatePath("/dashboard");
    return { success: true };
  } catch (err) {
    console.error("Failed to delete conversation:", err);
    return { success: false };
  }
}

// -------------------------------------------------------------
// Fetch Conversation History Server Action (Legacy / Fallback)
// -------------------------------------------------------------
export async function fetchAssistantHistoryAction(shopId: string) {
  if (!shopId) return { success: false, messages: [] };

  const supabase = await createClient();
  try {
    const { data: messages, error } = await (supabase.from("assistant_messages") as any)
      .select("*")
      .eq("shop_id", shopId)
      .order("created_at", { ascending: true })
      .limit(30);

    if (error) throw error;

    return { success: true, messages: messages || [] };
  } catch (err) {
    console.error("Failed to load assistant history:", err);
    return { success: false, messages: [] };
  }
}

// -------------------------------------------------------------
// Clear All Conversation History Server Action
// -------------------------------------------------------------
export async function clearAssistantHistoryAction(shopId: string) {
  if (!shopId) return { success: false };

  const supabase = await createClient();
  try {
    const { error } = await (supabase.from("assistant_messages") as any)
      .delete()
      .eq("shop_id", shopId);

    if (error) throw error;
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err) {
    return { success: false };
  }
}
