# Plan Review — Round 6

**Artifact:** `claude-plugins/expert-dev-tools/docs/plans/plan-expert-dev-tools-behavioral-remediation.md` (working tree, 2712 lines)
**Governing contract:** `claude-plugins/expert-dev-tools/skills/expert-plan/references/output-contract.md` **at commit `94a640a`** (read via `git show 94a640a:…`; the working-tree copy was not consulted, per the pinned instruction)
**Date:** 2026-08-08
**Reviewer:** independent, round 6, dispatched with artifact + prior-round records + input pointers only
**Round:** 6 (Post-fix)

---

## Scope and Inventory

### Step 3 tool plan

| Claim type in scope | Instrument | Availability |
|---|---|---|
| Literal-content ("line N says Z") | `Read` / `sed -n 'N,Mp'` line-numbered read at the cited line | available, used throughout |
| Content-absence ("no §11 entry registers X", "no drafting-history note survives") | `grep` over the named scope, query and result count recorded | available |
| Counted search (token extraction from §7, dispatch-label enumeration) | `grep -noE` with the pattern and result count recorded | available |
| Pinned-revision retrieval | `git show <commit>:<path>` / `git cat-file -t` | available, used for the contract and for claim 27's two pins |
| Structural (blast radius) | CodeGraph | **not exercised** — no finding this round makes a structural claim. The plan's own structural claim (claim 25) was not re-verified; recorded as scope limit 2 |
| Library behavior | Context7 | **not needed** — no finding this round rests on library behavior. The plan's one such claim (claim 5) was not re-verified; recorded as scope limit 2 |
| Claims imported from prior documents (rounds 1–5, the plan's own §11/§14 dispositions) | re-derivation against current source with the instrument the underlying claim type requires | available; every prior-round claim used for provenance or closure was re-derived |

No instrument class was unavailable for a load-bearing claim category, so no halt condition arose.

### Inventory

Constructed from the four Post-fix sources: the prior rounds' inventories, the fix set (round 5's changes to the plan), the plan's §5 file list as the artifact's declared blast radius, and round 5's nine findings as closure items.

**The artifact and its governing documents**
- [x] `docs/plans/plan-expert-dev-tools-behavioral-remediation.md` — Read in full, lines 1–2712 (four paged reads), plus targeted re-reads at drafting: 76–80, 121–207, 234–300, 390–475, 567–615, 700–855, 1240–1310, 1574–1613, 1809–1846, 2041–2131, 2155–2200, 2330–2425, 2455–2470, 2499–2520
- [x] `skills/expert-plan/references/output-contract.md` @ `94a640a` — Read in full via `git show`
- [x] `docs/reviews/plan-behavioral-remediation-round-01.md` — 166 lines (`wc -l`), consulted for provenance
- [x] `docs/reviews/plan-behavioral-remediation-round-02.md` — 67 lines, consulted for provenance
- [x] `docs/reviews/plan-behavioral-remediation-round-03.md` — 221 lines, consulted for provenance
- [x] `docs/reviews/plan-behavioral-remediation-round-04.md` — 300 lines, consulted for provenance
- [x] `docs/reviews/plan-behavioral-remediation-round-05.md` — Read in full (334 lines); the closure-item source for this round

**Inputs the plan cites**
- [x] `docs/investigate.md` — Grep-verified in prior rounds; not re-scanned this round, as no finding rests on it (scope limit 3)
- [x] `docs/behavioral-tier-findings.md` — same disposition

**Source files the plan makes claims about**
- [x] `workflows/expert-lifecycle.js` — Read at `:22–32`, `:224–243`, `:229–232`, `:343–346`, `:486–492`; `grep -n "runGate("` → 5 hits (`:224` declaration, callers `:329, :358, :376, :409`); `grep -n "maybeNonConvergence("` → 4 hits (`:487` declaration, callers `:364, :382, :415`)
- [x] `tests/structural/check-structure.mjs` — Grep-verified for the citations §7 makes about it; no finding this round rests on a line not previously verified
- [x] `skills/expert-review/SKILL.md` — line-numbered read of `:559–566` with `cat -A`; `grep -n` → heading at `:561`, bullet at `:565`
- [x] `agents/*.md` (all nine) — `grep -c "^tools:"` per file → 1 for acceptance, closeout, diagnostician, implementer, spec-writer, verifier; **0** for architect, planner, reviewer (the denylist three)
- [x] `agents/` + `skills/` — `grep -rlE "artifact_path|sections_rederived|finding_addressed|premise_evidence|files_changed|correction_draft|responsible_component"` → **0 files**; `grep -rl "stop_report"` → **1 file** (`agents/expert-implementer.md`)
- [x] `mcp-servers/aps-fusion-mcp-server/HANDOFF.md` @ `755bf9b` and `@ cd2f27b` — `git cat-file -t` confirms both are commits; `git show <c>:<path> | grep -c` → 1 hit each for the quoted strings claim 27 pins
- [x] Plugin doc population — `find . -name "*.md" | wc -l` → **56** today (the plan's S23 states 44 at plan time, 2026-07-31; the growth is this review series' own records)

