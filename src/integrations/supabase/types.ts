export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      alternatives: {
        Row: {
          alt_product_id: string
          created_at: string
          eco_delta: number
          explanation: string | null
          id: string
          price_delta_clp: number
          product_id: string
          similarity: number
          social_delta: number
        }
        Insert: {
          alt_product_id: string
          created_at?: string
          eco_delta?: number
          explanation?: string | null
          id?: string
          price_delta_clp?: number
          product_id: string
          similarity: number
          social_delta?: number
        }
        Update: {
          alt_product_id?: string
          created_at?: string
          eco_delta?: number
          explanation?: string | null
          id?: string
          price_delta_clp?: number
          product_id?: string
          similarity?: number
          social_delta?: number
        }
        Relationships: [
          {
            foreignKeyName: "alternatives_alt_product_id_fkey"
            columns: ["alt_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alternatives_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      price_snapshots: {
        Row: {
          captured_at: string
          id: string
          price_clp: number
          product_id: string
          store_id: string
        }
        Insert: {
          captured_at?: string
          id?: string
          price_clp: number
          product_id: string
          store_id: string
        }
        Update: {
          captured_at?: string
          id?: string
          price_clp?: number
          product_id?: string
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_snapshots_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_snapshots_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          barcode: string
          brand: string
          carbon_gco2e: number | null
          category: string
          created_at: string
          eco_score: number
          id: string
          image_url: string | null
          labels: Json | null
          last_seen_price_clp: number
          last_vendor: string | null
          name: string
          nutrients: Json | null
          social_score: number
          updated_at: string
        }
        Insert: {
          barcode: string
          brand: string
          carbon_gco2e?: number | null
          category: string
          created_at?: string
          eco_score?: number
          id?: string
          image_url?: string | null
          labels?: Json | null
          last_seen_price_clp?: number
          last_vendor?: string | null
          name: string
          nutrients?: Json | null
          social_score?: number
          updated_at?: string
        }
        Update: {
          barcode?: string
          brand?: string
          carbon_gco2e?: number | null
          category?: string
          created_at?: string
          eco_score?: number
          id?: string
          image_url?: string | null
          labels?: Json | null
          last_seen_price_clp?: number
          last_vendor?: string | null
          name?: string
          nutrients?: Json | null
          social_score?: number
          updated_at?: string
        }
        Relationships: []
      }
      shopping_list_items: {
        Row: {
          chosen_price_clp: number | null
          created_at: string
          id: string
          list_id: string
          locked: boolean
          product_id: string
          quantity: number
          vendor: string | null
        }
        Insert: {
          chosen_price_clp?: number | null
          created_at?: string
          id?: string
          list_id: string
          locked?: boolean
          product_id: string
          quantity?: number
          vendor?: string | null
        }
        Update: {
          chosen_price_clp?: number | null
          created_at?: string
          id?: string
          list_id?: string
          locked?: boolean
          product_id?: string
          quantity?: number
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shopping_list_items_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "shopping_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopping_list_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      shopping_lists: {
        Row: {
          budget_clp: number
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string | null
          user_location_lat: number | null
          user_location_lon: number | null
        }
        Insert: {
          budget_clp?: number
          created_at?: string
          id?: string
          title: string
          updated_at?: string
          user_id?: string | null
          user_location_lat?: number | null
          user_location_lon?: number | null
        }
        Update: {
          budget_clp?: number
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string | null
          user_location_lat?: number | null
          user_location_lon?: number | null
        }
        Relationships: []
      }
      stores: {
        Row: {
          address: string
          created_at: string
          id: string
          lat: number
          lon: number
          name: string
          vendor_code: string
        }
        Insert: {
          address: string
          created_at?: string
          id?: string
          lat: number
          lon: number
          name: string
          vendor_code: string
        }
        Update: {
          address?: string
          created_at?: string
          id?: string
          lat?: number
          lon?: number
          name?: string
          vendor_code?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
