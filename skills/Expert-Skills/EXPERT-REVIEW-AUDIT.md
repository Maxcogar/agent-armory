# Expert-review audit — 2026-09-15

What this is: a forensic read of the `expert-review` skill against every review round the Nova
project has actually run with it. Sixty-eight persisted rounds, the fourteen dispatch prompts that
drove them, the workflow that surrounds it, and the thirty-four observation-log entries tagged
against it.

Read it before changing `expert-review`, and before deciding what a canonical version of it should
say. It is the evidence behind the changes; `SKILL-REVISIONS.md` in this directory is the record of
which copies exist and when each changed.

**Where the numbers live.** Copy counts, version counts and content hashes are volatile — they move
whenever any copy moves. This document does not restate them. They live in `SKILL-REVISIONS.md`,
with the command to regenerate them. Where this document needs a count, it cites that file rather
than carrying a figure that will quietly go stale. The review-round figures below are different:
they are counted from `Maxcogar/NOVA` → `docs/reviews/`, which is an append-only record of rounds
that already happened, so they do not move.

---

## 1. The mismatch: a code-review skill doing document review

`expert-review` opens with "Read the code." Its standards menu is SOLID, DRY, YAGNI, OWASP, REST.
Its inventory rule reaches for `codegraph_get_dependents`. Almost none of that is what it has
actually been asked to do.

Counted from `NOVA/docs/reviews/`, 68 persisted rounds:

| What was under review | Rounds | Share |
|---|---|---|
| Plan documents (`.claude/plans/*.md`) | 35 | 51% |
| Governing docs & workflow prose | 15 | 22% |
| Fact base / diagnosis documents | 9 | 13% |
| Spec documents | 4 | 6% |
| Architecture documents | 2 | 3% |
| **Actual code / implementation** | **3** | **4%** |

Step 2 of the skill defines five inventory sources. Three are artifact-typed, each one line: spec
review, architecture review, and *plan-implementation* review — which is reviewing code against a
plan, not reviewing the plan.

**There is no mode for reviewing a plan document.** The 35 rounds spent on plan documents — over
half the corpus — ran under "Ad-hoc review (no upstream artifact)," the fallback bucket.

Those three one-liners are the entire artifact-type awareness in a 40 KB skill. Everything else
artifact-specific was reinvented, per review line, in the dispatch prompt — 137 KB of them,
disagreeing with each other. The `architecture` dispatch enumerates five named traps
(codebase-mirroring, pattern-cloning, decision-hiding, standards-decoration, deferred-decision)
that are permanent properties of architecture documents, hand-typed into one prompt and lost to
every other line.

---

## 2. The reviewer only checks what the dispatch hands it

The authoring skills carry rules the reviewer is never told about. Counting how often each was
checked across all 68 rounds, and how often it appears in any of the 14 dispatch prompts:

| Rule | In reviews | In dispatches | Where the rule lives |
|---|---|---|---|
| Scratchpad artifacts left in the document | 15 / 68 | 0 | `expert-plan` output-contract, Gate C |
| Unanswered questions / deferred choices | 18 / 68 | 0 | `expert-plan` output-contract, Gate C |
| Volatile measurements transcribed as constants | 11 / 68 | 1 | `expert-spec` and `expert-plan` |
| **Self-narration — the document describing its own posture** | **0 / 68** | **0** | `expert-spec` SKILL.md:153 |
| **THE QUESTION BAR — smuggled owner decisions** | **0 / 68** | **0** | `full-cycle` P2 rule 4 |
| **"Restate, don't annotate" — correction narration in operative text** | **0 / 68** | **0** | `full-cycle` correction procedure, Step 4 |

Measured by case-insensitive grep of each rule's own vocabulary across `docs/reviews/*/review-*.md`
(68 files) and `docs/reviews/*/dispatch-prompt*.md` (14 files).

The pattern is binary, and it is not about reviewer diligence. Every rule above the line lives in a
**gate checklist** that a dispatch prompt pasted in. Every rule below it lives in the authoring
skill's **prose**. The reviewer checked the first group and has never once checked the second.

