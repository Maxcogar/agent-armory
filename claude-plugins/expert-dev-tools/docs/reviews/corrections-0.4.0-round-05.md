# Independent review — corrections 0.4.0, round 5

Reviewer: fresh dispatch, no retained context from rounds 1–4. Prior rounds reach this
review only as written records (inventory source 4).

Target: `claude-plugins/expert-dev-tools/` on branch `claude/edt-corrections-0.4.0`,
fifteen commits `a903b12..eed5c27` against `origin/main`.

> **Erratum — added 2026-08-21, after this review was delivered.** The commit count in
> the line above is wrong. The original text is left unaltered, because this record is
> evidence of what the reviewer concluded and when. Re-measured with
> `git rev-list --count`: `a903b12..eed5c27` holds **11** commits (**12**
> counting `a903b12` itself); no reading of the branch yields fifteen.
> The figure had begun drifting one commit per round and kept drifting
> through round 7.
> Found and corrected post-review in round 8 (finding F8-2). Only the figure is wrong;
> no conclusion in this record rests on it.

Verdict: **NEEDS FIXES (3 findings: 1 Systemic-recurring, 2 Moderate)**. Tripwire: **not
fired** (arithmetic below, all three candidate readings shown).

---

## Scope and Inventory

Round number: **5** (post-fix). Inventory constructed by the expert-review Step 2 post-fix
rule, from all four sources.

### Source 1 — the prior review's full inventory

Carried forward from `docs/reviews/corrections-0.4.0-round-04.md#Scope and Inventory`.

- [x] `tests/structural/check-structure.mjs` — Read 460–760, 1780–1929, 1931–2010;
      executed in full at HEAD and under 8 mutations.
- [x] `tests/unit/run-unit-tests.mjs` — executed (46 ok, 0 fail).
- [x] `hooks/continuation-gate.mjs` — executed against 3 fixtures + the live repo ledger.
- [x] `hooks/hooks.json` — Grep `Stop` / hook-class pins via T-A2c (executed, ok).
- [x] `scripts/preflight-deployment.mjs` — Read diff hunks; executed against real
      installed cache and against `--worktree`-shaped bad input.
- [x] `scripts/validate-ledger.mjs` — executed indirectly via T-30 fixture validation
      (5 executed cases, all ok).
- [x] `scripts/ledger.schema.json` — exercised via the invalid-fixture assertion.
- [x] `workflows/expert-lifecycle.js` — Grep for changed hunks (`git show eed5c27`);
      compiled and executed via T-A2e / T-22 / T-23 / T-24x.
- [x] `commands/expert.md` — Read changed hunks via `git show`.
- [x] `README.md` — Read changed hunk.
- [x] `agents/*.md` (10 files) — Read all changed hunks; `jobs:` frontmatter Read for
      `expert-verifier`; mutation-tested via T-2b.
- [x] `skills/expert-architecture/SKILL.md` — Read 30–50, 62, 478, 512, 544, 560; diff Read.
- [x] `skills/expert-architecture-portable/SKILL.md` — Read 36, 117–118, 232–240, 316,
      337, 340, 353, 361; diff Read.
- [x] `skills/expert-correct/SKILL.md` — diff Read.
- [x] `skills/expert-implement/SKILL.md` — diff Read.
- [x] `skills/expert-mcp-overhaul/SKILL.md` — diff Read.
- [x] `skills/expert-plan/SKILL.md` — Read 82, 373, 388; diff Read.
- [x] `skills/expert-plan/references/output-contract.md` — Read 9–64, 80, 86, 109, 119;
      section count derived by grep (16).
- [x] `skills/expert-review/SKILL.md` — Read 367, 553; diff Read.
- [x] `skills/expert-spec/SKILL.md` — diff Read.
- [x] `skills/expert-standard/SKILL.md` — Read 32; diff Read.
- [x] `tests/ACCEPTANCE.md` — diff Read; consumer grep (1 hit).
- [x] `tests/fixture/spec/spec-contradictory.md` — Read in full; consumers grep'd (3 hits).
- [x] `.claude-plugin/plugin.json` — version confirmed 0.4.0 via preflight output.

### Source 2 — the fix diff (`eed5c27`, 30 files)

Every file in `git show --stat eed5c27` is in the list above, plus:

- [x] `docs/reviews/corrections-0.4.0-round-04.md` — Read (outline + findings headers +
      verdict line). Record file; out of T-31/T-32 scan reach by design.

### Source 3 — fix-diff dependents

CodeGraph is not available in this session (see tool plan). Dependents were derived by
grep instead, which is the correct instrument for the dependency edges that exist here
(they are textual: check labels, fixture paths, anchor targets).

- [x] `tests/fixture/continuation/{complete,open-gate,no-gate,closeout,invalid,no-ledger}` —
      all six executed through the real hook.
- [x] `tests/fixture/deployment/{current-config,stale-config,worktree}` — executed via the
      T-29 cases.
