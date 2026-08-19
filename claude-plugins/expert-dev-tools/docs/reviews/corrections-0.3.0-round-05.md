# Independent review — corrections 0.3.0, round 5 (Post-fix)

Artifact: commits `2b1b7d8` + `95173db` + `e969eb1` + `e8d016e` + `1f014e0` on
`claude/edt-corrections-0.3.0`, diffed against `origin/main`.
Reviewer: independent (expert-review R1.2). Date: 2026-08-17.
Prior rounds: `claude-plugins/expert-dev-tools/docs/reviews/corrections-0.3.0-round-01.md` (NEEDS FIXES, 9);
`…-round-02.md` (NEEDS FIXES, 7); `…-round-03.md` (NEEDS FIXES, 5); `…-round-04.md` (NEEDS FIXES, 5).

---

## Scope and Inventory

Round 5 — Post-fix review. Inventory built per Step 2's post-fix rule from all four sources. Every premise
below was re-derived from current source at drafting time; nothing is inherited from a prior record.

**Source 1 — the prior review's full inventory, re-verified:**

- [x] `claude-plugins/expert-dev-tools/.claude-plugin/plugin.json` — Grep of `git show --stat 1f014e0`: not
  among the three changed paths; the 0.3.0 bump stands from `2b1b7d8`.
- [x] `claude-plugins/expert-dev-tools/workflows/expert-lifecycle.js` — Read at 429 (`ledger`), 454–460
  (`delta` and the two hoisted shared expressions), 495–575 (spec/architecture/plan phases and their
  `delta.artifacts.push` + `documentScopeCheck` ordering), 575–640 (implement phase, amend path, producer
  loops, the implement-time gate), 655–690 (spot re-run, diff-vs-plan), 700–730 (ground-truth guard,
  reconciliation), 797–825 (`documentScopeCheck` comment block, dispatch prompt, hash capture, violation
  filter), 183–196 (`VERIFIER_SCHEMA`), 146–165 (`IMPLEMENT_SCHEMA`). Changed by `1f014e0` (42 lines).
- [x] `claude-plugins/expert-dev-tools/tests/structural/check-structure.mjs` — Read at 443–495 (T-18 label
  capture window and `REPLACED_BY_STRENGTHENING`) and 655–680 (the full T-24 block). Changed by `1f014e0`
  (26 lines). Executed; mutation-probed five ways (below).
- [x] `claude-plugins/expert-dev-tools/commands/expert.md` — Read at 40–115 (step 2 integrity check with the
  `role: "implementation"` exemption; step 3 workflow invocation; step 4 artifact upsert, review records,
  escalations). Unchanged by `1f014e0`.
- [x] `claude-plugins/expert-dev-tools/agents/expert-architect.md` — Grep of the `1f014e0` stat: unchanged.
- [x] `claude-plugins/expert-dev-tools/agents/expert-planner.md` — same method, same result.
- [x] `claude-plugins/expert-dev-tools/agents/expert-spec-writer.md` — same method, same result.
- [x] `claude-plugins/expert-dev-tools/skills/expert-standard/SKILL.md` — same method, same result.
- [x] `claude-plugins/expert-dev-tools/skills/expert-plan/SKILL.md` — same method, same result.
- [x] `claude-plugins/expert-dev-tools/skills/expert-implement/SKILL.md` — same method, same result.
- [x] `claude-plugins/expert-dev-tools/docs/SKILL-CHANGELOG.md` — same method, same result.

**Source 2 — fix-diff files (`1f014e0`), all three:** `workflows/expert-lifecycle.js`,
`tests/structural/check-structure.mjs`, and `docs/reviews/corrections-0.3.0-round-04.md` (the prior record,
added to the tree — no claim here rests on it as a source).

**Source 3 — dependents of the fix-diff files:**

- [x] `claude-plugins/expert-dev-tools/tests/unit/run-unit-tests.mjs` — Read at 5–10 (its imports, which
  establish that this tier already imports pure functions from `scripts/`); executed, 17 `ok`, exit 0.
