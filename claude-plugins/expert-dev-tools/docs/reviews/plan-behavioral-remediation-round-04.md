# Plan Review — Round 4

**Artifact:** `claude-plugins/expert-dev-tools/docs/plans/plan-expert-dev-tools-behavioral-remediation.md` (working tree, 2320 lines)
**Governing contract:** `claude-plugins/expert-dev-tools/skills/expert-plan/references/output-contract.md` **at commit `94a640a`** (read via `git show 94a640a:…`; the working-tree copy was not consulted)
**Date:** 2026-08-08
**Reviewer:** independent, round 4, no prior context on this work
**Round:** 4 (Post-fix)

Persisted verbatim by the session that received it; persistence is the only edit.

---

## Scope and Inventory

### Step 3 tool plan

| Claim type in scope | Instrument | Availability |
|---|---|---|
| Literal-content ("line N says Z") | `Read` / `sed -n 'Np'` at the cited line | available, used throughout |
| Content-absence ("no §5 row names S6b", "T-22 does not name the obligation") | `grep` over the named scope, result count recorded | available |
| Structural (blast radius) | CodeGraph | **not exercised** — no finding in this round makes a structural claim; the plan's own structural claim (claim 25) was accepted as out of this round's claim set, recorded as a scope limit below |
| Claims imported from prior documents (rounds 1–3, the plan's own §11/§14) | re-derivation against current source with the instrument the underlying claim type requires | available; every prior-round claim used for provenance was re-derived |
| Library behavior | Context7 | **not needed** — this round's scope contains no library-behavior claim of my own. The plan's one such claim (claim 5, sub-agents `tools`/`disallowedTools`) was not re-verified; recorded as a scope limit |
| Pinned-revision retrieval | `git show 94a640a:<path>` | available, used |

No instrument class was unavailable for a load-bearing claim category, so no halt condition arose.

### Inventory

The Post-fix inventory is constructed from the four required sources: the prior reviews' inventories, the fix set (round 3's changes to the plan — see the scope limit below), the plan's own §5 file list as the artifact's declared blast radius, and the prior rounds' findings as closure items.

**The artifact and its governing documents**
- [x] `docs/plans/plan-expert-dev-tools-behavioral-remediation.md` — Read in full, lines 1–2320 (three paged reads)
- [x] `skills/expert-plan/references/output-contract.md` @ `94a640a` — Read in full via `git show`
- [x] `docs/reviews/plan-behavioral-remediation-round-01.md` — Read: header/findings head (1–40), disposition and convergence record (tail 20)
- [x] `docs/reviews/plan-behavioral-remediation-round-02.md` — Read: header (:9), full findings-and-disposition table (:16–42), convergence record and standing note (tail 30)
- [x] round-3 record — **does not exist.** `ls docs/reviews/` returns exactly two files; `git log --oneline --all --diff-filter=A -- 'claude-plugins/expert-dev-tools/docs/reviews/*'` returns zero rows. This is finding F4, not an inventory gap.

**Inputs the plan cites**
- [x] `docs/investigate.md` — Grep-verified: `grep -n "^## \|^### "` → 22 section headings, confirming §1a, §4b, §4e, §4g, §5a–§5d, §6, §7 all exist as cited
- [x] `docs/behavioral-tier-findings.md` — Grep-verified: `grep -n "^### B"` → 10 B-item headings (B9, B1, B6, B7, B10, B2, B8, B3, B4, B5); `grep -n "B9a\|B9b\|B9c"` → 9 hits confirming B9b confirmed, B9a retracted, B9c's evidence withdrawn

**Source files the plan makes claims about**
- [x] `workflows/expert-lifecycle.js` (493 lines) — Read at `:18–35`, `:45–52`, `:55–75`, `:96–112`, `:224–245`, `:304–345`, `:355–380`, `:405–415`, `:416–460`, `:485–493`; grep'd for `diagnose(` (9 hits), `named standards` (3 hits), `artifact_path` (1 hit), the three path defaults (3 hits)
- [x] `tests/structural/check-structure.mjs` (113 lines) — Read in full
- [x] `commands/expert.md` (181 lines) — Read at `:61–64`, `:74–80`, `:94–99`, `:106–119`
- [x] `.mcp.json` — Read in full
- [x] `skills/expert-spec/SKILL.md` — Read at `:155`, `:160–166`, `:345`, `:349`
- [x] `skills/expert-review/SKILL.md` (634 lines) — Read at `:111`, `:147`, `:560–566`
- [x] `skills/expert-architecture/SKILL.md` — Read at `:64–68`, `:456–458`; `grep -c "^#"` → **0** headings
- [x] `skills/expert-architecture-portable/SKILL.md` — Read at `:302`
- [x] `skills/expert-plan/SKILL.md` — Read at `:390`
- [x] `skills/expert-implement/SKILL.md` — Grep-verified: `grep -c "^#"` → **12**
- [x] `skills/expert-standard/SKILL.md`, `skills/expert-mcp-overhaul/SKILL.md` — Grep-verified via the six-site flag-once scan (below)
- [x] `skills/` directory — `ls` → **9** skills
- [x] `agents/` directory — `ls` → **9** agent files
- [x] `agents/expert-architect.md` — Read `:1–16`; `grep -n "first action"` → 1 hit at `:12`
- [x] `agents/expert-verifier.md` — Read `:13–22`
- [x] `agents/expert-diagnostician.md` — Read `:16`, `:28`
- [x] `agents/expert-planner.md`, `agents/expert-spec-writer.md` — Grep-verified: `grep -rn "docs/specs\|docs/arch\|docs/plans\|docs/architectures" agents/` → 3 hits
- [x] `docs/specs/spec-expert-dev-tools.md` — Grep-verified: `grep -c "WebFetch\|WebSearch"` → **0**
- [x] `docs/arch/architecture-expert-dev-tools.md` — Read at `:750`, `:863`