### Scope limits recorded

1. **Round 5's fix diff was not diffable** — the plan remains uncommitted in the working tree and no round-5 baseline artifact exists. I substituted round 5's finding set as closure items and re-derived every closure from current source. This limits provenance precision for regressions only; I report zero regressions this round and each closure below carries its own verification.
2. **Two §11 claims were not independently re-verified**: claim 5 (Context7 sub-agents documentation) and claim 25 (CodeGraph dependents). Neither supports a finding of mine in either direction. Carried forward from round 5's scope limit 2.
3. **`docs/investigate.md` and `docs/behavioral-tier-findings.md` were not re-scanned** this round; rounds 3 and 4 grep-verified both, and no finding of mine rests on either.
4. **The §11 numbered claims verified exactly by round 5 (7, 8, 9, 12, 14, 16, 18, 19, 23, 24, 29, 30, 31, 35) were not re-executed wholesale this round.** Round 5 re-executed them against the same source, and round 5's fixes edited none of them. I re-executed claims 27, 33, 36's dispatch-label half, and 39/40's premises where a finding or closure depended on them.
5. **No rigor waivers.** The invocation requested the methodology in full and it was applied in full.

**Structured-reasoning tools.** `metacognitivemonitoring` and `collaborativereasoning` were not available as callable tools in this session's roster. The multi-perspective check was performed manually with the three required personas — the project's standards discipline, the downstream consumer acting on the verdict, and the implementer receiving the findings — and the tool unavailability is recorded here as a procedural observation per the skill's documented fallback.

---

## Summary

**This review returns NEEDS FIXES — 2 findings (1 Systemic, 1 Minor).** Eight of round 5's nine findings are genuinely closed against their originally named standards, verified from current source rather than from the plan's disposition table: S5's corrector frontmatter now declares `jobs: 3` and a five-entry `returns:` including `evidence`, which is what S2b's oracle demands; T-23 exists with all five fields and S15b's Verification field names it per half; D-9 and Q-22 settle what a `returns:` entry asserts; claim 33's three line references re-derive exactly against a line-numbered read (`:561` heading, `:562–564` blank, `:565` bullet); the drafting-history class is closed with a zero-hit grep over the whole document; §14 records eleven passes with pass 11 adding zero; §3 carries a 2026-08-09 attestation; and §14's supersession sentence now scopes correctly to Q-3, Q-12 and Q-17 with Q-18's stated as inline.

The one that did not close is round 5's F2, and it did not close in the way that matters least and recurs most. The registration rule's *mechanism* was genuinely built this round — §11's preamble now states the extraction command, the walk was run, and all **28** line-citation tokens I independently extracted from §7 resolve to a §11 entry, which is the first round in which that half is clean. What the walk did not emit is its own stated second half: statements §7 makes about a file's contents carrying no `path:line` token. The walk's attestation records finding **2** of these; I found **nine** unregistered, each verified at source and each reproducing accurately. That is the fifth consecutive round in which a class mechanism was authored correctly and the class sweep under it was incomplete — though it is, measurably, the narrowest instance yet.

The count fell sharply, 9 → 2, so tripwire condition (b) does not hold this round and its consecutive count resets to zero. The arithmetic is below.

---

## Upstream Contract Verification

Upstream artifact: the pinned output contract at `94a640a`. **All sixteen required sections are present** — verified by `grep -n "^## "` over the plan, returning exactly sixteen headings at lines 11, 25, 76, 111, 121, 209, 234, 1615, 1631, 1652, 1809, 2133, 2428, 2472, 2644, 2682, in contract order. No "if applicable" section with content is omitted.

**Gate A — does the plan enable downstream work**

| Item | Status | Verification |
|---|---|---|
| Implementer can execute without on-the-fly decisions | **pass** | Round 5's F1 — the only finding that turned a tier red at execution — is closed. Read of the S5 literal block (plan lines 574–591): `jobs: 3`, `returns:` = `status, artifact_path, evidence, sections_rederived, halt`. Both values match S2b's oracle: `PHASE_SCHEMA.properties` is four names plus S6b part 1's `sections_rederived` = five, and `grep -n "label: 'revise"` over the workflow returns three. No step now presents an option set or defers a choice |
| Reviewer can check a build against it, including whether each test was built to its specification | **pass** | Every step's Verification field names a defined test ID, and every test ID T-1…T-23 is defined in §12. Round 5's F3 gap is closed: T-23 exists (plan lines 2382–2415) with all five fields, and S15b's Verification field (lines 1300–1303) names T-23 for part 2 and T-22 for part 1 |
| User knows what they are getting and what was excluded with approval | **pass** | §2's four exclusions each cite an owner ruling or a source-document deferral (Read, plan lines 33–41), with Q-10, Q-11, Q-12, Q-13, Q-16 and Q-17 carrying the owner's answer and the incorporating step |

