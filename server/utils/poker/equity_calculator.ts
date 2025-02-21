import { getRankValue } from '../mendez/strategyAdjustments'

// Types for hand ranges and equity calculations
export interface HandRange {
  hands: string[]
  weight?: number
}

export interface EquityCalculationParams {
  heroHand: string
  villainRange: HandRange
  board?: string
  iterations?: number
}

export interface FoldEquityParams {
  heroHand: string
  villainRange: HandRange
  board?: string
  potSize: number
  toCall: number
}

export class PokerEquityCalculator {
  // Monte Carlo simulation for hand equity
  static calculateHandEquity(params: EquityCalculationParams): number {
    const { 
      heroHand, 
      villainRange, 
      board = '', 
      iterations = 10000 
    } = params

    let heroWins = 0
    const deck = this.generateDeck()
    this.removeKnownCards(deck, heroHand, board, villainRange)

    for (let i = 0; i < iterations; i++) {
      const simulatedBoard = this.simulateBoard(board, deck)
      const heroHandStrength = this.evaluateHandStrength(heroHand, simulatedBoard)
      const villainHandStrength = this.evaluateVillainHandStrength(villainRange, simulatedBoard)

      if (heroHandStrength > villainHandStrength) {
        heroWins++
      }
    }

    return (heroWins / iterations) * 100
  }

  // Calculate fold equity based on opponent's range and board
  static calculateFoldEquity(params: FoldEquityParams): number {
    const { 
      heroHand, 
      villainRange, 
      board = '', 
      potSize, 
      toCall 
    } = params

    const totalRange = villainRange.hands.length
    const foldingHands = this.calculateFoldingHands(heroHand, villainRange, board)
    
    const foldFrequency = foldingHands.length / totalRange
    const potentialWinnings = potSize + toCall

    return foldFrequency * 100
  }

  // Estimate opponent's folding range
  private static calculateFoldingHands(
    heroHand: string, 
    villainRange: HandRange, 
    board: string
  ): string[] {
    return villainRange.hands.filter(hand => {
      const handStrength = this.evaluateHandStrength(hand, board)
      const heroStrength = this.evaluateHandStrength(heroHand, board)
      return handStrength < heroStrength
    })
  }

  // Generate a full 52-card deck
  private static generateDeck(): string[] {
    const ranks = '23456789TJQKA'
    const suits = 'hdcs'
    const deck: string[] = []

    for (const rank of ranks) {
      for (const suit of suits) {
        deck.push(`${rank}${suit}`)
      }
    }

    return deck
  }

  // Remove known cards from the deck
  private static removeKnownCards(
    deck: string[], 
    heroHand: string, 
    board: string, 
    villainRange: HandRange
  ): void {
    const knownCards = [
      ...heroHand.match(/[2-9TJQKA][hdcs]/g) || [],
      ...board.match(/[2-9TJQKA][hdcs]/g) || [],
      ...villainRange.hands.flatMap(hand => hand.match(/[2-9TJQKA][hdcs]/g) || [])
    ]

    knownCards.forEach(card => {
      const index = deck.indexOf(card)
      if (index !== -1) deck.splice(index, 1)
    })
  }

  // Simulate drawing board cards
  private static simulateBoard(board: string, deck: string[]): string {
    const requiredCards = 5 - (board.match(/[2-9TJQKA][hdcs]/g) || []).length
    let simulatedBoard = board
    const shuffledDeck = this.shuffleDeck(deck)

    for (let i = 0; i < requiredCards; i++) {
      simulatedBoard += shuffledDeck[i]
    }

    return simulatedBoard
  }

