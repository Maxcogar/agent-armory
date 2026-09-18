# Round 12 — Independent post-fix expert-review of `docs/plans/plan-phase-a.md`

**Date:** 2026-09-18
**Reviewer:** independent fresh session. I did not author this plan, the round-10
`-z` switch, the round-11 Record-Separator framing, the round-11 fix now under
review, or any prior round or review. The round-11 findings
(`2026-09-18-round-11-expert-review.md`, NEEDS FIXES: 1 Moderate M1;
`2026-09-18-round-11-collapse-hunt.md`, NEEDS FIXES: 1 Serious S1 + m1 + m2) are
treated as **closure candidates re-derived from current source and re-executed**,
not trusted by reference.
**Artifact under review:** the round-11 fix as installed in the working tree,
diffed against `45415e1` (the round-10 `-z`/RS-split fix that round-11 reviewed),
scoped to the three files the task named:
- `docs/plans/plan-phase-a.md` — the co-change miner (Step 13, `:2123–2172`),
  §11.4 probe-24 evidence (`:7149–7162`), T-13-1 (`:7838–7885`), Q56
  (`:9878–9894`).
- `docs/plans/plan-phase-a.probes/24_git_numstat_z.mjs` — the reference parser
  rewritten from a **`\x1e`-Record-Separator split** to a **whole-stream NUL
  split with structural (`\x1e`+40-hex) header detection**, and a new
  `we<0x1e>ird.txt` path class planted.
