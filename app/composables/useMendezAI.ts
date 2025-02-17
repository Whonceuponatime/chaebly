import { ref } from 'vue'
import { useOpenAI } from './useOpenAI'

export interface PlayerProfile {
  name: string
  style: string
  aggressive: number
  passive: number
  totalHands: number
  recentActions: string[]
}

export const useMendezAI = () => {
  const { generateResponse, loading, error } = useOpenAI()
  const lastAnalysis = ref<string | null>(null)

  const analyzeOpponent = async (player: PlayerProfile) => {
    const prompt = `
      As a poker expert, analyze this opponent's playing style and suggest a counter-strategy.
      
      Player Profile:
      - Name: ${player.name}
      - Style: ${player.style}
      - Aggression Rate: ${player.aggressive}%
      - Passive Rate: ${player.passive}%
      - Total Hands: ${player.totalHands}
      - Recent Actions: ${player.recentActions.join(', ')}
      
      Provide a concise one-sentence strategy to exploit this player's tendencies.
    `

    const response = await generateResponse(prompt)
    if (response) {
      lastAnalysis.value = response
    }
    return response
  }

  const suggestHandStrategy = async (
    hand: string,
    position: string,
    opponentStyle: string,
    stackSize: number,
    potSize: number
  ) => {
    const prompt = `
      As a poker expert, suggest the optimal strategy for this hand:
      
      Current Situation:
      - Hand: ${hand}
      - Position: ${position}
      - Opponent Style: ${opponentStyle}
      - Stack Size: ${stackSize}BB
      - Pot Size: ${potSize}BB
      
      Provide a concise one-sentence strategy considering the opponent's style and position.
    `

    return await generateResponse(prompt)
  }

  const validateConnection = async (): Promise<boolean> => {
    try {
      const testPrompt = "Respond with 'connected' if you can read this message."
      const response = await generateResponse(testPrompt)
      return response?.toLowerCase().includes('connected') ?? false
    } catch (err) {
      return false
    }
  }

  return {
    analyzeOpponent,
    suggestHandStrategy,
    validateConnection,
    lastAnalysis,
    loading,
    error
  }
} 