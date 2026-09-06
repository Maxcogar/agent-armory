# Expert review — `docs/plans/plan-phase-a.md`

**Date:** 2026-09-06
**Reviewer:** fresh independent /expert-review pass; not the plan-writer, not
the author-gates review's author, not the meta-check subagent.
**Artifact:** `/home/user/agent-armory/middleware/context-oracle/docs/plans/plan-phase-a.md`
(5493 lines, 16 output sections, 43 numbered steps, ~60 test entries).
**Round:** 1 (first review pass of this artifact under `/expert-review`).
**Prior reviews on this artifact this session:**
`docs/reviews/2026-09-06-author-gates-review.md` (author's self-audit) and
`docs/reviews/2026-09-06-meta-check-skipped-steps.md` (meta-check subagent).
The plan-writer applied every content finding from both (commits `bbcd55f`,
`6cb00ce`, `107673c`, `e60293b`, `99be60a`); this review runs against the
current file (post-fix) and does not duplicate closed findings — it hunts
for what those passes missed and re-derives what they closed.

---

## Scope and Inventory

**Round.** 1 (first-round review). Convergence tracking begins at round 2.

**Files in scope (all Read or Grep-verified in this session):**

- [x] `docs/plans/plan-phase-a.md` — the review target. Read lines 1–3000 in
  four Read passes; Read lines 3000–4000 and 4000–5000; Read tail 5000–5493.
  Grep-verified: `**Dependencies.**` occurrences (43, one per step), the
  `hook_field_names_isolated.test.ts` duplication, the T25-* / T26-*
  test-ID enumeration in §12.
- [x] `docs/STATUS.md` — Read in full (109 lines).
- [x] `OWNER-LEDGER.md` — Read in full (80 lines). OL-C1, OL-C3, OL-C5,
  OL-C6 quoted contents verified against §11.3 of the plan.
- [x] `.claude/skills/expert-plan/SKILL.md` — Read in full (390 lines). The
  "no fallbacks" clause (line 35) and the delivery-semantics clause ("A
  plan with any open register entry is not deliverable," line 90) verified
  verbatim against the plan's Q-gap-1/2/5 citations.
- [x] `docs/reviews/2026-09-06-author-gates-review.md` — Read in full
  (386 lines). Provenance reference for prior-round closures.
- [x] `docs/reviews/2026-09-06-meta-check-skipped-steps.md` — Read in full
  (564 lines). Same.
- [x] `docs/architecture-phase-a.md` — Read lines 1–200 (framing +
  V1–V19 verified premises), lines 736–1400 (AD-9, AD-10, AD-11, AD-12,
  AD-13, AD-14, AD-15, AD-16, AD-17, AD-18, AD-19, AD-20); Grep-verified
  all 26 AD-N section headings (count 26, matches plan's Pass D
  attestation).
- [x] `docs/specs/spec-context-oracle.md` — Read §14 Acceptance criteria
  (lines 908–1131). AC-1..AC-25 enumerated and cross-checked against the
  plan's §12.5 mapping table.
- [x] `CLAUDE.md` (project memory) — present in the session's context;
  dominating rules 1, 2, 3 verified against how the plan cites them.
- [x] External: `https://registry.npmjs.org/tree-sitter-wasms` — WebFetch
  this session (2026-09-06), confirmed version 0.1.13 published 2025-10-07,
  no install scripts, WASM files in `out/` directory, 39 grammars shipped.

**Files intentionally not in scope:**

- `RETHINK.md`, `docs/collapse-log.md`, `docs/IDEAS.md`,
  `docs/architecture-context-oracle.md` (historical), and every prior
  review beyond the two same-day reviews on this plan — the plan cites
  them; review of *those documents* is outside this pass.

**Tool plan (Step 3 disposition):**

- **Absence claims** → `Bash ls` and `Grep`. Used for
  `middleware/context-oracle/ctxoracle/` (confirmed nonexistent) and for
  the `**Dependencies.**` enumeration.
- **Literal-content claims** → `Read` at specific file:line ranges. Used
  for every plan-vs-source cross-check.
- **Library-behavior claims** → `WebFetch` (npm registry). Used for
  `tree-sitter-wasms` published state and WASM directory structure.
  Context7 was not consulted for `web-tree-sitter` API detail because
  the plan does not make specific API-shape claims beyond loading a
  grammar file — that is verified adequately by the npm registry result.
- **Structural claims** → `Grep` over the plan (dependency lists,
  AD-N references, test-ID enumeration). CodeGraph is unavailable in
  this environment (confirmed via `ToolSearch` this session — no
  `codegraph_*` tool loadable; plan's Q-gap-1 is factually correct on
  this). For a review of a document (not a codebase), CodeGraph's
  absence is not load-bearing on this review's claim category —
  structural checks over a Markdown file are Grep-tractable, not a
  dependency-graph problem.
- **Multi-perspective check** → Clear Thought is unavailable in this
  environment (confirmed via `ToolSearch` this session — no
  `clear_thought_*` tool loadable; plan's Q-gap-2 is factually correct
  on this). Per this skill's mandate, the multi-perspective check was
  performed manually across three personas (SKILL.md standards
  discipline; the implementer building the plan step by step;
  Max Cogar reading the delivered result). The manual walk is
  recorded here as a procedural observation; the tool-failure
  disclosure is made because the check is mandatory and the vehicle
  is degraded, not because the check itself was skipped.

**Rigor waivers:** none. The user's `/expert-review` invocation had no
compression request.

---

## Summary

This review returns **NEEDS FIXES**. The plan is thorough, structurally
compliant with the `expert-plan` output contract in most respects, and
carries meaningful upstream-verification evidence — but it violates its
own topological-sort claim in a build-blocking way (Step 31 → Step 32),
leaves one of the seven Phase A whisper genres (Verification/FR-A2g)
with no acceptance test for its AC-8 content assertion, and remains
non-deliverable under `expert-plan` SKILL.md's own binding rule ("A plan
with any open register entry is not deliverable") because the plan's own
Q-gap-5 stays open pending Max Cogar's ruling. The two prior reviews
this session — the author-gates review (20 findings applied) and the
meta-check subagent (H1–H8) — caught most of the surface defects; this
pass adds three findings those two did not (S1 topological ordering
violation, S2 missing acceptance coverage for the Verification genre,
M2 test-file duplication ambiguity) and re-derives the standing
halt-condition state as the reason a mechanical delivery gate stays
closed.

---

## Upstream Contract Verification

The plan's upstream artifacts are `docs/specs/spec-context-oracle.md`
(OL-C6-signed 2026-08-28) and `docs/architecture-phase-a.md` (reviewed to
convergence 2026-09-04). Both exist and are cited as authorities.
Verification against those upstream contracts:

**Spec §14 acceptance criteria — Phase A subset (verified by Read of
spec §14, lines 908–1131, this session):**

| AC | Content requirement | Plan mapping (§12.5) | Verification method | Verdict |
|---|---|---|---|---|
| AC-1 | Non-obvious coupling pair, evidence ratio, pointer | T25-1 | Read T25-1 spec (§12.3) — asserts non-obvious pair fires, obvious pair does not, evidence ratio present, pointer resolves | Honored |
| AC-1a | Orientation: 2–4 entry points + one binding invariant | T25-2 | Read T25-2 — asserts count ∈ [2,4] + invariant | Honored |
| AC-1b | Reuse: convention headline, incomparable-set silence, false-positive caveat | T25-3 | Read T25-3 — asserts dominance, silence, caveat | Honored |
| AC-1c | Consequence: coupled tests + zone flag; not raw call-site count | T25-4 | Read T25-4 — asserts headline shape | Honored |
| AC-1d | Completeness: unchanged partner, delivered via additionalContext | T25-5 | Read T25-5 — asserts partner named, delivery channel | Honored |
| AC-2 | Deny confinement (structural) | T15-2 | Read T15-2 — `dist/` grep | Honored |
| AC-2a | Answer-drift plumbing (intake-then-deny) | T16-1, T16-2 | Read T16-1/T16-2 | Honored |
| AC-2a-i (allow-half) | Subagent not denied | T16-3 | Read T16-3 | Honored |
| AC-2c (over-fire) | Reads not denied while question open | T17-1 | Read T17-1 — asserts lag hold + self-recovery; AC-2c over-fire is broader than T17-1 covers | **Partial** (see M5) |
| AC-3 | Two above-bar candidates both deliver | T25-6 | Read T25-6 | Honored |
| AC-3a | Hazard below confidence floor delivers with flag | T25-6a | Read T25-6a | Honored |
| AC-4 | Marginal value + dedup + trigger relevance | T25-6b | Read T25-6b | Honored |
| AC-5 | Session-boundary dedup per D-20 | T30-1 | Read T30-1 | Honored |
| AC-6 | Corpus floor | T25-7 | Read T25-7 | Honored |
| AC-7 | Pristine tree after init/deinit | T31-1..T31-3, T32-1 | Read | Honored |
| AC-8 | **Verification whisper headlines covering-test → changed-region mapping** | **T26-1, T26-2 (classifier), T25-5 (Completeness Stop)** | **Read all three** — T26-* tests the ternary command classifier (a supporting mechanism), T25-5 tests the Completeness genre, not the Verification genre. **No T-ID tests the Verification-genre whisper's headline content** | **Violated** (see S2) |
| AC-8a | Outstanding-question line at done-claim stop | T19-3, T30-2 | Read T19-3, T30-2 | Honored |
| AC-9 | Self-observability across fault classes | T18-1, T33-1, T10-1 | Read | Honored |
| AC-10 | Fail-open + latency p95 ≤ 1.5s | T29-1, T28-3 | Read T29-1, T28-3 | Honored |
| AC-11 | Security: secrets/injection/trust | T40-1 | Read T40-1 | Honored |
| AC-12 (Phase A parts) | Model path down: deterministic parts still work | T16-1, T17-1, T29-1 | Read | Honored |
| AC-13 | Store hygiene | T20-1, T37-1 | Read T20-1, T37-1 | Honored |
| AC-14 | Whisper well-formedness | T27-1 | Read T27-1 | Honored |
| AC-15 | Subagent delivery keyed by agent_id | T40-2 | Read T40-2 | Honored |
| AC-17 | Language breadth (config-added grammar) | T40-3 | Read T40-3 | Honored |
| AC-18 | Exit run delivers seeded facts | T40-6 (via Step 42 exit run) | Read | Honored |
| AC-19 | Export/import record-identical round-trip | T32-2 | Read T32-2 | Honored |
| AC-20 | Cold container install + first index | T40-4 | Read T40-4 (script) | Honored |
| AC-22 | Idle silence (no timer path) | T40-5 | Read T40-5 | Honored |
| AC-23 | Human correction outranks + fact routing | T34-1, T35-1, T35-2 | Read | Honored |
| AC-24 | Regret proxy: TP + no-inflate | T36-1 | Read T36-1 | Honored |

Deferred to Phase B/C per §11.5 (correctly excluded, verified against
spec §14's own phase notes): AC-2a-i (deny-half), AC-2a-ii, AC-2b, AC-2c
(skill under-fire), AC-16, AC-21 (full), AC-25.

**Architecture design decisions — governing decisions honored:**

| AD | What it decides | Plan honors it | Verification method | Verdict |
|---|---|---|---|---|
| AD-1 | One short-lived process per hook event; no daemon | §5.1 has no daemon; Step 28 is per-event | Read plan §5.1 + Step 28 | Honored |
| AD-2 | Node ≥ 22.16.0, TypeScript strict, `node:sqlite` behind single seam | Step 2 floor, Step 3 single-importer, T3-2 confinement test | Read Steps 2, 3, 41 + T3-2 | Honored |
| AD-4 | Uniform table-creation criterion (no dormant tables) | Step 7 explicitly excludes exemplars/recipes/env_capabilities/deferred_queue/genre_state | Read Step 7 | Honored |
| AD-9 | Answer-drift block with Phase B seam | Steps 13–19 build qa/state.ts (read interface stable) + qa/classify.ts (replaceable) | Read Steps 13, 14 | Honored |
| AD-10 | Deny confinement — one producer, structurally | Step 15 (`blocks/verdict.ts`), T15-2 grep, T41-1c convention | Read Step 15, T15-2, T41-1c | Honored |
| AD-11 | Transcript reader — marker-based discrimination | Step 12 uses `origin.kind === 'human'` marker; V12 grounding cited | Read Step 12 | Honored |
| AD-17 | JSONL fault channel + stable codes | Step 6 codes enum, Step 10 writer | Read Step 6, Step 10 | Honored |
| AD-19 | Pointer-only composition in Phase A | Step 27 body enforces "no verbatim repo-derived text" | Read Step 27 | Honored |
| AD-23 | Cooperative watchdog + blocking-call inventory | Step 29 | Read Step 29 | Honored |
| AD-24 | Test architecture: fixture generators + replay harness + build-time verifications | Steps 39, 40 | Read Steps 39, 40 | **Partial** — Step 39's verification instruction (see m1) and fixture enumeration (see M1) leave gaps |
| AD-25 | Two runtime deps, no postinstall, forward-only migrations | Step 1 (deps), Step 7 (migration_runner is forward-only) | Read Steps 1, 7 | Honored |
| AD-26 | WAL + busy_timeout=100ms + retry-once, ULID id generation | Step 37 | Read Step 37 | Honored |

Architecture citation completeness: all 26 AD-N are cited in the plan
(verified this session by Grep of `AD-([0-9]+)` count = 26 unique).
This matches the plan's own §14.4 Pass D attestation.

**Owner-Ledger claims — the four cited (OL-C1, OL-C3, OL-C5, OL-C6):**
each verified verbatim against `OWNER-LEDGER.md` lines 66, 68, 70, 71
respectively. Plan's §11.3 quotes match source verbatim.

---

## Critical & Serious Findings

### S1 — Step 31 depends on Step 32; the plan's own topological-sort claim is violated

**What the plan says.** §7 introduction (plan lines 545–555):

> "Steps are topologically sorted: a step's Dependencies field names every
> earlier step it consumes, and the ordering guarantees that when a step
> runs, every dependency has completed."

Step 31 (plan line 2204):

> "**Dependencies.** Steps 2, 4, 5, 7, 8, 23, **32 (first-index invocation)**."

Step 32 comes at plan line 2218 — **later** than Step 31.

Step 31's own body (line 2180) reinforces the dependency in narrative form:
"5. Run first `index` (Step 32)."

Step 32's `index` verb body (line 2224): "`index [--full]`: call `runIndex`
(Step 21); with `--full` re-mine from scratch; otherwise incremental."

**How this was verified.** Grep of `^\*\*Dependencies\.\*\*` across the plan
(this session) produced 43 hits, one per step. Manual walk of each result
against the step's number: Step 31 (dependencies line 2204) names Step 32
(step body line 2218). Every other step's Dependencies field cites only
strictly-earlier steps.

**Named standard violated.** The plan's own §7 topological-sort guarantee
(quoted above), which is itself derived from `expert-plan` SKILL.md Step 8:
"Structure the plan as an ordered sequence of steps, topologically sorted
by dependencies. Steps that unblock other work come first." (SKILL.md
line 287, verified this session.) A topological ordering that names a
later step as a dependency is not a topological ordering.

**Why it matters.** The build-order violation is not cosmetic. Step 31's
own T31-1 verification (plan line 4550) requires `ctxoracle init` to run
the first index — which the plan says is Step 32's implementation. An
implementer following the plan step-by-step will build Step 31 (init.ts),
attempt to run T31-1 verification, and find that `index` verb doesn't
exist yet because Step 32 hasn't been built. The build stalls at Step 31's
Checkpoint or drops the verification (a silent skipping).

**Correct implementations (two paths, plan must choose):**
1. **Swap the numbering:** move Step 32's `index` (and `hook`) verb
   definitions before Step 31. The other Step 32 verbs (`deinit`,
   `export`, `import`) can stay in place since Step 31 doesn't depend on
   them.
2. **Fix the citation:** if init.ts is meant to import Step 21's
   `runIndex` directly rather than invoke the `ctxoracle index` verb as
   a subprocess, replace "(Step 32)" with "(Step 21)" in both the
   Dependencies field and the step body. Step 31 then depends only on
   Step 21, which is strictly earlier.

Either path fixes the ordering. The plan must state which one is
intended and update every corresponding reference. Silently leaving the
current "(Step 32)" citation while claiming topological sorting is the
defect.

**Classification.** Serious. **New** finding — not raised in the author's
self-review (which did not walk cross-step dependencies) and not in the
meta-check (which focused on process compliance). **Provenance:** new.

---

### S2 — AC-8 content assertion is not covered by any test; Verification genre has no acceptance-tier test

**What the plan says.**

- §12.5 mapping table (plan line 4872): "AC-8 | T26-1, T26-2
  (verification), T25-5 (completeness Stop) | A"
- Step 25's Verification field (plan line 1888): "`T25-1` through
  `T25-7` (one per genre — per-genre unit tests + AC-1..AC-1d fixture
  assertions in §12)."

**What the source actually contains.**

- **Spec §14 AC-8 content assertion (lines 1017–1023):** "the emitted
  whisper must **headline the covering-test → changed-region mapping**
  (the fact the agent lacks); a whisper whose headline is only the
  run-state ('your test was not run'), with no covering-test mapping,
  **fails** AC-8 (P5, FR-D1)."
- **T26-1 (plan line 4048–4059):** tests `classifyBashCommand` on
  single-segment commands (the ternary classifier). Not a whisper test.
- **T26-2 (plan line 4061–4077):** tests the classifier on compound
  commands. Not a whisper test.
- **T25-5 (plan line 4351–4363):** "**T25-5 (AC-1d) — Completeness:
  paired change unshipped.** Verifies: Step 25's Completeness generator …
  Fails when: the whisper does not name the unchanged partner or is
  not delivered via `additionalContext`." Tests the Completeness genre's
  whisper. Not the Verification genre's whisper.
- **T25-1..T25-7 enumeration (verified by Grep of `^\*\*T25-` in §12.3
  this session):** T25-1 Coupling, T25-2 Orientation, T25-3 Reuse,
  T25-4 Consequence, T25-5 Completeness, T25-6 Bar no cap, T25-6a
  Hazard bypass, T25-6b Dedup, T25-7 Corpus floor. **Nine entries, five
  of them per-genre (Coupling, Orientation, Reuse, Consequence,
  Completeness), four of them per-mechanism (Bar, Hazard, Dedup,
  Corpus).** The seven Phase A genres are Orientation, Coupling, Reuse,
  Consequence, **Warning**, Completeness, **Verification** — Warning
  and Verification lack a dedicated T25-* content test.

**How this was verified.** Read spec §14 lines 908–1131 this session
(cited above); Read plan T25-1..T25-7 in §12.3 (lines 4282–4413) this
session; Read T26-1/T26-2 (lines 4048–4077); Read T27-1 form validator
(lines 4416–4432) — its data is "one canonical whisper per Phase A
genre, plus edge cases (missing pointer, imperative verb, missing genre
tag)"; it tests **form** (prefix, tag, ≥1 pointer, ratio, confidence
flag), not the AC-8 content requirement.

**Named standard violated.** `expert-plan` SKILL.md Step 9 (verified
this session, lines 320–330): "Every test the plan requires — new
tests, modified tests, and the tests behind any step's Verification
field — gets a specification. … For each test, the specification
states … what behavior is verified — the specific observable behavior,
traced to the spec requirement or plan step it verifies." An AC whose
content assertion has **no T-ID that tests that content** is not
covered; the §12.5 mapping fails Gate C item 8 (the reconciliation
attests coverage that does not exist).

Additionally, Step 25's Verification claim "T25-1 through T25-7 (one per
genre)" is factually incorrect: T25-6, T25-6a, T25-6b, T25-7 do not test
per-genre outputs, and the plan is missing Warning-genre and
Verification-genre whisper content tests. This is a factual claim the
plan makes about its own coverage.

