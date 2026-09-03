# Round-7 expert review — Phase A architecture (round-6 fix verification + new-defect hunt)

**Artifact:** `docs/architecture-phase-a.md` at current HEAD, commit `92ab11f`
("arch: apply all round-6 review findings (context-oracle Phase A)"), diffed
against the round-6-reviewed draft (`2a63f9a`) with
`git show 92ab11f -- middleware/context-oracle/docs/architecture-phase-a.md`.
**Reviewer:** independent session, not the author of the document or of any prior
review. Read in full before the attack: `middleware/context-oracle/CLAUDE.md`,
`OWNER-LEDGER.md`, `docs/specs/spec-context-oracle.md` (all 1130 lines),
`docs/collapse-log.md` (the 2026-09-03 entry first, then 2026-08-29, then the
rest, per the charter), both round-6 review files, the architecture end to end
(all 2337 lines), and the full round-6 apply diff.
**Axis (round-7 charter):** premises and engineering standards — correctness,
completeness, verification-actually-performed, standards-conformance, citation
integrity, internal consistency. The round-6 fixes (commit `92ab11f`) are the
primary attack surface, attacked **as author text** (collapse-log 2026-08-29
Lesson 1: a reviewer's repair prescription carries no verification of its own).
Every check below was run in this session; nothing is carried forward from the
author's attestations or prior rounds' claims without re-derivation. Findings
were not manufactured to avoid an empty report; the convergence bar was applied
as stated — an empty findings list with enumerated clean checks would have been
a legitimate PASS, and this round is not it.

## Scope and Inventory

**Round number:** 7 (Post-fix review; the sixth Post-fix round of this series).

**Tool plan (instruments and claim-type mapping).**
- Literal-content / internal-consistency claims (the bulk of this review): `Read`
  at the specific file:line, this session — every finding's location was re-read
  at drafting time.
- Absence / "no rule covers this input" claims: `Grep` across the full document
  for the mechanism's signature, then `Read` of each region (search locates,
  reading verifies — collapse-log 2026-07-30 Observation 14). The load-bearing
  absence claim (no classifier rule for a no-object communicative verb) was
  established by `Grep` for the handling vocabulary returning zero hits **and**
  by `Read` of the entire clause-(iv) branch structure.
- The one external premise a round-6 fix reuses (the hooks contract behind the
  `deny_bypass_suspect` path-write predicate — V19): `WebFetch` against
  `code.claude.com/docs/en/hooks` this session (Context7 loaded as backup). No
  instrument class was unavailable; no load-bearing claim is stranded, so no halt
  condition arose.
- The mechanical floor: `python3 middleware/context-oracle/tools/check_docs.py`,
  run this session.

