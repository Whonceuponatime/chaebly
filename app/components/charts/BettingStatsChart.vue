<template>
  <div class="chart-container">
    <Bar
      v-if="chartData"
      :data="chartData"
      :options="chartOptions"
    />
  </div>
</template>

<script setup lang="ts">
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale
} from 'chart.js'

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale
)

const props = defineProps<{
  vpipPercentage: number
  pfrPercentage: number
  threeBetPercentage: number
  cbetPercentage: number
  cbetSuccessRate: number
  foldToCbetPercentage: number
}>()

const chartData = computed(() => ({
  labels: ['VPIP', 'PFR', '3-Bet', 'C-Bet', 'C-Bet Success', 'Fold to C-Bet'],
  datasets: [
    {
      label: 'Percentage %',
      data: [
        props.vpipPercentage,
        props.pfrPercentage,
        props.threeBetPercentage,
        props.cbetPercentage,
        props.cbetSuccessRate,
        props.foldToCbetPercentage
      ],
      backgroundColor: [
        'rgba(255, 99, 132, 0.5)',
        'rgba(54, 162, 235, 0.5)',
        'rgba(255, 206, 86, 0.5)',
        'rgba(75, 192, 192, 0.5)',
        'rgba(153, 102, 255, 0.5)',
        'rgba(255, 159, 64, 0.5)'
      ],
      borderColor: [
        'rgb(255, 99, 132)',
        'rgb(54, 162, 235)',
        'rgb(255, 206, 86)',
        'rgb(75, 192, 192)',
        'rgb(153, 102, 255)',
        'rgb(255, 159, 64)'
      ],
      borderWidth: 1
    }
  ]
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true
    },
    title: {
      display: true,
      text: 'Betting Statistics'
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      max: 100
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