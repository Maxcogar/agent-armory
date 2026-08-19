# Independent review — corrections 0.3.0, round 4 (Post-fix)

Artifact: commits `2b1b7d8` + `95173db` + `e969eb1` + `e8d016e` on `claude/edt-corrections-0.3.0`,
diffed against `origin/main`.
Reviewer: independent (expert-review R1.2). Date: 2026-08-17.
Prior rounds: `claude-plugins/expert-dev-tools/docs/reviews/corrections-0.3.0-round-01.md` (NEEDS FIXES, 9);
`…/corrections-0.3.0-round-02.md` (NEEDS FIXES, 7); `…/corrections-0.3.0-round-03.md` (NEEDS FIXES, 5).

---

## Scope and Inventory

Round 4 — Post-fix review. Inventory constructed per Step 2's post-fix rule from all four sources. Every
claim below was re-derived from current source at drafting time; no premise is inherited from a prior record.

**Source 1 — the prior review's full inventory, re-verified:**

- [x] `claude-plugins/expert-dev-tools/.claude-plugin/plugin.json` — Grep of `git show --stat e8d016e`: not
  among the four changed paths; the 0.3.0 bump stands from `2b1b7d8`.
- [x] `claude-plugins/expert-dev-tools/commands/expert.md` — Read at 40–111 (environment preflight, step 2
  integrity check, step 3 workflow invocation, step 4 artifact upsert / review records / escalations).
  Changed by `e8d016e` (1 line, step 2).
- [x] `claude-plugins/expert-dev-tools/workflows/expert-lifecycle.js` — Read at 146–165 (`IMPLEMENT_SCHEMA`),
  565–644 (plan hand-off, implement phase, amend path, producer loops, the new implement-time gate),
  680–720 (ground-truth guard, full), 775–813 (`documentScopeCheck` comment block and body,
  `maybeNonConvergence`), and 461 (`finish`). Changed by `e8d016e` (22 lines).
- [x] `claude-plugins/expert-dev-tools/agents/expert-architect.md` — Grep of the `e8d016e` stat: unchanged
  this round.
- [x] `claude-plugins/expert-dev-tools/agents/expert-planner.md` — same method, same result.
- [x] `claude-plugins/expert-dev-tools/agents/expert-spec-writer.md` — same method, same result.
- [x] `claude-plugins/expert-dev-tools/skills/expert-standard/SKILL.md` — same method, same result; round-3
  closure of F2-6 is not re-litigated by any finding here.
- [x] `claude-plugins/expert-dev-tools/skills/expert-plan/SKILL.md` — same method, same result.
- [x] `claude-plugins/expert-dev-tools/skills/expert-implement/SKILL.md` — same method, same result.
- [x] `claude-plugins/expert-dev-tools/docs/SKILL-CHANGELOG.md` — same method, same result.

**Source 2 — fix-diff files (`e8d016e`), all four:** `commands/expert.md`,
`tests/structural/check-structure.mjs`, `workflows/expert-lifecycle.js`, and
`docs/reviews/corrections-0.3.0-round-03.md` (the prior record, added to the tree — no claim here rests on it
as a source).

**Source 3 — dependents of the fix-diff files:**

- [x] `claude-plugins/expert-dev-tools/tests/structural/check-structure.mjs` — Read at 640–668 (T-23 and the
  full T-24 block including the new comment); executed, 213 `ok` lines, exit 0.
- [x] `claude-plugins/expert-dev-tools/tests/unit/run-unit-tests.mjs` — executed, 17 `ok` lines, exit 0.
- [x] `claude-plugins/expert-dev-tools/scripts/ledger.schema.json` — Grep for `ledger_integrity` across
  `workflows/`, `commands/`, `scripts/`, `tests/` → **0 hits**; the failure-kind vocabulary is no longer
  produced anywhere, which is the intended consequence of F3-1's fix and is recorded as an Observation.

**Source 4 — the prior review's five findings as closure items:** F3-1 … F3-5, each re-derived from current
source in the Upstream Contract Verification table, never from the round-3 record's assertion.

**Supporting (claims asserted about them):**

- [x] Enumeration of every `outcome:` value produced by the workflow — `grep -on "outcome: '[a-z_]*'"` over
  `workflows/expert-lifecycle.js` → **17 hits**: one `complete` (line 730) and sixteen `owner_gate`
  (447, 501, 517, 524, 589, 622, 657, 667, 676, 705, 713, 720, 735, 745, 807, 812). **Zero `failed`.**
