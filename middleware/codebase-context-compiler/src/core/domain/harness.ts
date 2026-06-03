/**
 * Agent Execution Harness domain types (Spec AIR1, §18; Architecture D2).
 *
 * The harness loads a validated package, selects the MANDATORY context sections,
 * renders an injection block, and keeps an edit gate CLOSED until the agent's
 * plan passes the assumption firewall. File artifacts are audit records — they
 * are not the enforcement mechanism (AIR1).
 */
import type { FirewallResult } from './plan.js';

export type GatePhase =
  | 'awaiting_injection'  // package not yet injected
  | 'awaiting_plan'       // injected; gate CLOSED until a plan is validated
  | 'edits_allowed'       // plan passed firewall; gate OPEN
  | 'blocked';            // plan failed firewall; gate stays CLOSED

export interface HarnessOutcome {
  package_id: string;
  snapshot_id: string;
  phase: GatePhase;
  injected: boolean;
  /** Number of edit attempts denied while the gate was closed. */
  denied_edits: number;
  firewall: FirewallResult | null;
  /** Reason the run ended in its terminal phase. */
  summary: string;
}
