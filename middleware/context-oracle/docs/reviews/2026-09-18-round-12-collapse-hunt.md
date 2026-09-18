# Round 12 — Independent collapse-hunt of the `-z` NUL parse + structural commit-header detection in `docs/plans/plan-phase-a.md`

**Date:** 2026-09-18
**Artifact under review:** the round-12 change to `docs/plans/plan-phase-a.md`,
its probe `docs/plans/plan-phase-a.probes/24_git_numstat_z.mjs`, and the probe's
`expected/24_git_numstat_z.txt`. Diffed against `45415e1` (round-10's fix), i.e.
the diff spanning `cf4e044` (round-11 reviews) and `2480772` (the round-11-finding
fix under review).
**Baseline:** `45415e1` — the round-11 probe/plan that framed each commit record
with a `%x1e` Record Separator and **split the stream on `\x1e`**, resting on the
false universal "git never emits `0x1e` inside a path or a numstat field."
Round 11's collapse-hunt (`docs/reviews/2026-09-18-round-11-collapse-hunt.md`,
S1/m1/m2) falsified that: a legal `0x1e` path byte was emitted raw under `-z`,
the split-on-RS parser cut `we<0x1e>ird.txt` into `we` and fabricated a phantom
commit `ird.txt`, silently poisoning co-change data with **no diagnostic**. The
change under review is the fix for that collapse.
**Nature:** An independent adversarial collapse-hunt under
`middleware/context-oracle/CLAUDE.md` dominating rule 2 — a fresh reviewer who
did not author this change, attacking each load-bearing decision's hardest
question and hunting for new ones. Every load-bearing git behaviour below was
executed by me in this environment (git 2.43.0 — the version §11.4 names — and
Node v22.22.2) and is pasted verbatim. The plan's prose, the probe's self-report,
and the recorded expectation were **not** accepted as evidence until I reproduced
them against the real git byte stream, and then I attacked past them.
**Standards this review evaluates against:** the changed step's own named sources
— `AD-13` (miner: an unresolved field is "recorded … never guessed"), the plan's
`miner_unparsed_numstat` contract (`:1354-1358`, `:2155-2159`), `T-13-1`'s named
technique (**equivalence partitioning over … raw path classes**, `:7865-7867`),
round-11's own fix directives (S1: kill the false claim; m2: key on record
*structure*, not a magic byte; m1: plant the RS-in-path case), dominating rule 1
(never assert a fact you have not run the check that establishes — the workspace's
most damaging recurring failure), dominating rule 2 (the collapse test: the
hardest question answered with a citation, never a hedge), and dominating rule 3 /
the Phase A goal (an **honest** deterministic floor; Phase A is the build's test
bed, so faked machinery poisons the corpus Phase B and the regression fixtures are
designed from).

---

## What the change is

Round 11 split the `-z` stream on the `%x1e` Record Separator. Round 12 abandons
that magic-byte split for a **structure-keyed** parse, exactly as round-11's m2
directed:

1. **Command unchanged (`:92`, `:2125-2126`):**
   `git log --no-merges -M -z --numstat --format=%x1e%H%x00%at%x00 <watermark>..HEAD`.
2. **Parse on NUL, not RS (`:2141-2144`, probe `parseZ` L68-95):** NUL is the only
   byte a pathname cannot hold (git forbids NUL and `/`, nothing else — `0x1e` and
   every other control byte are legal and emitted raw under `-z`), so the whole
   stream is split on NUL and on no in-path byte.
3. **Structural header detection (`:2144-2149`, probe `isHeader` L63-67):** a NUL
   field is a commit header **only** when it is exactly `\x1e` + 40 hex (`%H`); its
   `%at` is the next field. A numstat entry field always begins with its `<added>`
   count and always contains TABs, and a rename's old/new paths are **consumed
   positionally, never rescanned** — so a path that contains or begins with `0x1e`
   is never mistaken for a header nor cut mid-path.
