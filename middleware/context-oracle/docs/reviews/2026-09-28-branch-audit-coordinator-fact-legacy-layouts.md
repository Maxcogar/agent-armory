# Coordinator fact: exactly one old store layout can hold owner-typed rows

Established 2026-09-28 from the repository. It narrows the store-rebuild design
in `docs/architecture-phase-a.md` AD-4.

## The facts

- **The branch's first `init` build had no typing verbs.** `ctxoracle init`
  first exists on this branch at `c45e0db` (2026-09-25). Its `dispatch.ts`
  registers no `note`, `correct` or `tune` verb. The coordinator ran
  `git show c45e0db:middleware/context-oracle/ctxoracle/src/cli/dispatch.ts`
  and grepped for those verb names: no match.
- **Every later build has them.** `dispatch.ts` registers all three from
  `b229c04` (2026-09-26T03:27:22Z) and at every later build commit checked
  (`57bdd4a`, `177e59f`, `64f46fd`).
- **All three write real rows** (`src/cli/verbs_skeleton.ts`):
  - `tune` writes `tuning` in the global store (`tuning.set(r.global, key,
    value, 'owner')`);
  - `correct` writes `corrections`;
  - `note` writes `lessons` in the global store and `human_facts` in the
    project store.
- **The migrations have not changed since `b229c04`.**
  `git log b229c04^..HEAD -- middleware/context-oracle/ctxoracle/src/stores/migrations/`
  lists only `b229c04` itself.

## What follows

- **One layout matters.** A store that can hold owner-typed rows was built from
  the `b229c04` migrations. That is exactly one known layout, identical to the
  migrations at HEAD.
- **Older stores hold nothing irreplaceable.** Stores from earlier builds
  (`4dd0f00` / `4e070ce`, or `c45e0db`) could not take owner input, so
  everything in them can be rebuilt.
- **So the rebuild needs no general copy.** It does not need to copy any source
  "by column name". It needs one enumerated, table-by-table mapping from the
  `b229c04` layout to the new one. That mapping can be tested against a real
  store written by the `b229c04` code.
- **Legacy stores of any other layout** are rebuilt from the repository. Their
  files are left in place, unread, and are never written or deleted except by
  `deinit --purge --discard-human`.
