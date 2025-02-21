import type { MendezAction, PlayerHistory } from './types'
import { determinePlayingStyle, findExploitableTendencies } from './playerStats'
import { getPreflopAction, getPostflopAdjustment, mapToStandardPosition } from './strategyAdjustments'
import { apiManager } from './apiManager'

function debugLog(section: string, data: any) {
  console.log(`\n🔍 ${section} ${'-'.repeat(50)}`)
  if (typeof data === 'object') {
    Object.entries(data).forEach(([key, value]) => {
      console.log(`${key.padEnd(15)}: ${JSON.stringify(value)}`)
    })
  } else {
    console.log(data)
  }
}

function validatePayload(actionData: MendezAction): void {
  // Ensure actionData is an object
  if (!actionData || typeof actionData !== 'object') {
    throw new Error('Invalid action data: must be an object')
  }

  // Set default values for missing fields
  const defaults = {
    hand_id: crypto.randomUUID(),
    street: 'preflop',
    pot_size_bb: 1.5,
    to_call_bb: 1,
    current_bet_bb: 1,
    active_players: [],
    action_on: '',
    positions: {},
    playerStacks: {},
    action_history: []
  }

  // Merge defaults with provided data
  Object.entries(defaults).forEach(([key, value]) => {
    if (!actionData[key as keyof MendezAction]) {
      (actionData as any)[key] = value
    }
  })

  // These fields must be provided - cannot have defaults
  const criticalFields = ['hero_position', 'hero_cards']
  const missingCritical = criticalFields.filter(field => !actionData[field as keyof MendezAction])
  
  if (missingCritical.length > 0) {
    throw new Error(`Missing critical fields: ${missingCritical.join(', ')}`)
  }

  // Validate hand format if present
  if (actionData.hero_cards && !/^[2-9TJQKA][hdcs][2-9TJQKA][hdcs]$/.test(actionData.hero_cards)) {
    throw new Error(`Invalid hand format: ${actionData.hero_cards}`)
  }

  // Validate board format if present
  if (actionData.board_cards && !/^([2-9TJQKA][hdcs]){3,5}$/.test(actionData.board_cards)) {
    throw new Error(`Invalid board format: ${actionData.board_cards}`)
  }

  // Validate numeric values are positive
  if (actionData.pot_size_bb < 0 || actionData.to_call_bb < 0) {
    throw new Error('Invalid pot size or call amount')
  }

  debugLog('PAYLOAD VALIDATION', {
    handId: actionData.hand_id,
    isValid: true,
    activePlayerCount: actionData.active_players.length,
    hasPositions: Object.keys(actionData.positions || {}).length > 0,
    hasStacks: Object.keys(actionData.playerStacks || {}).length > 0
  })
}

function validateGPTResponse(content: string, actionData: MendezAction): boolean {
  // Check if response mentions the correct hand
  const hasCorrectHand = content.toLowerCase().includes(actionData.hero_cards.toLowerCase())
  
  // Check if response mentions the correct board if it exists
  const hasCorrectBoard = !actionData.board_cards || content.toLowerCase().includes(actionData.board_cards.toLowerCase())
  
  // Check if response mentions the correct position
  const hasCorrectPosition = content.toLowerCase().includes(actionData.hero_position.toLowerCase())

  // Check if response contains a valid action
  const hasValidAction = /(fold|call|raise)/i.test(content)

  debugLog('GPT RESPONSE VALIDATION', {
    hasCorrectHand,
    hasCorrectBoard,
    hasCorrectPosition,
    hasValidAction,
    isValid: (hasCorrectHand || hasCorrectBoard || hasCorrectPosition) && hasValidAction
  })

  return (hasCorrectHand || hasCorrectBoard || hasCorrectPosition) && hasValidAction
}

