# Expert Review — expert-plan output contract: derived sections become generated

Round 2 (Post-fix review of round 1). Reviewer: independent subagent, 2026-08-08.
Persisted verbatim by the reviewing session; no edits beyond persistence.

## Scope and Inventory

**Round number:** 2. Prior round: `docs/reviews/output-contract-generated-sections-round-01.md` (NEEDS_FIXES, ten findings F-1..F-10).

**Instruments available:** Read, Grep, Bash (git, Node v22.16.0, Python 3), Clear Thought. Context7 not required — the script's only import is `node:fs` (Read, `derive-plan-sections.mjs:54`), so there is no library-behavior claim category in scope and no Step 3 halt condition.

**Claim-type mapping:** behavioral claims about the script → executed fixture runs (probes 1, F-1, F-2a–d, F-3, F-5, F-6, F-8, F-10, N1a–d, N2–N12, in the session scratchpad, all against synthetic fixtures — nothing in the repository working tree was run in write mode); literal-content claims → Read at file:line; absence claims → grep with query and count; line-ending claims → byte-level CRLF/bare-LF counts; prior-round closure claims → re-derived from current source by execution, never from the changelog's assertion.

Post-fix inventory, all four sources:

| File | Source | Status | Verification |
|---|---|---|---|
| `claude-plugins/expert-dev-tools/skills/expert-plan/references/output-contract.md` | prior inventory + fix-diff | [x] | Read via full `git diff HEAD`; byte count 119 CRLF / 0 bare LF |
| `claude-plugins/expert-dev-tools/skills/expert-plan/scripts/derive-plan-sections.mjs` | prior inventory + fix-diff | [x] | Read 1–331 in full; executed in 24 fixture probes; byte count 0 CRLF / 330 bare LF |
| `claude-plugins/expert-dev-tools/docs/SKILL-CHANGELOG.md` (entries 6 and 7) | fix-diff | [x] | Read via `git diff HEAD`, lines 236–347 |
| `claude-plugins/expert-dev-tools/docs/HANDOFF.md` | prior inventory + dependent | [x] | Read 1–123; `git diff HEAD --stat` → empty (unmodified by this change) |
| `claude-plugins/expert-dev-tools/skills/expert-plan/SKILL.md` | prior inventory | [x] | Grep `derive-plan-sections\|step-decl\|plan-elements\|generated:` → **0 hits** |
| `claude-plugins/expert-dev-tools/docs/plans/plan-expert-dev-tools-behavioral-remediation.md` | prior inventory | [x] | Grep `step-decl` → 0 hits |
| `claude-plugins/expert-dev-tools/docs/reviews/` | prior inventory (closure items) | [x] | `ls` → round-01 of this change, plan rounds 01 and 02; **no round-04 record present** |
| `git show 94a640a:…/output-contract.md` (baseline) | prior inventory | [x] | Read via diff |
| 3 mirror copies of `expert-plan/references/output-contract.md` | prior inventory | [x] | All three exist; `ls` of two accessible mirror skill dirs shows `SKILL.md` + `references/` only — **no `scripts/` directory in either** |
| F-1..F-10 as closure items | prior findings | [x] | Each re-derived from current source by execution or Read; dispositions below |

Fix-diff dependents: the script has no importers (it is a standalone entry point, `#!/usr/bin/env node`, Read line 1); the contract's only dependents are `SKILL.md` (grep above) and the three mirrors, both covered.

`docs/investigate.md` was consulted as context only; no finding rests on it. No rigor waivers — no compression was requested. Procedural note: `collaborativereasoning` succeeded on the second call after a schema-validation rejection of the persona `communication` enums on the first; the multi-perspective check ran as designed.

## Summary

