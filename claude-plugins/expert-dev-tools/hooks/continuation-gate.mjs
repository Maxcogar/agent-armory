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
// BLOCKING REQUIRES POSITIVE EVIDENCE OF AN IN-FLIGHT LIFECYCLE. The defect this
// gate answers is an agent that abandons work the lifecycle would otherwise carry
// on with. "A ledger file exists and its phase is not the string 'complete'" is not
// that evidence: a lifecycle can be finished, unresumable, or simply dead, and every
// one of those states leaves a ledger on disk forever — nothing expires one. Each
// allow condition below therefore names a way the lifecycle can fail to be in
// flight, and the block is what remains when none of them holds.
//
// Decision order:
//   1. stop_hook_active            -> allow  (loop guard required by the hook API)
//   2. no ledger at the project root -> allow (no lifecycle; ordinary sessions untouched)
//   3. ledger is not schema-valid  -> allow  (unresumable: `/expert resume` halts at
//                                             its own step-1 ledger-validity check, so
//                                             a block here would demand the impossible)
//   4. phase is terminal           -> allow  (TERMINAL_PHASES; see there)
//   5. ledger older than STALE_MS  -> allow  (abandoned run, not this turn's work)
//   6. an unresolved escalation    -> allow  (a legitimate §3.4 halt; gates keep halting)
//   7. otherwise                   -> block  (exit 2; stderr is fed back to the agent)
//
// FAIL OPEN, DELIBERATELY. Every unreadable, malformed, or unrecognized input above
// resolves to allow, with a note on stderr. This asymmetry against the workflow's
// fail-closed gates is intentional and is the correct direction here: this hook is a
// continuation AID, not an integrity control. Nothing downstream trusts its verdict —
// the ledger, the review gates, and the verifier remain the integrity surface. A
// fail-closed bug here would instead re-block the owner's session on every successive
// Stop over a corrupt JSON file, which is strictly worse than a missed reprompt.
//
// LOOP BOUNDS, both supplied by the platform and neither by this script. Verified by
// the evidence ladder, not assumed:
//   1. `stop_hook_active`. Documented at code.claude.com/docs/en/hooks-guide (read
//      2026-08-21): "Your hook script needs to check whether it already triggered a
//      continuation. Parse the `stop_hook_active` field from the JSON input and exit
//      early if it's `true`". Corroborated on disk in the installed Claude Code
//      2.1.236 binary (~/.local/share/claude/versions/2.1.236), which builds the Stop
//      payload as `{...h, hook_event_name:"Stop", stop_hook_active:n, ...}` — the
//      field is emitted by the platform, not optional decoration. decide() honors it
//      first, before any I/O.
//   2. A platform block cap that does not depend on (1) at all. Same page: "Claude
//      Code overrides a Stop hook after it blocks eight times in a row without
//      progress", raisable via CLAUDE_CODE_STOP_HOOK_BLOCK_CAP (both the cap message
//      and the variable are present in the same installed binary). So even a total
//      failure of the `stop_hook_active` branch is bounded at eight turns by the
//      host; an unbounded stop loop is not reachable from this script.
//
// Input: the Stop hook's stdin JSON — `stop_hook_active`, `cwd`, and the common
// fields. The ledger root comes from `${CLAUDE_PROJECT_DIR}` when the platform sets
// it, and from the payload's `cwd` only as a fallback; see projectRoot().

import { readFileSync, existsSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validate } from '../scripts/validate-ledger.mjs';

const ALLOW = 0;
const BLOCK = 2;

// The ledger location the /expert command owns (commands/expert.md:13).
export const LEDGER_REL = join('.claude', 'expert', 'ledger.json');

// Phases after which nothing this gate should demand remains in flight. Membership is
// decided by what a phase DOES, never by where its name sits in the phase order.
//
// 'complete' is the workflow's only terminal write, so it is the only member.
//
// 'closeout' is deliberately NOT a member, though the phase order puts it last but
// one. A ledger resting at 'closeout' has had ground truth and the whole-chain
// reconciliation PASS, but expert-lifecycle.js:988 shows the phase's own dispatch is
// still ahead of it — "write the final report against the spec, commit the verified
// work and open a PR" — and `delta.phase = 'complete'` is written only after that
// agent returns (:989). So 'closeout' names precisely the state where the report,
// the commit, and the PR have NOT happened: maximally in flight, and the abandonment
// that costs the most recoverable work. Exempting it would make one whole phase
// permanently unguarded against the very defect (agent-quits-midtask) this gate
// answers.
//
// The real ledger that motivated a closeout exemption is already allowed twice over,
// by conditions that rest on evidence rather than on a phase name: it is schema-
// invalid (unresumable), and it is long past STALE_MS (abandoned). An abandoned
// closeout therefore still ends its turn freely once it is genuinely abandoned; a
// live one is held to the same standard as every other in-flight phase.
export const TERMINAL_PHASES = ['complete'];

