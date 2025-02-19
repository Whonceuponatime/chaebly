interface PreflopRange {
  range: string[]
  raiseSize: number
  frequency: number
}

interface PositionStrategy {
  openingRange: PreflopRange
  vsRaise: {
    call: string[]
    threebet: string[]
    fold: string[]
  }
  stackAdjustments: {
    deep: string[]
    standard: string[]
    short: string[]
    veryShort: string[]
  }
}

const POSITION_RANGES: Record<string, PositionStrategy> = {
  UTG: {
    openingRange: {
      range: ['22+', 'AJo+', 'KQo', 'A2s+', 'KTs+', 'QTs+', 'JTs'],
      raiseSize: 2.5,
      frequency: 0.12 // 12%
    },
    vsRaise: {
      call: ['JJ-99', 'AQo', 'AJs-ATs', 'KQs'],
      threebet: ['QQ+', 'AK'],
      fold: ['Rest']
    },
    stackAdjustments: {
      deep: ['Add: 87s-65s'],
      standard: ['Remove: A2s-A5s'],
      short: ['Remove: 22-55'],
      veryShort: ['Only: TT+, AQ+']
    }
  },
  MP: {
    openingRange: {
      range: ['22+', 'ATo+', 'KJo+', 'QJo', 'A2s+', 'K9s+', 'Q9s+', 'J9s+', 'T9s', '98s', '87s'],
      raiseSize: 2.3,
      frequency: 0.18 // 18%
    },
    vsRaise: {
      call: ['TT-77', 'AJs-ATs', 'KQs-KJs'],
      threebet: ['JJ+', 'AK', 'AQs'],
      fold: ['Rest']
    },
    stackAdjustments: {
      deep: ['Add: 76s-54s'],
      standard: ['Standard range'],
      short: ['Remove: 22-66'],
      veryShort: ['Only: 99+, AJ+']
    }
  },
  CO: {
    openingRange: {
      range: ['22+', 'A8o+', 'KTo+', 'QTo+', 'JTo', 'A2s+', 'K7s+', 'Q8s+', 'J8s+', 'T8s+', '97s+', '86s+', '76s', '65s'],
      raiseSize: 2.2,
      frequency: 0.28 // 28%
    },
    vsRaise: {
      call: ['99-66', 'ATs+', 'KJs+', 'QJs'],
      threebet: ['TT+', 'AK', 'AQs', 'AJs'],
      fold: ['Rest']
    },
    stackAdjustments: {
      deep: ['Add: 54s-32s'],
      standard: ['Standard range'],
      short: ['Remove: 22-55, weak Ax'],
      veryShort: ['Only: 88+, AT+']
    }
  },
  BTN: {
    openingRange: {
      range: ['22+', 'A2o+', 'K6o+', 'Q8o+', 'J8o+', 'T8o+', 'A2s+', 'K2s+', 'Q4s+', 'J6s+', 'T6s+', '96s+', '85s+', '75s+', '64s+', '53s', '43s'],
      raiseSize: 2.0,
      frequency: 0.45 // 45%
    },
    vsRaise: {
      call: ['88-22', 'AT+', 'KJ+', 'QJ+', 'Any suited Ax'],
      threebet: ['99+', 'AK', 'AQs', 'AJs', 'KQs'],
      fold: ['Rest']
    },
    stackAdjustments: {
      deep: ['Add: All suited connectors'],
      standard: ['Standard range'],
      short: ['Remove: 22-44, weak offsuit hands'],
      veryShort: ['Only: 77+, A9+, KJ+']
    }
  },
  SB: {
    openingRange: {
      range: ['22+', 'A4o+', 'K9o+', 'QTo+', 'JTo', 'A2s+', 'K5s+', 'Q7s+', 'J7s+', 'T7s+', '97s+', '87s', '76s', '65s'],
      raiseSize: 3.0,
      frequency: 0.22 // 22%
    },
    vsRaise: {
      call: ['88-55', 'AJ-AT', 'KQ', 'Suited broadways'],
      threebet: ['99+', 'AK', 'AQs', 'AJs'],
      fold: ['Rest']
    },
    stackAdjustments: {
      deep: ['Consider limping strong hands'],
      standard: ['Standard range'],
      short: ['Remove: 22-66, weak suited hands'],
      veryShort: ['Only: 88+, AJ+']
    }
  },
  BB: {
    openingRange: {
      range: ['22+', 'A2o+', 'K2o+', 'Q4o+', 'J6o+', 'T6o+', '96o+', '86o+', '75o+', '65o', '54o', 'A2s+', 'K2s+', 'Q2s+', 'J2s+', 'T2s+', '92s+', '82s+', '72s+', '62s+', '52s+', '42s+', '32s'],
      raiseSize: 3.0,
      frequency: 0.5 // 50%
    },
    vsRaise: {
      call: ['Any pair', 'Any Ax', 'Any KT+', 'Any suited connector'],
      threebet: ['TT+', 'AK', 'AQs', 'AJs', 'KQs'],
      fold: ['Very weak hands']
    },
    stackAdjustments: {
      deep: ['Defend wider, call with more hands'],
      standard: ['Standard defending range'],
      short: ['Tighten up vs small raises'],
      veryShort: ['Only: 77+, AT+, KJ+']
    }
  }
}

