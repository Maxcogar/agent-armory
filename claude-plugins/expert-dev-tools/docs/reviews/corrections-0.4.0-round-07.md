# Independent review — corrections 0.4.0, round 7

Reviewer: fresh dispatch, no retained context from rounds 1–6. Prior rounds reach this
review only as written records (inventory source 4).

Target: `claude-plugins/expert-dev-tools/` on branch `claude/edt-corrections-0.4.0`,
nineteen commits `a903b12..ffac08d` against `origin/main`.

> **Erratum — added 2026-08-21, after this review was delivered.** The commit count in
> the line above is wrong. The original text is left unaltered, because this record is
> evidence of what the reviewer concluded and when. Re-measured with
> `git rev-list --count`: `a903b12..ffac08d` holds **13** commits — **14** counting
> `a903b12` itself, which is also the count of `origin/main..ffac08d`. No reading of the
> branch yields nineteen.
> The same figure is restated once more in the Ship-Readiness Judgment; it is wrong
> there for the same reason and is covered by this note. The substantive claim it
> decorates — that no check was silently lost — was independently re-established in
> round 8 and stands.
> Found and corrected post-review in round 8 (finding F8-2). Only the figure is wrong;
> no conclusion in this record rests on it.

Verdict: **NEEDS FIXES (1 finding: 1 Moderate)**. Tripwire: **not fired** (arithmetic
below, both readings shown). Ship-readiness: **nothing in this diff would harm a user who
deploys it** — the single finding is confined to one check's environment control and
cannot reach a deployed user. Reasoning in **Ship-Readiness Judgment**.

---

## Scope and Inventory

Round number: **7** (post-fix). Inventory constructed by the expert-review Step 2 post-fix
rule, from all four sources.

### Source 1 — the prior review's full inventory

Carried forward from `docs/reviews/corrections-0.4.0-round-06.md#Scope and Inventory`
(Read in full, 752 lines, at `ffac08d`).

- [x] `tests/structural/check-structure.mjs` — executed in full at HEAD (**445 ok / 0
      fail**); Read `1930-2010`, `2010-2140` (the whole T-31/T-32 block including the new
      joiner), `480-500` (the `norm()` label normalizer), `2296-2308` (`runGateHook`),
      `2339-2351` (the T-30 exec cases); full `ffac08d` diff Read; exercised under 18
      mutations on an isolated git-backed copy.
- [x] `tests/unit/run-unit-tests.mjs` — executed at HEAD (**46 ok, 0 fail**).
- [x] `hooks/continuation-gate.mjs` — Read `1-60` (header, incl. the loop-bound argument),
      `110-150` (`projectRoot`, `reasonFor`, `decide` head), `96`/`102`
      (`TERMINAL_PHASES`, `STALE_MS`); executed against the **real** repo ledger and seven
      fixture states via a Node driver; driven through six adversarial payload shapes;
      mutated once (reprompt member list).
- [x] `hooks/hooks.json` — Read in full. Registers the script on **`Stop` only**, timeout 10.
- [x] `scripts/preflight-deployment.mjs` — executed against the **real** installed 0.3.0
      cache, JSON Read field by field; Read `51`, `132-146`, `246`, `262-290`, `310-323`;
      mutated twice.
