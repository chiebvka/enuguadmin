export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      blogpost_tags: {
        Row: {
          blogpost_id: string
          tag_id: string
        }
        Insert: {
          blogpost_id: string
          tag_id: string
        }
        Update: {
          blogpost_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blogpost_tags_blogpost_id_fkey"
            columns: ["blogpost_id"]
            isOneToOne: false
            referencedRelation: "blogposts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blogpost_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      blogposts: {
        Row: {
          author_id: string | null
          content: Json | null
          cover_image: string | null
          created_at: string | null
          id: string
          slug: string
          title: string
          updated_at: string | null
        }
        Insert: {
          author_id?: string | null
          content?: Json | null
          cover_image?: string | null
          created_at?: string | null
          id?: string
          slug: string
          title: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string | null
          content?: Json | null
          cover_image?: string | null
          created_at?: string | null
          id?: string
          slug?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blogposts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          description: string | null
          end_time: string | null
          event_date: string | null
          event_time: string | null
          id: string
          name: string | null
          profile_id: string | null
          start_time: string | null
          summary: string | null
          venue: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_time?: string | null
          event_date?: string | null
          event_time?: string | null
          id?: string
          name?: string | null
          profile_id?: string | null
          start_time?: string | null
          summary?: string | null
          venue?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          end_time?: string | null
          event_date?: string | null
          event_time?: string | null
          id?: string
          name?: string | null
          profile_id?: string | null
          start_time?: string | null
          summary?: string | null
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      membership: {
        Row: {
          address: string | null
          approved_by: string | null
          approved_on: string | null
          bio: string | null
          created_at: string
          denied_by: string | null
          denied_on: string | null
          dob: string | null
          email: string | null
          first_name: string | null
          id: number
          last_name: string | null
          lga: string | null
          member_no: string | null
          mobile: string | null
          name: string | null
          removed: boolean | null
          removed_on: string | null
          status: string | null
        }
        Insert: {
          address?: string | null
          approved_by?: string | null
          approved_on?: string | null
          bio?: string | null
          created_at?: string
          denied_by?: string | null
          denied_on?: string | null
          dob?: string | null
          email?: string | null
          first_name?: string | null
          id?: number
          last_name?: string | null
          lga?: string | null
          member_no?: string | null
          mobile?: string | null
          name?: string | null
          removed?: boolean | null
          removed_on?: string | null
          status?: string | null
        }
        Update: {
          address?: string | null
          approved_by?: string | null
          approved_on?: string | null
          bio?: string | null
          created_at?: string
          denied_by?: string | null
          denied_on?: string | null
          dob?: string | null
          email?: string | null
          first_name?: string | null
          id?: number
          last_name?: string | null
          lga?: string | null
          member_no?: string | null
          mobile?: string | null
          name?: string | null
          removed?: boolean | null
          removed_on?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "membership_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_denied_by_fkey"
            columns: ["denied_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          email: string | null
          id: string
        }
        Insert: {
          email?: string | null
          id: string
        }
        Update: {
          email?: string | null
          id?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          id: string
          slug: string
          title: string
        }
        Insert: {
          id?: string
          slug: string
          title: string
        }
        Update: {
          id?: string
          slug?: string
          title?: string
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
