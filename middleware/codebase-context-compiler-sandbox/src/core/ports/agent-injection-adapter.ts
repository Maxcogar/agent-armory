/**
 * Agent injection adapter port (Spec AIR1, §18; Architecture D2 — Agent
 * Execution Harness). This is the per-agent boundary. Claude Code is the first
 * implementation; Codex (AGENTS injection) and Gemini are future adapters.
 *
 * The HARNESS owns enforcement: it builds the controller, validates plans with
 * the assumption firewall, and tracks the edit-gate phase. The ADAPTER only
 * knows how to (a) inject `controller.injectionBlock` into a specific agent's
 * ACTIVE context (not a file the agent must choose to read — AIR1), (b) submit
 * the agent's plan via `controller.submitPlan`, and (c) consult
 * `controller.gate` before every edit/write tool call.
 */
import type { GatePhase } from '../domain/harness.js';
import type { FirewallResult } from '../domain/plan.js';

export type GateDecision = { behavior: 'allow' } | { behavior: 'deny'; message: string };

export interface HarnessController {
  /** Mandatory context block to inject into the agent's active context. */
  readonly injectionBlock: string;
  readonly taskPrompt: string;
  readonly root: string;
  /** Submit the agent's plan; runs the assumption firewall and opens the gate iff it passes. */
  submitPlan(planText: string): FirewallResult;
  /** Consulted before each edit/write tool call. Closed until a plan passes. */
  gate(toolName: string, input: unknown): GateDecision;
  phase(): GatePhase;
}

export interface AgentRunResult {
  injected: boolean;
  plan: string | null;
  deniedEdits: number;
  completed: boolean;
  notes: string[];
}

export interface AgentInjectionAdapter {
  readonly name: string;
  /** True if this adapter can actually drive a live agent in this environment. */
  available(): Promise<boolean>;
  run(controller: HarnessController): Promise<AgentRunResult>;
}

/** Tool names treated as edits that must pass the gate. */
export const EDIT_TOOLS = new Set(['Edit', 'Write', 'MultiEdit', 'NotebookEdit', 'apply_patch']);
