---
id: EDT-0020
title: Sweep returns carry no project, session or plugin version, so recurrence and version verdicts have no inputs
state: open
severity: serious
component: workflows/expert-lifecycle.js FEEDBACK_SCHEMA + feedbackSweep + commands/expert.md step 4
found_in_version: 0.5.0
found_by: source reading, 2026-11-01, Claude app session, main @ 67e81aa
fixed_in: null
---

# EDT-0020 — Sweep returns carry no project, session or plugin version, so recurrence and version verdicts have no inputs

## What happens

`FEEDBACK_SCHEMA` (`expert-lifecycle.js:300`) defines each disposition as `signature`,
`occurrences` (an integer count), `verdict`, `responsible_component`. Nothing else.

Two consumers need more than that:

1. **The verdict split.** `failed_correction` vs `stale_deployment` is defined as an occurrence's
   `plugin_version` compared with the signature's `correction.fixed_in_version`
   (`docs/arch/architecture-expert-dev-tools.md:210-218`: "This is why occurrences carry
   `plugin_version`"). The diagnostician must produce this verdict, but the sweep dispatch
   supplies no running plugin version, and the transcripts it reads do not record one.
2. **The command's record write.** `commands/expert.md:159-173` instructs the command to upsert
   each recurrence as an `occurrences[]` entry keyed on `(project, session_file)` and carrying
   `plugin_version`, deduplicating on those two keys. The report it reads from carries none of
   the three.

## Impact

The `failed_correction` / `stale_deployment` distinction — the reason the two-store, versioned
design exists — is produced without the value it is defined on. Occurrence records cannot be
written in the form the schema requires (`project`, `session_file`, `date` are required on every
occurrence in `$defs.signature_record`) from data the run returns, and the dedup rule that is
the only protection against EDT-0018's recount has no keys to dedup on.

## Evidence

- `workflows/expert-lifecycle.js:300-318` — `FEEDBACK_SCHEMA`
- `workflows/expert-lifecycle.js:567-576` — sweep dispatch; no version supplied
- `commands/expert.md:159-173` — keyed upsert instruction
- `scripts/ledger.schema.json` `$defs.signature_record.occurrences.items.required`
- `docs/arch/architecture-expert-dev-tools.md:210-218` — verdict definitions