4. **The false universal is gone.** The round-11 claim "git never emits `0x1e`
   inside a path" and the "reads a record … up to the next `\x1e`" split language
   are removed; `:2141-2143` now states the true invariant (only NUL is
   path-absent). The `miner_unparsed_numstat` guard is re-scoped to a leading field
   that is not a valid `\x1e`+40-hex header or a numstat entry lacking the
   `<added>\t<deleted>\t` shape (`:2155-2159`).
5. **The RS-in-path case is planted** in the probe (`RAW_rs`, `we\x1eird.txt`,
   L42-43) and in `T-13-1`'s `miner-hygiene` fixture (`:7849-7855`, `:7874-7879`),
   with matching Fails-when clauses; `Q56`/`:9887-9889` are rewritten to match.

---

## Verification I performed, and what holds

I re-ran the probe and reproduced the round-12 behaviour, then attacked the new
load-bearing decision — **"parse on NUL and detect headers structurally, so a
legal `0x1e` path byte is parsed correctly, never fabricated"** — with the
hardest inputs I could construct. It holds.

**Probe reproduces, byte-identical to its recorded expectation:**

```
$ node docs/plans/plan-phase-a.probes/24_git_numstat_z.mjs
raw under -z (quotePath default ON): fields == readdir keys: true
  back\x5cslash.txt  caf\xe9.txt  ne\x0awl.txt  ta\x09b.txt  we\x1eird.txt
0x1e-in-path 'we\x1eird.txt': ids=1 [we\x1eird.txt]
rename oldname.txt->newname.txt: ids=2 [newname.txt, oldname.txt]
literal 'a => b.txt' (plain add): ids=1 [a => b.txt]
binary: [bin.dat]
   → diff against expected/24_git_numstat_z.txt: (no diff)
```

**The real byte stream matches the parser's structural model.** Dumping the raw
`-z` output for the RS-path commit (control bytes marked):

```
<RS>93164c…770d<NUL>1789743018<NUL><NUL><LF>1<TAB>0<TAB>we<RS>ird.txt<NUL>
```

Splitting on NUL yields fields `[<RS>+40hex]`, `[1789743018]`, `[]`,
`[<LF>1\t0\twe<RS>ird.txt]`. `isHeader` accepts field 0 (RS+40hex); the numstat
field starts with `<LF>1`, contains TABs, and is **not** 41 bytes of RS+40hex, so
it is never taken for a header — the embedded `0x1e` rides along inside the path.
The round-11 corruption is genuinely dissolved.

**Round 11's exact falsifying case now parses correctly.** `we<0x1e>ird.txt` is
recorded whole as one path (`ids=1 [we\x1eird.txt]`), not cut into `we` + a
phantom `ird.txt` commit.

**I attacked the "path never mistaken for a header" claim at its hardest.** I
planted a filename that is **byte-identical to a commit header** — `0x1e` followed
by 40 hex characters — as a plain add, as a rename *source*, and as a rename
*target*, then ran the miner's real command over the multi-commit stream through
the probe's `parseZ` verbatim:

```
commits parsed: 5 (rev-list: 5)
  cbcd255 bad=false paths=[src.txt | \x1e0123456789abcdef0123456789abcdef01234567]
  5b53357 bad=false paths=[src.txt]
  ecb4f31 bad=false paths=[\x1e0123456789abcdef0123456789abcdef01234567 | renamed_from_hex.txt]
  817fab3 bad=false paths=[\x1e0123456789abcdef0123456789abcdef01234567]
  c068329 bad=false paths=[anchor.txt]
```

5 commits parsed = `rev-list` count; **no phantom headers, no desync.** The
header-shaped filename is recorded whole as a plain add, and consumed correctly as
both rename identities — positional consumption means even a rename identity
byte-identical to a header is never passed through `isHeader`. This is the nastiest
input the structural model faces, and it survives.

**Multi-commit boundaries and empty commits hold — the real miner scenario.** The
probe only ever feeds `parseZ` **single-commit** input (`git log … -1 --grep`) and
takes `[0]`, but the production miner reads a `<watermark>..HEAD` range, so the
multi-commit header-detection loop is the load-bearing path. I exercised it
directly on a real range with normal, `--allow-empty`, and rename commits:

