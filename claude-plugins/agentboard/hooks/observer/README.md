# Workflow Autonomy Observer

A background observer that reads **full transcripts** — the main agent's and
every orchestration subagent's — and logs concrete, actionable changes that
would let the AgentBoard workspace-board pipeline run with fewer human stops.

It is **not** a general-purpose assistant and **not** a code-changing agent.
Its only product is a per-session set of workflow-improvement observations for
the maintainer (Max) to review and act on.

## Why it exists

The end-state for AgentBoard's workspace-board side is a mostly-autonomous
system: drop a spec on a card (or build one via `/foundation`), run the pipeline
(`/architecture` → `/orchestrate`), and have it carry the work through
planning → review → implementation → audit, stopping only for a **small set of
legitimate reasons**. Every session that falls short leaves evidence in the
transcripts — an avoidable checkpoint, a rework loop, a state-machine error, a
silently degraded subagent. The observer turns that evidence into a backlog of
specific, targeted refinements.

This is deliberately **narrower** than a general "suggestions from the
transcript" observer. It cares about one thing: **what stopped this session from
running autonomously, and what concrete change would prevent that stop next
time.**

## The lens

Every observation answers one question:

> Where did this run stop, loop, retry, or require a human — and for each, was it
> a **legitimate** stop (genuine ambiguity only Max can resolve, or a real
> external failure) or an **avoidable** one the pipeline should have handled
> itself? If avoidable, what specific change to a named skill / agent / hook /
> command / spec would have prevented it?

## What it hunts for (signal taxonomy)

Grounded in the pipeline's actual failure modes (see `skills/agentboard/SKILL.md`
and `skills/workspace-orchestration/SKILL.md`):

| Signal | What it looks like | Usually points at |
|---|---|---|
| **Avoidable human stop** | A blocking checkpoint, clarifying question, or approval the spec or an agent could have resolved itself | A board's `auto_transitions`, a spec template gap, an agent profile that punts decisions |
| **Rework loop** | `## Verdict: FAIL` → back to planning; audit FAIL; build/lint failure; retry-cap exhaustion | `plan-compose-agent` / `review-agent` / `implementation-agent` prompts |
| **State-machine friction** | HTTP 422/409 — illegal transition, missing `## Verdict:` marker, missing `acceptance_criteria`/notes, stale-read conflict | The agent profile or SKILL section that should have taught the contract |
| **Companion-MCP cold-start degradation** | `rag` `status: "indexing"`, codegraph "no graph"/unscanned, or output with no `file:line` citations (the §6.0 silent-skip signature) | The main-agent pre-warm step in the SKILLs |
| **Hook-gate rejection** | `artifact-quality-gate` / `validate-architecture-artifact` bounces (placeholder text, bad/absent sentinel, schema or verdict failure) | The *producing* agent's prompt/output contract |
| **Tool / permission friction & inefficiency** | Repeated permission prompts, "tool not loaded", `ToolSearch` misses, wasted tool calls, wrong turns | `.claude/settings.local.json` allowlist, SKILL tool-loading guidance, agent prompts |

## Output contract

Each observation is a tight, actionable entry. "Actionable" is enforced by
shape — vague entries ("improve error handling") are not allowed:

```markdown
## <ISO-8601 timestamp> — <one-line summary>
- Evidence: <what happened, with the tool call / error code / verdict that proves it>
- Target: <the exact artifact to change — e.g. agents/review-agent.md,
  skills/workspace-orchestration/SKILL.md §4, hooks/scripts/<file>.sh,
  commands/orchestrate.md, or a spec template>
- Change: <the specific edit that would have prevented this stop>
- Autonomy impact: <how this moves the pipeline toward running without this stop>
```

Legitimate stops are tagged `LEGITIMATE STOP` with a one-line reason, so Max can
confirm where the "stop for a human" boundary should sit.

## How it's wired

**Two `agent` hooks, each reading the ENTIRE transcript it is handed** — no
keyword filter, no staging, no intermediate script:

```jsonc
"SubagentStop": [
  { "matcher": "planning|plan-compose|review-agent|implementation-agent|audit|architecture",
    "hooks": [ { "type": "agent", "prompt": "<read the full subagent transcript…>", "timeout": 180 } ] }
],
"Stop": [
  { "matcher": "",
    "hooks": [ { "type": "agent", "prompt": "<read the full main transcript…>", "timeout": 180 } ] }
]
```

- **`Stop` → reads the FULL main transcript.** Fires when the main agent finishes
  a turn; reads the entire `transcript_path` JSONL start to finish (explicitly
  *not* just the tail) and logs.
- **`SubagentStop` → reads the FULL subagent transcript.** Fires when an
  orchestration worker finishes; reads that worker's own `agent_transcript_path`
  in full and logs. This is the only way to see a worker's internals — the main
  transcript holds only its final summary (confirmed in the sub-agents docs).
- **`matcher` on `SubagentStop`** scopes the hook to the pipeline worker agent
  names. That targets the right workers **and** is the recursion guard: the
  observer's own analysis agent has a different `agent_type`, so it does not
  match and cannot re-trigger the hook. A `stop_hook_active` check in the prompt
  is a backstop.
- **`type: "agent"`** because reading and analyzing a full transcript needs an
  LLM with file access; the `prompt` hook variant has no filesystem access.
- **Non-blocking** — both hooks **always return `{"ok": true}`** (the documented
  "allow" decision). They never return `{"ok": false}` (which would force the
  agent to keep working). They only read and log.

## Where the observations live

A per-session **directory**:

```
$HOME/.agentboard/observations/<session_id>/
  main.md                          # written by the Stop hook (main agent)
  <agent_type>-<agent_id>.md       # one per worker, written by SubagentStop
```

