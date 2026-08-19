# Independent review — corrections 0.3.0, round 6 (Post-fix)

Artifact: commits `2b1b7d8` + `95173db` + `e969eb1` + `e8d016e` + `1f014e0` + `8141ac5` on
`claude/edt-corrections-0.3.0`, diffed against `origin/main`.
Reviewer: independent (expert-review R1.2). Date: 2026-08-17.
Prior rounds: `claude-plugins/expert-dev-tools/docs/reviews/corrections-0.3.0-round-01.md` (NEEDS FIXES, 9);
`…-round-02.md` (NEEDS FIXES, 7); `…-round-03.md` (NEEDS FIXES, 5); `…-round-04.md` (NEEDS FIXES, 5);
`…-round-05.md` (NEEDS FIXES, 4).

---

## Scope and Inventory

Round 6 — Post-fix review. Inventory built per Step 2's post-fix rule from all four sources. Every premise
below was re-derived from current source at drafting time; nothing is inherited from a prior record.

**Source 1 — the prior review's full inventory, re-verified:**

- [x] `claude-plugins/expert-dev-tools/.claude-plugin/plugin.json` — Grep of `git show --stat 8141ac5`: not
  among the three changed paths; the 0.3.0 bump stands from `2b1b7d8`.
- [x] `claude-plugins/expert-dev-tools/workflows/expert-lifecycle.js` — Read at 183–197 (`VERIFIER_SCHEMA`
  with the new `minItems`), 458–470 (the two round-4 hoisted expressions plus the new `verifierEmpty` /
  `emptyVerifierGate` pair), 536/563/586 (the three `documentScopeCheck` call sites and their
  `if (x) return x` handling), 668–700 (spot re-run, diff-vs-plan), 713–740 (ground-truth guard now calling
  the extracted predicate; reconciliation), 794–812 (`groundTruthPreconditions` definition), 826–866 (the
  full `documentScopeCheck` body including the new empty-verifier guard and the F5-1 missing-hash
  escalation). Changed by `8141ac5` (61 lines). `node --check` → SYNTAX OK.
- [x] `claude-plugins/expert-dev-tools/tests/structural/check-structure.mjs` — Read at 455–487 (the four new
  `REPLACED_BY_STRENGTHENING` entries), 565–580 (`declOf`), 686–730 (the rewritten T-24 checks, the new
  T-24x executed block, and the semantic no-time-exemption pin). Changed by `8141ac5` (63 lines). Executed;
  mutation-probed six ways (below).
- [x] `claude-plugins/expert-dev-tools/commands/expert.md` — Read at 175–200 (the SEGMENT_REPORT outcome
  contract and the enumeration of the six gate types and what each asks). Unchanged by `8141ac5`. Grounds
  F6-3.
- [x] `claude-plugins/expert-dev-tools/agents/expert-architect.md` — Grep of the `8141ac5` stat: unchanged.
- [x] `claude-plugins/expert-dev-tools/agents/expert-planner.md` — same method, same result.
- [x] `claude-plugins/expert-dev-tools/agents/expert-spec-writer.md` — same method, same result.
- [x] `claude-plugins/expert-dev-tools/skills/expert-standard/SKILL.md` — same method, same result.
- [x] `claude-plugins/expert-dev-tools/skills/expert-plan/SKILL.md` — same method, same result.
- [x] `claude-plugins/expert-dev-tools/skills/expert-implement/SKILL.md` — same method, same result.
- [x] `claude-plugins/expert-dev-tools/docs/SKILL-CHANGELOG.md` — same method, same result.

**Source 2 — fix-diff files (`8141ac5`), all three:** `workflows/expert-lifecycle.js`,
`tests/structural/check-structure.mjs`, and `docs/reviews/corrections-0.3.0-round-05.md` (the prior record,
added to the tree — no claim here rests on it as a source).

**Source 3 — dependents of the fix-diff files:**

- [x] `claude-plugins/expert-dev-tools/tests/unit/run-unit-tests.mjs` — Read at 1–12 (its imports); executed,
  17 `ok`, exit 0. Re-checked for whether `8141ac5` added a unit test over the new controls: it did not.
- [x] `claude-plugins/expert-dev-tools/scripts/` — `ls scripts/` → 3 entries
  (`validate-ledger.mjs`, `extract-owner-turns.mjs`, `ledger.schema.json`). The F5-3 extraction landed in the
  workflow module itself and is lifted by `declOf`, not moved to `scripts/`; that is a different mechanism
  from the one round 5 suggested but it satisfies the same standard — see the closure row for F5-3.

**Source 4 — the prior review's four findings as closure items:** F5-1, F5-2 (systemic), F5-3, F5-4 — each
re-derived from current source in the Upstream Contract Verification table, and each probed by execution.

**Supporting (claims asserted about them):**

- [x] `git status --porcelain claude-plugins/expert-dev-tools` → empty before and after the mutation probes;
  every Read is of committed state and every probe was restored with `git checkout --`.
