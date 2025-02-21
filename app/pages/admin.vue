<template>
  <div class="admin-page">
    <div v-if="!isAuthorized" class="unauthorized">
      <h1>접근 권한이 없습니다</h1>
      <p>이 페이지는 관리자만 접근할 수 있습니다.</p>
      <NuxtLink to="/" class="back-link">홈으로 돌아가기</NuxtLink>
    </div>

    <div v-else class="admin-content">
      <h1>Mendez Control Panel</h1>
      
      <!-- Real-time status indicator -->
      <div class="flex items-center gap-4 mb-4">
        <div class="flex items-center gap-2">
          <div class="h-3 w-3 rounded-full" :class="[
            loading ? 'bg-yellow-400 animate-pulse' : 
            error ? 'bg-red-500' : 
            'bg-green-500'
          ]"></div>
          <span class="text-sm text-gray-600">
            {{ loading ? 'Updating...' : error ? 'Error' : 'Live' }}
          </span>
            </div>
        
        <!-- Auto-refresh toggle -->
        <div class="flex items-center gap-2">
          <label class="text-sm text-gray-600">Auto-refresh:</label>
          <button 
            @click="isAutoRefreshEnabled = !isAutoRefreshEnabled"
            class="px-3 py-1 rounded text-sm"
            :class="isAutoRefreshEnabled ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'"
          >
            {{ isAutoRefreshEnabled ? 'On' : 'Off' }}
              </button>
            </div>

        <!-- Manual refresh button -->
            <button 
          @click="refreshData" 
          class="refresh-btn"
              :disabled="loading"
            >
          Refresh Now
            </button>
      </div>

      <!-- Error message -->
      <div v-if="error" class="mb-4 p-4 bg-red-100 text-red-700 rounded">
        <p class="font-bold">Error:</p>
        <p>{{ error }}</p>
            <button 
          @click="refreshData"
          class="mt-2 text-sm underline hover:no-underline"
            >
          Try again
            </button>
          </div>

      <!-- Add new section for data export options -->
      <div class="export-section mb-6">
        <h3 class="text-lg font-semibold mb-4">Data Export Options</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button 
            @click="exportHandHistory" 
            class="export-btn bg-blue-600"
                >
            Export Hand History
                </button>
                <button 
            @click="exportPlayerStats" 
            class="export-btn bg-green-600"
          >
            Export Player Stats
          </button>
          <button 
            @click="exportGPTAnalysis" 
            class="export-btn bg-purple-600"
          >
            Export GPT Analysis
          </button>
          <button 
            @click="exportFullDatabase" 
            class="export-btn bg-gray-600"
          >
            Export Full Database
                </button>
              </div>
            </div>

      <!-- Add filters section -->
      <div class="filters-section mb-6">
        <h3 class="text-lg font-semibold mb-4">Filters</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="filter-group">
            <label class="block text-sm font-medium text-gray-700">Date Range</label>
            <select v-model="dateFilter" class="filter-select">
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
          <div class="filter-group">
            <label class="block text-sm font-medium text-gray-700">Position</label>
            <select v-model="positionFilter" class="filter-select">
              <option value="all">All Positions</option>
              <option v-for="pos in positions" :key="pos" :value="pos">{{ pos }}</option>
            </select>
          </div>
          <div class="filter-group">
            <label class="block text-sm font-medium text-gray-700">Street</label>
            <select v-model="streetFilter" class="filter-select">
              <option value="all">All Streets</option>
              <option value="preflop">Preflop</option>
              <option value="flop">Flop</option>
              <option value="turn">Turn</option>
              <option value="river">River</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Add analysis tabs -->
      <div class="analysis-tabs mb-6">
        <div class="tab-buttons">
              <button 
            v-for="tab in ['Overview', 'Hand History', 'Player Stats', 'GPT Analysis', 'Strategy Analysis']" 
            :key="tab"
            @click="currentTab = tab"
            :class="['tab-btn', { active: currentTab === tab }]"
          >
            {{ tab }}
              </button>
          </div>

        <!-- Overview Tab -->
        <div v-if="currentTab === 'Overview'" class="tab-content">
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
          <div class="charts-grid">
            <!-- Charts will be added here -->
          </div>
        </div>

        <!-- Hand History Tab -->
        <div v-if="currentTab === 'Hand History'" class="tab-content">
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
          <div v-if="isDebugMode" class="stats-overview mb-4">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <!-- Street Distribution -->
              <div class="stat-panel">
                <h3 class="stat-title">Street Distribution</h3>
                <div class="stat-content">
                  <div v-for="item in streetDistribution" :key="item.street" class="stat-row">
                    <span class="capitalize">{{ item.street }}:</span>
                    <span class="font-medium">{{ item.percentage }}%</span>
                  </div>
                </div>
              </div>

              <!-- Position Stats -->
              <div class="stat-panel">
                <h3 class="stat-title">Position Stats</h3>
                <div class="stat-content">
                  <div v-for="item in positionDistribution" :key="item.position" class="stat-row">
                    <span>{{ item.position }}:</span>
                    <span class="font-medium">{{ item.percentage }}%</span>
                  </div>
                </div>
              </div>

              <!-- Decision Stats -->
              <div class="stat-panel">
                <h3 class="stat-title">Decision Stats</h3>
                <div class="stat-content">
                  <div v-for="item in decisionDistribution" :key="item.decision" class="stat-row">
                    <span class="capitalize">{{ item.decision }}:</span>
                    <span class="font-medium" :class="getDecisionClass(item.decision)">{{ item.percentage }}%</span>
                  </div>
                </div>
              </div>

              <!-- Board Texture Stats -->
              <div class="stat-panel">
                <h3 class="stat-title">Board Textures</h3>
                <div class="stat-content">
                  <div v-for="item in boardTextureDistribution" :key="item.texture" class="stat-row">
                    <span>{{ item.texture }}:</span>
                    <span class="font-medium">{{ item.percentage }}%</span>
                  </div>
                </div>
              </div>

              <!-- Stack Size Distribution -->
              <div class="stat-panel">
                <h3 class="stat-title">Stack Sizes</h3>
                <div class="stat-content">
                  <div class="stat-row">
                    <span>Average Stack:</span>
                    <span class="font-medium">{{ stackStats.avgStack }}BB</span>
                  </div>
                  <div class="stat-row">
                    <span>Average SPR:</span>
                    <span class="font-medium">{{ stackStats.avgSPR }}</span>
                  </div>
                </div>
              </div>

              <!-- Results Stats -->
              <div class="stat-panel">
                <h3 class="stat-title">Results</h3>
                <div class="stat-content">
                  <div class="stat-row">
                    <span>Win Rate:</span>
                    <span class="font-medium text-green-600">{{ winRate }}%</span>
                  </div>
                  <div class="stat-row">
                    <span>Average Profit:</span>
                    <span class="font-medium" :class="Number(avgProfit) >= 0 ? 'text-green-600' : 'text-red-600'">{{ avgProfit }}BB</span>
                  </div>
                  <div class="stat-row">
                    <span>GPT Accuracy:</span>
                    <span class="font-medium">{{ gptStats.successRate }}%</span>
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
                <tr v-for="game in filteredHandHistory" :key="game.id">
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
                </div>

        <!-- Player Stats Tab -->
        <div v-if="currentTab === 'Player Stats'" class="tab-content">
          <div class="position-stats">
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
                </div>

        <!-- GPT Analysis Tab -->
        <div v-if="currentTab === 'GPT Analysis'" class="tab-content">
          <div class="gpt-performance">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div class="stat-card">
                <h4>Success Rate</h4>
                <p class="text-2xl font-bold">{{ gptStats?.successRate || '0' }}%</p>
                <p class="text-xs text-gray-500">Successful decisions / Total decisions</p>
                  </div>
              <div class="stat-card">
                <h4>Average Confidence</h4>
                <p class="text-2xl font-bold">{{ gptStats?.avgConfidence || '0' }}%</p>
                <p class="text-xs text-gray-500">Based on high/medium/low confidence ratings</p>
                  </div>
              <div class="stat-card">
                <h4>Decision Distribution</h4>
                <p class="text-2xl font-bold">
                  {{ gptStats?.decisionDistribution?.fold || '0' }}% / 
                  {{ gptStats?.decisionDistribution?.call || '0' }}% / 
                  {{ gptStats?.decisionDistribution?.raise || '0' }}%
                </p>
                <p class="text-xs text-gray-500">Fold / Call / Raise ratio</p>
              </div>
              <div class="stat-card">
                <h4>Error Rate</h4>
                <p class="text-2xl font-bold" :class="parseFloat(gptStats?.errorRate || '0') > 10 ? 'text-red-600' : 'text-green-600'">
                  {{ gptStats?.errorRate || '0' }}%
                </p>
                <p class="text-xs text-gray-500">Failed decisions / Total decisions</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

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

      <!-- Add PokerStats component after player history -->
      <section class="admin-section mt-8">
        <div class="header-actions">
          <div class="flex items-center gap-2">
            <h2>Poker Statistics</h2>
            <button 
              @click="isStatsExpanded = !isStatsExpanded"
              class="expand-btn"
              :aria-label="isStatsExpanded ? 'Collapse statistics' : 'Expand statistics'"
            >
              {{ isStatsExpanded ? '▼' : '▶' }}
            </button>
          </div>
          </div>
        <Transition name="expand">
          <div v-show="isStatsExpanded" class="mt-4">
            <PokerStats 
              v-if="mendezGames.length > 0" 
              :games="mendezGames" 
            />
            <div v-else class="text-gray-500 text-center py-4">
              No games data available
      </div>
          </div>
        </Transition>
      </section>

      <!-- Analysis Table Section -->
      <section class="admin-section mt-8">
        <div class="header-actions">
          <div class="flex items-center gap-2">
            <h2>Hand Analysis</h2>
            <button 
              @click="isAnalysisExpanded = !isAnalysisExpanded"
              class="expand-btn"
              :aria-label="isAnalysisExpanded ? 'Collapse analysis' : 'Expand analysis'"
            >
              {{ isAnalysisExpanded ? '▼' : '▶' }}
            </button>
          </div>
          <ExportAnalysisButton :analyses="currentAnalyses" />
        </div>
        <Transition name="expand">
          <div v-show="isAnalysisExpanded" class="overflow-x-auto mt-4">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <!-- Basic Info -->
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase bg-gray-100" colspan="4">Basic Info</th>
                  <!-- Position & Stack -->
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase bg-blue-50" colspan="4">Position & Stack</th>
                  <!-- Board Analysis -->
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase bg-green-50" colspan="4">Board Analysis</th>
                  <!-- Decision & Result -->
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase bg-purple-50" colspan="4">Decision & Result</th>
                </tr>
                <tr>
                  <!-- Basic Info -->
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Street</th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Hero Cards</th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Board</th>
                  
                  <!-- Position & Stack -->
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Stack (BB)</th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pot (BB)</th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">SPR</th>
                  
                  <!-- Board Analysis -->
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Texture</th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Draws</th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Equity</th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Action History</th>
                  
                  <!-- Decision & Result -->
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">GPT Decision</th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Reasoning</th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Final Action</th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Result</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="game in filteredHandHistory" :key="game.id" 
                    class="hover:bg-gray-50 transition-colors"
                    :class="{'bg-blue-50': game === mendezGames[0]}">
                  <!-- Basic Info -->
                  <td class="px-3 py-2 text-sm whitespace-nowrap">{{ formatDate(game.created_at) }}</td>
                  <td class="px-3 py-2 text-sm capitalize whitespace-nowrap">{{ game.street }}</td>
                  <td class="px-3 py-2 text-sm font-mono whitespace-nowrap">{{ game.hero_cards }}</td>
                  <td class="px-3 py-2 text-sm font-mono whitespace-nowrap">{{ game.board_cards || '-' }}</td>
                  
                  <!-- Position & Stack -->
                  <td class="px-3 py-2 text-sm whitespace-nowrap">
                    {{ game.hero_position }}
                    <span class="text-xs text-gray-500 block">({{ getPositionType(game) }})</span>
                  </td>
                  <td class="px-3 py-2 text-sm whitespace-nowrap">{{ game.effective_stack }}</td>
                  <td class="px-3 py-2 text-sm whitespace-nowrap">{{ game.pot_size_bb }}</td>
                  <td class="px-3 py-2 text-sm whitespace-nowrap">{{ calculateSPR(game) }}</td>
                  
                  <!-- Board Analysis -->
                  <td class="px-3 py-2 text-sm whitespace-nowrap">{{ getBoardTexture(game.board_cards || '') }}</td>
                  <td class="px-3 py-2 text-sm whitespace-nowrap">{{ getPossibleDraws(game.board_cards || '') }}</td>
                  <td class="px-3 py-2 text-sm whitespace-nowrap">{{ getHeroEquity(game.hero_cards, game.board_cards || '') }}%</td>
                  <td class="px-3 py-2 text-sm max-w-xs overflow-hidden overflow-ellipsis">
                    <div class="space-y-1">
                      <div v-for="(action, index) in game.action_history" :key="index" class="text-xs">
                        {{ formatAction(action) }}
                      </div>
                    </div>
                  </td>
                  
                  <!-- Decision & Result -->
                  <td class="px-3 py-2 text-sm whitespace-nowrap" :class="getDecisionClass(game.gpt_decision)">
                    {{ game.gpt_decision }}
                    <span class="text-xs text-gray-500 block">({{ getConfidenceLevel(game) }})</span>
                  </td>
                  <td class="px-3 py-2 text-sm max-w-xs overflow-hidden overflow-ellipsis">
                    {{ game.decision_reasoning || '-' }}
                  </td>
                  <td class="px-3 py-2 text-sm whitespace-nowrap" :class="getDecisionClass(game.final_action)">
                    {{ game.final_action || '-' }}
                  </td>
                  <td class="px-3 py-2 text-sm whitespace-nowrap" :class="getResultClass(game)">
                    {{ getResultText(game) }}
                  </td>
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
import PokerStats from '../components/charts/PokerStats.vue'
import type { MendezGame } from '~/types/mendez.types'
import ExportAnalysisButton from '~/components/admin/ExportAnalysisButton.vue'

