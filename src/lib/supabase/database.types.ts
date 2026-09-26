// =============================================================================
// Supabase database types — Al Zajel Rent Car
//
// Generated from supabase/migrations/20260101000000_schema.sql.
// To regenerate against a live project when credentials are available:
//   npx supabase gen types typescript --project-id $SUPABASE_PROJECT_ID --schema public > src/lib/supabase/database.types.ts
// =============================================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      admins: {
        Row: {
          id: string;
          user_id: string;
          role: Database["public"]["Enums"]["admin_role"];
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role?: Database["public"]["Enums"]["admin_role"];
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: Database["public"]["Enums"]["admin_role"];
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "admins_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      bookings: {
        Row: {
          id: string;
          booking_reference: string;
          customer_id: string;
          car_id: string;
          pickup_location_id: string | null;
          pickup_date: string;
          return_date: string;
          pickup_time: string | null;
          return_time: string | null;
          status: Database["public"]["Enums"]["booking_status"];
          total_price: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          booking_reference?: string;
          customer_id: string;
          car_id: string;
          pickup_location_id?: string | null;
          pickup_date: string;
          return_date: string;
          pickup_time?: string | null;
          return_time?: string | null;
          status?: Database["public"]["Enums"]["booking_status"];
          total_price?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          booking_reference?: string;
          customer_id?: string;
          car_id?: string;
          pickup_location_id?: string | null;
          pickup_date?: string;
          return_date?: string;
          pickup_time?: string | null;
          return_time?: string | null;
          status?: Database["public"]["Enums"]["booking_status"];
          total_price?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bookings_car_id_fkey";
            columns: ["car_id"];
            referencedRelation: "cars";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookings_customer_id_fkey";
            columns: ["customer_id"];
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookings_pickup_location_id_fkey";
            columns: ["pickup_location_id"];
            referencedRelation: "locations";
            referencedColumns: ["id"];
          },
        ];
      };
      car_images: {
        Row: {
          id: string;
          car_id: string;
          image_url: string;
          alt_text_ar: string | null;
          alt_text_en: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          car_id: string;
          image_url: string;
          alt_text_ar?: string | null;
          alt_text_en?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          car_id?: string;
          image_url?: string;
          alt_text_ar?: string | null;
          alt_text_en?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "car_images_car_id_fkey";
            columns: ["car_id"];
            referencedRelation: "cars";
            referencedColumns: ["id"];
          },
        ];
      };
      cars: {
        Row: {
          id: string;
          brand: string;
          model: string;
          year: number;
          type: string;
          category: string;
          description_ar: string | null;
          description_en: string | null;
          short_description_ar: string | null;
          short_description_en: string | null;
          daily_price: number;
          weekly_price: number | null;
          monthly_price: number | null;
          doors: number;
          transmission: Database["public"]["Enums"]["transmission_type"];
          fuel_type: string | null;
          color: string | null;
          status: Database["public"]["Enums"]["car_status"];
          featured: boolean;
          features: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          brand: string;
          model: string;
          year: number;
          type: string;
          category: string;
          description_ar?: string | null;
          description_en?: string | null;
          short_description_ar?: string | null;
          short_description_en?: string | null;
          daily_price: number;
          weekly_price?: number | null;
          monthly_price?: number | null;
          doors?: number;
          transmission?: Database["public"]["Enums"]["transmission_type"];
          fuel_type?: string | null;
          color?: string | null;
          status?: Database["public"]["Enums"]["car_status"];
          featured?: boolean;
          features?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          brand?: string;
          model?: string;
          year?: number;
          type?: string;
          category?: string;
          description_ar?: string | null;
          description_en?: string | null;
          short_description_ar?: string | null;
          short_description_en?: string | null;
          daily_price?: number;
          weekly_price?: number | null;
          monthly_price?: number | null;
          doors?: number;
          transmission?: Database["public"]["Enums"]["transmission_type"];
          fuel_type?: string | null;
          color?: string | null;
          status?: Database["public"]["Enums"]["car_status"];
          featured?: boolean;
          features?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      customers: {
        Row: {
          id: string;
          user_id: string | null;
          full_name: string;
          email: string | null;
          phone: string;
          nationality: string | null;
          driving_license_number: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          full_name: string;
          email?: string | null;
          phone: string;
          nationality?: string | null;
          driving_license_number?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          full_name?: string;
          email?: string | null;
          phone?: string;
          nationality?: string | null;
          driving_license_number?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "customers_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      locations: {
        Row: {
          id: string;
          name_ar: string;
          name_en: string;
          address_ar: string | null;
          address_en: string | null;
          latitude: number | null;
          longitude: number | null;
          phone: string | null;
          opening_hours: string | null;
          active: boolean;
        };
        Insert: {
          id?: string;
          name_ar: string;
          name_en: string;
          address_ar?: string | null;
          address_en?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          phone?: string | null;
          opening_hours?: string | null;
          active?: boolean;
        };
        Update: {
          id?: string;
          name_ar?: string;
          name_en?: string;
          address_ar?: string | null;
          address_en?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          phone?: string | null;
          opening_hours?: string | null;
          active?: boolean;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          type: string;
          reference: string | null;
          message: string | null;
          meta: Json | null;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          type: string;
          reference?: string | null;
          message?: string | null;
          meta?: Json | null;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          type?: string;
          reference?: string | null;
          message?: string | null;
          meta?: Json | null;
          read?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      site_settings: {
        Row: {
          id: number;
          company_name_ar: string | null;
          company_name_en: string | null;
          email: string | null;
          phone: string | null;
          address_ar: string | null;
          address_en: string | null;
          google_maps_url: string | null;
          instagram_url: string | null;
          tiktok_url: string | null;
          snapchat_url: string | null;
          business_hours: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          company_name_ar?: string | null;
          company_name_en?: string | null;
          email?: string | null;
          phone?: string | null;
          address_ar?: string | null;
          address_en?: string | null;
          google_maps_url?: string | null;
          instagram_url?: string | null;
          tiktok_url?: string | null;
          snapchat_url?: string | null;
          business_hours?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          company_name_ar?: string | null;
          company_name_en?: string | null;
          email?: string | null;
          phone?: string | null;
          address_ar?: string | null;
          address_en?: string | null;
          google_maps_url?: string | null;
          instagram_url?: string | null;
          tiktok_url?: string | null;
          snapchat_url?: string | null;
          business_hours?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      page_views: {
        Row: {
          id: number;
          visitor_id: string;
          path: string;
          lang: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          visitor_id: string;
          path: string;
          lang?: string | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          visitor_id?: string;
          path?: string;
          lang?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "page_views_visitor_id_fkey";
            columns: ["visitor_id"];
            referencedRelation: "page_visitors";
            referencedColumns: ["id"];
          },
        ];
      };
      page_visitors: {
        Row: {
          id: string;
          first_seen: string;
          last_seen: string;
          created_at: string;
        };
        Insert: {
          id: string;
          first_seen?: string;
          last_seen?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          first_seen?: string;
          last_seen?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      car_available_for_dates: {
        Args: {
          p_car_id: string;
          p_pickup_date: string;
          p_return_date: string;
        };
        Returns: boolean;
      };
      check_car_availability: {
        Args: {
          p_car_id: string;
          p_pickup_date: string;
          p_return_date: string;
        };
        Returns: boolean;
      };
      get_available_cars: {
        Args: {
          p_pickup_date: string;
          p_return_date: string;
        };
        Returns: Database["public"]["Tables"]["cars"]["Row"][];
      };
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_super_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      set_updated_at: {
        Args: Record<PropertyKey, never>;
        Returns: unknown;
      };
    };
    Enums: {
      admin_role: "super_admin" | "admin";
      booking_status: "pending" | "confirmed" | "active" | "completed" | "cancelled";
      car_status: "available" | "booked";
      transmission_type: "automatic" | "manual";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
        Database["public"]["Views"])
    ? (Database["public"]["Tables"] &
        Database["public"]["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
        Database["public"]["Views"])
    ? (Database["public"]["Tables"] &
        Database["public"]["Views"])[PublicTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
        Database["public"]["Views"])
    ? (Database["public"]["Tables"] &
        Database["public"]["Views"])[PublicTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
    ? Database["public"]["Enums"][PublicEnumNameOrOptions]
    : never;

export type DefaultSchema = Database[Extract<keyof Database, string>];

export type GenericTable = {
  Row: Record<string, unknown>;
  Insert: Record<string, unknown>;
  Update: Record<string, unknown>;
};

export type GenericView = {
  Row: Record<string, unknown>;
};

export type GenericFunction = {
  Args: Record<string, unknown>;
  Returns: unknown;
};

export type GenericSchema = {
  Tables: Record<string, GenericTable>;
  Views: Record<string, GenericView>;
  Functions: Record<string, GenericFunction>;
};