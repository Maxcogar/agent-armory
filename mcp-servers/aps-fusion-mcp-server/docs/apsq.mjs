#!/usr/bin/env node
// Reliable authenticated APS query instrument.
// Usage: node apsq.mjs <body-file.json> [url]
//   body-file.json : POST body, e.g. {"query":"...","variables":{...}}  (GraphQL)
//                    or for REST, pass url and a body file with {} / omit.
//   url            : default https://developer.api.autodesk.com/mfg/graphql
// Loads ~/.aps-fusion-mcp/tokens.json; refreshes + persists the rotated token
// when the access token is expired or within 2 min of expiry, using the
// client creds in <project>/.env. Prints the response JSON to stdout.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const TOKEN_FILE = path.join(os.homedir(), '.aps-fusion-mcp', 'tokens.json');
const ENV_FILE = 'C:/Users/maxco/Documents/agent-armory/mcp-servers/aps-fusion-mcp-server/.env';
const TOKEN_URL = 'https://developer.api.autodesk.com/authentication/v2/token';
const DEFAULT_URL = 'https://developer.api.autodesk.com/mfg/graphql';

function readEnv() {
  const out = {};
  for (const line of fs.readFileSync(ENV_FILE, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m) out[m[1]] = m[2].trim();
  }
  return out;
}

async function ensureToken() {
  const tok = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf8'));
  if (tok && tok.access_token && Date.now() < tok.expires_at - 120000) return tok.access_token;
  // refresh
  const env = readEnv();
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: tok.refresh_token,
    client_id: env.APS_CLIENT_ID,
    client_secret: env.APS_CLIENT_SECRET,
    scope: 'data:read viewables:read',
  });
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  if (!res.ok) throw new Error(`refresh failed ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const next = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + data.expires_in * 1000 - 60000,
  };
  fs.writeFileSync(TOKEN_FILE, JSON.stringify(next), { mode: 0o600 });
  process.stderr.write('[apsq] token refreshed & persisted\n');
  return next.access_token;
}

const [, , bodyFile, url = DEFAULT_URL] = process.argv;
if (!bodyFile) { console.error('usage: node apsq.mjs <body-file.json> [url]'); process.exit(2); }

const token = await ensureToken();
const isGet = url.includes('__GET__');
const cleanUrl = url.replace('__GET__', '');
const bodyText = fs.readFileSync(bodyFile, 'utf8');
const res = await fetch(cleanUrl, {
  method: isGet ? 'GET' : 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    ...(isGet ? {} : { 'Content-Type': 'application/json' }),
  },
  ...(isGet ? {} : { body: bodyText }),
});
const text = await res.text();
process.stderr.write(`[apsq] HTTP ${res.status}\n`);
process.stdout.write(text);
