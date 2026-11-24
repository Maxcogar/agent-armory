---
id: EDT-0022
title: README and expert-usage give contradictory instructions on where to file a plugin defect
state: open
severity: moderate
component: README.md + skills/expert-usage defect-filing guidance
found_in_version: 0.5.0
found_by: source reading, 2026-11-01, Claude app session, main @ 67e81aa
fixed_in: null
---

# EDT-0022 — README and expert-usage give contradictory instructions on where to file a plugin defect

## What happens

- `README.md:88-91`: defects "are recorded in `docs/defects/` … file there rather than patching
  the plugin".
- `skills/expert-usage/SKILL.md:95-106`: read `docs/defects/`, then, if the defect is not there,
  "File it in the machine-wide defect store" at
  `~/.claude/plugins/data/expert-dev-tools/defect-history.json`.
- `skills/expert-usage/references/defect-reporting.md:16-18`: "Writing a report anywhere else
  … strands it."

The two stores are not connected: nothing in the plugin writes a `docs/defects/` entry from a
`defect-history.json` record or the reverse, and `scripts/derive-defect-index.mjs` reads only
`docs/defects/`.

## Impact

An agent following the README files where the usage skill says reports are stranded, and the
reverse. A defect filed in one store is invisible to a reader of the other: the preflight's
open-defect count (`scripts/preflight-deployment.mjs`) and the generated index read only
`docs/defects/`, while the recurrence design reads only `defect-history.json` (and, per
EDT-0019, the sweep does not currently read that either).

## Evidence

- `README.md:88-91`
- `skills/expert-usage/SKILL.md:95-106`
- `skills/expert-usage/references/defect-reporting.md:5-18`
- `scripts/derive-defect-index.mjs` — `DEFECTS_DIR` is `docs/defects` only
