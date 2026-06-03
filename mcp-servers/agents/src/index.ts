#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { registerDispatchTools } from "./tools/dispatch.js";
import { detectScrubbedKeys } from "./services/env.js";

/**
 * Entry point for the subagent MCP server.
 *
 * Transport: stdio. The server is launched as a subprocess by Claude
 * Code (or another MCP client) and communicates over stdin/stdout.
 *
 * IMPORTANT: never write to stdout. The MCP transport owns stdout for
 * JSON-RPC framing. All logs MUST go to stderr.
 */
async function main(): Promise<void> {
  const server = new McpServer({
    name: "subagent-mcp-server",
    version: "0.1.0",
  });

  registerDispatchTools(server);

  // Surface any leaking API keys so the user can see in stderr that
  // we scrubbed them. This is informational only — we always scrub.
  const leaked = detectScrubbedKeys();
  if (leaked.length > 0) {
    console.error(
      `[subagent-mcp] scrubbing API-key vars from subagent env: ${leaked.join(", ")}`,
    );
    console.error(
      `[subagent-mcp] subagents will use cached subscription auth (codex login / gemini sign-in)`,
    );
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`[subagent-mcp] server ready on stdio`);
}

main().catch((err) => {
  console.error("[subagent-mcp] fatal:", err);
  process.exit(1);
});
