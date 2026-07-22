# Acceptance procedure — expert-dev-tools (spec A-1..A-9)

Two tiers, per the plan's test architecture (D-P1):

- **Automated tiers (no tokens, run now):** `node tests/unit/run-unit-tests.mjs`
  and `node tests/structural/check-structure.mjs`. These cover the unit tests
  (T-U1 validator, T-U2 reader) and the structural integration tests (T-A1
  skills load-clean, T-A2a workflow valid+deterministic, T-A2b agents scoped,
  T-A2c manifest+MCP). Both pass in CI-style with plain Node.
- **Behavioral tier (dispatches real agents; spends tokens — R1):** the runs
  below drive the installed plugin through real workflow segments. They require
  (a) the plugin installed and enabled, and (b) explicit authorization to spend
  tokens. They are **not** run by the automated tiers.

## Prerequisites for the behavioral tier

1. Add this repo as a plugin marketplace and enable `expert-dev-tools`, then
   `/reload-plugins`. Confirm `/expert` resolves and the nine
   `expert-dev-tools:*` agents and skills load (this is **A-1** and the
   discovery half of **A-2c**, verified live rather than structurally).
2. Preflight: confirm CodeGraph, Clear-Thought, and Context7 answer (the
   command's step 1). `.mcp.json`'s Context7 + Clear-Thought start; A-2d.

## A-3 — end-to-end (system)

Run `/expert` with the fixture toy task (`tests/fixture/project/TASK.md`) in a
throwaway copy of `tests/fixture/project/`. Expect: a spec is produced and the
**intent gate** is presented; on approval, the phases advance through their
review loops to PASS, ground truth executes (calls `farewell`, observes output
and the thrown error), and closeout produces a report, a prepared commit/PR,
and a **drafted** CORE message presented for approval (never auto-ingested).
Pass = no phase skipped, intent gate fired, closeout reached only after
ground-truth PASS.

## A-4 — forced failures (system)

Each substitutes a fixture forced-failure agent (in `tests/fixture/agents/`)
for the corresponding real agent, by placing it in the fixture project's
`.claude/agents/` so it shadows the plugin agent for that run.

- **A-4a out-of-plan change:** use `forced-unauthorized-implementer`. Expect the
  diff-vs-plan check to flag the unauthorized file and the workflow to escalate
  a `spec_traceable` gate — not pass it through. Removing the plant → the check
  does not fire.
- **A-4b fabricated verification:** seed the implementer's `evidence[]` with one
  citation whose command, when re-run, does not reproduce, placed at an index
  the deterministic sampler selects (`sampleIndices` in the workflow; seed =
  ledger.revision+1). Expect the spot re-run to catch it and fail the phase.
- **A-4c seeded spec contradiction:** give the fixture spec two requirements
  that cannot both hold. Expect the contradiction to surface at plan time and
  escalate a `spec_traceable` gate to the owner — no machine resolution.
- **A-4d non-convergence:** use `forced-fail-reviewer`. Expect the review loop
  to breach the round cap (5) and escalate a `non_convergence` gate carrying a
  diagnosis (per **A-7**), rather than looping forever or falsely passing.

## A-5 — resume (system)

Kill a run mid-segment; re-invoke `/expert resume`. Expect resume from the
ledger with no completed phase re-executed (verify against the workflow run
journal and the ledger `revision`/`phase`).

## A-6 — owner-language (integration)

Inspect each gate presented in A-3/A-4: it states what happened, the options,
and a recommendation, in plain language, with no unexplained internal
identifiers.

## A-7 — diagnosis quality (property of the A-4 runs)

Each A-4 escalation carries a diagnosis whose `root_cause` names the planted
defect (not a symptom restatement) and a `correction_draft` that would remove
it.

## A-8 — feedback loop

With the fixture transcripts in `tests/fixture/transcripts/` as the project's
transcripts, run a segment. Expect the feedback sweep to detect the planted
repeated complaint (the "TODO placeholder" signature appears in both sessions —
already confirmed extractable by the reader) as a `systemic_defect` naming the
planner, and the single-occurrence "run the tests" turn as a
`course_correction`, without interrupting the in-flight phase (verify the run
journal shows uninterrupted phase execution).

## A-9 — cross-project recurrence + failed correction

- **(a)** Record a shared-machinery signature while running the fixture in one
  project dir; run the fixture in a second project dir and confirm the signature
  in `${CLAUDE_PLUGIN_DATA}/defect-history.json` is visible there — one
  occurrence in each is detected as a repeat.
- **(b)** Mark a signature `corrected` with `fixed_in_version` ≤ the running
  plugin version and re-trigger it: expect `failed_correction`, escalation with
  the original diagnosis, and **no** remediation dispatch (run journal).
- **(c)** With `fixed_in_version` > the running version: expect
  `stale_deployment` ("update the plugin"), not a failed correction.

## Recording results

Log each criterion's verdict and evidence. A-1, A-2 (structural), T-U1, T-U2
are already green via the automated tiers; the behavioral criteria are green
only when their runs above are observed to pass.
