# Spec audit — part c

This file is part c of the whole-spec audit of
`middleware/context-oracle/docs/specs/spec-context-oracle.md` at `ec3b057`: the 89
units listed in `SPEC-c.txt`, spec lines 673–1142 (§11.3 FR-L7 through the end of
§14 and the closing footer). It follows the auditor brief
`/tmp/claude-0/-home-user-agent-armory/779c0f74-86b0-5e8f-b02d-811e78ed3f66/scratchpad/audit/BRIEF.md`
and the spec-audit brief
`/tmp/claude-0/-home-user-agent-armory/779c0f74-86b0-5e8f-b02d-811e78ed3f66/scratchpad/audit/SPEC-BRIEF.md`,
which governs where the two differ. Web sources were fetched with `curl` on
2026-09-29 (Claude Code docs at `code.claude.com`); the one throwaway experiment ran
in `…/scratchpad/specaudit/c/mdorder` on Claude Code 2.1.284.

### E-1
**Units:** SP-181-11-3-Learning-loop-de-no-FR-L7
**Question:** FR-L7 routes repo facts to the project store and efficacy signals to the global store. Is that routing an owner decision, and is it right?
**Facts:**
- The line. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L673-L673]] "repo facts → project store; efficacy → global store"
- OL-6 is CONFIRMED: two stores, per-project and per-user global. [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L44-L44]] "Two stores — per-project and per-user global — both outside the repo tree; solo scope, no team sharing."
- The recorded rationale of OL-6 (RETHINK §12.6, which the ledger points to) assigns the contents: repo facts to the project store, whisper-efficacy statistics to the global store. [[middleware/context-oracle/RETHINK.md@ec3b057:L343-L347]] "whisper-efficacy statistics, threshold tuning, general conventions"
**Standard:** SPEC-BRIEF kind 1 (owner decision): keep unless it has a flaw by the acceptable-decision test.
**Reasoning:** The routing is the content of OL-6 as its confirmed rationale spells it out. The project store holds facts about one repository; efficacy (how well whispers work) is a property of the tool across repositories, so it belongs in the per-user store. Nothing in the spec or the ledger contradicts it, and AC-23 tests it.
**Alternatives:** A single store would contradict OL-6. Routing efficacy per project would lose cross-project learning that OL-6's rationale names.
**Consequences:** AC-23 (unit SP-264, below) verifies it. No dependency on a flawed line.
**Verdict:** keep — FR-L7 is OL-6's confirmed two-store split.
**Would be wrong if:** OL-6's confirmed wording or rationale assigned efficacy statistics to the project store.

### E-2
**Units:** SP-182-11-4-Corrective-steering
**Question:** The §11.4 heading says the corrective feature is non-primary in purpose and that it blocks. Are both assertions true to the ledger?
**Facts:**
- The heading. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L675-L675]] "Corrective / steering feature (non-primary in purpose — and it blocks)"
- OL-C2: non-primary in Max Cogar's words, and escalation to a block. [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L68-L68]] "THIS IS NOT THE PRINARY ROLE OF THE ORACLE, NOR WOULD I EVEN CONSIDER IT A PRIMARY FEATURE!!!!"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L68-L68]] "This **steers/corrects AND escalates to a BLOCK** when the agent won't follow the skill."
**Standard:** SPEC-BRIEF kind 3 (heading): judge what it asserts.
**Reasoning:** The heading asserts two things; both are the CONFIRMED content of OL-C2. It adds nothing beyond them.
**Alternatives:** None needed; a heading that dropped either fact would misdescribe the section.
**Consequences:** None.
**Verdict:** keep — both assertions are OL-C2.
**Would be wrong if:** OL-C2 did not confirm the escalation to a block.

### E-3
**Units:** SP-183-11-4-Corrective-steering-OL-C2
**Question:** The §11.4 lead paragraph reconciles "non-primary" with a blocking mechanism and gives the reason the feature is deferred to Phase C. Is its backing real and is the phase reason the one the spec itself uses?
**Facts:**
- The paragraph names a review finding as its source. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L677-L677]] "**On \"non-primary\" (finding M1, `docs/reviews/2026-08-25-independent-review-spec-revision.md`).**"
- Its phase reason is machinery weight. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L680-L683]] "It is the most machinery-heavy"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L682-L683]] "and is deferred to Phase C accordingly."
- The spec's own rule for which phase a genre goes in is model-freedom, not machinery weight. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L183-L184]] "Model-free vs model-dependent, and therefore build phase, is fixed in §11."
- The non-primary status is OL-C2's content. [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L68-L68]] "BUT I CANNOT STRESS ENOUGG THAT THIS IS JUST A SMALL FEATURE FOR MY OWN PERSONAL BENEFIT!!!!!"
- The review finding is one row of a review table. [[middleware/context-oracle/docs/reviews/2026-08-25-independent-review-spec-revision.md@ec3b057:L28-L28]] "\"Small/personal/non-primary\" stapled to the most coercive capability without reconciliation."
**Standard:** BRIEF "Never backing": "a review said so (a review finding is a claim to check, not backing)". The spec's own provenance rule: every requirement traces to a CONFIRMED owner decision, a named standard, or a §12 judgment. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L5-L6]] "Every requirement traces to a CONFIRMED owner decision"
**Reasoning:** (1) The distinction the paragraph draws — priority of purpose (non-primary, OL-C2) versus severity of mechanism (a block halts the agent) — is sound, and its first half is OL-C2. (2) But the paragraph's cited source is review finding M1, which is not backing under the test; the backing it needs is OL-C2 for "non-primary" and FR-B5/D-35 for "full investment in precision". (3) The phase reason, "most machinery-heavy", is not the criterion FR-A2 fixes for phasing (model-free vs model-dependent). By FR-A2's criterion the feature's phase follows from FR-C2's claim that mapping actions onto steps is model-assisted — which is itself in question (E-6). So the stated reason is not the spec's reason and cannot be checked against anything.
**Alternatives:** Keep the review pointer as provenance: rejected, a review is evidence of a change, not backing for a requirement. Keep "machinery-heavy" as the phase reason: rejected, it conflicts with FR-A2's rule and would let any heavy component be deferred by assertion.
**Consequences:** Phase C placement (SP-192) and FR-C2 (SP-186) must agree with whatever reason replaces this one. If Max Cogar's answer on FR-C2 (E-6) is that the trigger is deterministic over observable tool events, the FR-C1a enforceable core is model-free and FR-A2's rule would place it earlier than Phase C.
**Verdict:** replace — cite OL-C2 (non-primary) and FR-B5/D-35 (precision investment) instead of review finding M1, and state the phase placement by FR-A2's model-free/model-dependent rule as FR-C2 is finally resolved (E-6), not by "machinery-heavy".
**Would be wrong if:** The spec elsewhere defined machinery weight as a phasing criterion, or a CONFIRMED ledger entry placed the corrective feature in Phase C.

### E-4
**Units:** SP-184-11-4-Corrective-steering-FR-C1
**Question:** FR-C1 says the oracle is given each expert skill's structure, including per-step observable post-conditions. Is that OL-C2, and is the post-condition addition backed?
**Facts:**
- The line. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L685-L689]] "per skill: how activation is detectable, the steps it"
- OL-C2 in Max Cogar's words. [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L68-L68]] "so the oracle would know when they're activated, what steps are within the expert skill being used, what actions the agent should be taking if they actually follow the skills, and so on."
- The post-condition addition serves the automated under-fire guard, whose reason is that Max Cogar cannot see a skipped step. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L449-L451]] "But a *missed* skipped step is invisible to Max (OL-11), so its under-fire"
- OL-11: Max Cogar is a non-programmer by design. [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L49-L49]] "You are a non-programmer by design."
**Standard:** SPEC-BRIEF kind 1 for the OL-C2 content; the full test (kind 2) for the post-condition addition. Fail-fast: a missed block must be detected and visible, not left silent (BRIEF, Shore 2004).
**Reasoning:** Activation, steps and expected actions are OL-C2's enumerated list. The post-condition field is an engineering addition; its job is to let FR-C4 check a step's outcome without trusting the action classifier. That job is backed by OL-11 (Max cannot catch the miss) and is the fail-fast answer to an otherwise silent under-fire. "Where one exists" keeps it scoped: steps without a checkable outcome are not forced to invent one.
**Alternatives:** Encode only OL-C2's list: then under-fire detection must re-use the classifier and inherits its blind spot (FR-B5 L450–452). The addition is the better choice.
**Consequences:** FR-C4 (SP-188) consumes the field; its own fallback flaw is judged there.
**Verdict:** keep — OL-C2's encoded structure plus a scoped, OL-11-backed post-condition field.
**Would be wrong if:** Max Cogar's skills had no steps with observable outputs, making the field empty in every case.

### E-5
**Units:** SP-185-11-4-Corrective-steering-FR-C1a
**Question:** FR-C1a defines the skill block's enforceable core (the review/collapse-hunt dispatch, read-before-plan) and its limit (pure cognitive steps). Are its factual claims about the harness and the project history true?
**Facts:**
- The line names the subagent tool `Task`. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L694-L697]] "a `Task` subagent, whose absence"
- The current Claude Code tools reference names the subagent tool `Agent`. [[https://code.claude.com/docs/en/tools-reference.md]] "The Agent tool spawns a subagent in a separate context window."
- The hooks reference also directs parent-side handling to the `Agent` tool (the sentence continues "use a PostToolUse hook on the Agent tool instead"). [[https://code.claude.com/docs/en/hooks.md]] "To inject context into the parent session after a subagent returns"
- The line ranks the skipped dispatch as the project's top process failure. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L695-L696]] "is the single most-cited process failure on this very project"
- The collapse-log's recorded 2026-08-25 process failure is a skipped author self-review, not a skipped independent dispatch. [[middleware/context-oracle/docs/collapse-log.md@ec3b057:L153-L155]] "the independent review does not replace the author's self-review; skipping the self-review"
- The line says read-before-plan is observable from the transcript. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L699-L700]] "Observable from the transcript."
- The transcript lags. [[https://code.claude.com/docs/en/hooks.md]] "The transcript file is written asynchronously and may lag the in-memory conversation"
**Standard:** CLAUDE.md: "Verify external facts (harness contracts, protocol status, library behavior) against current primary sources". [[middleware/context-oracle/CLAUDE.md@ec3b057:L225-L225]] "Verify external facts (harness contracts, protocol status, library behavior)"
**Reasoning:** (1) The enforceable-core idea is sound: a subagent dispatch and a `Read` call are tool events the oracle's own hooks observe, so their presence or absence is decidable. (2) The tool is named wrongly: a matcher or fixture written against `Task` would never see a dispatch. (3) "Single most-cited" is a ranking with no count behind it; the log's own recorded failure of this kind is a different one. A ranking claim with no evidence is exactly what the collapse-log 2026-08-01 lesson forbids letting into a document. (4) "Observable from the transcript" points at a source the docs say may lag; the oracle's own `PreToolUse`/`PostToolUse` records of `Read` are the non-lagging source.
**Alternatives:** Leave `Task` because older builds used it: rejected, the spec is checked against the current contract (C-4). Keep the superlative as colour: rejected, an unevidenced ranking is load-bearing here because it justifies choosing this step as the fixture (AC-2b).
**Consequences:** AC-2b (SP-240) builds its fixture on this core. The architecture and plan inherit the `Task` name if they copied it.
**Verdict:** replace — name the `Agent` tool; replace "the single most-cited process failure on this very project" with the verifiable reason (CLAUDE.md makes the independent collapse-hunt mandatory, dominating rule 2); say read-before-plan is observable from the oracle's own recorded `Read` tool events rather than from the transcript.
**Would be wrong if:** Current Claude Code still accepted `Task` as the subagent tool name in hook matchers, or a count in the collapse-log showed the skipped dispatch as the most frequent failure.

### E-6
**Units:** SP-186-11-4-Corrective-steering-FR-C2
**Question:** FR-C2 redefines OL-C2's "more deterministic trigger" to mean "structured by the encoded skill" and makes the action→step mapping a model-assisted judgment. Is that Max Cogar's intent, and is it consistent with the rest of the spec?
**Facts:**
- Max Cogar's words. [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L68-L68]] "what i actually wanted was structured steering/correcting with a more deterministic trigger. and NOT trying to code in piles of rules and shit for when it should trigger."
- FR-C2 redefines "deterministic". [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L710-L713]] "**\"Deterministic\" here means"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L711-L713]] "mapping the agent's free-form"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L712-L712]] "actions onto a skill's steps is a judgment (model-assisted, consistent with Phase C)"
- FR-C1a says the core of the block is fully observable, which needs no model. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L696-L697]] "Fully observable: did a review/hunt subagent get dispatched at the step that"
- OL-C7: a statement of Max Cogar's must not be reinterpreted more broadly than he said it. [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L73-L73]] "my statements are getting overgenralized and turned into new project rules"
**Standard:** SPEC-BRIEF kind 1: an owner line with a flaw is `replace`, marked for Max Cogar, "Never rewrite his intent". Ledger rule 1: an owner-attributed claim must be CONFIRMED. [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L12-L14]] "find it under CONFIRMED"
**Reasoning:** (1) Max Cogar asked for "a more deterministic trigger" and for no hand-coded rule piles. (2) FR-C2 keeps the second and changes the meaning of the first: the trigger becomes a model-assisted judgment, which is the opposite of what "deterministic" ordinarily means. No CONFIRMED entry records that he accepts a model judgment as the trigger. (3) The spec's own FR-C1a shows that the high-value core — a subagent dispatch, a `Read` before a plan — is decidable from tool events against the encoded skill, with no model and no rule pile. So the redefinition is not forced by the problem for the core; it is forced only for steps whose expected action is not a tool event, which FR-C1a already places outside the block's reach. (4) Because the choice of trigger character is what Max Cogar stated, the correct line must be his; this audit can state the conflict and the evidence, not settle his meaning.
**Alternatives:** (a) Deterministic over observable tool events against the encoded skill for the FR-C1a core, model-free, with non-observable steps out of the block's reach — matches his words and FR-C1a. (b) FR-C2 as written — a model-assisted mapping; needs his explicit acceptance. The audit cannot choose between them for him.
**Consequences:** The Phase C placement (SP-183, SP-192) follows from this answer under FR-A2's phasing rule. AC-2b (SP-240) is unaffected in shape.
**Verdict:** replace — owner decision, goes to Max Cogar: state OL-C2's trigger as deterministic over the observable tool events the encoded skill declares (alternative a), or record his explicit acceptance of a model-assisted mapping; FR-C2 may not redefine "deterministic" on its own.
**Would be wrong if:** A CONFIRMED ledger entry or Max Cogar's own words showed he accepted a model-assisted trigger.

### E-7
**Units:** SP-187-11-4-Corrective-steering-FR-C3
**Question:** FR-C3: steer first, block when a step is skipped without a stated reason or steering isn't working, never a pre-emptive gate. Is it the ledger?
**Facts:**
- The line. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L716-L720]] "it **escalates to a block** (FR-B1) when the"
- OL-C2's escalation in his words. [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L68-L68]] "IF THEY CANT PROVIDE A REASON FOR SKIPPING A STEP OR SOMETHING, OR STEERING ISNT WORKING, THEN THEY SHOULD BE FUCKING BLOCKED."
- The rejected pre-emptive gate. [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L68-L68]] "What he rejected is the **pre-emptive** gate"
- OL-3 as clarified: blocking wanted, pre-emptive gate rejected. [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L41-L41]] "What he rejected is the *pre-emptive* gate (\"pass a test to proceed\" / generated-file), not blocking as such."
**Standard:** SPEC-BRIEF kind 1.
**Reasoning:** Each clause of FR-C3 is a clause of OL-C2 or OL-3: steer first, block on an unreasoned skip or failed steering, no pre-emptive gate, small and non-primary. "Weighted as one ordinary input — no precedence (P9)" restates "NOT THE PRINARY ROLE". Nothing is added beyond the ledger.
**Alternatives:** None that keep his words.
**Consequences:** None.
**Verdict:** keep — FR-C3 is OL-C2 and OL-3 as confirmed.
**Would be wrong if:** OL-C2 had not confirmed escalation to a block.

