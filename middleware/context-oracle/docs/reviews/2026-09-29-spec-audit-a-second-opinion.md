# Spec audit — part a (spec lines 1–276): second opinion

This file is the second opinion on
`middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-a.md` (E-1 to E-85; 58 keep, 23
replace, 4 undetermined). This auditor wrote neither the spec nor the first audit. It follows
`/tmp/claude-0/-home-user-agent-armory/779c0f74-86b0-5e8f-b02d-811e78ed3f66/scratchpad/audit/BRIEF.md`
and `/tmp/claude-0/-home-user-agent-armory/779c0f74-86b0-5e8f-b02d-811e78ed3f66/scratchpad/audit/SPEC-BRIEF.md`. The spec is judged at `ec3b057`.

**What is judged.** Every replace and undetermined entry; every keep of an engineering line that
carries a number, a mechanism, a tool or harness claim, or a citation; the owner/engineering
classification of each entry judged; and whether a proposed fix is a narrowed claim, limitation,
fallback or exclusion in place of the correct line. Keeps not listed below (pure headings,
separators, pointers and owner restatements with no engineering content: E-1, E-5, E-6, E-8, E-9,
E-14, E-15, E-18, E-20, E-22, E-23, E-25 to E-28, E-30, E-31, E-33, E-34, E-36, E-44, E-46, E-60,
E-61, E-67 to E-69, E-75, E-78, E-81, E-82) were read and are not disputed.

**How the work was done.** Every web source the first audit cites was re-fetched with `curl` on
2026-09-29 into `/tmp/claude-0/-home-user-agent-armory/779c0f74-86b0-5e8f-b02d-811e78ed3f66/scratchpad/specaudit/so-a/`
(PDFs extracted with pdfminer) and each quoted passage was read in its surrounding text. The
coordinator-verified hooks facts (a `Stop` hook's `decision: "block"` prevents the stop; `Stop`
receives `last_assistant_message` and `stop_hook_active`) were re-read in the same fetch.

### E-2
**Agree/Disagree:** Verdict: agree (replace). Reasoning: agree that the traceability sentence is
false while D-4, D-9 and D-20 carry no reasoning, and that OL-C6 must be stated with the condition
the ledger records. The first audit missed a third false claim in the same paragraph: "the blocking
model was independently reviewed to convergence 2026-08-25". The review of that date converged on
a blocking model whose scenario was "the agent goes off writing code", and it dropped the `Stop`
path as "the wrong scenario". On 2026-08-28 the answer-drift definition was rebuilt on OL-C5 and
the "writing code" proxy dropped, after that review. OL-R5 rejected exactly that proxy and the
scoping-out of the silent end of turn. So the reviewed model is not the model in the spec, and the
review's premise is one Max Cogar rejected. The status line presents a review of a superseded
design as authority for the current one.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L4-L4]] "blocking model was independently reviewed to convergence 2026-08-25"
- [[middleware/context-oracle/docs/reviews/2026-08-25-blocking-model-rebuild-6-rounds.md@ec3b057:L13-L16]] "which modeled the wrong scenario"
- [[middleware/context-oracle/docs/reviews/2026-08-25-blocking-model-rebuild-6-rounds.md@ec3b057:L16-L16]] "Max asks a question and the agent **goes off writing code** instead of answering."
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L60-L60]] "The answer-drift trigger scoped to **\"writing code,\"** with the **\"agent silently ends its turn\" case described as out of scope**"
- [[ran]] `git log --format='%h %ad %s' --date=short ec3b057 -- middleware/context-oracle/docs/specs/spec-context-oracle.md | grep -E "acaf743|864f0b5|d83ae5f"` → `864f0b5 2026-08-28 spec: adopt OL-C5 answer-drift definition; fix §8 "block delivers nothing" contradiction` / `acaf743 2026-08-28 spec: rebuild answer-drift definition on Max's OL-C5, drop the "writing code" proxy` / `d83ae5f 2026-08-25 spec: round-5 collapse-hunt — specify the lag-window lean (the one real finding)`
- No review record at `ec3b057` covers the OL-C5 model: [[ran]] `for f in 2026-08-25-blocking-model-rebuild-6-rounds.md 2026-08-25-independent-review-spec-revision.md 2026-08-25-second-independent-review-spec-revision.md; do printf "%s " $f; git show ec3b057:middleware/context-oracle/docs/reviews/$f | grep -c "OL-C5"; done; git ls-tree --name-only ec3b057 middleware/context-oracle/docs/reviews/ | grep -c "2026-08-2[6-8]"` → `2026-08-25-blocking-model-rebuild-6-rounds.md 0` / `2026-08-25-independent-review-spec-revision.md 0` / `2026-08-25-second-independent-review-spec-revision.md 0` / `0`
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L72-L72]] "He did not line-read the document"
**Correct verdict:** replace — state OL-C6 as the ledger records it (signed off 2026-08-28 without a line-by-line read); replace the convergence claim with the fact (the 2026-08-25 review covered the "writing code" model that OL-R5 rejected; no review record in `docs/reviews/` covers the OL-C5 rebuild of 2026-08-28); keep the traceability sentence once every D-n in §12 has its reasoning. Engineering line; goes to Max Cogar as a change to his signed document.

### E-3
**Agree/Disagree:** Verdict: agree (replace). Reasoning: agree on all three counterexamples, each
re-checked. The Illinois record gives CHI 2006 (Montreal, pages 741–750, DOI
10.1145/1124772.1124882), so §9's "CHI 2007" was not checked against the primary record. The
"preserved even if the tool call later fails" clause is absent from today's hooks page (0 matches in
a fresh `curl`). `[MSR]` is "verified via HERZIG", which verifies a different paper, not the
practice. The fix restores the claim to truth rather than narrowing it, which is correct.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L11-L12]] "Every external source in §9 was verified against its current primary/authoritative"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L568-L568]] "*Leveraging characteristics of task structure to predict the cost of interruption*, CHI 2007"
- [[https://experts.illinois.edu/en/publications/leveraging-characteristics-of-task-structure-to-predict-the-cost-]] "CHI 2006: Conference on Human Factors in Computing Systems - Montreal"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L559-L559]] "2026-08-25 (via HERZIG)"
- [[ran]] `grep -c -i "preserved even if" hooks.md` (the page fetched with `curl -sSL https://code.claude.com/docs/en/hooks.md` on 2026-09-29) → `0`
**Correct verdict:** replace — re-verify every §9 row against its primary record and correct it (`[CHI]` → CHI 2006; `[MSR]` given its own source; FR-O2's unsourced clause removed), with the new check date. Engineering line; goes to Max Cogar as a change to his signed document.

### E-4
**Agree/Disagree:** Verdict: agree (keep). Reasoning: the what/how split is a scope statement the
spec follows, and stable IDs are needed because older documents cite them and the project's CI
fails a PR on a cited requirement that does not resolve. The derivation is real backing. The
exception "where a constraint is itself a requirement (§8)" is the hook for NF-1's numbers, which
are judged in part b.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L16-L18]] "Requirement IDs are stable mnemonics `[D-23]`."
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L467-L468]] "Older documents (`RETHINK.md`, the"
- [[middleware/context-oracle/CLAUDE.md@HEAD:L256-L258]] "fails the PR** on cross-document rot: a cited requirement or ledger key"
**Correct verdict:** keep — the scope split and stable-ID rule are backed by the derivation.