type ConfidenceLevel = 'high' | 'medium' | 'low'

interface PositionStats {
  total: number
  winRate: string
  vpip: string
  pfr: string
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

interface GPTStats {
  successRate: string
  avgConfidence: string
  decisionDistribution: {
    fold: string
    call: string
    raise: string
  }
  errorRate: string
}

// Define available positions
const positions = ['BTN', 'CO', 'MP', 'UTG', 'SB', 'BB'] as const
type Position = typeof positions[number]

const { user } = useAuth()
const supabase = useSupabaseClient<Database>()
const router = useRouter()

// State variables
const loading = ref(false)
const error = ref<string | null>(null)
const mendezGames = ref<SafeMendezGame[]>([])
const playerHistories = ref<PlayerHistory[]>([])
const isPlayerHistoryExpanded = ref(false)
const isStatsExpanded = ref(true)
const isAutoRefreshEnabled = ref(true)
const refreshInterval = ref<NodeJS.Timeout | null>(null)
const REFRESH_INTERVAL = 5000 // 5 seconds

// Computed properties
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

interface SafeMendezGame extends Omit<MendezGame, 'created_at' | 'gpt_decision' | 'last_seen_at'> {
  created_at: string
  gpt_decision: string
  last_seen_at: string
}

// Real-time subscriptions
const setupRealtimeSubscriptions = async () => {
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

// Auto-refresh functionality
const startAutoRefresh = () => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
  }
  refreshInterval.value = setInterval(async () => {
    if (!loading.value) {
    await refreshData()
    }
  }, REFRESH_INTERVAL)
}

