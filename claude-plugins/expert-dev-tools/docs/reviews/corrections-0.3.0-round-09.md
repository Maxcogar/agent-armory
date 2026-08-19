# Independent review — corrections 0.3.0, round 9 (Post-fix)

Artifact: commits `2b1b7d8` → `5b6ea91` on `claude/edt-corrections-0.3.0`, diffed against `origin/main`.
HEAD at review time: `5b6ea9149a46ce94fffc8660d7556cb9700f6edd`.
Reviewer: independent (expert-review R1.2). Date: 2026-08-19.
Prior rounds: `corrections-0.3.0-round-01.md` (NEEDS FIXES, 9); `…-round-02.md` (7); `…-round-03.md` (5);
`…-round-04.md` (5); `…-round-05.md` (4); `…-round-06.md` (3); `…-round-07.md` (3); `…-round-08.md` (1).

---

## Scope and Inventory

Round 9 — Post-fix review. Inventory built per Step 2's post-fix rule from all four sources. Every premise
below was re-derived from current source at drafting time; nothing is inherited from a prior record.

**Source 1 — the prior review's full inventory, re-verified:**

- [x] `claude-plugins/expert-dev-tools/workflows/expert-lifecycle.js` — Read at 54-81 (the `GATE` object and
  its leading comment). The comment at `:61-63` now reads "The seven owner-gate types — exactly the spec 3.4
  escalation list (amended 2026-08-19, owner decision F7-2: control_fault added)". Member extraction via
  `node -e` over the literal → **7** members: `intent, spec_traceable, business, risk_override,
  non_convergence, core_approval, control_fault`. `node --check` → SYNTAX OK. Grounds the F8-1 closure.
- [x] `claude-plugins/expert-dev-tools/scripts/ledger.schema.json` — Read at 98-109. The `escalations`
  description now reads "gate_type is one of the **seven** in spec 3.4 (control_fault added by the 2026-08-19
  amendment …)"; the "plus control_fault" construction is gone. Parsed with `JSON.parse` → valid. The
  `gate_type` enum read from the parsed object → **7** values, `control_fault` present. Grounds the F8-1
  closure's second instance.
- [x] `claude-plugins/expert-dev-tools/tests/structural/check-structure.mjs` — Read at 96-125 (the `braced`
  and `topKeys` helpers), 700-745 (the T-24y extraction, the five F7-1 deployment checks, and the new
  gate-count block at `:733-743`). Executed; mutation-probed eleven ways in an isolated worktree. Grounds F9-1.
- [x] `claude-plugins/expert-dev-tools/commands/expert.md` — `grep -n "seven gate\|six gate\|gate types"` →
  **2 hits**, `:180` and `:212`, both reading "seven". Bullet count under the heading
  (`awk 'NR>=178 && NR<=200' | grep -c "^  - "`) → **7**. Unchanged by `5b6ea91`.
- [x] `claude-plugins/expert-dev-tools/docs/specs/spec-expert-dev-tools.md` — Read at 115-148. §3.4 retains the
  "(exhaustive list)" heading and "exactly these, and nothing else", and carries **seven** numbered items with
  item 7 (`Control faults`) under an amendment note naming the date, the owner decision, F7-2, the evidence
  class, and the review records. Unchanged by `5b6ea91`.
- [x] `claude-plugins/expert-dev-tools/docs/arch/architecture-expert-dev-tools.md` — `grep -n` at 229-234: the
  SEGMENT_REPORT `gate.type` union carries `control_fault`, and the invariant reads "The seven gate types are
  …". Unchanged by `5b6ea91`.
- [x] `claude-plugins/expert-dev-tools/docs/SESSION-STATE-corrections-0.3.0.md` — Read at 22-43. The
  authorizing work-order for `66514d0`; its three "six" mentions (`:26`, `:27`, `:33`) are quotations of the
  pre-amendment state inside an instruction to change it, correct as written. Unchanged by `5b6ea91`.
- [x] `claude-plugins/expert-dev-tools/docs/SKILL-CHANGELOG.md` — `git diff --stat 66514d0..5b6ea91` over the
  plugin shows four changed files, none of them this one, and none under `skills/`. No entry is owed; the
  changelog's scope is `skills/` and nothing else.
- [x] `claude-plugins/expert-dev-tools/.claude-plugin/plugin.json` — `git diff --stat 66514d0..5b6ea91 --
  .claude-plugin/` → **0 lines**; unchanged. The 0.3.0 bump stands from `2b1b7d8`.