### E-7
**Agree/Disagree:** Verdict: agree (replace). Reasoning: agree that `RETHINK.md` §2.4 is
unsourced agent rationale and cannot back an empirical claim. Disagree with the proposed source.
Liu et al. find that performance "is often highest when relevant information occurs at the
beginning or end of the input context" and worst in the middle. A front-loaded briefing sits at the
beginning of the context, so this paper's position finding is, if anything, evidence against the
spec's claim; it does not show that a start-of-session briefing decays as the session grows.
Citing it would put a source behind the line that does not say what the line needs (brief test
item 3–4). The claim the line needs is that recall of material in context degrades as the context
grows. That is what the "context rot" evidence shows: Chroma's 18-model study reports performance
growing "increasingly unreliable as input length grows", and Anthropic's context-engineering
guidance states the same effect.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L29-L30]] "decay in salience as the session grows (`RETHINK.md` §2.4)"
- [[https://arxiv.org/abs/2307.03172]] "performance is often highest when relevant information occurs at the beginning or end of the input context"
- [[https://research.trychroma.com/context-rot]] "Our results reveal that models do not use their context uniformly; instead, their performance grows increasingly unreliable as input length grows."
- [[https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents]] "as the number of tokens in the context window increases, the model's ability to accurately recall information from that context decreases"
**Correct verdict:** replace — back the salience claim with Hong et al., "Context Rot" (Chroma, research.trychroma.com/context-rot) and Anthropic, "Effective context engineering for AI agents", in place of `RETHINK.md` §2.4; do not cite Liu et al. for it. Engineering line; goes to Max Cogar as a change to his signed document.

### E-10
**Agree/Disagree:** Verdict: agree (replace). Reasoning: the unqualified "never mutates the
repository" contradicts §2.2 and P8, which allow the `init` hook wiring, and "repository-resident"
contradicts OL-6's out-of-tree stores. The fix states the property the rest of the spec states; it
neither narrows the property nor adds an exception that is not already in §2.2. Engineering
classification is right: the no-in-tree-write rule is tagged `[D-9]`, not a ledger entry.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L37-L37]] "The Context Oracle is a passive, repository-resident intelligence."
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L41-L42]] "**never mutates the"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L115-L116]] "except the hook-wiring `ctxoracle init`"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L44-L44]] "both outside the repo tree"
**Correct verdict:** replace — "a passive, per-repository intelligence whose stores live outside the repository tree `[OL-6]`", and "never mutates the repository except the hook wiring `ctxoracle init` installs `[D-9]`". Engineering line; goes to Max Cogar as a change to his signed document.

### E-11
**Agree/Disagree:** Verdict: agree (keep). Reasoning: both cases, the reactive-only condition and
the rejection of the pre-emptive gate are ledger text. "Exactly two" is safe because §8 makes any
third case his decision. The unit states the objective, not the mechanism; the mechanism defect is
E-19's.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L44-L45]] "blocks"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L69-L69]] "the oracle should block that motherfucker until it stops ignoring me and actually answers"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L338-L338]] "Adding any third block is an owner decision for Max"
**Correct verdict:** keep — owner decision stated as confirmed.

### E-12
**Agree/Disagree:** Verdict: agree (keep). Reasoning: the user and solo scope are OL-6. I re-ran the
shallow-clone check in this sandbox and got the same result, so thin history is a real OL-4
operating condition, not a hypothetical, and bounding behaviour there by an evidentiary floor
follows. The classification (owner scope plus an engineering premise backed by execution) is right.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L54-L55]] "(new repos, shallow clones) as a design condition"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L42-L42]] "Sandbox compatibility is required."
- [[ran]] `git -C /home/user/agent-armory rev-parse --is-shallow-repository` → `true`
**Correct verdict:** keep — owner scope plus a premise confirmed by execution.

