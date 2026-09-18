# Round 11 — Independent collapse-hunt of the `-z` numstat parse + Record-Separator framing in `docs/plans/plan-phase-a.md`

**Date:** 2026-09-18
**Artifact under review:** the round-11 change to `docs/plans/plan-phase-a.md`
plus the probe it adds and the four it deletes —
adds `docs/plans/plan-phase-a.probes/24_git_numstat_z.mjs` (+ its
`expected/24_git_numstat_z.txt`); deletes `24_git_numstat_rename.sh`,
`27_git_numstat_quotepath.sh`, `28_git_numstat_cunquote.mjs`,
`29_git_numstat_tokenize.mjs` (and their `expected/…`). Diffed against
`e9a3877`.
**Baseline:** `e9a3877` (round-9's quote-aware line-mode tokenizer that ran
`git -c core.quotePath=false log --numstat -M` and C-unquoted residually-quoted
fields). The change under review replaces that whole mechanism.
**Nature:** An independent adversarial collapse-hunt under
`middleware/context-oracle/CLAUDE.md` dominating rule 2 — a fresh reviewer who
did not author this change, attacking each load-bearing decision's hardest
question and hunting for new ones. Every load-bearing git behaviour below was
executed by me in this environment (git 2.43.0 — the version §11.4 names — and
Node v22.22.2) and is pasted verbatim. The plan's prose and the recorded probe
expectation were **not** accepted as evidence until I reproduced them, and then
I attacked past them.
**Standards this review evaluates against:** the changed step's own named
sources — `AD-13` (miner: an unresolved field is "recorded … never guessed"),
the plan's own `miner_unparsed_numstat` contract (a record it "cannot parse into
the expected shape" is diagnosed, not guessed, `:1353–1358`, `:2145–2150`),
`T-13-1`'s own named technique (**equivalence partitioning over … raw path
classes**, `:7858–7861` after change), dominating rule 1 (never assert a fact
you have not run the check that establishes), dominating rule 2 (the collapse
test: the step-2 hardest question must be answered with a citation, "I can't"
means rebuild — never ship with a hedge), dominating rule 3 and the Phase A goal
(an **honest** deterministic floor that "measures how little it catches" and
"never fake completeness dressed to look like a working product"; Phase A is the
build's test bed, so faked machinery poisons the corpus Phase B and the
regression fixtures are designed from).

---

## What the change is

Round 9/10 parsed `--numstat` in **line mode** with `core.quotePath=false` and a
quote-aware tokenizer that C-unquoted residually-quoted fields and split renames
on an out-of-quote ` => `. Round 11 abandons all of that for **machine mode**:

1. **Command (`:92`, `:2124–2126`):**
   `git log --no-merges -M -z --numstat --format=%x1e%H%x00%at%x00 <watermark>..HEAD`.
2. **Load-bearing claims about `-z` (`:2127–2140`):** `-z` emits every path
   field as **raw bytes** (no `core.quotePath` C-quoting of any byte), so a field
   equals the indexer's `readdir` key directly; and a **rename is two separate
   NUL-delimited fields** (`<added>\t<deleted>\t` with an empty path, then
   `<old>\0<new>\0`), so a real file whose name contains ` => ` is one field and
   is never confused with a rename; binary entries are `-\t-\t<path>`.
3. **Framing decision (`:2141–2144`, `:9868`):** because the `%x00` `--format`
   header and the `-z` numstat both spend NUL, each commit record is prefixed
   with a **Record Separator** `%x1e` (byte `0x1e`), **"which git never emits
   inside a path or a numstat field"**; the parser "reads a record … up to the
   next `\x1e` or end of stream."
4. **`miner_unparsed_numstat` re-scoped (`:1353–1358`, `:2145–2150`):** now only
   a "malformed stream, e.g. a future git output-format drift" — the plan states
   that under `-z` "C-quoting and the `old => new` ambiguity never arise; this
   diagnostic is the defensive guard, not an expected case."
5. **`probe:24_git_numstat_z` (new)**, `T-13-1` Data/Fails-when, and `Q56` are
   rewritten to match; the four line-mode probes are deleted.

---

## Verification I performed, and what holds

I re-ran the added probe and reproduced every `-z` behaviour claim independently.

```
$ node docs/plans/plan-phase-a.probes/24_git_numstat_z.mjs
raw under -z (quotePath default ON): fields == readdir keys: true
  back\x5cslash.txt  caf\xe9.txt  ne\x0awl.txt  ta\x09b.txt
rename oldname.txt->newname.txt: ids=2 [newname.txt, oldname.txt]
literal 'a => b.txt' (plain add): ids=1 [a => b.txt]
binary: [bin.dat]
$ node …/24_git_numstat_z.mjs | diff - …/expected/24_git_numstat_z.txt   → (no diff)
```

These claims I attacked and could **not** break — they hold on git 2.43.0:

- **`-z` emits path bytes raw**, no C-quoting, regardless of `core.quotePath`
  default (on) — non-ASCII, backslash, tab, newline all equal the `readdir`
  key. **True.**