- [x] `claude-plugins/expert-dev-tools/agents/expert-architect.md` — `git diff --stat 66514d0..5b6ea91 --
  agents/` → **0 lines**; unchanged.
- [x] `claude-plugins/expert-dev-tools/agents/expert-planner.md` — same method, same result.
- [x] `claude-plugins/expert-dev-tools/agents/expert-spec-writer.md` — same method, same result.
- [x] `claude-plugins/expert-dev-tools/skills/expert-standard/SKILL.md` — `git diff --stat` over `skills/` →
  **0 lines**; unchanged.
- [x] `claude-plugins/expert-dev-tools/skills/expert-plan/SKILL.md` — same method, same result.
- [x] `claude-plugins/expert-dev-tools/skills/expert-implement/SKILL.md` — same method, same result.

**Source 2 — fix-diff files (`66514d0..5b6ea91`), all four:** `docs/reviews/corrections-0.3.0-round-08.md`
(the prior record, added to the tree — no claim here rests on it as a source), `scripts/ledger.schema.json`,
`tests/structural/check-structure.mjs`, `workflows/expert-lifecycle.js`.

**Source 3 — dependents of the fix-diff files:**

- [x] `claude-plugins/expert-dev-tools/scripts/validate-ledger.mjs` — executed. It loaded the amended schema
  and proceeded to reading its input argument (erroring only on the deliberately absent input file), which
  demonstrates the schema still parses and loads as a validator. The change was to a `description` string
  only; the `gate_type` enum is unchanged and was read directly.
- [x] `claude-plugins/expert-dev-tools/tests/unit/run-unit-tests.mjs` — executed: **17** `ok`, exit 0.
- [x] `claude-plugins/expert-dev-tools/docs/plans/plan-expert-dev-tools-behavioral-remediation.md:1439` and
  `claude-plugins/expert-dev-tools/docs/plans/plan-expert-dev-tools.md:48` — both still carry six-gate framing.
  Grandfathered by the explicit owner scoping decision recorded at
  `docs/SESSION-STATE-corrections-0.3.0.md:34-36` (Read). Excluded from findings; see Observations.

**Source 4 — the prior review's single finding as a closure item:** F8-1 — re-derived from current source in
the Upstream Contract Verification table, and probed by execution.

**Supporting:**

- [x] `git status --porcelain claude-plugins/expert-dev-tools` → **empty**, before and after all probing. Every
  Read is of committed state. **All eleven mutations were run in a detached `git worktree` at `5b6ea91`
  (`C:/Users/maxco/AppData/Local/Temp/w9`), never in the repository working tree**; the worktree was removed
  and pruned, and the empty status is the evidence none of it touched the repo.
- [x] The authorizing inputs named in the round-01 record (`defect-history.json`,
  `.claude/expert/ACCEPTANCE-RESULTS-2026-08-17.md`, and the five owner-approved correction drafts under the
  session task directory). **Unpinnable citation**: outside version control, cited by path and date 2026-08-17.
  No finding rests on their content.

### Tool plan (Step 3)

| Claim type | Instrument | Used for |
|---|---|---|
| Literal-content | Read at file:line | the `GATE` comment and object; the schema `escalations` description; the new gate-count check block; the `braced`/`topKeys` helpers; spec §3.4; the architecture invariant |
| Absence | grep with recorded query + count | the six-gate framing sweep across the plugin; quoted keys and spreads in the workflow; anchor uniqueness; the changed-file set via `git diff --name-only` |
| Behavioral (the pin refuses; tiers pass) | test-runner execution + eleven mutation probes in an isolated worktree | both tiers; the dispatch's required eighth-member probe; three round-8 regression probes; five member-form probes |
| Structural / dataflow | Read of the specific code path plus `node -e` extraction over the literal | the `GATE` member count; the `gate_type` enum |
| Imported from prior documents | re-derivation from current source | the F8-1 closure; round 8's mutation results, re-executed rather than cited |
| Comment claims inside the artifact | re-derivation from source | the `GATE` comment at `:61-63` (re-derived and found **true** this round); the `5b6ea91` commit message's "Structural 235/235, unit 17/17" (both re-executed and confirmed); the new check block's own comment claiming the next propagation miss turns the tier red (re-derived by probe — **partially false**, F9-1) |