- [x] `claude-plugins/expert-dev-tools/scripts/validate-ledger.mjs`, `scripts/extract-owner-turns.mjs`,
  `scripts/ledger.schema.json` — Grep-verified as the unit tier's import targets (`grep -n "^import"
  tests/unit/run-unit-tests.mjs` → 6 hits, two of them `../../scripts/`); `ls scripts/` → 3 entries, no
  refusal-predicate module among them. Grounds F5-3.

**Source 4 — the prior review's five findings as closure items:** F4-1 … F4-4 and the round-4 systemic
finding, each re-derived from current source in the Upstream Contract Verification table.

**Supporting (claims asserted about them):**

- [x] `git status --porcelain claude-plugins/expert-dev-tools` → empty before and after the mutation probes;
  every Read is of committed state and every probe was restored with `git checkout --`.
- [x] `git show origin/main:claude-plugins/expert-dev-tools/workflows/expert-lifecycle.js | grep -n "checks
  || \[\]"` → 3 hits (645, 655, 676), establishing which instances of the systemic pattern predate the
  corrections branch.
- [x] `C:\Users\maxco\.claude\plugins\data\expert-dev-tools\defect-history.json` and
  `.claude/expert/ACCEPTANCE-RESULTS-2026-08-17.md` — named as authorizing inputs; carried as context, no
  finding rests on their content.
- [x] The five owner-approved correction drafts under the session task directory. **Unpinnable citation**:
  session task outputs outside version control, cited by path and date 2026-08-17. No finding rests on them.

### Tool plan (Step 3)

| Claim type | Instrument | Used for |
|---|---|---|
| Literal-content | Read at file:line | every diff hunk; the two hoisted expressions; the scope-check prompt and hash-capture block; `VERIFIER_SCHEMA`; the T-24 block |
| Absence | grep with recorded query + count | residual local proxies; `outcome: 'failed'`; `mtime`/`last-modified`; refusal-predicate module under `scripts/` |
| Behavioral (tests pass; checks are live) | test-runner execution + in-place mutation probes with restore | both tiers; five mutations M1–M5 |
| Structural / dataflow | Read of the specific code path, traced against constructed ledger and delta shapes | the hash round trip; the implement-gate predicate; the accumulator |
| Imported from prior documents | re-derivation from current source | all five closure items |
| Comment claims inside the artifact | re-derivation from source | the `:797-803` adaptation note and the `1f014e0` commit message's counts |

No library-behavior claims arise in this scope, so Context7 is not load-bearing; no instrument class was
unavailable. A `git worktree` for isolated probing could not be created (Windows path-length limit on an
unrelated `claude-plugins/agentboard/skills/correction-loop-workspace/…` path); mutation probing was
performed in place with `git checkout --` restore after each, and the clean `git status` above is the
evidence that no mutation persisted. `metacognitivemonitoring` was invoked at review start.
`collaborativereasoning` was invoked and succeeded on the second call (the first was rejected for a
persona-schema enum violation — a validation error, not an infrastructure failure). No rigor waivers.

### Execution results

- **Structural tier**: `node tests/structural/check-structure.mjs` → `STRUCTURAL TESTS PASSED`, exit 0,
  **217** `ok` lines. Matches the commit message's "Structural 217/217".
- **Unit tier**: `node tests/unit/run-unit-tests.mjs` → `UNIT TESTS PASSED`, exit 0, **17** `ok` lines.
  Matches "unit 17/17".

### Mutation probes of the new T-24 checks (requested at dispatch; five run, in place, each restored)

| # | Mutation | Result |
|---|---|---|
| M1 | `:629` reverted to the round-4 local proxy `!((impl && impl.files_changed) \|\| []).length` | **caught** — `FAIL T-24 shared accumulator: implement gate and gt-guard read the same registered set`, exit 1 |
| M2 | `isHashPinnedRole(a)` dropped from the `:807` hash-list filter | **caught** — two FAILs (`shared role predicate`, `prior-artifact hashes are injected`), exit 1 |
| M3 | `mine.sha256 = hex[0]` neutered at `:819` | **caught** — `FAIL T-24 scope-check: each phase RECORDS its artifact hash via the verifier`, exit 1 |
| M4 | an mtime exemption rule **reworded** ("its modification time is earlier than this phase's write") reintroduced into the `:807` rule list | **NOT caught** — exit 0, tier green. Grounds F5-4. |
| M5 | the `no mtime proxy remains` check deleted outright from the tier | **caught** — `FAIL T-20 no check present at baseline was removed`, exit 1; the widened 60→160 label window works |

### Round-4 repair sites, traced (requested at dispatch)

