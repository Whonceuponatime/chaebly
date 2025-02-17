<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useSupabaseClient } from '#imports'
import type { MendezHandStats, MendezDetailedStats } from '../../types/mendez.types'
import ProfitTrendChart from '../../components/charts/ProfitTrendChart.vue'
import BettingStatsChart from '../../components/charts/BettingStatsChart.vue'

const supabase = useSupabaseClient()
// ... rest of the existing code ...
</script> 