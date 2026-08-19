# Independent review — corrections 0.3.0, round 7 (Post-fix)

Artifact: commits `2b1b7d8` → `55562f6` on `claude/edt-corrections-0.3.0`, diffed against `origin/main`.
HEAD at review time: `55562f66821d6799ace57c1fafe9276cf0e5c58c`.
Reviewer: independent (expert-review R1.2). Date: 2026-08-17.
Prior rounds: `corrections-0.3.0-round-01.md` (NEEDS FIXES, 9); `…-round-02.md` (7); `…-round-03.md` (5);
`…-round-04.md` (5); `…-round-05.md` (4); `…-round-06.md` (3).

---

## Scope and Inventory

Round 7 — Post-fix review. Inventory built per Step 2's post-fix rule from all four sources. Every premise
below was re-derived from current source at drafting time; nothing is inherited from a prior record.

**Source 1 — the prior review's full inventory, re-verified:**

- [x] `claude-plugins/expert-dev-tools/workflows/expert-lifecycle.js` — Read at 60-72 (the `GATE` object with
  the new seventh member and its now-stale leading comment), 464-472 (`verifierUnderCovered` /
  `underCoveredVerifierGate`), 681-700 (spot re-run + diff-vs-plan guard sites), 713-742 (ground-truth guard,
  reconciliation guard), 834-852 (doc scope check, the hash escalation). Changed by `55562f6` (19 lines).
  `node --check` → SYNTAX OK.
- [x] `claude-plugins/expert-dev-tools/tests/structural/check-structure.mjs` — Read at 565-580 (`declOf`),
  617-677 (T-22 / T-23 blocks, used as contrast cases), 679-745 (the T-24 block, the new T-24y executed block,
  the two new pins, T-24x). Changed by `55562f6` (15 lines). Executed; mutation-probed fourteen ways.
- [x] `claude-plugins/expert-dev-tools/commands/expert.md` — Read at 172-216 (the gate-type enumeration, now
  seven bullets under a "six gate types" heading, and the second "six gate types" reference at `:212`).
  Changed by `55562f6` (3 lines).
- [x] `claude-plugins/expert-dev-tools/scripts/ledger.schema.json` — Read at 1-60 (top-level required set) and
  95-120 (the `escalations` enum and its description). Changed by `55562f6` (4 lines). Exercised through the
  real validator against five constructed ledgers.
- [x] `claude-plugins/expert-dev-tools/.claude-plugin/plugin.json` — `git show --stat 55562f6`: not among the
  five changed paths; the 0.3.0 bump stands from `2b1b7d8`.
- [x] `claude-plugins/expert-dev-tools/agents/expert-architect.md` — same method: unchanged by `55562f6`.
- [x] `claude-plugins/expert-dev-tools/agents/expert-planner.md` — same method, same result.
- [x] `claude-plugins/expert-dev-tools/agents/expert-spec-writer.md` — same method, same result.
- [x] `claude-plugins/expert-dev-tools/skills/expert-standard/SKILL.md` — same method, same result.
- [x] `claude-plugins/expert-dev-tools/skills/expert-plan/SKILL.md` — same method, same result.
- [x] `claude-plugins/expert-dev-tools/skills/expert-implement/SKILL.md` — same method, same result.
- [x] `claude-plugins/expert-dev-tools/docs/SKILL-CHANGELOG.md` — unchanged by `55562f6`;
  `grep -n "control_fault\|gate type"` → **0 hits**. Grounds part of F7-2.

**Source 2 — fix-diff files (`55562f6`), all five:** `commands/expert.md`, `scripts/ledger.schema.json`,
`tests/structural/check-structure.mjs`, `workflows/expert-lifecycle.js`, and
`docs/reviews/corrections-0.3.0-round-06.md` (the prior record, added to the tree — no claim here rests on it
as a source).

**Source 3 — dependents of the fix-diff files:**

- [x] `claude-plugins/expert-dev-tools/scripts/validate-ledger.mjs` — Read at 1-40 (its supported keyword set,
  which includes `enum`); executed against five constructed ledgers (results below). It is the consumer of the
  changed `ledger.schema.json`.
- [x] `claude-plugins/expert-dev-tools/tests/unit/run-unit-tests.mjs` — executed, 17 `ok`, exit 0. Re-checked
  for whether `55562f6` added a unit test over the new controls: it did not.
- [x] `claude-plugins/expert-dev-tools/docs/specs/spec-expert-dev-tools.md` — Read at 115-145 (§3.4, the
  escalation policy). A governing dependent of the `GATE` change. Grounds F7-2.
