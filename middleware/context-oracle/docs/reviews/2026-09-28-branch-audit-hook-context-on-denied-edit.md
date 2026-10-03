# Does a `PreToolUse` warning reach the agent when the edit is denied?

This answers the item left "not established" in
`2026-09-28-branch-audit-coordinator-rulings-schema-and-edit-timing.md` §2.

## The documentation

Source: https://code.claude.com/docs/en/hooks.md, fetched 2026-09-28.
- `PreToolUse` `additionalContext` is a "String added to Claude's context
  alongside the tool result. Ignored when `permissionDecision` is `"defer"`".
  `defer` is the only case listed as dropped.
- The context goes "next to the tool result".
- "When multiple PreToolUse hooks return different decisions, precedence is
  `deny` > `defer` > `ask` > `allow`."
- "Validation rejections are returned as `tool_use_error` results and happen
  before hooks run, so they fire neither `PreToolUse` nor `PostToolUseFailure`."

## The test

**Setup.**
- Claude Code 2.1.283, in a throwaway `/tmp/hooktest.*` directory, not an
  owner project.
- `claude -p --permission-mode acceptEdits --output-format stream-json`.
- The session variables were unset, so the child was not attached to this
  session.
- The prompt: change `hi` to `bye` in `f.txt` once, then quote any text
  containing `ORACLE-WORD`.
- Hook 1 returns only
  `{"hookSpecificOutput":{"hookEventName":"PreToolUse","additionalContext":"ORACLE-WORD-ZEBRA42"}}`.

**Results.**

| Case | Edit | Tool result | Warning in transcript | Model quoted it |
|---|---|---|---|---|
| A: hook 1 only | ran (`bye`) | success | yes (3 occurrences) | `ORACLE-WORD-ZEBRA42` |
| B: hook 1, plus hook 2 returning `permissionDecision: "deny"` | blocked (`hi`) | `PreToolUse:Edit hook error: blocked by test hook`, `is_error: true` | yes (3) | `ORACLE-WORD-ZEBRA42` |
| C: hook 1, plus a permission rule `deny: ["Edit(./f.txt)"]` | blocked (`hi`) | `<tool_use_error>File is in a directory that is denied by your permission settings.</tool_use_error>` | no (0) | `NONE` |

In case C the hook wrote no line to its `fired.log` marker, so the hook never ran.

## What this settles

- **When another hook denies the edit,** the warning still reaches the agent,
  next to the denial.
- **When a path permission rule denies the edit,** Claude Code rejects the call
  before any hook runs. The oracle is not invoked and has nothing to deliver.
  - Nothing is lost: the edit did not happen, so there is no blast radius to
    warn about.
  - The oracle cannot observe this attempt at all.
- **For the spec:**
  - FR-O2's clause "that text is preserved even if the tool call later fails"
    is replaced by these two observed cases, citing this file and the
    documentation lines above.
  - The rest of the wording correction in the rulings file §2 stands.

This is one version of Claude Code (2.1.283). The hooks contract has drifted
before, so the spec cites the version.
