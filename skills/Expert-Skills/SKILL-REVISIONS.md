# Skill revisions — the expert series, across every copy

**What it is.** The register of when each expert-series skill changed, in which copy, and why. One
row per change, in date order, for every copy anywhere — this repository, the projects that vendor
these skills, and the machine's synced set.

**What it is for.** These skills exist in many copies and are edited in whichever copy the work is
happening in. Nothing has ever recorded that centrally, so a rule written in one copy is invisible
to the others and to the next session. Three owner rulings currently live in exactly one copy each
(see *Unpropagated changes*, below). The register makes a change's existence, date, and reason
findable without reading five repositories' git logs.

It answers "when did this change and why." It does not decide which copy is right — see *What this
file does not do*.

**Paths.** The copies this register tracks live across several repositories. Every path below is
therefore written from the **`agent-armory` repository root**, not relative to this file, unless it
names another repository.

---

## Relationship to the plugin's own changelog

`claude-plugins/expert-dev-tools/docs/SKILL-CHANGELOG.md` already exists and stays. It is the
**applyable-text** record for edits made inside that plugin: anchor, verbatim inserted text, the
evidence that motivated it — everything needed to reproduce a change in another copy. Its scope is
`claude-plugins/expert-dev-tools/skills/` and it says so.

**The plugin is a self-contained thing and this register does not live in it, write to it, or change
anything inside it.** The register sits outside the plugin and only reads its git history, the same
way it reads every other copy's.

This file is the **cross-copy register**: every change to every copy, including the ones that plugin
never saw. Where a change has a plugin changelog entry, this file's row points at it by entry number
instead of restating the text — one account of each change, not two.

New edits made inside the plugin get an entry there **and** a row here. Edits made in any other copy
get a row here only, with the change described well enough to find and judge.

---

## What this file does not do

- **It does not name a canonical copy.** That is an open decision. Recording history does not
  require settling it, and pretending it is settled would be worse than leaving it open.
- **It does not track propagation state** — a matrix of which copy has received which change, kept
  by hand, drifts against reality the moment anything moves. *Unpropagated changes* below records
  only what has been verified absent, with the check that verified it, so it can be re-run rather
  than trusted.
- **It does not hold observations, deferred items, or non-changes.** Those live in
  `agent-armory/skill-observations/log.md`, where status is tracked.

---

## How to add a row

Every change to a `SKILL.md` or a `references/` file of an expert-series skill, in any copy, gets a
row in that skill's table below, in the same commit that makes the change — including one-line edits.

| Field | What goes in it |
|---|---|
| Date | The commit date, ISO. |
| Copy | Which copy was edited, by the short names in the census below. |
| Commit | Short SHA, in the repository that holds that copy. |
| What changed | The rule or section, named specifically enough to find. Not the commit subject. |
| Why | The failure that caused it — the review round, the owner ruling, the observation number. A change with no recorded cause cannot be judged for another copy, only copied. |

Where a change has a plugin changelog entry, put its number in *What changed* and do not restate the
text.

---

## Copy census and variance map

A copy count and a set of content hashes are volatile measurements — they change whenever any copy
changes. Per these skills' own volatile-measurement rule, this section records the instrument, the
invocation, and the date, never bare numbers to be trusted later. **Re-run it; do not cite it.**

**Scope of the run.** Every repository in the account pushed on or after 2026-04-21 — the earliest
commit touching any expert-series skill — was checked for copies. Twelve were checked beyond
`NOVA` and `agent-armory`; six carry copies and were cloned. Repos last pushed before the skills
existed are out of scope, and `smart-watch-v3` was excluded by the owner. The repositories holding
copies are: `NOVA`, `agent-armory`, `design-navigator-mcp-ui`, `expert-standards-dev-package`,
`project-manager`, `the-app-for-apps`, `turbine-studio`, `cnc-syndicate-hub`, plus the machine's
synced skill set (which is not a git repository and therefore carries no dates).

**Method.** Three passes, all re-runnable:

1. *Census* — every `SKILL.md` under an `expert-*` or `full-cycle` directory in each clone, with its
   content hash and the date of the last commit that touched it.
