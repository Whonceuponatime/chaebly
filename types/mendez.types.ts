import type { Database } from './database.types'

export interface PlayerProfile {
  name: string
  style: string
  aggressive: number
  passive: number
  totalHands: number
  recentActions: string[]
}

export interface GameState {
  currentHand: string | null
  position: string
  stackSize: number
  potSize: number
  lastAction: string | null
  suggestedMove: string | null
  aiSuggestion: string | null
}

export interface User {
  id: string
  email: string
  created_at: string
}

export type Product = Database['public']['Tables']['products']['Row']

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
  id: string
  name: string
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
  btn_win_rate: number
  sb_win_rate: number
  bb_win_rate: number
}

export interface MendezGame {
  id?: string
  created_at?: string
  hand_id: string
  street: 'preflop' | 'flop' | 'turn' | 'river'
  players: string[]
  hero_position: string
  hero_cards: string
  board_cards?: string | null
  pot_size_bb: number
  to_call_bb: number
  current_bet_bb: number
  active_players: string[]
  action_on: string
  last_action?: string | null
  last_bet_size_bb?: number | null
  player_stacks: Record<string, number>
  effective_stack: number
  gpt_decision: string
  decision_reasoning: string
}

export interface MendezPayload {
  handId: string
  street: 'preflop' | 'flop' | 'turn' | 'river'
  players: string[]
  heroPosition: string
  heroCards: string
  boardCards?: string | null
  potSize: number
  toCall: number
  currentBet: number
  activePlayers: string[]
  actionOn: string
  lastAction?: string | null
  lastBetSize?: number | null
  playerStacks: Record<string, number>
  effectiveStack: number
}

// Database types
export type Database = {
  public: {
    Tables: {
      mendez_games: {
        Row: MendezGame
        Insert: MendezGame
        Update: Partial<MendezGame>
      }
    }
  }
} 