import OpenAI from 'openai'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  const openai = new OpenAI({
    apiKey: config.openaiApiKey
  })

  try {
    const response = await openai.chat.completions.create({
      model: body.model || 'gpt-4',
      messages: body.messages,
      temperature: body.temperature || 0.7,
      max_tokens: body.max_tokens || 150
    })

    return {
      content: response.choices[0]?.message?.content || null
    }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message
    })
  }
}) 