No library-behavior claims arise in this scope, so Context7 is not load-bearing; no instrument class was
unavailable. **Procedural note (honest sequencing):** `metacognitivemonitoring` is specified for review start;
it was invoked at the evaluation stage instead, after probing and before findings were finalized. It changed
the output materially — it named the classification of the pin's brittleness as the review's weakest judgment
and set an explicit falsifiability criterion ("a probe producing a false GREEN would make it a real finding").
Testing that criterion rather than arguing it is what produced F9-1, which would otherwise have been filed as
an Observation on fail-closed grounds. `collaborativereasoning` was invoked before the gates and succeeded on
the second call (the first was rejected for a persona communication-enum violation — a validation error, not
an infrastructure failure). No rigor waivers.

### Execution results

- **Structural tier**: `node tests/structural/check-structure.mjs` → `STRUCTURAL TESTS PASSED`, exit 0,
  **235** `ok` lines. Matches `5b6ea91`'s "Structural 235/235" (234 + 1 new gate-count check).
- **Unit tier**: `node tests/unit/run-unit-tests.mjs` → `UNIT TESTS PASSED`, exit 0, **17** `ok` lines.
- **Syntax**: `node --check workflows/expert-lifecycle.js` → clean. `JSON.parse` of `ledger.schema.json` → valid.
- **Worktree baseline**: identical (exit 0, 235 `ok`) before any mutation, and restored to exit 0 after each.

### The dispatch's required probe, and the pin's behavior across member forms

All run in the detached worktree at `5b6ea91`, each restored from a pristine copy before the next. The
dispatch required: add an eighth `GATE` member without touching the comment; the tier must go red.

| # | Mutation | Syntax | Tier | Named failure |
|---|---|---|---|---|
| **add8** | add `extra_gate: 'extra_gate',` — **the dispatch's required probe** | OK | **exit 1** | `FAIL T-24 gate-count comment matches the GATE literal` (sole failure) |
| del1 | delete `core_approval` member, comment untouched | OK | **exit 1** | same check |
| six | revert the comment to "The six owner-gate types", `GATE` untouched | OK | **exit 1** | same check |
| ten | comment word outside the six–nine map ("ten"), members untouched | OK | **exit 1** | same check (fail-closed on an unmapped word) |
| sameline | add two members on one line | OK | **exit 1** | same check |
| indent4 | add a member at four-space indentation | OK | **exit 1** | same check |
| fg1 | add a member whose value contains `}` (`weird: 'a}b'`) plus an eighth | OK | **exit 1** | same check |
| fg2 | add `extra_gate: 'x{y}z',` | OK | **exit 1** | same check |
| **fg3** | add `'extra-gate': 'extra_gate',` — **single-quoted key** | OK | **exit 0, 235 green** | **none — false green** |
| **dquote** | add `"extra_gate": 'extra_gate',` — **double-quoted key** | OK | **exit 0, 235 green** | **none — false green** |
| **spread** | add `...{ extra_gate: 'extra_gate' },` | OK | **exit 0, 235 green** | **none — false green** |

The dispatch's required probe passes: the pin computes the `GATE` member count, compares it to the comment's
stated count, and turns the tier red on an eighth bare-identifier member with a single named failure. Six
further member-form and comment-form mutations are also caught. Three valid member forms are not — grounds F9-1.

### Round 8's closures, re-probed (regression check)

| # | Mutation | Result |
|---|---|---|
| MD | `verifierUnderCovered` neutered to `() => false` | **caught** — exit 1, four named T-24y FAILs |
| MH | flip the first `GATE.control_fault` emission **alone** | **caught** — exit 1, `T-24 deployment: both control gates carry GATE.control_fault` |
| MN | `verifierUnderCovered(vr, sample.length)` → `false` | **caught** — exit 1, two named T-24 deployment FAILs |

The round-9 commit did not weaken any control round 8 verified.

---

## Summary

**This review returns NEEDS FIXES**, on one Minor finding in code the fix commit itself introduced. F8-1 is
fully closed: both texts the finding named now read "seven" with the amendment reference, verified by Read of
each at current HEAD, and the whole plugin is consistent at seven across six independent sites — spec §3.4
(seven numbered items), the architecture union and invariant, `commands/expert.md` (two statements above seven
bullets), the workflow's `GATE` object (seven members) and its comment, and the ledger schema's enum (seven
values) and description. The commit went further than the finding required and added the structural pin round 8
recommended, which converts a future propagation miss from a review finding into a red test. That pin works for
the case it was built for: the dispatch's required probe — an eighth `GATE` member added without touching the
comment — turns the tier red with a single named failure, and six further mutations covering member deletion,
comment reversion, an unmapped count word, same-line and re-indented members, and brace-bearing values are all
caught. What blocks the verdict is that the pin's member counter recognizes only bare-identifier keys: adding a
valid eighth member with a single-quoted key, a double-quoted key, or an object spread leaves the tier green at
235 while the comment still says seven. That is the exact miss the pin exists to catch, so the guard fails open
on three of the nine member forms probed. It is Minor rather than Moderate because the workflow contains zero
quoted keys and zero spreads anywhere, every existing gate name is a bare snake_case identifier matching the
spec's naming, and the idiomatic amendment path is caught. Trajectory is 9 → 7 → 5 → 5 → 4 → 3 → 3 → 1 → **1**.
The tripwire has **not fired** — it requires two consecutive rounds and round 8 was clean on both conditions —
but **both conditions are true this round**, which re-arms it: a round 10 that does not close F9-1 without
introducing anything new fires it. The arithmetic is shown in full below.

