# Round 8 — Independent collapse-hunt of the round-7 M1 fix in `docs/plans/plan-phase-a.md`

**Date:** 2026-09-17
**Artifact under review:** the round-8 change to `docs/plans/plan-phase-a.md`, diffed
against `ab319a3`. The diff touches only the plan (`docs/plans/plan-phase-a.md`);
no probe file changed.
**Baseline:** `ab319a3` (the revision the round-7 expert-review reviewed and
returned NEEDS FIXES / 1 Moderate on).
**Nature:** An independent adversarial collapse-hunt under `middleware/context-oracle/CLAUDE.md`
dominating rule 2. I did not author this change. Every load-bearing git behavior I
report was executed by me in this environment (git 2.43.0 — the version §11.4
names) and is pasted below; the plan's prose, the recorded probe expectations, and
the prior rounds' "verified" claims were not accepted as evidence until I
reproduced them myself.
**Standards this review evaluates against:** the plan's own named sources for the
changed step — `AD-13` (miner: "each exclusion recorded … never guess"), the
test's own named technique (equivalence partitioning over "path encodings",
`:7842`), dominating rule 1 (never claim a branch works without the input that
exercises it), and the Phase A goal (spec §11.5: an *honest* deterministic floor,
"never fake completeness dressed to look like a working product").

---

## What the change is

Round 7 (both the collapse-hunt and the independent expert-review) converged on one
Moderate, **M1**: the S1 fix added a residual-quote → `miner_unparsed_numstat`
safety branch and wrote T-13-1's `Fails when` guard and Q56 as though it were
tested, but the `miner-hygiene` fixture planted only `café.txt` — raw UTF-8 under
`core.quotePath=false`, never a field beginning with `"` — so the guard passed
vacuously and the branch shipped untested. The expert-review sharpened it with the
**rename door**: an implementer who tests the *whole field's* first char instead of
each split identity would store a quoted new-side identity verbatim and T-13-1 would
still pass.

This round-8 change:

1. **T-13-1 fixture Data (`:7836–7841`).** Adds "one file renamed to a residually
   C-quoted path (`a\b.txt`, which git C-quotes as `"a\\b.txt"` even under
   `core.quotePath=false`, so `--numstat` prints the rename with its new identity
   beginning with a double-quote) in a commit that also touches the planted pair's
   partner — reaching the residual-quote skip on a rename identity."
2. **Step 13 / §11.4 prose (`:2133–2144`).** Reorders the residual-quote sentence to
   *after* the rename-split explanation (this is round-7 **T1**, applied).
3. **Q56 (`:9854`).** Updated to "`T-13-1` plants both rename shapes and a residually
   C-quoted rename."

## What I executed (load-bearing)

The entire fix rests on one git-behavior claim: that a rename *to* `a\b.txt`
prints, under the miner's exact invocation, with its **new identity** beginning
with a double-quote while the **field as a whole does not** — which is the only
shape that discriminates the correct per-identity implementation from the
whole-field-first-char implementation that reintroduces S1. I reproduced it (git
2.43.0):

```
$ git init -q; git config user.email t@t; git config user.name t
$ printf 'line1\n...\nline5\n' > renamesrc.txt; printf 'partnerX\n' > partner.txt
$ git add -A && git commit -qm c0
$ git mv renamesrc.txt 'a\b.txt'
$ printf 'partnerX changed\n' > partner.txt
$ git add -A && git commit -qm c1
$ git -c core.quotePath=false log --no-merges --numstat -M --format= -1 | cat -A
0^I0^Irenamesrc.txt => "a\\b.txt"$      # rename detected (0/0 delta); FIELD begins with 'r', NEW identity with '"'
1^I1^Ipartner.txt$
```

Confirmed:
- The move **is** detected as a rename (`=>`, not delete+add) even with zero content
  delta, under `-M` — so the fixture reaches the *rename* branch, not the plain-add
  branch, when generated as a `git mv` from a plain-named source.