- `docs/plans/plan-phase-a.probes/expected/24_git_numstat_z.txt` — its golden.
**Nature:** a **re-review** under the expert-review Re-Review Protocol. Round-11
returned NEEDS FIXES on the round-10 RS-split framing (a raw `0x1e` in a filename
leaks past the Record Separator and silently fabricates co-change data); commit
`2480772` is the fix. Both re-review scopes are exhausted below.
**Standards this review evaluates against:** the changed step's own named sources —
`AD-13` (miner: an unresolved field is "recorded … never guessed"); T-13-1's named
technique (**equivalence partitioning over raw path classes**); the **Phase A
honest-floor goal** (spec §11.5 / `CLAUDE.md` dominating rule 3: an *honest*
deterministic floor that "never fake completeness dressed to look like a working
product," and whose corpus Phase B and the regression fixtures are designed from);
`CLAUDE.md` dominating rule 1 and the agent-armory standing rule ("**Verify before
you assert**") — never state that a check was run or an artifact demonstrates
something without having established it; and the expert-plan **build-contract**
standard ("another engineer can execute step by step without making a single
decision on the fly," and every evidence citation names an artifact that actually
shows what is claimed).

---

## Scope and Inventory

Per the Re-Review Protocol the inventory carries both scopes.

### Scope 1 — Round-11 findings as closure items

- [x] **Round-11 M1 (Moderate) / collapse-hunt S1 (Serious)** — the RS is falsely
  asserted to be "a byte git never emits inside a path"; a raw `0x1e` in a filename
  is emitted raw under `-z`, leaks past the RS-split, and silently mis-keys the path
  (and fabricates a co-change pair) with no `miner_unparsed_numstat` diagnostic.
  **Closure verified** by Read of Step 13 (`:2141–2159`), Q56 (`:9885–9890`), §11.4
  (`:7149–7162`), and by **direct re-execution** (below) reproducing round-11's exact
  fabricated-pair scenario against the new parser.
- [x] **Round-11 collapse-hunt m1** — T-13-1's equivalence partition omits the one
  member (`0x1e`-in-path) that breaks the framing, so the test bed would go green on
  a fabricating miner. **Closure verified** by Read of T-13-1 (`:7849–7855`,
  `:7878–7880`).
- [x] **Round-11 collapse-hunt m2** — the parser must key on record *structure*, not
  a magic byte. **Closure verified** by Read of the probe parser (`:63–93`), Step 13
  (`:2144–2149`), and adversarial execution.

### Scope 2 — Fix-diff files (new-findings detection)

- [x] `docs/plans/plan-phase-a.md` — Read `:2130–2172` (Step 13), `:7146–7167`
  (§11.4), `:7838–7885` (T-13-1), `:9878–9894` (Q56). Stale-claim sweep (Systemic
  section): `grep -n "never emits\|inside a path\|split the stream\|Record Separator"`
  → the old false universal is **gone**; every surviving `Record Separator` mention
  is the corrected structural-framing prose.
- [x] `docs/plans/plan-phase-a.probes/24_git_numstat_z.mjs` — Read in full (121
  lines); **executed**; its `parseZ` copied verbatim and driven against an
  independent adversarial repo (multi-commit stream, a co-change with a partner, a
  path that is exactly `\x1e`+40-hex, and a rename to a `0x1e` name); run through the
  plan's own runner (`run-plan-probes.mjs --only 24_git_numstat_z` → `ok`). Removed
  `mkdirSync` import verified unused (`grep -c mkdirSync` → 0).
- [x] `docs/plans/plan-phase-a.probes/expected/24_git_numstat_z.txt` — Read (6
  lines); reproduced by execution byte-for-byte.

### Instruments used (per claim type)

| Claim type | Instrument | Result |
|---|---|---|
| Literal plan/probe text ("line N says Z") | Read at file:line, at drafting time | recorded above |
| git `-z --numstat` byte behaviour (raw `0x1e` in path, rename framing, header shape) | **direct execution**, git 2.43.0 | pasted below |
| New parser correctness (single- and multi-commit, co-change, `\x1e`+40-hex path, rename-to-`0x1e`) | **executed** the parser verbatim on an adversarial repo | pasted below |
| Probe ↔ golden ↔ plan citation wiring | `run-plan-probes.mjs --only`; `derive-plan-sections.mjs --check`; `check_docs.py` | all green |

Context7 was not required: the load-bearing category is git's on-disk `-z --numstat`
byte stream and a JS parser, both verified by execution (stronger than a docs
lookup). No instrument class was unavailable. **Environment:** git 2.43.0, Node
v22.22.2 — the exact versions the probe evidence names.

## Summary

**This review returns NEEDS FIXES.** All three round-11 findings are genuinely and
fully closed: the false universal ("git never emits `0x1e` inside a path") is
removed at every surface; the parser is reframed from a blind `\x1e`-split to a
whole-stream **NUL** split with a **structural** header test (a field is a commit
header only when it is exactly `\x1e`+40-hex), which is the m2-recommended fix and
restores a *true* completeness claim; and T-13-1 now plants the `we<0x1e>ird.txt`
class with a `Fails when` clause that its path must be recorded whole, never cut
into a fabricated pair. I confirmed closure by re-running round-11's exact
fabricated-pair scenario against the new parser: a commit co-changing
`we<0x1e>ird.txt` with `partner.txt`, in a multi-commit stream, is now recorded as
the pair `["partner.txt","we\x1eird.txt"]` with no fabricated `we` key and no
phantom-hash record — even for a path that is *exactly* `\x1e`+40-hex and for a
rename whose new name carries a `0x1e`. This is a real, structural close, not a
documented floor. **But the fix introduces one new Moderate defect of the same
class the project polices hardest:** Step 13's evidence parenthetical (`:2150–2152`)
asserts that `probe:24_git_numstat_z` "plants `we<0x1e>ird.txt` **co-changing with a
partner**" — a claim about executed evidence that is false. The probe's `RAW_rs`
commit (`:43`) plants that file **alone**, with no partner; its own output is `ids=1
[we\x1eird.txt]` (one path), and the sentence's own tail ("records it as the **one**
path") contradicts the "co-changing with a partner" it opens with. The
co-change-with-a-partner case lives in T-13-1 (`:7847`), a spec, and is
demonstrated by no executed probe — so the citation claims executed evidence the
probe does not carry. No Critical, Serious, or Systemic finding was introduced.

## Fixes-Closure Verification (Scope 1)

**Round-11 M1 / S1 (false RS claim + silent mis-key) — CLOSED.** The original
defect: under the round-10 framing the parser split the stream on the `\x1e` byte,
justified by the absolute "which git never emits inside a path," and a filename
containing a raw `0x1e` cut the record mid-path — recording `we` for
`we<0x1e>ird.txt` and injecting a phantom `ird.txt` record, with no diagnostic. The
fix (Read Step 13 `:2141–2149`): the false universal is replaced with the *true*
invariant — "NUL is the **only** byte a pathname cannot contain (git forbids NUL and
`/` … `0x1e` and every other control byte are legal and emitted raw under `-z`), so
the parser splits the stream on NUL"; a commit header is "a NUL field of the shape
`\x1e` followed by exactly 40 hex (`%H`)"; "a **path is never taken for a header** …
because a numstat entry field always begins with its `<added>` count and a rename's
old/new paths are consumed positionally." Q56 (`:9885–9890`) and T-13-1
(`:7853–7855`) carry the same corrected model. I did not trust the prose or the
probe golden — I copied the new `parseZ` verbatim and drove it against an
independent repo built this pass:

```
# git 2.43.0 — a raw 0x1e IS emitted raw inside the path field (the round-11 premise):
COCHANGE commit: we<0x1e>ird.txt + partner.txt in one commit
# new parser on the FULL multi-commit stream (not `-1`):
  total commits parsed: 6  (all six real; zero phantom-hash records)
  COCHANGE pair recorded: ["partner.txt","we\x1eird.txt"]
    contains whole we\x1eird.txt: true
    contains fabricated "we":     false
    any phantom-hash record:      false
# harder adversarial cases, all recorded whole:
  path == \x1e + 40×'a'  →  ["\x1eaaaa…(40)","p2.txt"]     (not mistaken for a header)
  rename src.txt -> ne<0x1e>w.txt  →  ["src.txt","ne\x1ew.txt"]   (two raw identities)
```

The structural header test is what makes this sound: a numstat entry field always
begins with its `<added>` count (a digit or `-`), never `\x1e`, so it can never
satisfy `isHeader` (`:63–67`); and a rename's two identities are consumed by
position (`:91`), never re-tested — so a path that *is* `\x1e`+40-hex, or *contains*
`0x1e`, survives intact. *Named standard (honest-floor + AD-13 "never guess") — met
for the class S1 named:* the mis-key is structurally eliminated, not documented as a
floor. This is the stronger of the two closes round-11 offered (dissolve, not
describe).

**Round-11 m1 (T-13-1 partition incomplete) — CLOSED.** T-13-1 now plants the
Record-Separator path (Read `:7849–7855`): "a **Record-Separator path**
(`we<0x1e>ird.txt`, whose name holds the very `0x1e` byte the commit framing uses …)
… the `0x1e` path in particular must be recorded **whole**, never cut by the record
framing into a fabricated pair," and its `Fails when` list (`:7878–7880`) adds "OR
the `we<0x1e>ird.txt` path is cut by the record framing into a fabricated pair or a
phantom entry (e.g. `we` and `ird.txt`) instead of the one whole path." The one
member that breaks the mechanism is now in the partition with an asserting
`Fails when`. Same named standard (equivalence partitioning over raw path classes)
as round-11's finding.

**Round-11 m2 (frame on structure, not a magic byte) — CLOSED.** The probe parser
no longer "splits on `\x1e`." It splits the whole stream on NUL (`:71`) and detects a
header by structure — `isHeader` requires length 41, `f[0] === RS`, and bytes 1–40
all lower-hex (`:63–67`). A leaked in-path `\x1e` is never a delimiter. Verified by
the adversarial run above and by Read of the parser.

## Critical & Serious Findings

No Critical or Serious findings — the full Scope-2 fix-diff (Step 13, §11.4,
T-13-1, Q56, the probe, and its golden) was Read, and every git-behaviour and
parser-correctness premise the change rests on was verified by direct execution of
git 2.43.0 and of the parser itself; no violation of Critical or Serious
classification was observed. The prior Serious closure (round-6 S1, the non-ASCII
mis-key) remains closed and strengthened — under `-z`, `café.txt` is emitted as its
raw UTF-8 bytes even with `core.quotePath` at its default on, keying on the same
bytes the indexer's `readdir` walk uses (probe line 1, executed: `fields == readdir
keys: true`).

## Systemic Patterns

No systemic patterns — verified by the stale-claim sweep across the changed plan
regions. `grep -n "never emits\|inside a path"` over `plan-phase-a.md` → the round-11
false universal is **absent**; the four surviving `Record Separator` mentions
(`:2144`, `:2145`, `:7151`, `:9888`) each state the corrected structural framing (RS
marks a header only as a `\x1e`+40-hex field), not a magic-byte split; the one
Moderate below is a single evidence-citation inaccuracy confined to one sentence of
Step 13, not a pattern propagated across surfaces — the parallel sentences in Q56
(`:9889`, "the probe plants `we<0x1e>ird.txt` and records it whole") and §11.4
(`:7160–7161`, "the `0x1e` path stays one field (not a fabricated pair)") describe
the probe **accurately**, and T-13-1's "co-changing with a partner" (`:7847`)
correctly describes the T-13-1 *fixture*, not the probe.

## Moderate & Minor Findings

### M1 (Moderate) — Step 13 cites `probe:24_git_numstat_z` as demonstrating a co-change-with-a-partner case that the probe does not contain; the co-change/fabricated-pair case is demonstrated by no executed probe

**What the plan says now.** Step 13 (Read `:2150–2152`): "A **path is never taken
for a header** … because a numstat entry field always begins with its `<added>`
count and a rename's old/new paths are consumed positionally, never rescanned
(`probe:24_git_numstat_z` plants `we<0x1e>ird.txt` **co-changing with a partner** and
records it as the **one path** `we<0x1e>ird.txt`, not a fabricated pair)."

**How this was verified.** Read of the probe (`24_git_numstat_z.mjs:43`): the
`RAW_rs` commit is `wr('we\x1eird.txt', 0x4a); git('add','-A'); git('commit',…,
'RAW_rs')` — it writes and commits **one** file; no partner is written or staged in
that commit (the other special-byte commits at `:38–41` are likewise single-file).
Executed: the probe prints `0x1e-in-path 'we\x1eird.txt': ids=1 [we\x1eird.txt]`
(`pathsFor('RAW_rs')`, which filters out `anchor.txt`, returns **one** id — had a
partner co-changed in that commit it would return two). The claim "co-changing with a
partner" is therefore false about the probe, and the sentence is internally
inconsistent — a genuine co-change would be recorded as **two** paths, not the "one
path" the same sentence asserts. The co-change-with-a-partner fixture lives in
T-13-1 (`:7847`, "each co-changing with the planted pair's partner in one commit"),
which is a *spec*, not executed evidence; no probe under `run-plan-probes.mjs`
exercises the fabricated-**pair** case. (I confirmed the parser handles that case
correctly, but by *my* out-of-band execution, not by any cited probe.)

**Which standard it violates and why.** `CLAUDE.md` dominating rule 1 and the
agent-armory standing rule ("Verify before you assert … Never state that something
is … verified, applied … until you have just run the check that actually
establishes it, and then report only what you observed"), and the expert-plan
build-contract standard (an evidence citation must name an artifact that actually
shows what is claimed). The parenthetical presents executed evidence
(`probe:24_git_numstat_z`) for the precise case round-11's finding was about — a
`0x1e` path **co-changing with a partner** not becoming a fabricated pair — but the
probe does not set up a co-change and does not demonstrate a pair at all; it
demonstrates only that a single-file `0x1e` path is recorded whole. A reader
auditing whether the round-11 defect is closed by *executed* evidence is pointed at
a probe that does not carry that evidence. That the underlying fix is nonetheless
correct does not rescue the citation: the defect is the mismatch between the claimed
and the actual evidence, which is exactly the failure class this project names its
most damaging.

**What correct implementation looks like (either closes it).**
- *Match the sentence to the probe:* replace "plants `we<0x1e>ird.txt` co-changing
  with a partner and records it as the one path … not a fabricated pair" with an
  accurate description — the probe plants `we<0x1e>ird.txt` (its own commit) and
  records it as the one whole path `we<0x1e>ird.txt`, proving the RS byte is not
  taken for a header nor cut mid-path — and, if the co-change/pair guarantee is to be
  cited, point it at T-13-1's fixture (naming it as the *test spec*, not executed
  evidence), as Q56 (`:9889`) and §11.4 (`:7160`) already do accurately.
- *Or make the probe carry the claim:* add a partner file to the `RAW_rs` commit and
  assert the recorded pair is `(partner, we<0x1e>ird.txt)` (never `(partner, we)` +
  phantom) in the golden — then the Step 13 citation becomes true as written and the
  fabricated-pair case gains executed coverage, closing the gap between the plan's
  claim and its evidence.

**Why Moderate and not Minor or Serious.** More than Minor: it is not style or
convention but a **false factual claim about what executed evidence shows**, in a
build-contract plan, about the very case the prior finding concerned — degrading the
plan's evidentiary quality in the register the project polices hardest. Not Serious:
the fix itself is correct (verified by execution), T-13-1 correctly specifies the
co-change test the implementation must pass, and the two parallel surfaces describe
the probe accurately — so no wrong behaviour or wrong build decision follows; the
defect is the inaccurate citation alone.

**Classification.** Moderate. **Provenance.** Introduced by this fix (the entire
parenthetical is new in the `2480772` diff).

No Minor findings — verified by Read of all four changed plan regions, the full
probe, and its golden. One observation not rising to a finding: the probe's
malformed-record guard (`parts.length < 3 → cur.bad`, `:89`) and the resulting `bad`
flag are never asserted in the probe's output — the probe exercises the path-content
classes, not the `miner_unparsed_numstat` path — but the probe's own header comment
(`:1–18`) scopes it to the path classes, and T-13-1 (`:7861–7864`) carries the
malformed-record test for the implementation, so the build-contract decision is made
elsewhere and the probe is not claimed to cover it.

## Tentative Findings

No tentative findings — every premise above was verified against current source at
drafting time: plan and probe text by Read at file:line; git's `-z --numstat`
handling of a raw `0x1e` path (and of `\x1e`+40-hex paths and renames to `0x1e`
names) by direct execution of git 2.43.0 on repos built this pass; the new parser's
single- and multi-commit correctness by running its verbatim copy on an independent
adversarial repo; the probe ↔ golden ↔ plan wiring by `run-plan-probes.mjs --only`
(`ok`), `derive-plan-sections.mjs --check` ("26 probes cited, regions current"), and
`check_docs.py` ("passed"). Nothing rests on memory, on either round-11 review's
assertions, or on the probe's golden by reference.

### Executed evidence grounding this review (git 2.43.0, Node v22.22.2)

```
# CLOSURE — round-11's fabricated-pair scenario against the NEW parser (verbatim copy):
  COCHANGE (we<0x1e>ird.txt + partner.txt, multi-commit stream):
     recorded pair = ["partner.txt","we\x1eird.txt"]   whole=true  "we"=false  phantom=false
  path == \x1e+40hex        →  recorded whole, not a header
  rename -> ne<0x1e>w.txt   →  ["src.txt","ne\x1ew.txt"]   (two raw identities)

# PROBE — official runner and manual run:
  run-plan-probes.mjs --only 24_git_numstat_z   →  ok 24_git_numstat_z ; all probes match
  node 24_git_numstat_z.mjs | diff - expected/24_git_numstat_z.txt   →  (no diff)
     0x1e-in-path 'we\x1eird.txt': ids=1 [we\x1eird.txt]     ← one path (single-file commit; no partner)

# STATIC checkers:
  derive-plan-sections.mjs --check → OK: 40 steps, 13 elements, 124 test specs, 26 probes cited, regions current
  check_docs.py                    → context-oracle doc-consistency check passed.
```

## What's Actually Good

- **The parser was reframed from a magic-byte split to a structural header test,
  restoring a true completeness claim.** *Property:* the stream is split on NUL (the
  one byte a path cannot hold) and a header is recognized only as a `\x1e`+40-hex
  field, so every path — including one that is exactly `\x1e`+40-hex or a rename to a
  `0x1e` name — is recorded whole. *Standard:* honest-floor (eliminate the failure
  mode rather than document it) + expert-plan premise-grounding. *Verified:* the
  verbatim-copy adversarial run above (co-change, multi-commit, `\x1e`+40-hex,
  rename-to-`0x1e`), all correct; Read of `isHeader`/`parseZ` (`:63–93`).
- **The round-11 false universal was removed at every surface, and replaced with the
  invariant that is actually true.** *Property:* no surface still claims git cannot
  emit `0x1e` in a path; Step 13, Q56, §11.4, and T-13-1 all state that `0x1e` is
  legal and emitted raw, and that NUL is the sole impossible byte. *Standard:*
  dominating rule 1 / verify-before-assert. *Verified:* `grep` (old claim absent;
  surviving RS mentions are the corrected framing) + Read of the four regions.
- **The probe's class assertion was strengthened to catch a silently-dropped
  partition.** *Property:* line 1 now asserts `rawCases === onDisk === want` (`:109–
  112`) — a triple equality that fails if any planted class is missing on disk or
  from the parse, not merely if the two agree with each other. *Standard:*
  test-completeness (a partition check that cannot pass by both sides dropping the
  same member). *Verified:* Read of `:107–112`; executed (`fields == readdir keys:
  true` over all five classes including `we\x1eird.txt`).

## Recommended Priority

Fix M1 before this plan is used as a build contract. The lowest-cost close is to make
Step 13's parenthetical (`:2150–2152`) describe what `probe:24_git_numstat_z`
actually does — plant `we<0x1e>ird.txt` in its own commit and record it as the one
whole path — and cite T-13-1 (`:7847`) as the *spec* for the co-change/pair case, the
way Q56 and §11.4 already cite the probe accurately. The stronger close — add a
partner to the probe's `RAW_rs` commit and assert the pair in the golden — makes the
sentence true as written and gives the fabricated-pair case executed coverage;
worthwhile, since that pair case is the exact defect round-11 found and it is
currently proven by no cited probe.

## Verdict

Verdict: NEEDS FIXES (1 finding: 1 Moderate)
