# Independent review — corrections 0.3.0, round 12 (Post-fix, post-rework round 2 — final round before PR)

Artifact: commits `2b1b7d8` → `c0ed0fc` on `claude/edt-corrections-0.3.0`, diffed against `origin/main`.
HEAD at review time: `c0ed0fc0ce154b751a5f1139d5dd283f5977eaa8`.
Reviewer: independent (expert-review R1.2). Date: 2026-08-19.
Prior rounds: `corrections-0.3.0-round-01.md` (NEEDS FIXES, 9) through `…-round-11.md` (NEEDS FIXES, 1 Minor).
Round 11's single finding F11-1: the evaluated gate-count pin used `Object.getOwnPropertyNames`, which
excludes symbol keys. Post-rework counters at round 2 with tripwire condition (a) armed — this round fires
the tripwire unless F11-1 closes with zero new findings.

---

## Scope and Inventory

Round 12 — Post-fix review. Inventory built per Step 2's post-fix rule from all four sources. Every premise
was re-derived from current source at drafting time; the round-11 record reached this review as a written
document only — its probe prescriptions were re-executed, never cited as evidence.

**Source 1 — the prior review's full inventory, re-verified at `c0ed0fc`:**

- [x] `claude-plugins/expert-dev-tools/tests/structural/check-structure.mjs` — the only source file
  `c0ed0fc` touched. Read at 740-770: line 762 is now `memberCount = Reflect.ownKeys(obj).length;`; the
  lift (`braced`, `:758`), strict-isolation evaluation in try/catch (`:760-763`), `−1` sentinel (`:759`),
  count-word map and `memberCount > 0` guard (`:764-767`) all unchanged from `eeb51c2`. The label is
  unchanged (`git show c0ed0fc` → exactly one changed line in this file), so no T-20 allowlist entry was
  required and none was added. Executed; mutation-probed ten ways in an isolated worktree (table below).
- [x] `claude-plugins/expert-dev-tools/workflows/expert-lifecycle.js` — Read at 58-75: comment `:61-63`
  states "The seven owner-gate types"; `GATE` literal `:64-74`. Runtime re-derivation this round: literal
  lifted by brace-matching and evaluated → `Reflect.ownKeys` length **7**, exact names `intent,
  spec_traceable, business, risk_override, non_convergence, core_approval, control_fault`.
  `node --check` → clean. Unchanged by `c0ed0fc` (diff bound below).
- [x] `claude-plugins/expert-dev-tools/scripts/ledger.schema.json` — `gate_type` enum at `:112` re-derived
  by loading the JSON and walking for the enum containing `control_fault`: exactly the same **7** strings
  as the evaluated `GATE` member set (set equality verified programmatically, not just count).
- [x] `claude-plugins/expert-dev-tools/commands/expert.md` — `grep -c "seven"` → **2**. Unchanged by the
  diff bound.
- [x] `claude-plugins/expert-dev-tools/docs/specs/spec-expert-dev-tools.md` — `grep -n "Control fault"` →
  `:136`, escalation item 7 present. Unchanged by the diff bound.
- [x] `claude-plugins/expert-dev-tools/docs/arch/architecture-expert-dev-tools.md` — `grep -n "The seven
  gate types"` → `:232`. Unchanged by the diff bound.
- [x] Branch-wide stale-text sweep, fresh this round: `grep -rn "six gate|six owner-gate|The six"` over the
  plugin excluding `docs/reviews` → hits only in `docs/HANDOFF.md:72` and
  `docs/plans/plan-expert-dev-tools-behavioral-remediation.md` (the unrelated "six 'flag once'" clauses and
  "six agents"), `docs/plans/plan-expert-dev-tools.md:48` and
  `plan-expert-dev-tools-behavioral-remediation.md:1439` (the two grandfathered plan files — exclusion is
  the recorded owner scoping decision, re-Read this round at `docs/SESSION-STATE-corrections-0.3.0.md:33-36`),
  `docs/plans/plan-impl-remediation-r1.md:552` ("six strict-mode cases", unrelated),
  `docs/SESSION-STATE-corrections-0.3.0.md:33` (the correction instruction quoted as history), and
  `skills/expert-plan/references/output-contract.md:5` (a false positive: "The sixteen" matches the
  pattern prefix). No stale gate-count text anywhere in scope.
- [x] `.claude-plugin/plugin.json` — `grep -n "version"` → `"version": "0.3.0"` at `:3`. Unchanged by the
  diff bound, as are the three agent files, three skill files, `docs/SESSION-STATE-corrections-0.3.0.md`,
  and `docs/SKILL-CHANGELOG.md`: `git diff --name-only eeb51c2..c0ed0fc` returns exactly four paths
  (`check-structure.mjs` plus the three review records), and none of these are among them.

