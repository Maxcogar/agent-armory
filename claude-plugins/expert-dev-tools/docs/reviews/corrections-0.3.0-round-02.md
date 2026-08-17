# Independent review — corrections 0.3.0, round 2 (Post-fix)

Artifact: commits `2b1b7d8` + `95173db` on `claude/edt-corrections-0.3.0`, diffed against `origin/main`.
Reviewer: independent (expert-review R1.2). Date: 2026-08-17.
Prior round: `claude-plugins/expert-dev-tools/docs/reviews/corrections-0.3.0-round-01.md` (NEEDS FIXES, 9 findings).

---

## Scope and Inventory

Round 2 — Post-fix review. Inventory constructed per Step 2's post-fix rule, from all four
sources: the prior review's full inventory, the fix-diff files (`95173db`), the fix-diff files'
dependents, and the prior review's nine findings as closure items.

**Source 1 — prior review's full inventory (re-verified, not inherited):**

- [x] `claude-plugins/expert-dev-tools/.claude-plugin/plugin.json` — Read via `git diff origin/main...`, one line (0.2.1 → 0.3.0); untouched by `95173db`.
- [x] `claude-plugins/expert-dev-tools/commands/expert.md` — Grep for `artifact_index` → 7 hits (lines 50, 73, 74, 78, 91, 102, 231); Read of lines 50, 91, 102 for the hashing/upsert contract. Untouched by `95173db`.
- [x] `claude-plugins/expert-dev-tools/workflows/expert-lifecycle.js` — Read at 425–470 (`specPath` derivation, `delta` declaration, `record`, `finish`), 495–515 (spec registration), 585–610 (implementation gate + `record('implementation', …)`), 660–700 (ground-truth guard, full), 766–775 (`documentScopeCheck`), plus Grep for call sites (3 hits: 521, 548, 571).
- [x] `claude-plugins/expert-dev-tools/agents/expert-architect.md` — Read via `95173db` diff, lines 29–36 (rewrapped).
- [x] `claude-plugins/expert-dev-tools/agents/expert-planner.md` — Read via `95173db` diff, lines 31–38 (rewrapped).
- [x] `claude-plugins/expert-dev-tools/agents/expert-spec-writer.md` — Grep of the branch diff; unchanged by `95173db`, prior-round status (honored) re-derived from the `origin/main...` diff hunk.
- [x] `claude-plugins/expert-dev-tools/skills/expert-standard/SKILL.md` — Read lines 1–3 (frontmatter, verbatim), 19–32 (all three shift paragraphs + the "These shifts are related." paragraph), 39–56 (five failure signals).
- [x] `claude-plugins/expert-dev-tools/skills/expert-plan/SKILL.md` — Read `tail -14` (appended section, verbatim).
- [x] `claude-plugins/expert-dev-tools/skills/expert-implement/SKILL.md` — Read `tail -18` (appended section + the skill-specific clause, verbatim).
- [x] `claude-plugins/expert-dev-tools/docs/SKILL-CHANGELOG.md` — Read the full `95173db` hunk (entries 16–17 rewritten); Grep `^## |^### 1[3-9] ` → date headings at lines 49 (`## 2026-08-08`) and 582 (`## 2026-08-17`), entries 16 at 592 and 17 at 632.

**Source 2 — fix-diff files (`95173db`), all six:** `agents/expert-architect.md`,
`agents/expert-planner.md`, `docs/SKILL-CHANGELOG.md`, `docs/reviews/corrections-0.3.0-round-01.md`
(the prior record, added to the tree — no review claim rests on it as source),
`skills/expert-standard/SKILL.md`, `workflows/expert-lifecycle.js`. All Read above.

**Source 3 — dependents of the fix-diff files:**

- [x] `claude-plugins/expert-dev-tools/tests/structural/check-structure.mjs` — executed; plus Grep confirming the fix commit changed no test file (`git show --stat 95173db` lists six paths, none under `tests/`).
- [x] `claude-plugins/expert-dev-tools/tests/unit/run-unit-tests.mjs` — executed; Read at lines 24, 39, 47 for the `artifact_index` entry shape (`role`, `path`, `sha256`, `approved_by_owner`, `approval_segment`).