**Gate B — is the plan's own compliance auditable**

| Question | Status | Verification |
|---|---|---|
| Which standards govern, and what does each govern (§3)? | **pass** | §3's preamble now attests re-derivation 2026-08-09 (Read, plan lines 78–80), which is the date of the last walk recorded in §5, §11 and §14 — round 5's F8 is closed. I enumerated step IDs across its 24 rows; all of S1…S23 including S2b, S6b, S15 and S15b appear at least once |
| Where does each non-trivial step come from (Source)? | **pass** | Every one of the 26 steps carries a Source line (Read of each step) |
| What alternatives were rejected per step? | **pass** | S1, S2, S2b, S4, S5, S6, S6b, S8, S9, S10, S11, S12, S15, S15b, S16, S17, S18, S20, S22 each carry a four-part "What this is NOT — and why" block; S3, S7, S13, S14, S19, S21, S23 are declared trivial or trivial-plus with the shortened justification the contract permits |
| How was each factual claim verified (§11)? | **fail** | Nine file-content statements in §7 carrying no line token have no §11 entry — **F1** |
| Which decisions involved judgment (§10)? | **pass** | D-1…D-9, each with reasoning; D-9 is new this round and closes round 5's F4, carrying the decision, three-part reasoning, and an explicit "what this decision does not claim" |
| Where does the plan diverge from codebase patterns (§8)? | **pass** | D-A, D-B, D-C, each naming the justifying standard |
| What questions arose and how was each closed (§14)? | **pass** | 22 entries, every one binned and dispositioned, zero open; the sweep attestation records eleven passes with pass 11 adding zero (round 5's F7 closed); the supersession sentence scopes to Q-3/Q-12/Q-17 and states Q-18's is inline with the convention given (round 5's F9 closed) |
| Per test: behavior, level, doubles, data, failure condition (§12)? | **pass** | All 24 specifications read; each carries all five fields. T-22 and T-23 additionally carry the production-obligation clause the contract requires where a double supplies an input the subject reads |
| What could not be grounded (§15)? | **pass** | G-1, G-2, G-3, each with resolution-attempt evidence and why resolution is outside the planner's reach |

**Gate C — final checklist.** Items failing: "Every factual claim asserted in any plan step has a corresponding entry in Output section 11. The two are reconciled — claims without entries are non-compliance" (F1); "The restating sections (2, 3, 5, 11, 12, 14, plus section 1's Goal and **section 13's counts**) were re-derived from the current step set after the last step edit" as applied to §13's attestation date (F2).

All other Gate C items pass, verified item by item: §2's coverage reconciliation maps every requested element and every one of the 26 steps appears across its 17 rows; §5's five sublists are internally consistent and their headers match their row counts (Created 3/3, configuration 1/1, agents 9/9, skills 7/7, workflow-command-tests-docs 7/7), with `README.md` appearing exactly once so the union T-21 compares is a set; §13's "twelve of the twenty-six" reconciles against §5's workflow row (S6, S6b, S8, S9, S10, S12, S13, S15b, S17, S18, S20, S22 — 12) and against the 26-step enumeration; the citation-identity rule holds for out-of-artifact references, and I re-verified its hardest case — `git cat-file -t 755bf9b` and `cd2f27b` both return `commit`, and `git show <commit>:mcp-servers/aps-fusion-mcp-server/HANDOFF.md | grep -c` returns 1 hit each for the strings claim 27 quotes at each pin, so the pinned evidence is reachable by the next reader exactly as the preamble promises; every absence claim in §11's numbered list carries the compound search-plus-read shape; no step presents an option set; and the drafting-history class is closed (see below).

---

## Systemic Patterns

### F1 (Systemic) — §11's registration rule is now mechanised for line-cited claims and still unswept for line-free ones; nine file-content statements in §7 have no §11 entry

**Provenance: recurring** (round 5 F2, "§11's new registration rule was written and then applied only to the four instances round 4 named"; before that, round 4 F3). Same standard, and the rule's second clause is the same clause — but a different instance set, because round 5's nine named instances are all now registered.

**What the plan does — and what it genuinely fixed.** §11's preamble (Read, plan lines 1827–1845) now states the rule *and its mechanism*: *"extract every `path:line` token from §7 with `grep -noE '[A-Za-z0-9_./-]+\.(md|mjs|js|json):[0-9]+([–,-][0-9]+)*'`, then walk §7 top to bottom for file-content statements carrying no line token, and match both emissions against §11's entries in both directions."* The attestation records: *"Last reconciled: 2026-08-09 … It returned 28 line-citation tokens and 2 line-free file-content statements; 20 tokens resolved to existing entries and the remainder produced claims 36–43."*

I re-executed the stated command against §7 (plan lines 234–1613): **28 distinct line-citation tokens**, matching the attestation exactly. I then matched each against §11 by reading the whole section. **All 28 resolve** — the eight I traced individually being `check-structure.mjs:100` → claim 35, `expert-spec/SKILL.md:155` → claim 32, `check-structure.mjs:64-66` and `:39,48,49,54,66` → claims 7/8/37, `check-structure.mjs:14–34` → claim 38, `expert-architect.md:12` → claim 34, `expert-verifier.md:13–22` → claim 39, `expert-diagnostician.md:16,28` → claim 40, `architecture-expert-dev-tools.md:750` → claim 41, `expert.md:74–80` → claim 42. That half of the rule is clean for the first time in three rounds, and it is clean because a command was written down rather than a list of locations.

**Proactive scan for the unfixed half.** The rule's second clause covers *"any statement §7 makes about a file's contents even where no line is cited, since §11's definition covers 'what a doc currently says'."* The walk emitted 2. I walked §7 for the same population and read each candidate at its cited location in current source to confirm it is a live claim rather than a stale token. Nine are unregistered — `grep` over §11 (plan lines 1809–2131) for each proposition's distinguishing token returned **0 hits** in every case:

| §7 location | The file-content claim | Verified at source | §11 entry |
|---|---|---|---|
| S6b part 3, plan line 803 | the implementation gate "is multi-lens, flattening three lenses' findings per round (`:229–232`, `results.flatMap((v) => v.findings \|\| [])`)" | Read `workflows/expert-lifecycle.js:229–232` — `:231` is `findings = results.flatMap((v) => v.findings \|\| [])`; the claim reproduces | **none** — `grep "flatMap"` and `grep "229"` over §11 → 0 hits each. Claim 30 registers `:224–243` for a different proposition (the third non-enum `runGate` state) |
| S6b part 3, plan line 799 | "`runGate` is one shared function (`:224`, called at `:329`, `:358`, `:376`, `:409`)" | `grep -n "runGate("` → 5 hits: declaration `:224`, callers `:329, :358, :376, :409`; reproduces exactly | **partial** — claim 19 registers `:358` and `:376` only, for the artifact-push ordering proposition. `:329` and `:409` are registered nowhere, and the "one shared function called at four sites" proposition is registered nowhere |
| S15b part 1, plan lines 1252–1254 | "Line 335 currently reads `if (gate.verdict === 'NON_CONVERGENCE') {`; line 488 reads `if (gate.verdict !== 'NON_CONVERGENCE') return null`" | Read `:486–492` — `:487` = `async function maybeNonConvergence(...)`, `:488` = the guard verbatim; the claim reproduces | **none** — `grep "488"` over §11 → 0 hits. Claim 19 registers `:335–340` as "escalation return", not the literal predicate text, and registers `:488` not at all |
| S15b part 3, plan lines 1281–1283 | "control reaches lines 343–345, which return `GATE.intent` — the owner is told the specification passed independent review" | Read `:343–345` — `:345` returns `gate: { type: GATE.intent, what_happened: 'A specification for … passed independent review…' }`; reproduces | **none** — `grep "343"` over §11 → 0 hits |
| S13, plan lines 1172–1173 | "`maybeNonConvergence` gains an `artifactPath` parameter (call sites at 364, 382, 415 pass `archPath`, `planPath`, `planPath`)" | `grep -n "maybeNonConvergence("` → declaration `:487`, callers `:364, :382, :415`; reproduces | **none** — `grep "maybeNonConvergence"` and `grep "364"` over §11 → 0 hits. Claim 14 registers `:247` and the eight `diagnose()` call sites, a different symbol |
| S2b, plan lines 393–398 | "`artifact_path`, `sections_rederived`, `finding_addressed`, `premise_evidence`, `files_changed`, `correction_draft` and `responsible_component` are named in **zero** files under `agents/` and **zero** under `skills/`; only `stop_report` appears in one agent file" | `grep -rlE "artifact_path\|sections_rederived\|finding_addressed\|premise_evidence\|files_changed\|correction_draft\|responsible_component" agents/ skills/` → **0 files**; `grep -rl "stop_report" agents/ skills/` → **1 file**, `agents/expert-implementer.md`. Reproduces | **none** — `grep "stop_report"` over §11 → 0 hits. This is a **content-absence** claim, which Gate C singles out for compound evidence (search defining the candidate set, reads confirming absence, scope covered) — none of which is recorded anywhere |
| S2b, plan line 398 | "7 of 9 agents enumerate no jobs at all (only `expert-verifier` 'one of three' and `expert-diagnostician` 'one of two')" | Claims 39 and 40 register the two that *do* enumerate, at `:11` and `:14`. The absence across the other seven is registered nowhere | **none** — a content-absence claim over a seven-file scope with no recorded search |
| S2, plan lines 351–352 | "`agents/expert-reviewer.md`, `agents/expert-architect.md`, `agents/expert-planner.md` are not touched — they run denylists" | `grep -c "^tools:"` per agent file → **0** for architect, planner, reviewer; 1 for the other six. Reproduces | **none** — claim 37 registers `check-structure.mjs`'s allowlist/denylist *partition logic*; no entry registers which three agent files actually carry no `tools:` key |
| S23, plan lines 1576–1581 | "`codegraph_find_related_docs` … returned **23 of the plugin's 44 docs**" | A tool-result claim, dated 2026-07-31 in the step. §7's own three groups enumerate 3 + 9 + 11 = 23, internally consistent. The 44-doc denominator is not independently checkable today (`find . -name "*.md" \| wc -l` → **56**, the growth being this review series' own records), which is exactly why it needs an entry with its date and scope | **none** — `grep "44 docs"` over §11 → 0 hits. Claim 25 registers a different CodeGraph call (`codegraph_get_dependents`) with its scan scope, `force: true` and date — the shape this claim needs and lacks |

**Standard violated.** The pinned contract's §11 — *"One entry per factual claim the plan depends on. A factual claim is any statement the plan makes about: file contents, function signatures, type definitions, library behavior, framework defaults, configuration values, what symbols currently exist, what currently breaks, what currently works, what a test currently asserts, what a doc currently says"* — and Gate C: *"Every factual claim asserted in any plan step has a corresponding entry in Output section 11. The two are reconciled — claims without entries are non-compliance."* For the two absence claims (S2b's zero-files sweep, S2b's seven-of-nine), additionally Gate C's content-absence item: *"content absence ('no function validates X') states the search that defined the candidate set, the reads that confirmed absence at the candidates, and the scope covered. Search-only content-absence claims are non-compliance"* — here there is not even a search-only record. Also the plan's own §11 registration rule and §7 maintenance rule 4 (*"A finding in any restating section is a class signal, not an instance"*).

**Why this is systemic rather than isolated.** Nine instances across six distinct steps (S2, S2b, S6b, S13, S15b, S23), against one section, under a rule the plan authored and attests it executed. The attestation's own arithmetic is where it is visible without reading a single line of source: the walk reports emitting **2** line-free file-content statements from a 1,380-line step section that makes claims about eleven distinct files. Two is not a plausible yield for that clause, and the gap between 2 and the population is the finding. This is the fifth consecutive round in which a class-level mechanism was authored and the class-level sweep under it was incomplete — D-1's third row operating on the mechanism built to prevent it.

**What is different this round, and it matters for the recommendation.** The line-citation half of this rule is now genuinely closed, and it closed because the fix was a *command* rather than a list of locations. The half that remains open is precisely the half the plan expressed as prose instruction — *"walk §7 top to bottom for file-content statements carrying no line token"* — with no extraction command, because none exists: identifying a file-content statement is a semantic judgment, not a regex. That is the same generation-versus-audit boundary D-8 and G-3 already name, showing up one level down inside the mitigation.

**What correct looks like.** Walk §7 step by step and, for each step, emit every proposition it asserts about a file that is not already carried by a line token — including absence propositions and tool-result propositions — then reconcile that emission against §11 in both directions and add an entry per unregistered claim, with the evidence form the claim's type requires (compound search-plus-read for the two absence claims, a dated tool-result record with scan scope for S23's). Nine entries follow from the table above. **Do not grep this review for the propositions it names; the table is a sample of what the walk produces, not the specification of the fix** — that substitution is what produced round 4's F3, round 5's F2, and this finding. Then correct §11's attestation to state the yield the walk actually returned.

