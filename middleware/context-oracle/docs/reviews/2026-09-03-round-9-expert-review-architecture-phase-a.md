# Round-9 expert review — Phase A architecture (round-8 fix verification + new-defect hunt)

**Artifact:** `docs/architecture-phase-a.md` at current HEAD, commit `780d5ec`
("arch: apply all round-8 review findings (context-oracle Phase A)"), diffed
against the round-8-reviewed draft (`cc61b25`) with
`git show 780d5ec -- middleware/context-oracle/docs/architecture-phase-a.md`.
**Reviewer:** independent session, not the author of the document or of any prior
review. Read in full before the attack: `middleware/context-oracle/CLAUDE.md`,
`OWNER-LEDGER.md`, `docs/specs/spec-context-oracle.md` (all 1130 lines),
`docs/collapse-log.md` (the three 2026-09-03 entries first — rounds 6/7/8 lessons —
then 2026-08-29, then the rest, per the charter), both round-8 review files, the
architecture end to end, and the full round-8 apply diff.
**Axis (round-9 charter):** premises and engineering standards — correctness,
completeness, verification-actually-performed, standards-conformance, citation
integrity, internal consistency. The round-8 fixes (commit `780d5ec`) are the
primary attack surface, attacked **as author text** (collapse-log 2026-08-29
Lesson 1: a reviewer's repair prescription carries no verification of its own; and
2026-09-03 round-8 Lesson 1: a component completed "as a specification" must be
re-derived from source and re-checked for completeness, not accepted as done).
Every check below was run in this session; nothing is carried forward from the
author's attestations or prior rounds' claims without re-derivation. Findings were
not manufactured to avoid an empty report, and none was suppressed to reach
convergence — the mechanical rules govern both directions.

## Scope and Inventory

**Round number:** 9 (Post-fix review; the eighth Post-fix round of this series).

**Tool plan (instruments and claim-type mapping).**
- Literal-content / internal-consistency claims (the bulk of this review): `Read`
  at the specific file:line, this session — every finding's location was re-read
  at drafting time.
- Absence / "no rule covers this shape" and "member not enumerated" claims:
  `Grep` across the full document for the mechanism's signature, then `Read` of
  each region (search locates, reading verifies — collapse-log 2026-07-30
  Observation 14). The load-bearing absence claims (no morphology/normalization
  rule for lexicon matching; no non-request-frame member in the residual class)
  were each established by `Grep` returning zero hits **and** by `Read` of the
  classifier and the residual enumeration.
- The external premises the round-8 fix leans on (NotebookEdit's `tool_input`
  field; Edit/Write's `tool_input` field; a `PreToolUse` deny firing no
  `PostToolUse` — behind the `deny_bypass_suspect` receptacle): `WebFetch` +
  Context7 (`/websites/code_claude`, current hooks/agent-SDK docs) this session.
  No instrument class was unavailable; no load-bearing claim is stranded, so no
  halt condition arose.
- The mechanical floor: `python3 middleware/context-oracle/tools/check_docs.py`,
  run this session (exit 0).

**Post-fix inventory (four sources per the skill's Step 2).**

*(1) The prior review's full inventory + (2) the fix-diff files + (3) dependents,
verified this session:*
- [x] `docs/architecture-phase-a.md` — **Read** across the classifier and its
  dependents (AD-9 clause (iv) 749–947; the deny decision + residual 889–947;
  `deny_bypass_suspect` 1018–1041; AD-4 schema 505–572; AD-5 tuning 596–624;
  AD-19 redaction 1523–1567; AC-24 corpus 1713, 1770–1822; L1/L3 2158–2201;
  Status round-8 recap 2477–2506; Gate-A attestation 1929). Every cited region
  re-read at drafting time.
- [x] `docs/specs/spec-context-oracle.md` — **Read in full** (1–694, 695–1130;
  §8 FR-B1/B2/B5, D-41/D-39, §11.5 Phase-A skeleton framing, OL-C3/OL-C5,
  §14 AC-2a/AC-2c hand-checked at their rows).
- [x] `OWNER-LEDGER.md` — **Read in full** (OL-C1, OL-C3, OL-C5, OL-6, OL-11,
  OL-R4, OL-R5 re-read at use).
- [x] `middleware/context-oracle/CLAUDE.md` — **Read in full** (dominating rules;
  verify-before-assert; apply-*all*-findings; Expert Standard).
- [x] `docs/collapse-log.md` — **Read in full** (the three 2026-09-03 entries
  first — rounds 6/7/8 lessons — then 2026-08-29; then the rest).
- [x] `docs/reviews/2026-09-03-round-8-expert-review-architecture-phase-a.md` —
  **Read in full** (closure items R8-S1, R8-M1, R8-m1).
- [x] `docs/reviews/2026-09-03-round-8-collapse-hunt-architecture-phase-a.md` —
  **Read in full** (closure items P1, N1–N5; the P1 fulfilment-by-mutation
  prescription hand-checked against the applied class text).
- [x] `middleware/context-oracle/tools/check_docs.py` — **Grep-verified** by
  execution (exit 0, output pasted below).
- [x] `code.claude.com` hooks + agent-SDK docs (external premises: NotebookEdit
  `notebook_path`; Edit/Write `file_path`; `PreToolUse` deny → no `PostToolUse`) —
  **Grep-verified** via WebFetch + Context7 this session.

*(4) Prior findings as closure items:* the round-8 resolution table below
re-derives each round-8 finding (R8-S1, R8-M1, R8-m1; CH-P1, N1, N2, N3, N4, N5)
from current source this session.

No new in-scope file surfaced mid-pass. AD-24's named build-time verifications
(marker presence on the owner's real transcript; whether platform-injected turns
fire `UserPromptSubmit`) remain out of this container's reach and are correctly
disclosed as build-time (L11) — not scored as review gaps. No rigor was waived.

## VERDICT: NEEDS FIXES — 0 Critical / 1 Serious / 1 Moderate / 1 Minor

The round-8 fixes closed all three round-8 findings at their named specifics —
most cleanly, the `deny_bypass_suspect` receptacle (R8-m1) is now named
(`kind='deny'` row `evidence_json`, `Edit`/`Write` `file_path` + `NotebookEdit`
`notebook_path`) and its external premises verify TRUE this session; and the
object-less "fulfilment is text, which the deny-eligible set can never touch"
false universal that the round-8 collapse-hunt's P1 attacked is **gone** (`Grep`
→ 0 hits), replaced by an honest over-enforcement disclosure. But three defects
survive the round-8 "specification completion," and each is one of the answer-drift
classifier's now-familiar failure directions recurring where the round-8 fix
claimed to have closed it:

- **R9-S1 (Serious)** is the R8-S1 defect class — a corpus row contradicting the
  stated head-extraction rule in the soundness-critical classifier — **recurring
  as a fix-induced regression**. The round-8 fix changed the head rule to "the
  **rightmost noun**" (to make the flat-compound "version number" row consistent),
  but the document's own retained corpus row "can you answer the question **in the
  ticket**? → `info`" is now inconsistent with it: the rightmost noun of "the
  question in the ticket" is **"ticket"** (inside the post-modifying PP), which is
  unlisted → `request`, not `info`. Round 8's central claim — "re-derive the
  labeled corpus FROM the rules, so a corpus row can never again contradict the
  rule" — is false on audit.