**Post-fix inventory (four sources per the skill's Step 2).**

*(1) The prior review's full inventory + (2) the fix-diff files + (3) dependents,
verified this session:*
- [x] `docs/architecture-phase-a.md` — **Read in full** (lines 1–2337, across
  paged reads; every cited region re-read at drafting time).
- [x] `docs/specs/spec-context-oracle.md` — **Read in full** (1–694, 695–1130;
  OL-C3/OL-C5, FR-B1/B2/B5, FR-L4, D-27/D-39/D-41, FR-A2g/A2m, §11.5 citations
  hand-checked at their rows).
- [x] `OWNER-LEDGER.md` — **Read in full** (OL-C1, OL-C3, OL-C5, OL-6, OL-11,
  OL-R4, OL-R5 re-read at use).
- [x] `middleware/context-oracle/CLAUDE.md` — **Read in full** (dominating rules;
  the verify-before-assert standing rule).
- [x] `docs/collapse-log.md` — **Read in full** (2026-09-03 entry first — the two
  round-6 lessons; then 2026-08-29; then the rest).
- [x] `docs/reviews/2026-09-03-round-6-expert-review-architecture-phase-a.md` —
  **Read in full** (closure items R6-S1, R6-M1, R6-m1, R6-m2, R6-m3).
- [x] `docs/reviews/2026-09-03-round-6-collapse-hunt-architecture-phase-a.md` —
  **Read in full** (closure items P1–P4, N1–N5).
- [x] `middleware/context-oracle/tools/check_docs.py` — **Grep-verified** by
  execution (exit 0, output pasted below).
- [x] `code.claude.com/docs/en/hooks` (external premise V19/V2) —
  **Grep-verified** via WebFetch this session (PostToolUse "After a tool call
  succeeds"; PostToolUseFailure "After a tool call fails"; PreToolUse deny
  "Blocks the tool call" — confirmed).

*(4) Prior findings as closure items:* the round-6 resolution table below
re-derives each of the 9 round-6 findings (5 expert-review + 4 collapse-hunt)
from current source this session.

No new in-scope file surfaced mid-pass. AD-24's named build-time verifications
(marker presence on the owner's real transcript; whether platform-injected turns
fire `UserPromptSubmit`) remain out of this container's reach and are correctly
disclosed as build-time (L11) — not scored as review gaps. No rigor was waived.

## VERDICT: NEEDS FIXES — 0 Critical / 1 Serious / 1 Moderate / 1 Minor

Every round-6 finding is resolved in substance at the location it named. But
three defects live **inside the round-6 repair text**, and each is one of the
collapse-log's two round-6 lessons validated again:

- **R7-S1 (Serious)** is collapse-log 2026-09-03 Lesson 1 ("a fix must land where
  the finding named — and sweep every sibling") recurring exactly as the round-6
  charter warned it would. Round-6 R6-S1 restored the `OL-C3` escalation re-ask by
  seeding `question`/`answer` into the information-object lexicon — but the fix is
  driven entirely by the **object head noun**, and a request-frame communicative
  verb with **no object** ("can you explain?", "can you clarify?", "can you
  confirm?", "can you answer?", "can you tell me?") is classified by **no rule in
  clause (iv)**, violating AD-9's own stated invariant that clause (iv)
  "classifies, positively, **every** opened row." The object-bearing sibling was
  swept; the object-less sibling — whose correct kind is `info` (text fulfilment)
  and which is a common phrasing — was not, disarming the `OL-C3` recourse and the
  answer-drift block for that whole class.
- **R7-M1 (Moderate)** is R6-M1's "named-but-incapable writer" pattern recurring
  one list over. Round 6 extended `tune` to close R6-M1, but named exactly three
  lexicons; the round-6 P1 fix's own L1 text says wrongful-deny member shape (2)
  is "shrunk by **tending the stoplist**," and the rhetorical/idiom stoplist is
  **not** on `tune`'s surface — the mitigation the round-6 fix leans on names a
  capability the document does not provide, and AD-15's "tended via `ctxoracle
  tune`, **like every lexicon in this document**" is now a false universal.
- **R7-m1 (Minor)** is the round-6-added `deny_bypass_suspect` path-write
  predicate over-detecting (it flags any post-deny file-writing Bash row, not one
  correlated with the denied action's target — including `OL-C5`-protected
  redirected test runs), presented without the over-count error direction the
  document's own done-claim-counter discipline requires.

Nothing reaches the deny producer's structural confinement (AD-10), the owner's
locked constraints (`FR-B3`/`OL-R4`/`OL-7`/`OL-C1`), or the phase boundary — all
re-walked clean. By the mechanical rule a single Serious blocks PASS; round 7 is
not the terminal round.

---

## Summary

This review returns **NEEDS FIXES**. The round-6 fixes are, in the main, correct
and landed at their canonical sites: the `whisper_stats` WRITER comment is now
per-project and its three sibling references (global_meta, AD-6 SessionEnd,
AD-23) all agree (R6-m2/P3 resolved and swept); AD-4's consumer filter now
enumerates the FR-L4 re-edit clause and re-buckets `deny_bypass_suspect` (R6-m1/P2
resolved, enumeration re-audited complete — no eleventh reader); the same-name
Reuse fixture now pins honest disclosure rather than the unproducible exclusion
(P4/R6-m3 resolved); the comparability discriminator (language, not stored count)
is stated (N2); and `tune` was extended to list-valued lexicon keys (R6-M1
partly resolved). But the R6-S1 fix — object-head-driven — did not sweep the
no-object sibling class, leaving clause (iv) partial against its own "classifies
every opened row" invariant and the `OL-C3` recourse disarmed for "can you
explain?"/"can you answer?" (R7-S1); the round-6 P1 fix's "shrunk by tending the
stoplist" mitigation leans on a `tune` surface that omits the stoplist (R7-M1);
and the round-6 path-write predicate over-flags legitimate post-deny file writes
(R7-m1). By the mechanical rule a single Serious blocks PASS; round 7 is not the
terminal round.

## Upstream Contract Verification (Step 7)

Each governing spec/ledger item the round-6 fixes touch, checked honored/violated
against the verified current text this session:

- **`OL-C3` (answer-drift block — "block that motherfucker until it stops
  ignoring me and actually answers")** — **VIOLATED for the object-less
  meta-answer / direct-info phrasings** (R7-S1). "can you answer?", "can you
  explain?", "can you clarify?", "can you confirm?" are request-frame
  communicative verbs with no object; clause (iv) has no rule for them, so under
  the safe-default reading they are `request` (tracked, not deny-capable) and the
  recourse is disarmed. Verified: `OWNER-LEDGER.md` OL-C3 read; AD-9 clause (iv)
  branches read at lines 759–798; `Grep` for no-object handling → zero hits.
- **`OL-C5` (answer-drift definition)** — **honored at the definitional level**:
  the trigger remains OL-C5's owner wording (AD-9 line 869–872, `D-39`
  unchanged); R7-S1 is a classifier-completeness/recognizer regression, not a
  redefinition.
- **`OL-C1` (no arbitrary volume/count/budget cap)** — **honored**: the round-6
  additions (info-lexicon seeds, list-valued `tune` rows, the path-write
  predicate, the per-project watermark, fixtures) are classification, config, and
  bookkeeping; the owner-fidelity re-scan of the round-6 diff found no volume/
  count/budget term introduced.
- **`OL-6` / `FR-K9` (two stores; per-project fold; solo multi-repo)** —
  **honored and now fully swept**: the `whisper_stats` WRITER comment is
  per-project, matching global_meta, AD-6, and AD-23 (R6-m2/P3 resolved).
- **`FR-B5` (per-error-direction leans)** — **honored in letter; the safe-default
  posture is over-applied at the no-object communicative verb** (R7-S1): defaulting
  it to `request` is the err-toward-not-denying direction, but the correct kind is
  `info` (text fulfilment), so the "safe" default is the wrong direction for this
  input class — the substance of R7-S1.
- **`FR-L4` (regret proxy — existence required, gates nothing)** — **honored**;
  AD-4's re-edit clause is now enumerated (R6-m1 resolved).
- **`FR-B3` / `OL-R4` / `AC-2` (no pre-emptive gate, no generated-file block, no
  mutation, one deny producer)** — **honored**: the round-6 diff touches
  classification, schema comments, the CLI verb, a diagnostic predicate,
  disclosures, and fixtures only; AD-10's single-producer confinement, the
  `kind='info'`+mutating-file deny-eligibility predicate, reactive-only,
  text-never-denied, and self-clearing are textually untouched and re-read
  consistent. R7-S1 *shrinks* the deny-capable set (it moves phrasings from
  potential `info` to `request`), which cannot create a new deny path — so it is
  an under-enforcement/consistency defect, never a new wrongful-deny surface.
- **AD-9's own invariant "clause (iv) classifies, positively, every opened row"
  (line 754)** — **VIOLATED** (R7-S1): a request-frame communicative verb with no
  object head is an opened row (clauses i–iii passed) that no clause-(iv) rule
  classifies.

---

## Serious

### R7-S1 — The R6-S1 fix is object-head-driven, so a request-frame communicative verb with **no object** ("can you explain?", "can you answer?", "can you confirm?") is classified by no rule in clause (iv) — violating AD-9's own "classifies, positively, every opened row" invariant, leaving an inline architectural decision to the implementer in the soundness-critical classifier, and disarming the `OL-C3` recourse for a common phrasing class whose correct kind is `info`

**Location.** AD-9 clause (iv), the communicative-verb branch (lines 759–798,
especially the object cases at 768–790 and the request-frame remainder at
791–792) × AD-9's stated invariant "Clause (iv) then **classifies, positively,
every opened row**" (line 754) × the round-6 R6-S1 seed of `question`/`answer`
into the information-object lexicon (lines 771–773) × the Gate-A attestation "No
inline architectural calls found remaining" (line 1841) × AC-24's answer-drift
corpus (lines 1710–1719) × L1's coverage ledger (lines 2043–2079).

**What is wrong.** Round-6 R6-S1 restored deny-capability for the escalation
re-ask "can you please answer my question?" by seeding `question`/`answer` into
the **information-object lexicon** — i.e., the fix operates entirely on the
verb's **object head noun**. Clause (iv)'s communicative branch, verified this
session (Read of lines 759–798), enumerates exactly these cases:
- non-request-frame interrogative → `info` (759–760);
- request-frame + communicative verb + **wh-complement** → `info` (765–773);
- request-frame + communicative verb + **object head on the information-object
  lexicon** (error/output/log/…/question/answer) → `info` (771–773);
- request-frame + communicative verb + **object head on the artifact-object
  lexicon** (demo/test/…) → `request` (777–780);
- request-frame + communicative verb + **"Any other object — an unlisted head
  noun** ("show me a prototype?")" → `request` (784–786);
- request-frame **remainder — any non-communicative verb** → `request` (791–792).

**Every communicative-branch case presupposes an object exists** (a wh-complement
or a head noun). There is **no rule for a request-frame communicative verb with
no object at all.** The object definition itself creates the gap: "The object is
the head noun of the noun phrase **immediately following the verb** (skipping an
optional 'me/us')" (763–764) — so "can you tell me?" (tell + *me* skipped +
nothing), "can you show me?", "can you explain?", "can you clarify?", "can you
confirm?", "can you answer?" all have **no head noun after the verb**. They are
not "an unlisted head noun" (there is no noun), and they are not the
"non-communicative verb" remainder (the verb *is* communicative). They fall
through all six cases.

This violates AD-9's own invariant, stated one paragraph above: "Clause (iv) then
**classifies, positively, every opened row**" (line 754). These phrasings open a
row (clause i: ends with `?`; clause ii: outside fences; clause iii: not on the
rhetorical stoplist) and clause (iv) then classifies nothing. Two consequences:

1. **Inline architectural decision left to the implementer, in the
   soundness-critical classifier.** AD-9 states this classification "is where the
   block's soundness lives" (line 756); the Gate-A review claims "No inline
   architectural calls found remaining" (line 1841); AD-24 unit-tests "the
   info/request classifier against a **labeled corpus**" (lines 1645–1646). An
   implementer building the classifier hits "can you explain?" with no rule and
   must invent the classification — and the labeled corpus has no defined expected
   output for it.

2. **The `OL-C3` recourse and the answer-drift block are disarmed for a common,
   correct-to-enforce phrasing class.** The correct kind for an object-less
   communicative verb is `info` (fulfilment is text, exactly the reasoning the
   document gives for "can you show me the error?" → info at 773–774). Under the
   safe-default reading an implementer will most plausibly reach ("lexicon
   incompleteness must fail toward under-enforcement" — 786–787, and the
   "unlisted object → request" spirit), "can you explain?"/"can you answer?"
   classify `request` → tracked-only → the agent may `Edit` while the direct info
   question sits unanswered, and the block never fires. This is the exact
   defect class of R6-S1 (a disarmed `OL-C3` recourse), for a **sibling phrasing
   the round-6 fix did not sweep**.

**How verified.** Read of AD-9 lines 754 and 759–798 this session (the full
branch structure); Read of lines 763–764 (object definition with the me/us skip)
and 784–792 (the unlisted-noun default and the non-communicative-verb remainder);
`Grep "no object|object-less|without.*object|bare verb|no.*head noun"` across the
document → **zero** hits handling a no-object communicative verb; `Grep
"head noun"` → lines 763, 785, 2293 only, all presupposing a head noun exists.
Provenance re-derived: round-4's rule was "communicative verb **without a
repo-artifact object → info**" (round-6 review R6-S1 section; round-6 apply diff
removed text), which classified no-object communicative verbs `info`; round-5's
object-head restructure removed that catch-all and introduced the no-object gap;
round-6's R6-S1 fix repaired only the `question`/`answer` **object** sub-case,
not the no-object sibling. So this is a **regression** introduced by round-5's
restructure, present through round 6, that round 6's R6-S1 fix had the opportunity
to sweep (as the object-less sibling of the very phrasing it was fixing) and did
not.

**Failing scenario.** Max asks "why is the build broken?" (→ `info`,
deny-capable). The agent narrates without answering; the clear recognizer's
steady-state lean marks it `answered` (`generic_text_all_prior`). Max escalates
with "can you answer?" (or, just as commonly, asks a fresh direct question "can
you explain?"). "can you answer?" is request-frame (`can`…`you`…`answer`), verb
`answer` is communicative, and **no object follows** — clause (iv) has no rule;
under the safe default it opens `kind='request'`, tracked-only. The agent's next
`Edit` is **not denied**. The recourse `OL-C3` names ("block that motherfucker
until it … actually answers") is gone for this phrasing. As with R6-S1, the guard
normally offered — `ctxoracle correct --missed-question` — "is routed **through
the same info/request classifier**" (AD-18 lines 1416–1418), so supplying "can
you answer?" there also hits the no-object gap; only re-supplying the original
question's text re-arms.

**Why Serious (boundary noted).** It disarms an owner-objective recourse
(`OL-C3`) for a **class** of common phrasings ("can you explain/clarify/confirm/
answer/tell me?"), not one string; it leaves the soundness-critical classifier
**partial** against its own stated invariant (undefined behavior on a reachable
input); and it is an inline architectural decision the document attests it has
none of. It is bounded — the harm direction is under-enforcement (the agent is
not wrongfully halted; no build-blocking fixture contradiction, unlike R6-S1),
Max sees his own unanswered question (the human channel), and re-asking the
**original** question verbatim still re-arms — which is why it is Serious and not
Critical. Round 6 graded its object-bearing analogue R6-S1 as Serious; this is
the same defect class for the object-less sibling, wider in phrasing coverage,
which is why it is not downgraded to Moderate despite lacking the unpassable
fixture.

**Fix (single mechanism).** Add the missing case to clause (iv), placed so it is
the default *within* the communicative branch: **a communicative verb with no
object head (after skipping an optional "me/us") classifies `kind='info'` —
fulfilment is text, which the deny-eligible set can never touch — so "can you
explain?", "can you clarify?", "can you confirm?", and "can you answer?" stay
deny-capable.** This restores the totality clause (iv) claims, makes the correct
(text-fulfilment) classification the branch default, and closes the `OL-C3` gap
for the whole object-less class. Then add a discriminating corpus pair to AC-24:
"can you explain?" → `info` (deny-capable) beside "can you show me a demo?" →
`request` (object present, artifact-fulfilled) — so both directions of the
communicative branch (object-present-artifact vs object-absent-text) are pinned.
(If instead the owner accepts that object-less communicative asks are not
deny-capable in Phase A, that is a coverage decision that must be **added to L1's
under-enforcement ledger as its own line** — it is currently in none of L1's
three loss categories — and reconciled with AD-9's "classifies every opened row"
invariant; but that under-enforces `OL-C3` for a common class, so the info-default
fix is the correct one.)

---

## Moderate

### R7-M1 — The round-6 P1 fix says wrongful-deny member shape (2) is "shrunk by **tending the stoplist**," but `tune`'s round-6-extended surface (AD-20) covers only the communicative-verb, information-object, and command-classification lexicons — not the rhetorical/idiom stoplist — so the mitigation the fix leans on names a capability the document does not provide; and AD-15's "tended via `ctxoracle tune`, like **every** lexicon in this document" is a false universal

**Location.** L1's two-member residual (round-6-added; line 2078–2079: "The
stoplist is fallible by construction, so the second shape is owned and **shrunk by
tending the stoplist**, not eliminated") × AD-9's parallel residual sentence (line
889–890: "the stoplist is fallible by construction, so this shape is owned, **not
eliminated**" — note: no "shrunk by tending" clause) × AD-20's `tune` surface
(round-6-extended; lines 1519–1527: list-valued keys are "the communicative-verb,
information-object, and command-classification lexicons") × AD-15's Verification
row (line 1273: classes 1–2 "config-enumerated (in `tuning`, AD-5 — tended via
`ctxoracle tune`, **like every lexicon in this document**)") × AD-9's inert
artifact-object lexicon (lines 780–784).

**What is wrong.** Round-6 R6-M1 was "name the config home and writer, and make
the writer able to perform the operation." The fix extended `tune` from a
numbers-only writer to list-valued lexicon keys — but enumerated **exactly three**
lexicon families: communicative-verb, information-object, command-classification
(AD-20 lines 1521–1522). In the *same* round-6 pass, the P1 fix documented
wrongful-deny **member shape (2)** (the rhetorical/idiom interrogative that
escapes clause (iii)'s stoplist) and stated its mitigation in L1: it is "**shrunk
by tending the stoplist**" (line 2078–2079). The document's established meaning of
"tending" a list is "via `ctxoracle tune`" (used verbatim for the communicative/
information lexicons at line 770). But the rhetorical/idiom stoplist is **not** on
`tune`'s surface — so the mitigation the round-6 P1 fix leans on to control
member shape (2) (a *wrongful-deny*, i.e. the less-safe over-enforcement
direction, which disrupts the agent) is **inoperable for the owner**. This is the
R6-M1 "named-but-incapable writer" pattern (collapse-log "renaming a hedge is not
resolving it") recurring one list over, introduced by the round-6 P1 fix itself:
the mitigation was asserted without the capability being delivered.

Compounding it, AD-15 line 1273 asserts classes 1–2 are "tended via `ctxoracle
tune`, **like every lexicon in this document**" — a false universal. At least
three lexicons/lists are **not** on `tune`'s surface: the (round-6-declared
inert) **artifact-object lexicon** (AD-9 780–784 — a lexicon, not in AD-20's
three), the **rhetorical/idiom stoplist**, and the **completion-claim lexicon**
(AD-15 1276). Round 6 both created the inert artifact-object lexicon and narrowed
`tune` to three families, so "every lexicon" is falsified by the round-6 fixes'
own additions.

**How verified.** Read of L1 lines 2070–2079 (member shape 2 + "shrunk by tending
the stoplist") and AD-9 lines 889–890 (the same residual without the mitigation
clause — an AD-9/L1 wording divergence) this session; Read of AD-20 lines
1519–1527 (`tune`'s three named lexicon families); Read of AD-15 line 1273 ("like
every lexicon in this document"); `Grep "lexicon\.|list-valued|tended via"` →
AD-20's three families (1521–1522), AD-9/AD-15/L1 "tended via `tune`" sites, and
zero mention of the stoplist as tunable; round-6 apply diff confirms the two-member
L1 text and the AD-20 extension are both round-6 additions.

**Failing scenario.** The rhetorical stoplist misses "ugh, why is CI always so
flaky??" (member shape 2). Max, reading L1, is told this is "shrunk by tending the
stoplist." He runs `ctxoracle tune` — it lists the communicative-verb,
information-object, and command-classification lexicons and the numeric keys, but
**no stoplist key**; `tune lexicon.stoplist +"why is CI always so flaky"` is
outside AD-20's stated surface. The mitigation is unreachable by the
non-programmer owner (`OL-11`) it exists for; wrongful denies from that phrasing
persist with no owner-driven shrink path, escapable only one deny at a time.

**Why Moderate (boundary noted).** It is narrower than R6-M1 (whose whole
answer-drift calibration loop was inert) — three lexicons *are* now tunable, and
the stoplist governs one wrongful-deny member the owner can still escape
per-instance by answering and record via `correct`. That keeps it below Serious.
But it is a load-bearing mitigation of a *newly documented* wrongful-deny member,
asserted by the round-6 fix without the capability, in the exact recurring shape
the collapse-log names — so it is not Minor.

**Fix (single mechanism).** Add the rhetorical/idiom stoplist to AD-20's `tune`
list-valued keys (`tune lexicon.stoplist +… / -…`), and correct AD-15's "like
every lexicon in this document" to name the tunable set (or say "every
config-enumerated classification lexicon," excluding the inert artifact-object
lexicon, the completion-claim lexicon, and — if kept build-time — noting which).
If instead stoplist changes are build-time only, say so at L1's "shrunk by
tending the stoplist" site and drop the runtime-tuning implication — but that
concedes `OL-11` cannot shrink member shape (2), so the extend-`tune` path is
preferred. Align AD-9 line 889–890 to L1 so both residual statements carry the
same (now-deliverable) mitigation.

---

## Systemic Patterns

No systemic pattern — verified by the proactive scans this session:
`Grep "no object|object-less|without.*object|bare verb|no.*head noun"` (0 hits —
R7-S1 is a single-clause gap, not a repeated pattern); `Grep "tune|tuning|
lexicon\.|list-valued"` (the three leaning sites for R7-M1 and the AD-20 surface,
no repeated capability defect across other decisions); `Grep "observed_actions"`
(11 readers, all enumerated in AD-4's filter — no repeated mis-bucketing);
`Grep "whisper_stats_watermark|per-project"` (all four sibling references
consistent — no repeated desync). The three findings are distinct defect classes
(a classifier-completeness gap, an incomplete tune surface, a diagnostic
over-match) with no single grep-able signature across enumerated instances; they
do not meet the systemic bar. The meta-thread — round-6 fixes landing at their
named site but not sweeping every sibling of the touched primitive — is described
in the closing paragraph as inheritance for round 8, not filed as a Systemic
finding (matching round 6's own handling of the analogous thread).

## Moderate & Minor Findings

*(The Moderate is R7-M1 above.)*

### R7-m1 — The round-6-added `deny_bypass_suspect` path-write predicate flags **any** post-deny file-writing Bash row, uncorrelated with the denied action's target (and co-firing with run-state redirections such as `npm test > out.log`), and — unlike the done-claim counter — is presented without its over-count error direction disclosed, inconsistent with the document's own "never present a proxy as a measurement" discipline

**Location.** AD-9's `deny_bypass_suspect` definition (round-6-added; lines
976–981: "recorded post-hoc when a deny is followed in the same turn by a
successful (`'ok'`) file-writing Bash row … the write identified by a path-write
predicate on the Bash `tool_input` (redirection, `tee`, in-place edit, copy/move
to a path)") × AD-4's consumer-filter bucket for it (lines 518–524) × the
done-claim counter's contrasting discipline (AD-9 lines 950–969: "`status` states
the label's **both** error directions in so many words: under-count … and
over-count") × AC-24's fixture (lines 1722–1725: "a successful (`'ok'`)
file-writing Bash command in the same turn as a deny raises `deny_bypass_suspect`,
a failed one does not").

**What is wrong.** The diagnostic exists to catch a specific bypass: "a denied
`Edit` retried as a file-writing `Bash` command" (L3, lines 2089–2092) — i.e., the
agent writing, via shell, the content the denied `Edit` would have written. But
the round-6 path-write predicate matches **any** file-writing Bash command in the
same turn as a deny, with **no correlation to the denied action's target path**.
Two consequences the round-6 text does not disclose:
1. **Uncorrelated writes over-flag.** A denied `Edit` to `parser.js` followed by
   `echo x > unrelated.txt` (or `cp a b`, `tee log`) raises `deny_bypass_suspect`
   though nothing bypassed the `parser.js` edit.
2. **It mis-flags the `OL-C5`-protected class specifically.** A Bash row can carry
   *both* a run-state `command_class` and a path-write `path` (the predicate is
   "distinct from the run-state `command_class`," line 524, i.e. additive). So
   `npm test > out.log` — running the test to get the answer, the archetypal
   `OL-C5`/`D-39` "action to provide the answer" that the block **never denies** —
   is a redirection (path set) and, following a deny, raises
   `deny_bypass_suspect`. The diagnostic flags a correct, protected, answer-directed
   action as a suspected bypass.

The document holds itself to a precise standard for owner-facing proxies: the
done-claim counter "states the label's **both** error directions in so many
words" and the general rule is "a proxy is never displayed as a measurement" (AD-9
966–969; AD-17's regret-label discipline). `deny_bypass_suspect` is surfaced in
`status` (AD-17 line 1361, 1387–1388) with no such over-count disclosure — a
non-programmer owner (`OL-11`) reading "`deny_bypass_suspect`: 3" cannot tell how
many were real bypasses versus redirected test runs.

**How verified.** Read of AD-9 lines 971–981 and AD-4 lines 518–524 this session
(the predicate is additive to `command_class`, so a runner row can also be a
path-write row); Read of AD-9 lines 950–969 (the done-claim counter's both-directions
discipline) and AD-17 lines 1361/1387–1388 (`deny_bypass_suspect` surfaced in
`status` without an error-direction label); Read of L3 lines 2089–2092 (the
specific bypass it targets) and AC-24 lines 1722–1725 (the fixture pins only the
happy-path fire, not the uncorrelated/redirected-runner over-fire). WebFetch
confirmed PostToolUse carries the tool row (V19) so the predicate has data.

**Why Minor.** `deny_bypass_suspect` gates nothing, is owner-facing, and is
explicitly "feeding the Phase B precision case" (AD-9 981) — over-detection does
not disrupt the agent and Phase B is expected to refine it, which keeps it Minor.
But it is a concrete imprecision in round-6-added mechanism text, and the missing
over-count disclosure is a divergence from the document's *own* proxy-labelling
standard, so it is a finding rather than an observation.

**Fix (single edit).** Either (a) tighten the predicate to correlate the written
path with the denied action's target (a bypass is a write to the *same* path the
denied `Edit` targeted, or the same region), so a redirected test run and
unrelated writes do not fire; or (b) if the rough signal is intentionally broad
for Phase B, disclose its over-count direction at AD-9 and in `status`'s label
("counts any post-deny file write, including redirected runner output and
unrelated writes — a Phase A over-approximation"), matching the done-claim
counter's both-directions discipline. Add a fixture case: a redirected runner
(`npm test > out.log`) after a deny → not counted (fix a), or counted-with-label
(fix b).

## Tentative Findings

No tentative findings — every candidate finding's premise was verified against
current source this session (Read at the cited lines, Grep for the absence/
occurrence claims, WebFetch for the one external hooks premise, and the mechanical
floor executed). Two candidates that could have been tentative were resolved to
non-findings by reading and are recorded in clean checks: the `tuning` table's
primary key for list-valued rows (derivable from the stated "one member per row …
the set of rows sharing its key" semantics — an implementer reaches
`(key, project_key, value)`; not a defect), and the path-write predicate's
*incompleteness* (misses `dd`, heredocs, `python -c` writes — under-detection, the
safe direction for a gates-nothing diagnostic; the reportable defect is the
*over*-match, R7-m1).

## Observations

- **The `deny_bypass_suspect` predicate is additive to `command_class`, which is
  correct design but under-exercised.** AD-4 line 524 states the path-write `path`
  is "distinct from the run-state `command_class`," so a single Bash row can carry
  both — good (a `npm test > log` row both subtracts run-state and is path-write).
  The observation is only that AC-24 pins neither the both-fields row nor the
  over-match it enables (see R7-m1); recorded as context.
- **The round-6 fixes introduce no new external premise.** Every round-6 change is
  internal design (classification, config, schema comments, a diagnostic
  predicate, fixtures). The one external premise a round-6 fix *reuses* — V19
  (PostToolUse carries the tool row; a `PreToolUse` deny generates no
  `PostToolUseFailure`, so the oracle's own denies cannot pollute
  `observed_actions.outcome`) behind the path-write predicate — is unchanged; this
  session's WebFetch re-confirmed the event-existence and firing-condition halves
  ("PostToolUse: After a tool call succeeds"; "PostToolUseFailure: After a tool
  call fails"; "PreToolUse … Blocks the tool call"). The "deny generates no
  PostToolUseFailure" and "tool_input on PostToolUse" halves were not re-surfaced
  through the lossy summarizer — a result about the instrument, not the source
  (collapse-log 2026-07-30 Observation 14) — and were established by the round-6
  fetch at the same primary source. No round-6 fix depends on a premise that has
  changed. No standard violated; recorded as premise maintenance.

## What's Actually Good

- **The `whisper_stats` per-project watermark fix (R6-m2/P3) landed at its named
  site and swept every sibling.** Judged against internal consistency (the
  collapse-log 2026-09-03 Lesson 1 standard, "a fix must land where the finding
  named"): the WRITER comment now reads "the **current** project store's
  whisper_audit rows … corrections newer than **that project's**
  `whisper_stats_watermark:<key>`, advancing only that key" (AD-5 lines 578–599),
  and its three siblings — global_meta (569–577), AD-6 SessionEnd (659), AD-23
  (1623) — all state per-project. Verified this session by Read of all four and
  `Grep "whisper_stats_watermark|per-project"` (no residual bare/plural
  reference). This is the exact sibling-sweep the round-6 lesson demanded, done.
- **AD-4's consumer enumeration (R6-m1/P2) is now complete on audit.** Re-audited
  per the collapse-log 2026-08-29 corollary ("an enumeration offered as a
  terminating repair is the first thing the next round verifies for
  completeness"): `Grep "observed_actions"` → 11 readers, and AD-4's filter
  (lines 497–524) now enumerates all of them with their outcome buckets — the
  CHANGE/READ set (edit-set, changed-regions, read-set, Coupling/Reuse, **the
  FR-L4 re-edit clause**) at `'ok'`; the RUN-STATE set at either outcome; the
  FR-L4 covering-test-failed clause at `'failed'`; and `deny_bypass_suspect` at
  `'ok'` file-writing rows. No eleventh reader is missing. (The predicate's
  over-match is R7-m1; the enumeration's *completeness* holds.)
- **The same-name Reuse fixture (P4/R6-m3) now asserts a behavior the mechanism
  produces.** Judged against FR-D1's no-rumor rule and the round-5/round-6
  standing question ("name the mechanism that produces the asserted fixture
  behavior"): AC-1b now pins the same-name collision as "**fired with the
  false-positive caveat in the whisper's evidence and its confidence capped** —
  `symbol_refs` counts such matches, so the fixture pins honest disclosure, not
  exclusion" (lines 1667–1670), matching L6 (2117–2120) and the counting
  mechanism (AD-12) — the unproducible "does not crown a false rival" assertion is
  gone. Verified this session by Read of AC-1b, L6, and AD-12's `symbol_refs`
  definition.

## Round-6 finding resolution table

"Resolved" = fixed in substance at the location the finding named, swept, no
surviving contradicting copy, except where a note points at a finding above.
(ER = round-6 expert review; CH = round-6 collapse-hunt; P3 = R6-m2 overlap.)
Each row re-derived from current source this session, not carried from the fix
attestations.

| Round-6 finding | Status in `92ab11f` | Where / notes (verified this session) |
|---|---|---|
| ER R6-S1 (unlisted-object default disarms the escalation re-ask "can you please answer my question?") | **Resolved for the object case; new sibling defect** | `question`/`answer` seeded into the information-object lexicon (AD-9 771–773); AC-24 pins "can you please answer my question?" → `info` (1701–1704); L1 states the recourse re-arms (2059–2060). Re-derived correct for the object-bearing case. The object-head-driven fix did **not** sweep the no-object communicative-verb sibling → **R7-S1**. |
| ER R6-M1 = CH N5 (lexicons not tunable; `tune` writes numbers) | **Resolved for three lexicons; residual for the stoplist** | `tune` extended to list-valued keys (AD-20 1519–1527); `tuning` schema states one-member-per-row (AD-5 600–609). But `tune`'s surface names only communicative-verb/information-object/command-classification; the round-6 P1 fix's "shrunk by tending the stoplist" leans on tuning the stoplist, which is not on the surface → **R7-M1**. |
| ER R6-m1 = CH P2 (AD-4 omits the FR-L4 re-edit clause — the tenth reader; `deny_bypass_suspect` mis-bucketed; "file-writing `command_class`" unspecifiable) | **Resolved** | AD-4's CHANGE/READ bullet now names "the FR-L4 re-edit/revert clause (AD-18) — consume 'ok' rows only" (502–506); `deny_bypass_suspect` re-bucketed to "'ok' file-writing Bash rows only," identified by a stated path-write predicate distinct from `command_class` (518–524). Enumeration re-audited complete (11 readers). The predicate's *over-match* is a new, separate issue → **R7-m1**. |
| ER R6-m2 = CH P3 (whisper_stats WRITER comment desynced from the per-project watermark) | **Resolved and swept** | WRITER comment now "the current project store's … that project's `whisper_stats_watermark:<key>`" (AD-5 578–599); global_meta, AD-6, AD-23 all agree (see What's Actually Good). |
| ER R6-m3 (runner+unknown-runner compound `npm test && make integration` unpinned) | **Resolved** | AC-24 now pins "`npm test && make integration` **both** subtracts npm's covering tests **and** composes the weaker 'no recognized run' claim for `make` — segments contribute independently" (1731–1733). Read this session. |
| CH P1 (wrongful-deny residual "exactly one member shape" false; count drift; artifact-object lexicon vestigial) | **Resolved** | Residual re-opened to **two member shapes** (AD-9 880–891; L1 2070–2079); "all four lexicons"/"two config-enumerated lexicons" both removed (`Grep` → 0 hits); artifact-object lexicon marked **inert** (AD-9 780–784, L1 2053), with L1 naming the stoplist as "the one list whose incompleteness fails the *other* way" (2053–2055). The stoplist's *shrink mitigation* is R7-M1; the classification itself is resolved. |
| CH P4 (same-name fixture asserts unproducible prevention; comparability discriminator unstated) | **Resolved** | Same-name fixture now asserts honest disclosure (AC-1b 1667–1670, L6 2117–2120); the discriminator ("language, not stored count") is stated (AD-15 1269). Traced correct this session. |
| CH N2 (comparability discriminator unstated) | **Resolved** | AD-15 Reuse row now states "The discriminator is the candidate's language, not its stored count … an unimported grammar symbol is never over-silenced" (1269). |
| CH N4 (regret designed-silence floor label) | **Held from round 5, intact** | AD-18 label present (1441–1445); unchanged by the round-6 diff, re-read consistent. |

## Checks run that came back clean

- **Mechanical floor:** `python3 middleware/context-oracle/tools/check_docs.py`
  → `context-oracle doc-consistency check passed.` (exit 0) on the current tree,
  run this session.
- **AD-4 consumer enumeration completeness (charter directive — re-audit for an
  eleventh reader):** `Grep "observed_actions"` → 11 reader sites; each maps to a
  bucket in AD-4's filter (497–524): edit-set/changed-regions/read-set/Coupling/
  Reuse/FR-L4 re-edit at `'ok'`; run-subtraction/no-recognized-run-survey/class-3
  scan at either outcome; FR-L4 covering-test-failed at `'failed'`;
  `deny_bypass_suspect` at `'ok'` file-writing. No reader is unbucketed; no
  twelfth reader elsewhere (the regret proxy's two reads and the deny_bypass
  read are all present). Enumeration complete.
- **Watermark sibling consistency (charter fix 5):** `Grep
  "whisper_stats_watermark|per-project|watermark"` + Read of AD-5 (569–599),
  AD-6 (659), AD-23 (1623), L11 (no watermark reference — vacuously consistent) —
  all state per-project; no residual bare/plural reference.
- **Comparability discriminator + fixtures (charter fix 6):** Read of AD-15
  Reuse row (1269), L6 (2117–2120), AC-1b (1662–1670) — the discriminator is
  "language, not stored count," the unimported-grammar case is "still comparable,"
  the same-name case is "honest disclosure, confidence-capped"; `npm test && make
  integration` pinned (AC-24 1731–1733). Mechanism produces each asserted
  behavior.
- **"inert" artifact-object consistency (charter fix 2):** `Grep "inert|
  artifact-object"` + Read — AD-9 (780–784), L1 (2053), AC-24 (1712) all treat
  it as inert / satisfiable via the default; consistent. The rhetorical-lead-in
  member's mechanism (clause iii stoplist) is real and decidable (a match against
  a stated list); its fallibility is owned. (Its *shrink mitigation* is R7-M1.)
- **"numbers-only `tune`" sweep (charter fix 3):** `Grep "tune|tuning|numbers"` +
  Read of AD-20 (1519–1527) — no site still restricts `tune` to numbers; the
  round-4 "number-writer" phrasing is gone. (The residual is the omitted stoplist
  and the "every lexicon" universal — R7-M1.)
- **§8 deny-confinement re-walk on the round-6 text:** the round-6 diff touches
  classification (AD-9 clause iv), schema comments (AD-4/AD-5), the `tune` verb
  (AD-20), a diagnostic predicate (AD-9/AD-4), disclosures (L1/L6/AD-15), and
  fixtures (AD-24) only; AD-10's single-producer confinement, the `kind='info'` +
  mutating-file-tool deny-eligibility predicate (861–867), reactive-only,
  text-never-denied (899–902), self-clearing/no-counter, and the lag clause's
  clear-axis-only scope (904–913) are textually untouched and re-read consistent.
  R7-S1 *shrinks* the deny-capable set, which cannot create a new deny path.
- **Owner-constraint scan on the round-6 additions:** `OL-C1` — info-lexicon
  seeds, list-valued `tune` rows, the path-write predicate, the per-project
  watermark, and fixtures are classification/config/bookkeeping; no volume/count/
  budget cap. `OL-R5` — clause (iv) remains a positive total classification (the
  R7-S1 gap is a *missing* positive case, not a negative-space definition).
  `FR-B3`/`OL-R4`/`OL-7` — no new deny producer, no `permissionDecision` on
  `PostToolUseFailure` (AD-6 655), no generated-file consumption, no credentials,
  no pre-emptive gate. Clean.
- **External premise re-establishment (this session, WebFetch on
  `code.claude.com/docs/en/hooks`):** PostToolUse "After a tool call succeeds";
  PostToolUseFailure "After a tool call fails"; PreToolUse deny "Blocks the tool
  call" — all confirmed (V19/V2). The round-6 fixes introduce no new external
  premise (verified against the diff: internal design only), consistent with what
  round 6 found.
- **check_docs.py citation surface:** every `AD-`/`FR-`/`AC-`/`D-`/`OL-` key the
  round-6 diff introduced or moved resolves under the mechanical checker (exit 0);
  the load-bearing ones hand-checked above (OL-C3, OL-C5, OL-C1, OL-6, OL-11,
  OL-R4, FR-B5, FR-L4, D-27, D-39, D-41) say what the sentence uses them for.

## Convergence Record

- **Round number:** 7 (sixth Post-fix round).
- **Trajectory (expert-review severity, this axis; each round's own mechanical
  breakdown):** R1: 4S/4M/5m → R2: 4S/3M/4m → R3: 0S/2M/6m → R4: 1S/1M/5m →
  R5: 1S/2M/5m → R6: 1S/1M/3m → **R7: 1S/1M/1m**. (Collapse-hunt collapse-class,
  for context: 5 → 6 → 1 → 1 → 0 → 0 → [round-7 collapse-hunt running in
  parallel, not seen by this pass].)
- **Flow counts for this round (provenance per Step 9):** prior findings closed =
  **9 of 9** round-6 findings (R6-S1, R6-M1, R6-m1, R6-m2, R6-m3, P1, P2, P3, P4
  all resolved in substance at their named sites). New findings = 3. Of the three:
  **R7-S1 = regression** (introduced by round-5's object-head restructure, a
  sibling of R6-S1 that round 6's fix did not sweep — newly surfaced here);
  **R7-M1 = new** (the round-6 P1 fix's "shrunk by tending the stoplist"
  mitigation, leaning on the round-6-narrowed `tune` surface — the R6-M1 pattern
  recurring); **R7-m1 = new** (the round-6 P2 fix's path-write predicate).
- **Tripwire evaluation (arithmetic shown):**
  - Condition (a) — *new + regression ≥ closed for two consecutive Post-fix
    rounds*: this round new+regression = 3 (R7-S1 counted as regression, R7-M1 +
    R7-m1 new); closed = 9. 3 < 9 → **not met this round.** Round 6: new+regression
    ≈ 3 (R6-S1 + residuals); closed = 13. Also not met. **Two-consecutive
    condition (a): NOT FIRED.**
  - Condition (b) — *total findings not strictly decreasing for two consecutive
    Post-fix rounds*: R5 total = 8 (1S/2M/5m), R6 total = 5 (1S/1M/3m — strict
    decrease), R7 total = 3 (1S/1M/1m — strict decrease). Two consecutive strict
    decreases. **Condition (b): NOT FIRED.**
  - **Tripwire: NOT FIRED.** The cycle is converging in both count (8 → 5 → 3) and
    blast radius (this round's findings are confined to one clause's missing case,
    one CLI verb's surface omission, and one diagnostic predicate's precision — no
    finding reaches the deny confinement, the owner constraints, or the phase
    boundary).

## Recommended Priority

The tripwire has not fired, so a further fix round — **not** Gate-8 foundational
rework — is the indicated path. Fix in this order, by impact on the owner
objectives:

1. **R7-S1 first** — it disarms `OL-C3`'s recourse for a common phrasing class and
   leaves the soundness-critical classifier partial against its own "classifies
   every opened row" invariant (an inline decision the Gate-A review attests does
   not exist). The fix is a single default case in clause (iv) (communicative verb
   with no object → `info`) plus one AC-24 corpus pair.
2. **R7-M1** — the owner-facing shrink path for wrongful-deny member shape (2) is
   inert until `tune` covers the stoplist; the fix is one AD-20 line (add the
   stoplist key) plus correcting AD-15's "every lexicon" universal and aligning
   AD-9's residual sentence to L1's.
3. **R7-m1** — correlate the path-write predicate with the denied target (or
   disclose its over-count direction like the done-claim counter), plus one AC-24
   fixture case.

Because R7-S1 and R7-M1 both entered as the round-6 repair's own text outrunning
its mechanism/capability — the object-head fix not sweeping the object-less
sibling, and the "shrunk by tending" mitigation naming an absent `tune` key — the
applier should, per the collapse-log's 2026-09-03 Lesson 1, re-read every sibling
of each touched primitive (every classification branch of clause iv; every list
the document calls "tended") and confirm the fix reaches all of them, not only the
one the finding pointed at.

---

*Round-7 expert review, 2026-09-03. **Not the terminal round.** R7-S1 is a real
Serious — the round-6 R6-S1 object-head fix restored the object-bearing escalation
re-ask but left clause (iv) with no rule for a request-frame communicative verb
with no object ("can you explain?", "can you answer?"), violating its own
"classifies every opened row" invariant and disarming the `OL-C3` recourse for a
common phrasing class — so the convergence bar ("a round that finds nothing real")
is unmet. The findings are all single-mechanism fixes and the blast radius has
narrowed further (one clause's missing case, one CLI surface omission, one
diagnostic predicate); the deny confinement, the owner's locked constraints, and
the phase boundary all held, and all nine round-6 findings closed at their named
sites. The trajectory (8 → 5 → 3 findings) and the second consecutive tripwire
non-fire indicate genuine convergence; a clean round 8 is plausible if round 7's
three fixes are applied with the sibling-sweep discipline. **Inheritance for round
8:** (1) The clause-(iv) classifier is a **total** function claim ("classifies,
positively, every opened row") — enumerate every reachable input shape
(no-object; pronoun-only object after the me/us skip, e.g. "can you answer this?";
attributive-compound heads "test results"; multi-object/compound asks "answer my
question and fix the bug") and confirm each has a defined, correct classification,
because the round-6 fix proved the object-head enumeration is not exhaustive over
the input domain. (2) When a fix names a mitigation ("shrunk by tending X"),
verify the named surface (`tune`) can actually perform it — a mitigation naming an
absent capability is the R6-M1 "renaming a hedge" pattern, now recurring for a
second list. (3) Re-audit every owner-facing proxy/diagnostic (`deny_bypass_suspect`
this round) against the document's own "state both error directions, never present
a proxy as a measurement" discipline — the done-claim counter meets it; verify the
rest do.*

Verdict: NEEDS FIXES (3 findings: 1 Serious, 1 Moderate, 1 Minor)
