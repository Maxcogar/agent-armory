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

**The skills do not only live in `skills/` directories.** They are also installed as slash
**commands** (`.claude/commands/expert-*.md`), as subagent **profiles** (`.claude/agents/`), and as
always-on **rules** (`.agents/rules/`, `roles/_shared/`) — all full-length, all separately edited.
An earlier run of this census searched only for files named `SKILL.md` and therefore missed 55 of
119 copies, including the largest and most recently edited `expert-architecture` text in existence
(`NOVA/.claude/commands/expert-architecture.md`, 78 KB, 2026-08-29). **Search by form and location,
never by filename.**

**Scope of the run.** Every repository in the account pushed on or after 2026-04-21 — the earliest
commit touching any expert-series skill — was checked for copies. Twelve were checked beyond `NOVA`
and `agent-armory`; six carry copies and were cloned. Repos last pushed before the skills existed
are out of scope, and `smart-watch-v3` was excluded by the owner. Locations holding copies: `NOVA`,
`agent-armory`, `design-navigator-mcp-ui`, `expert-standards-dev-package`, `project-manager`,
`the-app-for-apps`, `turbine-studio`, `cnc-syndicate-hub`, plus the machine's synced skill set
(not a git repository, so it carries no dates).

**Excluded as outputs, not copies:** anything under `docs/` — review reports, plans, specs and
architectures *produced by* these skills (`docs/planning/reviews/*-expert-review-*.md` and similar).
Those are products, not variants, and counting them would inflate every figure here.

**Method.** Three passes, all re-runnable:

1. *Census* — every `SKILL.md` under an `expert-*`/`full-cycle` directory, plus every
   `expert-*.md`/`full-cycle*.md` under a `commands/`, `agents/`, `rules/` or `roles/` directory,
   with its content hash and the date of the last commit that touched it.
2. *History index* — for every one of those paths, every historical content-state in that repo's
   git log, hashed the same way.
3. *Classification* — a version is **stale** when its exact content appears in some *other* path's
   history (an unchanged older copy of that lineage), and **unique** when the content exists nowhere
   else (it carries edits made only there).

```
# pass 1 — census, run in each clone
find . -path ./.git -prune -o -name SKILL.md -print | while read f; do
  s=$(basename "$(dirname "$f")"); case "$s" in expert-*|full-cycle) ;; *) continue;; esac
  printf "%s\tskill\t%s\t%s\n" "$s" "$(md5sum <"$f"|cut -c1-8)" \
         "$(git log -1 --date=short --format=%ad -- "${f#./}")"
done
find . -path ./.git -prune -o -type f \( -iname 'expert-*.md' -o -iname 'full-cycle*.md' \) -print |
while read f; do p="${f#./}"
  case "/$p" in */docs/*|*/skill-observations/*|*/references/*) continue;; esac
  case "/$p" in */commands/*) form=command;; */agents/*) form=agent;;
                */rules/*) form=rule;; */roles/*) form=role;; *) continue;; esac
  printf "%s\t%s\t%s\t%s\n" "$(basename "$p" .md)" "$form" "$(md5sum <"$f"|cut -c1-8)" \
         "$(git log -1 --date=short --format=%ad -- "$p")"
done

# pass 2 — history index, for every path pass 1 emitted
git log --format='%H %ad' --date=short -- "$path" | while read sha d; do
  printf "%s\t%s\n" "$(git show "$sha:$path" | md5sum | cut -c1-8)" "$d"
done
```

**Run 2026-09-15** against the eight repositories at their then-current `main`, plus the synced set:
**119 copies of 28 names, in 76 distinct versions — 64 of them unique.**

### Reconciliation load

The number that matters for producing one canonical version of each skill is the **unique** column;
stale copies need no content decision, only replacement.

