# Spec audit — part a (spec lines 1–276): adjudication

This file adjudicates between the first audit
`middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-a.md` (E-1 to E-85; keep 58,
replace 23, undetermined 4) and the second opinion
`middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-a-second-opinion.md` (54 judged;
keep 26, replace 28). The adjudicator wrote neither the spec nor either review. The rulings follow
`/tmp/claude-0/-home-user-agent-armory/779c0f74-86b0-5e8f-b02d-811e78ed3f66/scratchpad/audit/BRIEF.md`
and `…/audit/SPEC-BRIEF.md`; the spec is judged at `ec3b057`.

**What is ruled.** Every entry where the two reviews reach a different verdict, or where the
second opinion changes the fix or the backing: E-2, E-3, E-7, E-13, E-19, E-29, E-39, E-42, E-43,
E-45, E-50, E-52, E-53, E-58, E-59, E-70, E-72, E-73, E-74, E-77, E-80, E-84. Parts b and c's first
audits (`2026-09-29-spec-audit-b.md`, `2026-09-29-spec-audit-c.md`) were read where they judge the
same lines; where a ruling here differs from them, it says so under Evidence.

**Sources.** Every web source a ruling depends on was re-fetched with `curl` on 2026-09-29 into
`/tmp/claude-0/-home-user-agent-armory/779c0f74-86b0-5e8f-b02d-811e78ed3f66/scratchpad/specaudit/adj-a/`
(PDFs extracted with pdfminer), and every web quote below was matched against that fetch. Added
beyond the two reviews: the Claude Code context-window page
(`https://code.claude.com/docs/en/context-window.md`), for E-74.

**Sign-off rule.** Every spec change here is a change to a document Max Cogar signed. Under M38 it
goes to him before it replaces the old line, whether it is an owner decision or an engineering line
([[/tmp/claude-0/-home-user-agent-armory/779c0f74-86b0-5e8f-b02d-811e78ed3f66/scratchpad/audit/owner-messages.md@FILE:L757-L757]] "Because it's in a document you signed, the change comes to you before it replaces the old line."
and his reply [[/tmp/claude-0/-home-user-agent-armory/779c0f74-86b0-5e8f-b02d-811e78ed3f66/scratchpad/audit/owner-messages.md@FILE:L766-L766]] "okay then make a task list and get started").
"Owner question: none" below means the line is an engineering line: it reaches him only as a change
to approve, not as a decision for him to make.

### E-2
**Ruling:** Both reviews replace the status paragraph; the second opinion adds a third false claim,
and it is right. (1) The traceability sentence is false while D-4, D-9 and D-20 carry no reasoning
(first audit, unchallenged). (2) The sign-off must be stated with the condition the ledger records.
(3) "The blocking model was independently reviewed to convergence 2026-08-25" is stale: the
2026-08-25 record reviewed a model whose scenario was an agent that "goes off writing code", and it
dismissed the stopping agent as "the wrong scenario". On 2026-08-28 the answer-drift definition was
rebuilt on OL-C5 and that proxy dropped; OL-R5 rejects exactly that proxy. No review record in
`docs/reviews/` at `ec3b057` is dated 2026-08-26 to 2026-08-28, and none of the three 2026-08-25
records mentions OL-C5. So the paragraph presents a review of a superseded model as authority for
the current one.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L3-L6]] "the
blocking model was independently reviewed to convergence 2026-08-25"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L5-L6]] "Every requirement traces to a CONFIRMED owner decision"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L796-L796]] "The one in-tree write is `init` wiring"
- [[middleware/context-oracle/docs/reviews/2026-08-25-blocking-model-rebuild-6-rounds.md@ec3b057:L13-L16]] "which modeled the wrong scenario"
- [[middleware/context-oracle/docs/reviews/2026-08-25-blocking-model-rebuild-6-rounds.md@ec3b057:L16-L16]] "Max asks a question and the agent **goes off writing code** instead of answering."
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L60-L60]] "The answer-drift trigger scoped to **\"writing code,\"**"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L72-L72]] "He did not line-read the document"
- [[ran]] `git log --format='%h %ad %s' --date=short ec3b057 -- middleware/context-oracle/docs/specs/spec-context-oracle.md | grep acaf743` → `acaf743 2026-08-28 spec: rebuild answer-drift definition on Max's OL-C5, drop the "writing code" proxy`
- [[ran]] `git ls-tree -r --name-only ec3b057 middleware/context-oracle | grep -c "2026-08-2[6-8]"` → `0`
**Final verdict:** replace — the status paragraph states the sign-off with its recorded condition and replaces the stale convergence claim with the fact.
**Correct line:** "**Status:** spec of record for the whole tool (phases A/B/C are build order, §11.5); **signed off by Max Cogar 2026-08-28 without a line-by-line read (`OL-C6` — "good to go")**. The blocking model's 2026-08-25 review (`docs/reviews/2026-08-25-blocking-model-rebuild-6-rounds.md`) covered the superseded "goes off writing code" model (`OL-R5`); the model rebuilt on `OL-C5` on 2026-08-28 has no review record in `docs/reviews/`. Every requirement traces to a CONFIRMED owner decision (`OWNER-LEDGER.md`), a named and current-verified standard, or a recorded judgment (§12)." — the last sentence stays only once every D-n in §12 carries its reasoning (part c).
**Owner or engineering:** engineering line (status and provenance text); goes to Max Cogar under M38 as a change to his signed document.
**Owner question:** none

