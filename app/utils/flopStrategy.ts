interface FlopRange {
  range: string[]
  betSize: number
  frequency: number
}

interface BoardTexture {
  type: 'Dry' | 'Semi-Wet' | 'Wet'
  cBetFrequency: number
  betSizing: {
    value: number[]
    strong: number
    bluff: number
  }
}

interface OpponentType {
  type: 'Tight-Passive' | 'Loose-Passive' | 'Tight-Aggressive' | 'Loose-Aggressive'
  strategy: {
    cBetFrequency: number
    valueRange: string[]
    bluffRange: string[]
  }
}

const BOARD_TEXTURES: Record<BoardTexture['type'], BoardTexture> = {
  'Dry': {
    type: 'Dry',
    cBetFrequency: 0.75, // 70-80%
    betSizing: {
      value: [0.33, 0.5], // 33-50% pot
      strong: 0.5,
      bluff: 0.33
    }
  },
  'Semi-Wet': {
    type: 'Semi-Wet',
    cBetFrequency: 0.55, // 50-60%
    betSizing: {
      value: [0.5, 0.66], // 50-66% pot
      strong: 0.66,
      bluff: 0.5
    }
  },
  'Wet': {
    type: 'Wet',
    cBetFrequency: 0.35, // 30-40%
    betSizing: {
      value: [0.66, 0.8], // 66-80% pot
      strong: 0.8,
      bluff: 0.66
    }
  }
}

const OPPONENT_STRATEGIES: Record<OpponentType['type'], OpponentType> = {
  'Tight-Passive': {
    type: 'Tight-Passive',
    strategy: {
      cBetFrequency: 0.8, // C-bet often
      valueRange: ['Top pair+', 'Strong draws'],
      bluffRange: ['Gutshots', 'Backdoors']
    }
  },
  'Loose-Passive': {
    type: 'Loose-Passive',
    strategy: {
      cBetFrequency: 0.4, // Bet only for value
      valueRange: ['Top pair good kicker+'],
      bluffRange: [] // Don't bluff
    }
  },
  'Tight-Aggressive': {
    type: 'Tight-Aggressive',
    strategy: {
      cBetFrequency: 0.6,
      valueRange: ['Top pair+', 'Strong draws'],
      bluffRange: ['Gutshots with backdoors']
    }
  },
  'Loose-Aggressive': {
    type: 'Loose-Aggressive',
    strategy: {
      cBetFrequency: 0.7,
      valueRange: ['Second pair+'],
      bluffRange: ['Any backdoor draws']
    }
  }
}

interface HandCategory {
  type: 'Nuts' | 'Strong' | 'Mediocre' | 'Draw' | 'Weak'
  examples: string[]
  strategy: {
    inPosition: string
    outOfPosition: string
  }
}

const HAND_CATEGORIES: Record<HandCategory['type'], HandCategory> = {
  'Nuts': {
    type: 'Nuts',
    examples: ['Set+', 'Two pair+', 'Nut flush'],
    strategy: {
      inPosition: 'Slowplay occasionally',
      outOfPosition: 'Bet for value'
    }
  },
  'Strong': {
    type: 'Strong',
    examples: ['Top pair good kicker', 'Overpair'],
    strategy: {
      inPosition: 'Bet for value',
      outOfPosition: 'Bet for value'
    }
  },
  'Mediocre': {
    type: 'Mediocre',
    examples: ['Top pair weak kicker', 'Second pair'],
    strategy: {
      inPosition: 'Check/call or small bet',
      outOfPosition: 'Bet for thin value'
    }
  },
  'Draw': {
    type: 'Draw',
    examples: ['Flush draw', 'Open-ended straight draw'],
    strategy: {
      inPosition: 'Check/call',
      outOfPosition: 'Semi-bluff'
    }
  },
  'Weak': {
    type: 'Weak',
    examples: ['No pair no draw', 'Bottom pair'],
    strategy: {
      inPosition: 'Check/fold',
      outOfPosition: 'Check behind'
    }
  }
}

