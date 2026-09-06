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
A architecture (`docs/architecture-phase-a.md`) is reviewed to convergence
(round 10, `docs/reviews/2026-09-03-round-10-expert-review-architecture-phase-a.md`,
verdict PASS), with `AD-9` rebuilt to the honest Phase A skeleton the spec mandates.

**The Phase A implementation plan still does not exist in a buildable form.** The
attempt at `docs/plans/plan-phase-a.md` failed both independent reviews
(`docs/reviews/2026-09-06-plan-collapse-hunt.md` — DOES NOT SURVIVE;
`docs/reviews/2026-09-06-plan-expert-review.md` — NEEDS FIXES) and cannot be
patched to pass: its collapses are at the plan's shape (build order, a test
runner that never executes the `.ts` tests, an exit run on the tool's own
repository instead of the owner's real code repositories). It stays on `main` as
the record of what was tried. The rewrite replaces the file; nothing in it is
patched.

**Why the plan was not restarted this session.** `/expert-plan` requires the
CodeGraph and Clear Thought MCP tools and names a missing required tool a halt
condition, not a license to improvise. That condition was re-verified at the
start of this session: a tool search for `codegraph` and for `clear_thought`
returned nothing, and `claude mcp list` from the repository root showed no
servers at all. The cause was found by reading the environment rather than the
tool list: the only MCP configuration was `middleware/context-oracle/.mcp.json`,
and Claude Code loads project-scoped servers only from the **repository root's**
`.mcp.json` (current docs, read 2026-09-06). A subdirectory file is never seen.
CodeGraph was never configured anywhere, even though the server itself lives in
this repository at `mcp-servers/codegraph-mcp/`.

**What was done instead — the environment fix for the next session:**

- A repository-root `.mcp.json` now declares both servers: `clear-thought`
  (`npx -y @waldzellai/clear-thought-onepointfive`) and `codegraph`
  (`mcp-servers/codegraph-mcp/run.sh`, a launcher that installs and builds the
  server on first use because `dist/` and `node_modules/` are gitignored, then
  starts it). The subdirectory `middleware/context-oracle/.mcp.json` was removed
  as a duplicate that never loaded.
- Both servers were started by hand in this container and answered an MCP
  `tools/list`: Clear Thought (v0.0.5) exposes one tool, `clear_thought`;
  CodeGraph exposes 32 tools, including every `codegraph_*` tool the
  `expert-plan` skill names (`codegraph_scan`, `codegraph_get_stats`,
  `codegraph_find_related_docs`, `codegraph_verify_doc`, `codegraph_diff_surface`,
  and the rest). CodeGraph's `npm ci` + `tsc` build took about ten seconds here.
- The load-bearing premise, from the current Claude Code docs (read 2026-09-06):
  in cloud sessions Claude Code "can't show that prompt: it loads project-scoped
  servers without asking." In a local terminal session it does prompt once; if
  Max ever runs Claude Code on his own machine in this repository he approves
  the two servers when asked.
- **Not verified:** that the next cloud session actually exposes the tools. The
  servers were not picked up by the running session (a tool search after
  writing `.mcp.json` still found nothing; MCP servers load at session start),
  so the proof is the next session's first check, below.
- Side effect, stated plainly: the root `.mcp.json` applies to every cloud
  session started in this repository, not only Context Oracle sessions. Each
  session will start these two servers; the first CodeGraph start in a fresh
  container builds it (seconds, on stderr).

## What to do next (agent-owned)

1. **First thing next session: check that the tools loaded.** Search the tool
   set for `codegraph` and `clear_thought`. If both are present, the halt
   condition is lifted — go to step 2. If either is absent, the halt still
   holds: diagnose the loading (`claude mcp list` from the repository root; the
   launcher `mcp-servers/codegraph-mcp/run.sh` run by hand with the MCP
   `initialize` / `tools/list` handshake on stdin), fix the environment, and do
   **not** write a plan. Never re-open the accept / halt / waive question to
   the owner — the project's answer to a missing required tool is halt
   (`CLAUDE.md` dominating rule 2), and the fix is the agents' work.

2. **Restart the Phase A plan from scratch under `/expert-plan`**, with
   CodeGraph and Clear Thought actually invoked where the skill mandates them.
   The current `docs/plans/plan-phase-a.md` is replaced, not patched. **Every
   finding across all four review documents applies to the rewrite** — not a
   prioritized subset:
   `docs/reviews/2026-09-06-author-gates-review.md` (C1–C5, S1–S7, M1–M4,
   m1–m4), `docs/reviews/2026-09-06-meta-check-skipped-steps.md` (H1–H8),
   `docs/reviews/2026-09-06-plan-collapse-hunt.md` (C1–C3, P1–P4, N1–N6), and
   `docs/reviews/2026-09-06-plan-expert-review.md` (S1–S3, M1–M5, m1–m2).
   Judge every plan decision against the Phase A goal above before judging it
   against the skill's gates — the collapse-hunt's C1 (build order that puts the
   fallible recognizer's fixtures first) and C3 (an exit run that is not on the
   owner's real code repositories) are goal-service failures, not formatting.

3. **Deliver through the gates, in order.** The author walks Gates A, B, and C
   of the plan skill's output contract *before* committing or opening a pull
   request; then dispatches the independent collapse-hunt and the independent
   `/expert-review` against the **committed** file (never a stale commit); then
   applies all findings and re-reviews until a round finds nothing real. Only
   then is the plan deliverable, and only then does the build start.

4. **Owner-facing.** Nothing is waiting on Max Cogar. If the next session
   finds the tools present, no action from him is needed at all.

## Open items

- The Phase A plan is not deliverable; restart per items 1–3 above.
- Whether the next cloud session loads the root `.mcp.json` servers is
  unverified until that session checks (item 1).
- L11(a) — human-marker presence on Max Cogar's real interactive transcript was
  resolved 2026-09-06 by direct measurement of
  `/root/.claude/projects/-home-user-agent-armory/dc9955b4-2023-5a97-b6a3-47796382cb94.jsonl`
  (11 `origin.kind:"human"` entries, markers present exactly as V12 and
  `AD-9` assume). The documentation update moving architecture L11(a) from
  "assumption pending" to "measured" is a post-Phase-A-completion task.
- L11(b) — whether `UserPromptSubmit` fires for platform-injected turns
  remains empirically unresolvable inside this container (hook install
  blocked by the auto-mode classifier). Design-safe either way per `AD-9`'s
  voiding guard. Natural resolution: first real install of the tool.
