# Round 14 — Independent post-fix expert-review of `docs/plans/plan-phase-a.md`

**Date:** 2026-09-18
**Reviewer:** independent fresh session. I did not author this plan, the `-z`
switch, the Record-Separator framing, the NUL-parse fix, the round-12/13 fixes, or
the round-13 fix now under review, nor any prior round or its reviews. The round-13
findings are treated as **closure candidates re-derived from current source and
re-executed**, not trusted by reference.

**Artifact under review:** the round-13 fix (commit `67fc7cf`, "fix round-13
findings — stale Gate-3 clause + truncated-rename test"), diffed against `7dff513`
(the round-12-finding fix that round-13 reviewed), scoped to the two files the task
named:

- `docs/plans/plan-phase-a.md` — Step 13's Gate-3 "The decision" line
  (`:2189–2192`) and the T-13-1 malformed-record spec (`:2158–2160`, `:7864–7870`,
  `:7889–7892`).
- `docs/plans/plan-phase-a.probes/24_git_numstat_z.mjs` — a new
  entry-before-header bounds guard (`:85`).

I confirmed the scope. `git diff 7dff513..HEAD` over the two named files is
exactly commit `67fc7cf`'s changes (plan `+16/-10` across those three regions, one
line added to the probe); the two intervening commits (`a4c9c95`, `5cde93f`) add
only review documents and touch neither the plan nor the probe. `STATUS.md` is
outside the named scope and is not reviewed here.

**Nature:** a **re-review** under the expert-review Re-Review Protocol. The round-13
**collapse-hunt** (`docs/reviews/2026-09-18-round-13-collapse-hunt.md`) returned
NEEDS FIXES on one Moderate (Gate-3 "The decision" still stated the abandoned
"line-by-line" mechanism) and one Minor (the truncated-rename malformed class was
specified but exercised by neither the probe nor `T-13-1`). The round-13
**expert-review** (`…-round-13-expert-review.md`) returned PASS and recorded two
Minor recommendations — m1 (the same truncated-rename coverage gap) and m2 (the
probe's rename branch guards `cur` on the truncated arm but not on its sibling
push arms). Commit `67fc7cf` acts on all of these. Both re-review scopes are
exhausted below.

**Standards this review evaluates against:** the changed step's own named sources
— `AD-13` (miner: an unresolved field is "recorded … never guessed"); the
`miner_unparsed_numstat` contract (Step 6); `T-13-1`'s named technique
(**equivalence partitioning over raw path classes**); the **Phase A honest-floor
goal** (spec §11.5 / `CLAUDE.md` dominating rule 3: an *honest* deterministic
floor whose corpus Phase B and the regression fixtures are designed from, so a
plan surface that mis-describes the mechanism the implementer builds poisons the
foundation the rest of the build reads); `CLAUDE.md` dominating rule 1 / the
agent-armory standing rule (**"Verify before you assert"**) — never state that a
mechanism is what the code builds, or that a behaviour is tested, without having
established it; and the expert-plan **build-contract** standard ("another engineer
can execute step by step without making a single decision on the fly," and every
behaviour named in the contract is covered by a test that actually exercises it).

**Environment:** git 2.43.0, Node v22.22.2 — the exact versions §11.4's probe-24
evidence line names. Context7 was not required: the load-bearing category is git's
on-disk `-z --numstat` byte stream and a JS parser, both verified by execution
(stronger than a docs lookup); no instrument class was unavailable.

---

## Scope and Inventory

Per the Re-Review Protocol the inventory carries both scopes.

### Scope 1 — Round-13 findings as closure items

- [x] **Round-13 collapse-hunt Finding 1 (Moderate)** — Gate-3 "The decision"
  (`plan:2189`) stated "Stream `git log` line-by-line", the abandoned mechanism,
  contradicting the step's own `-z`/NUL body and falsified by its newline-path
  fixture. **Closure verified** by Read of `plan:2189–2192`, grep of the whole
  plan for `line-by-line`, and Read of the `-z`/NUL body (`plan:2126–2144`).
  Detailed below.
