# Independent review — corrections 0.4.0, round 2

Reviewer: `rev-0400-r2` (fresh dispatch; no retained context from round 1 or from any 0.3.0 round).
Target: branch `claude/edt-corrections-0.4.0`, commits `a903b12..908d9b7` (9 commits),
diff against `origin/main` restricted to `claude-plugins/expert-dev-tools/`.
Plugin version under review: `0.4.0` (`.claude-plugin/plugin.json`, Read at HEAD).
Round: **2** (Post-fix review of round 1's six findings).
Date: 2026-08-21.

---

## Scope and Inventory

Post-fix inventory, constructed from the four Step 2 sources.

All paths repo-relative to `claude-plugins/expert-dev-tools/` unless absolute.

### Source 1 — the prior review's full inventory

- [x] `.claude-plugin/plugin.json` — Read in full; version `0.4.0`, no `hooks` key.
- [x] `hooks/continuation-gate.mjs` — Read in full, 1-209.
- [x] `hooks/hooks.json` — Read in full, 1-16; single `Stop` matcher, no tool-use hook.
- [x] `scripts/preflight-deployment.mjs` — Read in full, 1-247.
- [x] `scripts/ledger.schema.json` — Read at 1-55 (`required` list, `phase` enum,
  `task_verbatim` description) plus the full 908d9b7 diff.
- [x] `scripts/validate-ledger.mjs` — executed against the live repo ledger
  (exit 1, `missing required property 'task_verbatim'`), unpiped so the exit code is the
  script's own.
- [x] `workflows/expert-lifecycle.js` — Read at 580-601, 676-690, 770-880, 940-1009;
  grep-verified for `impl2` (1 hit, a comment), `task_verbatim` (2 hits),
  `LEGACY_VERBATIM_PREFIX` / `haveOwnerWords` (call sites enumerated below),
  `closeout|delta.phase` (26 hits, all inspected).
- [x] `commands/expert.md` — full 0.4.0 diff Read; grep `task_verbatim`, 6 hits at
  `:30, 32, 59, 64, 78, 102`.
- [x] `tests/structural/check-structure.mjs` — **executed** (402 `ok`, 0 failures);
  Read at 1225-1310; grep `COMPARED_TREES|COMPARED_FILES` (0 hits),
  `haveOwnerWords|LEGACY_VERBATIM|pre-0.4.0` (4 hits Read in context).
- [x] `tests/unit/run-unit-tests.mjs` — **executed** (43 `ok`, 0 failures);
  Read at 156-170.
- [x] `agents/expert-corrector.md`, `agents/expert-implementer.md`,
  `agents/expert-reviewer.md`, `agents/expert-verifier.md` — full diffs Read; the
  verifier's job-5 and deferral-scan contracts cross-checked against the orchestrator's
  actual dispatch prompts (`expert-lifecycle.js:929`, `:517`).
- [x] `skills/expert-correct/SKILL.md`, `skills/expert-implement/SKILL.md`,
  `skills/expert-review/SKILL.md`, `skills/expert-spec/SKILL.md`,
  `skills/expert-standard/SKILL.md` — full diffs Read; the failure-signal list
  enumerated by `awk` over the section (8 entries, listed in F4).
- [x] `tests/fixture/continuation/**` (6 fixtures) — `no-gate` and `closeout` Read in
  full and **executed against**; the rest exercised by the T-30 fixture-validity checks.
- [x] `tests/fixture/deployment/**` (6 fixtures) — **executed against** directly
  (`current-config`, `stale-config`, `worktree`), not only via the shipped pins.
- [x] `docs/specs/spec-expert-dev-tools.md` — §2 amendment and the §closing update Read
  in full via diff.

### Source 2 — the fix diff (commit `908d9b7`)

`commands/expert.md`, `hooks/continuation-gate.mjs`, `scripts/ledger.schema.json`,
`scripts/preflight-deployment.mjs`, `tests/structural/check-structure.mjs`,
`tests/unit/run-unit-tests.mjs`, `workflows/expert-lifecycle.js`, and two new
continuation fixtures (`closeout`, `invalid`). All Read above.

### Source 3 — fix-diff dependents

- [x] `hooks/continuation-gate.mjs` imports `validate` from `scripts/validate-ledger.mjs`
  (`:50`) — the import is a new coupling introduced by the F2 fix; both sides Read, and
  the coupling exercised by execution (the schema-invalid allow path fires on the live
  ledger).
- [x] `scripts/ledger.schema.json` is consumed by the hook (`:74-76`), by
  `validate-ledger.mjs`, and by the structural tier — all three exercised.

### Source 4 — the prior round's findings as closure items

F1–F6 from `docs/reviews/corrections-0.4.0-round-01.md`, each re-derived from current
source and **re-verified by execution**, never by reading the fix. Dispositions in the
Convergence Record.

### Tool plan (Step 3)

| Claim type | Instrument | Availability |
|---|---|---|
| Literal-content | `Read` at file:line | available |
| Absence / scope | `Grep` with query + count | available |
| Behavioral (hook, preflight, validator) | direct execution on constructed stdin / scratch registries | available |
| Behavioral (oracle strength) | mutation probes on scratch copies | available |
| Platform-behavior (hook auto-discovery, Stop exit 2, `cwd` vs `${CLAUDE_PROJECT_DIR}`) | `WebFetch` of `code.claude.com/docs` | available, **partially degraded** — see below |
| Structural / blast radius | grep of definition + call sites | available (CodeGraph not used; the coupling surface is three files) |
| Provenance of a finding (new vs regression) | `git log -S` per symbol | available |

**Instrument degradation, disposition recorded.** `WebFetch` resolved
`code.claude.com/docs/en/plugins-reference` (hook auto-discovery — confirmed) and
`code.claude.com/docs/en/hooks` (Stop exit-2 semantics and the `cwd` /
`${CLAUDE_PROJECT_DIR}` divergence — both confirmed verbatim). Four separate fetches
(`/en/hooks`, `/en/hooks#stop`, `/en/hooks.md`, `/docs/llms.txt`) failed to return the
Stop event's own input-field schema; two reported `stop_hook_active` absent from the
page while also reporting truncation before that section. This is an **isolated gap on
one claim**, not a whole instrument class unavailable for a load-bearing claim category
(the platform claims this review actually rests on — auto-discovery, exit-2 semantics,
`cwd` divergence — were all resolved). Per the Step 3 bright line the affected claim is
demoted to tentative rather than halting the review; it appears in Tentative Findings.

No rigor waivers. The operator directed no compression.

**Mutation-probe isolation.** Every mutation ran on a `cp -r` scratch copy of the plugin
under the session scratchpad, or on scratch registries/roots built there. The working
tree was never mutated; the probes are reproducible from the commands recorded below.

### Execution results at HEAD

| Tier | Command | Result |
|---|---|---|
| Structural | `node tests/structural/check-structure.mjs` | exit 0 — **402 `ok`, 0 failures** |
| Unit | `node tests/unit/run-unit-tests.mjs` | exit 0 — **43 `ok`, 0 failures** |

Counts were taken by executing both tiers and counting `^ok` and `^(not ok|FAIL)` lines
in this reviewer's own run. The fix commit's message claims "Structural 380->402, unit
27->43"; the 402/43 figures reproduce, but they are reported here because they were
observed, not because the message asserted them.

### Mutation battery on the ROUND-1 FIX code (oracle strength of the fixes)

Round 1 probed the original seven controls. This round probes the *fixes*: if a fix is
correct but unpinned, it regresses unobserved. Each probe replaced exactly one fix with
its pre-fix behavior on a scratch copy, asserted the source text actually changed
(a `MUTATION-NOOP` guard aborts the probe otherwise), then re-ran both tiers.

| Probe | Mutation | Structural | Unit | Verdict |
|---|---|---|---|---|
| N1 | `projectRoot` ignores `CLAUDE_PROJECT_DIR` (F1 reverted) | fail | fail | caught |
| N2 | schema-validity allow branch disabled (F2 reverted) | fail | fail | caught |
| N3 | `STALE_MS` set to `1e15` (staleness axis neutered) | fail | pass | caught |
| N4 | `COMPARED_TREES = []` (F3 reverted to manifests only) | fail | pass | caught |
| N5 | `Array.isArray` registry guard removed (F5 reverted) | fail | pass | caught |
| N6 | `main()` catch-all removed (crash exits 1 again) | fail | pass | caught |
| N7 | legacy sentinel accepted as owner words (F6 reverted) | fail | pass | caught |

**7/7 caught.** No probe was a no-op. This is the strongest result in this codebase's
recorded history against its own measured pattern of pins that fail open, and it is the
basis for the positive assessment below.

---

## Summary

**This review returns NEEDS FIXES.** All six round-1 findings are closed — every one
re-verified by executing the artifact against real inputs, including this repository's
own live ledger and the installed plugin cache, and every one backed by a pin that
demonstrably fails when the fix is reverted. That is a genuine, well-engineered fix
round, and the convergence tripwire does not fire.

The four findings below are smaller in kind than round 1's and three of them were
introduced by the fix commit itself. The pattern in all three is the same and worth
naming plainly: where round 1's defects were *controls that did not work*, round 2's
are *controls whose coverage quietly narrowed while being repaired*. The continuation
gate acquired an exemption for a whole lifecycle phase that still performs real work,
and the exemption does no work on the case it was added to fix — proven by mutation.
The preflight's staleness verdict now rests on a constant that no test references, and
on a tree walk that silently swallows a directory-read failure while its own comment
three lines above claims it throws. Each was established by execution, not by reading
the fix.

---

## Upstream Contract Verification

Governing upstream artifacts: the spec (as amended 2026-08-20), the seven correction
drafts in `docs/diagnostics/corrections-0.4.0/`, and the round-1 review's finding set.

| Contract item | Status | Verification method |
|---|---|---|
| Spec §2 amendment authorizes a Stop-event hook that blocks no tool use | **honored** | Read of the spec diff (amendment dated 2026-08-20, attributed to owner decision, citing the diagnosis and its 6 occurrences); Read of `hooks/hooks.json` 1-16 — one `Stop` entry, no tool-use matcher. The §closing text was updated consistently ("out-of-band TOOL-USE enforcement"), so the two statements no longer contradict. |
| The hook is discoverable without a `hooks` key in the manifest | **honored** | `.claude-plugin/plugin.json` Read in full — no `hooks` key. Platform docs (`code.claude.com/docs/en/plugins-reference`, fetched 2026-08-21): "Hooks \| `hooks/hooks.json` \| Hook configuration" in the default-location table; "plugins will automatically load hooks from `hooks/hooks.json` without any manifest entry needed." |
| Stop hook exit 2 continues the conversation and feeds stderr back | **honored** | Platform docs (`code.claude.com/docs/en/hooks`, fetched 2026-08-21), exit-code-2 table: "`Stop` \| Yes \| Prevents Claude from stopping, continues the conversation". The script exits only `0` or `2` (`:52-53`, `:191`, `:200`, `:204`). |
| Spec §3.4 seven gate types remain exhaustive and are named at the halt point | **honored** | Executed the hook against a fresh mid-phase fixture; observed stderr enumerates all seven verbatim (intent, spec_traceable, business, risk_override, non_convergence, core_approval, control_fault). |
| agent-quits-midtask §4.1 rule 2 (no ledger → allow) | **honored** | Executed: a root with no ledger exits 0. `projectRoot` now prefers `CLAUDE_PROJECT_DIR` (`:85-90`), so the rule is evaluated at the correct root. |
| agent-quits-midtask §4.1 rule 3 (finished lifecycle → allow) | **honored, with over-reach** | Executed against the live repo ledger → exit 0. But the exemption was widened to a whole phase; see F1. |
| agent-quits-midtask §4.1 rule 5 (mid-phase, no open gate → block with reason) | **honored** | Executed a fresh, schema-valid, all-escalations-resolved `implement` ledger at a scratch root → exit 2 with the full reason. The gate did not become inert. |
| opining-without-reading-source header contract: prevent "a live test run against a provably-stale cache" | **honored for the round-1 case, incomplete in coverage** | Re-ran round-1's exact probe (gut `workflows/expert-lifecycle.js`, stub `skills/expert-standard/SKILL.md`, delete `scripts/validate-ledger.mjs`, manifests byte-identical): now **`VERDICT: STALE`, exit 1**, naming all three divergences. See F2/F3 for the residual coverage gaps. |
| opining-without-reading-source: exit contract (0 CURRENT, 1 STALE, 2 unreadable) | **honored** | Four malformed-registry probes executed (non-array entry, top-level array, `plugins: null`, unparseable JSON) — all four `VERDICT: UNREADABLE`, **exit 2**. |
| premature-completion C2 (completed status accounts for every plan step, on every path) | **honored** | grep `impl2` in `expert-lifecycle.js`: 1 hit, `:817`, inside a comment. Read `:821` — the re-implementation binds into `impl`; `:866` and `:876` read that same variable. The amend path additionally gained a halted-amendment guard at `:811-815`. |
| patching-instead-of-rederivation C2 (sweep re-executed same-round, independently, fail-closed) | **honored** | Read `:513-529` and the verifier's job-5 contract in `agents/expert-verifier.md`; the orchestrator's dispatch prompt at `:517` matches the agent contract. `SWEEP_UNVERIFIED` on a missing channel or short return. |
| role-boundary C2 (findings-shape guard before findings flow anywhere) | **honored** | Executed: the unit tier's T-U3 block (9 assertions) exercises `findingShapeFault` on `fix`/`recommendation` keys, over-bound fields, prescription phrases, non-string types, and the clean and empty cases — all observed passing. |
| instruction-reinterpretation (`task_verbatim` required, carried end to end, migration path) | **honored** | Read `expert-lifecycle.js:584, 591-592` and the consuming gate at `:682-684`; the sentinel prefix in `commands/expert.md:65` matches `LEGACY_VERBATIM_PREFIX` exactly. N7 proves the pin fails when the sentinel is accepted as owner words. |
| Verifier job count and contracts match the orchestrator's dispatches | **honored** | `agents/expert-verifier.md` frontmatter `jobs: 5` and prose "**5**"; the deferral scan the agent file references is genuinely present in the orchestrator prompt (`expert-lifecycle.js:929`, Read in full), and `T-2b` pins `jobs:` against the distinct dispatch-label count by execution. |

---

## Critical & Serious Findings

No Critical findings — the full inventory was Read or Grep-verified per Compliance
Gate B, both tiers and every round-1 probe were re-executed, and no violation of
Critical classification was observed.

### F1 — The continuation gate exempts `closeout`, a phase that still writes the report, commits, and opens the PR; the exemption does no work on the case it was added for (Serious — regression, introduced by `908d9b7`)

**What the code does now.** `hooks/continuation-gate.mjs:64` declares
`export const TERMINAL_PHASES = ['closeout', 'complete'];` and `:147-149` allows the stop
whenever `ledger.phase` is either. A fresh, schema-valid ledger at `phase: "closeout"`
with every escalation resolved therefore never blocks.

**How the claim was verified.**

- Read of `hooks/continuation-gate.mjs:58-64, 146-149` at drafting time.
- **Executed.** Copied `tests/fixture/continuation/closeout/.claude/expert/ledger.json`
  to a scratch root, `touch`ed it so the staleness axis could not fire, and piped
  `{"cwd":"<root>","hook_event_name":"Stop"}` with `CLAUDE_PROJECT_DIR` set to that root:
  **exit 0**, no note. The gate is silent on a live closeout.
- Read of `workflows/expert-lifecycle.js:986-991`. The `closeout` block dispatches:
  *"Closeout: write the final report against the spec, commit the verified work and open
  a PR per repo conventions, and DRAFT (do not send) a CORE ingestion message."*
  `delta.phase = 'complete'` is written at `:989`, only after that agent returns. So a
  ledger resting at `closeout` is precisely a lifecycle whose report, commit, and PR have
  **not** happened.
- **Mutation probe (scratch copy).** Replaced `TERMINAL_PHASES` with `['complete']` and
  re-ran against this repository's live ledger — the ledger round-1's F2 was written
  about. Result: **still exit 0**, allowed via the schema-invalid branch
  (`ledger is not schema-valid ($: missing required property 'task_verbatim') and so is
  not resumable`). The `closeout` entry contributes nothing to closing F2; the schema
  branch closes it alone, and the 4-day staleness window closes it a second time.
- Read of `tests/unit/run-unit-tests.mjs:160`, whose own stated rationale is
  *"TERMINAL_PHASES is exactly those two (a third would exempt a phase with real work in
  flight)"* — the test articulates the correct principle and then encodes a list that
  violates it.