### E-8
**Units:** SP-188-11-4-Corrective-steering-FR-C4
**Question:** FR-C4 requires an automated missed-skill-block detector independent of the action classifier. Its second limit says that for judgment-heavy skills the "due" signal "falls back to action-classification". Is that fallback acceptable?
**Facts:**
- The fallback. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L735-L738]] "falls back to action-classification"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L737-L738]] "**re-importing the very blind spot** FR-C4 exists to avoid"
- Limit (1) handles the other hard case by exclusion, not fallback. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L732-L732]] "(1) A step with no checkable post-condition is not monitored this way (FR-C1a)."
- The rate FR-C4 feeds is shown to Max Cogar as a health number. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L280-L282]] "the missed-skill-block rate** (so both an over-firing and an under-firing"
**Standard:** BRIEF, fail-fast and fallbacks: a degraded mode is legitimate only when a requirement calls for it, it is specified as correct behavior, and it is visible (recorded and reported). Shore, "Fail Fast", IEEE Software 2004. [[https://martinfowler.com/ieeeSoftware/failFast.pdf]] "The program continues working right after an error but fails in strange ways later on."
**Reasoning:** (1) The detector's reason to exist is independence from the classifier (L724–726). (2) When "due" cannot be derived from post-conditions, the line keeps the detector running on the classifier's output — the signal it was built to be independent of. (3) The result feeds the missed-skill-block rate in `status` with nothing marking that, for those steps, the rate is the classifier grading itself. A low rate there reads as "no misses" when it means "misses invisible by construction". That is a hidden degraded mode: required by nothing, not specified as correct, not visible. (4) Limit (1) already shows the honest form — an unmonitorable step is declared unmonitored. The same treatment fixes limit (2).
**Alternatives:** (a) Fallback as written — hides the blind spot. (b) Report steps whose "due" cannot be post-condition-derived as unmonitored in `status` and exclude them from the rate — visible and truthful. (c) Require every encoded skill step to be post-condition-ordered — would narrow what can be encoded, a scope change nobody asked for. (b) is correct.
**Consequences:** FR-M4's missed-skill-block rate and AC-2c/AC-9 must show the unmonitored-step count beside the rate.
**Verdict:** replace — for a step whose "due" cannot be derived by post-condition chaining, FR-C4 reports the step as unmonitored in `status`/`log` and excludes it from the missed-skill-block rate, never substituting the action classifier.
**Would be wrong if:** The spec elsewhere required the rate to include classifier-derived "due" steps and labelled them as such in `status`.

### E-9
**Units:** SP-189-11-5-Build-order-phases
**Question:** The §11.5 heading says phases are build order within one spec. Is that claim true to the project's rules?
**Facts:**
- The heading. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L743-L743]] "### 11.5 Build order (phases within one spec)"
- CLAUDE.md states the same rule. [[middleware/context-oracle/CLAUDE.md@ec3b057:L54-L57]] "There is never a separate"
**Standard:** SPEC-BRIEF kind 3 (heading).
**Reasoning:** The heading asserts one checkable thing — one spec, phases as build order — and the standing rules say exactly that. Nothing else is asserted.
**Alternatives:** None needed.
**Consequences:** None.
**Verdict:** keep — the assertion matches CLAUDE.md's single-spec rule.
**Would be wrong if:** A separate per-phase spec existed as an authority.

### E-10
**Units:** SP-190-11-5-Build-order-phases
**Question:** The Phase A paragraph defines Phase A's content and exit, and (since 2026-09-04) declares Phase A "the build's test bed", run on Max Cogar's real repos and Claude Code transcripts, citing `docs/IDEAS.md` #14 and architecture ID `AD-24`. Is the paragraph backed, and was the added purpose signed?
**Facts:**
- The added sentences. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L757-L761]] "**Phase A is also the build's test bed.** It is run on the"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L758-L761]] "owner's real repos and Claude Code transcripts to *discover* how the honest"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L759-L761]] "(`docs/IDEAS.md` #14, discovery-mode"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L760-L761]] "replay), and Phase B and the `AD-24` regression fixtures are **designed from that"
- They were added after the sign-off. [[ran]] `git log -1 --format='%h %ad %s' --date=short 1e15a6a` → `1e15a6a 2026-09-04 docs(context-oracle): capture the Phase A test-bed purpose; state for next session`
- The sign-off is dated 2026-08-28. [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L72-L72]] "Max, in chat, 2026-08-28"
- IDEAS #14 is marked unvalidated. [[middleware/context-oracle/docs/IDEAS.md@ec3b057:L92-L92]] "14. **Discovery-mode real-transcript replay.** **Unvalidated.**"
- The project's promotion rule for ideas. [[middleware/context-oracle/CLAUDE.md@ec3b057:L270-L271]] "Promotion: IDEAS.md → spec §13 (grounded by research) → requirement with owner"
- Max Cogar objected, in one specific context (agents proposing tests on his projects to settle questions answerable from docs), to running things on his actual projects. [[/tmp/claude-0/-home-user-agent-armory/779c0f74-86b0-5e8f-b02d-811e78ed3f66/scratchpad/audit/owner-messages.md@FILE:L583-L583]] "AND WHY DO YOU NEED TO TEST SHIT ON MY ACTUAL PROJECTS????"
- The rest of the paragraph (content, conservative answer-drift skeleton, exit on "a real repo") predates the sign-off and is backed by D-41 and the regret requirement. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L755-L757]] "Exits by producing measured whisper/block"
**Standard:** CLAUDE.md promotion rule (above) and the routing table (the spec holds requirements; architecture IDs are design). OL-C7: a statement of Max Cogar's is not widened, and here nothing he said is on record either way for this use. SPEC-BRIEF: "Do not invent requirements the mission and the ledger do not call for."
**Reasoning:** (1) Phase A's content list and its exit on a real repo are pre-sign-off, backed by FR-A2's model-free rule, D-41 and FR-L4; they stand. (2) The test-bed sentences are a new requirement: they make Max Cogar's real repositories and real session transcripts the input the later phases are designed from. They were written six days after the sign-off, rest on an idea the ideas ledger marks "Unvalidated", skip the promotion path (§13 with grounding, then owner sign-off), and make a requirement depend on an architecture ID (`AD-24`), which inverts spec → architecture. (3) Whether his real repos and transcripts are the build's test data is a scope and data-use question that only he can answer; his only recorded words on running things on his projects are an objection in a different context, which under OL-C7 decides nothing here but shows the question is live. (4) The sentence about faked mechanisms corrupting measurement restates the collapse-log 2026-09-04 lesson, which is CLAUDE.md rule 3's home; it is not a requirement.
**Alternatives:** (a) Keep the sentences — builds on an unsigned, unvalidated idea. (b) Remove them from the spec and put IDEAS #14 through the promotion path, with Max Cogar deciding whether his repos and transcripts are used. (b) is the project's own rule.
**Consequences:** CLAUDE.md rule 3's "test bed" sentence points here and falls with it until promoted. Any architecture or plan section that designs Phase B from transcript replay depends on this owner answer.
**Verdict:** replace — keep the Phase A content and exit as written; remove the test-bed sentences (L757–766) until IDEAS #14 is promoted through §13 with Max Cogar's sign-off — owner decision, goes to Max Cogar: whether his real repositories and Claude Code transcripts are Phase A's test data.
**Would be wrong if:** A CONFIRMED ledger entry or Max Cogar's own words approved using his real repos and transcripts as the test bed.

### E-11
**Units:** SP-191-11-5-Build-order-phases
**Question:** Phase B: the model-dependent genres and the model-maintained question/answer state, with the deny reading cached state and no model on the deny path. Is it backed?
**Facts:**
- The line. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L772-L774]] "the `PreToolUse` deny stays"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L774-L774]] "synchronous, reading that cached state — **the model never sits on the deny path.**"
- A model call is too slow for the synchronous path (NF-1's reasoning). [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L536-L538]] "A model call's latency"
- OL-C5 defines the judgment the model serves. [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L71-L71]] "if i ask a question and their next move isnt a direct answer or them taking actions to provide an answer, then then need corrected"
**Standard:** FR-A2's rule: model-dependent work is phased by model need. OL-2: model in the loop via the host CLI, with a deterministic degraded mode.
**Reasoning:** The genres listed are the ones §4 marks model-dependent; the answer-drift precision step implements OL-C5's judgment, which D-41 argues is comprehension. Keeping the model off the deny path follows from a model call taking seconds while a hook blocks the agent: the deny must answer from state already computed. The cached-state lag this creates is handled by D-41 (judged in E-42); this line only states the phase content.
**Alternatives:** A synchronous model call in `PreToolUse` — rejected by the latency reasoning. None better.
**Consequences:** D-41 (SP-222) carries the lag-window design; its flaw does not change this line.
**Verdict:** keep — Phase B's content and the off-path rule follow from §4, OL-C5 and the latency reasoning.
**Would be wrong if:** The host CLI offered a model call fast enough to run inside the hook's latency budget.

### E-12
**Units:** SP-192-11-5-Build-order-phases-FR-C1
**Question:** Phase C bundles the automated learning loop with the corrective/skill feature and says it "needs the skill structures encoded and A/B delivery in place, plus the demotion+promotion ladder". Are these dependencies defined and real?
**Facts:**
- The line. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L776-L777]] "Needs the"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L777-L777]] "skill structures encoded and A/B delivery in place, plus the demotion+promotion ladder."
- "A/B delivery" appears nowhere else in the spec. [[ran]] `git show ec3b057:middleware/context-oracle/docs/specs/spec-context-oracle.md | grep -n "A/B"` → `3:…phases A/B/C are build order…` and `777:  skill structures encoded and A/B delivery in place, plus the demotion+promotion ladder.`
- FR-C1–C4 name no dependency on the learning loop's demotion/promotion ladder; FR-C4's inputs are post-conditions and deny records. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L727-L729]] "**directly against repo/store state**"
**Standard:** Raise-flaws rule: an input "too unclear to act on without guessing" is a flaw. A dependency stated as a phase gate must name what it depends on (acceptable-decision test, condition 1 and 2).
**Reasoning:** (1) "Skill structures encoded" is a real dependency of FR-C1–C4. (2) "A/B delivery" is undefined: no requirement defines it, so a builder must guess whether it means A/B testing of whisper phrasing, delivery from phases A and B, or something else. (3) The demotion+promotion ladder is the learning loop's own machinery (FR-L3/L3b); nothing in FR-C1–C4 consumes it, so the bundle states a dependency the requirements do not have. (4) The corrective feature's phase is otherwise governed by FR-A2's model-dependence rule, which waits on E-6.
**Alternatives:** Keep the bundle: a phase gate built on an undefined term. Split the line into its real dependencies: the learning loop needs Phase A/B exit data and the ladder; the corrective feature needs encoded skill structures and its phase is set by FR-C2's resolution. The split is correct.
**Consequences:** SP-183's phase reason and E-6's owner question feed this line. AC acceptance routing in SP-267 names AC-2b as Phase C.
**Verdict:** replace — drop the undefined "A/B delivery"; state the learning loop's dependency (Phase A/B exit data, the FR-L3/L3b ladder) and the corrective feature's (encoded skill structures; phase per FR-A2 once FR-C2 is resolved, E-6) separately.
**Would be wrong if:** "A/B delivery" were defined in a CONFIRMED ledger entry or elsewhere in the spec.

### E-13
**Units:** SP-193-11-5-Build-order-phases
**Question:** Each phase follows an approved, adversarially-reviewed architecture document; Phase B/C numbers come from Phase A's exit data. Is this backed?
**Facts:**
- The line. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L779-L780]] "Each phase follows an approved, adversarially-reviewed architecture document; Phase B/C"
- The lifecycle rule. [[middleware/context-oracle/CLAUDE.md@ec3b057:L205-L205]] "No implementation before an approved architecture document for the phase"
**Standard:** CLAUDE.md lifecycle (spec → architecture → plan → build); setting thresholds from measured data rather than invention (CLAUDE.md: "Numbers without sources don't go in").
**Reasoning:** The first clause restates the lifecycle rule. The second defers numbers that cannot be sourced before data exists to the data that will source them, which is the only honest source for them.
**Alternatives:** Fixing Phase B/C numbers now would be unsourced numbers.
**Consequences:** None.
**Verdict:** keep — lifecycle restated and numbers deferred to their data.
**Would be wrong if:** The lifecycle rule allowed a phase to build without its own architecture.

### E-14
**Units:** SP-194-11-5-Build-order-phases, SP-228-13-What-is-genuinely-ope, SP-268-14-Acceptance-criteria
**Question:** Three horizontal rules separating sections. Do they assert anything?
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L782-L782]] "---"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L910-L910]] "---"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L1136-L1136]] "---"
**Standard:** SPEC-BRIEF kind 3: a line that asserts nothing checkable is kept with one line saying so.
**Reasoning:** Markdown section separators; no claim.
**Alternatives:** None.
**Consequences:** None.
**Verdict:** keep — separators assert nothing.
**Would be wrong if:** A separator carried text.

### E-15
**Units:** SP-195-12-Decisions-made-while
**Question:** The §12 heading names the section holding the D-n judgments. Does it assert anything wrong?
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L784-L784]] "## 12. Decisions made while writing this spec"
- The spec's key promises the D-n reasoning lives here. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L9-L10]] "judgment made while writing this spec (reasoning in §12)"
**Standard:** SPEC-BRIEF kind 3.
**Reasoning:** The heading only names the section. Whether each entry carries its reasoning is judged per entry (E-16 onward); the heading itself asserts nothing further.
**Alternatives:** None.
**Consequences:** Several entries below lack the reasoning L10 promises; that is recorded against each entry, not the heading.
**Verdict:** keep — a section title with no further claim.
**Would be wrong if:** The heading claimed the section held owner decisions.

### E-16
**Units:** SP-196-12-Decisions-made-while-D-2
**Question:** D-2: advisory by default; blocking only reactively in Max Cogar's two cases. Is it the ledger?
**Facts:**
- The line. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L786-L788]] "blocking exists only for answer-drift `[OL-C3]` and"
- OL-3 as clarified: blocking wanted in two cases, pre-emptive gate rejected. [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L41-L41]] "Blocking **is** wanted — cases on record so far: **answer-drift (OL-C3)** and **skill non-conformance (OL-C2**"
- OL-3's recorded rationale: advice is tuned from false-fire data, not enforced. [[middleware/context-oracle/RETHINK.md@ec3b057:L324-L325]] "False fires are tracked (warning emitted → agent proceeded →"
**Standard:** SPEC-BRIEF kind 1.
**Reasoning:** Every clause of D-2 is OL-3 (as Max Cogar clarified it on 2026-08-16), OL-C2 and OL-C3. "De-noised empirically, not gated" is OL-3's recorded rationale. The *Job* line states the purpose in the owner's terms and adds no scope.
**Alternatives:** None that keep the ledger.
**Consequences:** None.
**Verdict:** keep — D-2 is OL-3/OL-C2/OL-C3 as confirmed.
**Would be wrong if:** The ledger confirmed a third block or none.

