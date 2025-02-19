<template>
  <div class="mendez-history">
    <div class="header-actions">
      <h2>Mendez Hand History</h2>
      <div class="flex gap-2">
        <button 
          @click="refreshData" 
          class="refresh-btn"
          :disabled="loading"
        >
          Refresh Data
        </button>
        <button 
          @click="exportData" 
          class="export-btn"
          :disabled="loading"
        >
          Export Data
        </button>
      </div>
    </div>

    <!-- Statistics Overview -->
    <div class="stats-grid mb-6">
      <div class="stat-card">
        <h3>Total Hands</h3>
        <p class="stat-value">{{ totalHands }}</p>
      </div>
      <div class="stat-card">
        <h3>Win Rate</h3>
        <p class="stat-value">{{ winRate }}%</p>
      </div>
      <div class="stat-card">
        <h3>GPT Agreement</h3>
        <p class="stat-value">{{ gptAgreementRate }}%</p>
      </div>
      <div class="stat-card">
        <h3>Average Pot Size</h3>
        <p class="stat-value">{{ avgPotSize }}BB</p>
      </div>
    </div>

    <!-- Street Distribution Chart -->
    <div class="charts-grid mb-6">
      <div class="chart-container">
        <h3>Decisions by Street</h3>
        <DoughnutChart 
          :data="streetDistributionData"
          :options="{
            plugins: {
              legend: { position: 'bottom' }
            }
          }"
        />
      </div>
      <div class="chart-container">
        <h3>Action Distribution</h3>
        <DoughnutChart 
          :data="actionDistributionData"
          :options="{
            plugins: {
              legend: { position: 'bottom' }
            }
          }"
        />
      </div>
    </div>

    <!-- Position Stats -->
    <div class="position-stats mb-6">
      <h3 class="mb-4">Position Statistics</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="position in positions" :key="position" class="position-card">
          <h4>{{ position }}</h4>
          <div class="stats">
            <div class="stat-row">
              <span>Total Hands:</span>
              <span>{{ getPositionStats(position).total }}</span>
            </div>
            <div class="stat-row">
              <span>Win Rate:</span>
              <span>{{ getPositionStats(position).winRate }}%</span>
            </div>
            <div class="stat-row">
              <span>VPIP:</span>
              <span>{{ getPositionStats(position).vpip }}%</span>
            </div>
            <div class="stat-row">
              <span>PFR:</span>
              <span>{{ getPositionStats(position).pfr }}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Hand History Table -->
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Street</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hand</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Board</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">GPT Decision</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Confidence</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reasoning</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Final Action</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Result</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="hand in handHistory" :key="hand.id">
            <td class="px-6 py-4 whitespace-nowrap text-sm">{{ formatDate(hand.created_at) }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm capitalize">{{ hand.street }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">{{ hand.hero_position }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-mono">{{ hand.hero_cards }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-mono">{{ hand.board_cards || '-' }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm" :class="getDecisionClass(hand.gpt_decision)">
              {{ hand.gpt_decision || 'Failed' }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">
              {{ getConfidenceLevel(hand) }}
            </td>
            <td class="px-6 py-4 text-sm max-w-md overflow-hidden text-ellipsis">
              {{ hand.decision_reasoning || '-' }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">{{ hand.final_action || '-' }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm" :class="getResultClass(hand)">
              {{ getResultText(hand) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add GPT Performance Stats -->
    <div class="mt-8">
      <h3 class="text-lg font-semibold mb-4">GPT Performance Analysis</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white p-4 rounded-lg shadow">
          <h4 class="text-sm text-gray-600">Success Rate</h4>
          <p class="text-2xl font-bold">{{ gptSuccessRate }}%</p>
          <p class="text-xs text-gray-500">Successful decisions / Total decisions</p>
        </div>
        <div class="bg-white p-4 rounded-lg shadow">
          <h4 class="text-sm text-gray-600">Average Confidence</h4>
          <p class="text-2xl font-bold">{{ avgConfidence }}%</p>
          <p class="text-xs text-gray-500">Based on high/medium/low confidence ratings</p>
        </div>
        <div class="bg-white p-4 rounded-lg shadow">
          <h4 class="text-sm text-gray-600">Decision Distribution</h4>
          <p class="text-2xl font-bold">
            {{ gptDecisionDistribution.fold }}% / {{ gptDecisionDistribution.call }}% / {{ gptDecisionDistribution.raise }}%
          </p>
          <p class="text-xs text-gray-500">Fold / Call / Raise ratio</p>
        </div>
        <div class="bg-white p-4 rounded-lg shadow">
          <h4 class="text-sm text-gray-600">Error Rate</h4>
          <p class="text-2xl font-bold" :class="getErrorRateClass">{{ gptErrorRate }}%</p>
          <p class="text-xs text-gray-500">Failed decisions / Total decisions</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useSupabaseClient } from '#imports'
import type { Database } from '../../../types/database.types'
import DoughnutChart from '../charts/DoughnutChart.vue'

const supabase = useSupabaseClient<Database>()
const loading = ref(false)
const handHistory = ref<any[]>([])
const positions = ['BTN', 'CO', 'MP', 'UTG', 'SB', 'BB']

// Computed statistics
const totalHands = computed(() => handHistory.value.length)

const winRate = computed(() => {
  const completedHands = handHistory.value.filter(h => h.final_action)
  if (completedHands.length === 0) return '0'

  const wins = completedHands.filter(h => 
    h.final_action !== 'fold' && h.board_cards && h.pot_size_bb > 0
  ).length
  return ((wins / completedHands.length) * 100).toFixed(1)
})

const gptAgreementRate = computed(() => {
  const agreements = handHistory.value.filter(h => h.mendez_recommendation === h.gpt_decision).length
  return ((agreements / totalHands.value) * 100).toFixed(1)
})

const avgPotSize = computed(() => {
  const nonFoldHands = handHistory.value.filter(h => h.final_action !== 'fold')
  if (nonFoldHands.length === 0) return '0'
  
  const total = nonFoldHands.reduce((sum, h) => sum + h.pot_size_bb, 0)
  return (total / nonFoldHands.length).toFixed(1)
})

// Chart data
const streetDistributionData = computed(() => {
  const counts = handHistory.value.reduce((acc, h) => {
    acc[h.street] = (acc[h.street] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const labels = Object.keys(counts)
  const data = Object.values(counts)

  return {
    labels,
    datasets: [{
      label: 'Decisions by Street',
      data: data as number[],
      backgroundColor: [
        'rgba(255, 99, 132, 0.2)',
        'rgba(54, 162, 235, 0.2)',
        'rgba(255, 206, 86, 0.2)',
        'rgba(75, 192, 192, 0.2)'
      ],
      borderColor: [
        'rgba(255, 99, 132, 1)',
        'rgba(54, 162, 235, 1)',
        'rgba(255, 206, 86, 1)',
        'rgba(75, 192, 192, 1)'
      ],
      borderWidth: 1
    }]
  }
})

const actionDistributionData = computed(() => {
  const counts = handHistory.value.reduce((acc, h) => {
    const action = h.final_action || 'unknown'
    acc[action] = (acc[action] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const labels = Object.keys(counts)
  const data = Object.values(counts)

  return {
    labels,
    datasets: [{
      label: 'Action Distribution',
      data: data as number[],
      backgroundColor: [
        'rgba(255, 99, 132, 0.2)',
        'rgba(54, 162, 235, 0.2)',
        'rgba(255, 206, 86, 0.2)'
      ],
      borderColor: [
        'rgba(255, 99, 132, 1)',
        'rgba(54, 162, 235, 1)',
        'rgba(255, 206, 86, 1)'
      ],
      borderWidth: 1
    }]
  }
})

// Position stats
function getPositionStats(position: string) {
  const positionHands = handHistory.value.filter(h => h.hero_position === position)
  const total = positionHands.length
  if (total === 0) return { total: 0, winRate: 0, vpip: 0, pfr: 0 }

  const wins = positionHands.filter(h => h.pot_size_bb > 0).length
  const vpipHands = positionHands.filter(h => 
    h.street === 'preflop' && ['call', 'raise'].includes(h.final_action || '')
  ).length
  const pfrHands = positionHands.filter(h => 
    h.street === 'preflop' && h.final_action === 'raise'
  ).length

  return {
    total,
    winRate: ((wins / total) * 100).toFixed(1),
    vpip: ((vpipHands / total) * 100).toFixed(1),
    pfr: ((pfrHands / total) * 100).toFixed(1)
  }
}

// Data fetching
async function refreshData() {
  loading.value = true
  try {
    const { data, error } = await supabase
      .from('mendez_games')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    handHistory.value = data || []
  } catch (err) {
    console.error('Error fetching hand history:', err)
  } finally {
    loading.value = false
  }
}

// Export functionality
function exportData() {
  const exportData = {
    summary: {
      totalHands: totalHands.value,
      winRate: winRate.value,
      gptAgreementRate: gptAgreementRate.value,
      avgPotSize: avgPotSize.value
    },
    positionStats: positions.reduce((acc, pos) => {
      acc[pos] = getPositionStats(pos)
      return acc
    }, {} as Record<string, any>),
    handHistory: handHistory.value.map(h => ({
      ...h,
      created_at: new Date(h.created_at).toISOString()
    }))
  }

  const jsonString = JSON.stringify(exportData, null, 2)
  const blob = new Blob([jsonString], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = `mendez_history_${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Formatting helpers
function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString()
}

// Add new helper functions
function formatProfitLoss(hand: any) {
  if (hand.final_action === 'fold') {
    return `-${hand.to_call_bb}BB`
  }
  return `${hand.pot_size_bb}BB`
}

function getResultText(hand: any) {
  if (hand.final_action === 'fold') {
    return 'Fold'
  }
  if (!hand.board_cards) {
    return 'Pending'
  }
  return hand.pot_size_bb > 0 ? 'Win' : 'Loss'
}

function getResultClass(hand: any) {
  if (hand.final_action === 'fold') {
    return 'text-red-600'
  }
  if (!hand.board_cards) {
    return 'text-gray-600'
  }
  return hand.pot_size_bb > 0 ? 'text-green-600' : 'text-red-600'
}

// Add new computed properties for GPT stats
const gptSuccessRate = computed(() => {
  const decisions = handHistory.value.filter(h => h.gpt_decision)
  if (decisions.length === 0) return '0'
  const successful = decisions.filter(h => h.gpt_decision && h.final_action === h.gpt_decision).length
  return ((successful / decisions.length) * 100).toFixed(1)
})

const avgConfidence = computed(() => {
  const decisions = handHistory.value.filter(h => h.gpt_decision)
  if (decisions.length === 0) return '0'
  const confidenceMap = { high: 1, medium: 0.5, low: 0.25 }
  const total = decisions.reduce((sum, h) => sum + (confidenceMap[getConfidenceLevel(h)] || 0), 0)
  return ((total / decisions.length) * 100).toFixed(1)
})

const gptDecisionDistribution = computed(() => {
  const decisions = handHistory.value.filter(h => h.gpt_decision)
  if (decisions.length === 0) return { fold: 0, call: 0, raise: 0 }
  
  const counts = decisions.reduce((acc, h) => {
    acc[h.gpt_decision] = (acc[h.gpt_decision] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  return {
    fold: ((counts.fold || 0) / decisions.length * 100).toFixed(1),
    call: ((counts.call || 0) / decisions.length * 100).toFixed(1),
    raise: ((counts.raise || 0) / decisions.length * 100).toFixed(1)
  }
})

const gptErrorRate = computed(() => {
  const total = handHistory.value.length
  if (total === 0) return '0'
  const errors = handHistory.value.filter(h => !h.gpt_decision).length
  return ((errors / total) * 100).toFixed(1)
})

const getErrorRateClass = computed(() => {
  const rate = parseFloat(gptErrorRate.value)
  if (rate < 5) return 'text-green-600'
  if (rate < 10) return 'text-yellow-600'
  return 'text-red-600'
})

// Add new helper functions
function getDecisionClass(decision: string | null) {
  if (!decision) return 'text-red-600'
  return {
    fold: 'text-yellow-600',
    call: 'text-blue-600',
    raise: 'text-green-600'
  }[decision] || 'text-gray-600'
}

function getConfidenceLevel(hand: any) {
  if (!hand.gpt_decision) return 'low'
  if (hand.decision_reasoning?.includes('high confidence')) return 'high'
  if (hand.decision_reasoning?.includes('medium confidence')) return 'medium'
  return 'medium'
}

// Initial data load
onMounted(refreshData)
</script>

<style scoped>
.mendez-history {
  @apply p-6 bg-white rounded-lg shadow;
}

.header-actions {
  @apply flex justify-between items-center mb-6;
}

.refresh-btn, .export-btn {
  @apply px-4 py-2 text-white rounded-md transition-colors;
}

.refresh-btn {
  @apply bg-blue-600 hover:bg-blue-700;
}

.export-btn {
  @apply bg-green-600 hover:bg-green-700;
}

.stats-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4;
}

.stat-card {
  @apply bg-gray-50 p-4 rounded-lg text-center;
}

.stat-card h3 {
  @apply text-gray-600 text-sm mb-2;
}

.stat-value {
  @apply text-2xl font-bold text-gray-900;
}

.charts-grid {
  @apply grid grid-cols-1 md:grid-cols-2 gap-6;
}

.chart-container {
  @apply bg-gray-50 p-4 rounded-lg;
}

.chart-container h3 {
  @apply text-gray-600 text-sm mb-4;
}

.position-card {
  @apply bg-gray-50 p-4 rounded-lg;
}

.position-card h4 {
  @apply text-gray-700 font-semibold mb-3 pb-2 border-b;
}

.stats {
  @apply space-y-2;
}

.stat-row {
  @apply flex justify-between text-sm;
}

.stat-row span:first-child {
  @apply text-gray-600;
}

.stat-row span:last-child {
  @apply font-medium;
}
</style> 