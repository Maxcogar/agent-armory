# Spec audit part b — second opinion

Second opinion on `middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-b.md` (90 entries on
`middleware/context-oracle/docs/specs/spec-context-oracle.md` lines 277–672 at `ec3b057`). The author of
this file wrote neither the spec nor the first audit. It follows the two auditor briefs
(`/tmp/claude-0/-home-user-agent-armory/779c0f74-86b0-5e8f-b02d-811e78ed3f66/scratchpad/audit/BRIEF.md`,
`…/audit/SPEC-BRIEF.md`).

Scope of judgment: every `replace` and `undetermined` entry; every `keep` that carries a number, mechanism,
tool/harness claim, citation or owner attribution. The 15 pure heading/separator keeps (E-3, E-4, E-6, E-20,
E-21, E-43, E-44, E-46, E-63, E-64, E-69, E-70, E-71, E-79, E-85) assert nothing checkable and are not
re-judged. Every web source the first audit cites was re-fetched with curl on 2026-09-29 into
`/tmp/claude-0/-home-user-agent-armory/779c0f74-86b0-5e8f-b02d-811e78ed3f66/scratchpad/specaudit/so-b/`
and all 82 of its web quotes were matched against those fresh copies (all matched); the passages relied on
below were read in context. Executed checks ran on Node v22.22.2 and Python 3.11.15. "M38" is Max Cogar's
process from owner-messages M38: a change to a line of his signed spec comes to him before it replaces the
line, even when the decision is an engineering one.

### E-1
**Agree/Disagree:** Verdict: agree (replace). Reasoning: agree. In Phase A the false-fire input is the owner's CLI correction, whispers are not shown to him, so an unlabelled rate reads as measured precision when it is a count of corrections. The fix is not a stated limitation in place of the requirement: FR-M4's own job (OL-10, "never read as 'nothing missed'") is to show what each number covers, and the spec already does exactly this for the regret rate; the fix applies the same rule to the two rates that lack it. Which signal feeds the rate is a separate open item (E-86, E-90).
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L277-L278]] "whisper count, per-genre volume, false-fire rate"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L279-L280]] "so a low regret rate is never read as"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L254-L255]] "the calibration input from Phase A is the human CLI correction (FR-D4/FR-L6)"
- [[https://code.claude.com/docs/en/hooks.md]] "Claude reads the reminder on the next model request, but it doesn't appear as a chat message in the interface."
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L48]] "it could fail a hundred ways in front of me and I wouldn't know"
**Correct verdict:** replace — as the first audit states (label both rates with their source and show reviewed-of-issued counts); engineering line, to Max Cogar under M38.

### E-2
**Agree/Disagree:** Verdict: agree (keep). Reasoning: agree; FR-M5 is the readback of FR-X6's trail, required for OL-10, and asserts nothing beyond that.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L288-L289]] "the whisper/block audit trail read back per session"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L318-L319]] "every whisper and every block recorded with evidence and pointer"
**Correct verdict:** keep — backed by OL-10 and FR-X6.

### E-5
**Agree/Disagree:** Verdict: agree (replace). Reasoning: agree. "that is the attack surface" asserts completeness; the spec's own requirements add the transcript (FR-B1 reads it), imported stores (FR-K9), and the Phase-B model call (§10) as inputs/outputs, so T1 and T3 are scoped too narrowly by this premise.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L295-L296]] "The oracle reads repository history and injects text an agent acts on; that is the attack surface."
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L492-L494]] "the `PreToolUse` answer-drift recognizer instead reads"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L616]] "Export/import round-trip"
- [[https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html]] "Consider secrets as part of the attack surface during threat modeling exercises."
**Correct verdict:** replace — the first audit's enumeration of inputs and outputs; engineering line, to Max Cogar under M38.

### E-7
**Agree/Disagree:** Verdict: agree (replace). Reasoning: agree. LLM01 defines indirect injection by what the LLM ingests; the oracle's own model path (FR-J1, the Phase-B question/answer classifier, FR-C2) ingests repository and transcript text and can flip a deny, which "when surfaced" omits.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L300-L301]] "Repo content read as an instruction when surfaced"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L769-L771]] "classifying, on each *user* turn,"
- [[https://genai.owasp.org/llmrisk/llm01-prompt-injection/]] "Indirect prompt injections occur when an LLM accepts input from external sources, such as websites or files."
**Correct verdict:** replace — the first audit's T1 text; engineering line, to Max Cogar under M38.

### E-8
**Agree/Disagree:** Verdict: agree (keep). Reasoning: agree; the stores are persistent memory fed by mined history and by import, which is ASI06's class. The source-document defect is E-53's, not this line's.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L302-L303]] "Crafted history / tampered store injects false facts"
- [[https://genai.owasp.org/2025/12/09/owasp-top-10-for-agentic-applications-the-benchmark-for-agentic-security-in-the-age-of-autonomous-ai/]] "Memory poisoning reshaped behaviour long after the initial interaction"
**Correct verdict:** keep — correct threat, real source.

### E-9
**Agree/Disagree:** Verdict: agree (replace). Reasoning: agree with the disclosure paths (model-call prompt, store, log, export, CLI output). One refinement to the reasoning, not the fix: the deny reason's `<the outstanding question(s)>` is Max Cogar's own text already in the context, so it is not a new disclosure path; mined content placed in a whisper or deny reason is.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L304-L305]] "History/files contain secrets the oracle could surface"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L592-L593]] "is a one-shot, tool-disallowed model call over the"
- [[https://genai.owasp.org/llmrisk/llm022025-sensitive-information-disclosure/]] "Techniques like pattern matching can detect and redact confidential content before processing."
**Correct verdict:** replace — the first audit's T3 text; engineering line, to Max Cogar under M38.

### E-10
**Agree/Disagree:** Verdict: agree (replace). Reasoning: agree; LLM01 lists least privilege only as an injection mitigation, while LLM06 is OWASP's entry for excessive permissions itself.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L306]] "The oracle holds more access than it needs `[LLM01]`."
- [[https://genai.owasp.org/llmrisk/llm062025-excessive-agency/]] "The root cause of Excessive Agency is typically one or more of: excessive functionality; excessive permissions; excessive autonomy."
- [[https://genai.owasp.org/llmrisk/llm01-prompt-injection/]] "Enforce privilege control and least privilege access"
**Correct verdict:** replace — cite `[LLM06]` (new §9 row); engineering line, to Max Cogar under M38.

### E-11
**Agree/Disagree:** Verdict: agree (keep). Reasoning: agree; the heading states the correct rule and FR-X8's missing tag is fixed at FR-X8 (E-19).
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L308]] "### 7.2 Security requirements (each tied to a threat)"
**Correct verdict:** keep — correct structuring rule.

### E-12
**Agree/Disagree:** Verdict: agree (replace). Reasoning: agree; FR-X1 names three of the seven disclosure paths, and LLM02 places redaction "before processing", which includes the oracle's own model call. Live-read content (transcript, current files) never passes through the store, so store-time redaction cannot cover later outputs.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L310]] "before any content enters a whisper, store, or log"
- [[https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html]] "8.2 Types of secrets to be detected"
- [[https://genai.owasp.org/llmrisk/llm022025-sensitive-information-disclosure/]] "Techniques like pattern matching can detect and redact confidential content before processing."
**Correct verdict:** replace — the first audit's FR-X1 text; engineering line, to Max Cogar under M38.

### E-13
**Agree/Disagree:** Verdict: agree (replace). Reasoning: agree. "mechanically-generated content" occurs once in the spec and is defined nowhere (checked by reading every occurrence of "mechanical" and "generated"; the others are the generated-file block), so the exception cannot be built without guessing; OWASP's control is separation and labelling of untrusted data.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L311-L312]] "quotation only for mechanically-generated content"
- [[https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html]] "Use structured formats that clearly separate instructions from user data."
- [[https://genai.owasp.org/llmrisk/llm01-prompt-injection/]] "Separate and clearly denote untrusted content to limit its influence on user prompts."
**Correct verdict:** replace — the first audit's FR-X2 text; engineering line, to Max Cogar under M38.

### E-14
**Agree/Disagree:** Verdict: agree (keep). Reasoning: agree; pointer-only for suspect content is a defence-in-depth layer over FR-X2, and OWASP's own warning that pattern filters miss indirect injection is why it must not be the only layer — it is not.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L313]] "Injection-suspect content is pointer-only (T1)"
- [[https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html]] "Pattern-based filters do not reliably catch indirect injection in untrusted content"
**Correct verdict:** keep — backed by the OWASP cheat sheet.

### E-15
**Agree/Disagree:** Verdict: agree (keep). Reasoning: agree; a non-launderable trust label lowering confidence answers ASI06's "continues to trust" failure and respects OL-C4 (flag, not suppress).
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L314-L315]] "a trust label rides every fact; low trust lowers confidence and cannot be laundered"
- [[https://genai.owasp.org/2026/05/13/memory-is-a-feature-it-is-also-an-attack-surface/]] "attacker-controlled content poisoning memory and context that the system continues to trust over time"
**Correct verdict:** keep — scoped, backed by ASI06, consistent with OL-C4.

### E-16
**Agree/Disagree:** Verdict: agree (replace). Reasoning: agree; `deinit` is a required verb that removes the wiring from the tree and AC-7 measures that change, so "no repo-tree write except `init`" contradicts a requirement.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L317]] "no repo-tree write except `init` `[D-9]`"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L1019-L1020]] "differs only by the removed hook wiring"
**Correct verdict:** replace — "no repo-tree write except the hook wiring `init` installs and `deinit` removes `[D-9]`"; engineering line, to Max Cogar under M38.

### E-17
**Agree/Disagree:** Verdict: agree (keep). Reasoning: agree; recording what was delivered with its evidence is the monitoring control OWASP names, and the log falls under FR-X1 (E-12).
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L318-L319]] "every whisper and every block recorded with evidence and pointer"
- [[https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html]] "Log all LLM interactions for security analysis"
**Correct verdict:** keep — backed by OWASP monitoring guidance and OL-10.

### E-18
**Agree/Disagree:** Verdict: disagree (first audit: keep). Reasoning: the first audit calls FR-X7 "owner decision OL-6, correctly carried", but only half of it is OL-6. "stores outside the repo tree" is OL-6's words; "no outbound telemetry" is not — OL-6 says "solo scope, no team sharing", and telemetry to a service is not team sharing. The `[OL-6]` tag at the end of the line attributes both clauses to Max Cogar, which the ledger rules and OL-C7 forbid (the same mis-tag pattern the first audit correctly flags for OL-3 in E-34 and OL-C1 in E-42/E-76). The no-telemetry rule itself is sound engineering: it follows from T3 (mined content, including secrets, must not leave the machine) and FR-X5 (the only network use is the host CLI piggyback). The requirement stays; its attribution changes.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L320-L321]] "stores outside the repo tree; no outbound telemetry"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L44]] "both outside the repo tree; solo scope, no team sharing"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L12-L14]] "(spec, decision log, requirements, architecture), find it under CONFIRMED"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L316-L317]] "the only network use is the host CLI piggyback (§10)"
**Correct verdict:** replace — "FR-X7 — Locality (T3, T4) — stores outside the repo tree `[OL-6]`; no outbound telemetry — no oracle data leaves the machine except the host-CLI model call (T3, FR-X5)"; engineering correction of an attribution, to Max Cogar under M38.

### E-19
**Agree/Disagree:** Verdict: agree (replace). Reasoning: agree; FR-X8 names T1/T3 fixtures only, carries no threat tag, and T2 has a requirement (FR-X4) and an AC-11 clause but no fixture.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L322]] "carry injection payloads and planted secrets (§14)"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L1058-L1059]] "low-trust origin never yields a high-confidence whisper"
- [[https://genai.owasp.org/llmrisk/llm01-prompt-injection/]] "Conduct adversarial testing and attack simulations"
**Correct verdict:** replace — the first audit's FR-X8 text (T1–T3 fixtures, incl. crafted history and tampered/imported store); engineering line, to Max Cogar under M38.

### E-22
**Agree/Disagree:** Verdict: agree (keep). Reasoning: agree; the two block cases are exactly OL-C2 and OL-C3, and "second owner-set objective" is framing that attributes nothing to Max Cogar beyond those two confirmed cases.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L328-L329]] "`[OL-C3, OL-C5]` and skill non-conformance `[OL-C2]`"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L69]] "A case where the oracle should block: answer-drift"
**Correct verdict:** keep — owner decisions carried faithfully.