| Skill | Exists as | Versions | Unique | Stale | Copies |
|---|---|---|---|---|---|
| `expert-standard` | role/rule/skill | 11 | **9** | 2 | 23 |
| `expert-review` | command/skill | 8 | **8** | 0 | 13 |
| `expert-spec` | command/skill | 8 | **7** | 1 | 15 |
| `expert-architecture` | command/skill | 7 | **5** | 2 | 10 |
| `expert-plan` | command/skill | 6 | **4** | 2 | 13 |
| `expert-implement` | agent/command/skill | 6 | **4** | 2 | 10 |
| `expert-implementer` | agent | 3 | **2** | 1 | 4 |
| `expert-architecture-greenfield` | command/skill | 2 | **2** | 0 | 3 |
| `expert-mcp-overhaul` | skill | 3 | **2** | 1 | 3 |
| `expert-architecture-greenfield-portable` | command/skill | 2 | **2** | 0 | 2 |
| `expert-standard-eval` | skill | 2 | **2** | 0 | 2 |
| `expert-architecture-portable` | skill | 2 | **1** | 1 | 4 |
| `expert-standard-builder` | skill | 1 | **1** | 0 | 2 |
| `expert-acceptance` | agent | 1 | **1** | 0 | 1 |
| `expert-architect` | agent | 1 | **1** | 0 | 1 |
| `expert-closeout` | agent | 1 | **1** | 0 | 1 |
| `expert-correct` | skill | 1 | **1** | 0 | 1 |
| `expert-corrector` | agent | 1 | **1** | 0 | 1 |
| `expert-diagnostician` | agent | 1 | **1** | 0 | 1 |
| `expert-plan-greenfield-portable` | skill | 1 | **1** | 0 | 1 |
| `expert-planner` | agent | 1 | **1** | 0 | 1 |
| `expert-reviewer` | agent | 1 | **1** | 0 | 1 |
| `expert-spec-writer` | agent | 1 | **1** | 0 | 1 |
| `expert-standard.md` | skill | 1 | **1** | 0 | 1 |
| `expert-tool-classifier` | agent | 1 | **1** | 0 | 1 |
| `expert-tool-substance-verifier` | agent | 1 | **1** | 0 | 1 |
| `expert-verifier` | agent | 1 | **1** | 0 | 1 |
| `full-cycle` | skill | 1 | **1** | 0 | 1 |
| **Total (28 names)** | | **76** | **64** | **12** | **119** |

Two things this table makes visible that a `skills/`-only view hides. **`full-cycle` exists in
exactly one place** — `NOVA/.claude/skills/full-cycle` — so every other repository runs these skills
with no workflow document: no phase order, no correction procedure, no diagnosis rule, no traps
ledger. And **the same skill often differs between its skill form and its command form in the same
repo**, so "one canonical version per skill" may need to mean one per (skill, form) pair; the
variance map below shows which.

Naming irregularities that break path-based lookup: four copies of `expert-standard` sit in
directories named **`expert-standards`** (folded into `expert-standard` above);
`agent-armory/gemini-extensions/agentboard/skills/expert-standard.md` is a bare file rather than a
skill directory; and the subagent profiles `expert-implementer`, `expert-planner`, `expert-reviewer`
and `expert-spec-writer` are distinct artifacts from the skills they are named after — they are
listed separately and must not be merged into them.

### Variance map

Versions newest-first within each name. "Last changed" is the newest commit date among that
version's copies; the synced set has no git history, so it shows `—`.

#### `expert-standard` — 11 version(s), 23 cop(ies)

