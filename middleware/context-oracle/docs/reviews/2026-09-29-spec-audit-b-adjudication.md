# Spec audit — part b (spec lines 277–672): adjudication

This file adjudicates between the first audit
`middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-b.md` (E-1 to E-90; keep 46,
replace 38, undetermined 6) and the second opinion
`middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-b-second-opinion.md` (75 judged;
overturns E-18; changes the fix or its backing on 15 entries). The adjudicator wrote neither the
spec nor either review. The rulings follow
`/tmp/claude-0/-home-user-agent-armory/779c0f74-86b0-5e8f-b02d-811e78ed3f66/scratchpad/audit/BRIEF.md`
and `…/audit/SPEC-BRIEF.md`. The spec is judged at `ec3b057`. `OWNER-LEDGER.md`, `CLAUDE.md` and
`RETHINK.md` are identical at `ec3b057` and `HEAD`.

**What is ruled.** Every entry where the two reviews reach a different verdict, or where the second
opinion changes the fix or its backing: E-18, E-26, E-27, E-29, E-31, E-33, E-34, E-36, E-37,
E-38, E-47, E-48, E-56, E-62, E-65, E-77, E-78, E-90. Part a's first audit, second opinion and
adjudication (`2026-09-29-spec-audit-a*.md`) and part c's first audit and second opinion
(`2026-09-29-spec-audit-c*.md`) were read where they judge the same lines. Where a ruling here
differs from them, it says so under Ruling.

**Sources.** Every web source a ruling depends on was re-fetched with `curl` on 2026-09-29 into
`/tmp/claude-0/-home-user-agent-armory/779c0f74-86b0-5e8f-b02d-811e78ed3f66/scratchpad/specaudit/adj-b/`
(PDFs extracted with pdfminer). Every web quote below was matched against those fetched copies.
Executed checks ran on Node v22.22.2, Python 3.11.15 and npm through the session proxy.

**Sign-off rule.** Every spec change here changes a document Max Cogar signed. Under M38 it goes to
him before it replaces the old line, whether it is an owner decision or an engineering line
([[/tmp/claude-0/-home-user-agent-armory/779c0f74-86b0-5e8f-b02d-811e78ed3f66/scratchpad/audit/owner-messages.md@FILE:L757-L757]] "Because it's in a document you signed, the change comes to you before it replaces the old line."
and his reply [[/tmp/claude-0/-home-user-agent-armory/779c0f74-86b0-5e8f-b02d-811e78ed3f66/scratchpad/audit/owner-messages.md@FILE:L766-L766]] "okay then make a task list and get started").
"Owner question: none" means the line is an engineering line. It reaches him only as a change to
approve, not as a decision for him to make.

