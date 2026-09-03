# Round-10 expert review — Phase A architecture (round-9 reframe verification + new-defect hunt)

**Artifact:** `docs/architecture-phase-a.md` at current HEAD, commit `4eaa0eb`
("arch: apply round-9 findings — reframe classifier to the spec's conservative
skeleton"), read against the round-9-reviewed draft with
`git show 4eaa0eb -- middleware/context-oracle/docs/architecture-phase-a.md`.
**Reviewer:** independent session, not the author of the document or of any prior
review. Read in full before the attack: `middleware/context-oracle/CLAUDE.md`,
`OWNER-LEDGER.md` (CONFIRMED only), `docs/specs/spec-context-oracle.md`
(especially `D-41`, §8 FR-B1/B2/B3/B5, §11.5, §14 AC-2a/AC-2a-ii/AC-8/AC-8a/AC-24),
`docs/collapse-log.md` (the four 2026-09-03 entries first — rounds 6/7/8/9 lessons —
then 2026-08-29, then the rest), both round-9 review files, the architecture end
to end, and the round-9 apply diff.
**Axis (round-10 charter):** premises and engineering standards — correctness,
completeness, verification-actually-performed (not asserted), standards-conformance,
citation integrity, internal consistency. The round-9 **foundational reframe**
(commit `4eaa0eb`) is the primary attack surface, attacked **as author text**
(collapse-log 2026-08-29 Lesson 1: a reviewer's repair prescription — here the
round-9 pass's own reframe recommendation — carries no verification of its own; and
2026-09-03 round-8 Lesson 1: a component "completed as a specification" must be
re-derived from source and re-checked, not accepted as done). Every check below was
run this session; nothing is carried forward from the author's attestations or prior
rounds' claims without re-derivation. **A clean PASS was treated as a real possible
outcome; no finding was manufactured to avoid it, and none was suppressed to reach
it — the mechanical rule governs both directions.**

## Scope and Inventory

**Round number:** 10 (Post-fix review; the ninth Post-fix round of this series).

**Tool plan (instruments and claim-type mapping).**
- Literal-content / internal-consistency claims (the bulk of this review): `Read`
  at the specific file:line, this session — every finding-or-closure location was
  re-read at drafting time.
- Absence / "no rule covers this shape" / "scope word gone" claims: `Grep` across
  the full document for the mechanism's signature, then `Read` of each region
  (search locates, reading verifies). The load-bearing absence claims (`in-frame`
  removed from the live residual; `N member shapes` gone; no non-request-frame /
  no plural corpus row) were each established by a `Grep` with its result count
  **and** a `Read` of the residual and corpus regions.
- The one external premise the whole answer-drift block leans on (a `PreToolUse`
  `permissionDecision:"deny"` blocks the tool; precedence deny > defer > ask > allow;
  exit-2 routes as deny; `Write|Edit` are the file-mutating tools intercepted):
  Context7 (`/websites/code_claude`, current hooks + agent-SDK docs) this session.
  The reframe introduces **no new** external premise (it is classification logic,
  residual definition, corpus, and an escape that reuses the existing clear
  recognizer), so no instrument class was load-bearing-and-unavailable; no halt
  condition arose.
- The mechanical floor: `python3 middleware/context-oracle/tools/check_docs.py`,
  run this session (exit 0, output pasted below).

**Post-fix inventory (four sources per the skill's Step 2).**

*(1) prior review's inventory + (2) fix-diff files + (3) dependents — verified this session:*
- [x] `docs/architecture-phase-a.md` — **Read** across the reframed classifier and
  its dependents: AD-9 clause (iv) intake + base-NP head + inflection (749–852);
  the deny decision + property-residual (900–957); the lag-hold, Stop-backstop,
  deny-loop, session-boundary, Phase-B seam (959–1090); AD-10 deny confinement
  (1119–1140); AD-11 reader (1142–1190); AD-24 unit corpus (1721–1729) and
  answer-drift fixture cases (1774–1833); L1 residual mirror (2148–2195); L3
  (2201–2214); L11 (2274–2293); the standards + Status round-9 recap (2294–2553).
  Every cited region re-read at drafting time.
- [x] `docs/specs/spec-context-oracle.md` — **Read** at §8 FR-B1/B2/B3/B5 (355–500),
  D-38/D-39/D-41 (838–863), §11.5 build order (739–767), §14 AC-2/AC-2a/AC-2a-i/
  AC-2a-ii/AC-2c (923–990), AC-8/AC-8a (1008–1025), AC-24 (1096–1104), and the
  Phase-B/C acceptance split (1113–1121).
- [x] `OWNER-LEDGER.md` — **Read in full** (OL-C1, OL-C2, OL-C3, OL-C5, OL-6,
  OL-11, OL-R4, OL-R5 re-read at use).
- [x] `middleware/context-oracle/CLAUDE.md` — **Read in full** (the two dominating
  rules; verify-before-assert; apply-*all*-findings; Expert Standard).
- [x] `docs/collapse-log.md` — **Read** the four 2026-09-03 entries in full
  (rounds 6/7/8/9 lessons; the round-9 "demote the over-claim" lesson) plus the
  2026-08-29 series entry.
- [x] `docs/reviews/2026-09-03-round-9-expert-review-architecture-phase-a.md` —
  **Read in full** (closure items R9-S1, R9-M1, R9-m1; the reframe recommendation).
- [x] `docs/reviews/2026-09-03-round-9-collapse-hunt-architecture-phase-a.md` —
  **Read in full** (closure items P1, N1–N3; the "pin the malign representative"
  prescription hand-checked against the applied corpus).
- [x] `middleware/context-oracle/tools/check_docs.py` — **Grep-verified** by
  execution (exit 0, output below).
- [x] `code.claude.com` hooks + agent-SDK docs (the `PreToolUse` deny premise) —
  **Grep-verified** via Context7 this session (excerpts below).

*(4) prior findings as closure items:* the round-9 resolution table below re-derives
each round-9 finding (R9-S1, R9-M1, R9-m1; and the parallel collapse-hunt P1, N1–N3
that the reframe's commit message also claims to close) from current source this
session — closed only when the finding's **originally named standard** is satisfied.

No new in-scope file surfaced mid-pass. AD-24's named build-time verifications
(marker presence on the owner's real transcript; whether platform-injected turns fire
`UserPromptSubmit`) remain out of this container's reach and are correctly disclosed
as build-time (L11) — not scored as review gaps. No rigor was waived.

## VERDICT: PASS

Zero findings of any severity (0 Critical / 0 Serious / 0 Systemic / 0 Moderate /
0 Minor). The round-9 foundational reframe holds under attack on every load-bearing
claim it makes, closes all three round-9 expert findings (and the collapse-hunt's P1)
at their originally named standards, introduces no new inconsistency, drops no spec
requirement, and leaves the labeled corpus falsifiable. The finding-count plateau that
fired the tripwire in round 9 (3 → 3 → 3) is **broken this round (3 → 0)**; the
tripwire does not fire. Round 10 is **terminal — the series has converged.**

## Summary

This review returns **PASS.** The round-9 reframe is the rare fix that actually reaches
the root instead of the last symptom. Four rounds (R6–R9) each found the answer-drift
classifier incomplete a new way because the document specified a model-free recognizer
as a *total, correct, determinate* NLP engine — a posture `D-41`/§11.5 reserve for
Phase B. Round 9 demoted that posture to the spec's own conservative-low-coverage
skeleton, and the demotion does real work, not cosmetic relabeling: (1) the object-head
rule now excludes post-head PP/relative modifiers and works on the **base NP** ("the
question in the ticket" → "question"), which reconciles the exact corpus row R9-S1
falsified *and* simultaneously closes both directions of the collapse-hunt's N1; (2)
head-match now folds inflection, so the plural `OL-C3` re-ask "answer my questions?"
resolves to "question" → `info` and the recourse survives (R9-m1's load-bearing half);
(3) the wrongful-deny residual is re-expressed as **one open class defined by a
property** — an `info`-classified row coexisting in the turn with a repo mutation that
legitimately serves intent — which is genuinely frame-independent (the word "in-frame"
is gone from the live text) and therefore covers the non-request-frame case R9-M1/P1
found stranded; (4) the escape is widened to "answer **or state a plan** first," which
is exactly what makes the build-fulfilled and answer-prerequisite cases escapable.
The load-bearing new claim — "a mis-parse is safe by construction" — holds: the
classification dichotomy (under-enforced `request` side, or `info` → the property
residual) is exhaustive, and every residual deny is escapable by a substantive text
turn that is never itself denied. The demotion drops no acceptance criterion, because
the classifier's *precision* was never a Phase-A criterion (AC-2a is fixture-controlled;
AC-2a-ii is explicitly Phase B), and "coverage measured at exit" is what §11.5 asks
for in its own words. The blast radius stayed inside one classifier; the deny
confinement (AD-10), the owner's locked constraints, and the phase boundary are
untouched and re-read consistent. `check_docs.py` passes. Nothing real was found.

## Upstream Contract Verification (Step 7)

Each governing spec/ledger item the reframe touches, checked honored/violated against
the verified current text this session:

- **Spec `D-41` / §11.5 — Phase A ships a "conservative deterministic recognizer …
  safe, low-coverage: a skeleton, not the working block"; the OL-C5-serving precision
  is Phase B; Phase A "Exits by producing measured … data … including how little the
  conservative recognizer catches"** — **NOW HONORED** (this is the reframe's whole
  point, and it lands). The classifier is described as "a **conservative best-effort
  classification** … a model-free recognizer, not an exact parser: it labels every row
  but does not assert the label is always correct" (AD-9 764–766), head extraction as
  "a **conservative model-free heuristic, not an exact parse**" (786–787), and coverage
  as "*measured at exit*, never asserted complete" (771–772) — verbatim the spec's
  posture. The round-9 review's own Upstream-Contract row scored this **VIOLATED by
  over-reach** at AD-9 764/916/935 and Gate-A 1929; re-read this session, the totality
  assertion at 764 is gone (replaced by best-effort), the "three member shapes" /
  "complete as a class however the info label arose" enumeration is gone (replaced by
  the property class), and the Status/round-9 recap explicitly frames the classifier
  as the skeleton. Verified: AD-9 764–772, 786–789; L1 2173–2195; §11.5 741–753 read
  at source.
- **`OL-C3` / `OL-C5` (answer-drift block; protected answer-directed class, `D-39`)**
  — **honored**. The trigger is OL-C5's wording (`D-39` unchanged); the two edges the
  round-9 pass found disarming the recourse are both closed: "answer the question in
  the ticket" now resolves to `info` under the base-NP rule (R9-S1), and the plural
  "answer my questions?" resolves to `info` under inflection folding (R9-m1). The
  categorical over-enforcement against an OL-C5-protected edit while an `info` question
  is open is now honestly owned as the property residual (frame-independent), and every
  such deny is escapable by "answering — or stating a plan — first." Verified: AD-9
  779–789, 784–785, 793–811, 926–932; the escape at 828–829, 931–932; text-never-denied
  at 946–947, 956–957.
- **`FR-B5` (per-error-direction leans) / residual completeness** — **honored; the
  completeness claim is now true.** The residual is scoped by its single property
  ("a row classified `info` coexists in the turn with a repo mutation that legitimately
  serves the user's intent"), frame-independent, so the non-request-frame info
  interrogative whose answer is a mutation ("does the null check fix it?") is a member
  by the property (the mutation "legitimately serves intent" as an OL-C5 answer-directed
  action). "Its recognizable forms are **illustrations of the property, not members to
  complete**" (AD-9 933–934) is the correct shape for a completeness claim over an open
  set (collapse-log round-8 Lesson 2). Verified: AD-9 926–946, L1 2177–2195.
- **`AC-2a` / `AC-2a-ii` / `AC-8a` (what Phase A actually pins)** — **honored; no
  requirement dropped by the demotion.** AC-2a exercises the deny **plumbing** with the
  question/answer state **fixture-controlled** — it pins no specific classification
  (spec 931–934). AC-2a-ii (multi-question / partial answer / substantive-clear) is
  **explicitly a Phase-B criterion** (spec 952–959). AC-8a's outstanding-question line
  is **best-effort**, chains two conservative recognizers, and "may **not** fire" for
  the common case (spec 1015–1025). None of these pins a specific info/request label,
  so demoting clause (iv) to best-effort drops nothing. Verified by Read of spec
  923–959, 1015–1025 this session.
- **`FR-B3` / `OL-R4` / `AC-2` (no pre-emptive gate, no generated-file block, no
  mutation, one deny producer)** — **honored**. The reframe touches clause (iv)'s rules
  (AD-9), the residual disclosure (AD-9/L1), the AC-24 corpus framing, and the escape
  wording only; AD-10's single-producer confinement, the `kind='info'`+mutating-file
  (`Write`/`Edit`/`NotebookEdit`) deny-eligibility predicate, reactive-only,
  text-never-denied, and self-clearing/no-counter are textually untouched and re-read
  consistent (AD-9 900–957, AD-10 1119–1140). No new deny producer.
- **`OL-R5` (define the trigger positively, never by exclusion)** — **honored**. Clause
  (iv) remains a positive classification; the best-effort framing describes the error
  directions of a positive rule, not a negative-space definition.
- **`OL-C1` (no arbitrary volume/count/budget cap)** — **honored**. The reframe adds
  classification/disclosure text only; the owner-fidelity re-scan of the round-9 diff
  found no volume/count/budget term.

---

## Critical & Serious Findings

**No Critical or Serious findings** — the full inventory was Read or Grep-verified per
Compliance Gate B, and no violation of Critical or Serious classification was observed.
Specifically, the round-9 R9-S1 (Serious) is closed against its originally named
standard (rule ↔ corpus internal consistency): the base-NP head rule reconciles the
"ticket" row, and **every** AC-24 corpus row re-derives consistently from the reframed
rule this session (see Checks run that came back clean). No demotion-hidden dropped
requirement exists (Upstream Contract Verification, the AC-2a/AC-2a-ii/AC-8a row).

## Systemic Patterns

**No systemic pattern** — the systemic root the round-9 review named (the classifier
"specified as a total, correct, determinate model-free NLP engine") is the exact
over-reach the reframe removed, verified by proactive scan this session:
- `Grep "classifies, positively, every opened row"` (round-9's cited totality claim,
  then line 764) → **0 hits**. Replaced by "conservative best-effort classification …
  does not assert the label is always correct" (AD-9 764–766).
- `Grep "three member\|member (3)\|member (1)\|N member\|three shapes"` → **1 hit**,
  line 2541, inside the round-9 **Status recap** describing the collapse *away from*
  the enumeration ("collapsed from a growing 'N member shapes' enumeration into one
  open class"). Zero hits in the live AD-9/L1 residual.
- `Grep "in-frame"` → **2 hits**, lines 2473 and 2508 — both inside the immutable
  round-7/round-8 **Status recaps** (accurate history of what those rounds did). Zero
  hits in the live residual definition (AD-9 926–946, L1 2177–2195), which is now
  frame-independent.
- `Grep "No inline architectural calls"` (round-9's cited determinacy claim) → **0
  hits** in the current document.
The four claims each round attacked no longer appear as live design text; the classifier
now carries the spec's skeleton posture. The pattern is closed, not relocated.

## Moderate & Minor Findings

**No Moderate or Minor findings** — verified by re-derivation of each round-9 finding's
standard against current source (resolution table below), a full re-derivation of the
AC-24 corpus from the reframed rule, and the owner-constraint / citation scans. The
three residual observations below carry **no standard violation** and are filed as
Observations, not suppressed findings — each is stated with the reason it does not rise
to a violation, so the PASS is auditable.

## Tentative Findings

No tentative findings — every candidate was verified against current source this session
(Read at the cited lines, Grep with result counts for the absence/occurrence claims,
Context7 for the `PreToolUse` deny premise, and `check_docs.py` executed). One candidate
that could have been a finding was resolved to a non-finding by reading and is recorded
in Observations (the non-request-frame corpus row): the round-9 reviews prescribed
adding it, but the reframe closed R9-M1's *named standard* (the false completeness
claim) by the property-class definition instead, and adopted a spec-grounded
illustrative-corpus posture under which exhaustive per-construction pinning is
explicitly not required — so the un-added row is a superseded prescription, not an open
standard violation (detailed in Observations with the disposition).

## Observations

*(Genuinely non-finding notes — each carries no standard violation, stated so the PASS
is auditable. None is a misfiled finding.)*

- **The prescribed non-request-frame / out-of-frame corpus row was not added, and this
  is not a violation under the reframe's own (spec-grounded) illustrative-corpus
  posture.** Both round-9 reviews prescribed adding a corpus row pinning the frame axis's
  malign representative ("does the null check fix it?" / "show me the error and fix the
  bug?"). The reframe instead closed R9-M1/P1's *named standard* — the false
  completeness claim — at the definition (frame-independent property class), and made
  the corpus "illustrative … not an independent oracle" (AD-9 1723–1726). Under that
  posture a representative malign non-request-frame case **is** pinned (the
  rhetorical-lead-in row: "ugh, why is CI always so flaky?? … please add the null check"
  → non-request-frame `info` → the edit **wrongfully denied once**, **counted on the
  wrongful-deny rate**, AC-24 1784–1790), and the "does the null check fix it?" behavior
  is fully rule-determined (non-request-frame → `info`, line 773; deny every mutation
  while `info` is open, line 909; property residual covers it, 926–932). Verified by
  Read of AC-24 1774–1812 (no plain non-request-frame own-fulfilment row present) and
  the rule/residual regions. No standard violation: the completeness standard is closed
  at the definition, and the falsifiability standard is met by the pinned rows (below).
- **The prescribed plural recourse corpus row was not added, but the rule now makes the
  behavior correct by construction.** R9-m1 asked for a "answer my questions?" fixture;
  the reframe instead added the match-level rule "the match folds simple inflection, so
  a plural or possessive form hits the same entry ('questions'/'question')" (AD-9
  784–785), which resolves the plural head to `info` and preserves the recourse without
  a fixture. The missing row is a confirmation gap, not an open standard violation.
- **The lexicon's `-class` entries ("status-class", "PR-class") are category shorthand,
  resolved at config-seeding, not literal match targets.** R9-m1's secondary note flagged
  that "match the head against the lexicon" is under-specified for these. Re-read this
  session: the lexicons are "closed, config-enumerated in `tuning`, tended via
  `ctxoracle tune`" (AD-9 793–794), so an implementer seeds the concrete category members
  (status, state, …) as rows and matches head-vs-member with inflection folding; the
  `-class` token is a doc category name, never matched literally. The `PR-class` entry is
  additionally **inert in Phase A** (the unlisted-object default also yields `request`,
  AD-9 812–816), and the `status-class` failure direction is under-enforcement (safe).
  Buildable via the stated `tune` mechanism; a clarity nicety at most, no standard
  violation.
- **Procedural (tool availability).** The skill's mandatory pre-delivery
  multi-perspective check (`collaborativereasoning`) has no Clear Thought MCP tool in
  this environment. Per the skill's documented-infrastructure-failure fallback, the
  three personas were run manually before delivery: the project's standards discipline
  (the PASS rests on actually-run checks this session — Read at cited lines, Grep with
  result counts, Context7 on the deny premise, `check_docs.py` executed — not on
  assertion, and each of the three round-9 standards was re-derived closed); the
  downstream consumer (verdict unambiguous — PASS, terminal, proceed to approval and the
  Phase A plan; optional corpus rows flagged as implementation-time niceties, not
  blockers); and the implementer (no findings to fix; the Observations state exactly what
  is optional versus already guaranteed by the rules). No persona-unique gap survived
  into this delivery. The tool failure is recorded here as the skill requires.

## What's Actually Good

- **The base-NP head rule is one edit that closes two opposite-direction findings at
  once.** Judged against internal consistency and premise-correctness: replacing
  round-8's "rightmost noun of that phrase" with "rightmost noun of the **base** noun
  phrase … any **post-head modifier** (a prepositional phrase or relative clause) is set
  aside" (AD-9 779–782) reconciles the R9-S1 row ("the question in the ticket" → base
  "the question" → head "question" → `info`, consistent with the corpus) **and** closes
  both directions of the collapse-hunt's N1 in the same stroke — the over-match ("show me
  the file with the error?" → base "the file" → "file", not "error") and the
  under-match/recourse-defeat ("answer my question about the parser?" → base "my
  question" → "question" → `info`, recourse preserved). Verified by re-deriving all three
  against the rule and against AC-24 1786–1808 this session. A single mechanism, not a
  per-construction patch — which is exactly what the tripwire demanded.
- **The residual-as-property is genuinely complete, and provably so, because the
  soundness rests on the honest cost universal, not on the enumeration.** Judged against
  the collapse-log round-8 Lesson 2 ("a completeness claim over an open set must be a
  class predicate, never a list"): the true complete cost statement is the universal at
  AD-9 909 ("it denies **every** repo mutation while a deny-capable `info` question is
  open … the accepted cost of a model-free recognizer"); the property residual (926–932)
  is that universal's *characterization*, and because it is scoped by the single property
  "info-classified + coexisting legitimate mutation," any new phrasing, head mis-route,
  or frame is the same class, not a missing member (933–946). I attacked it with the
  hardest case — a non-request-frame question whose answer requires a prerequisite Edit
  (an OL-C5-protected move) — and it is covered by the property (the Edit "legitimately
  serves the user's intent") and escapable by the widened "state a plan first" clause.
  Verified by Read of AD-9 909, 926–946 and the clear recognizer at 885–896 (a plan is
  substantive non-deferral text → clears all-prior; a text turn is never denied).
- **The demotion is faithful to the spec, verifiable in the spec's own words.** Judged
  against `D-41`/§11.5 read at source this session: the spec asks Phase A for "a
  conservative deterministic recognizer … safe, low-coverage: a skeleton, not the working
  block" (§11.5 744–749) and for an exit that measures "how little the conservative
  recognizer catches" (751–753); the reframe's "coverage is *measured at exit*, never
  asserted complete" (AD-9 771–772) is that requirement restated, not a weakening of it.
  The precision the demotion declines to assert is the precision the spec routes to
  Phase B (AC-2a-ii, D-41). No dropped requirement.

## Round-9 finding resolution table

"Resolved" = the finding's **originally named standard** is satisfied in `4eaa0eb` at
the location the finding named, swept, with no surviving contradicting copy. Each row
re-derived from current source this session. (ER = round-9 expert review; CH = round-9
collapse-hunt.)

| Round-9 finding | Status in `4eaa0eb` | Where / how verified this session |
|---|---|---|
| ER R9-S1 (Serious — "rightmost noun" rule contradicts the retained "answer the question in the ticket → info" corpus row) | **Resolved** | Base-NP rule with post-head PP/relative set aside (AD-9 779–782): "the question in the ticket" → "question" → `info`, consistent with AC-24 1805–1808. **Every** AC-24 row re-derived from the rule with no contradiction (Checks section). Standard (rule↔corpus consistency) satisfied. |
| ER R9-M1 (Moderate — residual scoped "in-frame" excludes the non-request-frame info-interrogative-with-mutation case) | **Resolved** | Residual is now "**one open class, defined by a property**" (AD-9 926–932; L1 2177–2195), frame-independent; `Grep "in-frame"` → 0 hits in the live residual (only historical Status recaps). "Does the null check fix it?" is a member by the property. Standard (completeness over an open set) satisfied. |
| ER R9-m1 (Minor — lexicon match step under-specified; plural recourse re-ask disarmed) | **Resolved (core); secondary `-class` note is config-shorthand)** | Inflection folding stated (AD-9 784–785): plural "questions" → "question" → `info`, recourse preserved. The `-class` category-shorthand residue is buildable via the stated `tune`/config mechanism with a safe (under-enforcement) failure direction (Observations). Standard (match-step specified for the recourse-preserving direction) satisfied. |
| CH P1 (Partial — the "in-frame" scope word strands the non-request-frame branch, incl. the class's own two out-of-frame examples) | **Resolved** | Same fix as R9-M1: "in-frame" removed, property class frame-independent; the residual's own illustrations ("answer whether the null check fixes it"; "show me the error and fix the bug") are now inside the property (AD-9 940–943). Verified by Read of AD-9 926–946 and L1 2177–2195. |
| CH N1 (Note — "rightmost noun = head" wrong for post-head PP/relative modifiers, both directions) | **Resolved** | Closed by the base-NP rule with post-head modifiers set aside (AD-9 779–782); both directions re-derived clean (What's Actually Good). |
| CH N2 (Note — "version number → request" reduces OL-C3 coverage; a mission-axis trade) | **Not a round-10 target (mission axis)** | The "version → info / version number → request" pair is internally consistent with the rule (AC-24 1798–1802); whether the FR-B5-safe under-enforcement is the right owner call is a mission-fidelity choice for the parallel collapse-hunt, not this premises/standards axis. |
| CH N3 (Note — coordinated action-then-report escape understated; should read "answer or state a plan first") | **Resolved** | Escape widened to "escapable by answering — or plan-stating — first" (AD-9 828–829) and "answer — or stating a plan — first" (931–932; L1 2181–2182). Verified by Read. |

## Checks run that came back clean

- **Mechanical floor:** `python3 middleware/context-oracle/tools/check_docs.py` →
  `context-oracle doc-consistency check passed.` (exit 0) on the current tree, this
  session.
- **AC-24 corpus re-derivation from the reframed rule (charter check — is the corpus
  still a consistent oracle):** every answer-drift corpus row Read (AC-24 1774–1812) and
  re-derived from clause (iv). Consistent, no contradiction: "rename the helper? →
  request" (non-communicative verb); "show me a demo? → request" (head "demo",
  artifact/unlisted); "show me the error? → info" (head "error", info-lexicon);
  "summarize the error? → request" ("summarize" not on the communicative lexicon);
  "show me a prototype? → request" (head "prototype", unlisted); "tell me why the login
  test fails? → info" (wh-complement precedence); "confirm the version? → info" (head
  "version") **beside** "confirm the version number? → request" (head "number", unlisted
  — flat compound, rightmost = head); "explain? → info" (object-less communicative);
  **"answer the question in the ticket? → info"** (base NP "the question", post-head PP
  set aside → head "question" — **the R9-S1 row, now consistent**); "answer my question
  and fix the bug? → info" (coordinated; "answer"'s object "my question" → "question").
  **All rows derivable; no row contradicts the rule** (the R9-S1 defect class is gone).
- **"Safe by construction" exhaustiveness (the load-bearing new claim):** the
  classification outcome of any mis-parse is `request` (under-enforced — FR-B5-safe) or
  `info`; an `info` row denies a mutation only when one is attempted, and any denied
  mutation that legitimately serves intent is in the property residual (AD-9 926–932),
  escapable by a substantive text/plan turn that is never itself denied (946–947,
  885–896). No third, unsafe landing zone exists — verified by Read and by the
  adversarial cases (compound, PP, possessive, coordination, non-request-frame
  prerequisite-Edit) each traced to `request`-safe or owned-residual this session.
- **Residual frame-independence:** `Grep "in-frame"` → lines 2473, 2508 only (both
  Status recaps of rounds 7/8 — accurate history); `Grep "member (3)\|three member\|
  N member"` → line 2541 only (Status round-9 recap of the collapse *away from*
  enumeration). The live residual (AD-9 926–946, L1 2177–2195) is property-scoped and
  frame-independent. Read confirms.
- **Deny confinement re-walk on the round-9 text:** the reframe touches clause (iv)
  rules, the residual disclosure, the corpus framing, and the escape wording; AD-10's
  single producer (`blocks/verdict.ts` ← `blocks/answer_drift.ts`), the `kind='info'`
  + `Write`/`Edit`/`NotebookEdit` deny-eligibility predicate, reactive-only,
  text-never-denied, self-clearing/no-counter, and the lag-clause clear-axis-only scope
  are textually untouched and re-read consistent (AD-9 900–957, AD-10 1119–1140). No new
  deny producer.
- **External premise (this session, Context7 `/websites/code_claude`):** a `PreToolUse`
  hook returns `hookSpecificOutput.permissionDecision:"deny"` + `permissionDecisionReason`
  to block the tool; precedence deny > defer > ask > allow; exit code 2 routes as deny;
  the agent-SDK example intercepts file modifications with `matcher:"Write|Edit"` and a
  `.env` deny "blocks the operation." Confirms V2 and the mutating-file-tool premise the
  block rests on, current as of 2026-09-03. The reframe introduces no new external
  premise.
- **Citation hand-check on the round-9-introduced/moved citations:** `D-41` and §11.5
  (the skeleton / measured-at-exit framing) Read at spec 852–863 and 739–767 — they say
  precisely what the reframe cites them for ("conservative … safe, low-coverage: a
  skeleton, not the working block"; exit measures "how little the conservative recognizer
  catches"). `FR-B5`, `OL-C3`, `D-39`, `AD-15`, `L3` cross-refs resolve;
  `check_docs.py` validates the cross-reference surface (exit 0).
- **Owner-constraint scan on the round-9 additions:** `OL-C1` — no volume/count/budget
  term added; `OL-R5` — clause (iv) remains a positive classification;
  `FR-B3`/`OL-R4`/`OL-7` — no new deny producer, no generated-file consumption, no
  credentials, no pre-emptive gate. Clean.

## Convergence Record

- **Round number:** 10 (ninth Post-fix round).
- **Trajectory (expert-review severity, this axis; each round's own mechanical
  breakdown):** R1: 4S/4M/5m (13) → R2: 4S/3M/4m (11) → R3: 0S/2M/6m (8) →
  R4: 1S/1M/5m (7) → R5: 1S/2M/5m (8) → R6: 1S/1M/3m (5) → R7: 1S/1M/1m (3) →
  R8: 1S/1M/1m (3) → R9: 1S/1M/1m (3) → **R10: 0/0/0 (0)**. Total findings:
  13 → 11 → 8 → 7 → 8 → 5 → 3 → 3 → 3 → **0**. The three-round plateau at 3 (R7→R8→R9)
  that fired the tripwire in round 9 is broken by a strict drop to 0.
- **Flow counts for this round (provenance per Step 9):** prior findings closed = **3
  of 3** ER findings (R9-S1, R9-M1, R9-m1) at their originally named standards, plus the
  collapse-hunt P1 and N1/N3 the reframe also addressed; **new = 0; regression = 0.**
- **Tripwire evaluation (arithmetic shown):**
  - Condition (a) — *new + regression ≥ closed for two consecutive Post-fix rounds*:
    this round new+regression = 0, closed = 3 → 0 ≥ 3 is **false**. **NOT FIRED.**
  - Condition (b) — *total findings not strictly decreasing for two consecutive Post-fix
    rounds*: R9 total = 3, R10 total = 0 → 0 < 3 is a **strict decrease**, so this round
    is a decrease, not a non-decrease. The round-9 non-decrease streak (R7=3, R8=3, R9=3)
    is broken. **NOT FIRED.**
  - **Tripwire: NOT FIRED.** The foundational reframe that round 9's fired tripwire
    correctly routed to did its job: the finding count collapsed from a three-round
    plateau to zero, and the component that failed a new way four rounds running failed in
    no way this round. This is the designed exit from a fired tripwire — foundational
    rework followed by a clean round — not acceptance-by-exhaustion (the verdict is PASS
    because each claim was attacked and verified sound, not because the cycle is long).

## Recommended Priority

**Nothing to fix.** The verdict is PASS at zero findings; there is no remediation to
prioritize. The three Observations are non-violations recorded for auditability, and the
one action they might invite — adding the non-request-frame and plural corpus rows for
extra coverage — is explicitly **optional** under the reframe's spec-grounded
illustrative-corpus posture and is **not** required to satisfy any standard or
acceptance criterion. It would be a nicety for a future implementer, not a fix; if the
owner or the Phase-A plan wants the frame axis and the plural recourse demonstrated in
the fixtures as well as guaranteed by the rules, those two rows can be added during
implementation without reopening the architecture.

The indicated next action for this document is the one its own Status names: **approval
and the Phase A implementation plan.** This review clears the premises/standards axis to
proceed.

---

*Round-10 expert review, 2026-09-03. **This is the terminal round on the
premises/standards axis — the series has converged.** The round-9 foundational reframe
was attacked as author text on every load-bearing claim it makes: "a mis-parse is safe
by construction" (holds — the classification dichotomy is exhaustive and every residual
deny is escapable by a text/plan turn never itself denied); "the one-class residual is
complete" (holds — property-scoped, frame-independent, "in-frame" gone from the live
text, the non-request-frame case R9-M1/P1 stranded is now a member); "the demotion
dropped no requirement" (holds — the classifier's precision was always AC-2a-ii/Phase B,
AC-2a is fixture-controlled, AC-8a is best-effort, and "coverage measured at exit" is
§11.5's own words); and "the illustrative corpus is still testable" (holds — the corpus
is derived-from-the-rule so no row contradicts it, R9-S1's defect class is gone, and the
rows remain falsifiable input→label pins against the implementation — it did **not**
become a test that cannot fail). All three round-9 expert findings and the collapse-hunt
P1/N1/N3 close at their originally named standards; the base-NP head rule closes R9-S1
and both directions of N1 in one edit; the deny confinement, the owner's locked
constraints, and the phase boundary held; `check_docs.py` passes (exit 0); the one
external premise the block rests on was re-confirmed current this session. The
finding-count plateau (3 → 3 → 3) that fired the tripwire in round 9 is broken (→ 0), the
tripwire does not fire, and no finding — of any severity — was found to manufacture or
to suppress. **Round 11 is not required:** with a zero-finding round on this axis, the
convergence definition ("a round that finds nothing real") is met. Should the parallel
round-10 collapse-hunt surface a live mission-axis collapse, that pass — not this one —
carries the inheritance; on this axis the document is ready for approval and the Phase A
plan.*

Verdict: PASS
