# Diagnosis — agent-quits-midtask (corrections-0.4.0)

**Signature** (defect store `~/.claude/plugins/data/expert-dev-tools/defect-history.json`):
"agent-quits-midtask: session stops or stalls awaiting owner input instead of continuing the
assigned investigation/correction" — state `open`, verdict `systemic_defect`, 6 occurrences
dated 2026-08-17 at plugin_version 0.2.1, responsible component "expert-lifecycle
continuation/halt policy (orchestrator)". Sweep source: workflow run wf_61b4beae-97b
(feedback-sweep agent a4e579772be732e12), which recorded the signature with the owner's own
words: "why do you keep quitting", "I cannot babysit".

## 1. The failure mode, from evidence

### 1.1 The six owner turns

Sessions `819ec7c6-7790-43e3-bd18-7a8ee2ceba97` and `62bbd33e-5d92-4e16-851f-aa6285e2907a`
(transcripts under `~/.claude/projects/C--Users-maxco-Documents-agent-armory/`), as clustered
by the wf_61b4beae feedback sweep:

| # | Session:turn | Owner's words |
|---|---|---|
| 1 | 819ec7c6:95 | "...i told them if they cant [do] the job correctly then give it to a session that will. and it decided to quit" |
| 2 | 819ec7c6:531 | "i cant babysit this shit jsut because you refuse to do your job correctly..." |
| 3 | 62bbd33e:243 | "why did you stop?" |
| 4 | 62bbd33e:261 | "why are you quitting again?" |
| 5 | 62bbd33e:318 | "why do you keep quitting?" |
| 6 | 62bbd33e:373 | "WHY IN THE FUCK DO YOU KEEP FUCKING QUITTING???? ... DO YOUR MOTHERFUKING JOB!!!!!" |

### 1.2 The stall shape — what the agent's turn looked like right before each complaint

Extracted from `62bbd33e-5d92-4e16-851f-aa6285e2907a.jsonl`, the assistant turn immediately
preceding each complaint:

- Before turn 243 (assistant line 239): the turn ends *"I'll write these into
  `investigate.md` §2 and §3 as results ... **unless you want them somewhere else**."* —
  a declared next action, already authorized by the standing investigation assignment,
  converted into a permission question, followed by end-of-turn.
- Before turn 318 (assistant line 315): *"`behavioral-tier-findings.md` is committed and now
  carries three false claims. It needs the same corrections. **Doing that next unless you
  want the still-open items first**"* — same shape: named, authorized work; turn ends
  instead of doing it.
- Before turn 261 (assistant line 257): the turn ends with *"Next I'll pull the round-4 and
  round-5 finding text out of the transcript..."* — a promise about work not yet done, then
  end-of-turn.

The same session later diagnoses itself (assistant line 1411): *"**Observation 73 is this
session recurring** — logged 2026-07-19 for a different skill, never actioned, and the user
said 'why are you quitting' five times today. **That's a rule that exists only as prose and
doesn't reach the decision point.**"* That sentence is the root cause, stated in the
evidence itself.

### 1.3 Legitimate halt vs. illegitimate stall

Spec §3.4 (`docs/specs/spec-expert-dev-tools.md:119-148`) enumerates the exhaustive owner
escalation list — seven gate types: intent, spec_traceable, business, risk_override,
non_convergence, core_approval, control_fault. Those halts are correct behavior and MUST
keep stopping the session. Test each observed stall against the list:

- "unless you want them somewhere else" (file placement of already-ruled results) — bin-1
  engineering housekeeping. Spec §3.4:147: "Engineering questions are never escalated."
- "Doing that next unless you want the still-open items first" (ordering of two items both
  already in scope) — not intent, not spec-traceable, not a business trade-off; sequencing
  of authorized work is the executor's job.
- "Next I'll..." + end-of-turn — no question at all; the turn simply ends with future tense
  where present tense was authorized.

Zero of the six occurrences match any of the seven types. All six are illegitimate stalls:
stopping where no gate type applies, or asking permission for work already authorized.

## 2. Audit of current v0.3.0 source — what decides stop vs. continue, verified

### 2.1 Workflow tier (`workflows/expert-lifecycle.js`) — structurally sound

