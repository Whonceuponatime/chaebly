import { serverSupabaseServiceRole } from '#supabase/server'

interface MendezAction {
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
  mendez_recommendation: string
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
}

async function getPlayerHistories(client: any, playerNames: string[]) {
  const { data, error } = await client
    .from('mendez_player_history')
    .select('*')
    .in('player_name', playerNames)

  if (error) {
    console.error('Error fetching player histories:', error)
    return []
  }

  return data || []
}

function getStreetBasedAdjustments(
  street: string,
  recommendation: string,
  playerHistories: any[],
  potOdds: number,
  position: string
) {
  const adjustments = []

  switch (street) {
    case 'preflop':
      // Preflop adjustments based on position and player tendencies
      adjustments.push(getPreflopAdjustment(position, recommendation, playerHistories))
      break
    
    case 'flop':
      // Flop adjustments based on pot odds
      adjustments.push(getFlopAdjustment(potOdds, recommendation, playerHistories))
      break
    
    case 'turn':
      // Turn adjustments considering pot commitment
      adjustments.push(getTurnAdjustment(potOdds, recommendation, playerHistories))
      break
    
    case 'river':
      // River adjustments focusing on showdown value and bluff catching
      adjustments.push(getRiverAdjustment(potOdds, recommendation, playerHistories))
      break
  }

  return adjustments
}

function getPreflopAdjustment(position: string, recommendation: string, playerHistories: any[]) {
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
    action: recommendation,
    reason: '',
    confidence: 'high'
  }

  // More aggressive in late position
  if (positionRanking[position] <= 2 && recommendation === 'call') {
    adjustment.action = 'raise'
    adjustment.reason = 'Exploiting late position'
  }

  // More cautious in early position
  if (positionRanking[position] >= 4 && recommendation === 'call') {
    adjustment.action = 'fold'
    adjustment.reason = 'Early position caution'
  }

  return adjustment
}

function getFlopAdjustment(potOdds: number, recommendation: string, playerHistories: any[]) {
  const adjustment = {
    action: recommendation,
    reason: '',
    confidence: 'high'
  }

  // Consider pot odds
  if (potOdds < 25 && recommendation === 'call') {
    adjustment.action = 'raise'
    adjustment.reason = 'Good pot odds for semi-bluff'
  }

  return adjustment
}

function getTurnAdjustment(potOdds: number, recommendation: string, playerHistories: any[]) {
  const adjustment = {
    action: recommendation,
    reason: '',
    confidence: 'high'
  }

  // More conservative on turn
  if (potOdds > 40 && recommendation === 'raise') {
    adjustment.action = 'call'
    adjustment.reason = 'Turn caution with high pot odds'
  }

  return adjustment
}

function getRiverAdjustment(potOdds: number, recommendation: string, playerHistories: any[]) {
  const adjustment = {
    action: recommendation,
    reason: '',
    confidence: 'high'
  }

  // River is more polarized
  if (potOdds > 50 && recommendation === 'call') {
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

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseServiceRole(event)
  const body = await readBody(event)

  try {
    // Map the incoming fields to database fields
    const actionData: MendezAction = {
      hand_id: body.handId || crypto.randomUUID(),
      street: body.street,
      players: Array.isArray(body.players) ? body.players : [],
      hero_position: body.heroPosition,
      hero_cards: body.heroCards,
      board_cards: body.boardCards,
      pot_size_bb: body.potSizeBB || 0,
      to_call_bb: body.toCallBB || 0,
      current_bet_bb: body.currentBetBB || 0,
      active_players: Array.isArray(body.activePlayers) ? body.activePlayers : [],
      action_on: body.actionOn,
      last_action: body.lastAction,
      last_bet_size_bb: body.lastBetSizeBB,
      mendez_recommendation: body.mendezRecommendation
    }

    // Get player histories for active players
    const playerHistories = await getPlayerHistories(client, actionData.active_players)
    
    // Calculate pot odds
    const potOdds = (actionData.to_call_bb / (actionData.pot_size_bb + actionData.to_call_bb)) * 100

    // Get street-specific adjustments
    const streetAdjustments = getStreetBasedAdjustments(
      actionData.street,
      actionData.mendez_recommendation,
      playerHistories,
      potOdds,
      actionData.hero_position
    )

    // Generate ChatGPT analysis
    const chatGPTAnalysis = {
      action: actionData.mendez_recommendation,
      confidence: 'medium',
      reasoning: '',
      adjustmentReason: ''
    }

    // Analyze position and street
    if (actionData.street === 'preflop') {
      if (['BTN', 'CO'].includes(actionData.hero_position)) {
        chatGPTAnalysis.reasoning = 'Late position allows for more aggressive play'
        if (actionData.mendez_recommendation === 'call') {
          chatGPTAnalysis.action = 'raise'
          chatGPTAnalysis.adjustmentReason = 'Exploiting late position advantage'
        }
      } else if (['UTG', 'MP'].includes(actionData.hero_position)) {
        chatGPTAnalysis.reasoning = 'Early position requires caution'
        if (actionData.mendez_recommendation === 'call') {
          chatGPTAnalysis.action = 'fold'
          chatGPTAnalysis.adjustmentReason = 'High reverse implied odds from early position'
        }
      }
    } else {
      // Post-flop analysis
      const relevantHistory = playerHistories.map((h: PlayerHistory) => ({
        style: determinePlayingStyle(h),
        tendencies: findExploitableTendencies(h)
      }))

      chatGPTAnalysis.reasoning = `Street: ${actionData.street}, Position: ${actionData.hero_position}, Pot odds: ${potOdds.toFixed(1)}%, Pot size: ${actionData.pot_size_bb}BB`
      
      if (relevantHistory.some((history: { tendencies: string[] }) => history.tendencies.includes('over-aggressive'))) {
        chatGPTAnalysis.adjustmentReason = 'Opponents showing aggressive tendencies'
        if (actionData.mendez_recommendation === 'raise') {
          chatGPTAnalysis.action = 'call'
        }
      } else if (relevantHistory.some((history: { tendencies: string[] }) => history.tendencies.includes('calls too much'))) {
        chatGPTAnalysis.adjustmentReason = 'Opponents calling too frequently'
        if (actionData.mendez_recommendation === 'call') {
          chatGPTAnalysis.action = 'raise'
        }
      }
    }

    // Insert action data
    const { data: insertedData, error } = await client
      .from('mendez_games')
      .insert(actionData as any)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      throw createError({
        statusCode: 500,
        message: error.message
      })
    }

    // Weight the decisions (90% Mendez, 10% ChatGPT)
    const shouldUseGPTSuggestion = Math.random() < 0.1 && 
                                  chatGPTAnalysis.action !== actionData.mendez_recommendation &&
                                  chatGPTAnalysis.adjustmentReason

    // Combine all recommendations
    const finalDecision = {
      action: shouldUseGPTSuggestion ? chatGPTAnalysis.action : actionData.mendez_recommendation,
      confidence: shouldUseGPTSuggestion ? 'medium' : 'high',
      reasoning: `${actionData.street.toUpperCase()} decision based on Mendez (${actionData.mendez_recommendation})`,
      streetAdjustments,
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
      weightedDecision: {
        mendezWeight: '90%',
        chatGPTWeight: '10%',
        finalAction: shouldUseGPTSuggestion ? chatGPTAnalysis.action : actionData.mendez_recommendation,
        explanation: shouldUseGPTSuggestion 
          ? `ChatGPT adjustment applied: ${chatGPTAnalysis.adjustmentReason}`
          : 'Following Mendez recommendation'
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