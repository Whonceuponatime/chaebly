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