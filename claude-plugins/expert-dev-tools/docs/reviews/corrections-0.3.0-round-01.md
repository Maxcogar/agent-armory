# Independent review — corrections 0.3.0, round 1

Artifact: commit `2b1b7d8` on `claude/edt-corrections-0.3.0`, diffed against `origin/main`.
Reviewer: independent (expert-review R1.2). Date: 2026-08-17.

---

## Scope and Inventory

Round 1 — first review of this artifact. Inventory source: **ad-hoc review against
authorizing upstream drafts** — the ten files in the diff, plus the five owner-approved
correction drafts, plus the test tiers that gate the workflow edits, plus the files whose
content a finding asserts about (the changelog's own rules section; the structural test's
T-2b regex; the workflow's `record`/`runGate`/`delta` machinery; the command's delta-apply
step).

Artifact files:

- [x] `claude-plugins/expert-dev-tools/.claude-plugin/plugin.json` — Read via diff, 1 line changed (0.2.1 → 0.3.0).
- [x] `claude-plugins/expert-dev-tools/commands/expert.md` — Read, full diff hunks + `sed -n '120,160p'` (§4b in place), + `sed -n '40,110p'` region for `artifact_index` and delta-apply semantics.
- [x] `claude-plugins/expert-dev-tools/workflows/expert-lifecycle.js` — Read at lines 346–400 (`runGate`), 432–465 (`specPath`, `delta`, `record`, `finish`), 590–615 (implement gate), 660–700 (ground-truth guard), 747–760 (`documentScopeCheck`).
- [x] `claude-plugins/expert-dev-tools/agents/expert-architect.md` — Read via diff, lines 29–36.
- [x] `claude-plugins/expert-dev-tools/agents/expert-planner.md` — Read via diff, lines 31–38.
- [x] `claude-plugins/expert-dev-tools/agents/expert-spec-writer.md` — Read via diff, lines 45–51.
- [x] `claude-plugins/expert-dev-tools/skills/expert-standard/SKILL.md` — Read lines 1–15 (frontmatter, verbatim) + full diff hunks at lines 19–24 and 39–55.
- [x] `claude-plugins/expert-dev-tools/skills/expert-plan/SKILL.md` — Read via diff, appended lines 389–399.
- [x] `claude-plugins/expert-dev-tools/skills/expert-implement/SKILL.md` — Read via diff, appended lines 218–231.
- [x] `claude-plugins/expert-dev-tools/docs/SKILL-CHANGELOG.md` — Read lines 1–60 (purpose, scope rules, entry format, verbatim exception) + full diff hunk (entries 16–17) + `grep -n "^## |^### 1[3-7] "` for the date-heading structure (result: one `## 2026-08-08` heading at line 49; entries 13–17 all beneath it).

Supporting files (claims asserted about them):

- [x] `claude-plugins/expert-dev-tools/tests/structural/check-structure.mjs` — Read lines 90–165, including the T-2b `dispatchRe` regex at lines 139–141.
- [x] `claude-plugins/expert-dev-tools/tests/unit/run-unit-tests.mjs` — executed (see tool plan).
- [x] The five correction drafts — extracted from `w73db1o6c.output`, `wte92ouet.output`, `wqas4exxg.output`, `wx0d02szj.output`, `wqzohmzxn.output` under the session task directory, via a JSON walk emitting every `correction_draft` block. **Unpinnable citation**: these are session task outputs outside version control; cited by path and date 2026-08-17, and they may be rewritten by a parallel session. Seven `correction_draft` blocks were recovered across the five files (two files carry two drafts each; one draft appears twice within `wx0d02szj`).
- [x] Repo-wide `expert-standard` copies — `find . -name SKILL.md -path "*expert-standard*"`, 9 results, used only for the propagation Observation.
- [x] `claude-plugins/expert-dev-tools/skills/` listing — `ls`, 10 entries, no `expert-lifecycle/` (supports the Observation, and prevented a wrong finding).

### Tool plan (Step 3)

