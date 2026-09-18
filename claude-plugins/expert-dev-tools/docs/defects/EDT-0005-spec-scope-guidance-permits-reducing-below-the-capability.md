---
id: EDT-0005
title: Spec scope guidance permits reducing below the capability envelope the owner stated
state: open
severity: serious
component: skills/expert-spec/SKILL.md scope guidance
found_in_version: 0.4.1
found_by: run wf_edb6f323-e2c against Maxcogar/NOVA, 2026-08-27, plugin 0.4.1 (recurred across five owner rejections)
fixed_in: null
---

# EDT-0005 — Spec scope guidance permits reducing below the capability envelope the owner stated

## What happens

`skills/expert-spec/SKILL.md:75-79` offers "bound that part out of scope explicitly, so the
spec is complete for what remains" as one of three honest responses, with no bar against
reducing below the owner's stated envelope. `:211` asks "What is in scope and what is out?
Out-of-scope items stated explicitly with reasoning" — treating exclusion as a formatting
requirement rather than a gated act.

The spec dispatch does deliver the owner's words (`expert-lifecycle.js:686-689` wraps
`task_verbatim` in `<<<OWNER_REQUEST>>>` and labels it authoritative), and the phase
fail-closes on their ABSENCE (`:681-684`). There is no control on the spec being NARROWER
than those words.

## Impact

Affects every project running the plugin, not one repo. Observed: a spec was narrowed and
the narrowing justified from a downstream sequencing document, rejected by the owner twice
in one session and on three prior attempts. The owner's stated cost is that dropped scope is
never rebuilt.

## Correction named by the diagnostician

"Bound that part out of scope explicitly" is available for information the spec cannot
obtain, and is NOT available for capability the owner's request names. A proposed exclusion
that removes something present in the owner's request is a stop-and-ask, not an authoring
decision.

## Note on scope

The project-side half of this diagnosis targets NOVA's own CLAUDE.md and roadmap and is not
this plugin's to fix. Only the skill-side half is recorded here.
