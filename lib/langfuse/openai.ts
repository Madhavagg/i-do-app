import { observeOpenAI } from 'langfuse'
import { getOpenAIClient, DEFAULT_MODEL, type OpenAIModel } from '@/lib/openai/client'
import { getLangfuseConfig } from './client'

export interface TracedOpenAIOptions {
  userId?: string
  sessionId?: string
  traceName?: string
  metadata?: Record<string, unknown>
  tags?: string[]
}

/**
 * Get an OpenAI client wrapped with Langfuse observability.
 * All API calls are automatically traced with cost, latency, and token tracking.
 *
 * @param options - Optional trace configuration (userId, sessionId, etc.)
 * @returns OpenAI client with automatic Langfuse tracing
 */
export function getTracedOpenAI(options: TracedOpenAIOptions = {}) {
  const openai = getOpenAIClient()
  const langfuseConfig = getLangfuseConfig()

  // If Langfuse is not configured, return unwrapped client
  if (!langfuseConfig) {
    console.warn(
      'Langfuse is not configured. OpenAI calls will not be traced. ' +
        'Add LANGFUSE_PUBLIC_KEY and LANGFUSE_SECRET_KEY to enable tracing.'
    )
    return openai
  }

  // Wrap OpenAI client with Langfuse observability
  return observeOpenAI(openai, {
    clientInitParams: langfuseConfig,
    userId: options.userId,
    sessionId: options.sessionId,
    traceName: options.traceName,
    metadata: options.metadata,
    tags: options.tags,
  })
}

/**
 * Re-export model constants for convenience
 */
export { DEFAULT_MODEL, OPENAI_MODELS } from '@/lib/openai/client'
export type { OpenAIModel }