---

## Upstream Contract Verification

The upstream contracts are the five owner-approved correction drafts, the round-8 review finding as the
remediation contract for `5b6ea91`, the owner decision of 2026-08-19 recorded in
`docs/SESSION-STATE-corrections-0.3.0.md:25-36`, and `docs/specs/spec-expert-dev-tools.md` §3.4 with
`docs/arch/architecture-expert-dev-tools.md`'s SEGMENT_REPORT protocol. The round-8 finding is checked against
the standard originally named for it.

| Prior finding | Originally named standard | Status | Verification method |
|---|---|---|---|
| **F8-1** (the seventh-gate-type amendment was not propagated to two count statements asserting the old invariant — `workflows/expert-lifecycle.js:61-62` and `scripts/ledger.schema.json:103`) | documentation-code consistency as it applies to a published enumerated contract | **CLOSED** | Read of both named sites at current HEAD. `workflows/expert-lifecycle.js:61-63` now reads "The seven owner-gate types — exactly the spec 3.4 escalation list (amended 2026-08-19, owner decision F7-2: control_fault added); the script has no other path to the owner," matching the phrasing already committed to the architecture at `:232-235` as the finding's correct-implementation asked. `scripts/ledger.schema.json:103` now reads "gate_type is one of the seven in spec 3.4 (control_fault added by the 2026-08-19 amendment …)", with the false "plus control_fault" construction removed. Both counts re-derived against the objects they describe rather than taken from the text: `node -e` extraction over the `GATE` literal → **7** members; `JSON.parse` of the schema → `gate_type` enum of **7** values. Class sweep: `grep -rniE "six (owner-)?gate\|the six in spec\|six escalation\|six original\|six gate types" --include=*.md --include=*.js --include=*.mjs --include=*.json .` over the plugin, excluding `docs/reviews/` → **4 hits**, of which **0 are live and false** (two grandfathered plan files, one work-order quotation of the pre-amendment state, one amendment note describing that state — each dispositioned individually under Systemic Patterns). |

**Acceptance criteria / architecture decisions governing this scope.** Spec §3.4 and the architecture's
SEGMENT_REPORT protocol govern the `GATE` change; both were verified **honored** by Read of each, with the
producer's member count and the schema's enum re-derived independently and both equal to seven. No other spec
acceptance criterion is in scope for a corrections branch that changes no functional requirement.

---

## Critical & Serious Findings

**No Critical or Serious findings** — the full inventory was Read or Grep-verified per Compliance Gate B, and
no violations of Critical or Serious classification were observed. Round 8's single Moderate finding is closed
at the standard it named. The one open item is classified Minor below, with the reasoning stated in the finding.

---

## Systemic Patterns

**No systemic patterns.** F9-1 is a single blind spot in one helper, and the proactive scan below establishes
that the codebase never uses the forms it misses.

Proactive scans run, with queries and result counts:

- `grep -rniE "six (owner-)?gate|the six in spec|six escalation|six original|six gate types|six of them"
  --include=*.md --include=*.js --include=*.mjs --include=*.json .` over the plugin → **4 hits** outside
  `docs/reviews/`, each dispositioned individually: `docs/plans/plan-expert-dev-tools-behavioral-remediation.md:1439`
  and `docs/plans/plan-expert-dev-tools.md:48` (grandfathered by the recorded owner scoping decision — see
  Observations); `docs/SESSION-STATE-corrections-0.3.0.md:33` (Read — a work-order line instructing
  "'The six gate types' → 'The seven gate types'", a quotation of the state being corrected, correct as
  written); `docs/specs/spec-expert-dev-tools.md:143` (Read — "none of the six original types" inside the
  amendment note, describing the pre-amendment state, correct as written). **Zero live-and-false instances
  remain.** The two round-8 instances are the only ones that were live, and both are closed.
