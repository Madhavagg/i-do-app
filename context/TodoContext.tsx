'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { Todo, FilterStatus, Category } from '@/types/todo';

export type SortOption = 'manual' | 'dueDate' | 'priority';

interface TodoContextType {
  todos: Todo[];
  filter: FilterStatus;
  categoryFilter: Category | 'all';
  sortBy: SortOption;
  addTodo: (todo: Omit<Todo, 'id' | 'createdAt'>) => void;
  updateTodo: (id: string, updates: Partial<Todo>) => void;
  deleteTodo: (id: string) => void;
  toggleComplete: (id: string) => void;
  setFilter: (filter: FilterStatus) => void;
  setCategoryFilter: (category: Category | 'all') => void;
  setSortBy: (sort: SortOption) => void;
  reorderTodos: (activeId: string, overId: string) => void;
  filteredTodos: Todo[];
  counts: { all: number; active: number; completed: number };
}

const TodoContext = createContext<TodoContextType | undefined>(undefined);

const STORAGE_KEY = 'ai-todo-app-todos';

export function TodoProvider({ children }: { children: ReactNode }) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('manual');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setTodos(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse stored todos:', e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    }
  }, [todos, isLoaded]);

  const addTodo = (todoData: Omit<Todo, 'id' | 'createdAt'>) => {
    const newTodo: Todo = {
      ...todoData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setTodos(prev => [newTodo, ...prev]);
  };

  const updateTodo = (id: string, updates: Partial<Todo>) => {
    setTodos(prev =>
      prev.map(todo => (todo.id === id ? { ...todo, ...updates } : todo))
    );
  };

  const deleteTodo = (id: string) => {
    setTodos(prev => prev.filter(todo => todo.id !== id));
  };

  const toggleComplete = (id: string) => {
    setTodos(prev => {
      const updated = prev.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      );
      // Move completed tasks to bottom
      const active = updated.filter(t => !t.completed);
      const completed = updated.filter(t => t.completed);
      return [...active, ...completed];
    });
  };

  const reorderTodos = (activeId: string, overId: string) => {
    setTodos(prev => {
      const activeIndex = prev.findIndex(t => t.id === activeId);
      const overIndex = prev.findIndex(t => t.id === overId);
      if (activeIndex === -1 || overIndex === -1) return prev;

      const newTodos = [...prev];
      const [removed] = newTodos.splice(activeIndex, 1);
      newTodos.splice(overIndex, 0, removed);
      return newTodos;
    });
  };

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
    }

    // Always keep completed at bottom when sorted
    if (sortBy !== 'manual') {
      const active = result.filter(t => !t.completed);
      const completed = result.filter(t => t.completed);
      result = [...active, ...completed];
    }

    return result;
  }, [todos, filter, categoryFilter, sortBy]);

  const counts = {
    all: todos.length,
    active: todos.filter(t => !t.completed).length,
    completed: todos.filter(t => t.completed).length,
  };

  return (
    <TodoContext.Provider
      value={{
        todos,
        filter,
        categoryFilter,
        sortBy,
        addTodo,
        updateTodo,
        deleteTodo,
        toggleComplete,
        setFilter,
        setCategoryFilter,
        setSortBy,
        reorderTodos,
        filteredTodos,
        counts,
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
