# Round 13 — Independent post-fix expert-review of `docs/plans/plan-phase-a.md`

**Date:** 2026-09-18
**Reviewer:** independent fresh session. I did not author this plan, the `-z`
switch, the Record-Separator framing, the NUL-parse fix, or the round-12 fix now
under review, nor any prior round or its reviews. The round-12 findings
(`docs/reviews/2026-09-18-round-12-expert-review.md`, NEEDS FIXES: 1 Moderate M1;
`docs/reviews/2026-09-18-round-12-collapse-hunt.md`, NEEDS FIXES: 1 Moderate M1,
same defect, plus a non-finding implementation note) are treated as **closure
candidates re-derived from current source and re-executed**, not trusted by
reference.

**Artifact under review:** the round-12 fix (commit `7dff513`, "align Step 13
prose to the probe's evidence"), as installed in the working tree at `HEAD`,
diffed against `2480772` (the round-11-finding fix that round-12 reviewed),
scoped to the two files the task named:

- `docs/plans/plan-phase-a.md` — Step 13 (`:2123–2179`), the two changed
  sentences at `:2150–2160`.
- `docs/plans/plan-phase-a.probes/24_git_numstat_z.mjs` — the reference parser's
  rename branch (`:91–95`), a new truncated-rename bounds guard.

I confirmed the scope is exactly those two files: `git show --stat 7dff513`
touches `STATUS.md`, `plan-phase-a.md` (10 lines), and the probe (7 lines); the
two intervening commits (`f043c1e`, `b907463`) added only review documents and do
not touch the plan or probe, so `2480772..HEAD` over the two named files is the
round-12 fix alone. `STATUS.md` is outside the named scope and is not reviewed
here.

**Nature:** a **re-review** under the expert-review Re-Review Protocol. Round-12
returned NEEDS FIXES on one Moderate: Step 13's evidence parenthetical asserted
that `probe:24_git_numstat_z` "plants `we<0x1e>ird.txt` **co-changing with a
partner**," which the probe (a solo single-file commit) does not do. Both
re-review scopes are exhausted below.

**Standards this review evaluates against:** the changed step's own named sources
— `AD-13` (miner: an unresolved field is "recorded … never guessed"); T-13-1's
named technique (**equivalence partitioning over raw path classes**); the
**Phase A honest-floor goal** (spec §11.5 / `CLAUDE.md` dominating rule 3: an
*honest* deterministic floor that "never fake[s] completeness dressed to look
like a working product," and whose corpus Phase B and the regression fixtures are
designed from, so a test bed that greenlights a miner which corrupts real data is
a real-stakes gap); `CLAUDE.md` dominating rule 1 / the agent-armory standing
rule ("**Verify before you assert**") — never state that a check was run or that
an artifact demonstrates something without having established it; and the
expert-plan **build-contract** standard ("another engineer can execute step by
step without making a single decision on the fly," and every evidence citation
names an artifact that actually shows what is claimed).

**Environment:** git 2.43.0, Node v22.22.2 — the exact versions §11.4's probe-24
evidence line names. Context7 was not required: the load-bearing category is
git's on-disk `-z --numstat` byte stream and a JS parser, both verified by
execution (stronger than a docs lookup); no instrument class was unavailable.

---

## Scope and Inventory

Per the Re-Review Protocol the inventory carries both scopes.

### Scope 1 — Round-12 findings as closure items

- [x] **Round-12 M1 (Moderate; both passes)** — Step 13's parenthetical claimed
  `probe:24_git_numstat_z` "plants `we<0x1e>ird.txt` co-changing with a partner,"
  which is false (the probe's `RAW_rs` commit is solo) and internally inconsistent
  with the same sentence's "records it as the one path." **Closure verified** by
  Read of Step 13 (`plan:2150–2153`), Read of the probe (`24_git_numstat_z.mjs:43`,
  `:117`), Read of T-13-1 (`plan:7849–7857`, `:7877–7882`), execution of the probe,
  and byte-diff of the probe against its golden. Detailed below.
- [x] **Round-12 collapse-hunt implementation note (explicitly "not a finding
  against these files")** — recommended the production miner guard a rename whose
  old/new fields run off a truncated stream and route it to
  `miner_unparsed_numstat`. The fix acted on it (in prose and in the probe); the
  resulting change is scanned as new work under Scope 2 below.

### Scope 2 — Fix-diff files (new-findings detection)

- [x] `docs/plans/plan-phase-a.md` — Read `:2123–2179` (Step 13), the two changed
  sentences `:2150–2160`, and the cross-section surfaces that describe the same
  mechanism and could fall out of sync with the addition: Q56 (`:9879–9896`),
  §11.4 probe-24 evidence (`:7151–7164`), Step 6 catalog (`:1354–1359`), T-13-1
  (`:7832–7887`). Doc-sync of the whole plan checked by executing
  `check_docs.py` (passed) and `derive-plan-sections.mjs --check` (regions
  current).
- [x] `docs/plans/plan-phase-a.probes/24_git_numstat_z.mjs` — Read in full (123
  lines); the changed rename branch (`:91–95`) traced against the field-splitting
  (`:71`), the header/numstat parse (`:76–95`), and the base version (`2480772`,
  `if (path.length === 0) { cur.paths.push(fields[i+1], fields[i+2]); i += 3; }`);
  **executed**; diffed against its golden (no diff); run through the official
  runner (`run-plan-probes.mjs --only 24_git_numstat_z` → `ok`).
- [x] `docs/plans/plan-phase-a.probes/expected/24_git_numstat_z.txt` — Read (6
  lines); reproduced by execution byte-for-byte (unchanged by this fix, in scope
  as the probe's oracle).

### Instruments used (per claim type)

| Claim type | Instrument | Result |
|---|---|---|
| Literal plan/probe text ("line N says Z") | Read at file:line, at drafting time | recorded above |
| Probe behaviour (ids, whole-path recording, golden fidelity) | **executed** `node 24_git_numstat_z.mjs`; `diff` vs golden; `run-plan-probes.mjs --only` | pasted below |
| Probe ↔ plan-catalog ↔ doc wiring | `derive-plan-sections.mjs --check`, `--self-check`; `check_docs.py` | all green |
| Base-vs-fix delta (what the diff introduced) | `git diff 2480772 HEAD`, `git show --stat 7dff513` | recorded above |

## Summary

**This review returns PASS.** The round-12 Moderate is genuinely and fully
closed: Step 13's parenthetical no longer attributes a co-change to the probe. It
now states only what the probe proves — it "plants `we<0x1e>ird.txt` and records
it as the one whole path `we<0x1e>ird.txt`, not split into a fabricated pair" —
and cites `T-13-1` for the co-change-with-a-partner case. I verified the probe
does exactly that (`0x1e-in-path 'we\x1eird.txt': ids=1 [we\x1eird.txt]`, one
path, solo commit), and I verified `T-13-1` genuinely carries the co-change claim
now cited to it (`we<0x1e>ird.txt` is planted "co-changing with the planted pair's
partner in one commit," with an asserting `Fails when`). This is the cleaner of
the two closes round-12 offered (align the prose to the artifact rather than load
the probe with co-change noise), and the false attribution is the same
dominating-rule-1 standard the original finding named. The fix's second change —
a truncated-rename bounds guard added to Step 13's malformed-record set and to the
probe's reference parser — is correct, defensive, and introduces no
Critical/Serious/Systemic/Moderate defect: it guards input real git never emits
(a future format-drift case), it is consistent with the `miner_unparsed_numstat`
"never guessed" contract, and every mechanical gate is green on the current
revision. Two Minor recommendations are recorded; neither blocks. Under the
mechanical verdict rule (zero Critical, zero Serious, zero Systemic, zero
Moderate), the verdict is PASS.

## Fixes-Closure Verification (Scope 1)

**Round-12 M1 (probe cited for a co-change it does not plant) — CLOSED.** The
original defect: Step 13's parenthetical read "`probe:24_git_numstat_z` plants
`we<0x1e>ird.txt` **co-changing with a partner** and records it as the one path
`we<0x1e>ird.txt`, not a fabricated pair" — a false claim about executed evidence
(the `RAW_rs` commit is solo) and internally inconsistent with its own tail. The
fix (Read `plan:2150–2153`): the parenthetical now reads

> "(`probe:24_git_numstat_z` plants `we<0x1e>ird.txt` and records it as the one
> whole path `we<0x1e>ird.txt`, not split into a fabricated pair; `T-13-1`
> exercises that same path co-changing with the fixture's partner)."

I did not trust the prose. I verified each of its two clauses against source:

1. *"plants `we<0x1e>ird.txt` and records it as the one whole path … not split
   into a fabricated pair."* Read the probe: `24_git_numstat_z.mjs:43` is
   `wr('we\x1eird.txt', 0x4a); git('add','-A'); git('commit',…,'RAW_rs')` — one
   file, no partner staged in that commit. Executed the probe: it prints
   `0x1e-in-path 'we\x1eird.txt': ids=1 [we\x1eird.txt]` — one path recorded whole.
   The claim is now accurate and internally consistent (one whole path, not a
   pair), and no longer asserts a co-change of the probe.

2. *"`T-13-1` exercises that same path co-changing with the fixture's partner."*
   Read T-13-1 (`plan:7849–7857`): the raw path classes are planted "each
   co-changing with the planted pair's partner in one commit — … and a
   **Record-Separator path** (`we<0x1e>ird.txt` …)," with a `Fails when` that
   fires if that path "is absent from `cochange_pairs` …, loses its co-change with
   the partner, or … is cut by the record framing into a fabricated pair"
   (`:7877–7882`). T-13-1 does carry the co-change-with-a-partner property the
   parenthetical now cites to it — the citation is accurate.

*Named standard (dominating rule 1 / verify-before-assert; expert-plan
build-contract citation accuracy) — met.* The sentence now describes the probe by
what it proves and routes the co-change claim to the artifact that actually
carries it (T-13-1), matching how Q56 (`:9891–9892`, "the probe plants
`we<0x1e>ird.txt` and records it whole") and §11.4 (`:7163`, "the `0x1e` path
stays one field (not a fabricated pair)") already cite the probe accurately. The
false attribution is gone at the one surface it appeared on. Closure is against
the same standard the original finding named, not an adjacent one.

**Round-12 collapse-hunt implementation note — acted on.** The note asked that the
production miner (Step 13) guard a truncated rename and route it to
`miner_unparsed_numstat`, and explicitly called this "not a defect in the reviewed
artifacts" (the probe's positional consumption "never reaches `undefined` in the
probe (verified)"). The fix added the guard to Step 13's build-contract prose
("or a rename marker missing its two following identity fields (a truncated
stream) … recorded with a `miner_unparsed_numstat` diagnostic … never guessed",
`:2157–2161`) and to the probe's reference parser (`:91–94`). This is not a
closure item — it was a forward note — so it is scanned as new work below.

## Critical & Serious Findings

No Critical or Serious findings — the full Scope-2 fix-diff (both changed Step 13
sentences, the probe's rename branch, and the four cross-section surfaces that
describe the same mechanism) was Read, and every behavioural premise the change
rests on was verified by direct execution of the probe on git 2.43.0 / Node
v22.22.2 and by trace of the parser against the real field-splitting; no violation
of Critical or Serious classification was observed. The prior closures the fix
builds on remain intact and were re-confirmed by execution: the `0x1e`-in-path
class records as one whole path (`ids=1 [we\x1eird.txt]`), a rename expands to two
raw identities (`ids=2 [newname.txt, oldname.txt]`), a real `a => b.txt` stays one
field (`ids=1 [a => b.txt]`), and `fields == readdir keys: true` over all five raw
classes.

## Systemic Patterns

No systemic patterns — verified by a cross-section sweep for stale/contradicted
prose introduced by the addition. `grep -n "miner_unparsed_numstat"
plan-phase-a.md` → 6 hits (`:1354`, `:2160`, `:7621`, `:7866`, `:9725`, `:9894`);
I Read each and confirmed the fix's third malformed class does not contradict any
of them — Step 6's catalog (`:1354–1359`) defines the diagnostic generically ("a
`-z --numstat` record the miner … cannot parse into the expected shape"), and
Q56 (`:9892–9894`) uses the same generalized language ("Only a record that
matches none of the expected shapes"), so both subsume the newly-named
truncated-rename class without enumerating it, and neither falls out of sync. The
change is confined to two sentences in one step plus one probe branch; it is not a
pattern propagated across surfaces.

## Moderate & Minor Findings

No Moderate findings — verified by Read of both changed Step 13 sentences, the
probe's rename branch and its full parse, and the four cross-section surfaces
(Q56, §11.4, Step 6, T-13-1); every premise the fix asserts was checked against
current source (probe output by execution, git-behaviour and parser correctness
by trace, doc-sync by `check_docs.py` and `derive-plan-sections.mjs --check`), and
no deviation of Moderate-or-above classification was found. Two Minor
recommendations follow.

### m1 (Minor) — the truncated-rename malformed class is named in the build contract but exercised by no test and no probe assertion

**What the plan says now.** Step 13 (`:2156–2161`) adds a third malformed class —
"a rename marker missing its two following identity fields (a truncated stream)" —
to the set "recorded with a `miner_unparsed_numstat` diagnostic (Step 6) and
contributes no pair, never guessed." The probe's reference parser implements the
guard (`:91–94`): on an empty-path numstat entry, `if (fields[i+1] !== undefined
&& fields[i+2] !== undefined)` push both identities, `else if (cur) cur.bad =
true`.

**How this was verified.** Read of Step 13 `:2156–2161` and the probe `:91–95` at
drafting time. Read of T-13-1's malformed case (`:7863–7867`): it plants "one
**synthetic malformed `-z` record** (a numstat entry missing a field…)" — the
`parts.length < 3` shape (`probe:89`), not a truncated rename. The probe never
plants a truncated-rename fixture and never asserts `bad` in its output
(`grep -n "bad" 24_git_numstat_z.mjs` → set at `:77`, `:89`, `:93`; asserted in
`console.log` → 0). Executed: the probe's six output lines exercise the path
classes only, so the truncated branch (`:93`) is dead on the probe's own inputs.

**Which standard it violates and why — and why Minor, not Moderate.** Expert-plan
build-contract completeness: a behaviour named in the contract that no test
exercises is a coverage gap. But the severity here is genuinely Minor, not the
Moderate that round-11's analogous partition gap carried. Round-11 m1 was Moderate
because the omitted partition member (`0x1e`-in-path) is a **real git-emittable**
input that **breaks the mechanism**, so a fabricating miner would pass the test
bed and then corrupt real co-change data on Max Cogar's real repos — the exact
honest-floor stakes (spec §11.5). The truncated rename is categorically different:
the plan itself and the round-12 collapse-hunt establish it is input **real git
never emits** (on well-formed `-z` output a rename is always followed by both
identities), so a miner missing the guard corrupts no real-repo data — the
honest-floor stakes are absent. The guard is demonstrated by the probe's reference
parser (the exact shape an implementer copies) and the `miner_unparsed_numstat`
diagnostic **path** is proven by T-13-1's one synthetic malformed record; only a
dedicated fixture for this specific defensive shape is missing. The pattern also
predates this fix (the "bad header" class at `:2157` was already named without its
own T-13-1 fixture), so the fix extends a pre-existing test-granularity choice by
one defensive class rather than introducing a new one.

**What correct would add (optional).** If the truncated-rename guard is to have
executed coverage, extend the probe's `parseZ` reference-parser assertions to
drive a hand-built stream truncated after an empty-path numstat entry and assert
`bad === true` with no path pushed, or add a truncated-rename case to T-13-1's
synthetic malformed record and its `Fails when`. Optional because the input is not
git-emittable and the `never-guessed` invariant is upheld structurally.

### m2 (Minor) — the probe's rename branch guards `cur` on the truncated path but not on its sibling happy/plain paths

**What the code does now.** In the rename branch the fix writes `else if (cur)
cur.bad = true` (`:93`), guarding a null `cur`, while the same branch's happy path
`cur.paths.push(fields[i+1], fields[i+2])` (`:92`) and the sibling plain-add path
`cur.paths.push(path)` (`:95`) dereference `cur` unguarded. If `cur` were null,
those two would throw where the truncated path would not — an asymmetric guard.

**How this was verified.** Read `:89–95` at drafting time; the `parts.length < 3`
line (`:89`) shows the author does treat `cur` as possibly-null in this region
(`if (cur) cur.bad = true`). Traced reachability: `cur` is null only before the
first header, and the miner's stream (`--format=%x1e%H%x00…`) always begins with a
header field, so a numstat entry never precedes one; the unguarded pushes never
execute with `cur === null`. Confirmed the unguarded `cur.paths.push` **predates**
this fix (base `2480772`: `cur.paths.push(fields[i+1], fields[i+2])`, no guard).

**Which standard and why Minor.** Consistency/defensive-symmetry (a probe should
not guard one branch of a triad and not its siblings). Minor because it is dead
defensive code in a reference parser whose input is real, header-prefixed git
output; it cannot produce a wrong build decision (the probe's output is verified
byte-exact against its golden), and the unguarded push is pre-existing, not a
regression this fix introduced. If tidied, either guard all three (`if (cur)`) or
none, matching the branch's real reachability.

## Tentative Findings

No tentative findings — every premise above was verified against current source at
drafting time: plan and probe text by Read at file:line; the probe's recording of
the `0x1e` path, the rename, the `a => b.txt` literal, and the binary entry by
direct execution of the probe (git 2.43.0, Node v22.22.2) and byte-diff against
its golden; T-13-1's co-change claim by Read of `:7849–7857` / `:7877–7882`;
doc-sync by `check_docs.py` (passed) and `derive-plan-sections.mjs --check` (26
probes cited, regions current); the base-vs-fix delta by `git diff 2480772 HEAD`
and `git show --stat 7dff513`. Nothing rests on memory, on either round-12
review's assertions, or on the probe's golden by reference.

### Executed evidence grounding this review (git 2.43.0, Node v22.22.2)

```
# PROBE — official runner, direct run, and golden diff:
  run-plan-probes.mjs --only 24_git_numstat_z   →  ok 24_git_numstat_z ; all probes match
  node 24_git_numstat_z.mjs | diff - expected/24_git_numstat_z.txt   →  (no diff)
     raw under -z (quotePath default ON): fields == readdir keys: true
     0x1e-in-path 'we\x1eird.txt': ids=1 [we\x1eird.txt]     ← one whole path, solo commit
     rename oldname.txt->newname.txt: ids=2 [newname.txt, oldname.txt]
     literal 'a => b.txt' (plain add): ids=1 [a => b.txt]
     binary: [bin.dat]

# STATIC checkers / wiring:
  derive-plan-sections.mjs --check → OK: 40 steps, 13 elements, 124 test specs, 26 probes cited, regions current
  derive-plan-sections.mjs --self-check → self-check passed: 34 checks
  check_docs.py                    → context-oracle doc-consistency check passed.

# SCOPE delta:
  git show --stat 7dff513 → STATUS.md, plan-phase-a.md (10), 24_git_numstat_z.mjs (7)
  intervening f043c1e / b907463 touch only docs/reviews/* (no plan/probe change)
```

## What's Actually Good

- **The Moderate was closed by aligning the prose to the artifact, not by loading
  the probe with co-change noise.** *Property:* Step 13's parenthetical now
  describes exactly what the probe proves (one whole path, not a fabricated pair)
  and cites T-13-1 — the artifact that does carry the co-change — for the
  co-change; the false "co-changing with a partner" attribution to the probe is
  gone at its one surface, and the sentence is now internally consistent. *Standard:*
  dominating rule 1 / verify-before-assert; expert-plan build-contract citation
  accuracy. *Verified:* Read `plan:2150–2153`; Read probe `:43`, `:117`; Read
  T-13-1 `:7849–7857`, `:7877–7882`; executed the probe (`ids=1 [we\x1eird.txt]`).
- **The truncated-rename guard hardens the reference parser against a real
  never-guess contract violation without overclaiming.** *Property:* the probe now
  bounds-checks a rename's two identity fields before pushing them, so a truncated
  stream sets `bad` instead of pushing `undefined` into the path set — matching the
  `miner_unparsed_numstat` "contributes no pair, never guessed" contract — and the
  plan attributes the *diagnostic* to the miner (Step 6), not to the probe, so no
  executed-evidence overclaim is introduced. *Standard:* `AD-13` ("recorded …
  never guessed"); dominating rule 1 (evidence attributed to the artifact that
  carries it). *Verified:* Read probe `:91–94`; Read Step 13 `:2157–2161` and Step
  6 catalog `:1354–1359`; traced the field-splitting (`:71`) to confirm the
  `undefined` bound is the truncation signal.

## Recommended Priority

Nothing blocks. If the two Minor items are addressed, do m1 first (give the
truncated-rename guard executed coverage — extend the probe's `parseZ` assertions
or T-13-1's synthetic malformed record), since it closes the gap between a named
build-contract behaviour and its test; m2 (tidy the probe's asymmetric `cur`
guard) is cosmetic and can ride along. Both are optional: the input m1 concerns is
not git-emittable, and m2 is dead defensive code in a reference parser.

## Verdict

Verdict: PASS