- [x] **Round-13 collapse-hunt Finding 2 / expert-review m1 (Minor)** — the
  truncated-rename malformed class was named in Step 13 but exercised by neither
  the probe nor `T-13-1`. **Closure verified** by Read of `T-13-1` Data
  (`plan:7864–7870`) and Fails-when (`plan:7889–7892`), and Read of the probe's
  guard (`24_git_numstat_z.mjs:92–95`). Detailed below.
- [x] **Round-13 expert-review m2 (Minor)** — the probe's rename branch guarded
  `cur` on the truncated (`bad`) arm but not on the sibling push arms, an
  asymmetric guard that would throw on a null `cur`. **Closure verified** by Read
  of the probe (`:83–96`), execution, and golden byte-diff. Detailed below, with a
  residual Minor recorded under Scope 2.

### Scope 2 — Fix-diff files (new-findings detection)

- [x] `docs/plans/plan-phase-a.md` — Read the three changed regions (Gate-3
  `:2189–2192`; Step-13 body malformed-class enumeration `:2154–2161`; `T-13-1`
  `:7833–7892`) and the cross-section surfaces that describe the same mechanism and
  could fall out of sync with the addition: Step 6 catalog (`:1354–1359`), Q56
  (`:9884–9901`), the diagnostic-code list test (`:7618–7624`), the Q-disposition
  code list (`:9730`). Doc-sync of the whole plan checked by executing
  `check_docs.py` (passed) and `derive-plan-sections.mjs --check` (regions
  current). Systemic sweeps on `miner_unparsed_numstat` (9 hits) and `line-by-line`
  (1 hit) recorded below.
- [x] `docs/plans/plan-phase-a.probes/24_git_numstat_z.mjs` — Read in full (125
  lines); the new guard (`:85`) traced against the field-splitting (`:71`), the
  header detection (`:76–82`), and the rename branch it protects (`:92–96`);
  **executed**; diffed against its golden (no diff); run through the official
  runner (`run-plan-probes.mjs --only 24_git_numstat_z` → `ok`). Compared against
  the base version (`7dff513`) to confirm the single-line addition is the only
  probe change.
- [x] `docs/plans/plan-phase-a.probes/expected/24_git_numstat_z.txt` — reproduced
  by execution byte-for-byte (unchanged by this fix; in scope as the probe's
  oracle).

### Instruments used (per claim type)

| Claim type | Instrument | Result |
|---|---|---|
| Literal plan/probe text ("line N says Z") | Read at file:line, at drafting time | recorded below |
| Probe behaviour (ids, whole-path recording, guard reachability, golden fidelity) | **executed** `node 24_git_numstat_z.mjs`; `diff` vs golden; `run-plan-probes.mjs` | pasted below |
| Probe ↔ plan-catalog ↔ doc wiring | `derive-plan-sections.mjs --check`, `--self-check`; `check_docs.py` | all green |
| Base-vs-fix delta (what the diff introduced) | `git diff 7dff513..HEAD` over the two named files | recorded above |

---

## Summary

**This review returns PASS.** All three round-13 findings are genuinely closed
against the standards they originally named. The Moderate is closed at the root:
Gate-3 "The decision" now reads "Stream `git log` under `-z` and parse it on NUL …
commit records marked by a `%x1e` header," which is the mechanism the step's own
body builds (`:2126–2144`) and is consistent with the newline-path fixture
(`ne<LF>wl.txt`) that a line-split parser would break; the abandoned "line-by-line"
phrase now survives only at `:2291` (an unrelated, correctly line-oriented
`packed-refs` scan). The Minor coverage gap is closed by adding the truncated
rename as a **second synthetic malformed `-z` record** to `T-13-1`'s Data and its
Fails-when, with the class honestly labelled "neither of which real git emits" and
required to route to `miner_unparsed_numstat` and "contribute no pair (never a
partial or guessed identity)". The probe's asymmetric-guard Minor is resolved by an
early `if (!cur) { i += 1; continue; }` guard that makes every downstream `cur`
dereference safe; the fix is output-neutral (the golden is byte-identical and the
official runner reports `ok`, all 26 probes matching). The one residual is Minor
and cosmetic — the early guard leaves the two now-provably-true inner `cur` guards
in place — and does not block. Under the mechanical verdict rule (zero Critical,
zero Serious, zero Systemic, zero Moderate), the verdict is PASS.