```
num commits parsed: 6   rev-list count (all commits): 6
  6772a52 paths=[we\x1eird.txt]     ← RS path whole, at end of stream
  7d7e0c6 paths=[]                  ← empty commit: no paths, no desync
  b9e0d27 paths=[b.txt, c.txt]      ← rename mid-stream: both identities
  a24d480 paths=[a.txt]
  8a9a208 paths=[]                  ← empty commit
  c938b75 paths=[a.txt, b.txt]      ← genuine co-change
```

Every commit is accounted for; empty commits (the `--no-merges` miner still sees
`--allow-empty` non-merge commits) produce empty path sets without shifting the
cursor. The `field[2]`-empty / numstat-at-`field[3]` alignment and the leading-`\n`
strip hold across all shapes.

**Round-11 S1 and m2 are genuinely fixed, and I could not re-collapse them.** The
false universal is removed (the only residual "never emits" at `:7863` is a *true*
statement about the synthetic malformed record). Parsing keys on record structure,
not on a byte the data can contain. This is real, verified progress.

---

## M1 (Moderate) — the plan claims the executed probe demonstrates a co-change it does not plant

**The finding.** At `:2150-2152` the plan's load-bearing rationale states:

> "(`probe:24_git_numstat_z` plants `we<0x1e>ird.txt` **co-changing with a
> partner** and records it as the one path `we<0x1e>ird.txt`, not a fabricated
> pair)."

The probe does **not** plant `we<0x1e>ird.txt` co-changing with a partner. Its
`RAW_rs` commit (probe L42-43) is a **solo single-file commit**:

```js
wr('we\x1eird.txt', 0x4a); git('add', '-A'); git('commit', '-q', '-m', 'RAW_rs');
```

Executed confirmation — the `RAW_rs` commit touches exactly one file (line-mode
`--numstat`, which C-quotes the control byte, shown to make the single entry
unambiguous):

```
=== files touched by RAW_rs ===
COMMIT RAW_rs
1<TAB>0<TAB>"we\036ird.txt"       ← one entry; `\036` = octal 0x1e
```

There is no partner file in that commit and no co-change. The probe proves the
load-bearing property it is cited for — the RS path is recorded as **one whole
path, not a fabricated pair** (`0x1e-in-path 'we\x1eird.txt': ids=1
[we\x1eird.txt]`) — but the "**co-changing with a partner**" descriptor is a
property of a *different* artifact: the `T-13-1` `miner-hygiene` fixture, where
each special-byte class is planted "co-changing with the planted pair's partner in
one commit" (`:7847`). The plan conflates the two.

**This is not a nitpick under this project's own standards:**

1. **It is a dominating-rule-1 violation in miniature — the workspace's named most
   damaging failure.** The plan asserts, in its rationale, a fact about what an
   *executed* artifact demonstrates, and running the probe (and `git log` on its
   commit) shows the assertion is false. "Verify before you assert" is the exact
   standing rule; the probe was run, but the prose describes a probe that co-changes
   the RS path, and that probe does not exist.
2. **It is internally inconsistent** with the plan's two *other* references to the
   same probe, which are accurate: the `:7149-7161` Evidence block (which I checked
   line-for-line against the real probe output — it matches) says the probe shows
   "the `0x1e` path stays one field (not a fabricated pair)"; `:9889` says "the
   probe plants `we<0x1e>ird.txt` and records it whole." Only `:2151` adds the
   unfounded "co-changing with a partner."
3. **It slightly overstates the evidence in the reader's favour** — the precise
   drift OL-C7's writing discipline and the collapse-log guard against. A future
   agent citing `:2150-2152` would believe the probe proves co-change *survival*
   for a pathological path; it does not. (The property is real and is covered — by
   `T-13-1`, not the probe.)

**Severity: Moderate, not a collapse.** The load-bearing decision itself does not
collapse — the mechanism is correct and I verified it against the hardest inputs
above. The defect is an inaccurate evidence attribution in the supporting prose.
Per the standing rule (apply **all** findings, no prioritized subset) it must be
fixed before this ships.

