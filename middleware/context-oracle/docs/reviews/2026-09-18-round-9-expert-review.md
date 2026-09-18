# Round 9 — Independent post-fix expert-review of `docs/plans/plan-phase-a.md`

**Date:** 2026-09-18
**Reviewer:** independent fresh session. I did not author this plan, the
round-8 fix under review, or any prior round's fix. The round-8 expert-review
(`2026-09-17-round-8-expert-review.md`) and its findings are treated as
closure candidates re-derived from current source, not trusted by reference.
**Artifact under review:** `docs/plans/plan-phase-a.md` and the two probe files
added with it, as installed in the working tree, diffed against `c99b8fc`.
**Change under review (`git diff c99b8fc..HEAD`, scoped to the three named files):**
- `docs/plans/plan-phase-a.md` — the co-change miner (Step 13) now **C-unquotes**
  a still-C-quoted `--numstat` path field back to its raw `readdir` key instead
  of dropping it to `miner_unparsed_numstat`; `miner_unparsed_numstat` is
  re-scoped to only an **unquoted** field carrying a literal `{`, `}`, or ` => `
  that cannot be told apart from git's rename syntax. The re-derivation touches
  Step 6 (fault-code prose), Step 13 (miner rule + Gate 3), §11.4 (probe-27
  evidence note + new probe-28 evidence entry), T-13-1 (fixture Data + `Fails
  when`), and Q56 (register).
- `docs/plans/plan-phase-a.probes/28_git_numstat_cunquote.mjs` — new probe.
- `docs/plans/plan-phase-a.probes/expected/28_git_numstat_cunquote.txt` — its
  golden output.
