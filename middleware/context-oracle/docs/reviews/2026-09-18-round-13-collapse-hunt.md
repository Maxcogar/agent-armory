# Round 13 — Independent collapse-hunt of the round-12 Step-13 prose fix + truncated-rename guard in `docs/plans/plan-phase-a.md`

**Date:** 2026-09-18
**Artifact under review:** the round-12 fix — commits `b907463`, `f043c1e`,
`7dff513` — as it lands on two files:
`docs/plans/plan-phase-a.md` (Step 13 prose) and its probe
`docs/plans/plan-phase-a.probes/24_git_numstat_z.mjs`. Diffed against `2480772`
(the round-11-finding fix, i.e. the last commit before this session's round-12
work). The material change is `7dff513`; `b907463`/`f043c1e` add only the
round-12 review files.
**Baseline:** `2480772` — the NUL-driven `-z` parse round 12 verified sound.
Round 12's two passes (`docs/reviews/2026-09-18-round-12-{collapse-hunt,expert-review}.md`)
could not collapse the parse and returned a single Moderate: Step 13 claimed
`probe:24_git_numstat_z` plants `we<0x1e>ird.txt` "co-changing with a partner,"
but that probe commit is **solo** — a dominating-rule-1 inaccuracy about executed
evidence. `7dff513` is the fix for that finding, plus a self-initiated
truncated-rename guard closing the round-12 reviewers' forward note.
**Nature:** An independent adversarial collapse-hunt under
`middleware/context-oracle/CLAUDE.md` dominating rule 2 — a fresh reviewer who
did not author this change, attacking each load-bearing decision's hardest
question and hunting for new ones. Every load-bearing behaviour below was
**executed by me** in this environment (git 2.43.0 — the version §11.4 names — and
Node v22.22.2) and is reported from what I observed, not from the plan's prose,
the probe's self-report, or `docs/STATUS.md`, none of which I accepted as evidence
until I reproduced them.
**Standards this review evaluates against:** the changed step's own named sources
— `AD-13` (an unresolved field is "recorded … never guessed"), the
`miner_unparsed_numstat` contract, `T-13-1`'s named data and technique
(equivalence partitioning over raw path classes) — plus dominating rule 1 (never
assert a fact you have not run the check that establishes; verify before you
assert, this workspace's most damaging recurring failure), dominating rule 2 (the
collapse test — the load-bearing decision stated in one honest sentence, its
hardest question answered with a citation), and dominating rule 3 / the Phase A
goal (an **honest** deterministic floor; Phase A is the build's test bed, so a
prose statement that mis-describes the mechanism the implementer builds poisons
the foundation the rest of the build reads).

---

## What the change is (the diff against `2480772`)

Two edits, both small:

1. **Step 13 prose — the round-12 Moderate fix (`:2150-2153`).** The parenthetical
   that named the probe changed from
   > `we<0x1e>ird.txt` co-changing with a partner and records it as the one path
   > `we<0x1e>ird.txt`, not a fabricated pair

   to
   > `probe:24_git_numstat_z` plants `we<0x1e>ird.txt` and records it as the one
   > whole path `we<0x1e>ird.txt`, not split into a fabricated pair; `T-13-1`
   > exercises that same path co-changing with the fixture's partner

   i.e. the co-change claim is moved off the probe (which plants the `0x1e` path as
   a **solo** add) and onto `T-13-1` (whose fixture plants it co-changing).

2. **Step 13 prose + probe — a new truncated-rename malformed class (`:2156-2160`,
   probe L91-95).** A third class is added to the malformed-record catalogue —
   "a rename marker missing its two following identity fields (a truncated
   stream)" — and the probe's reference parser gets a matching bounds guard:
   ```js
   if (path.length === 0) {                                       // rename: positional old/new
     if (fields[i + 1] !== undefined && fields[i + 2] !== undefined) cur.paths.push(fields[i + 1], fields[i + 2]);
     else if (cur) cur.bad = true;                                // truncated rename -> guard, never guessed
     i += 3;
   } else { cur.paths.push(path); i += 1; }
   ```

The command, the NUL split, the structural header detection, and positional rename
consumption are all **unchanged** — this is not a re-derivation of the parse, it is
a prose-accuracy fix plus a two-line defensive guard.

