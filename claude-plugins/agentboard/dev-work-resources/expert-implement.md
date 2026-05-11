\---

name: expert-implement

description: Dispatch the expert-implementer subagent to implement an approved plan. The agent invokes the expert-standard skill before reading any code, follows the plan exactly, and surfaces divergences via STOP REPORT instead of silently pattern-matching.

\---



\# Expert Implement — Dispatch a Plan Executor



Spawn the `expert-implementer` subagent to execute an approved implementation plan end-to-end. The subagent works against the plan as written; it does not redesign, re-scope, or improvise. Architectural decisions belong to the planner — this command job is faithful, verifiable execution under the Expert Standard.



The execution contract (Expert Standard activation, verification taxonomy, four STOP categories, STOP REPORT and final-report formats) is owned by the agent profile at \[.claude/agents/expert-implementer.md](.claude/agents/expert-implementer.md). This command file owns only the orchestrator-side workflow — pre-dispatch checks, dispatch payload, and post-return handling.



\## Inputs



The user provides one of:

\- A path to an approved plan file (e.g. `docs/planning/plans/plan-phase-8-remediation.md`).

\- A plan file plus a step range or checkpoint to execute (e.g. "steps 1–5 of plan-X.md").



$ARGUMENTS



If no plan path is provided, \*\*stop and ask\*\* for one. Do not synthesize a plan inline. This command executes plans; it does not write them. If the user wants a plan, route them to `/expert-plan`.



If the plan path is provided but the file does not exist or is empty, stop and report which path was checked. Do not guess at alternate locations.



\## Pre-dispatch checks (orchestrator does these — not the subagent)



Before invoking the Agent tool, the orchestrator must:



1\. \*\*Read the plan file in full.\*\* Confirm it has the required sections from `/expert-plan` — Goal, Scope, Standards that govern this plan, Files affected, Plan, Decisions, Risks, Gaps, Post-completion. A plan missing the Standards or Source annotations was not produced under `/expert-plan` and should not be executed without confirmation from the user.

2\. \*\*Read `HANDOFF.md` and `CLAUDE.md`.\*\* Confirm the plan current phase matches what `HANDOFF.md` says is next, and that no Hard Rule contradicts the plan. If a contradiction exists, stop and surface it — do not dispatch.

3\. \*\*Confirm review-gate posture.\*\* Per `CLAUDE.md` "Build process rule", the plan exit criteria require an independent `/expert-review` PASS before the phase can be marked Complete. The implementing subagent does not grade its own work. State this back to the user before dispatch so the boundary is explicit.

4\. \*\*Identify verification commands.\*\* From the plan per-step Verification entries, extract the concrete commands the subagent will need (`pytest`, `npm run build`, `alembic upgrade head`, `npm run generate:types`, etc.). The subagent runs them; the orchestrator does not need to run them, but it must surface them in the dispatch prompt so the subagent knows what "done" looks like for each step.

5\. \*\*Confirm the agent profile exists.\*\* Verify \[.claude/agents/expert-implementer.md](.claude/agents/expert-implementer.md) is present and non-empty before dispatch. If it is missing, stop and report — do not fall back to `general-purpose`. The contract is the agent profile; without it the dispatch is incoherent.



If any of the above fails, do not dispatch. Report the gap to the user and wait.



\## Dispatch



Use the `Agent` tool with `subagent\_type: "expert-implementer"`. The agent profile loads the full execution contract automatically; the orchestrator does not paste it into the prompt.



The agent runs in the foreground — its result is required before the orchestrator can report the work as done. Do not run this in the background.



\### Dispatch payload



The dispatch prompt is short. It carries:



1\. \*\*Plan path\*\* — `{PLAN\_PATH}` (absolute or repo-relative).

2\. \*\*Scope\*\* — either the literal string `all` or a comma-separated list of step numbers / checkpoints from the plan.

3\. \*\*Verification commands surfaced from the plan\*\* (preferred) — the concrete commands extracted in pre-dispatch check #4. The agent will re-derive these from the plan, but surfacing them upfront catches plan/environment drift before dispatch.

4\. \*\*RESUME BLOCK\*\* (only when resuming after a prior STOP REPORT) — verbatim, per the format in the "Handling a STOP REPORT" section below.



Example dispatch prompt:



```

Plan: docs/planning/plans/plan-phase-8-remediation.md

Scope: all

Verification commands the plan names:

&#x20; - pytest backend/tests/test\_phase\_8.py

&#x20; - npm run build (frontend)

&#x20; - alembic upgrade head

```



That is the entire prompt. Everything else — Step 0 activation, preflight, in-order execution, stop categories, final-report format — is loaded from the agent profile.



\---



\## After the subagent returns



The orchestrator (you, in the parent session) does NOT mark anything Complete based on the subagent report. Per `CLAUDE.md` "Build process rule":



\- A subagent `READY FOR /expert-review` flag is a starting point, not a verdict.

\- The next step is `/expert-review` — an independent review pass that grades the work against the plan and its named standards. The implementer does not grade its own work.

\- Only after `/expert-review` returns a PASS verdict does `HANDOFF.md` get updated to `Complete — expert review PASS YYYY-MM-DD`. Until then the honest state is `Code-complete — pending expert review`.



