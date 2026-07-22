# Handing off to independent review

Use this for every review. It exists to enforce one thing: **the review that decides whether the work is done is independent of the agent that did the work.**

You never grade your own work. The review is performed by a **separate general-purpose subagent** given **only mechanical facts**. This is the single deliberate use of a subagent in the expert-implement flow — and the reason is independence, not delegation. Anything you add beyond the mechanical facts contaminates the reviewer's judgment and defeats the point of having it.

## What to dispatch

- **Subagent:** general-purpose.
- **Inputs — mechanical only:** the diff (or the list of files changed) and the plan path. Nothing else.
- **Instruction:** run the independent review (e.g. `/expert-review`, or this project's independent review tool) against the plan. Nothing more.

## The dispatch must be neutral

No leading, opinionated, or suggestive language. In particular, never include:

- "check my fixes" / "verify my work" / "see if I got this right"
- "I think this is solid" / "this should pass" / any self-assessment of the work
- "pay attention to X" / "the tricky part is Y" / pointing the reviewer at specific areas
- any framing that tells the reviewer what you concluded or where to look

Every review is dispatched the **same** neutral way — same template, every time — so no review is softened, steered, or pre-judged.

## Template (mechanical-only)

```
Run an independent review of the changes below against the plan at {PLAN_PATH}.
Use /expert-review (or this project's independent review tool).

Plan: {PLAN_PATH}
Files changed:
{file list}

Diff:
{unified diff, or: "see files changed above; run the diff yourself against {base ref}"}

Review the changes against the plan and its named standards. Report the verdict.
```

That is the entire dispatch. No preamble, no framing, no opinion.

## Good vs bad

**Good** — facts and the instruction, nothing more:

```
Run an independent review of the changes below against the plan at docs/plans/plan-7.md.
Use /expert-review.

Plan: docs/plans/plan-7.md
Files changed:
  src/auth/session.ts
  src/auth/middleware.ts
  migrations/0042_add_session_index.sql

Diff:
  <unified diff>

Review the changes against the plan and its named standards. Report the verdict.
```

**Bad** — tells the reviewer what you think and where to look, which biases the verdict:

```
I implemented steps 1–5 and I'm pretty confident the auth change is correct,
but can you double-check the migration? Here's the diff…
```

The bad version steers the review toward "confirm the author's confidence" and toward one file, away from everything else. Use the template instead.

## After the review returns

- **PASS** → you may record the work complete in the project's status doc, *if it has one*, honestly. Until a PASS, the honest state is "code-complete, pending independent review."
- **Findings** (NEEDS FIXES, or any non-PASS verdict) → **do not apply the fixes informally.** Route the findings to a planning step (e.g. `/expert-plan`) to produce a remediation plan, then re-run the expert-implement skill against that plan.

Fixes go through a plan, like all other work. That is what keeps the implementer faithful — executing an approved plan — instead of drifting into improvised, ungoverned changes in response to a review.
