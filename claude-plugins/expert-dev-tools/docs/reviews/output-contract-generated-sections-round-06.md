# Expert Review — expert-plan output contract: derived sections become generated

Round 6 (Post-fix review of round 5). Reviewer: independent subagent, 2026-08-08.
Persisted by the reviewing agent; persistence is the only edit this reviewer made to the repository.

## Scope and Inventory

**Round number:** 6 (fifth Post-fix round). Prior rounds: `docs/reviews/output-contract-generated-sections-round-01.md` (NEEDS FIXES, F-1..F-10), `-round-02.md` (NEEDS FIXES, G-1..G-5), `-round-03.md` (NEEDS FIXES, H-1..H-4), `-round-04.md` (NEEDS FIXES, I-1, I-2), `-round-05.md` (NEEDS FIXES, J-1..J-4).

### Step 3 tool plan

| Claim type in scope | Instrument | Availability / disposition |
|---|---|---|
| Behavioral ("this input produces that exit code") | Execution of the script against synthetic fixtures built in the session scratchpad | Available. **34 probe runs.** Nothing in the repository working tree was executed in either mode — every run targeted a scratchpad fixture under `…/scratchpad/fx/`. Write mode was used only against scratchpad fixtures. |
| Literal-content ("line N says Z") | `Read` at the cited file:line at drafting time | Available, used throughout |
| Absence ("the contract/script contains no X") | `grep` over the named file with query and result count recorded; `ls` for directory-contents absence | Available; used for K-1(ii), K-1(iii) |
| Line-ending / byte-level claims | Programmatic CRLF vs bare-LF counting in Node | Available; used for the CRLF fixed-point probe |
| Fenced-example extraction | The contract's own blocks extracted programmatically with the parser's own regex, byte-for-byte | Available; used for the move-together rule's literal instruction |
| Structural / blast radius | CodeGraph | Not exercised — the script is a standalone entry point (`#!/usr/bin/env node`, Read line 1) whose only import is `node:fs` (Read line 66). No finding in this round makes a structural claim. |
| Library behavior | Context7 | **Not needed** — the only import is `node:fs`. No library-behavior claim category exists in this review's scope, so no Step 3 halt condition arises. |
| Claims imported from prior documents (rounds 1–5, changelog entries 6–11, HANDOFF.md) | Re-derivation from current source with the instrument the underlying claim type requires | Available; every J-1..J-4 disposition below was re-derived by execution, `grep`, or Read — none accepted from changelog entry 11 |
| Comment claims inside the artifact (script header, inline `// F-n` / `// J-n` comments) | Re-derivation from source | Available; used to confirm the header's grammar description and the J-2/J-3 comment claims against executed behavior |

No instrument class was unavailable for a load-bearing claim category. No rigor waivers — no compression was requested. Node v22.16.0 present, so the contract's Node-unavailability halt condition did not arise.

### Inventory — all four Post-fix sources

| File | Source | Status | Verification |
|---|---|---|---|
| `claude-plugins/expert-dev-tools/skills/expert-plan/scripts/derive-plan-sections.mjs` | prior inventory + fix-diff (new file) | [x] | Read 1–445 in full; all 33 diagnostic sites enumerated by `grep -nE "errors\.push\(\|fail\("` → 33 hits; executed in 34 fixture probes |
| `claude-plugins/expert-dev-tools/skills/expert-plan/references/output-contract.md` | prior inventory + fix-diff | [x] | Read 1–128 in full; full `git diff HEAD` against baseline `94a640a`; `cat -A` of lines 10–40; fenced blocks extracted programmatically → `plan-elements` **1**, `step-decl` **1**; `grep -c "hand-maintained"` → **0** |
| `claude-plugins/expert-dev-tools/docs/SKILL-CHANGELOG.md` (entries 6–11) | fix-diff | [x] | `grep -cE '^### [0-9]+ '` → **11**; all 11 headings listed; entry 11 Read in full (lines 446–467) |
| `claude-plugins/expert-dev-tools/docs/HANDOFF.md` | fix-diff | [x] | Read via `git diff HEAD` — the round-4 / dispatch-pinning / changelog-pointer paragraphs in full |
| `claude-plugins/expert-dev-tools/skills/expert-plan/SKILL.md` | prior inventory + fix-diff dependent | [x] | `grep -cE "derive-plan-sections\|step-decl\|plan-elements\|generated:"` → **0 hits** (unchanged from rounds 3–5) |
| `claude-plugins/expert-dev-tools/docs/plans/plan-expert-dev-tools-behavioral-remediation.md` | prior inventory | [x] | `grep -cE "step-decl\|generated:"` → **0 hits** — no retrofit; Applicability rule honored. Modified in the working tree by the separate concurrent correction thread; out of this change's scope. |
| `claude-plugins/expert-dev-tools/skills/expert-plan/scripts/` (directory) | fix-diff | [x] | `ls` → single entry `derive-plan-sections.mjs`; no checked-in fixture (load-bearing for K-1(ii)) |
| `claude-plugins/expert-dev-tools/docs/reviews/output-contract-generated-sections-round-05.md` | prior review record | [x] | Read 1–183 in full |
| `git show 94a640a:…/output-contract.md` (baseline) | prior inventory | [x] | Read via `git diff HEAD` against it |
| J-1, J-2, J-3, J-4 as closure items | prior findings | [x] | Each re-derived from current source by execution or grep; dispositions in the table below |