const stopAutoRefresh = () => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
    refreshInterval.value = null
  }
}

// Data refresh functions
const refreshMendezGames = async () => {
  try {
    const { data, error: dbError } = await supabase
      .from('mendez_games')
      .select('*')
      .order('created_at', { ascending: false })

    if (dbError) throw dbError
    
    mendezGames.value = (data || []).map(game => ({
      ...game,
      created_at: game.created_at || new Date().toISOString(),
      street: game.street as 'preflop' | 'flop' | 'turn' | 'river',
      gpt_decision: game.gpt_decision || 'unknown',
      player_stacks: game.player_stacks || {},
      positions: game.positions || {},
      action_history: game.action_history || [],
      last_seen_at: game.last_seen_at || new Date().toISOString()
    })) as SafeMendezGame[]

    // Call handleAnalysis with the new data
    if (mendezGames.value.length > 0) {
      handleAnalysis({ success: true })
    }
  } catch (err) {
    console.error('Error refreshing Mendez games:', err)
    throw err
  }
}

const refreshPlayerHistories = async () => {
  try {
    const { data, error: dbError } = await supabase
      .from('mendez_player_history')
      .select('*')
      .order('last_seen_at', { ascending: false })

    if (dbError) throw dbError
    playerHistories.value = data || []
  } catch (err) {
    console.error('Error refreshing player histories:', err)
    throw err
  }
}

