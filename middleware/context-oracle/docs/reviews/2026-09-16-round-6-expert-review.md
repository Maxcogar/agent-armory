# Round 6 — Independent Expert Review of `docs/plans/plan-phase-a.md`

**Date:** 2026-09-16
**Reviewer role:** Independent expert reviewer (did not author or review any prior round of this plan).
**Artifact under review:** `middleware/context-oracle/docs/plans/plan-phase-a.md` (10,025 lines), the Phase A implementation plan, at its 2026-09-11 revision. This is the round-6 final gate before the plan becomes the build contract for `/expert-implement`.

**Scope and what I executed.** I applied the `anthropic-skills:expert-review` discipline: judge against established engineering practice (not against repo patterns), and verify every load-bearing factual premise against current primary sources *by execution* — not from the plan's recorded evidence, not from a prior round's "verified" mark, not from memory. I read the whole plan (all 40 steps, §1–§16, the §10A decision collapse-tests, the §11.4 execution evidence, and the §12.1/§12.3/§12.4 test specifications), plus the spec's authoritative sections (§11.5 build order, §12 judgments, §13 open items, §14 acceptance criteria), STATUS.md, and CLAUDE.md's three dominating rules. In a scratch temp directory (`mktemp -d`, never the repo tree) I: installed the exact D-plan-2 pins and independently loaded all 36 tree-sitter grammars in a different order than the plan's probe, compiled a TypeScript file importing `web-tree-sitter` with and without `@types/emscripten`, ran my own reindex-claim-row race harness (200 iterations, then 250 under CPU load), and independently reproduced the `node:sqlite` feature set, the `git rev-parse`/`git log --numstat -M` behaviors, the `npm ci`-without-lockfile refusal, and the FTS-migration sequence. I ran all three of the plan's own gates (`run-plan-probes.mjs`, `derive-plan-sections.mjs --check` and `--self-check`, `tools/check_docs.py`) and read the source of the critical probes to confirm each tests its load-bearing property. Every load-bearing claim I was asked to attack — including the two decisions STATUS.md flagged as never independently attacked on their final text, **D-plan-2** and **D-plan-32** — was confirmed by my own execution. **This review returns PASS: zero findings of any severity.**

---

## Scope and Inventory

