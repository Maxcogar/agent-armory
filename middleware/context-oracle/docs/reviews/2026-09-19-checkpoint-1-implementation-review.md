# Expert Review — Context Oracle Phase A, Steps 1–12 (through Checkpoint 1)

*Independent first-round review, dispatched to a neutral general-purpose subagent
per `.claude/skills/expert-implement/references/review-handoff.md` (author does
not grade own work). Base ref origin/main = 5b83fdd; HEAD = f4ec5be; scope =
`git diff origin/main...HEAD -- middleware/context-oracle/ctxoracle/` (95 files).
Written once, never edited.*

## Verdict

**NEEDS FIXES** (7 findings: 3 Moderate, 4 Minor). No Critical or Serious
findings; no correctness bug that breaks the software. Independent state
confirmation by the reviewer (Node v22.22.2): `npm ci` clean, `npm run build`
clean, `npm test` = 41 pass / 0 fail; Checkpoint 1 (§9) criteria met (T-1-1..T-12-1
green under the count-guarded runner; schema 001 STRICT + CHECKs; `tuning` carries
every seed with its `source`).

## Findings

### M1 (Moderate) — `assertProvenance` enforces a weaker FR-X4 gate than the step declares
- File: `src/security/trust.ts:37-48` (and `provCreateValues:70-77`, called by every knowledge DAO).
- `assertProvenance` throws only when human input is written as non-human, or non-human input is written as `'human'`. It PERMITS a non-human input to be written as `'mechanical'` (exercised by `dao_crud.test.ts` writing files/symbols/landmines with `{prov_kind:'mechanical', trust:'mechanical'}` and asserting success).
- Plan Step 6 (1394-1396): assertProvenance is called "so that a non-human-provenance input can only be written as `'untrusted_repo'` (FR-X4)"; Step 9 (1821-1823): "learned-record entry points accept only `trust='untrusted_repo'` unless every input is human-provenance." The code is looser than that. NOTE: the plan's own inline AD-4 schema (the PROV `trust` CHECK, migration 001) includes `'mechanical'`, so the plan prose and the AD-4 schema it cites are themselves in tension; the impl follows the schema.
- Impact: latent — no in-scope caller writes learned records from repo content (miner/indexer/genres are Steps 13+). But repo-derived content could be labeled `'mechanical'` and escape `'untrusted_repo'` treatment once those callers exist, and T-9-1 does not test the non-human→mechanical case.
- Fix: reconcile prose vs schema. Either enforce the plan's stated rule (non-human ⇒ `'untrusted_repo'`, `'mechanical'` reserved for a caller-attested oracle-computed origin validated against `prov_kind`), or amend Step 6/Step 9 prose to match the AD-4 three-value design and add a T-9-1 case pinning which non-human trust each entry point accepts.

### M2 (Moderate) — T-3-3 does not verify the "retry-once-then-succeed" path its §12 spec mandates
- Files: `test/unit/concurrency.test.ts`, `test/unit/concurrency_worker.ts`.
- Worker B signals `B.starting` then immediately runs `transaction()`; the parent writes `A.release` right after seeing `B.starting`, so B races A's release and (A commits within the 100 ms busy_timeout) almost always succeeds on its FIRST `BEGIN IMMEDIATE`, taking no retry. The test asserts only that B eventually commits and C fails open with `StoreBusy`; it never records or asserts that B retried. The retry-then-commit path in `Store.transaction` is exercised by no test (C proves the give-up branch only).
- Plan §12 T-3-3 (7564-7589) specifies a deterministic B — "makes its first attempt while A holds, reports that failure (a marker file), and waits; A is released to commit only after B's report; B is released to retry only after A has exited, so its retry finds the lock free by construction" — with mandatory "**Fails when** B succeeds without a retry being recorded, OR B does not succeed after one retry."
- Fix: implement the §12 sequencing (B reports its first-attempt busy via a marker, parent releases A only after that marker, B's retry then finds the lock free by construction) and assert B recorded exactly one retry before success.

### M3 (Moderate) — three committed files are outside any step's declared `create` list
- Files: `.gitignore`, `test/unit/concurrency_worker.ts`, `test/fixtures/repos/.gitkeep` (verified absent from the plan by grep).
- §5.1 declares its file table authoritative and CLAUDE.md holds strict file discipline. All three are correct and load-bearing (the `.gitignore` re-includes `package-lock.json` and `test/build/`, without which T-1-1/CI break; `concurrency_worker.ts` is the T-3-3 child helper), but the plan under-declared them and none was surfaced as a plan gap.
- Fix: add the three to §5.1 — or, per expert-implement, these are "blast radius beyond plan" that should have been flagged before adding.

### m1 (Minor) — Step 1 fixture generators are trivial placeholders for the deep-scenario fixtures
- File: `test/fixtures/generate.ts:163-190`. ~20 of 27 generators emit a single-commit README repo via `trivial()`, not the scenarios §5.1/Step 1 describe. Consistent with T-1-3 (asserts determinism + no-error only); all deep-scenario consumers are Steps 13–38 (out of scope); deferral documented in the generator and aligned with the "no fake completeness" rule. Reported so a Steps-13+ reviewer knows Step 1's fixture deliverable is partial.

### m2 (Minor) — T-12-1 and T-1-3 validate against the implementation's own constants
- Files: `test/unit/tuning_dao.test.ts:35-42`, `test/unit/generator_determinism.test.ts:26`. T-12-1 asserts the store matches `SCALAR_SEEDS`/`LIST_SEEDS` from the same module `seedDefaults` reads; T-1-3 iterates `FIXTURE_NAMES` from the generator itself — neither can catch drift from the plan. Reviewer manually verified every seed value/source and all 27 fixture names against the plan (match exactly). Fix (optional): assert a few critical seeds against literal values; cross-check `FIXTURE_NAMES` against the §5.1 fixture list.

### m3 (Minor) — T-11-2 weakens the redactor negative case
- File: `test/unit/redact_negative.test.ts:16`. Uses `datadatadatadatadatadata` (~1.5 bits/char) for the "24-character English identifier" case — a degenerate low-entropy string, not a realistic identifier near the 4.0-bit boundary, so it cannot reveal over-redaction of real code.

### m4 (Minor) — interfaces/values the plan did not specify
All necessary and sound, but not in the plan's declared surface: `Store.exec` (adapter.ts); the `scope` parameter on `applyMigrations` (Step 8 declares no global runner; plan signature is `{fts: boolean}`); `oracleExecFileSync` `maxBuffer`; `sha256Short`; the `observed_actions` tool-name sets; the `landmines` in-code dedup key `(kind,file_id,evidence)`; `whisper_audit.deliveredSubjects` using `genre` as the subject. Reported for traceability.

## What the reviewer flagged as good

Single-importer quarantine seams enforced structurally by convention tests
(`node:sqlite`, `node:child_process`); structural non-suppressible provenance
(DB CHECK + compile-time must-fail fixture with zero `@ts-expect-error`);
deterministic git fixtures (pinned config/author/dates); the count-guarded test
runner that turns an empty glob into a red run.

## Recommended priority (reviewer's)

1. M1 (assertProvenance) — reconcile before any Step-13+ learned-record writer.
2. M2 (T-3-3) — restore the §12 deterministic sequencing so the AD-26
   retry-then-succeed path is actually exercised.
3. M3 (undeclared files) — add the three to §5.1.
4. m1–m4 — address opportunistically; m1's real cost lands at Steps 13–38.
