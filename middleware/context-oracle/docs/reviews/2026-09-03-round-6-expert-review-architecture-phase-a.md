# Round-6 expert review — Phase A architecture (round-5 fix verification + new-defect hunt)

**Artifact:** `docs/architecture-phase-a.md` at current HEAD, commit `2a63f9a`
("apply all round-5 review findings; session review loop ends here"), diffed
against the round-5-reviewed draft (`33e0648`) with
`git show 2a63f9a -- middleware/context-oracle/docs/architecture-phase-a.md`.
**Reviewer:** independent session, not the author of the document or of any prior
review. Read in full before the attack: `middleware/context-oracle/CLAUDE.md`,
`OWNER-LEDGER.md`, `docs/specs/spec-context-oracle.md` (all 1130 lines),
`docs/collapse-log.md` (the 2026-08-29 entry first, per the charter, then the
rest), both round-5 review files, the architecture end to end (all 2245 lines),
and the full round-5 apply diff.
**Axis (round-6 charter):** premises and engineering standards — correctness,
completeness, verification-actually-performed, standards-conformance, citation
integrity, internal consistency. The round-5 fixes (commit `2a63f9a`) are the
primary attack surface, attacked **as author text** (collapse-log 2026-08-29
Lesson 1: a reviewer's repair prescription carries no verification of its own).
Every check below was run in this session; nothing is carried forward from the
author's attestations or prior rounds' claims without re-derivation. Findings
were not manufactured to avoid an empty report; the convergence bar was applied
as stated — an empty findings list with enumerated clean checks would have been a
legitimate PASS, and this round is not it.

## Scope and Inventory

**Round number:** 6 (Post-fix review; the fifth Post-fix round of this series).

**Tool plan (instruments and claim-type mapping).**
- Literal-content / internal-consistency claims (the bulk of this review): `Read`
  at the specific file:line, this session — every finding's location was re-read
  at drafting time.
- Absence / "no other occurrence rescues this" claims: `Grep` to locate all
  occurrences, then `Read` of each region (search locates, reading verifies —
  collapse-log 2026-07-30 Observation 14).
- The one external-premise class the fixes touch (the hooks contract behind the
  regret-floor label and the classifier lag): `WebFetch` against
  `code.claude.com/docs/en/hooks` this session (Context7 available as backup;
  not needed — the fetch resolved every needed premise). No instrument class was
  unavailable; no load-bearing claim is stranded, so no halt condition arose.
- The mechanical floor: `python3 middleware/context-oracle/tools/check_docs.py`,
  run this session.

**Post-fix inventory (four sources per the skill's Step 2).**

*(1) The prior review's full inventory + (2) the fix-diff files + (3) dependents,
verified this session:*
- [x] `docs/architecture-phase-a.md` — **Read in full** (lines 1–2245).
- [x] `docs/specs/spec-context-oracle.md` — **Read in full** (D-27, FR-A2m,
  FR-A2g, FR-B5, D-41, OL-C5 citations hand-checked at their rows).
- [x] `OWNER-LEDGER.md` — **Read in full** (OL-C3, OL-C5, OL-6, OL-11, OL-C1
  re-read at use).
- [x] `middleware/context-oracle/CLAUDE.md` — **Read in full** (dominating rules,
  locked decisions).
- [x] `docs/collapse-log.md` — **Read in full** (2026-08-29 entry first; the
  2a63f9a change to it noted from the diff).
- [x] `docs/reviews/2026-08-29-round-5-expert-review-architecture-phase-a.md` —
  **Read in full** (closure items R5-S1, R5-M1, R5-M2, R5-m1..m5).
- [x] `docs/reviews/2026-08-29-round-5-collapse-hunt-architecture-phase-a.md` —
  **Read in full** (closure items P1–P4, N1–N5).
- [x] `middleware/context-oracle/tools/check_docs.py` — **Grep-verified** by
  execution (exit 0, output pasted below).
- [x] `code.claude.com/docs/en/hooks` (external premise) — **Grep-verified** via
  WebFetch this session (transcript async-lag, `last_assistant_message`
  Stop-only, `PostToolUseFailure` fires only after a tool executes and fails —
  all confirmed).

*(4) Prior findings as closure items:* the round-5 resolution table below
re-derives each of the 15 round-5 findings from current source.

No new in-scope file surfaced mid-pass. AD-24's named build-time verifications
(marker presence on the owner's real transcript; whether platform-injected turns
fire `UserPromptSubmit`) remain out of this container's reach and are correctly
disclosed as build-time (L11) — not scored as review gaps.

## VERDICT: NEEDS FIXES — 0 Critical / 1 Serious / 1 Moderate / 3 Minor

Every round-5 finding is resolved in substance except two: R5-m5/N4 (the
lexicon config surface) is **re-asserted, not resolved** (charged below as
R6-M1), and round-5 P2's tenth-reader enumeration was completed at the reader's
own site (AD-18) but **not** in AD-4's canonical split filter (charged as
R6-m1). The Serious and one Minor are new defects **inside the round-5 repair
text** — the recorded fix-forecloses-adjacent-axis / prescription-carried
shapes, now in their fifth round — both living in the round-5 object-mechanism
rework of AD-9 clause (iv), the piece of round-5 machinery whose
unlisted-object default the charter flagged as "where the next defect lives."
The Serious is the strongest: the round-5 unlisted-object→`request` default
silently sweeps the escalation re-ask *"can you please answer my question?"*
into `kind='request'`, disarming the `OL-C3` recourse — while clause (iv)'s own
worked example and AC-24's fixture both still assert it "stays deny-capable" /
"re-arms the block," an assertion the new mechanism cannot produce. Nothing
reaches the deny producer's structural confinement (AD-10), the owner's locked
constraints (`FR-B3`/`OL-R4`/`OL-7`), or the phase boundary — all re-walked
clean.

---

## Summary

This review returns **NEEDS FIXES**. The round-5 fixes are, in the main,
correct and swept: the object rule now has a stated mechanism (direct-object
head noun, wh-complement precedence — R5-S1 resolved), the comparability gate
genuinely produces the silence AC-1b now asserts (P4 resolved), the per-project
watermark removes the concurrent-project data loss (R5-M2/P3 resolved), the
regret proxy's outcome semantics and designed-silence floor label are stated
(P2 semantics + N1(b) resolved), and the quote-aware independent-segment rule
closes R5-m3/N2 at the mechanism level. But the round-5 restructure of the
communicative-verb object path — narrowing `info` to only *wh-complement or
information-lexicon object* and defaulting every other object to `request` —
carries a stale worked example and an unsatisfiable fixture (R6-S1), and the
one round-5 finding whose fix was "name the config home and writer" was
answered by naming a writer (`tune`) that this same document restricts to
numbers (R6-M1). By the mechanical rule a single Serious blocks PASS; round 6
is not the terminal round.

## Upstream Contract Verification (Step 7)

Each governing spec/ledger item that the round-5 fixes touch, checked
honored/violated against the verified current text:

- **`OL-C3` (answer-drift block — "block that motherfucker until it stops
  ignoring me and actually answers")** — **VIOLATED for the escalation
  phrasing** (R6-S1). The in-chat escalation re-ask *"can you please answer my
  question?"* is now classified `kind='request'` (tracked, not deny-capable),
  so a mutating move after it is not denied; the recourse `OL-C3` names is
  disarmed for its canonical phrasing. Verified: `OWNER-LEDGER.md` OL-C3 read;
  clause (iv) mechanism traced (line 767–770); the two contradicting surfaces
  read (lines 763, 1665).
- **`OL-C5` (answer-drift definition)** — **honored at the definitional level**:
  the trigger remains OL-C5's owner wording; R6-S1 is a recognizer-precision
  regression, not a redefinition (verified: AD-9 lines 869–872 unchanged).
- **`OL-C1` (no arbitrary volume/count/budget cap)** — **honored**: the round-5
  additions (object lexicons, watermark keys, segment rules) are classification
  and bookkeeping, not operating caps (re-scanned the diff; no volume term
  introduced).
- **`OL-6` / `FR-K9` (two stores; export/import survives rebuilds; solo
  multi-repo)** — **honored**: the per-project watermark serves exactly OL-6's
  multi-repository usage (AD-5 line 561–571). Residual comment desync R6-m2.
- **`FR-B5` (per-error-direction leans)** — **honored in letter, over-applied in
  effect** at the escalation re-ask: unlisted-object→`request` is the
  err-toward-not-denying direction, but OL-C3 wants *more* enforcement on the
  escalation re-ask, not less (this is the substance of R6-S1).
- **`D-27` / `FR-A2m` (run-and-failed done-claim routes to Phase B)** —
  **honored**: re-read verbatim (spec lines 171, 175, 800–801). A run-and-failed
  covering test is "beyond the unrun-test case FR-A2g catches" → FR-A2m →
  Phase B; the regret-floor label (AD-18 lines 1414–1417) correctly self-counts
  the designed silence. Supported.
- **`FR-L4` (regret proxy — existence required, gates nothing)** — **honored**;
  R6-m1 is a doc-enumeration completeness residual, not a behavior violation.
- **`FR-A2g` / `AC-8` (Verification never asserts false "not run")** —
  **honored**: the independent-segment rule preserves it; R6-m3 is an unpinned
  fixture, not a behavior break.
- **`FR-B3` / `OL-R4` / `AC-2` (no pre-emptive gate, no generated-file block, no
  mutation, one deny producer)** — **honored**: the round-5 diff touches
  classification, schema comments, fixtures, and disclosures only; AD-10's
  single-producer confinement, the `kind='info'`+mutating-file deny-eligibility
  predicate, reactive-only, text-never-denied, and self-clearing are all
  textually untouched and re-read consistent this session.
- **`AC-24` re-ask fixture (Phase A pin)** — **VIOLATED**: the pinned assertion
  "*can you please answer my question?* … re-arms the block" (line 1665) is
  unsatisfiable by clause (iv) (R6-S1).

---

## Serious

### R6-S1 — The round-5 unlisted-object→`request` default reclassifies the escalation re-ask *"can you please answer my question?"* from `info` to `request`, silently disarming the `OL-C3` recourse — and clause (iv)'s own worked example and AC-24's fixture both still assert the opposite, an assertion no mechanism in the document can produce

**Location.** AD-9 clause (iv), communicative-verb object path (lines ~748–770,
especially the unlisted-object default at 767–770) × its own worked example
(lines 762–763: *"the escalation re-ask 'can you please answer my question?'
stay deny-capable"*) × AD-24's fixture corpus (lines 1663–1666: *"can you please
answer my question?' after a blanket-cleared info row re-arms the block"*) ×
L1's under-enforced ledger (lines 1998–2007) × the information-object lexicon
(line 759).

**What is wrong.** Round 5 restructured the communicative-verb branch so that
classification depends entirely on the verb's **object head noun**:
- wh-complement → `info`;
- object head on the **information-object lexicon** (error / output / log / diff
  / result / value / version / status-class) → `info`;
- object head on the **artifact-object lexicon** (demo / test / script / example
  / branch / file / PR-class) → `request`;
- **"Any other object — an unlisted head noun … defaults to `kind='request'`"**
  (lines 767–770).

Trace *"can you please answer my question?"* through this mechanism, verified
this session (Read of lines 748–770): request-frame recognized (`can … you …
answer`); verb `answer` is on the communicative lexicon; the object is the head
noun of the noun phrase immediately following the verb (line 753) = **"question"**
(no `me/us` to skip; no wh-complement). "question" is on **neither** lexicon
(the information-object list at line 759 is *error/output/log/diff/result/value/
version/status*; the artifact-object list at line 764 is
*demo/test/script/example/branch/file/PR* — "question" appears in neither;
grep-confirmed the two lexicons this session). It therefore hits the
unlisted-object default → **`kind='request'`** → **tracked, never
deny-capable** (line 779–780).

Two surfaces in the current text assert the exact opposite outcome for this
exact string:
1. **Clause (iv)'s worked example** (lines 762–763) lists it among the cases
   that *"stay deny-capable"* (`kind='info'`). The mechanism three lines above
   it produces `request`. The example contradicts its own mechanism.
2. **AC-24's fixture** (lines 1665–1666) pins *"can you please answer my
   question?' after a blanket-cleared info row re-arms the block."* "Re-arms the
   block" requires the row to open `kind='info'` (deny-capable). The mechanism
   produces `request`, which does not re-arm anything. A faithful build **fails
   this fixture**; the only ways to green it are to add "question" to the
   information-object lexicon (unstated), special-case the verb (a Gate-A inline
   decision), or weaken the fixture.

L1 (lines 1998–2004) and the mechanism agree that unlisted-object communicative
asks are under-enforced (`request`) — so the document is internally split
three ways: mechanism + L1 say `request`; clause (iv)'s example + AC-24's
fixture say `info`. This is the collapse-log 2026-08-29 Lesson-1 shape
(a fix carries a stale example its own new mechanism falsifies) and the round-5
collapse-hunt's standing question made concrete (a fixture assertion no
mechanism produces — the P4 class recurring inside the round-5 repair).

**How verified.** Read of AD-9 clause (iv) lines 748–770 and 779–780 (mechanism
+ deny-eligibility predicate); Read of lines 762–763 (example) and 1663–1666
(AC-24 fixture) and 1998–2007 (L1) this session; `Grep "answer my question"` →
exactly three hits (763, 874 [the deny-reason string], 1665) — no fourth
occurrence rescues the classification; `Grep` of the two lexicons confirms
"question" is in neither. Round-3's applied fix explicitly made this phrasing
deny-capable (Status note, line 2181: *"the OL-C3 escalation re-ask stay
deny-capable"*), and round-4 preserved it ("without a repo-artifact object →
info," round-4 diff) — so this is a **regression** the round-5 restructure
introduced while fixing the unlisted-*build*-noun wrongful-deny direction
(R5-M1/P1). The commit message's own claim — *"request as the safe default for
every unlisted object … restoring L1's single-member residual as true"* — is the
change that caused it; the author did not notice "question" is an unlisted noun
whose correct classification is the *opposite* of a build noun's.

**Failing scenario.** Max asks Q1 (*"why is the build broken?"* → `info`,
deny-capable). The agent narrates substance without answering; the clear
recognizer's steady-state lean marks Q1 `answered`
(`generic_text_all_prior`) — the falsely-cleared state the escalation re-ask
exists to repair. Max re-asks *"can you please answer my question?"*. Under
rounds 3–4 this opened a fresh `info` row and re-armed the block; under round 5
it opens `request` — tracked only. The agent's next `Edit` is **not denied**.
The recourse `OL-C3` names ("block that motherfucker until it … actually
answers") is gone for its canonical phrasing, and the guard normally offered —
`ctxoracle correct --missed-question` — routes through the *same* classifier
(AD-18 lines 1388–1391), so supplying *"answer my question"* there also opens
`request`; only re-supplying Q1's original text re-arms.

**Why Serious.** It disarms an owner-objective recourse (`OL-C3`) for a named,
canonical phrasing; the document's own example and a Phase A acceptance fixture
assert a behavior the mechanism cannot deliver (an unpassable fixture is a
build-blocking defect); and the corpus that was supposed to pin the object
mechanism does not pin this case. It is bounded (Max sees his own unanswered
question — the human channel — and the *original* question often remains open),
which is why it is Serious and not Critical, but it lands on the block's owner
objective, exactly as round-5 graded its analogous R5-S1.

**Fix (single mechanism).** Reconcile the three surfaces to the design intent
(`OL-C3`: the escalation re-ask must be deny-capable). Add a meta-answer clause
to clause (iv): a communicative verb whose object head denotes the pending
question itself — head noun **"question"/"answer"** — classifies `kind='info'`
(fulfilment is a text answer), placed *before* the unlisted-object default so it
takes precedence; equivalently, seed the information-object lexicon with
"question"/"answer". Then clause (iv)'s example (line 763) and AC-24's fixture
(line 1665) are satisfiable by the stated mechanism. Add the discriminating
corpus pair to AD-24: *"can you please answer my question?"* → `info` (re-arms),
beside *"can you show me a prototype?"* → `request` (the retained
build-object case) — so the two opposite unlisted-noun directions are both
pinned. (If instead the owner accepts that the in-chat escalation re-ask is no
longer deny-capable in Phase A, that is a coverage decision that must move the
example and fixture to the under-enforced side *and* be owned in L1 — but that
degrades `OL-C3`, so the deny-capable fix is the correct one.)

---

## Moderate

### R6-M1 — The config-enumerated lexicons are declared "tended via `ctxoracle tune`," and the round-5-elevated under-enforcement mitigation leans on it, but `tune` is defined as the writer for *numbers* and `tuning.value` is a single scalar — no surface performs list-valued lexicon edits, so R5-m5/N4 is re-asserted, not resolved

**Location.** AD-9 clause (iv) (line 757: *"closed, config-enumerated in
`tuning`, tended via `ctxoracle tune`"*; line 777: *"shrunk by tending the two
config-enumerated lexicons"*) × L1 (lines 2003–2004: *"shrunk by tending the
config-enumerated lexicons (`tuning`, via `tune`)"*) × AD-15 Verification row
(line 1245: *"config-enumerated (in `tuning`, AD-5 — tended via `ctxoracle
tune`, like every lexicon in this document)"*) × AD-20 (lines 1491–1493:
`tune <key> <value>` is *"the plain-language writer for every **number** this
document marks tunable"*) × AD-5 `tuning` schema (line 594:
`tuning(key, project_key NULL, value, source, updated_at)` — one scalar
`value`).

**What is wrong.** Round 5's answer to R5-m5/N4 ("'config-extensible' lexicons
have no named config home or owner surface … 'tending' is an operation no
specified surface can perform") was to **name** the home (`tuning`) and the
writer (`ctxoracle tune`) at three sites and to make the under-enforcement
losses' mitigation lean on it — the accepted losses are "shrunk by tending the
lexicons via `tune`." But the writer named cannot perform the operation:
- `tune` is scoped, in its own decision (AD-20), to *"every **number** this
  document marks tunable"*; `tune` with no args "lists the keys, their current
  values, and their defaults" — a number surface.
- A lexicon is a **list of words** (the communicative lexicon is eight verbs;
  the information/artifact-object lexicons are word sets). `tuning.value` is a
  single scalar column (Read of line 594), so a lexicon can live there only as a
  whole opaque string, and adding one word ("+summarize", the N4 example)
  requires a set-semantics `tune` does not have.
- No `lexicon` verb exists in AD-20's enumerated surface, and the owner is a
  non-programmer (`OL-11`) for whom "retype the whole comma-joined verb list
  under one key" is neither the stated `tune` contract nor a usable operation.

So the mitigation that clause (iv), L1, and AD-15 all lean on — the way Max
shrinks the under-enforcement losses (now including, under R6-S1, the escalation
re-ask itself) — rests on a capability the document does not provide. This is
the round-2 "tunable with no tuner" class and the collapse-log's recurring
"renaming a hedge is not resolving it" pattern: round 5 asserted the resolution
(named the home and writer) without delivering it (extending the writer or the
schema).

**How verified.** Read of AD-20 lines 1491–1493 (tune = number writer) and AD-5
line 594 (scalar `value`) this session; `Grep "config-enumerated|tended via|
list-valued"` → the three leaning sites (757, 777/2004, 1245) and **zero**
`list-valued` hits anywhere; round-5 R5-m5 and collapse-hunt N4 read in full as
the prior-finding baseline.

**Failing scenario.** Max, a non-programmer, wants to stop the oracle
under-enforcing when he asks *"could you summarize the error?"* (the documented
loss). The document tells him this is "shrunk by tending the config-enumerated
lexicons via `tune`." He runs `ctxoracle tune` — it lists numbers, not word
lists; `tune lexicon.communicative summarize` is outside its stated
number-writer contract and, even if tolerated, replaces the whole value rather
than adding a word. The mitigation is unreachable by the person it exists for.

**Why Moderate (boundary noted).** The block still functions with its accepted
losses, which keeps this below Serious; but the reliance is now explicit and
load-bearing at three sites, the fix asserted resolution of a prior-round
finding without delivering the capability, and the owner-facing calibration loop
for the whole answer-drift block and the command classifier is inert. Round 5
graded the precursor Minor/note; the round-5 fix's re-assertion-without-delivery
raises it, because the document now *reads as resolved* while the capability is
absent.

**Fix (single mechanism).** Extend AD-20's `tune` to list-valued lexicon keys
with add/remove semantics (e.g. `ctxoracle tune lexicon.communicative
+summarize` / `-summarize`), and state the lexicon rows' shape in the `tuning`
schema comment (a list encoding under a reserved key prefix, or a dedicated
`lexicons(name, word, source)` table with a `tune`/`lexicon` writer). If instead
lexicon changes are build-time only, say so at all three sites and re-scope the
"shrunk by tending" mitigation to "narrowed in a later build," not an owner
operation — but that concedes `OL-11` cannot calibrate the block, so the
extend-`tune` path is preferred.

---

## Systemic Patterns

No systemic pattern — verified by the proactive scans this session:
`Grep "config-enumerated|tended via|list-valued"` (3 leaning sites, 0
list-valued capability); `Grep "whisper_stats_watermark"` (2 hits — one
per-project home, one stale WRITER reference); `Grep "answer my question"`
(3 hits, all accounted for); `Grep "re-edit|FR-L4|covering-test-failed"`
(the re-edit clause present only in AD-18, the covering-test clause in both
AD-4 and AD-18). The five findings are distinct defect classes (a
classification regression, a missing capability, an incomplete enumeration, a
comment desync, an unpinned fixture) with no single grep-able signature across
enumerated instances; they do not meet the systemic bar. The meta-thread
(round-5 fixes asserting resolution in example/fixture/citation text ahead of
the mechanism/capability catching up) is described in the closing paragraph as
inheritance, not filed as a Systemic finding.

## Moderate & Minor Findings

*(The Moderate is R6-M1 above.)*

### R6-m1 — AD-4's canonical split consumer filter still omits the FR-L4 re-edit clause (the tenth reader); round 5 stated its semantics at AD-18 but did not sync AD-4, so the enumeration whose completeness the collapse-log corollary elevates is one reader short

**Location.** AD-4 `observed_actions` CONSUMER FILTER (lines 497–515 — its three
bullets name change/read, run-state, and the "'failed' rows additionally feed
the FR-L4 **covering-test-failed** clause and diagnostics" at 513–515) × AD-18's
regret proxy (lines 1409–1413 — the *re-edit* clause with `outcome='ok'`-only
semantics).

**What is wrong.** Round-5 P2 found the FR-L4 re-edit clause was the tenth
reader of `observed_actions` missing from AD-4's enumeration, and prescribed
"Add the tenth reader **to the filter** with its semantics." The fix stated the
semantics correctly, but **at AD-18** (the reader's own site: re-edit reads
`'ok'`-only; covering-test-failed reads `'failed'`), and left AD-4's split
filter unchanged. AD-4 — presented as "CONSUMER FILTER, split by what a failed
action IS per consumer" and elevated by the collapse-log's own corollary as the
terminating enumeration whose *completeness* is the deliverable — still lists
the FR-L4 covering-test-failed clause (513) but not the FR-L4 re-edit clause. A
reader auditing AD-4 for "all consumers and their outcome semantics" finds nine,
not ten. The behavior defect (an inline implementer decision on the re-edit
filter) is genuinely closed — this is why it is Minor, not Moderate — but the
enumeration-incomplete-on-first-audit class the corollary warns about recurs one
level down: the enumeration is complete only when AD-4 and AD-18 are read
together, and AD-4 does not point at AD-18's tenth reader.

**How verified.** Read of AD-4 lines 497–515 and AD-18 lines 1409–1413 this
session; `Grep "re-edit"` → hits only at 1405/1411/1412 (all AD-18), none in
AD-4; `Grep "FR-L4"` → AD-4 (513) names only the covering-test-failed clause.
Round-5 P2 (concrete repair: "Add the tenth reader to the filter") read as the
baseline.

**Fix (single line).** Add the re-edit clause to AD-4's change/read bullet with
its semantics: "the FR-L4 re-edit clause (AD-18) consumes `'ok'` edit rows only
— a failed Edit is not a re-edit," so AD-4 is a complete ten-reader enumeration
and the covering-test/re-edit split lives in one canonical place.

### R6-m2 — The `whisper_stats` WRITER comment still references the bare `whisper_stats_watermark` and "the project **stores'**" (plural), desynced from the per-project `whisper_stats_watermark:<key>` model the round-5 fix established one comment above it

**Location.** AD-5 `global_meta` comment (lines 561–571 — the fix: "the fold
watermarks, **ONE PER PROJECT**: `whisper_stats_watermark:<key>` … the fold
reads and advances only the watermark(s) of the project(s) it folds") × the
adjacent `whisper_stats` WRITER comment (lines 572–593 — unchanged: "folding
BOTH the project **stores'** whisper_audit rows … AND corrections newer than
`whisper_stats_watermark`").

**What is wrong.** The round-5 fix corrected the watermark to per-project in the
`global_meta` comment but left the `whisper_stats` WRITER comment saying "the
project stores'" (plural — the exact ambiguity round-5 P3 flagged as admitting
the "walk all stores" reading) and "corrections newer than
`whisper_stats_watermark`" (bare, no `:<key>`). The data-loss defect (P3/R5-M2)
is genuinely fixed — per-project watermarks make both the one-store and
all-stores readings safe, which is why this is Minor and not the reopening of
P3 — but the WRITER comment, a normative schema comment an implementer reads,
now contradicts the per-project model stated immediately above it: an
implementer reading only the WRITER comment sees a single bare watermark against
plural stores. This is the m-R4/R3-m1/R5-m1 "the repair updated one homing site
and left its sibling comment stale" desync class.

**How verified.** Read of AD-5 lines 560–593 this session; `Grep
"whisper_stats_watermark"` → the per-project home (563) and the stale bare
WRITER reference (578); the round-5 diff shows the WRITER comment untouched.

**Fix (single edit).** Sync the WRITER comment: "folding the current project
store's whisper_audit rows … AND corrections newer than that project's
`whisper_stats_watermark:<key>`," so the WRITER comment and the `global_meta`
home describe one per-project model.

### R6-m3 — The runner+unknown-runner compound composition case round-5 m3 prescribed pinning (`npm test && make integration`) is not in AC-24; only innocuous+runner and innocuous+unknown compounds are pinned, so the independent-composition rule that closes m3 is unpinned exactly where it matters

**Location.** AD-15 Verification row (line 1245 — the round-5 mechanism fix:
"**segments contribute independently** — each runner segment subtracts its run,
and any unknown segment still sets run-state unknown, so a runner+unknown
compound both subtracts and composes the weak claim") × AC-24 (lines 1684–1686 —
the pinned compounds: `cd pkg && npm test` subtracts; `cd pkg && make check`
composes the weak claim).

**What is wrong.** Round-5 m3's concrete repair had two parts: state that
segments compose independently (done — line 1245), and "Add `npm test && make
integration` → weaker claim to the AC-8 set." The fixture added is the
innocuous+unknown compound (`cd pkg && make check`) and the innocuous+runner
compound (`cd pkg && npm test`) — **neither** is the runner+unknown-runner case
m3 named, where a recognized runner *and* a test-running unknown coexist on one
line so the command must *both* subtract (for the runner) *and* compose the weak
claim (for the unknown). The mechanism now handles it, but no fixture pins it, so
a future regression to the pre-m3 behavior (runner segment absorbing the sibling
unknown, re-licensing the strong "not run") would ship green. This is the R5-m4
class (a reviewer's example applied; the substantive case the finding named left
unpinned) and the round-5 collapse-hunt's standing question (name the fixture for
each asserted behavior) unmet for this one behavior.

**How verified.** Read of AD-15 line 1245 and AC-24 lines 1679–1686 this
session; round-5 m3's concrete repair read as the baseline; the pinned compounds
enumerated — no runner+unknown-runner case present.

**Fix (single line).** Add `npm test && make integration` → *neither "not run"
nor a strong claim; subtracts npm's covering tests AND composes the weaker
"no recognized run touched T" for `make`'s* to AC-24's run-state set, pinning the
independent-composition rule.

## Tentative Findings

No tentative findings — every candidate finding's premise was verified against
current source this session (Read at the cited lines, Grep for the
absence/occurrence claims, WebFetch for the external hooks premise, and the
mechanical floor executed). The one candidate that could have been tentative —
whether the comparability gate can discriminate a structural 0 from an observed
0 — was resolved by Read (the discriminator, "generic-frontend language with no
`import_edges`," is derivable from AD-12's ext→grammar table and fails safe
toward silence), so it is recorded in clean checks, not as a finding.

## Observations

- **The "avoids retrying" phrasing (spec `FR-B2`/`FR-O2`, not the architecture)
  was not surfaced by this session's hooks fetch.** The WebFetch summary
  reported the deny reason is shown to Claude ("blocks the tool call, and shows
  Claude the reason") but did not surface "so it avoids retrying." This is a
  negative result from a lossy summarizing instrument, so it establishes
  nothing (collapse-log 2026-07-30 Observation 14); and it does not bear on the
  architecture regardless — AD-9/AD-10 do **not** depend on the model avoiding
  retries (the design *measures* deny-loop behavior via `deny_loop`/
  `deny_bypass_suspect` rather than assuming it). Recorded only so a future
  spec-touch can re-check the phrasing at source; no architecture finding.
- **The regret proxy counts designed Phase-A deferral silence as "regret."**
  The run-and-failed done-claim silence (D-27/FR-A2m) is self-counted by the
  regret proxy's covering-test-failed clause; the round-5 label (AD-18
  1414–1417) discloses this floor honestly. No standard is violated (FR-L4
  regret gates nothing and the label is present) — recorded as context, not a
  finding.

## What's Actually Good

- **The object-rule mechanism specification (R5-S1's fix), judged against
  precision-of-mechanism (Gate-A: no inline architectural decisions).** Clause
  (iv) now states the object as "the head noun of the noun phrase immediately
  following the verb (skipping an optional 'me/us'); a wh-complement takes
  precedence over any noun inside it" (lines 753–755) — a decidable
  deterministic rule, not the bag-of-words scan round 5 warned would disarm
  "tell me why the login *test* fails." Verified: the wh-complement-precedence
  case is pinned in AD-24 (line 1673–1675) and re-derives correctly. (The
  *unlisted-object* branch of this same rule is R6-S1 — the mechanism is well
  specified; its default direction is wrong for text-fulfilled unlisted nouns.)
- **The comparability-gated Reuse dominance (P4's fix) genuinely produces the
  silence AC-1b now asserts.** AD-15 (line 1241): a candidate with structurally
  absent `symbol_refs` support (generic-frontend, no `import_edges`) marks the
  set incomparable → no crown → silence. Traced this session: in the AC-1b
  fixture the true convention S is generic-frontend and *in* the FTS candidate
  set (the generic frontend indexes definitions into FTS, AD-12), so the gate
  fires and silence results — the fixture's assertion is satisfiable by the
  stated mechanism, closing round-5 P4. Judged against FR-D1's no-rumor rule
  (a crown over an unmeasurable rival is a claim the evidence cannot back).
- **The per-project watermark (R5-M2/P3's fix) removes the concurrent-project
  data loss.** AD-5 (561–571): one watermark per project key, each fold reads
  and advances only its own — verified against OL-6's confirmed multi-repository
  usage; project A's fold can no longer strand project B's unfolded rows.
  (Residual comment desync is R6-m2, cosmetic.)

## Round-5 finding resolution table

"Resolved" = fixed in substance, swept, no surviving contradicting copy, except
where a note points at a finding above. (ER = round-5 expert review; CH =
round-5 collapse-hunt; the two files' top findings overlap pairwise.) Each row
re-derived from current source this session, not carried from the fix
attestations.

| Round-5 finding | Status in `2a63f9a` | Where / notes (verified this session) |
|---|---|---|
| ER R5-S1 = CH N5 (object rule had no stated mechanism; containment scan would disarm polite artifact-naming info questions) | **Resolved; new defect in the fix** | Clause (iv) now states the direct-object head-noun rule + wh-complement precedence (lines 749–755); "could you tell me why the login test fails?" → `info` pinned (AD-24 1673–1675), re-derived correct. The fix's unlisted-object default introduced **R6-S1** (the escalation re-ask). |
| ER R5-M1 = CH P1 ("exactly one member shape" false; unlisted build noun → wrongful deny) | **Resolved by a different path than prescribed; new defect** | The author flipped unlisted-object → `request` (eliminating the second member) instead of documenting two members. Re-derived: the wrongful-deny class is again essentially the outside-the-frame action-request (line 861 defensible for the *wrongful-deny* axis). But the flip created **R6-S1** on the opposite (under-enforcement) axis for text-fulfilled "question." Attacked as author text per Lesson 1. |
| ER R5-M2 = CH P3 (single global watermark strands concurrent projects; store-reach disjunction) | **Resolved; comment residual** | Per-project `whisper_stats_watermark:<key>` (AD-5 561–571). New residual: the WRITER comment desync (**R6-m2**). |
| ER R5-m1 = CH N3 (SessionEnd fold not in AD-6/AD-23) | **Resolved** | AD-6 SessionEnd row names the fold (line 647); AD-23 inventory names the SessionEnd-only fold with its bound (1589–1591). Read this session. |
| ER R5-m2 ("neither lexicon"/"unlisted doing-verbs" quantify over a removed verb lexicon) | **Resolved** | Clause (iv) and L1 now say "any non-communicative verb" (771, 2000); the residual "doing-verbs" mentions (779, 2207) are historical descriptions of round-4's finding, not live claims. `Grep "neither lexicon"` → 0 live hits. |
| ER R5-m3 (segments compose to one class; runner absorbs unknown) | **Resolved at mechanism; fixture residual** | "segments contribute independently" (line 1245). New residual: the runner+unknown-runner fixture m3 prescribed is unpinned (**R6-m3**). |
| ER R5-m4 (L6 "both measured" but false-positive class unpinned) | **Resolved** | AC-1b adds the same-name false-positive case (1633); L6 rewritten to pin both (2054–2057). The mechanism honestly discloses (identifier-match counts comment/string matches; confidence-capped) rather than claiming exclusion — the fixture is passable by construction (examined; see clean checks). |
| ER R5-m5 = CH N4 (lexicons have no config home/writer; "tending" performable by no surface) | **NOT resolved — re-asserted** | The fix named `tuning`/`tune` at three sites, but `tune` writes numbers (AD-20 1491–1493) and `tuning.value` is scalar (594); no list-valued lexicon write exists (**R6-M1**). |
| CH P2 (tenth `observed_actions` reader — the FR-L4 re-edit clause — missing from AD-4's enumeration) | **Partially resolved** | Semantics stated at AD-18 (1409–1413); AD-4's split filter still omits the re-edit clause (513 names only covering-test-failed) — the enumeration is complete only across AD-4+AD-18 (**R6-m1**). |
| CH P4 (mixed-language AC-1b fixture unpassable by dominance arithmetic) | **Resolved** | Comparability gate added (AD-15 1241); AC-1b rewritten to assert silence (1630–1633); the gate produces the asserted silence (traced — see What's Actually Good). |
| CH N1 (D-27/FR-A2m routing note; no regret-floor label) | **Resolved (b); (a) correctly left to the spec** | Regret-floor label added (AD-18 1414–1417) — N1(b). N1(a) (the spec-level tension that FR-A2m's Phase-B ground is model-dependence while this subcase is deterministically detectable) is a §13 spec-court item; the architecture correctly does not resolve it alone. |
| CH N2 (segment split not quote-aware) | **Resolved** | "split … **quote-aware** (operators inside quotes are not split points; quoting the splitter cannot parse → class 3 wholesale)" (line 1245). |

## Checks run that came back clean

- **Mechanical floor:** `python3 middleware/context-oracle/tools/check_docs.py`
  → `context-oracle doc-consistency check passed.` (exit 0) on the current
  tree, run this session.
- **External premise re-establishment (this session, WebFetch on
  `code.claude.com/docs/en/hooks`):** transcript is "written asynchronously and
  may lag the in-memory conversation … hooks that need the final assistant text
  … should use `last_assistant_message` on Stop and SubagentStop" — **confirmed
  verbatim** (V1, on which AD-9's lag-window hold and AD-11's clear-axis rest);
  `last_assistant_message` Stop/SubagentStop-only — confirmed (V1); a
  `PreToolUse` deny reason is shown to Claude — confirmed (V2); `PostToolUseFailure`
  fires "after a tool call fails," with `PermissionRequest`/`PermissionDenied`
  as separate prior events — confirms V19's load-bearing claim that a
  `PreToolUse` deny never generates a `PostToolUseFailure` row, so the oracle's
  own denies cannot pollute `observed_actions.outcome`. The round-5 fixes
  introduce **no new external premise** (verified against the diff: no new V
  row, no new contract claim — the fixes are internal design), consistent with
  what round 5 found.
- **The three regression-surface strings (grep + read this session):**
  `"answer my question"` → 3 hits (763 example, 874 deny-reason string, 1665
  fixture) — the example and fixture are R6-S1; no fourth occurrence rescues the
  classification. `"whisper_stats_watermark"` → 2 hits (563 per-project home,
  578 stale WRITER reference — R6-m2). `"re-edit"` → 3 hits, all in AD-18 (R6-m1).
- **The two object lexicons enumerated against clause (iv):** information-object
  = error/output/log/diff/result/value/version/status-class (line 759);
  artifact-object = demo/test/script/example/branch/file/PR-class (line 764);
  "question" is in **neither** — the mechanical basis of R6-S1. Re-derived the
  round-5 corpus: "can you rename the helper?" → `request` ✓; "can you show me a
  demo?" → `request` ✓; "can you show me the error?" → `info` ✓; "could you
  summarize the error?" → `request` ✓; "can you show me a prototype?" →
  `request` ✓; "could you tell me why the login test fails?" → `info`
  (wh-complement precedence) ✓; "could you confirm the version number?" → `info`
  ✓. All seven consistent; the eighth — "can you please answer my question?" —
  is R6-S1.
- **The comparability gate discriminator:** the "structural 0 vs observed 0"
  distinction is derivable from AD-12's ext→grammar table (a candidate's `lang`
  is grammar-covered → `import_edges` produced; generic-frontend → not), and the
  gate fails safe toward silence, so its under-specification does not strand a
  load-bearing claim (not a finding — recorded so the check is auditable).
- **The same-name false-positive fixture (AC-1b, line 1633):** examined against
  the mechanism — `symbol_refs` is an identifier-match heuristic that *counts*
  comment/string matches (L6 discloses this and confidence-caps; it never claims
  exclusion). The fixture "a comment/string match does not inflate a candidate's
  count **past** a true rival" is passable by constructing the true rival to
  dominate despite the inflation; no overclaim (the mechanism's handling is
  disclosure+cap, honestly stated). Not a finding.
- **§8 deny-confinement re-walk on the current text:** the round-5 diff touches
  classification, schema comments, fixtures, and disclosures only; AD-10's
  single-producer confinement, the `kind='info'` + mutating-file-tool
  deny-eligibility predicate (848–852), reactive-only, text-never-denied,
  self-clearing/no-counter (876–877), the lag clause's clear-axis-only scope
  (879–888), and per-consumer scope (AC-2a-i) are all textually untouched and
  re-read consistent. The flipped unlisted-object default *shrinks* the
  deny-capable set, which cannot create a new deny path — so R6-S1 is an
  *under*-enforcement/consistency defect, never a new wrongful-deny surface.
- **Owner-constraint scan on the round-5 additions:** `OL-C1` — the object
  lexicons, per-project watermarks, and segment rules are classification and
  bookkeeping; no volume/count/budget cap introduced. `OL-R5` — clause (iv)
  remains a positive total classification; the unlisted default is a positive
  branch. `FR-B3`/`OL-R4`/`OL-7` — no new deny producer, no `permissionDecision`
  on `PostToolUseFailure` (channel still none, AD-6 line 643), no generated-file
  consumption, no credentials, no pre-emptive gate. Clean.
- **Phase-boundary honesty:** the run-and-failed routing defers to Phase B a
  case Phase A could partially detect — the deferral is the spec's own
  (D-27/FR-A2m predate this round), the regret-floor label discloses the
  designed silence, and no Phase B design was written against no data. The
  skeleton labels (AD-9, L1, AC-12) are intact.
- **check_docs.py citation surface:** every `AD-`, `FR-`, `AC-`, `D-`, `OL-`,
  `V`, `T` key the round-5 diff introduced or moved resolves under the mechanical
  checker (exit 0) and, for the load-bearing ones hand-checked above (D-27,
  FR-A2m, FR-A2g, FR-B5, D-41, OL-C3, OL-C5, OL-6, OL-11, OL-C1), the cited row
  says what the sentence uses it for.

## Convergence Record

- **Round number:** 6 (fifth Post-fix round).
- **Trajectory (expert-review severity, this axis; each round's own mechanical
  breakdown):** R1: 4S/4M/5m → R2: 4S/3M/4m → R3: 0S/2M/6m → R4: 1S/1M/5m →
  R5: 1S/2M/5m → **R6: 1S/1M/3m**. (Collapse-hunt collapse-class, for context:
  5 → 6 → 1 → 1 → 0 → [round-6 collapse-hunt running in parallel, not seen by
  this pass].)
- **Flow counts for this round (provenance per Step 9):** prior findings closed
  = 13 of 15 round-5 findings (R5-S1, R5-M1, R5-M2, R5-m1, R5-m2, R5-m3, R5-m4,
  P1, P3, P4, N1, N2, N3 fully; P2 partially); still-open/re-asserted = 2
  (R5-m5/N4 → R6-M1 **recurring**; P2 → R6-m1 **recurring/partial**). New
  findings = 1 (R6-S1). Regressions = 1 (R6-S1 is introduced by the round-5
  fix — a regression of the round-3/round-4 deny-capable escalation re-ask; also
  counted as new). R6-m2 = regression-residual of the per-project fix;
  R6-m3 = recurring (R5-m3's unpinned fixture).
- **Tripwire evaluation (arithmetic shown):**
  - Condition (a) — *new + regression ≥ closed for two consecutive Post-fix
    rounds*: this round new+regression = R6-S1 (1) plus the two residual
    regressions (R6-m2 regression-residual; treat generously as ≤ 3 total) = at
    most 3; closed ≈ 13. 3 < 13 → **not met this round.** Round 5: new+regression
    (R5-S1 new, R5-M1/R5-M2 in-fix defects) ≈ 3–5; closed ≈ 10. Also not met.
    **Two-consecutive-round condition (a): NOT FIRED.**
  - Condition (b) — *total findings not strictly decreasing for two consecutive
    Post-fix rounds*: R4 total = 7 (1S/1M/5m), R5 total = 8 (1S/2M/5m — a
    one-finding increase), R6 total = 5 (1S/1M/3m — a strict decrease). R5 did
    not strictly decrease from R4 (7 → 8), but R6 strictly decreased from R5
    (8 → 5), breaking any two-consecutive run. **Condition (b): NOT FIRED.**
  - **Tripwire: NOT FIRED.** The cycle is converging in blast radius (this
    round's findings are confined to one clause's unlisted-object default, one
    CLI verb's scope, one schema comment, one enumeration, and one fixture — no
    finding reaches the deny confinement, the owner constraints, or the phase
    boundary), and total findings resumed strict decrease.

## Recommended Priority

The tripwire has not fired, so a further fix round — **not** Gate-8 foundational
rework — is the indicated path. Fix in this order, by impact on the owner
objectives:

1. **R6-S1 first** — it disarms `OL-C3`'s escalation recourse and pins an
   unpassable Phase-A fixture; it is the one finding that touches an owner
   objective and blocks a build. The fix is a single meta-answer clause in
   clause (iv) plus one corpus pair.
2. **R6-M1** — the owner-facing calibration loop for the whole answer-drift
   block is inert until `tune` can write list-valued lexicons; the fix is an
   AD-20/AD-5 extension (or an honest re-scope of the "shrunk by tending"
   mitigation). This also removes the "asserted resolution without delivery"
   pattern from the document before it inherits into Phase B.
3. **R6-m1, R6-m2, R6-m3** — three one-line syncs (complete AD-4's enumeration;
   sync the WRITER comment; add the runner+unknown fixture).

Because R6-S1 and R6-m3 both entered as the round-5 repair's own example/fixture
text outrunning its mechanism, the applier should — per the collapse-log's
2026-08-29 Lesson 1 — treat every worked example and fixture the fix retains or
adds as author text and re-derive its outcome from the *new* mechanism before
pinning it.

---

*Round-6 expert review, 2026-09-03. **Not the terminal round.** R6-S1 is a real
Serious — the round-5 unlisted-object→`request` default silently reclassifies
the `OL-C3` escalation re-ask "can you please answer my question?" from
deny-capable to tracked-only, contradicting clause (iv)'s own example and
pinning an unpassable AC-24 fixture — so the convergence bar ("a round that finds
nothing real") is unmet. The findings are all single-sentence-to-single-mechanism
fixes and their blast radius has narrowed to one clause, one CLI verb, one schema
comment, one enumeration, and one fixture; the deny confinement, the owner's
locked constraints, and the phase boundary all held. **Inheritance for round 7:**
(1) the object-mechanism's two opposite unlisted-noun directions are the live
collapse surface — an unlisted *build* noun must fail toward `request`
(safe) while an unlisted *text-answer* noun ("question") must fail toward `info`
(deny-capable); any fix must pin *both* directions in the corpus, and re-derive
every retained worked example (line 763) and fixture (line 1665) from the new
mechanism before trusting it. (2) When a round-5-style fix answers a "name the
home/writer" finding by naming a surface (`tune`) that another decision restricts
(to numbers), verify the named surface can actually perform the operation — a
named-but-incapable writer is the "renaming a hedge is not resolving it" pattern.
(3) An enumeration prescribed for one site (AD-4) but applied at another (AD-18)
leaves the canonical site incomplete — re-audit AD-4 for the tenth reader.*

Verdict: NEEDS FIXES (5 findings: 1 Serious, 1 Moderate, 3 Minor)
