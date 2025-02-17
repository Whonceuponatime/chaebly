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
import { computed } from 'vue'
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
  btnWinRate: number
  sbWinRate: number
  bbWinRate: number
}>()

const chartData = computed(() => ({
  labels: ['Button', 'Small Blind', 'Big Blind'],
  datasets: [
    {
      label: 'Win Rate %',
      data: [props.btnWinRate, props.sbWinRate, props.bbWinRate],
      backgroundColor: [
        'rgba(75, 192, 192, 0.5)',
        'rgba(54, 162, 235, 0.5)',
        'rgba(153, 102, 255, 0.5)'
      ],
      borderColor: [
        'rgb(75, 192, 192)',
        'rgb(54, 162, 235)',
        'rgb(153, 102, 255)'
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
      text: 'Win Rate by Position'
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