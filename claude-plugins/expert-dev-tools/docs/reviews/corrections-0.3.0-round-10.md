# Independent review — corrections 0.3.0, round 10 (Post-fix)

Artifact: commits `2b1b7d8` → `60d380f` on `claude/edt-corrections-0.3.0`, diffed against `origin/main`.
HEAD at review time: `60d380fbde9b216c5160f2f7680850ed69f88bef`.
Reviewer: independent (expert-review R1.2). Date: 2026-08-19.
Prior rounds: `corrections-0.3.0-round-01.md` (NEEDS FIXES, 9) through `…-round-09.md` (NEEDS FIXES, 1 Minor).
Round 9's arithmetic armed the non-convergence tripwire on both conditions; this round evaluates it.

---

## Scope and Inventory

Round 10 — Post-fix review. Inventory built per Step 2's post-fix rule from all four sources. Every premise
below was re-derived from current source at drafting time; nothing is inherited from a prior record.

**Source 1 — the prior review's full inventory, re-verified:**

- [x] `claude-plugins/expert-dev-tools/tests/structural/check-structure.mjs` — the only file `60d380f`
  touched (`git diff --name-only 5b6ea91..60d380f` → exactly this file). Read at 96-121 (the `braced` and
  `topKeys` helpers), 454-548 (the `REPLACED_BY_STRENGTHENING` allowlist, the T-20 guard predicate, and the
  T-A2f self-tests), and 740-769 (the rewritten gate-count block). Executed; mutation-probed nineteen ways in
  an isolated worktree (tables below). Grounds F9-1's closure and F10-1.
- [x] `claude-plugins/expert-dev-tools/workflows/expert-lifecycle.js` — Read at 54-81: the comment at
  `:61-63` reads "The seven owner-gate types …" and the `GATE` literal at `:64-74` carries seven members,
  each a bare snake_case key on its own line. Runtime re-derivation: the literal extracted by brace-matching
  and evaluated → `Object.getOwnPropertyNames` length **7**. `node --check` → SYNTAX OK. Unchanged by
  `60d380f` (diff bound above).
- [x] `claude-plugins/expert-dev-tools/scripts/ledger.schema.json` — enum re-derived by loading the JSON:
  `gate_type` enum = `intent, spec_traceable, business, risk_override, non_convergence, core_approval,
  control_fault` → **7** values. Unchanged by `60d380f`.
- [x] `claude-plugins/expert-dev-tools/commands/expert.md` — `grep -c "seven"` → **2**. Unchanged by `60d380f`.
- [x] `claude-plugins/expert-dev-tools/docs/specs/spec-expert-dev-tools.md` — `grep -n "Control faults"` →
  `:136`, item 7 present. Unchanged by `60d380f`.
- [x] `claude-plugins/expert-dev-tools/docs/arch/architecture-expert-dev-tools.md` — `grep -n "The seven gate
  types"` → `:232`. Unchanged by `60d380f`.
- [x] `claude-plugins/expert-dev-tools/docs/SESSION-STATE-corrections-0.3.0.md`,
  `docs/SKILL-CHANGELOG.md`, `.claude-plugin/plugin.json`, `agents/expert-architect.md`,
  `agents/expert-planner.md`, `agents/expert-spec-writer.md`, `skills/expert-standard/SKILL.md`,
  `skills/expert-plan/SKILL.md`, `skills/expert-implement/SKILL.md` — all verified unchanged since the state
  round 9 verified them in, by the single-file diff bound: `git diff --name-only 5b6ea91..60d380f` returns
  exactly one path, and none of these are it. Round 9's per-file verifications were performed at `5b6ea91`;
  byte-identity to that verified state is this round's re-derivation.

**Source 2 — fix-diff files (`5b6ea91..60d380f`):** `tests/structural/check-structure.mjs` only
(+27/−3 per `git show --stat`). Two hunks: a new `REPLACED_BY_STRENGTHENING` entry at index 0
(`:458-464`) and the rewritten gate-count block (`:743-767`).