**Source 4 — the prior review's nine findings as closure items:** F-1 through F-8 plus the
systemic finding; each re-derived from current source below, never from the prior record's claim.

**Supporting (claims asserted about them):**

- [x] Repo-wide search for a producer of `role: 'implementation'` — `grep -rn` over the plugin tree excluding `node_modules` and `docs/reviews` → **1 hit**, `workflows/expert-lifecycle.js:678`, the consumer. Zero producers.
- [x] The five correction drafts under the session task directory (`w73db1o6c`, `wte92ouet`, `wqas4exxg`, `wx0d02szj`, `wqzohmzxn` `.output`). **Unpinnable citation**: session task outputs outside version control, cited by path and date 2026-08-17. Draft text for F-1 and F-2 closure was re-derived from the prior review's quotations *and* checked against current source on the source side, so a later rewrite of those outputs cannot invalidate the source half of any finding here.
- [x] `C:\Users\maxco\.claude\plugins\data\expert-dev-tools\defect-history.json` and `.claude/expert/ACCEPTANCE-RESULTS-2026-08-17.md` — named as authorizing inputs; no finding in this round rests on their content, so they are carried as context rather than as premise sources.

### Tool plan (Step 3)

| Claim type | Instrument | Used for |
|---|---|---|
| Literal-content | Read at file:line | every diff hunk; frontmatter; changelog entries; guard body |
| Absence | grep with recorded query + count | `role: 'implementation'` producers; `child_process`/exec in the workflow; test-file changes in `95173db` |
| Behavioral (tests pass) | test-runner execution | both tiers, exit 0 |
| Structural / dataflow | Read of the specific code path, traced against constructed ledger shapes | ground-truth guard predicate; `documentScopeCheck` identifier scope |
| Imported from prior documents | re-derivation from current source | all nine closure items |

No library-behavior claims arise in this scope, so Context7 is not load-bearing; no instrument
class was unavailable. `collaborativereasoning` was invoked and succeeded on the second call (the
first was rejected for a persona-schema enum violation — a validation error, not an infrastructure
failure). No rigor waivers.

### Execution results

- **Structural tier**: `node tests/structural/check-structure.mjs` → `STRUCTURAL TESTS PASSED`, exit 0.
- **Unit tier**: `node tests/unit/run-unit-tests.mjs` → `UNIT TESTS PASSED`, exit 0.

### Scope resolution trace (requested at dispatch)

`documentScopeCheck(phaseName, resumePhase, artifactPath, led)` is declared at line 767; its
injected template references two identifiers. `led` — the function's own parameter, used as
`(led || {}).artifact_index`, correct. `delta` — declared `const delta = {…}` at line 453 at
**module scope**, and the three call sites (521, 548, 571) all execute after line 453, so there
is no temporal-dead-zone error and no `ReferenceError`. **Both identifiers resolve correctly**;
the concern raised at dispatch does not reproduce. The template is scope-clean. Its defect is
semantic, not lexical, and is recorded as F2-3.

---

## Summary

**This review returns NEEDS FIXES.** The fixes are real and most of them landed: six of the nine
round-1 findings are closed against their originally named standards, both test tiers pass, the
workflow compiles, and the changelog rewrite is genuinely verbatim — every one of entries 16a–16d
and 17 was compared against its source file and matches word for word. The `implPassed` predicate
now correctly tests the latest implementation verdict rather than any historical PASS, closing F-5
cleanly. What has not closed is the systemic finding and its two instances. The ground-truth
guard's target-traceability half is not merely weak but **inert**: `role: 'implementation'` has
zero producers anywhere in the repository, so `implArts` is always empty, and it never appears in
the refusal predicate regardless — while a new code comment now asserts target traceability as an
implemented precondition. The payload-coherence half is tautological in a single-segment run,
because the workflow registers the spec from the same variable the guard later compares against.
And the scope-check rewrite, while an improvement in intent, introduced a new false-positive path:
same-segment prior artifacts carry no recorded hash, so they fall through to the catch-all rule and
are reported as violations of the current phase. Trajectory is 9 → 7; the non-convergence tripwire
has not fired.