### E-13
**Agree/Disagree:** Verdict: agree (replace). Reasoning: agree that "cannot surface from a cold
checkout" overstates (a full clone gives the agent `git log`) and conflicts with L28's "does not
consult", and that `RETHINK.md` §2.3 is not backing. Re-reading Tricorder in context strengthens the
citation: it reports results shown "too late" and also results shown "too early, while developers
were still experimenting", which is evidence for "at the decision point, and nowhere else", not
only against lateness. It is evidence about human developers, so it is cited as the delivery
evidence the spec has, not as a measurement on agents. Disagree with the replacement wording
"cannot cheaply surface": it imports P5's "cheap to fetch" test, which E-39 below finds wrong. What
makes the knowledge scarce is that the agent does not know it exists or where to look, which is the
spec's own L28 premise.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L60-L60]] "cannot surface from a cold checkout with its own tools"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L28-L28]] "from history and structure the agent does not consult at the moment it decides"
- [[https://research.google.com/pubs/archive/43322.pdf]] "Some tools displayed results too late, making developers less likely to fix problems after they had submitted their code"
- [[https://research.google.com/pubs/archive/43322.pdf]] "Others displayed results too early, while developers were still exper- imenting with their code in the editor"
**Correct verdict:** replace — "The scarce, valuable knowledge is what an agent does not have and would not know to look for with its own tools (invisible coupling, historical landmines); delivering it at the decision point, and nowhere else, is what gets it used `[TRICORDER]`", in place of `RETHINK.md` §2.3. Engineering line; goes to Max Cogar as a change to his signed document.

### E-16
**Agree/Disagree:** Verdict: agree (keep). Reasoning: the name and CLI are OL-1, and hooks are the
harness's documented lifecycle interface (re-read: `PreToolUse` "Before a tool call executes. Can
block it"). The line asserts scope, not a component design.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L70-L71]] "A CLI, `ctxoracle`, and the hook shims that wire it into a Claude Code session"
- [[https://code.claude.com/docs/en/hooks.md]] "Before a tool call executes. Can block it"
**Correct verdict:** keep — owner name plus the harness's documented interface.

### E-17
**Agree/Disagree:** Verdict: agree (keep). Reasoning: OL-8 puts subagent delivery in scope, and the
reference confirms hooks fire inside subagents with identifying fields; a `SubagentStop` block's
reason is delivered to the subagent, which shows the harness routes hook output to the subagent.
**Evidence:**
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L46-L46]] "Subagent whisper delivery is in v1 scope"
- [[https://code.claude.com/docs/en/hooks.md]] "the input carries the agent_id and agent_type"
- [[https://code.claude.com/docs/en/hooks.md]] "Returning decision: \"block\" with a reason keeps the subagent running and delivers reason to the subagent as its next instruction"
**Correct verdict:** keep — owner decision, feasible per the reference.

### E-19
**Agree/Disagree:** Verdict: agree (replace). Reasoning: agree with the defect and its direction;
disagree with two details of the proposed line.
1. The defect is real. OL-C5 covers any next move. After Max's question the agent can call a tool
   that is not answer-directed, or end its turn without answering. The spec's only mechanism is a
   `PreToolUse` deny, and a text turn "is never denied", so the second case is left to a best-effort
   Stop whisper and to Max re-asking. That is the "agent silently ends its turn" case OL-R5 refused
   to let the spec scope out, now scoped out by the choice of mechanism instead of by words.
2. Checked against the three owner lines the coordinator named:
   - Pre-emptive gate (OL-3 as clarified, OL-C2; CLAUDE.md "no deny before the agent has actually
     deviated"). A `Stop` block fires only after the agent has ended its turn with the question
     open, so the deviation has already happened. It conditions nothing on a plan or a test; it
     asks for the answer OL-C3 names. It is reactive. OL-R4 is the generated-file block and is not
     touched.
   - OL-C3's definition. "block that motherfucker until it stops ignoring me and actually answers"
     is literally what a `Stop` `decision: "block"` does: it "prevents Claude from stopping" and
     hands the reason to Claude. One hook, one condition, which is not "a convoluted fucked up way".
   - OL-R5. It requires this path; the spec's own blocking review dropped `Stop` because it
     "modeled the wrong scenario (an agent that "stops" without answering)", the premise OL-R5
     then rejected (E-2).
   So the `Stop` path conflicts with none of them and is required by OL-C5 with OL-R5.
3. Disagree: "bounded by `stop_hook_active`" is wrong if it means release once `stop_hook_active`
   is true. That holds the block for one cycle, which contradicts OL-C3's "until it stops ignoring me and actually
   answers". The reference says to check `stop_hook_active` "to avoid blocking on a condition that
   will never resolve"; an open question resolves the moment the agent answers, so the block must
   re-apply while the question stays open. The outer bound is the harness's 8-continuation cap
   (raisable by `CLAUDE_CODE_STOP_HOOK_BLOCK_CAP`); a repeated block feeds FR-M4's deny-loop signal
   and a cap-hit is an FR-M2 fault. Stating it as a one-cycle bound would be a narrowing.
4. Disagree: "unanswered per `last_assistant_message`" reads only the final message. An answer given
   in an earlier text block of the same turn must clear it, so the judgment reads all assistant
   text since the question: earlier text from the transcript, the final text from
   `last_assistant_message`, because the reference says the transcript is not guaranteed to hold
   the final message at Stop time. The clear posture is FR-B5's (a substantive answer clears).
5. Classification: engineering (the mechanism); the rule is Max Cogar's. Correct.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L75-L76]] "via a reactive `PreToolUse` deny of the agent's"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L369-L370]] "A text turn is never a tool action, so it is never denied"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L427-L427]] "is the recourse for every uncaught case"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L71-L71]] "if i ask a question and their next move isnt a direct answer or them taking actions to provide an answer, then then need corrected"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L60-L60]] "define the block positively, never by exclusion"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L69-L69]] "the oracle should block that motherfucker until it stops ignoring me and actually answers. just dont make a convoluted fucked up way that its done."
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L41-L41]] "What he rejected is the *pre-emptive* gate (\"pass a test to proceed\" / generated-file), not blocking as such."
- [[middleware/context-oracle/CLAUDE.md@HEAD:L174-L174]] "no deny before the agent has actually deviated"
- [[middleware/context-oracle/docs/reviews/2026-08-25-blocking-model-rebuild-6-rounds.md@ec3b057:L13-L15]] "which modeled the wrong scenario"
- [[https://code.claude.com/docs/en/hooks.md]] "\"block\" prevents Claude from stopping. Omit to allow Claude to stop"
- [[https://code.claude.com/docs/en/hooks.md]] "Check this value or process the transcript to avoid blocking on a condition that will never resolve"
- [[https://code.claude.com/docs/en/hooks.md]] "after stop hooks have continued the turn eight times in a row, Claude Code overrides the next block and ends the turn"
- [[https://code.claude.com/docs/en/hooks.md]] "To raise the cap, set"
- [[https://code.claude.com/docs/en/hooks.md]] "the transcript file isn't guaranteed to include the final message at Stop time on all versions"
**Correct verdict:** replace — the answer-drift block is realised as a `PreToolUse` deny of a non-answer-directed tool action **and** a `Stop` `decision: "block"` (reason "answer Max's question first: <q>") whenever the turn ends with the question still unanswered, judged on all assistant text since the question (the final message from `last_assistant_message`); it re-applies while the question stays open, the harness continuation cap is its outer bound, and repeated blocks and cap-hits are recorded (FR-M2/FR-M4). Engineering line (the rule is Max Cogar's; the mechanism is not); goes to Max Cogar as a change to his signed document.

### E-21
**Agree/Disagree:** Verdict: agree (keep). Reasoning: coupling needs mined co-change history and
orientation/reuse need a structural index, so both components follow from in-scope genres. The
first audit's alternative ("raw git on every event would miss NF-1") is unmeasured, but the line
does not rest on it; it rests on the genres.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L94-L94]] "that populate the stores"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L166-L166]] "Co-change partners of that file, with the evidence ratio and a history pointer."
**Correct verdict:** keep — derived from the genres.

### E-24
**Agree/Disagree:** Verdict: agree (replace). Reasoning: the pointer names only FR-A2g, whose own
"Limit" says it catches unrun covering tests, not unfinished work; OL-12's stated need lives in
FR-A2m. Adding the pointer is the correct line, not a narrowing. Classification (an engineering
pointer on an owner decision) is right.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L100-L101]] "(§4 FR-A2g)."
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L50-L50]] "did not finish their work but still stopped anyway."
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L175-L175]] "OL-12's concrete case"
**Correct verdict:** replace — "(§4 FR-A2g, FR-A2m)". Engineering line; goes to Max Cogar as a change to his signed document.

### E-29
**Agree/Disagree:** Verdict: agree (keep). Reasoning: the line is right and scoped to one explicit,
owner-invoked act. Disagree with the backing the first audit gives it. It calls "never mutates the
repo" "OL-3's confirmed rationale", but the ledger confirms OL-3's row, not every sentence of the
`RETHINK.md` §12.3 text; CLAUDE.md says only ledger CONFIRMED is authoritative because RETHINK is
agent-contaminated; and the same §12.3 corollary ("never prevents an action") has itself been
superseded. The line is an engineering decision (`[D-9]`) and its real backing is least privilege:
the oracle needs read access to the repository and nothing more, except the one write that wiring
it into Claude Code requires. OWASP's LLM06 mitigation states the principle for LLM-integrated
components.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L115-L116]] "except the hook-wiring `ctxoracle init`"
- [[middleware/context-oracle/RETHINK.md@ec3b057:L326-L327]] "it never mutates the repo and never prevents an action"
- [[middleware/context-oracle/RETHINK.md@ec3b057:L330-L331]] "Superseded in part by the owner, 2026-08-16"
- [[middleware/context-oracle/CLAUDE.md@HEAD:L58-L60]] "agent-contaminated in places, so only"
- [[https://genai.owasp.org/llmrisk/llm062025-excessive-agency/]] "Limit the permissions that LLM extensions are granted to other systems to the minimum necessary in order to limit the scope of undesirable actions."
**Correct verdict:** keep — the line stands; its backing is least privilege (OWASP LLM06), which D-9's §12 entry must record (part c), not an owner rationale.

### E-32
**Agree/Disagree:** Verdict: agree (keep). Reasoning: the two surfaces named are OL-1's CLI and the
hooks channel; the reference confirms injected context is not a chat message, which the first
audit rightly carries into E-80.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L121-L122]] "the interface is injected context plus a"
- [[https://code.claude.com/docs/en/hooks.md]] "Claude reads the reminder on the next model request, but it doesn't appear as a chat message in the interface"
**Correct verdict:** keep — accurate scope statement.

### E-35
**Agree/Disagree:** Verdict: agree (keep). Reasoning: silence as the default follows from the
mission (no decision-changing fact, nothing to say), "never a target" keeps it consistent with
OL-C1, and the Tricorder passage, read in context, is about developers acting on false-positive
feedback, which supports the cost of unwanted output.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L130-L132]] "A starting posture, never"
- [[https://research.google.com/pubs/archive/43322.pdf]] "Developers do not like false positives"
**Correct verdict:** keep — derived from the mission.

### E-37
**Agree/Disagree:** Verdict: agree (keep). Reasoning: "pass a test to proceed" is OL-C2's rejection
and "no ritual" follows from passive injection; the `RETHINK.md` §6 pointer is a rationale pointer
for a principle, not backing for an empirical claim.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L137-L138]] "no required ritual, no format"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L68-L68]] "making the working agent take a goddamn tests to see if it had a good enough plan to proceed"
**Correct verdict:** keep — owner rejection plus derivation.

### E-38
**Agree/Disagree:** Verdict: agree (keep). Reasoning: the Johnson et al. passage, read in context,
is developers asking for "links to more details or examples" so they can judge whether a report is
a false positive, which is what a provenance pointer gives.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L139-L139]] "Provenance on everything"
- [[https://petertsehsun.github.io/soen7481/papers/icse13b.pdf]] "it would be helpful to have links to more details or examples in the error reports"
**Correct verdict:** keep — backed.

### E-39
**Agree/Disagree:** Verdict: disagree (undetermined → replace). Reasoning: agree that P5 is flawed
and that its backing is not real; disagree that the correct line needs data the spec does not have.
1. P5's cited backing, `RETHINK.md` §2.3, argues against "thousands of tokens of material" in a
   front-loaded binder. It is carried over to a one-fact whisper, a neighbouring decision (brief
   test item 4), and it rests on the unsourced "Modern agents grep, glob, and read well", which the
   spec's own §1 premise ("Coding agents under-read") contradicts.
2. The test "a fact one `grep` returns" cannot be evaluated as written. One grep returns a fact
   only to an agent that already knows the query. The spec's own Reuse headline, "the canonical
   helper is `X`; most call sites use it", is one `grep X` away for an agent that knows `X` and out
   of reach for one that does not; P5 read literally would silence it. So the test is incoherent,
   not merely unproven.
3. The spec already states the decidable test: FR-A1 asks whether the agent "almost certainly does
   not" know the fact, and FR-A4 defines what a consumer has (its read-set and delivered-set). A
   fact is self-serve when the agent already holds it or it is evident from what is in front of it
   (the result of its own triggering action, a name-evident pairing such as AC-1's same-directory,
   same-name pair). That is the mission's test and it needs no empirical settlement: if agents do
   fetch such facts, the fact is already in the read-set and dedup suppresses it; if they do not,
   the whisper is the value. The residual cost, a whisper the agent would have fetched a moment
   later, is a false fire the loop already measures (FR-L3/FR-M4), not a reason to stay silent.
4. The first audit's evidence request ("whether agents obtain one-grep facts before deciding") is
   therefore not what decides the line; it decides only the noise rate, which is Phase A data.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L140-L142]] "a fact one `grep` returns is"
- [[middleware/context-oracle/RETHINK.md@ec3b057:L54-L55]] "Handing them thousands of tokens of"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L24-L24]] "Coding agents under-read the codebase"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L167-L167]] "the canonical helper is `X`; **most call sites use it**"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L179-L181]] "do I know something it almost certainly does not that would"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L222-L222]] "A per-consumer **delivered-set** and **read-set**"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L920-L922]] "a coupling whisper about an obvious same-directory,"
**Correct verdict:** replace — "P5 — Marginal value decides worth. The oracle speaks a fact only when the agent does not already have it — not in that consumer's read-set or delivered-set (FR-A4), and not evident from what is in front of it (its triggering action's result, a name-evident pairing) — and it would change the next decision (FR-A1). Whether one search would return it is not the test: a search is cheap only to an agent that already knows what to search for." Engineering line; goes to Max Cogar as a change to his signed document.

