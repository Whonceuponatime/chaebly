import type { Position } from './types'

interface HandRange {
  raise: string[]
  call: string[]
  fold: string[]
}

// Updated preflop ranges based on feedback
const ADJUSTED_PREFLOP_RANGES: Record<Position, HandRange> = {
  BTN: {
    raise: [
      // Premium hands
      'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55', '44', '33', '22',
      'AK', 'AQ', 'AJ', 'AT', 'A9', 'A8', 'A7', 'A6', 'A5', 'A4', 'A3', 'A2',
      'KQ', 'KJ', 'KT', 'K9', 'K8', 'K7', 'K6', 'K5s',
      'QJ', 'QT', 'Q9', 'Q8', 'Q7s',
      'JT', 'J9', 'J8', 'J7s',
      'T9', 'T8', 'T7s',
      '98', '87', '76', '65', '54', '43', '32s'
    ],
    call: [
      // Defending vs 3-bets with good implied odds
      'TT-88', 'AQ', 'AJs', 'KQs', 'JTs', 'T9s', '98s', '87s', '76s'
    ],
    fold: ['Rest']
  },
  CO: {
    raise: [
      // Wider range in CO with more semi-bluffs
      'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55', '44',
      'AK', 'AQ', 'AJ', 'AT', 'A9', 'A8', 'A7s', 'A6s', 'A5s',
      'KQ', 'KJ', 'KT', 'K9', 'K8s',
      'QJ', 'QT', 'Q9', 'Q8s',
      'JT', 'J9', 'J8s',
      'T9', '98', '87', '76', '65s'
    ],
    call: [
      // More hands to call 3-bets
      'JJ-99', 'AQ', 'AJs', 'KQs', 'QJs', 'JTs'
    ],
    fold: ['Rest']
  },
  MP: {
    raise: [
      // Added more value hands and some suited connectors
      'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77',
      'AK', 'AQ', 'AJ', 'AT', 'A9s', 'A8s',
      'KQ', 'KJ', 'KTs',
      'QJ', 'QTs',
      'JTs', 'T9s'
    ],
    call: [
      // Premium hands vs 3-bets
      'QQ-JJ', 'AK', 'AQs', 'KQs'
    ],
    fold: ['Rest']
  },
  UTG: {
    raise: [
      // Slightly wider but still tight range
      'AA', 'KK', 'QQ', 'JJ', 'TT', '99',
      'AK', 'AQ', 'AJ', 'ATs',
      'KQ', 'KJs',
      'QJs'
    ],
    call: [
      // Only strongest hands vs 3-bets
      'KK+', 'AK', 'AQs'
    ],
    fold: ['Rest']
  },
  SB: {
    raise: [
      // More aggressive 3-bet or fold strategy
      'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77',
      'AK', 'AQ', 'AJ', 'AT', 'A9s', 'A8s', 'A7s', 'A6s', 'A5s',
      'KQ', 'KJ', 'KT', 'K9s',
      'QJ', 'QT', 'Q9s',
      'JT', 'J9s',
      'T9s', '98s', '87s'
    ],
    call: [
      // Very selective calling range
      'TT+', 'AQ+', 'AJs'
    ],
    fold: ['Rest']
  },
  BB: {
    raise: [
      // More 3-betting for value and defense
      'AA', 'KK', 'QQ', 'JJ', 'TT', '99',
      'AK', 'AQ', 'AJs+', 'ATs',
      'KQs', 'KJs',
      'QJs'
    ],
    call: [
      // Wider defense vs steals
      'JJ-55',
      'AJ+',
      'KQ+',
      'T9s+',
      'A5s-A2s',
      'K9s+',
      'Q9s+'
    ],
    fold: ['Rest']
  }
}

// Improved postflop strategy
interface BoardTexture {
  isDry: boolean
  isDrawHeavy: boolean
  hasFlushDraw: boolean
  hasStraightDraw: boolean
  topCard: string
  isPaired: boolean
}

function analyzeBoardTexture(board: string): BoardTexture {
  const cards = board.match(/[2-9TJQKA][hdcs]/g) || []
  const ranks = cards.map(c => c[0])
  const suits = cards.map(c => c[1])
  
  return {
    isDry: new Set(suits).size === 3 && !hasConnectedCards(ranks),
    isDrawHeavy: hasConnectedCards(ranks) || new Set(suits).size <= 2,
    hasFlushDraw: new Set(suits).size <= 2,
    hasStraightDraw: hasConnectedCards(ranks),
    topCard: getHighestRank(ranks),
    isPaired: new Set(ranks).size < cards.length
  }
}

