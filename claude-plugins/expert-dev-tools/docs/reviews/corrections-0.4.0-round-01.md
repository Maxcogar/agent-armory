# Independent review — corrections 0.4.0, round 1

Reviewer: `rev-0400-r1` (fresh dispatch; no retained context from any 0.3.0 round).
Target: branch `claude/edt-corrections-0.4.0`, commits `a903b12..e4e500f` (8 commits),
diff against `origin/main` restricted to `claude-plugins/expert-dev-tools/`.
Plugin version under review: `0.4.0` (`.claude-plugin/plugin.json`, Read at HEAD).
Date: 2026-08-21.

---

## Scope and Inventory

Inventory source (Step 2, ad-hoc/implementation review): the files in the branch diff,
plus the seven correction drafts they were built from, plus the spec and architecture the
drafts amend, plus the defect store the corrections answer, plus the live runtime state the
new hook reads.

All paths repo-relative to `claude-plugins/expert-dev-tools/` unless absolute.

### Implementation files (the diff)

- [x] `.claude-plugin/plugin.json` — Read in full; version `0.4.0`, no `hooks` key.
- [x] `hooks/continuation-gate.mjs` — Read in full, 1-133 (new file).
- [x] `hooks/hooks.json` — Read in full, 1-16 (new file).
- [x] `scripts/preflight-deployment.mjs` — Read in full, 1-159 (new file).
- [x] `scripts/ledger.schema.json` — diff Read in full; `task_verbatim` added to `required`.
- [x] `scripts/validate-ledger.mjs` — executed against the live ledger (exit 1, correct).
- [x] `workflows/expert-lifecycle.js` — Read at 404-456, 466-540, 755-869, 1060-1141,
  1159-1169; grep-verified for every new predicate's definition and call sites
  (query `findingShapeFault|sweepDiscrepancy|reExecuteSweeps|detectCorrectionFailure|implementationCompleteness|skillActivationFault`,
  6 definitions / 9 call sites, all enumerated below).
- [x] `commands/expert.md` — Read 1-100 (steps 0-3); grep `task_verbatim`, 4 hits.
- [x] `tests/structural/check-structure.mjs` — executed (full pass); grep
  `T-A2c|declares no hooks|T-30`, 12 hits Read in context; mutation-probed (7 probes).
- [x] `tests/unit/run-unit-tests.mjs` — executed (full pass).
- [x] `agents/expert-corrector.md`, `agents/expert-implementer.md`,
  `agents/expert-reviewer.md`, `agents/expert-verifier.md` — grep-verified via the
  structural tier's own pins, which execute against these files and pass.
- [x] `skills/expert-correct/SKILL.md`, `skills/expert-implement/SKILL.md`,
  `skills/expert-review/SKILL.md`, `skills/expert-spec/SKILL.md`,
  `skills/expert-standard/SKILL.md` — grep-verified via the executing structural pins
  (T-29 evidence-ladder checks, observed passing in the run output).
- [x] `tests/fixture/continuation/**` (5 fixtures) — Read `no-gate/.claude/expert/ledger.json`
  in full; the other four verified by the T-30 fixture-validity checks, which execute.
- [x] `tests/fixture/deployment/**` (6 fixtures) — verified by the executing T-29 checks.
- [x] `docs/specs/spec-expert-dev-tools.md` — §2 amendment Read in full via diff.

### Input artifacts

- [x] `docs/diagnostics/corrections-0.4.0/agent-quits-midtask.md` — Read in full (222 lines).
- [x] `docs/diagnostics/corrections-0.4.0/opining-without-reading-source.md` — §4 Read.
- [x] `docs/diagnostics/corrections-0.4.0/skill-activation-missed.md` — §4-§5 Read.
- [x] `docs/diagnostics/corrections-0.4.0/instruction-reinterpretation.md`,
  `patching-instead-of-rederivation.md`, `premature-completion-claims.md`,
  `role-boundary-violations.md` — grep-verified against the shipped predicates; each
  draft's named mechanism was located in current source and its call site confirmed.
- [x] `docs/reviews/corrections-0.3.0-round-12.md` — section structure Read (format reference).

### Live runtime state (outside version control — cited by path and date)