### Scope limits recorded

1. **Round 3's fix diff was not diffable.** No round-3 baseline artifact exists (F4), so I could not construct the fix-diff half of the Post-fix inventory by diff. I substituted the plan's full text plus the R1/R2 finding sets as closure items, and re-derived every closure from current source. This limits provenance precision for regressions introduced by round 3's fixes specifically; it does not limit any finding I report.
2. **Two of the plan's §11 claims were not independently re-verified**: claim 5 (Context7 sub-agents documentation) and claim 25 (CodeGraph dependents). Neither supports a finding of mine in either direction, and both were verified in round 2's pass.
3. **No rigor waivers.** The invocation requested the methodology in full and it was applied in full.

---

## Summary

**This review returns NEEDS FIXES — 7 findings (1 Systemic, 3 Serious, 2 Moderate, 1 Minor).** The plan's engineering substance is in good shape and materially better than the record suggests: I independently reproduced 17 of the §11 claims against current source — every line number in a 493-line file, the exact `enum` and `required` arrays, the eight `diagnose()` call sites, the three review dispatches carrying "and named standards" while the fourth carries none, the flag-once sweep across all nine skills, the zero-heading architecture skill, the twelve-of-twenty-six workflow-modifying step count — and all 17 reproduce exactly. The step set is complete against §2's coverage table, all 26 steps carry a §3 registry entry, and the design decisions in S6b, S15b and S2b are sound and correctly scoped.

What has not converged is the plan's own bookkeeping surface, and it has now failed in four consecutive rounds. Round 2 reported cross-reference drift in §5 (M-2) and recorded the fix as "§5 re-derived in full against 26 steps"; §5 is still not re-derived — three separate step bodies assert a §5 listing that does not exist, and one of those three is the *specific* listing round 2's S-1 disposition claimed to have made. Round 2 reported claim 13 undercounting the artifact-path sources (S-4) and recorded it "re-derived to six"; it still undercounts, and this time the omission is load-bearing rather than cosmetic — S11 changes the architecture skill's output directory while three agent files state the old one, a contradiction the plan schedules no edit for. Six of the seven findings are recurrences of classes reported in round 1 or round 2, not new defects.

The tripwire did not fire, and the arithmetic below shows why under every consistent value of the missing round-3 count. But the reason it did not fire is that the finding *count* dropped sharply (13 → 7) while the finding *classes* did not, and that is the pattern the plan's own D-1 table calls "re-derive the section, sweep the class incompletely."

---

## Upstream Contract Verification

The upstream artifact is the pinned output contract at `94a640a`. Verified per its Gate A / B / C.