**Why it matters.** The Verification genre is the genre most directly
tied to OL-12 ("the oracle speaking when an agent claims it's done is a
must-have feature"). AC-8 exists to prevent a compliance-decoration
Verification whisper that ships a run-state line without the
covering-test mapping. Without a test that fires the Verification whisper
and asserts its headline shape, an implementer can ship an AC-8-violating
whisper and the plan's own acceptance suite will call it green. This is
the exact "coverage theater" the collapse-log 2026-09-04 lesson warns
against.

Warning genre lacks a direct headline test too (T25-6a tests only the
bar-bypass mechanism), but AC-3a's assertion ("A real but low-confidence
hazard fires with its confidence flagged") is at least partially
verified by T25-6a's "the confidence flag is missing from the emitted
text" failure clause. AC-8 has no such partial coverage.

**Correct implementation.** Add T25-8 (Verification genre acceptance
test) in `test/replay/verification_headline.test.ts`: fixture repo with
a completion-claim + changed region + coupled tests + observed test-run
history; Stop event; asserts the emitted whisper's headline is the
covering-test → changed-region mapping (not the run-state alone). Add
a T25-9 (Warning genre acceptance test) for completeness of the "one
per genre" claim. Update §12.5's AC-8 mapping to point at T25-8 (not at
T26-* / T25-5). Update Step 25's Verification field to name all seven
genres accurately.

