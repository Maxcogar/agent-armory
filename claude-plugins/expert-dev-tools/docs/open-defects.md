# Open defects — expert-dev-tools

> **This file is the standing list of defects that are found and NOT yet fixed.**
> It is not a record of a finished effort. Nothing here is closed unless its entry
> says so and names the commit that closed it.
>
> Why this file exists: every other document under `docs/` is a frozen record of a
> completed effort. `investigate.md` and `behavioral-tier-findings.md` both state in
> their own banners that they are not rewritten to describe current code, and
> `docs/diagnostics/corrections-<version>/` folders hold the diagnosis sets of
> corrections cycles that shipped. Code defects used to land as numbered sections in
> `investigate.md`; it was frozen on 2026-08-09 and nothing replaced it, so a defect
> found after that date had nowhere to go.
>
> **Adding an entry:** number it, state whether each part is fixed or open, and name
> the commit for anything closed. Do not add entries to a corrections-cycle folder —
> those record cycles that already shipped.
>
> **Fixing an entry:** through this plugin's own correction process — diagnosis,
> remediation plan, review rounds, implementation, version bump, commit, signature
> marked corrected. Not by hand-editing the workflow.

---

## 1. escalation-path-crash — the spec gate cannot report a correction failure

**Status: OPEN.** Both parts below are unfixed in this repository.

**Not a defect-store signature.** The files in `docs/diagnostics/corrections-0.4.0/`
each diagnose a behavioral signature swept from
`~/.claude/plugins/data/expert-dev-tools/defect-history.json`. This one has no store
entry because no sweep produced it — a crash did. It is a code defect in
`workflows/expert-lifecycle.js`, plus an adjacent design defect in the same function.

**Found:** 2026-08-27, plugin version **0.4.1**, registry-recorded commit
`fc745464ef7b62997fdde243c491b2903d7e8cc8`, during a live reconciliation run in
`Maxcogar/NOVA` (run `wf_edb6f323-e2c`).

### 1.1 `CORRECTION_FAILED_TEXT` is read in its temporal dead zone

```
Error: Cannot access 'CORRECTION_FAILED_TEXT' before initialization.
    at gateEscalation (workflow.js:1042:96)
    at <anonymous> (workflow.js:700:98)
```

`CORRECTION_FAILED_TEXT` is declared as a `const` at
`workflows/expert-lifecycle.js:1046`. `gateEscalation` is a **hoisted function
declaration** that reads it while building its message string. The workflow's main
flow `return`s from the spec gate around **line 700**, so execution never reaches
line 1046 and the binding is still uninitialised when the function runs.

**Reachability.** Every `CORRECTION_FAILED` verdict `runGate` can produce routes
through `gateEscalation` — both the `detectCorrectionFailure` path and all four
`sweepDiscrepancy` kinds. So does `NON_CONVERGENCE`. All three document gates call it.

**Effect.** The lifecycle completes only when an artifact passes review cleanly. The
moment a gate has something to report to the owner, it throws instead of reporting
it — a silent failure in the one path whose whole purpose is to speak up.

**It also preempts the diagnostician.** In `gateEscalation`, `what` is built before
the diagnostician is dispatched, so a failed run produces no root cause and no
correction draft. Same loss `investigate.md` §7 records for the starved dispatch,
by a different route.

**Shape of the fix.** Hoist the declaration to the constants block at the top of the
file, beside `GATE`, `RULER` and `LENSES`. Declaration order only; the object and its
four values are unchanged. Note for whoever implements it: `T-12` counts `diagnose(`
occurrences in raw source, so an explanatory comment containing the literal text
`diagnose()` will be counted as a zero-argument call site and fail the tier.

### 1.2 A correction failure is routed to the owner, not back to the corrector

On `CORRECTION_FAILED`, `gateEscalation` builds a `GATE.non_convergence` carrying
`options: ['amend the artifact', 'revisit upstream']` and stops for the owner.

All four cases in `CORRECTION_FAILED_TEXT` describe **the corrector doing its job
badly**:

| kind | meaning |
|---|---|
| `fix_site_regression` | a correction broke the section it edited |
| `unclosed_class` | closed the named instance, same standard violated elsewhere |
| `sweep_underreported` | the re-executed sweep returned sites the correction did not report |
| `found_left_silently_open` | found class sites it neither changed, escalated, nor declared open |

None of those is an owner decision. **Owner ruling, 2026-08-27:**

> there is literally zero reson to stop and ask me anything. they jsut didnt make the
> corrections right, so obvioously the only trhing ill ever say to that is to make the
> fucking correction right. that is the ONLY acceptable outcome.

and, when told the escalation would instead reach the agent:

> IT DOESNT HAVE TO GO TO ANYBODY!!! THEY JSUT NEED TO FUCKING FIX IT!!! WHAT TEH FUCK
> ELSE WOULD THEY DO????

**The same file already does this correctly one phase over.** The implement phase
diagnoses first, then auto-amends the plan and re-runs, escalating only for categories
that genuinely need the owner. The spec, architecture and plan gates diagnose and
escalate unconditionally — the same four-gate asymmetry `investigate.md` §5c records
for the ruler.

