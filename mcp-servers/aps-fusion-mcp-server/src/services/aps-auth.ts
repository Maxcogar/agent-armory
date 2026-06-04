import { APS_AUTH_URL, APS_SCOPES } from "../constants.js";

interface TokenData {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

let tokenData: TokenData | null = null;

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
}

async function refreshToken(): Promise<void> {
  if (!tokenData?.refresh_token) throw new Error("No refresh token. Re-authenticate.");
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: tokenData.refresh_token,
    client_id: env("APS_CLIENT_ID"),
    client_secret: env("APS_CLIENT_SECRET"),
    scope: APS_SCOPES,
  });
  const res = await fetch(`${APS_AUTH_URL}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!res.ok) { tokenData = null; throw new Error(`Token refresh failed (${res.status}): ${await res.text()}`); }
  const data = (await res.json()) as { access_token: string; refresh_token: string; expires_in: number };
  tokenData = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + data.expires_in * 1000 - 60_000,
  };
}

export async function getAccessToken(): Promise<string> {
  if (!tokenData) throw new Error("Not authenticated. Visit /auth/login first.");
  if (Date.now() >= tokenData.expires_at) await refreshToken();
  return tokenData!.access_token;
}

export function isAuthenticated(): boolean {
  return tokenData !== null;
}
