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
  type: 'Nuts' | 'Strong' | 'Good' | 'Draw' | 'Weak'
  examples: string[]
  strategy: {
    vsAggressive: string
    vsPassive: string
  }
}

const HAND_CATEGORIES: Record<HandCategory['type'], HandCategory> = {
  'Nuts': {
    type: 'Nuts',
    examples: ['Set+', 'Two pair+', 'Nut flush'],
    strategy: {
      vsAggressive: 'Slowplay occasionally',
      vsPassive: 'Bet for value'
    }
  },
  'Strong': {
    type: 'Strong',
    examples: ['Top pair good kicker', 'Overpair'],
    strategy: {
      vsAggressive: 'Bet for value',
      vsPassive: 'Bet for value'
    }
  },
  'Good': {
    type: 'Good',
    examples: ['Top pair weak kicker', 'Second pair'],
    strategy: {
      vsAggressive: 'Check/call or small bet',
      vsPassive: 'Bet for thin value'
    }
  },
  'Draw': {
    type: 'Draw',
    examples: ['Flush draw', 'Open-ended straight draw'],
    strategy: {
      vsAggressive: 'Check/call',
      vsPassive: 'Semi-bluff'
    }
  },
  'Weak': {
    type: 'Weak',
    examples: ['No pair no draw', 'Bottom pair'],
    strategy: {
      vsAggressive: 'Check/fold',
      vsPassive: 'Check behind'
    }
  }
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

export function getFlopAdvice(
  holeCards: string,
  board: string,
  position: string,
  potSize: number,
  effectiveStack: number,
  opponentType: OpponentType['type'],
  hasBetInFront: boolean,
  betSize?: number
): FlopAdvice {
  const boardTexture = getBoardTexture(board)
  const handStrength = getHandStrength(holeCards, board)
  const texture = BOARD_TEXTURES[boardTexture]
  const opponent = OPPONENT_STRATEGIES[opponentType]
  const hand = HAND_CATEGORIES[handStrength]
  
  // Facing a bet
  if (hasBetInFront && betSize) {
    const potOdds = betSize / (potSize + betSize)
    
    if (handStrength === 'Nuts' || handStrength === 'Strong') {
      return {
        action: 'raise',
        sizing: betSize * 3,
        confidence: 'high',
        reasoning: `Strong hand on ${boardTexture} board vs ${opponentType}`
      }
    }
    
    if (handStrength === 'Draw' && potOdds < 0.3) {
      return {
        action: 'call',
        sizing: betSize,
        confidence: 'high',
        reasoning: `Good drawing hand with correct pot odds`
      }
    }
    
    return {
      action: 'fold',
      sizing: 0,
      confidence: 'high',
      reasoning: `Too weak to continue on ${boardTexture} board vs ${opponentType}`
    }
  }
  
  // Betting as aggressor
  const shouldCBet = Math.random() < texture.cBetFrequency
  
  if (handStrength === 'Nuts' || handStrength === 'Strong') {
    const sizing = texture.betSizing.strong * potSize
    return {
      action: 'bet',
      sizing,
      confidence: 'high',
      reasoning: `Value betting strong hand on ${boardTexture} board`
    }
  }
  
  if (handStrength === 'Draw' && shouldCBet) {
    const sizing = texture.betSizing.bluff * potSize
    return {
      action: 'bet',
      sizing,
      confidence: 'medium',
      reasoning: `Semi-bluffing with draw on ${boardTexture} board`
    }
  }
  
  if (shouldCBet && opponentType === 'Tight-Passive') {
    const sizing = texture.betSizing.bluff * potSize
    return {
      action: 'bet',
      sizing,
      confidence: 'medium',
      reasoning: `Bluffing on ${boardTexture} board vs tight-passive opponent`
    }
  }
  
  return {
    action: 'check',
    sizing: 0,
    confidence: 'high',
    reasoning: `Checking weak hand on ${boardTexture} board`
  }
} 