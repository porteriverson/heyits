export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.1";
  };
  public: {
    Tables: {
      journal_entries: {
        Row: {
          content: string;
          created_at: string | null;
          event_summary: string | null;
          id: string;
          prompt_text: string | null;
          prompt_title: string | null;
          source: string | null;
          user_id: string | null;
        };
        Insert: {
          content: string;
          created_at?: string | null;
          event_summary?: string | null;
          id?: string;
          prompt_text?: string | null;
          prompt_title?: string | null;
          source?: string | null;
          user_id?: string | null;
        };
        Update: {
          content?: string;
          created_at?: string | null;
          event_summary?: string | null;
          id?: string;
          prompt_text?: string | null;
          prompt_title?: string | null;
          source?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "journal_entries_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      journal_photos: {
        Row: {
          id: string;
          entry_id: string;
          user_id: string;
          storage_path: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          entry_id: string;
          user_id: string;
          storage_path: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          entry_id?: string;
          user_id?: string;
          storage_path?: string;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "journal_photos_entry_id_fkey";
            columns: ["entry_id"];
            isOneToOne: false;
            referencedRelation: "journal_entries";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          bot_name: string | null;
          created_at: string | null;
          daily_send_time: string;
          goal: string | null;
          google_connected: boolean | null;
          google_refresh_token: string | null;
          id: string;
          last_prompt_sent_at: string | null;
          last_prompt_text: string | null;
          last_prompt_title: string | null;
          name: string | null;
          onboarding_completed: boolean;
          phone: string;
          phone_verified: boolean | null;
          send_time_type: string;
          timezone: string;
        };
        Insert: {
          bot_name?: string | null;
          created_at?: string | null;
          daily_send_time: string;
          goal?: string | null;
          google_connected?: boolean | null;
          google_refresh_token?: string | null;
          id: string;
          last_prompt_sent_at?: string | null;
          last_prompt_text?: string | null;
          last_prompt_title?: string | null;
          name?: string | null;
          onboarding_completed?: boolean;
          phone: string;
          phone_verified?: boolean | null;
          send_time_type?: string;
          timezone: string;
        };
        Update: {
          bot_name?: string | null;
          created_at?: string | null;
          daily_send_time?: string;
          goal?: string | null;
          google_connected?: boolean | null;
          google_refresh_token?: string | null;
          id?: string;
          last_prompt_sent_at?: string | null;
          last_prompt_text?: string | null;
          last_prompt_title?: string | null;
          name?: string | null;
          onboarding_completed?: boolean;
          phone?: string;
          phone_verified?: boolean | null;
          send_time_type?: string;
          timezone?: string;
        };
        Relationships: [];
      };
      prompts: {
        Row: {
          id: number;
          prompt_text: string;
        };
        Insert: {
          id?: number;
          prompt_text: string;
        };
        Update: {
          id?: number;
          prompt_text?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;
type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  T extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"]),
> = (DefaultSchema["Tables"] & DefaultSchema["Views"])[T] extends {
  Row: infer R;
}
  ? R
  : never;

export type TablesInsert<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T] extends { Insert: infer I } ? I : never;

export type TablesUpdate<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T] extends { Update: infer U } ? U : never;
