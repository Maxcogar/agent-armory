# Plan Review — Round 7

**Artifact:** `claude-plugins/expert-dev-tools/docs/plans/plan-expert-dev-tools-behavioral-remediation.md` (working tree, 2856 lines)
**Governing contract:** `claude-plugins/expert-dev-tools/skills/expert-plan/references/output-contract.md` **at commit `94a640a`** (read via `git show 94a640a:…`; the working-tree copy was not consulted, per the pinned instruction)
**Date:** 2026-08-08
**Reviewer:** independent, round 7, dispatched with artifact + prior-round records + input pointers only
**Round:** 7 (Post-fix)

---

## Scope and Inventory

### Step 3 tool plan

| Claim type in scope | Instrument | Availability |
|---|---|---|
| Literal-content ("line N says Z") | `Read` / `sed -n 'N,Mp'` line-numbered read at the cited line | available, used throughout |
| Content-absence ("no §11 entry registers X") | `grep` over the named scope, query and result count recorded | available |
| Counted search (token extraction from §7, reference enumeration) | `grep -noE` / `perl` with the pattern and result count recorded | available |
| Pinned-revision retrieval | `git show <commit>:<path>` | available, used for the contract |
| Structural (blast radius) | CodeGraph | **not exercised** — no finding this round makes a structural claim. The plan's own structural claim (claim 25) was not re-verified; recorded as scope limit 2 |
| Library behavior | Context7 | **not needed** — no finding this round rests on library behavior. The plan's one such claim (claim 5) was not re-verified; scope limit 2 |
| Claims imported from prior documents (rounds 1–6, the plan's own §11/§14 dispositions) | re-derivation against current source with the instrument the underlying claim type requires | available; every prior-round claim used for provenance or closure was re-derived |

No instrument class was unavailable for a load-bearing claim category, so no halt condition arose.

### Inventory

Constructed from the four Post-fix sources: the prior rounds' inventories, the fix set (round 6's changes to the plan), the plan's §5 file list as the artifact's declared blast radius, and round 6's two findings as closure items.

**The artifact and its governing documents**
- [x] `docs/plans/plan-expert-dev-tools-behavioral-remediation.md` — Read at 235–794, 795–1274, 1274–1618, plus targeted reads at drafting: 48–76, 76–84, 121–135, 1741–1812, 1812–1900, 1904–1960, 2139–2255, 2452–2550, 2550–2600, 2636–2652, 2760–2830; §7 extracted whole to a working file (1,383 lines) and §11 likewise (443 lines) for the reconciliation walk
- [x] `skills/expert-plan/references/output-contract.md` @ `94a640a` — Read in full via `git show`
- [x] `docs/reviews/plan-behavioral-remediation-round-01.md` … `-round-05.md` — consulted for trajectory and provenance (verdict lines and Convergence Records extracted by grep)
- [x] `docs/reviews/plan-behavioral-remediation-round-06.md` — Read in full (243 lines); the closure-item source for this round