**Classification.** Serious. **New** finding — the author-gates review
walked field-count in §12 (its C1) and the shared-spec violation (S6)
but did not check per-AC-coverage sufficiency; the meta-check focused
on process compliance. **Provenance:** new.

---

### S3 — Plan is not deliverable under `expert-plan` SKILL.md's own binding rule; Q-gap-5 remains open

**What the plan says.** §14.4 (line 5246): "**Zero bin-1 or bin-3
entries open.** Bin-2 Q-gap-5 stays open until Max Cogar rules." §15
Q-gap-5 (lines 5370–5416) escalates three options (accept / halt /
waive) to Max Cogar.

**What the source rule says.** SKILL.md line 90 (verified verbatim this
session): "**Delivery semantics.** A plan with any open register entry
is not deliverable." And SKILL.md line 35: "**There are no fallbacks.**
When a required tool is unavailable, the planner stops and reports. …
A required tool that cannot run is a halt condition, not a license to
improvise."

**How this was verified.** Read SKILL.md line 90 and line 35 verbatim
this session; Read plan §14.4 and §15 Q-gap-5 in full this session.
Confirmed via `ToolSearch` this session that no `codegraph_*` or
`clear_thought_*` tool loads in this environment — the plan's premises
in Q-gap-1 and Q-gap-2 are factually correct.