### E-17
**Units:** SP-197-12-Decisions-made-while-D-4
**Question:** D-4: the ⚠ subtype is declarative and corrected via the CLI. Does the entry carry its reasoning, and is the correction channel sound?
**Facts:**
- The entire entry. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L790-L790]] "**D-4 — ⚠ subtype declarative, corrected via CLI** (feeds FR-L3/FR-L3b)."
- FR-D4, which D-4 backs, cites only D-4 back. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L194-L196]] "the empirical de-noiser `[D-4]`"
- The real backing is OL-C4: voice uncertain warnings flagged, let the loop demote the wrong ones. [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L70-L70]] "(B) also voice uncertain warnings clearly flagged, letting the learning loop demote ones that keep being wrong"
**Standard:** CLAUDE.md: every non-trivial requirement carries a source, "`[D-n]` with reasoning in spec §12". [[middleware/context-oracle/CLAUDE.md@ec3b057:L222-L223]] "`[OL-n]`, or `[D-n]` with reasoning in spec §12"
**Reasoning:** (1) The decision — a hazard whisper stated declaratively, marked as possibly wrong, corrected by feedback that drives demotion — is exactly OL-C4's option B. (2) The §12 entry does not say so: it has no reasoning, and FR-D4 points back to D-4, so the backing is circular as written. (3) "Via CLI" names the channel FR-L6 uses; whether Max Cogar can operate that channel is D-12's open question (E-22), so D-4 should point at FR-L6 rather than fix the channel itself.
**Alternatives:** Leave the entry bare: fails the "reasoning in §12" rule. Add the OL-C4 backing: correct.
**Consequences:** FR-D4 inherits the backing. The channel form follows E-22.
**Verdict:** replace — D-4 states its backing: OL-C4 (uncertain hazards voiced flagged; the learning loop demotes the ones that keep being wrong), with corrections entering through the FR-L6 human-correction channel whose form is decided under D-12 (E-22).
**Would be wrong if:** OL-C4 had selected option A (warn only when quite sure).

### E-18
**Units:** SP-198-12-Decisions-made-while-D-28
**Question:** D-28 records that uncertain hazards are spoken flagged because Max Cogar chose option B. Is it accurate?
**Facts:**
- The line. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L791-L792]] "Max chose option B"
- OL-C4. [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L70-L70]] "Max answered *\"B\"* (2026-08-16)"
**Standard:** SPEC-BRIEF kind 1.
**Reasoning:** The entry records the owner's selection with its date and ledger key, and claims nothing beyond it.
**Alternatives:** None.
**Consequences:** FR-A5a and AC-3a rest on it.
**Verdict:** keep — OL-C4 recorded accurately.
**Would be wrong if:** The ledger recorded a different choice or date.

### E-19
**Units:** SP-199-12-Decisions-made-while-D-6
**Question:** D-6/D-6bar: the recursion guard and the bar-as-quality-filter are properties; "combinator, 'ships high', and calibration policy stated as properties". Is each backed?
**Facts:**
- The entire entry. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L793-L794]] "combinator, \"ships high\", and calibration policy stated as properties."
- §5.2's "ships high" cites only D-6bar. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L253-L255]] "**The bar ships high and is calibrated.**"
- The model path is a headless Claude Code call. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L595-L596]] "illustratively a non-interactive single-turn CLI call (e.g. `claude -p --model … --max-turns"
- Configured hooks fire in a headless `claude -p` child (executed 2026-09-28 by the branch audit). [[middleware/context-oracle/docs/reviews/2026-09-28-branch-audit-hook-context-permission-denial.md@HEAD:L28-L29]] "All runs used Claude Code 2.1.283, `claude -p`, in a throwaway `/tmp`"
- [[middleware/context-oracle/docs/reviews/2026-09-28-branch-audit-hook-context-permission-denial.md@HEAD:L34-L34]] "| Bash allowed (control) | 2 | yes, both | success | in transcript, both |"
- D-36 elsewhere calls unspoken held facts the costliest failure, the opposite lean. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L847-L848]] "The silence-is-costlier asymmetry is a **mission-derived judgment**."
**Standard:** CLAUDE.md: "`[D-n]` with reasoning in spec §12"; OL-C1: no arbitrary limit decides whether to speak; the bar alone does. [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L67-L67]] "at no point should an arbitrary limit influence how that operates."
**Reasoning:** (1) The recursion guard is needed and derivable: the oracle's model call runs Claude Code headless in the same repository; hooks from its settings fire in such a run (executed result above); so an unguarded call re-enters the oracle. The entry does not record this derivation. (2) Stating the bar and the combinator as properties matches the spec's "what, not how" rule (L15–18). (3) "Ships high" has no reasoning anywhere: §5.2 cites D-6bar and D-6bar only names it. It sets a direction for an initial operating point before any data exists, and it leans toward silence while D-36 leans the other way. An unsourced initial lean is the kind of setting OL-C1 keeps from influencing whether to speak; the initial operating point belongs with the architect's combinator, sourced there.
**Alternatives:** (a) Keep "ships high" and back it with a false-positive adoption source — none is cited or checked in this entry, and it would still contradict D-36's lean without reconciling it. (b) Drop it; keep "calibrated against measured false-fire and value". (b) removes an unbacked setting without losing a requirement.
**Consequences:** §5.2's sentence "The bar ships high" changes with it. D-36's lean is judged in E-38.
**Verdict:** replace — D-6 records the recursion derivation (the model call is a headless Claude Code run in the same repository, whose configured hooks fire, so without a guard the oracle re-enters itself) and drops "ships high", keeping the bar and combinator as properties calibrated on measured false-fire and value.
**Would be wrong if:** The model call ran with hooks disabled by construction, or a checked source fixed a high initial bar as correct practice for this kind of tool.

### E-20
**Units:** SP-200-12-Decisions-made-while-D-7
**Question:** D-7/D-8: only an evidentiary corpus floor, no adoption window. Is it backed?
**Facts:**
- The line. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L795-L795]] "**D-7, D-8 — Only an evidentiary corpus floor, no adoption window** (FR-A6)."
- FR-A6, which it points to, carries the reason. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L249-L250]] "**No first-N-sessions / adoption window** (that would be the"
- OL-C1. [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L67-L67]] "either the information its giving the agent is important, or its not."
**Standard:** OL-C1; co-change mining needs a minimum of evidence to be more than coincidence (ROSE's support/confidence thresholds, §9).
**Reasoning:** An adoption window silences the tool for a number of sessions regardless of what it knows — an arbitrary limit OL-C1 bars. A corpus floor is different: below it, history carries too little evidence to support a fact, so the history genres have nothing worth saying; that is the bar at work, not a cap. The entry points to FR-A6 where both reasons are written with their sources.
**Alternatives:** An adoption window — barred by OL-C1. No floor at all — history genres would speak on coincidence, contradicting the noise floor (FR-A5a).
**Consequences:** AC-6 tests it.
**Verdict:** keep — backed by OL-C1 and the evidentiary reason written at FR-A6.
**Would be wrong if:** OL-C1 were limited to token budgets and did not reach session-count gates.

### E-21
**Units:** SP-201-12-Decisions-made-while-D-9
**Question:** D-9: the one in-tree write is `init` wiring. Is the exception backed against the alternatives?
**Facts:**
- The entire entry. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L796-L796]] "**D-9 — The one in-tree write is `init` wiring** (P8)."
- P8 points back to D-9. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L147-L147]] "**P8 — The repository tree stays pristine** except explicit `init` wiring `[D-9]`."
- The no-mutation half has owner-confirmed rationale (OL-3's recorded corollary). [[middleware/context-oracle/RETHINK.md@ec3b057:L326-L328]] "it never mutates the repo and never prevents an action"
- Claude Code reads hooks from a user-scope file outside every repository. [[https://code.claude.com/docs/en/settings.md]] "You, in every project on this machine"
- It also has a project-local file kept out of git. [[https://code.claude.com/docs/en/settings.md]] "You, in this one project only. Claude Code keeps it out of git when it creates the file"
**Standard:** Acceptable-decision test conditions 2 and 5 (backing written; better than the alternatives).
**Reasoning:** (1) "Never mutates the repo" is backed by OL-3's recorded corollary. (2) The exception — writing hook wiring into the tree — has no reasoning: the entry and P8 cite each other. (3) The alternatives are real: user-scope wiring (`~/.claude/settings.json`) writes nothing in any repository and would let the tree stay fully pristine, at the cost of the hook running in every project (it would have to check whether the current repo is registered and stay silent otherwise); project-local wiring is inside the tree but kept out of git; shared-project wiring is inside the tree and committed. Which of these is correct turns on costs this audit has no measurement for (shim start-up cost in unregistered projects, failure blast radius across projects) and on whether an in-tree but git-excluded file counts as "in the tree" for P8.
**Alternatives:** As listed; none can be chosen from sources alone.
**Consequences:** AC-7 (SP-247) and AC-2 (SP-236) test the in-tree write; they follow whichever wiring is chosen.
**Verdict:** undetermined — the no-mutation half is backed (OL-3's corollary), but the `init` exception has no comparison against user-scope or project-local wiring; missing: a written comparison of the three wiring scopes, with the per-project start-up cost of a user-scope hook measured.
**Would be wrong if:** A source showed hooks can only be configured in a repository's shared `.claude/settings.json`.

### E-22
**Units:** SP-202-12-Decisions-made-while-D-12
**Question:** D-12: Phase A logs uptake but makes no automated uptake judgment; its calibration input is the human CLI correction. Can the human channel it names actually operate for this owner?
**Facts:**
- The entry. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L797-L798]] "calibration input"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L798-L798]] "is the human CLI correction."
- §5.2 makes it Phase A's only calibration input. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L254-L255]] "the calibration input from Phase A is the human CLI correction (FR-D4/FR-L6);"
- Whispers are injected as hook context, which the owner does not see in the chat. [[https://code.claude.com/docs/en/hooks.md]] "Claude reads the reminder on the next model request, but it doesn't appear as a chat message in the interface."
- OL-11: Max Cogar is a non-programmer by design. [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L49-L49]] "You are a non-programmer by design."
- OL-10. [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L48-L48]] "it could fail a hundred ways in front of me and I wouldn't know."
- The founding rationale had the human correction arrive in chat, not by CLI. [[middleware/context-oracle/RETHINK.md@ec3b057:L246-L249]] "no override ritual; the user saying it"
**Standard:** Acceptable-decision test condition 6 (no conflict with the ledger); the raise-flaws rule (a requirement that cannot operate as written is a correctness flaw).
**Reasoning:** (1) To correct a false whisper, the corrector must see the whisper and judge it. (2) Whispers are not shown in the chat interface; Max Cogar would have to read them through `ctxoracle log` and judge whether, for example, a coupling claim is false — a programming judgment OL-11 says he does not make. (3) So Phase A's only calibration input depends on a person who, by the ledger's own terms, is not positioned to supply it; the likely result is no corrections, a bar never calibrated, and a `status` that reads as healthy — the OL-10 failure. (4) The fix is not derivable from sources: options include deterministic uptake proxies (did the agent open the pointed file or run the named test after the whisper), corrections by the working agent, or corrections by Max Cogar in chat as RETHINK §8 described. Choosing who supplies calibration, and whether Max Cogar's time is spent on it, is his call (OL-11 defines his role).
**Alternatives:** As listed in (4); none can be picked from the documents.
**Consequences:** FR-L6, FR-D4, §5.2's calibration sentence, D-4 (E-17), and AC-2c's under-fire answer-drift clause depend on this answer.
**Verdict:** undetermined — owner decision, goes to Max Cogar: who supplies Phase A's calibration signal (him via the CLI, him in chat, the working agent, or deterministic uptake proxies); the current line assumes he labels whispers he cannot see in the chat and, by OL-11, is not positioned to judge. Missing: his answer.
**Would be wrong if:** Max Cogar confirmed he reads `ctxoracle log` and will label whispers there.

### E-23
**Units:** SP-203-12-Decisions-made-while-D-15
**Question:** D-15/C-6: language coverage broad and extensible, "grounded on the mission (language-general) and the anti-arbitrary-limit principle `[OL-C1]`". Is OL-C1 the right backing?
**Facts:**
- The grounding. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L800-L802]] "Grounded on the mission (language-general) and the"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L802-L802]] "anti-arbitrary-limit principle `[OL-C1]`."
- OL-C1 is about whether to speak. [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L67-L67]] "Whether to speak is decided solely by whether the information is important"
- What Max Cogar actually said about languages. [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L82-L84]] "(\"i dont know what it should cover. but"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L83-L84]] "probably more than just lik 3 of"
- OL-C7 bars widening a specific statement into a broader rule. [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L73-L73]] "a statement Max makes about one specific thing, in specific context, must never be written down as a broader project rule than what he actually said"
**Standard:** OL-C7 (quoted); acceptable-decision test condition 4 (the backing supports this decision, not a neighbouring one).
**Reasoning:** (1) OL-C1 was said about arbitrary limits gating whether the oracle speaks (token/count budgets). (2) Applying it to which languages the indexer supports widens his statement to a new subject — the OL-C7 failure. (3) The decision itself is supported by what he did say about languages (more than about three, and not his to choose) together with the mission (a decision-changing fact is not language-specific), and by the engineering reason that a language-agnostic interface makes additions configuration.
**Alternatives:** Keep OL-C1: over-generalises his words. Cite the ledger's language note and the mission: accurate.
**Consequences:** C-6 (L540–544) carries the same `[OL-C1]` grounding and falls with it; AC-17 (SP-258).
**Verdict:** replace — ground D-15/C-6 on the ledger's recorded language answer (the choice handed to the agent, "probably more than just lik 3") and the mission, and drop `[OL-C1]` as backing.
**Would be wrong if:** A CONFIRMED entry recorded Max Cogar applying OL-C1 to language coverage.

### E-24
**Units:** SP-204-12-Decisions-made-while-D-16
**Question:** D-16: per-consumer subagent delivery. Is it backed by the ledger and the harness?
**Facts:**
- The line. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L803-L803]] "**D-16 — Per-consumer subagent delivery** `[OL-8, HOOKS]`."
- OL-8. [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L46-L46]] "Subagent whisper delivery is in v1 scope (revises OL-5)."
- The harness identifies which subagent a hook fires in. [[https://code.claude.com/docs/en/hooks.md]] "Present only when the hook fires inside a subagent call. Use this to distinguish subagent hook calls from main-thread calls."
**Standard:** SPEC-BRIEF kind 1 (OL-8) with the harness fact checked against the current hooks reference.
**Reasoning:** OL-8 puts subagent delivery in scope; to deliver to a subagent without leaking into another consumer's dedup state, delivery must be keyed by the consumer, and the hook input carries `agent_id` exactly for that. Both backings are real and specific.
**Alternatives:** Main-agent only — contradicts OL-8. One shared dedup set — would suppress a fact for a subagent because the main agent was told it.
**Consequences:** AC-15 tests it.
**Verdict:** keep — OL-8 plus the documented `agent_id` field.
**Would be wrong if:** The hook input stopped carrying `agent_id` inside subagents.

### E-25
**Units:** SP-205-12-Decisions-made-while-D-18
**Question:** D-18: equal genre base weight; decision-impact carries no intent term because intent enters via the trigger. Is each half backed?
**Facts:**
- The entry. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L804-L805]] "**D-18 — Equal genre base weight; decision-impact carries no intent term because intent"
- §5.1 carries the intent reason. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L212-L214]] "carries no intent term *because intent is carried here, by the"
- The reason for equal weights is recorded in the collapse-log, not here. [[middleware/context-oracle/docs/collapse-log.md@ec3b057:L842-L844]] "**Lesson: no ranking claim about this tool's purposes, genres,"
- OL-C2's non-primary statement. [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L68-L68]] "THIS IS NOT THE PRINARY ROLE OF THE ORACLE"
**Standard:** CLAUDE.md: "`[D-n]` with reasoning in spec §12".
**Reasoning:** (1) The no-intent-term half gives its reason in the entry: intent already selects candidates through the trigger, so a second intent term would count it twice. (2) The equal-weight half gives none. Its actual backing is that no owner statement ranks genres and an agent-made ranking was a logged failure (collapse-log 2026-08-01, lesson 1), with OL-C2 ruling out primacy for the corrective feature. The entry should say so.
**Alternatives:** Genre weights set by agents — a ranking without an owner statement, the logged failure. Equal weights — the only choice without an owner ranking.
**Consequences:** FR-A5 cites D-18 for the no-genre-term rule; it inherits the reason.
**Verdict:** replace — add to D-18 the reason for equal base weight: no CONFIRMED owner statement ranks genres, and agent-made rankings are the failure recorded in collapse-log 2026-08-01 lesson 1 (with OL-C2 for the corrective feature).
**Would be wrong if:** A CONFIRMED entry ranked the genres.

