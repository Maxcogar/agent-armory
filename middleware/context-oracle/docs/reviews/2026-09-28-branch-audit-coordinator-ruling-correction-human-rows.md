# Correction to the store-recovery correction: which rows are human-entered

`2026-09-28-branch-audit-coordinator-ruling-correction-store-recovery.md` item 3
defines the rows `export-human` must save as "every row whose provenance or
trust is `human`". That test misses human-entered rows. The round-3
architecture revision raised this, and the coordinator confirmed it in the
schema:

- `corrections` (`ctxoracle/src/stores/migrations/001_phase_a_project.sql`
  L140–L150) has no provenance or trust column. `ctxoracle correct` writes it by
  hand, and it is append-only.
- `human_facts` (L130) is human-entered by name.
- The global store's `tuning` and `lessons` tables
  (`002_phase_a_global.sql` L20, L26) carry values the owner sets.

A test on a column value can only find rows in tables that have that column. So
it silently leaves out the tables that don't — the fail-slow shape the ruling
was written to prevent.

## The correction

1. **Define "human-entered" by the writer, not by a column.**
   - AD-4 lists every table that any owner-invoked verb writes (`note`,
     `correct`, `tune`, and any other verb the plan defines), together with the
     column or kind that marks a row as human there. The marking column is
     named only where the table mixes human and derived rows (for example
     `landmines.kind = 'human_stated'`).
   - `export-human`, `import-human`, the `deinit --purge` refusal and every
     forward migration's must-carry set all use that one list.
2. **The list is enforced by a test.** The test fails when any owner-invoked
   verb writes a table that isn't on the list. The list therefore cannot drift
   from the code.
3. Everything else in the store-recovery correction stands.