---

## Upstream Contract Verification

The upstream contract is the set of five owner-approved correction drafts, plus the round-1 review
findings as the remediation contract for `95173db`. Each round-1 finding is checked closed / open
below, against the standard originally named for it.

| Prior finding | Originally named standard | Status | Verification method |
|---|---|---|---|
| **F-1** (ground-truth guard, two halves) | correction-at-root-cause + fail-safe independence | **OPEN** — both halves | Read `workflows/expert-lifecycle.js:676-685`; repo-wide grep for `role: 'implementation'` producers → 0. See F2-1, F2-2 |
| **F-2** (scope-check baseline + residue exemption) | correction-at-root-cause + decidable-from-recorded-state | **PARTIALLY closed** — the residue exemption is now hash-conditioned (the weakening is removed), but no dispatch baseline is captured | Read `workflows/expert-lifecycle.js:769`; grep for `child_process`/`spawn`/`exec` in the workflow → no exec capability. See F2-3, F2-4 |
| **F-3** (frontmatter not updated) | Claude Code skill contract — `description` is the activation surface | **CLOSED** | Read `skills/expert-standard/SKILL.md:3` — the description now carries "Also activates before any Edit, Write, commit, or agent dispatch made in response to an owner message — the authorization axis…" |
| **F-4** (changelog glosses, not verbatim) | the changelog's own entry-format rule (lines 39–46) | **CLOSED** | Read entries 16a–16d and 17, each compared against its source: `SKILL.md:22` (16a), `:28` (16b), `:41,50` (16c), `:3` (16d), `expert-plan/SKILL.md` tail and `expert-implement/SKILL.md` tail (17). All match word for word |
| **F-5** (`implPassed` accepts any historical PASS) | a state guard tests current state, not the existence of a past state | **CLOSED** | Read `workflows/expert-lifecycle.js:679-680` — `implGates.length > 0 && implGates[implGates.length - 1].verdict === 'PASS'`; `record` at 455–459 appends every round in order, so the last entry is the current verdict |
| **F-6** (out-of-scope paragraph) | the file's stated scope rule (`skills/` and nothing else) | **CLOSED** | Read the `## 2026-08-17` intro — the paragraph is replaced by a one-line pointer: "the same 0.3.0 batch also changed commands/, agents/, and workflows/ — their record is git, per this file's scope rule" |
| **F-7** (entries filed under the wrong date heading) | the entry format's date-first requirement | **CLOSED** | Grep `^## ` → `## 2026-08-17` at line 582, entries 16 (592) and 17 (632) beneath it |
| **F-8** (line-wrap convention broken) | consistent hard-wrap within a file | **CLOSED** | Read both `95173db` hunks — both insertions rewrapped to the files' ~80-column width, rule starting on its own line |
| **Systemic** (mechanical requirements downgraded to prompt prose) | fail-safe / independent-verification design | **OPEN** — improved from 1-of-5 to 2-of-5 | Re-scanned below |

---

## Critical & Serious Findings

### F2-1 — The target-traceability precondition is inert: `role: 'implementation'` has no producer, and `implArts` never gates anything
**Location:** `claude-plugins/expert-dev-tools/workflows/expert-lifecycle.js:672-685`
**Severity:** Serious
**Provenance:** recurring (round-1 F-1, target-traceability half, at the same location and against the same standard)

**What the code does now.** Line 678 computes
`const implArts = allArts.filter((a) => a.role === 'implementation')`. The refusal predicate on
line 681 is `if (!specRegistered || !implPassed)` — `implArts` is **not in it**. `implArts` is used
at exactly one place: line 685, to conditionally append a parenthetical to the acceptance agent's
prompt string, `${implArts.length ? ` (registered implementation artifacts: …)` : ''}`.