**The fix (author owns the design, OL-11).** Either (a) align the prose to the
executed artifact — drop "co-changing with a partner", matching the accurate
phrasing already at `:9889` ("plants `we<0x1e>ird.txt` and records it whole") —
or (b) make the probe actually plant the RS path co-changing with a partner and
assert the pair, so the prose becomes true. (a) is the cleaner fix: the probe's
job is to isolate the raw-byte / one-field / not-a-pair property on a single
commit, and the co-change survival is `T-13-1`'s job over `cochange_pairs`; a
solo commit is the right probe design, so the prose should match it rather than
the probe being loaded with co-change noise.

---

## Decisions I attacked and could not collapse

Recorded so the next round need not re-litigate them:

- **Parse on NUL; only NUL is path-absent under `-z`** — reproduced against the
  real byte stream; sound. (`git forbids NUL and /`, `:2141-2143`.)
- **Structural header detection (`\x1e`+40hex), path never mistaken for a header**
  — attacked with a filename byte-identical to a header shape, as plain add and as
  both rename identities; parsed correctly, no phantom header, no desync. This is
  round-11 m2 satisfied.
- **Round-11 S1 dissolved** — `we<0x1e>ird.txt` is recorded whole, not cut into
  `we` + phantom `ird.txt`; the silent co-change fabrication is gone.
- **Multi-commit / empty-commit / rename-mid-stream alignment** — executed over a
  real range; 6 commits parsed = `rev-list`, empties yield no paths without
  desync, renames expand to both identities.
- **Probe expectation fidelity** — the `:7149-7161` Evidence block matches the
  live probe output byte-for-byte; `expected/24_git_numstat_z.txt` matches the
  run with no diff.
- **No stale round-11 residue** — the false "git never emits `0x1e`" universal and
  the "split on `\x1e` / up to the next `\x1e`" language are removed; the only
  "never emits" left (`:7863`) is a true statement about the synthetic malformed
  record.

---

## Note for the eventual Step-13 implementation (not a finding against these files)

The probe's `parseZ` consumes a rename positionally with no bounds guard —
`cur.paths.push(fields[i + 1], fields[i + 2])` (probe L91). On well-formed `-z`
output a rename is always followed by both identities, so this never reaches
`undefined` in the probe (verified), and it is not a defect in the reviewed
artifacts. But the production miner's parser (Step 13, not in this diff) should
guard a rename whose old/new fields run off the end of a truncated stream and
route it to `miner_unparsed_numstat` rather than pushing `undefined` — consistent
with the `never-guessed` contract the plan already states for the malformed case
(`:2155-2159`). Flagging so the implementer carries it forward.

---

## Verdict

**NEEDS FIXES — one Moderate finding (M1); no collapse.**

Round 12 correctly resolves round-11's collapse: the `-z` parser now splits on
NUL (the only path-absent byte) and detects commit headers by structure
(`\x1e`+40hex), so a legal `0x1e` path byte — the byte that silently fabricated
co-change data in round 11 — is now parsed whole. I falsified round 11's exact
case, attacked the "path never mistaken for a header" claim with a filename
byte-identical to a header (as add and as both rename identities), and exercised
the multi-commit/empty-commit path the production miner depends on; the mechanism
held on every input. Round-11 S1, m1, and m2 are substantively addressed.

The one defect is in the supporting prose, not the mechanism: `:2150-2152` states
the executed probe "plants `we<0x1e>ird.txt` co-changing with a partner," which it
does not — the probe plants a solo commit, and the co-change property belongs to
`T-13-1`, not the probe. It is a dominating-rule-1 accuracy defect and is
internally inconsistent with the plan's two other, accurate references to the same
probe (`:7161`, `:9889`). Fix it by aligning the prose to the probe (drop
"co-changing with a partner") or by making the probe co-change the RS path.

Per the standing rule, when a review surfaces findings, **all** are applied — no
prioritized subset.
