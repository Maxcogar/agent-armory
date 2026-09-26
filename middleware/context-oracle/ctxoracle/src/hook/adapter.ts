// The ONLY file that names Claude Code hook field names (Step 28, AD-6).
// WALKING SKELETON. SKELETON: G21 — the adapter also extracts the tool call's
// target path and search term, which the tool-input objects carry under
// tool-schema field names (file_path, notebook_path, path, pattern).
import type { InternalEvent, EventKind } from '../types/events.js';
import type { HookResponse } from '../types/hook_response.js';
import type { DenyVerdict } from '../blocks/verdict.js';

export type InternalResponse = { deny: DenyVerdict } | { context: string } | Record<string, never>;

type HookJson = Record<string, unknown>;

function str(v: unknown): string | undefined {
  return typeof v === 'string' ? v : undefined;
}

export function toInternalEvent(j: HookJson, kindFromArgv: EventKind): InternalEvent {
  const cwd = str(j.cwd) ?? process.cwd();
  const input = (j.tool_input ?? {}) as Record<string, unknown>;
  // SKELETON: 1R — Step 6's InternalEvent: no `consumer` (the handler keys it
  // from session + agentId), `agentId` from the wire's agent id, and the tool
  // target as the still-unnormalized `targetPathRaw` (the skeleton's
  // cwd-relative normalization moved to the handler's stand-in); retired by
  // Step 28
  const targetPathRaw = str(input.file_path) ?? str(input.notebook_path) ?? str(input.path);
  const agentId = str(j.agent_id);
  return {
    kind: (str(j.hook_event_name) as EventKind | undefined) ?? kindFromArgv,
    session: str(j.session_id) ?? 'unknown',
    agentId,
    toolName: str(j.tool_name),
    toolInput: j.tool_input,
    toolResponse: j.tool_response,
    errorText: str(j.error),
    transcriptPath: str(j.transcript_path) ?? '',
    promptText: str(j.prompt),
    startSource: str(j.source),
    lastAssistantMessage: str(j.last_assistant_message),
    stopHookActive: j.stop_hook_active === true,
    workingDir: cwd,
    targetPathRaw,
    searchTerm: str(input.pattern) ?? str(input.query),
  };
}

export function toHookResponse(r: InternalResponse, eventName: string): HookResponse {
  if ('deny' in r)
    return { hookSpecificOutput: { hookEventName: eventName, permissionDecision: 'deny', permissionDecisionReason: r.deny.reason } };
  if ('context' in r) return { hookSpecificOutput: { hookEventName: eventName, additionalContext: r.context } };
  return {};
}

/** The Bash command string of a tool call (a tool-schema field). */
export function bashCommandOf(toolInput: unknown): string | undefined {
  return str((toolInput as Record<string, unknown> | undefined)?.command);
}