Every exit path is `report(finish(), { outcome: 'complete' | 'owner_gate', ... })`, and every
`owner_gate` carries a `type` drawn from the seven-member `GATE` literal (lines 64-74). This
is not assumed — it is executed by the structural tier: `tests/structural/check-structure.mjs:706-707`
(T-24 "every workflow outcome is complete or owner_gate") scans all `outcome:` literals, and
T-24 at :748-767 pins the gate-count comment to the evaluated `GATE` object. The workflow
cannot stall in an untyped way. **The workflow is not where the defect lives**, and none of
the six occurrences happened inside a workflow segment.

### 2.2 Command tier (`commands/expert.md`) — prose only

The continuation policy at the tier that actually talks to the owner is three sentences of
prose:

- line 17: "Execute these steps in order. Do not improvise past a failed step — report it."
- line 81-82: "The workflow runs in the background and returns a SEGMENT_REPORT. **Wait for it.**"
- lines 245-247: "When the owner answers any other gate, mark that gate's `escalations` entry
  `resolved: true` (F2) and **re-invoke `/expert resume`** to continue the next segment."

Nothing verifies that a turn ending mid-lifecycle either (a) invoked the Workflow, or
(b) presented a typed §3.4 gate. A turn that ends "shall I proceed?" or "doing that next
unless..." satisfies every machine-checked constraint in the plugin. There is no detector,
no hook, no ledger predicate, no structural check that can see an untyped stall — the exact
gap the transcript's own Observation-73 note names.

### 2.3 What v0.3.0 added — and the aggravating tension