const refreshData = async () => {
  if (loading.value) return

  loading.value = true
  error.value = null
  
  try {
    await Promise.all([
      refreshMendezGames(),
      refreshPlayerHistories()
    ])
  } catch (err) {
    console.error('Error refreshing data:', err)
    error.value = err instanceof Error ? err.message : 'Failed to refresh data'
  } finally {
    loading.value = false
  }
}

// Watch auto-refresh toggle
watch(isAutoRefreshEnabled, (newValue) => {
  if (newValue) {
    startAutoRefresh()
  } else {
    stopAutoRefresh()
  }
})

// Initialize on mount
onMounted(async () => {
  if (isAuthorized.value) {
    await refreshData()
    setupRealtimeSubscriptions()
    if (isAutoRefreshEnabled.value) {
      startAutoRefresh()
    }
  }
})

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString()
}

function formatPercentage(value: number) {
  return `${value.toFixed(1)}%`
}

function formatNumber(value: number) {
  return value.toFixed(2)
}

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

function getConfidenceLevel(hand: SafeMendezGame): ConfidenceLevel {
  if (!hand.gpt_decision) return 'low'
  if (hand.decision_reasoning?.includes('high confidence')) return 'high'
  if (hand.decision_reasoning?.includes('medium confidence')) return 'medium'
  return 'low'
}

