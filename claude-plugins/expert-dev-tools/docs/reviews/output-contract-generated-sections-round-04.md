# Expert Review — expert-plan output contract: derived sections become generated

Round 4 (Post-fix review of round 3). Reviewer: independent subagent, no prior context on this work, 2026-08-08.
Persisted by the reviewing agent; persistence is the only edit.

## Scope and Inventory

**Round number:** 4. Prior rounds: `docs/reviews/output-contract-generated-sections-round-01.md` (NEEDS FIXES, F-1..F-10), `-round-02.md` (NEEDS FIXES, G-1..G-5), `-round-03.md` (NEEDS FIXES, H-1..H-4).

### Step 3 tool plan

| Claim type in scope | Instrument | Availability / disposition |
|---|---|---|
| Behavioral ("this input produces that exit code") | Execution of the script against synthetic fixtures in the session scratchpad | Available. Sixteen probes run. **Nothing in the repository working tree was run in write mode** — every regenerate-mode run targeted a scratchpad fixture (`base.md`, `p1.md`, `h4.md`, `indent.md`, `c2..c5.md`, `sub.md`, `kind.md`, `crlf.md`, `dollar.md`, `two.md`). |
| Literal-content ("line N says Z") | `Read` at the cited file:line at drafting time | Available, used throughout |
| Absence ("the contract contains no X") | `grep` over the named file, query and result count recorded | Available; used for H-3 closure and I-1's absence premise |
| Whitespace / indentation claims | `cat -A` byte display of the cited lines | Available; used for I-1 |
| Line-ending claims | Byte-level CRLF / bare-LF counts via Python | Available |
| Structural / blast radius | CodeGraph | Not exercised — the script is a standalone entry point with no importers (`#!/usr/bin/env node`, Read line 1; its only import is `node:fs`, Read line 66). No finding in this round makes a structural claim. |
| Library behavior | Context7 | **Not needed** — the script's only import is `node:fs`. There is no library-behavior claim category in this review's scope, so no Step 3 halt condition arises. |
| Claims imported from prior documents (rounds 1–3, the changelog, HANDOFF.md) | Re-derivation from current source with the instrument the underlying claim type requires | Available; every H-1..H-4 disposition below was re-derived by execution, `cat -A`, `grep`, or Read — never accepted from changelog entry 9 |
| Comment claims inside the artifact (script header, inline comments) | Re-derivation from source | Available; used to confirm the H-1 rewrite is now true rather than merely changed |

No instrument class was unavailable for a load-bearing claim category. No rigor waivers — no compression was requested.

### Inventory — all four Post-fix sources

| File | Source | Status | Verification |
|---|---|---|---|
| `claude-plugins/expert-dev-tools/skills/expert-plan/scripts/derive-plan-sections.mjs` | prior inventory + fix-diff | [x] | Read 1–408 in full; executed in 16 fixture probes; `grep dominant` → **0 hits** |
| `claude-plugins/expert-dev-tools/skills/expert-plan/references/output-contract.md` | prior inventory + fix-diff | [x] | Read via full `git diff HEAD`; §7 grammar paragraph and §16 read at line; `cat -A` of lines 18–30; `grep -inE "indent\|column\|left margin\|unindented\|top level\|top-level"` → 1 hit (the §7 grammar paragraph, which does not address indentation) |
| `claude-plugins/expert-dev-tools/docs/SKILL-CHANGELOG.md` (entries 6–9) | fix-diff | [x] | Read via `git diff HEAD`, full entry 9 plus the amended G-2(b) bullet in entry 8 |
| `claude-plugins/expert-dev-tools/docs/HANDOFF.md` | fix-diff | [x] | Read via `git diff HEAD` — the round-4 / dispatch-pinning paragraphs, unchanged since round 3 |
| `claude-plugins/expert-dev-tools/skills/expert-plan/SKILL.md` | prior inventory + fix-diff dependent | [x] | Grep `derive-plan-sections\|step-decl\|plan-elements\|generated:` → **0 hits** (unchanged from round 3) |
| `claude-plugins/expert-dev-tools/docs/plans/plan-expert-dev-tools-behavioral-remediation.md` | prior inventory | [x] | Grep `step-decl\|generated:` → **0 hits** — no retrofit was performed, so the Applicability rule is honored. Modified in the working tree by the separate concurrent correction thread; out of this change's scope. |
| `claude-plugins/expert-dev-tools/docs/reviews/output-contract-generated-sections-round-03.md` | prior review record | [x] | Read 1–169 in full |
| `git show 94a640a:…/output-contract.md` (baseline) | prior inventory | [x] | Read via `git diff HEAD` against it |
| H-1..H-4 as closure items | prior findings | [x] | Each re-derived from current source; dispositions in the table below |

