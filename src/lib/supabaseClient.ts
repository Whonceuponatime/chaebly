import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for Mendez tables
export interface MendezHandStats {
  id: number
  created_at: string
  hand: string
  flopzilla_suggestion: string
  ai_adaptation: string
  final_decision: string
  result: number
  won_amount: number
}

export interface MendezDetailedStats {
  total_profit: number
  win_rate: number
  flopzilla_accuracy: number
  total_decisions: number
  ai_success_rate: number
  total_adaptations: number
  vpip_percentage: number
  pfr_percentage: number
  three_bet_percentage: number
  cbet_percentage: number
  cbet_success_rate: number
  fold_to_cbet_percentage: number
} 