function getApiLatency(game: SafeMendezGame): number {
  // Simulate API latency based on created_at timestamp
  // In a real implementation, you would track actual API latency
  return Math.floor(Math.random() * 500 + 500)
}

function estimateTokenCount(game: SafeMendezGame): number {
  // Estimate token count based on content length
  // In a real implementation, you would track actual token usage
  const content = JSON.stringify({
    prompt: game.decision_reasoning,
    response: game.gpt_decision
  })
  return Math.floor(content.length / 4)
}

function getRequestStatus(game: SafeMendezGame): string {
  if (!game.gpt_decision) return 'Failed'
  if (!game.decision_reasoning) return 'Partial'
  return 'Success'
}

function getStatusClass(game: SafeMendezGame): string {
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
  if (!ranks || !Array.isArray(ranks) || ranks.length < 2) return false
  
  const rankOrder = '23456789TJQKA'
  const values = ranks
    .map(r => rankOrder.indexOf(r))
    .filter((v): v is number => v !== -1)
    .sort((a, b) => a - b)
  
  if (values.length < 2) return false
  return Math.max(...values) - Math.min(...values) <= 4
}

function calculateSPR(game: SafeMendezGame): string {
  if (!game.effective_stack || !game.pot_size_bb || game.pot_size_bb === 0) return 'N/A'
  return (game.effective_stack / game.pot_size_bb).toFixed(1)
}

