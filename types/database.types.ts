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
      mendez_games: {
        Row: {
          id: string
          created_at: string
          hand_id: string
          street: 'preflop' | 'flop' | 'turn' | 'river'
          players: string[]
          hero_position: string
          hero_cards: string
          board_cards: string | null
          pot_size_bb: number
          to_call_bb: number
          current_bet_bb: number
          active_players: string[]
          action_on: string
          last_action: string | null
          last_bet_size_bb: number | null
          player_stacks: Record<string, number>
          effective_stack: number
          gpt_decision: string
          decision_reasoning: string
        }
        Insert: Omit<Database['public']['Tables']['mendez_games']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['mendez_games']['Row']>
      }
      products: {
        Row: {
          id: number
          name: string
          brand: string
          price: number
          image: string
          category: string
          tags: string[]
          popularity: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['products']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['products']['Insert']>
      }
      wishlist_items: {
        Row: {
          id: number
          user_id: string
          product_id: number
          message: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['wishlist_items']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['wishlist_items']['Insert']>
      }
    }
  }
} 