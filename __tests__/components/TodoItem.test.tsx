import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TodoItem from '@/components/TodoItem'
import { Todo } from '@/types/todo'

// Mock the contexts
const mockUpdateTodo = vi.fn()
const mockDeleteTodo = vi.fn()
const mockToggleComplete = vi.fn()
const mockUser = { id: 'user-456' }

vi.mock('@/context/TodoContext', () => ({
  useTodos: () => ({
    updateTodo: mockUpdateTodo,
    deleteTodo: mockDeleteTodo,
    toggleComplete: mockToggleComplete,
  }),
}))

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
  }),
}))

// Mock dnd-kit
vi.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
}))

vi.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Transform: {
      toString: () => null,
    },
  },
}))

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

const mockTodo: Todo = {
  id: 'todo-1',
  title: 'Test Task',
  description: 'Original description',
  completed: false,
  priority: 'medium',
  category: 'work',
  createdAt: '2024-01-01T00:00:00.000Z',
  position: 0,
}

describe('TodoItem Component - Auto Fill Feature', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
  })

  it('should show Auto fill button in edit mode', async () => {
    const user = userEvent.setup()
    render(<TodoItem todo={mockTodo} />)

    // Click edit button to enter edit mode
    const editButton = screen.getByTitle('Edit')
    await user.click(editButton)

    // Check if Auto fill button is visible
    expect(screen.getByText('Auto fill')).toBeInTheDocument()
  })

  it('should disable Auto fill button when edit title is empty', async () => {
    const user = userEvent.setup()
    render(<TodoItem todo={mockTodo} />)

    const editButton = screen.getByTitle('Edit')
    await user.click(editButton)

    // Clear the title
    const titleInput = screen.getByDisplayValue('Test Task')
    await user.clear(titleInput)

    const autoFillButton = screen.getByTitle('Enter a task title first')
    expect(autoFillButton).toBeDisabled()
  })

  it('should enable Auto fill button when edit title has value', async () => {
    const user = userEvent.setup()
    render(<TodoItem todo={mockTodo} />)

    const editButton = screen.getByTitle('Edit')
    await user.click(editButton)

    const autoFillButton = screen.getByTitle('Generate description with AI')
    expect(autoFillButton).not.toBeDisabled()
  })

  it('should call API with correct parameters when Auto fill is clicked', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValueOnce({
      json: async () => ({
        success: true,
        description: 'AI generated description for editing',
      }),
    })

    render(<TodoItem todo={mockTodo} />)

    const editButton = screen.getByTitle('Edit')
    await user.click(editButton)

    const autoFillButton = screen.getByText('Auto fill')
    await user.click(autoFillButton)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/ai/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Test Task',
          category: 'work',
          userId: 'user-456',
        }),
      })
    })
  })

  it('should update description field with AI response', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValueOnce({
      json: async () => ({
        success: true,
        description: 'New AI description',
      }),
    })

    render(<TodoItem todo={mockTodo} />)

    const editButton = screen.getByTitle('Edit')
    await user.click(editButton)

    const autoFillButton = screen.getByText('Auto fill')
    await user.click(autoFillButton)

    await waitFor(() => {
      const textarea = screen.getByPlaceholderText('Description (optional)')
      expect(textarea).toHaveValue('New AI description')
    })
  })

  it('should show loading state while generating in edit mode', async () => {
    const user = userEvent.setup()

    let resolvePromise: (value: any) => void
    const pendingPromise = new Promise((resolve) => {
      resolvePromise = resolve
    })

    mockFetch.mockReturnValueOnce(pendingPromise)

    render(<TodoItem todo={mockTodo} />)

    const editButton = screen.getByTitle('Edit')
    await user.click(editButton)

    const autoFillButton = screen.getByText('Auto fill')
    await user.click(autoFillButton)

    expect(screen.getByText('Generating...')).toBeInTheDocument()

    resolvePromise!({
      json: async () => ({ success: true, description: 'Done' }),
    })

    await waitFor(() => {
      expect(screen.getByText('Auto fill')).toBeInTheDocument()
    })
  })

  it('should use updated title when generating description', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValueOnce({
      json: async () => ({
        success: true,
        description: 'Description for updated task',
      }),
    })

    render(<TodoItem todo={mockTodo} />)

    const editButton = screen.getByTitle('Edit')
    await user.click(editButton)

    // Change the title
    const titleInput = screen.getByDisplayValue('Test Task')
    await user.clear(titleInput)
    await user.type(titleInput, 'Updated Task Title')

    const autoFillButton = screen.getByText('Auto fill')
    await user.click(autoFillButton)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/ai/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Updated Task Title',
          category: 'work',
          userId: 'user-456',
        }),
      })
    })
  })

  it('should use updated category when generating description', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValueOnce({
      json: async () => ({
        success: true,
        description: 'Personal task description',
      }),
    })

    render(<TodoItem todo={mockTodo} />)

    const editButton = screen.getByTitle('Edit')
    await user.click(editButton)

    // Change the category - find by current value
    const categorySelects = screen.getAllByRole('combobox')
    const categorySelect = categorySelects.find(s => (s as HTMLSelectElement).value === 'work')
    if (categorySelect) {
      await user.selectOptions(categorySelect, 'personal')
    }

    const autoFillButton = screen.getByText('Auto fill')
    await user.click(autoFillButton)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/ai/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Test Task',
          category: 'personal',
          userId: 'user-456',
        }),
      })
    })
  })

  it('should handle API error in edit mode gracefully', async () => {
    const user = userEvent.setup()
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    mockFetch.mockResolvedValueOnce({
      json: async () => ({
        success: false,
        error: 'Service error',
      }),
    })

    render(<TodoItem todo={mockTodo} />)

    const editButton = screen.getByTitle('Edit')
    await user.click(editButton)

    const autoFillButton = screen.getByText('Auto fill')
    await user.click(autoFillButton)

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to generate description:', 'Service error')
    })

    expect(screen.getByText('Auto fill')).toBeInTheDocument()

    consoleSpy.mockRestore()
  })

  it('should not show Auto fill button when not in edit mode', () => {
    render(<TodoItem todo={mockTodo} />)

    expect(screen.queryByText('Auto fill')).not.toBeInTheDocument()
  })

  it('should override existing description in edit mode', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValueOnce({
      json: async () => ({
        success: true,
        description: 'Completely new description',
      }),
    })

    render(<TodoItem todo={mockTodo} />)

    const editButton = screen.getByTitle('Edit')
    await user.click(editButton)

    // Verify original description is there
    const textarea = screen.getByPlaceholderText('Description (optional)')
    expect(textarea).toHaveValue('Original description')

    const autoFillButton = screen.getByText('Auto fill')
    await user.click(autoFillButton)

    await waitFor(() => {
      expect(textarea).toHaveValue('Completely new description')
    })
  })
})