- [x] `scripts/validate-ledger.mjs` — grep-verified for `process.env` (0 hits: it is not
      environment-sensitive, which is load-bearing for F1's systemic scan).
- [x] `scripts/ledger.schema.json` — mutated (`task_verbatim` renamed) — caught by 2 checks.
- [x] `workflows/expert-lifecycle.js` — Read `65-79` (the `GATE` literal); mutated twice
      (8th `GATE` member; `gt.ok` branch).
- [x] `commands/expert.md` — Read `227-246` and `264`; `ffac08d` diff Read; grep
      `"gate types"` → 2 hits, both now pointing at §3.4.
- [x] `agents/*.md` (10 files) — `ffac08d` touches none; branch diff hunks Read;
      `expert-reviewer.md`, `expert-corrector.md`, `expert-implementer.md` mutated
      (all caught).
- [x] `skills/expert-plan/SKILL.md` — Read `17-20` and `60-63`; `ffac08d` diff Read;
      used as the probe carrier for 8 mutations.
- [x] `skills/expert-plan/references/output-contract.md` — `ffac08d` diff Read; section
      count re-derived by grep (**16**); parser re-run against the edited file.
- [x] `skills/expert-plan/scripts/derive-plan-sections.mjs` — **executed**: `--self-check`
      (19 checks passed) and `--check fixtures/valid-plan.md` (OK, regions current).
- [x] `skills/expert-plan/scripts/fixtures/valid-plan.md` — executed as parser input.
- [x] `skills/expert-architecture/SKILL.md`, `skills/expert-architecture-portable/SKILL.md`,
      `skills/expert-correct/SKILL.md`, `skills/expert-implement/SKILL.md`,
      `skills/expert-mcp-overhaul/SKILL.md`, `skills/expert-review/SKILL.md`,
      `skills/expert-spec/SKILL.md`, `skills/expert-standard/SKILL.md` — untouched by
      `ffac08d`; branch diff hunks Read; all 8 covered by the executed T-31 reach walk
      (66 files in reach) and by my independent re-implementation of that walk.
- [x] `tests/ACCEPTANCE.md` — unchanged this round; carried.
- [x] `tests/fixture/spec/spec-contradictory.md` — `ffac08d` diff Read; `T-19` executed green.
- [x] `.claude-plugin/plugin.json` — Read in full; `version: "0.4.0"` confirmed, and
      corroborated independently by the real preflight run (`worktree_version: "0.4.0"`).
- [x] `README.md` — branch diff hunk Read.

### Source 2 — the fix diff (`ffac08d`, 6 files)

Every file in `git show --stat ffac08d` is in the list above, plus:

- [x] `docs/reviews/corrections-0.4.0-round-06.md` — Read in full. Record file; out of
      T-31/T-32 scan reach by design.

### Source 3 — fix-diff dependents

CodeGraph is unavailable in this session (see tool plan). Dependents were derived by grep
and by executed mutation, the correct instrument here: every dependency edge in this scope
is textual (check labels, fixture paths, anchor targets, contract-text pins) or executable
(the parser over `output-contract.md`).

- [x] `skills/expert-plan/scripts/derive-plan-sections.mjs` — the one **executable**
      consumer of the heading `ffac08d` edited; re-run both ways, green.
- [x] Anchor consumers of `output-contract.md` — grep `"output-contract.md @"` across the
      plugin excluding `docs/` → **0 hits**. No citation anchor targets the edited heading.
- [x] `tests/fixture/continuation/{complete,open-gate,no-gate,closeout,invalid,corrupt,no-ledger}` —
      all seven driven through the real hook.
- [x] `tests/fixture/deployment/{current-config,stale-config,worktree}` — executed via T-29.
- [x] `docs/diagnostics/corrections-0.4.0/*.md` (7 drafts) — each correction's load-bearing
      mechanism mutation-tested (battery below).

### Source 4 — the prior round's findings as closure items

Round-6 findings N1 and N2 re-derived from current source and re-tested by mutation.
Dispositions in **Upstream Contract Verification**.

### Tool plan (Step 3)

| Claim type | Instrument | Availability |
|---|---|---|
| Absence claims | `grep` over declared scope, result counts recorded | available |
| Literal-content claims | `Read` at file:line at drafting time | available |
| Behavioral claims (check reach, hook verdicts, preflight verdicts, guard oracles) | **execution + mutation** on an isolated git-backed copy | available |
| Structural / blast-radius | grep + executed mutation (CodeGraph unavailable) | **substituted** |
| Prior-document claims | re-derived from current source | available |
| Comment claims inside the artifact | re-derived against the cited external object | available |
| Library-behavior claims | Context7 | **not needed** — no library-integration claim is load-bearing here; the one platform-behavior claim was re-derived against the installed binary directly, which is stronger |

Disposition of the CodeGraph gap: **not a halt**. No finding in this review rests on a
structural blast-radius claim; every dependency edge in scope is textual or executable and
was verified by grep, by execution, or by mutation, per Step 6's structural-vs-existence
distinction.

### Instrument construction

**The working tree was never mutated** — confirmed by `git status --short
claude-plugins/expert-dev-tools/` returning empty at the end of the review. Two isolated
git-backed scratch repos were used:

- `C:\t\r8` — HEAD (`ffac08d`), plugin re-rooted at `claude-plugins/expert-dev-tools/`
  inside a fresh `git init` + commit, so the `T-20` deletion oracle's
  `git show HEAD:claude-plugins/expert-dev-tools/…` baseline resolves. Baseline:
  **1 environmental failure** (`T-A2a`, the repo-root workflow linter, which lives outside
  the plugin). Every probe scored against 1.
- `C:\t\p8` — the **parent** commit (`a4b638e`), built the same way, same baseline of 1.
  Built specifically so behavioral changes introduced by `ffac08d` can be measured as a
  difference rather than asserted.

*Method note, confirming round 6's:* my first attempt placed the plugin at the repo root
(`C:\t\r7`) rather than at its repo-relative path; that yields **4** baseline failures
(`T-A2a`, two `T-20` baseline checks, and `T-29` classifying `.git`) and is the wrong
instrument. Re-rooting at `claude-plugins/expert-dev-tools/` is what reduces it to 1.

### Rigor waivers

None. No step of the expert-review process was skipped or compressed, and no operator
directed a cycle stop.

---

## Summary

**This review returns NEEDS FIXES**, with 1 finding, Moderate, new — no prior round
reported it, and it is not a regression from the newest commit.

Both round-6 findings are **closed against their originally named standards**, each
verified by execution and mutation rather than by reading the fix. N1's closure is the
substantive one: the recognizer now tests a **logical** line — in markdown, the block a
physical line belongs to, joined across soft-wrapped continuations, with block boundaries
drawn structurally (blank line, fence, frontmatter, list/heading/quote/table opener) rather
than from a maintained list. Every probe round 6 demonstrated as MISSED (W1, W2, W4) now
turns the tier red, the one-line control (W3) still does, and the live instance at
`commands/expert.md:230` is disposed of by pointing at spec §3.4 instead of restating the
number — the same disposition its sibling at `:264` already carried. N2's closure is
complete: both surviving prose restatements of `output-contract.md`'s derived counts are
gone, and a re-run sweep for `sixteen` across the plugin excluding `docs/` leaves only
three hits, all inside the recognizer's own machinery.

Against the seven corrections — the thing this branch exists to deliver — I found **no
regression**. Each correction's load-bearing mechanism was mutation-tested on an isolated
copy and each mutation turned the tier red. Both always-on executables were exercised
against real and constructed state in both directions: the preflight against the **real**
installed 0.3.0 cache (exit 1, `STALE`, provenance fields distinct and correctly sourced,
including the two new hook files reported `missing in installed cache`), and the Stop hook
against the **real** repo ledger plus seven fixtures plus six adversarial payload shapes.
I independently re-derived the check-deletion audit across the whole branch and **confirm**
round 6's result: 5 labels absent at HEAD out of 123 at `origin/main`, all five declared
with live successors. No check was silently lost.

The one finding is a test-hygiene defect: `T-30 exec (i)` is the only exec case in the
continuation-gate block that bypasses the `runGateHook` helper and therefore inherits
ambient `CLAUDE_PROJECT_DIR` — the one contaminant that helper exists to scrub. Its green
is vacuous, and it flips red under an environment the plugin itself routinely creates.

I also examined, and **dropped**, a candidate that the newest commit's joiner does
introduce as a behavioral change; the measurement and the reason for dropping it are in
**Tentative Findings**, because it would otherwise look like an omission.

---

## Upstream Contract Verification

### Round-6 findings as closure items

**N1 — `T-31`'s form (a)/(c) recognizers were per-line, so the named forms went undetected
across a line break, with a live in-reach instance at `commands/expert.md:230` while the
check printed `found: none`. CLOSED against its originally named standard** (*a control's
stated scope must equal its actual reach*).

Verified by execution and mutation on `C:\t\r8` against its measured baseline of 1, never
by reading the fix. Probes appended to `skills/expert-plan/SKILL.md`, restored between each:

| Probe | Construct | Round 6 | Round 7 |
|---|---|---|---|
| W1 | `There are eleven signals and` / `what each does:` + list | MISSED | **CAUGHT (2)** |
| W2 | `…not a bare problem. The seven gate types and` / `what each asks:` + list | MISSED | **CAUGHT (2)** |
| W3 (control) | the identical W2 text on one line | CAUGHT | **CAUGHT (2)** |
| W4 | `Read each of the` / `five traps before starting.` — form (c) wrapped | MISSED | **CAUGHT (2)** |

The failing check on W2, Read from the run output at drafting time, is
`T-31 no count restatement in header form (a), (c) or (d) exists in any scanned file …
(found: skills/expert-plan/SKILL.md:401 [quantifier before a terminal colon])` — so the
report names the form that fired and the **physical** line the match starts on, not the
joined block's first line, which is the property `lineOf` at `:2136-2140` exists to hold.

The mechanism was Read at drafting time (`check-structure.mjs:2114-2140`): `logicalLines`
joins a physical line into the current block only when the file is `.md`, the line is
non-blank, outside a fence and outside frontmatter, and does **not** match `BLOCK_START`
(`/^\s*(?:[-*+]\s|\d{1,3}[.)]\s|#{1,6}\s|>|\||---\s*$|===)/`). Nothing there is a
maintained list of instances.

The live instance is disposed of. Read at `commands/expert.md:230` at drafting time:
`approves or rejects a solution, not a bare problem. The §3.4 gate types and` — the number
is gone and the prose points at the pinned source, exactly as round 6 prescribed and as the
sibling at `:264` already read. grep `"gate types"` over `commands/expert.md` → 2 hits,
both `§3.4`-anchored.

**N2 — two unpinned restatements of `output-contract.md`'s derived counts survived, one
cross-file. CLOSED against its originally named standard** (*hand-maintained derived data
must be deleted or pinned to an executable source of truth*).

Verified by re-derivation and by re-run sweep, not by reading the fix:

- `git show ffac08d` Read: `skills/expert-plan/SKILL.md:20` lost both counts
  (`the sixteen output sections` → `the output sections`; `the three compliance gates` →
  `the compliance gates`), `references/output-contract.md:5` lost its heading count
  (`## The sixteen output sections` → `## The output sections`), and a third site the
  round-6 finding did **not** name was swept in the same pass —
  `skills/expert-plan/SKILL.md:63`, `satisfied by four required sections` → `satisfied by
  the required sections of the delivered plan listed below`. That third edit is the class
  sweep the correction doctrine requires, landing rather than being promised.
- Re-run sweep at HEAD: `grep -rn "sixteen"` over `--include=*.md --include=*.mjs
  --include=*.js --include=*.json --include=*.txt --include=*.yaml --include=*.yml`,
  `docs/` excluded → **3 hits**, all inside `tests/structural/check-structure.mjs`
  (`:488` the normalizer's cardinal list, `:2069` the `CARDINALS` array, `:2213` a
  deliberately fragment-assembled negative-test probe). All three are recognizer
  machinery, none is prose. **Zero prose instances remain.**
- The population is still genuinely 16: `grep -cE '^[0-9]+\. \*\*'
  skills/expert-plan/references/output-contract.md` → **16**. The count was accurate and
  is now simply absent, which is the disposition the standard prefers.

**Collateral check on the heading edit** (a heading is a plausible anchor and a plausible
parser key, so its edit is a regression candidate, not a free change):

- `skills/expert-plan/scripts/derive-plan-sections.mjs --self-check` → **`self-check
  passed: 19 checks`**, exit 0.
- `… --check skills/expert-plan/scripts/fixtures/valid-plan.md` → **`OK: 2 steps, 3
  elements, 2 test specs, regions current`**, exit 0.
- grep `"output-contract.md @"` across the plugin excluding `docs/` → **0 hits**: no
  citation anchor targets the edited heading, so T-32's anchor-reading property is
  unaffected.

**Collateral check on the fixture edit.** `tests/fixture/spec/spec-contradictory.md` lost
`Three statements are in play, and they cannot all hold together` in favour of `The
statements in play cannot all hold together`. The seeded contradiction itself is untouched —
R-1, R-2 and R-3 are still enumerated immediately below (Read at drafting time), the word
`three-way` survives in the same paragraph (a declared known gap, `N-way`, pinned
executably by `T-19`), and `T-19` executes green at HEAD. The fixture's role as a
contradiction carrier is intact.

### The seven corrections — still doing what their drafts say

Each correction's load-bearing mechanism was mutation-tested on `C:\t\r8` against its
baseline of 1. A mutation that turns the tier red proves the mechanism is wired and
guarded; a mutation that finds no pattern would have proved regression.

| # | Correction | Mutation applied | Result |
|---|---|---|---|
| 1 | `instruction-reinterpretation` | `task_verbatim` → `task_verbat1m` in `scripts/ledger.schema.json` | **3 fails** (2 checks red) |
| 2 | `premature-completion-claims` | `if (!gt.ok) {` → `if (false) {` in the workflow | **2 fails** |
| 3 | `patching-instead-of-rederivation` | `sites_changed` renamed in `agents/expert-corrector.md` | **2 fails** |
| 4 | `role-boundary-violations` | `returns:` → `returnz:` in `agents/expert-reviewer.md` | **2 fails** |
| 5 | `skill-activation-missed` | `Skill(expert-dev-tools:expert-implement)` broken in `agents/expert-implementer.md` | **2 fails** |
| 6 | `opining-without-reading-source` | `entry.stale = entry.diffs.length > 0` → `entry.stale = false` (preflight always reports CURRENT) | **7 fails** (6 T-29 checks red, incl. *"a gutted cache with byte-identical manifests is STALE"*) |
| 7 | `agent-quits-midtask` | `non_convergence` dropped from the reprompt member list | **2 fails** |

**No regression found in any of the seven.**

A note on method, since it changed one conclusion: my first probe at correction 6 renamed
the JSON key `"verdict"` and produced **no** red, which would read as an unguarded
mechanism. That mutation was simply the wrong instrument — it perturbs an output key, not
the staleness determination the correction exists to make. Re-aimed at the determination
itself (`entry.stale = false`), the guard is emphatic. Recording this because a weaker
review would have filed the first result as a finding.

### Spec and architecture conformance

- **Spec §2 hooks amendment (owner, 2026-08-20)** — HONORED. Verified by Read of
  `hooks/hooks.json` in full: the manifest registers exactly one event, `Stop`, with one
  command and a 10s timeout. No `PreToolUse`/`PostToolUse` entry exists, so no tool use is
  blocked, which is the precise boundary the amendment draws.
- **Spec §3.4 seven gate types** — HONORED, pinned in both tiers and by **two independent**
  pins. Verified by execution of the real hook (the block reason enumerates all seven) and
  by mutation: adding an 8th member (`budget_stop`) to the workflow's `GATE` literal
  **while updating the reprompt in step** still turns the tier red via
  `T-24 gate-count comment matches the evaluated GATE literal (fail-closed on unevaluable)`;
  updating the reprompt alone turns red via
  `T-24 the continuation gate's reprompt states the evaluated GATE member count`. The count
  is derived by **evaluating** the `GATE` literal, not by lexing it. A gate cannot be added
  silently.
- **Architecture fail-safe-defaults decision (OWASP secure design)** — HONORED, and the
  fail-open direction is the correct one here (reasoning in **What's Actually Good**). Every
  constructed and real state resolved to block-or-documented-fail-open; see the driver
  table below.
- **Version 0.4.0** — HONORED. Read directly in `.claude-plugin/plugin.json`, and
  corroborated independently by the real preflight run reporting `worktree_version: "0.4.0"`.

No upstream acceptance criterion in scope was found violated.

---

## Real-state exercises (both always-on executables, both directions)

### `scripts/preflight-deployment.mjs` against the **real** installed cache

`node scripts/preflight-deployment.mjs expert-dev-tools .` → exit **1**, `verdict: STALE`.
JSON Read field by field: `cache_path` resolves to the real
`…/cache/claude-armory/expert-dev-tools/0.3.0`, `installed_version: "0.3.0"` (cache
manifest), `registry_recorded_version: "0.3.0"`,
`registry_recorded_commit: "bb7107b34f19f4380fd7975500357d29afdf80c9"`,
`worktree_version: "0.4.0"`, `problems: []`, and 8 diff lines. The provenance fields are
distinct and correctly sourced — cache-manifest version and registry-recorded version are
reported separately rather than conflated, which is the property that makes the report
trustworthy when they disagree. The diff correctly reports the two files this branch adds
as `missing in installed cache` (`hooks/continuation-gate.mjs`, `hooks/hooks.json`,
`scripts/preflight-deployment.mjs`). Correct in content and in provenance.

### `hooks/continuation-gate.mjs` — real ledger, seven fixtures, six adversarial payloads

Driven from Node with real Stop payloads (never through a shell pipe, which injects a BOM
and produces a spurious `hook input unreadable` — round 6 recorded the same, and it
reproduces).

| Exit | State | Note |
|---|---|---|
| 0 | **real** repo ledger `.claude/expert/ledger.json` | `ledger is not schema-valid ($: missing required property 'task_verbatim') and so is not resumable; allowing the stop.` |
| **2** | `no-gate` fixture | reason names phase `implement`, routes to `/expert resume`, enumerates all seven §3.4 gate types |
| **2** | `closeout` fixture | reason names phase `closeout` |
| 0 | `open-gate` | a legitimate §3.4 halt still halts |
| 0 | `complete` | terminal phase |
| 0 | `invalid` schema | documented fail-open with the note |
| 0 | `corrupt` | `ledger unparseable (…); allowing the stop.` |
| 0 | `no-ledger` | ordinary sessions untouched |

Adversarial payloads, each ~50ms:

| Exit | Payload |
|---|---|
| 0 | `stop_hook_active: true` on the blocking fixture — **loop guard honored** |
| 0 | unrelated cwd (`C:/Windows`) — an ordinary user session is untouched |
| 0 | garbage stdin — `hook input unreadable (…); allowing` |
| 0 | no `CLAUDE_PROJECT_DIR`, no `cwd` field |
| **2** | empty stdin **with `CLAUDE_PROJECT_DIR` at a blocking fixture** — see **F1** |
| **2** | `hook_event_name: "SubagentStop"` — unreachable in deployment; `hooks.json` registers `Stop` only. Recorded as an Observation, not a finding. |

### Independent whole-branch check-deletion audit

`T-20`'s baseline is `HEAD`, one commit back, so it cannot see a check deleted in an earlier
commit of this branch. I re-implemented its label extractor and `norm()` normalizer
independently (`CARDINAL_WORDS` deleted, digits → `#`, `${…}` → `~`) and ran it across the
whole branch:

```
origin/main labels: 123   HEAD labels: 311
present at origin/main, absent at HEAD: 5
  - T-A2b ~: skills is a sequence -> packaged skill
  - T-A2c manifest: declares no hooks (divergence §#)
  - T-# deployment: verifierUnderCovered guards all consumption sites
  - T-# deployment: underCoveredVerifierGate raised at all sites
  - T-# deployment: both control gates carry GATE.control_fault
```

My totals differ from round 6's (123/311 vs 122/309) only by extractor tolerance; **the
gone-label set is identical**. Each of the five was then grep'd in current source and
appears **only** as a `was:` entry in a declaration channel (`:747`, `:682`, `:793`,
`:801`, `:806`), never as a live `check(` label. Round 6's audit is **confirmed
independently: no check was silently lost across the branch.**

---

## Critical & Serious Findings

No Critical or Serious findings. The full inventory was Read or Grep-verified per Gate B,
both tiers were executed at HEAD (**445 structural ok / 0 fail; 46 unit ok / 0 fail**), the
whole-branch check-deletion audit found no silent loss, both always-on executables were
executed against real and constructed state in both directions including six adversarial
payload shapes, all seven corrections' mechanisms were mutation-verified, the newest
commit's every collateral surface (contract parser, citation anchors, contradiction
fixture) was re-executed, and no violation of Critical or Serious classification was
observed.

---

## Systemic Patterns

No systemic patterns. The one finding below is a **class of one**, and that is a measured
claim, not an assumption.

**Proactive scan (Step 8), run before classifying F1.** F1's class is *"a check that
invokes an environment-reading executable without controlling its environment."* The scan
decomposes into two mechanical parts:

1. Every subprocess invocation in the structural tier:
   `grep -n "execFileSync\|spawnSync" tests/structural/check-structure.mjs` → **16 hits**.
   Filtering to those with no `env` option within 5 lines leaves **6**: `:245`, `:452`,
   `:1636`, `:2266`, `:2276`, `:2348`.
2. Which executables actually read ambient environment:
   `grep -n "CLAUDE_PROJECT_DIR\|process.env"` over `scripts/validate-ledger.mjs`,
   `scripts/preflight-deployment.mjs`, `hooks/continuation-gate.mjs`,
   `workflows/expert-lifecycle.js` → `continuation-gate.mjs` reads `CLAUDE_PROJECT_DIR`
   (`:117-118`); `preflight-deployment.mjs` reads `CLAUDE_CONFIG_DIR` (`:51`);
   **`validate-ledger.mjs` reads neither** (0 hits).

Intersecting the two: of the 6 env-uncontrolled invocations, `:245`, `:1636` and `:2266`
are `node --check` syntax runs, `:452` is a `git show` with an explicit `cwd`, and `:2276`
runs `validate-ledger.mjs`, which is environment-insensitive. Only **`:2348`** invokes an
environment-reading executable without controlling its environment. Separately, every
preflight invocation (`:1645`, `:1684`, `:1818`) sets `CLAUDE_CONFIG_DIR` explicitly, so
the sibling executable carries no instance either.

**Result: exactly one instance. Classified Moderate, not Systemic.**

---

## Moderate & Minor Findings

### F1 — `T-30 exec (i)` is the only continuation-gate exec case that bypasses `runGateHook` and inherits ambient `CLAUDE_PROJECT_DIR`; its green is vacuous, and it turns red under an environment the plugin itself routinely creates (Moderate — new)

**Location:** `tests/structural/check-structure.mjs:2347-2348`

**What the code does now.** Read at drafting time, `tests/structural/check-structure.mjs:2347-2348`:

```js
  check('T-30 exec (i) empty stdin -> exit 0 (a malformed hook payload never traps the session)',
    (() => { try { execFileSync(process.execPath, [gate], { input: '', stdio: 'pipe' }); return true; } catch { return false; } })());
```

There is no `env` argument, so the child inherits `process.env` wholesale — including
`CLAUDE_PROJECT_DIR`. The hook resolves its ledger root from exactly that variable, Read at
`hooks/continuation-gate.mjs:117-121`:

```js
export function projectRoot(input, env = process.env) {
  const fromEnv = env && env.CLAUDE_PROJECT_DIR;
  if (typeof fromEnv === 'string' && fromEnv !== '') return fromEnv;
  const cwd = input && input.cwd;
  return typeof cwd === 'string' && cwd !== '' ? cwd : null;
}
```

Every **other** exec case in this block goes through the `runGateHook` helper, Read at
`:2296-2308`, which contains this:

```js
    const env = { ...process.env };
    delete env.CLAUDE_PROJECT_DIR;
    if (projectDir) env.CLAUDE_PROJECT_DIR = projectDir;
```

The helper **deliberately scrubs `CLAUDE_PROJECT_DIR`** before every invocation. The block's
own author therefore already identified ambient `CLAUDE_PROJECT_DIR` as a contaminant and
built the removal; case (i) is the one invocation that does not use it.

**How the claim was verified.** By execution, on the isolated git-backed copy at `C:\t\r8`,
against its measured baseline:

- `node tests/structural/check-structure.mjs` with the variable unset → **1 fail**
  (`T-A2a` only, the environmental baseline).
- `CLAUDE_PROJECT_DIR="$(pwd)/tests/fixture/continuation/no-gate" node
  tests/structural/check-structure.mjs` → **2 fails**, the second being
  `FAIL  T-30 exec (i) empty stdin -> exit 0 (a malformed hook payload never traps the session)`.

The mechanism was confirmed directly by driving the hook: empty stdin with
`CLAUDE_PROJECT_DIR` at the blocking fixture exits **2**, while garbage stdin exits **0**
with `hook input unreadable … allowing`. So an empty payload is not detected as malformed
at all — `JSON.parse` is never reached with content, the payload resolves to an object with
no `stop_hook_active`, and the decision proceeds on the ledger the ambient variable points
at. Provenance re-derived from history rather than assumed:
`git log -S "empty stdin -> exit 0" -- …/check-structure.mjs` → a single commit,
**`e4e500f`** (correction 7/7), unchanged since — so this is **new**, not a regression
introduced by `ffac08d`.

**Which standard it violates, and why.** Two, and the first is the primary:

*Test hermeticity* — a test's outcome must depend only on the code under test and its
declared inputs, never on ambient process environment. This is not an imported convention:
the same block **enacts** it fifteen lines above, in the helper's `delete
env.CLAUDE_PROJECT_DIR`, so the defect is an inconsistency with a standard this code
already holds itself to, which is the strongest form the frame axis takes.

*A control's stated scope must equal its actual reach* — this cycle's defining standard,
here in its vacuous-green form rather than its overclaiming-label form. In the environment
the tier normally runs in, no ledger is reachable, so the case passes because there is
nothing to find, not because a malformed payload fails open. It therefore does not test the
property its own label names.

Why it matters concretely: `CLAUDE_PROJECT_DIR` is set by Claude Code in the very sessions
this plugin governs, and the plugin's workflow directs agents to run this tier. An agent
running the structural tier from inside a project with an active, schema-valid, fresh,
non-terminal, no-open-gate ledger — the plugin's own primary operating condition — gets a
red line caused by nothing in the diff. The likely responses are both bad: chase a
non-existent defect, or learn that a red tier is sometimes just noise, which is the
expensive one.

**What correct implementation looks like.** Route case (i) through the helper that already
solves this, and split the vacuous claim into the two properties it conflates:

1. Invoke via `runGateHook`-style env control so `CLAUDE_PROJECT_DIR` is scrubbed and the
   ledger root is whatever the case declares — `spawnSync(process.execPath, [gate], {
   input: '', env, encoding: 'utf8' })` with `env` built by the helper's rule. Under that
   env the case is deterministic, and its green means what it says.
2. Assert the property the label names, rather than its shadow. If the intended claim is
   *"a malformed payload fails open"*, then the case must pin an empty payload **with a
   blocking ledger reachable** and assert exit 0 plus a stderr note, matching how case (h)
   pins the unparseable-ledger path. On current code that case would fail — which is the
   point: it would expose that an empty payload takes the *valid-payload* path rather than
   the fail-open one, whereas garbage input takes fail-open. If instead the intended claim
   is narrower — *"an empty payload with no lifecycle in reach allows"* — then the label
   should say that, and the parenthetical universal comes out.

Option 2's first branch is the one worth taking, because it is also the only place the
`stop_hook_active` loop guard is silently unavailable: an empty payload carries no
`stop_hook_active` field, so the guard cannot fire. That is bounded — see **What's Actually
Good** on the platform block cap — but it is exactly the asymmetry the case's label claims
to rule out, and pinning it is cheap.

---

## Tentative Findings

No tentative findings — every candidate finding's premise was verified against current
source by Read at drafting time, by grep with the query and result count recorded, or by
executed mutation on an isolated copy, per Gate B.

Two candidates were **dropped** after verification contradicted or defused them, recorded
here because each would otherwise look like an omission — and the first is the newest
commit's most plausible regression, so its measurement is the load-bearing part of duty (b).

**Dropped — *"the new logical-line joiner masks a construct the per-line scanner caught,
so `ffac08d` trades one gap for another."*** The premise is **true** and was confirmed as a
difference between commits, not asserted: a form (a) line followed immediately by a lazy
prose continuation — `There are six signals:` / `and each of them matters here.` — is
CAUGHT at the parent `a4b638e` (2 fails vs baseline 1 on `C:\t\p8`) and MISSED at HEAD
(1 fail on `C:\t\r8`), because joining makes the colon non-terminal and introduces a period,
defeating the `(?=[^.]*:$)` lookahead. The conclusion nevertheless does not follow, on two
independently verified grounds:

- **Zero live instances.** I re-implemented the walk, `SCANNED_EXT`, `NUM`, all three
  `COUNT_FORMS`, `BLOCK_START` and `logicalLines` verbatim, then computed the set
  difference *physical-line matches minus logical-line matches* across all **66** files in
  reach. Result: **0**. Nothing currently in the plugin is masked by the change.
- **The masked shape falls outside form (a)'s own rationale.** Form (a) is justified at
  `check-structure.mjs:2072-2074` on the ground that *"the clause ends in a colon, so the
  list that follows IS the population and the number is a second copy of its length."*
  I enumerated the ways a population can follow and probed each: colon + list with no blank
  line (**CAUGHT**), colon at EOF (**CAUGHT**), colon inside a list item followed by a
  nested list (**CAUGHT**). Every enumeration opener — `-`/`*`/`+`, `N.`/`N)`, `#`, `>`,
  `|`, fences, blank lines — is a `BLOCK_START` or an explicit break, so it terminates the
  join and preserves the terminal colon. The **only** masked shape is colon-followed-by-
  prose, where no enumerated population follows and the number is therefore not a second
  copy of anything. The joiner narrows toward genuine instances rather than away from them.