1. **Hoisted shared expressions are the only readers.** `grep -n "implementationArtifacts\|isHashPinnedRole"`
   over `workflows/expert-lifecycle.js` → definitions at `:458-459`, consumers at `:629` (implement gate),
   `:706` (ground-truth guard), `:807` (scope-check hash filter). The residual-proxy grep
   (`"artifact_index || \[\])\.concat\|files_changed\|role === 'implementation'\|mtime\|last-modified\|outcome:
   'failed'"`) returns 7 hits, all accounted for: the schema declaration at `:152`, the accumulator's own
   definition at `:459`, the two legitimate producer loops at `:601` and `:619`, two comments at `:623` and
   `:702`, and the `:807` prompt. **No local proxy survives**, and there is no `mtime`, no `last-modified`,
   and no `outcome: 'failed'` anywhere in the module.
2. **The scope-check hash round trip, traced end to end.** Read of `:507`, `:538`, `:561`: each document
   phase pushes `{role, path}` into `delta.artifacts` **before** calling `documentScopeCheck`, so the entry
   the capture block looks for exists. Read of `:807`: the verifier is told to always emit a check with
   `cited_claim: "artifact-sha256"` whose `re_execution` carries the digest. Read of `:810-820`: the
   workflow finds that entry, regex-extracts `/[0-9a-f]{64}/` from `re_execution`, and writes it to
   `mine.sha256`. Read of `:807` again: the next phase's hash list is
   `((led.artifact_index || []).concat(delta.artifacts || [])).filter((a) => a.sha256 && isHashPinnedRole(a)
   && a.path !== artifactPath)` — so the just-recorded hash is a member, role-filtered. Across segments the
   loop closes through `commands/expert.md:89-95`, which recomputes and upserts a `sha256` for every
   `ledger_delta.artifacts` entry. **The happy path is genuinely wired.** Its failure path is not — F5-1.
3. **The mtime proxy is gone.** `grep -n "mtime\|last-modified"` over the workflow → **0 hits**. Rule (4) is
   deleted; the rule list at `:807` now runs (1) authorized path, (2) hash matches → residue, (3) hash
   differs → VIOLATION, (4) bookkeeping, (5) any other changed file → VIOLATION.
4. **The implement-time gate reads the accumulated set.** Read of `:629`: `if
   (implementationArtifacts().length === 0)`. Read of `:706`: `const implArts = implementationArtifacts()`.
   One expression, two consumers, over `ledger.artifact_index` concat `delta.artifacts` — so the amend
   path's `impl2` registrations at `:601` are visible to it and the gate is idempotent across resumes.

---

## Summary

**This review returns NEEDS FIXES.** Round 5 is the first round of this cycle that did the work as one piece
rather than as a patch per site, and it shows: four of the five round-4 findings close against their
originally named standards, including the systemic one, and the closures are structural rather than local.
The two hoisted expressions are demonstrably the only readers — the residual-proxy grep is clean, the mtime
instrument is gone from the module entirely, and the scope check's same-segment hole is closed the way round
3 originally prescribed, by recording a real content hash at the one point in the pipeline that can compute
one. Both tiers pass at the counts the commit claims, and four of five mutation probes confirm the new checks
are live rather than decorative. What blocks the verdict is that the new hash-recording mechanism depends on
a dispatched agent returning a specific optional field, and the workflow neither requires it nor notices when
it is absent: `re_execution` is optional in `VERIFIER_SCHEMA`, the capture is wrapped in a bare `if (hex)`
with no else, and because rule (4) was deleted there is no longer any rule that names a same-segment artifact
by path — so a silently unrecorded hash converts a legitimate earlier-phase output into a rule-(5) VIOLATION
and halts the segment at an owner gate. That failure shape is not new to this commit; it is how every
verifier return in this module is consumed, at five sites, and the correction propagated it into two more.
Below that, the control-coverage finding is on its third round: the tier gained four more text assertions but
still never observes a refusal, in a project whose unit tier already imports pure functions from `scripts/`.
Trajectory is 9 → 7 → 5 → 5 → 4. Both tripwire conditions held in round 4; both are broken this round, so
the tripwire does not fire and the arithmetic is shown in full below.

---

## Upstream Contract Verification

The upstream contract is the set of five owner-approved correction drafts, plus the round-4 review findings as
the remediation contract for `1f014e0`. Each round-4 finding is checked against the standard originally named
for it.