- [x] `C:\Users\maxco\Documents\agent-armory\.claude\expert\ledger.json` — Read in full,
  2026-08-21. **Unpinnable**: not under version control; contents may change.
- [x] `C:\Users\maxco\.claude\plugins\installed_plugins.json` — Read (registry shape,
  `expert-dev-tools@claude-armory` record), 2026-08-21. **Unpinnable.**
- [ ] `C:\Users\maxco\.claude\plugins\data\expert-dev-tools\defect-history.json` —
  **not read.** See Tentative Findings.

### Tool plan (Step 3)

| Claim type | Instrument | Availability |
|---|---|---|
| Literal-content | `Read` at file:line | available |
| Absence / scope | `Grep` with query + count | available |
| Behavioral (hook, scripts) | direct execution on constructed stdin; mutation probes | available |
| Behavioral (structural pins) | mutation probes in an isolated `git worktree` | available |
| Platform-behavior (Stop hook contract, plugin auto-discovery) | `WebFetch` of `code.claude.com/docs` | available |
| Structural / blast radius | grep of definition + call sites | available (CodeGraph not used; scope is two files) |

No instrument class was unavailable. No rigor waivers; the operator directed no compression.

**Mutation-probe isolation.** All mutation probes ran in a detached `git worktree` at
`/c/tmp-rev-wt` (created from `HEAD`, `e4e500f`) and in the session scratchpad. The
working tree was never mutated. The worktree is removed at the end of this review.

### Execution results at HEAD

| Tier | Command | Result |
|---|---|---|
| Structural | `node tests/structural/check-structure.mjs` | exit 0, `STRUCTURAL TESTS PASSED` |
| Unit | `node tests/unit/run-unit-tests.mjs` | exit 0, `UNIT TESTS PASSED` |

Counts were not taken from commit messages; both tiers were executed by this reviewer.

### Mutation probe battery (structural tier oracle strength)

Each probe replaced one new control with a always-pass stub in the worktree, then re-ran
the structural tier. A probe that still exits 0 would prove the pin is decorative.

| Probe | Mutation | Tier exit | Verdict |
|---|---|---|---|
| M1 | `decide()` in `continuation-gate.mjs` returns `{code:0}` always | 1 | caught |
| M2 | `skill_activation` removed from `IMPLEMENT_SCHEMA.required` | 1 | caught |
| M3 | `implementationCompleteness` returns `{ok:true}` always | 1 | caught |
| M4 | `class_sweep.required` reverted to `['searched','found']` | 1 | caught |
| M5 | `findingShapeFault` returns `null` always | 1 | caught |
| M6 | `skillActivationFault` returns `null` always | 1 | caught |
| M7 | `sweepDiscrepancy` returns `null` always | 1 | caught |

7/7 caught. No mutation was a no-op (each probe asserted the source text actually changed).

---

## Summary

**This review returns NEEDS FIXES.** The 0.4.0 corrections are, in their core mechanism
design, the strongest work in this codebase's recorded history: seven independent controls,
every one wired to a real call site, every one proven falsifiable by mutation probe, and a
structural tier that executes its targets rather than asserting about them. The prose-only
failure the drafts diagnose has genuinely been converted into executable checks.

The defects are not in that design — they are in how the two brand-new *executables* meet
the world outside their own fixtures. The Stop hook is correct against all five fixtures
shipped with it and wrong against the one real ledger present on this machine, where it
blocks every end-of-turn in the plugin's own development repository and instructs the agent
to resume a dead acceptance-test lifecycle. It resolves the ledger from `cwd` rather than
`CLAUDE_PROJECT_DIR`, which the platform documentation states diverge, silently disabling
the gate in exactly the sessions it was built for. The deployment preflight reports CURRENT
on a cache whose workflow script and core skill have been gutted, because it byte-compares
only two manifest files. And the new implementation-completeness gate is bypassed entirely
on the plan-amend path, because it reads a variable that is always the halted return.

Every Critical and Serious finding below was established by executing the artifact, not by
reading its assertions.

---

## Upstream Contract Verification

The governing upstream artifacts for this work are the spec (as amended 2026-08-20) and the
seven correction drafts, which function as the per-correction acceptance criteria.

