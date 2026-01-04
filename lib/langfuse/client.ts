import { Langfuse } from 'langfuse'

let langfuseClient: Langfuse | null = null

/**
 * Get the Langfuse client instance for observability.
 * Server-side only - never expose to client.
 *
 * @throws Error if Langfuse credentials are not configured
 */
export function getLangfuseClient(): Langfuse {
  if (langfuseClient) {
    return langfuseClient
  }

  const publicKey = process.env.LANGFUSE_PUBLIC_KEY
  const secretKey = process.env.LANGFUSE_SECRET_KEY
  const baseUrl = process.env.LANGFUSE_BASEURL || 'https://cloud.langfuse.com'

  if (!publicKey || !secretKey) {
    throw new Error(
      'Langfuse credentials not configured. Please add LANGFUSE_PUBLIC_KEY and LANGFUSE_SECRET_KEY to your .env.local file.'
    )
  }

  langfuseClient = new Langfuse({
    publicKey,
    secretKey,
    baseUrl,
  })

  return langfuseClient
}

/**
 * Get Langfuse configuration for use with observeOpenAI.
 * Returns null if not configured (for graceful degradation).
 */
export function getLangfuseConfig() {
  const publicKey = process.env.LANGFUSE_PUBLIC_KEY
  const secretKey = process.env.LANGFUSE_SECRET_KEY
  const baseUrl = process.env.LANGFUSE_BASEURL || 'https://cloud.langfuse.com'

  if (!publicKey || !secretKey) {
    return null
  }

  return {
    publicKey,
    secretKey,
    baseUrl,
  }
}

/**
 * Check if Langfuse is configured.
 * Useful for graceful degradation when observability is unavailable.
 */
export function isLangfuseConfigured(): boolean {
  return !!(process.env.LANGFUSE_PUBLIC_KEY && process.env.LANGFUSE_SECRET_KEY)
}

/**
 * Flush Langfuse events before the process exits.
 * Important for serverless environments like Next.js API routes.
 */
export async function flushLangfuse(): Promise<void> {
  if (langfuseClient) {
    await langfuseClient.flushAsync()
  }
}