| Prior finding | Originally named standard | Status | Verification method |
|---|---|---|---|
| **Round-4 Systemic** (each correction conditions its control on the nearest available proxy rather than on the recorded state the control needs) | fail-safe control design — a predicate must be evaluated against the state whose property it asserts, not against a correlate of it | **CLOSED** | Re-ran round 4's scan over current source. Of its seven control conditions, three were already correct and remain so (`:704`, `:707-709`); three were proxies and are now conditioned on recorded state (`:629` on the accumulated registered set, `:807` rule (3) on recorded content hashes, `:807` hash list on the shared role predicate) — each confirmed by Read at drafting time and by mutation probes M1–M3, which fail the tier when the proxy is restored. The seventh (T-24 on source text) is unchanged and remains open as F5-3, but one surviving instance is an isolated finding, not a pattern: the substitution move itself was removed from the code surface. Residual-proxy grep → 0 surviving local proxies. |
| **F4-1** (implement-time gate reads the dispatch return rather than the registered artifacts) | a state guard must test the state it guards, and the same state its downstream consumer tests | **CLOSED** | Read `:629` and `:706` at drafting time — both call `implementationArtifacts()`, defined once at `:459`. The amend-path false positive is gone because `impl2`'s registrations at `:601` land in `delta.artifacts`, which the accumulator reads; the resume loop is gone because prior segments' registrations are in `ledger.artifact_index`, which it also reads. Mutation probe M1 confirms the tier now fails if the local proxy is restored. |
| **F4-2** (scope-check hash list not role-filtered) | a signal channel must carry only events of the kind it is defined to signal | **CLOSED** | Read `:807` — the filter is now `a.sha256 && isHashPinnedRole(a) && a.path !== artifactPath`, with `isHashPinnedRole` defined at `:458` as `a.role !== 'implementation'`. Read `commands/expert.md:50` — the step-2 re-hash carries the same exemption in prose. Both consumers of the stored hashes now exempt the same role. Mutation probe M2 confirms the tier fails if the filter is dropped. |
| **F4-3** (same-segment exemption conditioned on mtime ordering) | fail-safe control design — an exemption in a change-detection control must be conditioned on the state that makes it safe | **CLOSED** | Read `:807` — rule (4) is deleted; same-segment artifacts are governed by rules (2) and (3) like any other recorded artifact, which is round 3's primary remedy. `grep -n "mtime\|last-modified"` over the workflow → **0 hits**. The state the exemption now rests on is recorded content, not a timestamp, and it covers both edit interleavings. The mechanism that records that state has an unhandled failure path — that is a distinct defect at a distinct location under a distinct standard, filed as F5-1, not a failure to close this one. |
| **F4-4** (control coverage pins predicate text, not refusal behavior) | a new control is delivered with the test that demonstrates it refuses | **NOT CLOSED** | Read of the full T-24 block at `tests/structural/check-structure.mjs:655-680` at drafting time: `1f014e0` added four checks and renamed one, and every one of the eleven checks in the block is a `wfSrc.includes(...)` or a negated `includes` over the workflow's **source text**. No check constructs a ledger, invokes a guard, or observes a refusal. `ls scripts/` → 3 files, none a refusal predicate. See F5-3. |

---

## Critical & Serious Findings

### F5-1 — The hash-recording round trip fails silently, and because rule (4) was deleted its failure converts a legitimate earlier-phase artifact into a VIOLATION
**Location:** `claude-plugins/expert-dev-tools/workflows/expert-lifecycle.js:810-821`
**Severity:** Serious
**Provenance:** regression — introduced by `1f014e0` while closing F4-3.

**What the code does now.** `documentScopeCheck` instructs the dispatched verifier to "ALWAYS include one
extra check entry whose `cited_claim` is exactly `artifact-sha256` … whose `re_execution` contains the current
SHA-256 hex digest of the authorized artifact." It then does:

```js
const hashEntry = checks.find((c) => c.cited_claim === 'artifact-sha256')
const hex = hashEntry && /[0-9a-f]{64}/.exec(hashEntry.re_execution || '')
if (hex) { const mine = (delta.artifacts || []).find((a) => a.path === artifactPath)
           if (mine && !mine.sha256) mine.sha256 = hex[0] }
```

There is no `else`. If the entry is missing, if `re_execution` is absent, or if it holds no 64-hex run, the
phase completes normally with no hash recorded on its artifact.