**Nature:** This is a **re-review** under the expert-review Re-Review Protocol.
Round 8 returned **NEEDS FIXES (1 Moderate M1, 1 Minor m1)** and its convergence
tripwire **FIRED** (condition b), with a Recommended Priority that the
residual-quote / numstat-path-keying seam be **re-derived as one uniform rule**,
"not another patch round." Both re-review scopes are exhausted below.
**Standards this review evaluates against:** the plan's own named sources for the
changed step — `AD-13` (miner: "each exclusion recorded … never guess"), `AD-24`
(the test tier's equivalence-partitioning discipline T-13-1 claims), `FR-K2`
(hygiene) — the Phase A goal (`spec §11.5`: an *honest* deterministic floor that
raises coverage without guessing and without silent bias, never fake
completeness), and the expert-plan build-contract standard ("another engineer can
execute step by step without making a single decision on the fly").

---

## Scope and Inventory

Per the Re-Review Protocol, the inventory carries both scopes.

### Scope 1 — Round-8 findings as closure items

- [x] **Round-8 M1 (Moderate)** — T-13-1's unqualified `Fails when` clause "a
  rename's old or new identity is missing from the pair counts" contradicted the
  residual-quote skip the same test demanded. **Closure verified** by Read of the
  current T-13-1 `Fails when` at `plan-phase-a.md:7880–7895` and Step 13 at
  `:2133–2156` (see M1 closure below).
- [x] **Round-8 m1 (Minor)** — the plain (non-rename) C-quoted path field was not
  planted; only the rename manifestation was. **Closure verified** by Read of the
  current T-13-1 Data at `:7858–7877` (the `u\v.txt` plain-add plant; see m1
  closure below).
- [x] **Round-8 fired tripwire (condition b) — "re-derive the seam as one uniform
  rule, not another patch."** **Directive addressed** — the fix replaces the
  drop-rule with a decode-rule across the whole seam; assessed in the Convergence
  Record below.

### Scope 2 — Fix-diff files (new-findings detection)

- [x] `docs/plans/plan-phase-a.md` — Read at `:1336–1362` (Step 6 fault codes),
  `:2107–2173` (Step 13 miner rule + Gate 3), `:6730–6769` and `:7145–7173`
  (§11.4 evidence, probes 24/27/28), `:7841–7895` (T-13-1), `:9887–9901` (Q56).
  Cross-reference sweep for stale drop-behavior text: `grep -n
  "miner_unparsed_numstat"` (9 hits, all re-scoped to the unquoted-ambiguous
  case), `grep -n "residual"` (only `:7162` remains, updated to "C-unquotes back
  to its raw readdir key"), `grep -n "is skipped"` (`:2152` — the unquoted case
  only). No stale reference to the old "quoted field → skip" behavior survives.
- [x] `docs/plans/plan-phase-a.probes/28_git_numstat_cunquote.mjs` — Read in full
  (91 lines); `cUnquote` checked line-by-line against git's `quote_c_style`.
- [x] `docs/plans/plan-phase-a.probes/expected/28_git_numstat_cunquote.txt` — Read
  (3 lines); reproduced by execution (below).

### Instruments used (per claim type)

| Claim type | Instrument | Result |
|---|---|---|
| Literal plan text ("line N says Z") | Read at file:line, at drafting time | recorded above |
| git `--numstat` output for renames / quoted paths / multi-arrow | **direct execution**, git 2.43.0 | six cases pasted below |
| Probe correctness / golden match | **executed the probe**, diffed vs golden | matches exactly |
| Plan structural integrity (regions, probe count, cross-refs) | `derive-plan-sections.mjs --check`; `tools/check_docs.py` | both pass |

Context7 was not required: the load-bearing category is git's on-disk output
behavior, verified by execution (stronger than a docs lookup). No instrument
class was unavailable; no rigor waiver taken.

**Environment:** git 2.43.0, Node v22.22.2 — the exact versions the probe-28
evidence entry names (`:7168`).

## Summary

**This review returns PASS.** The round-8 seam has been resolved, not patched
again. Rather than harden the drop-rule that generated a finding in each of three
consecutive rounds, the fix **replaces** it: a still-C-quoted `--numstat` path
field is now C-unquoted back to its exact raw `readdir` key — a deterministic,
invertible decode — and only a genuinely ambiguous *unquoted* field (`{`, `}`, or
` => `) is recorded as `miner_unparsed_numstat`. I verified the pivotal premise by
running the new probe: git's C-quoted output, C-unquoted, equals the `readdir`
keys byte-for-byte across the backslash, non-ASCII, double-quote, tab, and
control-byte classes (`invertible … : true`). This closes round-8 M1 structurally
— nothing is skipped anymore, so the `Fails when` clause that contradicted the
skip no longer contradicts anything, and the clause set is now jointly satisfiable
by a correct implementation — and closes m1 by planting the plain-field case
(`u\v.txt` → `"u\\v.txt"`). The change serves the Phase A honest-floor goal better
than the round-8 reviewer's own proposed "drop everything quoted" rule would have:
it raises coverage on real-world pathological paths without introducing any guess.
No Critical, Serious, Systemic, or Moderate finding was introduced by the fix.

## Fixes-Closure Verification (Scope 1)

**Round-8 M1 (Moderate) — CLOSED.** The original defect: T-13-1's unqualified
clause "a rename's old or new identity is missing from the pair counts" fired on
the residual-quote rename whose new identity was *deliberately* skipped, so the
guard set was unsatisfiable. The fix removes the precondition for the
contradiction — under the decode rule *no* identity is skipped; a quoted new
identity is C-unquoted and **added** — and re-scopes the clause. Current text
(Read `:7883–7884`): "OR **either literal rename's** old or new identity is
missing from the pair counts". The three C-quoted-target renames are now governed
by a distinct, coherent clause (Read `:7887–7893`): they must appear in
`cochange_pairs` **under their raw `readdir` key** (`:7887–7890`), and no
git-C-quoted field may land in stored form "instead of C-unquoted to its raw path"
(`:7890–7893`). I checked joint satisfiability against a correct (decode)
implementation: the two literal renames' identities are present (clause [d] holds);
the four C-quoted-class files are present under raw keys (clause [g] holds); no
quoted form is stored (clause [h] holds); the `x => y.txt` multi-arrow line is
recorded as `miner_unparsed_numstat` (clause [i] holds); no ` => ` substring is
stored (clause [e] holds). The set is satisfiable — the M1 contradiction is gone.
*Named standard (expert-plan build-contract) — met:* the implementer no longer has
to infer a silent scoping of clause [d]; it is written scoped.

**Round-8 m1 (Minor) — CLOSED.** The fixture now plants "one **plain,
non-renamed** file **added** at a backslash path (`u\v.txt`), whose standalone
`--numstat` field is `"u\\v.txt"` (the whole field begins with `"`)" (Read
`:7868–7871`), and clause [g] names `u\v.txt` explicitly among the four
C-quoted-class files that must be present under their raw `readdir` key
(`:7887–7890`). I confirmed by execution that a plain add at a backslash path
emits a whole quoted field (CASE2 below: `"u\\v.txt"`), distinct from the rename
shape — the exact distinct partition m1 said was unpopulated. *Named standard
(AD-24 equivalence partitioning) — met:* both C-quoted partitions (whole path
field, and split rename identity) are now populated.

## Convergence Record (tripwire response)

Round 8's tripwire fired on condition (b) — total findings not strictly decreasing
for two consecutive post-fix rounds — and its Recommended Priority (Gate 8)
directed foundational rework of the seam as **one uniform rule**, explicitly
warning against "another patch round" of point edits. I assessed whether the
round-9 change is that rework or one more patch:

- It is a **rule replacement**, not a hardening of the old rule. The prior rule
  ("a quoted field is skipped with `miner_unparsed_numstat`") is *deleted*; the
  new rule ("a quoted token is C-unquoted back to its raw path") governs the whole
  seam. Every dependent surface was re-derived in lockstep — Step 6 (`:1354–1358`),
  Step 13 (`:2138–2156`), §11.4 probe-27 note (`:7162–7164`), Q56 (`:9893–9901`) —
  with no stale remnant (grep sweep above).
- It **dissolves the recurring tension** rather than re-balancing it. The seam's
  three prior findings (round-6 S1 silent mis-key → round-7 M1 untested skip →
  round-8 M1 contradictory guard + m1 unpopulated partition) were all facets of
  "what to do with a path git quoted." "Decode it to its exact bytes" answers that
  definitively, and the answer is backed by a new *executed* invertibility proof
  (probe 28) rather than by another assertion. The guard that kept going
  incoherent is coherent because there is no longer a skip to guard against.
- It **raises the floor without guessing**, which is more faithful to spec §11.5
  than the round-8 reviewer's own proposed "drop everything quoted" uniform rule
  (which would have *lowered* the floor for every backslash/quote/tab/control-byte
  path — the same silent-undercount class as the round-6 S1 café mis-key). Because
  C-unquoting is deterministic and total (verified), decoding is exact recovery,
  not inference — it does not violate AD-13's "never guess."

This is genuine resolution of the seam. I did not re-run the tripwire arithmetic
as a blocking gate: this round introduces zero new findings and closes both prior
ones, so the mechanical PASS rule is satisfied regardless.

## Critical & Serious Findings

No Critical or Serious findings — the full Scope-2 fix-diff (the five changed plan
regions, the probe, and its golden file) was Read, and every git-behavior premise
the change rests on was verified by execution; no violation of Critical or Serious
classification was observed. The prior-round Serious closure item (round-6 S1, the
silent non-ASCII mis-key) remains closed: the diff does not touch the `café.txt`
raw-UTF-8 keying clause (Read `:7856–7857`, `:7885–7887` — unchanged), and the new
decode rule keys quoted paths on the same raw `readdir` bytes, extending rather
than regressing that closure.

## Systemic Patterns

No systemic patterns — verified by the stale-reference scans in Scope 2:
`grep -n "miner_unparsed_numstat" docs/plans/plan-phase-a.md` (9 results, each Read
and confirmed re-scoped to the unquoted-ambiguous case), `grep -n "residual"`
(11 results; only `:7162` bears on this seam and is updated), `grep -n "is
skipped\|residual-quote skip\|skip branch"` (2 results, neither a stale
drop-claim). A systemic defect would be a second surface still asserting the old
"quoted → skip" behavior after the rule changed; the scans find none. The single
change is internally consistent across all five dependent surfaces.

## Moderate & Minor Findings

No Moderate or Minor findings — verified by Read of all five changed plan regions,
line-by-line audit of the probe's `cUnquote` against git's `quote_c_style`,
execution of the probe against its golden file, and execution of six git cases
covering the shapes the plan's disambiguation rule must resolve (below). The two
below-threshold observations that surfaced are recorded under Observations, with
the reasoning for why each is below Minor.

## Tentative Findings

No tentative findings — every premise above was verified against current source at
drafting time: plan text by Read at file:line; git output by direct execution
(git 2.43.0); the probe by running it and diffing against its golden file; plan
structural integrity by the two checkers. Nothing rests on memory, on the round-8
review's assertions, or on the probe's own header comment — the invertibility
claim was re-derived by executing the probe, and the git-shape claims by
independent repos I built, not by trusting the plan.

### git behavior, executed this pass (git 2.43.0), grounding the change

Built throwaway repos and read `git -c core.quotePath=false log -1 --numstat -M`:

```
CASE1 rename to backslash path:      plainsrc.txt => "a\\b.txt"     (old side raw, new side quoted)
CASE2 plain add at backslash path:   "u\\v.txt"                      (whole field quoted)
CASE3 rename to name with " => ":    arrowsrc.txt => x => y.txt      (two " => "; unsplittable → the unparsed case)
CASE4 rename, BOTH sides backslash:   "m\\n.txt" => "a\\c.txt"       (each identity quoted independently)
CASE5 plain add, name has " => "+\\:  "a => b\\c.txt"                (whole field quoted; " => " lives inside the quotes)
brace, root move f→dir/f:            f => dir/f                      (plain form, not the brace form — see Observations)
```

These confirm: CASE1/CASE2 are exactly the two shapes T-13-1 now plants; CASE3 is
the multi-arrow input the fixture routes to `miner_unparsed_numstat`; CASE4 shows
git quotes each rename identity independently, so the plan's "split the rename,
then C-unquote each identity" order (`:2137–2156`) reconstructs both raw paths
even when both sides are quoted (naive split on ` => ` still works because neither
quoted name contains ` => `). The plan's claim that the *only* unresolvable field
is an **unquoted** one bearing `{`/`}`/` => ` holds: when such a metacharacter
co-occurs with a byte that forces quoting (CASE5), git wraps the whole field and
the metacharacter is delimited inside the quotes, so a quote-aware decode resolves
it — the truly ambiguous case is metacharacter-without-a-quoting-trigger.

### Probe 28 executed vs golden

```
$ node 28_git_numstat_cunquote.mjs
readdir keys:  a\x5cb.txt  caf\xc3\xa9.txt  ctrl\x01x.txt  plain.txt  q"z.txt  ta\x09b.txt
c-unquoted:    a\x5cb.txt  caf\xc3\xa9.txt  ctrl\x01x.txt  plain.txt  q"z.txt  ta\x09b.txt
invertible (decoded == readdir keys): true
$ node 28_git_numstat_cunquote.mjs | diff - expected/28_git_numstat_cunquote.txt  →  (no diff)
```

The `cUnquote` inverse is faithful to git's `quote_c_style`: it handles every
named C-escape git emits (`\a \b \t \n \v \f \r \" \\`, via the `SIMPLE` map) and
3-digit `\NNN` octal (git always emits exactly three octal digits, which the
`oct.length < 3` cap matches), and passes other bytes through raw — the exact
inverse of git's encoder. Line/field splitting on literal `\n`/`\t` is safe
because git escapes any tab or newline *inside* a path to `\t`/`\n`, so no literal
occurs in the field. The `encoding:'buffer'` + latin1 round-trip preserves raw
bytes. The probe proves the plan's load-bearing claim (git C-quoting is total and
invertible, and the inverse equals the indexer's `readdir` key).

## What's Actually Good

- **The decode pivot is the right answer to the fired tripwire, and it is proven,
  not asserted.** *Property:* the seam's recurring incoherence is dissolved by
  replacing "drop the quoted path" with "recover its exact bytes," and the
  recovery is backed by an executed round-trip proof. *Standard:* Phase A honest
  floor (spec §11.5) — raise coverage without guessing and without silent bias —
  and AD-13 "never guess." *Verified:* I executed probe 28 (`invertible … : true`)
  and independently reproduced git's quoting on six cases; the decode is exact
  recovery, so it adds coverage that the prior drop-rule silently lost, with no
  inference introduced.
- **The re-derivation is complete and internally consistent across every dependent
  surface.** *Property:* Step 6, Step 13, §11.4, T-13-1, and Q56 all describe the
  same rule with no stale remnant of the old skip behavior. *Standard:* the
  expert-plan requirement that a build contract be free of self-contradiction.
  *Verified:* the three grep sweeps in Scope 2 (result counts recorded) plus Read
  of each hit, and `derive-plan-sections.mjs --check` → "40 steps, 13 elements,
  124 test specs, 28 probes cited, regions current"; `tools/check_docs.py` →
  "context-oracle doc-consistency check passed."
- **T-13-1's `Fails when` set is now a coherent, jointly-satisfiable guard.**
  *Property:* the clauses distinguish a correct decode from both failure modes
  (store-verbatim → clause [h] fires; drop → clause [g] fires) without any clause
  pair being unsatisfiable for the planted inputs. *Standard:* the build-contract
  "no decision on the fly." *Verified:* Read of `:7880–7895` with each clause
  evaluated against a decode implementation's behavior on the planted fixture.

## Observations (below the finding threshold; recorded for the caller)

- **Both-quoted rename shape not separately planted (below Minor).** T-13-1 plants
  three renames from a *plain* source to a quoted target (quoted **new** side
  only). CASE4 above shows git can also quote the **old** side (`"m\\n.txt" =>
  "a\\c.txt"`). The fixture does not plant a both-quoted rename. This is a
  *sub-partition* of the already-populated "quoted rename identity" partition,
  exercised through the same token-uniform C-unquote as the planted quoted-new
  sides; the round-8 reviewer already reasoned (m1 mitigation) that a normalize-to-
  tokens-then-one-leading-quote-check implementation runs every quoted token
  through the same code. Strictly less significant than round-8 m1 was, hence below
  Minor — noted only so a future fixture author may add it for completeness.
- **Pre-existing brace-form label, out of this diff (not a finding).** The T-13-1
  Data line at `:7853–7855` (unchanged by this diff; the round-9 hunk begins after
  it) describes "one moved into a new directory (the brace form `{ => dir}/f`)".
  Executed: a *root-level* move `f → dir/f` prints the plain form `f => dir/f`, not
  a brace form (git uses the brace form only with a shared prefix, e.g.
  `a/{ => dir}/f`), which the plan's own §11.4 probe-24 evidence states correctly
  (`:7148–7152`). The parenthetical is loosely worded, but it is pre-existing and
  outside the reviewed change, so it does not bear on this verdict; flagged for
  awareness in case the fixture generator is written from that line.
- **STATUS.md also changed in `c99b8fc..HEAD` but is outside the named review
  scope.** `tools/check_docs.py` (the merge-gate validator) passes over it, so it
  carries no cross-document rot; its content was not audited here.

## Recommended Priority

Nothing blocks. The change is a PASS and needs no rework. If a future pass touches
this fixture for unrelated reasons, the below-Minor observation (plant a
both-quoted rename to exercise the quoted-old-side sub-partition) is the only
completeness item worth folding in; it is not required for this round.

Verdict: PASS
