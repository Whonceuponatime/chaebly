import { serverSupabaseServiceRole } from '#supabase/server'
import { getStackCategory, type Position, type OpponentType } from '../../app/utils/preflopStrategy'
import { getFlopAdvice, getBoardTexture } from '../../app/utils/flopStrategy'
import { getTurnAdvice, evaluateTurnCard } from '../../app/utils/turnStrategy'
import { getStackCategory as newGetStackCategory, type PreflopAdvice } from '../../app/utils/preflopStrategy'
import type { Position as PreflopPosition } from '../../app/utils/preflopStrategy'

type Street = 'preflop' | 'flop' | 'turn' | 'river'

interface MendezAction {
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
}

interface PlayerHistory {
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

interface PlayerUpdate {
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

interface PlayerStats {
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

// Add new preflop ranges
const POSITION_RANGES = {
  BTN: {
    open: ["22+", "A2o+", "K6o+", "Q8o+", "J8o+", "T8o+", "A2s+", "K2s+", "Q4s+", "J6s+", "T6s+", "96s+", "85s+", "75s+", "64s+", "53s", "43s"],
    vsRaise: {
      call: ["88-22", "AT+", "KJ+", "QJ+", "Any suited Ax"],
      threebet: ["99+", "AK", "AQs", "AJs", "KQs"],
      fold: ["Rest"]
    }
  },
  CO: {
    open: ["22+", "A8o+", "KTo+", "QTo+", "JTo", "A2s+", "K7s+", "Q8s+", "J8s+", "T8s+", "97s+", "86s+", "76s", "65s"],
    vsRaise: {
      call: ["99-66", "ATs+", "KJs+", "QJs"],
      threebet: ["TT+", "AK", "AQs", "AJs"],
      fold: ["Rest"]
    }
  },
  BB: {
    defend: ["22+", "A2o+", "K2o+", "Q4o+", "J6o+", "T6o+", "96o+", "86o+", "75o+", "65o", "54o", "A2s+", "K2s+", "Q2s+", "J2s+", "T2s+", "92s+", "82s+", "72s+", "62s+", "52s+", "42s+", "32s"],
    vsRaise: {
      call: ["Any pair", "Any Ax", "Any KT+", "Any suited connector"],
      threebet: ["TT+", "AK", "AQs", "AJs", "KQs"],
      fold: ["Very weak hands"]
    }
  },
  SB: {
    open: ["22+", "A4o+", "K9o+", "QTo+", "JTo", "A2s+", "K5s+", "Q7s+", "J7s+", "T7s+", "97s+", "87s", "76s", "65s"],
    vsRaise: {
      call: ["88-55", "AJ-AT", "KQ", "Suited broadways"],
      threebet: ["99+", "AK", "AQs", "AJs"],
      fold: ["Rest"]
    }
  }
}

// Add short stack ranges
const SHORT_STACK_RANGES = {
  PUSH: {
    "12BB": ["22+", "A2s+", "A2o+", "K2s+", "K5o+", "Q5s+", "Q9o+", "J7s+", "J9o+", "T8s+", "98s"],
    "10BB": ["22+", "A2s+", "A2o+", "K2s+", "K4o+", "Q4s+", "Q8o+", "J6s+", "J8o+", "T7s+", "97s+"],
    "8BB": ["22+", "A2+", "K2+", "Q3s+", "Q7o+", "J5s+", "J8o+", "T6s+", "96s+"],
    "6BB": ["22+", "A2+", "K2+", "Q2+", "J4s+", "J7o+", "T5s+", "95s+"]
  }
}

async function getPlayerHistories(client: any, playerNames: string[]) {
  if (!playerNames || playerNames.length === 0) {
    console.log('No player names provided for history lookup')
    return []
  }

  console.log('Fetching histories for players:', playerNames)
  const { data, error } = await client
    .from('mendez_player_history')
    .select('*')
    .in('player_name', playerNames)

  if (error) {
    console.error('Error fetching player histories:', error)
    return []
  }

  // If no histories found, create initial records for new players
  if (!data || data.length === 0) {
    console.log('No histories found, creating initial records')
    const newPlayers = playerNames.map(name => ({
      player_name: name,
      total_hands: 0,
      showdown_hands: 0,
      hands_won: 0,
      aggression_factor: 0,
      vpip_percentage: 0,
      pfr_percentage: 0,
      showdown_hands_history: [],
      betting_patterns: {},
      position_tendencies: {},
      last_seen_at: new Date().toISOString()
    }))

    const { data: insertedData, error: insertError } = await client
      .from('mendez_player_history')
      .insert(newPlayers)
      .select()

    if (insertError) {
      console.error('Error creating new player histories:', insertError)
      return []
    }

    return insertedData || []
  }

  console.log('Found histories:', data.length)
  return data
}

function getStreetBasedAdjustments(
  street: string,
  playerHistories: any[],
  potOdds: number,
  position: string,
  heroCards: string
) {
  const adjustments = []

  switch (street) {
    case 'preflop':
      // Preflop adjustments based on position and player tendencies
      adjustments.push(getPreflopAdjustment(position, playerHistories, heroCards))
      break
    
    case 'flop':
      // Flop adjustments based on pot odds
      adjustments.push(getFlopAdjustment(potOdds, playerHistories))
      break
    
    case 'turn':
      // Turn adjustments considering pot commitment
      adjustments.push(getTurnAdjustment(potOdds, playerHistories))
      break
    
    case 'river':
      // River adjustments focusing on showdown value and bluff catching
      adjustments.push(getRiverAdjustment(potOdds, playerHistories))
      break
  }

  return adjustments
}

function getPreflopAdjustment(position: string, playerHistories: any[], heroCards: string) {
  // Position-based preflop adjustments
  const positionRanking: Record<string, number> = {
    'BTN': 1,
    'CO': 2,
    'MP': 3,
    'UTG': 4,
    'SB': 5,
    'BB': 6
  }

  const adjustment = {
    action: 'fold',
    reason: '',
    confidence: 'high'
  }

  // Get hand category
  const handCategory = getHandCategory(heroCards)

  // Early position requirements
  if (positionRanking[position] >= 4) { // UTG or earlier
    if (handCategory === 'Marginal/Weak' || handCategory === 'Playable') {
      adjustment.action = 'fold'
      adjustment.reason = 'Hand too weak for early position'
      adjustment.confidence = 'high'
    }
  }

  // Late position adjustments
  if (positionRanking[position] <= 2) { // BTN or CO
    if (handCategory === 'Playable') {
      adjustment.action = 'call'
      adjustment.reason = 'Playable hand in late position'
    }
  }

  return adjustment
}

function getFlopAdjustment(potOdds: number, playerHistories: any[]) {
  const adjustment = {
    action: 'fold',
    reason: '',
    confidence: 'high'
  }

  // Consider pot odds
  if (potOdds < 25) {
    adjustment.action = 'raise'
    adjustment.reason = 'Good pot odds for semi-bluff'
  }

  return adjustment
}

function getTurnAdjustment(potOdds: number, playerHistories: any[]) {
  const adjustment = {
    action: 'fold',
    reason: '',
    confidence: 'high'
  }

  // More conservative on turn
  if (potOdds > 40) {
    adjustment.action = 'call'
    adjustment.reason = 'Turn caution with high pot odds'
  }

  return adjustment
}

function getRiverAdjustment(potOdds: number, playerHistories: any[]) {
  const adjustment = {
    action: 'fold',
    reason: '',
    confidence: 'high'
  }

  // River is more polarized
  if (potOdds > 50) {
    adjustment.action = 'fold'
    adjustment.reason = 'Poor pot odds on river'
  }

  return adjustment
}

function determinePlayingStyle(history: PlayerHistory) {
  if (history.total_hands < 20) return 'unknown'
  
  const style = {
    aggression: history.aggression_factor > 2 ? 'aggressive' : 'passive',
    frequency: history.vpip_percentage > 30 ? 'loose' : 'tight',
    preflop: history.pfr_percentage > 20 ? 'raising' : 'calling'
  }
  
  return `${style.frequency}-${style.aggression}`
}

function findExploitableTendencies(history: PlayerHistory) {
  const tendencies = []
  
  if (history.total_hands < 20) return ['insufficient data']
  
  if (history.vpip_percentage > 40) tendencies.push('plays too many hands')
  if (history.aggression_factor < 1) tendencies.push('calls too much')
  if (history.aggression_factor > 3) tendencies.push('over-aggressive')
  
  return tendencies
}

async function updatePlayerStats(client: any, player: any, update: PlayerUpdate): Promise<PlayerStats> {
  const handInfo = update.handInfo
  const newStats: PlayerStats & { player_name: string } = {
    player_name: update.playerName,
    total_hands: player.total_hands + 1,
    showdown_hands: player.showdown_hands + (handInfo.wentToShowdown ? 1 : 0),
    hands_won: player.hands_won + (handInfo.result === 'win' ? 1 : 0),
    aggression_factor: player.aggression_factor,
    vpip_percentage: 0,
    pfr_percentage: 0,
    showdown_hands_history: [...player.showdown_hands_history],
    betting_patterns: { ...player.betting_patterns },
    position_tendencies: { ...player.position_tendencies },
    last_seen_at: new Date().toISOString(),
    bb_per_100_hands: player.bb_per_100_hands || 0,
    total_bluffs: player.total_bluffs + (handInfo.isBluff ? 1 : 0),
    successful_bluffs: player.successful_bluffs + (handInfo.isBluff && handInfo.result === 'win' ? 1 : 0),
    check_raise_attempts: player.check_raise_attempts + (handInfo.action === 'raise' && handInfo.lastAction === 'check' ? 1 : 0),
    check_raise_success: player.check_raise_success + (handInfo.action === 'raise' && handInfo.lastAction === 'check' && handInfo.result === 'win' ? 1 : 0),
    turn_call_attempts: player.turn_call_attempts + (handInfo.street === 'turn' && handInfo.action === 'call' ? 1 : 0),
    turn_call_success: player.turn_call_success + (handInfo.street === 'turn' && handInfo.action === 'call' && handInfo.result === 'win' ? 1 : 0),
    half_pot_bets: player.half_pot_bets + (handInfo.betSizeType === 'half_pot' ? 1 : 0),
    half_pot_success: player.half_pot_success + (handInfo.betSizeType === 'half_pot' && handInfo.result === 'win' ? 1 : 0),
    full_pot_bets: player.full_pot_bets + (handInfo.betSizeType === 'full_pot' ? 1 : 0),
    full_pot_success: player.full_pot_success + (handInfo.betSizeType === 'full_pot' && handInfo.result === 'win' ? 1 : 0)
  }

  // Update VPIP and PFR percentages
  const totalVPIP = (player.vpip_percentage * player.total_hands + (handInfo.vpipAction ? 1 : 0))
  const totalPFR = (player.pfr_percentage * player.total_hands + (handInfo.pfrAction ? 1 : 0))
  newStats.vpip_percentage = totalVPIP / newStats.total_hands
  newStats.pfr_percentage = totalPFR / newStats.total_hands

  // Update showdown history if applicable
  if (handInfo.wentToShowdown && handInfo.holeCards) {
    newStats.showdown_hands_history.push({
      holeCards: handInfo.holeCards,
      position: handInfo.position,
      result: handInfo.result,
      profitLoss: handInfo.profitLoss,
      timestamp: new Date().toISOString()
    })
  }

  // Update position tendencies
  if (!newStats.position_tendencies[handInfo.position]) {
    newStats.position_tendencies[handInfo.position] = {
      total: 0,
      vpip: 0,
      pfr: 0,
      won: 0
    }
  }
  const pos = newStats.position_tendencies[handInfo.position]
  pos.total++
  if (handInfo.vpipAction) pos.vpip++
  if (handInfo.pfrAction) pos.pfr++
  if (handInfo.result === 'win') pos.won++

  // Update betting patterns with new metrics
  const actionKey = `${handInfo.position}_${handInfo.action}_${handInfo.betSizeType || 'unknown'}`
  newStats.betting_patterns[actionKey] = (newStats.betting_patterns[actionKey] || 0) + 1

  try {
    // First try to update
    const { error: updateError } = await client
      .from('mendez_player_history')
      .upsert(newStats, {
        onConflict: 'player_name',
        ignoreDuplicates: false
      })

    if (updateError) {
      throw updateError
    }

    return newStats
  } catch (error) {
    console.error('Error updating player stats:', error)
    throw error
  }
}

// Helper function to check if hand is in range
function isHandInRange(hand: string, range: string[]): boolean {
  const [card1, card2] = [hand.slice(0, 2), hand.slice(2)]
  const isSuited = hand[1] === hand[3]
  
  // Convert hand to standard notation (e.g., "AKs" or "AKo")
  const handStr = `${card1[0]}${card2[0]}${isSuited ? 's' : 'o'}`
  
  // Check each range pattern
  return range.some(pattern => {
    // Exact match
    if (pattern === handStr) return true
    
    // Pocket pair
    if (pattern.endsWith('+') && pattern.startsWith(card1[0]) && card1[0] === card2[0]) {
      const minRank = pattern.slice(0, -1)
      return isHigherOrEqual(card1[0], minRank[0])
    }
    
    // Suited or offsuit hands
    if (pattern.endsWith('+')) {
      const [highCard, lowCard, suitedness] = pattern.slice(0, -1).split('')
      if (suitedness === 's' && !isSuited) return false
      if (suitedness === 'o' && isSuited) return false
      return isHigherOrEqual(card1[0], highCard) && isHigherOrEqual(card2[0], lowCard)
    }
    
    return false
  })
}

// Helper function to compare card ranks
function isHigherOrEqual(card1: string, card2: string): boolean {
  const ranks = '23456789TJQKA'
  return ranks.indexOf(card1) >= ranks.indexOf(card2)
}

async function getGPTAnalysis(actionData: MendezAction, playerHistories: PlayerHistory[]) {
  try {
    // 1. Pre-calculate all metrics and analysis
    const effectiveStack = actionData.effective_stack || 0
    const metrics = {
      // Stack and pot metrics
      effectiveStack,
      stackToPot: effectiveStack / actionData.pot_size_bb,
      potOdds: (actionData.to_call_bb / (actionData.pot_size_bb + actionData.to_call_bb)) * 100,
      riskReward: actionData.to_call_bb / actionData.pot_size_bb,
      
      // Position analysis
      isIP: ['BTN', 'CO'].includes(actionData.hero_position) || 
            (actionData.hero_position === 'MP' && !actionData.active_players.some(p => ['BTN', 'CO'].includes(p))),
      playersLeft: actionData.active_players.slice(actionData.active_players.indexOf(actionData.action_on)).length,
      isMultiway: actionData.active_players.length > 2,
      
      // Hand strength and ranges
      handCategory: getHandCategory(actionData.hero_cards),
      stackCategory: effectiveStack > 100 ? 'Deep' :
                    effectiveStack > 50 ? 'Standard' :
                    effectiveStack > 20 ? 'Short' : 'Critical',
      
      // Board analysis (for post-flop)
      boardTexture: actionData.board_cards ? {
        paired: !!actionData.board_cards.match(/(.)\1/g),
        suited: !!actionData.board_cards.match(/(s|h|d|c){3,}/g),
        connected: !!actionData.board_cards.match(/[AKQJT98765432]{3,}/g)
      } : null
    }

    // 2. Process player stats once
    const playerStats = playerHistories
      .filter(p => p.total_hands >= 20)
      .map(p => ({
        name: p.player_name,
        style: p.vpip_percentage > 30 ? 
          (p.aggression_factor > 2 ? 'LAG' : 'LP') : 
          (p.aggression_factor > 2 ? 'TAG' : 'TP'),
        stats: {
          hands: p.total_hands,
          vpip: p.vpip_percentage.toFixed(0),
          pfr: p.pfr_percentage.toFixed(0),
          agg: p.aggression_factor.toFixed(1),
          winRate: ((p.hands_won / p.total_hands) * 100).toFixed(0)
        },
        exploits: findExploitableTendencies(p)
      }))

    // Enhanced preflop guidelines
    const preflopGuidelines = `
PREFLOP GUIDELINES:
${actionData.street === 'preflop' ? `
Position: ${actionData.hero_position}
Stack: ${metrics.effectiveStack}BB
${actionData.hero_position === 'BB' ? `
BB Defense Strategy:
- Only defend vs small raises (2.5-3BB)
- Value hands: 22+, A2s+, K9s+, Q9s+, JTs, T9s
- 3-bet bluffs: A5s, A4s, K5s, Q5s
- 3-bet value: JJ+, AK
- Fold weak/marginal hands vs large raises` :
actionData.hero_position === 'SB' ? `
SB Strategy:
- Prefer 3-bet or fold over calling
- 3-bet value: JJ+, AK
- 3-bet bluffs: A5s, K7s, Q8s
- Limited calling: 99-22, ATs-A2s (vs small raises)
- Avoid flat calling vs large raises` :
actionData.hero_position === 'CO' ? `
CO Strategy:
- Raise first in: 22+, A2s+, K7s+, Q9s+, J9s+, 76s+
- Avoid calling - either raise or fold
- Exception: Call only vs weak players or great odds` :
`Standard Position Play:
- Premium hands (QQ+, AK): Always raise
- Strong hands (JJ-TT, AQ): Raise first in
- Multiway pots: Tighten ranges significantly
- Short stack (<12BB): Switch to push/fold`}

Stack-Based Adjustments:
${metrics.effectiveStack <= 12 ? `
Short Stack Strategy (<12BB):
- Push: 22+, A2s+, KTs+, QTs+, JTs, ATo+, KQo
- Fold everything else
- No min-raises or calls` :
metrics.effectiveStack <= 25 ? `
Medium Stack Strategy (12-25BB):
- Tighter ranges
- Avoid speculative hands
- Premium hands can still raise normally` :
`Deep Stack Strategy (>25BB):
- Standard ranges apply
- Can play more speculative hands
- Consider position and player tendencies`}` : ''}

${actionData.street !== 'preflop' ? `Post-flop considerations...` : ''}`

    // 3. Build concise but informative prompt
    const prompt = `Analyze this poker decision:

SITUATION
Street: ${actionData.street.toUpperCase()}
Position: ${actionData.hero_position} (${metrics.isIP ? 'In Position' : 'Out of Position'})
Hand: ${actionData.hero_cards}
Board: ${actionData.board_cards || 'Preflop'}

NUMBERS
Pot: ${actionData.pot_size_bb}BB
To Call: ${actionData.to_call_bb}BB
Stack: ${metrics.effectiveStack}BB (${metrics.stackToPot.toFixed(1)}x pot)
Pot Odds: ${metrics.potOdds.toFixed(1)}%

ACTION STATE
Last Action: ${actionData.last_action || 'None'} (${actionData.last_bet_size_bb || 0}BB)
Players Left: ${metrics.playersLeft}
Table Dynamic: ${metrics.isMultiway ? 'Multiway' : 'Heads-up'}

${playerStats.length > 0 ? `PLAYER INSIGHTS
${playerStats.map(p => 
  `${p.name} (${p.style}): VPIP ${p.stats.vpip}% PFR ${p.stats.pfr}% AGG ${p.stats.agg}
   Exploits: ${p.exploits.join(', ')}`
).join('\n')}` : 'No reliable player data'}

${preflopGuidelines}

Provide action (fold/call/raise) and brief explanation incorporating key factors and exploits.
Response format:
Action: [decision]
[One clear sentence explanation]`

    // 4. Get GPT's analysis with error handling
    try {
      const response = await $fetch<{ content: string }>('/api/openai', {
        method: 'POST',
        body: {
          messages: [{ role: 'user', content: prompt }],
          model: 'gpt-4o',
          temperature: 0.7,
          max_tokens: 150,
          presence_penalty: 0.1,
          frequency_penalty: 0.1
        }
      }).catch(error => {
        console.error('OpenAI API Error:', {
          status: error.status,
          message: error.message,
          data: error.data
        });
        throw new Error(`OpenAI API error: ${error.message}`);
      });

      if (!response?.content) {
        console.error('Empty response from OpenAI');
        throw new Error('Empty response from OpenAI');
      }

      const actionMatch = response.content.match(/Action: (fold|call|raise)/i)
      if (!actionMatch) throw new Error('Invalid response format')

      const gptAction = actionMatch[1].toLowerCase()
      const explanation = response.content.split('.')[1]?.trim() || response.content

      return {
        action: gptAction,
        confidence: 'high',
        reasoning: explanation,
        adjustmentReason: explanation,
        gtoContext: prompt,
        reliablePlayerStats: playerStats.length > 0
      }
    } catch (error: any) {
      console.error('GPT API error:', error)
      return {
        action: null,
        confidence: 'low',
        reasoning: `GPT analysis failed (${error.message || 'unknown error'})`,
        adjustmentReason: 'GPT analysis failed',
        gtoContext: prompt,
        reliablePlayerStats: playerStats.length > 0
      }
    }
  } catch (err: any) {
    console.error('Error in analysis:', err)
    return {
      action: null,
      confidence: 'low',
      reasoning: 'Analysis failed',
      adjustmentReason: 'Analysis failed',
      gtoContext: '',
      reliablePlayerStats: false
    }
  }
}

// Helper function to get stack-based strategy descriptions
function getStackBasedStrategy(stackType: 'deep' | 'standard' | 'short', position: Position): string {
  const isBlind = position === 'BB' || position === 'SB'
  
  switch (stackType) {
    case 'deep':
      return isBlind ? 
        'Defend wider, more 3-bet bluffs' : 
        'Open wider, include suited connectors'
    case 'standard':
      return isBlind ? 
        'Standard defending ranges' : 
        'Standard opening ranges'
    case 'short':
      return isBlind ? 
        'Tighter defense, less calling' : 
        'Tighter ranges, less speculative hands'
  }
}

function getHandCategory(cards: string): string {
  const ranks = cards.match(/[2-9TJQKA]/g) || []
  const suited = cards[1] === cards[3] // Check if same suit
  
  // Sort ranks by value for easier comparison
  const sortedRanks = ranks.sort((a, b) => {
    const rankOrder = '23456789TJQKA'
    return rankOrder.indexOf(b) - rankOrder.indexOf(a)
  })
  
  // Premium hands
  if (['AA', 'KK', 'QQ', 'JJ', 'AK'].includes(sortedRanks.join(''))) {
    return 'Premium'
  }
  
  // Strong hands
  if (['TT', '99', 'AQ', 'AJ', 'KQ'].includes(sortedRanks.join('')) || 
      (suited && ['AK', 'AQ', 'AJ'].includes(sortedRanks.join('')))) {
    return 'Strong'
  }
  
  // Playable hands
  if (['88', '77', 'AT', 'KJ'].includes(sortedRanks.join('')) ||
      (suited && ['KQ', 'KJ', 'QJ'].includes(sortedRanks.join('')))) {
    return 'Playable'
  }
  
  return 'Marginal/Weak'
}

// Add new opponent type analysis
function analyzeOpponentType(history: PlayerHistory): {
  type: 'Calling-Station' | 'Fit-or-Fold' | 'LAG' | 'TAG' | 'Passive' | 'Unknown'
  exploits: string[]
  betSizingAdjustment: number
} {
  if (history.total_hands < 20) {
    return {
      type: 'Unknown',
      exploits: ['Stick to GTO basics'],
      betSizingAdjustment: 1.0
    }
  }

  // Analyze VPIP/PFR ratio and aggression
  const vpipPfrRatio = history.vpip_percentage / (history.pfr_percentage || 1)
  const isAggressive = history.aggression_factor > 2.5
  const isLoose = history.vpip_percentage > 35

  // Calling station detection
  if (vpipPfrRatio > 3 && !isAggressive) {
    return {
      type: 'Calling-Station',
      exploits: [
        'Value bet thinner',
        'Increase value bet sizes',
        'Reduce bluff frequency'
      ],
      betSizingAdjustment: 1.3 // Bigger value bets
    }
  }

  // Fit-or-fold player detection
  if (history.fold_to_cbet_percentage > 65) {
    return {
      type: 'Fit-or-Fold',
      exploits: [
        'Increase c-bet frequency',
        'Bluff more frequently',
        'Use smaller bet sizes'
      ],
      betSizingAdjustment: 0.7 // Smaller bets to maintain fold equity
    }
  }

  // LAG detection
  if (isLoose && isAggressive) {
    return {
      type: 'LAG',
      exploits: [
        'Tighten up ranges',
        'Call down lighter',
        'Set more traps'
      ],
      betSizingAdjustment: 0.9 // Slightly smaller to induce action
    }
  }

  // TAG detection
  if (!isLoose && isAggressive) {
    return {
      type: 'TAG',
      exploits: [
        'Play more speculative hands',
        'Float more flops',
        'Defend blinds wider'
      ],
      betSizingAdjustment: 1.1
    }
  }

  // Passive player detection
  return {
    type: 'Passive',
    exploits: [
      'Bet for thin value',
      'Reduce bluff frequency',
      'Use larger sizing with value'
    ],
    betSizingAdjustment: 1.2
  }
}

// Enhanced position-based preflop adjustments
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

