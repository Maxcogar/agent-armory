# Expert review — `docs/plans/plan-phase-a.md`, round 2

**Date:** 2026-09-07
**Reviewer:** independent `/expert-review` pass (expert-review SKILL.md R1.2, Post-fix protocol). Not the plan's author, not the author of either 2026-09-06 review, not the author of `2026-09-07-author-gates-review.md`. The prior round reached this reviewer only as the written record named below.
**Artifact:** `middleware/context-oracle/docs/plans/plan-phase-a.md` as installed in the working tree (5,999 lines; `git status` clean at commit `149ffc8`; 16 sections, 40 steps, 113 test specifications).
**Round:** 2. Round 1 = `docs/reviews/2026-09-06-plan-expert-review.md` (10 findings: 3 Serious, 5 Moderate, 2 Minor) and `docs/reviews/2026-09-06-plan-collapse-hunt.md` (3 collapses, 4 partials, 6 new load-bearing decisions). The plan was re-authored on 2026-09-07 from those findings (commit `149ffc8`; the round-1 artifact is commit `99be60a`, used below only for provenance classification).

Every location below is written as `path:start-end` (line range) or `path#section`. Line numbers are of the working-tree revision; `plan` abbreviates `docs/plans/plan-phase-a.md`, `arch` abbreviates `docs/architecture-phase-a.md`, `spec` abbreviates `docs/specs/spec-context-oracle.md`. Every literal-content claim was Read at the cited lines in this session; every execution claim states the command and its observed output.

---

## Scope and Inventory

### Round and sources of the post-fix inventory

Per SKILL.md Step 2 (Post-fix review): the prior review's full inventory, the fix-diff files, their dependents, and the prior findings as closure items. The fix-diff is one file (`docs/plans/plan-phase-a.md`, rewritten wholesale between `99be60a` and `149ffc8`); it has no code dependents (it is a document; `§5.4`/`§11.6` of the plan and `arch:1984-1992` L8 state the project has one code file, `tools/check_docs.py`, with zero dependents — re-verified by `ls -a middleware/context-oracle/` this session: `.claude .mcp.json CLAUDE.md OWNER-LEDGER.md RETHINK.md docs tools`).

### Files in scope — every file below is `[x]`