| Version | Form | Held by | Last changed | Status |
|---|---|---|---|---|
| `d7a59a48` | skill | `agent-armory`/claude-plugins/expert-dev-tools/skills/expert-standard/SKILL.md | 2026-08-21 | **unique** |
| `aa632da8` | skill | `NOVA`/.agents/skills/expert-standards/SKILL.md | 2026-08-16 | **unique** |
| `3f9a5768` | skill | `project-manager`/.claude/skills/expert-standard/SKILL.md<br>`the-app-for-apps`/.claude/skills/expert-standard/SKILL.md<br>`agent-armory`/Project-Claude-Configs/Project-Manager/skills/expert-standard/SKILL.md<br>`agent-armory`/skills/Expert-Skills/expert-standard/SKILL.md<br>`cnc-syndicate-hub`/.claude/skills/expert-standard/SKILL.md<br>`turbine-studio`/.claude/skills/expert-standard/SKILL.md<br>`agent-armory`/middleware/context-oracle/.claude/skills/expert-standard/SKILL.md<br>`agent-armory`/mcp-servers/aps-fusion-mcp-server/.claude/skills/expert-standard/SKILL.md | 2026-07-30 | **stale** — content of `agent-armory`/claude-plugins/expert-dev-tools/skills/expert-standard/SKILL.md at 2026-07-22 |
| `46721fce` | skill | `design-navigator-mcp-ui`/.claude/skills/expert-standard/SKILL.md | 2026-07-11 | **unique** |
| `b8620773` | skill | `NOVA`/.claude/skills/expert-standards/SKILL.md | 2026-06-12 | **unique** |
| `68008ddb` | skill | `agent-armory`/claude-plugins/agentboard/skills/expert-standards/SKILL.md<br>`project-manager`/agentboard-plugin/skills/expert-standards/SKILL.md | 2026-06-07 | **unique** |
| `2a6f1d8d` | skill | `project-manager`/.agent/skills/expert-standards/SKILL.md<br>`agent-armory`/codex-plugins/agentboard/skills/expert-standards/SKILL.md<br>`agent-armory`/gemini-extensions/agentboard-gemini/skills/expert-standard/SKILL.md | 2026-05-11 | **stale** — content of `agent-armory`/claude-plugins/agentboard/skills/expert-standards/SKILL.md at 2026-05-07 |
| `68478e21` | role | `agent-armory`/programmatic-claude-profiles/roles/_shared/expert-standard.md | 2026-05-04 | **unique** |
| `b6c3894d` | skill | `synced set`<br>`expert-standards-dev-package`/.claude/skills/expert-standard/SKILL.md<br>`expert-standards-dev-package`/library/skills/expert-standard/SKILL.md | 2026-04-27 | **unique** |
| `e5c19a84` | rule | `NOVA`/.agents/rules/expert-standards.md | 2026-04-21 | **unique** |
| `5d97fcc8` | rule | `the-app-for-apps`/.agents/rules/expert-standards.md | 2026-04-09 | **unique** |

#### `expert-spec` — 8 version(s), 15 cop(ies)

| Version | Form | Held by | Last changed | Status |
|---|---|---|---|---|
| `1f26e5d7` | skill | `NOVA`/.claude/skills/expert-spec/SKILL.md | 2026-08-29 | **unique** |
| `89705ea7` | skill | `agent-armory`/claude-plugins/expert-dev-tools/skills/expert-spec/SKILL.md | 2026-08-21 | **unique** |
| `c68a0614` | skill | `agent-armory`/mcp-servers/aps-fusion-mcp-server/.claude/skills/expert-spec/SKILL.md | 2026-07-30 | **unique** |
| `59c4cef9` | command | `project-manager`/.claude/commands/expert-spec.md<br>`the-app-for-apps`/.claude/commands/expert-spec.md<br>`agent-armory`/Project-Claude-Configs/Project-Manager/commands/expert-spec.md<br>`agent-armory`/commands/Expert-Commands/expert-spec.md<br>`cnc-syndicate-hub`/.claude/commands/expert-spec.md<br>`turbine-studio`/.claude/commands/expert-spec.md<br>`agent-armory`/middleware/context-oracle/.claude/commands/expert-spec.md | 2026-07-17 | **unique** |
| `4d02ba78` | command | `design-navigator-mcp-ui`/.claude/commands/expert-spec.md | 2026-07-11 | **unique** |
| `bc719865` | command | `NOVA`/.claude/commands/expert-spec.md | 2026-06-12 | **unique** |
| `9c9441bb` | command | `expert-standards-dev-package`/.claude/commands/expert-spec.md<br>`expert-standards-dev-package`/library/commands/expert-spec.md | 2026-04-27 | **stale** — content of `NOVA`/.claude/commands/expert-spec.md at 2026-05-06 |
| `e29eddef` | skill | `synced set` | — | **unique** |

