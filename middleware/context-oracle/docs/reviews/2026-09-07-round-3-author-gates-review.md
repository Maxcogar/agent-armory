# Author's compliance review, round 3 — plan-phase-a.md after the round-2 corrections

**Date:** 2026-09-07
**Author of the plan (same person as this reviewer):** the session that re-authored `docs/plans/plan-phase-a.md` and then applied the round-2 findings on branch `claude/context-oracle-plan-fix-zmfuoj`.
**What is being reviewed:** `docs/plans/plan-phase-a.md` as installed in the working tree after the round-2 corrections (7,106 lines; 40 steps; 122 test specifications; D-plan-1…23).
**Inputs closed by this pass:** `docs/reviews/2026-09-07-round-2-collapse-hunt.md` (20 findings: S-1…S-5, M-1…M-8, m-1…m-7) and `docs/reviews/2026-09-07-round-2-expert-review.md` (29 findings: C1, S1…S5, SY1, M1…M11, m1…m11, tentative T1–T2).
**What this review is not:** the independent round-3 collapse-hunt and expert-review, which are dispatched to fresh subagents after this file is written and review the entire document.
**Why it exists:** Max Cogar requires the author's Gate A/B/C walk after each correction pass and before any review, and requires that findings be treated as leads for a full re-derivation, not as a fix list. This file records, per finding, where the correction landed, what it re-derived, and what check established it — and, separately, the author's own regression check on the corrections.

---

## 1. Closure of the round-2 findings

The two reviews overlap; each row names both IDs where they coincide. "Re-derived" lists the sections that had to change beyond the finding's own location.