**This review returns NEEDS_FIXES.** The corrections are substantial and mostly real: nine of ten round-1 findings close against their originally named standards, and I confirmed each by execution rather than by reading the changelog's claims. The Critical CRLF non-convergence is genuinely fixed and now survives re-normalization; the argument-order fail-open is fixed and check mode is structurally incapable of writing; the `$`-interpolation, locale, section-scoping, and duplicate-marker defects are all closed. What blocks the verdict is that the gate can still report `OK: regions current`, exit 0, on a document whose generated region contains arbitrary stale content — I reproduced this four ways, the least visible being a single trailing space after the begin marker. Two of the round-2 findings live inside round-1 corrections: the marker fix validated marker *counts* but left present-yet-unmatchable markers silent, and the element-vocabulary fix ships with an off switch (`elements: []` disables completeness checking in both directions, with no diagnostic). The fail-open class round 1 named Systemic is narrower than it was, but it is not closed.

## Upstream Contract Verification

No formal spec or architecture document governs this change. The binding upstream artifacts are the owner ruling in `docs/HANDOFF.md`, the prior contract's stated closure condition, and round 1's findings.

| Upstream requirement | Status | Verification method |
|---|---|---|
| Owner ruling: the drift surfaces "have to be converted, not swept harder" (`HANDOFF.md:71`) | Honored | Read `HANDOFF.md:66–71`; the change converts §2 and §5 to generated regions |
| `HANDOFF.md:120–123`: "a machine-readable step declaration … from which §2, §5 and §12 are generated" | Honored, with disclosed narrowing | Read the diff: §12 is cross-checked rather than generated, and the contract now **states** the narrowing and its reason in the "Generated — written only by the script" paragraph. Round 1's Upstream-table objection was that the narrowing was undisclosed; it is now disclosed. Closed. |
| Owner authorization dated 2026-08-08 | Present | Read `SKILL-CHANGELOG.md` entry 6, quoted authorization |
| Round 1 verdict NEEDS_FIXES — all ten findings remediated | Not fully met | F-2 remains open at instance 3; see G-2. Nine others closed, evidenced per finding below. |

### Round-1 finding dispositions

Each re-derived from current source; the changelog's claims were treated as candidates, not verification.

| # | Disposition | Verification (executed unless noted) |
|---|---|---|
| F-1 Critical (CRLF non-convergence) | **Closed** | CRLF fixture (50 CRLF / 0 bare LF): `--check` → STALE exit 1; regenerate → 56 CRLF / **0 bare LF**; `--check` → OK exit 0. Re-normalized to CRLF (simulating `git checkout` under `core.autocrlf=true`) → `--check` still OK exit 0. Fixed point reached. Mechanism: Read `derive-plan-sections.mjs:82`, `eol` threaded through lines 262, 282, 305. |
| F-2 Systemic i1 (`files:` inline value) | **Closed** | `files: {create: [zzz.js]}` → `ERROR: 'files:' takes no inline value` + 3 unparseable-line errors, exit 1. Read lines 164–170. |
| F-2 Systemic i2 (duplicate key overwrite) | **Closed** | Two `covers:` keys → `ERROR: duplicate key 'covers'`, exit 1. Read lines 155–159. |
| F-2 Systemic i3 (comma splits an entry) | **NOT closed** | `create: [src/my, file.js]` still yields two rows, `src/my` and `file.js`, no error; after regeneration `--check` exits 0. See G-2 instance (b). |
| F-3 Serious (argument order) | **Closed** | `node … f3.md --check` → STALE exit 1, md5 `756677ca…` unchanged before and after. Unknown flag, two operands, and zero operands each exit 1 with usage errors. Read lines 63–71; `writeFileSync` appears only at line 325, inside the non-check branch. |
| F-4 Serious (in-flight plan applicability) | **Closed at the contract** | Read the new **Applicability** paragraph in the diff: the regime governs plans authored after this revision; earlier plans are graded against their own revision. Residual at the operational surface → G-3. |
| F-5 Moderate (document-wide test scan) | **Closed** | `- **T-99** risk of flakiness` under `## 13. Risks` → `OK … regions current`, exit 0 (round 1: ERROR + exit 1). Read lines 223–237; bounds are heading-to-next-same-or-higher-level-heading. |
| F-6 Moderate (coverage completeness invisible) | **Closed** | Uncovered `R-3` → `ERROR: element R-3 is declared in plan-elements but no step covers it`, exit 1. Undeclared `R-9` in `covers:` → `ERROR: step S2 covers 'R-9', which is not in the plan-elements vocabulary`, exit 1. Bypass → G-2 instance (a). |
| F-7 Moderate ("YAML" mislabel) | **Closed** | Read the diff: §7 now reads "restricted key/inline-list grammar (**not general YAML**)" and reproduces the constraints in the contract. Confirmed enforced: quoted entry `["a.js"]` → `ERROR: … contains bracket/brace/quote characters`, exit 1; a comment line → parse error. |
| F-8 Moderate (`$` in path corrupts region) | **Closed** | `create: [src/$&weird.js]` → region renders `\| src/$&weird.js \| create \| S1 \|` intact, markers undamaged, `--check` OK exit 0. Read line 305: replacer function, not a template string. |
| F-9 Minor (`<skill>` placeholder, Node disposition) | **Closed** | Read the diff: path now resolves as "the sibling of the `references/` directory this file lives in"; verified `ls skills/expert-plan/` → `references/` and `scripts/` are siblings. A dedicated bullet states Node-unavailability is a halt, not a waiver. |
| F-10 Minor (locale, duplicate markers) | **Closed** | Read lines 259 and 280: both sorts pin `localeCompare(…, 'en', { numeric: true })`. Duplicate `files` marker pair → `ERROR: marker 'files' occurs 2 times`, exit 1. Missing markers → `ERROR: missing region markers for 'files'`, exit 1. |

