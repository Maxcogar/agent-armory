# Expert Review — expert-plan output contract: derived sections become generated

Round 3 (Post-fix review of round 2). Reviewer: independent subagent, no prior context on this work, 2026-08-08.
Persisted by the reviewing agent; persistence is the only edit.

## Scope and Inventory

**Round number:** 3. Prior rounds: `docs/reviews/output-contract-generated-sections-round-01.md` (NEEDS_FIXES, F-1..F-10) and `-round-02.md` (NEEDS_FIXES, G-1..G-5, plus round 1's F-2 instance 3 carried open inside G-2(b)).

### Step 3 tool plan

| Claim type in scope | Instrument | Availability / disposition |
|---|---|---|
| Behavioral ("this input produces that exit code") | Execution of the script against synthetic fixtures in the session scratchpad | Available; Node v22.16.0. Twenty-one probes run. **Nothing in the repository working tree was run in write mode** — every regenerate-mode run targeted a scratchpad fixture. |
| Literal-content ("line N says Z") | `Read` at the cited file:line at drafting time | Available, used throughout |
| Absence ("the contract contains no X") | `grep` over the named file, query and result count recorded | Available, used for all five instances of H-2 |
| Line-ending claims | Byte-level CRLF / bare-LF counts via Python | Available |
| Structural / blast radius | CodeGraph | Not exercised — the script is a standalone entry point with no importers (`#!/usr/bin/env node`, Read line 1; its only import is `node:fs`, Read line 64). No finding in this round makes a structural claim. |
| Library behavior | Context7 | **Not needed** — the script's only import is `node:fs`. There is no library-behavior claim category in this review's scope, so no Step 3 halt condition arises. |
| Claims imported from prior documents (rounds 1–2, the changelog, HANDOFF.md) | Re-derivation from current source with the instrument the underlying claim type requires | Available; every prior-round disposition below was re-derived by execution or Read, never accepted from the changelog |
| Comment claims inside the artifact (script header, inline comments) | Re-derivation from source | Available; this is how H-1 was found |

No instrument class was unavailable for a load-bearing claim category. No rigor waivers — no compression was requested.

### Inventory — all four Post-fix sources

| File | Source | Status | Verification |
|---|---|---|---|
| `claude-plugins/expert-dev-tools/skills/expert-plan/scripts/derive-plan-sections.mjs` | prior inventory + fix-diff | [x] | Read 1–397 in full; executed in 21 fixture probes; byte count 0 CRLF / 396 bare LF |
| `claude-plugins/expert-dev-tools/skills/expert-plan/references/output-contract.md` | prior inventory + fix-diff | [x] | Read via full `git diff HEAD`; Gate C section read in full (18 items); six greps recorded under H-2; byte count 119 CRLF / 0 bare LF |
| `claude-plugins/expert-dev-tools/docs/HANDOFF.md` | fix-diff (modified this round) | [x] | Read via `git diff HEAD` — the round-4 / dispatch-pinning paragraphs; byte count 130 CRLF / 0 bare LF |
| `claude-plugins/expert-dev-tools/docs/SKILL-CHANGELOG.md` (entries 6, 7, 8) | fix-diff | [x] | Read via `git diff HEAD`, lines 236–386 |
| `claude-plugins/expert-dev-tools/docs/reviews/plan-behavioral-remediation-round-04.md` | fix-diff dependent (the record entry 7 and HANDOFF.md now cite) | [x] | Read lines 1–30 and the final verdict line |
| `claude-plugins/expert-dev-tools/skills/expert-plan/SKILL.md` | prior inventory | [x] | Grep `derive-plan-sections\|step-decl\|plan-elements\|generated:` → **0 hits** |
| `claude-plugins/expert-dev-tools/docs/plans/plan-expert-dev-tools-behavioral-remediation.md` | prior inventory | [x] | Modified in the working tree by a separate, concurrent correction thread; out of this change's scope. Its relevance here is only as the in-flight plan the Applicability rule governs, verified via HANDOFF.md and the round-04 record. |
| 3 mirror copies of `expert-plan/references/output-contract.md` | prior inventory | [x] | `ls` of all three: each contains `SKILL.md` and `references/` only — **no `scripts/` directory in any**. Consistent with changelog entry 6's propagation note. |
| `git show 94a640a:…/output-contract.md` (baseline) | prior inventory | [x] | Read via `git diff HEAD` against it |
| G-1..G-5 + F-2 instance 3 as closure items | prior findings | [x] | Each re-derived from current source by execution; dispositions in the table below |

Fix-diff dependents: the script has no importers; the contract's only dependents are `SKILL.md` (grep above, 0 hits) and the three mirrors (listed above). Both covered.

Procedural note: `collaborativereasoning` was rejected on its first call with a schema-validation error on the persona `communication.style` / `.tone` enums, and succeeded on the second call with corrected values. This is the same infrastructure failure round 2 recorded. The multi-perspective check ran as designed on the successful call, with the standards-discipline, downstream-consumer, and implementer personas.

## Summary

**This review returns NEEDS FIXES.** The round-2 corrections are real and were confirmed by execution rather than by reading the changelog: all four of G-1's silent-pass reproductions now error with exit 1, `elements: []` is rejected, duplicate list entries are rejected, `depends_on` cycles (self-edges and two-node cycles both) are detected, the HANDOFF.md dispatch pin is in place, and the changelog's previously uncorroborated round-4 claim now cites a record that exists and says what the entry claims it says. The CRLF fixed point from round 1 survives all of this. What blocks the verdict is a different class than round 2's. The comma-split hole that has now survived two rounds was closed by narrowing the grammar rather than by detection — a defensible move — but the narrowing's justification names a compensating control, "the delivery-time diff-vs-section-5 check," that does not exist in the contract and cannot exist at plan-delivery time, and that claim is repeated in three places. Alongside it, five constraints the parser now enforces as hard errors appear nowhere in the contract, which is the only grammar specification a plan author reads. Both are the same failure the project keeps recording: the behavior was corrected and the documents describing the behavior were not swept with it.

## Upstream Contract Verification

No formal spec or architecture document governs this change. The binding upstream artifacts are the owner ruling in `docs/HANDOFF.md`, the prior contract's stated closure condition, and rounds 1 and 2's findings.

| Upstream requirement | Status | Verification method |
|---|---|---|
| Owner ruling: the drift surfaces "have to be converted, not swept harder" | Honored | Read the contract diff: §2 and §5 are converted to generated regions written only by the script |
| "a machine-readable step declaration … from which §2, §5 and §12 are generated" | Honored, with disclosed narrowing | Read the contract's "Generated — written only by the script" paragraph: §12 is cross-checked rather than generated, and the narrowing and its reason are stated in the contract. Closed at round 2; unchanged this round. |
| Owner authorization dated 2026-08-08 | Present | Read `SKILL-CHANGELOG.md` entry 6, quoted authorization |
| Round 2 verdict NEEDS_FIXES — all five findings remediated | Not fully met | G-5 is closed at two of its three sub-items; sub-item 3 is half-swept. See H-3. G-1, G-2, G-3, G-4 closed, evidenced below. |

### Round-2 finding dispositions

Each re-derived from current source. The changelog's claims were treated as candidates, not as verification.

| # | Disposition | Verification (executed unless noted) |
|---|---|---|
| **G-1** Serious — `OK` on an unmatchable region | **Closed** | All four round-2 reproductions re-probed from a clean regenerated state. Trailing space after the begin marker, content on the begin-marker line, reversed marker order, and both markers on one line each now produce `ERROR: region 'files': markers present but not in processable form …`, **exit 1**. Regenerate mode errors identically (exit 1), so there is no path that writes over an unmatchable region. Mechanism: Read lines 361–368 — `if (!re.test(updated))` guards the replace. |
| **G-2(a)** — `elements: []` disables completeness | **Closed** | `elements: []` → `ERROR: plan-elements block at line 5: 'elements: []' is not allowed — a plan must declare at least one requested-work element`, exit 1. Read lines 152–156. |
| **G-2(b)** / round 1's F-2 instance 3 — comma splits an entry | **Closed by grammar narrowing** | The behavior is unchanged: `create: [src/my, file.js]` still yields rows `src/my` and `file.js` with regen exit 0 and `--check` exit 0 (executed). What changed is that entries are now single tokens — `create: [src/my file.js]` → `ERROR: … entry 'src/my file.js' contains whitespace — entries are single tokens`, exit 1 (executed; Read lines 130–133) — and the grammar now declares that a path containing a comma or space cannot be declared at all. Within that declared grammar the parser faithfully represents its input, and no parser edit can distinguish the two readings, so I do not re-report the behavior. **The narrowing's stated compensating control is a separate defect — see H-1.** |
| **G-2(c)** — duplicate entries within a list | **Closed** | `covers: [R-1, R-1]` → `ERROR: … duplicate entry 'R-1' in: [R-1, R-1]`, exit 1. Read lines 136–140. |
| **G-2(d)** — `depends_on` acyclicity | **Closed** | Self-dependency (`S2` depends on `S2`) → `ERROR: dependency cycle involving steps S2 and S2`, exit 1. Two-node cycle (S1↔S2) → `ERROR: dependency cycle involving steps S2 and S1`, exit 1. Read lines 239–265: iterative three-color DFS. |
| **G-3** Moderate — HANDOFF.md carries no dispatch pin | **Closed** | Read `git diff HEAD -- docs/HANDOFF.md`: the "What to do" section now records round 4 as done with the contract "**pinned at commit `94a640a`**", and adds a standing paragraph — "**Any further plan-review dispatch cites the output contract by commit**" — with the reason stated. The pointers-only prohibition is preserved in a separate paragraph. |
| **G-4** Minor — uncorroborated round-4 claim in changelog entry 7 | **Closed** | Entry 7 now cites `docs/reviews/plan-behavioral-remediation-round-04.md`. Re-derived rather than accepted: that file exists (`ls docs/reviews/` → six records including round-04), its header reads "**at commit `94a640a`** (read via `git show 94a640a:…`; the working-tree copy was not consulted)", and its final line is `Verdict: NEEDS FIXES (7 findings: 1 Systemic, 3 Serious, 2 Moderate, 1 Minor)` — matching HANDOFF.md's "Verdict NEEDS FIXES, 7 findings". The three records now agree. |
| **G-5** Minor — three header inaccuracies | **Not closed (2 of 3)** | Sub-item 1 **closed**: the header example (lines 35–44) now carries no inline comments; executed verbatim as a fixture step it parses cleanly, regen exit 0, `--check` exit 0. Sub-item 2 **closed**: Read line 52 — the rejected-character list now reads "commas, brackets, braces, or quotes". Sub-item 3 **half-swept**: the header prose was corrected (Read lines 61–62, "if the document contains any CRLF it emits regions with CRLF, otherwise LF" — accurate against line 92), but the inline comment at line 90 still reads "the document's **dominant** line ending". See H-3. |

## Critical & Serious Findings

### H-1 (Serious, new) — the compensating control named as the backstop for the comma-split hole does not exist, and cannot exist at plan-delivery time

**What the artifact says.** Three places assert a backstop for the one residual defect the round-2 corrections deliberately declined to fix:

- `derive-plan-sections.mjs:53–56` (header): "A file path containing a comma or space therefore cannot be declared at all: the grammar forbids the characters rather than claiming to detect a comma-split path, **and the delivery-time diff-vs-section-5 check is the backstop for a phantom path.**"
- `derive-plan-sections.mjs:127–129` (inline comment in `parseList`): "**The diff-vs-§5 delivery check is the backstop for a phantom path.**"
- `SKILL-CHANGELOG.md` entry 8, G-2(b) bullet: "…with **the delivery-time diff-vs-§5 check named as the backstop**."

**How that claim was verified.** These are comment claims inside the artifact under review, so per Step 6 they were re-derived rather than accepted. Grep of `output-contract.md` for `diff|backstop|phantom` returns two hits, neither of which is this check: line 44, an unrelated paragraph on absence-claim evidence, and line 57, §16's `codegraph_diff_surface` — which compares *exported symbols* against a *pre-implementation baseline* as a *post-completion* activity, not file paths against §5 at delivery. The Compliance-gates section was then read in full: Gate A (3 items), Gate B (9 items), Gate C (18 items). No item compares the plan's §5 file list against any diff. Grep for `backstop` across the contract returns 0.

Independently of the grep, the claim is structurally impossible as stated. A plan is delivered *before* implementation — Gate C is the pre-delivery checklist, and the contract's own §16 places diff-based checking in Post-completion "after all steps are done." At the moment the check is claimed to fire, no implementation diff exists to compare §5 against.

**Standard violated.** First-principles articulation (no published standard fits precisely): the goal served is honest risk disclosure — a known residual defect is acceptable when it is disclosed *and* a named compensating control catches it. The shortcut taken is to name a control without establishing that it exists. It fails the goal because a reader — the next reviewer, the next maintainer, the author of the next correction round — will accept the grammar narrowing *because of* the named backstop, and will not re-open the question. This is the same mechanism as the project's own rule that a comment's verification claim is never verification: the citation carries the authority of a check while doing none of the checking.

**Why it matters.** This is the load-bearing half of how a two-round-old defect got closed. F-2 instance 3 was reported in round 1 and again as G-2(b) in round 2, both times against fail-closed validation. Round 3 accepts the closure — correctly, because the detection is genuinely impossible within a comma-separated grammar — but that acceptance rests entirely on the residual risk being caught somewhere. It is not. A plan declaring `modify: [src/foo, bar.js]` for a real file named `foo, bar.js` produces two paths that do not exist, in the file table that is the plan's declared blast radius, with a green `--check` and nothing downstream that will notice.

**Correct implementation.** Two acceptable resolutions; either closes it.

1. *Make the control real.* Add a Gate C item — or better, a §16 Post-completion item, where a diff genuinely exists — requiring the implementation diff's touched-file set to be reconciled against §5, with any file in one and not the other investigated. Then the three citations become true, and they should cite the gate item by name rather than by description.
2. *Delete the claim and state the risk plainly.* Strike the backstop clause from lines 55–56 and 128–129 and from changelog entry 8, replacing it with what is actually true: a path containing a comma is undeclarable in this grammar, and a comma written anyway is silently split with no mechanism that detects it. An accurately disclosed unmitigated risk is sound; a falsely mitigated one is not.

## Systemic Patterns

### H-2 (Systemic, new) — five constraints the parser enforces as hard errors are absent from the contract, the only grammar specification a plan author reads

**Proactive scan.** The pattern's signature is "the parser rejects input X, and the author-facing contract does not say so." I decomposed it by first enumerating every author-visible constraint the script enforces (Read of `derive-plan-sections.mjs` lines 98–221 and 348–374 — sixteen constraints), then grepping `output-contract.md` for each. Result: 11 of 16 documented, 5 absent. The five, with the grep that establishes absence:

| # | Constraint enforced (script) | Contract grep | Count | Verified reachable |
|---|---|---|---|---|
| 1 | `elements: []` is rejected — the vocabulary must be non-empty (lines 152–156) | `-iE "non-empty\|not allowed\|empty"` | **0** | Executed: exit 1 |
| 2 | List entries are single whitespace-free tokens (lines 130–133) | `-iE "whitespace\|single token\|space"` | **0** | Executed: exit 1 |
| 3 | Duplicate entries within one list are rejected (lines 136–140) | `-iE "duplicate entr\|duplicate"` | **0** | Executed: exit 1 |
| 4 | The `depends_on` graph must be acyclic (lines 239–265) | `-iE "acyclic\|cycle\|circular"` | **0** | Executed: exit 1 |
| 5 | The begin marker must end its line; the end marker must follow on a later line (lines 361–368) | `-iE "begin marker\|marker must\|end its line\|own line"` | **0** | Executed: exit 1, in both check and regenerate mode |

For contrast, the eleven that *are* documented — exactly one `plan-elements` block, no brackets/braces/quotes in entries, no commas in entries, five top-level keys each appearing once, the `files:` indented-block form, the `S<number>[a-z]` ID shape, `depends_on` referential integrity, `tests:` referential integrity, no orphan specs, the required "Test specifications" heading, empty lists written `[]`, no comments in the block — establish that the contract *does* undertake to reproduce the grammar. That undertaking is what makes the five omissions a defect rather than a stylistic choice: it was the explicit basis on which round 1's F-7 was closed ("the constraints reproduced in the contract").

**Standard violated.** Documentation-as-contract, applied consistently with how this project already applies it: a specification that an implementation enforces but the specification does not state is a trap for the party the specification exists to serve. The contract is the plan author's sole source — `SKILL.md` contains zero references to the script, `step-decl`, `plan-elements`, or the markers (grep, **0 hits**), so nothing else reaches the author. Under the contract's own doctrine that a failing `--check` is a halt and not a waiver, an author who trips an undocumented constraint has no documented remedy; instance 5 is the sharpest case, because the only fix is to hand-edit a marker line in a document whose contract says "Never hand-edit inside the markers" and says nothing at all about the marker lines themselves.

**Why systemic rather than isolated.** All five entered in one correction pass, and each has the same shape: the round-2 finding named a *behavior* to change, the behavior was changed in the script, and the document specifying that behavior was not swept. Four of the five trace to specific round-2 findings — G-2(a) → instance 1, G-2(b) → instance 2, G-2(c) → instance 3, G-2(d) → instance 4, G-1 → instance 5. That is five for five: **every behavioral correction made in round 2 is undocumented in the contract.** The failure is in the sweep step, not in any individual edit, which is exactly the class this project's re-derive-never-patch doctrine names and exactly why fixing these one at a time will leave the next round's corrections in the same state.

**Correct implementation.** In the same edit, extend §7's step-declaration paragraph to state constraints 1–4 (it already carries the bracket/brace/quote and comma rules, so they belong in the same sentence), and add constraint 5 to the "Generated — written only by the script" workflow list beside the existing "Never hand-edit inside the markers" bullet — the marker lines are the one place a hand edit is both necessary and legitimate, and the contract should say so. Then close the class rather than the instances: add a line to the contract's own maintenance rule — it already requires that a newly added restating section be classified into a regime in the same edit — requiring that a change to what the script enforces be reflected in §7 or the workflow list in the same edit.

## Moderate & Minor Findings

### H-3 (Minor, recurring) — the "dominant line ending" misdescription survives at `derive-plan-sections.mjs:90`

Round 2's G-5 sub-item 3 reported that the header claimed the generator "detects the document's *dominant* line ending" while line 92 implements presence, not dominance. The header prose was corrected — Read lines 61–62: "if the document contains any CRLF it emits regions with CRLF, otherwise LF," which is accurate. The inline comment two lines above the implementation was not: Read line 90, `// F-1: emit with the document's dominant line ending so regenerate-then-check`. Grep for `dominant` across the script returns **1 hit**, at line 90. This is the same standard (documentation accuracy as a premise-correctness requirement) at a sibling location in the same file, left behind when its twin was fixed — the maintainer most likely to be misled is the one reading the comment attached to the code, not the header sixty lines up. **Fix:** change line 90 to "emit with CRLF if the document contains any CRLF, else LF". *Provenance: recurring — G-5 instance 3, incompletely swept.*

### H-4 (Minor, new) — any `plan-elements` parse failure also emits a diagnostic that misstates the input as `elements: []`

The empty-vocabulary check at lines 154–156 fires on `elements.length === 0`, but `parseList` returns `[]` on *any* validation failure (lines 111, 118, 122, 132, 138). Every rejected vocabulary therefore draws a second error asserting the author wrote `'elements: []'` when they did not. Executed, two probes: `elements: [R-1, R-1]` → `ERROR: … duplicate entry 'R-1' …` followed by `ERROR: … 'elements: []' is not allowed — a plan must declare at least one requested-work element`, exit 1; `elements: ["R-1"]` → the quote error followed by the same spurious second line, exit 1. **Standard:** diagnostic accuracy — an error message that misdescribes the input sends the author to the wrong edit, and a message asserting a fact about the source that is false is the same defect class as H-1 at a smaller scale. The exit code is correct in both cases, which is why this is Minor rather than higher. **Fix:** gate the empty-vocabulary error on the raw value rather than the parse result — test that `m[1].trim() === '[]'` — or suppress it when `parseList` has already pushed an error for this block. *Provenance: new (introduced by the G-2(a) correction).*

## Tentative Findings

No tentative findings — every finding's premise was verified by executing the script against a purpose-built synthetic fixture in the session scratchpad, by Read at a cited line at drafting time, or by grep with its query and result count recorded. No candidate was dropped for want of an instrument.

## Observations

- All three mirror copies of the contract (`skills/Expert-Skills/expert-plan/`, `middleware/context-oracle/.claude/skills/expert-plan/`, `mcp-servers/aps-fusion-mcp-server/.claude/skills/expert-plan/`) contain `SKILL.md` and `references/` and no `scripts/` directory (`ls` of each). This matches changelog entry 6's propagation note, which states the mirrors are deliberately on an older revision and that applying this change there requires carrying `scripts/` too. No standard violation; recorded because a partial application at a mirror would produce a contract referencing a script that is not there.
- `docs/plans/plan-expert-dev-tools-behavioral-remediation.md` is modified in the working tree by a separate, concurrent correction thread (the round-4 findings pass). It is outside this change's scope and no finding here rests on its contents; the Applicability rule that governs it was verified through HANDOFF.md and the round-04 record instead.

## What's Actually Good

- **The G-1 fix chose the stronger of the two options round 2 offered, and it holds in write mode as well as check mode.** Round 2 recommended erroring on an unmatchable region *and* tolerating trailing whitespace on marker lines. The implementation took only the first, so a trailing space is a hard error rather than a tolerated input. Verified by execution: all four reproductions exit 1 under `--check`, and — the part that matters — regenerate mode exits 1 too, so there is no invocation that silently writes past a region it could not parse. **Standard:** fail-closed validation. Declining the tolerance half is the more conservative reading of that standard, not a shortfall against it; the cost is an undocumented constraint, which is H-2 instance 5 and lives in the contract, not in the code.
- **The acyclicity check is implemented as an iterative three-color DFS rather than recursion.** Read lines 241–265: an explicit stack with a per-frame child index, white/gray/black marking in a `Map`. Verified by execution on a self-edge and on a two-node cycle, both reported with the participating step IDs named. **Standard:** the textbook DFS back-edge characterization of cycle detection (CLRS 22.3), implemented without recursion so a deep dependency chain cannot exhaust the stack — correct by the standard and robust past the size any plan will reach.
- **The round-1 CRLF fixed point survives the round-2 changes.** This was round 1's Critical finding and the property most at risk from a round of edits to the region machinery. Re-verified end to end: a CRLF fixture (50 CRLF / 0 bare LF) regenerates to 56 CRLF / 0 bare LF with `--check` exit 0, and after re-normalizing the whole file to CRLF — simulating `git checkout` under `core.autocrlf=true` — `--check` is still exit 0. LF idempotence confirmed separately: two consecutive regenerate runs both report "no changes: regions already current." **Standard:** idempotence of a code generator; regenerate-then-check must be a no-op.

## Convergence Record

**Round number:** 3 (second Post-fix round; matches Scope and Inventory).

**Trajectory:** R1: 10 findings (1 Critical, 1 Systemic, 2 Serious, 4 Moderate, 2 Minor) → R2: 5 findings (1 Systemic, 1 Serious, 1 Moderate, 2 Minor) → R3: 4 findings (1 Systemic, 1 Serious, 2 Minor).

**Flow counts for this round.** Prior findings closed: **4** — G-1, G-2 (all four instances, with (b) closed by grammar narrowing and its behavior re-probed), G-3, G-4, each re-derived by execution or Read against its originally named standard. New: **3** — H-1, H-2, H-4. Recurring: **1** — H-3, carrying G-5's third sub-item at a sibling location in the same file. Regressions: **0** — each round-2 correction was probed for collateral breakage against the round-1 behaviors it could have disturbed (CRLF fixed point, LF idempotence, argument handling, `$`-in-path rendering, section-bounded test scan) and none was found; the three new findings are gaps left beside the corrections, not previously-working behavior the corrections broke.

**Tripwire evaluation — NOT FIRED**, arithmetic shown:

- Condition (a): new + regression ≥ closed, for two consecutive Post-fix rounds. **This round: 3 + 0 = 3, against 4 closed. 3 ≥ 4 is false.** Round 2: 4 + 0 = 4, against 9 closed; 4 ≥ 9 was false. The condition has held in neither of the two Post-fix rounds, so two consecutive occurrences have not accrued.
- Condition (b): total findings not strictly decreasing, for two consecutive Post-fix rounds. **10 → 5 → 4.** Round 2 was a strict decrease (10 → 5) and round 3 is a strict decrease (5 → 4). The condition has held in neither round.

Neither condition has fired once, let alone twice. The trajectory supports the arithmetic rather than merely satisfying it: the Critical class closed at round 2 and stayed closed, the Serious count is 2 → 1 → 1, and — the substantive signal — the surviving Systemic pattern has *changed class*. Rounds 1 and 2 both reported fail-open validation in the script; this round found none. Every fail-open instance either errors now or is provably undetectable within the declared grammar. H-2 is a documentation-sweep pattern, not a validation pattern. That is a genuinely different defect class in a different file, which is what convergence out of a class looks like rather than churn within one.

## Recommended Priority

The tripwire has not fired, so another fix round is the indicated path rather than foundational rework.

1. **H-1 first**, because it is the one finding that currently makes a false statement about the system's safety, and because every subsequent reader of this code will use it to decide the comma-split question is settled. Choose one of the two resolutions and apply it in all three citation sites at once — the header, the inline comment, and changelog entry 8 — not one at a time.
2. **H-2 as a class, in a single contract edit**, per this project's re-derive-the-class rule. Fixing the five instances individually would be the same move that produced them. The class-closing part is the last item of the fix: the maintenance rule that binds a future change in what the script enforces to a same-edit contract update. Without it, round 4's corrections will arrive undocumented in exactly this way.
3. **H-3 and H-4 together**, both single-line edits inside the script, both in the same file the H-1 edits touch. H-3 in particular should be applied by grepping for the term rather than by editing the line this review names — it is a recurring finding precisely because the last pass fixed the instance it was shown and not the class.

One note for whoever applies these, carried forward from round 2 and not a finding: every probe across all three review rounds has run against synthetic fixtures built by reading the parser. Round 2's G-1 trailing-space trigger and this round's H-2 instance 5 are both the kind of defect that fixture-only testing finds late, because the fixture author knows what the marker line is supposed to look like. Running the script once against a real prose document — any real document, retrofitted with declarations for two or three steps — would exercise the input distribution none of these three rounds has sampled.

Verdict: NEEDS FIXES (4 findings: 1 Systemic, 1 Serious, 2 Minor)