| Contract item | Status | Verification method |
|---|---|---|
| Spec §2 amendment authorizes a Stop-event hook that blocks no tool use | **honored** | Read of the `docs/specs/spec-expert-dev-tools.md` diff: amendment present, dated 2026-08-20, attributed to owner decision, cites the diagnosis. The shipped hook exits only 0 or 2 on a Stop event and registers no tool-use matcher (Read of `hooks/hooks.json` 1-16). |
| Spec §3.4 seven gate types remain exhaustive and are named at the halt point | **honored** | Executed the hook; the block reason enumerates all seven types verbatim (observed stderr). |
| T-A2c "declares no hooks" pin flipped *with* the amendment, not before | **honored** | Read `check-structure.mjs:277-288` and the supersession record at `:480-481`, which names the old pin text and the new. The pin was narrowed, not deleted. |
| agent-quits-midtask §4.1 rule 1 (`stop_hook_active` → allow) | **honored** | Executed: T-30 exec (g) and my own probe both observe exit 0. |
| agent-quits-midtask §4.1 rule 2 (no ledger → allow) | **honored in the fixture, defeated in practice** | Executed: allow on the no-ledger fixture. But see F1 — the rule fires on `cwd`, so it also allows when a ledger *does* exist at the project root. |
| agent-quits-midtask §4.1 rule 3 (`phase === 'complete'` → allow) | **violated in effect** | Executed against the live ledger at `phase: "closeout"` (a finished run) → exit 2. See F2. |
| agent-quits-midtask §4.1 rule 4 (open escalation → allow; legitimate halts keep halting) | **honored** | Executed: T-30 exec (c) and the open-gate fixture both exit 0. |
| agent-quits-midtask §4.1 rule 5 (mid-phase, no open gate → block with reason) | **honored** | Executed; exit 2 with the full reason on stderr. |
| agent-quits-midtask §5 T-28b-f verification (lift and EXECUTE, not assert) | **honored** | The shipped T-30 block executes the script on constructed stdin; M1 proves the oracle fails when the script is gutted. |
| opining-without-reading-source §4.2 (run preflight against fixtures, assert `cache_path`, `installed_version`, `stale`) | **honored** | T-29 checks executed and pass; observed in the run output. |
| opining-without-reading-source header contract: prevent "a live test run against a provably-stale cache" | **violated** | Mutation probe: workflow script, core skill gutted and a script deleted; verdict stayed CURRENT, exit 0. See F3. |
| skill-activation-missed C1 (`skill_activation` in `IMPLEMENT_SCHEMA.required`; re-dispatch once; `control_fault` on second failure; `Unknown skill` straight to gate) | **honored** | Read `expert-lifecycle.js:171-180, 200, 758-771, 1098-1121`; all four behaviors present and wired. M2/M6 prove the pins fail. |
| premature-completion C2 (completed status must account for every recorded plan step) | **honored on the primary path, violated on the amend path** | Read `:835` and traced `impl`/`impl2` scoping at `:758-798`. See F4. |
| patching-instead-of-rederivation C2 (sweep re-executed same-round by an agent that did not perform the correction; fail closed when it did not run) | **honored** | Read `:504-529` and `:1130-1141`; `SWEEP_UNVERIFIED` returned on a missing channel or a short return, handled at `:1000`. M4/M7 prove the pins fail. |
| role-boundary C2 (findings-shape guard checked before findings flow anywhere) | **honored** | Read `:441-456, 485-486`; the guard runs before both the PASS return and the `remediateFn` dispatch. Handled at `:1007`. M5 proves the pin fails. |
| instruction-reinterpretation (`task_verbatim` required and carried end to end) | **honored, with a migration gap** | Read the schema diff, `commands/expert.md:30-32, 66, 90`, and the `control_fault` gate at `expert-lifecycle.js:663`. See F6. |
| Every `runGate` verdict has a handler; unenumerated states fail closed | **honored** | grep of all five verdict literals: each has exactly one producer and one handler (`:994, 1000, 1007, 1018`), with a catch-all at `:1024`. |

---

## Critical & Serious Findings

### F1 — The continuation gate resolves the ledger from `cwd`, which the platform documents as diverging from the project root (Serious)