- **R9-M1 (Moderate)** is the P1-lineage completeness-claim-over-an-open-set false
  universal recurring an **eighth** time, on the **frame** axis this round. Round 8
  generalized residual member (3) to a class scoped "any **in-frame** ask ...
  however the `info` label arose." But the `info` label also arises via the
  **non-request-frame** branch, and a non-request-frame info interrogative whose
  answer is a mutation ("does the null check fix it?") is `info`-classified,
  mutation-fulfilled, and outside the "in-frame" scope — and outside members (1)
  and (2). "Three member shapes" / "complete as a class however the info label
  arose" is again false; the class generalization closed the object-shape axis and
  left the frame axis open.

- **R9-m1 (Minor)** is the lexicon-**match** step left under-specified in the same
  soundness-critical classifier. The round-8 version/number re-pin commits the
  classifier to exact-token head matching, but no morphology or class-membership
  matching rule is stated; under exact matching a **plural** `OL-C3` escalation
  re-ask "can you please answer my **questions**?" misses the "question"/"answer"
  recourse carve-out → `request` → the recourse the carve-out exists to preserve
  is disarmed (the reverse-safe direction the round-6 lesson requires be tested).

By the mechanical rule a single Serious blocks PASS; round 9 is not the terminal
round. **The non-convergence tripwire's condition (b) fires this round** (total
findings 3 → 3 → 3, two consecutive non-decreases; the round-8 review armed it),
and the substance matches the tripwire's designed signal: four consecutive rounds
(R6–R9) have found the answer-drift classifier incomplete or inconsistent a **new
way each time**, and round 8's explicit "specify it completely, once" meta-fix did
not stop the recurrence — it introduced one of this round's defects (R9-S1) and
left another axis open (R9-M1). The Recommended Priority therefore opens with
foundational rework, not another patch (below).

---

## Summary

This review returns **NEEDS FIXES**, and — for the first time in this series —
with the non-convergence tripwire **fired**. The round-8 fixes are individually
well-landed: R8-m1's receptacle is correctly named and its `notebook_path` /
`file_path` / no-`PostToolUse`-on-deny premises verify TRUE against current docs;
the object-less false universal is fully removed; N3 (Bash-authored-change
under-detection) is owned in L3; and the flat-compound "version number → request"
re-pin is internally consistent with the new rule. But the classifier that rounds
6, 7, and 8 each found incomplete a new way is, a fourth round running, incomplete
a new way: the round-8 "rightmost noun" rule contradicts its own retained corpus
row "answer the question in the ticket → info" (rightmost noun "ticket" → request)
(R9-S1); the "complete as a class, however the info label arose" residual is
scoped "in-frame" and misses the non-request-frame info interrogative whose answer
is a mutation (R9-M1); and the lexicon-match step has no morphology rule, so a
plural recourse re-ask disarms the `OL-C3` recourse (R9-m1). The blast radius is
narrow (one classifier), the deny confinement and owner constraints hold, and the
collapse-hunt axis has converged — but the count has stopped falling and the
component keeps failing a new way, which is exactly what condition (b) exists to
name.

## Upstream Contract Verification (Step 7)

Each governing spec/ledger item the round-8 fixes touch, checked honored/violated
against the verified current text this session:

- **Spec `D-41` / §11.5 — Phase A ships a "conservative deterministic recognizer
  ... safe, low-coverage: a skeleton, not the working block"; the OL-C5-serving
  precision is Phase B** — **VIOLATED by over-reach** (R9-S1 + R9-M1, and the
  systemic root). The spec asks the Phase-A classifier only to be **safe and
  low-coverage**; the architecture instead asserts it "classifies, positively,
  every opened row" (AD-9 764), that the wrongful-deny residual "has three member
  shapes" / is "complete as a class" (AD-9 916/935, L1 2164), and that the
  classifier carries "**No inline architectural calls**" (Gate-A, line 1929) — a
  totality/completeness/determinacy posture the spec explicitly reserves for the
  Phase-B model-maintained state. The recurring finding is that the model-free
  classifier cannot meet the claims the document makes for it. Verified: spec
  §11.5 (Phase-A "skeleton, not the working block") vs AD-9 764, 916, 935; L1 2164;
  line 1929.
- **`OL-C3` / `OL-C5` (answer-drift block; protected answer-directed class)** —
  **honored at the definitional level** (the trigger is OL-C5's wording, `D-39`
  unchanged; the deny confinement at AD-10 is textually untouched) but the
  **recourse is disarmable on two edges the classifier does not cover**: the
  "answer the question in the ticket" phrasing resolves to `request` under the
  rightmost-noun rule (R9-S1), and a plural "answer my questions?" resolves to
  `request` under exact-token matching (R9-m1) — both disarm the `OL-C3` recourse
  the classifier is built to preserve. Verified: AD-9 789, 809–811 (the
  "question"/"answer" carve-out "to preserve the OL-C3 recourse") vs AD-9 774–778,
  AC-24 1792.
- **`FR-B5` (per-error-direction leans) / the "three member shapes" completeness
  claim** — **honored in letter; the completeness claim is false** (R9-M1): the
  non-request-frame info interrogative whose answer is a mutation is a deny-capable
  `info`-classified ask whose fulfilment is a mutation, outside all three enumerated
  shapes and outside the "in-frame" class scope.
- **`OL-C1` (no arbitrary volume/count/budget cap)** — **honored**: the round-8
  additions (the head/coordinated rules, the residual class generalization, the
  `evidence_json` receptacle, the L3 disclosure) are classification, disclosure,
  and bookkeeping; the owner-fidelity re-scan of the round-8 diff found no
  volume/count/budget term.
- **`FR-B3` / `OL-R4` / `AC-2` (no pre-emptive gate, no generated-file block, no
  mutation, one deny producer)** — **honored**: the round-8 diff touches the
  classifier's rules (AD-9 clause iv), the residual disclosure (AD-9/L1/AC-24), a
  schema comment (AD-4), the `deny_bypass_suspect` predicate (AD-9/AD-4), and L3
  only; AD-10's single-producer confinement, the `kind='info'`+mutating-file
  deny-eligibility predicate, reactive-only, text-never-denied, and self-clearing
  are textually untouched and re-read consistent. R9-S1/R9-M1/R9-m1 are
  classification-determinacy / disclosure-completeness / match-specification
  defects, never a new deny producer.
- **`OL-R5` (define the trigger positively, never by exclusion)** — **honored**:
  clause (iv) remains a positive classification; the round-8 additions are positive
  rules; R9-M1 is a *missing* positive coverage of a class member, not a
  negative-space definition.
