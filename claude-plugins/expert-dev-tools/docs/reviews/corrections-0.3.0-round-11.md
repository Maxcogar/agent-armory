# Independent review — corrections 0.3.0, round 11 (Post-fix, post-foundational-rework)

Artifact: commits `2b1b7d8` → `eeb51c2` on `claude/edt-corrections-0.3.0`, diffed against `origin/main`.
HEAD at review time: `eeb51c2894e56fd9b7c5fce88c5be39124ddeadc`.
Reviewer: independent (expert-review R1.2). Date: 2026-08-19.
Prior rounds: `corrections-0.3.0-round-01.md` (NEEDS FIXES, 9) through `…-round-10.md` (NEEDS FIXES, 1 Minor,
tripwire FIRED on both conditions). The prescribed foundational rework (replace the source-text lexer with
lift-and-evaluate) was applied in `eeb51c2`. **Per the tripwire's semantics, the gate-count-pin sub-loop's
convergence counters restart at that rework; this round evaluates the reworked pin fresh.**

---

## Scope and Inventory

Round 11 — Post-fix review. Inventory built per Step 2's post-fix rule from all four sources. Every premise
below was re-derived from current source at drafting time; nothing is inherited from the round-10 record,
which reached this review as a written document only (its probe prescriptions were re-executed, never cited
as evidence).

**Source 1 — the prior review's full inventory, re-verified:**

- [x] `claude-plugins/expert-dev-tools/tests/structural/check-structure.mjs` — the only file `eeb51c2`
  touched (`git diff --name-only 60d380f..eeb51c2` → exactly this file; `git show --stat eeb51c2` →
  +21/−20). Read at 96-121 (`braced`/`topKeys` helpers — `braced` returns the body *without* outer braces,
  `slice(start+1, i)`, so the `return {…}` wrap is well-formed), 415-465 (T-20 baseline capture — `git show
  HEAD:` of the file itself, so single-step supersession lookup is sufficient by construction), 457-514
  (the `REPLACED_BY_STRENGTHENING` allowlist with the new rework entry at index 0), 515-556 (the T-20 guard
  predicate and T-A2f self-tests, which parameterize over entry `[0]` — specimen is now the rework pair),
  and the rewritten pin block at 748-768 (via full read of the `60d380f..eeb51c2` diff plus Read at HEAD).
  Executed; mutation-probed twenty-two ways in an isolated worktree (tables below).
- [x] `claude-plugins/expert-dev-tools/workflows/expert-lifecycle.js` — Read at 50-84: comment at `:61-63`
  reads "The seven owner-gate types…"; the `GATE` literal at `:64-74` carries seven bare snake_case members.
  Runtime re-derivation this round: literal lifted by brace-matching and evaluated →
  `Object.getOwnPropertyNames` length **7**, names `intent, spec_traceable, business, risk_override,
  non_convergence, core_approval, control_fault`. `node --check` → clean. Unchanged by `eeb51c2` (diff bound).
- [x] `claude-plugins/expert-dev-tools/scripts/ledger.schema.json` — `gate_type` enum re-derived by loading
  the JSON: exactly the same **7** strings as the evaluated `GATE` member set (set equality, not just count).
- [x] `claude-plugins/expert-dev-tools/commands/expert.md` — `grep -c "seven"` → **2**. Unchanged by `eeb51c2`.
- [x] `claude-plugins/expert-dev-tools/docs/specs/spec-expert-dev-tools.md` — `grep -n "Control fault"` →
  `:136`, escalation item 7 present. Unchanged by `eeb51c2`.
- [x] `claude-plugins/expert-dev-tools/docs/arch/architecture-expert-dev-tools.md` — `grep -n "The seven gate
  types"` → `:232`. Unchanged by `eeb51c2`.
