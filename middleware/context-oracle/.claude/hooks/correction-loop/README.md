# correction-loop — hooks that hold the author inside one review issue at a time

**Goal.** Plan-correction passes regressed for three consecutive review rounds because the
author acted on findings as a fix list, edited without re-reading, and redesigned decisions
inside a bulk pass. This loop makes that impossible mechanically: the author never sees the
finding list, receives one issue at a time with every plan unit it touches and the sources
those units cite, must write a full proposal before the plan is editable, and cannot end a
turn until a judge rules that the packet was read whole, the proposal covers every unit and
re-derives from the sources, the edits implement the proposal exactly, and the self-check is
complete. A failure names the step number only. Static rules were tried first and did not hold.

**Nothing here is specific to one plan or one project.** The plan under review is taken
from the reviews' own `path:line` citations; the review round is discovered anywhere under
the project by the reviewer skills' file names (`…round-N-expert-review.md`,
`…round-N-collapse-hunt.md`); plan units are located by the expert-plan output contract's
structure (numbered steps, `T-<step>-<n>` specs, `D-plan-<n>` decisions and their collapse
tests, `Q<n>` register entries, section-11 claims, checkpoints); and any identifier-shaped
token a finding or a step's Source line cites is looked up as a heading, bullet, or table
row across every markdown document under the project (plans, reviews and this loop
excluded), documents ordered by how often the plan cites them.

**Where the wiring lives.** A `.claude/settings.json` loads only from the repository root, so the
three entries are in the repository-root settings file (added 2026-09-07 on the owner's
instruction, beside the existing Stop gates); the scripts and their state stay here. The
project-level settings file does not load in a session rooted at the repository.

**Events and why** (behaviour per the hooks reference, verified 2026-09-07 against the skill's
transcription of the official page):
- `PostToolUse` matched on `Agent` (`serve.py`): a review subagent returning is the moment the
  findings exist. Non-blocking event; the hook injects `additionalContext` naming the packet.
  Reviewers that run in the background never fire it, so the Stop hook carries a fallback start.
- `PreToolUse` on every tool (`guard.py`): the only event that can block a call before it runs;
  `hookSpecificOutput.permissionDecision: deny`. Denies reads of review files and of the loop's
  own files, any change to the loop tooling or the settings file, and plan edits before
  `state/proposal.md` exists. No-op when no issue is active.
- `Stop` (`judge.py`): the only event that can keep the agent working; `{"decision":"block",
  "reason":…}`. Step 1 is mechanical (transcript tool calls since the packet was served); steps
  2–4 are ruled by a headless `claude -p` judge (no tools, `--max-turns 1`, recursion-guarded by
  `CORRECTION_LOOP_JUDGE_RUN`, run from a temp cwd so no project hooks fire inside it). The
  derivation check is also run mechanically. Pass serves the next issue in the block reason.

**Validation gate.** No-op firing: every hook exits 0 with no output when `state/current.json`
is absent. Blocking: PreToolUse deny and Stop block via JSON on exit 0, never exit 1; the Stop
loop is intentional and bounded by the platform's 8-consecutive-block force-end, after which
the state persists and the next Stop re-judges. Decision schemas: PreToolUse
`hookSpecificOutput.permissionDecision`; Stop top-level `decision`; PostToolUse
`hookSpecificOutput.additionalContext` phrased as fact. Context budget: one notice per served
issue; the packet itself is a file. Latency: guard and serve are sub-second; the judge runs
only on Stop while an issue is active (seconds to a few minutes). Failure mode: a crashed
guard denies; a crashed or unavailable judge blocks with the detail; nothing fails open.
Resume: state is on disk and idempotent; the packet path is re-read from `state/current.json`.
Portability: python3 and the `claude` CLI on PATH; paths derive from the hook's own location.
Security: the guard is string matching on tool inputs — a tripwire, not a sandbox; the sha256
record of the hook files and the settings file, re-checked on every Stop, is the enforcement.

**Interactions.** The repo-root Stop gates (completeness, instruction-adherence) still run;
any block from any Stop hook keeps the turn going. `session-end-check.sh` is unchanged.

**Tested (2026-09-07).** Queue and packets built from the round-5 reviews (24 findings; packets
5–113 units; every cited identifier resolved from the Phase A architecture, the spec, or the
ledger, one noise token reported); guard against 25 sample calls (review reads, loop-file reads/edits, git checkout
of the hook dir, plan edits before/after proposal, read-only derivation calls); read-check
against Read/cat/head/sed forms; judge dry-run on fabricated state: step 1 (nothing read),
step 2 (no proposal), step 2 by the model on a one-line proposal (opus-5, 9 s). Not tested:
a full pass through steps 3–4 (needs a real issue), and whether this project-level settings
file loads in the current session (established by the first live firing).

**Tunables.** `CORRECTION_LOOP_JUDGE_MODEL` (default `claude-opus-5`),
`CORRECTION_LOOP_JUDGE_BUDGET_USD` (3.00), `CORRECTION_LOOP_JUDGE_TIMEOUT` (300 s).
