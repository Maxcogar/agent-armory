# Round-8 expert review — Phase A architecture (round-7 fix verification + new-defect hunt)

**Artifact:** `docs/architecture-phase-a.md` at current HEAD, commit `cc61b25`
("arch: apply all round-7 review findings (context-oracle Phase A)"), diffed
against the round-7-reviewed draft (`92ab11f`) with
`git show cc61b25 -- middleware/context-oracle/docs/architecture-phase-a.md`.
**Reviewer:** independent session, not the author of the document or of any prior
review. Read in full before the attack: `middleware/context-oracle/CLAUDE.md`,
`OWNER-LEDGER.md`, `docs/specs/spec-context-oracle.md` (all 1130 lines),
`docs/collapse-log.md` (the two 2026-09-03 entries first — round 6's and round
7's lessons — then 2026-08-29, then the rest, per the charter), both round-7
review files, the architecture end to end (all 2426 lines), and the full round-7
apply diff.
**Axis (round-8 charter):** premises and engineering standards — correctness,
completeness, verification-actually-performed, standards-conformance, citation
integrity, internal consistency. The round-7 fixes (commit `cc61b25`) are the
primary attack surface, attacked **as author text** (collapse-log 2026-08-29
Lesson 1: a reviewer's repair prescription carries no verification of its own).
Every check below was run in this session; nothing is carried forward from the
author's attestations or prior rounds' claims without re-derivation. Findings
were not manufactured to avoid an empty report; the convergence bar was applied
as stated — an empty findings list with enumerated clean checks would have been
a legitimate PASS, and this round is not it.

## Scope and Inventory

**Round number:** 8 (Post-fix review; the seventh Post-fix round of this series).

**Tool plan (instruments and claim-type mapping).**
- Literal-content / internal-consistency claims (the bulk of this review): `Read`
  at the specific file:line, this session — every finding's location was re-read
  at drafting time.
- Absence / "no rule covers this input" and "member not enumerated" claims:
  `Grep` across the full document for the mechanism's signature, then `Read` of
  each region (search locates, reading verifies — collapse-log 2026-07-30
  Observation 14). The load-bearing absence claims (no coordinated-ask member in
  the residual; no persisted deny-target column) were each established by `Grep`
  returning zero hits **and** by `Read` of the relevant schema/enumeration.
- The one external premise a round-7 fix leans on (V19 — the hooks contract
  behind the `deny_bypass_suspect` path-write predicate): `WebFetch` against
  `code.claude.com/docs/en/hooks` this session (Context7 loaded as backup). No
  instrument class was unavailable; no load-bearing claim is stranded, so no
  halt condition arose.
- The mechanical floor: `python3 middleware/context-oracle/tools/check_docs.py`,
  run this session.

**Post-fix inventory (four sources per the skill's Step 2).**

*(1) The prior review's full inventory + (2) the fix-diff files + (3) dependents,
verified this session:*
- [x] `docs/architecture-phase-a.md` — **Read in full** (lines 1–2426, across
  paged reads; every cited region re-read at drafting time).
- [x] `docs/specs/spec-context-oracle.md` — **Read in full** (1–694, 695–1130;
  OL-C3/OL-C5, FR-B1/B2/B5, FR-L4, D-27/D-39/D-41, FR-A2g/A2m, §8, §11.5, §14
  citations hand-checked at their rows).
- [x] `OWNER-LEDGER.md` — **Read in full** (OL-C1, OL-C3, OL-C5, OL-6, OL-11,
  OL-R4, OL-R5 re-read at use).
- [x] `middleware/context-oracle/CLAUDE.md` — **Read in full** (dominating rules;
  the verify-before-assert standing rule; the apply-*all*-findings rule).
- [x] `docs/collapse-log.md` — **Read in full** (the two 2026-09-03 entries first
  — round 6's and round 7's lessons; then 2026-08-29; then the rest).
- [x] `docs/reviews/2026-09-03-round-7-expert-review-architecture-phase-a.md` —
  **Read in full** (closure items R7-S1, R7-M1, R7-m1).
- [x] `docs/reviews/2026-09-03-round-7-collapse-hunt-architecture-phase-a.md` —
  **Read in full** (closure items P1, N1–N7; the P1 concrete-repair
  prescription's four items hand-checked against the applied text).
- [x] `middleware/context-oracle/tools/check_docs.py` — **Grep-verified** by
  execution (exit 0, output pasted below).
- [x] `code.claude.com/docs/en/hooks` (external premise V19) — **Grep-verified**
  via WebFetch this session (PostToolUse "After a tool call succeeds" + carries
  `tool_name`/`tool_input`; PostToolUseFailure "After a tool call fails";
  PreToolUse deny "Blocks the tool call" → neither post-event fires — confirmed).

*(4) Prior findings as closure items:* the round-7 resolution table below
re-derives each of the 9 round-7 findings (R7-S1, R7-M1, R7-m1, CH-P1, N1, N2,
N4, N6, N7) from current source this session.

No new in-scope file surfaced mid-pass. AD-24's named build-time verifications
(marker presence on the owner's real transcript; whether platform-injected turns
fire `UserPromptSubmit`) remain out of this container's reach and are correctly
disclosed as build-time (L11) — not scored as review gaps. No rigor was waived.

## VERDICT: NEEDS FIXES — 0 Critical / 1 Serious / 1 Moderate / 1 Minor

The nine round-7 findings are resolved in substance at the locations they named —
most cleanly, the false soundness universal "mutating the repository does not
produce an answer to it" is now **gone from the architecture document entirely**
(`Grep` → 0 hits in the arch doc; present only in the collapse-log and review
files), replaced by an honest over-enforcement disclosure at all three sites
(AD-9 rationale, L1 residual, AC-24 corpus). But three defects survive the
round-7 repairs, and each is one of the round-6/round-7 collapse-log lessons
recurring:

- **R8-S1 (Serious)** is the charter's "totality over the domain, not the
  enumerated cases" directive answered NO for two reachable input shapes the
  charter named. The round-7 fix closed the no-object gap (correctly), but
  clause (iv)'s object/verb extraction is specified by linguistic categories
  ("the head noun", "the verb") that are **undefined for attributive compounds
  and coordinated multi-verb asks**, and the document's own labeled corpus row
  "could you confirm the version number? → `info`" **contradicts** its own stated
  "head noun" rule (the head of "version number" is "number", which is *not* on
  the information-object lexicon; only the modifier "version" is). So the
  soundness-critical classifier carries an inline architectural decision the
  Gate-A attestation (line 1890) says it has none of, and the round-7
  "total over its input domain" claim holds only for single-verb/single-head-noun
  inputs.

- **R8-M1 (Moderate)** is the P1-lineage "exactly N member shapes" false universal
  recurring a **seventh** time, together with a **dropped prescribed repair**. The
  round-7 collapse-hunt's own P1 concrete-repair item 2 explicitly prescribed
  adding the **coordinated** ask ("show me the error **and** fix the bug?") as a
  residual member; the round-7 apply added the ticket/null-check examples but the
  word "coordinated" appears **nowhere** in the document (`Grep` → 0 hits), and
  shape (3) is worded "whose object classifies `info` but whose answer is a build"
  — which does not cover the coordinated ask (its info-object's answer is text; the
  build is a separate co-ask) nor the no-object `show`/`list` build-ask the round-7
  widening newly made deny-capable. "Three member shapes" is again incomplete.

- **R8-m1 (Minor)** is the round-7 `deny_bypass_suspect` **correlation** naming a
  correlation key the schema does not persist: the fix reads "the denied
  `Edit`/`Write`'s `file_path`" at a later Bash event, but `whisper_audit` has no
  target-path column, the deny's stored `text` is the *question* (not the denied
  path), and a denied Edit produces **no** `observed_actions`/PostToolUse row
  (V19, re-confirmed this session) — so the correlation key has no named
  receptacle, contrary to the document's own receptacle-naming discipline
  (cf. `session_log.detail_json`, added precisely because a round-4 review found a
  receptacle missing).

Nothing reaches the deny producer's structural confinement (AD-10), the owner's
locked constraints (`FR-B3`/`OL-R4`/`OL-7`/`OL-C1`), or the phase boundary — all
re-walked clean. By the mechanical rule a single Serious blocks PASS; round 8 is
not the terminal round.

---

## Summary

This review returns **NEEDS FIXES**. The round-7 fixes are, in the main, correct
and landed at their canonical sites: the object-less communicative verb ("can you
explain?") now classifies `info` at all three sites (AD-9 777–780, AC-24 1756,
L1 2106); the false soundness universal is gone from the document and replaced by
an honest, L3-mirroring over-enforcement disclosure consistent across AD-9/L1/
AC-24; `tune` now covers `lexicon.stoplist` (coherent with the `tuning`
`lexicon.*` schema) and AD-15's "every lexicon" universal is removed;
`deny_bypass_suspect` states both error directions; and all five applied notes
(N1/N2/N4/N6/N7) landed. But clause (iv)'s object/verb extraction is undefined for
the attributive-compound and coordinated inputs the charter directed me to check,
and its own corpus row "confirm the version number → info" contradicts its stated
"head noun" rule (R8-S1); the "three member shapes" residual is again incomplete
and the round-7 collapse-hunt's explicitly-prescribed coordinated member was
dropped (R8-M1); and the round-7 `deny_bypass_suspect` correlation names a
denied-target key with no persisted receptacle (R8-m1). By the mechanical rule a
single Serious blocks PASS; round 8 is not the terminal round.

## Upstream Contract Verification (Step 7)

Each governing spec/ledger item the round-7 fixes touch, checked honored/violated
against the verified current text this session:

- **AD-9's own invariant "clause (iv) classifies, positively, every opened row"
  (line 761), and the round-7 "total over its input domain" claim (commit
  message; Status §"Review round 7", line 2409)** — **VIOLATED as a
  correctness/determinacy claim** (R8-S1): every *reachable* row does receive
  *some* classification, but for attributive compounds the classification is
  **undefined** (no head-extraction rule for a multi-noun object) and for one
  corpus example it is **self-contradictory** (rule → `request`, corpus → `info`);
  for coordinated multi-verb asks the governing verb is undefined. Verified:
  AD-9 lines 770–772 (object = "the head noun"), 1755 (corpus "version number
  → `info`"), 781 (info-lexicon = "…value / version / status-class"), 2355 (the
  design explicitly rejects "a bag-of-words scan" in favor of head-noun);
  `Grep "coordinated|and fix"` → 0 substantive hits.
- **`OL-C3` (answer-drift block — "block that motherfucker until it … actually
  answers")** — **honored at the definitional level** (the trigger is OL-C5's
  wording, `D-39` unchanged) and the object-less recourse gap R7-S1 named is
  closed; R8-S1/R8-M1 are classifier-determinacy / residual-completeness defects,
  not a redefinition.
- **`OL-C5` (protected answer-directed class) / `FR-B5` (per-error-direction
  leans)** — **honored in letter; the "three member shapes" completeness claim is
  false** (R8-M1): the coordinated info+action ask and the no-object `show`/`list`
  build-ask are deny-capable `info`-classified asks whose fulfilment/co-ask is an
  action that the categorical `Edit`-deny wrongfully denies — a real
  over-enforcement path the enumeration excludes.
- **`OL-C1` (no arbitrary volume/count/budget cap)** — **honored**: the round-7
  additions (no-object info member, `lexicon.stoplist` row, the correlation
  clause, the `BEGIN IMMEDIATE` fold) are classification, config, and
  bookkeeping; the owner-fidelity re-scan of the round-7 diff found no
  volume/count/budget term introduced.
- **`FR-B3` / `OL-R4` / `AC-2` (no pre-emptive gate, no generated-file block, no
  mutation, one deny producer)** — **honored**: the round-7 diff touches
  classification (AD-9 clause iv), a schema comment (AD-4), the deny rationale
  (AD-9), a diagnostic predicate (AD-9/AD-4), the `tune` verb (AD-20), the CLI
  correction path (AD-18), disclosures (L1/L6/AD-15), the concurrency clause
  (AD-26), and fixtures (AD-24) only; AD-10's single-producer confinement, the
  `kind='info'`+mutating-file deny-eligibility predicate, reactive-only,
  text-never-denied, and self-clearing are textually untouched and re-read
  consistent. R8-S1 and R8-M1 are determinacy/completeness defects on the
  *classification* and *disclosure* sides, never a new deny *producer*.
- **`OL-R5` (define the answer-drift trigger positively, never by exclusion)** —
  **honored**: clause (iv) remains a positive classification; R8-S1 is a *missing/
  ambiguous positive rule* for compounds/coordination, not a negative-space
  definition.
- **`FR-L4` (regret proxy) / `FR-L7` (fact routing) / `OL-6` (two stores)** —
  **honored**; unchanged by the round-7 diff, re-read consistent.

---

## Serious

### R8-S1 — Clause (iv)'s object/verb extraction is specified by linguistic categories ("the head noun", "the verb") that are undefined for attributive-compound objects and coordinated multi-verb asks, and the document's own labeled corpus row "confirm the version number → `info`" contradicts its stated "head noun" rule — so the round-7 "total over its input domain" claim holds only for single-verb/single-head-noun inputs, and the soundness-critical classifier carries an inline architectural decision the Gate-A attestation says it has none of

**Location.** AD-9 clause (iv)'s object rule (lines 770–772: "The object is the
**head noun** of the noun phrase immediately following the verb (skipping an
optional 'me/us')") × the information-object lexicon (lines 781–783: "error /
output / log / diff / result / value / **version** / status-class — plus question
/ answer") × the labeled corpus row (AC-24 line 1755: "could you confirm the
**version number**?" → `info` (information-lexicon object)) × the explicit
rejection of bag-of-words matching (line 2355: "direct-object head noun,
wh-complement precedence — a bag-of-words scan would have disarmed…") × AD-9's
totality invariant (line 761) and "this classification is where the block's
soundness lives" (lines 762–765) × the Gate-A attestation "No inline
architectural calls found remaining" (line 1890) × AD-24's "info/request
classifier against a **labeled corpus**" (line 1682).

**What is wrong.** Round-7 R7-S1 closed the *no-object* fall-through and asserts
clause (iv) is now "total over its input domain" (commit message; Status
line 2409: "making clause (iv) total over its input domain"). Totality in the
weak sense (every opened row gets *some* label) is closer to true. But the
charter's directive is totality **and correctness** over the domain, and two
input shapes it named return an **undefined** or **self-contradictory** label in
the soundness-critical classifier:

1. **Attributive-compound object heads — undefined, and one corpus row
   contradicts the rule.** The object rule is "the **head noun** of the noun
   phrase immediately following the verb" (line 770). For a single-noun object
   ("the error") the head is unambiguous. For an attributive compound ("the
   version number", "the test results", "the error log directory") the *head* is
   the **rightmost** noun ("number", "results", "directory") and the earlier noun
   is a modifier — but the document gives **no head-extraction algorithm** for a
   multi-noun phrase, and a model-free classifier needs one. Worse, the
   document's own corpus row is inconsistent with the rule it states: "could you
   confirm the **version number**?" is pinned `info` "(information-lexicon
   object)" (line 1755), which requires matching **"version"** — but "version" is
   the *modifier*; the *head* of "version number" is **"number"**, which is **not**
   on the information-object lexicon (line 781). Under the stated head-noun rule,
   "the version number" → head "number" → unlisted → **`request`**, contradicting
   the corpus's `info`. The document explicitly rejects the "bag-of-words scan"
   (line 2355) that would make the corpus row consistent — so the normative rule
   ("head noun") and the labeled test corpus (which needs modifier-matching)
   **cannot both be satisfied**. An implementer building the classifier "against
   the labeled corpus" (line 1682) will implement non-head matching, contradicting
   the deliberate head-noun choice and classifying other compounds ("the error
   summary", "the test log") unpredictably — including toward `info` →
   deny-capable → possible wrongful deny.

2. **Coordinated multi-verb asks — the governing verb is undefined.** Clause (iv)
   "classifies by its verb … by the verb's direct object" (lines 769–770) —
   singular "verb". A coordinated ask ("can you **answer** my question **and fix**
   the bug?", "please **explain** the error **and update** the README?") has two
   verbs, one communicative and one not, and the document gives **no rule** for
   which governs. First-verb → `info` (deny-capable → the co-asked fulfilling
   `Edit` is denied); last-verb → `request` (the info half is missed). Either
   choice is an inline architectural decision, and the two choices land on
   *opposite* error directions of the block.

Both are exactly the "attributive-compound heads" and "multi-object / coordinated
asks" cases the round-8 charter enumerated as required totality checks. Both leave
the classification either undefined or self-contradictory in the classifier AD-9
says "is where the block's soundness lives" (line 762) — the same class as R7-S1
(an inline decision in the soundness-critical classifier), which the Gate-A
review still attests it has none of (line 1890).

**How verified.** Read of AD-9 lines 761–808 this session (the full clause-(iv)
branch structure and the object definition); Read of line 781 (info-object
lexicon — "version" present, "number" absent), line 1755 (corpus "version number
→ `info` (information-lexicon object)"), line 2355 (the design's explicit
head-noun / anti-bag-of-words commitment); `Grep "version number|head noun|first
noun"` → the object rule at 770, "unlisted head noun" at 795, "direct-object head
noun" at 2355, and the corpus row at 1755 — no head-extraction algorithm for
compounds anywhere; `Grep "coordinated|and fix"` → 0 substantive hits (no rule
for coordinated verbs). The head of "version number" being "number" (not
"version") is standard English NP structure (attributive modifier + head).

**Failing scenario.** *(compound)* An implementer builds the classifier to pass
the labeled corpus, so it matches any listed noun in the object NP. Max types
"can you show me the **error summary**?" intending a *built* summary document.
Object NP "the error summary"; "error" ∈ info-lexicon → `info` → deny-capable →
the summary-building `Edit` is **wrongfully denied**. Alternatively the
implementer honors the stated head-noun rule; then "could you confirm the
**version number**?" → head "number" → unlisted → **`request`** → the
information question is tracked-not-denied, silently disagreeing with the corpus
the fixture pins. The two conformant readings diverge on deny-capability.
*(coordinated)* Max types "can you **answer** my question **and fix** the bug?";
first-verb reading opens `info` → the agent's fix-`Edit` (doing exactly what Max
asked) is denied until a narrating turn clears it — a wrongful deny with no
defined rule electing it.

**Why Serious (boundary noted).** It is a genuine internal inconsistency between
the normative classification rule and the document's own labeled test corpus (the
classifier's oracle, AD-24), plus an undefined head/verb-extraction rule for a
class of reachable inputs, in the classifier AD-9 calls soundness-critical — an
inline architectural decision the Gate-A attestation denies exists, and a direct
falsification of the round-7 "total over its input domain" claim that is the
primary round-8 attack surface. It is bounded below Critical: on the specific
corpus row the safe reading is under-enforcement (a tracked-not-denied info
question, Max-visible), the block's structural confinement is untouched, and
re-asking the original question verbatim still re-arms — which is why it is
Serious, not Critical.

**Fix (single mechanism).** State the head-extraction and verb-selection rules
explicitly in clause (iv), and reconcile the corpus:
(a) Define object-head extraction for multi-noun phrases — e.g., "the head is the
**rightmost** noun token of the object NP (attributive modifiers ignored); if the
head is unlisted but an earlier noun is on the information-object lexicon, the
object is `info` (the safe direction for OL-C3), and if an earlier noun is on the
artifact-object lexicon it stays `request` (inert in Phase A)" — then correct or
re-pin the "confirm the version number" corpus row to whichever rule you adopt
(under a rightmost-head rule "number" is unlisted; under the earlier-noun-info
carve-out "version" wins → `info`, consistent with the corpus). (b) Define
coordinated-verb handling — e.g., "a sentence with more than one top-level verb
classifies `info` if **any** governing verb is communicative-with-an-`info`/wh
object, else `request`" (or the reverse, if the owner prefers the co-asked action
not be denied) — and add both a compound corpus pair ("confirm the version
number?" and one with an unlisted head, e.g. "explain the error summary?") and a
coordinated corpus row ("answer my question and fix the bug?") to AC-24 so both
shapes are pinned. Then the Gate-A "no inline architectural calls" attestation
becomes true for these inputs.

---

## Systemic Patterns

No systemic pattern — verified by the proactive scans this session. The three
findings are distinct defect classes with no shared grep-able signature across
enumerated instances:
- `Grep "head noun|version number|first noun"` → the compound/corpus contradiction
  is a single-locus defect (the object rule at 770 vs the one corpus compound at
  1755), not a repeated pattern (R8-S1).
- `Grep "coordinated|and fix|three member"` → the residual-completeness gap is at
  the three residual sites (AD-9 898, L1 2125, AC-24 1758) which are one
  enumeration mirrored, not independent recurrences (R8-M1).
- `Grep "deny_bypass_suspect|file_path|whisper_audit"` → the correlation-key gap
  is a single predicate (AD-9 999–1002 mirrored to AD-4 528–531), not a repeated
  mis-persistence across other diagnostics (R8-m1); the other proxies
  (regret, done-claim counter, deny-loop) persist their keys via named columns.

The meta-thread — round-N fixes landing at their named site but the round's own
*totality/completeness claim* outrunning the mechanism (compound/coordinated
inputs; the "N member shapes" enumeration) — is described in the closing
paragraph as inheritance for round 9, not filed as a Systemic finding (matching
rounds 6 and 7's handling of the analogous thread).

## Moderate & Minor Findings

### R8-M1 (Moderate) — The "three member shapes" wrongful-deny residual is again incomplete (P1-lineage, a seventh recurrence), and the round-7 collapse-hunt's explicitly-prescribed **coordinated** member was dropped in the apply: the coordinated info+action ask and the no-object `show`/`list` build-ask are deny-capable `info`-classified asks whose fulfilment/co-ask is an action, neither matching shape (3)'s "whose object classifies `info` but whose answer is a build" wording

**Location.** AD-9's residual (round-7-added; lines 898–912: "The residual
wrongful-deny class therefore has **three member shapes** … (3) an **in-frame
`info` question whose fulfilment is an action** — a communicative-verb ask whose
object classifies `info` but whose answer is a build") × L1's mirror (lines
2125–2138) × AC-24's corpus (lines 1758–1762) × the round-7 no-object widening
(AD-9 777–780) × the round-7 collapse-hunt's P1 concrete-repair **item 2**
(`docs/reviews/2026-09-03-round-7-collapse-hunt-…md` lines 181–189: "add (3) …
the `answer`/`show`-the-`question`/`answer` ask that resolves to a build …, the
wh-complement ask whose answer is an edit …, **and the coordinated ask whose
first object is `info` but co-asks an action ('show me the error and fix the
bug')**").

**What is wrong.** Two deny-capable, `info`-classified asks whose fulfilment or
co-ask is a repo mutation are **not** members of the round-7 "three member
shapes", so the completeness claim is false — the P1-lineage "exactly N member
shapes" false universal recurring (round-1-S2 → 3-C1 → 4-P1 → 5-P1 → 6-P1 →
7-P1 → **this**):

1. **The coordinated ask — a *dropped prescribed repair*.** Shape (3) is worded
   "a communicative-verb ask whose object classifies `info` but whose **answer is
   a build**" (line 907–909). "can you answer my question **and fix the bug**?"
   has an info-object ("question") whose *answer is text*; the **build is a
   separate co-ask**, and *that* `Edit` is what the deny (opened by the info row)
   wrongfully blocks. That is not shape (3) as worded. The round-7 collapse-hunt
   **explicitly prescribed** adding this member (its P1 item 2, quoted above);
   the round-7 apply added the ticket and null-check examples but the word
   "coordinated" appears **nowhere** in the document (`Grep "coordinated" → 0
   hits`). A prescribed finding was dropped — a violation of `CLAUDE.md`'s
   apply-*all*-findings rule.
2. **The no-object `show`/`list` build-ask — the round-7 widening's own
   unaudited edge.** The round-7 no-object fix made **every** bare
   communicative-lexicon verb deny-capable (AD-9 777–780). The lexicon includes
   `show` and `list` (line 776), whose fulfilment can be a *build* ("can you show
   me?" meaning show a demo; "can you list?" meaning write the options to a file)
   — so bare `show`/`list` → `info` → deny-capable → the build-`Edit` is wrongfully
   denied. Shape (3) requires an object ("whose **object** classifies `info`"), so
   the no-object case is outside it. This is exactly the charter's set-widening
   directive ("audit the new deny-capable members … for fulfilling-move wrongful
   denies, not only the gap the change was made to close"): the round-7 widening
   was audited for the recourse it restored, not for this fulfilling-move edge.

**How verified.** Read of AD-9 lines 898–912 and L1 lines 2125–2138 this session
(shape (3)'s "whose object classifies `info` but whose answer is a build" wording);
Read of AC-24 lines 1758–1762 (the ticket example, no coordinated row); Read of
AD-9 lines 776–780 (the communicative lexicon includes `show`/`list`; the
no-object branch makes them deny-capable); `Grep "coordinated|and fix the
bug|co-ask"` across the document → **0** hits; re-derivation of the round-7
collapse-hunt P1 item 2 from its file (lines 181–189) confirming the coordinated
member was prescribed and not applied.

**Failing scenario.** Max types "can you show me the error **and fix the**
`parser.js` **bug**?". First object "error" → `info` → deny-capable. The agent's
`parser.js` `Edit` (the co-asked fix) is **denied** ("answer Max's question
first"). Which of L1's three member shapes is that? None: it is in the request
frame (not shape 1), not rhetorical (not shape 2), and its info-object's answer is
text with the build a separate co-ask (not shape 3-as-worded). The enumeration the
document offers as the block's one-halting-mechanism completeness claim is
incomplete on first audit.

**Why Moderate (boundary noted).** The residual is an owner-facing *disclosure*
that gates nothing, each wrongful deny is escapable by one substantive text turn
and lands on the wrongful-deny rate (Max-visible), and the harm direction is
bounded over-enforcement — which keeps it below Serious. But it falsifies a
completeness claim about the block's one halting mechanism (the recurring P1
shape) and it dropped an explicitly-prescribed repair, so it is not Minor.

**Fix (single mechanism).** Re-open the residual to own the members it actually
has, at all three sites (AD-9 898, L1 2125, AC-24) — per the round-6 lesson that a
fix lands at every site the finding names: add member (3′) "a **coordinated**
in-frame ask that pairs an `info` question with an action co-ask ('answer my
question **and** fix the bug'; 'show me the error **and** fix the bug'), where the
deny falls on the co-asked mutation", and either fold the no-object `show`/`list`
build-ask into shape (3) by rewording it to "a communicative-verb ask **classified
`info` (by object or by the no-object branch)** whose fulfilment is an action", or
name it as member (4). Add the coordinated corpus row to AC-24 (this also serves
R8-S1's coordinated-verb pin). If the owner instead prefers to *narrow* the
no-object branch so `show`/`list` are not deny-capable bare, that is a coverage
decision to record in L1 — but it re-opens part of R7-S1, so owning the residual is
the correct path.

### R8-m1 (Minor) — The round-7 `deny_bypass_suspect` correlation reads "the denied `Edit`/`Write`'s `file_path`" at a later Bash event, but no schema column persists that key: `whisper_audit` has no target-path column, the deny's stored `text` is the *question*, and a denied Edit produces no `observed_actions`/PostToolUse row (V19) — the correlation key has no named receptacle, contrary to the document's own receptacle-naming discipline

**Location.** AD-9's `deny_bypass_suspect` definition (round-7-added; lines
999–1004: "a successful (`'ok'`) file-writing Bash row **whose written path is the
denied action's own target** — the write identified by a path-write predicate …
that resolves to a path, **matched against the denied `Edit`/`Write`'s
`file_path`**") × AD-4's mirror (lines 528–531) × the `whisper_audit` schema
(line 532–534: `id, session, consumer, kind, genre, ts, text, evidence_json,
confidence, channel, continuation` — **no target-path column**) × the deny's
stored text (lines 920–922: `permissionDecisionReason` = "answer Max's question
first: <the open question text(s)>") × V19 (a PreToolUse deny fires no
PostToolUse/PostToolUseFailure, re-confirmed this session) × the receptacle
precedent (`session_log.detail_json`, AD-4 lines 485–488: "a receptacle the
round-4 review found missing").

**What is wrong.** `deny_bypass_suspect` is computed at the Bash `PostToolUse`
event, in a fresh process (AD-1). To decide whether the Bash write's path "matches
the denied action's own target `file_path`", the handler must read the denied
Edit's `file_path` from persisted state — the two events are separate processes.
But no persisted field holds it: (a) `whisper_audit` (where the deny is recorded,
`kind='deny'`) has columns `text` and `evidence_json`, and the deny's `text` is
defined as the *question* (line 920–922), not the denied path; `evidence_json`'s
contents for a deny row are unspecified, and AD-19 states "the only verbatim text a
response ever carries is the user's own question" (line 1536–1537). (b) A denied
Edit **never executes**, so it produces no `observed_actions` row (V19: a PreToolUse
deny generates no PostToolUse/PostToolUseFailure — re-confirmed this session at
`code.claude.com/docs/en/hooks`). So the correlation key the round-7 fix reads
back has **no named receptacle**. The document elsewhere is scrupulous about
naming receptacles for exactly this kind of cross-event read (it added
`session_log.detail_json` "for this — a receptacle the round-4 review found
missing", line 486–488); by its own standard, the deny-target `file_path`
receptacle is missing.

**How verified.** Read of AD-9 lines 997–1010 and AD-4 lines 522–531 this session
(the correlation reads the denied action's `file_path`); Read of the
`whisper_audit` schema line 532–534 (no target-path column) and the deny reason
text lines 920–922 (the question, not the path); Read of AD-19 lines 1536–1537
(deny carries only the question verbatim); Read of AD-4 lines 485–488
(`detail_json` as a *named* receptacle, the document's own discipline); WebFetch of
`code.claude.com/docs/en/hooks` this session re-confirming V19 (a blocked tool
reaches neither PostToolUse nor PostToolUseFailure, so the denied Edit is not in
`observed_actions`).

**Failing scenario.** A denied `Edit` on `parser.js` is followed in the same turn
by `sed -i parser.js …`. The Bash `PostToolUse` handler wants to raise
`deny_bypass_suspect` only if the Bash path equals the denied Edit's target
(`parser.js`). It queries `whisper_audit` for the turn's deny row — and finds only
the question text; the denied `file_path` is nowhere. The implementer must invent a
receptacle (an inline decision), or fall back to the *uncorrelated* predicate the
round-7 fix explicitly removed (any post-deny file write), re-introducing the
over-flag R8-m1's predecessor R7-m1 closed.

**Why Minor.** `deny_bypass_suspect` gates nothing, is owner-facing, and is
explicitly "feeding the Phase B precision case" (line 1010) — a missing receptacle
degrades a diagnostic, not the agent's flow or a deny decision, and Phase B is
expected to refine it. But it is a concrete unbuildability in round-7 repair text,
against the document's own receptacle-naming discipline, so it is a finding rather
than an observation.

**Fix (single edit).** Name the receptacle: state that on a deny, the handler
records the denied action's target `file_path` (redacted per AD-19) in the deny
row's `evidence_json` (or a new `target_path` column), and that
`deny_bypass_suspect`'s correlation reads it from there — one clause at AD-9's
predicate definition, mirrored to AD-4. Add an AC-24 assertion that the fixture's
same-file bypass is matched via the stored target, not re-derived.

## Tentative Findings

No tentative findings — every candidate finding's premise was verified against
current source this session (Read at the cited lines, Grep for the absence/
occurrence claims, WebFetch for the one external hooks premise, and the mechanical
floor executed). Two candidates that could have been tentative were resolved to
non-findings by reading and are recorded in clean checks: the AD-9/L1 divergence on
the shape-(2) mitigation wording (AD-9 line 906 says "shrunk by tending the
stoplist"; L1 line 2133–2134 adds "(`lexicon.stoplist`, via `tune`)") is a
cosmetic parenthetical difference, not a substance divergence — both now carry the
mitigation and the capability exists (AD-20), so R7-M1's align-AD-9-to-L1
prescription is met in substance; and the `BEGIN IMMEDIATE` fold's apparent
cross-store atomicity concern (WAL disables atomic multi-database commit) is a
non-finding because the atomic operation set — read watermark → advance watermark —
is single-database (`global_meta`, AD-5), so the double-count guard holds.

## Observations

- **The pronoun-only and imperative charter cases are correctly defined and
  disclosed** (no finding). "can you answer **this**?" → object "this"
  (pronoun, unlisted) → `request`, explicitly disclosed as "does not re-arm —
  under-enforced" (L1 lines 2112–2114); "can you **respond**?" (verb not on the
  communicative lexicon) → `request`, disclosed (L1 2113); a bare imperative
  action-request outside the request frame ("mind fixing X?", "add rate limiting?")
  → `info` via clause (iv)'s non-request-frame branch, owned as residual member (1)
  (AD-9 899–901). Verified by Read of L1 2104–2115 and AD-9 899–901. Recorded so
  the charter's enumeration is auditably complete: of the six enumerated shapes,
  four (no-object, pronoun-only, imperative, possessive/gerund) are defined and
  disclosed; the two that are not (compound heads, coordinated) are R8-S1/R8-M1.
- **The finding count plateaued (R7: 3 → R8: 3).** The trajectory has been strictly
  decreasing (8 → 5 → 3) through round 7; this round it holds at 3. This is not yet
  a tripwire (condition (b) needs *two consecutive* non-decreases — see the
  Convergence Record), but it is the signal to watch: if round 9 does not strictly
  decrease below 3, condition (b) fires. Recorded as context, no standard violated.
- **The round-7 fixes introduce no new external premise.** Every round-7 change is
  internal design (classification, disclosure, a diagnostic predicate, a CLI
  surface addition, a concurrency clause, fixtures). The one external premise a
  round-7 fix *reuses* — V19, behind the `deny_bypass_suspect` path-write predicate
  — is unchanged; this session's WebFetch re-confirmed all three halves (PostToolUse
  "After a tool call succeeds" carrying `tool_input`; PostToolUseFailure "After a
  tool call fails"; a PreToolUse deny "Blocks the tool call" firing neither
  post-event). No round-7 fix depends on a premise that has changed. No standard
  violated; recorded as premise maintenance.

## What's Actually Good

- **The false soundness universal is gone from the document, not merely
  contradicted in place (CH-P1).** Judged against the collapse-log's own standard
  ("correct the universal … make the deny honestly conservative rather than resting
  on a false claim of soundness" — round-7 collapse-hunt P1 repair item 1, and the
  2026-09-03 Lesson 2 "a set-widening change's soundness rationale is attacked as
  author text"): the sentence "mutating the repository does not produce an answer to
  it" is **absent from the architecture document** (`Grep "does not produce an
  answer"` → 0 hits in `architecture-phase-a.md`; present only in the collapse-log
  and review files), replaced at AD-9 (lines 888–897) by an honest disclosure — "it
  denies **every** repo mutation while a deny-capable `info` question is open … the
  accepted cost of a model-free recognizer — the exact mirror of L3's `Bash`
  under-enforcement". Verified this session by Read of AD-9 888–912, L1 2125–2138,
  and AC-24 1758–1762 (consistent across all three sites) plus the grep. This is the
  hardest round-7 finding, landed cleanly and completely at every site it named.
- **`tune lexicon.stoplist` is coherent with the `tuning` schema (R7-M1).** Judged
  against internal consistency: AD-20 (lines 1557–1559) adds `lexicon.stoplist` with
  add/remove semantics; AD-5's `tuning` schema (line 611) already defines
  "list-valued lexicon keys (`lexicon.*`) = one member per row", which
  `lexicon.stoplist` matches; clause (iii) (line 760) uses the rhetorical/idiom
  stoplist the key now tends; and AD-15's false universal "like every lexicon in
  this document" is **removed** (Verification row line 1302, verified against the
  round-7 diff). Verified by Read of AD-20 1553–1563, AD-5 607–616, AD-15 1302, and
  clause (iii) 760.
- **`deny_bypass_suspect` now states both error directions (R7-m1's disclosure
  half).** Judged against the document's own proxy-labelling discipline ("a proxy is
  never displayed as a measurement", AD-9 989; the done-claim counter states "both
  error directions in so many words"): AD-9 (lines 1005–1009) now states the
  predicate "still **over-counts** a same-file shell rewrite made for a reason
  unrelated to the deny and **under-counts** a bypass that writes the denied content
  to a *different* path — both directions are stated wherever it is surfaced". The
  disclosure half meets the charter's proxy-discipline directive; the correlation
  *mechanism* has the receptacle gap R8-m1. Verified by Read of AD-9 997–1010.

## Round-7 finding resolution table

"Resolved" = fixed in substance at the location the finding named, swept, no
surviving contradicting copy, except where a note points at a finding above.
(ER = round-7 expert review; CH = round-7 collapse-hunt.) Each row re-derived from
current source this session, not carried from the fix attestations.

| Round-7 finding | Status in `cc61b25` | Where / notes (verified this session) |
|---|---|---|
| ER R7-S1 (object-less communicative verb classified by no rule → clause (iv) not total; `OL-C3` recourse disarmed) | **Resolved for the object-less case; totality/correctness over-claimed** | "no object at all" → `info` at AD-9 777–780, AC-24 1756, L1 2106 (three sites, consistent). The specific fix is correct. But the "total over its input domain" claim it asserts is falsified for compound and coordinated inputs → **R8-S1**, and the widening's new `show`/`list` bare members are an unaudited wrongful-deny edge → **R8-M1**. |
| CH P1 (wrongful-deny residual "exactly two member shapes" false; false soundness universal "mutating does not produce an answer") | **Resolved for the universal; residual completeness still false** | The false universal is **gone from the arch doc** (`Grep` → 0 hits) and replaced by the honest L3-mirroring disclosure at AD-9/L1/AC-24 (three sites, consistent). But "three member shapes" is again incomplete — the coordinated member CH-P1 item 2 explicitly prescribed was dropped (`Grep "coordinated" → 0`), and the no-object `show`/`list` build-ask is uncovered → **R8-M1**. |
| ER R7-M1 (`tune`'s surface omits the stoplist; AD-15 "every lexicon" a false universal) | **Resolved** | `tune lexicon.stoplist` added (AD-20 1557–1559), coherent with the `tuning` `lexicon.*` schema (AD-5 611); "like every lexicon in this document" removed (AD-15 1302); AD-9 residual aligned to L1 ("shrunk by tending the stoplist", 906). See What's Actually Good. |
| ER R7-m1 (`deny_bypass_suspect` over-flags uncorrelated/redirected writes; over-count direction undisclosed) | **Resolved in substance; correlation key unpersisted** | Correlation added ("matched against the denied action's own target `file_path`", AD-9 999–1002, AD-4 528–531); both error directions disclosed (AD-9 1005–1009); AC-24 fixture updated (1763–1769: redirected `npm test > out.log` does not fire). The correlation key (denied target `file_path`) has no named receptacle → **R8-m1**. |
| CH N1 (`--missed-question` does not name the untended word / `tune` command) | **Resolved** | AD-18 1455–1461 now: "the CLI names the unrecognized word and offers the exact `tune` command … `ctxoracle tune lexicon.communicative +<verb>`". Read this session. |
| CH N2 (CHANGE/READ dual-producer `path` reading unspecified) | **Resolved** | AD-4 503–510 now: CHANGE/READ consumers "read the Edit/Write/Read tool rows only (NOT the Bash path-write rows) … the safe under-detection direction". Read this session. |
| CH N4 (same-name "fires" rests on an unstated cap-vs-bar-floor relation) | **Resolved** | L6 2168–2171 now: "the cap held at or above the Reuse confidence floor of AD-14, so a same-name-inflated candidate still *fires* with the caveat rather than being silently dropped below the floor". Read this session; logic holds (a dominant candidate capped to ≥ floor fires). |
| CH N6 (recourse-re-arm framing over-suggests robustness) | **Resolved** | L1 2109–2115 now scopes it: re-arms for "a bare re-ask, an object-less communicative re-ask, and a 'question'/'answer'-object ask"; "can you answer **this**?"/"can you **respond**?" → `request`, "under-enforced". Consistent with the classifier. Read this session. |
| CH N7 (concurrent same-project fold double-count) | **Resolved** | AD-26 1839–1843 now: the fold "reads its project watermark, aggregates … and advances that watermark inside a **single `BEGIN IMMEDIATE` transaction**". The atomic set is single-database (`global_meta`), so the guard holds (see Tentative Findings). Read this session. |

## Checks run that came back clean

- **Mechanical floor:** `python3 middleware/context-oracle/tools/check_docs.py`
  → `context-oracle doc-consistency check passed.` (exit 0) on the current tree,
  run this session.
- **False-universal sweep (charter fix 2):** `Grep "does not produce an answer|
  produce an answer to it"` → **0 hits in `architecture-phase-a.md`** (present only
  in `collapse-log.md` and the round-7 review files). The false soundness universal
  is fully removed; the honest disclosure is at AD-9 (888–897), L1 (2125–2138), and
  AC-24 (1758–1762), consistent across all three.
- **Object-less → `info` landing (charter fix 1):** Read of AD-9 777–780, AC-24
  1756–1757, L1 2106–2107 — the no-object communicative-verb → `info` member is
  present and identically worded at all three sites; deny-capability preserved.
- **`lexicon.stoplist` coherence (charter fix 3):** Read of AD-20 1553–1563, AD-5
  607–616 (`lexicon.*` = one member per row), AD-15 1302 ("every lexicon" removed),
  clause (iii) 760 — the stoplist is a valid `lexicon.*` key, tended via `tune`,
  used by clause (iii). Coherent.
- **`deny_bypass_suspect` sweep (charter fix 4):** Read of AD-9 997–1010 and AD-4
  522–531 — the correlation clause and both-directions disclosure are present at
  both sites and consistent; AC-24 1763–1769 pins the redirected-runner
  non-fire. (The correlation-key persistence gap is R8-m1; the both-directions
  disclosure and the AD-9/AD-4 sync are clean.)
- **Applied-notes sweep (charter fix 5):** Read of AD-18 1455–1461 (N1 —
  `--missed-question` names the word + `tune` command), AD-4 503–510 (N2 —
  CHANGE/READ reads Edit/Write/Read only), L6 2168–2171 (N4 — cap ≥ floor so it
  fires), AD-26 1839–1843 (N7 — `BEGIN IMMEDIATE` fold). All present and internally
  consistent.
- **Proxy-discipline re-audit (charter directive):** Read of the four owner-facing
  proxies — `deny_bypass_suspect` (AD-9 1005–1009, both directions stated), the
  done-claim recourse counter (AD-9 971–976, "both error directions in so many
  words: under-count … and over-count"), the regret proxy (AD-18 1476–1480 / AD-17
  1410–1412, "held-but-unspoken only" + seeded-coverage pairing), and the
  reserved `model_path_down`/`missed_skill_block` labels (AD-17 1394–1397, "not yet
  measured (Phase B/C)" not 0). Each states its error direction(s) and none is
  presented as a measurement. Clean.
- **§8 deny-confinement re-walk on the round-7 text:** the round-7 diff touches
  classification (AD-9 clause iv), the residual rationale (AD-9), a schema comment
  (AD-4), a diagnostic predicate (AD-9/AD-4), the `tune` verb (AD-20), the CLI
  correction path (AD-18), disclosures (L1/L6/AD-15), the concurrency clause
  (AD-26), and fixtures (AD-24) only; AD-10's single-producer confinement, the
  `kind='info'`+mutating-file deny-eligibility predicate (861–867/876–877),
  reactive-only, text-never-denied (922–923), self-clearing/no-counter, and the
  lag clause's clear-axis-only scope (925–934) are textually untouched and re-read
  consistent. R8-S1 and R8-M1 are *classification-determinacy* and
  *disclosure-completeness* defects; neither creates a deny producer.
- **Owner-constraint scan on the round-7 additions:** `OL-C1` — the no-object info
  member, `lexicon.stoplist` row, the correlation clause, the `BEGIN IMMEDIATE`
  fold, and the fixtures are classification/config/bookkeeping; no volume/count/
  budget cap. `OL-R5` — clause (iv) remains a positive classification (R8-S1 is a
  *missing/ambiguous positive rule*, not negative-space). `FR-B3`/`OL-R4`/`OL-7` —
  no new deny producer, no generated-file consumption, no credentials, no
  pre-emptive gate. Clean.
- **External premise re-establishment (this session, WebFetch on
  `code.claude.com/docs/en/hooks`):** PostToolUse "After a tool call succeeds"
  carrying `tool_name`/`tool_input`; PostToolUseFailure "After a tool call fails";
  PreToolUse deny "Blocks the tool call" → neither post-event fires (V19) — all
  confirmed. The round-7 fixes introduce no new external premise (verified against
  the diff: internal design only).
- **check_docs.py citation surface:** every `AD-`/`FR-`/`AC-`/`D-`/`OL-` key the
  round-7 diff introduced or moved resolves under the mechanical checker (exit 0);
  the load-bearing ones hand-checked above (OL-C3, OL-C5, OL-C1, OL-R4, OL-R5,
  FR-B3, FR-B5, FR-L4, D-27, D-39, D-41, V19) say what the sentence uses them for.

## Convergence Record

- **Round number:** 8 (seventh Post-fix round).
- **Trajectory (expert-review severity, this axis; each round's own mechanical
  breakdown):** R1: 4S/4M/5m → R2: 4S/3M/4m → R3: 0S/2M/6m → R4: 1S/1M/5m →
  R5: 1S/2M/5m → R6: 1S/1M/3m → R7: 1S/1M/1m → **R8: 1S/1M/1m**. (Collapse-hunt
  collapse-class, for context: 5 → 6 → 1 → 1 → 0 → 0 → 0 → [round-8 collapse-hunt
  running in parallel, not seen by this pass].) Total findings: R5=8, R6=5, R7=3,
  **R8=3** — strictly decreasing through R7, then **plateaued** at 3.
- **Flow counts for this round (provenance per Step 9):** prior findings closed =
  **9 of 9** round-7 findings (R7-S1, R7-M1, R7-m1, CH-P1, N1, N2, N4, N6, N7 all
  resolved in substance at their named sites). New findings = 3. Of the three:
  **R8-S1 = new** (the compound/coordinated determinacy gap and the version-number
  corpus contradiction were surfaced this round by the charter's compound-head
  directive and by the round-7 "total over its input domain" over-claim; the
  version-number row is pre-existing but its contradiction with the head-noun rule
  was not previously reported); **R8-M1 = regression** (the round-7 apply dropped
  the collapse-hunt's explicitly-prescribed coordinated member and the round-7
  "three member shapes" text over-claims completeness against the no-object
  widening the same round introduced); **R8-m1 = regression** (the round-7 R7-m1
  correlation fix introduced a read of an unpersisted key).
- **Tripwire evaluation (arithmetic shown):**
  - Condition (a) — *new + regression ≥ closed for two consecutive Post-fix
    rounds*: this round new+regression = 3 (R8-S1 new; R8-M1 + R8-m1 regression);
    closed = 9. 3 < 9 → **not met this round.** Round 7: new+regression = 3;
    closed = 9. Also not met. **Condition (a): NOT FIRED.**
  - Condition (b) — *total findings not strictly decreasing for two consecutive
    Post-fix rounds*: R6 total = 5, R7 total = 3 (strict decrease), R8 total = 3
    (**not** a strict decrease). This is the **first** non-decrease; two consecutive
    are required. **Condition (b): NOT FIRED — but armed.** If R9's total is not < 3,
    condition (b) fires.
  - **Tripwire: NOT FIRED.** The cycle is still converging in blast radius (this
    round's findings are confined to one classifier's under-specified rules, one
    residual enumeration's completeness, and one diagnostic's correlation key — none
    reaches the deny confinement, the owner constraints, or the phase boundary), but
    the finding *count* has stopped falling, which the closing paragraph carries
    forward as the round-9 watch-item.

## Recommended Priority

The tripwire has not fired, so a further fix round — **not** Gate-8 foundational
rework — is the indicated path. But the count plateau (3 → 3) is the signal that
the classifier's specification is the un-converged core: three consecutive rounds
(R6-S1, R7-S1, R8-S1) have found the answer-drift *classifier* incomplete or
under-specified in a new way each time. The round-9 applier should treat clause
(iv) as a **specification to be completed once, exhaustively**, not patched
per-input: write down the object-head-extraction algorithm, the verb-selection
rule for coordinated asks, and the classification of every construction the corpus
will contain, then re-derive the labeled corpus from that specification (so a
corpus row can never again contradict the rule, as "version number" does now).

Fix in this order, by impact on the owner objectives:

1. **R8-S1 first** — it is the soundness-critical classifier returning an undefined
   or self-contradictory label for reachable inputs and directly falsifying the
   round-7 totality claim. The fix is the head-extraction + verb-selection rules in
   clause (iv), plus reconciling the "version number" corpus row and adding a
   compound and a coordinated corpus pair to AC-24.
2. **R8-M1** — re-open the "three member shapes" residual to own the coordinated
   and no-object-`show`/`list` members at all three sites (AD-9, L1, AC-24),
   applying the round-7 collapse-hunt's dropped item-2 prescription. This shares the
   coordinated corpus row with R8-S1's fix.
3. **R8-m1** — name the receptacle for the denied target `file_path` (deny row's
   `evidence_json` or a new column) so the correlation is buildable, plus one AC-24
   assertion.

Because R8-S1 and R8-M1 both entered as the round-7 repair's own claim outrunning
its mechanism — the totality claim over-asserted for compound/coordinated inputs,
and the "three shapes" completeness claim missing the coordinated member the
round-7 collapse-hunt itself prescribed — the applier should, per the collapse-log's
2026-09-03 Lesson 1 and the apply-*all*-findings rule, re-read every branch of
clause (iv) and every site of the residual (AD-9, L1, AC-24) and confirm the fix
reaches all of them, and cross-check the applied text against the prior round's
*prescribed* repair items, not only its finding headlines.

---

*Round-8 expert review, 2026-09-03. **Not the terminal round.** R8-S1 is a real
Serious — clause (iv)'s object/verb extraction is undefined for the
attributive-compound and coordinated inputs the charter named, and the document's
own corpus row "confirm the version number → `info`" contradicts its stated "head
noun" rule (the head is "number", unlisted; only the modifier "version" is on the
info-lexicon) — so the round-7 "total over its input domain" claim is unmet and
the convergence bar ("a round that finds nothing real") is unmet. The findings are
all single-mechanism fixes and the blast radius stayed narrow (one classifier's
rules, one residual's completeness, one diagnostic's key); the deny confinement,
the owner's locked constraints, and the phase boundary all held, and all nine
round-7 findings closed at their named sites. The count plateau (8 → 5 → 3 → 3) is
the new signal: convergence in blast radius continues, but the finding count has
stopped falling, and condition (b) of the non-convergence tripwire is now **armed**
— if round 9's total is not strictly below 3, it fires. **Inheritance for round 9:**
(1) **Complete clause (iv) as a specification, once** — the object-head-extraction
algorithm (for compounds), the coordinated-verb rule, and a corpus re-derived from
the rules so no corpus row contradicts them; three consecutive rounds have found
this classifier incomplete in a new way each time, which is the signature of a
specification patched per-input rather than closed. (2) **Verify the "N member
shapes" residual against the *prior round's prescribed repair items*, not only its
headline** — the coordinated member was prescribed by the round-7 collapse-hunt and
dropped; the P1-lineage false universal has now recurred seven times. (3) **When a
round widens the deny-capable set, audit every new member for fulfilling-move
wrongful denies** — the no-object widening added `show`/`list` (build-fulfillable)
without owning their wrongful-deny edge. (4) **Verify every specified correlation/
read has a named receptacle** — `deny_bypass_suspect`'s denied-target key has none;
re-audit the other cross-event reads (the done-claim counter's `detail_json`, the
regret proxy's `observed_actions` reads) confirm theirs are named, this one is not.*

Verdict: NEEDS FIXES (3 findings: 1 Serious, 1 Moderate, 1 Minor)