### E-26
**Units:** SP-206-12-Decisions-made-while-D-20
**Question:** D-20: "session boundaries are not context boundaries" backs FR-A4's rules (resume/fork reseed, compact clears the read-set, clear/startup clean). Is the entry reasoned, and does the compact rule match what compaction does?
**Facts:**
- The entire entry. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L806-L806]] "**D-20 — Session boundaries are not context boundaries** (FR-A4)."
- FR-A4 clears only the read-set on compact; the delivered-set survives. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L222-L224]] "`compact` (clear read-set)"
- On resume, Claude Code replays injected hook text, so earlier whispers are still in context. [[https://code.claude.com/docs/en/hooks.md]] "Claude Code replays the saved text rather than re-running the hook for past turns"
- Compaction discards hook-injected context: for SubagentStart context, after auto-compaction the doc says "discards that copy" and Claude Code re-injects. [[https://code.claude.com/docs/en/hooks.md]] "discards that copy, Claude Code injects the next run's context again."
- The hook input reports compaction as a session source. [[https://code.claude.com/docs/en/hooks.md]] "\"compact\" after compaction"
- FR-D5: dedup is against what the consumer "has been told or has visibly incorporated". [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L197-L198]] "told or has visibly incorporated (FR-A4)."
**Standard:** CLAUDE.md: "`[D-n]` with reasoning in spec §12"; the mission ("Deliver the fact ... at the moment of that decision"); fail-fast visibility is not at issue here — correctness of the dedup premise is.
**Reasoning:** (1) The entry states a slogan with no reasoning. (2) The slogan is right for resume and fork: the harness replays injected text, so the agent still holds earlier whispers and dedup should carry over. (3) It is wrong for compaction: compaction is a context boundary, and Claude Code's own design treats hook-injected context as discarded by it (it re-injects SubagentStart context after compaction). Keeping the delivered-set across `compact` means a fact the agent no longer holds is never re-delivered — the mission failure FR-D5's "has been told" premise hides. (4) The correct rule follows: on `compact`, both the read-set and the delivered-set are cleared, because neither can still be shown to be in the agent's context.
**Alternatives:** (a) Keep the delivered-set on compact — silent loss of delivered facts. (b) Clear both on compact — may repeat a fact the summary kept, a small noise cost the dedup rule exists to avoid only when the fact is actually still held. (b) matches the harness's own behaviour.
**Consequences:** FR-A4 (L222–224) and AC-5 (SP-245) change with it.
**Verdict:** replace — D-20 states its reasoning: resume/fork keep context (the harness replays injected text) so dedup reseeds; compaction discards injected context (as the harness itself treats it) so on `compact` both the read-set and the delivered-set are cleared.
**Would be wrong if:** Claude Code documented that compaction preserves hook-injected `additionalContext` verbatim in the compacted context.

### E-27
**Units:** SP-207-12-Decisions-made-while-D-21
**Question:** D-21: degraded mode is separated from build phase; D-21b: `log` readback required. Are the reasons written?
**Facts:**
- The entry. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L807-L808]] "**D-21 — Degraded mode separated from build phase** (FR-J3). **D-21b —** `log` readback"
- FR-J3 cites only D-21. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L624-L624]] "**FR-J3 — Degraded mode is a runtime fallback, not a build stage** `[D-21]`."
- OL-2: the degraded mode exists for when the model path is unavailable (air-gap). [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L40-L40]] "a deterministic degraded mode is mandatory for air-gap."
- FR-M5 carries D-21b's backing. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L288-L289]] "the whisper/block audit trail read back per session"
**Standard:** CLAUDE.md: "`[D-n]` with reasoning in spec §12". BRIEF: the spec's one legitimate degraded mode is FR-J2/J3/AC-12.
**Reasoning:** (1) D-21's decision is sound and derivable: OL-2's degraded mode answers a runtime condition (the model path is down), which can occur in any phase; if it were a build stage, a model-free Phase A could be mistaken for "degraded mode done", and Phase B/C builds would have no specified behaviour when the model fails. (2) The entry and FR-J3 do not write that reasoning; they cite each other. (3) D-21b is backed where it points: FR-M5 cites OL-10 and FR-X6.
**Alternatives:** Treat degraded mode as Phase A — confuses a runtime property with a build stage, as in (1).
**Consequences:** FR-J3 inherits the reason; AC-12 tests it.
**Verdict:** replace — D-21 records its reason: OL-2's degraded mode answers a runtime condition (model path unavailable) that can arise in any phase, so it is a runtime property of every phase's build, not a stage; D-21b stays as is.
**Would be wrong if:** OL-2's degraded mode were defined as a build configuration rather than a runtime condition.

### E-28
**Units:** SP-208-12-Decisions-made-while-D-22
**Question:** D-22: correct silence is announced. Is it backed?
**Facts:**
- The line. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L809-L809]] "**D-22 — Correct silence is announced** (FR-M3)."
- FR-M3 carries the reason and the owner source. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L274-L276]] "(so working-silence is not"
- OL-10. [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L48-L48]] "it could fail a hundred ways in front of me and I wouldn't know."
**Standard:** OL-10; fail-fast visibility (a silent tool and a broken tool must be distinguishable).
**Reasoning:** A tool whose default is silence (P1) looks identical to a dead tool unless it reports that it ran and chose silence. OL-10 requires the owner to be able to tell. FR-M3, which the entry points to, states that reason and scopes the announcement to owner-facing surfaces so the agent's context stays clean (P1/P3).
**Alternatives:** No announcement — violates OL-10. Announce to the agent — re-noises the channel.
**Consequences:** None.
**Verdict:** keep — OL-10's requirement, reasoned at FR-M3.
**Would be wrong if:** OL-10 did not cover silent operation.

### E-29
**Units:** SP-209-12-Decisions-made-while-D-23
**Question:** D-23: requirement IDs are stable mnemonics with intentional gaps. Is the reason recorded?
**Facts:**
- The line. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L810-L810]] "**D-23 — Requirement IDs are stable mnemonics with intentional gaps.**"
- Its reason, citation resolution for older documents, is written where it applies. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L467-L468]] "**Retired requirement IDs (citation resolution) `[D-23]`.** Older documents"
- The project's CI checker fails a PR on a retired ID cited as live, which needs stable IDs. [[middleware/context-oracle/CLAUDE.md@ec3b057:L258-L258]] "that doesn't exist, a spec-section reference that doesn't exist, a retired"
**Standard:** Traceability practice: requirement identifiers are not reused or renumbered so that references stay valid (the reason the retired-ID paragraph exists).
**Reasoning:** Renumbering would silently re-point every citation in reviews, the architecture and the plan. Stable IDs with gaps keep them valid; the retired-ID paragraph applies this and the checker enforces it.
**Alternatives:** Renumber for tidiness — breaks citations.
**Consequences:** None.
**Verdict:** keep — stable IDs, reason and enforcement written down.
**Would be wrong if:** The project renumbered IDs without breaking references (it cannot).

### E-30
**Units:** SP-210-12-Decisions-made-while-D-25
**Question:** D-25: promotion/re-exploration is required, not just demotion. Is it backed?
**Facts:**
- The line. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L811-L811]] "**D-25 — Promotion/re-exploration required, not just demotion** (FR-L3b)."
- FR-L3b carries the derivation. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L650-L652]] "channel is periodically re-admitted to re-measure value and re-promoted when earned;"
- OL-C1: a malfunction is surfaced, never handled by suppressing whispers. [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L67-L67]] "a malfunction is surfaced by diagnostics, never by suppressing whispers."
**Standard:** Derivation: a demoted channel produces no deliveries, so no new evidence about its value can arrive; demotion without re-admission is therefore irreversible.
**Reasoning:** (1) Demotion removes a channel's output. (2) With no output there is no uptake or false-fire evidence for it. (3) Without evidence it can never be re-promoted, so each demotion is permanent and the loop drifts only toward silence. (4) Periodic re-admission is the minimum that breaks this. FR-L3b states (1)–(4) in short form; OL-C1 forbids converging to suppression.
**Alternatives:** Demotion only — the ratchet.
**Consequences:** AC-16 tests it.
**Verdict:** keep — a shown derivation plus OL-C1.
**Would be wrong if:** Demoted channels still produced measurable evidence while suppressed.

### E-31
**Units:** SP-211-12-Decisions-made-while-D-26
**Question:** D-26: Orientation delivers entry points, not task-shape landmines. Is it backed, given the later finding on when edit-time whispers reach the agent?
**Facts:**
- The line. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L812-L812]] "**D-26 — Orientation delivers entry-points, not task-shape landmines.**"
- FR-A2a states the reason. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L165-L165]] "Task-shape landmines are NOT delivered here — they belong at the edit (FR-A2e) `[D-26]`."
- The coordinator ruling checked edit-time delivery against the mission and kept the edit trigger. [[middleware/context-oracle/docs/reviews/2026-09-28-branch-audit-coordinator-rulings-schema-and-edit-timing.md@HEAD:L79-L81]] "The warning arrives"
**Standard:** The mission's "at the moment of that decision" (P6).
**Reasoning:** A landmine matters to the decision about editing a specific region; at prompt time the agent has not chosen the region, so the fact would arrive early and decay (P6, RETHINK §2.4). The ruling of 2026-09-28 found that an edit-time whisper reaches the agent with the edit's result, and that this is still the decision point (keep, revise, run tests); the rationale for D-26 therefore survives that correction.
**Alternatives:** Deliver landmines at orientation — early, unanchored to the region. At read time — a separate genre question settled by the branch audit.
**Consequences:** None beyond FR-A2e's own wording (another part).
**Verdict:** keep — right-moment reasoning written at FR-A2a, and it survives the timing ruling.
**Would be wrong if:** An edit-time whisper could not reach the agent until after its next decision.

### E-32
**Units:** SP-212-12-Decisions-made-while-D-27
**Question:** D-27: Phase A's completion check catches "claimed done but test not run"; the general "unfinished" case routes to Phase B. Is the phasing reasoned?
**Facts:**
- The entry. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L813-L814]] "the general \"unfinished\""
- OL-12's concrete need is exactly the general case. [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L50-L50]] "did not finish their work but still stopped anyway."
- OL-12 leaves the mechanism to design. [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L50-L50]] "*What the oracle does to catch it is design, not owner wording.*"
- FR-A2m states why the general case needs a scope referent and judgment. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L175-L175]] "\"Incomplete\" is judged **relative to a named scope referent**"
**Standard:** CLAUDE.md: "`[D-n]` with reasoning in spec §12"; FR-A2's phasing rule (model-free vs model-dependent).
**Reasoning:** (1) Sequencing is the agents' (OL-11) and OL-12 leaves the mechanism to design, so phasing is an engineering choice. (2) The general case means judging the work against a free-text referent (the prompt, a plan), which is the same comprehension class D-41 routes to the model — so by FR-A2's rule it is Phase B. The unrun-covering-test case is decidable from the covering-test map and the command log, so it is Phase A. (3) The entry states the split and calls it "a coverage limit on OL-12" but does not state reason (2), and it should say that the owner's concrete need is the deferred part, so no reader takes Phase A's check as meeting OL-12.
**Alternatives:** Deterministic partial checks of "unfinished" in Phase A (for example, plan steps whose named files were never touched) — a real option, but each needs its own backing; none is claimed here.
**Consequences:** FR-A2g/FR-A2m unchanged.
**Verdict:** replace — D-27 records its reason (judging "unfinished" against a free-text scope referent is comprehension, model-dependent under FR-A2's rule; the unrun-covering-test case is decidable model-free) and states that OL-12's concrete need is the Phase B part.
**Would be wrong if:** The general "unfinished" case were decidable deterministically against a structured referent the spec requires.

### E-33
**Units:** SP-213-12-Decisions-made-while-D-31
**Question:** D-31: the latency numbers (p95 ≤ 1.5 s, ceiling 3 s) are an engineering judgment. Is the judgment backed?
**Facts:**
- The entire entry. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L815-L815]] "**D-31 — Latency numbers (1.5s/3s) are an engineering judgment**, not the owner's."
- NF-1 carries the numbers and cites only D-31 for them. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L535-L539]] "The numbers are `[D-31]`, not the owner's;"
- The project rule on numbers. [[middleware/context-oracle/CLAUDE.md@ec3b057:L222-L224]] "Numbers without sources"
**Standard:** CLAUDE.md "Numbers without sources don't go in"; acceptable-decision test condition 2.
**Reasoning:** (1) The entry says who owns the numbers, not why they are right. (2) Nothing in the spec, §9 or §12 derives 1.5 s or 3 s: no measurement of hook overhead, no source on acceptable per-tool-call delay for an agent loop. (3) Some budget is needed (a model call must stay off the synchronous path, and fail-open needs a ceiling), so the requirement's existence is sound; the values are not established. (4) This audit has no measurement or source that fixes the correct values.
**Alternatives:** Values set from a measured baseline of per-event hook and tool-call durations; values from a cited human-response-time source — neither is present.
**Consequences:** NF-1 and AC-10 (SP-251) carry the numbers.
**Verdict:** undetermined — the budget's existence is backed, the values 1.5 s/3 s are not; missing: a measurement of hook overhead against tool-call durations, or a cited source, from which the values are derived.
**Would be wrong if:** A written derivation of 1.5 s/3 s existed in the spec's review record.

### E-34
**Units:** SP-214-12-Decisions-made-while-D-32
**Question:** D-32: the blocking model is exactly Max Cogar's two cases, as a reactive `PreToolUse` deny. Is it the ledger, and is the mechanism real?
**Facts:**
- The line. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L816-L818]] "**D-32 — The blocking model is exactly Max's two cases, realised as a `PreToolUse`"
- OL-C3. [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L69-L69]] "the oracle should block that motherfucker until it stops ignoring me and actually answers."
- OL-C2's escalation. [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L68-L68]] "THEN THEY SHOULD BE FUCKING BLOCKED."
- The mechanism: a `PreToolUse` hook can block the call. [[https://code.claude.com/docs/en/hooks.md]] "Before a tool call executes. Can block it"
**Standard:** SPEC-BRIEF kind 1; mechanism checked against the current hooks reference.
**Reasoning:** The two cases, the reactive character and the exclusion of the pre-emptive gate and the generated-file block are all CONFIRMED. The mechanism — deny the deviating tool call before it runs — exists in the current contract. The entry marks blocking as an owner objective, not a mission derivation, which is accurate.
**Alternatives:** None that keep the ledger.
**Consequences:** None.
**Verdict:** keep — the ledger's two blocks on a documented mechanism.
**Would be wrong if:** `PreToolUse` lost the ability to block.

### E-35
**Units:** SP-215-12-Decisions-made-while-D-33
**Question:** D-33: Node.js is the runtime by engineering choice, to get an in-runtime SQLite satisfying C-3, "using the language the Claude Code tooling ecosystem already assumes". Are its premises true, and does it beat the alternatives?
**Facts:**
- The premise. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L826-L827]] "using the language the Claude Code tooling ecosystem already assumes."
- Claude Code does not use Node.js at runtime; its recommended install is native, and the npm package downloads a native binary. [[https://code.claude.com/docs/en/setup.md]] "the package downloads a native binary that doesn't use your Node.js at runtime"
- C-1 rejects Python for weaker store options. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L519-L520]] "they are rejected for weaker cold-start/no-toolchain store options"
- In this cold container, Python's standard-library SQLite creates an FTS5 table with no toolchain, as does Node's. [[ran]] `python3 --version; python3 -c "import sqlite3;c=sqlite3.connect(':memory:');c.execute('create virtual table t using fts5(x)');print('py fts5 ok', sqlite3.sqlite_version)"` → `Python 3.11.15` / `py fts5 ok 3.45.1`
- [[ran]] `node --version; node -e "const {DatabaseSync}=require('node:sqlite');const d=new DatabaseSync(':memory:');d.exec('create virtual table t using fts5(x)');console.log('node fts5 ok')" 2>/dev/null` → `v22.22.2` / `node fts5 ok`
**Standard:** Acceptable-decision test conditions 3 (the backing is real) and 5 (better than the alternatives); CLAUDE.md: verify harness facts against current primary sources.
**Reasoning:** (1) The ecosystem premise is false against the current setup page: Claude Code neither requires nor uses Node.js at runtime, so Node.js ≥ 22.13 is not guaranteed present where Claude Code runs; C-3 (no prebuilt-binary download) then depends on the container already having a suitable Node. (2) The comparison with Python rests on "weaker store options", but Python's standard-library SQLite with FTS5 worked here with no toolchain, exactly like `node:sqlite`. (3) So neither premise that distinguishes Node from Python holds as written. Node may still be a sound choice, but the reason that makes it better has not been stated or checked, and this audit cannot supply it (it would need which runtimes Max Cogar's target environments carry, and at which versions).
**Alternatives:** Node.js with `node:sqlite`; Python with standard-library `sqlite3`; either with a check of the target containers. Not decidable from the facts gathered.
**Consequences:** C-1 (L514–521) carries the same premises. The code built on this branch is Node; the audit does not judge that code here.
**Verdict:** undetermined — the "Claude Code ecosystem assumes Node" premise is false (setup page) and C-1's Python rejection is contradicted by execution, so D-33's stated reasons do not hold; missing: the runtimes and versions present in Max Cogar's target environments, from which the choice would be derived.
**Would be wrong if:** The target environments were shown to ship Node.js ≥ 22.13 and not Python 3, or Python's `sqlite3` lacked FTS5 there.

