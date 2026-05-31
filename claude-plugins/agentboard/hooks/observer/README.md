# Workflow Autonomy Observer

A background observer that runs at the end of each turn, reads the session
transcript, and logs concrete, actionable changes that would let the
AgentBoard workspace-board pipeline run with fewer human stops next time.

It is **not** a general-purpose assistant and **not** a code-changing agent.
Its only product is a per-session log of workflow-improvement observations for
the maintainer (Max) to review and act on.

## Why it exists

The end-state for AgentBoard's workspace-board side is a mostly-autonomous
system: drop a spec on a card (or build one via `/foundation`), run the
pipeline (`/architecture` → `/orchestrate`), and have it carry the work
through planning → review → implementation → audit, stopping only for a
**small set of legitimate reasons**. Every session that falls short of that
leaves evidence in its transcript — an avoidable human checkpoint, a rework
loop, a state-machine error, a silently degraded subagent. The observer turns
that evidence into a backlog of specific, targeted refinements.

This is deliberately **narrower** than a general "suggestions from the
transcript" observer. It only cares about one thing: **what stopped this
session from running autonomously, and what concrete change would prevent that
stop next time.**

## The lens

Every observation answers one question:

> Where did this session stop, loop, retry, or require a human — and for each,
> was that a **legitimate** stop (genuine ambiguity only Max can resolve, or a
> real external failure) or an **avoidable** stop the pipeline should have
> handled itself? If avoidable, what specific change to a named
> skill / agent / hook / command / spec would have prevented it?

## What it hunts for (signal taxonomy)

Grounded in the pipeline's actual failure modes (see
`skills/agentboard/SKILL.md` and `skills/workspace-orchestration/SKILL.md`):

| Signal | What it looks like in the transcript | Usually points at |
|---|---|---|
| **Avoidable human stop** | A blocking checkpoint, clarifying question, or approval the spec or an agent could have resolved itself | A board's `auto_transitions`, a spec template gap, an agent profile that punts decisions |
| **Rework loop** | `## Verdict: FAIL` → back to planning; audit FAIL; build/lint failure halting before audit; retry-cap exhaustion | `plan-compose-agent` / `review-agent` / `implementation-agent` prompts |
| **State-machine friction** | HTTP 422/409 — illegal transition, missing `## Verdict:` marker, missing `acceptance_criteria`/notes, stale-read conflict | The agent profile or SKILL section that should have taught the contract |
| **Companion-MCP cold-start degradation** | `rag` `status: "indexing"`, codegraph "no graph"/unscanned, or a `plan`/`implementation_note` with no `file:line` citations (the §6.0 silent-skip signature) | The main-agent pre-warm step in `workspace-orchestration` / `agentboard` SKILLs |
| **Hook-gate rejection** | `artifact-quality-gate` or `validate-architecture-artifact` bounces (TODO/placeholder text, bad/absent sentinel, schema or verdict failure) | The *producing* agent's prompt/output contract |
| **Tool / permission friction** | Repeated permission prompts, "tool not loaded", `ToolSearch` misses | `.claude/settings.local.json` allowlist, SKILL tool-loading guidance |

## Output contract

Each observation is appended to the session log as a tight, actionable entry.
"Actionable" is enforced by shape — vague entries ("improve error handling")
are not allowed:

```markdown
## <ISO-8601 timestamp> — <one-line signal summary>
- Evidence: <what happened, with the tool call / error code / verdict that proves it>
- Target: <the exact artifact to change — e.g. agents/review-agent.md,
  skills/workspace-orchestration/SKILL.md §4, hooks/scripts/<file>.sh,
  commands/orchestrate.md, or a spec template>
- Change: <the specific edit that would have prevented this stop>
- Autonomy impact: <how this moves the pipeline toward running without this stop>
```

Legitimate stops are either skipped or logged tagged `LEGITIMATE STOP` with a
one-line reason, so Max can confirm where the "stop for a human" boundary
should sit.

