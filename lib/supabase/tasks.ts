import { SupabaseClient } from '@supabase/supabase-js'
import { Todo, Priority, Category } from '@/types/todo'

// Database row type
export interface TaskRow {
  id: string
  user_id: string
  title: string
  description: string | null
  completed: boolean
  priority: Priority
  due_date: string | null
  category: Category | null
  created_at: string
  updated_at: string
  position: number
}

// Convert database row to client Todo
export function taskRowToTodo(row: TaskRow): Todo {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    completed: row.completed,
    priority: row.priority,
    dueDate: row.due_date ?? undefined,
    category: row.category ?? undefined,
    createdAt: row.created_at,
    position: row.position,
  }
}

// Convert client Todo to database insert/update
export function todoToTaskRow(
  todo: Omit<Todo, 'id' | 'createdAt'>,
  userId: string,
  position: number
): Omit<TaskRow, 'id' | 'created_at' | 'updated_at'> {
  return {
    user_id: userId,
    title: todo.title,
    description: todo.description ?? null,
    completed: todo.completed,
    priority: todo.priority,
    due_date: todo.dueDate ?? null,
    category: todo.category ?? null,
    position,
  }
}

// Fetch all tasks for current user
export async function getTasks(supabase: SupabaseClient): Promise<Todo[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('position', { ascending: true })

  if (error) {
    console.error('Error fetching tasks:', error)
    throw error
  }

  return (data as TaskRow[]).map(taskRowToTodo)
}

// Create a new task
export async function createTask(
  supabase: SupabaseClient,
  todo: Omit<Todo, 'id' | 'createdAt' | 'position'>,
  userId: string,
  position: number
): Promise<Todo> {
  const taskData = todoToTaskRow({ ...todo, position }, userId, position)

  const { data, error } = await supabase
    .from('tasks')
    .insert(taskData)
    .select()
    .single()

  if (error) {
    console.error('Error creating task:', error)
    throw error
  }

  return taskRowToTodo(data as TaskRow)
}

// Update an existing task
export async function updateTask(
  supabase: SupabaseClient,
  id: string,
  updates: Partial<Todo>
): Promise<Todo> {
  // Convert client updates to database format
  const dbUpdates: Partial<TaskRow> = {}

  if (updates.title !== undefined) dbUpdates.title = updates.title
  if (updates.description !== undefined) dbUpdates.description = updates.description ?? null
  if (updates.completed !== undefined) dbUpdates.completed = updates.completed
  if (updates.priority !== undefined) dbUpdates.priority = updates.priority
  if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate ?? null
  if (updates.category !== undefined) dbUpdates.category = updates.category ?? null
  if (updates.position !== undefined) dbUpdates.position = updates.position

  const { data, error } = await supabase
    .from('tasks')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating task:', error)
    throw error
  }

  return taskRowToTodo(data as TaskRow)
}

// Delete a task
export async function deleteTask(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting task:', error)
    throw error
  }
}

// Update positions for multiple tasks (for reordering)
export async function updateTaskPositions(
  supabase: SupabaseClient,
  updates: { id: string; position: number }[]
): Promise<void> {
  // Use Promise.all to update all positions
  const promises = updates.map(({ id, position }) =>
    supabase
      .from('tasks')
      .update({ position })
      .eq('id', id)
  )

  const results = await Promise.all(promises)

  const errors = results.filter(r => r.error)
  if (errors.length > 0) {
    console.error('Error updating task positions:', errors)
    throw errors[0].error
  }
}

// Migrate tasks from localStorage to Supabase
export async function migrateLocalStorageTasks(
  supabase: SupabaseClient,
  userId: string,
  localTodos: Todo[]
): Promise<Todo[]> {
  if (localTodos.length === 0) return []

  const tasksToInsert = localTodos.map((todo, index) => ({
    user_id: userId,
    title: todo.title,
    description: todo.description ?? null,
    completed: todo.completed,
    priority: todo.priority,
    due_date: todo.dueDate ?? null,
    category: todo.category ?? null,
    position: index,
  }))

  const { data, error } = await supabase
    .from('tasks')
    .insert(tasksToInsert)
    .select()

  if (error) {
    console.error('Error migrating tasks:', error)
    throw error
  }

  return (data as TaskRow[]).map(taskRowToTodo)
}
