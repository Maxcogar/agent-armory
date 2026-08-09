# Expert Review — expert-plan output contract: derived sections become generated

Round 5 (Post-fix review of round 4). Reviewer: independent subagent, no prior context on this work, 2026-08-08.
Persisted by the reviewing agent; persistence is the only edit.

## Scope and Inventory

**Round number:** 5. Prior rounds: `docs/reviews/output-contract-generated-sections-round-01.md` (NEEDS FIXES, F-1..F-10), `-round-02.md` (NEEDS FIXES, G-1..G-5), `-round-03.md` (NEEDS FIXES, H-1..H-4), `-round-04.md` (NEEDS FIXES, I-1, I-2).

### Step 3 tool plan

| Claim type in scope | Instrument | Availability / disposition |
|---|---|---|
| Behavioral ("this input produces that exit code") | Execution of the script against synthetic fixtures in the session scratchpad | Available. Eleven probes run. **Nothing in the repository working tree was run in either mode** — every run targeted a scratchpad fixture under `…/scratchpad/fx/` (`prose.md`, `crlf.md`, `indel.md`, `nosub.md`, `ragged.md`, `subragged.md`, `inline.md`, `alone.md`, `sz.md`). |
| Literal-content ("line N says Z") | `Read` at the cited file:line at drafting time | Available, used throughout |
| Absence ("the contract contains no X") | `grep` over the named file, query and result count recorded | Available; used for J-1(a) and J-1(b) |
| Whitespace / indentation claims | `cat -A` byte display, plus programmatic extraction of the fence indent | Available; used to establish the contract example's four-space indent |
| Line-ending claims | Byte-level CRLF / bare-LF counts via Python | Available; used for the CRLF regression probe |
| Structural / blast radius | CodeGraph | Not exercised — the script is a standalone entry point with no importers (`#!/usr/bin/env node`, Read line 1; its only import is `node:fs`, Read line 66). No finding in this round makes a structural claim. |
| Library behavior | Context7 | **Not needed** — the script's only import is `node:fs`. There is no library-behavior claim category in this review's scope, so no Step 3 halt condition arises. |
| Claims imported from prior documents (rounds 1–4, changelog entries 6–10, HANDOFF.md) | Re-derivation from current source with the instrument the underlying claim type requires | Available; every I-1 / I-2 disposition below was re-derived by execution or grep — never accepted from changelog entry 10 |
| Comment claims inside the artifact (script header, inline comments) | Re-derivation from source | Available; used to confirm the header's indent-stripping description matches `extractBlocks` behavior |

No instrument class was unavailable for a load-bearing claim category. No rigor waivers — no compression was requested. Node v22.16.0 present, so the contract's Node-unavailability halt condition did not arise.

### Inventory — all four Post-fix sources

| File | Source | Status | Verification |
|---|---|---|---|
| `claude-plugins/expert-dev-tools/skills/expert-plan/scripts/derive-plan-sections.mjs` | prior inventory + fix-diff | [x] | Read 1–432 in full; executed in 11 fixture probes |
| `claude-plugins/expert-dev-tools/skills/expert-plan/references/output-contract.md` | prior inventory + fix-diff | [x] | Read via full `git diff HEAD`; §2, §7 grammar paragraph, workflow bullets, and Gate C read at line; `cat -A` of lines 1–40; `grep -cE '^\s*\x60\x60\x60plan-elements'` → **0**, `'^\s*\x60\x60\x60step-decl'` → **1**; `grep -inE 'sub-key\|create:\|modify:\|delete:\|explicitly'` → 5 hits, only lines 23–25 inside §7 (the example) |
| `claude-plugins/expert-dev-tools/docs/SKILL-CHANGELOG.md` (entries 6–10) | fix-diff | [x] | Read via `git diff HEAD`, full entries 6–10; `grep -cE '^### [0-9]+ '` → **10** entries; entries 9 and 10 both located at lines 392 and 422 and both name `output-contract.md` |
| `claude-plugins/expert-dev-tools/docs/HANDOFF.md` | fix-diff | [x] | Read via `git diff HEAD` — the round-4 / dispatch-pinning paragraphs in full |
| `claude-plugins/expert-dev-tools/skills/expert-plan/SKILL.md` | prior inventory + fix-diff dependent | [x] | Grep `derive-plan-sections\|step-decl\|plan-elements\|generated:` → **0 hits** (unchanged from rounds 3 and 4) |
| `claude-plugins/expert-dev-tools/docs/plans/plan-expert-dev-tools-behavioral-remediation.md` | prior inventory | [x] | Grep `step-decl\|generated:` → **0 hits** — no retrofit performed, Applicability rule honored. Modified in the working tree by the separate concurrent correction thread; out of this change's scope. |
| `claude-plugins/expert-dev-tools/docs/reviews/output-contract-generated-sections-round-04.md` | prior review record | [x] | Read 1–176 in full |
| `git show 94a640a:…/output-contract.md` (baseline) | prior inventory | [x] | Read via `git diff HEAD` against it |
| I-1, I-2 as closure items | prior findings | [x] | Each re-derived from current source by execution; dispositions in the table below |