---

## Critical & Serious Findings

No Critical or Serious findings — the full inventory was Read or Grep-verified per Compliance Gate B, and no violations of Critical or Serious classification were observed. Specifically, the two Serious findings of round 5 are both closed against their originally named standards (F1 against Design by Contract and the contract's Gate A zero-tolerance item; F3 against the contract's §12 five-field requirement and the Verification-field reference rule), verified from current source and recorded in the Convergence Record below.

---

## Moderate & Minor Findings

### F2 (Minor) — §13's counts attestation predates the last re-derivation walk

**Provenance: new.** Round 5's F8 was the same class at `§3`; §3 is now correct and §13 carries the defect. Different location, so this is a new instance rather than a recurrence of that finding.

**What the plan says.** Read of §13's coupling-hotspot bullet (plan lines 2460–2464): *"`workflows/expert-lifecycle.js` is modified by **twelve of the twenty-six** steps — S6, S6b, S8, S9, S10, S12, S13, S15b, S17, S18, S20, S22 (§5, re-derived **2026-08-08** by the same §7 walk)."*

**How verified.** Read of the three sibling attestations: §3's preamble (line 78) reads *"Re-derived from §7's 26 Source annotations, **2026-08-09**"*; §5's preamble (line 124) reads *"Last re-derived: **2026-08-09**"*; §11's preamble (line 1842) reads *"Last reconciled: **2026-08-09**"*. §5's own text states what the 08-09 walk covered: *"round 5's step edits changed S5's frontmatter values and S15b's Verification field."* So a step edit occurred and a re-derivation walk followed it on 2026-08-09, while §13 — which the contract names among the restating surfaces — records its derivation as the previous day's walk.

