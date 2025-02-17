<template>
  <div class="chart-container">
    <Line
      v-if="chartData"
      :data="chartData"
      :options="chartOptions"
    />
  </div>
</template>

<script setup lang="ts">
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  CategoryScale,
} from 'chart.js'
import { computed } from 'vue'
import type { MendezHandStats } from '@/lib/supabaseClient'

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  CategoryScale
)

const props = defineProps<{
  profitData: MendezHandStats[]
}>()

const chartData = computed(() => {
  const dates = props.profitData.map(d => new Date(d.created_at).toLocaleDateString())
  let runningTotal = 0
  const cumulativeProfit = props.profitData.map(d => {
    runningTotal += d.won_amount
    return runningTotal
  })

  return {
    labels: dates,
    datasets: [
      {
        label: 'Cumulative Profit',
        data: cumulativeProfit,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
        fill: false
      }
    ]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true
    },
    title: {
      display: true,
      text: 'Profit Trend'
    }
  },
  scales: {
    y: {
      beginAtZero: true
    }
  }
}
</script>

<style scoped>
.chart-container {
  height: 300px;
  width: 100%;
}
</style> 