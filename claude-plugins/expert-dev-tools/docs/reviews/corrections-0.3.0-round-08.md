# Independent review — corrections 0.3.0, round 8 (Post-fix)

Artifact: commits `2b1b7d8` → `66514d0` on `claude/edt-corrections-0.3.0`, diffed against `origin/main`.
HEAD at review time: `66514d05263360631adf20ceda1b4f0821713b32`.
Reviewer: independent (expert-review R1.2). Date: 2026-08-19.
Prior rounds: `corrections-0.3.0-round-01.md` (NEEDS FIXES, 9); `…-round-02.md` (7); `…-round-03.md` (5);
`…-round-04.md` (5); `…-round-05.md` (4); `…-round-06.md` (3); `…-round-07.md` (3).

---

## Scope and Inventory

Round 8 — Post-fix review. Inventory built per Step 2's post-fix rule from all four sources. Every premise
below was re-derived from current source at drafting time; nothing is inherited from a prior record.

**Source 1 — the prior review's full inventory, re-verified:**

- [x] `claude-plugins/expert-dev-tools/workflows/expert-lifecycle.js` — Read at 55-75 (the `GATE` object and
  its leading comment) and 465-472, 684, 695, 721, 736, 837, 851 via
  `grep -n "verifierUnderCovered\|underCoveredVerifierGate\|GATE.control_fault\|if (!gt.ok)"` → **9 hits**
  (definition `:467`; gate builder `:468`; emission sites `:470`, `:851`; consumption sites `:684`, `:695`,
  `:736`, `:837`; `if (!gt.ok)` at `:721`). `git diff --name-only 55562f6..66514d0` confirms this file was
  **not changed** by either fix commit. `node --check` → SYNTAX OK. Grounds F8-1.
- [x] `claude-plugins/expert-dev-tools/tests/structural/check-structure.mjs` — Read of the full `55562f6..b972e79`
  hunk (the T-24y extraction replacement at `:706-707` and the five new deployment checks at `:719-731`).
  Executed; mutation-probed nine ways in an isolated worktree.
- [x] `claude-plugins/expert-dev-tools/commands/expert.md` — Read at 178-198 and `:209-211`. Both count
  statements now read "seven"; the bullet list under the heading is **7** bullets
  (`awk 'NR>=180 && NR<=200 && /^  - `/' | wc -l` → 7). The self-contradiction round 7 filed is gone.
- [x] `claude-plugins/expert-dev-tools/docs/specs/spec-expert-dev-tools.md` — Read at 115-148: §3.4 retains
  the "exhaustive list" heading and the "exactly these, and nothing else" sentence, and now carries **seven**
  numbered items with item 7 (`Control faults`) and an inline amendment note. Grounds the F7-2 closure of the
  upstream-contract half.
- [x] `claude-plugins/expert-dev-tools/docs/arch/architecture-expert-dev-tools.md` — Read at 224-240: the
  SEGMENT_REPORT `gate.type` union now carries `control_fault` as a seventh member, and the invariant sentence
  reads "The seven gate types are exactly the spec §3.4 escalation list (amended 2026-08-19, owner decision
  F7-2 …)". Grounds the same closure.
- [x] `claude-plugins/expert-dev-tools/scripts/ledger.schema.json` — Read at 100-108. **Not changed** by either
  fix commit; the `escalations` description still reads "gate_type is one of the six in spec 3.4, plus
  control_fault". Grounds F8-1's second instance.
- [x] `claude-plugins/expert-dev-tools/docs/SKILL-CHANGELOG.md` — Read at 1-20 (its own scope charter) and
  `grep -n "control_fault\|gate type\|0.3.0"` → **1 hit** (`:587`, a pre-existing 0.3.0 approval note, no
  gate-type content). Not changed. See Observations for why this is not filed as a finding.
- [x] `claude-plugins/expert-dev-tools/.claude-plugin/plugin.json` — `git diff --stat 55562f6..66514d0 --
  .claude-plugin` → **0 lines of output**; unchanged. The 0.3.0 bump stands from `2b1b7d8`.
- [x] `claude-plugins/expert-dev-tools/agents/expert-architect.md` — same method (`git diff --stat` over
  `agents/` → 0 lines): unchanged by both fix commits.
- [x] `claude-plugins/expert-dev-tools/agents/expert-planner.md` — same method, same result.
- [x] `claude-plugins/expert-dev-tools/agents/expert-spec-writer.md` — same method, same result.
- [x] `claude-plugins/expert-dev-tools/skills/expert-standard/SKILL.md` — same method over `skills/` → 0 lines;
  unchanged.
- [x] `claude-plugins/expert-dev-tools/skills/expert-plan/SKILL.md` — same method, same result.
- [x] `claude-plugins/expert-dev-tools/skills/expert-implement/SKILL.md` — same method, same result.