### E-36
**Units:** SP-216-12-Decisions-made-while-D-34
**Question:** D-34: Stop-time whisper delivery is a single self-releasing injection via the Stop `additionalContext` channel, distinct from the blocks. Is the channel real and the quotation exact?
**Facts:**
- The line quotes the contract. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L832-L833]] "\"feedback, continuing the interaction, not an error\""
- The Week 23 digest (June 1–5, 2026) records the channel in these words. [[https://code.claude.com/docs/en/whats-new/2026-w23.md]] "can return hookSpecificOutput.additionalContext to give Claude feedback and keep the turn going instead of being treated as an error"
- The hooks reference bounds it like a block continuation. [[https://code.claude.com/docs/en/hooks.md]] "Claude Code applies an 8-consecutive-continuation cap"
- The quoted words do not occur in the hooks reference. [[ran]] `python3 /tmp/claude-0/-home-user-agent-armory/779c0f74-86b0-5e8f-b02d-811e78ed3f66/scratchpad/audit/webquote.py https://code.claude.com/docs/en/hooks.md "feedback, continuing the interaction, not an error"; echo $?` → `1`
**Standard:** BRIEF citation rule: text in quotation marks must be the source's exact words. OL-12 (the oracle speaks at a done-claim) and FR-B1's "exactly two blocks".
**Reasoning:** (1) The decision is sound: the channel exists (Week 23), continues the turn without an error label, and is bounded by `stop_hook_active` and the 8-continuation cap, so a single injection that always releases is delivery, not a third block. (2) The quotation marks enclose words no source contains; they paraphrase the digest. A paraphrase presented as a quote is a citation defect in the spec of record.
**Alternatives:** `decision: "block"` + `reason` — shown as a hook error; the `additionalContext` form is cleaner, as the entry says.
**Consequences:** FR-B4's quotation (L409–410, another part) should be checked the same way.
**Verdict:** replace — keep the decision; replace the quoted phrase with the digest's exact words ("to give Claude feedback and keep the turn going instead of being treated as an error", Week 23, 2026-06-01–05) or drop the quotation marks.
**Would be wrong if:** The quoted phrase appears verbatim in a current Claude Code source.

### E-37
**Units:** SP-217-12-Decisions-made-while-D-35
**Question:** D-35: the two blocks have different cost functions, so each has its own precision posture and its own under-fire guard. Is the reasoning sound and backed?
**Facts:**
- The line. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L838-L841]] "the **human channel** for answer-drift (Max sees his own unanswered question) and"
- OL-11: Max Cogar cannot see a skipped skill step (non-programmer). [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L49-L49]] "You are a non-programmer by design."
- OL-C3: an unanswered question of his is something he notices. [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L69-L69]] "if i ask a question, then it needs to be answered."
**Standard:** Error-cost asymmetry: a classifier's threshold is set by the relative cost of its two error types; an unobservable error needs an automated monitor (fail-fast visibility, Shore 2004).
**Reasoning:** (1) For answer-drift a wrongful deny costs one answer the agent owed anyway; a miss is visible to Max Cogar because it is his own question. (2) For skill conformance a wrongful deny halts work mid-skill; a miss is invisible to him (OL-11). (3) So the postures differ and the guards differ: human where the miss is visible, automated where it is not. The entry states this, and ties the automated guard to a signal independent of the recognizer.
**Alternatives:** One shared posture — would either halt compliant agents in skills or let answer-drift misses pass unguarded.
**Consequences:** The form of the human channel is D-12's open owner question (E-22); the automated guard's fallback flaw is FR-C4's (E-8). Neither changes D-35's reasoning.
**Verdict:** keep — a stated cost asymmetry grounded in OL-11 and OL-C3.
**Would be wrong if:** Max Cogar could observe skipped skill steps directly.

### E-38
**Units:** SP-218-12-Decisions-made-while-D-36
**Question:** D-36: the loop measures false silence (regret), not only false speech; "the silence-is-costlier asymmetry is a mission-derived judgment". Is the requirement backed, and is the ranking?
**Facts:**
- The ranking. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L847-L848]] "The silence-is-costlier asymmetry is a **mission-derived judgment**."
- FR-L4 states it as a ranking. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L656-L657]] "costliest **value** failure"
- The spec also ships the bar high, a lean toward silence. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L253-L253]] "**The bar ships high and is calibrated.**"
- The anti-ratchet reason the regret signal serves. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L846-L848]] "so the tool cannot converge to silence and still"
**Standard:** Measurement practice for a recommender: precision alone cannot detect missed recommendations; recall-side (miss) measurement is needed alongside it. Derivation shown below.
**Reasoning:** (1) The requirement — measure held-but-unspoken facts — is backed by a derivation: FR-L3/L6 only see whispers that were spoken; a loop fed only those signals can lower false speech by speaking less and will read as improving while it goes quiet; a miss signal is the only thing that shows that drift. (2) The ranking "silence is costlier" is not derived: the mission says to deliver the decision-changing fact, which makes a miss a failure, but it says nothing that makes a miss cost more than a false whisper, and the false-whisper cost (noise the agent learns to ignore) is equally a mission cost. (3) The spec holds the ranking beside "the bar ships high", which leans the other way, without reconciling them. (4) The requirement needs only (1); the ranking adds an unbacked claim that conflicts with another line.
**Alternatives:** Keep the ranking — unbacked and in conflict with §5.2. Keep the requirement on the derivation alone — sufficient.
**Consequences:** FR-L4 (L653–659) drops the "costliest" ranking with it; E-19 removes "ships high".
**Verdict:** replace — D-36 keeps the regret requirement on its derivation (a loop fed only by spoken-whisper signals can reduce error by going silent and still read as healthy, so a miss signal is required) and drops the "silence is costlier" ranking.
**Would be wrong if:** A CONFIRMED owner statement or a cited source ranked a miss above a false whisper for this tool.

### E-39
**Units:** SP-219-12-Decisions-made-while-D-37
**Question:** D-37: off-path (model) genres carry a bounded-lateness property — deliver at the next relevant decision event or drop. Is it backed?
**Facts:**
- The line. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L851-L853]] "deliver at the next relevant"
- The mission's timing clause. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L34-L35]] "at the moment of"
- RETHINK §3 excludes the post-hoc linter posture. [[middleware/context-oracle/RETHINK.md@ec3b057:L90-L91]] "not a linter (that is"
**Standard:** The mission; FR-D1's no-rumor rule for the re-validation half (FR-J5).
**Reasoning:** A model-computed whisper arrives later than the narration that triggered it; without a bound it could arrive after the decision it concerned, which is the post-hoc posture the founding definition excludes and the mission's timing clause forbids. Delivering at the next event where it is still relevant, or dropping it, is the minimum property that keeps the timing clause true.
**Alternatives:** Deliver whenever computed — post-hoc. Put the model on the synchronous path — breaks the latency budget.
**Consequences:** AC-25 tests it.
**Verdict:** keep — derived from the mission's timing clause.
**Would be wrong if:** The mission had no timing clause.

### E-40
**Units:** SP-220-12-Decisions-made-while-D-38
**Question:** D-38: completion-claim recognition is a classification with error modes, not a field read; `last_assistant_message` is an input. Is the harness fact right?
**Facts:**
- The line. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L855-L856]] "`last_assistant_message`"
- The hooks reference: the Stop input carries the final response text. [[https://code.claude.com/docs/en/hooks.md]] "The last_assistant_message field contains the text content of Claude's final response, so hooks can access it without parsing the transcript file."
**Standard:** Classification practice: a text-to-label mapping has false positives and negatives; the spec must name its lean.
**Reasoning:** The field gives the text, not whether the text claims completion; deciding that is a classification that can misfire, and the entry names its lean (toward silence) and leaves the mechanism to the architect. The harness fact is current.
**Alternatives:** Treating every Stop as a done-claim — fires on ordinary stops, against P5.
**Consequences:** None.
**Verdict:** keep — correct harness fact, correctly framed as a classification.
**Would be wrong if:** The Stop input carried a structured "completion claimed" flag.

### E-41
**Units:** SP-221-12-Decisions-made-while-D-39
**Question:** D-39: the answer-drift trigger is OL-C5; the one preserved property is that an action taken to provide the answer is never denied. Is it the ledger?
**Facts:**
- The line. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L861-L862]] "**an action taken to provide the answer (a"
- OL-C5. [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L71-L71]] "if i ask a question and their next move isnt a direct answer or them taking actions to provide an answer, then then need corrected"
**Standard:** SPEC-BRIEF kind 1.
**Reasoning:** OL-C5 names two acceptable next moves; D-39 preserves the second explicitly, which follows from his words, and states why (no deadlock on the path to a truthful answer). OL-R5 rejected defining the trigger by exclusion; D-39 defines it positively.
**Alternatives:** None that keep his words.
**Consequences:** None.
**Verdict:** keep — OL-C5 recorded faithfully.
**Would be wrong if:** OL-C5 excluded answer-gathering actions.