## Critical & Serious Findings

### G-1 (Serious, new) — `--check` reports `OK: regions current` on a stale generated region whenever the marker pair is present but unmatchable

**What the code does.** `derive-plan-sections.mjs:292–301` validates that each marker's begin and end string occurs exactly once, then line 302 builds ``new RegExp(`(<!-- generated:${name} begin -->)\\r?\\n[\\s\\S]*?(<!-- generated:${name} end -->)`)`` and line 305 replaces. Staleness is inferred at line 306 solely from `next !== updated`. When the regex does not match — which the count validation does not detect — `replace` is a no-op, `stale` never receives the region's name, and check mode falls through to the `OK` message at line 322.

**How that claim was verified.** Read lines 292–322 at drafting time, plus four executed probes, each run to a clean state (regenerate, then `--check`):

1. *Trailing space after the begin marker* (`<!-- generated:files begin --> ` + newline): `--check` → `OK: 2 steps, 2 elements, 2 test specs, regions current`, **exit 0**, while the region body still literally reads `stale`.
2. *Content on the begin-marker line* (`<!-- generated:files begin --> stale`): regenerate exits 0 reporting only `coverage`; subsequent `--check` → OK, exit 0; region body still `stale`.
3. *Markers in reverse order* (`end` … `begin`): regenerate exits 0, `--check` → OK, exit 0, body still `stale`.
4. *Both markers on one line* (`<!-- generated:files begin --><!-- generated:files end -->`): `--check` → OK, exit 0.

In all four the `beginCount`/`endCount` checks pass because each string occurs exactly once.

**Standard violated.** Fail-closed validation — a validator must reject input it cannot faithfully process, never treat non-processability as conformance. Reinforced by the ecosystem convention this tool's `--check` mode imitates (`gofmt -l`, `prettier --check`, `terraform fmt -check`): a file the tool cannot parse into its managed form is reported, not silently passed.

**Why it matters.** This is the gate defeating itself on exactly the property the change exists to install. The contract's Gate C says "`scripts/derive-plan-sections.mjs --check` exits 0 against the delivered document — generated regions current … A plan delivered without a passing check is non-compliant regardless of how its tables read." Under G-1 a plan can carry a hand-written, arbitrarily stale files table and produce a green check, and the reviewer — instructed by the contract to trust the exit code over how the table reads — will accept it. Trigger 1 is the serious one: a trailing space is invisible in every editor, is produced routinely by markdown formatters and by careless hand-editing near a marker, and survives review by eye. Round 1 correctly identified falsely-green as worse than red (F-3); this is the same failure through a different door, and it lands on the section rather than the flag.