#### `expert-review` — 8 version(s), 13 cop(ies)

| Version | Form | Held by | Last changed | Status |
|---|---|---|---|---|
| `46eae723` | skill | `NOVA`/.claude/skills/expert-review/SKILL.md | 2026-09-01 | **unique** |
| `b6ab93c8` | skill | `agent-armory`/claude-plugins/expert-dev-tools/skills/expert-review/SKILL.md | 2026-08-21 | **unique** |
| `1df7ba33` | skill | `agent-armory`/mcp-servers/aps-fusion-mcp-server/.claude/skills/expert-review/SKILL.md | 2026-07-30 | **unique** |
| `3df82ddb` | skill | `design-navigator-mcp-ui`/.claude/skills/expert-review/SKILL.md | 2026-07-19 | **unique** |
| `ea7dd0f9` | command | `agent-armory`/commands/Expert-Commands/expert-review.md<br>`turbine-studio`/.claude/commands/expert-review.md<br>`agent-armory`/middleware/context-oracle/.claude/commands/expert-review.md | 2026-07-17 | **unique** |
| `5ae100e5` | command | `project-manager`/.claude/commands/expert-review.md<br>`the-app-for-apps`/.claude/commands/expert-review.md<br>`agent-armory`/Project-Claude-Configs/Project-Manager/commands/expert-review.md<br>`cnc-syndicate-hub`/.claude/commands/expert-review.md | 2026-06-04 | **unique** |
| `f9887717` | command | `expert-standards-dev-package`/library/commands/expert-review.md | 2026-04-27 | **unique** |
| `c10f9c8c` | skill | `synced set` | — | **unique** |

#### `expert-architecture` — 7 version(s), 10 cop(ies)

| Version | Form | Held by | Last changed | Status |
|---|---|---|---|---|
| `433fe1cb` | command | `NOVA`/.claude/commands/expert-architecture.md | 2026-08-29 | **unique** |
| `018d1a46` | skill | `agent-armory`/claude-plugins/expert-dev-tools/skills/expert-architecture/SKILL.md | 2026-08-21 | **unique** |
| `2a9723da` | skill | `agent-armory`/skills/Expert-Skills/expert-architecture/SKILL.md<br>`agent-armory`/mcp-servers/aps-fusion-mcp-server/.claude/skills/expert-architecture/SKILL.md | 2026-07-30 | **stale** — content of `agent-armory`/claude-plugins/expert-dev-tools/skills/expert-architecture/SKILL.md at 2026-07-22 |
| `7360441d` | skill | `design-navigator-mcp-ui`/.claude/skills/expert-architecture/SKILL.md | 2026-07-11 | **unique** |
| `12e2b12d` | command | `agent-armory`/commands/Expert-Commands/expert-architecture.md<br>`turbine-studio`/.claude/commands/expert-architecture.md | 2026-07-07 | **stale** — content of `NOVA`/.claude/commands/expert-architecture.md at 2026-07-18 |
| `3da7eec8` | command | `expert-standards-dev-package`/library/commands/expert-architecture.md<br>`project-manager`/.claude/commands/expert-architecture.md | 2026-05-30 | **unique** |
| `d59e02c9` | skill | `synced set` | — | **unique** |

#### `expert-plan` — 6 version(s), 13 cop(ies)

