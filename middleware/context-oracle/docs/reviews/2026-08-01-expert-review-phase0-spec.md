# Expert Review — Phase 0 spec (`docs/specs/spec-context-oracle-phase0.md`)

**Date**: 2026-08-01 · **Round**: 1 (first expert-review of this artifact)
**Artifact pinned at commit**: `3edc61f` (`context-oracle: restore two requirements I
wrongly deleted; give the mission its first test`, 2026-08-01 17:27:50 +0000), 459 lines.
**Reviewer**: independent; did not author the document.

> **The artifact changed twice during this review.** The spec was committed at
> 17:10:07 (`35c70cd`), 17:26:43 (`64c6249`) and 17:27:50 (`3edc61f`) while the
> pass was running. Every finding below was re-derived against `3edc61f` after
> the last commit landed; findings that the intervening commits resolved were
> dropped and are credited in *What's Actually Good*. Because a review is the
> closure baseline for the next round, this review is pinned to `3edc61f` and
> should be closed against that text, not against a later one.

---

## Scope and Inventory

### Inventory (Step 2 — spec review: the spec, plus every standard / library / API it names, plus the upstream contracts named in the dispatch)

- [x] `middleware/context-oracle/docs/specs/spec-context-oracle-phase0.md` — **Read in
  full**, twice: pre-`3edc61f` (412 lines) and at `3edc61f` (459 lines, all lines).
- [x] `middleware/context-oracle/RETHINK.md` — **Read in full** (399 lines), plus
  targeted re-Reads at the drafting of each citation finding: `58–61`, `105–108`,
  `129–135`, `183–200`.
- [x] `middleware/context-oracle/docs/specs/spec-context-oracle.md` — **Read in full**
  (1,100 lines, two pages). In scope: the Phase 0 spec's §1 declares a precedence and
  identifier relationship to it, which is a claim requiring verification.
- [x] `middleware/context-oracle/CLAUDE.md` — full contents in session context (325
  lines); **Grep-verified** for `FR-M3|FR-A2|twelve|FR-O4a` → 2 hits in CLAUDE.md
  (L19, L301), 6 in the collapse log.
- [x] `middleware/context-oracle/docs/collapse-log.md` — **Read in full** (511 lines).
- [x] **Claude Code hooks documentation** (`code.claude.com/docs/en/hooks`) — Context7
  `/websites/code_claude`, 2 queries (lifecycle/StopFailure/`stop_hook_active`;
  `PreToolUse` output schema), 2026-08-01. Primary source additionally downloaded raw
  (242,078 bytes) and **Read** at `823–867`, `1544–1573`, `2192–2271`, and line `343`,
  `2693`; **Grep-verified** for `stop_hook_active` (5 hits), `consecutive|continuation`
  (3 hits), `HookSpecificOutput` (0 hits, case-sensitive).
- [x] **Claude Agent SDK TypeScript reference** (`code.claude.com/docs/en/agent-sdk/typescript`)
  — downloaded raw (265,150 bytes); **Grep-verified** for `PreToolUseHookSpecificOutput`
  (0 hits) and `HookSpecificOutput` (0 hits).
- [x] **Zimmermann, Weißgerber, Diehl & Zeller, "Mining Version Histories to Guide
  Software Changes," IEEE TSE 31(6), 2005** — PDF fetched from
  `thomas-zimmermann.com/publications/files/zimmermann-tse-2005.pdf`, 17 pages (confirms
  the TSE version, pp. 429–445, not the 10-page ICSE 2004 paper), text extracted
  (68,681 chars); all eight quoted fragments plus the one unquoted numeric claim
  string-matched against the extraction.

**Deliberately out of scope**: `docs/STATUS.md`, `docs/architecture-context-oracle.md`,
and `docs/reviews/*`. None is named by the spec or by the dispatch as an upstream
contract. The prior collapse-hunts on this document's drafts were not read, so that no
claim of theirs could be imported by reference; this pass derives its findings from
source only.

### Step 3 — tool plan

| Claim type in this review | Instrument | Available |
|---|---|---|
| Literal-content (spec text, RETHINK line ranges, v1 spec text) | Read at file:line, at drafting time | yes |
| Absence ("no requirement covers X", "identifier not defined") | Grep for the signature **plus** Read of the region — the collapse log's standing rule is *search locates, reading verifies* (`collapse-log.md:346–350`) | yes |
| Library-behaviour (Claude Code hooks contract) | Context7 `/websites/code_claude` **and** raw primary-source download + Read | yes |
| External-source (ROSE quotations and figures) | PDF fetch + text extraction + verbatim string match | yes |
| Cross-document identifier consistency | Deterministic script over both specs, counts reported | yes |
| Structural / blast-radius | CodeGraph | **unavailable** — no load-bearing claim in this review is structural (the artifact is a document; no code exists yet), so this is not a halt condition per Step 3 |
| Structured reasoning (`metacognitivemonitoring`, `collaborativereasoning`) | Clear Thought MCP | **unavailable in this session** — searched twice, no matching tools. Both mandatory passes were performed manually with the same framing; recorded as a procedural observation below |

**One instrument produced a false negative and was overruled.** `WebFetch` against the
hooks reference reported *"The exact string `stop_hook_active` does not appear on this
page."* Downloading the same page raw and grepping it returned five occurrences,
including the normative definition at line 2194. The summarising fetch had silently
truncated a 242 KB document. Every hooks claim below therefore rests on the raw source,
not on the fetch summary — which is the collapse log's own rule (`collapse-log.md:346–350`)
applied to a different tool than the one it was written about.

**Rigor waivers**: none. No step was compressed, and the dispatch requested none.

---

## Summary

**This review returns NEEDS FIXES.** The document is the strongest artifact this project
has produced against the axis it was clearly built for: its external evidence is real, its
ROSE quotations are verbatim to the character, its hooks claims are substantively correct
against the current contract, and it resolves four open items the v1 spec explicitly
assigned to it. That work is genuine and is credited below. The failures are of a
different kind and they are structural rather than evidentiary. Two are Critical: §11
now contains two decisions that flatly contradict each other, with the losing one left
standing where it negates a requirement added minutes earlier; and the document's opening
promise that requirement identifiers are shared with the v1 spec "so downstream artifacts
need no translation" is false for ten of fifteen acceptance criteria, with three live
pointers — in the v1 spec, in `CLAUDE.md`, and in the collapse log's own standing
countermeasure — already resolving to the wrong requirement. Beneath those, the
acceptance-criteria set covers 30 of 50 requirements and omits the one control the
owner's stated need depends on, the completion gate hands the owner exactly the role §6
says he cannot perform, and the ROSE operating point is presented as "cost and benefit"
with both quoted figures being benefits and the cost — a 97 percent missed-alarm rate
stated in the same paragraph — left out. The citation apparatus, which the author states
he verified end to end, has eight ranges that do not support the claims attached to them.

---

## Upstream Contract Verification

The dispatch names three upstream contracts. Each is checked below; verification method
recorded per item.

### `RETHINK.md` §12 + addenda — the owner's locked decisions (highest authority)

| Decision | Status | Verification |
|---|---|---|
| 1. Name `ctxoracle` | honored | Read spec:3, 339 |
| 2. Model in the loop | honored (deferred) | Read spec:55; excluded to Phase 1 with a reason |
| 3. No hard blocks, anywhere | honored | Read spec:92–94 (FR-O4), 206–208 (P0-4), 216–219 (FR-D3); RETHINK:314–323 Read |
| 4. Sandbox compatibility | honored | Read spec:315–320 (C-1); RETHINK:324–327 Read |
| 6. Two stores, outside the tree | honored | Read spec:130–131 (FR-K8); RETHINK:330–334 Read |
| 7. No separate credentials | honored (vacuously — no model call) | Read spec:278–279, 343–344 |
| 8. Subagent delivery in v1 | honored in substance, **mis-pointed** | Read spec:61 vs spec:107–110 — see M2 |
| 10. Self-observability required | honored in §6, **violated by §12** | Read spec:232–233 vs spec:402–403 — see S2 |
| 11. Agent-led; owner is a non-programmer | honored | Read spec:36–38; RETHINK:355–359 Read |
| 12. Speak at a completion claim, cost accepted, bounded to one | honored in substance, **under-cited** | Read spec:95–100, 225–228, 418–422; RETHINK:361–399 Read — see S4 instance 4 |

