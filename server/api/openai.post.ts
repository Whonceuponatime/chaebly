import OpenAI from 'openai'

// List of supported OpenAI chat models
const SUPPORTED_MODELS = [
  'o1',
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-4',
  'gpt-4-turbo-preview',
  'gpt-4-0125-preview',
  'gpt-4-1106-preview',
  'gpt-3.5-turbo',
  'gpt-3.5-turbo-0125',
  'gpt-3.5-turbo-1106',
  'gpt-3.5-turbo-16k'
]

// Configuration for API calls
const API_CONFIG = {
  timeoutMs: 30000, // 30 seconds
  maxRetries: 2,
  retryDelayMs: 1000 // 1 second
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  if (!config.openaiApiKey) {
    throw createError({
      statusCode: 500,
      message: 'OpenAI API key is not configured'
    })
  }

  const openai = new OpenAI({
    apiKey: config.openaiApiKey,
    timeout: API_CONFIG.timeoutMs,
    maxRetries: API_CONFIG.maxRetries
  })

  // Validate the requested model
  const requestedModel = body.model || 'gpt-4o'
  if (!SUPPORTED_MODELS.includes(requestedModel)) {
    throw createError({
      statusCode: 400,
      message: `Invalid model: ${requestedModel}. Supported models are: ${SUPPORTED_MODELS.join(', ')}`
    })
  }

  let attempt = 0
  while (attempt < API_CONFIG.maxRetries + 1) {
    try {
      const response = await openai.chat.completions.create({
        model: requestedModel,
        messages: body.messages,
        temperature: body.temperature || 0.7,
        max_tokens: body.max_tokens || 150,
        presence_penalty: body.presence_penalty || 0,
        frequency_penalty: body.frequency_penalty || 0
      })

      if (!response.choices?.[0]?.message?.content) {
        throw new Error('Empty response from OpenAI')
      }

      return {
        content: response.choices[0].message.content
      }
    } catch (error: any) {
      attempt++
      
      // Log the error details
      console.error('OpenAI API Error:', {
        attempt,
        message: error.message,
        code: error.code,
        type: error.type,
        param: error.param,
        status: error.status
      })

      // If it's a timeout error and we haven't exceeded retries, wait and retry
      if (error.code === 'ETIMEDOUT' && attempt < API_CONFIG.maxRetries + 1) {
        await new Promise(resolve => setTimeout(resolve, API_CONFIG.retryDelayMs))
        continue
      }

      // If it's the last attempt or a non-timeout error, throw the error
      if (attempt >= API_CONFIG.maxRetries + 1 || error.code !== 'ETIMEDOUT') {
        throw createError({
          statusCode: error.status || 500,
          message: `OpenAI API error (attempt ${attempt}/${API_CONFIG.maxRetries + 1}): ${error.message}`
        })
      }
    }
  }
}) 