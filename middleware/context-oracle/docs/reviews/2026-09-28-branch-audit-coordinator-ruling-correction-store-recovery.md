# Correction to the store-schema ruling: recovery must not delete human-entered rows

This corrects §1 of
`2026-09-28-branch-audit-coordinator-rulings-schema-and-edit-timing.md`. Review
files are never edited, so the correction is recorded here. The correction
register (Part 4, conflict C-1) raised it: batch 4 part 1 E-5 had already said
that purging a store Max Cogar built destroys his human-entered rows.

## What was wrong

The ruling told the refused open to recover with `ctxoracle deinit --purge` then
`init`. The project store holds rows that no rebuild can recreate:
- the schema marks provenance `human` and trust `human` on several tables
  (`ctxoracle/src/stores/migrations/001_phase_a_project.sql` L44, L46, L55,
  L57, L76, L78, L104, L106);
- it has a `human_stated` landmine kind (L100).

A purge deletes those rows, and `init` rebuilds only what the repository and its
git history can supply. So the ruling's recovery turns "refuse an old store" into
"lose what the owner typed". That violates the same fail-fast rule the ruling
cited: refusing must not destroy data.

Max Cogar said on 2026-09-28 that he has run `init` ("yes i used that before").
So a store with such rows may exist.

## The correction

1. **Identify the schema a store actually has.** Store builds before this fix
   record only `schema_version` `'1'` and no checksums. So the open computes a
   fingerprint of the store's own DDL (`sqlite_master.sql`, normalised) and
   compares it with:
   - the fingerprint of the current migrations;
   - the fingerprint of every earlier migration set committed on the branch —
     the migration files at `4dd0f00` and at each later commit that changed
     them, a finite list read from `git log` at build time;
   - checksum recording, as in the ruling, for stores built from now on.
2. **A known older fingerprint** has a forward migration, written and tested per
   old schema. It carries every human-provenance row across. The open migrates
   inside one transaction and records the step. Where a column has no
   equivalent, the migration fails and changes nothing — it never drops the row.
3. **An unknown fingerprint** is refused, and nothing is written. The CLI then:
   - offers `ctxoracle export-human <file>`, which writes every row whose
     provenance or trust is `human`, read by column name, to a JSON file;
   - reports any row it could not read;
   - explains, in plain words, that rebuilding deletes those rows unless they
     were exported, and that `import-human <file>` restores them after `init`.
4. **`deinit --purge` refuses** while the store holds human-provenance rows that
   have not been exported, unless `--discard-human` is passed. Its message
   states how many rows would be lost.
5. **Tests:**
   - a store built from `4dd0f00`'s migrations with human rows migrates and
     keeps them;
   - an unknown schema is refused with nothing written;
   - `export-human` round-trips through `import-human`;
   - `--purge` without `--discard-human` refuses while human rows exist.

The rest of §1 stands: checksum every migration from now on, refuse on
mismatch, write nothing from the hook path, and never purge automatically.

## The same data-loss class, found by the register and confirmed at HEAD

- `import --replace` copies any file that passes `quick_check` over the live
  store, an empty database included (`src/cli/verbs_skeleton.ts` L202–L213).
  The same rule applies: never replace a store holding human rows without
  exporting them first, and refuse an import whose schema fingerprint is
  unknown.
- `merge-base --is-ancestor` exit 128 is treated as a history rewrite and
  purges mined data (`src/miner/cochange.ts` L436–L440). This is already
  settled in batch 4: 128 is a git fault, with no purge.
