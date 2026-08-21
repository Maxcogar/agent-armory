# Diagnosis — patching-instead-of-rederivation

**Signature** (defect-history.json, entry 5): "patching-instead-of-rederivation: corrections
applied as downstream patches rather than re-deriving from the causal artifact" — 2 occurrences,
2026-08-17, plugin 0.2.1, responsible component: expert-correct correction doctrine. State: open.

**Diagnosed**: 2026-08-20, against v0.3.0 working-tree source on branch `claude/edt-corrections-0.4.0`.

---

## 1. Failure mode, from evidence

**Owner-turn evidence.** Session transcript
`C:\Users\maxco\.claude\projects\C--Users-maxco-Documents-agent-armory\5071adeb-79e9-4b22-a2ab-fc4f5e03565a.jsonl`,
line 69 (owner turn):

> "im still not understanding this. hand maintaining would work if the agents actually made
> corrections properly instead of patching. is there not anything in place for correcting a plan?"

The feedback sweep that produced the signature (same transcript, line 1807) aggregated the
per-turn evidence from workflow run `wf_61b4beae-97b`'s journal and scored it a `systemic_defect`
with 2 occurrences. An earlier sweep pass (line 2086) phrased the same class as "corrections
applied as shallow local patches rather than re-deriving the section from sources" (there counted 3,
later consolidated to 2).

**The measured shape** (also recorded in
`claude-plugins/expert-dev-tools/skills/expert-correct/SKILL.md:15-25` as the doctrine's own
motivating history): a correction round edits the sentence the finding points at, the named
instance closes, and the finding's *class* resurfaces at a new location the following round. The
APS Fusion architecture cycle burned rounds 1–11 this way and still regressed at rounds 15, 16,
and 19. This is the class the repo's convergence tripwire ("two rounds of new >= closed means stop
patching") exists for.

**Critical dating fact.** The current mitigation — the expert-correct doctrine with the mandatory
class sweep, the `class_sweep` return contract, and `detectCorrectionFailure` in the workflow —
was introduced in commit `f01bded` (2026-08-09) and was **live in the 0.2.1 deployment when the
two occurrences were recorded on 2026-08-17** (per-occurrence `plugin_version: "0.2.1"`; the
0.2.1 remediation was merged and live-verified before the acceptance run). This defect is
therefore not "the doctrine is missing"; it is **the doctrine as prose discipline plus
self-reported compliance was already deployed and measured failing**. Any 0.4.0 correction that
adds more prose to the skill is repeating a falsified experiment.

## 2. Audit of current v0.3.0 enforcement — where a patch still slips through

What exists (verified by reading source, not assumed):

- `skills/expert-correct/SKILL.md` — forbids patching and re-authoring; mandates the five-step
  discipline; step 3 (class sweep) is named load-bearing; return contract requires
  `sections_rederived[].class_sweep.{searched, found}` with `found` including uncorrected sites
  (SKILL.md:92-100).
- `agents/expert-corrector.md` — `Write` withheld from the tool grant (line 6, 29-32) so wholesale
  re-authoring is structurally blocked; restates the return contract.