**How that claim was verified.** Read of `:810-821` at drafting time for the capture block and the violation
filter. Read of `VERIFIER_SCHEMA` at `:183-196`: `required: ['cited_claim', 'match']` — **`re_execution` is
optional**, and `checks` carries no `minItems`, so `{checks: []}` is schema-valid and the mandated entry is
unenforceable at the schema boundary. Read of `:807`: the injected rule list is (1) authorized path, (2) hash
matches, (3) hash differs, (4) `.claude/expert` bookkeeping, (5) **any other changed file — a VIOLATION**;
`grep -n "Earlier phases of THIS segment"` over the workflow → **0 hits**, confirming no rule names a
same-segment artifact by path any more. Read of `:821-825`: any check with `match === false` sets
`delta.phase`, runs `diagnose`, and returns an `owner_gate`.

**Standard violated.** Fail-safe control design as applied to a control's own inputs: when a control depends
on an input it does not compute, the absence of that input must be detected and must not silently change the
control's default. Here the default flips in the unsafe direction — from "exempt" to "VIOLATION" — which is
the fail-loud-but-wrong case, worse than a fail-open because it costs an owner decision every time.

**Why it matters.** Architecture and plan run in the same workflow invocation (`:571`, `cursor = 'plan'`), so
the plan phase's scope check is the first consumer of the architecture phase's recorded hash. If the
architecture verifier omitted or malformed the mandated entry — an agent behavior nothing in the pipeline
constrains — the newly written, untracked `arch-x.md` is not on the plan phase's hash list, falls to rule (5),
and the segment halts at an owner gate reporting an unauthorized change to a file the workflow itself
authorized two phases earlier. Round 4 rejected exactly this dynamic under F4-2: a control whose correct
answer is "accept" gets clicked through, and then it is disabled for the true positives too. The deletion of
rule (4) is correct on its own terms; it is the removal of the fallback that makes the recording mechanism's
reliability load-bearing, and nothing was added to carry that load.

**Correct implementation.** Detect the failure and escalate it rather than absorbing it. Concretely, at
`:815-820`: if `hashEntry` is missing or `hex` is null, return an `owner_gate` (`type: GATE.spec_traceable`,
`delta.phase = resumePhase`, options "re-run the scope check" / "investigate") stating that the scope check
did not return the artifact's digest, so later phases cannot distinguish this artifact from an unauthorized
edit. A weaker but acceptable alternative is to keep a path-named fallback clause in the rule list for
same-segment artifacts whose hash is absent — but that reintroduces the exemption F4-3 closed, so the gate is
the better edit. Independently, tighten the contract at the schema boundary so the omission cannot be
schema-valid: `re_execution` should be required on the entry the prompt mandates.

---

## Systemic Patterns

**One systemic pattern: a dispatched verifier's return is consumed without validating that it contains
anything, so an empty or malformed return silently satisfies the control.**
**Location:** `claude-plugins/expert-dev-tools/workflows/expert-lifecycle.js:672-682,726,815-821`
**Severity:** Serious (Systemic)
**Provenance:** new — no prior round reported it. It is distinct from the round-4 systemic finding (which was
about *which state* a predicate reads and is closed); this is about a predicate reading the right state from a
source that may return nothing, and treating nothing as "no problem found."

**Proactive scan.** The candidate arose from F5-1, so per Step 8 it was scanned rather than extrapolated.
`grep -n "checks" workflows/expert-lifecycle.js`, filtered to consumption sites (excluding the schema
declaration at `:183-196`) → **5 sites**, enumerated:

| Site | Control | Consumption | Behavior on `{checks: []}` |
|---|---|---|---|
| `:672` | anti-fabrication spot re-run | `(vr.checks \|\| []).some((c) => c.match === false)` | no fabrication detected — control passes |
| `:682` | diff-vs-plan scope check | `(dvp.checks \|\| []).some((c) => c.match === false)` | no out-of-plan change detected — control passes |
| `:726` | whole-chain reconciliation | `(recon.checks \|\| []).some((c) => c.match === false)` | no reconciliation gap detected — control passes |
| `:821` | document scope check violations | `checks.filter((c) => c.match === false && …)` | no violation detected — control passes |
| `:815` | artifact hash recording | `checks.find((c) => c.cited_claim === 'artifact-sha256')` | hash not recorded — and, per F5-1, the *next* phase's control fails in the unsafe direction |

`VERIFIER_SCHEMA` at `:183-196` permits every one of these: `checks` has no `minItems`, so an empty array
validates. Three of the five sites (`:672`, `:682`, `:726`) predate this branch — `git show
origin/main:…/expert-lifecycle.js | grep -n "checks || \[\]"` → 3 hits at 645, 655, 676 — and the corrections
propagated the shape into two more.