- **A rename is two separate NUL fields**; a real file literally named
  `a => b.txt` is a single field and is not split into a phantom pair. **True.**
- **Binary = `-\t-\t<path>`.** **True.**
- **The double-NUL header/diff boundary is stable.** I built repos with a **root
  commit**, a **normal commit**, an **empty commit** (`--allow-empty`), and a
  commit after it, and dumped the full multi-commit `-z` stream: every record is
  `\x1e<40 hex>\x00<digits>\x00\x00\n<numstat>`, so the parser's assumption that
  `field[2]` is empty and numstat begins at `field[3]` (after stripping one
  leading `\n`) holds for all four; the empty commit correctly yields **no
  paths**. **True.**

The `-z` claims about *path content* are sound. The change genuinely dissolves
the C-quoting and the ` => ` ambiguity that consumed rounds 6–10. That is real
progress and I confirmed it.

---

## COLLAPSE — S1: the Record-Separator framing rests on a false universal claim, and a legal path byte silently fabricates co-change data

**The load-bearing decision.** "Frame each commit record with the `%x1e`
Record Separator and split the stream on it" (`:2141–2144`).

**Its step-2 hardest question** (the one a mission-literate skeptic asks): *Under
`-z`, path fields are raw bytes with no escaping — so can a path field contain
the very byte the framing splits on, corrupting record boundaries?* The plan
answers this for NUL (paths cannot contain NUL — true) and for `0x1e` with a
citation-free absolute: **"which git never emits inside a path or a numstat
field."** That is the whole load the framing rests on. It is false.

**Executed falsification (git 2.43.0).** A file whose name contains a single raw
`0x1e` byte — a legal filename byte on every POSIX filesystem (git forbids only
NUL and `/`) — is emitted **raw**, `0x1e` and all, exactly as `-z` promises for
every other byte:

```
$ printf 'B' > "$(printf 'we\x1eird.txt')" && git add -A && git commit -q -m HASRS
$ git log --grep HASRS -1 -z --numstat --format=%x1e%H%x00%at%x00 -M | od -An -c   (tail)
   7   1   0   f   2   c   9   3   7  \0   1   7   8   9   7   4
   2   0   2   1  \0  \0  \n   1  \t   0  \t   w   e 036   i   r
   d   .   t   x   t  \0
```

`036` is octal `0x1e` — the Record Separator — sitting **inside the path field**
`we<RS>ird.txt`. `-z` did exactly what the plan relies on it to do (raw bytes,
no munging) and that is precisely what defeats the framing: the byte chosen as
the record delimiter is not delimiter-safe, because under `-z` **no** byte
except NUL is.

**The corruption is silent and produces wrong data — demonstrated through the
probe's own `parseZ` reference parser.** Single file:

```
parsed record count (should be 1): 2
  hash= "29eb0058…937"  paths= ["we"]
  hash= "ird.txt"        paths= []
```

The real path `we<RS>ird.txt` is recorded as **`we`** — a key that can never
match the indexer's `readdir` key — and a **phantom commit** with the non-hash
identifier `ird.txt` is fabricated. Worse, a genuine co-change (the RS-named
file changed together with `partner.txt` in one commit):

```
TRUE: one commit co-changes "we\x1eird.txt" + "partner.txt"
parsed records: 3
  hash="4fbe8c64…"  paths=["partner.txt","we"]
  hash="ird.txt"    paths=[]
  hash="aabf4e03…"  paths=["anchor.txt"]
```

The miner records the **fabricated pair `(partner.txt, we)`** — `we` does not
exist on disk — and again injects the phantom commit `ird.txt`. The true pair
`(partner.txt, we<RS>ird.txt)` is never recorded.

**Why this is a collapse, not a nitpick — measured against this project's own
standards:**

1. **It is the exact failure class the miner is built to forbid, now silent.**
   The plan's own `miner_unparsed_numstat` exists so an unresolvable record is
   "recorded … never guessed" (`AD-13`; `:2149–2150`). This corruption **bypasses
   that guard**: the fragment `1\t0\twe` is a perfectly well-formed numstat
   entry, so **no diagnostic fires**. `we` is a guess — the precise thing the
   diagnostic was created to prevent — and the plan's re-scoping of that
   diagnostic to "a defensive guard, not an expected case" (`:1356–1357`) is
   itself falsified: this is a present-day, reachable case on git 2.43.0, not a
   hypothetical future format drift.

2. **It is a regression on a class round 9 handled correctly.** `0x1e` is a
   control byte < 0x20. In line mode, git C-escapes every such byte and round
   9's C-unquote inverted it losslessly (deleted `probe:28` proved this across
   the control-byte class, `ctrl\x01x.txt`). The `-z` rewrite fixed the ` => `
   ambiguity but **reintroduced a silent-miskey vector** on a control byte the
   prior design decoded correctly — by reusing `0x1e` as structural framing.