## Where the log lives

`$HOME/.agentboard/observations/<YYYY-MM-DD>-<session_id>.md`

One file per session, appended to as the session progresses. This keeps
observations off any target project's tree and out of this repo — they are
machine-local development telemetry, not committed artifacts. Review them, act
on the worthwhile ones, then archive or delete.

## How it's wired

A single entry in `hooks/hooks.json`:

```jsonc
"Stop": [
  {
    "matcher": "",
    "hooks": [
      { "type": "agent", "prompt": "<the observer prompt>", "timeout": 120 }
    ]
  }
]
```

- **`type: "agent"`** — the LLM-backed hook variant that spawns a subagent
  with multi-turn tool access (read files, run commands, use other tools), up
  to 50 tool-use turns, so it can `Read` the transcript at `transcript_path`
  and write the log. The pure `prompt` variant is a single LLM call with no
  filesystem access, so it can't persist anything.
- **`Stop`** — fires when Claude finishes a turn. The prompt's first step is a
  cheap triage that returns `{"ok": true}` with no tool use on turns with no
  pipeline activity, so most interactive turns cost ~one fast-model call.
- **Non-blocking** — the hook **always returns `{"ok": true}`** (the
  documented "allow" decision on `Stop`). It never returns `{"ok": false}`,
  which would force Claude to keep working. The observer must never hold or
  alter the running session.

## Tuning

The behavior lives entirely in the `prompt` string in `hooks/hooks.json` —
adjust it there. Common knobs:

- **Triage breadth** — Step 1's gate decides which turns are worth a deep read.
  Tighten it to cut cost; loosen it to catch more.
- **Log location** — change the `$HOME/.agentboard/observations/...` path in
  Step 3.
- **Model** — add a `"model"` field to the hook to run the analysis on a
  stronger model (default is a fast model). Deeper observations, higher cost.
- **Cadence** — `Stop` is per-turn and is the only event that runs LLM-backed
  hooks (see Confirmed mechanics below), so the Step 1 triage gate is the cost
  control. Tighten the gate to act on fewer turns; there is no documented
  once-per-session LLM-hook event to move to.

## Confirmed mechanics (and the one real caveat)

These were verified against the Claude Code hooks docs
([reference](https://code.claude.com/docs/en/hooks),
[guide](https://code.claude.com/docs/en/hooks-guide)):

- **Agent hooks have write access.** An `agent` hook spawns a subagent that
  "can read files, search code, and use other tools," up to **50 tool-use
  turns** (60s default timeout; raised to 120s here). Write/Edit/Bash are
  available by default — read-only variants are made by *adding*
  `disallowedTools: [Edit, Write]`. So reading the transcript and writing the
  log is fully supported.
- **`Stop` is the right event.** Both canonical LLM-hook examples in the guide
  (prompt and agent) are `Stop` hooks. `SessionStart`/`Setup` are
  command/`mcp_tool`-only, and no LLM-hook example targets `SessionEnd`, so
  `SessionEnd` is not a viable home for this. `Stop` fires per-turn, which is
  why the cheap triage in Step 1 matters.
- **Output contract.** On `Stop`, returning `{"ok": false, "reason": ...}`
  makes Claude *keep working* (the reason becomes its next instruction).
  Returning `{"ok": true}` lets it stop. This observer **always returns
  `{"ok": true}`** so it can never wedge or extend a session.
- **Loop cap (not triggered here).** Claude Code overrides a `Stop` hook after
  8 consecutive blocks; since this hook never blocks, the cap is irrelevant.

**The one real caveat:** agent hooks are flagged **experimental** in the docs
("Behavior and configuration may change... For production workflows, prefer
command hooks"). That's an acceptable trade for an observer — it's best-effort
telemetry that never blocks, so if it misbehaves the worst case is a missed
observation, not a broken pipeline. The first live run is still the proof that
it fires, triages, and writes as intended; tune the Step 1 gate from what that
first session's log shows.
