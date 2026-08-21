# Independent review — corrections 0.4.0, round 4

Reviewer: fresh dispatch, no retained context from rounds 1–3. The prior rounds reach this
review only as written records (inventory source 4) and every claim taken from them was
re-derived from current source before it could support a finding.

Branch `claude/edt-corrections-0.4.0`, thirteen commits `a903b12..f38a009`, plugin
`claude-plugins/expert-dev-tools/` at version 0.4.0.

> **Erratum — added 2026-08-21, after this review was delivered.** The commit count in
> the line above is wrong. The original text is left unaltered, because this record is
> evidence of what the reviewer concluded and when. Re-measured with
> `git rev-list --count`: `a903b12..f38a009` holds **10** commits (**11**
> counting `a903b12` itself); no reading of the branch yields thirteen.
> The figure had begun drifting one commit per round and kept drifting
> through round 7.
> Found and corrected post-review in round 8 (finding F8-2). Only the figure is wrong;
> no conclusion in this record rests on it.

---

## Scope and Inventory

**Round number:** 4 (Post-fix). Prior rounds: R1 6 findings, R2 4, R3 3.

### Source 1 — the prior review's full inventory

Carried forward from `docs/reviews/corrections-0.4.0-round-03.md` and re-verified in this
pass rather than inherited.

- [x] `scripts/preflight-deployment.mjs` — **Read** in full, `:1-299`.
- [x] `hooks/continuation-gate.mjs` — **Read** in full, `:1-242` (three ranges: `:1-20`,
      `:20-85`, `:85-242`).
- [x] `hooks/hooks.json` — **Read** in full (Stop event, `timeout: 10`, single command).
- [x] `commands/expert.md` — **Read** step 1 in full via `awk '/^## 1\./,/^## 2\./'`;
      grep-verified for verdict tokens (`UNREADABLE|STALE|CURRENT|PROVENANCE-ONLY`).
- [x] `workflows/expert-lifecycle.js` — **Read** `:64-74` (GATE literal), `:688-747`
      (spec/architecture dispatch consumption), `:959-1018` (ground-truth + closeout, via
      `git show f38a009`); grep-verified for every dispatch site (`await agent(` /
      `await diagnose(`, 30 hits enumerated) and every `GATE.control_fault` site (10 hits).
- [x] `tests/structural/check-structure.mjs` — **Read** `:1525-1603` (T-29 partition and
      verdict-routing class), `:1605-1791` (T-31 in full), `:826-874` (T-24 empty-set
      class); grep-verified for discovery constructs (`readdirSync|floor|ceiling`, 50 hits
      reviewed).
- [x] `tests/unit/run-unit-tests.mjs` — **Executed** (46 checks, 0 failures).
- [x] `scripts/ledger.schema.json` — **Read** via `git diff origin/main...HEAD` (full hunk:
      `task_verbatim` added to `required` and `properties`).
- [x] `scripts/validate-ledger.mjs` — **Read** via the same diff (full hunk: `minLength`
      support added); grep-verified that it `export`s `validate` at `:38`.
- [x] `agents/expert-verifier.md` — **Read** `:8`, `:14`, `:16-40`, `:61` (job counts and
      the five numbered jobs).
- [x] `agents/expert-corrector.md`, `agents/expert-implementer.md`,
      `agents/expert-reviewer.md` — **Read** via `git diff origin/main...HEAD -- agents/`
      (all changed hunks).
- [x] `agents/*.md` (all 10) — **Grep-verified** for the derived-count class:
      `'You answer \*\*[0-9]+\*\*|^jobs: [0-9]+'`, 20 hits enumerated (finding N2).
