# Expert Review — expert-plan output contract: derived sections become generated

Round 7 (first review after the owner-authorized foundational rework). Reviewer: independent subagent, 2026-08-09.
Persisted by the reviewing agent; persistence is the only edit this reviewer made to the repository.

## Scope and Inventory

**Round number:** 7. Prior rounds: `docs/reviews/output-contract-generated-sections-round-01.md` (NEEDS FIXES, F-1..F-10), `-round-02.md` (G-1..G-5), `-round-03.md` (H-1..H-4), `-round-04.md` (I-1, I-2), `-round-05.md` (J-1..J-4), `-round-06.md` (K-1..K-5, **both tripwire conditions fired**).

**Cycle status the record is required to state.** Round 6 fired both non-convergence tripwire conditions; the owner authorized foundational rework on 2026-08-09 (`docs/SKILL-CHANGELOG.md` entry 12, "Trigger" paragraph, Read at drafting time). Per the tripwire's own semantics — it routes to foundational rework rather than to another fix round, and rework is not a fix round — **the convergence counters restart from the rework.** This round is round 1 of the restarted cycle for tripwire purposes while remaining round 7 by absolute count. Both conditions are evaluated fresh below, and both require two consecutive rounds, so neither can hold at the first round of a restarted cycle. That is stated as arithmetic in the Convergence Record, not asserted here.

### Step 3 tool plan

| Claim type in scope | Instrument | Availability / disposition |
|---|---|---|
| Behavioral ("this input produces that exit code / that diagnostic") | Execution of the shipped script against fixtures built in the session scratchpad | Available. **~45 probe runs.** No repository file was ever passed to write mode; every write-mode run and every mutation targeted a scratchpad copy under `…/scratchpad/fx/` or `…/scratchpad/sk/`. |
| Adversarial probing of `--self-check` itself | A full copy of `skills/expert-plan/scripts/` **and** `skills/expert-plan/references/` into `…/scratchpad/sk/`, then mutation of the copied contract and copied fixture | Available. Required because `--self-check` resolves the contract by a hardcoded relative path (`../references/output-contract.md`, script line 399) and takes no operand, so it can only be adversarially tested by relocating the whole pair. |
| Literal-content ("line N says Z") | `Read` at the cited file:line at drafting time | Available, used throughout |
| Absence ("the contract contains no X") | `grep` over the named file with query and result count recorded | Available; used for L-1(iii) |
| Structural / blast radius | CodeGraph | Not exercised — the script is a standalone entry point whose only imports are `node:fs`, `node:path`, `node:url` (Read lines 76–78). No finding makes a structural claim. |
| Library behavior | Context7 | **Not needed** — no third-party dependency exists. No library-behavior claim category is in scope, so no Step 3 halt condition arises. |
| Claims imported from prior documents (rounds 1–6, changelog entries 6–12, HANDOFF.md) | Re-derivation with the instrument the underlying claim type requires | Available; every K-1..K-5 disposition below was re-derived by execution or grep — none accepted from changelog entry 12 |
| Comment claims inside the artifact (script header; the `// K-2`, `// K-3`, `// K-4` inline comments) | Re-derivation from executed behavior | Available; used to test the K-4 comment's claim, which is where L-3 came from |

No instrument class was unavailable for a load-bearing claim category. No rigor waivers — no compression was requested. Node v22.16.0 present, so the contract's Node-unavailability halt condition did not arise.

### Inventory — all four Post-fix sources

