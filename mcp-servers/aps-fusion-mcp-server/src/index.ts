import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";

import { getAuthUrl, exchangeCode, isAuthenticated } from "./services/aps-auth.js";
import { registerDataManagementTools } from "./tools/data-management.js";
import { registerModelDerivativeTools } from "./tools/model-derivative.js";
import { registerMfgDataModelTools } from "./tools/mfg-data-model.js";

function checkEnv(): void {
  const required = ["APS_CLIENT_ID", "APS_CLIENT_SECRET", "APS_CALLBACK_URL"];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    console.error(`Missing env vars: ${missing.join(", ")}`);
    console.error("\nRequired: APS_CLIENT_ID, APS_CLIENT_SECRET, APS_CALLBACK_URL");
    process.exit(1);
  }
}

function createMcpServer(): McpServer {
  const server = new McpServer({ name: "aps-fusion-mcp-server", version: "1.0.0" });
  registerDataManagementTools(server);
  registerModelDerivativeTools(server);
  registerMfgDataModelTools(server);
  return server;
}

async function main(): Promise<void> {
  checkEnv();
  const app = express();
  app.use(express.json());

  app.get("/", (_req, res) => {
    res.json({
      name: "aps-fusion-mcp-server",
      status: "running",
      authenticated: isAuthenticated(),
      endpoints: { mcp: "POST /mcp", auth_login: "GET /auth/login", auth_callback: "GET /auth/callback", auth_status: "GET /auth/status" },
    });
  });

  app.get("/auth/login", (_req, res) => res.redirect(getAuthUrl()));

  app.get("/auth/callback", async (req, res) => {
    const code = req.query.code as string | undefined;
    if (!code) { res.status(400).json({ error: "No authorization code" }); return; }
    try {
      await exchangeCode(code);
      res.send("<html><body style='font-family:system-ui;text-align:center;padding:60px'><h1>Authenticated</h1><p>APS Fusion MCP Server connected. You can close this window.</p></body></html>");
    } catch (err) {
      res.status(500).json({ error: "Auth failed", details: err instanceof Error ? err.message : String(err) });
    }
  });

  app.get("/auth/status", (_req, res) => res.json({ authenticated: isAuthenticated() }));

  app.post("/mcp", async (req, res) => {
    const server = createMcpServer();
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
    res.on("close", () => transport.close());
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  });

  const port = parseInt(process.env.PORT || "8080", 10);
  app.listen(port, () => {
    console.log(`APS Fusion MCP Server on http://localhost:${port}`);
    console.log(`  MCP: POST /mcp | Auth: GET /auth/login | Status: GET /auth/status`);
    if (!isAuthenticated()) console.log(`\n→ Visit http://localhost:${port}/auth/login to authenticate`);
  });
}

main().catch((err) => { console.error("Fatal:", err); process.exit(1); });