**What the code does now.** `hooks/continuation-gate.mjs:120` calls
`readLedgerText(input && input.cwd)`, and `:95-98` joins that value with
`.claude/expert/ledger.json`. The comment at `:41-42` states this is "the ledger location
the `/expert` command owns (commands/expert.md:13)".

**How the claim was verified.**
- Read of `hooks/continuation-gate.mjs:41-42, 95-98, 120` at drafting time.
- Read of `commands/expert.md:13`, which reads
  `Ledger path: ${CLAUDE_PROJECT_DIR}/.claude/expert/ledger.json` — a different root than
  the code uses. The comment asserts an equivalence the code does not implement.
- Platform docs, `https://code.claude.com/docs/en/hooks`, fetched 2026-08-21:
  "`cwd` — Current working directory when the hook is invoked", and, verbatim,
  "**`${CLAUDE_PROJECT_DIR}` stays put**: it still points at the project root where the
  session started" while "**`cwd` follows Claude**: the `cwd` field in the hook's input
  JSON is the worktree root after Claude enters a worktree, and the new directory after
  Claude runs `cd`."
- Executed. With the ledger at a project root and `cwd` set to that root, the hook exits 2
  (blocks). With the identical ledger, `CLAUDE_PROJECT_DIR` set to that root, and `cwd` set
  to a subdirectory, the hook exits 0 — the gate is inert.
- grep for `CLAUDE_PROJECT_DIR` in `hooks/continuation-gate.mjs`: 0 hits. The environment
  variable the platform provides for exactly this purpose is never consulted.

**Standard violated.** Consistency of a resolved identifier with its documented source of
truth — the same class as resolving a config path from a mutable ambient value when the
platform supplies a stable one. Concretely, the platform's own hooks contract, which names
`cwd` and `${CLAUDE_PROJECT_DIR}` as distinct and warns that they diverge.

**Why it matters.** The failure is silent and directional: the gate goes inert precisely in
the long, deep sessions where an agent has navigated into a subdirectory or a worktree —
which is the population the six measured stalls came from. A continuation gate that stops
firing as sessions get longer inverts its own purpose, and nothing surfaces the miss.

**What correct looks like.** Resolve the ledger root from `process.env.CLAUDE_PROJECT_DIR`
when present, falling back to `input.cwd` only when it is absent, and correct the `:41-42`
comment so it describes the root the code actually uses.

---

### F2 — Against the only real ledger on this machine, the gate blocks every end-of-turn and instructs the agent to resume a finished lifecycle (Critical)

**What the code does now.** `decide()` (`:57-93`) allows a stop only when `phase` is exactly
the string `'complete'` (`:79`) or an escalation is unresolved (`:86-90`). Every other
non-empty phase blocks. There is no test for whether the lifecycle is stale, abandoned, or
already finished by any other measure.

**How the claim was verified.**
- Read of `hooks/continuation-gate.mjs:75-92` at drafting time.
- Read of `C:\Users\maxco\Documents\agent-armory\.claude\expert\ledger.json` in full,
  2026-08-21 (unpinnable — not under version control). It records `"phase": "closeout"`,
  four escalations all `"resolved": true`, a `gate_history` ending in
  `{gate: "ground_truth", round: 2, verdict: "PASS"}`, and a `task` reading
  "Add a farewell(name) function to greeter.js ... Target project:
  .../tmp-acceptance/a3-project" — a throwaway acceptance exercise that finished.
- **Executed against that live state.** Piping
  `{"cwd":"C:/Users/maxco/Documents/agent-armory","hook_event_name":"Stop"}` into the hook
  returns **exit 2** and writes the full block reason, instructing: "re-invoke
  `/expert resume` to run the next segment".
- Read of `workflows/expert-lifecycle.js:955-958`: `delta.phase = 'complete'` is written
  only after the closeout agent returns. grep for `'complete'` in `commands/expert.md`:
  one hit, at `:216`, describing the reporting step. An interrupted or abandoned closeout
  therefore leaves `phase` permanently non-`complete`, which is the observed state.
- Executed `node scripts/validate-ledger.mjs` against that same live ledger: exit 1,
  `missing required property 'task_verbatim'`. The ledger the hook is blocking on is not
  even resumable under 0.4.0 — the `/expert resume` the block reason demands would halt at
  `commands/expert.md`'s step 1 ledger-validity check.