### E-42
**Units:** SP-222-12-Decisions-made-while-D-41
**Question:** D-41 phases the answer-drift recognizer and, because the answer text is read from a lagging `transcript_path` and an async classifier, makes the block hold in the lag window, claiming "a wrongful hold self-recovers in one round-trip". Is the lag design backed, and was the alternative source of the answer text considered?
**Facts:**
- The lag clause. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L871-L873]] "The cached state is eventually-consistent; in its lag window the block holds"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L873-L873]] "a wrongful hold self-recovers in one round-trip, a missed drifter does not"
- FR-B1 names the transcript as the lagging source. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L372-L373]] "(`transcript_path` is written"
- The docs give no bound on the lag. [[https://code.claude.com/docs/en/hooks.md]] "The transcript file is written asynchronously and may lag the in-memory conversation"
- A hook event delivers assistant text to hooks as it is displayed (added in 2.1.152, May 27, 2026 — before the spec's 2026-08-25 verification). [[https://code.claude.com/docs/en/hooks.md]] "MessageDisplay doesn't support matchers and fires for every assistant message that streams text"
- [[https://code.claude.com/docs/en/changelog.md]] "Added a MessageDisplay hook event that lets hooks transform or hide assistant message text as it is displayed"
- [[https://code.claude.com/docs/en/hooks.md]] "Claude Code holds each batch until your hook returns, so keep the hook fast."
- In headless runs it fires once per message with the full text. [[https://code.claude.com/docs/en/hooks.md]] "The single call arrives after the message completes and carries the full message text"
- Executed ordering, three runs, Claude Code 2.1.284, headless: the answer text reached a `MessageDisplay` hook before the same response's `PreToolUse`. [[ran]] in `…/specaudit/c/mdorder` (hooks on `MessageDisplay`, `PreToolUse`/`PostToolUse` for Bash, each appending event name and text to `order.log`): `claude -p --permission-mode acceptEdits --allowedTools "Bash(echo:*)" --output-format stream-json --verbose "In one single response: first write the plain-text sentence 'ANSWER-TEXT-7 is my answer.' and then, in that same response, call the Bash tool with the command: echo hi"`, run 3 times → each run logged, in order, `MessageDisplay 'ANSWER-TEXT-7 is my answer.'` then `PreToolUse 'echo hi'` then `PostToolUse 'echo hi'` (gaps 0.43 s, 0.44 s, 0.11 s between the first two)
**Standard:** Acceptable-decision test condition 5 (better than the alternatives) and 3 (backing real); CLAUDE.md "Spikes before design-freeze" for an undocumented harness ordering.
**Reasoning:** (1) Phasing the recognizer (conservative Phase A, model precision in Phase B) is backed: judging answer-directedness is comprehension (OL-C5), and the entry states it. (2) The lag-window hold exists because the answer text is read from `transcript_path`. The docs give that lag no bound, so "self-recovers in one round-trip" is an unbacked claim. (3) A documented hook, `MessageDisplay`, hands the agent's text to the oracle as it is displayed, with Claude Code waiting for the hook; in three executed headless runs the text arrived before the next `PreToolUse`. For Phase A's deterministic recognizer that removes the transcript lag instead of working around it — the hold is then a workaround for a source choice, the pattern the fail-fast rule calls a patch. (4) In Phase B the async classifier's own lag remains; there a hold is still needed, and its recovery time must be measured (FR-M2) rather than asserted. (5) Limits of the experiment: one version, headless only; the interactive ordering is not tested, though the doc says display waits on the hook.
**Alternatives:** (a) As written — transcript source, unbounded lag, asserted recovery. (b) Read the answer text from `MessageDisplay`, keep the hold only for the Phase B classifier lag, and record hold durations as an FR-M2 signal. (b) removes the cause for Phase A and keeps the honest guard for Phase B.
**Consequences:** FR-B1's lag clause (L371–381), FR-B5's lag note and FR-O2's `transcript_path` sentence (other parts) follow; §13 must list the interactive-mode ordering as an open item to spike (E-44).
**Verdict:** replace — D-41 keeps the phasing; the answer text is taken from `MessageDisplay` (documented; ordering before `PreToolUse` observed 3/3 headless on 2.1.284), the lag-window hold is limited to the Phase B classifier lag, and "self-recovers in one round-trip" is replaced by a measured hold duration recorded as an FR-M2 signal.
**Would be wrong if:** In interactive mode `MessageDisplay` were shown to fire after the next `PreToolUse`, or not to fire for text that precedes a tool call.

### E-43
**Units:** SP-223-13-What-is-genuinely-ope
**Question:** The §13 heading. Does it assert anything wrong by itself?
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L878-L878]] "## 13. What is genuinely open"
- CLAUDE.md gives §13 its job: assumptions that gate a phase, spiked before design-freeze. [[middleware/context-oracle/CLAUDE.md@ec3b057:L212-L213]] "a spec-§13 assumption that gates the phase"
**Standard:** SPEC-BRIEF kind 3.
**Reasoning:** The heading names the section's job and makes no claim of its own; whether the section's content meets that job is judged in E-44 to E-47.
**Alternatives:** None.
**Consequences:** None.
**Verdict:** keep — a section title.
**Would be wrong if:** The heading itself claimed nothing is open.

### E-44
**Units:** SP-224-13-What-is-genuinely-ope
**Question:** §13's lead says there were two external unknowns, the first now resolved, and that "neither gates v1's design". Is the list of open items complete and the "does not gate" claim true?
**Facts:**
- The claim. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L882-L883]] "neither"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L883-L883]] "gates v1's design."
- The answer-drift clear-axis design depends on how fast the agent's answer text becomes visible, which the docs leave unbounded. [[https://code.claude.com/docs/en/hooks.md]] "The transcript file is written asynchronously and may lag the in-memory conversation"
- The alternative source, `MessageDisplay`, was observed ahead of `PreToolUse` only headless (E-42's executed result); the doc states the interactive batching but not the order relative to `PreToolUse`. [[https://code.claude.com/docs/en/hooks.md]] "Claude Code holds each batch until your hook returns, so keep the hook fast."
- The second listed item (thin history) is a stated behaviour, not an unknown (E-46). [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L902-L905]] "the history-derived genres are thinner until the evidentiary corpus grows"
**Standard:** CLAUDE.md "Spikes before design-freeze" (quoted in E-43): §13 must hold the assumptions that gate a phase so they get spiked.
**Reasoning:** (1) The only item described as an external unknown is resolved. (2) A harness behaviour that does gate the Phase A answer-drift design is unlisted: the clear-axis source and its lag (D-41). Its documented part (transcript lag, no bound) and its undocumented part (interactive ordering of `MessageDisplay` against `PreToolUse`) are exactly a §13 item. (3) So "neither gates v1's design" is false for the section as it should stand, and the lead mis-files a behaviour statement as an unknown.
**Alternatives:** Leave §13 empty of live items — the spike rule then never triggers for the one assumption that needs it.
**Consequences:** E-42 (D-41) and the architecture's answer-drift section depend on the spike.
**Verdict:** replace — §13's lead lists the open external item that gates Phase A: the answer-drift clear-axis text source (transcript lag unbounded in the docs; interactive-mode ordering of `MessageDisplay` before `PreToolUse` unverified), to be spiked before design-freeze; resolved items and stated behaviours are not listed as open.
**Would be wrong if:** The hooks reference documented a bound on transcript lag, or documented `MessageDisplay` ordering in interactive mode.

### E-45
**Units:** SP-225-13-What-is-genuinely-ope
**Question:** §13's harness paragraph lists what the 2026-08-25 re-verification confirmed and notes the 2026-08-29 resolution of subagent context. Do its quotations and claims match the current hooks reference?
**Facts:**
- It says the docs call the deny reason a device so the model "avoids retrying". [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L887-L888]] "the docs' \"avoids retrying\" is a design intent"
- The current hooks reference does not contain that phrase. [[ran]] `python3 /tmp/claude-0/-home-user-agent-armory/779c0f74-86b0-5e8f-b02d-811e78ed3f66/scratchpad/audit/webquote.py https://code.claude.com/docs/en/hooks.md "avoids retrying"; echo $?` → `1`
- It quotes the parent-injection sentence. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L896-L897]] "\"to inject context back"
- The current sentence reads differently. [[https://code.claude.com/docs/en/hooks.md]] "To inject context into the parent session after a subagent returns"
- [[ran]] `python3 /tmp/claude-0/-home-user-agent-armory/779c0f74-86b0-5e8f-b02d-811e78ed3f66/scratchpad/audit/webquote.py https://code.claude.com/docs/en/hooks.md "to inject context back into the parent session"; echo $?` → `1`
- The rest checks out: the 8-continuation bound and transcript lag. [[https://code.claude.com/docs/en/hooks.md]] "Claude Code applies an 8-consecutive-continuation cap"
**Standard:** BRIEF citation rule (quotation marks enclose the source's exact words); CLAUDE.md: verify harness facts against current primary sources — "the hooks contract has drifted before and will again".
**Reasoning:** (1) The substantive claims (event set, deny reason shown to the model, Stop `additionalContext`, the continuation bound, transcript lag, subagent `agent_id`, subagent context not reaching the parent) match the current reference. (2) Two quoted phrases are no longer in it: "avoids retrying" and the parent-injection sentence's wording. A spec that quotes text the source no longer contains cannot be checked against it. (3) The deny reason is currently documented as shown to Claude, which is all FR-B2 needs; the "design intent" framing rests on a sentence that is gone.
**Alternatives:** Keep the old quotes with their old date — true of the past, unverifiable now; the spec is meant to hold current-verified premises.
**Consequences:** FR-O2, FR-B2 and §9's `[HOOKS]` row (other parts) quote "so it avoids retrying" too.
**Verdict:** replace — re-quote from the current reference with the fetch date: drop "avoids retrying" (state that the deny reason is shown to Claude), and quote the parent-injection sentence as it now reads ("To inject context into the parent session after a subagent returns, use a PostToolUse hook on the Agent tool instead").
**Would be wrong if:** The current hooks reference still contained both phrases.

### E-46
**Units:** SP-226-13-What-is-genuinely-ope
**Question:** On thin-history repositories, the paragraph says "the structural, reuse, consequence, conformance, and answer-drift behaviours still operate". Is the consequence genre history-free?
**Facts:**
- The line. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L903-L904]] "reuse, consequence, conformance, and answer-drift behaviours still operate"
- FR-A2d defines the consequence fact as history-derived, plus a zone flag. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L168-L168]] "**historically-coupled tests** this edit tends to break, and a vendored/build-**zone** flag"
- Conformance is the Phase C skill feature. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L775-L776]] "the corrective/skill feature (FR-C1–C4"
**Standard:** Acceptable-decision test condition 6 (no conflict with another requirement).
**Reasoning:** (1) The consequence genre's headline — historically-coupled tests — comes from history, so on a thin-history repository it thins with the other history genres; only its zone flag is structural. (2) Listing "consequence" among the behaviours that still operate contradicts FR-A2d. (3) The rest holds: structure, reuse (call-site convention), answer-drift and conformance do not depend on history. The paragraph also belongs with FR-A6 rather than under "open", since it states behaviour (E-44).
**Alternatives:** None; the fix is one word.
**Consequences:** FR-A6 (L250–252, another part) has the same list.
**Verdict:** replace — say "the structural, reuse, zone-flag (FR-A2d), conformance and answer-drift behaviours still operate", and move the statement out of "genuinely open" to FR-A6, where the same behaviour is specified.
**Would be wrong if:** Consequence were redefined to headline something history-free.

### E-47
**Units:** SP-227-13-What-is-genuinely-ope-OL-C3
**Question:** "No owner question is open". Is that true for the spec as it stands?
**Facts:**
- The line. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L907-L907]] "No owner question is open"
- The branch audit left a spec-wording question with Max Cogar. [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B8-verification.md@HEAD:L191-L191]] "Still open: his sign-off on the FR-O2 / FR-A2d / AC-1c wording."
- This audit adds owner questions on FR-C2 (E-6), D-12 (E-22) and the Phase A test bed (E-10). [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L710-L710]] "action?), not a growing set of hand-written heuristics. **\"Deterministic\" here means"
**Standard:** CLAUDE.md rule 1: never state something as done or absent that is not. OL-10 visibility.
**Reasoning:** The sentence was true when the owner questions it lists were closed. It is not true of the spec now: a wording sign-off is pending with Max Cogar, and three further owner questions arise from this audit. A spec that says nothing is open tells the next agent there is nothing to ask.
**Alternatives:** Remove the sentence — then §13 carries no owner-question state at all, and "only STATUS states next steps" keeps questions out; but the spec may still name which lines await his decision. Either way the false claim goes.
**Consequences:** STATUS carries the questions themselves (CLAUDE.md routing rule 2).
**Verdict:** replace — state which spec lines await Max Cogar's decision (the FR-O2/FR-A2d/AC-1c wording; FR-C2's meaning of "deterministic"; Phase A's calibration channel, D-12; the Phase A test-bed paragraph), with the questions themselves in STATUS.
**Would be wrong if:** Max Cogar had answered all four.

### E-48
**Units:** SP-229-14-Acceptance-criteria
**Question:** The §14 heading. Does it assert anything?
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L912-L912]] "## 14. Acceptance criteria"
**Standard:** SPEC-BRIEF kind 3.
**Reasoning:** A section title; the completion claim is in the next paragraph (E-49).
**Alternatives:** None.
**Consequences:** None.
**Verdict:** keep — asserts nothing checkable.
**Would be wrong if:** The heading carried a completion claim.

### E-49
**Units:** SP-230-14-Acceptance-criteria
**Question:** §14's lead: all criteria "use fixture repositories and replay"; "v1 is complete when every criterion passes on a real repository and `ctxoracle status` reports a clean session". Is the completion rule consistent and testable?
**Facts:**
- The lead. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L914-L916]] "all use fixture repositories and replay. **v1 is"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L915-L916]] "complete when every criterion passes on a real repository and `ctxoracle status` reports a"
- "Clean session" is defined nowhere else in the spec. [[ran]] `git show ec3b057:middleware/context-oracle/docs/specs/spec-context-oracle.md | grep -n -i "clean session"` → only `916:clean session.**`
- Phase B genre criteria do not exist yet; they are to be authored later. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L1128-L1129]] "their genre-specific acceptance criteria are authored with the Phase B architecture"
**Standard:** Raise-flaws rule: an input too unclear to act on without guessing; a completion criterion must be decidable (CLAUDE.md rule 1: never mark an acceptance criterion passed without executing it).
**Reasoning:** (1) "All use fixture repositories" and "passes on a real repository" describe two different test conditions for the same criteria; a builder cannot tell which one decides a pass. Several criteria (AC-5, AC-9, AC-10's induced failures) can only be set up on fixtures; AC-18 is the exit run. (2) "Clean session" has no definition, so the second half of the completion rule cannot be executed. (3) "Every criterion" includes Phase B criteria not yet written, so v1 completion is undefined until they exist.
**Alternatives:** State: each criterion passes on its fixture; the exit run (AC-18) runs on a real repository; "clean" means `status` shows no self-detected FR-M2 failure class for the run; v1 completion additionally needs the Phase B/C criteria once authored in §14.
**Consequences:** SP-267 (Phase B/C criteria placement).
**Verdict:** replace — criteria pass on their fixtures, the AC-18 exit run is on a real repository, "clean session" is defined as `status` showing no FR-M2 failure class for that run, and v1 completion names the Phase B/C criteria that are still to be written into §14.
**Would be wrong if:** A definition of "clean session" existed elsewhere in the spec.

### E-50
**Units:** SP-231-14-Acceptance-criteria-AC-1
**Question:** AC-1: a known non-obvious co-change pair yields a coupling whisper with ratio and pointer on a completed read, and an obvious same-directory, same-name pair does not count. Does it test FR-A2b and P5?
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L918-L922]] "a coupling whisper about an obvious same-directory,"
- FR-A2b fires on a read or search. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L166-L166]] "Co-change partners of that file, with the evidence ratio and a history pointer."
**Standard:** A criterion must fail when the behaviour is wrong (BRIEF: would the test fail if the behaviour were wrong?).
**Reasoning:** The criterion checks the fact (partner named), its evidence and pointer (FR-D3, P4), its timing, and excludes the self-serve case P5 forbids, so a whisper that is present but worthless fails. A read-triggered whisper reaches the agent with the read's result, which is when the agent decides what to read next — no timing mismatch.
**Alternatives:** None better.
**Consequences:** "Within latency" follows NF-1, whose values are undetermined (E-33).
**Verdict:** keep — a discriminating test of FR-A2b and P5.
**Would be wrong if:** FR-A2b fired at a different moment than a completed read or search.

### E-51
**Units:** SP-232-14-Acceptance-criteria-AC-1a
**Question:** AC-1a: Orientation headlines 2–4 entry points and one invariant, not task-shape landmines. Does it test FR-A2a/D-26?
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L923-L925]] "it does **not** deliver task-shape landmines (those belong at the edit, FR-A2e)."
**Standard:** Criterion must discriminate.
**Reasoning:** It tests both the positive content and the D-26 exclusion (kept in E-31). The "2–4" range is FR-A2a's own.
**Alternatives:** None.
**Consequences:** None.
**Verdict:** keep — tests FR-A2a and D-26.
**Would be wrong if:** D-26 fell.

### E-52
**Units:** SP-233-14-Acceptance-criteria-AC-1b
**Question:** AC-1b: Reuse headlines the convention, not bare existence. Does it test FR-A2c/P5?
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L926-L928]] "a whisper that only states a symbol exists fails."
**Standard:** Criterion must discriminate.
**Reasoning:** A bare-existence whisper is what one search returns (P5); failing it makes the criterion test the marginal-value property.
**Alternatives:** None.
**Consequences:** None.
**Verdict:** keep — tests FR-A2c and P5.
**Would be wrong if:** FR-A2c's fact were existence.

### E-53
**Units:** SP-234-14-Acceptance-criteria-AC-1c
**Question:** AC-1c: "On an edit about to run", the Consequence whisper headlines coupled tests and the zone flag. The branch audit found the "about to run" premise wrong about when the whisper reaches the agent. Is that finding right, and what is the correct line?
**Facts:**
- The line. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L929-L929]] "On an edit about to run in a file with known"
- The hooks reference: `PreToolUse` `additionalContext` is added with the tool result and read on the next model request. [[https://code.claude.com/docs/en/hooks.md]] "String added to Claude's context alongside the tool result."
- [[https://code.claude.com/docs/en/hooks.md]] "Claude reads the reminder on the next model request"
- The coordinator ruling's correction. [[middleware/context-oracle/docs/reviews/2026-09-28-branch-audit-coordinator-rulings-schema-and-edit-timing.md@HEAD:L94-L95]] "FR-A2d, AC-1c and L211 say the warning is delivered with the edit's result,"
- The ruling also called FR-O2's "preserved even if the tool call later fails" unsourced; the Claude Code changelog sources it (2.1.110, April 15, 2026). [[https://code.claude.com/docs/en/changelog.md]] "Fixed PreToolUse hook additionalContext being dropped when the tool call fails"
- Path deny rules on `Edit` reject the call before hooks run, so the oracle is not invoked (tested). [[middleware/context-oracle/docs/reviews/2026-09-28-branch-audit-hook-context-permission-denial.md@HEAD:L60-L61]] "`Edit`/`Read` path deny rules are rejected before"
**Standard:** Acceptance criteria must describe the observable behaviour that decides pass/fail; the harness fact from the current hooks reference.
**Reasoning:** (1) The hook does fire while the edit is about to run, but the agent receives the whisper with the edit's result; "on an edit about to run" invites a test that checks for delivery before the edit, which the harness cannot do without a deny (a pre-emptive gate, rejected). (2) The ruling's fix — say the whisper is delivered with the edit's result — is correct. (3) One part of the ruling is itself wrong: the "preserved even if the tool call later fails" clause is sourced, by the changelog entry above; that clause belongs to FR-O2 (another part) and should be kept with this citation rather than dropped.
**Alternatives:** Move the trigger to read time — merges FR-A2d into FR-A2e, rejected by the branch audit (batches 2–3).
**Consequences:** FR-A2d, FR-O2 and L211 (other parts) change together; the ruling routes the spec wording to Max Cogar for sign-off (all spec changes go to him).
**Verdict:** replace — AC-1c reads: on an edit in a file with known historically-coupled tests, the Consequence whisper, computed at the edit's `PreToolUse` and reaching the agent with the edit's tool result, headlines those coupled tests and the zone flag (rest unchanged).
**Would be wrong if:** A `PreToolUse` hook could deliver model-visible context before the tool runs without a permission decision.

### E-54
**Units:** SP-235-14-Acceptance-criteria-AC-1d
**Question:** AC-1d: Completeness names the unchanged partner with its co-change ratio, delivered at the stop through one self-releasing Stop-time injection. Does it test FR-A2f/FR-B4 correctly?
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L933-L935]] "delivered at the stop via a single self-releasing Stop-time injection"
- The Stop channel exists and is bounded. [[https://code.claude.com/docs/en/hooks.md]] "Claude Code applies an 8-consecutive-continuation cap"
**Standard:** Criterion must discriminate; harness fact current.
**Reasoning:** It checks the fact (the unchanged partner), its evidence, and the delivery form (one injection, not a block), on a documented channel.
**Alternatives:** None.
**Consequences:** None.
**Verdict:** keep — tests FR-A2f and FR-B4 on a real channel.
**Would be wrong if:** Stop hooks could not deliver context.

### E-55
**Units:** SP-236-14-Acceptance-criteria-AC-2
**Question:** AC-2: no pre-emptive deny, no gate, no generated-file block, and "no code path mutates the repo or an action's input". Is it consistent with `init`'s sanctioned in-tree write?
**Facts:**
- The line. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L939-L940]] "and no code path mutates the repo or an"
- `init` writes hook wiring into the tree, the one sanctioned exception. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L587-L587]] "at minimum `init` (the only repo-tree write)"
- AC-7 tests the tree after `init`/`deinit`. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L1019-L1020]] "After `init`/`index`/session/`deinit` the tree"
**Standard:** Acceptable-decision test condition 6 (no conflict with another requirement); a criterion a correct implementation fails literally is defective.
**Reasoning:** (1) The deny and gate clauses are OL-C2/OL-R4 and are tested as control flow, which is the right kind of test. (2) The mutation clause, read literally, fails any implementation whose `init` writes wiring into the tree, which the spec sanctions (§10, D-9). It needs the same exception the rest of the spec states.
**Alternatives:** Leave the tension to the tester — an AC must not need interpretation to pass a correct build.
**Consequences:** If D-9 (E-21) resolves to user-scope wiring, the exception becomes empty and the clause holds literally.
**Verdict:** replace — AC-2's mutation clause reads "no code path other than `init`/`deinit` hook wiring (D-9) mutates the repo, and none mutates an action's input".
**Would be wrong if:** `init` wrote nothing inside the repository tree.