| File | Source | Status | Verification |
|---|---|---|---|
| `claude-plugins/expert-dev-tools/skills/expert-plan/scripts/derive-plan-sections.mjs` | fix-diff (new file) | [x] | Read 1–527 in full; diagnostic sites enumerated `grep -nE "errors\.push\(\|^\s*fail\("` (excluding `failures.push`) → **32 hits**, of which 29 are document/grammar diagnostics; negative-case entries counted `grep -cE "^    \['"` → **13**; executed in ~45 probes |
| `claude-plugins/expert-dev-tools/skills/expert-plan/scripts/fixtures/valid-plan.md` | fix-diff (new file) | [x] | Read 1–69 in full; checked clean via `--self-check` (2 steps, 3 elements, 2 specs); mutated in three ways on a scratchpad copy, each rejected |
| `claude-plugins/expert-dev-tools/skills/expert-plan/references/output-contract.md` | prior inventory + fix-diff | [x] | Read 1–128 in full; full `git diff HEAD` against baseline `94a640a`; fenced blocks extracted programmatically with the parser's own regex → `plan-elements` **1**, `step-decl` **1**; `grep -c "hand-maintained"` → **0** |
| `claude-plugins/expert-dev-tools/docs/SKILL-CHANGELOG.md` (entries 6–12) | fix-diff | [x] | `grep -nE '^### [0-9]+ '` → **12** headings; entry 12 Read in full (lines 470–end) |
| `claude-plugins/expert-dev-tools/docs/HANDOFF.md` | fix-diff | [x] | Read via `git diff HEAD` — the dispatch-pinning and changelog-pointer paragraphs in full |
| `claude-plugins/expert-dev-tools/skills/expert-plan/SKILL.md` | fix-diff dependent | [x] | `grep -cE "derive-plan-sections\|step-decl\|plan-elements\|generated:\|self-check"` → **0 hits** (unchanged from rounds 3–6) |
| `claude-plugins/expert-dev-tools/docs/plans/plan-expert-dev-tools-behavioral-remediation.md` | prior inventory | [x] | `grep -cE "step-decl\|generated:"` → **0 hits** — no retrofit; Applicability rule honored. Modified in the working tree by the separate concurrent thread; out of this change's scope. |
| `claude-plugins/expert-dev-tools/docs/reviews/output-contract-generated-sections-round-06.md` | prior review record | [x] | Read 1–236 in full |
| `git show 94a640a:…/output-contract.md` (baseline) | prior inventory | [x] | Read via `git diff HEAD` against it |
| K-1, K-2, K-3, K-4, K-5 as closure items | prior findings | [x] | Each re-derived from current source by execution or grep; dispositions in the table below |

**Fix-diff dependents.** The script has no importers (standalone entry point; only Node built-ins). The contract's only in-repo dependent is `SKILL.md` (grep above, 0 hits). The fixture's only consumer is the script's `--self-check`. All covered.

**Procedural observation.** `collaborativereasoning` was again rejected on its first call with a schema-validation error on the persona `communication.style` / `.tone` enums, and succeeded on the second call with corrected values. **This is the sixth consecutive round to record this same infrastructure failure.** The multi-perspective check ran as designed on the successful call, with the standards-discipline, downstream-consumer, and implementer personas. `metacognitivemonitoring` was invoked at the evaluation stage, after the verification phase and before any finding was drafted into this record — stated plainly because the skill places it at review start.

## Summary

**This review returns NEEDS FIXES.** The foundational rework is real and it worked: `--self-check` exists, is a single command with an exit code, and I confirmed adversarially — by mutating a relocated copy of both the contract and the fixture — that it genuinely fails rather than merely reporting. Six of seven mutations produced exit 1 with accurate diagnostics, and the restored copies returned to exit 0. That closes the executability half of the finding that had recurred for three straight rounds, and three of round 6's five findings (K-2, K-3, K-5) are closed by execution. What blocks the verdict is that the same class the rework was commissioned to kill survived the rework at reduced scale: two sentences the contract uses to describe the new control are false when executed, and the residual disclosure round 6 specifically required is still absent (`grep -c "hand-maintained"` → 0). Separately, the parser fix for K-3 introduced a new, delivery-blocking constraint on the wording of §12's heading that the contract nowhere states — the exact "constraint enforced but unstated" failure the contract's own move-together bullet forbids, and one `--self-check` structurally cannot detect. **Neither tripwire condition fires**, and the arithmetic is shown.

## Upstream Contract Verification

No formal spec or architecture document governs this change. The binding upstream artifacts are the owner ruling in `docs/HANDOFF.md`, the owner's 2026-08-09 rework authorization, the contract's stated closure condition, and rounds 1–6's findings.

| Upstream requirement | Status | Verification method |
|---|---|---|
| Owner ruling: the drift surfaces "have to be converted, not swept harder" | **Honored for the first time in the contract↔script relationship** | The move-together bullet now invokes an executable (`--self-check`) rather than prescribing a manual procedure. Verified by running it (exit 0, 15 checks) and by mutation probes proving it fails on divergence. |
| Round-6 tripwire routing: foundational rework, not a seventh fix round | Honored | Changelog entry 12 Read: pipeline refactored into a pure `processDocument(text)`, new mode, new committed fixture — a structural change, not a rewording. Confirmed by Read of script lines 87–388 (pure function) and 392–481 (self-check). |
| "a machine-readable step declaration … from which §2, §5 and §12 are generated" | Honored, with disclosed narrowing | §12 is cross-checked rather than generated, narrowing and reason stated at contract line 70. Closed at round 2; unchanged. |
| Owner authorization dated 2026-08-09 | Present | Read `SKILL-CHANGELOG.md` entry 12, "Trigger" paragraph |
| Applicability rule: the in-flight plan is not retrofitted mid-cycle | Honored | `grep -cE "step-decl\|generated:"` over `docs/plans/plan-expert-dev-tools-behavioral-remediation.md` → **0 hits**; HANDOFF.md's dispatch pin at `94a640a` present |
| Round 6 verdict NEEDS FIXES — all five findings remediated | **Partly met** | K-2, K-3, K-5 closed by execution; K-1 recurs as L-1; K-4 recurs as L-3; the K-3 fix introduced L-2 |

