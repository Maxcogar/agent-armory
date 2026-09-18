# Round 9 — Independent collapse-hunt of the decode-vs-skip seam fix in `docs/plans/plan-phase-a.md`

**Date:** 2026-09-18
**Artifact under review:** the round-9 change to `docs/plans/plan-phase-a.md`
plus the two new files it cites —
`docs/plans/plan-phase-a.probes/28_git_numstat_cunquote.mjs` and
`docs/plans/plan-phase-a.probes/expected/28_git_numstat_cunquote.txt` — diffed
against `c99b8fc`.
**Baseline:** `c99b8fc` (the round-8 expert-review checkpoint, whose miner
*skipped* every C-quoted `--numstat` field to `miner_unparsed_numstat`).
**Nature:** An independent adversarial collapse-hunt under
`middleware/context-oracle/CLAUDE.md` dominating rule 2 — a fresh reviewer who
did not author this change, attacking each load-bearing decision's hardest
question and hunting for new ones. Every load-bearing git behavior below was
executed by me in this environment (git 2.43.0 — the version §11.4 names — and
Node v22.22.2) and is pasted verbatim; the plan's prose, the recorded probe
expectation, and the prior rounds' and STATUS's "verified"/"converged" claims
were not accepted as evidence until I reproduced them.
**Standards this review evaluates against:** the changed step's own named
sources — `AD-13` (miner: each unresolved field "recorded … never guess"),
T-13-1's own named technique (**equivalence partitioning over "path encodings"**,
`:7877–7879`), dominating rule 1 (never claim a branch works without the input
that exercises it), dominating rule 3 (the Phase A goal governs — *does this
serve the goal?*), and the Phase A goal itself (spec §11.5 / `STATUS.md`: an
**honest** deterministic floor, "never fake completeness dressed to look like a
working product").

---

## What the change is

Through round 8 the miner **skipped** any `--numstat` path field (or split rename
identity) that began with `"` — routing it to a `miner_unparsed_numstat`
diagnostic, contributing no co-change pair. Both round-8 independent reviews
recommended resolving the seam as a **uniform skip**. This round-9 change instead
resolves it as a **uniform decode**: the miner now **C-unquotes** any C-quoted
token back to its raw bytes and keeps it in the co-change substrate, and narrows
the unresolvable set to a single case. Concretely:

1. **Step 13 prose (`:2138–2153`)** and the **`miner_unparsed_numstat` catalog
   entry (`:1354–1358`)**: "any token that begins with a double-quote is
   C-quoted, and the miner **C-unquotes** it back to its raw path rather than
   dropping it … The one field the miner cannot resolve is an **unquoted** path
   holding a literal `{`, `}`, or ` => ` … a still-C-quoted field is instead
   C-unquoted back to its raw path, **never recorded here**."
2. **New `probe:28_git_numstat_cunquote`** (`.mjs` + `expected/…txt`) and its
   §11.4 evidence claim (`:7160–7173`): a git → C-unquote → `readdir`-key
   round-trip proving `invertible … : true` across the backslash / non-ASCII /
   double-quote / tab / control-byte classes.
3. **T-13-1 fixture Data (`:7858–7879`)** and **`Fails when` (`:7880–7895`)**:
   now plants three new-side-quoted renames (backslash/quote/tab), one
   plain-added quoted field (`u\v.txt` → `"u\\v.txt"`), and one unquoted
   multi-arrow file (`x => y.txt`) as the `miner_unparsed_numstat` reaching
   input.
4. **Q56 (`:9890–9900`)** updated to describe the decode.

`STATUS.md` (`:64–72`) flags the decode-vs-skip choice as an author OL-11 design
call that "diverges from the reviewers' recommendation and should be the first
thing a fresh independent pass evaluates." This review takes that instruction
literally.

## What I executed (load-bearing)

**(1) The probe reproduces byte-for-byte** (git 2.43.0, Node v22.22.2):

```
readdir keys:  a\x5cb.txt  caf\xc3\xa9.txt  ctrl\x01x.txt  plain.txt  q"z.txt  ta\x09b.txt
c-unquoted:    a\x5cb.txt  caf\xc3\xa9.txt  ctrl\x01x.txt  plain.txt  q"z.txt  ta\x09b.txt
invertible (decoded == readdir keys): true
```

— identical to the recorded expectation. The §11.4 evidence string matches this
output exactly. **The narrow claim the probe makes — C-unquote inverts git's
C-quoting to the on-disk bytes for the five planted classes — SURVIVES.**

**(2) But git's numstat quoting is per-identity, not per-field, so a field can
begin with `"` and still be a rename, and a *quoted* field can carry ` => `.**
The decode rules and the fixture turn on which side of the `"`/`=>` interaction a
field lands on, so I enumerated the four git shapes the miner will actually meet
(all under the miner's exact invocation `git -c core.quotePath=false log
--no-merges --numstat -M`, git 2.43.0):

```
# new-side quoted (old side plain)  — field does NOT begin with "  — the fixture's renames
0	0	plainsrc.txt => "a\\b.txt"

# CASE D: OLD side quoted            — field BEGINS with " AND is a rename
0	0	"back\\slash.txt" => plainname.txt

# CASE C: single quoted path holding ' => ' (quoted for the tab) — begins with " AND contains ' => ', NOT a rename
1	0	"a => b\tc.txt"

# multi-arrow unquoted rename        — the fixture's x => y.txt case
0	0	x => y.txt => z.txt
```

Split-on-` => ` of the multi-arrow field yields three parts
(`['x','y.txt','z.txt']`) — genuinely un-splittable, so **the `x => y.txt`
fixture case is correctly characterized and routed to `miner_unparsed_numstat`;
that part SURVIVES.**

**(3) Line framing survives a newline in a path — but git emits `\n`, and the
decode of `\n` is nowhere exercised:**

```
1	0	"ne\nwl.txt"     # newline escaped as \n; the --numstat line is not split
```

---

## The core decision — collapse test (does NOT cleanly survive)

**Decision (the one STATUS flags for this pass).** Resolve the C-quoted-`--numstat`
seam by **decoding** (C-unquote every C-quoted token to its raw path, keep it in
the substrate) rather than **skipping** (record every C-quoted token as
`miner_unparsed_numstat`).

1. **Job (mission terms).** Deliver the coupling fact for a file git had to
   C-quote — instead of silently omitting it — *without ever mis-keying it*: a
   more-complete **and** still-honest deterministic floor.
2. **Hardest skeptic question.** Does decode actually buy a more-complete-yet-honest
   substrate on the inputs Phase A will really see — or does it (a) buy nothing,
   because C-quote-forcing filenames essentially never occur on Max Cogar's real
   repos, while (b) reintroducing the exact silent mis-key it was meant to
   prevent, on a reachable input class the *stated rules* mishandle?
3. **Answer (cited + executed).** It does not fully clear the bar. The
   completeness benefit is unrealized on the target corpus (a backslash / tab /
   double-quote / control byte in a *source* filename is near-nonexistent in
   agent-tooling repos), and — executed above — a **quoted path containing ` => `**
   (CASE C, `"a => b\tc.txt"`) is a real git output that the plan's own rules
   ("a path field **contains ` => `** is a git-detected rename", `:2134–2135`;
   "the one field the miner cannot resolve is an **unquoted** path holding … ` => `",
   `:2150–2153`; "a still-C-quoted field is … C-unquoted … **never recorded
   here**", `:1357–1358`) route to a **rename split** — producing two garbage
   identities and a silent bogus co-change pair, the S1-class mis-key this whole
   seam exists to prevent. The decode design's stated completeness claim is
   falsified by execution. Cited against the Phase A goal (honest floor; "never
   fake completeness"; spec §11.5) and `AD-13`'s "never guess."
4. **Guide, not gate.** Structurally fine — the miner records and whispers, never
   blocks.

**Partial collapse.** The decode *decode-primitive* (probe 28) is sound and the
café.txt / new-side-quoted-rename / multi-arrow cases are handled honestly. But
the decision's load-bearing promise — "a more complete substrate with no new
mis-key" — has a hole (CASE C) and an unrealized premise (the target inputs do
not occur), and the plan asserts a completeness the code as-specified does not
have. That is the finding below.

---

## Findings

### M1 (Moderate) — The decode rules cannot tell a quoted rename from a quoted path that contains ` => `; a reachable field is silently mis-keyed, and the plan asserts a completeness that execution falsifies

**Location.** Step 13 prose `:2134–2153`; the `miner_unparsed_numstat` catalog
entry `:1354–1358`; T-13-1 Data `:7858–7879` and `Fails when` `:7880–7895`
(technique claim "equivalence partitioning over … path encodings", `:7877–7879`).

**The claim under attack.** Two sentences, read together, assert the decode
handles every C-quoted field: (i) "a `--numstat` line whose path field
**contains ` => `** is a git-detected rename" (`:2134–2135`); (ii) "The one field
the miner cannot resolve is an **unquoted** path holding a literal `{`, `}`, or
` => ` … a still-C-quoted field is instead C-unquoted back to its raw path,
**never recorded here**" (`:2150–2153`, `:1357–1358`). Together they claim: any
field beginning with `"` is cleanly C-unquotable, and the *only* ambiguous field
is an unquoted one.

**What breaks it (executed).** git quotes each rename identity **independently**,
not the field as a whole (executed above and reproducible: `"back\\slash.txt" =>
plainname.txt` for a quoted *old* side; `plainsrc.txt => "a\\b.txt"` for a quoted
*new* side). So "begins with `"`" and "contains ` => `" are not the clean,
separable discriminators the prose treats them as — they interact, and the two
adversarial shapes are indistinguishable to the stated flat string tests:

- **CASE D** `"back\\slash.txt" => plainname.txt` — **begins with `"` and is a
  rename.** A reader who applies "begins with `"` → C-unquote the whole field"
  (the natural reading of `:2142–2143`, and exactly what probe 28's `cUnquote`
  does: strip the first and last byte as the surrounding quotes) mangles it.
- **CASE C** `"a => b\tc.txt"` — **begins with `"`, contains ` => `, and is a
  single path** (a plain add, `1\t0\t"a => b\tc.txt"`; the tab forces the quote).
  A reader who applies "contains ` => ` → rename" (`:2134–2135`, the most literal
  reading of the prose) splits it into `"a` and `b\tc.txt"` and adds two
  non-existent files to `cochange_pairs`. The prose explicitly excludes this from
  the unresolvable set ("**unquoted** path holding … ` => `") and asserts a
  still-C-quoted field is "never recorded here" — so a faithful implementation of
  the plan-as-written **silently mis-keys it**, never even recording a diagnostic.

No single flat test resolves both: only quote-aware tokenization (open a quoted
token at a leading `"`, close it at the matching un-escaped `"`, and treat ` => `
as a rename separator **only outside** quoted tokens) distinguishes CASE C
(nothing follows the closing quote → one path) from CASE D (` => ` follows the
closing quote → rename). The plan specifies no such tokenizer; it specifies flat
`contains ' => '` / `begins with '"'` tests and then makes a completeness claim
those tests do not support. This violates the plan's own executability bar —
"executable step by step without a single decision on the fly" — for this branch:
the implementer must *invent* the tokenizer the prose omits and contradicts.

**Why it matters (and why it is Moderate, not Minor).** This is the exact
S1-class silent mis-key the seam has spent nine rounds hardening, and the decode
design **reintroduces** it for CASE C while *claiming* completeness — "fake
completeness dressed to look like a working product," which the Phase A goal
(dominating rule 3, spec §11.5) names as the one thing Phase A must never be.
Note the honesty regression relative to what was replaced: the round-8 *skip*
design at least routed leading-`"` tokens to a **visible** `miner_unparsed_numstat`
floor count; decode-as-specified turns CASE C into a **silent** bogus pair. And
under T-13-1's own named standard — "equivalence partitioning over path
encodings" — the two discriminating quote-structure partitions (CASE C, CASE D)
are the ones that matter here, and **neither is planted**: every field the
fixture plants either does not begin with `"` (the three renames:
`plainsrc.txt => "a\\b.txt"`) or begins with `"` **and** contains no ` => ` (the
plain add `"u\\v.txt"`). So the decode branch's structural handling is
asserted-but-unexercised — the precise defect class rounds 7 and 8 were about,
now on the successor design.

It is **Moderate, not Serious**, in fairness: the triggering inputs are
vanishingly rare on Max Cogar's real corpus (a filename literally containing
` => ` *and* a quote-forcing byte), so the practical blast radius on the Phase A
test-bed data is near-zero, and the underlying flat-`contains ' => '` parse gap
arguably pre-dates this change. It is **more than Minor** because this change (a)
makes an explicit, executable **completeness assertion** ("the one field … is an
**unquoted** …"; "a still-C-quoted field is … never recorded here") that my
execution falsifies, (b) narrows the replaced skip's broader catch, and (c)
leaves the discriminating partitions unplanted while the Data paragraph claims
the path-encoding partition is "honestly populated."

**What correct looks like (either closes it).**
- *Keep decode:* specify the quote-aware tokenizer explicitly (leading `"` opens
  a token to its matching un-escaped `"`; ` => ` and the brace `{ … => … }` split
  only outside quoted tokens), correct the "only **unquoted**" claim (a quoted
  path containing ` => ` that the tokenizer cannot resolve is **recorded as
  `miner_unparsed_numstat`**, never split), and plant CASE C and CASE D in
  T-13-1 with `Fails when` clauses asserting CASE C is recorded (not split into a
  pair) and CASE D's two identities are both C-unquoted and counted.
- *Revert to skip* (the reviewers' round-8 recommendation): a uniform "any
  leading-`"` token → `miner_unparsed_numstat`" is immune to CASE C by
  construction, at the cost STATUS already weighed (dropped weird-named files —
  a cost that is near-zero on the real corpus, which is the same reason the
  decode's completeness benefit is near-zero).

**Classification.** Moderate. **Provenance.** Recurring — the S1 silent-mis-key
class, re-opened on the decode successor for the quoted-`=>` partition; adjacent
to round-8 m1 (an unexercised path-encoding partition), here promoted because the
*rule*, not just the coverage, is wrong for CASE C.

### m2 (Minor) — The `newline` C-quoted class is asserted as handled but exercised nowhere

**Location.** Step 13 `:2140` ("double-quote, backslash, tab, **newline**, or
control byte `< 0x20`"); probe 28 `names` array; T-13-1 Data `:7862–7870`.

**Observation.** git does emit `\n` for a newline in a path (executed:
`"ne\nwl.txt"`, line framing intact), so a newline filename is a reachable,
in-scope input, and the decode's `\n` branch (cUnquote `SIMPLE[0x6e]=10`) is
load-bearing. But probe 28 plants no newline (its classes are
backslash/non-ASCII/double-quote/tab/control), and neither does the T-13-1
fixture. The `\n` decode is therefore asserted-handled and never exercised
(dominating rule 1). Risk is low — `\n` is a named escape on the same code path
as `\t`, which *is* tested — so this is Minor, not part of M1. Note the probe's
§11.4 evidence claim is itself **honest** (it enumerates exactly the five tested
classes and does not claim newline). **What correct looks like.** Add a newline
byte to probe 28's `names` (or a newline-named file to T-13-1) so the listed
class is exercised, or drop "newline" from the enumerated handled set.

### m3 (Minor) — The prose equates recovered *bytes* with the indexer's *string* key without stating the miner must UTF-8-decode to match

**Location.** Step 13 `:2144–2147` ("recovers the exact on-disk **bytes**, which
equal the `readdir` **key** the structural indexer and every genre lookup use");
Step 14 `:2228` (`parse(path: string, …)` — the indexer keys `files.path` as a
`string`).

**Observation.** The indexer walks the working tree and keys `files.path` as a
UTF-8 `string`; the miner's cochange pairs must reference that same string for a
pair to count (this is the whole point of the round-6 S1 fix — café.txt as raw
UTF-8 matching the indexer's `"café.txt"`). Probe 28 proves a **byte-level**
round-trip (it compares under `.toString('latin1')`), which is the *sufficient
condition* — equal bytes decode to equal strings — but the plan never states the
miner UTF-8-decodes its C-unquoted **bytes** to a string before keying, and the
prose literally equates "bytes" with a "key" that Step 14 types as `string`. An
implementer who keys `cochange_pairs` on a latin1 byte-string (as probe 28's
*comparison harness* does) would silently reintroduce S1 for `café.txt`
(`caf\xc3\xa9.txt` ≠ `"café.txt"`). **What correct looks like.** State in Step 13
that the miner UTF-8-decodes both git-raw and C-unquoted path bytes to the same
`string` representation `files.path` uses, and note probe 28's `latin1` is only a
byte-comparison device, not the miner's key representation. **Classification.**
Minor (executability precision). In scope for Phase A's Linux/UTF-8 target;
invalid-UTF-8 filenames remain out of scope per the standing NFC/NFD disposition.

---

## Decisions I attacked and could not break (executed evidence)

- **The C-unquote primitive itself — SURVIVES.** Probe 28 reproduces
  byte-for-byte against the recorded expectation; C-unquote inverts git's
  C-quoting to the on-disk `readdir` bytes across all five planted byte classes
  (backslash `\x5c`, non-ASCII `\xc3\xa9`, double-quote, tab `\x09`, control
  `\x01` via octal). git quotes the **whole path** when any component needs it
  (executed: `plainnew.txt => "sub/we\\ird.txt"`), so a quoted identity is quoted
  from its first byte — there is no quoted-basename-inside-unquoted-dir hazard.
- **The `core.quotePath=false` key-alignment (round-6 S1 fix) — SURVIVES
  (unchanged this round).** Probe 27 still reproduces; café.txt is raw UTF-8 and
  matches the indexer's `readdir` key. The round-9 diff does not touch it.
- **The `x => y.txt` → `miner_unparsed_numstat` case — SURVIVES.** Executed: the
  rename field is `x => y.txt => z.txt`; splitting on ` => ` yields three parts,
  genuinely un-splittable, correctly routed to the diagnostic and never guessed.
  The `Fails when` clause ("the `x => y.txt` multi-arrow field is not recorded as
  `miner_unparsed_numstat`", `:7893–7894`) is honest.
- **New-side-quoted rename detection (`plainsrc.txt => "a\\b.txt"`) — SURVIVES.**
  A pure `git mv` from a plain-named source (0/0 delta) is detected as a rename
  under `-M`, old side unquoted, new side quoted — so splitting on ` => ` then
  C-unquoting the new identity is correct for the three planted renames.
- **Q56, the diagnostics catalog, and §11.4 evidence — internally consistent
  with the change** (setting aside the M1 completeness claim they inherit).

## The plan's own tooling, re-run by me

- `run-plan-probes.mjs` → all **28** probes `ok`; "all probes match their
  recorded expectations" (incl. `24`, `27`, and the new `28`), git 2.43.0 / Node
  v22.22.2.
- `derive-plan-sections.mjs --check` → `OK: 40 steps, 13 elements, 124 test
  specs, 28 probes cited, regions current`.
- `derive-plan-sections.mjs --self-check` → `self-check passed: 34 checks`.
- `python3 tools/check_docs.py` → `context-oracle doc-consistency check passed.`

All four mechanical gates are green — which is exactly why dominating rule 3
demands the goal question be asked separately: a mechanism can pass every gate
and still assert a completeness it does not have.

## Verdict

**NEEDS FIXES — one Moderate (M1), two Minor (m2, m3).** The decode *primitive*
is sound: I reproduced probe 28 byte-for-byte, and the café.txt,
new-side-quoted-rename, and multi-arrow cases are handled honestly, so no
individual executed claim in the probe or evidence text is false. But the
decision STATUS flagged for this pass — decode over skip — does not cleanly
survive the collapse test. Because git quotes rename identities independently, a
field can begin with `"` and be a rename (CASE D) and a *quoted* field can carry
` => ` (CASE C); the plan's flat `contains ' => '` / `begins with '"'` rules
cannot distinguish them, and its explicit claim that "the one field the miner
cannot resolve is an **unquoted** path" is falsified by execution — a faithful
implementation of the plan-as-written silently mis-keys CASE C into a bogus
co-change pair, reintroducing the S1 class the seam exists to prevent, while the
fixture (claiming "honestly populated" path-encoding partitioning) plants neither
discriminating shape. That is Moderate under this project's honest-floor standard
even though the triggering filenames are near-nonexistent on the real corpus —
which itself is the tell that the decode design's completeness benefit over the
simpler reviewer-recommended skip is largely unrealized. The two Minor items are
an unexercised `newline` decode class (m2) and the unstated bytes→string decode
the miner needs to key against the string-typed `files.path` (m3). All three are
confined to Step 13, the `miner_unparsed_numstat` catalog entry, T-13-1, and
probe 28; each closes with a precise, executable edit (specify the quote-aware
tokenizer + plant CASE C/CASE D and correct the "unquoted-only" claim — or revert
to the uniform skip; exercise the newline class; state the UTF-8 decode).