- [x] `C:\Users\maxco\.claude\plugins\data\expert-dev-tools\defect-history.json` and
  `.claude/expert/ACCEPTANCE-RESULTS-2026-08-17.md` — named as authorizing inputs; carried as context, no
  finding rests on their content.
- [x] The five owner-approved correction drafts under the session task directory. **Unpinnable citation**:
  session task outputs outside version control, cited by path and date 2026-08-17. No finding rests on them.

### Tool plan (Step 3)

| Claim type | Instrument | Used for |
|---|---|---|
| Literal-content | Read at file:line | every diff hunk; `VERIFIER_SCHEMA`; the `verifierEmpty` pair; the F5-1 escalation; `groundTruthPreconditions`; the gate-type enumeration in `commands/expert.md` |
| Absence | grep with recorded query + count | tier coverage of the new controls; residual `mtime` / `outcome: 'failed'` vocabulary; verifier consumption sites |
| Behavioral (tests pass; controls refuse) | test-runner execution + in-place mutation probes with restore; independent re-implementation of `declOf` and direct execution of the lifted predicate | both tiers; six mutations MA–ME plus MB2; twelve executed predicate cases |
| Structural / dataflow | Read of the specific code path, traced against constructed shapes | the `documentScopeCheck` return contract vs its three call sites; the five verifier consumption sites |
| Imported from prior documents | re-derivation from current source | all four closure items |
| Comment claims inside the artifact | re-derivation from source | the F5-1 comment block at `:840-844`; the `8141ac5` commit message's counts (222/17 — both re-executed and confirmed) |

No library-behavior claims arise in this scope, so Context7 is not load-bearing; no instrument class was
unavailable. Mutation probing was performed in place with `git checkout --` restore after each, and the clean
`git status` above is the evidence that no mutation persisted. `metacognitivemonitoring` was invoked at review
start. `collaborativereasoning` was invoked and succeeded on the second call (the first was rejected for a
persona-schema enum violation — a validation error, not an infrastructure failure). No rigor waivers.

### Execution results

- **Structural tier**: `node tests/structural/check-structure.mjs` → `STRUCTURAL TESTS PASSED`, exit 0,
  **222** `ok` lines. Matches the commit message's "Structural 222/222". The five T-24x lines appear at
  output positions 216–220.
- **Unit tier**: `node tests/unit/run-unit-tests.mjs` → `UNIT TESTS PASSED`, exit 0, **17** `ok` lines.
  Matches "unit 17/17".
- **Syntax**: `node --check workflows/expert-lifecycle.js` → clean.

### The T-24x extraction mechanism, verified by independent execution (requested at dispatch)

The dispatch asked for confirmation that `groundTruthPreconditions` genuinely lifts and that the five cases
genuinely execute, plus one adversarial shape of my own. I re-implemented `declOf` in a separate scratch
script rather than trusting the tier's own harness, lifted the function from current source, and ran it
directly.

- `declOf` is a real brace-matched extractor: it skips the parameter list by paren-depth, then returns the
  source slice at brace-depth zero, and **throws** if the header is not found (Read at
  `tests/structural/check-structure.mjs:565-580`). A rename or deletion of the function cannot silently
  no-op the block.
- The lift returns **1158 characters** of actual function source, and `typeof gtp === 'function'`.
- All five tier cases reproduce independently with the expected `ok` values and non-empty `why` strings.

**Seven adversarial shapes of my own, none of which the tier covers:**

| # | Shape | Expected | Result |
|---|---|---|---|
| A1 | ledger gate_history `[PASS]`, delta gate_history `[NEEDS_FIXES]` — the latest verdict is on the far side of the ledger/delta concat boundary | refuse | **refused**, correct `why` |
| A2 | ledger `[NEEDS_FIXES]`, delta `[PASS]` — later PASS across the same boundary | proceed | **proceeded** |
| A3 | a *different* spec path is the approved one | refuse | **refused** |
| A4 | `specPath` undefined | refuse | **refused** |
| A5 | only a `gate: 'spec'` PASS exists — a non-implementation gate must not count | refuse | **refused** |
| A6 | `approved_by_owner` is the string `"true"` rather than boolean `true` | refuse | **refused** (strict `=== true`) |
| A7 | wholly empty ledger and delta objects | refuse | **refused**, no throw |

A1/A2 matter most: the tier's five cases only exercise ordering *within* `ledger.gate_history`, so the
concat-boundary ordering is untested by the tier and correct in the code. The predicate is sound under every
shape I could construct.

### Mutation probes (six run, in place, each restored)

