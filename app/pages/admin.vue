<template>
  <div class="admin-page">
    <div v-if="!isAuthorized" class="unauthorized">
      <h1>접근 권한이 없습니다</h1>
      <p>이 페이지는 관리자만 접근할 수 있습니다.</p>
      <NuxtLink to="/" class="back-link">홈으로 돌아가기</NuxtLink>
    </div>

    <div v-else class="admin-content">
      <h1>관리자 페이지</h1>
      
      <div class="admin-sections">
        <!-- Database Status -->
        <section class="admin-section">
          <h2>데이터베이스 상태</h2>
          <div class="status-grid">
            <div class="status-item">
              <h3>Products</h3>
              <p>{{ products.length }} items</p>
              <button @click="refreshProducts" :disabled="loading">
                새로고침
              </button>
            </div>
            <div class="status-item">
              <h3>Wishlist Items</h3>
              <p>{{ wishlistCount }} items</p>
              <button @click="refreshWishlist" :disabled="loading">
                새로고침
              </button>
            </div>
          </div>
        </section>

        <!-- Database Management -->
        <section class="admin-section">
          <h2>데이터베이스 관리</h2>
          <div class="action-buttons">
            <button 
              @click="resetDatabase" 
              :disabled="loading"
              class="danger-btn"
            >
              데이터베이스 초기화
            </button>
            <button 
              @click="reinsertSampleData" 
              :disabled="loading"
              class="primary-btn"
            >
              샘플 데이터 재생성
            </button>
          </div>
        </section>

        <!-- User Management -->
        <section class="admin-section">
          <h2>사용자 관리</h2>
          <div class="user-list">
            <div v-for="user in users" :key="user.id" class="user-item">
              <div class="user-info">
                <p class="email">{{ user.email }}</p>
                <p class="created-at">가입일: {{ formatDate(user.created_at) }}</p>
              </div>
              <div class="user-actions">
                <button 
                  @click="resetUserPassword(user.id)"
                  :disabled="loading"
                  class="secondary-btn"
                >
                  비밀번호 초기화
                </button>
                <button 
                  @click="deleteUser(user.id)"
                  :disabled="loading"
                  class="danger-btn"
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- Mendez Poker Bot -->
        <section class="admin-section">
          <h2>Mendez Poker Bot Control Panel</h2>
          
          <!-- Bot Status -->
          <div class="bot-status">
            <div class="status-item">
              <h3>Bot Status</h3>
              <p :class="botEnabled ? 'status-active' : 'status-inactive'">
                {{ botEnabled ? 'Active' : 'Inactive' }}
              </p>
              <button 
                @click="toggleBot" 
                :class="botEnabled ? 'danger-btn' : 'primary-btn'"
              >
                {{ botEnabled ? 'Disable Bot' : 'Enable Bot' }}
              </button>
            </div>
          </div>

          <!-- Integration Status -->
          <div class="integration-status">
            <div class="status-grid">
              <div class="status-item">
                <h3>Flopzilla Status</h3>
                <p :class="flopzillaConnected ? 'status-active' : 'status-inactive'">
                  {{ flopzillaConnected ? 'Connected' : 'Disconnected' }}
                </p>
                <button @click="testFlopzillaConnection" :disabled="loading">
                  Test Connection
                </button>
              </div>
              <div class="status-item">
                <h3>OpenAI Status</h3>
                <p :class="openAIConnected ? 'status-active' : 'status-inactive'">
                  {{ openAIConnected ? 'Connected' : 'Disconnected' }}
                </p>
                <button @click="testOpenAIConnection" :disabled="loading">
                  Test Connection
                </button>
              </div>
            </div>
          </div>

          <!-- Player Tracking -->
          <div class="player-tracking">
            <h3>Player Statistics</h3>
            <div class="player-list">
              <div v-for="player in trackedPlayers" :key="player.name" class="player-item">
                <div class="player-info">
                  <p class="name">{{ player.name }}</p>
                  <p class="style">Style: {{ player.style }}</p>
                  <p class="stats">
                    Aggressive: {{ player.aggressive }}% | 
                    Passive: {{ player.passive }}%
                  </p>
                </div>
                <button @click="resetPlayerStats(player.name)" class="secondary-btn">
                  Reset Stats
                </button>
              </div>
            </div>
          </div>

          <!-- Current Game State -->
          <div class="game-state">
            <h3>Current Game State</h3>
            <div class="state-info">
              <p><strong>Current Hand:</strong> {{ gameState.currentHand || 'No active hand' }}</p>
              <p><strong>Last Action:</strong> {{ gameState.lastAction || 'None' }}</p>
              <p><strong>Suggested Move:</strong> {{ gameState.suggestedMove || 'Waiting...' }}</p>
              <p><strong>AI Adaptation:</strong> {{ gameState.aiSuggestion || 'Waiting...' }}</p>
              <div v-if="aiError" class="error-message">
                {{ aiError }}
              </div>
            </div>
            <!-- Test Controls -->
            <div class="test-controls">
              <button 
                @click="updateGameState('AKs')" 
                :disabled="!openAIConnected || loading"
                class="primary-btn"
              >
                Test with AKs
              </button>
              <button 
                @click="updateGameState('JTs')" 
                :disabled="!openAIConnected || loading"
                class="primary-btn"
              >
                Test with JTs
              </button>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="action-buttons">
            <button 
              @click="clearGameState" 
              :disabled="loading"
              class="danger-btn"
            >
              Clear Game State
            </button>
            <button 
              @click="exportPlayerData" 
              :disabled="loading"
              class="primary-btn"
            >
              Export Player Data
            </button>
          </div>
        </section>

        <!-- Mendez Statistics -->
        <section class="admin-section">
          <h2>Mendez Statistics Dashboard</h2>
          
          <!-- Overall Stats -->
          <div class="stats-grid">
            <div v-for="stat in detailedStats" :key="stat.id" class="stats-card">
              <h3>{{ stat.name }}</h3>
              <div class="stats-content">
                <!-- Win Rate Chart -->
                <div class="chart-wrapper">
                  <WinRateChart
                    :btn-win-rate="stat.btn_win_rate"
                    :sb-win-rate="stat.sb_win_rate"
                    :bb-win-rate="stat.bb_win_rate"
                  />
                </div>
                
                <!-- Betting Stats Chart -->
                <div class="chart-wrapper">
                  <BettingStatsChart
                    :vpip-percentage="stat.vpip_percentage"
                    :pfr-percentage="stat.pfr_percentage"
                    :three-bet-percentage="stat.three_bet_percentage"
                    :cbet-percentage="stat.cbet_percentage"
                    :cbet-success-rate="stat.cbet_success_rate"
                    :fold-to-cbet-percentage="stat.fold_to_cbet_percentage"
                  />
                </div>

                <!-- Profit Trend -->
                <div class="chart-wrapper">
                  <ProfitTrendChart
                    v-if="profitTrends[stat.id]"
                    :profit-data="profitTrends[stat.id]"
                  />
                </div>

                <!-- Key Metrics -->
                <div class="metrics-grid">
                  <div class="metric-item">
                    <span class="metric-label">Total Profit</span>
                    <span class="metric-value">${{ stat.total_profit.toLocaleString() }}</span>
                  </div>
                  <div class="metric-item">
                    <span class="metric-label">Avg. Profit/Hand</span>
                    <span class="metric-value">${{ stat.avg_profit_per_hand.toFixed(2) }}</span>
                  </div>
                  <div class="metric-item">
                    <span class="metric-label">Flopzilla Accuracy</span>
                    <span class="metric-value">{{ stat.flopzilla_accuracy.toFixed(1) }}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="action-buttons">
            <button 
              @click="refreshStats" 
              :disabled="loading"
              class="primary-btn"
            >
              Refresh Statistics
            </button>
            <button 
              @click="exportStats" 
              :disabled="loading"
              class="secondary-btn"
            >
              Export Data
            </button>
          </div>
        </section>

        <!-- System Info -->
        <section class="admin-section">
          <h2>시스템 정보</h2>
          <div class="system-info">
            <p><strong>Supabase URL:</strong> {{ supabaseUrl }}</p>
            <p><strong>Environment:</strong> {{ environment }}</p>
            <p><strong>Version:</strong> {{ version }}</p>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSupabaseClient } from '#imports'