- [x] `claude-plugins/expert-dev-tools/docs/arch/architecture-expert-dev-tools.md` — Read at 225-240 (the
  SEGMENT_REPORT protocol's `gate.type` union and the six-gate invariant). Grounds F7-2.
- [x] `claude-plugins/expert-dev-tools/docs/plans/plan-expert-dev-tools-behavioral-remediation.md` — Read at
  1430-1445 ("**Not a new gate type**: the six gate types are fixed by spec 3.4"). Grounds F7-2.

**Source 4 — the prior review's three findings as closure items:** F6-1, F6-2, F6-3 — each re-derived from
current source in the Upstream Contract Verification table, and each probed by execution.

**Supporting:**

- [x] `git status --porcelain claude-plugins/expert-dev-tools` → **empty** before the probes and empty after.
  Every Read is of committed state; every one of the fourteen mutations was restored by file copy-back and the
  clean status is the evidence none persisted.
- [x] The authorizing inputs named in the round-01 record (`defect-history.json`,
  `.claude/expert/ACCEPTANCE-RESULTS-2026-08-17.md`, and the five owner-approved correction drafts under the
  session task directory). **Unpinnable citation**: outside version control, cited by path and date
  2026-08-17. No finding rests on their content.

### Tool plan (Step 3)

| Claim type | Instrument | Used for |
|---|---|---|
| Literal-content | Read at file:line | every diff hunk; the `GATE` object; the two guard helpers; spec §3.4; the architecture SEGMENT_REPORT union; the `expert.md` enumeration |
| Absence | grep with recorded query + count | pins over the new controls in the tier; `control_fault` in the changelog; stale "six" counts across the plugin |
| Behavioral (tests pass; controls refuse) | test-runner execution + fourteen in-place mutation probes with restore; independent re-implementation of `declOf` and direct execution of the lifted predicate over fifteen shapes; the real ledger validator over five constructed ledgers | both tiers; MD/ME re-run; MF, MH–MN, MO, MP; schema compatibility |
| Structural / dataflow | Read of the specific code path, traced against constructed shapes | the four `verifierUnderCovered` consumption sites; the two `control_fault` emission sites |
| Imported from prior documents | re-derivation from current source | all three closure items |
| Comment claims inside the artifact | re-derivation from source | the `GATE` comment at `:61-62`; the `55562f6` commit message's counts (229/17 — both re-executed and confirmed) |

No library-behavior claims arise in this scope, so Context7 is not load-bearing; no instrument class was
unavailable. **Procedural note (honest sequencing):** `metacognitivemonitoring` is specified for review start;
it was invoked at the evaluation stage instead, after probing and before findings were finalized. It did change
the output — it flagged the systemic classification as the weakest claim, and the falsifiability criterion it
named led to the contrast-case checks that reclassified F7-1 from Systemic to Serious. `collaborativereasoning`
was invoked before the gates and succeeded on the second call (the first was rejected for a persona
communication-enum violation — a validation error, not an infrastructure failure). No rigor waivers.

### Execution results

- **Structural tier**: `node tests/structural/check-structure.mjs` → `STRUCTURAL TESTS PASSED`, exit 0,
  **229** `ok` lines. Matches the commit message's "Structural 229/229" (222 + 7 new: five T-24y cases and two
  pins).
- **Unit tier**: `node tests/unit/run-unit-tests.mjs` → `UNIT TESTS PASSED`, exit 0, **17** `ok` lines.
- **Syntax**: `node --check workflows/expert-lifecycle.js` → clean.

### The T-24y lift, verified by independent execution (requested at dispatch)

I re-implemented `declOf` in a scratch script rather than trusting the tier's harness, lifted
`verifierUnderCovered` from current source, and ran it directly.

- The lift returns **754 characters** and `typeof vuc === 'function'`. It is genuine source, not a stub.
- All five tier cases reproduce independently, plus **six adversarial shapes of my own**, all correct:
  `{checks:'abc'}` (non-array) → under-covered; six checks against expected five → not under-covered;
  `expectedMin` of `-5` and of `NaN` both floor to 1 correctly in each direction. Fifteen shapes, fifteen
  correct.
- **The extraction over-captures**, and this is not cosmetic — see F7-3. `verifierUnderCovered` is an
  expression-bodied arrow with no braces, so `declOf`'s brace scan runs past it into the *next* declaration and
  returns both. It works today by adjacency, not by contract.

### Round 6's two surviving mutations, re-run (requested at dispatch)

| # | Mutation | Round 6 | Round 7 |
|---|---|---|---|
| MD | `verifierUnderCovered` neutered to `() => false` | not caught, exit 0 | **caught** — exit 1, four named T-24y FAILs |
| ME | the missing-hash escalation disabled (`if (!hex)` → `if (false)`) | not caught, exit 0 | **caught** — exit 1, `FAIL T-24 scope-check: a missing artifact-sha256 entry escalates` |

Both round-6 gaps are genuinely closed. The tier now goes red on the exact two mutations round 6 demonstrated
walking through it green.

### New mutation probes (twelve run, in place, each restored)

