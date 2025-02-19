import { ref } from 'vue'

export const useOpenAI = () => {
  const loading = ref(false)
  const error = ref<string | null>(null)

  const generateResponse = async (
    prompt: string, 
    model: 'o1' | 'gpt-4o' = 'o1'
  ) => {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch('/api/openai', {
        method: 'POST',
        body: {
          messages: [{ role: 'user', content: prompt }],
          model,
          temperature: 0.7,
          max_tokens: 150
        }
      })

      return response.content
    } catch (err: any) {
      error.value = err.message
      return null
    } finally {
      loading.value = false
    }
  }

  return {
    generateResponse,
    loading,
    error
  }
} 