**How that claim was verified.** Read of `workflows/expert-lifecycle.js:672-685` at drafting time.
Repo-wide grep for a producer of that role — `grep -rn "role: *'implementation'\|role: *\"implementation\"\|role.*implementation"` over the plugin tree, excluding `node_modules` and
`docs/reviews` — returned **1 hit**: line 678, the consumer itself. **Zero producers.** The only
`role` values ever written are `'spec'` (line 507), `'architecture'` (538), `'plan'` (561), and
`'review'` (`commands/expert.md:102`). `implArts` is therefore always `[]`, the ternary at 685
always yields the empty string, and the parenthetical never appears.

**Standard violated.** Fail-safe control design: a precondition must be evaluated in the decision
that it guards. Compounded by the project's correction standard
(`memory/feedback_review-corrections-rederive-not-patch.md`, operationalized in
`skills/expert-correct`) — a correction must remove the root cause at the site where it lives. The
root cause named by the guard's own comment is target selection; nothing in the refusal predicate
examines the target.

**Why it matters.** This is worse than the round-1 state it was meant to fix, in one specific
respect. Lines 672–673 now assert as a fact: "(b) target traceability - implementation artifacts
are registered in the index." No code registers them and no check consults them. A comment that
documents a control which does not exist is a false attestation at the exact site a future reviewer
or corrector would look to confirm coverage — it converts an open gap into one that reads as
closed. The 27-failure signature from the 2026-08-17 acceptance run remains fully reachable.

**Correct implementation.** Either register implementation outputs with `role: 'implementation'`
(the implementer's returned artifacts, hashed and upserted the way `commands/expert.md:91` already
does for other roles) and then put the check in the predicate —
`if (!specRegistered || !implPassed || implArts.length === 0) return … kind: 'ledger_integrity'` —
or, if implementation outputs are deliberately not registered, delete `implArts` and comment (b)
and record the gap honestly rather than describing an absent control as present.

---

### F2-2 — The payload-coherence check is tautological in the run shape it was written for
**Location:** `claude-plugins/expert-dev-tools/workflows/expert-lifecycle.js:677`
**Severity:** Serious
**Provenance:** recurring (round-1 F-1, payload-coherence half, same location, same standard)

**What the code does now.**
`const specRegistered = !!specPath && allArts.some((a) => a.role === 'spec' && a.path === specPath)`,
where `allArts = (ledger.artifact_index || []).concat(delta.artifacts || [])`.

**How that claim was verified.** Traced against constructed ledger shapes by reading the code path,
per the dispatch instruction:

- *Spec unregistered.* For `specRegistered` to be false in a run whose spec phase executed, the
  push at line 507 would have to be absent or carry a different path. Read of 497
  (`specPath = resolveArtifactPath(specOut, specPath)`), 505 (`if (!specPath) return missingArtifactPath('spec')`),
  and 507 (`delta.artifacts.push({ role: 'spec', path: specPath })`) shows the push uses **the same
  `specPath` variable** the guard later compares, after any overwrite. So in any single-segment run
  that reaches `ground_truth` through the spec phase, `delta.artifacts` necessarily contains a
  matching entry and `specRegistered` is **true by construction** — the predicate degenerates to
  `!!specPath`, which is exactly the round-1 predicate the finding was raised against.