- `workflows/expert-lifecycle.js` — PHASE_SCHEMA requires `location` and `class_sweep` per entry
  (lines 118-137); `detectCorrectionFailure` (lines 317-345) fires `fix_site_regression`
  (next-round finding overlaps a re-derived location) and `unclosed_class` (next-round finding is
  a set member of a prior sweep's `found` that was not corrected); `runGate` runs the detectors at
  the three document gates from round 2 on (lines 374-378).
- `tests/structural/check-structure.mjs` — lifts and executes `runGate`/`detectCorrectionFailure`
  against constructed returns (T-22/T-23, lines 605-667).

Where the patch-shaped correction still gets through — each verified against the cited lines:

**Gap A — the sweep is asserted, never re-executed.** `class_sweep.searched` is free prose
(`S_STR`, expert-lifecycle.js:131) — not an executable pattern — so the workflow *cannot* re-run
the sweep even in principle, and it never tries: nothing between the correction return
(runGate line 379) and the next review round inspects the artifact. `found` completeness is
un-audited self-report. The skill itself concedes this: "Reporting `class_sweep.found` honestly …
is what makes step 3 auditable rather than asserted" (SKILL.md:98-99) — i.e. auditability rests
on the corrector's honesty **in exactly the dimension this defect is about**. A corrector that
patches one site and declares `found: [the fix site]` produces a return that is structurally
indistinguishable from a genuine single-instance class.

**Gap B — the narrow-sweep blind spot is pinned as intended behavior.** `unclosed_class` uses set
membership on the self-reported `found` (expert-lifecycle.js:336-343, comment at 312-314: "a
location the sweep never found is a NEW class, not an unclosed one, and must not fire").
Structural check T-22(c) (check-structure.mjs:654) *locks in* that a finding absent from `found`
fires neither detector. Correct for avoiding false positives — but it means the detector's power
is proportional to the honesty and breadth of the very report a patching corrector under-fills.
Under-report the sweep and the detector is disarmed by design.

**Gap C — detection is one round late and string-fragile.** Detectors run only at `round > 1`
(expert-lifecycle.js:374), so a patch is caught only if the *next* fresh reviewer independently
rediscovers the class, and only if its finding's `location` string exactly equals a `found` entry
(line 337 is string equality, unlike the parsed-overlap logic used for fix-site at 326-333).
Locations are line-number based and line numbers drift after the very edits the correction made —
so even an honest sweep's `found` entries rarely survive as exact strings. Each escaped patch
burns a review round; ROUND_CAP rounds of patch-churn end in NON_CONVERGENCE instead of an
immediate, attributable failure.

**Gap D — "sites changed" is inferred, not declared.** The corrected set is derived as the set of
`sections_rederived[].location` strings (line 318), so the found-vs-corrected comparison is a
string-identity join between two self-reported fields of the same return.

**Structural tooling already proves the fix is implementable.** The workflow runtime cannot
execute searches itself, but `documentScopeCheck` (expert-lifecycle.js:833+) established the
pattern: dispatch the verifier agent to *execute* a mechanical check (there: SHA-256 hashing) and
have the workflow compare results; and the structural tier's lift-and-EXECUTE mechanism
(check-structure.mjs T-22/T-23/T-24x, groundTruthPreconditions comment at
expert-lifecycle.js:801-804) runs extracted pure predicates against constructed shapes.

## 3. Root cause

The class sweep — the load-bearing half of the correction doctrine — is enforced only as a
self-reported declaration in the corrector's return: `searched` is prose the workflow cannot
execute, `found` is never checked against the artifact, and both detectors are keyed off that
same self-report one round later. So the control against patching is the patching agent's own
honesty about having patched, and the two 2026-08-17 occurrences happened *with this control
deployed*.

## 4. Correction draft — classification: **machine_applicable**

Make the sweep declaration machine-checkable and re-execute it in the same round, mirroring the
existing documentScopeCheck / lift-and-evaluate patterns.

**C1 — executable sweep declaration (schema + contracts).**
Extend `class_sweep` in PHASE_SCHEMA (expert-lifecycle.js:127-134) with three new required
fields alongside `searched`/`found`:
- `pattern` — the executable regex the sweep ran (Grep syntax),
- `scope` — the file or glob it ran over (normally the artifact path),
- `sites_changed` — the locations actually edited for this class (subset of `found`).
Update the return contracts in `skills/expert-correct/SKILL.md` (§ structured return) and
`agents/expert-corrector.md` to require them, with the rule: *executing `pattern` over `scope`
must reproduce `found`; a `found` entry outside `sites_changed` is either an escalated
hand-maintained-surface item (the existing SKILL.md § "When the class cannot be closed" path,
named in the entry) or an explicit open item.*

**C2 — same-round sweep re-execution in runGate.**
After each `remediateFn` return at the document gates (expert-lifecycle.js:379-386), dispatch the
verifier agent (`AGENT.verifier`, VERIFIER_SCHEMA — the spot-rerun mechanism at line 684) with
every declared `pattern`+`scope`: "execute this search against the current artifact; report every
hit as a location in the LOCATION grammar." Compare via a new **pure named function**
`sweepDiscrepancy(declared, reExecutedHits)` (extracted top-level, like
`groundTruthPreconditions`, so the structural tier can lift and execute it):
- any re-executed hit absent from declared `found` ⇒ return
  `{ kind: 'sweep_underreported', missed: [...] }` — runGate converts this to an immediate
  `CORRECTION_FAILED` gate in the *same* round, carrying the missed locations, instead of
  waiting for the next reviewer to stumble on them;
- any `found` entry outside `sites_changed` with no escalation/open-item designation ⇒
  `{ kind: 'found_left_silently_open', sites: [...] }`, same routing.

**C3 — arm the next-round detector with re-executed hits.**
`detectCorrectionFailure`'s `unclosed_class` membership test (line 337) checks the union of
declared `found` and the verifier's re-executed hit set (carried in `lastRederived` alongside the
declaration). This closes Gap B's blind spot: a narrow self-report no longer shrinks the
detector's domain, because the domain now comes from an independent execution of the pattern.

**Why this removes the root cause.** The sweep stops being an honesty claim and becomes a
reproducible computation: the corrector must hand over the search itself, the workflow re-runs it
through an agent that did not perform the correction, and both the completeness of `found` and
the disposition of every found-but-unchanged site are checked mechanically in the same round. A
patch with a token sweep now fails at the gate that dispatched it, attributably, instead of
surfacing as next round's "new" findings.

**Honest residue (bounded, not hidden).** A corrector could still author a *semantically* narrow
`pattern` that faithfully reproduces its own narrow `found`. That residue is real and is not
prose-fixable; it is bounded by (a) the fresh next-round reviewer, whose findings now hit an
independently-executed union set (C3), and (b) the unchanged fix-site-regression detector. The
correction shrinks the escape path from "under-report anything" to "craft a self-consistent
narrow regex that also survives an independent reviewer" — the same residual-trust posture the
verifier's spot-rerun already accepts.

## 5. Verification

Structural tier (`tests/structural/check-structure.mjs`), same lift-and-EXECUTE mechanism as
T-22/T-23:

1. **T-sweep-a**: lift `sweepDiscrepancy`; constructed declaration with `found: [A]`,
   re-executed hits `[A, B]` ⇒ observes `sweep_underreported` with `missed: [B]`.
2. **T-sweep-b**: `found: [A, B]`, `sites_changed: [A]`, B neither escalated nor marked open ⇒
   observes `found_left_silently_open`; with B escalated ⇒ no fire.
3. **T-sweep-c**: honest complete sweep (`found` == re-executed hits, all changed or escalated)
   ⇒ null; runGate (lifted) proceeds to the next round — no false positive.
4. **T-sweep-d**: lift runGate with a stubbed verifier returning an extra hit ⇒ observes the
   same-round `CORRECTION_FAILED` return (not round+1).
5. **Schema pin**: PHASE_SCHEMA's `class_sweep.required` includes `pattern`, `scope`,
   `sites_changed` — read from the lifted schema literal, not lexed from source text.
6. **Contract-text pin**: SKILL.md and expert-corrector.md name all five class_sweep fields
   (existing doc-consistency check style).

Behavioral tier: one corrections-gate run in which a deliberately patch-shaped corrector return
(narrow `found`, valid pattern) is injected and the gate is observed failing in the same round —
owner-gated, as with prior behavioral-tier items.