| # | Mutation | Result |
|---|---|---|
| MF | spot re-run expected count `sample.length` → `1` (reverts F6-2's entire substance) | **NOT caught** — exit 0, 229/229 green. Grounds F7-1. |
| MG | drop the `Math.max(1, …)` floor → `(expectedMin \|\| 0)` | **caught** — exit 1, the floor case FAILs |
| MH | `control_fault` → `non_convergence` at the under-coverage gate only | **NOT caught** — exit 0. Grounds F7-1. |
| MI | `control_fault` → `non_convergence` at the hash-escalation gate only | **NOT caught** — exit 0. Grounds F7-1. |
| — | both gate sites flipped simultaneously | **caught** — exit 1. The pin is an "at least one site" pin. |
| MJ | delete `control_fault` from the `GATE` object | **caught** — exit 1 |
| MK | delete the diff-vs-plan guard call site entirely | **NOT caught** — exit 0. Grounds F7-1. |
| ML | delete the reconciliation guard call site entirely | **NOT caught** — exit 0. Grounds F7-1. |
| MM | delete the doc-scope guard call site entirely | **NOT caught** — exit 0. Grounds F7-1. |
| MN | delete the spot re-run guard call site entirely | **NOT caught** — exit 0. Grounds F7-1. |
| MO | ground-truth guard `if (!gt.ok)` → `if (false)` (predicate computed, verdict ignored) | **NOT caught** — exit 0. Grounds F7-1. |
| MP | replace the `groundTruthPreconditions(…)` call with a `{ok:true}` literal | **caught** — exit 1, `FAIL T-24 gt-guard: refusal predicate is the extracted pure function` |

### Ledger schema compatibility, verified end to end (requested at dispatch)

Run through the real `scripts/validate-ledger.mjs` against ledgers constructed to satisfy the schema's ten
required top-level properties:

| Ledger | Result |
|---|---|
| Legacy: `escalations` of `non_convergence` + `intent`, no `control_fault` anywhere | **VALID**, exit 0 — backward compatible |
| Legacy minimal: `escalations: []` | **VALID**, exit 0 |
| New: a single `control_fault` escalation | **VALID**, exit 0 |
| All seven gate types present | **VALID**, exit 0 |
| `bogus_type` | **INVALID**, exit 1 — `$.escalations[0].gate_type: "bogus_type" is not one of [intent, spec_traceable, business, risk_override, non_convergence, core_approval, control_fault]` |

The enum widening is additive: no previously-valid ledger became invalid, the new value is accepted, and the
enum still rejects values outside the set. The schema half of the F6-3 remedy is clean.

---

## Summary

**This review returns NEEDS FIXES.** All three round-6 findings close against their originally named standards,
and two of them close by the strongest available evidence: the exact mutations round 6 demonstrated surviving a
green tier (MD, ME) now turn it red, and `verifierUnderCovered` is correct on all fifteen shapes I could
construct, including six the tier does not cover. The schema widening is genuinely additive, verified by
running the real validator over five ledgers rather than by reading the diff. What blocks the verdict is that
the cycle's recurring standard has moved one level out rather than been satisfied. For five rounds the finding
has been "the control is present but never demonstrated to refuse"; this round the *predicate* is executed and
correct, and the *wiring* is unpinned — all four `verifierUnderCovered` call sites delete individually with the
229-check tier fully green, the `sample.length` argument that is the whole substance of F6-2 reverts to `1`
green, the ground-truth guard's refusal branch neuters to `if (false)` green, and either `control_fault` site
flips back to `non_convergence` green. A control whose verdict can be disconnected from the code path it gates
is, from the tier's perspective, not deployed. This is not systemic — I checked, and the same tier does it
correctly at T-23:672-675 with occurrence-count pins, which is also the cheapest correct fix. Separately, and
more consequentially for routing: closing F6-3 by adding a seventh gate type was round 6's own recommendation,
but taking it obligated an amendment to a spec that calls its escalation list exhaustive and to an architecture
that states the six types *are* exactly that list — and the branch touches no spec or architecture file at all,
leaving `commands/expert.md` announcing "The six gate types" directly above seven bullets. Trajectory is
9 → 7 → 5 → 5 → 4 → 3 → 3. Neither tripwire condition holds for two consecutive rounds, so it has not fired —
but both conditions turn true in round 7 for the first time since round 4, which arms it: one more round with
either condition true fires it. The arithmetic is shown in full below.

---

## Upstream Contract Verification

The upstream contracts are the five owner-approved correction drafts, the round-6 review findings as the
remediation contract for `55562f6`, and — newly load-bearing this round — `docs/specs/spec-expert-dev-tools.md`
§3.4 and `docs/arch/architecture-expert-dev-tools.md`'s SEGMENT_REPORT protocol. Each round-6 finding is
checked against the standard originally named for it.

| Prior finding | Originally named standard | Status | Verification method |
|---|---|---|---|
| **F6-1** (three of four controls added by `8141ac5` ship with no test that demonstrates they refuse; MD and ME each leave the tier green) | a new control is delivered with the test that demonstrates it refuses | **CLOSED** | Re-executed both mutations round 6 used as its evidence. **MD** (`verifierUnderCovered` → `() => false`): tier exit **1**, four named T-24y FAILs. **ME** (`if (!hex)` → `if (false)`): tier exit **1**, `FAIL T-24 scope-check: a missing artifact-sha256 entry escalates`. Read of `tests/structural/check-structure.mjs:703-716` confirms the mechanism: a T-24y block that lifts the predicate via `declOf` and executes five cases, plus a regex pin on the escalation branch. Verified by **independent execution**, not by reading the block — I re-implemented `declOf`, lifted 754 chars of real source, and ran fifteen shapes including six adversarial ones of my own (non-array `checks`, over-count, negative and `NaN` `expectedMin`); all fifteen correct. The `minItems` third control is covered transitively by the same predicate's empty case. The standard recurs at the controls' *deployment* — see F7-1 — but at the location F6-1 named, it is met. |
| **F6-2** (the empty-enumeration guard was implemented; the short-enumeration case its own correct form named was not) | a verification control must distinguish "checked and found nothing wrong" from "did not check"; the correct form named treating an **empty or short** enumeration as a control failure, via a `checked` count the caller compares against what it asked for | **CLOSED** | Read `workflows/expert-lifecycle.js:467`: `verifierUnderCovered = (v, expectedMin) => !v \|\| !Array.isArray(v.checks) \|\| v.checks.length < Math.max(1, expectedMin \|\| 1)` — one shared helper carrying both cases, which is the generalization the finding named as the better option (`verifierUnderCovered(v, expected)`), so the two cannot drift. Read of `:684` confirms the spot re-run passes its mechanically-known count: `verifierUnderCovered(vr, sample.length)`, with `sample` built at `:683` from `idx`. `grep -n "verifierUnderCovered"` → **5 hits**: the definition plus **all four** consumption sites (`:684` spot re-run at `sample.length`; `:695` diff-vs-plan, `:736` reconciliation, `:837` doc-scope, each at `1`). The floor at `Math.max(1, …)` means `0`/`undefined` can never exempt — executed and confirmed, and mutation **MG** turns the tier red when the floor is dropped. The four sites left at `1` are correct: none has a mechanically known expected count. |
| **F6-3** (the two new owner gates are typed `non_convergence`, which the command contract defines as "a review loop hit its round cap") | interface-contract conformance for an enumerated type: a producer must emit an enumeration member only for the condition the published contract assigns to it | **CLOSED** | Read `workflows/expert-lifecycle.js:70` (`control_fault: 'control_fault'` added to `GATE`), `:471` and `:851` (both emission sites now `type: GATE.control_fault`), and `commands/expert.md:189-191` (the matching bullet: "a mechanical control (a verifier dispatch) could not run or returned less than it was asked to check; the phase is **unverified**, not failed"). `grep -n "GATE.non_convergence"` → **4 hits**, all pre-existing round-cap or convergence events; neither new gate is among them. The producer and the published command contract now agree, which is the standard F6-3 named. Schema half verified by **executing the real validator** over five constructed ledgers (table above): additive, backward compatible, still rejects unknown values. The *manner* of closure introduces a new violation against the spec and architecture — filed separately as F7-2 — but at the standard F6-3 named, this is closure. |

**Acceptance criteria / architecture decisions governing this scope.** Spec §3.4 ("Owner escalation policy
(exhaustive list)") and the architecture's SEGMENT_REPORT protocol are the governing upstream artifacts for the
`GATE` change. Both are checked in F7-2 and both are **violated**. No other spec acceptance criterion is in
scope for a corrections branch that changes no functional requirement.

---

## Critical & Serious Findings

### F7-1 — The 0.3.0 controls are pinned at their definition but not at their deployment: the tier stays fully green when a control's verdict is disconnected from the code path it gates
**Location:** `claude-plugins/expert-dev-tools/tests/structural/check-structure.mjs:679-745`
**Severity:** Serious
**Provenance:** new — no prior round reported the wiring. The *standard* is the one raised at the controls'
definitions in rounds 3 (F3-5), 4 (F4-4), 5 (F5-3) and 6 (F6-1); every one of those instances is now closed,
and the same standard is unmet one level out.

**What the code does now.** The tier executes `verifierUnderCovered` (T-24y, five cases) and
`groundTruthPreconditions` (T-24x, five cases), and pins the existence of `GATE.control_fault` and of the
missing-hash escalation branch. Nothing asserts that either predicate is *called at every site it must guard*,
that the spot re-run passes its mechanically-known expected count, that the ground-truth guard acts on the
verdict it computes, or that *each* gate site uses the right type.

**How that claim was verified.** `grep -n "verifierUnderCovered\|underCoveredVerifierGate\|control_fault\|sample.length"
tests/structural/check-structure.mjs` → **4 hits**, all inside the T-24y lift or the two existence pins; no
occurrence-count assertion and no `sample.length` reference anywhere in the tier. Confirmed behaviorally by six
in-place mutation probes, each restored, `git status` clean afterward:

- **MK / ML / MM / MN**: each of the four `verifierUnderCovered` call sites deleted **individually** —
  `:695` diff-vs-plan, `:736` reconciliation, `:837` doc-scope, `:684` spot re-run. Every one: **exit 0,
  229/229 green.** Round 5's F5-2 was a five-site systemic finding; its remedy can be removed one site at a
  time without the tier noticing.
- **MF**: `verifierUnderCovered(vr, sample.length)` → `verifierUnderCovered(vr, 1)`. **Exit 0, green.** This is
  100% of F6-2's substance — the control silently reverts to the emptiness-only test the finding was raised to
  replace.
- **MH / MI**: either single `type: GATE.control_fault` flipped back to `GATE.non_convergence`. **Exit 0,
  green** in each case; only flipping *both* fails, because the pin at `:715-716` is
  `wfSrc.includes('type: GATE.control_fault')` — satisfied by any one surviving occurrence. F6-3's defect was
  precisely a per-site type mismatch, so the guard does not pin the property the finding was about.
- **MO**: the ground-truth guard's `if (!gt.ok)` → `if (false)`. **Exit 0, green.** T-24x proves the predicate
  computes the right verdict and MP proves the call exists, but nothing proves the verdict is acted on.

**Standard violated.** "A new control is delivered with the test that demonstrates it refuses" — the standard
named in F3-5, F4-4, F5-3 and F6-1. A control refuses only as deployed; a correct predicate whose result is
discarded, or whose call site is absent, refuses nothing. The project's `REPLACED_BY_STRENGTHENING` machinery
and T-20 deletion guard exist to stop controls from quietly disappearing, and both are defeated here for the
same reason round 6 gave: there is no assertion to delete.

**Why this is not Systemic.** I tested it against the bar and it fails. The proactive scan below shows the same
tier pinning deployment correctly elsewhere: `T-23 both caller sites route non-PASS through the shared
escalation builder` at `:672-675` asserts `(wfSrc.match(/await gateEscalation\(/g) || []).length === 2` — an
occurrence-count pin over multiple sites — and `T-22 detectors are disabled at the implementation gate` at
`:650-653` drives the gate and asserts the resulting verdict. The gap is confined to the T-24 block's 0.3.0
controls, not propagating across the codebase.

**Why it matters.** Every mutation above restores a defect a prior round classified as Serious, with a fully
green tier. MK–MN reopen the five-site F5-2 pattern; MF reopens F6-2; MH/MI reopen F6-3; MO reopens the
ground-truth guard F5-3 spent three rounds establishing. The cycle's entire accumulated remedy set is, today,
removable without a single test failing.

**Correct implementation.** Use the mechanism the same file already demonstrates at `:672-675` — occurrence
counts, not existence:

- `(wfSrc.match(/verifierUnderCovered\(/g) || []).length === 5` (one definition + four sites), and
  `(wfSrc.match(/type: GATE\.control_fault/g) || []).length === 2`. Both are one line and pin the count the
  findings were about.
- `wfSrc.includes('verifierUnderCovered(vr, sample.length)')` for the spot re-run's expected-count wiring —
  the one argument that distinguishes F6-2's remedy from what preceded it.
- `wfSrc.includes('if (!gt.ok) {')` for the ground-truth refusal branch, matching the shape of the `if (!hex)`
  pin `55562f6` already added at `:713-714`.

### F7-2 — `control_fault` was added as a seventh owner-gate type against an upstream spec that declares the escalation list exhaustive, with no amendment to the spec or architecture and stale "six" counts left in the file the commit edited
**Location:** `claude-plugins/expert-dev-tools/workflows/expert-lifecycle.js:61-71`
**Severity:** Serious
**Provenance:** regression — introduced by `55562f6`. Before this commit the workflow's `GATE` set matched spec
§3.4 exactly and the architecture's six-gate invariant held; both are now false.

**What the code does now.** `GATE` carries seven members. Two code paths emit `type: GATE.control_fault` in a
SEGMENT_REPORT that reaches the owner. `ledger.schema.json` and `commands/expert.md`'s bullet list were updated
to match. The spec, the architecture, the changelog, and three surviving count statements were not.

**How that claim was verified.** Read at drafting time of each site:

- `docs/specs/spec-expert-dev-tools.md:119-136` — heading: "### 3.4 Owner escalation policy (**exhaustive
  list**)", body: "The owner is interrupted for **exactly these, and nothing else**:", followed by six numbered
  items. `control_fault` is not among them.
- `docs/arch/architecture-expert-dev-tools.md:226-233` — the SEGMENT_REPORT protocol types `gate.type` as the
  union `intent | spec_traceable | business | risk_override | non_convergence | core_approval`, then states
  "The six gate types are exactly the spec §3.4 escalation list; the script has no other path to the owner." A
  report carrying `control_fault` is outside the documented union, and the invariant sentence is now false.
- `git diff --stat origin/main...HEAD -- docs/specs docs/arch` → **empty**. Neither file is touched by any
  commit on the branch, so no amendment was recorded anywhere.
- `docs/SKILL-CHANGELOG.md` — `grep -n "control_fault\|gate type"` → **0 hits**.
- `docs/plans/plan-expert-dev-tools-behavioral-remediation.md:1439` — an explicit prior directive: "**Not a new
  gate type**: the six gate types are fixed by spec 3.4, and `feedback_escalation` already rides alongside them
  rather than being one."
- `commands/expert.md:180` — "The six gate types and what each asks:" immediately followed by **seven**
  bullets, in the region this commit edited. `commands/expert.md:212` — "(it is not one of the six gate
  types)". `workflows/expert-lifecycle.js:61-62` — "The six owner-gate types — exactly the spec 3.4 escalation
  list", directly above a seven-member object.