**Inputs the plan cites**
- [x] `docs/investigate.md` — `grep -n` for section headings → 21 headings enumerated; `:198–215` and `:455–472` Read at drafting (F1's evidence)
- [x] `docs/behavioral-tier-findings.md` — `grep -n` for headings → 14 enumerated; `:105–138`, `:220–243`, `:268–284` Read at drafting (F1's evidence)

**Source files the plan makes claims about**
- [x] `workflows/expert-lifecycle.js` — Read at `:22–32`, `:50–56`, `:58–75`, `:202`, `:207`, `:231`, `:335`, `:343–345`, `:394`, `:411`, `:424`, `:446`, `:468`, `:488`; `grep -n "runGate("` → 5 hits (`:224` declaration; callers `:329, :358, :376, :409`); `grep -n "maybeNonConvergence("` → 4 hits (`:487` declaration; callers `:364, :382, :415`)
- [x] `agents/*.md` (all nine) — `grep -c "^tools:"` per file → 1 for acceptance, closeout, diagnostician, implementer, spec-writer, verifier; **0** for architect, planner, reviewer. `grep -c "^skills:"` → 1 for all nine, at `:4`. `grep -rn "one of two\|one of three\|one of four" agents/` → exactly 2 hits (`expert-verifier.md:11`, `expert-diagnostician.md:14`)
- [x] `agents/` + `skills/` — `grep -rlE "artifact_path|sections_rederived|finding_addressed|premise_evidence|files_changed|correction_draft|responsible_component"` → **0 files**; `grep -rl "stop_report"` → **1 file** (`agents/expert-implementer.md`)
- [x] `skills/expert-spec/SKILL.md` — Read `:11`, `:349`; `grep -icE "revis(e|ion)"` → **0**
- [x] `skills/expert-architecture/SKILL.md` — Read `:456–458`; `skills/expert-architecture-portable/SKILL.md` — Read `:302`; `skills/expert-plan/SKILL.md` — Read `:390`
- [x] `skills/expert-plan/references/testing-standards.md` — `grep -n -i "regression"` → hit at `:91`, Read at that line (F1's evidence)
- [x] `scripts/ledger.schema.json` — Read `:168`, `:177–184`
- [x] `tests/fixture/spec/spec-contradictory.md` — Read `:1–6`; `tests/ACCEPTANCE.md` — Read `:90`
- [x] `docs/specs/spec-expert-dev-tools.md` — `grep -n "F-13"` → 3 hits; Read `:198–205`; `grep -n "F-14"` → hit at `:217`; `grep -n "^### 3.4"` → `:119`
- [x] `docs/arch/architecture-expert-dev-tools.md` — `grep -n "C3"` → `:47`, `:77`, `:126`; Read `:127`; `grep -n "D15"` → `:532`, `:658`, `:758`
- [x] `tests/structural/check-structure.mjs` — Grep-verified for the citations §7 makes about it; no finding this round rests on a line not previously verified
- [x] Plugin doc population — `find . -name "*.md" | wc -l` → **58** today (claim 55 records 57 on 2026-08-10; the growth is this review series' own records, which the claim states explicitly). `find . -iname "readme*"` → **0**, matching claim 55

### Scope limits recorded

1. **Round 6's fix diff was not diffable** — the plan remains uncommitted in the working tree and no round-6 baseline artifact exists. I substituted round 6's finding set as closure items and re-derived each closure from current source. This limits provenance precision for regressions only; I report zero regressions and each closure carries its own verification.
2. **Two §11 claims were not independently re-verified**: claim 5 (Context7 sub-agents documentation) and claim 25 (CodeGraph dependents). Neither supports a finding of mine in either direction. Carried forward from rounds 5 and 6.
3. **Claim 11 (run-transcript reads under `~/.claude/projects/…`) was not re-executed.** It is cited by path and date with its unpinnable status stated, per the plan's own citation rule; no finding of mine rests on it.
4. **The §11 numbered claims verified exactly by rounds 5 and 6 (7, 8, 9, 12, 14, 16, 18, 19, 23, 24, 27, 29, 30, 31, 32, 33, 34, 35) were not re-executed wholesale.** Round 6's fixes edited none of them. I re-executed claims 3, 4, 6, 13, 36, 37, 38, 39, 40, 42, 43 and **all twelve of 44–55**, which are the round-6 additions and the population F1 concerns.
5. **No rigor waivers.** The invocation requested the methodology in full and it was applied in full.

**Structured-reasoning tools.** `metacognitivemonitoring` and `collaborativereasoning` were not in this session's callable roster. The multi-perspective check was performed manually with the three required personas — the project's standards discipline, the downstream consumer acting on the verdict, and the implementer receiving the findings — and the tool unavailability is recorded here as a procedural observation per the skill's documented fallback. This is the third consecutive round recording the same unavailability.

---

## Summary

**This review returns NEEDS FIXES — 2 findings (1 Systemic, 1 Minor).** Round 6's F2 is closed and round 6's F1 is not, and the shape of the non-closure is the reason this round matters more than its count suggests.

What round 6 asked for was genuinely delivered on its own terms. §11's line-free walk was re-run and emitted **twelve** propositions, not the nine round 6 tabulated — so the author did not grep the review for its list, which is the substitution round 6 warned against and which rounds 4 and 5 both committed. I verified all twelve of claims 44–55 at source and every one reproduces exactly: the nine-agent frontmatter partition, the zero-file schema-field sweep, the seven-of-nine job-count absence, the `AGENT` map and its four property accesses, `runGate`'s five call sites, `maybeNonConvergence`'s four, both `NON_CONVERGENCE` predicates and the `GATE.intent` fall-through at `:343–345`, the `expert-spec` authoring-document absence, the two `ledger.schema.json` fields, the two test artifacts, the `EVIDENCE` schema and sampling constant, and S23's dated tool result. The line-cited half also still holds — I re-executed the stated extraction command over §7 and matched every token to a §11 entry.

What did not close is the population the walk searched. The walk swept §7's statements about **source files** and did not sweep its statements about **documents** — and §7 rests on documents heavily. Its Source annotations assert what `docs/investigate.md` says at thirteen distinct sections, what `docs/behavioral-tier-findings.md` says at ten, what the spec's F-13 and F-14 require, what architecture C3 and D15 specify, and what `testing-standards.md`'s regression clause states. §11 registers exactly one of these — investigate.md §5c, inside claim 9 — which is itself the proof that the plan treats such statements as registrable rather than out of scope, and §11's rule names "a Source line" explicitly as a covered site. This is the sixth consecutive round in which a class mechanism was authored and its sweep stopped short of the class, and it is the same clause of the same rule for the third round running.

The class is not cosmetic here. The one unregistered citation I checked for reproduction against its source does **not** reproduce: `testing-standards.md`'s regression clause requires a test that "reproduces it first (fails on the broken code), then passes on the fix," and adds "a regression test that never failed has not demonstrated it can." The plan restates it four times as "a check/test that would have caught it," dropping the demonstration requirement — precisely the drift §11 exists to prevent, in a citation §11 never registered.

The count held flat at 2 rather than falling, and closed findings equal new ones. **Both tripwire conditions hold this round for the first time in the series, and both consecutive counters now stand at 1 against a threshold of 2.** The arithmetic is below; round 8 repeating either condition fires it.

---

## Upstream Contract Verification

Upstream artifact: the pinned output contract at `94a640a`. **All sixteen required sections are present** — verified by `grep -n "^## "` over the plan, returning sixteen headings at lines 11, 25, 76, 111, 121, 210, 235, 1618, 1634, 1655, 1812, 2255, 2550, 2598, 2789, 2827, in contract order. No "if applicable" section with content is omitted.

**Gate A — does the plan enable downstream work**

| Item | Status | Verification |
|---|---|---|
| Implementer can execute without on-the-fly decisions | **pass** | Every step Read; no step presents an option set, defers a choice, or leaves a question open. S5's frontmatter values still satisfy S2b's oracle on both halves, re-derived from source this round: `PHASE_SCHEMA.properties` Read at `:58–75` is four names (`status`, `artifact_path`, `evidence`, `halt`) plus S6b part 1's `sections_rederived` = five, and S5 declares those five; `grep -n "label: 'revise"` → 3, and S5 declares `jobs: 3` |
| Reviewer can check a build against it, including whether each test was built to its specification | **pass** | Bidirectional reconciliation run mechanically: the T-IDs referenced across §7 and the T-IDs defined in §12 are the same 24-element set (T-1, T-2, T-2b, T-3…T-23). Each specification Read; each carries all five fields, T-21 included (its *Fails when* is at plan line 2546). T-22 and T-23 additionally carry the production-obligation clause the contract requires where a double supplies an input the subject reads |
| User knows what they are getting and what was excluded with approval | **pass** | §2's coverage table Read (plan lines 48–70): 17 rows, every one mapped to steps, and the union of its step references is exactly the 26-step set. The four exclusions each cite an owner ruling or a source-document deferral |

**Gate B — is the plan's own compliance auditable**

| Question | Status | Verification |
|---|---|---|
| Which standards govern, and what does each govern (§3)? | **pass** | §3's preamble attests re-derivation 2026-08-10 (Read, plan line 78), matching §5, §11, §13 and §14. Its rows name `expert-plan/references/testing-standards.md` by full path at line 104 |
| Where does each non-trivial step come from (Source)? | **pass** | Every one of the 26 steps carries a Source line (Read of each step) |
| What alternatives were rejected per step? | **pass** | Nineteen steps carry a four-part "What this is NOT — and why" block; S3, S7, S13, S14, S19, S21, S23 are declared trivial or trivial-plus with the shortened justification the contract permits |
| How was each factual claim verified (§11)? | **fail** | §7's statements about the contents of its governing and input documents have no §11 entries — **F1** |
| Which decisions involved judgment (§10)? | **pass** | D-1…D-9, each with reasoning; D-8's nine-surface enumeration Read and matched item-for-item against §7's preamble table and §15's G-3 count |
| Where does the plan diverge from codebase patterns (§8)? | **pass** | D-A, D-B, D-C, each naming the justifying standard |
| What questions arose and how was each closed (§14)? | **pass** | 22 rows (`grep -c "^| Q-"` → 22), every one binned and dispositioned, zero open; the closure arithmetic reconciles (17 bin-1 + 4 bin-2 + Q-22 = 22); the sweep attestation records twelve passes with pass 12 adding zero |
| Per test: behavior, level, doubles, data, failure condition (§12)? | **pass** | All 24 specifications Read; each carries all five fields |
| What could not be grounded (§15)? | **pass** | G-1, G-2, G-3, each with resolution-attempt evidence and why resolution is outside the planner's reach |

**Gate C — final checklist.** Items failing: "Every factual claim asserted in any plan step has a corresponding entry in Output section 11. The two are reconciled — claims without entries are non-compliance" (**F1**); and, for the two unregistered content-absence-shaped document claims inside F1's population, the content-absence evidence item. Additionally the auditability of §11's own attestation arithmetic (**F2**), which is not a listed Gate C item but is what Gate B requires of a restating section's self-record.

All other Gate C items pass, verified item by item this round rather than carried forward:

- §5's five sublists are internally consistent and their headers match their row counts (Created 3, configuration 1, agents 9, skills 7, workflow/command/tests/docs 7 = 27 rows; `grep -c` over the section returns 27).
- §13's "twelve of the twenty-six" re-derived independently: §5's workflow row lists exactly S6, S6b, S8, S9, S10, S12, S13, S15b, S17, S18, S20, S22, and the step set enumerates to 26. §13's attestation is now dated 2026-08-10 with §5's "confirmed unchanged" phrasing — **round 6's F2 is closed**.
- Every absence claim in §11 carries its kind and matching evidence. The two new ones are compound: claim 45 states the search defining the candidate set, that the set is empty, and the scope covered; claim 46 states the search, the two hits read at line, and that the remaining seven files were each opened. Claim 51 states the search (`grep -icE "revis(e|ion)"` → 0) and the read at `:11`.
- The citation-identity rule holds for out-of-artifact references (`755bf9b`, `cd2f27b` for the APS Fusion HANDOFF; transcript paths dated with unpinnable status stated).
- No step presents an option set, and no internal reasoning artifacts or drafting-history remnants survive — `grep -nE "previously cited|previously recorded|earlier draft|first draft|prior version|is \*\*withdrawn\*\*|First disposed"` over the complete plan → **0 hits**, holding at round 6's result.

---

## Systemic Patterns

### F1 (Systemic) — §11's line-free registration walk swept source files only; every statement §7 makes about the contents of its governing and input **documents** is unregistered

**Provenance: recurring** (round 6 F1; before that round 5 F2, round 4 F3). Same standard, same clause of the same rule — the second clause of §11's registration rule — at a population the walk did not reach. Round 6's nine named instances are all now registered, and the walk emitted twelve rather than nine, so the substitution round 6 warned against was avoided; the class boundary was drawn short instead.

**What the plan does — and what it genuinely fixed.** §11's preamble (Read, plan lines 1829–1863) states the rule and its mechanism, and its attestation now reads: *"Line-free half. The walk emits **twelve** propositions §7 asserts about a file's contents without citing a line, all of which required new entries — claims 44–55. The 2026-08-09 walk recorded a yield of 2 for this clause; that figure was the defect, not the population."* It adds the self-check round 6 asked for: *"A yield in the low single digits is itself the signal to re-run this clause."*

I verified the line-cited half first, because F1 concerns only the other half. Re-executing the stated command over §7 (plan lines 235–1617, extracted to a working file of 1,383 lines) returns **28 occurrences over 26 distinct tokens**. I matched every one against §11 by reading the section in full; **all resolve**, including the four whose §11 registration uses a different range notation than §7's citation — `check-structure.mjs:64-66` → claim 37 (which registers `:64`, `:65` and `:66` individually), `commands/expert.md:61` → claim 13 (`:61–64`), `expert-verifier.md:13–22` → claim 39, `expert-diagnostician.md:16,28` → claim 40. That half remains clean for the second consecutive round.

I then verified all twelve new entries at source. Every one reproduces: claim 44's `grep -c "^tools:"` partition (1 for six files, 0 for architect/planner/reviewer) and `^skills:` at `:4` in all nine; claim 45's zero-file sweep and single `stop_report` hit; claim 46's exactly-two enumeration hits; claim 47's `AGENT` map at `:22–32` and the four accesses at `:394`, `:424`, `:446`, `:468`; claim 48's five `runGate(` hits and the `flatMap` at `:231`; claim 49's four `maybeNonConvergence(` hits; claim 50's `:335`, `:488` predicates and the `:343–345` fall-through returning `GATE.intent`; claim 51's `:11` opening and zero revision hits; claim 52's `:168` and `:177–184`; claim 53's fixture framing and `tests/ACCEPTANCE.md:90`; claim 54's `EVIDENCE` shape at `:50–56` and the sampling constant at `:202`/`:207`; claim 55's dated tool result and its `readme` absence. No new entry is false.

**Proactive scan for the unswept population.** All twelve concern **source files** — `.js`, `.json`, `.mjs`, agent and skill markdown read as configuration. §7 also asserts, throughout its Source annotations and four-part blocks, what the plan's *documents* say. §11's rule names this site explicitly (plan line 1832: the rule covers a citation appearing *"in a **Source line**, a Verification line, a code comment, a table cell…"*), and §11 contains no carve-out for document citations — `grep -n "Source line\|input document\|excluded from §11"` over the plan returns three hits, none of which scopes any category out.

I enumerated the population by counted search over §7 and matched each against §11:

| Document | References in §7 | Distinct sections asserted | Registered in §11 |
|---|---|---|---|
| `docs/investigate.md` | **21** (`grep -c`) | 13 — §1, §1a, §2, §3, §4b, §4e, §4g, §5a, §5b, §5c, §5d, §6, §7 | **1** — §5c, inside claim 9. `grep -c "investigate.md"` over §11 → **1** |
| `docs/behavioral-tier-findings.md` | **11** (`grep -c`) | 10 — B1, B2, B3, B4, B5, B6, B8, B9b, B9c, B10 | **0** — `grep -n "behavioral-tier-findings"` over §11 → **0 hits** |
| `docs/specs/spec-expert-dev-tools.md` | F-13 (×3), F-14 (×3), §3.4 (×2) | 3 | **0** for these — claim 6 registers F-3 at `:155–158` only |
| `docs/arch/architecture-expert-dev-tools.md` | C3 (×3), D15 (×2), D6, D5/D11 | 4 | **partial** — claim 41 registers `:750` for D6's OWASP row; claim 6 registers `:863` for D5/D11. C3 and D15: **0** |
| `skills/expert-plan/references/testing-standards.md` | **4** | 1 (the regression clause) | **0** |

Each proposition I checked is **true at source**, which is what makes this a registration failure rather than a false-premise failure — and each was verified with the instrument its claim type requires:

- *S12/S13's entire authority.* §7 (plan lines 1136–1139) states: *"Spec F-13 requires the diagnostic pass gather 'the evidence (ledger, run journal, artifacts, the failing output)'; architecture C3 specifies dispatch 'with the failure record + ledger snapshot + journal excerpt'."* Read of `docs/specs/spec-expert-dev-tools.md:198–205` — F-13 reads *"a dedicated diagnostic pass gathers the evidence (ledger, run journal, artifacts, the failing output)"*, verbatim. Read of `docs/arch/architecture-expert-dev-tools.md:127` — *"expert-diagnostician with the failure record + ledger snapshot + journal"*, verbatim. Both reproduce; neither has a §11 entry.
- *S16's authority for deletion-not-replacement.* §7 (plan line 1332) states the owner ruled deletion and that *"`investigate.md` §3's earlier note to the contrary is withdrawn in §6."* Read of `docs/investigate.md:455–461` — §6 reads *"§3's earlier note that removing the clause 'leaves that situation unaddressed unless something takes its place' is **withdrawn**."* Reproduces; no entry.
- *S6b's characterisation of its own source finding.* §7 (plan line 816) cites B9c as *"a finding the corrector cannot satisfy has no escape hatch — restated on evidence that exists, unlike its original claim."* Read of `docs/behavioral-tier-findings.md:276–277` — *"B9c's stated evidence is **withdrawn** (rounds 4–5 share no finding); the defect may be real but this run does not show it."* Reproduces; no entry, and `behavioral-tier-findings.md` has **zero** §11 entries despite being one of the plan's two named inputs.
- *S22's two premises.* §7 asserts *"Two independent diagnosticians read both and followed the spec, explicitly refusing A-8's expectation"* and *"the A-4b fabrication was self-refuting — one entry's claimed value contradicted another entry's accurate description of the same function."* Read of `docs/behavioral-tier-findings.md:220–243` — B3 records *"Two independent diagnosticians reached that conclusion and explicitly refused to adopt the document's expectation"*; B4 records *"index 1's claimed value contradicted index 3's accurate description of the same function."* Both reproduce; no entries.

**And one that does not reproduce — which is the harm, not a hypothetical.** §7 cites `testing-standards.md`'s regression clause four times (plan lines 490, 826, 1230, and §3's row at line 90), in three phrasings: *"every fixed bug gets a test that would have caught it"*, *"every fixed defect gets a check that would have caught it"*, *"every fixed defect gets a test that would have caught it."* Line 490 presents it in quotation form — *"(`testing-standards.md`, Regression tests — every fixed bug gets a test that would have caught it)"*. Read of `skills/expert-plan/references/testing-standards.md:91`, located by `grep -n -i "regression"`, the clause reads:

> **Regression tests** — every fixed bug gets a test that reproduces it first (fails on the broken code), then passes on the fix. A regression test that never failed has not demonstrated it can.

The source imposes a two-part *procedure* — the test must be demonstrated failing on the broken code before it counts — and adds an explicit warning against exactly the reading the plan adopts. The plan's paraphrase states a *property* and drops the demonstration requirement, in the standard that governs S3, S6b, S7, S15 and T-2b by §3's own registry. That is a live divergence between a cited document and its citation, in a citation that has never been registered and therefore has never been re-derived — the exact mechanism §11's preamble names when it says *"Unregistered citations do not get re-derived, and citations that are never re-derived are the ones that stop reproducing."*

**Standard violated.** The pinned contract's §11 — *"One entry per factual claim the plan depends on. A factual claim is any statement the plan makes about: … what a doc currently says"* — and Gate C: *"Every factual claim asserted in any plan step has a corresponding entry in Output section 11. The two are reconciled — claims without entries are non-compliance."* For B9c's and S22's propositions, which assert what a document does and does not record, additionally Gate C's content-absence item. Also the plan's own §11 registration rule (which names Source lines as covered) and §7 maintenance rule 4 (*"A finding in any restating section is a class signal, not an instance"*).

**Why this is systemic rather than isolated.** Roughly thirty references across twenty-three distinct document sections, spanning at least fifteen of the twenty-six steps, against one section, under a rule the plan authored and attests it executed. It is visible in the arithmetic without reading a line of source, the same way round 6's was: the walk emitted twelve propositions, and every one of the twelve is about a `.js`, `.json`, `.mjs`, or agent/skill file. Not one concerns `investigate.md`, `behavioral-tier-findings.md`, the spec, the architecture, or `testing-standards.md` — the five documents from which §7 draws its authority. A walk whose output has that shape did not sweep §7; it swept §7's code citations. And the plan's own claim 9 registers one investigate.md proposition, so the boundary is not a stated scope decision — it is an unswept remainder.

**What correct looks like.** Walk §7 step by step a second time with the population defined as *every proposition §7 asserts about any file's contents, document or source*, and reconcile against §11 in both directions. Each entry takes the evidence form its claim type requires: a read at a line range for the quoted clauses (F-13, C3, testing-standards' regression clause, investigate.md §6's ruling), the compound search-plus-read form for the propositions asserting what a document does or does not record (B9c's withdrawn evidence, B3's two diagnosticians), and — per §11's own citation rule for files inside this plugin — a path **and line range**, since §7 currently cites these documents by section anchor alone, which is not one of the four citation forms §11's preamble permits. **Do not derive the fix from this review's table; it is a sample of the population, not the specification.** Then correct the four `testing-standards.md` restatements to carry the demonstration requirement the source states, and correct §11's attestation to record the walk's real population and yield.

---

## Critical & Serious Findings

No Critical or Serious findings — the full inventory was Read or Grep-verified per Compliance Gate B, and no violations of Critical or Serious classification were observed. Round 6 reported no Critical or Serious findings either, so there were none to close; the two round-6 findings are dispositioned in the Convergence Record below.

---

## Moderate & Minor Findings

### F2 (Minor) — §11's attestation reports the extraction's yield as "28 distinct tokens," and neither that figure nor its stated 20 + 8 partition reconciles with what the command returns

**Provenance: new.** Round 6 accepted 28 at face value and recorded reproducing it; the figure was not the subject of a finding in any prior round.

**What the plan says.** Read of §11's attestation (plan lines 1847–1848): *"Line-cited half. The extraction returns **28** distinct tokens. All 28 resolve to an entry; claims 36–43 were added by the 2026-08-09 walk to close the eight that did not."* The preceding sentence gives the command verbatim: `grep -noE '[A-Za-z0-9_./-]+\.(md|mjs|js|json):[0-9]+([–,-][0-9]+)*'`.

**How verified.** I re-executed the stated command over §7 (plan lines 235–1617). Piped to `wc -l` it returns **28** lines. Piped to `sort -u` it returns **26**. Reducing further to path-plus-start-line, ignoring range suffixes, gives **25**. The 28 is therefore an *occurrence* count, not a count of distinct tokens: three tokens appear twice each — `skills/expert-review/SKILL.md:565`, `expert-review/SKILL.md:111`, and `check-structure.mjs:64` (`uniq -c` over the sorted output, each returning 2).

The partition compounds it. The attestation says twenty tokens resolved to existing entries and eight did not, producing claims 36–43. Twenty plus eight is twenty-eight, so the partition is stated over occurrences while being described over distinct tokens; against the 26 distinct tokens it does not reconcile in either direction, and a reader cannot tell which of the two populations the eight new claims were drawn from.

**Standard violated.** The pinned contract's Gate B: each compliance question *"must be answerable from the document alone, by pointing to a specific section or annotation. If any answer requires subjective interpretation, the plan has not made its own reasoning visible enough."* The attestation is the plan's own record of how §11's completeness was established, and it is the record the plan itself stakes auditability on — its adjacent sentence argues that a low yield is *"checkable without reading a line of source."* An arithmetic self-record that changes value depending on whether the reader de-duplicates, as the word "distinct" instructs, is not checkable in that way. The review skill's premise discipline is the other half: an attestation inside the artifact is the author's claim, not a verification, and this one does not survive re-derivation.

**What correct looks like.** State the two numbers the command actually produces and label each: 28 occurrences over 26 distinct tokens, with the partition expressed over whichever population the eight new claims were drawn from. §11's line-free attestation already models this well — it gives a yield and then argues from the section's size why that yield is or is not plausible — so the correction is to hold the line-cited half to the same standard.

---

## Tentative Findings

No tentative findings — every candidate finding's premise was verified against current source per Compliance Gate B, with the grep queries, result counts and line-numbered reads recorded in each finding.

Three candidates were investigated and **dropped** rather than demoted, recorded because a review reporting any of them would have been confidently wrong:

- *That §7 maintenance rule 3 and §15's G-3 disagree on how many places the surface enumeration is stated.* Rule 3 says the table, D-8's list and G-3's count are "one set stated in three places"; G-3 says the enumeration is "stated in two places." Dropped: read closely, G-3 refers to the two full *enumerations* (§7's table and D-8's list) while itself carrying only the *count*, which is the third place rule 3 names. Read of D-8 (plan lines 1749–1755) confirms it enumerates the same nine surfaces in the same order as §7's table. The three statements are consistent.
- *That claim 55's document count is stale.* The claim records `find . -name "*.md" | wc -l` → 57 on 2026-08-10; I get **58**. Dropped: the claim states explicitly that the denominator is not re-checkable and that the growth is this review series' own records, and pins the 23-document set by §7's own enumeration (3 + 9 + 11 = 23, which I re-added) rather than by a re-runnable count. The claim is correct about its own unverifiability, which is what the contract asks of it.
- *That S11's clause claims about the four skills are unregistered content claims.* Dropped: claim 13 registers all four lines (`expert-spec/SKILL.md:349`, `expert-architecture/SKILL.md:456,458`, `expert-architecture-portable/SKILL.md:302`, `expert-plan/SKILL.md:390`), and I Read each — the "established location" escape and the "propose a location and get confirmation" / "propose a location to the user and stop" clauses are at exactly those lines and reproduce. These are registered by line, not part of F1's population.

---

## Observations

- **The author did not patch round 6's list, and that is worth recording separately from the finding.** Round 6's F1 tabulated nine propositions and warned in bold that patching those nine would reproduce the defect a fourth time. The walk emitted twelve, of which three (claims 47, 52, 54) appear in no prior review. Rounds 4 and 5 both failed this exact test. Whatever else this round shows, the substitution failure that produced three consecutive findings did not recur.
- **The `collaborativereasoning` and `metacognitivemonitoring` tools were again unavailable in this session's callable roster** — the third consecutive round. The multi-perspective check was performed manually with the three required personas per the skill's documented fallback. Recorded as a procedural note; it changed no finding.

---

## What's Actually Good

- **Claims 45, 46 and 51 are content-absence claims built in the compound form the contract specifies, including the case where the candidate set is empty.** Property: each states the search that defines the candidate set, the reads at the candidates, and the scope covered — and claim 45 handles the degenerate case correctly by stating that the search returns zero files "so the candidate set is empty and there is nothing to read," rather than silently omitting the read half. Standard: the pinned contract's Gate C content-absence item — *"content absence states the search that defined the candidate set, the reads that confirmed absence at the candidates, and the scope covered. Search-only content-absence claims are non-compliance."* Verified by re-executing all three: `grep -rlE "artifact_path|…|responsible_component" agents/ skills/` → 0 files; `grep -rl "stop_report" agents/ skills/` → 1 file, `agents/expert-implementer.md`; `grep -rn "one of two\|one of three\|one of four" agents/` → exactly 2 hits at `expert-verifier.md:11` and `expert-diagnostician.md:14`; `grep -icE "revis(e|ion)"` over `skills/expert-spec/SKILL.md` → 0. Three of the four §11 absence entries in the plan that state a *scope sentence* are these three, and the scope sentence is what makes the claim checkable rather than merely asserted.
- **Claim 50 registers a fail-open control-flow path by reading the destination, not by describing it.** Property: rather than asserting "an unhandled verdict falls through," the entry names both exact-string predicates and then reads the fall-through target, quoting what the owner is actually told. Standard: the contract's §11 literal-content evidence requirement — *"Read the specific file at the specific line. Do not paraphrase remembered code into a claim."* Verified by reading `workflows/expert-lifecycle.js:335`, `:488` and `:343–345`: `:335` is `if (gate.verdict === 'NON_CONVERGENCE') {`, `:488` is `if (gate.verdict !== 'NON_CONVERGENCE') return null`, `:343` sets `delta.phase = 'spec'`, `:344` pushes the spec artifact, and `:345` returns `GATE.intent` with `what_happened` reading *"A specification for … passed independent review."* The claim reproduces line for line, and it is the premise for the plan's own highest-consequence step (S15b), which is the one place a paraphrase would have been most expensive.
- **Claim 44 corrects a loose statement in the step it supports and says so.** Property: S5's body asserts a frontmatter shape "matching the shape of the nine existing agent files"; claim 44 does not merely certify that, it states *"Stated precisely, because S5's shorthand is loose"* and separates what holds of all nine (`---` frontmatter, `skills:` at `:4`, a role body) from what holds only of the six carrying `tools:`, noting the ordering claim is vacuous rather than satisfied in the other three. Standard: ISO/IEC/IEEE 29148:2018 requirement characteristics (Unambiguous), named in §3 as governing this plan's own prose. Verified by running the partition per file: `^tools:` returns 1 for acceptance, closeout, diagnostician, implementer, spec-writer, verifier and 0 for architect, planner, reviewer; `^skills:` returns 1 at `:4` for all nine; `^tools:` is at `:6` in each of the six. A verification entry that tightens the claim it verifies, instead of ratifying it, is the behaviour §11 is for.

---

## Convergence Record

**Round number:** 7 (Post-fix).

**Trajectory:** R1 = **13** (1 Critical, 1 Systemic, 6 Serious, 2 Moderate, 3 Minor) → R2 = **13** (1 Critical, 1 Systemic, 4 Serious, 4 Moderate, 3 Minor) → R3 = **10** (1 Systemic, 7 Serious, 1 Moderate, 1 Minor) → R4 = **7** (1 Systemic, 3 Serious, 2 Moderate, 1 Minor) → R5 = **9** (1 Systemic, 2 Serious, 4 Moderate, 2 Minor) → R6 = **2** (1 Systemic, 1 Minor) → **R7 = 2** (1 Systemic, 1 Minor).

Rounds 1–6 are taken from each round's own verdict line on disk (`grep -n "^Verdict:"` over each record); R7 from this round's mechanical breakdown.

**Flow counts for this round**, from the Step 9 provenance classifications:

- **Prior findings closed: 1.**
  - *R6 F2* (§13's counts attestation predates the last re-derivation walk) — closed against the originally named standard, the contract's Gate C re-derivation item. Read of §13's coupling-hotspot bullet (plan lines 2583–2589): it now reads *"**Both counts re-derived 2026-08-10** in the same §7 walk as §1's Goal, §2, §3, §5, §11, §12 and §14 … That walk confirmed both figures unchanged rather than revising them"* — which is the "confirmed unchanged" form round 6's *What correct looks like* named, and the date now matches §3 (line 78), §5 (line 124) and §11 (line 1845), all 2026-08-10. The content was re-derived independently: §5's workflow row lists exactly the twelve steps named, and the step set enumerates to 26.
- **Prior findings not closed: 1.**
  - *R6 F1* (§11's line-free registration clause unswept) — **not closed**. The nine instances round 6 named are all now registered and the walk emitted twelve rather than nine, but the same clause of the same rule leaves the document-citation population unregistered. Reported as F1 of this round, provenance recurring.
- **New findings: 1** — F2 (§11's attestation arithmetic).
- **Regressions: 0** — no finding this round is introduced or exposed by round 6's fixes. F2's defect predates them: the "28 distinct" figure was written by the 2026-08-09 walk and carried forward unchanged. F1's population was never in scope of round 6's fix rather than damaged by it. All twelve new claims were verified at source and none is false.
- **Recurring: 1** — F1.

1 new + 1 recurring + 0 regressions = 2, reconciling with the finding count.

**Tripwire evaluation — NOT FIRED, but both conditions hold this round and both counters are armed.** Arithmetic shown for both conditions.

*Condition (a) — new + regression findings ≥ closed findings for two consecutive Post-fix rounds.* Round 5: new 3 + regression 3 = 6; closed 7; 6 ≥ 7 is **false** → did not hold. Round 6: new 1 + regression 0 = 1; closed 8; 1 ≥ 8 is **false** → did not hold; consecutive count entering this round = **0**. Round 7: new **1** + regression **0** = **1**; closed = **1**; **1 ≥ 1 is true → the condition holds this round.** **Consecutive count = 1** against a threshold of 2.

*Condition (b) — total findings has not strictly decreased for two consecutive Post-fix rounds.* Round 5: 7 → 9, not a strict decrease → held. Round 6: 9 → 2, a strict decrease → did not hold; consecutive count entering this round = **0**. Round 7: 2 → **2**, which is **not** a strict decrease → **the condition holds this round.** **Consecutive count = 1** against a threshold of 2.

Neither counter has reached 2, so the tripwire is not fired and the recommendation is not foundational rework. **Both counters standing at 1 simultaneously is new in this series** — at no prior round did both conditions hold in the same round. Round 8 repeating **either** condition fires it: a round 8 producing two or more findings, or closing fewer findings than it opens, does so.

**What the arithmetic does not say on its own.** The severity floor is holding — zero Critical for the fifth consecutive round, zero Serious for the second, and the Systemic finding is the only one above Minor for the second round running. Zero regressions for the second consecutive round is the number I weight heaviest, and it means round 6's fixes did not manufacture this round's findings: F1's population was outside the fix's scope and F2's defect predates it. Twelve new §11 entries were added and all twelve verify at source, which is a closure rate no earlier round in this series achieved on a batch that size.

Against that: the count stopped falling, and closures no longer exceed openings. The reason both counters armed at once is arithmetic that gets harder to satisfy as the count approaches zero — at two findings, closing one and opening one is enough to hold both conditions — so the signal is weaker than the same reading would be at round 5's numbers. That is worth stating plainly rather than letting the counters speak alone. But the countervailing signal is genuine and is F1: this is the **sixth consecutive round** in which a class mechanism was authored and its sweep stopped short of the class, and the **third consecutive round** on this specific clause. The plan's own G-3 records that every round to date has found drift in at least one of its nine restating surfaces; that count is now seven of seven.

What round 7 adds to the record that round 6 did not have is a demonstrated consequence. Round 6 could say only that the unswept half was unswept. This round found an unregistered citation that **does not reproduce** against its source — `testing-standards.md`'s regression clause, restated four times in a form that drops the demonstration requirement the source states and explicitly warns about. That is the first instance in seven rounds of the mechanism §11's preamble predicts operating end to end: a citation goes unregistered, is never re-derived, and stops reproducing. It is evidence that the residual G-3 records is producing defects rather than only risk.

---

## Recommended Priority

The tripwire did not fire, so another fix round is the indicated path rather than foundational rework. Two items, and their sizes are not comparable.

1. **F1 — re-walk §7 with the population defined over all files, documents included.** The walk that produced claims 44–55 was executed correctly; its population was drawn too narrowly, covering §7's source-file citations and not its document citations. Re-run it with the population stated as *every proposition §7 asserts about any file's contents*, and reconcile against §11 in both directions. Three things follow from that walk and none of them should be derived from this review's table, which is a sample:

   - Entries for the propositions the walk emits, each in the evidence form its claim type requires — a read at a line range for quoted clauses, the compound search-plus-read form for propositions asserting what a document does or does not record.
   - A citation-form correction. §11's own preamble permits four citation forms, and "path plus section anchor" is not among them; §7 currently cites `docs/investigate.md` and `docs/behavioral-tier-findings.md` by section anchor throughout. For files inside this plugin the preamble requires path **and line range**, so registering these claims will move §7's citations as well as adding §11 entries.
   - The four `testing-standards.md` restatements corrected to carry the demonstration requirement the source states. This is the one place where the registration gap has already produced a divergence, so it is worth doing even ahead of the walk that would have caught it.

   Then correct §11's attestation to record the real population and yield for both halves.

2. **F2 — §11's line-cited attestation arithmetic.** Two numbers and a partition label. Smaller than any item in the last three rounds, and it sits in the same sentence the F1 walk will rewrite, so it costs nothing extra to fix in that pass.

**One structural note for whoever applies these, and it is the note round 6 left open.** Round 6 predicted that if a seventh round reported this class again, the honest reading would be that the second clause of §11's rule *"is not mechanisable on a prose artifact."* A seventh round has reported it again — but the evidence points somewhere more specific than that prediction, and the difference matters for what the owner does next. The failure was not that the walk was skipped or faked: it ran, it was honest, it emitted more than the review asked for, and every proposition it emitted is true at source. The failure was in **defining the population the walk covers**. Twice now the clause has been executed against a population narrower than the class — first at a yield of 2, now at a yield of 12 that is uniformly source-file-shaped. A walk cannot be more complete than its own definition of what it is walking, and "statements about a file's contents" is a definition under which a reasonable author can, twice, read past the documents that supply the plan's authority.

That is still the generation-versus-audit boundary D-8 and G-3 name, and it still points at the output-contract change G-3 proposes — but it sharpens what that change would need to specify. A machine-readable per-step declaration that enumerated file *and document* references, from which §11's coverage set is generated rather than walked, would close it; a rule instructing an author to walk more carefully would not, and has now not, twice. If round 8 reports this class a fourth consecutive time, that is the conclusion, and the arithmetic will have said so independently — both tripwire counters stand at 1, and round 8 repeating either condition fires it.

---

Verdict: NEEDS FIXES (2 findings: 1 Systemic, 1 Minor)
