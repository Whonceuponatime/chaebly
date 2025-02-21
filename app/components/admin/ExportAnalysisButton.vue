<template>
  <button 
    @click="exportAnalysis" 
    class="export-btn"
    :disabled="!analyses || analyses.length === 0"
  >
    <span class="icon">📥</span>
    Export All Analyses
  </button>
</template>

<script setup lang="ts">
const props = defineProps<{
  analyses: Array<{
    markdown: string
    action: string | null
    confidence: string
    reasoning: string
  }> | null
}>()

function exportAnalysis() {
  if (!props.analyses || props.analyses.length === 0) return

  // Create table headers
  const tableHeaders = `# Poker Hand Analysis Summary

| Time | Street | Position | Hero Cards | Board | Pot Size | To Call | Stack | SPR | Texture | Draws | Action | Confidence | Reasoning |
|------|---------|----------|------------|-------|-----------|----------|--------|-----|----------|--------|----------|------------|-----------|`

  // Process each analysis into table rows
  const tableRows = props.analyses.map(analysis => {
    // Extract data from markdown using regex
    const time = new Date().toLocaleString()
    const street = analysis.markdown.match(/\*\*Street:\*\* ([^\n]+)/)?.[1] || '-'
    const position = analysis.markdown.match(/\*\*Position:\*\* ([^()\n]+)/)?.[1]?.trim() || '-'
    const heroCards = analysis.markdown.match(/\*\*Hero Cards:\*\* ([^\n]+)/)?.[1] || '-'
    const board = analysis.markdown.match(/\*\*Board:\*\* ([^\n]+)/)?.[1] || '-'
    const potSize = analysis.markdown.match(/\*\*Pot Size:\*\* ([^\n]+)/)?.[1] || '-'
    const toCall = analysis.markdown.match(/\*\*To Call:\*\* ([^\n]+)/)?.[1] || '-'
    const stack = analysis.markdown.match(/\*\*Effective Stack:\*\* ([^\n]+)/)?.[1] || '-'
    const spr = analysis.markdown.match(/\*\*SPR:\*\* ([^\n]+)/)?.[1] || '-'
    const texture = analysis.markdown.match(/\*\*Texture:\*\* ([^\n]+)/)?.[1] || '-'
    const draws = analysis.markdown.match(/\*\*Possible Draws:\*\* ([^\n]+)/)?.[1] || '-'

    // Format the row with proper escaping for markdown table
    return `| ${time} | ${street} | ${position} | ${heroCards} | ${board} | ${potSize} | ${toCall} | ${stack} | ${spr} | ${texture} | ${draws} | ${analysis.action || '-'} | ${analysis.confidence} | ${analysis.reasoning.replace(/\|/g, '\\|')} |`
  }).join('\n')

  // Combine headers and rows
  const combinedMarkdown = `${tableHeaders}\n${tableRows}\n\n## Detailed Hand Analysis\n\n${props.analyses.map((analysis, index) => {
    const separator = index === 0 ? '' : '\n\n---\n\n'
    return separator + analysis.markdown
  }).join('')}`

  // Create file name with timestamp and hand count
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const fileName = `poker-analyses-${props.analyses.length}-hands-${timestamp}.md`

  // Create blob and download
  const blob = new Blob([combinedMarkdown], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.export-btn {
  @apply px-4 py-2 bg-blue-600 text-white rounded-md 
         hover:bg-blue-700 transition-colors
         disabled:bg-gray-400 disabled:cursor-not-allowed
         flex items-center gap-2;
}

.icon {
  font-size: 1.2em;
}
</style> 