import { useAuth } from '../composables/useAuth'
import { useProducts } from '../composables/useProducts'
import { useWishlist } from '../composables/useWishlist'
import { useMendezAI } from '../composables/useMendezAI'
import { useMendezStats } from '../composables/useMendezStats'
import type { PlayerProfile, User, Product, GameState } from '../../types/mendez.types'
import type { Database } from '../../types/supabase.types'
import WinRateChart from '../components/charts/WinRateChart.vue'
import BettingStatsChart from '../components/charts/BettingStatsChart.vue'
import ProfitTrendChart from '../components/charts/ProfitTrendChart.vue'

const { user } = useAuth()
const supabase = useSupabaseClient<Database>()
const router = useRouter()
const loading = ref(false)
const { products } = useProducts()
const { items: wishlistItems } = useWishlist()

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

// System info
const supabaseUrl = process.env.SUPABASE_URL || 'Not configured'
const environment = process.env.NODE_ENV
const version = '1.0.0'

// Database stats
const wishlistCount = computed(() => wishlistItems.value.length)
const users = ref<User[]>([])

// Mendez bot state
const botEnabled = ref(false)
const flopzillaConnected = ref(false)
const openAIConnected = ref(false)
const gameState = ref<GameState>({
  currentHand: null,
  position: 'Button',
  stackSize: 100,
  potSize: 3,
  lastAction: null,
  suggestedMove: null,
  aiSuggestion: null
})