The *content* is correct: I re-derived it independently. §5's workflow row lists exactly the twelve steps named, and the plan's step set is 26 (S1, S2, S2b, S3, S4, S5, S6, S6b, S7, S8, S9, S10, S11, S12, S13, S14, S15, S15b, S16, S17, S18, S19, S20, S21, S22, S23). The defect is that the document's own record answers Gate C's question in the negative.

**Standard violated.** The pinned contract's Gate C: *"The restating sections (2, 3, 5, 11, 12, 14, plus section 1's Goal and **section 13's counts**) were re-derived from the current step set after the last step edit, not patched. A plan whose step set changed after these sections were last written has not satisfied this item."* Gate B requires this to be answerable from the document alone; as written, the document says §13's counts were last derived before the 2026-08-09 walk. The plan's own §7 maintenance rule 3 lists §13 as surface 7 and requires it re-derived in the same walk as the rest.

**What correct looks like.** The §7 walk F1 requires emits §13's counts along with the other restating surfaces; its parenthetical date follows. If the intent was to record that the 08-09 walk confirmed the 08-08 figures unchanged — which is what §5's preamble does explicitly and well — then say that, as §5 does, rather than dating the derivation to the earlier walk.

---

## Tentative Findings

No tentative findings — every candidate finding's premise was verified against current source per Compliance Gate B, with the grep queries, result counts and line-numbered reads recorded in each finding.