---

## The diff's own claims, re-executed

I did not accept the fix's prose. I ran the probe and read the fixture spec.

**Claim 1 — the probe plants the `0x1e` path as a solo add and records it whole.**
Ran `node docs/plans/plan-phase-a.probes/24_git_numstat_z.mjs`:
```
raw under -z (quotePath default ON): fields == readdir keys: true
  back\x5cslash.txt  caf\xe9.txt  ne\x0awl.txt  ta\x09b.txt  we\x1eird.txt
0x1e-in-path 'we\x1eird.txt': ids=1 [we\x1eird.txt]
rename oldname.txt->newname.txt: ids=2 [newname.txt, oldname.txt]
literal 'a => b.txt' (plain add): ids=1 [a => b.txt]
binary: [bin.dat]
```
The probe's `RAW_rs` commit (L43) is a lone `git commit` of `we\x1eird.txt` — solo,
no partner — and the parse yields the one whole path (`ids=1`). So the round-12
finding was factually correct, and the new prose ("plants … and records it as the
one whole path … not split into a fabricated pair") states exactly and only what
the probe proves. **The false "co-changing with a partner" clause is removed, not
softened.** Confirmed against executed output.

**Claim 2 — `T-13-1` exercises the `0x1e` path co-changing with the partner.** Read
the fixture spec (`:7848-7857`): the miner's `-z` path classes are planted "each
co-changing with the planted pair's partner in one commit — a non-ASCII path
(`café.txt`), a backslash path (`back\slash.txt`), a tab path (`ta<TAB>b.txt`), a
newline path (`ne<LF>wl.txt`), and a **Record-Separator path** (`we<0x1e>ird.txt`
…)". The relocated claim is therefore **true where it now sits** — round 12's
defect was genuinely corrected, not merely moved to a second false location. The
`T-13-1` "Fails when" (`:7877-7882`) independently asserts the `0x1e` path must
appear "under its exact raw `readdir` key," must not "lose its co-change with the
partner," and must not be "cut by the record framing into a fabricated pair." The
prose is now consistent with the fixture.

**Claim 3 — the truncated-rename guard is sound and the golden is unchanged.** I
traced the guard against the NUL field model. Under `-z --numstat` a rename emits
`<added>\t<deleted>\t\0<old>\0<new>\0`; split on NUL the marker field is
`<added>\t<deleted>\t` (empty path → rename branch), then `fields[i+1]=<old>`,
`fields[i+2]=<new>`. A stream cut at end-of-record leaves `fields[i+1]` and/or
`fields[i+2]` `undefined` (the split always appends a trailing element at
`buf.length`, so the tail is a `''` field, never an out-of-range `<old>`), so the
`undefined` test fires and routes the record to the `bad` set with `i += 3`
terminating the loop. The normal rename (`REN1`, both fields present) is untouched,
so the golden output is unchanged — confirmed by the runner: `ok 24_git_numstat_z`
/ "all probes match their recorded expectations." The guard mirrors the existing
`parts.length < 3` guard (`bad` flag → `miner_unparsed_numstat`), so it introduces
no new downstream contract.

**Verdict on the diff itself: the two edits are correct.** The round-12 Moderate is
closed at the accuracy level round 12 demanded, and the guard is a faithful,
golden-preserving addition.

---

## Collapse attacks on the load-bearing decision (all held)

The load-bearing decision remains the NUL-driven `-z` parse. Round 12 attacked it
with a filename byte-identical to a `%x1e`+40-hex header and multi/empty-commit
streams and could not break it. I re-attacked the surfaces the round-12 diff
touches:

- **A rename source or target that is itself a `0x1e`-bearing path.** Positional
  consumption (`fields[i+1]`, `fields[i+2]`) never runs `isHeader` on a rename
  identity, so a rename to/from `we<0x1e>ird.txt` cannot be re-split or mistaken
  for a header. Held. (The probe plants the `0x1e` path only as a plain add and a
  rename only over ASCII names, so this specific composite is reasoned, not
  planted — but the positional rule makes the byte content of a rename identity
  irrelevant to framing, which the probe's `REN1` demonstrates structurally.)
- **Truncation exactly at the marker boundary.** Buffer ending `…\t\t\0` →
  `fields[i+1]=''`, `fields[i+2]=undefined` → guarded (i+2 undefined). Buffer
  ending `…\t\t` (no trailing NUL) → marker is the last field, `fields[i+1]`
  undefined → guarded. No fabricated pair, no crash, no infinite loop. Held.
- **A rename marker followed by the next commit's header (format-drift, not
  truncation).** Here `fields[i+1]` (the `\x1e`+40-hex header) and `fields[i+2]`
  (the next `%at`) are both defined, so the guard passes them through as "old/new
  paths." This is **not** caught by the truncated-rename guard — and the prose does
  not claim it is: the parenthetical scopes the new class to "a truncated stream,"
  and the broader "future git output-format drift" is the umbrella. Because real
  git always emits both identities, this composite is unreachable from a
  successful `git log`; I note it only to record that the guard is scoped to EOF
  truncation, which matches the prose. No overclaim, so no collapse.

The parse does not collapse. The round-12 fix does not weaken it.

---

## New findings

### Finding 1 — Moderate. Step 13's Gate-3 "The decision" still states the abandoned mechanism: "Stream `git log` line-by-line" (`:2189`)

**What.** Step 13's collapse-test block states the load-bearing decision in one
line (`:2188-2191`):
> **The decision.** Stream `git log` line-by-line; hygiene as hard filters …

but the step's own "What changes" body (`:2123-2160`) builds a **NUL-delimited
stream** parse: "`-z` … is the load-bearing choice" (`:2127`), "the parser splits
the stream on NUL and on no in-path byte" (`:2144`). "Line-by-line" is not a loose
paraphrase of the NUL parse — it is the **exact technique the round 6–11 saga
abandoned**, and it is falsified by the step's own fixtures: `ne<LF>wl.txt` (a path
containing a newline) is planted in both the probe (L41) and `T-13-1` (`:7851`)
precisely because a line-split parser would cut it. The plan's crisp one-line
statement of its load-bearing decision therefore asserts the **opposite** of the
mechanism it specifies, and one that the step proves broken.