- **`FR-X1` / AD-19 redaction (the `deny_bypass_suspect` receptacle cites "redacted
  per AD-19")** — **honored**: AD-19's redactor applies "to any string entering a
  store, log, whisper, or diagnostic" (line 1526–1527); `evidence_json` is in the
  `whisper_audit` store, so the deny-target path is subject to it, and a path is a
  "name/pointer" that pointer-only composition explicitly permits (line 1531–1533).
  The citation is coherent.

---

## Serious

### R9-S1 — The round-8 object-head-extraction rule ("the head is the **rightmost noun**") contradicts the document's own retained labeled corpus row "can you answer the question **in the ticket**? → `info`" (rightmost noun "ticket" is unlisted → `request`), so the round-8 central claim "re-derive the labeled corpus FROM the rules, so a corpus row can never again contradict the rule" is false — the R8-S1 defect class recurring as a fix-induced regression on a PP-postmodified object, in the classifier the Gate-A attestation says has no inline architectural calls

**Location.** AD-9 clause (iv)'s object-head rule (lines 773–778: "The object is the
noun phrase **immediately following the verb** (skipping an optional 'me/us'); its
**head is the rightmost noun** of that phrase — attributive modifiers are ignored
('the version number' → 'number', 'the test results' → 'results') — and only the
head is matched against the lexicons (**never a bag-of-words scan**...)") × the
information-object lexicon (lines 787–789: "error / output / log / diff / result /
value / version / status-class — plus **question / answer**") × the artifact-object
lexicon (lines 799–800: "demo / test / script / example / branch / file / PR-class")
× the unlisted-object default (lines 805–808: "Any other object — an unlisted head
noun ... defaults to `kind='request'`") × the labeled corpus row (AC-24 line
1792–1795: "can you answer the question **in the ticket**? (the ticket asks for a
feature) → `info`") mirrored at AD-9 796–797 (clause-iv rationale), AD-9 928–929
(deny-decision member (3)), and L1 2176 × the AC-24 "info/request classifier against
a **labeled corpus**" framing (line 1713) × the totality invariant (line 764,
"classifies, positively, every opened row") and "this classification is where the
block's soundness lives" (lines 761–762) × the Gate-A attestation "**No inline
architectural calls found remaining**" (line 1929).

**What is wrong.** The round-8 fix replaced round-7's "the **head noun** of the noun
phrase" (the linguistic head) with "the **rightmost noun** of that phrase" — a
change made, per the commit message and Status (2492–2493), to make the flat
compound "version number" resolve to head "number" and be re-pinned to `request`.
For a flat right-headed compound ("version number", "test results") the rightmost
noun **is** the head, and the fix is correct. But for a noun phrase with a **post-
modifying prepositional phrase** — "the question **in the ticket**" — the rightmost
noun is **"ticket"** (the object of the PP "in the ticket"), which is *not* the head
("question" is). The rule's only carve-out is "attributive modifiers are ignored,"
and a post-modifying PP is **not** an attributive modifier (attributive modifiers
precede the head: adjectives, noun-adjuncts). So the rule as written selects
"ticket," matches it against the lexicons, finds it on neither the info-object list
nor the artifact-object list → **unlisted → `request`**.

But the document's own labeled corpus pins "can you answer the question in the
ticket? → `info`" (four sites: AC-24 1792, AD-9 796–797, AD-9 928–929, L1 2176),
and it is load-bearing — it is the **canonical member-(3) example** (the info-object
ask whose answer is a build) and it is the "answer the question" meta-answer ask the
`OL-C3` carve-out exists to keep `info`. Under the round-7 rule ("head noun") the row
resolved to head "question" → `info` (consistent); the round-8 change to "rightmost
noun" **broke** it. The normative rule now yields `request`; the labeled corpus
demands `info`; the two cannot both be satisfied. This is exactly the R8-S1 finding
("the normative rule and the labeled test corpus cannot both be satisfied") — the
same defect class the round-8 fix asserted it had closed by "re-deriving the corpus
from the rules," recurring one construction over (PP-postmodified where round 8 fixed
flat-compound), and it is an **inline architectural decision** ("which noun is the
head of a PP-postmodified NP?") in the classifier the Gate-A attestation (line 1929)
still says has none.

An implementer building the classifier "against the labeled corpus" (line 1713) will
implement matching that returns "question" for this row — i.e. **not** rightmost-noun
matching — contradicting the deliberate rightmost-noun choice and classifying other
PP-postmodified objects unpredictably ("can you show me the demo **in the branch**?"
→ head "branch" (artifact, inert) vs the intended "demo"; "can you explain the bug
**in the parser**?" → head "parser" vs "bug"), including toward `info` →
deny-capable → possible wrongful deny.

**How verified.** Read of AD-9 lines 773–811 this session (the full object-head and
lexicon-branch structure); Read of AC-24 line 1792–1795 (the "ticket" row pinned
`info`), AD-9 796–797 and 928–929 and L1 2176 (the same row, three more sites);
Read of line 1713 (AC-24's "labeled corpus" framing), line 764 (the totality
invariant), line 1929 (the Gate-A "no inline architectural calls" attestation);
`Grep "question in the ticket"` → 2176, 2461 (2461 is the Status round-7 recap;
1792 is present but its `**ticket**` markdown-bold splits the literal string — read
directly). The rightmost noun of "the question in the ticket" being "ticket" (the PP
object), not "question" (the NP head), is standard English NP structure (head +
post-modifying PP), and "in the ticket" not being an *attributive* modifier (which
are pre-head) is likewise standard. Every other AC-24 corpus row was re-derived from
the rule and is consistent (see Checks run that came back clean).

**Failing scenario.** An implementer honors the stated rule (rightmost noun): "can
you answer the question in the ticket?" → head "ticket" → unlisted → **`request`** →
the ask is tracked-not-denied, and the `AC-2b`/AC-24 fixture that pins it `info`
(deny-capable, fulfilling `Edit` wrongfully-denied-once) **fails**. Alternatively the
implementer builds to pass the fixture (matching "question" inside the NP): then the
"rightmost noun" rule is not what ships, "the version number" may resolve to head
"version" (matching the modifier the round-8 fix deliberately excluded) → `info` →
the version question deny-arms where the fix intended `request`, and the whole
round-8 reconciliation is undone. The rule and its own oracle disagree; whichever the
implementer picks, the other is violated.

**Why Serious (boundary noted).** It is a genuine internal inconsistency between the
normative classification rule and the document's own labeled test corpus (the
classifier's oracle, AC-24 1713), in the classifier AD-9 calls soundness-critical
(line 762) and the Gate-A review attests carries no inline decisions (line 1929) — a
direct falsification of the round-8 "corpus re-derived from the rules, no row
contradicts the rule" claim that is the primary round-9 attack surface, and a
**fix-induced regression** (round-7's "head noun" rule classified this row
consistently; the round-8 "rightmost noun" change broke it). It is bounded below
Critical because on this specific row the rule's answer (`request`) is the
under-enforcement direction (the recourse for this phrasing does not arm; Max-visible),
the block's structural confinement is untouched, and re-asking the underlying question
in a covered form still re-arms.

**Fix (single mechanism).** State the head-extraction rule so that it is total AND
consistent with the corpus, then reconcile every corpus row to it. Concretely: define
the object as the **NP core immediately following the verb, excluding any
post-modifying prepositional phrase**, whose head is the rightmost noun of that core
(attributive pre-modifiers ignored) — so "the question in the ticket" → core "the
question" → head "question" → `info` (consistent with the corpus), and "the version
number" → core "the version number" → head "number" → `request` (consistent with the
round-8 re-pin). Then re-derive **every** AC-24 corpus row from the final rule (the
round-8 lesson: re-derive the corpus from the rules), and add a PP-postmodified corpus
pair — one whose core head is `info` ("answer the question in the ticket?") and one
whose core head is unlisted ("explain the bug in the parser?") — so the PP shape is
pinned. Then the Gate-A "no inline architectural calls" attestation becomes true for
PP-postmodified objects.

---

## Systemic Patterns

No **separate** Systemic finding is filed, but the three findings share one root, and
it is named here with the proactive scan because it drives the Recommended Priority.

**The pattern:** the Phase-A answer-drift classifier is specified as a **total,
correct, model-free NLP engine**, asserting totality/completeness/determinacy the
spec's own D-41/§11.5 reserve for Phase B. The claims, grep-enumerated across the
classifier this session:
- `Grep "classifies, positively, every opened row"` → line 764 (totality claim).
- `Grep "three member shapes|complete as a class|however the .info. label arose"` →
  AD-9 916, 927, 935; L1 2164, 2180 (completeness-over-an-open-set claim).
- `Grep "No inline architectural calls"` → line 1929 (determinacy claim: the
  classifier carries no inline decisions).
- `Grep "where the block.s soundness lives"` → line 762 (soundness claim resting on
  the above).

Each round attacks one of these claims where the model-free classifier cannot meet it
— R6 the default flip, R7 the no-object gap, R8 the compound/coordinated/corpus gaps,
R9 the PP-head contradiction (R9-S1), the frame-axis class hole (R9-M1), and the
lexicon-match under-specification (R9-m1). This is not three unlucky isolated defects;
it is one over-reach (a skeleton specified as if it were complete) surfacing wherever
the next reviewer probes a new construction. Per the round-8-precedent handling of
the analogous thread (rounds 6–8 recorded it as inheritance, not a fourth finding),
it is carried into the Convergence Record and Recommended Priority rather than filed
as a separate Systemic finding — but it is the reason the tripwire fired, and the
reason the indicated path is foundational rework, not a fourth patch.

## Moderate & Minor Findings

### R9-M1 (Moderate) — The round-8 residual-member-(3) class is scoped "any **in-frame** ask ... however the `info` label arose," but the `info` label also arises via the **non-request-frame** branch: a non-request-frame info interrogative whose answer is a repo mutation ("does the null check fix it?") is `info`-classified, deny-capable, mutation-fulfilled, and outside the "in-frame" scope — and outside members (1) and (2) — so "three member shapes" / "complete as a class" is false, the P1-lineage completeness universal recurring an eighth time on the **frame** axis

**Location.** AD-9's residual member (3) (lines 925–936: "**any in-frame ask** that
classifies `info` (deny-capable) but whose fulfilment — or a co-asked action — is a
repo mutation. This is one class, **however the `info` label arose**") × L1's mirror
(lines 2173–2182: "any **in-frame** ask that classifies `info` ... Shape (3) is a
*class*, not a phrasing list, so lexicon or parse gaps that route more asks to `info`
fall into it rather than adding a fourth shape") × the "three member shapes"
completeness claim (AD-9 915–916, L1 2164) × member (1) "an action-request phrased
**outside the request frame entirely**" (AD-9 917–919, L1 2166–2168) × the
**non-request-frame** branch (AD-9 769–770: "A **non-request-frame** interrogative
('why does X fail?', 'did you run the tests?') classifies `kind='info'` —
deny-capable") × the deny recognizer "denies **every** repo mutation while a
deny-capable `info` question is open" (AD-9 909).

**What is wrong.** Member (3) is scoped "**in-frame**" — i.e. inside the request
frame ("can/could/will/would/please … you …", AD-9 771), the complement of member
(1)'s "outside the request frame entirely." But the `info` label arises by **two**
paths: the request-frame communicative-verb branch (AD-9 782–811) *and* the
**non-request-frame** branch (AD-9 769–770), which classifies **every** non-request-
frame interrogative `info`. A non-request-frame info interrogative **whose answer
requires a repo mutation** is a real, reachable member of the wrongful-deny residual:

- "**does the null check fix it?**" — a genuine yes/no question (not request-frame:
  no "can you"); to answer, the agent adds the null check (`Edit`) and runs the test.
  The `Edit` is the `OL-C5`-protected answer-directed move, and the recognizer denies
  every repo mutation while the `info` question is open (AD-9 909) → the `Edit` is
  **wrongfully denied**.
- "**will this refactor break the build?**" (no "you", so non-request-frame) — same
  shape: the answer requires doing the refactor and building.

This ask is the **exact semantic twin** of member (3)'s own enumerated example
"answer whether the null check fixes it" (AD-9 929–930) — differing only in surface
frame (bare interrogative vs. the request-frame "answer whether…"). Yet it is:
member (1)? No — member (1) is an *action-request* ("mind fixing X?"), and this is a
genuine information question. Member (2)? No — not rhetorical. Member (3)? No — member
(3) is scoped "**in-frame**," and this is non-request-frame. So it falls outside all
three enumerated shapes and outside the class scope, while the class text
simultaneously claims to cover the `info` label "**however the info label arose**" —
an internal contradiction ("in-frame" vs "however it arose"). "The wrongful-deny
residual has three member shapes" (L1 2164) is false on audit — the P1 lineage
(round-1-S2 → 3-C1 → 4-P1 → 5-P1 → 6-P1 → 7-P1 → 8-P1 → **this**), which the round-8
class generalization claimed to end "at its root" (Status 2497), recurring on the
frame axis instead of the object-shape axis it closed.

**How verified.** Read of AD-9 925–936 and L1 2164–2182 this session (member (3)'s
"in-frame" scope and the "however the info label arose" claim); Read of AD-9 917–919
(member (1) = out-of-frame action-request), 769–770 (the non-request-frame branch
classifies info), 909 (denies every repo mutation while info is open), 929–930
(member (3)'s own "answer whether the null check fixes it" example); `Grep "in-frame"`
→ 925, 2173 (member (3) both sites), 2460/2495 (Status recaps) — the term is used only
for member (3) and pairs with member (1)'s "outside the request frame entirely," so
"in-frame" = request-frame is unambiguous; `Grep "non-request-frame"` → 769 (the
branch that classifies all such interrogatives `info`).

**Failing scenario.** Max asks "does the null check fix it?" The question opens
(ends with `?`, not stoplisted), classifies `info` via the non-request-frame branch,
and is deny-capable. The agent adds the null check and runs the test to find out; the
`Edit` is denied ("answer Max's question first: does the null check fix it?"). Which
of the residual's three member shapes is that? None — not out-of-frame action-request
(1), not rhetorical (2), not in-frame (3). The block's one-halting-mechanism
completeness claim is incomplete on first audit, on the same axis (frame) the round-8
class scope newly excluded.

**Why Moderate (boundary noted).** The residual is an owner-facing *disclosure* that
gates nothing; each wrongful deny is escapable by one substantive text turn and lands
on the wrongful-deny rate (Max-visible), and the harm direction is bounded
over-enforcement — which keeps it below Serious. But it falsifies a completeness claim
about the block's one halting mechanism and it directly falsifies the round-8 "complete
as a class, however the info label arose" claim that is a primary round-9 attack
surface, so it is not Minor.

**Fix (single mechanism).** Drop the word "**in-frame**" from member (3)'s scope at
both sites (AD-9 925, L1 2173) and state the class by its single defining property,
matching the "however the info label arose" clause it already carries: **member (3) =
any ask that classifies `info` (deny-capable) — by the request-frame communicative
branch OR the non-request-frame branch — whose fulfilment, or a co-asked action, is a
repo mutation.** Add a corpus row for the non-request-frame case ("does the null check
fix it?" → `info` → the fulfilling `Edit` wrongfully-denied-once) to AC-24 so the
frame axis is pinned, exactly as the object-shape members now are. (This is the same
"scope by the single property, never by a sub-shape word" move the round-8 fix made
for object shape; it was applied to object shape and not to frame.)

### R9-m1 (Minor) — The lexicon-**match** step is under-specified in the soundness-critical classifier: the round-8 version/number re-pin commits it to exact-token head matching, but no morphology or class-membership matching rule is stated, so a **plural** `OL-C3` escalation re-ask "can you please answer my **questions**?" (head "questions") misses the "question"/"answer" carve-out → `request` → the recourse the carve-out exists to preserve is disarmed (the reverse-safe direction the round-6 lesson requires be tested)

**Location.** AD-9 clause (iv) match rule (lines 776–778: "only the head is matched
against the lexicons (**never a bag-of-words scan**...)") × the information-object
lexicon's singular word tokens and non-word class tokens (lines 787–789: "error /
output / log / diff / **result** / value / version / **status-class** — plus
**question / answer**") × the artifact lexicon's class token (line 799–800:
"...**PR-class**") × the version/number exact-token re-pin (AC-24 1786–1789: head
"number" ≠ modifier "version") × the document's own plural head-extraction example
(line 775: "'the test **results**' → 'results'") × the "question"/"answer" recourse
carve-out (lines 789, 809–811: "The lone object direction that must fail the other way
— 'question'/'answer', whose correct kind is `info` **to preserve the `OL-C3`
recourse**") × the AC-24 recourse-re-arm fixture (lines 1770–1771: "object head
'question' ... re-arms the block").

**What is wrong.** The round-8 fix specifies head **extraction** to the token
("rightmost noun," "attributive modifiers ignored") and re-pins the version/number row
on the ground that the matcher tests the **exact head token** ("number", not the
modifier "version") — a commitment to exact-token matching. But the **match** step
(head token → lexicon membership) is never given a morphology or class-membership
rule. `Grep` for `plural|stem|lemma|singular|morpholog|normaliz|tokeniz` across the
classifier → **0 hits** (the only "normaliz" hits are repo-identity URL normalization
(388), DB normalization (556), and composer normalization (1960) — none about lexicon
matching). Two consequences follow from the doc's own material:
1. The lexicon tokens are singular ("result", "value", "version", "question",
   "answer"), but the document's own head-extraction example produces a **plural**
   head, "the test results → **results**" (line 775), which under exact-token matching
   misses the singular "result" → unlisted → `request` (under-enforcement — safe, but
   the doc's own example silently classifies against its apparent intent).
2. The unsafe consequence, on the recourse carve-out: a **plural** request-frame
   `OL-C3` escalation re-ask — "can you please answer my **questions**?" (natural when
   Max asked several, which the block tracks "as a set", AD-9 835) — has head
   "questions", which under exact-token matching misses the "question"/"answer" carve-
   out → `request` → **the recourse the carve-out exists to preserve is disarmed**.
   This is the round-6 lesson exactly ("a default/rule that resolves an incompleteness
   must be tested against ... the members whose correct answer is the other way"):
   the "question"/"answer" carve-out was tested against its singular form (AC-24's
   "can you please answer my question?", singular) and not against the plural, whose
   safe direction is the reverse.

Additionally the lexicons mix word tokens with **class** tokens ("status-class",
"PR-class") that are not words a head noun equals — so "match the head against the
lexicon" is under-specified for those entries too (does head "status" or "statuses"
match "status-class"? unspecified). All of this is the lexicon-match half of the
classifier the round-8 "specify it completely, once" mandate was meant to close, left
open.

**How verified.** Read of AD-9 776–778 (head-only matching), 787–789 (singular +
class lexicon tokens), 799–800 ("PR-class"), 809–811 (the recourse carve-out), 775
(the "results" plural example); Read of AC-24 1786–1789 (the exact-token version/number
re-pin) and 1770–1771 (the singular-"question" recourse-re-arm fixture); `Grep
"plural|stem|lemma|singular|morpholog|normaliz|tokeniz"` across the document → 0 hits
in the classifier (the three "normaliz" hits are unrelated). The head of "my questions"
being "questions" (plural), and "questions" ≠ "question" under exact-token matching, is
standard.

**Failing scenario.** The block has denied a drift move; Max escalates: "can you please
answer my questions?" Head "questions" → exact-token miss on "question"/"answer" →
unlisted → `request` → not deny-capable → the recourse does not re-arm, and the
escalation Max issued specifically to invoke `OL-C3` is silently under-enforced. (Max
can recover by re-asking the original question verbatim, which re-arms via the
open-scoped dedup — but the plural re-ask itself, the natural escalation, is dropped.)

**Why Minor.** The harm is bounded (request-frame + plural specifically; Max has
covered re-ask forms that still arm, including the bare imperative "answer my
questions?" which routes `info` via the non-request-frame branch), it is under-
enforcement (Max-visible), and morphology is arguably an implementation detail — but
the document has *chosen* to specify this classifier at the token level and re-pinned a
corpus row on exact-token grounds, so leaving the match step's morphology and
class-membership unspecified, with a reverse-safe consequence on the `OL-C3` recourse
carve-out, is a real under-specification at the doc's own granularity, not an
observation.

**Fix (single edit).** State the match rule in clause (iv): whether the head token is
matched by exact token, by a normalized (case-/number-folded) form, or by
class-membership for the class entries ("status-class", "PR-class") — and, for the
"question"/"answer" carve-out specifically, require the match to cover the plural so
the recourse re-arms for "answer my questions?". Add a plural recourse-re-arm row to
AC-24.

## Tentative Findings

No tentative findings — every candidate finding's premise was verified against current
source this session (Read at the cited lines, Grep for the absence/occurrence claims,
WebFetch + Context7 for the external hooks/tool-input premises, and the mechanical
floor executed). One candidate that could have been tentative was resolved to a
non-finding by reading: the `deny_bypass_suspect` "same turn" correlation grouping
(how the later Bash write is tied to the specific deny row) is pre-existing round-7
mechanism the round-8 fix did not touch, and the round-8 fix's only change — the
receptacle for the target *path* — is buildable and coherent (see R8-m1 in the
resolution table), so it is not scored as a round-8-fix defect.

## Observations

- **The imperative and bare-non-request-frame cases route `info` and are safe.** "mind
  fixing X?" (out of frame) → `info` → member (1); "answer my questions?" (bare
  imperative, no "can you") → non-request-frame → `info` → deny-capable (so the plural
  disarming in R9-m1 is specifically the **request-frame** plural, not the bare
  imperative). Recorded so the R9-m1 boundary is auditable. Verified by Read of AD-9
  769–770, 917–919.
- **The finding count has plateaued for a second round (R7: 3 → R8: 3 → R9: 3).** This
  is the second consecutive non-decrease and is the arithmetic behind the tripwire
  firing (Convergence Record). Recorded as context; the standard violation is carried
  by the three findings, not by this note.
- **The round-8 fixes introduce no new external premise, and the one they reuse
  verifies TRUE.** The `deny_bypass_suspect` receptacle relies on: Edit/Write
  `tool_input.file_path`, NotebookEdit `tool_input.notebook_path`, and a `PreToolUse`
  deny firing no `PostToolUse`. This session's Context7 (`/websites/code_claude`)
  confirmed all three (PostToolUse Write payload `"tool_input": {"file_path": ...}`;
  Agent-SDK NotebookEdit schema `"notebook_path": str`; "A hook that denies permission
  blocks the tool" + PostToolUse "Fires after a tool executes successfully"). No
  standard violated; recorded as premise maintenance.
- **Procedural (tool availability):** the mandatory pre-delivery multi-perspective
  check (`collaborativereasoning`) has no tool available in this environment (Clear
  Thought MCP not loaded). Per the skill's documented-infrastructure-failure fallback,
  the three personas were run manually before delivery — the project's standards
  discipline (findings named against standards; tripwire arithmetic honest; the
  foundational-rework recommendation re-derives from the spec's own D-41/§11.5 mandate
  rather than cutting a feature or handing the owner a scope question), the downstream
  applier (verdict unambiguous; warned that isolated patching of R9-S1/M1/m1 reproduces
  the churn), and the implementer (each finding carries a concrete failing scenario and
  a single-mechanism fix; the R9-S1 and R9-M1 fixes are mutually consistent and both
  subsumed by the reframe). No persona-unique gap survived into this delivery.

## What's Actually Good

- **R8-m1's receptacle is correctly named and correctly grounded.** Judged against the
  document's own receptacle-naming discipline (the round-4 `session_log.detail_json`
  precedent) and premise-correctness: the deny handler now writes the denied action's
  target path (`file_path`, or `notebook_path` for `NotebookEdit`; redacted per AD-19)
  into the `kind='deny'` `whisper_audit.evidence_json`, and `deny_bypass_suspect` reads
  it there (AD-9 1026–1032, AD-4 528–534). The `evidence_json` column exists in the
  schema (line 535–537); AD-19's ingress redaction covers strings entering the store
  (line 1526–1527), and a path is a name/pointer pointer-only composition permits (line
  1531–1533); the field names verify TRUE against current docs (this session, Context7);
  and V19 (a denied Edit fires no PostToolUse, so it needs a separate receptacle) is
  re-confirmed. This is the round-8 finding that landed cleanly, premises and all.
- **The object-less "fulfilment is text, which the deny-eligible set can never touch"
  false universal is gone.** Judged against the round-8 collapse-hunt P1 standard
  (correct the universal, make the classification honestly conservative): `Grep
  "fulfilment is text, which the deny-eligible set can never touch"` → **0 hits**;
  AD-9 790–798 now states fulfilment is "*usually* text ... where the fulfilment is
  instead a repo mutation ... the categorical `Edit`-deny falls on that mutation — the
  owned over-enforcement residual (member (3))," consistent with the "denies every repo
  mutation" admission 110 lines below (line 909). The object-less over-enforcement edge
  the round-8 collapse-hunt's P1 attacked is now owned, not hidden behind a false
  universal. Verified by Read of AD-9 790–798, 909 and the grep.
- **The flat-compound version/number re-pin is internally consistent.** Judged against
  internal consistency: "could you confirm the version? → info (head 'version')" beside
  "could you confirm the version number? → request (head 'number', unlisted — the
  rightmost-head rule, not a bag-of-words match on 'version')" (AC-24 1786–1789) is
  exactly what the rightmost-noun rule yields for a flat compound. The fix is correct
  for the construction it targeted; R9-S1 is that the same rule fails the *different*
  (PP-postmodified) construction. Verified by Read of AD-9 773–778 and AC-24 1786–1789.
- **N3 (Bash-authored change under-detection) is owned in the coverage ledger.** Judged
  against the round-8 collapse-hunt N3 prescription (its home is L1/L3, not a schema
  comment): L3 now states "a file changed only through `Bash` (`echo > f.py`, `sed -i`)
  ... is **not** a member of the Completeness/Verification change-set ... safe
  under-detection (never a false claim)" (lines 2196–2201). Verified by Read of L3.

## Round-8 finding resolution table

"Resolved" = fixed in substance at the location the finding named, swept, no surviving
contradicting copy, except where a note points at a finding above. (ER = round-8 expert
review; CH = round-8 collapse-hunt.) Each row re-derived from current source this
session.

| Round-8 finding | Status in `780d5ec` | Where / notes (verified this session) |
|---|---|---|
| ER R8-S1 (compound head undefined; "version number → info" corpus contradiction; coordinated-verb undefined) | **Resolved at its named specifics; a fix-induced regression on a PP-postmodified row** | Rightmost-noun rule added (AD-9 773–778) → compound head now defined; version/number re-pinned consistent (AC-24 1786–1789); coordinated-verb rule added (AD-9 812–818). But the new "rightmost noun" rule now contradicts the retained corpus row "answer the question in the ticket → info" (rightmost noun "ticket" → request) → **R9-S1**. |
| CH P1 (object-less `show`/`confirm` → info fulfilment-by-build wrongful deny; "fulfilment is text" false universal; residual scoped by object-shape) | **Resolved** | Object-less rationale corrected (AD-9 790–798); "fulfilment is text, which the deny-eligible set can never touch" is **gone** (`Grep` → 0); residual re-scoped to fulfilment-by-mutation as a class (AD-9 925–936, L1 2173–2182, AC-24 1796–1799). See What's Actually Good. (The class's *frame*-axis scope hole is **R9-M1**, a new axis, not this object-shape gap.) |
| ER R8-M1 (three member shapes incomplete; coordinated dropped; no-object `show`/`list`) | **Resolved for the object-shape gaps; class completeness false on the frame axis** | Member (3) generalized to a class covering info-object / wh-complement / object-less `show`/`list` / coordinated (AD-9 925–936, L1 2173–2182); coordinated corpus row added (AC-24 1796–1799). But the class is scoped "in-frame" while claiming "however the info label arose"; the non-request-frame info interrogative with mutation fulfilment is outside it → **R9-M1**. |
| ER R8-m1 (`deny_bypass_suspect` correlation key unpersisted) | **Resolved** | Receptacle named (AD-9 1026–1032, AD-4 528–534); coherent with the `whisper_audit` schema, AD-19, and evidence_json; Edit/Write `file_path` + NotebookEdit `notebook_path` field names verified TRUE (Context7, this session); V19 re-confirmed. See What's Actually Good. |
| CH N1 (clause (iv) parse under-specification: head-noun identification for compounds/PP/coordination is an unspecified model-free step) | **Partially addressed; the residue is the R9-S1/R9-m1 root** | The rightmost-noun rule pins flat compounds; but PP-postmodified head (R9-S1) and lexicon-match morphology/class-membership (R9-m1) remain unspecified — the N1 "unspecified model-free step in the soundness-critical classifier" is the un-converged core the tripwire now names. |
| CH N2 (`--missed-question` tune-offer undiscriminating) | **Not addressed; not a round-8 target** | The round-8 fix did not touch AD-18's `--missed-question` offer; it remains owner-driven/reversible per round-8's own "note, not partial." Not scored as a round-8-fix defect. |
| CH N3 (Bash-authored change miss not in the L1/L3 coverage ledger) | **Resolved** | L3 2196–2201 now owns it ("safe under-detection ... never a false claim"). Read this session. |
| CH N4 (same-name crown-a-false-rival; `OL-C4` hazard posture over-extended) | **Not addressed; an unresolved mission-axis choice** | Round-8 expert review did not re-file it; the round-8 collapse-hunt flagged it as a round-9 sharpening (lexer-scoped `symbol_refs` vs. disclosure). Mission-axis; deferred to the parallel collapse-hunt, out of this axis's scope. |
| CH N5 (a: NotebookEdit omitted from bypass correlation; b: stoplist-tending efficacy) | **N5a resolved; N5b unchanged** | N5a: `notebook_path` now covered (AD-9 1030, AD-4 529). N5b (stoplist match-semantics efficacy) is the same match-specification gap as R9-m1's sibling, owned as "fallible by construction"; not separately re-filed. |

## Checks run that came back clean

- **Mechanical floor:** `python3 middleware/context-oracle/tools/check_docs.py` →
  `context-oracle doc-consistency check passed.` (exit 0) on the current tree, run
  this session.
- **AC-24 corpus re-derivation from the rules (charter fix 1):** every corpus row read
  and re-derived from clause (iv). Consistent: "show me a prototype? → request" (head
  "prototype" unlisted); "tell me why the login test fails? → info" (wh-complement
  precedence); "confirm the version? → info" (head "version"); "confirm the version
  number? → request" (head "number"); "explain? → info" (object-less); "answer my
  question and fix the bug? → info" (coordinated; "answer"'s object "my question" head
  "question"); "rename the helper? → request"; "show me a demo? → request"; "show me
  the error? → info"; "summarize the error? → request". **The one inconsistent row is
  "answer the question in the ticket? → info"** (rightmost noun "ticket" → request) →
  **R9-S1**. All other rows derivable.
- **Object-head rule over the charter's probe shapes:** possessive ("the user's config"
  → head "config" → request; "the user's answer" → head "answer" → info, text-fulfilled)
  — safe; gerund/clausal ("explain updating the schema" → head "schema" → request, or
  object-less → info text-fulfilled) — safe; PP object ("tell me about the error" →
  head "error" or object-less → info text-fulfilled) — safe, **except** the
  PP-postmodified-with-`info`-core-head "the question in the ticket" (R9-S1); wh-clause
  object ("tell me what the error is" → wh-complement precedence → info) — safe;
  empty/degenerate ("can you fix?" → request; "can you show?" → object-less info) —
  safe. Verified by Read of AD-9 769–818.
- **Coordinated-verb rule:** "answer my question and fix the bug? → info → co-asked fix
  denied" (member (3)); "tell me the plan and fix the bug? → request" (object "plan"
  unlisted, not info/object-less → else request → safe under-enforcement); "rename X and
  fix Y? → request" (no communicative verb → safe). Resolves member-(3)-owned or safe;
  "top-level verb" identification is the same unspecified parse step as N1/R9-m1.
  Verified by Read of AD-9 812–818.
- **Residual-as-class over the info-label paths (charter fix 3):** the class covers the
  request-frame info paths (info-object, wh-complement, object-less, coordinated); the
  **non-request-frame** path (AD-9 769) is the one it excludes via "in-frame" → **R9-M1**.
- **`deny_bypass_suspect` receptacle coherence (charter fix 4):** Read of AD-9 1018–1041
  and AD-4 505–537 — the target path is written to the `kind='deny'` `evidence_json`
  (a real column), redacted per AD-19 (coherent — path enters the store, is a
  name/pointer), and read back by the correlation; `Edit`/`Write` `file_path` +
  `NotebookEdit` `notebook_path` cover the whole deny-eligible set (AD-9 895); both
  error directions disclosed (AD-9 1036–1040). Coherent; **R8-m1 resolved.**
- **External premises (this session, WebFetch + Context7 `/websites/code_claude`):**
  Edit/Write `tool_input.file_path` (PostToolUse Write payload); NotebookEdit
  `tool_input.notebook_path` (Agent-SDK schema); `PreToolUse` deny "blocks the tool"
  and PostToolUse "Fires after a tool executes successfully" (so a denied Edit fires no
  PostToolUse — V19) — all confirmed. The round-8 fixes introduce no new external
  premise.
- **§8 deny-confinement re-walk on the round-8 text:** the round-8 diff touches the
  classifier rules (AD-9 clause iv), the residual disclosure (AD-9/L1/AC-24), a schema
  comment (AD-4), the `deny_bypass_suspect` predicate (AD-9/AD-4), and L3 only; AD-10's
  single-producer confinement, the `kind='info'`+mutating-file deny-eligibility
  predicate (AD-9 889–895), reactive-only, text-never-denied (AD-9 946–947),
  self-clearing/no-counter, and the lag clause's clear-axis-only scope (949–958) are
  textually untouched and re-read consistent. R9-S1/R9-M1/R9-m1 are
  classification-determinacy / disclosure-completeness / match-specification defects;
  none creates a deny producer.
- **Owner-constraint scan on the round-8 additions:** `OL-C1` — the head/coordinated
  rules, the class generalization, the receptacle, and the L3 disclosure are
  classification/disclosure/bookkeeping; no volume/count/budget cap. `OL-R5` — clause
  (iv) remains a positive classification. `FR-B3`/`OL-R4`/`OL-7` — no new deny producer,
  no generated-file consumption, no credentials, no pre-emptive gate. Clean.
- **Citation hand-check on round-8-introduced/moved citations:** "redacted per AD-19"
  (AD-9 1030) → AD-19 1526–1527 covers strings entering a store, coherent; "AD-9"
  cross-ref in AD-4's comment (528–534) → resolves; "V19" (AD-9 1027) → the no-PostToolUse
  premise, re-verified. `check_docs.py` validates the cross-reference surface (exit 0).

## Convergence Record

- **Round number:** 9 (eighth Post-fix round).
- **Trajectory (expert-review severity, this axis; each round's own mechanical
  breakdown):** R1: 4S/4M/5m → R2: 4S/3M/4m → R3: 0S/2M/6m → R4: 1S/1M/5m →
  R5: 1S/2M/5m → R6: 1S/1M/3m → R7: 1S/1M/1m → R8: 1S/1M/1m → **R9: 1S/1M/1m**.
  (Collapse-hunt collapse-class, for context: 5 → 6 → 1 → 1 → 0 → 0 → 0 → 0 → [round-9
  collapse-hunt running in parallel, not seen by this pass].) Total findings: R5=8,
  R6=5, R7=3, R8=3, **R9=3** — strictly decreasing through R7, then **flat** at 3 for
  three rounds running.
- **Flow counts for this round (provenance per Step 9):** prior findings closed = **3
  of 3** round-8 findings (R8-S1 at its named specifics, R8-M1 at its named object-shape
  gaps, R8-m1 fully). New/regression = 3. Of the three: **R9-S1 = regression** (the
  round-8 "rightmost noun" rule broke the previously-consistent "answer the question in
  the ticket → info" row, which round-7's "head noun" rule classified correctly);
  **R9-M1 = new** (the frame-axis class hole, not previously reported; it falsifies a
  round-8-introduced completeness claim); **R9-m1 = new** (the lexicon-match morphology
  gap, exposed by the round-8 exact-token re-pin).
- **Tripwire evaluation (arithmetic shown):**
  - Condition (a) — *new + regression ≥ closed for two consecutive Post-fix rounds*:
    this round new+regression = 3, closed = 3 → 3 ≥ 3 → **met this round**. Round 8:
    new+regression = 3, closed = 9 → 3 ≥ 9 → **not met**. Not two consecutive.
    **Condition (a): NOT FIRED.**
  - Condition (b) — *total findings not strictly decreasing for two consecutive Post-fix
    rounds*: R7 total = 3, R8 total = 3 (**not** a strict decrease — non-decrease #1);
    R8 total = 3, R9 total = 3 (**not** a strict decrease — non-decrease #2). Two
    consecutive non-decreases. **Condition (b): FIRED.** (The round-8 review armed it
    explicitly: "if R9's total is not strictly below 3, condition (b) fires." R9 = 3.)
  - **Tripwire: FIRED (condition b).** The blast radius is still narrow (all three
    findings are inside one classifier's rules/disclosure and one under-specified match
    step; none reaches the deny confinement, the owner constraints, or the phase
    boundary), but the finding count has stopped falling for two rounds and the
    component keeps failing a new way each round — and round 8's explicit "specify it
    completely, once" meta-fix did not stop it (it caused R9-S1 and left R9-M1's axis
    open). This is the field-documented signature the tripwire exists to name: rework
    producing findings as fast as it closes them in one locus.

## Recommended Priority

**The tripwire has fired, so the indicated path is foundational rework of the
answer-drift classifier's specification approach — not a fourth patch round.** Per the
skill's Gate-8 discipline: re-read the source, re-derive the approach, do not carry the
failed attempt forward.

The foundational problem is a mismatch with the spec, verifiable in the spec's own
words. Spec `D-41` and §11.5 define the Phase-A answer-drift recognizer as "a
**conservative deterministic recognizer** ... **safe, low-coverage: a skeleton, not
the working block**," with the OL-C5-serving precision explicitly deferred to Phase B
(the model-maintained state). The architecture, across rounds 6–9, has instead
specified this classifier as a **total, complete, determinate** model-free NLP engine:
it asserts "classifies, positively, every opened row" (AD-9 764), "three member shapes"
/ "complete as a class, however the info label arose" (AD-9 916/935, L1 2164), and "no
inline architectural calls" (Gate-A, line 1929). Natural-language head extraction, verb
coordination, frame detection, and lexicon morphology are inherently comprehension
judgments (the very reason the spec routes precision to Phase B), so each round a new
construction falsifies one of those claims — R9-S1 (PP head), R9-M1 (frame), R9-m1
(morphology) this round; R6/R7/R8 the ones before. Patching the next construction will
produce the next round's finding in the same locus.

The foundational rework, re-derived from `D-41`/§11.5:
1. **Demote the classifier's claims to the spec's skeleton framing.** Replace the
   totality/completeness/determinacy assertions (AD-9 764, 916, 935; L1 2164; the
   Gate-A "no inline architectural calls" for this classifier) with the spec's own
   posture: the Phase-A classifier is a **conservative, low-coverage skeleton** whose
   only guarantee is **safety** (it never wrongfully denies in the direction that
   matters, and every miss is Max-visible or Phase-B-caught), explicitly **not** total
   or correct over the input domain. Its parse steps (head extraction incl. PP handling,
   coordination, morphology) are **acknowledged inline judgments**, Phase-A-conservative
   and Phase-B-precise — stated as such, so the Gate-A attestation is true because it
   *discloses* the inline judgments rather than denying they exist.
2. **Own the wrongful-deny residual as one open class by its single property** — "any
   ask that classifies `info` and whose fulfilment or a co-asked action is a repo
   mutation, however the `info` label arose (request-frame or non-request-frame)" —
   dropping "in-frame," "three member shapes," and every construction-specific
   sub-shape, so no future construction can fall outside it (this closes R9-M1 and ends
   the P1 lineage structurally rather than by enumeration).
3. **Make the labeled corpus illustrative of the conservative posture, not a totality
   oracle** — and re-derive **every** row from the final parse rules once (this closes
   R9-S1 by reconciling the "ticket" row, and R9-m1 by stating the match semantics),
   with the corpus pinning representative safe/unsafe directions rather than asserting a
   correct label for every construction.

If, after that reframing, specific rows still need fixing, they are:
1. **R9-S1** — reconcile the "answer the question in the ticket" row with a head rule
   that excludes post-modifying PPs (core head "question" → `info`), and re-derive the
   corpus.
2. **R9-M1** — drop "in-frame" from member (3) and add the non-request-frame corpus row.
3. **R9-m1** — state the lexicon-match semantics (morphology + class-membership) and add
   the plural recourse-re-arm row.

Recommending another isolated patch round over the fired tripwire is exactly the churn
the tripwire names; the reframing above is what stops the classifier from failing a new
way in round 10.

---

*Round-9 expert review, 2026-09-03. **Not the terminal round, and the first with the
non-convergence tripwire fired.** R9-S1 is a real Serious — the round-8 "rightmost
noun" head rule contradicts its own retained corpus row "answer the question in the
ticket → info" (rightmost noun "ticket", unlisted → request; only the NP head
"question" is on the info-lexicon), a fix-induced regression that falsifies the round-8
"corpus re-derived from the rules, no row contradicts the rule" claim. R9-M1 (the class
scoped "in-frame" while claiming "however the info label arose," missing the
non-request-frame info interrogative whose answer is a mutation) and R9-m1 (the
lexicon-match morphology gap disarming the plural `OL-C3` recourse re-ask) are the same
answer-drift classifier failing two more ways. All three are single-mechanism fixes and
the blast radius stayed narrow (one classifier's rules, its residual disclosure, and its
match step); the deny confinement, the owner's locked constraints, and the phase
boundary all held, and all three round-8 findings closed at their named sites — R8-m1's
receptacle cleanly, premises and all. But the finding count has plateaued for two rounds
(8 → 5 → 3 → 3 → 3), the component has now failed a new way four rounds running, and
round 8's explicit "specify it completely, once" meta-fix introduced R9-S1 and left
R9-M1's axis open — so condition (b) of the tripwire fires, and the convergence bar ("a
round that finds nothing real") is unmet. **Inheritance for round 10 (foundational, not
a patch list):** the answer-drift classifier is specified beyond what `D-41`/§11.5 ask
of a Phase-A skeleton — re-derive it from the spec's conservative-low-coverage-skeleton
mandate: (1) demote the totality/completeness/determinacy claims (AD-9 764, 916, 935;
Gate-A 1929) to the skeleton's safety-only guarantee, disclosing its parse steps as
Phase-A-conservative inline judgments rather than denying they exist; (2) own the
wrongful-deny residual as one open class by its single property (info-classified +
fulfilment/co-ask is a mutation, any frame), dropping "in-frame"/"three shapes"; (3)
make the corpus illustrative and re-derive every row from the final rules once,
reconciling the "ticket" row and stating the lexicon-match semantics. A round-10 pass
that patches R9-S1/M1/m1 individually without the reframing will, on this series'
evidence, surface the next construction's failure in the same locus.*

Verdict: NEEDS FIXES (3 findings: 1 Serious, 1 Moderate, 1 Minor)
