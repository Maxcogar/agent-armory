# Workflow Autonomy Observer

A background observer that runs at the end of each turn, reads the session
transcript **and the friction captured from orchestration subagents**, and logs
concrete, actionable changes that would let the AgentBoard workspace-board
pipeline run with fewer human stops next time.

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

**Two** coordinated hooks in `hooks/hooks.json`, because orchestration friction
lives in two places — the main agent's turns *and* inside isolated subagents:

```jsonc
"SubagentStop": [
  { "matcher": "", "hooks": [
    { "type": "command",
      "command": "bash ${CLAUDE_PLUGIN_ROOT}/hooks/scripts/subagent-friction-capture.sh",
      "timeout": 10000 } ] }
],
"Stop": [
  { "matcher": "", "hooks": [
    { "type": "agent", "prompt": "<the observer prompt>", "timeout": 120 } ] }
]
```

- **`SubagentStop` → `subagent-friction-capture.sh` (command hook).** Each
  orchestration subagent (planning/review/implementation/audit) runs in an
  isolated context, and the main transcript receives only its *final summary* —
  not its internal 422s, `Verdict: FAIL`s, or RAG cold-starts. This hook fires
  when a subagent finishes, reads the subagent's **own** transcript (delivered
  as `agent_transcript_path`), greps it for friction signatures, and appends a
  record to a per-session staging file. It is a **command** hook on purpose:
  command hooks can't spawn subagents, so it cannot trigger the recursive-hook
  loop that an `agent` hook on `SubagentStop` would risk. Pure deterministic
  capture — no LLM, no blocking. (Allowlisted to pipeline agent types, so it
  ignores `Explore`/`general-purpose` and the observer's own analysis agent.)
- **`Stop` → the `agent` observer (LLM hook).** Fires when the main agent
  finishes a turn. Reads **both** the main transcript and the subagent staging
  file, reasons over the combined friction, and writes the actionable log.
  `type: "agent"` because it needs file read+write (the `prompt` variant has no
  filesystem access). Step 1 is a cheap gate that returns `{"ok": true}` with no
  tool use on quiet turns.
- **Non-blocking** — the observer **always returns `{"ok": true}`** (the
  documented "allow" decision on `Stop`). It never returns `{"ok": false}`,
  which would force Claude to keep working. It must never hold or alter the
  running session.

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
- **Subagent friction is reachable.** `SubagentStop` fires when each subagent
  finishes, and its input carries `agent_transcript_path` (the subagent's own
  transcript) plus `stop_hook_active` — verified verbatim in the Agent SDK hooks
  reference's `SubagentStop` example. The sub-agents docs confirm a subagent
  "does that work in its own context and **returns only the summary**," so the
  main transcript alone misses in-wave friction; reading `agent_transcript_path`
  is how we recover it. Capture runs as a `command` hook to stay immune to the
  documented recursive-hook-loop risk for hooks that spawn subagents.
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

## Hook Design Record

*Every behavioral claim below traces to the live Claude Code hooks
[reference](https://code.claude.com/docs/en/hooks) and
[guide](https://code.claude.com/docs/en/hooks-guide), read verbatim and
verified 2026-06-01 — not to memory.*

**Goal, and why a hook.** Observe each agentboard session and persist concrete
autonomy-friction observations for later action. A hook (not `CLAUDE.md`, not a
slash command) is correct because the behavior must fire automatically at a
lifecycle point without the model choosing to. Reasoning over the transcript
needs an LLM, which rules out a pure `command` hook; a Task subagent and
`claude -p` were both explicitly excluded by the owner.

**Event: `Stop` — why.** `Stop` fires "when Claude finishes responding"
(cadence: once per turn) and is verified to run `agent` hooks (the guide's
canonical agent-hook example is a `Stop` hook). `SessionEnd` would be a nicer
cadence (once per session; its decision control is literally "side effects like
logging or cleanup") — **but** `SessionStart` and `Setup`, the sibling
once-per-session lifecycle events, both verbatim restrict to
`command`/`mcp_tool` only, and `SessionEnd`'s own handler-type line could not be
confirmed (its doc section truncated on every fetch). Putting an `agent` hook on
`SessionEnd` therefore risks a hook that silently never fires, so `Stop`
(verified) is used. If `SessionEnd` is later confirmed to accept `agent` hooks,
moving there removes the per-turn cost in gate item 6.

**Second event: `SubagentStop` (capture) — why.** Orchestration subagents are
isolated; the main transcript gets only their summary, so a `Stop`-only observer
is blind to in-wave friction (the original design flaw). `SubagentStop` fires per
subagent and its input carries `agent_transcript_path` — the subagent's own
transcript — so a hook there can read the actual 422s/FAILs/cold-starts. It runs
as a **`command`** hook, not `agent`: command hooks can't spawn subagents, so
they're structurally immune to the recursive-hook-loop the SDK docs warn about
(and far cheaper than an LLM call per subagent). Capture is deterministic (grep);
the `Stop` observer does the reasoning over the staged result.

**Handler: `agent` — why.** It must read `transcript_path` (a path, not
contents) and write a log. `prompt` hooks are single-turn with no tools; `agent`
hooks "spawn a subagent that can read files, search code, and use other tools,"
up to 50 tool-use turns. Anthropic flags agent hooks experimental — acceptable
for non-blocking telemetry.

**Validation gate (all nine):**

1. **No-op firing** — most turns have no pipeline friction; Step 1 returns
   `{"ok": true}` with zero tool use, logs nothing, session stops normally.
2. **Blocking semantics** — `Stop` blocks on `{"ok": false}` (reason fed back,
   Claude keeps working). The observer **never** returns `ok: false`.
   `stop_hook_active` is checked in Step 1 and short-circuits to `ok: true`; the
   8-consecutive-block override (`CLAUDE_CODE_STOP_HOOK_BLOCK_CAP`) is a backstop
   if the model ever errs.
3. **Decision schema** — `agent` hooks use the model-return `{"ok"/"reason"}`
   format (not top-level `decision`, which is the command/HTTP form). Always
   returns `{"ok": true}`.
4. **Exit-code / stdout discipline** — N/A: `agent` hooks return structured
   model JSON managed by Claude Code, not raw stdout or exit codes.
5. **Context budget** — none. The observer injects no context
   (`additionalContext` unused); it only writes a file. Zero context cost to the
   session.
6. **Latency / hot path** — `Stop` is per-turn and `agent` hooks cannot run
   `async` (async is command-only), so it blocks. Mitigation: the Step 1 gate
   returns in one fast-model turn on no-op turns; `timeout: 120` bounds the deep
   path. The per-subagent `SubagentStop` capture is a `command` hook (grep, no
   LLM), so even with many subagents per wave it stays cheap and non-blocking —
   it does not pay an LLM call per subagent.
7. **Failure mode** — on error or timeout the turn proceeds (Stop's non-block
   default); worst case is a missed observation, never a blocked session.
8. **Resume / state** — log keyed by `session_id`; Step 3 reads the existing
   file and skips already-logged signals, so `--resume` appends without
   duplicating.
9. **Portability & security** — writes under `$HOME/.agentboard/observations/`
   (durable on local runs; ephemeral in remote containers). **Security surface:**
   the observer is an autonomous LLM with Write/Bash access that reads transcript
   content, which can include untrusted tool/web output — a prompt-injection
   vector. Mitigated by the tightly-scoped prompt ("your sole job… never modify
   code") and by running on the owner's own machine and transcripts. To harden,
   add `disallowedTools` to drop Bash and confine it to `Write`.

**Interactions with existing hooks.** Independent of the plugin's
`SessionStart` / `PreToolUse` / `PostToolUse` hooks (different events). The new
`SubagentStop` command hook and the `Stop` agent hook are coupled by one shared
file (the per-session staging path) and ordered by lifecycle — captures land as
subagents finish; the `Stop` observer consumes them at the next main-turn
boundary. Any user-level `Stop` hook runs in parallel; because the observer
never blocks, it cannot conflict with another `Stop` hook's decision.

**Tested / not verified.**
- *Verified here:* `hooks.json` parses; the `Stop` prompt returns `{"ok": true}`
  on both paths. `subagent-friction-capture.sh` was run against synthetic inputs
  (`bash -n` clean) — it stages a correct record when a pipeline subagent's
  transcript contains friction, stages nothing for a clean subagent, skips
  non-pipeline agent types (`Explore`), and honors the `stop_hook_active` loop
  guard.
- *Not verified:* the live hook plumbing — that Claude Code fires these hooks and
  that the CLI delivers `agent_transcript_path` on `SubagentStop` exactly as the
  Agent SDK reference documents (the script falls back to `transcript_path` if
  the field name differs). Hook execution needs a real local Claude Code session
  with the plugin installed, which this environment cannot run. First local
  `/orchestrate` is the proof; the staging file `.staging-<session_id>.jsonl`
  appearing with records is the signal it works.

**Known limitations.** Agent hooks are experimental; per-turn blocking cost on
`Stop` (bounded by the gate); observation depth is limited by the default fast
model unless `model` is raised; the friction signature list in the capture
script is a fixed denylist of known failure strings (tune it as new failure
modes appear); the cleaner once-per-session `SessionEnd` cadence is unavailable
pending verification of its handler support.
