# Round 11 — Independent post-fix expert-review of `docs/plans/plan-phase-a.md`

**Date:** 2026-09-18
**Reviewer:** independent fresh session. I did not author this plan, the round-10
`-z` switch under review, or any prior round. The round-10 expert-review
(`2026-09-18-round-10-expert-review.md`, NEEDS FIXES: 1 Moderate) and round-10
collapse-hunt (`2026-09-18-round-10-collapse-hunt.md`) findings are treated as
closure candidates re-derived from current source and re-executed, not trusted by
reference.
**Artifact under review:** `docs/plans/plan-phase-a.md` (the co-change miner,
Step 13, plus its five dependent surfaces) and the probe it now cites, as installed
in the working tree, diffed against `e9a3877`.
**Change under review (`git diff e9a3877..HEAD`, scoped to the plan + probes the
task named):**
- `docs/plans/plan-phase-a.md` — the co-change miner (Step 13) is rebuilt around
  **git machine mode**: `git log --no-merges -M -z --numstat
  --format=%x1e%H%x00%at%x00`. Under `-z`, paths are emitted **raw** (no
  `core.quotePath` C-quoting) and a rename is emitted as **two separate
  NUL-delimited fields** (never the line-mode `old => new` / brace form), so both
  the C-quoting and the `=>`/rename ambiguity fought over rounds 6–10 are dissolved
  at the source. Commit records are framed by a **Record Separator** (`%x1e`) to
  keep the `%x00` header from colliding with `-z` NUL fields. The re-derivation
  touches Step 6 catalog (`:1354–1359`), Step 13 (`:2123–2151`), §11.4 (probe-24
  evidence rewritten, `:7140–7150`), T-13-1 (`:7831–7867`), and Q56 (`:9859–9873`).
- `docs/plans/plan-phase-a.probes/24_git_numstat_z.mjs` — **new** probe: plants the
  special-byte paths (with `core.quotePath` at DEFAULT on), a rename, a real file
  literally named `a => b.txt`, and a binary file, with a reference `-z` stream
  parser; `expected/24_git_numstat_z.txt` — its golden.
- **Deleted:** `24_git_numstat_rename.sh`, `27_git_numstat_quotepath.sh`,
  `28_git_numstat_cunquote.mjs`, `29_git_numstat_tokenize.mjs`, and their four
  goldens — the entire line-mode / quote-aware / C-unquote apparatus the `-z`
  switch retires.
