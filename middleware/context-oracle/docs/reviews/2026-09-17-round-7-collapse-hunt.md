# Round 7 — Independent collapse-hunt of the `core.quotePath` fix in `docs/plans/plan-phase-a.md`

**Date:** 2026-09-17
**Artifact under review:** the round-6-S1 fix applied to `docs/plans/plan-phase-a.md`,
plus its new probe `docs/plans/plan-phase-a.probes/27_git_numstat_quotepath.sh`
and expected output `.../expected/27_git_numstat_quotepath.txt`.
**Baseline:** `033f5de` (the plan revision round 6 reviewed).
**Nature:** An independent adversarial collapse-hunt under `CLAUDE.md` dominating
rule 2. I did not author this change. Every load-bearing git behavior I report
was executed in this environment (git 2.43.0) — the probe's recorded expectation,
a prior round's "verified", and the plan's prose were not accepted as evidence
until I reproduced them myself.

## What the change is

Round 6's S1 found the co-change miner read `git log --numstat` path fields
verbatim, so git's default `core.quotePath` (ON) silently mis-keyed every
non-ASCII path into `cochange_pairs` under a C-quoted, octal-escaped string that
never joins the indexer's raw path. This change applies S1's concrete fix:

- §2 (`:92`) and Step 13 (`:2123`) now run `git -c core.quotePath=false log
  --no-merges --numstat -M --format=%H%x00%at%x00 <watermark>..HEAD`.
- Step 13 (`:2132-2144`) routes any path field — or either rename identity —
  that *still* begins with a double-quote (git C-quotes a literal `"`, `\`, tab,
  or newline even under `core.quotePath=false`) to the existing
  `miner_unparsed_numstat` diagnostic, and states `-z` is declined because the
  record framing already spends `%x00` on the `--format` header.
- §6 diagnostics (`:1354-1357`) extends `miner_unparsed_numstat` to "a field
  still C-quoted under `core.quotePath=false`."
- §11.4 (`:7141-7151`) adds the executed claim and evidence for probe 27.
- T-13-1 (`:7834-7848`) adds a `café.txt` case to the `miner-hygiene` fixture and
  two new "Fails when" clauses.
- Q56 (`:9841-9849`) is updated to the `core.quotePath=false` reading.

## What I executed (summary)

1. Ran probe 27 — output is **byte-for-byte** the committed expectation, on
   git 2.43.0 (the version the §11.4 claim names).
2. Reproduced git's rename output under `core.quotePath=false` for a path that
   still needs quoting (`a\b.txt`): git prints `"a\\b.txt" => "a\\c.txt"` — each
   identity quoted **separately**, so after splitting on ` => ` each identity
   begins with `"` and the plan's "either rename identity … begins with a
   double-quote" detector catches it. Non-ASCII renames (`café.txt => résumé.txt`)
   and the brace form (`{src => other}/café.txt`) come through raw. The detector
   is sound.
3. Tested the one residual the fix's "raw UTF-8 … matching the indexer's readdir
   key" wording glosses (a genuinely non-UTF-8 byte, `bad\xff.txt`): git under
   `core.quotePath=false` emits the raw `0xFF` **unquoted**, and Node's `readdir`
   maps it to U+FFFD — but the miner, reading git's stdout as UTF-8 too, produces
   the **same** U+FFFD, so both sides converge on one identical (mangled) key.
   No silent loss; not a defect. Recorded so the record is auditable.
4. Ran the plan's own gates: `run-plan-probes.mjs` (all **27** probes `ok`,
   including 27), `derive-plan-sections.mjs --check`
   (`OK: 40 steps, 13 elements, 124 test specs, 27 probes cited, regions current`),
   `python3 tools/check_docs.py` (`passed`).
5. Grepped every `--numstat` mention: no stale copy of the pre-fix bare command
   survives; §2 and Step 13 carry the identical `-c core.quotePath=false` form.
   The two remaining bare `git log --numstat` strings (`:7133`, `:7141`) are
   §11.4 *claim* sentences describing git's behavior, not the miner's invocation.

The fix is correct and well-evidenced: it resolves S1 for the dominant case
(valid-UTF-8 non-ASCII paths, common in any repo with international
contributors) and the resolution is tested by the `café.txt` fixture case. I
found one Moderate coverage gap and one Trivial precision nit, below.