- [x] `skills/expert-plan/scripts/derive-plan-sections.mjs`, `.../fixtures/valid-plan.md` —
      Grep'd for surviving cardinality restatements (2 hits, recorded in F1's scan).

### Source 4 — the prior round's findings as closure items

Round-4 findings N1, N2, N3, N4 re-derived from current source. Dispositions in
**Upstream Contract Verification** below.

### Tool plan (Step 3)

| Claim type | Instrument | Availability |
|---|---|---|
| Absence claims | `grep` over declared scope, result counts recorded | available |
| Literal-content claims | `Read` at file:line at drafting time | available |
| Behavioral claims (check reach, hook verdicts, preflight verdicts) | **execution + mutation** on isolated scratch copies | available |
| Structural / blast-radius | grep (CodeGraph unavailable) | **substituted** |
| Prior-document claims | re-derived from current source | available |
| Library-behavior claims | Context7 | **not needed** — no library-integration claim is load-bearing in this scope |

Disposition of the CodeGraph gap: not a halt. The Step 3 bright line makes an instrument
class unavailable for a *load-bearing claim category* a halt condition. No finding in this
review rests on a structural blast-radius claim; every dependency edge in scope is textual
and was verified by grep, which is the correct instrument for it per Step 6's
structural-vs-existence distinction.

### Mutation and probe battery

All probes ran on scratch copies at
`…/scratchpad/p0` (pristine) and `…/scratchpad/p1` (mutated). **The working tree was never
mutated.** A `git worktree` was attempted first and failed for an unrelated reason
(`Filename too long` under `claude-plugins/agentboard/skills/correction-loop-workspace/…`),
so the differential-baseline method was used instead.

Scratch-copy baseline: **3 environmental failures** (`T-A2a` repo-root linter, two `T-20`
git-baseline checks). Every probe below is scored against that baseline of 3, not against 0.

| # | Probe | Result |
|---|---|---|
| A | digit cardinality claim heading a list, in `skills/expert-plan/SKILL.md` | **MISSED** (3 fails) |
| B | spelled cardinal above ten (`eleven`) heading a list | **MISSED** (3 fails) |
| C | spelled cardinal in a brand-new top-level directory | CAUGHT (5 fails) |
| D | bare `file.js:42` citation in a non-comment JS string | **MISSED** (3 fails) |
| E | bare citation in a brand-new top-level directory `.md` | CAUGHT (5 fails) |
| F | `.yaml` cardinality claim in a **new** directory | CAUGHT (4 fails — by T-29, *not* T-31) |
| F′ | `.yaml` cardinality claim in an **existing** directory (`skills/expert-plan/references/`) | **MISSED** (3 fails) |
| G | drop/alter `jobs:` frontmatter in `agents/expert-verifier.md` | CAUGHT — `T-2b expert-verifier: jobs: equals its distinct dispatch-label count (5)` |
| H | emphasized bare count added to `agents/expert-reviewer.md` | CAUGHT — `T-31 no emphasized bare count … (found: agents/expert-reviewer.md:66)` |
| I | **decisive**: `You answer 7 distinct dispatches:` in `agents/expert-reviewer.md` **and** `Architecture work fails in twelve specific ways:` in `skills/expert-architecture/SKILL.md` | **MISSED** — 3 fails, tier green on both |

### Real-state exercises (both gates, both directions)

- `node scripts/preflight-deployment.mjs expert-dev-tools .` against the **real** installed
  cache: exit **1**, `verdict: STALE`, `installed_version: "0.3.0"` (cache manifest),
  `registry_recorded_version: "0.3.0"`, `registry_recorded_commit: "bb7107b…"`, 8 diff
  lines including `hooks/… (missing in installed cache)`. Correct in both content and
  field provenance.
- `continuation-gate.mjs` against the **real** repo ledger
  (`.claude/expert/ledger.json`, written 2026-08-17, pre-`task_verbatim`): exit **0** with
  `ledger is not schema-valid ($: missing required property 'task_verbatim') and so is not
  resumable; allowing the stop.` Fails open, as designed.
- `continuation-gate.mjs` on `no-gate` fixture with a full Stop payload and
  `CLAUDE_PROJECT_DIR` deleted: exit **2**, stderr naming phase `implement`, routing to
  `/expert resume`, and enumerating all seven §3.4 gate types.
- Same on `open-gate` (unresolved escalation): exit **0**. Legitimate halts still halt.

*(Method note, recorded because it nearly produced a false finding: invoking the hook from
Git Bash with a `$(pwd)`-derived POSIX path (`/c/Users/…`) makes the ledger unresolvable to
Node on Windows and the gate silently exits 0 — the no-ledger path. The blocking cases only
reproduce with Windows-form paths. A reviewer who stopped at the POSIX-path run would have
reported the gate inert.)*

### Rigor waivers

None. No step of the expert-review process was skipped or compressed, and no operator
directed a cycle stop.

---

## Summary

**This review returns NEEDS FIXES**, with 3 findings: 1 Systemic (recurring), 2 Moderate.