### E-23
**Agree/Disagree:** Verdict: agree (keep). Reasoning: agree; "answered before the agent moves on" covers every next move, including ending the turn, which is OL-C5's rule and what OL-R5 insists on.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L333-L334]] "enforce that a question Max asks is answered before the agent moves on"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L71]] "if i ask a question and their next move isnt a direct answer or them taking actions to provide an answer, then then need corrected"
**Correct verdict:** keep — faithful statement of OL-C3/OL-C5.

### E-24
**Agree/Disagree:** Verdict: agree (replace). Reasoning: agree; OL-C2 joins two triggers with OR ("CANT PROVIDE A REASON … OR STEERING ISNT WORKING"); the §8 bullet keeps only the first, so a stated reason always ends the matter, which contradicts FR-A2k and FR-C3 that keep both. Classification is right: the line carries an owner decision and restoring his wording is his to sign.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L335-L336]] "either follows their steps or states why it skipped one"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L68]] "IF THEY CANT PROVIDE A REASON FOR SKIPPING A STEP OR SOMETHING, OR STEERING ISNT WORKING, THEN THEY SHOULD BE FUCKING BLOCKED."
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L717-L718]] "agent skips a step without a stated reason or steering isn't working"
**Correct verdict:** replace — restore both OL-C2 triggers; owner decision — goes to Max Cogar.

### E-25
**Agree/Disagree:** Verdict: agree (keep). Reasoning: agree; whether the oracle may halt an agent in a new situation is a scope call, which CLAUDE.md routes to the owner.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L338]] "Adding any third block is an owner decision for Max, not one the spec or the architect may derive."
- [[middleware/context-oracle/CLAUDE.md@ec3b057:L160]] "a preference, a scope call"
**Correct verdict:** keep — correct ownership rule.