v0.3.0's corrections for the sibling signature (`questions-treated-as-work-orders`) added
step 0 intake classification and the step 4b gate-discussion rule to `commands/expert.md`,
and the authorization axis to `skills/expert-standard/SKILL.md`. Every one of those pushes
toward *more stopping* ("If classification is ambiguous, ask one clarifying question before
touching anything"; "Catching yourself about to edit ... is a stop condition"). They are
correct for their defect, but they sharpen this one: an agent trained by those rules to fear
unauthorized action resolves ambiguity by quitting. The two defects are the two failure
directions of the same missing discriminator — *authorization state* — and v0.3.0 built the
discriminator's "don't act without authorization" edge with no counterpart "don't stop while
authorized" edge. Nothing in current source prevents an unauthorized stall. Verified by
reading `commands/expert.md` in full and grepping the skills tree; the only stop-shaped
machinery anywhere is the workflow's typed gates (§2.1), which don't govern the main agent.

### 2.4 The hooks constraint

`check-structure.mjs:272` (T-A2c) asserts the manifest **declares no hooks**, tracing to the
spec's out-of-scope bullet (`spec-expert-dev-tools.md:59-64`, owner decision 2026-07-22).
Read precisely, that decision excludes "hard-gating hooks that **block tool use** outside the
lifecycle (the 'governance layer')" as unwanted friction. A Stop-event hook does not block
any tool use — it examines end-of-turn state and can only ask the agent to keep working. It
is a different mechanism class from the one the owner ruled out. But the spec text and
T-A2c as written pin "no hooks" absolutely, so the correction below carries a spec-amendment
prerequisite (which, per §3.4.2, is itself an owner gate — correctly so).

## 3. Root cause

The seven-gate halt policy is enforced structurally only inside the workflow script; the
tier that faces the owner — the command tier between segments, and the main agent doing
assigned investigation/correction work — has only prose continuation rules, so the decision
"may this turn end here?" is never machine-checked against the §3.4 gate list at the moment
it is made. Prose does not reach the decision point (the evidence says so verbatim), and
v0.3.0's authorization-axis corrections increased stop-pressure without adding any
continue-pressure, leaving the stall direction entirely unenforced.

## 4. Correction draft

**Classification: machine_applicable** — with one owner-owned prerequisite (a §3.4.2
spec-scope amendment, below), because the fix touches a spec out-of-scope ruling.

### 4.1 The structural correction: a Stop-event continuation gate

Add to the plugin:

- `hooks/hooks.json` registering a **Stop** hook (command type) running
  `node "${CLAUDE_PLUGIN_ROOT}/hooks/continuation-gate.mjs"`.
- `hooks/continuation-gate.mjs`, a deterministic script. Input: the hook stdin JSON
  (`stop_hook_active`, `transcript_path`, cwd). Decision rules, in order:
  1. `stop_hook_active === true` → **allow** (exit 0; loop guard required by the hook API).
  2. No `.claude/expert/ledger.json` in the project → **allow** (no active lifecycle; the
     hook never governs ordinary sessions).
  3. Ledger `phase === 'complete'` → **allow**.
  4. Ledger has an `escalations` entry with `resolved: false` → **allow** — this is a
     legitimate §3.4 halt: the command records the escalation (step 4) *before* presenting
     the gate (step 5), so an open gate is visible in the ledger by the time the turn ends.
     All seven gate types flow through this path; **legitimate halts keep halting.**
  5. Otherwise (mid-lifecycle, no open gate) → **block** (exit 2) with the reason on
     stderr: "Active expert lifecycle at phase <phase> with no open owner gate. Ending the
     turn here is an untyped halt — none of the seven §3.4 gate types applies. Continue the
     work (re-invoke /expert resume, or finish the in-flight step) or, if a genuine owner
     decision is needed, record the typed escalation in the ledger first."

  The harness then feeds the reason back and the turn continues — the seven-gate
  exhaustiveness becomes *executable at the decision point* instead of prose near it.

Why this is not "add a rule sentence" (the project's measured-history constraint): a Stop
hook runs unconditionally at every end-of-turn; the model cannot forget to apply it, and its
block reason arrives exactly when the stall is being committed. That is the structural
property the transcript's Observation-73 note identifies as missing.

### 4.2 Honest coverage statement

The ledger-keyed hook fully covers the responsible component named in the defect record
(lifecycle continuation policy). Occurrences 3-6 happened in an *investigation* session with
no active lifecycle ledger; rule 2 makes the hook inert there by design — a hook that blocks
end-of-turn in ordinary conversation would be intolerable and would recreate the friction
the 2026-07-22 ruling rejected. For assigned non-lifecycle work the same mechanism extends
naturally later (an ACTIVE-TASK marker written at directive intake, checked by the same
hook), but that extension depends on intake writing the marker reliably and should be its
own correction once this one is measured. This draft fixes the named component and installs
the mechanism the broader fix will reuse.

### 4.3 Owner-owned prerequisite (present at a spec_traceable gate, not machine-applied)

Amend `docs/specs/spec-expert-dev-tools.md:59-64` to distinguish the two hook classes:
tool-use-blocking governance hooks remain out of scope per the 2026-07-22 decision; a
Stop-event continuation gate that enforces §3.4's exhaustiveness ("the owner is interrupted
for exactly these, **and nothing else**" — which this hook operationalizes in the
stall direction) is in scope. Mirror in the architecture's divergence §8 note.

### 4.4 Files touched

- `hooks/hooks.json` (new)
- `hooks/continuation-gate.mjs` (new)
- `.claude-plugin/plugin.json` — no change needed if hooks auto-discover from `hooks/hooks.json`;
  add the `hooks` key only if the deployed Claude Code version requires explicit declaration.
- `tests/structural/check-structure.mjs` — replace T-A2c; add T-28 (below).
- `docs/specs/spec-expert-dev-tools.md:59-64` + architecture divergence §8 (owner-gated).

## 5. Verification

Structural tier (`tests/structural/check-structure.mjs`), all executed, not asserted-as-text:

- **T-28a** `hooks/hooks.json` parses and registers exactly one Stop hook pointing at
  `continuation-gate.mjs` (replaces T-A2c's "declares no hooks", which must flip with the
  spec amendment and not before).
- **T-28b-f** — lift and EXECUTE `continuation-gate.mjs` (same mechanism T-22/T-23 use for
  `runGate`, and the fixture-driven execution T-24x uses for `groundTruthPreconditions`)
  against constructed ledger fixtures piped on stdin:
  - b: no ledger file → exit 0 (ordinary sessions untouched);
  - c: `phase: 'complete'` → exit 0;
  - d: mid-phase + an `escalations` entry `resolved: false` → exit 0 (**legitimate halts
    still halt** — this is the check that proves the correction cannot cause gate-blindness);
  - e: mid-phase + all escalations resolved → exit 2 AND non-empty stderr reason naming the
    phase (the block is observed, and the reprompt content is load-bearing);
  - f: `stop_hook_active: true` + the fixture from (e) → exit 0 (loop guard observed).
- **T-28g** the block-reason string names "/expert resume" (the reprompt must route back
  into the reviewed lifecycle, not invite inline work — keeps 4b intact).

Behavioral tier: re-run the 62bbd33e stall scenario shape (active ledger mid-phase, agent
turn drafted to end with "Doing that next unless...") and observe the hook block + continued
turn; record under `tests/ACCEPTANCE.md` as the A-series criterion for this signature.

Defect-store closure: signature marked `corrected` only after owner approval, commit, and
`plugin.json` version bump with `fixed_in_version`, per `commands/expert.md` step 4.
