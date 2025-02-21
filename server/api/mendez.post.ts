import { serverSupabaseServiceRole } from '#supabase/server'
import type { MendezAction, PlayerUpdate, PlayerHistory } from '../utils/mendez/types'
import type { Database } from '../../types/database.types'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getPlayerHistories, updatePlayerStats, getBetSizeType } from '../utils/mendez/playerStats'
import { getGPTAnalysis } from '../utils/mendez/gptAnalysis'

const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1 second

async function retryOperation<T>(operation: () => Promise<T>, retries = MAX_RETRIES): Promise<T> {
  try {
    return await operation()
  } catch (error: any) {
    if (retries > 0 && error.message?.includes('fetch failed')) {
      console.log(`Retrying operation, ${retries} attempts remaining...`)
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
      return retryOperation(operation, retries - 1)
    }
    throw error
  }
}

// Add type for GPT analysis result
interface GPTAnalysisResult {
  action: string | null
  reasoning: string | null
  confidence?: string
  adjustmentReason?: string
  gtoContext?: string
  reliablePlayerStats?: boolean
}

export default defineEventHandler(async (event) => {
  try {
    const client = await serverSupabaseServiceRole(event) as SupabaseClient<Database>
    const body = await readBody(event)

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
      effective_stack: body.effectiveStack || 0,
      action_history: body.actionHistory || [],
      positions: body.positions || {},
      playerStacks: body.playerStacks || {}
    }

    // Get player histories with retry logic
    const playerHistories = await retryOperation(() => 
      getPlayerHistories(client, actionData.active_players)
    )
    
    // Calculate pot odds
    const potOdds = (actionData.to_call_bb / (actionData.pot_size_bb + actionData.to_call_bb)) * 100

    // Get ChatGPT analysis
    let chatGPTAnalysis: GPTAnalysisResult = { action: null, reasoning: null }
    try {
      chatGPTAnalysis = await getGPTAnalysis(actionData, playerHistories)
    } catch (gptError) {
      console.error('GPT Analysis failed:', gptError)
      // Continue with the request even if GPT fails
    }

    // Insert action data with retry logic
    const { data: insertedData, error: insertError } = await retryOperation(async () => {
      // Format action history for better readability
      const formattedActionHistory = actionData.action_history?.map(action => ({
        player: action.player,
        position: actionData.positions?.[action.player] || null,
        street: action.street || actionData.street,
        action: action.action,
        amount: action.amount,
        timestamp: action.timestamp || new Date().toISOString()
      })) || []

      // Prepare insert data with correct types
      const insertData = {
        hand_id: actionData.hand_id,
        street: actionData.street,
        players: actionData.players,
        hero_position: actionData.hero_position,
        hero_cards: actionData.hero_cards,
        board_cards: actionData.board_cards || null,
        pot_size_bb: actionData.pot_size_bb,
        to_call_bb: actionData.to_call_bb,
        current_bet_bb: actionData.current_bet_bb,
        active_players: actionData.active_players,
        action_on: actionData.action_on,
        last_action: actionData.last_action || null,
        last_bet_size_bb: actionData.last_bet_size_bb || null,
        effective_stack: actionData.effective_stack || 0,
        gpt_decision: chatGPTAnalysis.action || 'fold', // Default to 'fold' instead of null
        decision_reasoning: chatGPTAnalysis.reasoning || 'GPT analysis failed',
        action_history: formattedActionHistory,
        positions: actionData.positions || {},
        player_stacks: actionData.playerStacks || {}
      } as const

      const result = await client
        .from('mendez_games')
        .insert(insertData)
        .select()
        .single()
      return result
    })

    if (insertError) {
      console.error('Database error:', insertError)
      throw createError({
        statusCode: 500,
        message: insertError.message
      })
    }

    // Update stats for all active players with retry logic
    await Promise.all(
      actionData.active_players.map(async playerName => {
        try {
          // First get the existing player data
          const { data: playerData } = await retryOperation(async () => {
            const result = await client
              .from('mendez_player_history')
              .select('*')
              .eq('player_name', playerName)
              .single()
            return result
          })

          // Create the update object
          const playerUpdate: PlayerUpdate = {
            playerName,
            handInfo: {
              position: actionData.hero_position,
              action: chatGPTAnalysis.action || 'fold',
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

          return retryOperation(() => updatePlayerStats(client, existingPlayer, playerUpdate))
        } catch (error: any) {
          console.error(`Error updating stats for player ${playerName}:`, error)
          // Continue with other players even if one fails
          return null
        }
      })
    )

    // Return response
    return { 
      success: true, 
      handId: (insertedData as any).hand_id,
      street: (insertedData as any).street,
      decision: {
        action: chatGPTAnalysis.action || 'fold',
        confidence: 'low',
        reasoning: chatGPTAnalysis.reasoning || 'GPT analysis failed',
        execute: true
      },
      message: chatGPTAnalysis.action ? 'Decision computed successfully' : 'Decision defaulted to fold due to GPT error'
    }
  } catch (error: any) {
    console.error('Server error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'An error occurred while processing the decision'
    })
  }
}) 