| Version | Form | Held by | Last changed | Status |
|---|---|---|---|---|
| `719b40cd` | skill | `NOVA`/.claude/skills/expert-plan/SKILL.md | 2026-08-29 | **unique** |
| `eecb925b` | skill | `agent-armory`/claude-plugins/expert-dev-tools/skills/expert-plan/SKILL.md | 2026-08-21 | **unique** |
| `4e3c4327` | skill | `synced set`<br>`design-navigator-mcp-ui`/.claude/skills/expert-plan/SKILL.md<br>`agent-armory`/middleware/context-oracle/.claude/skills/expert-plan/SKILL.md<br>`agent-armory`/skills/Expert-Skills/expert-plan/SKILL.md<br>`agent-armory`/mcp-servers/aps-fusion-mcp-server/.claude/skills/expert-plan/SKILL.md | 2026-07-30 | **stale** — content of `agent-armory`/claude-plugins/expert-dev-tools/skills/expert-plan/SKILL.md at 2026-07-22 |
| `945ce35f` | command | `the-app-for-apps`/.claude/commands/expert-plan.md<br>`agent-armory`/Project-Claude-Configs/Project-Manager/commands/expert-plan.md<br>`agent-armory`/commands/Expert-Commands/expert-plan.md<br>`turbine-studio`/.claude/commands/expert-plan.md | 2026-07-07 | **unique** |
| `b53997a1` | command | `expert-standards-dev-package`/library/commands/expert-plan.md | 2026-04-27 | **unique** |
| `cb819b7f` | command | `project-manager`/.claude/commands/expert-plan.md | 2026-04-23 | **stale** — content of `the-app-for-apps`/.claude/commands/expert-plan.md at 2026-04-19 |

#### `expert-implement` — 6 version(s), 10 cop(ies)

| Version | Form | Held by | Last changed | Status |
|---|---|---|---|---|
| `c481d160` | skill | `NOVA`/.claude/skills/expert-implement/SKILL.md | 2026-08-29 | **unique** |
| `c00edeea` | skill | `agent-armory`/claude-plugins/expert-dev-tools/skills/expert-implement/SKILL.md | 2026-08-21 | **unique** |
| `a210c4c1` | skill | `agent-armory`/middleware/context-oracle/.claude/skills/expert-implement/SKILL.md<br>`agent-armory`/skills/Expert-Skills/expert-implement/SKILL.md<br>`agent-armory`/mcp-servers/aps-fusion-mcp-server/.claude/skills/expert-implement/SKILL.md | 2026-07-30 | **stale** — content of `agent-armory`/claude-plugins/expert-dev-tools/skills/expert-implement/SKILL.md at 2026-07-22 |
| `5fde06ac` | skill | `design-navigator-mcp-ui`/.claude/skills/expert-implement/SKILL.md | 2026-07-22 | **unique** |
| `786e55ae` | command | `turbine-studio`/.claude/commands/expert-implement.md | 2026-07-12 | **unique** |
| `bc752d69` | agent/command | `agent-armory`/agents/Expert-Agents/Expert-Implementation/expert-implement.md<br>`the-app-for-apps`/.claude/commands/expert-implement.md<br>`agent-armory`/commands/Expert-Commands/expert-implement.md | 2026-06-03 | **stale** — content of `turbine-studio`/.claude/commands/expert-implement.md at 2026-07-07 |

#### `expert-implementer` — 3 version(s), 4 cop(ies)

| Version | Form | Held by | Last changed | Status |
|---|---|---|---|---|
| `a1bd0ba3` | agent | `agent-armory`/claude-plugins/expert-dev-tools/agents/expert-implementer.md | 2026-08-21 | **unique** |
| `aba323df` | agent | `turbine-studio`/.claude/agents/expert-implementer.md | 2026-07-12 | **unique** |
| `b1e0fcbf` | agent | `the-app-for-apps`/.claude/agents/expert-implementer.md<br>`agent-armory`/agents/Expert-Agents/Expert-Implementation/expert-implementer.md | 2026-06-03 | **stale** — content of `turbine-studio`/.claude/agents/expert-implementer.md at 2026-07-07 |

#### `expert-mcp-overhaul` — 3 version(s), 3 cop(ies)