| Finding | Where closed | Re-derived | Check that establishes it |
|---|---|---|---|
| CH S-2 / ER C1 — must-fail fixtures inside the project build | Step 1: `"exclude": ["test/build/fixtures"]`; `test/build/tsc_fixture.ts`; per-fixture `tsc --noEmit` | D-plan-3, §10A D-plan-3, §12 intro, T1-1, T9-2/T11-5/T24-1 level lines, §5.1 | Executed both ways 2026-09-07 (§11.4 entry) |
| ER S1 — fixtures and harness created after their consumers; false §9 attestation | Generator + transcript fixtures → Step 1; harness + `dispatch.ts` + `hook` verb → Step 28; Step 38 keeps the acceptance tests | §7 intro, §9 (Checkpoints 1–4 rewritten), D-plan-1, D-plan-17, D-plan-18, §10A D-plan-1, Steps 18/25/26/27 Verification ("at Checkpoint 4"), Step 31/32 verb registration, Step 37 dependency list, §2.3, §5.1 annotations, T1-3 | Reconciliation script: every Verification T-ID's file is created at or before its step (T-ID ↔ §5.1 ↔ step); no step names a later one |
| ER SY1 — convention tests contradicted by the plan's own modules | Step 24: branded internal `DenyVerdict`, `types/hook_response.ts`; Step 20: `deliverStop` returns an internal object; Step 28: adapter is the only wire-field site; Step 10: T10-3 re-derived as the writers-only import scan with an allow-list enumerated from §5.1 | T24-2 (importer set only), T24-3 (new), T28-2, T20-2, T10-3, §5.1 (`types/`, conventions), §2.3, AC-2 row, Q40 | Read of every module a step creates under `dist/src/hook/**` and `dist/src/blocks/**` against the three tests' sets |
| CH S-1 / ER m5 — marker basename `ctxoracle` never written | Step 31 item 4: command = `"<execPath>" "<realpath argv[1]>" hook <event>`; pattern on `dist/src/cli/dispatch.js`; `init` prints it | D-plan-6, §10A D-plan-6, T31-1 (three invocation modes), T32-1, Q35 | Executed under direct `node`, symlink shim, `npx`, `npm install -g --prefix` (§11.4) |
| CH S-3 / ER S4-adjacent — leg 1 mounts the whole transcript | Step 39 leg 1: per-event transcript prefix | D-plan-10, §10A D-plan-10, R8, Q38 | Read against IDEAS.md #14 lines 94–97 |
| CH S-4 / ER S4 — floor number has no denominator | Step 39: seeded labelled sample under OL-C5's rule, published; recall + precision with N; leg 2 re-asks and corrections as ground truth | D-plan-10, §10A D-plan-10, report field list, §12.4 Step 39 row, Q37 | Read against collapse-log 2026-08-25 item 1 |
| CH S-5 — scrub never executed as shipped; over-broad | Step 5: `SCRUBBED_ENV` = six session-identity variables; Step 36 contract; T5-2 | D-plan-8, §10A D-plan-8, §16 item 5, Q36 | Executed three ways (§11.4): unscrubbed → parent id; six removed → fresh id; all removed → fresh id |
| ER S2 / CH M-5 — three AD-17 detectors unscheduled; AC-9/AC-13 rows false | Step 28 (liveness row; `produced_but_undelivered`), Step 14 (`index_stale`), Step 33 (`hooks_not_firing` with `diag.hooks_not_firing_gap_s`) | T14-2, T28-4, T28-5, T33-4 (new); T16-1 staleness cases; §12.4 AC-9/AC-13 rows; Step 12 seed; D-plan-7; G1 | Reconciliation script (new T-IDs in §5.1, steps, tables) |
| ER S3 / CH — regret population narrowed | Step 30: store-held facts incl. never-triggered; `never_triggered` label | T30-1, AC-24 row, Q42, §5.1 fixture note | Read against spec FR-L4 649–655 and AD-18 1301–1307 |
| ER S5 — proxy listener cannot observe egress | Step 32: `T32-3` structural scan; `T32-2` runs under `unshare -rn`; T38-22 same | D-plan-23, §10A D-plan-23, AC-11/AC-19 rows, Q39 | Executed: listener never contacted with or without `NODE_USE_ENV_PROXY`; `unshare -rn` gives `EAI_AGAIN` (§11.4) |
| CH M-1 / ER (M5 of round 1 residue) — clear floor 40 | Step 12: floor 2; T23-2, T38-30 ("No.") | D-plan-7, §10A D-plan-7, G1 | Read against FR-B5 438–439, P3 137–138, AD-9 781 |
| CH M-3 / ER M1 — deferral "opening clause" | Step 23: sentence-level discard, any position; T23-2 cases | Step 26 predicate, T26-1, D-plan-19, Q41 | Read against AD-9 781–782, FR-B1 367–369 |
| CH M-2 — restraint tests assert a list | T23-1 rule-complement corpus; T23-2 signature carries no question text; T18-8 paraphrase corpus | D-plan-19, §10A D-plan-19, R1 | Read against collapse-log 2026-09-03 round 8 lesson 2 |
| CH M-4 — `T5-3` greps one spelling | Step 5 + T5-3: import scan, both specifiers | D-plan-14, §10A D-plan-14 | — (specification change; executed nothing) |
| CH M-6 — fixed timestamps vs wall-clock horizon | Step 13: reference instant = `HEAD` commit time; T13-1 data pinned | Step 16 (age measured from the same instant) | — |
| CH M-7 / ER M10 / ER m9 — leg 2 owner-run, option set, spawn hazard | Step 39 leg 2: two named repositories with a deterministic replacement rule; agent-driven via `exit-run.sh` with the `CTXORACLE_*` check; owner path = `export`; three-session minimum; validity rule consistent | D-plan-10, D-plan-11, §10A D-plan-11, R13 (new) | `list_repos` dates (§11.4) |
| CH M-8 — L11(a) reportable from a remote corpus | Step 38/39: marker table keyed by origin; L11(a) *verified* only on an owner-local interactive transcript | D-plan-11, §16 item 5, T38-32 | Read against AD-24 1602–1606, V12 |
| CH m-1 / ER m1 — narration | §7 intro wording; D-plan-1 "earlier order" sentence removed; §14.4 rewritten as a pass record | — | Grep for the removed sentences: 0 hits |
| CH m-2 — `questions` has no provenance block | Step 22 `openQuestion` signature; Steps 25/34; T25-1 | — | Read against AD-4 460–468 |
| CH m-3 / ER M2 — "concluding position" undefined | Step 18 definition; T18-8 | — | — |
| CH m-4 / ER M6 — env-gated test hooks; timing-dependent tests | Step 29: injected clock + `--deadline-ms`; T29-1, T29-3 (new); T28-3 corrupted store; T3-3 start offsets | D-plan-22, §10A D-plan-22, Step 28 verb signature | — |
| CH m-5 — `ORDER BY <pk>` undefined | D-plan-4: every column in schema order for the five pk-less tables; FTS by `MATCH` results; Step 7 note | §10A D-plan-4, T32-2 | Read of AD-4's rows |
| CH m-6 / ER M7 — no cold-container CI job | Step 1: `cold-container` job; Step 38 script text; T38-25 | §2.3, D-plan-13 unchanged | — |
| CH m-7 — `tuning_missing` undefined | Step 6 code list; Step 12 impact; T6-1 | Q30 wording unchanged (still accurate: the plan-named codes are listed in Step 6) | — |
| ER M3 — shared types have no creating step | Step 6 creates `types/events.ts`, `candidate.ts` (incl. `Pointer`), `index_types.ts`; Step 24 creates `types/hook_response.ts` | §5.1, Step 24 Dependencies | Reconciliation script (§5.1 ↔ step) |
| ER M4 — keying-mode detection unimplementable | Step 31 item 2: candidate keys under every applicable rule | T31-3 | — |
| ER M5 — settings-file mechanics | Step 31 item 4; Step 32 `deinit`; T31-1 (no-file case), T31-2 scope, T32-1 | AC-7 row | — |
| ER M8 — no verb for the detached `quick_check` child | Step 32: `hook integrity-check`; T32-4 | §5.1, Step 28 item 4 | — |
| ER M9 — §2.3 omits CLI surface and packaging | §2.3 two new rows | — | Read against architecture in-scope list 71–73 |
| ER M11 — DDL and DAO surface deferred | Step 7 full DDL; Step 8 DDL; Step 9 method table | T7-1 unchanged (already per-CHECK) | Read of AD-4/AD-5 rows against the DDL |
| ER m2 — §12.3 entries lacked Level/Real-doubles | Every T38 entry carries both | — | Script: 0 entries without `**Level.**` |
| ER m3 — fourth wrongful-deny component unrecorded | D-plan-20 + §10A entry | — | — |
| ER m4 — Step 15 claims without §11 | §11.4 entries (package `files`/`out`, `import.meta.resolve`, `.d.ts` read) | — | Executed / read (§11.4) |
| ER m6 — AC-13 staleness untested | T16-1 cases; AC-13 row | — | — |
| ER m7 — T38-26 clause cannot fail | T38-26 asserts no writes and no process across the gap | — | — |
| ER m8 — exit report location unrecorded | D-plan-21 + §10A entry | — | — |
| ER m10 — §5.1 annotations; runner range | Annotations on generator, runner, fixture dirs; Step 38/Checkpoint 4 ranges exclude the three scripts | §12.4 Step 38 row | Reconciliation script |
| ER m11 — `decideDeny` receives no tool input | Step 25 signature; T25-3 | — | — |
| ER T1 — planning-tool run unverifiable | `docs/reviews/2026-09-07-plan-tool-traces.md` (the captured CodeGraph and Clear Thought stdio logs) | §11.6 unchanged | The file is in the tree |
| ER T2 — floor behaviour executed only on 22.22.2 | Unchanged: the plan assigns the floor to CI's matrix entry (Q28, §11.4) | — | — |
| CH D-plan-17 note — `T25-3` hold clause tautological | T25-3 re-scoped to `decideDeny`'s own properties; hold pinned by T28-1/T38-4 | D-plan-17 | — |

