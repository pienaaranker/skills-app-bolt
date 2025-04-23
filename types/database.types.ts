export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          username: string | null
          email: string
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string
          username?: string | null
          email: string
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          username?: string | null
          email?: string
        }
      }
      skills: {
        Row: {
          id: string
          created_at: string
          user_id: string
          skill_name: string
          experience_level: string
          current_step: number
          total_steps: number
          completed: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          skill_name: string
          experience_level: string
          current_step?: number
          total_steps?: number
          completed?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          skill_name?: string
          experience_level?: string
          current_step?: number
          total_steps?: number
          completed?: boolean
        }
      }
      curricula: {
        Row: {
          id: string
          created_at: string
          skill_id: string
          title: string
          description: string
          modules: Json[]
        }
        Insert: {
          id?: string
          created_at?: string
          skill_id: string
          title: string
          description: string
          modules: Json[]
        }
        Update: {
          id?: string
          created_at?: string
          skill_id?: string
          title?: string
          description?: string
          modules?: Json[]
        }
      }
      assignments: {
        Row: {
          id: string
          created_at: string
          skill_id: string
          module_index: number
          step_index: number
          title: string
          description: string
          completed: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          skill_id: string
          module_index: number
          step_index: number
          title: string
          description: string
          completed?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          skill_id?: string
          module_index?: number
          step_index?: number
          title?: string
          description?: string
          completed?: boolean
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

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Insertable<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updatable<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']