**All sixteen required output sections are present** (Read of the plan's own headings, §1–§16, lines 11, 25, 76, 110, 120, 201, 226, 1539, 1555, 1576, 1703, 1894, 2129, 2172, 2255, 2290). No "if applicable" section with content is omitted.

**Gate A — does the plan enable downstream work**

| Item | Status | Verification |
|---|---|---|
| Implementer can execute without on-the-fly decisions | **fail** | S2's Source annotation points an implementer at `expert-spec/SKILL.md:163`, which does not contain the cited text and which S16 deletes — F3 |
| Reviewer can check a build against it | **fail** | T-21's oracle is §5's file list; §5 omits two files S6b part 5 edits, so T-21 fails on correct execution — F1 |
| User knows what they are getting and what was excluded with approval | **pass** | §2's four exclusions each cite an owner ruling or a deferral in the source document; Q-10, Q-11, Q-12, Q-13, Q-17 each carry the owner's answer and the step incorporating it (Read, plan §2 lines 33–41 and §14 lines 2185–2192) |

**Gate B — is the plan's own compliance auditable**

| Question | Status | Verification |
|---|---|---|
| Which standards govern, and what does each govern (§3)? | **pass** | §3's 20 registry rows collectively name all 26 steps; I enumerated the step IDs across the rows and every one of S1…S23 appears at least once |
| Where does each non-trivial step come from (Source)? | **fail** | S2's Source is miscited — F3 |
| What alternatives were rejected per step (Gate 3 part 4)? | **pass** | Read of every step: S1, S2, S2b, S4, S5, S6, S6b, S8, S9, S10, S11, S12, S15, S15b, S16, S17, S18, S20, S22 each carry a "What this is NOT — and why" block; S3, S7, S13, S14, S19, S21, S23 are declared trivial or trivial-plus with the shortened justification the contract permits |
| How was each factual claim verified (§11)? | **fail** | Four factual claims asserted in step prose have no §11 entry, and three of the four do not reproduce — F3 |
| Which decisions involved judgment (§10)? | **pass** | D-1…D-8, each with reasoning; D-1 carries a scored alternatives table and an explicit "what this decision does not claim" |
| Where does the plan diverge from codebase patterns (§8)? | **pass** | D-A, D-B, D-C, each naming the justifying standard |
| What questions arose and how was each closed (§14)? | **pass** | Q-1…Q-21, every entry binned and dispositioned, zero open, sweep count attested at eight passes |
| Per test: behavior, level, doubles, data, failure condition (§12)? | **fail** | T-22's double supplies `sections_rederived` and does not name the production component obliged to supply it — F7; T-21 names no step — F6 |
| What could not be grounded (§15)? | **pass** | G-1, G-2, G-3, each with resolution-attempt evidence and why resolution is out of the planner's reach |

**Gate C — final checklist.** Items failing: "Every factual claim asserted in any plan step has a corresponding entry in §11" (F3); "File paths and function names are confirmed against the current codebase, not assumed" (F2, F3); "any double that supplies an input the system under test reads names the production component obliged to supply it" (F7); "The restating sections (2, 3, 5, 11, 12, 14, plus §1's Goal and §13's counts) were re-derived from the current step set after the last step edit, not patched" (F1, F5). All other Gate C items pass — verified item by item against the plan text, including the coverage reconciliation (§2 maps every requested element to steps or to a cited approved exclusion), the absence-claim evidence forms (claims 12, 18 both carry the compound search-plus-read form the contract requires for content absence), and the citation-identity rule for out-of-artifact references (claim 27 pinned to `755bf9b`/`cd2f27b`; claims 11, 26, 28 dated with unpinnable status stated) — with the single exception in F4.

---

## Systemic Patterns

### F1 (Systemic, Serious) — §5 has not been re-derived; three step bodies assert a §5 listing that does not exist, and T-21 fails on correct execution

**Provenance: recurring** (round 1 S-6 "§5 omits modified files; T-21 fails by construction" and M-2; round 2 M-2 "cross-reference drift, four instances in §5 and §13", whose disposition reads "§5 re-derived in full against 26 steps"; round 2 S-1, whose disposition reads "`agents/expert-reviewer.md` and `skills/expert-review/SKILL.md`, all listed in §5").

**Proactive scan.** `grep -n "listed in §5\|in §5\|§5 under\|listed under"` over the plan → **6 hits** (lines 257, 552, 711, 724, 957, 1710). Two (257, 1710) are general statements of the rule, not per-file claims. The four checkable per-file claims:

| Plan line | Claim | §5 says | Verdict |
|---|---|---|---|
| 552 | `agents/expert-corrector.md` "is therefore listed under **both** S5 (created) and S2b (contract keys) in §5" | line 131: `agents/expert-corrector.md` → `S5 (creates, frontmatter and body)` — S2b absent | **false** |
| 711 | S6b's three paired edits "all listed in §5" (`skills/expert-correct/SKILL.md`, `agents/expert-corrector.md`, S6's prompt) | lines 130–131 list the two files under S4 and S5 only — S6b absent from both | **false** |
| 724 | "`agents/expert-reviewer.md` and `skills/expert-review/SKILL.md`. Both files are listed in §5 under this step" | line 153: `agents/expert-reviewer.md` → **"S2b only"**; line 162: `skills/expert-review/SKILL.md` → `S16` — S6b absent from both, and line 153 affirmatively excludes it | **false** |
| 957 | `commands/expert.md` "is listed in §5 under this step" (S10) | line 172: `commands/expert.md` → `S10, S18, S19` | **true** |

**How verified.** Read of the plan at lines 128–178 (all five §5 sublists) and at lines 552, 711, 724, 957; the grep query and its 6-hit count recorded above. Three of four checkable instances are false, at three distinct step bodies, against one section.

**Standard violated.** The pinned output contract's Gate C: *"The restating sections (2, 3, 5, 11, 12, 14, plus section 1's Goal and section 13's counts) were re-derived from the current step set after the last step edit, not patched. A plan whose step set changed after these sections were last written has not satisfied this item."* Also the contract's §5 definition — "every file that will be created, modified, or deleted" — since S6b part 5 modifies two files §5 does not attribute to it. And the plan's own §7 maintenance rule 3, which requires §5 to be re-derived rather than patched on any step edit.

**Why this is systemic rather than isolated.** It is not three copies of one typo; it is the section-level property the contract names. Round 2's M-2 disposition asserts §5 was re-derived in full against 26 steps, and round 2's S-1 disposition asserts specifically that `expert-reviewer.md` and `expert-review/SKILL.md` are listed under the step that edits them. Both assertions are false against the current text. That is the plan's own §7 rule 4 firing — "a finding in any restating section is a class signal, not an instance" — for the fourth consecutive round.