interface StackSizeCategory {
  name: 'Deep' | 'Standard' | 'Short' | 'Very Short'
  minBB: number
  maxBB: number
}

const STACK_CATEGORIES: StackSizeCategory[] = [
  { name: 'Deep', minBB: 50, maxBB: Infinity },
  { name: 'Standard', minBB: 30, maxBB: 50 },
  { name: 'Short', minBB: 20, maxBB: 30 },
  { name: 'Very Short', minBB: 0, maxBB: 20 }
]

export function getStackCategory(effectiveStackBB: number): StackSizeCategory['name'] {
  return STACK_CATEGORIES.find(cat => 
    effectiveStackBB >= cat.minBB && effectiveStackBB < cat.maxBB
  )?.name || 'Standard'
}

export function isHandInRange(hand: string, rangeStr: string): boolean {
  // Validate hand format (e.g., "AhKs", "TdJc")
  if (!/^[2-9TJQKA][hdcs][2-9TJQKA][hdcs]$/.test(hand)) return false
  
  const [rank1, suit1, rank2, suit2] = hand.split('') as [string, string, string, string]
  const isSuited = suit1 === suit2
  const handType = isSuited ? 's' : 'o'
  
  // Sort ranks for consistent comparison (e.g., "AK" instead of "KA")
  const sortedRanks = [rank1, rank2].sort((a, b) => {
    const rankOrder = '23456789TJQKA'
    return rankOrder.indexOf(b) - rankOrder.indexOf(a)
  })
  const handStr = sortedRanks.join('') + handType

  // Split range string into individual range patterns and remove empty strings
  const patterns = rangeStr.split(/[,\s]+/).filter(Boolean)
  
  const rankOrder = '23456789TJQKA'
  
  for (const pattern of patterns) {
    // Handle "+" notation (e.g., "55+", "ATs+", "ATo+")
    if (pattern.endsWith('+')) {
      const basePattern = pattern.slice(0, -1)
      
      // Pocket pairs with "+"
      if (basePattern.length === 2 && basePattern[0] === basePattern[1]) {
        const minRank = basePattern[0]
        if (!minRank) continue
        
        if (rank1 === rank2) { // We have a pocket pair
          if (rankOrder.indexOf(rank1) >= rankOrder.indexOf(minRank)) {
            return true
          }
        }
        continue
      }
      
      // Non-pair hands with "+" (e.g., "ATs+", "ATo+")
      if (basePattern.length === 3) {
        const highCard = basePattern[0]
        const lowCard = basePattern[1]
        const suitedness = basePattern[2]
        
        if (!highCard || !lowCard || !suitedness) continue
        if (suitedness === 's' && !isSuited) continue
        if (suitedness === 'o' && isSuited) continue
        
        const handHighCard = sortedRanks[0]
        const handLowCard = sortedRanks[1]
        
        if (!handHighCard || !handLowCard) continue
        
        // Check if hand matches the pattern
        if (handHighCard === highCard && 
            rankOrder.indexOf(handLowCard) >= rankOrder.indexOf(lowCard)) {
          return true
        }
      }
      continue
    }
    
    // Exact match (e.g., "AKs", "TT")
    if (pattern === handStr) {
      return true
    }
  }
  
  return false
}

// Type definitions for ranges
export type Position = 'UTG' | 'MP' | 'CO' | 'BTN' | 'SB' | 'BB'
export type StackDepth = 'deep' | 'short'
export type OpponentType = 'tight' | 'loose'
export type PositionVS = 'vs_UTG' | 'vs_MP' | 'vs_CO' | 'vs_BTN' | 'vs_SB'
export type StackCategory = 'deep_stack' | 'standard_stack' | 'short_stack'
export type PositionType = 'IP' | 'OOP'

export interface PreflopAdvice {
  action: 'fold' | 'call' | 'raise'
  sizing: number
  confidence: 'high' | 'medium' | 'low'
  reasoning: string
}

