# Author's compliance review, round 5 — plan-phase-a.md after the round-4 corrections

**Date:** 2026-09-07
**Author of the plan (same person as this reviewer):** the session that re-authored `docs/plans/plan-phase-a.md`, applied the round-2, round-3 and round-4 findings, and — after round 4 reported correction-induced defects for the second consecutive round — stopped again, diagnosed the second failure, and extended the mechanism in this project's own copy of the expert-plan skill before applying anything.
**What is being reviewed:** `docs/plans/plan-phase-a.md` as installed in the working tree after the round-4 corrections (40 steps; 122 test specifications; D-plan-1…28; Q1…Q52; §14.4 passes 1–7).
**Inputs closed by this pass:** `docs/reviews/2026-09-07-round-4-expert-review.md` (20 findings: S1…S6, SY-1, M1…M3, m1…m11; tentative T1…T3) and `docs/reviews/2026-09-07-round-4-collapse-hunt.md` (22 findings: S-1, S-2, M-1…M-8, m-1…m-12; the section-(b) items N-A…N-M map onto them). Together: 42 findings.
**What this review is not:** the independent round-5 collapse-hunt and expert-review, dispatched to fresh subagents after this file is written. Round 5 is the last round Max Cogar's rule allows ("stop at 5 rounds without convergence").
**Why it exists:** Max Cogar requires the author's Gate A/B/C walk after each correction pass and before any review.

---

## 1. The second stop, and what changed before this pass

Round 3 found defects introduced by the round-2 corrections; round 4 found defects introduced by the round-3 corrections (15 regression-tagged findings in the expert review, 11 in the collapse-hunt). That is the second consecutive round, so the loop stopped a second time. The diagnosis is the reviewers' own systemic finding (ER SY-1, CH S-1): every mechanical check introduced after round 3 measured a *proxy* of the property it was added for — backticked paths for module consumption, string presence for a rule's scope, three idle runs for determinism, hand-written case tables for a rule's behaviour — so the checks passed while the properties did not hold. The fix, again external and again general, is in `.claude/skills/expert-plan/` (this project's copy; nothing outside `middleware/context-oracle/` was changed — a first attempt that housed it in the shared plugin was reverted on the owner's instruction):

- **Consumption is checked by name, not by path.** `provides:` carries the exported names later steps call; a bare call-shaped identifier used by two or more steps must be provided by one of them, and a step may use only what it or a declared or transitive dependency provides. Run on the round-4 text, this reported the hollow `depends_on` lists at 32 steps (CH S-1 / ER S1) as errors; the current text declares them (one step depends on `S1` alone: Step 2, which consumes nothing else).
- **Forward action items are errors.** An action item that names a later step ("Step 32 adds the verb") fails the check; the `index` verb Step 28's handler spawns is provided by Step 28 (ER S2 / CH M-2 class).
- **Probes prove scope, not presence, and run under load.** A probe may assert a sentence inside the section that governs it (probe 13 asserts each hooks-reference sentence under its own heading); `run-plan-probes.mjs --repeat N --load K` re-runs every probe N times with K CPU-bound siblings, and a probe whose output depends on timing fails there (probe 07 did, and was rebuilt on marker-file signalling before the T-3-3 text was written). The gate in CI runs the probes; the author's run for this pass is `--repeat 3 --load 2` and `--repeat 2 --load 2`, both exit 0 (recorded in the session; the CI job re-runs them on the pull request).
- **Re-derivation is a listed checklist.** `derive-plan-sections.mjs <plan> --impact <rev>` lists every step whose text changed since `<rev>` and every authored surface that restates it (register entries, decisions, checkpoints, sentences in other steps, §3 rows). Run against the round-4 text it listed 37 steps and 671 lines; each line was read against its step before this file was written (§14.4 pass 6).
- **The self-check grew with the contract:** 34 checks (`--self-check`), including negative cases for every new constraint.

The scope rule that bounds all of this is recorded in `docs/collapse-log.md` (2026-09-07, "Standing lesson").

---

## 2. Closure of the round-4 findings

Each row names both reviews' IDs where they coincide. "Re-derived" lists the sections that had to change beyond the finding's own location. "Check" names what establishes the closure now — a mechanical check, a probe, or a read.

