# I do MCP Server

A Model Context Protocol (MCP) server that allows you to manage your I do tasks from Claude Desktop, Cursor, and other MCP-compatible AI assistants.

## Features

- **create_task** - Create new tasks with title, description, due date, priority, and category
- **list_tasks** - View your tasks with optional filters (status, priority, category)
- **complete_task** - Mark tasks as complete or incomplete

## Quick Start

### 1. Generate an API Key

1. Log in to your I do app at [https://transferme-gohighlevel.uk](https://transferme-gohighlevel.uk)
2. Go to **Settings → MCP Integration**
3. Click **Generate API Key**
4. **Copy and save your key** - you won't be able to see it again!

### 2. Configure Your AI Assistant

#### Claude Desktop

Edit your Claude Desktop config file:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "ido-todo": {
      "command": "npx",
      "args": ["-y", "ido-mcp"],
      "env": {
        "IDO_API_KEY": "mcp_your_api_key_here"
      }
    }
  }
}
```

#### Cursor

Edit `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "ido-todo": {
      "command": "npx",
      "args": ["-y", "ido-mcp"],
      "env": {
        "IDO_API_KEY": "mcp_your_api_key_here"
      }
    }
  }
}
```

### 3. Restart Your AI Assistant

Restart Claude Desktop or Cursor to load the MCP server.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `IDO_API_KEY` | Yes | Your API key from I do Settings |
| `IDO_API_URL` | No | API URL (defaults to `https://transferme-gohighlevel.uk`) |

## Usage

Once configured, you can ask your AI assistant to:

- **Create tasks:** "Add a task to buy groceries tomorrow"
- **List tasks:** "Show my active tasks" or "List high priority work tasks"
- **Complete tasks:** "Mark task [id] as complete"

## Development

If you're contributing to this project or running locally:

```bash
# Install dependencies
npm install

# Build
npm run build

# Run in development mode
npm run dev

# Test with MCP Inspector
npm run inspect
```

### Local Development Config

For testing against a local server, add `IDO_API_URL`:

```json
{
  "mcpServers": {
    "ido-todo": {
      "command": "node",
      "args": ["/path/to/ai-todo-app/mcp-server/dist/index.js"],
      "env": {
        "IDO_API_KEY": "mcp_your_api_key_here",
        "IDO_API_URL": "http://localhost:3000"
      }
    }
  }
}
```

## Troubleshooting

### "Invalid API key" error
- Make sure you copied the full API key from Settings
- Regenerate the key if needed

### "Network error" or timeout
- Verify the production site is accessible
- If using localhost, make sure the I do app is running locally

### Server not showing in AI assistant
- Restart your AI assistant after updating config
- Ensure Node.js 18+ is installed
