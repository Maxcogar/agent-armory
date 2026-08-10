import { readFileSync, writeFileSync, mkdirSync, renameSync, unlinkSync } from "fs";
import { homedir } from "os";
import { join } from "path";

import { APS_AUTH_URL, APS_SCOPES } from "../constants.js";

interface TokenData {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

// Refresh tokens persist across restarts so the user authenticates once rather
// than every time the host relaunches the server. Stored under the user profile,
// outside the repo — never in version control.
const TOKEN_DIR = join(homedir(), ".aps-fusion-mcp");
const TOKEN_FILE = join(TOKEN_DIR, "tokens.json");

function loadTokens(): TokenData | null {
  try {
    const parsed = JSON.parse(readFileSync(TOKEN_FILE, "utf8")) as TokenData;
    return parsed?.refresh_token ? parsed : null;
  } catch {
    return null; // no cache yet, or unreadable — treat as unauthenticated
  }
}

function persistTokens(): void {
  try {
    mkdirSync(TOKEN_DIR, { recursive: true });
    writeFileSync(TOKEN_FILE, JSON.stringify(tokenData), { mode: 0o600 });
  } catch (err) {
    // Best-effort: never crash auth over a disk write.
    console.error(`Token persistence failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

function clearTokens(): void {
  tokenData = null;
  try { writeFileSync(TOKEN_FILE, JSON.stringify(null), { mode: 0o600 }); } catch { /* ignore */ }
}

let tokenData: TokenData | null = loadTokens();

const env = (k: string): string => {
  const v = process.env[k];
  if (!v) throw new Error(`${k} not set`);
  return v;
};

export function getAuthUrl(): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: env("APS_CLIENT_ID"),
    redirect_uri: env("APS_CALLBACK_URL"),
    scope: APS_SCOPES,
  });
  return `${APS_AUTH_URL}/authorize?${params.toString()}`;
}

export async function exchangeCode(code: string): Promise<void> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: env("APS_CLIENT_ID"),
    client_secret: env("APS_CLIENT_SECRET"),
    redirect_uri: env("APS_CALLBACK_URL"),
  });
  const res = await fetch(`${APS_AUTH_URL}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!res.ok) throw new Error(`Token exchange failed (${res.status}): ${await res.text()}`);
  const data = (await res.json()) as { access_token: string; refresh_token: string; expires_in: number };
  tokenData = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + data.expires_in * 1000 - 60_000,
  };
  persistTokens();
}

async function refreshToken(): Promise<void> {
  // Autodesk ROTATES the refresh token on every use — the previous one is
  // invalidated immediately. Claude Code and Claude Desktop each launch their
  // own instance of this server sharing one token file, so an in-memory copy
  // goes stale as soon as a sibling refreshes. Always refresh from the newest
  // copy on disk.
  const onDisk = loadTokens();
  if (onDisk && onDisk.refresh_token !== tokenData?.refresh_token) {
    tokenData = onDisk;
    if (Date.now() < tokenData.expires_at) return; // a sibling already refreshed
  }
  if (!tokenData?.refresh_token) throw new Error("No refresh token. Re-authenticate.");

  const attempted = tokenData.refresh_token;
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: attempted,
    client_id: env("APS_CLIENT_ID"),
    client_secret: env("APS_CLIENT_SECRET"),
    scope: APS_SCOPES,
  });
  const res = await fetch(`${APS_AUTH_URL}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!res.ok) {
    // Our copy may simply be stale because a sibling rotated the token first.
    // NEVER destroy a credential that a newer process just wrote — that would
    // log the user out of every instance over a benign race.
    const latest = loadTokens();
    if (latest && latest.refresh_token !== attempted) {
      tokenData = latest;
      return;
    }
    clearTokens();
    throw new Error(`Token refresh failed (${res.status}): ${await res.text()}`);
  }
  const data = (await res.json()) as { access_token: string; refresh_token: string; expires_in: number };
  tokenData = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + data.expires_in * 1000 - 60_000,
  };
  persistTokens();
}

// Re-read from disk when memory is empty: this process may have started before
// the user authenticated (or another instance handled the login), and the token
// file is the shared source of truth.
function currentTokens(): TokenData | null {
  if (!tokenData) tokenData = loadTokens();
  return tokenData;
}

export async function getAccessToken(): Promise<string> {
  if (!currentTokens()) throw new Error("Not authenticated. Visit /auth/login first.");
  if (Date.now() >= tokenData!.expires_at) await refreshToken();
  return tokenData!.access_token;
}

export function isAuthenticated(): boolean {
  return currentTokens() !== null;
}