// Updated dynamic preflop ranges based on position and stack depth
const DYNAMIC_PREFLOP_RANGES: Record<Position, Record<StackDepth, string[]>> = {
  UTG: {
    deep: [
      // Pairs
      "22", "33", "44", "55", "66", "77", "88", "99", "TT", "JJ", "QQ", "KK", "AA",
      // Broadway offsuit
      "AJo", "AQo", "AKo", "KQo",
      // Suited hands
      "A2s", "A3s", "A4s", "A5s", "A6s", "A7s", "A8s", "A9s", "ATs", "AJs", "AQs", "AKs",
      "KTs", "KJs", "KQs", "QTs", "QJs", "JTs"
    ],
    short: ["55+", "ATo+", "KQs", "A2s+", "K9s+", "QTs+", "J9s+"] // Keep short stack ranges
  },
  MP: {
    deep: [
      // Pairs
      "22", "33", "44", "55", "66", "77", "88", "99", "TT", "JJ", "QQ", "KK", "AA",
      // Broadway offsuit
      "AJo", "AQo", "AKo", "KQo",
      // Suited hands
      "A9s", "ATs", "AJs", "AQs", "AKs",
      "KTs", "KJs", "KQs",
      "QTs", "QJs", "JTs", "T9s"
    ],
    short: ["66+", "AJo+", "KQo", "A8s+", "KTs+", "QJs", "JTs"] // Keep short stack ranges
  },
  CO: {
    deep: [
      // Pairs
      "22", "33", "44", "55", "66", "77", "88", "99", "TT", "JJ", "QQ", "KK", "AA",
      // Broadway and strong offsuit
      "A7o", "A8o", "A9o", "ATo", "AJo", "AQo", "AKo",
      "KTo", "KJo", "QTo", "JTo",
      // Suited hands
      "A2s", "A3s", "A4s", "A5s", "A6s", "A7s", "A8s", "A9s", "ATs", "AJs", "AQs", "AKs",
      "K7s", "K8s", "K9s", "KTs", "KJs", "KQs",
      "Q8s", "Q9s", "QTs", "QJs",
      "J8s", "J9s", "JTs",
      "T8s", "T9s",
      "97s", "98s"
    ],
    short: ["77+", "A9o+", "KJo+", "QJo", "A5s+", "K9s+", "QTs+", "J9s+"] // Keep short stack ranges
  },
  BTN: {
    deep: [
      // Pairs
      "22", "33", "44", "55", "66", "77", "88", "99", "TT", "JJ", "QQ", "KK", "AA",
      // Broadway and strong offsuit
      "A2o", "A3o", "A4o", "A5o", "A6o", "A7o", "A8o", "A9o", "ATo", "AJo", "AQo", "AKo",
      "K6o", "K7o", "K8o", "K9o", "KTo", "KJo", "KQo",
      "Q8o", "Q9o", "QTo",
      "J8o", "J9o", "JTo",
      "T8o", "T9o",
      // Suited hands
      "A2s", "A3s", "A4s", "A5s", "A6s", "A7s", "A8s", "A9s", "ATs", "AJs", "AQs", "AKs",
      "K2s", "K3s", "K4s", "K5s", "K6s", "K7s", "K8s", "K9s", "KTs", "KJs", "KQs",
      "Q4s", "Q5s", "Q6s", "Q7s", "Q8s", "Q9s", "QTs", "QJs",
      "J6s", "J7s", "J8s", "J9s", "JTs",
      "T7s", "T8s", "T9s"
    ],
    short: ["88+", "A8o+", "KTo+", "QTo+", "JTo", "A4s+", "K8s+", "QTs+", "J9s+"] // Keep short stack ranges
  },
  SB: {
    deep: [
      // Pairs
      "22", "33", "44", "55", "66", "77", "88", "99", "TT", "JJ", "QQ", "KK", "AA",
      // Broadway and strong offsuit
      "A4o", "A5o", "A6o", "A7o", "A8o", "A9o", "ATo", "AJo", "AQo", "AKo",
      "K9o", "KTo", "KJo",
      "QTo", "JTo",
      // Suited hands
      "A2s", "A3s", "A4s", "A5s", "A6s", "A7s", "A8s", "A9s", "ATs", "AJs", "AQs", "AKs",
      "K5s", "K6s", "K7s", "K8s", "K9s", "KTs", "KJs", "KQs",
      "Q7s", "Q8s", "Q9s", "QTs",
      "J7s", "J8s", "J9s", "JTs",
      "T7s", "T8s", "T9s"
    ],
    short: ["77+", "A7o+", "KTo+", "QJo", "A2s+", "K7s+", "Q9s+", "J9s+"] // Keep short stack ranges
  },
  BB: {
    deep: [
      // Pairs
      "22", "33", "44", "55", "66", "77", "88", "99", "TT", "JJ", "QQ", "KK", "AA",
      // Broadway and strong offsuit
      "A2o", "A3o", "A4o", "A5o", "A6o", "A7o", "A8o", "A9o", "ATo", "AJo", "AQo", "AKo",
      "K2o", "K3o", "K4o", "K5o", "K6o", "K7o", "K8o", "K9o", "KTo", "KJo", "KQo",
      "Q4o", "Q5o", "Q6o", "Q7o", "Q8o", "Q9o", "QTo",
      "J6o", "J7o", "J8o", "J9o", "JTo",
      "T6o", "T7o", "T8o", "T9o",
      // Suited hands
      "A2s", "A3s", "A4s", "A5s", "A6s", "A7s", "A8s", "A9s", "ATs", "AJs", "AQs", "AKs",
      "K2s", "K3s", "K4s", "K5s", "K6s", "K7s", "K8s", "K9s", "KTs", "KJs", "KQs",
      "Q2s", "Q3s", "Q4s", "Q5s", "Q6s", "Q7s", "Q8s", "Q9s", "QTs", "QJs",
      "J2s", "J3s", "J4s", "J5s", "J6s", "J7s", "J8s", "J9s", "JTs",
      "T2s", "T3s", "T4s", "T5s", "T6s", "T7s", "T8s", "T9s"
    ],
    short: ["22+", "A2o+", "K8o+", "QTo+", "JTo", "A2s+", "K6s+", "Q8s+", "J8s+"] // Keep short stack ranges
  }
}

