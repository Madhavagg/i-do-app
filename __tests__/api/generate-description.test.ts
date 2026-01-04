import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/ai/generate-description/route'

// Mock the OpenAI and Langfuse modules
vi.mock('@/lib/openai/client', () => ({
  isOpenAIConfigured: vi.fn(),
}))

vi.mock('@/lib/langfuse/client', () => ({
  isLangfuseConfigured: vi.fn(() => false),
}))

vi.mock('@/lib/langfuse/openai', () => ({
  getTracedOpenAI: vi.fn(),
  DEFAULT_MODEL: 'gpt-4o-mini',
}))

import { isOpenAIConfigured } from '@/lib/openai/client'
import { getTracedOpenAI } from '@/lib/langfuse/openai'

describe('POST /api/ai/generate-description', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 503 when OpenAI is not configured', async () => {
    vi.mocked(isOpenAIConfigured).mockReturnValue(false)

    const request = new Request('http://localhost/api/ai/generate-description', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Test task' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(503)
    expect(data.error).toContain('AI features are not available')
  })

  it('should return 400 when title is missing', async () => {
    vi.mocked(isOpenAIConfigured).mockReturnValue(true)

    const request = new Request('http://localhost/api/ai/generate-description', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('Missing or invalid "title" field')
  })

  it('should return 400 when title is empty string', async () => {
    vi.mocked(isOpenAIConfigured).mockReturnValue(true)

    const request = new Request('http://localhost/api/ai/generate-description', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '   ' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('Missing or invalid "title" field')
  })

  it('should return 400 when title is not a string', async () => {
    vi.mocked(isOpenAIConfigured).mockReturnValue(true)

    const request = new Request('http://localhost/api/ai/generate-description', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 123 }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('Missing or invalid "title" field')
  })

  it('should return generated description on success', async () => {
    vi.mocked(isOpenAIConfigured).mockReturnValue(true)

    const mockOpenAI = {
      chat: {
        completions: {
          create: vi.fn().mockResolvedValue({
            choices: [
              {
                message: {
                  content: 'Start by gathering all necessary groceries from the store.',
                },
              },
            ],
          }),
        },
      },
    }
    vi.mocked(getTracedOpenAI).mockReturnValue(mockOpenAI as any)

    const request = new Request('http://localhost/api/ai/generate-description', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Buy groceries', category: 'shopping' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.description).toBe('Start by gathering all necessary groceries from the store.')
    expect(data.model).toBe('gpt-4o-mini')
  })

  it('should pass userId to getTracedOpenAI', async () => {
    vi.mocked(isOpenAIConfigured).mockReturnValue(true)

    const mockOpenAI = {
      chat: {
        completions: {
          create: vi.fn().mockResolvedValue({
            choices: [{ message: { content: 'Test description' } }],
          }),
        },
      },
    }
    vi.mocked(getTracedOpenAI).mockReturnValue(mockOpenAI as any)

    const request = new Request('http://localhost/api/ai/generate-description', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Test task', userId: 'user-123' }),
    })

    await POST(request)

    expect(getTracedOpenAI).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-123',
        traceName: 'generate-description',
        metadata: expect.objectContaining({
          userId: 'user-123',
        }),
      })
    )
  })

  it('should include category in metadata when provided', async () => {
    vi.mocked(isOpenAIConfigured).mockReturnValue(true)

    const mockOpenAI = {
      chat: {
        completions: {
          create: vi.fn().mockResolvedValue({
            choices: [{ message: { content: 'Test description' } }],
          }),
        },
      },
    }
    vi.mocked(getTracedOpenAI).mockReturnValue(mockOpenAI as any)

    const request = new Request('http://localhost/api/ai/generate-description', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Test task', category: 'work' }),
    })

    await POST(request)

    expect(getTracedOpenAI).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          category: 'work',
        }),
      })
    )
  })

  it('should return empty string when AI returns no content', async () => {
    vi.mocked(isOpenAIConfigured).mockReturnValue(true)

    const mockOpenAI = {
      chat: {
        completions: {
          create: vi.fn().mockResolvedValue({
            choices: [{ message: { content: null } }],
          }),
        },
      },
    }
    vi.mocked(getTracedOpenAI).mockReturnValue(mockOpenAI as any)

    const request = new Request('http://localhost/api/ai/generate-description', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Test task' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.description).toBe('')
  })

  it('should return 500 on generic error', async () => {
    vi.mocked(isOpenAIConfigured).mockReturnValue(true)

    const mockOpenAI = {
      chat: {
        completions: {
          create: vi.fn().mockRejectedValue(new Error('Network error')),
        },
      },
    }
    vi.mocked(getTracedOpenAI).mockReturnValue(mockOpenAI as any)

    const request = new Request('http://localhost/api/ai/generate-description', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Test task' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toContain('An error occurred')
  })

  it('should return 401 on API key error', async () => {
    vi.mocked(isOpenAIConfigured).mockReturnValue(true)

    const mockOpenAI = {
      chat: {
        completions: {
          create: vi.fn().mockRejectedValue(new Error('Invalid API key provided')),
        },
      },
    }
    vi.mocked(getTracedOpenAI).mockReturnValue(mockOpenAI as any)

    const request = new Request('http://localhost/api/ai/generate-description', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Test task' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toContain('Invalid OpenAI API key')
  })

  it('should return 429 on rate limit error', async () => {
    vi.mocked(isOpenAIConfigured).mockReturnValue(true)

    const mockOpenAI = {
      chat: {
        completions: {
          create: vi.fn().mockRejectedValue(new Error('rate limit exceeded')),
        },
      },
    }
    vi.mocked(getTracedOpenAI).mockReturnValue(mockOpenAI as any)

    const request = new Request('http://localhost/api/ai/generate-description', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Test task' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(429)
    expect(data.error).toContain('Rate limit exceeded')
  })
})