**Fix-diff dependents.** The script has no importers (standalone entry point, `node:fs` only). The contract's only in-repo dependent is `SKILL.md` (grep above, 0 hits). Both covered.

**Procedural observation.** `collaborativereasoning` was again rejected on its first call with a schema-validation error on the persona `communication.style` / `.tone` enums, and succeeded on the second call with corrected values. **This is the fifth consecutive round to record this same infrastructure failure.** The multi-perspective check ran as designed on the successful call, with the standards-discipline, downstream-consumer, and implementer personas. `metacognitivemonitoring` was invoked at the evaluation stage, after the inventory and verification phase and before any finding was drafted into this record — stated plainly because the skill places it at review start.

## Summary

**This review returns NEEDS FIXES.** Round 5's two script-level findings are genuinely and verifiably closed, and the parser→contract direction of the move-together rule closed for real this round — I walked all 33 of the script's diagnostic sites against the contract text and every grammar constraint the parser enforces is now stated, which is the first time in six rounds that has been true. What blocks the verdict is that the contract→parser direction is not clean and was never actually walked, despite changelog entry 11 heading itself "spec sweep completed both directions." The same change set that claims the completed sweep introduced a §12 authoring form — the `### T-<id>` heading — that the parser rejects outright whenever §12's own heading sits at level 3 or 4, failing a conformant plan with three diagnostics that all name the wrong defect. Alongside it, the class-closure item that has now been carried for three rounds was again answered with rule text rather than an executable: there is still no `--self-check` mode and no checked-in fixture, and the new parenthetical the contract added to describe the control makes a claim about that control which is false when executed. **Both non-convergence tripwire conditions fired this round**, with the arithmetic shown in the Convergence Record.

## Upstream Contract Verification

No formal spec or architecture document governs this change. The binding upstream artifacts are the owner ruling in `docs/HANDOFF.md`, the prior contract's stated closure condition, and rounds 1–5's findings.

| Upstream requirement | Status | Verification method |
|---|---|---|
| Owner ruling: the drift surfaces "have to be converted, not swept harder" | Honored for the generated surfaces; **not honored for the contract↔script relationship** | Read the contract: §2 and §5 are generated regions written only by the script; probed — a hand-edited region is reported `STALE` and regenerated. But the rule governing the contract↔script relationship was again swept harder rather than converted — see K-1. |
| "a machine-readable step declaration … from which §2, §5 and §12 are generated" | Honored, with disclosed narrowing | Read the "Generated — written only by the script" paragraph: §12 is cross-checked rather than generated, narrowing and reason stated. Closed at round 2; unchanged. |
| Owner authorization dated 2026-08-08 | Present | Read `SKILL-CHANGELOG.md` entry 6, quoted authorization |
| Applicability rule: the in-flight plan is not retrofitted mid-cycle | Honored | `grep -cE "step-decl\|generated:"` over `docs/plans/plan-expert-dev-tools-behavioral-remediation.md` → **0 hits**; HANDOFF.md's dispatch pin at `94a640a` present |
| Round 5 verdict NEEDS FIXES — all four findings remediated | **Partly met** | J-2 and J-3 closed by execution; J-1 recurs as K-1; J-4 recurs as K-5 — dispositions below |

### Round-5 finding dispositions

Each re-derived from current source by execution, `grep`, or Read. Changelog entry 11's claims were treated as author claims inside the artifact, not as verification.

