import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
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

  // In stdio mode, stdout is reserved for the MCP JSON-RPC protocol — any
  // stray write to stdout corrupts the stream. Route all diagnostics to stderr.
  const stdioMode = process.argv.includes("--stdio");
  const log = stdioMode ? console.error : console.log;

  // The OAuth callback must be served at EXACTLY the URL registered in the
  // Autodesk app, or Autodesk rejects the login with redirect_uri mismatch.
  // Derive the route and listen port from APS_CALLBACK_URL so the server always
  // conforms to the registration instead of hardcoding an assumed one.
  const callbackUrl = new URL(process.env.APS_CALLBACK_URL!);
  const callbackPath = callbackUrl.pathname;

  const app = express();
  app.use(express.json());

  app.get("/", (_req, res) => {
    res.json({
      name: "aps-fusion-mcp-server",
      status: "running",
      authenticated: isAuthenticated(),
      endpoints: { mcp: "POST /mcp", auth_login: "GET /auth/login", auth_callback: `GET ${callbackPath}`, auth_status: "GET /auth/status" },
    });
  });

  app.get("/auth/login", (_req, res) => res.redirect(getAuthUrl()));

  app.get(callbackPath, async (req, res) => {
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

  // Prefer the callback URL's port — the registration dictates where we must be
  // reachable. Fall back to PORT for managed hosts (Cloud Run injects PORT and
  // terminates TLS, so the callback URL carries no explicit port).
  const port = parseInt(callbackUrl.port || process.env.PORT || "8080", 10);
  const httpServer = app.listen(port, () => {
    log(`APS Fusion MCP Server on http://localhost:${port}`);
    log(`  MCP: POST /mcp | Auth: GET /auth/login | Status: GET /auth/status`);
    if (!isAuthenticated()) log(`\n→ Visit http://localhost:${port}/auth/login to authenticate`);
  });
  // Don't let an occupied auth port crash the process — the MCP stdio transport
  // does not depend on it. Auth endpoints are simply unavailable until it frees.
  httpServer.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      log(`Port ${port} already in use — /auth endpoints unavailable, MCP transport unaffected.`);
    } else {
      log(`HTTP server error: ${err.message}`);
    }
  });

  // Stdio transport: lets a host (Claude Desktop) launch this process directly
  // and own its lifecycle. The Express server above still runs so the OAuth
  // callback (/auth/callback) has a listener during the browser login.
  if (stdioMode) {
    const server = createMcpServer();
    const transport = new StdioServerTransport();
    await server.connect(transport);
    log("MCP stdio transport connected.");
  }
}

main().catch((err) => { console.error("Fatal:", err); process.exit(1); });