### Round-6 finding dispositions

Each re-derived from current source by execution or grep. Changelog entry 12's claims were treated as author claims inside the artifact, not as verification.

| # | Disposition | Verification (executed, never accepted from the changelog) |
|---|---|---|
| **K-1** (Systemic) the move-together rule's mechanical half is prose; the contract states a false claim about that control | **Partly closed — recurs as L-1** | The executable was built and it works. Seven adversarial mutations on a relocated copy: contract example uncovered element → exit 1; contract example covering an undeclared element → exit 1; contract example with a bad step ID → exit 1; fixture uncovered element → exit 1; fixture stale generated region → exit 1; fixture orphan spec → exit 1; restore → exit 0. What did not close: two contract sentences describing the control remain false, and the required residual statement is absent. Evidence in L-1. |
| **K-2** (Serious) `### T-<id>` spec headings terminate the §12 scan at section levels 3–4 | **Closed** | Four probes on otherwise-identical fixtures, §12 heading at levels 1/2/3/4 with `### T-1` specs → **exit 0 at all four levels** (`OK: 1 steps, 1 elements, 1 test specs, regions current`). Round 6 measured exit 1 with three misdirecting errors at levels 3 and 4. Read of script lines 304–312 confirms the terminator now skips headings matching `^T-[A-Za-z0-9._-]+\b`. |
| **K-3** (Moderate) the §12 anchor matched the first heading anywhere *containing* the phrase | **Closed, and it introduced L-2** | Probe: a decoy `## Notes on Test specifications` heading prepended ahead of a complete §12 → **exit 0**, where round 6 measured exit 1 with three false errors. Read of script line 292 confirms `^(#{1,4})\s+(?:\d+\.?\s*)?Test specifications\s*$`. The anchor tightening is correct; the constraint it creates is undocumented — see L-2. |
| **K-4** (Minor, regression) the indentation check cascades into further diagnostics, one false | **Partly closed — recurs as L-3** | Probe K4a (tab-indented **top-level** key inside a 4-space fence) → **exactly one error**, the indentation error; round 6 measured four. But probe K4b (tab-indented `delete:` **sub-key**) → **three** errors and probe K4c (a sub-key de-indented to column 0 inside an indented fence) → **five**, including `unparseable line: delete: []` for a line the author wrote correctly. Evidence in L-3. |
| **K-5** (Minor, recurring) HANDOFF.md's changelog pointer re-enumerated by hand | **Closed** | Read via `git diff HEAD`: "`docs/SKILL-CHANGELOG.md` entries 6 onward — the changelog is the authoritative enumeration; this pointer deliberately names no upper bound". Unbounded, exactly as K-5's correction specified, and it names the reason so a future editor does not re-enumerate it. |

### Two-directional grammar walk (contract ↔ parser)

**Contract → parser.** I extracted every grammar constraint the contract states in §2, §7, and the workflow bullets, and executed a violating input for each against the shipped parser. Seventeen constraints beyond those the self-check covers were probed; **all seventeen are enforced**, each with an accurate first diagnostic:

| Constraint stated in the contract | Violating input | Result |
|---|---|---|
| five top-level keys, each appearing exactly once (missing half) | drop `tests:` | exit 1, `missing required key 'tests'` |
| list values only in inline form | `covers: R-1` | exit 1, `value must be an inline list` |
| block sequences rejected | `covers:` + `- R-1` | exit 1, `value must be an inline list` |
| flow mappings rejected | `covers: {a: b}` | exit 1, `value must be an inline list` |
| quoting rejected | `tests: ["T-1"]` | exit 1, `contains bracket/brace/quote characters` |
| comments rejected (inline) | `covers: [R-1] # note` | exit 1, `value must be an inline list` |
| comments rejected (own line) | `# hi` | exit 1, `unparseable line: # hi` |
| a comma always separates entries | `covers: [R-1,]` | exit 1, `empty list entry (stray or trailing comma)` |
| files sub-keys each exactly once | duplicate `delete: []` | exit 1, `duplicate files sub-key 'delete'` |
| depends_on acyclic (multi-node) | S1→S2→S1 | exit 1, `dependency cycle involving steps S2 and S1` |
| exactly one `plan-elements` block | two blocks | exit 1, `found 2 plan-elements blocks` |
| depends_on names a declared step | `depends_on: [S9]` | exit 1, `depends on undeclared step S9` |
| step IDs unique | two `step: S1` | exit 1, `duplicate step ID S1` |
| each generated region present | delete the files marker pair | exit 1, `missing region markers for 'files'` |
| each generated region appears once | duplicate the files marker pair | exit 1, `marker 'files' occurs 2 times` |
| §12 required for the cross-check | rename the heading | exit 1, `no "Test specifications" heading found` |
| only the five named keys | `bogus: [x]` | exit 1, `unknown key 'bogus'` |