// Helper function to check for backdoor draws
function hasBackdoorDraws(holeCards: string, board: string): boolean {
  const ranks = [...board.match(/[2-9TJQKA]/g) || [], ...holeCards.match(/[2-9TJQKA]/g) || []]
  const suits = [...board.match(/[♠♣♥♦]/g) || [], ...holeCards.match(/[♠♣♥♦]/g) || []]
  
  // Check for backdoor flush draws (2 cards of same suit)
  const suitCounts = suits.reduce((acc, s) => {
    acc[s] = (acc[s] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  const hasBackdoorFlush = Object.values(suitCounts).some(count => count >= 2)
  
  // Check for backdoor straight draws (2 connected cards)
  const hasBackdoorStraight = ranks.some((r, i) => {
    if (i === 0) return false
    const curr = getRankValue(r)
    const prev = getRankValue(ranks[i - 1])
    return Math.abs(curr - prev) <= 2
  })
  
  return hasBackdoorFlush || hasBackdoorStraight
}

// Helper function to convert card ranks to numeric values
function getRankValue(rank: string): number {
  const rankValues: Record<string, number> = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
    'T': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
  }
  return rankValues[rank] || 0
}

export function getBoardTexture(board: string): BoardTexture['type'] {
  // Example: K♠ Q♣ 7♦
  const ranks = board.match(/[2-9TJQKA]/g) || []
  const suits = board.match(/[♠♣♥♦]/g) || []
  
  // Check for flush draws
  const hasFlushDraw = new Set(suits).size <= 2
  
  // Check for straight draws
  const sortedRanks = ranks.map(r => '23456789TJQKA'.indexOf(r)).sort((a, b) => a - b)
  const hasOpenEnded = sortedRanks.length >= 3 && sortedRanks[2] - sortedRanks[0] <= 4
  const hasGutshot = sortedRanks.some((r, i) => i < sortedRanks.length - 1 && sortedRanks[i + 1] - r === 2)
  
  // Check for paired board
  const isPaired = new Set(ranks).size < 3
  
  if (hasFlushDraw && (hasOpenEnded || hasGutshot)) return 'Wet'
  if (hasFlushDraw || hasOpenEnded || isPaired) return 'Semi-Wet'
  return 'Dry'
}

export function getHandStrength(
  holeCards: string,
  board: string
): HandCategory['type'] {
  // This is a simplified version - would need a more sophisticated hand evaluator
  const ranks = [...board.match(/[2-9TJQKA]/g) || [], ...holeCards.match(/[2-9TJQKA]/g) || []]
  const suits = [...board.match(/[♠♣♥♦]/g) || [], ...holeCards.match(/[♠♣♥♦]/g) || []]
  
  // Check for sets
  const rankCounts = ranks.reduce((acc, r) => {
    acc[r] = (acc[r] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  if (Object.values(rankCounts).some(count => count >= 3)) return 'Nuts'
  if (Object.values(rankCounts).some(count => count === 2)) return 'Strong'
  
  // Check for flush draws
  const suitCounts = suits.reduce((acc, s) => {
    acc[s] = (acc[s] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  if (Object.values(suitCounts).some(count => count >= 4)) return 'Draw'
  
  return 'Weak'
}

interface FlopAdvice {
  action: 'check' | 'bet' | 'raise' | 'fold' | 'call'
  sizing: number
  confidence: 'high' | 'medium' | 'low'
  reasoning: string
}

// Add these utility functions at the top of the file
function mapToStandardPosition(position: string): Position {
  const positionMap: Record<string, Position> = {
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
  
  return positionMap[position] || 'MP'
}

// Define a basic variance generator if not imported
const StrategyVarianceGenerator = {
  generateVariance: (context: any) => ({
    aggression: 0.5,
    bluffFrequency: 0.3,
    tightness: 0.6
  }),
  shouldBluff: (variance: any) => Math.random() < variance.bluffFrequency
}

// Modify the type definitions
type Position = 'UTG' | 'MP' | 'CO' | 'BTN' | 'SB' | 'BB'

export function getFlopAdvice(
  holeCards: string,
  board: string,
  position: string,
  potSize: number,
  effectiveStack: number,
  opponentType: OpponentType['type'],
  hasBetInFront: boolean,
  betSize?: number,
  context?: {
    tournamentStage: 'Early' | 'Middle' | 'Late' | 'Final Table',
    stackSize: number
  }
): FlopAdvice {
  // Generate strategy variance if context is provided
  const variance = context 
    ? StrategyVarianceGenerator.generateVariance({
        tournamentStage: context.tournamentStage,
        stackSize: context.stackSize,
        position: mapToStandardPosition(position),
        opponentType: opponentType || 'Tight-Passive'
      })
    : { 
        aggression: 0.5, 
        bluffFrequency: 0.3, 
        tightness: 0.6 
      }

  const boardTexture = getBoardTexture(board)
  const handStrength = getHandStrength(holeCards, board)
  const texture = BOARD_TEXTURES[boardTexture] || BOARD_TEXTURES['Dry']
  const opponent = OPPONENT_STRATEGIES[opponentType] || OPPONENT_STRATEGIES['Tight-Passive']
  
  // Adjust c-bet frequency based on variance
  const shouldCBet = Math.random() < (
    texture.cBetFrequency * 
    (1 + (variance.aggression - 0.5)) * 
    (position === 'BTN' ? 1.1 : 1)
  )

  // Facing a bet
  if (hasBetInFront && betSize) {
    const potOdds = betSize / (potSize + betSize)
    const isInPosition = position === 'BTN' || position === 'CO'
    
    // More aggressive raises with higher variance
    if (handStrength === 'Nuts' || handStrength === 'Strong') {
      const raiseSize = isInPosition 
        ? betSize * (2.5 + variance.aggression) 
        : betSize * (2 + variance.aggression)
      
      return {
        action: 'raise',
        sizing: raiseSize,
        confidence: 'high',
        reasoning: `Strong hand on ${boardTexture} board, ${isInPosition ? 'exploiting position' : 'protecting hand'}`
      }
    }
    
    // Draw handling with variance
    if (handStrength === 'Draw') {
      // More likely to semi-bluff raise with higher aggression
      if (isInPosition && potOdds < (0.35 - variance.tightness * 0.1)) {
        const raiseSize = betSize * (2 + variance.aggression)
        return {
          action: 'raise',
          sizing: raiseSize,
          confidence: 'medium',
          reasoning: `Semi-bluff raising with draw in position`
        }
      }
      
      if (potOdds < 0.3) {
        return {
          action: 'call',
          sizing: betSize,
          confidence: 'high',
          reasoning: `Good drawing hand with correct pot odds`
        }
      }
    }
    
    // Floating with backdoor draws more often with higher aggression
    if (isInPosition && 
        handStrength === 'Mediocre' && 
        hasBackdoorDraws(holeCards, board) && 
        Math.random() < variance.aggression) {
      return {
        action: 'call',
        sizing: betSize,
        confidence: 'medium',
        reasoning: `Floating with backdoor draws in position`
      }
    }
    
    return {
      action: 'fold',
      sizing: 0,
      confidence: 'high',
      reasoning: `Too weak to continue on ${boardTexture} board`
    }
  }
  
  // Betting as aggressor
  if ((handStrength === 'Nuts' || handStrength === 'Strong') && shouldCBet) {
    const sizing = texture.betSizing.strong * potSize * 
      (1 + (variance.aggression - 0.5) * 0.2)
    
    return {
      action: 'bet',
      sizing,
      confidence: 'high',
      reasoning: `Value betting strong hand on ${boardTexture} board`
    }
  }
  
  // Semi-bluffing with draws, influenced by variance
  if ((handStrength === 'Draw' || 
       (hasBackdoorDraws(holeCards, board) && 
        Math.random() < variance.bluffFrequency)) && 
      shouldCBet) {
    const sizing = texture.betSizing.bluff * potSize * 
      (1 + (variance.aggression - 0.5) * 0.2)
    
    return {
      action: 'bet',
      sizing,
      confidence: 'medium',
      reasoning: `Semi-bluffing with ${handStrength === 'Draw' ? 'strong' : 'backdoor'} draws`
    }
  }
  
  // Pure bluffs on dry boards, controlled by variance
  if (position === 'BTN' && 
      boardTexture === 'Dry' && 
      shouldCBet && 
      Math.random() < variance.bluffFrequency) {
    const sizing = texture.betSizing.bluff * potSize * 0.8
    
    return {
      action: 'bet',
      sizing,
      confidence: 'low',
      reasoning: `Bluffing dry board with range advantage`
    }
  }
  
  return {
    action: 'check',
    sizing: 0,
    confidence: 'high',
    reasoning: `Checking ${handStrength} hand on ${boardTexture} board`
  }
} 