// Updated 3-bet ranges to be more aggressive vs late position opens
const THREE_BET_RANGES: Record<PositionVS, Record<OpponentType, string[]>> = {
  vs_UTG: {
    tight: ["QQ+", "AKs", "AQs", "A5s", "KQs"],  // Premium only vs UTG
    loose: ["JJ+", "AK", "AQs", "A5s", "KQs", "JTs"]  // Slightly wider vs loose UTG
  },
  vs_MP: {
    tight: ["JJ+", "AKs", "AQs", "KJs", "T9s", "A5s"],  // Add some bluffs
    loose: ["TT+", "AK", "AQs", "KJs", "QJs", "JTs", "T9s", "98s"]  // More aggressive vs loose
  },
  vs_CO: {
    tight: ["99+", "AJs+", "KQs", "A5s", "KTs+", "QJs", "JTs", "T9s"],  // Wider vs CO
    loose: ["88+", "AJ+", "KQ", "A5s", "A4s", "KTs+", "QJs", "JTs", "T9s", "98s"]  // Very aggressive vs loose CO
  },
  vs_BTN: {
    tight: ["88+", "ATs+", "KJs+", "QJs", "JTs", "T9s", "98s", "87s", "A5s"],  // Wide vs BTN
    loose: ["77+", "A5s+", "KT+", "QJ+", "JTs", "T9s", "98s", "87s", "76s"]  // Very wide vs loose BTN
  },
  vs_SB: {
    tight: ["77+", "A5s+", "K9s+", "QTs+", "J9s+", "T9s", "98s", "87s"],  // Aggressive vs SB
    loose: ["66+", "A2s+", "K9+", "QT+", "JT+", "T9s", "98s", "87s", "76s"]  // Very aggressive vs loose SB
  }
}

// Updated 4-bet ranges to include more bluffs in position
const FOUR_BET_RANGES: Record<StackCategory, Record<PositionType, string[]>> = {
  deep_stack: {
    IP: ["QQ+", "AKs", "AK", "AQs", "A5s", "A4s", "KQs"],  // More 4-bet bluffs IP
    OOP: ["KK+", "AKs", "AQs", "A5s"]  // Tighter OOP
  },
  standard_stack: {
    IP: ["JJ+", "AKs", "AK", "AQs", "A5s"],  // Still some bluffs with 100BB
    OOP: ["KK+", "AKs", "AK"]  // Very tight OOP
  },
  short_stack: {
    IP: ["TT+", "AK"],  // Value-heavy when short
    OOP: ["QQ+", "AK"]  // Premium only OOP short
  }
}

// Updated push/fold ranges for short stack play
const PUSH_FOLD_RANGES: Record<Position, string[]> = {
  UTG: ["22+", "A5s+", "A7o+", "K9s+", "KJo+", "QTs+"],  // 10-12BB push range
  MP: ["22+", "A2s+", "A9o+", "KTs+", "QJs", "JTs"],  // Slightly wider
  CO: ["22+", "A2s+", "A7o+", "K9s+", "Q9s+", "J9s+", "T8s+", "98s"],  // Much wider
  BTN: ["22+", "A2s+", "A2o+", "K5s+", "Q7s+", "J8s+", "T7s+", "97s+"],  // Very wide
  SB: ["22+", "A2s+", "A2o+", "K2s+", "Q2s+", "J2s+", "T2s+", "92s+"],  // Push or complete
  BB: ["22+", "A2s+", "A2o+", "K2s+", "Q2s+", "J2s+", "T2s+", "92s+"]  // Call pushes wider
}

// Tournament stage-based ranges
interface TournamentStage {
  name: 'Early' | 'Middle' | 'Late' | 'Final Table'
  stackRanges: {
    deep: string[]    // >40BB
    medium: string[]  // 20-40BB
    short: string[]   // 10-20BB
    critical: string[] // <10BB
  }
}

