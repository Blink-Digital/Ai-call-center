export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          company: string | null
          role: string
          phone_number: string | null
          created_at: string
          updated_at: string
          last_login: string | null
        }
        Insert: {
          id?: string
          email: string
          name?: string | null
          company?: string | null
          role?: string
          phone_number?: string | null
          created_at?: string
          updated_at?: string
          last_login?: string | null
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          company?: string | null
          role?: string
          phone_number?: string | null
          created_at?: string
          updated_at?: string
          last_login?: string | null
        }
      }
      teams: {
        Row: {
          id: string
          name: string
          description: string | null
          owner_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          owner_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          owner_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      team_members: {
        Row: {
          id: string
          team_id: string
          user_id: string
          role: string
          joined_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          team_id: string
          user_id: string
          role?: string
          joined_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          user_id?: string
          role?: string
          joined_at?: string
          updated_at?: string
        }
      }
      pathways: {
        Row: {
          id: string
          name: string
          description: string | null
          team_id: string | null
          creator_id: string
          updater_id: string
          created_at: string
          updated_at: string
          data: Json
          bland_id: string | null
          phone_number: string | null // 🆕 NEW: Phone number field
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          team_id?: string | null
          creator_id: string
          updater_id: string
          created_at?: string
          updated_at?: string
          data: Json
          bland_id?: string | null
          phone_number?: string | null // 🆕 NEW: Phone number field
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          team_id?: string | null
          creator_id?: string
          updater_id?: string
          created_at?: string
          updated_at?: string
          data?: Json
          bland_id?: string | null
          phone_number?: string | null // 🆕 NEW: Phone number field
        }
      }
      activities: {
        Row: {
          id: string
          pathway_id: string
          user_id: string
          action: string
          details: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          pathway_id: string
          user_id: string
          action: string
          details?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          pathway_id?: string
          user_id?: string
          action?: string
          details?: Json | null
          created_at?: string
        }
      }
      invitations: {
        Row: {
          id: string
          email: string
          team_id: string
          role: string
          token: string
          expires_at: string
          created_at: string
          accepted: boolean
        }
        Insert: {
          id?: string
          email: string
          team_id: string
          role?: string
          token: string
          expires_at: string
          created_at?: string
          accepted?: boolean
        }
        Update: {
          id?: string
          email?: string
          team_id?: string
          role?: string
          token?: string
          expires_at?: string
          created_at?: string
          accepted?: boolean
        }
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
  }
}