### E-26
**Agree/Disagree:** Verdict: agree (replace). Reasoning: agree on the defect, with two corrections to the replacement text. The defect is real: OL-C5 covers every next move; ending the turn with text that does not answer fires no `PreToolUse`, so the spec leaves it to a best-effort Stop whisper — "delivery, not a block" — which is the "agent silently ends its turn … out of scope" narrowing OL-R5 recorded as the agent's, not Max Cogar's. The 2026-08-25 rebuild dropped Stop because it judged the stop case "the wrong scenario"; OL-R5 postdates and contradicts that premise. The fix does not conflict with the three rules the coordinator named: (1) OL-R4 is the generated-file block and is untouched; (2) it is OL-C3's own case ("block that motherfucker until it stops ignoring me and actually answers") at the moment he is ignored, reactive, so not the OL-C2 pre-emptive gate; (3) FR-B's "a text turn is never denied" still holds — a Stop block fires only after the final text is already emitted and only when that text does not answer, it never retracts or refuses a text answer, and a text answer remains the way out. What the hooks reference allows and bounds: `decision: "block"` "prevents Claude from stopping" with a required `reason`; `hookSpecificOutput.additionalContext` also continues the turn "through the same loop protections"; `stop_hook_active` is an input telling the hook it is already in a continuation; the 8-consecutive-continuation cap (raisable by env var) overrides the next block and ends the turn; `last_assistant_message` gives the final text with no transcript lag. Corrections: (a) "bounded by `stop_hook_active`" is wrong as a bound — it is an input; for answer-drift the condition always resolves by a text answer, so the hook keeps blocking while the question stays unanswered and the harness cap is the bound (its release with the question open is the recorded fault, as the first audit says); (b) the reference recommends `additionalContext` "when the hook is working as designed and giving Claude guidance", with `decision: "block"` surfacing as a hook error, so the continuation form should be left to the architect exactly as FR-B4 leaves it, not fixed to `decision: "block"`. The FR-B5 answer-drift posture (err toward not blocking; a clarifying question back to Max is answer-directed) applies at Stop too. Classification is right: the rule is Max Cogar's, the landing point is engineering, and the text goes to him under M38. Part a of this audit reaches the same finding independently (spec-audit-a E-19).
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L351-L352]] "The block lands on the *action taken in violation of the condition* — **not at a"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L426]] "It is **delivery, not a block**"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L369-L370]] "A text turn is never a tool action, so it is never denied: the way out always"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L60]] "case described as out of scope"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L69]] "the oracle should block that motherfucker until it stops ignoring me and actually answers."
- [[middleware/context-oracle/docs/reviews/2026-08-25-blocking-model-rebuild-6-rounds.md@ec3b057:L13-L15]] "which modeled the wrong scenario"
- [[https://code.claude.com/docs/en/hooks.md]] "\"block\" prevents Claude from stopping. Omit to allow Claude to stop"
- [[https://code.claude.com/docs/en/hooks.md]] "after stop hooks have continued the turn eight times in a row, Claude Code overrides the next block and ends the turn"
- [[https://code.claude.com/docs/en/hooks.md]] "Check this value or process the transcript to avoid blocking on a condition that will never resolve."
- [[https://code.claude.com/docs/en/hooks.md]] "Use additionalContext when the hook is working as designed and giving Claude guidance"
- [[https://code.claude.com/docs/en/hooks.md]] "It keeps the conversation going through the same loop protections as decision: \"block\", namely the stop_hook_active input and the 8-consecutive-continuation cap"
**Correct verdict:** replace — the block lands on the deviating move: a non-answer-directed tool action is denied at `PreToolUse`; a turn that ends with Max's question unanswered (judged from `last_assistant_message`, FR-B5 posture) is continued at `Stop` with "answer Max's question first: `<q>`" (continuation form the architect's), re-issued while the question stays unanswered and bounded by the harness's consecutive-continuation cap, a cap release with the question open being an FR-M2 fault; engineering line, to Max Cogar under M38.

### E-27
**Agree/Disagree:** Verdict: agree (replace). Reasoning: agree. Part (a) follows from E-26 (same corrections: the harness cap is the bound, the continuation form is the architect's). Part (b): FR-B1 encodes "steering isn't working" only as "deviates anyway after the steer, without a stated reason", so a stated reason always clears even when steering keeps failing; OL-C2's OR makes that a separate trigger. Routing (b) to Max Cogar, including what "steering is not working" means, is correct — the proposed wording "a stated reason clears it unless steering on that step is not working" is one reading, offered for his decision, not substituted for his intent. The standing parts of FR-B1 (answer-directed actions run freely, substantive-answer clear, lag-window hold backed by the documented transcript lag, multiple questions, main-agent scope, phasing) were checked and stand.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L391-L393]] "Following the step, or stating a reason, clears it."
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L68]] "OR STEERING ISNT WORKING, THEN THEY SHOULD BE FUCKING BLOCKED."
- [[https://code.claude.com/docs/en/hooks.md]] "The transcript file is written asynchronously and may lag the in-memory conversation"
**Correct verdict:** replace — (a) add the Stop landing point per E-26 as corrected (engineering, to Max Cogar under M38); (b) restore OL-C2's second trigger in the skill clause — owner decision — goes to Max Cogar.

### E-28
**Agree/Disagree:** Verdict: agree (replace). Reasoning: agree; "so it avoids retrying" is not on the current hooks reference (re-checked against a fresh fetch), which now says only that the deny reason is "shown to Claude"; FR-B2's conclusion (retry behaviour measured, not assumed) does not depend on the phrase.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L401-L402]] "The contract returns the deny reason to the model \"so it"
- [[ran]] `curl -sS -o /tmp/claude-0/-home-user-agent-armory/779c0f74-86b0-5e8f-b02d-811e78ed3f66/scratchpad/specaudit/so-b/hooks.md https://code.claude.com/docs/en/hooks.md; python3 /tmp/claude-0/-home-user-agent-armory/779c0f74-86b0-5e8f-b02d-811e78ed3f66/scratchpad/specaudit/so-b/q.py /tmp/claude-0/-home-user-agent-armory/779c0f74-86b0-5e8f-b02d-811e78ed3f66/scratchpad/specaudit/so-b/hooks.md "so it avoids retrying" 'For "deny", shown to Claude'` → `NO  so it avoids retrying` / `OK  For "deny", shown to Claude`
- [[https://code.claude.com/docs/en/hooks.md]] "For \"deny\", shown to Claude"
**Correct verdict:** replace — the first audit's wording (reason "shown to Claude", hooks reference fetched 2026-09-29); engineering wording, to Max Cogar under M38.

### E-29
**Agree/Disagree:** Verdict: agree (replace). Reasoning: agree. (a) The spec's italic quotation is not the source's words; the Week 23 digest states the fact in its own words, and the primary record is Claude Code 2.1.163 (June 4, 2026), which I add. (b) With the E-26 Stop landing point, an unanswered question at the end of any turn is handled by the answer-drift block itself, so the best-effort line with its two limits (fires only when the done-claim recognizer fires) is superseded; the owner-facing `status`/`log` record stays. Part (b) falls if E-26 is rejected, as the first audit says.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L409-L410]] "providing feedback to Claude"
- [[https://code.claude.com/docs/en/whats-new/2026-w23.md]] "Stop and SubagentStop hooks can return hookSpecificOutput.additionalContext to give Claude feedback and keep the turn going instead of being treated as an error"
- [[https://code.claude.com/docs/en/changelog.md]] "Hooks: Stop and SubagentStop hooks can now return hookSpecificOutput.additionalContext to give Claude feedback and keep the turn going without being labeled a hook error"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L423-L424]] "fires only if the completion-claim recognizer (FR-A2g) fires, which errs toward not-firing"
**Correct verdict:** replace — (a) quote the digest/changelog exactly with date (2.1.163, June 4, 2026); (b) replace the outstanding-question sub-bullet as the first audit states; engineering, to Max Cogar under M38.

### E-30
**Agree/Disagree:** Verdict: agree (keep). Reasoning: agree; the asymmetry is derived in D-35, each under-fire guard sits where the miss is or is not visible to Max Cogar, and answer correctness is excluded to avoid the unconstrained judge. With E-26 adopted the same posture governs the Stop landing point and the line needs no change; the answer-drift human guard is also strengthened, since a turn-end miss is then caught automatically.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L445-L447]] "a missed"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L836-L837]] "The two blocks have different cost functions, so precision is calibrated"
**Correct verdict:** keep — engineering line with its reasoning in D-35.

### E-31
**Agree/Disagree:** Verdict: agree (replace). Reasoning: agree that FR-B3 bounds only `permissionDecision` and must also bound the Stop-time continuation. Disagree with the appended text: it bounds only `decision: "block"`, but the reference says `hookSpecificOutput.additionalContext` on Stop also keeps the turn going under the same loop protections, and FR-B4 (and, per E-26 as corrected, possibly the answer-drift Stop block) may use that form. Bounding one form leaves the other open as a path to a standing continuation gate — the gap FR-B3 exists to close.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L464-L466]] "A `permissionDecision`"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L412-L413]] "Either way the oracle injects"
- [[https://code.claude.com/docs/en/hooks.md]] "It keeps the conversation going through the same loop protections as decision: \"block\", namely the stop_hook_active input and the 8-consecutive-continuation cap"
**Correct verdict:** replace — append "A Stop-time continuation, in either form (`decision: "block"` or `hookSpecificOutput.additionalContext`), is emitted only for the answer-drift end-of-turn case (FR-B1) and FR-B4's single-cycle whisper, never otherwise"; engineering, to Max Cogar under M38.

### E-32
**Agree/Disagree:** Verdict: agree (keep). Reasoning: agree; retained documents cite FR-O4/FR-O4a and the note resolves them consistently with FR-B3/FR-B4.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L469-L470]] "v1 **does** deny reactively in"
- [[middleware/context-oracle/docs/architecture-context-oracle.md@ec3b057:L12]] "citations resolve per the spec §8 retired-ID note"
**Correct verdict:** keep — needed citation-resolution record.

### E-33
**Agree/Disagree:** Verdict: agree (replace). Reasoning: disagree with two of the seven parts of the fix. (a) The first audit says "and that text is preserved even if the tool call later fails" has no source and deletes it, relying on the 2026-09-28 coordinator ruling that the clause "is on no page of the hooks reference". That is true of the hooks reference but not of Anthropic's primary record: the Claude Code changelog, release 2.1.110 (April 15, 2026), reads "Fixed `PreToolUse` hook `additionalContext` being dropped when the tool call fails". Fetched with curl and located inside the 2.1.110 `<Update>` block, this sources the clause exactly as part c's E-53 states. The correct fix keeps the clause and cites the changelog (it was stated without a source, not stated falsely); deleting a true, now-sourced harness fact is itself a narrowing. The tested permission-rule facts the first audit adds (Bash permission deny fires `PreToolUse` and the context arrives; `Edit`/`Read` path deny rules are rejected before hooks) stand and sit beside the clause. (e) The replacement timeout list omits the reference's fourth lowered event: `MessageDisplay` hooks default to 10s. Parts (b) PostModelSwitch plain stdout, (c) no "avoids retrying", (d) subagent context reaches the subagent, parent via `PostToolUse` on `Agent`, (f) the Stop landing point per E-26 (as corrected there), and (g) re-dating are right and verified against a fresh fetch.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L480-L481]] "that text is preserved even if the tool call later fails"
- [[middleware/context-oracle/docs/reviews/2026-09-28-branch-audit-coordinator-rulings-schema-and-edit-timing.md@HEAD:L90-L91]] "is on no page of the hooks reference"
- [[https://code.claude.com/docs/en/changelog.md]] "Fixed PreToolUse hook additionalContext being dropped when the tool call fails"
- [[ran]] ``curl -sS -o /tmp/claude-0/-home-user-agent-armory/779c0f74-86b0-5e8f-b02d-811e78ed3f66/scratchpad/specaudit/so-b/changelog.md https://code.claude.com/docs/en/changelog.md; awk '/<Update label=/{v=$0} /Fixed `PreToolUse` hook `additionalContext` being dropped/{print v}' /tmp/claude-0/-home-user-agent-armory/779c0f74-86b0-5e8f-b02d-811e78ed3f66/scratchpad/specaudit/so-b/changelog.md`` → ``<Update label="2.1.110" description="April 15, 2026">``
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-c.md@HEAD:L793]] "the Claude Code changelog sources it (2.1.110, April 15, 2026)"
- [[middleware/context-oracle/docs/reviews/2026-09-28-branch-audit-hook-context-permission-denial.md@HEAD:L41]] "A permission-rule denial fires `PreToolUse`,"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L505-L506]] "(lowered to 30s under"
- [[https://code.claude.com/docs/en/hooks.md]] "Claude Code lowers the command, http, and mcp_tool default to 30 on"
- [[ran]] ``curl -sS https://code.claude.com/docs/en/hooks.md | grep -o 'and to 10 on \[`MessageDisplay`\]'`` → ``and to 10 on [`MessageDisplay`]``
- [[https://code.claude.com/docs/en/hooks.md]] "The exceptions are UserPromptSubmit, UserPromptExpansion, SessionStart, and PostModelSwitch, where Claude Code adds plain-text stdout as context"
**Correct verdict:** replace — as the first audit's (b), (c), (d), (f), (g), with (a) changed to: keep "that text is preserved even if the tool call later fails", cited to the Claude Code changelog 2.1.110 (April 15, 2026), and add the tested permission-rule facts; and (e) "lowered to 30s on `UserPromptSubmit`, `PreModelSwitch` and `PostModelSwitch`, and to 10s on `MessageDisplay`"; engineering wording of harness facts, to Max Cogar under M38.

### E-34
**Agree/Disagree:** Verdict: agree (replace). Reasoning: agree, and the fail-open half has a stronger backing than the first audit names. Failing open toward the agent is not a patch: a deny issued when the oracle cannot establish that the agent deviated would be a deny before the agent has actually deviated — the pre-emptive gate FR-B3 makes structurally impossible and OL-C2 rejects — so on a block path an unknown condition must emit no deny. The harness agrees for timeouts and exit 1. The defect is the silent half: none of "shim/service error" or "missing store" is an FR-M2 class, so the fault that switches a block off is swallowed, which the branch audit observed. The `[OL-3]` tag stretches a statement Max Cogar made about the generated-file block (OL-C7). The replacement (fail open for the agent, record and count every such event as a self-detected fault, block-off flagged) is the correct line, not a stated limitation.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L508-L510]] "Any shim/service error, timeout, or missing"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L459-L460]] "the oracle never"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L41]] "that he said this specifically to"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L265-L266]] "hooks not firing, latency breaches, store"
- [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B3-verification.md@HEAD:L54-L55]] "silently turns the OL-C3 answer-drift deny off."
- [[https://code.claude.com/docs/en/hooks.md]] "a timed-out command hook lets the tool call continue."
- [[https://code.claude.com/docs/en/hooks.md]] "Without valid JSON on stdout, Claude Code treats exit code 1 as a non-blocking error and proceeds with the action"
**Correct verdict:** replace — the first audit's FR-O3 text, with FR-B3 (no deny without an established deviation) added to its backing; engineering, to Max Cogar under M38.

### E-35
**Agree/Disagree:** Verdict: agree (replace). Reasoning: agree; C-1, NF-1 and C-6 call themselves engineering choices/judgments, so "fixed by circumstance" contradicts the items it heads.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L512]] "**Constraints fixed by circumstance:**"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L825]] "Runtime is Node.js by engineering choice, not circumstance (C-1)."
**Correct verdict:** replace — the first audit's label; engineering wording, to Max Cogar under M38.