- `grep -rn "six gate\|the six in spec"` across the plugin → **8 hits**; the `ledger.schema.json:103`
  description was deliberately reworded to "one of the six in spec 3.4, plus control_fault", which shows the
  count problem was noticed in one place and not propagated to the others.

**Standard violated.** Upstream-contract conformance, plus documentation-code consistency as it applies to a
published enumerated contract. A spec that declares its list exhaustive is a constraint on the implementation,
not a summary of it; an implementation that exceeds it either amends it or violates it, and there is no third
state. This is not a matter of whether the seventh type is a *good idea* — round 6 recommended it and the
semantics are sound — it is that taking that path obligated the amendment, and the branch performs none of it.
The self-contradiction at `expert.md:180` is the acute form: the orchestrator's own contract announces a count
its own list refutes, in the region the commit touched.

**Why it matters.** The architecture's union is what a consumer parses against, and `commands/expert.md` is
what the orchestrating agent reads to decide how to present a gate. Round 6 filed F6-3 precisely because a
producer emitting a type the contract does not assign misleads the consumer — closing it by adding a type that
*two governing documents* do not carry relocates the same defect upstream rather than removing it. Note also
that round 6 offered the fallback explicitly: "If adding a member is out of scope for this branch,
`GATE.spec_traceable` … should be taken with a one-line note recording why." Neither the amendment nor the
note exists.

