import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseServiceRole(event)

  try {
    const { data, error } = await client
      .from('mendez_games')
      .select(`
        hero_position,
        hero_cards,
        street,
        gpt_decision,
        current_bet_bb,
        pot_size_bb,
        decision_reasoning,
        created_at
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    return {
      success: true,
      data: data || []
    }

  } catch (err) {
    console.error('Error fetching hand history:', err)
    throw createError({
      statusCode: 500,
      message: err instanceof Error ? err.message : 'Failed to fetch hand history'
    })
  }
}) 