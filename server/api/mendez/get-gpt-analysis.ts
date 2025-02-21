import { serverSupabaseServiceRole } from '#supabase/server'
import type { MendezGame } from '~/types/mendez.types'

interface GPTAnalysisRow {
  id: string
  created_at: string
  street: string
  hero_position: string
  hero_cards: string
  board_cards: string | null
  pot_size_bb: number
  to_call_bb: number
  gpt_decision: string
  decision_reasoning: string
  final_action: string | null
  total_decisions: number
  correct_decisions: number
  incorrect_decisions: number
  avg_profit_bb: number
  success_rate: number
  position_decisions: number
  position_success_rate: number
  position_profit_bb: number
  texture_decisions: number
  texture_success_rate: number
  pot_decisions: number
  pot_success_rate: number
  daily_decisions: number
  daily_success_rate: number
}

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseServiceRole(event)

  try {
    const { data, error } = await client.from('mendez_games')
      .select(`
        id,
        created_at,
        street,
        hero_position,
        hero_cards,
        board_cards,
        pot_size_bb,
        to_call_bb,
        gpt_decision,
        decision_reasoning,
        final_action
      `)
      .select(`
        WITH decision_stats AS (
          SELECT
            street,
            gpt_decision,
            COUNT(*) as total_decisions,
            COUNT(CASE WHEN final_action = gpt_decision THEN 1 END) as correct_decisions,
            COUNT(CASE WHEN final_action != gpt_decision THEN 1 END) as incorrect_decisions,
            AVG(CASE 
              WHEN final_action = 'fold' THEN -to_call_bb 
              ELSE pot_size_bb 
            END) as avg_profit_bb,
            -- Success rate by street and decision
            ROUND(
              COUNT(CASE WHEN final_action = gpt_decision THEN 1 END)::FLOAT / 
              NULLIF(COUNT(*), 0) * 100, 
              2
            ) as success_rate
          FROM mendez_games
          WHERE gpt_decision IS NOT NULL
          GROUP BY street, gpt_decision
        ),
        position_analysis AS (
          SELECT
            hero_position,
            gpt_decision,
            COUNT(*) as position_decisions,
            ROUND(
              COUNT(CASE WHEN final_action = gpt_decision THEN 1 END)::FLOAT / 
              NULLIF(COUNT(*), 0) * 100, 
              2
            ) as position_success_rate,
            AVG(CASE 
              WHEN final_action = 'fold' THEN -to_call_bb 
              ELSE pot_size_bb 
            END) as position_profit_bb
          FROM mendez_games
          WHERE gpt_decision IS NOT NULL
          GROUP BY hero_position, gpt_decision
        ),
        board_texture_analysis AS (
          SELECT
            CASE
              WHEN board_cards IS NULL THEN 'preflop'
              WHEN array_length(regexp_matches(board_cards, '[cdhs]', 'g'), 1) = 3 THEN 'monotone'
              WHEN array_length(regexp_matches(board_cards, '([2-9TJQKA])[cdhs]\\1[cdhs]', 'g'), 1) > 0 THEN 'paired'
              ELSE 'dry'
            END as board_type,
            gpt_decision,
            COUNT(*) as texture_decisions,
            ROUND(
              COUNT(CASE WHEN final_action = gpt_decision THEN 1 END)::FLOAT / 
              NULLIF(COUNT(*), 0) * 100, 
              2
            ) as texture_success_rate
          FROM mendez_games
          WHERE gpt_decision IS NOT NULL
          GROUP BY board_type, gpt_decision
        ),
        pot_size_analysis AS (
          SELECT
            CASE
              WHEN pot_size_bb <= 10 THEN 'small_pot'
              WHEN pot_size_bb <= 30 THEN 'medium_pot'
              ELSE 'large_pot'
            END as pot_category,
            gpt_decision,
            COUNT(*) as pot_decisions,
            ROUND(
              COUNT(CASE WHEN final_action = gpt_decision THEN 1 END)::FLOAT / 
              NULLIF(COUNT(*), 0) * 100, 
              2
            ) as pot_success_rate
          FROM mendez_games
          WHERE gpt_decision IS NOT NULL
          GROUP BY pot_category, gpt_decision
        ),
        time_trend_analysis AS (
          SELECT
            date_trunc('day', created_at) as decision_date,
            COUNT(*) as daily_decisions,
            ROUND(
              COUNT(CASE WHEN final_action = gpt_decision THEN 1 END)::FLOAT / 
              NULLIF(COUNT(*), 0) * 100, 
              2
            ) as daily_success_rate
          FROM mendez_games
          WHERE gpt_decision IS NOT NULL
          GROUP BY date_trunc('day', created_at)
          ORDER BY decision_date
        )
        SELECT
          d.*,
          p.*,
          b.*,
          ps.*,
          t.*
        FROM decision_stats d
        LEFT JOIN position_analysis p ON d.gpt_decision = p.gpt_decision
        LEFT JOIN board_texture_analysis b ON d.gpt_decision = b.gpt_decision
        LEFT JOIN pot_size_analysis ps ON d.gpt_decision = ps.gpt_decision
        LEFT JOIN time_trend_analysis t ON true
        ORDER BY d.street, d.gpt_decision
      `) as { data: GPTAnalysisRow[] | null, error: any }

    if (error) throw error

    // Calculate overall statistics
    const overallStats = {
      totalDecisions: 0,
      successRate: 0,
      avgProfitBB: 0,
      decisionDistribution: {} as Record<string, number>,
      streetBreakdown: {} as Record<string, {
        total: number,
        successRate: number,
        avgProfit: number
      }>,
      positionBreakdown: {} as Record<string, {
        total: number,
        successRate: number,
        avgProfit: number
      }>
    }

    if (data) {
      data.forEach(row => {
        // Update overall stats
        overallStats.totalDecisions++
        if (row.final_action === row.gpt_decision) {
          overallStats.successRate++
        }
        overallStats.avgProfitBB += row.final_action === 'fold' ? -row.to_call_bb : row.pot_size_bb

        // Update decision distribution
        overallStats.decisionDistribution[row.gpt_decision] = 
          (overallStats.decisionDistribution[row.gpt_decision] || 0) + 1

        // Update street breakdown
        if (!overallStats.streetBreakdown[row.street]) {
          overallStats.streetBreakdown[row.street] = {
            total: 0,
            successRate: 0,
            avgProfit: 0
          }
        }
        overallStats.streetBreakdown[row.street].total++
        if (row.final_action === row.gpt_decision) {
          overallStats.streetBreakdown[row.street].successRate++
        }
        overallStats.streetBreakdown[row.street].avgProfit += 
          row.final_action === 'fold' ? -row.to_call_bb : row.pot_size_bb

        // Update position breakdown
        if (!overallStats.positionBreakdown[row.hero_position]) {
          overallStats.positionBreakdown[row.hero_position] = {
            total: 0,
            successRate: 0,
            avgProfit: 0
          }
        }
        overallStats.positionBreakdown[row.hero_position].total++
        if (row.final_action === row.gpt_decision) {
          overallStats.positionBreakdown[row.hero_position].successRate++
        }
        overallStats.positionBreakdown[row.hero_position].avgProfit += 
          row.final_action === 'fold' ? -row.to_call_bb : row.pot_size_bb
      })

      // Convert counts to percentages
      overallStats.successRate = (overallStats.successRate / overallStats.totalDecisions) * 100
      overallStats.avgProfitBB = overallStats.avgProfitBB / overallStats.totalDecisions

      // Convert street and position stats to percentages
      Object.keys(overallStats.streetBreakdown).forEach(street => {
        const stats = overallStats.streetBreakdown[street]
        stats.successRate = (stats.successRate / stats.total) * 100
        stats.avgProfit = stats.avgProfit / stats.total
      })

      Object.keys(overallStats.positionBreakdown).forEach(position => {
        const stats = overallStats.positionBreakdown[position]
        stats.successRate = (stats.successRate / stats.total) * 100
        stats.avgProfit = stats.avgProfit / stats.total
      })
    }

    return {
      success: true,
      data: {
        detailedAnalysis: data,
        overallStats
      }
    }

  } catch (err) {
    console.error('Error fetching GPT analysis:', err)
    throw createError({
      statusCode: 500,
      message: err instanceof Error ? err.message : 'Failed to fetch GPT analysis'
    })
  }
}) 