### E-3
**Ruling:** The two reviews agree on the verdict and the defects; the second opinion only makes
explicit what the first audit's reasoning already named (FR-O2's "preserved even if the tool call
later fails" clause). The ruling confirms both: the Illinois record gives CHI 2006, not the CHI 2007
§9 states; `[MSR]` is "verified" through a different paper; the FR-O2 clause is not on the hooks
page today. The blanket "every external source … was verified" is therefore false, and the correct
line keeps the sentence and makes it true by re-verifying the rows (parts b and c own those rows).
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L11-L12]] "Every external source in §9 was verified against its current primary/authoritative"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L568-L568]] "CHI 2007"
- [[https://experts.illinois.edu/en/publications/leveraging-characteristics-of-task-structure-to-predict-the-cost-]] "CHI 2006: Conference on Human Factors in Computing Systems - Montreal"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L559-L559]] "2026-08-25 (via HERZIG)"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L480-L481]] "that text is preserved even if the tool call later fails"
- [[ran]] `grep -c -i "preserved even if" hooks.md` (the page fetched with `curl -sSL https://code.claude.com/docs/en/hooks.md` on 2026-09-29 into the adjudication scratch folder) → `0`
**Final verdict:** replace — re-verify every §9 row against its primary record and correct it (`[CHI]` → CHI 2006; `[MSR]` given its own primary source; FR-O2's unsourced "preserved" clause removed), then state the new check date.
**Correct line:** "Every external source in §9 was verified against its current primary/authoritative source; the §9 "Verified" column records the date each was confirmed." — true after the §9 rows are corrected in parts b and c, with the new dates in that column.
**Owner or engineering:** engineering line; goes to Max Cogar under M38 as a change to his signed document.
**Owner question:** none

### E-7
**Ruling:** Both reviews replace the backing (`RETHINK.md` §2.4 is agent rationale with no
source). The second opinion's source is right and the first audit's is wrong. Liu et al. find
performance is highest when the relevant information is at the beginning or end of the context and
worst in the middle; a front-loaded briefing sits at the beginning, so the paper's position finding
does not show that a briefing decays as the session grows. What the line claims is that the model's
use of material already in context degrades as the context grows. Chroma's 18-model study says
exactly that, and Anthropic's context-engineering guidance states the same effect ("context rot").
The "full token cost regardless of what fraction is needed" clause is true by definition and stays.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L29-L30]] "decay in salience as the session grows (`RETHINK.md` §2.4)"
- [[middleware/context-oracle/RETHINK.md@ec3b057:L63-L65]] "delivered once, decays in salience as the session grows"
- [[middleware/context-oracle/CLAUDE.md@HEAD:L58-L59]] "agent-contaminated in places, so only"
- [[https://arxiv.org/abs/2307.03172]] "performance is often highest when relevant information occurs at the beginning or end of the input context"
- [[https://research.trychroma.com/context-rot]] "Our results reveal that models do not use their context uniformly; instead, their performance grows increasingly unreliable as input length grows."
- [[https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents]] "as the number of tokens in the context window increases, the model's ability to accurately recall information from that context decreases"
**Final verdict:** replace — back the salience claim with the context-rot evidence, not with `RETHINK.md` §2.4 and not with Liu et al.
**Correct line:** "Front-loaded "briefing" approaches pay their full token cost regardless of what fraction is needed and decay in salience as the session grows: a model's recall of material in its context degrades as the context grows `[CTX-ROT]`." — with a new §9 row `[CTX-ROT]`: Hong, Troynikov, Huber, *Context Rot: How Increasing Input Tokens Impacts LLM Performance*, Chroma technical report, 2025-07-14 (research.trychroma.com/context-rot); Anthropic, *Effective context engineering for AI agents* (anthropic.com/engineering); verified 2026-09-29.
**Owner or engineering:** engineering line; goes to Max Cogar under M38 as a change to his signed document.
**Owner question:** none

### E-13
**Ruling:** Both reviews replace the line; the ruling takes neither replacement wording as is.
(1) "Cannot surface from a cold checkout" overstates: a checkout with history lets the agent run
`git log`, and the spec's own premise two paragraphs up says the agent "does not consult" that
history, not that it cannot. (2) The first audit's "cannot cheaply surface" imports P5's
cheap-to-fetch test, which E-39 below replaces, so the two lines would disagree. (3) The second
opinion's "would not know to look for" is a stronger claim than the spec's premise and has no
source of its own. The correct line states the spec's premise ("does not consult at the moment it
decides") and names what makes the knowledge scarce with a source: ROSE shows mined co-change finds
coupling "undetectable by program analysis". (4) `RETHINK.md` §2.3 is not backing; Tricorder is
primary evidence that delivery outside the workflow, too late or too early, loses use. It is evidence
about human developers, so the line cites it as developer-tooling evidence, not as a measurement on
agents.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L59-L62]] "cannot surface from a cold checkout with its own tools"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L28-L28]] "from history and structure the agent does not consult at the moment it decides"
- [[https://thomas-zimmermann.com/publications/files/zimmermann-tse-2005.pdf]] "show up item coupling that is undetectable by program analysis"
- [[https://research.google.com/pubs/archive/43322.pdf]] "We have repeatedly found that when developers have to navigate to a dashboard or run a standalone command line tool, analysis usage drops off"
- [[https://research.google.com/pubs/archive/43322.pdf]] "Some tools displayed results too late, making developers less likely to fix problems after they had submitted their code"
- [[https://research.google.com/pubs/archive/43322.pdf]] "Others displayed results too early, while developers were still exper- imenting with their code in the editor"
**Final verdict:** replace — state the spec's own premise with ROSE and Tricorder as backing, in place of "cannot surface" and `RETHINK.md` §2.3.
**Correct line:** "**Why it is worth building.** The scarce, valuable knowledge is what the agent does not have and does not consult at the moment it decides: co-change coupling that is "undetectable by program analysis" `[ROSE]`, the historical landmine, the second write-site. Delivering it inside the agent's workflow at the decision point, and nowhere else, is what gets it used: developer tools that made users leave their workflow, or showed results too late or too early, fell out of use `[TRICORDER]`."
**Owner or engineering:** engineering line; goes to Max Cogar under M38 as a change to his signed document.
**Owner question:** none

### E-19
**Ruling:** Both reviews find the same defect and add a `Stop` block; they differ on how it re-applies
and what text it reads. The ruling settles the three questions put to it.
1. *The defect.* OL-C5 covers any next move. After Max's question the agent can call a tool that is
   not answer-directed, or end its turn without answering. The spec's only mechanism is a
   `PreToolUse` deny, and a text turn "is never denied", so the second case is left to a best-effort
   whisper and to Max re-asking — the "agent silently ends its turn" case OL-R5 refused to let the
   spec scope out. A `Stop` hook's `decision: "block"` "prevents Claude from stopping", which is
   what OL-C3 asks for. It fires only after the agent has ended its turn with the question open, so
   it is reactive, not the pre-emptive gate (OL-3 as clarified, OL-C2, CLAUDE.md); it is one hook on
   one condition. Both reviews are right that it is required.
2. *How it re-applies, and what bounds it.* The first audit (and part b's E-26) bound it "by
   `stop_hook_active`". If that means release once `stop_hook_active` is true, the block lasts one
   continuation and then lets the agent stop with the question still open — a one-cycle narrowing of
   OL-C3's "until it stops ignoring me and actually answers". The reference tells a hook to check
   `stop_hook_active` "or process the transcript to avoid blocking on a condition that will never
   resolve". An open question resolves the moment the agent writes an answer, and a text answer is
   always available to it, so the correct rule is to re-evaluate the condition at every `Stop` and
   re-apply while the question is open. What bounds it: (a) the release condition itself — the
   agent's next final message is read at the next `Stop`, so an answer releases it at once; (b) the
   harness's consecutive-continuation cap, which "overrides the next block and ends the turn" after
   eight continuations — the outer bound on a misfiring recognizer, which the oracle must not raise
   (the reference documents an environment variable that raises it); (c) visibility — a repeat
   (`stop_hook_active` true) feeds FR-M4's deny-loop signal and a cap-hit with the question still
   open is an FR-M2 fault shown in `status`, so a wrongful hold is seen, not silent. `Stop` does not
   run on a user interrupt, so Max can always break in. That is neither a one-cycle bound nor an
   unbounded loop.
3. *What text it reads.* `last_assistant_message` holds "Claude's final response", and the reference
   says to use it because "the transcript file isn't guaranteed to include the final message at
   Stop time". But the final message alone misses an answer given in an earlier text message of the
   same turn, followed by more work; judging only it would hold a complying agent. So the judgment
   reads all assistant text since the question: the final message from `last_assistant_message`,
   earlier messages from the oracle's own record of assistant text (the `MessageDisplay` event fires
   for every assistant message that streams text) or from the transcript, which may lag. Text not yet
   visible is FR-B1's lag window: the block holds, and the hold self-recovers because the agent's
   next final message is read at the next `Stop`. The clear posture is FR-B5's (a substantive answer
   clears; an empty deferral does not). The second opinion's "earlier text from the transcript"
   ignores the transcript lag for the current turn; the ruling leaves the collection mechanism to the
   architect with that caveat stated.
4. *Classification.* The rule is Max Cogar's (OL-C3, OL-C5); the mechanism is engineering.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L75-L76]] "via a reactive `PreToolUse` deny of the agent's"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L369-L370]] "A text turn is never a tool action, so it is never denied"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L427-L427]] "is the recourse for every uncaught case"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L71-L71]] "if i ask a question and their next move isnt a direct answer or them taking actions to provide an answer, then then need corrected"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L69-L69]] "the oracle should block that motherfucker until it stops ignoring me and actually answers. just dont make a convoluted fucked up way that its done."
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L60-L60]] "define the block positively, never by exclusion"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L41-L41]] "What he rejected is the *pre-emptive* gate"
- [[middleware/context-oracle/CLAUDE.md@HEAD:L174-L175]] "no deny before the agent has actually deviated"
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-a.md@HEAD:L297-L297]] "bounded by `stop_hook_active` and the harness continuation cap"
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-b.md@HEAD:L392-L392]] "judged from `last_assistant_message` and bounded by `stop_hook_active`"
- [[https://code.claude.com/docs/en/hooks.md]] "\"block\" prevents Claude from stopping. Omit to allow Claude to stop"
- [[https://code.claude.com/docs/en/hooks.md]] "Runs when the main Claude Code agent has finished responding. Does not run if the stoppage occurred due to a user interrupt."
- [[https://code.claude.com/docs/en/hooks.md]] "Check this value or process the transcript to avoid blocking on a condition that will never resolve"
- [[https://code.claude.com/docs/en/hooks.md]] "after stop hooks have continued the turn eight times in a row, Claude Code overrides the next block and ends the turn"
- [[https://code.claude.com/docs/en/hooks.md]] "To raise the cap, set"
- [[https://code.claude.com/docs/en/hooks.md]] "The last_assistant_message field contains the text content of Claude's final response"
- [[https://code.claude.com/docs/en/hooks.md]] "the transcript file isn't guaranteed to include the final message at Stop time on all versions"
- [[https://code.claude.com/docs/en/hooks.md]] "may not yet include the current turn's most recent messages when a hook fires"
- [[https://code.claude.com/docs/en/hooks.md]] "fires for every assistant message that streams text"
**Final verdict:** replace — the answer-drift block covers both kinds of next move: a non-answer-directed tool action (`PreToolUse` deny) and a turn that ends unanswered (`Stop` block that re-applies while the question is open, bounded by the answer and the harness cap).
**Correct line:** "**Answer-drift block `[OL-C3, OL-C5]`:** Max's rule (OL-C5): after Max asks a question, the agent's next move must be a **direct answer** or **an action taken to provide that answer**; if it is neither, the oracle blocks that move until the agent answers. A non-answer-directed tool action is denied at `PreToolUse` (`permissionDecision: "deny"`, reason "answer Max's question first: `<q>`"). A turn that ends with the question still unanswered is blocked at `Stop` (`decision: "block"`, same reason), which prevents the stop and continues the turn. The `Stop` block is re-evaluated at every `Stop` and re-applies while the question stays open; it releases as soon as the agent's text answers it. Its outer bound is the harness's consecutive-continuation cap, which the oracle never raises; each repeat feeds the deny-loop signal (FR-M4), and a cap-hit with the question still open is a self-detected fault (FR-M2) shown in `status`. Whether the question is answered is judged on all assistant text since the question — the final message from `last_assistant_message`, earlier messages from the oracle's record of assistant text or the transcript (which may lag) — with FR-B5's clear-on-a-substantive-answer posture; text not yet visible is the lag window, where the block holds (FR-B1, D-41). Actions taken to provide the answer (reading, searching, running a test/build to get the answer) run freely. OL-C3 confirms the block (*"block that motherfucker until it stops ignoring me and actually answers. just dont make a convoluted fucked up way that its done."*); OL-C5 is its definition." — the skill non-conformance bullet (L84–91) is unchanged.
**Owner or engineering:** engineering line (the mechanism; the rule is Max Cogar's and is unchanged); goes to Max Cogar under M38 as a change to his signed document. Part b's E-26/E-27 (§8, FR-B1) and part c's AC-2a/AC-8a follow this line, including dropping "bounded by `stop_hook_active`" as a release condition.
**Owner question:** none

### E-29
**Ruling:** Both reviews keep the line; they differ on its backing, and the second opinion is right.
The first audit backs "never mutates the repo" with "OL-3's confirmed rationale", but that sentence
is agent-written `RETHINK.md` §12.3 text (the "Corollary" after "The owner's explicit position"),
not the ledger's OL-3 row; the ledger row confirms "No hard blocks", clarified as aimed at the
generated-file block; the same corollary's "never prevents an action" was itself superseded; and
CLAUDE.md makes only ledger CONFIRMED authoritative because RETHINK is agent-contaminated. The line
is an engineering decision (`[D-9]`). Its real backing is least privilege: the oracle observes and
injects context, which needs read access to the tree and no write, except the one write that wiring
it into Claude Code may need. OWASP LLM06 states the principle for components of LLM applications.
The line permits, and does not require, the in-tree wiring (user-scope settings would satisfy it
too), so it grants no more than that.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L115-L116]] "except the hook-wiring `ctxoracle init`"
- [[middleware/context-oracle/RETHINK.md@ec3b057:L326-L327]] "it never mutates the repo and never prevents an action"
- [[middleware/context-oracle/RETHINK.md@ec3b057:L330-L331]] "Superseded in part by the owner, 2026-08-16"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L41-L41]] "not as a literal ban on everything"
- [[middleware/context-oracle/CLAUDE.md@HEAD:L58-L60]] "agent-contaminated in places, so only"
- [[https://genai.owasp.org/llmrisk/llm062025-excessive-agency/]] "Limit the permissions that LLM extensions are granted to other systems to the minimum necessary in order to limit the scope of undesirable actions."
**Final verdict:** keep — the line stands; its backing is least privilege (OWASP LLM06) and the derivation above, which D-9's §12 entry must record (part c), not an owner rationale.
**Correct line:** unchanged
**Owner or engineering:** engineering line (`[D-9]`); no change to the line, so nothing goes to Max Cogar for it. The backing is written into D-9 in part c, which does go to him under M38.
**Owner question:** none

### E-42
**Ruling:** Same decision as E-29 stated as principle P8; the same correction of backing applies.
Both reviews keep it.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L147-L147]] "The repository tree stays pristine"
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-a.md@HEAD:L600-L600]] "**Standard:** OL-3's confirmed rationale."
- [[https://genai.owasp.org/llmrisk/llm062025-excessive-agency/]] "Limit the permissions that LLM extensions are granted to other systems to the minimum necessary in order to limit the scope of undesirable actions."
**Final verdict:** keep — backed by least privilege, as E-29, not by OL-3.
**Correct line:** unchanged
**Owner or engineering:** engineering line (`[D-9]`); nothing to change here.
**Owner question:** none

### E-39
**Ruling:** The first audit rules P5 undetermined (its correct line would need evidence on whether
agents fetch one-grep facts); the second opinion replaces it. The second opinion is right, and the
replacement line can be written from the spec's own requirements without new data.
1. P5's backing, `RETHINK.md` §2.3, argues against handing agents "thousands of tokens" of
   front-loaded material and rests on the unsourced "Modern agents grep, glob, and read well", which
   the spec's own §1 ("Coding agents under-read the codebase") contradicts. Carried over to a
   one-fact whisper it backs a neighbouring decision, not this one (brief test item 4).
2. The test "a fact one `grep` returns is not a whisper" cannot be applied as written: one grep
   returns a fact only to an agent that already knows the query. The spec's own Reuse headline ("the
   canonical helper is `X`; most call sites use it") is one `grep X` away for an agent that knows `X`
   and out of reach for one that does not; read literally, P5 silences it.
3. The spec already states the decidable test. FR-A1 asks whether the agent "almost certainly does
   not" know the fact and would change what it does next; FR-A4 defines what a consumer has (its
   read-set and delivered-set); AC-1 already rejects the name-evident pair. A fact is self-serve when
   the consumer already has it or it is evident from what is in front of it.
4. The first audit's missing measurement does not decide the line. If agents do fetch such a fact
   first, it is in the read-set and dedup suppresses it; if they do not, the whisper is the value. A
   whisper the agent would have fetched a moment later is a false fire, which the loop measures
   (FR-L3, FR-M4) — that sets the noise rate, which is Phase A data, not the requirement.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L140-L142]] "a fact one `grep` returns is"
- [[middleware/context-oracle/RETHINK.md@ec3b057:L54-L55]] "Handing them thousands of tokens of"
- [[middleware/context-oracle/RETHINK.md@ec3b057:L54-L54]] "Modern agents grep, glob, and read well."
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L24-L24]] "Coding agents under-read the codebase"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L167-L167]] "the canonical helper is `X`; **most call sites use it**"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L179-L181]] "do I know something it almost certainly does not that would"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L222-L222]] "A per-consumer **delivered-set** and **read-set**"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L920-L922]] "a coupling whisper about an obvious same-directory,"
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-a.md@HEAD:L565-L565]] "the correct line needs evidence on whether agents obtain one-grep facts before deciding"
**Final verdict:** replace — P5's test becomes "the consumer does not already have it and it would change the next decision", replacing the "one grep" test.
**Correct line:** "**P5 — Marginal value decides worth.** The oracle speaks a fact only when that consumer does not already have it — it is not in the consumer's read-set or delivered-set (FR-A4) and is not evident from what is in front of it (the result of its own triggering action, a name-evident pairing such as a same-directory, same-name file) — and it would change the consumer's next decision (FR-A1). Whether one search would return the fact is not the test: a search is cheap only for an agent that already knows what to search for."
**Owner or engineering:** engineering line; goes to Max Cogar under M38 as a change to his signed document. Consequences: E-45 and E-77 follow it; the P5-based reasons in FR-A2d ("grep-able") and FR-A2g ("self-evident"), and AC-1, AC-1c and AC-8, must be restated against this test (a test's run-state is already held by the agent; a raw call-site count needs its own reason).
**Owner question:** none

### E-43
**Ruling:** Both reviews replace P9 and agree that "is the recurring failure this project exists to
prevent", tagged `[OL-C2]`, is not in OL-C2 — an agent's superlative around his words (the OL-R2
shape) that over-generalises one statement into the project's purpose (OL-C7). They differ on the
history: the first audit drops it, the second opinion keeps it. The second opinion is right that
OL-C7 asks for situational specifics to be kept, and OL-C2 does record one in his words: in the
earlier 3 or 4 attempts, agents over-focused on the gate feature. But its wording "is what sank the
earlier 3–4 attempts" is itself a paraphrase stronger than his words (he said the gate work "was
terrible and didnt work", not that it sank the attempts). The correct line quotes him.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L148-L150]] "is the recurring failure this project exists to"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L68-L68]] "the other 3 or 4 times I tries building this the agents kept putting way too much focus on that parts and got absolutely fucking obsessed with \"gates\""
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L68-L68]] "literally every bit if it was terrible and didnt work"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L68-L68]] "THIS IS NOT THE PRINARY ROLE OF THE ORACLE, NOR WOULD I EVEN CONSIDER IT A PRIMARY FEATURE"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L50-L50]] "the no-primary-feature principle is held by the mission and OL-C2"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L57-L57]] "an agent's superlative wrapped around your quote"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L73-L73]] "must carry its actual situational specifics"
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-a-second-opinion.md@HEAD:L362-L362]] "is what sank the earlier 3–4 attempts"
**Final verdict:** replace — P9 keeps the no-primary principle and OL-C2's own words and history, and drops the agent's superlative.
**Correct line:** "**P9 — No feature is primary:** relevance is per fact, by decision impact, not by genre (mission; OL-12 row). The corrective/skill feature is, in Max Cogar's words, *"JUST A SMALL FEATURE FOR MY OWN PERSONAL BENEFIT"* and *"NOT THE PRINARY ROLE OF THE ORACLE"*; in his earlier 3 or 4 attempts *"the agents kept putting way too much focus on that parts and got absolutely fucking obsessed with "gates""* `[OL-C2]`."
**Owner or engineering:** owner decision — goes to Max Cogar with the ledger's exact words (OL-C2 row, quoted above; OL-12 row: "the no-primary-feature principle is held by the mission and OL-C2").
**Owner question:** The spec's "no feature is primary" rule currently says that making any feature the main one "is the recurring failure this project exists to prevent", and credits that to you. You never said that. We want to replace it with only your own words: that the skill-steering feature is "JUST A SMALL FEATURE FOR MY OWN PERSONAL BENEFIT", and that in your earlier 3 or 4 tries "the agents kept putting way too much focus on that parts and got absolutely fucking obsessed with "gates"". Is that the right way to put it?

