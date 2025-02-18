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

export interface GameState {
  currentHand: string | null
  position: string
  stackSize: number
  potSize: number
  lastAction: string | null
  suggestedMove: string | null
  aiSuggestion: string | null
}

export interface PlayerProfile {
  name: string
  style: string
  aggressive: number
  passive: number
  totalHands: number
  recentActions: string[]
}

export interface MendezGame {
  id: string
  created_at: string
  player_name: string
  hand_cards: string
  board_cards: string
  pot_size: number
  bet_size: number
  action_taken: string
  flopzilla_recommendation: string
  result: string
  profit_loss: number
}

export interface MendezPlayerAnalysis {
  id: string
  game_id: string
  player_name: string
  playing_style: string
  tendencies: string[]
  adjustment_suggestions: string[]
  created_at: string
}

export interface ProfitTrendData {
  hand: number
  profit: number
}

export interface BettingStatsData {
  fold: number
  call: number
  raise: number
} 