| Version | Form | Held by | Last changed | Status |
|---|---|---|---|---|
| `5eb39fbb` | skill | `agent-armory`/claude-plugins/expert-dev-tools/skills/expert-mcp-overhaul/SKILL.md | 2026-08-21 | **unique** |
| `6c9c69a5` | skill | `agent-armory`/mcp-servers/aps-fusion-mcp-server/.claude/skills/expert-mcp-overhaul/SKILL.md | 2026-07-30 | **stale** — content of `agent-armory`/claude-plugins/expert-dev-tools/skills/expert-mcp-overhaul/SKILL.md at 2026-07-22 |
| `aad58221` | skill | `synced set` | — | **unique** |

#### `expert-architecture-portable` — 2 version(s), 4 cop(ies)

| Version | Form | Held by | Last changed | Status |
|---|---|---|---|---|
| `c124568a` | skill | `agent-armory`/claude-plugins/expert-dev-tools/skills/expert-architecture-portable/SKILL.md | 2026-08-21 | **unique** |
| `b609c920` | skill | `synced set`<br>`agent-armory`/middleware/context-oracle/.claude/skills/expert-architecture-portable/SKILL.md<br>`agent-armory`/skills/Expert-Skills/expert-architecture-portable/expert-architecture-portable/SKILL.md | 2026-07-17 | **stale** — content of `agent-armory`/claude-plugins/expert-dev-tools/skills/expert-architecture-portable/SKILL.md at 2026-07-22 |

#### `expert-architecture-greenfield` — 2 version(s), 3 cop(ies)

| Version | Form | Held by | Last changed | Status |
|---|---|---|---|---|
| `000cc316` | command | `agent-armory`/commands/Expert-Commands/expert-architecture-greenfield.md<br>`turbine-studio`/.claude/commands/expert-architecture-greenfield.md | 2026-07-07 | **unique** |
| `a2d5ebc3` | skill | `synced set` | — | **unique** |

#### `expert-architecture-greenfield-portable` — 2 version(s), 2 cop(ies)

| Version | Form | Held by | Last changed | Status |
|---|---|---|---|---|
| `ced9b2ed` | command | `agent-armory`/commands/Expert-Commands/expert-architecture-greenfield-portable.md | 2026-06-03 | **unique** |
| `cc8251a7` | skill | `synced set` | — | **unique** |

#### `expert-standard-eval` — 2 version(s), 2 cop(ies)

| Version | Form | Held by | Last changed | Status |
|---|---|---|---|---|
| `1967c1b0` | skill | `expert-standards-dev-package`/.claude/skills/expert-standard-eval/SKILL.md | 2026-05-04 | **unique** |
| `ff4090f1` | skill | `synced set` | — | **unique** |

#### `expert-standard-builder` — 1 version(s), 2 cop(ies)

| Version | Form | Held by | Last changed | Status |
|---|---|---|---|---|
| `d2232a64` | skill | `synced set`<br>`expert-standards-dev-package`/.claude/skills/expert-standard-builder/SKILL.md | 2026-04-27 | **unique** |

#### `expert-acceptance` — 1 version(s), 1 cop(ies)

| Version | Form | Held by | Last changed | Status |
|---|---|---|---|---|
| `aebd5423` | agent | `agent-armory`/claude-plugins/expert-dev-tools/agents/expert-acceptance.md | 2026-08-21 | **unique** |

#### `expert-architect` — 1 version(s), 1 cop(ies)

| Version | Form | Held by | Last changed | Status |
|---|---|---|---|---|
| `30f260b6` | agent | `agent-armory`/claude-plugins/expert-dev-tools/agents/expert-architect.md | 2026-08-21 | **unique** |

#### `expert-closeout` — 1 version(s), 1 cop(ies)

| Version | Form | Held by | Last changed | Status |
|---|---|---|---|---|
| `72e178cd` | agent | `agent-armory`/claude-plugins/expert-dev-tools/agents/expert-closeout.md | 2026-08-21 | **unique** |

#### `expert-correct` — 1 version(s), 1 cop(ies)