### E-45
**Ruling:** The first audit rules the §4 intro undetermined because its headline rule follows P5;
the second opinion replaces it. With P5 settled (E-39), the headline rule follows: each whisper is
headlined by the fact that consumer does not already have. The `[RSSE]` clause is a separate defect.
The fetched RSSE pages are abstracts only (the chapters are paywalled): chapter 1 defines a
recommendation system in software engineering as software that provides "information items
estimated to be valuable for a software engineering task in a given context"; chapter 9 is about
delivering recommendations so users notice, judge and act on them. Neither accessible text contains
push/pull material (every "push" match in the chapter 9 page is a JavaScript `.push(` call),
and neither grounds this genre set, so "Grounded as a push-mode recommendation surface" claims more
than the source was checked to say. The oracle is push-mode by the mission's own words ("without
being asked"); RSSE supports the framing and the delivery property. The second opinion's fix (cite
RSSE only for delivery) is right as far as it goes; the correct line also keeps the push property,
sourced to the mission.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L156-L158]] "fact the agent could not cheaply get itself"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L157-L158]] "push-mode recommendation surface `[RSSE]`"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L564-L564]] "push vs pull recommenders"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L34-L35]] "at the moment of"
- [[https://link.springer.com/chapter/10.1007/978-3-642-45135-5_1]] "software applications that provide information items estimated to be valuable for a software engineering task in a given context"
- [[https://link.springer.com/chapter/10.1007/978-3-642-45135-5_9]] "the recommendations must be delivered with a user interface that allows the user to become aware that recommendations are available"
- [[ran]] `grep -o -i "push" rsse.html | wc -l; grep -o "dataLayer.push(\|w\[l\].push(" rsse.html | wc -l` (the chapter 9 page fetched with `curl -sSL` on 2026-09-29; every match is a JavaScript call) → `11` / `11`
**Final verdict:** replace — the headline rule follows the new P5, and `[RSSE]` is cited for what its accessible text says.
**Correct line:** "Each **whisper** genre is keyed to an observed intent signal and, per P5, is **headlined by the fact that consumer does not already have and that would change its next decision**. No genre is primary (P9). The oracle pushes each whisper unrequested (mission: "without being asked"); a whisper is a recommendation in the RSSE sense — an information item estimated to be valuable for the task in its context — delivered so the agent can notice it, judge it and act on it `[RSSE]`." — the rest of the paragraph (the two block rows) unchanged; §9's `[RSSE]` row is corrected to cite chapters 1 and 9 for these two points, not "push vs pull" (part c).
**Owner or engineering:** engineering line; goes to Max Cogar under M38 as a change to his signed document.
**Owner question:** none

### E-50
**Ruling:** Both reviews replace "about to run": `PreToolUse` context is added "alongside the tool
result" and read on the next model request, and delivering before the edit would take a deny, the
pre-emptive gate. They differ on writing "(`PreToolUse`)" into the line. The second opinion is
right to leave it out. FR-O1 makes the event-to-genre mapping the architect's, and the event choice
carries a case the line must not hide: a permission denial also fires `PreToolUse`, and the settled
branch-audit test shows the hook's context then reaches the model next to the denial, so a
`PreToolUse`-bound Consequence whisper can arrive for an edit that never ran; `PostToolUse` avoids
that but fires only after the call. The requirement is the timing property; which event carries it,
and what the whisper says when the edit was denied, is the architect's to decide and record.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L168-L168]] "An edit / write about to run"
- [[https://code.claude.com/docs/en/hooks.md]] "String added to Claude's context alongside the tool result"
- [[https://code.claude.com/docs/en/hooks.md]] "Permission denials fire PreToolUse"
- [[middleware/context-oracle/docs/reviews/2026-09-28-branch-audit-hook-context-permission-denial.md@HEAD:L41-L42]] "A permission-rule denial fires `PreToolUse`,"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L216-L217]] "the event-to-genre mapping and which of the ~31 hook events are wired is architecture"
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-a.md@HEAD:L715-L715]] "Fires on an edit/write (`PreToolUse`)"
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-c.md@HEAD:L799-L799]] "computed at the edit's `PreToolUse`"
**Final verdict:** replace — the row states when the whisper reaches the agent, and leaves the event to the architecture.
**Correct line:** "| **FR-A2d Consequence** | An edit / write | The non-obvious blast radius: **historically-coupled tests** this edit tends to break, and a vendored/build-**zone** flag, reaching the agent with the edit's result, at its next decision (keep, revise, run the coupled tests) `[HOOKS]`; the carrying event, and the handling of a denied edit, are the architect's (FR-O1). (A raw call-site count never stands alone as the whisper; the headline is the coupled tests, per P5.) |" — "grep-able" is dropped as the reason because E-39 replaces the one-grep test.
**Owner or engineering:** engineering line; goes to Max Cogar under M38 as a change to his signed document. Part c's E-53 (AC-1c) writes `PreToolUse` into the criterion; it should follow this line.
**Owner question:** none

### E-52
**Ruling:** The first audit keeps FR-A2f; the second opinion replaces its trigger, and is right. The
row fires on "Edit completed / stop", but FR-B4 says Completeness fires "when the agent claims done"
and AC-1d tests delivery "at the stop via a single self-releasing Stop-time injection", so the row
contradicts two other lines (brief test item 6). The edit-completed trigger is also wrong on its
merits: "you changed the reducer but not the selector" after one edit is premature, because the
agent may be about to change the selector; Tricorder records tools that showed results "too early,
while developers were still experimenting" falling out of use. Pairing facts before the partner edit
are FR-A2b's job at read time. ROSE backs the content of the row, which stays.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L170-L170]] "| **FR-A2f Completeness** | Edit completed / stop |"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L406-L408]] "completion-check (FR-A2g) and Completeness (FR-A2f) fire when the agent claims done"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L932-L935]] "delivered at the stop via a single self-releasing Stop-time injection"
- [[https://research.google.com/pubs/archive/43322.pdf]] "Others displayed results too early, while developers were still exper- imenting with their code in the editor"
- [[https://thomas-zimmermann.com/publications/files/zimmermann-tse-2005.pdf]] "can prevent errors due to incomplete changes"
**Final verdict:** replace — FR-A2f fires on a recognized completion-claim stop, matching FR-B4 and AC-1d.
**Correct line:** "| **FR-A2f Completeness** | A recognized completion-claim stop (FR-B4) | "You changed the reducer but not the selector it pairs with in 9 of its last 10 changes." |"
**Owner or engineering:** engineering line; goes to Max Cogar under M38 as a change to his signed document.
**Owner question:** none

### E-53
**Ruling:** Both reviews replace the done-claim recognizer's lean ("errs toward not firing") with a
lean toward firing, and agree its stated reasons do not support it (P5 is about the fact's
marginal value, not recognizer error; a whisper is not the ritual P3 bars). The second opinion
corrects two parts of the fix, and both corrections hold. (1) The false-fire cost is not "one
advisory sentence": a Stop-time injection continues the turn ("The conversation continues so Claude
can act on it"), so a false fire on an ordinary stop costs one forced continuation. That is still
small and bounded to one cycle (FR-B4), against a miss that lets an unverified done-claim through —
the failure OL-12 names a must-have to catch — so by the spec's own cost-function method the lean
toward firing stands. (2) "Demoted by the loop (P7)" names a mechanism Phase A does not have
(automated demotion is Phase C); in Phase A the false-fire rate is recorded and reported.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L171-L171]] "errs toward not firing"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L171-L171]] "(P5, no ceremony)"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L50-L50]] "having the oracle speak when an agent claims it's done is a must-have feature in my mind"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L431-L431]] "Each block's precision is calibrated to its own cost function."
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L412-L415]] "the oracle injects
  the fact **once**"