Three candidates were investigated and **dropped** rather than demoted, recorded because a review that reported any of them would have been confidently wrong:

- *That §14's round-5 disposition table over-claims F6's closure.* Dropped: I re-executed round 5's own pattern class over the complete plan — `grep -nE "previously cited|previously recorded|Round 3 found|round 4's pass|Round 4 found|earlier draft|first draft|prior version|is \*\*withdrawn\*\*|First disposed|previously"` → **0 hits**, down from round 5's 10. The class is closed at the document level, and §14's claim that each site was converted to a current-state statement or deleted is borne out.
- *That claim 33 still carries round 5's F5 false sub-claim.* Dropped: `sed -n '559,566p' skills/expert-review/SKILL.md | cat -A` shows `:559` blank, `:560` blank, `:561` the `### Gate A — Frame evidence per finding` heading, `:562`–`:564` blank, `:565` the bullet — exactly what claim 33 now states, and `grep -n` corroborates both line numbers. The re-derivation is correct.
- *That S5's `returns:` still fails S2b's oracle.* Dropped: the union of `PHASE_SCHEMA.properties` (`status`, `artifact_path`, `evidence`, `halt`) plus S6b part 1's `sections_rederived` is five, and S5 declares those five; `grep -n "label: 'revise"` returns three labels and S5 declares `jobs: 3`. Both halves now satisfy the oracle.

---

## Observations

- **The half of round 5's F2 that closed, closed because it became a command.** §11's preamble now carries the literal `grep -noE` extraction, and I reproduced its result count exactly (28) on the first attempt. The half that stayed open is the half stated as prose instruction. That is a small but clean piece of evidence for G-3's own thesis, produced by this plan on itself rather than imported from APS Fusion — and it is worth recording because it is the first time in six rounds that a class mechanism in this document has demonstrably held under independent re-execution.
- **The `collaborativereasoning` and `metacognitivemonitoring` tools were not in this session's callable roster.** The multi-perspective check was performed manually with the three required personas per the skill's documented fallback. Recorded as a procedural note; it changed no finding.

---

## What's Actually Good

