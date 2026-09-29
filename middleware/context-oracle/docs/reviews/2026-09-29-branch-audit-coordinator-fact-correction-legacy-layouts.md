# Correction: two old store layouts can hold owner-typed rows, not one

`2026-09-28-branch-audit-coordinator-fact-legacy-layouts.md` says that `tune`,
`correct` and `note` are registered "from `b229c04`", and that only the
`b229c04` layout can hold owner-typed rows. **That is false.**

## What was checked, and what was missed

- The coordinator checked `dispatch.ts` at five commits: `c45e0db`, `b229c04`,
  `57bdd4a`, `177e59f` and `64f46fd`.
- It never checked `59cc05c`, which sits between `c45e0db` and `b229c04`.
  Sampling commits is not verification: it proves nothing about the commits it
  skipped.

The rebuild-mapping agent found the gap. The coordinator re-checked it on
2026-09-29:

- `git log -1 --format='%h %cI' 59cc05c` → `59cc05c 2026-09-25T23:56:40+00:00`.
- `git show 59cc05c:middleware/context-oracle/ctxoracle/src/cli/dispatch.ts`
  contains `case 'tune'`, `case 'correct'` and `case 'note'`.
- The migrations at `59cc05c` equal those at `b229c04^`: `git diff --quiet`
  exits 0 for `001_phase_a_project.sql` and for `002_phase_a_global.sql`. That
  is the older `4dd0f00` / `4e070ce` layout.

## What is true

- **Two old layouts can hold owner-typed rows:**
  - the `4dd0f00` / `4e070ce` layout, written by `59cc05c`;
  - the `b229c04` layout, which HEAD still ships.
- **Stores from builds before `59cc05c`** (`c45e0db` and earlier) hold only
  rebuildable data.
- **The mapping.** AD-4's rebuild mapping covers both layouts, as the tested
  evidence in `2026-09-28-rebuild-mapping-evidence/` shows. That evidence was
  re-run by the coordinator on 2026-09-29:
  - `build-builds.sh` and `build-stores.sh` exit 0;
  - `test-rebuild.mjs` prints `1400 checks passed, 0 failed`;
  - `mutants.sh`: all 7 mutants make the test exit 1.
