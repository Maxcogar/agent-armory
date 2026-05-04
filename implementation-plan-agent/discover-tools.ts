import { genkit } from 'genkit';
import { createMcpHost } from '@genkit-ai/mcp';

const ai = genkit({});
const mcpHost = createMcpHost({
  name: 'discovery-host',
  mcpServers: {
    'codebase-rag': {
      command: 'python',
      args: ['C:\\Users\\maxco\\Documents\\agent-armory\\mcp-servers\\codebase-rag\\mcp-server-python\\server.py'],
    },
    'codegraph': {
      command: 'node',
      args: ['C:\\Users\\maxco\\Documents\\agent-armory\\mcp-servers\\codegraph-mcp\\dist\\index.js'],
    },
  },
});

async function discover() {
  const tools = await mcpHost.getActiveTools(ai);
  console.log(JSON.stringify(tools.map(t => ({ name: t.name, schema: (t as any).inputSchema })), null, 2));
  await mcpHost.close();
}

discover();
