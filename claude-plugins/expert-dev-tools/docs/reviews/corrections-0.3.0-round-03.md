# Independent review — corrections 0.3.0, round 3 (Post-fix)

Artifact: commits `2b1b7d8` + `95173db` + `e969eb1` on `claude/edt-corrections-0.3.0`, diffed against `origin/main`.
Reviewer: independent (expert-review R1.2). Date: 2026-08-17.
Prior rounds: `claude-plugins/expert-dev-tools/docs/reviews/corrections-0.3.0-round-01.md` (NEEDS FIXES, 9 findings);
`…/corrections-0.3.0-round-02.md` (NEEDS FIXES, 7 findings).

---

## Scope and Inventory

Round 3 — Post-fix review. Inventory constructed per Step 2's post-fix rule from all four sources.

**Source 1 — the prior review's full inventory (re-verified from current source, never inherited):**

- [x] `claude-plugins/expert-dev-tools/.claude-plugin/plugin.json` — Grep of `git show --stat e969eb1` (4 paths); untouched by the fix commit, 0.3.0 bump verified in the `origin/main...` diff.
- [x] `claude-plugins/expert-dev-tools/commands/expert.md` — Read at 40–109 (ledger integrity-check, workflow invocation, artifact registration/upsert) and 220–244 (intent-gate advancement, `approved_by_owner` / `approval_segment`). Grep for `approved_by_owner` → 4 hits in this file (53, 92, 93, 231). Untouched by `e969eb1`.
- [x] `claude-plugins/expert-dev-tools/workflows/expert-lifecycle.js` — Read at 146–165 (`IMPLEMENT_SCHEMA`), 487–491 (cursor derivation), 495–534 (spec phase, registration, intent-gate return), 570–649 (plan hand-off, implement phase, the new producer loop), 671–702 (ground-truth guard, full), 762–783 (`documentScopeCheck`, full). Grep for `baseline|child_process|execute process|git status` → **0 hits**.
- [x] `claude-plugins/expert-dev-tools/agents/expert-architect.md` — Grep of `git show --stat e969eb1`: not among the four changed paths; round-2 status (rewrapped, honored) re-derived from the `origin/main...` diff.
- [x] `claude-plugins/expert-dev-tools/agents/expert-planner.md` — same method, same result.
- [x] `claude-plugins/expert-dev-tools/agents/expert-spec-writer.md` — same method, same result.
- [x] `claude-plugins/expert-dev-tools/skills/expert-standard/SKILL.md` — Read at 19–34 (all three shift paragraphs plus the integrating paragraph at line 30, verbatim).
- [x] `claude-plugins/expert-dev-tools/skills/expert-plan/SKILL.md` — Grep of the `e969eb1` stat: unchanged this round; round-2 closure (F-4) stands on the round-2 verbatim comparison and is not re-litigated by any finding here.
- [x] `claude-plugins/expert-dev-tools/skills/expert-implement/SKILL.md` — same method, same result.
- [x] `claude-plugins/expert-dev-tools/docs/SKILL-CHANGELOG.md` — Grep of the `e969eb1` stat: unchanged this round.

**Source 2 — fix-diff files (`e969eb1`), all four:** `docs/reviews/corrections-0.3.0-round-02.md` (the prior
record, added to the tree — no claim here rests on it as a source), `skills/expert-standard/SKILL.md`,
`tests/structural/check-structure.mjs`, `workflows/expert-lifecycle.js`. All Read above or below.

**Source 3 — dependents of the fix-diff files:**

- [x] `claude-plugins/expert-dev-tools/tests/structural/check-structure.mjs` — Read at 5–15, 95 (`wfSrc` resolution via `ROOT`), 642–664 (the seven new T-24 checks); executed; mutation-probed five times on a scratch copy.
- [x] `claude-plugins/expert-dev-tools/tests/unit/run-unit-tests.mjs` — executed; Read at 24, 26, 39 for the `artifact_index` / `amendments` entry shapes.
- [x] `claude-plugins/expert-dev-tools/scripts/ledger.schema.json` — Grep for `approval_segment` → line 64; Read at 88–89 for the declared purpose of `amendments`.

**Source 4 — the prior review's seven findings as closure items:** F2-1 … F2-6 plus the systemic finding,
each re-derived from current source below, never from the prior record's assertion.

**Supporting (claims asserted about them):**