// Add markdown export function
function generateMarkdown(actionData: MendezAction, metrics: any, actionHistoryText: string, playerStats: any[], adjustment: any): string {
  const md = `# Poker Hand Analysis

## Current Situation
- **Position:** ${actionData.hero_position} (${metrics.isIP ? 'In Position' : 'Out of Position'})
- **Hero Cards:** ${actionData.hero_cards}
- **Board:** ${actionData.board_cards || 'Preflop'}
- **Street:** ${actionData.street}
- **Pot Size:** ${metrics.pot}BB
- **To Call:** ${metrics.toCall}BB
- **Effective Stack:** ${metrics.stack}BB${metrics.potOdds ? `\n- **Pot Odds:** ${metrics.potOdds}%` : ''}
- **Active Players:** ${actionData.active_players.length} (${metrics.isMultiway ? 'Multiway Pot' : 'Heads Up'})

## Action History
\`\`\`
${actionHistoryText}
\`\`\`

## Stack Sizes
\`\`\`
${Object.entries(actionData.playerStacks || {})
  .map(([player, stack]) => `${player}(${actionData.positions?.[player] || '?'}): ${stack}BB`)
  .join('\n')}
\`\`\`

## Player Statistics
| Player | Style | VPIP | PFR | Aggression |
|--------|-------|------|-----|------------|
${playerStats.map(p => `| ${p.name} | ${p.style} | ${p.vpip}% | ${p.pfr}% | ${p.agg} |`).join('\n')}

## GTO Analysis
- **Suggested Action:** ${adjustment.action}
- **Reasoning:** ${adjustment.reasoning}

## Final Decision
- **Action:** [Pending GPT Analysis]
- **Confidence:** [Pending]
- **Reasoning:** [Pending]
`
  return md
}