**Source 2 — fix-diff files (`55562f6..66514d0`), all six:** `commands/expert.md`,
`docs/SESSION-STATE-corrections-0.3.0.md`, `docs/arch/architecture-expert-dev-tools.md`,
`docs/reviews/corrections-0.3.0-round-07.md` (the prior record, added to the tree — no claim here rests on it
as a source), `docs/specs/spec-expert-dev-tools.md`, `tests/structural/check-structure.mjs`.

**Source 3 — dependents of the fix-diff files:**

- [x] `claude-plugins/expert-dev-tools/workflows/expert-lifecycle.js` — the subject of every new test assertion
  and the producer the amended spec and architecture govern. Covered above.
- [x] `claude-plugins/expert-dev-tools/scripts/validate-ledger.mjs` — executed against a constructed ledger
  carrying a `control_fault` escalation. The validator reported 11 shape errors from my own ledger construction
  and **no `gate_type` enum error**, confirming the enum still accepts the value. The schema itself is unchanged
  in this diff, so round 7's five-ledger end-to-end result stands unamended.
- [x] `claude-plugins/expert-dev-tools/tests/unit/run-unit-tests.mjs` — executed: 17 `ok`, exit 0.
- [x] `claude-plugins/expert-dev-tools/docs/plans/plan-expert-dev-tools-behavioral-remediation.md` — Read at
  1439 ("**Not a new gate type**: the six gate types are fixed by spec 3.4"). Still present and still false as
  a standing statement; excluded from findings — see Observations.