const TOURNAMENT_RANGES: Record<Position, Record<TournamentStage['name'], TournamentStage['stackRanges']>> = {
  UTG: {
    'Early': {
      deep: [
        // Conservative early stage deep stack play
        "77+", "AJo+", "KQo", "ATs+", "KTs+", "QTs+", "JTs"
      ],
      medium: [
        // Slightly tighter with medium stack
        "88+", "AJo+", "KQo", "ATs+", "KJs+", "QJs"
      ],
      short: [
        // Push/fold territory approaching
        "99+", "ATo+", "KQo", "ATs+"
      ],
      critical: [
        // Pure push/fold
        "22+", "A2+", "K9+", "QJ+"
      ]
    },
    'Middle': {
      deep: [
        // Can open slightly wider
        "66+", "ATo+", "KQo", "A9s+", "KTs+", "QTs+", "JTs"
      ],
      medium: [
        // Standard ranges
        "77+", "ATo+", "KQo", "A9s+", "KTs+"
      ],
      short: [
        // Push/fold approaching
        "88+", "A9o+", "KJo+", "A8s+"
      ],
      critical: [
        // Pure push/fold
        "22+", "A2+", "K8+", "QT+"
      ]
    },
    'Late': {
      deep: [
        // Increased pressure
        "55+", "A9o+", "KJo+", "A8s+", "K9s+", "Q9s+", "J9s+"
      ],
      medium: [
        // More aggressive
        "66+", "A9o+", "KJo+", "A7s+", "K9s+"
      ],
      short: [
        // Wider push/fold
        "77+", "A8o+", "KTo+", "A5s+"
      ],
      critical: [
        // Very wide push/fold
        "22+", "A2+", "K7+", "Q9+"
      ]
    },
    'Final Table': {
      deep: [
        // Aggressive play
        "44+", "A8o+", "KTo+", "A7s+", "K8s+", "Q9s+", "J9s+"
      ],
      medium: [
        // Increased aggression
        "55+", "A8o+", "KTo+", "A6s+", "K8s+"
      ],
      short: [
        // Very wide push/fold
        "66+", "A7o+", "K9o+", "A4s+"
      ],
      critical: [
        // Extremely wide push/fold
        "22+", "A2+", "K6+", "Q8+"
      ]
    }
  },
  MP: {
    'Early': {
      deep: [
        "66+", "ATo+", "KJo+", "A9s+", "KTs+", "QTs+", "JTs", "T9s"
      ],
      medium: [
        "77+", "ATo+", "KJo+", "A9s+", "KTs+"
      ],
      short: [
        "88+", "A9o+", "KQo", "A8s+"
      ],
      critical: [
        "22+", "A2+", "K8+", "QJ+"
      ]
    },
    'Middle': {
      deep: [
        "55+", "A9o+", "KTo+", "A8s+", "K9s+", "Q9s+", "J9s+", "T9s"
      ],
      medium: [
        "66+", "A9o+", "KTo+", "A7s+", "K9s+"
      ],
      short: [
        "77+", "A8o+", "KJo+", "A6s+"
      ],
      critical: [
        "22+", "A2+", "K7+", "QT+"
      ]
    },
    'Late': {
      deep: [
        "44+", "A8o+", "KTo+", "A6s+", "K8s+", "Q9s+", "J8s+"
      ],
      medium: [
        "55+", "A8o+", "K9o+", "A6s+", "K8s+"
      ],
      short: [
        "66+", "A7o+", "KTo+", "A4s+"
      ],
      critical: [
        "22+", "A2+", "K6+", "Q9+"
      ]
    },
    'Final Table': {
      deep: [
        "33+", "A7o+", "K9o+", "A5s+", "K7s+", "Q8s+", "J8s+"
      ],
      medium: [
        "44+", "A7o+", "K9o+", "A4s+", "K7s+"
      ],
      short: [
        "55+", "A6o+", "K9o+", "A3s+"
      ],
      critical: [
        "22+", "A2+", "K5+", "Q8+"
      ]
    }
  },
  CO: {
    'Early': {
      deep: [
        "55+", "A9o+", "KTo+", "A8s+", "K9s+", "Q9s+", "J9s+", "T9s", "98s"
      ],
      medium: [
        "66+", "A9o+", "KTo+", "A8s+", "K9s+", "Q9s+"
      ],
      short: [
        "77+", "A8o+", "KJo+", "A7s+", "K9s+"
      ],
      critical: [
        "22+", "A2+", "K7+", "QT+"
      ]
    },
    'Middle': {
      deep: [
        "44+", "A8o+", "K9o+", "A7s+", "K8s+", "Q8s+", "J8s+", "T8s+"
      ],
      medium: [
        "55+", "A8o+", "K9o+", "A6s+", "K8s+", "Q9s+"
      ],
      short: [
        "66+", "A7o+", "KTo+", "A5s+", "K8s+"
      ],
      critical: [
        "22+", "A2+", "K6+", "Q9+"
      ]
    },
    'Late': {
      deep: [
        "33+", "A7o+", "K8o+", "A5s+", "K7s+", "Q8s+", "J8s+", "T8s+"
      ],
      medium: [
        "44+", "A7o+", "K9o+", "A4s+", "K7s+", "Q8s+"
      ],
      short: [
        "55+", "A6o+", "K9o+", "A3s+", "K7s+"
      ],
      critical: [
        "22+", "A2+", "K5+", "Q8+"
      ]
    },
    'Final Table': {
      deep: [
        "22+", "A6o+", "K8o+", "A4s+", "K6s+", "Q7s+", "J7s+", "T7s+"
      ],
      medium: [
        "33+", "A6o+", "K8o+", "A3s+", "K6s+", "Q8s+"
      ],
      short: [
        "44+", "A5o+", "K8o+", "A2s+", "K6s+"
      ],
      critical: [
        "22+", "A2+", "K4+", "Q7+"
      ]
    }
  },
  BTN: {
    'Early': {
      deep: [
        "44+", "A8o+", "K9o+", "A7s+", "K8s+", "Q8s+", "J8s+", "T8s+", "98s", "87s"
      ],
      medium: [
        "55+", "A8o+", "K9o+", "A6s+", "K8s+", "Q9s+"
      ],
      short: [
        "66+", "A7o+", "KTo+", "A5s+", "K8s+"
      ],
      critical: [
        "22+", "A2+", "K6+", "Q9+"
      ]
    },
    'Middle': {
      deep: [
        "33+", "A7o+", "K8o+", "A5s+", "K7s+", "Q7s+", "J7s+", "T7s+", "97s+"
      ],
      medium: [
        "44+", "A7o+", "K8o+", "A4s+", "K7s+", "Q8s+"
      ],
      short: [
        "55+", "A6o+", "K9o+", "A3s+", "K7s+"
      ],
      critical: [
        "22+", "A2+", "K5+", "Q8+"
      ]
    },
    'Late': {
      deep: [
        "22+", "A5o+", "K7o+", "A3s+", "K6s+", "Q6s+", "J6s+", "T6s+", "96s+"
      ],
      medium: [
        "33+", "A5o+", "K7o+", "A2s+", "K6s+", "Q7s+"
      ],
      short: [
        "44+", "A4o+", "K8o+", "A2s+", "K6s+"
      ],
      critical: [
        "22+", "A2+", "K4+", "Q7+"
      ]
    },
    'Final Table': {
      deep: [
        "22+", "A4o+", "K6o+", "A2s+", "K5s+", "Q5s+", "J5s+", "T5s+", "95s+"
      ],
      medium: [
        "22+", "A4o+", "K6o+", "A2s+", "K5s+", "Q6s+"
      ],
      short: [
        "33+", "A3o+", "K7o+", "A2s+", "K5s+"
      ],
      critical: [
        "22+", "A2+", "K3+", "Q6+"
      ]
    }
  },
  SB: {
    'Early': {
      deep: [
        "55+", "A9o+", "KJo+", "A8s+", "K9s+", "Q9s+", "J9s+", "T9s"
      ],
      medium: [
        "66+", "A9o+", "KJo+", "A7s+", "K9s+"
      ],
      short: [
        "77+", "A8o+", "KQo", "A6s+"
      ],
      critical: [
        "22+", "A2+", "K7+", "QJ+"
      ]
    },
    'Middle': {
      deep: [
        "44+", "A8o+", "KTo+", "A6s+", "K8s+", "Q8s+", "J8s+"
      ],
      medium: [
        "55+", "A8o+", "KTo+", "A5s+", "K8s+"
      ],
      short: [
        "66+", "A7o+", "KJo+", "A4s+"
      ],
      critical: [
        "22+", "A2+", "K6+", "QT+"
      ]
    },
    'Late': {
      deep: [
        "33+", "A7o+", "K9o+", "A4s+", "K7s+", "Q7s+", "J7s+"
      ],
      medium: [
        "44+", "A7o+", "K9o+", "A3s+", "K7s+"
      ],
      short: [
        "55+", "A6o+", "KTo+", "A2s+"
      ],
      critical: [
        "22+", "A2+", "K5+", "Q9+"
      ]
    },
    'Final Table': {
      deep: [
        "22+", "A6o+", "K8o+", "A3s+", "K6s+", "Q6s+", "J6s+"
      ],
      medium: [
        "33+", "A6o+", "K8o+", "A2s+", "K6s+"
      ],
      short: [
        "44+", "A5o+", "K9o+", "A2s+"
      ],
      critical: [
        "22+", "A2+", "K4+", "Q8+"
      ]
    }
  },
  BB: {
    'Early': {
      deep: [
        // Wider defense ranges
        "22+", "A7o+", "K9o+", "QJo+", "A6s+", "K8s+", "Q8s+", "J8s+"
      ],
      medium: [
        "22+", "A8o+", "KTo+", "A7s+", "K9s+"
      ],
      short: [
        "33+", "A9o+", "KJo+", "A8s+"
      ],
      critical: [
        "22+", "A2+", "K8+", "QJ+"
      ]
    },
    'Middle': {
      deep: [
        "22+", "A6o+", "K8o+", "QTo+", "A5s+", "K7s+", "Q7s+", "J7s+"
      ],
      medium: [
        "22+", "A7o+", "K9o+", "A6s+", "K8s+"
      ],
      short: [
        "22+", "A8o+", "KTo+", "A7s+"
      ],
      critical: [
        "22+", "A2+", "K7+", "QT+"
      ]
    },
    'Late': {
      deep: [
        "22+", "A5o+", "K7o+", "Q9o+", "A4s+", "K6s+", "Q6s+", "J6s+"
      ],
      medium: [
        "22+", "A6o+", "K8o+", "A5s+", "K7s+"
      ],
      short: [
        "22+", "A7o+", "K9o+", "A6s+"
      ],
      critical: [
        "22+", "A2+", "K6+", "Q9+"
      ]
    },
    'Final Table': {
      deep: [
        "22+", "A4o+", "K6o+", "Q8o+", "A3s+", "K5s+", "Q5s+", "J5s+"
      ],
      medium: [
        "22+", "A5o+", "K7o+", "A4s+", "K6s+"
      ],
      short: [
        "22+", "A6o+", "K8o+", "A5s+"
      ],
      critical: [
        "22+", "A2+", "K5+", "Q8+"
      ]
    }
  }
}