**Source 2 — fix-diff files (`eeb51c2..c0ed0fc`):** four paths. (1) `tests/structural/check-structure.mjs`
— a one-line, one-token change: `Object.getOwnPropertyNames(obj).length` → `Reflect.ownKeys(obj).length`
at `:762`, exactly round 11's prescribed correct implementation, with no label change, no mechanism change,
no allowlist entry (Read of the full commit diff). (2-4) `docs/reviews/corrections-0.3.0-round-09.md`,
`-round-10.md`, `-round-11.md` — the previously untracked review records committed for PR assembly, per
round 11's Recommended Priority item 3. The round-11 record as committed is the record this review's
closure item was taken from (Read in full at HEAD; working tree clean, so tracked content is what was read).

**Source 3 — dependents of the fix-diff files:** the structural tier is an entry point with no importers;
its consumers are the run itself and the in-file self-guards, both executed. The review records have no
code dependents. The unit tier shares no code with the changed line; executed anyway (17/17).

**Source 4 — the prior review's single finding as a closure item:** F11-1 — re-derived by executing round
11's exact prescribed verification (sym8 red via count mismatch; the red probe set sampled; clean,
`cmtcolon`-equivalent baseline, and proto8 green), plus four further enumeration-evasion attempts
constructed fresh this round. Results below.

**Supporting:**

- [x] `git status --porcelain claude-plugins/expert-dev-tools` → empty, before and after all probing.
  **All ten mutations ran in a detached `git worktree` at `c0ed0fc`
  (`C:/Users/maxco/AppData/Local/Temp/w12`), never in the repository working tree.** The pristine file was
  restored after each mutation (byte comparison, `restored=true` on every row); the worktree was removed
  and pruned after the review.
- [x] The authorizing inputs named in the round-01 record (session outputs outside version control) —
  **unpinnable citation**, path and date 2026-08-17. No finding rests on their content.

### Tool plan (Step 3)

| Claim type | Instrument | Used for |
|---|---|---|
| Literal-content | Read at file:line | the pin block at `:758-767`; the `GATE` literal and comment; the commit diff; the schema enum line |
| Absence | grep with recorded query + count | the diff bound (4 paths); stale-text sweep; "seven" counts; version pin |
| Behavioral (the pin refuses; tiers pass) | test-runner execution + ten mutation probes in an isolated worktree | both tiers at HEAD; the round-11 closure probes; four fresh evasion attempts |
| Structural / dataflow | brace-matched extraction + evaluation of the literal in isolation | the `GATE` runtime member count at HEAD (7, exact names) and in every mutant — each probe row carries `getOwnPropertyNames`, `getOwnPropertySymbols`, and `Reflect.ownKeys` counts plus `'extra_gate' in obj` reachability, so every green/red is checked against independent runtime truth |
| Imported from prior documents | re-derivation from current source | round 11's probe prescriptions re-executed; the seven-gate consistency re-derived per file above; the owner scoping decision re-Read |
| Comment claims inside the artifact | re-derivation by probe | the label "matches the evaluated GATE literal (fail-closed on unevaluable)" — probed ten ways; the commit message's "sym8 turns the tier red; clean passes 235/235" and "Structural 235/235, unit 17/17" — re-executed and confirmed; the F8-1 class-closure comment at `:748-750` — re-derived against the F8-1 commit (`5b6ea91` message and diff Read: the class is stale count text vs literal count, which the pin covers) |

No library-behavior claims were asserted from memory: the two ECMAScript-semantics claims in play
(`Reflect.ownKeys` includes symbol and non-enumerable own keys; spread copies enumerable own keys only,
including symbols) were promoted from inference to fact by probe execution (`sym8`, `wksym8`, `symspread8`,
`nonenumspread` rows below). No instrument class was unavailable. `metacognitivemonitoring` was invoked at
review start, before any finding was drafted; it flagged the tier results, sym8's disposition, and every
evasion candidate as inferences requiring execution, and all were resolved by execution.
`collaborativereasoning` was invoked before the gates and succeeded on the second call (the first was
rejected for the known persona communication-enum validation error, not an infrastructure failure). No
rigor waivers.

### Execution results at HEAD

- **Structural tier**: `node tests/structural/check-structure.mjs` → `STRUCTURAL TESTS PASSED`, exit 0,
  **235** `ok` lines.
