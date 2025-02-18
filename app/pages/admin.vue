<template>
  <div class="admin-page">
    <div v-if="!isAuthorized" class="unauthorized">
      <h1>접근 권한이 없습니다</h1>
      <p>이 페이지는 관리자만 접근할 수 있습니다.</p>
      <NuxtLink to="/" class="back-link">홈으로 돌아가기</NuxtLink>
    </div>

    <div v-else class="admin-content">
      <h1>Mendez Control Panel</h1>
      
      <!-- Error Message -->
      <div v-if="error" class="mb-4 p-4 bg-red-100 text-red-700 rounded">
        <p class="font-bold">Error:</p>
        <p>{{ error }}</p>
      </div>

      <!-- Loading Message -->
      <div v-if="loading" class="mb-4 p-4 bg-blue-100 text-blue-700 rounded">
        <p>Loading data...</p>
      </div>
      
      <div class="admin-sections">
        <!-- Statistics Overview -->
        <section class="admin-section">
          <h2>Overview</h2>
          <div class="stats-grid">
            <div class="stat-item">
              <h3>Total Games</h3>
              <p class="stat-value">{{ mendezGames.length }}</p>
            </div>
            <div class="stat-item">
              <h3>Total Profit/Loss</h3>
              <p class="stat-value" :class="totalProfit >= 0 ? 'text-green-600' : 'text-red-600'">
                {{ totalProfit }}BB
              </p>
            </div>
            <div class="stat-item">
              <h3>Win Rate</h3>
              <p class="stat-value">{{ winRate }}%</p>
            </div>
            <div class="stat-item">
              <h3>Total Players Tracked</h3>
              <p class="stat-value">{{ playerHistories.length }}</p>
            </div>
          </div>
        </section>

        <!-- Charts -->
        <section class="admin-section">
          <h2>Statistics</h2>
          <div class="charts-grid">
            <div class="chart-container">
              <h3>Profit Trend</h3>
              <ProfitTrendChart :data="profitTrendData" />
            </div>
            <div class="chart-container">
              <h3>Betting Actions</h3>
              <BettingStatsChart :data="bettingStats" />
            </div>
          </div>
        </section>

        <!-- Detailed Street Statistics -->
        <section class="admin-section">
          <div class="header-actions">
            <h2>Street & Position Statistics</h2>
            <button 
              @click="exportStats" 
              class="export-btn"
              :disabled="loading"
            >
              Export Statistics
            </button>
          </div>
          <div class="stats-tabs">
            <button 
              v-for="street in ['all', 'preflop', 'flop', 'turn', 'river']" 
              :key="street"
              @click="currentStreet = street"
              :class="{ active: currentStreet === street }"
              class="tab-btn"
            >
              {{ street === 'all' ? 'All Streets' : street.charAt(0).toUpperCase() + street.slice(1) }}
            </button>
          </div>
          
          <div class="street-stats">
            <div v-for="position in positions" :key="position" class="position-card">
              <h3>{{ position }}</h3>
              <div class="stat-details">
                <div class="stat-row">
                  <span>Total Hands:</span>
                  <span>{{ getPositionStats(position, currentStreet).total }}</span>
                </div>
                <div class="stat-row">
                  <span>Win Rate:</span>
                  <span>{{ formatPercentage(getPositionStats(position, currentStreet).winRate) }}</span>
                </div>
                <div class="stat-row">
                  <span>3-Bet Success:</span>
                  <span>{{ formatPercentage(getPositionStats(position, currentStreet).threeBetSuccess) }}</span>
                </div>
                <div class="stat-row">
                  <span>C-Bet Success:</span>
                  <span>{{ formatPercentage(getPositionStats(position, currentStreet).cBetSuccess) }}</span>
                </div>
                <div class="stat-row">
                  <span>Avg. Pot Size Won:</span>
                  <span>{{ formatNumber(getPositionStats(position, currentStreet).avgPotSizeWon) }}BB</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Player History -->
        <section class="admin-section">
          <div class="header-actions">
            <h2>Player History</h2>
            <button 
              @click="refreshData" 
              class="refresh-btn"
              :disabled="loading"
            >
              Refresh Data
            </button>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Player</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Hands</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Showdowns</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hands Won</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">VPIP%</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">PFR%</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aggression</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Seen</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="player in playerHistories" :key="player.id">
                  <td class="px-6 py-4 whitespace-nowrap text-sm">{{ player.player_name }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm">{{ player.total_hands }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm">{{ player.showdown_hands }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm">{{ player.hands_won }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm">{{ formatPercentage(player.vpip_percentage) }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm">{{ formatPercentage(player.pfr_percentage) }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm">{{ formatNumber(player.aggression_factor) }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm">{{ formatDate(player.last_seen_at) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- Recent Games Table -->
        <section class="admin-section">
          <div class="header-actions">
            <h2>Recent Games</h2>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Street</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hand</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Board</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pot Size</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mendez Rec</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="game in mendezGames" :key="game.id">
                  <td class="px-6 py-4 whitespace-nowrap text-sm">{{ formatDate(game.created_at) }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm capitalize">{{ game.street }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm">{{ game.hero_position }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-mono">{{ game.hero_cards }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-mono">{{ game.board_cards || '-' }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm">{{ game.pot_size_bb }}BB</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm">{{ game.mendez_recommendation }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm">{{ game.final_action || '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSupabaseClient } from '#imports'
import { useAuth } from '../composables/useAuth'
import type { Database } from '../../types/supabase.types'
import ProfitTrendChart from '../components/charts/ProfitTrendChart.vue'
import BettingStatsChart from '../components/charts/BettingStatsChart.vue'
import type { ProfitTrendData, BettingStatsData } from '../types/mendez.types'

interface MendezGame {
  id: string
  created_at: string
  hand_id: string
  street: string
  hero_position: string
  hero_cards: string
  board_cards?: string
  pot_size_bb: number
  to_call_bb: number
  current_bet_bb: number
  mendez_recommendation: string
  final_action?: string
  last_action?: string
  last_bet_size_bb?: number
}

interface PlayerHistory {
  id: string
  player_name: string
  total_hands: number
  showdown_hands: number
  hands_won: number
  aggression_factor: number
  vpip_percentage: number
  pfr_percentage: number
  last_seen_at: string
}

// Add new interfaces for statistics
interface PositionStats {
  total: number
  wins: number
  threeBets: number
  threeBetWins: number
  cBets: number
  cBetWins: number
  totalPotWon: number
  winRate: number
  threeBetSuccess: number
  cBetSuccess: number
  avgPotSizeWon: number
}

const { user } = useAuth()
const supabase = useSupabaseClient<Database>()
const router = useRouter()
const loading = ref(false)
const error = ref<string | null>(null)
const mendezGames = ref<MendezGame[]>([])
const playerHistories = ref<PlayerHistory[]>([])

// Add new refs and constants
const currentStreet = ref('all')
const positions = ['BTN', 'CO', 'MP', 'UTG', 'SB', 'BB']

// Statistics data
const profitTrendData = computed<ProfitTrendData[]>(() => {
  return mendezGames.value.map((game, index) => ({
    hand: index + 1,
    profit: game.pot_size_bb
  })).reverse()
})

const bettingStats = computed<BettingStatsData>(() => {
  const stats = mendezGames.value.reduce((acc, game) => {
    if (game.final_action === 'fold') acc.fold++
    else if (game.final_action === 'call') acc.call++
    else if (game.final_action === 'raise') acc.raise++
    return acc
  }, { fold: 0, call: 0, raise: 0 })
  return stats
})

const totalProfit = computed(() => {
  return mendezGames.value.reduce((sum, game) => sum + game.pot_size_bb, 0)
})

const winRate = computed(() => {
  const wins = mendezGames.value.filter(game => game.pot_size_bb > 0).length
  return mendezGames.value.length > 0 
    ? ((wins / mendezGames.value.length) * 100).toFixed(1) 
    : '0'
})

// Admin authorization
const isAuthorized = computed(() => {
  return user.value?.email === 'taebaek@gmail.com'
})

// Redirect if not authorized
watchEffect(() => {
  if (user.value && !isAuthorized.value) {
    router.push('/')
  }
})

// Fetch data functions
const refreshMendezGames = async () => {
  loading.value = true
  error.value = null
  try {
    const { data, error: dbError } = await supabase
      .from('mendez_games')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (dbError) throw dbError
    mendezGames.value = data || []
  } catch (err) {
    console.error('Error refreshing Mendez games:', err)
    error.value = err instanceof Error ? err.message : 'An unknown error occurred'
  } finally {
    loading.value = false
  }
}

const refreshPlayerHistories = async () => {
  loading.value = true
  error.value = null
  try {
    const { data, error: dbError } = await supabase
      .from('mendez_player_history')
      .select('*')
      .order('last_seen_at', { ascending: false })

    if (dbError) throw dbError
    playerHistories.value = data || []
  } catch (err) {
    console.error('Error refreshing player histories:', err)
    error.value = err instanceof Error ? err.message : 'An unknown error occurred'
  } finally {
    loading.value = false
  }
}

const refreshData = async () => {
  await Promise.all([
    refreshMendezGames(),
    refreshPlayerHistories()
  ])
}

// Formatting helpers
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString()
}

const formatPercentage = (value: number) => {
  return `${value.toFixed(1)}%`
}

const formatNumber = (value: number) => {
  return value.toFixed(2)
}

// Add new function to handle statistics export
const exportStats = () => {
  // Prepare data for export
  const exportData = {
    overview: {
      totalGames: mendezGames.value.length,
      totalProfit: totalProfit.value,
      winRate: winRate.value,
      totalPlayers: playerHistories.value.length
    },
    streetStats: {} as Record<string, any>,
    playerStats: playerHistories.value.map(player => ({
      name: player.player_name,
      totalHands: player.total_hands,
      showdowns: player.showdown_hands,
      handsWon: player.hands_won,
      vpipPercentage: player.vpip_percentage,
      pfrPercentage: player.pfr_percentage,
      aggressionFactor: player.aggression_factor
    }))
  }

  // Get stats for each street
  for (const street of ['all', 'preflop', 'flop', 'turn', 'river']) {
    exportData.streetStats[street] = {}
    for (const position of positions) {
      exportData.streetStats[street][position] = getPositionStats(position, street)
    }
  }

  // Convert to CSV or JSON
  const jsonString = JSON.stringify(exportData, null, 2)
  const blob = new Blob([jsonString], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  
  // Create download link
  const link = document.createElement('a')
  link.href = url
  link.download = `mendez_stats_${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Update getPositionStats to handle 'all' street option
const getPositionStats = (position: string, street: string) => {
  const relevantGames = mendezGames.value.filter(game => 
    game.hero_position === position && 
    (street === 'all' || game.street === street)
  )

  const stats: PositionStats = {
    total: relevantGames.length,
    wins: relevantGames.filter(g => g.pot_size_bb > 0).length,
    threeBets: relevantGames.filter(g => g.final_action === 'raise' && g.last_action === 'raise').length,
    threeBetWins: relevantGames.filter(g => 
      g.final_action === 'raise' && 
      g.last_action === 'raise' && 
      g.pot_size_bb > 0
    ).length,
    cBets: relevantGames.filter(g => g.final_action === 'raise' && !g.last_action).length,
    cBetWins: relevantGames.filter(g => 
      g.final_action === 'raise' && 
      !g.last_action && 
      g.pot_size_bb > 0
    ).length,
    totalPotWon: relevantGames.reduce((sum, g) => sum + (g.pot_size_bb > 0 ? g.pot_size_bb : 0), 0),
    winRate: 0,
    threeBetSuccess: 0,
    cBetSuccess: 0,
    avgPotSizeWon: 0
  }

  // Calculate percentages and averages
  stats.winRate = stats.total > 0 ? (stats.wins / stats.total) * 100 : 0
  stats.threeBetSuccess = stats.threeBets > 0 ? (stats.threeBetWins / stats.threeBets) * 100 : 0
  stats.cBetSuccess = stats.cBets > 0 ? (stats.cBetWins / stats.cBets) * 100 : 0
  stats.avgPotSizeWon = stats.wins > 0 ? stats.totalPotWon / stats.wins : 0

  return stats
}

// Initial data load
onMounted(async () => {
  if (isAuthorized.value) {
    await refreshData()
  }
})
</script>

<style scoped>
.admin-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.unauthorized {
  text-align: center;
  padding: 4rem 2rem;
}

.unauthorized h1 {
  color: #ff4e4e;
  margin-bottom: 1rem;
}

.back-link {
  display: inline-block;
  margin-top: 2rem;
  padding: 0.8rem 1.5rem;
  background-color: var(--primary-color);
  color: white;
  text-decoration: none;
  border-radius: 4px;
}

.admin-content h1 {
  margin-bottom: 2rem;
  color: #2d3748;
}

.admin-sections {
  display: grid;
  gap: 2rem;
}

.admin-section {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.admin-section h2 {
  margin-bottom: 1.5rem;
  color: #2d3748;
  font-weight: 600;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.stat-item {
  padding: 1.5rem;
  background: #f8fafc;
  border-radius: 8px;
  text-align: center;
}

.stat-item h3 {
  color: #64748b;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: #2d3748;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.chart-container {
  background: #f8fafc;
  padding: 1rem;
  border-radius: 8px;
}

.chart-container h3 {
  margin-bottom: 1rem;
  color: #64748b;
  font-size: 0.875rem;
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.refresh-btn {
  padding: 0.5rem 1rem;
  background-color: #3b82f6;
  color: white;
  border-radius: 4px;
  font-size: 0.875rem;
  transition: background-color 0.2s;
}

.refresh-btn:hover {
  background-color: #2563eb;
}

.refresh-btn:disabled {
  background-color: #93c5fd;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
}

.stats-tabs {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.tab-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  background: white;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.street-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.position-card {
  background: #f8fafc;
  padding: 1rem;
  border-radius: 0.5rem;
  border: 1px solid #e2e8f0;
}

.position-card h3 {
  color: #2d3748;
  font-weight: 600;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.stat-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  color: #4a5568;
  font-size: 0.875rem;
}

.stat-row span:last-child {
  font-weight: 500;
}

.export-btn {
  padding: 0.5rem 1rem;
  background-color: #10b981;
  color: white;
  border-radius: 4px;
  font-size: 0.875rem;
  transition: background-color 0.2s;
  margin-left: 1rem;
}

.export-btn:hover {
  background-color: #059669;
}

.export-btn:disabled {
  background-color: #6ee7b7;
  cursor: not-allowed;
}
</style> 