interface CacheEntry {
  content: string
  timestamp: number
  metadata?: {
    handCategory?: string
    position?: string
    street?: string
    action?: string
  }
}

interface RateLimitEntry {
  count: number
  resetTime: number
}

interface QueuedRequest {
  prompt: string
  options: RequestOptions
  resolve: (value: { content: string }) => void
  reject: (error: Error) => void
  priority: number
  timestamp: number
}

interface RequestOptions {
  model?: string
  temperature?: number
  max_tokens?: number
  presence_penalty?: number
  frequency_penalty?: number
  bypassCache?: boolean
  priority?: number
}

class APIManager {
  private static instance: APIManager
  private cache: Map<string, CacheEntry>
  private rateLimit: Map<string, RateLimitEntry>
  private requestQueue: QueuedRequest[] = []
  private processingQueue = false
  private similarityCache: Map<string, string[]> = new Map() // Cache for similar prompts
  private predictionModel: Map<string, string> = new Map() // Simple prediction model

  private readonly CACHE_TTL = 1000 * 60 * 60 // 1 hour
  private readonly RATE_LIMIT_WINDOW = 1000 * 60 // 1 minute
  private readonly RATE_LIMIT_MAX_REQUESTS = 20 // 20 requests per minute
  private readonly MAX_RETRIES = 3
  private readonly RETRY_DELAY = 1000 // 1 second
  private readonly BATCH_SIZE = 5 // Process 5 requests at a time
  private readonly SIMILARITY_THRESHOLD = 0.8 // 80% similarity threshold

  private constructor() {
    this.cache = new Map()
    this.rateLimit = new Map()
    this.startQueueProcessor()
  }

  public static getInstance(): APIManager {
    if (!APIManager.instance) {
      APIManager.instance = new APIManager()
    }
    return APIManager.instance
  }

  private async startQueueProcessor() {
    while (true) {
      if (this.requestQueue.length > 0 && !this.processingQueue) {
        this.processingQueue = true
        await this.processBatch()
        this.processingQueue = false
      }
      await this.delay(100) // Check queue every 100ms
    }
  }

  private async processBatch() {
    // Sort queue by priority and timestamp
    this.requestQueue.sort((a, b) => 
      b.priority - a.priority || a.timestamp - b.timestamp
    )

    // Process up to BATCH_SIZE requests
    const batch = this.requestQueue.splice(0, this.BATCH_SIZE)
    await Promise.all(batch.map(request => this.processRequest(request)))
  }

  private async processRequest(request: QueuedRequest) {
    try {
      // Try to predict response first
      const predictedResponse = this.predictResponse(request.prompt)
      if (predictedResponse && !request.options.bypassCache) {
        request.resolve({ content: predictedResponse })
        return
      }

      // Check for similar cached prompts
      const similarPrompt = this.findSimilarPrompt(request.prompt)
      if (similarPrompt && !request.options.bypassCache) {
        const cached = this.cache.get(similarPrompt)
        if (cached) {
          request.resolve({ content: cached.content })
          return
        }
      }

      // Make actual API call
      const response = await this.makeAPICall(request.prompt, request.options)
      request.resolve(response)

      // Update prediction model
      this.updatePredictionModel(request.prompt, response.content)
    } catch (error: any) {
      request.reject(error)
    }
  }

  private predictResponse(prompt: string): string | null {
    // Extract key features from prompt
    const features = this.extractFeatures(prompt)
    const key = this.generatePredictionKey(features)
    return this.predictionModel.get(key) || null
  }

  private extractFeatures(prompt: string): any {
    // Extract relevant features from the prompt
    const matches = {
      street: prompt.match(/Street:\s*(\w+)/i)?.[1],
      position: prompt.match(/Position:\s*(\w+)/i)?.[1],
      hand: prompt.match(/Hand:\s*([2-9TJQKA][hdcs][2-9TJQKA][hdcs])/)?.[1],
      board: prompt.match(/Board:\s*([2-9TJQKA][hdcs]\s*)+/i)?.[1],
      action: prompt.match(/Suggested Action:\s*(\w+)/i)?.[1]
    }
    return matches
  }

  private generatePredictionKey(features: any): string {
    return `${features.street}_${features.position}_${features.action}`
  }

  private updatePredictionModel(prompt: string, response: string) {
    const features = this.extractFeatures(prompt)
    const key = this.generatePredictionKey(features)
    this.predictionModel.set(key, response)
  }

  private findSimilarPrompt(prompt: string): string | null {
    const promptFeatures = this.extractFeatures(prompt)
    const similarPrompts = this.similarityCache.get(
      `${promptFeatures.street}_${promptFeatures.position}`
    )
    
    if (!similarPrompts) return null

    return similarPrompts.find(cached => 
      this.calculateSimilarity(prompt, cached) > this.SIMILARITY_THRESHOLD
    ) || null
  }

  private calculateSimilarity(prompt1: string, prompt2: string): number {
    // Simple Jaccard similarity for quick comparison
    const words1 = new Set(prompt1.toLowerCase().split(/\s+/))
    const words2 = new Set(prompt2.toLowerCase().split(/\s+/))
    const intersection = new Set([...words1].filter(x => words2.has(x)))
    const union = new Set([...words1, ...words2])
    return intersection.size / union.size
  }

  public async callGPT(prompt: string, options: RequestOptions = {}): Promise<{ content: string }> {
    return new Promise((resolve, reject) => {
      // Add request to queue
      this.requestQueue.push({
        prompt,
        options,
        resolve,
        reject,
        priority: options.priority || 1,
        timestamp: Date.now()
      })
    })
  }