- **Unit tier**: `node tests/unit/run-unit-tests.mjs` → `UNIT TESTS PASSED`, exit 0, **17** `ok`.
- **Syntax**: `node --check workflows/expert-lifecycle.js` → clean.
- **Worktree baseline**: exit 0, 235 `ok` before any mutation.

### Probe table — F11-1 closure and fresh evasion attempts

All in the detached worktree at `c0ed0fc`, each applied to the pristine file, syntax-checked (`node --check`
OK for every mutant), independently evaluated for runtime truth (names/symbols/ownKeys/reachability), and
reverted after (restore verified by byte comparison, every row).

| # | Mutation | Runtime truth (names/syms/ownKeys) | Tier | Reading |
|---|---|---|---|---|
| clean | none | 7/0/7 | **exit 0, 235 ok** | baseline green — correct |
| **sym8** | `[Symbol('extra_gate')]: 'extra_gate',` | 7/1/**8** | **exit 1, 234 ok** — sole failure `T-24 gate-count comment matches the evaluated GATE literal (fail-closed on unevaluable)` | **F11-1 closed**: the exact round-11 false-green now red via count mismatch 8≠7 |
| add8 | eighth bare member | 8/0/8 | **exit 1**, same sole failure | round-11 red probe still red — no regression |
| extspread | `...EXTRA_GATES,` external-reference spread | eval throws `ReferenceError` | **exit 1**, same sole failure | fail-closed path intact — no regression |
| proto8 | `__proto__: { extra_gate: 'extra_gate' },` | 7/0/7 (own members genuinely 7; `extra_gate` reachable via chain) | **exit 0, 235 ok** | correctly green per round 11's prescription — `Reflect.ownKeys` intentionally leaves it green |
| wksym8 | `[Symbol.iterator]: 'extra_gate',` well-known symbol key | 7/1/**8** | **exit 1**, same sole failure | fresh evasion attempt — refused |
| symspread8 | `...{ [Symbol('extra_gate')]: 'extra_gate' },` symbol key via inline spread | 7/1/**8** | **exit 1**, same sole failure | fresh evasion attempt — refused (spread copies enumerable own symbol keys) |
| nonenumspread | `...Object.defineProperties({}, { extra_gate: { value: 'extra_gate', enumerable: false } }),` | 7/0/7, `extra_gate` NOT reachable | **exit 0, 235 ok** | green and **truthful**: spread skips non-enumerable keys, so the runtime literal genuinely has seven own members and no reachable `extra_gate` — not an evasion |
| globspread | `...(globalThis.__EXTRA_GATES__ \|\| {}),` | 7/0/7 | **exit 0, 235 ok** | green and truthful in any clean environment: the pin's evaluation and the module's runtime see the same globals, so the counts cannot diverge without a poisoned global — recorded as an observation, below |
| dup7 | second `core_approval:` line (duplicate key, shadowing value) | 7/0/7 | **exit 0, 235 ok** | green and truthful: duplicate literal keys collapse to seven own members; value integrity is outside the count label — observation below |

Required outcomes, all met: `sym8` red via count mismatch with the single named failure; the sampled
round-11 red set (`add8`, `extspread`) still red; `clean` and `proto8` green at 235. No construction was
found that adds a runtime-reachable eighth own member to the evaluated literal while leaving the tier
green. **F11-1 is closed against its originally named standard.**

---

## Summary

**This review returns PASS.** The one-token substitution round 11 prescribed —
`Reflect.ownKeys(obj).length` in place of `Object.getOwnPropertyNames(obj).length` at
`tests/structural/check-structure.mjs:762` — was applied exactly as specified: no label change, no
mechanism change, no allowlist entry, a two-line diff in one source file. Executed verification confirms
the closure: the round-11 false-green `sym8` now turns the tier red via count mismatch 8≠7 with the single
named T-24 failure; the sampled red set stays red; the fail-closed path still throws and refuses; the clean
baseline and `proto8` stay green; both tiers pass at HEAD (structural 235/235, unit 17/17). Four fresh
enumeration-evasion attempts against `Reflect.ownKeys` were constructed and executed — well-known symbol
key and symbol-via-spread are refused; the two constructions that stay green (`nonenumspread`, `dup7`) are
green *truthfully*, because the evaluated literal genuinely has seven own members in each. The production
artifacts remain finding-free and consistent at seven gates across all sites, re-derived fresh this round
(evaluated literal, schema enum set equality, spec, architecture, command doc, stale-text sweep). Zero
findings of any severity; every prior finding in the twelve-round lineage is closed against its originally
named standard. The tripwire condition armed at round 11 did not fire: this round closed one and
introduced zero.

---

## Upstream Contract Verification

The upstream contracts are the five owner-approved correction drafts, the round-11 review (as the
remediation contract for `c0ed0fc`, including its prescribed fix and verification set), spec §3.4, and the
architecture's SEGMENT_REPORT protocol.

| Prior finding | Originally named standard | Status | Verification method |
|---|---|---|---|
| **F11-1** (the evaluated count used `Object.getOwnPropertyNames`, so a symbol-keyed member was an own member of the evaluated literal the check did not count; `tests/structural/check-structure.mjs:751-768` at `eeb51c2`) | a control must refuse for the condition its label claims to cover | **CLOSED** | By execution of round 11's own prescribed verification: `sym8` exits 1 via count mismatch (independent runtime truth `Reflect.ownKeys` = 8) with the single named failure; `add8` and `extspread` remain exit 1; `clean` remains exit 0 at 235; `proto8` remains exit 0 with own members 7. Mechanism verified by Read of `:758-767`: only the enumeration API changed; try/catch, `−1` sentinel, count-word map, and label all stand. The fix is the exact one-token substitution round 11's Correct Implementation specified. |
| **Round 11's prescribed verification set** (sym8 red; red set stays red; baseline and proto8 green; isolated worktree; commit message records results) | delivery-with-the-test-that-demonstrates-it | **HONORED** | All re-executed this round with the required outcomes (probe table above); the commit message's claims re-derived by execution and confirmed; probing was performed in a detached worktree with restore verification. |
| **Round 11's Recommended Priority item 3** (commit the untracked round-09/10/11 review records at PR assembly) | complete lineage for the convergence arithmetic | **HONORED** | `git show c0ed0fc --stat` → the three records committed (+1233 lines); `git status` clean, so the tracked round-11 record is the document this review's closure item was taken from. |

**Acceptance criteria / architecture decisions governing this scope.** Spec §3.4 and the SEGMENT_REPORT
protocol govern nothing in this fix (one line in one test file plus three review documents); the seven-gate
invariant was nonetheless re-derived fresh across all sites — evaluated producer literal 7 with the exact
member set, schema enum the same 7 strings (set equality verified programmatically), spec item 7 at `:136`,
architecture invariant at `:232`, command doc 2 "seven" statements, no stale gate-count text outside the
two grandfathered plan files covered by the recorded owner scoping decision
(`docs/SESSION-STATE-corrections-0.3.0.md:33-36`, re-Read) — all **honored**.

---

## Critical & Serious Findings

**No Critical or Serious findings** — the full inventory was Read or Grep-verified per Compliance Gate B,
and no violations of Critical or Serious classification were observed.

---

## Systemic Patterns

**No systemic patterns.** Proactive scans:

- `git diff --name-only eeb51c2..c0ed0fc` → **4 paths** (one source line, three review documents); the fix
  introduced no collateral change.
- The retired-label discipline: the label did not change, so no new allowlist entry was required —
  verified by Read of the full commit diff (exactly one changed line in `check-structure.mjs`).
- The enumerate-instead-of-fail-closed shape that fired the round-10 tripwire remains structurally absent:
  the language enumerates the evaluated literal's own keys via the complete API (`Reflect.ownKeys`), and
  everything unevaluable still throws into the `−1` fail-closed path (probe `extspread`, exit 1).

---

## Moderate & Minor Findings

**No Moderate or Minor findings** — verified by the full inventory pass above: both tiers executed green at
HEAD, the ten-probe table's greens are all truthful against independent runtime evaluation, the seven-gate
invariant re-derived consistent across every site, and the fix-diff Read in full.

---

## Tentative Findings

**No tentative findings** — every candidate finding's premise was verified per Compliance Gate B. The
round-01 authorizing inputs remain outside version control, cited by path and date (2026-08-17) with their
unpinnable status stated; no finding rests on them.

---

## Observations

- **`dup7` is green and truthfully so, and value integrity is outside the pin's label.** A duplicate
  `core_approval:` line collapses to seven own members (verified by evaluation), so the count claim holds;
  but the later value wins at runtime. No structural check pins the `GATE` member *values* to the schema's
  `gate_type` enum strings (the T-24 checks pin `control_fault: 'control_fault'` specifically, and this
  round verified the full set equality manually). Not a finding: the pin's label claims a count match, the
  count match is truthful, F8-1's class (re-derived from `5b6ea91`'s message and diff) is stale count text
  vs literal count — which the pin covers — and no round's named standard reaches value-set drift. Recorded
  so a future amendment knows the value-set equality is a manually verified invariant, not a red test.
- **`globspread` is green and truthfully so; environment poisoning is outside a structural pin's scope.**
  `...(globalThis.X || {})` evaluates to the same member count in the pin's `new Function` evaluation and
  in the module's own evaluation whenever both run in the same clean process, because both see the same
  globals; divergence requires a wrapper that sets the global before module load, which no artifact in this
  plugin does (and which the pre-fix pin was equally exposed to — not introduced by `c0ed0fc`).
- **`nonenumspread` is green and truthfully so.** Spread copies enumerable own keys only, so a
  non-enumerable `extra_gate` never lands on the literal at all — `'extra_gate' in obj` is false. The green
  reflects reality; probed to establish the boundary, not to file it.
- **`proto8` remains green by design**, exactly as round 11's Correct Implementation prescribed: the
  prototype set by a literal's `__proto__:` is not an own member (`Reflect.ownKeys` → 7, verified), while
  chain reachability of `GATE.extra_gate` remains the known boundary recorded in round 11's observations.
- **The three committed review records have no pre-commit baseline to compare against** — they were
  untracked session outputs until `c0ed0fc`. The round-11 record as committed is internally consistent with
  this round's re-execution of its prescriptions (every re-run outcome matches what it recorded), which is
  the strongest available check of its fidelity.

---

## What's Actually Good

- **The fix is exactly the prescribed minimal correction, with nothing else in the blast radius.** One
  token at `:762`, no label change, no mechanism change, no allowlist entry — the discipline of a
  remediation that does only what the finding requires. Good by the corrections standard this repo holds
  (re-derive what the finding names; touch nothing else) — verified by Read of the full commit diff (one
  changed source line) and by the tier executing green.
- **The pin now counts with the complete own-key enumeration and stays fail-closed.** `Reflect.ownKeys`
  covers string, symbol, and non-enumerable own keys; four adversarial constructions that add a genuine
  eighth own member (`sym8`, `add8`, `wksym8`, `symspread8`) are all refused, and the unevaluable
  construction (`extspread`) still throws into the `−1` path. Good by the fail-safe defaults principle
  (Saltzer & Schroeder) and by the lineage's control-label-honesty standard — verified by ten executions
  with independent runtime truth per row.
- **The commit message's claims are all true as stated** — "sym8 turns the tier red; clean passes 235/235",
  "Structural 235/235, unit 17/17" — re-derived by execution, not trusted. Good by the
  delivery-with-the-test-that-demonstrates-it standard this lineage enforces.

---

## Convergence Record

- **Round number:** 12 (eleventh Post-fix round; **second post-rework round of the gate-count-pin
  sub-loop**).
- **Trajectory:** R1: 9 → R2: 7 → R3: 5 → R4: 5 → R5: 4 → R6: 3 → R7: 3 → R8: 1 → R9: 1 → R10: 1
  (tripwire FIRED; foundational rework) → R11: 1 → **R12: 0**.
- **Flow counts for this round:**
  - Prior findings **closed**: **1** — F11-1, against its originally named standard, by executing round
    11's own prescribed verification.
  - **New**: **0** — the full inventory pass, ten probes, and fresh evasion attempts surfaced nothing.
  - **Regressions**: **0** — sampled red probes red, both tiers green, diff bound confirms exactly four
    changed paths (one source line, three review documents).
  - Reconciliation: 1 prior − 1 closed = 0 carried; 0 + 0 new + 0 regression = **0**.
- **Tripwire evaluation — NOT FIRED, with the arithmetic shown.** Post-rework history is R11 → R12.
  - **(a)** new + regression ≥ closed for two consecutive rounds. R11: 1 + 0 = 1 ≥ 1 → TRUE (armed).
    R12: 0 + 0 = 0 ≥ 1 → **FALSE**. The streak is broken at one round → **not fired**.
  - **(b)** total not strictly decreased for two consecutive rounds. Post-rework totals: R11 = 1 →
    R12 = 0, strictly decreased → **not fired**.
- **Reading of the arithmetic.** The rework's second round is the clean close round 11 predicted for a
  sound foundation: one finding closed by a one-token parameter change, zero introduced, total at zero.
  The cycle exits by the designed path — PASS at zero findings — not by exhaustion.

---

## Recommended Priority

Nothing to fix. For PR assembly: the complete review lineage rounds 01–11 is now committed on the branch
(`c0ed0fc`); this round-12 record is written to
`claude-plugins/expert-dev-tools/docs/reviews/corrections-0.3.0-round-12.md` and remains uncommitted per
the reviewer's directive (commit nothing) — include it in the PR alongside the others so the convergence
arithmetic's final round is on the record.

---

Verdict: PASS
