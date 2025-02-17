<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold mb-6">Mendez Tournament Performance Dashboard</h1>
    
    <!-- Stats Overview -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <div class="bg-white p-4 rounded-lg shadow">
        <h3 class="text-lg font-semibold mb-2">Overall Performance</h3>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-sm text-gray-600">Total Profit</p>
            <p class="text-xl font-bold" :class="totalProfit >= 0 ? 'text-green-600' : 'text-red-600'">
              {{ formatMoney(totalProfit) }}
            </p>
          </div>
          <div>
            <p class="text-sm text-gray-600">Win Rate</p>
            <p class="text-xl font-bold">{{ winRate }}%</p>
          </div>
        </div>
      </div>
      
      <div class="bg-white p-4 rounded-lg shadow">
        <h3 class="text-lg font-semibold mb-2">Flopzilla Integration</h3>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-sm text-gray-600">Accuracy</p>
            <p class="text-xl font-bold">{{ flopzillaAccuracy }}%</p>
          </div>
          <div>
            <p class="text-sm text-gray-600">Decisions Made</p>
            <p class="text-xl font-bold">{{ totalDecisions }}</p>
          </div>
        </div>
      </div>
      
      <div class="bg-white p-4 rounded-lg shadow">
        <h3 class="text-lg font-semibold mb-2">OpenAI Adaptation</h3>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-sm text-gray-600">Success Rate</p>
            <p class="text-xl font-bold">{{ aiSuccessRate }}%</p>
          </div>
          <div>
            <p class="text-sm text-gray-600">Adaptations</p>
            <p class="text-xl font-bold">{{ totalAdaptations }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Charts Section -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <div class="bg-white p-4 rounded-lg shadow">
        <h3 class="text-lg font-semibold mb-4">Profit Trend</h3>
        <ProfitTrendChart :profit-data="profitData" />
      </div>
      
      <div class="bg-white p-4 rounded-lg shadow">
        <h3 class="text-lg font-semibold mb-4">Betting Statistics</h3>
        <BettingStatsChart 
          :vpip-percentage="vpipPercentage"
          :pfr-percentage="pfrPercentage"
          :three-bet-percentage="threeBetPercentage"
          :cbet-percentage="cbetPercentage"
          :cbet-success-rate="cbetSuccessRate"
          :fold-to-cbet-percentage="foldToCbetPercentage"
        />
      </div>
    </div>

    <!-- Decision Logs -->
    <div class="bg-white p-4 rounded-lg shadow mb-6">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-semibold">Recent Decisions</h3>
        <button 
          @click="refreshLogs" 
          class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>
      <div class="overflow-x-auto">
        <table class="min-w-full">
          <thead>
            <tr class="bg-gray-100">
              <th class="px-4 py-2 text-left">Time</th>
              <th class="px-4 py-2 text-left">Hand</th>
              <th class="px-4 py-2 text-left">Flopzilla Suggestion</th>
              <th class="px-4 py-2 text-left">AI Adaptation</th>
              <th class="px-4 py-2 text-left">Final Decision</th>
              <th class="px-4 py-2 text-left">Result</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in decisionLogs" :key="log.id" class="border-t">
              <td class="px-4 py-2">{{ formatDate(log.created_at) }}</td>
              <td class="px-4 py-2">{{ log.hand }}</td>
              <td class="px-4 py-2">{{ log.flopzilla_suggestion }}</td>
              <td class="px-4 py-2">{{ log.ai_adaptation }}</td>
              <td class="px-4 py-2">{{ log.final_decision }}</td>
              <td class="px-4 py-2" :class="log.result >= 0 ? 'text-green-600' : 'text-red-600'">
                {{ formatMoney(log.result) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useSupabaseClient } from '#imports'
import type { MendezHandStats, MendezDetailedStats } from '~/types/mendez.types'
import ProfitTrendChart from '~/components/charts/ProfitTrendChart.vue'
import BettingStatsChart from '~/components/charts/BettingStatsChart.vue'

const supabase = useSupabaseClient()

// Stats
const totalProfit = ref(0)
const winRate = ref(0)
const flopzillaAccuracy = ref(0)
const totalDecisions = ref(0)
const aiSuccessRate = ref(0)
const totalAdaptations = ref(0)

// Betting Stats
const vpipPercentage = ref(0)
const pfrPercentage = ref(0)
const threeBetPercentage = ref(0)
const cbetPercentage = ref(0)
const cbetSuccessRate = ref(0)
const foldToCbetPercentage = ref(0)

// Charts Data
const profitData = ref<MendezHandStats[]>([])
const decisionLogs = ref<MendezHandStats[]>([])

// Fetch Stats
const fetchMendezStats = async () => {
  try {
    const { data: stats, error } = await supabase
      .from('mendez_detailed_stats')
      .select('*')
      .single()
    
    if (error) throw error
    
    totalProfit.value = stats.total_profit
    winRate.value = stats.win_rate
    flopzillaAccuracy.value = stats.flopzilla_accuracy
    totalDecisions.value = stats.total_decisions
    aiSuccessRate.value = stats.ai_success_rate
    totalAdaptations.value = stats.total_adaptations
    
    // Betting stats
    vpipPercentage.value = stats.vpip_percentage
    pfrPercentage.value = stats.pfr_percentage
    threeBetPercentage.value = stats.three_bet_percentage
    cbetPercentage.value = stats.cbet_percentage
    cbetSuccessRate.value = stats.cbet_success_rate
    foldToCbetPercentage.value = stats.fold_to_cbet_percentage
  } catch (error) {
    console.error('Error fetching Mendez stats:', error)
  }
}

// Fetch Profit Trend
const fetchProfitTrend = async () => {
  try {
    const { data, error } = await supabase
      .from('mendez_hand_stats')
      .select('created_at, won_amount')
      .order('created_at', { ascending: true })
    
    if (error) throw error
    profitData.value = data
  } catch (error) {
    console.error('Error fetching profit trend:', error)
  }
}

// Fetch Decision Logs
const fetchDecisionLogs = async () => {
  try {
    const { data, error } = await supabase
      .from('mendez_hand_stats')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (error) throw error
    decisionLogs.value = data
  } catch (error) {
    console.error('Error fetching decision logs:', error)
  }
}

// Utility Functions
const formatMoney = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleString()
}

const refreshLogs = async () => {
  await Promise.all([
    fetchMendezStats(),
    fetchProfitTrend(),
    fetchDecisionLogs()
  ])
}

// Initial Load
onMounted(async () => {
  await refreshLogs()
})
</script> 