Round number: **6** (post-fix in the project's numbering; my own first independent pass over this artifact). Per the expert-review Post-fix rule, the inventory below is the artifact under review plus its validation references (spec, architecture premises cited in the plan) plus the probe corpus that carries the plan's executed evidence.

### Tool plan (instruments and claim-type mapping)

- **Execution / reproduction** (behavioral, library-behavior, and literal-content claims that rest on execution): `node` v22.22.2, `npm` 10.9.7, `tsc` 5.9.3, `git` 2.43.0, `python3`, in a `mktemp -d` scratch dir through the agent npm/https proxy. Used for D-plan-2 (pins, grammar load, TS compile), D-plan-32 (race), `node:sqlite` features, git parsing, `npm ci`, FTS migration.
- **Gate re-execution**: `run-plan-probes.mjs`, `derive-plan-sections.mjs --check`/`--self-check`, `tools/check_docs.py` — all run by me, raw output in the appendix.
- **Read** (literal-content / structural / cross-reference claims within the artifact): every §7 step body, the decision collapse-tests, §11.4 evidence, §12 test specs, spec §11.5/§12/§14.
- **`list_repos`** (current-source check of an external fact the plan rests on): the Step 39 target repositories.
- **Unavailability disposition:** No instrument class needed for a load-bearing claim category was unavailable. The one item I did not re-fetch is the live Claude Code hooks reference (a 2026-09-07 fetched-date claim); it is recorded in Tentative Findings as a verification-scope limit, not a defect. Clear Thought MCP was not invoked as a tool; the mandated multi-perspective pre-delivery check was performed manually (personas below), which the skill permits with the tool-failure noted.

### Inventory checklist

Plan under review:
- [x] `docs/plans/plan-phase-a.md` — Read in full: §1 (27), §2/§2.3/§2.4 (42–209), §3 (210–296), §4 (297–414), §5 (416–768), §7 Steps 1–40 (830–4875), §8 (4876), §9 (4893), §10A D-plan-1..32 (5713–6438), §11.1–§11.6 (6447–7385, §11.4 evidence read line-by-line 7040–7180), §12.1/§12.3/§12.4 (7386–9401, sampled across all three tiers), §13 (9403–9524), §15 (9888–9938), §16 (9941–10025).

Validation references (Grep/Read-verified for the specific claims the plan rests on them):
- [x] `docs/specs/spec-context-oracle.md` §11.5 (739), §12 (780), §13 (874), §14 AC-1..AC-25 (908–1131) — Read; used for Upstream Contract Verification.
- [x] `docs/STATUS.md` — Read in full; its "all gates green / 32-of-36 / 200-of-200" assertions re-verified by my own execution below.
- [x] `CLAUDE.md` — Read (three dominating rules, lifecycle, engineering standard).
- [x] Architecture premises AD-2/AD-9/AD-10/AD-12/AD-23/AD-25/AD-26, V1/V7/V8/V14 — verified as *cited* through the plan's §4 and §11.2 and the step Source fields; the drifted premises (V6 timeout, V14 grammar-load) confirmed re-grounded in §4 by my own grammar execution.

Probe corpus (the plan's executed evidence — Read the source of every load-bearing probe, then independently re-executed the underlying claim where it is load-bearing):
- [x] `plan-phase-a.probes/` 01–26 + `layout/prepare.sh`, `layout/package.json`, `layout/package-lock.json`, `layout/tsconfig.json`, `expected/*.txt` — Read; probes 02, 11, 19, 20, 21, 22, 23, 24, 25, 26 read in full and their claims independently re-executed; 01/03/04/05/06/07/08/10/16 comment headers read and confirmed to target the load-bearing property.

Every inventory item is `[x]`. Nothing on the list is unverified.

---

## Summary

**This review returns PASS.** The plan is, by expert engineering standards, in exceptional shape: a 40-step build contract whose every load-bearing external premise is kept as an executable probe with recorded output, whose cross-references are machine-checked in both directions, and whose honesty-critical machinery (the answer-drift conservative recognizer and the exit-run measurement) is engineered so completeness *cannot* be faked — the recognizers' unit tests assert the coverage they must **not** have, and the exit run's validity rule refuses a reflection-only or tool's-own-repo pass. I independently executed every factual claim the round-6 gate was convened to attack, including the two decisions STATUS.md flagged as never independently attacked on their final text (D-plan-2, the runtime pin, and D-plan-32, the reindex claim row), and every one confirmed. All three mechanical gates pass under my own execution. I found no violation of an established engineering standard with a verified premise — no Critical, Serious, Systemic, Moderate, or Minor finding.

---

## Upstream Contract Verification

The plan's validation references are spec `docs/specs/spec-context-oracle.md` (§14 acceptance criteria; §11.5 Phase A build order and exit) and `docs/architecture-phase-a.md` (AD-1..AD-26). I checked the plan against the spec's Phase A acceptance set and against the governing architecture decisions for the scope I executed.

**Spec §14 acceptance criteria → plan coverage (§12.4).** Every Phase A criterion maps to at least one Phase A test-ID, and every deferred criterion is listed with its phase. Verification method: read spec §14 (908–1131), read §12.4 (9343–9400), cross-checked the phase splits against spec §11.5 and §2.2.
- Phase A ACs (AC-1, AC-1a–d, AC-2, AC-2a, AC-2a-i allow-half, AC-2c answer-drift over-fire + human-channel under-fire, AC-3, AC-3a, AC-4, AC-5, AC-6, AC-7, AC-8, AC-8a, AC-9, AC-10, AC-11, AC-12, AC-13, AC-14, AC-15, AC-17, AC-18, AC-19, AC-20, AC-21 mechanism, AC-22, AC-23, AC-24): each carries ≥1 Phase A T-ID. **PASS** (mapping present and each T-ID's spec is a behavior-pinning replay through the real handler binary — verified by reading the §12.3 entries T-38-1..T-38-14, which each carry a "Fails when" clause that pins the AC including its negative/silence case).
- Deferred, honestly phased and *not* claimed as Phase A: AC-2a-i deny-half (B), AC-2a-ii (B), AC-2b (C), AC-2c skill under-fire (C), AC-16 (C), AC-25 (B), AC-21 full induced self-trigger (B). **PASS** (matches spec §14's Phase-B/C paragraph and §2.2; no deferred AC is dressed as covered).

**Architecture decisions governing the scope I executed → honored/violated.**
- AD-25 (packaging: two runtime deps, no postinstall, no native code): **honored** — verified by execution; my independent `npm install` of the pins added 6 packages with 0 native `.node` files (probe 11 property) and no install-phase script.
- AD-2 (Node ≥22.16.0 floor; `node:sqlite` WAL/STRICT/FTS5 behind one seam; FTS5 probe with LIKE fallback): **honored** — `node:sqlite` FTS5/STRICT/`VACUUM INTO` state reproduced on v22.22.2 (sqlite 3.51.2); FTS-migration sequence reproduced (state recorded after `schema_meta` exists, applied conditionally, never flipped).
- AD-26 (single-writer discipline; reindex mutual exclusion; the handler never waits): **honored** — the `schema_meta` claim-row taken inside one `BEGIN IMMEDIATE` transaction yields a single winner under my own race harness (200/200, 250/250 under load). AD-26's original "directory lock" wording is correctly recorded in §4/§16 as premise maintenance, not silently changed.
- AD-12 (LanguageFrontend seam; tree-sitter frontend "covers every language for which `tree-sitter-wasms` ships a grammar"): the coverage sentence is **corrected by execution** in §4 to "every grammar the pinned runtime can load *and parse* — 32 of 36," which my independent grammar run confirms; the correction is recorded as premise maintenance (§16), and the architecture text is not edited. This is the correct lifecycle treatment of a drifted premise (CLAUDE.md: record the drift in §4/§11, re-ground the decision, never silently change architecture text). **honored.**
- AD-23 (bounded reads, no `git` subprocess on the event path; cooperative watchdog): **honored** in the steps I read (Step 14 `resolveHead` is in-process file reads; Step 19 rumor-rule is a bounded seek-read; Step 28 pipeline places the guard and deadline first).

No upstream contract violation found in the scope executed.

---

## Critical & Serious Findings

No Critical or Serious findings — the full inventory was Read or Grep-verified per Compliance Gate B, and no violations of Critical or Serious classification were observed. Specifically, the two decisions STATUS.md flagged as never independently attacked on their final text both survived an independent adversarial *execution* attack:

- **D-plan-2 (dependency pins), `docs/plans/plan-phase-a.md:5745`, §4 `docs/plans/plan-phase-a.md:323`.** Standard: reproducible-build / pin-to-executed-surface. I installed the exact pins in a fresh scratch dir and independently confirmed: `web-tree-sitter` 0.25.10, `tree-sitter-wasms` 0.1.13, `@types/emscripten` 1.41.6, `typescript` 5.9.3, `@types/node` 22.20.1 all resolve and install; loading all 36 shipped grammars *in alphabetical order* (deliberately different from the plan's probe, which loads elm/ql first) gives 34 that `setLanguage`+parse, minus `yaml` (TypeError on first parse) and `bash` (TypeError on `case…esac`) = **32 usable**, exactly the claim; and a `.ts` file importing `web-tree-sitter` compiles under the plan's tsconfig (`tsc` exit 0, JS emitted) but fails `TS2304: Cannot find name 'EmscriptenModule'` at `web-tree-sitter.d.ts:136:31` when `@types/emscripten` is excluded. The one behavior that differed from the plan's probe — `elm`/`ql` fail at `Language.load` with `RuntimeError: memory access out of bounds` in my ordering, rather than loading-then-`setLanguage`-throwing — is precisely the memory-layout-dependent trap the plan discloses in §4 ("traps or not depending on how much heap earlier grammars consumed, so nothing asserts the trap") and §11.4. Both grammars are excluded from the default table by ABI (12 and 10, below the runtime minimum 13) regardless of which way the trap lands, so the disclosed nondeterminism has no effect on the shipped behavior. Closed by my execution.
- **D-plan-32 (reindex claim row), `docs/plans/plan-phase-a.md:6416`, §4 `docs/plans/plan-phase-a.md:388`, Step 14 `docs/plans/plan-phase-a.md:2274`.** Standard: single-writer serialization for mutual exclusion (SQLite documented behavior). I wrote my own race harness (two real Node processes behind a file barrier, the winner holding a 400 ms claim), independent of the plan's probe 26, and ran 200 iterations (exactly-one-won 200, both-won 0, neither 0) and 250 iterations under four CPU-hog siblings (exactly-one-won 250, both-won 0). The pid-reuse residual is honestly disclosed in the decision text as a delay, never a double pass. Closed by my execution.

---

## Systemic Patterns

No systemic patterns — verified by the following scans and reads across the full inventory scope:
- `grep -c '^step: S'` over the plan = **40**; `grep -oE 'T-[0-9]+-[0-9]+' | sort -u | wc -l` = **124** — both equal `derive-plan-sections.mjs --check`'s reported counts (40 steps, 124 test specs), so no step or test-ID is orphaned or duplicated.
- I read all 40 step bodies. They follow one uniform, correct pattern (named Source; Gate-3 rationale; "What this is NOT — and why"; specific Verification with a "Fails when" clause; honest "Impact if wrong"). A systemic pattern requires a shared *defect* across instances; the shared pattern here is a shared correctness discipline, not a shared defect. No systemic finding.
- The single-importer / single-producer disciplines (`node:sqlite` → Step 3; `node:child_process` → Step 5; deny verdict → Step 24; hook field names → Step 28; fault/session writers → Step 10) are each enforced by a built-output import/string scan over `dist/src/**`, not by convention — the *opposite* of a systemic convention-decay pattern.

---

## Moderate & Minor Findings

No Moderate or Minor findings — verified by reading all 40 step bodies, the §10A decision collapse-tests, §11.4 evidence, and the §12 test specifications, and by independently re-executing every load-bearing external claim (results in the appendix). Candidate Minor issues I considered and rejected on the merits:
- The §11.4 line 7150 count "41 repositories" is now 42 on `list_repos` (2026-09-16). Rejected as a finding: it is an evidence row explicitly dated 2026-09-07 with its method recorded, which is the plan's sanctioned mechanism for point-in-time external reads (§3); nothing load-bearing rests on the count, and the Step 39 leg-2 targets it feeds (`Maxcogar/NOVA`, `Maxcogar/Nova-Integrations`) both still exist and are clonable (verified). A dated observation being superseded later is not a plan defect.
- Step 15's parse-throw fallback catches "a parse that throws … whatever its class" but the prose foregrounds `TypeError`/`RuntimeError`. Rejected: all 32 default-table grammars load cleanly in my execution (the load-trap only afflicts the ABI-excluded elm/ql, which are never in the table), grammar loading is lazy on first use inside the caught parse path, and the catch is class-agnostic — so a load throw on first use is also caught. No reachable defect.

---

## Tentative Findings

These are **verification-scope limits, not defects** — I record them for transparency, and none blocks PASS (none is a candidate finding; each is either a claim the plan's own executed probes plus prior evidence support and I chose not to re-execute, or an external unknown the plan already discloses as a gap with a named resolution). I did not format them as `### T<N>` correction-loop findings because there is nothing in the plan to correct.

- **Hooks-contract contents (fetched 2026-09-07, §11.4, `docs/plans/plan-phase-a.md:229`).** I did not re-fetch the live Claude Code hooks reference to re-confirm the timeout-semantics and entry-field claims. The gap that would close this: a fresh fetch of `code.claude.com/docs/en/hooks` compared against §3/§11.4. The plan already treats hooks drift as risk R3 and confines all hook-field naming to one adapter file (Step 28, T-28-2), so a drift is a single-file build-time diff, not a plan defect.
- **`unshare -rn` on the GitHub Actions runner image (probe 09, optional).** `run-plan-probes.mjs` reported `ok 09_unshare_no_network.optional`; this is the plan's carried-forward round-3 tentative (STATUS open items), optional by design. The gap: an actual GHA run. Non-gating (the no-egress property is also asserted structurally, D-plan-23, probe 08, which I did not need to re-run because the plan does not rest a Phase A requirement on `unshare`).
- **L11(a) marker presence on an owner-local interactive transcript, and G2 (`UserPromptSubmit` for platform-injected turns).** Both are runtime-only / undocumented external facts resolvable only inside the exit run; the plan discloses each as a gap (§15 G2/G3, STATUS open items) with the resolution mechanism named and the design safe either way (AD-9 voiding guard). Correct engineering treatment of a genuine unknown, not a defect.

---

## Observations

Non-finding notes (no standard violation, no severity):
- **Step 39 freezes its leg-2 targets to the 2026-09-07 snapshot** (`Maxcogar/NOVA`, `Maxcogar/Nova-Integrations`) rather than re-deriving "two most recently pushed" at build time; two newer repos now exist (`the-app-for-apps`, `CNC-Syndicate-Hub`, both pushed 2026-09-16). This is a deliberate, reasoned choice (reproducibility; keeping the non-programmer owner out of the loop; a push-date-ordered fallback for unclonable/no-grammar repos), and the named targets remain valid. Recorded so the build agent knows the target selection is intentional, not stale.
- **The probe-and-gate infrastructure is what made a genuine round-6 execution review possible.** Because each external premise is an executable probe with recorded expected output and `derive-plan-sections` checks the `probe:` citations both ways, I could independently re-run the load-bearing claims and diff against the recorded expectations. This is the mechanism the project's "verify before you assert" rule needs.

---

## What's Actually Good

Three properties are genuinely good by named engineering standards, each verified:
- **Structural confinement of the deny primitive (Step 24, `docs/plans/plan-phase-a.md:3096`).** "Exactly two blocks" is enforced as a structural invariant — a module-private `unique symbol` brand plus an import scan over `dist/src/**` asserting `blocks/verdict.js` has exactly one importer — not by convention. Standard: ISO/IEC 25010 analysability + invariant-over-convention. Verified by reading Step 24 and T-24-2/T-24-3 (a seeded second importer fails the convention test; an annotated `DenyVerdict` construction outside the module fails `tsc`).
- **The un-fakeable exit measurement (Step 39, `docs/plans/plan-phase-a.md:4547`).** The validity rule refuses a report unless leg 2 completed ≥3 real agent-driven `claude -p` sessions on a non-tool repo, each with a `SessionStart` liveness row and ≥1 `outcome='ok'` Edit/Write; the tool's own repo never counts toward the minimum; a suspiciously *high* answer-drift coverage number is declared a finding to investigate, never a success to publish. Standard: first-principles articulation — the phase goal is honest measurement that "never fakes completeness"; the shortcut a lesser design would take (measure the tool's own reflection, or report synthetic data) is made structurally impossible. Verified by reading Step 39's validity rule and the recall/precision denominator computed against an independent label rather than the recognizer's own rule.
- **The conservative-recognizer non-coverage is an asserted test outcome (Step 23, `docs/plans/plan-phase-a.md:2981`).** The question/clear/move recognizers' unit tests assert the coverage they must **not** have (indirect asks not recognized; every non-mutating tool not deny-eligible), so an implementer who "improves" coverage breaks a test written the step before. Standard: first-principles — the collapse-log 2026-09-04 failure was exactly an elaborated classifier dressed to look complete; turning restraint from an instruction into a mechanical check is the correct guard. Verified by reading Step 23 and T-23-1/T-23-2/T-23-3.

---

## Convergence Record

- **Round number:** 6 (project numbering; my own first independent pass over this artifact).
- **Trajectory (reconstructed from the project record — STATUS.md and `docs/reviews/`, not re-derived by me; my own count is the only one I established directly):** rounds 1–5 plus a hook-enforced correction loop found and closed defects (STATUS records a 24-finding loop closed 2026-09-08); the 2026-09-11 session found and fixed the non-functional runtime pin plus six ported defects plus three drifted probes (7+ items, all fixed). **This round (R6): 0 findings.** The count is strictly decreasing to zero.
- **Flow counts for this round:** prior findings closed (re-derived against current source and confirmed satisfied): D-plan-2 pin, D-plan-32 race, the numstat/rev-parse/lockfile/FTS ports — all confirmed *closed* by my own execution. New findings: 0. Regressions: 0.
- **Tripwire evaluation (arithmetic shown):** Condition (a) new+regression ≥ closed for two consecutive rounds: 0 new + 0 regression = 0, which is **not** ≥ the several closures I confirmed — not met. Condition (b) total findings not strictly decreasing for two consecutive rounds: this round's total (0) is strictly less than any prior round's positive total — not met. **Tripwire NOT fired.** The fix cycle has converged.

---

## Recommended Priority

Nothing to fix. The plan is the build contract. The indicated next action is exactly what STATUS.md and Step 1 already specify: begin `/expert-implement` at Step 1, whose first act (`npm ci` on the committed lockfile, then a file importing `web-tree-sitter` compiling and loading a grammar) re-executes the three probes that would have caught the pin — the same executions I confirmed independently in this review. Carry the four disclosed gaps (G1 plan-seed thresholds; G2 `UserPromptSubmit` for injected turns; G3 transcript corpus existence; G4 leg-1 reconstruction fidelity) into the exit run and the Phase B architecture session as the plan already routes them; none is a plan defect.

Multi-perspective pre-delivery check (performed manually; Clear Thought MCP not invoked as a tool this session): from the standards-discipline perspective the zero-findings verdict is backed by execution of every load-bearing premise; from the downstream-consumer perspective (the build agent, Max Cogar) the PASS is actionable with the "What I executed" appendix as the evidence trail and the disclosed gaps flagged; from the implementer perspective the factual foundation (pins, race, sqlite, git, FTS) is independently confirmed so Step 1 can start against a known-good surface. No perspective surfaced a gap that changes the verdict.

---

## Appendix — What I executed

All commands run on Node v22.22.2 / npm 10.9.7 / git 2.43.0, in `mktemp -d` scratch dirs through the agent proxy, never writing into the repo tree except this review file.

1. **Plan's own gates (raw output):**
   - `node .claude/skills/expert-plan/scripts/run-plan-probes.mjs docs/plans/plan-phase-a.md` → `ok` for probes 01–26 (09/12/13/14/15/17/18/21 as their optional/skip lines), final line `all probes match their recorded expectations`, exit 0.
   - `node .claude/skills/expert-plan/scripts/derive-plan-sections.mjs --check docs/plans/plan-phase-a.md` → `OK: 40 steps, 13 elements, 124 test specs, 26 probes cited, regions current`, exit 0.
   - `node .claude/skills/expert-plan/scripts/derive-plan-sections.mjs --self-check` → `self-check passed: 34 checks`, exit 0.
   - `python3 tools/check_docs.py` → `context-oracle doc-consistency check passed.`, exit 0.
   - `grep -c '^step: S'` = 40; `grep -oE 'T-[0-9]+-[0-9]+' | sort -u | wc -l` = 124; probe files = 26; expected files = 26.

2. **D-plan-2 pins (independent install, own scripts):**
   - `npm install` of the exact manifest → "added 6 packages"; installed versions read from `node_modules/*/package.json`: web-tree-sitter 0.25.10, tree-sitter-wasms 0.1.13, typescript 5.9.3, @types/emscripten 1.41.6, @types/node 22.20.1; 36 shipped `.wasm` grammars, 0 native `.node` files.
   - Own grammar loader (alphabetical order): `Language.load ok: 34 fail: elm(RuntimeError: memory access out of bounds), ql(RuntimeError: memory access out of bounds)`; `setLanguage ok: 34 fail: none`; `parse('\n') ok: 33 fail: yaml(TypeError)`; `yaml trigger parse: TypeError: resolved is not a function`; `bash trigger parse (case…esac): TypeError: resolved is not a function`. Net usable default table = 32 (36 − elm − ql − yaml − bash). Confirms the "32 of 36" claim; the elm/ql failure mode matches the plan's disclosed memory-layout-dependent nondeterminism.
   - Own TS compile: with `types:["node","emscripten"]` → `tsc` exit 0, JS emitted; with `--types node` only → `error TS2304: Cannot find name 'EmscriptenModule'` at `node_modules/web-tree-sitter/web-tree-sitter.d.ts(136,31)`, exit 2.

3. **D-plan-32 reindex race (own harness):** 200 iterations → `exactly-one-won=200; both-won=0; neither-won=0` (child tally: won 200, held-by-live-owner 200); 250 iterations under 4 CPU hogs → `exactly-one-won=250; both-won=0; neither-won=0`.

4. **node:sqlite features (own script):** `fts5 MATCH rows: 1`; `sqlite_version: 3.51.2`; `ENABLE_FTS5: true`; `module-level backup: function | proto.backup: undefined`; `STRICT text-into-INT: rejected`.

5. **git / npm / FTS (own reproductions):**
   - `git rev-parse --is-inside-work-tree`: non-git dir → exit 128, empty stdout; inside `.git/` → exit 0, `false`; work tree → exit 0, `true`.
   - `git log --numstat -M` rename path fields: `a.txt => b.txt`, `e.txt => dir/e.txt`, `src/{utils => other}/c.txt`.
   - `npm ci` with `package.json` and no lockfile → exit 1, `EUSAGE: true`, message names `package-lock.json`.
   - FTS migration sequence (own `applyMigrations`): write-before-001 throws `true`; fts:true → `fts_state=fts5, fts_symbols created, unchanged after opposite-flag second call`; fts:false → `fts_state=fallback, no fts table, unchanged`.

6. **Probe sources read** (confirmed each tests its load-bearing property, not an incidental value): 02, 07, 11, 16, 19, 20, 21, 22, 23, 24, 25, 26 in full; 01, 03, 04, 05, 06, 08, 10 comment headers.

7. **Current-source check:** `list_repos(query="maxcogar")` → `Maxcogar/NOVA` (pushed 2026-09-16) and `Maxcogar/Nova-Integrations` (pushed 2026-08-22) both present and clonable; account now lists 42 repos (the §11.4 dated snapshot recorded 41 on 2026-09-07).

---

Verdict: PASS