### E-40
**Agree/Disagree:** Verdict: agree (keep). Reasoning: P6 restates the mission's timing clause; the
`RETHINK.md` §2.4 pointer is a rationale pointer for a principle, not backing for an empirical
claim (unlike E-7's salience claim). Tricorder's too-late/too-early passage supports it.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L143-L143]] "Right fact, right moment"
- [[https://research.google.com/pubs/archive/43322.pdf]] "Some tools displayed results too late, making developers less likely to fix problems after they had submitted their code"
**Correct verdict:** keep — restates the mission.

### E-41
**Agree/Disagree:** Verdict: agree (keep). Reasoning: the absorbing-state derivation is sound (a
channel demoted to silence produces no measurements, so demotion alone never recovers). The
Tricorder passage, read in context, is about clicks being an imperfect false-positive signal; it
shows measured feedback is standard practice, which is all it is used for.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L144-L146]] "the loop must not"
- [[https://research.google.com/pubs/archive/43322.pdf]] "Developers may ignore findings they do not plan to fix, rather than clicking NOT USEFUL"
**Correct verdict:** keep — backed by the derivation.

### E-42
**Agree/Disagree:** Verdict: agree (keep). Reasoning: same decision as E-29; the same correction to
its backing applies (least privilege, not an owner rationale).
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L147-L147]] "The repository tree stays pristine"
- [[https://genai.owasp.org/llmrisk/llm062025-excessive-agency/]] "Limit the permissions that LLM extensions are granted to other systems to the minimum necessary in order to limit the scope of undesirable actions."
**Correct verdict:** keep — backed by least privilege, as E-29.

### E-43
**Agree/Disagree:** Verdict: agree (replace). Reasoning: agree that "is the recurring failure this
project exists to prevent", tagged `[OL-C2]`, is not in OL-C2 and inflates his words into the
project's purpose (the OL-R2 shape; OL-C7 overgeneralization), and that the owner classification is
right because the line attributes content to him. Disagree with the replacement dropping the
history altogether. OL-C2 does record a specific failure in his words: in the earlier 3–4 attempts,
agents over-focused on the gate feature. OL-C7 asks for situational specifics to be kept, not
removed. The correct line keeps that specific, scoped to what he said (the corrective/gate feature,
not "any genre").
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L148-L150]] "is the recurring failure this project exists to"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L68-L68]] "the other 3 or 4 times I tries building this the agents kept putting way too much focus on that parts"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L50-L50]] "the no-primary-feature principle is held by the mission and OL-C2"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L73-L73]] "must carry its actual situational specifics"
**Correct verdict:** replace — "P9 — No feature is primary: relevance is per fact, by decision impact, not by genre (mission; OL-12 row). The corrective/skill feature is small, personal and non-primary `[OL-C2]`; over-focus on it (the gates) is what sank the earlier 3–4 attempts, in Max Cogar's words `[OL-C2]`." Owner decision — goes to Max Cogar.