- *Impl gates ending NEEDS_FIXES.* `implGates[implGates.length - 1].verdict !== 'PASS'` → refusal
  fires with the correct detail string. Correct (this is F-5's closure).
- *Clean.* Both true → dispatch proceeds. Correct.

The check does acquire real force in one shape: a **resume** segment where the spec phase is
skipped and `specPath` comes from `input.spec_path`, which must then match a `ledger.artifact_index`
entry. That path is genuine and is why this is Serious rather than Critical.

**Standard violated.** An integrity check must be evaluated against state recorded independently of
the value being checked; comparing a variable to a record written from that same variable in the
same run is circular. Draft F (re-derived from `wx0d02szj.output`, 2026-08-17, unpinnable) required
that "the failure record's criterion IDs, the criteria artifact, and the ledger snapshot all resolve
to the same project/task path" — a *project-path* resolution, not a string equality on one field.

**Why it matters.** The failure being corrected was an acceptance dispatch run against another
project's criteria. Path string equality against a self-registered entry cannot detect that: the
spec path is registered whatever project it points into. No comparison against the ledger task's
target project path exists anywhere in the guard, and `approved_by_owner` — which the ledger schema
carries (`tests/unit/run-unit-tests.mjs:24`) and which `commands/expert.md:231` sets on owner
approval — is not consulted, so an unapproved spec passes the coherence check.

**Correct implementation.** Resolve all three to a project root and compare them: the spec path, the
ledger task's target project path, and the criteria artifact's project path, refusing with
`kind: 'ledger_integrity'` on mismatch. Additionally require the matched `artifact_index` entry to
carry `approved_by_owner: true`, so the criteria source is an owner-approved spec rather than any
registered file.

---

### F2-3 — The rewritten scope check reports same-segment prior artifacts as violations
**Location:** `claude-plugins/expert-dev-tools/workflows/expert-lifecycle.js:769`
**Severity:** Serious
**Provenance:** regression (introduced by `95173db`; round 1 reported the opposite defect at this location)

**What the code does now.** The injected hash list is built by filtering for entries that have a
hash: `(((led || {}).artifact_index || []).concat(delta.artifacts || [])).filter((a) => a.sha256 && a.path !== artifactPath)`.
Rule (2) exempts a listed artifact whose hash still matches; rule (3) makes a hash mismatch a
violation; rule (5) makes "any other changed file" a **VIOLATION**.

**How that claim was verified.** Read of line 769 at drafting time, and Read of the three
`delta.artifacts.push` sites — lines 507, 538, 561 — each of which pushes **`{ role, path }` only,
with no `sha256` field**. The `.filter((a) => a.sha256 …)` therefore drops every `delta.artifacts`
entry unconditionally; only `ledger.artifact_index` entries (hashed by `commands/expert.md:50,91`
at ledger load) ever reach the list. Call sites Read at 521, 548, 571 confirm the ordering: within
one segment, spec → architecture → plan run in sequence and each calls `documentScopeCheck`.

**Standard violated.** Correct attribution in a change-detection control: a file changed *before*
this phase was dispatched is not this phase's write. Round 1 named this standard when faulting the
opposite error, and draft C (re-derived from `wte92ouet.output`, 2026-08-17, unpinnable) states the
violation definition as "any file changed relative to the dispatch baseline other than the
authorized artifact path" — relative to the baseline, which excludes prior state by construction.

**Why it matters.** Consider the ordinary single-segment run. The spec phase writes
`spec-x.md`; the architecture phase writes `arch-x.md`; the plan phase's scope check then runs.
Both `spec-x.md` and `arch-x.md` are dirty in the working tree and neither is in the injected hash
list, because both live in `delta.artifacts` with no `sha256`. Neither is the authorized path
(`planPath`), neither is a listed prior artifact, neither is `.claude/expert` bookkeeping — so both
land on rule (5) and are reported as **violations by the plan phase**, which did not touch them.
`documentScopeCheck`'s caller filters `checks` on `match === false`, so these become real
escalations. A control that fires on correct behavior is worse than one that misses: it trains its
consumers to override it, and the override then covers the true positives rule (3) was added to
catch.

**Correct implementation.** Give `delta.artifacts` entries a `sha256` at push time (the same hash
the command computes on upsert), so within-segment artifacts join the recorded-state list and are
covered by rules (2) and (3) like any other prior artifact. Failing that, add an explicit rule
placing any path in `delta.artifacts` ahead of rule (5) as prior-phase residue.

---

## Systemic Patterns

**The round-1 systemic pattern persists: draft requirements specifying a computed check against
recorded state are still not fully implemented as orchestrator predicates.** It has improved, and
it is not closed.

**Proactive scan.** Re-run over the same five mechanical draft elements round 1 enumerated, each
re-located in current source rather than carried forward:

| Draft element specifying a computed check | Round 1 | Round 2 (verified) |
|---|---|---|
| F: probe target ∈ registered artifacts, else halt | prose | **still not a control** — `implArts` computed but absent from the predicate; role has 0 producers (F2-1) |
| F: assert criterion IDs / criteria artifact / ledger resolve to one path | prose | **partial** — string equality only, circular in single-segment runs, no project-path resolution (F2-2) |
| F: sequencing gate on build-complete | code | **code, and now correct** — latest verdict, not `.some` (F-5 closed) |
| C: capture `git status --porcelain -uall` + hashes before each dispatch | prose | **not implemented** — no baseline capture exists (F2-4) |
| C: violation = any file differing from that baseline | prose + residue exemption | **partial** — hash comparison is now mechanical and the unconditional exemption is gone, but with no baseline the catch-all over-fires (F2-3) |

Grep corroboration, run at drafting time: producers of `role: 'implementation'` across the plugin
tree → **0**; `child_process|spawn|exec(` in `workflows/expert-lifecycle.js` → **0 imports** (the
only `exec` hits are `LOCATION_RANGE_RE.exec` at line 298 and `LOCATION_SECTION_RE.exec` at 300,
regex methods). Of the five mechanical elements, **one is fully code, two are partial, two are not
controls** — against round 1's one-of-five.

**Standard violated.** Fail-safe / independent-verification design: a control must not be
implemented as an instruction to the actor it constrains, and must be evaluated in the decision it
guards. Restated in this project's terms by
`memory/feedback_derived-tables-must-be-generated.md`.

**Why systemic rather than isolated.** The three open instances sit at two different sites, from
two different drafts, and share one substitution: the *computation* was added to the orchestrator
while the *decision* stayed with the dispatched agent. `implArts` is the clearest form — the value
is computed in the orchestrator, from ledger state, and then handed to the agent as prompt text
instead of being tested. That is the round-1 pattern one layer in, which is why fixing F2-1 and
F2-2 individually would again leave the habit intact.

**Correct form.** Every draft element phrased as an assertion, refusal, or comparison against
recorded state is a predicate in `workflows/expert-lifecycle.js` returning a `ledger_integrity`
failure. Prompt prose is additive to such a predicate, never its delivery mechanism.

---

## Moderate & Minor Findings

### F2-4 — No dispatch baseline is captured; attribution remains agent-reconstructed, and the prompt mislabels when the hashes were recorded
**Location:** `claude-plugins/expert-dev-tools/workflows/expert-lifecycle.js:769`
**Severity:** Moderate
**Provenance:** recurring (round-1 F-2, baseline half)

The prompt describes the injected list as "Prior-segment artifacts and their recorded SHA-256
hashes **at this phase's dispatch**". Verified by Read of line 769 and of `commands/expert.md:50`
("re-hash every `artifact_index` entry" on ledger load): the hashes are recorded at ledger load,
not at this phase's dispatch, and no code between load and dispatch refreshes them. Within a
multi-phase segment the label is wrong for every phase after the first. It also still instructs the
agent to "Compute the hashes yourself and report the comparison per file" — the comparison is
mechanical now, which is real progress, but the set of files to compare against is still whatever
the agent finds dirty, not a captured baseline.

Material context that makes this actionable rather than a repeat demand: grep for
`child_process|spawn|exec(`/`import`/`require(` in `workflows/expert-lifecycle.js` returns **no
process-execution capability** — the module's only external effect is `agent()`. Draft C's literal
requirement (the orchestrator runs `git status --porcelain -uall`) is therefore not implementable
inside this module as constructed, and the hash-injection design is a legitimate adaptation rather
than a downgrade. Standard: a control's stated provenance must match its actual provenance.
Correct form: relabel the list accurately ("hashes recorded when this ledger was loaded"), and
either capture the baseline in `commands/expert.md` — which does have Bash — immediately before the
workflow call and thread it in as input, or state in the comment that no baseline exists and what
that costs.

### F2-5 — Three new control predicates shipped with no test coverage
**Location:** `claude-plugins/expert-dev-tools/workflows/expert-lifecycle.js:676-681`
**Severity:** Moderate
**Provenance:** new

`git show --stat 95173db` lists six changed paths — two agent files, the changelog, the round-1
review record, `skills/expert-standard/SKILL.md`, and the workflow — and **no file under `tests/`**.
Verified by Read of the stat output. The commit adds `allArts`, `specRegistered`, `implArts`, and
the rewritten `implPassed`, all of which are exactly the kind of workflow predicate the structural
tier already covers: `tests/structural/check-structure.mjs` contains T-22 boundary cases for the
correction-failure detectors and T-23 cases for the halt states, executed and passing above. A test
constructing a ledger whose spec is unregistered, and one whose latest implementation gate is
NEEDS_FIXES, would have been the natural companion — and a test asserting `implArts` is non-empty
in a realistic ledger would have caught F2-1 before review. Standard: a new control is delivered
with the test that demonstrates it refuses. Correct form: add structural cases for the three
refusal shapes traced in F2-2.

### F2-6 — The paragraph integrating the shifts still accounts for two of them
**Location:** `claude-plugins/expert-dev-tools/skills/expert-standard/SKILL.md:30`
**Severity:** Moderate
**Provenance:** new (present since `2b1b7d8`; not reported in round 1)

Line 22 now reads "Three shifts, working together. None alone is sufficient." and a third shift
paragraph was inserted at line 28. The paragraph at line 30 that ties them together was not
updated: "These shifts are related. Codebase-pattern-matching is judgment without the right
reference. Memory-based-claim-making is observation without actually looking. An expert engineer
does **both** things right: they judge against established standards, and they verify that the code
they're judging actually does what they think it does. Getting **one** right and **the other**
wrong…". Verified by Read of `SKILL.md:19-32` at drafting time. It names two shifts, enumerates two
failure modes, and its "both / one / the other" construction is dyadic throughout — the
authorization shift is absent from the synthesis that tells the reader why the shifts belong
together. Standard: internal consistency of a normative document; the same body/interface coherence
principle that round-1 F-3 applied to the frontmatter applies to the body's own summary. Correct
form: extend the paragraph to three members, naming acting-without-authorization as the third
failure mode alongside pattern-matching and memory-based claims.

---

## Tentative Findings

No tentative findings — every candidate finding's premise was verified per Compliance Gate B. One
caveat is recorded rather than deferred: the five correction drafts are session task outputs outside
version control, cited by path and date (2026-08-17) with their unpinnable status stated per the
Step 6 rule. Every draft-derived requirement above was checked against current source on the source
side, so a later rewrite of those outputs would not invalidate any finding's source half.

---

## Observations

- `documentScopeCheck`'s injected template resolves both of its identifiers correctly — `led` is the
  function's own parameter and `delta` is a module-scope `const` declared at line 453, before all
  three call sites at 521, 548, 571. The scope concern raised at dispatch does not reproduce. This
  is recorded as context, not as a finding, because no standard is violated by it.
- The round-1 review record was committed into the tree by `95173db`. No claim in this round rests
  on it as a source; it was read only to enumerate the closure items, and every one was re-derived
  from current source.

---

## What's Actually Good

- **The changelog rewrite is verbatim in fact, not just in claim.** Verified by reading each quoted
  block against its source: 16a against `SKILL.md:22`, 16b against `:28`, 16c against `:41` and
  `:50`, 16d against `:3`, and entry 17 against the tails of both `expert-plan/SKILL.md` and
  `expert-implement/SKILL.md`. Each matches word for word, with only blockquote reflowing. Good by
  the file's own entry-format standard — and it is the property that determines whether the
  correction can be propagated to the other eight `expert-standard` copies without re-authoring,
  which was F-4's whole point.
- **`implPassed` now tests current state.** Verified across three sites: line 679 filters
  `implementation` gates, line 680 takes `implGates[implGates.length - 1].verdict`, and `record` at
  455–459 pushes every round in order so the last element is the current verdict. Good by the state-
  guard standard round 1 named — a PASS predating a later re-review no longer satisfies it, which is
  precisely the stale-PASS path F-5 identified.
- **The residue exemption is now conditioned rather than unconditional.** Verified by Read of line
  769, rules (2) and (3): a prior artifact is exempt only while its current hash equals its recorded
  hash, and a mismatch is an explicit VIOLATION. Good by the fail-safe standard — this closes the
  specific hole round 1 flagged as "the more serious half" of F-2, where an approved-but-uncommitted
  upstream artifact edited by a later phase was waved through as residue. F2-3 faults a different
  path in the same rewrite; it does not diminish this.

---

## Convergence Record

- **Round number:** 2 (first Post-fix round).
- **Trajectory:** R1: 9 findings (1 Serious-Systemic, 4 Serious, 3 Moderate, 1 Minor) → R2: 7
  findings (1 Serious-Systemic, 3 Serious, 3 Moderate).
- **Flow counts for this round:**
  - Prior findings **closed**: **6** — F-3, F-4, F-5, F-6, F-7, F-8, each verified against its
    originally named standard in the Upstream Contract Verification table.
  - **Recurring**: **4** — the systemic finding, plus F2-1 and F2-2 (the two halves of F-1), plus
    F2-4 (the baseline half of F-2).
  - **New**: **2** — F2-5, F2-6.
  - **Regressions**: **1** — F2-3.
  - Reconciliation: 9 prior − 6 closed = 3 carried (F-1 split into two findings, F-2, systemic) = 4
    recurring; 4 + 2 new + 1 regression = **7**.
- **Tripwire evaluation — NOT FIRED.** Arithmetic shown for both conditions:
  - **(a)** new + regression ≥ closed, for two consecutive Post-fix rounds. This round:
    2 + 1 = **3**, closed = **6**; 3 ≥ 6 is **false**. The condition does not hold this round, so it
    cannot hold for two consecutive rounds. Not fired.
  - **(b)** total findings has not strictly decreased, for two consecutive Post-fix rounds. Totals:
    R1 = 9, R2 = 7; 7 < 9, so the total **strictly decreased**. The condition does not hold this
    round. Not fired.

  Round 2 is the first Post-fix round, so neither condition could satisfy its two-consecutive-round
  requirement in any case; both are additionally false on this round's own numbers. The fix cycle is
  converging.

---

## Recommended Priority

1. **F2-1 first.** It is the only finding where the artifact now *documents* a control that does not
   exist, and the fix is cheap in either direction — register `role: 'implementation'` artifacts and
   put the check in the refusal predicate, or delete `implArts` and comment (b) and record the gap.
   Leaving a false attestation in place is the highest-cost outcome because it suppresses the next
   review.
2. **F2-3.** It is the one change in this commit that makes a control fire on correct behavior, and
   false positives in an escalation path get overridden fast, taking the true positives with them.
   Adding `sha256` at the three `delta.artifacts.push` sites fixes it and also improves F2-4.
3. **F2-2, with the systemic pattern as the frame.** Do F2-1 and F2-2 as one piece of work rather
   than separately — both are the same substitution (compute in the orchestrator, decide in the
   agent), and the point of the systemic finding is that instance-by-instance fixes leave the habit.
   Resolve the three paths to a project root, and require `approved_by_owner: true`.
4. **F2-5.** Add the structural cases for the three refusal shapes. Cheap, and it is what would have
   caught F2-1 before this round.
5. **F2-4 and F2-6.** F2-4 is largely a labelling correction plus a decision about where the baseline
   can live given the module has no exec capability; F2-6 is three sentences in the skill body.

---

Verdict: NEEDS FIXES (7 findings: 1 Serious-Systemic, 3 Serious, 3 Moderate)