- **The corrector's frontmatter is now derived from the oracle rather than chosen, and S5 says so and shows the derivation.** Property: both `jobs:` and `returns:` are computed from stated source facts, with the computation written out (plan lines 600–614: the three `revise:` labels for `jobs: 3`; `PHASE_SCHEMA`'s four properties plus S6b part 1's addition for the five `returns:` entries), including the counter-intuitive `evidence` entry and a pointer to D-9 for why it is there. Standard: Design by Contract (Meyer), named in §3 as governing S2b, and the contract's Gate A zero-tolerance item. Verified by re-executing both halves — `grep -n "label: 'revise"` over `workflows/expert-lifecycle.js` → 3 hits at `:331`, `:360`, `:378`; Read of `:58–75` for the four declared properties. A value that carries its derivation is checkable by the next reader without re-running the oracle, which is what makes this a closure rather than a patch.
- **D-9 settles a semantic question by recording the rejected alternative and why it is undecidable, rather than by asserting the answer.** Property: the decision states what `returns:` means, gives three independent grounds, names the alternative (intersection oracle), and adds an explicit "what this decision does not claim" paragraph directing a reader after real emission obligations to the agent bodies. Standard: the contract's §10 — *"judgment calls the planner made while writing the plan, with reasoning… This is the frame-correctness proof of the output contract"* — and Gate B's per-step alternatives question. Verified by Read of plan lines 1780–1805 against S2b part 1's cross-statement at lines 426–440 and Q-22 at line 2496; the three statements agree, which is the property that was missing when round 5 raised F4.
- **Claim 27's pinned evidence is reachable exactly as its preamble promises, under adversarial check.** Property: a claim whose source file was rewritten mid-authoring remains verifiable by the next reader. Standard: the contract's citation-identity rule — *"the evidence must be reachable by the next reader… a file elsewhere in the same repository by path and commit."* Verified: `git cat-file -t 755bf9b` and `git cat-file -t cd2f27b` both return `commit`, and `git show <commit>:mcp-servers/aps-fusion-mcp-server/HANDOFF.md | grep -c` returns 1 hit at `755bf9b` for *"Rounds 1–11 failed on patch-style corrections"* and 1 hit at `cd2f27b` for *"Condition (b) fired at round 6"*. This is the plan's single most load-bearing claim and it survives the check that the working-tree path would have failed.

---

## Convergence Record

**Round number:** 6 (Post-fix).

**Trajectory:** R1 = **13** (1 Critical, 1 Systemic, 6 Serious, 2 Moderate, 3 Minor) → R2 = **13** (1 Critical, 1 Systemic, 4 Serious, 4 Moderate, 3 Minor) → R3 = **10** (1 Systemic, 7 Serious, 1 Moderate, 1 Minor) → R4 = **7** (1 Systemic, 3 Serious, 2 Moderate, 1 Minor) → R5 = **9** (1 Systemic, 2 Serious, 4 Moderate, 2 Minor) → **R6 = 2** (1 Systemic, 1 Minor).

Rounds 1–5 are taken from each round's own verdict line on disk; R6 from this round's mechanical breakdown.

**Flow counts for this round**, from the Step 9 provenance classifications:

