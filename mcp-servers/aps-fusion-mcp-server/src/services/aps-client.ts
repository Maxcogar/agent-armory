import { getAccessToken } from "./aps-auth.js";

export async function apsGet(url: string): Promise<unknown> {
  const token = await getAccessToken();
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`APS API error (${res.status}) ${url}: ${await res.text()}`);
  return res.json();
}

export async function apsPost(url: string, body: unknown): Promise<unknown> {
  const token = await getAccessToken();
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`APS API error (${res.status}) ${url}: ${await res.text()}`);
  return res.json();
}

export async function apsGraphQL(
  url: string,
  query: string,
  variables?: Record<string, unknown>
): Promise<unknown> {
  const token = await getAccessToken();
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`APS GraphQL error (${res.status}): ${await res.text()}`);
  const data = (await res.json()) as { data?: unknown; errors?: unknown[] };
  if (data.errors?.length) throw new Error(`GraphQL errors: ${JSON.stringify(data.errors, null, 2)}`);
  return data.data;
}

export function urnToBase64(urn: string): string {
  return Buffer.from(urn).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