2. *History index* — for every such path, every historical content-state in that repo's git log,
   hashed the same way.
3. *Classification* — a current version is **stale** when its exact content appears in some *other*
   path's history (it is an unchanged older copy of that lineage), and **unique** when the content
   exists nowhere else (it carries edits made only there).

```
# census: skill, content hash, last-changed date, repo, path
find . -path ./.git -prune -o -name SKILL.md -print | while read f; do
  s=$(basename "$(dirname "$f")"); case "$s" in expert-*|full-cycle) ;; *) continue;; esac
  printf "%s\t%s\t%s\n" "$s" "$(md5sum < "$f" | cut -c1-8)" \
         "$(git log -1 --date=short --format='%ad %h' -- "${f#./}")"
done

# history index: same, but every state in the log
git log --format='%H %ad' --date=short -- "$path" | while read sha d; do
  printf "%s\t%s\n" "$(git show "$sha:$path" | md5sum | cut -c1-8)" "$d"
done
```

**Run 2026-09-15** against the eight repositories above at their then-current `main`, plus the
synced set. Result: **64 copies of 16 skill names, in 42 distinct versions — 35 of them unique.**

### Reconciliation load

The number that matters for producing one canonical version of each skill is the **unique** column:
stale copies need no content decision, only replacement.

| Skill | Versions | Unique | Stale | Copies |
|---|---|---|---|---|
| `expert-standard` | 8 | **6** | 2 | 20 |
| `expert-review` | 5 | **5** | 0 | 5 |
| `expert-spec` | 4 | **4** | 0 | 4 |
| `expert-implement` | 4 | **3** | 1 | 6 |
| `expert-architecture` | 4 | **3** | 1 | 5 |
| `expert-plan` | 3 | **2** | 1 | 7 |
| `expert-mcp-overhaul` | 3 | **2** | 1 | 3 |
| `expert-standard-eval` | 2 | **2** | 0 | 2 |
| `expert-architecture-portable` | 2 | **1** | 1 | 4 |
| `expert-standard-builder` | 1 | 1 | 0 | 2 |
| `expert-correct` | 1 | 1 | 0 | 1 |
| `expert-architecture-greenfield` | 1 | 1 | 0 | 1 |
| `expert-architecture-greenfield-portable` | 1 | 1 | 0 | 1 |
| `expert-plan-greenfield-portable` | 1 | 1 | 0 | 1 |
| `full-cycle` | 1 | 1 | 0 | 1 |
| **Total** | **42** | **35** | **7** | **64** |

Two naming irregularities that break path-based lookup, recorded so a sweep does not miss them: four
copies of `expert-standard` sit in directories named **`expert-standards`** while the skill's
frontmatter declares `name: expert-standard` (they are folded into `expert-standard` above); and
`agent-armory/gemini-extensions/agentboard/skills/expert-standard.md` is a bare file rather than a
skill directory — its content is identical to the `2a6f1d8d` cluster below.

### Short names used in the revision rows

| Short name | Location |
|---|---|
| `nova` | `Maxcogar/NOVA` → `.claude/skills/` |
| `nova-agents` | `Maxcogar/NOVA` → `.agents/skills/` |
| `plugin` | `agent-armory/claude-plugins/expert-dev-tools/skills/` |
| `aps-fusion` | `agent-armory/mcp-servers/aps-fusion-mcp-server/.claude/skills/` |
| `context-oracle` | `agent-armory/middleware/context-oracle/.claude/skills/` |
| `armory-skills` | `agent-armory/skills/Expert-Skills/` |
| `claude-agentboard` | `agent-armory/claude-plugins/agentboard/skills/` |
| `codex-agentboard` | `agent-armory/codex-plugins/agentboard/skills/` |
| `gemini-agentboard` | `agent-armory/gemini-extensions/agentboard-gemini/skills/` |
| `design-navigator` | `Maxcogar/design-navigator-mcp-ui` → `.claude/skills/` |
| `esdp` | `Maxcogar/expert-standards-dev-package` → `.claude/skills/` and `library/skills/` |
| `project-manager` | `Maxcogar/Project-Manager` → `.claude/skills/`, `.agent/skills/`, `agentboard-plugin/skills/` |
| `the-app-for-apps` | `Maxcogar/the-app-for-apps` → `.claude/skills/` |
| `turbine-studio` | `Maxcogar/Turbine-Studio` → `.claude/skills/` |
| `cnc-hub` | `Maxcogar/CNC-Syndicate-Hub` → `.claude/skills/` |
| `synced` | the machine's `~/.claude/skills/synced/<id>/` — not a git repository |