export async function getGPTAnalysis(actionData: MendezAction, playerHistories: PlayerHistory[]) {
  try {
    // Validate payload first
    validatePayload(actionData)

    // Map the position to a standard one
    const standardPosition = mapToStandardPosition(actionData.hero_position)

    debugLog('HAND INFO', {
      handId: actionData.hand_id,
      street: actionData.street,
      position: actionData.hero_position,
      standardPosition,
      hand: actionData.hero_cards,
      board: actionData.board_cards || '-',
      stack: actionData.effective_stack,
      pot: actionData.pot_size_bb,
      toCall: actionData.to_call_bb
    })

    // Format action history concisely
    const actionHistoryText = actionData.action_history?.map(action => 
      `${action.player}(${actionData.positions?.[action.player] || '?'}): ${action.action}${action.amount > 0 ? ` ${action.amount}BB` : ''}`
    ).join(' → ') || 'No history'

    // Calculate pot odds if facing a bet
    const potOdds = actionData.to_call_bb > 0 
      ? ((actionData.to_call_bb / (actionData.pot_size_bb + actionData.to_call_bb)) * 100).toFixed(1)
      : null

    // Pre-calculate metrics concisely
    const effectiveStack = actionData.effective_stack || 0
    const metrics = {
      stack: effectiveStack,
      pot: actionData.pot_size_bb,
      toCall: actionData.to_call_bb,
      isIP: ['BTN', 'CO'].includes(standardPosition) || 
            (standardPosition === 'MP' && !actionData.active_players.some(p => ['BTN', 'CO'].includes(actionData.positions?.[p] || ''))),
      isMultiway: actionData.active_players.length > 2,
      potOdds
    }

    debugLog('METRICS', metrics)

    // Process player stats concisely
    const playerStats = playerHistories
      .filter(p => p.total_hands >= 20)
      .map(p => ({
        name: p.player_name,
        style: p.vpip_percentage > 30 ? (p.aggression_factor > 2 ? 'LAG' : 'LP') : (p.aggression_factor > 2 ? 'TAG' : 'TP'),
        vpip: p.vpip_percentage.toFixed(0),
        pfr: p.pfr_percentage.toFixed(0),
        agg: p.aggression_factor.toFixed(1)
      }))

    debugLog('PLAYER STATS', playerStats)

    // Get strategy adjustment
    const adjustment = actionData.street === 'preflop' ? 
      { action: getPreflopAction(actionData.hero_cards, standardPosition), reasoning: 'Preflop strategy' } :
      getPostflopAdjustment(
        actionData.hero_cards,
        actionData.board_cards || '',
        standardPosition,
        metrics.isMultiway,
        !actionData.last_action
      )

    debugLog('STRATEGY ADJUSTMENT', adjustment)

    // Generate markdown for the analysis
    const markdown = generateMarkdown(actionData, metrics, actionHistoryText, playerStats, adjustment)
    debugLog('MARKDOWN', markdown)

    // Build detailed prompt
    const prompt = `Analyze this ${actionData.street} poker situation:

Current Situation:
- Position: ${actionData.hero_position} (${metrics.isIP ? 'In Position' : 'Out of Position'})
- Hero Cards: ${actionData.hero_cards}
- Board: ${actionData.board_cards || 'Preflop'}
- Street: ${actionData.street}
- Pot Size: ${metrics.pot}BB
- To Call: ${metrics.toCall}BB
- Effective Stack: ${metrics.stack}BB
${potOdds ? `- Pot Odds: ${potOdds}%` : ''}
- Active Players: ${actionData.active_players.length}
${metrics.isMultiway ? '- Multiway Pot' : '- Heads Up'}

Action History:
${actionHistoryText}

Stack Sizes:
${Object.entries(actionData.playerStacks || {})
  .map(([player, stack]) => `${player}(${actionData.positions?.[player] || '?'}): ${stack}BB`)
  .join('\n')}

Player Stats:
${playerStats.map(p => `${p.name}: ${p.style} (VPIP: ${p.vpip}%, PFR: ${p.pfr}%, AGG: ${p.agg})`).join('\n')}

GTO Adjustment:
Suggested: ${adjustment.action} (${adjustment.reasoning})

Provide a decision in this format:
Action: [fold/call/raise]
Reason: [brief explanation considering position, pot odds, stack sizes, and player tendencies]`

    debugLog('GPT PROMPT', prompt)

    try {
      // Check cache stats before API call
      const cacheStats = apiManager.getCacheStats()
      debugLog('CACHE STATS', {
        cacheSize: cacheStats.size,
        similarityCache: cacheStats.similarityCacheSize,
        queueLength: cacheStats.queueLength
      })

      const response = await apiManager.callGPT(prompt, {
        model: 'gpt-4o',
        temperature: 0.7,
        max_tokens: 50,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
        bypassCache: true // Always bypass cache for now until we fix the caching issue
      })

      if (!response?.content) {
        throw new Error('Empty response')
      }

      debugLog('GPT RESPONSE', response.content)

      // Validate GPT response
      if (!validateGPTResponse(response.content, actionData)) {
        throw new Error('Invalid GPT response - does not match current hand')
      }

      const { action, reasoning } = parseResponse(response.content)
      const finalAction = action === 'fold' && adjustment.action !== 'fold' ? adjustment.action : action

      const result = {
        action: finalAction,
        confidence: 'high',
        reasoning: reasoning.slice(0, 100),
        adjustmentReason: adjustment.reasoning.slice(0, 50),
        gtoContext: '',
        reliablePlayerStats: playerStats.length > 0,
        markdown // Include markdown in the result
      }

      debugLog('FINAL DECISION', result)
      return result

    } catch (error: any) {
      debugLog('GPT ERROR', {
        error: error.message,
        cacheStats: apiManager.getCacheStats(),
        rateLimitStats: apiManager.getRateLimitStats()
      })

      const fallbackResult = {
        action: adjustment.action,
        confidence: 'medium',
        reasoning: adjustment.reasoning.slice(0, 50),
        adjustmentReason: 'Using strategy adjustment',
        gtoContext: '',
        reliablePlayerStats: playerStats.length > 0,
        markdown // Include markdown even in fallback
      }

      debugLog('FALLBACK DECISION', fallbackResult)
      return fallbackResult
    }
  } catch (err: any) {
    debugLog('CRITICAL ERROR', {
      error: err.message,
      stack: err.stack
    })

    return {
      action: null,
      confidence: 'low',
      reasoning: 'Failed',
      adjustmentReason: 'Failed',
      gtoContext: '',
      reliablePlayerStats: false,
      markdown: '# Analysis Failed\n\nUnable to analyze the poker situation.' // Include error markdown
    }
  }
}

function parseResponse(content: string): { action: string, reasoning: string } {
  // First try to match the formal "Action: X" format
  let actionMatch = content.match(/Action:\s*(fold|call|raise)/i)
  
  // If that fails, look for any mention of the actions
  if (!actionMatch) {
    actionMatch = content.match(/(fold|call|raise)/i)
  }
  
  if (!actionMatch) {
    throw new Error('No action found')
  }

  // Extract reasoning - try different patterns
  let reasoning = ''
  const reasoningMatch = content.match(/Reason(?:ing)?:\s*(.+)/i) ||
                        content.match(/because\s+(.+)/i) ||
                        content.match(/due to\s+(.+)/i)
  
  if (reasoningMatch) {
    reasoning = reasoningMatch[1].trim()
  } else {
    // If no explicit reasoning found, use everything after the action
    const actionIndex = content.indexOf(actionMatch[0])
    if (actionIndex >= 0) {
      reasoning = content.slice(actionIndex + actionMatch[0].length).trim()
    } else {
      reasoning = content.trim()
    }
  }

  return {
    action: actionMatch[1].toLowerCase(),
    reasoning: reasoning || content
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