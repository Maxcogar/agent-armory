# Expert Review — expert-plan output contract: derived sections become generated

Round 8 absolute; **round 2 of the cycle restarted at the owner-authorized foundational rework**.
Reviewer: independent subagent, 2026-08-09. Persisted by the reviewing agent; persistence is the
only edit this reviewer made to the repository.

## Scope and Inventory

**Round number:** 8 absolute / 2 of the restarted cycle. Prior rounds:
`docs/reviews/output-contract-generated-sections-round-01.md` (F-1..F-10), `-round-02.md`
(G-1..G-5), `-round-03.md` (H-1..H-4), `-round-04.md` (I-1, I-2), `-round-05.md` (J-1..J-4),
`-round-06.md` (K-1..K-5, **both tripwire conditions fired**), `-round-07.md` (L-1..L-4, first
round after the rework, counters restarted, neither condition fired).

**Cycle status.** The round-07 record established the counter restart at the rework boundary and
its reasoning; that reasoning is not re-litigated here, it is applied. This is the second round of
the restarted cycle, so a two-consecutive-round test can form for the first time and both
conditions are evaluated with the arithmetic shown in the Convergence Record.

### Step 3 tool plan

| Claim type in scope | Instrument | Availability / disposition |
|---|---|---|
| Behavioral ("this input produces that exit code / that diagnostic") | Execution of the shipped script against fixtures constructed in the session scratchpad | Available. **~50 probe runs.** No repository file was ever passed to write mode; every write-mode run and every mutation targeted a scratchpad copy under `…/scratchpad/fx/` or `…/scratchpad/sk/`. |
| Adversarial probing of `--self-check` itself | A full copy of `skills/expert-plan/scripts/` **and** `skills/expert-plan/references/` into `…/scratchpad/sk/`, then mutation of the copied contract and the copied script | Available. Required because `--self-check` resolves the contract by a hardcoded relative path (`../references/output-contract.md`, script line 402) and takes no operand. |
| **Harness-blindness claims** ("`--self-check` does not assert constraint X") | Deletion of the constraint's enforcement from a **copied** script, then running `--self-check` on the copy — a surviving mutation proves the constraint is unasserted | Available; this is the instrument behind Observation 2 and finding M-1 |
| Literal-content ("line N says Z") | `Read` at the cited file:line at drafting time | Available, used throughout |
| Absence ("the contract/script contains no X") | `grep` over the named file with query and result count recorded | Available; used for M-1 and M-2 |
| Structural / blast radius | CodeGraph | Not exercised — the script is a standalone entry point whose only imports are `node:fs`, `node:path`, `node:url` (Read lines 76–78). No finding makes a structural claim. |
| Library behavior | Context7 | **Not needed** — no third-party dependency exists. No library-behavior claim category is in scope, so no Step 3 halt condition arises. |
| Claims imported from prior documents (rounds 1–7, changelog entries 6–13, HANDOFF.md) | Re-derivation with the instrument the underlying claim type requires | Available; every L-1..L-4 disposition below was re-derived by execution or grep — none accepted from changelog entry 13 |
| Comment claims inside the artifact (script header; the `// J-3`, `// K-4/L-3`, `// K-3`, `// K-2`, `// L-4` inline comments) | Re-derivation from executed behavior | Available; used to test the K-4/L-3 comment's claim (Observation 3) and the L-4 comment's claim (probes A–F) |

No instrument class was unavailable for a load-bearing claim category. No rigor waivers — no
compression was requested. Node v22.16.0 present, so the contract's Node-unavailability halt
condition did not arise.

### Inventory — all four Post-fix sources