**Why this is the collapse test's business.** Dominating rule 2 requires the
load-bearing decision to be stated honestly in one sentence — "if the only
sentence you can write describes the mechanism, cut it," and by the same standard a
sentence that describes the *wrong, abandoned* mechanism is worse than filler: an
implementer reading Gate-3 "The decision" as the contract (the `/expert-implement`
skill reads the step to build it) is handed a false premise. It is the identical
**class** as the round-12 Moderate — a dominating-rule-1 accuracy defect about the
mechanism — but more central, because it sits in the decision statement itself
rather than an evidentiary parenthetical.

**Verification.** Executed: `grep -n "line-by-line" docs/plans/plan-phase-a.md`
returns `:2189` (this line) and `:2290` (a `packed-refs` scan, correctly
line-oriented — unrelated). `git show 2480772:…/plan-phase-a.md | grep line-by-line`
shows `:2187` — the defect is **pre-existing**, present at the review baseline and
**not introduced by the round-12 diff**; it survived the `-z` switch (rounds
10–11) and rounds 10, 11, and 12 because the "What changes" body was rewritten for
`-z` while this Gate-3 summary clause was not. I flag it here because a round-13
collapse-hunt "hunts for new ones," and this is a live contradiction in the exact
step under confirmation. (The related Q56 *question* header still reads "read a
`--numstat` line" at `:9879`, but its disposition body correctly answers `-z`
NUL-stream, so that is the historical question, not a false decision statement — I
do not raise it as a finding.)

**Fix (root, not patch).** Restate the first clause of Gate-3 "The decision" to the
mechanism the step actually builds — e.g. "Stream `git log -z --numstat` and parse
the NUL-delimited record stream" — so the decision line matches `:2127`/`:2144` and
the newline-path fixture. One clause; the rest of the decision summary (hygiene,
corpus floor, landmine classes) is accurate and unchanged.

### Finding 2 — Minor. The new truncated-rename malformed class is specified in prose but exercised by neither the probe nor `T-13-1`

**What.** `7dff513` added "a rename marker missing its two following identity
fields (a truncated stream)" to Step 13's malformed catalogue (`:2158`) and the
matching guard to the probe (L92-93). But no fixture exercises that class:

