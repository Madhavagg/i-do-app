'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { Todo, FilterStatus, Category } from '@/types/todo';
import { useAuth } from './AuthContext';
import { createClient } from '@/lib/supabase/client';
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  updateTaskPositions,
  migrateLocalStorageTasks,
} from '@/lib/supabase/tasks';

export type SortOption = 'manual' | 'dueDate' | 'priority';

interface TodoContextType {
  todos: Todo[];
  filter: FilterStatus;
  categoryFilter: Category | 'all';
  sortBy: SortOption;
  isLoading: boolean;
  error: string | null;
  addTodo: (todo: Omit<Todo, 'id' | 'createdAt' | 'position'>) => Promise<void>;
  updateTodo: (id: string, updates: Partial<Todo>) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
  toggleComplete: (id: string) => Promise<void>;
  setFilter: (filter: FilterStatus) => void;
  setCategoryFilter: (category: Category | 'all') => void;
  setSortBy: (sort: SortOption) => void;
  reorderTodos: (activeId: string, overId: string) => Promise<void>;
  filteredTodos: Todo[];
  counts: { all: number; active: number; completed: number };
  refreshTodos: () => Promise<void>;
}

const TodoContext = createContext<TodoContextType | undefined>(undefined);

const STORAGE_KEY = 'ai-todo-app-todos';
const MIGRATED_KEY = 'ai-todo-app-migrated';