- [x] Branch-wide stale-text sweep, fresh this round: `grep -rn "six gate|six owner-gate|The six"` over the
  plugin (reviews excluded) → hits only in `docs/HANDOFF.md:72` (the unrelated "six 'flag once' clauses")
  and the two grandfathered plan files (`docs/plans/plan-expert-dev-tools-behavioral-remediation.md:1439`,
  `docs/plans/plan-expert-dev-tools.md:48`), whose exclusion is the recorded owner scoping decision at
  `docs/SESSION-STATE-corrections-0.3.0.md:33-36` (Read this round). `grep -rn "all member forms"` outside
  reviews → **2** hits, both inside `REPLACED_BY_STRENGTHENING` entries as `was:`/`now:` data (`:459`,
  `:468`) — exactly the allowlist-data shape the T-20 structural-presence rule handles.
- [x] `docs/SESSION-STATE-corrections-0.3.0.md`, `docs/SKILL-CHANGELOG.md` — `grep -n
  "gate-count|lexer|lift"` over both → 0 hits: neither narrates the pin's mechanism, so the rework left no
  stale doc claim there. All remaining round-10-inventory files (`.claude-plugin/plugin.json`, the three
  agent files, the three skill files) verified unchanged by the diff bound: `git diff --name-only
  60d380f..eeb51c2` returns exactly one path, and none of these are it.

**Source 2 — fix-diff files (`60d380f..eeb51c2`):** `tests/structural/check-structure.mjs` only. Two hunks:
the new allowlist entry at index 0 (`:458-465`) and the rewritten pin (`:751-768`): `braced` lift, strict-mode
`new Function` evaluation inside try/catch, `memberCount` initialized to **−1** and only assigned from
`Object.getOwnPropertyNames(obj).length` on successful evaluation, check requires
`memberCount > 0 && !!stated && words[stated[1]] === memberCount`.

**Source 3 — dependents of the fix-diff file:** the structural tier is an entry point with no importers; its
consumers are the run itself and the T-20/T-A2f self-guards inside the same file, both Read and executed.
The unit tier shares no code with the changed block; executed anyway (17/17).

**Source 4 — the prior review's single finding as a closure item:** F10-1 — re-derived by executing round
10's exact prescribed verification (all sixteen probes), not by reading the fix. Results below.

**Supporting:**

- [x] `git status --porcelain claude-plugins/expert-dev-tools` → only the untracked round-09/round-10 review
  records, before and after all probing. **All twenty-two mutations ran in a detached `git worktree` at
  `eeb51c2` (`C:/Users/maxco/AppData/Local/Temp/w11`), never in the repository working tree.** The pristine
  file was restored after each mutation (verified by byte comparison, `restored=true`); the worktree was
  removed and pruned after the review.
- [x] The authorizing inputs named in the round-01 record (session outputs outside version control) —
  **unpinnable citation**, path and date 2026-08-17. No finding rests on their content.

### Tool plan (Step 3)

| Claim type | Instrument | Used for |
|---|---|---|
| Literal-content | Read at file:line | the rewritten pin block; the allowlist entry; the T-20 baseline capture and guard predicate; the `braced` helper; the `GATE` literal and comment |
| Absence | grep with recorded query + count | the diff bound; stale-text sweeps ("six gate", "all member forms", "gate-count|lexer|lift"); label occurrence counts |
| Behavioral (the pin refuses; tiers pass) | test-runner execution + twenty-two mutation probes in an isolated worktree | both tiers at HEAD; round 10's sixteen prescribed probes; six self-constructed probes against the evaluation-based counter |
| Structural / dataflow | brace-matched extraction + evaluation of the literal in isolation | the `GATE` runtime member count at HEAD (7) and in every mutant — each probe row carries `getOwnPropertyNames`, `getOwnPropertySymbols`, and `Reflect.ownKeys` counts plus prototype-chain reachability, so every green/red is checked against independent runtime truth |
| Imported from prior documents | re-derivation from current source | round 10's probe prescriptions re-executed; the seven-gate consistency re-derived per file above; the tripwire-restart semantics taken from the dispatch and applied to fresh counters |
| Comment claims inside the artifact | re-derivation by probe | the new label's claim "matches the evaluated GATE literal (fail-closed on unevaluable)" — probed twenty-two ways; the commit message's "Probed nine ways… clean passes 235/235" and "Structural 235/235, unit 17/17" — re-executed and confirmed |