3. **It fails the collapse test in writing.** Dominating rule 2 step 3: answer
   the hardest question "with a citation … 'I can't' means rebuild or remove —
   never ship with a hedge." The plan answers with an **uncited, false
   absolute**. Under `-z` there is *no* byte git cannot emit in a path except
   NUL, so no single-byte record delimiter can be collision-free by byte choice
   — the claim cannot be cited because it is not true.

4. **It fails the Phase A goal (dominating rule 3).** A fabricated pair
   `(partner.txt, we)` recorded with no diagnostic is fake correctness: the
   miner reports co-change data that is simply wrong, and Phase A is the test bed
   whose corpus Phase B and the regression fixtures are designed from — "faked
   machinery poisons the data the rest of the build reads." A silent wrong pair
   is not an honest floor; the honest-floor mission permits catching *little*,
   never reporting *wrong*.

5. **Dominating rule 1.** The plan asserts an absolute fact about git it did not
   run the check to establish, and it is false — the very "verify before you
   assert" failure the project's standing rules name as its most damaging
   recurring one.

**This is sufficient on its own for a NEEDS FIXES / collapse verdict.**

---

## Corollary findings (subordinate to S1, recorded for the fix)

**m1 — `T-13-1`'s equivalence partition is incomplete, so the test bed would pass
while the miner silently corrupts.** The rewritten `T-13-1` names its technique
"equivalence partitioning over … raw path classes" and plants non-ASCII,
backslash, tab (`0x09`), and newline (`0x0a`) paths (`:7828–7861`). `0x1e` is a
control byte in the identical class as the planted `0x09`/`0x0a`, and it is the
one byte the framing is specifically vulnerable to — yet it is **not planted**.
The Fails-when list (`:7841–7861` after change) would therefore go green on a
miner that fabricates `(partner.txt, we)`. A partition that omits the one member
that breaks the mechanism is not honest partitioning. The fix for S1 must add a
planted RS-in-path co-change to `T-13-1` with a Fails-when that its pair is
recorded under the exact raw `readdir` key (or, if the decision is to exclude
such paths, that the record is routed to `miner_unparsed_numstat` and contributes
no pair — never fabricated).

**m2 — the framing must key on record *structure*, not a magic byte.** Because no
byte except NUL is delimiter-safe under `-z`, a robust parser cannot blindly
"split on `\x1e`" (`:2144`). The format guarantees each real record opens with a
structurally unambiguous anchor: `\x1e` immediately followed by `^[0-9a-f]{40}\x00[0-9]+\x00\x00`.
A candidate `\x1e` not so followed is an in-path byte, and the record must be
either parsed through the anchor (surviving the in-path RS) or, if that is judged
out of scope for Phase A's floor, **detected and routed to
`miner_unparsed_numstat`** — never silently accepted as `we`. Whichever the
author chooses, the plan must (a) drop the false "git never emits `0x1e`" claim,
(b) state the real invariant it relies on, and (c) make the reachable collision a
diagnosed floor limitation rather than fabricated data. This is a direction for
the fix, not a prescription — the author owns the design (OL-11).

---

## Decisions I attacked and could not collapse

Recorded so the next round need not re-litigate them:

- **`-z` raw-path and two-field-rename claims** — reproduced independently;
  sound (see "what holds").
- **The `%x00`/`-z` NUL collision** the framing was introduced to solve **is**
  real, and RS *does* separate it for the overwhelming majority of paths — the
  design is right about the problem and about NUL; it is wrong only in claiming
  `0x1e` is collision-free.
- **Empty-commit / root-commit / double-NUL alignment** — executed across all
  four commit shapes; the `field[2]`-empty, numstat-at-`field[3]` model holds.
- **Deleted-probe hygiene** — no dangling reference to `24_git_numstat_rename`,
  `27_git_numstat_quotepath`, `28_git_numstat_cunquote`, or
  `29_git_numstat_tokenize` remains in `plan-phase-a.md`; the residual
  `core.quotePath` mentions are contextual explanations of what `-z` avoids, and
  `tools/check_docs.py` performs no probe-existence validation, so the deletions
  create no merge-gate rot within the reviewed files. (The `docs/reviews/`
  mentions are write-once historical records and correctly untouched. I did not
  review `docs/STATUS.md`, which is outside the scoped file set but was also
  changed in this diff and still names the four deleted probes at `:47–48` — a
  STATUS concern for the author to confirm, not a finding against the plan.)

---

## Verdict

**NEEDS FIXES — one Serious collapse (S1), two subordinate findings (m1, m2).**

The `-z` rewrite is the right instinct and its path-content claims are sound, but
the Record-Separator framing rests on a false universal ("git never emits `0x1e`
inside a path"), and a legal `0x1e` path byte silently fabricates co-change pairs
and phantom commits **with no diagnostic** — bypassing the miner's own
`never-guessed` contract, regressing a class round 9 handled, and poisoning the
Phase A test-bed corpus. Apply all three findings: kill the false claim, frame on
record structure (or diagnose the collision), and plant the RS-in-path case in
`T-13-1` so the fix is guarded by a test that would otherwise catch it.

Per the standing rule, when a review surfaces findings, **all** are applied — no
prioritized subset.