The revision rows below cover `nova` and `plugin` only. The other locations appear in the variance
map above but have no rows yet; see *Provenance of this register*.

### Variance map

Versions newest-first within each skill. "Last changed" is the newest commit date among that
version's copies; the synced set has no git history, so it shows `—`.

### `expert-standard` — 8 version(s) across 20 copy(ies)

| Version | Held by | Last changed | Status |
|---|---|---|---|
| `d7a59a48` | `agent-armory`/claude-plugins/expert-dev-tools/skills/expert-standard | 2026-08-21 | **unique** — content exists nowhere else |
| `aa632da8` | `NOVA`/.agents/skills/expert-standards | 2026-08-16 | **unique** — content exists nowhere else |
| `3f9a5768` | `project-manager`/.claude/skills/expert-standard<br>`the-app-for-apps`/.claude/skills/expert-standard<br>`agent-armory`/Project-Claude-Configs/Project-Manager/skills/expert-standard<br>`agent-armory`/skills/Expert-Skills/expert-standard<br>`cnc-syndicate-hub`/.claude/skills/expert-standard<br>`turbine-studio`/.claude/skills/expert-standard<br>`agent-armory`/middleware/context-oracle/.claude/skills/expert-standard<br>`agent-armory`/mcp-servers/aps-fusion-mcp-server/.claude/skills/expert-standard | 2026-07-30 | **stale** — same content as `agent-armory` at 2026-07-22 |
| `46721fce` | `design-navigator-mcp-ui`/.claude/skills/expert-standard | 2026-07-11 | **unique** — content exists nowhere else |
| `b8620773` | `NOVA`/.claude/skills/expert-standards | 2026-06-12 | **unique** — content exists nowhere else |
| `68008ddb` | `agent-armory`/claude-plugins/agentboard/skills/expert-standards<br>`project-manager`/agentboard-plugin/skills/expert-standards | 2026-06-07 | **unique** — content exists nowhere else |
| `2a6f1d8d` | `project-manager`/.agent/skills/expert-standards<br>`agent-armory`/codex-plugins/agentboard/skills/expert-standards<br>`agent-armory`/gemini-extensions/agentboard-gemini/skills/expert-standard | 2026-05-11 | **stale** — same content as `agent-armory` at 2026-05-07 |
| `b6c3894d` | `expert-standards-dev-package`/.claude/skills/expert-standard<br>`expert-standards-dev-package`/library/skills/expert-standard<br>`machine synced set` | 2026-04-27 | **unique** — content exists nowhere else |

### `expert-review` — 5 version(s) across 5 copy(ies)

| Version | Held by | Last changed | Status |
|---|---|---|---|
| `46eae723` | `NOVA`/.claude/skills/expert-review | 2026-09-01 | **unique** — content exists nowhere else |
| `b6ab93c8` | `agent-armory`/claude-plugins/expert-dev-tools/skills/expert-review | 2026-08-21 | **unique** — content exists nowhere else |
| `1df7ba33` | `agent-armory`/mcp-servers/aps-fusion-mcp-server/.claude/skills/expert-review | 2026-07-30 | **unique** — content exists nowhere else |
| `3df82ddb` | `design-navigator-mcp-ui`/.claude/skills/expert-review | 2026-07-19 | **unique** — content exists nowhere else |
| `c10f9c8c` | `machine synced set` | — | **unique** — content exists nowhere else |

### `expert-implement` — 4 version(s) across 6 copy(ies)

