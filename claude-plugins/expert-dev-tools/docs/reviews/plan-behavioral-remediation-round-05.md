# Plan Review — Round 5

**Artifact:** `claude-plugins/expert-dev-tools/docs/plans/plan-expert-dev-tools-behavioral-remediation.md` (working tree, 2486 lines)
**Governing contract:** `claude-plugins/expert-dev-tools/skills/expert-plan/references/output-contract.md` **at commit `94a640a`** (read via `git show 94a640a:…`; the working-tree copy was not consulted, per the pinned instruction)
**Date:** 2026-08-08
**Reviewer:** independent, round 5, dispatched with artifact + prior-round records + input pointers only
**Round:** 5 (Post-fix)

---

## Scope and Inventory

### Step 3 tool plan

| Claim type in scope | Instrument | Availability |
|---|---|---|
| Literal-content ("line N says Z") | `Read` / `sed -n 'Np'` / `awk` line-numbered read at the cited line | available, used throughout |
| Content-absence ("no §11 entry registers X", "T-22 does not name the halted path") | `grep` over the named scope, query and result count recorded | available |
| Structural (blast radius) | CodeGraph | **not exercised** — no finding this round makes a structural claim. The plan's own structural claim (claim 25) was not re-verified; recorded as a scope limit |
| Library behavior | Context7 | **not needed** — no finding this round rests on library behavior. The plan's one such claim (claim 5) was not re-verified; recorded as a scope limit |
| Claims imported from prior documents (rounds 1–4, the plan's own §11/§14 dispositions) | re-derivation against current source with the instrument the underlying claim type requires | available; every prior-round claim used for provenance or closure was re-derived |
| Pinned-revision retrieval | `git show 94a640a:<path>` | available, used |

No instrument class was unavailable for a load-bearing claim category, so no halt condition arose.

### Inventory

Constructed from the four Post-fix sources: the prior rounds' inventories, the fix set (round 4's changes to the plan), the plan's §5 file list as the artifact's declared blast radius, and rounds 1–4's findings as closure items.

**The artifact and its governing documents**
- [x] `docs/plans/plan-expert-dev-tools-behavioral-remediation.md` — Read in full, lines 1–2486 (three paged reads), plus re-reads at drafting: 120–202, 385–453, 547–600, 665–760, 1744–1986, 2182–2242, 2289–2330
- [x] `skills/expert-plan/references/output-contract.md` @ `94a640a` — Read in full via `git show`
- [x] `docs/reviews/plan-behavioral-remediation-round-01.md` — Read in full (167 lines)
- [x] `docs/reviews/plan-behavioral-remediation-round-02.md` — Read in full (68 lines)
- [x] `docs/reviews/plan-behavioral-remediation-round-03.md` — Read in full (222 lines); **now exists** — round 4's F4 is closed (see Convergence Record)
- [x] `docs/reviews/plan-behavioral-remediation-round-04.md` — Read in full (301 lines)

**Inputs the plan cites**
- [x] `docs/investigate.md` — Grep-verified in prior rounds; not re-scanned this round, as no finding rests on it (scope limit 3)
- [x] `docs/behavioral-tier-findings.md` — same disposition

**Source files the plan makes claims about**
- [x] `workflows/expert-lifecycle.js` (493 lines, `wc -l`) — Read at `:55–80`, `:63`, `:240`, `:281–283`, `:331`, `:335`, `:344`, `:357`, `:360`, `:375`, `:378`, `:410`, `:411`, `:488`; grep'd for `named standards` (3 hits: `:330, :359, :377`), `diagnose(` (9 hits: declaration `:247` + call sites `:310, 336, 396, 426, 435, 448, 456, 490`); full enumeration of `agentType: AGENT.<x> … label: '<lit>'` pairs (21 dispatches)
- [x] `tests/structural/check-structure.mjs` (113 lines) — Read at `:14`, `:22`, `:28`, `:39`, `:48`, `:49`, `:54`, `:64–66`, `:71`, `:100`
- [x] `commands/expert.md` — Read at `:61–64`, `:74–80`
- [x] `skills/expert-spec/SKILL.md` — Read at `:153–166`; `grep -n` located `:155` (verify-against-current-documentation) and `:163` (flag-once); Read at `:345`, `:349`
- [x] `skills/expert-review/SKILL.md` — line-numbered read of `:559–566`; `grep -n` for the Gate A heading and bullet; Read at `:111`, `:147`
- [x] `skills/expert-architecture/SKILL.md` — Read at `:66`, `:90`; `grep -c "^#"` → **0**
- [x] `skills/expert-architecture-portable/SKILL.md` — `grep -in` → flag-once at `:150`
- [x] `skills/expert-standard/SKILL.md` — `grep -in` → flag-once at `:40`
- [x] `skills/expert-mcp-overhaul/SKILL.md` — `grep -in` → flag-once at `:32`
- [x] `skills/expert-implement/SKILL.md` — `grep -c "^#"` → **12**
- [x] `skills/expert-plan/SKILL.md` — cited at `:390` by claim 13; not independently re-read (scope limit 4)
- [x] `agents/expert-architect.md` — Read `:1–20`; `grep -n "first action"` → 1 hit at `:12`; `grep -n "Write the architecture to"` → `:16`
- [x] `agents/expert-planner.md` — Read `:15–19`; `grep -n` → `:17`
- [x] `agents/expert-spec-writer.md` — Read `:14–18`; `grep -n` → `:16`
- [x] `agents/expert-verifier.md` — Read `:12–23`; `grep -n "one of three"` → `:11`
- [x] `agents/expert-diagnostician.md` — Read `:16`, `:28`; `grep -n journal` → 1 hit at `:19`
- [x] `agents/` — `grep -rn "docs/specs|docs/arch|docs/plans|docs/architectures" agents/ commands/` → 4 hits (3 in `agents/`, 1 in `commands/`)
- [x] `docs/arch/architecture-expert-dev-tools.md` — Read at `:750`, `:863`

### Scope limits recorded