### E-56
**Units:** SP-237-14-Acceptance-criteria-AC-2a
**Question:** AC-2a tests the Phase A answer-drift deny plumbing with fixture-controlled question state. Is it discriminating and consistent with OL-C5?
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L946-L948]] "the question/answer state **fixture-controlled**"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L952-L953]] "**Actions to provide the answer are not denied:**"
- OL-C5. [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L71-L71]] "their next move isnt a direct answer or them taking actions to provide an answer"
**Standard:** Criterion must discriminate; OL-C5.
**Reasoning:** Fixing the question state in the fixture isolates the plumbing from the recognizer, so the test fails if the deny, its reason, its persistence, or its release is wrong, and fails if an answer-gathering action is denied — OL-C5's two acceptable moves. Recognizer precision is honestly left to AC-2a-ii.
**Alternatives:** Testing with a live recognizer would mix plumbing and precision.
**Consequences:** None; D-41's answer-source change (E-42) does not alter what this criterion checks.
**Verdict:** keep — a discriminating plumbing test that respects OL-C5.
**Would be wrong if:** OL-C5 allowed denying answer-gathering actions.

### E-57
**Units:** SP-238-14-Acceptance-criteria-AC-2a
**Question:** AC-2a-i: answer-drift is main-agent-scoped; a subagent is not denied for the main session's question; a spawn is judged like any move. Is this right?
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L960-L961]] "a **subagent's** `PreToolUse` is **not** denied for it"
- The hook input distinguishes subagent calls. [[https://code.claude.com/docs/en/hooks.md]] "Use this to distinguish subagent hook calls from main-thread calls."
**Standard:** OL-C5 (the question is Max Cogar's to the agent he asked); per-consumer scope (FR-O6).
**Reasoning:** A subagent never received the question and cannot answer it; denying it would block work that may be gathering the answer. The main agent's spawn is a move like any other, so the same OL-C5 judgment applies. The harness gives `agent_id` to tell them apart.
**Alternatives:** Deny subagents too — could deadlock answer-gathering.
**Consequences:** None.
**Verdict:** keep — correct scope on a documented field.
**Would be wrong if:** Subagents received the user's question.

### E-58
**Units:** SP-239-14-Acceptance-criteria-AC-2a
**Question:** AC-2a-ii: multi-question, partial answer and substantive-clear behaviour, marked as a Phase B criterion. Is it consistent with FR-B5 and D-41?
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L971-L972]] "**This discrimination is a comprehension judgment, so it is a"
**Standard:** Criterion must discriminate; phasing per D-41.
**Reasoning:** It fails a recognizer that releases on the wrong question, clears on a content-free deferral, or strands a substantive answerer; it is placed in Phase B because the judgment is comprehension, as D-41 argues.
**Alternatives:** None.
**Consequences:** Phase B's architecture must implement it.
**Verdict:** keep — discriminating and correctly phased.
**Would be wrong if:** The deferral/answer distinction were decidable model-free.

### E-59
**Units:** SP-240-14-Acceptance-criteria-AC-2b
**Question:** AC-2b tests steer-then-block on a fixture skill whose deviated step is part of FR-C1a's enforceable core, "so a passing AC certifies enforcement Max cares about". Is the attribution backed?
**Facts:**
- The attribution. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L981-L982]] "so a passing AC certifies enforcement Max cares"
- Ledger rule 1: an owner-attributed claim must be under CONFIRMED. [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L12-L14]] "If it is not there, you may not write it as authority."
- OL-C2 covers his skills generally; it does not single out the review dispatch or read-before-plan. [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L68-L68]] "I wanted it to be aware of my expert dev tools that I use"
**Standard:** Ledger rule 1 (quoted).
**Reasoning:** (1) The test design is sound: anchoring the fixture on a step with an observable required action makes a pass mean something (FR-C1a). (2) The sentence justifies it by what Max Cogar cares about; no CONFIRMED entry says he cares about these steps in particular. The reason that holds is FR-C1a's: these steps have observable required actions.
**Alternatives:** Keep the attribution — an unconfirmed owner claim in the spec of record.
**Consequences:** FR-C1a's `Task`/`Agent` correction (E-5) applies to the fixture.
**Verdict:** replace — the last sentence reads "Anchoring the fixture to a step with an observable required action (FR-C1a) is required so a pass certifies real enforcement, not an abstract fixture skill structure", dropping the attribution to Max Cogar.
**Would be wrong if:** A CONFIRMED entry recorded Max Cogar naming these steps.

### E-60
**Units:** SP-241-14-Acceptance-criteria-AC-2c
**Question:** AC-2c tests over-fire for both blocks, under-fire for answer-drift through a human correction, and under-fire for the skill block through the automated post-condition detector. Is it discriminating and consistent with FR-B5/FR-C4?
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L996-L999]] "records a miss on the **missed-skill-block rate** in `status` **with no human correction in the"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L990-L992]] "a **FR-L6 human correction** records the miss and"
**Standard:** Criterion must discriminate.
**Reasoning:** Each clause fails on the error it names: a deny on compliant behaviour, a missed answer-drift not corrected by the human signal, a missed skill step not caught without a human. The hard case (action misclassified as the step) is included, which is what gives the skill clause teeth. The human-correction clause is tested with a correction injected by the fixture, so it holds whatever D-12 (E-22) decides about who issues corrections.
**Alternatives:** None better.
**Consequences:** When E-8's fix lands, `status` also shows unmonitored steps; this criterion's fixture uses a step with a post-condition and is unaffected.
**Verdict:** keep — discriminating on both error directions for both blocks.
**Would be wrong if:** The fixture could pass with the post-condition detector reading the action classifier.

### E-61
**Units:** SP-242-14-Acceptance-criteria-AC-3
**Question:** AC-3: two candidates meeting the bar at one event are both delivered; no volume/count/budget cap. Does it test OL-C1?
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L1004-L1006]] "Two candidates meeting the bar at one event"
- OL-C1. [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L67-L67]] "Every per-session / per-trigger token or count budget is removed as an operational gate"
- OL-R1 rejected "at most one whisper per event". [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L56-L56]] "\"At most one whisper per event.\""
**Standard:** OL-C1; OL-R1.
**Reasoning:** Two bar-clearing candidates at one event is exactly the case an invented one-per-event cap (OL-R1) would suppress; the criterion fails such a cap. Dedup is correctly distinguished from a cap.
**Alternatives:** None.
**Consequences:** None.
**Verdict:** keep — a direct test of OL-C1 against the rejected OL-R1.
**Would be wrong if:** OL-C1 allowed a per-event count.

### E-62
**Units:** SP-243-14-Acceptance-criteria-AC-3a
**Question:** AC-3a: a real low-confidence hazard fires flagged; a below-noise-floor coincidence does not. Does it test OL-C4?
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L1008-L1010]] "hazard fires **with its confidence flagged**, not silence"
- OL-C4. [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L70-L70]] "(B) also voice uncertain warnings clearly flagged"
**Standard:** OL-C4; criterion must discriminate.
**Reasoning:** Both directions are tested: suppression of an uncertain real hazard fails, and so does firing on noise.
**Alternatives:** None.
**Consequences:** None.
**Verdict:** keep — tests OL-C4 in both directions.
**Would be wrong if:** OL-C4 had chosen option A.

### E-63
**Units:** SP-244-14-Acceptance-criteria-AC-4
**Question:** AC-4: a read-set fact stays silent, a not-yet-seen fact speaks, a fact about an untouched file does not fire. Does it test FR-A5/FR-A4/§5.1?
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L1011-L1013]] "a high-quality fact about a file the"
**Standard:** Criterion must discriminate.
**Reasoning:** Three cases, each failing a distinct defect: repeating what the agent read (P5/dedup), suppressing what it has not seen, and firing without a trigger (§5.1).
**Alternatives:** None.
**Consequences:** None.
**Verdict:** keep — discriminating on marginal value, dedup and trigger relevance.
**Would be wrong if:** §5.1 allowed untriggered facts.

### E-64
**Units:** SP-245-14-Acceptance-criteria-AC-5
**Question:** AC-5: resume/fork reseed dedup; compact clears the read-set; clear/startup clean. Does the compact case match what compaction does?
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L1014-L1015]] "`compact`"
- Compaction discards hook-injected context (Claude Code re-injects SubagentStart context after it). [[https://code.claude.com/docs/en/hooks.md]] "discards that copy, Claude Code injects the next run's context again."
**Standard:** As in E-26 (D-20).
**Reasoning:** AC-5 tests FR-A4 as written, and FR-A4's compact rule keeps the delivered-set although compaction may have removed those whispers from the agent's context (E-26). The criterion must test the corrected rule.
**Alternatives:** Test only the read-set on compact — certifies the defect.
**Consequences:** Follows E-26.
**Verdict:** replace — AC-5's compact case asserts that both the read-set and the delivered-set are cleared, so a fact delivered before compaction is delivered again when next relevant.
**Would be wrong if:** Compaction were documented to preserve hook-injected context.

### E-65
**Units:** SP-246-14-Acceptance-criteria-AC-6
**Question:** AC-6: below the corpus floor history genres stay silent; a rich-history session fires regardless of how few sessions have occurred. Does it test D-7/D-8?
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L1016-L1018]] "a rich-history session fires regardless of how few sessions have"
**Standard:** OL-C1 (no adoption window).
**Reasoning:** The second clause fails an adoption window directly; the first tests the evidentiary floor.
**Alternatives:** None.
**Consequences:** None.
**Verdict:** keep — tests both halves of D-7/D-8.
**Would be wrong if:** D-7/D-8 fell.

### E-66
**Units:** SP-247-14-Acceptance-criteria-AC-7
**Question:** AC-7: "After `init`/`index`/session/`deinit` the tree differs only by the removed hook wiring." Is the pass condition clear?
**Facts:**
- The line. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L1019-L1020]] "the tree"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L1020-L1020]] "differs only by the removed hook wiring."
- P8: the tree stays pristine except `init` wiring. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L147-L147]] "**P8 — The repository tree stays pristine**"
**Standard:** Raise-flaws rule: too unclear to act on without guessing.
**Reasoning:** "Differs only by the removed hook wiring" does not say from what: against the post-`init` tree it means index and session wrote nothing; against the pre-`init` tree it would mean the wiring is gone, i.e. no difference. After `deinit` the only correct state is the pre-`init` tree, including any settings file that existed before `init`, restored byte for byte. The criterion should say that.
**Alternatives:** Keep as written — two readings, one of which lets `deinit` leave residue.
**Consequences:** Independent of D-9's outcome (E-21): if wiring moves out of the tree the assertion still holds.
**Verdict:** replace — AC-7 reads: after `init`/`index`/session/`deinit`, the tree is identical to its pre-`init` state (no untracked or modified paths; a settings file that existed before `init` is byte-identical).
**Would be wrong if:** `deinit` were specified to leave some residue deliberately.

### E-67
**Units:** SP-248-14-Acceptance-criteria-AC-8
**Question:** AC-8: at a recognized completion-claim stop with the region's test not run, the whisper headlines the covering-test mapping, delivered once, not a block. Does it test FR-A2g/P5?
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L1024-L1027]] "a whisper whose headline is only the run-state (\"your test was not run\"), with no"
**Standard:** Criterion must discriminate; P5.
**Reasoning:** It fails the self-evident run-state whisper and passes only the non-trivial mapping; it checks the delivery form. Sound.
**Alternatives:** None.
**Consequences:** None.
**Verdict:** keep — discriminating on content and delivery.
**Would be wrong if:** FR-A2g's headline were run-state.

### E-68
**Units:** SP-249-14-Acceptance-criteria-AC-8a
**Question:** AC-8a tests the outstanding-question line at a done-claim and records that it is best-effort. It cites "the common Phase-A case (interpreter-write, never-answered)". Is the criterion actionable as written?
**Facts:**
- The undefined term. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L1036-L1036]] "the common Phase-A case (interpreter-write, never-answered) it may **not** fire"
- The term appears nowhere else in the spec. [[ran]] `git show ec3b057:middleware/context-oracle/docs/specs/spec-context-oracle.md | grep -n -i interpreter` → only `1036:…(interpreter-write, never-answered)…`
**Standard:** Raise-flaws rule: too unclear to act on without guessing; the spec must stand without the architecture's vocabulary (spec → architecture, not the reverse).
**Reasoning:** (1) The test itself is clear and honest: the line must appear when both recognizers fire, and the backstop is recorded as best-effort. (2) The parenthetical names "the common Phase-A case" by a term the spec never defines, so a reader cannot tell which case the criterion admits it may miss. The case it means is stated in the same sentence's logic: a question never answered, with the drift carried by moves the conservative recognizer allowed.
**Alternatives:** Define "interpreter-write" in the spec; or describe the case in plain terms. Either removes the guess; the plain description needs no new term.
**Consequences:** None.
**Verdict:** replace — replace "(interpreter-write, never-answered)" with a plain description: a question never answered, where the agent moved on through actions the conservative recognizer did not deny.
**Would be wrong if:** "Interpreter-write" were defined in the spec.

### E-69
**Units:** SP-250-14-Acceptance-criteria-AC-9
**Question:** AC-9: induced failures of each FR-M2 class appear in `log` and `status`; the rates are reported with the regret-rate label. Does it test OL-10's requirement?
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L1039-L1042]] "**a stale index** each appear in the log and `status` as a self-detected failure class"
- OL-10. [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L48-L48]] "Self-observability is required"
**Standard:** Fail-fast visibility; criterion must discriminate.
**Reasoning:** Each failure class is induced and must surface; the missed-skill-block case includes the misclassified-action case; the regret rate is labelled so a low number is not read as "nothing missed". Each clause fails when its class is silent.
**Alternatives:** None.
**Consequences:** When E-8's fix lands, `status` also reports unmonitored skill steps; the criterion should then include that count (follows from E-8, not a defect here).
**Verdict:** keep — tests every FR-M2 class OL-10 needs visible.
**Would be wrong if:** A failure class listed in FR-M2 had no induction here.