| Version | Held by | Last changed | Status |
|---|---|---|---|
| `c481d160` | `NOVA`/.claude/skills/expert-implement | 2026-08-29 | **unique** — content exists nowhere else |
| `c00edeea` | `agent-armory`/claude-plugins/expert-dev-tools/skills/expert-implement | 2026-08-21 | **unique** — content exists nowhere else |
| `a210c4c1` | `agent-armory`/skills/Expert-Skills/expert-implement<br>`agent-armory`/middleware/context-oracle/.claude/skills/expert-implement<br>`agent-armory`/mcp-servers/aps-fusion-mcp-server/.claude/skills/expert-implement | 2026-07-30 | **stale** — same content as `agent-armory` at 2026-07-22 |
| `5fde06ac` | `design-navigator-mcp-ui`/.claude/skills/expert-implement | 2026-07-22 | **unique** — content exists nowhere else |

### `expert-architecture` — 4 version(s) across 5 copy(ies)

| Version | Held by | Last changed | Status |
|---|---|---|---|
| `018d1a46` | `agent-armory`/claude-plugins/expert-dev-tools/skills/expert-architecture | 2026-08-21 | **unique** — content exists nowhere else |
| `2a9723da` | `agent-armory`/skills/Expert-Skills/expert-architecture<br>`agent-armory`/mcp-servers/aps-fusion-mcp-server/.claude/skills/expert-architecture | 2026-07-30 | **stale** — same content as `agent-armory` at 2026-07-22 |
| `7360441d` | `design-navigator-mcp-ui`/.claude/skills/expert-architecture | 2026-07-11 | **unique** — content exists nowhere else |
| `d59e02c9` | `machine synced set` | — | **unique** — content exists nowhere else |

### `expert-spec` — 4 version(s) across 4 copy(ies)

| Version | Held by | Last changed | Status |
|---|---|---|---|
| `1f26e5d7` | `NOVA`/.claude/skills/expert-spec | 2026-08-29 | **unique** — content exists nowhere else |
| `89705ea7` | `agent-armory`/claude-plugins/expert-dev-tools/skills/expert-spec | 2026-08-21 | **unique** — content exists nowhere else |
| `c68a0614` | `agent-armory`/mcp-servers/aps-fusion-mcp-server/.claude/skills/expert-spec | 2026-07-30 | **unique** — content exists nowhere else |
| `e29eddef` | `machine synced set` | — | **unique** — content exists nowhere else |

### `expert-plan` — 3 version(s) across 7 copy(ies)

| Version | Held by | Last changed | Status |
|---|---|---|---|
| `719b40cd` | `NOVA`/.claude/skills/expert-plan | 2026-08-29 | **unique** — content exists nowhere else |
| `eecb925b` | `agent-armory`/claude-plugins/expert-dev-tools/skills/expert-plan | 2026-08-21 | **unique** — content exists nowhere else |
| `4e3c4327` | `design-navigator-mcp-ui`/.claude/skills/expert-plan<br>`agent-armory`/skills/Expert-Skills/expert-plan<br>`agent-armory`/middleware/context-oracle/.claude/skills/expert-plan<br>`agent-armory`/mcp-servers/aps-fusion-mcp-server/.claude/skills/expert-plan<br>`machine synced set` | 2026-07-30 | **stale** — same content as `agent-armory` at 2026-07-22 |

### `expert-mcp-overhaul` — 3 version(s) across 3 copy(ies)

| Version | Held by | Last changed | Status |
|---|---|---|---|
| `5eb39fbb` | `agent-armory`/claude-plugins/expert-dev-tools/skills/expert-mcp-overhaul | 2026-08-21 | **unique** — content exists nowhere else |
| `6c9c69a5` | `agent-armory`/mcp-servers/aps-fusion-mcp-server/.claude/skills/expert-mcp-overhaul | 2026-07-30 | **stale** — same content as `agent-armory` at 2026-07-22 |
| `aad58221` | `machine synced set` | — | **unique** — content exists nowhere else |

### `expert-architecture-portable` — 2 version(s) across 4 copy(ies)