### E-18
**Ruling:** The second opinion is right; the first audit's `keep` is overturned. FR-X7 tags both of
its clauses `[OL-6]`. Only "stores outside the repo tree" is OL-6's. OL-6 says "solo scope, no team
sharing"; it says nothing about telemetry, and sending data to a service is not team sharing.
Nothing else in the ledger or `RETHINK.md` mentions telemetry. The ledger forbids writing a claim as
Max Cogar's unless it is under CONFIRMED, and OL-C7 forbids widening his statement past what he
said. The no-telemetry rule is still correct as an engineering line: T3 is secret disclosure from
mined content, and FR-X5 already makes the host-CLI model call the oracle's only network use. The
requirement stays and gets its own backing; only the attribution changes.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L320-L321]] "stores outside the repo tree; no outbound telemetry"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L44-L44]] "Two stores — per-project and per-user global — both outside the repo tree; solo scope, no team sharing."
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L12-L14]] "(spec, decision log, requirements, architecture), find it under CONFIRMED"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L73-L73]] "my statements are getting overgenralized and turned into new project rules"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L304-L305]] "History/files contain secrets the oracle could surface"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L316-L317]] "the only network use is the host CLI piggyback (§10)"
- [[ran]] `git show ec3b057:middleware/context-oracle/RETHINK.md | grep -c -i telemetry` → `0`
**Final verdict:** replace — keep the no-telemetry requirement, backed by T3 and FR-X5 instead of OL-6.
**Correct line:** "- **FR-X7 — Locality (T3, T4)** — stores outside the repo tree `[OL-6]`; no outbound telemetry: the oracle sends no data off the machine other than the host-CLI model call (FR-X5), because mined content can carry secrets (T3)." If Max Cogar's answer to E-77 adds a place where the stores are kept, that place is named here and in FR-X5 as the second permitted destination.
**Owner or engineering:** engineering line (it corrects an attribution; OL-6's half is unchanged). Goes to Max Cogar under M38.
**Owner question:** none

### E-26
**Ruling:** Both reviews find the same defect and add a `Stop` landing point. The second opinion
corrects two parts of the first audit's text, and both corrections hold. This section sets the one
Stop-block line for parts a and b. E-27, E-29, E-31, E-33, E-47 and E-65 below apply it, and part c's
D-32, AC-2a and AC-8a should follow it.
1. *The defect.* OL-C5 covers every next move. After Max asks a question, the agent can call a tool
   that does not serve the answer, or it can end its turn without answering. The mechanism paragraph
   handles only the first, with a `PreToolUse` deny, and says the block is "not at a `Stop`". A text
   turn "is never denied", so the second case is left to a best-effort whisper, "delivery, not a
   block". That is the "agent silently ends its turn" case that OL-R5 records as an agent's
   narrowing and not Max Cogar's rule. The 2026-08-25 rebuild dropped the `Stop` surface because it
   judged a stopping agent "the wrong scenario", and OL-R5 rejected that premise afterwards. A `Stop`
   hook can prevent the stop. It fires only after the agent has ended its turn with the question
   open, so it is reactive. It is not the pre-emptive gate OL-C2 rejects, and it is not the
   generated-file block (OL-R4).
2. *When it re-applies, and what bounds it.* The first audit's "bounded by `stop_hook_active`" is
   wrong as a bound. `stop_hook_active` is an input: it is "true when Claude Code is already
   continuing as a result of a stop hook". The reference tells a hook to check it "or process the
   transcript to avoid blocking on a condition that will never resolve". An open question resolves
   as soon as the agent writes an answer, and a text answer is always open to it. A rule that
   releases once `stop_hook_active` is true would hold for one cycle and then let the agent stop with
   the question open. That is a one-cycle narrowing of OL-C3's "until it stops ignoring me and
   actually answers". So the block is re-evaluated at every `Stop` and re-applies while the question
   is open. It is bounded in three ways. (a) The agent's answer releases it at the next `Stop`.
   (b) The harness cap is the outer bound: after eight consecutive continuations Claude Code
   "overrides the next block and ends the turn". The oracle must never raise the cap through the
   documented variable. (c) The block is visible: a repeat feeds FR-M4's deny-loop signal, and a cap
   release with the question still open is an FR-M2 fault. `Stop` does not run on a user interrupt,
   so Max Cogar can always break in.
3. *What text it reads.* The final message comes from `last_assistant_message`. The reference says
   to use it because the transcript "isn't guaranteed to include the final message at Stop time".
   The final message alone would miss an answer written earlier in the same turn, followed by more
   work, and judging on it alone would hold a complying agent. So the judgment reads all assistant
   text since the question. The earlier messages come from the oracle's own record of assistant text
   (the `MessageDisplay` event fires for every assistant message that streams text) or from the
   transcript, which may lag. Text that is not yet visible is FR-B1's lag window, where the block
   holds. The hold recovers by itself, because the next final message is read at the next `Stop`.
   FR-B5's answer-drift posture governs the judgment: a substantive answer clears the block, and a
   move that plausibly serves the answer is not blocked. The collection mechanism is the architect's.
4. *The continuation form is the architect's.* The first audit fixes the form as
   `decision: "block"`. The reference gives `Stop` two ways to continue the turn, and both have the
   same effect. `decision: "block"` "prevents Claude from stopping". With
   `hookSpecificOutput.additionalContext`, "The conversation continues so Claude can act on it". It
   runs "through the same loop protections", namely `stop_hook_active` and the cap. The two differ
   only in how the transcript labels them. `decision: "block"` shows as a hook error, and the
   reference recommends `additionalContext` "when the hook is working as designed". The spec's
   preamble gives mechanisms to the architect, and FR-B4 already leaves the channel to the architect
   in the same way. The requirement is that the stop is prevented and the turn continues with the
   reason. Part a's adjudication (E-19 and the FR-A2l row) names `decision: "block"` in its correct
   lines. To make the line consistent across parts a and b, those parentheses should read "a `Stop`
   continuation, `decision: "block"` or `hookSpecificOutput.additionalContext`, the architect's
   choice". Nothing else in part a's line differs from this one.
5. The paragraph's "verified … via Context7, 2026-08-25" is superseded by the curl-fetched
   reference.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L342-L343]] "verified against the current Claude Code hooks contract via Context7"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L351-L352]] "The block lands on the *action taken in violation of the condition* — **not at a"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L369-L370]] "A text turn is never a tool action, so it is never denied: the way out always"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L426-L426]] "It is **delivery, not a block**"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L71-L71]] "if i ask a question and their next move isnt a direct answer or them taking actions to provide an answer, then then need corrected"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L69-L69]] "the oracle should block that motherfucker until it stops ignoring me and actually answers. just dont make a convoluted fucked up way that its done."
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L60-L60]] "case described as out of scope"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L41-L41]] "What he rejected is the *pre-emptive* gate"
- [[middleware/context-oracle/docs/reviews/2026-08-25-blocking-model-rebuild-6-rounds.md@ec3b057:L13-L15]] "which modeled the wrong scenario"
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-b.md@HEAD:L392-L392]] "bounded by `stop_hook_active` and the harness's 8-consecutive-continuation cap"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L16-L18]] "Component boundaries, storage engines, IPC, algorithms, and the exact"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L417-L418]] "The exact channel choice is the architect's"
- [[https://code.claude.com/docs/en/hooks.md]] "\"block\" prevents Claude from stopping. Omit to allow Claude to stop"
- [[https://code.claude.com/docs/en/hooks.md]] "Non-error feedback for Claude. The conversation continues so Claude can act on it"
- [[https://code.claude.com/docs/en/hooks.md]] "It keeps the conversation going through the same loop protections as decision: \"block\", namely the stop_hook_active input and the 8-consecutive-continuation cap"
- [[https://code.claude.com/docs/en/hooks.md]] "Use additionalContext when the hook is working as designed and giving Claude guidance"
- [[https://code.claude.com/docs/en/hooks.md]] "The stop_hook_active field is true when Claude Code is already continuing as a result of a stop hook."
- [[https://code.claude.com/docs/en/hooks.md]] "Check this value or process the transcript to avoid blocking on a condition that will never resolve."
- [[https://code.claude.com/docs/en/hooks.md]] "after stop hooks have continued the turn eight times in a row, Claude Code overrides the next block and ends the turn"
- [[https://code.claude.com/docs/en/hooks.md]] "To raise the cap, set"
- [[https://code.claude.com/docs/en/hooks.md]] "Does not run if the stoppage occurred due to a user interrupt."
- [[https://code.claude.com/docs/en/hooks.md]] "The last_assistant_message field contains the text content of Claude's final response"
- [[https://code.claude.com/docs/en/hooks.md]] "the transcript file isn't guaranteed to include the final message at Stop time on all versions"
- [[https://code.claude.com/docs/en/hooks.md]] "fires for every assistant message that streams text"
**Final verdict:** replace — the block lands on both kinds of deviating move. A tool action gets a `PreToolUse` deny. For answer-drift, a turn ending unanswered gets a `Stop` continuation that re-applies while the question is open and is bounded by the answer and the harness cap; its form is the architect's.
**Correct line:** "**The mechanism (verified against the Claude Code hooks reference, fetched 2026-09-29).** The situation a block handles is: the user asks a question (or a skill step is due) and the agent, instead of answering / following it, makes a **deviating move** — for answer-drift, a next move that is neither a direct answer nor an action to provide the answer (OL-C5, FR-B1); for skill non-conformance, an action that skips a due step. The block lands on that move. A deviating **tool action** is caught by a `PreToolUse` hook, which fires after the agent has formed the action but *before* it runs and returns `hookSpecificOutput.permissionDecision: "deny"` with a reason shown to the agent: the oracle denies the deviating action and tells the agent what to do to proceed. For answer-drift, the other deviating move — **ending the turn with Max's question unanswered** — is caught at `Stop`: the hook prevents the stop and continues the turn with the same reason ("answer Max's question first: `<q>`"). The continuation form (`decision: "block"` with `reason`, or `hookSpecificOutput.additionalContext`; both continue the turn under the same loop protections) is the architect's. The `Stop` block is re-evaluated at every `Stop` and re-applies while the question stays open; it releases as soon as the agent's text answers the question. `stop_hook_active` marks a repeat and feeds the deny-loop signal (FR-M4); the outer bound is the harness's consecutive-continuation cap (8 by default), which the oracle never raises, and a cap release with the question still open is a self-detected fault (FR-M2). `Stop` does not run on a user interrupt. Whether the question is answered is judged on all assistant text since the question — the final message from `last_assistant_message`, earlier messages from the oracle's own record of assistant text or from the transcript, which may lag — with FR-B5's posture; text not yet visible is FR-B1's lag window, where the block holds. When the condition clears (the agent answers / follows the step / gives a reason that clears it under FR-B1), its next move is simply allowed; the block keeps no counter and no state beyond the open condition."
**Owner or engineering:** engineering line. The rule (OL-C3, OL-C5) is Max Cogar's and is unchanged; the landing point and its bounds are engineering. Goes to Max Cogar under M38.
**Owner question:** none

### E-27
**Ruling:** Both reviews replace FR-B1, and the verdict and both parts stand. (a) The answer-drift
clause realises the block only as a `PreToolUse` deny. It gains E-26's `Stop` landing point, and the
second opinion is right to strip "bounded by `stop_hook_active`" and the fixed `decision: "block"`
form from the first audit's text, as in E-26. Two sentences of FR-B1 then have to follow. "A text
turn is never a tool action, so it is never denied" stays true, but the way out becomes that a text
answer releases the `Stop` block. In the lag clause, "holds" at `Stop` means the turn is continued.
The other clauses were checked and stand: answer-directed actions run freely, a substantive answer
clears the block, the lag-window hold matches the documented transcript lag, multiple questions are
tracked, the block is scoped to the main agent, and the work is phased. (b) The skill clause keeps
only one of OL-C2's two triggers. His words join "CANT PROVIDE A REASON FOR SKIPPING A STEP" and
"STEERING ISNT WORKING" with OR. FR-A2k and FR-C3 keep both triggers, but FR-B1 says a stated reason
always clears the block. The correct line restores his second trigger in his terms. Whether a
stated reason still clears the block when steering is not working is how his OR applies, and
applying it is his call. It goes to him as a yes/no question and is not settled by an agent's
reading. The first audit's "unless steering on that step is not working" is the literal reading.
It is offered to him, not substituted for his intent.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L359-L361]] "Realised as a"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L369-L370]] "A text turn is never a tool action, so it is never denied: the way out always"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L391-L393]] "Following the step, or stating a reason, clears it."
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L68-L68]] "IF THEY CANT PROVIDE A REASON FOR SKIPPING A STEP OR SOMETHING, OR STEERING ISNT WORKING, THEN THEY SHOULD BE FUCKING BLOCKED."
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L176-L176]] "when the agent skips a step without a stated reason, or steering isn't working"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L717-L718]] "agent skips a step without a stated reason or steering isn't working"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L371-L374]] "`transcript_path` is written"
- [[https://code.claude.com/docs/en/hooks.md]] "The transcript file is written asynchronously and may lag the in-memory conversation"
**Final verdict:** replace — (a) add the answer-drift `Stop` landing point per E-26; (b) restore OL-C2's "steering isn't working" trigger in the skill clause.
**Correct line:** (a) In the answer-drift clause, "Realised as a `PreToolUse` **deny** of the non-answer-directed action, reason *"answer Max's question first: `<the outstanding question(s)>`,"* until the agent answers." becomes "Realised on the deviating move (§8): a non-answer-directed tool action gets a `PreToolUse` **deny**, reason *"answer Max's question first: `<the outstanding question(s)>`"*; a turn that ends with the question unanswered gets a `Stop` continuation with the same reason, re-applied at every `Stop` while the question is open and bounded by the harness's consecutive-continuation cap (continuation form the architect's) — until the agent answers." The sentence "A text turn is never a tool action, so it is never denied: the way out always exists." becomes "A text answer is never denied — a `PreToolUse` deny never touches text, and the `Stop` block releases on it — so the way out always exists." In the lag clause, after "the block **holds/denies rather than pre-clearing**" add "(at `Stop`, holding means continuing the turn)". (b) The skill clause reads: "**Steer first** (an advisory whisper); if the agent takes the deviating action anyway **without a stated reason**, or **steering is not working**, **deny that action**, reason naming the skipped step `[OL-C2]`. Following the step clears it." The sentence on whether a stated reason also clears the block is set by Max Cogar's answer below: if yes, "a stated reason clears it unless steering on that step is not working"; if no, "stating a reason clears it".
**Owner or engineering:** (a) engineering line; goes to Max Cogar under M38. (b) **owner decision — goes to Max Cogar** with OL-C2's exact words.
**Owner question:** Your rule for the skill feature (OL-C2) says, in your words: "IF THEY CANT PROVIDE A REASON FOR SKIPPING A STEP OR SOMETHING, OR STEERING ISNT WORKING, THEN THEY SHOULD BE FUCKING BLOCKED." The spec only kept the first half: as soon as the agent gives any reason for skipping a step, it is let off. Suppose the oracle has already nudged the agent about a step, the agent gives a reason for skipping it, and it keeps skipping it. Should the oracle still block it? Yes means it blocks on either condition, as your words read. No means any stated reason is enough to let it continue.

### E-29
**Ruling:** Both reviews replace FR-B4 in two parts, and both parts stand. (a) The spec puts words in
quotation marks that no source contains, and attributes them to the contract. The second opinion
adds the primary record, and it is right to: the Claude Code changelog 2.1.163 (June 4, 2026) is
where this channel was introduced. The hooks reference is the contract itself, so the correct line
quotes the reference and dates the channel from the changelog. The Week 23 digest says the same
thing in other words and is not needed. (b) With E-26 adopted, an unanswered question at the end of
any turn is handled by the answer-drift `Stop` block. The best-effort outstanding-question line, and
its two limits (it fires only when the done-claim recognizer fires, and only for recognizably-open
questions), is superseded. The owner-facing `status`/`log` record stays. (c) A third correction
follows from E-26 and neither review makes it. "both forms are bounded by `stop_hook_active`" has the
same defect as E-26's bound. `stop_hook_active` is an input, not a limit. If deliver-once were built
as "skip when `stop_hook_active` is true", the completion whisper would be dropped at every real
done-claim that follows an answer-drift continuation. What makes the whisper deliver once is
per-consumer dedup (FR-A4, FR-D5): a fact is never repeated to that consumer, so each continuation
carries only facts not yet delivered, and then the stop proceeds. The harness cap is the outer bound.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L409-L410]] "providing feedback to Claude"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L412-L414]] "the fact **once**; both forms are bounded by `stop_hook_active` (and by the harness's"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L423-L424]] "fires only if the completion-claim recognizer (FR-A2g) fires, which errs toward not-firing"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L222-L224]] "A per-consumer **delivered-set** and **read-set**"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L283-L284]] "**done-claims reached with an outstanding Max question**"
- [[https://code.claude.com/docs/en/hooks.md]] "Non-error feedback for Claude. The conversation continues so Claude can act on it, but unlike decision: \"block\" it is shown in the transcript as hook feedback rather than a hook error"
- [[https://code.claude.com/docs/en/changelog.md]] "Hooks: Stop and SubagentStop hooks can now return hookSpecificOutput.additionalContext to give Claude feedback and keep the turn going without being labeled a hook error"
- [[ran]] `awk '/<Update label=/{v=$0} /Stop and SubagentStop hooks can now return/{print v}' changelog.md` (the changelog fetched with curl 2026-09-29) → `<Update label="2.1.163" description="June 4, 2026">`
- [[https://code.claude.com/docs/en/whats-new/2026-w23.md]] "Stop and SubagentStop hooks can return hookSpecificOutput.additionalContext to give Claude feedback and keep the turn going instead of being treated as an error"
- [[https://code.claude.com/docs/en/hooks.md]] "The stop_hook_active field is true when Claude Code is already continuing as a result of a stop hook."
**Final verdict:** replace — (a) quote the reference and date the channel from the changelog; (b) hand the unanswered-question case to the answer-drift `Stop` block; (c) state deliver-once as dedup, with the harness cap as the outer bound.
**Correct line:** "- **FR-B4 — Completion-check speaks at a `Stop`, as a whisper, not a block.** The completion-check (FR-A2g) and Completeness (FR-A2f) fire when the agent claims done (a `Stop`). `Stop`/`SubagentStop` deliver context to the agent in two forms: `hookSpecificOutput.additionalContext` — "Non-error feedback for Claude. The conversation continues so Claude can act on it, but unlike `decision: "block"` it is shown in the transcript as hook feedback rather than a hook error" (hooks reference, fetched 2026-09-29; added in Claude Code 2.1.163, June 4, 2026) — and `decision: "block"` + `reason`, which continues the turn labelled as a hook error. The oracle injects each fact **once** — it is never repeated to that consumer (FR-A4, FR-D5) — and then lets the stop proceed. `stop_hook_active` is the input that tells the hook the stop is already a continuation; the harness's consecutive-continuation cap (8 by default) is the outer bound. This is *delivery, not enforcement* — it gates on nothing, never repeats, and always releases (AC-8). It realises OL-12 (the oracle *speaks* at a done-claim) and is **not** one of the two blocks `[OL-12, HOOKS]`. The exact channel choice is the architect's; the deliver-once-and-release property is the requirement.
  - **An unanswered Max question at a `Stop`** is handled by the answer-drift `Stop` block (FR-B1, §8) at every `Stop`, not only at a recognized done-claim. `status`/`log` also record done-claims reached with an outstanding question (FR-M4), an owner-facing signal."
**Owner or engineering:** engineering line; goes to Max Cogar under M38. Part c's AC-8a is rewritten to test the answer-drift `Stop` block, and AC-1d/AC-8's "a one-cycle continuation" becomes "a continuation that delivers each fact once".
**Owner question:** none

### E-31
**Ruling:** Both reviews find that FR-B3 limits only `permissionDecision` and must also limit the
`Stop` continuation. The second opinion is right that the first audit's addition bounds only
`decision: "block"`. `hookSpecificOutput.additionalContext` on `Stop` also continues the turn, and
per E-26 either form may carry FR-B4's whisper or the answer-drift block. The same gap exists one
level down, and neither review names it. The reference gives exit code 2 the same effect as the JSON
forms on both events: on `PreToolUse` it "Blocks the tool call", and on `Stop` it "Prevents Claude
from stopping, continues the conversation". A bound on the named JSON fields alone would leave exit
code 2 open as an unbounded deny or continuation, which is the gap FR-B3 exists to close. So the
bound names every form of both.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L464-L466]] "deny is emitted **only** for the two reactive conditions of FR-B1, never as a standing gate"
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-b.md@HEAD:L470-L470]] "A Stop `decision: \"block\"` is emitted only for the answer-drift end-of-turn case (FR-B1)"
- [[https://code.claude.com/docs/en/hooks.md]] "It keeps the conversation going through the same loop protections as decision: \"block\", namely the stop_hook_active input and the 8-consecutive-continuation cap"
- [[https://code.claude.com/docs/en/hooks.md]] "| PreToolUse | Yes | Blocks the tool call |"
- [[https://code.claude.com/docs/en/hooks.md]] "| Stop | Yes | Prevents Claude from stopping, continues the conversation |"
**Final verdict:** replace — bound every deny form and every `Stop` continuation form.
**Correct line:** FR-B3's last sentence, "A `permissionDecision` deny is emitted **only** for the two reactive conditions of FR-B1, never as a standing gate on the agent's work.", becomes: "A `PreToolUse` deny, in any form (`permissionDecision: "deny"` or exit code 2), is emitted **only** for the two reactive conditions of FR-B1; a `Stop` continuation, in any form (`decision: "block"`, exit code 2, or `hookSpecificOutput.additionalContext`), is emitted **only** for the answer-drift end-of-turn case (FR-B1) and FR-B4's deliver-once whisper — never as a standing gate on the agent's work." Part c's AC-2 control-flow assertion extends to the `Stop` continuation's call sites.
**Owner or engineering:** engineering line; goes to Max Cogar under M38.
**Owner question:** none

### E-33
**Ruling:** Both reviews replace FR-O2. The second opinion is right on its two disputed parts, and one
clause both reviews accept needs a correction.
1. *"that text is preserved even if the tool call later fails" stays, with a source.* The
   2026-09-28 ruling found the clause "on no page of the hooks reference", and that is still true:
   the reference fetched today does not contain it. It is on Anthropic's primary record, though. The
   Claude Code changelog entry for 2.1.110 (April 15, 2026) reads "Fixed `PreToolUse` hook
   `additionalContext` being dropped when the tool call fails". The 2026-09-28 permission-denial test
   (Claude Code 2.1.283) observed the same behaviour: a Bash call denied by a permission rule
   returned `is_error: true`, and the model still received the hook's text. The clause was
   unsourced, not false. Deleting it would remove a true harness fact the edit-timing lines rely on.
   The coordinator verified the changelog entry independently.
2. *Timeouts.* The reference lowers the default on four events, not three: `MessageDisplay` hooks
   default to 10s.
3. *Correction to the tested-facts clause both reviews accept.* The 2026-09-28 ruling and the first
   audit write "`Edit`/`Read` path deny rules are rejected before hooks run". The test that ruling
   rests on covered "only the Bash and Edit tools" and "one path-rule form". So the clause states
   the `Edit` result and marks `Read` untested. The reference documents the general case: validation
   rejections "happen before hooks run".
4. The first audit's other parts stand and match today's fetch: plain stdout on four events,
   including `PostModelSwitch`; the deny reason is "shown to Claude", with no "avoids retrying"
   quotation; a hook's context enters the conversation where the hook fired, so a subagent's hook
   context reaches that subagent, and the parent is reached through `PostToolUse` on `Agent`; the
   E-26 `Stop` landing point; and re-dating. FR-O2's statement that the oracle uses a `Stop`
   continuation "**only** for single-cycle Stop-time whisper delivery" changes per E-26 and E-29.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L480-L481]] "that text is preserved even if the tool call later fails"
- [[middleware/context-oracle/docs/reviews/2026-09-28-branch-audit-coordinator-rulings-schema-and-edit-timing.md@HEAD:L90-L91]] "is on no page of the hooks reference"
- [[https://code.claude.com/docs/en/changelog.md]] "Fixed PreToolUse hook additionalContext being dropped when the tool call fails"
- [[ran]] ``awk '/<Update label=/{v=$0} /Fixed `PreToolUse` hook `additionalContext` being dropped/{print v}' changelog.md`` (the changelog fetched with curl 2026-09-29) → `<Update label="2.1.110" description="April 15, 2026">`
- [[middleware/context-oracle/docs/reviews/2026-09-28-branch-audit-hook-context-permission-denial.md@HEAD:L35-L35]] "has been denied.\", `is_error: true` | yes: both quote-back runs quoted it |"
- [[middleware/context-oracle/docs/reviews/2026-09-28-branch-audit-hook-context-permission-denial.md@HEAD:L41-L42]] "A permission-rule denial fires `PreToolUse`,"
- [[middleware/context-oracle/docs/reviews/2026-09-28-branch-audit-hook-context-permission-denial.md@HEAD:L57-L58]] "only the Bash and Edit tools;"
- [[middleware/context-oracle/docs/reviews/2026-09-28-branch-audit-hook-context-permission-denial.md@HEAD:L60-L61]] "`Edit`/`Read` path deny rules are rejected before"
- [[https://code.claude.com/docs/en/hooks.md]] "Validation rejections are returned as tool_use_error results and happen before hooks run"
- [[https://code.claude.com/docs/en/hooks.md]] "Permission denials fire PreToolUse but not this event"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L476-L477]] "`UserPromptSubmit`, `UserPromptExpansion`, and `SessionStart` only"
- [[https://code.claude.com/docs/en/hooks.md]] "The exceptions are UserPromptSubmit, UserPromptExpansion, SessionStart, and PostModelSwitch, where Claude Code adds plain-text stdout as context"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L489-L489]] "so it avoids retrying"
- [[https://code.claude.com/docs/en/hooks.md]] "For \"deny\", shown to Claude"
- [[https://code.claude.com/docs/en/hooks.md]] "String added to Claude's context alongside the tool result"
- [[https://code.claude.com/docs/en/hooks.md]] "Claude reads the reminder on the next model request"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L501-L502]] "propagates to the parent is **not documented and assumed not** (§13)"
- [[https://code.claude.com/docs/en/hooks.md]] "inserts it into the conversation at the point where the hook fired"
- [[https://code.claude.com/docs/en/hooks.md]] "To inject context into the parent session after a subagent returns, use a"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L505-L507]] "(lowered to 30s under"
- [[https://code.claude.com/docs/en/hooks.md]] "Defaults: 600 for command, http, and mcp_tool; 30 for prompt; 60 for agent."
- [[https://code.claude.com/docs/en/hooks.md]] "Claude Code lowers the command, http, and mcp_tool default to 30 on"
- [[ran]] ``grep -o 'and to 10 on \[`MessageDisplay`\]' hooks.md`` (the reference fetched with curl 2026-09-29) → ``and to 10 on [`MessageDisplay`]``
- [[https://code.claude.com/docs/en/hooks.md]] "hooks share a 1.5-second budget; if your settings set a longer per-hook timeout, Claude Code raises the budget to match, up to 60 seconds"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L497-L500]] "**only** for single-cycle Stop-time whisper delivery (FR-B4, the completion-check/Completeness"
**Final verdict:** replace — FR-O2 restated against today's reference and changelog, with the "preserved" clause kept and sourced, four lowered-timeout events, the `Stop` landing point, and the tested facts stated as tested.
**Correct line:** "- **FR-O2 — Delivery-capable events and mechanism (C-4, `[HOOKS]`; hooks reference and Claude Code changelog fetched 2026-09-29).** Model-visible context returns via structured `hookSpecificOutput.additionalContext` on the tool events, and via plain stdout on `UserPromptSubmit`, `UserPromptExpansion`, `SessionStart`, and `PostModelSwitch` only. A `PreToolUse` hook may return `additionalContext` **without** any `permissionDecision` — the passive-whisper affordance — and that text is preserved even if the tool call later fails (Claude Code changelog 2.1.110, April 15, 2026: "Fixed `PreToolUse` hook `additionalContext` being dropped when the tool call fails"). The hook runs before the tool, but the text is "added to Claude's context alongside the tool result" and "Claude reads the reminder on the next model request", so the model sees it after the tool call resolves, which does not mean the tool ran: a permission denial also fires `PreToolUse`, and the call may fail. Validation rejections "happen before hooks run", so the oracle is not invoked for them. Tested on Claude Code 2.1.283 (headless `-p`, 2026-09-28): when a permission rule denies a Bash call, or another hook denies the call, the hook has run and its context reaches the model next to the denial; an `Edit` path deny rule is rejected before hooks run, so the oracle is not invoked (`Read` path rules untested). `PostToolUse` carries `additionalContext` the same way. The two **enforcement blocks (FR-B1)** land on the deviating move (§8): a deviating tool action gets a `PreToolUse` `permissionDecision: "deny"` with `permissionDecisionReason`, which is "shown to Claude" as the denied call's result — whether the model then answers rather than retrying is model behavior, measured (FR-B2, FR-M4); for answer-drift, a turn that ends with the question unanswered gets a `Stop` continuation. `Stop`/`SubagentStop` expose `last_assistant_message`, the final response's text (the `PreToolUse` answer-drift recognizer instead reads `transcript_path`, which the docs warn is **written asynchronously and may lag** the in-memory conversation, so a just-given answer can be briefly invisible; FR-B1/D-41), and continue the turn two ways: `decision: "block"` + `reason` (labelled a hook error) and `hookSpecificOutput.additionalContext` (non-error feedback; added in 2.1.163, June 4, 2026). Both run under the same loop protections — the `stop_hook_active` input and an **8-consecutive-continuation cap**, after which Claude Code overrides the next block and ends the turn (raisable by an environment variable the oracle never sets); `Stop` does not run on a user interrupt. The oracle uses a `Stop` continuation **only** for FR-B4's deliver-once whisper and the FR-B1 answer-drift end-of-turn block (FR-B3). Hooks fire inside subagents carrying `agent_id`/`agent_type`; a hook's `additionalContext` is inserted into the conversation where the hook fired, so a subagent's hook context reaches that subagent, and the documented way to inject context into the parent after a subagent returns is a `PostToolUse` hook on the `Agent` tool. `PostToolUseFailure` and `PermissionRequest` are confirmed events (the oracle emits no `permissionDecision` on any of them — FR-B3). Timeouts: `command`/`http`/`mcp_tool` 600s (lowered to 30s on `UserPromptSubmit`, `PreModelSwitch` and `PostModelSwitch`, and to 10s on `MessageDisplay`), `prompt` 30s, `agent` 60s; `SessionEnd` hooks share a **1.5s budget, raised to match a longer per-hook `timeout` up to 60s**."
**Owner or engineering:** engineering line (harness facts); goes to Max Cogar under M38. C-4 (E-39) points to this text.
**Owner question:** none

### E-34
**Ruling:** Both reviews replace FR-O3 with the same text. The second opinion adds a stronger backing
for the fail-open half, and the addition holds. The fail-open behaviour toward the agent is not a
patch. On a block path, an oracle fault means the oracle has not established that the agent
deviated. A deny issued then would be a deny before an established deviation, which FR-B3 makes
structurally impossible. The harness also proceeds on a hook timeout and on exit 1. So under the
BRIEF's test this behaviour is required and specified, not a fallback added because the primary path
failed. What was wrong is the silent half. "Shim/service error" and "missing store" are not FR-M2
classes, so a fault that switches a block off is swallowed. The branch audit reproduced exactly
that: a failed audit write "silently turns the OL-C3 answer-drift deny off". Fail-fast requires the
fault to be recorded and surfaced where it occurs. It does not require the fault to reach the agent.
The `[OL-3]` tag widens a statement Max Cogar made about the generated-file block into a
failure-handling rule, which is the pattern OL-C7 names. With E-26, a block path includes the answer-drift `Stop` continuation,
so fail-open there means the stop proceeds.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L508-L510]] "Any shim/service error, timeout, or missing"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L459-L461]] "denies an action *before* the agent has actually deviated"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L265-L266]] "hooks not firing, latency breaches, store"
- [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B3-verification.md@HEAD:L54-L55]] "silently turns the OL-C3 answer-drift deny off."
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L41-L41]] "that he said this specifically to"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L73-L73]] "my statements are getting overgenralized and turned into new project rules"
- [[https://code.claude.com/docs/en/hooks.md]] "A timed-out command, http, or mcp_tool hook doesn't block the tool call."
- [[https://code.claude.com/docs/en/hooks.md]] "Without valid JSON on stdout, Claude Code treats exit code 1 as a non-blocking error and proceeds with the action"
- [[https://martinfowler.com/ieeeSoftware/failFast.pdf]] "Failing fast is a nonintuitive technique"
**Final verdict:** replace — fail open toward the agent, backed by FR-B3 and the harness, and make every such event a recorded, counted, self-detected fault.
**Correct line:** "- **FR-O3 — Fail open for the agent, visibly for the owner.** Any shim/service error, timeout, or missing store yields silence and, on a block path, no deny and no `Stop` continuation, so the agent's move proceeds: a block issued when the oracle cannot establish that the agent deviated would be a block before an established deviation, which FR-B3 forbids, and the harness itself proceeds on a hook timeout or a non-blocking exit. Every such event is recorded as a self-detected fault (FR-M2) naming its class and, on a block path, that the block was off for that event, and is counted in `status` (FR-M4). A latency discipline (NF-1)."
**Owner or engineering:** engineering line; goes to Max Cogar under M38. FR-M2 gains the class; part c's AC-10 asserts the fault record.
**Owner question:** none

### E-36
**Ruling:** Both reviews rule C-1 `undetermined`, and the verdict stands. On the disputed step, the
second opinion is right. One run of Python's stdlib `sqlite3` creating an FTS5 table in this
container shows only that this interpreter's linked SQLite has FTS5. Python's module uses "the
runtime SQLite library" of the platform, whose compile options vary. `node:sqlite` compiles its own
SQLite with flags fixed per Node release in `deps/sqlite/sqlite.gyp`. So the run does not refute
"weaker … store options". The first audit is also right that nothing on the record establishes the
comparison either way: C-1 states it without a source, and §12's D-33 adds only an unsourced
"ecosystem" reason. Neither review can write the correct runtime line, because the comparison it
depends on has never been made. The known corrections are:
(a) the floor "v22.13.0 / v23.4.0" does not deliver C-2's FTS5. FTS5 arrives at v22.16.0 on 22.x
and v24.0.0 on 24.x, and no 23.x release has it.
(b) "current LTS" is a moving target. On 2026-09-29, v22 is in maintenance and v24 is Active LTS
until 2026-10-20. v26 becomes LTS on 2026-10-28 and also has FTS5. The line has to name the release
line and floor it means.
(c) The second opinion's "experimental in 22.x/24.x" needs one correction. `node:sqlite` is Stability
1.1 (experimental) on 22.x, and on 24.x it is a release candidate from v24.15.0. v22.22.2 prints an
ExperimentalWarning.
(d) D-33's ecosystem reason has no source.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L514-L514]] "Runtime: Node.js, current LTS"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L517-L517]] "unflagged from **v22.13.0 / v23.4.0**"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L520-L520]] "they are rejected for weaker cold-start/no-toolchain store options"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L827-L827]] "using the language the Claude Code tooling ecosystem already assumes"
- [[https://docs.python.org/3/library/sqlite3.html]] "Version number of the runtime SQLite library as a string"
- [[ran]] `python3 -c "import sys,sqlite3;c=sqlite3.connect(':memory:');c.execute('create virtual table t using fts5(x)');print(sys.version.split()[0], sqlite3.sqlite_version, 'fts5 ok')"` → `3.11.15 3.45.1 fts5 ok`
- [[ran]] `for t in v22.13.0 v22.15.0 v22.16.0 v23.4.0 v23.11.1 v24.0.0 v24.15.0 v26.0.0; do printf "%s " $t; curl -sS https://raw.githubusercontent.com/nodejs/node/$t/deps/sqlite/sqlite.gyp | grep -c "SQLITE_ENABLE_FTS5"; done` → `v22.13.0 0` / `v22.15.0 0` / `v22.16.0 1` / `v23.4.0 0` / `v23.11.1 0` / `v24.0.0 1` / `v24.15.0 1` / `v26.0.0 1`
- [[ran]] `curl -sS https://raw.githubusercontent.com/nodejs/Release/main/schedule.json | python3 -c "import json,sys;d=json.load(sys.stdin);[print(k,d[k].get('lts'),d[k].get('maintenance'),d[k]['end']) for k in ('v22','v23','v24','v26')]"` → `v22 2024-10-29 2025-10-21 2027-04-30` / `v23 None 2025-04-01 2025-06-01` / `v24 2025-10-28 2026-10-20 2028-04-30` / `v26 2026-10-28 2027-10-20 2029-04-30`
- [[https://nodejs.org/docs/latest-v22.x/api/sqlite.html]] "Stability: 1.1 - Active development"
- [[https://nodejs.org/docs/latest-v24.x/api/sqlite.html]] "v24.15.0 SQLite is now a release candidate."
- [[ran]] `node -e "const {DatabaseSync}=require('node:sqlite');const d=new DatabaseSync(':memory:');d.exec('create virtual table t using fts5(x)');console.log(process.version,'fts5 ok')"` → `v22.22.2 fts5 ok`, stderr `ExperimentalWarning: SQLite is an experimental feature and might change at any time`
- [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B9-verification.md@HEAD:L85-L85]] "Each throw leaks 864 bytes of wasm stack for the life of the process."
**Final verdict:** undetermined — C-1 cannot stand as written, and the correct runtime line cannot be written from sources.
**Correct line:** undetermined. Three things are missing. (1) A written engineering comparison of the candidate runtimes against C-2 (FTS5 guaranteed on every platform the oracle must run on, not only in this container), against C-3 as rewritten after E-38, and against the parser path: native `tree-sitter` with prebuilds inside the npm package, versus the WASM build whose leak the branch audit recorded. (2) Max Cogar's answer to E-38, which decides what C-3 forbids. (3) The Node stability status of the chosen line. Whatever runtime is chosen, the rewritten line must name the release line and its FTS5 floor (v22.16.0 on 22.x, v24.0.0 on 24.x, never 23.x), state the `node:sqlite` stability of that line, and drop D-33's unsourced ecosystem reason.
**Owner or engineering:** engineering decision, gated on the owner answer in E-38. The rewritten line goes to Max Cogar under M38.
**Owner question:** none (the owner input it needs is E-38's question)

### E-37
**Ruling:** Both reviews replace C-2's factual premise and keep its property sentence. The second
opinion's completion holds: the 24.x line also has FTS5, from v24.0.0, and on 2026-09-29 it is the
Active LTS line. Stating only the 22.x floor would read as if Node 22 were required. The v22.16.0
changelog entry "sqlite: enable common flags" (#57621) confirms the per-tag check. The property
("fast name/structure lookup and text search … within NF-1; mechanism is the architect's", subject
to C-3) is sound and stays. Because C-1 is undetermined (E-36), the Node fact is written as a
condition on a Node runtime, not as a claim that the runtime is Node.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L522-L522]] "stock `node:sqlite` now ships FTS5"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L527-L529]] "which the built-in engine now does with zero dependencies"
- [[https://raw.githubusercontent.com/nodejs/node/main/doc/changelogs/CHANGELOG_V22.md]] "**sqlite**: enable common flags (Edy Silva)"
- [[ran]] `curl -sSL https://raw.githubusercontent.com/nodejs/node/main/doc/changelogs/CHANGELOG_V22.md | awk '/^## 20/{v=$0} /sqlite\*\*: enable common flags/{print v}'` → `## 2025-05-21, Version 22.16.0 'Jod' (LTS), @aduh95`
- [[https://raw.githubusercontent.com/nodejs/node/v22.16.0/deps/sqlite/sqlite.gyp]] "'SQLITE_ENABLE_FTS5',"
- [[ran]] `for t in v22.15.0 v22.16.0 v23.11.1 v24.0.0; do printf "%s " $t; curl -sS https://raw.githubusercontent.com/nodejs/node/$t/deps/sqlite/sqlite.gyp | grep -c "SQLITE_ENABLE_FTS5"; done` → `v22.15.0 0` / `v22.16.0 1` / `v23.11.1 0` / `v24.0.0 1`
**Final verdict:** replace — state the FTS5 floor per release line; property unchanged.
**Correct line:** "- **C-2 — Full-text search.** **Requirement (property):** fast name/structure lookup and text search over indexed symbols within NF-1; **mechanism is the architect's**, and it must satisfy C-3. **Fact for a Node runtime (C-1):** stock `node:sqlite` compiles SQLite with FTS5 from Node v22.16.0 on the 22.x line and from v24.0.0 on 24.x; v22.13.0–v22.15.0 and every 23.x release lack it (`deps/sqlite/sqlite.gyp` per tag, and the v22.16.0 changelog entry "sqlite: enable common flags", checked 2026-09-29). A Node build meets this requirement with no added dependency only at or above those versions `[NODE-SQLITE]`."
**Owner or engineering:** engineering line (external fact); goes to Max Cogar under M38.
**Owner question:** none

### E-38
**Ruling:** Both reviews rule C-3 `undetermined` with an owner question, and that stands. OL-4 is
five words: "Sandbox compatibility is required." Its recorded rationale (`RETHINK.md` §12.4) talks
about the archived sandbox *build*, not an environment. `RETHINK.md` §12.2 mentions "offline
sandboxes" and "true air-gap". So the record supports at least two readings, and no source picks one:
an environment such as a Claude Code cloud session, which reaches the package registry through its
proxy, or a fully offline machine. C-3's three clauses are an agent's derivation with no written
steps. "No prebuilt-binary download" is ambiguous in the case that matters: the `tree-sitter` npm
package carries six platform binaries inside the package, so installing it fetches them with the
package and compiles nothing. The clause was read as forbidding that, which drove the WASM parser
whose defects the branch audit recorded. Where the oracle has to run is a fact about Max Cogar's own
setup, and the scope of his decision is his. The question goes to him with OL-4's exact words. What
C-3 must then forbid is derived from his answer by agents. E-77's question also asks where he runs
agents, so the two can be put to him together.
**Evidence:**
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L42-L42]] "Sandbox compatibility is required."
- [[middleware/context-oracle/RETHINK.md@ec3b057:L337-L338]] "The old sandbox build is archived as"
- [[middleware/context-oracle/RETHINK.md@ec3b057:L301-L302]] "offline sandboxes"
- [[middleware/context-oracle/RETHINK.md@ec3b057:L317-L318]] "for true air-gap"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L530-L532]] "no prebuilt-binary download, no network"
- [[ran]] `npm pack tree-sitter --dry-run 2>&1 | grep -E "prebuilds/|version:"` → `npm notice 585.6kB prebuilds/darwin-arm64/tree-sitter.node` / `556.0kB prebuilds/darwin-x64/tree-sitter.node` / `672.7kB prebuilds/linux-arm64/tree-sitter.node` / `679.8kB prebuilds/linux-x64/tree-sitter.node` / `516.1kB prebuilds/win32-arm64/tree-sitter.node` / `510.5kB prebuilds/win32-x64/tree-sitter.node` / `npm notice version: 0.25.1`
- [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B9-verification.md@HEAD:L79-L79]] "Neither grammar can be an npm dependency: C-3 and AD-25 rule out"
- [[ran]] `grep -n -i "sandbox" /tmp/claude-0/-home-user-agent-armory/779c0f74-86b0-5e8f-b02d-811e78ed3f66/scratchpad/audit/owner-messages.md` → no output (no owner message in this session defines the sandbox)
**Final verdict:** undetermined — C-3 cannot be written until Max Cogar says which environments OL-4 covers.
**Correct line:** undetermined. Missing: Max Cogar's answer below. With it, C-3 states what those environments lack. For example: if cloud sessions and his own computer, packages come from the registry and nothing is compiled; if an offline machine too, nothing is fetched at install beyond what is bundled. The tested fact above (bundled prebuilds need neither a compiler nor a download outside the registry) is recorded for that rewrite. C-1 (E-36) and AC-20 follow.
**Owner or engineering:** **owner decision — goes to Max Cogar** with OL-4's exact words.
**Owner question:** Your decision OL-4 reads: "Sandbox compatibility is required." The record doesn't say which places that means, and the answer decides which building blocks the oracle may use. Which of these must the oracle work in? (1) Your own computer. (2) Claude Code cloud sessions like the ones used for this project, which can download software packages but start empty each time. (3) A computer with no internet connection at all. Pick every one that applies.

### E-47
**Ruling:** Both reviews replace the `[HOOKS]` row. They drop the "so it avoids retrying" quotation
and carry E-33's facts. The second opinion's two additions follow from E-33 and hold. The
preserved-on-failure fact is sourced by the Claude Code changelog, which is not the hooks reference
the row names, so the row names both documents. The timeout facts include `MessageDisplay` at 10s.
The row also takes E-26's `Stop` facts (both continuation forms under the same protections) and
E-33's tested-facts clause as corrected there. The rest of the row was checked against today's
fetch and matches: the deny reason returned to Claude as the tool error, the precedence order, the
two `Stop` channels, the cap, `last_assistant_message`, the transcript lag, and the subagent fields.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L556-L556]] "provided \"so it avoids retrying\""
- [[https://code.claude.com/docs/en/hooks.md]] "precedence is deny > defer > ask > allow"
- [[https://code.claude.com/docs/en/hooks.md]] "equivalent to a command hook's permissionDecision: \"deny\""
- [[https://code.claude.com/docs/en/hooks.md]] "The transcript file is written asynchronously and may lag the in-memory conversation"
- [[https://code.claude.com/docs/en/changelog.md]] "Fixed PreToolUse hook additionalContext being dropped when the tool call fails"
- [[https://code.claude.com/docs/en/hooks.md]] "Claude Code lowers the command, http, and mcp_tool default to 30 on"
**Final verdict:** replace — re-source and re-date the row to today's reference and changelog, with E-26's and E-33's facts.
**Correct line:** "| `[HOOKS]` | Claude Code hooks reference, `code.claude.com/docs/en/hooks` (event set; `PreToolUse` `permissionDecision` deny → `permissionDecisionReason` "shown to Claude" as the tool error — whether the model then answers rather than retrying is measured, not guaranteed (FR-B2); precedence deny > defer > ask > allow; `additionalContext` optional & separate, inserted where the hook fired and read on the next model request; validation rejections happen before hooks run, permission denials fire `PreToolUse`; plain stdout as context on `UserPromptSubmit`, `UserPromptExpansion`, `SessionStart`, `PostModelSwitch`; `Stop`/`SubagentStop` continue the turn by **both** `decision:block`+`reason` **and** `hookSpecificOutput.additionalContext` under the same protections — `stop_hook_active` input + 8-consecutive-continuation cap; `Stop` not run on user interrupt; `last_assistant_message` on the stop events; `transcript_path` on every event **but written asynchronously / may lag** (FR-B1/D-41); subagent `agent_id`/`agent_type`, parent injection via `PostToolUse` on `Agent`; timeouts incl. 30s on `UserPromptSubmit`/`PreModelSwitch`/`PostModelSwitch` and 10s on `MessageDisplay`) and Claude Code changelog, `code.claude.com/docs/en/changelog` (2.1.110: `PreToolUse` `additionalContext` kept when the tool call fails; 2.1.163: `Stop`/`SubagentStop` `additionalContext`); tested behaviour per FR-O2 (Claude Code 2.1.283, 2026-09-28) | Observation, delivery, block (C-4, §8) | 2026-09-29 |"
**Owner or engineering:** engineering line; goes to Max Cogar under M38.
**Owner question:** none

### E-48
**Ruling:** Both reviews replace the `[NODE-SQLITE]` row, because checking the `v22.x` branch head
says nothing about which releases have FTS5. The second opinion adds the 24.x and 23.x facts and the
changelog entry, and those hold (E-37). Its stability history ("experimental in 22.13/23.4, release
candidate from v25.7.0") is right for the current docs, but it misses the 24.x line: the v24 docs
record "v24.15.0 SQLite is now a release candidate". The row needs that fact, since 24.x is the
Active LTS line.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L557-L557]] "FTS5 state per `deps/sqlite/sqlite.gyp` (v22.x) + local execution"
- [[https://nodejs.org/api/sqlite.html]] "SQLite is now a release candidate."
- [[https://nodejs.org/api/sqlite.html]] "SQLite is no longer behind --experimental-sqlite but still experimental."
- [[https://nodejs.org/docs/latest-v22.x/api/sqlite.html]] "Stability: 1.1 - Active development"
- [[https://nodejs.org/docs/latest-v24.x/api/sqlite.html]] "v24.15.0 SQLite is now a release candidate."
- [[https://raw.githubusercontent.com/nodejs/node/main/doc/changelogs/CHANGELOG_V22.md]] "**sqlite**: enable common flags (Edy Silva)"
**Final verdict:** replace — the row records FTS5 and stability per release line.
**Correct line:** "| `[NODE-SQLITE]` | Node `node:sqlite` docs — Stability 1.1 Active development (experimental) on 22.x; 1.2 Release candidate from v24.15.0 on 24.x and from v25.7.0; FTS5 compiled in from v22.16.0 (22.x) and v24.0.0 (24.x), absent in v22.13.0–v22.15.0 and every 23.x release — `deps/sqlite/sqlite.gyp` checked per tag, and the v22.16.0 changelog entry "sqlite: enable common flags" (#57621) | Store runtime & FTS5 (C-1, C-2) | 2026-09-29 |"
**Owner or engineering:** engineering line; goes to Max Cogar under M38.
**Owner question:** none

### E-56
**Ruling:** Both reviews give the same fix: Jaspan precedes Söderberg. The first audit left one
condition open ("the published proceedings order differs from the Google-hosted PDF", not checked).
The second opinion closes it with a second, independent record: Google Research's publication page
lists the same order. Both sources were re-fetched and agree. The row's content ("NOT USEFUL"
feedback, a monitored false-positive rate) matches the paper, as the first audit found, and is
unchanged.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L565-L565]] "Sadowski, van Gogh, Söderberg, Jaspan, Winter"
- [[https://static.googleusercontent.com/media/research.google.com/en//pubs/archive/43322.pdf]] "Caitlin Sadowski, Jeffrey van Gogh, Ciera Jaspan, Emma Söderberg, Collin Winter"
- [[https://research.google/pubs/tricorder-building-a-program-analysis-ecosystem/]] "Caitlin Sadowski Jeffrey van Gogh Ciera Jaspan Emma Soederberg Collin Winter"
**Final verdict:** replace — correct the author order.
**Correct line:** In the `[TRICORDER]` row, "Sadowski, van Gogh, Söderberg, Jaspan, Winter" becomes "Sadowski, van Gogh, Jaspan, Söderberg, Winter"; the rest of the row is unchanged.
**Owner or engineering:** engineering line (citation); goes to Max Cogar under M38.
**Owner question:** none

### E-62
**Ruling:** Both reviews replace the paragraph's claim that the illustrative numbers are "grounded by
the literature above". No §9 source gives FR-D1's sentence count, and FR-D3 names no rate. The ROSE
figures are right, and they were re-read in the re-fetched paper. The second opinion's correction to
the first audit's facts holds: the "one to five sentences" origin is `RETHINK.md` L190, not L182,
which is the latency line. The first audit's replacement text itself has two defects, and neither
review names them.
(1) It keeps "FR-K2's ~30 cap", but the first audit's own E-73, which the second opinion accepts,
rewrites FR-K2 without "~30": "ROSE used 30 entities; the git file-level cap is set on Phase A
data". So the paragraph would cite a number FR-K2 no longer states.
(2) "FR-D1 states no sentence count; FR-D3 names no rate" describes what two other lines lack. Part
a's rulings already remove "(illustrative ~1–5, tunable)" from FR-D1 and "(illustrative rate, §9)"
from FR-D3, so once those land the paragraph has nothing to report about them. It should list what
the spec does contain.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L576-L578]] "grounded by the literature above"
- [[middleware/context-oracle/RETHINK.md@ec3b057:L190-L190]] "one topic, one to five sentences"
- [[https://thomas-zimmermann.com/publications/files/zimmermann-tse-2005.pdf]] "a support count of 1 and a confidence of 0.1 a feedback of 0.64 and a precision of 0.30"
- [[https://thomas-zimmermann.com/publications/files/zimmermann-tse-2005.pdf]] "ROSE does so by ignoring all changes that affect more than 30 entities"
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-b.md@HEAD:L1074-L1074]] "(ROSE used 30 entities; the git file-level cap is set on Phase A data)"
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-a.md@HEAD:L878-L878]] "drop \"(illustrative ~1–5, tunable)\""
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-a.md@HEAD:L907-L907]] "dropping \"(illustrative rate, §9)\""
**Final verdict:** replace — the ROSE figures stay; the illustrative-numbers sentence states the one remaining number and where its value comes from.
**Correct line:** "**`[ROSE]` figures (verified 2026-09-29):** the TSE-2005 baseline is user-tunable (support ≥ 1, confidence ≥ 0.1, ranked by confidence), reporting feedback 0.64 / precision 0.30 / recall 0.34 and >70% top-3 across eight projects. This spec lifts no fixed operating point; ROSE grounds the *confidence computation*, and per FR-A5a there is no high-confidence suppression gate. The one size threshold the spec names is FR-K2's transaction-size cap: ROSE capped CVS transactions at 30 entities; the git file-level value is set on Phase A data (FR-K2)."
**Owner or engineering:** engineering line; goes to Max Cogar under M38.
**Owner question:** none

### E-65
**Ruling:** Both reviews replace §10's hooks line so that the outputs the shims relay include the
answer-drift `Stop` landing point (E-26). The second opinion is right that the text must not fix the
form to `decision: "block"`; the continuation form is the architect's (E-26 point 4). FR-B4's
continuation is stated as delivering each fact once (E-29), not as "single".
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L584-L586]] "and a single Stop-time continuation for the completion-check whisper (FR-B4)"
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-b.md@HEAD:L967-L967]] "a `Stop` `decision: \"block\"` for the answer-drift end-of-turn case (FR-B1)"
- [[https://code.claude.com/docs/en/hooks.md]] "Use additionalContext when the hook is working as designed and giving Claude guidance"
**Final verdict:** replace — the relayed outputs include the answer-drift `Stop` continuation, form-neutral.
**Correct line:** "- **Hooks (consumed)** per C-4/`[HOOKS]`; shims carry no decision logic and relay what the service returns (FR-O2), including a `PreToolUse` `permissionDecision: "deny"` on a block (FR-B1), a `Stop` continuation for the answer-drift end-of-turn case (FR-B1), and a Stop-time continuation that delivers the completion-check whisper once (FR-B4); the continuation form is the architect's."
**Owner or engineering:** engineering line; goes to Max Cogar under M38.
**Owner question:** none

### E-77
**Ruling:** Both reviews rule FR-K8 `undetermined` with an owner question. The flaw is a data-loss
risk in an owner decision. OL-6 puts both stores "outside the repo tree". A Claude Code cloud
session's container is ephemeral, as this project's own CLAUDE.md records, so a store outside the
repository dies with the container. Human corrections (FR-L6), efficacy statistics routed to the
global store (FR-L7), and demotion/promotion (P7) would then never accumulate, while `status` looks
healthy. On a computer that persists, FR-K8 works as written. The second opinion's two corrections
hold.
(1) The first audit treats keeping the stores on the network as closed by FR-K9's "no network sync
`[OL-6]`". OL-6's words are "solo scope, no team sharing", and a solo owner keeping his own stores
somewhere private is not team sharing. So that option is an engineering option, bounded by T3 and
FR-X5, and not closed by any owner decision (E-78).
(2) The question has to quote OL-6's exact words and be plain enough for a non-programmer. Where Max
Cogar runs agents is a fact about his setup that cannot be derived. Whether his "outside the repo
tree" stores may live somewhere that survives a cloud session is a call on the scope of his own
decision. Both are his. The first part overlaps E-38's question, and the two can be asked together.
**Evidence:**
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L44-L44]] "Two stores — per-project and per-user global — both outside the repo tree; solo scope, no team sharing."
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L615-L616]] "no network sync `[OL-6]`"
- [[middleware/context-oracle/CLAUDE.md@ec3b057:L243-L244]] "everything committed and pushed (containers are"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L673-L673]] "repo facts → project store; efficacy → global store"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L671-L672]] "a CLI correction/fact outranks"
- An environment fact from a Claude message in this session (context, not owner words): [[/tmp/claude-0/-home-user-agent-armory/779c0f74-86b0-5e8f-b02d-811e78ed3f66/scratchpad/audit/owner-messages.md@FILE:L513-L513]] "The cloud container restarted mid-review and lost one run."
**Final verdict:** undetermined — FR-K8 stands for a persistent computer. Whether it must change for cloud sessions waits on Max Cogar's answer.
**Correct line:** undetermined. Missing: Max Cogar's answer below. If he runs agents only on his own computer, FR-K8 is unchanged. If he runs them in cloud sessions and allows a surviving location, FR-K8 names that location as where the stores persist. FR-K9 (E-78), FR-X5 and FR-X7 (E-18) then name it as the one permitted destination besides the model call. If he runs them in cloud sessions and does not allow it, `status` must say plainly that the oracle starts from empty memory in each such session (OL-10).
**Owner or engineering:** **owner decision — goes to Max Cogar** with OL-6's exact words.
**Owner question:** Your decision OL-6 says the oracle's two memory stores are kept "both outside the repo tree". In Claude Code cloud sessions, everything outside the repository is deleted when the session ends. There, the oracle would forget everything it learned, including your corrections, every time. Do you run agents in cloud sessions, on your own computer, or both? If cloud sessions: may the oracle keep its memory in a private place you choose that survives between sessions (for example a private online storage location of yours), or should it start fresh each time?

### E-78
**Ruling:** Both reviews rule FR-K9 `undetermined` pending E-77. The second opinion's disagreement
with the first audit's step (1) holds, and this is the FR-K9 misattribution. "No network sync"
carries the tag `[OL-6]`, but OL-6 is about where the stores live and that there is no team sharing.
OL-7 ("No separate credentials, ever.") does not imply it either: a sync of the owner's own stores
through a service he already uses needs no credential of the oracle's own. So the clause is an
agent's line wearing an owner tag. The ledger forbids that, and it is the same defect as FR-X7's in
E-18. Both reviews also agree that the export/import requirement has no stated job anywhere in §12,
`RETHINK.md` §12 or the ledger. Its only plausible job, carrying the stores across machines or
containers, is E-77's open question.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L616-L616]] "Export/import round-trip"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L44-L44]] "solo scope, no team sharing"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L45-L45]] "No separate credentials, ever."
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L12-L14]] "(spec, decision log, requirements, architecture), find it under CONFIRMED"
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-b.md@HEAD:L1145-L1145]] "(1) \"no network sync\" follows from OL-6/OL-7."
**Final verdict:** undetermined — FR-K9's job and form wait on the E-77 owner answer; the `[OL-6]` tag on "no network sync" is removed in any case.
**Correct line:** undetermined. Missing: the E-77 answer, which gives export/import its job. One correction holds whatever the answer: "no network sync" loses the `[OL-6]` tag. If it is kept, it is an engineering line backed by T3 and FR-X5. If E-77's answer allows a surviving location, it becomes "no network transfer except to the location named in FR-K8". Part c's AC-19 follows.
**Owner or engineering:** engineering line (the attribution and the job), gated on the owner answer in E-77. Goes to Max Cogar under M38.
**Owner question:** none (the owner input it needs is E-77's question)

### E-90
**Ruling:** Both reviews rule FR-L6 `undetermined`. They agree that "a CLI correction/fact outranks
mined inference" stands, and that "Phase A's calibration signal" rests on an owner who sees
whispers and can judge code facts. Whispers go into the agent's context and do not appear as chat
messages, and the owner is "a non-programmer by design". They differ on whether an owner question
remains, and the second opinion is right that none does. The first audit asks Max Cogar "whether he
will review whispers". That is already decided in writing. OL-11, which is CONFIRMED, gives
verification to the agents and records that he is a non-programmer by design. CLAUDE.md classes
anything decided by a named line as "already written" and not his to answer, and it records that
"The owner cannot catch your mistakes." Resting whisper-precision calibration on his judgment of
co-change or reuse facts would hand him verification work, which OL-11 assigns elsewhere. So the
spec may not make his review Phase A's calibration signal. His corrections still outrank mined
inference whenever he gives them. He remains the under-fire guard where the miss is visible to him,
namely his own unanswered question (FR-B5), which is a different signal from whisper precision. What stays open is purely
engineering: which observable signal calibrates whisper precision when the consumer is an agent. The candidates
are the consumer's observable action after a whisper (FR-L1's deterministic uptake observations,
E-86), which is the established practice for tools whose consumer is a developer, and corrections
filed by the working agent through the `correct`/`note` verb. No source examined measures either
signal with an agent as the consumer, and no comparison is on the record.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L671-L672]] "mined inference and is Phase A's calibration signal (§5.2)"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L254-L255]] "the calibration input from Phase A is the human CLI correction (FR-D4/FR-L6)"
- [[https://code.claude.com/docs/en/hooks.md]] "Claude reads the reminder on the next model request, but it doesn't appear as a chat message in the interface."
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L49-L49]] "You are a non-programmer by design."
- [[middleware/context-oracle/CLAUDE.md@ec3b057:L154-L154]] "Design, build, verification, sequencing, and process are yours (OL-11)."
- [[middleware/context-oracle/CLAUDE.md@ec3b057:L157-L159]] "**Already written** — in this file, the ledger, or the spec → read it and act,"
- [[middleware/context-oracle/CLAUDE.md@ec3b057:L104-L104]] "The owner cannot catch your mistakes."
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-b.md@HEAD:L1313-L1313]] "Max Cogar's answer on whether he will review whispers"
- [[https://storage.googleapis.com/gweb-research2023-media/pubtools/4365.pdf]] "if developers did not take positive action after seeing the issue"
**Final verdict:** undetermined — the outranking half stands. The calibration-signal half cannot be written without an engineering comparison nobody has made. No owner part remains.
**Correct line:** undetermined. The first sentence stands unchanged: "**FR-L6 — Human statements are first-class facts** — a CLI correction/fact outranks mined inference." Missing for the second half: a written engineering comparison of (a) consumer-action uptake (FR-L1 as corrected in E-86) and (b) corrections filed by the working agent through the `correct`/`note` verb, as Phase A's whisper-precision calibration signal. The comparison must use evidence of how each tracks whisper correctness with an agent as the consumer: Phase A run data against seeded facts (AC-18), since no published source covers agent consumers. Owner review is excluded as the calibration signal by OL-11. §5.2's "the calibration input from Phase A is the human CLI correction" and FR-M4's false-fire label (E-1) follow the outcome.
**Owner or engineering:** engineering decision; the rewritten line goes to Max Cogar under M38.
**Owner question:** none (OL-11 already answers the first audit's question on his role)

## Found while ruling, not ruled here

These issues came up while checking the rulings above. Neither review raised them, or they sit in
another part's file, so they are recorded for the coordinator and not ruled.

1. **Skill non-conformance has the same `Stop` gap as answer-drift.** FR-B1 realises the skill block
   only as a `PreToolUse` deny "of that action". An agent can skip a due step by ending its turn
   without doing it: for example, reporting done without dispatching the mandatory independent
   review, which FR-C1a names as the block's core. That fires no `PreToolUse`. FR-C4's detector then
   records a missed skill-block, but nothing blocks it. The E-26 reasoning applies the same way
   under OL-C2 ("IF THE AGENTS ARENT FOLLOWING MY SKILLS, THEN THAT SHIT NEEDS TO BE BLOCKED AT SOME
   POINT"). It is an engineering finding on a Phase C line. Evidence:
   [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L390-L393]] "deviating action anyway **without a stated reason**, **deny that action**, reason naming"
   [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L694-L697]] "The mandatory independent review/collapse-hunt dispatch"
   [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L727-L729]] "no deny fired ⇒ a **missed skill-block**"
2. **Parts a and b disagree on what `[HERZIG]` governs.** This part's E-58 (undisputed) sets the §9
   row's Governs column to FR-K2 only. Part a's FR-D3 ruling keeps `[HERZIG]` on FR-D3 as the reason
   support and confidence are stated. The row must list both, or FR-D3 must drop the key:
   [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-b.md@HEAD:L873-L873]] "Governs: \"FR-K2 (tangled commits add noise to co-change data)\""
   [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-a.md@HEAD:L907-L907]] "history-derived evidence is noisy, so its support/confidence is stated `[HERZIG]`"
3. **Stop-block wording in parts a and c.** Part a's adjudication (E-19 and the FR-A2l row) names
   `decision: "block"`. Part c's second opinion on D-32 names `decision: "block"`, "judged from
   `last_assistant_message`" and "bounded by `stop_hook_active`". For one line across the spec, all
   of them take E-26's wording here: a form-neutral `Stop` continuation, re-applied while the
   question is open, the harness cap as the outer bound, and all assistant text since the question.
4. **E-39 (C-4)** is undisputed and follows automatically: "the facts in FR-O2, as corrected" now
   means E-33's text, including the changelog source.

## Entries not re-ruled

Neither review disputes these, and the second opinion does not change their fix. Each stands at the
first audit's verdict.
- **keep (45):** E-2, E-3, E-4, E-6, E-8, E-11, E-14, E-15, E-17, E-20, E-21, E-22, E-23, E-25, E-30, E-32, E-40, E-43, E-44, E-46, E-49, E-51, E-52, E-54, E-57, E-60, E-61, E-63, E-64, E-68, E-69, E-70, E-71, E-72, E-74, E-75, E-79, E-80, E-81, E-82, E-83, E-84, E-85, E-88, E-89. Fifteen of these (E-3, E-4, E-6, E-20, E-21, E-43, E-44, E-46, E-63, E-64, E-69, E-70, E-71, E-79, E-85) are headings or separators, which the second opinion did not re-judge.
- **replace (26):** E-1, E-5, E-7, E-9, E-10, E-12, E-13, E-16, E-19, E-24, E-28, E-35, E-39, E-42, E-45, E-50, E-53, E-55, E-58, E-59, E-66, E-67, E-73, E-76, E-86, E-87. E-24 is an owner decision and asks the same question as E-27(b), so it is asked once. The second opinion's notes on E-9 (reasoning only) and E-86 (D-12 carries the reasoning) do not change the fix.
- **undetermined (1):** E-41.

## Summary

| Entry | Spec line | First audit | Second opinion | Final verdict | Owner or engineering | Owner question |
|---|---|---|---|---|---|---|
| E-18 | FR-X7 | keep | replace | replace | engineering (attribution) | none |
| E-26 | §8 mechanism | replace | replace, fix corrected | replace | engineering | none |
| E-27 | FR-B1 | replace | replace, fix corrected | replace | (a) engineering; (b) owner | yes (OL-C2) |
| E-29 | FR-B4 | replace | replace, source added | replace | engineering | none |
| E-31 | FR-B3 | replace | replace, fix corrected | replace | engineering | none |
| E-33 | FR-O2 | replace | replace, two parts corrected | replace | engineering | none |
| E-34 | FR-O3 | replace | replace, backing added | replace | engineering | none |
| E-36 | C-1 | undetermined | undetermined, step 1 disputed | undetermined | engineering, gated on E-38 | none |
| E-37 | C-2 | replace | replace, 24.x added | replace | engineering | none |
| E-38 | C-3 | undetermined | undetermined, question reworded | undetermined | owner | yes (OL-4) |
| E-47 | §9 `[HOOKS]` | replace | replace, source added | replace | engineering | none |
| E-48 | §9 `[NODE-SQLITE]` | replace | replace, facts added | replace | engineering | none |
| E-56 | §9 `[TRICORDER]` | replace | replace, second source | replace | engineering | none |
| E-62 | §9 ROSE paragraph | replace | replace, fact corrected | replace | engineering | none |
| E-65 | §10 hooks | replace | replace, fix corrected | replace | engineering | none |
| E-77 | FR-K8 | undetermined | undetermined, question reworded | undetermined | owner | yes (OL-6) |
| E-78 | FR-K9 | undetermined | undetermined, step 1 disputed | undetermined | engineering, gated on E-77 | none |
| E-90 | FR-L6 | undetermined | undetermined, no owner part | undetermined | engineering | none |

**Counts, recounted from the sections above.** Ruled here: 18 entries — keep 0, replace 13
(E-18, E-26, E-27, E-29, E-31, E-33, E-34, E-37, E-47, E-48, E-56, E-62, E-65), undetermined 5 (E-36,
E-38, E-77, E-78, E-90). One verdict changed from the first audit: E-18, keep to replace. **Whole part b
(90 entries):** keep 45, replace 39, undetermined 6 (E-36, E-38, E-41, E-77, E-78, E-90). **Questions
for Max Cogar from part b:** three. They are E-27(b) together with E-24 (OL-C2's "steering isn't
working"), E-38 (OL-4, which environments), and E-77 (OL-6, where memory lives in cloud sessions).
E-38 and E-77 can be asked together. Every other change goes to him under M38 as a change to approve.