---

## Fixes-Closure Verification (Scope 1)

**Round-13 collapse-hunt Finding 1 (Moderate; Gate-3 decision stated the abandoned
mechanism) — CLOSED.** The original defect: Step 13's Gate-3 "The decision"
(`:2189`) read "Stream `git log` line-by-line; hygiene as hard filters …" — the
exact technique the round 6–11 saga abandoned, falsified by the step's own
`ne<LF>wl.txt` fixture (a path a line-split parser would cut). The fix (Read
`plan:2189–2192`) now reads:

> **The decision.** Stream `git log` under `-z` and parse it on NUL (the only byte
> a pathname cannot hold), commit records marked by a `%x1e` header; hygiene as
> hard filters recorded in `commits.excluded`; corpus floor is evidentiary, not
> session-based; landmine mining is the two deterministic classes only.

I did not trust the prose. Verification:

1. *The decision line now describes the mechanism the step builds.* Read the
   "What changes" body: `-z` "is the load-bearing choice" (`:2127`); "the parser
   splits the stream on NUL and on no in-path byte" (`:2143–2144`); "Each commit
   record is prefixed with a Record Separator (`%x1e`)" (`:2145`). The new decision
   line — `-z`, split on NUL, commit records marked by a `%x1e` header — is a
   faithful one-sentence statement of exactly that body. No longer the opposite
   mechanism.
2. *The abandoned phrase is gone from every decision surface.* Executed
   `grep -n "line-by-line" plan-phase-a.md` → a single hit, `:2291`
   (`<commondir>/packed-refs … by a line-by-line scan`), which is a genuinely
   line-oriented ref scan, unrelated to the numstat stream and correct. The Gate-3
   surface the finding named no longer contains it.
3. *No adjacent decision statement re-introduces the line model.* Executed
   `grep -n "Stream \`git log\`|--numstat\` line|line mode|line-mode"` → the only
   "line mode"/"line-mode" hits (`:2135`, `:2139`, `:7860`) all **contrast** line
   mode against `-z` to explain why `-z` is used (accurate), and Q56's question
   header "How does the miner read a `--numstat` line …" (`:9884`) is a historical
   question whose disposition body (`:9885–9899`) correctly answers `-z`/NUL — not
   a decision statement. No stale decision surface remains.

*Named standard (dominating rule 1 / verify-before-assert; dominating rule 2 —
the load-bearing decision stated honestly in one sentence) — met.* Closure is
against the same standard the original finding named. **This is the cleanest
possible close: the root decision line now matches the mechanism, the body, and
the fixture.**

**Round-13 collapse-hunt Finding 2 / expert-review m1 (Minor; truncated-rename
class exercised by no test) — CLOSED.** The original defect: `7dff513` added the
truncated-rename class to Step 13's malformed catalogue and the probe's guard, but
`T-13-1` planted only *one* synthetic malformed record (a field-short entry), so
the new class had no test assertion. The fix took Finding 2's option (a). Read
`T-13-1` Data (`:7864–7870`):

> The generator also feeds the miner's parser two **synthetic malformed `-z`
> records**, neither of which real git emits — a numstat entry missing a field, and
> a **truncated rename** (a rename marker `<added>\t<deleted>\t` with an empty path
> but its two identity fields missing at end of stream) — each of which must be
> recorded as `miner_unparsed_numstat` and contribute no pair (never a partial or
> guessed identity) …

and its Fails-when (`:7889–7892`):

