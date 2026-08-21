# Independent review — corrections 0.4.0, round 8

Reviewer: fresh dispatch, no retained context from rounds 1–7. Prior rounds reach this
review only as written records (inventory source 4).

Target: `claude-plugins/expert-dev-tools/` on branch `claude/edt-corrections-0.4.0`,
HEAD `53914476d0bf3278bb000b1b2d8af83150be9084` (`5391447`), plugin version `0.4.0`
(Read at `.claude-plugin/plugin.json:3`).

---

## Scope and Inventory

### Round number

**Round 8** (post-fix). Rounds 1–7 are on disk at
`docs/reviews/corrections-0.4.0-round-01.md` … `-round-07.md`.

### Operator-directed scope limit (rigor waiver, recorded per *Handling Requests to Compress Rigor*)

The dispatch narrowed this round deliberately and said so in terms: *"You are NOT asked to
re-audit the whole diff from scratch — rounds 1–7 did that, their records are on disk, and
repeating it wastes the owner's money."* The four questions posed were (a) round-7 F1
closure, (b) regression from the newest commit including its class sweep, (c) both tiers
green with no check silently lost, (d) whole-branch ship readiness.

**What was consequently NOT re-verified this round**, named so the reader can audit the
gap rather than infer it: the substantive content of `docs/specs/spec-expert-dev-tools.md`
and `docs/arch/architecture-expert-dev-tools.md` against the diff; the prose of the ten
`agents/*.md` files; the prose of the eleven `skills/**/SKILL.md` files; and the
correction mechanisms of the six non-continuation-gate corrections (commits `40cc76c`
through `0ef9850`). Those rest on rounds 1–7 and are not re-asserted here. Everything this
round *does* assert was verified in this pass, by execution, against current source.

Round 7 delivered the same target with a full inventory and one finding; its coverage is
the baseline this round narrows against, not a substitute for the verification below.

### Inventory (post-fix construction — all four sources)

**Source 2 — the fix-diff files** (`git show --stat 5391447`: exactly two files):

- [x] `tests/structural/check-structure.mjs` — **Read** at `:700–768`, `:766–840`,
  `:845–909`, `:2270–2285`, `:2296–2349`, `:2400–2491`; **executed** 22 times across five
  source states and two environments; **Grep**-verified (`\[gate\]` → 4 results at
  `:2330, :2341, :2442, :2471`; `gateEnv(` → 2 results at `:2325, :2341`;
  `spawnSync|execFileSync|execSync` → 14 results).
- [x] `docs/reviews/corrections-0.4.0-round-07.md` — **Read** at `:1–10`, the
  Critical/Serious section, the whole of F1, the Convergence Record, and the
  Ship-Readiness Judgment; **Grep**-verified (`nineteen|19 commits|twenty` → 2 results at
  `:7` and `:715`; `^Verdict:` → 1 result).

**Source 3 — the fix-diff files' dependents** (the subjects the changed checks execute,
plus the sibling tier):

- [x] `hooks/continuation-gate.mjs` — **Read** in full (241 lines); **executed** under 8
  distinct source states (baseline + 3 degenerate-stdin mutations + 4 sibling mutations)
  and against a real hostile project root.
- [x] `tests/unit/run-unit-tests.mjs` — **executed** in both environments (46 ok / 0 fail
  each); **Grep**-verified (`spawnSync|execFileSync|execSync|CLAUDE_PROJECT_DIR` → 4
  results, all at `:191–197`, all in-process `projectRoot` calls with an injected `env`
  object — this tier spawns no process, so the ambient variable cannot reach it).
- [x] `scripts/preflight-deployment.mjs` — **Read** at `:1–60`; **executed** against the
  real installed registry in four directions (STALE, CURRENT, provenance-only, UNREADABLE).
- [x] `scripts/validate-ledger.mjs` — exercised transitively; the gate imports `validate`
  from it (Read at `continuation-gate.mjs:67`) and the schema-invalid case `(n)` executes
  that path.