**Correct implementation.** Either path closes it; both require the propagation:

1. **Amend and propagate** (preferred, and consistent with the semantics `55562f6` chose). Add `control_fault`
   as item 7 in spec §3.4 with its "the phase is unverified, not failed" framing; extend the architecture's
   `gate.type` union at `:227-229` and correct the invariant sentence at `:232-233`; correct
   `commands/expert.md:180` to "seven gate types" and `:212` likewise; correct the
   `workflows/expert-lifecycle.js:61-62` comment; add a `SKILL-CHANGELOG.md` entry recording the contract
   change. The `plan-…-behavioral-remediation.md:1439` directive should carry a note that it was superseded
   here, since it states the set is fixed.
2. **Fall back** to `GATE.spec_traceable` at `:471` and `:851`, revert the `expert.md` bullet and the schema
   enum, and record the reason — round 6's stated alternative if amending §3.4 is out of scope for this branch.

Because option 1 changes an owner-approved spec, the choice between them is an owner decision, not one the
implementer should make unilaterally.

---

## Systemic Patterns

**No systemic patterns.** F7-1 was tested against the systemic bar and does not meet it, and the round-5
systemic finding (F5-2) is fully closed at the predicate level.

Proactive scans run, with queries and result counts:

- `grep -n "verifierUnderCovered" workflows/expert-lifecycle.js` → **5 hits**: definition at `:467`, sites at
  `:684`, `:695`, `:736`, `:837`. All four consumption sites are guarded — the round-5 five-site pattern is not
  partially fixed across sites in the source.