> … OR either synthetic malformed `-z` record (the field-short entry or the
> truncated rename) is not recorded as `miner_unparsed_numstat` (it is guessed into
> a pair or a partial identity, silently dropped, or crashes the parse) …

Verification: (a) the description matches the probe's guard — Read
`24_git_numstat_z.mjs:92–95`: an empty-path numstat entry with
`fields[i+1]`/`fields[i+2]` `undefined` sets `bad` (routes to
`miner_unparsed_numstat`), pushing no path; the "empty path … two identity fields
missing at end of stream" language is exact. (b) It is honest and correctly scoped:
"neither of which real git emits" preserves the round-13 finding that this class is
not git-emittable — no honest-floor overclaim. (c) The class now has an asserting
fixture (`T-13-1` Data + Fails-when), which is the coverage the finding demanded.

*Named standard (expert-plan build-contract completeness — a behaviour named in
the contract is covered by a test) — met.* Closure is against the same standard.

**Round-13 expert-review m2 (Minor; asymmetric `cur` guard in the probe) —
CLOSED, one Minor residual.** The original defect: the rename branch guarded `cur`
on the `bad` arm (`else if (cur) cur.bad = true`) but the push arms
(`cur.paths.push(…)`) dereferenced `cur` unguarded — asymmetric, and a throw on a
null `cur`. The fix (Read `24_git_numstat_z.mjs:85`) inserts, before the numstat
parse:

```js
if (!cur) { i += 1; continue; }   // entry before any header (unreachable, well-formed)
```