| # | Disposition | Verification (executed or grep'd, never accepted from the changelog) |
|---|---|---|
| **J-1(a)** parser enforces the three-`files:`-sub-key requirement; contract silent | **Closed** | Read contract §7 grammar paragraph: "The `files:` key takes **no inline value** and is followed by indented `create:`, `modify:`, and `delete:` lines — **all three present, each exactly once, `[]` when empty**; an omitted or repeated sub-key is an error, never an implicit empty." Executed the matching parser behavior: deleting the `delete: []` line → `ERROR: … files: block missing sub-key 'delete' (declare it explicitly, [] if empty)`, exit 1. Contract and parser now agree. |
| **J-1(b)** duplicate `files:` sub-key rejected; contract silent | **Closed** | Same contract sentence ("each exactly once … or repeated sub-key is an error"). Executed: a repeated `delete: []` → `ERROR: … duplicate files sub-key 'delete'`, exit 1, single diagnostic. |
| **J-1(c)** the move-together rule names a `plan-elements` example that does not exist, and the instruction is not executable | **Partly closed — recurs as K-1** | The missing artifact was added: a fenced ` ```plan-elements ` block now exists in §2, extracted programmatically → 1 block, indent `"    "`, body `elements: [R-1, R-3, Q-1]`. The executability half was not closed. Evidence in K-1. |
| **J-1** class closure (make the control executable; state the residual honestly) | **NOT closed — recurs as K-1** | `grep -c "self-check"` over the script → **0**; `ls scripts/` → single entry, no fixture; `grep -c "hand-maintained"` over the contract → **0**. The move-together bullet is textually unchanged from the state round 5 quoted. |
| **J-2** (Minor, regression) inline `files:` value produces three false missing-sub-key diagnostics | **Closed** | Executed on an LF baseline fixture: `files: {create: [], modify: [a.js], delete: []}` → **exactly one** error (`'files:' takes no inline value …`), exit 1. Round 5 measured four errors on the same shape. Read lines 233–239 and 262 confirms the `filesInvalid` guard gating the sub-key loop. |
| **J-3** (Minor, new) lines not carrying the fence indentation silently accepted | **Closed**, with a side-effect reported as K-4 | Executed: a top-level key de-indented to column 0 inside a four-space block → `ERROR: step-decl block at line 26: content line does not carry the fence's indentation: covers: [R-3]`, exit 1; a `files:` sub-key moved from six spaces to two → the same error, exit 1. Round 5 measured exit 0 on both. Read lines 116–120 confirms the check. |
| **J-4** (Minor) HANDOFF.md points at "entries 6–7" for a revision recorded in more entries | **Factually corrected; recurs as K-5 against its named standard** | Read the paragraph via `git diff HEAD`: now "entries 6–11". `grep -cE '^### [0-9]+ '` over the changelog → **11**, so the pointer is accurate today. The correction was the hand re-enumeration round 5 explicitly identified as resetting the clock rather than closing the class. Evidence in K-5. |

### Regression probes (rounds 1–4 behaviors the round-5 edits could have disturbed)

All executed against scratchpad fixtures built from the contract's own verbatim examples plus minimal scaffolding.

- **F-1 CRLF / LF fixed point:** LF baseline → regenerate `no changes: regions already current (3 steps)` exit 0, `--check` `OK: 3 steps, 3 elements, 3 test specs, regions current` exit 0, byte count **0 CRLF / 65 bare LF**. CRLF baseline → same messages, exit 0, byte count **65 CRLF / 0 bare LF**. Both fixed points hold.
- **F-8 `$` literal in derived content:** a declared path `src/a$&b$1c.js` renders verbatim in the generated table (`| src/a$&b$1c.js | modify | S12 |`), regenerate and `--check` both exit 0. The replacer-function form still prevents `$`-pattern expansion.
- **G-2(d) acyclicity:** self-dependency (`depends_on: [S12]` on S12) → `dependency cycle involving steps S12 and S12`, exit 1; two-node cycle S11↔S12 → `dependency cycle involving steps S11 and S12`, exit 1.
- **G-2(c) duplicate list entry:** `covers: [R-3, R-3]` → `duplicate entry 'R-3'`, exit 1.
- **H-4 single-diagnostic behavior at the vocabulary site:** `elements: []` → the one intended error, exit 1; `elements: [R-1, R-3, Q-1] # note` → the parse error alone, without a spurious empty-vocabulary claim, exit 1.
- **Grammar rejections asserted by the contract:** block sequence (`- R-3`) rejected; flow mapping rejected; quoted entry (`["T-9"]`) rejected; trailing comma (`[R-3,]`) rejected; unknown key rejected; whitespace-bearing entry rejected. All exit 1.
- **Generated-region correctness:** the coverage and files tables render with the expected rows and locale-pinned numeric-aware ordering (`Q-1 | S13`, `R-1 | S11`, `R-3 | S12`).