- `grep -n "\.checks" workflows/expert-lifecycle.js` → every consuming occurrence is downstream of a guard;
  none reads a verifier return before its under-coverage test.
- `grep -n "GATE.non_convergence" workflows/expert-lifecycle.js` → **4 hits** (`:732`, `:787`, `:793`, `:798`),
  all genuine round-cap or convergence events; the two 0.3.0 control gates no longer among them.
- `grep -n "declOf(wfSrc" tests/structural/check-structure.mjs` → **5 hits** (`:589`, `:590`, `:591`, `:706`,
  `:722`). I probed the deployment coverage of the two that guard 0.3.0 controls (`:706`, `:722`) and the
  contrast blocks at `:617-677`. The T-22 and T-23 blocks **do** pin deployment (`:650-653` drives the gate and
  asserts the verdict; `:672-675` asserts `await gateEscalation(` occurs exactly twice), which is what
  disproves propagation. F7-1's enumeration is therefore 6 unpinned deployment properties confined to the T-24
  block, against 2 correctly pinned in the same file.
- `grep -rn "six gate\|the six in spec" --include=*.md --include=*.js --include=*.mjs --include=*.json .` →
  **8 hits**; the 3 that are now false are enumerated in F7-2, the rest are prior review records and the
  deliberately-reworded schema description.

---

## Moderate & Minor Findings

No Moderate findings — every candidate at that severity resolved to either a Serious finding above or a
non-finding observation below, verified by the probes recorded in Scope and Inventory.

### F7-3 — T-24y's extraction over-captures because `declOf` is applied to an expression-bodied arrow, so the guard's correctness depends on an adjacent declaration it does not test
**Location:** `claude-plugins/expert-dev-tools/tests/structural/check-structure.mjs:705-712`
**Severity:** Minor
**Provenance:** new — introduced by `55562f6`.

**What the code does now.** `declOf(wfSrc, 'const verifierUnderCovered =')` is documented (Read at `:565-580`,
comment at `:567-569`) to skip a parameter list and then return the source slice between the first `{` and its
matching close — a brace-bodied-declaration extractor. `verifierUnderCovered` is an expression-bodied arrow
with no braces at all, so the scan runs past it and pairs braces belonging to the *next* declaration,
`underCoveredVerifierGate`. The returned slice contains both.

**How that claim was verified.** Independent re-implementation of `declOf` and printing of its output: **754
characters** spanning both declarations, the second one complete through its closing `}`. Demonstrated to
matter by an in-place probe, restored: inserting an unrelated module-scope declaration that evaluates at
definition time between the two — `const SOME_TABLE = { k: LENSES.map((x) => x) }` — makes the tier exit **1**
with `ReferenceError: LENSES is not defined`, because the over-captured slice is evaluated inside
`new Function` where the workflow's module scope does not exist. A benign brace-less insertion
(`const unrelatedHelper = (n) => n > 0`) passes, confirming the failure is specifically over-capture and not the
insertion itself.

**Standard (first-principles articulation — no published standard names this).** *The goal:* T-24y exists to
make `verifierUnderCovered`'s logic tamper-evident, so it must fail if and only if that predicate changes.
*The shortcut:* it extracts by scanning forward for braces the predicate does not have, relying on whatever
declaration happens to follow to terminate the slice. *Why the shortcut fails the goal:* the guard's pass/fail
now depends on a neighbor it makes no claim about — an edit that never touches the predicate can turn the guard
red (demonstrated above), and conversely a future reorder could silently change what the guard executes. A
regression guard that reports on code outside its subject is a false-signal source, which is the failure mode
guards exist to eliminate.

The related quirk in the same line — `'const Math_ = Math;' + …replace('Math.max', 'Math_.max')` — is inert
(`Math` is a global and reachable inside `new Function` unaliased) and is noted only because it suggests the
over-capture was worked around empirically rather than diagnosed.

**Correct implementation.** Either give the extractor the shape it documents, or give the predicate a body:

- Preferred, one character of production code: make `verifierUnderCovered` brace-bodied —
  `const verifierUnderCovered = (v, expectedMin) => { return !v || … }` — after which `declOf` extracts exactly
  it, and the `Math_` aliasing can be dropped.
- Or add an expression-body branch to `declOf`: when no `{` appears before the next newline following the
  parameter list, return the slice to end-of-line. That fixes it for every future expression-bodied lift, of
  which this is the first.

---

## Tentative Findings