const trackedPlayers = ref<PlayerProfile[]>([
  {
    name: 'Player1',
    style: 'Aggressive',
    aggressive: 65,
    passive: 35,
    totalHands: 100,
    recentActions: ['raise', 'raise', 'call', 'fold']
  },
  {
    name: 'Player2',
    style: 'Passive',
    aggressive: 25,
    passive: 75,
    totalHands: 85,
    recentActions: ['call', 'fold', 'call', 'check']
  }
])

// Initialize Mendez AI
const { 
  analyzeOpponent, 
  suggestHandStrategy, 
  validateConnection,
  loading: aiLoading,
  error: aiError 
} = useMendezAI()

// Initialize Mendez Stats
const { 
  detailedStats,
  loading: statsLoading,
  error: statsError,
  fetchDetailedStats,
  getProfitTrend
} = useMendezStats()

const profitTrends = ref<Record<string, any>>({})

// Fetch initial data
onMounted(async () => {
  if (isAuthorized.value) {
    await Promise.all([
      fetchUsers(),
      fetchDetailedStats()
    ])
    await loadProfitTrends()
  }
})

// Database management functions
const resetDatabase = async () => {
  if (!confirm('정말 데이터베이스를 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return
  
  loading.value = true
  try {
    await supabase.from('wishlist_items').delete().neq('id', 0)
    await supabase.from('products').delete().neq('id', 0)
    await refreshData()
  } catch (error) {
    console.error('Error resetting database:', error)
  } finally {
    loading.value = false
  }
}

const reinsertSampleData = async () => {
  loading.value = true
  try {
    const productsToInsert = products.map(p => ({
      name: p.name,
      brand: p.brand,
      price: p.price,
      image: p.image,
      category: p.category,
      tags: p.tags,
      popularity: p.popularity
    }))

    const { error } = await supabase
      .from('products')
      .insert(productsToInsert)
    if (error) throw error
    await refreshData()
  } catch (error) {
    console.error('Error inserting sample data:', error)
  } finally {
    loading.value = false
  }
}

// User management functions
const fetchUsers = async () => {
  try {
    const { data, error } = await supabase.auth.admin.listUsers()
    if (error) throw error
    users.value = data.users as User[]
  } catch (error) {
    console.error('Error fetching users:', error)
  }
}

const resetUserPassword = async (userId: string) => {
  loading.value = true
  try {
    console.log('Reset password for user:', userId)
  } catch (error) {
    console.error('Error resetting password:', error)
  } finally {
    loading.value = false
  }
}

const deleteUser = async (userId: string) => {
  if (!confirm('정말 이 사용자를 삭제하시겠습니까?')) return

  loading.value = true
  try {
    const { error } = await supabase.auth.admin.deleteUser(userId)
    if (error) throw error
    await fetchUsers()
  } catch (error) {
    console.error('Error deleting user:', error)
  } finally {
    loading.value = false
  }
}

// Refresh functions
const refreshProducts = async () => {
  loading.value = true
  try {
    const { data, error } = await supabase.from('products').select('*')
    if (error) throw error
    console.log('Products refreshed:', data)
  } catch (error) {
    console.error('Error refreshing products:', error)
  } finally {
    loading.value = false
  }
}

const refreshWishlist = async () => {
  loading.value = true
  try {
    const { data, error } = await supabase.from('wishlist_items').select('*')
    if (error) throw error
    console.log('Wishlist refreshed:', data)
  } catch (error) {
    console.error('Error refreshing wishlist:', error)
  } finally {
    loading.value = false
  }
}

const refreshData = async () => {
  await Promise.all([
    refreshProducts(),
    refreshWishlist(),
    fetchUsers()
  ])
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Mendez bot functions
const toggleBot = () => {
  botEnabled.value = !botEnabled.value
}

const testFlopzillaConnection = async () => {
  loading.value = true
  try {
    // TODO: Implement actual Flopzilla connection test
    flopzillaConnected.value = true
  } catch (error) {
    console.error('Error connecting to Flopzilla:', error)
    flopzillaConnected.value = false
  } finally {
    loading.value = false
  }
}

const testOpenAIConnection = async () => {
  loading.value = true
  try {
    openAIConnected.value = await validateConnection()
  } catch (error) {
    console.error('Error connecting to OpenAI:', error)
    openAIConnected.value = false
  } finally {
    loading.value = false
  }
}

const resetPlayerStats = async (playerName: string) => {
  const playerIndex = trackedPlayers.value.findIndex(p => p.name === playerName)
  if (playerIndex !== -1 && trackedPlayers.value[playerIndex]) {
    const currentPlayer = trackedPlayers.value[playerIndex]
    if (currentPlayer) {
      trackedPlayers.value[playerIndex] = {
        name: currentPlayer.name,
        style: currentPlayer.style,
        aggressive: 50,
        passive: 50,
        totalHands: 0,
        recentActions: []
      }
    }
  }
}

const updateGameState = async (
  hand: string, 
  position: string = 'Button', 
  stackSize: number = 100,
  potSize: number = 3
) => {
  if (!openAIConnected.value) {
    console.error('OpenAI not connected')
    return
  }

  gameState.value.currentHand = hand
  gameState.value.position = position
  gameState.value.stackSize = stackSize
  gameState.value.potSize = potSize
  
  // Get current opponent
  const opponent = trackedPlayers.value[0]
  if (!opponent) return
  
  // Get AI suggestion for opponent adaptation
  const analysis = await analyzeOpponent(opponent)
  if (analysis) {
    gameState.value.aiSuggestion = analysis
  }
  
  // Get hand strategy
  const strategy = await suggestHandStrategy(
    hand,
    position,
    opponent.style,
    stackSize,
    potSize
  )
  if (strategy) {
    gameState.value.suggestedMove = strategy
  }
}

const clearGameState = () => {
  gameState.value = {
    currentHand: null,
    position: 'Button',
    stackSize: 100,
    potSize: 3,
    lastAction: null,
    suggestedMove: null,
    aiSuggestion: null
  }
}

const exportPlayerData = () => {
  const data = JSON.stringify(trackedPlayers.value, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'mendez-player-data.json'
  a.click()
  URL.revokeObjectURL(url)
}

const refreshStats = async () => {
  await fetchDetailedStats()
  await loadProfitTrends()
}

const loadProfitTrends = async () => {
  for (const stat of detailedStats.value) {
    const trend = await getProfitTrend(stat.id)
    if (trend) {
      profitTrends.value[stat.id] = trend
    }
  }
}

const exportStats = () => {
  const data = {
    detailedStats: detailedStats.value,
    profitTrends: profitTrends.value
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'mendez-statistics.json'
  a.click()
  URL.revokeObjectURL(url)
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
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-color);
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.status-item {
  padding: 1rem;
  background: #f8f8f8;
  border-radius: 4px;
}

.status-item h3 {
  margin-bottom: 0.5rem;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

button {
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-family: 'Noto Sans KR', sans-serif;
  font-weight: 500;
}

button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.primary-btn {
  background-color: var(--primary-color);
  color: white;
}

.secondary-btn {
  background-color: #4e7fff;
  color: white;
}

.danger-btn {
  background-color: #ff4e4e;
  color: white;
}

.user-list {
  display: grid;
  gap: 1rem;
}

.user-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f8f8f8;
  border-radius: 4px;
}

.user-info .email {
  font-weight: 500;
  margin-bottom: 0.3rem;
}

.user-info .created-at {
  font-size: 0.9rem;
  color: #666;
}

.user-actions {
  display: flex;
  gap: 0.5rem;
}

.system-info {
  background: #f8f8f8;
  padding: 1rem;
  border-radius: 4px;
}

.system-info p {
  margin-bottom: 0.5rem;
}

@media (max-width: 768px) {
  .user-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .user-actions {
    width: 100%;
    justify-content: flex-end;
  }
}

@media (max-width: 480px) {
  .action-buttons {
    flex-direction: column;
  }

  .user-actions {
    flex-direction: column;
    width: 100%;
  }

  .user-actions button {
    width: 100%;
  }
}

.bot-status {
  margin-bottom: 2rem;
}

.status-active {
  color: #4CAF50;
  font-weight: bold;
}

.status-inactive {
  color: #f44336;
  font-weight: bold;
}

.integration-status {
  margin-bottom: 2rem;
}

.player-tracking {
  margin-bottom: 2rem;
}

.player-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.player-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f5f5f5;
  border-radius: 4px;
}

.game-state {
  margin-bottom: 2rem;
  padding: 1rem;
  background: #f5f5f5;
  border-radius: 4px;
}

.state-info {
  display: grid;
  gap: 0.5rem;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.error-message {
  color: #f44336;
  margin-top: 0.5rem;
  font-size: 0.9rem;
}

.test-controls {
  margin-top: 1rem;
  display: flex;
  gap: 0.5rem;
}

.loading {
  opacity: 0.7;
  pointer-events: none;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
}

.stats-card {
  background: #f8f8f8;
  border-radius: 8px;
  padding: 1.5rem;
}

.stats-content {
  display: grid;
  gap: 1.5rem;
}

.chart-wrapper {
  background: white;
  padding: 1rem;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.metric-item {
  background: white;
  padding: 1rem;
  border-radius: 4px;
  text-align: center;
}

.metric-label {
  display: block;
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 0.5rem;
}

.metric-value {
  display: block;
  font-size: 1.2rem;
  font-weight: 500;
  color: var(--primary-color);
}
</style> 