- [x] `skills/expert-correct/SKILL.md` — **Read** `:88-109`.
- [x] `skills/expert-architecture-portable/SKILL.md` — **Read** `:204-233`.
- [x] `skills/expert-architecture/SKILL.md` — **Read** at `:226`, `:300`, `:330` plus
      following blocks (the emphasis-free exemption's premise).
- [x] `skills/expert-review/SKILL.md` — **Read** `:561-567`; grep-verified for
      `"names the standard it was evaluated against"` (2 hits: `:5`, `:561`).
- [x] `skills/expert-standard/SKILL.md`, `skills/expert-spec/SKILL.md`,
      `skills/expert-implement/SKILL.md` — **Grep-verified** via the T-31 admitted dump
      (24 admitted lines with file:line, stated and counted values).
- [x] `docs/specs/spec-expert-dev-tools.md` — **Read** `:127-163` (§3.4, the seven gate
      types); grep-verified for `gate` (25 hits).
- [x] `docs/arch/architecture-expert-dev-tools.md` — **Grep-verified**
      (`control_fault|control fault`, 2 hits at `:229`, `:234`).
- [x] `.claude-plugin/plugin.json` — **Grep-verified** via diffstat (version 0.4.0).

### Source 2 — the fix diff (commit `f38a009`)

- [x] `commands/expert.md` (+19) — Read, above.
- [x] `scripts/preflight-deployment.mjs` (+27) — Read, above.
- [x] `tests/structural/check-structure.mjs` (+300) — Read, above.
- [x] `workflows/expert-lifecycle.js` (+33) — **Read** in full via `git show f38a009 --`
      (both hunks: the ground-truth criteria floor and the closeout report-path guard).
- [x] `docs/reviews/corrections-0.4.0-round-03.md` (+587) — **Read** `:195-261`,
      `:263-411`, `:415-424`, `:515-562`.

### Source 3 — fix-diff dependents

- [x] `hooks/continuation-gate.mjs` — depends on `scripts/validate-ledger.mjs` (import at
      `:67`) and on `workflows/expert-lifecycle.js` by citation (`:82`). Both re-verified;
      the citation dependency is finding N4.
- [x] `tests/unit/run-unit-tests.mjs` — imports the hook's `decide`, `TERMINAL_PHASES`,
      `projectRoot`. Executed.
- [x] `tests/structural/check-structure.mjs` — imports `preflightDeployment`,
      `COMPARED_TREES`, `COMPARED_FILES`, `EXCLUDED_TREES`, `EXCLUDED_FILES`. Executed.

### Source 4 — the prior round's findings as closure items

R3-F1, R3-F2, R3-F3 — each re-derived from source and **verified by execution and
mutation**; dispositions in Upstream Contract Verification below.

### Tool plan (Step 3)

Instruments available and used: **Read** (literal-content claims), **grep** (absence and
population claims), **Bash/node** (behavioral claims — 9-probe mutation battery on isolated
scratch copies plus 4 preflight probes and 3 real-state executions), **git** (provenance
claims via `log -S` and `show <commit>:<path>`), **Clear Thought** (`metacognitivemonitoring`
at start, `collaborativereasoning` before delivery).

Claim-type mapping: absence → grep with query and count recorded; literal content → Read at
file:line at drafting time; behavioral → executed probe with observed exit code and stdout;
structural/provenance → `git log -S` naming the introducing commit; prior-document claims →
re-derived with the instrument the underlying claim type requires; author-comment claims
inside the artifact (the T-31 designation reasons, the hook's line citations, the fix
commit's message) → re-derived from source, and two of them proved false (N4).

**No instrument class was unavailable.** Context7 was not required: this diff integrates no
third-party library — every dependency is a Node builtin (`node:fs`, `node:crypto`,
`node:os`, `node:path`, `node:url`), verified by Read of the import blocks in
`preflight-deployment.mjs:27-31` and `continuation-gate.mjs:64-67`. The one external-behavior
claim in scope (the platform's `stop_hook_active` and block-cap contract, asserted at
`continuation-gate.mjs:43-58`) is a claim about the Claude Code host, not a library, and is
treated in Observations.

**Probe-environment baseline.** A bare directory copy of the plugin fails **3** structural
checks for environmental reasons — `T-A2a workflow: canonical linter present`,
`T-20 baseline reachable from git`, `T-20 check-structure baseline reachable from git` — the
repo-root linter and the git baselines being unreachable outside the repo. Every mutation
result below is reported as a delta against that 3-failure baseline, so environment is never
read as defect. (The briefing anticipated four; the fourth, `.git` unclassified, does not
arise because the plugin directory is not itself a git root and `cp -r` copies no `.git`.)

**No rigor waivers.** No step was skipped and no compression was directed.

### Execution results at HEAD

Both tiers executed from the plugin directory, in the working tree, at `f38a009`:

- `node tests/structural/check-structure.mjs` → **434 `ok`, 0 failures**, `STRUCTURAL TESTS PASSED`.
- `node tests/unit/run-unit-tests.mjs` → **46 `ok`, 0 failures**, `UNIT TESTS PASSED`.

The commit message claims "Structural 417->434". The 434 is confirmed by execution. Counts
were taken from the runner's own output, never from the commit message.

### Mutation and probe battery (all on isolated scratch copies; the working tree was never mutated)

| Probe | What it does | Expected | Observed |
|---|---|---|---|
| P-A | registry `{"q@m":[]}` (empty install-record array), worktree supplied | fail closed | **exit 2, `VERDICT: UNREADABLE`**, two named problems |
| P-B | registry record + cache manifest + tree all matching | allow | **exit 0, `CURRENT`** |
| P-C | one cache file's bytes edited, no version bump | block | **exit 1, `VERDICT: STALE`** |
| P-D | `installPath` pointing at a nonexistent directory | fail closed | **exit 2, `UNREADABLE`** |
| M1 | drift a **counted** T-31 site (`expert-plan/SKILL.md:297`, four→five) | redden | **4 failures** (baseline+1): `drifted: …:297 says 5, has 4` |
| M2 | drift the round-3 F2 exemplar (`expert-implement/SKILL.md:119`, mid-line cardinal) | redden | **5 failures** (baseline+2), including the named anti-recurrence check |
| M3 | **narrow the population** — reword a line so `CARDINAL_RE` stops admitting it | redden | **5 failures**: `admitted 23, floor 24` and `counted 17, floor 18` |
| M4 | drift inside the **emphasis-free** file (`expert-architecture/SKILL.md:226`, three→nine) | — | **3 failures = baseline; passes green** (finding N3) |
| M5 | **designate-away** — plant a drift and add a 4th `DESIGNATIONS` entry excusing it | redden | **4 failures**: `counted 17, floor 18; designated 7, ceiling 6` |
| M6 | add a **fifth verdict** to the preflight script, unrouted in the command | redden | **4 failures**: `emitted: CURRENT, PARTIAL, …; unrouted: PARTIAL` |
| M7 | add an unclassified `lib/` tree to the plugin root | redden | **4 failures**: `unclassified: lib` |
| M8 | keep the token `UNREADABLE` in step 1 but gut its disposition prose | redden | **4 failures**: the dedicated routing check reddens |
| M9 | drift the **prose** counts in `agents/expert-verifier.md` (five→six, **5**→**6**) | redden | **3 failures = baseline; passes green** (finding N2) |
| M9b | control — drift the **pinned** frontmatter `jobs: 5`→`6` in the same file | redden | **4 failures**: `T-2b expert-verifier: jobs: equals its distinct dispatch-label count (5)` |

### Real-state exercises (both gates, both directions)

- **Continuation gate against this repository's live ledger**
  (`C:/Users/maxco/Documents/agent-armory/.claude/expert/ledger.json`, `phase: "closeout"`,
  `revision: 5`, mtime `2026-08-17T21:02:38Z`, age 3.76 days, unpinnable — cited by path and
  date, outside version control): executed the real hook with a real Stop payload →
  **exit 0**, stderr `ledger is not schema-valid ($: missing required property
  'task_verbatim') and so is not resumable; allowing the stop.` Allowed twice over — the
  ledger is both unresumable and 3.76 days past the 1-day window. **No live session is
  trapped by this hook in this repository.**
- **Same ledger, made schema-valid and freshened** (scratch copy, `task_verbatim` supplied):
  → **exit 2**, with the reprompt naming phase `closeout`, routing to `/expert resume`, and
  listing all seven §3.4 gate types. Aged 2 days → **exit 0** via the staleness axis. The
  gate blocks what it must block and allows what it must allow on real-shaped data.
- **Preflight against the real installed deployment**
  (`~/.claude/plugins/cache/claude-armory/expert-dev-tools/0.3.0`, registry record read from
  `~/.claude/plugins/installed_plugins.json`, `gitCommitSha`
  `bb7107b34f19f4380fd7975500357d29afdf80c9`, unpinnable — cited by path and date) vs this
  working tree: → **exit 1, `VERDICT: STALE (installed 0.3.0 … working tree 0.4.0)`**.
  Correct: the branch is 0.4.0 and the installed cache is 0.3.0.

---

## Summary

**This review returns NEEDS FIXES.** All three round-3 findings are genuinely closed —
verified by execution and mutation, not by reading the fix diff — and the round-3 remedy for
the cycle's measured defect class is the strongest control this codebase has produced: the
T-31 coverage contract survived every adversarial probe aimed at it, including population
narrowing (M3) and designation laundering (M5), both of which it detects and reddens on. The
work is close. What keeps it from PASS is that the same defect class the cycle has been
chasing for three rounds — a control whose stated scope exceeds its actual reach — is still
present in two new places the round-3 fix did not look: the sweep's own *label* claims
totality over 24 sites while measuring 18 (N3), and the sweep's *directory scope* stops at
`skills/` while twelve instances of the identical hand-maintained derived count sit unpinned
in `agents/` (N2), two of which this very branch hand-edited. Separately, the preflight
script reports a provenance number it never verified (N1), and a systemic pattern of unpinned
cross-file line citations has already rotted — one of them broken by the round-3 fix commit
itself (N4).

---

## Upstream Contract Verification

### Round-3 findings as closure items

| Prior | Standard originally named | Status | Closure verification |
|---|---|---|---|
| R3-F1 (Serious) — empty install-record array yields `CURRENT` | Fail-safe defaults (OWASP secure-design) | **closed** | Read of `preflight-deployment.mjs:165-168` (empty-array problem) and `:252-256` (`compared` = entries that actually completed a comparison; `CURRENT` requires positive evidence). **Executed P-A**: exit 2, `UNREADABLE`, both problems named. Controls P-B/P-C/P-D confirm `CURRENT`, `STALE` and the not-found path are all still correct — the fix did not over-correct into blocking healthy states. Pinned by `T-29 preflightDeployment: an installs list that completed no comparison is UNREADABLE with a stated problem, never CURRENT` (`check-structure.mjs:1527`). |
| R3-F2 (Moderate, regression) — sweep reaches 7 of 26 | Single source of truth for derived data (DRY), plus the marked first-principles articulation that a control must not overstate its reach | **closed at the reported class** | The column-0 anchor is gone; `CARDINAL_RE` (`:1631`) admits a cardinal anywhere in a line with no sentence break before a terminal colon. **Executed M2** — the exact instance round 3 planted and the old sweep missed now reddens two checks. **M1** confirms drift detection at a second, differently-formed site. **M3** confirms the population cannot be silently narrowed. **M5** confirms a drift cannot be designated away. Reach is now a measured property (`admitted 24 / counted 18 / designated 6`), not a claim. Residual: the label overstates and the directory scope stops at `skills/` — filed as N3 and N2 rather than as a failed closure, because the standard R3-F2 named is satisfied across the population R3-F2 measured. |
| R3-F3 (Moderate) — `UNREADABLE` unrouted in the command | Complete mediation applied to an exit contract | **closed** | Read of `commands/expert.md` step 1: all four verdicts now carry dispositions — `STALE`→D15, `UNREADABLE`→`control_fault` halt with `problems` reported verbatim, and `CURRENT`/`PROVENANCE-ONLY` explicitly named as "the only verdicts that let a phase start" with the provenance-only bound stated. **Executed M6**: a fifth verdict added to the script reddens `T-29 every preflight verdict the script can emit has a disposition in command step 1 (unrouted: PARTIAL)` — the verdict list is lifted from the script's printed lines (`:1584-1585`), so this is a class closure, not a third patch. **Executed M8**: retaining the token while gutting the disposition still reddens the dedicated routing check. |

### Spec and architecture conformance

`docs/specs/spec-expert-dev-tools.md` and `docs/arch/architecture-expert-dev-tools.md` are
the upstream artifacts for this scope.

| Contract | Status | Verification method |
|---|---|---|
| Spec §2 hooks amendment (2026-08-20) authorizes a hook that blocks no tool use | **honored** | Read of `hooks/hooks.json` — the sole registration is a `Stop` hook. Read of `continuation-gate.mjs:11-14`. No `PreToolUse`/`PostToolUse` registration exists (grep over `hooks/`, 0 hits). |
| Spec §3.4 — the owner is interrupted for exactly seven gate types | **honored** | Read of spec `:127-153` (seven enumerated). Read of `workflows/expert-lifecycle.js:64-74` — the `GATE` literal has exactly seven members. The hook's reprompt names all seven (executed on the real-shaped ledger; observed stderr lists intent, spec_traceable, business, risk_override, non_convergence, core_approval, control_fault). Pinned by the T-24 GATE-literal evaluation check (`:864-874`). |
| Spec §3.4 gate 7 (`control_fault`) covers a mechanical control that could not run or returned less than asked | **honored** | Read of the two new sites added by `f38a009`. The ground-truth criteria floor (`:967-974`) is a verification dispatch returning nothing — squarely inside the definition. The closeout report-path guard (`:1012-1017`) is a schema-conformance check on a dispatch return, the same shape as the pre-existing `skill_activation`-echo and scope-check-record faults at `:1180` and `:1245`; the architecture states the type as "a mechanical control could not run" (`:234`) without the spec's narrowing parenthetical. Consistent with established in-tree usage. See Observations for the spec/architecture wording divergence. |
| Architecture: gate payload shape `type, what_happened, diagnosis?` (`:229`) | **honored** | Read of both new gate returns — each carries `type`, `what_happened`, `options`, `recommendation`. |
| Ledger schema is the single source of ledger validity, shared by `/expert` step 1 and the hook | **honored** | The hook imports `validate` from `scripts/validate-ledger.mjs:38` (Read of `continuation-gate.mjs:67`) and loads `scripts/ledger.schema.json` (`:106`). One validator, one schema — the comment's claim at `:159-161` re-derived and confirmed, not accepted. |

---

## Critical & Serious Findings

**No Critical or Serious findings.** The full inventory was Read or Grep-verified per
Compliance Gate B; both tiers and all three round-3 closures were re-executed; the
fourteen-probe mutation and real-state battery above found no violation of Critical or
Serious classification. Specifically checked and **not** found: a fail-open path to an
affirmative preflight verdict (P-A/P-D both fail closed), a session-trapping continuation
gate (the real ledger allows, twice over), a live count drift anywhere in `skills/` or
`agents/` (all 24 counted sites and all 12 agent sites currently agree with their lists), and
an unguarded affirmative outcome at any workflow dispatch (all 30 dispatch sites enumerated
and their consumption Read).

---

## Systemic Patterns

### N4 — Cross-file line citations are shipped with no immutable anchor, and two of the three have already rotted; the round-3 fix commit broke one of them itself (Systemic — regression)

**Location:** `hooks/continuation-gate.mjs:82` and `workflows/expert-lifecycle.js:36`

**Proactive scan across the full inventory scope.** Query:
`grep -rnE '[a-zA-Z0-9_/.-]+\.(js|mjs|json|md):[0-9]+' hooks/ scripts/ agents/ commands/ skills/ workflows/`,
excluding `docs/` and `tests/` (which are not shipped behavior). **Result: 3 instances**,
enumerated exhaustively:

1. `hooks/continuation-gate.mjs:72` → `commands/expert.md:13`. **Correct.** Read of
   `commands/expert.md:13`: `` Ledger path: `${CLAUDE_PROJECT_DIR}/.claude/expert/ledger.json` ``.
2. `hooks/continuation-gate.mjs:82` → `expert-lifecycle.js:988`. **WRONG.**
3. `workflows/expert-lifecycle.js:36` → `skills/expert-review/SKILL.md:565`. **WRONG.**

**What the code does now, and how each claim was verified.**

*Instance 2.* The hook's comment at `:80-85` justifies the single most consequential design
decision in the file — that `closeout` is deliberately not in `TERMINAL_PHASES` — with:
*"expert-lifecycle.js:988 shows the phase's own dispatch is still ahead of it … and
`delta.phase = 'complete'` is written only after that agent returns (:989)."* Read of
`workflows/expert-lifecycle.js:986-990` at drafting time shows those lines are inside the
**reconciliation** block (`const recon = await agent(...)`, `verifierUnderCovered`) — entirely
unrelated code. `grep -n "Closeout: write the final report\|delta.phase = 'complete'"` locates
the real targets at **`:1001` and `:1018`**.

Provenance, re-derived: `git log -S"expert-lifecycle.js:988" -- hooks/continuation-gate.mjs`
returns **`927c0f8`** (the round-2 fix) as the introducing commit. `git show
927c0f8:…/workflows/expert-lifecycle.js | sed -n '988,989p'` returns the closeout dispatch and
`delta.phase = 'complete'` — **the citation was accurate when written.** `git show f38a009
--stat -- workflows/expert-lifecycle.js` shows **31 insertions**, 22 of them the closeout
report-path guard inserted between the dispatch and the completion write. The round-3 fix
shifted the target and did not update the citing comment. **Regression, introduced by
`f38a009`.**

*Instance 3.* `workflows/expert-lifecycle.js:35-36` reads: *"The reviewer names a standard per
finding (skills/expert-review/SKILL.md:565)."* Read of `skills/expert-review/SKILL.md:563-567`
shows `:565` is the **positive-assessments** bullet. `grep -n "names the standard it was
evaluated against"` over that file returns 2 hits — `:5` (frontmatter) and **`:561`**, the
Gate A bullet the comment means. Off by four. Provenance:
`git log -S"skills/expert-review/SKILL.md:565" -- workflows/expert-lifecycle.js` returns
**`f01bded`**, a commit outside this branch — this instance **predates** `a903b12` and was not
introduced by any fix round. `git diff origin/main...HEAD -- skills/expert-review/SKILL.md`
shows this branch's only edit to that file is a same-line replacement at `:400`, which shifts
nothing, so the branch did not cause this one; it merely ships it.

**Standard violated.** The plugin's own published citation rule, which this repository
authors and enforces on others: `skills/expert-review/SKILL.md` Step 6 requires that a claim
about a file outside the artifact under review be cited **"by an immutable identifier, never
by path alone. A file under version control is cited by path *and commit*,"* and states the
rationale verbatim — *"A path-and-date citation to a mutable file stops being checkable the
moment that file changes, and in a repository with parallel sessions that can be hours."*
(Read at `skills/expert-review/SKILL.md`, Step 6 bullet on out-of-artifact claims.) Both
defective instances are exactly the shape the rule forbids, in the plugin that ships the rule.
Reinforced by the same file's Gate A location grammar at `:563`, which exists because
"downstream controls parse the range."

**Why this is systemic rather than isolated.** Two of the three instances of the construct in
shipped source are wrong, and the mechanism that made them wrong is structural, not careless:
a bare `path:NNN` in a comment has no relationship to the thing it names, so any edit above
the target silently invalidates it, and nothing in either tier detects it. The round-3 fix
demonstrated the mechanism end to end within a single commit — it edited the cited file and
the citing file was not even in its diff. The class will keep rotting on every insertion. It
also carries a second-order cost specific to this codebase: instance 2 is the *justification*
for a decision two prior rounds argued over, so a future maintainer auditing whether
`closeout` should be terminal is sent to unrelated code and loses the evidence for the answer.

**What correct looks like.** Cite by a stable anchor rather than a line number: name the
symbol or the searchable string (`the closeout dispatch in expert-lifecycle.js, label
'closeout'`; `expert-review/SKILL.md, Gate A — "names the standard it was evaluated
against"`), which survives insertion. Where a line number genuinely helps, pair it with the
commit per the project's own Step 6 rule. Then pin the class: a structural check that extracts
every `path:NNN` from shipped source, reads that file at that line, and asserts a caller-
supplied expected substring is present — the same lift-and-verify shape `T-29` already uses
for the verdict list at `check-structure.mjs:1584`, which is why this is a closure rather than
a third hand-patched citation.

---

## Moderate & Minor Findings

### N1 — The preflight reports `installed_version` from the registry's unverified claim, never compared against the cache manifest the staleness verdict actually uses, and prints it in a quotable line that can assert a match between two different numbers (Moderate — new)

**Location:** `scripts/preflight-deployment.mjs:198-206, 237, 292`

**What the code does now.** `entry.installed_version` is assigned `rec.version` — the version
string recorded in `installed_plugins.json` (`:198`). `entry.cache_manifest_version` is read
from the cache's own `.claude-plugin/plugin.json` on disk (`:199`). The staleness comparison
uses **only** the manifest value (`:205-206`:
`if (entry.cache_manifest_version !== report.worktree_version)`). But the quotable top-level
field is the registry value (`:237`: `report.installed_version = primary.installed_version`),
and so is the printed verdict line (`:292`:
`` VERDICT: CURRENT (installed ${report.installed_version} matches working tree ${report.worktree_version}) ``).
The two version sources are never compared to each other.

**How the claim was verified.**

- Read of `scripts/preflight-deployment.mjs:194-206`, `:232-241`, `:275-294` at drafting time.
- `grep -n "installed_version\|cache_manifest_version\|rec.version"` over the file: **8 hits**,
  each Read in context. No hit compares `rec.version` against `cacheManifest.version`.
- **Executed** (probe P-B). Registry record `version: "1.0.0"`; cache manifest on disk
  `version: "9.9.9"`; working tree `9.9.9`; all compared trees byte-identical. Result:
  **exit 0** and the printed line
  **`VERDICT: CURRENT (installed 1.0.0 matches working tree 9.9.9)`** — a sentence asserting
  that 1.0.0 matches 9.9.9. The verdict itself is right (the compared set genuinely matched);
  the provenance it reports is not.
- `grep -rn "cache_manifest_version\|installed_version"` over `tests/`: **2 hits**
  (`check-structure.mjs:1370`, `:1380`), both fixtures constructed so the registry version and
  the manifest version agree — so no existing check exercises divergence.
- Real-state check: the live registry record's `version` is `0.3.0` and the cache manifest at
  its `installPath` is `0.3.0` — they agree today, so this is latent, not currently firing.
- Provenance: the file was introduced by `0ef9850` on this branch; `git log` shows no prior
  round reported this. **New.**

**Standard violated.** The script's own governing principle, stated in its code at `:243-251`
and load-bearing for every claim built on it: *"Every affirmative verdict rests on POSITIVE
evidence, never on the absence of a recorded difference."* The header extends this to the
report as a whole — *"COVERAGE IS THE CONTRACT"* (`:11-18`). `installed_version` is the
registry's assertion about a directory, published as a fact about that directory without ever
opening it, while the value that *was* read from that directory sits unused two lines away.
This is the same fail-open shape as R3-F1 relocated from the verdict to the provenance fields:
an unverified input reported as a verified output.

**Why it matters.** `commands/expert.md` step 1 makes this report the sole admissible ground
for behavioral claims — *"no claim about the running plugin's behavior, and no request that
the owner reload/update/re-test, is made without quoting this report"* — and the
`PROVENANCE-ONLY` disposition added in round 3 explicitly bounds claims by "the provenance the
report does carry (cache path, installed version, commit)." A registry whose `version` has
drifted from the cache it points at is precisely a deployment-provenance fault, and it is the
one fault this provenance script reports incorrectly rather than detects. The printed line is
the acute case: an agent quoting `CURRENT (installed 1.0.0 matches working tree 9.9.9)` to the
owner has quoted the report faithfully and stated something false.

**What correct looks like.** Treat a divergence between the registry record's `version` and
the cache manifest's `version` as a first-class registry-integrity problem: after reading
`cacheManifest`, push a `problems` entry when both are non-null and unequal, naming both
values — which routes it through the single existing `UNREADABLE` rule at `:258` rather than
adding a second verdict path. Independently, make the quotable fields report what was
actually read: `report.installed_version` should carry the cache manifest's version (the disk
truth the comparison used), with the registry's claim retained under a distinct name such as
`registry_recorded_version` so the two are never conflated. Pin it with a structural check
building a fixture whose registry version and cache manifest version disagree, asserting exit
2 and that both numbers appear in `problems` — alongside the malformation probes already at
`:1399-1445`.

### N2 — The derived-count class was swept across `skills/` and stops at the directory boundary; twelve instances of the identical construct in `agents/` are unpinned, and this branch hand-edited three of them (Moderate — new)

**Location:** `tests/structural/check-structure.mjs:1671` (the sweep's scope) and
`agents/expert-verifier.md:14,61`

**What the code does now.** T-31's population is built from
`readdirSync(join(ROOT, 'skills')).map((s) => 'skills/' + s + '/SKILL.md')` (`:1671`) — every
admitted line, every count, every floor and ceiling is scoped to `skills/*/SKILL.md`. The
same construct — a hand-maintained cardinal restating a number that is derived elsewhere in
the same file — occurs throughout `agents/*.md` and is not swept.

**How the claim was verified.**

- Read of `tests/structural/check-structure.mjs:1671` at drafting time.
- **Population measured, not extrapolated.** `grep -rnE 'You answer \*\*[0-9]+\*\*|^jobs: [0-9]+' agents/`
  → **20 hits across 10 files**: each agent file carries a `jobs: N` frontmatter field and a
  prose restatement *"You answer **N** distinct dispatch(es)…"*. Additionally
  `grep -rnEi '\b(two|three|…|ten)\b[^.]*:$' agents/ commands/` → **3 hits**:
  `agents/expert-diagnostician.md:18` ("one of two modes"),
  `agents/expert-verifier.md:14` ("one of five mechanical jobs"), and
  `commands/expert.md:258` ("the seven gate types" — already pinned by the T-24 GATE-literal
  evaluation check at `:864-874`, so not part of this population).
- **The pinned half re-derived.** `grep -rn "jobs\b" tests/structural/check-structure.mjs` →
  **2 hits**, `:169-170`:
  `` check(`T-2b ${name}: jobs: equals its distinct dispatch-label count (${e.labels.size})`, String(fm.jobs) === String(e.labels.size)) ``.
  The **frontmatter** count is machine-derived from the workflow's dispatch labels. The ten
  `You answer **N**` restatements and the two prose cardinals are not.
- **Executed M9** (scratch copy): changed `agents/expert-verifier.md` "one of five mechanical
  jobs" → "one of six" and "You answer **5**" → "**6**", leaving `jobs: 5` correct. Structural
  tier: **3 failures — exactly the probe baseline, zero delta.** Both drifts invisible.
- **Control executed, M9b**: drifting the frontmatter `jobs: 5` → `6` instead reddens
  `T-2b expert-verifier: jobs: equals its distinct dispatch-label count (5)`. The pin works on
  what it covers; the finding is what it does not cover.
- **Current state confirmed clean**: Read of `agents/expert-verifier.md:8,14,16-40,61` — `jobs: 5`,
  "one of five", five numbered jobs, "You answer **5**", all agreeing; the grep output shows
  every other file's `jobs: N` matching its `You answer **N**`. **No live drift** — this is
  exposure, not a present defect.
- **This branch edited the class.** `git diff origin/main...HEAD -- agents/` shows
  `-jobs: 4` → `+jobs: 5`, `-one of four mechanical jobs` → `+one of five`, and
  `-You answer **4**` → `+You answer **5**` — three coupled hand-edits in one file, of which
  the tier would have caught only the first had one been missed.
- Provenance: no prior round reported the `agents/` population. Round-3 F2's own proactive
  scan was scoped `--include=SKILL.md skills`, so this population was never in view. **New.**

**Standard violated.** Single source of truth for derived data (DRY) — the same standard
round-2 F4 and round-3 F2 were both filed under. A number that is already machine-derived in
a file (`jobs:`, checked against the workflow's dispatch labels) is restated by hand one to two
more times in the same file, with nothing tying the restatements to the derivation. Reinforced
by the project's own standing correction rule, which this branch is an application of: a
finding is a symptom, and the correction sweeps the class. The round-3 correction swept the
class by *construct* (dropping the column-0 anchor — correct, and it worked) but not by
*population*: it kept the directory scope it inherited, and the class does not stop at
`skills/`. `agents/*.md` are behavior-bearing instruction files loaded into dispatched agents,
not documentation — a wrong count there misinstructs an agent about how many jobs it answers.

**Why it matters.** The measured defect class of this whole cycle is a control whose reach is
narrower than the class it is understood to close. After round 3, the count-drift class reads
as closed: the tier reports a measured population, a floor, a ceiling, and `drifted: none`.
Twelve sites of that class sit outside the measurement, in the directory this branch was
actively editing, with a demonstrated three-edit coupling that a single miss would ship
silently.

**What correct looks like.** Extend the sweep's population from `skills/*/SKILL.md` to the
shipped instruction files that carry the construct — `agents/*.md` alongside them — so
admission is defined by the construct and the file's role, not by one directory name. For the
`You answer **N**` restatements specifically, the correct fix is stronger than pinning: the
number is already derived at `T-2b` from the workflow's dispatch labels, so assert the prose
restatement against that same derived value rather than against itself, which removes the
duplicate instead of guarding it. Then raise T-31's `admitted` floor to the new measured
population so shrinkage still reddens, and correct the check labels to name the scope actually
swept.

### N3 — T-31's drift check is labelled "every stated count" while it examines 18 of the 24 it admits, and a real drift in the other 6 passes with that line printing green (Minor — new)

**Location:** `tests/structural/check-structure.mjs:1772-1775`

**What the code does now.** `drifted` is computed from `counted` (`:1773`:
`const drifted = counted.filter((h) => h.stated !== h.counted)`), where `counted` is defined at
`:1741` as the admitted lines that are **not designated**. The check that consumes it is
labelled `` `T-31 every stated count matches its list (drifted: …)` `` (`:1774`). The six
designated lines carry stated counts that are never matched against a list, so "every stated
count" describes 18 of the 24 the sweep admits.

**How the claim was verified.**

- Read of `tests/structural/check-structure.mjs:1741-1745`, `:1772-1775` at drafting time.
- **Instrumented execution** on a scratch copy (a `console.error` dump of `admitted` inserted
  before the assertions, then removed with the copy): **24 admitted, 18 counted, 6 designated**,
  each with `file:line`, `stated`, `counted` and designation status. The six designated:
  `expert-architecture/SKILL.md:226,300,330` (auto-designated as an emphasis-free file),
  `expert-architecture-portable/SKILL.md:206` (stated 3, resolver counts 4),
  `expert-correct/SKILL.md:92` (stated 5, resolver counts 6), `expert-review/SKILL.md:39`.
- **Executed M4**: changed `skills/expert-architecture/SKILL.md:226` from "Three categories of
  problem can surface" to "Nine categories", leaving the list untouched. Structural tier:
  **3 failures — exactly the probe baseline, zero delta** — and the tier printed
  `ok T-31 every stated count matches its list (drifted: none)`. A live, real count drift in a
  shipped skill file, with the tier stating that every stated count matches.
- **The designation reasons were re-derived from source, not accepted as comments** (they are
  author claims inside the artifact). `expert-correct/SKILL.md:92` — Read of `:92-103`: "five
  required fields" over six bulleted entries, the sixth being `open_sites` marked "(when
  applicable)". Reason **accurate**. `expert-architecture-portable/SKILL.md:206` — Read of
  `:206-215`: three bolded categories followed contiguously by a bolded "**Watch the trap.**"
  aside. Reason **accurate**. `expert-architecture/SKILL.md` — Read at `:226`, `:300`, `:330`
  and the blocks beneath each: entries are plain blank-line-separated paragraphs with no
  emphasis and no markers. Premise **accurate**. Every designation is honestly grounded; the
  finding is not that the exemptions are wrong, it is that the label does not say they exist.
- **The exemption channels are otherwise tight**, verified adversarially: M5 (add a fourth
  `DESIGNATIONS` entry to excuse a planted drift) reddens on `designated 7, ceiling 6`; M3
  (reword a line out of admission) reddens on both `admitted 23, floor 24` and
  `counted 17, floor 18`. `designated` sits exactly at its ceiling and `counted` exactly at its
  floor, so the excused set cannot grow and the counted set cannot shrink without failing.
- Provenance: the label predates `f38a009` — round-3's record quotes the same string from the
  round-2 sweep — and no prior round reported it. **New.**

**Standard violated.** First-principles, marked as such and stated in round 3's own words at
`check-structure.mjs:1613-1616`, which this codebase adopted as the governing articulation for
this defect class: *"The defect was not the missing sites; it was that the control's stated
scope exceeded its actual reach, so the class looked closed."* The T-31 block's own opening
comment commits to the remedy — *"coverage here is a MEASURABLE PROPERTY, not a claim"* — and
the block delivers on it everywhere except this one label, which reverts to the claim form.
The goal the block sets is that a maintainer can read the tier output and know the class's
state; the shortcut is a totality word covering a filtered subset; the shortcut fails the goal
because `drifted: none` under the words "every stated count" retires exactly the question M4
answers in the negative.

**Why it matters.** This is the smallest possible instance of the cycle's measured class, in
the control built to close that class, and it is the one line of T-31 a maintainer is most
likely to read as the verdict on the whole sweep. The adjacent check does report
`counted 18 … designated 6` honestly, so a reader who reads both is not deceived — which is
why this is Minor and not Moderate — but the two lines say different things and only one of
them is right.

**What correct looks like.** Rename the check to the population it measures — *"every
**counted** claim matches its list"* — and, since the designated six are the sweep's declared
blind spot rather than a hidden one, state the residual in the label the way the sibling
checks already do: include the designated count so the green line reads as "18 counted, 0
drifted, 6 designated" rather than as totality. No predicate change is needed; the assertion
is correct, only its name is not.

---

## Tentative Findings

**No tentative findings.** Every candidate finding's premise was verified per Compliance
Gate B — each by Read at the cited lines at drafting time, plus executed probes with observed
exit codes for every behavioral claim, plus `git log -S` / `git show <commit>:<path>` for every
provenance claim. The one candidate that could not have been settled by reading —whether the
round-3 fix commit broke the citation it now mis-points (N4, instance 2) — was resolved by
retrieving the file at `927c0f8` and confirming the citation was accurate at that commit.

---

## Observations

Non-finding context. No standard violation and no severity is asserted in this section.

- **Spec §3.4 and the architecture describe gate 7 with different breadth.** The spec at
  `:144` reads *"a mechanical control (**a verifier dispatch**) could not run"*; the
  architecture at `:234` reads *"a mechanical control could not run"* without the
  parenthetical. In-tree usage follows the broader form and predates this branch — `:684`
  (task_verbatim capture), `:870` (completeness record), `:1180` (skill_activation echo) are
  not verifier dispatches. The two new sites added by `f38a009` are consistent with that
  established usage, which is why this is recorded here rather than as a conformance finding.
  Noting it because the F7-2 precedent establishes that gate-type semantics are an owner
  decision, and the next amendment will want the two documents to agree on the scope.
- **The continuation gate's loop bounds rest on a host-platform claim, evidenced by the
  evidence ladder rather than assumed.** `continuation-gate.mjs:43-58` cites both
  `code.claude.com/docs/en/hooks-guide` (read 2026-08-21) and the installed Claude Code 2.1.236
  binary for `stop_hook_active` and the eight-block cap. I confirmed the script honors
  `stop_hook_active` first, before any I/O (`decide()` at `:142-144`), and that the unit tier
  exercises it — so the script's side of the contract is verified. The host's side was not
  independently re-verified against the binary in this review; it is not load-bearing for any
  finding, and the design is safe in either direction because the block is a single nudge per
  turn chain.
- **Staleness is fail-closed while everything else in the hook is fail-open.** At `:183`, an
  unreadable mtime (`statSync` threw, leaving `mtimeMs` null) skips the staleness exemption, so
  a fresh-looking mid-phase ledger blocks. This is the opposite direction from the file's
  declared fail-open posture, and it is the right choice — an exemption whose evidence could not
  be read should not be granted — but the header's blanket "FAIL OPEN, DELIBERATELY" does not
  mention the one axis that does not.
- **The two new workflow guards are pinned by text assertions over `wfSrc` rather than by
  execution**, declared and justified at `check-structure.mjs:837-838` ("the workflow body is
  not importable"). The assertions are unusually careful for their form — the closeout one
  slices to the closeout block and asserts the guard's *position* relative to
  `delta.phase = 'complete'` (`:848-852`), so it cannot be satisfied by a match elsewhere in the
  file. Recorded as context on the tier's evidence mix, not as a defect.

---

## What's Actually Good

- **The T-31 coverage contract converts a claim into a measured property, and it survives
  adversarial attack on both of its exemption channels.** Property: the excused set cannot grow
  and the counted set cannot shrink without failing the tier — `designated` sits exactly at its
  ceiling of 6 and `counted` exactly at its floor of 18 (`:1752-1753`), so both are saturated
  and any movement in the wrong direction reddens. Verified by execution, not by reading: M5
  (plant a drift, then add a `DESIGNATIONS` entry excusing it) fails on `designated 7,
  ceiling 6`; M3 (reword a line out of admission) fails on both `admitted 23, floor 24` and
  `counted 17, floor 18`. Standard: fail-safe defaults applied to a test's own coverage, plus
  the partition-totality shape the codebase already uses at T-29. Designing a control so that
  the cheapest way to silence it is itself the loudest failure is the correct answer to
  "can a claim be designated away," and it is rare to see it actually implemented.
- **The `DESIGNATIONS` anchors are verbatim line excerpts rather than line numbers, with
  liveness asserted.** Property: each designation must match exactly one admitted line
  (`:1757-1761`), so an edit that moves the line keeps the designation attached and an edit that
  rewrites it detaches loudly. Verified by Read of `:1645-1663` and by the passing check
  `T-31 every designation still matches exactly one admitted line (stale: none)`. Standard: the
  same immutable-anchor principle the project's own review skill mandates at Step 6. Worth
  naming because it is the exact discipline finding N4 says is missing elsewhere in the plugin —
  the right pattern already exists in this codebase, one directory away from where it is needed.
- **The preflight's verdict list is lifted from the script's printed output rather than
  maintained.** Property: `T-29` extracts verdict names by matching `/VERDICT: ([A-Z-]+)/g`
  against the script's source (`:1584-1585`) and requires each to appear in the command's step 1,
  so a new verdict fails the tier until the consumer states what to do with it. Verified by
  execution: M6 added a fifth verdict and the check reddened naming it
  (`unrouted: PARTIAL`). Standard: complete mediation applied to an exit contract, closed at the
  class rather than at the reported instance. This is the difference between fixing R3-F3 and
  fixing the reason R3-F3 was possible.
- **The continuation gate requires positive evidence of an in-flight lifecycle before blocking,
  and the real-world case proves the design rather than needing an exception for it.** Property:
  each of the six allow conditions names an independent way the lifecycle can fail to be in
  flight, so the block is what remains when none holds. Verified by executing the real hook
  against this repository's real ledger — which is at the blocking phase `closeout` and still
  allows, twice over, because it is schema-invalid and 3.76 days stale. Standard: least
  privilege applied to an exemption — the phase-name exemption that round 2 rejected would have
  permanently unguarded a whole phase to handle a case that two evidence-based conditions
  already handle. Verified in the blocking direction too (the same ledger, made valid and
  freshened, exits 2 with a reprompt naming all seven gate types), so this is not a gate that
  merely never fires.

---

## Convergence Record

- **Round number:** 4 (matches Scope and Inventory).
- **Trajectory:** R1: **6** (1 Critical, 3 Serious, 2 Moderate) → R2: **4** (1 Serious,
  2 Moderate, 1 Minor) → R3: **3** (1 Serious, 2 Moderate) → R4: **4** (1 Systemic,
  2 Moderate, 1 Minor).
- **Flow counts for this round:**
  - Prior findings **closed: 3** (R3-F1, R3-F2, R3-F3 — all three; each closure verified by
    execution and mutation against the standard originally named, dispositions tabled above).
  - **New: 3** — N1 (provenance `0ef9850`, never reported), N2 (population never in any prior
    round's scan — round-3 F2's own scan was `--include=SKILL.md skills`), N3 (label predates
    `f38a009`, never reported).
  - **Regressions: 1** — N4, whose defective instance 2 was accurate at `927c0f8`
    (`git show 927c0f8:…/expert-lifecycle.js | sed -n '988,989p'` returns the cited code) and was
    broken by `f38a009`'s 31-line insertion. N4's instance 3 predates the branch and is carried
    in the same finding as part of the class, not counted separately.
  - **Recurring: 0** — no round-3 finding remains open at its original location under its
    original standard.

**Tripwire evaluation — NOT FIRED.** Arithmetic shown, both conditions:

- **Condition (a)** — *new + regression ≥ closed for two consecutive Post-fix rounds*:
  **this round**, new (3) + regression (1) = **4**, closed = **3**; 4 ≥ 3 is **TRUE**.
  **Round 3**, new (2) + regression (1) = 3, closed = 4; 3 ≥ 4 is **false**. The condition holds
  in one of the two consecutive rounds, not both. **Not fired.**
- **Condition (b)** — *total findings has not strictly decreased for two consecutive Post-fix
  rounds*: R2 4 → R3 3 **is** a strict decrease; R3 3 → R4 4 is **not** a decrease. One
  non-decreasing round, not two. **Not fired.**

**Both tripwire conditions hold for the first time this round, and neither held last round.**
That is the precondition for firing: if round 5 produces new + regression ≥ closed, or fails to
come in under 4 findings, condition (a) or (b) fires on the consecutive-round test and the
indicated path becomes foundational rework rather than another fix round. Recorded explicitly
so round 5 is read against this arithmetic rather than against the impression that the cycle is
still converging — the three-round decline 6 → 4 → 3 stopped this round.

Two counter-signals belong in the same record, because the raw count understates the fixes'
quality: all three round-3 findings closed on first attempt with no recurrence, and the
round-3 correction sweep independently found and closed two unreported instances of R3-F1's
empty-set class in the workflow (the acceptance-criteria floor and the closeout report-path
guard) — a correction reaching past its assigned finding to the class, which is the behavior
the project's correction rule asks for. The one regression is a comment citation, not a
behavior.

---

## Recommended Priority

The tripwire did not fire, so a normal fix round is the indicated path — not foundational
rework. Order by the risk each finding carries into use, not by effort:

1. **N1** first. It is the only finding that can put a false statement in front of the owner
   through a sanctioned channel: `commands/expert.md` step 1 orders agents to quote this report,
   and the report can print `CURRENT (installed 1.0.0 matches working tree 9.9.9)`. Fix the
   quotable fields to carry what was read from disk and route a registry/manifest divergence
   through the existing `UNREADABLE` rule rather than adding a verdict path.
2. **N4** second, and fix it as a class, not as two edits. Two of three shipped citations are
   already wrong and the mechanism guarantees more; the lift-and-verify check shape the codebase
   already uses at `check-structure.mjs:1584` applies directly. Prioritized above N2 because
   instance 2 destroys the recorded justification for the `closeout`-is-not-terminal decision,
   which is the decision most likely to be re-litigated.
3. **N2** third. No live drift exists today, so the exposure is latent — but it is latent in the
   directory this branch was editing, and the `You answer **N**` restatements should be derived
   from the value `T-2b` already computes rather than pinned as a second copy.
4. **N3** last. One label. No predicate change.

One cross-cutting note for whoever takes this round: N2 and N3 are the same defect wearing
different clothes — a sweep whose reach is narrower than the words describing it — and they are
the third and fourth consecutive appearance of that class. Fixing them as two local edits will
close them; fixing them by asking, once, "what is the full population of hand-maintained
derived data in the shipped files, and what measures it?" is what stops a fifth appearance.

---

Verdict: NEEDS FIXES (4 findings: 1 Systemic, 2 Moderate, 1 Minor)
