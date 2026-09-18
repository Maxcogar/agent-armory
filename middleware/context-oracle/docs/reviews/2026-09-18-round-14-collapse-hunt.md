# Round 14 — Independent collapse-hunt of the round-13-finding fix in `docs/plans/plan-phase-a.md` (+ its probe)

**Date:** 2026-09-18
**Artifact under review:** the round-13-finding fix — commit `67fc7cf`
("fix round-13 findings — stale Gate-3 clause + truncated-rename test") — as it
lands on two files:
`docs/plans/plan-phase-a.md` (Step 13's Gate-3 "The decision" clause; `T-13-1`)
and its probe `docs/plans/plan-phase-a.probes/24_git_numstat_z.mjs`. Diffed
against `7dff513` (the round-12 M1 fix, the last commit before this session's
round-13 work). The material change is `67fc7cf`; the intervening `a4c9c95` and
`5cde93f` add only the round-13 review files.
**Baseline:** `7dff513` — the NUL-driven `-z` parse that rounds 11, 12, and 13
each verified sound (no collapse in any round). Round 13's collapse-hunt
(`docs/reviews/2026-09-18-round-13-collapse-hunt.md`) could not collapse the parse
and returned a single Moderate (Step 13's Gate-3 "The decision" clause still read
"Stream `git log` **line-by-line**", the exact technique the `-z` rewrite
abandoned) plus a Minor (the truncated-rename malformed class was specified in
prose but exercised by no fixture) and a recorded non-finding (the probe's rename
push arm dereferenced `cur` without the null guard its `bad` arm carried).
`67fc7cf` is the fix for those items.
**Nature:** An independent adversarial collapse-hunt under
`middleware/context-oracle/CLAUDE.md` dominating rule 2 — a fresh reviewer who did
not author this change, attacking each load-bearing decision's hardest question
and hunting for new ones. Every load-bearing behaviour below was **executed by me**
in this environment (git 2.43.0 — the version §11.4 names — and Node v22.22.2) and
is reported from what I observed, not from the plan's prose, the probe's
self-report, the prior reviews, or `docs/STATUS.md`, none of which I accepted as
evidence until I reproduced them.
**Standards this review evaluates against:** the changed step's own named sources
— `AD-13` (an unresolved field is "recorded … never guessed"), the
`miner_unparsed_numstat` contract, `T-13-1`'s named data and technique — plus
dominating rule 1 (never assert a fact you have not run the check that
establishes it; verify before you assert), dominating rule 2 (the collapse test —
the load-bearing decision stated in one honest sentence, its hardest question
answered by citation), and dominating rule 3 / the Phase A goal (an **honest**
deterministic floor; Phase A is the build's test bed, so a decision statement that
mis-describes the mechanism the implementer builds poisons the foundation the rest
of the build reads).

---

## What the change is (the diff against `7dff513`)

Three edits, all small:

1. **Step 13 Gate-3 "The decision" — the round-13 Moderate fix (`:2189-2192`).**
   The first clause changed from
   > Stream `git log` **line-by-line**; hygiene as hard filters …

   to
   > Stream `git log` under `-z` and parse it on NUL (the only byte a pathname
   > cannot hold), commit records marked by a `%x1e` header; hygiene as hard
   > filters …

   The rest of the decision summary (hygiene, corpus floor, landmine classes) is
   unchanged.

2. **`T-13-1` — the round-13 Minor fix (`:7864-7870`, `:7889-7892`).** The
   malformed-record clause changed from **one** synthetic malformed `-z` record
   (a numstat entry missing a field) to **two** — adding a **truncated rename**
   ("a rename marker `<added>\t<deleted>\t` with an empty path but its two identity
   fields missing at end of stream") — with the matching "Fails when" arm widened
   from "the synthetic malformed `-z` record" to "either synthetic malformed `-z`
   record (the field-short entry or the truncated rename) … guessed into a pair
   **or a partial identity**".

3. **Probe — the round-13 non-finding fix (L85).** One line added inside the
   field loop, before numstat-entry parsing:
   ```js
   if (!cur) { i += 1; continue; }   // entry before any header (unreachable, well-formed)
   ```

The command, the NUL split, the structural header detection, and positional rename
consumption are all **unchanged**. This is not a re-derivation of the parse; it is
a decision-statement accuracy fix, a test-data addition, and a one-line defensive
guard.

---

## The diff's own claims, re-executed

I did not accept the fix's prose. I ran the probe, dumped raw git bytes, and read
the fixtures.

**Claim 1 — the new Gate-3 clause describes the mechanism the step actually
builds.** The step body (`:2123-2160`) builds a NUL-delimited stream parse: "`-z`
… is the load-bearing choice" (`:2127`); "NUL is the *only* byte a pathname cannot
contain … so the parser splits the stream on NUL and on no in-path byte"
(`:2141-2144`); "Each commit record is prefixed with a Record Separator (`%x1e`)"
(`:2144-2145`). The new clause — "Stream `git log` under `-z` and parse it on NUL
(the only byte a pathname cannot hold), commit records marked by a `%x1e` header"
— now states exactly that, and the abandoned "line-by-line" wording is **removed,
not softened**. I swept every occurrence of the old phrasing:
`grep -n "line-by-line\|line mode\|line-mode\|line-oriented" plan-phase-a.md`
returns `:2135`, `:2139`, `:7860` (all historical *contrasts* — what line mode
*would* do to `old => new` / `a => b.txt`, explaining why `-z` was chosen) and
`:2291` (the `packed-refs` text scan, a genuinely line-based file, unrelated). No
stale *decision statement* remains. The round-13 Moderate is closed at the root.

**Claim 2 — real git 2.43.0 emits the byte structure the clause and step assert.**
I built a repo with an anchor, a rename, and a `we<0x1e>ird.txt` add, and dumped
`git log --no-merges -M -z --numstat --format=%x1e%H%x00%at%x00 | od -c`. Observed,
verbatim: a header `\x1e` + 40 hex + `\0`; the `%at` field + `\0`; an empty
separator field (`\0`); a leading `\n` before the first numstat entry; the rename
as `0\t0\t\0` (empty-path marker) then **two separate NUL fields**
`oldname.txt\0newname.txt\0`; and `1\t0\twe\x1eird.txt\0` — the `0x1e` byte emitted
**raw, mid-path**, with the field beginning at its `<added>` count (`1`), not the
path. This is exactly the model at `:2144-2156` and exactly what the probe's
`parseZ` consumes. The load-bearing decision is grounded in observed git behaviour,
not asserted from memory.

**Claim 3 — the probe records the classes whole, and the `cur` guard changed no
observable output.** `node …/24_git_numstat_z.mjs` (exit 0):
```
raw under -z (quotePath default ON): fields == readdir keys: true
  back\x5cslash.txt  caf\xe9.txt  ne\x0awl.txt  ta\x09b.txt  we\x1eird.txt
0x1e-in-path 'we\x1eird.txt': ids=1 [we\x1eird.txt]
rename oldname.txt->newname.txt: ids=2 [newname.txt, oldname.txt]
literal 'a => b.txt' (plain add): ids=1 [a => b.txt]
binary: [bin.dat]
```
I then ran the **pre-change** probe (`git show 7dff513:…/24_git_numstat_z.mjs`) and
the current probe and `diff`ed their stdout: **identical**. The added
`if (!cur) { i += 1; continue; }` therefore alters no planted case — it only makes
`cur` provably non-null past L85, so the round-13 non-finding (the rename push arm
`cur.paths.push(fields[i+1], fields[i+2])` dereferencing `cur` unguarded while the
`bad` arm carried `else if (cur)`) can no longer bite even if a later editor moves
that arm; the two now-redundant `if (cur)` inner tests are harmless. The probe's
recorded golden is unchanged, confirmed by the runner (below): the guard is
purely defensive and golden-preserving.

**Claim 4 — the truncated-rename class is now exercised by `T-13-1`, and the guard
is sound.** Under `-z --numstat` a rename splits on NUL to the marker field
`<added>\t<deleted>\t` (empty path → rename branch), then `fields[i+1]=<old>`,
`fields[i+2]=<new>`. A stream cut at end-of-record leaves `fields[i+1]` and/or
`fields[i+2]` `undefined`; the guard's `undefined` test fires, routes the record to
the `bad` set (→ `miner_unparsed_numstat`), and `i += 3` terminates the loop — no
fabricated pair, no partial identity, no crash. `T-13-1`'s data now names this as
one of two synthetic malformed records and its "Fails when" now fails the build if
**either** record "is guessed into a pair or a partial identity, silently dropped,
or crashes the parse". The round-13 Minor is closed via the fix round 13 itself
prescribed (add it to `T-13-1`'s data + "Fails when").

**Verdict on the diff itself: all three edits are correct and complete.** The
Moderate is fixed at the root, the Minor via the endorsed path, and the non-finding
defensively closed without disturbing the parse.

---

## Collapse attacks on the load-bearing decision (all held)

The load-bearing decision remains the NUL-driven `-z` parse. I re-attacked the
surfaces this diff touches, and the parse's framing:

- **A path containing `0x1e` mid-field.** Verified twice: in my raw `od` dump the
  field `1\t0\twe\x1eird.txt` begins with its `<added>` count, so `isHeader`
  (field[0] === `0x1e`) is false; the probe records it as the one whole path. A
  `0x1e` byte inside a path never cuts a record. Held.
- **A rename source or target that is itself a `0x1e`-bearing (or header-shaped)
  path.** Positional consumption (`fields[i+1]`, `fields[i+2]`) never runs
  `isHeader` on a rename identity, so a rename to/from such a path cannot be
  re-split or mistaken for a header. (Rounds 11–12 already planted header-shaped
  filenames as add, rename source, and rename target; the positional rule makes the
  byte content of a rename identity irrelevant to framing.) Held.
- **Truncation exactly at the marker boundary.** Buffer ending `…\t\t\0` →
  `fields[i+1]=''`, `fields[i+2]=undefined` → guarded. Buffer ending `…\t\t` (no
  trailing NUL) → marker is the last field, `fields[i+1]` undefined → guarded. No
  fabricated pair, no crash, no infinite loop. Held.
- **A rename marker followed by the next commit's header (format drift, not EOF
  truncation).** Here `fields[i+1]` (the `\x1e`+40-hex header) and `fields[i+2]`
  (its `%at`) are both defined, so the guard passes them through as "old/new".
  This is **not** caught by the truncated-rename guard — and the prose does not
  claim it is: the new class is scoped to "a truncated stream … at end of stream",
  with "future git output-format drift" the umbrella. Because real git 2.43.0
  always emits both rename identities (verified in my `od` dump), this composite is
  unreachable from a successful `git log`. No overclaim, so no collapse.

The parse does not collapse. The round-13 fix does not weaken it.

---

## New findings

**None at Moderate-or-above. None at Minor.** A fresh hunt of the exact step under
confirmation found no live contradiction, no unbacked evidentiary claim, and no
stale mechanism statement remaining after the fix.

---

## Considered and dismissed (recorded so the next round need not re-derive it)

**`T-13-1` asserts feeding two synthetic malformed records to "the miner's parser"
while declaring "no doubles / real `git log`", and Step 13's `provides` names only
`mineCochange`.** I checked whether this is incoherent, because real git 2.43.0
emits **neither** malformed record — I confirmed it always emits
`<added>\t<deleted>\t<path>` for every entry and both identities for every rename —
so neither record can reach the parser through a real `git log`. It is **not** a
finding, for three independently sufficient reasons:

1. The plan's own wording resolves it: "**The generator** also feeds the miner's
   parser two synthetic malformed `-z` records" (`:7864`) states that the fixture
   generator supplies crafted bytes **directly** to the parser. Feeding a real
   parser test input is not a test *double* (nothing real is replaced by a fake),
   so "no doubles" is not contradicted; and `provides` lists a step's cross-step
   dependency surface, not the symbols a same-package test may import. A competent
   implementer exports the parse helper and feeds it the two records — the standard
   resolution, which the "feeds the miner's parser" phrasing presupposes.
2. It is **pre-existing and unchanged in nature.** The field-short synthetic record
   carried the identical property at the `7dff513` baseline (real git emits no
   2-field numstat entry either); this diff pluralised one such record to two, it
   did not introduce the modality.
3. Round 13 **examined this exact area** and prescribed adding the truncated rename
   to `T-13-1`'s data (its Finding 2, option a); `67fc7cf` implements precisely
   that. Re-opening it here would contradict an accepted disposition without new
   evidence.

I record it only so a future reviewer sees the seam was traced, not overlooked: if
the implementer ever finds the parser genuinely un-invokable in isolation, the
right move is to export it (or split the two malformed-record assertions into a
parser unit test) — not to weaken the `miner_unparsed_numstat` contract.

---

## Mechanical gates (executed by me, not read from STATUS)

| Gate | Command | Result |
|---|---|---|
| Probe (direct) | `node …/24_git_numstat_z.mjs` | pass, exit 0 (output above) |
| Probe (runner, golden) | `run-plan-probes.mjs docs/plans/plan-phase-a.md` | `ok 24_git_numstat_z`; "all probes match their recorded expectations"; exit 0 |
| Probe (guard is golden-preserving) | `diff` of pre-change vs current probe stdout | identical |
| Raw git model | `git log … -z --numstat --format=%x1e%H%x00%at%x00 \| od -c` | header/`%at`/empty-sep/leading-`\n`/two-NUL-rename/raw-`0x1e` all as the plan asserts |
| Derive `--check` | `derive-plan-sections.mjs --check …` | `OK: 40 steps, 13 elements, 124 test specs, 26 probes cited, regions current`; exit 0 |
| Derive `--self-check` | `derive-plan-sections.mjs --self-check` | `self-check passed: 34 checks`; exit 0 |
| Doc consistency | `python3 tools/check_docs.py` | `context-oracle doc-consistency check passed.`; exit 0 |

All green. The golden expectation for probe 24 is unchanged, confirming the guard
did not alter the parse's observable output.

---

## Verdict

**PASS. The load-bearing decision did not collapse.**

The round-13 fix is correct and complete at the root: the Gate-3 "The decision"
clause now states the `-z` NUL-stream parse the step actually builds (the abandoned
"line-by-line" statement is gone, and no stale decision statement remains
elsewhere); the truncated-rename malformed class is now exercised in `T-13-1`'s
data and "Fails when" via the path round 13 prescribed; and the probe's `cur`
deref is guarded without changing any observable output. The NUL-driven `-z` parse
held under fresh attack — its byte model verified against real git 2.43.0, not
prose — and no new finding surfaced at Minor or above. All mechanical gates I ran
are green. Per the project's re-review protocol, a confirming pass with no
Moderate-or-above finding means the seam is converged; the plan is ready to serve
as the build contract.