- [x] `tests/fixture/continuation/{closeout,complete,corrupt,invalid,no-gate,no-ledger,open-gate}`
  — **Grep**-verified present and tracked (`git ls-files` → 7 results); the `no-gate`
  ledger was **executed** as the hostile ambient root (blocks at phase `implement`).
- [x] `.claude-plugin/plugin.json` — **Read** at `:3` (`"version": "0.4.0"`).

**Source 4 — the prior round's findings as closure items:**

- [x] **R7 F1** — `T-30 exec (i)` bypasses `runGateHook` and inherits ambient
  `CLAUDE_PROJECT_DIR`. Closure re-derived from source and by differential execution; see
  *Closure of Prior Findings*.

**Source 1 — the prior review's full inventory:** carried by reference under the scope
limit recorded above, not re-verified file by file this round.

### Tool plan (Step 3)

| Claim type in this review | Instrument used | Availability |
|---|---|---|
| Absence / enumeration ("only two spawns route through the helper") | `Grep` over the file, query and count recorded | available |
| Literal content ("line N reads Z") | `Read` at the cited range at drafting time | available |
| Behavioral ("this case reddens when the hook regresses") | source **mutation** + tier execution | available |
| Environmental ("the tier survives a hostile ambient root") | execution with `CLAUDE_PROJECT_DIR` set to a purpose-built git-backed project | available |
| Historical ("no check was lost at commit N") | the tier's own T-20 guard run with commit N's file against commit N−1 as `HEAD` | available |
| Claims imported from round-07.md | re-derived from source / re-measured with `git rev-list` | available |
| Library behavior | Context7 — **not required**: this diff introduces no third-party dependency (the gate imports only `node:fs`, `node:path`, `node:url` and one local module, Read at `continuation-gate.mjs:64–67`) | available, unused |

No instrument class was unavailable. No claim in this review is tentative.

### Probe environment

Never the working tree. Two throwaway `git worktree` checkouts at short paths
(`C:\t\pre` detached at `ffac08d`, `C:\t\mut` detached at `5391447`) and one purpose-built
git-backed project at `C:\t\r8h` holding a fresh mid-phase ledger copied from the `no-gate`
fixture. All three were removed after the pass; `git worktree list` afterward shows only
the main tree, and `git status --porcelain claude-plugins/expert-dev-tools/` is empty.

**Baseline note.** The dispatch predicted one environmental failure on a scratch repo (the
repo-root linter). It did not occur: at HEAD the structural tier is **447 ok / 0 fail** and
the unit tier **46 ok / 0 fail**, in the working tree *and* in a detached worktree, with the
ambient variable unset *and* set hostile. Reported as measured, not as briefed.

---

## Summary

**This review returns NEEDS FIXES (2 findings, both Minor).** Round 7's F1 is genuinely and
completely closed: the replacement cases run under a declared root, each is killed by an
isolated mutation of the behavior it names, and the tier that went red under a hostile
ambient `CLAUDE_PROJECT_DIR` before the fix is green under the identical variable after it.
The newest commit introduced no regression — it touches two files, changes no shipped
surface, adds two net checks (445 → 447), and every sibling exec case remains precisely
sensitive under mutation. No check was silently lost, at this commit or at any of the
fifteen commits on the branch, which I verified by re-running the tier's own deletion guard
commit by commit rather than by trusting the prior round's statement of it. Both findings
are overclaims in prose — one in a test-file comment, one in a committed review record —
and neither is reachable from anything a deploying user runs. The engineering on this
branch is in good shape; what remains is accuracy of description, which is exactly the
standard this cycle has spent four rounds enforcing on everything else.

---

## Closure of Prior Findings

### R7 F1 — CLOSED

**The finding.** `docs/reviews/corrections-0.4.0-round-07.md`, F1: `T-30 exec (i)` was the
only continuation-gate exec case that bypassed `runGateHook`, so it inherited ambient
`CLAUDE_PROJECT_DIR`; its green was vacuous, and it turned red inside any project running a
lifecycle. Named standards: **test hermeticity** (a test's outcome must depend only on the
code under test and its declared inputs) and **a control's stated scope must equal its
actual reach**.

