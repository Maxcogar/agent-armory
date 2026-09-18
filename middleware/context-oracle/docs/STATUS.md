# Context Oracle — status

*Plain-language project status, rewritten each session (not appended). It states
the current state and what to do next; evidence lives in `docs/reviews/`, durable
lessons in `docs/collapse-log.md`, ideas in `docs/IDEAS.md`, and everything
attributed to Max Cogar in `OWNER-LEDGER.md`.*

## The Phase A goal (the north star — read this first)

Phase A is the **honest deterministic foundation, and the measurement of its own
floor.** It stands up the genuinely-deterministic core on Max's real repos — the
stores, the index, the miner, the model-free whisper genres, the deny plumbing,
the self-observability — runs cleanly with no incident, and tells Max the truth
about what that core does and does not do. The spec (§11.5) defines the Phase A
exit as a *measurement*, not a finished feature: it "exits by producing measured
whisper/block, false-fire, and regret data on a real repo — **including how
little the conservative recognizer catches** before Phase B." The deliverable is
honest capability plus honest measurement, with clean seams the later phases plug
into — **never fake completeness dressed to look like a working product.** Judge
every Phase A decision against this goal (`CLAUDE.md` dominating rule 3).

## Where the project stands

The spec (`docs/specs/spec-context-oracle.md`) is signed off (`OL-C6`). The Phase
A architecture (`docs/architecture-phase-a.md`) is reviewed to convergence.

**The Phase A implementation plan (`docs/plans/plan-phase-a.md`) is converged and
is the build contract. The next step is to build it.** It has been carried through
the independent review-and-fix loop to a clean close: the final round's two
independent passes — an expert-review and a collapse-hunt — both returned PASS
with zero Moderate-or-above findings. Its mechanical gates are green and are the
first things to re-run if anything about the plan seems off:

- `node .claude/skills/expert-plan/scripts/derive-plan-sections.mjs docs/plans/plan-phase-a.md --check` — 40 steps, 124 test specs, 26 probes cited, regions current
- `node .claude/skills/expert-plan/scripts/derive-plan-sections.mjs --self-check` — 34 checks
- `node .claude/skills/expert-plan/scripts/run-plan-probes.mjs docs/plans/plan-phase-a.md` — all 26 probes match their recorded expectations
- `python tools/check_docs.py` — cross-document consistency

The one seam that took the review series to converge is the co-change miner's
reading of `git log --numstat` (Step 13). It is resolved at the root: the miner
reads history under **`-z`** and parses the stream on **NUL** — the only byte a
pathname cannot contain — with each commit record marked by a `%x1e` + 40-hex
(`%H`) header field. Under `-z`, git emits every path raw (no `core.quotePath`
C-quoting of *any* byte) and a rename as two separate NUL-delimited fields, so a
filename that contains ` => ` or a raw control byte is never mis-keyed and no
rename is ever guessed; `probe:24_git_numstat_z` grounds this against real git.
The full history of that seam — why line-by-line parsing was the wrong root, and
the verify-before-you-assert failure the `-z` rewrite itself hit and fixed — is in
`docs/collapse-log.md` (2026-09-18); the per-round evidence is in
`docs/reviews/2026-09-18-round-*`.

**One optional cleanup for the builder (non-blocking).** The *reference* parser in
`docs/plans/plan-phase-a.probes/24_git_numstat_z.mjs` carries two now-redundant
`cur` null-checks — an early `if (!cur) continue` guard makes the inner
`if (cur)` / `else if (cur)` checks dead code. It changes no behavior and blocks
nothing; when Step 13 builds the production miner's parser, write it without them.

## What to do next

**Build Phase A.** Run `/expert-implement` against `docs/plans/plan-phase-a.md`,
Step 1 first. Step 1's first act is `npm ci` on the committed lockfile, then a
source file that imports `web-tree-sitter`, compiles under the pinned `tsconfig`,
and loads a grammar — which re-executes the probes that would catch a
non-functional runtime pin before any later step builds on it. Execute the steps
strictly in order; the plan is written to make every decision, so a spot where
you would have to choose on the fly is a plan defect to stop and report (the
`expert-implement` STOP REPORT), not to improvise past.

Build against the §11.5 phase exit and the §14 acceptance criteria, and judge
every build decision against the Phase A goal above — not against passing review
(dominating rule 3). The independent review of the built work is dispatched to a
neutral subagent per
`.claude/skills/expert-implement/references/review-handoff.md`; you never grade
your own work.

One premise the earlier reviews flagged and dispositioned: Unicode NFC/NFD path
normalization is **out of scope** for Phase A's Linux target (confirmed by
independent execution). Do not reopen it in the build without new evidence.

## Current repo state the build inherits — enforcement hooks are disabled

The two repo-root Stop-hook gates (`hooks/stop-completeness-gate/`,
`hooks/stop-instruction-adherence-gate/`) and the context-oracle correction-loop
hooks are **disabled at Max Cogar's explicit request**: the gate scripts
short-circuit to `exit 0`, and `.claude/settings.local.json` sets
`CORRECTION_LOOP_JUDGE_RUN=1` so the loop's judge/guard/serve stand down. Reason:
all three judges spawn a nested `claude -p` subprocess that hung/timed out for
hours — the session-isolation bug in Open Items below (fix: PR #82). The disable
is a deliberate, owner-authorized operational unblock, **not** a licence to skip
review rigor: the independent-review discipline (dominating rule 2) still applies
by hand — it is simply no longer auto-enforced by a broken judge. If the build
re-enables or relies on these gates, fix the `claude -p` isolation first.

## Open items

- **The runtime-pin and sandbox premises settle the first time the build's CI
  runs.** Behaviour at the Node 22.16.0 engines floor is executed only by CI's
  matrix entry and the pin runs (`npx node@22.16.0`); whether `unshare -rn` works
  on the GitHub Actions runner image is still open — the optional
  `09_unshare_no_network.optional` probe is evidence for this container, not for
  the GHA runner.
- **L11(a)** — human-marker presence is measured on interactive transcripts; the
  plan reports it *verified* only when an owner-local interactive transcript is in
  the exit corpus, otherwise *not observed*.
- **L11(b)** — whether `UserPromptSubmit` fires for platform-injected turns is
  undocumented; the plan resolves it by live induction inside the exit run's
  closed-loop leg. Design-safe either way per `AD-9`'s voiding guard.
- **Two real bugs in this repo's own Stop hooks (`hooks/stop-completeness-gate/`,
  `hooks/stop-instruction-adherence-gate/`), outside Context Oracle's scope,
  recorded here once per Max Cogar's explicit instruction.** Both gates spawn
  their judge subprocess (`claude -p`) with `os.environ.copy()` without stripping
  Claude Code's session-identity variables, so the judge attaches to the live
  session and hangs/dies empty; the gates then fail closed. The fix is
  `Maxcogar/agent-armory` PR #82 ("Fix session isolation and transcript pollution
  in both Stop-hook gates"). This is not a standing practice — future unrelated
  findings do not belong in this file.