**What that means for any fix.** Mirroring each authoring skill's output contract is not enough —
those gates were already getting checked. A per-artifact reference has to *extract the rules buried
in the skill's prose* and give them the same checkable form. That is where the misses are.

---

## 3. Reproducibility: three reviewers, one commit, three answers

Round 3 of the `t7-plan-derived-anchor` line was dispatched three times against the same commit
`e3407f8`, same prompt, same skill. All three completed. They returned 13, 10 and 9 findings.

One finding appears in all three at the same severity. The rest scatter — the same defect graded
three different ways:

| The same defect, as graded by… | 03a | 03b | 03c |
|---|---|---|---|
| V-6 anchor-field invariant cannot pass | Serious | Serious | Serious |
| Claim 28's scan scope is underived | **Systemic** | **Serious** | **Minor** |
| Step 1 cross-references point at old numbering | **Systemic** | **Minor** | **Minor** |
| P3 derivation command absent from the document | **Minor** | **Serious** | **Moderate** |

The coverage half of this was already logged as observation #236, with the owner's question:
*"how could one reviewer do more than the others if they're all given the same thing and all running
the expert review skill as required?"* The answer is Step 8: a systemic scan fires "once you
**suspect** a pattern," and suspicion is not a mechanism.

**The severity half was never logged and matters more than it looks.** Severity does not move the
verdict — PASS is zero-findings, so any finding is NEEDS FIXES. It does drive Recommended Priority,
the Convergence Record trajectory, and **the tripwire arithmetic**, which therefore runs on a count
that varies by 44% between reviewers on identical input.

Two further things that round exposed. Its own dispatch prompt records that **the first two attempts
produced nothing** because the mandated reading had grown to roughly 4,000 lines across nine
documents — the process collapses under its own accumulated context by round 3. And all three
reviews had to be recovered verbatim from `agent-*.jsonl` transcripts, because none surfaced to the
dispatching session. The plan was then discarded and the change implemented directly.

---

## 4. The tripwire divides by zero after any PASS

The Convergence Record fires a non-convergence tripwire on either of two conditions. Both are
computed across a PASS boundary, and the skill defines only two round types — first and post-fix —
so a legitimately reopened line inherits a trajectory that already terminated at zero.

The `workflow-hardening-2026-08-29` line went **13 → 8 → 2 → 1 → 0 (PASS)**. An owner correction
then reopened it as rounds 6 and 7, each finding exactly one thing and closing the prior one —
ordinary amendment work. Round 7 evaluated the tripwire as **FIRED on both conditions** and, per the
skill's own rule, opened Recommended Priority by demanding foundational rework on a document that
was one sentence from done. A diagnosis was written. Round 8 was dispatched "after the tripwire."

```
Condition (a) — new + regression ≥ closed, two consecutive rounds
  Round 6:  1 new  ≥  0 closed     TRUE   ← nothing existed to close
  Round 7:  1 new  ≥  1 closed     TRUE

Condition (b) — total findings has not strictly decreased, twice
  Totals:   0  →  1  →  1          TRUE   ← cannot decrease below 0
```

The first round after any PASS has zero prior findings to close, so condition (a) is satisfied by
*any* finding at all. Nothing can strictly decrease below zero, so condition (b) is satisfied too.
**Any amendment after a PASS that takes more than one round to close fires both conditions,
unconditionally, regardless of the work's quality.** It is a division by zero in the convergence
rule, not a judgment call the reviewer got wrong.

Cost in that one line: a spurious diagnosis, a spurious rewrite recommendation, and an extra round.

---

## 5. Mechanical defects, live at the time of audit

1. **`expert-review/SKILL.md` has no YAML frontmatter.** Line 1 is the words "Expert Review." That
   two-word string is the entire loaded description, so description-based activation is dead and the
   skill is reachable only by explicit file path. `expert-spec` has the same problem; `audit-swarm`'s
   frontmatter is malformed (`\-\-\-`).