| Claim type | Instrument | Used for |
|---|---|---|
| Literal-content | Read at file:line | every diff hunk; frontmatter; changelog rules |
| Absence | grep with recorded query + count | `artifact_index` in the workflow; `porcelain\|snapshot\|baseline`; `Inbound owner messages`; `expert-lifecycle` skill dir |
| Behavioral (tests pass) | test-runner execution | both tiers, exit 0 |
| Behavioral (regex match) | Read of the regex + tier execution | T-2b |
| Structural / dataflow | Read of the specific code path | ground-truth guard predicate |
| Imported from prior documents | re-derivation from the draft text itself, then from current source | every draft-vs-artifact comparison |

No library-behavior claims arise in this scope, so Context7 is not load-bearing here; no
instrument class was unavailable. `collaborativereasoning` was invoked and succeeded on the
second call (the first was rejected for an enum violation in the persona schema, not an
infrastructure failure). No rigor waivers.

---

## Summary

**This review returns NEEDS FIXES.** The five drafts all reached the correct files, and the
three prose-only corrections — the expert-standard third axis and fifth signal, the two
phase-skill inbound-message sections, and the command's §0 and §4b — landed faithfully and
without weakening. Both test tiers pass (exit 0), the workflow still compiles, and the
edited dispatch prompts cannot break the structural tier's T-2b check. The problem is
concentrated in the two drafts whose corrections were *mechanical*: draft F's ground-truth
guard and draft C's dispatch baseline. In both, the draft specified a deterministic check
against recorded state, and what was implemented instead is instruction prose addressed to
the same agent class whose misjudgment produced the failure. A guard that tells an agent to
target the right thing is not the guard that verifies it targeted the right thing. Two
further Serious findings are omissions with no recorded rationale: draft D's frontmatter
update, and the changelog's verbatim-text rule.

---

## Upstream Contract Verification

The upstream contract here is the set of five owner-approved correction drafts. Each is
checked honored / violated below; the verification method is recorded per item.