- [[https://code.claude.com/docs/en/hooks.md]] "The conversation continues so Claude can act on it"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L254-L255]] "automated demotion/promotion is Phase C"
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-a.md@HEAD:L759-L759]] "a false fire delivers a true fact once and releases"
**Final verdict:** replace — the recognizer leans toward firing when a covering test exists and was not run, with its real false-fire cost and its Phase A measurement stated.
**Correct line:** "(The completion-claim **recognizer** reads `last_assistant_message` `[HOOKS]` and classifies done-claim vs ordinary stop — a classification with false-fire/miss modes that **errs toward firing** when a covering test exists and was not run: a false fire costs one Stop-time continuation carrying a true fact (FR-B4), while a miss lets an unverified done-claim pass, the failure OL-12 requires the oracle to catch. Its false-fire rate is recorded and reported (FR-M1, FR-M4); automated demotion is Phase C (P7). Whether it is a deterministic heuristic (Phase A) or model-assisted (Phase B) is the architect's `[D-38]`.)" — the rest of the FR-A2g row unchanged.
**Owner or engineering:** engineering line (`[D-38]`); goes to Max Cogar under M38 as a change to his signed document. D-38 (part c) and FR-B4's outstanding-question limit (a) (part b) follow it.
**Owner question:** none

### E-58
**Ruling:** Both reviews agree on the defects: "Max cannot see a skipped step himself (OL-11)" puts
on OL-11 a claim OL-11 does not make, and whether a "full-investment", most-machinery-heavy
mechanism fits his "JUST A SMALL FEATURE" is a scope call for Max Cogar. They differ on the fix. The
first audit's "state it as an engineering premise with evidence or drop the detector's
justification" is two options, not a line, and dropping the justification would leave a mechanism
with none. The second opinion's derivation is the correct line: OL-11 assigns verification to the
agents, so checking whether an agent followed a skill step is agents' work, and the design may not
rest on Max Cogar noticing a skipped step. That justifies an automated under-fire guard without
claiming anything about his abilities. The answer-drift guard differs on purpose (an unanswered
question of his own needs no technical check), which stays consistent with this.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L176-L176]] "Max cannot see a skipped step himself (OL-11)"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L176-L176]] "block-precision still gets full investment"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L49-L49]] "design/build/verification/docs/roadmap are the agents'"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L68-L68]] "BUT I CANNOT STRESS ENOUGG THAT THIS IS JUST A SMALL FEATURE FOR MY OWN PERSONAL BENEFIT"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L680-L681]] "It is the most machinery-heavy"
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-a.md@HEAD:L825-L825]] "state it as an engineering premise with evidence or drop the det"
**Final verdict:** replace — the detector's justification is derived from OL-11's assignment of verification to the agents, not attributed to Max Cogar's abilities; whether the detector belongs in a "small feature" goes to him.
**Correct line:** "… Errs toward restraint (a wrongful mid-skill halt is disruptive), so its under-fire side carries an **automated missed-skill-block detector** that checks each step's observable post-condition directly (FR-B5, FR-C1, FR-C4): checking whether an agent followed a skill step is verification, which OL-11 assigns to the agents, so a skipped step must be caught without relying on Max Cogar to notice it. **Non-primary** — fires sparingly and holds no precedence over any genre (OL-C2, P9); block-precision still gets full investment (FR-B5, §11.4)." — the last clause and the detector itself stand only if Max Cogar answers the owner question below "yes".
**Owner or engineering:** both. The justification is an engineering line (goes to Max Cogar under M38). Whether the automated detector and "full investment" belong in this feature is an owner decision — goes to Max Cogar with the ledger's exact words (OL-C2: "BUT I CANNOT STRESS ENOUGG THAT THIS IS JUST A SMALL FEATURE FOR MY OWN PERSONAL BENEFIT!!!!! THIS IS NOT THE PRINARY ROLE OF THE ORACLE, NOR WOULD I EVEN CONSIDER IT A PRIMARY FEATURE!!!!").
**Owner question:** You said the skill-steering feature is "JUST A SMALL FEATURE FOR MY OWN PERSONAL BENEFIT". The spec gives it the most machinery of anything in the tool, including an automatic checker that looks for skill steps the agent skipped, so you never have to spot them yourself. Do you want that automatic checker built (more work, and it catches skipped steps without you), or do you want the skill feature kept smaller without it?