Fix-diff dependents: the script has no importers; the contract's only in-repo dependents are `SKILL.md` (grep above, 0 hits) and the three mirror copies, which round 3 established carry no `scripts/` directory and an older revision. Both covered.

Procedural note: `collaborativereasoning` was again rejected on its first call with a schema-validation error on the persona `communication.style` / `.tone` enums, and succeeded on the second call with corrected values. This is the third consecutive round to record this same infrastructure failure. The multi-perspective check ran as designed on the successful call, with the standards-discipline, downstream-consumer, and implementer personas.

## Summary

**This review returns NEEDS FIXES.** All four round-3 findings are genuinely closed, and — unusually for this cycle — each was closed as a class rather than as the instance the review named. H-1's fabricated backstop was resolved by making the control real (§16 now requires a file-list reconciliation against `git diff --stat`) rather than by deleting the claim, and all three citation sites were rewritten to describe what actually exists; H-2's five undocumented constraints are all now stated where an author reads them, with a binding maintenance rule added; H-3's "dominant line ending" is gone from the whole file; H-4's spurious diagnostic no longer fires on any malformed vocabulary. No round-1 or round-2 behavior regressed. What blocks the verdict is the same seam H-2 opened, approached from the direction the H-2 fix did not cover. The new maintenance rule binds a change in the script to a contract update, but nothing binds the contract's assertions and its own examples back to the parser — and in that unguarded direction the contract now models a `step-decl` block in a form the parser rejects outright. An author who copies the contract's canonical example gets thirteen errors and a halt, with no documented remedy.

## Upstream Contract Verification

No formal spec or architecture document governs this change. The binding upstream artifacts are the owner ruling in `docs/HANDOFF.md`, the prior contract's stated closure condition, and rounds 1–3's findings.

| Upstream requirement | Status | Verification method |
|---|---|---|
| Owner ruling: the drift surfaces "have to be converted, not swept harder" | Honored | Read the contract: §2 and §5 are generated regions written only by the script |
| "a machine-readable step declaration … from which §2, §5 and §12 are generated" | Honored, with disclosed narrowing | Read the "Generated — written only by the script" paragraph: §12 is cross-checked rather than generated, narrowing and reason stated. Closed at round 2; unchanged. |
| Owner authorization dated 2026-08-08 | Present | Read `SKILL-CHANGELOG.md` entry 6, quoted authorization |
| Applicability rule: the in-flight plan is not retrofitted mid-cycle | Honored | Grep `step-decl\|generated:` over `docs/plans/plan-expert-dev-tools-behavioral-remediation.md` → **0 hits**; HANDOFF.md's dispatch pin at `94a640a` unchanged |
| Round 3 verdict NEEDS FIXES — all four findings remediated | Met | H-1..H-4 all closed; evidence below |

### Round-3 finding dispositions

Each re-derived from current source. Changelog entry 9's claims were treated as candidates, not as verification.