One file per source on purpose: parallel workers finishing at once each write
their **own** file, so concurrent appends can't corrupt each other. The whole
folder is one session's record. It stays off any target project's tree and out
of this repo — machine-local dev telemetry, not committed artifacts.

## Tuning

Behavior lives in the two `prompt` strings in `hooks/hooks.json`:

- **Scope** — the `SubagentStop` `matcher` decides which workers are observed.
- **Cost** — both hooks read full transcripts, so cost scales with transcript
  size and worker count. Raise/lower `timeout`, or set a stronger `model` field
  for deeper analysis (default is a fast model).
- **Log location** — change the `$HOME/.agentboard/observations/...` paths.

## Confirmed mechanics

Verified verbatim against the Claude Code hooks
[reference](https://code.claude.com/docs/en/hooks),
[guide](https://code.claude.com/docs/en/hooks-guide), and
[Agent SDK hooks reference](https://code.claude.com/docs/en/agent-sdk/hooks)
(2026-06-01):

- **Agent hooks read files.** An `agent` hook "spawns a subagent that can read
  files, search code, and use other tools," up to 50 tool-use turns — so it can
  `Read` an entire transcript.
- **`SubagentStop` delivers the subagent's own transcript.** Its input carries
  `agent_transcript_path` plus `stop_hook_active` (SDK reference, verbatim
  `SubagentStop` example). The sub-agents docs confirm a worker "returns only the
  summary" to the main agent, so reading `agent_transcript_path` is the only way
  to see its internals.
- **`SubagentStop` matches on agent type.** Its `matcher` is tested against the
  subagent's type/name (hooks reference matcher table) — which is what scopes the
  hook to pipeline workers and excludes the observer's own analysis agent.
- **Output contract.** On `Stop`/`SubagentStop`, `{"ok": false}` makes the agent
  keep working; `{"ok": true}` lets it stop. The observer always returns
  `{"ok": true}`.

## Hook Design Record

**Goal, and why a hook.** Read each session's full transcripts and persist
concrete autonomy-friction observations. A hook (not `CLAUDE.md`, not a slash
command) is correct because it must fire automatically at lifecycle points.
Reasoning over a full transcript needs an LLM (rules out a pure `command` hook);
a Task subagent and `claude -p` were explicitly excluded by the owner.

**Events & handlers.** `Stop` (agent) reads the full main transcript;
`SubagentStop` (agent, matcher-scoped to pipeline workers) reads each full worker
transcript. Both are verified to support LLM hooks and to return the
`{"ok"/"reason"}` decision. `SessionEnd` is not used — it's restricted to
command/`mcp_tool` like `SessionStart`/`Setup`.

**Validation gate (all nine):**

1. **No-op firing** — clean turn/worker: read the transcript, find nothing, log
   nothing, return `{"ok": true}`.
2. **Blocking semantics** — both events block on `{"ok": false}`; the observer
   never returns it. `stop_hook_active` short-circuits to `{"ok": true}`.
3. **Decision schema** — agent hooks use the model-return `{"ok"/"reason"}` form;
   always `{"ok": true}`.
4. **Exit-code / stdout** — N/A: agent hooks return structured model JSON, not
   raw stdout/exit codes.
5. **Context budget** — none; the observer injects no context, only writes files.
6. **Latency / hot path** — agent hooks can't run `async`, so both block.
   `Stop` fires per main turn; `SubagentStop` once per worker. Full-transcript
   reads make cost scale with transcript size; `timeout: 180` bounds each. Narrow
   the `SubagentStop` matcher or raise the gate to cut cost.
7. **Failure mode** — on error/timeout the turn/worker proceeds (non-block
   default); worst case is a missed observation, never a blocked run.
8. **Resume / state** — logs keyed by `session_id` (+ `agent_id` per worker);
   each pass reads the existing file and skips already-logged findings, so
   `--resume` and repeated turns append without duplicating.
9. **Portability & security** — writes under `$HOME/.agentboard/observations/`.
   **Security surface:** an autonomous LLM with file access reads transcript
   content, which can include untrusted tool/web output — a prompt-injection
   vector. Mitigated by the tightly-scoped prompt and by running on the owner's
   own machine/transcripts. To harden, add `disallowedTools`.

**Recursion.** An `agent` hook on `SubagentStop` could in principle re-trigger
itself if its own analysis subagent fired `SubagentStop`. Prevented by the
`matcher` (the analysis agent's type doesn't match the pipeline-worker pattern)
and backstopped by the `stop_hook_active` gate. Concurrent worker writes can't
race because each worker logs to its own file.

**Interactions with existing hooks.** Independent of the plugin's
`SessionStart` / `PreToolUse` / `PostToolUse` hooks. Any user-level `Stop` hook
runs in parallel; the observer never blocks, so it can't conflict.

**Tested / not verified.**
- *Verified here:* `hooks.json` parses; both prompts instruct a full transcript
  read and return `{"ok": true}`; the `SubagentStop` matcher is scoped to
  pipeline workers.
- *Not verified:* the live plumbing — that Claude Code fires these hooks, scopes
  the `SubagentStop` matcher on agent type as documented, and delivers
  `agent_transcript_path` under the CLI (the prompt falls back to
  `transcript_path`). Needs a real local session; this container can't run one.
  First local `/orchestrate` is the proof: a populated
  `~/.agentboard/observations/<session_id>/` is the signal it works.

**Known limitations.** Agent hooks are experimental; both hooks block (no async);
full-transcript reads cost scales with size and worker count; observation depth
limited by the default fast model unless `model` is raised; covers in-session
`Agent`-tool workers via `SubagentStop` (separate background sessions would each
be covered by their own `Stop` instead).