// Add new function to get tournament stage ranges
export function getTournamentRange(
  position: Position,
  stage: TournamentStage['name'],
  effectiveStack: number
): string[] {
  // Determine stack category
  let stackCategory: keyof TournamentStage['stackRanges']
  if (effectiveStack > 40) stackCategory = 'deep'
  else if (effectiveStack > 20) stackCategory = 'medium'
  else if (effectiveStack > 10) stackCategory = 'short'
  else stackCategory = 'critical'

  return TOURNAMENT_RANGES[position][stage][stackCategory]
}

// Update position-based preflop adjustments with standardized bet sizes
function getPositionBasedAdjustments(
  position: string,
  heroCards: string,
  effectiveStack: number,
  opponentType: string,
  hasRaiseInFront: boolean,
  raiseSize?: number
): {
  action: 'fold' | 'call' | 'raise'
  sizing: number
  confidence: 'high' | 'medium' | 'low'
  reasoning: string
} {
  const handStrength = getHandCategory(heroCards)
  const isBlindPosition = position === 'SB' || position === 'BB'
  const isLatePosition = position === 'BTN' || position === 'CO'
  const isEarlyPosition = position === 'UTG' || position === 'MP'

  // Short stack push/fold strategy
  if (effectiveStack <= 15) {
    if (effectiveStack <= 10) {
      // Pure push/fold under 10BB
      if (isPremiumHand(heroCards) || isStrongHand(heroCards)) {
        return {
          action: 'raise',
          sizing: effectiveStack,
          confidence: 'high',
          reasoning: `Push/fold spot with ${effectiveStack}BB and strong hand`
        }
      }
      return {
        action: 'fold',
        sizing: 0,
        confidence: 'high',
        reasoning: `Fold in push/fold spot with ${effectiveStack}BB and weak hand`
      }
    } else {
      // 10-15BB strategy
      if (isUltraPremiumHand(heroCards)) {
        // Can trap with ultra premium hands
        return {
          action: 'raise',
          sizing: 2.5,
          confidence: 'high',
          reasoning: 'Trapping with ultra premium hand in 10-15BB stack depth'
        }
      }
      if (isPremiumHand(heroCards) || isStrongHand(heroCards)) {
        return {
          action: 'raise',
          sizing: effectiveStack,
          confidence: 'high',
          reasoning: 'Shoving strong hand with 10-15BB stack'
        }
      }
    }
  }

  // Big Blind defense logic
  if (position === 'BB' && hasRaiseInFront && raiseSize) {
    // Never fold premium hands from BB
    if (isPremiumHand(heroCards)) {
      const threeBetSize = Math.min(
        raiseSize <= 3 ? raiseSize * 3 : raiseSize * 2,
        effectiveStack
      )
      return {
        action: 'raise',
        sizing: threeBetSize,
        confidence: 'high',
        reasoning: 'Premium hand 3-betting from BB'
      }
    }

    // Strong hands should at least call
    if (isStrongHand(heroCards)) {
      // Consider 3-betting vs late position
      if (isLatePosition) {
        const threeBetSize = Math.min(raiseSize * 3, effectiveStack)
        return {
          action: 'raise',
          sizing: threeBetSize,
          confidence: 'high',
          reasoning: 'Strong hand 3-betting vs late position'
        }
      }
      return {
        action: 'call',
        sizing: raiseSize,
        confidence: 'high',
        reasoning: 'Strong hand calling from BB'
      }
    }

    // Wider defense vs late position
    if (isLatePosition && handStrength !== 'Marginal/Weak') {
      return {
        action: 'call',
        sizing: raiseSize,
        confidence: 'high',
        reasoning: 'Defending BB vs late position with playable hand'
      }
    }
  }

  // Small Blind strategy
  if (position === 'SB') {
    if (hasRaiseInFront && raiseSize) {
      // Never fold premium hands from SB
      if (isPremiumHand(heroCards)) {
        const threeBetSize = Math.min(raiseSize * 3, effectiveStack)
        return {
          action: 'raise',
          sizing: threeBetSize,
          confidence: 'high',
          reasoning: 'Premium hand 3-betting from SB'
        }
      }

      // Strong hands should 3-bet or fold (rarely call)
      if (isStrongHand(heroCards)) {
        if (effectiveStack > 25) {
          const threeBetSize = Math.min(raiseSize * 3, effectiveStack)
          return {
            action: 'raise',
            sizing: threeBetSize,
            confidence: 'high',
            reasoning: 'Strong hand 3-betting from SB'
          }
        }
        return {
          action: 'fold',
          sizing: 0,
          confidence: 'high',
          reasoning: 'Folding strong hand from SB with short stack'
        }
      }
    } else {
      // Opening from SB
      if (handStrength !== 'Marginal/Weak') {
        return {
          action: 'raise',
          sizing: 2.5,
          confidence: 'high',
          reasoning: 'Standard open from SB'
        }
      }
    }
  }

  // Opening ranges with standardized sizes
  if (!hasRaiseInFront) {
    if (handStrength !== 'Marginal/Weak') {
      const openSize = isEarlyPosition ? 2.2 : 2.5
      return {
        action: 'raise',
        sizing: openSize,
        confidence: 'high',
        reasoning: `Standard ${isEarlyPosition ? 'early' : 'late'} position open`
      }
    }
  }

  // Default to fold
  return {
    action: 'fold',
    sizing: 0,
    confidence: 'high',
    reasoning: 'Hand too weak for current position and situation'
  }
}