No library-behavior claims arise (the one ECMAScript-semantics claim — `getOwnPropertyNames` excludes
symbol keys; `__proto__:` in a literal creates no own property — was promoted from inference to fact by
probe execution, not asserted from memory). No instrument class was unavailable. `metacognitivemonitoring`
was invoked at review start, before any finding was drafted; it flagged the evasion candidates and the
`memberCount = −1` claim as inferences requiring execution, and all were resolved by probe.
`collaborativereasoning` was invoked before the gates and succeeded on the second call (the first was
rejected for the known persona communication-enum validation error, not an infrastructure failure). No
rigor waivers.

**Harness incident, disclosed:** the first `del1` probe run came back green because the harness's deletion
pattern was CRLF-blind (the repo file uses CRLF endings; the `\n`-anchored replace matched nothing, so the
"mutant" was the pristine file — confirmed by the probe's own independent literal evaluation showing 7
members). The harness was fixed (`\r?\n`), the mutation re-verified as applied, and `del1` re-run: exit 1
with the single named T-24 failure. A harness that evaluates each mutant's literal independently is what
caught this; the incident is a false alarm resolved, not a pin defect.

### Execution results at HEAD

- **Structural tier**: `node tests/structural/check-structure.mjs` → `STRUCTURAL TESTS PASSED`, exit 0,
  **235** `ok` lines. Matches `eeb51c2`'s "Structural 235/235" (label replaced via allowlist, count unchanged).
- **Unit tier**: `node tests/unit/run-unit-tests.mjs` → `UNIT TESTS PASSED`, exit 0, **17** `ok`.
- **Syntax**: `node --check workflows/expert-lifecycle.js` → clean.
- **Worktree baseline**: exit 0, 235 `ok` before any mutation.

### Round 10's prescribed probe set — F10-1 closure verification

All in the detached worktree at `eeb51c2`, each applied to the pristine file, syntax-checked
(`node --check` OK for every mutant), independently evaluated for runtime truth, and reverted after.
Round 10 prescribed: fourteen probes must exit 1; the clean baseline and `cmtcolon` must remain exit 0 at
full green; the four round-10 false-greens must fail via count mismatch.

| # | Mutation | Runtime members (names/ownKeys) | Tier | Named failure |
|---|---|---|---|---|
| **inline8** | eighth member appended to the `core_approval` line | 8/8 | **exit 1**, 234 ok | `T-24 gate-count comment matches the evaluated GATE literal (fail-closed on unevaluable)` — sole failure |
| **split8** | key and colon on separate lines | 8/8 | **exit 1** | same, sole failure |
| **getter8** | `get extra_gate() { return 'extra_gate' },` | 8/8 | **exit 1** | same, sole failure |
| **method8** | `extra_gate() { return 'extra_gate' },` | 8/8 | **exit 1** | same, sole failure |
| add8 | eighth bare member | 8/8 | **exit 1** | same, sole failure |
| sq8 | `'extra-gate':` single-quoted key | 8/8 | **exit 1** | same |
| dq8 | `"extra_gate":` double-quoted key | 8/8 | **exit 1** | same |
| ck8 | `['extra_gate']:` computed key | 8/8 | **exit 1** | same |
| sp8 | `...{ extra_gate: 'extra_gate' },` inline spread | 8/8 | **exit 1** | same (evaluates; count mismatch 8≠7) |
| six | comment reverted to "The six owner-gate types" | 7/7 | **exit 1** | same |
| ten | comment word outside the map ("ten") | 7/7 | **exit 1** | same (fail-closed on an unmapped word) |
| del1 | `core_approval` member deleted (CRLF-safe re-run) | 6/6 | **exit 1** | same |
| fg1 | `weird: 'a}b',` plus an eighth member | eval throws (truncated body) | **exit 1** | same — fail-closed |
| fg2 | eighth member `extra_gate: 'x{y}z',` | 8/8 (balanced braces evaluate) | **exit 1** | same — count mismatch |
| baseline | none | 7/7 | **exit 0, 235 ok** | none — correct |
| cmtcolon | in-literal comment reworded to begin `// Note: …` | 7/7 | **exit 0, 235 ok** | none — correct (comments are legal inside the evaluated literal; no stripping needed) |

