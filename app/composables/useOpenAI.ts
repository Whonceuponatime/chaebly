import OpenAI from 'openai'
import { ref } from 'vue'

export const useOpenAI = () => {
  const loading = ref(false)
  const error = ref<string | null>(null)

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    dangerouslyAllowBrowser: true // Note: In production, you should use server-side calls
  })

  const generateResponse = async (
    prompt: string, 
    model: 'gpt-4-0125-preview' | 'gpt-4-1106-preview' = 'gpt-4-0125-preview'
  ) => {
    loading.value = true
    error.value = null

    try {
      const response = await openai.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      })

      return response.choices[0].message.content
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