| # | Mutation | Result |
|---|---|---|
| MA | `implGates[implGates.length - 1]` → `implGates[0]` inside the extracted predicate | **caught** — two FAILs, including `T-24x refuses when the LATEST implementation verdict is not PASS`, exit 1. The executed block is live. |
| MB | a **reworded** time-based exemption ("a file whose modification time precedes this phase's write") reintroduced into the `:830` scope-check rule list | **caught** — `FAIL T-24 scope-check: no time-based exemption in the scope rules`, exit 1. This is the exact shape that stayed **green** as round 5's M4. |
| MB2 | a further-reworded time exemption avoiding the pinned vocabulary ("last touched earlier in wall-clock order") | **not caught** — exit 0. Recorded in Observations, not as a finding; see there for why. |
| MC | a **reworded** terminal outcome — `outcome: 'complete'` → `outcome: 'aborted'` | **caught** — `FAIL T-24 every workflow outcome is complete or owner_gate (no terminal failed, reworded or not)`, exit 1. The semantic scan over every outcome literal works. |
| MD | `verifierEmpty` neutered to `() => false` — the entire F5-2 control disabled at all five sites | **NOT caught** — exit 0, tier fully green. Grounds F6-1. |
| ME | the F5-1 missing-hash escalation disabled (`if (!hex)` → `if (false)`) | **NOT caught** — exit 0, tier fully green. Grounds F6-1. |

---

## Summary

**This review returns NEEDS FIXES.** Round 6 is the strongest round of this cycle by a clear margin: three of
the four round-5 findings close against their originally named standards, and they close by mechanism rather
than by patch. The empty-verifier guard reaches all five consumption sites through one shared predicate, and
`VERIFIER_SCHEMA` is tightened at the contract with both `required: ['checks']` and `minItems: 1`, so the
fail-closed behavior holds at the schema boundary and at runtime independently. The F5-1 escalation moves the
failure to the phase that can re-run it, and its return threads correctly through all three
`documentScopeCheck` call sites — I checked specifically for a double-wrap defect, because the new returns are
full report objects rather than gate objects, and the pre-existing violation path returns the same shape, so
the callers' `if (x) return x` is right. Most importantly, F5-3 is genuinely closed on its third recurrence:
`groundTruthPreconditions` is extracted and the tier *lifts and executes* it, which I verified by
re-implementing the extractor myself and running the predicate against seven adversarial shapes of my own
construction, including a ledger/delta concat-boundary ordering case the tier does not cover — it was correct
on all seven. Mutation MA turns that block red, so it is live. And the two semantic pins now catch the exact
rewordings that walked through round 5's M4 probe. What blocks the verdict is a coverage gap with a familiar
shape: the commit added four new controls and delivered a refusal test for exactly one of them. Neutering
`verifierEmpty` to `() => false` and disabling the F5-1 escalation each leave the 222-check tier completely
green — so the two controls this round was written to add are, today, unprotected against their own removal,
in the same tier that pins 61 checks and in the same commit that proved the project knows how to execute a
control. Below that, F5-2's own prescribed correct form named "empty **or short** enumeration" and only the
empty case was implemented, at the one site where the expected count is mechanically known; and the two new
owner gates are typed `non_convergence`, which the command contract documents as "a review loop hit its round
cap" — neither new gate is that. Trajectory is 9 → 7 → 5 → 5 → 4 → 3. Neither tripwire condition holds this
round, so neither can hold consecutively; the arithmetic is shown in full below.

---

## Upstream Contract Verification

The upstream contract is the set of five owner-approved correction drafts, plus the round-5 review findings as
the remediation contract for `8141ac5`. Each round-5 finding is checked against the standard originally named
for it.

