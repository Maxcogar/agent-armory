# Agent integration

The MVP integration target is regular Claude Code, not a custom agent runtime.

## Regular Claude Code

`ctxpack init` writes native Claude Code hooks into `.claude/settings.json`:

- `SessionStart` injects standing rules.
- `UserPromptSubmit` indexes the repository, generates the task Context Package, writes `.context/task-context.{json,md}`, and passes the mandatory package block to Claude Code with `hookSpecificOutput.additionalContext`.
- `PreToolUse` blocks edit tools until the current transcript contains a `<CTXPACK_PLAN>...</CTXPACK_PLAN>` block that passes the assumption firewall.
- `PreToolUse` and `PermissionRequest` block `Task` / `Explore` delegation for direct investigation prompts so the main Claude Code conversation inspects source files directly.
- `SubagentStart` injects a fallback direct-investigation instruction if a subagent still starts before a blocker catches it.
- `PreToolUse` also blocks generated/vendor/build-output files from hand edits.
- `Stop` reports changed-file impact and likely verification commands.

This satisfies AIR1 because the package is injected into Claude Code's model context before the model continues with the coding prompt. `systemMessage` is only for user-visible warnings and notices; it is not the context channel. The Markdown file is only a review artifact.

## Plan gate

Claude Code must emit:

```text
<CTXPACK_PLAN>
one grounded implementation step per line
</CTXPACK_PLAN>
```

The `PreToolUse` hook reads Claude Code's `transcript_path`, extracts the latest ctxpack plan, runs `AssumptionFirewall.check`, and denies `Edit`, `Write`, `MultiEdit`, and `NotebookEdit` if:

- no package exists,
- the package is stale,
- no ctxpack plan exists in the transcript,
- the plan contains unsupported repository facts,
- the plan proposes a forbidden move.

For packages whose task profile requires direct investigation, the same hook denies subagent delegation tools (`Task` / `Explore`) with a direct-investigation instruction. `PermissionRequest` applies the same denial when Claude Code reaches the permission-dialog path. This is intentionally narrower than edit gating: read/search tools remain allowed after the package's initial leads have been read.

## Secondary SDK runner

`ctxpack run-agent` remains as a deterministic harness/demo path and can use the Claude Agent SDK when available. It is not the primary product integration for this MVP.

## Future adapters

Codex and Gemini remain future adapter work. They must provide equivalent active-context injection and edit/tool gating before they can claim AIR1 compliance.
