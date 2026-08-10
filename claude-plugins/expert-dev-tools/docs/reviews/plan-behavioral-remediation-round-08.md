# Plan Review — Round 8

**Artifact:** `claude-plugins/expert-dev-tools/docs/plans/plan-expert-dev-tools-behavioral-remediation.md` (working tree, 3081 lines)
**Governing contract:** `claude-plugins/expert-dev-tools/skills/expert-plan/references/output-contract.md` **at commit `94a640a`** (read via `git show 94a640a:…`; the working-tree copy was not consulted, per the pinned instruction)
**Date:** 2026-08-08
**Reviewer:** independent, round 8, dispatched with artifact + prior-round records + input pointers only
**Round:** 8 (Post-fix)

---

## Scope and Inventory

### Step 3 tool plan

| Claim type in scope | Instrument | Availability |
|---|---|---|
| Literal-content ("line N says Z") | `Read` / `sed -n 'N,Mp'` line-numbered read at the cited line | available, used throughout |
| Content-absence ("no §11 entry registers X") | `grep` over the named scope, query and result count recorded | available |
| Counted search (token extraction from §7, bin-column tally, heading enumeration) | `grep -noE` / `awk` with the pattern and result count recorded | available |
| Pinned-revision retrieval | `git show <commit>:<path>` | available, used for the contract |
| Structural (blast radius) | CodeGraph | **not exercised** — no finding this round makes a structural claim. The plan's own structural claim (claim 25) was not re-verified; recorded as scope limit 2 |
| Library behavior | Context7 | **not needed** — no finding this round rests on library behavior. The plan's one such claim (claim 5) was not re-verified; scope limit 2 |
| Claims imported from prior documents (rounds 1–7, the plan's own §11/§14 attestations) | re-derivation against current source with the instrument the underlying claim type requires | available; every prior-round claim used for provenance or closure was re-derived |
| Structured reasoning | `metacognitivemonitoring`, `collaborativereasoning` | **available this round** — both invoked successfully. This is the first round since round 4 in which they were callable |

No instrument class was unavailable for a load-bearing claim category, so no halt condition arose.

### Inventory

Constructed from the four Post-fix sources: the prior rounds' inventories, the fix set (round 7's changes to the plan), the plan's §5 file list as the artifact's declared blast radius, and round 7's two findings as closure items.

**The artifact and its governing documents**
- [x] `docs/plans/plan-expert-dev-tools-behavioral-remediation.md` — `grep -n "^## "` → 16 headings at 11, 25, 76, 111, 121, 211, 236, 1638, 1654, 1675, 1832, 2460, 2755, 2803, 3014, 3052; Read at 236–293, 1832–2131, 2131–2465, 2780–2859, 3014–3081, plus targeted reads at drafting: 44–75, 1046–1065, 1761–1800, 490–500, 830–840, 1240–1250; §7 extracted whole to a working file (1,402 lines) for the reconciliation walk
- [x] `skills/expert-plan/references/output-contract.md` @ `94a640a` — Read in full via `git show`
- [x] `docs/reviews/plan-behavioral-remediation-round-01.md` … `-round-06.md` — consulted for trajectory (verdict lines and Convergence Records)
- [x] `docs/reviews/plan-behavioral-remediation-round-07.md` — Read in full (271 lines); the closure-item source for this round