**Consequence, not merely bookkeeping.** T-21's oracle is §5's five sublists ("jointly '§5's file list' for T-21's purposes", plan line 124) compared against `git diff --stat` **in both directions**. An implementer who executes S6b part 5 faithfully edits `agents/expert-reviewer.md` and `skills/expert-review/SKILL.md`; both are in §5, so the diff-direction check passes, but the step attribution that CP-4 and the §7 rule-3 re-derivation depend on is wrong, and any reader reconciling §5 against the step set will conclude S6b part 5 was dropped. Round 1's S-6 was this exact failure.

**What correct looks like.** Re-derive §5 from the current 26-step set — walking §7 step by step and emitting each step's touched files, not locating the lines a review named. The four resulting rows: `skills/expert-correct/SKILL.md` → `S4, S6b`; `agents/expert-corrector.md` → `S5, S2b, S6b`; `agents/expert-reviewer.md` → `S2b, S6b`; `skills/expert-review/SKILL.md` → `S16, S6b`. Per §7 rule 3 the same edit re-derives §2, §3, §11, §12, §14, §1's Goal and §13's counts, which is where F5 will also be caught.

---

## Critical & Serious Findings

### F2 (Serious) — claim 13's artifact-path enumeration still undercounts, and S11 introduces a skill/agent contradiction with no paired edit

**Provenance: recurring** (round 2 S-4, "Claim 13 undercounts the artifact-path sources"; disposition: "Claim 13 re-derived to six").

**What the plan says.** §11 claim 13 (Read, plan lines 1780–1788): *"Six sources of truth for the artifact path, one of which outranks the workflow (S10, S11). Evidence — file reads, **re-derived by a scan over the complete plugin 2026-07-31**"* — then enumerates `skills/expert-spec/SKILL.md:349`, `skills/expert-architecture/SKILL.md:456,458`, `skills/expert-architecture-portable/SKILL.md:302`, `skills/expert-plan/SKILL.md:390`, `workflows/expert-lifecycle.js:281`, `commands/expert.md:61–64`.

**How verified — content absence over the scope the claim declares (the complete plugin).** `grep -rn "docs/specs\|docs/arch\|docs/plans\|docs/architectures" agents/ commands/` → **4 hits**, of which three are outside the enumeration:

- `agents/expert-architect.md:16` — "Write the architecture to `docs/arch/`."
- `agents/expert-planner.md:17` — "Write the plan to `docs/plans/`."
- `agents/expert-spec-writer.md:16` — "writes the spec to `docs/specs/`."

Each read at the cited line. The sources are therefore **nine**, not six, and the scan the claim describes as covering the complete plugin did not cover `agents/`.

**Why this one is load-bearing, not a counting error.** S11 (Read, plan lines 996–1002) changes `skills/expert-architecture/SKILL.md` and `skills/expert-architecture-portable/SKILL.md` so the architecture is written to **`docs/architectures/`**. `agents/expert-architect.md:16` — which the workflow dispatches for that phase — says **`docs/arch/`**, and §5 schedules no edit to it under S11. After S11 executes, the agent's instruction and the skill it is required to invoke first (`agents/expert-architect.md:12`, Read) name different directories for the same artifact. The step's own stated goal is "one fixed convention"; it delivers two.

**Standard violated.** Single Source of Truth (Beck, *Once and Only Once*) and ISO/IEC/IEEE 29148:2018 §5.2.6 (Consistent) — both named in the plan's own §3 as governing S10 and S11. Additionally the plan's §7 maintenance rule 5: *"Any step that changes what the workflow expects of an agent carries a paired edit to that agent's governing document, listed in §5."* An agent whose body names a directory the skill no longer uses is that rule's case with the roles reversed, and the rule states it is symmetric ("caller and agent must agree, whichever side moves"). And the contract's Gate C: *"Every absence claim states its kind and carries the matching evidence: … content absence … states the search that defined the candidate set, the reads that confirmed absence at the candidates, and the scope covered."* Claim 13 states a scope ("the complete plugin") its search did not cover.

**What correct looks like.** Re-derive claim 13 over the actual complete plugin — including `agents/` — to nine sources; add `agents/expert-architect.md` to S11's What-changes and to §5 (changing `docs/arch/` to `docs/architectures/`); and confirm `agents/expert-planner.md:17` and `agents/expert-spec-writer.md:16` already agree with S11's conventions (they do — `docs/plans/`, `docs/specs/`) so that agreement is recorded rather than incidental. T-10's scope should extend to the three agent files, since its current four-file scope cannot see the contradiction.

---

### F3 (Serious) — four factual claims asserted in step prose have no §11 entry, and three of them do not reproduce against current source

**Provenance: recurring class** (round 1 C-1, "the designated load-bearing claim does not verify"; round 2 M-1, "claim 6 asserts a grep result that does not reproduce"). The instances are new; the class is not.

**Proactive scan.** `grep -no "<path>.(md|mjs|js|json):<lines>"` over plan lines 1–1702 (everything before §11) → **27 path-and-line citations**. I checked each against its §11 registration and against current source. Twenty-three reproduce and/or are registered. Four are unregistered in §11, and three of those four do not reproduce:

| Plan line | Citation | Asserted content | Current source | Verdict |
|---|---|---|---|---|
| 327 (S2 **Source**) | `expert-spec/SKILL.md:163` | "requires verification 'via Context7 or the authoritative source'" | `:163` is the **flag-once** paragraph ("When the user wants to skip this step… Flag it once, then write the spec they asked for"). The cited text is at **`:155`**. | **false** |
| 833 (S8 code comment) | `expert-review SKILL.md:561` | "The reviewer names a standard per finding" | `:560` is the heading `### Gate A — Frame evidence per finding`; `:561` and `:562` are **blank**; the bullet is at **`:563`**. | **false** |
| 874 (S8 part 3) | `expert-review/SKILL.md:561` | same | same | **false** |
| 528 (S5) | `expert-architect.md:11` | "opens 'Your first action: invoke `Skill(…)`'" | `:11` is **blank**; `grep -n "first action"` → one hit at **`:12`**. | **false** |
| 291 (S1 part 4) | `check-structure.mjs:100` | "asserts the declared server set contains `context7`" | `:100` reads `check('T-A2c mcp: mcpServers wrapper declares context7 + clear-thought', servers.includes('context7') && …)` | true, but unregistered |

**How verified.** `sed -n '155p;160,166p' skills/expert-spec/SKILL.md`; `sed -n '560,566p' skills/expert-review/SKILL.md`; `sed -n '1,16p' agents/expert-architect.md` plus `grep -n "first action" agents/expert-architect.md` → 1 hit at `:12`; `Read` of `tests/structural/check-structure.mjs:100`. Each read at the time this finding was drafted.

**Why the `:163` instance is the serious one.** It is a **Source annotation** — the contract's Gate C makes Source the per-step provenance mechanism, and Gate B makes "where does each non-trivial step come from" answerable from it. An implementer executing S2 who opens the cited authority finds the wrong clause. Worse, S16 **deletes** that clause (S16's table, plan line 1242, cites the same `skills/expert-spec/SKILL.md:163` for the flag-once site, and claim 18 registers it there). So S2's stated authority is a passage the same plan removes: after execution, S2's Source points at nothing.

**Standard violated.** The pinned contract's Gate C: *"Every factual claim asserted in any plan step has a corresponding entry in Output section 11. The two are reconciled — claims without entries are non-compliance"* and *"File paths and function names are confirmed against the current codebase, not assumed."* Also §11's own definition — a factual claim is "any statement the plan makes about file contents… what a doc currently says," which all four are.

**What correct looks like.** Correct S2's Source to `skills/expert-spec/SKILL.md:155` and register it in §11; correct both `:561` citations to `:563`; correct `expert-architect.md:11` to `:12`; register the `check-structure.mjs:100` claim. Then sweep the class rather than the instances — the distinguishing property is *unregistered* citations in step prose, since all 17 §11-registered citations I checked reproduce exactly. The class fix is to make §11 registration the condition for any `path:line` appearing anywhere in §7, which is a §11-preamble rule of the same kind the plan already adopted for citation identity.

---

### F4 (Serious) — the round-3 review record is unreachable, while §2 and §14 cite it as the evidence for two steps and two superseded dispositions

**Provenance: new.**

**What the plan does.** §2's coverage reconciliation (Read, plan lines 66–67) attributes two of its rows to round-3 findings by identifier: *"Agent return contracts bound to the schemas the workflow reads (review r2 SYS-2, **r3 S-1/S-5**) | S2b"* and *"`findings[].location` required with a grammar (**review r3 S-6**) | S6b part 5."* §14 (plan lines 2206–2209) states: *"Four dispositions were superseded… the superseded version and the reasoning that overturned it are in the corresponding `docs/reviews/plan-behavioral-remediation-round-0N.md` record, which is where drafting history belongs."* §14's reconciliation sweep (line 2201) states passes 6–8 "followed review rounds 1–3."

**How verified.** `ls docs/reviews/` → exactly two files, `plan-behavioral-remediation-round-01.md` and `plan-behavioral-remediation-round-02.md`. `git log --oneline --all --diff-filter=A -- 'claude-plugins/expert-dev-tools/docs/reviews/*'` → **zero rows**, so no round-3 record was ever added and later removed on any branch. Read of the plan's `### Review rounds` subsection (lines 2211–2251): it contains a **Round 1** heading and nothing for rounds 2 or 3. Round 1's own record states (Read, tail): *"Individual landings are tabulated in the plan's §14 'Review rounds'"* — designating §14 as the home for landings, which carries round 1 only.

So: round 3's findings `S-1`, `S-5`, `S-6` are cited as sources in the governing document and exist in no retrievable artifact — not on disk, not in git, not in §14.

**Standard violated.** The pinned contract's §11 citation-identity rule: *"the evidence must be reachable by the next reader… A path-and-date citation to a mutable file stops being checkable the moment that file is edited… and the next reader cannot distinguish 'this was never true' from 'this was true and the source moved.'"* A citation to a document that does not exist is the terminal case of that failure. Round 1's C-1 was this same standard applied to a file that had been rewritten; this is the same standard applied to a file never written.

**Why it matters beyond traceability.** Round 2's record closes with an armed tripwire — *"(a) 11 ≥ 11 → holds this round; consecutive = 1; needs 2 … (b) 13 → 13 → holds this round; consecutive = 1; needs 2. **Round 3 repeating either fires it**"* — which makes round 3's finding count the single number that determines whether the fix cycle was already required to stop and route to foundational rework. That number is recorded nowhere. I resolved the round-4 tripwire by case analysis over all consistent values of R3 (see the Convergence Record), but no future reader can audit whether round 3 itself should have fired it.