2. **`/expert-review` does not exist.** `NOVA/.claude/commands/` holds expert-architecture,
   expert-spec, session-start, session-end and agent-compliance. No expert-review. Yet the skill says
   *"If you invoke /expert-review, you are asking for the full process,"* the `expert-standard`
   frontmatter says *"use the /expert-review command instead,"* and `expert-implement`'s
   `references/review-handoff.md` instructs *"Use /expert-review."* Three live pointers at a command
   that was never created.

3. **The version string is false.** The header reads `Version: R1.2 (2026-07-18)`. The file was
   edited on 2026-08-16, 08-17 and twice on 08-23 without a bump. Fourteen persisted reviews cite
   "R1.2" — at least three materially different process texts under one identifier. The review
   record cannot tell you which process a given round ran.

4. **`expert-standard` is scattered and divergent.** The directory in NOVA is `expert-standards`
   while the frontmatter declares `name: expert-standard`, and the spec dispatch prompt names a path
   that does not exist. The content problem is worse than the naming one: the copies are different
   documents. `expert-review`'s Prerequisites section bridges its vocabulary to "the foundational
   skill's **judgment axis** and **observation axis**" — and neither phrase, nor the word *premise*,
   appears anywhere in the copy NOVA reviewers were told to activate. Premise-correctness is one of
   `expert-review`'s two axes; its foundation was missing on every round. See `SKILL-REVISIONS.md`
   for the current copy and version counts.

5. **`PREFLIGHT` is enforced but never required.** `NOVA/tools/check-correction-gate.py` check D
   blocks the next reviewer dispatch if the prior review lacks the literal token. No copy of
   `expert-review` mentions it. The skill requires the substance — "each required instrument
   exercised with a real call" — but never names the token the gate greps for; only the dispatch
   prompt joins them. A whole session was lost to that seam: the gate blocked a round whose prompt
   had not asked for the header, which was misdiagnosed as a gate defect and "fixed" into a check
   that counted tool *mentions*, passing a review that said in plain words it had run nothing. Both
   "fixes" were withdrawn as non-defects.

6. **The observation loop is severed.** 34 observations are tagged `expert-review`. One is actioned.
   `.claude/skill-observations/last-review-date.txt` reads 2026-05-27 while the log runs to #258 in
   September. Capture works; harvest does not. Observations #235, #236, #237, #239 and #254 all
   contain fully specified fixes nobody has applied.

7. **An unmerged fix to the skill itself.** Branch `fix/expert-review-reference-set-structural`,
   commit `929b9ab` (2026-09-01), two lines. It closes a Step 3 / Step 6 ambiguity that produced a
   five-round recurrence: whether "does the artifact name every reference of this changed symbol?"
   is a structural claim (CodeGraph) or an absence claim (grep). It sat unmerged, and eight days
   later the same ambiguity bit in the opposite direction as finding F-5 of the MCP plan's round 6.
   *Merged 2026-09-15 via `Maxcogar/NOVA` PR #48.*

---

## 6. Cost

The `PREFLIGHT` blocks in the `om-rev4` rounds run roughly 1,500 words each — every grep with its
result count, every `git rev-parse` blob id, every `sed -n` line, hand-transcribed into a single
paragraph. Reviews average 34 KB; the largest is 74 KB. Total persisted reviewer output: 2.3 MB
across 68 rounds. One unit alone is recorded at 4,219,172 subagent tokens for six rounds. Twelve of
the 68 rounds ended PASS.

Four lines ran to 7, 8, 9 and 12 rounds. `h0-2-honest-foundation-remediation` — a plan document —
took twelve rounds and never reached PASS in the corpus.

**The receipt problem.** A hand-written `PREFLIGHT` block is the model's *claim* about what it ran —
exactly the category Step 6 forbids everywhere else, which requires a statement of what an
instrument returns to be transcribed from a run. The receipt is the one place the skill exempts
itself from its own rule, and it has already been shown forgeable. The session transcript holds the
real tool-call log; generating the receipt from that log makes it evidence rather than narration.
The split is clean: which instruments were called, with what arguments, and what came back is
scriptable; which instrument classes this scope's claim types *require*, and whether an
unavailability is an isolated gap or a halt, is the Step 3 judgment and is not.