// Helper function to check if hand is ultra premium (QQ+, AK)
function isUltraPremiumHand(hand: string): boolean {
  const ranks = hand.match(/[2-9TJQKA]/g) || []
  const suited = hand[1] === hand[3]
  
  // Sort ranks by value
  const sortedRanks = ranks.sort((a, b) => {
    const rankOrder = '23456789TJQKA'
    return rankOrder.indexOf(b) - rankOrder.indexOf(a)
  }).join('')
  
  // Ultra premium hands list
  const ultraPremiumHands = ['AA', 'KK', 'QQ']
  const suitedUltraPremiums = ['AK']
  
  return ultraPremiumHands.includes(sortedRanks) || 
         (suited && suitedUltraPremiums.includes(sortedRanks))
}

// Helper function to check if hand is premium
function isPremiumHand(hand: string): boolean {
  const ranks = hand.match(/[2-9TJQKA]/g) || []
  const suited = hand[1] === hand[3]
  
  // Sort ranks by value
  const sortedRanks = ranks.sort((a, b) => {
    const rankOrder = '23456789TJQKA'
    return rankOrder.indexOf(b) - rankOrder.indexOf(a)
  }).join('')
  
  // Premium hands list (JJ+, AK, AQs)
  const premiumHands = ['AA', 'KK', 'QQ', 'JJ', 'AK']
  const suitedPremiums = ['AQ']
  
  return premiumHands.includes(sortedRanks) || 
         (suited && suitedPremiums.includes(sortedRanks))
}