### E-59
**Ruling:** The same defect as E-19 in the §4 row: the action column realises OL-C5 only for tool
actions. Both reviews add the `Stop` block; the row takes E-19's ruling on how it re-applies and
what text it reads. The provenance note (OL-9 superseded by OL-C3/OL-C5) matches the ledger and
stays.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L177-L177]] "**Denies that non-answer-directed action** (`PreToolUse`)"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L71-L71]] "if i ask a question and their next move isnt a direct answer or them taking actions to provide an answer, then then need corrected"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L47-L47]] "superseded in part by OL-C2/OL-C3 (2026-08-16)"
- [[https://code.claude.com/docs/en/hooks.md]] "\"block\" prevents Claude from stopping. Omit to allow Claude to stop"
**Final verdict:** replace — the row adds the `Stop` block for a turn that ends unanswered, worded as E-19's correct line.
**Correct line:** "| **FR-A2l Answer-drift → BLOCK** | Max asked a question and the agent's next move is **not** a direct answer or an action taken to provide the answer `[OL-C5]` | **Blocks that move** until the agent answers: a non-answer-directed tool action is denied (`PreToolUse`), and a turn that ends with the question unanswered is blocked from stopping (`Stop` `decision: "block"`), each with "answer Max's question first"; the `Stop` block re-applies while the question stays open, is bounded by the harness continuation cap, and judges all assistant text since the question (§8, FR-B1). Actions taken to provide the answer (reading, searching, running a test/build to get the answer) run freely `[OL-C3, OL-C5]` (§8, FR-B1). Entered scope *advisory* under OL-9; OL-C3 (2026-08-16) superseded that and made it a block, OL-C5 (2026-08-25) defines it — authorised by OL-C3/OL-C5, not OL-9. |"
**Owner or engineering:** engineering line (the mechanism; the rule is Max Cogar's); goes to Max Cogar under M38 as a change to his signed document.
**Owner question:** none

### E-70
**Ruling:** Both reviews replace "the edit it is about to run", for E-50's reason. They differ on one
word. The first audit's "the edit it has just made" is false for a denied edit, whose `PreToolUse`
context also reaches the model (E-50); the second opinion's "attempted" is true whichever event the
architect binds and whether the edit ran or was denied. The trigger-as-relevance design and the
D-18 clause stand.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L211-L211]] "the edit it is about to run"
- [[https://code.claude.com/docs/en/hooks.md]] "String added to Claude's context alongside the tool result"
- [[https://code.claude.com/docs/en/hooks.md]] "Permission denials fire PreToolUse"
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-a.md@HEAD:L982-L982]] "the edit it has just made"
**Final verdict:** replace — "the edit it has just attempted (its whisper arrives with the edit's result)".
**Correct line:** "… the file it opened, the symbol it searched, the edit it has just attempted (its whisper arrives with the edit's result), the completion it claimed (§4). …" — rest of the paragraph unchanged.
**Owner or engineering:** engineering line; goes to Max Cogar under M38 as a change to his signed document.
**Owner question:** none

### E-72
**Ruling:** Both reviews replace FR-O5's backing: `[CHI]` measures human resumption lag (an analogy
at most, not backing for an LLM agent) and is misdated (CHI 2006). They differ on the replacement.
The first audit's "`[HOOKS]` (context enters only where a hook fired)" implies the harness gives an
idle timer no channel; it does have one: an `asyncRewake` hook "wakes Claude immediately even when
the session is idle". So the harness does not rule idle-time speech out, and the property needs its
own reason. The second opinion's reason is the mission's: a decision is made only while the agent is
working, which is when a lifecycle event of its work fires; a whisper to an idle session reaches no
decision, and a rewake would start a turn Max Cogar did not ask for. Both reviews leave `[CHI]` as
"if kept, as an analogy" — two options, not a line. An analogy is not backing (brief test item 4),
so the correct line drops `[CHI]` from FR-O5; whether §9 keeps the row for any other use is part b's
(its first audit, E-59, already calls it "background only").
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L219-L219]] "Task-boundary intervention only; no idle timers"
- [[https://experts.illinois.edu/en/publications/leveraging-characteristics-of-task-structure-to-predict-the-cost-]] "users were interrupted during task execution at various boundaries to collect a large sample of resumption lag values"
- [[https://experts.illinois.edu/en/publications/leveraging-characteristics-of-task-structure-to-predict-the-cost-]] "CHI 2006: Conference on Human Factors in Computing Systems - Montreal"
- [[https://code.claude.com/docs/en/hooks.md]] "an asyncRewake hook that exits with code 2 wakes Claude immediately even when the session is idle"
- [[https://code.claude.com/docs/en/hooks.md]] "If the session is idle, the response waits until the next user interaction"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L34-L35]] "at the moment of"
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-b.md@HEAD:L888-L888]] "background only"
**Final verdict:** replace — FR-O5 is backed by the mission and states the rewake case; `[CHI]` is dropped from it.
**Correct line:** "**FR-O5 — Task-boundary intervention only; no idle timers.** The oracle speaks only on a lifecycle event of the agent's own work, where a decision is being made (mission: "at the moment of that decision"); it never wakes an idle session, although the harness would allow it (`asyncRewake`) `[HOOKS]`."
**Owner or engineering:** engineering line; goes to Max Cogar under M38 as a change to his signed document.
**Owner question:** none

### E-73
**Ruling:** Both reviews replace the key "`agent_id`/`agent_type`": `agent_type` is shared by every
subagent of a type and is also present on the main thread under `--agent`, so it cannot identify a
consumer; `agent_id` identifies a subagent and is absent on the main thread. The second opinion adds
the session, and is right. The per-project store is shared by every session on the repository
(OL-6), and every main agent lacks an `agent_id`, so keyed by `agent_id` alone two sessions' main
agents would share one delivered-set and read-set and suppress each other's whispers (FR-A4/FR-D5),
and a new session's `startup` clean would wipe an older session's sets. Every hook input carries
`session_id`.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L220-L221]] "keyed by `agent_id`/`agent_type`"
- [[https://code.claude.com/docs/en/hooks.md]] "Unique identifier for the subagent. Present only when the hook fires inside a subagent call"
- [[https://code.claude.com/docs/en/hooks.md]] "Present when the session uses --agent or the hook fires inside a subagent"
- [[https://code.claude.com/docs/en/hooks.md]] "Current session identifier"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L44-L44]] "Two stores — per-project and per-user global"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L223-L224]] "`clear`/`startup` (clean)"
**Final verdict:** replace — the consumer key is `session_id` plus `agent_id`.
**Correct line:** "**FR-O6 — Per-consumer delivery**, keyed by `session_id` and `agent_id` (no `agent_id` ⇒ that session's main agent); `agent_type` is descriptive only `[HOOKS, OL-8, D-16]`. FR-A4's `resume`/`fork` reconciliation carries a consumer's sets across session ids."
**Owner or engineering:** engineering line; goes to Max Cogar under M38 as a change to his signed document.
**Owner question:** none

### E-74
**Ruling:** Both reviews replace FR-A4's `compact` rule ("clear read-set" only), because keeping the
delivered-set across compaction suppresses a fact the agent no longer holds. The ruling settles how
far the second opinion's source reaches.
1. *The `SubagentStart` sentence.* "After auto-compaction discards that copy, Claude Code injects the
   next run's context again" is about one thing: the copy of a `SubagentStart` hook's context held
   in a subagent's context, after that subagent auto-compacts. It is evidence for that copy only. On
   its own it does not show what compaction does to other injected context (a `PostToolUse` or
   `PreToolUse` whisper), nor to the main session's context; the second opinion's "Injected context
   does not survive compaction", drawn from it, generalises past what it says.
2. *What does establish the premise.* The Claude Code context-window page, which describes the main
   conversation's compaction, lists "Context that hooks added earlier" as "Summarized with the rest of
   the conversation", and says Claude Code re-reads up to five recently modified files it had read or
   edited. So after compaction the agent holds a summary, which may or may not retain a given whisper
   or file content, plus up to five re-read files. The first audit's derivation holds on this
   source, not on the `SubagentStart` sentence. `PostCompact` exposes the summary, so reconciling
   against it is feasible; resume replays injected text, so reseeding there stays right.
3. *The fix.* The first audit offers "clear … or reconcile" (two options); the second opinion states
   the property and calls clearing one way to meet it. The correct line states the property only:
   after compaction the sets hold what the compacted context still carries. Clearing both sets never
   suppresses a dropped fact, but it repeats what the summary or a re-read file still carries, so it
   is an implementation trade-off for the architect to record, not the requirement. Part c's D-20
   and AC-5 ("cleared") should state and test the property: a fact the summary dropped is delivered
   again when next relevant.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L223-L224]] "reconciled across `resume`/`fork` (reseed) / `compact` (clear read-set) /"
- [[https://code.claude.com/docs/en/hooks.md]] "discards that copy, Claude Code injects the next run's context again"
- [[https://code.claude.com/docs/en/context-window.md]] "Context that hooks added earlier | Summarized with the rest of the conversation"
- [[https://code.claude.com/docs/en/context-window.md]] "Files Claude read or edited | Claude Code re-reads up to five, most recently modified first"
- [[https://code.claude.com/docs/en/hooks.md]] "The compact_summary field contains the conversation summary generated by the compact operation"
- [[https://code.claude.com/docs/en/hooks.md]] "Claude Code replays the saved text rather than re-running the hook for past turns"
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-a-second-opinion.md@HEAD:L646-L646]] "Injected context does not survive compaction"
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-c.md@HEAD:L944-L944]] "both the read-set and the delivered-set are cleared"
**Final verdict:** replace — on `compact`, both sets are reconciled to what the compacted context still carries, backed by the context-window page, not by the `SubagentStart` sentence.
**Correct line:** "**FR-A4 — Never repeat.** A per-consumer **delivered-set** and **read-set**, reconciled across `resume`/`fork` (reseed) / `compact` (both sets then hold only what that consumer's compacted context still carries — the compaction summary and the files Claude Code re-reads — so a fact the summary dropped can be delivered again) / `clear`/`startup` (clean) `[HOOKS, D-20]`."
**Owner or engineering:** engineering line; goes to Max Cogar under M38 as a change to his signed document.
**Owner question:** none

### E-77
**Ruling:** The first audit rules FR-A5 undetermined because conjunct (c) follows P5; the second
opinion replaces (c). With P5 settled (E-39), (c) has a correct line. Both reviews agree that the
no-cap clause, the dedup carve-out and conjuncts (a) and (b) stand. OL-C1's "marginal value" names
the concept and is consistent with the new wording.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L235-L235]] "and (c) **not cheaply self-serve** (**marginal value** `[P5]`)."
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L67-L67]] "the bar (importance / marginal value) is the sole arbiter"
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-a.md@HEAD:L1077-L1077]] "conjunct (c) follows the P5 resolution (E-39)"
**Final verdict:** replace — conjunct (c) takes E-39's test; the rest of FR-A5 unchanged.
**Correct line:** "… and (c) **not already held by that consumer or evident from what is in front of it** (**marginal value** `[P5]`, FR-A4). …" — rest of FR-A5 unchanged.
**Owner or engineering:** engineering line; goes to Max Cogar under M38 as a change to his signed document.
**Owner question:** none

### E-80
**Ruling:** The first audit rules the calibration line undetermined; the second opinion replaces it
with an owner part. Both agree on the defects: (1) Phase A's only named calibration input, the human
CLI correction, assumes Max Cogar reviews whispers he does not see in the chat, and no ledger entry
gives him that job (OL-11 assigns verification to the agents); (2) "ships high" has no reasoning —
D-6bar only restates it, and its origin is agent-written `RETHINK.md` §6 — and it biases toward the
silence the spec's own FR-L4 calls the costliest value failure. The second opinion is right that the
correct line can be written from the spec: Phase A must already exit with "measured whisper/block +
false-fire and regret data on a real repo", run on "the owner's real repos and Claude Code
transcripts"; AC-18's seeded-fact run and FR-L4's regret proxy are Phase A requirements; OL-11 puts
verification on the agents. Those are Phase A's calibration inputs, with a human correction
outranking them when given (FR-L6). Nothing new is invented. What remains Max Cogar's is whether he
will spend his time correcting whispers at all; the line does not depend on the answer. Parts b and
c (FR-L6 E-90, D-12 E-22) route the whole calibration channel to him as undetermined; this ruling
narrows the owner part to his own participation, because the agent-side inputs are already required
by the spec.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L253-L255]] "the calibration input from Phase A is the human CLI correction (FR-D4/FR-L6);"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L793-L794]] "combinator, \"ships high\", and calibration policy stated as properties."
- [[middleware/context-oracle/RETHINK.md@ec3b057:L202-L202]] "Ship with the bar set high and lower it against measured hit rate."
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L656-L657]] "costliest **value** failure"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L755-L756]] "Exits by producing measured whisper/block"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L757-L758]] "owner's real repos and Claude Code transcripts to *discover* how the honest"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L1085-L1087]] "the exit
  run **delivers those specific facts**"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L49-L49]] "you start/end sessions, suggest features, speed up testing; design/build/verification/docs/roadmap are the agents'"