No tentative findings — every candidate finding's premise was verified per Compliance Gate B. Two caveats are
recorded rather than deferred, and no finding's premise depends on either. First, the authorizing inputs named
in the round-01 record are session outputs outside version control, cited by path and date (2026-08-17) with
their unpinnable status stated per the Step 6 rule. Second, F7-2's consequence includes one link that cannot be
executed here — how an orchestrating agent actually renders a gate whose type is absent from the architecture's
documented union. The finding does not rest on that behavior: its premise is that the emitted value is outside
the union the architecture publishes and outside the list the spec declares exhaustive, which are
literal-content claims verified by Read of both documents and by a `git diff --stat` establishing neither was
amended.

---

## Observations

- **The mutation-survival method has now been applied to this cycle's own remedies twice, and it worked both
  times.** Round 6 introduced MD/ME; this round re-ran them (both red) and extended the method to the wiring,
  which is where the six surviving mutations were found. Recorded as context because no standard is violated by
  the method itself — it is the reason F7-1 is a verified finding rather than a suspicion.
- **The `Math.max(1, expectedMin || 1)` floor is a genuinely careful piece of design and is pinned.** It means
  a caller passing `0`, `undefined`, `NaN` or a negative can never produce an exemption — verified by executing
  the lifted predicate across all four of those, and mutation MG turns the tier red when the floor is removed.
  No standard violation; recorded because it is the part of the F6-2 remedy most likely to be dropped in a
  later refactor.
- **`underCoveredVerifierGate`'s message includes both the actual and expected counts** (Read at `:468-471`:
  "returned ${got} check(s) where at least ${expected} were expected"), so the owner sees the shortfall
  numerically rather than a bare failure. No standard violation; recorded as the part of the F6-2 remedy that
  makes the gate actionable.
- **The ledger schema's `escalations` description was reworded rather than left stale** — "one of the six in
  spec 3.4, plus control_fault (0.3.0: …)". This is accurate as written and is the only one of the four count
  statements in the plugin that survived the change correctly. No standard violation; recorded because it shows
  the count issue was seen in one place, which is what makes the three misses in F7-2 a propagation failure
  rather than an oversight of the concept.

---

## What's Actually Good

- **F6-1 is closed by the strongest evidence available, and the closure survives adversarial testing the tier
  does not perform.** Good by the standard four consecutive rounds named — a new control is delivered with the
  test that demonstrates it refuses — and verified without trusting the tier's own harness: I re-implemented
  `declOf`, lifted 754 characters of genuine source, and executed fifteen shapes. Six were adversarial shapes
  of my own the tier does not cover (`{checks:'abc'}`, over-count, `expectedMin` of `-5` and of `NaN` in both
  directions); the predicate was correct on all six. Mutation MD, which round 6 documented walking through a
  green tier, now produces four named FAILs and exit 1.
- **F6-2 was closed by generalizing the predicate rather than by adding a second one.** The finding offered two
  forms — an inline comparison at the spot re-run site, or "better, generalize the shared helper to
  `verifierUnderCovered(v, expected)` so the one predicate carries both the empty and short cases." The commit
  took the better one. Good by DRY as it applies to control predicates: `grep` confirms one definition serving
  four sites, so the empty and short cases cannot drift apart, and the site with a mechanically known count
  (`sample.length`, Read at `:683-684`) is the only one that passes anything other than the floor. That the
  wiring is unpinned (F7-1) is a test-coverage shortfall and does not diminish that the source change is the
  right shape.
- **The schema widening is additive and was verifiable end to end, because the project ships its own
  validator.** Good by the backward-compatibility rule for enumerated contract extensions: adding a member must
  not invalidate existing documents. Verified by execution rather than inspection — five constructed ledgers
  through `scripts/validate-ledger.mjs`, with legacy, empty, new-value and all-seven cases all VALID at exit 0
  and `bogus_type` INVALID at exit 1 naming the full enum. The `additionalProperties: false` discipline
  elsewhere in the schema means this is a real guarantee, not an accident.

---

## Convergence Record

- **Round number:** 7 (sixth Post-fix round).
- **Trajectory:** R1: 9 (1 Serious-Systemic, 4 Serious, 3 Moderate, 1 Minor) → R2: 7 (1 Serious-Systemic,
  3 Serious, 3 Moderate) → R3: 5 (2 Serious, 2 Moderate, 1 Minor) → R4: 5 (1 Serious-Systemic, 2 Serious,
  2 Moderate) → R5: 4 (1 Serious-Systemic, 1 Serious, 2 Moderate) → R6: 3 (1 Serious, 2 Moderate) →
  **R7: 3 (2 Serious, 1 Minor)**.
