# Independent review — corrections 0.4.0, round 6

Reviewer: fresh dispatch, no retained context from rounds 1–5. Prior rounds reach this
review only as written records (inventory source 4).

Target: `claude-plugins/expert-dev-tools/` on branch `claude/edt-corrections-0.4.0`,
seventeen commits `a903b12..a4b638e` against `origin/main`.

Verdict: **NEEDS FIXES (2 findings: 2 Moderate)**. Tripwire: **not fired** (arithmetic
below, both readings shown).

---

## Scope and Inventory

Round number: **6** (post-fix). Inventory constructed by the expert-review Step 2 post-fix
rule, from all four sources.

### Source 1 — the prior review's full inventory

Carried forward from `docs/reviews/corrections-0.4.0-round-05.md#Scope and Inventory`.

- [x] `tests/structural/check-structure.mjs` — executed in full at HEAD (444 ok / 0 fail);
      Read 1915–2144 (the T-31/T-32 block) and 430–480 / 841–869 (T-20); full round-5 diff
      Read (`git show a4b638e -- …check-structure.mjs`, 537 lines); exercised under 15
      mutations across three isolated copies.
- [x] `tests/unit/run-unit-tests.mjs` — executed (46 ok, 0 fail).
- [x] `hooks/continuation-gate.mjs` — Read 110–150; executed against the **real** repo
      ledger and six fixtures via a Node driver; mutated twice (reprompt count, reprompt
      member list).
- [x] `hooks/hooks.json` — round-5 diff hunk Read; `T-A2c` executed (ok).
- [x] `scripts/preflight-deployment.mjs` — executed against the **real** installed 0.3.0
      cache; JSON output Read field by field.
- [x] `scripts/validate-ledger.mjs` — executed indirectly via the T-30 fixture cases.
- [x] `scripts/ledger.schema.json` — round-5 diff hunk Read; mutated (`task_verbatim`
      renamed) — caught by two T-25 checks.
- [x] `workflows/expert-lifecycle.js` — round-5 diff hunks Read; mutated three times
      (8th `GATE` member; `gt.ok` branch; `sweepVerifyFn` site).
- [x] `commands/expert.md` — Read 228–246; round-5 diff Read; history traced to
      `origin/main` and `a903b12` via `git show`.
- [x] `README.md` — Read 12–16, 30–34.
- [x] `agents/*.md` (10 files) — round-5 diff hunks Read; `expert-corrector.md`,
      `expert-reviewer.md`, `expert-implementer.md` mutated (all caught).
- [x] `skills/expert-architecture/SKILL.md` — Read 84–88; full round-5 prose diff Read.
- [x] `skills/expert-architecture-portable/SKILL.md` — full round-5 prose diff Read.
- [x] `skills/expert-correct/SKILL.md` — Read 22–27; diff Read.
- [x] `skills/expert-implement/SKILL.md` — diff Read.
- [x] `skills/expert-mcp-overhaul/SKILL.md` — diff Read.
- [x] `skills/expert-plan/SKILL.md` — Read 20; diff Read.
- [x] `skills/expert-plan/references/output-contract.md` — Read 1–8, 76–84, 88–127;
      section count re-derived by grep (16); gate count re-derived by grep (3).
- [x] `skills/expert-review/SKILL.md` — diff Read.
- [x] `skills/expert-spec/SKILL.md` — diff Read.
- [x] `skills/expert-standard/SKILL.md` — diff Read.
- [x] `skills/expert-plan/scripts/derive-plan-sections.mjs`, `.../fixtures/valid-plan.md` —
      diff Read.
- [x] `tests/ACCEPTANCE.md` — unchanged this round; carried.
- [x] `tests/fixture/spec/spec-contradictory.md` — unchanged this round; `T-19` executed.
- [x] `.claude-plugin/plugin.json` — version confirmed `0.4.0` via the real preflight run
      (`worktree_version: "0.4.0"`).

### Source 2 — the fix diff (`a4b638e`, 21 files)

Every file in `git show --stat a4b638e` is in the list above, plus:

- [x] `docs/reviews/corrections-0.4.0-round-05.md` — Read in full (677 lines). Record file;
      out of T-31/T-32 scan reach by design.

### Source 3 — fix-diff dependents

CodeGraph is not available in this session (see tool plan). Dependents were derived by
grep and by executed mutation, which is the correct instrument here: every dependency edge
in this scope is textual (check labels, fixture paths, anchor targets, contract-text pins).

- [x] `tests/fixture/continuation/{complete,open-gate,no-gate,closeout,invalid,no-ledger}` —
      all six driven through the real hook.
- [x] `tests/fixture/deployment/{current-config,stale-config,worktree}` — executed via T-29.
- [x] `docs/diagnostics/corrections-0.4.0/*.md` (7 drafts) — section outlines Read; named
      check IDs extracted and each correction's mechanism mutation-tested (below).

### Source 4 — the prior round's findings as closure items

Round-5 findings F1, F2, F3 re-derived from current source and re-tested by mutation.
Dispositions in **Upstream Contract Verification**.

### Tool plan (Step 3)

| Claim type | Instrument | Availability |
|---|---|---|
| Absence claims | `grep` over declared scope, result counts recorded | available |
| Literal-content claims | `Read` at file:line at drafting time | available |
| Behavioral claims (check reach, hook verdicts, preflight verdicts, guard oracles) | **execution + mutation** on isolated copies | available |
| Structural / blast-radius | grep + executed mutation (CodeGraph unavailable) | **substituted** |
| Prior-document claims | re-derived from current source | available |
| Library-behavior claims | Context7 | **not needed** — no library-integration claim is load-bearing in this scope |