**Standard violated.** Fail-safe defaults as applied to an always-on interceptor (the
principle the script's own header invokes when it argues that trapping a session is "strictly
worse than a missed reprompt"), and the platform guidance that a Stop hook must not create
conditions that fight the user. The finding is that the script does not apply its own stated
principle to this case: it treats "ledger present and not literally `complete`" as proof of
an active lifecycle, when the observed real-world ledger disproves that equivalence.

**Why it matters.** This is the plugin's own development repository. Every session run here
— including the sessions correcting this plugin — now receives, at the first stop of every
turn-pair, an instruction to abandon the current work and resume a dead greeter.js exercise.
The instruction is not merely spurious, it is unfollowable: the named command halts on the
invalid ledger. The measured defect this correction answers is an agent that will not stay
on task; the correction as shipped injects an off-task directive into every turn. It is
also unbounded in time — nothing expires a ledger, so this persists until someone deletes
the file by hand.

**What correct looks like.** Treat the lifecycle as inactive for gating purposes unless it
is affirmatively live: at minimum, allow the stop when the ledger fails schema validation,
when `phase` is a terminal or post-implementation phase such as `closeout`, and when the
ledger's last modification is older than some bounded staleness window. The block should
require positive evidence of an in-flight lifecycle rather than the absence of the single
string `'complete'`.

---

### F3 — The deployment preflight reports CURRENT on a cache whose behavior files have been gutted (Serious)

**What the code does now.** `scripts/preflight-deployment.mjs:107-115` determines staleness
from exactly two inputs: a manifest `version` string comparison, and a byte comparison of
the two paths hard-coded at `:110`, `['.claude-plugin/plugin.json', '.mcp.json']`.

**How the claim was verified.**
- Read of `scripts/preflight-deployment.mjs:107-115, 130-133` at drafting time.
- Read of the header contract at `:6-9`, which states the script exists to close
  "the canonical failure ... a live test run against a provably-stale cache".
- **Mutation probe, on scratch copies only.** Copied the real installed cache
  (`~/.claude/plugins/cache/claude-armory/expert-dev-tools/0.3.0`) to a scratch path as the
  "working tree". Baseline: `VERDICT: CURRENT`. Then, leaving `.claude-plugin/plugin.json`
  and `.mcp.json` byte-identical, replaced `workflows/expert-lifecycle.js` with
  `process.exit(1)`, replaced `skills/expert-standard/SKILL.md` with a one-line stub, and
  deleted `scripts/validate-ledger.mjs` outright. Re-ran: **`VERDICT: CURRENT`, exit 0.**
- Control: run against the actual working tree at 0.4.0 → `VERDICT: STALE`, exit 1
  (verified separately, since the version differs).

**Standard violated.** The script's own stated contract (quoted above) — the delivered
predicate does not decide the question the header says it decides. Framed against a named
external standard: this is an integrity check whose coverage set excludes the assets whose
integrity is being asserted.

**Why it matters.** The correction's bright line, at `commands/expert.md:44-47`, forbids any
claim about the running plugin's behavior without quoting this report. The report is
therefore load-bearing for exactly the claims it cannot support: the most common real
staleness — source edited in the working tree, version not yet bumped — is the case the
comparison set is blind to, and it renders a confident CURRENT. That is the pin-fails-open
shape this codebase has a measured history of.

**What correct looks like.** Compare the full set of behavior-bearing trees the plugin ships
(`hooks/`, `scripts/`, `workflows/`, `skills/`, `commands/`, `agents/`), for example by a
recursive content digest of each, rather than two manifest files; or state a materially
narrower contract in the header and in `commands/expert.md` so the bright line does not rest
on coverage the script does not provide.

---

### F4 — The new implementation-completeness gate is bypassed on the plan-amend path (Serious)

**What the code does now.** `workflows/expert-lifecycle.js:835` calls
`implementationCompleteness(planFacts.step_ids, impl)`. On the STOP-REPORT amend path, the
re-implementation result is bound to `impl2`, declared with `let` at `:786` inside the
`if` block opened at `:775`, and never assigned back to `impl`.

**How the claim was verified.**
- Read of `expert-lifecycle.js:755-845` at drafting time.
- grep for `impl2` across the file: 5 hits, at `:786, 788, 789, 790, 795` — all inside the
  `:775` block. grep for assignments to `impl`: `:758` and `:766` only, both before the
  amend branch. No reassignment exists.
- Read of `:1070-1071`: `implementationCompleteness` returns `{ok: true}` immediately when
  `impl.status !== 'completed'`. On the amend path `impl` is by construction the halted
  return (that is the branch condition at `:775`), so the gate returns `ok` unconditionally.
- Reachability confirmed by Read of `:775-785`: the branch is entered on a halted return
  whose `stop_report.category` is `PREMISE-FALSE` or `BLAST-RADIUS`, which `:783-784`
  documents as the automatic amend-and-re-implement route — an ordinary expected outcome,
  not an error path.
- The same scoping defect affects the anti-fabrication tier at `:845`
  (`const cited = (impl && impl.evidence) || []`), which likewise inspects the halted
  return's evidence rather than the executed re-implementation's.

**Standard violated.** Complete mediation — a control must be consulted on every access path
to the resource it guards, not only the path it was written against.

**Why it matters.** The premature-completion correction's entire purpose is to catch a
`completed` status that leaves plan steps unaccounted for. The amend path is where a
re-implementation against a freshly rewritten plan is *most* likely to be partial, and it is
the one path where the gate is inert. The pin (M3) passes, because the pin executes the
predicate directly rather than the branch — so the structural tier cannot see this.

**What correct looks like.** Assign the re-implementation result back into `impl` (or route
both returns through one variable) so that the completeness gate, the evidence
cross-consistency check, and the anti-fabrication sample all operate on the return that
actually executed the plan.

---

## Systemic Patterns

**No systemic patterns.** Two candidate patterns were suspected and both were scanned across
the full inventory scope before classification, per Step 8; both resolved to single
instances and are reported above as isolated findings.

- **Candidate: project-root resolution from an ambient value across the plugin's
  executables.** Scan: grep for `CLAUDE_PROJECT_DIR|process.env|\.cwd()|input.cwd|\bcwd\b`
  across `hooks/*.mjs`, `scripts/*.mjs`, `workflows/*.js`. Result: 5 hits. Four are in
  `hooks/continuation-gate.mjs` (F1); the fifth is
  `scripts/preflight-deployment.mjs:24`, which reads `CLAUDE_CONFIG_DIR` — a different,
  correctly-used variable with a documented override purpose. Per-file counts:
  `continuation-gate.mjs` cwd=7 / CLAUDE_PROJECT_DIR=0; `preflight-deployment.mjs`,
  `validate-ledger.mjs`, `extract-owner-turns.mjs` all cwd=0 / CLAUDE_PROJECT_DIR=0.
  **One instance — not systemic.**

- **Candidate: block-scoped result shadowing that strands a downstream gate (the F4 shape).**
  Scan: grep for `let impl2|let .*2 = await agent` across `workflows/expert-lifecycle.js`.
  Result: 1 hit, `:786` — the instance in F4. **One instance — not systemic.**

---

## Moderate & Minor Findings

### F5 — A malformed registry crashes the preflight with an unhandled exception, emitting the STALE exit code (Moderate)

**What the code does now.** `scripts/preflight-deployment.mjs:82-83` iterates
`for (const rec of plugins[key])`, assuming every registry value is an array. There is no
type guard, and the `main()` at `:136-155` has no top-level catch.

**How the claim was verified.** Read of `:76-84` and `:136-155` at drafting time. Executed
with `CLAUDE_CONFIG_DIR` pointed at a scratch registry whose `plugins["expert-dev-tools@m"]`
is an object rather than an array: the process died with an unhandled `TypeError` stack
trace and **exit 1**. A second probe with a top-level JSON array registry correctly returned
exit 2. The real registry (`~/.claude/plugins/installed_plugins.json`, Read 2026-08-21,
`version: 2`) does use arrays, so this is a robustness gap, not a current outage.

**Standard violated.** The script's own documented exit contract at `:8-9` — "Exit 0 on
CURRENT (or provenance-only), 1 on STALE, 2 on unreadable — staleness and unreadability
both fail closed." A crash is an unreadability case, and it emits the *staleness* code.

**Why it matters.** `commands/expert.md:47-50` routes a STALE verdict to the
`stale_deployment` (D15) presentation path. A crashed preflight would therefore be reported
to the owner as "the plugin is behind and needs updating" — a confident, specific, wrong
diagnosis — rather than as an unreadable environment. The structural check labelled
"an unresolvable plugin is UNREADABLE with a non-zero exit (fail closed, never a silent
pass)" passes, because it exercises a resolvable-but-absent plugin rather than a shape fault.