### E-36
**Agree/Disagree:** Verdict: agree (undetermined). Reasoning: partly disagree. Step (1) overstates: one execution of Python's stdlib `sqlite3` with FTS5 in this container does not contradict "weaker … store options", because Python's module uses whatever runtime SQLite library it is linked against and its compile options vary by platform (the Python docs say so for loadable extensions, citing macOS), while `node:sqlite` compiles its own amalgamation with flags pinned in `sqlite.gyp` per Node release — a real, sourced advantage for Node's store path. What the first audit gets right: the line still cannot stand as written. (a) Its floor "v22.13.0 / v23.4.0" does not deliver C-2's FTS5: the 22.x line gains `SQLITE_ENABLE_FTS5` only at v22.16.0, and no 23.x release has it (checked at v23.4.0 and the last, v23.11.1). (b) "current LTS" was v22 when written; on 2026-09-29 v22 is in maintenance (since 2025-10-21) and v24 is the Active LTS, which has FTS5 from v24.0.0 — the line does not say which it means. (c) `node:sqlite` is experimental in 22.x (Node prints an ExperimentalWarning on v22.22.2), a risk the line does not state. (d) D-33's "language the Claude Code tooling ecosystem already assumes" has no source. The runtime comparison also turns on the parser path and on what C-3 forbids, which waits on the owner answer in E-38, so the correct runtime line cannot yet be written. Classification: engineering, gated on an owner answer.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L514]] "Runtime: Node.js, current LTS"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L517]] "unflagged from **v22.13.0 / v23.4.0**"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L520]] "they are rejected for weaker cold-start/no-toolchain store options"
- [[https://docs.python.org/3/library/sqlite3.html]] "Version number of the runtime SQLite library as a string"
- [[https://docs.python.org/3/library/sqlite3.html]] "because some platforms (notably macOS) have SQLite libraries which are compiled without this feature"
- [[ran]] `for t in v22.13.0 v22.15.0 v22.16.0 v23.4.0 v23.11.1 v24.0.0; do printf "%s " $t; curl -sS https://raw.githubusercontent.com/nodejs/node/$t/deps/sqlite/sqlite.gyp | grep -c "SQLITE_ENABLE_FTS5"; done` → `v22.13.0 0` / `v22.15.0 0` / `v22.16.0 1` / `v23.4.0 0` / `v23.11.1 0` / `v24.0.0 1`
- [[ran]] `curl -sS https://raw.githubusercontent.com/nodejs/Release/main/schedule.json | python3 -c "import json,sys;d=json.load(sys.stdin);[print(k,d[k].get('lts'),d[k].get('maintenance'),d[k]['end']) for k in ('v22','v23','v24','v26')]"` → `v22 2024-10-29 2025-10-21 2027-04-30` / `v23 None 2025-04-01 2025-06-01` / `v24 2025-10-28 2026-10-20 2028-04-30` / `v26 2026-10-28 2027-10-20 2029-04-30`
- [[ran]] `node -e "const {DatabaseSync}=require('node:sqlite');const d=new DatabaseSync(':memory:');d.exec('create virtual table t using fts5(x)');console.log(process.version,'fts5 ok')"` → `v22.22.2 fts5 ok` and stderr `ExperimentalWarning: SQLite is an experimental feature and might change at any time`
- [[https://nodejs.org/api/sqlite.html]] "SQLite is no longer behind --experimental-sqlite but still experimental."
**Correct verdict:** undetermined — known corrections: floor v22.16.0 on 22.x or v24.0.0 on 24.x (no 23.x), name the LTS line, state experimental status in 22.x/24.x, drop the unsourced ecosystem reason; missing: a written runtime comparison against C-2/C-3 and the parser path, which waits on the E-38 owner answer. Engineering decision.

### E-37
**Agree/Disagree:** Verdict: agree (replace). Reasoning: agree, with the version facts completed. The Node 22 changelog lists "sqlite: enable common flags" (#57621) in the 22.16.0 release, matching the per-tag `sqlite.gyp` check; 23.x never enabled FTS5; 24.x has it from v24.0.0. "now ships" with no version lets a build on 22.13–22.15 pass C-1 and fail C-2. The first audit's text states only the 22.x floor; it should also name the 24.x line (the current Active LTS) so the constraint is not read as 22-only.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L522]] "stock `node:sqlite` now ships FTS5"
- [[https://raw.githubusercontent.com/nodejs/node/main/doc/changelogs/CHANGELOG_V22.md]] "**sqlite**: enable common flags (Edy Silva)"
- [[ran]] `curl -sSL https://raw.githubusercontent.com/nodejs/node/main/doc/changelogs/CHANGELOG_V22.md | awk '/^## 20/{v=$0} /sqlite\*\*: enable common flags/{print v}'` → `## 2025-05-21, Version 22.16.0 'Jod' (LTS), @aduh95`
- [[https://raw.githubusercontent.com/nodejs/node/v22.16.0/deps/sqlite/sqlite.gyp]] "'SQLITE_ENABLE_FTS5',"
**Correct verdict:** replace — "stock `node:sqlite` compiles SQLite with FTS5 from Node v22.16.0 on the 22.x line and from v24.0.0 on 24.x (no 23.x release has it; `deps/sqlite/sqlite.gyp` per tag and the v22.16.0 changelog, checked 2026-09-29)", property sentence unchanged; engineering fact, to Max Cogar under M38.

### E-38
**Agree/Disagree:** Verdict: agree (undetermined, owner question). Reasoning: agree. OL-4 is five words; RETHINK §12.4 ties "sandbox" to the archived `…-sandbox` build, while RETHINK §12.2 speaks of "offline sandboxes" and "true air-gap", so the recorded rationale supports at least two meanings and no source picks one. C-3's three clauses are an agent derivation with no steps, and "no prebuilt-binary download" is ambiguous about binaries inside a registry package (the `tree-sitter` npm tarball ships six platform binaries; re-run below). What "sandbox" means is Max Cogar's environment, so the question is his. The question must quote his exact ledger words and be put in plain language: OL-4 reads "Sandbox compatibility is required." — which places must the oracle work in: his own computer, Claude Code cloud sessions like this one, a computer with no internet at all?
**Evidence:**
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L42]] "Sandbox compatibility is required."
- [[middleware/context-oracle/RETHINK.md@ec3b057:L337]] "The old sandbox build is archived as"
- [[middleware/context-oracle/RETHINK.md@ec3b057:L301-L302]] "offline sandboxes"
- [[middleware/context-oracle/RETHINK.md@ec3b057:L318]] "for true air-gap"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L530-L531]] "no prebuilt-binary download"
- [[ran]] `npm pack tree-sitter --dry-run 2>&1 | grep -E "prebuilds|version"` → `prebuilds/darwin-arm64/tree-sitter.node`, `prebuilds/darwin-x64/tree-sitter.node`, `prebuilds/linux-arm64/tree-sitter.node`, `prebuilds/linux-x64/tree-sitter.node`, `prebuilds/win32-arm64/tree-sitter.node`, `prebuilds/win32-x64/tree-sitter.node`, `src/conversions.cc`, `src/conversions.h` (matched by "version"), `version: 0.25.1` (each line prefixed `npm notice`, file lines with a size)
**Correct verdict:** undetermined — owner question for Max Cogar, quoting OL-4 "Sandbox compatibility is required.": which environments that means (his own computer, Claude Code cloud sessions, an offline machine); C-3 is then rewritten to state what those lack.

### E-39
**Agree/Disagree:** Verdict: agree (replace). Reasoning: agree; C-4 imports FR-O2 wholesale and pins a date older than FR-O2's own 2026-09-26 re-read and older than the drift found in E-33.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L533]] "the facts above (FR-O2), verified 2026-08-25"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L485]] "(hooks reference re-read 2026-09-26)"
**Correct verdict:** replace — C-4 points to FR-O2 as corrected in E-33 (including the changelog source) with the fetch date; engineering, to Max Cogar under M38.

### E-40
**Agree/Disagree:** Verdict: agree (keep). Reasoning: agree; the MCP 2026-07-28 Sampling page deprecates the feature under SEP-2577 and tells new implementations not to adopt it; the oracle's model path is the host CLI.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L534]] "No MCP sampling"
- [[https://modelcontextprotocol.io/specification/2026-07-28/client/sampling]] "The Sampling feature is deprecated as of protocol version 2026-07-28"
- [[https://modelcontextprotocol.io/specification/2026-07-28/client/sampling]] "New implementations SHOULD NOT adopt it"
**Correct verdict:** keep — verified against the MCP specification.

### E-41
**Agree/Disagree:** Verdict: agree (undetermined). Reasoning: agree. D-31 states only whose the numbers are; RETHINK's "~1–2s" is unsourced; the NN/g response-time limits concern a person waiting on an interface, not per-tool-call overhead in an agent loop; "carry to the next event" delivers a deterministic whisper late with no FR-J5-style bound; the `[OL-3]` tag has E-34's defect. No measurement exists yet from which to set 1.5s/3s.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L535-L536]] "then silence and carry to the next event."
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L815]] "Latency numbers (1.5s/3s) are an engineering judgment"
- [[middleware/context-oracle/RETHINK.md@ec3b057:L183]] "Answer within ~1–2s or stay silent this round"
- [[middleware/context-oracle/CLAUDE.md@ec3b057:L223-L224]] "Numbers without sources"
- [[https://www.nngroup.com/articles/response-times-3-important-limits/]] "1.0 second is about the limit for the user's flow of thought to stay uninterrupted"
**Correct verdict:** undetermined — known fixes as the first audit lists; missing: a source or measurement for the numbers. Engineering decision.

### E-42
**Agree/Disagree:** Verdict: agree (replace). Reasoning: agree; OL-C1 governs whether to speak, so using it to bar a language list is the widening OL-C7 names; "not English-only" confuses natural and programming languages; the only owner input is his handed-over "probably more than just lik 3", and a testable floor (the languages in the repositories the oracle runs on) plus an uncapped extensible interface keeps the intent without inventing an owner rule.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L543-L544]] "a fixed cap is an arbitrary limit of the kind `[OL-C1]` bars"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L67]] "Whether to speak is decided solely by whether the information is important"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L83]] "probably more than just lik 3 of"
**Correct verdict:** replace — the first audit's C-6 text; engineering line, to Max Cogar under M38.

### E-45
**Agree/Disagree:** Verdict: agree (replace). Reasoning: agree; "every source confirmed" is false while rows misstate their sources (E-47, E-50, E-53, E-56, E-58, E-59, E-55), and the blanket claim lends each row a check it did not get.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L550]] "Every source below was confirmed against its current primary/authoritative source"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L565]] "Sadowski, van Gogh, Söderberg, Jaspan, Winter"
**Correct verdict:** replace — the first audit's lead; engineering, to Max Cogar under M38.