Every round-2 finding maps to a row above. No finding was declined.

---

## 2. The author's regression check on the corrections

Max Cogar's rule: two consecutive rounds in which the corrections themselves introduce defects means stop and diagnose externally. Round 2 found ten regressions from the rewrite. This pass therefore checked the corrections for the classes those regressions had:

- **A test that cannot pass on a plan-conformant build** (round-2 C1, SY1). Check: every convention test's allow/deny set was re-read against the modules §5.1 places in its scope (T3-2, T5-3, T10-3, T24-2, T28-2, T32-3, T36-1). T10-3's allow-list names the four §5.1 readers; T28-2's field list is satisfied because `hook_response.ts` is type-only and `deliverStop` returns an internal object; T24-2 and T28-2 no longer make claims about the same string.
- **A premise asserted from a command that differs from the design's** (round-2 S-5). Check: every new §11.4 entry names the command executed; the scrub, the argv resolution, the tsc exclusion, the proxy behaviour, and `unshare` were each executed by this author before being written.
- **A mechanism that measures the harness instead of the system** (round-2 S-3, S-4). Check: leg 1's transcript prefix and the labelled sample were read against IDEAS.md #14 and collapse-log 2026-08-25 item 1.
- **A dependency inversion introduced by moving artifacts** (round-2 S1). Check: the reconciliation script's Dependencies-only-earlier rule and the T-ID ↔ §5.1 ↔ step reconciliation both pass; Step 31's and Step 32's verb registration depends on Step 28; Step 24 depends on Step 6 for the shared types; Step 37's dependency list includes 29 and 32.
- **Counts and ranges drifting** (round-2 m10). Check: §5.1 test files 57/4/6/51 match Step 37's statement and the script's tier count; D-plan headings 23 in §10 and 23 in §10A; every "at Checkpoint N" mention names 4 or 5.