**Standard violated.** Fail-safe control design: a verification control must distinguish "checked and found
nothing wrong" from "did not check." Conflating them means the control's green state is produced by both its
success and its failure, which removes its ability to signal anything. This is the classic silent-failure
antipattern and the reason `Optional`/`Result`-shaped verifier contracts require an explicit "verified"
signal rather than an empty negative.

**Why systemic rather than isolated.** Five sites, one shape, one root cause — a schema that makes the
verifier's substantive output optional, consumed everywhere by a "is there a `false` in here?" test. Fixing
`:815` alone leaves four controls whose green state is indistinguishable from a no-op verifier, and the fix
for all five is the same one change at the contract: require the verifier to enumerate what it checked, and
treat an empty or short enumeration as a control failure rather than as a pass. The two in-scope sites are
where this branch's work must land; the three pre-existing sites are enumerated so the fix is scoped once
rather than five times.

**Correct form.** Extend `VERIFIER_SCHEMA` so a return declares its coverage — e.g. `required: ['checks']`
plus `minItems: 1` and a `checked` count the caller can compare against what it asked for — and add a shared
consumer helper beside the two hoisted expressions at `:458-459`, such as `verifierViolations(res, expected)`,
which returns a control failure when `res` is falsy, when `checks` is empty, or when the expected entries are
absent, and the violation list otherwise. Every one of the five sites then reads one predicate, exactly as
`implementationArtifacts()` and `isHashPinnedRole` now do for the round-4 class.

---

## Moderate & Minor Findings

### F5-3 — Control coverage still never observes a refusal, a third round under the same standard, in a project whose unit tier already imports pure functions
**Location:** `claude-plugins/expert-dev-tools/tests/structural/check-structure.mjs:655-680`
**Severity:** Moderate
**Provenance:** recurring — round-3 F3-5 and round-4 F4-4, same location, same named standard.

F4-4's named standard is "a new control is delivered with the test that demonstrates it refuses." What
`1f014e0` added is four more assertions over the workflow's source text and one rename. Verified by Read of
the full T-24 block at drafting time: eleven checks, every one a `wfSrc.includes(...)` or a negated
`includes`. No check constructs a ledger, invokes a guard, or observes a refusal.

The round-3 mitigation for this — "no execution harness exists" — is now demonstrably not the constraint.
Read of `tests/unit/run-unit-tests.mjs:5-10`: that tier imports `validate` from `../../scripts/validate-ledger.mjs`
and `readOwnerTurns` from `../../scripts/extract-owner-turns.mjs`, so importing a pure predicate from
`scripts/` and asserting over constructed inputs is an established, working pattern in this repository.
`ls scripts/` → three files, none of them a refusal predicate: the extraction round 4 recommended was not
performed. Coverage widening is real progress and is credited in the Convergence Record's flow counts, but it
is progress under an adjacent standard; the named one is unmet.

Correct implementation, unchanged from round 4 and now cheaper than it looked: extract the refusal predicate
as `groundTruthRefusal(ledger, delta, specPath) → null | {kind, detail}` into `scripts/`, import it in both
`workflows/expert-lifecycle.js` and `tests/unit/run-unit-tests.mjs`, and assert the refusal over constructed
ledger shapes — including the amend-path shape and the empty-`checks` shape, which would have caught F4-1 in
round 4 and F5-1 in this one.

### F5-4 — The no-mtime-proxy assertion pins the verbatim sentence of the deleted rule, so any reworded mtime rule passes green
**Location:** `claude-plugins/expert-dev-tools/tests/structural/check-structure.mjs:679-680`
**Severity:** Moderate
**Provenance:** new — the check was added by `1f014e0`.

The check is `check('T-24 scope-check: no mtime proxy remains in the exemption rules',
!wfSrc.includes('last-modified time predates'))`. Verified by Read at drafting time, and by mutation probe M4:
an exemption clause reintroduced into the `:807` rule list as "a file written earlier this segment — exempt if
its modification time is earlier than this phase's write" leaves the structural tier at **exit 0, fully
green**. The same weakness applies to the sibling assertion `!wfSrc.includes("outcome: 'failed'")` at `:665`,
which is quote-style-specific.