- The **field** `renamesrc.txt => "a\\b.txt"` does **not** begin with `"`; only the
  split **new identity** `"a\\b.txt"` does. This is exactly the rename-door
  discriminator: a whole-field-first-char miner would fail to skip it and store
  `"a\\b.txt"` in `cochange_pairs` (T-13-1 fails → bug caught); a per-identity miner
  skips it to `miner_unparsed_numstat` (T-13-1 passes).

I also reproduced the **plain (non-rename)** shape, which bears on m1 below:

```
$ printf 'content\n' > 'c\d.txt'; git add -A && git commit -qm c2
$ git -c core.quotePath=false log --no-merges --numstat -M --format= -1 | cat -A
1^I0^I"c\\d.txt"$                        # a plain ADD of a backslash path: standalone field begins with '"'
```

**Mechanical gates, re-run by me:**
- `run-plan-probes.mjs` → all **27** probes `ok`, "all probes match their recorded
  expectations" (incl. `24_git_numstat_rename`, `27_git_numstat_quotepath`), git 2.43.0.
- `derive-plan-sections.mjs --check` → `OK: 40 steps, 13 elements, 124 test specs,
  27 probes cited, regions current`.
- `python3 tools/check_docs.py` → `context-oracle doc-consistency check passed.`

---

## The core decision — collapse test (SURVIVES)

**Decision.** Close round-7 M1 by planting a residually-C-quoted **rename** in
`miner-hygiene`, so the residual-quote → `miner_unparsed_numstat` branch is exercised
through the rename door.

1. **Job (mission terms).** Prove the miner never silently mis-keys a path git still
   C-quotes under `core.quotePath=false` — keeping the Phase A floor honest for the
   exact input class S1 named, *including* the rename door the expert-review
   demonstrated.
2. **Hardest skeptic question.** Does the new fixture input actually reach the skip
   branch, and does it discriminate the correct per-identity implementation from the
   whole-field implementation that reintroduces S1 — or is it another guard nothing
   can trigger?
3. **Answer (cited + executed).** It reaches and discriminates. Executed above: the
   fixture line `renamesrc.txt => "a\\b.txt"` has a field that does not begin with
   `"` and a new identity that does; only a per-identity leading-`"` test skips it,
   so the guard now fails a whole-field implementation. Cited to the Phase A goal
   (honest floor, spec §11.5) and Step 13's "never guessed" rule (`:2143–2144`).
4. **Guide, not gate.** The branch *records* what it cannot key
   (`miner_unparsed_numstat`, a visible floor count), never blocks. Confirmed.

**No collapse.** The core M1 defect — the rename-door reintroduction of S1 — is
genuinely closed and independently verified. Round-7 **T1** (residual-quote sentence
ordered before the rename split it depends on) is also applied: `:2133–2140` now
defines the rename split before `:2140–2144` applies the leading-`"` check. Q56's
new wording ("a residually C-quoted **rename**") is honest — it does not claim a
plain-field case is planted, so there is no overclaim to charge.

---

## Findings

### m1 — The prose rule covers "any path field OR either rename identity"; the fixture now exercises only the rename identity, leaving the plain (non-rename) residually-quoted field unexercised