  // Blind defense improvements
  if (isBlindPosition && hasRaiseInFront) {
    const potOdds = (raiseSize || 3) / (raiseSize || 3 + 1)
    
    // Wider defense range from BB
    if (position === 'BB' && potOdds > 0.25) {
      if (handStrength !== 'Marginal/Weak') {
        return {
          action: 'call',
          sizing: raiseSize || 3,
          confidence: 'high',
          reasoning: 'Good pot odds for BB defense with playable hand'
        }
      }
    }

    // More aggressive 3-betting from SB
    if (position === 'SB' && (handStrength === 'Premium' || handStrength === 'Strong')) {
      return {
        action: 'raise',
        sizing: (raiseSize || 3) * 3,
        confidence: 'high',
        reasoning: 'Strong hand for 3-betting from SB'
      }
    }
  }

  // Late position adjustments
  if (isLatePosition && !hasRaiseInFront) {
    // Wider opening ranges
    if (handStrength !== 'Marginal/Weak') {
      return {
        action: 'raise',
        sizing: 2.5,
        confidence: 'high',
        reasoning: 'Standard late position open with playable hand'
      }
    }
  }

  // Default to standard preflop strategy
  return {
    action: 'fold',
    sizing: 0,
    confidence: 'high',
    reasoning: 'Hand too weak to open from ' + position
  }
}

// Enhanced flop strategy with texture-based adjustments
function getEnhancedFlopStrategy(
  heroCards: string,
  boardCards: string,
  position: string,
  potSize: number,
  effectiveStack: number,
  opponentType: 'Tight-Passive' | 'Loose-Passive' | 'Tight-Aggressive' | 'Loose-Aggressive',
  hasBetInFront: boolean,
  betSize?: number
): {
  action: string
  sizing: number
  reasoning: string
} {
  const texture = getBoardTexture(boardCards)
  const handStrength = getHandStrength(heroCards, boardCards)
  
  // Dry board strategy
  if (texture === 'Dry') {
    if (handStrength === 'Strong' || handStrength === 'Good') {
      return {
        action: 'bet',
        sizing: potSize * 0.66, // Larger bets on dry boards
        reasoning: 'Value betting strong hand on dry board'
      }
    }
  }

  // Wet board strategy
  if (texture === 'Wet') {
    if (handStrength === 'Draw') {
      return {
        action: 'bet',
        sizing: potSize * 0.75, // Charge draws appropriately
        reasoning: 'Protecting equity on wet board'
      }
    }
  }

  // Default to standard flop strategy
  return getFlopAdvice(
    heroCards,
    boardCards,
    position,
    potSize,
    effectiveStack,
    opponentType,
    hasBetInFront,
    betSize
  )
}

// Enhanced turn strategy
function getEnhancedTurnStrategy(
  heroCards: string,
  flopCards: string,
  turnCard: string,
  position: string,
  potSize: number,
  effectiveStack: number,
  opponentType: string,
  hasBetInFront: boolean,
  betSize?: number
): {
  action: string
  sizing: number
  reasoning: string
} {
  const turnEval = evaluateTurnCard(flopCards, turnCard, heroCards)
  const isScare = isScareTurnCard(flopCards, turnCard)
  
  // Bluff catching improvements
  if (hasBetInFront && betSize) {
    const potOdds = betSize / (potSize + betSize)
    if (turnEval.relativeStrengthChange === 'improved') {
      return {
        action: 'raise',
        sizing: betSize * 2.5,
        reasoning: 'Value raising improved hand on turn'
      }
    }
  }

  // Bluffing improvements
  if (!hasBetInFront && isScare) {
    return {
      action: 'bet',
      sizing: potSize * 0.66,
      reasoning: 'Bluffing scare turn card'
    }
  }

  // Default to standard turn strategy
  return getTurnAdvice(
    heroCards,
    flopCards,
    turnCard,
    position === 'IP' ? 'IP' : 'OOP',
    potSize,
    effectiveStack,
    hasBetInFront,
    betSize
  )
}

// Helper function to identify scare turn cards
function isScareTurnCard(flopCards: string, turnCard: string): boolean {
  const flopRanks = flopCards.match(/[2-9TJQKA]/g) || []
  const turnRank = turnCard.match(/[2-9TJQKA]/g)?.[0]
  
  if (!turnRank) return false
  
  // Overcard to flop
  const isOvercard = !flopRanks.some(r => 
    '23456789TJQKA'.indexOf(r) >= '23456789TJQKA'.indexOf(turnRank)
  )
  
  // Completes obvious draws
  const completesStraight = false // TODO: Implement straight detection
  const completesFlush = false // TODO: Implement flush detection
  
  return isOvercard || completesStraight || completesFlush
}

// Add getHandStrength function
function getHandStrength(heroCards: string, boardCards: string): 'Strong' | 'Good' | 'Draw' | 'Weak' {
  const ranks = [...heroCards.match(/[2-9TJQKA]/g) || [], ...boardCards.match(/[2-9TJQKA]/g) || []]
  const suits = [...heroCards.match(/[hdcs]/g) || [], ...boardCards.match(/[hdcs]/g) || []]
  
  // Count ranks for pairs/sets
  const rankCounts = ranks.reduce((acc, r) => {
    acc[r] = (acc[r] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  // Check for strong made hands
  if (Object.values(rankCounts).some(count => count >= 3)) return 'Strong' // Set or better
  if (Object.values(rankCounts).filter(count => count === 2).length >= 2) return 'Strong' // Two pair
  if (Object.values(rankCounts).some(count => count === 2)) return 'Good' // One pair
  
  // Check for draws
  const suitCounts = suits.reduce((acc, s) => {
    acc[s] = (acc[s] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  if (Object.values(suitCounts).some(count => count >= 4)) return 'Draw' // Flush draw
  
  return 'Weak'
}

// Helper function to validate position values
function validatePosition(pos?: string): Position | undefined {
  const validPositions: Position[] = ['UTG', 'MP', 'CO', 'BTN', 'SB', 'BB']
  return pos && validPositions.includes(pos as Position) ? pos as Position : undefined
}

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseServiceRole(event)
  const body = await readBody(event)

  try {
    // Map the incoming fields to database fields with BB conversion
    const actionData: MendezAction = {
      hand_id: body.handId || crypto.randomUUID(),
      street: body.street,
      players: Array.isArray(body.players) ? body.players : [],
      hero_position: body.heroPosition,
      hero_cards: body.heroCards,
      board_cards: body.boardCards,
      pot_size_bb: body.potSize || 0,
      to_call_bb: body.toCall || 0,
      current_bet_bb: body.currentBet || 0,
      active_players: Array.isArray(body.activePlayers) ? body.activePlayers : [],
      action_on: body.actionOn,
      last_action: body.lastAction,
      last_bet_size_bb: body.lastBetSize || 0,
      effective_stack: body.effectiveStack || 0
    }

    // Get player histories for active players
    const playerHistories = await getPlayerHistories(client, actionData.active_players)
    
    // Calculate pot odds
    const potOdds = (actionData.to_call_bb / (actionData.pot_size_bb + actionData.to_call_bb)) * 100

    // Get ChatGPT analysis
    const chatGPTAnalysis = await getGPTAnalysis(actionData, playerHistories)

    // Insert action data with guaranteed valid values
    const { data: insertedData, error } = await client
      .from('mendez_games')
      .insert({
        hand_id: actionData.hand_id,
        street: actionData.street,
        players: actionData.players,
        hero_position: actionData.hero_position,
        hero_cards: actionData.hero_cards,
        board_cards: actionData.board_cards,
        pot_size_bb: actionData.pot_size_bb,
        to_call_bb: actionData.to_call_bb,
        current_bet_bb: actionData.current_bet_bb,
        active_players: actionData.active_players,
        action_on: actionData.action_on,
        last_action: actionData.last_action,
        last_bet_size_bb: actionData.last_bet_size_bb,
        gpt_decision: chatGPTAnalysis.action,  // This can be null if GPT analysis fails
        decision_reasoning: chatGPTAnalysis.reasoning
      } as any)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      throw createError({
        statusCode: 500,
        message: error.message
      })
    }

    // Update stats for all active players
    await Promise.all(
      actionData.active_players.map(async playerName => {
        // First get the existing player data
        const { data: playerData } = await client
          .from('mendez_player_history')
          .select('*')
          .eq('player_name', playerName)
          .single()

        // Create the update object
        const playerUpdate: PlayerUpdate = {
          playerName,
          handInfo: {
            position: actionData.hero_position,
            action: chatGPTAnalysis.action || 'fold', // Default to fold if no decision
            betSize: actionData.current_bet_bb,
            potSize: actionData.pot_size_bb,
            result: chatGPTAnalysis.action === 'fold' ? 'lose' : 'win',
            profitLoss: chatGPTAnalysis.action === 'fold' ? -actionData.to_call_bb : actionData.pot_size_bb,
            wentToShowdown: false,
            vpipAction: actionData.street === 'preflop' && ['call', 'raise'].includes(chatGPTAnalysis.action || ''),
            pfrAction: actionData.street === 'preflop' && chatGPTAnalysis.action === 'raise',
            street: actionData.street,
            lastAction: actionData.last_action,
            betSizeType: getBetSizeType(actionData.current_bet_bb, actionData.pot_size_bb)
          }
        }

        // If player doesn't exist, use default stats
        const existingPlayer = playerData || {
          player_name: playerName,
          total_hands: 0,
          showdown_hands: 0,
          hands_won: 0,
          aggression_factor: 1,
          vpip_percentage: 0,
          pfr_percentage: 0,
          showdown_hands_history: [],
          betting_patterns: {},
          position_tendencies: {},
          last_seen_at: new Date().toISOString(),
          bb_per_100_hands: 0,
          total_bluffs: 0,
          successful_bluffs: 0,
          check_raise_attempts: 0,
          check_raise_success: 0,
          turn_call_attempts: 0,
          turn_call_success: 0,
          half_pot_bets: 0,
          half_pot_success: 0,
          full_pot_bets: 0,
          full_pot_success: 0
        }

        return updatePlayerStats(client, existingPlayer, playerUpdate)
      })
    )

    // Helper function to determine bet size type
    function getBetSizeType(betSize: number, potSize: number): 'half_pot' | 'full_pot' | undefined {
      if (!betSize || !potSize) return undefined
      const ratio = betSize / potSize
      if (ratio >= 0.4 && ratio <= 0.6) return 'half_pot'
      if (ratio >= 0.9 && ratio <= 1.1) return 'full_pot'
      return undefined
    }

    // Combine all recommendations
    const finalDecision = {
      action: chatGPTAnalysis.action,
      confidence: chatGPTAnalysis.confidence,
      reasoning: chatGPTAnalysis.reasoning,
      playerInsights: playerHistories.map((h: PlayerHistory) => ({
        player: h.player_name,
        style: determinePlayingStyle(h),
        tendencies: findExploitableTendencies(h)
      })),
      potOdds: `${potOdds.toFixed(1)}%`,
      potSize: `${actionData.pot_size_bb}BB`,
      toCall: `${actionData.to_call_bb}BB`,
      chatGPTAnalysis: {
        suggestion: chatGPTAnalysis.action,
        reasoning: chatGPTAnalysis.reasoning,
        adjustmentReason: chatGPTAnalysis.adjustmentReason
      },
      execute: true
    }

    return { 
      success: true, 
      handId: (insertedData as any).hand_id,
      street: (insertedData as any).street,
      decision: finalDecision,
      message: 'Decision computed successfully'
    }
  } catch (error: any) {
    console.error('Server error:', error)
    throw createError({
      statusCode: 500,
      message: error.message || 'An error occurred while processing the decision'
    })
  }
}) 