| Version | Held by | Last changed | Status |
|---|---|---|---|
| `c124568a` | `agent-armory`/claude-plugins/expert-dev-tools/skills/expert-architecture-portable | 2026-08-21 | **unique** — content exists nowhere else |
| `b609c920` | `agent-armory`/skills/Expert-Skills/expert-architecture-portable/expert-architecture-portable<br>`agent-armory`/middleware/context-oracle/.claude/skills/expert-architecture-portable<br>`machine synced set` | 2026-07-17 | **stale** — same content as `agent-armory` at 2026-07-22 |

### `expert-standard-eval` — 2 version(s) across 2 copy(ies)

| Version | Held by | Last changed | Status |
|---|---|---|---|
| `1967c1b0` | `expert-standards-dev-package`/.claude/skills/expert-standard-eval | 2026-05-04 | **unique** — content exists nowhere else |
| `ff4090f1` | `machine synced set` | — | **unique** — content exists nowhere else |

### `expert-standard-builder` — 1 version(s) across 2 copy(ies)

| Version | Held by | Last changed | Status |
|---|---|---|---|
| `d2232a64` | `expert-standards-dev-package`/.claude/skills/expert-standard-builder<br>`machine synced set` | 2026-04-27 | **unique** — content exists nowhere else |

### `expert-architecture-greenfield` — 1 version(s) across 1 copy(ies)

| Version | Held by | Last changed | Status |
|---|---|---|---|
| `a2d5ebc3` | `machine synced set` | — | **unique** — content exists nowhere else |

### `expert-architecture-greenfield-portable` — 1 version(s) across 1 copy(ies)

| Version | Held by | Last changed | Status |
|---|---|---|---|
| `cc8251a7` | `machine synced set` | — | **unique** — content exists nowhere else |

### `expert-correct` — 1 version(s) across 1 copy(ies)

| Version | Held by | Last changed | Status |
|---|---|---|---|
| `069ea2cd` | `agent-armory`/claude-plugins/expert-dev-tools/skills/expert-correct | 2026-08-21 | **unique** — content exists nowhere else |

### `expert-plan-greenfield-portable` — 1 version(s) across 1 copy(ies)

| Version | Held by | Last changed | Status |
|---|---|---|---|
| `82482d34` | `machine synced set` | — | **unique** — content exists nowhere else |

### `expert-standard.md` — 1 version(s) across 1 copy(ies)

| Version | Held by | Last changed | Status |
|---|---|---|---|
| `2a6f1d8d` | `agent-armory`/gemini-extensions/agentboard/skills/expert-standard.md | 2026-06-03 | **unique** — content exists nowhere else |

### `full-cycle` — 1 version(s) across 1 copy(ies)

| Version | Held by | Last changed | Status |
|---|---|---|---|
| `16920495` | `NOVA`/.claude/skills/full-cycle | 2026-09-10 | **unique** — content exists nowhere else |

---

## Provenance of this register

Rows dated before 2026-09-15 are **backfilled from git history**, not written at the time of the
change. What that means for how far each row can be trusted:

- **Date, copy, and commit** are read from `git log` and are exact.
- **What changed / Why** is taken from the commit message and, where marked **(diff read)**, from
  reading the commit's actual diff. Rows without that mark carry the commit's own account of itself,
  which is a claim by its author — read the commit before acting on one.

From 2026-09-15 forward, rows are written in the commit that makes the change.

**Row coverage is narrower than the census.** The variance map above covers all 64 copies in every
location. The revision rows below were traced from `git log` in `nova` and `plugin` only, and cover
five skills — `expert-review`, `expert-spec`, `expert-plan`, `expert-implement`, `expert-standard`.
No row exists yet for any other location or for `expert-architecture`,
`expert-architecture-portable`, `expert-correct`, `expert-mcp-overhaul`, the greenfield variants, or
`full-cycle`. **A skill or location with no row has not been traced — never read that as "never
changed."**

---

## `expert-review`