RETHINK decisions 5 and 9 are superseded / deferred and correctly so.

### `CLAUDE.md` — lifecycle, information policy, engineering standard

| Clause | Status | Verification |
|---|---|---|
| Lifecycle: spec → architecture → plan → build; architecture is per phase | honored — this artifact is at the correct stage | Read CLAUDE.md §Lifecycle |
| "Every non-trivial new requirement carries a source annotation… Numbers without sources don't go in" | **violated** | Read spec:203–205, 85–91 — see M4 |
| "External facts… verified against current primary sources before you build on them" | **violated in one place** | `PreToolUseHookSpecificOutput` absent from both cited sources and both primary references — see M3 |
| "Keep documents in sync" | **violated** | CLAUDE.md read-list and information-policy table name only the v1 spec; grep for `phase0` in v1 spec + CLAUDE.md → 1 hit, and it names the *architecture* file, not this spec — see M7 |
| Information policy — "One fact, one home… the duplicate is not wrong when it is written, it goes wrong later" | **violated, and already materialised** | The identifier collision is precisely this failure mode — see C2 |

### `docs/collapse-log.md` — standing lessons

| Standing lesson | Status | Verification |
|---|---|---|
| "No ranking claim about this tool's purposes, genres, triggers or moments enters any document unless the owner stated it in those words" (2026-08-01 #1) | **violated** | Read spec:174–176 — see S5 |
| "'Every X is Y' under a table is an attestation… treat one as a defect on sight" (2026-08-01 #6) | **violated twice** | Read spec:50–63 — see M1 |
| "When the argument for excluding something is that it isn't worth saying, that is a bar argument, never a scope argument" (2026-08-01 #2) | **violated in a new form** | Read spec:153–161 — see S7 |
| "A citation that lands on a design intent… rather than on a per-candidate computation with named inputs is an unfilled requirement wearing a reference" (2026-07-30) | **violated** | Read spec:179–187, 225–228 — see M5 |
| "Stopping too early against a source that is right there" (2026-08-01) | **violated** | Read spec:195–205 against the ROSE paragraph — see S1 |
| "The spec does not cite numbered architecture decisions as authority" (2026-08-01 #4) | **honored** | Grep spec for `architecture|\[D-[0-9]` → 0 hits |
| "A new document needs a written precedence rule before its first sentence" (2026-08-01 #5) | **honored** | Read spec:5–8 |
| "Search locates, reading verifies" (2026-07-30) | honored by this review; see the tool plan | — |

---

## Critical & Serious Findings

### C1 — §11 contains two decisions that contradict each other, and the losing one is left standing where it deletes a requirement added in the same commit · **Critical**

**What the spec does now.** `P0-D-6` (spec:374–378) reads: *"**There is no separate
cold-start floor.** FR-A5b's evidence floors already produce silence on a region with too
little mined history: a region with fewer than two co-change observations cannot clear
suggestion-grade, and fewer than three cannot clear warn-grade. A second configurable
minimum would be an ungrounded knob doing work the floors already do."* `P0-D-8`
(spec:392–398) reads: *"**The corpus floor is a separate requirement from the evidence
floors.** An earlier draft deleted it as redundant with FR-A5b. It is not: FR-A5b is
evaluated per co-change pair, and a thin corpus produces pairs with high support and
perfect confidence. The floors filter weak *pairs*; nothing else filters a weak
*history*."* `FR-A6` (spec:188–193) is the corpus floor and is tagged `[P0-D-8]`.

**How that claim was verified.** Read of `spec-context-oracle-phase0.md:374–378`,
`392–398` and `188–193` at commit `3edc61f`, after the final commit landed. Both decisions
are present, in the same section, twenty lines apart. `git diff 64c6249 3edc61f` shows
`FR-A6` and `P0-D-8` were added in the last commit and `P0-D-6` was not touched.

**Which standard it violates.** Internal consistency of a normative document — a
specification is a contract, and two clauses of a contract that command opposite outcomes
leave the obligation undetermined. This is the ordinary requirements-engineering
consistency criterion (IEEE 830 / ISO-IEC-IEEE 29148 *consistent*: no subset of
requirements conflicts). P0-D-8 does not merely differ from P0-D-6; it names P0-D-6's
reasoning and states it is false ("It is not").

**Why it matters.** §11 is the section the lifecycle tells the architect to read for what
was decided. An architect reconciling `FR-A6` against `P0-D-6` is instructed by the
document to delete `FR-A6` as "an ungrounded knob doing work the floors already do." The
substantive question is already settled correctly — P0-D-8 is right, and demonstrably so:
the ROSE operating point was measured with ROSE *"learn[ing] from all transactions since
the beginning of the version history"* of *"eight large open-source projects"* (verified
by string match in the extracted paper text), so a support-3/confidence-1.0 pair drawn
from an eight-commit repository is outside the conditions under which precision >66% was
measured. The defect is that the superseded decision was left in force.

**What correct looks like.** Delete `P0-D-6`. If the history of the reversal is worth
keeping, fold it into `P0-D-8` as one sentence ("an earlier draft carried P0-D-6, which
argued the floors subsume the corpus minimum; that is false because support is a
per-pair count and not a measure of corpus size"), so §11 states one position.

---

### C2 — The document's opening interoperability promise is false: ten acceptance-criterion identifiers, plus `FR-M3`, name different requirements in the two live specs · **Critical · Systemic**

**What the spec does now.** §1 (spec:5–8) states: *"Requirement identifiers are shared so
downstream artifacts need no translation; `P0-` identifiers originate here."* §1 also
establishes that the v1 spec remains live ("That document specifies v1 across three
phases. This specifies Phase 0. Where both address the same subject, this governs Phase 0").

**How that claim was verified — proactive scan across the full inventory scope.** A
deterministic script parsed every `**AC-n (subject → …)**` and `**FR-…**` definition out of
both spec files at commit `3edc61f` and compared subjects. Results:

*Acceptance criteria — 10 identifiers defined in both, naming different criteria:*

| ID | v1 spec | Phase 0 spec |
|---|---|---|
| AC-6 | provenance | consequence |
| AC-7 | injection | orientation |
| AC-8 | zero ceremony | completeness and verification |
| AC-9 | false-fire learning | secrets |
| AC-10 | degraded mode | least privilege |
| AC-11 | recursion guard | injection |
| AC-12 | secrets | staleness |
| AC-13 | trust origin | self-detection |
| AC-14 | least privilege & locality | measurements |
| AC-15 | export round-trip | zero ceremony |

*Requirements:* `FR-M3` — v1 (`spec-context-oracle.md:583`) is *"The distiller consumes
diagnostics… recurring failures generate an actionable self-report"*; Phase 0
(`spec-context-oracle-phase0.md:243`) is *"Diagnostics never touch agent context and never
leave the machine"*, which is v1's `FR-M4`. v1's `FR-M3` is separately deferred to Phase 2
by §2's `self-report` row (spec:63) — so the identifier is reused for a different
requirement while the original is still pending. `FR-A2` and `FR-A5` are live v1
identifiers that the Phase 0 spec neither defines nor excludes (`FR-A5` was split into
`FR-A5a`/`FR-A5b`; `FR-A2` is skipped entirely).

**Three live pointers already resolve to the wrong thing.** Each verified by Read:
- `spec-context-oracle.md:908–909` — Phase 0's exit in the v1 spec reads *"Exit: AC-1..AC-5,
  AC-12, AC-14, AC-17, AC-18 pass."* Under Phase 0's numbering `AC-12` is staleness (v1: secrets),
  `AC-14` is measurements (v1: least privilege & locality), and `AC-17`/`AC-18` do not exist.
- `CLAUDE.md:19` — the mandatory session-start read-list item 6: *"The oracle's own
  diagnostics self-report (FR-M3), once it exists."* Under Phase 0's numbering `FR-M3` is
  the diagnostics-locality rule.
- `collapse-log.md:379` — the standing countermeasure required of every future round:
  *"require each of the twelve FR-A2 genres to survive end to end."* The Phase 0 spec
  defines no `FR-A2`, and its §5 genre table is unnumbered.

**Which standard it violates.** Identifier stability across a document family — an
identifier is a name, and reusing a name for a different referent while the original
referent is still live is the aliasing failure that configuration management exists to
prevent (ISO-IEC-IEEE 29148 *unambiguous*, and the traceability requirement that a
reference resolve to exactly one requirement). The project has its own statement of the
same rule: `CLAUDE.md`'s information policy — *"One fact, one home… the duplicate is not
wrong when it is written, it goes wrong later, and the copy that goes stale is never the
one you happen to be looking at."*

**Why it matters, and why it is Systemic rather than ten separate defects.** The Phase 0
spec's stated purpose for sharing identifiers is that *downstream artifacts need no
translation*. Downstream artifacts are the architecture, the plan, and the review closure
ledgers — all of which cite requirements by identifier, and none of which carries a
document qualifier today. The single sentence in §1 is what licenses them not to. The
governing sentence is false, so every downstream citation of `AC-6`..`AC-15`, `FR-M3`,
`FR-A2` or `FR-A5` is ambiguous by construction, and the ambiguity is invisible: both
readings name a real criterion, so nothing errors. This is not a numbering nuisance; it is
the review-closure mechanism losing its anchor.

**What correct looks like.** One of three, in order of preference:
1. **Prefix the Phase 0 criteria** — `P0-AC-1`..`P0-AC-15`, matching the `P0-` convention
   §1 already establishes for `P0-D-n` and `P0-n`, and delete the "identifiers are shared"
   sentence. Renumber `FR-M3` → adopt v1's `FR-M4` for the locality rule.
2. Keep the numbers and **replace the §1 sentence with an explicit translation table**,
   which is the honest version of the same document but concedes translation is needed.
3. Renumber the Phase 0 criteria to continue v1's space (`AC-23`+), leaving v1's
   identifiers untouched.

Whichever is chosen, `CLAUDE.md:19` and `collapse-log.md:379` need their pointers
corrected in the same change, and v1 §12's Phase 0 exit line needs to name criteria that
exist.

---

### S1 — The ROSE operating point is presented as "cost and benefit" with both quoted figures being benefits; the cost is in the same paragraph and is omitted · **Serious**

**What the spec does now.** `FR-A5b` (spec:195–205): *"Zimmermann et al. 2005 set exactly
this operating point and report its cost and benefit:"* followed by the threshold
quotation, then *"At that point, 'The average precision is above 66 percent' and 'Only 2
percent of all transactions cause a false alarm.'"*

**How that claim was verified.** The paper PDF was fetched from the author's copy,
confirmed to be the 17-page TSE version, and text-extracted (68,681 chars). Both quoted
sentences string-matched verbatim. The surrounding context was then Read. The paper's
bullet list at that operating point runs, in order:

> "· The feedback is 3 percent and the average recall is about 75 percent. This means that
> for only one out of every 33 missing items (in GCC: every 13 items), ROSE issues a
> warning; **the percentage of missed alarms is on average 97 percent.** However, for those
> cases where ROSE issues a warning, it predicts 75 percent of the items that are actually
> missing. · **The average precision is above 66 percent.** …"

The spec quotes the second bullet and skips the first. The omitted sentence is the one
immediately preceding the quoted one.

**Which standard it violates.** Evidence completeness when adopting a published operating
point: when a threshold is imported from a study *because* the study characterised it, the
study's reported error rates on both axes travel with it. Quoting only the favourable half
while announcing "cost and benefit" is selective quotation. The project states the same
rule in its own words — `collapse-log.md:502–506`, *"quoting a paragraph to the em-dash
where the continuation reversed the reading… Stopping too early against a source that is
right there."*

**Why it matters.** This is not a presentational nicety; it changes what the reader
concludes Phase 0 will do. The ⚠ warning genre on history-derived evidence is gated at
support ≥ 3 / confidence ≥ 0.9 (`FR-A5b`), and at that gate ROSE surfaced roughly three
percent of the incomplete changes it was aiming at. The owner — the only person who can
approve this spec, and a non-programmer by design — reads "precision above 66 percent"
and "2 percent false alarms" and concludes the warning channel is high quality. It is
high *precision* and very low *recall*, and the low recall is the number that predicts
how much evidence Phase 0 will actually produce. §1 states that *"running it is the only
way to obtain evidence about how often the oracle should speak — evidence the judgment
layer's design depends on,"* and `P0-D-1` builds Phase 0's measurement obligation on that.
A near-silent warn channel is a direct constraint on that evidence and it is currently
invisible in the document.

**What correct looks like.** Quote the cost. One sentence added to `FR-A5b`: *"The cost at
that operating point is recall against opportunities, not precision: the same evaluation
reports feedback of 3 percent — 'the percentage of missed alarms is on average 97
percent' — so a warn-grade channel at this floor speaks rarely by design."* Then state
whether that is accepted (it probably should be — it is the same posture as "silence is
the default"), so the reader is told rather than left to find it.

---

### S2 — The completion gate makes the owner the incident detector, which §6 of the same document says he cannot be · **Serious**

**What the spec does now.** §12's preamble (spec:402–403): *"Phase 0 is complete when all
of the following pass and the owner has run it on a real project without incident."* §6's
opening (spec:232–233): *"The owner cannot be the failure detector. `RETHINK.md:350–354`,
decision 10: 'it could fail a hundred ways in front of me and I wouldn't know.'"*

**How that claim was verified.** Read of `spec-context-oracle-phase0.md:402–403` and
`232–233` at `3edc61f`; Read of `RETHINK.md:350–354`, which confirms the quotation
verbatim.

**Which standard it violates.** Testability of an acceptance condition (ISO-IEC-IEEE 29148
*verifiable*): "without incident" names no observable, no threshold and no observer
procedure. Compounding it, the observer it does implicitly name is the one the document
has already established cannot observe. The two clauses cannot both hold.

**Why it matters.** The whole of §6 exists because the owner will not notice failures.
`P0-6` then builds exactly the instrument that could close this gate — silence rate,
latency distribution against `FR-O3`, continuation count — and `AC-14` requires `status`
to *report* them. But no requirement or criterion obliges anyone to *look* at them, and no
value is stated that any of them must meet. Phase 0 can therefore pass its own exit with a
silence rate of 0 percent or of 100 percent, provided `status` prints the number and the
owner did not happen to notice anything. This is the defect the v1 spec already recorded
at `spec-context-oracle.md:1056–1057` — *"Phase 0's numbers are never reviewed (§12): its
exit names a run but no measurement and no review"* — carried into the document whose job
was to fix it.

**What correct looks like.** Replace "without incident" with the instrument that already
exists. For example: *"Phase 0 is complete when all criteria below pass; the owner has run
it on a real project for at least N sessions; and `ctxoracle status` at the end of that run
reports zero unresolved anomalies in the `FR-M2` classes, a silence rate inside [range],
and a p95 latency inside `NF-1`."* The point is that the exit is read off the oracle's own
diagnostics, not off the owner's unaided perception — which is what decision 10 requires.

---

### S3 — 20 of 50 requirements have no acceptance criterion, including the one control the document's own stated owner-need depends on · **Serious**

**What the spec does now.** §12 defines 16 criteria (`AC-1`..`AC-15` plus `AC-2b`). A
script extracted every requirement defined in §§4–9 and every identifier referenced
anywhere in §12, using boundary-anchored matching so that `AC-1` is not miscounted as a
reference to `C-1`.

**How that claim was verified.** Deterministic scan at `3edc61f`: 50 requirements defined,
30 referenced by at least one criterion, **20 referenced by none**:

`C-1`, `C-2`, `C-3`, `C-5`, `FR-A6`, `FR-D2`, `FR-D4`, `FR-K6`, `FR-L1`, `FR-L6`, `FR-O1`,
`FR-O2`, `FR-O5`, `FR-X4`, `FR-X6`, `NF-2`, `NF-3`, `P0-1`, `P0-2`, `P0-3`.

**Which standard it violates.** Requirements–verification traceability: every requirement
in a specification carries a means of verification (ISO-IEC-IEEE 29148 §5.2.8; the same
principle as DO-178C's requirements-to-test coverage). A requirement no criterion exercises
is an unenforceable clause.

**Why it matters, specifically here.**
- **`FR-X6`** is the whisper audit log. §1 states the owner's need in exactly one sentence
  — *"The owner must be able to audit afterwards everything the oracle said and the
  evidence behind it"* (spec:36–37) — and `FR-X6` is the only requirement that delivers it.
  Nothing tests it. The collapse log calls this control *"the one oversight control the
  security model cannot lose"* (`collapse-log.md:171–176`).
- **`FR-K6`** ("Records without provenance are unrepresentable") and **`FR-X4`** (trust
  origin preserved through every stage) are the two controls for threat T2. v1 had criteria
  for both — `AC-6` provenance and `AC-13` trust origin — and Phase 0 reassigned those
  numbers to other subjects (see C2) without carrying the criteria across.
- **`FR-A6`** and **`FR-O5`**, both restored in the last commit, arrived without criteria.
- **`NF-2`** is untestable for a second reason: see M6.

The v1 spec already listed this defect as blocking Phase 0's exit
(`spec-context-oracle.md:1058–1061`), naming `FR-O1, FR-O2, FR-O5, FR-K1, FR-D2, FR-L1,
FR-X6, NF-2, NF-3` and four of five constraints. The Phase 0 spec closes exactly one of
them (`FR-K1`, now covered by `AC-7`), reproduces the rest, and adds `FR-K6`, `FR-X4`,
`FR-A6`, `FR-L6`, `P0-1`, `P0-2`, `P0-3` to the list.

**What correct looks like.** Add criteria for the security and provenance requirements at
minimum — a provenance criterion (every emitted whisper's pointer resolves; no record
persists without provenance), a trust-origin criterion (no repository-derived record ever
carries human or mechanical provenance), and an audit criterion (every whisper appears in
the log with its evidence, and a whisper that cannot be logged is not sent). For the
remainder, either add criteria or state explicitly in §12 which requirements are verified
by inspection rather than by test — an explicit inspection list is a legitimate answer; a
silent gap is not.

---

### S4 — Eight citation ranges do not support the claim attached to them · **Serious · Systemic**

**What the spec does now.** The document's authority rests on citing `RETHINK.md` by line
(§1: *"cited by line and not re-derived"*). Commit `35c70cd` is titled *"verify every
RETHINK citation in the Phase 0 spec; one was fabricated"*, and the dispatch reports the
author's claim that every citation was verified before delivery. Treated as a claim, it was
re-derived independently.

**How that claim was verified — proactive scan across the full inventory scope.** Every
`RETHINK.md:` citation in the spec was extracted and each cited range was Read in
`RETHINK.md` at the moment the finding was drafted. Eight ranges do not carry the claim
attached to them:

| # | Spec site | Cited range | What the range actually contains |
|---|---|---|---|
| 1 | `FR-D2` (spec:214–215) — "Informative, never imperative" | `RETHINK.md:193–194` | *"what makes it robust: an ignored whisper costs nothing; a wrong gate blocks / real work."* The claim is at **line 190**. **The cited range does not contain it at all.** |
| 2 | §3 source table (spec:69) — "§12 + addenda" | `RETHINK.md:303–392` | §12's addenda run to **line 399**. Lines 393–399 are the *"What this does not license"* paragraph — the no-gates corollary and the one-continuation `stop_hook_active` bound that `FR-O4` and `FR-O4a` rest on. The confirmation range for the highest authority excludes its most load-bearing lines. |
| 3 | `FR-K1` (spec:111–113) | `RETHINK.md:130–132` | Line 130 is the §4 Tier-2 heading, 131 blank, 132 *"Import/reference graph, symbol map, directory topology and ownership boundaries,"*. Three of the seven artifacts `FR-K1` enumerates — generated/vendored zones, test topology, per-region verification commands — are at **lines 133–134**, outside the range. |
| 4 | `FR-X7` (spec:299–300) — "Both stores are local; no telemetry leaves the machine" | `RETHINK.md:330–334` | Decision 6 says stores *"live outside the repo tree"* and *"Team sharing is out of scope."* It does not say *local*, and it does not say *no telemetry*. The requirement asserts more than the source establishes. |
| 5 | `FR-A3` (spec:174–176) — "Warnings get priority within the budget" | `RETHINK.md:175–176` | The range covers per-trigger and per-session budgets. It contains no priority rule; nothing in `RETHINK.md` does. See S5. |
| 6 | `FR-A4` (spec:177–178) — "already read, been told, or visibly acted on" | `RETHINK.md:177–178` | The range is the Dedup rule (whispers already incorporated). "Already read" is sourced at **line 138** (*"never tell it what it has seen"*), outside the range. |
| 7 | `FR-D1` (spec:209–213) — "confidence tag when below high" | `:195` | Line 195 carries the stable-prefix rule. The confidence-when-not-high rule is at **lines 196–197**, outside the citation. |
| 8 | `FR-A5a` (spec:184–185) — "candidates are *Ranked by marginal value…*" | `RETHINK.md:107` | Quoted verbatim, but line 107 sits under `## 4. What it knows — the knowledge model` and orders the **knowledge tiers**, not whisper candidates. The on-point per-candidate source is `RETHINK.md:59–61` — *"Marginal value over the agent's own abilities is the only relevance metric that matters"* — which is uncited. **This instance was added in the final commit**, so the pattern is still active. |

**Which standard it violates.** Citation accuracy — a line reference is an assertion that
the referenced lines support the claim, and a reader following it must land on the
support. This is the ordinary scholarly-citation standard, and the project raises it to a
functional requirement: §1 says RETHINK §12 is *"cited by line and not re-derived,"* which
makes the line reference the entire verification surface.

**Why it is Systemic rather than eight separate slips.** All eight share one shape: the
range is anchored on the phrase the author had in mind and then truncated at a line
boundary rather than at the boundary of the supporting text. Instances 3, 6 and 7 stop one
or two lines short; instance 2 stops seven lines short of the addendum's end; instances 1
and 8 land on the wrong sentence entirely; instance 4 overreaches. Fixing them one at a
time will not stop the ninth, because the generator is the practice of citing to a
remembered phrase rather than re-reading the span. And the harm compounds specifically for
this project: the owner is a non-programmer whose only means of checking the spec against
his own locked decisions is to follow these ranges. One that lands on the wrong sentence
costs him the ability to trust the other forty.

**What correct looks like.** Re-derive every range by opening `RETHINK.md` at the range
and reading it end to end before the range is written down, then widen each to the full
span that supports the claim: `FR-D2` → `190–194`; §3 → `303–399`; `FR-K1` → `130–134`;
`FR-X7` → cite decision 6 for locality-outside-tree and record "no telemetry" as a `P0-D-n`
judgment, because RETHINK does not contain it; `FR-A4` → `138` + `177–178`; `FR-D1` →
`195–197`; `FR-A5a` → `59–61`. Instance 5 is not a citation fix — see S5.

---

### S5 — "Warnings get priority within the budget" is a genre-ranking claim with no owner statement and no source, against an explicit standing directive · **Serious**

**What the spec does now.** `FR-A3` (spec:174–176): *"At most one whisper per event, within
a per-session injected-token budget. Warnings get priority within the budget, never
exemption from it. `RETHINK.md:175–176`."*

**How that claim was verified.** Read of `spec-context-oracle-phase0.md:174–176` and of
`RETHINK.md:175–176` (*"Per-trigger and per-session whisper budgets. Hard caps; the
orientation whisper decays out of consideration once the agent is deep in the work."*).
The priority rule is not in the cited range. Grep of `RETHINK.md` for `priorit` → 0 hits;
the region was then Read to confirm, per the project's search-locates/reading-verifies
rule. The rule is inherited from the v1 spec (`spec-context-oracle.md:419`), which carries
it with the same non-supporting citation.

**Which standard it violates.** The collapse log's standing directive, recorded 2026-08-01
as the one failure the owner himself caught: *"no ranking claim about this tool's purposes,
genres, triggers or moments enters any document unless the owner stated it in those words,
quoted and attributed"* (`collapse-log.md:441–443`). Secondarily, `CLAUDE.md`'s engineering
standard: *"Every non-trivial new requirement carries a source annotation… Numbers without
sources don't go in."*

**Why it matters.** The entry that produced this directive is the same class of defect:
an agent-authored superlative wrapped around the owner's words, which propagated to four
documents before he caught it. "Warnings get priority" ranks one of six genres above the
other five inside the one resource all six compete for. Under budget pressure, the ranking
decides which genre is heard — so it is a scope decision wearing an allocation rule, in a
project whose owner has twice corrected agents for collapsing a deliberately broad tool
onto one purpose (`RETHINK.md:381–391`). The clause is also inherited rather than derived,
which is the prior-artifact replication the Expert Standard names.

**What correct looks like.** Either (a) delete the clause and let `FR-A5a`'s
confidence × decision-impact × marginal-value bar decide ordering, which is where per-
candidate ranking belongs and is what the collapse log's "that is a bar argument, never a
scope argument" lesson requires; or (b) keep it as an explicit `[P0-D-n]` judgment that
states it is the spec's own ranking, gives the reasoning, and flags it for the owner as a
ranking he has not made. (a) is preferable; the bar already carries the mechanism.

---

### S6 — The warm session service has no termination event; `SessionEnd` is absent from the observed-event set, from §2's exclusions, and from §3's confirmed hooks facts · **Serious**

**What the spec does now.** `C-2` (spec:321–322) requires *"Session state persists warm
across hook invocations with sub-second access; cold-starting per event cannot meet NF-1."*
`FR-O1` (spec:78–82) enumerates the observed events: session start, prompt submission,
completed read/search, pending edit/write, completed edit/write, session stop. §10
(spec:336–337) closes the consumed interface to *"the events in FR-O1."*

**How that claim was verified.** Read of `spec-context-oracle-phase0.md:78–82`, `321–322`,
`336–337`. Grep of the whole spec for `sessionend|teardown|shutdown|daemon|service`
(case-insensitive) → 8 hits, none of which is a termination event; the regions were then
Read to confirm. `SessionEnd` appears nowhere in the document. The hooks reference was Read
at line 2693: *"SessionEnd hooks have a default timeout of 1.5 seconds. This applies to
session exit, `/clear`, and switching sessions via interactive `/resume`… The overall
budget is automatically raised to the highest per-hook `timeout` configured in settings
files, up to 60 seconds."* §3's confirmed-facts cell (spec:71) lists the 10-minute default
and the 30 s `UserPromptSubmit` reduction and omits the `SessionEnd` budget.

**Which standard it violates.** Resource-lifecycle symmetry — a specification that mandates
a stateful, session-scoped process must define its termination as well as its creation.
An acquired resource with no defined release point is the canonical leak.

**Why it matters.** `C-2` mandates a per-session warm process. Nothing in the spec ends
it, and §10 gives it no event on which it could learn the session is over, so each session
leaves a live service behind. The v1 spec handled this explicitly — *"Service teardown and
distiller spawn hang off `SessionEnd`"* (`spec-context-oracle.md:246–247`) — and flagged
the consequence that the 1.5 s budget breaks a global 3 s shim deadline, a finding the
collapse log records as a round-2 expert-review result (`collapse-log.md:333`). Dropping
the event drops the problem's visibility, not the problem. It also silently falsifies
§2's *"Nothing is dropped from v1"* (see M1) and narrows the qualifier on `FR-O3`'s
*"the oracle's budget is tighter on every event"*, which holds for the five events `FR-O1`
lists and not for `SessionEnd` (1.5 s, tighter than `FR-O3`'s 3 s ceiling) or
`MessageDisplay` (10 s).

**What correct looks like.** Add `SessionEnd` to `FR-O1` as an observation-and-teardown
event in the same shape as `P0-1` handles `StopFailure`, record its 1.5 s shared budget in
§3's confirmed facts, and state in `FR-O3` that the oracle's budget is tighter than the
harness's on every event *it consumes except `SessionEnd`, where `init` writes an explicit
per-hook `timeout`* (which `AC-4`'s settings accounting must then include). If teardown is
genuinely deferred, §2 must say so and name the phase.

---

### S7 — Two genre arms are deferred because no acceptance criterion covers them, converting a gap in the test set into a cut in scope · **Serious**

**What the spec does now.** §5 (spec:153–161), added in the final commit: *"Arms of these
genres deferred within the genre, not dropped from it… Two — consequence's reuse arm and
completeness's invariant arm — are derivable from Phase 0's own stores and are deferred
only because no criterion covers them."*

**How that claim was verified.** Read of `spec-context-oracle-phase0.md:153–161` at
`3edc61f`; `git diff 64c6249 3edc61f` confirms the paragraph is new.

**Which standard it violates.** The direction of dependency between a requirement set and
its verification set: criteria are written to cover requirements, never the reverse. A
capability that the spec states is buildable from Phase 0's own stores, withheld because
§12 does not yet contain a test for it, inverts that. The project states the same rule in
its own terms — `collapse-log.md:451–455`: *"when the argument for excluding something is
that it isn't worth saying, that is a bar argument — per candidate, at runtime, tunable —
never a scope argument. A bar suppresses; a build plan deletes."* This is a weaker argument
than the one that lesson kills: not "it isn't worth saying" but "we didn't write a test."

**Why it matters.** The paragraph is otherwise a genuine improvement — it is the document
defending itself against the reduction class that has collapsed this project three times,
and it should stay. But the sentence quoted above hands future readers a licence: any
capability can be removed from a phase by declining to write its criterion. The remedy is
one line of work, not a scope decision — the two arms are, by the spec's own statement,
derivable from Phase 0's stores.

**What correct looks like.** Delete the "deferred only because no criterion covers them"
justification and add the two criteria, or, if they are genuinely deferred, give a reason
that is about the capability rather than about the test set (e.g. "the invariant arm is
deferred because `P0-3` gives invariant records only two writers in Phase 0, so the table
is empty in practice" — which is a real reason and is already established at spec:135–138).

---

## Systemic Patterns

Two of the findings above are systemic and are cross-listed here with their scans; a third
is Minor and appears below.

1. **C2 — identifier collision across the two live specs.** Scan: deterministic parse of
   every `AC-n` and `FR-…` definition in both spec files at `3edc61f`, subjects compared.
   Result: **10 acceptance-criterion identifiers** naming different criteria (AC-6, AC-7,
   AC-8, AC-9, AC-10, AC-11, AC-12, AC-13, AC-14, AC-15), plus `FR-M3` naming a different
   requirement, plus `FR-A2`/`FR-A5`/`FR-A7`/`FR-K3` live in v1 with no Phase 0 referent.
   Three live cross-document pointers verified to mis-resolve. Standard: identifier
   stability / traceability, and `CLAUDE.md`'s one-fact-one-home rule. Systemic because a
   single sentence in §1 licenses every downstream artifact to omit the document qualifier
   that would disambiguate them.

2. **S4 — citation ranges that do not support their claim.** Scan: every `RETHINK.md:`
   citation in the spec extracted and each range Read in `RETHINK.md` at drafting time.
   Result: **8 of the document's RETHINK citations** are wrong (2 land on the wrong
   sentence, 4 under-cover, 1 overreaches, 1 attributes a tier-ordering sentence to
   candidate ranking). Instances enumerated in the S4 table. Standard: citation accuracy,
   raised to a functional requirement by §1's "cited by line and not re-derived." Systemic
   because all eight share one generator — citing to a remembered phrase and truncating at
   a line boundary — and one of them was introduced in the final commit, after the
   dedicated citation-verification pass.

No third systemic pattern was found. Scans run and returning nothing systemic:
`grep -n -E "FR-A6|FR-A7|FR-K3|FR-O5|FR-M4|exemplar|first.impression|cold.start"` over the
spec (3 hits, all accounted for individually under M1); `grep -n -E "architecture|\[D-[0-9]"`
over the spec (0 hits — the collapse log's "spec does not cite architecture decisions"
lesson is cleanly honored); boundary-anchored requirement-to-criterion coverage scan
(reported as the single finding S3, not a pattern across documents).

---

## Moderate & Minor Findings

### M1 — §2's two attestations are both falsified by the table beneath them · **Moderate**

§2 (spec:50–51) states *"Every exclusion names the phase that owns it. Nothing is dropped
from v1."* Verified by Read of the table at spec:53–63 and by the cross-document identifier
scan: (a) the Unknown-genre row's "Owned by" cell reads *"Held open in the v1 spec §14, not
resolved here"*, which is not a phase; (b) `FR-K3` (exemplar registry) and `FR-A7` (first
impressions) are defined in v1, absent from the Phase 0 requirement set, and named nowhere
in the exclusion table — `FR-A7` is now mentioned once inside `P0-D-8`'s rationale
(spec:398), which is an acknowledgement, not a phase assignment. Standard: the collapse
log's own directive, `collapse-log.md:471–472` — *"'Every X is Y' under a table is an
attestation, and the standing instruction is to treat one as a defect on sight."* Fix: drop
both attestations and let the table carry itself, or add the two missing rows and change
"names the phase" to "names the phase or records that its phase is unresolved upstream."

### M2 — §2's subagent row points at the wrong requirement · **Moderate**

Spec:61 reads *"| Subagent delivery | Phase 1 | P0-3 fixes the Phase 0 obligation this
creates |"*. Verified by Read: `P0-3` (spec:135–138) is the landmine/invariant/exemplar/
recipe schema requirement; `P0-2` (spec:107–110) is *"Session state is keyed per consumer
from the first implementation… a state model built for one consumer cannot acquire a second
without being rebuilt"* — which is exactly the Phase 0 obligation that deferring subagent
delivery creates. Standard: internal cross-reference correctness. Fix: `P0-3` → `P0-2`.

### M3 — `PreToolUseHookSpecificOutput` does not exist in either cited source, or in either primary reference · **Moderate**

§3's confirmation cell (spec:71) asserts, as confirmed via Context7 `/websites/code_claude`
and `/llmstxt/code_claude_llms_txt`: *"`PreToolUseHookSpecificOutput` declares
`permissionDecision` and `additionalContext` both not-required."* §5 (spec:163–167) rests
the consequence and warning genres' structural availability on it. Verified: the hooks
reference (242,078 bytes) and the Agent SDK TypeScript reference (265,150 bytes) were both
downloaded and grepped for `PreToolUseHookSpecificOutput` and for `HookSpecificOutput`
(case-sensitive and case-insensitive) → **0 hits in both**. **The underlying behavioural
claim is true** — the hooks reference at line 1548–1553 lists `permissionDecision` and
`additionalContext` as independent fields of the `PreToolUse` `hookSpecificOutput` object,
the "Add context for Claude" section at line 842 lists `PreToolUse` among the events whose
`additionalContext` is delivered, and its example at line 829–836 returns `additionalContext`
with no `permissionDecision`. Only the named artifact is wrong. Standard: `CLAUDE.md`'s
*"External facts… verified against current primary sources."* Why it matters: `C-5`
requires implementation to re-verify the contract against current documentation and to
*"degrade to silence on any drift they detect."* An implementer looking for
`PreToolUseHookSpecificOutput` will not find it, and the honest reading of `C-5` is then to
degrade — switching off the two genres `AC-5` and `AC-6` require. Fix: replace the type
name with the behaviour and its location — "the `PreToolUse` `hookSpecificOutput` object
carries `permissionDecision` and `additionalContext` as independent fields, and
`additionalContext` is delivered at `PreToolUse` with no decision present."

### M4 — Two numbers lost their source annotations in the port from v1 · **Moderate**

`FR-A5b`'s suggestion-grade floor *"never below support ≥ 2"* (spec:203–204) and `FR-O3`'s
*"hard ceiling 3 s"* (spec:87–88) are both stated without a `[P0-D-n]` tag and have no §11
entry. Verified by Read of both sites and of §11 (spec:346–398). In v1 each carried one:
the support floor was `[D-5]` grounded on `[HH-04]` (Hassan & Holt's 0.06 raw co-change
precision, `spec-context-oracle.md:434`), and the 3 s ceiling was `[D-11]`
(`spec-context-oracle.md:812–815`). The Phase 0 spec drops `[HH-04]` from its source table
and asserts at spec:74 *"No other external source is cited, because no requirement below
depends on one"* — but the replacement justification offered for support ≥ 2 (ROSE's
support-1 precision of 0.30, verified verbatim in the paper: *"ROSE achieves for a support
count of 1 and a confidence of 0.1 a feedback of 0.64 and a precision of 0.30"*) shows only
that 1 is too low; it does not establish 2. Standard: `CLAUDE.md` — *"Numbers without
sources don't go in."* The convention is applied correctly to `AC-2`'s 10 percent via
`P0-D-5`, which makes the inconsistency clear. Fix: add `[P0-D-n]` entries for both, or
restore the `[HH-04]` grounding and add it to §3.

### M5 — "Raised bar" and "decision-impact" are named but never computed, and no criterion reaches them · **Moderate**

`P0-5` (spec:225–228) requires a stop-grade whisper to clear *"a raised bar"* — raised
relative to what, by how much, computed from what, is unstated, and `AC-8` tests only that
the whispers fire and are recorded as continuation events. `FR-A5a` (spec:179–187) carries
`decision-impact` as a bar term with no defining computation. Verified by Read of
spec:179–187, 225–228, 435–438 and by the §12 coverage scan. Standard: the collapse log's
own named tell, `collapse-log.md:360–364` — *"a citation that lands on a design intent, a
schema column, or a component name rather than on a per-candidate computation with named
inputs is an unfilled requirement wearing a reference. For every principle and every column
ask who writes this, in which decision, from what inputs."* This is `collapse-log.md:96–111`
(2026-07-22 item 1, `decision-impact` undefined) recurring at the spec layer. Note that the
same commit fixed the sibling case well: `FR-A5a`'s third term *is* given named inputs
("derived from the fact's provenance class and from what this consumer has already read or
searched this session") and *is* given a criterion (`AC-2b`). Fix: give the raised bar the
same treatment — state the delta or the inputs, and extend `AC-8` to assert a stop-grade
candidate below it stays silent.

### M6 — The token budget has no value, so `NF-2` cannot be verified · **Moderate**

`FR-A3` (spec:174–175) mandates *"a per-session injected-token budget"* with no value and
no configurability statement; `NF-2` (spec:308–309) binds to it — *"Session token overhead
stays within the FR-A3 budget"*. Verified by Read of both, and by the coverage scan: neither
`FR-A3`'s budget nor `NF-2` is exercised by any criterion. v1 set the default at 2,000
tokens with the reasoning recorded as `[D-10]` (`spec-context-oracle.md:808–811`); the
Phase 0 spec drops the number without replacing it. Standard: ISO-IEC-IEEE 29148
*verifiable* — a non-functional requirement whose threshold is another requirement's
unstated value cannot pass or fail. Fix: state the default (carrying v1's `[D-10]`
reasoning as a `[P0-D-n]`), and have `AC-14` report the measured per-session token total
against it, which `P0-6` is already the natural place for.

### M7 — The document now governing Phase 0 is invisible to the mandated session-start reading protocol · **Moderate**

Verified by grep for `phase0|phase-0|Phase 0 spec` across `spec-context-oracle.md` and
`CLAUDE.md` → 1 hit, `CLAUDE.md:237`, which names
`docs/architecture-context-oracle-phase0.md`, not this spec. `CLAUDE.md`'s read-before-working
list item 2 names only `docs/specs/spec-context-oracle.md`, and its information-policy table
row for "What the tool must do" names only that file. v1's §12 and §14 are likewise
unchanged and still describe Phase 0 as their own to specify. Standard: `CLAUDE.md`'s
engineering standard — *"Keep documents in sync"* — and its own information policy, whose
stated failure mode is *"State here goes stale while the real state moves on, and the stale
copy is what a new session reads first."* Why it matters: a fresh session follows
`CLAUDE.md`, reads the v1 spec, and never learns this document exists. Fix: add the Phase 0
spec to `CLAUDE.md`'s read-list and to the information-policy table with the precedence rule
from §1, and add a pointer from v1's §12 to it.

### M8 — The harness's own prompt-injection defence can silently defeat delivery, and the delivery model does not account for it · **Moderate**

`FR-X2` (spec:286–288) mitigates T1 by requiring that *"repository strings appear only as
clearly delimited quotations or pointers."* The hooks reference states, at line 855 (Read):
*"Write the text as factual statements rather than imperative system instructions… Text
framed as out-of-band system commands can trigger Claude's prompt-injection defenses, which
causes Claude to surface the text to you instead of treating it as context."* Verified by
Read of the primary source at that line and of spec:286–288. Standard: interface-contract
completeness — a delivery mechanism's documented failure conditions belong in the
requirement that depends on it. Why it matters: a delimited quotation of hostile imperative
repository text is exactly the shape the harness screens for, so `FR-X2`'s chosen
mitigation can convert a whisper into a user-facing notice — a silent non-delivery.
`AC-11` still passes (nothing was relayed or obeyed) and `FR-M2` would classify it after
the fact ("whispers produced but not delivered"), but no requirement anticipates it. This
also supplies a second, mechanical grounding for `FR-D2` that the spec does not use. Fix:
record the harness behaviour in §3's confirmed facts, note in `FR-X2` that quotation is the
higher-risk option for exactly this reason, and consider making pointer-only the default for
repository-derived spans — which is the resolution the collapse log already reached on the
same threat (`collapse-log.md:185–188`, *"default pointer-only for all repo-derived spans"*).

### m1 — Four quotations are altered at the truncation point without ellipsis · **Minor · Systemic**

Scan: every quotation in the spec compared character-by-character against its source
(`RETHINK.md` Read at the cited lines; the ROSE paper's extracted text string-matched).
Result: 4 alterations, all at the point of truncation, none changing the argument:
`FR-O3` (spec:89–90) ends *"stay silent this round."* where `RETHINK.md:180` continues
*"…this round; precompute aggressively"*; `FR-D3` (spec:218–219) ends *"False fires are
tracked."* where `RETHINK.md:319` continues *"…tracked (warning emitted → agent proceeded →
outcome…)"*; `C-3` (spec:324–325) ends *"relay whispers."* where `RETHINK.md:291–292` reads
*"relay whispers back as injected context"* — this one drops the delivery mechanism from a
constraint about the delivery mechanism; `FR-K2` (spec:120–121) renders the paper's
*"knowledge—which suggests"* as *"knowledge which suggests"*. Standard: verbatim-quotation
integrity (Chicago Manual of Style §13.7 on accuracy, §13.50–13.58 on ellipses) — quotation
marks assert that the enclosed text is what the source says. Systemic because all four share
one generator: truncating at a convenient stopping point and closing with a period rather
than an ellipsis. Minor because no meaning is reversed. Fix: `…` at each truncation, and
restore `C-3`'s full clause.

### m2 — `C-1` permits network access that `FR-X5` and `AC-10` forbid · **Minor**

`C-1` (spec:315–317) allows *"no network access beyond what the harness already has"*;
`FR-X5` (spec:293–296) requires *"no network access at all"*; `AC-10` (spec:441–442) asserts
*"no network connections at all"* on an instrumented run. Verified by Read of all three.
The reconciliation is presumably install-time versus run-time, but neither says so, and
`C-1` covers *"installs **and indexes**"* while indexing is unambiguously part of the
instrumented run. Standard: internal consistency. Fix: scope `C-1` to installation
explicitly and state that the running oracle opens no connection, which is what `FR-X5`
already means.

### m3 — Presentation defects that cost the one reader who must approve the document · **Minor**

Verified by Read at `3edc61f`: `FR-A6` (spec:188–193) is placed **before** `FR-A5b`
(spec:195) and forward-references it twice; stray blank lines at spec:104, 194 and 417
break three requirement lists mid-run, so `FR-O5`, `FR-A6` and `AC-2b` each render as an
orphaned fragment; §3's *"default hook timeout 10 minutes"* omits that this holds for
`command`/`http`/`mcp_tool` handlers only (the reference at line 343, Read, gives 30 s for
`prompt` and 60 s for `agent` handlers). Standard: first-principles, marked as such — the
goal is approval by a named non-programmer who is the document's only approver; the
shortcut is appending restored requirements at the point of edit rather than at their place
in the sequence; it fails the goal because a requirement that forward-references its own
justification and renders as an orphan is one he reads twice and trusts less, and this is
the document whose predecessor he rejected as *"a log full of irrelevant shit and notes."*
Fix: move `FR-A6` after `FR-A5b`, remove the three stray blanks, qualify the timeout.

---

## Tentative Findings

No tentative findings — every candidate finding's premise was verified against current
source before it was written, per Compliance Gate B. The two premises that could have gone
unverified were both closed: the `stop_hook_active` and continuation-cap claims (a
summarising fetch returned a false negative; overruled by downloading the primary source
and grepping it, 5 hits, definition Read at hooks.md:2194 and the `additionalContext`
continuation semantics at 2271), and the eight ROSE quotations (PDF fetched, version
confirmed by page count, text extracted, all eight string-matched).

---

## Observations

These carry no standard violation and no severity.

1. **The Clear Thought MCP was unavailable in this session.** `metacognitivemonitoring`
   and `collaborativereasoning` are both mandatory in the review skill. Two tool searches
   returned no matching deferred tools. Both passes were performed manually: the
   metacognitive baseline was drawn before any finding was drafted (everything about the
   hooks contract, the ROSE quotations and the v1 spec's contents was on the *inferred*
   side and was routed through Step 6 before it could support a finding), and the
   three-perspective check was run against the standards discipline, the downstream
   consumer, and the implementer before the gates. The perspective check changed the
   delivered output in four ways: the review was pinned to a commit, design-blocking was
   separated from exit-blocking in Recommended Priority, the concurrent fixes were credited
   rather than re-reported, and the owner-facing defect (S2) is stated as a fix for the
   agent rather than as a question for him, per `CLAUDE.md`'s "don't hand the owner a
   decision that is already written."

2. **The artifact was under active edit throughout.** Three commits landed during the pass
   (17:10:07, 17:26:43, 17:27:50). This is not a criticism of the author — it is a note for
   whoever closes these findings, because a review whose baseline moves cannot serve as a
   closure ledger. The pinned commit is `3edc61f`.

3. **`FR-O1`'s exhaustiveness is now correctly characterised.** The version of `P0-D-7`
   present at the start of this pass argued that `FR-O1` enumerates the oracle's triggers
   exhaustively; the current version (spec:380–390) states that reasoning *"is false in
   both directions: FR-O1's list contains an event that is not a whisper trigger (session
   start) and omits two the oracle acts on (`StopFailure`, `SubagentStop`)."* That is
   correct and is verified against spec:78–82, 95–100 and 105–106. It is recorded here
   because S6 rests on the same enumeration and the reader should know the document already
   agrees the list is not a closed trigger set.

---

## What's Actually Good

Each entry names the property, the standard it is good by, and how the property was
verified.

1. **Every ROSE quotation is verbatim, and the paper is the one the spec claims.**
   Property: eight quoted fragments reproduce the source exactly. Standard: evidentiary
   integrity — a quotation in a normative document is a claim that the source says this.
   Verification: the PDF was fetched from `thomas-zimmermann.com`, confirmed to be the
   17-page TSE 31(6) version rather than the 10-page ICSE 2004 paper, text-extracted
   (68,681 chars), and each fragment string-matched — the >30-entity rule, the
   outdated-transactions sentence, the full threshold-setting sentence pair, the precision
   figure, the false-alarm figure. The one figure the spec paraphrases rather than quotes
   ("at support 1 and confidence 0.1 the same study measured precision of 0.30") also
   matches: *"ROSE achieves for a support count of 1 and a confidence of 0.1 a feedback of
   0.64 and a precision of 0.30."* On a project whose collapse log records repeated
   citation failures, this is the axis that held.

2. **The hooks claims are substantively correct against the current contract.**
   Property: the four load-bearing harness facts are true today. Standard: `CLAUDE.md`'s
   external-facts rule. Verification against the primary source, not the spec's summary:
   the lifecycle cadences ("once per session… once per turn: `UserPromptSubmit`, `Stop`,
   and `StopFailure`… on every tool call") confirming both `FR-O1`'s grouping claim and
   `P0-1`'s `StopFailure` classification; `stop_hook_active` defined at hooks.md:2194 as
   *"true when Claude Code is already continuing as a result of a stop hook"*; the
   continuation cap confirmed at hooks.md:2194 and 2271 (*"the `stop_hook_active` input and
   the 8-consecutive-continuation cap"*), which validates `FR-O4a`'s deliberate refusal to
   depend on the cap's value; and `additionalContext` delivery at `PreToolUse` without a
   permission decision, confirmed at hooks.md:842 and by the decision table at 1548–1553.

3. **Four open items the v1 spec assigned to this document are genuinely closed.**
   Property: each was a named defect upstream and is resolved here. Standard: defect-closure
   discipline — a derived document resolves the open items its parent hands it. Verified by
   reading both sides of each: v1 §14's *"Per-consumer state's phase… Settle before the
   state model is designed"* → `P0-2` (spec:107–110); v1 §14's *"FR-A5's evidence-floor
   gloss is loose… the gloss then enumerates 'the Warning genre' wholesale"* → `FR-A5b`
   binds only *"on history-derived evidence"* and `P0-4`/`P0-D-3` make the generated-file
   exemption explicit (spec:195–196, 206–208, 357–360); v1 §14's *"§6.3 gives `status` the
   degraded-mode state to report"* → §10 (spec:339–341) gives `status` health and
   measurements only; v1 §14's *"AC-18's induced-failure list includes a blocked model
   path"* → `AC-13` (spec:449–452) lists broken hook wiring, corrupted store and a killed
   service, with no model path.

4. **`P0-D-7` and `P0-D-8` record their own reversals instead of quietly restoring the
   requirements.** Property: each decision states that an earlier draft deleted the
   requirement and why that reasoning was wrong. Standard: auditable provenance — a
   reversal that erases its own history is one the next session re-litigates. Verified by
   Read of spec:380–398 against `git diff 64c6249 3edc61f`. `P0-D-8`'s technical content
   is also correct and non-obvious: *"a pair seen three times out of three clears support
   ≥ 3 and confidence 1.0 in a repository with eight commits"* is exactly why a per-pair
   floor cannot substitute for a corpus minimum, and it is the reason C1 above judges
   `P0-D-8` the surviving decision rather than `P0-D-6`.

5. **`AC-2b` tests the mission clause rather than a genre firing.** Property: it is a
   differential test — same event, same store, the fact in the consumer's read set versus
   not — which isolates marginal value from genre coverage. Standard: test design; a
   criterion that varies one input and asserts opposite outcomes discriminates, where a
   criterion asserting "a whisper appears" does not. Verified by Read of spec:411–416 and
   of `FR-A5a` at 179–187. This is the direct remedy for `collapse-log.md:261–271`
   (2026-07-30 item 1, "the send bar had no term for 'could the agent have got this
   itself?'"), and it is the first criterion in either spec that tests the bar rather than
   the pipeline.

---

## Convergence Record

First-round review — convergence tracking begins at round 2.

---

## Recommended Priority

Ordered by engineering consequence, not by effort. The first two block the Phase 0
architecture; the rest block Phase 0's exit or its approval.

**Blocks the architecture — fix before any design work begins.**

1. **C1 — delete `P0-D-6`.** One deletion. Until it is gone, §11 instructs the architect to
   remove `FR-A6`, and the corpus floor is the control that keeps the ROSE operating point
   from being applied outside the conditions it was measured in. Cheapest fix in the list
   and the highest-consequence one.
2. **C2 — resolve the identifier collision**, preferably by prefixing the Phase 0 criteria
   `P0-AC-n` and deleting §1's "identifiers are shared" sentence. Do it before the
   architecture is written, because the architecture will cite these identifiers and the
   closure ledgers will cite the architecture. Correct `CLAUDE.md:19`, `collapse-log.md:379`
   and v1 §12's exit line in the same change.
3. **S6 — give the session service a termination event.** `C-2` mandates a warm per-session
   process and the architect cannot design its lifecycle from a spec that defines only its
   creation.

**Blocks the exit.**

4. **S3 — add criteria for `FR-X6`, `FR-K6` and `FR-X4` at minimum**, and state explicitly
   which of the remaining seventeen are verified by inspection. `FR-X6` first: it is the
   sole mechanism behind the one owner-facing obligation §1 states.
5. **S2 — replace "without incident"** with an exit read off `P0-6`'s own numbers. This and
   item 4 together are what make Phase 0 completable by evidence rather than by impression.
6. **M6, M4 — restore the missing numbers and annotations** (token budget default; support
   ≥ 2 and the 3 s ceiling as `[P0-D-n]` entries).

**Blocks approval and trust.**

7. **S4 — re-derive all eight citation ranges by opening `RETHINK.md` at each range and
   reading it end to end.** Do this as one pass over the whole document rather than eight
   patches; the generator is the practice, not the individual ranges. Note that a dedicated
   citation-verification commit (`35c70cd`) preceded this review and these eight survived
   it — so the second pass needs a different method than the first, specifically reading
   the span rather than confirming the phrase.
8. **S1 — quote the cost.** One sentence. It is the difference between the owner approving
   a warning channel he understands and approving one he does not.
9. **S5, S7 — remove the two inherited scope claims** (warning priority; deferral-for-lack-
   of-a-criterion). Both are the shapes the collapse log exists to catch, and both are
   cheap to remove now and expensive to remove after the architecture consumes them.
10. **M1, M2, M3, M5, M7, M8, m1, m2, m3** — the remainder, in any order. M3 and M7 are
    each a two-line edit with disproportionate downstream effect.

One process note for whoever executes this: per `CLAUDE.md`, apply **all** findings, and
re-enter review as a Post-fix round whose inventory is this review's inventory plus the fix
diff plus these findings as closure items.

---

Verdict: NEEDS FIXES (20 findings: 1 Critical-Systemic, 1 Critical, 1 Serious-Systemic, 6 Serious, 8 Moderate, 1 Minor-Systemic, 2 Minor)