// A lifecycle segment is advanced within a working session. A ledger untouched for
// longer than this is not the work in flight in THIS turn. The bound exists because
// nothing else ever expires a ledger: without it, one abandoned run governs every
// future session in that project until someone deletes the file by hand.
export const STALE_MS = 24 * 60 * 60 * 1000;

// The ledger's own schema, loaded once. Unreadable leaves it null, which decide()
// treats as "validity could not be established" — an allow, per the fail-open rule.
const SCHEMA_PATH = join(dirname(fileURLToPath(import.meta.url)), '..', 'scripts', 'ledger.schema.json');
let SCHEMA = null;
try { SCHEMA = JSON.parse(readFileSync(SCHEMA_PATH, 'utf8')); } catch { SCHEMA = null; }

// The project root the /expert command resolves the ledger against. The platform
// hooks contract (code.claude.com/docs/en/hooks, read 2026-08-21) states these two
// diverge: "${CLAUDE_PROJECT_DIR} stays put ... it still points at the project root
// where the session started", while "cwd follows Claude ... the worktree root after
// Claude enters a worktree, and the new directory after Claude runs `cd`". The
// ledger lives at the project root, so CLAUDE_PROJECT_DIR is the correct source and
// `cwd` is only the fallback for a payload delivered without the variable set.
export function projectRoot(input, env = process.env) {
  const fromEnv = env && env.CLAUDE_PROJECT_DIR;
  if (typeof fromEnv === 'string' && fromEnv !== '') return fromEnv;
  const cwd = input && input.cwd;
  return typeof cwd === 'string' && cwd !== '' ? cwd : null;
}

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
//
// `mtimeMs` is the ledger file's last-modification time and `nowMs` the clock, both
// injected so the staleness axis is testable without touching a clock; `ledgerText`
// null means no ledger. The function stays pure: every I/O happens in the callers.
export function decide(input, ledgerText, mtimeMs = null, nowMs = Date.now()) {
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

  // Schema validity, from the same schema and the same validator `/expert` step 1
  // runs. A ledger this rejects cannot be resumed, so demanding its resumption is
  // an instruction the agent cannot carry out — the shape that trapped this repo.
  if (SCHEMA === null) {
    return { code: ALLOW, note: 'continuation-gate: ledger.schema.json unreadable, so ledger validity is unknown; allowing the stop.' };
  }
  let errors;
  try {
    errors = validate(ledger, SCHEMA, SCHEMA, '$', []);
  } catch (e) {
    return { code: ALLOW, note: `continuation-gate: ledger could not be validated (${e.message}); allowing the stop.` };
  }
  if (errors.length) {
    return { code: ALLOW, note: `continuation-gate: ledger is not schema-valid (${errors[0]}) and so is not resumable; allowing the stop.` };
  }

  // Schema-valid implies `phase` is one of the schema's enumerated phases, so a
  // phase outside TERMINAL_PHASES is a genuine mid-lifecycle phase — no separate
  // unknown-phase branch is needed, and no second copy of the phase list exists.
  const phase = ledger.phase;
  if (TERMINAL_PHASES.includes(phase)) {
    return { code: ALLOW, note: null };
  }

  if (typeof mtimeMs === 'number' && Number.isFinite(mtimeMs) && nowMs - mtimeMs > STALE_MS) {
    const days = ((nowMs - mtimeMs) / 86400000).toFixed(1);
    return { code: ALLOW, note: `continuation-gate: ledger at phase ${phase} was last written ${days} days ago, past the ${STALE_MS / 86400000}-day activity window; treating the lifecycle as abandoned and allowing the stop.` };
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

// Returns { text, mtimeMs } for the ledger under `root`, or null when there is none.
export function readLedger(root) {
  if (typeof root !== 'string' || root === '') return null;
  const path = join(root, LEDGER_REL);
  if (!existsSync(path)) return null;
  let mtimeMs = null;
  try { mtimeMs = statSync(path).mtimeMs; } catch { mtimeMs = null; }
  try {
    return { text: readFileSync(path, 'utf8'), mtimeMs };
  } catch (e) {
    // Present but unreadable. Surface it as text JSON.parse will reject, so the single
    // fail-open path in decide() reports it rather than duplicating the policy here.
    return { text: `unreadable: ${e.message}`, mtimeMs };
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
    const led = readLedger(projectRoot(input));
    verdict = decide(input, led && led.text, led && led.mtimeMs);
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