All fourteen required reds are red — each with the **single** named T-24 failure — including all four of
round 10's false-greens, now failing via count mismatch exactly as the rework's mechanism predicts. Both
required greens are green. **F10-1 is closed against its originally named standard.**

### Self-constructed probes against the evaluation-based counter

| # | Mutation | Runtime truth | Tier | Reading |
|---|---|---|---|---|
| extspread | `...EXTRA_GATES,` external-reference spread | eval: `ReferenceError: EXTRA_GATES is not defined` | **exit 1** | fail-closed path exercised: the catch leaves `memberCount = −1`, and `memberCount > 0` refuses — **−1 can never satisfy the check** (guard is `> 0`, and the count-word map's values are 6–9, so `words[…] === −1` is doubly unreachable) |
| freeid | `extra_gate: SOME_CONST,` free identifier value | eval: `ReferenceError` | **exit 1** | fail-closed, same path |
| strbrace | `extra_gate: '}',` — a `}` inside a string defeats the brace-matcher | truncated body → `SyntaxError` on eval | **exit 1** | `braced` is not string-aware, but every truncation/extension a string-embedded brace causes puts the appended `};` in an invalid position, so the weakness collapses to fail-closed (fg1 confirms the truncation direction, fg2 the balanced case) |
| rename | `const GATE = {` anchor removed (const renamed) | `indexOf` → −1 → `braced` lifts from the file's first `{` → junk evaluation | **exit 1** (T-24 evaluated check red, plus the `GATE.control_fault` deployment check) | fail-closed on a missing anchor |
| **sym8** | `[Symbol('extra_gate')]: 'extra_gate',` computed symbol key | `getOwnPropertyNames` **7**, `getOwnPropertySymbols` **1**, `Reflect.ownKeys` **8** | **exit 0, 235 ok — false green** | grounds F11-1 |
| proto8 | `__proto__: { extra_gate: 'extra_gate' },` | own members **7** (a literal's `__proto__:` sets the prototype, creates no own property — verified by evaluation); `GATE.extra_gate` reachable via the chain | **exit 0, 235 ok** | **not a finding** — the evaluated literal genuinely has seven members, so the check's claim holds; recorded as an observation |

---

## Summary

**This review returns NEEDS FIXES**, on one Minor finding. The foundational rework held: F10-1 is closed
exactly as round 10 prescribed — all fourteen required probes turn the tier red with the single named
failure, the four forms that evaded the lexer now fail via count mismatch, everything unevaluable in
isolation (external-reference spread, free identifier, brace-in-string truncation, missing anchor) throws
and fails closed through the `memberCount = −1` path, which can never satisfy the `> 0` check, and the
clean baseline and colon-bearing-comment control both stay green at 235/235 structural and 17/17 unit. The
rework is the mechanism round 10's Recommended Priority specified, implemented faithfully, with the label
strengthening recorded through the T-20 allowlist discipline and no claim in the new label that the probes
falsify — with one narrow exception. The language API chosen to enumerate the evaluated literal's members,
`Object.getOwnPropertyNames`, excludes symbol-keyed properties, so a computed-symbol eighth member is a
genuine eighth own member of the evaluated literal (`Reflect.ownKeys` → 8, verified by execution) that
leaves the tier green while the comment says seven. That is the same strict standard this lineage applied
in rounds 9 and 10 — a control must refuse for the condition its label claims to cover — at far smaller
blast radius: the form cannot express a consumable gate type (gate types flow as string keys and string
enum values), and the fix is a one-token API substitution within the rework's own foundation, not another
mechanism change. The sub-loop's counters restarted at the rework, this is post-rework round 1, and the
tripwire cannot fire on a one-round history. The production artifacts remain finding-free and consistent
at seven gates across all sites, re-derived fresh this round.

---

## Upstream Contract Verification

The upstream contracts are the five owner-approved correction drafts, the round-10 review (as the
remediation contract for `eeb51c2`, including its Recommended Priority's prescribed mechanism and probe
set), spec §3.4, and the architecture's SEGMENT_REPORT protocol. The prior finding is checked against the
standard originally named for it.

| Prior finding | Originally named standard | Status | Verification method |
|---|---|---|---|
| **F10-1** (the strengthened lexer still failed open on member forms it could not see — inline-appended, split-line, getter, method shorthand — while its label claimed "all member forms"; `tests/structural/check-structure.mjs:743-767` at `60d380f`) | a control must refuse for the condition it claims to cover | **CLOSED** | By execution of round 10's own prescribed verification: `inline8`, `split8`, `getter8`, `method8` each exit 1 via count mismatch with the single named failure; `add8`, `sq8`, `dq8`, `ck8`, `sp8`, `six`, `ten`, `del1`, `fg1`, `fg2` all remain exit 1; the clean baseline and `cmtcolon` remain exit 0 at full green. Mechanism verified by Read of the rewritten block: the lexer is gone; the literal is lifted (`braced`, `:758`) and evaluated in strict isolation (`:760-763`), the language enumerates its own member forms, and unevaluable bodies leave `memberCount = −1` (`:759`), refused by `memberCount > 0` (`:766-767`). The label no longer claims "all member forms"; it claims evaluation with fail-closed on unevaluable, which the probes confirm — up to the symbol-key exception filed as F11-1. The rework followed round 10's prescribed foundational path (lift-and-evaluate), not another lexer widening. |
| **Round 10's prescribed acceptance probe set** (sixteen probes with exact required outcomes) | delivery-with-the-test-that-demonstrates-it | **HONORED** | All sixteen re-executed this round with the required outcomes (tables above); the commit message's probe claims re-derived by execution and confirmed. |

**Acceptance criteria / architecture decisions governing this scope.** Spec §3.4 and the SEGMENT_REPORT
protocol govern nothing in this fix (one test file); the seven-gate invariant was nonetheless re-derived
fresh across all sites (inventory above) — evaluated producer literal 7 with the exact member set, schema
enum the same 7 strings (set equality), spec item 7 present, architecture invariant present, command doc 2
"seven" statements, no stale "six gate" text outside the two grandfathered plan files covered by the
recorded owner scoping decision — all **honored**.

---

## Critical & Serious Findings

**No Critical or Serious findings** — the full inventory was Read or Grep-verified per Compliance Gate B,
and no violations of Critical or Serious classification were observed. The one open item is classified
Minor below, with the reasoning stated in the finding.

---

## Systemic Patterns

**No systemic patterns.** Proactive scans:

- `git diff --name-only 60d380f..eeb51c2` → **1 file**; the rework introduced no collateral change.
- `grep -c "T-24 gate-count comment matches the evaluated GATE literal (fail-closed on unevaluable)"
  tests/structural/check-structure.mjs` → **2** (allowlist `now:` field at `:460`, `check(` position at
  `:766`) — the shape the T-20 structural-presence rule requires.
- `grep -rn "all member forms"` outside reviews → **2**, both allowlist data (`:459`, `:468`); the
  overclaiming label survives nowhere in `check(` position.
- The enumerate-instead-of-fail-closed shape that defined the fired tripwire (rounds 9–10) is structurally
  absent from the rework: the counter no longer enumerates recognizable member forms at all — the language
  does — and the only enumeration choice left (which property-key API) is the subject of F11-1, a
  completeness choice within a sound mechanism, not a recognizer that silently skips what it cannot parse
  (everything unparseable now throws, verified by four fail-closed probes).

---

## Moderate & Minor Findings

**No Moderate findings** — the sole candidate resolved to Minor on the evidence below.

### F11-1 — The evaluated count uses `Object.getOwnPropertyNames`, so a symbol-keyed member is an own member of the evaluated literal that the check does not count
**Location:** `claude-plugins/expert-dev-tools/tests/structural/check-structure.mjs:751-768`
**Severity:** Minor
**Provenance:** **new** — the counting-API choice was introduced by `eeb51c2`; no prior round reported it,
and it is not the F9-1/F10-1 recurrence shape (nothing is lexed; nothing unparseable is skipped).

**What the code does now.** The pin evaluates the lifted `GATE` literal and counts
`Object.getOwnPropertyNames(obj).length` (`:762`), which by ECMAScript semantics returns string-keyed own
properties only. A computed-symbol member — `[Symbol('extra_gate')]: 'extra_gate',` — is a genuine eighth
own member of the evaluated literal, invisible to that count.

**How that claim was verified.** By execution in the detached worktree: probe `sym8` syntax-checks, the
mutated literal independently evaluates to `getOwnPropertyNames` **7**, `getOwnPropertySymbols` **1**,
`Reflect.ownKeys` **8**, and the tier runs **exit 0, 235 ok** with the comment still stating seven.
Contrast: the fourteen red probes above, same harness, all exit 1. Mechanism established by Read of
`:758-767`, not inferred from the probe alone.

**Standard violated.** The lineage's standard for this pin — a control must refuse for the condition its
label claims to cover. The label claims the comment "matches the evaluated GATE literal"; under `sym8` the
evaluated literal has eight own members and the check passes at seven. The strict reading of exactly such
label claims is the reading rounds 9 and 10 applied (F9-1, F10-1); applying a looser one now would be
inconsistency, not judgment.

**Why Minor.** Verified bounds: a symbol-keyed member cannot express a consumable gate type — the script's
consumers reach gates as `GATE.<identifier>` and as string values matching the schema's string `gate_type`
enum (both re-derived this round), so the evading form is not a plausible spelling of "add a gate type" the
way round 10's `inline8` was; the label, unlike round 10's, makes no "all member forms" overclaim — the gap
is between "the evaluated literal" and "its string-keyed members," a distinction one token wide; and every
other constructed adversarial form fails closed. Nothing currently in the repository is wrong.

**Correct implementation.** Replace `Object.getOwnPropertyNames(obj).length` with
`Reflect.ownKeys(obj).length` — the complete own-member enumeration (string and symbol keys) of the same
evaluated object; the mechanism, the try/catch, the `−1` sentinel, and the label all stand unchanged, so no
T-20 allowlist entry is needed. Verification: `sym8` must exit 1 via count mismatch 8≠7; all fourteen red
probes above must remain exit 1; the clean baseline and `cmtcolon` must remain exit 0 at 235; `proto8`
correctly remains green (`Reflect.ownKeys` → 7 — the prototype set by a literal's `__proto__:` is not an
own member, verified by evaluation this round).

---

## Tentative Findings

**No tentative findings** — every candidate finding's premise was verified per Compliance Gate B. The
round-01 authorizing inputs remain outside version control, cited by path and date (2026-08-17) with their
unpinnable status stated; no finding rests on them.

---

## Observations

- **`proto8` is green and correctly so.** A literal's `__proto__: {…}` member sets the prototype and
  creates no own property (verified by evaluation: own members 7), so the check's claim holds; but
  `GATE.extra_gate` does become reachable through the chain at runtime. Outside the pin's literal-count
  invariant; no standard violated. Recorded so a future round does not rediscover it as a surprise, and
  because `Reflect.ownKeys` (the F11-1 fix) intentionally leaves it green.
- **The `braced` helper is not string- or comment-aware, and that is currently safe here.** Any brace a
  string smuggles in truncates or extends the lifted body such that the appended `};` lands in an invalid
  position, producing a `SyntaxError` and the fail-closed path — exercised by `strbrace` and `fg1`
  (truncation, red) and `fg2` (balanced braces evaluate, count mismatch, red). A construction that
  truncates to a *valid* seven-member body was attempted and appears impossible because the cut character
  is necessarily inside the string or comment. On the record as the boundary of what was probed.
- **The count-word map still covers six through nine only, failing closed on an unmapped word** —
  re-verified this round by probe `ten` (exit 1). Same disposition as rounds 9–10: correct for a pin.
- **The T-A2f self-test specimen changed again.** The rework's allowlist entry landed at
  `REPLACED_BY_STRENGTHENING[0]`, and T-A2f's `OLD_LABEL`/`NEW_LABEL` read entry `[0]` (`:545-546`), so the
  specimen is now the rework pair. The tests are parameterized over the entry and exercise the same guard
  predicate — tier green at 235, and the T-20/T-A2f cases executed in every probe run.
- **Review records round-09 and round-10 are untracked at review time** (`git status --porcelain` → both
  `??`), and this round-11 record will be too (the reviewer is directed to commit nothing). Rounds 01–08
  are committed on the branch. Not a finding against the commits under review; recorded so PR assembly
  includes the complete lineage the convergence arithmetic rests on.
- **The rework commit message's claims all re-derived true**: "Probed nine ways" (its nine named probes are
  a subset of this round's twenty-two, all with the outcomes it states), "clean passes 235/235",
  "Structural 235/235, unit 17/17".

---

## What's Actually Good

- **The rework is the prescribed foundation, implemented without residue.** Round 10 prescribed
  lift-and-evaluate with `Object.getOwnPropertyNames` against the stated word; `eeb51c2` implements exactly
  that, deletes the lexer entirely (no vestigial `memberRe`, spread branch, or comment stripping — Read of
  the diff), and the four probes that defined the churn now fail via the mechanism's native path. Good by
  the fired-tripwire routing standard: re-derive the mechanism, do not carry the failed attempt forward —
  verified by Read and twenty-two executions.
- **The fail-closed path is genuine and total for unevaluable forms.** `memberCount` starts at −1, is
  assigned only on successful strict-isolation evaluation, and the check demands `> 0` — four distinct
  unevaluable constructions (external spread, free identifier, string-brace truncation, missing anchor) all
  refused. Good by the fail-safe defaults principle (Saltzer & Schroeder): what cannot be verified is
  refused, not assumed.
- **The label now claims what the mechanism delivers** — "matches the evaluated GATE literal (fail-closed
  on unevaluable)" — and twenty-one of twenty-two probes confirm it; the one exception is one token from
  closure and is filed. Good by the standard that a control's name is a contract, the very standard whose
  violation drove rounds 9–10.
- **The T-20 allowlist discipline held through a second supersession of the same check.** The entry names
  the exact old label, exact new label, and the tripwire rework that forced it (`:458-465`); the retired
  label survives only as allowlist data (grep: 2 hits, both data); and the baseline-is-HEAD design makes
  single-step supersession sufficient by construction (Read `:426-428`). Verified by Read, grep, and the
  self-tests executing green.

---

## Convergence Record

- **Round number:** 11 (tenth Post-fix round; **first post-rework round of the gate-count-pin sub-loop**).
- **Restart, stated explicitly:** round 10 FIRED the non-convergence tripwire on both conditions for the
  gate-count-pin sub-loop, routing to foundational rework. That rework was applied in `eeb51c2`. Per the
  tripwire's semantics, the sub-loop's counters restart at the rework: rounds 9–10's flow counts belong to
  the abandoned lexer foundation and do not accumulate against the reworked mechanism. This round evaluates
  the new foundation fresh, at post-rework round 1.
- **Trajectory (full cycle, for the record):** R1: 9 → R2: 7 → R3: 5 → R4: 5 → R5: 4 → R6: 3 → R7: 3 →
  R8: 1 → R9: 1 → R10: 1 (tripwire FIRED; rework) → **R11: 1 (1 Minor)**.
- **Flow counts for this round:**
  - Prior findings **closed**: **1** — F10-1, against its originally named standard, by executing round
    10's own prescribed sixteen-probe verification.
  - **New**: **1** — F11-1, a counting-API completeness gap inside the reworked mechanism.
  - **Regressions**: **0** — all fourteen red-required probes red, both green-required controls green, unit
    tier 17/17, diff bound confirms no file outside the test tier changed.
  - Reconciliation: 1 prior − 1 closed = 0 carried; 0 + 1 new + 0 regression = **1**.
- **Tripwire evaluation — NOT FIRED (cannot fire this round), with the arithmetic shown.** Both conditions
  require two consecutive Post-fix rounds *of the same fix cycle*; the restart makes this post-rework round
  1, so no two-round history exists on either condition. Shown anyway, both provenance readings:
  - **(a)** new + regression ≥ closed. Primary (F11-1 new): 1 + 0 = 1 ≥ 1 → TRUE at R11. Recurring reading
    is not defensible here (F11-1 is not the lexer's skip-what-you-cannot-parse class; the mechanism
    changed), but even under it: 0 + 0 = 0 ≥ 0 → TRUE. Either way: **one** post-rework round of history —
    condition needs two → **not fired**. R11 arms the condition for round 12.
  - **(b)** total not strictly decreased. Post-rework totals: R11 = 1, no prior post-rework total to
    compare → **not fired**. (Against pre-rework R10's total of 1 the total is flat; the restart is exactly
    why that comparison does not count against the new foundation.)
  - **What would re-fire it:** a round-12 fix that closes F11-1 while introducing ≥1 new/regression
    finding, or that leaves the total at 1. Given the fix is a one-token API substitution verified by an
    existing probe, a clean close is the expected outcome; if round 12 instead churns, the tripwire fires
    again and the finding is that the rework itself was the wrong foundation.
- **Reading of the arithmetic.** The rework did what a foundation change is supposed to do: the four
  churn-defining probes moved from false-green to red via the mechanism's native path, four adversarial
  constructions fail closed, and the residual finding is a parameter of the new mechanism (which
  enumeration API), not a recurrence of the old one's class (silently skipping the unrecognizable). One
  round of evidence is not convergence, but it is the opposite of the two-round churn signature that fired
  the tripwire.

---

## Recommended Priority

1. **Close F11-1 with the one-token substitution**: `Reflect.ownKeys(obj).length` in place of
   `Object.getOwnPropertyNames(obj).length` at `tests/structural/check-structure.mjs:762`. No label change,
   no allowlist entry, no mechanism change — do not re-derive the foundation for this; the foundation is
   sound (twenty-one of twenty-two probes confirm it) and the gap is a parameter choice within it.
2. **Verify mechanically before commit**: `sym8` exits 1 via count mismatch; the fourteen red probes of
   this record's first table remain exit 1 with the single named failure; the clean baseline and `cmtcolon`
   remain exit 0 at 235 structural / 17 unit; `proto8` remains exit 0 (own members are still 7 under
   `Reflect.ownKeys`). Run in an isolated worktree; record results in the commit message only after running.
3. **At PR assembly, commit the review lineage**: rounds 09, 10, and 11 records are currently untracked;
   the branch's rounds-01–08 practice and the convergence arithmetic both want the complete series in the PR.

---

Verdict: NEEDS FIXES (1 finding: 1 Minor)