**Standard violated.** Least privilege applied to an exemption: an allow condition must
be no broader than the case it was added to permit. Concretely, the correction's own
governing rule at `continuation-gate.mjs:16-22` — *"BLOCKING REQUIRES POSITIVE EVIDENCE
OF AN IN-FLIGHT LIFECYCLE... Each allow condition below therefore names a way the
lifecycle can fail to be in flight."* A lifecycle at `closeout` has not failed to be in
flight; it is in flight, in the phase that produces the deliverables.

**Why it matters.** The defect signature this hook answers is `agent-quits-midtask`, 6
occurrences. The exemption makes one entire phase permanently unguarded, and it is the
phase where abandonment costs the most recoverable state: ground truth and whole-chain
reconciliation have both PASSED, and the work is then left uncommitted with no PR. The
justification comment at `:58-63` is accurate about *why* an abandoned closeout rests
there forever, but it draws the wrong conclusion from it — the observed live ledger was
already allowed by two other conditions, so the phase exemption bought nothing and cost
the coverage.

**What correct looks like.** `TERMINAL_PHASES = ['complete']` — `complete` alone is the
workflow's terminal write. An abandoned closeout is already allowed by the staleness
window (`:151-154`) once it is genuinely abandoned, and by the schema-validity branch
when it is unresumable, which is what the observed real-world case needed. Update the
`:58-63` comment and the `run-unit-tests.mjs:158-161` assertions to match, so the test's
rationale and its constant agree.