- [x] Repo-wide search for producers/consumers of `role: 'implementation'` — `grep -rn` over the plugin tree
  excluding `node_modules` and `docs/reviews` → producer at `workflows/expert-lifecycle.js:611`, consumer at
  `:686`. Round 2's zero-producer state no longer holds.
- [x] The five correction drafts under the session task directory. **Unpinnable citation**: session task
  outputs outside version control, cited by path and date 2026-08-17. No finding in this round rests on their
  text; the round-2 findings they authorized were re-derived against current source on the source side.
- [x] `C:\Users\maxco\.claude\plugins\data\expert-dev-tools\defect-history.json` and
  `.claude/expert/ACCEPTANCE-RESULTS-2026-08-17.md` — named as authorizing inputs; carried as context, no
  finding rests on their content.

### Tool plan (Step 3)

| Claim type | Instrument | Used for |
|---|---|---|
| Literal-content | Read at file:line | every diff hunk; the guard body; the scope-check template; the schema |
| Absence | grep with recorded query + count | baseline/exec notes in the workflow; `outcome: 'failed'` handling in `commands/expert.md` |
| Behavioral (tests pass / control is load-bearing) | test-runner execution + **mutation probe** on a scratch copy | both tiers; five T-24 checks |
| Structural / dataflow | Read of the specific code path, traced against constructed ledger shapes | ground-truth refusal predicate; producer reachability; scope-check identifier scope |
| Imported from prior documents | re-derivation from current source | all seven closure items |

No library-behavior claims arise in this scope, so Context7 is not load-bearing; no instrument class was
unavailable. `collaborativereasoning` was invoked and succeeded on the second call (the first was rejected
for a persona-schema enum violation — a validation error, not an infrastructure failure). No rigor waivers.

### Execution results

- **Structural tier**: `node tests/structural/check-structure.mjs` → `STRUCTURAL TESTS PASSED`, exit 0 (213 checks, all seven T-24 among them).
- **Unit tier**: `node tests/unit/run-unit-tests.mjs` → `UNIT TESTS PASSED`, exit 0 (17 checks).

### Mutation probe (requested at dispatch)

Performed on a scratch copy of the whole plugin at
`…/scratchpad/probe`; the repository file was never modified (`git status --porcelain
workflows/expert-lifecycle.js` → empty, checked after the probes). The scratch copy has a **baseline of 2
pre-existing failures** that are environmental, not semantic: `T-A2a workflow: canonical linter present
(validate-workflow.mjs)` and `T-20 baseline reachable from git` — the copy is outside the git work tree and
lacks the linter path. Every probe is therefore read against a baseline of 2.

| # | Mutation applied to the scratch workflow | Result |
|---|---|---|
| M1 | dropped `implArts.length === 0` from the refusal predicate | `FAIL T-24 gt-guard: target traceability is in the refusal predicate`; 3 failures |
| M2 | replaced the producer push with `void f` | `FAIL T-24 gt-guard: implement phase PRODUCES role implementation artifacts`; 3 failures |
| M3 | dropped `&& a.approved_by_owner === true` | `FAIL T-24 gt-guard: spec must be owner-approved in the LEDGER index`; 3 failures |
| M4 | deleted the same-segment exemption text | `FAIL T-24 scope-check: same-segment earlier-phase outputs are exempt by path list`; 3 failures |
| M5 | reverted the latest-verdict test to `.some()` | `FAIL T-24 gt-guard: build-completeness reads the LATEST implementation verdict`; 3 failures |

Each mutation turned exactly its own check red and nothing else. The T-24 block is load-bearing against
deletion, not decorative. What it does **not** do is exercise the guard — see F3-5.

### Ground-truth guard traced against constructed ledger shapes (requested at dispatch)

Guard body Read at `workflows/expert-lifecycle.js:685-694`.

- **Round-2 tautology case — same-segment spec, unapproved.** Refuses correctly, and the tautology is
  structurally dead. `specApproved` now reads `ledger.artifact_index` **only** (line 685), excluding
  `delta.artifacts`, and requires `approved_by_owner === true`. Traced why that is decisive: the spec phase
  **always returns** at line 524 with `outcome: 'owner_gate'`, `type: GATE.intent` — there is no fall-through
  from `spec` to any later cursor. `approved_by_owner` is set only by the command, only on owner approval of
  that intent gate (`commands/expert.md:229-233`), and only into the persisted `artifact_index`. So the spec
  registration at line 507 (`delta.artifacts.push({ role: 'spec', path: specPath })`) can never satisfy
  `specApproved` in its own segment. The round-2 circularity is gone by construction, not by convention.