### E-45
**Agree/Disagree:** Verdict: disagree (undetermined → replace). Reasoning: the headline rule is P5
applied to every genre; with P5 settled (E-39) it follows: each whisper is headlined by the fact the
agent does not have. The `[RSSE]` clause is a separate defect the first audit identified but left
under "undetermined": the fetched chapter is "Recommendation Delivery", about making
recommendations noticeable, understandable and trusted; its page contains no push/pull material,
and neither it nor §9's description grounds this genre set. Citing it for what it says (delivery)
is correct; "grounded" for the genre set is not.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L156-L158]] "fact the agent could not cheaply get itself"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L157-L158]] "push-mode recommendation surface `[RSSE]`"
- [[https://link.springer.com/chapter/10.1007/978-3-642-45135-5_9]] "the recommendations must be delivered with a user interface that allows the user to become aware that recommendations are available"
- [[ran]] `grep -i "push" rsse.txt | grep -vc '\.push('` (text of `curl -sSL https://link.springer.com/chapter/10.1007/978-3-642-45135-5_9`, tags stripped; the three raw matches are all JavaScript `dataLayer.push(`) → `0`
**Correct verdict:** replace — "headlined by the fact the agent does not have (P5)"; cite `[RSSE]` only for delivery (awareness, understandability, trust of a delivered recommendation), not as grounding for the genre set. Engineering line; goes to Max Cogar as a change to his signed document.

### E-47
**Agree/Disagree:** Verdict: agree (replace). Reasoning: "2–4" and "the one" come only from
agent-written RETHINK §5 and, read as the whisper's content, cap how many entry points and binding
invariants are delivered on a trigger, a count limit OL-C1 bars. D-26 (landmines at the edit) and
prompt-time delivery are sound. The fix removes the unsourced count without narrowing anything.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L165-L165]] "The 2–4 structural entry-point files for the task and the one invariant that will bind."
- [[middleware/context-oracle/RETHINK.md@ec3b057:L163-L163]] "2–4 entry-point files, the one invariant that will matter"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L67-L67]] "at no point should an arbitrary limit influence how that operates."
**Correct verdict:** replace — "The structural entry-point files for the task and the invariants that will bind, each clearing the bar (FR-A5); task-shape landmines are delivered at the edit (FR-A2e) `[D-26]`." Engineering line; goes to Max Cogar as a change to his signed document.

### E-48
**Agree/Disagree:** Verdict: agree (keep). Reasoning: the ROSE abstract, read in context, claims
mined co-change "show[s] up item coupling that is undetectable by program analysis". ROSE itself
suggests "after an initial change"; firing at read time is a timing choice the first audit
justifies by the mission (the plan forms before the edit) and FR-A2f covers the post-edit moment.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L166-L166]] "Co-change partners of that file, with the evidence ratio and a history pointer."
- [[https://thomas-zimmermann.com/publications/files/zimmermann-tse-2005.pdf]] "show up item coupling that is undetectable by program analysis"
- [[https://thomas-zimmermann.com/publications/files/zimmermann-tse-2005.pdf]] "After an initial change, our ROSE prototype can correctly predict further locations to be changed"
**Correct verdict:** keep — backed by ROSE and the mission's timing.

### E-49
**Agree/Disagree:** Verdict: agree (keep). Reasoning: the convention, not bare existence, is what
changes the reuse decision. The first audit calls the row "independent of P5"; it is not quite: P5
as written would silence this row, since its headline is one `grep X` away for an agent that knows
`X` (E-39). That is a defect in P5, not in this row.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L167-L167]] "the convention, not bare existence"
**Correct verdict:** keep — derived from the mission.

### E-50
**Agree/Disagree:** Verdict: agree (replace). Reasoning: agree that "about to run" misstates when an
edit-triggered whisper reaches the model: `PreToolUse` context is added "alongside the tool result"
and read on the next model request, and delivering before the edit would need a deny, the
pre-emptive gate. Disagree with writing "(`PreToolUse`)" into the correct line. FR-O1 makes the
event-to-genre mapping the architect's, and the settled branch-audit ruling found that `PreToolUse`
context also reaches the model next to a permission-denial result, so a whisper bound to
`PreToolUse` can say "this edit tends to break test T" about an edit that never ran. `PostToolUse`
fires only after a call succeeds. The requirement is the timing property; the event is the
architect's, who must handle the denied-call case.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L168-L168]] "An edit / write about to run"
- [[https://code.claude.com/docs/en/hooks.md]] "String added to Claude's context alongside the tool result"
- [[https://code.claude.com/docs/en/hooks.md]] "Permission denials fire PreToolUse"
- [[middleware/context-oracle/docs/reviews/2026-09-28-branch-audit-hook-context-permission-denial.md@HEAD:L41-L42]] "A permission-rule denial fires `PreToolUse`,"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L216-L217]] "the event-to-genre mapping and which of the ~31 hook events are wired is architecture"
**Correct verdict:** replace — "Fires on: an edit/write; the whisper reaches the agent with the edit's result, at its next decision (keep, revise, run the coupled tests) `[HOOKS]`", event choice left to the architecture (FR-O1), rest unchanged. Engineering line; goes to Max Cogar as a change to his signed document.

### E-51
**Agree/Disagree:** Verdict: agree (keep). Reasoning: the row does not claim pre-edit delivery, and
confidence flagging is OL-C4. I checked the first audit's side claim that the coordinator ruling's
"Delivery at read time is FR-A2e / D-26's job, which batches 2–3 settled" is wrong: batch 2's
verification settled the opposite, removing a move of the Warning trigger to read time because it
contradicts FR-A2e and D-26. The side claim holds.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L169-L169]] "An edit in a landmine zone"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L70-L70]] "also voice uncertain warnings clearly flagged"
- [[middleware/context-oracle/docs/reviews/2026-09-28-branch-audit-coordinator-rulings-schema-and-edit-timing.md@HEAD:L85-L85]] "**Delivery at read time** is FR-A2e / D-26's job, which batches 2–3 settled."
- [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B2-verification.md@HEAD:L101-L101]] "The trigger move to read/search time contradicts FR-A2e and D-26, has no review backing, and is removed."
**Correct verdict:** keep — owner-backed flagging, edit-time trigger sound.