**Named standard violated.** `expert-plan` SKILL.md's own delivery
semantics (line 90). The plan-writer executed the correct discipline
(logging Q-gap-5, escalating to Max Cogar, refusing to close it as
bin-1). This finding is not a criticism of the plan-writer's
disposition — it is the standing state that the mechanical delivery
gate remains closed. The gate cannot be opened by review; only by
Max Cogar's explicit ruling on Q-gap-5.

**Why it matters.** The `/expert-review` mechanical verdict rule is
"NEEDS FIXES if any finding of any severity exists," and this review
does surface other findings independently. But even in a hypothetical
world where every other finding was zero, this open register entry
alone would keep the plan non-deliverable under SKILL.md. Downstream
consumers (the implementer, the build) should not treat this plan as
deliverable until Max Cogar's Q-gap-5 ruling lands. The `STATUS.md`
"What to do next" step 1 correctly names this as the owner's decision.

**Correct implementation.** No plan-writer action closes S3. Max
Cogar must rule on Q-gap-5 per one of the three options in §15:
(a) accept the skill-non-compliant plan with the substitutes named;
(b) halt until CodeGraph and Clear Thought are enabled; (c) waive
SKILL.md Steps 2 and 6 for this plan only, with the waiver recorded in
`docs/collapse-log.md`. Once ruled, the plan-writer applies the ruling
per §14.4's own protocol and re-classifies Q-gap-5 as answered.