- **No-implementation-artifacts case.** `implArts = []` → third conjunct true → refuses with
  `'no implementation artifacts are registered, so there is no build output traceable to the executed plan to target (target-traceability check)'`. The refusal fires. **But** this shape is reachable from a
  legitimate lifecycle and is terminal — see F3-1.
- **Latest impl verdict NEEDS_FIXES.** `implGates[implGates.length - 1].verdict !== 'PASS'` → refuses with
  the build-completeness detail. Correct; F-5's closure holds.
- **Clean case.** Approved spec in the ledger index, latest implementation gate PASS, `files_changed`
  registered → all three conjuncts false → dispatch proceeds, with `implArts` paths interpolated into the
  acceptance prompt at line 695. Correct.

### Producer and scope-check identifier resolution (requested at dispatch)

- **The implement phase's producer registers `files_changed`.** Confirmed: `workflows/expert-lifecycle.js:610-612` iterates `(impl && impl.files_changed) || []` and pushes `{ role: 'implementation', path: f }` into
  `delta.artifacts`. `impl` is bound at line 579 from the implementer dispatch under `IMPLEMENT_SCHEMA`, which
  declares `files_changed: { type: 'array', items: S_STR }` (line 152). The command upserts every
  `ledger_delta.artifacts` entry regardless of role (`commands/expert.md:89-95`), so the role reaches the
  persisted index. The round-2 zero-producer state is genuinely fixed. Two consequences of *how* it was fixed
  are findings: F3-1 and F3-3.
- **The scope-check template's identifiers resolve.** `documentScopeCheck(phaseName, resumePhase, artifactPath, led)` is declared at line 778. The template references `led` (its own parameter, used as
  `((led || {}).artifact_index || [])`) and `delta` (module-scope `const` at line 453). The three call sites —
  521, 548, 571 — all execute after line 453, so there is no temporal dead zone. **Both resolve correctly**;
  the template is scope-clean, as it was in round 2.

---

## Summary

**This review returns NEEDS FIXES.** The round-2 corrections are the strongest of the three rounds: five of
seven prior findings close against their originally named standards, including the systemic one. The
ground-truth guard is now a genuine orchestrator predicate — `role: 'implementation'` has a real producer, the
target-traceability conjunct is inside the refusal predicate rather than decorating a prompt string, and
`specApproved` reads owner approval from the persisted ledger index, which kills the round-2 tautology by
construction rather than by convention. Seven new T-24 checks pin all of it, and five mutation probes confirm
they are load-bearing rather than decorative. What remains are two regressions introduced by this commit and
two carried gaps, all confined to two sites. The producer loop that fixed F2-1 created a reachable, terminal
deadlock: a lifecycle whose implementer returns no `files_changed` — including every run that went through the
STOP-REPORT amend path, whose re-implementation output is discarded at line 594 — refuses at ground truth with
`outcome: 'failed'`, no owner gate, no escalation record, and a resume that reproduces the refusal exactly. And
the scope-check fix exempts same-segment artifacts by path with no hash comparison, reopening within a segment
the unconditional-residue hole that round 1 called the serious half of F-2. Trajectory is 9 → 7 → 5; the
non-convergence tripwire has not fired, and the remaining work is narrow and concrete.

---

## Upstream Contract Verification

The upstream contract is the set of five owner-approved correction drafts, plus the round-2 review findings as
the remediation contract for `e969eb1`. Each round-2 finding is checked against the standard originally named
for it.