| Prior finding | Originally named standard | Status | Verification method |
|---|---|---|---|
| **F5-1** (the hash-recording round trip fails silently, and with rule (4) deleted its failure converts a legitimate earlier-phase artifact into a VIOLATION) | fail-safe control design as applied to a control's own inputs — the absence of an input the control does not compute must be detected and must not silently change the control's default | **CLOSED** | Read `workflows/expert-lifecycle.js:840-849` at drafting time: the bare `if (hex)` is replaced by `if (!hex) { delta.phase = resumePhase; return report(finish(), {outcome: 'owner_gate', …}) }`, so the missing digest now escalates at the phase that produced it rather than surfacing as a rule-(5) violation one phase later. Read of all three call sites (`:536`, `:563`, `:586`) confirms each does `if (x) return x`, and Read of the pre-existing violation path at `:860-866` confirms it returns the same `report(finish(), …)` shape — so the new return is handled identically and is not double-wrapped. Schema tightened as the finding's secondary recommendation asked: Read `:183-197` shows `required: ['checks']` and `minItems: 1`. The gate *type* chosen diverges from the finding's recommendation and is filed separately as F6-3; the escalation itself exists and fires. |
| **F5-2 / Systemic** (a dispatched verifier's return is consumed without validating it contains anything, so an empty or malformed return silently satisfies the control — five sites) | fail-safe control design — a verification control must distinguish "checked and found nothing wrong" from "did not check"; the correct form named requiring coverage and treating an **empty or short** enumeration as a control failure | **NOT CLOSED** (empty case closed at all five sites; short case not) | Read `:464-470`: `verifierEmpty = (v) => !v \|\| !Array.isArray(v.checks) \|\| v.checks.length === 0` plus a shared `emptyVerifierGate`. `grep -n "verifierEmpty\|emptyVerifierGate" workflows/expert-lifecycle.js` → 6 hits: the two definitions at `:464-465` and **all five** consumption sites guarded (`:681` spot re-run, `:692` diff-vs-plan, `:733` reconciliation, `:834` scope check, with `:834` also covering the hash-recording site since it precedes it in the same function). `grep -n "\.checks"` → every remaining consumer is downstream of a guard. The empty half of the named standard is fully met. The **short** half is not: Read `:679-682` shows `sample` built from `idx` of known length and the only test being `.some((c) => c.match === false)` — a return of one check for ten sampled claims passes. Filed as F6-2. |
| **F5-3** (control coverage still never observes a refusal — third round under the same standard) | a new control is delivered with the test that demonstrates it refuses | **CLOSED** | Read `:794-812`: `groundTruthPreconditions(led, dlt, specPathArg)` is a pure function returning `{ok, why, implArts}`; Read `:716-718` confirms the guard now calls it rather than inlining the predicate. Read `tests/structural/check-structure.mjs:702-722`: the T-24x block lifts it via `declOf` and runs five constructed cases, observing `.ok === false` refusals and asserting the `why` names the failed precondition. Verified by **independent execution**, not by reading the block: I re-implemented `declOf`, lifted 1158 chars of real source, and ran twelve cases (the five plus seven adversarial shapes of my own) — all correct. Mutation MA turns the block red. The extraction landed in the workflow module and is lifted, rather than moved to `scripts/` as round 5 suggested; that is a different mechanism reaching the same named standard, and it is the mechanism T-22/T-23 already use, so it is closure, not an adjacent-standard substitution. The standard recurs at *other* locations — see F6-1 — but at this location it is met. |
| **F5-4** (the no-mtime-proxy assertion pins the verbatim sentence, so any reworded mtime rule passes green) | a regression guard pins the defect class, not the literal text of the one instance that produced it | **CLOSED** | Read `tests/structural/check-structure.mjs:726-728`: the literal `!wfSrc.includes('last-modified time predates')` is replaced by a region-scoped regex over the scope-check prompt, `!/(mtime\|last[- ]modified\|modif\w*\s+(?:time\|before\|after)\|timestamp)/i.test(region)`. The sibling `outcome: 'failed'` pin is replaced at `:694-696` by a semantic scan asserting **every** `outcome:` literal in the module is `complete` or `owner_gate`. Verified by execution: mutation **MB** — the reworded mtime rule that stayed green as round 5's M4 — now turns the tier red, and mutation **MC** — a reworded terminal outcome `'aborted'` — also turns it red. Both guards catch the class of reword that defeated the prior pins. A residual paraphrase evasion (MB2) is recorded in Observations with its evidence; it does not reopen this standard, for the reason given there. |

---

## Critical & Serious Findings

### F6-1 — Three of the four controls added by this commit ship with no test that demonstrates they refuse; disabling two of them leaves the 222-check tier fully green
**Location:** `claude-plugins/expert-dev-tools/tests/structural/check-structure.mjs:686-730`
**Severity:** Serious
**Provenance:** new — no prior round reported this location. The *standard* is the one raised at a different
location in rounds 3 (F3-5), 4 (F4-4) and 5 (F5-3); that instance closed this round, and the same standard is
now unmet at the controls this round introduced.

**What the code does now.** `8141ac5` added four controls to the workflow: (1) the `verifierEmpty` predicate
and its `emptyVerifierGate`, guarding all five verifier consumption sites; (2) the F5-1 missing-hash
escalation in `documentScopeCheck`; (3) `minItems: 1` on `VERIFIER_SCHEMA.checks`; and (4) the extracted
`groundTruthPreconditions`. The structural tier gained a refusal test for **(4) only** — the T-24x block.
Controls (1), (2) and (3) have no check of any kind, not even a source-text pin.

**How that claim was verified.** `grep -n "verifierEmpty\|emptyVerifierGate\|minItems\|did not return the
required\|artifact-sha256 entry" tests/structural/check-structure.mjs` → **0 hits** (grep exit 1). Confirmed
behaviorally by two in-place mutation probes, each restored:

- **MD**: `const verifierEmpty = (v) => !v || !Array.isArray(v.checks) || v.checks.length === 0` replaced by
  `const verifierEmpty = (v) => false`. This disables the entire F5-2 remedy at all five sites simultaneously.
  Tier result: **exit 0, 222/222 green**.
- **ME**: `if (!hex) {` replaced by `if (false) {`, reverting the F5-1 escalation to the exact silent-absorb
  behavior round 5 filed as a Serious regression. Tier result: **exit 0, 222/222 green**.

For contrast, mutation MA against control (4) produces two named FAILs and exit 1 — so the gap is specific to
the three unprotected controls, not a property of the tier.

**Standard violated.** "A new control is delivered with the test that demonstrates it refuses" — the standard
named in F3-5, F4-4 and F5-3, and the standard this commit satisfied for `groundTruthPreconditions`. The
project's own `REPLACED_BY_STRENGTHENING` machinery and T-20 deletion guard exist precisely to stop controls
from quietly disappearing; both are defeated here because there is nothing to delete. A control that can be
neutralized without any test noticing is, from the tier's perspective, not present.

**Why it matters.** This is not a hypothetical. The F5-1 escalation is a *regression fix* — round 5 found that
exact code path silently absorbing a failure, and mutation ME shows the branch can be reverted to the round-5
defect with the full tier still green. The same is true of the F5-2 remedy, which is this round's headline
change and whose neutralization (MD) reopens five controls at once. The cycle has spent three rounds arguing
that source-text pins are insufficient; the resolution reached this round was to lift and execute, and that
resolution was applied to one control out of four in the same commit.

**Correct implementation.** Use the mechanism the commit already proved. `verifierEmpty` is a pure one-line
predicate; lift it with `declOf` exactly as T-24x lifts `groundTruthPreconditions`, and assert it over
constructed returns: `undefined`, `{}`, `{checks: []}`, `{checks: [{cited_claim: 'x', match: true}]}` — the
first three true, the fourth false. For the F5-1 escalation and for `minItems`, a presence pin is the minimum
(`wfSrc.includes('if (!hex) {')` is too brittle; assert instead that the `documentScopeCheck` region contains
no bare `if (hex)` absorb and that `VERIFIER_SCHEMA` carries `minItems: 1`), but the stronger and cheaper move
is to extract the hash-capture decision into a pure `hashFromChecks(checks) → string | null` and execute *it*,
which makes the escalation's trigger condition testable rather than merely present.

---

## Systemic Patterns

**No systemic patterns.** The round-5 systemic finding (verifier returns consumed without validating they
contain anything) is closed for its empty case at all five sites and survives only as the narrower F6-2, which
is one site, not a pattern. F6-1 was tested against the systemic bar and does not meet it: the proactive scan
below shows the coverage gap is confined to the controls added by a single commit, and the same commit applied
the correct mechanism to a fourth control — so it is a gap in one round's work, not a shape propagating across
the codebase.

Scans run, with queries and result counts:

- `grep -n "verifierEmpty\|emptyVerifierGate" workflows/expert-lifecycle.js` → **6 hits** (2 definitions at
  `:464-465`; 4 guard sites at `:681`, `:692`, `:733`, `:834`). Every verifier consumption site is covered —
  no site was left behind, so the round-5 pattern is not partially fixed across sites.
- `grep -n "\.checks" workflows/expert-lifecycle.js` → **10 hits**, every consuming one downstream of a
  guard: `:682`, `:684`, `:693`, `:694`, `:734`, `:735`, `:835`, `:858` plus the definition at `:464` and
  `sc.checks` at `:858` inside the already-guarded path.
- `grep -n "mtime\|last-modified\|outcome: 'failed'" workflows/expert-lifecycle.js` → **0 hits**. The
  round-3/4 proxy vocabulary remains absent.
- `grep -n "verifierEmpty\|emptyVerifierGate\|minItems\|did not return the required"
  tests/structural/check-structure.mjs` → **0 hits**. This is F6-1's enumeration: 3 uncovered controls,
  1 covered (T-24x), all four introduced by `8141ac5`.

---

## Moderate & Minor Findings

### F6-2 — The empty-enumeration guard was implemented; the short-enumeration case its own correct form named was not, at the one site where the expected count is known
**Location:** `claude-plugins/expert-dev-tools/workflows/expert-lifecycle.js:679-682`
**Severity:** Moderate
**Provenance:** recurring — F5-2's named standard, partially applied.

**What the code does now.** The spot re-run dispatch samples `idx = sampleIndices(cited.length, seed)`, builds
`sample = idx.map((i) => cited[i])`, and asks the verifier to re-execute **each** cited verification in that
sample. The return is then tested only for emptiness (`verifierEmpty`) and for the presence of a `false`
(`.some((c) => c.match === false)`). A return containing one check when ten claims were sampled passes the
control as "no fabrication detected."

**How that claim was verified.** Read of `:679-682` at drafting time. `sample`'s length is `idx.length`, known
to the caller at the moment of dispatch; `grep -n "idx.length\|sample.length\|checks.length" workflows/expert-lifecycle.js`
→ the only `.length` comparison on a verifier return anywhere in the module is `verifierEmpty`'s
`v.checks.length === 0`. No count comparison against the request exists.

**Standard violated.** The same one F5-2 named: a verification control must distinguish "checked and found
nothing wrong" from "did not check." F5-2's correct form stated it explicitly — "require the verifier to
enumerate what it checked, and treat an **empty or short** enumeration as a control failure," and "a `checked`
count the caller can compare against what it asked for." Partial coverage of the same failure mode leaves the
control's green state ambiguous for every return between one check and N-1 checks, which is the larger part of
the failure space, not the smaller: an agent that returns *something* is far more likely than one returning
literally nothing, and `minItems: 1` now guarantees the schema rejects the nothing case anyway.

**Correct implementation.** At `:681`, compare coverage against the request:
`if (vr.checks.length < sample.length) return emptyVerifierGate('spot re-run (incomplete: ' +
vr.checks.length + ' of ' + sample.length + ' sampled claims returned)', 'implement')` — or, better, generalize
the shared helper to `verifierUnderCovered(v, expected)` so the one predicate carries both the empty and short
cases, keeping the F5-2 remedy at one definition. The other four sites have no mechanically known expected
count and are correctly left at the emptiness test.

### F6-3 — The two new owner gates are typed `non_convergence`, which the command contract defines as "a review loop hit its round cap"; neither new gate is that
**Location:** `claude-plugins/expert-dev-tools/workflows/expert-lifecycle.js:465-468,846-849`
**Severity:** Moderate
**Provenance:** new — both gates were introduced by `8141ac5`.

**What the code does now.** `emptyVerifierGate` emits `{type: GATE.non_convergence, what_happened: "The ${what}
verifier returned no checks — the control did not run…"}`, and the F5-1 escalation emits
`{type: GATE.non_convergence, what_happened: "The ${phaseName} scope-check verifier did not return the required
artifact-sha256 entry…"}`. Both are infrastructure or dispatch faults occurring on the first attempt of a
phase; neither involves a review loop or a round cap.

**How that claim was verified.** Read of `commands/expert.md:175-191` at drafting time — the contract
enumerates "the six gate types and what each asks" and defines `non_convergence` as "a review loop hit its
round cap." Read of `workflows/expert-lifecycle.js` at every `GATE.non_convergence` use via
`grep -n "GATE.non_convergence"` → **6 hits**: `:467` and `:848` are the two new ones; the four pre-existing
uses at `:729`, `:784`, `:790`, `:795` are all genuine round-cap or convergence-failure events (`:784` and
`:790` are inside `gateEscalation`, reached only after `ROUND_CAP` rounds). Read of `commands/expert.md:63-70`
region equivalent — `GATE` has six members and none denotes an infrastructure fault. Round 5's recommended fix
for F5-1 named `GATE.spec_traceable`; the implementation diverged to `non_convergence` with no recorded
rationale.

**Standard violated.** Interface-contract conformance for an enumerated type: a producer must emit an
enumeration member only for the condition the published contract assigns to it, because the consumer renders
by type. This is the same class as F4-2's "a signal channel must carry only events of the kind it is defined
to signal," applied to the owner-facing gate taxonomy rather than to the hash list. The consequence is
concrete: `commands/expert.md` instructs the orchestrator to present the gate by what its type asks, so an
owner facing a dispatch fault is told a review loop exhausted its rounds. The compensating `what_happened`,
`options` and `recommendation` text is accurate and specific, which is why this is Moderate rather than
Serious — the owner is not left without the real story, only led into it by a wrong headline.

**Correct implementation.** Neither existing member fits an infrastructure fault, and overloading the worst-fitting
one is the wrong resolution in both directions. Add a seventh member — `GATE.control_fault: 'control_fault'` —
to the `GATE` object at `:63-70`, use it at `:467` and `:848`, and add the corresponding bullet to the
enumeration at `commands/expert.md:182-191` ("`control_fault` — a verification control could not run; the
subject is unverified, so the phase does not pass"). The producer and the published contract then agree, and
the new type carries the fail-closed semantics the round-5 remedy introduced. If adding a member is out of
scope for this branch, `GATE.spec_traceable` as round 5 recommended is the better of the six existing fits and
should be taken with a one-line note recording why.

---

## Tentative Findings

No tentative findings — every candidate finding's premise was verified per Compliance Gate B. Two caveats are
recorded rather than deferred, neither of which any finding's premise depends on. First, the five correction
drafts are session task outputs outside version control, cited by path and date (2026-08-17) with their
unpinnable status stated per the Step 6 rule. Second, F6-2's consequence includes one behavioral link that
cannot be executed here — how often a dispatched verifier returns a short-but-nonempty `checks` array in
practice. The finding does not rest on that frequency: its premise is that the workflow performs no coverage
comparison at a site where the expected count is known, which is a literal-content claim verified by Read of
`:679-682` and by a grep establishing that no such comparison exists anywhere in the module.

---

## Observations

- **A further-reworded time exemption still evades the F5-4 replacement pin (mutation MB2).** The new check
  regexes `(mtime|last[- ]modified|modif\w*\s+(?:time|before|after)|timestamp)` over the scope-check prompt
  region; a clause phrased "a file last touched earlier in wall-clock order than this phase — exempt" reaches
  a green tier (exit 0, verified by in-place probe, restored). This is recorded as context rather than as a
  finding because the standard F5-4 named — "a regression guard pins the defect class, not the literal text of
  the one instance" — is met: the assertion is now a region-scoped multi-term pattern, it is a strict superset
  of the regex round 5 itself prescribed as the correct implementation, and it catches the documented M4
  reword that defeated the prior pin. No static assertion over a natural-language prompt can survive arbitrary
  paraphrase, so paraphrase-immunity is not an attainable bar and treating it as one would be inventing a
  standard the review never named. The durable resolution is the same one F6-1 points at — execute the
  control rather than scan its prose — and it is out of reach for a prompt string that is consumed by an
  agent, not by code. Recorded so the reader can weigh the residual risk directly.
- **The `documentScopeCheck` return contract was checked specifically for a double-wrap defect and is
  correct.** The two new escalations return full `report(finish(), {outcome: 'owner_gate', …})` objects from
  inside a helper whose other returns are `null` or the same report shape (Read of `:834`, `:846-849`,
  `:860-866`); all three call sites do `const x = await documentScopeCheck(…); if (x) return x` (Read of
  `:536-537`, `:563-564`, `:586-587`). No caller re-wraps, so the outcome reaches the orchestrator in the
  documented shape. Recorded as context because no standard is violated — this is the shape the pre-existing
  violation path already used.
- **`VERIFIER_SCHEMA` is tightened at both levels independently.** `required: ['checks']` and `minItems: 1`
  (Read at `:183-197`) mean `{}` and `{checks: []}` are both schema-invalid, while `verifierEmpty` catches the
  same shapes at runtime if the schema is not enforced by the dispatch layer. Defense in depth rather than
  redundancy, since nothing in this module guarantees the agent harness validates the schema. No standard
  violation; recorded because it is the part of the F5-2 remedy that is easiest to miss when reading the diff.
- **The four new `REPLACED_BY_STRENGTHENING` entries each name the exact prior label, the exact superseding
  label, and the finding that forced the swap** (Read at `:455-487`). The T-20 deletion guard therefore still
  fires on outright removal while permitting the documented strengthening renames. No standard violation.

---

## What's Actually Good

- **The F5-3 closure is real, and it is real by the strongest available evidence.** `groundTruthPreconditions`
  is a pure function whose refusals the tier *observes* rather than asserts about. Good by the standard three
  consecutive rounds named — a new control is delivered with the test that demonstrates it refuses — and
  verified without trusting the tier's own harness: I re-implemented `declOf`, confirmed it brace-matches and
  throws on a missing header, lifted 1158 characters of genuine source, and executed twelve cases. Seven were
  adversarial shapes of my own that the tier does not cover, including the ledger/delta concat-boundary
  ordering case (A1/A2) and a truthy-but-not-`true` `approved_by_owner` (A6); the predicate was correct on all
  seven. Mutation MA confirms the block goes red when the predicate breaks. This is the finding that recurred
  three times, and it is closed by the mechanism rather than by another assertion.
- **The F5-2 remedy reached every site, through one definition, with the contract tightened underneath it.**
  `grep` enumerates all five verifier consumption sites guarded by one shared predicate — no site left behind,
  which is the specific failure round 5 warned about ("fixing `:815` alone leaves four controls"). Good by DRY
  as it applies to control predicates, and by fail-safe control design: an empty return now escalates at every
  site instead of reading as a pass. Verified by Read of each site at drafting time and by the grep counts
  recorded in the Systemic scan. The short-enumeration gap (F6-2) is a real shortfall against the same
  finding's correct form, and it does not diminish that the hard part — one predicate, five sites, plus the
  schema — was done as one change.
- **Both semantic pins were demonstrated to catch the rewordings that defeated their predecessors.** Round 5's
  M4 probe walked a reworded mtime rule through a green tier; the same class of mutation (MB) now fails the
  tier with a named FAIL, and the outcome-literal pin was generalized from a quote-style-specific `includes`
  to a scan asserting every `outcome:` literal in the module is `complete` or `owner_gate` — which mutation MC
  confirms by catching a reworded `'aborted'`. Good by the standard F5-4 named, and worth stating because
  these are regression guards for findings that recurred twice each; they are now demonstrated to fail on the
  defect they guard rather than assumed to.

---

## Convergence Record

- **Round number:** 6 (fifth Post-fix round).
- **Trajectory:** R1: 9 (1 Serious-Systemic, 4 Serious, 3 Moderate, 1 Minor) → R2: 7 (1 Serious-Systemic,
  3 Serious, 3 Moderate) → R3: 5 (2 Serious, 2 Moderate, 1 Minor) → R4: 5 (1 Serious-Systemic, 2 Serious,
  2 Moderate) → R5: 4 (1 Serious-Systemic, 1 Serious, 2 Moderate) → **R6: 3 (1 Serious, 2 Moderate)**.
- **Flow counts for this round:**
  - Prior findings **closed**: **3** — F5-1, F5-3, F5-4; each verified against its originally named standard
    in the Upstream Contract Verification table, by Read of current source plus executed probes (MA, MB, MC
    and the twelve-case predicate run).
  - **Recurring**: **1** — F6-2 (F5-2's standard; the empty case closed at all five sites, the short case
    named in the same finding's correct form not implemented).
  - **New**: **2** — F6-1 and F6-3.
  - **Regressions**: **0** — no finding this round was introduced or exposed by `8141ac5` reverting or
    breaking previously correct behavior. F6-1 and F6-3 concern controls the commit *added*; a newly added
    control that lacks a test is a new finding, not a regression, since no prior-correct state was lost.
  - Reconciliation: 4 prior − 3 closed = 1 carried = 1 recurring; 1 + 2 new + 0 regressions = **3**.
- **Tripwire evaluation — NOT FIRED.** Arithmetic shown for both conditions, per Post-fix round:
  - **(a)** new + regression ≥ closed, for two consecutive Post-fix rounds.
    - R2: 2 + 1 = 3; closed = 6; 3 ≥ 6 → **false**.
    - R3: 1 + 2 = 3; closed = 5; 3 ≥ 5 → **false**.
    - R4: 1 + 2 = 3; closed = 3; 3 ≥ 3 → **TRUE**.
    - R5: 2 + 1 = 3; closed = 4; 3 ≥ 4 → **false**.
    - R6: 2 + 0 = 2; closed = 3; 2 ≥ 3 → **false**.
    - Two consecutive requires R5 and R6 both true; both are false. **Not fired.**
  - **(b)** the total findings count has not strictly decreased, for two consecutive Post-fix rounds. Totals:
    R1 = 9, R2 = 7, R3 = 5, R4 = 5, R5 = 4, R6 = 3.
    - R2: 7 < 9 → strictly decreased → **false**.
    - R3: 5 < 7 → strictly decreased → **false**.
    - R4: 5 < 5 is false → did not strictly decrease → **TRUE**.
    - R5: 4 < 5 → strictly decreased → **false**.
    - R6: 3 < 4 → strictly decreased → **false**.
    - Two consecutive requires R5 and R6 both true; both are false. **Not fired.**
- **Neither condition holds in round 6, so neither can hold consecutively; the tripwire is two rounds clear of
  firing.** Round 4 was the only round in which either condition held, and rounds 5 and 6 each broke both
  independently. Beyond the counts, the composition of this round is the stronger convergence signal: closures
  are 3 of 4 against originally named standards, the closure mechanism shifted from assertion to execution,
  regressions are zero for the first time in the cycle, and the recurring finding is a *narrowed* remainder of
  its predecessor (one site's short-enumeration case) rather than the original five-site pattern. The two new
  findings are both about controls that did not exist before this commit, which is the expected cost of adding
  four controls in one round, not evidence of churn.

---

## Recommended Priority

The tripwire did not fire, so foundational rework is not the indicated path; a targeted fix round is. The
three open findings are independent work items with no shared root, and all three are small. Sequence them by
what each costs when it is wrong.

1. **F6-1 first, and use the mechanism this commit already proved.** It is the only finding that leaves this
   round's own work unprotected: mutation MD reopens five controls at once and mutation ME restores a defect
   round 5 classified as a Serious regression, both with a fully green 222-check tier. Lift `verifierEmpty`
   with `declOf` and execute it over four constructed returns, exactly as T-24x now does for
   `groundTruthPreconditions` — this is a dozen lines against a pattern the commit demonstrates working, and
   it converts the cycle's central lesson into tier coverage rather than review memory. Extracting
   `hashFromChecks(checks) → string | null` and executing it covers the F5-1 escalation's trigger in the same
   move.
2. **F6-2 in the same commit.** One comparison at `:681` against `sample.length`, or — better — generalize the
   shared helper to `verifierUnderCovered(v, expected)` so the F5-2 remedy stays at one definition and the
   empty and short cases cannot drift apart. Doing this alongside F6-1 means the new executed test covers both
   cases from the start rather than being written twice.
3. **F6-3 last.** It is owner-facing rather than control-behavior, and the compensating gate text carries the
   real story, so it is the least costly to be wrong about. Adding `GATE.control_fault` and its bullet in
   `commands/expert.md:182-191` is a two-file, four-line change; take the `GATE.spec_traceable` fallback only
   if adding an enumeration member is out of scope for this branch, and record the reason if so.

---

Verdict: NEEDS FIXES (3 findings: 1 Serious, 2 Moderate)