Fix-diff dependents: the script has no importers; the contract's only in-repo dependents are `SKILL.md` (grep above, 0 hits) and the three mirror copies, which rounds 3 and 4 established carry no `scripts/` directory and an older revision. Both covered.

Procedural note: `collaborativereasoning` was again rejected on its first call with a schema-validation error on the persona `communication.style` / `.tone` enums, and succeeded on the second call with corrected values. **This is the fourth consecutive round to record this same infrastructure failure.** The multi-perspective check ran as designed on the successful call, with the standards-discipline, downstream-consumer, and implementer personas.

## Summary

**This review returns NEEDS FIXES.** The round-4 correction to the parser is genuinely good and genuinely closes the finding that mattered most: indented `step-decl` and `plan-elements` fences now parse, the contract's own four-space-indented example — extracted verbatim and dropped into a realistic prose plan whose steps sit inside a numbered section 7 — regenerates and passes `--check` cleanly, on both LF and CRLF documents, and the two remaining I-2 instances are fixed on the sides round 4 named. What blocks the verdict is that the class-closure item — the bidirectional "this contract and the script move together" rule, which round 4 identified as "the part that determines whether round 5 is clean" — was violated by the same edit that installed it. The edit added two new parser-enforced constraints (all three `files:` sub-keys required; a duplicate sub-key rejected) and wrote no contract text for either, which is round 3's H-2 recurring at the same standard one round after it was closed. The rule's mechanical half is also not executable as written: it instructs pasting "the contract's own `step-decl` and `plan-elements` examples" into a fixture, and the contract contains zero fenced `plan-elements` examples. Three smaller defects sit alongside it, two of them side-effects of the round-4 edits.

## Upstream Contract Verification

No formal spec or architecture document governs this change. The binding upstream artifacts are the owner ruling in `docs/HANDOFF.md`, the prior contract's stated closure condition, and rounds 1–4's findings.

| Upstream requirement | Status | Verification method |
|---|---|---|
| Owner ruling: the drift surfaces "have to be converted, not swept harder" | Honored | Read the contract: §2 and §5 are generated regions written only by the script; probed — a hand-edited region is reported `STALE` and regenerated |
| "a machine-readable step declaration … from which §2, §5 and §12 are generated" | Honored, with disclosed narrowing | Read the "Generated — written only by the script" paragraph: §12 is cross-checked rather than generated, narrowing and reason stated. Closed at round 2; unchanged. |
| Owner authorization dated 2026-08-08 | Present | Read `SKILL-CHANGELOG.md` entry 6, quoted authorization |
| Applicability rule: the in-flight plan is not retrofitted mid-cycle | Honored | Grep `step-decl\|generated:` over `docs/plans/plan-expert-dev-tools-behavioral-remediation.md` → **0 hits**; HANDOFF.md's dispatch pin at `94a640a` present and unchanged |
| Round 4 verdict NEEDS FIXES — both findings remediated | **Partly met** | I-1 closed; I-2's three enumerated instances closed but its class-closure item not met in substance — see dispositions below and J-1 |

### Round-4 finding dispositions

Each re-derived from current source by execution. Changelog entry 10's claims were treated as candidates, not as verification.