| Prior finding | Originally named standard | Status | Verification method |
|---|---|---|---|
| **F2-1** (target-traceability inert; role has no producer) | fail-safe control design — a precondition must be evaluated in the decision it guards | **CLOSED** | Read `workflows/expert-lifecycle.js:610-612` (producer) and `:690` (`!specApproved \|\| !implPassed \|\| implArts.length === 0`); grep for the role → producer at 611, consumer at 686; mutation probes M1 and M2 both red |
| **F2-2** (payload coherence tautological) | an integrity check must be evaluated against state recorded independently of the value being checked | **CLOSED** | Read `:685` — reads `ledger.artifact_index` only, requires `approved_by_owner === true`; traced against the spec phase's unconditional intent-gate return at `:524` and the command's approval write at `commands/expert.md:229-233`; mutation probe M3 red |
| **F2-3** (same-segment artifacts reported as violations) | correct attribution in a change-detection control | **CLOSED** | Read `:780` rule (4) and the earlier-phases path list; traced the single-segment spec→arch→plan sequence: `spec-x.md` and `arch-x.md` now land on rule (4), not the catch-all. A different hole in the same rewrite is F3-2 |
| **F2-4** (no dispatch baseline; prompt mislabels hash provenance) | a control's stated provenance must match its actual provenance | **PARTIALLY closed** — relabel done, gap-documentation not | Read `:780` — now "with the SHA-256 hashes recorded at ledger load"; grep for `baseline\|child_process\|execute process\|git status` in the workflow → **0 hits**. See F3-4 |
| **F2-5** (three control predicates with no test coverage) | a new control is delivered with the test that demonstrates it refuses | **PARTIALLY closed** — coverage added and load-bearing, but it pins text, not refusal | Read `tests/structural/check-structure.mjs:645-664`; executed; five mutation probes red. No check constructs a ledger or observes a refusal. See F3-5 |
| **F2-6** (integrating paragraph accounts for two shifts) | internal consistency of a normative document | **CLOSED** | Read `skills/expert-standard/SKILL.md:30` — now names all three failure modes ("Acting-on-inferred-intent is mutation without a mandate"), "does **all three** things right", "Getting **any one** wrong" |
| **Systemic** (computed checks not implemented as orchestrator predicates) | fail-safe / independent-verification design | **CLOSED** | Re-scanned below |

---

## Critical & Serious Findings

### F3-1 — The new target-traceability conjunct creates a reachable, unrecoverable deadlock
**Location:** `claude-plugins/expert-dev-tools/workflows/expert-lifecycle.js:610-612,685-694`
**Severity:** Serious
**Provenance:** regression (introduced by `e969eb1`; the conjunct did not exist before this commit)

**What the code does now.** Line 690 refuses ground-truth dispatch when
`!specApproved || !implPassed || implArts.length === 0`. `implArts` is populated exclusively by the producer
loop at 610–612, which reads `(impl && impl.files_changed) || []`. On refusal, line 691 sets
`delta.phase = 'ground_truth'` and line 694 returns `{ outcome: 'failed', failure: { kind: 'ledger_integrity', … } }`.

**How that claim was verified.** Read of `:610-612` and `:685-694` at drafting time. Read of `IMPLEMENT_SCHEMA`
at `:146-165`: `required: ['status']` — **`files_changed` is optional**, so a schema-valid implementer return
may carry none. Read of `:594`: the re-implementation on the PREMISE-FALSE / BLAST-RADIUS amend path is
`await agent(…)` with **no assignment** — its return value, including its `files_changed`, is discarded, and
`impl` still holds the original halted result. Read of `:487` — `let cursor = ledger.phase || 'intake'` — so a
resume after this refusal re-enters the `ground_truth` branch and evaluates the identical predicate against the
identical ledger. Grep for `ledger_integrity|outcome.*failed|'failed'` across `commands/expert.md` → **0 hits**:
the command has no handling for this outcome at all. Read of `commands/expert.md:104-106` confirms an
`escalations` entry is appended only when `outcome` is `owner_gate`, so this refusal is not even recorded as an
escalation.

**Standard violated.** Fail-safe control design as applied to recoverability: a control that refuses must leave
a defined path back to a correct state. Restated by this codebase's own convention — every other halt in this
workflow returns `outcome: 'owner_gate'` with a `type`, `options`, and a `recommendation` (lines 501, 589, 646,
702, 762, 767), which is precisely so the owner can answer it and resume. This refusal alone returns a bare
terminal failure.

**Why it matters.** The reachable path is not exotic. Any lifecycle that took the STOP-REPORT amend route —
implementer halts on PREMISE-FALSE, planner amends, implementer re-runs successfully — arrives at ground truth
with `impl` still bound to the halted return and `implArts` empty, and is refused for having "no implementation
artifacts" when the build in fact exists. The owner's only exits are hand-editing the ledger's `artifact_index`
or hand-editing `phase`. A fail-safe control whose only escape is manual ledger surgery is the kind that gets
deleted the first time it fires on a real run, taking the true positives with it — which is exactly the
dynamic round 2 named when arguing F2-3's false positives were worse than a miss.