All four round-4 findings are closed against their originally named standards, each
verified by execution or mutation rather than by reading the fix. The round-4 foundational
rework is, on its central claim, real: reach by **directory** is now total by default, not
by allowlist — a cardinality claim or a bare citation planted in a brand-new top-level tree
is caught with nothing hand-maintained (probes C and E), and the `**N**` counts deleted from
the ten agent return contracts were re-pinned to `jobs:` frontmatter that `T-2b` derives
executably from the workflow's dispatch labels (probe G). The preflight provenance fix (N1)
is thorough and repaired an additional latent defect the round-4 finding did not name.

The rework nonetheless reproduces the cycle's defining defect class in a new form. Rounds
2, 3 and 4 each filed *a check whose stated scope exceeds its actual reach* against the
T-31 sweep, on the **directory** axis. This round the same control fails the same standard
on the **form** axis: `T-31` prints `no unpinned cardinality claim exists anywhere in reach
(found: none)` while its recognizer sees only spelled cardinals *two* through *ten*
immediately preceding a terminal colon. Thirty-seven instances of the identical
drift-prone construct survive in ten live, in-reach files, and two freshly planted
textbook instances pass the tier green (probe I). The commit message's claim that the form
"is gone from every live file" is not true of the class; it is true of the subset the
recognizer can see.

Neither tripwire condition fires this round under any defensible reading of the arithmetic
(shown three ways in the Convergence Record). The loop does not stop by rule. That
determination is mechanical and it should not be read as reassurance: the substantive
signal the tripwire exists to detect — one class surviving its own foundational rework — is
present, and Recommended Priority treats it accordingly.

---

## Upstream Contract Verification

### Round-4 findings as closure items

**N1 — preflight reported `installed_version` from the registry's unverified claim.
CLOSED.** Verified by execution, not by reading the fix: the real run emits
`installed_version` sourced from `primary.cache_manifest_version` and separate
`registry_recorded_version` / `registry_recorded_commit` fields. Read of
`scripts/preflight-deployment.mjs` diff confirms `report.installed_version =
primary.cache_manifest_version`. The originally named standard — a field named for what was
read carries a value read — is satisfied. The fix additionally corrected an unnamed latent
defect: `report.stale` and `report.diffs` were the primary entry's while the verdict
quantifies over every compared entry, so a two-scope install could print
`stale: false, diffs: []` above `VERDICT: STALE`. Now `compared.some(...)` and
`compared.flatMap(...)`.

**N2 — the count class stopped at the `skills/` directory boundary; twelve instances in
`agents/` unpinned. CLOSED.** Verified by mutation (probe H): an emphasized count planted in
`agents/expert-reviewer.md` is reported by label with its file:line. The walk is rooted at
the plugin root minus one literal-pinned record tree (`RECORD_TREES = ['docs']`, itself
asserted `length === 1 && [0] === 'docs'`), and probe C confirms a new tree is in reach with
no list edited. Grep confirms zero surviving `You answer \*\*N\*\*` constructs in `agents/`.
Closed on the directory axis it was filed on. (The class recurs on a different axis — F1.)

**N3 — T-31's drift check was labelled "every stated count" while examining 18 of 24.
CLOSED.** Verified by grep of `tests/structural/check-structure.mjs` for the label
`T-31 every stated count matches its list` — 1 hit, and it is inside the
`REPLACED_BY_STRENGTHENING` allowlist as a `was:` field, not in `check(` call position. The
overstating check no longer exists.

**N4 — cross-file line citations shipped with no immutable anchor; two of three rotted.
CLOSED.** Verified by execution and independent re-measurement: `T-32 no bare line citation
exists anywhere in reach (found: none)` passes at HEAD, and an independent re-implementation
of the anchor scan counts **12** anchored citations across `hooks/continuation-gate.mjs` (3),
`tests/structural/check-structure.mjs` (5), `tests/unit/run-unit-tests.mjs` (2),
`workflows/expert-lifecycle.js` (2) — every one resolving to a file in the plugin with its
quoted anchor still present at the target, since `T-32 … anchor is still present at its
target (dead: none)` passes. The originally named standard — cite by immutable identifier,
never by path plus mutable line — is satisfied for the citations in reach.

### Spec and architecture conformance

- **Spec §2 hooks amendment (owner, 2026-08-20)** — HONORED. Verified by execution: `T-A2c
  hooks: the Stop continuation gate is the only hook, and no tool-use hook exists` passes,
  and the amendment's replacement of the absolute no-hooks pin is recorded in
  `REPLACED_BY_STRENGTHENING` with the `was`/`now` pair both present.
- **Spec §3.4 seven gate types** — HONORED. Verified by execution of the real hook: the
  block reason enumerates `intent, spec_traceable, business, risk_override, non_convergence,
  core_approval, control_fault` — seven, matching the spec. `T-24` derives the count by
  lifting and **evaluating** the `GATE` literal rather than lexing its source text, so the
  language counts its own members.