Verification by trace and execution: after `:85`, `cur` is a non-null object for
the remainder of the loop body, so the push arms at `:93` and `:96` can no longer
be reached with `cur === null` — the actual null-deref risk m2 named is eliminated
(a stronger guarantee than m2's suggested "guard all three"). The guard's comment
"unreachable, well-formed" is accurate: the miner's `--format=%x1e%H%x00%at%x00`
stream always begins with a header field, so a numstat entry never precedes one.
The fix is output-neutral: I executed the probe and byte-diffed against
`expected/24_git_numstat_z.txt` (no diff), and the official runner reports `ok
24_git_numstat_z`, "all probes match their recorded expectations." A residual
cosmetic consequence (the now-redundant inner guards) is recorded as a Minor under
Scope 2 below; it is not a reopening — the named standard (no null-deref asymmetry
that can throw) is satisfied.

---

## Critical & Serious Findings

No Critical or Serious findings — the full Scope-2 fix-diff (the Gate-3 decision
line, the Step-13 malformed-class enumeration, the `T-13-1` Data + Fails-when, the
probe's new guard, and the four cross-section surfaces that describe the same
mechanism) was Read, and every behavioural premise the change rests on was verified
by direct execution of the probe on git 2.43.0 / Node v22.22.2, by byte-diff
against the golden, and by trace of the parser against the real field-splitting; no
violation of Critical or Serious classification was observed. The prior closures
the fix builds on remain intact and were re-confirmed by execution: the
`0x1e`-in-path class records as one whole path (`ids=1 [we\x1eird.txt]`), a rename
expands to two raw identities (`ids=2 [newname.txt, oldname.txt]`), a real
`a => b.txt` stays one field (`ids=1 [a => b.txt]`), and `fields == readdir keys:
true` over all five raw classes.

## Systemic Patterns

No systemic patterns — verified by two cross-section sweeps for stale/contradicted
prose introduced by the addition:

- `grep -n "miner_unparsed_numstat" plan-phase-a.md` → **9 hits** (`:1354`,
  `:2160`, `:7622`, `:7865`, `:7869`, `:7889`, `:7891`, `:9730`, `:9899`). Read
  each. Step 6's catalog (`:1354–1359`) defines the diagnostic generically ("a `-z
  --numstat` record the miner … cannot parse into the expected shape"); Q56
  (`:9897–9899`) uses the same generalized language ("Only a record that matches
  none of the expected shapes"); `:7622` and `:9730` are code-name enumerations;
  Q56's positive-path summary (`:9899–9901`) lists T-13-1's *recorded* cases and
  does not reference the malformed-record count. So all four non-Step-13 surfaces
  subsume the newly-enumerated truncated-rename class without contradicting it, and
  none falls out of sync. The change is confined to Step 13 + `T-13-1` + one probe
  line.
- `grep -n "synthetic malformed" plan-phase-a.md` → 2 hits, both in `T-13-1`
  (`:7865`, `:7889`), both now reading "two"/"either"; no surface still claims "one"
  synthetic malformed record. The `+3`-line count change did not orphan any
  cross-reference (`derive-plan-sections.mjs --check`: 124 test specs, regions
  current).

## Moderate & Minor Findings

No Moderate findings — verified by Read of the Gate-3 line, the Step-13 body
enumeration, the `T-13-1` Data + Fails-when, the probe's new guard and its full
parse, and the four cross-section surfaces (Step 6, Q56, the code-list test, the
Q-disposition list); every premise the fix asserts was checked against current
source (probe output by execution and golden byte-diff, git-behaviour and parser
correctness by trace, doc-sync by `check_docs.py` and `derive-plan-sections.mjs
--check`), and no deviation of Moderate-or-above classification was found. One Minor
recommendation follows.

### m1 (Minor) — the early `!cur` guard leaves the two inner `cur` guards provably redundant

**What the code does now.** The fix adds `if (!cur) { i += 1; continue; }` at
`24_git_numstat_z.mjs:85`, before the numstat parse, so `cur` is non-null for the
rest of the loop body. But the two pre-existing inner guards remain: `:90` `if
(parts.length < 3) { if (cur) cur.bad = true; … }` and `:94` `else if (cur) cur.bad
= true`. With the new early guard, the `if (cur)` at `:90` and the `else if (cur)`
at `:94` can never take their false branch — they are dead conditionals that always
pass.

**How this was verified.** Read `:85–96` at drafting time; traced that `:85`
`continue`s whenever `cur` is falsy, so `:90`/`:93`/`:94`/`:96` are reached only
with `cur` truthy. Confirmed the two inner guards therefore always evaluate true.

**Which standard it violates and why — and why Minor, not Moderate.** Simplicity /
consistency (YAGNI applied to a guard the invariant already establishes): m2's
recommendation was "guard all three or none, matching the branch's real
reachability"; the fix instead guards once at the top (the strongest choice) but
leaves the inner guards, so the triad is now guarded once redundantly rather than
uniformly. It is genuinely Minor: this is dead-but-harmless defensive code in a
reference parser whose output is byte-verified against its golden; it cannot
produce a wrong build decision, changes no behaviour, and is arguably acceptable as
defense-in-depth. No honest-floor stakes (the input that would exercise `!cur` is
not git-emittable). It does not block.

**What correct would add (optional).** For a uniformly-guarded triad, drop the now-
redundant `if (cur)` at `:90` to a bare `cur.bad = true` and the `else if (cur)` at
`:94` to a bare `else cur.bad = true`, since `:85` already establishes `cur`
non-null. Cosmetic; optional.

## Tentative Findings

No tentative findings — every premise above was verified against current source at
drafting time: plan and probe text by Read at file:line; the probe's recording of
the `0x1e` path, the rename, the `a => b.txt` literal, the binary entry, and the
guard's output-neutrality by direct execution (git 2.43.0, Node v22.22.2) and
byte-diff against the golden; `T-13-1`'s truncated-rename assertion by Read of
`:7864–7870` / `:7889–7892`; doc-sync by `check_docs.py` (passed) and
`derive-plan-sections.mjs --check` (26 probes cited, regions current) and
`--self-check` (34 checks). Nothing rests on memory, on any round-13 review's
assertions, or on the probe's golden by reference.

### Executed evidence grounding this review (git 2.43.0, Node v22.22.2)

```
# PROBE — direct run, official runner, and golden diff:
  node 24_git_numstat_z.mjs                          → exit 0
     raw under -z (quotePath default ON): fields == readdir keys: true
     0x1e-in-path 'we\x1eird.txt': ids=1 [we\x1eird.txt]     ← one whole path, solo commit
     rename oldname.txt->newname.txt: ids=2 [newname.txt, oldname.txt]
     literal 'a => b.txt' (plain add): ids=1 [a => b.txt]
     binary: [bin.dat]
  run-plan-probes.mjs --only 24_git_numstat_z        → ok 24_git_numstat_z ; all probes match
  run-plan-probes.mjs (all)                          → ok 01..26 ; all 26 probes match ; exit 0
  node 24_git_numstat_z.mjs | diff - expected/24_git_numstat_z.txt   → (no diff)

# STATIC checkers / wiring:
  derive-plan-sections.mjs --check      → OK: 40 steps, 13 elements, 124 test specs, 26 probes cited, regions current
  derive-plan-sections.mjs --self-check → self-check passed: 34 checks
  check_docs.py                         → context-oracle doc-consistency check passed.

# SCOPE delta:
  git diff 7dff513..HEAD -- plan-phase-a.md 24_git_numstat_z.mjs → the two files only (67fc7cf)
  intervening a4c9c95 / 5cde93f touch only docs/reviews/* (no plan/probe change)

# SWEEPS:
  grep -n "line-by-line" plan-phase-a.md          → 1 hit (:2291, packed-refs, unrelated)
  grep -n "miner_unparsed_numstat" plan-phase-a.md → 9 hits, all consistent (enumerated above)
  grep -n "synthetic malformed" plan-phase-a.md   → 2 hits (:7865, :7889), both "two"/"either"
```

## What's Actually Good

- **The Moderate was closed at the root — the decision line now states the
  mechanism, not its abandoned predecessor.** *Property:* Gate-3 "The decision"
  now says `-z` + split-on-NUL + `%x1e` header, matching the step's own body
  (`:2126–2145`) and consistent with the `ne<LF>wl.txt` fixture that a line-split
  parser would cut; "line-by-line" survives only at an unrelated `packed-refs` scan.
  *Standard:* dominating rule 1 / verify-before-assert; dominating rule 2 (the
  load-bearing decision stated honestly in one sentence). *Verified:* Read
  `plan:2189–2192`; grep `line-by-line` → 1 unrelated hit; Read the `-z`/NUL body
  `:2126–2145`.
- **The truncated-rename coverage gap was closed honestly, without inventing
  git-emittable stakes.** *Property:* `T-13-1` now plants the truncated rename as a
  second **synthetic** malformed record — explicitly "neither of which real git
  emits" — with an asserting Fails-when requiring `miner_unparsed_numstat` and "no
  pair (never a partial or guessed identity)", matching the probe's guard exactly,
  and Step 6 / Q56 subsume the class without contradiction. *Standard:* `AD-13`
  ("recorded … never guessed"); expert-plan build-contract completeness.
  *Verified:* Read `plan:7864–7870`, `:7889–7892`; Read probe `:92–95`; grep-sweep
  of all 9 `miner_unparsed_numstat` surfaces.
- **The asymmetric-guard fix is output-neutral and strengthens the invariant.**
  *Property:* the early `if (!cur) continue` makes every downstream `cur`
  dereference safe while leaving the parse's observable output byte-identical (the
  golden matches; the runner reports `ok`, all 26 probes). *Standard:* dominating
  rule 1 (a change asserted output-neutral is verified so). *Verified:* executed
  the probe and byte-diffed vs golden (no diff); `run-plan-probes.mjs` all-green.

## Recommended Priority

Nothing blocks; the verdict is PASS. The single Minor (m1 — drop the two now-
redundant inner `cur` guards, or leave them as defense-in-depth) is cosmetic and
optional, best folded into the next edit that touches the probe rather than done on
its own.

## Verdict

Verdict: PASS
