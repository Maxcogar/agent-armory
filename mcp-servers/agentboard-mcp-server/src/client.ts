import axios, { AxiosError } from "axios";
import { BASE_URL, AGENT_ID } from "./constants.js";

const http = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: {
    "Content-Type": "application/json",
    "X-Agent-Id": AGENT_ID,
  },
  timeout: 10_000,
});

export class AgentBoardError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly detail?: unknown
  ) {
    super(message);
    this.name = "AgentBoardError";
  }
}

export function normalizeProject(p: Record<string, unknown>): Record<string, unknown> {
  return { ...p, current_phase: Number(p["current_phase"]) };
}

export function normalizeTask(t: Record<string, unknown>): Record<string, unknown> {
  return { ...t, phase: t["phase"] !== null && t["phase"] !== undefined ? Number(t["phase"]) : null };
}

export function normalizeDocument(d: Record<string, unknown>): Record<string, unknown> {
  return { ...d, phase: Number(d["phase"]) };
}

export async function apiGet<T>(path: string, params?: Record<string, unknown>): Promise<T> {
  try {
    const res = await http.get<T>(path, { params });
    return res.data;
  } catch (err) {
    throw wrapError(err);
  }
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  try {
    const res = await http.post<T>(path, body);
    return res.data;
  } catch (err) {
    throw wrapError(err);
  }
}

export async function apiPut<T>(path: string, body?: unknown): Promise<T> {
  try {
    const res = await http.put<T>(path, body);
    return res.data;
  } catch (err) {
    throw wrapError(err);
  }
}

export async function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  try {
    const res = await http.patch<T>(path, body);
    return res.data;
  } catch (err) {
    throw wrapError(err);
  }
}

function wrapError(err: unknown): AgentBoardError {
  if (err instanceof AxiosError) {
    const status = err.response?.status;
    const detail = err.response?.data;
    const message =
      typeof detail === "object" && detail !== null && "message" in detail
        ? String((detail as Record<string, unknown>)["message"])
        : err.message;
    return new AgentBoardError(message, status, detail);
  }
  return new AgentBoardError(err instanceof Error ? err.message : String(err));
}

/** Format a tool error response */
export function errorResult(err: unknown): { isError: true; content: [{ type: "text"; text: string }] } {
  const msg =
    err instanceof AgentBoardError
      ? `AgentBoard API error (${err.statusCode ?? "unknown"}): ${err.message}`
      : err instanceof Error
      ? `Unexpected error: ${err.message}`
      : `Unexpected error: ${String(err)}`;
  return { isError: true, content: [{ type: "text", text: msg }] };
}