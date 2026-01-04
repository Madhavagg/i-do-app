import { NextResponse } from 'next/server'
import { getTracedOpenAI, DEFAULT_MODEL } from '@/lib/langfuse/openai'
import { isOpenAIConfigured } from '@/lib/openai/client'
import { isLangfuseConfigured } from '@/lib/langfuse/client'

export async function POST(request: Request) {
  // Check if OpenAI is configured
  if (!isOpenAIConfigured()) {
    return NextResponse.json(
      { error: 'AI features are not available. Please configure OPENAI_API_KEY.' },
      { status: 503 }
    )
  }

  try {
    const body = await request.json()
    const { title, category, userId } = body

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json(
        { error: 'Missing or invalid "title" field. Please provide a non-empty string.' },
        { status: 400 }
      )
    }

    // Get traced OpenAI client
    const openai = getTracedOpenAI({
      userId,
      traceName: 'generate-description',
      metadata: {
        feature: 'description-generation',
        category: category || 'none',
        userId: userId || 'anonymous',
      },
      tags: ['generate-description', 'ai-todo'],
    })

    const systemPrompt = `You are a productivity assistant that helps create actionable task descriptions.
Given a task title, generate a concise 1-2 sentence description that:
- Clarifies what needs to be done
- Suggests specific first steps or key actions
- Is practical and actionable
${category ? `- Is appropriate for the "${category}" category` : ''}

Do not include the task title in your description. Be direct and specific.`

    const userPrompt = `Task title: "${title.trim()}"
${category ? `Category: ${category}` : ''}

Generate a helpful description:`

    const completion = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 100,
      temperature: 0.7,
    })

    const description = completion.choices[0]?.message?.content?.trim() || ''

    // Flush Langfuse events (important for serverless)
    if (isLangfuseConfigured()) {
      await (openai as unknown as { flushAsync: () => Promise<void> }).flushAsync()
    }

    return NextResponse.json({
      success: true,
      description,
      model: DEFAULT_MODEL,
    })
  } catch (error) {
    console.error('Error in generate-description API:', error)

    // Handle specific OpenAI errors
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'Invalid OpenAI API key. Please check your configuration.' },
          { status: 401 }
        )
      }
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        )
      }
    }

    return NextResponse.json(
      { error: 'An error occurred while generating the description.' },
      { status: 500 }
    )
  }
}
