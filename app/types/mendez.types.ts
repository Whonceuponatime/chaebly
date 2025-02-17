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