**Classification.** Serious. **Recurring** — the meta-check H1.3 named
the same open-register-entry issue; the plan-writer surfaced it as
Q-gap-5 in response. Recurring because the finding cannot close until
the operator rules. **Provenance:** recurring (H1.3 → Q-gap-5, same
underlying non-compliance, correctly re-surfaced in the plan itself).

---

## Systemic Patterns

**No systemic patterns.** Verified by the following scans this session:

- Grep for the "verify before you assert" pattern across the plan's
  factual claims — `**Evidence.**` occurrences carry file:line
  citations in §11.1 (spec), §11.2 (architecture, per prior review S2
  fix), §11.3 (ledger), §11.4 (external), §11.5 (collapse-log), §11.6
  (absence). Spot-checked V17, V19, V5, V13, OL-C6, OL-C5 — all resolve
  verbatim. No systemic pattern of unverified premises remains beyond
  what the author-gates review already caught and the fix pass
  addressed.
- Grep of `^\*\*Dependencies\.\*\*` (43 hits) — only Step 31 has the
  topological violation (S1). Not systemic.
- Walk of §12.3 for per-genre test coverage — the missing genres
  (Warning, Verification) are enumerable, not systemic (the pattern is
  "some genres lack tests," which is a coverage gap called out in S2,
  not a spreading defect).
- Absence-claim scan of §11.6 — three claims, all now correctly
  supported by `Glob`/`ls -a` evidence per the author-gates fix.

The plan's tendency toward compressed test specs (author-gates C1) and
shared specs (author-gates S6) was itself systemic pre-fix; those were
applied per plan §14.4 Pass A. This review confirms the fix landed —
§12 spot-check of T5-1, T14-1, T14-3, T25-6a, T30-1 shows all five
fields (Verifies, Level, Real/doubles with Meszaros type where
applicable, Data with technique, NOT asserts, Fails when) present.

---

## Moderate & Minor Findings

### M1 — §5.1 does not enumerate the ~15 named fixture repos §12 references