| # | Disposition | Verification (executed or Read/grep'd, never accepted from the changelog) |
|---|---|---|
| **H-1** Serious — the named compensating control did not exist | **Closed** | Resolution 1 of the two the review offered (make the control real). Read the contract's §16: it now requires "a **file-list reconciliation**: `git diff --stat` against the pre-implementation baseline is compared with section 5's generated file→step table in both directions." All three citation sites re-read and each now cites *that* check and states why no delivery-time equivalent can exist: script header lines 55–58 ("No delivery-time check can catch a phantom path (there is no diff before implementation); the backstop is the contract's section-16 post-completion file-list reconciliation"); inline comment lines 130–133 (same, "implementation-time, because no diff exists before implementation"); changelog entry 8's G-2(b) bullet, amended in place with the historical correction stated rather than silently rewritten. The claim is now true and the control is where a diff genuinely exists. |
| **H-2** Systemic — five parser-enforced constraints absent from the contract | **Closed, and closed as a class** | All five re-located in the contract by Read, and each re-probed for reachability: (1) non-empty vocabulary — §2 "**at least one element; `elements: []` is an error**"; probe exit 1. (2) single whitespace-free tokens — §7 "List entries are **single whitespace-free tokens**"; probe `[my file.md]` exit 1. (3) duplicate entries — §7 "a **duplicate entry within one list is an error**"; probe exit 1. (4) acyclicity — §7 "The `depends_on` graph must be **acyclic**: self-dependencies and cycles are errors"; self-edge probe exit 1. (5) marker-line form — workflow bullet "Each begin marker must end its line and its end marker must follow on a later line"; trailing-content probe exit 1 in **both** check and regenerate mode. The class-closing item the review asked for is present as a new workflow bullet: "**This contract and the script move together.** Any change to what the script accepts, rejects, or checks carries a same-edit update to this contract's grammar and workflow text (and its changelog entry)." |
| **H-3** Minor, recurring — "dominant line ending" at line 90 | **Closed, swept as a class** | `grep -n "dominant"` over the script → **exit 1, 0 hits**. Read line 92: `// F-1: emit with the document's line ending (any CRLF present means CRLF, else LF)`. Changelog entry 6's F-1 bullet also corrected (Read via diff), which is the sibling location the round-3 finding predicted would otherwise be left behind. |
| **H-4** Minor — spurious `elements: []` diagnostic on any parse failure | **Closed** | Read lines 158–167: `errsBefore` guard gates the empty-vocabulary error on `errors.length === errsBefore`. Executed five vocabularies: `[R-1, R-1]`, `["R-1"]`, `[R-1 x]`, `[R-1,]` each emit **exactly one** error — their own — and exit 1; genuine `[]` still emits the empty-vocabulary error and exits 1. No probe produced the spurious second line. |

### Regression probes (round-1 / round-2 behaviors the round-3 edits could have disturbed)

All re-verified; none regressed.

- **F-1 CRLF fixed point:** an all-CRLF fixture regenerates and then `--check` exits 0; byte count after regeneration is 58 CRLF / **0 bare LF**.
- **LF idempotence:** two consecutive regenerate runs on an LF fixture — first `regenerated: coverage, files (2 steps)`, second `no changes: regions already current`, both exit 0.
- **F-8 `$` literal rendering:** a path `src/$&weird.js` renders intact in the generated table (`| src/$&weird.js | create | S1 |`).
- **F-10 duplicate marker pairs / multiple `plan-elements` blocks:** two `plan-elements` blocks → `ERROR: found 2 plan-elements blocks — exactly one is allowed`, exit 1.

## Critical & Serious Findings

### I-1 (Serious, new) — the contract's own canonical `step-decl` example is in a form the parser rejects wholesale

**What the artifact does.** The parser reads a `step-decl` block line by line and requires every key line to begin at column 0: `derive-plan-sections.mjs:192–194` matches a top-level key with `/^(\w+):\s*(.*)$/` and then explicitly requires `!/^\s/.test(ln)`, while the sub-key branch at line 193 matches only `create|modify|delete`. Any other indented line falls through to line 225, `errors.push(\`${where}: unparseable line: ${ln.trim()}\`)`.

The contract's canonical example, however, is indented four spaces. `cat -A` of `output-contract.md:19–28` shows `    ```step-decl$`, `    step: S12$`, `    covers: [R-3]$`, `      create: []$`, and so on — indented because the whole declaration paragraph sits inside numbered list item 7, where markdown requires continuation content to be indented.