| Date | Copy | Commit | What changed | Why |
|---|---|---|---|---|
| 2026-07-19 | `nova` | `cfb4c13` | Edited while applying review round 3's findings to a plan (Q23) | Review round 3 of the hub-excision plan |
| 2026-07-22 | `plugin` | `fa56089` | Packaged into expert-dev-tools S1–S5 | Plugin build |
| 2026-07-23 | `nova` | `3c6adbd` | Edited alongside the expert-spec skill addition; ctxpack edit-gate hook dropped | Tooling migration |
| 2026-08-08 | `plugin` | `94a640a` | Step 6 claim-type list: bullet on citing files outside the artifact by immutable identifier. Post-fix review: paragraph requiring each round's reviewer not to have seen the prior round — *plugin changelog entries 1 and 2* | Observations 76, 77 |
| 2026-08-09 | `plugin` | `f01bded` | Behavioral remediation, 26 steps + 11-step detector remediation | Behavioral acceptance sweeps |
| 2026-08-17 | `nova` | `4d97cf5` | **(diff read)** Step 3 bright line: added *"A review conducted without an instrument class its scope's claim types require is not a review: it delivers no verdict, and a round run that way is void and does not count"*, plus live verification of the instrument roster before Step 4, with confirmations in Scope and Inventory | Owner ruling 2026-08-16 — reviews require tools; there is no fallback tier |
| 2026-08-20 | `plugin` | `d17ccaa` | corrections-0.4.0 (4/7) role-boundary-violations: reviewer findings channel closed | 0.4.0 correction run |
| 2026-08-21 | `plugin` | `eed5c27` | corrections-0.4.0 round-4 foundational rework: two drift classes eliminated | Round-4 tripwire |
| 2026-08-21 | `plugin` | `a4b638e` | corrections-0.4.0 round-5 findings (1 Systemic-recurring, 2 Moderate) | Round-5 review |
| 2026-08-23 | `nova` | `19fbc64` | **(diff read)** Step 2: added the **verified-unchanged carve-out** — a post-fix inventory file byte-identical to content a prior persisted round verified clean is carried by that round's result, confirmed by `git diff` against the commit that round reviewed, instead of being re-reviewed | Owner ruling 2026-08-23, quoted in the rule: *"if the doc was fine then theres no reason to review it. if something else needs reviewed then they should review that instead."* |
| 2026-08-23 | `nova` | `9e73fa2` | **(diff read)** Step 2: added **provenance is not part of the finding surface** — correction records, diagnoses and status prose are context, not the deliverable; defects in them go to Observations, never the verdict or the convergence arithmetic | Owner ruling 2026-08-23, after four rounds of the H0.2 smoke-diagnosis loop found defects only in its own correction records |
| 2026-08-23 | `nova` | `eddbcde` | **(diff read)** Observations section rewritten to carry provenance defects with finding-grade evidence for fix-on-sight; Gate A gains the matching bullet making a misfiled deliverable divergence a Gate A failure, with provenance entries the one sanctioned exception | Fix-on-sight observations from review 09 (PASS) |
| 2026-09-01 | `nova` | `929b9ab` | **(diff read)** Step 3 and Step 6's structural-vs-existence note made to cut both ways: enumerating a changed symbol's reference set is a **structural** claim requiring `codegraph_find_symbol_dependents`; a bare-name grep is its complement (class methods only), never its substitute; a statement of what an instrument returns must be transcribed from a run | A five-round §5-completeness recurrence in the MCP integration plan's review loop — each round missed a different reference form (voice consumer → test constructor → the method's own unit tests → the class re-export). Authored 2026-09-01, left unmerged; the same ambiguity then bit in the opposite direction as round 6's finding F-5 on 2026-09-09 |
| 2026-09-15 | `nova` | `c12b1ec` | `929b9ab` merged to `main` via PR #48 | Owner decision, this session |

## `expert-spec`