Disposition of the CodeGraph gap: **not a halt**. No finding in this review rests on a
structural blast-radius claim; every dependency edge in scope is textual and was verified
by grep or by mutation, which is the correct instrument per Step 6's
structural-vs-existence distinction.

### Mutation and probe battery

**The working tree was never mutated.** Three isolated copies were used:

- `…/scratchpad/p0` (pristine bare copy) and `…/scratchpad/p1` (mutated). Bare-copy
  baseline: **3 environmental failures** (`T-A2a` repo-root linter; two `T-20` git-baseline
  checks). Every probe scored against 3, never against 0.
- `C:\t\r` — a **git-backed** scratch repo (plugin re-rooted at
  `claude-plugins/expert-dev-tools/` in a fresh `git init` + commit), built specifically so
  the `T-20` deletion guard's `git show HEAD:…` baseline resolves. Baseline there:
  **1 environmental failure** (`T-A2a` only). This is the instrument round 5 lacked, and it
  is what makes the T-20 mutations below possible.
  *(Method note: the first attempt at the long scratchpad path failed `git add` with
  `Filename too long` on `tests/fixture/deployment/current-config/plugins/cache/…`; a short
  root resolves it. Same environmental cause round 5 recorded for `git worktree`.)*

| # | Probe | Result |
|---|---|---|
| A | `The 12 gate types:` + list, `skills/expert-plan/SKILL.md` | **CAUGHT** (4) — T-31 form (a) |
| B | `There are eleven signals:` + list | **CAUGHT** (4) |
| I | `You answer 7 distinct dispatches:` in `agents/expert-reviewer.md` | **CAUGHT** (4) |
| I2 | `Architecture work fails in twelve specific ways:` in `skills/expert-architecture/SKILL.md` | **CAUGHT** (4) |
| C1 | `Read all five traps before starting` (form c) | **CAUGHT** (4) |
| C2 | `the sixteen-section specification` (form d) | **CAUGHT** (4) |
| C3 | `each of the 5 rules` (form c, digit) | **CAUGHT** (4) |
| F′ | `Three widgets:` in `skills/expert-plan/references/note.yaml` (existing dir) | **CAUGHT** (4) |
| F″ | same in `note.txt` | **CAUGHT** (4) |
| D | bare `…expert-lifecycle.js:42` in a non-comment JS string | MISSED (3) — **disclosed in the label** |
| E′ | `Six signals:` + list in a brand-new top-level tree `newtree/` | **CAUGHT** (5) — T-29 + T-31 |
| **W1** | `There are eleven signals and` / `what each does:` — form (a) **wrapped** | **MISSED (3)** |
| **W2** | `The seven gate types and` / `what each asks:` — the live `commands/expert.md` shape | **MISSED (3)** |
| **W3** | the identical W2 text on **one line** (control) | **CAUGHT (4)** |
| **W4** | `Read each of the` / `five traps` — form (c) wrapped | **MISSED (3)** |
| M1 | `continuation-gate.mjs` reprompt `seven` → `eight` | **CAUGHT** — `T-24 … reprompt states the evaluated GATE member count` |
| M2 | drop `non_convergence` from the reprompt list | **CAUGHT** — `T-24 … reprompt names every evaluated GATE member (missing: non_convergence)` |
| M3 | add an 8th member to the workflow `GATE` literal | **CAUGHT** — 3 T-24 checks red |
| G1b | delete `T-24 deployment: the spot re-run expects its full sample count` outright (git repo) | **CAUGHT** — `T-20 no check present at baseline was removed` |
| G2b | make two live labels normalize-identical (git repo) | **CAUGHT** — `T-20 the normalization keeps every live label apart …` |
| C1′ | rename `task_verbatim` in `scripts/ledger.schema.json` | **CAUGHT** — 2 × T-25 |
| C4′ | corrupt the reviewer `returns:` contract | **CAUGHT** — T-2b |
| C3′ | rename a `class_sweep` field in `agents/expert-corrector.md` | **CAUGHT** — T-27 contract pin |
| C3″ | break a `sweepVerifyFn` document-gate site | **CAUGHT** — T-27 deployment pin |
| C2′ | neuter `if (!gt.ok) {` in the workflow | **CAUGHT** — T-24 deployment pin |
| C5′ | break the `Skill(...)` first-action instruction in `agents/expert-implementer.md` | **CAUGHT** — T-A2b + T-28 |

### Real-state exercises (both gates, both directions)

- `node scripts/preflight-deployment.mjs expert-dev-tools .` against the **real** installed
  cache: exit **1**, `stale: true`, `installed_version: "0.3.0"` (cache manifest),
  `registry_recorded_version: "0.3.0"`,
  `registry_recorded_commit: "bb7107b34f19f4380fd7975500357d29afdf80c9"`,
  `worktree_version: "0.4.0"`, 8 diff lines including
  `hooks/: 2 file(s) diverge — hooks/continuation-gate.mjs (missing in installed cache)`.
  Correct in content and in field provenance.
- `continuation-gate.mjs`, driven from Node with a real Stop payload (never from a shell
  that would inject a BOM — a PowerShell pipe does, and produced a spurious
  `hook input unreadable` on the first attempt; the Node driver is the valid instrument):

  | State | Exit | Note |
  |---|---|---|
  | **real** repo ledger `.claude/expert/ledger.json` | 0 | `ledger is not schema-valid ($: missing required property 'task_verbatim') and so is not resumable; allowing the stop.` |
  | `no-gate` fixture | **2** | reason names phase `implement`, routes to `/expert resume`, enumerates all seven §3.4 gate types |
  | `closeout` fixture (fresh) | **2** | reason names phase `closeout` |
  | `open-gate` | 0 | legitimate halt still halts |
  | `complete` | 0 | — |
  | `invalid` schema | 0 | documented fail-open with note |
  | `no-ledger` | 0 | — |

