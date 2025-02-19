import { serverSupabaseServiceRole } from '#supabase/server'

interface PlayerUpdate {
  playerName: string
  handInfo: {
    position: string
    action: string
    betSize: number
    potSize: number
    result: 'win' | 'lose'
    profitLoss: number
    wentToShowdown: boolean
    vpipAction: boolean  // True if player voluntarily put money in pot
    pfrAction: boolean   // True if player raised preflop
    isBluff: boolean    // True if the action was a bluff
    lastAction: string  // Previous action in the hand
    street: string     // Current street (preflop, flop, turn, river)
    betSizeType: 'half_pot' | 'full_pot' | 'other'  // Type of bet sizing
    holeCards?: string // Optional hole cards for showdown hands
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

async function getOrCreatePlayer(client: any, playerName: string) {
  // Try to get existing player
  const { data: existingPlayer, error: fetchError } = await client
    .from('mendez_player_history')
    .select('*')
    .eq('player_name', playerName)
    .single()

  if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found"
    throw fetchError
  }

  if (existingPlayer) {
    return existingPlayer
  }

  // Create new player if not found
  const { data: newPlayer, error: insertError } = await client
    .from('mendez_player_history')
    .insert({
      player_name: playerName,
      total_hands: 0,
      showdown_hands: 0,
      hands_won: 0,
      aggression_factor: 0,
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
    })
    .select()
    .single()

  if (insertError) {
    throw insertError
  }

  return newPlayer
}

async function updatePlayerStats(client: any, player: any, update: PlayerUpdate): Promise<PlayerStats> {
  const handInfo = update.handInfo
  const newStats: PlayerStats = {
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
    bb_per_100_hands: player.bb_per_100_hands,
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

  // Update the player record
  const { error: updateError } = await client
    .from('mendez_player_history')
    .update(newStats)
    .eq('player_name', player.player_name)

  if (updateError) {
    throw updateError
  }

  return newStats
}

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseServiceRole(event)
  const body = await readBody(event)

  try {
    const update: PlayerUpdate = body
    const player = await getOrCreatePlayer(client, update.playerName)
    const updatedStats = await updatePlayerStats(client, player, update)

    return {
      success: true,
      playerName: update.playerName,
      stats: updatedStats,
      message: 'Player stats updated successfully'
    }
  } catch (error: any) {
    console.error('Error updating player stats:', error)
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to update player stats'
    })
  }
}) 