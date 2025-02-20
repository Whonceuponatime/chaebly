// Common types used across Mendez modules
export type Street = 'preflop' | 'flop' | 'turn' | 'river'
export type Position = 'BTN' | 'CO' | 'MP' | 'UTG' | 'SB' | 'BB'
export type OpponentType = 'Tight-Passive' | 'Loose-Passive' | 'Tight-Aggressive' | 'Loose-Aggressive'

export interface ActionHistoryEntry {
  player: string
  action: string
  amount: number
  position?: string
  street?: string
  timestamp?: string
}

export interface MendezAction {
  hand_id: string
  street: Street
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
  action_history?: ActionHistoryEntry[]
  positions?: Record<string, string>
  playerStacks?: Record<string, number>
}

export interface PlayerHistory {
  player_name: string
  total_hands: number
  showdown_hands: number
  hands_won: number
  aggression_factor: number
  vpip_percentage: number
  pfr_percentage: number
  showdown_hands_history: any[]
  betting_patterns: any
  position_tendencies: any
  last_seen_at: string
  fold_to_cbet_percentage: number
}

export interface PlayerUpdate {
  playerName: string
  handInfo: {
    position: string
    action: string
    betSize?: number
    potSize: number
    result: 'win' | 'lose'
    profitLoss: number
    wentToShowdown: boolean
    vpipAction: boolean
    pfrAction: boolean
    holeCards?: string
    street?: string
    lastAction?: string
    isBluff?: boolean
    betSizeType?: 'half_pot' | 'full_pot'
  }
}

export interface PlayerStats {
  total_hands: number
  showdown_hands: number
  hands_won: number
  aggression_factor: number
  vpip_percentage: number
  pfr_percentage: number
  showdown_hands_history: Array<{
    holeCards: string
    position: string
    result: string
    profitLoss: number
    timestamp: string
  }>
  betting_patterns: Record<string, number>
  position_tendencies: Record<string, {
    total: number
    vpip: number
    pfr: number
    won: number
  }>
  last_seen_at: string
  bb_per_100_hands: number
  total_bluffs: number
  successful_bluffs: number
  check_raise_attempts: number
  check_raise_success: number
  turn_call_attempts: number
  turn_call_success: number
  half_pot_bets: number
  half_pot_success: number
  full_pot_bets: number
  full_pot_success: number
} 