- [x] `claude-plugins/expert-dev-tools/docs/plans/plan-expert-dev-tools.md` — Read at 48 ("Escalation set §3.4
  (six gate types)"). Same disposition.
- [x] `claude-plugins/expert-dev-tools/docs/SESSION-STATE-corrections-0.3.0.md` — Read at 25-45. Records the
  owner decision of 2026-08-19, the required amendment text, and the explicit scoping decision that the plan
  files are grandfathered and must not be edited. This is the authorizing input for `66514d0`.

**Source 4 — the prior review's three findings as closure items:** F7-1, F7-2, F7-3 — each re-derived from
current source in the Upstream Contract Verification table, and each probed by execution.

**Supporting:**

- [x] `git status --porcelain claude-plugins/expert-dev-tools` → **empty**, before and after all probing. Every
  Read is of committed state. **All nine mutations were run in a detached `git worktree` at `66514d0`
  (`C:/Users/maxco/AppData/Local/Temp/w8`), never in the repository working tree** — the dispatch required a
  scratch copy, and the empty status is the evidence none of it touched the repo.
- [x] The authorizing inputs named in the round-01 record (`defect-history.json`,
  `.claude/expert/ACCEPTANCE-RESULTS-2026-08-17.md`, and the five owner-approved correction drafts under the
  session task directory). **Unpinnable citation**: outside version control, cited by path and date 2026-08-17.
  No finding rests on their content.
- [x] The new owner decision of 2026-08-19 resolving F7-2. Verified as **recorded in version control**: the
  amendment note inside `docs/specs/spec-expert-dev-tools.md:139-148` at commit `66514d0` names the date, the
  decision-maker ("owner decision"), the finding (F7-2), the evidence class, and the review records. This is a
  pinnable citation — `spec-expert-dev-tools.md` at `66514d0` — not a path-and-date one, which is the correct
  form for a decision that amends a spec.

### Tool plan (Step 3)

| Claim type | Instrument | Used for |
|---|---|---|
| Literal-content | Read at file:line | spec §3.4; the architecture SEGMENT_REPORT union; `commands/expert.md`'s two count statements and bullet list; the `GATE` object and its comment; the schema `escalations` description; the T-24y extraction line and the five new deployment checks |
| Absence | grep with recorded query + count | stale "six" statements across the plugin; `control_fault` in the changelog; the changed-file set via `git diff --name-only` |
| Behavioral (tests pass; controls refuse) | test-runner execution + nine in-place mutation probes in an isolated worktree | both tiers; round 7's six surviving mutation categories; the F7-3 adjacency probe; MD/ME re-run; one new refactor probe |
| Structural / dataflow | Read of the specific code path | the four `verifierUnderCovered` consumption sites; the two `control_fault` emission sites |
| Imported from prior documents | re-derivation from current source | all three closure items; round 7's mutation table |
| Comment claims inside the artifact | re-derivation from source | the `GATE` comment at `:61-62` (re-derived and found false — F8-1); the `b972e79` commit message's "234/234, 17/17" (both re-executed and confirmed) |

No library-behavior claims arise in this scope, so Context7 is not load-bearing; no instrument class was
unavailable. **Procedural note (honest sequencing):** `metacognitivemonitoring` is specified for review start;
it was invoked at the evaluation stage instead, after probing and before findings were finalized. It changed
the output — it named the F7-2 closure/recurrence question as the review's weakest judgment, and the
"separate the two components of F7-2's originally named standard" approach it recommended is what the
Upstream Contract Verification table now does explicitly. `collaborativereasoning` was invoked before the
gates and succeeded on the second call (the first was rejected for a persona communication-enum violation — a
validation error, not an infrastructure failure); it produced the grouping-independence argument recorded in
the Convergence Record. No rigor waivers.

### Execution results

- **Structural tier**: `node tests/structural/check-structure.mjs` → `STRUCTURAL TESTS PASSED`, exit 0,
  **234** `ok` lines. Matches `b972e79`'s "Structural 234/234" (229 + 5 new deployment checks).
- **Unit tier**: `node tests/unit/run-unit-tests.mjs` → `UNIT TESTS PASSED`, exit 0, **17** `ok` lines.
- **Syntax**: `node --check workflows/expert-lifecycle.js` → clean.
- **Worktree baseline**: identical (exit 0, 234 `ok`) before any mutation.

### Round 7's six surviving mutations, re-run (requested at dispatch)

All run in the detached worktree at `66514d0`, each restored from a pristine copy before the next.

| # | Mutation | Round 7 | Round 8 |
|---|---|---|---|
| MN | delete the spot re-run `verifierUnderCovered` call site (`:684`) | not caught, exit 0 | **caught** — exit 1, 3 FAILs incl. `T-24 deployment: verifierUnderCovered guards all four consumption sites` |
| MK | delete the diff-vs-plan call site (`:695`) | not caught, exit 0 | **caught** — exit 1, 2 FAILs |
| ML | delete the reconciliation call site (`:736`) | not caught, exit 0 | **caught** — exit 1, 2 FAILs |
| MM | delete the doc-scope call site (`:837`) | not caught, exit 0 | **caught** — exit 1, 2 FAILs |
| MF | `verifierUnderCovered(vr, sample.length)` → `(vr, 1)` | not caught, exit 0 | **caught** — exit 1, `T-24 deployment: the spot re-run expects its full sample count` |
| MH | flip the `:470` gate to `GATE.non_convergence` **alone** | not caught, exit 0 | **caught** — exit 1, `T-24 deployment: both control gates carry GATE.control_fault` |
| MI | flip the `:851` gate to `GATE.non_convergence` **alone** | not caught, exit 0 | **caught** — exit 1, same check |
| MO | ground-truth guard `if (!gt.ok)` → `if (false)` | not caught, exit 0 | **caught** — exit 1, `T-24 deployment: the ground-truth guard branches on the extracted predicate result` |

Eight for eight. The single-site flips MH and MI are the strongest result here: round 7's pin was satisfied by
any one surviving occurrence, and the replacement is an occurrence count (`>= 2`), so each site is now pinned
individually. Every one of round 7's six named categories turns the tier red.

### Round 6's two mutations, re-run (regression check on the T-24y rewrite)

| # | Mutation | Result |
|---|---|---|
| MD | `verifierUnderCovered` neutered to `() => false` | **caught** — exit 1, three named T-24y FAILs |
| ME | the missing-hash escalation disabled (`if (!hex)` → `if (false)`) | **caught** — exit 1, the scope-check FAIL |

The extraction rewrite did not weaken the block it replaced.

### F7-3 verified by the dispatch's own criterion

The dispatch asked for the exactness check directly: insert an adjacent definition-time-evaluating `const` on a
scratch copy, and the tier must stay green.

- Inserted `const SOME_TABLE = { k: LENSES.map((x) => x) }` immediately after `:467`. **Tier exit 0, 234 green.**
  This is the precise construct that produced `ReferenceError: LENSES is not defined` under round 7's
  brace-matching extractor. The extraction is now exact.
- The mechanism, Read at `:706-707`: `(wfSrc.match(/const verifierUnderCovered =[^\n]*/) || [''])[0]` — a
  line-exact capture — and the `'const Math_ = Math;'` aliasing round 7 called inert is gone with it.

### New probe (not in round 7)

| # | Mutation | Result |
|---|---|---|
| MQ | reformat `verifierUnderCovered` to a brace-bodied arrow across three lines, behavior identical | **caught** — exit 1, but as an uncaught `SyntaxError: Unexpected token ')'` rather than a named FAIL |

Fail-closed and therefore not a finding; see Observations for why it is recorded anyway.

---

## Summary

**This review returns NEEDS FIXES.** Two of round 7's three findings are closed by the strongest evidence the
cycle has produced: all eight mutations covering round 7's six surviving categories now turn the tier red,
including the single-site `control_fault` flips that defeated the previous existence pin, and the T-24y
extraction is exact under the dispatch's own adjacency probe. The owner decision on F7-2 was taken and its
harder half genuinely landed — spec §3.4 now carries `control_fault` as item 7 under an unchanged "exhaustive
list … exactly these, and nothing else" heading, the architecture's `gate.type` union and its invariant
sentence match at seven, `commands/expert.md` reads "seven" in both places above exactly seven bullets, and the
amendment carries a traceable, version-controlled note naming the date, the finding, and the evidence. What
blocks the verdict is the propagation half of F7-2 at a site F7-2 named explicitly:
`workflows/expert-lifecycle.js:61` still asserts "The six owner-gate types — exactly the spec 3.4 escalation
list" directly above a seven-member object, and the amendment turned a second statement stale in the same
class — `ledger.schema.json:103` describes `gate_type` as "one of the six in spec 3.4, **plus** control_fault",
a framing that was accurate only while `control_fault` sat outside the spec. That is one Moderate recurring
finding and two one-line text edits. Trajectory is 9 → 7 → 5 → 5 → 4 → 3 → 3 → **1**. Both tripwire conditions
were armed entering this round and **both are broken**: closed (2) strictly exceeds new-plus-regression (0),
and the total strictly decreased from 3 to 1. The tripwire has not fired and the cycle is converging. The
arithmetic is shown in full below.

---

## Upstream Contract Verification

The upstream contracts are the five owner-approved correction drafts, the round-7 review findings as the
remediation contract for `b972e79` and `66514d0`, the owner decision of 2026-08-19 recorded in
`docs/SESSION-STATE-corrections-0.3.0.md:25-38`, and `docs/specs/spec-expert-dev-tools.md` §3.4 with
`docs/arch/architecture-expert-dev-tools.md`'s SEGMENT_REPORT protocol. Each round-7 finding is checked against
the standard originally named for it.

| Prior finding | Originally named standard | Status | Verification method |
|---|---|---|---|
| **F7-1** (the 0.3.0 controls are pinned at their definition but not at their deployment; six mutations that each restore a previously-filed Serious defect pass a fully green tier) | "a new control is delivered with the test that demonstrates it refuses" — a control refuses only as deployed | **CLOSED** | Verified by **execution of the exact mutations the finding used as its evidence**, in a detached worktree at `66514d0`, each restored before the next. All eight (MN, MK, ML, MM, MF, MH, MI, MO) exit **1** with a named `T-24 deployment` FAIL; the per-mutation results are tabled above. Read of `tests/structural/check-structure.mjs:719-731` confirms the mechanism is the occurrence-count pattern the finding named and that the same file already used at T-23 `:672-675`: `(wfSrc.match(/verifierUnderCovered\(/g) \|\| []).length >= 4`, the same over `underCoveredVerifierGate\(`, `includes('verifierUnderCovered(vr, sample.length)')`, `(wfSrc.match(/GATE\.control_fault/g) \|\| []).length >= 2`, and `includes('if (!gt.ok) {')`. The `>=` form rather than the finding's suggested `===` is a deliberate and correct relaxation: it fails on deletion, which is the regression the finding was about, and does not produce a false red when a legitimate fifth call site is added later. Regression-checked against round 6's MD and ME — both still red. |
| **F7-2** (`control_fault` added as a seventh gate type against a spec declaring its list exhaustive, with no amendment to the spec or architecture and stale "six" counts left behind) | upstream-contract conformance, **plus** documentation-code consistency as it applies to a published enumerated contract | **PARTIALLY CLOSED — the upstream-contract half is closed; the documentation-code-consistency half is open at a site the finding named** | *Upstream-contract half:* Read `docs/specs/spec-expert-dev-tools.md:119-148` — §3.4 retains "(exhaustive list)" and "exactly these, and nothing else", and carries seven numbered items with item 7 (`Control faults`) distinguishing itself from `non_convergence` and `spec_traceable`, under an amendment note naming the date, the owner decision, F7-2, the evidence class, and the review records. Read `docs/arch/architecture-expert-dev-tools.md:227-235` — the union carries `control_fault` and the invariant reads "The seven gate types are exactly the spec §3.4 escalation list (amended 2026-08-19 …)". Read `commands/expert.md:180` and `:211` — both "seven"; bullet count under the heading is 7 (`awk` count recorded above). The producer, the spec, the architecture, and the command contract now agree, and the amendment is traceable to a version-controlled owner decision. That is closure of the harder half, and it is the half that made F7-2 Serious. *Documentation-code half:* `grep -rn "six gate\|the six in spec\|six owner-gate" --include=*.md --include=*.js --include=*.mjs --include=*.json .` over the plugin, excluding `docs/reviews/` → **5 hits**, of which **2 are live and false in non-grandfathered files**: `workflows/expert-lifecycle.js:61` (Read at 55-75; the comment F7-2's correct-implementation list named at `:61-62`, unchanged — `git diff --name-only 55562f6..66514d0` does not include this file) and `scripts/ledger.schema.json:103` (Read; unchanged, and its "plus control_fault" framing was made false *by* the amendment). Filed as **F8-1**, provenance recurring. |
| **F7-3** (T-24y over-captures because `declOf` is applied to an expression-bodied arrow, so the guard's correctness depends on an adjacent declaration it does not test) | first-principles: a regression guard that reports on code outside its subject is a false-signal source | **CLOSED** | Verified by the dispatch's own criterion, by execution: inserting `const SOME_TABLE = { k: LENSES.map((x) => x) }` immediately after the definition — the exact construct that produced `ReferenceError: LENSES is not defined` under the old extractor — leaves the tier at **exit 0, 234 green**. Read of `:706-707` confirms the replacement is a line-exact regex capture, not a widened brace scan, and that the `Math_` aliasing round 7 flagged as an empirical workaround was removed with it. Round 6's MD still turns the block red (exit 1, three named T-24y FAILs), so the rewrite tightened the extraction without weakening the assertion. |

**Acceptance criteria / architecture decisions governing this scope.** Spec §3.4 and the architecture's
SEGMENT_REPORT protocol are the governing upstream artifacts for the `GATE` change; both were **violated** in
round 7 and both are now **honored** — checked by Read of each, recorded above. No other spec acceptance
criterion is in scope for a corrections branch that changes no functional requirement.

---

## Critical & Serious Findings

**No Critical or Serious findings** — the full inventory was Read or Grep-verified per Compliance Gate B, and
no violations of Critical or Serious classification were observed. Round 7's two Serious findings are addressed
at Serious severity: F7-1 fully, and F7-2's upstream-contract half, which was what made it Serious. The
remainder is classified Moderate below, with the reasoning for the severity change stated in the finding.

---

## Systemic Patterns

**No systemic patterns.** F8-1's two instances are the residue of a single amendment's propagation, not a
pattern the codebase reproduces.

Proactive scans run, with queries and result counts:

- `grep -rn "six gate\|the six in spec\|six owner-gate\|six original" --include=*.md --include=*.js
  --include=*.mjs --include=*.json .` over the plugin → **5 hits** outside `docs/reviews/`, enumerated
  individually: `workflows/expert-lifecycle.js:61` (**live and false** — F8-1),
  `scripts/ledger.schema.json:103` (**live and false** — F8-1),
  `docs/plans/plan-expert-dev-tools-behavioral-remediation.md:1439` and `docs/plans/plan-expert-dev-tools.md:48`
  (grandfathered by explicit owner scoping — see Observations),
  `docs/specs/spec-expert-dev-tools.md:143` ("none of the six original types" — correct as written, it is the
  amendment note describing the pre-amendment state). Two live instances against three correctly-dispositioned
  ones is not a propagating pattern.
- `grep -n "verifierUnderCovered\|underCoveredVerifierGate\|GATE.control_fault\|if (!gt.ok)"
  workflows/expert-lifecycle.js` → **9 hits**: definition `:467`, gate builder `:468`, both emissions `:470`
  and `:851`, all four consumption sites `:684`/`:695`/`:736`/`:837`, and the ground-truth branch `:721`. No
  guarded path is missing its guard and no unguarded consumption of a verifier return exists.
- `git diff --name-only 55562f6..66514d0 -- claude-plugins/expert-dev-tools` → **6 files**; `git diff --stat`
  over `agents/`, `skills/`, and `.claude-plugin/` → **0 lines**, confirming the fix commits introduced no
  collateral change in the parts of the inventory they were not scoped to touch.

---

## Moderate & Minor Findings

No Minor findings — every candidate at that severity resolved to either the Moderate finding below or a
non-finding observation, verified by the probes recorded in Scope and Inventory.

### F8-1 — The seventh-gate-type amendment was not propagated to two count statements that assert the old invariant, one of them a code comment directly above the object it contradicts
**Location:** `claude-plugins/expert-dev-tools/workflows/expert-lifecycle.js:61-62`
**Severity:** Moderate
**Provenance:** **recurring** — F7-2 named this exact site in its correct-implementation set ("correct the
`workflows/expert-lifecycle.js:61-62` comment") under the same documentation-code-consistency standard, and it
is unchanged. The second instance below is the same standard at a site the amendment newly falsified.

**What the code does now.** Two statements in non-grandfathered files assert a six-member gate set that no
longer exists:

1. `workflows/expert-lifecycle.js:61-62` — "`// The six owner-gate types — exactly the spec 3.4 escalation
   list; the script has no other path to the owner.`" — immediately above a `GATE` object with **seven**
   members, the seventh of which (`control_fault`) carries its own explanatory comment nine lines below. The
   comment states an invariant that the code beneath it refutes.
2. `scripts/ledger.schema.json:103` — "`gate_type is one of the six in spec 3.4, plus control_fault (0.3.0: a
   mechanical control could not run - the phase is unverified)`". The "plus" framing was accurate while
   `control_fault` sat outside spec §3.4 — round 7 recorded it in Observations for exactly that reason. The
   amendment made it false: spec §3.4 now has seven numbered items and `control_fault` is item 7, so
   `gate_type` is one of the *seven* in spec 3.4, with nothing "plus".

**How that claim was verified.** Read of both sites at drafting time, plus the changed-file set:

- Read `workflows/expert-lifecycle.js:55-75` — the comment at `:61-62` verbatim as quoted, followed by the
  `GATE` object literal with seven keys (`intent`, `spec_traceable`, `business`, `risk_override`,
  `non_convergence`, `core_approval`, `control_fault`).
- Read `scripts/ledger.schema.json:100-108` — the `escalations` description verbatim as quoted.
- `git diff --name-only 55562f6..66514d0 -- claude-plugins/expert-dev-tools` → **6 files**, and neither
  `workflows/expert-lifecycle.js` nor `scripts/ledger.schema.json` is among them. Neither statement was
  revisited by either fix commit.
- Read `docs/specs/spec-expert-dev-tools.md:119-148` establishing the seven-item state both statements
  contradict.
- The proactive grep above (5 hits, each dispositioned) establishes these are the only two live instances.

**Standard violated.** Documentation-code consistency as it applies to a published enumerated contract — the
same standard F7-2 named, and the reason F7-2 filed the `expert.md:180` self-contradiction as its acute form.
A comment that states an invariant is a claim about the code it annotates; when the code changes and the claim
does not, the comment becomes a false statement positioned exactly where a maintainer will trust it most. The
schema description is the consumer-facing half of the same problem: it is the text a ledger author reads to
learn what `gate_type` may contain, and it now describes the enum's relationship to the spec incorrectly.

**Why the severity moved from Serious to Moderate.** F7-2's named standard had two components. The
upstream-contract component — a spec declaring its list exhaustive while the implementation emitted a seventh
value, and an architecture publishing a union that a real report fell outside of — is closed, verified by Read
of both amended documents. That component is what made F7-2 Serious: it was a producer emitting outside a
published contract, which misleads a consumer that parses against it. What remains violates no contract a
consumer parses; it misleads a human reader of two comments. That is a genuine quality defect and it blocks
PASS, but classifying it Serious would misstate what is actually at risk. The downgrade is justified by which
component resolved, not by the round count — and the finding is recorded as recurring, not new, precisely so
the record shows F7-2 did not fully close.

**Correct implementation.** Two one-line text edits, no code change:

- `workflows/expert-lifecycle.js:61-62` → "`// The seven owner-gate types — exactly the spec 3.4 escalation
  list (amended 2026-08-19, owner decision F7-2); the script has no other path to the owner.`" This matches the
  wording `66514d0` already committed to the architecture at `:232-235`, so the two invariant statements read
  identically.
- `scripts/ledger.schema.json:103` → "`Owner escalations raised; gate_type is one of the seven in spec 3.4
  (control_fault added 2026-08-19: a mechanical control could not run - the phase is unverified).`"

Both should land in one commit, and the count pin discussed under Recommended Priority is worth adding at the
same time so a future amendment cannot leave these behind again.

---

## Tentative Findings

**No tentative findings** — every candidate finding's premise was verified per Compliance Gate B. Two caveats
are recorded rather than deferred, and no finding's premise depends on either. First, the authorizing inputs
named in the round-01 record remain session outputs outside version control, cited by path and date
(2026-08-17) with their unpinnable status stated per the Step 6 rule. Second, the owner decision of 2026-08-19
was verified through its version-controlled artifacts — the amendment note in `spec-expert-dev-tools.md` at
`66514d0` and the pre-existing instruction in `docs/SESSION-STATE-corrections-0.3.0.md:25-38` — rather than
through any direct record of the owner's words; the finding set does not depend on the decision's content
beyond the fact that it was taken and recorded, which both artifacts establish.

---

## Observations

- **The `SKILL-CHANGELOG.md` entry round 7 called for is correctly absent, and filing it would have been
  manufacturing a finding.** Read of the changelog's own charter at `:15-21`: "Every change to a file under
  `claude-plugins/expert-dev-tools/skills/` … Scope is `skills/` and nothing else." `git diff --stat
  55562f6..66514d0 -- skills/` → **0 lines**. Neither fix commit touched `skills/`, so no entry is owed. Round
  7's recommendation to add one was itself outside the changelog's scope. No standard is violated; recorded so
  the next round does not re-derive this as a miss.
- **The two plan-file "six gate types" statements are excluded by an explicit, recorded scoping decision, not
  by oversight.** `docs/SESSION-STATE-corrections-0.3.0.md:35-37` (Read) states: "Check the plan reference at
  `docs/plans/plan-expert-dev-tools-behavioral-remediation.md:1439` (states six fixed by spec 3.4) — do NOT
  edit the plan (grandfathered artifact); the spec amendment note is the traceability." The spec's amendment
  note does carry that traceability (Read at `:139-148`), so a reader arriving at the stale plan line via the
  spec has the correction in hand. No standard violation; recorded because both lines will keep appearing in
  grep sweeps and the next reviewer should not re-file them.
- **A behavior-preserving reformat of `verifierUnderCovered` kills the tier with an opaque `SyntaxError`
  rather than a named FAIL, and this is fail-closed rather than a defect.** Probe MQ: rewriting the predicate
  as a three-line brace-bodied arrow with identical semantics makes the line-exact regex capture half a
  statement, and `new Function` throws `SyntaxError: Unexpected token ')'` — exit 1, with the checks after
  T-24y never running. The direction is correct (a tier that cannot verify does not pass), and format
  sensitivity is inherent to source-text pinning, which is the technique T-22 and T-23 use throughout, so no
  standard is violated. Recorded because the failure names neither the file nor the cause, and a maintainer
  reformatting that one line will otherwise spend real time on it.
- **Round 7's suggested `=== 5` / `=== 2` occurrence counts were implemented as `>= 4` / `>= 2`, which is the
  better choice.** Read at `:720-728`. The finding's concern was silent removal, which `>=` catches identically
  — verified by MK/ML/MM/MN and MH/MI all going red. The relaxation additionally avoids a false red when a
  legitimate fifth guarded call site is added later, which an exact count would produce. No standard violation;
  recorded because it is a deliberate deviation from a review recommendation and the reasoning should be on the
  record rather than rediscovered.

---

## What's Actually Good

- **F7-1 was closed by the method round 7 asked for, and verified by re-running round 7's own evidence rather
  than by reading the new assertions.** Good by the standard five consecutive rounds have named — a new control
  is delivered with the test that demonstrates it refuses. Verified by execution in an isolated worktree: eight
  mutations, eight reds, each naming the specific deployment property it broke. The single-site `control_fault`
  flips (MH, MI) are the sharpest evidence: round 7's `includes('type: GATE.control_fault')` pin was satisfied
  by any one surviving occurrence, and the replacement occurrence count fails on either site alone. The
  cycle-long pattern of controls that are correct but undeployed is, on this evidence, actually broken.
- **The F7-2 amendment is traceable in the artifact it amends, not in a side document.** Good by the standard
  that a constraint declared exhaustive can only be exceeded by amending it, and that the amendment must carry
  its own authority. Verified by Read of `docs/specs/spec-expert-dev-tools.md:139-148`: the note names the date
  (2026-08-19), the decision-maker, the originating finding (F7-2), the concrete evidence class (empty verifier
  returns, a mis-targeted ground-truth dispatch), the reasoning for preferring a seventh type over stretching
  two existing ones, and pointers to the review records. A future reader who finds seven items under an
  "exhaustive list" heading can reconstruct why without leaving the file. The architecture at `:232-235` carries
  the same note in the same form, so the two governing documents cannot be read as disagreeing.
- **The F7-3 fix chose the option that required no production-code change and removed a workaround.** Round 7
  offered making the predicate brace-bodied (one production edit) or teaching `declOf` about expression bodies.
  The commit took a third form — a line-exact capture local to the test — which is better by the principle that
  a test's extraction strategy is the test's problem, not the subject's: production code should not be reshaped
  to suit a guard. Verified by Read at `:706-707` and by the adjacency probe returning exit 0, plus MD still
  red. The now-unnecessary `'const Math_ = Math;'` aliasing was deleted in the same edit rather than left
  behind, which is the part most likely to have survived a careless fix.

---

## Convergence Record

- **Round number:** 8 (seventh Post-fix round).
- **Trajectory:** R1: 9 (1 Serious-Systemic, 4 Serious, 3 Moderate, 1 Minor) → R2: 7 (1 Serious-Systemic,
  3 Serious, 3 Moderate) → R3: 5 (2 Serious, 2 Moderate, 1 Minor) → R4: 5 (1 Serious-Systemic, 2 Serious,
  2 Moderate) → R5: 4 (1 Serious-Systemic, 1 Serious, 2 Moderate) → R6: 3 (1 Serious, 2 Moderate) →
  R7: 3 (2 Serious, 1 Minor) → **R8: 1 (1 Moderate)**.
- **Flow counts for this round:**
  - Prior findings **closed**: **2** — F7-1 and F7-3. Each verified against its originally named standard in
    the Upstream Contract Verification table, by execution rather than inspection: F7-1 by re-running all six
    of round 7's surviving mutation categories (eight mutations, eight reds) plus round 6's MD and ME as a
    regression check; F7-3 by the dispatch's adjacency criterion (exit 0 where the old extractor threw
    `ReferenceError`).
  - **New**: **0**.
  - **Regressions**: **0**. No probe surfaced a defect introduced by `b972e79` or `66514d0`; the changed-file
    set is six files and `git diff --stat` over `agents/`, `skills/` and `.claude-plugin/` is empty.
  - **Recurring**: **1** — F8-1. F7-2's correct-implementation set named
    `workflows/expert-lifecycle.js:61-62` explicitly and the site is unchanged, so under the same
    documentation-code-consistency standard this is the same finding at the same location, not a new one.
    F7-2 is therefore **not** counted as closed.
  - Reconciliation: 3 prior − 2 closed = 1 carried; 1 + 0 new + 0 regression = **1**.
  - **Grouping note.** F8-1 covers two instances (the workflow comment and the schema description). Filing them
    separately would give a total of 2 and a recurring count of 2. Neither tripwire condition changes under
    that grouping — (a) would be 0 ≥ 2, still false; (b) would be 2 < 3, still strictly decreased — so the
    routing conclusion below is independent of how the two instances are grouped. This is stated so the
    single-finding total cannot be read as a merge performed to clear the tripwire.
- **Tripwire evaluation — NOT FIRED. Both armed conditions are broken.** Round 7 recorded both conditions true
  for the first time since round 4, arming the tripwire: either condition true again in round 8 fires it.
  Arithmetic for both, across every Post-fix round:
  - **(a)** new + regression ≥ closed, for two consecutive Post-fix rounds.
    - R2: 2 + 1 = 3; closed = 6; 3 ≥ 6 → **false**.
    - R3: 1 + 2 = 3; closed = 5; 3 ≥ 5 → **false**.
    - R4: 1 + 2 = 3; closed = 3; 3 ≥ 3 → **TRUE**.
    - R5: 2 + 1 = 3; closed = 4; 3 ≥ 4 → **false**.
    - R6: 2 + 0 = 2; closed = 3; 2 ≥ 3 → **false**.
    - R7: 2 + 1 = 3; closed = 3; 3 ≥ 3 → **TRUE**.
    - **R8: 0 + 0 = 0; closed = 2; 0 ≥ 2 → false.**
    - Two consecutive requires R7 and R8 both true. R8 is false. **Not fired.**
  - **(b)** the total findings count has not strictly decreased, for two consecutive Post-fix rounds. Totals:
    R1 = 9, R2 = 7, R3 = 5, R4 = 5, R5 = 4, R6 = 3, R7 = 3, **R8 = 1**.
    - R2: 7 < 9 → strictly decreased → **false**.
    - R3: 5 < 7 → strictly decreased → **false**.
    - R4: 5 < 5 is false → did not strictly decrease → **TRUE**.
    - R5: 4 < 5 → strictly decreased → **false**.
    - R6: 3 < 4 → strictly decreased → **false**.
    - R7: 3 < 3 is false → did not strictly decrease → **TRUE**.
    - **R8: 1 < 3 → strictly decreased → false.**
    - Two consecutive requires R7 and R8 both true. R8 is false. **Not fired.**
  - **Against the dispatch's stated bar.** Round 8 was required to close strictly more than it introduced
    **and** land at a total of 2 or fewer. Closed 2, introduced 0 (2 > 0 ✓); total 1 (1 ≤ 2 ✓). Both conditions
    of the bar are met.
- **Reading of the arithmetic.** This is the cleanest round of the cycle by every measure the record tracks:
  the largest single-round drop in total findings (3 → 1), the first round with zero new findings, the first
  with zero regressions, and the first in which every closure was verified by re-executing the prior round's
  own falsifying evidence rather than by reading the fix. The one open item is a recurring documentation
  defect worth two lines of text. The pattern that drove seven rounds — controls that were correct in source
  and unproven in test — is, on eight-for-eight mutation evidence, closed. The remaining discipline gap is the
  one round 7 named: an amendment lands in the documents that were reviewed and misses the ones that merely
  mention the count.

---

## Recommended Priority

The tripwire did not fire, so a targeted fix round is the indicated path and foundational rework is not.
There is one finding and it is two one-line text edits.

1. **F8-1, both instances in a single commit.** Correct `workflows/expert-lifecycle.js:61-62` to the
   seven-type wording, matching verbatim the phrasing `66514d0` already committed to
   `docs/arch/architecture-expert-dev-tools.md:232-235` so the two invariant statements read identically.
   Correct `scripts/ledger.schema.json:103` to describe `gate_type` as one of the seven in spec §3.4, dropping
   the now-false "plus control_fault" construction. Neither edit touches executable code, so re-running both
   tiers is confirmation rather than risk.
2. **Optional, and worth the two lines: pin the count so the next amendment cannot leave these behind.** The
   root cause of F8-1 is that a count asserted in prose has no mechanical link to the object it describes. A
   structural check in the shape the tier already uses —
   `(wfSrc.match(/^\s+\w+: '\w+',$/gm) || [])` scoped to the `GATE` literal compared against the count the
   comment states, or more simply a check that the workflow comment and the architecture invariant sentence
   contain the same numeral — converts the next amendment's propagation miss from a review finding into a red
   test. This is a suggestion, not a finding, and it is the only structural work this round would justify.
3. **Do not re-open the two plan-file references or the changelog.** Both are dispositioned in Observations
   with the recorded scoping decision that excludes them. Re-filing them in round 9 would be a finding
   manufactured from a grep hit.

**One note for round 9, given the arithmetic.** Both tripwire conditions are false this round, so the
arming from round 7 is cleared and the tripwire needs two fresh consecutive true rounds to fire. A round 9
that closes F8-1 and introduces nothing reaches zero findings and PASS. Round 8's own process is the reason
to expect that: the fix commits verified themselves against the review's falsifying evidence before
submission — round 7's closing note asked for exactly that — and it is what produced eight-for-eight rather
than a third round of the same wiring gap.

---

Verdict: NEEDS FIXES (1 finding: 1 Moderate)