Since the label accurately describes the new scanned unit (*"in md a markdown block joined
across its soft-wrapped lines, elsewhere a physical line"* — Read from the run output), the
stated-scope-equals-reach standard is satisfied, and there is no standard left for a
finding to name. Recorded as an Observation instead.

**Dropped — *"`commands/expert.md`'s seven gate bullets are a third hand-maintained copy of
a population that lives executably in the workflow's `GATE` literal, so the round-6 fix
removed the number and left the membership unpinned."*** The premise about pinning is true —
`grep -n "risk_override\|non_convergence\|core_approval\|spec_traceable"
tests/structural/check-structure.mjs` returns 3 hits, none of which compares the command's
bullet list to `GATE`. But the inference that membership can therefore drift silently is
**false**, verified by mutation: adding an 8th member to the `GATE` literal turns the tier
red via `T-24 gate-count comment matches the evaluated GATE literal` even when the
continuation-gate reprompt is updated in the same edit, and updating the reprompt alone
turns it red via the reprompt count pin. Two independent pins fire on any gate change.
Further, the standard the cycle names governs *restatements of a population's size*, and the
bullets are the population's members with their prose meanings — a genuine payload, not a
derived count. No standard applies. Recorded as an Observation.

---

## Observations

- **The joiner's narrowing is a real behavioral change with zero live effect and sound
  direction.** Measurement in Tentative Findings above. Worth recording because a future
  round measuring the same difference should not re-litigate it, and because the one
  known-gap the header does *not* name is its inverse (it names *"a restatement soft-wrapped
  in a file that is NOT markdown"*, `:2001-2003`, but not *"a markdown restatement whose
  colon stops being terminal once its block is joined"*). Adding that clause would be
  tidy; its absence violates no standard, because the label states the scanned unit
  precisely enough for a reader to derive the consequence. No standard violation.
- **`commands/expert.md`'s gate bullets are guarded in practice by two independent `GATE`
  pins.** Mutation evidence in Tentative Findings. No standard violation.
- **The hook ignores `hook_event_name` entirely** — a `SubagentStop` payload against a
  blocking fixture exits 2. This is unreachable in deployment: `hooks/hooks.json`, Read in
  full, registers the script under the `Stop` key only, and the platform dispatches by that
  key. Recorded because a future edit that widens the registration would silently make the
  gate fire on every subagent completion, and nothing in the script would stop it. No
  standard violation at present. No severity.
- **The `T-31` block's honest-residual paragraph continues to be the right architectural
  move.** It states the class, states that no regex over prose can decide it, names the
  specific known gaps, and closes with *"A number that escapes the recognizer is not
  thereby licensed — it is undetected, and this paragraph is the honest statement of that"*
  (`:1996-1999`, Read). Rounds 2–4 each answered an overstated label by widening the regex;
  round 5 replaced the totality claim with an enumerated one; rounds 6 and 7 have each
  closed a gap inside that enumeration rather than reopening the claim. The structure is
  holding. No standard violation.

---

## What's Actually Good

- **The Stop hook's loop-bound safety argument survives independent re-derivation against
  the installed binary — the strongest form of premise verification available here.** Under
  the expert-review rule that a comment inside the artifact is the author's claim and never
  the verification, I re-derived the header's central safety claim (`continuation-gate.mjs:53-59`,
  Read) rather than accepting it. The claim is that a Stop hook's blocking is capped by the
  platform at eight, independent of `stop_hook_active`. Verified directly:
  `grep -ao "STOP_HOOK_BLOCK_CAP.\{0,60\}"` over
  `~/.local/share/claude/versions/2.1.236` returns
  **`STOP_HOOK_BLOCK_CAP??8;if(ji>0&&$o>ji)return L("tengu_stop_hook_block_count"…`** and
  **`STOP_HOOK_BLOCK_CAP to raise this limit.`** The default is literally `8`, the
  enforcing comparison is present, and version 2.1.236 exists on disk as the comment states
  (alongside 2.1.233 and 2.1.235). `CLAUDE_CODE_STOP_HOOK_BLOCK_CAP` appears 4 times and
  `stop_hook_active` 5 times in that binary. The standard this is good by is the review
  discipline's own **premise-correctness** requirement applied at authoring time — a
  load-bearing safety claim about an external system, written with the evidence trail that
  lets a later reader re-derive it. Round 6 did not re-derive it; it holds.
- **The fail-open direction is the correct application of fail-safe defaults for this
  component, and the asymmetry is argued rather than assumed.** The standard is OWASP's
  fail-safe-defaults principle, whose correct reading is that the safe state depends on
  what the control protects — not that everything fails closed. The header at `:34-41`
  (Read) argues that this hook is a *continuation aid, not an integrity control*, that
  nothing downstream trusts its verdict, and that a fail-closed bug would re-block the
  owner's session on every successive Stop over a corrupt JSON file. Verified behaviorally,
  not just textually: corrupt, schema-invalid, and unreadable inputs each exited 0 with a
  distinct stderr note, while the integrity surface it names (the workflow's gates)
  remained fail-closed under mutation — neutering `if (!gt.ok)` turns the tier red. Getting
  the direction *different* between two co-located controls, and writing down why, is the
  part that is genuinely good.
- **The block reason gives the agent a legitimate exit, so the gate cannot become a
  dead end.** Read at `reasonFor`, `:124-133`: after naming the phase and the seven gate
  types, it closes *"If a genuine owner decision is needed, record the typed escalation in
  the ledger first — then this gate will let the turn end."* Verified behaviorally: the
  `open-gate` fixture exits 0, so the stated escape actually works rather than merely being
  offered. The standard is the usability requirement on any blocking control that it name
  the action that clears it; a gate that blocks without naming its own exit is the classic
  failure, and this one does not commit it.

---

## Convergence Record

- **Round number:** 7 (post-fix).
- **Trajectory** (findings by severity, each round's mechanical verdict breakdown):

  | Round | Findings | Breakdown |
  |---|---|---|
  | R1 | 6 | 1 Critical, 3 Serious, 2 Moderate |
  | R2 | 4 | 1 Serious, 2 Moderate, 1 Minor |
  | R3 | 3 | 1 Serious, 2 Moderate |
  | R4 | 4 | Systemic-led rework set |
  | R5 | 3 | 1 Systemic-recurring, 2 Moderate |
  | R6 | 2 | 2 Moderate (both recurring) |
  | **R7** | **1** | **1 Moderate (new)** |

- **Flow counts for this round.** Prior findings **closed: 2** (round-6 N1 and N2, each
  verified closed against its originally named standard by execution and mutation, not by
  reading the fix). **New: 1** (F1). **Regressions: 0** (the newest commit's one behavioral
  change was measured against the parent commit, found to have zero live instances and to
  narrow toward genuine instances — dropped as a candidate, recorded in Tentative Findings).
  **Recurring: 0** — the first round of this cycle in which the defining standard produced
  no recurring instance.

- **Tripwire evaluation — NOT FIRED**, both conditions, arithmetic shown.

  *Condition (a): new + regression ≥ closed, for two consecutive post-fix rounds.*
  R7: 1 + 0 = 1, closed 2 → **1 ≥ 2 is false**. R6: 2 + 0 = 2, closed 3 → **2 ≥ 3 is
  false**. Neither round satisfies it, so no two consecutive rounds can. **Not fired.**

  *Condition (b): total findings not strictly decreased, for two consecutive post-fix rounds.*
  R5 3 → R6 2 (strictly decreased) → R7 1 (strictly decreased). **Not fired.**

  The cycle is converging by both readings, and the composition of the residue is
  converging too: rounds 4–6 each produced a recurring instance of the count-restatement
  class, and round 7 produces none. The remaining finding is in a different, narrower place
  — one check's environment control.

---

## Ship-Readiness Judgment

**Nothing in this diff would harm a user who deploys it.** F1 lives entirely inside the
test tier: it changes no shipped behavior, is unreachable from the plugin's runtime
surface, and cannot alter what the workflow, the agents, the skills, the Stop hook, or the
preflight do on a real machine. Its worst realistic consequence is that an agent running
the structural tier from inside an active expert lifecycle sees one spurious red line and
spends a little time on it.

That judgment is grounded in the two things a deploying user actually runs, both exercised
here against real state rather than fixtures alone. The **Stop hook** — which becomes
always-on in every project the moment 0.4.0 is installed — allows in every state that is
not positive evidence of an in-flight lifecycle (no ledger, unrelated directory, terminal
phase, stale ledger, unresumable ledger, corrupt ledger, unreadable payload, loop guard
set), blocks only mid-phase with no open gate, names the action that clears the block, and
is bounded both by `stop_hook_active` and by a platform cap I confirmed at `??8` in the
installed binary. It costs ~50ms and touches one file at the project root. The
**preflight** reports the real installed cache correctly, keeps cache-manifest and
registry-recorded provenance distinct, and fails closed on staleness and unreadability.
All seven corrections' mechanisms are wired and guarded under mutation, no check was
silently lost across nineteen commits, and both tiers are green at HEAD.

So the distinction the dispatch asked for lands this way: **residual imperfection in a
guard, not user-facing risk.** The verdict is NEEDS FIXES because a finding of any severity
makes it so, and F1 should be fixed before the tier is trusted as an environment-independent
signal — but the artifact this branch exists to deliver is sound, and F1 is not a reason to
hold it back on safety grounds.

---

## Recommended Priority

The tripwire has **not** fired, so another targeted fix round is the indicated path rather
than foundational rework.

1. **F1** — the only finding. Route `T-30 exec (i)` through the helper's env-scrubbing rule
   and split its conflated claim, per the two-part fix in the finding. Small, local, and
   worth doing properly rather than by adding `env: { ...process.env, CLAUDE_PROJECT_DIR:
   '' }` inline: the helper already encodes the rule, and a second copy of it is the
   duplication this codebase has spent six rounds removing.
2. **Optional, no finding attached** — while in the block, consider adding *"a markdown
   restatement whose colon stops being terminal once its block is joined"* to the known-gaps
   paragraph at `:1996-1999`, and pinning `commands/expert.md`'s gate bullets against the
   evaluated `GATE` literal. Both are recorded as Observations, neither blocks PASS, and
   neither should be done at the cost of getting F1 wrong.

---

Verdict: NEEDS FIXES (1 finding: 1 Moderate)