### E-47
**Agree/Disagree:** Verdict: agree (replace). Reasoning: agree on dropping "so it avoids retrying" and adding E-33's facts, with the same two additions as E-33: the row must carry the source for the preserved-on-failure behaviour (Claude Code changelog 2.1.110, which is not the hooks reference the row names), and the timeout facts must include `MessageDisplay` (10s). The row's "returned to the model *as the tool result*" is consistent with the current reference, which describes a command hook's deny as returning the reason to Claude as the tool error; the other row facts (precedence, Stop channels, cap, `last_assistant_message`, lag, subagent fields) match a fresh fetch.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L556]] "provided \"so it avoids retrying\""
- [[https://code.claude.com/docs/en/hooks.md]] "precedence is deny > defer > ask > allow"
- [[https://code.claude.com/docs/en/hooks.md]] "equivalent to a command hook's permissionDecision: \"deny\""
- [[https://code.claude.com/docs/en/changelog.md]] "Fixed PreToolUse hook additionalContext being dropped when the tool call fails"
**Correct verdict:** replace — as the first audit states, plus a changelog source (2.1.110) for the preserved-on-failure fact and `MessageDisplay` 10s in the timeouts; engineering, to Max Cogar under M38.

### E-48
**Agree/Disagree:** Verdict: agree (replace). Reasoning: agree; checking the branch head says nothing about which releases have FTS5. The replacement should also carry the 24.x fact (FTS5 from v24.0.0) and the 23.x absence (E-36/E-37), and cite the v22.16.0 changelog entry as well as the per-tag `sqlite.gyp` check. The docs' stability history (experimental in 22.13/23.4, release candidate from v25.7.0) is confirmed.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L557]] "FTS5 state per `deps/sqlite/sqlite.gyp` (v22.x) + local execution"
- [[https://nodejs.org/api/sqlite.html]] "SQLite is now a release candidate."
- [[https://nodejs.org/api/sqlite.html]] "SQLite is no longer behind --experimental-sqlite but still experimental."
- [[https://raw.githubusercontent.com/nodejs/node/main/doc/changelogs/CHANGELOG_V22.md]] "**sqlite**: enable common flags (Edy Silva)"
**Correct verdict:** replace — the first audit's row text plus "FTS5 from v24.0.0 on 24.x; none on 23.x; v22.16.0 changelog 'sqlite: enable common flags'"; engineering, to Max Cogar under M38.

### E-49
**Agree/Disagree:** Verdict: agree (keep). Reasoning: agree; the TSE 2005 PDF carries the bibliographic data and both uses. Read in context, the recency passage is a results finding of §7.11 ("Results: Recent Changes"), which grounds recency weighting as a tunable option — what the row claims.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L558]] "co-change / logical coupling, incl. recency-weighted horizon"
- [[https://thomas-zimmermann.com/publications/files/zimmermann-tse-2005.pdf]] "For projects that are frequently restructured, assigning a higher weight to recent changes can increase precision and recall."
**Correct verdict:** keep — verified.

### E-50
**Agree/Disagree:** Verdict: agree (replace). Reasoning: agree; a full-text search of the Herzig & Zeller PDF finds "merge" only in its partition-merge algorithm and one line on merging change sets, never merge commits; ROSE states the merge problem directly — in CVS a merge is one large transaction, which is why ROSE ignores changes over 30 entities.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L559]] "grounded by `[HERZIG]`: tangled/merge changes inject noise"
- [[https://thomas-zimmermann.com/publications/files/zimmermann-tse-2005.pdf]] "In a CVS archive, the merge of a branch is not reflected"
- [[https://thomas-zimmermann.com/publications/files/zimmermann-tse-2005.pdf]] "one must avoid the large merge transactions. ROSE does so by ignoring all changes that affect more than 30 entities."
**Correct verdict:** replace — ground merge exclusion in ROSE as the first audit states; engineering, to Max Cogar under M38.

### E-51
**Agree/Disagree:** Verdict: agree (keep). Reasoning: agree; both 2025 entries exist under those names and govern T1/T3.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L560]] "LLM01 Prompt Injection, LLM02 Sensitive Information Disclosure"
- [[https://genai.owasp.org/llmrisk/llm01-prompt-injection/]] "LLM01:2025 Prompt Injection"
- [[https://genai.owasp.org/llmrisk/llm022025-sensitive-information-disclosure/]] "LLM02:2025 Sensitive Information Disclosure"
**Correct verdict:** keep — verified.

### E-52
**Agree/Disagree:** Verdict: agree (keep). Reasoning: agree; the cheat sheet covers indirect injection including repository text read by coding assistants.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L561]] "OWASP LLM Prompt Injection Prevention Cheat Sheet"
- [[https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html]] "Code comments and documentation that AI coding assistants analyze"
**Correct verdict:** keep — verified.

### E-53
**Agree/Disagree:** Verdict: agree (replace). Reasoning: agree; the OWASP announcement presents ASI06 "Memory & Context Poisoning" as an entry of the Top 10 for Agentic Applications and names "Agentic Threats and Mitigations" as a separate earlier deliverable, so the row names the wrong document for the ID.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L562]] "*Agentic AI — Threats and Mitigations* (`genai.owasp.org`) — ASI06 Memory & Context Poisoning"
- [[https://genai.owasp.org/2025/12/09/owasp-top-10-for-agentic-applications-the-benchmark-for-agentic-security-in-the-age-of-autonomous-ai/]] "Memory poisoning reshaped behaviour long after the initial interaction"
**Correct verdict:** replace — cite the OWASP Top 10 for Agentic Applications (December 2025), ASI06; engineering, to Max Cogar under M38.

### E-54
**Agree/Disagree:** Verdict: agree (keep). Reasoning: agree; the sheet treats secrets hardcoded in source and their leakage through copies, and the row's summary is an unquoted paraphrase consistent with it.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L563]] "OWASP Secrets Management Cheat Sheet"
- [[https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html]] "Many organizations have them hardcoded within the source code in plaintext"
**Correct verdict:** keep — verified.

### E-55
**Agree/Disagree:** Verdict: agree (replace). Reasoning: agree; §4 cites RSSE only for "push-mode", so the Governs column overclaims the genre set.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L564]] "push vs pull recommenders | Genre set (§4)"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L158]] "push-mode recommendation surface `[RSSE]`"
- [[https://link.springer.com/book/10.1007/978-3-642-45135-5]] "Recommendation Delivery Emerson Murphy-Hill, Gail C. Murphy Pages 223-242"
**Correct verdict:** replace — Governs: push-mode delivery framing (§4), chapter "Recommendation Delivery"; engineering, to Max Cogar under M38.

### E-56
**Agree/Disagree:** Verdict: agree (replace). Reasoning: agree; the first audit left open whether the proceedings order differs from the Google-hosted PDF. A second source settles it: Google Research's publication page lists the same order (Jaspan before Söderberg).
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L565]] "Sadowski, van Gogh, Söderberg, Jaspan, Winter"
- [[https://static.googleusercontent.com/media/research.google.com/en//pubs/archive/43322.pdf]] "Caitlin Sadowski, Jeffrey van Gogh, Ciera Jaspan, Emma Söderberg, Collin Winter"
- [[https://research.google/pubs/tricorder-building-a-program-analysis-ecosystem/]] "Caitlin Sadowski Jeffrey van Gogh Ciera Jaspan Emma Soederberg Collin Winter"
**Correct verdict:** replace — authors "Sadowski, van Gogh, Jaspan, Söderberg, Winter"; engineering, to Max Cogar under M38.

### E-57
**Agree/Disagree:** Verdict: agree (keep). Reasoning: agree; authors (also on the article's byline), venue, pages and both lessons are confirmed.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L566]] "CACM 61(4) 2018 pp. 58–66"
- [[https://research.google/pubs/lessons-from-building-static-analysis-tools-at-google/]] "Communications of the ACM (CACM), 61 Issue 4 (2018), pp. 58-66"
- [[https://storage.googleapis.com/gweb-research2023-media/pubtools/4365.pdf]] "BY CAITLIN SADOWSKI, EDWARD AFTANDILIAN, ALEX EAGLE, LIAM MILLER-CUSHON, AND CIERA JASPAN"
- [[https://storage.googleapis.com/gweb-research2023-media/pubtools/4365.pdf]] "Careful developer workflow integration is key for static analysis tool adoption."
**Correct verdict:** keep — verified.

### E-58
**Agree/Disagree:** Verdict: agree (replace). Reasoning: agree; Herzig & Zeller show tangled changes add noise to mined data (FR-K2), and say nothing about how a warning presents its evidence (FR-D3), nor give a "rate" FR-D3 uses.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L567]] "FR-D3, FR-K2"
- [[https://www.st.cs.uni-saarland.de/publications/files/herzig-msr-2013.pdf]] "such tangled changes will make all changes to all modules appear related"
**Correct verdict:** replace — Governs: FR-K2 only; engineering, to Max Cogar under M38.

### E-59
**Agree/Disagree:** Verdict: agree (replace). Reasoning: agree; the paper is CHI 2006, pp. 741–750, its measure is human resumption lag, and the reader of a whisper is an agent, so the mission ("at the moment of that decision") is FR-O5's real backing.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L568]] "predict the cost of interruption*, CHI 2007"
- [[https://experts.illinois.edu/en/publications/leveraging-characteristics-of-task-structure-to-predict-the-cost-/]] "Title of host publication CHI 2006"
- [[https://experts.illinois.edu/en/publications/leveraging-characteristics-of-task-structure-to-predict-the-cost-/]] "Pages 741-750"
**Correct verdict:** replace — CHI 2006, pp. 741–750, background only; FR-O5 backed by the mission; engineering, to Max Cogar under M38.

### E-60
**Agree/Disagree:** Verdict: agree (keep). Reasoning: agree; the paper says false positives and presentation are barriers to use, which grounds FR-D1's presentation rules.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L569]] "false positives & warning presentation are the adoption barriers"
- [[https://petertsehsun.github.io/soen7481/papers/icse13b.pdf]] "false positives and the way in which the warnings are presented, among other things, are barriers to use"
**Correct verdict:** keep — verified.

### E-61
**Agree/Disagree:** Verdict: agree (keep). Reasoning: agree; the MCP page tells existing implementations to migrate to provider APIs, which the row summarises; the oracle's own path stays the host CLI (C-5, OL-7).
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L570]] "authors told to call the provider API directly"
- [[https://modelcontextprotocol.io/specification/2026-07-28/client/sampling]] "existing implementations SHOULD migrate to integrating directly with LLM provider APIs"
**Correct verdict:** keep — verified.

### E-62
**Agree/Disagree:** Verdict: agree (replace). Reasoning: agree on the finding; the ROSE figures are right (read in context: support 1, confidence 0.1, feedback 0.64, precision 0.30, recall 0.34, >70% top-3) and "~30" is ROSE's entity cap, but no §9 source gives FR-D1's sentence count and FR-D3 names no rate. One citation defect in the first audit's facts: it sources the "1–5 sentences" origin to RETHINK L182, which is the latency-budget line; the sentence count is on RETHINK L190.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L577-L578]] "grounded by the literature above"
- [[middleware/context-oracle/RETHINK.md@ec3b057:L190]] "one topic, one to five sentences"
- [[https://thomas-zimmermann.com/publications/files/zimmermann-tse-2005.pdf]] "a support count of 1 and a confidence of 0.1 a feedback of 0.64 and a precision of 0.30"
**Correct verdict:** replace — the first audit's paragraph text; engineering, to Max Cogar under M38.

### E-65
**Agree/Disagree:** Verdict: agree (replace). Reasoning: agree that the relayed outputs must include the answer-drift Stop landing point (E-26); as in E-26/E-31, the text should not fix it to `decision: "block"`, since the continuation form is the architect's.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L586]] "and a single Stop-time continuation for the completion-check whisper (FR-B4)"
- [[https://code.claude.com/docs/en/hooks.md]] "Use additionalContext when the hook is working as designed and giving Claude guidance"
**Correct verdict:** replace — "… including a `PreToolUse` `permissionDecision: "deny"` on a block (FR-B1), a Stop-time continuation for the answer-drift end-of-turn case (FR-B1), and a single Stop-time continuation for the completion-check whisper (FR-B4)"; engineering, to Max Cogar under M38.

### E-66
**Agree/Disagree:** Verdict: agree (replace). Reasoning: agree; same conflict as E-16.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L587-L588]] "(the only repo-tree write)"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L1019-L1020]] "differs only by the removed hook wiring"
**Correct verdict:** replace — `init` and `deinit` as the only repo-tree writes; engineering, to Max Cogar under M38.

### E-67
**Agree/Disagree:** Verdict: agree (replace). Reasoning: agree; the preamble reserves storage engines to the architect and C-1 lets the architect choose another runtime, so §10 fixing SQLite contradicts both while C-1 is undetermined.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L590]] "two SQLite stores outside the repo tree"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L16]] "Component boundaries, storage engines, IPC, algorithms"
**Correct verdict:** replace — "two stores outside the repo tree; engine per C-1/C-2"; engineering, to Max Cogar under M38.

### E-68
**Agree/Disagree:** Verdict: agree (keep). Reasoning: agree; the requirement is OL-2/OL-7's property (host CLI, no credentials), "one-shot, tool-disallowed" is least functionality (LLM06), and the flags are explicitly illustrative.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L597]] "the piggyback-with-no-credentials property is"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L45]] "No separate credentials, ever."
- [[https://genai.owasp.org/llmrisk/llm062025-excessive-agency/]] "Minimize extension permissions"
**Correct verdict:** keep — owner property plus least-functionality engineering.

### E-72
**Agree/Disagree:** Verdict: agree (keep). Reasoning: agree; Reuse, Orientation and Consequence need symbol/definition/location lookup, incremental refresh follows from any per-event bound, and the line states a property.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L605-L606]] "of symbols/definitions/locations, incrementally"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L167]] "the canonical helper is"
**Correct verdict:** keep — derived from the genre set and the latency property.

### E-73
**Agree/Disagree:** Verdict: agree (replace). Reasoning: agree; read in context, ROSE's 30-entity cap is its way of dropping CVS merge transactions, so in git (merges explicit and excluded) the reason left for a size cap is tangled-change noise (Herzig), and "~30" is an entity count, not a file count.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L607-L608]] "transactions (illustrative ~30, tunable `[ROSE]`)"
- [[https://thomas-zimmermann.com/publications/files/zimmermann-tse-2005.pdf]] "one must avoid the large merge transactions. ROSE does so by ignoring all changes that affect more than 30 entities."
- [[https://www.st.cs.uni-saarland.de/publications/files/herzig-msr-2013.pdf]] "such tangled changes will make all changes to all modules appear related"
**Correct verdict:** replace — the first audit's FR-K2 text; engineering, to Max Cogar under M38.

### E-74
**Agree/Disagree:** Verdict: agree (keep). Reasoning: agree; pointer-plus-provenance records keep facts checkable (FR-D1) and limit what a poisoned record carries (ASI06), and each kind has a consuming genre.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L610-L611]] "(exemplar, landmine, invariant, recipe) are **pointers to"
- [[middleware/context-oracle/RETHINK.md@ec3b057:L344]] "co-change graph, exemplars, landmines, invariants, task recipes"
**Correct verdict:** keep — backed by ASI06 and P4.

### E-75
**Agree/Disagree:** Verdict: agree (keep). Reasoning: agree; the storage-side statement of FR-X4.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L612]] "Provenance + trust on every record"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L314-L315]] "a trust label rides every fact"
**Correct verdict:** keep — storage counterpart of FR-X4.

### E-76
**Agree/Disagree:** Verdict: agree (replace). Reasoning: agree; a stale fact whose pointer no longer resolves is a checkably-false whisper, which "lowers confidence" still emits (FR-J5's re-resolution covers only model genres), and "never blocks" rests on FR-B1's closed list, not OL-C1. Dropping only the facts whose pointer fails is the correct line (FR-D1's rumor rule), not a fallback.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L613-L614]] "Staleness lowers confidence, never blocks"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L187-L188]] "An uncheckable whisper is a rumor"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L67]] "Whether to speak is decided solely by whether the information is important"
**Correct verdict:** replace — the first audit's FR-K7 text; engineering, to Max Cogar under M38.

### E-77
**Agree/Disagree:** Verdict: agree (undetermined, owner question). Reasoning: agree on the flaw (a data-loss risk in an owner decision): in an ephemeral container every store outside the repository tree is deleted with the container, so corrections (FR-L6), efficacy statistics (FR-L7) and demotion/promotion (P7) never accumulate while `status` looks healthy. Disagree with two details. (1) The first audit treats network persistence as blocked by FR-K9's "no network sync `[OL-6]`"; OL-6's words are "solo scope, no team sharing", which a solo owner syncing his own stores is not, so "no network sync" is an agent line wearing an owner tag (see E-78) and option (b) is not closed by an owner decision — it is an engineering option bounded by T3/FR-X5. (2) The question as written does not quote the ledger; per SPEC-BRIEF it must carry OL-6's exact words and be plain enough for a non-programmer. Asking where he runs agents is genuinely his (a fact about his setup, not derivable), and whether the oracle may keep its memory somewhere that survives is a scope call on his decision.
**Evidence:**
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L44]] "Two stores — per-project and per-user global — both outside the repo tree; solo scope, no team sharing."
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L615-L616]] "no network sync `[OL-6]`"
- [[middleware/context-oracle/CLAUDE.md@ec3b057:L243-L244]] "everything committed and pushed (containers are ephemeral)"
- [[/tmp/claude-0/-home-user-agent-armory/779c0f74-86b0-5e8f-b02d-811e78ed3f66/scratchpad/audit/owner-messages.md@FILE:L513]] "The cloud container restarted mid-review and lost one run."
**Correct verdict:** undetermined — owner question for Max Cogar: "Your decision OL-6 says the oracle's two memory stores are kept 'both outside the repo tree'. In Claude Code cloud sessions, everything outside the repository is deleted when the session ends, so the oracle would forget everything it learned each time. Do you run agents in cloud sessions, on your own computer, or both — and if cloud, may the oracle keep its memory somewhere that survives (for example a private location you choose)?"

### E-78
**Agree/Disagree:** Verdict: agree (undetermined). Reasoning: disagree with step (1): "no network sync" does not follow from OL-6 (location and "no team sharing") or OL-7 (no separate credentials — a sync over the host's own git or the owner's storage need hold no oracle credential). The `[OL-6]` tag on it is a mis-attribution (the ledger rule and OL-C7), the same defect as FR-X7's (E-18). Agree that the export/import requirement has no stated job and that its job, if any, is E-77's persistence question.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L616]] "Export/import round-trip"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L44]] "solo scope, no team sharing"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L45]] "No separate credentials, ever."
**Correct verdict:** undetermined — depends on the E-77 owner answer; when rewritten, "no network sync" loses the `[OL-6]` tag and, if kept, is backed by T3/FR-X5 as an engineering line (to Max Cogar under M38).

### E-80
**Agree/Disagree:** Verdict: agree (keep). Reasoning: agree; OL-2's degraded mode requires model-free candidates and NF-1 keeps the model off the hook path.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L620-L621]] "deterministic candidate generation (always"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L40]] "a deterministic degraded mode is mandatory for air-gap"
**Correct verdict:** keep — derived from OL-2 and NF-1.

### E-81
**Agree/Disagree:** Verdict: agree (keep). Reasoning: agree; this is the one degraded mode the spec requires (BRIEF), specified and surfaced as the FR-M2 class "model path down".
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L622]] "Degraded mode deterministic, mandatory, automatic"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L266]] "model path down"
**Correct verdict:** keep — owner requirement, visible.

### E-82
**Agree/Disagree:** Verdict: agree (keep). Reasoning: agree; OL-2 says "for air-gap", a run-time condition in any phase, which is what FR-J3 states.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L624]] "Degraded mode is a runtime fallback, not a build stage"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L40]] "mandatory for air-gap"
**Correct verdict:** keep — follows from OL-2.

### E-83
**Agree/Disagree:** Verdict: agree (keep). Reasoning: agree; the 2026-09-28 tests ran hooks inside `claude -p`, so a model call made that way can re-invoke the oracle without a guard; AC-21 tests the property.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L625]] "Recursion guard (property)"
- [[middleware/context-oracle/docs/reviews/2026-09-28-branch-audit-hook-context-permission-denial.md@HEAD:L28]] "All runs used Claude Code 2.1.283, `claude -p`, in a throwaway `/tmp`"
**Correct verdict:** keep — necessary, evidenced.

### E-84
**Agree/Disagree:** Verdict: agree (keep). Reasoning: agree; the bound and the re-validation are derived in the line from the mission and FR-D1, with D-37's job statement.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L635]] "is re-resolved against current repo state"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L852-L853]] "deliver at the next relevant"
**Correct verdict:** keep — mission-derived with reasoning in D-37.

### E-86
**Agree/Disagree:** Verdict: agree (replace). Reasoning: agree; FR-A4/FR-D5 already decide automatically in Phase A whether a consumer "visibly incorporated" a whisper, so "no automated uptake judgment" is contradicted unless it means the causal judgment; D-12 gives no reason. The deterministic-observation vs causal-judgment split is the line that makes both consistent, and it matches CACM's consumer-action practice.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L646-L647]] "automated uptake judgment in Phase A"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L197-L198]] "told or has visibly incorporated (FR-A4)"
- [[https://storage.googleapis.com/gweb-research2023-media/pubtools/4365.pdf]] "if developers did not take positive action after seeing the issue"
**Correct verdict:** replace — the first audit's FR-L1 text with D-12's reasoning; engineering, to Max Cogar under M38.

### E-87
**Agree/Disagree:** Verdict: agree (replace). Reasoning: agree; the cited practice demotes a whole analyzer, so correct whispers in a demoted channel are silenced — FR-L4 exists to count exactly those — and "never silences a correct whisper" cannot hold for any demotion. The replacement states what can be guaranteed (measured and recovered) and keeps OL-C1's actual rule (no volume limit).
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L648-L649]] "never silences a"
- [[https://storage.googleapis.com/gweb-research2023-media/pubtools/4365.pdf]] "If the ratio for an analyzer goes above 10%, the Tricorder team disables the analyzer until the author(s) improve it."
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L654-L655]] "(below-bar, or never triggered)"
**Correct verdict:** replace — the first audit's FR-L3 text; engineering, to Max Cogar under M38.

### E-88
**Agree/Disagree:** Verdict: agree (keep). Reasoning: agree; without re-admission a demoted channel yields no measurements and cannot recover — the recorded ratchet-to-silence collapse — and AC-16 tests it.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L650-L652]] "the loop cannot converge to silence"
- [[middleware/context-oracle/docs/collapse-log.md@ec3b057:L202]] "A learning loop that only demotes ratchets to silence."
**Correct verdict:** keep — backed by the recorded failure and P7.