This matters more than a generic style note because absence assertions are structurally weaker than presence
assertions: a presence assertion breaks on any edit to the pinned construct, while a negated `includes` only
ever catches a verbatim reintroduction of one phrasing. This particular check is the regression guard for a
finding that recurred twice (F3-2, F4-3) and whose instrument the project has now rejected by name in two
separate rounds — precisely the case where the guard must catch the class, not one sentence.

Standard: a regression guard pins the defect class, not the literal text of the one instance that produced it.
Correct implementation: assert the class with a pattern rather than a phrase — e.g.
`!/mtime|last[- ]modified|modification time/i.test(wfSrc)` for the mtime rule and
`!/outcome:\s*['"]failed['"]/.test(wfSrc)` for the terminal-outcome check. Both are one-line changes to
existing checks and both survive the M4 mutation.

---

## Tentative Findings

No tentative findings — every candidate finding's premise was verified per Compliance Gate B. Two caveats are
recorded rather than deferred, neither of which any finding's premise depends on. First, the five correction
drafts are session task outputs outside version control, cited by path and date (2026-08-17) with their
unpinnable status stated per the Step 6 rule. Second, F5-1's consequence chain includes one behavioral link
that cannot be executed here — whether a dispatched verifier agent omits the mandated `artifact-sha256` entry
in practice. The finding does not rest on that frequency: its premise is that the workflow does not detect the
omission and that the omission changes the next phase's outcome, and both are literal-content claims verified
by Read of `:810-821`, `:807`, and `VERIFIER_SCHEMA:183-196`.

---

## Observations

- The implement-time gate at `:629` now reads the accumulated set including `ledger.artifact_index`, which
  means that once any implementation artifact has been registered in any prior segment, the gate cannot fire
  again. That is the behavior F4-1 asked for — the gate and its downstream consumer at `:706` read one
  predicate over one state — and the two now agree by construction. Recorded as context because no standard
  is violated: the earlier gate exists to surface the ground-truth guard's condition sooner, and surfacing a
  condition its consumer would not raise would be the defect.
- `isHashPinnedRole` is shared between the two workflow consumers but cannot literally be shared with
  `commands/expert.md`, which is a Markdown instruction file and states the same exemption in prose at `:50`.
  Both consumers exempt the same role, verified by Read of both. No standard governs cross-format predicate
  sharing here.
- The `REPLACED_BY_STRENGTHENING` allowlist entry added by `1f014e0` names the exact prior label and the exact
  superseding label with the finding that forced the swap, and mutation probe M5 confirms the deletion guard
  still fires when a check is removed outright rather than renamed — the allowlist is not being used to hide a
  deletion. Recorded as context; no standard violation.

---

## What's Actually Good

- **The systemic fix was executed as one change, and the residual-proxy sweep proves it.** Two expressions
  hoisted once at `:458-459`, three consumers at `:629`, `:706`, `:807`, and a grep for the proxy vocabulary
  (`artifact_index…concat`, `files_changed`, `role === 'implementation'`, `mtime`, `last-modified`,
  `outcome: 'failed'`) returning only legitimate producers, comments, and the definitions themselves. Good by
  DRY as it applies to control predicates — one definition, one meaning, no site that can drift — and
  verified by execution rather than by reading the commit message: mutation probes M1 and M2 both fail the
  tier when a consumer is reverted to a local expression.
- **The mtime instrument was deleted rather than reformulated a third time.** `grep -n "mtime|last-modified"`
  over the workflow → 0 hits, and the same-segment case is now governed by rules (2) and (3) like every other
  recorded artifact. Good by the standard round 3 named for F3-2 — an exemption must be conditioned on the
  state that makes it safe — and notable because the harder direction was taken: the missing state was
  recorded (at the only pipeline point that can execute a hash) rather than approximated by a third
  timestamp formulation.
- **The new tier checks are live, not decorative.** Four of the five mutations run against them were caught
  with a specific named FAIL, and the fifth failure (M4) is itself a reported finding rather than a silent
  gap. Good by the standard that a regression guard must be demonstrated to fail on the defect it guards —
  and worth stating because the round-3 and round-4 records both found checks in this tier that would have
  stayed green through the change they nominally pinned.

---

## Convergence Record

- **Round number:** 5 (fourth Post-fix round).
- **Trajectory:** R1: 9 (1 Serious-Systemic, 4 Serious, 3 Moderate, 1 Minor) → R2: 7 (1 Serious-Systemic,
  3 Serious, 3 Moderate) → R3: 5 (2 Serious, 2 Moderate, 1 Minor) → R4: 5 (1 Serious-Systemic, 2 Serious,
  2 Moderate) → **R5: 4 (1 Serious-Systemic, 1 Serious, 2 Moderate)**.