\### Handling a STOP REPORT



If the subagent halted with a STOP REPORT, do not paraphrase it and do not pick the option on the user behalf. The subagent job was to halt with structured evidence; the orchestrator job is to verify that evidence and route the decision. The user job is to make the call.



1\. \*\*Verify the stop is legitimate.\*\* A STOP REPORT is a claim, not a verdict. Re-run the evidence yourself before forwarding it:

&#x20;  - `PREMISE-FALSE` — Read the file at the exact line cited; run the same Grep; resolve the same library via Context7 and confirm. If the subagent evidence does not reproduce, the stop is invalid — re-dispatch with the original plan unchanged and note the false stop.

&#x20;  - `HARD-RULE-CONFLICT` — Read the cited Hard Rule; trace the step against it. Confirm the conflict is real, not the subagent misreading the rule.

&#x20;  - `BLAST-RADIUS-EXCEEDS-PLAN` — Re-run `mcp\_\_codegraph\_\_codegraph\_get\_dependents` and `mcp\_\_codegraph\_\_codegraph\_get\_change\_impact` on the implicated files. Confirm the dependents the subagent cited are real and outside the plan `Files affected`.

&#x20;  - `ENVIRONMENT-BLOCKED` — Try the failing command in the parent session. If it works, the environment failure was local to the subagent and the dispatch is re-runnable as-is.

2\. \*\*Surface the verified report to the user verbatim.\*\* Do not summarize away the options. The user picks A (amend plan), B (override and continue), or C (abort).

3\. \*\*Route per the user decision:\*\*

&#x20;  - \*\*A. Amend plan\*\* -> invoke `/expert-plan` with the STOP REPORT as input. The amended plan replaces the original at the same path (or supersedes it via a remediation file). Once amended and approved, re-dispatch this command against the new plan path. Do not re-dispatch against the old plan with informal "but actually do X" instructions — that bypasses the planner gate.

&#x20;  - \*\*B. Override and continue\*\* -> emit a RESUME DISPATCH (format below) carrying the override as an explicit, scoped exception. Overrides are recorded; they do not generalize.

&#x20;  - \*\*C. Abort\*\* -> leave the working tree in the state the subagent left it; record the partial completion in `HANDOFF.md` honestly (`Code-complete on steps N–M; halted at step X — see STOP REPORT`); no review gate runs.



\### RESUME DISPATCH (orchestrator format for bringing the subagent back)



When the user picks B (override) or when the plan was amended (A) and execution continues from where it stopped, dispatch a fresh `expert-implementer` agent with the standard dispatch payload plus a verbatim RESUME BLOCK appended:



```

RESUME BLOCK

Original dispatch plan: {PLAN\_PATH}

Plan amendment (if any): <new plan path or "none — original plan unchanged">

Stop category that triggered this resume: <HARD-RULE-CONFLICT | PREMISE-FALSE | BLAST-RADIUS-EXCEEDS-PLAN | ENVIRONMENT-BLOCKED>

Verified state at stop:

&#x20; Steps completed: <list with verification evidence — copy from prior subagent final report>

&#x20; Files changed: <list mapped to Files affected>

&#x20; Working tree: <committed / uncommitted summary>

Decision: <A. Plan amended | B. Override>

If B (override):

&#x20; Override scope: <one sentence — what specifically is permitted that the original plan did not authorize>

&#x20; Override boundary: <what the override does NOT cover — the rest of the plan still binds>

&#x20; Override rationale: <user reasoning, recorded for the review gate>

Resume instructions:

&#x20; Skip preflight for steps already verified-complete in "Steps completed" above; mark them `completed` in TodoWrite at start.

&#x20; Re-run preflight for the remaining in-scope steps before resuming execution.

&#x20; If a second STOP REPORT triggers in this resumed run, do not auto-apply the prior override — emit a new STOP REPORT.

```



The override is scoped to this resume only. It does not become a general permission. If the same condition recurs in a later step, the subagent must STOP REPORT again — overrides do not generalize, because the slippery slope you wanted to prevent is "exceptions made in one place become assumed in others."



\### Other returns (no STOP REPORT)



\- `READY FOR /expert-review` with all preflight categories passed and verifications green -> invoke `/expert-review` against the same plan path. Do not edit `HANDOFF.md` until the review returns PASS.

\- `NOT READY` without a STOP REPORT -> this should not happen. If it does, the subagent violated the contract; treat its report as untrusted and re-dispatch against the same plan with a note that the prior subagent failed to follow the format.



\## What this command does NOT do



\- It does not write plans. That is `/expert-plan`.

\- It does not write specs. That is `/expert-spec`.

\- It does not produce architecture documents. That is `/architecture`.

\- It does not grade its own output. That is `/expert-review`, run independently.

\- It does not update `HANDOFF.md` to "Complete". The review gate does, after a PASS verdict.

\- It does not duplicate the execution contract. That lives in \[.claude/agents/expert-implementer.md](.claude/agents/expert-implementer.md). Edit the agent profile when the contract changes; this file does not need to be touched.