### Independent whole-branch check-deletion audit

Because `T-20`'s baseline is `HEAD` (one commit back), it cannot see a check deleted in an
earlier commit of this branch. I re-implemented its label extractor and normalizer and ran
it across the **whole branch** (`origin/main` → `HEAD`):

```
origin/main labels: 122   HEAD labels: 309
labels present at origin/main and absent at HEAD: 5
```

All five are declared, with a live successor in `check(` call position, in
`REPLACED_BY_STRENGTHENING` / `RENAMED_LABELS`:
`T-A2b ${name}: skills is a sequence -> packaged skill`,
`T-A2c manifest: declares no hooks (divergence §8)`,
`T-24 deployment: verifierUnderCovered guards all four consumption sites`,
`T-24 deployment: underCoveredVerifierGate raised at all four sites`,
`T-24 deployment: both control gates carry GATE.control_fault`.
**No check was silently lost across the branch.**

### Rigor waivers

None. No step of the expert-review process was skipped or compressed, and no operator
directed a cycle stop.

---

## Summary

**This review returns NEEDS FIXES**, with 2 findings, both Moderate, both against the
`T-31` count guard and both recurring instances of this cycle's defining standard.

All three round-5 findings are closed against their originally named standards, each
verified by execution or mutation rather than by reading the fix. The round-5 fix's central
move — stop asserting the absence of a **class** a regex cannot decide, assert instead the
absence of **precisely enumerated forms**, name those forms and the scanned extensions in
the label, and record the residual in a header paragraph a reader meets before the green
line — **is a legitimate closure of the standard, not a restatement that hides the gap.**
That judgment is grounded, not conceded: every probe round 5 demonstrated as MISSED (A, B,
I, F′) now turns the tier red; the one probe that still passes (D, a location-shaped string
on a code line) is named in the check's own label; the extension set gained `yaml`, `yml`
and `txt`; and the population floor round 5 filed as F2 is deleted rather than adjusted, so
the block's self-description at `:1980-1982` is now true of the block. The alternative move
— widen the regex once more and keep claiming the class — is the one that failed in rounds
2, 3 and 4, and declining it is the correct engineering call.

The closure is nonetheless incomplete, on two verified counts, and round-5's F1 named the
standard for each. First, the label is still literally false on its own terms: form (a) and
form (c) are recognized per line, so the identical construct is caught on one line and
missed across a line break, and one live in-reach instance sits at `commands/expert.md:230`
while `T-31` prints `found: none` (probes W2 / W3 are the decisive pair). Second, round-5
F1's *other* named standard — hand-maintained derived data must be deleted or pinned to an
executable source of truth — is not satisfied for two surviving counts that the widened
recognizer still cannot see, including a **cross-file** one at `skills/expert-plan/SKILL.md:20`
naming the sixteen sections and three gates of `references/output-contract.md`. The round-5
fix deleted the *sixteen-section* restatement at two sites and left the same claim, in a
different phrasing, at two others. Disclosure closes the label standard; it does not close
the population standard.

Against the seven corrections themselves — the thing this branch exists to deliver — I
found **no regression**. Each correction's load-bearing mechanism was mutation-tested and
each mutation turned the tier red (battery rows C1′–C5′, M1–M3). Both governed scripts were
executed against real and constructed state in both directions. Neither tripwire condition
fires, under either reading of the arithmetic.

---

## Upstream Contract Verification

### Round-5 findings as closure items

**F1 — `T-31`'s stated scope exceeded its actual reach on the form axis; 37 instances
survived while the check printed `found: none`. CLOSED against its first named standard
(stated scope equals actual reach); the class it named recurs — see N1 and N2.**
Verified by execution and mutation, not by reading the fix. The recognizer is now three
named predicates over digits and the number words *two* through *twenty*
(`check-structure.mjs:2036-2059`, Read at drafting time), and the assertion's label
enumerates the forms, the number domain, the extension set and the `docs/` exclusion, and
points at a header paragraph titled *"WHAT THESE CHECKS DO NOT COVER — read this before
trusting a green line"* (`:1951-1966`, Read). Probes A, B, I, I2, C1, C2 and C3 — every
construct round 5 demonstrated as invisible — now turn the tier red. The 37 measured
instances are gone: `T-31` is green at HEAD with `skills/`, `agents/` and `commands/` in
reach, which is only possible if none of the forms remains. The originally named standard
is satisfied for the forms the label now claims.

**F2 — the block asserted of itself that it contains no population floor, and contained one
(`anchored.length >= 10`). CLOSED.** Verified by grep of the block: `sed -n '1983,2144p' |
grep -E '\.length >=|floor'` returns exactly one floor, `inReach.length >= 30` at
`:2025-2026`, which is the floor on the **walk** the adjacent comment at `:2022-2024`
distinguishes and justifies. The citation-count floor is deleted, not adjusted, and the
deletion is recorded in `REPLACED_BY_STRENGTHENING` with the reasoning that the obligation
it named is carried whole by the `unresolved`/`dead`/`bare` assertions. The self-description
at `:1980-1982` now reads *"Nothing here has a per-instance allowlist, a designation, or a
floor on a population it measures; the single floor is on the WALK"* — Read at drafting
time and true of the code it documents.