**Closure verified against those same two standards**, by three independent methods.

*1 — Source, Read now.* `tests/structural/check-structure.mjs:2337–2346` defines
`runGateRaw`, which builds its child environment with `gateEnv(projectDir)` — the same
scrubbing rule `runGateHook` uses at `:2325`. `:2390` invokes it as
`runGateRaw('', join(fxc, 'no-ledger'))`. The case now declares its root; the ambient
variable is deleted before the spawn. Hermeticity restored at the named site.

*2 — Differential execution, the decisive test.* Same hostile ambient, both sides of the
fix:

| Source state | `CLAUDE_PROJECT_DIR` unset | `CLAUDE_PROJECT_DIR=C:/t/r8h` (fresh mid-phase ledger, verified to block at exit 2, phase `implement`) |
|---|---|---|
| `ffac08d` (pre-fix) | PASSED | **FAILED (1)** — `T-30 exec (i) empty stdin -> exit 0 (a malformed hook payload never traps the session)` |
| `5391447` (HEAD) | PASSED (447 ok) | **PASSED (447 ok)** |

The pre-fix tier reddens at exactly the case F1 named, under exactly the environment F1
predicted; the post-fix tier does not. The defect was real and is gone.

*3 — Mutation, against the vacuity charge.* A green that survives a hostile environment
could still be green for no reason. Three isolated mutations of
`hooks/continuation-gate.mjs`, each applied to a pristine copy in the `C:\t\mut` worktree
and each syntax-checked with `node --check` before running:

| Mutation | Change | Cases killed |
|---|---|---|
| **A** | `raw.trim() === '' ? null : JSON.parse(raw)` → `JSON.parse(raw)` at `:220` (empty stdin stops being an *absent* payload) | `(i2)` **only** — 1 total failure |
| **B** | `process.exit(ALLOW)` → `process.exit(BLOCK)` at `:223` (a malformed payload stops failing open) | `(i3)` **only** — 1 total failure |
| **A+B** | both (an empty payload now blocks) | `(i)`, `(i2)`, `(i3)` — 3 total failures |

Every one of the three replacement cases has a killing mutation, each mutation kills
precisely the case whose label names the mutated behavior, and no mutation reddens an
unrelated check. The greens are non-vacuous, individually and as a set.

*4 — Against F1's prescription, clause by clause.* F1 prescribed routing case (i) through
the helper's env rule, and splitting the conflated claim: pin the fail-open universal
against a *reachable blocking ledger*, and narrow the (i) label to what it actually
establishes. The fix does all three — `(i)` now reads *"empty stdin with no lifecycle in
reach"* with the universal removed, `(i2)` pins the empty-payload-takes-the-ledger-path
consequence including the loop-guard unavailability F1 called out as *"the one worth
taking"*, and `(i3)` pins the fail-open universal where it is not vacuous. Closure is
against the originally named standards, not adjacent ones.

---

## Upstream Contract Verification

The upstream artifacts for this branch are `docs/specs/spec-expert-dev-tools.md` and
`docs/arch/architecture-expert-dev-tools.md`. Under the operator-directed scope limit
recorded above, this round did not re-verify the diff against the spec's full acceptance
criteria or the architecture's full decision set — rounds 1–7 did, and their records stand.

Two upstream obligations *are* in this round's scope, because the newest commit's subject
matter touches them directly, and both were verified here:

| Obligation | Status | Verification method |
|---|---|---|
| Spec §2 amendment of 2026-08-20 — a hook may intercept the end-of-turn decision but must block no tool use | **honored** | Read of `hooks/continuation-gate.mjs:1–20` (the authorization is stated and scoped) plus execution: the hook's only outputs are exit 0 / exit 2 on a `Stop` payload; 18 executed cases observe no other effect |
| Spec §3.4 — seven owner-escalation gate types, and the block reason must name them | **honored** | Execution: the block reason emitted against the hostile root at `C:\t\r8h` contains all seven type names and routes to `/expert resume`; pinned by `T-30 exec (d)/(e)/(f)` and re-observed live this round |

