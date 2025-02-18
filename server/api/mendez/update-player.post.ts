import { serverSupabaseServiceRole } from '#supabase/server'

interface PlayerUpdate {
  playerName: string
  handInfo: {
    position: string
    holeCards?: string  // Only included if went to showdown
    action: string
    betSize: number
    potSize: number
    result: 'win' | 'lose' | 'fold'
    profitLoss: number
    wentToShowdown: boolean
    vpipAction: boolean  // True if player voluntarily put money in pot
    pfrAction: boolean   // True if player raised preflop
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
      last_seen_at: new Date().toISOString()
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
    vpip_percentage: 0, // Will be calculated below
    pfr_percentage: 0,  // Will be calculated below
    showdown_hands_history: [...player.showdown_hands_history],
    betting_patterns: { ...player.betting_patterns },
    position_tendencies: { ...player.position_tendencies },
    last_seen_at: new Date().toISOString()
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

  // Update betting patterns
  const actionKey = `${handInfo.position}_${handInfo.action}`
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