**Location.** Rule: Step 13 `:2140–2144` ("**any path field** — or either rename
identity — that still begins with a double-quote … is skipped"). Fixture: T-13-1
Data `:7836–7841`; `Fails when` `:7851–7853`. Technique claim: "equivalence
partitioning over … path encodings" `:7842`.

**The claim under attack.** The miner's residual-quote rule has **two** shapes: (a) a
**plain path field** that begins with `"` (a non-rename add/modify of a C-quoted
path), and (b) a **rename identity** that begins with `"`. The round-8 fixture plants
only shape (b) — the rename. Shape (a) is planted by no fixture.

**What breaks it.** I confirmed by execution (above) that a plain add of a
backslash-named path emits a *standalone* field `"c\\d.txt"` that begins with `"` —
a real, distinct input that never carries ` => ` and so never goes through the
rename split. An implementation that applies the leading-`"` check **only inside the
rename branch** (after detecting ` => `) — a plausible misreading, since the prose
now appends the residual-quote sentence to the rename discussion (`:2140`) and the
only fixture that reaches the branch is a rename — passes T-13-1 while silently
keying a plain-added `"c\\d.txt"` as a literal path. That is the S1 defect, for
plain adds, left unverified: the same asserted-but-unexercised pattern round-7 M1
named, narrowed to shape (a). Grep across the whole plan for a plain (non-rename)
residually-quoted fixture path: 0 hits — the only backslash paths are the §11.4
probe-catalog claim (`:7147–7150`) and this rename (`:7836–7841`).

**Why it matters (and why it is Minor, not Moderate).** Both round-7 reviews named a
**plain co-changing C-quoted file** as the *primary* fixture to add — the
collapse-hunt: "Plant in `miner-hygiene` one path that stays C-quoted … co-changing
with the planted pair's partner … A quote-needing rename identity … would
*additionally* cover the rename-identity half"; the expert-review: add "a filename
containing a literal double-quote or backslash … co-changing … *and* … ideally
rename it." The fix implemented the *additional* half (the rename) and dropped the
*primary* half both reviews led with. It is Minor rather than Moderate because the
harder rename-door shape (b) — the one that most easily reintroduces S1 — **is** now
covered and verified; a faithful single-guard implementation of "any path field …
that still begins with a double-quote" covers both shapes; and shape (a)'s
whole-field-begins-with-`"` is the more obvious check. But under the test's own named
equivalence-partitioning standard and dominating rule 1, a rule shape the prose
enumerates with no fixture data to exercise it is a coverage gap on the honest-floor
safety branch, not verified coverage.

**What correct looks like.** Add one plain (non-rename) file whose path stays
C-quoted under `core.quotePath=false` — e.g. `a"b.txt` or a second backslash path
**added** (not renamed), co-changing with the planted pair's partner in one commit —
and let the existing `Fails when` clause (`:7851–7853`) assert it is recorded as
`miner_unparsed_numstat` and absent from `cochange_pairs`. Name it in the Data
paragraph so the "path encodings" partition claim (`:7842`) is honestly populated by
both shapes. Q56 (`:9854`) could then read "plants both rename shapes, a residually
C-quoted rename, and a residually C-quoted plain field."

**Classification.** Minor. **Provenance.** Recurring — the plain-field half of the
fixture that both round-7 reviews requested as their primary addition is still
absent.

### T1 — The `Fails when` clause "a rename's old or new identity is missing from the pair counts" now literally conflicts with the deliberately-skipped quoted rename

**Location.** T-13-1 `Fails when` `:7844–7854`, specifically "OR a rename's old or
new identity is missing from the pair counts" (`:7847–7848`) against the new
residually-quoted rename (`:7836–7841`).

**Observation.** The added rename (`renamesrc.txt => "a\\b.txt"` in my reproduction)
is skipped *whole* by the residual-quote rule: **both** identities — including the
clean, unquoted old side `renamesrc.txt` — are deliberately absent from
`cochange_pairs`, and the line is recorded as `miner_unparsed_numstat`. But the
general clause "a rename's old or new identity is missing from the pair counts"
[fails the test] was written to guard the two *clean* renames (`old => new`,
`{ => dir}/f`) that must contribute both identities, and it was not refined to
exclude the quoted rename. Read literally, the quoted rename's old identity **is** a
rename's old identity and it **is** missing — so that clause and the more-specific
"any C-quoted … field … instead of being recorded as `miner_unparsed_numstat`"
clause (`:7851–7853`) are in literal tension on the same fixture line. A careful
implementer resolves it via the specific clause; but a document whose job is
step-by-step execution "without a single decision on the fly" should not leave two
`Fails when` clauses mutually unsatisfiable on one planted line. Scope the general
clause to the clean renames (e.g. "each *cleanly-parsed* rename's old or new
identity"). Trivial; verified by reading both clauses against the executed fixture
behavior.

### T2 — The fixture's rename-door discrimination silently depends on an unquoted old side and a detected rename, neither stated

**Location.** T-13-1 Data `:7836–7841`.

**Observation.** The fixture catches the exact rename-door bug M1 demonstrated
**only** if git emits `oldside => "a\\b.txt"` with `oldside` **unquoted** (so the
field does not begin with `"`) and the move is **detected as a rename** (so the line
carries ` => ` rather than degrading to a plain add + delete). I verified both hold
for the natural generation — a content-preserving `git mv` from a plain-named source
— but the plan states neither. If a fixture generator instead renamed *from* another
C-quoted path, the field would begin with `"` and a whole-field-first-char miner
would also skip it, silently defeating the discriminator; if it created `a\b.txt`
fresh (not a `git mv`), git would emit a plain add `"a\\b.txt"` and the rename door
would not be exercised at all — either way the guard would "pass" against a correct
miner while verifying nothing, the very vacuity M1 flagged. Recommend the Data
paragraph state the source is a plain-named file moved with `git mv` (content
preserved, so the rename is detected and the old side prints unquoted). Trivial;
verified by execution.

---

## Decisions I attacked and could not break (executed evidence)

- **The rename-identity residual-quote detector — SURVIVES.** Executed: `git mv
  renamesrc.txt 'a\b.txt'` yields `renamesrc.txt => "a\\b.txt"`; splitting on ` => `
  leaves the new identity `"a\\b.txt"` beginning with `"`, which routes to
  `miner_unparsed_numstat`. The per-identity check is correct against git's actual
  output; a whole-field check is not, and the fixture now discriminates them.
- **Rename detection with zero content delta — SURVIVES.** A pure `git mv` (0/0
  numstat delta) is still reported as a rename under `-M`, so the fixture reaches the
  rename branch deterministically when generated as a `git mv`.
- **The `core.quotePath=false` key-alignment design — SURVIVES (unchanged this
  round).** Re-confirmed by probe 27 (byte-for-byte) and derive/check gates; the
  round-8 diff does not alter it.
- **Round-7 T1 (prose ordering) — APPLIED.** Step 13 now defines the rename split
  (`:2133–2140`) before the residual-quote check (`:2140–2144`); the micro-inference
  round-7 flagged is gone.

## The plan's own tooling, re-run by me

- `run-plan-probes.mjs` → all **27** probes `ok`; "all probes match their recorded
  expectations." Probes 24 and 27 reproduce on git 2.43.0.
- `derive-plan-sections.mjs --check` → `OK: 40 steps, 13 elements, 124 test specs,
  27 probes cited, regions current`.
- `python3 tools/check_docs.py` → `context-oracle doc-consistency check passed.`

## Verdict

**NEEDS FIXES — one Minor (m1), two Trivial (T1, T2).** The core round-7 M1 defect is
genuinely closed: the residual-quote → `miner_unparsed_numstat` branch is now
exercised through the **rename door**, the harder shape the expert-review
demonstrated, and I independently reproduced the git behavior it turns on. No
load-bearing decision collapsed; round-7 T1 is applied; all three mechanical gates
pass. The residual gap is that the miner's rule covers a *second* shape — a plain
(non-rename) residually-quoted field — that both round-7 reviews named as their
*primary* fixture and that the fix left unexercised (m1); plus two Trivial precision
items in the test spec (a `Fails when` clause in literal tension with the fully-
skipped quoted rename, T1; and the unstated old-side/detected-rename dependency the
rename-door discrimination rests on, T2). All three are small, mechanical, and
confined to `miner-hygiene`'s Data and `Fails when` — one plain-field fixture add and
two one-line clarifications close them.
