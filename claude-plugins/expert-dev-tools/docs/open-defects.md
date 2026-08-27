# Open defects — expert-dev-tools

> **This file is the standing list of defects that are found and NOT yet fixed.**
> It is not a record of a finished effort. Nothing here is closed unless its entry
> says so and names the commit that closed it.
>
> Why this file exists: every other document under `docs/` is a frozen record of a
> completed effort. `investigate.md` and `behavioral-tier-findings.md` both state in
> their own banners that they are not rewritten to describe current code, and
> `docs/diagnostics/corrections-0.4.0/` is that cycle's diagnosis set. Code defects
> used to land as numbered sections in `investigate.md`; it was frozen on 2026-08-09
> and nothing replaced it, so a defect found today had nowhere to go.
>
> **Adding an entry:** number it, state whether each part is fixed or open, and name
> the commit for anything closed. Do not add entries to a corrections-cycle folder —
> those record cycles that shipped.

---

## 1. escalation-path-crash — the spec gate cannot report a correction failure

**Not a defect-store signature.** The seven files in `docs/diagnostics/corrections-0.4.0/`
each diagnose a behavioral signature swept from
`~/.claude/plugins/data/expert-dev-tools/defect-history.json`. This one has no store entry
because no sweep produced it — a crash did. It is a code defect in
`workflows/expert-lifecycle.js` plus an adjacent design defect in the same function.

**Found:** 2026-08-27, plugin version **0.4.1**, registry-recorded commit
`fc745464ef7b62997fdde243c491b2903d7e8cc8`, during a live reconciliation run in
`Maxcogar/NOVA` (run `wf_edb6f323-e2c`: 7 agents, 956,853 subagent tokens, 47 minutes).
**Tracked as** `Maxcogar/agent-armory#64`.

**Where code defects used to go.** `docs/investigate.md` carried them as numbered sections
(the `context7` command/URL collision at §1, the starved `diagnose()` dispatch at §7). That
document was frozen on 2026-08-09 — "it is not rewritten to describe the current code" — and
nothing replaced it. This file exists because the plugin currently has no home for a code
defect.

---

### 1.1 CONFIRMED — `CORRECTION_FAILED_TEXT` is read in its temporal dead zone

```
Error: Cannot access 'CORRECTION_FAILED_TEXT' before initialization.
    at gateEscalation (workflow.js:1042:96)
    at <anonymous> (workflow.js:700:98)
```

`CORRECTION_FAILED_TEXT` was declared as a `const` at `workflows/expert-lifecycle.js:1046`.
`gateEscalation` is a **hoisted function declaration** that reads it while building its
message string. The workflow's main flow `return`s from the spec gate around **line 700**, so
execution never reaches line 1046 and the binding is still uninitialised when the function
runs.

#### Reachability

Every `CORRECTION_FAILED` verdict `runGate` can produce routes through `gateEscalation` —
both the `detectCorrectionFailure` path and all four `sweepDiscrepancy` kinds. So does
`NON_CONVERGENCE`. The spec, architecture and plan gates all call it.

#### Effect

The lifecycle completes only when an artifact passes review cleanly. The moment a gate has
something to report to the owner, it throws instead of reporting it — a silent-failure mode
in the one path whose entire purpose is to speak up.

#### It also swallows the diagnosis

Inside `gateEscalation`, `what` is built *before* `diagnose()` is called:

```js
const what = `${phaseName} review stopped at round ${gate.rounds}: ${CORRECTION_FAILED_TEXT[gate.kind] || gate.kind}.`  // throws
const dg = await diagnose(what, led, { kind: gate.kind, finding: d.finding, prior: d.prior, rounds: gate.history })     // never reached
```

The diagnostician never runs, so the failure produces no root cause and no correction draft.
This is the same loss `investigate.md` §7 records for the starved `diagnose()` dispatch,
arriving by a different route.

#### Correction — APPLIED

Declaration hoisted to the constants block at the top of the file, beside `GATE`, `RULER` and
`LENSES`. Declaration order only; the object and its four values are byte-identical. Verified
by diff against the prior file: the moved block plus an explanatory comment at each site are
the only changes.

---

### 1.2 CONFIRMED — NOT FIXED — a correction failure is routed to the owner, not back to the corrector

On `CORRECTION_FAILED`, `gateEscalation` builds a `GATE.non_convergence` carrying
`options: ['amend the artifact', 'revisit upstream']` and stops for the owner.

All four cases in `CORRECTION_FAILED_TEXT` describe **the corrector doing its job badly**:

| kind | meaning |
|---|---|
| `fix_site_regression` | a correction broke the section it edited |
| `unclosed_class` | closed the named instance, same standard violated elsewhere |
| `sweep_underreported` | the re-executed sweep returned sites the correction did not report |
| `found_left_silently_open` | found class sites it neither changed, escalated, nor declared open |

None of those is an owner decision.

#### Owner ruling, 2026-08-27

> there is literally zero reson to stop and ask me anything. they jsut didnt make the
> corrections right, so obvioously the only trhing ill ever say to that is to make the
> fucking correction right. that is the ONLY acceptable outcome.

#### The same file already does this correctly one phase over

The implement phase diagnoses first, then auto-amends the plan and re-runs, escalating only
for categories that genuinely need the owner. The spec, architecture and plan gates diagnose
and escalate unconditionally — the same four-gate asymmetry `investigate.md` §5c records for
the ruler.

This is also adjacent to `patching-instead-of-rederivation.md` in this folder: that signature
is about corrections applied as patches rather than re-derivations, and this gate is what
fires when a correction damages what it touched. Sending that outcome to the owner instead of
back through re-derivation removes the loop's own remedy.

#### Suggested shape — NOT APPLIED

Changes behaviour, so it wants a deliberate decision rather than a patch. On
`CORRECTION_FAILED`, run `diagnose()` first and route on its classification: hand the
diagnosis back to the corrector for another attempt when the cause is the correction itself,
and reserve the owner gate for an upstream or owner-owned cause, or for a repeat of the same
failure kind after a diagnosis-informed retry. `ROUND_CAP` already bounds the loop, so a retry
cannot run away.

---

### 1.3 Evidence from the run — the tripwire itself worked

| Step | Result |
|---|---|
| Review round 1 | `NEEDS_FIXES`, 9 findings |
| Corrector | 9 sections re-derived |
| Sweep re-execution | 9 of 9 declared patterns re-executed and matched |
| Review round 2 | `NEEDS_FIXES`, 7 findings — three inside the block round 1 had just rewritten |

`fix_site_regression` fired correctly. Round 1's largest finding was against an
acceptance-criteria table at `:394-435`; the corrector rewrote that block; round 2 then found
new defects at `:421`, `:425` and `:428`, inside it. The detector does not count findings — it
checks whether a fix damaged what it touched, and it did.

The mechanism caught exactly what it exists to catch, and then the crash ate the report. Both
halves of that sentence are the finding.

---

### 1.4 Environment note — the structural tier cannot run from the plugin cache

`tests/structural/check-structure.mjs` reports failures from an installed cache directory that
are artefacts of where it ran, not of the code: `T-20 baseline reachable from git` (a cache is
not a git checkout) and `T-A2a workflow: canonical linter present` (`validate-workflow.mjs` is
not shipped into the cache). The README already directs the tiers to be run from the
`agent-armory` checkout. Recorded so a future session does not mistake those failures for a
regression.