// Helper function to check if hand is strong
function isStrongHand(hand: string): boolean {
  const ranks = hand.match(/[2-9TJQKA]/g) || []
  const suited = hand[1] === hand[3]
  
  // Sort ranks by value
  const sortedRanks = ranks.sort((a, b) => {
    const rankOrder = '23456789TJQKA'
    return rankOrder.indexOf(b) - rankOrder.indexOf(a)
  }).join('')
  
  // Strong hands list (TT, 99, AQ, AJ, KQ)
  const strongHands = ['TT', '99', 'AQ', 'AJ', 'KQ']
  const suitedStrong = ['AJ', 'KQ']
  
  return strongHands.includes(sortedRanks) || 
         (suited && suitedStrong.includes(sortedRanks))
}

// Helper function to get hand category
function getHandCategory(hand: string): string {
  const ranks = hand.match(/[2-9TJQKA]/g) || []
  const suited = hand[1] === hand[3]
  
  // Sort ranks by value
  const sortedRanks = ranks.sort((a, b) => {
    const rankOrder = '23456789TJQKA'
    return rankOrder.indexOf(b) - rankOrder.indexOf(a)
  }).join('')
  
  // Hand category based on sorted ranks
  if (sortedRanks.length === 2) {
    if (sortedRanks[0] === sortedRanks[1]) {
      return 'Pair'
    }
    return 'Offsuit'
  } else if (suited) {
    return 'Suited'
  } else {
    return 'Offsuit'
  }
} 