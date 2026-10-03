// The Phase B model seam (Step 36, AD-21): the verified invocation contract, not a
// Phase B API. Every implementation keeps it: command `claude -p --model <model>
// --tools "" --max-turns <n> --output-format json` (V9); `--bare` never passed
// (V10); spawned only through `oracleSpawn` with `scrub: true` (Step 5), so
// CTXORACLE_INTERNAL=1 is set and the SCRUBBED_ENV session-identity variables are
// absent while authentication is inherited; cwd outside the repository. Nothing in
// Phase A imports this module except its unit test.
export interface ModelInvocationRequest {
  prompt: string;
  model: string;
  maxTurns?: number;
  timeoutMs?: number;
}
export interface ModelInvocationEnvelope {
  is_error: boolean;
  num_turns: number;
  result: string;
  subtype: string;
  session_id: string;
  duration_ms: number;
  total_cost_usd: number;
  usage: unknown;
  modelUsage: unknown;
  raw: Record<string, unknown>;
}
export interface ModelInvocation {
  invoke(req: ModelInvocationRequest): Promise<{ ok: true; envelope: ModelInvocationEnvelope } | { ok: false; reason: string }>;
}
export const phaseANotImplemented: ModelInvocation = {
  invoke: async () => ({ ok: false, reason: 'phase_a_no_model' }),
};
