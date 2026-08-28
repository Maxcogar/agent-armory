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
- **CLAUDE.md re-pointed** to the current spec's numbering (§11.5 exits, §12 judgments, §13 open
  assumptions, §14 acceptance), the per-phase amendment restated in A/B/C terms, and legacy keys
  (OWNER-12, `[OWNER-n]`) corrected to ledger keys.
- **The retained whole-scope architecture doc** (`docs/architecture-context-oracle.md`) now
  carries a historical-record banner; it predates the blocking rebuild and had none.

The spec is 1,116 lines; the strip's cuts of genuine narration were kept. Work is on
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
   the answer-drift async question/answer-state maintenance (off the synchronous deny path, honoring
   the FR-B1 lag-window hold), the skill block's post-condition chaining, the stores/index/miner,
   and the relevance bar's numeric combinator. At architecture time, re-confirm against current
   source that `transcript_path` is written asynchronously / may lag (the answer-drift clear-axis
   rests on it; the hooks contract has drifted before).

## Question for Max (yes/no)

The spec header used to say "draft for owner review," but no sign-off of the spec document as a
whole is recorded in `OWNER-LEDGER.md` — only the individual OL entries are confirmed. **Do you
want to bless the spec as-is so the architecture proceeds on a signed-off spec (yes), or should
the agents proceed on the current spec of record without a formal sign-off entry (also fine —
say so and this item is closed)?** Nothing is blocked either way; this only decides whether the
ledger records a spec-level sign-off.

## Open external unknown (does not gate v1 design)

Whether a subagent hook's `additionalContext` propagates to the parent is undocumented; the spec
assumes **not** (C-4) and a cheap pre-design spike showing otherwise only adds an option. (Spec §13.)