- The probe plants no truncated-rename record; its only rename (`REN1`) has both
  identities present, so the new `else if (cur) cur.bad = true` line **never
  executes** in any probe run.
- `T-13-1`'s single synthetic malformed record is "a numstat entry missing a
  field" (`:7864-7866`) — the `parts.length < 3` class (`:2157`), a **different**
  code branch from the empty-path/missing-identity class the guard adds. `T-13-1`'s
  "Fails when" (`:7885-7887`) asserts only that record → `miner_unparsed_numstat`.

So a newly-specified defensive behaviour has neither executed evidence (probe) nor
a test assertion (`T-13-1`). This is the smaller shadow of the exact concern round
12 fixed — a Step-13 claim without backing evidence — though milder: the prose does
not claim the probe proves it (it cites Step 6, a design catalogue), and the
`miner_unparsed_numstat` *routing* is tested via the missing-field record, just not
this specific trigger.

**Why only Minor.** The scenario is essentially unreachable through the miner's own
invocation: a successful `execFile('git log …')` yields a complete buffer, and a
failed one throws before the parser sees bytes — so a genuinely truncated stream
does not reach `parseZ` in normal operation; the reachable case is format drift,
which the "(a truncated stream)" parenthetical labels slightly imprecisely. Cheap,
honest, and correctly scoped, but under dominating rule 1 a specified behaviour
that no probe runs and no fixture asserts should not sit in the plan unmarked.

**Fix (either is acceptable).** (a) Add the missing-identity rename as a second
synthetic malformed record to `T-13-1`'s data and "Fails when," so the guard the
plan specifies is actually asserted; or (b) if the class is judged unreachable and
not worth a fixture, fold it into the existing "matches none of the expected
shapes" umbrella rather than enumerating it as a distinct class, so the prose
claims no behaviour the plan does not test.

**Non-finding noted for the record.** In the probe's rename branch the *push* arm
(`… cur.paths.push(fields[i+1], fields[i+2])`) dereferences `cur` without the null
guard the *bad* arm (`else if (cur) …`) carries. This is unreachable — an empty-path
numstat entry cannot precede a header in a well-formed stream, and the probe feeds
only well-formed streams — so it manifests no defect and is not a finding; I note
the asymmetry only so a later editor does not copy the push arm into a context
where `cur` can be null.

---

## Mechanical gates (executed by me, not read from STATUS)

| Gate | Command | Result |
|---|---|---|
| Probe (direct) | `node …/24_git_numstat_z.mjs` | pass, exit 0 (output above) |
| Probe (runner, golden) | `run-plan-probes.mjs docs/plans/plan-phase-a.md` | `ok 24_git_numstat_z`; "all probes match their recorded expectations"; exit 0 |
| Derive `--check` | `derive-plan-sections.mjs --check …` | `OK: 40 steps, 13 elements, 124 test specs, 26 probes cited, regions current`; exit 0 |
| Derive `--self-check` | `derive-plan-sections.mjs --self-check` | `self-check passed: 34 checks`; exit 0 |
| Doc consistency | `python3 tools/check_docs.py` | `context-oracle doc-consistency check passed.`; exit 0 |

All green. The golden expectation for probe 24 is unchanged, confirming the guard
did not alter the parse's observable output.

---

## Verdict

**NEEDS FIXES — 1 Moderate, 1 Minor. The load-bearing decision did not collapse.**

The round-12 diff itself is correct: the co-change claim is now accurately split
between the probe (records the `0x1e` path whole) and `T-13-1` (exercises its
co-change), and the truncated-rename guard is sound and golden-preserving. The
NUL-driven `-z` parse held under fresh attack.

But a fresh reviewer hunting the step under confirmation found that Step 13's own
Gate-3 "The decision" line still states the abandoned "line-by-line" mechanism
(**Finding 1, Moderate**) — a dominating-rule-1 accuracy defect of the same class
round 12 fixed, in the more central location of the decision statement, falsified
by the step's own newline-path fixture — and that the newly-specified
truncated-rename class is asserted by no fixture (**Finding 2, Minor**). Both are
fixable at the root without touching the parse. Per the project's re-review
protocol, a Moderate finding means the seam is not yet converged: apply both fixes
at the root and re-dispatch the independent passes over the fix diff.