- [x] Enumeration of role filters in the workflow — `grep -n "a.role ===\|role: '"` → 7 hits, at 507, 538,
  561, 596, 614, 696, 697. None inside `documentScopeCheck`. This grounds F4-2.
- [x] `git status --porcelain claude-plugins/expert-dev-tools` → empty; the tree is clean, so every Read
  above is of committed state.
- [x] The five correction drafts under the session task directory. **Unpinnable citation**: session task
  outputs outside version control, cited by path and date 2026-08-17. No finding in this round rests on
  their text.
- [x] `C:\Users\maxco\.claude\plugins\data\expert-dev-tools\defect-history.json` and
  `.claude/expert/ACCEPTANCE-RESULTS-2026-08-17.md` — named as authorizing inputs; carried as context, no
  finding rests on their content.

### Tool plan (Step 3)

| Claim type | Instrument | Used for |
|---|---|---|
| Literal-content | Read at file:line | every diff hunk; the two guard bodies; the scope-check template; `IMPLEMENT_SCHEMA`; `finish()` |
| Absence | grep with recorded query + count | `outcome: 'failed'`; `ledger_integrity`; role filters inside `documentScopeCheck` |
| Behavioral (tests pass) | test-runner execution, both tiers | check counts and exit codes |
| Structural / dataflow | Read of the specific code path, traced against constructed ledger and dispatch-return shapes | the amend path; the implement-time gate predicate; the scope-check hash-list membership |
| Imported from prior documents | re-derivation from current source | all five closure items |
| Comment claims inside the artifact | re-derivation from source | the F3-4 note at `:789-793` and the T-24 comment at `:648-650` |

No library-behavior claims arise in this scope, so Context7 is not load-bearing; no instrument class was
unavailable. `metacognitivemonitoring` was invoked at review start. `collaborativereasoning` was invoked and
succeeded on the second call (the first was rejected for a persona-schema enum violation — a validation
error, not an infrastructure failure). No rigor waivers.

### Execution results

- **Structural tier**: `node tests/structural/check-structure.mjs` → `STRUCTURAL TESTS PASSED`, exit 0,
  **213** `ok` lines. Matches the commit message's "Structural 213/213".
- **Unit tier**: `node tests/unit/run-unit-tests.mjs` → `UNIT TESTS PASSED`, exit 0, **17** `ok` lines.
  Matches "unit 17/17".

### F3-1's three repair sites, traced (requested at dispatch)

1. **Amend-path re-implementation capture** — Read at `:594-597`. The re-implementation is now assigned
   (`const impl2 = await agent(…)`) and its `files_changed` are pushed as `role: 'implementation'`. The
   round-3 discard is genuinely fixed.
2. **Implement-time no-files escalation** — Read at `:617-623`. It is an `owner_gate` with `type:
   GATE.spec_traceable`, a `what_happened`, two `options`, and a `recommendation`, and it sets
   `delta.phase = 'implement'` so a resume re-enters the implement phase. Structurally answerable. **But its
   predicate reads `impl.files_changed` rather than the registered artifacts — see F4-1.**
3. **Ground-truth refusal converted to an owner gate** — Read at `:700-706`. The refusal predicate is
   unchanged (`!specApproved || !implPassed || implArts.length === 0`), the `why` string is unchanged, and
   the return is now `outcome: 'owner_gate'` with `type: GATE.spec_traceable`, two resume options, and a
   recommendation. **No terminal `failed` path remains reachable from any behavior**: the absence grep over
   the whole workflow returns 0 `outcome: 'failed'` and 0 `ledger_integrity`, and the enumeration of all 17
   `outcome:` sites shows only `complete` and `owner_gate`. `commands/expert.md:104-106`, Read at drafting
   time, appends an `escalations` entry whenever `outcome` is `owner_gate`, so both new gates are recorded.

### F3-2's mtime-ordering condition, checked (requested at dispatch)

Rule (4) at `:796` now reads, verbatim: "a file in the earlier-phases-of-this-segment list — exempt ONLY if
its last-modified time predates the authorized artifact's write (check mtimes/git); if it was modified AFTER
this phase began writing, that is an unauthorized upstream edit within this segment, a VIOLATION."
The exemption is no longer unconditional. Whether the condition is the state that makes the exemption safe is
F4-3.

### F3-3's implementation-role exemption, checked (requested at dispatch)

