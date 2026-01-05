'use client';

export default function MCPSetupDocs() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Connect AI Assistants to I do
          </h1>
          <p className="text-lg text-gray-600">
            Create tasks in your I do app directly from Claude, Cursor, and other AI assistants using MCP (Model Context Protocol).
          </p>
        </div>

        {/* What you'll need */}
        <Section title="What You'll Need">
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>An I do account (<a href="/auth/signup" className="text-blue-600 hover:underline">Sign up here</a>)</li>
            <li>Your MCP API Key (generate in <a href="/settings" className="text-blue-600 hover:underline">Settings → MCP Integration</a>)</li>
            <li>An MCP-compatible AI assistant (Claude Desktop, Cursor, etc.)</li>
          </ol>
        </Section>

        {/* Step 1: Get API Key */}
        <Section title="Step 1: Generate Your API Key">
          <ol className="list-decimal list-inside space-y-3 text-gray-700">
            <li>Log in to your I do account</li>
            <li>Go to <strong>Settings → MCP Integration</strong></li>
            <li>Click <strong>&quot;Generate API Key&quot;</strong></li>
            <li>
              <span className="text-amber-600 font-medium">Important:</span> Copy and save your key immediately!
              You won&apos;t be able to see it again.
            </li>
          </ol>
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-amber-800 text-sm">
              Your API key looks like: <code className="bg-amber-100 px-2 py-1 rounded">mcp_abc12345_xxxxxxxxxxxxxxxx</code>
            </p>
          </div>
        </Section>

        {/* Claude Desktop */}
        <Section title="Connect Claude Desktop">
          <p className="text-gray-600 mb-4">
            Claude Desktop supports MCP natively. Follow these steps:
          </p>

          <h4 className="font-semibold text-gray-900 mb-2">1. Find your config file</h4>
          <ul className="list-disc list-inside text-gray-700 mb-4 ml-4">
            <li><strong>macOS:</strong> <code className="bg-gray-100 px-2 py-1 rounded text-sm">~/Library/Application Support/Claude/claude_desktop_config.json</code></li>
            <li><strong>Windows:</strong> <code className="bg-gray-100 px-2 py-1 rounded text-sm">%APPDATA%\\Claude\\claude_desktop_config.json</code></li>
          </ul>

          <h4 className="font-semibold text-gray-900 mb-2">2. Add this configuration</h4>
          <CodeBlock>
{`{
  "mcpServers": {
    "ido-todo": {
      "command": "npx",
      "args": ["-y", "ido-mcp"],
      "env": {
        "IDO_API_KEY": "your-api-key-here"
      }
    }
  }
}`}
          </CodeBlock>
          <p className="text-sm text-gray-500 mt-2">
            Replace <code className="bg-gray-100 px-1 rounded">your-api-key-here</code> with your API key from Step 1.
          </p>

          <h4 className="font-semibold text-gray-900 mb-2 mt-4">3. Restart Claude Desktop</h4>
          <p className="text-gray-600">
            Close and reopen Claude Desktop. You should see the MCP tools available.
          </p>

          <h4 className="font-semibold text-gray-900 mb-2 mt-4">4. Try it out!</h4>
          <p className="text-gray-600">
            Say to Claude: <em>&quot;Add a task to buy groceries tomorrow&quot;</em>
          </p>
        </Section>

        {/* Cursor */}
        <Section title="Connect Cursor">
          <p className="text-gray-600 mb-4">
            Cursor also supports MCP servers.
          </p>

          <h4 className="font-semibold text-gray-900 mb-2">1. Open Cursor Settings</h4>
          <p className="text-gray-600 mb-2">
            Go to <strong>Cursor Settings → MCP</strong> or edit <code className="bg-gray-100 px-2 py-1 rounded text-sm">~/.cursor/mcp.json</code>:
          </p>
          <CodeBlock>
{`{
  "mcpServers": {
    "ido-todo": {
      "command": "npx",
      "args": ["-y", "ido-mcp"],
      "env": {
        "IDO_API_KEY": "your-api-key-here"
      }
    }
  }
}`}
          </CodeBlock>

          <h4 className="font-semibold text-gray-900 mb-2 mt-4">2. Restart Cursor</h4>
          <p className="text-gray-600">
            Restart Cursor to load the MCP server. Check Settings → MCP to verify connection status.
          </p>
        </Section>

        {/* Environment Variables */}
        <Section title="Configuration Options">
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900 border-b">Variable</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900 border-b">Required</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900 border-b">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-2 border-b"><code className="text-sm">IDO_API_KEY</code></td>
                  <td className="px-4 py-2 border-b text-green-600">Yes</td>
                  <td className="px-4 py-2 border-b text-sm text-gray-600">Your API key from Settings</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 border-b"><code className="text-sm">IDO_API_URL</code></td>
                  <td className="px-4 py-2 border-b text-gray-500">No</td>
                  <td className="px-4 py-2 border-b text-sm text-gray-600">Defaults to production. Only set to <code>http://localhost:3000</code> for local development.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Section>

        {/* Available Commands */}
        <Section title="What You Can Do">
          <p className="text-gray-600 mb-4">
            Once connected, you can ask your AI assistant to:
          </p>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span><strong>Create tasks:</strong> &quot;Add a task to call mom tomorrow&quot;</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span><strong>List tasks:</strong> &quot;Show my tasks for today&quot;</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span><strong>Complete tasks:</strong> &quot;Mark the grocery task as done&quot;</span>
            </li>
          </ul>
        </Section>

        {/* Troubleshooting */}
        <Section title="Troubleshooting">
          <div className="space-y-4">
            <TroubleshootItem
              problem="MCP server not connecting"
              solution="Make sure you've restarted your AI app after updating the config. Check that your API key is correct and doesn't have extra spaces."
            />
            <TroubleshootItem
              problem="'Invalid API key' error"
              solution="Generate a new API key in Settings → MCP Integration. Make sure you copied the full key."
            />
            <TroubleshootItem
              problem="Tasks not appearing in the app"
              solution="Refresh your I do app. Check that you're logged into the same account that generated the API key."
            />
            <TroubleshootItem
              problem="'Network error' or connection timeout"
              solution="Make sure the I do app is running if using localhost. Verify the IDO_API_URL is correct."
            />
          </div>
        </Section>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200 text-center">
          <p className="text-gray-600">
            Ready to get started?{' '}
            <a href="/settings" className="text-blue-600 hover:underline font-medium">
              Generate your API key →
            </a>
          </p>
          <p className="text-gray-500 text-sm mt-4">
            <a href="/" className="hover:underline">← Back to I do</a>
          </p>
        </div>
      </div>
    </div>
  );
}

// Helper Components
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">{title}</h2>
      {children}
    </section>
  );
}

function CodeBlock({ children }: { children: string }) {
  return (
    <div className="relative">
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
        <code>{children}</code>
      </pre>
      <button
        onClick={() => navigator.clipboard.writeText(children)}
        className="absolute top-2 right-2 px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded"
      >
        Copy
      </button>
    </div>
  );
}

function TroubleshootItem({ problem, solution }: { problem: string; solution: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h4 className="font-medium text-gray-900 mb-1">❓ {problem}</h4>
      <p className="text-gray-600 text-sm">{solution}</p>
    </div>
  );
}

