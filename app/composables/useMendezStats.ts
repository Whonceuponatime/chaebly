import { ref } from 'vue'
import { useSupabaseClient } from '#imports'
import type { Database } from '../../types/supabase.types'

interface DetailedStats {
  id: string
  name: string
  vpip_percentage: number
  pfr_percentage: number
  three_bet_percentage: number
  cbet_percentage: number
  cbet_success_rate: number
  fold_to_cbet_percentage: number
  btn_win_rate: number
  sb_win_rate: number
  bb_win_rate: number
  flopzilla_accuracy: number
  total_profit: number
  avg_profit_per_hand: number
}

export const useMendezStats = () => {
  const supabase = useSupabaseClient<Database>()
  const loading = ref(false)
  const error = ref<string | null>(null)
  const detailedStats = ref<DetailedStats[]>([])

  const fetchDetailedStats = async () => {
    loading.value = true
    error.value = null

    try {
      const { data, error: err } = await supabase
        .from('mendez_detailed_stats')
        .select('*')

      if (err) throw err
      detailedStats.value = data || []
    } catch (err: any) {
      error.value = err.message
      console.error('Error fetching detailed stats:', err)
    } finally {
      loading.value = false
    }
  }

  const getSessionStats = async (sessionId: string) => {
    try {
      const { data, error: err } = await supabase
        .from('mendez_hand_stats')
        .select('*')
        .eq('session_id', sessionId)

      if (err) throw err
      return data
    } catch (err: any) {
      error.value = err.message
      console.error('Error fetching session stats:', err)
      return null
    }
  }

  const getFlopzillaAccuracy = async (playerId: string) => {
    try {
      const { data, error: err } = await supabase
        .from('mendez_flopzilla_analysis')
        .select('*')
        .eq('player_id', playerId)

      if (err) throw err
      
      if (!data || data.length === 0) return 0

      const correctDecisions = data.filter(d => d.was_correct).length
      return (correctDecisions / data.length) * 100
    } catch (err: any) {
      error.value = err.message
      console.error('Error fetching Flopzilla accuracy:', err)
      return 0
    }
  }

  const getProfitTrend = async (playerId: string, days: number = 30) => {
    try {
      const { data, error: err } = await supabase
        .from('mendez_hand_stats')
        .select('created_at, won_amount')
        .eq('player_id', playerId)
        .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at')

      if (err) throw err
      return data
    } catch (err: any) {
      error.value = err.message
      console.error('Error fetching profit trend:', err)
      return null
    }
  }

  return {
    detailedStats,
    loading,
    error,
    fetchDetailedStats,
    getSessionStats,
    getFlopzillaAccuracy,
    getProfitTrend
  }
} 