1. **Round 4's fix diff was not diffable** — the plan is uncommitted in the working tree and no round-4 baseline artifact exists. I substituted the plan's full text plus rounds 1–4's finding sets as closure items and re-derived every closure from current source. This limits provenance precision only for regressions; each regression I report is attributed on the evidence that the defective text did not exist before round 4's fix (claims 32–35 and the §11 registration rule are all dated 2026-08-08 in the document itself).
2. **Two §11 claims were not independently re-verified**: claim 5 (Context7 sub-agents documentation) and claim 25 (CodeGraph dependents). Neither supports a finding of mine in either direction.
3. **`docs/investigate.md` and `docs/behavioral-tier-findings.md` were not re-scanned** this round; rounds 3 and 4 grep-verified both, and no finding of mine rests on either.
4. **`skills/expert-plan/SKILL.md:390` was not re-read**; it is one of claim 13's nine sources and supports no finding of mine.
5. **No rigor waivers.** The invocation requested the methodology in full and it was applied in full.

---

## Summary

**This review returns NEEDS FIXES — 9 findings (1 Systemic, 2 Serious, 4 Moderate, 2 Minor).** All seven of round 4's findings are genuinely closed against their originally named standards, and I verified each closure from current source rather than from the plan's own disposition table: §5 is re-derived and its four previously-false "listed in §5" claims now reproduce; claim 13 enumerates nine artifact-path sources and S11 carries the paired `agents/expert-architect.md` edit with T-10 widened to seven files; the round-3 record exists on disk with a provenance header; T-21 names S23; T-22 carries the production-obligation clause. The premise discipline inside §11's numbered list remains strong — I re-executed fourteen claims (7, 8, 9, 12, 14, 16, 18, 19, 23, 24, 29, 30, 31, 35) against current source and every one reproduces exactly, including all six flag-once line numbers, all eight `diagnose()` call sites in a 493-line file, and the exact `required`/`enum` arrays.

What did not converge is the same thing that did not converge in rounds 1 through 4: the fix for a class was written and the class was not swept. Round 4's F3 produced an excellent class fix — §11's new registration rule requiring every `path:line` in §7 to carry a §11 entry — and then the author registered exactly the four citations round 4 named and swept nothing else. Nine further citations and file-content claims in §7 remain unregistered under the rule the plan adopted in the same edit. Separately, round 3's S-1 (the corrector's frontmatter fails S2b's own binding assertion) is closed only in part: the literal block gained `returns:` and `jobs:`, but `returns:` omits `evidence` — a top-level `PHASE_SCHEMA` property the S2b oracle demands — and `jobs: 1` contradicts the three distinct dispatch labels S6 creates. Executed as written, that turns the structural tier red at CP-2 with no authorized remedy, which is the precise outcome that withdrew S7's earlier guard.

The finding count rose, 7 → 9. Tripwire condition (b) therefore holds this round for the first time since round 2; the arithmetic is below.

---

## Upstream Contract Verification