- [[https://code.claude.com/docs/en/hooks.md]] "Claude reads the reminder on the next model request, but it doesn't appear as a chat message in the interface"
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-c.md@HEAD:L346-L346]] "who supplies Phase A's calibration signal"
**Final verdict:** replace — Phase A's calibration inputs are the agent-reviewed replay, the seeded-fact run and the regret proxy, with a human correction outranking them when given; "ships high" is replaced by a recorded initial operating point.
**Correct line:** "**The bar is calibrated.** It is adjusted against measured false-fire and value. Phase A's calibration inputs are agent-reviewed replay of real sessions (§11.5; verification is the agents', OL-11), the seeded-fact run (AC-18) and the regret proxy (FR-L4); a human CLI correction (FR-D4/FR-L6) outranks them when given. The initial operating point is the architect's, recorded with its reason, and reset from Phase A data; automated demotion/promotion is Phase C `[D-6bar]`."
**Owner or engineering:** engineering line (goes to Max Cogar under M38), with an owner part: whether he will supply CLI corrections at all. OL-11's exact words: "The project is agent-led; you start/end sessions, suggest features, speed up testing; design/build/verification/docs/roadmap are the agents'." Neither assigns nor excludes this.
**Owner question:** In the first version of the tool, the short notes the oracle gives the agent do not show up in your chat. The spec assumed you would read them afterwards and mark the wrong ones, and nothing you have said asks you to. Do you want to do that? If not, the agents check them by replaying real sessions and by a test with planted facts, and nothing depends on you. If you do, your corrections count for more than the automatic checks.