**What correct looks like.** Guard the iteration on `Array.isArray(plugins[key])`, pushing a
`problems` entry otherwise, and wrap `main()` so any unanticipated throw exits 2 with the
message rather than 1.

### F6 — `task_verbatim` was made a required, non-empty schema field with no migration path, and the documented remedy cannot recover it (Moderate)

**What the code does now.** `scripts/ledger.schema.json` adds `task_verbatim` to `required`
with `minLength: 1`. `commands/expert.md:29-33` writes it only "On a DIRECTIVE that opens a
lifecycle" — that is, at intake. No code reads or backfills it for an existing ledger.

**How the claim was verified.** Read of the `scripts/ledger.schema.json` diff in full. grep
for `task_verbatim` in `commands/expert.md`: 4 hits, at `:30, 32, 66, 90`; `:66` is the
fresh-ledger initialization branch, `:90` is the workflow snapshot. Executed
`node scripts/validate-ledger.mjs` against the live pre-0.4.0 ledger: exit 1,
`missing required property 'task_verbatim'`. Read of `commands/expert.md:54-58`, the
documented remedy: "offer to reconstruct the ledger from the artifacts + git history".

**Standard violated.** Backward-compatible schema evolution for persisted state — a new
required field on existing records needs a migration or a default, not only a validator that
rejects them.