### E-89
**Agree/Disagree:** Verdict: agree (keep). Reasoning: agree; the line derives regret from the mission, labels itself as an agent judgment, scopes to held facts, routes the coverage gap to AC-18, and states the proxy's error posture.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L658-L659]] "not an owner statement"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L847-L848]] "so the tool cannot converge to silence and still"
**Correct verdict:** keep — mission-derived, scoped, reasoning in D-36.

### E-90
**Agree/Disagree:** Verdict: agree (undetermined). Reasoning: agree that the outranking half stands and that "Phase A's calibration signal" rests on an owner who sees whispers and can judge code facts. Disagree with routing part of it to Max Cogar as an owner question on his role: the role is already written. OL-11 (confirmed) says he is "a non-programmer by design" and that verification is the agents'; CLAUDE.md classifies anything decidable from a named line as "already written" or "derivable", not his. So the spec may not rest Phase A's whisper-precision calibration on his review of co-change or reuse facts; what stays open is the engineering comparison of (b) consumer-action uptake observations (E-86) and (c) agent-filed corrections through the same verb. The human channel remains correct where the miss is owner-visible (his own unanswered question, FR-B5).
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L671-L672]] "mined inference and is Phase A's calibration signal (§5.2)"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L49]] "You are a non-programmer by design."
- [[middleware/context-oracle/CLAUDE.md@ec3b057:L154]] "Design, build, verification, sequencing, and process are yours (OL-11)."
- [[middleware/context-oracle/CLAUDE.md@ec3b057:L159]] "**Derivable** from the mission or spec → derive it."
- [[https://code.claude.com/docs/en/hooks.md]] "Claude reads the reminder on the next model request, but it doesn't appear as a chat message in the interface."
**Correct verdict:** undetermined — the outranking half stands; the calibration-signal half needs a written engineering comparison of consumer-action uptake (E-86) and agent-filed corrections, with owner review excluded by OL-11; no owner question.