| File | Source | Status | Verification |
|---|---|---|---|
| `claude-plugins/expert-dev-tools/skills/expert-plan/scripts/derive-plan-sections.mjs` | fix-diff | [x] | Read 1–551 in full; negative-case entries counted `grep -cE "^    \['"` → **13**; indentation cases counted `grep -cE "^    \['.*indent"` → **0**; executed in ~50 probes including three enforcement-deletion mutations on a copy |
| `claude-plugins/expert-dev-tools/skills/expert-plan/scripts/fixtures/valid-plan.md` | fix-diff | [x] | Read 1–69 in full; checked clean via `--self-check` (2 steps, 3 elements, 2 specs) |
| `claude-plugins/expert-dev-tools/skills/expert-plan/references/output-contract.md` | prior inventory + fix-diff | [x] | Read 1–128 in full; full `git diff HEAD` against baseline `94a640a`; `grep -c "hand-maintained"` → **1**; `grep -c "thirteen cases at this writing"` → **1**; `grep -c "carries the fence's own indentation"` → **1**; `grep -c 'heading text must be exactly "Test specifications"'` → **1**; six mutations on a relocated copy |
| `claude-plugins/expert-dev-tools/docs/SKILL-CHANGELOG.md` (entries 6–13) | fix-diff | [x] | `grep -cE '^### [0-9]+ '` → **13** headings; entry 13 Read in full |
| `claude-plugins/expert-dev-tools/docs/HANDOFF.md` | fix-diff | [x] | Read via `git diff HEAD` — the dispatch-pinning and changelog-pointer paragraphs in full |
| `claude-plugins/expert-dev-tools/skills/expert-plan/SKILL.md` | fix-diff dependent | [x] | `grep -cE "derive-plan-sections\|step-decl\|plan-elements\|generated:\|self-check"` → **0 hits** (unchanged from rounds 3–7) |
| `claude-plugins/expert-dev-tools/docs/plans/plan-expert-dev-tools-behavioral-remediation.md` | prior inventory | [x] | `grep -cE "step-decl\|generated:"` → **0 hits** — no retrofit; Applicability rule honored. Modified in the working tree by the separate concurrent thread; out of this change's scope. |
| `claude-plugins/expert-dev-tools/docs/reviews/output-contract-generated-sections-round-07.md` | prior review record | [x] | Read 1–255 in full |
| `git show 94a640a:…/output-contract.md` (baseline) | prior inventory | [x] | Read via `git diff HEAD` against it |
| L-1, L-2, L-3, L-4 as closure items | prior findings | [x] | Each re-derived from current source by execution or grep; dispositions in the table below |

**Fix-diff dependents.** The script has no importers (standalone entry point; only Node built-ins).
The contract's only in-repo dependent is `SKILL.md` (grep above, 0 hits). The fixture's only
consumer is the script's `--self-check`. All covered.

**Procedural observation.** `collaborativereasoning` was again rejected on its first call with a
schema-validation error on the persona `communication.style` / `.tone` enums, and succeeded on the
second call with corrected values. **This is the seventh consecutive round to record this same
infrastructure failure.** The multi-perspective check ran as designed on the successful call, with
the standards-discipline, downstream-consumer, and implementer personas; two of this reviewer's
candidate findings were demoted to Observations as a direct result of the implementer persona's
challenges. `metacognitivemonitoring` was invoked at the evaluation stage, after the verification
phase and before any finding was drafted into this record — stated plainly because the skill places
it at review start.

## Summary

**This review returns NEEDS FIXES.** All four of round 7's findings close, each verified by
execution against its originally named standard rather than accepted from the changelog: the three
contract sentences describing `--self-check` are now true or honestly hedged, §12's heading
constraint is stated where an author reads it, the indentation-error cascade now yields exactly one
error per bad line at sub-keys as well as top-level keys across six probes, and the self-check
scaffold derives its stubs so that four self-consistent renames of the contract's example IDs all
pass while two genuine breakages still fail naming only IDs that exist. This is the cleanest round
of the cycle and the first with **zero regressions**. What blocks the verdict is one gap the
corrections left and one they created. The fence-indentation constraint — the single site that has
now carried three consecutive defects (J-3, K-4, L-3) — still has no negative case in the
self-check suite, and I demonstrated by deleting the check outright from a copied script that
`--self-check` stays green at 15/15; round 7 named adding that case as part of L-3's correction and
it was not added. And the contract now carries a hand-written count of the script's internals
("thirteen cases at this writing") that no rule and no mechanism keeps true. **Neither tripwire
condition fires, and the arithmetic is shown.**

## Upstream Contract Verification

No formal spec or architecture document governs this change. The binding upstream artifacts are the
owner ruling in `docs/HANDOFF.md`, the owner's 2026-08-09 rework authorization, the contract's
stated closure condition, and rounds 1–7's findings.

