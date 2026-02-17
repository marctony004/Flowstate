export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json | null
          project_id: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json | null
          project_id?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json | null
          project_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      collaborator_notes: {
        Row: {
          collaborator_id: string
          communication_pref: string | null
          created_at: string
          id: string
          notes: string | null
          owner_id: string
          project_id: string | null
          task_id: string | null
          rating: number | null
          sentiment_analysis: Json | null
          sentiment_status: string
          strengths: string | null
          updated_at: string
          working_style: string | null
        }
        Insert: {
          collaborator_id: string
          communication_pref?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          owner_id: string
          project_id?: string | null
          task_id?: string | null
          rating?: number | null
          sentiment_analysis?: Json | null
          sentiment_status?: string
          strengths?: string | null
          updated_at?: string
          working_style?: string | null
        }
        Update: {
          collaborator_id?: string
          communication_pref?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          owner_id?: string
          project_id?: string | null
          task_id?: string | null
          rating?: number | null
          sentiment_analysis?: Json | null
          sentiment_status?: string
          strengths?: string | null
          updated_at?: string
          working_style?: string | null
        }
        Relationships: []
      }
      ideas: {
        Row: {
          content: string | null
          created_at: string
          duration_seconds: number | null
          file_size_bytes: number | null
          file_type: string | null
          file_url: string | null
          id: string
          is_favorite: boolean
          memory: Json | null
          memory_status: string
          owner_id: string
          project_id: string | null
          tags: string[] | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          duration_seconds?: number | null
          file_size_bytes?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_favorite?: boolean
          memory?: Json | null
          memory_status?: string
          owner_id: string
          project_id?: string | null
          tags?: string[] | null
          title?: string
          type?: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          duration_seconds?: number | null
          file_size_bytes?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_favorite?: boolean
          memory?: Json | null
          memory_status?: string
          owner_id?: string
          project_id?: string | null
          tags?: string[] | null
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      milestones: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          position: number
          project_id: string
          title: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          position?: number
          project_id: string
          title: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          position?: number
          project_id?: string
          title?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string
          id: string
          is_admin: boolean
          notification_preferences: Json | null
          onboarded_at: string | null
          plan: string
          role: string
          timezone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string
          id: string
          is_admin?: boolean
          notification_preferences?: Json | null
          onboarded_at?: string | null
          plan?: string
          role?: string
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string
          id?: string
          is_admin?: boolean
          notification_preferences?: Json | null
          onboarded_at?: string | null
          plan?: string
          role?: string
          timezone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      project_members: {
        Row: {
          accepted_at: string | null
          id: string
          invited_at: string
          project_id: string
          role: string
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          id?: string
          invited_at?: string
          project_id: string
          role?: string
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          id?: string
          invited_at?: string
          project_id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          ai_state: Json | null
          bpm: number | null
          completed_at: string | null
          cover_url: string | null
          created_at: string
          description: string | null
          due_date: string | null
          genre: string | null
          id: string
          key_signature: string | null
          owner_id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          ai_state?: Json | null
          bpm?: number | null
          completed_at?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          genre?: string | null
          id?: string
          key_signature?: string | null
          owner_id: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          ai_state?: Json | null
          bpm?: number | null
          completed_at?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          genre?: string | null
          id?: string
          key_signature?: string | null
          owner_id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          id: string
          user_id: string
          role: string
          content: string
          citations: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role: string
          content: string
          citations?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: string
          content?: string
          citations?: Json | null
          created_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          message: string | null
          read: boolean
          entity_type: string | null
          entity_id: string | null
          actor_id: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          message?: string | null
          read?: boolean
          entity_type?: string | null
          entity_id?: string | null
          actor_id?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          message?: string | null
          read?: boolean
          entity_type?: string | null
          entity_id?: string | null
          actor_id?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Relationships: []
      }
      project_memory: {
        Row: {
          id: string
          user_id: string
          entity_weights: Json
          attention_patterns: Json
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          entity_weights?: Json
          attention_patterns?: Json
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          entity_weights?: Json
          attention_patterns?: Json
          updated_at?: string
        }
        Relationships: []
      }
      session_logs: {
        Row: {
          id: string
          user_id: string
          project_id: string | null
          event_type: string
          entity_type: string | null
          entity_id: string | null
          content: string
          embedding: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          project_id?: string | null
          event_type: string
          entity_type?: string | null
          entity_id?: string | null
          content: string
          embedding?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          project_id?: string | null
          event_type?: string
          entity_type?: string | null
          entity_id?: string | null
          content?: string
          embedding?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assignee_id: string | null
          completed_at: string | null
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          id: string
          milestone_id: string | null
          position: number
          priority: string
          project_id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          id?: string
          milestone_id?: string | null
          position?: number
          priority?: string
          project_id: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          id?: string
          milestone_id?: string | null
          position?: number
          priority?: string
          project_id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_id_by_email: { Args: { email_input: string }; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types for convenience
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"]
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"]
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"]

// Convenience aliases
export type Profile = Tables<"profiles">
export type Project = Tables<"projects">
export type ProjectMember = Tables<"project_members">
export type Idea = Tables<"ideas">
export type Milestone = Tables<"milestones">
export type Task = Tables<"tasks">
export type CollaboratorNote = Tables<"collaborator_notes">
export type ActivityLog = Tables<"activity_log">
export type ChatMessage = Tables<"chat_messages">
export type Notification = Tables<"notifications">
export type ProjectMemory = Tables<"project_memory">
export type SessionLog = Tables<"session_logs">