**Correct implementation.** Make non-match an error rather than a silent pass. After building `re`, test it before replacing:

```js
if (!re.test(updated)) {
  errors.push(`region '${name}': markers present but not a well-formed region — the begin marker must be alone on its line, immediately followed by the region body, with the end marker after it`);
  continue;
}
```

and tolerate trailing whitespace on the marker lines by anchoring with `[ \t]*\r?\n` instead of `\r?\n`. Both changes together: unmatchable regions fail loudly, and the most likely benign cause stops being a trigger at all.

## Systemic Patterns

### G-2 (Systemic) — the validator's failure direction is still silent acceptance rather than rejection; four remaining instances

**Proactive scan.** The pattern's signature — "accepts input it cannot faithfully represent, or omits a check, rather than erroring" — has no greppable form, so per Step 8 I decomposed it into branches and classified every one in the validation path by Read (`derive-plan-sections.mjs:95–115` `parseList`, `140–192` the step-decl loop, `196–246` the cross-checks, `289–308` the region machinery), then reproduced each fail-open candidate by execution. Fail-closed branches confirmed: lines 100, 106, 110, 122, 125, 155, 168, 173, 176, 182, 186, 188, 199, 204, 213, 217, 227, 241, 245, 295, 299. Fail-open instances found — four, each executed:

**(a) `elements: []` silently disables coverage completeness in both directions.** Line 213 guards the undeclared-element check with `elements.length > 0`, and the every-element-covered loop at 216–218 is vacuous over an empty list. Executed: a fixture declaring `elements: []` with steps covering `R-1` and `R-2` → `OK: 2 steps, 0 elements, 2 test specs, regions current`, **exit 0**, and the generated table lists both undeclared elements. The mechanism added to close F-6 — the round's headline completeness guarantee — is switched off by two characters, with no diagnostic. *Provenance: new (introduced by the F-6 correction).*

**(b) A comma inside a list entry still splits it into two phantom entries.** Executed: `create: [src/my, file.js]` → rows `src/my` and `file.js`, no error; `--check` exits 0 once regenerated. The correction forbade commas in prose (contract §7 and script header line 46) without adding detection. Round 1's named standard was fail-closed validation, and its stated fix was "forbid commas in identifiers **and error when one appears**"; only the first half was applied. Commas are legal in both POSIX and Windows filenames, so this is reachable input, and it corrupts the files table in the under-reporting direction — two paths that do not exist replace one that does. *Provenance: **recurring** — same standard, same location as F-2 instance 3.*

**(c) Duplicate entries within a single step's list are not detected.** Executed: `covers: [R-1, R-1]` → `OK`, exit 0, and the coverage table renders `| R-1 | S1, S1 |`. `plan-elements` has a duplicate check at line 124; the per-step lists have none, so the asymmetry is unintentional. *Provenance: new.*

**(d) `depends_on` is checked for existence but not for acyclicity.** Executed: `step: S1` with `depends_on: [S1]` → `OK`, exit 0. Lines 202–206 verify only that each dependency names a declared step. A step depending on itself — or two steps depending on each other — is an unsatisfiable ordering constraint in a document whose steps are executed in order, and the contract presents `depends_on` cross-checking as part of what the script guarantees; referential integrity without acyclicity is half of what the field is for. *Provenance: new.*

**Standard violated.** Fail-closed validation, across all four instances: the design contract of a schema validator is that unrecognized, ambiguous, or self-contradictory input is rejected rather than coerced or ignored. The contract's own framing binds it — it declares the declaration "the single source of truth for the derived surfaces," which holds only if the parser refuses input it cannot faithfully represent.

