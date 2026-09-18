# Round 10 — Independent post-fix expert-review of `docs/plans/plan-phase-a.md`

**Date:** 2026-09-18
**Reviewer:** independent fresh session. I did not author this plan, the round-9
decode change, or the round-9 M1/m2/m3 fix under review. The round-9 collapse-hunt
(`2026-09-18-round-9-collapse-hunt.md`) and round-9 expert-review
(`2026-09-18-round-9-expert-review.md`) findings are treated as closure candidates
re-derived from current source and re-executed, not trusted by reference.
**Artifact under review:** `docs/plans/plan-phase-a.md` and the two probe files it
cites, as installed in the working tree, diffed against `cf2d63e`.
**Change under review (`git diff cf2d63e..HEAD`, scoped to the named files):**
- `docs/plans/plan-phase-a.md` — the co-change miner (Step 13) now specifies a
  **quote-aware tokenizer**: git emits the full `"old" => "new"` form (never the
  brace form) whenever any identity needs quoting, so ` => ` (and a brace group)
  separates a rename only **outside** a quoted token; each quoted identity is
  C-unquoted to raw bytes and then **UTF-8-decoded to a string key**; the
  unresolvable set is re-scoped to a **"fully unquoted … multi-` => ` field."** The
  re-derivation touches Step 6 catalog (`:1354–1358`), Step 13 (`:2134–2170`),
  §11.4 (probe-28 evidence updated + new probe-29 entry, `:7178–7204`), T-13-1
  (`:7886–7946`), and Q56 (`:9938–9956`).
- `docs/plans/plan-phase-a.probes/28_git_numstat_cunquote.mjs` — **modified**: adds
  a `newline` and a `mixed (non-ASCII + tab)` class; comparison moved from raw
  latin1 bytes to the UTF-8-decoded **string** key.
- `docs/plans/plan-phase-a.probes/expected/28_git_numstat_cunquote.txt` — updated
  golden.
- `docs/plans/plan-phase-a.probes/29_git_numstat_tokenize.mjs` + its
  `expected/29_git_numstat_tokenize.txt` — **new** probe and golden.
