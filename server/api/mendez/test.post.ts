import { serverSupabaseServiceRole } from '#supabase/server'
import type { MendezPayload } from '../../../types/mendez-api.types'
import type { Database } from '../../../types/database.types'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseServiceRole<Database>(event)
  const payload = await readBody<MendezPayload>(event)
  
  try {
    // Get GPT's decision
    const prompt = `Analyze this poker decision using GTO principles:

Game State:
- Street: ${payload.street}
- Position: ${payload.heroPosition}
- Hero Cards: ${payload.heroCards}
- Board: ${payload.boardCards || 'None (preflop)'}
- Pot: ${payload.potSize}BB
- To Call: ${payload.toCall}BB
- Effective Stack: ${payload.effectiveStack}BB
- Last Action: ${payload.lastAction || 'None'}
- Last Bet Size: ${payload.lastBetSize || 'None'}

Position Considerations:
- UTG: 5-8% range (JJ+, AQs+, AKo)
- MP: 10-12% range (TT+, AJs+, KQs, AQo+)
- CO: 20-25% range (88+, AT+, KJ+, suited connectors)
- BTN: 35-45% range (22+, A2+, K8+, Q9+, suited connectors)

Respond with exactly two sentences: First sentence must be "Action: [fold/call/raise]". Second sentence should explain the decision's alignment with GTO principles and position considerations.`

    const response = await $fetch<{ content: string }>('/api/openai', {
      method: 'POST',
      body: {
        messages: [{ role: 'user', content: prompt }],
        model: 'gpt-3.5-turbo-0125',
        temperature: 0.7,
        max_tokens: 150
      }
    })

    if (!response || !response.content) {
      throw new Error('Empty response from GPT')
    }

    const actionMatch = response.content.match(/Action: (fold|call|raise)/i)
    if (!actionMatch) {
      throw new Error('Invalid response format from GPT')
    }

    const action = actionMatch[1].toLowerCase()
    const reasoning = response.content.split('.')[1]?.trim() || response.content

    // Save to database
    const gameData = {
      hand_id: payload.handId,
      street: payload.street,
      players: payload.players,
      hero_position: payload.heroPosition,
      hero_cards: payload.heroCards,
      board_cards: payload.boardCards ?? null,
      pot_size_bb: payload.potSize,
      to_call_bb: payload.toCall,
      current_bet_bb: payload.currentBet,
      active_players: payload.activePlayers,
      action_on: payload.actionOn,
      last_action: payload.lastAction ?? null,
      last_bet_size_bb: payload.lastBetSize ?? null,
      player_stacks: payload.playerStacks,
      effective_stack: payload.effectiveStack,
      gpt_decision: action,
      decision_reasoning: reasoning
    } satisfies Database['public']['Tables']['mendez_games']['Insert']

    const { error } = await client
      .from('mendez_games')
      .insert(gameData)

    if (error) {
      console.error('Error saving game:', error)
      throw error
    }

    return {
      success: true,
      action,
      reasoning,
      gto_context: prompt
    }

  } catch (error: any) {
    console.error('Error:', error)
    throw createError({
      statusCode: 500,
      message: error.message || 'An error occurred while processing the request'
    })
  }
}) 