**Correct implementation.** Two changes, both small. Capture the re-implementation's return at line 594
(`const impl2 = await agent(…)`) and register its `files_changed` alongside the original's, so the producer
reflects the build that actually shipped. And route this refusal the way every other halt is routed: return
`outcome: 'owner_gate'` with `type: GATE.spec_traceable`, the `why` string as `what_happened`, and
`options: ['register the build outputs', 'return to implement', 'abort']` — preserving the refusal (it must
still block dispatch) while giving it an answerable exit and an `escalations` record.

---

### F3-2 — The same-segment exemption is unconditional, reopening the upstream-edit blind spot within a segment
**Location:** `claude-plugins/expert-dev-tools/workflows/expert-lifecycle.js:780`
**Severity:** Serious
**Provenance:** regression (introduced by `e969eb1` while closing F2-3)

**What the code does now.** The template injects two lists. The hash list is
`(((led || {}).artifact_index || [])).filter((a) => a.sha256 && a.path !== artifactPath)` — prior-segment
artifacts with their recorded hashes, governed by rules (2) and (3), where a hash **mismatch** is an explicit
VIOLATION. The second list is
`(delta.artifacts || []).filter((a) => a.path !== artifactPath).map((a) => a.path)` — same-segment
earlier-phase outputs, **paths only, no hashes** — governed by rule (4): "a file in the
earlier-phases-of-this-segment list — prior phase output, not a violation (its own phase was checked)."

**How that claim was verified.** Read of `:780` at drafting time. Read of the three `delta.artifacts.push` sites
for document phases — lines 507, 538, 561 — each pushing `{ role, path }` with **no `sha256` field**, which is
why rule (4) is a path test rather than a hash test. Read of `:533`, the architecture dispatch prompt, which
explicitly forbids the edit this rule now waves through: "If premise verification reveals a defect in an
upstream artifact, do NOT edit that file: record the discrepancy … Upstream artifacts change only through the
orchestrator's amendment path."

**Standard violated.** Fail-safe control design — an exemption in a change-detection control must be
conditioned on the state that makes it safe. This is the same standard round 1 named against the original
unconditional residue exemption, which round 2 verified closed for prior-segment artifacts and recorded under
What's Actually Good ("a prior artifact is exempt only while its current hash equals its recorded hash").
Rule (4) reintroduces the unconditional form, scoped to the current segment.

**Why it matters.** Concretely: in one segment, the spec phase writes `spec-x.md`; the architecture phase then
edits `spec-x.md` — the precise action line 533 forbids; the plan phase's scope check sees `spec-x.md` dirty,
finds its path in the earlier-phases list, and rule (4) classifies it "not a violation." The rule's parenthetical
justification, "its own phase was checked," does not hold: the spec phase's scope check ran *before* the
architecture phase existed and cannot speak to a later edit. So the one control positioned to catch an
in-segment upstream edit is blind to it, while the equivalent cross-segment edit is caught by rule (3).

In fairness to the author, round 2 explicitly authorized this shape as a fallback — "Failing that, add an
explicit rule placing any path in `delta.artifacts` ahead of rule (5) as prior-phase residue." The fallback was
implemented faithfully. The hole is nonetheless real, and round 2's *primary* remedy closes it.

**Correct implementation.** Round 2's primary remedy: give `delta.artifacts` entries a `sha256` at push time
(lines 507, 538, 561 — the same digest the command computes on upsert), then merge them into the hash list and
delete rule (4) entirely. Same-segment artifacts are then covered by rules (2) and (3) like any other recorded
artifact, exempt while unchanged and a VIOLATION when edited. This also supplies the recorded-state half that
F3-4 is missing.

---

## Systemic Patterns

**The round-2 systemic finding is CLOSED.** Its named substitution was: "the *computation* was added to the
orchestrator while the *decision* stayed with the dispatched agent," with `implArts` as the clearest form —
computed from ledger state, then handed to the agent as prompt text instead of being tested.

**Proactive scan.** Re-run over the same five mechanical draft elements the prior two rounds enumerated, each
re-located in current source:

| Draft element specifying a computed check | R1 | R2 | R3 (verified) |
|---|---|---|---|
| F: probe target ∈ registered artifacts, else halt | prose | computed, not in predicate | **control** — `implArts.length === 0` is a conjunct of the refusal predicate at `:690`, with a producer at `:611` (probes M1, M2 red) |
| F: criteria source resolves to this ledger's approved spec | prose | string equality, circular | **control** — `:685` requires membership in the persisted `artifact_index` plus `approved_by_owner === true`; circularity dead by construction (probe M3 red) |
| F: sequencing gate on build-complete | code | code, correct | **control** — latest verdict at `:689` (probe M5 red) |
| C: capture baseline before each dispatch | prose | not implemented | **not implemented** — grep for `baseline\|child_process\|execute process\|git status` in the workflow → 0 hits (F3-4) |
| C: violation = any file differing from that baseline | prose + unconditional exemption | partial, catch-all over-fires | **control with a hole** — catch-all over-fire fixed; the same-segment exemption is unconditional (F3-2) |

Grep corroboration, run at drafting time: producers of `role: 'implementation'` across the plugin tree
(excluding `node_modules`, `docs/reviews`) → **1**, at `workflows/expert-lifecycle.js:611`, against round 2's
zero. Of the five mechanical elements, **three are now full orchestrator predicates**, one is a control with a
scoped hole, and one remains unimplemented for a reason that is structural (the module has no process-execution
capability) rather than habitual — against round 2's one-of-five and round 1's one-of-five.

**Why this closes rather than persists.** A systemic finding names a repeated substitution, not a count of open
items. The substitution named in rounds 1 and 2 — decide in the agent, compute in the orchestrator — no longer
occurs at either site: every value the ground-truth guard computes is now tested in the refusal predicate, and
the prompt interpolation at `:695` is additive to the predicate rather than its delivery mechanism, which is
exactly the "correct form" round 2 specified. The two remaining scope-check items are a single unimplemented
element and a single conditioning defect, at one site, from one draft. They are isolated findings (F3-2, F3-4),
not a pattern.

---

## Moderate & Minor Findings

### F3-3 — Registering every changed source file as a ledger artifact pollutes the D9 integrity machinery
**Location:** `claude-plugins/expert-dev-tools/workflows/expert-lifecycle.js:610-612`
**Severity:** Moderate
**Provenance:** new (introduced by `e969eb1`)

The producer pushes one `artifact_index` entry per entry in `impl.files_changed` — for a real build, every
source file the implementation touched. Verified by Read of `:610-612` and of `commands/expert.md:89-95`, which
upserts **every** `ledger_delta.artifacts` entry into `artifact_index` with a computed `sha256`, regardless of
role. The consequence is at `commands/expert.md:50-54`, Read at drafting time: at every subsequent ledger load
the command "re-hash[es] **every** `artifact_index` entry … On any mismatch, mark that artifact **amended**
(append to `amendments`)." Source files change continuously during ordinary development, so every later segment
appends an amendment for every implementation file edited since — against a field whose declared purpose, Read
at `scripts/ledger.schema.json:88-89`, is "Artifact amendments that triggered downstream re-validation
(F-8/D9)." Standard: a signal channel must carry only events of the kind it is defined to signal; flooding it
with benign events destroys its discriminating power, the same failure mode round 2 argued for F2-3's false
positives. The blast radius is bounded — implementation entries are neither specs nor owner-approved, so
`commands/expert.md:53-54` raises no escalation and invalidates no approval — which is why this is Moderate
rather than Serious. Correct form: give build outputs a role the integrity loop does not re-hash (e.g. keep
`role: 'implementation'` but exclude that role from the step-2 re-hash and amendment loop in
`commands/expert.md`), or register a single entry naming the build rather than one per file. The guard needs
`implArts.length > 0` and a list of paths for the acceptance prompt; neither requires hash anchoring.

### F3-4 — No dispatch baseline exists, the gap is undocumented, and the commit message asserts documentation that is not there
**Location:** `claude-plugins/expert-dev-tools/workflows/expert-lifecycle.js:769-780`
**Severity:** Moderate
**Provenance:** recurring (round-2 F2-4, baseline half, same location, same standard)

