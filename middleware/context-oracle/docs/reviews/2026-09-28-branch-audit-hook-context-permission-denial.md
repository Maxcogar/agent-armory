# Hook context on a permission denial — corrects my reading of the earlier test

`2026-09-28-branch-audit-hook-context-on-denied-edit.md` case C used a path deny
rule on `Edit`. The coordinator then told Max Cogar that the documentation and
the test disagree. **That was wrong.** Case C never reached a permission denial
in the documentation's sense.

## The documentation

https://code.claude.com/docs/en/hooks.md, fetched 2026-09-28:
- "Validation rejections are returned as `tool_use_error` results and happen
  before hooks run, so they fire neither `PreToolUse` nor `PostToolUseFailure`."
- "Permission denials fire `PreToolUse` but not this event".

https://code.claude.com/docs/en/permissions.md:
- "PreToolUse hooks run before the permission prompt".
- "a matching deny rule blocks the call".

## What the tests show

The Edit path rule came back as a `tool_use_error` ("File is in a directory
that is denied by your permission settings."). That is the shape the hooks page
gives for validation rejections, which run before hooks.

A Bash permission rule comes back as an ordinary denied result, and the hook
runs first.

All runs used Claude Code 2.1.283, `claude -p`, in a throwaway `/tmp`
directory. The hook appends to a marker file, so whether it ran does not depend
on the model's answer.

| Case | Runs | Hook ran | Tool result | Model received the text |
|---|---|---|---|---|
| Bash allowed (control) | 2 | yes, both | success | in transcript, both |
| Bash, deny rule `Bash(touch:*)` | 4 | yes, all | "Permission to use Bash with command touch g.txt has been denied.", `is_error: true` | yes: both quote-back runs quoted it |
| Edit, deny rule `Edit(./f.txt)` | 3 | no, none | `tool_use_error` "File is in a directory that is denied…" | no |
| Another hook returns `deny` (earlier file, case B) | 1 | yes | "PreToolUse:Edit hook error: blocked by test hook" | yes, quoted |

## What this settles

- **The documentation holds.** A permission-rule denial fires `PreToolUse`,
  and the hook's `additionalContext` reaches the model next to the denial.
- **Edit path deny rules** are enforced before hooks, with the validation
  result shape. The oracle never sees those calls.
  - This is inferred from the result shape plus the marker file.
  - The documentation does not name which stage enforces `Edit(path)` deny
    rules.
- **Why the tests can be trusted:**
  - Each case has a control run where the hook fires and the text arrives, so
    the setup works.
  - Whether the hook ran comes from the marker file, not the model.
  - Delivery was checked both in the raw stream and by the model quoting it.
  - Every case repeated with identical results.
- **Limits:**
  - one Claude Code version;
  - headless `-p` mode only;
  - only the Bash and Edit tools;
  - one path-rule form.
- **FR-O2's sentence "a permission denial also fires `PreToolUse`" stands.**
  It gains one clause: "`Edit`/`Read` path deny rules are rejected before
  hooks run, so the oracle is not invoked (Claude Code 2.1.283, tested)".
  - The FR-O2 wording proposed to Max Cogar on 2026-09-28 is corrected to
    this.