| Date | Copy | Commit | What changed | Why |
|---|---|---|---|---|
| 2026-07-22 | `plugin` | `fa56089` | Packaged into expert-dev-tools S1–S5 | Plugin build |
| 2026-07-23 | `nova` | `3c6adbd` | Skill added to the Nova copy | Tooling migration |
| 2026-08-09 | `plugin` | `f01bded` | Behavioral remediation | Behavioral acceptance sweeps |
| 2026-08-17 | `nova` | `b19d7a0` | Volatile-measurement rule extended to expert-spec and expert-architecture | Observation 161; the H0.2 loop, where transcribed figures caused findings in five of twelve review rounds |
| 2026-08-20 | `plugin` | `40cc76c` | corrections-0.4.0 (1/7) instruction-reinterpretation: verbatim request carried end to end | 0.4.0 correction run |
| 2026-08-21 | `plugin` | `eed5c27` | corrections-0.4.0 round-4 foundational rework | Round-4 tripwire |
| 2026-08-21 | `plugin` | `a4b638e` | corrections-0.4.0 round-5 findings | Round-5 review |
| 2026-08-29 | `nova` | `2405ad5` | Advisory-source derivation rules added | Owner decisions of 2026-08-29; PR #19 rules B and D |
| 2026-08-29 | `nova` | `91a5cf0` | Advisory-source checks re-derived from diagnoses 04 and 05 — nine, as defined | Workflow-hardening round-1 correction |
| 2026-08-29 | `nova` | `01d709a` | Advisory checks re-derived at their lines | Workflow-hardening round-2 correction under diagnosis-02: 7 of 8 findings were round-1 classes reproduced in the fix |

## `expert-plan`

| Date | Copy | Commit | What changed | Why |
|---|---|---|---|---|
| 2026-07-18 | `nova` | `3bf253d` | expert-* command/skill migration | Tooling migration |
| 2026-07-22 | `plugin` | `fa56089` | Packaged into expert-dev-tools S1–S5 | Plugin build |
| 2026-08-08 | `plugin` | `94a640a` | `references/output-contract.md` §11, §12, Gate C; new section; `testing-standards.md` anti-pattern 11 — *plugin changelog entries 3, 4, 5* | Observations 78, 79 |
| 2026-08-09 | `plugin` | `a23639c` | Derived sections converted to generated regions with an enforcing script — *plugin changelog entry 6* | Drift between the contract and its derived sections |
| 2026-08-09 | `plugin` | `f01bded` | Behavioral remediation | Behavioral acceptance sweeps |
| 2026-08-17 | `plugin` | `2b1b7d8` | Five acceptance-run corrections; bump to 0.3.0 | Acceptance run |
| 2026-08-17 | `nova` | `7c3a56d` | Owner-directed root-cause correction of the review-loop method | Owner direction 2026-08-17 |
| 2026-08-17 | `nova` | `baa935d` | Output contract reconciled with the installed CodeGraph server's actual tool roster | The server provides none of the calibrated absence tools the contract assumed |
| 2026-08-21 | `plugin` | `eed5c27`, `a4b638e`, `ffac08d` | corrections-0.4.0 rounds 4, 5 and 6 (round 6: 2 Moderate, both recurring) — *plugin changelog entries 7–15 cover the round-by-round contract and script corrections* | 0.4.0 review rounds |
| 2026-08-29 | `nova` | `91a5cf0` | Runtime-evidence gate written into the plan step and Gate C | Workflow-hardening round-1 correction; PR #19's runtime-evidence proposal |
| 2026-08-29 | `nova` | `01d709a` | Runtime-evidence step commits first | Workflow-hardening round-2 correction under diagnosis-02 |

## `expert-implement`

| Date | Copy | Commit | What changed | Why |
|---|---|---|---|---|
| 2026-07-18 | `nova` | `3bf253d` | expert-* command/skill migration | Tooling migration |
| 2026-07-22 | `plugin` | `fa56089` | Packaged into expert-dev-tools S1–S5 | Plugin build |
| 2026-08-17 | `plugin` | `2b1b7d8` | Five acceptance-run corrections; bump to 0.3.0. Appended section on inbound owner messages — INTERROGATIVE vs DIRECTIVE — *plugin changelog entry 17* | Behavioral sweeps: questions treated as work orders, 5–9 occurrences per sweep |
| 2026-08-20 | `plugin` | `0419873` | corrections-0.4.0 (2/7) premature-completion-claims: completion becomes machine-checked | 0.4.0 correction run |
| 2026-08-21 | `plugin` | `eed5c27`, `a4b638e` | corrections-0.4.0 rounds 4 and 5 | 0.4.0 review rounds |
| 2026-08-29 | `nova` | `91a5cf0` | Runtime-evidence preflight and readiness gates | Workflow-hardening round-1 correction |
| 2026-08-29 | `nova` | `01d709a` | PREMISE-FALSE stop category named | Workflow-hardening round-2 correction under diagnosis-02 |