### E-84
**Ruling:** Both reviews agree that FR-M2's failure classes serve OL-10 and that the missed-skill-block
class repeats E-58's misattribution to OL-11. The first audit removes the attribution and leaves the
class to stand or fall with E-58's owner question; the second opinion gives the class its correct
justification. The second opinion is right: a bare removal leaves the class unjustified, and E-58's
derivation (verification is the agents' job under OL-11) is its justification.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L271-L271]] "the misclassified-as-done miss Max cannot see himself, OL-11"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L49-L49]] "design/build/verification/docs/roadmap are the agents'"
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-a.md@HEAD:L1170-L1170]] "remove \"(… Max cannot see himself, OL-11)\" as an owner attribution"
**Final verdict:** replace — the class keeps its justification, derived from OL-11's assignment of verification, not an attribution to Max Cogar.
**Correct line:** "… checked against store/repo state, not by re-classifying the agent's actions, so it catches the misclassified-as-done miss without relying on Max Cogar to notice it, since verification is the agents' job (OL-11); a step with no checkable post-condition is out of this detector's reach (FR-C4)." — the class stands subject to E-58's owner question on the detector.
**Owner or engineering:** engineering line; goes to Max Cogar under M38 as a change to his signed document.
**Owner question:** none (the owner question on the detector is E-58's)

## Entries neither review disputes (not re-ruled)

Both reviews reach the same verdict and the same fix; the first audit's entry stands as written.
- **keep (55):** E-1, E-4, E-5, E-6, E-8, E-9, E-11, E-12, E-14, E-15, E-16, E-17, E-18, E-20,
  E-21, E-22, E-23, E-25, E-26, E-27, E-28, E-30, E-31, E-32, E-33, E-34, E-35, E-36, E-37, E-38,
  E-40, E-41, E-44, E-46, E-48, E-49, E-51, E-54, E-55, E-56, E-57, E-60, E-61, E-65, E-66, E-67,
  E-68, E-69, E-75, E-76, E-78, E-81, E-82, E-83, E-85.
- **replace (8), fix as the first audit states it:** E-10, E-24, E-47, E-62, E-63, E-64, E-71,
  E-79. All are engineering lines that go to Max Cogar under M38.

## Summary

| Entry | First audit | Second opinion | Final verdict | Owner or engineering | What was settled |
|---|---|---|---|---|---|
| E-2 | replace | replace | replace | engineering | adds the stale "reviewed to convergence" claim to the fix |
| E-3 | replace | replace | replace | engineering | same fix; FR-O2 clause named explicitly |
| E-7 | replace | replace | replace | engineering | context-rot sources, not Liu et al. |
| E-13 | replace | replace | replace | engineering | "does not consult", with ROSE and Tricorder; neither review's wording |
| E-19 | replace | replace | replace | engineering | `Stop` block re-applies while open; bounded by the answer, the harness cap, and visibility; reads all text since the question |
| E-29 | keep | keep | keep | engineering | backing is least privilege, not OL-3 |
| E-39 | undetermined | replace | replace | engineering | P5 test = consumer does not already have it and it would change the decision |
| E-42 | keep | keep | keep | engineering | backing as E-29 |
| E-43 | replace | replace | replace | owner | keep OL-C2's history in his exact words |
| E-45 | undetermined | replace | replace | engineering | headline follows new P5; `[RSSE]` cited for what it says; push sourced to the mission |
| E-50 | replace | replace | replace | engineering | event left to the architect; denied-edit case named |
| E-52 | keep | replace | replace | engineering | trigger is the completion-claim stop |
| E-53 | replace | replace | replace | engineering | real false-fire cost; no Phase A demotion |
| E-58 | replace | replace | replace | both | justification from OL-11's verification role; detector scope to Max Cogar |
| E-59 | replace | replace | replace | engineering | row follows E-19 |
| E-70 | replace | replace | replace | engineering | "just attempted" |
| E-72 | replace | replace | replace | engineering | mission backing, `asyncRewake` named, `[CHI]` dropped |
| E-73 | replace | replace | replace | engineering | key includes `session_id` |
| E-74 | replace | replace | replace | engineering | backed by the context-window page; `SubagentStart` sentence covers only its own copy |
| E-77 | undetermined | replace | replace | engineering | conjunct (c) follows new P5 |
| E-80 | undetermined | replace | replace | both | agent-side calibration inputs; Max Cogar's participation asked |
| E-84 | replace | replace | replace | engineering | class justified as E-58 |

**Counts, recounted from the sections above.** Ruled here: 22 entries — keep 2 (E-29, E-42),
replace 20, remove 0, undetermined 0. Not re-ruled: 63 entries — keep 55, replace 8. **Whole part a
(85 entries): keep 57, replace 28, remove 0, undetermined 0.** Owner questions for Max Cogar: 3
(E-43, E-58, E-80). Every replace, owner or engineering, goes to Max Cogar before it changes the
spec (M38).