## Critical & Serious Findings

### K-2 (Serious, new) — §12's documented `### T-<id>` heading form is rejected by the parser whenever §12's own heading is at level 3 or 4

**What the code does.** The Test-specifications scan (script lines 330–344) anchors on `/^(#{1,4})\s+.*Test specifications.*$/im`, takes that heading's level, and bounds the section with `new RegExp('^#{1,' + level + '}\\s', 'm')` — the next heading of the same or shallower level ends it. A specification written in the contract's own documented heading form, `### T-9`, is itself a level-3 heading. When §12's heading is at level 3 or 4, the first specification heading therefore terminates the section before any specification is scanned, and every `tests:` reference is reported unresolvable.

**How that claim was verified.** Read of script lines 330–344 at drafting time, plus four executed probes on otherwise-identical fixtures:

| §12 heading level | Spec form | Result |
|---|---|---|
| `#### 12. Test specifications` (4) | `### T-9` … | exit 1 — three `references test T-…, which has no specification` errors |
| `### 12. Test specifications` (3) | `### T-9` … | exit 1 — same three errors |
| `## 12. Test specifications` (2) | `### T-9` … | exit 0 — `OK: 3 steps, 3 elements, 3 test specs` |
| `# 12. Test specifications` (1) | `### T-9` … | exit 0 |
| `### 12. Test specifications` (3) | `- **T-9** …` | exit 0 |

**Standard violated.** **Documentation-as-contract** — the same standard round 3's H-2, round 4's I-2, and round 5's J-1(a) were all decided under. The contract states without qualification, in §12: "Each specification's ID line begins `- **T-<id>**` (or a heading `### T-<id>`) — that is the form the derivation script recognizes." Half of that stated form is unusable at two of the four heading depths the parser itself accepts for the section, and no contract text warns of the interaction. This is the contract→parser direction of exactly the divergence the move-together rule exists to prevent, and the sentence in question was **added by this change set** (it appears as an addition in `git diff HEAD` against `94a640a`), so the rule had jurisdiction over it and the sweep that changelog entry 11 titles "spec sweep completed both directions" did not reach it.

**Why it matters beyond the inconvenience.** The gate is delivery-blocking (Gate C: "`--check` exits 0 against the delivered document"), and the three diagnostics all misdirect: they assert the specifications are missing when the specifications are present, in the prescribed form, a few lines below the anchor. An author following the contract literally is told to fix the one thing that is not wrong.

**What correct implementation looks like.** **The script moves** — the contract's stated form is the reasonable one and the parser should honor it. Bound the section on the next heading of the same-or-shallower level **that is not itself a `T-<id>` specification heading**: compute the terminator with the existing level logic, then skip candidate terminators whose text matches `^#{1,6}\s+T-[A-Za-z0-9._-]+`. Alternatively, if the parser is to keep its current bounds, **the contract moves** and §12 must state the constraint explicitly — that the `### T-<id>` form requires §12's own heading to be at level 1 or 2 — but that is the weaker fix, because it makes a document-structure choice that has nothing to do with test specifications into a silent precondition of the gate.

## Systemic Patterns

### K-1 (Systemic, recurring — J-1, third consecutive round) — the move-together rule's mechanical half is still prose, and the contract now states a claim about that control which is false when executed

**The pattern.** Round 4 (I-2) asked for the contract↔script reconciliation to be bound in both directions and for its example half to be made mechanical. Round 5 (J-1) found the rule text written and its effect absent, and specified the closure precisely: *"take the mechanical form, not the reworded-rule form … add a `--self-check <contract.md>` mode (or a checked-in fixture in `scripts/` run by name) so that 'the contract's examples parse clean' is a command that exits non-zero rather than an instruction someone remembers to follow. Rewriting the bullet again, without an executable behind it, reproduces exactly what this round found."* This round the reworded-rule form was taken again, and it reproduced exactly what round 5 predicted.

