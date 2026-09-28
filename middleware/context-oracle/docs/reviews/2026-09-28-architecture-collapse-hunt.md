# Collapse hunt — Phase A architecture, the mechanisms added since `23f35b9`

Target: `middleware/context-oracle/docs/architecture-phase-a.md` at `3da1385` (the round-4 review commit; the architecture itself last changed at `98ec672`). Diff read in full: `git diff 23f35b9 HEAD -- middleware/context-oracle/docs/architecture-phase-a.md` (2,854 inserted lines, 412 deleted, 104 hunks). Inputs read: `middleware/context-oracle/CLAUDE.md`, `OWNER-LEDGER.md` CONFIRMED, the spec (§4, §5, §6, §8 constraints, §11, §14), the correction review, the round-2/3/4 reviews, both coordinator rulings files and the two corrections to them, the B5 verification ruling 2, and the code the store mechanisms protect (`ctxoracle/src/cli/verbs_skeleton.ts`, `migration_runner.ts`, the migrations). I wrote none of the architecture and no earlier review. No repository file was changed; no commit; no git state change.

## The yardstick

- The collapse test, verbatim: [[middleware/context-oracle/CLAUDE.md@3da1385:L115-L122]] "State its job in one sentence, in mission terms — if the only sentence you can write describes the mechanism, it is filler: cut it."
- The cut rule: [[middleware/context-oracle/CLAUDE.md@3da1385:L139-L141]] "a non-trivial mechanism only passes review without serving the phase goal, cut it: that is a finding, not a decision to defend."
- The phase goal: [[middleware/context-oracle/CLAUDE.md@3da1385:L141-L144]] "**Phase A's goal is an honest deterministic foundation, running on the owner's real repos, that measures its own floor — how little it catches — with clean seams the later phases plug into; never fake completeness dressed to look like a working product.**"
- The spec's own version: [[middleware/context-oracle/docs/specs/spec-context-oracle.md@3da1385:L761-L764]] "A faked or over-built Phase A mechanism corrupts the very measurement the later phases read"

## The facts every store verdict turns on

1. **Every existing store was built by a branch build.** `main`'s CLI at `de66831` has no verbs: [[middleware/context-oracle/ctxoracle/src/cli/dispatch.ts@de66831:L9-L9]] "ctxoracle: no verbs are available yet". `init` first appears on this branch at `c45e0db` (2026-09-25): [[ran]] `git log --format='%h %ad %s' --date=short -- src/cli/init.ts` (in `ctxoracle/`) → `bfe963f 2026-09-26 context-oracle: build Step 15, the language frontends (unreviewed; Python resolver flaw open)` / `177e59f 2026-09-26 context-oracle: build Step 14, the structural indexer (unreviewed)` / `c45e0db 2026-09-25 context-oracle: walking skeleton Steps 21-28 + thin init; end-to-end hook stream passes; gaps G26-G31`.
2. **Exactly two DDL sets can have built a store.** [[ran]] `git log --format='%h %ad %s' --date=iso -- src/stores/migrations/` (in `ctxoracle/`) → `b229c04 2026-09-26 03:27:22 +0000 context-oracle: build the reopened Steps 1-12 deltas and Checkpoint 1R (unreviewed)` / `4e070ce 2026-09-19 16:39:30 +0000 context-oracle: Step 8 — SQL migrations for the Phase A global store` / `4dd0f00 2026-09-19 16:38:07 +0000 context-oracle: Step 7 — SQL migrations for the Phase A project store`. So a store is either the `4dd0f00`/`4e070ce` set (built 2026-09-25 to 2026-09-26) or the `b229c04` set, and no store records checksums: [[middleware/context-oracle/ctxoracle/src/stores/migration_runner.ts@3da1385:L74-L74]] "VALUES('schema_version', '1')".
3. **Human-entered rows can exist in such a store** — the branch's verbs write them: [[middleware/context-oracle/ctxoracle/src/cli/verbs_skeleton.ts@3da1385:L92-L92]] "tuning.set(r.global, key, value, 'owner');", [[middleware/context-oracle/ctxoracle/src/cli/verbs_skeleton.ts@3da1385:L127-L127]] "correctionsDao(r.project).create({", [[middleware/context-oracle/ctxoracle/src/cli/verbs_skeleton.ts@3da1385:L149-L149]] "lessonsDao(r.global).create({", [[middleware/context-oracle/ctxoracle/src/cli/verbs_skeleton.ts@3da1385:L165-L165]] "humanFactsDao(r.project).create({", and the 2026-09-25 build wrote file-id-keyed human landmines: [[middleware/context-oracle/ctxoracle/src/cli/verbs_skeleton.ts@59cc05c:L164-L164]] "landminesDao(r.project).upsert({ kind: 'human_stated', fileId, evidence: fact, support: null, prov: human });". Max Cogar has run `init`: [[middleware/context-oracle/docs/reviews/2026-09-28-branch-audit-coordinator-ruling-correction-store-recovery.md@3da1385:L23-L24]] "Max Cogar said on 2026-09-28 that he has run `init` (\"yes i used that before\"). So a store with such rows may exist."
4. **None of the diff's mechanisms is built.** [[ran]] `grep -n "wepoch\|commit_touches\|export-human\|reweight_pending" -r ctxoracle/src` → no output. Every cut below costs no code.
5. **Derived rows are rebuildable; human-entered rows are not** — the reason store-recovery exists: [[middleware/context-oracle/docs/reviews/2026-09-28-branch-audit-coordinator-ruling-correction-store-recovery.md@3da1385:L18-L21]] "A purge deletes those rows, and `init` rebuilds only what the repository and its git history can supply."

What store-recovery actually protects, as a requirement: [[middleware/context-oracle/docs/reviews/2026-09-28-branch-audit-coordinator-ruling-correction-store-recovery.md@3da1385:L19-L21]] "So the ruling's recovery turns \"refuse an old store\" into \"lose what the owner typed\". That violates the same fail-fast rule the ruling cited: refusing must not destroy data." Its mechanism (fingerprints, per-old-schema forward migrations, export-human) is a coordinator's engineering choice for that requirement, not an owner decision, so a simpler design that meets the requirement may replace it with the reason recorded (`CLAUDE.md` "an engineering decision is yours to correct (`OL-11`), with the reason recorded where the change is made").

---

## Part 1 — the store schema and recovery mechanisms (AD-4, AD-5, AD-20)

### M-1. Per-migration checksums, checked on every open, over the set `fts_state` selects

