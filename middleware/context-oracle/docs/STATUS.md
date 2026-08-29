# Context Oracle — status

*Plain-language project status, rewritten each session (not appended). It states
the current state and what to do next; evidence lives in `docs/reviews/`, durable
lessons in `docs/collapse-log.md`, and everything attributed to Max Cogar in
`OWNER-LEDGER.md`.*

## Where the project stands (2026-08-28, second session)

The **spec** (`docs/specs/spec-context-oracle.md`) is the single spec for the whole tool,
built in phases (A/B/C are build order, not separate products). The blocking model was
independently reviewed to convergence 2026-08-25. Nothing has been built; the next lifecycle
stage is the Phase A architecture document.

**This session: the 2026-08-28 narration strip was audited and found NOT lossless, and the
cross-document state was reconciled.** The previous session's claim of "no loss of requirements
or properties" was wrong — Max Cogar's suspicion triggered a diff audit of the full strip
(`ddbe5ae^..f9f9530`), which found the strip had deleted three substantive items along with the
narration, and an independent full-document contradiction sweep then found 13 further findings
(4 Serious). All were verified and applied:

- **Restored to the spec:** the answer-drift **lag-window lean** (hold/deny, don't pre-clear on
  unclassified text — the round-5 collapse-hunt's one real finding, FR-B1/FR-B5/D-41); the
  **FR-O4/FR-O4a retired-ID resolution note** (§8: FR-O4 → FR-B3, FR-O4a → FR-B4); the FR-A2l
  clause that the answer-drift block is **authorised by OL-C3/OL-C5, not OL-9**.
- **OWNER-LEDGER.md fixed:** the preamble's "the one block Max wants" now names both confirmed
  blocks (it contradicted its own OL-3/OL-C2 rows); OL-9 ("advisory only") now carries its
  supersession marker (OL-C2/OL-C3, 2026-08-16).
- **RETHINK.md synced** with dated supersession annotations everywhere the superseded
  no-blocking model still spoke as current: §12 decisions 3, 9, and 12, the §5 signal-table
  "never a denial" row, the §5 "hard caps" budget line (agent-planted per OL-R3, ruled out by
  OL-C1), the §6 "ship the bar high" line (qualified by OL-C4), and the §12.2 MCP-sampling
  recommendation (deprecated — spec C-5). Max's historical words are untouched; each note points
  at the ledger and spec §8.
- **collapse-log corrected in place:** two entries attributed the RETHINK §5 budget words to
  "the owner" — an attribution OL-R3 explicitly rejects; a pointer to the deleted Phase 0 spec
  re-aimed at the surviving review record. New 2026-08-28 entry: a deletion pass has the same
  blast radius as a writing pass and needs the same independent check.
- **CLAUDE.md rewritten as a lean standing-rules file** (346 → 207 lines): every rule preserved,
  every dated history narrative reduced to a collapse-log pointer, section references corrected to
  the current spec's numbering, legacy keys corrected to ledger keys. The file now states its own
  membership test at the top.
- **The retained whole-scope architecture doc** (`docs/architecture-context-oracle.md`) now
  carries a historical-record banner; it predates the blocking rebuild and had none.

The spec is 1,121 lines (after a CodeRabbit review round clarified the lag-window hold as
clear-axis-only in FR-B1/FR-B5/D-41); the strip's cuts of genuine narration were kept. Work is on
branch `claude/project-oracle-handoff-gtdki3`, PR
https://github.com/Maxcogar/agent-armory/pull/69.

## The two blocks, as the spec states them

Both are owner-confirmed; both are a reactive `PreToolUse` **deny of the deviating action**, never
a pre-emptive gate, never a Stop-based hold. §8 is the authority.

- **Answer-drift (OL-C3 / OL-C5).** After Max asks a question, a next move that is neither a direct
  answer nor an action taken to provide the answer is denied ("answer Max first") until the agent
  answers. Actions that get the answer — reading, searching, running a test — run freely; a text
  answer is never a tool action, so it is never denied: the way out always exists. The clear-axis
  errs toward clearing on substance in steady state and reverses to hold in the classifier lag
  window (FR-B1). Phase A ships a conservative skeleton; Phase B gives it OL-C5 precision.
- **Skill non-conformance (OL-C2).** An expert skill is active and the agent skips a declared step:
  steer first (whisper), then deny the step-skipping action if it proceeds without a stated reason.
  Its under-fire guard is automated (a step's observable post-condition checked against repo/store
  state), because Max cannot see a skipped step himself (OL-11). A step with no checkable
  post-condition is out of that guard's reach.

## What to do next (agent-owned)

1. **The Phase A architecture document**, derived from the current spec — no build before it. It
   is where the mechanisms the spec states as properties get designed and adversarially reviewed:
   the answer-drift async question/answer-state maintenance (off the synchronous deny path per
   NF-1/§11.5, honoring the FR-B1 lag-window hold), the skill block's post-condition chaining
   (FR-C4), the stores/index/miner (spec §11.1, FR-K1–K7), and the relevance bar's numeric
   combinator (FR-A5, the architect's per `[D-6bar]`). At architecture time, re-confirm against
   current source that `transcript_path` is written asynchronously / may lag (`[HOOKS]`, spec §13;
   the FR-B1 clear-axis rests on it and the hooks contract has drifted before).

## New this session: a blocking CI gate on document consistency

Max Cogar asked how future sessions are prevented from rotting the documents again. The honest
answer was that nothing blocking existed — the CLAUDE.md rules are advisory and the Stop hook
never blocks. Now `middleware/context-oracle/tools/check_docs.py` runs in CI on every pull
request touching this project (`.github/workflows/context-oracle-docs.yml`) and **fails the PR**
on: citations to nonexistent requirement/ledger keys, references to nonexistent spec sections,
retired IDs cited as live, handoff files, edited reviews, or a project change without a STATUS
rewrite. Verified by running it: passes the current tree, catches all seeded error classes.
Honest scope: it catches *referential* rot mechanically; semantic contradictions (two documents
asserting incompatible things in prose) still require the independent sweep discipline — the
gate narrows the hole, it does not close it.

## Resolved this session: spec sign-off

Max Cogar signed off the spec on 2026-08-28 — *"yeah thats good with me. Mark it as good to
go"* — recorded as **OL-C6** in `OWNER-LEDGER.md`; the spec header carries it. No owner
questions are open.

## Open external unknown (does not gate v1 design)

Whether a subagent hook's `additionalContext` propagates to the parent is undocumented; the spec
assumes **not** (C-4) and a cheap pre-design spike showing otherwise only adds an option. (Spec §13.)