**Nature:** a **re-review** under the expert-review Re-Review Protocol. Round-10
returned **NEEDS FIXES (1 Moderate M1)**; commit `45415e1` is the fix. Both
re-review scopes are exhausted below.
**Standards this review evaluates against:** the changed step's own named sources —
`AD-13` (miner: each unresolved field "recorded … never guess"), T-13-1's named
technique (equivalence partitioning over path encodings and the rename/plain-add
collision), the **Phase A honest-floor goal** (`spec §11.5` / `CLAUDE.md`
dominating rule 3: an **honest** deterministic floor that "measures its own floor …
never fake completeness dressed to look like a working product"), and the
expert-plan **build-contract** standard ("another engineer can execute step by step
without making a single decision on the fly").

---

## Scope and Inventory

Per the Re-Review Protocol the inventory carries both scopes.

### Scope 1 — Round-10 findings as closure items

- [x] **Round-10 M1 (Moderate)** — a fully-unquoted `--numstat` field whose real
  filename contains ` => ` (`x => y.txt`) or a `{ … => … }` brace group
  (`a{x => y}b.txt`), with no quote-forcing byte, is byte-identical in shape to a
  rename and was silently mis-keyed into two garbage identities by the line-mode
  "exactly one ` => ` → rename" rule. **Closure verified** by Read of the new
  Step 13 (`:2123–2151`), T-13-1 (`:7831–7867`), Q56 (`:9859–9873`), and by direct
  execution of git 2.43.0 (below): under `-z` both `a => b.txt` and `a{x => y}b.txt`
  plain-adds are single raw NUL fields, a rename is two separate raw NUL fields, and
  git **never** emits the brace form. The line-mode ambiguity is dissolved at the
  source. **Genuine closure.**

### Scope 2 — Fix-diff files (new-findings detection)

- [x] `docs/plans/plan-phase-a.md` — Read at `:1354–1363` (Step 6 catalog),
  `:2123–2151` (Step 13), `:7140–7150` (§11.4 probe-24 evidence), `:7828–7867`
  (T-13-1), `:9859–9873` (Q56). Stale-remnant sweep (results in Systemic Patterns):
  `grep -n "24_git_numstat_rename|27_…|28_…|29_…"` → 0 hits (all four retired probes
  gone from the plan); `grep -c "core.quotePath"` → 4, each Read and confirmed in
  the new "-z emits raw regardless of core.quotePath" context, none a surviving
  line-mode instruction.
- [x] `docs/plans/plan-phase-a.probes/24_git_numstat_z.mjs` — Read in full (128
  lines) and **executed**; `parseZ` traced field-by-field against git's actual
  `-z --numstat` byte layout (dumped with `od -c`, below).
- [x] `docs/plans/plan-phase-a.probes/expected/24_git_numstat_z.txt` — Read (5
  lines); reproduced by execution.

### Instruments used (per claim type)

| Claim type | Instrument | Result |
|---|---|---|
| Literal plan text ("line N says Z") | Read at file:line, at drafting time | recorded above |
| git `-z --numstat` byte layout (raw paths, rename framing, RS, control bytes) | **direct execution**, git 2.43.0, `od -c` dumps | pasted below |
| Probe correctness / golden match | **executed** the probe, diffed vs golden | matches exactly |
| Plan structural integrity | `run-plan-probes.mjs`; `derive-plan-sections.mjs --check`; `check_docs.py` | all pass |

Context7 was not required: the load-bearing category is git's on-disk `-z --numstat`
byte stream, verified by execution (stronger than a docs lookup). No instrument
class was unavailable. **Environment:** git 2.43.0, Node v22.22.2 — the exact
versions the probe evidence names.

## Summary

**This review returns NEEDS FIXES.** Round-10 M1 is genuinely and fully closed: the
switch to `git log -z --numstat` dissolves the entire family of ambiguities the
prior rounds fought — under `-z` git emits every path raw (no C-quoting, verified
even with `core.quotePath` at its default on) and emits a rename as two separate
NUL-delimited fields, never the `old => new` or brace form (verified by `od -c`
dumps of real repos, including a shared-prefix rename that line mode would force
into the brace form). A plain-added `a => b.txt` or `a{x => y}b.txt` is now one
field, not a phantom rename. The retirement is clean: all four line-mode probes and
goldens are gone with zero dangling references, and the plan's three checkers pass.
But the fix introduces a **new** defect of the exact class round-10 named. To keep
the `%x00` header from colliding with `-z` NUL fields, the fix frames each commit
record with a `%x1e` Record Separator and asserts — in Step 13 (`:2142`) and in the
probe's own header (`:14`) — that `0x1e` is "a byte git never emits inside a path or
a numstat field." That completeness claim is falsified by execution: a filename
containing a raw `0x1e` byte is emitted **raw** under `-z` (git does not escape it),
so the Record Separator appears inside a path field, the parser's RS-split cuts the
record mid-path, and the path is silently mis-keyed — the S1-class silent mis-key
the seam exists to prevent — while `miner_unparsed_numstat`, described as the
"defensive guard," does not catch it (a leaked-RS record is not a malformed-shape
record; the mis-key happens before any shape check). The discriminating partition
(a `0x1e`-in-path file) is unplanted in T-13-1 and guarded by no `Fails when`
clause, exactly as round-9's fix left the fully-unquoted partition unplanted. That
is one new Moderate finding under the Phase A honest-floor standard. No Critical,
Serious, or Systemic finding was introduced.

## Fixes-Closure Verification (Scope 1)

**Round-10 M1 (Moderate) — CLOSED.** The original defect: a fully-unquoted
single-separator `--numstat` field (a plain-add of a file literally named
`x => y.txt`, or `a{x => y}b.txt`) is byte-identical in shape to a rename, and
line mode's "exactly one ` => ` → rename" rule silently split it into two garbage
identities and a bogus co-change pair. The fix replaces line-mode parsing with
`-z` machine mode (Read Step 13 `:2125–2138`): "With `-z`, git emits every path
field as **raw bytes** … And with `-z` a **rename is two separate NUL-delimited
fields** … so a real file whose name literally contains ` => ` is a single field
and can never be confused with a rename." I verified this by execution rather than
by trusting the prose or the probe:

```
# plain add of  a => b.txt   under -z --numstat (od -c, path field only):
  \n 1 \t 0 \t a   =   >       b   .   t   x   t \0        → ONE raw field "a => b.txt"
# plain add of  a{x => y}b.txt   under -z:
  \n 1 \t 0 \t a { x   =   >       y } b . t x t \0        → ONE raw field "a{x => y}b.txt"
# genuine shared-prefix rename src/utils/c.txt -> src/other/c.txt under -z:
  \n 1 \t 1 \t anchor.txt \0  0 \t 0 \t \0 src/utils/c.txt \0 src/other/c.txt \0
                          → rename = empty-path entry + TWO separate raw NUL fields;
                            NOT the brace form src/{utils => other}/c.txt
```

The shared-prefix rename is the decisive check: it is the case line mode would print
as the brace form, and `-z` still emits two separate raw fields — so the plan's
premise that `-z` never emits `=>`/brace shapes holds, and the plain-add of a
rename-marker-named file is now unambiguously one path. `probe:24_git_numstat_z`
(executed, matches golden byte-for-byte) confirms `literal 'a => b.txt' (plain add):
ids=1 [a => b.txt]` and `rename … ids=2 [newname.txt, oldname.txt]`. *Named standard
(Phase A honest-floor + AD-13 "never guess") — met for the class M1 named:* the
plain-add-vs-rename ambiguity is structurally dissolved, not pragmatically assumed
away, so there is no longer a silent mis-key on that class and nothing to describe
as an accepted floor. This is a stronger closure than round-10's own recommended
"describe it honestly" option — it removes the defect rather than documenting it.

## Critical & Serious Findings

No Critical or Serious findings — the full Scope-2 fix-diff (Step 6 catalog, Step
13, §11.4, T-13-1, Q56, the new probe 24, and its golden) was Read, and every
git-behavior premise the change rests on was verified by direct execution of git
2.43.0; no violation of Critical or Serious classification was observed. The prior
Serious closure item (round-6 S1, the non-ASCII mis-key) remains closed and is in
fact strengthened: under `-z` `café.txt` is emitted as its raw UTF-8 bytes even with
`core.quotePath` at its default on (executed — the field is `caf\303\251.txt` raw,
not the C-quoted `"caf\303\251.txt"`), so it keys on the same bytes the indexer's
`readdir` walk uses with no decode step at all.

## Systemic Patterns

No systemic patterns — verified by the stale-reference sweep in Scope 2:
`grep -n "24_git_numstat_rename\|27_git_numstat_quotepath\|28_git_numstat_cunquote\|29_git_numstat_tokenize"`
over `plan-phase-a.md` → **0 hits** (the four retired line-mode probes are gone from
the plan with no dangling citation); `grep -c "core.quotePath"` → **4 hits**
(`:2131`, `:7141`, `:7146`, `:9862`), each Read and confirmed to be the new "`-z`
emits raw regardless of `core.quotePath`" framing, none a surviving line-mode
instruction; `grep -c "C-quot"` → 7, all in the "line mode would C-quote but `-z`
does not" contrast; the lone `quote-aware` hit (`:2564`) is the unrelated AD-15
shell-operator splitter. The one Moderate below is a single conceptual defect that
appears in the two surfaces stating the RS-safety claim (Step 13 `:2142`, probe
header `:14`); it is one finding stated in the surfaces the claim must live in, not
a codebase-wide propagated pattern.

## Moderate & Minor Findings

### M1 (Moderate) — The newly-introduced `%x1e` Record Separator is falsely asserted to be "a byte git never emits inside a path," but under `-z` a filename containing a raw `0x1e` is emitted raw, so the RS leaks into a path field, the parser mis-frames the record, and the path is silently mis-keyed — with the discriminating partition unplanted and the `miner_unparsed_numstat` guard not covering it

**What the plan says now.** Step 13 (Read `:2141–2143`): "prefixing each commit
record with a **Record Separator** (`%x1e`, byte `0x1e`), which **git never emits
inside a path or a numstat field**: the parser reads a record as `\x1e`, the
NUL-terminated `%H` and `%at`, then the commit's `-z --numstat` block up to the next
`\x1e` or end of stream." The probe header restates it verbatim (Read
`24_git_numstat_z.mjs:14`): "a Record Separator (`\x1e`), **a byte git never emits
inside a path or numstat field**." Step 6 (`:1354–1359`) and Q56 (`:9867–9869`)
build on it: `miner_unparsed_numstat` is re-scoped to "a malformed stream, e.g. a
future git output-format drift … this diagnostic is the **defensive guard, not an
expected case**," and the RS is stated to be what keeps "the `%x00` header [from
colliding] with the `-z` NUL fields." T-13-1's Data paragraph (`:7835–7845`) plants
the non-ASCII / backslash / tab / newline / `a => b.txt` / binary classes but no
`0x1e`-in-path class.

**How this was verified.** Direct execution, git 2.43.0 (throwaway repo, the miner's
own invocation). I created a file whose name contains a raw `0x1e` byte
(`foo\x1ebar.txt`) and ran `git log --no-merges -M -z --numstat
--format=%x1e%H%x00%at%x00`, dumping the one-commit record with `od`:
```
# the record for the commit that added  foo<0x1e>bar.txt :
036  <40-hex hash> \0  1789742075 \0 \0 \n  1 \t 0 \t  f o o 036 b a r . t x t \0
                    ^RS at record start                       ^RS byte RAW inside the path field
# od -An -tx1 | grep -c '^1e$'  over that single record  →  2
#   (one 0x1e is the intended Record Separator; one leaked from the filename)
```
git emits the `0x1e` **raw** inside the path field — it does not escape control
bytes below `0x20` under `-z` (the same rawness the fix relies on for `café.txt`,
tabs and newlines cuts the other way here). Feeding this record to the plan's own
`parseZ` (traced by hand against the byte layout): the RS-split cuts the chunk at
the in-name `0x1e`, yielding chunk A `…\n1\t0\tfoo` → the path is recorded as **`foo`**
(the bytes after the RS are lost), and chunk B `bar.txt\0` → a spurious record whose
"hash" field is `bar.txt`. The real file `foo\x1ebar.txt`, co-changing with a
partner, is silently counted under the wrong key `foo`; nothing routes to
`miner_unparsed_numstat`, because the mis-key happens in chunk A during RS-framing,
before any per-record shape check the guard performs — a leaked-RS record is not the
"malformed shape" the guard is defined against.

**Which standard it violates and why.** The Phase A honest-floor goal (spec §11.5 /
CLAUDE.md dominating rule 3) forbids "fake completeness dressed to look like a
working product" and requires the tool to "measure its own floor." The plan's
absolute claim — `0x1e` is a byte "git never emits inside a path" — is the
justification that makes the RS-split unambiguous, and execution falsifies it: git
does emit a raw `0x1e` inside a path under `-z`, so a whole class of paths
(any filename carrying a `0x1e` byte) is **silently mis-keyed**, with no diagnostic.
This is the **identical defect class round-10 M1 named** — an executable completeness
assertion falsified by execution, plus an unplanted discriminating partition —
recurring on the partition the *new* mechanism (`%x1e` framing) introduces, precisely
as round-10 found round-9's fix closed the quoted partition while re-opening the
unquoted one. It also violates the build-contract standard: an implementer who
follows the prose ("git never emits `0x1e` inside a path") will build the naive
RS-split and inherit the silent mis-key without a decision point warning them.

**Why Moderate and not Minor or Serious.** More than Minor: the change makes an
explicit, executable completeness assertion in a build contract that execution
falsifies, and leaves the discriminating partition unplanted while presenting
`miner_unparsed_numstat` as the guard that makes the parse safe — the precise
honest-floor failure this project's central goal names. Not Serious: a raw `0x1e`
(Record Separator control byte) in a filename is even rarer than round-10's
`a => b.txt` — essentially never in a real source tree — so practical blast radius on
Max Cogar's agent-tooling test-bed is ~0; and the `-z` + RS approach is itself a
genuine, defensible improvement that dissolves the round-6–10 ambiguity family. The
defect is the **dishonest description** of the RS as absolutely collision-free, plus
the unplanted partition — mirroring round-10's own Moderate calibration of the
parallel finding. (Consistency with that precedent is required by the frame axis;
classifying the same class differently between rounds would be codebase-relative
drift.)

**What correct looks like (either closes it).**
- *Keep the RS but describe it honestly and plant the partition:* replace "which git
  never emits inside a path or a numstat field" (Step 13 `:2142`, probe header `:14`)
  with an honest-floor statement — a filename containing a raw `0x1e` byte is emitted
  raw under `-z`, would break record framing, and is mis-keyed; this is an accepted,
  measured floor, near-nonexistent on the target corpus. Plant a `0x1e`-in-path file
  in T-13-1 and add a `Fails when` clause documenting the accepted mis-attribution
  (or asserting it routes to `miner_unparsed_numstat` if the parser is hardened).
- *Or dissolve it structurally (restores true completeness):* make the parser robust
  to a leaked RS instead of assuming one cannot occur. Because an RS-split can only
  spuriously cut *inside a path field*, a chunk that does not begin with a valid
  40-hex-char `%H` followed by `\0` is a **continuation** of the preceding record's
  final path — rejoin it (RS byte included) rather than treating it as a new record.
  That validates the one structural invariant the format actually guarantees (`%H`
  is 40 hex chars) and removes the mis-key for every possible path, retiring the
  false claim rather than documenting a floor.

**Classification.** Moderate. **Provenance.** Recurring — the S1 silent-mis-key /
false-completeness class, re-opened on the `0x1e`-in-path partition by the fix's new
`%x1e` record framing.

No Minor findings beyond the above — verified by Read of all five changed plan
regions, a hand-trace of the probe's `parseZ` against git's executed `-z --numstat`
byte layout (`od -c`), and execution of the probe against its golden. One
observation not rising to a finding: Step 13's prose (`:2143–2147`) describes the
record shape at a higher level than the exact byte layout (it omits the empty NUL
field and the leading `\n` before the first numstat entry that `od` reveals), but
the cited `probe:24_git_numstat_z` carries the exact, executed reference parser, so
the implementer is not left to invent those details — the build-contract decision is
made, in the probe.

## Tentative Findings

No tentative findings — every premise above was verified against current source at
drafting time: plan text by Read at file:line; git's `-z --numstat` byte layout
(raw paths, rename framing, the raw `0x1e` leak, the absence of a brace form on a
shared-prefix rename) by direct execution of git 2.43.0 with `od -c`/`od -tx1`
dumps of repos I built this pass; the probe by running it and diffing against its
golden; plan structural integrity by the three checkers. Nothing rests on memory,
on either round-10 review's assertions, or on the probe's header comment — the
pivotal claims (both the M1 closure and the new RS leak) were re-derived from
independent repos, not trusted by reference.

### git behavior, executed this pass (git 2.43.0), grounding the review

```
# M1 CLOSURE — -z dissolves the =>/brace/quote family at the source:
plain add  a => b.txt        →  \t1\t0\t "a => b.txt"            (one raw field)
plain add  a{x => y}b.txt     →  \t1\t0\t "a{x => y}b.txt"        (one raw field, no brace split)
rename src/utils/c.txt->src/other/c.txt (shared prefix; line mode = brace form)
                              →  0\t0\t <empty> \0 src/utils/c.txt \0 src/other/c.txt \0
                                 (two separate raw fields; git NEVER emits the brace form under -z)
café.txt (core.quotePath DEFAULT on) →  caf\303\251.txt          (RAW, not "caf\303\251.txt")

# NEW MODERATE — a raw 0x1e in a filename leaks past the Record Separator:
file foo<0x1e>bar.txt         →  1\t0\t foo <0x1e> bar.txt \0     (RS byte RAW inside the path)
   od -tx1 over that one-commit record: count of 1e bytes = 2 (1 RS + 1 leaked)
   parseZ RS-split → path recorded as "foo"; "bar.txt" becomes a phantom record hash
```

### Probe executed vs golden
```
$ node 24_git_numstat_z.mjs | diff - expected/24_git_numstat_z.txt   → (no diff)
  raw under -z (quotePath default ON): fields == readdir keys: true
  rename … ids=2 [newname.txt, oldname.txt]
  literal 'a => b.txt' (plain add): ids=1 [a => b.txt]
  binary: [bin.dat]
```

### Plan tooling, re-run this pass
- `run-plan-probes.mjs` → all **26** probes `ok`; "all probes match their recorded
  expectations."
- `derive-plan-sections.mjs --check` → "OK: 40 steps, 13 elements, 124 test specs,
  **26 probes cited**, regions current" (29 − 4 retired + 1 new = 26).
- `python3 tools/check_docs.py` → "context-oracle doc-consistency check passed."

## What's Actually Good

- **The `-z` switch dissolves the round-6–10 ambiguity family at the source, proven
  by execution.** *Property:* under `-z` git emits paths raw (no C-quoting, even with
  `core.quotePath` on) and renames as two separate raw fields (never `=>`/brace), so
  the C-unquote/tokenizer/quote-aware apparatus is not merely fixed but **removed**,
  and the plain-add-vs-rename mis-key is structurally impossible rather than
  pragmatically assumed. *Standard:* Phase A honest-floor — the strongest form of
  "measure the floor" is to eliminate the failure mode, not document it; expert-plan
  premise-grounding. *Verified:* `od -c` dumps of `a => b.txt`, `a{x => y}b.txt`, a
  shared-prefix rename, and `café.txt` under `core.quotePath=on` (above); probe
  matches golden.
- **The line-mode apparatus was retired cleanly, with no dangling reference.**
  *Property:* the four line-mode probes and goldens and every prose citation of them
  are gone; Step 6, Step 13, §11.4, T-13-1, and Q56 all describe one coherent `-z`
  parse. *Standard:* expert-plan build-contract free of self-contradiction and
  orphaned artifacts. *Verified:* `grep` → 0 dangling probe references; probe↔golden
  1:1 with no orphan; `derive-plan-sections.mjs --check` "regions current"; all three
  checkers green.

## Recommended Priority

Fix M1 before this plan is used as a build contract. The lowest-cost close is to stop
*claiming* an in-band framing byte git cannot leak: replace "a byte git never emits
inside a path" (Step 13 `:2142` and the probe header `:14`) with an honest-floor
statement that a raw `0x1e` in a filename would break framing and is an accepted,
measured floor, and plant that partition in T-13-1 with a `Fails when` clause. The
stronger close — validating each record's leading field as a 40-hex `%H` and treating
a non-conforming chunk as a path continuation — makes the parse robust to any leaked
RS and would let the plan keep a true completeness claim; it is a small amount of
extra parser logic and worth doing, since the whole point of the `-z` switch was to
resolve these ambiguities *structurally* rather than assume them away, and the RS
leak is the one place the current fix falls back to an unstated assumption.

Verdict: NEEDS FIXES (1 Moderate)