| Upstream requirement | Status | Verification method |
|---|---|---|
| Owner ruling: the drift surfaces "have to be converted, not swept harder" | Honored | The move-together bullet invokes an executable rather than prescribing a manual procedure; verified by running `--self-check` (exit 0, 15 checks) and by six mutation probes on a relocated copy proving it fails on divergence |
| Round-6 tripwire routing: foundational rework, not a seventh fix round | Honored (established round 7) | Re-confirmed by Read of script lines 87–391 (pure `processDocument`) and 395–505 (self-check) |
| "a machine-readable step declaration … from which §2, §5 and §12 are generated" | Honored, with disclosed narrowing | §12 is cross-checked rather than generated, narrowing and reason stated at contract line 70. Closed at round 2; unchanged. |
| Applicability rule: the in-flight plan is not retrofitted mid-cycle | Honored | `grep -cE "step-decl\|generated:"` over `docs/plans/plan-expert-dev-tools-behavioral-remediation.md` → **0 hits**; HANDOFF.md's dispatch pin at `94a640a` present and Read |
| Round 7 verdict NEEDS FIXES — all four findings remediated | **Met** | L-1, L-2, L-3, L-4 all closed by execution against their originally named standards; dispositions below |
| Contract↔script move-together rule, applied to this change set | **Partly met** | The contract's §12 and self-check text were updated in the same edit as the parser changes (entry 13 Read, changes verified present). The rule's own same-edit clause covers the case list but not the count it states — M-2. |

### Round-7 finding dispositions

Each re-derived from current source by execution or grep. Changelog entry 13's claims were treated
as author claims inside the artifact, not as verification.