**Parser → contract.** Walking the 29 document diagnostics against the contract text, the direction that closed by hand in round 6 has **reopened at one site**: the §12 heading-title exactness constraint introduced by the K-3 fix (L-2). The three marginal-but-unstated diagnostics round 6 recorded as Observations (`duplicate step ID`, `empty list entry`, `marker occurs N times`) are all now *effectively* stated — the first two only by entailment, unchanged — and are carried forward in Observations again rather than as findings, on the same reasoning.

## Critical & Serious Findings

### L-2 (Serious, regression) — the K-3 anchor fix made §12's heading wording a silent, delivery-blocking precondition that the contract nowhere states

**What the code does.** The Test-specifications anchor (script line 292) is now `/^(#{1,4})\s+(?:\d+\.?\s*)?Test specifications\s*$/im`. The `\s*$` terminator means the heading text must be *exactly* "Test specifications", optionally preceded by a number. Any suffix fails the anchor, and the document is then rejected with `no "Test specifications" heading found` plus one unresolvable-reference error per `tests:` entry.

**How that claim was verified.** Read of script line 292 at drafting time, plus seven executed probes on otherwise-identical fixtures whose §12 content was complete and unchanged:

| §12 heading | Result |
|---|---|
| `## 12. Test specifications` | exit 0 |
| `## Test specifications` | exit 0 |
| `## 12 Test specifications` | exit 0 |
| `## Test Specifications` (title case) | exit 0 |
| `## 12. Test specifications and coverage` | **exit 1** |
| `## 12. Test specifications (T-series)` | **exit 1** |
| `## §12 Test specifications` | **exit 1** |

And the absence half: `grep -niE "exactly|heading|anchor"` over `references/output-contract.md` returns no sentence stating any requirement on §12's heading wording; the contract's only statement about §12 and the script (line 60) concerns the *specification ID line* forms, not the section heading.

**Standard violated.** **Documentation-as-contract**, and specifically the rule this contract states about itself at line 75: *"a constraint enforced but unstated is a gate an author cannot prepare for."* Gate C makes `--check` exit 0 a delivery condition, so a plan author who titles §12 "Test specifications and coverage" — an ordinary, contract-conformant choice, since the contract prescribes section *content* and never fixes heading wording — is blocked at delivery by a rule that appears nowhere in the only specification they read.

**Why it matters beyond the inconvenience.** This is the direction `--self-check` cannot cover. The self-check harness validates that the contract's assertions hold against the parser; it has no way to discover a parser constraint the contract never asserts, because there is nothing to extract. So this defect is not merely an oversight in the rework — it is the first live demonstration of the residue the rework was required to disclose and did not (L-1(iii)), appearing in the same change set.

**What correct implementation looks like.** Two acceptable closures, and they are not equivalent. Preferred: **the contract moves** — §12's definition states the constraint where an author is already reading, e.g. "the section's heading text must be exactly `Test specifications`, optionally preceded by a section number; the derivation script anchors on it." That is one sentence and it converts a silent precondition into a stated one. Secondarily worth considering: **the script's diagnostic moves** — when no exact-title heading is found but a heading at levels 1–4 *contains* the phrase, the error should name that heading and say the title must be exact, rather than reporting the section as absent when a near-miss is sitting in the document. Fixing only the diagnostic without stating the constraint does not close this finding.

## Systemic Patterns

### L-1 (Systemic, recurring — K-1 / J-1 / I-2, fourth consecutive round) — the executable was built, but the contract's description of it is still false in two places, and the residual the rework was required to disclose is absent

**The pattern.** The shape is unchanged across four rounds: *a compensating control the contract names, where the contract's description of the control is not true of the control.* What changed this round — and it is a genuine change — is that the control now exists and runs. What did not change is the class: the sentences describing it overstate it, and the honest residual statement is still missing.

**Proactive scan.** The pattern's signature is "a contract sentence asserting a property of the derivation control." I enumerated every such sentence by reading the contract's §2 parenthetical, the "Derived sections are generated" section, and Gate C in full — **four sentences assert a property of the control; three of them are false or incomplete when executed.**