**How that claim was verified.** By execution and by byte display, not by reading. I took a fixture that passes cleanly (`--check` → `OK: 2 steps, 2 elements, 2 test specs, regions current`, exit 0) and indented one `step-decl` block by four spaces, exactly as the contract presents it. Result: **exit 1 with thirteen errors** — eight `unparseable line` (one per key line), five `missing required key`, and then three cascading downstream errors (`step S2 depends on undeclared step S1`, `element R-1 … no step covers it`, `test T-1 is specified but no step references it`). The indentation was applied by script to the block's lines only, so nothing else in the fixture changed.

The absence half of the claim — that the contract nowhere states the requirement — was established by grep: `grep -inE "indent|column|left margin|unindented|top level|top-level"` over `output-contract.md` returns **1 hit**, the §7 grammar paragraph, whose text I read in full. It says "five top-level keys, each appearing exactly once" — "top-level" there names the key's position in the key hierarchy (as against the `files:` sub-keys), not its column in the document. Nothing in the contract, the script header, or `SKILL.md` (grep → 0 hits) tells an author the block must start at column 0.

**Standard violated.** Documentation-as-contract, applied exactly as this project already applies it and as round 3's H-2 applied it: a constraint the implementation enforces that the specification does not state is a trap for the party the specification exists to serve. This instance is materially worse than any of H-2's five, because the contract does not merely omit the constraint — it *demonstrates the rejected form* as the thing to copy. An author who does what a specification's worked example shows is doing the one thing a specification most strongly authorizes.

**Why it matters.** The failure mode is total, not partial. A single indented declaration does not produce one localized error the author can read past; it produces thirteen, including three that point at entirely different sections of the plan (a missing test reference, an uncovered element, an unresolved dependency) and will send the author editing §12 and §2 in search of a defect that is not there. And under the contract's own doctrine — "**If Node.js is unavailable in the environment, this gate cannot run — that is a halt, not a waiver**," with Gate C requiring `--check` to exit 0 — a failing check stops delivery. The author is halted, with the diagnostics pointing away from the cause and the contract's example vindicating the input.

**Correct implementation.** Two acceptable resolutions; either closes it, and they are not equivalent in cost.

1. *Make the parser accept what the contract shows.* Strip a common leading indent from the block before parsing — capture the fence's own indentation from the `step-decl` / `plan-elements` regexes and remove exactly that prefix from each line, erroring if a line does not carry it. This preserves the contract's natural markdown presentation and is the resolution that does not require every plan author to fight their own document structure. The same treatment is needed for `plan-elements`, which has the identical exposure.
2. *State the constraint and de-indent the example.* Add to §7's grammar paragraph that the fence and every line inside it begin at column 0, move the example out of the numbered item so the contract models a form the parser accepts, and add the same note for the `plan-elements` block in §2.

Resolution 1 is the stronger choice: §7 is a numbered list, and requiring column-0 blocks inside a numbered list item produces a document whose markdown structure fights its own specification. Whichever is chosen, `plan-elements` must be covered in the same edit — it has the same parser (`/^elements:\s*(.*)$/m` at line 152 against the block body) and the same presentational exposure.

## Systemic Patterns

### I-2 (Systemic, new) — the contract↔script reconciliation was performed in one direction only; the reverse direction and the contract's examples are unguarded

**The pattern.** Round 3's H-2 fix did two things: it stated the five missing constraints, and it added a binding rule — "**This contract and the script move together.** Any change to what the script accepts, rejects, or checks carries a same-edit update to this contract's grammar and workflow text." That rule is real, correctly placed, and closes the direction it names: *script changes → contract update*. It says nothing about the other two directions, and both now carry live defects: assertions the contract makes that the script does not enforce, and forms the contract exhibits that the script rejects.

**Proactive scan.** The pattern's signature is "the contract and the parser disagree, in a direction the new maintenance rule does not cover." I decomposed it into a full two-directional walk: I enumerated every grammar assertion in §7's paragraph and §2's `plan-elements` spec (Read in full — thirteen assertions), then checked each against the parser by Read of the enforcing line plus, where a behavior was at stake, execution. Thirteen assertions checked; **ten hold in both directions, three do not.**

