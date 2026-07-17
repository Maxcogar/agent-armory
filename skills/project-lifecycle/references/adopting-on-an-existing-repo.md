# Adopting this on an existing repo

The common case: a repo that already exists, was built without these phases, and carries none of the artifacts or evidence the methodology expects. The goal is to bring it into conformance — *not* to retroactively run six phases and *not* to rewrite. You assess where it stands, find the gaps, sequence them by risk, and backfill incrementally. This is the depth behind the four-move on-ramp in the SKILL.md.

This same path covers taking over an unfamiliar codebase, rescuing a broken one, and working out of phase order — they differ only in how bad the starting gaps are.

## The standards this path is built on

- **OWASP SAMM v2** — a maturity model whose cycle is exactly this work: assess current state against defined criteria, identify gaps against a target, prioritize improvements by risk, and build a phased roadmap. SAMM is explicit that not all gaps are equally urgent and that sequencing depends on which gap creates the most risk. (SAMM is already a governing standard of the methodology this skill applies.)
- **Feathers, *Working Effectively with Legacy Code*** — the discipline for changing existing code safely: characterization tests that capture current behavior before you touch it, and seams (places to alter behavior without editing in place) to get untestable code under test. Feathers' definition is worth holding onto: legacy code is code without tests.
- **ISO/IEC/IEEE 14764:2022** — each backfill is a controlled maintenance change (impact understood before, regression verified after).
- **Fowler's Strangler Fig** — for the gaps that require replacing or restructuring components: grow the new alongside the old and shift over piece by piece, keeping the system running, rather than a big-bang rewrite. Applies to the *replacement* gaps; backfilling a missing spec or test isn't a Strangler migration.
- **The verification axis** — applied to the whole repo: you cannot conform what you have not verified.

## Move 1 — Survey before you judge

Establish what's actually in the repo from current source, not from the README or assumption: structure and entry points, dependencies and their versions, build/test/CI setup, where config and secrets live, and what the code actually does at the level of its main flows. SAMM calls this measuring where you are now; it's also the verification axis at repo scale.

The output is a grounded current-state picture. Resist forming remediation opinions until it exists — a survey contaminated by "what we should change" stops being a measurement.

## Move 2 — Map the gaps against the six phases

For each phase, ask what artifact and evidence it requires and whether the repo has it, at standard. This is SAMM's gap analysis, with the six phases as the assessment dimensions:

- **Define** — is there a spec or grounded requirements, or does the code just exist with no statement of what must be true and why?
- **Design** — is there an architecture with justified decisions, or just structure that accreted? Are there documented decisions at all?
- **Build** — tests at coverage proportional to risk? CI? Any verification that library and contract usage is correct?
- **Verify** — has it been reviewed against named standards? Any security review against a threat model? Any evidence behind "it works"?
- **Operate** — monitoring, SLOs, runbooks, rollback procedures, or none?
- **Maintain** — dependency hygiene and advisory monitoring, current docs, tracked debt, or drift?

Record each gap with the evidence for it from the survey. Where the existing state actively violates a standard (not just "missing" but "wrong" — a broken auth model, an injection-prone query, a dependency under a known advisory), that's a **finding**, and it ranks above mere absence. An existing pattern that's wrong is a finding, not a reason to keep it.

## Move 3 — Prioritize by risk, not by phase order

You cannot backfill everything at once. Sequence the gaps and findings — this is SAMM's risk-based prioritization, and the temptation to "just start at Define and go forward" is the pattern-matching trap at the roadmap level. Weigh:

- **Active danger now** — a security finding, a dependency advisory, hot code under active change with no tests. These come first regardless of which phase they sit in.
- **Downstream leverage** — the upstream gap causing the most downstream pain. A missing or wrong spec can be why the architecture and tests are untrustworthy; closing it can unblock several later gaps.
- **Blast radius and effort** — what's cheap and safe to fix versus what needs a Strangler-style staged replacement.

The output is a phased roadmap (SAMM suggests phases of roughly three to six months in an org context; compress to the project's scale), each phase a small set of backfills with a stated reason for its place in the order.

## Move 4 — Backfill one slice at a time

Take the top item; open the governing phase's reference; produce its artifact and evidence; pass its gate; take the next. Two disciplines make this safe:

- **Every backfill is a Maintain-phase change** — impact understood before, regression verified after, docs updated in the same change (see `references/phase-maintain.md`).
- **Get behavior under test before you change or remove anything** — Feathers' characterization tests pin current behavior so a change that quietly alters it is caught. For code that resists testing, find a seam to get it under test first. This is what makes incremental backfill safe rather than hopeful.

For gaps that require replacing or restructuring a component, use the Strangler Fig pattern: stand up the new alongside the old behind a stable interface, shift functionality across incrementally, and decommission the old only once nothing depends on it — never a big-bang rewrite of a working system.

## What "done enough" means

Conformance is a direction, not a finish line, and the roadmap is the record of it. A repo is "in conformance" for practical purposes when its active-danger findings are closed, the phases it most depends on have their artifacts and evidence, and new work follows the phase model going forward — even if older corners are still being backfilled. Track what remains as debt rather than treating the repo as binary pass/fail.

## Output contract for the adoption effort itself

Because this effort is a deliverable, it carries the same proof obligations:

- The current-state survey, grounded in source.
- The gap map, each gap tied to the phase that governs it and the evidence from the survey; findings (active violations) separated from absences.
- The risk-based roadmap, each item with the reason for its priority — not a reflexive phase order.
- Per backfill: the phase's own output contract, plus impact analysis and regression verification.
- Gaps acknowledged — what wasn't surveyed, what couldn't be verified, what's deferred and why.
