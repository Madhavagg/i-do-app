#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
// Configuration
const API_BASE_URL = process.env.IDO_API_URL || 'https://transferme-gohighlevel.uk';
const API_KEY = process.env.IDO_API_KEY;
if (!API_KEY) {
    console.error('ERROR: IDO_API_KEY environment variable is required');
    process.exit(1);
}
// Initialize MCP server
const server = new McpServer({
    name: 'ido-mcp-server',
    version: '1.0.0',
});
// Helper function to make API calls
async function apiCall(method, endpoint, body) {
    try {
        const url = `${API_BASE_URL}${endpoint}`;
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${API_KEY}`,
            },
        };
        if (body) {
            options.body = JSON.stringify(body);
        }
        const response = await fetch(url, options);
        const data = (await response.json());
        if (!response.ok) {
            return { ok: false, error: data.error || `HTTP ${response.status}` };
        }
        return { ok: true, data };
    }
    catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : 'Network error' };
    }
}
// ============================================================================
// Tool: create_task
// ============================================================================
server.tool('create_task', 'Create a new task in your I do todo list', {
    title: z
        .string()
        .min(1, 'Title is required')
        .max(200, 'Title must be 200 characters or less')
        .describe('The title of the task'),
    description: z
        .string()
        .max(1000, 'Description must be 1000 characters or less')
        .optional()
        .describe('Optional detailed description of the task'),
    due_date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
        .optional()
        .describe('Optional due date in YYYY-MM-DD format (e.g., 2025-01-15)'),
    priority: z
        .enum(['high', 'medium', 'low'])
        .default('medium')
        .describe('Task priority level: high, medium, or low'),
    category: z
        .enum(['work', 'personal', 'shopping', 'health'])
        .optional()
        .describe('Optional task category: work, personal, shopping, or health'),
}, async (args) => {
    const result = await apiCall('POST', '/api/mcp/tasks', {
        title: args.title,
        description: args.description,
        due_date: args.due_date,
        priority: args.priority,
        category: args.category,
    });
    if (!result.ok) {
        return {
            content: [{ type: 'text', text: `Error creating task: ${result.error}` }],
            isError: true,
        };
    }
    const task = result.data?.task;
    const details = [
        `ID: ${task.id}`,
        `Priority: ${task.priority}`,
        task.category ? `Category: ${task.category}` : null,
        task.dueDate ? `Due: ${task.dueDate}` : null,
        task.description ? `Description: ${task.description}` : null,
    ]
        .filter(Boolean)
        .join('\n');
    return {
        content: [
            {
                type: 'text',
                text: `Created task: "${task.title}"\n\n${details}`,
            },
        ],
    };
});
// ============================================================================
// Tool: list_tasks
// ============================================================================
server.tool('list_tasks', 'List your tasks from I do with optional filters', {
    status: z
        .enum(['all', 'active', 'completed'])
        .default('all')
        .describe('Filter by task completion status'),
    priority: z.enum(['high', 'medium', 'low']).optional().describe('Filter by priority level'),
    category: z
        .enum(['work', 'personal', 'shopping', 'health'])
        .optional()
        .describe('Filter by category'),
    limit: z
        .number()
        .int()
        .min(1)
        .max(100)
        .default(50)
        .describe('Maximum number of tasks to return (1-100)'),
}, async (args) => {
    // Build query string
    const params = new URLSearchParams();
    if (args.status !== 'all')
        params.set('status', args.status);
    if (args.priority)
        params.set('priority', args.priority);
    if (args.category)
        params.set('category', args.category);
    if (args.limit)
        params.set('limit', args.limit.toString());
    const queryString = params.toString();
    const endpoint = `/api/mcp/tasks${queryString ? `?${queryString}` : ''}`;
    const result = await apiCall('GET', endpoint);
    if (!result.ok) {
        return {
            content: [{ type: 'text', text: `Error listing tasks: ${result.error}` }],
            isError: true,
        };
    }
    const tasks = result.data?.tasks || [];
    if (tasks.length === 0) {
        const filterDesc = [];
        if (args.status !== 'all')
            filterDesc.push(`status: ${args.status}`);
        if (args.priority)
            filterDesc.push(`priority: ${args.priority}`);
        if (args.category)
            filterDesc.push(`category: ${args.category}`);
        const filterText = filterDesc.length > 0 ? ` (filters: ${filterDesc.join(', ')})` : '';
        return {
            content: [{ type: 'text', text: `No tasks found${filterText}.` }],
        };
    }
    const taskList = tasks
        .map((t, i) => {
        const checkbox = t.completed ? '[x]' : '[ ]';
        const priorityBadge = t.priority === 'high' ? '!!!' : t.priority === 'medium' ? '!!' : '!';
        const dueStr = t.dueDate ? ` (due: ${t.dueDate})` : '';
        const catStr = t.category ? ` [${t.category}]` : '';
        return `${i + 1}. ${checkbox} ${priorityBadge} ${t.title}${catStr}${dueStr}\n   ID: ${t.id}`;
    })
        .join('\n\n');
    const active = tasks.filter((t) => !t.completed).length;
    const completed = tasks.filter((t) => t.completed).length;
    const summary = `Total: ${tasks.length} | Active: ${active} | Completed: ${completed}`;
    return {
        content: [
            {
                type: 'text',
                text: `Tasks (${summary}):\n\n${taskList}`,
            },
        ],
    };
});
// ============================================================================
// Tool: complete_task
// ============================================================================
server.tool('complete_task', 'Mark a task as complete or incomplete in I do', {
    task_id: z.string().uuid('Task ID must be a valid UUID').describe('The ID of the task to update'),
    completed: z
        .boolean()
        .default(true)
        .describe('Set to true to mark complete, false to mark incomplete'),
}, async (args) => {
    const result = await apiCall('PATCH', '/api/mcp/tasks', {
        task_id: args.task_id,
        completed: args.completed,
    });
    if (!result.ok) {
        return {
            content: [{ type: 'text', text: `Error updating task: ${result.error}` }],
            isError: true,
        };
    }
    const task = result.data?.task;
    const status = args.completed ? 'complete' : 'incomplete';
    return {
        content: [
            {
                type: 'text',
                text: `Task "${task.title}" marked as ${status}.`,
            },
        ],
    };
});
// ============================================================================
// Start the server
// ============================================================================
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
}
main().catch((error) => {
    console.error('Server error:', error);
    process.exit(1);
});