**Proactive scan.** The pattern's signature is "a compensating control the contract names, where the control is prose with no executable behind it, or where the contract's description of the control is not true of the control." I enumerated the contract's compensating-control claims by reading the "Derived sections are generated" section and Gate C in full, and I enumerated every constraint the parser enforces by walking all diagnostic sites (`grep -nE "errors\.push\(|fail\("` over the script → **33 hits**, of which 3 are CLI-usage diagnostics and 30 are document/grammar diagnostics). **All 30 document diagnostics were checked against the contract text in the parser→contract direction; 27 are stated, and the 3 that are not are recorded in Observations as definitional or marginal rather than as instances.** That direction is materially clean and is genuine progress. The three instances below are all in the contract→parser and control-honesty directions.

| # | Claim or control | Contract text | Reality | Verification |
|---|---|---|---|---|
| i | "pasting both into one scratch fixture per the move-together rule checks clean once every element is covered" (§2 parenthetical) | Asserts the paste checks clean | **False as written.** Both blocks extracted byte-for-byte with the parser's own regex into a fixture with full scaffolding and *every* element covered → `--check` exit 1, `STALE: regions out of date: coverage, files`. Exit 0 is reachable only by regenerating first, which the instruction never mentions. A bare verbatim paste of the two blocks alone → exit 1 with **7** errors (undeclared step `S11`, uncovered `R-1` and `Q-1`, no Test-specifications heading, unresolvable `T-9`, both marker pairs missing). | Programmatic extraction + 3 executed fixtures (`A-literal-paste`, `B-paste-plus-scaffold`, `C-all-elements-covered`) |
| ii | "the contract's examples parse clean" as a delivery control | The move-together bullet instructs an ad-hoc scratch fixture | No executable exists. `grep -c "self-check"` over the script → **0**. `ls skills/expert-plan/scripts/` → **one entry**, `derive-plan-sections.mjs`; no checked-in fixture. | grep with count; `ls` |
| iii | Residual honesty for the parser→contract direction | Round 5 required the bullet to state plainly that this direction is hand-maintained, with the diagnostic list as the enumeration to walk | Absent. `grep -c "hand-maintained"` over the contract → **0**; the bullet is textually unchanged from the form round 5 quoted. | grep with count; Read of the bullet at contract line 75 |

Instance (i) deserves emphasis because it is not merely an unbuilt control but an **inaccurate description of a control**, newly added by this change set. The parenthetical was written to make the round-5 finding go away, and it asserts a property that a two-minute execution disproves.

**Standard violated.** **Honest risk disclosure with a named compensating control** — the standard round 3's H-1 was decided under, and the standard round 5 applied to J-1(c). A control cited as the guarantee must exist and must be runnable, and the specification's description of it must be true. This is now the **fourth** distinct appearance of that shape in this change set (H-1's delivery-time diff check; J-1(c); and instances (i) and (iii) here). Secondarily, **documentation-as-contract** for instance (i), since the parenthetical is the text an author would rely on.

**Why systemic rather than isolated.** Not the count — the cause, and its trajectory. Across six rounds the same defect has been relocated rather than removed: fail-open validation in the parser (R1, R2) → the contract's documentation sweep (R3) → the one-directional contract↔script reconciliation (R4) → the rule governing that reconciliation (R5) → **the contract's description of that rule** (R6). At every relocation the chosen mitigation has been a stronger hand-maintenance obligation, which is the move the owner explicitly ruled against ("converted, not swept harder"). Round 5 named the outcome in advance and named the fix; the fix was not built, and K-2 is what the unbuilt control failed to catch — a contract assertion added in the same edit that claimed the sweep was complete.

**What correct implementation looks like.** Per the Convergence Record below, both tripwire conditions fired, so the indicated path is foundational rework rather than another instance-by-instance correction. Within that rework, the durable shape remains the one round 5 specified and this round did not build: a single command that fails when contract and parser disagree — `--self-check <contract.md>` extracting every fenced `step-decl` / `plan-elements` block from the contract, synthesizing the scaffolding those blocks require (markers, a Test-specifications section declaring the referenced test IDs, the steps the `depends_on` entries name, steps covering the declared vocabulary), regenerating, then checking. That subsumes instance (i) entirely and would have caught round 4's I-1 at the moment the example was written. It does **not** cover the parser→contract direction, which is why instance (iii)'s residual statement is part of the closure and not a nicety.

## Moderate & Minor Findings

### K-3 (Moderate, new) — the Test-specifications anchor is the first heading anywhere in the document whose text contains the phrase, so an unrelated earlier heading captures the scan

**What the code does.** `secHeadRe` (script line 330) is `/^(#{1,4})\s+.*Test specifications.*$/im` and is applied to the whole document with `.exec`, taking the **first** match. Any earlier heading at levels 1–4 containing the phrase in any case — a table of contents entry, a §7 step heading discussing test specifications, a "Notes on Test specifications" aside — becomes the anchor, and the real §12 is never scanned.

**How that claim was verified.** Read of script lines 330–341 at drafting time, plus execution: prepending `## Notes on Test specifications` with one line of body to an otherwise-passing fixture → exit 1 with three `references test T-…, which has no specification in the Test specifications section` errors, on a document whose §12 is unchanged and complete.

**Standard violated.** No published standard maps cleanly here, so this is a **marked first-principles articulation**: the goal the code serves is to locate one specific document section so that references into it can be checked; the shortcut it takes is to identify that section by an unqualified substring match on the first candidate heading; the shortcut fails the goal because the phrase is ordinary prose that a plan document is likely to use about itself, and when it fails, the failure is silent about its own cause — the emitted diagnostics accuse the specifications of being absent rather than reporting that the section could not be located. A validator that misidentifies its input and then blames the input is worse than one that refuses to run.

**Correct implementation.** **The script moves.** Prefer an anchor whose heading text is the section title rather than merely contains it — match `^#{1,4}\s+(?:\d+\.\s*)?Test specifications\s*$` first, and fall back to the current loose match only if that finds nothing. If more than one candidate matches, that is an error naming both line numbers, not a silent selection of the first: a document with two plausible §12 anchors is one the validator cannot faithfully process, which is the same posture G-1 established for ambiguous region markers.

### K-4 (Minor, regression) — the round-5 indentation check reports the offending line and then lets it cascade into three further diagnostics, one of them false

**What the code does.** In `extractBlocks`, a content line lacking the fence's indentation pushes the indentation error and then **returns the line unmodified** (script lines 117–120: `errors.push(...); return l;`). The raw line flows into the step-declaration parser, where it matches neither the top-level key branch (it begins with whitespace) nor the `files:` sub-key branch, so it is reported `unparseable`, and its key is then reported missing.

**How that claim was verified.** Read of lines 116–120 and 215–256 at drafting time, plus execution: replacing the four-space indent on `tests: [T-9]` with a tab produced **four** diagnostics —

```
ERROR: step-decl block at line 26: content line does not carry the fence's indentation: tests: [T-9]
ERROR: step-decl at line 26: unparseable line: tests: [T-9]
ERROR: step-decl at line 26: missing required key 'tests'
ERROR: test T-9 is specified but no step references it — orphan spec or missing tests: entry
```

The third is false on its face: the author demonstrably wrote `tests:`.

**Standard violated.** **Diagnostic accuracy** — precisely the standard round 3's H-4 was decided under ("a parse failure has its own error and must not also claim the author wrote `elements: []`") and round 5's J-2 was decided under at the `files:` site. This is the **third site** at which this class has appeared, and it was introduced by the correction that closed the second. Provenance is regression: the cascade did not exist before the J-3 fix, because before it the line was silently accepted.

**Correct implementation.** Mirror the guard the other two sites use. Mark the block as structurally invalid when any content line fails the indentation check, and suppress the downstream per-line and missing-key diagnostics for that block — the author gets the one error that describes what they actually did, as H-4 and J-2 both established.

### K-5 (Minor, recurring — J-4) — HANDOFF.md's changelog pointer was re-enumerated by hand rather than made unbounded

**What the document says.** The dispatch-pinning paragraph now reads: "the working-tree contract has since been revised (generated-regions regime, `docs/SKILL-CHANGELOG.md` entries 6–11)". Verified by Read via `git diff HEAD`. The count is accurate today — `grep -cE '^### [0-9]+ '` over the changelog → **11**.

**Standard violated.** J-4's originally named standard had two halves: documentation cross-reference accuracy, **and this project's re-derive-never-patch doctrine applied to a hand-maintained enumeration**. The accuracy half is satisfied; the doctrine half is not. Round 5's correction was explicit that the enumeration itself is the defect — *"Replace the enumerated range with an unbounded reference … Enumerating a growing list by hand is the failure; widening the enumeration by two would only reset the clock."* Widening the enumeration by four is what was done. Under Gate A, closure against the accuracy half alone is closure against an adjacent standard, not against the standard named. Provenance: recurring — same standard, same location.

**Correct implementation.** "recorded in `docs/SKILL-CHANGELOG.md`, entries 6 onward" — a reference that cannot go stale as entries accrue.

## Tentative Findings

No tentative findings — every finding's premise was verified by executing the script against a purpose-built fixture in the session scratchpad with the exit code and full stderr captured, by `grep` or `ls` with the query and result count recorded, or by Read at a cited line at drafting time. No candidate was dropped for want of an instrument.

## Observations

- Three of the parser's 30 document diagnostics remain unstated in the contract, recorded here rather than as K-1 instances because each is definitional or marginal rather than a grammar rule an author could violate unknowingly: `duplicate step ID` (script line 278 — uniqueness is definitional to an identifier; carried forward unchanged from round 5's identical observation), `empty list entry (stray or trailing comma)` (line 148 — arguably entailed by "entries are single whitespace-free tokens", since an empty string is not a token), and `marker '<name>' occurs N times` (line 406 — arguably entailed by the contract's singular framing of each generated region). They are the kind of entry a diagnostic-list walk surfaces, which is why K-1's closure names that list as the enumeration.
- A `files:` sub-key **over**-indented relative to its siblings (eight spaces where the block uses six) is accepted, exit 0. This is not a finding: the line does carry the fence's own indentation, which is the only indentation property the contract specifies, and the contract asks the sub-keys to be "indented" without fixing a depth. Recorded because the round-5 J-3 correction might be read as covering it, and it does not.
- `SKILL.md` still contains zero references to the script, `step-decl`, `plan-elements`, or the markers (grep, 0 hits), unchanged from rounds 3–5. No standard violation — the contract is a `references/` file the skill directs the author to — but it remains why the contract's completeness as a grammar specification is load-bearing, and why a divergence like K-2 has no second source that could rescue an author.
- Changelog entry 11's per-finding claims about J-2 and J-3 were each independently re-derived by execution and both are accurate. Its heading claim — "spec sweep completed both directions" — is the one that does not survive re-derivation, and K-2 is the artifact it missed.

## What's Actually Good

- **The parser→contract direction of the move-together rule genuinely closed, and closed by the expensive route.** All 30 document-level diagnostics were walked against the contract text; 27 are now stated, and the three that are not are marginal by the reasoning recorded in Observations. Round 5 found three real gaps in this direction; this round found zero new ones. The `files:` sub-key sentence added to §7 states both the requirement and the at-most-once rule in the same clause where an author is already reading the grammar, rather than in a footnote. **Standard:** documentation-as-contract, satisfied in the direction that is hardest to satisfy because no mechanism can detect its violations. **Verified by:** the full diagnostic-site enumeration (`grep -nE "errors\.push\(|fail\("` → 33 hits) checked item-by-item against Read of the contract's §2, §7, workflow bullets, and Gate C.
- **J-2's fix is the minimal correct one and it generalizes the guard rather than special-casing the symptom.** `filesInvalid` is set at the point of rejection and tested at the sub-key loop — the same shape as H-4's `errsBefore` guard, which means the codebase now has one recognizable idiom for "do not pile diagnostics on top of a rejection" rather than two ad-hoc ones. **Standard:** diagnostic accuracy, and consistency of error-handling idiom within a module. **Verified by:** execution (one error where round 5 measured four) plus Read of lines 233–239 and 262.
- **The generated mechanism itself is sound under every probe I could construct, including the ones designed to break it.** LF and CRLF documents are both fixed points; `$&` and `$1` inside a declared path survive into the rendered table verbatim; self-dependencies and multi-node cycles are both caught; duplicate list entries, quoted entries, flow mappings, block sequences, trailing commas, and unknown keys are all rejected; the contract's own four-space-indented example parses and regenerates correctly at depth. Nothing found this round threatens the correctness of the generated tables. **Standard:** fail-closed validation, and idempotence of a generator over its own output. **Verified by:** 34 executed probes with exit codes and stderr captured, plus byte-level CRLF/LF counts on both baselines.

## Convergence Record

**Round number:** 6 (fifth Post-fix round; matches Scope and Inventory).

**Trajectory (findings by severity, each from that round's mechanical verdict breakdown):**

| Round | Total | Breakdown |
|---|---|---|
| R1 | 10 | 1 Critical, 1 Systemic, 2 Serious, 4 Moderate, 2 Minor |
| R2 | 5 | 1 Systemic, 1 Serious, 1 Moderate, 2 Minor |
| R3 | 4 | 1 Systemic, 1 Serious, 2 Minor |
| R4 | 2 | 1 Systemic, 1 Serious |
| R5 | 4 | 1 Systemic, 3 Minor |
| **R6** | **5** | **1 Systemic, 1 Serious, 1 Moderate, 2 Minor** |

**Flow counts for this round** (provenance classifications from Step 9 are the source):

- **Prior findings closed: 2** — J-2 and J-3, each closed against its originally named standard (diagnostic accuracy; fail-closed validation) and each re-derived by execution rather than accepted from changelog entry 11.
- **Recurring: 2** — J-1 recurs as K-1 (same standard, honest risk disclosure with a named compensating control; same location, the contract↔script relationship); J-4 recurs as K-5 (same standard's doctrine half, same location).
- **New: 2** — K-2, K-3.
- **Regressions: 1** — K-4, introduced by the round-5 J-3 correction.

**Tripwire evaluation — FIRED on both conditions.** Arithmetic shown:

- **Condition (a): new + regression ≥ closed, for two consecutive Post-fix rounds.**
  - **Round 6: 2 new + 1 regression = 3, against 2 closed. 3 ≥ 2 is TRUE.**
  - **Round 5: 2 new + 1 regression = 3, against 1 closed. 3 ≥ 1 is TRUE.**
  - Two consecutive Post-fix rounds hold the condition. **FIRED.** (For completeness: R4 was 2 + 0 = 2 against 4 closed, false; R3 was 3 + 0 = 3 against 4, false; R2 was 4 + 0 = 4 against 9, false.)
- **Condition (b): total findings not strictly decreasing, for two consecutive Post-fix rounds.**
  - Totals: **10 → 5 → 4 → 2 → 4 → 5.**
  - **Round 5: 2 → 4 is not a strict decrease. TRUE.**
  - **Round 6: 4 → 5 is not a strict decrease. TRUE.**
  - Two consecutive Post-fix rounds hold the condition. **FIRED.**

Round 5 recorded both conditions as armed for the first time in the cycle and stated the threshold explicitly: *"if round 6 does not close J-1 as a class — with the executable check in place, not another rule revision — and does not come in below four findings, the tripwire fires on both conditions simultaneously."* Neither antecedent was met. J-1 was answered with rule text and a parenthetical rather than an executable, and the round came in at five.

The substantive reading agrees with the arithmetic rather than softening it, and the honest version of it includes the countervailing evidence. Real progress was made this round: the parser→contract direction closed for the first time in six rounds, two findings closed cleanly by execution, and the mechanism's output correctness survived every probe. But the Systemic finding has not moved upstream since round 4 — it has relocated in place twice, from the rule to the rule's description of itself — and the class this cycle keeps returning to (a compensating control that is prose rather than a command) has now produced a defect, K-2, of exactly the kind the unbuilt control was specified to catch. That is the field-documented signature of a foundational problem being patched: each round's correction closes its named instances and reopens the class one site over.

## Recommended Priority

**The tripwire fired on both conditions, so the indicated path is foundational rework of the contract↔script specification relationship — not a seventh fix round.** Re-read the sources, re-derive the approach, and do not carry the failed attempt forward. Concretely, what "do not carry forward" means here: the accumulated prose obligations in the "Derived sections are generated" section — the move-together bullet, its bidirectional extension, and the §2 parenthetical describing the paste check — are the failed attempt. Rewriting them a fourth time is the move that has now failed three times running, and each rewrite has itself introduced the next round's finding.

The rework should re-derive from the question the change set started with: *what guarantees that the specification an author reads and the parser that gates their work describe the same grammar?* Two answers exist, they are not interchangeable, and the failure across rounds 4–6 has been to keep choosing prose for the half where an executable is available:

1. **Contract → parser: mechanizable, and must be mechanized.** Every assertion the contract makes about the grammar — including its fenced examples and the §12 ID forms — should be checked by running the parser. A `--self-check <contract.md>` mode that extracts the contract's fenced blocks, synthesizes the scaffolding they require, regenerates, and checks would subsume K-1(i), K-1(ii), and round 4's I-1. K-2 additionally argues for making the §12 ID forms machine-checked rather than merely described, since that is the assertion that broke this round.
2. **Parser → contract: not mechanizable, and must be named as residual.** No mechanism proposed in six rounds detects a constraint the parser enforces and the contract never mentions. This direction closed by hand this round, which shows the hand method can work when actually run; the rework should state plainly that it is hand-maintained, name the script's diagnostic list as the enumeration to walk, and stop implying a guarantee that does not exist. Claiming otherwise would be the fifth instance of H-1's shape.

The individual findings should be carried into that rework as inputs rather than as a punch list, but two of them are independent of it and can be fixed on their own terms because they are defects in the parser rather than in the specification relationship: **K-2** and **K-3** (both are the §12 section-bounds logic, both are a few lines, and K-2 currently makes a documented authoring form unusable) and **K-4** (the guard idiom already exists twice in the file). **K-5** is one sentence in HANDOFF.md and should be made unbounded rather than re-enumerated a third time.

Verdict: NEEDS FIXES (5 findings: 1 Systemic, 1 Serious, 1 Moderate, 2 Minor)