`commands/expert.md:50`, Read at drafting time: "re-hash every `artifact_index` entry except `role:
"implementation"`" with the parenthetical rationale. The step-4 upsert at `:89-95` is unchanged and still
computes and stores a `sha256` for **every** delta artifact regardless of role. The amendments channel is
therefore clean; the second consumer of those stored hashes is not — see F4-2.

### F3-4's gap note, checked (requested at dispatch)

Read at `:789-793`. The note states that the workflow runtime cannot execute processes (no
`child_process`/`spawn`), that draft C's literal git-status-at-dispatch baseline is therefore not
implementable here, and what the adaptation is. The `e969eb1` commit message's claim that this reason was
noted is now true of source.

### F3-5's honest comment, checked (requested at dispatch)

Read at `:648-650`. The T-24 comment now states that the checks "are text assertions, not refusal
observations, because the workflow body is not importable and no execution harness for it exists; the refusal
behavior itself was traced and mutation-probed in review." Accurate as a description of the tier. Whether an
accurate description closes a finding whose standard was "delivered with the test that demonstrates it
refuses" is F4-4.

---

## Summary

**This review returns NEEDS FIXES.** Round 4 is the cleanest single commit of the four: three of five prior
findings close against their originally named standards, including the stranding regression that dominated
round 3. Every terminal failure path is gone — the workflow now produces only `complete` and `owner_gate`,
verified by enumerating all seventeen `outcome:` sites — so no refusal in this lifecycle can strand an owner
without an answerable exit, and the amend-path build outputs that round 3 found discarded are captured and
registered. Both tiers pass at the counts the commit message claims. What blocks the verdict is that the four
open items share one shape, and it is the shape the systemic finding names: each repair conditioned its
control on the data nearest to hand rather than on the recorded state the control actually needs. The new
implement-time gate reads the dispatch return instead of the registered artifacts, so it fires falsely on the
exact amend-path lifecycle the same commit fixed, and loops on resume. The scope check's hash list was never
role-filtered, so the implementation entries introduced by the previous commit now arrive there with stale
hashes and rule (3) will name every legitimately-edited source file an unauthorized upstream edit — the same
false-positive flood F3-3 closed, relocated from the amendments channel into the owner-escalation channel.
The same-segment exemption swapped an unconditional pass for an mtime comparison, an instrument round 1
already rejected by name, and it catches only the interleaving in which the upstream edit follows the
authorized write. Trajectory is 9 → 7 → 5 → 5. The tripwire has not fired, but both of its conditions hold
for the first time this round, which means a fifth round that repeats either one fires it.

---

## Upstream Contract Verification

The upstream contract is the set of five owner-approved correction drafts, plus the round-3 review findings as
the remediation contract for `e8d016e`. Each round-3 finding is checked against the standard originally named
for it.

| Prior finding | Originally named standard | Status | Verification method |
|---|---|---|---|
| **F3-1** (target-traceability conjunct creates a reachable, unrecoverable deadlock) | fail-safe control design as applied to recoverability — a control that refuses must leave a defined path back to a correct state | **CLOSED** | Read `:700-706` (refusal now `owner_gate` with `type`, two `options`, `recommendation`); Read `:594-597` (amend-path capture and registration); grep for `outcome: 'failed'` over the workflow → **0**; enumeration of all 17 `outcome:` sites → `complete` ×1, `owner_gate` ×16; Read `commands/expert.md:104-106` (every `owner_gate` is recorded as an escalation). The new gate added alongside carries its own defect (F4-1), under a different standard and at a different location. |
| **F3-2** (same-segment exemption unconditional) | fail-safe control design — an exemption in a change-detection control must be conditioned on the state that makes it safe | **NOT CLOSED** | Read `:796` rule (4). The exemption is now conditioned, but on mtime ordering rather than on content state. See F4-3. |
| **F3-3** (registering every changed source file pollutes the D9 integrity machinery) | a signal channel must carry only events of the kind it is defined to signal | **CLOSED for the amendments channel** | Read `commands/expert.md:50` — the re-hash loop excludes `role: "implementation"`, so no spurious `amendments` entry is appended for a legitimately edited source file. The stored hashes reach a second consumer that was not exempted; that is a distinct location and is filed as F4-2, not as a failure to close this one. |
| **F3-4** (baseline gap undocumented; commit message asserts documentation that is not there) | a change record's claims must match the change | **CLOSED** | Read `:789-793` — the note exists and states the process-execution limitation and the adaptation, which is what the `e969eb1` message claimed. Re-derived rather than accepted from the comment's own assertion: grep for `child_process\|spawn` over `workflows/expert-lifecycle.js` → 0 hits, confirming the note's factual claim about the runtime is true. |
| **F3-5** (control coverage pins predicate text, not refusal behavior) | a new control is delivered with the test that demonstrates it refuses | **NOT CLOSED** | Read `tests/structural/check-structure.mjs:645-668` — the seven T-24 checks are unchanged; the only change is a comment. No check constructs a ledger, invokes a guard, or observes a refusal. See F4-4. |

---

## Critical & Serious Findings

### F4-2 — The scope check's hash list is not role-filtered, so every legitimately edited implementation file becomes an unauthorized-upstream-edit VIOLATION
**Location:** `claude-plugins/expert-dev-tools/workflows/expert-lifecycle.js:796`
**Severity:** Serious
**Provenance:** regression — introduced by `e969eb1`'s implementation producer, and left in place by
`e8d016e`, whose F3-3 fix exempted `role: "implementation"` at one consumer of the stored hashes and not the
other.

**What the code does now.** `documentScopeCheck` builds its hash list as
`(((led || {}).artifact_index || [])).filter((a) => a.sha256 && a.path !== artifactPath)`. The filter tests
for the presence of a `sha256` and for path inequality. It does not test `role`. Rule (3) of the injected
template then states that "a hash-listed prior artifact whose current hash DIFFERS from its recorded hash —
an unauthorized upstream edit, a VIOLATION."

**How that claim was verified.** Read of `:796` at drafting time for the filter expression and the rule text.
Read of `commands/expert.md:89-95` at drafting time: the step-4 upsert computes the SHA-256 of **every**
`ledger_delta.artifacts` entry and stores it as `{role, path, sha256, …}` "regardless of role" — so
implementation entries satisfy `a.sha256` and are members of the hash list. Read of
`workflows/expert-lifecycle.js:613-614` and `:595-596`: the implement phase pushes one
`role: 'implementation'` entry per entry in `files_changed`, i.e. one per source file the build touched.
Grep for role filters across the workflow (`"a.role ===\|role: '"`) → **7 hits**, at 507, 538, 561, 596, 614,
696, 697 — all either producers or the ground-truth guard; **none inside `documentScopeCheck`**. Read of
`:799-807`: any check with `match === false` sets `delta.phase`, runs `diagnose`, and returns an
`owner_gate`.

**Standard violated.** The same standard round 3 named for F3-3: a signal channel must carry only events of
the kind it is defined to signal; flooding it with benign events destroys its discriminating power. Here the
channel is not `amendments` but the scope-violation owner escalation, which is the higher-cost channel of the
two because it stops the lifecycle and demands an owner decision.

**Why it matters.** The premise the F3-3 fix rests on — that implementation source files change continuously
during ordinary development and must not be hash-pinned — is exactly as true at this consumer as at the one
that was exempted. Concretely: segment 1 implements a feature and registers thirty source files with their
hashes; between segments the owner or any later work edits three of them; segment 2's spec phase runs
`documentScopeCheck`, the verifier recomputes hashes, three files land on rule (3), and the segment halts at
an owner gate reporting three "unauthorized upstream edits" that nobody made. The failure is
self-reinforcing: the owner's only accurate answer is "accept the extra file," and a control whose correct
answer is almost always "accept" is a control that gets clicked through, which is the dynamic round 3 named
when arguing F2-3's false positives were worse than a miss.

**Correct implementation.** Filter the hash list to the document roles the control is about:
`.filter((a) => a.sha256 && a.path !== artifactPath && a.role !== 'implementation')`. The scope check exists
to detect a document phase editing an upstream **document** artifact; build outputs are not upstream
artifacts of a document phase and have no business in its hash list. Applying the exemption at both consumers
in one place — a shared predicate such as `isHashPinned(a)` used by `commands/expert.md` step 2 and by this
filter — would prevent the next consumer from being missed the same way.

---

### F4-3 — The same-segment exemption is conditioned on mtime ordering, which is neither a change-attribution mechanism nor sufficient to make the exemption safe
**Location:** `claude-plugins/expert-dev-tools/workflows/expert-lifecycle.js:796`
**Severity:** Serious
**Provenance:** recurring — round-3 F3-2, same location, same named standard.

**What the code does now.** Rule (4) exempts a same-segment earlier-phase output "ONLY if its last-modified
time predates the authorized artifact's write (check mtimes/git); if it was modified AFTER this phase began
writing, that is an unauthorized upstream edit within this segment, a VIOLATION." The same-segment list is
still `(delta.artifacts || []).filter((a) => a.path !== artifactPath).map((a) => a.path)` — **paths only, no
hashes**.

**How that claim was verified.** Read of `:796` at drafting time for both the list construction and rule (4).
Read of the three document-phase push sites — `:507`, `:538`, `:561` — each pushing `{ role, path }` with
**no `sha256` field**, confirming the round-3 primary remedy was not taken and that rule (4) still cannot be a
content comparison. Grep for `mtime\|last-modified` across the workflow → 2 hits, both introduced by
`e8d016e` (the comment at `:793` and the rule text at `:796`); there is no recorded dispatch timestamp
anywhere in the module for the phrase "when this phase began writing" to resolve against.

**Standard violated.** Fail-safe control design — an exemption in a change-detection control must be
conditioned on the state that makes it safe. mtime is not that state, and this project has already recorded
why: round 1's F-2 rejected mtime by name, on the ground that mtimes "are not a change-attribution mechanism
(they are altered by checkouts, formatters, and any tool that rewrites a file)." A correction that re-adopts
an instrument a prior round of the same review cycle rejected for the same purpose has not met the standard;
it has changed which cases the hole covers.

**Why it matters.** Three separate ways the condition fails to close the hole it targets:

1. **It catches one interleaving of two.** The ordering is entirely at the agent's discretion. An agent that
   edits `spec-x.md` *first* and then writes its authorized `arch-x.md` leaves the spec's mtime **earlier**
   than the authorized artifact's write, so rule (4) exempts it. That interleaving — consult upstream, fix
   what looks wrong, then produce your own output — is the more natural order and the one the architecture
   dispatch prompt at `:533` explicitly forbids ("If premise verification reveals a defect in an upstream
   artifact, do NOT edit that file"). The control remains blind to the case it was rewritten for.
2. **Its two reference points disagree.** "Predates the authorized artifact's write" and "modified AFTER this
   phase began writing" are different instants, and a phase's write is not atomic. The verifier is left to
   pick one, so the rule's outcome varies by agent.
3. **Neither instant is recorded.** The workflow captures no dispatch time and no write time; the verifier can
   only infer both from the filesystem it is also being asked to judge.

**Correct implementation.** Round 3's primary remedy, still available and still the smaller change: add a
`sha256` at the three `delta.artifacts.push` sites (`:507`, `:538`, `:561`), computed the same way
`commands/expert.md` computes it on upsert; merge those entries into the hash list; and delete rule (4)
outright. Same-segment artifacts are then governed by rules (2) and (3) like any other recorded artifact —
exempt while their content is unchanged, a VIOLATION when edited — with no reliance on ordering, on
timestamps, or on the agent's choice of instant.

---

## Systemic Patterns

**One systemic pattern: each correction conditions its control on the nearest available proxy rather than on
the recorded state the control needs.**
**Location:** `claude-plugins/expert-dev-tools/workflows/expert-lifecycle.js:613-623,796` and
`claude-plugins/expert-dev-tools/tests/structural/check-structure.mjs:651-668`
**Severity:** Serious (Systemic)
**Provenance:** new — no prior round reported this substitution. It is distinct from the rounds 1–3 systemic
finding, which was "the computation was added to the orchestrator while the decision stayed with the
dispatched agent." That one is closed and stays closed: every value the ground-truth guard computes is tested
in its own refusal predicate, verified by Read of `:696-700`. The substitution named here is about *which
state* a predicate reads, not about *who decides*.

**Proactive scan.** The candidate arose from F4-1 and F4-3, so per Step 8 it was scanned rather than
extrapolated. The scan enumerated every control condition in the 0.3.0 correction surface — obtained by
grepping the workflow for reads of recorded state
(`"artifact_index\|delta.artifacts\|files_changed\|sha256\|mtime\|last-modified"` → **16 hits**, enumerated
below) and by Reading the seven T-24 checks — and classified each by the state it conditions on:

| Control condition | Site | Conditions on | Verdict |
|---|---|---|---|
| Spec is owner-approved | `:696` | the persisted `artifact_index`, `approved_by_owner === true` | **recorded state** — correct |
| Build is complete | `:699` | the latest `implementation` entry in accumulated `gate_history` | **recorded state** — correct |
| Target is traceable | `:697,700` | accumulated `artifact_index` + `delta.artifacts`, role-filtered | **recorded state** — correct |
| Implementer produced a build | `:620` | `impl.files_changed`, the **dispatch return value** | **proxy** — F4-1 |
| Same-segment artifact is unmodified | `:796` rule (4) | **mtime ordering** | **proxy** — F4-3 |
| Prior artifact is hash-pinned | `:796` hash list | `a.sha256` presence, **role-agnostic** | **wrong subset** — F4-2 |
| The guards refuse | T-24 ×7 | **workflow source text** | **proxy** — F4-4 |

Four of the seven control conditions in this surface are conditioned on a proxy or on the wrong subset of
recorded state — and the three that are correct are precisely the three round 3 verified and closed. Every
one of this round's four open findings is an instance.

**Standard violated.** Fail-safe control design: a predicate must be evaluated against the state whose
property it asserts, not against a correlate of it. A proxy holds until the first case where the correlation
breaks, and every one of these four has such a case documented above — the amend path for `:620`, the
edit-then-write interleaving for rule (4), the cross-segment source edit for the hash list, and a negated
predicate for T-24.

**Why systemic rather than isolated.** The four instances sit in three files, arise from four different
round-3 findings, and were written in one commit, with the same move each time: the state the control needs
was not recorded, so the repair reached for something already in hand that usually tracks it — the dispatch
return instead of the registered artifacts, a timestamp instead of a hash, a hash's presence instead of its
role, source text instead of behavior. Fixing the four individually leaves the move in place, and the move is
what has been generating the next round's findings: F3-2 and F3-5 are on their second round under the same
standard, and F4-2 is F3-3's standard reappearing at the consumer nobody enumerated. The pattern also
explains the trajectory flattening at 5.

**Correct form.** Before conditioning a control, record the state it needs at the point the state exists —
`sha256` at every `delta.artifacts.push`, the accumulated artifact set rather than a single dispatch return,
a role on every index consumer, and an importable predicate the tier can call. Where recording the state is
genuinely impossible in this runtime, the control is not weakened onto a proxy; the gap is named, as
`:789-793` now correctly does for the absent dispatch baseline.

---

## Moderate & Minor Findings

### F4-1 — The implement-time no-files gate reads the dispatch return rather than the registered artifacts, so it fires on the amend-path lifecycle the same commit fixed, and loops on resume
**Location:** `claude-plugins/expert-dev-tools/workflows/expert-lifecycle.js:617-623`
**Severity:** Moderate
**Provenance:** regression — introduced by `e8d016e` while closing F3-1.

The gate's predicate is `!((impl && impl.files_changed) || []).length`, where `impl` is bound at `:579` from
the **first** implementer dispatch. Verified by Read of `:579`, `:594-597`, `:613-623` at drafting time, and
of `IMPLEMENT_SCHEMA` at `:146-165` (`required: ['status']`, `files_changed` optional, `status` enum
`['completed','halted']`).

Two consequences follow. First, on the PREMISE-FALSE / BLAST-RADIUS amend path the original implementer
halted — typically before changing anything, which is why it halted — so `impl.files_changed` is absent,
while `impl2` at `:594` re-ran the amended plan successfully and its outputs were registered at `:595-597`.
The gate nonetheless fires and tells the owner "The implementer completed without reporting any changed
files," which is false: the build exists and is registered two lines above. That is precisely the lifecycle
round 3's F3-1 was raised to protect, now failed at a different site with a softer failure mode. Second, the
gate is not idempotent across resumes: it tests a fresh dispatch return, never the accumulated
`artifact_index`, so a resume re-runs the implement phase and re-evaluates against whatever the new dispatch
returns — a lifecycle whose build is already fully registered can be gated again indefinitely.

Standard: a state guard must test the state it guards, and it must test the same state its downstream
consumer tests. The downstream consumer is the ground-truth guard at `:697`, which reads
`(ledger.artifact_index || []).concat(delta.artifacts || []).filter((a) => a.role === 'implementation')` —
the accumulated, persisted set. This gate exists to surface that same condition earlier, so reading a
different, narrower source guarantees the two disagree. Severity is Moderate rather than Serious because the
gate is answerable — Read of `:621-622` confirms `delta.phase = 'implement'` and an `owner_gate` with options
— so the consequence is a false alarm and a possible loop, not a stranding.

Correct implementation, one edit: hoist the ground-truth guard's `implArts` expression and test it here.
`const implArts = (ledger.artifact_index || []).concat(delta.artifacts || []).filter((a) => a.role ===
'implementation'); if (implArts.length === 0) { … }`. That makes the early gate and the late guard read one
predicate over one state, fixes the amend-path false positive (because `impl2`'s registrations are in
`delta.artifacts`), and makes the gate idempotent on resume (because prior segments' registrations are in
`ledger.artifact_index`).

### F4-4 — Control coverage was neither deepened to refusal behavior nor extended to this round's repairs
**Location:** `claude-plugins/expert-dev-tools/tests/structural/check-structure.mjs:645-668`
**Severity:** Moderate
**Provenance:** recurring — round-3 F3-5, same location, same named standard.

F3-5's named standard is "a new control is delivered with the test that demonstrates it refuses." What
`e8d016e` added is three lines of comment at `:648-650` stating that the checks are text assertions and why.
Verified by Read of the full T-24 block at drafting time: the seven `check(...)` calls are byte-identical to
their round-3 form, and every one is a `wfSrc.includes(...)` or a regex over the workflow's source text. No
check constructs a ledger, invokes a guard, or observes a refusal. An accurate description of a gap is
honesty, not closure; closing against "the comment is now truthful" is closure against an adjacent standard.

The coverage gap also widened, which is why this is Moderate this round rather than Minor. None of
`e8d016e`'s four repairs is pinned by any check, not even in the tier's own text-assertion style: the ground
truth refusal could revert from `owner_gate` to `outcome: 'failed'` and
`wfSrc.includes('!specApproved || !implPassed || implArts.length === 0')` would still pass; the implement-time
gate and the amend-path `impl2` capture have no check at all; and `T-24 scope-check: same-segment
earlier-phase outputs are exempt by path list` asserts only
`wfSrc.includes('Earlier phases of THIS segment already wrote')`, so it passes unchanged with the mtime
condition deleted — and its name now misdescribes a rule that is no longer an unconditional path-list
exemption. The round-3 mitigation (no execution harness exists, so a refusal test is expensive) does not
extend to any of this: text assertions are the tier's established style and cost a line each.

Correct implementation, in two parts. Cheap and immediate: add text assertions for each round-4 repair —
that the ground-truth refusal returns `owner_gate`, that the workflow contains no `outcome: 'failed'`, that
`impl2` is assigned and its `files_changed` registered, that rule (4) carries the mtime condition — and rename
the stale check to describe the conditioned rule. Structural, and what actually satisfies the standard:
extract the refusal predicate as a pure function (`groundTruthRefusal(ledger, delta, specPath) → null |
{kind, detail}`) into `scripts/`, import it in both the workflow and `tests/unit/run-unit-tests.mjs`, and
assert the refusal on constructed ledger shapes — including the amend-path shape, which would have caught
F4-1 in this round rather than the next.

---

## Tentative Findings

No tentative findings — every candidate finding's premise was verified per Compliance Gate B. One caveat is
recorded rather than deferred: the five correction drafts are session task outputs outside version control,
cited by path and date (2026-08-17) with their unpinnable status stated per the Step 6 rule. No finding in
this round derives its premise from them.

---

## Observations

- The failure-kind vocabulary `ledger_integrity` no longer appears anywhere in the plugin: grep across
  `workflows/`, `commands/`, `scripts/`, and `tests/` → 0 hits. This is the intended consequence of F3-1's
  fix (its only producer was the ground-truth refusal, now an `owner_gate`), and nothing consumes it, so no
  contract is left dangling. Recorded as context; no standard is violated.
- The round-3 review record was committed into the tree by `e8d016e`. No claim in this round rests on it as a
  source; it was read to enumerate the five closure items, each of which was re-derived from current source.
- The `commands/expert.md:50` change puts a long parenthetical rationale on a single unwrapped line inside a
  file otherwise wrapped near 75 characters. No standard governing this file's line width was located, so
  this is recorded as context rather than filed as a finding.

---

## What's Actually Good

- **Every terminal failure path is gone, verified exhaustively rather than by sampling.** Enumerating all
  `outcome:` values produced by the workflow (`grep -on "outcome: '[a-z_]*'"` → 17 hits) yields exactly one
  `complete` and sixteen `owner_gate`, and zero `failed`. Good by the fail-safe standard round 3 named for
  F3-1 — a control that refuses must leave a defined path back to a correct state — and stronger than the
  finding required, because the property now holds for the whole module rather than for the one site the
  finding cited. Combined with `commands/expert.md:104-106`, every refusal in this lifecycle is both
  answerable and recorded as an escalation.
- **The F3-4 note is accurate about its own runtime, and independently checkable.** The comment at
  `:789-793` claims the workflow cannot execute processes; re-derived rather than accepted, grep for
  `child_process\|spawn` over the module returns 0 hits. Good by the standard round 3 named — a change
  record's claims must match the change — and notable because the fix was to make the source true rather than
  to soften the commit message, which is the harder of the two directions.
- **The amend-path capture is the minimal correct fix.** Read of `:594-597`: the re-implementation is
  assigned and its `files_changed` registered through the same producer shape as the primary path, rather
  than by special-casing the amend branch downstream. Good by the design principle that a second code path
  producing the same kind of output should register it the same way — it leaves one consumer contract, which
  is exactly why F4-1's narrower read at `:620` stands out as the anomaly rather than the norm.

---

## Convergence Record

- **Round number:** 4 (third Post-fix round).
- **Trajectory:** R1: 9 (1 Serious-Systemic, 4 Serious, 3 Moderate, 1 Minor) → R2: 7 (1 Serious-Systemic,
  3 Serious, 3 Moderate) → R3: 5 (2 Serious, 2 Moderate, 1 Minor) → **R4: 5 (1 Serious-Systemic, 2 Serious,
  2 Moderate)**.
- **Flow counts for this round:**
  - Prior findings **closed**: **3** — F3-1, F3-3, F3-4, each verified against its originally named standard
    in the Upstream Contract Verification table.
  - **Recurring**: **2** — F4-3 (F3-2's standard, same location) and F4-4 (F3-5's standard, same location).
  - **New**: **1** — the systemic finding.
  - **Regressions**: **2** — F4-1 (introduced by `e8d016e`) and F4-2 (introduced by `e969eb1`'s producer and
    left in place by `e8d016e`'s single-consumer exemption).
  - Reconciliation: 5 prior − 3 closed = 2 carried = 2 recurring; 2 + 1 new + 2 regressions = **5**.
- **Tripwire evaluation — NOT FIRED.** Arithmetic shown for both conditions, per round:
  - **(a)** new + regression ≥ closed, for two consecutive Post-fix rounds.
    - R2: 2 + 1 = 3; closed = 6; 3 ≥ 6 → **false**.
    - R3: 1 + 2 = 3; closed = 5; 3 ≥ 5 → **false**.
    - R4: 1 + 2 = 3; closed = 3; 3 ≥ 3 → **TRUE**.
    - The condition holds in R4 only. Two consecutive rounds requires R3 and R4 both true; R3 is false.
      **Not fired.**
  - **(b)** total findings has not strictly decreased, for two consecutive Post-fix rounds. Totals:
    R1 = 9, R2 = 7, R3 = 5, R4 = 5.
    - R2: 7 < 9 → strictly decreased → condition **false**.
    - R3: 5 < 7 → strictly decreased → condition **false**.
    - R4: 5 < 5 is false → did not strictly decrease → condition **TRUE**.
    - The condition holds in R4 only; R3 is false. **Not fired.**
- **Both conditions hold for the first time, in the same round.** Neither has a consecutive partner, so
  neither fires, and the verdict and recommendation are governed accordingly. It is nonetheless the material
  fact of this round's arithmetic: a fifth round in which new + regression ≥ closed, **or** in which the
  total does not fall below 5, fires the tripwire on either condition independently. The systemic finding
  above is the mechanism that would produce exactly that outcome if round 5 is another patch pass, since
  four of this round's four non-systemic items are instances of one substitution.

---

## Recommended Priority

The tripwire did not fire, so foundational rework of the whole correction set is not the indicated path. But
the systemic finding is Serious and names a substitution that all four other findings instantiate, so the
correct unit of work is **re-deriving the two control functions from their drafts, not patching four sites**.
Do the systemic item as one piece of work and the four instances fall out of it.

1. **The systemic pattern first, as one change.** For each of the four control conditions the scan marked
   proxy-or-wrong-subset, record the state the control needs at the point that state exists, then condition
   on it: `sha256` at `:507`, `:538`, `:561`; the accumulated role-filtered artifact set as a single hoisted
   expression used by both `:620` and `:697`; a role predicate shared by `commands/expert.md` step 2 and the
   `:796` hash-list filter. Doing these separately is what has kept regenerating findings under the same
   standards for three rounds.
2. **F4-2 is the instance to land first within that work.** It is the only finding that halts a legitimate
   lifecycle at an owner gate, it fires on the ordinary state of a repository rather than on an exotic path,
   and it trains the owner to click through a scope-violation escalation — which disables the control for the
   true positives too.
3. **F4-3 rides on the same change.** Adding `sha256` at the three document-phase push sites lets rule (4)
   be deleted rather than re-conditioned; do not attempt a third formulation of an mtime rule.
4. **F4-1.** One hoisted expression, and it removes both the amend-path false positive and the resume loop.
5. **F4-4 last, but do the cheap half in the same commit.** Text assertions for each round-4 repair, and the
   rename of the stale same-segment check, cost a line each and would have caught F4-1's divergence from the
   ground-truth predicate. The extraction of `groundTruthRefusal` into `scripts/` is the part that actually
   satisfies the standard and is the one structural investment that would convert this cycle from
   review-finds-it to tier-finds-it.

---

Verdict: NEEDS FIXES (5 findings: 1 Serious-Systemic, 2 Serious, 2 Moderate)
