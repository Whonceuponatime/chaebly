interface TurnHandCategory {
  type: 'Nuts' | 'Strong' | 'Mediocre' | 'StrongDraw' | 'WeakDraw' | 'Air'
  examples: string[]
  strategy: {
    inPosition: string
    outOfPosition: string
  }
}

const TURN_HAND_CATEGORIES: Record<TurnHandCategory['type'], TurnHandCategory> = {
  'Nuts': {
    type: 'Nuts',
    examples: ['Nut flush', 'Set+', 'Top two pair'],
    strategy: {
      inPosition: 'Bet big (70-100% pot)',
      outOfPosition: 'Check-raise or bet big'
    }
  },
  'Strong': {
    type: 'Strong',
    examples: ['Two pair', 'Overpair', 'Top pair strong kicker'],
    strategy: {
      inPosition: 'Bet medium (50-75% pot)',
      outOfPosition: 'Bet for value or check-call'
    }
  },
  'Mediocre': {
    type: 'Mediocre',
    examples: ['Top pair weak kicker', 'Second pair', 'Pocket pair below board'],
    strategy: {
      inPosition: 'Small bet (25-50% pot) or check',
      outOfPosition: 'Check-call or check-fold'
    }
  },
  'StrongDraw': {
    type: 'StrongDraw',
    examples: ['Flush draw + straight draw', 'Nut flush draw', 'Open-ended straight draw'],
    strategy: {
      inPosition: 'Semi-bluff (50-75% pot)',
      outOfPosition: 'Check-call or check-raise'
    }
  },
  'WeakDraw': {
    type: 'WeakDraw',
    examples: ['Gutshot', 'Small flush draw', 'Backdoor draws'],
    strategy: {
      inPosition: 'Check behind',
      outOfPosition: 'Check-fold'
    }
  },
  'Air': {
    type: 'Air',
    examples: ['No pair no draw', 'Bottom pair no draw'],
    strategy: {
      inPosition: 'Check behind',
      outOfPosition: 'Check-fold'
    }
  }
}

interface BoardType {
  type: 'Dry' | 'Semi-Wet' | 'Wet' | 'Paired' | 'Three-to-Flush' | 'Three-to-Straight'
  betSizing: {
    value: number
    bluff: number
  }
  description: string
}

const BOARD_TYPES: Record<BoardType['type'], BoardType> = {
  'Dry': {
    type: 'Dry',
    betSizing: {
      value: 0.6, // 60% pot
      bluff: 0.4  // 40% pot
    },
    description: 'Uncoordinated board with few draws'
  },
  'Semi-Wet': {
    type: 'Semi-Wet',
    betSizing: {
      value: 0.7,
      bluff: 0.5
    },
    description: 'Some drawing possibilities'
  },
  'Wet': {
    type: 'Wet',
    betSizing: {
      value: 0.8,
      bluff: 0.6
    },
    description: 'Many drawing possibilities'
  },
  'Paired': {
    type: 'Paired',
    betSizing: {
      value: 0.5,
      bluff: 0.3
    },
    description: 'Board contains a pair'
  },
  'Three-to-Flush': {
    type: 'Three-to-Flush',
    betSizing: {
      value: 0.75,
      bluff: 0.5
    },
    description: 'Three cards of the same suit'
  },
  'Three-to-Straight': {
    type: 'Three-to-Straight',
    betSizing: {
      value: 0.7,
      bluff: 0.5
    },
    description: 'Three connected cards'
  }
}

interface TurnAdvice {
  action: 'check' | 'bet' | 'raise' | 'fold' | 'call'
  sizing: number
  confidence: 'high' | 'medium' | 'low'
  reasoning: string
}

export function evaluateTurnCard(
  flop: string,
  turn: string,
  heroCards: string
): {
  improvedHero: boolean
  improvedVillain: boolean
  relativeStrengthChange: 'improved' | 'neutral' | 'worse'
} {
  // Example: Flop: J♠ T♠ 5♣ → Turn: 3♠
  const flopCards = flop.match(/[2-9TJQKA][♠♣♥♦]/g) || []
  const turnCard = turn.match(/[2-9TJQKA][♠♣♥♦]/g)?.[0]
  const heroRanks = heroCards.match(/[2-9TJQKA]/g) || []
  
  if (!turnCard || flopCards.length !== 3) return {
    improvedHero: false,
    improvedVillain: false,
    relativeStrengthChange: 'neutral'
  }

  // Check if turn completes obvious draws
  const allSuits = flopCards.map(c => c[1]).filter(Boolean)
  if (turnCard[1]) allSuits.push(turnCard[1])
  
  const allRanks = flopCards.map(c => c[0]).filter(Boolean)
  if (turnCard[0]) allRanks.push(turnCard[0])
  
  const completesFlush = new Set(allSuits).size === 1
  const completesStraight = hasConnectedCards(allRanks)
  
  // Check if turn helps hero's hand
  const heroImprovement = heroRanks.some(r => r === turnCard[0])
  
  // Assess relative strength change
  let strengthChange: 'improved' | 'neutral' | 'worse' = 'neutral'
  if (heroImprovement) {
    strengthChange = 'improved'
  } else if (completesFlush || completesStraight) {
    strengthChange = 'worse'
  }
  
  return {
    improvedHero: heroImprovement,
    improvedVillain: completesFlush || completesStraight,
    relativeStrengthChange: strengthChange
  }
}