| # | Contract text | Reality | Verification |
|---|---|---|---|
| i | §2 line 16: "pasting both into one scratch fixture per the move-together rule checks clean once every element is covered" | **False, and textually unchanged from the form round 6 quoted.** Both blocks extracted byte-for-byte with the parser's own regex into a scaffold with *every* element covered → `--check` **exit 1**, `STALE: regions out of date: coverage, files`. Exit 0 is reachable only by regenerating first, which the sentence never mentions. The sentence is also now stale in a second way: the move-together rule it cites no longer prescribes a manual paste — it invokes `--self-check`, which regenerates internally (script lines 424–428). | Programmatic extraction + executed fixture `paste.md` |
| ii | Line 75: `--self-check` "asserts every stated grammar constraint rejects its violating input" | **False by a wide margin.** The harness contains **13** negative cases (`grep -cE "^    \['"` over the script → 13). I executed **17 further constraints the contract states** (table in the grammar walk above); every one is enforced by the parser and **none** is asserted by `--self-check`. Among the unasserted: the fence-indentation rule — which is precisely where L-3's surviving defect lives, so the gap is not hypothetical. | Case count by grep; 17 executed probes |
| iii | Line 75: "What `--self-check` cannot verify is prose *about* the grammar that states no checkable constraint — that residue is still read by hand." | **Incomplete, and the omission is the one round 6 named.** The residue disclosed is the harmless one. The consequential residue — a constraint the *parser* enforces that the contract never states — is not disclosed at all, and no mechanism detects it. `grep -c "hand-maintained"` over the contract → **0**; round 6's K-1(iii) required the bullet to state plainly that this direction is hand-maintained and to name the script's diagnostic list as the enumeration to walk. Neither appears. L-2 is that undisclosed residue firing inside the same change set. | grep with count; Read of contract line 75 |

The fourth sentence — "A non-zero exit means the contract and script have diverged — the edit is not delivered until it passes" — **is true**, and is the reason this finding is Systemic-recurring rather than unchanged: the core assertion about the control finally holds.

**Standard violated.** **Honest risk disclosure with a named compensating control** — the standard H-1, J-1(c), and K-1 were all decided under. A control cited as the guarantee must exist, must be runnable, and *the specification's description of it must be true*. The first two now hold; the third does not. Secondarily **documentation-as-contract** for instance (i), since the parenthetical is text an author would rely on and act upon.

**Why systemic rather than isolated.** Three of four control-describing sentences are wrong, which is a property of how the section is written rather than of any one sentence. The trajectory is the argument: fail-open validation (R1–R2) → the documentation sweep (R3) → the one-directional reconciliation (R4) → the rule governing it (R5) → the rule's description of itself (R6) → **the new executable's description of itself** (R7). The rework moved the class from "the control does not exist" to "the control exists and is described inaccurately," which is real progress and a smaller problem — but it is the same class, and instance (i) has now survived two consecutive rounds *verbatim* after being reported.

**What correct implementation looks like.** Three bounded edits, none of which is another rewrite of the section:
1. Delete the §2 parenthetical outright. It described a manual procedure that no longer exists. Nothing replaces it — `--self-check` is the procedure, and it is already documented at line 75.
2. Make line 75's claim match the harness. Either narrow the wording to what is true ("asserts a set of representative grammar constraints, enumerated in the script's `cases` table, reject their violating inputs") **or** extend the harness so the claim becomes true. Extending is preferable and is bounded: the 17 constraints in this review's grammar walk are already written as executable probes and each one is a two-line entry in the existing `cases` array.
3. Add the missing residual sentence: the parser→contract direction is hand-maintained, no mechanism detects a constraint the parser enforces and this contract omits, and the enumeration to walk is the script's diagnostic-site list. L-2 is the worked example to cite.

## Moderate & Minor Findings

### L-3 (Moderate, recurring — K-4) — the indentation-error cascade was fixed for top-level keys only; at `files:` sub-keys it still emits false diagnostics, and the script's own comment claims otherwise

**What the code does.** In `extractBlocks` (script lines 102–111), a content line lacking the fence's indentation pushes the indentation error and then returns the line with *all* leading whitespace stripped (`return l.replace(/^[ \t]+/, '')`). For a top-level key that recovers correctly — the de-indented line parses as the key the author wrote, and exactly one error results. For a `files:` sub-key it does the opposite: stripping the indentation promotes the sub-key to column 0, where the parser reads it as a *top-level* key, rejects it as unknown, turns off `inFiles`, and then reports the sub-key missing — and any correctly-indented sub-key that follows becomes unparseable.

**How that claim was verified.** Read of lines 99–111 and 187–230 at drafting time, plus three executed probes on a four-space-indented fence:

| Probe | Errors | Notes |
|---|---|---|
| K4a — `tests:` indented with a tab | **1** | the indentation error alone; K-4's fix working as documented |
| K4b — `delete:` indented with a tab | **3** | indentation error, `unknown key 'delete'`, `files: block missing sub-key 'delete'` |
| K4c — `modify:` de-indented to column 0 | **5** | indentation error, `unknown key 'modify'`, **`unparseable line: delete: []`**, missing `'modify'`, missing `'delete'` |