**Nature:** a **re-review** under the expert-review Re-Review Protocol. The round-9
collapse-hunt returned **NEEDS FIXES (1 Moderate M1, 2 Minor m2, m3)**; commit
`e9a3877` is the fix. Both re-review scopes are exhausted below. (The round-9
*expert-review* returned PASS; the two round-9 passes disagreed, and the author
applied the collapse-hunt's fixes — so the closure set for this pass is the
collapse-hunt's M1/m2/m3.)
**Standards this review evaluates against:** the changed step's own named sources —
`AD-13` (miner: each unresolved field "recorded … never guess"), `AD-24` /
T-13-1's own named technique (equivalence partitioning over path encodings and the
quote/rename collision), `FR-K2` (hygiene) — the Phase A goal (`spec §11.5` /
`CLAUDE.md` dominating rule 3: an **honest** deterministic floor that "measures its
own floor — how little it catches … never fake completeness dressed to look like a
working product"), and the expert-plan build-contract standard ("another engineer
can execute step by step without making a single decision on the fly").

---

## Scope and Inventory

Per the Re-Review Protocol the inventory carries both scopes.

### Scope 1 — Round-9 findings as closure items

- [x] **Round-9 M1 (Moderate)** — the decode rules could not tell a quoted rename
  from a quoted path containing ` => ` (CASE C `"a => b\tc.txt"` silently
  mis-keyed; discriminating partitions CASE C / CASE D unplanted). **Closure
  verified** by Read of the current Step 13 tokenizer (`:2134–2170`), T-13-1 plants
  and `Fails when` (`:7886–7946`), and by execution of `probe:29` and independent
  git experiments (below). *For the quoted partition M1 named, this is genuine
  closure.* A **new Moderate** on the adjacent **fully-unquoted** partition is
  raised under Scope 2 — it is a different input class, not a failure to close M1.
- [x] **Round-9 m2 (Minor)** — the `newline` C-quoted class was asserted-handled
  but exercised nowhere. **Closure verified** by Read of `probe:28`'s `names` array
  (adds `ne\nwl.txt`), its golden (`ne\x0awl.txt`), and T-13-1 Data `:7900`; and by
  executing `probe:28` (the newline class is now present and passes).
- [x] **Round-9 m3 (Minor)** — the prose equated recovered *bytes* with the
  indexer's *string* key without stating a UTF-8 decode. **Closure verified** by
  Read of Step 13 `:2158–2161` (now: "UTF-8-decoded to the string key … never
  compared byte-wise") and of `probe:28`'s comparison, now on `.toString('utf8')`,
  with the mixed `café\tx.txt` class demonstrating the byte→string distinction.

### Scope 2 — Fix-diff files (new-findings detection)

- [x] `docs/plans/plan-phase-a.md` — Read at `:1351–1360` (Step 6 catalog),
  `:2134–2178` (Step 13), `:7178–7204` (§11.4 probe 28/29 evidence),
  `:7883–7946` (T-13-1), `:9937–9956` (Q56). Stale-remnant sweep:
  `grep -n "contains \` => \`"` → 2 hits (`:2144`, `:7889`), both in the new
  quote-aware context, no surviving flat-test claim; `grep -n "unquoted.*holding a
  literal"` → 0 hits (old phrasing gone); `grep -n "miner_unparsed_numstat"` → 9
  hits, all consistent with the re-scoped "fully unquoted multi-arrow" case.
- [x] `docs/plans/plan-phase-a.probes/28_git_numstat_cunquote.mjs` — Read in full
  (diff) and **executed**; matches golden byte-for-byte.
- [x] `docs/plans/plan-phase-a.probes/expected/28_git_numstat_cunquote.txt` — Read
  (3 lines); reproduced by execution.
- [x] `docs/plans/plan-phase-a.probes/29_git_numstat_tokenize.mjs` — Read in full
  (127 lines) and **executed**; `braceExpand` / `unquotedArrows` / `cUnquote`
  audited against the plan's prose and git's behavior.
- [x] `docs/plans/plan-phase-a.probes/expected/29_git_numstat_tokenize.txt` — Read
  (9 lines); reproduced by execution.

### Instruments used (per claim type)

| Claim type | Instrument | Result |
|---|---|---|
| Literal plan text ("line N says Z") | Read at file:line, at drafting time | recorded above |
| git `--numstat` shapes (brace vs quoted, plain-add vs rename) | **direct execution**, git 2.43.0 | six cases pasted below |
| Probe correctness / golden match | **executed each probe**, diffed vs golden | both match exactly |
| Plan structural integrity | `run-plan-probes.mjs`; `derive-plan-sections.mjs --check`; `check_docs.py` | all pass |

Context7 was not required: the load-bearing category is git's on-disk `--numstat`
output, verified by execution (stronger than a docs lookup). No instrument class
was unavailable. **Environment:** git 2.43.0, Node v22.22.2 — the exact versions
the probe evidence names.

## Summary

**This review returns NEEDS FIXES.** All three round-9 findings are genuinely
closed: the quote-aware tokenizer resolves the quoted `=>`/rename collision (CASE C
→ single, CASE D → rename), the newline class is now exercised, and the bytes→string
decode is stated and demonstrated. I verified the pivotal premise the whole
tokenizer rests on — that git emits the full `"old" => "new"` form and **never** the
brace form whenever any identity needs quoting — by execution, including renames
whose shared prefix/suffix would normally force the brace form. The fix is
internally consistent across all five surfaces with no stale flat-test remnant. But
in re-scoping the unresolvable set to a **"fully unquoted … multi-` => ` field,"**
the fix re-asserts the exact defect class M1 was about — a completeness claim that
execution falsifies — on the adjacent **fully-unquoted** partition. A plain-added
file whose name literally contains ` => ` (`x => y.txt`) or a `{ … => … }` brace
group (`a{x => y}b.txt`), with no quote-forcing byte, emits a fully-unquoted
single-separator field byte-identical to a rename (executed); Step 13's rule
("exactly one separator → rename") silently mis-keys it into two garbage identities
and a bogus co-change pair — the S1-class silent mis-key the seam exists to prevent
— while the plan declares such single-separator fields resolvable and the fixture
leaves this partition unplanted. That is one new Moderate finding under the Phase A
honest-floor standard. No Critical, Serious, or Systemic finding was introduced.

## Fixes-Closure Verification (Scope 1)

**Round-9 M1 (Moderate) — CLOSED for the quoted partition it named.** The original
defect: the flat "contains ` => `" / "begins with `\"`" tests could not distinguish
a quoted single path holding ` => ` (CASE C) from a rename with a quoted side (CASE
D), so CASE C was silently mis-split. The fix replaces the flat tests with an
explicit quote-aware tokenizer (Read `:2150–2155`): "a token that begins with an
unescaped double-quote runs to its closing unescaped double-quote … treats ` => `
or a brace group as a rename separator **only outside a quoted token**." I verified
its load-bearing premise by execution (below): git never emits the brace form when
quoting is needed, so a rename separator is always outside quotes and an in-name
` => ` is always inside quotes — the tokenizer's discriminator is sound. `probe:29`
(executed, matches golden) confirms CASE C → one identity and CASE D → two. T-13-1
plants both (`:7901–7910`) with `Fails when` clauses guarding each (`:7938–7944`).
*Named standard (expert-plan build-contract) — met for this partition:* the
implementer no longer has to invent the tokenizer.

**Round-9 m2 (Minor) — CLOSED.** `probe:28` now plants a newline name
(`ne\nwl.txt`) and a mixed non-ASCII+tab name (`café\tx.txt`); its golden includes
`ne\x0awl.txt`, and T-13-1 Data plants `ne<LF>wl.txt` (Read `:7900`). Executed
`probe:28`: the newline class is present and `invertible … : true` holds.
*Named standard (dominating rule 1 — never assert a branch works without the input
that exercises it) — met.*

**Round-9 m3 (Minor) — CLOSED.** Step 13 now states the miner "UTF-8-decode[s] …
to the string key … never compared byte-wise" (Read `:2158–2161`), and `probe:28`'s
comparison is now on `.toString('utf8')` (diff), with the mixed `café\tx.txt` class
(git octal-escapes `é` per byte when the tab forces quoting) proving the recovered
bytes must be reassembled into a code point before keying. Executed: the golden
renders the mixed key as the string `caf\xe9\x09x.txt` (code point 0xE9), not the
raw bytes `caf\xc3\xa9…`. *Named standard (round-6 S1 key-representation lineage) —
met.*

## Critical & Serious Findings

No Critical or Serious findings — the full Scope-2 fix-diff (the five changed plan
regions, the modified probe 28, the new probe 29, and both goldens) was Read, and
every git-behavior premise the change rests on was verified by execution; no
violation of Critical or Serious classification was observed. The prior Serious
closure item (round-6 S1, the non-ASCII mis-key) remains closed: the diff keys
quoted paths on the same raw `readdir` bytes decoded to the same string, extending
rather than regressing that closure (Read `:2158–2161`, `:7929–7931`).

## Systemic Patterns

No systemic patterns — verified by the stale-reference sweep in Scope 2
(`grep -n "contains \` => \`"` → 2 hits, both in the new quote-aware context;
`grep -n "unquoted.*holding a literal"` → 0; `grep -n "miner_unparsed_numstat"` → 9,
each Read and confirmed consistent with the re-scoped case). The one Moderate below
is a single conceptual defect that necessarily appears in the three surfaces the
unresolvable-set claim must be stated in (Step 6 catalog `:1354–1358`, Step 13
`:2165–2168`, Q56 `:9950–9952`); it is one finding stated consistently, not a
codebase-wide propagated pattern, and fixing it in those three surfaces closes it.

## Moderate & Minor Findings

### M1 (Moderate) — A fully-unquoted `--numstat` field whose real filename contains ` => ` or a `{ … => … }` group is silently mis-keyed as a rename, and the re-scoped completeness claim ("the one unresolvable field is a multi-` => ` field") is falsified by execution

**What the plan says now.** Step 13 (Read `:2153–2155`): "a field with no such
separator is a single path, a field with exactly one is a rename expanded to its
two identities." And (Read `:2165–2168`): "The one field the miner cannot resolve
is a **fully unquoted** field whose `{`, `}`, or ` => ` cannot be told apart from
git's rename syntax — a multi-` => ` field that no single split turns into one
rename." The Step 6 catalog (`:1354–1358`) and Q56 (`:9950–9952`) restate this: the
only `miner_unparsed_numstat` case is "a multi-arrow field." The T-13-1 Data
paragraph claims "equivalence partitioning over path encodings and over the
quote/rename collision is **honestly populated**" (`:7890–7891`).

**How this was verified.** Direct execution, git 2.43.0 (throwaway repos, the
miner's own invocation `git -c core.quotePath=false log --numstat -M`):
```
# plain ADD of a file literally named  x => y.txt   (no quote-forcing byte)
1	0	x => y.txt
# a genuine rename, for shape comparison
0	0	a.txt => y2.txt
# plain ADD of a file literally named  a{x => y}b.txt
1	0	a{x => y}b.txt
```
A plain-added file whose name contains ` => ` (or a brace group) emits a
**fully-unquoted, single-separator** field that is **byte-identical in shape** to a
rename. Neither ` => ` nor `{`/`}` forces C-quoting, so the quote-aware tokenizer
gives no help here: the single ` => ` (or the `{ … => … }` group, matched by the
plan's brace rule and by `probe:29`'s `braceExpand` regex
`/^([^"]*)\{(.*) => (.*)\}([^"]*)$/`) is treated as a rename separator, and the
field is split into two non-existent identities (`x` + `y.txt`, or `axb.txt` +
`ayb.txt`) that are added to `cochange_pairs`.

**Which standard it violates and why.** The Phase A honest-floor goal (spec §11.5 /
CLAUDE.md dominating rule 3) forbids "fake completeness dressed to look like a
working product" and requires the tool to "measure its own floor." The plan's
claim that the *only* unresolvable field is a multi-arrow one asserts that every
fully-unquoted single-separator field is correctly resolved; execution shows a
whole class of such fields (plain-adds of ` => `- or `{ => }`-named files) is
instead **silently mis-keyed**, with no `miner_unparsed_numstat` diagnostic — the
S1 silent-mis-key class the seam has spent ten rounds hardening. This is the
identical defect class round-9 M1 named (a completeness assertion falsified by
execution + an unplanted discriminating partition), recurring on the fully-unquoted
partition after the fix closed the quoted one. It also violates AD-24: the Data
paragraph's "honestly populated" overclaims, because the discriminating partition —
a plain-add whose *unquoted* name carries a rename marker — is unplanted (CASE C
plants only the *quoted* variant, where a tab forces the quote; strip the tab and
the tokenizer's quote-awareness no longer applies). And it is concretely reachable
inside the fixture's own setup: to produce the multi-arrow `x => y.txt => z.txt`,
the generator must first **add** `x => y.txt`, whose add-commit emits the
single-separator field `x => y.txt` that Step 13's rule mis-keys — a garbage pair
no `Fails when` clause guards.

**Why Moderate and not Minor or Serious.** It is more than Minor because the change
makes an explicit, executable **completeness assertion** in three surfaces that my
execution falsifies, and leaves the discriminating partition unplanted while
declaring it "honestly populated" — the precise failure this project's central goal
names. It is not Serious because the triggering filename (a literal ` => ` or
`{ … => … }` with no quote-forcing byte) is near-nonexistent on Max Cogar's
agent-tooling corpus, so practical blast radius on the Phase A test-bed is ~0; and
the underlying **assume-rename rule is a defensible pragmatic necessity** (every
real rename `old => new` is formally ambiguous with a plain-add of a file named
`old => new`, so routing *all* single-separator fields to `miner_unparsed_numstat`
would destroy rename detection entirely). The defect is the dishonest *description*
of that necessary assumption as completeness, plus the unplanted partition — not the
rule itself.

**What correct looks like (either closes it).**
- *Keep the assume-rename rule but describe it honestly:* replace the "the one
  field the miner cannot resolve is a multi-` => ` field" claim (Step 6 `:1354–1358`,
  Step 13 `:2165–2168`, Q56 `:9950–9952`) with an honest-floor statement — a
  fully-unquoted single-separator field is **assumed** to be a rename, and a
  plain-added file whose name literally contains ` => ` or a `{ … => … }` group is
  mis-attributed as a rename; this is an accepted, measured floor, near-nonexistent
  on the target corpus. Then plant that partition in T-13-1 (a plain-add of e.g.
  `x => y.txt` with no quote-forcing byte) and either add a `Fails when` clause
  documenting the accepted mis-attribution, or remove "honestly populated" from the
  Data paragraph's collision claim. Drop the word "honestly populated" if the
  partition stays unplanted.
- *Or dissolve the ambiguity structurally:* parse renames from `--raw -z` (or
  `--numstat -z` with a non-`%x00` `--format` delimiter), where git emits old and
  new as separate NUL-terminated, unquoted fields — no ` => `, no brace form, no
  quoting — which resolves CASE C/CASE D **and** this unquoted case at once. The
  plan currently rejects `-z` because "the record framing already spends `%x00` on
  the `--format` header" (`:2124–2126`); that rationale is real but surmountable by
  choosing a different header delimiter, and it would retire the entire tokenizer.

**Classification.** Moderate. **Provenance.** Recurring — the S1 silent-mis-key /
false-completeness class, re-opened on the fully-unquoted partition by the fix's
re-scoping of the unresolvable set to "multi-arrow only."

No Minor findings beyond the above — verified by Read of all five changed regions,
line-by-line audit of `probe:29`'s tokenizer against the plan's prose and git's
executed behavior, and execution of both probes against their goldens.

## Tentative Findings

No tentative findings — every premise above was verified against current source at
drafting time: plan text by Read at file:line; git output by direct execution (git
2.43.0); both probes by running them and diffing against their goldens; plan
structural integrity by the three checkers. Nothing rests on memory, on either
round-9 review's assertions, or on the probes' header comments — the pivotal
"never braces when quoting" premise and the plain-add mis-key were re-derived by
independent repos I built, not by trusting the plan or the probes.

### git behavior, executed this pass (git 2.43.0), grounding the review

```
# Pivotal premise — git NEVER emits the brace form when a component needs quoting,
# even with a shared prefix/suffix that would normally force it:
rename sub/u<TAB>t/c.txt -> sub/other/c.txt :  "sub/u\tt/c.txt" => sub/other/c.txt   (full form, old side quoted; NOT sub/{...}/c.txt)
rename d<TAB>r/a/f.txt   -> d<TAB>r/b/f.txt  :  "d\tr/a/f.txt" => "d\tr/b/f.txt"      (full form, both sides quoted; NOT d<TAB>r/{a => b}/f.txt)
# The unquoted-collision hole (M1):
plain add  x => y.txt        :  x => y.txt          (fully unquoted, one " => ", shape-identical to a rename)
plain add  a{x => y}b.txt    :  a{x => y}b.txt      (fully unquoted, one brace group, shape-identical to a brace rename)
genuine rename a.txt->y2.txt :  a.txt => y2.txt     (same shape as the plain-add above)
```
The first two confirm the tokenizer's load-bearing premise (M1 quoted-partition
closure is sound). The last three ground the new Moderate: a fully-unquoted
single-separator field is genuinely ambiguous between a rename and a plain-add of a
rename-marker-named file, and the plan resolves it unconditionally toward "rename."

### Both probes executed vs golden
```
$ node 28_git_numstat_cunquote.mjs | diff - expected/28_git_numstat_cunquote.txt   → (no diff); invertible … : true
$ node 29_git_numstat_tokenize.mjs | diff - expected/29_git_numstat_tokenize.txt   → (no diff)
    CASE_C=single  CASE_D=rename  plain=rename  brace=rename
```

### Plan tooling, re-run this pass
- `run-plan-probes.mjs` → all **29** probes `ok`; "all probes match their recorded
  expectations."
- `derive-plan-sections.mjs --check` → "OK: 40 steps, 13 elements, 124 test specs,
  **29 probes cited**, regions current."
- `python3 tools/check_docs.py` → "context-oracle doc-consistency check passed."
- (`--self-check` was not run: this build of `derive-plan-sections.mjs` rejects the
  flag with any operand and I did not resolve its exact invocation; the `--check`
  and `check_docs` gates above cover structural/cross-doc integrity, so no claim in
  this review depends on `--self-check`.)

## What's Actually Good

- **The tokenizer's load-bearing premise is proven by execution, not asserted.**
  *Property:* the whole quote-aware discriminator depends on git never emitting the
  brace form when a component needs quoting; that is verified, not assumed.
  *Standard:* expert-plan premise-grounding + AD-13 "never guess." *Verified:* I
  built renames whose shared prefix/suffix would normally force the brace form and
  git emitted the full quoted form in every case (above); `probe:29` matches its
  golden.
- **The m3 bytes→string fix is robust, and the mixed class genuinely proves it.**
  *Property:* keying on the UTF-8-decoded string (not raw bytes) is what makes
  `café.txt` from the miner match the indexer's `readdir` key; the `café\tx.txt`
  mixed class forces the octal-escaped `é` to be reassembled across two bytes.
  *Standard:* round-6 S1 key-representation correctness. *Verified:* Read of Step 13
  `:2158–2161` and of `probe:28`'s `.toString('utf8')` comparison; executed
  `probe:28`.
- **The re-derivation is internally consistent with no stale flat-test remnant.**
  *Property:* Step 6, Step 13, §11.4, T-13-1, and Q56 all describe the same
  quote-aware rule; the old "contains ` => ` → rename" flat test is gone.
  *Standard:* expert-plan build-contract free of self-contradiction. *Verified:* the
  three grep sweeps in Scope 2 (result counts recorded) plus Read of each hit.

## Recommended Priority

Fix M1 before this plan is used as a build contract. The lowest-cost close is to
stop *claiming* completeness the parse does not have: state the assume-rename
behavior as an honest, measured floor in the three surfaces that carry the
unresolvable-set claim (Step 6 `:1354–1358`, Step 13 `:2165–2168`, Q56
`:9950–9952`), plant the fully-unquoted single-separator plain-add partition in
T-13-1, and drop or qualify "honestly populated." The structural alternative
(`--raw -z`) is more work but retires the whole tokenizer and every case in this
seam at once — worth weighing if the miner is revisited. The assume-rename *rule*
itself does not need to change; only its description and its test coverage do.

Verdict: NEEDS FIXES (1 Moderate)