export function TodoProvider({ children }: { children: ReactNode }) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('manual');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user, isLoading: authLoading } = useAuth();
  const supabase = createClient();

  // Load todos from Supabase
  const loadTodos = useCallback(async () => {
    if (!user || !supabase) {
      setTodos([]);
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      const tasks = await getTasks(supabase);
      setTodos(tasks);
    } catch (err) {
      console.error('Failed to load todos:', err);
      setError('Failed to load tasks. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [user, supabase]);

  // Check for localStorage migration
  const checkMigration = useCallback(async () => {
    if (!user || !supabase) return;

    const migrated = localStorage.getItem(MIGRATED_KEY);
    if (migrated) return;

    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(MIGRATED_KEY, 'true');
      return;
    }

    try {
      const localTodos = JSON.parse(stored) as Todo[];
      if (localTodos.length > 0) {
        // Add position to old todos that don't have it
        const todosWithPosition = localTodos.map((todo, index) => ({
          ...todo,
          position: todo.position ?? index,
        }));

        await migrateLocalStorageTasks(supabase, user.id, todosWithPosition);
        console.log('Migrated', localTodos.length, 'tasks from localStorage');
      }

      // Clear localStorage after successful migration
      localStorage.removeItem(STORAGE_KEY);
      localStorage.setItem(MIGRATED_KEY, 'true');

      // Reload todos from database
      await loadTodos();
    } catch (err) {
      console.error('Failed to migrate localStorage tasks:', err);
      // Don't block the app if migration fails
    }
  }, [user, supabase, loadTodos]);

  // Load todos when user changes
  useEffect(() => {
    if (authLoading) return;

    if (user) {
      setIsLoading(true);
      checkMigration().then(() => loadTodos());
    } else {
      setTodos([]);
      setIsLoading(false);
    }
  }, [user, authLoading, checkMigration, loadTodos]);

  // Refresh todos
  const refreshTodos = useCallback(async () => {
    setIsLoading(true);
    await loadTodos();
  }, [loadTodos]);

  // Add todo
  const addTodo = useCallback(async (todoData: Omit<Todo, 'id' | 'createdAt' | 'position'>) => {
    if (!user || !supabase) return;

    // Calculate position (add to beginning)
    const newPosition = todos.length > 0 ? Math.min(...todos.map(t => t.position)) - 1 : 0;

    // Optimistic update
    const optimisticTodo: Todo = {
      ...todoData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      position: newPosition,
    };
    setTodos(prev => [optimisticTodo, ...prev]);

    try {
      const newTodo = await createTask(supabase, todoData, user.id, newPosition);
      // Replace optimistic todo with real one
      setTodos(prev => prev.map(t => t.id === optimisticTodo.id ? newTodo : t));
    } catch (err) {
      console.error('Failed to add todo:', err);
      // Rollback optimistic update
      setTodos(prev => prev.filter(t => t.id !== optimisticTodo.id));
      setError('Failed to add task. Please try again.');
    }
  }, [user, supabase, todos]);

  // Update todo
  const updateTodoFn = useCallback(async (id: string, updates: Partial<Todo>) => {
    if (!supabase) return;

    // Store previous state for rollback
    const previousTodos = todos;

    // Optimistic update
    setTodos(prev =>
      prev.map(todo => (todo.id === id ? { ...todo, ...updates } : todo))
    );

    try {
      await updateTask(supabase, id, updates);
    } catch (err) {
      console.error('Failed to update todo:', err);
      // Rollback
      setTodos(previousTodos);
      setError('Failed to update task. Please try again.');
    }
  }, [supabase, todos]);

  // Delete todo
  const deleteTodoFn = useCallback(async (id: string) => {
    if (!supabase) return;

    // Store previous state for rollback
    const previousTodos = todos;

    // Optimistic update
    setTodos(prev => prev.filter(todo => todo.id !== id));

    try {
      await deleteTask(supabase, id);
    } catch (err) {
      console.error('Failed to delete todo:', err);
      // Rollback
      setTodos(previousTodos);
      setError('Failed to delete task. Please try again.');
    }
  }, [supabase, todos]);

  // Toggle complete
  const toggleComplete = useCallback(async (id: string) => {
    if (!supabase) return;

    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    const previousTodos = todos;
    const newCompleted = !todo.completed;

    // Optimistic update - also move completed to bottom
    setTodos(prev => {
      const updated = prev.map(t =>
        t.id === id ? { ...t, completed: newCompleted } : t
      );
      const active = updated.filter(t => !t.completed);
      const completed = updated.filter(t => t.completed);
      return [...active, ...completed];
    });

    try {
      await updateTask(supabase, id, { completed: newCompleted });
    } catch (err) {
      console.error('Failed to toggle todo:', err);
      setTodos(previousTodos);
      setError('Failed to update task. Please try again.');
    }
  }, [supabase, todos]);

  // Reorder todos
  const reorderTodos = useCallback(async (activeId: string, overId: string) => {
    if (!supabase) return;

    const activeIndex = todos.findIndex(t => t.id === activeId);
    const overIndex = todos.findIndex(t => t.id === overId);
    if (activeIndex === -1 || overIndex === -1) return;

    const previousTodos = todos;

    // Optimistic update
    const newTodos = [...todos];
    const [removed] = newTodos.splice(activeIndex, 1);
    newTodos.splice(overIndex, 0, removed);

    // Update positions
    const updatedTodos = newTodos.map((todo, index) => ({
      ...todo,
      position: index,
    }));
    setTodos(updatedTodos);

    try {
      // Only update positions that changed
      const positionUpdates = updatedTodos
        .filter((todo, index) => previousTodos[index]?.id !== todo.id)
        .map(todo => ({ id: todo.id, position: todo.position }));

      if (positionUpdates.length > 0) {
        await updateTaskPositions(supabase, positionUpdates);
      }
    } catch (err) {
      console.error('Failed to reorder todos:', err);
      setTodos(previousTodos);
      setError('Failed to reorder tasks. Please try again.');
    }
  }, [supabase, todos]);

  const priorityOrder = { high: 0, medium: 1, low: 2 };

  const filteredTodos = useMemo(() => {
    let result = todos.filter(todo => {
      // Status filter
      if (filter === 'active' && todo.completed) return false;
      if (filter === 'completed' && !todo.completed) return false;

      // Category filter
      if (categoryFilter !== 'all' && todo.category !== categoryFilter) return false;

      return true;
    });

    // Apply sorting
    if (sortBy === 'dueDate') {
      result = [...result].sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
    } else if (sortBy === 'priority') {
      result = [...result].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    } else {
      // Manual sort by position
      result = [...result].sort((a, b) => a.position - b.position);
    }

    // Always keep completed at bottom when sorted
    if (sortBy !== 'manual') {
      const active = result.filter(t => !t.completed);
      const completed = result.filter(t => t.completed);
      result = [...active, ...completed];
    }

    return result;
  }, [todos, filter, categoryFilter, sortBy]);

  const counts = useMemo(() => ({
    all: todos.length,
    active: todos.filter(t => !t.completed).length,
    completed: todos.filter(t => t.completed).length,
  }), [todos]);

  return (
    <TodoContext.Provider
      value={{
        todos,
        filter,
        categoryFilter,
        sortBy,
        isLoading,
        error,
        addTodo,
        updateTodo: updateTodoFn,
        deleteTodo: deleteTodoFn,
        toggleComplete,
        setFilter,
        setCategoryFilter,
        setSortBy,
        reorderTodos,
        filteredTodos,
        counts,
        refreshTodos,
      }}
    >
      {children}
    </TodoContext.Provider>
  );
}

export function useTodos() {
  const context = useContext(TodoContext);
  if (context === undefined) {
    throw new Error('useTodos must be used within a TodoProvider');
  }
  return context;
}