| Finding | Where closed | Re-derived | Check |
|---|---|---|---|
| ER S1 / SY-1 / CH S-1 / N-A — `depends_on` hollow at 32 steps; consumption by name invisible | Every step's `depends_on` re-derived from what its text consumes; `provides:` carries exported names at 26 steps (was 7); the build-order check resolves bare call-shaped identifiers | §5.1 (generated), §12.4 (generated), Checkpoints | `--check` (fails on the round-4 text with the extended rule; passes now); `--impact 6a2159b` walk |
| ER S2 — Step 28 consumes Step 30's fold and regret proxy; `recordRegret` unwired | Step 30 declares `modify:` on `src/hook/handler.ts` and `src/index/indexer.ts` and wires both; Step 28's pipeline names only Step 28-or-earlier artifacts | Checkpoint 3; §5.1 | `--check` (forward action item rule) |
| ER S3 / CH M-2 / N-D — T-14-2 specifies a spawn Step 14 no longer performs; handler spawns Step 32's verb | T-14-2 re-derived ("records `index_stale`, sets the flag, spawns nothing"); Step 28 creates `src/cli/index.ts` and provides `ctxoracle-index`; T-28-5 extended to the observable (`.reindex.lock`) | Step 32's verb list; §12.2 | `--check`; read of T-14-2 against Step 14 |
| ER S4 / CH M-6 / N-H — acknowledgement lexicon and bare `later` hold on direct answers | D-plan-24 re-derived: phrase-strip-then-floor, multi-word stoplist phrases only, no lexicon, no clause grammar; reasons `below_length_floor` / `deferral_only`; Step 26's exclusion covers `deferral_only` only | Step 23, T-23-2 (23-case table), T-38-30, Step 26, §10A D-plan-24, §11.4, Q41, Q46 | `probe:16_clear_rule_cases` (23 cases); traces-3 chain |
| ER S5 / CH S-2 / N-B — leg 2's trust premise inverted; counted sessions on a clone a remote session cannot have; transcripts never moved | D-plan-26 re-derived: counted sessions are `claude -p` conversations the implementing agent drives from its own environment on clones it initialised beforehand; collection is local; a counted session must hold a liveness row; L11(b) recorded *not performed* where the `-p` harness gives no injected turn | Step 39 (leg 2 protocol, validity rule, owner sessions listed separately), D-plan-10, D-plan-11, §10A D-plan-26, §11.4 hooks entries, Q22, Q43 | `probe:13_hooks_reference.optional` (section-scoped); traces-3 chain |
| ER S6 / CH M-1 / N-C — T-3-3's schedule timing-dependent; probe failed in-session | T-3-3's schedule forced by observables (each child proceeds only after the previous child's reported state); the probe implements the test's own signalling (marker files) | §11.4 claim; Q46 | `probe:07_sqlite_busy_schedule` under `--repeat 5 --load 3` and `--repeat 3 --load 2` |
| ER M1 / CH m-9 / N-K — detectors read per-turn classifications the store never holds | D-plan-27: `classified_turns` table (Step 7 DDL), DAO (Step 9), written by Step 25's catch-up, read by Step 26's detectors; T-26-1 cross-event case | §10, §10A, Step 9 DAO table, §5.1 | `--check` (DAO path declared, name provided); read of Step 26 against Step 25 |
| ER M2 / CH m-8 — `locate.ts` reads `transcript_path` / records `agent_transcript_path`, names on T-28-2's list | `locate.ts` exports `locateTranscript(ev)` reading `ev.transcriptPath` and `projectTranscriptDir(cwd)`; no `agent_transcript_path` outside the convention list | Step 21 provides; Step 33 | Grep of both names (only in the T-28-2 scan list) plus read of Step 21 |
| ER M3 / CH M-3 / N-E — seven steps modify earlier files with `modify: []` | Steps 27, 30, 31–35 declare their `modify:` paths | §5.1 (generated), §16 item 7 | `--check`; `modify: []` count 30 of 40 |
| CH M-4 / N-F — `large-store` declared as a Step 1 fixture repository | D-plan-5 amended: a store built by Step 29's `test/fixtures/generate_large_store.ts` through the real migrations and DAOs; T-1-3 covers repositories only | Step 29, T-29-1, D-plan-5, Q52 | `--check` (path declared at S29); traces-3 chain |
| CH M-5 / N-G — four §11.4 entries describe runs their probes do not perform | The four entries re-derived from the probes' recorded outputs (02: `sqlite_version 3.51.2`, the FTS5 and `VACUUM INTO` results; 06: the `argv[1]` realpath; 10: the JSONL tail; 15: the three scrub runs and the 43-variable count) | §10A D-plan-8 | Read of each entry against `expected/<probe>.txt` |
| CH M-7 / N-I — FTS5 fallback unbuildable | D-plan-28: conditional `001b_phase_a_fts.sql`, always-created `symbols_name`/`files_path`, one `src/index/search.ts`; T-7-1 both flags, T-14-1 same hit set | Step 7, Step 14, Step 18 (callers), Step 31 (`init`), Q51 | `--check` (`search.ts` declared, names provided); traces-3 chain |
| CH M-8 / N-J — floor sample pools legs | Sample drawn and reported per leg, labelled blind before replay (D-plan-26) | Step 39 floor table; Checkpoint 5 | Read of Step 39 |
| ER m1 / CH m-1 — T-38-25 says Step 1's job | "the `cold-container` job Step 38 adds" | — | Grep ("invoked by Step 1": none) |
| ER m2 — §7 overview places watchdog/guard in Steps 28–30 | Overview names Step 10 for the writers with the watchdog and guard and Step 29 for their verification | — | Read of §7's overview |
| ER m3 — Step 10 covers PA-5 only while §2.3 maps PA-9 to it | Step 10 `covers: [PA-5, PA-9]`; §2.3 row generated | §2.3 | `--check` (coverage table generated) |
| ER m4 — T-23-2 "three seeded lists and a string" | "two lists and a number" | — | Grep (phrase absent) |
| ER m5 — convention test text contradicts its narrowed list | One list; the test scans "every identifier in the convention list above" | — | Read of Step 28 |
| ER m6 / CH m-3 — negation clause untested | T-18-8 carries negated negatives ("isn't finished.", "I haven't fixed it.") and a positive with the negation in an earlier sentence | — | Read of T-18-8 |
| ER m7 — network policy stated two ways | Stated once in Step 38 ("the default runner network"); T-38-25 cites it | — | Grep (the second phrasing absent) |
| ER m8 — `status` cannot read the pinned interpreter | `schema_meta.pinned_interpreter` written by `init`, read by `status` | Step 7 DDL, Step 31, Step 33, T-33-4 | Read of the three steps |
| ER m9 — lexicon members labelled `architecture_default` | The command-class and completion lexicons are `plan_seed` lists; the one list-valued `architecture_default` key is `index.ext_to_grammar` | Step 12; D-plan-7 | Read of Step 12 against AD-15 |
| ER m10 / CH m-6 — slug rule unstated; second module knows the layout | `projectTranscriptDir(cwd)` in `locate.ts` (realpath, `/`→`-`); `status` calls it | Step 21, Step 33, §11.4, Q50 | Read; §11.4 observation |
| ER m11 — Q22 not re-derived | Q22 re-derived (agent drives every counted session; owner sessions additional, listed separately) | — | Read against D-plan-26 |
| CH m-2 — §10A D-plan-13 steers toward the old tiers | "Both tiers on every pull request from the step the first replay test exists" | — | Read |
| CH m-4 — T-38-22 has no refused-`unshare` branch | T-38-22 carries T-32-2's condition and its recorded-as-not-executed branch | Q49 | Read |
| CH m-5 — Step 6 and Step 12 disagree on the missing-tuning fallback | Step 6: `TuningReader` re-seeds the key from its seed module and records `tuning_missing` | — | Read of both steps |
| CH m-7 — `.sql` delivery unspecified | Shipped in `src/` (Step 1's `files` list), resolved from `import.meta.url` | D-plan-28 | Read |
| CH m-10 — replay tier cost unquantified; no CI cache | `large-store` rebuilt per CI job, build time printed by T-29-1; the replay tier's wall time and that number are read from the run's log into the exit report (Step 38); no number assumed | Step 29, Step 38, D-plan-5 | Read |
| CH m-11 / N-L — §16 lacks the file-list reconciliation | §16 item 7 | — | Read |
| CH m-12 — T-16-1 varies `index_head` against `HEAD` | T-16-1 varies `ctx.indexStale` | — | Read of T-16-1 |
| CH N-M — referents moved under unchanged sentences | Every surface `--impact 6a2159b` listed was read against its step (§14.4 pass 6) | — | The impact list |
| ER T1 — probe 14 verified `main`, not the 22.16.0 tag | Probe 14 fetches the `22/bookworm` Dockerfile at `nodejs/docker-node` `d073523…` (`NODE_VERSION 22.16.0`); §11.4 and Q45 re-derived from its output | Step 38 | `probe:14_docker_node_git.optional` |
| ER T2 (carried) — Node 22.16.0 floor | Unchanged: executed by CI's matrix entry (Q28) | — | — |
| ER T3 — `unshare -rn` on the runner | §11.4 records the runner's refusal (the `check-plan` job's run of probe 09); T-32-2 and T-38-22 record it instead of failing; Q49 | Step 32, Step 38 | The CI job's log; Q49 |

Every finding in both reviews appears above; none was deferred.

---

## 3. The author's regression check on the corrections

What the mechanical checks establish, run on the reviewed text:

- `derive-plan-sections.mjs --check`: 40 steps, 13 elements, 122 test specifications, 17 probes cited, regions current; every dependency earlier than its dependent and derived from consumption; every backticked path and every bare call-shaped identifier resolving to the step or a declared/transitive dependency; no action item naming a later step; no path under a created directory that no step declares; every probe cited and every citation resolving. Exit 0.
- `derive-plan-sections.mjs --self-check`: 34 checks. Exit 0.
- `run-plan-probes.mjs --repeat 3 --load 2` (before this file) and `--repeat 2 --load 2` (on the reviewed text): every probe matches its recorded expectation on every run; the optional ones skip only where their environment is absent. Exit 0.
- `derive-plan-sections.mjs --impact 6a2159b`: 37 steps changed; each listed surface read (§14.4 pass 6).
- Trace coverage: every D-plan-1…28 has a chain in one of the three trace files (D-plan-1, 3, 7, 9, 11, 12, 14 and the first chains of 6, 8, 10 under the `D1`…`D10` tags of the first file; the rest in the second and third).
- `tools/check_docs.py`: passed (review files unedited; STATUS rewritten in the same change).

What this check cannot see — and what the reviewers are asked to walk: a prose contradiction no declaration carries; a mechanism that measures the harness instead of the system; a re-derivation that is wrong in substance (D-plan-24, D-plan-26, D-plan-27, D-plan-28 and the D-plan-5 amendment are the four places this pass reasoned rather than reconciled).

---

## 4. Gate A/B/C — items re-walked for the changed content

- **Gate A1 (no open choice).** The clear rule is one algorithm with two reason codes; leg 2 names the session kind, the driver, the setup step, the collection and the validity precondition; the FTS fallback names the migration, the flag, the indexes and the interface; the `large-store` names its builder, its location and its cache rule. No "or" survives in a step.
- **Gate A2 (reviewer can check a build).** Every test the corrections touched carries its six fields and a failure condition: T-3-3 (observable-forced schedule), T-14-2 (no spawn), T-16-1 (`ctx.indexStale`), T-18-8 (negated cases), T-23-2 (23-case table), T-26-1 (cross-event case), T-28-5 (`.reindex.lock`), T-29-1 (store build), T-7-1 and T-14-1 (both FTS flags), T-32-2 and T-38-22 (refused-`unshare` branch).
- **Gate B (auditable from the document).** Generated tables from the declarations; the build-order property from the declarations; each executed claim from its named probe with its recorded output; each new or re-derived decision from D-plan-24…28 with its §10A entry and its traces-3 chain.
- **Gate C — narration.** The plan describes the current design; the sweep record (§14.4) records passes as passes; D-plan-24's reasoning states which rules hold on answers as executed facts, not as attempts.
- **Gate C — counts.** Lists are their own counts; the sweep record's "37 steps" is the `--impact` report's number.
- **Gate C — every §11 execution reproducible.** Every "Executed" sentence in §11.4 cites a probe or names the CI run that produced it (the runner's `unshare` refusal: run 34151517903).

---

## 5. Rule-2 collapse test on the decisions this pass added or re-derived

D-plan-24 (phrase-strip-then-floor), D-plan-26 (`claude -p` sessions the agent drives), D-plan-27 (`classified_turns`), D-plan-28 (conditional FTS migration) each carry a §10A entry with the job in mission terms, the hardest skeptic question, the cited answer, and the guide-not-gate confirmation; D-plan-5's amendment is covered by its existing entry. The hardest questions the author could write are there; the independent collapse-hunt attacks them harder and hunts for the ones missing.

---

## 6. What this review cannot establish

- Behaviour at the Node 22.16.0 floor (CI's matrix entry; unchanged since round 2).
- Whether the ≈400 MB `large-store` build is practical per CI job; the plan states no number and Step 38 reports the measured one.
- Whether a `claude -p` conversation driven by the implementing agent exercises the block on the owner's code the way an interactive session would; D-plan-26 reports the two legs separately for that reason.
- The soundness of the Clear Thought chains: the trace files show every decision reasoned through the tool with its constraints and options; whether the reasoning is sound is the reviewers' judgment.

**Round-5 arithmetic the reviewers test.** The expert-review series' tripwire fires if round 5's new + regression count ≥ its closed count (42) or its total ≥ 20. Max Cogar's rules: a round-5 correction-induced defect count above zero means the second replacement did not hold either; round 5 is the fifth round, so a round that does not converge ends the loop.