---

## Systemic Patterns

**No systemic patterns.** Two candidate patterns were suspected and both were scanned
across the full inventory scope before classification, per Step 8; both resolved to
single instances and are reported as isolated findings.

- **Candidate: silently swallowed errors across the plugin's executables.** Scan:
  `grep -rnE "catch\s*(\([^)]*\))?\s*\{\s*(return[^}]*)?\}"` over `hooks/*.mjs`,
  `scripts/*.mjs`, `workflows/*.js`. Result: **1 hit** —
  `scripts/preflight-deployment.mjs:73` (F2). Per-file counts:
  `continuation-gate.mjs` 0, `preflight-deployment.mjs` 1, `validate-ledger.mjs` 0,
  `expert-lifecycle.js` 0. The two other catches in `continuation-gate.mjs` (`:76`
  schema load, `:174` `statSync`) assign a sentinel that `decide()` explicitly branches
  on (`:130-132`) or type-guards (`:151`), so they are handled, not swallowed.
  **One instance — not systemic.**

- **Candidate: hand-maintained derived counts stated in prose without a pin.** Scan:
  grep for numeral-word count phrasings across the skills, agents, and workflow
  (`\b(five|six|seven|eight|nine)\b` in the changed files, cross-checked against the
  existing pin mechanism at `check-structure.mjs:817-818`, which already guards
  `The (six|seven|eight|nine) owner-gate types`). Result: the agent `jobs:` counts are
  pinned by execution (`T-2b`, `:169-170`), the owner-gate-type count is pinned
  (`:817-818`), and **1** changed-file count is unpinned — the "Eight signals" line
  (F4). **One instance — not systemic.**