export function getPostflopAdjustment(
  heroHand: string,
  board: string,
  position: Position,
  isMultiway: boolean,
  hasInitiative: boolean
): { action: 'fold' | 'call' | 'raise', reasoning: string, sizingMultiplier: number } {
  const texture = analyzeBoardTexture(board)
  const handStrength = evaluateHandStrength(heroHand, board)
  
  // Never fold premium hands unless extreme spots
  if (isPremiumHand(heroHand)) {
    const sizing = isMultiway ? 1.2 : 0.75 // Bigger sizing multiway
    return {
      action: 'raise',
      reasoning: 'Premium hand, betting for value',
      sizingMultiplier: sizing
    }
  }

  // C-betting strategy on dry boards
  if (texture.isDry && hasInitiative) {
    if (hasTopPair(heroHand, board)) {
      return {
        action: 'raise',
        reasoning: 'Value betting top pair on dry board',
        sizingMultiplier: 0.6 // Small sizing on dry boards
      }
    }
    if (hasOvercards(heroHand, board)) {
      return {
        action: 'raise',
        reasoning: 'C-betting with overcards on dry board',
        sizingMultiplier: 0.5
      }
    }
  }

  // Multiway pot strategy
  if (isMultiway) {
    if (handStrength >= 0.7) { // Strong hand
      return {
        action: 'raise',
        reasoning: 'Value betting strong hand in multiway pot',
        sizingMultiplier: 1.0
      }
    }
    if (handStrength >= 0.5) { // Medium strength
      return {
        action: 'call',
        reasoning: 'Calling with medium strength in multiway',
        sizingMultiplier: 1.0
      }
    }
  }

  // Draw-heavy board strategy
  if (texture.isDrawHeavy) {
    if (hasStrongDraw(heroHand, board)) {
      return {
        action: 'raise',
        reasoning: 'Semi-bluffing with strong draw',
        sizingMultiplier: 0.75
      }
    }
  }

  return {
    action: 'fold',
    reasoning: 'Hand too weak for current board and situation',
    sizingMultiplier: 1.0
  }
}

// Helper functions
function evaluateHandStrength(hand: string, board: string): number {
  // Implement hand strength evaluation (0-1)
  // This is a simplified version - would need a proper evaluator
  const hasTopPairResult = hasTopPair(hand, board)
  const hasOverPairResult = hasOverPair(hand, board)
  
  if (hasOverPairResult) return 0.8
  if (hasTopPairResult) return 0.7
  if (hasOvercards(hand, board)) return 0.4
  return 0.2
}

function hasTopPair(hand: string, board: string): boolean {
  const handRanks = hand.match(/[2-9TJQKA]/g) || []
  const boardRanks = board.match(/[2-9TJQKA]/g) || []
  const topBoardRank = getHighestRank(boardRanks)
  
  // Check if either of our hole cards matches the highest board card
  return handRanks.some(rank => rank === topBoardRank)
}

function hasOverPair(hand: string, board: string): boolean {
  const handRanks = hand.match(/[2-9TJQKA]/g) || []
  const boardRanks = board.match(/[2-9TJQKA]/g) || []
  const topBoardRank = getHighestRank(boardRanks)
  
  // Check if we have a pair higher than the board
  return handRanks[0] === handRanks[1] && 
         getRankValue(handRanks[0]) > getRankValue(topBoardRank)
}

function hasOvercards(hand: string, board: string): boolean {
  const handRanks = hand.match(/[2-9TJQKA]/g) || []
  const boardRanks = board.match(/[2-9TJQKA]/g) || []
  const topBoardRank = getHighestRank(boardRanks)
  
  return handRanks.every(r => getRankValue(r) > getRankValue(topBoardRank))
}

function hasStrongDraw(hand: string, board: string): boolean {
  const allCards = [
    ...(hand.match(/[2-9TJQKA][hdcs]/g) || []), 
    ...(board.match(/[2-9TJQKA][hdcs]/g) || [])
  ] as string[]
  const ranks = allCards.map(c => c[0])
  const suits = allCards.map(c => c[1])
  
  const hasFlushDraw = new Set(suits).size <= 2
  const hasStraightDraw = hasConnectedCards(ranks)
  
  return hasFlushDraw || hasStraightDraw
}

function hasConnectedCards(ranks: string[]): boolean {
  const values = ranks.map(r => getRankValue(r)).sort((a, b) => a - b)
  return values[values.length - 1] - values[0] <= 4
}

export function getRankValue(rank: string): number {
  return '23456789TJQKA'.indexOf(rank)
}

function getHighestRank(ranks: string[]): string {
  return ranks.reduce((highest, current) => 
    getRankValue(current) > getRankValue(highest) ? current : highest
  )
}

function isPremiumHand(hand: string): boolean {
  const ranks = hand.match(/[2-9TJQKA]/g) || []
  const suited = hand[1] === hand[3]
  
  // Sort ranks for comparison
  const sortedRanks = ranks.sort((a, b) => 
    getRankValue(b) - getRankValue(a)
  ).join('')
  
  // Premium hands list
  const premiumHands = ['AA', 'KK', 'QQ', 'JJ', 'AK']
  const suitedPremiums = ['AQ', 'AJ']
  
  return premiumHands.includes(sortedRanks) || 
         (suited && suitedPremiums.includes(sortedRanks))
}

// Map non-standard positions to standard ones
export function mapToStandardPosition(position: string): 'UTG' | 'MP' | 'CO' | 'BTN' | 'SB' | 'BB' {
  const positionMap: Record<string, 'UTG' | 'MP' | 'CO' | 'BTN' | 'SB' | 'BB'> = {
    'UTG+1': 'MP',
    'UTG+2': 'MP',
    'MP+1': 'MP',
    'MP+2': 'CO',
    'HJ': 'CO',
    'LJ': 'MP',
    'UTG': 'UTG',
    'MP': 'MP',
    'CO': 'CO',
    'BTN': 'BTN',
    'SB': 'SB',
    'BB': 'BB'
  }
  
  return positionMap[position] || 'MP' // Default to MP if unknown position
}

export function getPreflopAction(hand: string, position: string): 'raise' | 'call' | 'fold' {
  // Map the position to a standard one
  const standardPosition = mapToStandardPosition(position)
  
  // Use the standard position to look up the ranges
  if (ADJUSTED_PREFLOP_RANGES[standardPosition].raise.includes(hand)) return 'raise'
  if (ADJUSTED_PREFLOP_RANGES[standardPosition].call.includes(hand)) return 'call'
  return 'fold'
} 