| # | Disposition | Verification (executed, never accepted from the changelog) |
|---|---|---|
| **L-1** (Systemic) three of four contract sentences describing the derivation control are false or incomplete | **Closed** | Re-derived each of the four instances. **(i)** The §2 parenthetical no longer claims a bare paste checks clean; it now says `--self-check` composes the examples and that "A bare paste of the two blocks alone is not a complete document and will not check clean." Verified by programmatically extracting both fenced blocks with the parser's own regex into `paste.md` and running `--check`: exit 1, `step S12 depends on undeclared step S11` plus two uncovered-element errors — the contract's new sentence is exactly what happens. The consistency claim is also true: the example's `covers: [R-3]` is drawn from the example vocabulary `[R-1, R-3, Q-1]`. **(ii)** The "every stated grammar constraint" overclaim is gone, replaced by "a suite of negative cases spanning the grammar's constraint families — thirteen cases at this writing" plus an explicit disclaimer that constraints outside the suite are enforced but not asserted. Count verified: `grep -cE "^    \['"` → **13**. **(iii)** The residual bullet now discloses both directions, including parser behavior "for which no one has yet written a negative case or a contract sentence," and states the case list is hand-maintained (`grep -c "hand-maintained"` → **1**, was 0). **(iv)** unchanged and still true. Closed against its named standard — honest risk disclosure with a named compensating control. |
| **L-2** (Serious, regression) §12's heading wording was a silent delivery-blocking precondition | **Closed** | Contract line 60 now states: **"The section's own heading text must be exactly 'Test specifications'"** (optionally numbered) "— the script anchors its scan on that exact text, and a differently-worded heading fails the check with a missing-section error." `grep` → 1 hit. Six executed heading probes on otherwise-identical fixtures confirm the parser matches the stated rule: `## 12. Test specifications`, `## Test specifications`, `## Test Specifications`, `### Test specifications` → exit 0; `## 12. Test specifications and coverage`, `## 12 Test specifications (T-series)` → exit 1. The constraint is now stated where the author reads it, which round 7 named as the closure. |
| **L-3** (Moderate, recurring) the indentation-error cascade was fixed for top-level keys only | **Closed** | `extractBlocks` now normalizes a mis-indented line to the shape its key implies (script line 111: `/^(create\|modify\|delete):/.test(t) ? `  ${t}` : t`). Six executed probes on a four-space-indented fence, each with exactly one bad line: mis-indented `tests:` → **1 error**; `delete:` → **1** (round 7 measured 3); `modify:` de-indented to column 0 → **1** (round 7 measured 5); `files:` itself → **1**; `step:` → **1**; and a two-bad-line probe → **exactly 2**, one per bad line, no cascade. Closed against its named standard, diagnostic accuracy. |
| **L-4** (Moderate, new) the self-check scaffold hardcoded the contract examples' literal IDs | **Closed** | Scaffold now derives stubs from the extracted blocks (script lines 419–446). Four mutation probes on a relocated copy, each internally consistent: rename the whole vocabulary and the example's `covers` to `A-*`/`B-*` → **exit 0, 15 checks**; `tests: [T-9]` → `[T-4]` → **exit 0**; `depends_on: [S11]` → `[]` → **exit 0**; `step: S12` → `S3` → **exit 0**. Two genuine-breakage controls still fail with diagnostics naming only IDs the mutated contract actually contains: `covers: [R-7]` → `step S12 covers 'R-7', which is not in the plan-elements vocabulary`; `step: XX` → `step ID 'XX' does not match S<number>[letter]`. The synthetic `S11`/`T-9` literals round 7 found are gone. Closed against its named standard, diagnostic accuracy plus the harness-must-not-fail-on-valid-input articulation. |

### Two-directional grammar walk (contract ↔ parser)

**Contract → parser.** I extracted every grammar constraint the contract states in §2, §7, §12 and
the workflow bullets, and executed a violating input for each against the shipped parser.
**Eighteen constraints probed; all eighteen are enforced**, each with an accurate first diagnostic.
Two were probed twice because the round-7 corrections touched their code paths (the indentation
rule, whose recovery changed; the §12 anchor, whose regex changed) — both still enforce.

| Constraint stated in the contract | Violating input | Result |
|---|---|---|
| list values only in inline form | `covers: R-1` | exit 1, `value must be an inline list [a, b] or [], got: R-1` |
| block sequences rejected | `covers:` + `- R-1` | exit 1, `value must be an inline list` |
| flow mappings rejected | `covers: {a: b}` | exit 1, `value must be an inline list … got: {a: b}` |
| quoting rejected | `tests: ["T-1"]` | exit 1, `entry '"T-1"' contains bracket/brace/quote characters` |
| comments rejected (inline) | `covers: [R-1] # note` | exit 1, `value must be an inline list` |
| comments rejected (own line) | `# note` | exit 1, `unparseable line: # note` |
| a comma always separates entries | `covers: [R-1,]` | exit 1, `empty list entry (stray or trailing comma)` |
| five top-level keys, each exactly once (missing half) | drop `tests:` | exit 1, `missing required key 'tests'` |
| only the five named keys | `bogus: [x]` | exit 1, `unknown key 'bogus'` |
| files sub-keys each exactly once | duplicate `delete: []` | exit 1, `duplicate files sub-key 'delete'` |
| step IDs unique | two `step: S1` blocks | exit 1, `duplicate step ID S1 (lines 18 and 29)` |
| depends_on names a declared step | `depends_on: [S9]` | exit 1, `depends on undeclared step S9` |
| exactly one `plan-elements` block | two blocks | exit 1, `found 2 plan-elements blocks` |
| each generated region present | delete the files marker pair | exit 1, `missing region markers for 'files'` |
| each generated region appears once | duplicate the files marker pair | exit 1, `marker 'files' occurs 2 times` |
| §12 heading required, exact title | rename to `## Nope` | exit 1, `no "Test specifications" heading found` |
| every content line carries the fence's indentation | de-indent `modify: []` | exit 1, `content line does not carry the fence's indentation` |
| at least one element; `elements: []` is an error | `elements: []` | exit 1, `'elements: []' is not allowed` |

Also re-verified from the workflow bullets: `--check` is recognized at a trailing argument position
(`pos.md --check` → exit 0) and **never writes** (a deliberately staled document, `md5sum` before
and after a failing `--check` run: identical, exit 1).

**Parser → contract.** Walking the parser's document diagnostics against the contract text, the
direction that reopened at round 7 (L-2) has closed and **no new unstated constraint was found**.
The three marginal-but-unstated diagnostics rounds 5–7 recorded as Observations are carried forward
unchanged on the same reasoning. What this direction *did* surface is not a contract gap but a
harness gap — M-1.

## Critical & Serious Findings

No Critical or Serious findings — the full inventory was Read or Grep-verified per Compliance Gate
B, ~50 executed probes were run against the shipped script and against mutated copies, and no
violation of Critical or Serious classification was observed. Round 7's Serious regression (L-2)
closed, and this round introduced no regression of any severity.

## Systemic Patterns

**No systemic patterns.** Verified by re-running round 7's own proactive scan: I enumerated every
sentence in the contract asserting a property of the derivation control — the §2 parenthetical
(line 16), the coverage-completeness sentence (line 17), the §12 anchor sentence (line 60), the
cross-check sentence (line 70), the `--check` workflow bullet (line 73), the marker-form bullet
(line 74), and the six assertions inside the move-together bullet (line 75) — **thirteen
control-describing assertions**, and executed a probe against each. **Twelve are true as written**
(evidence in the L-1 disposition and the grammar walk above). The thirteenth is the count
"thirteen cases at this writing," which is true today and unmaintained — reported as M-2 at Minor,
its own severity, rather than as an instance of a pattern.

This is the material change from round 7, where the same scan found three of four control-describing
sentences false. The class that ran for four consecutive rounds — *a contract sentence asserting a
property of the control that is not true of the control* — has **no false instance this round**. It
is not carried forward as Systemic on the strength of its history; a Systemic classification
requires instances, and the scan produced none.

## Moderate & Minor Findings

### M-1 (Moderate, new) — the fence-indentation constraint has no negative case, and it is the one site that has produced a defect in three consecutive rounds

**What the code does.** The self-check's `cases` array (script lines 480–494) contains thirteen
negative cases. None of them exercises the fence-indentation constraint —
`grep -cE "^    \['.*indent"` over the script → **0**, against 13 total cases. The constraint
itself is enforced (grammar walk above) and is stated in the contract (§7: "Every content line of a
fenced block carries the fence's own indentation; a line that does not is an error" —
`grep -c "carries the fence's own indentation"` → 1). The gap is that `--self-check`, the control
the contract names as the guarantee that contract and script have not diverged, cannot see this
constraint at all.

**How that claim was verified.** Not by reading the case list and inferring — by mutation. I copied
`scripts/` and `references/` into the scratchpad, **deleted the indentation error entirely** from
the copied script (`grep -c "does not carry the fence"` on the mutated copy → **0**, confirming the
enforcement was gone), and ran `--self-check` on the copy: **exit 0, "self-check passed: 15
checks"** — every check still green with the constraint removed. A second control mutation on a
fresh copy deleted the inline-list-form rejection (`grep -c "value must be an inline list"` → 0) and
`--self-check` again returned **exit 0, 15 checks**. Restoring the original copy returned exit 0
with enforcement intact. The claim is therefore executed, not inferred.

**Standard violated.** **Regression-test discipline** — the established rule that a defect fixed at
a site gets a test that fails before the fix and passes after, so the fix cannot silently revert.
This site has now carried three separate defects across three consecutive rounds: J-3 (round 5, the
indentation rule was unenforced), K-4 (round 6, the check cascaded into four diagnostics), and L-3
(round 7, the fix covered top-level keys but not `files:` sub-keys). Each was found by a reviewer
executing a hand-built probe; none is guarded. Round 7's Recommended Priority named this explicitly
as part of L-3's correction — "Add a negative case for the indentation constraint while doing so;
its absence from the harness is why this survived" — and the correction applied the parser fix
without the case.

**Why this is a finding and not a preference.** L-3 closed against *its* standard (diagnostic
accuracy), which is why it is recorded as closed above. This is a different standard and a separate
defect: the fix is correct and unguarded. The empirical argument is the mutation result — a future
edit that regresses the indentation handling passes `--self-check`, passes Gate C, and ships,
because the only thing that has ever caught this class is a reviewer building the probe by hand for
the third time.

**What correct implementation looks like.** One entry in the existing `cases` array, in the shape
the surrounding entries already use — a `base(...)` document whose `step-decl` fence is indented and
whose `delete:` line is not, asserting the substring `does not carry the fence's indentation`.
Because the round-7 fix's substance was the *sub-key* recovery, the case should use a `files:`
sub-key rather than a top-level key, so that it guards the behavior that actually changed. A second
entry asserting that the same document produces exactly one error would guard the no-cascade
property the inline comment at lines 98–103 claims; that is optional, the first entry is the
closure.

### M-2 (Minor, new) — the contract states a hand-written count of the script's internals that no rule and no mechanism keeps true

**What the document does.** Contract line 75 describes `--self-check` as asserting "a suite of
negative cases spanning the grammar's constraint families — **thirteen cases at this writing**;
constraints outside the suite are enforced by the parser but not self-check-asserted, and the case
list is itself hand-maintained, so when a grammar constraint is added, its negative case is added in
the same edit." The same-edit rule the sentence states covers the *case list*. It does not cover the
*count*, and nothing else does either.

**How that claim was verified.** `grep -c "thirteen cases at this writing"` over the contract → **1**;
`grep -cE "^    \['"` over the script → **13**, so the number is accurate today. For the drift
hazard: on the relocated copy I added a fourteenth case to the `cases` array (a bare-scalar list
violation) and ran `--self-check` — **exit 0, "self-check passed: 16 checks"**, while
`grep -c "thirteen cases at this writing"` over the copied contract still returned **1**. The
control the contract names as the detector of contract↔script divergence does not detect this
divergence, and the move-together rule's same-edit clause does not require the editor to notice it.

**Standard violated.** **Documentation-as-contract**, in the specific form this project has recorded
as its own doctrine: a derived value restated by hand drifts, and a hand-maintained index becomes
the regression engine in a fix loop. The contract spent seven rounds establishing that assertions
about the script must be kept true by a mechanism rather than by care, then placed one assertion
about the script outside every mechanism it built. The "at this writing" hedge is honest and is why
this is Minor rather than Moderate — a reader is warned the number is point-in-time — but a hedge is
not a mechanism, and the count is trivially checkable by the harness that is already reading the
contract file.

**What correct implementation looks like.** Two acceptable closures. Simplest: **delete the number.**
The sentence loses nothing — "a suite of negative cases spanning the grammar's constraint families;
constraints outside the suite are enforced but not self-check-asserted" carries the same information
and cannot go stale. Better if the number is wanted: **have `--self-check` assert it.** The harness
already reads the contract text at line 405 for the fenced examples; extracting the spelled number
from that same string and comparing it to `cases.length` is a few lines, and it converts the one
unmechanized assertion in the bullet into a mechanized one — which is the move the whole cycle has
been about.

## Tentative Findings

No tentative findings — every finding's premise was verified by executing the shipped script or a
deliberately mutated copy of it against a purpose-built fixture in the session scratchpad with the
exit code and full output captured, by `grep` with the query and result count recorded, or by Read
at a cited line at drafting time. No candidate was dropped for want of an instrument.

## Observations

- **The `--self-check` suite's family coverage, measured.** Recorded as data rather than as a
  finding. Of the eighteen contract-stated constraints in the grammar walk above, **thirteen have a
  negative case and seventeen do not** (the counts overlap because some cases cover constraints not
  in the walk, e.g. uncovered/undeclared elements). Whole families with zero cases: the
  fence-indentation rule (M-1), the required-keys and unknown-key rules, the region-marker
  presence/duplication rules, and the inline-list *form* rule — for the last of which I confirmed by
  mutation that deleting the enforcement leaves `--self-check` green at 15 checks. This is **not**
  reported as a finding against the contract's "spanning the grammar's constraint families" wording:
  the adjacent clause explicitly discloses that constraints outside the suite are enforced but not
  asserted, so a reader is correctly informed that coverage is partial, and the suite does draw from
  eight of roughly eleven families. Calling that sentence false would be manufacturing a finding
  from a marginal reading. The measurement is recorded so a future round has the data without
  rebuilding it.
- **One bad line can still yield three diagnostics when the line is also out of position.** A
  `create: []` line that is both de-indented *and* placed before `files:` produces the indentation
  error, `unparseable line: create: []`, and `files: block missing sub-key 'create'`. This is not a
  finding: all three diagnostics are accurate for that document, which carries a second independent
  defect (a sub-key outside its block), and the inline comment's operative prohibition is on a
  *false* cascade — none of these is false. Recorded because it bounds the L-3 closure: the comment's
  "exactly one accurate error per bad line" holds for a line whose only defect is its indentation,
  which is the case round 7 reported and the case M-1's negative case should guard.
- **The contract's §12 heading rule is stricter than the parser, in the safe direction.** The
  contract says the heading text "must be exactly `Test specifications`"; the parser's anchor is
  case-insensitive, so `## Test Specifications` also passes (probed, exit 0). An author who follows
  the contract always passes; an author who deviates in this one way passes anyway. No standard
  violation — a specification narrower than the implementation cannot block a conformant author —
  and recorded only so a future round does not mistake it for a divergence.
- Three of the parser's document diagnostics remain unstated in the contract and are recorded here
  rather than as findings, on the reasoning rounds 5–7 applied: `duplicate step ID` (uniqueness is
  definitional to an identifier), `empty list entry (stray or trailing comma)` (entailed by "entries
  are single whitespace-free tokens"), and `marker '<name>' occurs N times` (entailed by the
  contract's singular framing of each generated region). Carried forward unchanged for a fourth
  round.
- `SKILL.md` still contains zero references to the script, `step-decl`, `plan-elements`, the
  markers, or `--self-check` (grep, 0 hits), unchanged from rounds 3–7. No standard violation — the
  contract is a `references/` file the skill directs the author to.
- Changelog entry 13's per-finding claims were each independently re-derived by execution and **all
  four are accurate**, including its self-reported near-miss ("The first version of this fix
  regressed on indented examples — caught by the self-check itself before delivery"). This is the
  first round in which no changelog claim failed re-derivation; rounds 6 and 7 each had two that did
  not survive.

## What's Actually Good

- **The L-4 correction is the right shape and it survives the adversarial test it was designed
  against.** The scaffold derives its stub steps, their coverage, and the spec list from the
  contract's extracted examples rather than assuming their identifiers, so a self-consistent rename
  of every example ID in the contract still passes 15/15 while a genuinely broken example still
  fails naming only symbols that exist in the file the author edited. **Standard:** a self-validating
  harness must not fail on valid input — the first-principles articulation round 7 decided L-4 under.
  **Verified by:** four self-consistent mutations of a relocated contract copy (all exit 0) and two
  genuine-breakage controls (both exit 1, diagnostics naming `S12` and `R-7`, which exist in the
  mutated contract), with exit codes and stderr captured.
- **The L-3 correction generalizes rather than patching the reported case.** Rather than
  special-casing the `delete:` line round 7 probed, the fix normalizes any mis-indented line to the
  shape its key implies, so top-level keys, `files:` itself, and all three sub-keys each yield one
  error, and two bad lines yield exactly two. That is the difference between closing a finding and
  closing its class. **Standard:** diagnostic accuracy, and the re-derive-never-patch doctrine this
  project holds corrections to. **Verified by:** six single-bad-line probes (1 error each) and one
  two-bad-line probe (exactly 2), against round 7's measured 3 and 5.
- **L-2 was closed by moving the contract to state the constraint, not by loosening the parser to
  hide it.** The heading rule now appears in §12's own definition, where an author writing §12 is
  already reading, and the parser is unchanged. Round 7 named this as the preferred of two closures
  because it converts a silent precondition into a stated one rather than trading a delivery-time
  block for a looser anchor. **Standard:** documentation-as-contract — the contract's own rule that
  "a constraint enforced but unstated is a gate an author cannot prepare for." **Verified by:** grep
  for the new sentence (1 hit), Read of contract line 60, and six heading probes confirming parser
  behavior matches the newly stated rule exactly.
- **The §2 parenthetical was deleted-and-replaced rather than reworded a third time.** Instance (i)
  of L-1 had survived two rounds verbatim after being reported; the correction replaced the claim
  about a manual paste with an accurate statement that a bare paste is *not* a complete document and
  that composition is the script's job. I verified the new claim the same way I falsified the old
  one — by extracting both blocks with the parser's own regex and running the result. **Standard:**
  honest risk disclosure with a named compensating control. **Verified by:** programmatic extraction
  into `paste.md`, `--check` exit 1 with three errors, matching the sentence's assertion.

## Convergence Record

**Round number:** 8 absolute; **round 2 of the restarted cycle** (matches Scope and Inventory).

**Counter basis.** The restart at the rework boundary was established and reasoned in the round-07
record and is applied here unchanged: rounds 1–6 do not contribute to any consecutive-round test.
The restarted cycle now has two rounds, so a consecutive pair can form for the first time and both
conditions are genuinely testable rather than vacuously false.

**Trajectory (findings by severity, each from that round's mechanical verdict breakdown):**

| Round | Total | Breakdown |
|---|---|---|
| R1 | 10 | 1 Critical, 1 Systemic, 2 Serious, 4 Moderate, 2 Minor |
| R2 | 5 | 1 Systemic, 1 Serious, 1 Moderate, 2 Minor |
| R3 | 4 | 1 Systemic, 1 Serious, 2 Minor |
| R4 | 2 | 1 Systemic, 1 Serious |
| R5 | 4 | 1 Systemic, 3 Minor |
| R6 | 5 | 1 Systemic, 1 Serious, 1 Moderate, 2 Minor — **tripwire fired; rework boundary** |
| R7 | 4 | 1 Systemic, 1 Serious, 2 Moderate — *restarted cycle round 1* |
| **R8** | **2** | **1 Moderate, 1 Minor** — *restarted cycle round 2* |

**Flow counts for this round** (provenance classifications from Step 9 are the source):

- **Prior findings closed: 4** — L-1 (honest risk disclosure with a named compensating control, by
  the thirteen-assertion scan plus the `paste.md` extraction probe), L-2 (documentation-as-contract,
  by grep for the new sentence plus six heading probes), L-3 (diagnostic accuracy, by seven
  indentation probes), L-4 (diagnostic accuracy plus the harness articulation, by six scaffold
  mutation probes). Each closed against its originally named standard; each re-derived by execution
  or grep rather than accepted from changelog entry 13.
- **Recurring: 0.** For the first time in the cycle, no prior finding survives at its own standard.
- **New: 2** — M-1, M-2.
- **Regressions: 0.** For the first time in the cycle, the corrections introduced no defect. Each
  changed code path was re-probed specifically for this (the indentation recovery, the §12 anchor,
  the scaffold derivation); all three enforce correctly and the scaffold tolerates valid edits.

**Tripwire evaluation — NOT FIRED on either condition.** Arithmetic shown:

- **Condition (a): new + regression ≥ closed, for two consecutive Post-fix rounds.**
  - **Round 8: 2 new + 0 regression = 2, against 4 closed. 2 ≥ 4 is FALSE.**
  - **Round 7: 1 new + 1 regression = 2, against 3 closed. 2 ≥ 3 is FALSE.**
  - Both rounds of the restarted cycle are false, so no consecutive pair exists. **NOT FIRED.**
- **Condition (b): total findings not strictly decreasing, for two consecutive Post-fix rounds.**
  - Restarted cycle totals: **R7 = 4 → R8 = 2.** 2 < 4, so this round **is** a strict decrease; the
    condition requires *non*-decrease and is therefore false at round 8.
  - One round cannot form a consecutive pair on its own, and the round in question is false anyway.
    **NOT FIRED.**
  - Noted for completeness: across the rework boundary the absolute totals run 5 → 4 → 2, strictly
    decreasing throughout, so condition (b) would be false at round 8 even without the restart.

The substantive reading agrees with the arithmetic, and more strongly than at round 7. The
diagnostic signature of churn — rework producing findings as fast as it closes them — is absent in
every component: four closures against two new findings, zero recurrences, zero regressions, and
the four-round Systemic class extinguished rather than merely reduced. Both remaining findings are
single-location edits in a structure that is now sound, and both live in the same twenty lines of
the script's harness. The honest caution is that M-1 is the third-order form of a defect this site
has produced three times: the fix is correct and unguarded, which is exactly the state that
preceded each of the previous two recurrences.

## Recommended Priority

**The tripwire did not fire and the trajectory is clean. The indicated path is one more fix round,
not foundational rework** — four findings closed against two opened, no recurrence, no regression,
and both remaining items are bounded single-location edits.

Fix in this order:

1. **M-1** — add the fence-indentation negative case to the `cases` array, using a `files:` sub-key
   so it guards the sub-key recovery that round 7's fix actually introduced. This is first not
   because it is larger but because it is the only item that changes the *future* failure rate: it
   is the guard whose absence let the same site produce a defect in three consecutive rounds, and
   every one of those was caught by a reviewer building the probe by hand.
2. **M-2** — either delete the count from the contract sentence or have `--self-check` assert it
   against `cases.length`. If the harness is being edited for M-1 anyway, asserting it is the
   better of the two: it removes the last assertion about the script that no mechanism checks.

One note that is not itself a finding, carried forward from round 7 because it remains true and
remains unaddressed: the four other constraint families with no negative case (required keys,
unknown keys, marker presence and duplication, inline-list form) are each a two-line entry in the
same array, and the eighteen executed probes in this review's grammar walk are already written as
the inputs. Closing them is not required by any finding in this record; it is simply the cheapest
remaining work in the file, and it would make the "spanning the constraint families" wording
unambiguously true rather than defensibly true.

Verdict: NEEDS FIXES (2 findings: 1 Moderate, 1 Minor)