**Inputs the plan cites**
- [x] `docs/investigate.md` — `grep -cE "^#{1,3} "` → **22**; full heading list enumerated; `:207–212` and `:457–468` Read at drafting (F1's evidence)
- [x] `docs/behavioral-tier-findings.md` — `grep -cE "^#{2,3} "` → 15, all enumerated; `grep -n "B9a\|B9b\|B9c"` → **12 lines**, `grep -o` → **17 occurrences**; `:220`, `:222–225`, `:231`, `:233–236`, `:275–280` Read at drafting (F1's evidence)

**Source and governing files the plan makes claims about**
- [x] `skills/expert-plan/references/testing-standards.md` — `grep -n -i "regression"` → **1** hit at `:91`, Read; `:21`, `:123`, `:129` Read (claim 56's evidence)
- [x] `docs/HANDOFF.md` — `:66–80` Read in full (claim 60's evidence)
- [x] `docs/specs/spec-expert-dev-tools.md` — `:198–207`, `:217–232`, `:119–132` Read (claim 59's evidence)
- [x] `docs/arch/architecture-expert-dev-tools.md` — cited ranges checked against claim 59; `:750`, `:863` carried from claims 41 and 6
- [x] `agents/*.md` (all nine) — `grep -c "^tools:"` per file → 1 for acceptance, closeout, diagnostician, implementer, spec-writer, verifier; **0** for architect, planner, reviewer. `grep -c "^skills:"` → 1 for all nine. `grep -rn "one of two\|one of three\|one of four" agents/` → exactly 2 hits
- [x] `agents/` + `skills/` — `grep -rlE "artifact_path|sections_rederived|finding_addressed|premise_evidence|files_changed|correction_draft|responsible_component"` → **0 files**; `grep -rl "stop_report"` → **1 file**
- [x] `workflows/expert-lifecycle.js` — `grep -c "runGate("` → 5; `grep -c "maybeNonConvergence("` → 4; `grep -c "label: 'revise"` → 3; `grep -c "named standards"` → 3; `grep -c "artifact_path"` → 1; file length **493**
- [x] `skills/expert-spec/SKILL.md` — `grep -icE "revis(e|ion)"` → **0**
- [x] Repository-wide content absence for claim 60 — `grep -rn "When information is missing, the agent goes and finds it" --include=*.md .` → 1 hit, inside the plan's own claim 60; `grep -rn "Artifact locations are standardized, not proposed" --include=*.md .` → **0 hits**
- [x] `tests/structural/check-structure.mjs`, `scripts/ledger.schema.json`, `commands/expert.md`, `tests/fixture/spec/spec-contradictory.md`, `tests/ACCEPTANCE.md` — Grep-verified for the citations §7 makes about them; no finding this round rests on a line not previously verified across rounds 5–7

### Scope limits recorded

1. **Round 7's fix diff was not diffable.** The plan remains uncommitted in the working tree (`git diff --stat` against `94a640a` reports 854 insertions / 92 deletions, which is the whole eight-round fix history, not round 7's alone) and no round-7 baseline artifact exists. I substituted round 7's finding set as closure items and re-derived each closure from current source. This limits provenance precision for regressions: my classification of claims 57 and 58 as regressions rests on round 7's own record, which enumerates §11 as ending at claim 55 and names claims 56–61 nowhere. That inference is recorded here rather than presented as a diff.
2. **Two §11 claims were not independently re-verified**: claim 5 (Context7 sub-agents documentation) and claim 25 (CodeGraph dependents). Neither supports a finding of mine in either direction. Carried forward from rounds 5–7.
3. **Claim 11 (run-transcript reads under `~/.claude/projects/…`) was not re-executed.** It is cited by path and date with its unpinnable status stated, per the plan's own citation rule; no finding of mine rests on it.
4. **The §11 numbered claims verified exactly by rounds 5–7 (7, 8, 10, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 26–35, 37–43) were not re-executed wholesale.** Round 7's fixes edited none of them. I re-executed every counted search in claims 9, 12, 36, 44, 45, 46, 48, 49, 51 as the control population for F1's proactive scan, and **all twelve of claims 44–55 plus all six of 56–61** as this round's population of interest.
5. **No rigor waivers.** The invocation requested the methodology in full and it was applied in full.

**Structured-reasoning tools.** `metacognitivemonitoring` and `collaborativereasoning` were both callable this round and both were invoked — the first successful invocation since round 4. The metacognitive pass separated verified fact from inference across the candidate set and flagged outcome bias (a fired tripwire being a dramatic result that could tempt promoting marginal candidates) as the risk to guard; the multi-perspective pass ran the three required personas and surfaced the grouping objection addressed in the Convergence Record. Three consecutive rounds of recorded unavailability have ended.

---

## Summary

**This review returns NEEDS FIXES — 3 findings (1 Systemic, 2 Minor) — and both non-convergence tripwire conditions have fired.** Round 7's two findings are both closed, and closed well: the remediation was not patched from the review's sample, it was re-derived from a stated population, and it went beyond what the review named.

The document-registration failure that ran for four consecutive rounds is genuinely fixed. §11 now carries a four-kind population table that names input documents and governing documents as first-class members of the class, a compositional diagnostic ("if a walk's output is uniformly one kind, the population was drawn too narrowly"), and a citation-form rule barring section anchors from entries. The walk emitted six document propositions — claims 56–61 — covering `testing-standards.md`, `investigate.md`, `behavioral-tier-findings.md`, the spec, the architecture, `HANDOFF.md` and the output contract. Round 7's table named five documents; the author registered seven, adding `HANDOFF.md` and the output contract on their own. I read every quotation in all six entries at its cited range and **every one reproduces verbatim**. The substantive divergence round 7 found — `testing-standards.md`'s regression clause restated four times in a form dropping the demonstration requirement — is corrected at all four sites, and claim 60 discloses a second divergence the author found unprompted: three owner rulings §7 had presented as verbatim quotations in wordings that appear nowhere in the repository. Round 7's F2 is closed too; the attestation now reads "37 occurrences over 33 distinct tokens," and I re-executed the command to get exactly 37, 33, 32 with the three repeats named correctly.

What did not hold is the accuracy of the counts *inside* the entries written to prove the registration. Claim 57 states its heading enumeration returns 21; the stated command returns 22. Claim 58 states its B9 search returns 9 hits; it returns 12 matching lines over 17 occurrences. Neither error touches the propositions those entries register — every quotation is right — but §11 is the plan's premise-correctness proof, and a stated tool result that does not reproduce is the precise failure that section exists to prevent. A third instance of the same class sits in §14, pre-existing and missed by round 7: the closure attestation's partition says four bin-2 entries where the register has five, and counts Q-22 as an addition to seventeen bin-1 entries when it is already one of them. The two errors cancel to the correct total of 22, which is why seven rounds have read past it.

The class has migrated rather than closed. For four rounds it was unregistered citations; this round it is inaccurate counts inside the registration entries and attestations themselves. That is the same generator — a hand-maintained figure with no generator, restated and drifting — operating one level up, exactly as D-8's own text predicts when it says a count that moves in one place and not the others is "the same defect one level up."

The count rose from 2 to 3, and new-plus-regression findings exceed closed findings. **Both tripwire counters, armed at 1 after round 7, now stand at 2 against a threshold of 2. The tripwire has fired on both conditions.** The arithmetic is below, and it fires on condition (b) independently of how I group the findings.

---

## Upstream Contract Verification

Upstream artifact: the pinned output contract at `94a640a`. **All sixteen required sections are present** — verified by `grep -n "^## "` over the plan, returning sixteen headings at lines 11, 25, 76, 111, 121, 211, 236, 1638, 1654, 1675, 1832, 2460, 2755, 2803, 3014, 3052, in contract order. No "if applicable" section with content is omitted.

**Gate A — does the plan enable downstream work**

| Item | Status | Verification |
|---|---|---|
| Implementer can execute without on-the-fly decisions | **pass** | Every step Read; no step presents an option set, defers a choice, or leaves a question open. S5's frontmatter values still satisfy S2b's oracle on both halves, re-derived from source this round: `grep -c "label: 'revise"` → 3, matching S5's `jobs: 3`; `PHASE_SCHEMA.properties` is four names plus S6b part 1's `sections_rederived` = five, and S5 declares those five |
| Reviewer can check a build against it, including whether each test was built to its specification | **pass** | Bidirectional reconciliation run mechanically: the T-IDs referenced across §7 and the T-IDs defined in §12 are the same 24-element set (T-1, T-2, T-2b, T-3…T-23), confirmed by extracting both sets and comparing — 24 each, identical membership |
| User knows what they are getting and what was excluded with approval | **pass** | §2's coverage table Read (plan lines 48–70): 17 rows, every one mapped to steps; the union of its step references enumerates to exactly the 26-step set (`grep -c "^### S"` → 26). The four exclusions each cite an owner ruling or a source-document deferral |

**Gate B — is the plan's own compliance auditable**

| Question | Status | Verification |
|---|---|---|
| Which standards govern, and what does each govern (§3)? | **pass** | §3's preamble attests re-derivation 2026-08-11 (Read, plan line 78), matching §5 (line 124), §11 (line 1897) and §13 (line 2789). Its `testing-standards.md` row at line 90 now carries the corrected demonstration requirement |
| Where does each non-trivial step come from (Source)? | **pass** | Every one of the 26 steps carries a Source line |
| What alternatives were rejected per step? | **pass** | Nineteen steps carry a four-part "What this is NOT — and why" block; the remainder are declared trivial or trivial-plus with the shortened justification the contract permits |
| How was each factual claim verified (§11)? | **fail** | Two of the six new document entries state counted-search results that do not reproduce — **F1** |
| Which decisions involved judgment (§10)? | **pass** | D-1…D-9 with reasoning; D-8's nine-surface enumeration Read (plan lines 1769–1774) and matched item-for-item against §7's preamble table (lines 241–251) and §15's G-3 |
| Where does the plan diverge from codebase patterns (§8)? | **pass** | D-A, D-B, D-C, each naming the justifying standard |
| What questions arose and how was each closed (§14)? | **fail** | The register itself is complete and every entry dispositioned, but its closure attestation's bin partition does not reconcile with the table — **F2** |
| Per test: behavior, level, doubles, data, failure condition (§12)? | **pass** | All 24 specifications present; each carries all five fields |
| What could not be grounded (§15)? | **pass** | G-1, G-2, G-3, each with resolution-attempt evidence and why resolution is outside the planner's reach |

**Gate C — final checklist.** Items failing: "Every entry in Output section 11 carries read-level evidence" — the read-level evidence is present and correct in claims 57 and 58, but the counted searches those entries state as their locators do not reproduce (**F1**); "The Question register is present; every entry has a bin… the sweep pass count is recorded" — the register satisfies this, but the closure arithmetic describing it does not reconcile (**F2**); and the ISO/IEC/IEEE 29148 Unambiguous requirement §3 names as governing the plan's own prose, at claim 56's site list (**F3**).

All other Gate C items pass, verified item by item this round rather than carried forward:

- **The line-cited half of §11's registration rule is complete.** I re-executed the stated extraction command over §7 (plan lines 236–1637, 1,402 lines): 37 occurrences over 33 distinct tokens. I enumerated all 33 and matched each against §11 by reading the section in full — **all 33 resolve**, including the four whose §11 registration uses a different range notation than §7's citation. The attestation's claim that all 33 resolve is correct.
- **The document population is complete.** I enumerated every file §7 references (`grep -oE '[A-Za-z0-9_./-]+\.(md|mjs|js|json)'` over §7, 57 distinct paths) and partitioned by kind. Every input document and governing document in that partition — `investigate.md`, `behavioral-tier-findings.md`, `HANDOFF.md`, the spec, the architecture, `testing-standards.md`, `output-contract.md`, and the out-of-repo APS Fusion `HANDOFF.md` — carries a §11 entry (claims 56–61 and 27). The remaining document-shaped paths (`docs/review-round-1.md`, `docs/plans/plan-expert-dev-tools.md`, the fixture docs) appear only inside S23's related-docs enumeration, which claim 55 registers as a dated tool result over a stated scope, and §7 asserts nothing about their contents.
- §5's five sublists are internally consistent: 27 rows, header counts matching; its workflow row lists exactly the twelve steps §13 names.
- §13's "twelve of the twenty-six" re-derived independently: the twelve match §5's workflow row; `grep -c "^### S"` returns 26. Attestation dated 2026-08-11, consistent with §3, §5 and §11.
- Every absence claim in §11 carries its kind and matching evidence. Claim 60's repository-wide content absence re-executed: one of the two quoted strings returns a single hit inside the plan's own disclosure, the other returns zero.
- The citation-identity rule holds for out-of-artifact references (`755bf9b`, `cd2f27b` for the APS Fusion HANDOFF; `94a640a` for the output contract at claim 61; transcript paths dated with unpinnable status stated).
- No step presents an option set, and no internal reasoning artifacts survive.

---

## Systemic Patterns

### F1 (Systemic) — counted-search results stated inside §11's new document-registration entries do not reproduce against the commands that produced them

**Provenance: regression.** Claims 56–61 are round 7's remediation output; round 7's record enumerates §11 as ending at claim 55 and names claims 56–61 nowhere. Both defective figures were written by the fix. (Scope limit 1 records that this rests on round 7's record rather than a diff, the plan being uncommitted.)

**What the plan does.** Two of the six new entries state a counted search as the locator for their reads, and give a result count the reader is invited to check.

*Claim 57* (Read, plan lines 2349–2354) opens: *"**What `docs/investigate.md` records at the sections §7 cites** (S1, S2, S4, S5, S8, S9, S10, S11, S12, S13, S16, S23). *Evidence — heading enumeration plus reads, 2026-08-11:* `grep -nE "^#{1,3} "` returns 21 headings, confirming every cited section exists…"*

**How verified.** I re-executed the exact command: `grep -cE "^#{1,3} " docs/investigate.md` returns **22**. Enumerating with `-n` gives 22 hits at `:1, :3, :67, :106, :134, :172, :198, :245, :254, :269, :290, :297, :305, :322, :347, :371, :373, :394, :424, :446, :455, :472`. The twenty-second is the document's level-1 title at `:1` (`# To investigate — expert-dev-tools`), which the pattern `^#{1,3} ` matches. The entry's enumeration lists 17 of these — the sections §7 actually cites — so the figure 21 appears to be the author's count of headings excluding the title, stated as the command's return value when it is not.

*Claim 58* (Read, plan lines 2371–2376) states, inside its content-absence evidence: *"`grep -n "B9a\|B9b\|B9c"` returns 9 hits, all read; no other passage reinstates the withdrawn evidence."*

**How verified.** I re-executed the exact command. `grep -n` returns **12 matching lines** — at `:105, :118, :127, :138, :268, :275, :276, :277, :280, :284, :303, :306`. `grep -c` confirms 12; `grep -o … | wc -l` gives **17 occurrences**. Neither population is 9. The three lines the entry's enumeration relies on (`:105`, `:118`, `:127`) are correct and were verified, and I read the nine lines the entry did not enumerate to confirm its substantive claim — none reinstates B9c's withdrawn evidence, so the *conclusion* holds. The stated count does not.

**Proactive scan across the full inventory scope.** A systemic claim requires the population swept, not sampled. I re-executed every counted search stated anywhere in §11 and every stated count in the restating sections:

| Site | Stated | Actual | Result |
|---|---|---|---|
| §11 attestation, line-cited half | 37 occurrences / 33 distinct / 32 collapsed | 37 / 33 / 32 | reproduces |
| §11 attestation, three named repeats | `testing-standards.md:91` ×3, `expert-review/SKILL.md:565` ×2, `expert-review/SKILL.md:111` ×2 | identical | reproduces |
| Claim 9 (`named standards`) | 3 | 3 | reproduces |
| Claim 12 (`artifact_path`, 493-line file) | 1 hit, 493 lines | 1, 493 | reproduces |
| Claim 36 (`label: 'revise`) | 3 | 3 | reproduces |
| Claim 44 (`^tools:` / `^skills:` partition, nine files) | 1×6, 0×3; skills 1×9 | identical | reproduces |
| Claim 45 (seven-field sweep; `stop_report`) | 0 files; 1 file | 0; 1 | reproduces |
| Claim 46 (`one of two/three/four`) | exactly 2 hits | 2 | reproduces |
| Claim 48 (`runGate(`) | 5 | 5 | reproduces |
| Claim 49 (`maybeNonConvergence(`) | 4 | 4 | reproduces |
| Claim 51 (`revis(e\|ion)`) | 0 | 0 | reproduces |
| Claim 56 (`-i "regression"`) | 1 hit | 1 | reproduces |
| Claim 60 (two repository-wide absence strings) | 0 outside the plan | 0 / 1-in-plan | reproduces |
| **Claim 57 (`^#{1,3} ` headings)** | **21** | **22** | **fails** |
| **Claim 58 (`B9a\|B9b\|B9c`)** | **9 hits** | **12 lines / 17 occurrences** | **fails** |
| §2 coverage table | 17 rows, union = 26 steps | 17; union enumerates to 26 | reproduces |
| §5 file list | 27 rows | 27 | reproduces |
| §12 / §7 test IDs | same set both directions | 24 = 24, identical membership | reproduces |
| §13 coupling hotspot | 12 of 26 | 12; 26 | reproduces |
| §15 G-3 / D-8 / §7 table | nine surfaces, three statements | nine in all three, numbered 1–9 | reproduces |
| **§14 closure attestation** | **17 bin-1 + 4 bin-2 + Q-22** | **17 bin-1 (Q-22 included) + 5 bin-2** | **fails — F2** |

Twenty-one sites swept; three fail, and all three are stated counts inside the plan's own verification or attestation records. The class is absent from every claim written before round 7's fixes, which is what makes the two §11 instances regressions rather than residue.

**Standard violated.** The pinned contract's §11 — the section is defined as *"the premise-correctness proof of the output contract,"* and its evidence requirement holds that *"Search tools (grep, code search, RAG queries, web search) locate; they are never themselves the evidence."* Where a locator's stated result is wrong, the reader cannot reconstruct the candidate set the entry claims to have covered, and for claim 58 the locator is doing double duty as a **content-absence** scope statement, which Gate C requires to state *"the search that defined the candidate set… and the scope covered."* A candidate set stated as 9 when it is 12 does not state its scope. Also the plan's own §11 preamble, which stakes the section's auditability on figures being *"checkable without reading a line of source."*

**Why this is systemic rather than isolated.** Three instances across two sections, under two different mechanisms the plan authored to prevent exactly this, found by sweeping twenty-one sites rather than by extrapolation. More to the point, it is the same generator as the four prior rounds' finding. D-8 states it in the plan's own words: *"a **count** that moves in one and not the others is the same defect one level up."* Rounds 4–7 found hand-maintained citations drifting; round 8 finds hand-maintained counts drifting inside the entries written to fix the citations. The registration mechanism worked — every proposition it registered is true at source — and the mechanism's own bookkeeping did not.

**What correct looks like.** Not a patch of the three figures. Each stated count in §11 and §14 is a derived value with no generator, and the correct form is either (a) to re-execute each stated command at write time and paste its actual output, or (b) to stop stating counts where the enumeration itself is the evidence — claim 57's seventeen enumerated headings prove every cited section exists without any total, and claim 58's three enumerated lines plus the read of the remainder prove the absence without a hit count. Option (b) removes the drift site rather than resetting it, which is the distinction G-3 and D-8 both draw between converting a surface and sweeping it harder. Whichever is chosen, the choice applies to all twenty-one sites swept above, not to the three that failed.

---

## Critical & Serious Findings

No Critical or Serious findings — the full inventory was Read or Grep-verified per Compliance Gate B, and no violations of Critical or Serious classification were observed. Round 7 reported no Critical or Serious findings either, so there were none to close; the two round-7 findings are dispositioned in the Convergence Record below.

---

## Moderate & Minor Findings

### F2 (Minor) — §14's closure attestation states a bin partition that does not reconcile with the register it describes

**Provenance: new.** The text predates round 7's fixes; round 7 read it and recorded that *"the closure arithmetic reconciles (17 bin-1 + 4 bin-2 + Q-22 = 22)."* No prior round reported it as a finding. It is the same class as F1 and is reported separately only because its provenance differs.

**What the plan says.** Read of plan lines 2850–2852: *"**Zero entries are open:** seventeen bin-1 entries closed with evidence pointers, four bin-2 entries closed with the owner's answer and the step incorporating it, one further bin-1 entry (Q-22) closed by D-9, zero bin-3."*

**How verified.** I extracted the register's bin column mechanically with `awk -F'|'` over the table rows (plan lines 2807–2828) and tallied: **17 entries in bin 1, 5 entries in bin 2, 22 rows total.** The bin-2 entries are Q-10, Q-11, Q-12, Q-13 and Q-17 — five, not four; each is Read and each does carry an owner answer with the step incorporating it, so the register itself satisfies Gate C. Q-22 carries bin 1 and is already one of the seventeen, so describing it as "one further bin-1 entry" counts it twice. The two errors offset — 17 + 4 + 1 = 22, and the true partition 17 + 5 = 22 — which is why the total looks right and the partition is wrong.

**Standard violated.** The pinned contract's Gate B: each compliance question *"must be answerable from the document alone, by pointing to a specific section or annotation."* The attestation is the document's answer to "how was the register closed," and a reader reconciling it against the table finds a bin-2 count short by one and an entry counted twice. Gate C's register item is satisfied by the table; this finding is against the self-record, not the register.

**What correct looks like.** State the partition the table actually carries — seventeen bin-1 entries (Q-22 among them, closed by D-9 rather than by an evidence pointer, which is the distinction the sentence was reaching for) and five bin-2 entries, zero bin-3, twenty-two total. Per F1's remedy, prefer stating the entry identifiers over stating counts.

### F3 (Minor) — claim 56 names one of the four corrected restatement sites as "S4's Source line"; the site is inside S3 and is not a Source line, and S4 cites the standard nowhere

**Provenance: regression.** Claim 56 is one of round 7's six new entries.

**What the plan says.** Read of plan lines 2331–2335: *"§7 previously restated the clause four times as 'a check/test that would have caught it'… All four sites now carry the demonstration requirement: **§3's registry row, S4's Source line, S6b's Gate-3 standard, and S15's Gate-3 standard.**"*

**How verified.** `grep -n "testing-standards"` over the plan returns the four correction sites at lines **90, 494, 833, 1243** (plus §3's second row at 104, §11's own text, and S21's citation of the distinct `:21` clause at 1531). `grep -n "^### S"` puts **S3 at 481–507 and S4 at 508–573**, so line 494 falls inside **S3**, not S4. Read of plan lines 490–497 confirms the site sits in S3's *"**Why this approach.** Trivial-plus: the standard is the general regression-test principle…"* block, and that S3's actual **Source.** line two lines above cites `docs/investigate.md` §1a instead. `grep -n "testing-standards"` returns no hit anywhere in 508–573, so S4 does not cite the standard at all. The entry contradicts its own header, which lists the governed steps as *"(S3, S6b, S7, S15, S21, T-2b, §3, §12)"* — S3 present, S4 absent — and contradicts §3's registry row at line 90, which maps the standard to *"S3, S6b, S7, S15, T-2b."* Both other steps in the sentence check out: line 833 is in S6b (712–868) and line 1243 in S15 (1229–1264), both in Gate-3 standard positions as described.

**Standard violated.** ISO/IEC/IEEE 29148:2018 §5.2.5 (Unambiguous), which §3 names as governing this plan's own prose, and the pinned contract's Gate B requirement that each answer be reachable *"by pointing to a specific section or annotation"* — a reader following "S4's Source line" to verify the correction finds neither the citation nor the clause.

**What correct looks like.** Name the site as S3's "Why this approach" block, matching the entry's own header list and §3's registry row. The correction itself is present and right at all four sites — this is a mislabel in the record of the fix, not a missing fix.

---

## Tentative Findings

No tentative findings — every candidate finding's premise was verified against current source per Compliance Gate B, with the grep queries, result counts and line-numbered reads recorded in each finding.

Two candidates were investigated and **dropped** rather than demoted, recorded because a review reporting either would have been confidently wrong:

- *That §15's G-3 ("stated in two places") and §7's maintenance rule 3 ("stated in three places") disagree.* Dropped, confirming round 7's reading against source rather than importing it: Read of §7 lines 275–282 shows rule 3 names the preamble table, D-8's surface list **and** G-3's count as the three statements, while Read of §15 lines 3031–3033 shows G-3 referring to the two full *enumerations* (D-8 and the preamble table) while itself carrying only the count. Read of D-8 (lines 1769–1774) confirms it enumerates the same nine surfaces. The three statements are consistent.
- *That §7's claim "`spec-farewell.md` was produced against the writer's `spec-greeter-farewell.md`" (plan line 1057) is an unregistered file-content claim.* Dropped: Read of lines 1053–1057 shows it inside S10's "What this is NOT" block, asserting what the A-3 **run produced** — a filename derivation — not what any file contains. It falls outside the population §11's rule defines, which is propositions about a file's *contents*.

---

## Observations

- **The author did not derive the fix from round 7's table, and the evidence is unambiguous.** Round 7's F1 named five documents and warned in bold not to treat its table as the specification. The walk registered **seven** documents, adding `docs/HANDOFF.md` and the pinned output contract on its own initiative, and claim 60 discloses a divergence no review had found: three owner rulings §7 presented as verbatim quotations in wordings that appear nowhere in the repository, which the author located, verified as absent (`grep -rn` → 0 hits for one, 1 self-referential hit for the other), and corrected against the real source. That is the second consecutive round in which the substitution failure that produced three findings in rounds 4–6 did not recur.
- **`collaborativereasoning` and `metacognitivemonitoring` were callable this round**, ending three consecutive rounds of recorded unavailability. Both were invoked. The multi-perspective check surfaced the finding-grouping objection that the Convergence Record now addresses explicitly; the metacognitive pass flagged outcome bias around the tripwire and prompted the twenty-one-site sweep that established F1's boundaries before classification.

---

## What's Actually Good

- **§11's population table replaces a prose instruction with an enumerated class and a compositional diagnostic.** Property: the rule no longer says "walk carefully" — it enumerates four kinds of file with examples and a "what a walk that stops early tends to miss" column, states that the last two kinds are where §7 draws its authority, and adds a check that is independent of yield size: *"if a walk's output is uniformly one kind, the population was drawn too narrowly regardless of how many propositions it emitted."* It then requires the documents be enumerated *before* the walk, so the population is checkable before any entry is written. Standard: the pinned contract's own diagnosis of this class — *"a plan is prose with no build step… consistency depends on the author walking every one after every change,"* and its instruction that a finding in a restating section is a class signal. Verified by Read of plan lines 1858–1898 and by testing the diagnostic against the two prior walks the section describes: the 2026-08-09 walk's yield of 2 and the 2026-08-10 walk's yield of 12 are both recorded, and I confirmed the twelve are uniformly source-and-configuration-shaped by reading claims 44–55. This is the first mechanism in eight rounds that would have caught its own predecessor's failure, and it is why the document population closed this round rather than a fifth.
- **Claim 60 corrects the plan against itself and states that it is doing so.** Property: rather than certifying §7's owner-ruling quotations, the entry declares *"This claim corrects the plan rather than certifying it,"* names the three fabricated wordings explicitly, gives a repository-wide content-absence search with its scope, and separates what was wrong (the wording) from what was right (the substance, at `docs/HANDOFF.md:68–80`) — including the observation that the "100% invalid" phrasing is genuine but belongs to a different document. Standard: the review skill's premise discipline as the plan applies it to itself — a comment or quotation inside the artifact is the author's claim, never verification. Verified by reading `docs/HANDOFF.md:66–80` in full against all five quoted rulings (all five reproduce verbatim, including line attributions `:68–71`, `:72`, `:73–74`, `:75–77`, `:78–80`) and by re-executing the absence search: `grep -rn "Artifact locations are standardized, not proposed" --include=*.md .` → **0 hits**; the other string → 1 hit, inside claim 60's own disclosure.
- **Claim 61 declines to give a line range and argues why.** Property: where every other document entry carries a range by the section's new citation rule, this one cites the output contract by path and commit and explains that S9's table asserts a property of the file *as a whole* — that it is "a dedicated contract document" — so *"a range would be narrower than the claim and would misrepresent what S9 relies on."* It also states that the working-tree copy is under active edit by separate work and is not the version any claim rests on. Standard: the pinned contract's citation-identity rule, which requires an immutable identifier for any artifact that can change independently of the plan and specifies commit as the form for an in-repository file. Verified by `git show 94a640a:…/output-contract.md`, read in full as this review's own governing document, and by `git status`, which confirms the working-tree copy is modified. An entry that identifies where its own section's default rule does not apply, and says so, is stronger than one that complies mechanically.

---

## Convergence Record

**Round number:** 8 (Post-fix).

**Trajectory:** R1 = **13** (1 Critical, 1 Systemic, 6 Serious, 2 Moderate, 3 Minor) → R2 = **13** (1 Critical, 1 Systemic, 4 Serious, 4 Moderate, 3 Minor) → R3 = **10** (1 Systemic, 7 Serious, 1 Moderate, 1 Minor) → R4 = **7** (1 Systemic, 3 Serious, 2 Moderate, 1 Minor) → R5 = **9** (1 Systemic, 2 Serious, 4 Moderate, 2 Minor) → R6 = **2** (1 Systemic, 1 Minor) → R7 = **2** (1 Systemic, 1 Minor) → **R8 = 3** (1 Systemic, 2 Minor).

Rounds 1–7 are taken from each round's own verdict line on disk; R8 from this round's mechanical breakdown.

**Flow counts for this round**, from the Step 9 provenance classifications:

- **Prior findings closed: 2** — both of round 7's.
  - *R7 F1* (§11's line-free walk swept source files only, leaving document citations unregistered) — **closed** against the originally named standard, the contract's §11 definition (*"what a doc currently says"*) plus Gate C's reconciliation item. Verified by: reading all six new entries (claims 56–61) and re-reading every quotation at its cited range in `testing-standards.md`, `investigate.md`, `behavioral-tier-findings.md`, `spec-expert-dev-tools.md`, `architecture-expert-dev-tools.md`, `HANDOFF.md` — all reproduce verbatim; by independently enumerating every file §7 references and partitioning by kind to confirm no document is left unregistered; by confirming the four `testing-standards.md` restatements now carry the demonstration requirement at plan lines 90, 494, 833 and 1243; and by confirming the citation-form rule is stated and honoured (every document entry carries a line range except claim 61, which states why).
  - *R7 F2* (§11's attestation reported "28 distinct tokens" with a partition that did not reconcile) — **closed** against the originally named standard, Gate B auditability. Verified by re-executing the stated extraction command over §7: **37 occurrences, 33 distinct tokens, 32 collapsed to path-plus-start-line**, matching the attestation exactly, with the three repeating tokens named correctly. The attestation now labels the two populations and explains why they are stated separately.
- **New findings: 1** — F2 (§14's bin partition), pre-existing text no prior round reported.
- **Regressions: 2** — F1 (claims 57 and 58's counted-search figures) and F3 (claim 56's site misattribution), all three instances written by round 7's fixes.
- **Recurring: 0** — neither round-7 finding survives at its own location and standard.

1 new + 2 regressions + 0 recurring = 3, reconciling with the finding count.

**Tripwire evaluation — FIRED. Both conditions, arithmetic shown.**

*Condition (a) — new + regression findings ≥ closed findings for two consecutive Post-fix rounds.* Round 6: new 1 + regression 0 = 1; closed 8; 1 ≥ 8 is false → did not hold. Round 7: new 1 + regression 0 = 1; closed 1; **1 ≥ 1 is true → held**; consecutive count entering this round = **1**. Round 8: new **1** + regression **2** = **3**; closed = **2**; **3 ≥ 2 is true → holds**. **Consecutive count = 2, meeting the threshold of 2. Condition (a) has fired.**

*Condition (b) — total findings has not strictly decreased for two consecutive Post-fix rounds.* Round 6: 9 → 2, a strict decrease → did not hold. Round 7: 2 → 2, **not** a strict decrease → held; consecutive count entering this round = **1**. Round 8: 2 → **3**, **not** a strict decrease → holds. **Consecutive count = 2, meeting the threshold of 2. Condition (b) has fired.**

**On the grouping objection.** F1 collects two instances of one class into one finding while F2 and F3 stand alone; a different reviewer could plausibly report four findings or two. That choice cannot change the outcome: condition (b) turns on the total not strictly decreasing from 2, and any finding set of size 2 or greater satisfies it — the only grouping that avoids firing condition (b) is one producing a single finding, which would require merging three defects of two different classes and two different provenances. Condition (a) is likewise insensitive here, since closed = 2 and any set of size 2 or more that is composed of new and regression findings satisfies it. The tripwire fires on the arithmetic, not on the classification judgment.

**What the arithmetic does and does not say.** Read narrowly, this is a mild round: zero Critical for the sixth consecutive round, zero Serious for the third, both prior findings closed, and the closures are of high quality — the document population was genuinely swept, seven documents registered where the review named five, and every one of roughly twenty verbatim quotations reproduces at source. The count rose by one, from two to three, on findings whose combined substantive impact is four wrong numbers and one wrong step label. No proposition the plan depends on has been shown false this round.

Read against the series, it says something the individual severities do not. This is the **eighth consecutive round** in which a class mechanism was authored and a defect of the same shape survived it, and the shape has now moved twice: from unregistered citations (rounds 4–7), to inaccurate counts inside the registration entries themselves (round 8). Two of this round's three instances were **manufactured by the fixes**, which is the regression signature the tripwire exists to detect and which had been at zero for two rounds. The plan's own §15 G-3 records that every round to date has found drift in at least one of its nine restating surfaces; that count is now eight of eight. And the plan's own D-8 predicted this specific migration in advance — *"a count that moves in one and not the others is the same defect one level up"* — which means the artifact has, for three rounds running, correctly diagnosed a class it cannot close by the means available to it.

Round 7's record closed by naming what a fourth consecutive report of this class would mean, and by observing that both counters stood at 1 with either one firing at round 8. Both have fired. The conclusion round 7 held in reserve is now the reading the arithmetic independently supports: the defect is not that any walk was skipped or faked — every walk in this series ran honestly and each emitted more than the review that prompted it — but that the artifact mandates hand-maintained derived surfaces that no walk discipline holds. That is the generation-versus-audit boundary D-8 names and the output-contract change G-3 has proposed for three rounds.

---

## Recommended Priority

**The tripwire has fired on both conditions, so the indicated path is foundational rework, not another fix round.** Per the compliance checklist's Gate 8: re-read the sources, re-derive the approach, and do not carry the failed attempt forward. Recommending a ninth fix round over a fired tripwire is forbidden, and would be this tool inviting the churn the tripwire exists to name.

Concretely, foundational rework here does **not** mean rewriting the plan's content. Eight rounds have produced no finding of missing work, no wrong design decision, and no defect in the build order; §7's twenty-six steps, §12's twenty-four test specifications and §10's nine decisions have survived every round intact, and the propositions §11 registers are true at source. What has never converged is the plan's **hand-maintained derived surfaces** — nine of them by the plan's own count, mandated by the output contract and supplied with no generator. The rework is therefore at the level of the format, and it is the change §15's G-3 has proposed for three consecutive rounds and left to the owner:

1. **Amend the output contract** (`skills/expert-plan/references/output-contract.md`) to specify a machine-readable per-step declaration — files touched, requirement elements covered, test IDs, and, on the evidence of this round, **claim identifiers and their locator commands** — from which sections 2, 5, 11, 12 and 14 are generated rather than authored. The contract's own "Sections that restate the step set" note already names this as the closing condition and states that until it exists, the rules are "a mitigation… they reduce the drift rate, they do not eliminate it." Eight rounds on one artifact is the empirical measurement of that residual rate, and this round demonstrates the mitigation displacing the class rather than reducing it. The contract is not this plan's to amend, which is precisely why this is an owner decision and not a ninth round.

2. **Do not patch the four values this review names.** Correcting 21 → 22, 9 → 12, four bin-2 → five, and S4 → S3 would close this round's findings and re-arm the same twenty-one sites, which is the pattern rounds 4 through 8 document. If the owner directs that the plan be finished under the current contract regardless, the correct move within the artifact is the one F1's *What correct looks like* names — remove the stated counts wherever the enumeration is itself the evidence, converting the drift sites rather than resetting them — applied across all twenty-one sites swept in F1, not the three that failed.

3. **Weigh whether the plan is already executable.** This is the owner's call and outside the verdict, but it belongs in the record: the three open findings are four incorrect numbers and one incorrect step label inside the plan's own bookkeeping sections. None of them changes what an implementer builds, and §7, §12 and §5 — the sections an implementer executes from — reconcile cleanly in both directions this round. The verdict stays NEEDS FIXES by the mechanical rule, and the tripwire's recommendation stays foundational rework; but the risk the owner would be accepting by shipping the plan as-is is documentation accuracy in the audit trail, not build correctness.

---

Verdict: NEEDS FIXES (3 findings: 1 Systemic, 2 Minor)