In K4c the third diagnostic is false on its face — `delete: []` is present and correctly indented; it is unparseable only because the *preceding* line's mishandling turned off `inFiles`. The missing-`'delete'` error is false for the same reason.

**Standard violated.** **Diagnostic accuracy** — K-4's originally named standard, itself the standard H-4 and J-2 were decided under. Under Gate A this is not closure: the fix satisfies the standard at the instance round 6 probed and violates it at the sibling instance in the same function. Compounding it, the inline comment at script lines 99–101 asserts the general property — *"the offending line is still de-indented as far as possible so parsing continues and the author gets one accurate error, not a cascade of false missing-key diagnostics"* — which is an author claim inside the artifact and is false for sub-key lines, as K4b and K4c demonstrate. Provenance: recurring, same standard, same function.

**Correct implementation.** Use the guard idiom the file already contains twice (`errsBefore` at the vocabulary site, `filesInvalid` at the `files:` site). Mark the block structurally invalid when any content line fails the indentation check, and suppress the downstream per-line and missing-key diagnostics for that block — the author gets the one error describing what they actually did, which is what H-4, J-2, and K-4 each established in turn. Then correct the comment to state the property the code actually has.

### L-4 (Moderate, new) — the self-check scaffold hardcodes the contract examples' literal IDs, so a valid, self-consistent edit to those examples fails with a diagnostic naming a symbol that appears nowhere in the contract

**What the code does.** The scaffold at script lines 411–422 splices the contract's extracted `plan-elements` and `step-decl` blocks into a synthetic document, but the surrounding scaffolding is written as string literals tuned to the examples' *current* contents: a synthetic step `S11` with `covers: [R-1, Q-1]` (the two vocabulary elements the real example does not cover), and a spec line `- **T-9**` (the test ID the real example references). Nothing is derived from the extracted blocks.

**How that claim was verified.** Read of lines 411–422 at drafting time, plus three mutation probes on the relocated scratchpad copy:

- Rename the contract's example vocabulary to `elements: [A-1]` and the example's `covers: [A-1]` — internally consistent and fully grammar-conformant — → `SELF-CHECK FAIL: contract examples do not parse clean: step S11 covers 'R-1', which is not in the plan-elements vocabulary`. **Step `S11` does not appear anywhere in the contract**; it exists only inside the harness.
- Change the example's `tests: [T-9]` to `tests: [T-4]` → `SELF-CHECK FAIL: … step S12 references test T-4, which has no specification`. There is no §12 in the contract; the specification it means is a scaffold literal.
- Control: change `depends_on: [S11]` to `depends_on: []` → exit 0, confirming the failures above are the hardcoding and not a general intolerance of edits.

**Standard violated.** **Diagnostic accuracy**, plus the first-principles articulation that a self-validating harness must not fail on valid input: the goal the scaffold serves is to prove the contract's examples are conformant; the shortcut it takes is to assume the examples' literal identifiers rather than derive the scaffolding from them; the shortcut fails the goal because the harness then rejects conformant examples and reports the rejection against synthetic symbols the author cannot find in the file they edited. Round 6's K-1 specified the correct shape in advance — *"synthesizing the scaffolding those blocks require … the test IDs the extracted decl actually references, the steps the `depends_on` entries name, steps covering the declared vocabulary"* — and the implementation hardcoded what it was asked to synthesize.

**Correct implementation.** Derive the scaffold from the extracted blocks: parse the extracted `plan-elements` line for the vocabulary and emit one synthetic step covering exactly the elements the extracted `step-decl` does not; emit one `- **T-<id>**` line per ID in the extracted `tests:` list; emit one synthetic step per ID in the extracted `depends_on:` list. Every literal in the current scaffold then disappears, and the harness validates whatever examples the contract happens to carry.

## Tentative Findings

No tentative findings — every finding's premise was verified by executing the shipped script against a purpose-built fixture in the session scratchpad with the exit code and full stderr captured, by `grep` with the query and result count recorded, or by Read at a cited line at drafting time. No candidate was dropped for want of an instrument.

## Observations