The relabel half of F2-4 is closed: Read of `:780` confirms the template now says "Prior-segment artifacts with
the SHA-256 hashes recorded at ledger load," which matches the actual provenance at `commands/expert.md:50`.
The remaining half is not. F2-4's stated remedy was to "either capture the baseline in `commands/expert.md` —
which does have Bash — immediately before the workflow call and thread it in as input, **or state in the comment
that no baseline exists and what that costs**." Neither was done: `commands/expert.md` is not among the four
paths in `git show --stat e969eb1`, and grep for `baseline|child_process|execute process|git status` across
`workflows/expert-lifecycle.js` returns **0 hits**. Read of the function's comment block at `:769-777` confirms
it discusses least privilege and the inability to sandbox writes, but says nothing about the absent baseline or
the workflow's lack of process-execution capability. This matters because `e969eb1`'s commit message states the
opposite: "labels the hashes as recorded at ledger load (F2-4), **with the workflow's inability to execute
processes noted as the reason** hash-injection replaces the draft's literal git-status baseline." No such note
exists in source. Standard: a change record's claims must match the change — the same false-attestation problem
round 2 identified in F2-1's comment and called the highest-cost outcome because it suppresses the next review,
here in the commit message rather than a code comment. Correct form: add the note the commit message already
claims — that no dispatch baseline is captured, that the module has no process-execution capability so draft C's
literal `git status --porcelain -uall` is not implementable here, and that the cost is that the compared file
set is whatever the agent finds dirty rather than a captured baseline.

### F3-5 — The new control coverage pins predicate text, not refusal behavior
**Location:** `claude-plugins/expert-dev-tools/tests/structural/check-structure.mjs:645-664`
**Severity:** Minor
**Provenance:** recurring (round-2 F2-5, same standard)

All seven T-24 checks are source-text assertions — `wfSrc.includes(...)` or a regex over the workflow's text —
verified by Read at `:645-664`. They are genuinely load-bearing: five mutation probes each turned exactly their
own check red, recorded above. But F2-5's named standard was "a new control is delivered with the test that
demonstrates it **refuses**," and no check constructs a ledger, invokes the guard, or observes a refusal;
`wfSrc.includes('!specApproved || !implPassed || implArts.length === 0')` would pass unchanged if the predicate
were negated elsewhere or the refusal branch returned success. Closure against text-presence is closure against
an adjacent standard. Mitigating and material: the guard lives in a Workflow-tool body that uses top-level
`await` and the injected `agent()`, so it is not importable, and the structural tier's own oracle only *parses*
it (`T-A2a workflow: parses as a workflow body (strict)`, Read at `:225`) — no execution harness exists, which
is why this is Minor rather than Moderate. Correct form: extract the predicate as a pure function
(`groundTruthRefusal(ledger, delta, specPath) → null | {kind, detail}`) into `scripts/`, import it in both the
workflow and `tests/unit/run-unit-tests.mjs`, and add the four ledger shapes traced in this review's guard trace
— unapproved same-segment spec, empty `implArts`, latest gate NEEDS_FIXES, and the clean case — as unit
assertions on the returned value.

---

## Tentative Findings

No tentative findings — every candidate finding's premise was verified per Compliance Gate B. One caveat is
recorded rather than deferred: the five correction drafts are session task outputs outside version control,
cited by path and date (2026-08-17) with their unpinnable status stated per the Step 6 rule. No finding in this
round derives its premise from them; the draft-derived requirements they authorized reach this round through
the round-2 record and were re-derived against current source on the source side.

---

## Observations

- The mutation probes were run on a scratch copy at
  `…/scratchpad/probe`, restored between probes from a local backup, and the repository's
  `workflows/expert-lifecycle.js` was confirmed clean afterward via `git status --porcelain`. The scratch copy
  carries two environmental baseline failures (a missing linter path and a git-dependent check) because it sits
  outside the work tree; every probe result above is read against that baseline of 2. No standard is violated
  by this, so it is recorded as method context.
- The round-2 review record was committed into the tree by `e969eb1`. No claim in this round rests on it as a
  source; it was read to enumerate the seven closure items, each of which was re-derived from current source.

---

## What's Actually Good

- **The ground-truth guard is now a real predicate over independently recorded state.** Verified across four
  sites: the producer at `:611`, the three-conjunct refusal at `:690`, the approval read restricted to
  `ledger.artifact_index` at `:685`, and the spec phase's unconditional intent-gate return at `:524` that makes
  same-segment satisfaction impossible. Good by the fail-safe standard rounds 1 and 2 both named — a
  precondition evaluated in the decision it guards, against state the current run cannot write. The
  `approved_by_owner` conjunct is the strongest part: it makes the check pass only on state the owner produced,
  which no arrangement of agent output can forge.