function getPositionType(game: SafeMendezGame): string {
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

// Add new refs for filters and tabs
const currentTab = ref('Overview')
const dateFilter = ref('all')
const positionFilter = ref('all')
const streetFilter = ref('all')

// Add computed property for filtered data
const filteredHandHistory = computed<SafeMendezGame[]>(() => {
  if (!mendezGames.value) return []
  let filtered = [...mendezGames.value]

  // Apply date filter
  if (dateFilter.value !== 'all') {
    const now = new Date()
    const startDate = new Date()
    
    switch (dateFilter.value) {
      case 'today':
        startDate.setHours(0, 0, 0, 0)
        break
      case 'week':
        startDate.setDate(now.getDate() - 7)
        break
      case 'month':
        startDate.setMonth(now.getMonth() - 1)
        break
    }
    
    filtered = filtered.filter(h => new Date(h.created_at) >= startDate)
  }

  // Apply position filter
  if (positionFilter.value !== 'all') {
    filtered = filtered.filter(h => h.hero_position === positionFilter.value)
  }

  // Apply street filter
  if (streetFilter.value !== 'all') {
    filtered = filtered.filter(h => h.street === streetFilter.value)
  }

  return filtered
})

// Add computed properties for GPT stats
const gptStats = computed<GPTStats>(() => {
  const decisions = (filteredHandHistory.value || []).filter(h => h.gpt_decision)
  if (decisions.length === 0) {
    return {
      successRate: '0',
      avgConfidence: '0',
      decisionDistribution: { fold: '0', call: '0', raise: '0' },
      errorRate: '0'
    }
  }

  // Calculate success rate
  const successful = decisions.filter(h => h.gpt_decision && h.final_action === h.gpt_decision).length
  const successRate = ((successful / decisions.length) * 100).toFixed(1)

  // Calculate average confidence
  const confidenceMap: Record<ConfidenceLevel, number> = { 
    high: 1, 
    medium: 0.5, 
    low: 0.25 
  }
  const totalConfidence = decisions.reduce((sum, h) => {
    const confidence = getConfidenceLevel(h)
    return sum + (confidenceMap[confidence] || 0)
  }, 0)
  const avgConfidence = ((totalConfidence / decisions.length) * 100).toFixed(1)

  // Calculate decision distribution
  const counts = decisions.reduce((acc, h) => {
    const action = h.gpt_decision || 'fold'
    acc[action] = (acc[action] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const decisionDistribution = {
    fold: ((counts.fold || 0) / decisions.length * 100).toFixed(1),
    call: ((counts.call || 0) / decisions.length * 100).toFixed(1),
    raise: ((counts.raise || 0) / decisions.length * 100).toFixed(1)
  }

  // Calculate error rate
  const errors = (filteredHandHistory.value || []).filter(h => !h.gpt_decision).length
  const errorRate = ((errors / (filteredHandHistory.value || []).length) * 100).toFixed(1)

  return {
    successRate,
    avgConfidence,
    decisionDistribution,
    errorRate
  }
})

// Add new export functions
function exportHandHistory() {
  const data = filteredHandHistory.value.map(h => ({
    date: formatDate(h.created_at),
    street: h.street,
    position: h.hero_position,
    hand: h.hero_cards,
    board: h.board_cards,
    action: h.gpt_decision,
    result: getResultText(h),
    profitLoss: h.pot_size_bb
  }))
  
  downloadJson(data, 'hand_history')
}

function exportPlayerStats() {
  const data = positions.map((pos: Position) => ({
    position: pos,
    ...getPositionStats(pos)
  }))
  
  downloadJson(data, 'player_stats')
}

function exportGPTAnalysis() {
  const data = filteredHandHistory.value.map(h => ({
    date: formatDate(h.created_at),
    hand: h.hero_cards,
    gptDecision: h.gpt_decision,
    confidence: getConfidenceLevel(h),
    reasoning: h.decision_reasoning,
    wasCorrect: h.final_action === h.gpt_decision
  }))
  
  downloadJson(data, 'gpt_analysis')
}

function exportFullDatabase() {
  const data = {
    handHistory: filteredHandHistory.value,
    playerStats: positions.map((pos: Position) => ({
      position: pos,
      ...getPositionStats(pos)
    })),
    gptStats: gptStats.value
  }
  
  downloadJson(data, 'full_database')
}

function getPositionStats(position: Position): PositionStats {
  const positionHands = filteredHandHistory.value.filter(h => h.hero_position === position)
  const total = positionHands.length
  if (total === 0) return { total: 0, winRate: '0', vpip: '0', pfr: '0' }

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

function getResultText(hand: SafeMendezGame): string {
  if (hand.final_action === 'fold') {
    return 'Fold'
  }
  if (!hand.board_cards) {
    return 'Pending'
  }
  return hand.pot_size_bb > 0 ? 'Win' : 'Loss'
}

function downloadJson(data: any, filename: string) {
  const jsonString = JSON.stringify(data, null, 2)
  const blob = new Blob([jsonString], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Replace the currentAnalysis ref definition with:
const currentAnalyses = ref<Array<{
  markdown: string
  action: string | null
  confidence: string
  reasoning: string
}> | null>(null)

// Update the handleAnalysis function:
async function handleAnalysis(result: any) {
  if (result.success) {
    // Generate analysis for all games
    const analyses = mendezGames.value.map(game => ({
      markdown: generateAnalysisMarkdown(game),
      action: game.gpt_decision,
      confidence: getConfidenceLevel(game),
      reasoning: game.decision_reasoning || 'No reasoning provided'
    }))

    // Store all analyses
    currentAnalyses.value = analyses
  }
}

// Helper function to generate markdown for a game
function generateAnalysisMarkdown(game: SafeMendezGame): string {
  // Get board texture and draws
  const texture = getBoardTexture(game.board_cards || '')
  const draws = getPossibleDraws(game.board_cards || '')
  const equity = getHeroEquity(game.hero_cards, game.board_cards || '')
  const spr = calculateSPR(game)
  const positionType = getPositionType(game)

  return `# Poker Hand Analysis

## Current Situation
- **Position:** ${game.hero_position} (${positionType})
- **Hero Cards:** ${game.hero_cards}
- **Board:** ${game.board_cards || 'Preflop'}
- **Street:** ${game.street}
- **Pot Size:** ${game.pot_size_bb}BB
- **To Call:** ${game.to_call_bb}BB
- **Effective Stack:** ${game.effective_stack}BB
- **SPR:** ${spr}

## Board Analysis
- **Texture:** ${texture}
- **Possible Draws:** ${draws}
- **Hero Equity:** ${equity}%

## Action History
\`\`\`
${game.action_history?.map(a => `${a.player}: ${a.action}${a.amount ? ` ${a.amount}BB` : ''}`).join('\n') || 'No action history'}
\`\`\`

## Final Decision
- **Action:** ${game.gpt_decision}
- **Confidence:** ${getConfidenceLevel(game)}
- **Reasoning:** ${game.decision_reasoning || 'No reasoning provided'}
`
}

// Add new ref for analysis expansion
const isAnalysisExpanded = ref(true)

// Add new helper function for decision styling
function getDecisionClass(decision: string | null | undefined): string {
  if (!decision) return 'text-gray-400'
  return {
    'fold': 'text-red-600',
    'call': 'text-blue-600',
    'raise': 'text-green-600'
  }[decision] || 'text-gray-600'
}

// Add new helper function for result styling
function getResultClass(game: SafeMendezGame): string {
  if (game.final_action === 'fold') {
    return 'text-red-600'
  }
  if (game.pot_size_bb > 0) {
    return 'text-green-600'
  }
  return 'text-red-600'
}

// Add new computed properties for statistics
const streetDistribution = computed(() => {
  const total = filteredHandHistory.value.length
  return ['preflop', 'flop', 'turn', 'river'].map(street => ({
    street,
    percentage: total ? ((filteredHandHistory.value.filter(g => g.street === street).length / total) * 100).toFixed(1) : '0'
  }))
})

const positionDistribution = computed(() => {
  const total = filteredHandHistory.value.length
  return positions.map(pos => ({
    position: pos,
    percentage: total ? ((filteredHandHistory.value.filter(g => g.hero_position === pos).length / total) * 100).toFixed(1) : '0'
  }))
})

const decisionDistribution = computed(() => {
  const total = filteredHandHistory.value.length
  return ['fold', 'call', 'raise'].map(decision => ({
    decision,
    percentage: total ? ((filteredHandHistory.value.filter(g => g.gpt_decision === decision).length / total) * 100).toFixed(1) : '0'
  }))
})

const boardTextureDistribution = computed(() => {
  const boardHands = filteredHandHistory.value.filter(g => g.board_cards)
  const total = boardHands.length
  return ['Dry', 'Wet', 'Very Wet', 'Monotone', 'Paired'].map(texture => ({
    texture,
    percentage: total ? ((boardHands.filter(g => getBoardTexture(g.board_cards || '') === texture).length / total) * 100).toFixed(1) : '0'
  }))
})

const stackStats = computed(() => {
  const total = filteredHandHistory.value.length
  if (!total) return { avgStack: '0', avgSPR: '0' }
  
  return {
    avgStack: (filteredHandHistory.value.reduce((sum, g) => sum + g.effective_stack, 0) / total).toFixed(1),
    avgSPR: (filteredHandHistory.value.reduce((sum, g) => sum + Number(calculateSPR(g)), 0) / total).toFixed(1)
  }
})

const avgProfit = computed(() => {
  const total = filteredHandHistory.value.length
  if (!total) return '0'
  return (filteredHandHistory.value.reduce((sum, g) => sum + g.pot_size_bb, 0) / total).toFixed(1)
})
</script>

<style scoped>
/* Modern Color Palette */
:root {
  --primary-color: #3b82f6;     /* Vibrant Blue */
  --secondary-color: #10b981;   /* Emerald Green */
  --accent-color: #6366f1;      /* Indigo */
  --background-light: #f8fafc;  /* Soft Gray-Blue */
  --text-primary: #1f2937;      /* Dark Gray */
  --text-secondary: #6b7280;    /* Medium Gray */
}

.admin-page {
  @apply bg-background-light min-h-screen p-6 font-sans antialiased;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(16, 185, 129, 0.05) 100%);
}

.admin-content {
  @apply max-w-7xl mx-auto space-y-6;
}

/* Enhanced Typography */
h1 {
  @apply text-3xl font-extrabold text-text-primary mb-6 tracking-tight;
  background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Card Design */
.admin-section {
  @apply bg-white rounded-2xl shadow-lg border border-gray-100 p-6 transition-all duration-300;
  box-shadow: 0 10px 25px rgba(59, 130, 246, 0.1);
  transform: translateY(0);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.admin-section:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 35px rgba(59, 130, 246, 0.15);
}

/* Button Styles */
.refresh-btn, .export-btn, .debug-btn {
  @apply px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 ease-in-out;
  background: linear-gradient(to right, var(--primary-color), var(--accent-color));
  color: white;
  box-shadow: 0 4px 6px rgba(59, 130, 246, 0.2);
  transform: translateY(0);
  transition: transform 0.2s, box-shadow 0.2s;
}

.refresh-btn:hover, .export-btn:hover, .debug-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 8px rgba(59, 130, 246, 0.3);
}

/* Tab Design */
.tab-buttons {
  @apply flex space-x-2 mb-6 bg-gray-100 p-1 rounded-xl;
}

.tab-btn {
  @apply px-4 py-2 text-sm font-medium text-gray-600 rounded-lg transition-all duration-300;
}

.tab-btn.active {
  @apply bg-white text-primary-color shadow-md;
}

/* Stats Grid */
.stats-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6;
}

.stat-item {
  @apply bg-white rounded-2xl p-6 text-center shadow-md border border-gray-100 transition-all duration-300;
  transform: scale(1);
  transition: transform 0.3s, box-shadow 0.3s;
}

.stat-item:hover {
  transform: scale(1.03);
  box-shadow: 0 10px 25px rgba(16, 185, 129, 0.1);
}

.stat-value {
  @apply text-3xl font-bold mt-2;
  background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Table Styles */
.table-container {
  @apply bg-white rounded-2xl shadow-lg overflow-hidden;
}

.table-header {
  @apply bg-gray-50 px-6 py-4 border-b border-gray-200;
}

.table-row {
  @apply hover:bg-gray-50 transition-colors duration-200;
}

/* Responsive Adjustments */
@media (max-width: 768px) {
  .admin-page {
    @apply p-3;
  }

  .stats-grid {
    @apply grid-cols-1;
  }

  .tab-buttons {
    @apply flex-col space-x-0 space-y-2;
  }

  .tab-btn {
    @apply w-full text-center;
  }
}

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.fade-enter-active {
  animation: fadeIn 0.5s ease-out;
}

/* Debug and Export Sections */
.debug-section, .export-section {
  @apply bg-white rounded-2xl p-6 border border-gray-100 shadow-md;
}

.export-btn {
  @apply w-full justify-center flex items-center space-x-2;
}

.export-btn svg {
  @apply w-5 h-5 mr-2;
}
</style> 