**Why systemic rather than isolated.** All four share one direction of failure: the tool silently under-reports or under-checks into tables whose entire purpose is completeness, and two of the four were *introduced or left behind by round 1's corrections* to this same class. That is the signature of point-fixes applied without sweeping the class — the failure mode this project's own correction doctrine names.

**Correct implementation.** (a) Drop the `elements.length > 0` guard and error when `elements` is empty — an empty vocabulary is a malformed declaration, not a permissive one. (b) Reject any `files:` entry containing whitespace, or require an escape for commas; erroring on a suspicious entry costs an author one edit and costs nothing when paths are ordinary. (c) Apply the line-124 duplicate check to every parsed list, not just `plan-elements`. (d) Run a topological sort over `depends_on` and error on any cycle, self-edges included.

## Moderate & Minor Findings

### G-3 (Moderate, new) — the contract's Applicability rule depends on a dispatch behavior that no operational document provides

The new Applicability paragraph closes F-4 by ruling that a plan authored under an earlier revision "is graded against the revision it was written under (**cite it by commit in the review dispatch**)." That places a requirement on the dispatch. `docs/HANDOFF.md` is the document that specifies the round-4 dispatch, and it is unmodified by this change (`git diff HEAD --stat -- docs/HANDOFF.md` → empty). It still reads, at lines 88–91, "Dispatch it to a **fresh** reviewer with the artifact, the prior-round records, the plan's inputs, and **the governing output contract** — pointers only" — with no revision pin, and with an explicit prohibition on author-supplied direction that makes an ad-hoc verbal pin awkward to add. A reviewer handed "the governing output contract" resolves it to the working tree, which is now the new revision, and grades a 26-step plan with zero `step-decl` blocks (grep → 0 hits) against a contract it structurally cannot satisfy — the precise outcome F-4 was raised to prevent.

**Standard:** first-principles (no published standard applies) — a rule that delegates its enforcement to another document is only in force once that document carries the delegated obligation; until then the rule is a statement of intent with a live counterexample in the repository. **Fix:** amend `HANDOFF.md:88–91` to name the pin — "the governing output contract **at revision `94a640a`, which is the revision this plan was authored under**" — in the same edit as the contract change, since the two are one mechanism.

### G-4 (Minor, new) — the changelog asserts a round-4 dispatch the repository does not corroborate and `HANDOFF.md` contradicts

Changelog entry 7 states, in the past tense: "(The in-flight `docs/plans/plan-expert-dev-tools-behavioral-remediation.md` is governed by revision `94a640a`, and **its round-4 review was dispatched with that pin**.)" This is an author's claim inside the artifact under review, so per Step 6 I re-derived it: `ls docs/reviews/` returns only `output-contract-generated-sections-round-01.md`, `plan-behavioral-remediation-round-01.md`, and `-02.md` — no round-4 record — and `HANDOFF.md:84` still reads "**Round 4 of independent review is owed**," with `HANDOFF.md` unmodified. The claim may well be true of an in-flight dispatch not yet written to disk, but the changelog is a durable record and currently contradicts the operational document beside it. **Standard:** a change record's factual assertions must be verifiable from the artifacts it ships with — an unverifiable past-tense claim in a changelog becomes a prior-document claim that a future agent imports by reference, which is the failure the project's own correction doctrine names. **Fix:** state it in the form the evidence supports ("the round-4 dispatch is to cite revision `94a640a`") and update `HANDOFF.md` per G-3, so the two records agree.

### G-5 (Minor, new) — the script's header misdescribes the tool in three ways, including an example the tool rejects

All three are comment claims inside the artifact, re-derived from source per Step 6:

1. **The header's own example `step-decl` (lines 34–43) is rejected by the parser.** Twelve lines above it, line 32 states that comments are rejected — and the example carries an inline `#` comment on four of its seven lines. Executed verbatim as a fixture step: four errors, including `step ID 'S1                  # unique step ID, S<number> or S<number><letter>' does not match S<number>[letter]` and three `value must be an inline list [a, b] or [], got: [R-1, Q-3]        # element IDs …`. The contract's §7 example, by contrast, has no comments and parses cleanly (verified by execution). The canonical example an implementer will copy is the broken one.
2. **Line 46 omits quotes from the rejected-character list.** It reads "List entries must not contain commas, brackets, or braces"; line 109 also rejects `"` and `'` (executed: `["a.js"]` → error naming quotes). The contract's §7 text is correct and lists all four; the header is the one that drifted.
3. **Lines 51–52 claim the generator "detects the document's *dominant* line ending."** Line 82 is `/\r\n/.test(text)` — presence, not dominance. Executed: a fixture with one CRLF and 45 bare LF regenerates to 11 CRLF / 45 LF, i.e. the single stray CRLF causes CRLF regions to be injected into an LF document, increasing mixing rather than following the majority. The check still converges (`--check` → OK, exit 0 after regeneration), so the effect is cosmetic — but the documented behavior is the opposite of the implemented one, and a future maintainer reasoning from the comment will reason wrongly.

**Standard:** documentation accuracy as a premise-correctness requirement — this project applies exactly this rule to plans (contract §11) and to reviews; a tool's header comment is the first thing a maintainer treats as authoritative. **Fix:** strip the comments from the header example (or move the annotations below it as prose), add quotes to line 46's list, and either change line 51 to "the first line ending it finds" or implement dominance by counting.

## Tentative Findings

No tentative findings — every finding's premise was verified by executing the script against a purpose-built synthetic fixture, by Read at a cited line, or by grep or `ls` with its query and result recorded. The one item I could not resolve from the repository — whether the round-4 plan review was in fact dispatched with the `94a640a` pin — is reported in G-4 as an uncorroborated claim in the artifact rather than as a claim of my own about the dispatch.

## Observations

- The three mirror copies of the contract (`skills/Expert-Skills/expert-plan/`, `middleware/context-oracle/.claude/skills/expert-plan/`, `mcp-servers/aps-fusion-mcp-server/.claude/skills/expert-plan/`) all exist, and the two whose directories I listed contain `SKILL.md` and `references/` with no `scripts/` directory. This matches changelog entry 6's propagation note exactly — the mirrors are deliberately left on an older revision and the note says applying the change there requires carrying `scripts/` too. No standard violation; recorded because the mirrors are a place a later editor could partially apply this change and produce a contract referencing a script that isn't there.
- `SKILL.md` contains zero references to the script, `step-decl`, `plan-elements`, or the generated markers (grep, 0 hits). This is not a defect — the contract is self-describing about the script's location, which is what closed F-9 — but it means the entire new mechanism is reachable only through the contract reference, so a future edit that changes how `SKILL.md` points at `references/output-contract.md` silently detaches the gate.

## What's Actually Good

