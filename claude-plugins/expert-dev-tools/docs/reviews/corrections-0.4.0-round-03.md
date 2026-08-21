# Independent review — corrections 0.4.0, round 3

Reviewer: `rev-0400-r3` (fresh dispatch; no retained context from round 1, round 2, or any 0.3.0 round).
Target: branch `claude/edt-corrections-0.4.0`, commits `a903b12..927c0f8` (11 commits),
diff against `origin/main` restricted to `claude-plugins/expert-dev-tools/`.
Plugin version under review: `0.4.0` (`.claude-plugin/plugin.json`, Read at HEAD).
Round: **3** (Post-fix review of round 2's four findings).
Date: 2026-08-21.

> **Erratum — added 2026-08-21, after this review was delivered.** The commit count in
> the line above is wrong. The original text is left unaltered, because this record is
> evidence of what the reviewer concluded and when. Re-measured with
> `git rev-list --count`: `a903b12..927c0f8` holds **9** commits (**10**
> counting `a903b12` itself); no reading of the branch yields eleven.
> The figure had begun drifting one commit per round and kept drifting
> through round 7.
> Found and corrected post-review in round 8 (finding F8-2). Only the figure is wrong;
> no conclusion in this record rests on it.

---

## Scope and Inventory

Post-fix inventory, constructed from the four Step 2 sources. All paths repo-relative to
`claude-plugins/expert-dev-tools/` unless absolute.

### Source 1 — the prior review's full inventory

- [x] `.claude-plugin/plugin.json` — Read; version `0.4.0`, no `hooks` key.
- [x] `hooks/continuation-gate.mjs` — Read in full, 1-242 (post-fix, now 242 lines).
- [x] `hooks/hooks.json` — Read in full, 1-16; single `Stop` entry, no tool-use matcher.
- [x] `scripts/preflight-deployment.mjs` — Read in full, 1-274 (post-fix).
- [x] `scripts/ledger.schema.json` — full branch diff Read (`task_verbatim` added to
  `required` and to `properties` with `minLength: 1`).
- [x] `scripts/validate-ledger.mjs` — full branch diff Read (`minLength` keyword added);
  exercised transitively through the hook against this repository's live ledger.
- [x] `workflows/expert-lifecycle.js` — Read at 960-1010 (ground-truth, verify, closeout,
  fallthrough, `maybeEscalate`), 306-310 (`CLOSEOUT_SCHEMA`); grep `maybeEscalate`
  (3 hits, all Read), `halted` (14 hits, all Read in context), `core_approval` (2 hits),
  `function agent|const agent|agent = ` (**0 hits** — the dispatch primitive is injected
  by the workflow runtime, not defined in this file; this bounds one claim, see Tentative).
- [x] `commands/expert.md` — Read at 35-60 (step 1 preflight), 205-250 (gate routing);
  grep `UNREADABLE|exit 2|unreadable` → **0 hits** (F3 below).
- [x] `tests/structural/check-structure.mjs` — **executed** (417 `ok`, 0 failures);
  full 927c0f8 diff Read; grep `owner-gate types` (1 hit, `:836`), `UNREADABLE`
  (6 hits, all Read).
- [x] `tests/unit/run-unit-tests.mjs` — **executed** (46 `ok`, 0 failures); full
  927c0f8 diff Read.
- [x] `agents/expert-corrector.md`, `agents/expert-implementer.md`,
  `agents/expert-reviewer.md`, `agents/expert-verifier.md` — full branch diffs Read;
  unchanged by the round-2 fix commit (`git show 927c0f8 --stat`: not in the file list).
- [x] `skills/expert-correct/SKILL.md`, `skills/expert-implement/SKILL.md`,
  `skills/expert-review/SKILL.md`, `skills/expert-spec/SKILL.md`,
  `skills/expert-standard/SKILL.md` — full branch diffs Read; the count-claim population
  across all of `skills/**/SKILL.md` enumerated by grep (26 hits, listed in F2).
- [x] `tests/fixture/continuation/**` (6 fixtures) — `no-gate` and `closeout` Read and
  **executed against** on scratch copies at controlled mtimes.
- [x] `tests/fixture/deployment/**` (6 fixtures) — exercised through the tier; the script
  additionally **executed against four scratch registries built for this round**.
- [x] `docs/specs/spec-expert-dev-tools.md` — §2 amendment and §3.4 seven-gate text Read
  via the branch diff; the seven types cross-checked against the hook's emitted stderr.
- [x] `docs/diagnostics/corrections-0.4.0/opining-without-reading-source.md` — Read at the
  Part A contract (grep `UNREADABLE|exit 2|STALE|D15|verdict`, 6 hits) for the upstream
  check behind F3.

### Source 2 — the fix diff (commit `927c0f8`)

`hooks/continuation-gate.mjs`, `scripts/preflight-deployment.mjs`,
`tests/structural/check-structure.mjs`, `tests/unit/run-unit-tests.mjs`, and the
round-02 review record. All Read above; all four behavior changes exercised by execution.

### Source 3 — fix-diff dependents

- [x] `tests/structural/check-structure.mjs` now **imports** `preflight-deployment.mjs`
  as an ES module (`pathToFileURL`, `:1409`) to assert `COMPARED_TREES` /
  `EXCLUDED_TREES`. This is a new coupling introduced by the round-2 F3 fix; both sides
  Read, and the coupling exercised by execution (probe M3 reddens it).
- [x] `hooks/continuation-gate.mjs` imports `validate` from `scripts/validate-ledger.mjs`
  (`:67`) — exercised against this repository's live ledger.
- [x] `commands/expert.md` consumes the preflight's exit contract — the dependent that
  F3 below is filed against.

### Source 4 — the prior round's findings as closure items

R2-F1 … R2-F4 from `docs/reviews/corrections-0.4.0-round-02.md`, each re-derived from
current source and **re-verified by execution**, never by reading the fix. Dispositions in
the Convergence Record.

### Tool plan (Step 3)

| Claim type | Instrument | Availability |
|---|---|---|
| Literal-content | `Read` at file:line | available |
| Absence / scope | `Grep` with query + count | available |
| Behavioral (hook, preflight) | direct execution on constructed stdin / scratch registries | available |
| Behavioral (oracle strength) | mutation probes on scratch copies | available |
| Behavioral (workflow runtime `agent()` semantics) | **none** — the primitive is injected, not defined in-repo, and the workflow is not standalone-executable | **unavailable**; one claim demoted to tentative |
| Structural / blast radius | grep of definition + call sites | available (the coupling surface is four files) |
| Provenance (new vs regression) | `git log -S` per symbol | available |
| Structured reasoning | Clear Thought `metacognitivemonitoring`, `collaborativereasoning` | available |

**Instrument unavailability, disposition recorded.** The workflow runtime that supplies
`agent()` cannot be driven from this repository. Per the Step 3 bright line this is an
**isolated gap on one claim**, not a whole instrument class stranding a load-bearing claim
category — every finding delivered below rests on execution of the two `.mjs` executables
or on grep/Read, none on workflow runtime semantics. The affected candidate is demoted to
Tentative Findings rather than halting the review.

No rigor waivers. The operator directed no compression.

**Mutation-probe isolation.** Every mutation ran on a `cp -r` scratch copy of the plugin
under the session scratchpad, or on scratch registries and project roots built there. The
working tree was never mutated. Each probe asserted its own text change landed
(`MUTATION-NOOP` guard) before the tiers were re-run.

### Execution results at HEAD

| Tier | Command | Result |
|---|---|---|
| Structural | `node tests/structural/check-structure.mjs` | exit 0 — **417 `ok`, 0 failures** |
| Unit | `node tests/unit/run-unit-tests.mjs` | exit 0 — **46 `ok`, 0 failures** |

Counts taken by executing both tiers and counting `^ok` and `^(not ok|FAIL)` lines in this
reviewer's own run. The fix commit's message claims "Structural 402->417, unit 43->46";
417 and 46 reproduce, and are reported here because they were observed, not because the
message asserted them.

### Mutation battery on the ROUND-2 FIX code

Round 2 probed round 1's fixes. This round probes round 2's. Each probe reverted exactly
one fix on a scratch copy and re-ran both tiers.

**Probe-environment baseline.** A `cp -r` copy is not a git repository and carries this
reviewer's own capture files, so the unmutated copy fails 4 structural checks before any
mutation: `T-A2a` (canonical linter path), the two `T-20` git-baseline checks, and
`T-29 every plugin-root file is classified` (flagging `st.txt`). Deltas below are measured
against that baseline of 4. The last of those is itself the round-2 F3 guard firing
correctly on a real unclassified root entry.

| Probe | Mutation | Structural | Unit | Verdict |
|---|---|---|---|---|
| M1 | `TERMINAL_PHASES` back to `['closeout','complete']` (R2-F1 reverted) | 6 (+2) | 4 fail | **caught** |
| M2 | `readdirSync` re-wrapped in `catch { return; }` (R2-F2 reverted) | 6 (+2) | 0 | **caught** |
| M3 | unclassified behavior-bearing tree `lib/runtime.js` added to the plugin root | 5 (+1) | 0 | **caught** |
| M4 | `Eight signals` → `Nine signals`, list unchanged (R2-F4 drift) | 6 (+2) | 0 | **caught** |
| M5 | `Four categories qualify, and only these four:` → `Five … these five:` at `skills/expert-implement/SKILL.md:119`, list unchanged | 4 (+0) | 0 | **NOT caught → F2** |

Named failing checks per probe were enumerated, not just counted: M1 reddens
`T-30 exec (m)` (both assertions) and four `T-U4` unit checks; M2 reddens the two
`T-29 unreadable compared tree` checks; M3 reddens
`T-29 every plugin-root directory is classified … (unclassified: lib)`; M4 reddens
`T-31 expert-standard's failure-signal count is among the swept headers` and
`T-31 every stated count matches its list (drifted: … says 9, has 8)`.

**4/5 caught.** All four round-2 fixes are pinned by oracles that fail when reverted. M5
is not a reverted fix — it is a probe of the *coverage* of the fix the round-2 F4 remedy
produced, and it is F2 below.

---

## Summary

**This review returns NEEDS FIXES.** All four round-2 findings are closed, each
re-verified by executing the artifact against constructed real inputs, and each backed by
a pin that demonstrably reddens when the fix is reverted. Materially, and in direct
contrast to the pattern this round was dispatched to hunt: **the round-2 fix commit
introduced no regression to any previously-working behavior.** Round 1's fix commit
produced three; round 2's produced none. The continuation gate blocks and allows correctly
in both directions against this repository's own live ledger and against constructed
scratch roots, and the preflight returns a correct `STALE` against the genuinely stale
`0.3.0` cache installed on this machine.

The three findings below are of one kind: **controls whose stated coverage exceeds their
actual coverage.** The preflight will return a confident `CURRENT` over a registry entry
whose install-record array is empty — zero files compared, `cache_path: null`, and the
verdict line still reads "installed ? matches working tree 9.9.9". The new count-drift
sweep announces in its own comment that it "DISCOVERS every such header across the skills"
and in fact reaches 7 of the 26 instances of that construct; a drift planted in one of the
19 it misses passes the tier green. And the command that consumes the preflight routes its
`STALE` verdict but never mentions `UNREADABLE`, the verdict the round-1 fixes made
reachable. Each was established by execution, not by reading the fix.

---

## Upstream Contract Verification

Governing upstream artifacts: the spec (as amended 2026-08-20), the seven correction
drafts in `docs/diagnostics/corrections-0.4.0/`, and the round-2 review's finding set.

| Contract item | Status | Verification method |
|---|---|---|
| Spec §2 amendment authorizes a Stop-event hook that blocks no tool use | **honored** | Read of `hooks/hooks.json` 1-16 — one `Stop` entry, `type: command`, `timeout: 10`, no tool-use matcher; Read of `.claude-plugin/plugin.json` — no `hooks` key (auto-discovery path). |
| Spec §3.4 seven gate types remain exhaustive and are named at the halt point | **honored** | **Executed** the hook against a freshened `no-gate` fixture at a scratch root: stderr enumerates all seven verbatim (intent, spec_traceable, business, risk_override, non_convergence, core_approval, control_fault). |
| agent-quits-midtask §4.1 rule 2 (no ledger → allow) | **honored** | `tests/fixture/continuation/no-ledger` exercised by the tier; `readLedger` (`:201-214`) returns null on a missing path and `decide` allows at `:145-147`. |
| agent-quits-midtask §4.1 rule 3 (finished lifecycle → allow) | **honored, and now correctly scoped** | Read of `TERMINAL_PHASES` at `:96` — `['complete']` only. **Executed** against this repository's live ledger → exit 0 via the schema-invalid axis, and against a scratch abandoned closeout → exit 0 via the staleness axis. The R2-F1 over-reach is gone. |
| agent-quits-midtask §4.1 rule 5 (mid-phase, no open gate → block with reason) | **honored** | **Executed** two independent scratch roots: a fresh `implement` ledger → exit 2 with the full reason, and a fresh `closeout` ledger → exit 2 with the reason naming `closeout`. The gate blocks in both, and did not become inert while being narrowed. |
| opining-without-reading-source: verdict covers every behavior-bearing tree | **honored for the declared partition, incomplete at the registry boundary** | Read of `COMPARED_TREES` / `EXCLUDED_TREES` (`:36-48`) and of the `T-29` partition assertions (`check-structure.mjs:1409-1487`); `ls -A` of the plugin root yields exactly the 11 entries the partition classifies. **Executed** probe M3 — an unclassified `lib/` reddens the tier. But see F1: the comparison can be skipped wholesale before any tree is reached. |
| opining-without-reading-source: exit contract (0 CURRENT, 1 STALE, 2 unreadable) | **honored in the script, unrouted in the consumer** | **Executed**: an unreadable tree → `VERDICT: UNREADABLE`, exit 2, naming `tree 'scripts' could not be read`; the real cache → `VERDICT: STALE`, exit 1. `commands/expert.md` routes STALE to D15 (`:47-49`) but grep for `UNREADABLE|exit 2|unreadable` over that file returns **0 hits** — see F3. |
| opining-without-reading-source header contract: "no confident CURRENT over a comparison not performed" | **violated** | **Executed** probe P1 — see F1. |
| premature-completion, patching-instead-of-rederivation, role-boundary, instruction-reinterpretation, skill-activation | **honored** | Unchanged by the round-2 fix commit (`git show 927c0f8 --stat`: five files, none of them these agents/skills/workflow). Their pins were re-executed as part of the 417-check structural run and the 46-check unit run, all observed passing. |
| Round-2 remedy for R2-F4 ("one assertion, modelled on the owner-gate-type pin") | **exceeded in ambition, incomplete in delivery** | The implementer generalized to a class sweep (`T-31`) rather than pinning one number — the right instinct per the project's re-derive-and-sweep-the-class rule. Read of `check-structure.mjs:1512-1549` plus the 26-instance grep shows the sweep reaches 7. See F2. |

---

## Critical & Serious Findings

No Critical findings — the full inventory was Read or Grep-verified per Compliance Gate B,
both tiers and all four round-2 closures were re-executed, and no violation of Critical
classification was observed.

### F1 — A registry entry with an empty install-record array yields `VERDICT: CURRENT`, exit 0, with zero files compared and `cache_path: null` (Serious — new)

**Location:** `scripts/preflight-deployment.mjs:144-167`

**What the code does now.** `preflightDeployment` selects registry keys matching the
plugin name (`:146-148`) and pushes a problem only when **no key matches**
(`:149`). When a key matches but `plugins[key]` is an empty array, the `for` loop at
`:159` iterates zero times, `records` stays empty, and no problem is recorded — the
`Array.isArray` guard at `:155` passes an empty array. `report.installs` is therefore
empty, `primary` is `null` (`:224`), and the verdict at `:235` computes
`report.installs.some((i) => i.stale)` over an empty array, which is `false`, giving
**`CURRENT`**.

**How the claim was verified.**

- Read of `scripts/preflight-deployment.mjs:144-167, 224-236` at drafting time.
- **Executed** (probe P1, scratch registry under the session scratchpad). Registry
  `{"version":2,"plugins":{"q@m":[]}}`; cache manifest version `1.0.0`; working tree
  manifest version `9.9.9` plus a behavior-bearing `scripts/real.js` present only on the
  working-tree side. Result: **exit 0**, `"verdict": "CURRENT"`, `"problems": []`,
  `"cache_path": null`, and the printed line
  `VERDICT: CURRENT (installed ? matches working tree 9.9.9)`.
- **Control executed** (probe P2). Same tree, registry key changed to `other@m` so no key
  matches: **exit 2**, `VERDICT: UNREADABLE (plugin 'q' not found in …)`. The
  not-found path fails closed; the empty-array path does not.
- grep over both tiers for a probe of this shape: the four registry-malformation checks at
  `check-structure.mjs:1341, 1399, 1403` and the tree check at `:1428` cover
  unresolvable-plugin, non-array entry, missing `installPath`, and unreadable tree. **No
  check constructs an empty install-record array.**
- Provenance: `git log -S"records.push({ key, rec })"` on the file returns **`0ef9850`**
  as the sole introducing commit — the original correction commit, not the round-2 fix.
  **New**, not a regression: it predates both fix rounds and was not reported before.

**Standard violated.** Fail-safe defaults (OWASP secure-design; the same standard the
architecture names for D6 STOP routing, and the standard round-1's F5 closure was recorded
against). An integrity check must not resolve "I compared nothing" to the same answer as
"I compared everything and found no difference." The file's own header at `:11-18` states
the contract this breaks: *"COVERAGE IS THE CONTRACT. The verdict is only as strong as the
set of files it compares."* Here the set is empty and the verdict is maximal.

**Why it matters.** `commands/expert.md:44-47` makes this verdict load-bearing: *"no claim
about the running plugin's behavior, and no request that the owner reload/update/re-test,
is made without quoting this report."* An agent quoting this report reads `CURRENT` and
proceeds to make live behavioral claims against a cache it never opened — the canonical
failure named in the script's own opening comment ("a live test run against a provably-
stale cache, when the answer sat in `installed_plugins.json` the whole time"), reached
through the registry rather than through the digest. The printed line is worse than
silent: `installed ? matches working tree 9.9.9` asserts a match between a version it does
not know and one it does.

**What correct looks like.** After the key-matching loop, treat a matched key that yielded
no usable install record as an unreadable environment:
`if (keys.length > 0 && records.length === 0) problems.push(...)` naming the keys and the
reason. Independently, make the verdict require positive evidence rather than the absence
of negative evidence — `CURRENT` should be reachable only when at least one install entry
actually completed a comparison (`entry.stale === false`), so
`report.installs.some(i => i.stale)` is not the sole discriminator over a possibly-empty
list. Pin it with a structural check that builds a registry carrying `"q@m": []` and
asserts exit 2, alongside the four malformation probes already at `:1399-1403`.

---

## Systemic Patterns

**No systemic patterns.** Two candidate patterns were suspected and both were scanned
across the full inventory scope before classification, per Step 8; one resolved to zero
instances and the other to a single control with an enumerated uncovered population, filed
as an isolated finding.

- **Candidate: silently swallowed errors across the plugin's executables.** Scan:
  `grep -rnE 'catch\s*(\([^)]*\))?\s*\{\s*(return[^};]*)?;?\s*\}'` over `hooks/*.mjs`,
  `scripts/*.mjs`, `workflows/*.js`. Result: **0 hits**. The instance round 2 filed as its
  F2 (`preflight-deployment.mjs` `catch { return; }`) is gone, and no new one replaced it.
  Every remaining catch in `continuation-gate.mjs` (`:108`, `:152`, `:168`, `:206`,
  `:209`, `:221`, `:230`) assigns a sentinel or emits a note that a caller branches on.
  **Zero instances — not systemic.**

- **Candidate: fail-open verdict paths in `preflight-deployment.mjs`.** Scan:
  `grep -n "\.some(\|\.every(\|length === 0\|records.push"` over the file, 4 hits, each
  Read in context — `:111` (digestDiff early return, correct), `:149` (keys-not-found,
  fails closed), `:164` (the record push behind F1), `:235` (the verdict `.some()`).
  **One instance — F1 — not systemic.** The verdict-level `.some()` and the empty
  `records` are two halves of the same single defect, not two occurrences.

---

## Moderate & Minor Findings

### F2 — The new count-drift sweep reaches 7 of the 26 instances of the construct it claims to sweep exhaustively, and a drift planted in one of the 19 it misses passes the tier green (Moderate — regression, introduced by `927c0f8`)

**Location:** `tests/structural/check-structure.mjs:1512-1549`

**What the code does now.** `T-31` iterates `skills/*/SKILL.md` and matches count headers
with `/^(Two|Three|Four|Five|Six|Seven|Eight|Nine|Ten)\s+\S/` — a capitalized cardinal at
**column 0**. Its comment at `:1513-1517` states the intent: *"Rather than pin the one
number, this DISCOVERS every such header across the skills, so a new count-headed list is
covered the day it is written."* The regex reaches only the line-initial form.

**How the claim was verified.**

- Read of `tests/structural/check-structure.mjs:1512-1549` at drafting time; the regex and
  the comment quoted above read together.
- **Executed** (probe M5, scratch copy). Changed
  `skills/expert-implement/SKILL.md:119` from *"Four categories qualify, and only these
  four:"* to *"Five categories qualify, and only these five:"*, leaving the four-entry
  bolded list beneath it untouched, and re-ran the structural tier. Result: **4 failures,
  exactly the probe-environment baseline** — zero delta — and all three `T-31` checks
  reported `ok`, including `T-31 every stated count matches its list (drifted: none)`.
  A live drift in the same directory, in the identical construct, is invisible.
- **Control executed** (probe M4): the same drift planted at the line-initial instance
  (`Eight signals` → `Nine signals`) reddens two `T-31` checks. The sweep works on what it
  reaches; the finding is what it does not reach.
- **Proactive scan of the class across the full inventory scope**, per Step 8. Query:
  `grep -rncEi '\b(two|three|four|five|six|seven|eight|nine|ten)\b[^.]*:$' --include=SKILL.md skills`.
  Result: **26 instances across 9 files** — `expert-spec` 5, `expert-plan` 4,
  `expert-architecture` 3, `expert-architecture-portable` 3, `expert-review` 3,
  `expert-correct` 2, `expert-standard` 2, `expert-implement` 1, `expert-mcp-overhaul` 1.
  The line-initial scan the sweep actually performs
  (`grep -rncE '^(Two|…|Ten)\s+\S' --include=SKILL.md skills`) returns **7**, matching the
  sweep's own `found 7` output. Nineteen instances of the construct are unswept, among them
  `expert-correct/SKILL.md:92` ("with five required fields:"),
  `expert-review/SKILL.md:467` ("The record carries four elements:"),
  `expert-spec/SKILL.md:273` ("three tests before it stays in the document:"), and
  `expert-plan/SKILL.md:297` ("all four parts required:").
- Provenance: `git log -S"the count-header sweep found the known population"` returns
  **`927c0f8`** as the sole introducing commit. The underlying unpinned counts predate the
  fix; the control that claims to cover them, and the false totality claim in its comment,
  were introduced by it. Classified **regression** under Step 9's "introduced *or exposed*
  by the fixes" — before `927c0f8` no artifact asserted this coverage existed.

**Standard violated.** Two, together. (1) Single source of truth for derived data (DRY) —
the same standard round 2 named for its F4 — is satisfied at 7 sites and unsatisfied at 19
in the identical construct. (2) A first-principles articulation for the second half, marked
as such: the goal the sweep's comment sets is that a count-headed list is covered *the day
it is written*; the shortcut is a column-0 anchor that silently defines the class by
typography rather than by meaning; the shortcut fails the goal because a maintainer reading
`found 7` and `drifted: none` has been told the class is clean when 73% of it was never
examined. A control that overstates its own coverage is worse than an absent one, because
it retires the question.

**Why it matters.** This is the project's own re-derive-and-sweep-the-class rule applied
halfway. The round-2 remedy asked for one assertion; the implementer correctly reached for
the class instead — that instinct is right and is credited in What's Actually Good — but
the sweep shipped with a totality claim it does not meet, so the next round has no signal
that 19 sites remain open.

**What correct looks like.** Widen the matcher to the construct rather than the typography:
a cardinal word appearing anywhere in a line that terminates in `:` and is followed by a
list, which is exactly the grep recorded above. Where a match is a false positive
(`expert-review/SKILL.md:525`, "in exactly one of two forms:", where the two forms are
fenced blocks rather than bolded entries), extend the entry-marker detection to cover the
form rather than narrowing the matcher back. Then correct the comment at `:1513-1517` to
describe the class the sweep actually covers, and raise the vacuity floor from
`>= 7` to the new population so shrinkage still reddens.

### F3 — `commands/expert.md` routes the preflight's `STALE` verdict but never mentions `UNREADABLE`, the exit-2 verdict the round-1 fixes made reachable (Moderate — new)

**Location:** `commands/expert.md:39-49`

**What the code does now.** Step 1 instructs the agent to run
`preflight-deployment.mjs`, states the bright line (*"no claim about the running plugin's
behavior … is made without quoting this report"*), and then routes exactly one verdict:
*"If the report's verdict is STALE, the finding is `stale_deployment` (D15) — present it
via step 5's stale-deployment path … never as a live-test verdict."* The script emits four
verdicts — `CURRENT` (0), `PROVENANCE-ONLY` (0), `STALE` (1), `UNREADABLE` (2)
(`preflight-deployment.mjs:255-268`). `UNREADABLE` has no stated disposition anywhere in
the command.

**How the claim was verified.**

- Read of `commands/expert.md:35-60` at drafting time.
- grep `UNREADABLE|exit 2|unreadable` over `commands/expert.md`: **0 hits**.
- Read of `scripts/preflight-deployment.mjs:255-268` — the four-way verdict dispatch.
- **Executed**, confirming `UNREADABLE` is reachable in practice and not a theoretical
  branch: the unreadable-tree probe returns exit 2 with
  `VERDICT: UNREADABLE (tree 'scripts' could not be read for 'q@m': ENOTDIR …)`, and probe
  P2 returns exit 2 for an unresolvable plugin. Both are ordinary environment states.
- **Upstream check.** grep `UNREADABLE|exit 2|STALE|D15|verdict` over
  `docs/diagnostics/corrections-0.4.0/opining-without-reading-source.md`: 6 hits, Read.
  The draft specifies only the `stale` → D15 route (`:115-117`). `UNREADABLE` is an
  implementation-side verdict that the round-1 F5 fix made load-bearing (four malformed-
  registry shapes now route to it instead of exit 1) without a corresponding consumer-side
  route. So the gap is not a deviation from the draft — it is a contract the
  implementation grew and the consumer never learned.
- Provenance: `git log -S"the finding is \`stale_deployment\` (D15)"` on
  `commands/expert.md` returns **`0ef9850`**; `git log -S"UNREADABLE"` on the same file
  returns **no commits** — the string has never appeared there. **New.**

**Standard violated.** Complete mediation, applied to an exit contract: every distinguished
outcome of a control must have a defined disposition at the consumer, or the undefined ones
collapse into the default. The default here is the dangerous one — an agent that checked
"is it STALE?" and got "no" has satisfied the only test the command names, and proceeds to
make the behavioral claims the bright line exists to gate, over an environment the script
just said it could not read.

**Why it matters.** `UNREADABLE` is precisely the state in which the report *cannot* ground
a claim, and the bright line as written is satisfiable by quoting it. The whole
`opining-without-reading-source` correction exists to stop confident claims resting on
unverified deployment state; this is that shape, one level up, in the consumer.

**What correct looks like.** Add one sentence beside the STALE route: an `UNREADABLE`
verdict (exit 2) is a `control_fault` halt — the preflight could not establish deployment
provenance, so no behavioral claim and no reload/update/re-test request may be made at
all, and the specific `problems` entries are reported to the owner. Pin it with a
structural check modelled on the existing
`T-29 command step 1 routes a STALE verdict to stale_deployment (D15)` assertion.

**No Minor findings** — verified by re-executing both tiers at HEAD (417 + 46 checks, 0
failures), by the five-probe mutation battery, and by the two proactive class scans
recorded under Systemic Patterns; no style, convention, or optimization divergence from a
named standard was observed beyond the three findings above.

---

## Tentative Findings

**One tentative item.**

- **Whether a halted closeout dispatch can reach the unconditional completion write could
  not be established.** `workflows/expert-lifecycle.js:988-990` dispatches the closeout
  agent and then, on the very next line and with no inspection of the returned object's
  `status`, writes `delta.phase = 'complete'` and returns
  `{ outcome: 'complete', … }`. Read of the file confirms the asymmetry: the architecture
  and plan phases guard their dispatches with `maybeEscalate(out, phaseName)` (`:733`,
  `:757`), the implement phase checks `impl.status === 'halted'` (`:796`), the amendment
  path added by round 1's F4 sweep checks `amended.status === 'halted'` (`:811`), and
  `CLOSEOUT_SCHEMA` (`:306-310`) declares no `status` property at all while
  `PHASE_SCHEMA` and its sibling declare `status: { enum: ['completed','halted'] }`
  (`:118`, `:176`). If a closeout that halted can return through that call, the workflow
  declares the lifecycle complete — the exact shape `premature-completion-claims`
  addresses — at the phase that writes the report, the commit, and the PR.
  **The gap:** `agent()` is injected by the workflow runtime and is not defined in this
  repository (grep `function agent|const agent|agent = ` over
  `workflows/expert-lifecycle.js`: **0 hits**), so whether it throws, coerces, or returns
  on a halted or schema-violating result cannot be reproduced here. **What would close
  it:** the workflow runtime's documented contract for a dispatch whose return violates
  its declared schema or carries an undeclared `status`, or one captured run of a halted
  closeout. No finding above rests on this claim.

No other candidate finding was delivered without verification.

---

## Observations

- The round-2 fix commit touched five files and reverted no previously-working behavior.
  This is worth recording plainly because the dispatch for this round flagged the opposite
  pattern: round 1's fix commit produced three regressions out of round 2's four findings.
  The change in method is visible in the diff — round 2's fixes each shipped with a
  negative pin (`T-29-neg` proving the classification predicate can fail; `T-30 exec (m2)`
  asserting the abandoned-closeout allow separately from the phase axis; the freshened
  temp-dir copies that make the closeout block attributable to the phase rule rather than
  to the clock).
- `check-structure.mjs:607-612` adds a fail-closed `else` branch so an unreachable
  `git show` reddens the tier instead of silently removing the deletion guard and its four
  self-tests. Its comment attributes this to the round-2 F2 class ("an error path resolving
  to the permissive answer"). This is class-sweep behavior on a finding that was reported
  about a different file, and it is the reason this reviewer's non-git scratch copies fail
  loudly rather than quietly — the correct direction. No standard violation.
- `REPLACED_BY_STRENGTHENING` in `check-structure.mjs:480-491` records the round-2 F1
  baseline-label swap with the finding that forced it and an explicit argument that the
  replacement pins strictly more behavior than the baseline. A test-deletion guard that
  requires a written justification for every removed assertion is unusual and is doing real
  work here. Recorded for the reader's orientation.
- Both mandatory Clear Thought invocations ran. `metacognitivemonitoring` succeeded on the
  first call. `collaborativereasoning` failed once on schema validation (enum constraints
  on persona `communication.style` / `tone`) and succeeded on retry with corrected values —
  the identical infrastructure friction rounds 1 and 2 both recorded, noted per the skill's
  tool-failure recording convention. No manual fallback was needed.

---

## What's Actually Good

- **The round-2 fix round produced zero regressions, reversing the cycle's measured
  pattern.** Property: every behavior that worked before `927c0f8` still works after it.
  Standard: over-correction avoidance — a fix round is not complete merely because its
  findings close; it must be shown not to have narrowed or broken adjacent behavior.
  Verified by execution rather than by inspection: both tiers re-run at HEAD (417 + 46, 0
  failures); the continuation gate exercised in both directions on four distinct
  inputs (this repository's live ledger, a fresh `implement` root, a fresh `closeout` root,
  an aged `closeout` root); the preflight exercised against the real installed `0.3.0`
  cache (correct `STALE`, `problems: []`) and four constructed scratch registries.
  Given that round 2 recorded three regressions out of four findings from round 1's fix
  commit, this is the specific property a round-3 review exists to test, and it holds.

- **Each round-2 fix is pinned by an oracle that reddens when the fix is reverted.**
  Property: reverting any of the four produces named failing checks, not merely a lower
  count. Standard: mutation adequacy — a suite that cannot detect a deliberately broken
  implementation provides no assurance. Verified by the M1–M4 battery on scratch copies,
  each guarded against being a silent no-op, with the failing check names enumerated above.

- **The `closeout` correction was derived from what the phase does, not from where its name
  sits.** Property: `TERMINAL_PHASES` membership is now argued from the dispatch at
  `expert-lifecycle.js:988` and the ordering of `delta.phase = 'complete'` at `:989`, and
  the case the exemption was originally added for is demonstrated to be covered by two
  other conditions that rest on evidence (schema validity, staleness) rather than on a
  phase string. Standard: least privilege applied to an exemption — an allow condition no
  broader than the case it permits. Verified by Read of `continuation-gate.mjs:75-96` and
  by execution of all three paths: fresh `closeout` → exit 2 with the reason naming the
  phase; aged `closeout` → exit 0 via staleness; this repository's schema-invalid ledger →
  exit 0 via unresumability.

- **The unreadable-tree fix removed the swallow rather than compensating for it.** Property:
  `readdirSync` at `treeDigest`'s walk (`:89`) is unwrapped, and the single caller
  (`:201-215`) converts a throw into a named `problems` entry, so an unread tree can no
  longer contribute to a `CURRENT` verdict. Standard: fail-safe defaults — "could not read"
  must not resolve to "no difference". Verified by execution on a constructed root where
  the tree path is a regular file with different bytes on each side: exit 2,
  `VERDICT: UNREADABLE (tree 'scripts' could not be read for 'q@m': ENOTDIR …)`, and no
  `CURRENT` in the output. The doc comment at `:78-85` now describes what the code does.

---

## Convergence Record

- **Round number:** 3 (matches Scope and Inventory).
- **Trajectory:** R1: **6** (1 Critical, 3 Serious, 2 Moderate) → R2: **4** (1 Serious,
  2 Moderate, 1 Minor) → R3: **3** (1 Serious, 2 Moderate).
- **Flow counts for this round:**
  - Prior findings **closed: 4** (R2-F1 … R2-F4, all four; each closure verified by
    execution against the standard originally named — dispositions below).
  - **New: 2** (F1, provenance `0ef9850` by `git log -S"records.push({ key, rec })"`;
    F3, provenance `0ef9850` for the STALE route with `git log -S"UNREADABLE"` on
    `commands/expert.md` returning no commits at all).
  - **Regressions: 1** (F2, provenance `927c0f8` by
    `git log -S"the count-header sweep found the known population"`, classified under
    "introduced *or exposed* by the fixes" — the control and its totality claim are new
    with the fix commit, though the uncovered sites predate it).
  - **Recurring: 0** — no round-2 finding remains open at its original location under its
    original standard.

**Round-2 dispositions, each re-derived from source and verified by execution:**

| Prior | Standard originally named | Status | Closure verification |
|---|---|---|---|
| R2-F1 (Serious) | Least privilege applied to an exemption | **closed** | `TERMINAL_PHASES` is `['complete']` (`continuation-gate.mjs:96`). Executed: fresh `closeout` at a scratch root → **exit 2** with the reason naming `closeout` and routing to `/expert resume`; aged `closeout` → exit 0 via staleness. M1 reddens `T-30 exec (m)` ×2 and four `T-U4` checks when reverted. The unit test's rationale and its constant now agree. |
| R2-F2 (Moderate) | Fail-safe defaults + the code's own documented contract | **closed** | `readdirSync` unwrapped at `:89`; caller records a named problem at `:209-211`. Executed the identical ENOTDIR probe round 2 used: **exit 2, `VERDICT: UNREADABLE`**, tree named, no `CURRENT`. Class scan for the swallow shape across all executables: **0 hits**. M2 reddens two `T-29` checks when reverted. |
| R2-F3 (Moderate) | First-principles: coverage completeness cannot be a comment | **closed** | `EXCLUDED_TREES` / `EXCLUDED_FILES` declared at `:47-48`; `T-29` imports all four constants and asserts they partition the real plugin root, with `T-29-neg` proving the predicate can fail. Executed M3: adding `lib/runtime.js` reddens `T-29 every plugin-root directory is classified … (unclassified: lib)`. `ls -A` confirms the 11 root entries are exactly classified. |
| R2-F4 (Minor) | Single source of truth for derived data (DRY) | **closed at the reported instance** | `T-31` pins `expert-standard`'s count by counting the list. Executed M4: `Eight` → `Nine` with the list unchanged reddens two `T-31` checks. The instance round 2 named is closed against its named standard; the *class* is not, which is F2 above — filed as its own finding rather than as a failed closure, because the standard cited in R2-F4 is satisfied at the location R2-F4 cited. |

**Tripwire evaluation — NOT FIRED.** Arithmetic shown:

- Condition (a), *new + regression ≥ closed for two consecutive Post-fix rounds*:
  this round, new (2) + regression (1) = **3**, closed = **4**; 3 ≥ 4 is **false**.
  Round 2: new (1) + regression (3) = 4, closed = 6; 4 ≥ 6 is **false**. The condition
  held in neither of the two consecutive Post-fix rounds. **Not fired.**
- Condition (b), *total findings count has not strictly decreased for two consecutive
  Post-fix rounds*: R1 6 → R2 4 is a strict decrease; R2 4 → R3 3 is a strict decrease.
  Both rounds decreased. **Not fired.**

The cycle is converging, and the round-over-round quality of the fixes is improving on a
measured axis: regressions per fix round went 3 → 1, and the one this round is a control
that over-claims its coverage rather than a behavior that broke.

---

## Recommended Priority

The tripwire did not fire, so a normal fix round is the indicated path — not foundational
rework.

1. **F1 (Serious)** — the empty install-record array. Fix first: it is the only finding
   where a control returns a confident, wrong, load-bearing answer, and the fix is small
   (a `records.length === 0` problem entry plus a verdict that requires positive evidence
   of a completed comparison). Add the registry probe beside the four malformation probes
   already at `check-structure.mjs:1399-1403`.
2. **F3 (Moderate)** — the missing `UNREADABLE` route in `commands/expert.md`. Smallest of
   the three and directly compounds F1: both end with an agent making behavioral claims
   over an environment the preflight did not actually read. One sentence plus one pin
   modelled on the existing STALE/D15 assertion.
3. **F2 (Moderate)** — the count-drift sweep's coverage. Largest, because widening the
   matcher will surface the 19 currently-unswept sites and each must be checked against its
   list before the tier can go green. Do it after F1 and F3 so that work is not blocking
   the two fail-open fixes. Correct the comment's totality claim in the same change.

Additionally, though not a finding: the tentative item is worth closing. Establishing what
the workflow runtime does with a halted or schema-violating dispatch return would either
retire the closeout-completion question or promote it to a finding at the phase where a
false completion costs the most.

Per the project's standing rule, all three findings are to be applied; this ordering is
about sequence, not selection.

---

Verdict: NEEDS FIXES (3 findings: 1 Serious, 2 Moderate)