No acceptance criterion checked this round failed.

---

## Critical & Serious Findings

**No Critical or Serious findings.** The full round-8 inventory above was Read or
Grep-verified per Compliance Gate B; both tiers were executed at HEAD in two environments;
the hook and the preflight — the two always-on executables a deploying user actually runs —
were executed against real state in both directions; the newest commit's every changed
check was mutation-verified; every sibling exec case was mutation-verified; and the
check-deletion guard was re-run against all fifteen commits on the branch. No violation of
Critical or Serious classification was observed.

---

## Systemic Patterns

**No systemic patterns.** The candidate was *"a claim in this diff asserts more than what
the code establishes"* — the class rounds 5, 6 and 7 each produced an instance of, so a
third consecutive instance would be systemic rather than isolated. Scans run across the
full inventory scope before classifying:

| Scan | Query | Scope | Result |
|---|---|---|---|
| Gate spawns vs. the env helper | `\[gate\]` and `gateEnv(` | `tests/structural/check-structure.mjs` | 4 spawn sites, 2 helper call sites → **1 instance** (F8-1) |
| Every process spawn in either tier | `spawnSync\|execFileSync\|execSync` | both tiers | 14 results; the 10 outside the T-30 block target the linter, the workflow, the validator and the preflight, none of which reads `CLAUDE_PROJECT_DIR` (`Grep CLAUDE_PROJECT_DIR` over `scripts/preflight-deployment.mjs` → 0 results; it reads `CLAUDE_CONFIG_DIR`) → **0 further instances** |
| Commit-count claims in the added record | `nineteen\|19 commits\|twenty` | `docs/reviews/corrections-0.4.0-round-07.md` | 2 results, both the same claim → **1 instance** (F8-2) |
| Ambient-environment sensitivity, empirically | full tier execution under a hostile `CLAUDE_PROJECT_DIR` | both tiers | 0 failures → **0 undetected instances** |

Two instances, in two different files, of two different kinds (a code comment; a prose
count in a record), with no shared mechanism and no third instance found by the empirical
scan that would catch one I had not thought to grep for. That is not a pattern propagating
through the codebase; it is two isolated inaccuracies. Classified individually below.

---

## Moderate & Minor Findings

### F8-1 — the comment introduced by this commit claims the gate's env rule "lives in ONE place" and that "every spawn of the gate in this block" uses it; two of the four spawns in that block do not (Minor — new)

**Location:** `tests/structural/check-structure.mjs:2311-2313`

**What the code does now.** Read at drafting time, `:2307–2313`:

```js
  // Spawn the gate with a real Stop payload. `env` is controlled EXPLICITLY on every
  // case: CLAUDE_PROJECT_DIR is the root the hook must prefer, so leaving the ambient
  // value in place would silently point every case at this repo's own ledger. Passing
  // it as null deletes it, which is how the `cwd` fallback is exercised.
  // The env rule lives in ONE place. Every spawn of the gate in this block builds its
  // environment here, so no case can quietly inherit the ambient CLAUDE_PROJECT_DIR and
  // pass because nothing was in reach rather than because the hook behaved.
```