  // Fisher-Yates shuffle algorithm
  private static shuffleDeck(deck: string[]): string[] {
    const shuffled = [...deck]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  // Evaluate hand strength
  private static evaluateHandStrength(hand: string, board: string): number {
    const allCards = [...hand.match(/[2-9TJQKA][hdcs]/g) || [], ...board.match(/[2-9TJQKA][hdcs]/g) || []]
    const ranks = allCards.map(card => card[0])
    const suits = allCards.map(card => card[1])

    // Check for flush
    const flushSuit = this.findFlushSuit(suits)
    if (flushSuit) {
      const flushCards = allCards.filter(card => card[1] === flushSuit)
      if (flushCards.length >= 5) return this.evaluateFlushStrength(flushCards)
    }

    // Check for straight
    const sortedRanks = ranks.map(r => getRankValue(r)).sort((a, b) => b - a)
    const straightRank = this.findStraightRank(sortedRanks)
    if (straightRank !== -1) return straightRank + 8 // Straight strength

    // Check for pairs, three of a kind, etc.
    const rankCounts = this.countRanks(ranks)
    return this.evaluatePairStrength(rankCounts)
  }

  // Evaluate villain's hand strength
  private static evaluateVillainHandStrength(villainRange: HandRange, board: string): number {
    const bestStrength = villainRange.hands
      .map(hand => this.evaluateHandStrength(hand, board))
      .reduce((max, current) => Math.max(max, current), 0)

    return bestStrength
  }

  // Find flush suit
  private static findFlushSuit(suits: string[]): string | null {
    const suitCounts = suits.reduce((acc, suit) => {
      acc[suit] = (acc[suit] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(suitCounts)
      .find(([_, count]) => count >= 5)?.[0] || null
  }

  // Evaluate flush strength
  private static evaluateFlushStrength(flushCards: string[]): number {
    const sortedFlushRanks = flushCards
      .map(card => getRankValue(card[0]))
      .sort((a, b) => b - a)
      .slice(0, 5)

    return sortedFlushRanks.reduce((sum, rank, index) => sum + rank * Math.pow(15, 4 - index), 0) + 8000
  }

  // Find straight rank
  private static findStraightRank(sortedRanks: number[]): number {
    for (let i = 0; i <= sortedRanks.length - 5; i++) {
      const potentialStraight = sortedRanks.slice(i, i + 5)
      if (potentialStraight[0] - potentialStraight[4] === 4) {
        return potentialStraight[0]
      }
    }
    return -1
  }

  // Count rank occurrences
  private static countRanks(ranks: string[]): Record<string, number> {
    return ranks.reduce((acc, rank) => {
      acc[rank] = (acc[rank] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }

  // Evaluate pair/set/four of a kind strength
  private static evaluatePairStrength(rankCounts: Record<string, number>): number {
    const sortedCounts = Object.entries(rankCounts)
      .sort(([a], [b]) => getRankValue(b) - getRankValue(a))

    const [highestRank] = sortedCounts[0]
    const highestCount = Object.values(rankCounts).sort((a, b) => b - a)[0]

    switch (highestCount) {
      case 4: return getRankValue(highestRank) + 7000 // Four of a kind
      case 3: return getRankValue(highestRank) + 6000 // Three of a kind
      case 2: return getRankValue(highestRank) + 5000 // Pair
      default: return getRankValue(highestRank) // High card
    }
  }
}

// Example usage and range generation utilities
export function generateHandRanges(position: string): HandRange[] {
  const standardRanges: Record<string, HandRange[]> = {
    'BTN': [
      { 
        hands: ['AA', 'KK', 'QQ', 'JJ', 'TT', 'AK', 'AQ', 'AJ', 'KQ'], 
        weight: 1 
      },
      { 
        hands: ['99', '88', '77', 'ATs', 'KJs', 'QJs', 'JTs'], 
        weight: 0.7 
      }
    ],
    'CO': [
      { 
        hands: ['AA', 'KK', 'QQ', 'JJ', 'TT', 'AK', 'AQ', 'KQ'], 
        weight: 1 
      },
      { 
        hands: ['99', '88', 'ATs', 'KJs', 'QJs'], 
        weight: 0.6 
      }
    ],
    // Add more position-based ranges
  }

  return standardRanges[position] || []
}

// Utility to convert hand notation to actual cards
export function convertHandToCards(hand: string): string[] {
  const ranks = hand.match(/[2-9TJQKA]/g) || []
  const suits = hand.match(/[hdcs]/g) || []
  
  return ranks.map((rank, index) => `${rank}${suits[index] || 'h'}`)
} 