What this check cannot see: a semantic contradiction between two prose sentences that the script does not parse. That is the independent reviewers' job.

---

## 3. Gate A/B/C — items re-walked for the changed content

- **Gate A1 (no open choice).** The three places round 2 found option sets or deferred choices (leg 2's repository phrase, `init`'s command string, the DDL) now state one value each; the Step 39 replacement rule is deterministic. Grep for the deferral vocabulary over §7: 0 hits.
- **Gate A2 (reviewer can check a build).** New tests T1-3, T14-2, T24-3, T28-4, T28-5, T29-3, T32-3, T32-4, T33-4 each carry the six fields and a failure condition; the §12.3 entries each carry Level and Real/doubles.
- **Gate B (auditable from the document).** New decisions D-plan-20–23 carry reasoning and a §10A collapse-test; the new §11.4 entries carry the command and output; Q33–Q42 are closed with pointers; §14.4 records three passes with the last adding zero.
- **Gate C (checklist).** Every step still has the six fields (script: 40/40; Steps 8 and 40 remain trivial with the reason stated); no narration of review rounds remains in the plan body (the only "round" strings are collapse-log citations); every §12 `File.` path resolves in §5.1 (script: 0 misses); every cited AD/V/L/FR/AC/D/OL key resolves in its source (script: 0 misses).

---

## 4. Rule-2 collapse test on the decisions this pass added or changed

- **D-plan-20, 21, 22, 23** — each carries its §10A entry (job, hardest question, cited answer, steers-toward).
- **D-plan-6 (changed).** Hardest question: *"`npx` installs into a cache that npm may prune; the command `init` wrote then points at nothing."* Answer: `init` prints the command it wrote, so an `npx`-mode install is visible; AD-25 sanctions `npx` and the plan does not hide its cost — a pruned cache breaks the hook loudly (`hooks_not_firing` flags the session at the next `status`), which is the OL-10 direction. Guide, not gate.
- **D-plan-10 (changed).** Hardest question: *"The implementing agent labels the sample and the implementing agent built the recognizer — the independence is nominal."* Answer: the label rule is OL-C5's definition, written before labelling, and the label table is published so Max Cogar or a later session can re-score it; the recognizer's rule (`?`-terminated) is mechanically different from the label rule, so the two cannot agree by construction. Guide, not gate.

---

## 5. What this review cannot establish

- It is the author's read, after the author's corrections. The round-3 independent passes review the whole document with no knowledge of this file's claims.
- The 22.16.0 floor is still executed only by CI's matrix entry.
- The reconciliation scripts parse the document's conventions; a semantic contradiction between prose sentences is invisible to them.