---

## Moderate & Minor Findings

### F2 — `treeDigest` silently swallows a directory-read failure, contradicting the comment three lines above it, and the swallowed case yields CURRENT (Moderate — regression, introduced by `908d9b7`)

**What the code does now.** `scripts/preflight-deployment.mjs:73`, inside `treeDigest`'s
`walk`: `try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }`.
The doc comment at `:66-68`, three lines above, states: *"Throws on an unreadable
directory or file — the caller records that as a `problems` entry (UNREADABLE), never as
CURRENT."*

**How the claim was verified.**

- Read of `scripts/preflight-deployment.mjs:65-83` at drafting time. The comment's file
  half is true (`readFileSync` at `:78` is outside any `try`, so a file error propagates
  and `main()`'s catch-all converts it to exit 2); the directory half is false.
- **Executed**, driving that exact catch branch. Built two scratch roots where the tree
  path `scripts` exists but is a regular file, with different contents on each side, so
  `existsSync` at `:81` passes and `readdirSync` throws `ENOTDIR` into the swallow.
  Result: `cache digest entries: 0 | worktree digest entries: 0`, `existsSync both
  sides: true true`, **divergence detected: false**. Two demonstrably different trees
  compare equal, contributing CURRENT rather than the documented UNREADABLE.
- This is a comment claim inside the artifact under review, so per Step 6 it was
  re-derived from source rather than accepted; the comment is the author's claim and the
  execution above is the verification.

**Standard violated.** Fail-safe defaults (an integrity check must not treat "could not
read" as "no difference"), and the code's own documented contract at `:66-68`, which the
implementation does not honor for directories.

**Why it matters.** `commands/expert.md:44-47` makes this verdict load-bearing: no claim
about the running plugin's behavior may be made without quoting this report. The
swallowed branch is the one place where the script can return a confident CURRENT over a
tree it never actually compared — the same fail-open shape as the round-1 F3 defect,
reintroduced at a lower level by F3's own fix.

**What correct looks like.** Let the `readdirSync` failure propagate, exactly as the
`readFileSync` failure already does, so `main()`'s catch-all renders UNREADABLE / exit 2;
or catch it and push a `problems` entry naming the unreadable directory. Either way the
comment at `:66-68` becomes true rather than aspirational.

### F3 — `COMPARED_TREES` is the coverage contract for the entire staleness verdict and no test references it, so a new behavior-bearing tree silently narrows the verdict (Moderate — regression, introduced by `908d9b7`)

**What the code does now.** `scripts/preflight-deployment.mjs:36-37` declares
`COMPARED_TREES` (`agents`, `commands`, `hooks`, `scripts`, `skills`, `workflows`) and
`COMPARED_FILES`. The header at `:16-18` states: *"COMPARED_TREES therefore enumerates
every tree that carries executable or instruction content; a new such tree in the plugin
must be added there or the verdict silently narrows."* Nothing enforces that instruction.

**How the claim was verified.**

- Read of `scripts/preflight-deployment.mjs:11-18, 33-37` at drafting time.
- grep for `COMPARED_TREES|COMPARED_FILES` across `tests/structural/check-structure.mjs`
  and `tests/unit/run-unit-tests.mjs`: **0 hits**. No test imports or asserts the
  constant. (The N4 probe above shows the tier catches *emptying* it, because the
  fixture verdicts change — but that is coverage of the fixtures' current trees, not of
  the constant's completeness against what the plugin ships.)
- **Executed.** Copied `tests/fixture/deployment/worktree` to a scratch path; baseline
  against `current-config` → `VERDICT: CURRENT`. Added a new behavior-bearing tree to
  the working-tree side only (`lib/runtime.js`, containing `process.exit(1)`), absent
  from the installed cache. Re-ran: **`VERDICT: CURRENT`, exit 0.** An entire tree of
  runtime code present on one side and absent on the other is invisible.
- Confirmed the current list is not itself deficient: `ls` of the plugin root yields
  `README.md agents commands docs hooks scripts skills tests workflows`; every
  behavior-bearing directory is presently listed, and `docs`/`tests`/`README.md` are
  excluded deliberately (`:33-35`, and the exclusion is pinned at
  `check-structure.mjs:1357`). The defect is the missing guard, not today's list.

**Standard violated.** First-principles articulation (no published standard names this
precisely): the goal `COMPARED_TREES` serves is that the preflight's verdict covers
everything whose staleness could falsify a behavioral claim. The shortcut is encoding
that completeness requirement as a comment addressed to a future maintainer. The
shortcut fails the goal because the failure it warns about is silent by construction —
the verdict still reads CURRENT, no test reddens, and the bright line in
`commands/expert.md` keeps quoting a report whose scope has quietly shrunk. This is the
prose-only-control shape the whole 0.4.0 generation exists to convert into executable
checks, reintroduced inside the conversion.

**What correct looks like.** A structural check that reads the plugin root's directory
entries and asserts every one is accounted for — present in `COMPARED_TREES`, or in an
explicitly-declared excluded set alongside `docs`, `tests`. A new directory then fails
the tier until someone classifies it, which is the behavior the header's sentence asks
for and does not get.

### F4 — "Eight signals" is a hand-maintained derived count with no pin, in a file where the equivalent count is already pinned elsewhere (Minor — new, introduced by `0ef9850`)

**What the code does now.** `skills/expert-standard/SKILL.md` opens its failure-signal
section with "Eight signals that the Expert Standard isn't being applied:" (changed from
"Five" by this branch), followed by eight bolded entries.

**How the claim was verified.**

- `awk '/## How to Know This Skill is Failing/,/## What This Is Not/'` over the file,
  piped to `grep -c '^\*\*'`: **8** — the count is currently correct. Entries enumerated:
  Unnamed approvals; Silent pattern replication; Unverified premises; Unauthorized
  changes; Reinterpreted requests; Live-only declarations without a lookup trail;
  Citation-presence standing in for consultation; Assessment gaps.
- grep for `Eight signals|signals that the Expert Standard|How to Know This Skill` across
  `tests/structural/check-structure.mjs`: **0 hits**. The T-29 pins observed in the run
  output assert the *presence* of two specific signals, not the count.
- `git log -S"Eight signals"` on the file: introduced by `0ef9850`, not by the fix
  commit — hence **new**, not regression.
- Read of `check-structure.mjs:817-818`, which pins the parallel case by parsing
  `The (six|seven|eight|nine) owner-gate types` and comparing against a computed count.

**Standard violated.** Single source of truth for derived data (DRY): a count stated in
prose duplicates information the list already carries, and duplicated data drifts.

**Why it matters.** Low impact today — the number is right. It is filed because the
next edit to that list is the moment it goes wrong, and because the mechanism to prevent
it already exists eighteen lines of test code away, applied to an identical construct.

---

## Tentative Findings

**One tentative item.**

- **Whether the platform supplies `stop_hook_active`, the hook's only loop guard, could
  not be established.** `hooks/continuation-gate.mjs:110-112` returns ALLOW when
  `input.stop_hook_active === true`, and the comment at `:25` calls it the "loop guard
  required by the hook API". This is the sole mechanism preventing the gate from
  re-blocking on every successive Stop when the reprompted agent does not change the
  ledger — the "unbreakable stop loop" outcome the script's own header at `:35-41` calls
  "strictly worse than a missed reprompt". The tests confirm only that the code honors
  the field if present (`T-30 exec (g)`, `T-U4 stop_hook_active allows regardless of the
  ledger`), which is circular with respect to whether the platform sends it.
  Four `WebFetch` calls (`code.claude.com/docs/en/hooks`, `.../en/hooks#stop`,
  `.../en/hooks.md`, `code.claude.com/docs/llms.txt`, all 2026-08-21) failed to return
  the Stop event's input-field schema; two reported the string absent from the page
  while also reporting the content truncated before that section, so the fetches neither
  confirm nor deny. **The gap that would close this:** reading the Stop event's complete
  input-field list in the hooks reference, or capturing an actual Stop hook payload
  during a turn the gate blocked and inspecting it for the field. No finding above rests
  on this claim.

No other candidate finding was delivered without verification.

---

## Observations

- Round 1's F2 remedy text suggested allowing the stop when "`phase` is a terminal or
  post-implementation phase such as `closeout`". F1 above is not a reversal of a
  correctly-applied instruction — the prior review is a prior document whose
  prescriptions are candidates, not standards, and the mutation probe shows the
  `closeout` element does no work on the case it was suggested for. Recording this so the
  next round does not read F1 as arbitrary churn against a followed instruction.
- The F4 fix went beyond the reported defect: `expert-lifecycle.js:807-815` adds a guard
  for a *halted* plan amendment, attributed in the comment to the F4 class sweep ("it was
  the file's only wholly unconsumed `await agent`"), and `check-structure.mjs:1256` pins
  the swept class. That is re-derivation rather than patching the reported line, and it
  is the behavior the `patching-instead-of-rederivation` correction exists to produce.
- `check-structure.mjs:1248-1249` carries a negative pin (`T-28-neg`) that asserts the
  binding predicate *rejects* the pre-fix `impl2` shape. A pin that proves it can fail is
  strictly better evidence than a pin that passes; no standard violation, recorded for
  the reader's orientation.
- Both mandatory Clear Thought invocations ran. `metacognitivemonitoring` succeeded on
  the first call. `collaborativereasoning` failed once on schema validation (enum
  constraints on persona `communication.style` / `tone`) and succeeded on retry with
  corrected values — the same infrastructure friction round 1 recorded, noted per the
  skill's tool-failure recording convention. No manual fallback was needed.

---

## What's Actually Good

- **Every round-1 fix is pinned by an oracle that fails when the fix is reverted.**
  Property: reverting any of the six fixes reddens at least one tier. Standard: mutation
  adequacy — a suite that cannot detect a deliberately broken implementation provides no
  assurance. Verified by execution: the N1–N7 battery above, 7/7 caught, each probe
  guarded against being a silent no-op. Given this codebase's documented history of pins
  that fail open, and given that round 1 could only probe the original controls, this is
  the specific property a round-2 review exists to test, and it holds.

- **The F2 fix was derived from the gate's purpose rather than patched at the reported
  symptom.** Property: the fix added three independent allow conditions — schema
  validity, staleness, and terminal phase — each justified by a distinct way a lifecycle
  can fail to be in flight, rather than special-casing the one phase string the reported
  ledger happened to carry. Standard: root-cause correction over symptom suppression.
  Verified by Read of `continuation-gate.mjs:16-33` (the decision order and its stated
  rationale) and by execution: the live ledger is now allowed by two of the three
  conditions independently, which is what let the F1 mutation probe isolate the third as
  unnecessary. The over-reach in F1 does not diminish this; the derivation is sound and
  one element of the result is too broad.

- **The gate did not become inert while being loosened.** Property: after three new allow
  conditions were added, every non-terminal schema phase still blocks on a fresh,
  ungated, schema-valid ledger. Standard: over-correction avoidance — a control relaxed
  to fix a false positive must be shown to still fire on true positives. Verified by
  execution: a fresh `implement` ledger at a scratch root exits 2 with the full
  seven-gate reason, and `run-unit-tests.mjs:162-164` executes the same assertion across
  all seven non-terminal phases, observed passing in this reviewer's run.

- **The `task_verbatim` migration is a real gate, not a documented intention.** Property:
  the sentinel that makes legacy ledgers resumable is simultaneously refused by the one
  consumer that needs the owner's actual words. Standard: a migration must not silently
  degrade into a reconstruction. Verified by Read of `expert-lifecycle.js:591-592`
  (`LEGACY_VERBATIM_PREFIX`, `haveOwnerWords`) and `:682-684` (the spec phase halts with a
  `control_fault` naming the sentinel case distinctly from the absent case), by
  string-matching the prefix against `commands/expert.md:65`, and by the N7 probe, which
  reddens the tier when the sentinel is accepted as owner words.

---

## Convergence Record

- **Round number:** 2 (matches Scope and Inventory).
- **Trajectory:** R1: 6 (1 Critical, 3 Serious, 2 Moderate) → R2: 4 (0 Critical,
  1 Serious, 2 Moderate, 1 Minor).
- **Flow counts for this round:**
  - Prior findings **closed: 6** (F1–F6, all six; each closure verified by execution
    against the originally named standard — see Upstream Contract Verification and the
    dispositions below).
  - **New: 1** (F4, introduced by `0ef9850`, confirmed by `git log -S"Eight signals"`).
  - **Regressions: 3** (F1, F2, F3 — all introduced by the round-1 fix commit `908d9b7`,
    confirmed by `git log -S` on `TERMINAL_PHASES`, `catch { return; }`, and
    `COMPARED_TREES`, each returning `908d9b7` as the sole introducing commit).
  - **Recurring: 0** — no round-1 finding remains open at its original location under its
    original standard.

**Round-1 dispositions, each re-derived from source and verified by execution:**

| Prior | Standard originally named | Status | Closure verification |
|---|---|---|---|
| F1 (Serious) | Resolved identifier consistent with its documented source of truth | **closed** | `projectRoot` (`:85-90`) prefers `CLAUDE_PROJECT_DIR`. Executed the round-1 inert-gate scenario (`CLAUDE_PROJECT_DIR`=root, `cwd`=subdirectory): the ledger is now found at the project root. N1 reddens both tiers when reverted. |
| F2 (Critical) | Fail-safe defaults for an always-on interceptor | **closed** | Executed against this repository's live ledger, the exact artifact round 1 measured: **exit 0** with `ledger is not schema-valid ... and so is not resumable`. No spurious block, no unfollowable instruction. N2 reddens both tiers when reverted. |
| F3 (Serious) | Integrity check whose coverage set excludes the assets asserted | **closed** | Re-ran round-1's exact probe (gutted workflow, stubbed skill, deleted script, manifests byte-identical): **`VERDICT: STALE`, exit 1**, all three divergences named. Residual coverage gaps filed separately as F2/F3 this round. |
| F4 (Serious) | Complete mediation | **closed** | `impl2` gone from code (grep: 1 hit, a comment). `:821` binds into `impl`; `:866`/`:876` consume it. Pinned by `T-28` plus the `T-28-neg` negative pin at `:1248`. |
| F5 (Moderate) | The script's own documented exit contract | **closed** | Four malformed-registry probes executed; all four `VERDICT: UNREADABLE`, **exit 2**, none exiting 1. N5/N6 redden the structural tier when reverted. |
| F6 (Moderate) | Backward-compatible schema evolution for persisted state | **closed** | Documented sentinel in `commands/expert.md:59-70`, enforced in code at `expert-lifecycle.js:591-592` and gated at `:682-684`. N7 reddens the structural tier when reverted. |

**Tripwire evaluation — NOT FIRED.** Arithmetic shown:

- Condition (a), *new + regression ≥ closed for two consecutive Post-fix rounds*:
  this round, new (1) + regression (3) = **4**, closed = **6**; 4 ≥ 6 is **false**. The
  condition does not hold this round, so it cannot hold for two consecutive rounds.
  **Not fired.**
- Condition (b), *total findings count has not strictly decreased for two consecutive
  Post-fix rounds*: 6 → 4 is a **strict decrease**. **Not fired.**

Round 2 is the first Post-fix round, so neither condition could yet have accumulated two
consecutive occurrences in any case. The cycle is converging.

---

## Recommended Priority

The tripwire did not fire, so a normal fix round is the indicated path — not
foundational rework.

1. **F1 (Serious)** — the `closeout` exemption. Fix first: it is the only finding that
   removes coverage from the measured defect the whole correction exists to answer, the
   fix is a one-element change to `TERMINAL_PHASES`, and the unit test at
   `run-unit-tests.mjs:158-161` must move with it or the tier will contradict the fix.
   The test's own rationale at `:160` already states the correct principle.
2. **F2 (Moderate)** — `treeDigest`'s swallowed `readdirSync`. Small and local: either
   let it propagate to `main()`'s existing catch-all, or record a `problems` entry.
   Whichever is chosen, correct the `:66-68` comment so the artifact stops asserting a
   behavior it does not have.
3. **F3 (Moderate)** — the `COMPARED_TREES` drift guard. Larger than F2 because it needs
   a new structural check and an explicit excluded-set declaration, but it is the finding
   that keeps the F3-from-round-1 fix from decaying silently as the plugin grows.
4. **F4 (Minor)** — the unpinned "Eight signals" count. One assertion, modelled directly
   on the existing owner-gate-type pin at `check-structure.mjs:817-818`.

Additionally, though not a finding: closing the tentative item is worth a few minutes.
Confirming that the platform supplies `stop_hook_active` — from the Stop event's input
schema, or by inspecting a real payload — would ground the hook's only loop guard, which
is currently verified only against itself.

Per the project's standing rule, all four findings are to be applied; this ordering is
about sequence, not selection.

---

Verdict: NEEDS FIXES (4 findings: 1 Serious, 2 Moderate, 1 Minor)