- [x] `docs/plans/plan-phase-a.md` — **Read in full**, lines 1–5999 in twelve contiguous 500-line reads. Grep-verified in addition: every `**T<n>-<m>` definition (113), every `**File.**` field, every `### Step N` header and its six fields, every `**Dependencies.**` field against the step order (script: zero steps cite a later or equal step; all 40 steps carry What changes / Source / Why / Dependencies / Verification / Impact), every T-ID cited anywhere resolves to a definition (0 undefined), `.test.ts` entries in §5.1 (109 = 54 unit + 3 build + 5 conventions + 47 replay), the §5.1 T-ID annotations against §12 `File.` basenames (0 mismatches), the narration/self-correction vocabulary (4 hits, enumerated in m1), and the strings `hooks_not_firing|liveness|index_stale|produced_but_undelivered` (3 hits, all in Step 6's code list), `quick_check` (6 hits), `Candidate|EventContext|EventKind|HookResponse|ImportEdge\[\]|Symbol\[\]` (type-use sites only, no definition site).
- [x] `docs/reviews/2026-09-06-plan-expert-review.md` — Read in full (842 lines). Provenance source for closure items S1–S3, M1–M5, m1–m2.
- [x] `docs/reviews/2026-09-06-plan-collapse-hunt.md` — Read in full (822 lines). Provenance source for closure items C1–C3, P1–P4, N1–N6.
- [x] `docs/reviews/2026-09-07-author-gates-review.md` — Read in full (105 lines). Treated as the author's claims; nothing in it was accepted without re-derivation.
- [x] `docs/reviews/README.md` — Read in full (39 lines): round numbering and the "prior findings as closure items" rule.
- [x] The round-1 plan revision, `git show 99be60a:middleware/context-oracle/docs/plans/plan-phase-a.md` (5,493 lines) — Read at the passages needed for provenance only: Step 1 (r1:575-610), Step 10 (r1:1005-1015), Step 14 recognizers (r1:1228-1240), Step 36 regret (r1:2410-2425), Step 41 conventions (r1:2640-2670), Step 42 exit run (r1:2685-2705), T14-2 (r1:3895-3915), §2.3 (r1 "### 2.3" block), §9 (r1 "## 9. Checkpoints" block), init step 2 (r1:2165-2172); grep-verified for `PROXY|egress` (0 hits), `concluding position` (0 hits), `candidates_json` (1 hit, the session writer), `hooks_not_firing` (code list only).
- [x] `.claude/skills/expert-plan/SKILL.md` — Read in full (390 lines).
- [x] `.claude/skills/expert-plan/references/output-contract.md` — Read in full (82 lines).
- [x] `.claude/skills/expert-plan/references/testing-standards.md` — Read in full (140 lines).
- [x] `.claude/skills/expert-standard/SKILL.md` — Read in full (59 lines).
- [x] `claude-plugins/expert-dev-tools/skills/expert-review/SKILL.md` — Read in full (632 lines).
- [x] `docs/specs/spec-context-oracle.md` — Read in full (1,138 lines); every §11.1 line-range citation of the plan re-read at the cited lines (all 17 resolve to the passage the plan describes).
- [x] `docs/architecture-phase-a.md` — Read in full (2,058 lines); every §11.2 citation re-read (V1–V19 at `arch:125-143`; AD-2…AD-26 ranges; L1/L3/L6/L8/L10/L11; T2 at `arch:1746-1792`) — all resolve.
- [x] `OWNER-LEDGER.md` — Read in full (80 lines); OL-C1 (:66), OL-C3 (:68), OL-C5 (:70), OL-11 (:49), OL-7 (:45), OL-10 (:48), OL-C6 (:71) resolve verbatim.
- [x] `CLAUDE.md` (project) — in context; the three dominating rules, the routing table, and the engineering standard re-read.
- [x] `docs/collapse-log.md` — Read at `:22-102` (2026-08-25 citation/hedge entry), `:830-902` (2026-08-25 blocking-model entry), `:1057-1120` (2026-09-03 rounds 8–9), `:1121-1156` (2026-09-04); headings listed in full.
- [x] `docs/IDEAS.md:92-171` — Read (#14 discovery-mode replay).
- [x] `docs/STATUS.md:1-60` — Read (the plan's own description of itself).
- [x] `tools/check_docs.py` — grep-verified: `--base` argument exists (`:194`).
- [x] `.mcp.json` (project) — Read: names only `clear-thought`; `mcp-servers/codegraph-mcp/` exists in the repo (`ls mcp-servers/`).
- [x] External / executed (all this session, 2026-09-07):
  - `https://code.claude.com/docs/en/hooks` — WebFetch, verbatim quotes on timeouts, `transcript_path`, command-hook fields, `UserPromptSubmit`, `SessionStart` sources, matcher support, `PostToolUseFailure`/`PermissionRequest`.
  - `https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/` — WebFetch; removed/changed options and release date.
  - `https://sqlite.org/lang_vacuum.html` — WebFetch; the four VACUUM sentences.
  - `https://raw.githubusercontent.com/nodejs/node/main/doc/changelogs/CHANGELOG_V22.md` — curl; lines 1200–1218 and 1697 read.
  - Context7 `/websites/nodejs_latest-v22_x_api` — `test` page (glob patterns; TypeScript files only when type stripping is enabled), `cli`/`typescript`/`process` pages (strip-types default from v22.18.0, flag from v22.6.0), `cli`/`http` pages (`NODE_USE_ENV_PROXY`).
  - npm registry via `npm view`: `typescript` (5.9.3 2025-09-30; 7.0.2 2026-07-08; dist-tag latest 7.0.2; later entries `7.1.0-dev.*`), `@types/node@22` → 22.20.1, `web-tree-sitter` (0.26.13 2026-08-23; 0.27.0 2026-08-30, latest), `tree-sitter-wasms` 0.1.13 (deps `{tree-sitter-wasms: ^0.1.11}`, scripts `{build}` only).
  - `list_repos` (query `maxcogar`) — 41 repositories, `has_more: false`; the five named in `plan:2899-2901` present with the stated push dates.
  - Layout reproduction `scratchpad/layoutprobe/` (Node v22.22.2, typescript 5.9.3, the Step 1 tsconfig shape): executions recorded per finding below.
  - `claude -p --model claude-haiku-4-5 --tools "" --max-turns 1 --output-format json` run from `/tmp/v9scrub` with every `CLAUDE_*`/`ANTHROPIC_*` variable removed and `CTXORACLE_INTERNAL=1` — exit 0, JSON envelope with a fresh `session_id` (Step 36's scrub contract holds here).

### Tool plan (Step 3)

| Claim type | Instrument used |
|---|---|
| Literal content of the plan / spec / architecture / ledger / collapse-log | `Read` at file:line (recorded per finding) |
| Absence claims over the plan ("no step builds X", "no defining site for type Y") | `grep` over the whole plan with the query and hit count recorded |
| Library behaviour (Node test runner, type stripping, proxy env vars, `node:sqlite` `backup`, `import.meta.resolve`, `web-tree-sitter` API surface) | Context7 (library ID + page), direct execution on Node v22.22.2, and Read of the installed package's `package.json`/`.d.ts` |
| Hooks-contract, TypeScript 7, SQLite VACUUM, Node changelog | WebFetch / curl of the authoritative page, quotes recorded |
| Registry facts | `npm view` |
| Prior-document claims (the two round-1 reviews, the author's gates review) | re-derived from the current plan by Read/grep before any closure was recorded |
| Provenance (new / recurring / regression) | `git show 99be60a:…` of the round-1 revision, Read at the passage |
| Structural / blast-radius | not needed — the artifact is a document with no code dependents (CodeGraph unavailable in this session; not load-bearing for a document review) |

**Unavailable instruments and disposition.** Clear Thought MCP is not loadable in this session (`ToolSearch` lists no `clear_thought` tool; the project's `.mcp.json` configures it for `npx`, which this reviewer did not launch). The mandatory pre-delivery multi-perspective check was therefore performed manually across the three personas (standards discipline; the implementer executing the plan; Max Cogar reading the verdict) and is recorded in Observations. The 22.16.0 runtime floor is not present on this machine (v22.22.2 only) — claims about behaviour *at the floor* that the plan itself defers to CI (`plan:3936-3937`) are left at that status. No rigor waivers were requested.

### Metacognitive baseline (recorded before drafting)

Known from verified reads this session: everything cited by line above. Inferred and therefore verified before use: the Node proxy behaviour (executed and documented), the tsconfig/fixture interaction (executed), the `web-tree-sitter` export shape (read from the installed `.d.ts`), the `argv[1]` symlink behaviour (executed). Not verifiable here and left tentative: that the planning session actually ran CodeGraph and Clear Thought over stdio (`plan:4029-4048`), and the size of any transcript corpus on the owner's machine (`plan:5914-5921`).

### Round-1 closure table (each prior finding re-derived from the current plan; closed only against its originally named standard)

| Prior finding (round 1) | Original standard | Current state (Read) | Status |
|---|---|---|---|
| ER-S1 Step 31 depended on later Step 32 | expert-plan Step 8 topological sort | `plan:2511` Step 31 depends on 2,3,4,5,7,8,12,14,28; `plan:2480` init calls `runIndex` (Step 14) directly; script: no step cites a later step | **Closed** |
| ER-S2 AC-8 content assertion had no test; Verification/Warning genres untested | expert-plan Step 9 (behaviour traced to requirement) | `plan:4637-4651` T18-7; `plan:5426-5437` T38-28 (AC-8 headline); `plan:5439-5448` T38-29 (Warning); `plan:5525` AC-8 → T18-7, T38-28 | **Closed** |
| ER-S3 open bin-2 entry Q-gap-5 (CodeGraph / Clear Thought halt) | expert-plan delivery semantics (SKILL.md:90) | `plan:5834-5839` bin 2 empty; `plan:4029-4048` and `plan:5803-5805` (Q26) state both servers ran over stdio | **Closed on the plan's attestation** — the trace itself is not in the repo; see Tentative T1 |
| ER-M1 fixture repos not enumerated in §5.1 | §5.1 exhaustiveness | `plan:538-568` enumerates 30 fixture repos with their T-IDs | **Closed** |
| ER-M2 `hook_field_names_isolated.test.ts` at two paths | Gate C item 7 | `plan:482` one path (`test/conventions/`), `plan:4923` T28-2 `File.` matches | **Closed** (but see SY1 — the single file's specification now contradicts T24-2) |
| ER-M3 T15-1 covered only `updatedInput` | Step 9 observable behaviour | `plan:4804-4815` T24-1, two fixtures | **Closed** |
| ER-M4 Step 39 Dependencies listed 8 of 25 steps | Step 8 Dependencies field | `plan:2799-2802` Step 37 lists every step whose Verification names a unit/build/convention file | **Closed** |
| ER-M5 AC-2c over-fire mapped to one sub-case | Step 9 traceability | `plan:5450-5459` T38-30 (reworded answer clears; reads/greps/Bash free) + T38-4; `plan:5516` | **Closed** |
| ER-m1 verification glob missed build/conventions | Step 8 Verification field | `plan:697-705` runner enumerates the three directories | **Closed** |
| ER-m2 "T25-1 through T25-7 (one per genre)" false | verify-before-assert | `plan:1727-1729` T18-1–T18-7 one per generator + T18-8 | **Closed** |
| CH-C1 build order put deny fixtures first | CLAUDE.md rule 3 / §11.5 | `plan:648-663`, `plan:3083-3099` D-plan-1, Checkpoint 3 `plan:3036-3043` | **Closed** |
| CH-C2 `.ts` tests could not execute at the floor; vacuous `node --test` pass | unverified premise / testing-standards anti-pattern 4 | `plan:681-705` compiled tests + count-guarded runner; `plan:3916-3919` execution | **Closed as stated — but the replacement introduces C1 below** |
| CH-C3 exit run on the tool's own repo only | §11.5 "owner's real repos" | `plan:2895-2917` leg 2 + validity rule | **Closed** (see M10 for a residual inconsistency) |
| CH-P1 TOCTOU lag heuristic | FR-B1 lag clause / AD-9 | `plan:2091-2100`, `plan:3203-3212` D-plan-9: no heuristic | **Closed** |
| CH-P2 L11(b) transient wrongful deny un-owned | AD-9 / T2 | `plan:1914-1917` `voidQuestion(...denyFired)`; `plan:3521-3531` D-plan-11 "transient case counted" | **Closed** |
| CH-P3 settings marker under strict validation | AD-6 / AD-20 | `plan:2472-2479`, `plan:3147-3157` D-plan-6 command-pattern marker | **Closed** (see m5 for the undefined binary path) |
| CH-P4 seam interface too narrow | AD-21 | `plan:2716-2742` envelope-carrying seam; D-plan-8 | **Closed** |
| CH-N1 URL normalization axes | AD-3 | `plan:932-944`, D-plan-15 | **Closed** |
| CH-N2 bypass predicate list unbounded | L3 / AD-9 | `plan:2165-2174`, D-plan-16: exactly AD-4's list with the bound printed | **Closed** |
| CH-N3 unsourced seeded defaults | CLAUDE.md "numbers without sources" | `plan:1321-1346` two provenance classes; D-plan-7; G1 | **Closed** |
| CH-N4 `lengthFloor` unspecified | same | `plan:1342` `qa.clear_length_floor_chars = 40` | **Closed** |
| CH-N5 `CTXORACLE_INTERNAL` enforcement | AD-21 / FR-J4 | `plan:953-963` single spawn wrapper + T5-3 | **Closed** |
| CH-N6 confinement grep scope | AD-10 / AC-2 | `plan:2021-2026` scoped to `dist/src/**` | **Closed** |

All 23 prior findings are closed against their original standard (one on attestation). Three of the closures introduced new defects, tagged REGRESSION below (C1, S5, SY1, M1).

---

## Summary

This review returns **NEEDS FIXES**. The 2026-09-07 rewrite closes every round-1 finding and is faithful to the spec and architecture on the axis the owner cares about most — the answer-drift block in Steps 21–27 is the safe skeleton AD-9 describes and nothing more (verified line by line against `arch:747-826`), the package pins and runtime floor are unchanged, and no scope was added or dropped in the block. But the plan as written cannot be built as written: the Step 1 build compiles `test/**`, and three §12 tests require TypeScript fixtures under `test/build/fixtures/` that must *fail* to compile, so `npm run build` exits non-zero from Step 9 onward (executed in the layout reproduction). Beyond that, the fixture generators and replay harness the plan's own Verification fields and Checkpoints 1–3 need are created at Step 38; two built-output convention tests are specified so that a plan-conformant build cannot pass them; three AD-17 fault detectors are named but never scheduled while §12.4 claims AC-9 coverage; the regret proxy silently drops FR-L4's "never triggered" class; the exit report's headline number has no measurement procedure; and the new no-egress assertion rests on a Node behaviour that does not exist by default. Twenty-nine findings: 1 Critical, 5 Serious, 1 Serious-Systemic, 11 Moderate, 11 Minor — four of them regressions introduced by the rewrite.

---

## Upstream Contract Verification

The plan's upstream artifacts are the spec (OL-C6-signed, `spec:3-5`) and the Phase A architecture (`arch:3-7`). Both were Read in full.

**Spec §14 acceptance criteria — Phase A subset** (each checked against the plan's §12 specification as the verified state; method = Read of the cited plan lines against the cited spec lines):

| AC | Plan mapping (§12.4) | Verification | Verdict |
|---|---|---|---|
| AC-1, 1a–1d | T18-2/T38-10; T18-1/T38-11; T18-3/T38-12; T18-4/T38-13; T18-6/T38-14 | Read `plan:4555-4636`, `plan:5264-5306` vs `spec:914-931` — each headline pinned; the AC-1 obviousness clause asserted (`plan:4579-4581`) | Honored |
| AC-2 | T24-1, T24-2 | Read `plan:4804-4828` vs `spec:932-939` | Honored as specified; T24-2 is unsatisfiable alongside T28-2 (SY1) |
| AC-2a, AC-2a-i allow-half | T25-1, T25-3, T38-1, T38-2, T38-3 | Read `plan:4830-4875`, `plan:5175-5201` vs `spec:940-960` | Honored |
| AC-2c over-fire / under-fire (answer-drift) | T38-30, T38-4 / T34-2 | Read `plan:5450-5459`, `plan:5135-5146` vs `spec:979-999` | Honored |
| AC-3, 3a, 4, 5, 6 | T16-1/T38-15; T16-1/T38-16; T20-1/T38-17; T20-1/T38-20; T13-1/T38-18 | Read `plan:5307-5361` vs `spec:1000-1014` | Honored |
| AC-7 | T31-1, T31-2, T32-1 | Read `plan:5024-5073` vs `spec:1015-1016` | **Partial** — the create-the-file case and byte-preservation are unspecified (M5) |
| AC-8, AC-8a | T18-7/T38-28; T27-2/T38-9 | Read `plan:4637-4651`, `plan:5426-5437`, `plan:5252-5262` vs `spec:1017-1034` | Honored |
| AC-9 | T10-1, T26-1, T38-6, T38-8, T33-1 | Read `plan:5527` and the named tests vs `spec:1035-1049` | **Violated** — `hooks_not_firing`, `index_stale`, `produced_but_undelivered` have no detector step and no induction test (S2) |
| AC-10 | T29-1, T28-3 | Read `plan:4958-4986` vs `spec:1050-1052` | Honored (T29-1's boundary case is nondeterministic — M6) |
| AC-11 | T11-1..4, T38-22 | Read `plan:5363-5376` vs `spec:1053-1055` | **Partial** — "no network beyond the model piggyback" is asserted through a listener Node does not consult (S5) |
| AC-12 (deterministic parts) | T38-1, T38-4, T36-1 | Read vs `spec:1056-1062` | Honored |
| AC-13 | T13-1, T14-1, T16-1 | Read `plan:4465-4531` vs `spec:1063-1065` | **Partial** — T16-1 has no stale-fact case (m6) |
| AC-14, AC-15, AC-17 | T19-1; T38-23; T38-24 | Read vs `spec:1066-1080` | Honored |
| AC-18 | T38-27 + Step 39 leg 3 | Read `plan:5416-5424`, `plan:2912` vs `spec:1081-1086` | Honored |
| AC-19 | T32-2 | Read `plan:5075-5090` vs `spec:1087-1089` | **Partial** — record-identity honored; the no-egress clause cannot fail (S5) |
| AC-20 | T38-25 | Read `plan:5395-5405` vs `spec:1090-1092` | Honored as a script; the CI job that runs it is undefined (M7) |
| AC-21 (mechanism) | T5-2, T5-3, T29-2 | Read vs `spec:1093-1096` | Honored |
| AC-22 | T38-26 | Read `plan:5407-5414` vs `spec:1097-1100` | Honored; the "no output without an event" clause cannot fail (m7) |
| AC-23, AC-24 | T30-2, T34-1, T35-1, T35-2; T30-1 | Read `plan:4998-5022`, `plan:5125-5165` vs `spec:1101-1113` | AC-23 honored; AC-24 **partial** — the never-triggered class is outside the proxy (S3) |
| Deferred per spec §14 phasing: AC-2a-i deny-half, AC-2a-ii, AC-2b, AC-2c skill under-fire, AC-16, AC-21 full, AC-25 | — | `plan:5513-5543` vs `spec:1122-1130` | Correctly deferred |

**Architecture decisions** (honored / violated, method = Read of the cited ranges):

| AD | Verdict | Evidence |
|---|---|---|
| AD-1, AD-7, AD-8 | Honored | `plan:2275-2302` pipeline order; exit 0 always |
| AD-2, AD-25, AD-26 | Honored | `plan:681-715` pins and floor; `plan:813-831` adapter; `plan:2397-2405` fold in one transaction |
| AD-3 | Honored | `plan:926-951`; the plan's normalization decision is recorded (D-plan-15) |
| AD-4, AD-5 | Honored | `plan:1085-1104`, `plan:1142-1147` (DDL left abridged — M11) |
| AD-6, AD-20 | Honored (marker as command pattern satisfies "a `ctxoracle` marker on each entry", `arch:1385-1386`) | `plan:2468-2479`; keying-mode detection unimplementable as written (M4) |
| AD-9 | **Honored — verified as the safe skeleton.** Question recognizer `plan:1954-1960` = `arch:751-760`; clear recognizer `plan:1961-1965` = `arch:783-786` except the "opening clause" refinement (M1); move recognizer `plan:1966-1968` = `arch:793-797`; intake `plan:2064-2068` = `arch:747-752`; catch-up `plan:2069-2082` = `arch:762-788`; deny decision `plan:2083-2089` = `arch:790-804`; hold `plan:2091-2100` = `arch:812-826`; detectors `plan:2153-2174` = `arch:819-826, 841-850`; lifetime/backstop `plan:2211-2228` = `arch:828-839, 852-867`. No question-type classifier, no Bash classifier, no per-question clear matcher, no lag estimator. | as cited |
| AD-10 | Honored in design; its structural test collides with T28-2 (SY1) | `plan:2012-2026` |
| AD-11, AD-16, AD-14, AD-15, AD-13, AD-12 | Honored | Steps 21, 20, 16, 18, 13, 14/15 vs `arch:947-1211` |
| AD-17 | **Partially violated** — the fault codes exist (`plan:1022-1030`) but three named detectors are not scheduled (S2); the wrongful-deny-rate definition is extended without a recorded decision (m3) | `plan:2581-2598` vs `arch:1219-1261` |
| AD-18 | **Violated in scope** — regret restricted to logged candidates (S3) | `plan:2407-2415` vs `arch:1301-1307`, `spec:649-666` |
| AD-19, AD-21, AD-22, AD-23 | Honored | Steps 11/19; 5/29/36 (scrubbed invocation executed this session — exit 0); §2.2; Step 29 with the §4 premise maintenance |
| AD-24 | Honored in content; the tiers' *ordering* is not executable as scheduled (S1) | `plan:2813-2872` |

---

## Critical & Serious Findings

### C1 — The Step 1 build compiles `test/**`, and three tests require fixtures under `test/build/fixtures/` that must fail to compile; `npm run build` therefore fails from Step 9 onward — **REGRESSION (introduced by the 2026-09-07 rewrite)**

**Class:** uncompilable construct in the build; every downstream test un-runnable.
**Location:** `plan:688-695` (tsconfig `"include": ["src", "test"]`, `"rootDir": "."`), `plan:473-477` (`test/build/fixtures/missing_provenance.ts # T9-2 fixture (must fail tsc)`, `trust_out_of_set.ts`, `verdict_updated_input.ts`, `verdict_updated_tool_output.ts`), `plan:4354-4364` (T9-2 "**Fails when** the fixture compiles"), `plan:4441-4450` (T11-5), `plan:4804-4815` (T24-1), `plan:2804-2806` (Step 37: "`npm run build && npm test` exits 0").

**What the plan says.** Step 1 makes `tsc -p tsconfig.json` compile everything under `src/` and `test/` into `dist/`. §5.1 places four TypeScript files under `test/build/fixtures/` whose defining property is that they do not type-check. The same `tsc` run that Step 37, T1-1 (`plan:4138-4150`) and CI (`plan:707-710`) require to exit 0 must compile those fixtures.

**How verified.** Executed in the layout reproduction (`scratchpad/layoutprobe/`, tsconfig identical in the fields the plan names, typescript 5.9.3): created `test/build/fixtures/bad.ts` containing `export const x: number = "not a number";` and ran `npx tsc -p tsconfig.json` → `test/build/fixtures/bad.ts(1,14): error TS2322 …`, exit code 2; removed the file → exit code 0. `tsc` has no per-file "expected to fail" mode; `include` is directory-wide.

**Standard violated.** Output-contract Gate C: "File paths and function names are confirmed against the current codebase, not assumed"; expert-plan Step 8 ("Can an implementer execute this step by step without making architectural decisions on the fly") — the implementer must invent an exclusion/second-tsconfig scheme the plan does not state; testing-standards core discipline ("every test must be able to fail" — T1-1 and the CI job would fail permanently instead). Provenance: round 1 built with `tsc --noEmit` and `"rootDir": "src"` with no stated `include` (`r1:575-586`), leaving the fixtures' compilation scope unspecified; the rewrite fixed the scope in the one way that provably breaks. **REGRESSION.**

**Required change.** Exclude the fixture directory from the main compilation (`"exclude": ["test/build/fixtures"]`, or a separate `tsconfig.fixtures.json` that the three compile-time tests invoke with `tsc -p … --noEmit` per fixture), state which, add the execution to §11.4, and make T1-1/Step 37 consistent with it. Re-verify the runner's source count (`plan:697-701`) still counts only `*.test.ts` files.

---

### S1 — The fixture generator, transcript fixtures, and replay harness are created at Step 38, but the Verification fields of Steps 5, 13, 14, 18, 25, 27, 28–35 and Checkpoints 1–3 require them; §9's attestation that "each checkpoint names the tests that are runnable at that point" is false

**Class:** topological inversion between step artifacts and step verifications; false attestation.
**Location:** `plan:2815-2825` (Step 38 creates `test/fixtures/generate.ts`, `test/replay/transcript_fixtures/`, `test/replay/runner.ts`), `plan:538-568` (§5.1: `repos/ # generated at test time by generate.ts`), `plan:485-487`; consumers: `plan:1003-1006` (Step 5 T5-1 "four fixture repositories"), `plan:4249-4250`; `plan:1440`/`plan:4469-4470` (T13-1 fixture `miner-hygiene`); `plan:1510-1514` (T14-1 `indexer-small`, `over-threshold-file`); `plan:1727-1729` (T18-1–T18-7 "on a store seeded from its fixture repo"); `plan:4846-4848` (T25-2 "real transcript fixture files"); `plan:2332-2338` (Step 28 T28-1/T28-3 are `test/replay/` tests, `plan:488-489`); Steps 29–35 (T29-1, T29-2, T30-1, T31-*, T32-*, T33-*, T34-*, T35-* all under `test/replay/`, `plan:490-504`); `plan:3017-3018` ("Each checkpoint names the tests that are *runnable* at that point"); `plan:3020-3022` (Checkpoint 1 runs T1-1–T12-1, which includes T5-1); `plan:3028-3031` (Checkpoint 2 runs T13-1–T20-2); `plan:3036-3041` (Checkpoint 3 runs T21-1–T28-3 and T38-1–T38-21, T38-28–T38-31).

**What the plan says.** §7's preamble (`plan:657-663`) argues the block is built before Step 28 because "every acceptance test of the block replays through the real handler binary (AD-24), so none can run before Step 28 exists" — but the same argument applies to Step 38: the harness that spawns the binary and the generator that produces every fixture repository named in `test/unit/*.test.ts` do not exist until ten steps after Checkpoint 3 and twenty-six steps after Checkpoint 1. Step 28's own Verification names two `test/replay/` tests; Steps 29–35 name only `test/replay/` tests; none can run at the step that names them.

**How verified.** Read of every Verification field and §9 as cited; grep of `generate.ts` → defined once (`plan:539`) with no `# Step N` annotation and created in Step 38 (`plan:2815`); grep of `runner.ts` → `plan:485` (no step annotation), created `plan:2821`.

**Standard violated.** expert-plan Step 8 ("**Verification** — how the implementer will confirm this step is correct *after building it*"; Dependencies "what must complete before this step") and Step 10 (a checkpoint "is a specific verification of the accumulated state at that point"); the plan's own §7 rule (`plan:648-649`, "no step names a later one") — the dependency is real but unnamed because naming it would break the sort. Provenance: round 1 had the generator at Step 40 with Checkpoint 2 at Step 19 (`r1 §9`); the collapse-hunt attacked the ordering framing but not this executability defect, so it is **new** (unreported), and the false §9 attestation is new text.

**Required change.** Move the fixture generator and the transcript fixtures to a substrate step before Step 5 (they depend only on `git` and the spawn wrapper — the wrapper itself is Step 5, so split: generator after Step 5, before Step 13), move `test/replay/runner.ts` and the hook-stream fixture directory into Step 28 (the step that creates the binary it spawns), and re-derive every Verification field and checkpoint against the corrected order. Delete or make true the sentence at `plan:3017-3018`.

---

### S2 — Three AD-17 fault detectors (`hooks_not_firing`, `index_stale`, `produced_but_undelivered`) have no implementing step and no induction test, while §2.3 maps self-observability as complete and §12.4 marks AC-9 covered

**Class:** architecture component unscheduled; false coverage claim (the round-1 S2 class).
**Location:** `plan:1022-1030` (the codes appear in `FAULT_CODES`); `plan:2280-2282` (Step 28 `SessionStart` work: dedup reconciliation, qa lifetime, staleness check, `quick_check` — no liveness row); `plan:1476-1482` (Step 14 `refreshIfStale` spawns a reindex; records no `index_stale` fault); `plan:2292-2295` (Step 28 step 9: "on audit failure nothing is emitted" — the *opposite* case, audit row written but emission failed, is not handled); `plan:2581-2598` (Step 33 `status` renders faults; no `hooks_not_firing` detection logic); `plan:171` (§2.3 self-observability → Steps 6, 10, 26, 30, 33); `plan:5527` (§12.4 "AC-9 | T10-1, T26-1, T38-6, T38-8, T33-1"); `plan:5096-5098` (T33-1 seeds "one row per fault code" — rendering, not induction).

**What the sources say.** `arch:1223-1234`: `hooks_not_firing` — "SessionStart writes a liveness row; `status` flags a session whose events stop arriving while the transcript grows"; `index_stale` — "`index_head` ≠ `HEAD`"; `produced_but_undelivered` — "audit row exists, emission failed"; each "with a stable code and a detector this architecture names". `spec:1035-1039` AC-9: "Induced hook-not-firing, latency breach, produced-but-undelivered whisper, a deny that outlives its condition, a corrupted store, and a stale index each appear in the log and `status` as a self-detected failure class".

**How verified.** grep `hooks_not_firing|liveness|index_stale|produced_but_undelivered` over the plan → 3 hits, all inside Step 6's code list (`plan:1024-1025`), plus one unrelated "liveness" (`plan:1481`, pid liveness of the reindex lock). Read of Steps 14, 28, 33 and of every AC-9-mapped test.

**Standard violated.** Output-contract §2 coverage reconciliation ("every element of the requested work mapped to implementing step(s)… Unmapped elements are non-compliance") and Gate C ("The Scope section's coverage reconciliation maps every element"); expert-plan Step 9 (every behaviour traced to a test); AC-9's own text. Provenance: round 1 listed the same codes without detectors (`r1:826-827`) and the round-1 review marked AC-9 "Honored" — **new** (unreported).

**Required change.** Add the three detectors to the steps that own their inputs (SessionStart liveness row + `status` staleness comparison → Steps 28/33; `index_stale` recorded by `refreshIfStale` → Step 14; `produced_but_undelivered` recorded when `whisper_audit.append` succeeds and emission throws → Step 28), add induction tests to §12 (replay tier), fix the §12.4 AC-9 row and the §2.3 row, and reconcile §11.

---

### S3 — The regret proxy is defined over "candidates the session held but did not deliver (bar-fail or dedup, from `session_log.candidates_json`)", which drops FR-L4's explicitly required "never triggered" class; the narrowing is unrecorded in §10

**Class:** spec fidelity — scope narrowed silently.
**Location:** `plan:2407-2415` (Step 30 `recordRegret`), `plan:5004-5007` (T30-1 data: "A held (bar-failed) fact…"), §10 (`plan:3083-3319` — no decision entry on regret scope).

**What the sources say.** `spec:649-655` FR-L4: "a fact the store **held** that would have changed a decision and the oracle did **not** speak (**below-bar, or never triggered**)". `arch:1301-1307` AD-18: "for each **store-held fact** whose subject region was re-edited or reverted in the session … while the oracle stayed silent on it" — the population is store-held facts, not generated candidates. A coupling pair the store holds for a file the agent never read (so Coupling never triggered) whose partner the agent then edits and reverts is regret under FR-L4 and AD-18 and is invisible to the plan's proxy, because no candidate was ever generated and logged.

**How verified.** Read `plan:2407-2415` (population = `session_log.candidates_json`); Read `spec:649-666`, `arch:1301-1316`; grep `never triggered` in the plan → 0 hits.

**Standard violated.** expert-plan SKILL.md:50 ("Narrowing scope is a user decision… Silent deferral of any part of the requested work is non-compliance"); Gate C coverage; CLAUDE.md rule 3 — the exit report's regret rate is a Phase A deliverable (§11.5), and a proxy blind to never-triggered facts under-reports the very "how little it catches" number, on the quiet axis the collapse-hunt named. Provenance: round 1's Step 36 used the same population (`r1:2412-2421`); unreported — **new**.

**Required change.** Define the proxy's population as AD-18 states it — every store-held fact (`cochange_pairs`, `landmines`, `human_facts`/`invariants`) whose subject or direct pair partner appears in the session's `ok` Edit/Write rows or failed covering-test rows — with the delivered set subtracted; keep the relevance test; add a never-triggered case to T30-1's fixture; record the decision in §10 if any narrowing remains.

---

### S4 — The exit report's headline number, "the fraction of human questions in the replayed corpus that the question recognizer opened", has no measurement procedure; the only derivable one shares the recognizer's blind spot

**Class:** deferred decision on the phase's central deliverable; guard-shares-the-recognizer.
**Location:** `plan:2928-2931` (Step 39 report), `plan:2962-2966` (Checkpoint 5 reviews "measured coverage"), `plan:5608-5614` (R1), `plan:3477-3488` (D-plan-9 "measured, not estimated").

**What the plan says.** The numerator (questions the recognizer opened) is measurable from the store. The denominator — "human questions in the replayed corpus" — requires ground truth the plan never defines: which corpus turns count as questions independent of the `?`-rule recognizer. No labelling procedure, no second classifier, no sampling protocol, no owner-labelled subset is named. An implementer must either (a) use the same recognizer (fraction = 1.0 by construction), (b) write a broader ad-hoc classifier (the elaboration the plan forbids elsewhere), or (c) hand-label — none stated.

**How verified.** Read `plan:2876-2970` in full; grep `denominator|label|ground truth|hand-label` in Step 39 → 0 hits. `docs/collapse-log.md:837-846` (2026-08-25 item 1): "an under-fire/backstop signal is only a guard if it is derived independently of the thing it guards."

**Standard violated.** Output-contract Gate A/C ("Can an implementer execute this step by step without making architectural decisions on the fly… No step… defers a choice to implementation time"); collapse-log 2026-08-25 item 1 (independence of the measuring signal); spec §11.5 (the exit is a *measurement*). Provenance: round 1's report said "how much the conservative answer-drift recognizer catches on real data" (`r1:2697-2699`), equally unmeasured; unreported — **new**.

**Required change.** Specify the denominator's derivation: e.g. a hand-labelled random sample of N human turns from leg 1 (N stated), labelled by the implementing agent against a written rule ("a turn that requests information or a decision from the agent"), with the sample, the rule, and the inter-rater note published in the report; state that the fraction is an estimate with its sample size; or replace the field with the two numbers the store can produce (questions opened; human turns scanned) and label the coverage explicitly as *not measured* in Phase A. Either resolves the deferred choice; the second is the more honest fit to §11.5.

---

### S5 — T32-2/T38-22 assert "no network egress" through an `HTTP_PROXY`/`HTTPS_PROXY` listener that Node's `fetch`/`http` do not consult by default, so the assertion cannot fail when egress occurs — **REGRESSION (introduced by the 2026-09-07 rewrite)**

**Class:** library-behaviour premise false; cannot-fail assertion (testing-standards anti-pattern 4).
**Location:** `plan:5079-5082` (T32-2 "egress observed by running the verbs with `HTTPS_PROXY`/`HTTP_PROXY` pointed at a local listener that records any connection"), `plan:5089-5090` ("**Fails when** … the listener records a connection"), `plan:5371` (T38-22 "the egress listener of T32-2"), `plan:2570-2571`.

**What the sources say.** Node v22.x API docs (Context7 `/websites/nodejs_latest-v22_x_api`, `cli` and `http` pages, read 2026-09-07): "When `NODE_USE_ENV_PROXY` is enabled (set to '1'), Node.js parses `HTTP_PROXY`, `HTTPS_PROXY`, and `NO_PROXY` environment variables at startup to tunnel requests over the specified proxy… can also be enabled with the `--use-env-proxy` command-line flag" — proxying from environment variables is opt-in. `spec:1087-1089` AC-19: "**no network egress** occurs during export or import (FR-X7)".

**How verified.** Executed on Node v22.22.2: a local TCP listener on 127.0.0.1; `HTTP_PROXY`/`HTTPS_PROXY`/lower-case variants set to it; `fetch('http://127.0.0.1:9/')` → `TypeError` (direct connection refused), listener never contacted; same with `NODE_USE_ENV_PROXY=1` → `[UNDICI-EHPA]` experimental warning, listener still not contacted for this loopback target. The plan sets neither the variable nor the flag.

**Standard violated.** expert-plan Step 4 ("For every library, framework, or external API the plan will use… read current documentation… There is no memory fallback") — no §11.4 entry supports the proxy premise; testing-standards ("Every test must be able to fail… A test whose assertions cannot be falsified by broken behavior is coverage theater"). Provenance: round 1's T32-2 carried no egress assertion at all (`grep PROXY|egress` over `r1` → 0 hits); the rewrite added a mechanism that reports "no egress" regardless of behaviour — a defect round 1 did not have. **REGRESSION.**

**Required change.** Observe egress at a layer the process cannot bypass: run the verbs inside a network namespace with no route (`unshare -n` / the CI container with networking disabled) and assert the verbs still succeed, or use a system-level socket audit; if a proxy listener is kept, spawn the verbs with `--use-env-proxy` *and* `NO_PROXY` empty *and* state that `node:net`/`dgram` are not covered. Add the documentation read to §11.4.

---

## Systemic Patterns

### SY1 — Built-output convention tests are specified by allow/deny lists that the same plan's steps violate, so a plan-conformant build cannot pass them — **REGRESSION (introduced by the 2026-09-07 rewrite)**

**Proactive scan.** grep `built-output grep|built-output import scan|import scan` over the plan → the six convention tests: T3-2 (`plan:4196-4206`), T5-3 (`plan:4278-4287`), T10-3 (`plan:4387-4396`), T24-2 (`plan:4817-4828`), T28-2 (`plan:4922-4931`), T36-1 (`plan:4933-4943`). Each was read against every step that produces code in its scope. T3-2, T5-3, T36-1 are satisfiable (no Phase A step imports `node:sqlite`, `node:child_process`, or `model/invoke.js` elsewhere — grep of the step texts). **Two are not (three tests):**

**Instance 1 — T24-2 vs T28-2 on `permissionDecision`/`additionalContext`/`hookSpecificOutput`.** `plan:2012-2015` and `plan:4819-4821`: the string `permissionDecision` appears in `dist/src/**` only in `blocks/verdict.js`. `plan:2264-2271`: `hook/adapter.ts` is "the ONLY file that names… the response field names (`hookSpecificOutput`, `additionalContext`, `permissionDecision`, `permissionDecisionReason`…)"; `plan:2304-2306` and `plan:4924-4925`: T28-2 greps `dist/src/**` outside `adapter.js` "for every field name listed above; no match permitted". A build satisfying T24-2 (string only in `verdict.js`, outside `adapter.js`) fails T28-2, and vice versa. Independently, `plan:1795-1797`: `src/hook/delivery.ts` `deliverStop` "places the whisper in `hookSpecificOutput.additionalContext`" — a second file naming two listed response fields. Type ownership is also contradictory: `plan:2016-2017`/`plan:407` say `types/verdict.ts` re-exports the response type from `blocks/verdict.ts`; `plan:2270-2271` says the adapter defines it.

**Instance 2 — T10-3 vs Steps 19, 20, 28.** `plan:1225-1230` and `plan:4388-4396`: no file under `dist/src/hook/**` may import `stores/dao/*`; "only `diag/*`, `blocks/*`, `genres/*`, `bar/*`, `qa/*`, `transcript/*` modules are imported there". But `plan:1785-1794`: `src/hook/delivery.ts` reads and writes `consumer_state` (a DAO, `plan:374`); `plan:1747-1749`: `src/hook/compose.ts` re-resolves commit pointers "against the store's `commits` table" (a DAO); `plan:2278-2282`: `src/hook/handler.ts` opens the project store (`stores/adapter.ts`, not on the allow-list), calls `identity/*` to locate it, `index/indexer.ts` `refreshIfStale`, and the spawn wrapper (`util/spawn.ts`) — none on the allow-list; `plan:2288-2291`: the `observed_actions` append at PostToolUse has no non-DAO wrapper module anywhere in §5.1.

**How verified.** Read of every cited line this session; grep `observed_actions` over §5.1/Steps 10, 20, 28 → no wrapper module named; grep `consumer_state` → DAO file (`plan:374`) and Step 20's use (`plan:1787`).

**Named standard.** expert-plan output-contract Gate A ("Can a reviewer check a build against this and reach a defensible conclusion about whether each step is done correctly — including whether each test was built to its specification?") — a specification two of whose tests cannot both hold leaves the reviewer no defensible conclusion; testing-standards core discipline (the failure condition "is written before the test", and here the stated failure condition is met by every correct build). Provenance: round 1's T41-1b listed only *input* field names ("`hook_event_name`, `tool_input`, `transcript_path`, etc.", `r1:2656-2659`) and T41-1a checked only that fault/session writes "go through the writers" (`r1:2653-2655`); the explicit response-field list and the six-module allow-list are new text. **REGRESSION.**

**What correct looks like (the standard's requirement, not a patch).** Each convention test states exactly the property the architecture makes structural — AD-6: one file *parses and emits* Claude Code's JSON (input field names; response construction); AD-10: one module *constructs* the deny verdict; AD-17: fault and session records are written only through the two writers — and its allow/deny set is derived from §5.1 by enumeration, so that every module a step creates under the scanned path is either permitted or the step is changed. Where a response field must be *placed* by one module and *named* by another, the specification says which string appears where, or the property is stated at the import-graph level instead of the string level.

**No other systemic pattern** was found. Scans run: `**Dependencies.**` topological check (40/40 earlier-only); every `File.` path present in §5.1 (113/113); citation resolution of every AD/V/L/FR/AC/OL/D key the plan uses (all resolve to the passage described — §11.1–11.3 spot-read at every cited range); narration vocabulary (4 hits, m1); "option set / deferred choice" vocabulary (`either … or|one of the following|alternatively|if needed|as appropriate|TBD` → 0 hits in §7; the deferred choices reported below are semantic, found by Read).

---

## Moderate & Minor Findings

### Moderate

**M1 — Step 23's clear-recognizer rule contradicts T23-2's expected outcome on the deferral-plus-substance case — REGRESSION (introduced by the 2026-09-07 rewrite).**
Location: `plan:1961-1965` ("a turn clears when its text… is at least `lengthFloorChars` characters AND does not match a deferral-stoplist phrase **as its opening clause**"); `plan:4785-4789` (T23-2: "a deferral phrase followed by a substantive body above the floor (**clears** — the phrase is matched as the opening clause only)"). Under the step's rule a turn whose opening clause is a deferral does not clear regardless of body; the test expects it to clear. AD-9 (`arch:783-786`) requires only "not a recognized content-free deferral", which the test follows and the rule tightens beyond. Verified by Read of both passages. Standard: testing-standards ("the specification states what makes it fail" — here the rule and the failure condition disagree); AD-9 fidelity. Provenance: round 1's rule said "not a recognized content-free deferral" with the same test expectation (`r1:1233-1236`, `r1:3905-3908`) — the "opening clause" tightening is new text. Required change: state the rule as AD-9 does (a deferral phrase with no substantive body above the floor does not clear; a deferral phrase followed by substance does) and make T23-2 the boundary test of that rule.

**M2 — The done-claim recognizer's "concluding position" is undefined, and T18-8's cases cannot be derived from the step.**
Location: `plan:1696-1699` ("the `lexicon.completion_claim` phrases in a concluding position of `last_assistant_message`"); `plan:4655-4662` (T18-8: "I've implemented the parser and the tests pass." fires; "Is this done?" is silent). Nothing in the plan defines "concluding position" (last sentence? last N tokens? not inside an interrogative?), and the fixture's second positive has the lexicon word mid-sentence. Verified by grep `concluding position` → Step 18 and T18-8 only; `arch:1150-1153` uses the phrase without defining it. Standard: Gate C ("defers a choice to implementation time"); Step 8 ("Name the functions… what is added"). Provenance: new (round 1 had no done-claim test). Required change: define the rule (e.g. the phrase's sentence is the final non-empty sentence, that sentence does not end with `?`, and the phrase is not negated), seed it as the rule T18-8 tests, and keep the conservative bias.

**M3 — The shared types `Candidate`, `TuningReader`, `EventContext`, `EventKind`, `HookResponse`, `Symbol`, `ImportEdge` have no creating step or file; Steps 14, 16, 18, 19, 20, 24 use them and the only plausible home (`src/types/events.ts`) is created at Step 28.**
Location: uses at `plan:1455` (`Symbol[]; imports: ImportEdge[]`), `plan:1569` (`Candidate`, `TuningReader`), `plan:1658-1659` (`EventKind`, `EventContext`), `plan:2015` (`HookResponse`); `plan:405-407` (§5.1 `types/` holds only `events.ts` — Step 28 — and `verdict.ts` — Step 24). Verified by grep (definition sites: none). Standard: expert-plan Step 8 (Dependencies "what must complete before this step"; topological order); Gate C (file paths confirmed). Provenance: new. Required change: create `src/types/candidate.ts` / `src/types/index_types.ts` (or equivalent) in a substrate step before Step 14 and annotate §5.1; make Step 28 depend on them rather than the reverse.

**M4 — Step 31's keying-mode-change detection is unimplementable as written: a store "at the same path" whose `keying_mode` differs cannot exist, because the path is derived from the key.**
Location: `plan:2462-2465` ("If a store exists at the same path whose `schema_meta.keying_mode` differs from the resolved mode…"); `plan:886-889` (path = `<home>/projects/<repoKey>/store.db`); `plan:950` (key = SHA-256 of the identity string, which differs by mode); `arch:434-435` (`schema_meta` holds `repo_key`, `keying_mode` — no repository path to search by); `plan:5049-5059` (T31-3 requires the warning). Verified by Read. Standard: Gate C (deferred decision — the implementer must invent the lookup, e.g. computing the other modes' candidate keys); AD-20 fidelity. Provenance: new (round 1 said "a prior store exists at a different keying_mode", `r1:2169-2170`, equally undefined; the "same path" wording is new but the finding class was unreported). Required change: specify the detection — compute the identity under every applicable rule (commit, URL, path), look for an existing store at each derived key, and warn when one exists under a mode other than the resolved one.

**M5 — `init`/`deinit` leave the settings-file mechanics unspecified where AC-7 and T31-2/T32-1 depend on them: creation of `.claude/settings.json` (and `.claude/`) when absent, its removal on `deinit`, and byte-preserving edits of an existing file.**
Location: `plan:2468-2479` (writes entries; silent on file creation), `plan:2528-2531` (`deinit` "leaves… the rest of the file untouched"; silent on removing a file `init` created), `plan:5044-5047` (T31-2 "**Fails when** … any other byte of the file changes"), `plan:5067-5073` (T32-1: tree diff after `deinit` must be exactly the removed wiring), `plan:5030-5031` (T31-1's fixture always has a pre-existing file, so the create case is untested), `spec:1015-1016` AC-7. A `JSON.parse`/`JSON.stringify` rewrite changes whitespace and cannot satisfy "any other byte"; a file `init` created and `deinit` leaves as `{"hooks":{}}` fails AC-7. Verified by Read. Standard: Gate C (deferred choice); AC-7. Provenance: new. Required change: state the editing strategy (parse, edit, re-serialize with the detected indentation and a trailing newline; if the file did not exist, `deinit` removes it and an empty `.claude/` directory it created), and add the no-file case to T31-1/T32-1.

**M6 — T3-3 and T29-1 are timing-dependent as specified and cannot be deterministic.**
Location: `plan:4208-4222` (T3-3: A holds `BEGIN IMMEDIATE` for 250 ms, B "writes during it", B must succeed after exactly one retry, a third write "issued while B is in its retry window" must raise `StoreBusy`); `plan:819-822` (`busy_timeout` 100 ms, retry once → B waits at most ~200 ms, so B succeeds only if it starts ≥ 50 ms into A's hold — the start offset is unstated); `plan:4979-4986` (T29-1: slow fake at 2400/2500/2600 ms against a 2500 ms cooperative deadline checked *between* slices, "**Fails when** … the 2400 ms case is cut short" — process start, parse and store open add tens of ms, and the 2500 ms case sits exactly on the boundary). Verified by Read and arithmetic. Standard: testing-standards ("Deterministic setup and teardown; a flaky… test is treated as broken"; anti-pattern 10). Provenance: new. Required change: state B's start offset (e.g. B starts at 120 ms; the third write at 230 ms) and derive the expected outcomes from the 100 ms + one-retry arithmetic; in T29-1 test the deadline with a margin (e.g. 1800 / 3200 ms) and measure `latency_breach` presence, not a wall-clock boundary.

**M7 — T38-25 (AC-20) is "invoked from CI's clean container job", but no step defines such a job.**
Location: `plan:5396-5397`; `plan:707-710` (Step 1's workflow: `npm ci`, `npm run build`, `npm test` on a two-entry Node matrix, nothing else); `plan:2835-2838`, `plan:2865-2869` (Step 38 runs the script "in a clean container" without naming the workflow, image, or trigger). Verified by grep `container` over Steps 1 and 38. Standard: Gate C (file paths confirmed; no deferred choice); Step 8 Verification ("What to run"). Provenance: new. Required change: add the job to Step 1's workflow (image, network policy, trigger) or a named second workflow, and annotate §5.1.

**M8 — The detached `quick_check` child spawned at `SessionStart` has no entry point in the CLI verb set.**
Location: `plan:2280-2282` ("detached `quick_check` child (Step 3 via the wrapper)"); `plan:2454-2457` (dispatch verbs: init, deinit, index, status, log, correct, note, tune, export, import, hook); `plan:2528-2540` (Step 32 verbs) — none runs an integrity check; `arch:1229-1231` requires it "in a detached child spawned after `SessionStart`". Verified by grep `quick_check` (6 hits, none defines a verb). Standard: Gate C (deferred choice: what command does the child run?). Provenance: new. Required change: name the internal verb (e.g. `hook integrity-check`, undocumented like `hook <event>`) in Step 32 and §5.1, and its diagnostic on failure.

**M9 — §2.3 omits the architecture's in-scope "CLI surface" and "packaging" elements, so its closing attestation ("Nothing is unmapped") is false.**
Location: `plan:165-179` (rows: genres, block, stores, delivery, self-observability, security, human channel, seams, guard, test architecture, exit run); `arch:71-73` in-scope list: "CLI surface (`init`/`deinit`/`index`/`status`/`log`/`correct`/`note`/`export`/`import`), packaging, test/fixture architecture". Steps 31–33 (`init`, `deinit`, `index`, `hook`, `export`, `import`, `status`, `log`, `tune`) and Step 1 (packaging) appear in no §2.3 row. Verified by Read of the table. Standard: output-contract §2 coverage reconciliation / Gate C. Provenance: round 1's §2.3 lacked the same rows — unreported, **new**. Required change: add the rows.

**M10 — Step 39 leg 2 presents an option set ("or any other code repository of his") and states "at least two" repositories while the validity rule and D-plan-10 require "at least one"; leg 1's reconstruction mechanics are left to the implementer beyond what G4 acknowledges.**
Location: `plan:2895-2903` ("**at least two**… `Maxcogar/NOVA`, … `Maxcogar/Turbine-Studio`, or any other code repository of his"); `plan:2914-2917` (validity rule: "at least one repository that is not the tool's own"); `plan:3214-3218` (D-plan-10: "at least one non-tool repository"); `plan:2884-2889` (leg 1: "cloned at the commit the transcript's `cwd` was on where a `.git` is reachable" — how the commit is recovered from a transcript, from where the clone is taken, and what "reachable" means are unstated; G4 at `plan:5923-5930` covers only the entry-to-event correspondence). Verified by Read; the five named repositories re-checked with `list_repos` (all present, dates match). Standard: Gate C ("No step anywhere in the plan presents alternatives to the implementer… Zero tolerance"). Provenance: new. Required change: name the two repositories (the rule may stay a property), make the minimum consistent in all three places, and either specify leg 1's repository recovery (e.g. `cwd` must exist on the exit-run machine with its `.git`; the transcript's `gitBranch` field is used; otherwise path-keyed) or extend G4 to cover it.

**M11 — Step 7 defers the concrete DDL: "verbatim to the abridged schema in AD-4's Decision block (with column types resolved to their SQL forms)" leaves every elided column, every SQL type, every index beyond `q_open_dedup`, and the FTS5 table definitions to the implementer; Step 9 names 22 DAO files and no method surface.**
Location: `plan:1085-1104` (Step 7), `plan:1164-1178` (Step 9: "Each DAO exposes prepared-statement-backed methods returning typed rows or void"), `arch:423-424` ("abridged to columns that carry requirements"). Verified by Read. Standard: expert-plan Step 8 ("Name the file paths. Name the functions. Name the types."); Gate A. Provenance: new. Required change: include the full DDL in Step 7 (or a named appendix section), and for Step 9 the method list per DAO that later steps call (the plan already names some: `whisper_audit.append`, `questions` via Step 22).

### Minor

**m1 — Narration of prior versions and editorial self-corrections remains.** `plan:3095-3098` (D-plan-1: "Ordering (B) also removed two latent inversions of the earlier order: the recognizers read `tuning` rows through a DAO that was scheduled eleven steps later, and `init` invoked an `index` verb scheduled one step later"); `plan:5864-5875` (§14.4 pass 1 lists six editorial fixes — missing `Verifies` fields, an abbreviated path, a `T38-*` range, a duplicated file, a `const enum`, a missing §11.4 entry — none of which is a register entry). Standard: Gate C ("No internal reasoning artifacts, self-corrections, or scratchpad content remain"); output-contract §14 asks for the pass count and entries added, not the edit log. Provenance: new. Required change: keep "Pass 1 added Q31, Q32; pass 2 added zero"; delete the edit narration and the D-plan-1 sentence.

**m2 — The 31 T38-* entries in §12.3 do not each carry the Level and Real/doubles fields; they inherit them from a preamble.** `plan:5169-5173`; output-contract line 36 ("each carrying all five fields") and Gate C ("Every test specification… has all five fields"); the technique-grouped-set allowance (SKILL.md:330) covers "the boundary-value cases of one function", not 31 acceptance tests. Provenance: new. Required change: state the two fields per entry (one line each).

**m3 — The wrongful-deny rate gains a fourth component ("voided-intake rows with a deny fired") and `voidQuestion` gains a `denyFired` flag, extending AD-17/AD-9 with no §10 decision.** `plan:2587-2589`, `plan:1914-1917`, `plan:2921-2924` vs `arch:1259-1260` (three components); §10 has no entry. Standard: output-contract §10 ("judgment calls the planner made… This is the frame-correctness proof"); fidelity ("nothing added beyond what they say to build" — small, owner-facing, but unrecorded). Provenance: new. Required change: record it as a D-plan entry with the L11(b) rationale, or drop it.

**m4 — Step 15's library-API and package-layout claims have no §11 entry.** `plan:1524-1526` ("`tree-sitter-wasms/out/<lang>.wasm` (the package's documented output directory, V14)"), `plan:1544-1547` ("`Parser.init`, `Language.load`, `parser.parse`, verified at build"). V14 (`arch:138`) says nothing about `out/`; §11.4 (`plan:3968-3976`) records only `npm view` metadata. Both claims are in fact true — Read of the installed `web-tree-sitter@0.26.13` `web-tree-sitter.d.ts` (`export class Parser { static init(…) … parse(…) }`, `export class Language { static load(…) }`), `tree-sitter-wasms@0.1.13` `package.json` (`"files": ["/out"]`, no `exports` map) and executed `import.meta.resolve('tree-sitter-wasms/out/tree-sitter-typescript.wasm')` → resolves — but the plan asserts them without evidence and defers verification to build. Standard: expert-plan Step 4 (documentation read before design; "there is no memory path"); Gate C (every factual claim has a §11 entry). Provenance: new. Required change: add the two reads to §11.4.

**m5 — "the absolute path of the running ctxoracle binary" is undefined, and the marker pattern requires that path's basename to be `ctxoracle`.** `plan:2469-2474`. `process.argv[1]` keeps a symlink's name (executed: `node /tmp/argvtest/bin/ctxoracle` → argv[1] `/tmp/argvtest/bin/ctxoracle`), `fs.realpathSync(process.argv[1])` would yield `…/dist/src/cli/dispatch.js` and never match `/(^|[\\/])ctxoracle hook <event>$/`. Standard: Gate C (deferred choice with a T31-1/T32-1 consequence). Provenance: new. Required change: state `process.argv[1]` un-resolved (or the `npm`/`npx` bin link) and add the basename check to T31-1.

**m6 — §12.4 maps AC-13's "a stale fact lowers confidence without blocking" to T16-1 "(staleness dampening)", but T16-1's data has no stale-fact case.** `plan:5531` vs `plan:4525-4528`; `spec:1063-1065`. Standard: Step 9 traceability. Provenance: new. Required change: add a staleness-dampened candidate to T16-1 (or a T14-1 case) and the failure clause.

**m7 — T38-26's first failure clause ("any output appears without an event") cannot fail by construction under AD-1 (no process exists without an event).** `plan:5407-5414`. Standard: testing-standards anti-pattern 4. Provenance: new. Required change: assert instead that no store or diagnostics write and no lingering `ctxoracle` process exists across the gap, then the boundary event fires normally.

**m8 — The exit report is routed to `docs/reviews/<date>-phase-a-exit-run.md`, which CLAUDE.md reserves for "Output of a review? Written once, never edited"; the routing choice is not in §10.** `plan:2919`, `plan:5944-5945`; CLAUDE.md routing table and rule 4 ("A new file is almost never the answer"). Standard: CLAUDE.md information policy ("Name the target file and the test it passes before writing"). Provenance: new (round 1 used the same location, unreported). Required change: decide the home (a `docs/exit-runs/` directory is a new-file decision that needs its own justification; `docs/reviews/` needs the membership test argued) and record it as a D-plan entry.

**m9 — Step 39 does not say how agent-driven leg-2 sessions are launched; a session started through the oracle's own spawn wrapper carries `CTXORACLE_INTERNAL=1` and the handler exits 0 in it, zeroing the measurement silently.** `plan:2901-2904`; `plan:953-960` (every child of `oracleSpawn` gets the variable); `plan:2355-2356` and `plan:4988-4996` (the guard exits 0, no store write). Standard: CLAUDE.md rule 1 (a falsely reported result — here a false zero) and Gate C. Provenance: new. Required change: state that leg-2 sessions are launched by `scripts/exit-run.sh` (a shell script outside the oracle's code) or by the agent's own tooling with `CTXORACLE_INTERNAL` unset, and that the report asserts the variable's absence in those sessions' environments.

**m10 — §5.1 leaves `test/fixtures/generate.ts`, `test/replay/runner.ts`, `hook_stream_fixtures/`, and `transcript_fixtures/` without a `# Step N` annotation, contrary to §5.1's rule ("Every source file below is created by exactly one §7 step"); Step 38's Verification says the replay runner executes "T38-1–T38-33 (every entry of §12.3)" although T38-25, T38-32, T38-33 are scripts the runner does not execute.** `plan:306-310`, `plan:485-487`, `plan:539-540`, `plan:2865-2869`, `plan:5396-5397`, `plan:5476-5477`, `plan:5489`. Standard: Gate C (reconciliation). Provenance: new. Required change: annotate the four entries (Step 38, or the step S1's fix moves them to) and state the runner's range as T38-1–T38-24, T38-26–T38-31.

**m11 — `decideDeny(store, consumer, toolName)` must record "the target `file_path`/`notebook_path` in `evidence_json`" but receives no tool input.** `plan:2083-2089`. Standard: Step 8 ("Name the functions"; the signature cannot deliver the stated behaviour). Provenance: new. Required change: add the tool-input (or target path) parameter and reflect it in T25-3 (`plan:4867-4868`).

---

## Tentative Findings

**T1 — The claim that CodeGraph and Clear Thought were run over stdio during planning (`plan:4029-4048`, Q26 `plan:5803-5805`, `docs/STATUS.md:29-33`) is not verifiable from the repository.** The plan records tool names and a count ("43 `sequential_thinking` thoughts and 5 scored `decision_framework` evaluations") but no trace artifact; `mcp-servers/codegraph-mcp/` exists and `.mcp.json` names `clear-thought`, so the servers are plausibly runnable, and the §11.6 CodeGraph outputs are specific (`totalFiles: 1, totalDocFiles: 71, parseErrors: 0`). Verification gap: re-running `codegraph_scan` on `middleware/context-oracle/` and comparing the counts would confirm the CodeGraph half; nothing can confirm the Clear Thought trace. ER-S3's closure above rests on this attestation.

**T2 — Behaviour at the Node 22.16.0 floor** (`fs.readdirSync(…, {recursive: true})`, `import.meta.resolve`, `node --test` glob handling, `node:sqlite` API surface) is asserted from the v22.x API pages and executed only on v22.22.2 (`plan:3928-3937`); this reviewer's machine also has only v22.22.2. Verification gap: an execution on a 22.16.0 binary (CI's matrix entry) — the plan assigns this to CI, which is honest, but it means every "at the floor" claim is unexecuted until Step 1 runs in CI.

No other tentative findings — every other finding's premise was verified per Gate B.

---

## Observations

- **Multi-perspective check (manual; Clear Thought unavailable).** Standards persona: the Gate C reconciliation defects (C1, S1, SY1, M3, M7, M8, M9, M11, m10) are all of one shape — a rule or list stated in one place and violated by the plan's own content elsewhere — which the author's reconciliation script (`2026-09-07-author-gates-review.md:17`) could not see because it cross-checks IDs and paths, not semantics. Implementer persona: the first blocking event is C1 at Step 9 (the first must-fail fixture), then S1 at Step 5's verification; nothing before Step 5 is affected. Owner persona: the plan's answer-drift content is exactly the skeleton Max Cogar asked for (verified above), and the defects in this round are build/test mechanics, not scope drift — the failure mode the 2026-09-04 entry names did not recur in Steps 21–27.
- The Step 36 scrub contract was exercised here: with every `CLAUDE_*`/`ANTHROPIC_*` variable removed and `CTXORACLE_INTERNAL=1`, `claude -p --model claude-haiku-4-5 --tools "" --max-turns 1 --output-format json` returned exit 0, `stop_reason: end_turn`, a fresh `session_id`, and the envelope fields Step 36 types (`total_cost_usd`, `usage`, `modelUsage`, `permission_denials`, `terminal_reason`). The plan's §11.4 entry (`plan:4000-4010`) records only the un-scrubbed run; adding the scrubbed run would close the gap between the contract and its evidence (not a finding: the contract is stated as a build-time property and holds).
- The proxy probe with `NODE_USE_ENV_PROXY=1` did not route a loopback target through the listener either; if a proxy listener is kept after S5's fix, the target must be non-loopback and `NO_PROXY` must be explicitly empty.

---

## What's Actually Good

- **Steps 21–27 are the AD-9 safe skeleton and nothing more.** Property: every recognizer, the intake, the catch-up, the deny decision, the hold, the four detectors, the lifetime rules and the Stop-time backstop transcribe `arch:747-879` without a question-type classifier, a Bash classifier, a per-question clear matcher, or a lag estimator; T23-1 (`plan:4762-4777`) asserts the non-coverage set. Standard: spec §11.5 / D-41 ("a skeleton, not 'the block working'"), CLAUDE.md rule 3. Verified by the line-by-line Read recorded in the Upstream table's AD-9 row.
- **The lag-window hold is the read-to-EOF consequence, not a mechanism.** Property: `plan:2091-2100` and D-plan-9 implement FR-B1's lag clause exactly as `arch:812-826` states it, and T25-3/T38-4/T38-5 pin hold → recover → `deny_after_answer_lag`. Standard: collapse-log 2026-08-25 item 5 (the lean for the not-yet-consistent window specified separately, the self-recovering error preferred). Verified by Read.
- **Every external premise the plan re-verified on 2026-09-07 checks out.** Property: the hooks reference's timeout clause ("A timed-out `command`… hook doesn't block the tool call. The call continues through the normal permission flow"), the `transcript_path` caveat, the command-hook fields (`command`, `args`, `async`, `asyncRewake`, `shell` + `type`, `if`, `timeout`, `statusMessage`, `once`), `SessionStart` sources, `UserPromptSubmit`'s description; TypeScript 7.0's removed options and 2026-07-08 date; SQLite's four VACUUM sentences; the Node changelog lines; every registry version and date; the 41-repository listing — all re-read at the primary source this session and found as the plan states them. Standard: expert-plan Step 4 / output-contract §11 documentation-read evidence. Verified by WebFetch, curl, Context7, `npm view`, `list_repos` (recorded in Scope).
- **The count-guarded compiled-test runner closes the vacuous-pass class.** Property: `plan:697-705` refuses an empty or mismatched compiled set; `node --test` on an empty glob exits 0 (re-executed here: `# tests 0`, exit 0). Standard: testing-standards anti-pattern 4. Verified by Read and execution.

---

## Convergence Record

- **Round number:** 2.
- **Trajectory (expert-review series):** R1: 10 (3 Serious, 5 Moderate, 2 Minor) → R2: 29 (1 Critical, 5 Serious, 1 Serious-Systemic, 11 Moderate, 11 Minor). The round-1 collapse-hunt's 13 items are counted in the closure table, not in the trajectory.
- **Flow counts this round:** prior findings closed 10 of 10 (plus 13 of 13 collapse-hunt items; ER-S3 closed on attestation); new findings 25; regressions 4 (C1, S5, SY1, M1).
- **Tripwire evaluation:** condition (a) new + regression ≥ closed for two consecutive post-fix rounds: this round 25 + 4 = 29 ≥ 10 — **holds for one round**; a second consecutive round is required. Condition (b) total not strictly decreasing for two consecutive post-fix rounds: 10 → 29 is a non-decrease for one round; a second is required. **Tripwire: not fired** (one post-fix round only). The arithmetic is recorded so round 3 can evaluate it: if round 3's new + regression ≥ its closed count, or its total is ≥ 29, the tripwire fires and Recommended Priority must open with foundational rework.
- A note on why the count rose without the tripwire firing: 19 of the 25 new findings are Gate C reconciliation defects in build/test mechanics that round 1 did not examine (its inventory Read the plan in ranges and checked AC coverage, not buildability), and 9 of them are in text the rewrite introduced (Steps 1, 37, 38, the §12 rewrite). The answer-drift content converged; the test architecture did not.

---

## Open Findings Ledger

Not applicable — no operator-directed cycle stop.

---

## Recommended Priority

1. **C1** — the build must compile; fix the fixture-compilation scope first, because every later verification is red until it is.
2. **S1** — re-order the fixture generator, transcript fixtures and replay harness so every Verification field and checkpoint is executable where placed; re-derive §9 (this is a re-derivation of the test-tier ordering from AD-24, not a patch — the current order was chosen for restraint pressure, which the reorder preserves).
3. **SY1** — re-derive the three convention tests' allow/deny sets from §5.1 and AD-6/AD-10/AD-17 as stated above.
4. **S2, S3, S4, S5** — the four fidelity/coverage defects: schedule the three detectors; widen the regret population to AD-18's; define the exit number's denominator or demote the field; replace the egress listener with an observable no-network condition.
5. **M1–M11**, then **m1–m11** — mechanical once the above are settled; M3 and M11 are on the critical path of the type-level compile.

---

## What could not be checked

- The existence of the Clear Thought trace and the CodeGraph run during planning (Tentative T1).
- Behaviour at the Node 22.16.0 floor (Tentative T2).
- Whether Max Cogar's local machine holds a transcript corpus (`plan:5914-5921`, G3) — runtime-only, as the plan says.
- Whether the harness tolerates unknown fields in a hook entry — the hooks page is silent (WebFetch, section 3), which is exactly the premise D-plan-6 rests on; not a finding, recorded as confirmed silence.

---

Verdict: NEEDS FIXES (29 findings: 1 Critical, 5 Serious, 1 Serious-Systemic, 11 Moderate, 11 Minor)
