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
  gpt_decision: string | null
  decision_reasoning: string
  final_action?: string | null
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

export interface ChartDataset {
  label?: string
  data: number[]
  backgroundColor: string | string[]
  borderColor: string | string[]
  borderWidth: number
}

export interface ChartData {
  labels: string[]
  datasets: ChartDataset[]
}

export interface ChartOptions {
  responsive?: boolean
  maintainAspectRatio?: boolean
  plugins?: {
    legend?: {
      position?: 'top' | 'bottom' | 'left' | 'right'
    }
    tooltip?: {
      callbacks?: {
        label?: (context: any) => string
      }
    }
  }
  scales?: {
    y?: {
      beginAtZero?: boolean
      title?: {
        display?: boolean
        text?: string
      }
    }
  }
}

export interface PokerAction {
  hand_id: string
  street: 'preflop' | 'flop' | 'turn' | 'river'
  players: string[]
  hero_position: string
  hero_cards: string
  board_cards?: string
  pot_size_bb: number
  to_call_bb: number
  current_bet_bb: number
  active_players: string[]
  action_on: string
  last_action?: string
  last_bet_size_bb?: number
  effective_stack?: number
}

export interface PokerTestResult {
  test_session_id: string
  hand_id: string
  street: string
  hero_position: string
  hero_cards: string
  board_cards?: string
  pot_size_bb: number
  to_call_bb: number
  gpt_decision: string
  decision_reasoning: string
  gto_context: string
  player_stats: any
  is_correct: boolean
  error_type: string | null
  notes: string
  test_scenario: string
}

export interface PokerDecision {
  action: string
  confidence: string
  reasoning: string
  gto_context: string
  player_insights: Array<{
    player: string
    style: string
    tendencies: string[]
  }>
  pot_odds: string
  risk_reward: string
  position_context: string
} 