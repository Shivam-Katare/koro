export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  zibbi: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          phone: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          email: string;
          phone?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string;
          phone?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      shops: {
        Row: {
          id: string;
          name: string;
          category: string;
          description: string | null;
          whatsapp_number: string | null;
          owner_id: string | null;
          currency: string;
          is_demo: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category: string;
          description?: string | null;
          whatsapp_number?: string | null;
          owner_id?: string | null;
          currency?: string;
          is_demo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          category?: string;
          description?: string | null;
          whatsapp_number?: string | null;
          owner_id?: string | null;
          currency?: string;
          is_demo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      shop_members: {
        Row: {
          id: string;
          shop_id: string;
          user_id: string;
          role: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          shop_id: string;
          user_id: string;
          role: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          shop_id?: string;
          user_id?: string;
          role?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          shop_id: string;
          name: string;
          category: string;
          brand: string | null;
          barcode: string | null;
          current_stock: number;
          min_stock_threshold: number | null;
          selling_price: number | null;
          cost_price: number | null;
          storage_location: string | null;
          stock_status: "in_stock" | "low_stock" | "out_of_stock" | "unknown";
          attributes: Record<string, any>;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          shop_id: string;
          name: string;
          category: string;
          brand?: string | null;
          barcode?: string | null;
          current_stock?: number;
          min_stock_threshold?: number | null;
          selling_price?: number | null;
          cost_price?: number | null;
          storage_location?: string | null;
          stock_status?: "in_stock" | "low_stock" | "out_of_stock" | "unknown";
          attributes?: Record<string, any>;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          shop_id?: string;
          name?: string;
          category?: string;
          brand?: string | null;
          barcode?: string | null;
          current_stock?: number;
          min_stock_threshold?: number | null;
          selling_price?: number | null;
          cost_price?: number | null;
          storage_location?: string | null;
          stock_status?: "in_stock" | "low_stock" | "out_of_stock" | "unknown";
          attributes?: Record<string, any>;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      stock_movements: {
        Row: {
          id: string;
          shop_id: string;
          product_id: string;
          quantity_delta: number;
          previous_stock: number;
          new_stock: number;
          reason: "opening_stock" | "manual_adjustment" | "sale_slip" | "delivery_restock" | "correction";
          notes: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          shop_id: string;
          product_id: string;
          quantity_delta: number;
          previous_stock: number;
          new_stock: number;
          reason: "opening_stock" | "manual_adjustment" | "sale_slip" | "delivery_restock" | "correction";
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          shop_id?: string;
          product_id?: string;
          quantity_delta?: number;
          previous_stock?: number;
          new_stock?: number;
          reason?: "opening_stock" | "manual_adjustment" | "sale_slip" | "delivery_restock" | "correction";
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      sales_slips: {
        Row: {
          id: string;
          shop_id: string;
          slip_number: string;
          slip_date: string;
          status: "draft" | "confirmed" | "cancelled";
          source: "manual" | "ocr_slip";
          total_amount: number;
          total_items: number;
          notes: string | null;
          idempotency_key: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          shop_id: string;
          slip_number: string;
          slip_date?: string;
          status?: "draft" | "confirmed" | "cancelled";
          source?: "manual" | "ocr_slip";
          total_amount?: number;
          total_items?: number;
          notes?: string | null;
          idempotency_key?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          shop_id?: string;
          slip_number?: string;
          slip_date?: string;
          status?: "draft" | "confirmed" | "cancelled";
          source?: "manual" | "ocr_slip";
          total_amount?: number;
          total_items?: number;
          notes?: string | null;
          idempotency_key?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      sales_slip_lines: {
        Row: {
          id: string;
          slip_id: string;
          shop_id: string;
          product_id: string | null;
          raw_item_name: string;
          quantity: number;
          unit_price: number | null;
          subtotal: number | null;
          is_tracked: boolean;
          status: "matched" | "untracked" | "unresolved";
          created_at: string;
        };
        Insert: {
          id?: string;
          slip_id: string;
          shop_id: string;
          product_id?: string | null;
          raw_item_name: string;
          quantity?: number;
          unit_price?: number | null;
          subtotal?: number | null;
          is_tracked?: boolean;
          status?: "matched" | "untracked" | "unresolved";
          created_at?: string;
        };
        Update: {
          id?: string;
          slip_id?: string;
          shop_id?: string;
          product_id?: string | null;
          raw_item_name?: string;
          quantity?: number;
          unit_price?: number | null;
          subtotal?: number | null;
          is_tracked?: boolean;
          status?: "matched" | "untracked" | "unresolved";
          created_at?: string;
        };
        Relationships: [];
      };
      restock_orders: {
        Row: {
          id: string;
          shop_id: string;
          order_number: string;
          order_date: string;
          status: "draft" | "ordered" | "received" | "cancelled";
          channel: "whatsapp" | "copy_clipboard" | "manual";
          distributor_name: string | null;
          notes: string | null;
          total_items: number;
          total_units: number;
          received_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          shop_id: string;
          order_number: string;
          order_date?: string;
          status?: "draft" | "ordered" | "received" | "cancelled";
          channel?: "whatsapp" | "copy_clipboard" | "manual";
          distributor_name?: string | null;
          notes?: string | null;
          total_items?: number;
          total_units?: number;
          received_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          shop_id?: string;
          order_number?: string;
          order_date?: string;
          status?: "draft" | "ordered" | "received" | "cancelled";
          channel?: "whatsapp" | "copy_clipboard" | "manual";
          distributor_name?: string | null;
          notes?: string | null;
          total_items?: number;
          total_units?: number;
          received_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      restock_order_items: {
        Row: {
          id: string;
          order_id: string;
          shop_id: string;
          product_id: string;
          product_name: string;
          ordered_quantity: number;
          received_quantity: number | null;
          status: "pending" | "received" | "cancelled";
          received_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          shop_id: string;
          product_id: string;
          product_name: string;
          ordered_quantity: number;
          received_quantity?: number | null;
          status?: "pending" | "received" | "cancelled";
          received_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          shop_id?: string;
          product_id?: string;
          product_name?: string;
          ordered_quantity?: number;
          received_quantity?: number | null;
          status?: "pending" | "received" | "cancelled";
          received_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      assistant_messages: {
        Row: {
          id: string;
          shop_id: string;
          user_id: string | null;
          role: "user" | "assistant" | "system";
          content: string;
          task_type: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          shop_id: string;
          user_id?: string | null;
          role: "user" | "assistant" | "system";
          content: string;
          task_type?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          shop_id?: string;
          user_id?: string | null;
          role?: "user" | "assistant" | "system";
          content?: string;
          task_type?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_user_shops: {
        Args: { p_user_id: string };
        Returns: string[];
      };
      is_shop_member: {
        Args: { p_shop_id: string; p_user_id?: string };
        Returns: boolean;
      };
      is_shop_owner: {
        Args: { p_shop_id: string; p_user_id?: string };
        Returns: boolean;
      };
      create_shop_with_owner: {
        Args: {
          p_name: string;
          p_category: string;
          p_whatsapp_number: string;
          p_full_name: string;
        };
        Returns: Json;
      };
      create_product_with_stock: {
        Args: {
          p_shop_id: string;
          p_name: string;
          p_category: string;
          p_opening_stock?: number;
          p_brand?: string | null;
          p_barcode?: string | null;
          p_selling_price?: number | null;
          p_cost_price?: number | null;
          p_min_stock_threshold?: number | null;
          p_storage_location?: string | null;
          p_attributes?: Json;
          p_description?: string | null;
        };
        Returns: Json;
      };
      adjust_product_stock: {
        Args: {
          p_product_id: string;
          p_new_stock: number;
          p_reason?: string;
          p_notes?: string | null;
        };
        Returns: Json;
      };
      record_sales_slip: {
        Args: {
          p_shop_id: string;
          p_slip_number: string;
          p_source?: string;
          p_notes?: string | null;
          p_idempotency_key?: string | null;
          p_lines?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type Profile = Database["zibbi"]["Tables"]["profiles"]["Row"];
export type Shop = Database["zibbi"]["Tables"]["shops"]["Row"];
export type ShopMember = Database["zibbi"]["Tables"]["shop_members"]["Row"];
export type Product = Database["zibbi"]["Tables"]["products"]["Row"];
export type StockMovement = Database["zibbi"]["Tables"]["stock_movements"]["Row"];
export type SalesSlip = Database["zibbi"]["Tables"]["sales_slips"]["Row"];
export type SalesSlipLine = Database["zibbi"]["Tables"]["sales_slip_lines"]["Row"];
export type RestockOrder = Database["zibbi"]["Tables"]["restock_orders"]["Row"];
export type RestockOrderItemRow = Database["zibbi"]["Tables"]["restock_order_items"]["Row"];
export type AssistantMessage = Database["zibbi"]["Tables"]["assistant_messages"]["Row"];

