import type { PlayerHistory, PlayerUpdate, PlayerStats } from './types'

export async function getPlayerHistories(client: any, playerNames: string[]) {
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

export async function updatePlayerStats(client: any, player: any, update: PlayerUpdate): Promise<PlayerStats> {
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
    const { error: updateError } = await client
      .from('mendez_player_history')
      .upsert({
        player_name: update.playerName,
        ...newStats
      }, {
        onConflict: 'player_name'
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

export function determinePlayingStyle(history: PlayerHistory) {
  if (history.total_hands < 20) return 'unknown'
  
  const style = {
    aggression: history.aggression_factor > 2 ? 'aggressive' : 'passive',
    frequency: history.vpip_percentage > 30 ? 'loose' : 'tight',
    preflop: history.pfr_percentage > 20 ? 'raising' : 'calling'
  }
  
  return `${style.frequency}-${style.aggression}`
}

export function findExploitableTendencies(history: PlayerHistory) {
  const tendencies = []
  
  if (history.total_hands < 20) return ['insufficient data']
  
  if (history.vpip_percentage > 40) tendencies.push('plays too many hands')
  if (history.aggression_factor < 1) tendencies.push('calls too much')
  if (history.aggression_factor > 3) tendencies.push('over-aggressive')
  
  return tendencies
}

export function analyzeOpponentType(history: PlayerHistory): {
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

export function getBetSizeType(betSize: number, potSize: number): 'half_pot' | 'full_pot' | undefined {
  if (!betSize || !potSize) return undefined
  const ratio = betSize / potSize
  if (ratio >= 0.4 && ratio <= 0.6) return 'half_pot'
  if (ratio >= 0.9 && ratio <= 1.1) return 'full_pot'
  return undefined
} 