  private async makeAPICall(prompt: string, options: RequestOptions): Promise<{ content: string }> {
    const cacheKey = this.generateCacheKey(prompt)

    // Check cache unless explicitly bypassed
    if (!options.bypassCache) {
      const cached = this.cache.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        const features = this.extractFeatures(prompt)
        const cachedFeatures = this.extractFeatures(cached.content)
        
        // Only use cache if key features match
        if (this.featuresMatch(features, cachedFeatures)) {
          console.log('Using cached response for prompt')
          return { content: cached.content }
        }
      }
    }

    let lastError: Error | null = null
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        // Check rate limit
        if (this.isRateLimited('gpt')) {
          const waitTime = Math.ceil((this.rateLimit.get('gpt')?.resetTime || 0) - Date.now())
          console.log(`Rate limited, waiting ${waitTime}ms`)
          await this.delay(waitTime)
        }

        // Make API call
        const response = await $fetch<{ content: string }>('/api/openai', {
          method: 'POST',
          body: {
            messages: [{ 
              role: 'system',
              content: `You are a poker strategy assistant. Analyze the current situation and provide a clear action (fold/call/raise) with a brief explanation. Always reference the specific cards and board in your response.`
            }, {
              role: 'user',
              content: prompt
            }],
            model: options.model || 'gpt-4o',
            temperature: options.temperature || 0.7,
            max_tokens: options.max_tokens || 150,
            presence_penalty: options.presence_penalty || 0.1,
            frequency_penalty: options.frequency_penalty || 0.1
          }
        })

        if (!response?.content) {
          throw new Error('Empty response from OpenAI')
        }

        // Validate response format
        if (!this.validateResponse(response.content)) {
          throw new Error('Invalid response format')
        }

        // Cache successful response with metadata
        const features = this.extractFeatures(prompt)
        this.cache.set(cacheKey, {
          content: response.content,
          timestamp: Date.now(),
          metadata: features
        })

        // Update similarity cache
        const similarityCacheKey = `${features.street}_${features.position}`
        const similarPrompts = this.similarityCache.get(similarityCacheKey) || []
        similarPrompts.push(prompt)
        this.similarityCache.set(similarityCacheKey, similarPrompts)

        return response
      } catch (error: any) {
        lastError = error
        console.error(`API call attempt ${attempt} failed:`, error)

        if (error.status === 400 || error.status === 401) {
          throw error
        }

        if (attempt < this.MAX_RETRIES) {
          const delay = this.RETRY_DELAY * attempt
          console.log(`Waiting ${delay}ms before retry`)
          await this.delay(delay)
        }
      }
    }

    throw lastError || new Error('All API call attempts failed')
  }

  private validateResponse(content: string): boolean {
    // Check for required action keyword
    const hasAction = /Action:\s*(fold|call|raise)/i.test(content) ||
                     /(fold|call|raise)/i.test(content)
    
    // Check for reasoning
    const hasReasoning = /Reason(?:ing)?:/i.test(content)
    
    // Check for specific card references
    const hasCards = /[2-9TJQKA][hdcs]/.test(content)
    
    return hasAction && (hasReasoning || hasCards)
  }

  private featuresMatch(features1: any, features2: any): boolean {
    if (!features1 || !features2) return false
    
    // Compare key features
    return features1.street === features2.street &&
           features1.position === features2.position &&
           features1.hand === features2.hand &&
           features1.board === features2.board
  }

  private generateCacheKey(prompt: string): string {
    return prompt.trim().toLowerCase().replace(/\s+/g, ' ')
  }

  private isRateLimited(endpoint: string): boolean {
    const now = Date.now()
    const limit = this.rateLimit.get(endpoint)

    if (!limit) {
      this.rateLimit.set(endpoint, {
        count: 1,
        resetTime: now + this.RATE_LIMIT_WINDOW
      })
      return false
    }

    if (now > limit.resetTime) {
      this.rateLimit.set(endpoint, {
        count: 1,
        resetTime: now + this.RATE_LIMIT_WINDOW
      })
      return false
    }

    if (limit.count >= this.RATE_LIMIT_MAX_REQUESTS) {
      return true
    }

    limit.count++
    return false
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  public clearCache(): void {
    this.cache.clear()
    this.similarityCache.clear()
    this.predictionModel.clear()
    console.log('Cache cleared')
  }

  public getCacheStats(): { 
    size: number, 
    oldestEntry: number | null,
    similarityCacheSize: number,
    predictionModelSize: number,
    queueLength: number
  } {
    let oldestTimestamp: number | null = null
    this.cache.forEach(entry => {
      if (!oldestTimestamp || entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp
      }
    })

    return {
      size: this.cache.size,
      oldestEntry: oldestTimestamp,
      similarityCacheSize: Array.from(this.similarityCache.values()).reduce((sum, arr) => sum + arr.length, 0),
      predictionModelSize: this.predictionModel.size,
      queueLength: this.requestQueue.length
    }
  }

  public getRateLimitStats(): { currentRequests: number, timeToReset: number } {
    const limit = this.rateLimit.get('gpt')
    return {
      currentRequests: limit?.count || 0,
      timeToReset: (limit?.resetTime || 0) - Date.now()
    }
  }
}

// Export singleton instance
export const apiManager = APIManager.getInstance() 