### E-52
**Agree/Disagree:** Verdict: disagree (keep → replace). Reasoning: the first audit kept the row on
ROSE and the Stop channel, but did not check its "Fires on" column against the rest of the spec.
The row fires on "Edit completed / stop". FR-B4 says Completeness fires "when the agent claims
done", and AC-1d tests delivery "at the stop via a single self-releasing Stop-time injection". So
the row contradicts FR-B4 and AC-1d (brief test item 6). The edit-completed trigger is also wrong on
its merits: "You changed the reducer but not the selector" after one edit is premature, because the
agent may be about to change the selector next; Tricorder records results shown "too early, while
developers were still experimenting" as one reason tools fell out of use. Pairing facts before the
partner edit are FR-A2b's job at read time.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L170-L170]] "| **FR-A2f Completeness** | Edit completed / stop |"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L406-L408]] "completion-check (FR-A2g) and Completeness (FR-A2f) fire when the agent claims done"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L932-L935]] "delivered at the stop via a single self-releasing Stop-time injection"
- [[https://research.google.com/pubs/archive/43322.pdf]] "Others displayed results too early, while developers were still exper- imenting with their code in the editor"
- [[https://thomas-zimmermann.com/publications/files/zimmermann-tse-2005.pdf]] "can prevent errors due to incomplete changes"
**Correct verdict:** replace — "Fires on: a recognized completion-claim stop (FR-B4)", rest unchanged. Engineering line; goes to Max Cogar as a change to his signed document.

### E-53
**Agree/Disagree:** Verdict: agree (replace). Reasoning: agree that the stated reasons do not
support the lean (P5 is about the fact's marginal value, not recognizer error; a whisper is not a
ritual P3 bars), and that by the spec's own cost-function method the lean should be toward firing:
a miss lets an unverified done-claim pass, which OL-12 calls a must-have to catch and which a
non-programmer owner cannot see (OL-11). Disagree on two parts of the reasoning and fix. (1) The
false-fire cost is understated as "one advisory sentence": a Stop-time injection continues the
turn ("The conversation continues so Claude can act on it"), so a false fire on an ordinary stop
(e.g. the agent stopping to ask Max something) costs one forced continuation, during which the
agent acts instead of waiting. That cost is still small and bounded to one cycle, so the lean
stands, but the correct line must state the real cost. (2) "demoted by the loop (P7)" names a
mechanism Phase A does not have; automated demotion is Phase C. In Phase A the false-fire rate is
recorded and reported.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L171-L171]] "errs toward not firing"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L50-L50]] "having the oracle speak when an agent claims it's done is a must-have feature in my mind"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L431-L431]] "Each block's precision is calibrated to its own cost function."
- [[https://code.claude.com/docs/en/hooks.md]] "The conversation continues so Claude can act on it"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L254-L255]] "automated demotion/promotion is Phase C"
**Correct verdict:** replace — "a classification that errs toward firing when a covering test exists and was not run (a false fire costs one Stop-time continuation carrying a true fact; a miss defeats OL-12 unseen), its false-fire rate recorded and reported (FR-M1/FR-M4), with automated demotion from Phase C (P7)". Engineering line; goes to Max Cogar as a change to his signed document.

### E-54
**Agree/Disagree:** Verdict: agree (keep). Reasoning: a narrated assumption the repository
contradicts is a decision-changing fact. Narration is observable: `MessageDisplay` receives the
assistant's text (it is display-only, so it observes and cannot inject) and the transcript holds
it; delivery is off-path at the next event (FR-J5). Model judgment puts it in Phase B.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L172-L172]] "Your narration assumes X; the repo says Y at `file:line`."
- [[https://code.claude.com/docs/en/hooks.md]] "While assistant message text is displayed"
- [[https://code.claude.com/docs/en/hooks.md]] "MessageDisplay is display-only"
**Correct verdict:** keep — mission-derived, feasible.

### E-55
**Agree/Disagree:** Verdict: agree (keep). Reasoning: where the described thing actually lives
changes where the agent looks next; narration is observable as in E-54; model-dependent, Phase B.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L173-L173]] "What you're describing lives in `src/…`, not where you're looking."
**Correct verdict:** keep — mission-derived.

### E-56
**Agree/Disagree:** Verdict: agree (keep). Reasoning: an open question the repository answers is a
fact the agent lacks at its next decision; narration is observable as in E-54; Phase B.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L174-L174]] "The repo-grounded answer with a pointer."
**Correct verdict:** keep — mission-derived.

### E-57
**Agree/Disagree:** Verdict: agree (keep). Reasoning: it realises OL-12's stated need, anchors
"incomplete" to a named referent so the judgment is checkable, and is Phase B within v1.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L175-L175]] "OL-12's concrete case"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L50-L50]] "did not finish their work but still stopped anyway."
**Correct verdict:** keep — realises OL-12 with a checkable referent.

### E-58
**Agree/Disagree:** Verdict: agree (replace). Reasoning: agree that "Max cannot see a skipped step
himself (OL-11)" puts a claim on OL-11 that OL-11 does not make, and agree that whether a
"full-investment", most-machinery-heavy mechanism fits his "JUST A SMALL FEATURE" is a scope call
that goes to Max Cogar. Disagree with the proposed fix "state it as an engineering premise with
evidence or drop the detector's justification". That is two options, not the correct line, and
dropping the justification would leave a mechanism with none. The premise is derivable from what
OL-11 does say: verification is the agents' job, not his, so no step of the design may rely on Max
Cogar noticing a skipped step. That is the correct justification for an automated under-fire guard,
and it does not claim anything about his abilities.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L176-L176]] "Max cannot see a skipped step himself (OL-11)"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L49-L49]] "design/build/verification/docs/roadmap are the agents'"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L68-L68]] "BUT I CANNOT STRESS ENOUGG THAT THIS IS JUST A SMALL FEATURE FOR MY OWN PERSONAL BENEFIT"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L680-L681]] "It is the most machinery-heavy"
**Correct verdict:** replace — "its under-fire side carries an automated missed-skill-block detector that checks each step's observable post-condition directly (FR-B5, FR-C1, FR-C4), because verification is the agents' job, not Max Cogar's (OL-11), so a skipped step must be caught without him"; owner decision — goes to Max Cogar: whether the detector and "full investment" in block precision fit his "just a small feature" (OL-C2).

### E-59
**Agree/Disagree:** Verdict: agree (replace). Reasoning: the same defect as E-19 in the §4 row: the
action column realises OL-C5 only for tool actions. The provenance note (OL-9 superseded by
OL-C3/OL-C5) matches the ledger. The correct line carries E-19's two corrections (re-apply while
the question stays open, judge all assistant text since the question).
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L177-L177]] "**Denies that non-answer-directed action** (`PreToolUse`)"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L71-L71]] "if i ask a question and their next move isnt a direct answer or them taking actions to provide an answer, then then need corrected"
- [[https://code.claude.com/docs/en/hooks.md]] "\"block\" prevents Claude from stopping. Omit to allow Claude to stop"
**Correct verdict:** replace — add the `Stop` `decision: "block"` path for a turn that ends with the question unanswered, worded as E-19's correct line. Engineering line; goes to Max Cogar as a change to his signed document.

### E-62
**Agree/Disagree:** Verdict: agree (replace). Reasoning: "~1–5" originates only in agent-written
RETHINK §6; Johnson et al., read in context, argue for enough information to assess a report, not
for a sentence count; "illustrative" does not exempt a number from the project's no-unsourced-
numbers rule. Dropping it removes an unsourced number without narrowing the property.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L185-L185]] "(illustrative ~1–5, tunable)"
- [[middleware/context-oracle/RETHINK.md@ec3b057:L190-L190]] "one topic, one to five sentences"
- [[middleware/context-oracle/CLAUDE.md@HEAD:L223-L224]] "Numbers without sources"
- [[https://petertsehsun.github.io/soen7481/papers/icse13b.pdf]] "do not present their results in a way that gives enough information for them to assess what the problem is, why it is a problem and what they should be doing differently"
**Correct verdict:** replace — drop "(illustrative ~1–5, tunable)"; keep "one topic, a few sentences" and the rest. Engineering line; goes to Max Cogar as a change to his signed document.

### E-63
**Agree/Disagree:** Verdict: agree (replace). Reasoning: P3 concerns rituals imposed on the agent,
not the tone of injected text; the hooks reference gives the real reason, read in context:
imperative injected text "can trigger Claude's prompt-injection defenses", which makes Claude
surface it to the user instead of using it.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L190-L190]] "Whispers are informative, never imperative"
- [[https://code.claude.com/docs/en/hooks.md]] "Write the text as factual statements rather than imperative system instructions"
- [[https://code.claude.com/docs/en/hooks.md]] "Text framed as out-of-band system commands can trigger Claude's prompt-injection defenses"
**Correct verdict:** replace — cite `[HOOKS]` ("write the text as factual statements rather than imperative system instructions") in place of `[P3]`. Engineering line; goes to Max Cogar as a change to his signed document.

### E-64
**Agree/Disagree:** Verdict: agree (replace). Reasoning: Herzig & Zeller, read in context, show
tangled commits add noise to mined change data, a reason confidence matters, not evidence that
users need evidence stated; Johnson et al. is that evidence. FR-D3 contains no rate, so "(illustrative
rate, §9)" points at nothing.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L193-L193]] "never a bare assertion `[HERZIG]` (illustrative rate, §9)."
- [[https://www.st.cs.uni-saarland.de/publications/files/herzig-msr-2013.pdf]] "such tangled changes will make all changes to all modules appear related, possibly compromising the resulting analyses through noise and bias"
**Correct verdict:** replace — "never a bare assertion `[JOHNSON]`; history-derived evidence is noisy, so its support/confidence is stated `[HERZIG]`", dropping "(illustrative rate, §9)". Engineering line; goes to Max Cogar as a change to his signed document.

### E-65
**Agree/Disagree:** Verdict: agree (keep). Reasoning: flagging a possible false fire and demoting
through the loop is OL-C4's option B; the CLI correction is one input to that loop. Who supplies
corrections in Phase A is E-80's question, not this line's.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L194-L196]] "records that it may"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L70-L70]] "letting the learning loop demote ones that keep being wrong"
**Correct verdict:** keep — owner-backed.

### E-66
**Agree/Disagree:** Verdict: agree (keep). Reasoning: a fact the consumer already has cannot change
its decision again. The line depends on the consumer key (E-73) and the compaction reset (E-74)
being right; both are fixed there, not here.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L197-L198]] "per consumer against what that consumer has been"
**Correct verdict:** keep — mission-derived.