## `expert-standard`

Recorded under its frontmatter name. The `nova` and `nova-agents` copies sit in directories named
`expert-standards`.

| Date | Copy | Commit | What changed | Why |
|---|---|---|---|---|
| 2026-04-21 | `nova` | `e2fb091` | Skill first tracked in Nova | Tooling checked in |
| 2026-06-12 | `nova` | `72d7c91` | Edited at session-end alongside task-observer fixes | Session 2026-06-12 |
| 2026-07-22 | `plugin` | `fa56089` | Packaged into expert-dev-tools S1–S5 | Plugin build |
| 2026-08-09 | `plugin` | `f01bded` | Behavioral remediation | Behavioral acceptance sweeps |
| 2026-08-17 | `plugin` | `2b1b7d8` | **The authorization axis**: "Two shifts" → "Three shifts"; the *act only on authorization, not on inference of intent* shift added — *plugin changelog entry 16* | Behavioral sweeps escalated questions-treated-as-work-orders every run; root-caused to no authorization rule existing in the always-on frame |
| 2026-08-17 | `plugin` | `95173db` | Nine round-1 review findings applied to the 0.3.0 corrections | Round-1 review |
| 2026-08-17 | `plugin` | `e969eb1` | Seven round-2 review findings applied | Round-2 review |
| 2026-08-20 | `plugin` | `40cc76c`, `0ef9850` | corrections-0.4.0 (1/7) instruction-reinterpretation; (6/7) opining-without-reading-source: evidence ladder + deployment preflight | 0.4.0 correction run |
| 2026-08-21 | `plugin` | `eed5c27`, `a4b638e` | corrections-0.4.0 rounds 4 and 5 | 0.4.0 review rounds |

---

## Unpropagated changes

Changes verified present in one copy and absent from another, with the check that established it so
it can be re-run rather than trusted. This is not a full propagation matrix and is not maintained as
one — it records only what has actually been checked, on the date shown.

**Checked 2026-09-15** across all five `expert-review` copies — `nova`, `plugin`, `aps-fusion`,
`design-navigator`, `synced`:

```
for p in "Verified-unchanged carve-out" \
         "Provenance is not part of the finding surface" \
         "find_symbol_dependents" "PREFLIGHT"; do
  echo "-- $p"
  find agent-armory NOVA ~/.claude/skills/synced \
       -path '*/.git' -prune -o -name SKILL.md -path '*/expert-review/*' -print 2>/dev/null |
    while read f; do printf "   %s  %s\n" "$(grep -c -F "$p" "$f")" "$f"; done
done
```

| Rule | Present in | Absent from | Phrase checked |
|---|---|---|---|
| Verified-unchanged carve-out (`19fbc64`) | `nova` only | `plugin`, `aps-fusion`, `design-navigator`, `synced` | `Verified-unchanged carve-out` |
| Provenance is not part of the finding surface (`9e73fa2`) | `nova` only | `plugin`, `aps-fusion`, `design-navigator`, `synced` | `Provenance is not part of the finding surface` |
| Reference-set enumeration is structural (`929b9ab`) | `nova` only | `plugin`, `aps-fusion`, `design-navigator`, `synced` | `find_symbol_dependents` |

All three are owner rulings, and each exists in exactly one of five copies. The `plugin` copy is the
one vendored into other projects, so all three are currently unavailable everywhere except Nova.

**Also checked, and absent from all five:** `PREFLIGHT`. Every review round since 2026-08-16 carries
a `PREFLIGHT` header, and `tools/check-correction-gate.py` check D in Nova blocks the next reviewer
dispatch when the prior round lacks the literal token — but no copy of `expert-review` requires it.
The requirement exists only in the per-line dispatch prompts under `NOVA/docs/reviews/`. The skill
requires the substance ("each required instrument exercised with a real call"); nothing connects it
to the token the gate checks for.
