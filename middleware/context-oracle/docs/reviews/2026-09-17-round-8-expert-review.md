# Round 8 — Independent post-fix expert-review of `docs/plans/plan-phase-a.md`

**Date:** 2026-09-17
**Reviewer:** independent fresh session; I did not author this plan, the S1 fix,
or the round-7 (M1, T1) fix under review.
**Artifact under review:** `docs/plans/plan-phase-a.md` as installed in the
working tree, diffed against `ab319a3` (the plan revision the round-7 independent
passes reviewed). The plan change under review is entirely in commit `0eb5e6f`
("apply round-7 fixes (M1, T1) + author-gates walk"); its plan diff equals the
`ab319a3..` plan diff (50 lines / 3 hunks).
**Nature:** Post-fix review after the round-7 findings — the expert-review
(`2026-09-17-round-7-expert-review.md`, 1 Moderate) and the collapse-hunt
(`2026-09-17-round-7-collapse-hunt.md`, 1 Moderate + 1 Trivial). The author-gates
walk (`2026-09-17-round-7-author-gates-review.md`) records the two M1s as one
finding. This pass verifies M1's and T1's remediation and runs a fresh full
review over the changed surface.
**Standards this review evaluates against:** the plan's own named sources for the
changed step — `AD-13` (miner: "each exclusion recorded … never guess"), `AD-24`
(the test tier's equivalence-partitioning discipline the T-13-1 Data claims),
`FR-K2` (hygiene), the Phase A goal (`spec §11.5`: an *honest* deterministic floor,
never fake completeness) — plus the expert-plan build-contract standard ("another
engineer can execute step by step without making a single decision on the fly").

---

## Scope and Inventory

**Round number:** 8 (second post-fix round; R7 was post-fix round 1).

**Post-fix inventory sources (Step 2 rule):**
1. *Prior review's inventory* — round-7 expert-review and round-7 collapse-hunt
   (both Read below), whose inventories centred on Step 13, T-13-1, Q56, §11.4
   probes 24/27, §6 diagnostics.
2. *Fix-diff files* — the round-7 fix touches four files (`0eb5e6f`), of which the
   only in-scope reviewed artifact is `plan-phase-a.md`; the diff's three plan
   hunks are Step 13 prose, T-13-1 Data, Q56.
3. *Fix-diff dependents (restating surfaces)* — `derive-plan-sections.mjs --impact`
   reports the only changed step as S13; its restating surfaces are T-13-1 (the
   fixture), Q56 (the register), and §11.4 probe 27 (the executed premise).
4. *Prior findings as closure items* — round-7 **M1** (residual-quote branch
   untested) and round-7 **T1** (Step 13 prose order).

**File checklist:**

- [x] `docs/plans/plan-phase-a.md` — Read at 2116–2185 (Step 13), 7800–7875
  (T-13-1 incl. Data + `Fails when`), 905–944 (miner-hygiene fixture def, §924),
  7133–7154 (§11.4 probes 24+27), 1350–1361 (§6 `miner_unparsed_numstat`),
  9835–9862 (Q56/Q57). Mechanical gates run (below).
- [x] `docs/reviews/2026-09-17-round-7-expert-review.md` — Read (closure item M1).
- [x] `docs/reviews/2026-09-17-round-7-collapse-hunt.md` — Read (closure items M1, T1).
- [x] `docs/reviews/2026-09-17-round-7-author-gates-review.md` — Read (author's
  closure claims for M1/T1 and the Q56 re-derivation).
- [x] git behavior (git 2.43.0, this environment) — **executed** three cases,
  pasted under the findings; stronger than a docs lookup, so Context7 not required.
- [x] Plan structural gates — `derive-plan-sections.mjs --check` and
  `tools/check_docs.py` both run this pass (results below).

**Tool plan (Step 3):**

| Claim type in this review | Instrument | Used |
|---|---|---|
| Literal plan text ("line N says Z") | Read at file:line | ✓ (ranges above) |
| git behavior ("`core.quotePath=false` C-quotes `\`/`"`/tab", "rename identity quoted independently") | **direct execution** (git 2.43.0) | ✓ (pasted below) |
| Absence ("no plain quoted path field is planted") | grep + Read of the fixture Data scope | ✓ |
| Structural consistency (regions, cross-refs current) | `derive-plan-sections.mjs --check`; `tools/check_docs.py` | ✓ (both pass) |
| Multi-perspective pre-delivery check | `collaborativereasoning` | infra not invoked; performed manually (standards / downstream / implementer) and recorded in Observations |

No instrument class was unavailable for any load-bearing claim category; the
git-behavior category — the core of this change — was verified by execution. No
rigor waivers were requested or taken.

**Scope note (verified, out of scope).** `git diff ab319a3..HEAD` at the monorepo
root shows a later, unrelated commit `c3ef779` ("c2") that added two stray files at
the repository root (`c\d.txt`, `plainquoted.txt`). Verified by `git show --stat
c3ef779`: it touches **neither** the plan nor anything under
`middleware/context-oracle/`, so it is out of this review's scope and is not
attributable to the round-7 fix work. Recorded in Observations for the caller's
awareness, not as a finding against the plan.

## Summary

**This review returns NEEDS FIXES (2 findings: 1 Moderate, 1 Minor).** T1 is
closed: Step 13's residual-quote rule now follows the rename-split sentence it
references, so the "rename identity" term has its antecedent defined first
(verified by Read). The M1 fix is directionally right and its central premise is
sound — I reproduced, on git 2.43.0, that a rename to a backslash-bearing path
prints `orig.txt => "a\\b.txt"` with the new identity beginning with a
double-quote, so the fixture's residual-quote rename genuinely reaches the skip
branch that round 7 found untested. But in wiring that new rename into T-13-1 the
fix did not reconcile it with the test's pre-existing `Fails when` clauses: the
unqualified clause "a rename's old or new identity is missing from the pair
counts" now **contradicts** the residual-quote skip the same test demands, so a
correct implementation cannot satisfy T-13-1 under a literal reading (M1, Moderate,
a regression the fix introduced). And the plain (non-rename) C-quoted path field —
the literal subject of the guard clause the fix leans on, and the *primary* case
both round-7 fix notes named — is still not planted; only the rename manifestation
is (m1, Minor). The residual-quote/numstat-path-keying seam has now produced
findings in three consecutive rounds (S1 → M1 → M1+m1), and the non-convergence
tripwire fires this round (arithmetic in the Convergence Record).

## Upstream Contract Verification

Upstream references governing this scope: the plan's named sources (AD-13, AD-24,
FR-K2), the Phase A goal (spec §11.5), and round-7 M1/T1 as closure items.

- **AD-13 "each exclusion recorded … never guess" — residual-quote *rename*
  branch.** **Honored in the Step 13 rule, not cleanly verifiable in the test.**
  Step 13 (`:2140–2144`) routes any rename identity beginning with `"` to
  `miner_unparsed_numstat`, never guessed; git makes the detection reachable
  (executed). But T-13-1's guard for that behavior is internally contradictory
  (M1), so the plan's own verification of "never guess" for this case does not
  hold as written. *Verified:* Read of Step 13 + T-13-1; git execution.
- **AD-24 equivalence partitioning over "path encodings" (claimed at
  `:7841–7843`).** **Partially honored.** The residually-C-quoted *rename-identity*
  partition is now populated (`:7836–7841`); the residually-C-quoted *plain path
  field* partition — a distinct git output shape (executed) and the literal subject
  of clause `:7851–7853` — is not (m1). *Verified:* Read of the fixture Data + git
  execution of both shapes.
- **Phase A goal (spec §11.5) — honest floor, no silent bias.** **Advanced for the
  rename case, residual risk on the guard.** The rename manifestation of the
  quoted-path skip is now exercised; the contradictory guard (M1) and the
  unpopulated plain-field partition (m1) are the residual risks to a floor whose
  "never guess" mechanism must be provably exercised, not merely asserted.
- **Round-7 T1 (Step 13 prose order) closure.** **Closed.** The residual-quote
  sentence now follows the rename-split sentence (`:2133–2144`); the "either rename
  identity" reference has its antecedent defined first. *Verified:* Read at
  `:2133–2144` against the round-7 CH T1 description.
- **Round-7 M1 (residual-quote branch untested) closure.** **Not fully closed
  against its named standard.** The rename manifestation is now exercised (the
  vacuous-guard state is gone for that partition), but the fix introduced M1 (the
  guard is now self-contradictory for the planted rename) and left the plain-field
  partition unexercised (m1). Round-7 M1's standard — "a partition a spec claims
  must be populated by data that exercises it" and the never-guess branch proven to
  fire — is therefore met for one partition and broken for the guard's coherence.
  *Verified:* Read of T-13-1 Data + `Fails when`; git execution; grep of the
  fixture Data for a plain quoted-path plant (none).

## Critical & Serious Findings

No Critical or Serious findings — the full post-fix inventory above was Read or
executed/grep-verified, and no violation of Critical or Serious classification was
observed. The prior-round Serious closure item (round-6 S1, the silent non-ASCII
mis-key) remains closed: this diff does not touch the `café.txt` raw-UTF-8 keying
clause (`:7849–7851`), verified by Read.

## Systemic Patterns

No systemic patterns — verified by a scan for a second, independent instance of the
M1 pattern ("a `Fails when` clause whose pass condition contradicts another clause
in the same spec") outside the residual-quote handling. grep across the plan for
`Fails when` (the guard marker) returns the per-test guards; I Read the guards for
the tests adjacent to the changed surface (T-12-1 `:7815–7817`, T-14-1
`:7871–7875`) and found no contradictory pass conditions. Both findings below are
facets of the *single* residual-quote change; extrapolating them to a systemic
claim across the 124 test specs would fail the Step 8 scan rule. The recurrence
across rounds is a *convergence* signal (see the Convergence Record), not a
systemic spread across the codebase.

## Moderate & Minor Findings

### M1 — T-13-1's clause "a rename's old or new identity is missing from the pair counts" contradicts the residual-quote skip the same test requires, so a correct implementation cannot pass under a literal reading

**What the plan does now.** The M1 fix plants, in the `miner-hygiene` fixture, "one
file renamed to a residually C-quoted path (`a\b.txt` …) … reaching the
residual-quote skip on a rename identity" (`:7836–7841`). Under
`core.quotePath=false` git prints this rename's `--numstat` path field as
`orig.txt => "a\\b.txt"` — the old identity a clean literal, the new identity
beginning with a double-quote (executed below). Step 13 requires the quoted new
identity to be routed to `miner_unparsed_numstat`, "never guessed" (`:2140–2144`),
and T-13-1's clause **[g]** enforces exactly that: "any C-quoted or escaped path
field — one beginning with a double-quote — lands in `files` or `cochange_pairs`
instead of being recorded as `miner_unparsed_numstat`" fails the test
(`:7851–7853`). But the test's pre-existing, **unqualified** clause **[d]** — "a
rename's old or new identity is missing from the pair counts" (`:7847`) — fires
whenever *any* rename identity is absent from the pair counts. The planted
residual-quote rename's new identity is *deliberately* absent (that is the correct
behavior [g] demands). So on a correct implementation clause [d] fires and the test
fails; on an implementation that stores `"a\\b.txt"` verbatim, clause [g] fires and
the test fails. Under a literal reading the two clauses are unsatisfiable together
for this planted input.

**How this was verified.**
- Read of T-13-1 `Fails when` at `plan-phase-a.md:7844–7854` (clause [d] at `:7847`,
  clause [g] at `:7851–7853`) and the residual-quote rename Data at `:7836–7841`, at
  the time this finding was drafted. Clause [d] carries no scoping to the two
  literal renames; it reads over "a rename."
- git behavior, executed in this environment (git 2.43.0):
  ```
  $ git -c core.quotePath=false log --no-merges --numstat -M --format=%H%x00%at%x00 -1
  0    0    orig.txt => "a\\b.txt"      # old side clean literal; new side quoted
  1    0    partner.txt
  ```
  The field is a git-detected rename (`orig.txt` => `"a\\b.txt"`); only the new
  identity begins with `"`. Step 13's stated ordering (`:2133–2144`) is: split the
  rename into both identities and add both to the touched-file set, *then* apply the
  leading-quote skip — so the line is counted as a rename before the quoted identity
  is removed, which is exactly when clause [d]'s "identity missing from the pair
  counts" applies.
- The plan does not resolve the related question the fix opened: whether the clean
  *old* identity `orig.txt` (a path deleted by the rename, absent at HEAD) is kept
  and counted with the partner, or dropped with the whole line. Step 13's prose ("…
  *either rename identity* … is skipped") reads as skip-only-the-quoted-identity
  (keep `orig.txt`), which would key a co-change pair on a path the indexer's
  `readdir` never produces; the honest-floor intent more likely wants the whole line
  skipped. Neither Step 13 nor T-13-1 states which. This ambiguity is what forces the
  clause [d]/[g] collision to be resolved by inference.

**Standard it violates.** The expert-plan build-contract standard — "another
engineer can execute step by step without making a single decision on the fly." A
`Fails when` list whose clauses cannot be jointly satisfied for a planted input
forces the implementer to *infer* that clause [d] is silently scoped to the two
literal renames and does not govern the residual-quote rename — a decision on the
fly, in the exact test that guards the Phase A honest floor (spec §11.5). This is
sharper than the round-7 vacuous-guard defect: there the guard could not fail; here
the guard cannot pass on correct code.

**What correct looks like.** Scope clause [d] to the literal renames it was written
for (e.g. "either *literal* rename's old and new identity is missing …"), and add
an explicit clause for the residual-quote rename stating its required contribution —
the whole line recorded as `miner_unparsed_numstat`, contributing no pair (neither
`orig.txt` nor `"a\\b.txt"` in `cochange_pairs`) — and resolve in Step 13 whether the
clean old identity is kept or dropped, so the fixture's expected pair set is
determinate. Then the residual-quote rename has one coherent, satisfiable set of
pass conditions.

**Classification.** Moderate. **Provenance.** Regression — introduced by the M1
fix. Before this fix the fixture's only renames were the two literal ones, for which
clause [d] was coherent; adding a rename whose required behavior is a *missing*
identity created the contradiction with a guard clause the fix left unqualified.

### m1 — The plain (non-rename) C-quoted path field — clause [g]'s literal subject and the primary case both round-7 fix notes named — is still not planted; only the rename manifestation is

**What the plan does now.** Clause [g]'s subject is "a C-quoted or escaped path
**field** … beginning with a double-quote" (`:7851–7853`). A non-renamed file at a
backslash path emits, under `core.quotePath=false`, a plain `--numstat` path field
that itself begins with `"` — a distinct git output shape from the rename case:
```
$ git -c core.quotePath=false log --no-merges --numstat -M --format=%H%x00 -1
1    0    "a\\b.txt"          # plain field, begins with a double-quote
1    0    partner.txt
```
(executed, git 2.43.0). The `miner-hygiene` fixture Data (`:7825–7841`) plants no
such plain field — only the residual-quote *rename* `orig.txt => "a\\b.txt"`, whose
field begins with `orig`, not `"`; only its split identity begins with `"`. So the
token clause [g] literally names (a whole path field beginning with a double-quote)
is never produced by the fixture; the fix relies on reading "path field" loosely
enough to cover a split rename identity. Both round-7 fix notes named a plain
co-changing quoted path as the *primary* sufficient fix, with a quoted rename
identity as an "additional/ideal" cover; the fix implemented only the additional
case.

**How this was verified.** Read of the fixture Data (`:7825–7841`) and clause [g]
(`:7851–7853`); grep of the Data paragraph for a non-rename quoted-path plant (none —
the only backslash path is the rename); git execution of the plain-modify shape
(above). Round-7 concrete-fix framing re-derived from
`2026-09-17-round-7-collapse-hunt.md` ("Concrete fix") and
`2026-09-17-round-7-expert-review.md` ("What correct looks like").

**Standard it violates.** AD-24 equivalence partitioning, claimed by T-13-1 itself
("equivalence partitioning over … path encodings", `:7841–7843`): the plain-quoted-
path-field encoding is a distinct partition (distinct git output, verified) and is
unpopulated. **Mitigation acknowledged (honest scope):** an implementation that
normalises each numstat line to a set of literal path tokens and applies one leading-
quote check exercises the plain and rename tokens through the same code, so the
residual risk is a *bifurcated* implementation that guards split identities but not
the plain field — real but bounded. Hence Minor, not Moderate.

**What correct looks like.** Additionally plant a non-renamed file at a backslash
path (e.g. `a\b.txt` modified in place) co-changing with the planted pair's partner,
so a plain path field beginning with `"` is produced and clause [g]'s literal subject
is exercised — closing the residual-quote branch's remaining partition alongside M1.

**Classification.** Minor. **Provenance.** Recurring — the plain-field manifestation
of round-7 M1's untested residual-quote branch remains untested; the fix added the
rename manifestation only.

## Tentative Findings

No tentative findings — every premise above was verified: plan text by Read at
file:line at drafting time, absence by grep/Read of the fixture Data scope, and all
git-behavior claims by direct execution in this environment (git 2.43.0). Nothing
rests on memory, a prior document's assertion, or an in-artifact comment; the
round-7 findings and trajectory counts were re-derived from the review files and the
current source, not imported.

## Observations

- **Out-of-scope litter commit (procedural, no standard violation).** A commit
  `c3ef779` ("c2") on the branch, later than the reviewed fix, added `c\d.txt` and
  `plainquoted.txt` at the *monorepo root*. `git show --stat c3ef779` confirms it
  touches nothing under `middleware/context-oracle/` and not the plan, so it does
  not bear on this review; flagged only so the caller is aware the repo root carries
  stray files and that HEAD advanced during the review. Not attributable to the
  round-7 fix work.
- **Multi-perspective check (procedural).** `collaborativereasoning` was not invoked
  at the infrastructure level; the three-persona check was performed manually.
  Standards persona: M1's and m1's named standards and premises hold; the tripwire
  arithmetic is robust to the trajectory-counting convention (fires whether or not
  round-7's Trivial T1 is counted). Downstream persona: NEEDS FIXES with two concrete
  fixes plus a fired tripwire routes the work to a bounded re-derivation of one seam,
  not an open-ended rebuild. Implementer persona: the fixes name the exact clause to
  scope, the assertion to add, the ambiguity to resolve, and the plain-field fixture
  to plant. No perspective-unique gap remained.

## What's Actually Good

- **The T1 reorder is a genuine correctness improvement, not cosmetic.** Step 13 now
  states the rename split and identity expansion (`:2133–2140`) *before* the
  residual-quote rule that references "either rename identity" (`:2140–2144`), so the
  term is defined before it is used. *Standard:* the expert-plan requirement that a
  build contract read in execution order with no back-reference to an
  as-yet-undefined term. *Verified:* Read at `:2133–2144` — the residual-quote
  sentence now trails the expansion sentence, matching the round-7 CH T1 request.
- **The residual-quote detection remains complete against git's real output, and I
  re-verified it fresh.** Step 13's leading-`"` test (`:2140–2144`) catches every
  character git still C-quotes under `core.quotePath=false`. *Standard:* correctness
  against git's actual output contract, not memory. *Verified by execution* (git
  2.43.0): a backslash name prints `"a\\b.txt"`, a double-quote name `"a\"q.txt"`,
  and a tab name `"tab\tname.txt"` — each beginning with `"`; a rename quotes each
  identity independently (`orig.txt => "a\\b.txt"`). The per-token leading-`"` test
  therefore catches every quoted case. (The *test wiring* of this correct rule is
  what M1/m1 fault — the rule itself is sound.)

## Convergence Record

- **Round number:** 8 (post-fix round 2; R7 was post-fix round 1, R6 the baseline
  independent pass).
- **Trajectory (total findings, independent pass per round, re-derived from the
  review files and git log):** R6 → 1 (collapse-hunt S1 Serious; R6 expert-review 0)
  → R7 → 1 (Moderate M1; the two M1s are one finding, T1 Trivial not counted, per the
  round-7 convergence record) → R8 → 2 (1 Moderate M1, 1 Minor m1).
- **Flow counts (this round):** prior findings closed: 1 (round-7 **T1**, the Step 13
  prose order, verified closed). New: 0. Recurring: 1 (**m1** — round-7 M1's plain-
  field partition still unexercised). Regressions: 1 (**M1** — the clause [d]/[g]
  contradiction the fix introduced). Round-7 **M1** is not counted as closed: its
  rename partition is exercised but its named standard is not fully met.
- **Tripwire evaluation (arithmetic shown):**
  - Condition (a) — new + regression ≥ closed for **two consecutive** post-fix
    rounds: this round 0 + 1 = 1 ≥ closed 1 → **true this round**; R7 was 0 + 0 = 0 ≥
    1 → **false**. Not two consecutive. **(a) not fired.**
  - Condition (b) — total findings **not strictly decreased** for **two consecutive**
    post-fix rounds: R7 total 1 vs R6 total 1 → not strictly decreased (post-fix round
    1); R8 total 2 vs R7 total 1 → not strictly decreased (post-fix round 2). Two
    consecutive post-fix rounds without a strict decrease. **(b) FIRED.**
  - **Tripwire FIRED (condition b).** Robustness: R8 is NEEDS FIXES (≥ 1 finding), so
    it cannot strictly decrease from R7's 1; the firing does not depend on whether m1
    is counted (1→1→1 or 1→1→2 both fire), nor on counting round-7's Trivial T1. The
    signal is substantive, not a counting artifact: the residual-quote / numstat-path-
    keying seam has generated findings for three consecutive rounds (S1 → M1 → M1+m1),
    each patch to it spawning the next — the field-documented signature of a
    foundational problem being patched rather than resolved.

## Recommended Priority

**The fired tripwire routes this to foundational rework of one seam, not another
patch round (Gate 8).** Do not fix M1 and m1 as two more point edits — that is the
accretion that has failed for three rounds (a Step 13 prose rule, then a fixture
plant, then a guard clause, each drifting out of sync with the others). Re-read the
sources for this seam (AD-13 "never guess", AD-24 partitioning, the Phase A honest-
floor goal) and re-derive the miner's C-quoted-path handling and its test as **one
uniform rule**: any `--numstat` line for which *any* literal path token — the plain
field, or either split rename identity — begins with `"` is recorded as
`miner_unparsed_numstat` and contributes **no** pair; and rewrite T-13-1's residual-
quote guard as one coherent, satisfiable clause set built from that rule (scoping the
"rename identity present" clause to the literal renames, asserting the residual-quote
line's zero-pair contribution, and planting both the plain-field and rename-identity
inputs so the single partition is populated on both shapes). That single re-
derivation closes M1 and m1 together, resolves the keep-old-identity ambiguity, and
stops the seam from producing an R9 finding. Everything else in the changed surface —
the T1 reorder and the detection rule itself — is sound and needs no rework.

Verdict: NEEDS FIXES (2 findings: 1 Moderate, 1 Minor)