- Three of the parser's 29 document diagnostics remain unstated in the contract and are recorded here rather than as L-1 instances, on the same reasoning rounds 5 and 6 applied: `duplicate step ID` (line 241 — uniqueness is definitional to an identifier), `empty list entry (stray or trailing comma)` (line 130 — entailed by "entries are single whitespace-free tokens", since an empty string is not a token), and `marker '<name>' occurs N times` (line 374 — entailed by the contract's singular framing of each generated region). Carried forward unchanged for a third round.
- The `--self-check` mode resolves the contract by a hardcoded relative path (`join(here, '..', 'references', 'output-contract.md')`, line 399) and takes no operand, while the contract's line 75 describes it as extracting "this contract's own fenced examples." The two agree in the shipped layout, and a wrong layout fails loudly (`cannot read the contract at …`), so there is no standard violation. Recorded because it is why adversarial testing of the harness required relocating the whole `scripts/` + `references/` pair rather than passing a mutated file as an argument.
- A `files:` sub-key **over**-indented relative to its siblings is still accepted, exit 0. Not a finding, for the reason round 6 gave: the line does carry the fence's own indentation, which is the only indentation property the contract specifies. Recorded again because L-3's correction should not be read as covering it.
- `SKILL.md` still contains zero references to the script, `step-decl`, `plan-elements`, the markers, or `--self-check` (grep, 0 hits), unchanged from rounds 3–6. No standard violation — the contract is a `references/` file the skill directs the author to — but it remains why the contract's completeness as a grammar specification is load-bearing, and why a divergence like L-2 has no second source that could rescue an author.
- Changelog entry 12's per-finding claims about K-2, K-3, and K-5 were each independently re-derived by execution and all three are accurate. Two of its claims do not survive re-derivation: "thirteen embedded negative cases — every stated grammar constraint must demonstrably reject its violating input" (L-1(ii)) and "K-4: a mis-indented content line yields exactly one error naming the line" (L-3, true only for top-level keys).

## What's Actually Good

- **The rework did the thing three rounds of rewording failed to do, and it survives adversarial testing.** `--self-check` is a single command with an exit code, and I confirmed by mutation — not by reading it — that it fails for the right reasons: six independent mutations of the contract's examples and of the committed fixture each produced exit 1 with a diagnostic naming the actual defect, and restoring each returned exit 0. It catches stale generated regions in the fixture, orphan specs, uncovered elements, undeclared elements, and malformed step IDs. **Standard:** honest risk disclosure with a named compensating control — the control now exists and is runnable, which is the half that was missing for three rounds. **Verified by:** 7 mutation probes on a relocated copy of `scripts/` + `references/`, exit codes and stderr captured.
- **Refactoring the pipeline into a pure `processDocument(text)` is the right structural move and is what made the self-check possible.** Parsing, cross-checking, and derivation are now a single side-effect-free function over a string (lines 87–388), with all I/O and process-exit behavior confined to the CLI block (lines 485–526). That is why the harness can validate three different document populations in-process without touching the filesystem or the exit code. **Standard:** separation of pure computation from I/O — the standard reason a validator becomes testable. **Verified by:** Read of lines 87–388 confirming no `readFileSync`/`writeFileSync`/`process.exit` inside the function, and by the harness calling it directly on synthesized strings at lines 423, 426, 435, 472.
- **The committed fixture is well-chosen: it exercises the grammar's genuinely awkward corners rather than its easy path.** `valid-plan.md` carries both an indented fence (inside a numbered list item) and a column-0 fence in the same document, a suffixed step ID (`S2a`), a real dependency edge, all three `files:` sub-key forms including a non-empty `delete:`, multi-entry lists, and both test-spec ID line forms (`- **T-1**` and `### T-2`). Those are exactly the constructs that broke in rounds 1, 4, and 6. **Standard:** fixture design — cover the boundary cases the defect history names, not the happy path. **Verified by:** Read of the fixture 1–69, cross-referenced against the constructs named in rounds 1–6; and by execution (`fixture valid-plan.md checks clean (2 steps, 3 elements, 2 specs)`).
- **K-2 and K-3 were both fixed by moving the script rather than by narrowing the contract, which is the harder and better of the two options round 6 laid out.** The §12 terminator now skips spec headings, and the anchor requires an exact title. Both were probed across the full space (four heading levels; a decoy heading) rather than at the single case reported. **Standard:** prefer the fix that preserves the documented authoring form over the one that documents around the defect. **Verified by:** 11 executed probes; Read of script lines 292 and 304–312.

## Convergence Record

**Round number:** 7 absolute; **round 1 of the restarted cycle** (matches Scope and Inventory).

**Counter restart, stated explicitly.** Round 6 fired both tripwire conditions. The tripwire's designed consequence is routing to foundational rework, and the owner authorized that rework on 2026-08-09. A tripwire that fired, was honored, and produced a structurally different artifact has discharged its function; continuing to accumulate consecutive-round counts across the rework boundary would make the tripwire unresettable and would fire it permanently regardless of the rework's quality. **Counters therefore restart here, and rounds 5 and 6 do not contribute to any consecutive-round test in this record.** The absolute trajectory is retained below for the reader, marked across the boundary.