### E-70
**Agree/Disagree:** Verdict: agree (replace). Reasoning: trigger-as-relevance is sound; "the edit it
is about to run" misstates when an edit-triggered whisper reaches the model, as E-50. One wording
correction: "the edit it has just made" is false for a denied edit, whose `PreToolUse` context also
reaches the model (E-50); "attempted" is true in both cases.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L211-L211]] "the edit it is about to run"
- [[https://code.claude.com/docs/en/hooks.md]] "String added to Claude's context alongside the tool result"
**Correct verdict:** replace — "the edit it has just attempted (its whisper arrives with the edit's result)". Engineering line; goes to Max Cogar as a change to his signed document.

### E-71
**Agree/Disagree:** Verdict: agree (replace). Reasoning: re-counted on a fresh fetch: 33 event
sections, not ~31. The count does no work (the requirement is that the mapping is the architect's)
and an undated count of a drifting contract goes false silently. Dropping it is the correct line,
not a narrowing.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L217-L217]] "which of the ~31 hook events are wired is architecture"
- [[ran]] `awk '/^## Hook events/{p=1} /^## Prompt-based hooks/{p=0} p && /^### /' hooks.md | wc -l` (the page fetched with `curl -sSL https://code.claude.com/docs/en/hooks.md` on 2026-09-29) → `33`
**Correct verdict:** replace — "which of the hook events the current contract defines are wired is architecture". Engineering line; goes to Max Cogar as a change to his signed document.

### E-72
**Agree/Disagree:** Verdict: agree (replace). Reasoning: agree that `[CHI]` measures human
resumption lag and is at most an analogy, and that it is misdated. Disagree with the proposed
backing: "`[HOOKS]` (context enters only where a hook fired)" implies the harness gives an idle
timer no channel. It does: an `asyncRewake` hook "wakes Claude immediately even when the session is
idle". So the harness does not rule out idle-time interventions; the property needs its own reason.
That reason is the mission: a decision exists only while the agent is acting, which is when a
lifecycle event fires; a whisper to an idle session arrives at no decision and, via a rewake, would
start a turn Max Cogar did not ask for.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L219-L219]] "Task-boundary intervention only; no idle timers"
- [[https://experts.illinois.edu/en/publications/leveraging-characteristics-of-task-structure-to-predict-the-cost-]] "users were interrupted during task execution at various boundaries to collect a large sample of resumption lag values"
- [[https://code.claude.com/docs/en/hooks.md]] "an asyncRewake hook that exits with code 2 wakes Claude immediately even when the session is idle"
**Correct verdict:** replace — "Task-boundary intervention only; no idle timers: the oracle speaks only on a lifecycle event of the agent's own work, where a decision is being made (mission); it never wakes an idle session (the harness permits it via `asyncRewake`)". `[CHI]`, if kept, as an analogy with the corrected year (CHI 2006). Engineering line; goes to Max Cogar as a change to his signed document.

### E-73
**Agree/Disagree:** Verdict: agree (replace). Reasoning: agree that `agent_type` cannot key a
consumer (shared by every subagent of a type, and present on the main thread under `--agent`) and
that `agent_id` identifies a subagent. Disagree that "keyed by `agent_id` (absent ⇒ the main
agent)" is the complete key. The per-project store is shared by every session on the repository
(OL-6), and every main agent has no `agent_id`, so two concurrent sessions' main agents would share
one delivered-set and read-set and suppress each other's whispers (FR-A4/FR-D5). The key needs the
session: every hook input carries `session_id`.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L220-L221]] "keyed by `agent_id`/`agent_type`"
- [[https://code.claude.com/docs/en/hooks.md]] "Unique identifier for the subagent. Present only when the hook fires inside a subagent call"
- [[https://code.claude.com/docs/en/hooks.md]] "Present when the session uses --agent or the hook fires inside a subagent"
- [[https://code.claude.com/docs/en/hooks.md]] "Current session identifier"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L44-L44]] "Two stores — per-project and per-user global"
**Correct verdict:** replace — "keyed by `session_id` and `agent_id` (no `agent_id` ⇒ that session's main agent); `agent_type` is descriptive only", with FR-A4's resume/fork reconciliation carrying a consumer's sets across session ids. Engineering line; goes to Max Cogar as a change to his signed document.

### E-74
**Agree/Disagree:** Verdict: agree (replace). Reasoning: agree with the derivation, and the first
audit's own "would be wrong if" (compaction preserving injected hook context) is now settled against
it by primary text: the reference says a `SubagentStart` hook's injected context is re-injected
after auto-compaction "discards that copy". Injected context does not survive compaction, so a
delivered-set kept across `compact` suppresses a fact the agent no longer has. Resume, by contrast,
replays injected text, so reseeding there is right. The two-way "clear, or reconcile against the
summary" is a property with an allowed implementation, not two unresolved options.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L223-L224]] "reconciled across `resume`/`fork` (reseed) / `compact` (clear read-set) /"
- [[https://code.claude.com/docs/en/hooks.md]] "discards that copy, Claude Code injects the next run's context again"
- [[https://code.claude.com/docs/en/hooks.md]] "The compact_summary field contains the conversation summary generated by the compact operation"
- [[https://code.claude.com/docs/en/hooks.md]] "Claude Code replays the saved text rather than re-running the hook for past turns"
**Correct verdict:** replace — "`compact` (after compaction the read-set and delivered-set hold only what the compaction summary retains; clearing both satisfies this)". Engineering line; goes to Max Cogar as a change to his signed document.

### E-76
**Agree/Disagree:** Verdict: agree (keep). Reasoning: separating relevance (the trigger) from worth
(the bar) keeps the bar from re-deriving intent and matches §5.1. "Marginal-value" here names the
concept; its definition is P5's, corrected in E-39.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L229-L229]] "a **quality/marginal-value filter, not a relevance oracle**"
**Correct verdict:** keep — framing consistent with §5.1.

### E-77
**Agree/Disagree:** Verdict: disagree (undetermined → replace). Reasoning: agree that conjunct (c)
carries P5's defect and that the no-cap clause, the dedup carve-out and conjuncts (a) and (b)
stand. With P5 settled (E-39), (c) has a correct line: "not already held by the agent or evident
from what is in front of it". OL-C1's "marginal value" names the concept and is consistent with
that wording.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L235-L235]] "and (c) **not cheaply self-serve** (**marginal value** `[P5]`)."
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L67-L67]] "the bar (importance / marginal value) is the sole arbiter"
**Correct verdict:** replace — "(c) not already held by that consumer or evident from what is in front of it (**marginal value** `[P5]`, FR-A4)", rest unchanged. Engineering line; goes to Max Cogar as a change to his signed document.

### E-79
**Agree/Disagree:** Verdict: agree (replace). Reasoning: FR-A2d's headline fact is
historically-coupled tests, which thin history cannot supply; only the zone flag is structural. The
list overstates what a thin-history repository gets, which the Phase A goal (no output that looks
more complete than it is) forbids. The fix states what operates; it is the correct line, not a
narrowing.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L250-L252]] "the structural, reuse, consequence, conformance, and answer-drift"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L168-L168]] "historically-coupled tests** this edit tends to break"
**Correct verdict:** replace — "the structural, reuse, conformance and answer-drift behaviours, and Consequence's zone flag, still operate; Consequence's coupled-tests headline is history-derived and thins with the corpus". Engineering line; goes to Max Cogar as a change to his signed document.

### E-80
**Agree/Disagree:** Verdict: disagree (undetermined → replace, with an owner part). Reasoning: agree
that Phase A's only named calibration input, the human CLI correction, assumes Max Cogar reviews
whispers he does not see in the chat and that no ledger entry assigns him; agree that "ships high"
has no reasoning (D-6bar only restates it) and biases toward the silence D-36 calls the costliest
value failure. Disagree that the correct calibration source cannot be written from sources. The
spec itself already requires the data: Phase A "exits by producing measured whisper/block +
false-fire and regret data on a real repo" and is "run on the owner's real repos and Claude Code
transcripts" as the test bed; AC-18's seeded-fact run and FR-L4's regret proxy are Phase A
requirements; and OL-11 assigns verification to the agents. So Phase A's calibration inputs are
agent-reviewed replay of real sessions, the seeded-fact coverage run and the regret proxy, with a
human correction outranking them when given (FR-L6). Nothing new is invented. What is Max Cogar's:
whether he will spend his time correcting whispers at all; OL-11 lists "speed up testing" among his
roles, which neither assigns nor excludes it, so it goes to him as a question, not an assumption.
D-12's "calibration input is the human CLI correction" changes with this line (part c).
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L253-L255]] "the calibration input from Phase A is the human CLI correction (FR-D4/FR-L6);"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L793-L794]] "combinator, \"ships high\", and calibration policy stated as properties."
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L656-L657]] "costliest **value** failure"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L755-L756]] "Exits by producing measured whisper/block"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L757-L758]] "owner's real repos and Claude Code transcripts to *discover* how the honest"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L49-L49]] "you start/end sessions, suggest features, speed up testing; design/build/verification/docs/roadmap are the agents'"
- [[https://code.claude.com/docs/en/hooks.md]] "Claude reads the reminder on the next model request, but it doesn't appear as a chat message in the interface"
**Correct verdict:** replace — "The bar is calibrated against measured false-fire and value. Phase A's calibration inputs are agent-reviewed replay of real sessions (§11.5; verification is the agents', OL-11), the seeded-fact run (AC-18) and the regret proxy (FR-L4); a human CLI correction (FR-D4/FR-L6) outranks them when given. The initial operating point is the architect's, recorded with its reason, and reset from Phase A data; automated demotion/promotion is Phase C `[D-6bar]`." Engineering line; owner part goes to Max Cogar: whether he will supply CLI corrections at all.

### E-83
**Agree/Disagree:** Verdict: agree (keep). Reasoning: each field (candidates, bar outcome,
delivery, blocks, latency) is what is needed to see why the oracle spoke, stayed silent, blocked or
was slow; without them failures are invisible (OL-10).
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L263-L264]] "candidates, bar outcome, what was delivered,"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L48-L48]] "it could fail a hundred ways in front of me and I wouldn't know."
**Correct verdict:** keep — follows from OL-10.