- **Architecture fail-safe-defaults decision (OWASP secure design)** — HONORED. Verified by
  execution: every constructed and real gate case resolves to block-or-documented-fail-open,
  and the fail-open asymmetry is asserted by its own check (`T-30 the fail-open choice and
  its asymmetry with the fail-closed gates are documented in the script`).
- **Version 0.4.0** — HONORED. `worktree_version: "0.4.0"` in the real preflight run.

No upstream acceptance criterion in scope was found violated.

---

## Critical & Serious Findings

No Critical or Serious findings. The full inventory was Read or Grep-verified per Gate B,
both test tiers were executed at HEAD (444 structural ok / 0 fail; 46 unit ok / 0 fail),
both governed scripts were executed against real and constructed state in both the
permit and the block direction, and no violation of Critical or Serious classification was
observed.

---

## Systemic Patterns

### F1 — `T-31`'s stated scope exceeds its actual reach on the form axis: the recognizer sees only spelled cardinals *two*–*ten* before a terminal colon, and 37 instances of the identical construct survive in ten live in-reach files while the check prints `found: none` (Systemic — recurring)

**Location:** `tests/structural/check-structure.mjs:1854-1860`

**What the code does now.** Read at drafting time,
`tests/structural/check-structure.mjs:1854-1855`:

```js
const CARDINALS = ['two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
const cardinalityClaim = (line) => new RegExp(`\\b(${CARDINALS.join('|')})\\b(?=[^.]*:$)`, 'i').test(line);
```

The assertion built on it, Read at `:1859-1860`, is labelled
`` `T-31 no unpinned cardinality claim exists anywhere in reach (found: ${stated.join('; ') || 'none'})` ``
and asserts `stated.length === 0`. The block's header comment, Read at `:1786-1793`,
states the property as *"NO UNPINNED CARDINALITY CLAIM… The word is gone from every live
file."* The commit message for `eed5c27` states the same: *"unpinned cardinality claims in
prose are deleted… Each class is now enforced by one whole-plugin check with no directory
scoping."*

Three constructs the label covers and the predicate cannot see:

1. **Digits.** `The 12 gate types:` — no spelled cardinal, no match.
2. **Spelled cardinals above ten.** `There are eleven signals:` — not in `CARDINALS`.
3. **Any restatement not immediately preceding a terminal colon** — `Read all five before
   starting`, `fails in five specific ways`, `the sixteen-section specification`,
   `all five parts of the decision format`. The lookahead `(?=[^.]*:$)` requires the
   colon to end the line with no intervening sentence break.

**How the claim was verified.** By **execution and mutation**, never by reading assertions.
On a scratch copy (working tree untouched), against a measured baseline of 3 environmental
failures:

- Probe A — appended `The 12 gate types:` + a list to `skills/expert-plan/SKILL.md`:
  tier **PASSED**, 3 fails (baseline).
- Probe B — appended `There are eleven signals:` + a list: tier **PASSED**, 3 fails.
- Probe I (decisive) — appended `You answer 7 distinct dispatches:` + a list to
  `agents/expert-reviewer.md` **and** `Architecture work fails in twelve specific ways:` +
  a list to `skills/expert-architecture/SKILL.md`, i.e. two textbook instances of the exact
  construct the block's comment says is "gone from every live file", in two different live
  in-reach trees: tier **PASSED**, 3 fails, with `T-31 no unpinned cardinality claim exists
  anywhere in reach (found: none)` printing green.

**Proactive scan across the full inventory scope (Step 8 — not extrapolated from sample).**
Query, run over `./skills ./agents ./commands ./README.md` (`--include=*.md`, `docs/`
excluded as out of scan reach by design):

```
grep -rnoE "\b(all (three|four|five|six|seven|eight|nine|ten)|Read all (three|four|five)\
|fails in (three|four|five|six) specific ways|the (first|last) (two|three|four)\
|each of the (three|four|five)|sixteen-section\
|(three|four|five|six|seven|eight|nine|ten|sixteen)-(part|section|way|step)\
|exactly (two|three|four|five) forms|one of (two|three|four|five))\b"
```

**Result count: 37 matches across 10 files.** Enumerated by file:

- `skills/expert-architecture/SKILL.md` — `:32` (`fails in five specific ways`,
  `the last two`, `Read all five`), `:62`, `:478`, `:512` (`all five parts`), `:544`
  (`each of the five`), `:560` (`all five traps`) — 9 matches.
- `skills/expert-architecture-portable/SKILL.md` — `:36` (same three), `:117`, `:118`
  (×2), `:316`, `:337` (`all five parts`), `:340`, `:353`, `:361` — 12 matches.
- `skills/expert-plan/references/output-contract.md` — `:24`, `:60` (`all five fields`),
  `:86`, `:109` (`all four Gate 3 parts`), `:119` (`all five fields`) — 6 matches.