- `grep -nE "^\s*['\"][A-Za-z_-]+['\"]\s*:" workflows/expert-lifecycle.js` → **0 hits**; `grep -c "\.\.\."`
  over the same file → **0**. The workflow uses no quoted object keys and no spreads anywhere, which is what
  bounds F9-1 to Minor rather than Moderate: the forms the counter misses are absent from the codebase and
  contrary to its uniform convention.
- `grep -c "const GATE = {"` and `grep -c "owner-gate types"` over `workflows/expert-lifecycle.js` → **1** each.
  Both anchors the new check keys on are unique, so neither `indexOf` nor the `exec` can bind to a decoy.
- `git diff --name-only 66514d0..5b6ea91` → **4 files**; `git diff --stat 66514d0..5b6ea91 -- agents/ skills/
  commands/ .claude-plugin/ docs/specs/ docs/arch/` → **0 lines**, confirming the fix commit introduced no
  collateral change outside the two text sites and the one test file.

---

## Moderate & Minor Findings

**No Moderate findings** — the sole candidate at that severity (the pin's counting gap) resolved to Minor on
the evidence recorded in the finding below, and every other candidate resolved to a non-finding observation.

### F9-1 — The new gate-count pin's member counter recognizes only bare-identifier keys, so three valid ways of adding an eighth gate type leave the tier green
**Location:** `claude-plugins/expert-dev-tools/tests/structural/check-structure.mjs:733-743`
**Severity:** Minor
**Provenance:** **new** — no prior round reported it; the check it concerns was introduced by `5b6ea91`, the
round-9 fix commit itself. (Classifying it instead as a regression, on the ground that the fixes introduced it,
changes no tripwire arithmetic below — both readings give new + regression = 1.)

**What the code does now.** The block added at `:733-743` computes the `GATE` literal's member count and
requires the leading comment's stated count to match:

```js
const gateBody = braced(wfSrc, wfSrc.indexOf('const GATE = {'));
const memberCount = topKeys(gateBody).length;
const words = { six: 6, seven: 7, eight: 8, nine: 9 };
const stated = /The (six|seven|eight|nine) owner-gate types/.exec(wfSrc);
check('T-24 gate-count comment matches the GATE literal',
  !!stated && words[stated[1]] === memberCount);
```

`memberCount` comes from `topKeys`, whose key recognizer is
`/^([A-Za-z_][A-Za-z0-9_]*)\s*:/` (Read at `:116`). That pattern matches a bare identifier followed by a
colon and nothing else. A member declared with a quoted key — `'extra-gate': 'extra_gate',` or
`"extra_gate": 'extra_gate',` — or contributed by an object spread — `...{ extra_gate: 'extra_gate' },` — is a
real member of `GATE` at runtime and is invisible to the count. The comment continues to say "seven", the
object has eight members, and the check passes.

**How that claim was verified.** By execution, in a detached worktree at `5b6ea91`, each mutation applied to a
pristine copy and reverted after:

- `fg3` — inserted `  'extra-gate': 'extra_gate',` after the `control_fault` member. `node --check` → **syntax
  OK** (a valid eighth member). Tier → **exit 0, 235 `ok`**. No failure reported.
- `dquote` — inserted `  "extra_gate": 'extra_gate',`. Syntax OK. Tier → **exit 0**.
- `spread` — inserted `  ...{ extra_gate: 'extra_gate' },`. Syntax OK. Tier → **exit 0**.
- Contrast, same harness: `add8` (bare identifier `extra_gate: 'extra_gate',`) → **exit 1** with the single
  named failure `T-24 gate-count comment matches the GATE literal`; likewise `del1`, `six`, `ten`, `sameline`,
  `indent4`, `fg1`, `fg2`. The full eleven-probe table is in Scope and Inventory.
- Read of `tests/structural/check-structure.mjs:108-121` (the `topKeys` body) and `:116` (the key regex)
  establishes the mechanism rather than inferring it from the probe results.
- Read of the block's own comment at `:733-735`, which states the pin's purpose: "the next amendment's
  propagation miss is a red test, not a review finding." Per the Step 6 rule on comment claims, that claim was
  re-derived rather than accepted, and the three probes above show it does not hold for all member forms.

**Standard violated.** The standard this cycle has named across six rounds — a control is delivered with the
test that demonstrates it refuses, and it must refuse for the condition it claims to cover. The pin's stated
coverage is "the next amendment's propagation miss"; the amendment operation it guards is "add a gate type,"
and three valid spellings of that operation pass green. This is the fail-open direction, which is what
separates it from the two fail-closed brittleness notes recorded in Observations: those turn the tier red when
nothing is wrong, costing a maintainer time; this one stays green when the invariant is genuinely broken,
which is the failure mode the pin was added to eliminate.

**Why Minor rather than Moderate.** Verified by the proactive scan above: `workflows/expert-lifecycle.js`
contains **zero** quoted object keys and **zero** spreads, and all seven existing gate names are bare
snake_case identifiers matching the spec §3.4 naming, so a new gate type written idiomatically is caught. The
gap requires a maintainer to break the file's uniform convention at the same moment they forget the comment.
The realistic propagation miss — the one round 8 recommended the pin for, and the one the dispatch asked to be
probed — is covered, verified by `add8`. Nothing currently in the repository is wrong; the defect is a
completeness gap in a guard's coverage, which is the Minor band.

**Correct implementation.** Either of two bounded changes, both testable with the probes already executed:

- Widen the recognizer so quoted keys count — in the gate-count block, count with a pattern that also accepts
  `'key':` and `"key":` (for example, matching `/(?:^|[,{])\s*(?:['"][^'"]+['"]|[A-Za-z_$][\w$]*)\s*:/g` over
  `gateBody` at depth 0) rather than reusing `topKeys` unmodified. Leaving `topKeys` itself untouched is
  preferable, since its other caller at `:137` reads schema property literals whose contents are not in scope
  here.
- Or make the unsupported forms fail closed — add an assertion that `gateBody` contains no quoted-key and no
  spread syntax, so a member form the counter cannot see turns the tier red instead of passing silently. This
  is the smaller change and matches the fail-closed posture the tier uses elsewhere.

Either fix should be verified by re-running `fg3`, `dquote`, and `spread` and confirming all three now exit 1,
and by re-running `add8` and the baseline to confirm no false red was introduced.

---

## Tentative Findings

**No tentative findings** — every candidate finding's premise was verified per Compliance Gate B. One caveat is
recorded rather than deferred, and no finding's premise depends on it: the authorizing inputs named in the
round-01 record remain session outputs outside version control, cited by path and date (2026-08-17) with their
unpinnable status stated per the Step 6 rule.

---

## Observations

- **A comment reword inside the `GATE` literal produces a named but false failure, and this is fail-closed
  rather than a defect.** Probe `cmtcolon`: rewording the in-literal comment to begin "`// Note: a mechanical
  control …`" makes `topKeys` read `Note:` as a member, giving a count of 8 against a stated seven — the tier
  goes red with `FAIL T-24 gate-count comment matches the GATE literal` although the counts genuinely match.
  Any colon-bearing comment inside the literal, including a URL, does this. The direction is safe (a red that
  should be green never lets a defect through) and it is the same source-text sensitivity the tier accepts
  throughout, so no standard is violated. Recorded because the failure message asserts something false about
  its subject, and a maintainer will otherwise count members twice looking for a discrepancy that is not there.
  The second fix option offered under F9-1 would address this at the same time.
- **The count-word map covers six through nine only, and an unmapped word fails closed.** Probe `ten`:
  a comment reading "The ten owner-gate types" makes the `exec` return null and the check fails. Correct
  behavior for a pin, and reaching ten gate types is remote. No standard violated; recorded so the bound is on
  the record rather than rediscovered as a surprise.
- **The two plan-file "six gate types" statements are excluded by an explicit, recorded scoping decision, not
  by oversight.** `docs/SESSION-STATE-corrections-0.3.0.md:34-36` (Read): "do NOT edit the plan (grandfathered
  artifact); the spec amendment note is the traceability." The spec's amendment note carries that traceability
  (Read at `:140-145`). No standard violation; recorded because both lines keep appearing in grep sweeps and
  the next reviewer should not re-file them.
- **No `SKILL-CHANGELOG.md` entry is owed and its absence is correct.** The changelog's scope is `skills/` and
  nothing else; `git diff --stat 66514d0..5b6ea91 -- skills/` → 0 lines. Recorded so the next round does not
  re-derive this as a miss.

---

## What's Actually Good

- **The fix closed F8-1 by correcting both named sites to text that matches the wording already committed
  elsewhere, rather than to new phrasing.** Good by the standard that a single invariant stated in two
  governing documents must not be readable as two different claims. Verified by Read of
  `workflows/expert-lifecycle.js:61-63` against `docs/arch/architecture-expert-dev-tools.md:232-235`: both now
  carry "the seven … exactly the spec 3.4 escalation list (amended 2026-08-19, owner decision F7-2)". The
  schema description was rewritten rather than patched — the false "plus control_fault" construction is gone,
  not merely renumbered, which is the part most likely to have survived a minimal edit.
- **The commit did the structural work round 8 offered as optional, and it is the right mechanism.** Good by
  the first-principles standard round 8 articulated: a count asserted in prose with no mechanical link to the
  object it describes will drift at the next amendment. The pin computes the count from the literal instead of
  restating it. Verified by execution rather than by reading the assertion: the dispatch's required probe
  (`add8`) turns the tier red with exactly one named failure, and `del1`, `six`, `sameline`, `indent4`, `fg1`,
  and `fg2` do the same. The check is also correctly anchored — both `const GATE = {` and `owner-gate types`
  occur exactly once in the file (grep counts recorded above), so it cannot bind to a decoy.
- **Round 8's closures were not disturbed by new test-file work.** Good by the standard that a change to a
  test tier must be regression-checked against the controls that tier already carries. Verified by re-executing
  three of round 8's mutations against the round-9 tree — MD, MH, MN — each still exit 1 with its own named
  failures, so the eight-for-eight deployment result round 8 established still holds at this HEAD.
- **The 235th check is genuinely additive.** Verified by execution: 234 `ok` at `66514d0` per round 8's record
  re-derived as 235 `ok` at `5b6ea91`, exit 0, with the delta being exactly the new gate-count check, and unit
  at 17 `ok` unchanged. The commit message's "Structural 235/235, unit 17/17" was re-executed rather than
  accepted, and both numbers are accurate.

---

## Convergence Record

- **Round number:** 9 (eighth Post-fix round).
- **Trajectory:** R1: 9 (1 Serious-Systemic, 4 Serious, 3 Moderate, 1 Minor) → R2: 7 (1 Serious-Systemic,
  3 Serious, 3 Moderate) → R3: 5 (2 Serious, 2 Moderate, 1 Minor) → R4: 5 (1 Serious-Systemic, 2 Serious,
  2 Moderate) → R5: 4 (1 Serious-Systemic, 1 Serious, 2 Moderate) → R6: 3 (1 Serious, 2 Moderate) →
  R7: 3 (2 Serious, 1 Minor) → R8: 1 (1 Moderate) → **R9: 1 (1 Minor)**.
- **Flow counts for this round:**
  - Prior findings **closed**: **1** — F8-1, verified against its originally named standard by Read of both
    sites it named, with the counts re-derived independently from the `GATE` literal and the schema enum
    rather than read off the corrected text, plus a class sweep returning zero live-and-false instances.
  - **New**: **1** — F9-1, in code `5b6ea91` introduced.
  - **Regressions**: **0**. Round 8's three re-probed controls (MD, MH, MN) all still turn the tier red, and
    `git diff --stat` over `agents/`, `skills/`, `commands/`, `.claude-plugin/`, `docs/specs/` and `docs/arch/`
    is empty.
  - **Recurring**: **0**. F8-1's two named sites are both corrected.
  - Reconciliation: 1 prior − 1 closed = 0 carried; 0 + 1 new + 0 regression = **1**.
  - **Classification note.** F9-1 is filed as new (no prior round reported it). Filing it instead as a
    regression, on the ground that the fix commit introduced it, leaves new + regression = 1 unchanged, so
    neither tripwire condition nor the routing conclusion depends on that choice. Stated so the classification
    cannot be read as chosen to affect the arithmetic.
- **Tripwire evaluation — NOT FIRED, but re-armed: both conditions are TRUE this round.** The tripwire requires
  a condition to hold for **two consecutive** Post-fix rounds. Round 8 was false on both, so neither condition
  can reach two consecutive at round 9. Arithmetic for both, across every Post-fix round:
  - **(a)** new + regression ≥ closed, for two consecutive Post-fix rounds.
    - R2: 2 + 1 = 3; closed = 6; 3 ≥ 6 → **false**.
    - R3: 1 + 2 = 3; closed = 5; 3 ≥ 5 → **false**.
    - R4: 1 + 2 = 3; closed = 3; 3 ≥ 3 → **TRUE**.
    - R5: 2 + 1 = 3; closed = 4; 3 ≥ 4 → **false**.
    - R6: 2 + 0 = 2; closed = 3; 2 ≥ 3 → **false**.
    - R7: 2 + 1 = 3; closed = 3; 3 ≥ 3 → **TRUE**.
    - R8: 0 + 0 = 0; closed = 2; 0 ≥ 2 → **false**.
    - **R9: 1 + 0 = 1; closed = 1; 1 ≥ 1 → TRUE.**
    - Two consecutive requires R8 and R9 both true. R8 is false. **Not fired.**
  - **(b)** the total findings count has not strictly decreased, for two consecutive Post-fix rounds. Totals:
    R1 = 9, R2 = 7, R3 = 5, R4 = 5, R5 = 4, R6 = 3, R7 = 3, R8 = 1, **R9 = 1**.
    - R2: 7 < 9 → strictly decreased → **false**.
    - R3: 5 < 7 → strictly decreased → **false**.
    - R4: 5 < 5 is false → did not strictly decrease → **TRUE**.
    - R5: 4 < 5 → strictly decreased → **false**.
    - R6: 3 < 4 → strictly decreased → **false**.
    - R7: 3 < 3 is false → did not strictly decrease → **TRUE**.
    - R8: 1 < 3 → strictly decreased → **false**.
    - **R9: 1 < 1 is false → did not strictly decrease → TRUE.**
    - Two consecutive requires R8 and R9 both true. R8 is false. **Not fired.**
  - **Consequence for round 10.** Both conditions are true at round 9, so the tripwire is armed on both. If
    round 10 fails to close more than it introduces, **or** does not land strictly below a total of 1 — that
    is, does not reach zero findings — a condition reaches two consecutive rounds and the tripwire fires,
    routing to foundational rework rather than another fix round. Round 10 has exactly one acceptable outcome:
    close F9-1, introduce nothing, reach zero, PASS.
- **Reading of the arithmetic.** The total held at 1 rather than reaching zero, and the reason is specific
  rather than diffuse: the round-9 commit closed its assigned finding completely and correctly, then added
  optional hardening that carried a coverage gap. Nine rounds in, the finding set is no longer about the
  subject of the corrections at all — F8-1 was the last defect in the shipped artifact, and F9-1 is in a test
  added to protect it. That is a materially different position from rounds 4 through 7, where each round's
  findings were in the production path. The discipline gap this round is the one the cycle has shown before in
  a new form: work added beyond the finding's scope was not itself probed to the standard the cycle applies to
  everything else. The `add8` case was clearly verified before commit — the commit message's counts are
  accurate and the primary probe passes — but the adjacent member forms were not tried.

---

## Recommended Priority

The tripwire did not fire, so a targeted fix round is the indicated path and foundational rework is not.
There is one finding, in one block of one test file.

1. **F9-1, at `tests/structural/check-structure.mjs:733-743`.** Prefer the fail-closed option: assert that the
   `GATE` literal body contains no quoted-key and no spread syntax, so any member form the counter cannot see
   turns the tier red rather than passing silently. It is the smaller change, it matches the tier's posture
   elsewhere, and it also removes the false-red described in the first Observation if the assertion is scoped
   to exclude comment text. Widening the recognizer is the alternative; if taken, change the gate-count block
   rather than `topKeys` itself, whose other caller at `:137` reads different literals.
2. **Verify the fix by mutation, not by reading it.** Re-run `fg3` (`'extra-gate': 'extra_gate',`), `dquote`
   (`"extra_gate": 'extra_gate',`) and `spread` (`...{ extra_gate: 'extra_gate' },`) — each must exit 1 — and
   re-run `add8` plus the clean baseline to confirm no false red was introduced. This is the same
   close-by-re-executing-the-review's-own-falsifying-evidence method that produced round 8's eight-for-eight
   result, and it is what the arming of both tripwire conditions makes non-optional this round.
3. **Change nothing else.** The two grandfathered plan references, the changelog, and the four in-scope
   documents are all correctly dispositioned; the six-gate sweep returns zero live-and-false instances. Any
   edit outside the one test block would introduce risk into a round that must reach zero findings.

**One note for round 10, given the arithmetic.** Both tripwire conditions are true this round, so round 10 must
reach zero findings; a round 10 that closes F9-1 but introduces anything new fires the tripwire on condition
(a), and one that leaves the total at 1 fires it on condition (b). The scope that makes zero reachable is
small — one block, one file, no production code — and the verification method is already written down as three
executable mutations. The risk to avoid is the one this round demonstrated: adding unrequested hardening
alongside the fix without probing it to the same standard.

---

Verdict: NEEDS FIXES (1 finding: 1 Minor)
