---
id: EDT-0023
title: The defect-report record format in expert-usage does not match the schema it claims to reuse
state: open
severity: minor
component: skills/expert-usage/references/defect-reporting.md
found_in_version: 0.5.0
found_by: source reading, 2026-11-01, Claude app session, main @ 67e81aa
fixed_in: null
---

# EDT-0023 — The defect-report record format in expert-usage does not match the schema it claims to reuse

## What happens

The ledger schema states that the plugin-scoped store "reuses the same record shape
(`$defs.signature_record`)" (`scripts/ledger.schema.json`, `signature_history.description`).
That record has `additionalProperties: false`, requires `signature`, `description`,
`responsible_component`, `occurrences`, `state`, and its occurrence items allow only `project`,
`session_file`, `date`, `plugin_version`, also with `additionalProperties: false`.

The example record in `skills/expert-usage/references/defect-reporting.md:24-40`:

- includes `verdict_last`, which the record does not allow;
- includes `count` on each occurrence, which the occurrence item does not allow;
- omits `description`, which is required.

## Impact

A record written by following the reporting guide fails the schema the store is declared to
share. Nothing currently validates `defect-history.json`, so the mismatch is silent until
something does.

## Evidence

- `scripts/ledger.schema.json` — `$defs.signature_record`
- `skills/expert-usage/references/defect-reporting.md:24-40`
