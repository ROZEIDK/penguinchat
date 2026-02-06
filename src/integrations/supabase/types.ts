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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      apps: {
        Row: {
          app_code: string
          category: string | null
          created_at: string
          description: string
          downloads: number | null
          icon: string
          id: string
          is_approved: boolean | null
          name: string
          rating: number | null
          size: string
          updated_at: string
          user_id: string
          version: string
        }
        Insert: {
          app_code: string
          category?: string | null
          created_at?: string
          description: string
          downloads?: number | null
          icon: string
          id?: string
          is_approved?: boolean | null
          name: string
          rating?: number | null
          size?: string
          updated_at?: string
          user_id: string
          version?: string
        }
        Update: {
          app_code?: string
          category?: string | null
          created_at?: string
          description?: string
          downloads?: number | null
          icon?: string
          id?: string
          is_approved?: boolean | null
          name?: string
          rating?: number | null
          size?: string
          updated_at?: string
          user_id?: string
          version?: string
        }
        Relationships: []
      }
      book_chatbot_links: {
        Row: {
          book_id: string
          chatbot_id: string
          created_at: string
          id: string
        }
        Insert: {
          book_id: string
          chatbot_id: string
          created_at?: string
          id?: string
        }
        Update: {
          book_id?: string
          chatbot_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "book_chatbot_links_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_chatbot_links_chatbot_id_fkey"
            columns: ["chatbot_id"]
            isOneToOne: false
            referencedRelation: "chatbots"
            referencedColumns: ["id"]
          },
        ]
      }
      book_comments: {
        Row: {
          book_id: string
          content: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          book_id: string
          content: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          book_id?: string
          content?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "book_comments_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      book_reviews: {
        Row: {
          book_id: string
          created_at: string
          id: string
          rating: number
          review_text: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          book_id: string
          created_at?: string
          id?: string
          rating: number
          review_text?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          book_id?: string
          created_at?: string
          id?: string
          rating?: number
          review_text?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "book_reviews_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      bookmarks: {
        Row: {
          created_at: string
          favicon: string | null
          id: string
          title: string
          updated_at: string
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          favicon?: string | null
          id?: string
          title: string
          updated_at?: string
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          favicon?: string | null
          id?: string
          title?: string
          updated_at?: string
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      books: {
        Row: {
          content: string | null
          cover_url: string | null
          created_at: string
          creator_id: string
          description: string | null
          id: string
          is_public: boolean | null
          pdf_url: string | null
          tags: string[] | null
          title: string
          total_views: number | null
          updated_at: string
        }
        Insert: {
          content?: string | null
          cover_url?: string | null
          created_at?: string
          creator_id: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          pdf_url?: string | null
          tags?: string[] | null
          title: string
          total_views?: number | null
          updated_at?: string
        }
        Update: {
          content?: string | null
          cover_url?: string | null
          created_at?: string
          creator_id?: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          pdf_url?: string | null
          tags?: string[] | null
          title?: string
          total_views?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      browsing_history: {
        Row: {
          created_at: string
          id: string
          title: string | null
          url: string
          user_id: string
          visited_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string | null
          url: string
          user_id: string
          visited_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string | null
          url?: string
          user_id?: string
          visited_at?: string
        }
        Relationships: []
      }
      chatbot_views: {
        Row: {
          chatbot_id: string
          id: string
          viewed_at: string
          viewer_id: string | null
        }
        Insert: {
          chatbot_id: string
          id?: string
          viewed_at?: string
          viewer_id?: string | null
        }
        Update: {
          chatbot_id?: string
          id?: string
          viewed_at?: string
          viewer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chatbot_views_chatbot_id_fkey"
            columns: ["chatbot_id"]
            isOneToOne: false
            referencedRelation: "chatbots"
            referencedColumns: ["id"]
          },
        ]
      }
      chatbots: {
        Row: {
          avatar_url: string | null
          backstory: string | null
          character_appearance: string | null
          created_at: string
          creator_id: string
          description: string
          dialogue_style: string | null
          gender: string | null
          has_second_character: boolean | null
          id: string
          image_generation_model: string | null
          intro_message: string
          is_mature: boolean | null
          is_public: boolean | null
          linked_chatbot_id: string | null
          name: string
          second_character_avatar_url: string | null
          second_character_backstory: string | null
          second_character_description: string | null
          second_character_dialogue_style: string | null
          second_character_gender: string | null
          second_character_name: string | null
          second_character_type: string | null
          tags: string[] | null
          total_views: number | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          backstory?: string | null
          character_appearance?: string | null
          created_at?: string
          creator_id: string
          description: string
          dialogue_style?: string | null
          gender?: string | null
          has_second_character?: boolean | null
          id?: string
          image_generation_model?: string | null
          intro_message: string
          is_mature?: boolean | null
          is_public?: boolean | null
          linked_chatbot_id?: string | null
          name: string
          second_character_avatar_url?: string | null
          second_character_backstory?: string | null
          second_character_description?: string | null
          second_character_dialogue_style?: string | null
          second_character_gender?: string | null
          second_character_name?: string | null
          second_character_type?: string | null
          tags?: string[] | null
          total_views?: number | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          backstory?: string | null
          character_appearance?: string | null
          created_at?: string
          creator_id?: string
          description?: string
          dialogue_style?: string | null
          gender?: string | null
          has_second_character?: boolean | null
          id?: string
          image_generation_model?: string | null
          intro_message?: string
          is_mature?: boolean | null
          is_public?: boolean | null
          linked_chatbot_id?: string | null
          name?: string
          second_character_avatar_url?: string | null
          second_character_backstory?: string | null
          second_character_description?: string | null
          second_character_dialogue_style?: string | null
          second_character_gender?: string | null
          second_character_name?: string | null
          second_character_type?: string | null
          tags?: string[] | null
          total_views?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chatbots_linked_chatbot_id_fkey"
            columns: ["linked_chatbot_id"]
            isOneToOne: false
            referencedRelation: "chatbots"
            referencedColumns: ["id"]
          },
        ]
      }
      coin_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          transaction_type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          transaction_type?: string
          user_id?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          chatbot_id: string
          content: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          chatbot_id: string
          content: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          chatbot_id?: string
          content?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          chatbot_id: string
          created_at: string
          id: string
          is_archived: boolean
          last_message_at: string
          user_id: string
        }
        Insert: {
          chatbot_id: string
          created_at?: string
          id?: string
          is_archived?: boolean
          last_message_at?: string
          user_id: string
        }
        Update: {
          chatbot_id?: string
          created_at?: string
          id?: string
          is_archived?: boolean
          last_message_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_chatbot_id_fkey"
            columns: ["chatbot_id"]
            isOneToOne: false
            referencedRelation: "chatbots"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_tasks: {
        Row: {
          created_at: string
          description: string
          id: string
          is_active: boolean
          name: string
          required_count: number
          reward_coins: number
          task_type: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          is_active?: boolean
          name: string
          required_count?: number
          reward_coins?: number
          task_type: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          name?: string
          required_count?: number
          reward_coins?: number
          task_type?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          id: string
          show_mature_content: boolean | null
          updated_at: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          id: string
          show_mature_content?: boolean | null
          updated_at?: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          show_mature_content?: boolean | null
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          chatbot_id: string
          created_at: string
          id: string
          rating: number
          review_text: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          chatbot_id: string
          created_at?: string
          id?: string
          rating: number
          review_text?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          chatbot_id?: string
          created_at?: string
          id?: string
          rating?: number
          review_text?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_chatbot_id_fkey"
            columns: ["chatbot_id"]
            isOneToOne: false
            referencedRelation: "chatbots"
            referencedColumns: ["id"]
          },
        ]
      }
      user_coins: {
        Row: {
          balance: number
          created_at: string
          id: string
          total_earned: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          total_earned?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          total_earned?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_streaks: {
        Row: {
          created_at: string
          current_streak: number
          id: string
          last_completed_date: string | null
          longest_streak: number
          updated_at: string
          user_id: string
          weekly_bonus_last_claimed: string | null
        }
        Insert: {
          created_at?: string
          current_streak?: number
          id?: string
          last_completed_date?: string | null
          longest_streak?: number
          updated_at?: string
          user_id: string
          weekly_bonus_last_claimed?: string | null
        }
        Update: {
          created_at?: string
          current_streak?: number
          id?: string
          last_completed_date?: string | null
          longest_streak?: number
          updated_at?: string
          user_id?: string
          weekly_bonus_last_claimed?: string | null
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          created_at: string
          id: string
          is_premium: boolean
          purchased_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_premium?: boolean
          purchased_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_premium?: boolean
          purchased_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_task_progress: {
        Row: {
          created_at: string
          current_count: number
          id: string
          is_claimed: boolean
          is_completed: boolean
          reset_date: string
          task_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_count?: number
          id?: string
          is_claimed?: boolean
          is_completed?: boolean
          reset_date?: string
          task_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_count?: number
          id?: string
          is_claimed?: boolean
          is_completed?: boolean
          reset_date?: string
          task_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_task_progress_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "daily_tasks"
            referencedColumns: ["id"]
          },
        ]
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