| # | Contract assertion / presentation | Parser reality | Direction | Verification |
|---|---|---|---|---|
| 1 | Example block presented indented four spaces (`output-contract.md:19–28`) | Rejects any indented line (lines 192–194, 225) | contract example → parser | `cat -A` + execution, exit 1, 13 errors. **This is I-1.** |
| 2 | "All five keys are required; **empty lists are written `[]`**" — the example writes all three `files:` sub-keys explicitly | Missing `files:` sub-keys silently default to `[]` (line 185 initializer; no required-sub-key check anywhere in lines 217–230, which validate only the five top-level keys) | contract → parser (fail-open) | Executed: a step declaring only `create: [a.js]`, with `modify:` and `delete:` lines deleted, regenerates **exit 0** and `--check` **exit 0** with no error of any kind; the generated table shows `a.js create S1` as though the author had written the empty lists. |
| 3 | Step ID is "`S<number>`, optionally suffixed **`a`/`b`** for inserted steps" | `/^S\d+[a-z]?$/` (line 231) accepts any letter a–z | contract → parser (parser more permissive) | Read of both lines at drafting time |

The ten that hold — inline-list-only form, block sequences rejected, flow mappings rejected, quoting rejected, comments rejected, single whitespace-free tokens, no commas/brackets/braces in entries, duplicate entry rejected, `depends_on` acyclicity, five top-level keys each exactly once — are what makes the three a defect rather than a scope choice: the contract does undertake to reproduce the grammar faithfully, and round 3's H-2 closure rested on exactly that undertaking.

**Standard violated.** Two named standards, one per direction. For instance 2, **fail-closed validation** — the same standard round 1's F-2 class and round 2's G-1 were decided under: an omitted declaration and an explicitly empty one are different authorial acts, and a validator that silently equates them accepts input it cannot faithfully represent. The `files:` list is the plan's declared blast radius; a step whose author forgot the `delete:` line and a step that genuinely deletes nothing produce byte-identical output, and §16's new file-list reconciliation will not catch the difference either, because the omitted deletion never reaches the table it compares against. For instances 1 and 3, **documentation-as-contract**, as in H-2.

**Why systemic rather than isolated.** Three instances is not the argument; the shared cause is. Every one of them was reachable by the reconciliation the round-3 fix performed, and none was caught, because that sweep enumerated *the script's error messages* and checked whether the contract mentioned each — a script→contract walk. Nothing in the fix, and nothing in the rule it added, walks contract→script or checks the contract's examples against the parser. That asymmetry is structural, not an oversight in this pass: the rule as written will be satisfied by round 5's corrections and will still let a contract assertion drift away from the parser, or an example rot into an unparseable form, without any check firing. This is the same shape as the drift class the whole change set exists to close — a surface that nothing checks — reappearing one level up, in the relationship between the contract and its enforcement.

**Correct implementation.** Fix the three instances, naming which side moves for each, then close the class:

- Instance 1 (I-1): per I-1's resolution — preferably teach the parser to strip the fence's own indentation.
- Instance 2: **the parser moves.** Require all three `files:` sub-keys when `files:` is present, exactly as the five top-level keys are required — extend the loop at lines 228–230 with a sub-key check against `seenSub`, erroring `missing required files sub-key 'delete'`. Do not relax the contract instead; the contract's fail-closed posture is the correct one and the example already shows all three.
- Instance 3: **the contract moves.** Change "optionally suffixed `a`/`b`" to "optionally suffixed with a single lowercase letter", matching `/^S\d+[a-z]?$/`. Narrowing the regex to `[ab]` would be the wrong direction — the permissive form is useful for a third insertion.
- **Class closure:** extend the "This contract and the script move together" bullet to bind both directions and the examples — any change to what the *contract asserts about the grammar* carries a same-edit check that the script enforces it, and every fenced example in the contract is itself run through the script before the contract is delivered. The second half is the mechanically checkable one and is worth stating that way: the contract's own `step-decl` and `plan-elements` examples should be extractable into a fixture the script parses clean, which would have caught instance 1 the moment it was written.