The block this comment quantifies over opens at `:2277` and closes at `:2487` — and the
file uses "this block" for exactly that span twelve lines earlier, at `:2275` ("every case
in this block fails closed"). Inside it there are **four** spawns of the gate, and **two**
build their environment inline rather than through `gateEnv`:

```js
:2441      const env = { ...process.env }; env.CLAUDE_PROJECT_DIR = root;
:2470      const env = { ...process.env }; delete env.CLAUDE_PROJECT_DIR; env.CLAUDE_PROJECT_DIR = tmp;
```

**How that claim was verified.** `Grep` for `\[gate\]` over the file → **4 results**
(`:2330`, `:2341`, `:2442`, `:2471`). `Grep` for `gateEnv(` over the file → **2 results**
(`:2325`, `:2341`). Read of `:2432–2445` and `:2462–2474` confirms the two remaining
spawns construct `env` literally. Block boundary confirmed by Read of `:2270–2285` (opener)
and `:2482–2487` (closer).

**What is *not* wrong, stated so the finding is not read as larger than it is.** The
comment's operative safety consequence holds today: both inline sites assign
`CLAUDE_PROJECT_DIR` unconditionally from a temp root they created, so neither can inherit
the ambient value. Verified empirically — the full tier is **447 ok / 0 fail** under
`CLAUDE_PROJECT_DIR=C:/t/r8h`, a root proven to make the gate exit 2. There is no
behavioral defect here.

**Which standard it violates and why.** The standard is this cycle's own, recorded verbatim
in the file under review at `:773` — *"a check's label may not claim more than its
assertion establishes"* — in its general form: **a claim about a control may not assert
more than the control establishes.** The claim "the env rule lives in ONE place" is false at
three places, and "every spawn of the gate in this block builds its environment here" is
false at two of four. It matters for one specific reason, and it is the reason round 7's F1
existed: the next reader auditing this block for ambient-inheritance — which is precisely
the audit F1 was — is told by this comment that checking `gateEnv` suffices, and it does
not. Nothing enforces the centralization the comment asserts, so a future edit that drops
the explicit assignment at `:2441` or `:2470` would reintroduce F1's exact defect with the
comment still claiming it cannot happen. The commit message's "Class swept across both
tiers" is true of the tiers' *behavior* and not quite true of the *mechanism* the comment
describes.

**What correct implementation looks like — verified, not proposed.** Route the two inline
builders through the helper, making the comment's universal true rather than narrowing it:

```js
:2441      const env = gateEnv(root);
:2470      const env = gateEnv(tmp);
```

Both are semantically identical to the code they replace (`gateEnv(x)` returns
`process.env` minus `CLAUDE_PROJECT_DIR` plus `x`). I applied exactly this change on the
`C:\t\mut` worktree and executed it: **447 ok / 0 fail with the ambient variable unset, and
447 ok / 0 fail under `CLAUDE_PROJECT_DIR=C:/t/r8h`** — same count, no check lost, both
environments. (The narrower alternative — rewording the comment to say the rule lives in
one place *for the payload cases* — closes the false claim but leaves the invariant
unenforced, so it is the weaker of the two.)

**Classification:** Minor. **Provenance:** new — round 7 reported the defect this comment
was written to describe, but the comment itself first appears in `5391447`
(`git show 5391447` shows it as an added line).

---

### F8-2 — the review record added by this commit states its audit covered "nineteen commits `a903b12..ffac08d`"; that range holds thirteen, and the overstated figure has already propagated into this round's dispatch (Minor — new)

**Location:** `docs/reviews/corrections-0.4.0-round-07.md:7`

**What the document says now.** Read at drafting time, `:7`:

> nineteen commits `a903b12..ffac08d` against `origin/main`.

and again at `:715`:

> silently lost across nineteen commits, and both tiers are green at HEAD.

**How that claim was verified.** Re-measured, not inferred:
`git rev-list --count a903b12..ffac08d` → **13**. Adjacent readings measured too, so the
finding cannot be a misreading of which range was meant:
`git rev-list --count a903b12..HEAD` → **14**;
`git rev-list --count origin/main..HEAD` → **15**;
`git rev-list --count a903b12^..HEAD` → **15**. No reading of the branch yields nineteen.
Grep for `nineteen|19 commits|twenty` over the file → **2 results**, both above.

**Which standard it violates and why.** The same standard as F8-1, and the same one rounds
5–7 enforced: a claim may not assert more than what was established. A review record's
scope statement is the reader's only account of how much was audited; overstating it by
46% inflates the apparent coverage of the round. This is not inert archival trivia — the
figure is being carried forward and amplified. The dispatch that commissioned *this* round
opens by describing the branch as *"twenty-one commits a903b12..5391447"*; the true count
for that range is **14**. A wrong number in a record became a wrong number in the next
round's scope statement, which is the propagation mechanism this cycle exists to interrupt.

**What correct implementation looks like.** Round-07.md is a dated record of what round 7
found, and silently rewriting an archive is worse than leaving the error, so the correction
is not a quiet edit of `:7`. Either (a) append a dated erratum line to round-07.md stating
the measured counts (`a903b12..ffac08d` = 13; `origin/main..ffac08d` = 14) and leave the
original text visible, or (b) correct both sites and add a one-line note recording that the
figure was corrected in round 8 and why. Whichever is chosen, the count in the *next*
dispatch and in every subsequent record must be the measured one. The substantive claim the
figure decorates — that no check was silently lost — is **true**, and I re-established it
independently rather than inheriting it: see *What's Actually Good*, item 3.

**Classification:** Minor. **Provenance:** new — the file is added by `5391447`
(`git show --stat 5391447` lists it as a new file, 743 lines).

---

## Tentative Findings

**No tentative findings.** Every candidate finding's premise was verified per Compliance
Gate B, with the instrument its claim type requires: `Grep` with query and result count for
both enumeration claims, `Read` at the cited range for both literal-content claims,
`git rev-list` re-measurement for the imported count claim, and source mutation plus tier
execution for every behavioral claim. No candidate was dropped for want of an instrument,
and no instrument class was unavailable.

---

## Observations

Non-finding context; no standard violation attaches to any of these.

1. **The tier's own deletion guard is baselined on `HEAD`, so it polices the working tree,
   not history.** `check-structure.mjs:452` reads the baseline via
   `git show HEAD:claude-plugins/expert-dev-tools/<path>`. On a clean checkout at any
   commit, baseline and current are the same file and the guard is trivially satisfied; its
   force is felt while a change is uncommitted, which is when it can still stop something.
   That is a sound design, and it is why I re-ran it commit-by-commit rather than reading
   the green line at HEAD as evidence about history.

2. **The plugin cache on this machine is 0.3.0 while the branch is 0.4.0**, so the skills
   this review itself loaded came from the older deployment
   (`C:\Users\maxco\.claude\plugins\cache\claude-armory\expert-dev-tools\0.3.0`). That is
   expected for an undeployed branch, and the plugin's own preflight reports it correctly.
   It carries no implication for the findings: nothing in this review was judged against
   the cached copy.

3. **The repository's live ledger is at phase `closeout` and dated 2026-08-17**, four days
   stale against the gate's 24-hour activity window, so this repo does not currently
   exercise the blocking path. That is why the hostile-ambient probe used a purpose-built
   project with a fresh ledger rather than this repo's own.

---

## What's Actually Good

Four properties, each with its standard named and its verification stated.

1. **The replacement of case (i) is a strict strengthening, and it is demonstrably so.**
   Property: three verdicts and a stderr note are pinned under declared roots where one
   verdict was pinned under whatever root the environment supplied. Standard: *test
   hermeticity* and *one assertion, one property* (a case that conflates two behaviors can
   fail for reasons its label does not name). Verified by mutation — A kills only `(i2)`,
   B kills only `(i3)`, A+B kills all three — which is the signature of cases that pin
   separable properties rather than overlapping ones.

2. **Every sibling exec case retained its teeth through the sweep.** Property: each of the
   gate's four load-bearing behaviors is pinned by a case that reddens when that behavior
   alone changes. Standard: *a guard must be demonstrably able to fail* (a test suite whose
   checks survive mutation of the code they name is not a guard). Verified by four further
   mutations of `hooks/continuation-gate.mjs`, each on a pristine copy:

   | Mutation | Cases killed | Nothing else killed |
   |---|---|---|
   | `TERMINAL_PHASES` gains `'closeout'` | `(m)` and its reason check | ✓ (2 total) |
   | `projectRoot` prefers `cwd` over `CLAUDE_PROJECT_DIR` | `(j)`, `(k)` | ✓ (2 total) |
   | `STALE_MS` raised to 10 years | `(m2)`, `(p)` | ✓ (2 total) |
   | `stop_hook_active` guard removed | `(g)` | ✓ (1 total) |

   Restoring the pristine file returned the tier to 447 ok / 0 fail each time.

3. **No check was silently lost anywhere on the branch — established independently, not
   inherited.** Property: for every commit, each label present at its parent is either
   present at the commit in `check(` call position, or has an allowlist entry naming its
   replacement, which must itself be present in call position. Standard: *a control may not
   be weakened without a record of what was traded for what*. Verified by re-running the
   tier's own `goneFrom` guard for all **fifteen** commits `ae7287a..HEAD`, each with the
   commit's `check-structure.mjs` placed in a worktree whose `HEAD` is that commit's parent
   — the exact condition the guard faces at authoring time. **All fifteen report
   `ok T-20 no check present at baseline was removed`.** (For `e4e500f` the first attempt
   crashed on a file that commit introduces; re-run with that commit's added files present,
   it passes. Reported because a probe artifact that goes unmentioned reads later as a
   result.) Corroborated at the newest commit by a label-set diff: `ffac08d` 445 labels →
   `5391447` 447, with exactly one removal — the defective label — and three additions.

4. **The guard that forced the rename to be declared is live, and I proved it rather than
   assuming it.** Property: had the author renamed case (i) without adding the
   `REPLACED_BY_STRENGTHENING` entry at `:754–768`, the tier would have gone red. Standard:
   *an enforcement mechanism must be shown to enforce.* Verified by executing the new
   `check-structure.mjs` against the `ffac08d` baseline (passes: `ok T-20 …`), then
   deleting only that allowlist entry and re-running: **`FAIL T-20 no check present at
   baseline was removed (removed: T-30 exec (i) empty stdin -> exit 0 (a malformed hook
   payload never traps the session))`**. The record in the diff is not decoration; it is
   the price of the rename.

5. **Both always-on executables behave correctly against real state, in both directions.**
   Standard: *a control that fails open on the unhappy path must be shown to do so, and one
   that fails closed must be shown to do that.* Verified by execution:
   the **preflight** against the real installed registry → `STALE`, exit **1**, correctly
   listing the 0.3.0 cache, the missing `hooks/` and `preflight-deployment.mjs`, and the
   version divergence; against the cache compared to itself → `CURRENT`, exit **0**;
   provenance-only → exit **0**; unknown plugin → `UNREADABLE`, exit **2** (fails closed).
   The **hook** allows in every non-in-flight state and blocks only mid-phase-with-no-open-gate,
   observed live against `C:\t\r8h`.

---

## Convergence Record

- **Round number:** 8 (post-fix), matching Scope and Inventory.

- **Trajectory** (findings by severity, each round's mechanical verdict breakdown, read
  from each round's own record):

  | Round | Findings | Breakdown |
  |---|---|---|
  | R1 | 6 | 1 Critical, 3 Serious, 2 Moderate |
  | R2 | 4 | 1 Serious, 2 Moderate, 1 Minor |
  | R3 | 3 | 1 Serious, 2 Moderate |
  | R4 | 4 | 1 Systemic, 2 Moderate, 1 Minor |
  | R5 | 3 | 1 Systemic-recurring, 2 Moderate |
  | R6 | 2 | 2 Moderate (both recurring) |
  | R7 | 1 | 1 Moderate (new) |
  | **R8** | **2** | **2 Minor (both new)** |

- **Flow counts for this round.** Prior findings **closed: 1** — R7 F1, verified closed
  against both of its originally named standards by differential execution and by three
  isolated mutations, not by reading the fix. **New: 2** — F8-1 and F8-2, provenance
  established from `git show 5391447` in both cases. **Regressions: 0** — the commit
  touches two files, changes no shipped surface, and every sibling exec case was
  mutation-verified to be unweakened. **Recurring: 0** — no prior round's finding survives
  at its own location and standard.

- **Tripwire evaluation — NOT FIRED**, both conditions, arithmetic shown.

  *Condition (a): new + regression ≥ closed, for two consecutive post-fix rounds.*
  R8: 2 + 0 = 2, closed 1 → **2 ≥ 1 is TRUE**.
  R7: 1 + 0 = 1, closed 2 → **1 ≥ 2 is false** (re-derived from round-07.md's own flow
  counts). Two consecutive rounds are required; R7 does not satisfy it, so the condition
  **has not fired**. R8 is the first round of a potential pair.

  *Condition (b): total findings not strictly decreased, for two consecutive post-fix rounds.*
  R6 2 → R7 1 (**strictly decreased**). R7 1 → R8 2 (**did not decrease**). One
  qualifying round, not two. **Not fired.**

  **Honest reading of the arithmetic, since both conditions moved this round.** The
  trajectory reversed for the first time since R3→R4, and R8 satisfies the leading half of
  both tripwire conditions. Neither has fired, and the mechanical rule is the rule. But the
  composition matters more than the count here and points the other way: severity fell from
  Moderate to Minor, the recurring count is zero for the second consecutive round, the
  Systemic class that dominated R4–R6 has produced no instance since R5, and both new
  findings are inaccuracies in prose rather than defects in a control. The count rose
  because the two remaining imperfections happen to be small, not because rework is
  generating defects as fast as it closes them — which is the condition the tripwire exists
  to detect. If R9 does not strictly decrease, condition (b) fires, and that would be the
  point at which the pattern rather than the count deserves the weight.

---

## Recommended Priority

The tripwire has not fired, so the indicated path is a fix round, not foundational rework.
Both items are small and independent; either order works.

1. **F8-1 first**, because it is inside the control surface and the correction is already
   verified: replace the two inline env builders at `:2441` and `:2470` with
   `gateEnv(root)` and `gateEnv(tmp)`. This makes the comment's universal true and closes
   the gap that would let F1's defect return unannounced. Measured: 447 ok / 0 fail in both
   environments after the change.

2. **F8-2 second.** Record the measured commit counts by erratum rather than by silent
   edit, and carry the measured figure into the next dispatch. The value here is stopping
   the propagation, which has already occurred once.

Neither is a reason to hold the branch. See the judgment below.

---

## Ship-Readiness Judgment

**The branch is safe to deploy, and I would ship it.** That is a judgment about risk, not a
verdict — the verdict is NEEDS FIXES, because two findings of any severity make it so.

The two findings are prose. F8-1 is a comment in a test file; F8-2 is a sentence in a review
record. Neither is code, neither executes, and neither is reachable from anything a user
runs — `docs/` and `tests/` are the plugin's own declared `EXCLUDED_TREES`
(`scripts/preflight-deployment.mjs:47`), the two trees that by construction do not ship.
Their worst realistic consequence is that a future maintainer auditing this block trusts a
sentence and skips two lines, or that a wrong number propagates one more hop.

What a deploying user actually gets, exercised this round against real state rather than
fixtures alone:

- **The Stop hook**, which becomes always-on in every project the moment 0.4.0 installs. It
  allows in every state that is not positive evidence of an in-flight lifecycle — no
  ledger, unrelated directory, terminal phase, stale ledger, unresumable ledger, corrupt
  ledger, unreadable payload, loop guard set — and blocks only at a fresh mid-phase ledger
  with no open owner gate. When it blocks it names the phase, enumerates the seven §3.4
  gate types, and routes to `/expert resume`. Bounded twice over, by `stop_hook_active` and
  by the platform's block cap. Eighteen executed cases cover those paths, and I confirmed
  under mutation that each of its four load-bearing behaviors has a case that reddens when
  it changes.
- **The deployment preflight**, correct in all four directions against the real installed
  registry, failing closed on both staleness (exit 1) and unreadability (exit 2).
- **The test tiers**, 447 + 46 green, and — this is the part that changed this round —
  green *independently of the environment they run in*. Before `5391447` the structural
  tier went red inside any project running a lifecycle, which is the environment this
  plugin itself creates. A guard that reddens because of where it is run teaches its
  operator to discount red lines, and that is the failure mode the newest commit removed.
  It is a genuine improvement in the trustworthiness of the branch's own evidence.

So the distinction lands where round 7 left it, one notch better: **residual imperfection
in description, not in control, and not in user-facing behavior.** Fix both, then ship.

---

Verdict: NEEDS FIXES (2 findings: 2 Minor)
