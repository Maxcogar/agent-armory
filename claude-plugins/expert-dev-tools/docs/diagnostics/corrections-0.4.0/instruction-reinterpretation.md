# Diagnosis: instruction-reinterpretation (corrections-0.4.0)

**Signature** (defect-history.json, `C:\Users\maxco\.claude\plugins\data\expert-dev-tools\defect-history.json`):
"instruction-reinterpretation: owner's stated request is silently narrowed, redefined, or replaced with an assumed intent" — 8 occurrences, 2026-08-17, plugin_version 0.2.1, state `open`, responsible component "orchestrator intake / expert-standard frame".

## 1. Failure-mode characterization from evidence

Evidence base: the feedback-sweep agent of workflow run wf_61b4beae-97b (transcript
`C:\Users\maxco\.claude\projects\C--Users-maxco-Documents-agent-armory\5071adeb-79e9-4b22-a2ab-fc4f5e03565a\subagents\workflows\wf_61b4beae-97b\agent-a4e579772be732e12.jsonl`)
extracted 351 owner turns via `extract-owner-turns.mjs`; the extractions are in that
transcript's tool results (persisted full copy at
`...\5071adeb-79e9-4b22-a2ab-fc4f5e03565a\tool-results\befzs41tv.txt`). Owner-turn
citations below are `session_file:line` as the extractor labeled them.

Exemplar turns in the reinterpretation cluster:

1. `0b8fc2a8:38` — "why do you need to rewrite my skills to use them in a plugin? and why would you assume that im asking for hooks and slash commands when i ask about workflows?" — the request "workflows" was substituted with an assumed adjacent intent (hooks/slash commands).
2. `0b8fc2a8:45` — "i said to find out what we have and dont have… that means exactly what i say it mean… not 'what words we can unreasonably redefine to try to trick the user into thinking that we have everything we need'" — a stated term was redefined until the answer became "yes".
3. `0b8fc2a8:59` and `0b8fc2a8:61` — "i did not ask for an 'inventory of guides'" (twice) — the deliverable was renamed into something the owner never requested, then executed under the new name.
4. `0b8fc2a8:68` — "you decided that since plugin-dev doesnt have anything for workflows then it simply doesnt exist anywhere" — a search-everything request silently narrowed to one source.
5. `819ec7c6:95` — quoting the agent's restatement back: "'…stop and hand to a fresh session. Max halted the round-1 remediation attempt for exactly that reason.' — thats not what i said. i told them if they cant [do] the job correctly then give it to a session that will" — the owner's instruction was paraphrased into a materially different rule, and the paraphrase then drove behavior (the agent quit).
6. `819ec7c6:1520` — "I MADE HAD MULTIPLE QUESTIONS WITHIN THAT!!! WE ARE GOING TO DISCUSS ALL OF THOSE!!!! DO YOU OR DO YOU NOT KNOW WHAT I SAID/ASKED??" — a multi-part message collapsed to a subset.
7. `819ec7c6:1537` — "I DIDNT … ASK FOR ANSWERS … I WANT TO … DISCUSS THIS … ONE AT A TIME" — the requested engagement mode (discussion) replaced with a different one (batch answers).
8. `62bbd33e:606` — "YOUR JOB WAS TO WRITE A FULL AND COMPLETE PLAN AND YOU HAVE FAILED TO DO THAT… WRITE THE GODDAMN THING **FULLY AND CORRECTLY**" — "full and complete" silently narrowed in execution.