- **The T-24 checks were mutation-verified, not merely added.** Verified by executing five independent
  mutations on a scratch copy, each turning exactly its own check red and nothing else. Good by the
  test-quality standard that a test earns its place only if it can fail for the reason it exists — the commit
  message's claim "each mutation-probed red before commit" is one I could and did independently reproduce,
  which is the rarer property.
- **The F2-2 fix is structural rather than defensive.** Verified by tracing the control flow at `:524` and the
  approval write at `commands/expert.md:229-233`: rather than adding a same-segment check, the fix relies on
  approval being unforgeable within a segment because the spec phase always returns to the owner first. Good by
  the design principle that a correctness property held by construction cannot be regressed by a later edit
  that forgets to maintain it.

---

## Convergence Record

- **Round number:** 3 (second Post-fix round).
- **Trajectory:** R1: 9 findings (1 Serious-Systemic, 4 Serious, 3 Moderate, 1 Minor) → R2: 7 findings
  (1 Serious-Systemic, 3 Serious, 3 Moderate) → **R3: 5 findings (2 Serious, 2 Moderate, 1 Minor)**.
- **Flow counts for this round:**
  - Prior findings **closed**: **5** — F2-1, F2-2, F2-3, F2-6, and the systemic finding, each verified against
    its originally named standard in the Upstream Contract Verification table.
  - **Recurring**: **2** — F3-4 (F2-4's baseline half) and F3-5 (F2-5's demonstrates-refusal standard).
  - **New**: **1** — F3-3.
  - **Regressions**: **2** — F3-1 and F3-2, both introduced by `e969eb1`.
  - Reconciliation: 7 prior − 5 closed = 2 carried = 2 recurring; 2 + 1 new + 2 regressions = **5**.
- **Tripwire evaluation — NOT FIRED.** Arithmetic shown for both conditions:
  - **(a)** new + regression ≥ closed, for two consecutive Post-fix rounds. This round: 1 + 2 = **3**,
    closed = **5**; 3 ≥ 5 is **false**. Prior round: 2 + 1 = **3**, closed = **6**; 3 ≥ 6 is **false**. The
    condition holds in neither round, so it cannot hold for two consecutive rounds. Not fired.
  - **(b)** total findings has not strictly decreased, for two consecutive Post-fix rounds. Totals: R1 = 9,
    R2 = 7, R3 = 5. R2: 7 < 9, strictly decreased. R3: 5 < 7, strictly decreased. The condition holds in
    neither round. Not fired.

  Both conditions are false in both Post-fix rounds. The fix cycle is converging, and the concentration of the
  remaining findings supports that reading independently of the counts: all five sit at two sites — the
  ground-truth guard's producer/predicate pair and the scope-check rule list.

---

## Recommended Priority

The tripwire did not fire, and foundational rework is **not** indicated. Another fix round is the correct path:
the finding count has strictly decreased in both Post-fix rounds, the systemic pattern is closed, and every
remaining item is a bounded change at one of two sites.

1. **F3-1 first.** It is the only finding that can strand a lifecycle with no path forward, and it fires on
   correct behavior — a successful amend-path build is refused for having produced nothing. Two edits: capture
   the re-implementation's return at line 594 and register its `files_changed`; convert the refusal at 691–694
   from `outcome: 'failed'` to an `owner_gate` with options, matching every other halt in the file.
2. **F3-2.** Take round 2's primary remedy this time rather than the fallback: add `sha256` at the three
   `delta.artifacts.push` sites, merge same-segment entries into the hash list, and delete rule (4). One change
   closes the in-segment upstream-edit hole and supplies the recorded-state half F3-4 needs.
3. **F3-3.** Decide how build outputs live in the ledger before more segments accumulate amendment noise —
   exempting `role: 'implementation'` from the step-2 re-hash loop in `commands/expert.md` is the smaller change
   and preserves everything the guard needs.
4. **F3-4.** Add the note the commit message already claims exists, and correct the record. This is a few
   sentences of comment plus honesty about the absent baseline.
5. **F3-5.** Extract the refusal predicate as a pure function and unit-test the four ledger shapes. Lowest
   urgency because the T-24 block demonstrably resists deletion, but it is what converts "the text is present"
   into "the guard refuses," and it would have caught F3-1 before this round.

---

Verdict: NEEDS FIXES (5 findings: 2 Serious, 2 Moderate, 1 Minor)
