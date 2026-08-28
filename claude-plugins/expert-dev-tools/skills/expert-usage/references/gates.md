# The seven owner gates

The owner is interrupted for exactly these and nothing else. The list is the spec's
§3.4 escalation policy; it is exhaustive by design, and a stop that fits none of them is
a defect in the workflow, not a new category.

Every gate except `intent` and `core_approval` arrives already diagnosed: the workflow
runs a diagnostician before escalating, so the gate carries a root cause and usually a
drafted correction. Present that diagnosis. An owner asked to research a bare problem
report has been handed the workflow's job.

## 1. `intent`

**What it is.** The spec passed independent review. The owner confirms it says what they
meant before design begins.

**What the answer decides.** Whether the lifecycle proceeds from this spec. The gate
carries the owner's verbatim request and the spec's Request-traceability section, which
maps each clause of that request to the requirements covering it.

**Fires once per lifecycle.**

## 2. `spec_traceable`

**What it is.** A downstream contradiction, ambiguity, gap, or unsettled trade-off that
traces back to the spec. Machine resolution is forbidden — resolving it would be
inventing intent the spec never carried.

**What the answer decides.** Which reading of the spec is correct, or that the spec
needs amending.

**Present the diagnosis, not the symptom.** These gates carry one.

## 3. `business`

**What it is.** A genuine business trade-off — spend, scope, or a product choice with
several defensible answers.

**What the answer decides.** The trade-off. There is no correct answer to compute.

## 4. `risk_override`

**What it is.** An implementation STOP where amending the plan is not viable, and the
only way forward is accepting a risk.

**What the answer decides.** Whether to accept the risk, repair the environment, or
abort. Standing policy: STOP reports route to plan-amendment automatically, and an
override is never chosen by the machine.

## 5. `non_convergence`

**What it is.** A review loop hit its round cap, or amendment propagation started
cycling. The convergence tripwire also fires here: two consecutive rounds where new plus
regressed findings meet or exceed closed ones, or where the total stops strictly
decreasing.

**What the answer decides.** Whether to keep correcting or step back to the causal
artifact. A tripwire firing means further correction rounds are expected to make the
artifact worse, not better — treat "run another round" as the answer that needs
justifying.

## 6. `core_approval`

**What it is.** A CORE ingestion message drafted at closeout.

**What the answer decides.** Whether it is ingested. Present the exact payload and wait
for explicit approval. Never ingest without it — no exceptions.

## 7. `control_fault`

**What it is.** A mechanical control could not run, or returned less than it was asked
to check. The phase is **unverified** — not failed, and not non-convergent. Nothing
traces to spec intent and no review loop reached a cap.

**What the answer decides.** Usually nothing. Re-running the phase is the stated answer
in most of these, and the gate's own recommendation normally says so.

**Read this one carefully before presenting it.** A `control_fault` whose recommendation
is "re-run" is the workflow asking permission to retry something it already decided to
do. If a re-run has not been tried, that is the answer. Reserve the owner's attention
for a control that fails the same way twice — the second identical failure is
information; the first is a retry.

## Answering a gate

Resume with `/expert resume`. The answer is applied to the ledger and the lifecycle
continues from where it stopped; finished phases do not re-run.

An answer that is not one of the offered options is fine — the options are the
workflow's reading of the situation, not a closed set. What is never fine is choosing
on the owner's behalf to keep things moving. The gate exists because the workflow
determined it could not decide.
