# Technical Documentation

## I Do - AI-Powered To-Do Application

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Architecture Overview](#architecture-overview)
3. [API Reference](#api-reference)
4. [Database Schema](#database-schema)
5. [Authentication Flow](#authentication-flow)
6. [State Management](#state-management)
7. [AI Integration](#ai-integration)
8. [Component Structure](#component-structure)
9. [Environment Variables](#environment-variables)
10. [Data Flow Diagrams](#data-flow-diagrams)

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | PostgreSQL (via Supabase) |
| Authentication | Supabase Auth |
| AI Provider | OpenAI (GPT-4o-mini) |
| Observability | Langfuse |
| Drag & Drop | @dnd-kit |
| Testing | Vitest + React Testing Library |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  AuthContext │  │ TodoContext │  │      Components         │  │
│  │  (Auth State)│  │(Task State) │  │ AddTodo, TodoItem, etc. │  │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘  │
└─────────┼────────────────┼─────────────────────┼────────────────┘
          │                │                     │
          ▼                ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                      NEXT.JS SERVER                              │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────────────┐  ┌─────────────────┐  │
│  │ Middleware  │  │    API Routes       │  │   Supabase      │  │
│  │ (Auth Check)│  │ /api/ai/*           │  │   Client        │  │
│  └─────────────┘  └──────────┬──────────┘  └────────┬────────┘  │
└──────────────────────────────┼──────────────────────┼───────────┘
                               │                      │
          ┌────────────────────┼──────────────────────┤
          ▼                    ▼                      ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐
│     OpenAI      │  │    Langfuse     │  │      Supabase       │
│   (GPT-4o-mini) │  │  (Observability)│  │  (Auth + Database)  │
└─────────────────┘  └─────────────────┘  └─────────────────────┘
```

---

## API Reference

### AI Endpoints

#### POST `/api/ai/generate-description`

Generate an AI-powered task description from a title.

**Request:**
```typescript
{
  title: string;       // Required - Task title
  category?: string;   // Optional - Task category for context
  userId?: string;     // Optional - User ID for Langfuse tracking
}
```

**Response (200):**
```typescript
{
  success: true;
  description: string;  // AI-generated 1-2 sentence description
  model: string;        // Model used (e.g., "gpt-4o-mini")
}
```

**Error Responses:**
| Status | Description |
|--------|-------------|
| 400 | Missing or invalid title |
| 401 | Invalid OpenAI API key |
| 429 | Rate limit exceeded |
| 500 | Server error |
| 503 | OpenAI not configured |

**Example:**
```bash
curl -X POST /api/ai/generate-description \
  -H "Content-Type: application/json" \
  -d '{"title": "Buy groceries", "category": "shopping"}'
```

---

#### POST `/api/ai/parse-task`

Parse natural language input into structured task data.

**Request:**
```typescript
{
  input: string;     // Natural language task description
  userId?: string;   // Optional - User ID for tracking
}
```

**Response (200):**
```typescript
{
  success: boolean;
  input: string;
  response: string;
  model: string;
  langfuseEnabled: boolean;
}
```

---

### Auth Endpoints

#### GET `/auth/callback`

OAuth callback handler for Supabase authentication.

**Query Parameters:**
| Param | Description |
|-------|-------------|
| `code` | OAuth code from Supabase |
| `next` | Redirect path (default: "/") |
| `type` | "recovery" for password reset flow |

---

## Database Schema

### Tasks Table

```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT false,
  priority TEXT CHECK (priority IN ('high', 'medium', 'low')) DEFAULT 'medium',
  due_date DATE,
  category TEXT CHECK (category IN ('work', 'personal', 'shopping', 'health')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  position INTEGER DEFAULT 0
);

-- Row Level Security
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Users can only access their own tasks
CREATE POLICY "Users can CRUD own tasks" ON tasks
  FOR ALL USING (auth.uid() = user_id);
```

### TypeScript Interface

```typescript
interface Todo {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  dueDate?: string;
  category?: 'work' | 'personal' | 'shopping' | 'health';
  createdAt: string;
  position: number;
}
```

---

## Authentication Flow

### Sign Up Flow
```
User enters email/password
        ↓
Password validation (8+ chars, uppercase, lowercase, number)
        ↓
supabase.auth.signUp()
        ↓
Email confirmation sent
        ↓
User clicks link → /auth/callback
        ↓
Session created → Redirect to /
```

### Sign In Flow
```
User enters credentials
        ↓
supabase.auth.signInWithPassword()
        ↓
Session stored in cookies
        ↓
Redirect to /
```

### Password Reset Flow
```
User enters email on /auth/forgot-password
        ↓
supabase.auth.resetPasswordForEmail()
        ↓
Reset email sent with link
        ↓
User clicks → /auth/callback?type=recovery
        ↓
Redirect to /auth/reset-password
        ↓
User enters new password
        ↓
supabase.auth.updateUser()
        ↓
Redirect to /
```

### Middleware Protection

```typescript
// Protected routes: Require authentication
// - / (home)
// - All non-auth routes

// Public routes: No authentication required
// - /auth/login
// - /auth/signup
// - /auth/forgot-password
// - /auth/confirm
// - /auth/callback
// - /auth/reset-password
```

---

## State Management

### AuthContext

Manages authentication state across the application.

```typescript
interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isRecoveryMode: boolean;
  signUp: (email: string, password: string) => Promise<AuthResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<AuthResult>;
  updatePassword: (newPassword: string) => Promise<AuthResult>;
}
```

### TodoContext

Manages task state with optimistic updates.

```typescript
interface TodoContextType {
  todos: Todo[];
  filter: 'all' | 'active' | 'completed';
  categoryFilter: Category | 'all';
  sortBy: 'manual' | 'dueDate' | 'priority';
  isLoading: boolean;
  error: string | null;

  // CRUD Operations
  addTodo: (todo: Omit<Todo, 'id' | 'createdAt' | 'position'>) => Promise<void>;
  updateTodo: (id: string, updates: Partial<Todo>) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
  toggleComplete: (id: string) => Promise<void>;
  reorderTodos: (activeId: string, overId: string) => Promise<void>;

  // Filters
  setFilter: (filter: FilterStatus) => void;
  setCategoryFilter: (category: Category | 'all') => void;
  setSortBy: (sort: SortOption) => void;

  // Computed
  filteredTodos: Todo[];
  counts: { all: number; active: number; completed: number };
}
```

### Optimistic Updates Pattern

```typescript
// 1. Store previous state
const previousTodos = [...todos];

// 2. Update UI immediately
setTodos(newTodos);

// 3. Make API call
try {
  await updateTask(supabase, id, updates);
} catch (error) {
  // 4. Rollback on error
  setTodos(previousTodos);
  throw error;
}
```

---

## AI Integration

### Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│  Component  │────▶│  API Route       │────▶│   OpenAI    │
│  (Client)   │     │  (Server)        │     │   API       │
└─────────────┘     └────────┬─────────┘     └─────────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │    Langfuse      │
                    │  (Observability) │
                    └──────────────────┘
```

### OpenAI Client (`/lib/openai/client.ts`)

```typescript
// Available models
const OPENAI_MODELS = {
  GPT_4O: 'gpt-4o',           // Full capability
  GPT_4O_MINI: 'gpt-4o-mini'  // Default - faster, cheaper
};

// Functions
getOpenAIClient(): OpenAI       // Get singleton client
isOpenAIConfigured(): boolean   // Check if API key exists
```

### Langfuse Integration (`/lib/langfuse/openai.ts`)

```typescript
// Wrap OpenAI with observability
getTracedOpenAI(options: {
  userId?: string;
  sessionId?: string;
  traceName?: string;
  metadata?: Record<string, unknown>;
  tags?: string[];
}): OpenAI

// Check configuration
isLangfuseConfigured(): boolean

// Flush events (critical for serverless)
flushLangfuse(): Promise<void>
```

### Prompt Engineering

**Description Generation System Prompt:**
```
You are a productivity assistant that helps create actionable task descriptions.
Given a task title, generate a concise 1-2 sentence description that:
- Clarifies what needs to be done
- Suggests specific first steps or key actions
- Is practical and actionable
- Is appropriate for the "{category}" category (if provided)

Do not include the task title in your description. Be direct and specific.
```

**Parameters:**
- Model: `gpt-4o-mini`
- Temperature: `0.7` (balanced creativity)
- Max tokens: `100` (concise output)

---

## Component Structure

```
components/
├── AddTodo.tsx          # Task creation form with AI auto-fill
├── TodoItem.tsx         # Individual task with edit/delete/complete
├── TodoList.tsx         # Drag-and-drop task list
├── FilterBar.tsx        # Status/category/sort filters
├── UserMenu.tsx         # User dropdown with sign out
└── auth/
    ├── LoginForm.tsx
    ├── SignupForm.tsx
    ├── ForgotPasswordForm.tsx
    ├── ResetPasswordForm.tsx
    ├── PasswordInput.tsx
    ├── PasswordStrength.tsx
    └── AuthError.tsx
```

### Key Component Features

| Component | Features |
|-----------|----------|
| AddTodo | Expandable form, AI description generation, keyboard shortcuts |
| TodoItem | Inline editing, drag handle, priority badges, overdue indicator |
| TodoList | @dnd-kit integration, keyboard/pointer sensors, empty state |
| FilterBar | Status tabs with counts, category dropdown, sort options |

---

## Environment Variables

### Required

```bash
# Supabase (required for app to function)
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# OpenAI (required for AI features)
OPENAI_API_KEY=sk-...
```

### Optional

```bash
# Langfuse (for AI observability)
LANGFUSE_PUBLIC_KEY=pk-lf-...
LANGFUSE_SECRET_KEY=sk-lf-...
LANGFUSE_BASEURL=https://cloud.langfuse.com  # Default
```

### Variable Exposure

| Prefix | Exposure | Use Case |
|--------|----------|----------|
| `NEXT_PUBLIC_` | Client + Server | Supabase connection |
| None | Server only | API keys, secrets |

---

## Data Flow Diagrams

### Task Creation with AI Description

```
┌─────────────────────────────────────────────────────────────────┐
│                        AddTodo Component                         │
└───────────────────────────────┬─────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
┌───────────────┐      ┌───────────────┐      ┌───────────────┐
│ User enters   │      │ Click "Auto   │      │ User clicks   │
│ task title    │      │ fill" button  │      │ "Add Task"    │
└───────────────┘      └───────┬───────┘      └───────┬───────┘
                               │                      │
                               ▼                      │
                    ┌─────────────────────┐           │
                    │ POST /api/ai/       │           │
                    │ generate-description│           │
                    └──────────┬──────────┘           │
                               │                      │
                               ▼                      │
                    ┌─────────────────────┐           │
                    │ OpenAI generates    │           │
                    │ description         │           │
                    └──────────┬──────────┘           │
                               │                      │
                               ▼                      │
                    ┌─────────────────────┐           │
                    │ Description fills   │           │
                    │ textarea            │           │
                    └─────────────────────┘           │
                                                      │
                               ┌──────────────────────┘
                               ▼
                    ┌─────────────────────┐
                    │ TodoContext.addTodo │
                    └──────────┬──────────┘
                               │
              ┌────────────────┴────────────────┐
              ▼                                 ▼
    ┌─────────────────┐              ┌─────────────────┐
    │ Optimistic UI   │              │ Supabase insert │
    │ update          │              │ (async)         │
    └─────────────────┘              └────────┬────────┘
                                              │
                                              ▼
                                   ┌─────────────────────┐
                                   │ Replace optimistic  │
                                   │ with real data      │
                                   └─────────────────────┘
```

### Authentication Session Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Browser    │────▶│  Middleware  │────▶│  Supabase    │
│   Request    │     │  (Session    │     │  Auth        │
│              │     │   Check)     │     │              │
└──────────────┘     └──────┬───────┘     └──────────────┘
                            │
           ┌────────────────┼────────────────┐
           ▼                ▼                ▼
    ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
    │ No Session  │  │ Valid       │  │ Auth Page + │
    │ + Protected │  │ Session     │  │ Valid       │
    │ Route       │  │             │  │ Session     │
    └──────┬──────┘  └──────┬──────┘  └──────┬──────┘
           │                │                │
           ▼                ▼                ▼
    ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
    │ Redirect to │  │ Continue to │  │ Redirect to │
    │ /auth/login │  │ requested   │  │ / (home)    │
    │             │  │ page        │  │             │
    └─────────────┘  └─────────────┘  └─────────────┘
```

---

## File Structure

```
ai-todo-app/
├── app/
│   ├── api/
│   │   └── ai/
│   │       ├── generate-description/route.ts
│   │       └── parse-task/route.ts
│   ├── auth/
│   │   ├── callback/route.ts
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   ├── reset-password/page.tsx
│   │   ├── confirm/page.tsx
│   │   └── layout.tsx
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── AddTodo.tsx
│   ├── TodoItem.tsx
│   ├── TodoList.tsx
│   ├── FilterBar.tsx
│   ├── UserMenu.tsx
│   └── auth/
├── context/
│   ├── AuthContext.tsx
│   └── TodoContext.tsx
├── lib/
│   ├── openai/
│   │   └── client.ts
│   ├── langfuse/
│   │   ├── client.ts
│   │   └── openai.ts
│   └── supabase/
│       ├── client.ts
│       ├── server.ts
│       ├── middleware.ts
│       └── tasks.ts
├── types/
│   ├── todo.ts
│   └── auth.ts
├── __tests__/
│   ├── api/
│   └── components/
└── middleware.ts
```

---

## Testing

### Test Structure

```bash
__tests__/
├── api/
│   └── generate-description.test.ts  # API endpoint tests
├── components/
│   ├── AddTodo.test.tsx              # Component tests
│   └── TodoItem.test.tsx             # Component tests
└── example.test.ts                   # Type tests
```

### Running Tests

```bash
npm run test        # Watch mode
npm run test:run    # Single run
npm run test:coverage  # With coverage
```

### Test Coverage

- **API Tests**: Request validation, error handling, success responses
- **Component Tests**: User interactions, loading states, API calls
- **35 total tests** covering core functionality

---

## Deployment

### Vercel Configuration

1. Connect GitHub repository
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main

### Required Vercel Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `OPENAI_API_KEY`
- `LANGFUSE_PUBLIC_KEY` (optional)
- `LANGFUSE_SECRET_KEY` (optional)
- `LANGFUSE_BASEURL` (optional)

---

## Graceful Degradation

The application handles missing configurations gracefully:

| Missing | Behavior |
|---------|----------|
| Supabase | App won't function (required) |
| OpenAI | AI features disabled, manual entry works |
| Langfuse | No observability, AI features still work |

---

## Security Considerations

1. **API Keys**: Server-side only, never exposed to client
2. **Row Level Security**: Users can only access their own tasks
3. **Password Requirements**: Enforced client and server side
4. **Session Management**: HTTP-only cookies, automatic refresh
5. **Input Validation**: All API inputs validated before processing