---

### M1 — The residual-quote branch is asserted but no fixture input reaches it, so T-13-1's new guard is inert

**Location.** T-13-1 fixture "Data" `:7825-7838` and "Fails when" `:7846-7848`;
Q56 `:9841-9849`; the branch itself at Step 13 `:2132-2137`.

**The claim under attack.** The change introduces a **new** logic branch: a path
field, or either rename identity, that begins with a double-quote under
`core.quotePath=false` (i.e. a path containing a literal `"`, `\`, tab, or
newline that git still C-quotes) is skipped with `miner_unparsed_numstat`,
"never guessed" (`:2132-2137`). T-13-1 asserts this branch — "**Fails when** …
any C-quoted or escaped path field — one beginning with a double-quote — lands in
`files` or `cochange_pairs` instead of being recorded as `miner_unparsed_numstat`"
(`:7846-7848`) — and Q56 claims T-13-1 verifies it: "either rename identity still
C-quoted (one beginning with a double-quote), is skipped with
`miner_unparsed_numstat` … (`T-13-1` plants both shapes)" (`:9847-9849`).

**What breaks it.** The `miner-hygiene` fixture "Data" (`:7825-7838`) plants,
newly, exactly **one** encoding case: `café.txt`. Under `core.quotePath=false`
`café.txt` is emitted as **raw UTF-8** — it does *not* begin with a double-quote,
so it exercises the *literal-path* branch (counted correctly), never the
residual-quote *skip* branch. The fixture plants **no** path whose bytes remain
C-quoted under the flag — no `"`, `\`, tab, or newline in any planted path, and
no quote-needing rename identity. I confirmed this against the git behavior in
person: only such characters trigger residual quoting, and `café.txt` has none.

Therefore git never emits a quoted field while running this fixture, the miner
never sees one, and the "Fails when … C-quoted … lands in `files` or
`cochange_pairs`" clause is **vacuously satisfied** — it can never fail. The new
branch (and the Q56 "plants both shapes" claim about rename identities) is
asserted-but-unexercised. If that branch were mis-implemented — storing the
quoted string instead of routing it to `miner_unparsed_numstat` — T-13-1 would
still pass. That is the same failure class round-6 S1 named (a quoted path taken
as a literal), just narrowed to `"`/`\`/tab/newline paths, left **unverified**.

**Why it fails the standard.** By the plan's own words this is coverage theater:
`:4465` names "a missing or silently skipped test — coverage theater" as the
Impact-if-wrong of the test tier, and dominating rule 1 forbids claiming
something works without the input that exercises it. The Phase A goal is an
honest floor that "never [fakes] completeness dressed to look like a working
product" — a guard that reads as coverage but verifies nothing is exactly that.
Round-6 S1's concrete fix said in as many words: "Add a non-ASCII **(and ideally
a control-char) filename** to the `miner-hygiene` fixture." The non-ASCII half
was applied; the control-char/quote half — the one that actually reaches the new
branch — was dropped, yet the assertion for it was written as though it were
present.

**Concrete fix.** Plant in `miner-hygiene` one path that stays C-quoted under
`core.quotePath=false` — the probe's own `a\b.txt` (a literal backslash, legal on
the Linux CI and already exercised by probe 27) is sufficient — co-changing with
the planted pair's partner in one commit, and assert it is recorded as
`miner_unparsed_numstat` and absent from `cochange_pairs`. The existing
"Fails when" clause and the Q56 "plants both shapes" claim then have teeth. A
quote-needing rename identity (e.g. rename `a\b.txt`) would additionally cover
the rename-identity half of the branch.

**Severity.** Moderate, not Serious: the deliverable-dominant case (all
valid-UTF-8 non-ASCII paths) is fixed *and* tested by `café.txt`, and Step 13's
stated blast radius is "contained to history genres … they stay silent." The
unverified branch touches only paths containing `"`, `\`, tab, or newline — rare
— and its worst failure is a diagnosed skip or a silent mis-key of those rare
paths. Real, but narrow. Moderate.

---

### T1 — Step 13 presents the residual-quote skip before the rename split it partly depends on

**Location.** Step 13 `:2132-2144`.

**Observation.** The prose states the residual-quote skip — "any path field — or
either **rename identity** — that still begins with a double-quote … is skipped"
(`:2134-2137`) — **before** the sentence that defines how a rename field is split
into identities (`:2137-2142`). An implementer executing the plan "without making
a single decision on the fly" (the expert-plan standard) must read both sentences
and infer the execution order: detect and split the rename first, *then* apply
the leading-quote check to each identity. The information is complete and
derivable — this is not an ambiguity that yields a wrong implementation — but it
is presented back-to-front for a document whose job is to be executed
step-by-step. Reordering the two sentences (rename split first, quote check
after) removes the micro-inference. Trivial; cheap to fix; noted for precision,
not as a defect.

---

## Decisions I attacked and could not break (executed evidence)

- **`core.quotePath=false` as the key-alignment mechanism — SURVIVES.**
  Step 1 (mission job): count true co-change keyed on the path the agent will
  actually see. Step 2 (hardest question): does the flag *guarantee* the miner's
  key equals the indexer's key for every path, or just move the mismatch? Answer:
  for bytes ≥ 0x80 both sides become raw UTF-8 and match (probe 27, executed);
  for `"`/`\`/tab/newline the miner **skips with a diagnostic** rather than
  emitting a wrong key, so the mismatch is converted to a *loud* loss, never a
  silent one — which is the honest floor the Phase A goal mandates, not fake
  completeness. It is a guide (the miner records what it cannot key), not a gate.
  Cited to the Phase A goal and Step 13 "Impact if wrong." No collapse.

- **The rename-identity detector — SURVIVES.** I falsified the worry that a
  quote-needing rename might defeat the "either identity begins with a
  double-quote" check. Git prints `"a\\b.txt" => "a\\c.txt"` (identities quoted
  independently, each beginning with `"`), and even a whole-field quoting of a
  braced move begins with `"`; splitting on ` => ` leaves at least one identity
  beginning with `"`, which routes to `miner_unparsed_numstat`. The detector is
  robust across the shapes I could produce.

- **The `-z` rejection — SURVIVES.** Declining `-z` is a legitimate design
  choice (S1 offered it as one of two options); the stated reason — `%x00` is
  already the `--format` field separator, and the parse is line-by-line — is
  sound. (`-z` would additionally recast renames as two NUL-separated fields,
  breaking the probe-24 ` => ` parse; the plan's reason is adequate without
  invoking this.)

- **Invalid-UTF-8 residual — considered, not a finding.** git emits a genuinely
  non-UTF-8 byte unquoted under the flag, and Node's `readdir` lossily maps it to
  U+FFFD; but the miner decoding git's stdout as UTF-8 produces the *same*
  U+FFFD, so both sides converge on one identical mangled key. No silent loss.
  The plan's "raw UTF-8" wording is a slight misnomer for such bytes, but the
  mechanism is correct; not worth a finding.

## The plan's own tooling, re-run by me

- `run-plan-probes.mjs` → all **27** probes `ok`; `all probes match their
  recorded expectations`. Probe 27 reproduces byte-for-byte on git 2.43.0.
- `derive-plan-sections.mjs --check` → `OK: 40 steps, 13 elements, 124 test
  specs, 27 probes cited, regions current`.
- `python3 tools/check_docs.py` → `context-oracle doc-consistency check passed.`

## Verdict

**NEEDS FIXES — one Moderate (M1).** The round-6 S1 defect is genuinely resolved
for the deliverable-dominant case: the miner now keys non-ASCII paths on raw
UTF-8, the git behavior is independently reproduced, the command form is
consistent across §2 and Step 13, the invalid-UTF-8 residual converges harmlessly,
and all three mechanical gates pass. But the change also introduced a new
residual-quote → `miner_unparsed_numstat` branch and wrote T-13-1 and Q56 as
though it were tested, while the fixture plants no input that reaches it (M1). The
fix is small — plant one backslash-bearing path (`a\b.txt`) co-changing with the
pair's partner and assert the diagnostic. T1 (prose ordering) is optional
precision. No collapsed decision: the `core.quotePath=false` design itself
survives the hunt.