- **Flow counts for this round:**
  - Prior findings **closed**: **4** — the round-4 Systemic finding, F4-1, F4-2, F4-3; each verified against
    its originally named standard in the Upstream Contract Verification table, by Read of current source plus
    mutation probes M1–M3.
  - **Recurring**: **1** — F5-3 (F4-4's standard, same location; third round).
  - **New**: **2** — F5-2 (the systemic finding) and F5-4.
  - **Regressions**: **1** — F5-1 (introduced by `1f014e0`).
  - Reconciliation: 5 prior − 4 closed = 1 carried = 1 recurring; 1 + 2 new + 1 regression = **4**.
- **Tripwire evaluation — NOT FIRED.** Arithmetic shown for both conditions, per Post-fix round:
  - **(a)** new + regression ≥ closed, for two consecutive Post-fix rounds.
    - R2: 2 + 1 = 3; closed = 6; 3 ≥ 6 → **false**.
    - R3: 1 + 2 = 3; closed = 5; 3 ≥ 5 → **false**.
    - R4: 1 + 2 = 3; closed = 3; 3 ≥ 3 → **TRUE**.
    - R5: 2 + 1 = 3; closed = 4; 3 ≥ 4 → **false**.
    - Two consecutive requires R4 and R5 both true; R5 is false. **Not fired.** The condition that held in
      round 4 did not repeat.
  - **(b)** the total findings count has not strictly decreased, for two consecutive Post-fix rounds. Totals:
    R1 = 9, R2 = 7, R3 = 5, R4 = 5, R5 = 4.
    - R2: 7 < 9 → strictly decreased → **false**.
    - R3: 5 < 7 → strictly decreased → **false**.
    - R4: 5 < 5 is false → did not strictly decrease → **TRUE**.
    - R5: 4 < 5 → strictly decreased → **false**.
    - Two consecutive requires R4 and R5 both true; R5 is false. **Not fired.** The condition that held in
      round 4 did not repeat.
- **Both conditions that held once in round 4 were broken in round 5, independently.** Round 4 recorded that a
  fifth round repeating either one would fire the tripwire; neither repeated. The mechanism round 4 predicted
  would repeat them — another patch pass over four instances of one substitution — is also the thing that did
  not happen: the substitution was removed at its root, which is why four findings closed rather than two.
  The cycle is converging, and the quality of the closures (structural, mutation-verified) is the stronger
  signal than the count.

---

## Recommended Priority

The tripwire did not fire, so foundational rework is not the indicated path; a targeted fix round is. The four
open findings are not four instances of one move this time — F5-2 is a pre-existing contract weakness the
corrections inherited and extended, F5-3 is a deferred structural investment, F5-4 is a one-line pattern
change — so they are properly separate work items. Sequence them by what each one costs when it is wrong.

1. **F5-1 first.** It is the only finding that halts a legitimate lifecycle at an owner gate, and it fires on
   the ordinary architecture-then-plan path rather than an exotic one. Its fix is small — an `else` branch
   returning an owner gate at `:815-820` — and it converts a silent, misattributed failure into a named one.
2. **F5-2 immediately after, and as one contract change.** It is the root of F5-1 and of four other controls
   whose green state currently cannot be distinguished from a no-op verifier. Do it at the schema plus one
   shared consumer helper beside the existing hoisted expressions; do not fix `:815` and `:821` in isolation,
   because that leaves the three pre-existing sites carrying the same defect and guarantees the next
   consumer is written the same way.
3. **F5-4 in the same commit as either of the above.** Two regexes replacing two literal `includes` calls,
   and it closes the specific hole mutation probe M4 walked through — a reworded mtime rule reaching a green
   tier, in the one place this cycle has already been wrong twice.
4. **F5-3 last, and actually do it this time.** It is on its third round, and the mitigation that justified
   deferring it in rounds 3 and 4 no longer holds: `tests/unit/run-unit-tests.mjs:9-10` shows the import
   pattern working today. Extracting `groundTruthRefusal` into `scripts/` is the one structural investment
   that converts this cycle from review-finds-it to tier-finds-it — and a unit test over the empty-`checks`
   shape would have caught F5-1 and F5-2 before this review ran.

---

Verdict: NEEDS FIXES (4 findings: 1 Serious-Systemic, 1 Serious, 2 Moderate)