- **Job:** keep the oracle from running new code against a store whose tables mean something else, which would produce false whispers or crashes the owner cannot see.
- **Skeptic:** a hand-bumped version number does the same; why checksums?
- **Answer:** the version number already failed exactly this way: [[middleware/context-oracle/docs/reviews/2026-09-28-branch-audit-coordinator-rulings-schema-and-edit-timing.md@3da1385:L9-L10]] "The migration runner records the same version for every schema it has ever built". Standard: [[middleware/context-oracle/docs/reviews/2026-09-28-branch-audit-coordinator-rulings-schema-and-edit-timing.md@3da1385:L38-L39]] "Validate works by storing a checksum (CRC32 for SQL migrations) when a migration is executed." The `fts_state`-selected set is F-1's fix for a real contradiction (001b permanently pending in every fallback store).
- **Guide or gate:** neither — infrastructure; it gates nothing the agent does (a refused store is silence, `FR-O3`).
- **Requirement:** `FR-M2` "store corruption" as a self-detected class, and `FR-O3`: [[middleware/context-oracle/docs/specs/spec-context-oracle.md@3da1385:L508-L510]] "Any shim/service error, timeout, or missing store yields silence"
- **Simpler design:** none known.
- **Final verdict:** keep. Keep the migration bound (row-count-independent steps only in a migration's transaction, `sqlite.org/lang_altertable.html`) as the rule for future checksummed migrations: [[middleware/context-oracle/docs/architecture-phase-a.md@3da1385:L1045-L1046]] "**Every migration transaction is bounded like every other writer's** (F-4;"

### M-2. Pre-checksum DDL fingerprints and the committed fingerprint list

- **Job:** tell which of the old schemas a pre-checksum store has, so the matching forward migration can run.
- **Skeptic:** the recovery never needs to know *which* old schema a store has — every pre-checksum store is a branch-built store whose derived rows any `index` rebuilds; what decision does the fingerprint change?
- **Answer:** none. It exists to select a per-old-schema forward migration (M-3): [[middleware/context-oracle/docs/architecture-phase-a.md@3da1385:L912-L912]] "checksums; the open then computes a **fingerprint of the store's own DDL**". Its committed-list form answers F-17 about it, and R4-5 is a defect of it (an interrupted migration's DDL matches no fingerprint).
- **Guide or gate:** neither.
- **Requirement:** none. Store-recovery item 1 prescribes it, but as means to item 2.
- **Final verdict:** cut. **Design:** a store with no checksums is *legacy*, whatever its DDL, and takes M-3's replacement. There is nothing to fingerprint.

### M-3. Per-old-schema forward migrations that carry every human row and end in 003's state

- **Job:** keep what Max Cogar typed when the schema changes under a store he built.
- **Skeptic:** the population is two branch DDL sets and one owner's dev store(s); why write, test and maintain a migration per old schema, a pre-check, a chunked move and a resume rule, when the derived rows are thrown away and re-mined anyway (003's reset) and only the human rows need to survive?
- **Answer:** the requirement is real (fact 3, fact 5); the mechanism is not the simplest that meets it. The forward migration still ends by discarding every derived row: [[middleware/context-oracle/docs/architecture-phase-a.md@3da1385:L939-L939]] "**It ends in the state 003 leaves a checksummed". So it migrates rows only to reset them.
- **Guide or gate:** neither.
- **Requirement (quoted):** store-recovery's "refusing must not destroy data" (above). Nothing requires the carry to be an in-place migration.
- **Simpler design, and why it still protects every human row — rebuild beside, copy, keep the old file:**
  1. Checksummed stores get new file names (for example `project.db` and `global-store.db`); a legacy `store.db` / `global.db` is **never written, renamed or deleted** by any path except `deinit --purge --discard-human`. Nothing that holds a human row can be lost, because the file holding it is left as it is. No rename is needed, so no open handle can be orphaned (`sqlite.org/howtocorrupt.html`, the two-files-one-name case).
  2. When the new-name store is absent and a legacy file exists, the hook path is silent and records `store_legacy` on the JSONL channel (writes nothing to either store); `SessionStart` and `UserPromptSubmit` spawn the detached index child (M-6), which under the reindex lock creates the new store at a temporary name, applies the current migrations (003's schema folded into the first checksummed set, since no checksummed store exists yet), opens the legacy file **read-only**, copies the tables of the writer-based human-row list (R4-1) by column-name intersection in one transaction, resolves every file reference through the legacy `files.path` to a path and then to the new store's `files` row (R4-2; a path with no row gets an `in_tree = 0` row, as the miner makes for history-only files), copies the global store's bindings with the owner rows, renames the temporary file into place, and then runs the ordinary first index and mine.
  3. A row with a value in a column the new layout lacks is not written and is named in `status` with table, column and key; the new store records the count of such rows (`schema_meta.legacy_unplaced`), and the value stays in the kept legacy file.
  4. A crash before the rename leaves only a temporary file, which the next child discards and redoes; the legacy file was only read, so the copy is repeatable with no idempotence rule (R4-8's class cannot arise).
  5. `status` says, in plain words, that the store was rebuilt, that notes/corrections/tunings were carried, where the old store is kept, and any value that could not be carried.
- This departs from store-recovery items 1–3 and from CR§1's "`deinit --purge`, then `init`" route; it keeps store-recovery's requirement (no human row destroyed) and CR§1's rest ([[middleware/context-oracle/docs/reviews/2026-09-28-branch-audit-coordinator-rulings-schema-and-edit-timing.md@3da1385:L56-L56]] "There is no automatic purge and no silent re-migrate." — nothing is purged, and the rebuild is recorded and shown, not silent). The departure is an engineering correction and needs recording where AD-4 changes.
- **Final verdict:** cut (replaced by the rebuild-beside design above).

### M-4. The read-only pre-check, the refusal recomputed on every open, `reason: 'migration_failed'`, `store_migration_failed`

- **Job:** refuse a forward migration that would drop a value a human wrote, without writing to the store.
- **Skeptic:** it only exists because M-3 migrates in place; without an in-place migration, what can it refuse?
- **Answer:** nothing. It is R2-7's and R3-3's answer about M-3, and it produced R4-4 (a full scan on every prompt of a pre-checksum store, against AD-23's "no O(store) statement is permitted on the event path") and R4-9: [[middleware/context-oracle/docs/architecture-phase-a.md@3da1385:L950-L951]] "The refusal is **recomputed on every open, never stored**".
- **Guide or gate:** neither.
- **Requirement:** none beyond M-3's.
- **Final verdict:** cut. **Design:** M-3 step 3 (the unplaced row is reported and stays in the kept legacy file).

### M-5. The chunked, resumable forward-migration move (1,000-row rowid ranges, `INSERT OR IGNORE`, run under the reindex claim, the departure from store-recovery item 2)

- **Job:** move rows into a rebuilt table without holding the write lock past the waiter's window.
- **Skeptic:** which forward migration moves rows? The document itself says 003 does not; the only candidates are the per-old-schema migrations of M-3.
- **Answer:** [[middleware/context-oracle/docs/architecture-phase-a.md@3da1385:L1092-L1092]] "**Each chunk is one rowid range of at most 1,000 rows**" and [[middleware/context-oracle/docs/architecture-phase-a.md@3da1385:L1106-L1107]] "**This departs from store-recovery item 2**". It exists for M-3 and was then given a claim rule (R2-10) and a resume claim R4-5 shows false.
- **Guide or gate:** neither.
- **Requirement:** none.
- **Final verdict:** cut, with M-3.

### M-6. 003 as a migration, and its chunked history reset (`history_reset_pending`, 500-row delete ranges)

- **Job:** make every existing store consistent with `commit_touches` so eviction and the fresh-mine equality hold.
- **Skeptic:** every store that could take 003 is a legacy store (fact 2); if legacy stores are rebuilt, who runs the reset?
- **Answer:** no store. [[middleware/context-oracle/docs/architecture-phase-a.md@3da1385:L946-L947]] "so no store built so far — Max Cogar's included (CR§1) — reaches 003 as a pending checksummed migration." The 500-row bound is the subject of R4-3 and R4-12.
- **Guide or gate:** neither.
- **Requirement:** the consistency it restores is required (AC-13's eviction, M-15); its migration and data step are not.
- **Final verdict:** simplify. **Design:** fold 003's tables and columns into the first checksummed migration set; the rebuild of M-3 mines from `S = ∅`, so no reset, no `history_reset_pending`, and no 500-row delete ranges exist.

### M-7. Pending-store spawn on `SessionStart`

- **Job:** end the silence after an upgrade without waiting for the owner to run a command he does not know about (`OL-11`).
- **Skeptic:** is a detached spawn a hidden daemon?
- **Answer:** no; it is the staleness spawn every repository already makes, fire-and-forget, off the path (NF-1). F-3 found the silence real: nothing but the owner's own CLI use ended it.
- **Guide or gate:** neither.
- **Requirement:** `OL-10` (the owner cannot see a silent tool: [[middleware/context-oracle/OWNER-LEDGER.md@3da1385:L48-L48]] "it could fail a hundred ways in front of me and I wouldn't know.").
- **Final verdict:** keep, as the trigger of M-3's rebuild child.

### M-8. Pending-store spawn on `UserPromptSubmit`

- **Job:** a session already running when the build is rebuilt (hooks point at the checkout's build, so an agent working on the oracle rebuilds it mid-session) is not silent until its next `SessionStart`.
- **Skeptic:** it put the pre-check scan on every prompt (R4-4); is it worth it?
- **Answer:** the scan was M-4's, not the spawn's. With M-3's replacement the check on the event path is a file-existence test, and the spawn is one more trigger of the same child: [[middleware/context-oracle/docs/architecture-phase-a.md@3da1385:L1032-L1034]] "on `SessionStart` and on `UserPromptSubmit` — the latter so a session already running when the build is upgraded is not silent until its next `SessionStart`".
- **Guide or gate:** neither.
- **Requirement:** `OL-10`, as M-7.
- **Final verdict:** keep (trivial once M-4 is gone; gated to while the store is legacy or pending).

### M-9. `export-human` / `import-human` (JSON, by column name, row-by-row refusal, 1,000-row import transactions)

- **Job:** take the human rows out of a refused store and put them back after a rebuild.
- **Skeptic:** FR-K9 already requires whole-store export/import, and M-3's kept legacy file already holds every human row; what does a second, row-level format add except its own defects (R4-2 ids, R4-8 idempotence, R4-10 file naming)?
- **Answer:** nothing the replacement lacks. [[middleware/context-oracle/docs/architecture-phase-a.md@3da1385:L994-L994]] "by another build, offers `ctxoracle export-human <file>` (every row whose". The spec's requirement is the whole-store round trip: [[middleware/context-oracle/docs/specs/spec-context-oracle.md@3da1385:L616-L616]] "**FR-K9 — Export/import round-trip**; no network sync `[OL-6]`."
- **Guide or gate:** neither.
- **Requirement:** none for a row-level human export.
- **Final verdict:** cut. **Design:** M-3's copy from the kept legacy file; `ctxoracle export` (FR-K9) for a manual copy.

### M-10. `deinit --purge` refusal: `--exported <file>` comparison and `--discard-human`

- **Job:** stop an owner-typed deletion from silently destroying notes, corrections and tunings he entered.
- **Skeptic:** the owner asked for the purge; why refuse?
- **Answer:** the refusal (count the list's rows, refuse without `--discard-human`) is store-recovery item 4 and costs one count per listed table. The `--exported` comparison exists only because M-9 exists: [[middleware/context-oracle/docs/architecture-phase-a.md@3da1385:L4127-L4128]] "`--purge --exported <file>` purges a store holding human rows only when the named `export-human` file holds every one of them with equal values and".
- **Guide or gate:** neither (an owner-facing CLI refusal).
- **Requirement:** [[middleware/context-oracle/docs/reviews/2026-09-28-branch-audit-coordinator-ruling-correction-store-recovery.md@3da1385:L47-L49]] "**`deinit --purge` refuses** while the store holds human-provenance rows that have not been exported, unless `--discard-human` is passed. Its message states how many rows would be lost."
- **Final verdict:** simplify. **Design:** refuse while any human-row-list row exists in the current store, or `legacy_unplaced > 0`, or a legacy file exists, unless `--discard-human`; the message gives the counts and suggests `ctxoracle export <dir>` first. No `--exported`.

### M-11. `import`'s human-row guard, checked against an export file the import names

- **Job:** keep `import` from replacing a live store's human rows.
- **Skeptic:** `import <file>` names no export-human file (R4-10); what is compared?
- **Answer:** [[middleware/context-oracle/docs/architecture-phase-a.md@3da1385:L1400-L1402]] "A live store holding human-provenance rows is never replaced until they have been exported (`export-human`, AD-4) — checked against the export file the import names,". The requirement is store-recovery's "never replace a store holding human rows without exporting them first".
- **Guide or gate:** neither.
- **Final verdict:** simplify. **Design:** `import` keeps each live store it replaces as a file beside it (`backup()` to `<path>.pre-import-<ts>`) before phase 3 writes, and reports the path; no human row is destroyed, and no flag or export file is needed. The rest of the three-phase import (M-12) stands.

### M-12. The three-phase `import` (validate both, prepare bindings, write project then global; `partial_write`; `.import-tmp` detection)

- **Job:** an import never leaves the owner with a half-written or invalid pair of stores without telling him.
- **Skeptic:** is this more than FR-K9 asks?
- **Answer:** it answers executed defects (import copied any `quick_check`-passing file, an empty database included, store-recovery L62–L63) and orders two files that have no shared transaction; each part is one sentence of standard practice (validate before write).
- **Guide or gate:** neither.
- **Requirement:** [[middleware/context-oracle/docs/specs/spec-context-oracle.md@3da1385:L1091-L1093]] "assert the imported stores are **record-identical** to the originals;"
- **Final verdict:** keep, with the schema check reduced to M-1's (a legacy export file goes through M-3's copy, not a fingerprint).

### M-13. The writer-based human-row list and its enforcement test (the human-rows correction)

- **Job:** one list says which rows cannot be rebuilt, so every carry and every refusal sees the same rows.
- **Skeptic:** the column test was simpler.
- **Answer:** it misses `corrections` and `tuning`, which have no such column: [[middleware/context-oracle/docs/reviews/2026-09-28-branch-audit-coordinator-ruling-correction-human-rows.md@3da1385:L16-L18]] "A test on a column value can only find rows in tables that have that column. So it silently leaves out the tables that don't".
- **Guide or gate:** neither.
- **Requirement:** store-recovery's no-data-loss rule.
- **Final verdict:** keep, with R4-1's verb set (`note`, `note --global`, `correct` including `--missed-question`, `tune`). Under the verdicts above its users shrink to M-3's copy, M-10's count and M-11 (none of which exist in the architecture yet — R4-1 is not applied anywhere).

### M-14. Key- or home-addressed read form for `status`/`log`; purge deletes the `whisper_stats` replica

- **Job:** read an imported store that has no binding on this machine without `init` overwriting it; keep the global replica equal to what stores hold.
- **Skeptic:** small conveniences reviewed into existence?
- **Answer:** both answer executed or text-level contradictions (R-34 (a), (e)) and add a flag and one delete: [[middleware/context-oracle/docs/architecture-phase-a.md@3da1385:L1445-L1446]] "take a **key- or home-addressed read form** that names the store by repo key".
- **Guide or gate:** neither.
- **Requirement:** FR-K9/AC-19 (import into an empty location must be readable), FR-M4.
- **Final verdict:** keep.

## Part 2 — the miner (AD-13)

### M-15. The target set `T(H)` and the reconcile (evict `D = S \ T`, mine `A = T \ S`) over stored `commit_touches`

- **Job:** the co-change facts the oracle speaks are exactly those of the configured horizon, refreshed incrementally, so a whisper's ratio is true of the history it names.
- **Skeptic:** 300,000 stored rows to drop old commits; why not slack past the horizon, or a full mine when the horizon moves?
- **Answer:** both break a spec line: [[middleware/context-oracle/docs/specs/spec-context-oracle.md@3da1385:L1067-L1068]] "beyond-horizon history contribute no edges; append refreshes incrementally;". At `HEAD` the incremental store broke the cap and differed from a fresh mine (executed, B7a E-10, cited at AD-13). A per-commit touched set is the smallest record from which a commit can be subtracted without git. The same rule removes the purge on rewrite and branch switch.
- **Guide or gate:** neither.
- **Requirement:** AC-13, FR-K2.
- **Final verdict:** keep. Keep with it: the pass-start `HEAD` watermark written only in the final transaction, `miner_stream_incomplete`, `history_rewritten`/`branch_changed` as diagnostics, `git_failed`, unreferenced history-only row deletion, hub degree read from the pairs.

### M-16. `refTs` validation (`REF_TS_FUTURE_TOLERANCE_S` = ten days, `miner_ref_ts_invalid`)

- **Job:** a far-future tip date can no longer empty the co-change store silently.
- **Skeptic:** an edge case?
- **Answer:** executed: a tip at 40000000000 horizon-excluded every commit and left an empty store with no fault; git accepts such a date. [[middleware/context-oracle/docs/architecture-phase-a.md@3da1385:L2332-L2333]] "clock plus `REF_TS_FUTURE_TOLERANCE_S` = 864,000 s (ten days; a named constant".
- **Guide or gate:** neither.
- **Requirement:** `FR-M2`/`OL-10` (a silent empty store is the failure the owner cannot see).
- **Final verdict:** keep.

### M-17. Re-weight case 1 — a changed half-life `h` is a store-side recompute from `commit_touches`

- **Job:** a ratio never mixes two decay rates after the owner tunes `h`.
- **Skeptic:** the earlier design re-mined; why recompute?
- **Answer:** F-6: once `commit_touches` exists, a store-side recompute needs no git read. [[middleware/context-oracle/docs/architecture-phase-a.md@3da1385:L2428-L2429]] "1. **A changed `h`, or a store missing any of the three while it holds weighted commits, is a full recompute**".
- **Guide or gate:** neither.
- **Requirement:** FR-K2's recency-weighted horizon (a mixed-rate ratio is no recency weighting at all).
- **Final verdict:** simplify. **Design:** one rule for every mining-time input — the pass compares the stored *mined-with* values (`h`, the epoch, and the digests of `miner.max_transaction_entities` and `lexicon.fix_keywords`, M-20) with the current ones, written only in the final transaction; any difference makes the pass a full recompute (or, for M-20's keys, a reconcile with `D = S`). A crash leaves the mined-with values stale and `mining_in_progress` set, so the next pass does the same work again: no `reweight_pending`, no marker merge.

### M-18. Re-weight case 2 — the half-life epoch grid `E = h⌊refTs/h⌋`, per-row `wepoch` columns, the exact power-of-two rescale in 20,000-row rowid ranges

- **Job:** keep the stored weights finite and exactly equal to a fresh mine's while `refTs` advances.
- **Skeptic:** the confidence is a ratio of two sums that share one epoch; moving the epoch changes no ratio. Why move it every half-life (every 1.79 days at the floor) and then build a resumable exact rescale, three new columns and a rowid-range bound to make that frequent move cheap?
- **Answer:** the frequency is self-inflicted: [[middleware/context-oracle/docs/architecture-phase-a.md@3da1385:L2543-L2544]] "which the epoch rule makes once per half-life of `refTs` (about every 1.79 days at the half-life floor, every 365 days at the seed), is the". The grid exists to make an incremental store's weights equal a fresh mine's *bit for bit* (F-16), which no spec line requires; the ratio, the only quantity any whisper or bar term reads, agrees to rounding without it. The rescale is B5 ruling 2's mechanism, but ruling 2's stated properties are [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B5-verification.md@3da1385:L108-L110]] "It needs no re-mine and no calendar-derived floor on `h`. The only floor is underflow, h above about 1.79 days."
- **Guide or gate:** neither.
- **Requirement:** none for the grid or the rescale. The requirement is the weights staying normal doubles (a subnormal breaks the ratio, executed B7b E-6).
- **Simpler design that meets ruling 2's properties:** the epoch is fixed when a store is first mined (for example `E = refTs − 500·h`) and kept by incremental passes; a term whose exponent would pass a stated bound (for example 1,000) makes the pass M-17's full recompute at a new epoch — a store-side recompute, not a re-mine, and with no calendar floor on `h` (the underflow relation still bounds `h` from below). At the seeded `h` that recompute never occurs in practice (500 half-lives of 365 days); at the 1.79-day floor, about every 2.5 years of `refTs`. Fresh-mine equality is asserted on ratios within the stated relative tolerance, not on raw weights. The departure from ruling 2's rescale is recorded where AD-13 changes, with this reason.
- **Final verdict:** cut (`wepoch`, the grid, the rescale, `RESCALE_RANGE_ROWS` and their measurements: [[middleware/context-oracle/docs/architecture-phase-a.md@3da1385:L2445-L2445]] "`RESCALE_RANGE_ROWS` = **20,000** rows in rowid order, its upper bound").

### M-19. Re-weight case 3 and `reweight_pending` — recompute the commits whose `refTs` cap moved; the floor/`'all'` marker merge

- **Job:** a commit authored after an earlier tip's committer time gets the weight a fresh mine would give it once the tip moves.
- **Skeptic:** which fact changes? Those commits are the clock-skewed ones `miner_ts_capped` already counts; their stored term is lower than a fresh mine's, so the error is under-weighting, the silent-side direction, of a rare class. Why a marker with merge rules and a crash protocol for it?
- **Answer:** F-5 called the earlier stated exception "a patch" — [[middleware/context-oracle/docs/reviews/2026-09-28-architecture-correction-review.md@3da1385:L13-L13]] "written as a stated exception layered over the design — a patch — and it is misstated". The misstatement (the rising case) is a real defect in the *statement*; the remedy chosen was mechanism (R2-11 then found the merge incomplete). [[middleware/context-oracle/docs/architecture-phase-a.md@3da1385:L2509-L2510]] "3. **A moved `refTs` changes only the capped terms:** when `R0 ≠ refTs`,"
- **Guide or gate:** neither.
- **Requirement:** none. No spec line requires an incremental store's capped terms to track later tips.
- **Final verdict:** cut. **Design:** a commit's term is capped at the `refTs` of the pass that mined it; stated as a limitation, correctly this time: "a commit whose author time is later than the tip it was mined under keeps that capped, lower weight until it is evicted or the next full recompute, whether the tip later moves up or down; such commits are counted by `miner_ts_capped`; the effect is under-confidence on those commits only." The equality clause names this exception.

### M-20. Re-classification of stored commits on a tuning change (`commits.fix_lexicon` digests, subject re-reads, moving commits in and out of size exclusion)

- **Job:** a tuned size cap or fix lexicon takes effect on the history already mined.
- **Skeptic:** these keys change only when the owner runs `tune`; why per-commit digests and a partial re-classification instead of re-mining when a mining-time key changes?
- **Answer:** [[middleware/context-oracle/docs/architecture-phase-a.md@3da1385:L2711-L2712]] "its fix label was computed with (`commits.fix_lexicon`, AD-4), so the pass selects every contributing stored commit of `T` whose digest differs from". It answers R2-6 (the equality clause's "no exception" was false). The requirement is only that the tuning takes effect: [[middleware/context-oracle/docs/specs/spec-context-oracle.md@3da1385:L607-L609]] "capping very large transactions (illustrative ~30, tunable `[ROSE]`), over a configurable recency-weighted horizon `[ROSE]`."
- **Guide or gate:** neither.
- **Simpler design:** M-17's mined-with digest of the two keys; a change makes the next pass a reconcile with `D = S` (the existing eviction, then the existing mine) — no new column and no second git read path. `tune` says the next pass re-mines. The cost is the history genres' silence for one full mine after a `tune` of these keys, which only the owner causes.
- **Final verdict:** simplify.

### M-21. Renames not followed, with measured rename counts (L14)

- **Job:** the exit data say how much history a rename follower would carry, so Phase B decides from data.
- **Skeptic:** a limitation dressed as a feature?
- **Answer:** it builds nothing and measures the floor, which is the phase goal: [[middleware/context-oracle/docs/architecture-phase-a.md@3da1385:L2929-L2930]] "**Renames are not followed in Phase A.** A rename entry contributes both paths,".
- **Guide or gate:** neither.
- **Requirement:** the phase goal (measure the floor).
- **Final verdict:** keep.

## Part 3 — the bar and ranking (AD-14, AD-16)

### M-22. Structural confidence `s_g` (three rows seeded 0.75 inside the band [0.741, 0.8)) and the stored-set relation

- **Job:** structural whispers (Orientation, Reuse, Verification) speak with an honest, flagged confidence instead of failing the bar by construction or posing as certain.
- **Skeptic:** a number picked to land in a band?
- **Answer:** the defect was real (`c.ratio ?? 0` silenced every structural candidate; Orientation's constants were silent certainty), and the band is derived from the bar's own seeds so that at the seeds nothing is silenced and everything is flagged: [[middleware/context-oracle/docs/architecture-phase-a.md@3da1385:L3051-L3052]] "`s < 0.8`, so the band is [0.741, 0.8) (executed:". Spec: [[middleware/context-oracle/docs/specs/spec-context-oracle.md@3da1385:L185-L187]] "**its confidence stated whenever not high**".
- **Guide or gate:** guide (a flagged whisper).
- **Final verdict:** keep.

### M-23. Stored-set tuning validation; any `TuningInvalid` silences the whole event; the once-per-`(key, value)` marker

- **Job:** a corrupt or out-of-order tuning value never runs the oracle on a value the owner did not set, and the silence it causes is named with its fix.
- **Skeptic:** silencing everything for one bad key is a big hammer.
- **Answer:** the spec's first clause covers any error (`FR-O3`, quoted in M-1); serving a seed is Shore's failing-slowly shape; the marker keeps the record once per value. [[middleware/context-oracle/docs/architecture-phase-a.md@3da1385:L3121-L3122]] "**Any `TuningInvalid` silences the whole event — no whisper and no deny**".
- **Guide or gate:** neither.
- **Final verdict:** keep.

### M-24. Decision-impact `i` as a lexicographic total order (context, zone, band)

- **Job:** gives the response rank (M-26) a sortable first key while keeping the impact floor one threshold.
- **Skeptic:** the floor is already the plan's three-way disjunction; who needs a total order except the rank?
- **Answer:** nobody else. [[middleware/context-oracle/docs/architecture-phase-a.md@3da1385:L3193-L3194]] "trigger). **Its order (R3-7):** `i` is the triple (context, zone, band), compared **lexicographically**". It answers R3-7 about the rank; R4-7 is its next defect (band counts different things per genre).
- **Guide or gate:** neither.
- **Requirement:** FR-A5 (b) names the three properties, not an order among candidates.
- **Final verdict:** simplify. **Design:** `i` is the floor only — passes when the event is an edit, or the target's zone is `generated`/`build_output`, or the band is at least `bar.impact_read_min_coupled`; band defined once for every candidate (R4-7's residue, below).

### M-25. The preview pad and `previewWhole`/`previewCut`

- **Job:** when a response exceeds the harness's 10,000-character cap, the 2,000-character preview the model sees ends on a whole whisper.
- **Skeptic:** how often does a Phase A response exceed 10,000 characters? The document itself does not know.
- **Answer:** [[middleware/context-oracle/docs/architecture-phase-a.md@3da1385:L3667-L3668]] "show how often the case arises; no measurement of response length exists yet, and no volume term exists to keep a response under the cap (AD-14)." So the pad serves a case with no occurrence data, it answers R3-6, and its unit rule is R4-6's defect: [[middleware/context-oracle/docs/architecture-phase-a.md@3da1385:L3644-L3645]] "reference does not name its character unit, so the composer places the pad by Unicode code points and tests the cap by UTF-8 bytes,". What to do over the cap is already pending with Max Cogar (`OL-C1`).
- **Guide or gate:** neither.
- **Requirement:** none demands the pad. FR-D1's rumor rule governs what the oracle emits; the oracle emits every whisper whole, and a cut preview over the cap is a harness substitution the oracle records.
- **Final verdict:** cut. **Design:** the composer sends every cleared whisper whole and records `response_over_cap` with the length and whisper count (kept); stated limitation: "over the cap the model's preview may end partway through a whisper; how often is measured; the handling is chosen with `OL-C1`'s over-cap decision, from the exit data."

### M-26. The response rank (`i` descending, then `c`, then generator order, then subject key) and its five-step backing

- **Job:** decide which whispers land inside the preview when a response is over the cap.
- **Skeptic:** under the cap the order changes nothing the model reads; over the cap it matters only through M-25's preview, and the options that would make it decide more (withhold, defer) are Max's pending call. What does the rank do before that decision?
- **Answer:** [[middleware/context-oracle/docs/architecture-phase-a.md@3da1385:L3733-L3734]] "pipeline's genre sequence decide). No spec or ledger line orders whispers, so this is the agents' engineering decision (`OL-11`), backed by the". It exists for the over-cap case (R2-3, R3-7).
- **Guide or gate:** neither.
- **Requirement:** none now.
- **Final verdict:** cut. **Design:** a fixed deterministic order (the Stop outstanding-question line first, then the order candidates are produced), stated as carrying no weight below the cap; the rank is designed with `OL-C1`'s over-cap decision if that decision needs one.

### M-27. The composer's "send every cleared whisper whole" rule with `response_over_cap` and the per-response length record

- **Job:** nothing that clears the bar is suppressed by a limit, and the over-cap case is measured.
- **Skeptic:** sending what the harness will replace with a file?
- **Answer:** the interim rule is the only one the written decisions allow: [[middleware/context-oracle/OWNER-LEDGER.md@3da1385:L67-L67]] "at no point should an arbitrary limit influence how that operates." and [[middleware/context-oracle/docs/specs/spec-context-oracle.md@3da1385:L1004-L1005]] "Two candidates meeting the bar at one event are both delivered;".
- **Guide or gate:** guide.
- **Final verdict:** keep.

## Part 4 — concurrency (AD-26)

### M-28. One busy wait for every connection (100 ms + one retry), the yield gap `miner.chunk_gap_ms` (floor 25, seed 30), the before-write check, `synchronous = NORMAL` on pass connections, handler writes in `Store.transaction`

- **Job:** a background pass never makes a live session's audit write or deny fail.
- **Skeptic:** long timeouts are simpler.
- **Answer:** a long timeout does not answer starvation (executed, B7b E-21), and the handler's autocommit writes got no retry at all (executed). [[middleware/context-oracle/docs/architecture-phase-a.md@3da1385:L4927-L4928]] "AD-13). **Between two write transactions the pass releases the write lock for `miner.chunk_gap_ms`**".
- **Guide or gate:** neither.
- **Requirement:** NF-1 and FR-O3 (a lost audit write loses a whisper or a deny), `OL-C3` (the deny stays live during a refresh).
- **Final verdict:** keep. Its claims need R4-3's residue fixed (below): the hold measure includes a checkpoint any `COMMIT` may run.

### M-29. Longest-hold record and `write_hold_exceeded`

- **Job:** a hold long enough to break the handler's wait shows up as a number, not as an unexplained `store_busy`.
- **Skeptic:** another fault code?
- **Answer:** it replaces an unexplained residual (3 `StoreBusy` in 2,310, cause unrecoverable) with a measurement; one fault per pass. [[middleware/context-oracle/docs/architecture-phase-a.md@3da1385:L4937-L4938]] "one `write_hold_exceeded` fault per pass carrying the longest hold and the count of holds over 150 ms".
- **Guide or gate:** neither.
- **Requirement:** `OL-10`, `FR-M2`.
- **Final verdict:** keep.

### M-30. Per-statement rowid-range bounds (20,000 / 500 / 1,000) and the first-try fixture ("`onBusyRetry` never fires")

- **Job:** bound the three statements whose cost grows with rows (rescale, reset, move).
- **Skeptic:** all three statements belong to M-18, M-6 and M-5.
- **Answer:** so they go with them; the first-try assertion is R4-13's zero-failure test over a timing property the same section says is not guaranteed: [[middleware/context-oracle/docs/architecture-phase-a.md@3da1385:L4991-L4991]] "succeed **on its first try** — the adapter's `onBusyRetry` seam never fires".
- **Guide or gate:** neither.
- **Requirement:** none once the statements are cut.
- **Final verdict:** cut. The contention fixture keeps its existing criterion (0 `StoreBusy`, longest hold printed).

### M-31. `reindex.lock` as a SQLite lock database the operating system releases (replacing pid-liveness reclaim)

- **Job:** exactly one reindex or mining pass writes a store at a time, and a killed pass never blocks the next.
- **Skeptic:** a claim row worked before.
- **Answer:** pid liveness failed toward stopping reindexing indefinitely (executed: a stored pid of 1 refused the claim while pid 1 lived); an fcntl lock dies with its process (POSIX, executed on `SIGKILL`).
- **Guide or gate:** neither.
- **Requirement:** FR-K1 (refreshable index), AC-13, and store integrity (FR-M2).
- **Final verdict:** keep.

### M-32. The `(dev, ino)` identity check, `mustExist`, `reindex_lock_replaced`, and the stated residual

- **Job:** a claimant waiting while `deinit --purge` unlinks the lock file does not end up holding a lock on a deleted file beside a second holder.
- **Skeptic:** the document names the design that removes the problem and rejects it for one small file per repository.
- **Answer:** [[middleware/context-oracle/docs/architecture-phase-a.md@3da1385:L4813-L4815]] "*The alternative not chosen:* a lock file that is never unlinked — kept outside the purged directory (for example `~/.ctxoracle/locks/<repo-key>.lock`) — removes the residual and the identity check with it, because the path". The reason against it: [[middleware/context-oracle/docs/architecture-phase-a.md@3da1385:L4819-L4819]] "one file per repository ever initialised; against that, the residual needs". For a solo developer's handful of repositories that is not a cost any requirement weighs, while the chosen design keeps a double-writer residual.
- **Guide or gate:** neither.
- **Requirement:** none for the identity check; it answers F-23 about the purge.
- **Final verdict:** simplify. **Design:** the lock file is never unlinked (kept outside the project directory, or `deinit --purge` deletes everything in it except `reindex.lock`); the identity check, `reindex_lock_replaced` and the residual paragraph go. `deinit --purge` still takes the lock before deleting.

## Part 5 — the indexer (AD-12, AD-25)

### M-33. Grammar usability by reading `scanner.c`, and vendored Lua/Swift WASMs (a patched Swift rebuild, sha256 checked at load)

- **Job:** Lua and Swift get tree-sitter symbols instead of the generic frontend's.
- **Skeptic:** C-6 asks for breadth with no invisible language; the generic frontend already covers every excluded grammar, and the exclusion is now recorded per language. Does anything require these two grammars at the cost of vendoring binaries and carrying a C patch?
- **Answer:** [[middleware/context-oracle/docs/architecture-phase-a.md@3da1385:L4670-L4671]] "**Vendored grammar WASMs are allowed, under provenance and checksum rules**, because two shipped grammars are unusable (AD-12) and neither replacement". The requirement is breadth and visibility: [[middleware/context-oracle/docs/specs/spec-context-oracle.md@3da1385:L540-L542]] "The oracle reads a broad set of languages behind a **language-agnostic interface**, and adding a language is a configuration/extension act, not a redesign." The exclusion recorded with its cause meets it; the finding that drove vendoring was that Lua's exclusion had no visible trace, which `lang_capabilities.exclusion_cause` fixes.
- **Guide or gate:** neither.
- **Final verdict:** simplify. **Design:** exclude Lua and Swift in Phase A with their causes recorded and shown (the scanner reading is kept as the recorded *cause*, not as a usability test run by the build); usability is the repeated-parse test over a stated sample set that includes each grammar's scanner-driven constructs; the loader's per-grammar WASM path stays (it is the C-6 seam), so vendoring is a later configuration act if the exit data show these languages in the owner's repositories.

### M-34. `lang_capabilities`, `file_parse` (`error_tree`/`parse_failed`), the per-language `test_map` capability

- **Job:** the exit data show where the oracle is structurally blind, so a low floor is not read as a quiet repository.
- **Skeptic:** three tables for `status` lines?
- **Answer:** this is the phase goal's "measures its own floor" in storage form: [[middleware/context-oracle/docs/architecture-phase-a.md@3da1385:L1991-L1992]] "language declares a `test_map` capability, shown in `status`**: whether its test files can produce mappings at all". Spec: FR-K1's coverage "measured, not claimed" is the architecture's; AC-17's breadth.
- **Guide or gate:** neither.
- **Final verdict:** keep.

### M-35. `resolution_probes` dependency tracking and the per-language frontend digest

- **Job:** an unchanged importer is re-resolved when a file it probed appears or disappears or its manifest changes, so import edges (Reuse, Consequence, Verification) stay true.
- **Skeptic:** re-index everything on any change.
- **Answer:** specifiers are not stored (AD-19), so a full re-resolution is a full re-parse of every importer on every file add; the executed defects (S1, S2) were stale edges and a lost test map. Recording the probes is the standard build-system dependency record: [[middleware/context-oracle/docs/architecture-phase-a.md@3da1385:L2244-L2246]] "than its own bytes, so re-resolution is driven by dependency tracking:** for each importer the indexer stores every resolution query its resolver made".
- **Guide or gate:** neither.
- **Requirement:** [[middleware/context-oracle/docs/specs/spec-context-oracle.md@3da1385:L605-L606]] "**FR-K1 — Structural index** of symbols/definitions/locations, incrementally refreshable,"
- **Final verdict:** keep.

### M-36. The prose deny-list seed from Linguist (38 suffixes; 2 extension and 12 filename exceptions; pinned Linguist files, generator, sha256 test)

- **Job:** the generic frontend stops presenting code quoted in Markdown as definitions (317 of 424 generic symbols came from `.md`).
- **Skeptic:** a hand list of seven prose extensions would do.
- **Answer:** a hand list has no selection rule ("Numbers without sources don't go in", `CLAUDE.md`), and the exceptions keep `CMakeLists.txt` and `meson_options.txt` symbols, which C-6 protects: [[middleware/context-oracle/docs/architecture-phase-a.md@3da1385:L2061-L2061]] "**38 extensions in all.** Each pattern-less rule the rule meets names one". The rule is one-time generated data; review churn was over counts, not added mechanism.
- **Guide or gate:** neither.
- **Requirement:** P4 (false symbols poison pointers), C-6.
- **Final verdict:** keep.

### M-37. Zone precedence (marker, any-depth `vendor`/`dist`, root-only `build/`, named lockfiles), `.gitignore` match never `generated` alone, non-regular entries skipped, 8000-byte binary test, tokenizer normalize-then-split with FTS5 `ascii`, fallback tables written only under `fallback`, resolver external rules, identifier redaction for both frontends, symbol names stored in full

- **Job:** each removes a checkably false fact (a false `generated` zone flag, a false external classification, a split token the FTS path does not index).
- **Skeptic:** each is a correction; do any add a mechanism?
- **Answer:** no new moving part — they fix rules the architecture already had, each against an executed case: [[middleware/context-oracle/docs/architecture-phase-a.md@3da1385:L1946-L1947]] "**It never sets `generated` on its own:** beside a marker or path signal it is added to that".
- **Guide or gate:** neither.
- **Requirement:** FR-D1 (no checkably false fact), C-6.
- **Final verdict:** keep.

## Part 6 — the event path (AD-23) and the rest

### M-38. The unresolved-`HEAD` (reftable) early-exit reindex child on `SessionStart`

- **Job:** a repository whose refs the event path cannot read is still refreshed at each session start.
- **Skeptic:** git 2.x does not default to reftable; is anyone affected?
- **Answer:** it is the ordinary staleness spawn with a no-op exit when `git`'s answer matches the stored heads, costing one detached spawn (measured p95 about 12 ms): [[middleware/context-oracle/docs/architecture-phase-a.md@3da1385:L4321-L4322]] "10, B8b E-14). **An unresolved `HEAD` is resolved off the event path instead** (R3-2): on `SessionStart` the handler spawns the detached reindex". Without it AC-13's incremental refresh fails for that class, and the only remedy is a command a non-programmer would not know (`OL-11`).
- **Guide or gate:** neither.
- **Requirement:** AC-13 ("append refreshes incrementally"), FR-K7 (the dampening, never a block).
- **Final verdict:** keep, with R4-14's record correction (B8b's two options quoted, the child recorded as a third, a Limitations row for the per-event dampening).

### M-39. `HEAD` resolution through loose refs and `packed-refs`; the global store opened read-only on the event path; the `repo_not_bound` marker's lifetime

- **Job:** the event path reads the right `HEAD` for a worktree, never creates a store on a machine where `init` never ran, and does not leak one marker file per session.
- **Skeptic:** small fixes, or mechanisms?
- **Answer:** each is an executed defect fix with no new moving part.
- **Guide or gate:** neither.
- **Requirement:** FR-K7, D-9 (no stray writes), AC-7.
- **Final verdict:** keep.

### M-40. Coupling renders both directional ratios; Completeness's changed and trigger sets across consumers; the partner-level drop of a not-in-tree or masked partner; bash separators and heredocs as class 3; the fork reseed reading every entry; the `read`-set `rebuild_recovered_nothing`; `correct --missed-question` arming only a single open session

- **Job:** each removes a checkably false or silently dropped fact at a genre's output.
- **Skeptic:** any of these a mechanism added for review's sake?
- **Answer:** no. Each corrects a rule to what its source says, for example the Completeness case: a main agent told "you changed X but not Y" when a subagent changed Y is false, the worst output the spec names: [[middleware/context-oracle/docs/specs/spec-context-oracle.md@3da1385:L187-L188]] "An uncheckable whisper is a rumor and is not emitted."
- **Guide or gate:** guide (whisper content).
- **Final verdict:** keep.

### M-41. The Phase B seam verifies non-attachment on every model call (the returned `session_id` differs)

- **Job:** a Phase B model call never lands inside the owner's session.
- **Skeptic:** Phase B's problem in a Phase A document?
- **Answer:** it is a seam property, one comparison, and it replaces a one-time check that a later Claude Code version could break silently: [[middleware/context-oracle/docs/architecture-phase-a.md@3da1385:L4201-L4202]] "Claude Code version and is a **first-line scrub, never the guarantee**. The Phase B seam **verifies non-attachment on every invocation**: the returned".
- **Guide or gate:** neither.
- **Requirement:** FR-J4 (recursion guard), the phase goal's "clean seams".
- **Final verdict:** keep.

### M-42. The figures' provenance (r3rev scratch-directory citations, the intro's AD-24 fixture claim)

- **Job:** every measured number can be re-run.
- **Skeptic:** R4-11 found the scripts do not run as committed and the claim that each figure names a fixture false.
- **Answer:** most r3rev figures belong to cut mechanisms (rescale, reset, move, pre-check); the ones that stay are the spawn and child costs (M-38) and the yield measurements (M-28, from the settlements, not r3rev).
- **Final verdict:** simplify — delete the figures of cut mechanisms; repoint the remaining ones to `docs/reviews/2026-09-28-architecture-round3-bench/` and make that directory's README build its inputs.

---

## Part 7 — the round-4 findings under these verdicts

Findings text: [[middleware/context-oracle/docs/reviews/2026-09-28-architecture-review-round4.md@3da1385:L27-L27]] "Counts: Critical 0, Serious 3, Moderate 6, Minor 6 (15 findings)."

| Finding | Under the verdicts | Why |
|---|---|---|
| R4-1 (human rows defined by column) | **Survives, narrowed** | The writer-based list (M-13) is still unapplied. Its places shrink to AD-4's list, M-3's copy, M-10's count, M-11, the global store, and AD-24's enforcement test; the pre-check, `export-human`, `import-human` and `--exported` places vanish. R4-1's verb set and its item 6 (an owner removal of a seeded list member is recorded by absence, so the copy must carry every row of any list key the owner touched) apply to M-3's copy. |
| R4-2 (file ids across a rebuild) | **Survives, inside M-3** | The 2026-09-25 build wrote `human_stated` landmines keyed by `file_id` (fact 3), so M-3's copy resolves file references by path. |
| R4-3 (hold measure mixes the checkpoint) | **Survives, reduced** | The reset, the move, the rescale and `import-human` — the four sizes it disputes — are cut (M-5, M-6, M-18, M-9). What remains: any `COMMIT`, the chunk-bounded passes' and the handler's included, may run the automatic PASSIVE checkpoint, so AD-26's "below the waiter's roughly 100 ms first-try window" and the Standards row's "upper bound on what a waiter waits" are not guarantees. Fix: list "a `COMMIT` may run a PASSIVE checkpoint" in AD-23's inventory with a measured bound, and restate the 150 ms line as a recorded target (M-29), not a bound. |
| R4-4 (pre-check scan on the event path) | Disappears | M-4 cut. |
| R4-5 (an interrupted forward migration is unrecognisable) | Disappears | M-2, M-3, M-5 cut; M-3's replacement discards a temporary file and redoes. |
| R4-6 (pad units) | Disappears | M-25 cut; the over-cap preview is a stated, measured limitation. |
| R4-7 (band counts different things per genre) | **Survives, reduced** | The rank's cross-genre ordering goes with M-26. The floor still reads `band ≥ bar.impact_read_min_coupled` with the plan's per-genre `blastRadius` (Orientation: files named; Reuse: `M_X`), which is a genre term in decision-impact under FR-A5 (b) and D-18. Fix: one band definition for every candidate (for example `blastRadiusOf` of the target, the maximum over a multi-file candidate's files), and plan Step 18 corrected to it. |
| R4-8 (`import-human` not idempotent) | Disappears | M-9 cut; M-3's copy reads a file it never writes and redoes from scratch. |
| R4-9 (recompute recording rules) | Disappears | M-4 cut. |
| R4-10 (`import` names no export file) | Disappears | M-11 simplified to a kept backup of each replaced store. |
| R4-11 (figure provenance) | **Survives, reduced** | See M-42: only the figures of kept mechanisms remain to repoint. |
| R4-12 (truncate alternative never weighed) | Disappears | M-6's reset cut. |
| R4-13 (first-try zero-failure assertion) | Disappears | M-30 cut; the fixture keeps 0 `StoreBusy`. |
| R4-14 (reftable record overstates B8b) | **Survives** | M-38 kept; the record and the Limitations row still need the correction. |
| R4-15 (global store has no outcomes) | **Survives, as part of M-3** | The rebuild-beside design must cover the global store (bindings, `tuning` rows from `tune`, `lessons`), or every hook event of a legacy global store stays silent. It is simpler than R4-15's required change (no refusal, pending state or export route for the global store — the same copy). |

Survive: R4-1, R4-2, R4-3 (reduced), R4-7 (reduced), R4-11 (reduced), R4-14, R4-15. Disappear: R4-4, R4-5, R4-6, R4-8, R4-9, R4-10, R4-12, R4-13.

## Part 8 — how much of the diff the verdicts remove

Counted on the inserted lines of `git diff -U0 23f35b9 HEAD` that fall in the HEAD line ranges of the cut or simplified text: [[ran]] a script that collects every `+` line's HEAD line number from `git diff -U0 23f35b9 HEAD -- middleware/context-oracle/docs/architecture-phase-a.md` and counts those inside each range → `added 2854` / `223 schema fingerprint/fwd-migration/precheck/export-human/import-human/purge (AD-4)` / `8 AD-5 import/purge human guard` / `152 AD-13 reweight cases 2-3, marker, rescale, measurements` / `60 AD-13 re-classification` / `33 AD-13 003 reset` / `75 AD-13 epoch grid / rescale rationale` / `29 AD-14 i total order` / `113 AD-16 pad + rank` / `24 AD-12 usability rule + vendoring` / `17 AD-20 export-human/--exported` / `43 AD-24 cases for cut mechanisms` / `21 AD-25 vendoring` / `42 AD-26 identity check + residual` / `21 AD-26 row ranges + first-try fixture` / `10 intro r3rev` / `total 871 30.5 %`.

So about 870 of the 2,854 inserted lines (about 30 %) go. The replacement text (M-3's rebuild-beside rule, M-17's one mined-with rule, M-19's limitation, M-25's limitation, M-32's never-unlinked lock) is on the order of 60–100 lines, so the net removal is roughly 750–800 lines. The ranges are my reading of where each mechanism's text lies; a boundary line or two either way changes the count by a few lines, not the order of magnitude. The other ~70 % of the insertion is corrections of rules that already existed (Parts 2, 4–6 keeps), which this hunt found no requirement-free mechanism in.

## For Max Cogar — questions that are his, in plain language

1. **Already pending, not new:** when the oracle has more to say at one moment than Claude Code will show in full (about 10,000 characters; beyond that Claude sees only the first 2,000 and a file it is not told to open), should it send everything anyway, hold some back, or save the rest for the next moment? Under these verdicts the oracle sends everything and counts how often this happens, and nothing is built for it until you choose. (`OL-C1`, routed through `docs/STATUS.md`.)

No verdict above turns on any other purpose or scope question. The store design protects every note, correction and tuning you entered whether or not you ever used those commands, so it does not need your answer to that.