- **Flow counts for this round:**
  - Prior findings **closed**: **3** — F6-1, F6-2, F6-3; each verified against its originally named standard in
    the Upstream Contract Verification table, by Read of current source plus executed probes (the MD/ME re-run,
    MG, the fifteen-shape predicate run, and the five-ledger validator run).
  - **New**: **2** — F7-1 (the controls' deployment is unpinned; no prior round examined the wiring) and F7-3
    (the `declOf` over-capture, introduced with the T-24y block).
  - **Regressions**: **1** — F7-2. Unlike round 6's two new findings, this one destroyed a prior-correct state:
    before `55562f6` the workflow's `GATE` set matched spec §3.4 exactly and the architecture's six-gate
    invariant held. Both are now false, so it is a regression rather than a new finding.
  - **Recurring**: **0** — no finding this round is the same standard at the same location as a prior-round
    finding. F7-1 shares a standard with F6-1 but at a different location (deployment, not definition), which
    Step 9 classifies as new.
  - Reconciliation: 3 prior − 3 closed = 0 carried; 0 + 2 new + 1 regression = **3**.
- **Tripwire evaluation — NOT FIRED, but both conditions are now armed.** Arithmetic shown for both conditions
  across every Post-fix round:
  - **(a)** new + regression ≥ closed, for two consecutive Post-fix rounds.
    - R2: 2 + 1 = 3; closed = 6; 3 ≥ 6 → **false**.
    - R3: 1 + 2 = 3; closed = 5; 3 ≥ 5 → **false**.
    - R4: 1 + 2 = 3; closed = 3; 3 ≥ 3 → **TRUE**.
    - R5: 2 + 1 = 3; closed = 4; 3 ≥ 4 → **false**.
    - R6: 2 + 0 = 2; closed = 3; 2 ≥ 3 → **false**.
    - R7: 2 + 1 = 3; closed = 3; 3 ≥ 3 → **TRUE**.
    - Two consecutive requires R6 and R7 both true. R6 is false. **Not fired.**
  - **(b)** the total findings count has not strictly decreased, for two consecutive Post-fix rounds. Totals:
    R1 = 9, R2 = 7, R3 = 5, R4 = 5, R5 = 4, R6 = 3, R7 = 3.
    - R2: 7 < 9 → strictly decreased → **false**.
    - R3: 5 < 7 → strictly decreased → **false**.
    - R4: 5 < 5 is false → did not strictly decrease → **TRUE**.
    - R5: 4 < 5 → strictly decreased → **false**.
    - R6: 3 < 4 → strictly decreased → **false**.
    - R7: 3 < 3 is false → did not strictly decrease → **TRUE**.
    - Two consecutive requires R6 and R7 both true. R6 is false. **Not fired.**
- **Reading of the arithmetic.** The tripwire has not fired and the mechanical verdict does not change. But
  round 7 is the first round since round 4 in which *both* conditions hold, and unlike round 4 — which was
  broken immediately by round 5 on both counts — round 7 follows a round that closed three findings and still
  produced three. **If round 8 satisfies either condition, the tripwire fires.** Concretely: round 8 fires
  condition (a) unless it closes strictly more findings than it introduces, and fires condition (b) unless its
  total is 2 or fewer. The composition is genuinely better than the count suggests — closures are 3 of 3
  against originally named standards, recurring findings are zero for the first time in the cycle, and the
  headline remedy is correct in source and merely unpinned in test. Against that, one of the three findings is
  a regression that a prior round explicitly warned about the shape of, and the total has stopped falling. The
  honest summary is that the source work is converging and the surrounding contract and test discipline is not
  keeping pace with it.

---

## Recommended Priority

The tripwire did not fire, so foundational rework is not the indicated path and a targeted fix round is. Two of
the three findings are small and mechanical; the third is an owner decision. Sequence them by what each costs
when it is wrong, and note that F7-2 should be raised with the owner before code is written.

1. **F7-2 first, because it needs a decision, not a patch.** It is the only regression, it is the only finding
   that touches an owner-approved spec, and the two correct forms lead to different code. Put the choice to the
   owner: amend spec §3.4 and the architecture to carry `control_fault` as a seventh escalation (preferred — it
   matches the semantics `55562f6` already implemented, and the schema and command-contract halves are already
   done and verified correct), or fall back to `GATE.spec_traceable` at `:471` and `:851` and revert the enum
   and bullet. Whichever is chosen, the three stale count statements —
   `commands/expert.md:180`, `commands/expert.md:212`, `workflows/expert-lifecycle.js:61-62` — and the
   `SKILL-CHANGELOG.md` entry must land in the same commit. The self-contradiction at `expert.md:180` ("The six
   gate types" heading seven bullets) is in the orchestrator's own contract and should not survive another
   round regardless of which path is taken.
2. **F7-1 second, and it is the highest-value line-for-line change in the round.** Six mutations that each
   restore a previously-filed Serious defect currently pass a 229-check tier. The fix is roughly five
   assertions using the occurrence-count pattern this same file already uses at `:672-675` — two count pins
   (`verifierUnderCovered(` exactly 5, `type: GATE.control_fault` exactly 2), plus source pins for
   `verifierUnderCovered(vr, sample.length)` and `if (!gt.ok) {`. Doing this alongside F7-2 matters: whichever
   gate type the owner chooses, the count pin should be written against the final choice so the decision is
   itself protected.
3. **F7-3 last.** It is a Minor guard-hygiene item with no effect on the workflow's behavior, and the preferred
   fix is one pair of braces around `verifierUnderCovered`'s body plus deleting the now-unnecessary `Math_`
   aliasing. Worth doing in the same commit as F7-1 since both edit the T-24y block, but it blocks nothing.

**One note for round 8, given the arithmetic.** Both tripwire conditions are true this round. A round 8 that
closes all three findings and introduces none clears both and returns the cycle to convergence; a round 8 that
introduces even one finding while closing three satisfies condition (a) a second consecutive time and fires the
tripwire, which routes to foundational rework rather than another fix round. The practical implication is that
round 8 should verify its own work by mutation before submitting — the method this cycle has now used
successfully twice — rather than relying on the review to find the wiring gap a third time.

---

Verdict: NEEDS FIXES (3 findings: 2 Serious, 1 Minor)
