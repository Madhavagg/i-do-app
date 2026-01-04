import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AddTodo from '@/components/AddTodo'

// Mock the contexts
const mockAddTodo = vi.fn()
const mockUser = { id: 'user-123' }

vi.mock('@/context/TodoContext', () => ({
  useTodos: () => ({
    addTodo: mockAddTodo,
  }),
}))

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
  }),
}))

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('AddTodo Component - Auto Fill Feature', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
  })

  it('should render the Auto fill button when form is expanded', async () => {
    const user = userEvent.setup()
    render(<AddTodo />)

    // Form starts collapsed, focus on input to expand
    const input = screen.getByPlaceholderText('Add a new task...')
    await user.click(input)

    // Check if Auto fill button is visible
    expect(screen.getByText('Auto fill')).toBeInTheDocument()
  })

  it('should disable Auto fill button when title is empty', async () => {
    const user = userEvent.setup()
    render(<AddTodo />)

    const input = screen.getByPlaceholderText('Add a new task...')
    await user.click(input)

    const autoFillButton = screen.getByTitle('Enter a task title first')
    expect(autoFillButton).toBeDisabled()
  })

  it('should enable Auto fill button when title is entered', async () => {
    const user = userEvent.setup()
    render(<AddTodo />)

    const input = screen.getByPlaceholderText('Add a new task...')
    await user.click(input)
    await user.type(input, 'Buy groceries')

    const autoFillButton = screen.getByTitle('Generate description with AI')
    expect(autoFillButton).not.toBeDisabled()
  })

  it('should call API and fill description when Auto fill is clicked', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValueOnce({
      json: async () => ({
        success: true,
        description: 'Make a list of items needed and visit the nearest grocery store.',
      }),
    })

    render(<AddTodo />)

    const input = screen.getByPlaceholderText('Add a new task...')
    await user.click(input)
    await user.type(input, 'Buy groceries')

    const autoFillButton = screen.getByText('Auto fill')
    await user.click(autoFillButton)

    await waitFor(() => {
      const textarea = screen.getByPlaceholderText('Description (optional)')
      expect(textarea).toHaveValue('Make a list of items needed and visit the nearest grocery store.')
    })

    expect(mockFetch).toHaveBeenCalledWith('/api/ai/generate-description', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Buy groceries',
        category: undefined,
        userId: 'user-123',
      }),
    })
  })

  it('should show loading state while generating', async () => {
    const user = userEvent.setup()

    // Create a promise that we can control
    let resolvePromise: (value: any) => void
    const pendingPromise = new Promise((resolve) => {
      resolvePromise = resolve
    })

    mockFetch.mockReturnValueOnce(pendingPromise)

    render(<AddTodo />)

    const input = screen.getByPlaceholderText('Add a new task...')
    await user.click(input)
    await user.type(input, 'Test task')

    const autoFillButton = screen.getByText('Auto fill')
    await user.click(autoFillButton)

    // Check loading state
    expect(screen.getByText('Generating...')).toBeInTheDocument()

    // Resolve the promise
    resolvePromise!({
      json: async () => ({ success: true, description: 'Generated description' }),
    })

    await waitFor(() => {
      expect(screen.getByText('Auto fill')).toBeInTheDocument()
    })
  })

  it('should pass category to API when selected', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValueOnce({
      json: async () => ({
        success: true,
        description: 'Test description',
      }),
    })

    render(<AddTodo />)

    const input = screen.getByPlaceholderText('Add a new task...')
    await user.click(input)
    await user.type(input, 'Complete project')

    // Select a category - find by displayed option
    const categorySelects = screen.getAllByRole('combobox')
    // Category select is the one that has "None" as an option (second select)
    const categorySelect = categorySelects.find(s =>
      Array.from((s as HTMLSelectElement).options).some(o => o.text === 'None')
    )
    if (categorySelect) {
      await user.selectOptions(categorySelect, 'work')
    }

    const autoFillButton = screen.getByText('Auto fill')
    await user.click(autoFillButton)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/ai/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Complete project',
          category: 'work',
          userId: 'user-123',
        }),
      })
    })
  })

  it('should handle API error gracefully', async () => {
    const user = userEvent.setup()
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    mockFetch.mockResolvedValueOnce({
      json: async () => ({
        success: false,
        error: 'AI service unavailable',
      }),
    })

    render(<AddTodo />)

    const input = screen.getByPlaceholderText('Add a new task...')
    await user.click(input)
    await user.type(input, 'Test task')

    const autoFillButton = screen.getByText('Auto fill')
    await user.click(autoFillButton)

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to generate description:', 'AI service unavailable')
    })

    // Button should return to normal state
    expect(screen.getByText('Auto fill')).toBeInTheDocument()

    consoleSpy.mockRestore()
  })

  it('should handle network error gracefully', async () => {
    const user = userEvent.setup()
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    render(<AddTodo />)

    const input = screen.getByPlaceholderText('Add a new task...')
    await user.click(input)
    await user.type(input, 'Test task')

    const autoFillButton = screen.getByText('Auto fill')
    await user.click(autoFillButton)

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled()
    })

    // Button should return to normal state
    expect(screen.getByText('Auto fill')).toBeInTheDocument()

    consoleSpy.mockRestore()
  })

  it('should override existing description when Auto fill is clicked', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValueOnce({
      json: async () => ({
        success: true,
        description: 'New AI-generated description',
      }),
    })

    render(<AddTodo />)

    const input = screen.getByPlaceholderText('Add a new task...')
    await user.click(input)
    await user.type(input, 'Test task')

    // Type something in description first
    const textarea = screen.getByPlaceholderText('Description (optional)')
    await user.type(textarea, 'My manual description')
    expect(textarea).toHaveValue('My manual description')

    // Click Auto fill
    const autoFillButton = screen.getByText('Auto fill')
    await user.click(autoFillButton)

    await waitFor(() => {
      expect(textarea).toHaveValue('New AI-generated description')
    })
  })
})