- `skills/expert-plan/SKILL.md` — `:82`, `:388` (`sixteen-section`, `all three`) — 3.
- `skills/expert-review/SKILL.md` — `:367` (`all four sources`), `:553` — 3.
- `agents/expert-planner.md:24` (`sixteen-section plan`) — 1.
- `agents/expert-reviewer.md:34` (`one of two`) — 1.
- `skills/expert-standard/SKILL.md:32` — 1.
- `skills/expert-plan/scripts/fixtures/valid-plan.md:4` — 1.

Every one of these files is inside the walk's reach (confirmed: they are non-`docs/`
`.md` files, and `T-31 the reach includes every live tree` passes for `skills/`, `agents/`,
`commands/`).

Two of these are **cross-file** counts — the highest-risk sub-form, because the number and
the population it describes live in different files and no reader sees them together:
`skills/expert-plan/SKILL.md:388` and `agents/expert-planner.md:24` both assert the
*sixteen-section* specification of `skills/expert-plan/references/output-contract.md`.
I re-derived that population: `grep -cE "^[0-9]+\. \*\*" output-contract.md` → **16**.
Currently accurate, and maintained by hand in two files against a third.

**Which standard it violates, and why.** The same standard rounds 2, 3 and 4 each filed
against this control: *a control's stated scope must equal its actual reach, or the green
line is a false assurance* — the round-3 and round-4 records name it in those terms, and
this block's own header comment adopts it verbatim at `:1802` (*"Reach is a measured
property rather than a claim"*). It also violates the project's standing rule, recorded in
`skills/expert-plan/references/output-contract.md:80` and enacted by this very block, that
hand-maintained derived data must be deleted or pinned to an executable source of truth:
37 hand-maintained restatements of derived counts remain, none pinned, none visible to the
control that reports the class empty.

This is systemic rather than isolated on three independent grounds: the construct occurs in
10 files across 3 live trees, not in one place; the identical standard has now been violated
by the identical control in four consecutive rounds; and the failure mode is the *reporting*
one, which is strictly worse than an absent check — a maintainer reading `found: none` has
been told the class is empty when 37 members are present.

**What correct implementation looks like.** Two changes, neither of which reintroduces a
maintained list:

1. Widen the recognizer to the class rather than a lexical subset: admit digits
   (`\d+`) alongside spelled cardinals, extend the spelled set past *ten* (or replace the
   enumeration with a number-word matcher), and drop the terminal-colon requirement in
   favour of a construct that also recognizes the restatement forms (`all N`, `Read all N`,
   `each of the N`, `N-part`, `N-section`, `fails in N ways`). The predicate's negative
   cases at `:1921-1924` must be extended in step so the widened recognizer is still
   demonstrably able to reject ordinary prose.
2. Resolve the 37 surviving instances the same way the round-4 rework resolved the others —
   delete the number where the adjacent list carries it, and where it is genuinely
   load-bearing across files (the two `sixteen-section` claims) point at the source of truth
   instead of restating it, exactly as the agent return contracts now point at `jobs:`.

Then re-run the mutation battery: probes A, B and I must all fail the tier.

---

## Moderate & Minor Findings

### F2 — the block asserts of itself that it contains no population floor, and contains one: `T-32` pins `anchored.length >= 10` against a population it measures, currently 12 (Moderate — new)

**Location:** `tests/structural/check-structure.mjs:1804-1805` and
`tests/structural/check-structure.mjs:1917-1918`

**What the code does now.** Read at `:1802-1805`, the block's design claim:

> *"Reach is a measured property rather than a claim, and it is total by DEFAULT… **Nothing
> here has a per-instance allowlist, a designation, or a population floor to keep in step
> with the population.**"*

Read at `:1917-1918`, in the same block:

```js
check(`T-32 the citations were converted rather than deleted (anchored citations found: ${anchored.length}, floor 10)`,
  anchored.length >= 10);
```

That is a floor on the population the check itself measures. The author distinguishes the
two kinds correctly elsewhere — the comment at `:1840-1842` explicitly justifies the T-31
floor as *"A floor on the WALK, not on any population it measures"* — which is exactly why
the T-32 floor is not the same thing and is not covered by that justification.

**How the claim was verified.** Read of both line ranges at drafting time, plus independent
re-measurement of the population: a re-implementation of the walk and the `ANCHORED` regex
counts **12** anchored citations (`hooks/continuation-gate.mjs` 3,
`tests/structural/check-structure.mjs` 5, `tests/unit/run-unit-tests.mjs` 2,
`workflows/expert-lifecycle.js` 2). Slack against the floor is 2. Not a prior-document
claim — re-derived from current source.

**Which standard it violates and why.** Two, both named by this branch's own work. First,
the comment claim is false about the code it documents, and per the expert-review skill's
own rule (`skills/expert-review/SKILL.md`, the comment-claims bullet of Step 6) a comment
asserting a property is the author's claim, never verification — here it is a load-bearing
claim in the block that justifies the entire foundational rework, and it does not hold.
Second, the floor is itself hand-maintained derived data keyed to a population that changes
whenever a citation is added or removed — the class this block exists to eliminate. With 2
of slack, deleting three citations turns the tier red for no defect, and the maintainer's
repair is to edit the floor, which is the maintenance loop the rework was meant to end.