**What correct looks like.** Reconstruct the round-3 record from the round-3 reviewer's output and write it to `docs/reviews/plan-behavioral-remediation-round-03.md` with its finding set, severity breakdown, dispositions and convergence arithmetic; then extend §14's `### Review rounds` to carry rounds 2 and 3 alongside round 1, since §14 is the designated home for landings and is the surface a reader reaches first. If the round-3 output is genuinely unrecoverable, that is a §15 gap entry with its resolution-attempt evidence — not a silent citation to a document that does not exist.

---

## Moderate & Minor Findings

### F5 (Moderate) — §5's fourth sublist is headed "(7)" and enumerates 8 rows, and `README.md` appears in two sublists that §5 declares are jointly T-21's membership set

**Provenance: recurring** (round 1 Mi-1, counting errors; round 2 M-2, cross-reference drift with "counts corrected"; round 2 M-4, T-21's membership set).

**How verified.** Read of the plan at lines 168–178. The header reads `**Modified — workflow, command, tests, docs (7)**`; the rows are `workflows/expert-lifecycle.js`, `commands/expert.md`, `tests/structural/check-structure.mjs`, `tests/fixture/spec/spec-contradictory.md`, `tests/ACCEPTANCE.md`, `docs/investigate.md`, `docs/behavioral-tier-findings.md`, `README.md` — **8 rows**. `README.md` also appears in the `**Created (3)**` sublist at line 133. Plan line 124 states the five sublists "are jointly '§5's file list' for T-21's purposes."

**Standard violated.** ISO/IEC/IEEE 29148:2018 §5.2.6 (Consistent), named in the plan's own §3 as governing consistency of enumerations; and the contract's Gate C re-derivation item, since a hand-patched count is precisely what re-derivation from the step set would have produced correctly.

**What correct looks like.** Emitted by the same §5 re-derivation F1 requires: the header count follows from the row count, and `README.md` appears once — under Created, with both S1 and S23 in its Steps cell — so the union that T-21 tests is a set rather than a multiset.

### F6 (Minor) — T-21's specification names no step, breaking the step↔test pairing §7 rule 2 declares bidirectional

**Provenance: recurring** (round 2 Mi-1, "§7 maintenance rule 2 is violated by 21 of 22 test specs and forbidden by the output contract, which requires specs to trace to steps"; disposition: rule 2's §12 clause withdrawn and replaced by an explicit bidirectionality requirement).

**How verified.** Read of the plan at lines 2121–2125. T-21's *Behavior verified* reads: *"`git diff --stat` equals §5's file list, in both directions"* — it names §5, not a step. Every other specification names its step: T-1 "S1's change", T-2 "S2", T-2b "S2b", T-3 "S3's assertion", …, T-20 "S22", T-22 "S6b". Read of §7 rule 2 (plan lines 242–244): *"specifications name their steps **and** step Verification fields name their test IDs. That pair is bidirectional by contract; rule 3 is what keeps it consistent. Do not one-way it."*

**Standard violated.** The pinned contract's §12: each specification carries *"behavior verified (traced to spec requirement **or step**)"*, and the plan's own §7 rule 2 as amended in round 3.

**What correct looks like.** T-21's *Behavior verified* opens with its step — S23, whose Verification field already names T-21 — with §5 named as the oracle rather than as the trace target.

### F7 (Moderate) — T-22's stub supplies `sections_rederived` without naming the production component obliged to supply it

**Provenance: recurring** (round 1 S-1, "S6b's control cannot fire; its test passes on a stub"; round 2 S-1, "Detector (a) consumes a free-text `location` nothing obliges; T-22's stub supplies the format").

**How verified.** Read of T-22 in full, plan lines 2081–2119. Its real/double boundary paragraph names the taxonomy kind (*"Meszaros: stub — canned returns supplying the inputs that drive the asserted verdict"*) and its justification (*"the real functions dispatch subagents, which is neither fast nor deterministic"*), and correctly states the subject is never doubled. Content absence over the specification's own scope: `grep -n "oblig\|contractually\|expert-corrector\|expert-correct"` over plan lines 2081–2126 → **0 hits**. The `remediateFn` stub supplies `sections_rederived` and `class_sweep`, both of which `runGate` reads and both of which drive the asserted verdict.

**Standard violated.** The pinned contract's §12, verbatim: *"**and where a double supplies an input the system under test reads, the specification names the production component contractually obliged to supply that input and where the obligation is written**; if no such obligation exists, the test is green over a path that cannot execute."* Gate C repeats it as a checklist item.

**Why this is not merely formal.** The obligation now genuinely exists — S6b part 4 creates it in three places and S5's `returns:` frontmatter carries it — so the substantive defect round 1's S-1 named is fixed. What is missing is the specification stating it, which is the mechanism the contract uses to make the fix auditable at the test level rather than by cross-reading three steps. Round 1's S-1 and round 2's S-1 both landed on this test for adjacent reasons; leaving the naming out is what lets the next schema change re-open the same hole silently.

**What correct looks like.** One clause in T-22's real/double boundary: the `remediateFn` stub's `sections_rederived` and `class_sweep` fields are obliged of `agents/expert-corrector.md` by its `returns:` frontmatter (S5) and of the corrector's method by `skills/expert-correct/SKILL.md`'s structured return contract (S4), with the schema declaring them at `PHASE_SCHEMA.properties.sections_rederived` (S6b part 1) — the same three-way pairing S6b part 4 already enumerates.

---

## Tentative Findings

No tentative findings — every candidate finding's premise was verified against current source per Compliance Gate B, with the grep queries, result counts and file:line reads recorded in each finding. Two candidates were dropped rather than demoted: a candidate that S5's proposed corrector frontmatter would break the suite's `frontmatter()` parser on its two-line `description:` value was **dropped** after reading `tests/structural/check-structure.mjs:14–34` and tracing the parse — the continuation line contains no colon, so `ci > 0` is false and the line is skipped, leaving `fm.description` truthy and `check(…, !!fm.description)` at `:61` satisfied; and a candidate that S7's addition of `expert-corrector` to `allowlist` would trip the `Skill` requirement at `:65` was dropped after reading S5's proposed `tools:` line, which includes `Skill`.

---

## Observations

- The plan's §11 verification discipline is the strongest surface in the document, and the contrast with §5 is instructive rather than incidental: every claim inside the numbered §11 list reproduces, and every failure I found sits in prose that §11 does not govern. That is a scoping property of where the discipline is applied, not a quality difference in the author's care.
- The `### Review rounds` subsection is a plan-added surface, not one of the contract's sixteen sections. Its round-1 table is unusually good — findings mapped to landings, plus a seven-class analysis with a mechanism per class. F4 is about what is missing from it, not about the surface being wrong to have.

---

## What's Actually Good

- **S6b's rejected-alternative block is a correctly-argued design decision, verified against the evidence it cites.** Property: the rejected `standard`-matching rule is refuted on the plan's own round-1 data rather than on assertion. Standard: the contract's Gate 3 part 4 ("what alternatives were rejected, and why"). Verified by Read of plan lines 2694–2701 against round 1's record — the plan states round 1 cited ISO/IEC/IEEE 29148 §5.2.6 at two locations and the output contract at four, and I confirmed the pattern is real by reading round 1's finding table, where the drift class alone spans S-6 and M-2 at different sites. A rule that escalates `CORRECTION_FAILED` on that shape would stop a converging gate, exactly as the plan argues. The set-membership replacement, plus T-22's third executed case built specifically as the false-positive guard, is a correct fix rather than a narrowed restatement.
- **S15b's fail-closed analysis is exact against the source it changes.** Property: the consequence of the unhandled state is traced to the specific lines that produce it. Standard: OWASP fail-safe defaults, which `docs/arch/architecture-expert-dev-tools.md:750` (Read) already names for D6 STOP routing. Verified by Read of `workflows/expert-lifecycle.js:335` (`if (gate.verdict === 'NON_CONVERGENCE') {`), `:343–345` (which return `GATE.intent` with `what_happened: 'A specification for "${task}" passed independent review'`), and `:488` (`if (gate.verdict !== 'NON_CONVERGENCE') return null`). The plan's claim — that an unhandled `CORRECTION_FAILED` at the spec gate tells the owner the specification *passed* independent review — is literally what those lines do.
- **Claim 9's distinction between the three gates and the fourth survived into S8's step body.** Property: a source distinction that a restatement would normally flatten was preserved and drove a different edit shape. Standard: Design by Contract as applied to executability — a replacement instruction at a site with nothing to replace is unexecutable. Verified by `grep -c "named standards" workflows/expert-lifecycle.js` → **3** at `:330`, `:359`, `:377`, and Read of `:410`, which contains no such phrase. S8 correctly specifies replacement at three sites and insertion at the fourth, and T-8's fail condition covers both halves. This was round 1's S-4 and round 2's S-3; it is now closed correctly.

---

## Convergence Record

**Round number:** 4 (Post-fix).

**Trajectory:** R1 = **13** (1 Critical, 1 Systemic, 6 Serious, 2 Moderate, 3 Minor — taken from the round-01 record's corrected body count) → R2 = **13** (1 Critical, 1 Systemic, 4 Serious, 4 Moderate, 3 Minor) → R3 = **unrecorded** (F4) → R4 = **7** (1 Systemic, 3 Serious, 2 Moderate, 1 Minor).

**Flow counts for this round**, from the provenance classifications in Step 9:

- **Prior findings closed: 9**, all re-derived from current source rather than accepted from the prior record. R2 C-1 (S7's guard withdrawn, replaced by S2b's frontmatter oracle — Read, plan lines 802–810 and 381–397). R2 SYS-2 (S2b exists with `returns:`/`jobs:` and the binding assertion). R2 S-2 (detector (b) rebuilt as set membership, scoped to the three document gates; `runGate` confirmed a single shared function called at `:329, :358, :376, :409`). R2 S-3 (S9 cites literal paths for three gates; `grep -c "^#" skills/expert-architecture/SKILL.md` → 0 and `skills/expert-implement/SKILL.md` → 12 both reproduce; Q-21 records the scope-out; T-8 covers both halves). R2 M-1 (`grep -c "WebFetch\|WebSearch" docs/specs/spec-expert-dev-tools.md` → **0**, re-executed). R2 M-3 (§14 now states 13 findings and 6 Serious alongside SYS-1; the round-01 record carries its own correction note). R2 M-4 (S23 enumerates 23 of 44 docs into three groups; no wildcard row remains). R2 Mi-2 (Q-20 names `CORRECTION_FAILED`). R2 Mi-3 (S18's Verification names T-16 **and** T-17). Half of R2's S-4 also closed — S10's precedence inversion is specified correctly — but the claim-13 half did not, so S-4 is counted below rather than here.
- **New findings: 1** — F4.
- **Recurring: 6** — F1 (R1 S-6/M-2, R2 M-2, R2 S-1's §5 half), F2 (R2 S-4), F3 (R1 C-1, R2 M-1 class), F5 (R1 Mi-1, R2 M-2), F6 (R2 Mi-1), F7 (R1 S-1, R2 S-1).
- **Regressions: 0.** No finding this round is attributable to a defect introduced or exposed by round 3's fixes. This determination is weaker than the others because round 3's fix diff is not reconstructible (F4); I state it as zero because every one of the six recurring findings reproduces a condition that R1 or R2 already reported at the same location or in the same section, none of which round 3 could have introduced.

**Tripwire evaluation — NOT FIRED.** Arithmetic shown for both conditions.

*Condition (a) — new + regression ≥ closed for two consecutive Post-fix rounds.* Round 2: 11 ≥ 11 → held; consecutive = 1. Round 3: indeterminate (F4). Round 4: new (1) + regression (0) = **1**; closed = **9**; 1 ≥ 9 is **false** → does not hold this round. A condition that does not hold at round 4 breaks any run of consecutive rounds ending at round 4, so (a) cannot fire at this round regardless of round 3's value. **Consecutive count resets to 0.**

*Condition (b) — total findings has not strictly decreased for two consecutive Post-fix rounds.* Round 2: 13 → 13, not strictly decreased → held; consecutive = 1. Round 4's total is 7. For (b) to fire at round 4 it must hold at both round 3 and round 4. Holding at round 4 requires 7 to be *not* strictly less than R3, i.e. **R3 ≤ 7**. Holding at round 3 requires R3 to be not strictly less than R2 = 13, i.e. **R3 ≥ 13**. `R3 ≤ 7` and `R3 ≥ 13` are jointly unsatisfiable, so under **every** consistent value of the unrecorded R3, condition (b) does not fire at round 4. **Consecutive count resets to 0.**

**Caveat the arithmetic does not remove.** The tripwire is evaluated on counts, and the counts moved (13 → 13 → ? → 7) while the *classes* did not: six of seven findings this round are recurrences of classes first reported in round 1 or round 2, and two of them — §5's re-derivation and claim 13's enumeration — were each reported closed by a prior round's disposition that does not hold against current source. Whether round 3 itself should have fired the tripwire is unauditable, which is F4.

---

## Recommended Priority

The tripwire did not fire, so another fix round is the indicated path rather than foundational rework. Fix in this order, and treat the first three as one edit rather than three:

1. **F1, F5, F2's §11 half, F3, F6 — one re-derivation pass, not five patches.** Every one of these is a restating-section defect, and the plan's own §7 rule 3 and the contract's Gate C both require the fix to be a re-derivation of §5, §2, §3, §11, §12, §14, §1's Goal and §13's counts from the current 26-step set. Patching the specific lines this review named is the mechanism that produced round 2's M-2 disposition ("§5 re-derived in full") and left three false §5-listing claims standing, and it is what the plan's D-1 table calls the dominant failure mode. Do the walk; do not grep for the names in this document.
2. **F2's substantive half — the `docs/arch/` vs `docs/architectures/` contradiction.** This is the only finding that changes what the plugin does after execution rather than what the plan says about itself. Add `agents/expert-architect.md` to S11 and to §5, and widen T-10's scope to the three agent files so the contradiction is mechanically visible rather than dependent on a reviewer grepping `agents/`.
3. **F4 — reconstruct the round-3 record, or record its loss as a §15 gap.** This is second in consequence but third in order because it is independent of the re-derivation and can proceed in parallel. Until it exists, no reader can audit whether the cycle was already required to stop at round 3, and §2's two round-3 citations point at nothing.
4. **F7 — one clause in T-22.** Smallest edit in the set, and it closes the last thread of a finding that has now been raised in two consecutive rounds for adjacent reasons.

One structural note for whoever applies these: F3's class fix is a rule, not a set of corrections. The distinguishing property of the four defective citations is that they are unregistered in §11, while all 17 §11-registered citations I independently re-executed reproduce exactly. Requiring §11 registration for any `path:line` appearing anywhere in §7 closes the class at its source; correcting the four line numbers does not.

---

Verdict: NEEDS FIXES (7 findings: 1 Systemic, 3 Serious, 2 Moderate, 1 Minor)