**F3 — `T-31`/`T-32` silently excluded unscanned extensions and, in code files, non-comment
lines, while labelled "anywhere in reach". CLOSED.** Verified by execution and mutation.
`SCANNED_EXT` at `:1997` now reads `/\.(md|mjs|js|json|ya?ml|txt)$/` and `EXT_LIST` at
`:1998` is interpolated into all three labels; probes F′ and F″ (`.yaml` and `.txt`
cardinality claims planted in the *existing* `skills/expert-plan/references/` directory —
round 5's exact MISSED case) both turn the tier red. Probe D still passes, and that is the
disposition round 5 recommended: the label now states *"in code files only comment lines are
scanned, for the reason above"*, and the reason is written in place at `:2080-2083`. A
narrowing that is deliberate, reasoned and disclosed is not the defect; a narrowing the
label denies was.

### The seven corrections — still doing what their drafts say

Each correction's load-bearing mechanism was verified by mutation on an isolated copy. A
mutation that turns the tier red proves the mechanism is wired and guarded; a mutation that
finds no pattern would have proved regression.

| # | Correction | Mechanism verified | Method |
|---|---|---|---|
| 1 | `instruction-reinterpretation` | `task_verbatim` required by the ledger schema | renamed → `T-25 ledger schema: required includes task_verbatim` + `T-25 … non-empty string whose description says verbatim` both red |
| 2 | `premature-completion-claims` | ground-truth guard branches on the extracted predicate | `if (!gt.ok) {` → `if (false) {` → `T-24 deployment: the ground-truth guard branches on the extracted predicate result` red; `T-24x` cases executed at HEAD |
| 3 | `patching-instead-of-rederivation` | class-sweep contract fields + re-execution channel | `sites_changed` renamed → `T-27 contract: expert-corrector agent names class_sweep field sites_changed` red; `sweepVerifyFn` site broken → `T-27 deployment: the re-execution channel is supplied at exactly 3 document-gate sites` red |
| 4 | `role-boundary-violations` | reviewer findings channel is schema-closed | `returns:` corrupted → `T-2b expert-reviewer: returns: declares every field of every schema it is dispatched with` red; `T-RB2 exec` cases executed at HEAD |
| 5 | `skill-activation-missed` | activation verified, never asserted | `Skill` broken in `agents/expert-implementer.md` → `T-A2b … tools allowlist incl Skill` + `T-28 agent: carries the literal Skill(expert-dev-tools:expert-implement) first-action instruction` red |
| 6 | `opining-without-reading-source` | deployment-provenance preflight | executed against the **real** installed 0.3.0 cache: exit 1, `STALE`, provenance fields distinct and correctly sourced |
| 7 | `agent-quits-midtask` | Stop-event continuation gate | executed against the **real** ledger and six fixtures, both directions; reprompt count and member list both pinned executably (M1, M2, M3) |

**No regression found in any of the seven.**

### Spec and architecture conformance

- **Spec §2 hooks amendment (owner, 2026-08-20)** — HONORED. Verified by execution:
  `T-A2c hooks: the Stop continuation gate is the only hook, and no tool-use hook exists`
  passes, and the retired absolute no-hooks pin is recorded in `REPLACED_BY_STRENGTHENING`
  with both `was` and `now` present in `check(` call position.
- **Spec §3.4 seven gate types** — HONORED, and now pinned in **both** tiers. Verified by
  execution of the real hook (the block reason enumerates `intent, spec_traceable,
  business, risk_override, non_convergence, core_approval, control_fault`) and by three
  mutations: changing the reprompt's stated count, deleting one member name from the
  reprompt, and adding an eighth member to the workflow's `GATE` literal each turn
  `T-24 the continuation gate's reprompt states the evaluated GATE member count` and/or
  `… names every evaluated GATE member` red. The count is derived by **evaluating** the
  `GATE` literal, not by lexing it.
- **Architecture fail-safe-defaults decision (OWASP secure design)** — HONORED. Every
  constructed and real gate case resolves to block-or-documented-fail-open; the fail-open
  asymmetry carries its own assertion (`T-30 the fail-open choice and its asymmetry with
  the fail-closed gates are documented in the script`).
- **Version 0.4.0** — HONORED. `worktree_version: "0.4.0"` in the real preflight run.

No upstream acceptance criterion in scope was found violated.

---

## Critical & Serious Findings

No Critical or Serious findings. The full inventory was Read or Grep-verified per Gate B,
both tiers were executed at HEAD (**444 structural ok / 0 fail; 46 unit ok / 0 fail**), the
whole-branch check-deletion audit found no silent loss, both governed scripts were executed
against real and constructed state in both directions, all seven corrections' mechanisms
were mutation-verified, and no violation of Critical or Serious classification was observed.

---

## Systemic Patterns

No systemic patterns this round. The class that carried the Systemic classification in
rounds 4 and 5 — a hand-maintained count restatement propagated across many files — was
measured again this round and is now **three lines in three files**, not a cross-codebase
pattern, so it does not meet the Systemic bar. Verified by the proactive scans recorded
under N1 and N2: a wrapped-construct scan over all 66 files in reach (1 genuine live
instance) and a `sixteen`/section-count scan over the plugin excluding `docs/` (2 live
instances). The instances are reported as N1 and N2 at Moderate.

Additional proactive scans run and found empty:
`grep -rnoiE "\b(two|…|twenty|thirty|forty)\b[^.]{0,40}"` over `--include=*.md --include=*.mjs
--include=*.js --include=*.json --include=*.txt --include=*.yaml --include=*.yml`, `docs/`
excluded — every surviving hit was Read in context and is either a description of a fixed
historical measurement, a pointer at an executably pinned source (`jobs:`, spec §3.4,
the evaluated `GATE` literal), or an accurate count with its population in the same clause.

---

## Moderate & Minor Findings

### N1 — `T-31`'s form (a) and form (c) recognizers are per-line, so the forms the label names are undetected across a line break; one live in-reach instance exists at `commands/expert.md:230` while the check prints `found: none` (Moderate — recurring)

**Location:** `tests/structural/check-structure.mjs:2060-2067`

**What the code does now.** Read at drafting time, `tests/structural/check-structure.mjs:2061-2067`:

```js
  for (const rel of inReach)
    body.get(rel).split(/\r?\n/).forEach((l, i) => {
      const form = COUNT_FORMS.find(([, re]) => re.test(l));
      if (form) stated.push(`${rel}:${i + 1} [${form[0]}]`);
    });
  check(`T-31 no count restatement in header form (a), (c) or (d) exists in any scanned file — the assertion is the absence of THOSE FORMS, never of the class (…) (found: ${stated.join('; ') || 'none'})`,
    stated.length === 0);
```

The source is split on newlines and each predicate is tested against **one line at a time**.
Form (a) is defined in the block header, Read at `:1937-1938`, as *"a number quantifying a
plural noun, no sentence break, terminal colon — 'N signals:', 'The N gate types:'"* —
a definition about sentence structure, with no line-boundary qualifier. Its regex enforces
the terminal colon with `(?=[^.]*:$)`, which a line break defeats.

Read at `commands/expert.md:230-231`:

```
  approves or rejects a solution, not a bare problem. The seven gate types and
  what each asks:
```

followed immediately by exactly seven bullets (`intent`, `spec_traceable`, `business`,
`risk_override`, `non_convergence`, `control_fault`, `core_approval` — Read at `:232-246`).
That is form (a) by the header's own definition: a number quantifying a plural noun, no
sentence break after it, a terminal colon, and the population enumerated immediately below.

**How the claim was verified.** By **execution and mutation**, never by reading assertions,
on the pristine/mutated scratch pair against a measured baseline of 3 environmental failures:

- Probe **W2** — appended `not a bare problem. The seven gate types and` / `what each asks:`
  + a list to `skills/expert-plan/SKILL.md`: tier **PASSED**, 3 fails.
- Probe **W3** (the control) — the *identical text on one line*,
  `The seven gate types and what each asks:` + a list: tier **FAILED**, 4 fails, with
  `T-31 no count restatement in header form (a), (c) or (d) …` red. The only difference
  between W2 and W3 is the line break.
- Probe **W1** — `There are eleven signals and` / `what each does:`: **MISSED** (3 fails).
- Probe **W4** — form (c) wrapped, `Read each of the` / `five traps before starting`:
  **MISSED** (3 fails).
- The live instance is proved undetected by the HEAD run itself: `commands/` is in reach
  (`T-31 the reach includes every live tree — agents, commands, hooks, scripts, skills,
  workflows, tests …` passes), and `T-31` is green at HEAD with 0 fails.

**Proactive scan across the full inventory scope (Step 8 — not extrapolated from sample).**
I re-implemented the block's walk, `SCANNED_EXT`, `NUM` and all three `COUNT_FORMS`
verbatim, then applied them to every adjacent line-pair joined, reporting only pairs where
neither line matches alone. Over all **66** files in reach: **13 raw hits, 12 of which are
artifacts of the naive joiner** (ten are `jobs: N` frontmatter followed by `returns:` in
`agents/*.md`; two are fixture prose where the second line begins a new sentence). Read in
context, exactly **one** is a genuine count restatement: `commands/expert.md:230`.

**Which standard it violates, and why.** The same standard rounds 2, 3, 4 and 5 each filed
against this control: *a control's stated scope must equal its actual reach, or the green
line is a false assurance* — and this block's own header adopts it verbatim at `:1975`
(*"Reach is a measured property rather than a claim"*). The header's honest-residual
paragraph does **not** cover this case: its enumerated known gaps are number words above
twenty, a count quantifying a singular or irregular plural, the shape-naming compounds
*N-way* / *N-fold*, and *"any restatement phrased outside the enumerated forms entirely"*
(Read at `:1959-1966`). The `commands/expert.md` instance is phrased squarely **inside**
form (a). The label therefore asserts the absence of a form that is present, which is the
precise failure the round-5 rework was written to stop committing.

This is not Systemic: one live instance in one file, currently accurate (seven bullets), no
rot shipped. It is Moderate — a false `found: none` over a form the label names.

**What correct implementation looks like.** Either bring the reach to the claim or the
claim to the reach; both are legitimate, and the block's own doctrine prefers the second
where a regex cannot follow:

1. Scan a *logical* line rather than a physical one for forms (a) and (c) — join lines
   within a markdown paragraph (blank-line-delimited, list-item-aware) before testing, and
   report the first physical line of the match. The negative cases at `:2129-2139` extend in
   step so the paragraph-joined recognizer is still demonstrably able to reject ordinary
   prose across a wrap. Then probes W1, W2 and W4 must turn the tier red.
2. Or, if physical-line scanning is a deliberate limit, say so in the label and add
   *"a restatement broken across a line"* to the known-gaps paragraph at `:1959-1966`.

Either way, resolve `commands/expert.md:230` the way the sibling instance at `:264` was
already resolved in this cycle — that line reads *"it is not one of the §3.4 gate types"*,
pointing at the pinned source instead of restating the number.

### N2 — round-5 F1's second named standard is not closed: two unpinned restatements of `output-contract.md`'s derived counts survive, one of them cross-file, both invisible to the widened recognizer (Moderate — recurring)

**Location:** `skills/expert-plan/SKILL.md:20` and
`skills/expert-plan/references/output-contract.md:5`

**What the code does now.** Read at `skills/expert-plan/SKILL.md:20` at drafting time:

> Before Step 8 (writing the plan document), read `references/output-contract.md` in full.
> It specifies **the sixteen output sections**, the evidence formats Output section 11
> accepts, and **the three compliance gates** the plan must pass before delivery.

Read at `skills/expert-plan/references/output-contract.md:5`:

> `## The sixteen output sections`

Both restate populations that live in `output-contract.md`. The first does so **from a
different file** — the sub-form round 5 named as the highest-risk, *"because the number and
the population it describes live in different files and no reader ever sees them together"*.

**How the claim was verified.** Populations re-derived from current source at drafting
time, not imported:

- `grep -cE "^[0-9]+\. \*\*" skills/expert-plan/references/output-contract.md` → **16**.
- `grep -nE "Gate [ABC]" skills/expert-plan/references/output-contract.md` → 3 gate headings
  (`:88` Gate A, `:94` Gate B, `:106` Gate C), Read in place.
- Both counts are therefore **currently accurate and unpinned**.

Undetected status verified by execution and by scan:
`grep -rn "sixteen" --include=*.md --include=*.mjs .` with `docs/` excluded returns **5
hits**: the two above, plus three inside `tests/structural/check-structure.mjs` itself
(`:488` the normalizer's cardinal list, `:2037` the `CARDINALS` array, `:2133` a
deliberately assembled negative-test probe) — all three are recognizer machinery, not
prose. `T-31` is green at HEAD with `skills/` in reach, so neither prose instance is seen:
`## The sixteen output sections` has no terminal colon and no determiner from form (c)'s
set, and `the sixteen output sections,` likewise ends in a comma, not a colon.

That the class was found and swept incompletely is verified from the fix diff itself
(`git show a4b638e`, Read): the *sixteen-section* restatement was deleted at
`agents/expert-planner.md:24` (`sixteen-section plan through gates A/B/C` → `plan through
gates A/B/C`) and at `skills/expert-plan/SKILL.md:388` (`per the sixteen-section
specification` → `per the specification in`), while the same claim in a different phrasing
survived twenty lines above the second edit.

**Which standard it violates, and why.** Round-5 F1 named **two** standards, and this is
the second: *hand-maintained derived data must be deleted or pinned to an executable source
of truth* — the project's own standing rule, enacted by this very block and restated at
`skills/expert-plan/references/output-contract.md:80`. The commit message for `a4b638e`
claims *"The measured population disposed of"*; that is true of the 37 lines round 5
measured, and these two are not among them (round 5's grep keyed on the hyphenated
`sixteen-section`, which neither line uses). The residual paragraph at `:1951-1966` makes
them **disclosed**, which closes the *label* standard — it does not make them **resolved**,
which is what this standard requires. A reader of `SKILL.md:20` is told a section count for
a file they have not opened, maintained by hand, checked by nothing.

It also matches the project's own recorded correction doctrine — a finding is a symptom, and
the class is swept, not the named line. Two sites of one class were fixed and two were left
in the same pass.

**What correct implementation looks like.** Resolve both the way the agent return contracts
were resolved — point at the source of truth instead of restating it:

- `skills/expert-plan/SKILL.md:20` → *"It specifies the output sections, the evidence
  formats Output section 11 accepts, and the compliance gates the plan must pass before
  delivery."* The reader is being sent to read the file in full in the same sentence; the
  counts add nothing they will not have in ten seconds.
- `skills/expert-plan/references/output-contract.md:5` → `## The output sections`.

If either count is judged genuinely load-bearing, pin it executably against the population
`derive-plan-sections.mjs` already parses, the way `T-24` pins the gate count by evaluating
the `GATE` literal — never as a second copy of a number.

---

## Tentative Findings

No tentative findings — every candidate finding's premise was verified against current
source by Read at drafting time, by grep with the query and result count recorded, or by
executed mutation on an isolated copy, per Gate B.

Three candidates were **dropped** after verification contradicted them, recorded here
because each would otherwise look like an omission:

- *"`T-20`'s deletion guard is inert because its baseline is `HEAD`, one commit back."*
  The premise about the baseline is true (Read at `check-structure.mjs:452-454`), but the
  conclusion does not follow: the guard runs against the **working tree** before each
  commit, so a deletion is red at the moment it is made, and the whole-branch audit I ran
  independently confirms no check was lost across all seventeen commits. A per-commit guard
  chained over committed history is a defensible design, not a defect. Recorded as an
  Observation instead.
- *"The wider `norm()` — cardinal words deleted outright rather than substituted — lets a
  deleted check hide behind a normalization collision."* The masking scenario needs a
  baseline label and a surviving different label to normalize alike. `T-20 the normalization
  keeps every live label apart …` fires while **both** are live, i.e. in the commit before
  the deletion, so the window is closed in practice. Verified by mutation G2b: making two
  live labels normalize-identical turns that check red with the colliding pair named.
- *"`skills/expert-architecture/SKILL.md:86` — 'eleven ordered phases plus two post-design
  mapping phases' — is a drifted count."* Re-derived from source:
  `grep -oE "Phase [0-9]+[ab]?"` yields Phase 1 through Phase 11 plus 10a and 10b. The
  claim is accurate. It is unpinned and falls inside the header's disclaimed residual
  (no terminal colon, no form-(c) determiner), so it is not counted in N1 or N2.

---

## Observations

- **The header's honest-residual paragraph is the right architectural move, and it should
  not be mistaken for a concession.** `:1951-1966` states that the class is *"a number
  restating a population recorded elsewhere"*, that *"no regex over prose can decide that
  class"*, that its boundary *"is drawn by hand and is incomplete by construction"*, names
  the specific known gaps, and closes with *"A number that escapes the recognizer is not
  thereby licensed — it is undetected, and this paragraph is the honest statement of that."*
  Rounds 2, 3 and 4 each responded to an overstated label by widening the regex; that move
  failed three times. Replacing the totality claim with an enumerated one is the move that
  can actually hold. N1 and N2 are that move applied incompletely, not that move being
  wrong. No standard violation.
- **`RENAMED_LABELS` is a new declaration channel, and it is not an exemption hole.**
  Read at `:2211-2212` and `:2219-2227`: its entries are merged into the same `supersededBy`
  map as `REPLACED_BY_STRENGTHENING`, and `goneFrom` requires the `now` label to be present
  **in `check(` call position** — presence is structural, not textual. Its `was` strings are
  assembled from fragments so a quoted dead label does not itself become a live instance of
  the form. The separation is itself principled: the comment at `:2164-2170` argues that
  filing a pure label correction as a "strengthening" would falsify the record of what was
  traded for what. No standard violation.
- **The round-5 label sweep went beyond the finding.** Five labels across `T-24` and `T-27`
  that claimed totality over an occurrence floor (*"guards all four consumption sites"*,
  *"raised at every empty-set and under-coverage site"*) were rewritten to report what the
  assertion actually establishes (*"is called at 4 or more sites (a deletion guard …, not a
  totality claim)"*). That is round-5 F3's standard swept across the file rather than
  applied at the named line — the class sweep the project's doctrine asks for. No standard
  violation.
- **One prose rewrite in `a4b638e` is cosmetic compliance rather than a resolution, and it
  is harmless.** `workflows/expert-lifecycle.js`: `all 27 failures in one dispatch were
  predetermined by target selection` → `27 failures in one dispatch, all predetermined by
  target selection`. The reorder removes the form-(c) match without removing the number.
  There is nothing to remove: `27` is a fixed historical measurement of a dated acceptance
  run, not a live population that can drift, so the check was a false positive and the
  block offers no exemption channel by design. Meaning is preserved. Recorded rather than
  filed because no standard is violated — but it is the visible cost of a no-exemption
  design, and a second such rewrite would be worth a finding.
- **The behavioral prose was rewritten carefully, not mangled.** I Read every prose hunk of
  `a4b638e` across the ~15 skill/agent/command files (103 changed prose lines). No
  instruction lost its force, no mandatory became optional, no cross-reference broke. Every
  lead-in that lost a count either enumerates immediately (`Architecture work fails in the
  specific ways set out below — …`) or points at where the enumeration is (`the top-level
  keys listed at the end of this item`, `per the specification in
  references/output-contract.md`). Two rewrites are mildly less crisp than the originals —
  `Two distinct questions get answered:` → `Distinct questions get answered:`
  (`expert-mcp-overhaul`), and `each carrying all five fields:` → `each carrying every one
  of the fields:` (`output-contract.md` §12) — both grammatical and both unambiguous, since
  the enumeration follows in the same sentence. No standard violation.
- **The real repository ledger at `.claude/expert/ledger.json` predates the `task_verbatim`
  requirement** and is therefore inert under the gate. This is the designed fail-open path
  and it announces itself on stderr. Noted so the next round is not surprised that the live
  ledger governs nothing.
- **Environment.** CodeGraph was unavailable; dependents were derived by grep and mutation
  (disposition in the tool plan — not a halt). `git add` of the plugin fails with
  `Filename too long` under a deep scratch root because of
  `tests/fixture/deployment/current-config/plugins/cache/fixture-plugin/0.2.0/…`; a short
  root resolves it. Piping a Stop payload to the hook from PowerShell injects a UTF-8 BOM
  and the hook correctly reports `hook input unreadable … allowing the stop` — a harness
  artifact, not a defect, and a reviewer who stopped there would have reported the gate
  inert.

---

## What's Actually Good

- **The gate-type count is now pinned executably in both tiers, end to end.** Property: the
  hook's reprompt cannot state a count, or name a set of members, that disagrees with the
  workflow's `GATE` literal. Standard: single source of truth for derived data — the
  project's own standing rule. Verified by three mutations, not by reading: changing
  `seven` → `eight` in the reprompt, deleting `non_convergence` from the reprompt's member
  list, and adding an eighth member to the `GATE` literal each turn the tier red, the last
  one naming the missing member (`missing: bogus_new`). The count is obtained by lifting and
  **evaluating** the literal, so the language counts its own members.
- **The `T-20` deletion oracle was itself repaired, and the repair is demonstrable.**
  Property: a check deleted from the file is reported, and it cannot hide behind a label
  collision introduced by the normalizer. Standard: a guard must be able to fail — the
  demonstrable-failure obligation this plugin applies to everything else. Verified in a
  purpose-built git-backed scratch repo (the instrument round 5 lacked): deleting one check
  outright turns `T-20 no check present at baseline was removed` red (probe G1b), and making
  two live labels normalize-identical turns `T-20 the normalization keeps every live label
  apart …` red with the colliding pair printed (probe G2b). The comment at `:2228-2236`
  records the real prior failure (T-14's label standing in for a deleted T-28) that
  motivated it.
- **No check was lost anywhere in seventeen commits.** Property: every one of the 122 labels
  present at `origin/main` is either still live at HEAD or has a declared successor in
  `check(` call position. Standard: verification mechanisms are not weakened silently.
  Verified by an **independent re-implementation** of the label extractor and normalizer run
  across the whole branch — not by trusting `T-20`, whose baseline is one commit back and
  which structurally cannot answer this question. Result: 5 absent labels, all 5 declared.
- **The continuation gate's verdicts are correct in both directions on real and constructed
  state.** Property: it blocks an untyped mid-phase halt with an actionable reason and
  permits every legitimate one. Standard: OWASP secure-design fail-safe defaults, with the
  fail-open exceptions documented and separately asserted. Verified by driving the real
  script over seven states from Node: exit 2 with the seven-gate enumeration on `no-gate`
  and on a fresh `closeout`; exit 0 on `open-gate`, `complete`, `no-ledger`; exit 0 with an
  explanatory stderr note on the live schema-invalid ledger.
- **The preflight reports provenance it actually read.** Property: `installed_version` comes
  from the cache manifest and the registry's separate claims are reported under separately
  named fields, so a divergence between them is visible rather than collapsed. Standard: a
  field named for what was read carries a value read from disk. Verified by executing the
  script against the **real** installed 0.3.0 cache and reading the emitted JSON field by
  field, including the per-tree diff lines that correctly identify
  `hooks/continuation-gate.mjs` as missing in the installed cache.

---

## Convergence Record

**Round number:** 6 (post-fix), matching Scope and Inventory.

**Trajectory** (by severity, each round's own mechanical breakdown):

| Round | Total | Breakdown |
|---|---|---|
| R1 | 6 | 1 Critical, 3 Serious, 2 Moderate |
| R2 | 4 | 1 Serious, 2 Moderate, 1 Minor |
| R3 | 3 | 1 Serious, 2 Moderate |
| R4 | 4 | 1 Systemic, 2 Moderate, 1 Minor |
| R5 | 3 | 1 Systemic (recurring), 2 Moderate |
| **R6** | **2** | **2 Moderate (both recurring)** |

**Flow counts for this round** (provenance classifications from Step 9 are the source):

- **Prior findings closed: 3** — F1, F2, F3, each verified against its originally named
  standard by execution, mutation, or grep with the result count recorded. F1 is closed
  against the *first* of the two standards it named; the second is reopened as N2, and that
  is stated rather than netted.
- **New findings: 0.**
- **Recurring findings: 2** — N1 and N2. Both cite the same standards and the same control
  (`T-31` in `tests/structural/check-structure.mjs`) as round-5 F1; N1 is the fifth
  consecutive round in which that control has been found asserting a reach it does not have.
- **Regressions: 0.** Verified rather than assumed: both tiers green at HEAD, the
  whole-branch audit shows no check lost, all seven corrections' mechanisms turn the tier
  red under mutation, and both governed scripts behave correctly against real state in both
  directions.

**Tripwire evaluation — arithmetic shown, both readings.**

*Condition (a): new + regression ≥ closed, for two consecutive post-fix rounds.*

- Strict reading (the rule as written — `recurring` is its own provenance and is not summed
  into `new`): `0 + 0 = 0`; closed `= 3`. **0 ≥ 3 is FALSE.**
- Conservative reading (count both recurring findings on the new side, since both are filed
  against code written in `a4b638e`): `2 + 0 = 2`; closed `= 3`. **2 ≥ 3 is FALSE.**

Condition (a) did not hold in round 5 and does not hold in round 6 under either reading.
Two consecutive rounds are required. **Condition (a) does not fire.**

*Condition (b): total findings has not strictly decreased, for two consecutive post-fix
rounds.*

- R4 → R5: `4 → 3`, a strict decrease. Condition did not hold in round 5.
- R5 → R6: `3 → 2`, a strict decrease. Condition does not hold in round 6.

**Condition (b) does not fire.**

**Determination: the non-convergence tripwire is NOT FIRED**, on both conditions and under
both readings. The fix cycle does not stop for foundational rework by rule, and this
review's verdict is derived from its own finding set.

**What that determination means this round.** Unlike round 5, the mechanical result and the
substantive signal now point the same way. Round 5 correctly warned that an unfired tripwire
was not evidence of convergence, because the class had survived a round of foundational
rework aimed at it. This round the class did not survive intact: it shrank from 37 instances
in 10 files to 3 in 3 files, the reporting defect that made it dangerous — a label
announcing an empty class — was replaced by a label that enumerates what it checks and a
header that names what it cannot, and every probe that demonstrated the old gap now turns
the tier red. What remains is a narrow residue of the same class, filed at Moderate, in two
places, with a mechanical fix available for each. That is the shape of a converging cycle,
not a churning one.

---

## Open Findings Ledger

Not applicable — no operator has directed that the fix cycle stop with open findings.

---

## Recommended Priority

The tripwire has not fired, so this section does not open with the Gate 8 foundational-rework
directive, and — unlike round 5 — I do not recommend it on the evidence either. The round-5
rework changed the kind of claim the control makes, which is the change that was needed;
what remains are two ordinary defects in it, not a fourth iteration of a move that has not
worked. Another fix round is the right path.

1. **N1 first.** It is the one that makes a green line say something false, and it has a
   mechanical fix on either of two legitimate paths (join a logical paragraph before testing
   forms (a) and (c), or state the physical-line limit in the label and in the known-gaps
   paragraph). Take the first if the paragraph-join can be written without a maintained
   list — it can, since paragraph boundaries in markdown are blank lines — and extend the
   `T-31-neg` negative cases in the same edit so the widened recognizer is still
   demonstrably able to reject ordinary prose across a wrap. Resolve
   `commands/expert.md:230` the way `commands/expert.md:264` was already resolved in this
   cycle: point at spec §3.4 rather than restating the number.
2. **N2 second, and sweep it rather than patching the two lines named.** The two instances
   here were left standing in a pass that deleted two siblings of the same class twenty
   lines away, which is the signature of a class found and swept incompletely. Before
   reporting it closed, re-run a count scan over every file in reach that is keyed on the
   *meaning* (a number naming a population that lives somewhere else) rather than on the
   phrasing round 5 happened to grep for — `sixteen-section` missed `sixteen output
   sections` by a hyphen, and that is exactly how this pair survived.

Both are in the same class and should land in one pass. Validate the way this review
validated the current state: on an isolated copy, with probes **W1, W2 and W4 required to
turn the tier red** and probe **W3** still red, and with `T-31` still green over a plugin
in which `skills/expert-plan/SKILL.md:20`, `skills/expert-plan/references/output-contract.md:5`
and `commands/expert.md:230` have been resolved rather than reworded around the recognizer.

---

Verdict: NEEDS FIXES (2 findings: 2 Moderate)
