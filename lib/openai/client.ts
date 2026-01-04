import OpenAI from 'openai'

// Model constants for consistent usage across the app
export const OPENAI_MODELS = {
  // GPT-4o: Fast, cost-effective, highly capable (recommended default)
  GPT_4O: 'gpt-4o',
  // GPT-4o-mini: Even faster and cheaper for simple tasks
  GPT_4O_MINI: 'gpt-4o-mini',
} as const

export type OpenAIModel = (typeof OPENAI_MODELS)[keyof typeof OPENAI_MODELS]

// Default model for the app (cost-conscious as per PRD)
export const DEFAULT_MODEL: OpenAIModel = OPENAI_MODELS.GPT_4O_MINI

let openaiClient: OpenAI | null = null

/**
 * Get the OpenAI client instance.
 * Server-side only - never expose to client.
 *
 * @throws Error if OPENAI_API_KEY is not configured
 */
export function getOpenAIClient(): OpenAI {
  if (openaiClient) {
    return openaiClient
  }

  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    throw new Error(
      'OPENAI_API_KEY is not configured. Please add it to your .env.local file.'
    )
  }

  openaiClient = new OpenAI({
    apiKey,
  })

  return openaiClient
}

/**
 * Check if OpenAI is configured.
 * Useful for graceful degradation when AI features are unavailable.
 */
export function isOpenAIConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY
}
