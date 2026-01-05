import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Initialize Supabase admin client (server-side only)
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase configuration missing');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Validate API key and return user ID
async function validateApiKey(apiKey: string): Promise<{ userId: string } | null> {
  if (!apiKey || !apiKey.startsWith('mcp_')) {
    return null;
  }

  const supabase = getSupabaseAdmin();
  const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

  const { data, error } = await supabase
    .from('api_keys')
    .select('user_id, is_active')
    .eq('key_hash', keyHash)
    .single();

  if (error || !data || !data.is_active) {
    return null;
  }

  // Update last_used_at
  await supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('key_hash', keyHash);

  return { userId: data.user_id };
}

// Extract API key from Authorization header
function getApiKeyFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return null;

  // Support both "Bearer <key>" and just "<key>"
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  return authHeader;
}

// GET /api/mcp/tasks - List tasks
export async function GET(request: NextRequest) {
  try {
    const apiKey = getApiKeyFromRequest(request);
    if (!apiKey) {
      return NextResponse.json({ error: 'API key required' }, { status: 401 });
    }

    const auth = await validateApiKey(apiKey);
    if (!auth) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);

    // Build query with filters
    let query = supabase
      .from('tasks')
      .select('*')
      .eq('user_id', auth.userId)
      .order('position', { ascending: true });

    // Apply filters
    const status = searchParams.get('status');
    if (status === 'active') {
      query = query.eq('completed', false);
    } else if (status === 'completed') {
      query = query.eq('completed', true);
    }

    const priority = searchParams.get('priority');
    if (priority) {
      query = query.eq('priority', priority);
    }

    const category = searchParams.get('category');
    if (category) {
      query = query.eq('category', category);
    }

    const limit = searchParams.get('limit');
    if (limit) {
      query = query.limit(parseInt(limit, 10));
    } else {
      query = query.limit(50);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching tasks:', error);
      return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
    }

    // Convert to client format
    const tasks = data.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      completed: row.completed,
      priority: row.priority,
      dueDate: row.due_date,
      category: row.category,
      createdAt: row.created_at,
    }));

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('Error in GET /api/mcp/tasks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/mcp/tasks - Create a new task
export async function POST(request: NextRequest) {
  try {
    const apiKey = getApiKeyFromRequest(request);
    if (!apiKey) {
      return NextResponse.json({ error: 'API key required' }, { status: 401 });
    }

    const auth = await validateApiKey(apiKey);
    if (!auth) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, due_date, priority, category } = body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Get next position (add to beginning)
    const { data: existingTasks } = await supabase
      .from('tasks')
      .select('position')
      .eq('user_id', auth.userId)
      .order('position', { ascending: true })
      .limit(1);

    const position = existingTasks && existingTasks.length > 0 ? existingTasks[0].position - 1 : 0;

    // Create task
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        user_id: auth.userId,
        title: title.trim(),
        description: description || null,
        completed: false,
        priority: priority || 'medium',
        due_date: due_date || null,
        category: category || null,
        position,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating task:', error);
      return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
    }

    return NextResponse.json({
      task: {
        id: data.id,
        title: data.title,
        description: data.description,
        completed: data.completed,
        priority: data.priority,
        dueDate: data.due_date,
        category: data.category,
        createdAt: data.created_at,
      },
    });
  } catch (error) {
    console.error('Error in POST /api/mcp/tasks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/mcp/tasks - Update a task (complete/uncomplete)
export async function PATCH(request: NextRequest) {
  try {
    const apiKey = getApiKeyFromRequest(request);
    if (!apiKey) {
      return NextResponse.json({ error: 'API key required' }, { status: 401 });
    }

    const auth = await validateApiKey(apiKey);
    if (!auth) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }

    const body = await request.json();
    const { task_id, completed } = body;

    if (!task_id) {
      return NextResponse.json({ error: 'task_id is required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Update task (with user_id check)
    const { data, error } = await supabase
      .from('tasks')
      .update({ completed: completed ?? true })
      .eq('id', task_id)
      .eq('user_id', auth.userId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 });
      }
      console.error('Error updating task:', error);
      return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
    }

    return NextResponse.json({
      task: {
        id: data.id,
        title: data.title,
        completed: data.completed,
      },
    });
  } catch (error) {
    console.error('Error in PATCH /api/mcp/tasks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