**What correct implementation looks like.** Replace the floor with a property that cannot
drift with content. The obligation being protected — *citations were converted, not deleted*
— is already fully carried by the two assertions above it (`unresolved.length === 0` and
`dead.length === 0`) plus `T-32`'s bare-citation emptiness assertion: a deleted citation
cannot be an unresolved or dead one, so the floor adds nothing those three do not. Delete
it, and correct the `:1804-1805` comment to match the code. If a non-emptiness guard is
genuinely wanted, pin it to the walk (as T-31's floor is) rather than to the citation count.

### F3 — `T-31` and `T-32` silently exclude every file whose extension is not `.md`, `.mjs`, `.js` or `.json`, and `T-32` additionally sees only comment lines in code files, while both are labelled "anywhere in reach" (Moderate — new)

**Location:** `tests/structural/check-structure.mjs:1816` and
`tests/structural/check-structure.mjs:1878-1883`

**What the code does now.** Read at `:1816`: `const SCANNED_EXT = /\.(md|mjs|js|json)$/;` —
the walk collects only these, so `reach` is defined by extension as well as by directory,
and nothing in the two checks' labels or in the block's header comment says so. Read at
`:1878-1883`: for non-`.md`/`.json` files `commentLines` filters to
`/^\s*(\/\/|\*|\/\*)/`, so the `BARE` citation scan never sees a code line.

**How the claim was verified.** By mutation on scratch copies, against the 3-failure
baseline:

- Probe F′ — wrote `Three widgets:` + a list to
  `skills/expert-plan/references/note.yaml`, inside an already-classified directory: tier
  **PASSED**, 3 fails. (Probe F, the same content in a *new* directory, was caught — but by
  `T-29 every plugin-root directory is classified as compared or excluded (unclassified:
  newtree)`, a different control that catches the directory, not the claim. Inside an
  existing directory nothing sees it.)
- Probe D — appended
  `const note = "see workflows/expert-lifecycle.js:42 for detail";` to
  `scripts/preflight-deployment.mjs`: tier **PASSED**, 3 fails.

Both gaps are currently **latent, not live**. Verified by grep:
`find . -path ./docs -prune -o -type f -print | grep -v "\.\(md\|mjs\|js\|json\)$"` →
2 hits, both `tests/fixture/transcripts/*.jsonl` (data fixtures, no prose). And
`grep -rnE '\b[\w./-]+\.(mjs|js|json|md):[0-9]+' --include=*.mjs --include=*.js .`
excluding `docs/` and comment lines → **0 hits**. The severity rests on the label
overstating reach, not on a shipped rotted citation.

**Which standard it violates and why.** The same standard as F1 — stated scope must equal
actual reach — applied to the extension and line-type axes rather than the directory axis.
The distinction matters for the fix: the comment-line restriction at `:1874-1877` is
*documented and reasoned* (a location-shaped string on a code line is test data, and
distinguishing them would need the maintained list the block exists to delete), so it is a
defensible narrowing that the *label* nevertheless fails to disclose. The extension
restriction has no such justification anywhere in the block and is invisible to a reader of
either label. A narrowing that is deliberate and defensible is fine; a narrowing the check's
own label denies is the same false-assurance failure as F1.

**What correct implementation looks like.** State the reach in the labels and the header
comment — `no unpinned cardinality claim exists in any scanned file (extensions: md, mjs,
js, json)` — and add the reasoning for the extension filter alongside the existing
comment-line reasoning at `:1874-1877`. Where a prose-bearing extension is plausible in
this plugin (`.yaml`, `.yml`, `.txt`), add it to `SCANNED_EXT`; the walk needs no other
change. For the code-line gap, the honest fix is the label, not the scanner.

---

## Tentative Findings

No tentative findings — every candidate finding's premise was verified against current
source by Read at drafting time, by grep with the query and result count recorded, or by
executed mutation on an isolated scratch copy, per Gate B.

Two candidates were **dropped** after verification contradicted them, recorded here because
each would otherwise look like an omission:

- *"The `spec-contradictory.md` fixture's semantics were altered to satisfy the lint."*
  The changed sentence is `no two of them can hold together` → `they cannot all hold
  together`. Read of the full fixture shows the following paragraph still states the
  pairwise contradictions explicitly (*"R-1 and R-2 cannot both hold"*, *"R-1 contradicts
  it and R-2 contradicts it as well, each on its own"*), so the fixture's meaning is
  preserved — and the original phrasing was in fact the less accurate of the two, since R-3
  is consistent. Not a defect.
- *"`skills/expert-architecture-portable/SKILL.md` contradicts itself, saying both
  `six-part` and `all five parts`."* Read of `:117`, `:337` and `:232-240` shows `six-part`
  describes the `scientificmethod` chain, not the decision format, and the decision format
  at `:232-239` does enumerate exactly five parts. `all five parts` at `:337` is currently
  accurate. It is unpinned (counted in F1's scan) but not rotted.

---

## Observations

- **The `REPLACED_BY_STRENGTHENING` allowlist is hand-maintained and grows every round
  (~17 entries), but it is not an exemption channel for the two properties** and does not
  reinstate the class. Verified by Read of `:482-703` and of the guard predicate at
  `:691-698`: it governs only the *check-deletion oracle*, an entry requires a real
  baseline label as `was` **and** a live label present in `check(` call position as `now`,
  and presence is structural rather than textual — the deliberately absent
  `currentSrc.includes(l)` disjunct is documented at `:684-690` as the exact defect that
  once let this guard report green over a deleted check. Four self-tests (`T-A2f`) exercise
  the live predicate, including the case where an allowlisted replacement's new label is
  absent. No standard violation; recorded because the round-5 brief asked specifically
  whether any exemption set is hand-maintained.
- **The rework deleted maintained surface rather than relocating it, on the axis it
  claims.** The ten `You answer **N**` prose counts did not move to a second unchecked
  home: they became `jobs: N` frontmatter, and probe G confirms `T-2b` derives that number
  from the workflow's dispatch labels and fails on mutation. No standard violation.
- **The behavioral prose was rewritten carefully, not mangled.** Read of every prose hunk
  in `eed5c27` across the ~20 skill/agent files: each lead-in that lost its count retains an
  immediately adjacent enumeration (`Signals that this failure mode is active:`,
  `Only the categories below qualify, and no others:`), and two rewrites are improvements on
  the originals (`Every finding has two axes` → `Every finding is judged on a frame axis and
  a premise axis` names what was previously only counted). The single infelicity — seven
  single-job agents now read *"the distinct dispatches… each named by the label"* where
  `jobs: 1` — resolves at the pointer the same sentence supplies, so it carries no standard
  violation and is recorded here rather than as a finding.
- The real repository ledger at `.claude/expert/ledger.json` predates the `task_verbatim`
  schema requirement and is therefore inert under the new gate. This is the designed
  fail-open path and it announces itself on stderr; noted only so the next round is not
  surprised that the live ledger governs nothing.
- CodeGraph was unavailable this session; dependents were derived by grep. Disposition
  recorded in the tool plan — not a halt, because no finding rests on a structural claim.

---

## What's Actually Good

- **The two properties are genuinely unscoped by directory, and that is the defect the
  cycle kept filing.** Property: a claim planted in a tree that did not exist when the check
  was written is caught with no list edited. Standard: the same *stated scope equals actual
  reach* standard F1 is filed under — met here, on this axis. Verified by executed mutation,
  not by reading: probes C and E both turned the tier red from a brand-new top-level
  directory. The `RECORD_TREES` exclusion is pinned to a literal single entry by its own
  assertion at `:1813-1814`, so it cannot quietly grow into the hand-drawn boundary the
  block exists to remove.
- **`T-32` reads the anchor at its target rather than trusting the citation.** Property: a
  citation whose quoted excerpt no longer exists at the named file is reported dead, and an
  unresolvable target is a failure rather than a skip — the latter explicitly because a
  prior citation named a file this plugin does not contain and a skipping resolver reported
  it green (`:1897-1900`). Standard: the expert-review skill's own rule that a claim about a
  file outside the artifact is cited by immutable identifier, never by path alone. Verified
  by independent re-implementation of the resolver over the live plugin: all 12 anchors
  resolve and all 12 excerpts are present.
- **The continuation gate's verdicts are correct in both directions on real and constructed
  state.** Property: it blocks an untyped mid-phase halt with an actionable reason and
  permits every legitimate one. Standard: OWASP secure-design fail-safe defaults, with the
  fail-open exceptions documented and separately asserted. Verified by executing the real
  script — exit 2 with the seven-gate enumeration on `no-gate`; exit 0 on `open-gate`,
  `complete`, `no-ledger`; exit 0 with an explanatory note on the live schema-invalid
  ledger.
- **The N1 preflight fix repaired more than the finding named.** Property: reported
  provenance is the provenance the verdict consumed, and `stale`/`diffs` now quantify over
  every compared install rather than the primary one. Standard: a field named for what was
  read carries a value read from disk. Verified by executing the script against the real
  installed 0.3.0 cache and reading the emitted JSON field by field.

---

## Convergence Record

**Round number:** 5 (post-fix), matching Scope and Inventory.

**Trajectory** (by severity, each round's own mechanical breakdown):

| Round | Total | Breakdown |
|---|---|---|
| R1 | 6 | 1 Critical, 3 Serious, 2 Moderate |
| R2 | 4 | 1 Serious, 2 Moderate, 1 Minor |
| R3 | 3 | 1 Serious, 2 Moderate |
| R4 | 4 | 1 Systemic, 2 Moderate, 1 Minor |
| **R5** | **3** | **1 Systemic (recurring), 2 Moderate** |

**Flow counts for this round** (provenance classifications from Step 9 are the source):

- **Prior findings closed: 4** — N1, N2, N3, N4, each verified against its originally named
  standard by execution, mutation, or grep with the result count recorded.
- **New findings: 2** — F2, F3.
- **Recurring findings: 1** — F1 (same standard, same control `T-31` in
  `tests/structural/check-structure.mjs`, fourth consecutive round).
- **Regressions: 0.** No finding this round was introduced or exposed by the fixes at a
  site the fixes did not already own; F2 and F3 are defects in newly written code, which is
  *new*, not *regression*, and no previously passing behavior was broken (both tiers green
  at HEAD, `T-20` deletion guard passing).

**Tripwire evaluation — arithmetic shown, all three readings.**

*Condition (a): new + regression ≥ closed, for two consecutive post-fix rounds.*

- Strict reading (the rule as written — `recurring` is its own provenance and is not summed
  into `new`): `2 + 0 = 2`; closed `= 4`. **2 ≥ 4 is FALSE.**
- Conservative reading (count F1 on the new side, since it is filed against code that did
  not exist before): `3 + 0 = 3`; closed `= 4`. **3 ≥ 4 is FALSE.**
- Maximal reading (treat N2 as not closed because its class recurs, moving it off the
  closed side): `3`; closed `= 3`. **3 ≥ 3 is TRUE.** This reading is rejected on evidence:
  N2 was filed specifically against the `skills/` directory boundary and probe H
  demonstrates `agents/` is now in reach, so N2 is closed at the standard it named. A
  reviewer may not reopen a verified closure to reach a preferred arithmetic.

Condition (a) held in round 4. It does **not** hold in round 5 under the rule as written or
under the conservative reading. Two consecutive rounds are required. **Condition (a) does
not fire.**

*Condition (b): total findings has not strictly decreased, for two consecutive post-fix
rounds.*

- R3 → R4: `3 → 4`, not a strict decrease. Condition held in round 4.
- R4 → R5: `4 → 3`, **a strict decrease.** Condition does not hold in round 5.

Two consecutive rounds are required. **Condition (b) does not fire.**

**Determination: the non-convergence tripwire is NOT FIRED.** Both conditions held in round
4 and both are broken in round 5. The fix cycle does not stop for foundational rework by
rule, and this review's verdict — NEEDS FIXES — is derived from its own finding set, not
from the tripwire.

**What that determination does not mean.** The tripwire measures flow rates, and this round
the flow improved on both axes: more closed than opened, and the total fell. The substantive
signal it was designed to detect is nonetheless present in F1 and is not captured by either
condition: one defect class has now survived four consecutive rounds against the same
control, including a round of deliberate foundational rework aimed at it. The rework moved
the class from the directory axis to the form axis rather than eliminating it. Reporting the
tripwire as unfired is the mechanical truth; treating that as evidence the class is
converging would be the error the tripwire exists to prevent, and Recommended Priority is
written accordingly.

---

## Open Findings Ledger

Not applicable — no operator has directed that the fix cycle stop with open findings.

---

## Recommended Priority

The tripwire has not fired, so this section does not open with the mandatory Gate 8
foundational-rework directive. It opens instead with the reason that directive is being
recommended anyway, for F1 alone, on the evidence rather than on the rule.

1. **F1 first, and treat it as foundational rather than as a fix.** This is the fourth
   consecutive round in which `T-31` has been found asserting a reach it does not have, and
   the third consecutive *fix* for it has now failed in the same way — round 2 pinned one
   instance, round 3 reached `skills/`, round 4 made the directory reach total, and each
   time the check's label continued to claim a totality the recognizer could not deliver.
   The pattern across those rounds is that the *reach* has been repaired repeatedly while
   the *label's totality claim* was never brought into correspondence with what the
   predicate can see. Widening the recognizer once more, on its own, is the fourth
   iteration of the move that has not worked. Re-derive from the sources: decide what the
   class is (every restatement of a derived count, in any notation), write the recognizer to
   that definition, write the label to what the recognizer actually does, and resolve the 37
   surviving instances the way the agent return contracts were resolved — deleted where the
   list carries the number, pointed at an executable source of truth where it is genuinely
   load-bearing. Do not carry the failed attempt forward.
2. **F2 next.** It is a two-line change (delete the floor, correct the comment) and it
   matters out of proportion to its size: the false self-description sits in the comment
   block that justifies the entire foundational rework, and a future reviewer or maintainer
   reading `Nothing here has… a population floor` will not go looking for the one that is
   there.
3. **F3 last.** Both gaps are latent — no prose-bearing unscanned file and no bare citation
   in a code string exists in the plugin today — so the cost of the gap is currently zero
   and the fix is mostly honesty in the labels. It should nonetheless land in the same pass
   as F1, because it is the same standard on a third axis and fixing F1's label while
   leaving F3's overstated would leave the class half-corrected again.

All three are in one file and one contiguous region. They should be fixed together, and the
fix should be validated the way this review validated the current state: by mutation on a
scratch copy, with probes A, B, D, F′ and I required to turn the tier red before the work is
reported closed.

---

Verdict: NEEDS FIXES (3 findings: 1 Systemic, 2 Moderate)
