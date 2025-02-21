<template>
  <div class="poker-stats">
    <!-- Strategy Analysis Header -->
    <div class="strategy-header grid grid-cols-2 gap-4 mb-6">
      <div class="stat-box">
        <h3 class="text-sm font-medium text-gray-600">Total Played Hands</h3>
        <p class="text-2xl font-bold">{{ filteredGames.length }}</p>
      </div>
      <div class="stat-box">
        <h3 class="text-sm font-medium text-gray-600">Return in BB per 100 hands</h3>
        <p class="text-2xl font-bold" :class="bbPer100 >= 0 ? 'text-green-600' : 'text-red-600'">
          {{ bbPer100 > 0 ? '+' : '' }}{{ bbPer100.toFixed(2) }}
        </p>
      </div>
    </div>

    <!-- Equity Over Time Chart -->
    <div class="chart-container mb-8">
      <h3 class="text-lg font-semibold mb-4">Equity/Profit Over Time</h3>
      <LineChart 
        :data="equityTimeData"
        :options="{
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: {
              title: {
                display: true,
                text: 'BB'
              }
            },
            x: {
              title: {
                display: true,
                text: 'Hands'
              }
            }
          }
        }"
      />
    </div>

    <!-- Action Type Analysis -->
    <div class="chart-container">
      <h3 class="text-lg font-semibold mb-4">Action Type Analysis</h3>
      <BarChart 
        :data="actionAnalysisData"
        :options="{
          plugins: {
            legend: { 
              position: 'right',
              labels: {
                boxWidth: 15,
                padding: 15
              }
            },
            tooltip: {
              callbacks: {
                label: (context) => {
                  const label = context.dataset.label || '';
                  const value = context.parsed.y || 0;
                  return `${label}: ${value.toFixed(2)}BB`;
                }
              }
            }
          },
          scales: {
            y: {
              title: {
                display: true,
                text: 'BB Won/Lost'
              },
              stacked: true
            },
            x: {
              stacked: true
            }
          }
        }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { MendezGame } from '~/types/mendez.types'
import type { ChartData } from '~/types/mendez.types'
import LineChart from './LineChart.vue'
import BarChart from './BarChart.vue'

const props = defineProps<{
  games: MendezGame[]
}>()

// Add a computed property for filtered games to handle undefined
const filteredGames = computed(() => props.games || [])

// Calculate BB per 100 hands
const bbPer100 = computed(() => {
  if (filteredGames.value.length === 0) return 0
  const totalBB = filteredGames.value.reduce((sum, game) => {
    return sum + (game.final_action === 'fold' ? -game.to_call_bb : game.pot_size_bb)
  }, 0)
  
  return (totalBB / filteredGames.value.length) * 100
})

// Generate equity over time data
const equityTimeData = computed((): ChartData => {
  let runningTotal = 0
  const data = filteredGames.value.map((game, index) => {
    runningTotal += game.final_action === 'fold' ? -game.to_call_bb : game.pot_size_bb
    return {
      x: index + 1,
      y: runningTotal
    }
  })

  return {
    labels: data.map(d => d.x.toString()),
    datasets: [{
      data: data.map(d => d.y),
      borderColor: 'rgb(59, 130, 246)',
      borderWidth: 1,
      pointRadius: 0,
      tension: 0.1
    }]
  }
})

// Generate action analysis data
const actionAnalysisData = computed((): ChartData => {
  const actionTypes = {
    'Bluff': (g: MendezGame) => g.decision_reasoning?.toLowerCase().includes('bluff'),
    'BetPot': (g: MendezGame) => g.final_action === 'raise' && g.current_bet_bb >= g.pot_size_bb,
    'BetHPot': (g: MendezGame) => g.final_action === 'raise' && g.current_bet_bb >= g.pot_size_bb * 0.5,
    'Bet/Bet+': (g: MendezGame) => g.final_action === 'raise',
    'Call': (g: MendezGame) => g.final_action === 'call',
    'Check': (g: MendezGame) => g.final_action === 'check',
    'Fold': (g: MendezGame) => g.final_action === 'fold'
  }

  // Group games by street
  const streetGroups = ['preflop', 'flop', 'turn', 'river'].map(street => {
    const streetGames = filteredGames.value.filter(g => g.street === street)
    const actions = Object.entries(actionTypes).map(([type, predicate]) => {
      const games = streetGames.filter(predicate)
      const profit = games.reduce((sum, g) => 
        sum + (g.final_action === 'fold' ? -g.to_call_bb : g.pot_size_bb), 0
      )
      return { type, profit }
    })
    return { street, actions }
  })

  // Transform data for stacked bar chart
  return {
    labels: streetGroups.map(g => g.street.charAt(0).toUpperCase() + g.street.slice(1)),
    datasets: Object.keys(actionTypes).map(type => ({
      label: type,
      data: streetGroups.map(g => 
        g.actions.find(a => a.type === type)?.profit || 0
      ),
      backgroundColor: getActionColor(type, 0.5),
      borderColor: getActionColor(type, 1),
      borderWidth: 1
    }))
  }
})

// Helper function for action colors
function getActionColor(action: string, alpha: number): string {
  const colors = {
    'Bluff': `rgba(75, 192, 192, ${alpha})`,
    'BetPot': `rgba(54, 162, 235, ${alpha})`,
    'BetHPot': `rgba(153, 102, 255, ${alpha})`,
    'Bet/Bet+': `rgba(255, 159, 64, ${alpha})`,
    'Call': `rgba(75, 192, 192, ${alpha})`,
    'Check': `rgba(201, 203, 207, ${alpha})`,
    'Fold': `rgba(255, 99, 132, ${alpha})`
  }
  return colors[action as keyof typeof colors] || `rgba(201, 203, 207, ${alpha})`
}
</script>

<style scoped>
.poker-stats {
  @apply p-4;
}

.stat-box {
  @apply bg-white rounded-lg shadow p-4;
}

.chart-container {
  @apply bg-white rounded-lg shadow p-6;
}
</style> 