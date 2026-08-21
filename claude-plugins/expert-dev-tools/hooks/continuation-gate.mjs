#!/usr/bin/env node
// Stop-event continuation gate (corrections-0.4.0, agent-quits-midtask).
//
// Spec §3.4 enumerates the seven owner-escalation gate types and says the owner is
// interrupted for exactly those "and nothing else". That exhaustiveness is enforced
// only inside workflows/expert-lifecycle.js, which cannot see the one decision the
// measured defect lives in: the main agent ending its turn mid-lifecycle with no gate
// at all — "doing that next unless you want...", "next I'll...". This hook makes the
// halt list executable at that decision point.
//
// Authorized by the spec §2 amendment of 2026-08-20: the 2026-07-22 out-of-scope
// ruling excludes hooks that block TOOL USE (the "governance layer"). This one blocks
// no tool use; it intercepts only the end-of-turn decision and can do nothing but ask
// the agent to keep working.
//
// Decision order (draft §4.1):
//   1. stop_hook_active            -> allow  (loop guard required by the hook API)
//   2. no ledger under cwd         -> allow  (no lifecycle; ordinary sessions untouched)
//   3. phase === 'complete'        -> allow
//   4. an unresolved escalation    -> allow  (a legitimate §3.4 halt; gates keep halting)
//   5. otherwise                   -> block  (exit 2; stderr is fed back to the agent)
//
// FAIL OPEN, DELIBERATELY. Every unreadable, malformed, or unrecognized input above
// resolves to allow, with a note on stderr. This asymmetry against the workflow's
// fail-closed gates is intentional and is the correct direction here: this hook is a
// continuation AID, not an integrity control. Nothing downstream trusts its verdict —
// the ledger, the review gates, and the verifier remain the integrity surface. A
// fail-closed bug here would instead trap the owner's session in an unbreakable stop
// loop over a corrupt JSON file, which is strictly worse than a missed reprompt.
//
// Input: the Stop hook's stdin JSON — `stop_hook_active`, `cwd`, and the common
// fields. The ledger is resolved from that `cwd`, never from a hardcoded path.

import { readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ALLOW = 0;
const BLOCK = 2;

// The ledger location the /expert command owns (commands/expert.md:13).
export const LEDGER_REL = join('.claude', 'expert', 'ledger.json');

export function reasonFor(phase) {
  return [
    `Active expert lifecycle at phase ${phase} with no open owner gate.`,
    'Ending the turn here is an untyped halt — none of the seven spec §3.4 gate types',
    '(intent, spec_traceable, business, risk_override, non_convergence, core_approval,',
    'control_fault) applies. Continue the work: re-invoke `/expert resume` to run the next',
    'segment, or finish the in-flight step. If a genuine owner decision is needed, record',
    'the typed escalation in the ledger first — then this gate will let the turn end.',
  ].join(' ');
}

// Returns { code, note } — `note` goes to stderr in both directions. On BLOCK the note
// IS the reprompt the agent reads, so its content is load-bearing.
export function decide(input, ledgerText) {
  if (input && input.stop_hook_active === true) {
    return { code: ALLOW, note: null }; // already continuing because of this hook
  }
  if (ledgerText === null) {
    return { code: ALLOW, note: null }; // no lifecycle in this project
  }

  let ledger;
  try {
    ledger = JSON.parse(ledgerText);
  } catch (e) {
    return { code: ALLOW, note: `continuation-gate: ledger unparseable (${e.message}); allowing the stop.` };
  }
  if (!ledger || typeof ledger !== 'object') {
    return { code: ALLOW, note: 'continuation-gate: ledger is not an object; allowing the stop.' };
  }

  const phase = ledger.phase;
  if (typeof phase !== 'string' || phase === '') {
    return { code: ALLOW, note: 'continuation-gate: ledger has no phase; allowing the stop.' };
  }
  if (phase === 'complete') {
    return { code: ALLOW, note: null };
  }

  // An entry counts as OPEN unless it says `resolved: true`. `resolved` is optional in
  // ledger.schema.json, so an entry that omits it is a gate just recorded and not yet
  // answered — treating it as open keeps legitimate halts halting (the fail-open side).
  const escalations = Array.isArray(ledger.escalations) ? ledger.escalations : [];
  const open = escalations.some((e) => e && typeof e === 'object' && e.resolved !== true);
  if (open) {
    return { code: ALLOW, note: null };
  }

  return { code: BLOCK, note: reasonFor(phase) };
}

function readLedgerText(cwd) {
  if (typeof cwd !== 'string' || cwd === '') return null;
  const path = join(cwd, LEDGER_REL);
  if (!existsSync(path)) return null;
  try {
    return readFileSync(path, 'utf8');
  } catch (e) {
    // Present but unreadable. Surface it as text JSON.parse will reject, so the single
    // fail-open path in decide() reports it rather than duplicating the policy here.
    return `unreadable: ${e.message}`;
  }
}

function main() {
  let input = null;
  try {
    const raw = readFileSync(0, 'utf8');
    input = raw.trim() === '' ? null : JSON.parse(raw);
  } catch (e) {
    process.stderr.write(`continuation-gate: hook input unreadable (${e.message}); allowing the stop.\n`);
    process.exit(ALLOW);
  }

  let verdict;
  try {
    verdict = decide(input, readLedgerText(input && input.cwd));
  } catch (e) {
    process.stderr.write(`continuation-gate: internal error (${e.message}); allowing the stop.\n`);
    process.exit(ALLOW);
  }

  if (verdict.note) process.stderr.write(`${verdict.note}\n`);
  process.exit(verdict.code);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main();
}
