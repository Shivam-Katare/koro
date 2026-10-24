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
import { recordItemArrivalAction } from "@/lib/actions/restock-actions";

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
    | "general";
  structuredData?: any;
  pendingAction?: AssistantPendingAction | null;
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
  executeGetSalesHistory,
  executeGetRestockOrdersSummary,
  executeProposeRecordArrival,
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

  if (!user) {
    return { success: false, error: "Please sign in to talk to your assistant" };
  }

  const { shopId, query, conversationId } = parseResult.data;

  // 1. Record user message in Supabase
  await (supabase.from("assistant_messages") as any).insert({
    shop_id: shopId,
    user_id: user.id,
    role: "user",
    content: query,
    task_type: "general",
    metadata: {
      conversationId: conversationId || null,
    },
  });

  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  // Check fast local intent first (saves 100% of LLM tokens for standard phrases)
  const localMatch = matchLocalIntent(query);
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
    } else if (localMatch.intent === "record_sale" && localMatch.target) {
      const res = await executeProposeRecordSale(supabase, shopId, {
        productName: localMatch.target,
        quantity: (localMatch as any).quantity,
        unitPrice: (localMatch as any).unitPrice,
      });
      resultPayload = { role: "assistant", ...res };
    } else if (localMatch.intent === "sales_history") {
      const res = await executeGetSalesHistory(supabase, shopId, (localMatch as any).dateQuery);
      resultPayload = { role: "assistant", ...res };
    } else if (localMatch.intent === "restock_orders") {
      const res = await executeGetRestockOrdersSummary(supabase, shopId, (localMatch as any).queryType);
      resultPayload = { role: "assistant", ...res };
    }

    if (resultPayload) {
      // Save assistant response to DB
      await (supabase.from("assistant_messages") as any).insert({
        shop_id: shopId,
        user_id: user.id,
        role: "assistant",
        content: resultPayload.content,
        task_type: resultPayload.taskType,
        metadata: {
          conversationId: conversationId || null,
          structuredData: resultPayload.structuredData || null,
          pendingAction: resultPayload.pendingAction || null,
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
              description: "Find a product and its physical shelf/drawer storage location in the shop",
              parameters: {
                type: Type.OBJECT,
                properties: {
                  productName: {
                    type: Type.STRING,
                    description: "The name or keyword of the product (e.g. Lakme, Tata Tea)",
                  },
                },
                required: ["productName"],
              },
            },
            {
              name: "check_product_stock",
              description: "Check the current stock quantity and status of a product",
              parameters: {
                type: Type.OBJECT,
                properties: {
                  productName: {
                    type: Type.STRING,
                    description: "The name or keyword of the product",
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
              description: "Propose recording a counter sale of products (e.g. 'Today I sold 5 Lakme items at 50', 'Maine Bahubali ki lal chudi bechi hai'). Also supports unlinked/custom items that are not yet in the inventory catalog (e.g. bangles, custom goods, loose items) without refusing.",
              parameters: {
                type: Type.OBJECT,
                properties: {
                  productName: {
                    type: Type.STRING,
                    description: "Product sold",
                  },
                  quantity: {
                    type: Type.INTEGER,
                    description: "Number of units sold",
                  },
                  unitPrice: {
                    type: Type.NUMBER,
                    description: "Price per unit in rupees if mentioned",
                  },
                  notes: {
                    type: Type.STRING,
                    description: "Optional notes",
                  },
                },
                required: ["productName", "quantity"],
              },
            },
            {
              name: "query_sales_history",
              description: "Lookup past sales slips and total earnings/revenue for a specific date or period (e.g. 'On 20th January 2026 how much money did I earn', 'today sales', 'how much sales happened').",
              parameters: {
                type: Type.OBJECT,
                properties: {
                  dateQuery: {
                    type: Type.STRING,
                    description: "Target date or period (e.g. '20th January 2026', '2026-01-20', 'today', 'yesterday')",
                  },
                },
              },
            },
            {
              name: "query_restock_orders",
              description: "Query restock orders, past purchase orders, cancelled orders, waiting/pending orders, delivered orders, unit counts, and whether new restock orders are needed.",
              parameters: {
                type: Type.OBJECT,
                properties: {
                  queryType: {
                    type: Type.STRING,
                    description: "Type of inquiry: 'cancelled', 'waiting', 'delivered', 'needs_reorder', or 'all'",
                  },
                },
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
          ],
        },
      ];

      const systemInstruction = `You are "Koro", the voice assistant for an Indian retail shopkeeper (kirana, cosmetics, general store).
Rules:
1. Always be concise, fast, and polite. Shopkeepers use this during busy store rush hours.
2. Never invent stock counts, locations, or prices. Always call the corresponding tool.
3. If an inventory change is requested (e.g. add/deduct stock), call propose_stock_adjustment so the shopkeeper can confirm before anything changes.
4. If asked to add a new product, call propose_create_product.
5. If asked for total products or store inventory summary, call get_store_inventory_summary. Remember: total products = distinct catalog products (e.g. 2 items), total units = sum of stock quantities (e.g. 7 pieces). Do NOT confuse them.
6. If asked to update or assign location, call propose_update_product_location.
7. If asked to update or assign price, call propose_update_product_price.
8. If user mentions selling items or recording a sale (e.g. "Today I sold 5 Lakme items", "Sold 5 Lakme at 50", "5 Lakme beche", "Maine abhi-abhi Bahubali ki lal chudi bechi hai. Use sale me add kar"), ALWAYS call propose_record_sale. If the item is not found in the inventory catalog, DO NOT REFUSE IT! The store supports unlinked / custom items; propose_record_sale will create an unlinked custom sales slip.
9. If user asks about earnings or sales history by date (e.g. "On 20th January 2026 how much money did I earn", "how much sales happened", "today's earnings"), call query_sales_history.
10. If user asks about restock orders, cancelled orders, waiting orders, delivered orders, unit counts, or whether they need to place a new order, call query_restock_orders.
11. If user says an order or restock arrived, call propose_record_order_arrival.
12. If user asks to delete a product (e.g. "Delete product Lakme"), call propose_delete_product. Never delete without confirmation.
13. If multiple items match, the tools will automatically return clarifying options. Be friendly and helpful.
14. Support English and Hinglish (e.g. "Lakme kahan hai", "kitna bacha hai", "aaj kitni sale hui").
15. Keep your final answer short and clear.`;

      const response = await ai.models.generateContent({
        model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
        contents: query,
        config: {
          systemInstruction,
          tools,
          temperature: 0.2,
        },
      });

      const functionCalls = response.functionCalls;
      if (functionCalls && functionCalls.length > 0) {
        const call = functionCalls[0];
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
            productName: args.productName || query,
            quantity: Number(args.quantity) || 1,
            unitPrice: args.unitPrice !== undefined ? Number(args.unitPrice) : undefined,
            notes: args.notes,
          });
        } else if (call.name === "query_sales_history") {
          toolResult = await executeGetSalesHistory(
            supabase,
            shopId,
            args.dateQuery || query
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
        }

        if (toolResult) {
          const finalPayload: AssistantResponsePayload = {
            role: "assistant",
            content: toolResult.content,
            taskType: toolResult.taskType,
            structuredData: toolResult.structuredData,
            pendingAction: toolResult.pendingAction,
          };

          await (supabase.from("assistant_messages") as any).insert({
            shop_id: shopId,
            user_id: user.id,
            role: "assistant",
            content: finalPayload.content,
            task_type: finalPayload.taskType,
            metadata: {
              conversationId: conversationId || null,
              structuredData: finalPayload.structuredData || null,
              pendingAction: finalPayload.pendingAction || null,
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
        user_id: user.id,
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

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

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
        user_id: user.id,
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
          user_id: user.id,
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
        user_id: user.id,
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
        user_id: user.id,
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
        user_id: user.id,
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
        user_id: user.id,
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
      const quantitySold = parseResult.data.quantity || 1;
      const unitPriceSold =
        parseResult.data.unitPrice !== undefined
          ? parseResult.data.unitPrice
          : sellingPrice !== undefined
          ? sellingPrice
          : 0;

      const dateTag = new Date().toISOString().slice(2, 10).replace(/-/g, "");
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const slipNumber = `SLIP-${dateTag}-${randomSuffix}`;
      const idempotencyKey = `sale-${Date.now()}-${randomSuffix}`;

      const slipLines = [
        {
          product_id: productId || null,
          raw_item_name: productName,
          quantity: quantitySold,
          unit_price: unitPriceSold,
          is_tracked: Boolean(productId),
          status: productId ? "matched" : "untracked",
        },
      ];

      const { data: saleResult, error: saleErr } = await (supabase as any).rpc("record_sales_slip", {
        p_shop_id: shopId,
        p_slip_number: slipNumber,
        p_source: "manual",
        p_notes: reason || "Recorded via Voice/Chat Assistant",
        p_idempotency_key: idempotencyKey,
        p_lines: slipLines,
      });

      if (saleErr) throw saleErr;

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

      const totalEarned = quantitySold * unitPriceSold;
      const confirmMsg = productId
        ? `✅ **Sale Recorded & Stock Deducted!** Slip #${slipNumber} create ho gaya hai (Total: ₹${totalEarned}).${updatedStockText}`
        : `✅ **Custom Sale Recorded!** **${quantitySold}x ${productName}** (Unlinked) ka slip #${slipNumber} create ho gaya hai (Total: ₹${totalEarned}). Ise slip history aur earnings mein record kar liya gaya hai.`;

      await (supabase.from("assistant_messages") as any).insert({
        shop_id: shopId,
        user_id: user.id,
        role: "assistant",
        content: confirmMsg,
        task_type: "record_sale",
        metadata: {
          confirmed: true,
          productId,
          productName,
          quantity: quantitySold,
          unitPrice: unitPriceSold,
          totalAmount: totalEarned,
          slipNumber,
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
        user_id: user.id,
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