**Constraint for whoever implements it.** `runGate` returning `CORRECTION_FAILED` is a
tested contract: `T-22 (a)`, `T-22 (b)`, both `T-22` boundary cases, `T-27 exec (d)`
and `T-27 exec C3` all assert it returns and exits. The detection is correct and stays.
What changes is what the caller does with the verdict.

---

## 2. sweepDiscrepancy compares location strings, not sites

**Status: OPEN.** Blocks correction rounds today.

**Found:** 2026-08-27, run `wf_edb6f323-e2c`, by this plugin's own diagnostician,
classified `owner_owned`.

### 2.1 The false positive, from evidence

A corrector declared its class-sweep hits as:

```
docs/specs/...:271, :321, :367, :427, :464
```

The independent verifier re-executed the same pattern and reported:

```
docs/specs/...:271-271, :321-321, :367-367, :427-427, :464-464
```

Identical lines, different rendering. `sweepDiscrepancy` (`expert-lifecycle.js:430-435`)
computes `missed` via `!foundSet.has(h)` — raw string equality — so all five counted as
missed and the gate failed a correction that was actually complete.

### 2.2 The inconsistency is internal to the file

- `detectCorrectionFailure` (`:396-402`) compares the **same** location strings
  **structurally**, via `parseLocation`. Only `sweepDiscrepancy` compares them
  **lexically**. Same file, same data, two comparison semantics.
- `parseLocation` (`:364-373`) already normalises `path:N` to `{start:N, end:N}` — the
  codebase treats the two renderings as one site everywhere except here.
- `LOCATION_RE` (`:101`) admits both forms, and neither the verifier prompt (`:1212`)
  nor the corrector prompts (`:723`, `:755`, `:779`) specify a canonical rendering.

### 2.3 Second half — no honest disposition for a non-member hit

When a pattern legitimately over-matches, the corrector has no way to say "this hit is
not an instance of the class." Observed in the same run: the searched phrase appeared
inside verbatim quotations *of the MCP specification*, and inside required §5a
traceability lines that a prior finding demanded be present. Editing them out would
reintroduce a closed Serious finding; omitting them fails the gate.
`skills/expert-correct/SKILL.md:96-103` offers only "changed" or "explicitly open" —
no "not an instance of this class."

The contract forces a choice between a false confession and an omission that fails the
gate. The gate then fires on the **shape of the report** rather than the
**completeness of the sweep**.

### 2.4 Perverse incentive

Because `missed` is the only discriminator, a corrector that narrows its `pattern` to
its own fix sites passes cleanly — which is precisely the patching failure this control
exists to catch.

### 2.5 Blast radius

`reExecuteSweeps` / `sweepDiscrepancy` gate every correction round of all three review
gates — spec (`:726`), architecture (`:758`), plan (`:782`) — in every project running
0.4.1. Any correction whose findings name multi-line ranges, or whose class is semantic
enough that its regex over-matches, can be failed on report shape.

### 2.6 Correction draft — from the diagnostician, not yet applied

Two changes, both required; neither alone closes the cause.

**(A) Compare sites, not strings.** In `sweepDiscrepancy`, run every declared
`found` / `sites_changed` / `open_sites.location` entry and every re-executed hit
through the existing `parseLocation`, and define `missed` as a re-executed site **not
covered** by any declared site: same file, and for ranges the hit's line contained in a
declared `[start,end]`, or for sections an equal section identifier. A hit whose
location fails `parseLocation` stays a hard fault — malformed, not merely differently
rendered. Tighten the verifier prompt at `:1212` to emit exactly one entry per matching
line as `path:N`, and state in `SKILL.md`'s `found` bullet that a declared range covers
every line inside it. Add a `T-27` case asserting `found: ['spec.md:19-20']` against
reHits `['spec.md:19','spec.md:20']` yields **no** discrepancy, and keep the existing
case asserting a genuinely uncovered hit still yields `sweep_underreported`.

**(B) Give a non-member hit an honest name.** Add a third `open_sites` designation
kind — `not_in_class`, requiring a one-line justification — and state in
`SKILL.md:100-103` and the three corrector prompts that a pattern hit which is not an
instance of the finding's class is **declared** in `found` and designated
`not_in_class` with its reason, never omitted. Leave `found_left_silently_open` firing
for any `found` entry that is neither changed nor designated, so the disposition is an
accounting requirement, not an exemption.

**Note from the diagnostician:** fixing this does **not** clear the round it failed.
Once the control discriminates, that correction must be re-run and re-adjudicated on
its merits.

---

## Provenance note

Both defects were found while running the lifecycle against `Maxcogar/NOVA`. A
hand-written fix for §1.1 was briefly opened as a PR against this repository and then
withdrawn unmerged, on the owner's ruling that corrections to this plugin go through
its own remediation process rather than ad-hoc edits. Nothing from that attempt is in
this repository's history. This file records the defects only; the fixes are the
remediation cycle's to produce.
