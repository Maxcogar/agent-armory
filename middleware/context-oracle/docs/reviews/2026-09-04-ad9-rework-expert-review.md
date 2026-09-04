# Expert review — the 2026-09-04 AD-9 rework (`docs/architecture-phase-a.md`)

**Verdict: NEEDS FIXES (6 findings: 2 Serious, 2 Moderate, 2 Minor).**

Independent review. I did not write the work under review. Judged against the
governing spec (`docs/specs/spec-context-oracle.md` §8/§11.5/§12/§14), the owner
ledger (`OWNER-LEDGER.md` OL-C3/OL-C5), and `CLAUDE.md`'s three dominating rules —
never against "it reads fine" and never against the prior rounds' patterns.

---

## Scope and Inventory

**Round.** This is the **first** review of the 2026-09-04 AD-9 rework. The ten
prior rounds reviewed the now-superseded classifier design; the artifact they
reviewed no longer exists, so their findings are **not** carried as closure items
(a Post-fix review re-derives closure against the *same* artifact; this is a new
artifact). Convergence tracking for the rework begins here.

**Files verified (Read or grep, with citation):**
- [x] `middleware/context-oracle/CLAUDE.md` — Read in full (the three dominating rules; rule 2 collapse test; rule 3 goal-first).
- [x] `docs/STATUS.md` — Read in full (Phase A goal; the rework's "what to do next").
- [x] `docs/collapse-log.md` — Read in full, both halves (esp. 2026-09-04, and rounds 6–9 on the prior AD-9).
- [x] `OWNER-LEDGER.md` — Read in full (OL-C3 at line 68, OL-C5 at line 70; CONFIRMED list searched for a frequency claim — none present).
- [x] `docs/architecture-phase-a.md` — the full `git diff` (uncommitted) Read; current-state Read of AD-9 (745–1063), AD-4 `questions`/`closed_by_kind` DDL (459–483), AD-10 (1064–1085), AD-18 (1422–1451), AD-24 (1654–1665), traceability (2080–2094), L1 (2098–2101 + diff), Gate A poisoning analysis (1932–1953), AD-1/AD-9 process-flow step 4 (line 200, via diff), Chain 2 and the Status entry (via diff). Grep of the whole body (lines 1–2245) for orphaned taxonomy terms (`kind='info'`, `'request'`, `direct_recognized`, `communicative`, `information-object`, `artifact-object`, `wh-complement`, `head extraction`, `coordinated`, `info/request`, `deny-capable`, `sound`) with per-hit read.
- [x] `docs/specs/spec-context-oracle.md` — §8 (326–545), §11.5 (739–777), §12 D-39/D-41 (854–873), §14 AC-2a/AC-2a-i/AC-2a-ii/AC-2b/AC-2c/AC-8/AC-8a/AC-9 (940–1047); AC-12 verified via traceability + spec cross-ref.

**Scope boundary.** This review covers AD-9 and its **declared blast radius**
(schema AD-4, AD-18, AD-20, AD-24, Chain 2, Gate A, Limitations L1, traceability
AC-2c, process-flow) plus the cited spec sections. Decisions **untouched** by the
rework and not cited by AD-9 (AD-1–AD-8, AD-11–AD-17, AD-19–AD-23, AD-25, AD-26)
are out of scope; per `docs/STATUS.md` they stand on the round-10 expert PASS.

**Tool plan (Step 3).** Instruments available: Read, Grep/Bash-grep, Glob, `git
diff`. Claim-type mapping: literal-content → Read at file:line; orphan/absence →
grep across the body + read of each hit; citation-resolution → Read the cited spec
§; internal-consistency → Read both sites; upstream-contract → Read spec §8/§11.5/
§12/§14. **Context7** — not needed: nothing under review is a library-behavior
claim (the rework changes a design's spec-conformance, not any API; the hooks-
contract premises V1/V5/V12/V19 are unchanged by the rework and not what is being
attacked). **CodeGraph** — N/A (design document; structural claims here are about
the document's own internal references, resolved by grep/read). **Test runner** —
N/A. No load-bearing claim category is stranded, so no halt condition.

**Reasoning-support tools.** The Clear Thought MCP (`metacognitivemonitoring`,
`collaborativereasoning`) is **not available** in this session's tool roster.
Per the skill's infrastructure-failure clause the two mandatory checks were
performed manually and are recorded here as a procedural observation:
- *Metacognition (know vs infer).* Verified from source: the rework text, schema,
  spec sections, ledger, the two orphans, the process-flow "proxy" framing, the
  detector definitions. Inferred (marked in-finding): how often real agents mutate
  without narrating (Finding 3's behavioral colour) — but Finding 3's **load-bearing
  core** (the two named detectors cannot fire on a deny that precedes any answer
  text) is derived from the detectors' own definitions in AD-9, not inferred.
- *Multi-perspective (standards / downstream plan-writer / implementer).* Standards:
  every finding ties to a spec clause or a `CLAUDE.md` rule. Downstream: each finding
  carries a concrete fix. Implementer: Finding 2 (orphans) would actively mislead a
  build (unit-testing a classifier that no longer exists); called out as Serious for
  that reason. No perspective-specific gap remained.

**Rigor waivers.** None requested.

---

## Summary

**This review returns NEEDS FIXES.** The rework's **design direction is correct
and genuinely serves the Phase A goal**: it deletes the coverage-maximizing
info/request classifier (the 2026-09-04 slop), reduces the deny predicate to two
structural facts that are *more* auditable than before, owns the over-fire as one
property-defined class rather than a growing enumeration, and keeps the AD-10
confinement and the `qa/state.ts` Phase B seam intact. That is the honest skeleton
the spec asks for. **But the document re-commits, in prose, the exact disease it
was written to cure.** At the center of the reworked mechanism it *asserts* a
safety property it cannot establish and its own collapse-test premise contradicts
— "denies **only** moves clearly not directed at answering," "**sound** on two
structural facts," "**not a regression**" on the safety axis — when the recognizer
knowingly denies answer-directed fix-edits, which §11.5/D-41/FR-B5 say the Phase A
recognizer must not do. This is the round-9 "narrow mechanism inflated with a
guarantee broader than its requirement" pattern (`collapse-log` 2026-09-03 round 9),
reappearing as rhetoric instead of machinery. Separately, the taxonomy-removal
blast radius was applied by sampling, not sweeping: two orphaned references to the
deleted "info/request classifier" survive (AD-24 unit tier; Gate A poisoning
analysis), falsifying the Status entry's "blast radius applied across … AD-24 …
Gate A." Two Moderate and two Minor findings round it out. The fixes are almost all
subtractive/clarifying — the design need not change; the claims must be brought down
to what the skeleton can honestly back.

---

## Upstream Contract Verification (Step 7)

Governing spec = `docs/specs/spec-context-oracle.md`; governing ledger =
`OWNER-LEDGER.md`. Each criterion checked against the **verified current** AD-9
text.

| Contract item | Status | Method |
|---|---|---|
| **OL-C5** (answer-drift trigger definition) | Honored as the trigger | Read OWNER-LEDGER.md:70; AD-9 Job/Standard cite it as the rule enforced |
| **OL-C3** (a block exists for answer-drift) | Honored | Read OWNER-LEDGER.md:68; AD-9 realises a reactive deny |
| **§8 FR-B1** (reactive deny of the deviating action, per-consumer, main agent) | Honored | Read spec:355–384; AD-9(b) main-consumer, PreToolUse deny |
| **§8 FR-B2** (self-clearing; a text turn is never denied) | Honored | Read spec:396–405; AD-9(b) "a text answer is never a tool action" |
| **§8 FR-B5** ("a move that plausibly *is* answer-directed, is not denied") | **VIOLATED (as claimed-satisfied)** | Read spec:436–447; AD-9(b) denies fix-edits that plausibly are answer-directed — **Finding 1** |
| **§11.5** ("safe — it rarely denies a compliant agent"; "fires only on a move *clearly* not directed at answering") | **VIOLATED (as claimed-satisfied)** | Read spec:744–762; AD-9(b)/collapse-test assert compliance — **Finding 1** |
| **§11.5** ("ships the honest minimum … never by reviewing an imagined-phrasing classifier into apparent completeness") | Honored (the drop) | Read spec:757–762; verbatim, supports removing the classifier |
| **§11.5 exit** (measured whisper/block + false-fire data on a real repo, incl. how little it catches) | Partially — measurement of the core over-fire is overstated | Read spec:751–753; **Finding 3** |
| **§12 D-39** (read/search/test to get the answer never denied) | Honored (literal class) | Read spec:854–860; AD-9(b) allows Read/Grep/Glob/Bash. Note: D-39's *principle* via OL-C5 (a fix-edit as the answer-providing action) is the axis Finding 1 addresses |
| **§12 D-41** ("clearly-non-answer-directed moves only — safe, low-coverage") | **VIOLATED (as claimed-satisfied)** | Read spec:861–872 — **Finding 1** |
| **§14 AC-2a** (deny plumbing, state fixture-controlled; recognizer precision is AC-2a-ii/Phase B) | Passable as a fixture test | Read spec:940–954; the unrelated-work fixture is denied. The recognizer's precision is explicitly Phase B, so denying fix-edits is not an AC-2a *test* failure — but §11.5/D-41 still bind the move recognizer's conservatism (Finding 1) |
| **§14 AC-2a-i** (main-agent-scoped; `Task` allow-half Phase A, deny-half Phase B) | Honored | Read spec:955–960; AD-9(b) + traceability 2086 |
| **§14 AC-2a-ii** (substantive per-question clear = Phase B) | Honored (deferred) | Read spec:961–968; AD-9(c) defers per-question matching |
| **§14 AC-2c** (over-fire surfaced; under-fire human channel) | Honored, but see Finding 3 on the over-fire's real measurability | Read spec:979–999; AD-9 detection + AD-18 |
| **§14 AC-8a** (outstanding-question line at done-claim, best-effort) | Honored | Read spec:1024–1034; AD-9 Stop-time backstop |
| **§14 AC-9 / AC-12** (self-observability; deterministic plumbing model-free) | Honored | Read spec:1035–1047; detectors + traceability 2091 |
| **CLAUDE.md rule 2** (collapse test, honest, before acceptance) | **Compromised** — the collapse-test *answer* overclaims | AD-9 lines 760–781 — Finding 1 |
| **CLAUDE.md rule 3** (goal-first; a claim that only passes review is a finding) | **Compromised** — the "not a regression"/"sound"/"only" claims are review-facing polish | Finding 1 |
| **OWNER-LEDGER discipline** (no owner attribution absent a CONFIRMED row) | **VIOLATED** | "Max's most common question shape is an action request" has no row — **Finding 4** |

---

## Critical & Serious Findings

### SERIOUS 1 — The move recognizer's central claim ("denies **only** moves clearly not directed at answering" / "**sound**" / "**not a regression**") overclaims a safety property the skeleton cannot back and its own premise contradicts.

**Location.** AD-9 §1(b), line 855–868: *"the move is judged by the Phase A move
recognizer, **which denies only moves clearly not directed at answering** (`§11.5`,
`D-41`): the deny-eligible set is exactly the repo-mutating file tools … The deny is
**sound on two structural facts, no comprehension** … so it denies **every** repo
mutation … [including] a mutation that *is* the answer (an edit fulfilling 'can you
fix X?')."* And the collapse-test answer, line 780–781: *"Dropping the taxonomy
converts an assumed-safe classifier into a measured-floor skeleton — which is the
Phase A goal, **not a regression**."*

**What the doc does now / how verified.** Read at the lines above. Within eleven
lines AD-9(b) asserts both **X** ("denies only moves clearly not directed at
answering") and **¬X** ("denies every repo mutation … [including] a mutation that
*is* the answer"). A fix-edit that *is* the answer to "can you fix X?" is a move
**directed at answering**; denying it means the recognizer does **not** deny "only"
clearly-non-answer-directed moves. The document's own process-flow already states
the honest version — line 200 (Read via diff): repo mutation is *"the model-free
**proxy** for 'clearly non-answer-directed'"* — so AD-9(b) contradicts §1's own
upstream step.

**Which standard it violates and why it matters.**
- **§11.5** (Read spec:744–749): the Phase A recognizer "fires only on a move
  *clearly* not directed at answering" and "errs hard toward not-firing — **safe**
  (it rarely denies a compliant agent)." A recognizer that denies the compliant
  fix-edit — in what the doc itself calls "Max's most common question shape" — is
  not "safe" by §11.5's own definition (rare wrongful denial of compliant agents).
- **§12 D-41** (Read spec:861–866): "a conservative recognizer (**clearly-non-
  answer-directed moves only** — safe, low-coverage)."
- **§8 FR-B5** (Read spec:436–441): "a move that **plausibly *is* answer-directed,
  is not denied**." The fix-edit plausibly is answer-directed; it is denied.
- **CLAUDE.md rule 3** + **`collapse-log` 2026-09-03 round 9**: "a narrow mechanism
  inflated with guarantees broader than the requirement." Deny-all-mutations is
  inflated with the guarantee "denies only clearly non-answer-directed" and the
  adjective "**sound**" (logical soundness = the deny is *correct*; the deny is
  knowingly *incorrect* in the common case — the correct word is "deterministic" or
  "structurally decidable"). This is the same **assert-instead-of-measure** disease
  the rework was created to cure — now in prose rather than in a lexicon.

The design is *not* the defect — deny-all-mutations-with-measurement is a legitimate,
goal-serving resolution of a genuine spec tension (§11.5 wants both "rarely denies a
compliant agent" *and* "false-fire data from a real repo," which pull apart for a
model-free recognizer). The defect is that the document **claims to satisfy both**
instead of honestly stating which it sacrifices. Whether the skeleton "rarely denies
a compliant agent" is **itself a Phase-A measurement outcome**, not a design-time
guarantee — asserting "not a regression" pre-empts the very measurement §11.5
mandates.

**Concrete fix.** Bring AD-9(b), the collapse-test answer, and the "Standard/spec
anchor" (line 1019–1029) down to line 200's framing:
1. Replace "denies **only** moves clearly not directed at answering: the deny-eligible
   set is exactly the repo-mutating file tools" with: repo mutation is a
   **deliberately coarse, over-including model-free proxy** for "clearly not directed
   at answering," chosen because the model-free classifier that tried to be precise
   was fake (2026-09-04); the proxy **knowingly denies some answer-directed edits**,
   which is the owned residual.
2. Replace "**sound** on two structural facts" with "**deterministic / structurally
   decidable** from two facts" (keep the genuine testability claim; drop the
   correctness connotation). Fix the echo at AD-18 line 1441 ("the deny path's
   soundness") the same way.
3. Replace "**not a regression**" with an explicit concession: this skeleton
   **does not deliver §11.5's "rarely denies a compliant agent" as a design-time
   property** — that safety is restored in Phase B; Phase A instead **measures** the
   wrongful-deny rate, and whether it is in fact rare is a Phase-A exit datum.

---

### SERIOUS 2 — Two orphaned references to the deleted "info/request classifier" survive, falsifying the Status entry's blast-radius completeness claim.

**Location & how verified.** Grep of the body for `info/request` (5 hits), each Read:
- **AD-24, line 1657–1661** (unit-test tier): *"recognizers (question/clear/move/
  done-claim lexicons and the **info/request classifier** against a labeled corpus
  **derived from the clause-(iv) rules** …)"*. Both referents were **removed** by the
  rework: there is no info/request classifier, and the opener now has clauses (i)–(iii)
  only — **there is no clause (iv)** (Read AD-9(a) lines 805–826). This same AD-24
  section's *integration* tier (Read via diff, lines 825–849) was correctly updated to
  "the three recognizers and the owned over-fire, **no kind taxonomy**" — so AD-24 is
  **internally inconsistent**: unit tier describes the deleted design, integration tier
  the new one.
- **Gate A / scientific-method poisoning analysis, line 1942–1946**: *"whose rows are
  created at runtime by exactly **three** openers, each running **the same info/request
  classifier**."* The openers now run the **question recognizer** (?/code-quote/
  stoplist), not any info/request classifier.

**Which standard it violates and why it matters.** The Status-of-architecture entry
(Read via diff, lines 1082–1084) asserts *"Blast radius applied across the schema
(AD-4), AD-18 `--missed-question`, AD-20 `tune`, AD-24 fixtures, the numbered
reasoning chain (Chain 2), Gate A, Limitations L1, and the traceability AC-2c row."*
Two of the eight named targets (AD-24, Gate A) still cite the removed mechanism, so
the completeness claim is **false** — precisely the "verify before you assert /
applied-all-findings must re-check that none were dropped" failure `CLAUDE.md`
names as this workspace's most damaging recurring one, and the "a fix that names a
location must land at that exact location" lesson (`collapse-log` 2026-09-03 round 6).
An implementer reading AD-24 would try to unit-test a classifier that no longer
exists.

**Concrete fix.** (a) AD-24 unit tier: strike "and the info/request classifier
against a labeled corpus derived from the clause-(iv) rules"; the illustrative-corpus
note, if kept, must attach to the opener's stoplist, not to a deleted classifier.
(b) Gate A line 1943: "each running the same **question recognizer**" (not
"info/request classifier"). (c) Re-audit the other six named targets by reading each,
then correct the Status claim to match what a read establishes.

---

## Systemic Patterns

No systemic pattern across the codebase. The two orphans in Finding 2 are the same
*type* of miss (a sampled-not-swept blast radius) but are confined to this one
rework's taxonomy removal, not a pattern propagating across files — verified by grep
of the full body for every taxonomy term (`kind='info'`/`'request'`/`direct_recognized`/
`communicative`/`information-object`/`artifact-object`/`wh-complement`/`head extraction`/
`coordinated`/`info/request`), which returned hits only in (i) sections that
*describe the removed classifier* (AD-9 Job/What-this-is-NOT, Chain 2, Status) and
(ii) the two Finding-2 orphans. The schema (`questions`/`closed_by_kind`), AD-18,
AD-20, L1, and traceability AC-2c are clean.

---

## Moderate & Minor Findings

### MODERATE 3 — "Measured on the wrongful-deny rate" overstates Phase A's measurement of the core over-fire.

**Location.** AD-9 "over-fire residual," line 903–905: *"**measured on the
wrongful-deny rate**, which is precisely the discovery data Phase A exists to hand
Phase B"*; L1 line 1027 repeats it.

**What the doc does / how verified.** Read AD-9's two automated wrongful-deny
detectors (lines 924–942): `deny_after_answer_lag` fires only when an answer's
timestamp **precedes** an emitted deny; `deny_despite_answer_text` fires only when
"≥ N denies … accumulate … with **≥ 1 intervening assistant text turn since the
newest question opened**." The **central** over-fire — a "can you fix X?" question
opens at intake, the agent's first move is the fix-`Edit` (deny), then one narration
turn clears it — has **zero** answer text before the deny and is a **single** deny.
By the detectors' own definitions it triggers **neither**. So the over-fire rate is
carried only by Max's manual `ctxoracle correct` (the human channel), and Phase A
**cannot** automatically tell a wrongful fix-edit deny from a correct unrelated-work
deny — that is the comprehension judgment deferred to Phase B.

**Why it matters.** `CLAUDE.md` rule 1 and the doc's own discipline (line 963–965:
"a proxy never as a measurement"; line 981: `deny_bypass_suspect` labelled "a
**proxy**, not a measurement") demand that a proxy not be presented as a
measurement. The over-fire's rate on real repos rests on a non-programmer owner
noticing that his *compliant* agent was denied and escaped in one turn — an
inherently weak, likely under-counting signal (FR-B5's human channel is designed for
*under*-fire, where Max sees *his own* unanswered question, not for over-fire).
Presenting it as "measured on the wrongful-deny rate" without this caveat repeats
the "absence of measurement displayed as health" risk the doc elsewhere guards
against — and it weakens the "owned **and measured**" justification that Finding 1's
tolerance argument leans on.

**Concrete fix.** State plainly, in AD-9's over-fire section and L1: Phase A **cannot
auto-detect** the core over-fire (fix-edit-is-answer needs comprehension → Phase B);
the two automated detectors catch only the *lag* and *persist-after-text* sub-cases;
the over-fire rate is therefore measured via **Max's `ctxoracle correct` (human
channel) plus the raw deny rate**, and is expected to under-count — the honest floor,
labelled as such, not "measured on the wrongful-deny rate" unqualified.

### MODERATE 4 — Unverified owner-attribution: "Max's most common question shape is an action request."

**Location.** AD-9 collapse test, line 761–762: *"Max's most common question shape
is an action request ('can you fix X?')."* Stated declaratively as fact.

**How verified.** Read `OWNER-LEDGER.md` in full: OL-C3 (line 68) and OL-C5 (line 70)
define *what* answer-drift is; **neither says anything about frequency or Max's most
common shape**, and no CONFIRMED row does. Grep/read of the CONFIRMED list confirmed
no frequency claim.

**Why it matters.** `CLAUDE.md`: any owner-attributed claim is authoritative "only
if it is under CONFIRMED there." Owner-fact invention is this project's single most
logged failure class (`collapse-log` 2026-08-25 item 2 — "an owner fact nobody
confirmed, doing load-bearing work"; 2026-08-01 item 1). This instance is
**non-load-bearing and safe-direction** (it makes the skeptic's objection *harder*,
not the design look better) — but "being wrong in the safe direction is still being
wrong" (`collapse-log` 2026-08-01 item 10), and an unconfirmed owner-behavior
assertion sitting inside the rule-2 collapse test is exactly where the discipline
must hold.

**Concrete fix.** Rephrase to a hypothetical that costs the argument nothing:
"*Even if* action-requests like 'can you fix X?' are common, this skeleton opens on
the `?` and denies the fixing edit …". Drop the factual claim about Max's behavior.

### MINOR 5 — The stated deny reason cannot say what the doc claims it "invites," and misguides in exactly the over-fire case.

**Location.** AD-9(b) line 875–876: reason = *"answer Max's question first: `<the
open question text(s)>`"* with the gloss *"(the reason invites an answer *or a stated
plan*)"*; repeated as "escapable by … a stated plan" (line 902, L1 line 1026).

**How verified / why it matters.** Read the reason string: it contains only "answer
Max's question first: <q>" — it does **not** mention a plan, so the parenthetical
misdescribes the emitted text (§8 FR-A2l fixes this reason verbatim, spec:360). For a
request-interrogative the literal instruction "answer … : can you fix X?" points the
agent at doing the fix — the blocked action — while the actual escape (any substantive
narration) is unstated. The escape still *works* for a capable agent (narration clears
via the coarse clear recognizer), so this is Minor, but the mismatch weakens the
"trivially escaped" claim borrowed from FR-B5 (whose "the agent answers, which it
should do anyway" was written for **text** answers to **information** questions).

**Concrete fix.** Either drop the "or a stated plan" gloss (the reason string does
not carry it), or note honestly that the reason may misdirect on a request-shaped
interrogative and that the escape is any substantive text; and stop citing FR-B5's
"trivially escaped (the agent answers)" as support for the *action*-answer case.

### MINOR 6 — Small consistency/citation nits.

- **Opener count.** AD-9(a) line 809: "It runs at **two** openers"; Gate A line 1942:
  "exactly **three** openers." Reconcilable (two runtime recognizer sites vs. three
  row-creation sites incl. the CLI), but the bare numbers read as a contradiction —
  scope each ("two recognizer openers" / "three row-creation sites").
- **"lexicon" mislabel.** AD-24 line 1657 lists "question/clear/**move**/done-claim
  lexicons"; the move recognizer has **no** lexicon (a fixed `Write`/`Edit`/
  `NotebookEdit` tool-name set). Verified against AD-9(b) line 858–859.
- **Quoted-but-not-verbatim.** Chain 2 (diff line 881) quotes *"a skeleton, not the
  working block"*; the spec says *"a skeleton, not 'the block working'"* (spec:749,
  749). Same meaning, but presented in quote marks with the words reordered — in a
  project this exacting on citation fidelity, quote it verbatim or paraphrase without
  quote marks.

---

## Tentative Findings

None. Every finding's premise was verified against current source (Read at the cited
file:line, or grep with the query and per-hit read). Finding 3's one behavioral
colour (real agents' narrate-before-mutate frequency) is explicitly *not* relied on;
its load-bearing core is derived from the detector definitions in AD-9.

---

## Observations (no standard violation)

- The clear recognizer clears **all-prior on any substantive text**, so on real repos
  the block only fires when an agent mutates with *no* intervening substantive text
  since a question opened. The measured firing rate will thus be entangled with agent
  narration habits as much as with answer-directedness. This is a pre-existing,
  spec-acknowledged Phase-A property (AC-2a-ii → Phase B; L2), not introduced by the
  rework, and even the degenerate outcome ("the block catches almost nothing because
  narration pre-clears") is itself honest §11.5 floor data — so it is an observation,
  not a finding. It is worth Phase A explicitly anticipating in its exit analysis.
- `collapse-log` 2026-09-04 says the collapse-hunt on the prior AD-9 was never run and
  the rework "awaits a fresh independent pair (an expert review *and* a
  collapse-hunt)." This document is the expert-review half; the paired collapse-hunt
  is still owed before the rework is trusted (per `docs/STATUS.md` next-step 2).

---

## What's Actually Good (verified against a named standard)

- **The deny-predicate simplification measurably improves structural testability.**
  Removing the `kind` gate makes the deny predicate "≥ 1 `open` question ∧ tool ∈
  {Write,Edit,NotebookEdit}" — both operands structural — emitted from the single
  producer AD-10 confines. Verified against AD-10 (Read lines 1064–1073: one caller,
  import-graph + built-output structural test) and AD-4 (Read lines 470–472: the
  `kind` column is gone, `closed_by_kind` CHECK correctly reduced to
  `generic_text_all_prior`/`expired`/`intake_invalidated`). Standard: ISO 25010
  analysability — the property is checkable without a fallible classifier being
  correct, which the old "≥ 1 `kind='info'`" predicate required. This is a genuine
  gain, not merely functional.
- **The over-fire is correctly owned as one property-defined class, not an
  enumeration.** Verified at AD-9 lines 899–901 and L1 lines 1023–1025. This applies
  the `collapse-log` 2026-09-03 round-8 lesson 2 ("own it as a class") and round-9
  reframe directly, and removes the "N member shapes" accretion that was the prior
  design's symptom.
- **The taxonomy removal is thorough where it counts.** The schema, AD-18
  (`--missed-question` correctly reduced to *two* limits), AD-20 (`tune` lexicons
  correctly reduced to the stoplist + command-classification), L1, and traceability
  AC-2c are clean — verified by grep across the body + read of AD-18 (1422–1443) and
  the AD-4 DDL. The two orphans in Finding 2 are the exception, not the rule.

---

## Convergence Record

First-round review of the reworked artifact — convergence tracking begins here. The
ten prior rounds reviewed the superseded classifier and do not form a trajectory
with this pass (different artifact). Trajectory to date for the rework: **R1: 6
(2 Serious, 2 Moderate, 2 Minor).** First-round: the non-convergence tripwire is not
evaluable until round 2.

---

## Recommended Priority

1. **Finding 1** first — it is the load-bearing honesty defect and the one a
   collapse-hunt will attack hardest. Fixing it is *subtractive*: align AD-9(b)/
   collapse-test/Standard-anchor with the process-flow's existing "proxy" framing,
   drop "only"/"sound"/"not a regression," and concede the §11.5 "rarely denies a
   compliant agent" cost as a Phase-A measurement rather than a guarantee. This is
   also what makes Finding 3's caveat land, so do them together.
2. **Finding 2** — mechanical but implementer-facing and it falsifies a written
   completeness claim; re-read all eight Status-named targets, not just the two named
   here, before re-asserting the blast-radius claim.
3. **Findings 3–4**, then the Minors.

None of these require changing the design. The direction — an honest deterministic
skeleton that measures its floor with a clean Phase B seam — is right and serves the
Phase A goal. What must change is the document's tendency, at the exact points that
matter most, to *state* a property (safe, sound, not-a-regression, measured, blast-
radius-applied) it has not established — the same substitution of assertion for
measurement that the 2026-09-04 lesson exists to stop.

Verdict: NEEDS FIXES (6 findings: 2 Serious, 2 Moderate, 2 Minor)