**Trajectory (findings by severity, each from that round's mechanical verdict breakdown):**

| Round | Total | Breakdown |
|---|---|---|
| R1 | 10 | 1 Critical, 1 Systemic, 2 Serious, 4 Moderate, 2 Minor |
| R2 | 5 | 1 Systemic, 1 Serious, 1 Moderate, 2 Minor |
| R3 | 4 | 1 Systemic, 1 Serious, 2 Minor |
| R4 | 2 | 1 Systemic, 1 Serious |
| R5 | 4 | 1 Systemic, 3 Minor |
| R6 | 5 | 1 Systemic, 1 Serious, 1 Moderate, 2 Minor — **tripwire fired; rework boundary** |
| **R7** | **4** | **1 Systemic, 1 Serious, 2 Moderate** |

**Flow counts for this round** (provenance classifications from Step 9 are the source):

- **Prior findings closed: 3** — K-2 (documentation-as-contract, by 4 heading-level probes), K-3 (first-principles anchor articulation, by the decoy-heading probe), K-5 (documentation cross-reference accuracy *and* its re-derive-never-patch doctrine half, by Read of the unbounded pointer). Each closed against its originally named standard, each re-derived by execution or Read rather than accepted from changelog entry 12.
- **Recurring: 2** — K-1 recurs as L-1 (same standard, honest risk disclosure with a named compensating control; same location, the contract's description of the derivation control); K-4 recurs as L-3 (same standard, diagnostic accuracy; same function, `extractBlocks`).
- **New: 1** — L-4.
- **Regressions: 1** — L-2, introduced by the K-3 anchor fix.

**Tripwire evaluation — NOT FIRED on either condition.** Arithmetic shown:

- **Condition (a): new + regression ≥ closed, for two consecutive Post-fix rounds.**
  - **Round 7: 1 new + 1 regression = 2, against 3 closed. 2 ≥ 3 is FALSE.**
  - The condition fails on this round's own arithmetic, so no consecutive pair can form regardless of how the boundary is treated. **NOT FIRED.**
- **Condition (b): total findings not strictly decreasing, for two consecutive Post-fix rounds.**
  - Restarted cycle totals: **4.** One round exists; a consecutive pair requires two. **NOT FIRED.**
  - Noted for completeness, and because it cuts the same way: across the rework boundary the absolute totals ran 5 → 4, which *is* a strict decrease, so condition (b) would be false at round 7 even without the restart.

The substantive reading agrees with the arithmetic. The rework changed the shape of the problem rather than relocating it: for the first time in the cycle the compensating control is a command with an exit code, it demonstrably fails on divergence, and the two parser defects round 6 reported were fixed by moving the parser to meet the documented form rather than by documenting around the defect. The Systemic finding survives, but at materially reduced scope — from "the control does not exist" to "three of four sentences describing the control overstate it" — and its three closures are three bounded edits rather than a fifth attempt at the section. The one genuinely uncomfortable signal is L-2: the residue the rework was required to disclose and did not is the residue that produced this round's Serious finding, inside the same change set. That argues for completing L-1(iii) rather than for concluding the rework failed.

## Recommended Priority

**The tripwire did not fire, and the rework it mandated has substantially worked. The indicated path is one more fix round, not further foundational rework** — the four findings are bounded edits to a structure that is now sound, and there is no evidence of the churn signature (this round closed more than it opened, and closed all three of its closures against their originally named standards).

Fix in this order:

1. **L-2** — one sentence in §12 stating the heading-title constraint. It is currently blocking a conformant plan at a delivery gate, it is the cheapest fix in the set, and it is the live instance of the residue L-1(iii) is about. Fix the near-miss diagnostic alongside it if convenient, but the contract sentence is the closure.
2. **L-1** — the three bounded edits named in the finding: delete the §2 parenthetical, reconcile line 75's "every stated grammar constraint" claim with the harness (preferably by extending the harness — the 17 constraints in this review's grammar walk are already written as executable probes and each is a two-line `cases` entry), and add the parser→contract residual statement. This is the fourth round the class has been reported; the sentences are the last piece of it, and instance (i) has now survived two rounds verbatim after being reported, which is a signal to delete it rather than reword it a third time.
3. **L-3** — mirror the `filesInvalid` guard idiom for the indentation failure, and correct the inline comment at lines 99–101 to state the property the code actually has. Add a negative case for the indentation constraint while doing so; its absence from the harness is why this survived.
4. **L-4** — derive the self-check scaffold from the extracted blocks instead of hardcoding their current identifiers.

One cross-cutting note that is not itself a finding: items 2 and 3 both end in "add the missing negative case." Extending the `cases` array to cover every constraint the contract states is the single edit that closes L-1(ii) and makes L-3's class detectable in future rounds, and it is the highest-leverage work in this list.

Verdict: NEEDS FIXES (4 findings: 1 Systemic, 1 Serious, 2 Moderate)