## Moderate & Minor Findings

No Moderate or Minor findings. Verified by the two-directional grammar scan recorded under I-2 (thirteen assertions walked, three divergences found, all three folded into I-1 and I-2 as instances of their respective patterns rather than reported separately) and by the regression probe set recorded in Scope and Inventory (CRLF fixed point, LF idempotence, `$`-literal rendering, multi-block rejection), none of which surfaced a deviation.

## Tentative Findings

No tentative findings — every finding's premise was verified by executing the script against a purpose-built synthetic fixture in the session scratchpad, by `cat -A` byte display, by `grep` with its query and result count recorded, or by Read at a cited line at drafting time. No candidate was dropped for want of an instrument.

## Observations

- `SKILL.md` still contains zero references to the script, `step-decl`, `plan-elements`, or the markers (grep, 0 hits), unchanged from round 3. This carries no standard violation on its own — the contract is a `references/` file the skill directs the author to, so the author does reach it — but it is why the contract's completeness as a grammar specification is load-bearing, and why I-1 has no second source that could rescue an author.
- The in-flight plan `docs/plans/plan-expert-dev-tools-behavioral-remediation.md` contains no `step-decl` or generated markers (grep, 0 hits), confirming the Applicability rule was honored rather than merely written. It remains modified in the working tree by the separate concurrent correction thread and is outside this change's scope; no finding here rests on its contents.
- Changelog entry 8's G-2(b) bullet was corrected by *amending in place with the history stated* ("This entry originally named a 'delivery-time diff-vs-§5 check' as the backstop; round 3's H-1 established no such delivery-time check can exist") rather than by silently rewriting the past entry. No standard violation; recorded because a changelog that rewrites its own history is a common and harder-to-detect failure, and this change set did not take that path.

## What's Actually Good

- **H-1 was closed by the more expensive of the two offered resolutions, and the resulting control sits where a diff actually exists.** Round 3 offered "make the control real" or "delete the claim and disclose the risk." The fix took the first: §16 now requires a two-directional `git diff --stat` vs §5 reconciliation, and — the part that makes it correct rather than merely present — it is placed in Post-completion, after implementation, with the three citation sites each stating explicitly *why* no delivery-time equivalent can exist. Verified by Read of §16 and of all three citation sites. **Standard:** honest risk disclosure with a named compensating control — the control is now real, correctly located in the lifecycle, and its limits are stated rather than glossed.
- **H-3 was swept as a class rather than at the line the review named.** Round 3 explicitly warned that H-3 was recurring precisely because the prior pass fixed the instance it was shown, and asked for a grep-driven sweep. `grep dominant` now returns 0 hits across the script, and entry 6's F-1 bullet in the changelog — a sibling location the review named as at-risk but did not itself locate — was corrected too. **Standard:** the project's own re-derive-never-patch doctrine, applied to a documentation defect. Verified by grep with the result count recorded, not by reading the changelog's claim that the sweep happened.
- **The H-4 fix is minimal and provably scoped.** The `errsBefore` guard (lines 160–166) gates the empty-vocabulary error on whether `parseList` pushed anything, which is the narrowest possible correction — it changes no exit code and no other diagnostic. Verified by executing five distinct malformed vocabularies plus the genuine `[]`: each emits exactly one error, its own, and all six exit 1. **Standard:** diagnostic accuracy, with the fix bounded to the defect rather than restructuring the surrounding validation.

## Convergence Record

**Round number:** 4 (third Post-fix round; matches Scope and Inventory).

**Trajectory:** R1: 10 findings (1 Critical, 1 Systemic, 2 Serious, 4 Moderate, 2 Minor) → R2: 5 (1 Systemic, 1 Serious, 1 Moderate, 2 Minor) → R3: 4 (1 Systemic, 1 Serious, 2 Minor) → **R4: 2 (1 Systemic, 1 Serious)**.