### E-84
**Agree/Disagree:** Verdict: agree (replace). Reasoning: the failure classes serve OL-10; the
missed-skill-block class repeats E-58's misattribution to OL-11. The correct wording is E-58's
(verification is the agents' job), not a bare removal that leaves the class unjustified.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L271-L271]] "the misclassified-as-done miss Max cannot see himself, OL-11"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L49-L49]] "design/build/verification/docs/roadmap are the agents'"
**Correct verdict:** replace — "so it catches the misclassified-as-done miss without relying on Max Cogar, since verification is the agents' job (OL-11)"; the class otherwise stands, subject to E-58's owner question on the detector. Engineering line; goes to Max Cogar as a change to his signed document.

### E-85
**Agree/Disagree:** Verdict: agree (keep). Reasoning: announcing silence to the owner serves OL-10;
"nothing to say" is not a decision-changing fact, so keeping it out of the agent's context follows
from the mission and from the hooks guidance that injected context is read as project information.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L273-L276]] "it is **never injected into the agent's context**"
**Correct verdict:** keep — follows from OL-10 and the mission.

## Summary

54 entries judged (23 replace and 4 undetermined from the first audit, and 27 keeps carrying a
number, mechanism, tool/harness claim or citation). Recount of the sections above: keep 26,
replace 28, remove 0, undetermined 0.

- Changed verdicts: E-39, E-45, E-77 and E-80 undetermined → replace (the correct lines are
  derivable from the mission, FR-A1, FR-A4 and the spec's own Phase A data requirements); E-52
  keep → replace (FR-A2f's "Edit completed" trigger contradicts FR-B4 and AC-1d).
- Replace verdicts upheld with a different correct line: E-2 (the "reviewed to convergence" claim is
  stale), E-7 (Liu et al. do not support the claim; context-rot sources do), E-13, E-19/E-59 (the
  `Stop` block must re-apply while the question stays open and read all text since the question),
  E-43 (keep OL-C2's specific history), E-50/E-70 (event left to the architect; a denied edit also
  receives `PreToolUse` context), E-53 (the false-fire cost is one continuation; no Phase A
  demotion), E-58/E-84 (justify the detector from OL-11's assignment of verification), E-72
  (`asyncRewake` gives the harness an idle channel; the backing is the mission), E-73 (the key needs
  `session_id`), E-74 (compaction discards injected context, per the reference).
- Keeps upheld with corrected backing: E-29 and E-42 (least privilege, not an owner rationale).
- Owner/engineering classification: agreed throughout, except E-80, which has an owner part (whether
  Max Cogar will supply CLI corrections).