**What the plan says.** §5.1 lists `test/fixtures/repos/` as a
directory ("git repos generated at test time; see §12 for the full
set"). §12.3 and §12.4 name fixtures inline: `answer-drift-clearly-off`
(T16-1), `orientation-mixed-shape` (T25-2), `reuse-mixed-language` with
Repo A / Repo B / Repo C (T25-3), `consequence-coupled-tests` (T25-4),
`completeness-paired-change` (T25-5), `pristine-tree` (T31-1),
`coupling-nonobvious` (T25-1), `regret-true-positive` and
`regret-no-inflate` (T36-1), `secret-injection` (T40-1),
`subagent-delivery` (T40-2), `language-config-added` (T40-3),
`seeded-facts` (T40-6), plus fixture repos implied by T5-1 (four sub-repos:
full, shallow with origin, shallow without origin, non-git).

**How this was verified.** Grep for fixture-name references in §12
this session; cross-check against §5.1's `test/fixtures/repos/`
directory listing (which is empty in the skeleton).

**Named standard violated.** SKILL.md Step 8 output contract, §5.1
file-map requirement (per author-gates review C3/C4/C5 discipline):
"§5.1's role is to be the exhaustive list." Fixture repos are
implementer-created artifacts the same way test files are; deferring
their enumeration to §12 defeats the file-map surface's audit purpose.

**Correct implementation.** Add a `test/fixtures/repos/` sub-tree in
§5.1 enumerating every fixture-repo name §12 uses, one line per
fixture with its T-ID. The generator (`test/fixtures/generate.ts`)
then produces exactly the enumerated set, and a reviewer can audit
"every §12 fixture has a generator entry" mechanically.

**Classification.** Moderate. **New** — the author-gates review's
extended attestation named this ("a full pass would enumerate every
fixture repo in §5.1 for symmetry with the unit-test list") but
recorded it as "did not attack," not as a finding. Elevating it to a
finding here because a reviewer's "did not attack" is not closure and
because the plan's own convention (per author-gates C3/C4/C5's
resolution — every T-ID's file must appear in §5.1) applies to fixture
repos as much as to test files.

---

### M2 — `hook_field_names_isolated.test.ts` is listed at two paths with ambiguous relationship

**What the plan says.** §5.1 lines 404 and 416:

- `test/unit/hook_field_names_isolated.test.ts # T28-2 (AD-6 structural)`
- `test/conventions/hook_field_names_isolated.test.ts # T41-1b (also referenced as T28-2)`

§12 T28-2 (line 4463): "**File.** `test/unit/hook_field_names_isolated.test.ts`."
§12 T41-1 (line 4118): "**File.** `test/conventions/` (three sub-files:
`no_direct_dao_from_handler.test.ts`, `hook_field_names_isolated.test.ts`,
`permission_decision_confined.test.ts`)."

**How this was verified.** Read plan lines 395–420 (skeleton),
lines 4115–4133 (T41-1 spec), lines 4460–4475 (T28-2 spec) this session.
The comment "also referenced as T28-2" is ambiguous — it could mean the
same file lives at two paths (impossible), or two files with the same
name do the same check (redundant).

**Named standard violated.** Output-contract Gate C item 7: "File
paths and function names are confirmed against the current codebase,
not assumed." A single test-name at two paths violates the
one-file-per-T-ID discipline the author-gates review C3/C4 fix pass
adopted. Also SKILL.md's DRY principle inheritance — two files doing
the same grep check is duplicated test code.

**Correct implementation.** Pick one location. If the check needs to
run both as a unit test (during dev) and as a convention gate (in CI),
the file lives once and both invocation points reference the same
file. §5.1 lists it once; the CI workflow (Step 1) and the unit test
runner both find it there. Alternatively, if the two are genuinely
different (say, unit checks source-level, convention checks built
output), give them different names and clarify what each asserts.

**Classification.** Moderate. **New** — neither prior review caught
this.

---

### M3 — Step 15 body claims T15-1 covers both `updatedInput` and `updatedToolOutput`; T15-1's data covers only one

**What the plan says.** Step 15 body (plan line 1301–1303):

> "The response type in `src/types/verdict.ts` deliberately does NOT
> expose `updatedInput` or `updatedToolOutput` — `FR-B3`'s no-mutation
> clause is unrepresentable."

Verification field (line 1327–1332):

> "`T15-1` (compile-time: `updatedInput` and `updatedToolOutput` are
> absent from every response-related type — a `typecheck_verdict_shape.test.ts`
> fixture asserts this fails to compile if attempted)"

T15-1 spec (plan line 3926–3936):

> "**Data.** Fixture attempting `{ updatedInput: 'x' }` as a
> HookResponse literal."

**How this was verified.** Read plan lines 1301–1332 and 3926–3936 this
session. T15-1's data section names only `updatedInput`; the
`updatedToolOutput` case is not covered by the fixture named.

**Named standard violated.** SKILL.md Step 9: "For each test, the
specification states … the specific observable behavior." The
observable behavior claimed (both fields absent) is tested for one field
only; the other is asserted by construction but not by a fixture.

**Correct implementation.** Extend T15-1's data to two fixtures
(`updatedInput` and `updatedToolOutput`), each asserting `tsc` failure.
Or state explicitly that one fixture's failure suffices (with a named
reason — e.g., they share a code path in the type system).

**Classification.** Moderate. **New**.

---

### M4 — Step 39's Dependencies field lists only a subset of steps whose tests live in `test/unit/`

**What the plan says.** Step 39 (line 2544): "Populate
`test/unit/*.test.ts` per §5.1 with `node:test` test files. Each covers
its module per the Test specifications in §12 (T*-* IDs)."

Dependencies (line 2574): "Steps 3, 9, 11, 12, 14, 22, 24, 26."

**What the plan actually populates.** §5.1's `test/unit/` list (lines
371–407) contains tests corresponding to Steps 1, 2, 3, 4, 5, 6, 7, 8,
9, 10, 11, 12, 13, 14, 15, 20, 21, 22, 23, 24, 26, 27, 28, 37, 38 —
25 steps. Step 39's Dependencies field names 8 of them.

**How this was verified.** Read plan lines 371–407 and 2544–2582 this
session. Direct enumeration.