- **The F-1 fix reaches a genuine fixed point, not just a passing first run.** Verified by execution: regenerate a CRLF fixture, confirm 0 bare LF, `--check` OK; then re-normalize the whole file to CRLF as `git checkout` under `core.autocrlf=true` would, and `--check` is still OK. Round 1's failure was specifically that this second step re-broke the cycle. **Standard:** idempotence of a code generator — regenerate-then-check must be a no-op, the defining property of every `--check` mode in the ecosystem. The fix threads a single detected `eol` through both `join()` calls and the replacement, which is the minimal correct shape.
- **Check mode is structurally incapable of writing, not merely conditionally.** Read: `writeFileSync` appears exactly once, at line 325, inside the `else` branch of `if (checkMode)`. Combined with the rewritten argument loop (lines 63–71) that scans all of `process.argv.slice(2)` and rejects unknown flags and extra operands, verified by md5-unchanged execution in the reversed argument order. **Standard:** fail-closed validation applied to the tool's own invocation surface — the read-only mode cannot be turned into a write mode by any argument arrangement, which is stronger than round 1's recommended fix required.
- **The F-6 correction checks completeness in both directions, which is more than the finding asked for.** Round 1 asked for an error on any element with no covering step; the implementation adds the converse — a `covers:` entry naming an element outside the vocabulary — verified by two executed probes producing distinct errors. **Standard:** first-principles — a vocabulary-to-usage mapping is only sound when checked as a bijection over its domain; one-directional checking leaves the other half of the drift class open. (The `elements: []` bypass in G-2(a) is a gap in this mechanism's reachability, not in its design.)

## Convergence Record

**Round number:** 2 (first Post-fix round; matches Scope and Inventory).

**Trajectory:** R1: 10 findings (1 Critical, 1 Systemic, 2 Serious, 4 Moderate, 2 Minor) → R2: 5 findings (1 Systemic, 1 Serious, 1 Moderate, 2 Minor).

**Flow counts for this round.** Prior findings closed: **9** (F-1, F-3, F-4, F-5, F-6, F-7, F-8, F-9, F-10 — each verified against its originally named standard per the disposition table). New: **4** (G-1, G-3, G-4, G-5). Recurring: **1** (G-2, which carries F-2's unclosed instance 3 and widens the same pattern to three further instances). Regressions: **0** — I checked each round-1 correction for collateral breakage and found none; the two round-2 findings that originate inside corrections (G-1's residue of the F-10 marker work, G-2(a)'s bypass of the F-6 mechanism) are gaps left by those fixes, not previously-working behavior that the fixes broke.

**Tripwire evaluation — NOT FIRED**, arithmetic shown:

- Condition (a): new + regression ≥ closed, for two consecutive Post-fix rounds. This round: 4 + 0 = 4, against 9 closed. 4 ≥ 9 is **false**, so the condition does not hold even once; two consecutive occurrences are impossible.
- Condition (b): total findings not strictly decreasing, for two consecutive Post-fix rounds. 10 → 5 is a **strict decrease**, so the condition does not hold this round.

Additionally, this is the first Post-fix round, so neither condition could yet have accumulated the two consecutive rounds it requires. The fix cycle is converging: the Critical class is gone, the Serious count went 2 → 1, and the surviving Systemic pattern is materially narrower (two of round 1's three instances closed, the remainder reachable only through less common inputs).

## Recommended Priority

The tripwire has not fired, so another fix round is the indicated path rather than foundational rework.

1. **G-1 (silent OK on an unmatchable region)** first. Until it is fixed, the Gate C item this entire change installs can return green on a stale table, and every other guarantee in the change rests on that exit code being trustworthy. It is a two-part fix — error on non-match, tolerate trailing whitespace on marker lines — and the second half removes the most likely trigger entirely.
2. **G-2, all four instances together as a class**, per this project's re-derive-the-class rule rather than instance by instance. Instance (a) is the most urgent of the four because it disables the round's headline completeness guarantee; instance (b) is the one that survived round 1 and should not survive a second.
3. **G-3 (`HANDOFF.md` dispatch pin)** before the round-4 plan review is dispatched — after that point the ambiguity has already cost a review round, which is exactly what F-4 was raised to prevent. G-4 is the same edit's other half and should be applied with it.
4. **G-5 (header inaccuracies)**, last — cosmetic in effect, but the broken canonical example is the one an implementer copies first.

One note for whoever applies these, not a finding: round 1 suggested trialling the repaired script against a retrofit of two or three real steps, and the changelog declines it on the grounds that the applicability ruling keeps the in-flight plan on `94a640a`. The reasoning about the in-flight plan is sound, but the suggestion's value was never about that plan specifically — it was that every probe in both review rounds has used synthetic fixtures, and G-1's trailing-space trigger is precisely the kind of defect that synthetic fixtures, built by the same hand that wrote the parser, systematically miss. A retrofit of any real prose document would be worth more than another fixture.

Verdict: NEEDS_FIXES (5 findings: 1 Systemic, 1 Serious, 1 Moderate, 2 Minor)