**Why it matters.** The remedy is honest and fails closed, which is why this is Moderate
rather than Serious. But it cannot succeed on its own terms: the owner's original request
turn is not recoverable from artifacts or git history, so the one field that is now required
is precisely the one reconstruction cannot supply. Every pre-0.4.0 lifecycle is
unresumable, and the live ledger in this repo is one.

**What correct looks like.** Either accept a documented sentinel for legacy ledgers
(recording that the verbatim text predates the field), or add an explicit migration step that
prompts the owner for the original request, rather than leaving reconstruction to discover
the field is unrecoverable.

---

## Tentative Findings

**One tentative item.**

- **The defect store's current contents were not read.**
  `C:\Users\maxco\.claude\plugins\data\expert-dev-tools\defect-history.json` is on the
  inventory as `[ ]`. Every claim in this review about the seven defect signatures — their
  occurrence counts, states, and responsible components — is taken from the correction
  drafts' own quotations of that store, which are prior-document claims and were **not**
  re-derived against the file. No finding above rests on those quotations: F1-F6 are all
  premised on source Read or execution. The gap that would close this: reading
  `defect-history.json` and confirming each signature's `state`, `occurrences[]` length, and
  `fixed_in_version`, which would also confirm whether the closure discipline the drafts
  describe (signature marked `corrected` only after owner approval and version bump) has been
  correctly left pending for 0.4.0.

No other candidate finding was delivered without verification.

---

## Observations

- The hook's fail-open design is argued explicitly in the header (`:23-29`), including the
  asymmetry against the workflow's fail-closed gates and the reason the asymmetry runs that
  direction here. F2 is not a challenge to that policy — it is that the policy is not applied
  to the abandoned-lifecycle case. Recording this so the next round does not read F2 as a
  request to make the hook fail closed.
- `PRESCRIPTION_RE` (`expert-lifecycle.js:213`) matches five phrasings and would not catch a
  paraphrased prescription. This is **not** filed as a finding: the comment at `:210-212`
  declares it a heuristic tripwire and names the field-sizing bounds as the primary control,
  and the `unknown_keys` check at `:446-447` makes a `fix` or `recommendation` field
  structurally impossible regardless of phrasing. The control does not rest on the regex.
- `sweepVerifyFn` is supplied to the three document gates (`:689, 721, 745`) but not to the
  implementation gate (`:801`). This is consistent with the guard at `:514`, which requires
  `detectFailedCorrection`, and with the documented rationale at `:488-491`. No divergence
  from a standard; recorded for the reader's orientation.
