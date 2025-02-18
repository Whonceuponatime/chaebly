<template>
  <div class="h-64">
    <canvas ref="chartRef"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import Chart from 'chart.js/auto'
import type { BettingStatsData } from '@/types/mendez.types'

const props = defineProps<{
  data: BettingStatsData
}>()

const chartRef = ref<HTMLCanvasElement | null>(null)
let chart: Chart | null = null

const createChart = () => {
  if (!chartRef.value) return

  const ctx = chartRef.value.getContext('2d')
  if (!ctx) return

  const total = props.data.fold + props.data.call + props.data.raise
  const percentages = {
    fold: Math.round((props.data.fold / total) * 100) || 0,
    call: Math.round((props.data.call / total) * 100) || 0,
    raise: Math.round((props.data.raise / total) * 100) || 0
  }

  chart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Fold', 'Call', 'Raise'],
      datasets: [{
        data: [percentages.fold, percentages.call, percentages.raise],
        backgroundColor: [
          '#ef4444', // red for fold
          '#3b82f6', // blue for call
          '#22c55e', // green for raise
        ]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const label = context.label || ''
              const value = context.parsed || 0
              return `${label}: ${value}%`
            }
          }
        }
      }
    }
  })
}

onMounted(() => {
  createChart()
})

watch(() => props.data, () => {
  if (chart) {
    chart.destroy()
  }
  createChart()
}, { deep: true })
</script>

<style scoped>
.chart-container {
  height: 300px;
  width: 100%;
}
</style> 