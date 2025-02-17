export interface Database {
  public: {
    Tables: {
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
      mendez_players: {
        Row: {
          id: number
          name: string
          style: string
          aggressive: number
          passive: number
          total_hands: number
          recent_actions: string[]
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['mendez_players']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['mendez_players']['Insert']>
      }
    }
  }
} 