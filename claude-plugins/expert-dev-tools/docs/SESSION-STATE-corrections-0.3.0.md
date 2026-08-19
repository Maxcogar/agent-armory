# Session state — corrections-0.3.0 loop (write-through for context compaction)

Updated 2026-08-19. This file is the authoritative continuation point if the session compacts.

## Where things stand

- **Branch:** `claude/edt-corrections-0.3.0` (base: origin/main). Commits so far:
  2b1b7d8, 95173db, e969eb1, e8d016e, 1f014e0, 8141ac5, 55562f6, b972e79. Not yet a PR.
- **What the branch is:** the five owner-approved corrections from the behavioral acceptance
  run (see `.claude/expert/ACCEPTANCE-RESULTS-2026-08-17.md` in the agent-armory root and
  `~/.claude/plugins/data/expert-dev-tools/defect-history.json`), plus seven review rounds of
  fixes. Plugin version bumped to 0.3.0 in the first commit.
- **Review loop:** rounds 1–7 records at `docs/reviews/corrections-0.3.0-round-0*.md`.
  Trajectory 9 → 7 → 5 → 5 → 4 → 3 → 3. **Both tripwire conditions armed after round 7**:
  round 8 must close strictly more than it introduces AND land at total ≤ 2, or the loop
  stops for foundational rework.
- **Round 7 findings:** F7-1 (deployment pins) and F7-3 (arrow extraction) APPLIED in b972e79,
  tiers 234/234 + 17/17 green. **F7-2 decided by owner 2026-08-19: option 1 — amend spec §3.4
  and the architecture to SEVEN gate types** (add `control_fault`: a mechanical control could
  not run; the phase is unverified; re-run is the usual answer). That amendment is the next
  action.

## Next actions, in order

1. **Amend spec §3.4** (`claude-plugins/expert-dev-tools/docs/specs/spec-expert-dev-tools.md`,
   the "exhaustive list … exactly these, and nothing else" six-item gate list) and the
   **architecture** (`docs/arch/architecture-expert-dev-tools.md` ~:226-233, six-member union
   + "exactly the spec §3.4 escalation list") to seven members, each amendment carrying a note:
   "Amended 2026-08-19 by owner decision (corrections-0.3.0 round-7 F7-2): control_fault added —
   a mechanical control could not run or returned less than asked; the phase is unverified, not
   failed; distinct from non_convergence (round cap) and spec_traceable (traces to spec intent).
   Evidence: acceptance-run control failures, records in docs/reviews/corrections-0.3.0-*."
   Also fix `commands/expert.md` line ~180 "The six gate types" → "The seven gate types".
   Check the plan reference at `docs/plans/plan-expert-dev-tools-behavioral-remediation.md:1439`
   (states six fixed by spec 3.4) — do NOT edit the plan (grandfathered artifact); the spec
   amendment note is the traceability.
2. **Commit** (message: spec+arch amendment per owner decision, cite F7-2), push.
3. **Dispatch round 8 review** — same pattern as rounds 1-7: expert-dev-tools:expert-reviewer,
   diff against origin/main, prior records round-01..-07, verify F7-2's disposition (owner
   decision recorded; spec/arch/command consistent at seven; no doc says six anymore — grep),
   re-verify F7-1/F7-3 by execution/mutation, new-defect scan, eight-round convergence +
   explicit tripwire arithmetic. Reviewer persists to
   `docs/reviews/corrections-0.3.0-round-08.md` itself, returns verdict-only summary.
4. **On PASS:** open the PR (gh unavailable — use the GitHub API with the token from
   `git credential fill`, pattern used for PRs #55-#57). PR body: five corrections + 8 review
   rounds + owner decisions (intake authorization, scope baseline, write-scope, ground-truth
   targeting, gate-discussion rule; spec amended to seven gate types). Base: main.
5. **After merge:** owner updates plugin via /plugin (0.2.1 → 0.3.0), /reload-plugins; then
   mark the five defect-store signatures `corrected` with fixed_in_version 0.3.0 + the merge
   commit in `~/.claude/plugins/data/expert-dev-tools/defect-history.json`.
6. **Remaining session wrap-up items:** CORE ingestion draft (owner approval required; per
   CLAUDE.md protocol — aspect-prefixed lines, session covered: acceptance tier all-PASS,
   five corrections, seven+ review rounds, owner decisions); optionally update
   `docs/HANDOFF.md` to current state (behavioral tier PASSED, corrections landing).

## Standing dispatch rules (hard-won this session)

- Reviewers/correctors PERSIST THEIR OWN artifacts to disk and return verdict-only summaries.
- Fresh reviewer every round; pointers only; no author summaries; mutation probes on scratch
  copies only, restore verified (a git-checkout restore renormalizes line endings — the
  workflow/tests files are LF in the working tree right now; normalize CRLF→LF in any patch
  script before matching, and beware bash heredocs eating backslashes — write patch scripts
  to files with the Write tool).
- Both tiers must be run by the reviewer itself, never trusted from commit messages.
- The owner does not need memory-creation asked about; CORE ingestion always needs explicit
  payload approval.

## Key facts

- Deployed plugin cache: 0.2.1 at `~/.claude/plugins/cache/claude-armory/expert-dev-tools/0.2.1/`.
- Acceptance tier: ALL CRITERIA PASS (A-1..A-9, RV) — `.claude/expert/ACCEPTANCE-RESULTS-2026-08-17.md`.
- Five deferred corrections: intake authorization axis; scope-check baseline (checkpoint-on-
  approval + hash-anchored attribution); dispatch write-scope + upstream-defect channel;
  ground-truth targeting (owner-approved spec + latest impl PASS + registered impl artifacts);
  command-tier gate-discussion authorization. All implemented on the branch.
- Test counts current: structural 234, unit 17, both green at b972e79.
