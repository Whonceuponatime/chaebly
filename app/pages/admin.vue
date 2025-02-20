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
      
      <!-- Basic Stats Overview -->
      <section class="admin-section mb-8">
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

      <!-- Auto-refresh controls -->
      <div class="flex items-center gap-2 mb-4">
            <button 
          @click="refreshData" 
          class="refresh-btn"
              :disabled="loading"
            >
          Refresh Data
            </button>
        <div class="flex items-center gap-2">
          <label class="text-sm text-gray-600">Auto-refresh:</label>
          <input
            type="checkbox"
            v-model="isAutoRefreshEnabled"
            @change="isAutoRefreshEnabled ? startAutoRefresh() : stopAutoRefresh()"
            class="form-checkbox h-4 w-4 text-blue-600"
          >
        </div>
      </div>

      <!-- Recent Games Table -->
      <section class="admin-section">
        <div class="header-actions">
          <div class="flex items-center gap-2">
            <h2>Hand History</h2>
            <button 
              @click="isDebugMode = !isDebugMode"
              class="debug-btn"
              :class="{ 'active': isDebugMode }"
            >
              {{ isDebugMode ? 'Hide Debug' : 'Show Debug' }}
            </button>
          </div>
              </div>

        <!-- Debug Information -->
        <div v-if="isDebugMode" class="debug-section mb-4">
          <div v-for="game in mendezGames.slice(0, 5)" :key="game.id" class="debug-card">
            <div class="debug-header">
              <h4>Hand ID: {{ game.hand_id }}</h4>
              <span class="text-xs text-gray-500">{{ formatDate(game.created_at) }}</span>
            </div>
            
            <!-- Request Payload -->
            <div class="debug-content">
              <h5>Request Payload</h5>
              <pre class="debug-pre">{{ formatDebugData({
                handId: game.hand_id,
                street: game.street,
                heroPosition: game.hero_position,
                heroCards: game.hero_cards,
                boardCards: game.board_cards,
                potSize: game.pot_size_bb,
                toCall: game.to_call_bb,
                currentBet: game.current_bet_bb,
                actionHistory: game.action_history,
                effectiveStack: game.effective_stack,
                positions: game.positions
              }) }}</pre>
            </div>

            <!-- Board Analysis -->
            <div v-if="game.street !== 'preflop'" class="debug-content">
              <h5>Board Analysis</h5>
              <div class="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span class="font-medium">Board:</span>
                  <span class="font-mono">{{ game.board_cards }}</span>
                </div>
                <div>
                  <span class="font-medium">Texture:</span>
                  <span>{{ getBoardTexture(game.board_cards || '') }}</span>
                </div>
                <div>
                  <span class="font-medium">Draws:</span>
                  <span>{{ getPossibleDraws(game.board_cards || '') }}</span>
          </div>
                <div>
                  <span class="font-medium">Hero Equity:</span>
                  <span>{{ getHeroEquity(game.hero_cards, game.board_cards || '') }}%</span>
              </div>
              </div>
            </div>

            <!-- Position & Stack Analysis -->
            <div class="debug-content">
              <h5>Position & Stack Analysis</h5>
              <div class="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span class="font-medium">Hero Position:</span>
                  <span>{{ game.hero_position }}</span>
                </div>
                <div>
                  <span class="font-medium">Effective Stack:</span>
                  <span>{{ game.effective_stack }}BB</span>
                </div>
                <div>
                  <span class="font-medium">SPR:</span>
                  <span>{{ calculateSPR(game) }}</span>
          </div>
                <div>
                  <span class="font-medium">Position Type:</span>
                  <span>{{ getPositionType(game) }}</span>
                </div>
              </div>
            </div>

            <!-- Action History -->
            <div class="debug-content">
              <h5>Action History</h5>
              <div class="space-y-1 text-sm">
                <div v-for="(action, index) in game.action_history" :key="index" 
                     class="flex justify-between items-center py-1 border-b border-gray-200 last:border-0">
                  <span>
                    <span class="font-medium">{{ action.player }}</span>
                    <span class="text-gray-500">({{ game.positions?.[action.player] || '?' }})</span>
                  </span>
                  <span>
                    <span class="capitalize">{{ action.action }}</span>
                    <span v-if="action.amount > 0" class="text-blue-600">{{ action.amount }}BB</span>
                  </span>
          </div>
              </div>
            </div>

            <!-- GPT Response -->
            <div class="debug-content">
              <h5>GPT Response</h5>
              <pre class="debug-pre">{{ formatDebugData({
                decision: game.gpt_decision,
                reasoning: game.decision_reasoning,
                confidence: getConfidenceLevel(game)
              }) }}</pre>
            </div>

            <!-- Performance Metrics -->
            <div class="debug-content">
              <h5>Performance Metrics</h5>
              <div class="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span class="font-medium">API Latency:</span>
                  <span>{{ getApiLatency(game) }}ms</span>
                </div>
                <div>
                  <span class="font-medium">Token Count:</span>
                  <span>{{ estimateTokenCount(game) }}</span>
                </div>
                <div>
                  <span class="font-medium">Model:</span>
                  <span>gpt-4o</span>
                </div>
                <div>
                  <span class="font-medium">Status:</span>
                  <span :class="getStatusClass(game)">{{ getRequestStatus(game) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Street</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hand</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Board</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action History</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Effective Stack</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pot Size</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">To Call</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">GPT</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reasoning</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Final</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Result</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="game in mendezGames" :key="game.id">
                <td class="px-6 py-4 whitespace-nowrap text-sm capitalize">{{ game.street }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">{{ game.hero_position }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-mono">{{ game.hero_cards }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-mono">{{ game.board_cards || '-' }}</td>
                <td class="px-6 py-4 text-sm">
                  <div v-if="game.action_history" class="space-y-1">
                    <div v-for="(action, index) in game.action_history" :key="index" class="text-xs">
                      {{ formatAction(action) }}
                    </div>
                  </div>
                  <div v-else class="text-xs text-gray-500">No history</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">{{ game.effective_stack }}BB</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">{{ game.pot_size_bb }}BB</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">{{ game.to_call_bb }}BB</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">{{ game.gpt_decision }}</td>
                <td class="px-6 py-4 text-sm max-w-md">{{ game.decision_reasoning || '-' }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">{{ game.final_action || '-' }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm" 
                    :class="game.final_action === 'fold' ? 'text-red-600' : game.pot_size_bb > 0 ? 'text-green-600' : 'text-red-600'">
                  {{ game.final_action === 'fold' ? 'Fold' : game.pot_size_bb > 0 ? 'Win' : 'Loss' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Player History -->
      <section class="admin-section mt-8">
        <div class="header-actions">
          <div class="flex items-center gap-2">
            <h2>Player History</h2>
            <button 
              @click="isPlayerHistoryExpanded = !isPlayerHistoryExpanded"
              class="expand-btn"
              :aria-label="isPlayerHistoryExpanded ? 'Collapse player history' : 'Expand player history'"
            >
              {{ isPlayerHistoryExpanded ? '▼' : '▶' }}
            </button>
          </div>
        </div>
        <Transition name="expand">
          <div v-show="isPlayerHistoryExpanded" class="overflow-x-auto">
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
        </Transition>
        </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSupabaseClient } from '#imports'
import { useAuth } from '../composables/useAuth'
import type { Database } from '../../types/supabase.types'

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
  gpt_decision?: string | null
  final_action?: string
  last_action?: string
  last_bet_size_bb?: number
  decision_reasoning?: string
  action_history?: any[]
  effective_stack?: number
  active_players?: string[]
  action_on?: string
  players?: string[]
  positions?: Record<string, string>
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

const { user } = useAuth()
const supabase = useSupabaseClient<Database>()
const router = useRouter()
const loading = ref(false)
const error = ref<string | null>(null)
const mendezGames = ref<MendezGame[]>([])
const playerHistories = ref<PlayerHistory[]>([])
const isPlayerHistoryExpanded = ref(false)

const totalProfit = computed(() => {
  return mendezGames.value.reduce((sum, game) => sum + game.pot_size_bb, 0)
})

const winRate = computed(() => {
  const completedGames = mendezGames.value.filter(game => game.final_action)
  if (completedGames.length === 0) return '0'
  const wins = completedGames.filter(game => game.pot_size_bb > 0).length
  return ((wins / completedGames.length) * 100).toFixed(1)
})

const isAuthorized = computed(() => {
  return user.value?.email === 'taebaek@gmail.com'
})

watchEffect(() => {
  if (user.value && !isAuthorized.value) {
    router.push('/')
  }
})

const refreshMendezGames = async () => {
  loading.value = true
  error.value = null
  try {
    const { data, error: dbError } = await supabase
      .from('mendez_games')
      .select('*')
      .order('created_at', { ascending: false })

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

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString()
}

const formatPercentage = (value: number) => {
  return `${value.toFixed(1)}%`
}

const formatNumber = (value: number) => {
  return value.toFixed(2)
}

const autoRefreshInterval = ref<NodeJS.Timeout | null>(null)
const isAutoRefreshEnabled = ref(false)

function startAutoRefresh(intervalMs = 5000) {
  if (autoRefreshInterval.value) {
    clearInterval(autoRefreshInterval.value)
  }
  autoRefreshInterval.value = setInterval(async () => {
    if (!loading.value) {
      await refreshData()
    }
  }, intervalMs)
}

function stopAutoRefresh() {
  if (autoRefreshInterval.value) {
    clearInterval(autoRefreshInterval.value)
    autoRefreshInterval.value = null
  }
}

watch(loading, (newValue) => {
  if (newValue) {
    stopAutoRefresh()
  } else if (isAutoRefreshEnabled.value) {
    startAutoRefresh()
  }
})

onMounted(async () => {
  if (isAuthorized.value) {
    await refreshData()
    
    const gamesSubscription = supabase
      .channel('games_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mendez_games'
        },
        async () => {
          await refreshMendezGames()
        }
      )
      .subscribe()

    const playerHistorySubscription = supabase
      .channel('player_history_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mendez_player_history'
        },
        async () => {
          await refreshPlayerHistories()
        }
      )
      .subscribe()

    onUnmounted(() => {
      gamesSubscription.unsubscribe()
      playerHistorySubscription.unsubscribe()
      stopAutoRefresh()
    })
  }
})

function formatAction(action: any): string {
  if (!action) return ''
  const position = action.position ? `[${action.position}] ` : ''
  const amount = action.amount ? ` ${action.amount}BB` : ''
  return `${position}${action.player}: ${action.action}${amount}`
}

// Add new refs for debug mode
const isDebugMode = ref(false)

// Add new helper functions for debug data
function formatDebugData(data: any): string {
  return JSON.stringify(data, null, 2)
}

function getConfidenceLevel(game: MendezGame): string {
  if (!game.gpt_decision) return 'low'
  if (game.decision_reasoning?.includes('high confidence')) return 'high'
  if (game.decision_reasoning?.includes('medium confidence')) return 'medium'
  return 'medium'
}

function getApiLatency(game: MendezGame): number {
  // Simulate API latency based on created_at timestamp
  // In a real implementation, you would track actual API latency
  return Math.floor(Math.random() * 500 + 500)
}

function estimateTokenCount(game: MendezGame): number {
  // Estimate token count based on content length
  // In a real implementation, you would track actual token usage
  const content = JSON.stringify({
    prompt: game.decision_reasoning,
    response: game.gpt_decision
  })
  return Math.floor(content.length / 4)
}

function getRequestStatus(game: MendezGame): string {
  if (!game.gpt_decision) return 'Failed'
  if (!game.decision_reasoning) return 'Partial'
  return 'Success'
}

function getStatusClass(game: MendezGame): string {
  const status = getRequestStatus(game)
  return {
    'Failed': 'text-red-600',
    'Partial': 'text-yellow-600',
    'Success': 'text-green-600'
  }[status] || ''
}

// Add new helper functions for board analysis
function getBoardTexture(board: string): string {
  if (!board) return 'N/A'
  const ranks = board.match(/[2-9TJQKA]/g) || []
  const suits = board.match(/[cdhs]/g) || []
  
  const isMonotone = new Set(suits).size === 1
  const hasFlushDraw = new Set(suits).size === 2
  const hasPair = new Set(ranks).size < ranks.length
  const isConnected = isConnectedBoard(ranks)
  
  if (isMonotone) return 'Monotone'
  if (hasFlushDraw && isConnected) return 'Very Wet'
  if (hasFlushDraw || isConnected) return 'Wet'
  if (hasPair) return 'Paired'
  return 'Dry'
}

function getPossibleDraws(board: string): string {
  if (!board) return 'N/A'
  const draws = []
  const ranks = board.match(/[2-9TJQKA]/g) || []
  const suits = board.match(/[cdhs]/g) || []
  
  if (new Set(suits).size === 2) draws.push('Flush Draw')
  if (isConnectedBoard(ranks)) draws.push('Straight Draw')
  
  return draws.length ? draws.join(', ') : 'None'
}

function getHeroEquity(heroCards: string, board: string): string {
  // This would normally be calculated using a poker equity calculator
  // For now, return a simplified estimation
  return '25-30'
}

function isConnectedBoard(ranks: string[]): boolean {
  const rankOrder = '23456789TJQKA'
  const values = ranks.map(r => rankOrder.indexOf(r)).sort((a, b) => a - b)
  return values[values.length - 1] - values[0] <= 4
}

function calculateSPR(game: MendezGame): string {
  if (!game.effective_stack || !game.pot_size_bb || game.pot_size_bb === 0) return 'N/A'
  return (game.effective_stack / game.pot_size_bb).toFixed(1)
}

function getPositionType(game: MendezGame): string {
  const ipPositions = ['BTN', 'CO']
  const heroPos = game.hero_position
  const positions = game.positions || {}
  const activePositions = game.active_players?.map(p => positions[p]).filter(Boolean) || []
  
  if (ipPositions.includes(heroPos)) return 'In Position'
  if (heroPos === 'BB') return 'Out of Position'
  
  // Check if we're last to act among active players
  const laterPositions = ipPositions.filter(pos => activePositions.includes(pos))
  return laterPositions.length === 0 ? 'In Position' : 'Out of Position'
}
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

.admin-section {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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

.expand-btn {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
  color: #64748b;
  background: transparent;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease-in-out;
  max-height: 1000px;
  opacity: 1;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
}

.debug-btn {
  @apply px-2 py-1 text-xs rounded border border-gray-300 hover:bg-gray-100;
}

.debug-btn.active {
  @apply bg-blue-100 border-blue-300 text-blue-700;
}

.debug-section {
  @apply space-y-4;
}

.debug-card {
  @apply bg-gray-50 rounded-lg p-4 space-y-4;
}

.debug-header {
  @apply flex justify-between items-center border-b pb-2;
}

.debug-content {
  @apply space-y-2;
}

.debug-content h5 {
  @apply text-sm font-medium text-gray-700;
}

.debug-pre {
  @apply bg-gray-100 p-2 rounded text-xs font-mono overflow-x-auto max-h-40 overflow-y-auto whitespace-pre-wrap break-all;
}

.debug-pre::-webkit-scrollbar {
  @apply w-2 h-2;
}

.debug-pre::-webkit-scrollbar-track {
  @apply bg-gray-100 rounded;
}

.debug-pre::-webkit-scrollbar-thumb {
  @apply bg-gray-300 rounded hover:bg-gray-400;
}
</style> 