**Source 3 — dependents of the fix-diff file:** the structural tier is an entry point with no importers; its
consumers are the run itself and the T-20/T-A2f self-guards inside the same file, both Read (`:454-548`) and
executed. The unit tier shares no code with the changed block; executed anyway (below).

**Source 4 — the prior review's single finding as a closure item:** F9-1 — re-derived by executing the exact
verification round 9 prescribed (its three named mutations, plus `add8` and the clean baseline), plus a
computed-key probe. Results in the closure table.

**Supporting:**

- [x] `git status --porcelain claude-plugins/expert-dev-tools` → only the untracked round-09 review record,
  before and after all probing. **All nineteen mutations ran in a detached `git worktree` at `60d380f`
  (`C:/Users/maxco/AppData/Local/Temp/w10`, created with `core.longpaths=true`; the session scratchpad path
  exceeded Windows path limits for this repo's checkout), never in the repository working tree.** The worktree
  was removed and pruned; the clean status is the evidence.
- [x] The authorizing inputs named in the round-01 record (session outputs outside version control) —
  **unpinnable citation**, path and date 2026-08-17. No finding rests on their content.

### Tool plan (Step 3)

| Claim type | Instrument | Used for |
|---|---|---|
| Literal-content | Read at file:line | the rewritten gate-count block; the `memberRe` pattern; the allowlist entry; the T-20/T-A2f guard code; the `GATE` literal and comment |
| Absence | grep with recorded query + count | the diff bound (`git diff --name-only`); label occurrence counts; member-form conventions in the workflow file |
| Behavioral (the pin refuses; tiers pass) | test-runner execution + nineteen mutation probes in an isolated worktree | both tiers; F9-1's four prescribed closure probes; four constructed evasion probes; seven regression probes; the runtime member-count confirmation of every false-green mutant |
| Structural / dataflow | brace-matched extraction + `eval` of the literal in isolation | the `GATE` runtime member count at HEAD and in each mutant (confirming every false-green probe is a genuine 8-member object, not a syntax accident) |
| Imported from prior documents | re-derivation from current source | round 9's probe results re-executed, never cited; the seven-gate consistency re-derived per file above |
| Comment claims inside the artifact | re-derivation by probe | the new check label's claim "(all member forms; spreads fail closed)" and the commit message's "counts every member form" — both re-derived by execution and found **false** (F10-1); the commit's "Structural 235/235, unit 17/17" — re-executed and confirmed |

No library-behavior claims arise in this scope, so Context7 is not load-bearing; no instrument class was
unavailable. `metacognitivemonitoring` was invoked at review start (before any finding was drafted); it
flagged the four evasion candidates as inferences requiring execution, and all four were promoted to fact by
probe. `collaborativereasoning` was invoked before the gates and succeeded on the second call (the first was
rejected for a persona communication-enum validation error, not an infrastructure failure). No rigor waivers.

### Execution results

- **Structural tier at HEAD**: `node tests/structural/check-structure.mjs` → `STRUCTURAL TESTS PASSED`,
  exit 0, **235** `ok` lines. Matches `60d380f`'s "Structural 235/235" (label replaced, not added — count
  unchanged from round 9, correct).
- **Unit tier at HEAD**: `node tests/unit/run-unit-tests.mjs` → `UNIT TESTS PASSED`, exit 0, **17** `ok`.
- **Syntax**: `node --check workflows/expert-lifecycle.js` → clean.
- **Worktree baseline**: exit 0, 235 `ok` before any mutation; the pristine file restored after each.

### The dispatch's required probes — F9-1 closure verification

All in the detached worktree at `60d380f`, each applied to the pristine file and reverted after. Every
mutant passed `node --check` (valid JS). Round 9 prescribed: the quoted-key and spread mutants must exit 1,
and `add8` plus the baseline must confirm no false red.