| # | Disposition | Verification (executed, never accepted from the changelog) |
|---|---|---|
| **I-1** Serious — the contract's canonical `step-decl` example is in a form the parser rejects | **Closed** | Resolution 1 of the two offered (teach the parser to strip the fence's indentation) was taken. `extractBlocks` (Read lines 104–118) captures `([ \t]*)` before the fence and strips exactly that prefix from each content line. Probed by building a realistic prose plan fixture with two steps declared inside numbered §7 items, one of them **the contract's own example extracted programmatically and byte-for-byte** (fence indent measured `'    '`): `--check` → `STALE` exit 1 before regeneration, regenerate → `regenerated: coverage, files (2 steps)` exit 0, `--check` → `OK: 2 steps, 2 elements, 2 test specs, regions current` exit 0. Round 4 measured 13 errors on the same input. The generated tables render correctly (`\| workflows/expert-lifecycle.js \| modify \| S12 \|`). |
| **I-1**, `plan-elements` half — "must be covered in the same edit" | **Closed** | `extractBlocks` is generic over the fence tag, so the fix covers both. Probed independently: a `plan-elements` block indented four spaces inside a list item → `OK`, exit 0. |
| **I-2** instance 2 (parser moves — require all three `files:` sub-keys) | **Closed** | Deleting the `delete: []` line from an otherwise-passing fixture → `ERROR: step-decl at line 36: files: block missing sub-key 'delete' (declare it explicitly, [] if empty)`, exit 1. Round 4 measured exit 0 on the same input. Read lines 249–253 confirms the check is gated on `seen.has('files')`, so an entirely missing `files:` key still yields only the single missing-required-key error. |
| **I-2** instance 3 (contract moves — step-ID suffix wording) | **Closed** | Read §7: "optionally suffixed with a single lowercase letter `a`–`z`", matching `/^S\d+[a-z]?$/` at script line 254. Probed `step: S12z` → accepted (the run's only complaint was staleness from the changed ID), exit consistent with acceptance. |
| **I-2** class closure (extend the move-together rule to both directions and make the example half mechanical) | **NOT closed — recurring as J-1** | The rule text was extended (Read the workflow bullet: "in both directions … paste the contract's own `step-decl` and `plan-elements` examples into a scratch fixture and run `--check` before delivering the edit"). But the edit that installed it shipped two new parser constraints with no contract text, and the instruction names an artifact that does not exist. Evidence in J-1. Under Gate A, closure against an adjacent standard is not closure: the round-4 finding named the *effect* (a divergence cannot ship unnoticed), and the rule as delivered did not produce it on its own first application. |

### Regression probes (round-1 / round-2 / round-3 behaviors the round-4 edits could have disturbed)

- **F-1 CRLF fixed point, now on a realistic prose document with indented declarations:** regenerate → exit 0, `--check` → `OK` exit 0, byte count **68 CRLF / 0 bare LF**. The indent-stripping change normalizes block content to LF internally (`join('\n')` at line 114) but does not leak that into the emitted regions.
- **LF idempotence:** regenerate on an already-current LF fixture → `no changes: regions already current`, exit 0.
- **G-1 marker forms, G-2(a)–(d), H-4 single-diagnostic behavior:** not re-probed individually this round — no round-4 edit touches `parseList`, the marker matching, or the acyclicity DFS (confirmed by reading the current source at lines 127–167, 274–300, 383–409 against the round-4 record's line citations). The one exception is the H-4 *class*, which the new sub-key check reopens at a different site — reported as J-2.

## Critical & Serious Findings

No Critical or Serious findings — the full inventory was Read or Grep-verified per Compliance Gate B, and no violations of Critical or Serious classification were observed. The two candidates that would have reached Serious (I-1's parser rejection of the canonical example; I-2's fail-open `files:` sub-key default) were both re-probed by execution and both now behave correctly.

## Systemic Patterns

### J-1 (Systemic, recurring — I-2's class-closure item) — the bidirectional move-together rule was violated by the edit that installed it, and its mechanical half has no executable referent

**The pattern.** Round 4's I-2 found that the contract↔script reconciliation ran in one direction only, and asked for a class closure with two halves: bind the rule in both directions, and make the example half mechanical ("the contract's own `step-decl` and `plan-elements` examples should be extractable into a fixture the script parses clean, which would have caught instance 1 the moment it was written"). The rule text was written. It did not hold on its own first application, and its mechanical half cannot be run.

**Proactive scan.** The pattern's signature is "a grammar constraint or assertion where the contract and the parser disagree, in a direction the now-bidirectional rule claims to cover." I enumerated every constraint the parser enforces by walking its `errors.push` / `fail` sites (Read lines 68–409, twenty-seven distinct diagnostics) and checked each against the contract's text by grep and Read; then I walked the contract's grammar assertions in §2 and §7 and the workflow bullets in the other direction. **Twenty-seven diagnostics walked; twenty-four are stated in the contract, three are not.** Two of the three are new this round.

| # | Constraint or assertion | Contract text | Parser reality | Direction | Verification |
|---|---|---|---|---|---|
| a | All three `files:` sub-keys must be declared explicitly; omission is an error | **Absent.** `grep -inE 'sub-key\|create:\|modify:\|delete:\|explicitly'` over `output-contract.md` → 5 hits; the only ones inside §7 are the example lines 23–25. §7's prose says "five top-level keys, each appearing exactly once" and "All five keys are required; empty lists are written `[]`" — both about the top-level keys | Hard error, script lines 249–253 | parser → contract | Execution (`nosub.md` → exit 1) plus the grep above. **New this round** — the constraint did not exist before the round-4 edit |
| b | A duplicate `files:` sub-key is an error | **Absent** (same grep) | Hard error, script lines 233–237 | parser → contract | Read at line; same grep. Pre-existing, but adjacent to (a) and missed by the same sweep |
| c | "paste the contract's own `step-decl` and **`plan-elements`** examples into a scratch fixture and run `--check`" | Asserts the examples exist | `grep -cE '^\s*```plan-elements'` over the contract → **0**; `'^\s*```step-decl'` → **1** | contract → reality | grep with counts recorded. **New this round** |

Instance (c) has a second edge worth stating because it determines the fix: even the `step-decl` half is not executable as literally instructed. I pasted the contract's example verbatim into a fixture as the sole declaration → `ERROR: step S12 (line 16) depends on undeclared step S11`, exit 1. The example declares `depends_on: [S11]` and `tests: [T-9]`, so a literal paste can never exit 0 without scaffolding the instruction does not describe (a `plan-elements` block, both marker pairs, a Test specifications section declaring T-9, and a step S11).

**Standard violated.** Two, one per direction. For (a) and (b): **documentation-as-contract**, the same standard round 3's H-2 was decided under and the same standard the move-together rule exists to enforce — a constraint the implementation enforces that the specification does not state is a trap for the party the specification serves. For (c): **honest risk disclosure with a named compensating control**, the standard round 3's H-1 was decided under — a control cited as the guarantee must exist and must be runnable. This is the third distinct appearance of that same H-1 shape in this change set (H-1's delivery-time diff check, then this).

**Why systemic rather than isolated.** Not the count — the cause. All three instances were reachable by the very rule the round-4 edit installed, and none was caught, because the rule is a prose obligation with no execution behind it and its one executable clause points at nothing. That is structurally the same failure the whole change set exists to close: a surface that nothing checks. It has now been relocated twice — from the plan's restating sections (rounds 1–3) to the contract↔script relationship (round 4) to the rule governing that relationship (this round) — and at each relocation the mitigation chosen was a stronger hand-maintenance rule, which is the move the owner already ruled against ("converted, not swept harder"). The round-4 record predicted this precise outcome: "the rule as written will be satisfied by round 5's corrections and will still let a contract assertion drift away from the parser."

**Correct implementation.** Name the moving side per instance, then close the class mechanically rather than by rule text.

- Instance (a): **the contract moves.** Add to §7's grammar paragraph, beside the example: the `files:` key introduces an indented block that must declare all three of `create:`, `modify:`, `delete:` explicitly — `[]` where empty — and each at most once. Do not relax the parser; the fail-closed posture is the one this project has decided under four times.
- Instance (b): **the contract moves**, folded into the same sentence.
- Instance (c): **the contract moves, by adding the artifact.** Add a real fenced ` ```plan-elements ` example to §2 (it currently describes the block only in an inline code span, and the `elements: [R-1, R-2, …]` form shown there is not itself valid — the literal `…` would parse as an element token no step covers). Then make the whole instruction executable: rather than "paste the examples," ship a checked-in minimal fixture in `scripts/` whose `step-decl` and `plan-elements` blocks are the contract's examples, and state that the delivery check is `node scripts/derive-plan-sections.mjs --check scripts/<fixture>.md`. A fixture that lives beside the script and is run by name is a control; an instruction to construct one ad hoc is the same hand-maintenance the change set is replacing.
- **Class closure — make it executable this time.** The durable form is a single command that fails when contract and parser disagree: extract every fenced `step-decl` / `plan-elements` block from `output-contract.md` into a temporary document and run `--check` over it. That is roughly ten lines added to the script behind a flag (e.g. `--self-check <contract.md>`), it subsumes instance (c) entirely, and it would have caught round 4's I-1 at the moment the example was written. It does not cover (a) or (b) — a constraint the parser enforces and the contract never mentions is not mechanically detectable — so the honest closure is: mechanize the example half, and for the constraint half state plainly in the rule that it is a hand-maintained obligation, with the diagnostic-message list as the enumeration to walk. Naming the residual as residual is what H-1 established this project does instead of claiming a control it does not have.

## Moderate & Minor Findings

### J-2 (Minor, regression) — the new sub-key check emits three false diagnostics when `files:` carries an inline value

**What the code does.** When `files:` has an inline value, line 226 correctly errors and `continue`s — but `inFiles` is never set and `seenSub` is never populated, so the new required-sub-key loop at lines 249–253 then reports all three sub-keys missing. Executed: a declaration written `files: {create: [], modify: [a.js], delete: []}` produces four errors — the correct one, plus `files: block missing sub-key 'create'`, `'modify'`, and `'delete'` for three keys the author demonstrably did write.

**How that claim was verified.** Execution against the `inline.md` fixture, full stderr captured, exit 1; Read of lines 222–253 at drafting time.

**Standard violated.** Diagnostic accuracy — precisely the standard round 3's **H-4** was decided under, and stated there as "a parse failure has its own error and must not also claim the author wrote `elements: []`." H-4 was closed by an `errsBefore` guard at the vocabulary site; the round-4 edit reopened the class at a new site. Provenance is regression: the check that produces the false diagnostics is new in this change.

**Correct implementation.** Gate the sub-key loop the same way H-4 was gated — skip it when the `files:` line itself failed to parse. A `filesParsed` boolean set alongside `inFiles = true` at line 229, and tested at line 249, is the minimal form.

### J-3 (Minor, new) — lines that do not carry the fence's indentation are silently accepted instead of rejected

**What the code does.** `extractBlocks` strips the fence indent conditionally: `(indent && l.startsWith(indent) ? l.slice(indent.length) : l)` at line 113. A line lacking that prefix is passed through verbatim, and if it happens to parse at its own depth it is accepted. Executed: in a four-space-indented block, moving `covers: [R-3]` to column 0 → `OK`, exit 0; moving a `files:` sub-key from six spaces to two → `OK`, exit 0. Both fixtures are otherwise identical to the passing baseline.

**How that claim was verified.** Execution against the `ragged.md` and `subragged.md` fixtures; Read of lines 104–118 at drafting time.

**Standard violated.** Fail-closed validation — the standard round 1's F-2 class, round 2's G-1, and round 4's I-2 instance 2 were all decided under. The contract states the parser "strips the fence's own indentation from the block's lines"; a line not carrying that indentation is outside the grammar as specified and is accepted anyway. Round 4's resolution 1 specified the correct behavior explicitly — "remove exactly that prefix from each line, **erroring if a line does not carry it**" — and that clause was not implemented. The severity is Minor rather than higher because the accepted forms parse to their evidently intended meaning; nothing is silently misrepresented, unlike the omitted-sub-key case.

**Correct implementation.** **The script moves.** When `indent` is non-empty, a content line that is neither blank nor prefixed by `indent` is an error naming the line, rather than a pass-through.

### J-4 (Minor, new) — HANDOFF.md points at "changelog entries 6–7" for a revision now recorded in entries 6–10

**What the document says.** The dispatch-pinning paragraph reads: "the working-tree contract has since been revised (generated-regions regime, `docs/SKILL-CHANGELOG.md` entries 6–7)". Verified by Read of the paragraph via `git diff HEAD`. The changelog now carries ten entries (`grep -cE '^### [0-9]+ '` → **10**), and entries 9 (line 392) and 10 (line 422) both name `skills/expert-plan/references/output-contract.md` in their headings — entry 10 in particular records the §7 grammar changes an author most needs.

**Standard violated.** Documentation cross-reference accuracy, and — more pointedly — this project's own **re-derive-never-patch** doctrine applied to a hand-maintained enumeration. The pointer was correct when written under entry 8's G-3; three subsequent entries revised the same file and the pointer was not re-derived. This is the identical shape as the drift class the change set exists to close, at a surface the two-regime split does not cover because it lives outside the plan document.

**Correct implementation.** Replace the enumerated range with an unbounded reference — "recorded in `docs/SKILL-CHANGELOG.md`, entries 6 onward" — so the pointer cannot go stale as entries accrue. Enumerating a growing list by hand is the failure; widening the enumeration by two would only reset the clock.

## Tentative Findings

No tentative findings — every finding's premise was verified by executing the script against a purpose-built synthetic fixture in the session scratchpad, by `grep` with its query and result count recorded, or by Read at a cited line at drafting time. No candidate was dropped for want of an instrument.

## Observations

- The parser also enforces step-ID uniqueness (`duplicate step ID`, line 265), which the contract does not state. Recorded here rather than as a J-1 instance because uniqueness is definitional to an identifier rather than a grammar rule an author could reasonably violate unknowingly. It is nonetheless the kind of entry a diagnostic-list walk would surface, which is why J-1's correction names that list as the enumeration.
- `SKILL.md` still contains zero references to the script, `step-decl`, `plan-elements`, or the markers (grep, 0 hits), unchanged from rounds 3 and 4. No standard violation — the contract is a `references/` file the skill directs the author to — but it remains why the contract's completeness as a grammar specification is load-bearing, and why J-1(a) has no second source that could rescue an author.
- Round 4's carried-forward request was honored in substance by this reviewer as well as by the correction: this round's probes ran against a realistic prose plan with declarations in their natural indented position inside a numbered §7, on both LF and CRLF, rather than against column-0 fixtures. That is what allowed I-1's closure to be confirmed as real rather than inferred from the diff.
- Changelog entry 10's claims are all accurate as far as they go; each was independently re-derived by execution and none was found overstated. It does not mention the two new parser constraints (J-1(a), (b)), which is the same omission as the contract's.

## What's Actually Good

- **I-1 was closed with the more expensive of the two offered resolutions, and the fix generalizes rather than special-casing.** Round 4 offered "teach the parser to strip the indent" or "de-indent the example and state the constraint," and recommended the former. `extractBlocks` was made indent-aware once, generically over the fence tag, so `step-decl` and `plan-elements` were both covered by a single change rather than two parallel patches — verified by probing the two block types in separate fixtures, both exit 0. **Standard:** DRY applied at the right seam, and the resolution that does not force the document's markdown structure to fight its own specification.
- **The relative-indentation preservation is the non-obvious part and it is correct.** Stripping the fence's own prefix while leaving the `files:` sub-keys' additional two spaces intact is what makes a nested block parse identically at any depth. Verified by executing a four-space-indented block whose sub-keys sit at six spaces: the sub-key branch matched and the generated file table rendered both paths correctly. **Standard:** the parser's grammar is depth-invariant, which is the property that makes the markdown-embedding legitimate rather than tolerated.
- **I-2's two remaining instances were each fixed on the side round 4 named, not the cheap side.** Instance 2 moved the parser to fail closed (the tempting inverse — relaxing the contract to match a fail-open default — was available and not taken); instance 3 moved the contract to match the more permissive regex rather than narrowing the regex to match the prose. Verified by execution in both cases. **Standard:** fail-closed validation, and the discipline of naming the moving side before editing, which round 4 flagged as a live risk in this specific pair.

## Convergence Record

**Round number:** 5 (fourth Post-fix round; matches Scope and Inventory).

**Trajectory:** R1: 10 (1 Critical, 1 Systemic, 2 Serious, 4 Moderate, 2 Minor) → R2: 5 (1 Systemic, 1 Serious, 1 Moderate, 2 Minor) → R3: 4 (1 Systemic, 1 Serious, 2 Minor) → R4: 2 (1 Systemic, 1 Serious) → **R5: 4 (1 Systemic, 3 Minor)**.

**Flow counts for this round.** Prior findings closed: **1** — I-1, closed against its originally named standard (documentation-as-contract) and re-derived by execution against the contract's own verbatim example. Recurring: **1** — I-2, whose three enumerated instances are closed by execution but whose class-closure item is not met in substance; it recurs as J-1 at the same standard and the same location (the contract↔script relationship). New: **2** — J-3, J-4. Regressions: **1** — J-2, introduced by the round-4 sub-key check.

**Tripwire evaluation — NOT FIRED**, arithmetic shown:

- Condition (a): new + regression ≥ closed, for **two consecutive** Post-fix rounds. **This round: 2 new + 1 regression = 3, against 1 closed. 3 ≥ 1 is TRUE.** Round 4: 2 + 0 = 2 against 4 closed; 2 ≥ 4 is false. Round 3: 3 + 0 = 3 against 4 closed; false. Round 2: 4 + 0 = 4 against 9 closed; false. The condition holds this round and did **not** hold in round 4, so two consecutive occurrences have not accrued. Not fired — **but armed for the first time in the cycle: if condition (a) holds again in round 6, the tripwire fires.**
- Condition (b): total findings not strictly decreasing, for **two consecutive** Post-fix rounds. **10 → 5 → 4 → 2 → 4.** Every transition through round 4 was a strict decrease; this round is an increase, so the condition holds this round for the first time. It did not hold in round 4. Not fired — **also armed: a round 6 that does not come in below 4 fires it.**

Both conditions are now one round from firing, which has not been true at any prior point in this cycle, and the substantive reading agrees with the arithmetic rather than softening it. Through round 4 the Systemic finding moved strictly upstream and got strictly smaller each round — fail-open validation (R1, R2) → documentation sweep (R3) → one-directional reconciliation (R4). This round it did not move upstream again; it recurred in place. The round-4 record named the class-closure item as "the part that determines whether round 5 is clean," the correction produced the rule text but not its effect, and the first thing that rule was asked to catch — a constraint added by its own edit — went through it. That is the signature of a mitigation being restated rather than converted, which is the specific pattern the owner ruled against for the original drift class. The countervailing evidence is real and worth weighing: the severity distribution improved materially (Critical closed at R2 and still closed; Serious 2 → 1 → 1 → 1 → **0**), and nothing in this round's finding set threatens correctness of the generated output. The mechanism works. What has not converged is the discipline guarding the mechanism's specification.

## Recommended Priority

The tripwire has not fired, so another fix round is the indicated path rather than foundational rework. It should be treated as the last one that can be spent on rule text.

1. **J-1(c) first, and take the mechanical form, not the reworded-rule form.** Add the missing fenced `plan-elements` example to §2, and add a `--self-check <contract.md>` mode (or a checked-in fixture in `scripts/` run by name) so that "the contract's examples parse clean" is a command that exits non-zero rather than an instruction someone remembers to follow. Rewriting the bullet again, without an executable behind it, reproduces exactly what this round found: the rule was already extended once and did not hold on its first application.
2. **J-1(a) and (b) next, as a single contract edit, and state the residual honestly.** Add the `files:` sub-key requirement and the at-most-once rule to §7's grammar paragraph beside the example. Then, in the move-together bullet, say plainly that the parser→contract direction is hand-maintained with the script's diagnostic list as the enumeration to walk — because no mechanism proposed so far detects a constraint the contract never mentions. Claiming otherwise would be the third instance of H-1's shape in this change set.
3. **J-2 and J-3 together — both are the script, both are small, and both are the same fail-closed/diagnostic-accuracy pair this cycle keeps returning to.** J-2 needs a `filesParsed` guard mirroring H-4's `errsBefore` guard; J-3 needs the error clause round 4's resolution 1 specified and the implementation omitted.
4. **J-4 last.** One sentence in HANDOFF.md, and make it unbounded ("entries 6 onward") rather than re-enumerating.

One carry-forward for round 6, stated as a threshold rather than a suggestion, because both tripwire conditions are armed: if round 6 does not close J-1 as a class — with the executable check in place, not another rule revision — and does not come in below four findings, the tripwire fires on both conditions simultaneously and the indicated path becomes foundational rework of the contract↔script specification relationship, not a sixth fix round.

Verdict: NEEDS FIXES (4 findings: 1 Systemic, 3 Minor)
