---
id: EDT-0019
title: The feedback sweep is never given the plugin-wide defect store
state: open
severity: serious
component: workflows/expert-lifecycle.js feedbackSweep + agents/expert-diagnostician.md
found_in_version: 0.5.0
found_by: source reading, 2026-11-01, Claude app session, main @ 67e81aa
fixed_in: null
---

# EDT-0019 — The feedback sweep is never given the plugin-wide defect store

## What happens

The sweep prompt (`expert-lifecycle.js:567-576`) tells the diagnostician to "cluster by
signature against the provided stores" and supplies one: the ledger, as JSON. The plugin-scoped
store `${CLAUDE_PLUGIN_DATA}/defect-history.json` is not passed, not read by the workflow, and
not named anywhere in `workflows/expert-lifecycle.js` or `agents/expert-diagnostician.md`. Its
only references in executable instruction are `commands/expert.md:175` and `:276`, both in
steps that run after the workflow has returned.

## Impact

Architecture D15 (`docs/arch/architecture-expert-dev-tools.md:172-182`) and spec F-14
(`docs/specs/spec-expert-dev-tools.md:245-250`) place every signature whose responsible
component is the plugin's own machinery — agents, packaged skills, the command, routing — in
that plugin-scoped store, so that recurrence is detected across projects. Those are exactly the
signatures the sweep cannot match against. Consequently, for defects in the plugin itself:

- a repeat across projects is classified with no record of the prior occurrences;
- `failed_correction` and `stale_deployment` depend on a stored `correction.fixed_in_version`
  the sweep never sees.

`skills/expert-usage/SKILL.md:101-103` and `references/defect-reporting.md` tell agents to file
defects in this store because it "is already read by the recurrence machinery". In the code it
is not read by the sweep.

## Evidence

- `workflows/expert-lifecycle.js:567-576` — sweep prompt; only `JSON.stringify(ledger)` supplied
- `agents/expert-diagnostician.md:32-39` — "the provided signature stores"; no path given
- `commands/expert.md:175`, `:276` — the only references to `defect-history.json`
- `docs/arch/architecture-expert-dev-tools.md:172-182` — D15, two stores