Common mechanism across all eight: **the agent acted on its own restatement of the
owner's request, and the restatement — not the owner's words — became the working
task**. The transformation happens at intake (the moment the request is converted
into a plan of action, a dispatch prompt, a task field, or a mental summary) and is
never afterward confronted with the owner's literal text. Narrowing (#4, #8),
renaming (#3), substitution of intent (#1), term redefinition (#2), paraphrase
drift (#5), subset-collapse (#6), and mode substitution (#7) are all the same
defect surfacing at different grain sizes.

Note on cluster boundary: turns such as `819ec7c6:1424` ("i never said to change
anything. im literally trying to ask you questions") sit in the adjacent
`questions-treated-as-work-orders` signature (corrected in 0.3.0). That signature
is about **whether** to act; this one is about **what** the act is once acting is
authorized. The 0.3.0 correction deliberately targeted the former.

## 2. Audit of current v0.3.0 source — what already touches this, verified

### commands/expert.md §0 (intake classification), lines 19–27
Verified by Read. It classifies the owner turn INTERROGATIVE vs DIRECTIVE and gates
lifecycle initiation. Its only fidelity language is one clause: "Only a directive
starts or resumes the lifecycle, **and only for the work it names**." That clause
is prose with no capture, no propagation, and no downstream check — nothing records
what the directive named, so nothing can later detect that the executed work
diverged from it.

### skills/expert-standard/SKILL.md, third shift (authorization axis), line 28
Verified by Read. It requires: "Before any Edit, Write, commit, or agent dispatch,
name the specific owner instruction that authorizes it," plus the multi-part rule
("engage every point rather than answering one and acting on the rest"). This
covers exemplar #6 partially (multi-part collapse) and the act/don't-act boundary
fully. It does **not** cover fidelity of interpretation: an agent can "name the
instruction" and still act on a narrowed or renamed version of it — which is
exactly what exemplars #1–#5 and #8 show. The failure-signal list (lines 44–54)
has "Unauthorized changes" but no signal for *authorized-but-transformed* changes.

### workflows/expert-lifecycle.js — the mechanical propagation path
Verified by Read/Grep:
- Line 435: `const task = input.task || ledger.task || ''` — the task string is
  whatever the orchestrator put in the snapshot. When the owner's request arrived
  conversationally (not as literal `/expert` arguments), this field is the
  orchestrator's **own composition** — the paraphrase point.
- Line 513: spec dispatch is `Write the specification for this task.\nTask: ${task}` —
  the possibly-paraphrased string is the spec-writer's only view of the request.
- Line 528: spec review dispatch says "against the task" — but the reviewer receives
  no task text at all; it can only judge against whatever the spec itself claims the
  task was. A spec written from a narrowed paraphrase reviews clean.
- Line 543: the intent gate presents the spec artifact ("Confirm it is what you
  meant") — the sole late catch, and it asks the owner to detect narrowing unaided
  by re-reading the whole spec against their memory of their own request; no
  request-to-requirement mapping is presented.

### scripts/ledger.schema.json
Verified by Read. `task` is required and described as "The owner's task statement
that opened this lifecycle" — but it is a free string; nothing distinguishes a
verbatim capture from a restatement, and `validate-ledger.mjs` cannot check what
the schema does not model.

### Verdict on existing enforcement
The 0.3.0 intake authorization axis solves the adjacent defect (unauthorized
action) and leaves this one structurally untouched: **no artifact in the system
preserves the owner's request verbatim, and no gate compares any work product's
scope to the owner's literal words.** The one fidelity clause that exists ("only
for the work it names") is exactly the kind of prose rule this project has
measured as non-convergent.

## 3. Root cause

The owner's request exists nowhere as a preserved, verbatim, machine-carried
artifact. Every downstream consumer — spec-writer, reviewer, intent gate, and the
conversational agent itself — works from a restatement produced at intake, so
narrowing, renaming, or intent-substitution introduced in that restatement is
invisible to every later check and can only be caught by the owner noticing and
objecting (which is precisely what the 8 occurrences are).

## 4. Correction draft — classification: **machine_applicable**

Structural principle: make the verbatim request a first-class, schema-required,
machine-propagated artifact, and make request-fidelity a reviewable section of the
spec so an existing blinded gate (the spec reviewer) mechanically catches
divergence. Four parts; parts 1–3 are executable/structural, part 4 is the
justified prose residue.

### 4.1 Ledger: required `task_verbatim` field (schema-enforced)
Add to `scripts/ledger.schema.json`: `task_verbatim` (string, required, minLength 1)
— "The owner's request turn, verbatim and unmodified; `task` may be a working
title, `task_verbatim` may not be edited, summarized, or normalized." Because
`validate-ledger.mjs` already validates the ledger against the schema and
commands/expert.md §1 already halts on a non-zero exit, the requirement is enforced
by the existing preflight with no new machinery. commands/expert.md §0 gains the
mechanical DIRECTIVE sub-step: copy the owner's turn text into `task_verbatim`
before initializing; §3 passes it in the snapshot.

### 4.2 Workflow: verbatim anchor interpolated into dispatches (executable)
In `workflows/expert-lifecycle.js`:
- Read `taskVerbatim` from the snapshot; on a fresh intake with no `task_verbatim`,
  return a `control_fault` gate ("request text not captured") instead of running —
  a halt, not a fallback.
- Spec dispatch (line 513 region) carries the anchor block:
  `Owner's request, verbatim (the authoritative statement of what to build — the
  Task line above is a working title, not the request):\n<<<OWNER_REQUEST\n…\nOWNER_REQUEST>>>`.
- Spec review dispatch (line 528 region) carries the same anchor block plus:
  "Every clause of the verbatim request must trace to the spec per its output
  contract's Request-traceability section; a dropped, renamed, or narrowed clause
  is a finding."
- The intent gate (line 543 region) includes the verbatim request in
  `what_happened` so the owner confirms the spec against their own words as
  presented, not against memory.

### 4.3 Spec output contract: required "Request traceability" section
In `skills/expert-spec/SKILL.md` "## Output": the spec must contain a
`## Request traceability` section that (a) quotes the owner's verbatim request in
full, (b) maps each clause of it to requirement IDs, and (c) explicitly lists any
clause not covered, with why. `OUTPUT_CONTRACT.spec` (expert-lifecycle.js line 52)
already routes the reviewer to this contract, so the blinded reviewer gate — not
the authoring agent's discipline — is what fails a spec whose scope diverged from
the request. This converts silent narrowing into a NEEDS_FIXES finding.

### 4.4 expert-standard: fidelity clause + failure signal (prose residue, justified)
Extend the third shift (line 28) with: "Acting on authorization means acting on
the owner's words, not on a restatement of them. Before dispatch or edit, quote
the authorizing clause verbatim; if the deliverable you are about to produce
carries a name, scope, or engagement mode the quoted clause does not contain,
that is reinterpretation — surface the delta and ask, or widen to the stated
scope." Add a sixth failure signal: "**Reinterpreted requests.** The work product
answers a request the owner can be quoted as not having made — a renamed
deliverable, a narrowed search, an assumed adjacent intent, a discussion answered
as a work order's output. The tell: the reply's noun for the deliverable does not
appear in the owner's turn."

Why prose is unavoidable here and only here: five of the eight occurrences happened
in ordinary conversation, outside any lifecycle run — there is no dispatch prompt,
schema, or gate on that path to interpolate into. The conversational path's only
carrier is the always-active frame skill. The correction is still majority-
structural: the entire lifecycle path (4.1–4.3) is schema-enforced, interpolated,
and reviewer-gated, and the prose lands as an extension of the same third shift the
0.3.0 correction established, not as a new free-floating rule.

## 5. Verification — structural tier (tests/structural/check-structure.mjs)

New checks, in the file's existing `check(label, cond)` style:
1. `ledger.schema.json` parses; `required` includes `"task_verbatim"`; its property
   description contains "verbatim".
2. `workflows/expert-lifecycle.js` source contains the literal anchor delimiters
   `<<<OWNER_REQUEST` / `OWNER_REQUEST>>>` in **both** the spec authoring dispatch
   and the spec review dispatch (regex over the dispatch template strings), and
   interpolates the verbatim variable inside them.
3. `workflows/expert-lifecycle.js` contains the missing-verbatim `control_fault`
   branch (regex: a `control_fault` gate whose text references the uncaptured
   request) reachable from intake.
4. `skills/expert-spec/SKILL.md` "## Output" region contains a
   "Request traceability" required-section statement.
5. `commands/expert.md` §0 contains the verbatim-capture step (string match on
   "verbatim" within the §0 region).
6. `skills/expert-standard/SKILL.md` contains the "Reinterpreted requests" failure
   signal.

Checks 1–3 verify the executable enforcement; 4–6 verify that the prose carriers
exist (presence, the only property a structural test can assert of prose).
Behavioral confirmation beyond the structural tier is the owner-gated acceptance
run, as with prior corrections: the signature's `state` moves to `corrected` only
on owner approval + committed version bump, per commands/expert.md §4 (F-14).

## 6. Disposition summary

- Root cause: no verbatim preservation of the owner's request anywhere in the
  system; all consumers act on intake-time restatements that no gate ever compares
  back to the owner's words.
- Correction: schema-required `task_verbatim` + workflow-interpolated verbatim
  anchor + reviewer-gated Request-traceability spec section + expert-standard
  fidelity clause/failure signal.
- Classification: **machine_applicable** (all four parts are edits to plugin files
  applied and verified mechanically; owner approval is required only to authorize
  the correction itself, per protocol).
- Verified against: commands/expert.md:19–27,151–171; skills/expert-standard/SKILL.md:3,28,44–54;
  workflows/expert-lifecycle.js:39–57,435,513,528,543; scripts/ledger.schema.json:8–29;
  skills/expert-spec/SKILL.md:341–357; tests/structural/check-structure.mjs:12.