- The Clear Thought `collaborativereasoning` invocation failed once on schema validation
  (enum constraints on persona `communication.style`/`tone`) and succeeded on retry with
  corrected values. No manual fallback was needed; noted per the skill's tool-failure
  recording convention.

---

## What's Actually Good

- **The structural tier is a real oracle, not a text-assertion tier.** Property: every new
  control's pin fails when the control is replaced by an always-pass stub. Standard:
  mutation adequacy — a test suite that cannot detect a deliberately broken implementation
  provides no assurance. Verified by execution: seven mutation probes in an isolated
  worktree (M1-M7 in the table above), 7/7 caught, each probe asserting the source text
  actually changed so that no probe was a silent no-op. Given the brief's warning about this
  codebase's measured history of source-text lexers that miss cases, this result is the
  substantive answer to that history.

- **Every new predicate is wired, and every gate verdict has a handler.** Property: no
  orphaned control code, and no unenumerated state that silently passes. Standard: complete
  mediation plus fail-safe defaults. Verified by grep: six new predicates
  (`findingShapeFault`, `sweepDiscrepancy`, `reExecuteSweeps`, `detectCorrectionFailure`,
  `implementationCompleteness`, `skillActivationFault`) each have at least one call site
  (`:485, 522, 689/721/745, 493, 835, 767/790/1112`); all five `runGate` verdict literals
  (`FINDING_SHAPE_FAULT`, `SWEEP_UNVERIFIED`, `CORRECTOR_HALTED`, `CORRECTION_FAILED`,
  `NON_CONVERGENCE`) have exactly one handler each (`:1007, 1000, 1018, 994`) plus a
  documented catch-all fail-closed at `:1024`.

- **The spec amendment was made as an owner decision and the pin was narrowed rather than
  deleted.** Property: a structural check that had to change was superseded with an auditable
  record of what it used to assert. Standard: traceability of a relaxed control to the
  authority that relaxed it. Verified by Read of the spec §2 diff (amendment dated
  2026-08-20, attributed, citing the diagnosis) and of `check-structure.mjs:277-288` and
  `:480-481`, where the supersession record carries both the old pin's text and the new one's.
  The replacement pin is stronger than a deletion: it asserts the Stop gate is the *only*
  hook and that no tool-use hook exists.

- **The class-sweep re-execution is genuinely independent.** Property: the agent that
  re-executes a declared sweep is not the agent that performed the correction, and a
  re-execution that did not fully run fails the gate rather than passing it. Standard:
  separation of duties in verification. Verified by Read of `:1130-1141` (the verifier
  dispatch, with the prompt stating "You did not perform the correction these sweeps came
  from") and `:514-525` (a missing channel or a short return produces `SWEEP_UNVERIFIED`,
  never a pass).

---

## Convergence Record

First-round review — convergence tracking begins at round 2.

---

## Recommended Priority

1. **F2 (Critical)** — the gate's behavior against a real, stale ledger. It is the only
   finding that degrades every session in this repository today, it is self-aggravating
   (the corrective instruction it injects cannot be followed), and it is the one finding a
   reader would notice before reading this review. Fix first.
2. **F1 (Serious)** — the `cwd` resolution. Bundle with F2: both are corrections to the
   same twenty lines of `decide()`/`readLedgerText`, and F1 determines whether the F2 fix
   is even reachable in the sessions that matter.
3. **F4 (Serious)** — the amend-path bypass. A one-line scoping correction, but the
   structural tier is blind to it, so it needs a branch-level check added alongside the fix
   or it will regress unobserved.
4. **F3 (Serious)** — the preflight's comparison set. Larger in scope than the others
   because it may require choosing between widening the digest and narrowing the documented
   contract; that choice should be made deliberately rather than patched.
5. **F5, F6 (Moderate)** — robustness and migration. Both fail closed today; neither is
   urgent, but F6 gates any attempt to resume the existing ledger, which F2's fix will make
   newly relevant.

Per the project's standing rule, all six findings are to be applied; this ordering is about
sequence, not selection.

---

Verdict: NEEDS FIXES (6 findings: 1 Critical, 3 Serious, 2 Moderate)