| Version | Form | Held by | Last changed | Status |
|---|---|---|---|---|
| `069ea2cd` | skill | `agent-armory`/claude-plugins/expert-dev-tools/skills/expert-correct/SKILL.md | 2026-08-21 | **unique** |

#### `expert-corrector` — 1 version(s), 1 cop(ies)

| Version | Form | Held by | Last changed | Status |
|---|---|---|---|---|
| `b306b9d4` | agent | `agent-armory`/claude-plugins/expert-dev-tools/agents/expert-corrector.md | 2026-08-21 | **unique** |

#### `expert-diagnostician` — 1 version(s), 1 cop(ies)

| Version | Form | Held by | Last changed | Status |
|---|---|---|---|---|
| `03e05083` | agent | `agent-armory`/claude-plugins/expert-dev-tools/agents/expert-diagnostician.md | 2026-08-21 | **unique** |

#### `expert-plan-greenfield-portable` — 1 version(s), 1 cop(ies)

| Version | Form | Held by | Last changed | Status |
|---|---|---|---|---|
| `82482d34` | skill | `synced set` | — | **unique** |

#### `expert-planner` — 1 version(s), 1 cop(ies)

| Version | Form | Held by | Last changed | Status |
|---|---|---|---|---|
| `083aa916` | agent | `agent-armory`/claude-plugins/expert-dev-tools/agents/expert-planner.md | 2026-08-21 | **unique** |

#### `expert-reviewer` — 1 version(s), 1 cop(ies)

| Version | Form | Held by | Last changed | Status |
|---|---|---|---|---|
| `cb057856` | agent | `agent-armory`/claude-plugins/expert-dev-tools/agents/expert-reviewer.md | 2026-08-21 | **unique** |

#### `expert-spec-writer` — 1 version(s), 1 cop(ies)

| Version | Form | Held by | Last changed | Status |
|---|---|---|---|---|
| `86e1cb49` | agent | `agent-armory`/claude-plugins/expert-dev-tools/agents/expert-spec-writer.md | 2026-08-21 | **unique** |

#### `expert-standard.md` — 1 version(s), 1 cop(ies)

| Version | Form | Held by | Last changed | Status |
|---|---|---|---|---|
| `2a6f1d8d` | skill | `agent-armory`/gemini-extensions/agentboard/skills/expert-standard.md/SKILL.md | 2026-06-03 | **unique** |

#### `expert-tool-classifier` — 1 version(s), 1 cop(ies)

| Version | Form | Held by | Last changed | Status |
|---|---|---|---|---|
| `0c7a6fb1` | agent | `expert-standards-dev-package`/.claude/agents/expert-tool-classifier.md | 2026-04-27 | **unique** |

#### `expert-tool-substance-verifier` — 1 version(s), 1 cop(ies)

| Version | Form | Held by | Last changed | Status |
|---|---|---|---|---|
| `000f1e43` | agent | `expert-standards-dev-package`/.claude/agents/expert-tool-substance-verifier.md | 2026-05-04 | **unique** |

#### `expert-verifier` — 1 version(s), 1 cop(ies)

| Version | Form | Held by | Last changed | Status |
|---|---|---|---|---|
| `6ee6ec3a` | agent | `agent-armory`/claude-plugins/expert-dev-tools/agents/expert-verifier.md | 2026-08-21 | **unique** |

#### `full-cycle` — 1 version(s), 1 cop(ies)

| Version | Form | Held by | Last changed | Status |
|---|---|---|---|---|
| `16920495` | skill | `NOVA`/.claude/skills/full-cycle/SKILL.md | 2026-09-10 | **unique** |

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
No row exists yet for any other location, for any **command, agent, rule or role** form of any
skill, or for `expert-architecture`, `expert-architecture-portable`, `expert-correct`,
`expert-mcp-overhaul`, the greenfield variants, the subagent profiles, or `full-cycle`. **A skill or location with no row has not been traced — never read that as "never
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