**Named standard violated.** SKILL.md Step 8: "**Dependencies** —
what must complete before this step. What this step unblocks. State
explicitly." Step 39 explicitly states 8 dependencies but consumes 25.
Either the Dependencies field is under-specified, or Step 39 is a
ceremonial placeholder (per D-plan-1's "unit suites are built alongside
the modules they cover") — but then the Dependencies field is
misleading regardless.

**Correct implementation.** Either (a) list all 25 steps whose test
files Step 39 aggregates, or (b) remove the Dependencies field entries
and state explicitly: "Step 39 is a per-step consolidation — its
dependencies are exactly the steps enumerated in §5.1's `test/unit/`
listing, each carrying its own T-ID and being built alongside its own
step per D-plan-1." Silent under-specification lets the implementer
consume Step 39 before Step 27's `whisper_form.test.ts` (T27-1) or
Step 37's `concurrency.test.ts` (T37-1) exists.

**Classification.** Moderate. **New**.

---

### M5 — AC-2c over-fire mapping is partial; T17-1 covers lag-hold self-recovery, not the broader over-fire scope

**What the plan says.** §12.5: "AC-2c (over-fire) | T17-1 | A".
T17-1 (plan line 4193–4207): "**Verifies.** Step 17 — on an
unclassified newest text turn, an Edit is denied; after catch-up
classifies the turn as clearing, the next Edit is allowed."

**What spec AC-2c requires (spec line 979–999):** "in a fixture where
the agent **did** answer (reworded) and **did** follow the step
(valid but unusual), **no deny fires**; and a `Read`/search taken
while a question is unanswered is **not** denied
(information-gathering, AC-2a). An induced wrongful deny is surfaced
(FR-M2) on the **wrongful-deny rate** …"

T17-1 covers the lag-window hold sub-case of over-fire (the
self-recovering wrongful deny). It does not cover the "agent
substantively answered but the recognizer missed it" over-fire case
that AC-2c also names.

**How this was verified.** Read AC-2c in spec §14 lines 979–999 this
session; Read T17-1 spec in §12.2 lines 4193–4207 this session.

**Named standard violated.** AC-2c has multiple sub-cases; the plan
maps only one of them. SKILL.md Step 9: each observable behavior is
traced to the requirement it verifies. A whisper-form-matching answer
that fails to clear is an over-fire class T17-1 does not exercise.

**Correct implementation.** Either extend T17-1 to include the
substantive-answer-not-recognized fixture, or add a T17-3 for it.
Alternatively, the plan may argue (with citation) that this over-fire
case reduces to a substantive-vs-deferral discrimination that is
explicitly Phase B (AC-2a-ii); the plan should then state the
reduction and re-map AC-2c over-fire's Phase A slice to what T17-1
actually covers.

**Classification.** Moderate. **New**.

---

### m1 — Step 39's verification instruction misses compile-time tests

**What the plan says.** Step 39 Verification (line 2578): "All T*-*
unit tests in §12 pass under `node --test test/unit/**/*.test.ts`."

**What §5.1 shows.** T9-1's compile-time fixture is
`test/build/typecheck_provenance.test.ts` (line 409). T15-1 is
`test/build/typecheck_verdict_shape.test.ts` (line 410). Both live
under `test/build/`, not `test/unit/`. The glob `test/unit/**/*.test.ts`
does not match them.

**How this was verified.** Read plan lines 408–413 and 2578 this
session.

**Named standard violated.** SKILL.md Step 8: "**Verification** — how
the implementer will confirm this step is correct after building it.
What to run." A verification instruction that misses two named tests
is under-specified.

**Correct implementation.** Extend the glob:
`node --test test/unit/**/*.test.ts test/build/**/*.test.ts
test/conventions/**/*.test.ts` — matching every non-replay tier's
test files.

**Classification.** Minor.

---

### m2 — Step 25 verification claim "T25-1 through T25-7 (one per genre)" is factually inaccurate

**What the plan says.** Step 25 Verification (plan line 1888):
"`T25-1` through `T25-7` (one per genre — per-genre unit tests +
AC-1..AC-1d fixture assertions in §12)."

**What §12.3 actually contains.** T25-1..T25-7 nine entries
(counting T25-6a, T25-6b): five per-genre tests + four
per-mechanism tests (bar, hazard bypass, dedup, corpus floor).
Warning and Verification genres lack a T25-* content test (see S2).

**Named standard violated.** "Verify before you assert" — CLAUDE.md
project memory rule, verified against source this session. The claim
"one per genre" is contradicted by the §12.3 enumeration.

**Correct implementation.** Rewrite Step 25 Verification to state
what's actually there: "T25-1 through T25-5 (five per-genre acceptance
tests: Coupling, Orientation, Reuse, Consequence, Completeness);
T25-6, T25-6a, T25-6b, T25-7 (four cross-cutting mechanism tests: bar,
hazard bypass, dedup, corpus floor); Warning and Verification genre
whisper content tests to be added (see S2)."

**Classification.** Minor. Linked to S2.

---

## Tentative Findings

**No tentative findings** — every candidate finding's premise was
verified per Gate B in this pass. The two premises that could not be
verified from inside this environment (CodeGraph tool availability,
Clear Thought tool availability) match the plan's own findings (Q-gap-1,
Q-gap-2, both confirmed by `ToolSearch` this session) rather than
producing new tentative claims for this review.

---

## Observations