- **Prior findings closed: 8** — eight of round 5's nine, each re-derived from current source rather than accepted from the plan's disposition table.
  - *R5 F1* (S5's frontmatter fails S2b's oracle on both halves) — closed against Design by Contract and Gate A. Read of plan lines 574–591: `jobs: 3`, `returns:` = the five-name union. Both halves re-derived from source (`grep -n "label: 'revise"` → 3; `PHASE_SCHEMA.properties` at `:58–75` → 4 names, plus S6b part 1's addition). T-2b gained the `jobs:`-mismatch must-fail case round 5 asked for (Read, plan lines 2176–2183), with the stated reason that each half fails independently.
  - *R5 F3* (no specification for `CORRECTOR_HALTED`) — closed against the contract's §12 five-field rule and the Verification-field reference rule. **T-23** exists (plan lines 2382–2415) with behavior verified traced to S15b part 2, level, real/double boundary including the three-way production obligation, data forward-derived from S4's halt case, technique, must-not-assert and fails-when. S15b's Verification field (lines 1300–1303) names T-23 for part 2 and T-22 for part 1, per half.
  - *R5 F4* (`returns:` semantics undecided) — closed against Design by Contract. Settled as **D-9** (plan lines 1780–1805), registered as **Q-22** (line 2496), and stated in S2b part 1 (lines 426–440) and S5 (line 609). The three statements agree on re-read.
  - *R5 F5* (claim 33's heading/blank premise false) — closed against the contract's §11 re-read requirement and Gate C. Re-derived from a line-numbered read at drafting: heading `:561`, blanks `:562–564`, bullet `:565`, corroborated by `grep -n`. The plan's claim 33 (lines 2051–2057) now states exactly this. Its sibling claims 32, 34, 35 were re-read in the same walk per the plan's own text, and round 5 independently confirmed all three reproduce.
  - *R5 F6* (drafting-history self-corrections retained) — closed against Gate C's verbatim clause. `grep -nE "previously cited|previously recorded|Round 3 found|round 4's pass|Round 4 found|earlier draft|first draft|prior version|is \*\*withdrawn\*\*|First disposed|previously"` over the complete plan → **0 hits**, against round 5's 10 and round 3's 22. §14's round-3 disposition row (line 2600) now states what actually happened rather than claiming a closure that had not occurred.
  - *R5 F7* (sweep attestation stale at eight passes) — closed against the contract's §14 attestation requirement. Read of plan lines 2499–2508: eleven passes, with pass 9 covering round 4's fixes and adding zero, pass 10 covering round 5's and adding one (Q-22), pass 11 re-walking after Q-22 and adding zero.
  - *R5 F8* (§3's attestation predates the last step edit) — closed against Gate C's re-derivation item. §3's preamble (lines 78–80) now reads 2026-08-09, matching §5, §11 and §14. **The class is not closed** — §13 carries the same defect, which is F2 of this round, reported as new because it is a different location.
  - *R5 F9* (supersession-location claim false for Q-18) — closed against the citation-identity principle. Read of plan lines 2513–2519: the sentence scopes record-held supersessions to Q-3, Q-12 and Q-17, states Q-18's is retained inline because nothing external overturned it, and gives the convention.
- **New findings: 1** — F2 (§13's attestation).
- **Regressions: 0** — no finding this round is introduced or exposed by round 5's fixes. F2's defect is a surface round 5's walk did not update rather than one it damaged; the eight closures introduced no new defect I could verify.
- **Recurring: 1** — F1 (round 5 F2's standard, the contract's §11/Gate C reconciliation requirement, at new instances; round 5's nine named instances are all now registered).

1 + 0 + 1 = 2, reconciling with the finding count.

**Tripwire evaluation — NOT FIRED.** Arithmetic shown for both conditions.

*Condition (a) — new + regression findings ≥ closed findings for two consecutive Post-fix rounds.* Round 4: new 1 + regression 0 = 1; closed 9; 1 ≥ 9 is **false** → did not hold. Round 5: new 3 + regression 3 = 6; closed 7; 6 ≥ 7 is **false** → did not hold; consecutive count entering this round = **0**. Round 6: new 1 + regression 0 = **1**; closed = **8**; 1 ≥ 8 is **false** → **does not hold**. **Consecutive count remains 0** against a threshold of 2.

*Condition (b) — total findings has not strictly decreased for two consecutive Post-fix rounds.* Round 3: 13 → 10, strict decrease → did not hold. Round 4: 10 → 7, strict decrease → did not hold. Round 5: 7 → 9, **not** a strict decrease → held; consecutive count entering this round = **1**. Round 6: 9 → **2**, which **is** a strict decrease → **does not hold this round**. **The consecutive count resets to 0** against a threshold of 2.

Neither condition holds this round, so the tripwire is not fired and both consecutive counters stand at zero.

**What the arithmetic does not say on its own.** Round 5 recorded that condition (b) was armed and that a round 6 producing nine or more findings, or closing fewer than it opened, would fire it. Neither happened, and the margin is not narrow: two findings against nine, with eight closures and zero regressions. The regression count is the number I weight heaviest — rounds 3, 4 and 5 recorded 3, 0 and 3 regressions respectively, and this round records none, which means round 5's fixes did not manufacture the next round's findings for the first time since round 4. Severity is at its lowest across all six rounds: zero Critical for the fourth consecutive round, zero Serious for the first time.

The countervailing signal is real and is F1: this is the fifth consecutive round in which a class mechanism was authored and its sweep was incomplete, and the plan's own G-3 records that *"every review round to date has found drift in at least one"* of its nine restating surfaces. That count is now six of six. What distinguishes this round is that the mechanism's mechanised half held under independent re-execution and the unmechanised half did not — which is a narrower and better-characterised failure than "the sweep was not performed," and it points at the same generation-versus-audit boundary G-3 already names as the residual the plan cannot close.

---

## Recommended Priority

The tripwire did not fire, so another fix round is the indicated path rather than foundational rework. Two items, and the second is smaller than the first by a wide margin.

1. **F1 — the line-free half of the §11 registration walk.** Walk §7 step by step emitting every proposition it asserts about a file that no line token already carries, and reconcile that emission against §11 in both directions. The nine in this review's table are what the walk returns, not what the fix consists of — patching those nine is the exact substitution that produced round 4's F3, round 5's F2 and this finding, three rounds running. Two of the nine (S2b's zero-files sweep and its seven-of-nine count) are content-absence claims and need Gate C's compound evidence form; one (S23's 23-of-44) is a tool-result claim and needs the dated scan-scope form claim 25 already models. Then correct §11's attestation to record the yield the walk actually returns, since "2" is the number that made this visible without reading source.

   **One structural note for whoever applies this.** The line-citation half of this rule closed this round and closed cleanly, because the plan wrote down an extraction command that I could re-execute to the exact result count. The half that did not close is the half expressed as prose instruction, and it cannot be expressed as a command — deciding whether a sentence asserts something about a file's contents is a semantic judgment. If a seventh round reports this class again, the honest reading is not that the walk keeps being skipped; it is that the second clause of this rule is not mechanisable on a prose artifact, which is the conclusion G-3 and D-8 already reach about the plan's nine restating surfaces and which the owner may wish to weigh against the output-contract change G-3 proposes.

2. **F2 — §13's counts attestation.** Emitted by the same walk as item 1; it is a date, and §5's preamble already models the correct handling for the "the walk confirmed these unchanged" case. Not worth a separate edit.

---

Verdict: NEEDS FIXES (2 findings: 1 Systemic, 1 Minor)