| Draft (source) | Element | Status | Method |
|---|---|---|---|
| A (`w73db1o6c`) | expert-standard third axis "authorization before action", 3 clauses | **honored** | Read `skills/expert-standard/SKILL.md:24` — all three clauses present (name the authorizing instruction; hold candidates as candidates; engage every point) |
| A | expert-standard failure signal | **honored** | Read `skills/expert-standard/SKILL.md:44,52` — "Four" → "Five", **Unauthorized changes** inserted before **Assessment gaps.** |
| A | commands/expert.md intake classification | **honored** | Read `commands/expert.md#0` — classify before initializing a segment |
| B (`wte92ouet` #1) | gate third response state "question/discussion" | **honored** | Read `commands/expert.md#4b` bullets 2–3 — answer, change nothing, re-present unchanged, ambiguity → question |
| B | mirror in expert-standard | **honored** | Read `skills/expert-standard/SKILL.md:24` — "an owner question is a request for information, never authorization to edit, fix, plan, or proceed" |
| C (`wte92ouet` #2) | checkpoint on approval | **honored** | Read `commands/expert.md#4b` final bullet |
| C | **baseline at dispatch** (snapshot before each phase dispatch; violation = any file changed vs that baseline) | **VIOLATED** | grep `porcelain\|snapshot\|baseline` over `workflows/expert-lifecycle.js` → 2 hits, both comments about the *ledger* snapshot; no repo-state capture exists. See F-2 |
| D (`wqas4exxg` #1) | third named discipline in expert-standard | **honored** | same Read as draft A (one shared site) |
| D | **update the skill's description frontmatter** | **VIOLATED** | Read `skills/expert-standard/SKILL.md:2–3` verbatim — no authorization language. See F-3 |
| E (`wqas4exxg` #2) | write-scope in each document-phase dispatch prompt | **honored** | Read `workflows/expert-lifecycle.js:494,533,556` — all three carry "authorized to write exactly one file" |
| E | upstream-defect rule in planner/spec-writer/architect agent files | **honored** | Read the three agent-file hunks — record, do not edit; halt if blocking |
| F (`wx0d02szj`) | sequencing gate: build-complete before dispatch | **honored (partially)** | Read `workflows/expert-lifecycle.js:670–674` — `implPassed` predicate. But see F-5 |
| F | **probe target traceable to the executed plan via `artifact_index`** | **VIOLATED** | grep `artifact_index` over `workflows/*.js` → 0 hits (all 10 hits are in `commands/expert.md` and `docs/`). See F-1 |
| F | **payload-coherence assertion (criterion IDs / criteria artifact / ledger all resolve to one project path)** | **VIOLATED** | Read `workflows/expert-lifecycle.js:675` — the requirement appears only as prompt prose, not as an assertion. See F-1 |
| G (`wqzohmzxn`) | gate-discussion authorization rule, 4 clauses | **honored** | Read `commands/expert.md#4b` — all four present, including the stop condition |

Behavior-preservation checks requested at dispatch:

- **Structural tier**: `node tests/structural/check-structure.mjs` → `STRUCTURAL TESTS PASSED`, exit 0.
- **Unit tier**: `node tests/unit/run-unit-tests.mjs` → `UNIT TESTS PASSED`, exit 0.
- **T-2b dispatch regex**: Read at `tests/structural/check-structure.mjs:139-141`. The regex is
  `/\{\s*agentType:\s*AGENT\.(\w+),\s*schema:\s*(\w+),\s*phase:\s*'[^']*',\s*label:\s*(?:'([^']*)'|`([^`]*)`)\s*\}/g`
  — it matches the **options object only**. The prompt string is a separate argument and is
  outside every capture. The edited prompts therefore cannot affect T-2b by construction, and
  the tier's own `T-2b every agent file is dispatched at least once` / `jobs:` counts still pass.
  This is a genuine invariant, not merely a passing run.

---

## Critical & Serious Findings

### F-1 — The ground-truth guard does not check the thing that caused the failure it cites
**Location:** `claude-plugins/expert-dev-tools/workflows/expert-lifecycle.js:665-675`
**Severity:** Serious

**What the code does now.** The guard computes `implPassed` from `gate_history` and refuses
when `!specPath || !implPassed`. It then passes the requirement that verification target the
right build and the right criteria to the acceptance agent as prompt prose: "that spec's
requirements ONLY; no other project's or document's criteria apply … the running system this
lifecycle's executed plan produced."

**How verified.** Read of `workflows/expert-lifecycle.js:665-675` at drafting time. `grep -rn
"artifact_index"` over the repo returned 10 hits, all in `commands/expert.md` (lines 50, 73,
74, 78, 91, 102, 231) and `docs/` — **zero in `workflows/`**. Draft F's text re-derived from
`wx0d02szj.output` (2026-08-17, unpinnable) requires: "the probe target (e.g. dist/index.js)
is an artifact recorded in the ledger's `artifact_index` as produced by the executed, approved
plan; a pre-existing binary not traceable to the executed plan is an invalid target and the
dispatch halts instead" and "assert that the failure record's criterion IDs, the criteria
artifact, and the ledger snapshot all resolve to the same project/task path".

**Standard violated.** The project's own correction standard, recorded in
`memory/feedback_review-corrections-rederive-not-patch.md` and operationalized in
`skills/expert-correct`: a correction must remove the root cause at the site where the root
cause lives. Reinforced by the fail-safe design principle (a guard must be independent of the
component it guards). The comment the change itself writes at line 667–669 names the root
cause precisely — "all 27 failures in one dispatch were predetermined by **target selection**"
— and the guard checks neither the target nor the coherence of the payload. `implPassed` is a
proxy for *build-completeness*, a different proposition; a lifecycle can have a recorded
implementation PASS and still hand the acceptance agent a pre-existing binary, which is exactly
the observed failure.

**Why it matters.** The instruction now issued to the acceptance agent is an instruction to the
same agent class whose target selection was wrong in the run being corrected. Prose that asks
an agent to be careful is not a control; it fails silently and leaves no evidence, and the
27-failure signature can recur with the guard reporting nothing.

**Correct implementation.** Before dispatch, resolve the probe target from
`ledger.artifact_index` and refuse when the target is not an entry produced by the executed
plan; and assert that the spec path, the ledger's task target-project path, and the criteria
artifact's project path resolve to one path, refusing with `kind: 'ledger_integrity'` on
mismatch. Both are computable from state the ledger already carries — `artifact_index` exists
and is already hashed and upserted by `commands/expert.md:91`.

---

### F-2 — The scope check's deterministic baseline was replaced by an LLM attribution heuristic, and given an exemption the draft never authorized
**Location:** `claude-plugins/expert-dev-tools/workflows/expert-lifecycle.js:756-762`
**Severity:** Serious

**What the code does now.** `documentScopeCheck` asks the verifier agent to "determine which
files THIS phase's agent changed — attribute changes since this phase was dispatched, using git
status/log against the latest checkpoint commit plus file modification times", and states that
"files already dirty from prior segments … and the orchestrator's own `.claude/expert`
bookkeeping are NOT this phase's writes", to be reported "separately as residue (not a
violation)".

**How verified.** Read of `workflows/expert-lifecycle.js:756-762` at drafting time. `grep -n
"porcelain\|snapshot\|baseline"` over `workflows/expert-lifecycle.js` returned 2 hits, both at
lines 391 and 399 and both comments about the *ledger* snapshot passed to `diagnose` — no
repo-state capture exists anywhere in the workflow. Draft C's text re-derived from
`wte92ouet.output` (2026-08-17, unpinnable) requires: "immediately before dispatching each
phase agent, after all orchestrator bookkeeping writes, capture a snapshot of repo state (`git
status --porcelain -uall` plus hashes of dirty files) … the phase-scope check compares
post-phase state against that snapshot, and a violation is any file changed relative to the
dispatch baseline other than the authorized artifact path."

**Standard violated.** Same correction standard as F-1, plus the elementary control principle
that an authorization check must be decidable from recorded state rather than reconstructed
after the fact. The draft's design makes attribution *trivially* correct — a captured baseline
turns "who changed this" into set subtraction. The applied form asks an agent to infer
attribution from mtimes, which are not a change-attribution mechanism (they are altered by
checkouts, formatters, and any tool that rewrites a file), and from "the latest checkpoint
commit", which the new §4b checkpoint rule makes *conditional* ("or, where committing is not
permitted, record the full file inventory with hashes") — so in the non-committing case the
heuristic has no anchor at all.

**Why it matters.** The new exemption is the more serious half: an upstream artifact that was
already dirty when the phase started is now, by the prompt's own instruction, reclassified from
violation to "residue". Draft E was authorized precisely to stop phase agents editing upstream
artifacts. F-2 opens a hole in the detector for exactly the case draft E targets — an
approved-but-uncommitted spec that a later phase agent then edits is dirty on both counts and
gets waved through as residue.

**Correct implementation.** Capture the baseline in the workflow immediately before each
document-phase dispatch (`git status --porcelain -uall` plus hashes of dirty files, in the
target repo and the outer repo), pass it into the scope-check dispatch, and define a violation
as any file differing from that baseline other than the authorized path. The residue category
then disappears, because the baseline already excludes prior-segment state.

---

### F-3 — Draft D's frontmatter update to `expert-standard` was not applied
**Location:** `claude-plugins/expert-dev-tools/skills/expert-standard/SKILL.md:2-3`
**Severity:** Serious

**What the file says now.** The `description:` frontmatter enumerates exactly two axes —
engineering judgment, and factual claims about code requiring verification. It contains no
mention of authorization, owner instructions, questions, or acting without a directive.

**How verified.** Read of `skills/expert-standard/SKILL.md:1-15` at drafting time, frontmatter
reproduced in full; the diff for this file shows no change to lines 1–3. Draft D's text
re-derived from `wqas4exxg.output` (2026-08-17, unpinnable): "Also update the skill's
description frontmatter so the authorization discipline is part of its activation summary."

**Standard violated.** The Claude Code skill contract, in which the `description` field is the
activation surface — the text matched against the situation to decide whether the skill loads.
This is a body/interface mismatch: the body now claims three shifts ("Three shifts, working
together. None alone is sufficient.", line 22) while the interface still advertises two. The
project's own rule that *all* review findings are applied, not a chosen subset
(`CLAUDE.md`, standing rules), also applies to an owner-approved draft's elements.

**Why it matters.** The authorization axis is the one whose absence caused the failure — the
draft's own root-cause statement is that the frame "governs only two axes … and contains no
authorization axis". Leaving the activation summary at two axes means the situations that most
need the new axis (an owner asks a question; no engineering judgment is obviously in play) are
the ones least likely to load the skill. The correction is present in the body and unreachable
from the trigger.

**Correct implementation.** Extend the `description` with the authorization discipline in the
same activation-cue style as the existing clauses — e.g. that the skill also activates before
any edit, write, commit, or dispatch, to check that an owner instruction authorizes it, and
that an owner question is never such an instruction.

---

### F-4 — The changelog entries summarise the changed text instead of reproducing it verbatim, defeating the file's sole purpose
**Location:** `claude-plugins/expert-dev-tools/docs/SKILL-CHANGELOG.md:582-620`
**Severity:** Serious

**What the file does now.** Entry 16 renders the new expert-standard shift paragraph as a
compressed gloss — "**Act only on authorization, not on inference of intent** — name the
authorizing instruction before any Edit/Write/commit/dispatch; a question is never
authorization; candidates stay candidates during diagnosis; engage every point of a multi-point
message" — where the actual inserted paragraph at `skills/expert-standard/SKILL.md:24` is
roughly six lines of specific prose. Entry 17 does the same for the ~9-line section appended
identically to two skills, describing it rather than reproducing it. Neither entry states that
it is summarising or why.

**How verified.** Read of the entry-16/17 diff hunk and of
`docs/SKILL-CHANGELOG.md:1-46` (the rules) at drafting time, and Read of
`skills/expert-standard/SKILL.md:24` for the actual inserted text.

**Standard violated.** The file's own stated contract, at lines 39–46: "**Entry format.** Date ·
file · section · anchor · **the change verbatim** · why, with its evidence · observation
reference", and "The rule: verbatim by default; **summarise only when the copy would itself
become a drift site, and say so in the entry**", with the calibration that the exception applies
to an addition "~15 lines" long. Both additions are below that threshold, and neither entry says
it is summarising.

**Why it matters.** This is not a formatting nit; it disables the mechanism. The file's purpose
statement (line 5) is "to make a skill change made here **applyable** to the same skill
elsewhere", and `find . -name SKILL.md -path "*expert-standard*"` returns **9 copies** in this
repository. A gloss cannot be applied to another copy — whoever propagates it has to re-author
the paragraph, which is precisely the drift the file exists to prevent and which its own
preamble reports has already happened ("`expert-review/SKILL.md` alone currently exists at four
different byte sizes across five locations"). The correction therefore reaches one of nine
copies and cannot reliably reach the rest.

**Correct implementation.** Replace the glosses in entries 16 and 17 with the inserted text
reproduced verbatim, under its anchor, exactly as entries 1–12 do. Also supply the
observation-log reference the entry format requires; entries 16 and 17 currently give evidence
(the acceptance results and the drafts) but no observation reference.

---

## Systemic Patterns

**One systemic pattern: mechanical draft requirements downgraded to prompt prose.**

**Proactive scan.** The candidate arose from F-1 and F-2, so per Step 8 it was scanned rather
than extrapolated. The scan enumerated every element across all seven recovered
`correction_draft` blocks that specifies a *computed check against recorded state* (as opposed
to prose to be added to a document), then located each in the artifact:

| Draft element specifying a computed check | Landed as |
|---|---|
| F: probe target ∈ `artifact_index`, else halt | prompt prose (F-1) |
| F: assert criterion IDs / criteria artifact / ledger resolve to one path | prompt prose (F-1) |
| F: sequencing gate on build-complete | **code** (`implPassed`) — the one that landed as code |
| C: capture `git status --porcelain -uall` + hashes before each dispatch | prompt prose (F-2) |
| C: violation = any file differing from that baseline | prompt prose + a new residue exemption (F-2) |

Grep corroboration: `grep -n "artifact_index" workflows/expert-lifecycle.js` → **0**;
`grep -n "porcelain\|snapshot\|baseline" workflows/expert-lifecycle.js` → **2**, both
comments about the ledger snapshot. So of the five mechanical elements the drafts specified,
**four were converted to prose and one was implemented as code**.

**Standard violated.** Fail-safe / independent-verification design: a control must not be
implemented as an instruction to the actor it constrains. Restated in this project's terms by
`memory/feedback_derived-tables-must-be-generated.md` — a check that depends on an agent doing
the right thing by hand drifts, and the drift becomes the next round's findings.

**Why systemic rather than isolated.** Both instances arise in the same commit, at different
sites, from different drafts, with the same substitution: a check the draft placed in the
orchestrator was moved into the dispatch prompt of the agent being checked. The prose is
well-written in both cases, which is what makes the pattern hard to see in review — the
artifact looks corrected. Fixing the two instances individually leaves the substitution habit
in place for the next batch, which is why this is filed as the systemic finding rather than
only as F-1 and F-2.

**Correct form.** Every draft element phrased as an assertion, refusal, or comparison against
recorded state is implemented in `workflows/expert-lifecycle.js` as a predicate that returns a
`ledger_integrity` failure. Prompt prose is additive to such a check, never a substitute for it.

---

## Moderate & Minor Findings

### F-5 — `implPassed` accepts any historical implementation PASS, not the current one
**Location:** `claude-plugins/expert-dev-tools/workflows/expert-lifecycle.js:670`
**Severity:** Moderate

The predicate is `.some((g) => g.gate === 'implementation' && g.verdict === 'PASS')` over the
concatenation of `ledger.gate_history` and `delta.gate_history`. Verified by Read of line 670,
of `record` at lines 455–459 (entries carry `{gate, round, verdict, findings_count}`), of
`runGate` at lines 346–384 (a PASS round is pushed to `history` and returned), and of
`commands/expert.md:107` ("append `gate_history`"), which confirms history accumulates across
segments rather than being replaced — so no false refusal occurs on a legitimate resume, and
the predicate is sound for the two conditions it states.

The gap is that "any PASS ever recorded" is not "this build passed". After a plan amendment and
re-implementation, a PASS from before the amendment still satisfies the guard, so the guard
admits a dispatch against a build no longer traceable to the executed plan — the same class of
error it was added to prevent. Standard: a state guard must test the *current* state, not the
existence of a past state. Correct form: test the most recent `implementation` entry's verdict,
or key the check to the plan revision the PASS was recorded against.

### F-6 — Changelog entry 17 records non-`skills/` changes, which the file's scope rule excludes
**Location:** `claude-plugins/expert-dev-tools/docs/SKILL-CHANGELOG.md:614-620`
**Severity:** Moderate

Entry 17's closing "**Related (not in skills/), recorded for cross-reference:**" paragraph
records the `commands/expert.md` §0 and §4b additions, the dispatch-prompt and agent-file
changes, the scope-check language, and the workflow guard. Verified by Read of the diff hunk
and of `docs/SKILL-CHANGELOG.md:19-24`, which states: "Scope is `skills/` and nothing else …
The workflow, agents, command, tests and docs exist only here; their history is git and the
review records under `docs/reviews/`, and **duplicating it into this file would create a second
account of the same thing**." The paragraph is exactly that duplication. The entry's own
parenthetical ("not in skills/") shows the author noticed the rule and proceeded. Standard: a
document's stated scope rule binds its own entries. Correct form: delete the paragraph; the
cross-reference belongs in the commit message and this review record.

### F-7 — Entries dated 2026-08-17 are filed under the `## 2026-08-08` heading
**Location:** `claude-plugins/expert-dev-tools/docs/SKILL-CHANGELOG.md:582-620`
**Severity:** Moderate

`grep -n "^## |^### 1[3-7] "` over the file returns exactly one date heading, `## 2026-08-08`
at line 49, with entries 13–17 all beneath it; entries 16 and 17 describe work dated 2026-08-17
in their bodies. The entry format at line 44 requires the date as the first element. A reader
scanning by heading dates the correction nine days early. That entries 13–15 share the defect is
not a defense — a pre-existing wrong pattern is a finding, not a precedent. Correct form: open a
`## 2026-08-17` heading above entry 16.

### F-8 — The agent-file insertions break the surrounding line-wrap convention
**Location:** `claude-plugins/expert-dev-tools/agents/expert-architect.md:32` and `claude-plugins/expert-dev-tools/agents/expert-planner.md:34`
**Severity:** Minor

In both files the inserted text is appended to the existing role sentence, producing a first
line of roughly 145 characters that then wraps mid-clause ("… do NOT edit" / newline / "that
file: record the discrepancy"), against a surrounding file wrapped near 80. Verified by Read of
both diff hunks. Standard: consistent hard-wrap within a file, which these prompt files
otherwise observe. Correct form: start the inserted rule on its own line and re-wrap to the
file's width.

---

## Tentative Findings

No tentative findings — every candidate finding's premise was verified per Compliance Gate B.
One caveat is recorded rather than deferred: the five correction drafts are session task
outputs outside version control and are cited by path and date (2026-08-17) with their
unpinnable status stated, per the Step 6 rule for files outside the artifact. Every draft-vs-
artifact comparison above was re-derived from the draft text *and* from current source, so a
later rewrite of those outputs would not invalidate the source side of any finding.

---

## Observations

- Draft E's third target — "the orchestrator skill … exposed as `expert-dev-tools:expert-lifecycle`"
  — does not exist as a skill: `ls skills/` returns 10 directories and no `expert-lifecycle/`.
  The orchestrator tier in this plugin is `commands/expert.md` plus `workflows/`, and it received
  §0 and §4b. The draft's "three skills" element is therefore satisfied at the real site, and
  this is recorded as context, not as a gap.
- The nine repo-wide copies of `expert-standard/SKILL.md` remain unchanged. This is correct:
  `docs/SKILL-CHANGELOG.md:29-32` explicitly excludes propagation state from tracking, and the
  plugin copy is the artifact under review. (What the changelog *does* owe the other copies is
  the verbatim text — that is F-4, a different point.)

---

## What's Actually Good

- **The three prose corrections are faithful, specific, and not weakened.** Verified by Read of
  each site against each draft clause: every clause of drafts A, B, E, G appears with its
  operative content intact, and in several places the applied text is *more* specific than the
  draft (§4b's "Ambiguous replies are treated as questions, not decisions" and the stop
  condition are both drafted requirements rendered as testable rules). Good by the standard the
  drafts themselves set — a correction states the rule at the decision point rather than as a
  general exhortation.
- **The T-2b invariant holds by construction, not by luck.** Verified by Read of the regex at
  `tests/structural/check-structure.mjs:139-141`: it captures only `agentType`, `schema`,
  `phase`, and `label` inside the options-object literal, so prompt-string edits of any length
  are outside its reach. Good by the test-design standard that a check should constrain the
  contract it names and nothing else — the tier's authors made prompt text deliberately free,
  and the corrections exercised exactly that freedom.
- **The `implPassed` predicate does not false-refuse on resume.** Verified across four sites
  (`record` at 455–459, `runGate` at 346–384, the guard at 670, `commands/expert.md:107`): gate
  history is appended across segments and PASS verdicts are recorded, so a segment resuming
  directly into `ground_truth` still sees the prior segment's implementation PASS. The refusal
  fires exactly on the two stated conditions. F-5 narrows what those conditions *should* be; it
  does not contradict this.

---

## Convergence Record

First-round review — convergence tracking begins at round 2.

---

## Recommended Priority

1. **The systemic pattern first, and F-1 and F-2 as its instances.** Implement the
   `artifact_index` target-traceability check and the payload-coherence assertion in the
   workflow, and capture the dispatch baseline in the workflow rather than asking the verifier
   to reconstruct attribution. Doing these as one piece of work is the point — fixing them
   separately leaves the prose-for-control substitution intact for the next batch. Within F-2,
   remove the residue exemption specifically: it is the only change in this commit that makes
   an existing detector weaker.
2. **F-3.** One-line interface fix, and it gates whether the whole expert-standard correction
   activates at all.
3. **F-4, then F-6 and F-7.** F-4 determines whether the corrections can reach the other eight
   copies; F-6 and F-7 are the same file and should ride along.
4. **F-5.** Narrow the predicate to the current implementation verdict — cheap, and it closes
   the stale-PASS path that F-1's fix would otherwise still leave open.
5. **F-8.** Cosmetic; fold into whichever commit touches those files.

---

Verdict: NEEDS FIXES (9 findings: 1 Serious-Systemic, 4 Serious, 3 Moderate, 1 Minor)