Upstream artifact: the pinned output contract at `94a640a`. **All sixteen required sections are present** (Read of the plan's own headings at lines 11, 25, 76, 110, 120, 205, 230, 1575, 1591, 1612, 1744, 1989, 2245, 2289, 2419, 2456). No "if applicable" section with content is omitted.

**Gate A — does the plan enable downstream work**

| Item | Status | Verification |
|---|---|---|
| Implementer can execute without on-the-fly decisions | **fail** | S5's literal corrector frontmatter, executed as written, fails S2b's binding assertion on two counts and the plan authorizes no remedy — F1 |
| Reviewer can check a build against it, including whether each test was built to its specification | **fail** | S15b's `CORRECTOR_HALTED` half has no specification anywhere in §12; its Verification field points at T-22, which does not mention it — F3 |
| User knows what they are getting and what was excluded with approval | **pass** | §2's four exclusions each cite an owner ruling or a source-document deferral (Read, plan lines 33–41); Q-10, Q-11, Q-12, Q-13, Q-17 each carry the owner's answer and the incorporating step (Read, §14 lines 2302–2309) |

**Gate B — is the plan's own compliance auditable**

| Question | Status | Verification |
|---|---|---|
| Which standards govern, and what does each govern (§3)? | **pass** on content, **fail** on attestation | I enumerated every step ID across §3's 24 rows: all of S1…S23 including S2b, S6b, S15b appear at least once. But §3's own preamble attests re-derivation "2026-07-31", before the 2026-08-08 step edits — F8 |
| Where does each non-trivial step come from (Source)? | **pass** | Every step carries a Source line; S2's now cites `expert-spec/SKILL.md:155`, which reproduces (Read) |
| What alternatives were rejected per step? | **pass** | Read of every step: S1, S2, S2b, S4, S5, S6, S6b, S8, S9, S10, S11, S12, S15, S15b, S16, S17, S18, S20, S22 each carry a "What this is NOT — and why" block; S3, S7, S13, S14, S19, S21, S23 are declared trivial or trivial-plus with the shortened justification |
| How was each factual claim verified (§11)? | **fail** | Nine citations and file-content claims in §7 have no §11 entry, under the plan's own registration rule — F2; and claim 33 carries a false sub-claim — F5 |
| Which decisions involved judgment (§10)? | **pass** | D-1…D-8, each with reasoning; D-1 carries a scored alternatives table and an explicit non-convergence admission |
| Where does the plan diverge from codebase patterns (§8)? | **pass** | D-A, D-B, D-C, each naming the justifying standard |
| What questions arose and how was each closed (§14)? | **fail** | Every entry is binned and dispositioned and zero are open, but the reconciliation sweep attestation is stale — F7 — and its supersession-location claim is false for Q-18 — F9 |
| Per test: behavior, level, doubles, data, failure condition (§12)? | **fail** | No specification covers `CORRECTOR_HALTED` — F3 |
| What could not be grounded (§15)? | **pass** | G-1, G-2, G-3, each with resolution-attempt evidence and why resolution is outside the planner's reach |

**Gate C — final checklist.** Items failing: "Every factual claim asserted in any plan step has a corresponding entry in §11" (F2); "Every entry in §11 carries read-level evidence" as applied to claim 33's heading/blank-line assertion (F5); "Every test specification has all five fields" / "Plan-step Verification fields reference these specifications by ID" (F3); "The Question register… the sweep pass count is recorded and the final pass added zero entries" (F7, F9); "The restating sections (2, 3, 5, 11, 12, 14, plus §1's Goal and §13's counts) were re-derived from the current step set after the last step edit" (F7, F8); "No internal reasoning artifacts, self-corrections, or scratchpad content remain in the document" (F6); Gate A's zero-tolerance executability item (F1).

All other Gate C items pass, verified item by item: §2's coverage reconciliation maps all 26 steps and every requested element (I enumerated the step IDs across its 17 rows — S1…S23 all appear); §5's five sublists are internally consistent and their headers match their row counts (Created 3/3, configuration 1/1, agents 9/9, skills 7/7, workflow-command-tests-docs 7/7) with `README.md` appearing exactly once, so the union is a set; §13's "twelve of the twenty-six" matches §5's workflow row exactly (S6, S6b, S8, S9, S10, S12, S13, S15b, S17, S18, S20, S22 — 12); the absence-claim evidence forms in claims 6, 12 and 18 all carry the compound search-plus-read shape the contract requires for content absence; and the citation-identity rule holds for out-of-artifact references (claim 27 pinned to `755bf9b`/`cd2f27b`; claims 11, 26, 28 dated with unpinnable status stated).

---

## Systemic Patterns

### F2 (Systemic, Serious) — §11's new registration rule was written and then applied only to the four instances round 4 named

**Provenance: recurring** (round 4 F3, "four factual claims asserted in step prose have no §11 entry"; round 4's own Recommended Priority closes with "F3's class fix is a rule, not a set of corrections").

**What the plan does.** §11's preamble (Read, plan lines 1760–1768) adopts the rule verbatim: *"any `path:line` citation appearing anywhere in §7 — in a Source line, a Verification line, a code comment, a table cell, a rejected-alternative block, or a literal example — requires a §11 entry, and §7 and §11 are reconciled in both directions after any step edit. A citation with no entry is non-compliance in the same way a claim with no entry is. This closes the class at its source; correcting the four line numbers does not."* Claims 32–35 were then added, registering exactly round 4's four instances (plan line 1962: *"Claims 32–35 register the four citations round 4 found unregistered in step prose"*).

**Proactive scan.** I extracted every `<path>.<ext>:<line>` token from §7 (plan lines 230–1573) with `grep -noE '[A-Za-z0-9_./-]+\.(md|mjs|js|json):[0-9]+([–,-][0-9]+)*'` → **26 distinct citations**, then read the whole of §11 and matched each against its entries. Fifteen resolve to a §11 entry. The following do **not**, and each was read at its cited location to confirm it is a live factual claim rather than a stale token:

| Plan location | Citation / claim | Read at drafting | §11 entry |
|---|---|---|---|
| S2 part 4 (line 368) | `check-structure.mjs:64-66` "asserts these agents carry allowlists" | `:64` = `if (allowlist.has(name)) {`, `:65` = the `Skill` check, `:66` = the readonly check | **none** — claim 7 registers `:39,:54`; claim 8 registers `:49,:66`; neither registers `:64` or the allowlist-partition proposition |
| S5 part 4 (line 620) | `check-structure.mjs:64` "partitions agents into allowlist and denylist sets" | same read | **none** |
| S2b edit 1 (lines 399–401) | `check-structure.mjs:14–34` "the existing `frontmatter()` parser… already handles YAML block sequences (`:22–28`)" | `:14` = `function frontmatter(path) {`; `:22` = the YAML-block-sequence comment; `:28` = `continue;` | **none** |
| S7 (line 830) | `expert-verifier.md:13–22` "a numbered list" | `:13–22` is the 1/2/3 enumeration | **none** |
| S7 (line 831) | `expert-diagnostician.md:16,28` "bold-headed paragraphs" | `:16` = `**Failure mode.**`, `:28` = `**Feedback-sweep mode.**` | **none** |
| S15b part 2 (line 1239) | `docs/arch/architecture-expert-dev-tools.md:750` "the architecture already names this standard for D6 STOP routing" | `:750` = `\| OWASP secure-design fail-safe defaults \| OWASP \| D6 STOP routing \|` | **none** — claim 6 registers `:863`, a different line and a different proposition |
| S17 (line 1347) | `expert.md:74–80` "the command's upsert-by-path" | `:74–80` is the Register-artifacts bullet with the upsert instruction | **none** — claim 17 registers `commands/expert.md:46–50` and `:70–105` for a different proposition (delta applied after the segment returns) |
| S9's table (lines 923, 924, 926) | `## Output` at `:345` of `expert-spec/SKILL.md`; `:66` of `expert-architecture/SKILL.md` is an unheaded line in a zero-heading file; `expert-implement/SKILL.md` has 12 headings, none an Output section | `sed -n 345p` → `## Output`; `sed -n 66p` → `Output contract`; `grep -c "^#"` → **0** and **12** respectively | **none** — no §11 entry registers any of the three, though all three reproduce |
| S14 (line 1159) and S20 part 2 (line 1426) | `agents/expert-diagnostician.md` "promises a run-journal excerpt"; `agents/expert-verifier.md` body "reads 'one of three mechanical jobs'" | `grep -n journal` → 1 hit at `:19`; `grep -n "one of three"` → 1 hit at `:11` | **none** — both are file-content claims the contract's §11 definition covers ("what a doc currently says"), and both are load-bearing for their steps |

**Standard violated.** The pinned contract's §11 — *"One entry per factual claim the plan depends on. A factual claim is any statement the plan makes about: file contents, function signatures… what a doc currently says"* — and Gate C: *"Every factual claim asserted in any plan step has a corresponding entry in Output section 11. The two are reconciled — claims without entries are non-compliance."* Additionally the plan's own §11 registration rule as adopted 2026-08-08, and §7 maintenance rule 4: *"A finding in any restating section is a class signal, not an instance."*

**Why this is systemic rather than isolated.** Nine instances across seven distinct steps (S2, S2b, S5, S7, S9, S14, S15b, S17), against one section, under a rule the same edit introduced. It is not that the author missed a rule — the author wrote the rule, stated in its own text that registering the four instances "does not" close the class, and then registered the four instances. That is D-1's third row, "re-derive the section, sweep the class incompletely," operating on the mechanism built to prevent it, for the fifth consecutive round.

**What correct looks like.** Walk §7 top to bottom emitting every factual claim it makes about a file's contents — with or without a line citation — and reconcile that emission against §11 in both directions, adding an entry per unregistered claim. Nine entries follow from the table above. Do not grep this review for the paths it names; the enumeration above is a sample of what the walk produces, not the specification of the fix.

---

## Critical & Serious Findings

No Critical findings — every defect below is recoverable by editing the plan, and none corrupts state or misroutes the owner at execution time.

### F1 (Serious) — S5's literal corrector frontmatter fails S2b's own binding assertion on two counts, turning CP-2 red with no authorized remedy

**Provenance: recurring** (round 3 S-1, "S2b's binding assertion fails against `expert-corrector`, and no step can fix it"; disposition recorded in §14: *"S5's frontmatter block gains `returns:` and `jobs:`; the corrector listed under S2b in §5"*).

**What the plan specifies.** S2b edit 3 states the oracle (Read, plan lines 404–411): *"Parse each `const <NAME>_SCHEMA = { … }` block for its top-level `properties:` key names. Assert, per agent: its `returns:` ⊇ the union of the property names of every schema it is dispatched with; and `jobs:` equals the count of distinct `label` values targeting it."* S5's literal frontmatter block (Read, plan lines 554–570) declares:

```
jobs: 1
returns:
  - status
  - artifact_path
  - sections_rederived
  - halt
```

**How verified — both halves against current source.**

*The `returns:` half.* Read of `workflows/expert-lifecycle.js:58–75`: `PHASE_SCHEMA.properties` declares exactly `status` (`:62`), `artifact_path` (`:63`), `evidence` (`:64`, `evidence: EVIDENCE`), and `halt` (`:65`). S6b part 1 adds `sections_rederived`. The union of top-level property names for the schema the corrector is dispatched with is therefore **five**: `status, artifact_path, evidence, halt, sections_rederived`. S5 declares four — **`evidence` is absent**. Read of `workflows/expert-lifecycle.js:331`, `:360`, `:378` confirms all three document-gate `remediateFn` dispatches pass `schema: PHASE_SCHEMA`, and S6 (Read, plan lines 634–638) changes only `agentType`, not `schema`. So `returns: ⊉ properties(PHASE_SCHEMA)` and the assertion fails.

*The `jobs:` half.* I enumerated every dispatch label in the workflow by extracting each `agent(` call's `agentType: AGENT.<x> … label: '<literal>'` pair — 21 dispatches. The three the corrector inherits under S6 are `revise:spec` (`:331`), `revise:arch` (`:360`), `revise:plan` (`:378`) — **three distinct labels**. S6 specifies no label change. S5 declares `jobs: 1`, so the assertion fails again.

**Standard violated.** Design by Contract (Meyer), named in the plan's own §3 as governing S2b — caller and agent must agree — and the pinned contract's Gate A zero-tolerance item: *"Can an implementer execute this step by step… without encountering a single open question, unmade choice, or option set anywhere in the document?"* An implementer who executes S5 and S2b faithfully gets a red structural tier at CP-2 and no step authorizes the fix. This is the identical outcome round 2's C-1 gave as the reason for withdrawing S7's earlier guard (Read, plan lines 827–834: *"It would also fail against `expert-planner`, `expert-implementer`, `expert-reviewer` and `expert-corrector`, turning CP-2 and CP-3 red"*), reproduced by its replacement.

**What correct looks like.** S5's literal block declares `jobs: 3` and a `returns:` sequence of `status, artifact_path, evidence, sections_rederived, halt`. Per §7 maintenance rule 3 this is a step edit, so §5, §11, §12 and §14 are re-derived from the corrected step set rather than patched — and T-2b's must-fail case should gain a `jobs:`-mismatch partition alongside its existing `returns:` one, since the `jobs:` half of the assertion has never had an executed failing case.

### F3 (Serious) — S15b's `CORRECTOR_HALTED` path has no test specification, and it is the sole implementation of a mapped coverage element

**Provenance: new.**

**What the plan does.** §2's coverage reconciliation (Read, plan line 54) maps element (2a) — *"B9c — a finding the corrector cannot satisfy has no escape hatch"* — to **S15b** and to nothing else. S15b part 2 (Read, plan lines 1223–1229) specifies the `CORRECTOR_HALTED` return, the `halt` payload, and the wiring of both callers to escalate it as `GATE.non_convergence`. S15b's Verification field (Read, plan lines 1262–1263) reads: *"T-22, extended to assert the caller path at all four gates, not merely that the verdict exists."*

**How verified — content absence over the specification's own scope.** Read of T-22 in full (plan lines 2182–2232). Its *Behavior verified* enumerates four properties, all `CORRECTION_FAILED`: the schema field, the `runGate` capture, both detectors firing, and *"a `CORRECTION_FAILED` verdict exists and is handled by the caller at all four gates."* `grep -in "halt|S15b"` over plan lines 2182–2233 → **0 hits**. Its three executed cases are the fix-site-regression case, the unclosed-class case and the false-positive guard; none supplies a corrector return with `status: 'halted'`. Its *Fails when* clause names four conditions, none involving the halted path. Re-reading the whole of §12 (plan lines 1989–2242), no other specification names `CORRECTOR_HALTED`, `halted`, or S15b.

**Standard violated.** The pinned contract's §12 — *"one specification per test… each carrying all five fields: behavior verified (traced to spec requirement or step)"* — together with *"Plan-step Verification fields reference these specifications by ID."* S15b's Verification field references T-22, but T-22 specifies only half of what S15b builds, so the reference does not resolve for the other half. Gate A's second item is what this breaks in practice: a reviewer checking a build against this plan has no specification against which to judge whether the halted path was built correctly. The plan's own §7 maintenance rule 2 states the pairing is bidirectional and *"Do not one-way it"*; here it is one-wayed.

**Why this matters beyond bookkeeping.** The halted path is the mechanism that stops a corrector from silently burning `ROUND_CAP` rounds on a finding whose standard it cannot verify — S15b's own text says the alternative is that the return *"is discarded and the loop runs to `ROUND_CAP` in silence."* An untested escape hatch that fails closed-off is indistinguishable at runtime from not having one, which is the status quo B9c names.

**What correct looks like.** Either a `T-23` specification with all five fields covering the halted path — data supplying a `remediateFn` stub that returns `status: 'halted'` with a `halt.detail`, asserting `runGate` returns `verdict: 'CORRECTOR_HALTED'` carrying `halt`, and asserting both caller sites escalate rather than advance; must-not-assert: the corrector's reason text — or an explicit extension of T-22's *Behavior verified*, executed cases and *Fails when* to cover it, with T-22 naming S15b alongside S6b. Either way S15b's Verification field names the covering ID, and §12's spec set is re-derived per rule 3.

---

## Moderate & Minor Findings

### F4 (Moderate) — S2b's schema-derived oracle cannot express a per-agent contract, and forces three authoring agents to promise a field only the corrector emits

**Provenance: new.**

**What the plan does.** S2b edit 1 (Read, plan line 397) states the intent: *"Each agent's frontmatter gains a machine-readable `returns:` sequence **naming the schema fields that agent must emit**."* Edit 3's oracle derives the required set from the dispatched schema's declared properties.

**How verified.** Read of `workflows/expert-lifecycle.js:322`, `:331`, `:354`, `:360`, `:372`, `:378`: `AGENT.spec`, `AGENT.architect` and `AGENT.planner` are each dispatched with `PHASE_SCHEMA`, the same schema the corrector receives. S6b part 1 adds `sections_rederived` to `PHASE_SCHEMA.properties` (Read, plan lines 669–692). Under the oracle, all four agents must therefore declare `sections_rederived` in `returns:` — including the three authoring agents, none of which re-derives sections and none of which the plan obliges to emit the field. Conversely S6b part 4's obligation edits (Read, plan lines 733–742) are written for the corrector alone.

**Standard violated.** Design by Contract (Meyer), named in §3 as governing S2b. A declared postcondition an agent will never satisfy is over-promising — the "agent-promises-more" defect S14 exists to correct in the other direction (Read, plan lines 1157–1166). T-2b's technique table (Read, plan lines 2026–2028) legitimises this as *"{field declared and not read} (passes; over-declaration is not an error)"*, which is true of the assertion but makes `returns:` cease to be the per-agent contract S2b's stated intent describes: four agents sharing one schema get four identical `returns:` sequences regardless of what each emits.

**What correct looks like.** State the scope resolution explicitly, as S2b already does for the declared-surface-versus-dataflow question. Either narrow the oracle to the intersection of the schema's properties with the fields obliged of that agent by its own governing document, or keep the superset rule and record in S2b part 4 — and in §10 as a decision — that `returns:` asserts schema conformance rather than per-agent emission, so a reader does not take a declared field as an obligation. The second is cheaper and consistent with the existing conservative-assertion argument; either way the choice belongs in the plan, not in the implementer's hands.

### F5 (Moderate) — claim 33's premise is false against current source, imported from round 4's finding text rather than re-derived

**Provenance: regression** — claim 33 was created by round 4's fix (plan line 1962 dates claims 32–35 to 2026-08-08); it did not exist in any earlier round.

**What the plan says.** §11 claim 33 (Read, plan lines 1972–1976): *"`skills/expert-review/SKILL.md:565` — 'Every finding names the standard…' It sits under the heading `### Gate A — Frame evidence per finding` at `:560`; `:561` and `:562` are blank."*

**How verified.** Line-numbered read of `skills/expert-review/SKILL.md:559–566` at drafting time: `:559` blank, `:560` blank, **`:561` = `### Gate A — Frame evidence per finding`**, `:562`/`:563`/`:564` blank, `:565` = the bullet. Corroborated by `grep -n` → the heading at `:561`, the bullet at `:565`.

The load-bearing half is correct — `:565` is the right line, and S8's two citations (plan lines 857 and 898) both point there. What is false is the surrounding assertion: the heading is at `:561`, not `:560`, and the blank lines are `:562–:564`, not `:561–:562`. Those two numbers are exactly the numbers round 4's F3 stated (*"`:560` is the heading… `:561` and `:562` are blank"*), which is the source they were copied from — round 4's own bullet line number, `:563`, was corrected to `:565` while the two adjacent numbers were not re-derived.

**Standard violated.** The pinned contract's §11 evidence requirement — *"Memory of a file read earlier in the session is not a current verification — re-read or cite the read at the time of plan-writing"* — and Gate C: *"File paths and function names are confirmed against the current codebase, not assumed."* This is round 1's C-1 class (a claim imported from a prior document without re-derivation), now sourced from a review record rather than from a sibling project's handoff.

**What correct looks like.** Re-derive claim 33's three line references from a single current read: heading `:561`, blanks `:562–:564`, bullet `:565`. Then sweep the class: claims 32, 34 and 35 were written in the same edit from the same source, so each is re-read at its cited line before claim 33 is reported closed. (I re-executed all three and they reproduce — claim 32's `:155`, claim 34's `:12` with `grep -n "first action"` returning exactly 1 hit, claim 35's `:100` verbatim — so the sweep confirms rather than corrects, which is what makes it worth recording.)

### F6 (Moderate) — drafting-history self-corrections are retained throughout, while §14 records the class as closed

**Provenance: recurring** (round 3 M-1, "drafting-history self-corrections are retained throughout, which Gate C forbids"; §14's disposition table, plan line 2407, records the landing as *"moved into the round records; the plan keeps only current state"*).

**How verified.** Proactive grep over the complete plan for the same pattern class round 3 used (`previously cited|previously recorded|Round 3 found|round 4's pass|Round 4 found|earlier draft|first draft|prior version|is \*\*withdrawn\*\*|First disposed`) → **10 hits** at lines 273–274, 1717, 1760, 1833, 1962, 1968, 1976, 1980, 2310, 2439, each Read in context. Representative instances: §7 rule 3 — *"Round 3 found §3 missing from the rule while D-8 carried it; round 4's pass found the reverse, the rule at eight while the preamble said six"*; claim 13 — *"The 2026-07-31 scan this claim previously recorded returned six and did not cover `agents/`"*; claims 32/33/34 — *"The step previously cited `:163`" / "S8 previously cited `:561` at two sites" / "S5 previously cited `:11`"*; Q-18 — *"First disposed of as out-of-scope follow-up; that was effort-based deferral wearing a scope label."*

The count is down from round 3's 22, but the class is not closed, and the plan's own §14 asserts it is. Most of the surviving instances were **added by round 4's fixes**, so the correction re-armed the surface it edited.

**Standard violated.** The pinned contract's Gate C, verbatim: *"No internal reasoning artifacts, self-corrections, or scratchpad content remain in the document."* The clause names self-corrections as a category distinct from scratchpad content, so a note's usefulness is not a defence against it.

**Honest tension, recorded rather than suppressed.** Several of these carry genuine forward value — claim 32's explanation of why `:163` is the wrong citation is what stops a future editor recitting it, and §7 rule 3's history is the evidence for numbering the surfaces. That reasoning has force, and round 3 already weighed it and ruled the other way. What defeats it here is not the value question but the record: §14 states the class was moved into the round records, and it was not. Either the notes belong in the plan and §14's disposition is wrong, or §14 is right and the notes belong in this file and its predecessors.

**What correct looks like.** Pick one and make the document consistent with it. If the notes stay, §14's round-3 disposition row is rewritten to say the class was accepted with reasoning rather than closed, and D-1 or §15 records why Gate C's clause is being read narrowly — that is a §10 decision, not a silent retention. If they go, they move into the corresponding `docs/reviews/` records, which is what §14 currently claims.

### F7 (Moderate) — §14's reconciliation sweep attestation is stale: eight passes, the last after round 3, while the step set changed after round 4

**Provenance: regression** — introduced by round 4's fixes, which edited steps without a ninth pass.

**How verified.** Read of §14's sweep paragraph (plan lines 2315–2319): *"Eight passes, the last over the document as it stands after review round 3, adding zero entries… passes 6–8 followed review rounds 1–3."* Read of the step edits dated after that: S2's Source annotation changed to `expert-spec/SKILL.md:155` with its parenthetical (line 349–351); S11 gained the "Paired agent-side edit" block adding `agents/expert-architect.md:16` (lines 1029–1036); §11 gained the registration rule and claims 32–35, all self-dated 2026-08-08 (lines 1760, 1962); §5's own preamble states *"Last re-derived: 2026-08-08"* (line 123). So the document demonstrably changed after the last recorded pass, and no pass follows.

**Standard violated.** The pinned contract's §14 — *"Ends with the reconciliation sweep attestation: number of passes performed, confirmation the final pass added zero entries"* — and Gate C's re-derivation item, which names §14 among the restating surfaces that must be re-derived after the last step edit. The plan's own §7 maintenance rule 3 says the same and lists §14 as surface 8.

**What correct looks like.** Run a ninth pass over the document as it stands after round 4's fixes and record it — including whether S11's paired agent-side edit or the registration rule raised any question needing a register entry — then state the new count and the zero-entry confirmation. Per rule 3 the same walk re-derives §1's Goal, §2, §3, §5, §11, §12 and §13's counts.

### F8 (Minor) — §3's re-derivation attestation predates the last step edit

**Provenance: regression** — §3's content survived round 4's step edits, but its attestation did not move with them.

**How verified.** Read of §3's preamble (plan lines 78–79): *"Re-derived from §7's 26 Source annotations, **2026-07-31**. §3 is a restating surface: it is rebuilt from the steps, never appended to (§7 maintenance rule 3)."* Read of §5's preamble (line 123): *"Last re-derived: **2026-08-08**."* The step set changed on 2026-08-08 (see F7's evidence). I checked §3's content independently — enumerating step IDs across all 24 rows, every one of S1…S23 including S2b, S6b, S15 and S15b appears at least once — so the registry is in fact complete. The defect is that the document's own record says it was last rebuilt before the edits, which is precisely what Gate C's item asks the reader to confirm.

**Standard violated.** The pinned contract's Gate C: *"The restating sections (2, 3, 5, 11, 12, 14, plus section 1's Goal and section 13's counts) were re-derived from the current step set after the last step edit, not patched. A plan whose step set changed after these sections were last written has not satisfied this item."* Gate B requires this to be answerable from the document alone; as written, the document answers it in the negative.

**What correct looks like.** The ninth-pass re-derivation F7 requires emits §3 along with the rest; its preamble date follows.

### F9 (Minor) — §14's supersession-location claim is false for one of the four dispositions it covers

**Provenance: new.**

**How verified.** Read of §14 (plan lines 2322–2326): *"Four dispositions were superseded after first being written — Q-3, Q-12, Q-17, Q-18. Each states its current answer here; the superseded version and the reasoning that overturned it are in the corresponding `docs/reviews/plan-behavioral-remediation-round-0N.md` record."* Q-3, Q-12 and Q-17 each additionally name their record inline ("Supersession recorded in the round-01 review" / "round-02"). Q-18 names none. Content absence over the complete review set: `grep -rn "Q-18" docs/reviews/` → **0 hits** across all four round records, each of which I also read in full this round. Q-18's superseded disposition survives only inline, in the register cell itself (plan line 2310, *"First disposed of as out-of-scope follow-up…"*).

**Standard violated.** The pinned contract's §11 citation-identity principle applied to §14's own pointer — *"the evidence must be reachable by the next reader"* — and Gate C's requirement that every register entry carry a closed disposition the reader can audit. A pointer to a record that does not contain the referent is the same defect round 4's F4 named at larger scale.

**What correct looks like.** Either scope the sentence to the three dispositions whose supersessions are in the records and state that Q-18's is retained inline with its reasoning, or move Q-18's superseded reasoning into a round record and point at it. This interacts with F6 — whichever convention that finding settles on governs here too, and both should be fixed in one edit rather than separately.

---

## Tentative Findings

No tentative findings — every candidate finding's premise was verified against current source per Compliance Gate B, with the grep queries, result counts and line-numbered reads recorded in each finding.

Two candidates were investigated and **dropped** rather than demoted:

- *That S20's "change the count to four" in `agents/expert-verifier.md` would contradict S2b's `jobs:` assertion.* Dropped: I enumerated the verifier's dispatch labels from source — `spot-rerun` (`:423`), `diff-vs-plan` (`:433`), `reconciliation` (`:454`) — three today, and S20 adds a fourth, so `jobs: 4` is correct. Read of `agents/expert-verifier.md:11` confirms the body currently says "one of three", exactly as S20 states.
- *That §3's registry omits S15.* Dropped: `grep "S15"` over §3 (plan lines 76–107) returns the regression-detection row reading `**S3, S6b, S7, S15, T-2b**`. My initial extraction pattern truncated the row; the registry is complete. This is recorded because a review that reported it would have been confidently wrong, and the correction came from re-running the scan rather than from re-reading my own notes.

---

## Observations

- The round-3 record's reconstruction (`docs/reviews/plan-behavioral-remediation-round-03.md`) carries an explicit six-line provenance header naming the transcript file, the JSONL record number, and what was and was not altered. That is the correct handling of a recovered artifact and it is what let me compute this round's trajectory arithmetically rather than by case analysis, which is what round 4 had to do.
- The §11 registration rule adopted this round is, as a rule, better than the class fix round 4 asked for — it covers table cells and literal examples, not just Source annotations. F2 is about its application, not its design.

---

## What's Actually Good

- **§5 is genuinely re-derived, and the four "listed in §5" claims that were false at round 4 now all reproduce.** Property: the section restates the step set rather than being patched at the lines a review named. Standard: the pinned contract's Gate C re-derivation item and §5's definition ("every file that will be created, modified, or deleted"). Verified by Read of plan lines 128–202 against the step bodies at 552 (removed), 576 (`agents/expert-corrector.md` under S5, S2b and S6b — §5 line 133 reads exactly that), 711/735 (S6b part 4's three paired edits — §5 lines 132, 133 and the workflow row at 172 carry S6b), 748 (`agents/expert-reviewer.md` and `skills/expert-review/SKILL.md` under S6b part 5 — §5 lines 154 and 163 carry it), and 957 (`commands/expert.md` under S10 — §5 line 173). Each of the five sublist headers matches its row count, and `README.md` appears exactly once, so the union T-21 compares is a set.
- **Claim 13's nine artifact-path sources reproduce exactly, and S11's paired agent-side edit closes the contradiction round 4 found.** Property: the enumeration's declared scope ("the complete plugin") is the scope the scan actually covered. Standard: the contract's Gate C content-absence rule. Verified by re-executing the claim's own scan, `grep -rn "docs/specs|docs/arch|docs/plans|docs/architectures" agents/ commands/` → 4 hits, and reading each: `agents/expert-architect.md:16` ("Write the architecture to `docs/arch/`"), `agents/expert-planner.md:17` (`docs/plans/`), `agents/expert-spec-writer.md:16` (`docs/specs/`), `commands/expert.md:61–64`. S11 now edits `:16` of the architect and records the other two as agreeing, and T-10's scope is stated as seven files with an explicit rationale for why four could not see the contradiction.
- **The §11 numbered list's premise discipline is exact at every claim I re-executed.** Property: fourteen independent claims reproduce at the line, not approximately. Standard: the contract's §11 and Gate C ("File paths and function names are confirmed against the current codebase, not assumed"). Verified: claim 7 (`:39` `skills.length === 9`, `:54` `agents.length === 9`); claim 8 (`:49`, `:66`); claim 9 (`grep -c "named standards"` → 3 at `:330, :359, :377`, with `:410` read verbatim and the phrase absent); claim 12 (`:281–283` all three literal defaults, `:63` `artifact_path: S_STR`); claim 14 (declaration `:247`, eight call sites at exactly `:310, 336, 396, 426, 435, 448, 456, 490`); claim 16 (`ledger.schema.json:68–87`); claim 18 (all six flag-once sites at `expert-spec:163`, `expert-standard:40`, `expert-review:147`, `expert-architecture:90`, `expert-architecture-portable:150`, `expert-mcp-overhaul:32`); claim 19 (`:335`, `:344`, `:357`, `:375`); claim 23 (`ledger.schema.json:157–171`); claim 24 (`:76–91`); claim 29 (`:240` bare `await remediateFn(findings, round)`, `:58–75` with no re-derivation field); claim 30 and 31 (`VERDICT_SCHEMA.verdict` enum and `required: ['classification','standard']`); claim 35 (`:100` verbatim).

---

## Convergence Record

**Round number:** 5 (Post-fix).

**Trajectory:** R1 = **13** (1 Critical, 1 Systemic, 6 Serious, 2 Moderate, 3 Minor) → R2 = **13** (1 Critical, 1 Systemic, 4 Serious, 4 Moderate, 3 Minor) → R3 = **10** (1 Systemic, 7 Serious, 1 Moderate, 1 Minor) → R4 = **7** (1 Systemic, 3 Serious, 2 Moderate, 1 Minor) → R5 = **9** (1 Systemic, 2 Serious, 4 Moderate, 2 Minor).

Round 3's count is taken from the reconstructed record's own verdict line, which is now on disk; round 4's F4 — the missing round-3 record — is closed, and the arithmetic below is fully auditable for the first time since round 2.

**Flow counts for this round**, from the Step 9 provenance classifications:

- **Prior findings closed: 7** — all of round 4's, each re-derived from current source rather than accepted from a disposition. R4 F1 (§5 re-derived; three previously-false "listed in §5" claims now reproduce, verified by Read of plan lines 128–202 against 576, 711/735, 748, 957). R4 F2 (claim 13 at nine sources, re-executed by its own scan; S11 carries the `agents/expert-architect.md:16` paired edit; §5 line 155 lists it under S11; T-10's scope widened to seven files). R4 F3 (S2's Source now cites `expert-spec/SKILL.md:155`, which reproduces; S8's two citations corrected to `:565`, which reproduces; S5's to `:12`, `grep -n "first action"` → 1 hit; `check-structure.mjs:100` registered as claim 35 and reproduces verbatim — the four named instances are closed, though the class is not, which is F2 of this round). R4 F4 (`docs/reviews/plan-behavioral-remediation-round-03.md` exists, Read in full, with a provenance header; §14 carries Round 2 and Round 3 blocks and a four-round trajectory paragraph). R4 F5 (§5's fourth sublist header now reads 7 against 7 rows; `README.md` appears once, under Created). R4 F6 (T-21's *Behavior verified* now opens with **S23** and names §5 as the oracle, Read of plan lines 2234–2238). R4 F7 (T-22 carries an explicit "Production obligation for the doubled inputs" paragraph naming `agents/expert-corrector.md`'s `returns:`, `skills/expert-correct/SKILL.md`'s return contract, and `PHASE_SCHEMA.properties.sections_rederived`, Read of plan lines 2193–2204).
- **New findings: 3** — F3, F4, F9.
- **Regressions: 3** — F5 (claim 33, created by round 4's fix, carries a false sub-claim imported from round 4's finding text), F7 (§14's sweep attestation went stale because round 4's fixes edited steps without a ninth pass), F8 (§3's attestation went stale for the same reason).
- **Recurring: 3** — F1 (round 3 S-1, same standard at the same location: S5's literal frontmatter block against S2b's binding assertion), F2 (round 4 F3's class, new instances), F6 (round 3 M-1).

3 + 3 + 3 = 9, reconciling with the finding count.

**Tripwire evaluation — NOT FIRED, but condition (b) holds this round and is armed.** Arithmetic shown for both conditions.

*Condition (a) — new + regression ≥ closed for two consecutive Post-fix rounds.* Round 4: new 1 + regression 0 = 1; closed 9; 1 ≥ 9 is **false** → did not hold; consecutive = 0. Round 5: new 3 + regression 3 = **6**; closed = **7**; 6 ≥ 7 is **false** → does not hold this round. **Consecutive count remains 0.**

*Condition (b) — total findings has not strictly decreased for two consecutive Post-fix rounds.* Round 3: 13 → 10, a strict decrease → did not hold; consecutive = 0. Round 4: 10 → 7, a strict decrease → did not hold; consecutive = 0. Round 5: 7 → **9**, which is **not** a strict decrease → **holds this round; consecutive = 1; needs 2.** **Round 6 repeating either condition fires the tripwire**, and the recommendation becomes foundational rework.

**What the arithmetic does not say on its own.** The count rose because three of this round's nine findings were manufactured by round 4's fixes — the same signature the plan's own D-1 table calls the dominant failure mode and the same one that fired the APS Fusion tripwire (claim 27: *"Three of round 5's findings were manufactured by round 4's fixes, three of round 6's by round 5's"*). This project is now at three-of-nine on that measure. Severity continued to fall — R3 had 7 Serious, R4 had 3, R5 has 2, with zero Critical for the third consecutive round — so the trajectory is not uniformly adverse. But F2 records the fifth consecutive round in which a class fix was written and the class was not swept, and F1 records a round-3 finding whose closure did not hold. Those two are the ones to watch at round 6.

---

## Recommended Priority

The tripwire did not fire, so another fix round is the indicated path rather than foundational rework. But condition (b) is armed for the first time since round 2, and the margin on condition (a) is one finding — so a round 6 that produces nine or more findings, or that again closes fewer than it opens, fires it. Fix in this order, and treat items 1 and 2 as one walk rather than two edits:

1. **F2, F5, F7, F8 — one re-derivation walk over §7, not four patches.** Every one of these is a restating-surface defect, and the plan's own §7 maintenance rule 3 and the contract's Gate C both require the fix to be a re-derivation of §1's Goal, §2, §3, §5, §11, §12, §13's counts and §14 from the current step set. F2 in particular is a class, and the nine instances in its table are what the walk produces, not what the fix consists of: emit every factual claim §7 makes about a file's contents, with or without a line citation, and reconcile that emission against §11 in both directions. Patching the nine locations this review names is the mechanism that produced round 4's F3 and this round's F2, and it is what D-1's third row describes. Do the walk; do not grep this document for the paths it lists.

2. **F1 — the corrector's frontmatter, which is the only finding that turns a tier red at execution.** `jobs: 3`, and `returns:` gains `evidence`. This is a step edit, so it re-enters the walk above rather than standing alone. While there, give T-2b's executed must-fail set a `jobs:`-mismatch partition — the `jobs:` half of S2b's assertion has never had a failing case, which is the property that let this survive round 3's closure.

3. **F3 — write the missing specification for the `CORRECTOR_HALTED` path.** This is second in consequence and third in order only because it is independent of the walk and can proceed in parallel. Until it exists, the sole implementation of coverage element (2a) ships unverified, and S15b's Verification field points at a specification that covers the other half of the step.

4. **F4 — settle S2b's `returns:` semantics in the plan.** One paragraph in S2b part 4 plus a §10 decision entry. It is small, but leaving it open means the implementer decides what `returns:` means for four agents sharing one schema, which Gate A forbids.

5. **F6 and F9 — one convention, applied once.** Both turn on whether superseded reasoning lives in the plan or in the round records. Decide it, then make §14's disposition row, §14's supersession sentence, and the ten retained notes all consistent with the decision. Fixing either alone will re-open the other.

One structural note for whoever applies these. Round 4's Recommended Priority closed with the observation that F3's fix was "a rule, not a set of corrections," and the rule was written correctly and then applied to four instances. That is the third consecutive round in which the class-level mechanism was authored and the class-level sweep was not performed. If round 6 reports the same shape a fourth time, the honest reading is not that the sweeps keep being forgotten — it is that a 2,486-line prose artifact with nine ungenerated restating surfaces cannot be swept reliably by discipline, which is the conclusion the plan's own G-3 and D-8 already reach about itself and which the tripwire exists to force.

---

Verdict: NEEDS FIXES (9 findings: 1 Systemic, 2 Serious, 4 Moderate, 2 Minor)