### E-70
**Units:** SP-251-14-Acceptance-criteria-AC-10
**Question:** AC-10: induced failure/timeout yields silence and no deny; "p95 ≤ 1.5s, none over 3s". Are the numbers backed, and should they live here?
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L1054-L1056]] "p95 ≤ 1.5s, none"
- NF-1 holds the same numbers, backed only by D-31 (E-33). [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L535-L536]] "added latency per event **p95 ≤"
- CLAUDE.md routing rule 1. [[middleware/context-oracle/CLAUDE.md@ec3b057:L81-L82]] "**One fact, one home**"
**Standard:** CLAUDE.md "One fact, one home"; fail-fast / fail-open (OL-3, FR-O3).
**Reasoning:** (1) The fail-open half is backed (FR-O3, OL-3) and discriminating. (2) The numbers are a copy of NF-1's, whose values are undetermined (E-33); a second copy will drift when NF-1 changes. The criterion should test NF-1's budget by reference.
**Alternatives:** Keep the copy — two homes for one number.
**Consequences:** Follows E-33.
**Verdict:** replace — AC-10's latency clause reads "within NF-1's latency budget (p95 and hard ceiling)" instead of repeating the numbers.
**Would be wrong if:** AC-10 were meant to set a stricter budget than NF-1.

### E-71
**Units:** SP-252-14-Acceptance-criteria-AC-11
**Question:** AC-11: planted secret redacted everywhere; injection-suspect content pointer-only; low trust never high confidence; no credentials, no network beyond the piggyback. Does it test FR-X1–X8?
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L1057-L1059]] "Planted secret redacted everywhere; injection-"
- OL-7. [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L45-L45]] "**\"No separate credentials, ever.\"**"
**Standard:** OWASP LLM01/LLM02 as cited in §9; OL-7.
**Reasoning:** Each clause maps to a threat (T1–T4) and fails on its violation. Sound.
**Alternatives:** None.
**Consequences:** None.
**Verdict:** keep — tests each security requirement.
**Would be wrong if:** A security requirement had no clause.

### E-72
**Units:** SP-253-14-Acceptance-criteria-AC-12
**Question:** AC-12: with the model path down, the deterministic genres and the answer-drift plumbing and conservative recognizer still work; it does not claim "the block works". Is that honest and sufficient?
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L1064-L1066]] "**not** assert \"the block works,\""
- OL-2. [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L40-L40]] "a deterministic degraded mode is mandatory for air-gap."
**Standard:** BRIEF: the one legitimate degraded mode is FR-J2/J3/AC-12, visible and specified.
**Reasoning:** It tests the specified degraded mode and refuses to over-claim, which is what Phase A's goal (honest floor) requires.
**Alternatives:** None.
**Consequences:** None.
**Verdict:** keep — tests OL-2's degraded mode without over-claiming.
**Would be wrong if:** The block's precision were model-free.

### E-73
**Units:** SP-254-14-Acceptance-criteria-AC-13
**Question:** AC-13: merge commit, ">~30-entity transaction" and beyond-horizon history contribute no edges. Is "~30" testable?
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L1067-L1068]] "Merge commit, >~30-entity transaction"
- FR-K2 marks the cap illustrative and tunable. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L607-L608]] "capping very large"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L608-L608]] "transactions (illustrative ~30, tunable `[ROSE]`)"
**Standard:** A criterion must have a decidable pass condition; "one fact, one home".
**Reasoning:** An approximate threshold cannot decide a pass (is a 31-entity transaction in or out?), and the cap is tunable by FR-K2, so the test must use the configured value.
**Alternatives:** Hardcode 30 in the test — freezes a tunable.
**Consequences:** None.
**Verdict:** replace — AC-13 reads "a transaction larger than the configured cap (FR-K2)" instead of ">~30-entity transaction".
**Would be wrong if:** FR-K2 fixed the cap at exactly 30.

### E-74
**Units:** SP-255-14-Acceptance-criteria-AC-14
**Question:** AC-14: every whisper parses to form, resolves its pointer, states its evidence, flags confidence, contains no imperative. Does it test FR-D1–D5?
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L1070-L1072]] "resolves"
- The hooks reference itself advises factual, non-imperative injected text. [[https://code.claude.com/docs/en/hooks.md]] "Write the text as factual statements rather than imperative system instructions."
**Standard:** FR-D1–D5; the hooks reference guidance quoted.
**Reasoning:** Each property is checkable per whisper. The no-imperative clause is also what the harness recommends to avoid injected text being treated as a prompt-injection.
**Alternatives:** None.
**Consequences:** None.
**Verdict:** keep — tests the form requirements, with harness support.
**Would be wrong if:** FR-D2 allowed imperatives.

### E-75
**Units:** SP-256-14-Acceptance-criteria-AC-15
**Question:** AC-15: a subagent tool event draws a whisper into that subagent's context, keyed by `agent_id`. Does it test OL-8?
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L1073-L1074]] "A subagent tool event draws a whisper into"
- Hooks run inside subagents with `agent_id`. [[https://code.claude.com/docs/en/hooks.md]] "Present only when the hook fires inside a subagent call."
**Standard:** OL-8.
**Reasoning:** Tests the in-scope delivery on the documented field.
**Alternatives:** None.
**Consequences:** None.
**Verdict:** keep — tests OL-8.
**Would be wrong if:** Subagent hooks could not inject context.

### E-76
**Units:** SP-257-14-Acceptance-criteria-AC-16
**Question:** AC-16: a demoted genre is re-admitted within N events or M sessions, and its delivered rate recovers above zero on a restored-value fixture. Is it decidable?
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L1077-L1078]] "(**N events or M sessions**, the values set from"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L1079-L1081]] "Pass/fail is the observed"
**Standard:** Criterion must be decidable; numbers from data (E-13).
**Reasoning:** The window values come from Phase A data before this Phase C criterion is run, and pass/fail is an observed recovery within that window — decidable once the values exist, and it fails a ratchet.
**Alternatives:** Fix N/M now — unsourced numbers.
**Consequences:** None.
**Verdict:** keep — decidable, fails the ratchet.
**Would be wrong if:** The criterion were due before Phase A data exists.

### E-77
**Units:** SP-258-14-Acceptance-criteria-AC-17
**Question:** AC-17: "a broad set of languages"; adding a language is configuration; "nothing is hardcoded to a fixed three". Is it testable?
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L1082-L1084]] "nothing is hardcoded to a fixed three."
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L1082-L1083]] "The oracle indexes and mines a broad set of"
**Standard:** A criterion needs a decidable pass condition.
**Reasoning:** (1) "Broad" has no threshold, so it cannot fail. (2) "A fixed three" tests one specific wrong number rather than the property. (3) The property that can be tested is the one C-6 asks for: a language not previously supported can be added by configuration alone, with no code change, and then indexed and mined. Which languages ship is D-15's design choice (E-23), recorded where it is made.
**Alternatives:** Pick a count — an arbitrary number the ledger note leaves to design, not to a test.
**Consequences:** Follows E-23.
**Verdict:** replace — AC-17 reads: a language not in the shipped configuration is added in the fixture by configuration alone (no code change) and is then indexed and mined; the shipped language set is the one D-15 records.
**Would be wrong if:** C-6 required a specific minimum count of languages.

### E-78
**Units:** SP-259-14-Acceptance-criteria-AC-18
**Question:** AC-18: on a rich fixture seeded with known facts, the exit run delivers those facts; the bar is delivery of the seeded facts, not a count. Does it test the mission?
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L1088-L1090]] "not** hitting a"
**Standard:** The mission; OL-C1 (no count target).
**Reasoning:** Matching seeded pointers fails a tool that is quiet about what it should know, and refuses count-padding. It is the coverage check FR-L4 relies on.
**Alternatives:** A whisper-count target — rejected by OL-C1.
**Consequences:** None.
**Verdict:** keep — a direct mission test.
**Would be wrong if:** Seeded facts could be matched without the whisper reaching the agent.

### E-79
**Units:** SP-260-14-Acceptance-criteria-AC-19
**Question:** AC-19: export both stores, import into an empty location, record-identical, no network egress. Does it test FR-K9/FR-X7?
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L1091-L1093]] "**record-identical** to the originals"
- OL-6 (solo, no sync). [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L44-L44]] "solo scope, no team sharing."
**Standard:** Round-trip testing practice.
**Reasoning:** Record identity fails any lossy export; the egress clause tests FR-X7.
**Alternatives:** None.
**Consequences:** None.
**Verdict:** keep — a decisive round-trip test.
**Would be wrong if:** FR-K9 allowed lossy export.

### E-80
**Units:** SP-261-14-Acceptance-criteria-AC-20
**Question:** AC-20: install and first index in a sandbox with no native toolchain beyond the chosen SQLite path; full-text search works there. Does it test C-3?
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L1094-L1096]] "Install + first index in a"
- OL-4. [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L42-L42]] "Sandbox compatibility is required."
**Standard:** OL-4.
**Reasoning:** It tests the constraint as a property, independent of the runtime choice D-33 leaves undetermined (E-35): whichever runtime is chosen must pass it.
**Alternatives:** None.
**Consequences:** None.
**Verdict:** keep — tests OL-4/C-3 without depending on the runtime choice.
**Would be wrong if:** C-3 required a specific runtime.

### E-81
**Units:** SP-262-14-Acceptance-criteria-AC-21
**Question:** AC-21: a model call's own hook events do not re-trigger the oracle; an induced self-trigger stops at the guard and is logged. Does it test FR-J4?
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L1098-L1100]] "no unbounded hook→model→hook chain"
- Configured hooks fire in a headless `claude -p` run (the branch audit's control runs). [[middleware/context-oracle/docs/reviews/2026-09-28-branch-audit-hook-context-permission-denial.md@HEAD:L34-L34]] "| Bash allowed (control) | 2 | yes, both | success | in transcript, both |"
**Standard:** Derivation in E-19.
**Reasoning:** The recursion is real (hooks fire in the child run); the criterion induces it and checks the guard stops it and logs it.
**Alternatives:** None.
**Consequences:** None.
**Verdict:** keep — tests a real recursion hazard.
**Would be wrong if:** The model call could never fire hooks.

### E-82
**Units:** SP-263-14-Acceptance-criteria-AC-22
**Question:** AC-22: with no qualifying event, no whisper however long the session idles. Does it test FR-O5?
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L1102-L1104]] "Verified by holding a session"
**Standard:** `[CHI]` as cited (interruption at task boundaries).
**Reasoning:** Idle-then-event fails any timer path and confirms the boundary path works.
**Alternatives:** None.
**Consequences:** None.
**Verdict:** keep — tests FR-O5 in both directions.
**Would be wrong if:** FR-O5 allowed timers.

### E-83
**Units:** SP-264-14-Acceptance-criteria-AC-23
**Question:** AC-23: a CLI correction outranks a conflicting mined inference; repo facts land in the project store and efficacy in the global store. Does it test FR-L6/FR-L7?
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L1105-L1108]] "verified by inspecting the two stores after a session."
**Standard:** OL-6; RETHINK §8 (human corrections are first-class).
**Reasoning:** Both properties are checked by inspection of stored state and fail when violated. The correction is injected by the fixture, so the criterion holds whatever D-12 (E-22) decides about who issues corrections.
**Alternatives:** None.
**Consequences:** None.
**Verdict:** keep — tests FR-L6 precedence and FR-L7 routing.
**Would be wrong if:** FR-L7 routed differently.

### E-84
**Units:** SP-265-14-Acceptance-criteria-AC-24
**Question:** AC-24: the regret proxy counts a held-but-unspoken fact whose region later churns relevantly, and not unrelated churn. Does it test FR-L4?
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L1113-L1114]] "*Does not inflate:* on a fixture where a held"
**Standard:** Criterion must discriminate (both error directions).
**Reasoning:** True-positive and does-not-inflate fixtures test the proxy both ways; the pairing with AC-18 keeps regret from being read as total coverage. The requirement it tests stands on the derivation kept in E-38.
**Alternatives:** None.
**Consequences:** None.
**Verdict:** keep — discriminating in both directions.
**Would be wrong if:** The proxy could pass by counting all churn.

### E-85
**Units:** SP-266-14-Acceptance-criteria-AC-25
**Question:** AC-25: an off-path whisper is delivered at the next relevant event or dropped at termination, and dropped when its evidence no longer holds. Does it test FR-J5?
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L1122-L1124]] "the whisper is **dropped, not delivered** (a now-false"
**Standard:** D-37 (kept, E-39); FR-D1's no-rumor rule.
**Reasoning:** Each clause fails a distinct defect: arbitrary lateness, delivery after termination, delivery of a now-false pointer.
**Alternatives:** None.
**Consequences:** None.
**Verdict:** keep — tests both FR-J5 properties.
**Would be wrong if:** FR-J5 allowed stale delivery.

### E-86
**Units:** SP-267-14-Acceptance-criteria-FR-A2h
**Question:** The Phase B/C acceptance paragraph says the model genres' acceptance criteria "are authored with the Phase B architecture". Is that the right home for acceptance criteria?
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L1128-L1129]] "their genre-specific acceptance criteria are authored with the Phase B architecture"
- CLAUDE.md routing: acceptance criteria belong in the spec. [[middleware/context-oracle/CLAUDE.md@ec3b057:L72-L72]] "A requirement, constraint, or acceptance criterion?"
- There is never a per-phase spec; per-phase build detail goes to the architecture — acceptance is not build detail. [[middleware/context-oracle/CLAUDE.md@ec3b057:L55-L57]] "per-phase build detail belongs in that phase's architecture"
**Standard:** CLAUDE.md routing table (quoted) — one home per fact; the spec is the acceptance authority.
**Reasoning:** (1) Deferring the criteria until Phase A data exists is right (their thresholds need it). (2) Placing them in an architecture document makes the design the author of its own pass conditions, and puts spec content in the file the routing table assigns to design. (3) The rest of the paragraph — inherited AC-14/P5 discipline, AC-2b and the skill clause of AC-2c as Phase C, the AC-2c answer-drift phase split — is consistent with §11.5 and D-41.
**Alternatives:** Author them in §14 when the Phase B architecture is drafted, with the usual sign-off — keeps one home.
**Consequences:** E-49's v1-completion rule names these criteria.
**Verdict:** replace — the Phase B/C genre criteria are written into spec §14 when the Phase B architecture is drafted (from Phase A exit data), not into the architecture document.
**Would be wrong if:** The routing table assigned acceptance criteria to architecture documents.

### E-87
**Units:** SP-269-14-Acceptance-criteria-OL-1
**Question:** The closing footer names the spec's foundation (ledger keys) and repeats verification dates. Is it accurate and in its one home?
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L1138-L1139]] "(OL-1…OL-12, OL-C1…OL-C5;"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L1139-L1141]] "most external premises confirmed 2026-08-25"
- The ledger at the same commit also confirms OL-C6 (the spec's own sign-off). [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L72-L72]] "**The v1 spec is signed off — good to go.**"
- FR-O2 carries a later hooks re-read (2026-09-26), which the footer's dates omit. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L485-L485]] "(hooks reference re-read 2026-09-26)"
- Quoted hooks phrases no longer in the reference (E-45). [[ran]] `python3 /tmp/claude-0/-home-user-agent-armory/779c0f74-86b0-5e8f-b02d-811e78ed3f66/scratchpad/audit/webquote.py https://code.claude.com/docs/en/hooks.md "avoids retrying"; echo $?` → `1`
**Standard:** CLAUDE.md "One fact, one home" (quoted in E-70); CLAUDE.md rule 1 (no stale "confirmed" claims).
**Reasoning:** (1) The footer's key range omits OL-C6, which the status line itself cites as the sign-off. (2) Its dates duplicate §9 and are already stale against FR-O2's 2026-09-26 re-read and against the current hooks text (E-45). A second copy of the verification record will keep going stale separately from §9.
**Alternatives:** Keep and update the copy — two homes again.
**Consequences:** §9's own dates must be updated when the hooks quotes are re-verified (other part).
**Verdict:** replace — the footer reads "Its foundation is `OWNER-LEDGER.md` CONFIRMED plus the mission; verification recency is per the §9 table", without repeating key ranges or dates.
**Would be wrong if:** The footer were the only place the verification dates were recorded.