**Flow counts for this round.** Prior findings closed: **4** — H-1, H-2 (all five instances re-probed individually), H-3, H-4, each re-derived by execution, grep, or Read against its originally named standard. New: **2** — I-1, I-2. Recurring: **0** — no prior finding survives at the same standard and location. Regressions: **0** — the round-3 edits were probed against every round-1 and round-2 behavior they could have disturbed (CRLF fixed point, LF idempotence, `$`-in-path rendering, multi-`plan-elements` rejection, all five H-2 constraint behaviors in both check and regenerate mode) and none broke. I-1 and I-2 are pre-existing conditions the round-3 sweep passed over, not behavior the round-3 corrections broke: the parser's column-0 requirement and the `files:` sub-key default both date to the original script (they are unchanged in the round-3 diff), and the contract's indented example has been indented since change 6.

**Tripwire evaluation — NOT FIRED**, arithmetic shown:

- Condition (a): new + regression ≥ closed, for two consecutive Post-fix rounds. **This round: 2 + 0 = 2, against 4 closed. 2 ≥ 4 is false.** Round 3: 3 + 0 = 3 against 4 closed; false. Round 2: 4 + 0 = 4 against 9 closed; false. The condition has held in none of the three Post-fix rounds, so two consecutive occurrences have not accrued.
- Condition (b): total findings not strictly decreasing, for two consecutive Post-fix rounds. **10 → 5 → 4 → 2.** Every transition is a strict decrease. The condition has held in no round.

Neither condition has fired once, let alone twice. The substantive reading supports the arithmetic. Round 3 observed that the Systemic pattern had changed class — from fail-open validation (R1, R2) to documentation sweep (R3). This round it has changed class again, and narrowed: I-2 is not "the contract omits constraints the script enforces" (that class is closed — five for five, verified by probe) but "the contract↔script reconciliation runs in one direction." That is the meta-level of the same relationship, with three instances rather than five, and one of the three is a wording change. Each round's Systemic finding has been strictly upstream of and smaller than its predecessor, which is what converging out of a class looks like rather than churning within one. The Critical class closed at round 2 and has stayed closed; Serious is 2 → 1 → 1 → 1 and the surviving instance is a documentation defect rather than a validation one.

## Recommended Priority

The tripwire has not fired, so another fix round is the indicated path rather than foundational rework.

1. **I-1 first, and choose resolution 1 (teach the parser to strip the fence's indentation).** It is the only finding that will stop the first real plan author dead, and the contract's presentation is not the thing that should bend — §7 is a numbered list and a column-0 requirement inside it produces a document at war with its own markdown. Apply it to `plan-elements` in the same edit; the exposure is identical and fixing only `step-decl` leaves the second half of the same defect in place. If resolution 2 is chosen instead, the example must actually move out of the numbered item — stating the constraint while leaving the indented example in place would close nothing.
2. **I-2 as a class, with each instance's side named before any edit.** Instance 2 moves the parser (require all three `files:` sub-keys), instance 3 moves the contract (`a`/`b` → a single lowercase letter). Fixing them in the wrong direction is a live risk here: relaxing the contract to match the fail-open sub-key default would be the exact inversion of the fail-closed standard this project has decided under three times.
3. **The class-closing item is the part that determines whether round 5 is clean.** Extend the "This contract and the script move together" rule to bind both directions, and make the example half mechanical: extract the contract's fenced `step-decl` and `plan-elements` examples into a fixture and run the script over it as part of the delivery check. That single mechanism would have caught I-1 at the moment it was written, and it converts the one remaining hand-maintained guarantee in this change set into a checked one — which is the same move, one level up, that the whole change set made for §2 and §5.

Carried forward for the third round running, and still not a finding: every probe across all four rounds has run against synthetic fixtures built by reading the parser. I-1 is the clearest possible vindication of the warning rounds 2 and 3 both recorded — it is invisible to fixture-only testing because the fixture author writes the block at column 0 without thinking about it, and it is immediately visible the first time anyone runs the script against a document whose steps are a numbered list. Before round 5 is dispatched, run the repaired script once against a real prose document with two or three steps declared in their natural position inside section 7.

Verdict: NEEDS FIXES (2 findings: 1 Systemic, 1 Serious)