function hasConnectedCards(ranks: string[]): boolean {
  const values = ranks.map(r => '23456789TJQKA'.indexOf(r)).sort((a, b) => a - b)
  return values[values.length - 1] - values[0] <= 4
}

export function getTurnHandStrength(
  holeCards: string,
  board: string
): TurnHandCategory['type'] {
  // This is a simplified version - would need a more sophisticated hand evaluator
  const ranks = [...board.match(/[2-9TJQKA]/g) || [], ...holeCards.match(/[2-9TJQKA]/g) || []]
  const suits = [...board.match(/[♠♣♥♦]/g) || [], ...holeCards.match(/[♠♣♥♦]/g) || []]
  
  // Count ranks for pairs/sets
  const rankCounts = ranks.reduce((acc, r) => {
    acc[r] = (acc[r] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  // Count suits for flush draws
  const suitCounts = suits.reduce((acc, s) => {
    acc[s] = (acc[s] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  // Check for made hands
  if (Object.values(rankCounts).some(count => count >= 3)) return 'Nuts' // Set or better
  if (Object.values(rankCounts).filter(count => count === 2).length >= 2) return 'Strong' // Two pair
  if (Object.values(rankCounts).some(count => count === 2)) return 'Mediocre' // One pair
  
  // Check for draws
  const hasFlushDraw = Object.values(suitCounts).some(count => count >= 4)
  const hasStraightDraw = hasConnectedCards(ranks)
  
  if (hasFlushDraw && hasStraightDraw) return 'StrongDraw'
  if (hasFlushDraw || hasStraightDraw) return 'WeakDraw'
  
  return 'Air'
}

export function getTurnAdvice(
  holeCards: string,
  flop: string,
  turn: string,
  position: 'IP' | 'OOP',
  potSize: number,
  effectiveStack: number,
  hasBetInFront: boolean,
  betSize?: number
): TurnAdvice {
  const board = `${flop} ${turn}`
  const handStrength = getTurnHandStrength(holeCards, board)
  const turnEvaluation = evaluateTurnCard(flop, turn, holeCards)
  const hand = TURN_HAND_CATEGORIES[handStrength]
  
  // Facing a bet
  if (hasBetInFront && betSize) {
    const potOdds = betSize / (potSize + betSize)
    
    if (handStrength === 'Nuts' || handStrength === 'Strong') {
      return {
        action: 'raise',
        sizing: betSize * 2.5,
        confidence: 'high',
        reasoning: `Strong hand improved on turn, raising for value`
      }
    }
    
    if (handStrength === 'StrongDraw' && potOdds < 0.25) {
      return {
        action: 'call',
        sizing: betSize,
        confidence: 'high',
        reasoning: `Strong draw with good pot odds`
      }
    }
    
    if (handStrength === 'Mediocre' && position === 'IP' && betSize <= 0.5 * potSize) {
      return {
        action: 'call',
        sizing: betSize,
        confidence: 'medium',
        reasoning: `Medium strength hand, calling with position`
      }
    }
    
    return {
      action: 'fold',
      sizing: 0,
      confidence: 'high',
      reasoning: `Too weak to continue against turn aggression`
    }
  }
  
  // Betting as aggressor
  if (handStrength === 'Nuts' || handStrength === 'Strong') {
    const sizing = position === 'IP' ? 0.75 * potSize : 0.66 * potSize
    return {
      action: 'bet',
      sizing,
      confidence: 'high',
      reasoning: `Value betting strong hand on turn`
    }
  }
  
  if (handStrength === 'StrongDraw' && position === 'IP') {
    return {
      action: 'bet',
      sizing: 0.66 * potSize,
      confidence: 'medium',
      reasoning: `Semi-bluffing strong draw in position`
    }
  }
  
  if (handStrength === 'Mediocre' && position === 'IP' && !turnEvaluation.improvedVillain) {
    return {
      action: 'bet',
      sizing: 0.4 * potSize,
      confidence: 'medium',
      reasoning: `Small value bet with medium strength hand`
    }
  }
  
  return {
    action: 'check',
    sizing: 0,
    confidence: 'high',
    reasoning: position === 'OOP' ? 
      'Checking weak hand out of position' : 
      'Checking behind with weak hand'
  }
} 