| # | Mutation | Tier | Named failure |
|---|---|---|---|
| **sq8** | eighth member `'extra-gate': 'extra_gate',` (single-quoted key) | **exit 1**, 234 ok | `T-24 gate-count comment matches the GATE literal (all member forms; spreads fail closed)` — sole failure |
| **dq8** | eighth member `"extra_gate": 'extra_gate',` (double-quoted key) | **exit 1** | same, sole failure |
| **ck8** | eighth member `['extra_gate']: 'extra_gate',` (computed key) | **exit 1** | same, sole failure |
| **sp8** | eighth member `...{ extra_gate: 'extra_gate' },` (spread) | **exit 1** | same — the fail-closed `hasSpread` branch |
| add8 | eighth bare member `extra_gate: 'extra_gate',` | **exit 1** | same, sole failure |
| six | comment reverted to "The six owner-gate types" | **exit 1** | same |
| ten | comment word outside the map ("ten") | **exit 1** | same (fail-closed on an unmapped word) |
| del1 | `core_approval` member deleted | **exit 1** | same |
| fg1 | `weird: 'a}b',` plus an eighth member | **exit 1** | same |
| fg2 | eighth member `extra_gate: 'x{y}z',` | **exit 1** | same |
| mh | first `type: GATE.control_fault` emission flipped (round-8 control MH) | **exit 1** | `T-24 deployment: both control gates carry GATE.control_fault` |
| cmtcolon | in-literal comment reworded to begin `// Note: …` | **exit 0, 235 ok** | none — **correct** (round 9's false-red observation is resolved by the new comment stripping) |

All four probes the dispatch required are red; the bare-key eighth member and the comment-word reversion stay
red; no false red was introduced. **F9-1 is closed.**

### Constructed evasion probes — what the strengthened pin still misses

Same harness. Each mutant passed `node --check`, and each mutated `GATE` literal was independently extracted
and evaluated to confirm it is a **genuine eight-member object at runtime** (`Object.getOwnPropertyNames`
→ 8, `extra_gate` present) — these are real added gate types, not syntax accidents.

| # | Mutation (valid eighth member) | Runtime members | Tier |
|---|---|---|---|
| **inline8** | appended to an existing line: `core_approval: 'core_approval', extra_gate: 'extra_gate',` | 8 | **exit 0, 235 ok — false green** |
| **split8** | key and colon on separate lines: `extra_gate` ⏎ `: 'extra_gate',` | 8 | **exit 0 — false green** |
| **getter8** | accessor member: `get extra_gate() { return 'extra_gate' },` | 8 | **exit 0 — false green** |
| **method8** | method shorthand: `extra_gate() { return 'extra_gate' },` | 8 | **exit 0 — false green** |

Grounds F10-1.

---

## Summary

**This review returns NEEDS FIXES**, on one Minor finding — and the non-convergence tripwire has **FIRED on
both conditions**, so the routing is foundational rework of the pin, not another patch round. F9-1 is closed
exactly as round 9 prescribed: all three of its named member forms (single-quoted key, double-quoted key,
spread) plus a computed key now turn the tier red with the single named failure, the spread through the
fail-closed branch, verified by execution in an isolated worktree; the bare-key eighth member, the comment
reversion, an unmapped count word, member deletion, brace-bearing values, and the round-8 control MH all
remain red; the clean baseline holds at 235/235 structural and 17/17 unit with no false red. The fix even
resolved round 9's false-red observation as a side effect. What blocks the verdict is that the fix repeated,
one level up, the exact structure of the defect it was closing: it widened the counter's enumeration of
recognizable member forms instead of failing closed on unrecognizable ones, and relabeled the check "all
member forms; spreads fail closed" — a coverage claim four executed probes falsify. A valid eighth gate
member appended to an existing member line, split across lines at the colon, or written as a getter or method
shorthand is a genuine eighth runtime member (confirmed by evaluating each mutated literal) that leaves the
tier green at 235 while the comment says seven. Round 9's F9-1 named this standard — a control must refuse
for the condition it claims to cover — and its recommended fix was the fail-closed assertion precisely
because enumeration invites this recurrence. Trajectory is 9 → 7 → 5 → 5 → 4 → 3 → 3 → 1 → 1 → **1**: three
consecutive rounds at a total of 1, with rounds 9 and 10 each closing its finding completely and each
introducing one new finding in the hardening it added. That is the field signature of patching a foundation,
the tripwire's arithmetic confirms it under every defensible provenance classification, and the arithmetic is
shown in full below.

---

## Upstream Contract Verification

The upstream contracts are the five owner-approved correction drafts, the round-9 review finding as the
remediation contract for `60d380f`, spec §3.4, and the architecture's SEGMENT_REPORT protocol. The round-9
finding is checked against the standard originally named for it.

| Prior finding | Originally named standard | Status | Verification method |
|---|---|---|---|
| **F9-1** (the gate-count pin's member counter recognized only bare-identifier keys, so a single-quoted key, double-quoted key, or spread eighth `GATE` member left the tier green — `tests/structural/check-structure.mjs:733-743` at `5b6ea91`) | a control is delivered with the test that demonstrates it refuses, and it must refuse for the condition it claims to cover | **CLOSED** | By execution of round 9's own prescribed verification, not by reading the fix: mutations `sq8` (`'extra-gate':`), `dq8` (`"extra_gate":`), and `sp8` (spread) each exit 1 with the single named failure `T-24 gate-count comment matches the GATE literal (all member forms; spreads fail closed)` — the spread via the fail-closed `hasSpread` branch, matching round 9's preferred posture for that form; `ck8` (computed key) also exits 1; `add8` and the clean baseline confirm no false red (exit 0, 235 ok). Mechanism verified by Read of the rewritten block at `:743-767`: quoted and computed keys now match `memberRe` (`:751`), spreads set `hasSpread` (`:755`), and the check requires `!hasSpread` (`:766`). The T-20 baseline allowlist entry (`:458-464`) records the label strengthening with the finding that forced it, and the T-A2f self-tests (`:537-544`), which parameterize over allowlist entry `[0]`, still exercise the guard predicate — tier green at 235. **The closure is of F9-1's named instances; the class it exemplified recurs as F10-1.** |

**Acceptance criteria / architecture decisions governing this scope.** Spec §3.4 and the SEGMENT_REPORT
protocol govern nothing in this fix (it touched one test file); the seven-gate invariant was nonetheless
re-derived across all six sites (inventory above) — producer literal 7, schema enum 7, spec item 7 present,
architecture invariant present, command doc 2 "seven" statements — all **honored**.

---

## Critical & Serious Findings

**No Critical or Serious findings** — the full inventory was Read or Grep-verified per Compliance Gate B, and
no violations of Critical or Serious classification were observed. The one open item is classified Minor
below, with the reasoning stated in the finding.

---

## Systemic Patterns

**No systemic patterns in the artifact.** The one finding is a single guard's coverage gap. Proactive scans:

- `git diff --name-only 5b6ea91..60d380f` → **1 file**; the fix introduced no collateral change anywhere else.
- `grep -c "T-24 gate-count comment matches the GATE literal (all member forms; spreads fail closed)"
  tests/structural/check-structure.mjs` → **2** (once as the allowlist `now:` field, once in `check(` position
  at `:765`) — exactly the shape the T-20 guard's structural-presence rule requires.
- `grep -nE "^\s*(get |[A-Za-z_$][\w$]*\(\)|['\"\[])" workflows/expert-lifecycle.js` → 5 hits, all string
  continuation lines, none an object member: the workflow contains no getter, method, or quoted-key members
  anywhere. `grep -nE ",[ ]*[A-Za-z_$][\w$]*[ ]*:" workflows/expert-lifecycle.js` → **1** hit at `:667`
  (`contradiction = { subject: k, a: …, b: … }`) — one same-line multi-member object elsewhere in the file,
  which slightly weakens the "contrary to the file's convention" bound for the `inline8` form (noted in the
  severity reasoning), while the `GATE` literal itself is uniformly one bare member per line (Read `:64-74`).

A process-level pattern that is not a finding against this artifact belongs on the record and is carried in
the Convergence Record's reading: rounds 9 and 10 each closed the assigned finding and each shipped
unprobed-edge hardening that became the next round's finding — the enumerate-don't-fail-closed shape twice
in a row, in the same block.

---

## Moderate & Minor Findings

**No Moderate findings** — the sole candidate resolved to Minor on the evidence below.

### F10-1 — The strengthened pin still fails open on member forms its line-lexer cannot see, while its label now claims "all member forms"
**Location:** `claude-plugins/expert-dev-tools/tests/structural/check-structure.mjs:743-767`
**Severity:** Minor
**Provenance:** **new** — no prior round reported these forms; the coverage claim they falsify ("all member
forms") was introduced by `60d380f`. Classifying it instead as **recurring** (same standard, same block as
F9-1) is defensible; the Convergence Record shows the tripwire arithmetic under both readings, and both fire.

**What the code does now.** The rewritten block (Read `:748-766`) counts members by splitting the `GATE`
body into lines, stripping `//` comments, and at depth 0 testing each line against
`memberRe = /^\s*(?:(['"])(?:(?!\1).)+\1|\[[^\]]+\]|[A-Za-z_$][\w$]*)\s*:/` — a start-of-line key followed by
a colon **on the same line** — and fails closed only on spreads (`/^\s*\.\.\./`). Any depth-0 line that is
neither a recognized member start nor a spread is **silently skipped**, so a valid member whose key does not
begin a line, or whose colon is not on the key's line, or that has no colon at all (accessor and method
members) is invisible to the count while being a real member of `GATE` at runtime.

**How that claim was verified.** By execution in the detached worktree, each mutant syntax-checked, each
mutated literal independently extracted and evaluated to confirm eight runtime members, then the tier run:
`inline8` (member appended to the `core_approval` line), `split8` (key on one line, `: 'extra_gate',` on the
next), `getter8` (`get extra_gate() { … },`), and `method8` (`extra_gate() { … },`) → **each exit 0, 235
`ok`, no failure**, with the comment still stating seven. Contrast, same harness: `add8`, `sq8`, `dq8`,
`ck8`, `sp8`, `six`, `ten`, `del1`, `fg1`, `fg2` all exit 1 with the single named failure. Mechanism
established by Read of `:751-756`, not inferred from the probes alone. The check label's claim
"(all member forms; spreads fail closed)" at `:765` and the commit message's "counts every member form" were
re-derived per the Step 6 comment-claim rule and are **false** as stated.

**Standard violated.** The same standard round 9 named for F9-1 — a control must refuse for the condition it
claims to cover — now compounded by the label: the check's own name asserts coverage ("all member forms")
that four valid spellings of "add a gate type" evade. This is the fail-open direction, in a pin whose entire
purpose is that a propagation miss "is a red test, not a review finding" (`:740-742`). Structurally it is the
recurrence round 9's correct-implementation guidance anticipated: the fix widened the enumeration of
recognizable forms (option 1) but did not apply option 1's complement or option 2's posture — anything the
counter cannot recognize passes silently instead of failing closed, which is exactly how the original
bare-identifier gap arose.

**Why Minor rather than Moderate.** Verified bounds: the `GATE` literal contains seven bare snake_case
members, one per line (Read `:64-74`); the workflow contains zero getter/method/quoted-key members anywhere
(grep above); the idiomatic amendment path (`add8`) and all of round 9's named forms are caught. The gap
requires a maintainer to use an unidiomatic member form at the same moment they forget the comment. One
bound is weaker than round 9's equivalent: same-line multi-member objects do occur once elsewhere in the file
(`:667`), so `inline8` — appending the new member to an existing line — is a plausible small-diff edit, not
an exotic one. Nothing currently in the repository is wrong; the defect is a completeness gap in a guard plus
an overstated label, which is the Minor band.

**Correct implementation.** Do not extend the lexer again — re-derive the mechanism (see Recommended
Priority). Either count by executing the extracted literal (the lift-and-run pattern T-22/T-23/T-24x already
use in this same file): extract the `GATE` literal source by brace-matching, evaluate it in isolation, and
compare `Object.getOwnPropertyNames(obj).length` to the stated word — every syntactic member form is then
counted by the language itself, and the spread fail-closed branch becomes unnecessary; or make the lexer
fail closed: keep the current recognizer and add that any depth-0 line that is non-blank after comment
stripping and is neither a recognized single-member line (one match, nothing significant after the member) nor
the literal's own closing context turns the check red. Verification for either: `inline8`, `split8`,
`getter8`, `method8` must exit 1 (for the lift-and-run option, `inline8`/`split8`/`getter8`/`method8` exit 1
via count mismatch 8≠7); `add8`, `sq8`, `dq8`, `ck8`, `sp8`, `six`, `ten`, `del1`, `fg1`, `fg2` must remain
exit 1; the clean baseline and `cmtcolon` must remain exit 0 at full green.

---

## Tentative Findings

**No tentative findings** — every candidate finding's premise was verified per Compliance Gate B. The
round-01 authorizing inputs remain outside version control, cited by path and date (2026-08-17) with their
unpinnable status stated; no finding rests on them.

---

## Observations

- **The T-A2f self-tests now exercise the new allowlist pair.** The fix inserted its entry at
  `REPLACED_BY_STRENGTHENING[0]`, and T-A2f's `OLD_LABEL`/`NEW_LABEL` read entry `[0]` (`:537-538`), so the
  self-tests' specimen changed from the gt-guard pair to the gate-count pair. The tests are parameterized
  over the entry and still exercise the same guard predicate — verified by execution (tier green, and the
  T-20 guard turned red in every probe that renamed nothing, confirming it is live). No standard violated;
  recorded so the specimen change is not rediscovered as a surprise.
- **The count-word map still covers six through nine only, failing closed on an unmapped word** — re-verified
  this round by probe `ten` (exit 1). Same disposition as round 9: correct for a pin, on the record.
- **The two grandfathered plan-file "six gate types" statements remain excluded by the recorded owner scoping
  decision** (`docs/SESSION-STATE-corrections-0.3.0.md:34-36`, unchanged since round 9 verified it, per the
  single-file diff bound). Not re-filed.

---

## What's Actually Good

- **The closure was executed exactly to the prior round's prescription, and it holds.** Good by the cycle's
  own standard — close by re-executing the review's falsifying evidence, not by reading the fix. Verified:
  round 9 named three mutations and two no-false-red controls; all five behave as required at `60d380f`, plus
  the computed-key form round 9 did not demand.
- **The spread branch is genuinely fail-closed and correctly reasoned.** The commit's rationale — a spread
  makes the member count unverifiable from source text — is the right posture for an unverifiable form, and
  probe `sp8` shows it refusing. Good by the fail-safe defaults principle (a guard that cannot verify must
  refuse, not assume).
- **The fix resolved round 9's false-red observation as a side effect.** Round 9 recorded that a colon-bearing
  in-literal comment (`// Note: …`) turned the tier red with a false message. The new per-line comment
  stripping (`:753`) removes that: probe `cmtcolon` now exits 0 at full green. Verified by execution against
  the exact wording round 9 used. Good by the standard that a control's failure messages must be true of its
  subject.
- **The T-20 allowlist discipline was followed for the label strengthening.** The entry names the exact old
  label, the exact new label, and the finding that forced the swap (`:458-464`), and the old label appears in
  the file only as allowlist data — which the T-20 guard's structural-presence rule (`:512-527`) is
  specifically built to handle. Verified by Read and by the label-count grep (2 occurrences, one in `check(`
  position).

---

## Convergence Record

- **Round number:** 10 (ninth Post-fix round).
- **Trajectory:** R1: 9 (1 Serious-Systemic, 4 Serious, 3 Moderate, 1 Minor) → R2: 7 → R3: 5 → R4: 5 →
  R5: 4 → R6: 3 → R7: 3 → R8: 1 (1 Moderate) → R9: 1 (1 Minor) → **R10: 1 (1 Minor)**.
- **Flow counts for this round** (primary classification):
  - Prior findings **closed**: **1** — F9-1, against its originally named standard, by executing its own
    prescribed verification (table above).
  - **New**: **1** — F10-1, falsifying a coverage claim `60d380f` introduced.
  - **Regressions**: **0** — ten regression probes (add8, six, ten, del1, fg1, fg2, mh, plus baseline,
    cmtcolon, and the unit tier) all behave as required; the diff bound confirms no file outside the test
    tier changed.
  - **Recurring**: 0 under the primary classification; see the note.
  - Reconciliation: 1 prior − 1 closed = 0 carried; 0 + 1 new + 0 regression = **1**.
  - **Classification note.** F10-1 is the same named standard in the same block as F9-1, so reading it as
    recurring — and F9-1's class as not closed — is defensible. Both readings are computed below and **both
    fire the tripwire**, so the routing does not depend on the choice.
- **Tripwire evaluation — FIRED, on both conditions.** The tripwire fires when either condition holds for two
  consecutive Post-fix rounds. Round 9 established both conditions TRUE at R9 (its record, re-derived: closed
  1, new 1, total 1 vs R8's 1... R9 record shows new + regression = 1 ≥ closed = 1 TRUE, and total 1 not
  strictly below R8's 1 TRUE). This round:
  - **(a)** new + regression ≥ closed.
    - Primary reading: 1 + 0 = 1; closed = 1; 1 ≥ 1 → **TRUE**.
    - Recurring reading: 0 + 0 = 0; closed = 0; 0 ≥ 0 → **TRUE**.
    - R9 TRUE and R10 TRUE → **two consecutive rounds → FIRED**.
  - **(b)** total not strictly decreased. Totals: R8 = 1, R9 = 1, **R10 = 1**.
    - R9: 1 < 1 false → TRUE. R10: 1 < 1 false → **TRUE**.
    - Two consecutive rounds → **FIRED**.
  - A fired tripwire does not change the verdict — that stays mechanically derived from this round's finding
    set — it changes the recommendation: the fix cycle is churning at total 1 across three rounds, closing
    exactly one and introducing exactly one per round, both times inside hardening added to the same block.
- **Reading of the arithmetic.** The churn is localized and structural, not diffuse: since round 8 every
  finding has been in the gate-count pin, and both round-9 and round-10 commits closed their assigned finding
  completely (verified by execution both times) while introducing the next finding in the same way — by
  enumerating recognizable cases instead of failing closed on unrecognizable ones, and by not probing the
  hardening's edges to the standard the cycle applies to everything else. Two consecutive rounds of that
  identical shape in one ~20-line block is precisely the "foundational problem being patched" signature the
  tripwire exists to name. The foundation at fault is the pin's mechanism (lexing member forms out of source
  text), not the plugin, whose production artifacts have been finding-free since round 8.

---

## Recommended Priority

**The tripwire has fired: the indicated path is foundational rework of the gate-count pin — re-read the
sources, re-derive the approach, do not carry the failed attempt forward.** Another widen-the-lexer fix round
is forbidden over a fired tripwire, and the two rounds of identical churn are the evidence for why.

1. **Re-derive the pin's mechanism instead of patching its lexer.** The failed foundation is the premise that
   member forms can be enumerated from source text line by line. The file itself already contains the sound
   alternative, used by T-22/T-23/T-24x: extract the construct's source and **execute** it. Extract the `GATE`
   literal by brace-matching (the existing `braced` helper), evaluate it in isolation, and compare
   `Object.getOwnPropertyNames(obj).length` against the stated count word. Every member form — bare, quoted,
   computed, same-line, split, accessor, method, spread — is then counted by the language, the four
   false-greens become count mismatches, and the special-cased spread branch and comment stripping fall away.
   If execution of the literal is judged unacceptable for this block, the alternative foundation is strict
   fail-closed lexing: any depth-0 line the recognizer cannot classify as exactly one member turns the check
   red. Either way, the check's label must claim only what the mechanism delivers.
2. **Verify the rework by the full probe set, mechanically.** Must exit 1: `inline8`, `split8`, `getter8`,
   `method8`, `add8`, `sq8`, `dq8`, `ck8`, `sp8`, `six`, `ten`, `del1`, `fg1`, `fg2`. Must remain exit 0 at
   full green: the clean baseline and `cmtcolon`. All sixteen are specified exactly in this record's tables;
   run them in an isolated worktree before commit, and record the results in the commit message only after
   running them.
3. **Change nothing else.** The production artifacts are finding-free and re-verified consistent at seven
   across all six sites; the diff bound shows the last two commits touched only this pin. Scope the rework to
   the one block (and its T-20 allowlist entry if the label changes again).

---

Verdict: NEEDS FIXES (1 finding: 1 Minor)