---

## 7. What this points to

The primary fix is structural. Each authoring skill already defines a checkable contract —
`expert-spec` Gates A/B/C, `expert-architecture`'s five-part decision format and five traps,
`expert-plan`'s sixteen sections and Gates A/B/C — and the reviewer cannot see any of it. Every
dispatch prompt under `docs/reviews/` is a hand-rolled bridge across that gap, and the bridges
disagree.

The integration point already exists for exactly one skill: `expert-implement` ships
`references/review-handoff.md`, a dispatch template inside the authoring skill. `expert-spec`,
`expert-architecture` and `expert-plan` have no equivalent. That is why their reviews are
hand-rolled every time.

Open design questions, in the order they block work:

1. **Per-artifact review references.** One per artifact type, packaged under `expert-review`'s
   `references/`, carrying the authoring skill's prose rules and not just its gate checklist — §2 is
   the evidence for why the checklist alone is insufficient. A plan-document mode is the largest
   single gap (51% of rounds, no defined mode).
2. **A standing scan library.** A fixed set every round runs and enumerates regardless of suspicion,
   with severity anchored by rule rather than judgment. Closes the §3 variance. Observation #236
   drafts the document-side list.
3. **An amendment round type.** A third round type with its own counter and its own inventory rule,
   so convergence arithmetic does not divide by a PASS (§4). The
   `dispatch-prompt-amendment-04.md` in `h0-2-desktop-remediation-plan` already hand-wrote the
   inventory rule this needs; it has no home in the skill.
4. **Scope by change, not by budget.** The round-3 collapse at 4,000 mandated lines is a design
   limit. A token budget would collide with the skill's own "no skip conditions" doctrine and is not
   verifiable from the output. The correct mechanism already exists and is bound by something
   checkable — the verified-unchanged carve-out, which scopes by byte-identity confirmed with
   `git diff` — and it should be extended to cover what the *dispatch* mandates, not just what the
   artifact contains.
5. **The mechanical defects in §5**, each of which is small and independent.

---

## Corrections to earlier drafts of this audit

The first version of this audit was written before the repositories were swept, and two of its
claims were wrong. Both are corrected above; they are recorded here because the wrong versions were
shown before the right ones.

- It described `design-navigator-mcp-ui` as carrying "a full phase-skill set." *Phase skill* is a
  real term from `full-cycle:90` and means one of the three artifact-authoring skills — spec,
  architecture, plan. The phrase "full phase-skill set" was invented, and the word *full* was false:
  that repository has no `expert-spec` skill and no `full-cycle`, and NOVA carries more than it
  does. What was actually notable is narrower — it holds a distinct `expert-review` text that no
  earlier survey had looked at.
- Its copy counts came from searching for files named `SKILL.md`. The skills are also installed as
  slash commands, subagent profiles and always-on rules, so that search missed roughly half of them,
  including the largest and most recently edited `expert-architecture` text in existence
  (`NOVA/.claude/commands/expert-architecture.md`). Counts are no longer carried here at all; see
  `SKILL-REVISIONS.md`, which searches by form and location rather than by filename.

## Provenance

Every figure in §1–§6 was counted from the repository at the time of the audit, not recalled. Round
counts and byte totals from `find docs/reviews -name 'review-*.md'`; rule-coverage counts from
case-insensitive grep of each rule's own vocabulary across the review and dispatch files; the
tripwire arithmetic re-derived from the skill's stated conditions against the persisted trajectory;
the three-reviewer comparison read from the three round-03 files, which are persisted unmerged under
`docs/reviews/t7-plan-derived-anchor/`.

A rendered version of this audit was published as an Artifact at
`https://claude.ai/artifact/UjnLWC52DhU9emxEjrZQFS`. **This file is the canonical one.** The
artifact was written first, carries the two errors listed above, and is not updated in step with
this file.