- **The plan-writer's transparency about the halt-condition violation
  is a genuine positive.** Q-gap-5 records the failure in the plan's own
  register rather than hiding it. This is exactly what CLAUDE.md rule 1
  ("never claim something works … If something is broken, unverified, or
  half-done, say so in those words") asks for. Not a finding; not a
  clean-bill either — the underlying halt-condition violation still
  gates deliverability (S3).

- **The Clear Thought MCP absence forced the multi-perspective check
  in this review to be performed manually.** Recorded per SKILL.md's
  procedural instruction that a tool-failure disclosure appear in the
  delivered review when a mandatory tool is degraded. The manual walk
  did not surface additional findings beyond those already recorded
  above.

- **The plan cites `docs/architecture-phase-a.md:325–364` for AD-2's
  body (plan §11.2 line 3288–3294) but AD-2 actually starts at line
  325 and runs through 365 per Grep this session** — an off-by-one
  boundary. Not a finding because it does not affect what the plan
  claims about AD-2's content, but noted for the plan-writer to
  optionally tighten on a fix pass.

- **§5.1's absence of `test/build/typecheck_provenance.test.ts` and
  `test/build/typecheck_verdict_shape.test.ts` from the visible unit
  glob was addressed by the author-gates review's C3 fix pass** — those
  files are now listed under `test/build/` in §5.1 (verified lines
  408–413 this session). What remains is m1's Verification-instruction
  glob mismatch — the files exist in §5.1 but the instruction that
  runs them does not.

---

## What's Actually Good

The following properties are genuinely well-executed by standards this
review verified in-session; each names the standard and the verified
property.

- **AD-10's single-deny-producer confinement made structurally
  mechanical.** Step 15 (plan lines 1284–1338) creates `blocks/verdict.ts`
  as the sole `permissionDecision` producer; T15-2 greps built `dist/`
  for the string and asserts only `dist/blocks/verdict.js` matches;
  T41-1c (convention grep) checks the same in CI on every PR. This
  makes the "exactly two blocks" rule (spec §8) enforceable
  structurally rather than by convention — the collapse-log 2026-08-25
  lesson made procedural. **Verified by:** Read of Step 15, T15-2 spec
  (plan lines 3938–3949), T41-1 spec (plan lines 4117–4133), and
  architecture AD-10 body (lines 924–946) this session. **Standard:**
  ISO/IEC 25010 analysability, applied via a single-file import-graph
  check.

- **The V12-derived marker-based transcript discrimination is
  correctly transcribed and expresses the safe direction.** Step 12
  (plan lines 1101–1165) reads only `origin.kind === 'human'` +
  `isMeta !== true` as human-turn markers; marker-absent string entries
  become `unrecognized_user_entry` faults rather than being guessed as
  human. This closes the T2 injection surface a content-shape
  discriminator would open (task-notification or hook-feedback entries
  wrongly opening a question row and driving a deny). **Verified by:**
  Read of Step 12 and architecture V12 (line 136) this session; the
  V12 enumeration counts (1 human / 5 task-notification / 2 isMeta / 3
  marker-absent) match what the plan encodes as the reader's decision
  table in T12-1 (plan lines 3831–3849). **Standard:** OWASP LLM01
  prompt-injection prevention (transcript entries from non-human
  origins never granted human-turn semantics).

- **The exit report format (Step 42) is honest about its own
  purpose.** The plan explicitly instructs the implementer to treat a
  suspiciously-high answer-drift coverage number as a finding, not a
  success (Checkpoint 5, plan lines 2817–2823), and to publish the
  honest floor. This makes the collapse-log 2026-09-04 lesson
  procedural — it is the exact anti-pattern the standing warning was
  written against, encoded as a specific reviewer-instruction the exit
  report must follow. **Verified by:** Read of Step 42 (lines
  2681–2731) and Checkpoint 5 (lines 2817–2823) this session; Read of
  the collapse-log 2026-09-04 entry via plan §11.5 citation. **Standard:**
  CLAUDE.md dominating rule 3 ("The phase goal governs — and passing
  review is not the goal").

---

## Convergence Record

First-round review — convergence tracking begins at round 2.

---

## Open Findings Ledger

Not applicable this round. The operator (Max Cogar) has not directed a
cycle stop despite open findings; Q-gap-5 is a pre-decision escalation
that the plan itself surfaces (S3), not an operator-directed stop.
The Open Findings Ledger applies only when the operator has explicitly
directed that the fix cycle end with findings unresolved. That has not
happened.

---

## Recommended Priority

Fix in this order:

1. **S1 (topological ordering).** Pure ordering fix — either swap
   Step 31/32 or correct the "(Step 32)" citation to "(Step 21)"
   throughout Step 31. Mechanical; the plan-writer can do it in
   minutes. The finding blocks the very first CLI-tier verification
   (T31-1) an implementer would attempt.

2. **S2 (Verification genre acceptance coverage).** Add T25-8 in
   `test/replay/verification_headline.test.ts`; update §5.1 to list
   the new file; update §12.5's AC-8 mapping; update Step 25's
   Verification field to name the seven genres accurately. This is
   the most substantive fix — it changes the test coverage surface,
   not just the plan text.

3. **M1 (fixture enumeration in §5.1).** Enumerate every named
   fixture repo in §5.1's `test/fixtures/repos/` sub-tree. Mechanical.

4. **M2 (test-file duplication).** Pick one location for
   `hook_field_names_isolated.test.ts`; update §5.1 and §12 accordingly.

5. **M3, M4, M5, m1, m2.** Bundle as a single §-editing pass.

6. **S3 (operator ruling).** Requires Max Cogar's decision on
   Q-gap-5 — not a plan-writer fix. The plan is not deliverable while
   S3 stays open regardless of every other fix; per SKILL.md's own
   binding rule. Coordinate the plan-writer's fixes above with the
   owner's ruling: if Max Cogar rules to accept or waive Q-gap-5, the
   plan-writer applies the ruling in §14.4 and closes Q-gap-5; the
   plan is then deliverable *once the fixes above are also applied*.

The independent adversarial pass on the plan's §10A step-2 questions
(the other purpose of an independent /expert-review, per STATUS.md
step 2) attacked D-plan-1 (build order), D-plan-2 (dependency floor),
D-plan-6 (L11 verifications), D-plan-7 (CI unit-tier), and the
plan-level checkpoint placement. None of those attacks surfaced a
finding — the collapse-tests' answers hold under the attack this
review could apply. The findings above are all outside the §10A
collapse-test scope; they are drawn from Gate C mechanical checks on
the plan's own claims (topological sort, AC coverage, register
closure, test-spec completeness).

---

## Verdict

Verdict: NEEDS FIXES (10 findings: 3 Serious, 5 Moderate, 2 Minor)
