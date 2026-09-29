# Spec audit — part c (spec lines 673–1142): adjudication

This file adjudicates between the first audit
`middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-c.md` (E-1 to E-87; keep 51,
replace 32, undetermined 4) and the second opinion
`middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-c-second-opinion.md` (87 judged;
keep 45, replace 36, remove 2, undetermined 4). The adjudicator wrote neither the spec nor either
review. The rulings follow
`/tmp/claude-0/-home-user-agent-armory/779c0f74-86b0-5e8f-b02d-811e78ed3f66/scratchpad/audit/BRIEF.md`
and `…/audit/SPEC-BRIEF.md`; the spec is judged at `ec3b057`.

**What is ruled.** Every entry where the two reviews reach a different verdict, or where the
second opinion changes the fix or the backing: E-4, E-5, E-6, E-8, E-10, E-12, E-19, E-21, E-22,
E-26, E-34, E-35, E-37, E-40, E-42, E-44, E-46, E-47, E-49, E-51, E-53, E-55, E-56, E-59, E-60,
E-64, E-68, E-77 (28 entries). The other 59 are listed at the end, not re-ruled.

**Shared lines with parts a and b.** Part a's adjudication
(`2026-09-29-spec-audit-a-adjudication.md`) is settled and is followed here where the same line or
the same fact recurs: the answer-drift `Stop` block (its E-19), the OL-11 attribution (its E-58,
E-84), the done-claim recognizer's lean (its E-53), the `compact` rule (its E-74), the calibration
inputs (its E-80), the Consequence timing (its E-50), FR-A2a's counts (its E-47, first-audit fix)
and FR-A6's thin-history list (its E-79, first-audit fix). Part b has a first audit and a second
opinion but no adjudication in `docs/reviews/`; its entries on FR-B1/FR-B3/FR-B4 (E-26, E-27, E-29,
E-31), FR-O2 (E-33) and C-1/C-3 (E-36, E-38) were read and are cited where a part c line depends on
them. Two places where the settled part a line and part b's second opinion differ are named in the
section that meets them (E-34: the form of the `Stop` continuation; E-22: part a's reliance on
§11.5's transcript replay).

**Sources.** Every web source a ruling depends on was re-fetched with `curl` on 2026-09-29 into
`/tmp/claude-0/-home-user-agent-armory/779c0f74-86b0-5e8f-b02d-811e78ed3f66/scratchpad/specaudit/adj-c/`
(`code.claude.com/docs/en/` pages `hooks`, `changelog`, `sub-agents`, `setup`, `settings`,
`cloud-environments`, `tools-reference`, `context-window`, `whats-new/2026-w23`; the Tricorder,
Johnson et al. and Fail Fast PDFs; the OWASP LLM06 page; the Node v22 `sqlite` doc; the Python
`sqlite3` doc; PyPI `tree-sitter` metadata; `deps/sqlite/sqlite.gyp` at three Node tags), and every
web quote below was matched against that fetch. The second opinion's experiments X1–X5 were not
re-run; they are cited from its file, and X1's log (`…/specaudit/so-c/mdi/order.log`) was read and
matches what the second opinion reports.

**Sign-off rule.** Every spec change here is a change to a document Max Cogar signed. Under M38 it
goes to him before it replaces the old line, whether it is an owner decision or an engineering line
([[/tmp/claude-0/-home-user-agent-armory/779c0f74-86b0-5e8f-b02d-811e78ed3f66/scratchpad/audit/owner-messages.md@FILE:L757-L757]] "Because it's in a document you signed, the change comes to you before it replaces the old line."
and his reply [[/tmp/claude-0/-home-user-agent-armory/779c0f74-86b0-5e8f-b02d-811e78ed3f66/scratchpad/audit/owner-messages.md@FILE:L766-L766]] "okay then make a task list and get started").
"Owner question: none" means the line is an engineering line: it reaches him only as a change to
approve, not as a decision for him to make.

### E-4
**Ruling:** Both reviews keep FR-C1; they differ on its backing, and the ruling changes the line for
a reason neither raised. (1) Backing: the first audit backs the post-condition field with "Max Cogar
cannot see a skipped step", citing OL-11. OL-11 does not say that; part a's settled E-58 replaced the same
attribution with the derivation that checking skill conformance is verification, which OL-11
assigns to the agents. The field's engineering job is the one FR-B5 states: an under-fire guard that
reuses the recognizer's classifier inherits its blind spot. The second opinion is right on backing.
(2) The line itself is incomplete once E-8 is ruled: FR-C4 can derive "was step N due?" without the
action classifier only from the skill's declared step order and, for a conditional step, its
declared condition (E-8). FR-C1 lists "the steps it defines" and "the expected agent action per
step" but neither the order nor any step condition, and FR-C4's own limit (2) already says the
derivation "requires a **post-condition-ordered** step structure". So the structure FR-C1 hands the
oracle must carry them. This is a consequence of E-8, not a new requirement: the order and the
conditions are part of each skill's written text (for example `expert-plan` numbers its steps).
(3) The field and its job stand only if Max Cogar keeps the automated detector (part a E-58's owner
question); if he drops it, the post-condition field has no consumer and goes with it.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L686-L687]] "the steps it defines, the expected agent action per step"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L734-L735]] "which requires a **post-condition-ordered** step structure"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L449-L452]] "or it inherits that classifier's blind spot"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L49-L49]] "design/build/verification/docs/roadmap are the agents'"
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-a-adjudication.md@HEAD:L395-L395]] "the detector's justification is derived from OL-11's assignment of verification to the agents"
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-c.md@HEAD:L71-L71]] "OL-11-backed post-condition field"
- [[claude-plugins/expert-dev-tools/skills/expert-plan/SKILL.md@ec3b057:L177-L177]] "#### 2d. Read the actual files"
**Final verdict:** replace — FR-C1 adds the declared step order and each conditional step's condition to the encoded structure, which E-8's classifier-free "due" derivation reads; backing is FR-B5's independence argument, not an OL-11 attribution.
**Correct line:** "**FR-C1 — Expert-tool awareness `[OL-C2]`.** The oracle is given the *structure* of Max's expert dev-tool skills — per skill: how activation is detectable, the steps it defines in their declared order (with, for a conditional step, the declared condition under which it applies), the expected agent action per step, and — where one exists — each step's **observable post-condition** (the artifact it produces or the store-checkable state it leaves), which the under-fire detector (FR-C4) verifies directly without re-classifying the agent's actions."
**Owner or engineering:** engineering line; goes to Max Cogar under M38 as a change to his signed document. Whether the detector that consumes the post-condition field exists at all is part a E-58's owner question.
**Owner question:** none (part a E-58's question on the automated checker decides whether the post-condition field is needed)

### E-5
**Ruling:** Both reviews replace FR-C1a on the same three defects; the second opinion corrects two
parts of the fix and adds a third, and all three corrections hold.
1. *The tool name.* The subagent tool is `Agent`; the sub-agents page says the rename happened in
   2.1.63 and that `Task(...)` references in settings still work as aliases. The second opinion's X4
   showed a `PreToolUse` matcher written `Task` still fires, but the hook input carries
   `tool_name` `Agent`. So the first audit's "would be wrong if" is met on the matcher, and the
   replace stands on the input: code comparing `tool_name` to `Task` never matches.
2. *The reason for anchoring on the dispatch.* "The single most-cited process failure on this very
   project" is an uncounted ranking (both reviews). The first audit's substitute, "CLAUDE.md makes
   the collapse-hunt mandatory", is a rule of this repository's project file, not a step of one of
   Max Cogar's skills; FR-C1a enforces skill structure (OL-C2). The verifiable reason is that the
   hand-off to a separate review subagent is a declared step of his `expert-implement` skill.
   Read-before-plan is likewise a declared step (`expert-plan` Step 2d; `expert-spec` Step 2).
3. *The owner attribution in the limit.* "not Max — OL-11" puts on OL-11 a claim it does not make
   (part a E-58). The limit holds without it: a step that leaves no artifact and no distinguishing
   action cannot be detected by anything, Max Cogar included, because the output is the same
   whether or not the step happened.
4. *An owner part neither review raised.* The limit is correct as engineering, but it is a limit on
   a requirement Max Cogar confirmed in general terms: he asked that agents not following his
   skills be blocked, not only on the steps that happen to leave a trace. Whether that limit is
   acceptable, or whether his skills should be changed so that such steps leave something checkable,
   is a scope decision about his own tools, so it goes to him (raise-flaws rule: a flaw in what the
   tool is for goes to the owner). The line below states the limit truthfully either way; if he
   chooses to change his skills, FR-C1a's limit narrows accordingly.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L694-L694]] "a `Task` subagent, whose absence"
- [[https://code.claude.com/docs/en/sub-agents.md]] "In version 2.1.63, the Task tool was renamed to Agent. Existing Task(...) references in settings and agent definitions still work as aliases."
- [[https://code.claude.com/docs/en/tools-reference.md]] "The Agent tool spawns a subagent in a separate context window."
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-c-second-opinion.md@HEAD:L85-L85]] "`matcher=Task tool_name=Agent` / `matcher=Agent tool_name=Agent`"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L695-L695]] "is the single most-cited process failure on this very project"
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-c.md@HEAD:L89-L89]] "CLAUDE.md makes the independent collapse-hunt mandatory, dominating rule 2"
- [[claude-plugins/expert-dev-tools/skills/expert-implement/SKILL.md@ec3b057:L187-L187]] "## Hand off to independent review"
- [[claude-plugins/expert-dev-tools/skills/expert-implement/SKILL.md@ec3b057:L189-L189]] "The review that decides whether the work is done is performed by a **separate general-purpose subagent**"
- [[claude-plugins/expert-dev-tools/skills/expert-plan/SKILL.md@ec3b057:L189-L189]] "**Do not plan against code you have not read.**"
- [[claude-plugins/expert-dev-tools/skills/expert-spec/SKILL.md@ec3b057:L123-L123]] "### 2. Read the existing context"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L699-L700]] "Observable from the transcript."
- [[https://code.claude.com/docs/en/hooks.md]] "The transcript file is written asynchronously and may lag the in-memory conversation"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L705-L705]] "not Max — OL-11"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L68-L68]] "IF THE AGENTS ARENT FOLLOWING MY SKILLS, THEN THAT SHIT NEEDS TO BE BLOCKED AT SOME POINT."
**Final verdict:** replace — `Agent` named with its alias status; the anchor steps given as declared steps of Max Cogar's skills; read-before-plan observed from the oracle's own `Read` events; the OL-11 attribution dropped from the limit; the limit itself put to Max Cogar.
**Correct line:** "- **FR-C1a — What this block enforces, and its inherent limit `[OL-C2]`.** OL-C2 asks the oracle to know each skill's steps and "what actions the agent should be taking if they actually follow the skills", and to block an agent that skips a step without a stated reason. The block can enforce a step that leaves something the oracle observes — a tool action its own hooks record, or an artifact in repo/store state. Two declared steps of Max's skills anchor it:
  - **The independent-review hand-off** — `expert-implement`'s "Hand off to independent review" (the review is performed by a separate general-purpose subagent). Observable: an `Agent` tool call at the step that requires it (hook input `tool_name` is `Agent`; `Task` survives only as a settings and matcher alias since Claude Code 2.1.63).
  - **Read-before-plan / read-before-assert** — the grounding step of `expert-plan` (Step 2d) and `expert-spec` (Step 2): were the cited files `Read` in the session before the plan or claim that rests on them? Observable from the `Read` tool events the oracle's hooks record (not from `transcript_path`, which may lag).
  What the block **cannot** enforce is a step that leaves **no artifact and no distinguishing action** — e.g. *"verify this claim against current source"* done in the agent's head — because the output is the same whether or not the step happened, so no mechanism and no observer can detect the skip. A skill composed *entirely* of such steps is not enforceable by this block (FR-C1/FR-C4)."
**Owner or engineering:** both. The harness facts, the anchor steps and the limit's wording are an engineering line (goes to Max Cogar under M38). Whether the limit is accepted or his skills are changed so those steps leave a trace is an owner decision — goes to Max Cogar with the ledger's exact words (OL-C2: "I wanted their structures to be programmed into the oracle so the oracle would know when they're activated, what steps are within the expert skill being used, what actions the agent should be taking if they actually follow the skills, and so on." and "IF THE AGENTS ARENT FOLLOWING MY SKILLS, THEN THAT SHIT NEEDS TO BE BLOCKED AT SOME POINT.").
**Owner question:** You said you wanted the oracle to know "what steps are within the expert skill being used, what actions the agent should be taking if they actually follow the skills", and that "IF THE AGENTS ARENT FOLLOWING MY SKILLS, THEN THAT SHIT NEEDS TO BE BLOCKED AT SOME POINT." The oracle can only check a skill step that leaves something it can see — a file written, a helper agent started, a file opened. Some steps in your skills happen only in the agent's head, such as "check this claim against the current code"; nothing, you included, can tell whether the agent did them. For those steps, which do you want: the block leaves them unchecked, or your skills are changed so each of those steps leaves something visible (for example a short written note the agent must produce), which the oracle can then check but which adds work for the agent every time?

### E-6
**Ruling:** Both reviews send FR-C2 to Max Cogar; the second opinion corrects the framing, and it is
right. His words are "a more deterministic trigger" — a comparison with the gate-and-test
attempts he describes in the same statement, not "deterministic" as an absolute. FR-C2 misquotes
him by writing "Deterministic" and then redefines it; the first audit repeats the dropped "more"
("the opposite of what 'deterministic' ordinarily means") and offers as matching his words an
alternative (tool events only) that his words do not pick: a mapping bounded by the encoded skill's
declared steps may be "more deterministic" than a free judge or a plan test. The flaw is
established (the spec quotes and redefines an owner word); the correct trigger is his to choose, so
the question goes to him with his exact words and no pre-selected answer. The fixed part of the
line (no hand-written rule piles; bounded by the declared steps; held to FR-B5) is his words and
stands. Consequence: FR-A2's phasing rule sets the feature's phase from his answer (E-3, E-12).
**Evidence:**
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L68-L68]] "what i actually wanted was structured steering/correcting with a more deterministic trigger. and NOT trying to code in piles of rules and shit for when it should trigger."
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L68-L68]] "making the working agent take a goddamn tests to see if it had a good enough plan to proceed"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L710-L711]] "**\"Deterministic\" here means"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L712-L712]] "actions onto a skill's steps is a judgment (model-assisted, consistent with Phase C), not a"
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-c.md@HEAD:L106-L106]] "state OL-C2's trigger as deterministic over the observable tool events the encoded skill declares (alternative a)"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L73-L73]] "a statement Max makes about one specific thing, in specific context, must never be written down as a broader project rule than what he actually said"
**Final verdict:** replace — FR-C2 quotes Max Cogar's words exactly and states the trigger he chooses; the redefinition of "deterministic" is deleted.
**Correct line:** "- **FR-C2 — Trigger structured by the skill definition, not hand-coded rule piles `[OL-C2]`.** Max's words: *"structured steering/correcting with a more deterministic trigger. and NOT trying to code in piles of rules and shit for when it should trigger."* The trigger is driven by the structured skill definition (active? which step? expected action?), bounded by the skill's declared steps, not by a growing set of hand-written heuristics, and because it gates a block it is held to the block-precision discipline (FR-B5). The agent's actions are matched to the skill's steps **[if Max Cogar answers (a):]** only from tool events and repo/store state the encoded skill declares, with no model judgment; a step whose expected action is not such an event is steered but not blocked. **[if he answers (b):]** by a model-assisted judgment bounded by the declared steps, run off the synchronous deny path (NF-1), which is what he accepted as the "more deterministic trigger". **[if he answers otherwise:]** as he states it." — one of the bracketed sentences, per his answer, replaces L710–715's redefinition.
**Owner or engineering:** owner decision — goes to Max Cogar with the ledger's exact words (OL-C2: "what i actually wanted was structured steering/correcting with a more deterministic trigger. and NOT trying to code in piles of rules and shit for when it should trigger.").
**Owner question:** You said you wanted "structured steering/correcting with a more deterministic trigger. and NOT trying to code in piles of rules and shit for when it should trigger." To know which step of your skill the agent is on, the oracle has to match what the agent does against the steps written in the skill. That can be done in two ways. (a) Only from things the tools record exactly — for example "the agent started a helper agent" or "the agent opened this file" — with no AI judgment involved; this can only check steps that show up that way. (b) By asking an AI model to compare what the agent did with the skill's written steps, limited to those steps; this can follow more steps, but it is a judgment and can be wrong. Which of these is the "more deterministic trigger" you meant: (a), (b), or something else?

### E-8
**Ruling:** Both reviews find the defect: FR-C4's limit (2) lets "was step N due?" fall back to the
action classifier, the signal FR-C4 exists to be independent of, and the result flows unmarked into
the `status` rate — a hidden degraded mode (BRIEF fail-fast rule). They differ on the fix. The first
audit's "report as unmonitored and exclude from the rate" for every step whose "due" is not derivable
by forward chaining gives up steps that can be monitored, so it is an exclusion in place of the
requirement. The second opinion's derivation is asked about directly: it is correct in its core and
incomplete in four places.
1. *Correct:* FR-C4 feeds a diagnostic rate (FR-M2/FR-M4), not a deny, so "due" may be settled after
   the skip. If a later declared step's post-condition is present, every earlier unconditional step
   was due; when the run reaches a completion claim, every declared step with a post-condition was
   due. Both facts come from repo/store state and the done-claim, not from the FR-C2 action→step
   classifier. So limit (2)'s "judgment-heavy skill ⇒ falls back to classification" is false for
   every step that has a post-condition: a judgment-heavy skill's post-condition steps are still due
   at its completion claim.
2. *Incomplete — order is not yet encoded.* Step 2 of the derivation says FR-C1 encodes the steps
   "with their expected order"; FR-C1 lists "the steps it defines" and no order or condition. The
   derivation needs both, so FR-C1 must carry them (ruled in E-4).
3. *Incomplete — "present" must mean produced in this run.* A post-condition artifact that existed
   before the skill was activated (an earlier plan file, an earlier review) would make a step read
   as done, or a later step read as reached. "Present" must mean produced after this run's
   activation.
4. *Incomplete — the completion claim can be wrong.* The done-claim recognizer is a classifier too
   (D-38; not FR-C2's, so independence from FR-C2 holds), and part a's settled E-53 makes it lean
   toward firing. A false done-claim mid-skill would mark every remaining step due and count false
   misses. Because the rate tolerates latency, misses are settled at the end of the session: a step
   whose post-condition appears after a mistaken done-claim is not counted. (A run that neither
   reaches a later step nor claims completion has passed over nothing, so nothing is due in it; the
   second opinion's "skipped nothing the agent then relied on" is a stronger claim than needed.)
5. *Incomplete — some conditions are not state-readable.* The second opinion's step 4 assumes every
   step condition "is read from the state it names". A condition such as "if the plan has a flaw" is
   a judgment in the agent's head, the FR-C1a class no mechanism can see. Such a step's dueness
   cannot be derived without the classifier; the correct handling is limit (1)'s: not monitored,
   counted and shown as unmonitored beside the rate, never estimated from the classifier. This is
   the inherent limit FR-C1a already states, made visible — not an exclusion of anything that could
   be monitored.
The OL-11 reason at L722–723 is replaced as part a's E-58 settled it. The whole requirement stands
subject to part a E-58's owner question (whether the automated checker is built at all).
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L735-L738]] "falls back to action-classification"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L729-L729]] "missed-skill-block rate (FR-M2/FR-M4)"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L722-L723]] "cannot see a skipped skill step himself (OL-11)"
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-c.md@HEAD:L136-L136]] "reports the step as unmonitored in `status`/`log` and excludes it from the missed-skill-block rate"
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-c-second-opinion.md@HEAD:L111-L111]] "FR-C1 encodes a skill's steps with their expected order."
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-c-second-opinion.md@HEAD:L113-L113]] "that condition is read from the state it names"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L686-L687]] "the steps it defines, the expected agent action per step"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L171-L171]] "a classification with false-fire/miss modes"
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-a-adjudication.md@HEAD:L372-L372]] "the recognizer leans toward firing when a covering test exists and was not run"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L703-L706]] "because it produces **no artifact and no distinguishing action**"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L49-L49]] "design/build/verification/docs/roadmap are the agents'"
- [[https://martinfowler.com/ieeeSoftware/failFast.pdf]] "The program continues working right after an error but fails in strange ways later on."
**Final verdict:** replace — "due" and "done" are both read from repo/store state (declared order, completion claim, state-readable conditions; post-conditions produced in this run), settled at session end; steps with no post-condition or a non-state condition are shown as unmonitored; no classifier fallback.
**Correct line:** "- **FR-C4 — Automated missed-skill-block detection `[OL-C2, OL-11, FR-B5]`.** Checking whether an agent followed a skill step is verification, which OL-11 assigns to the agents, so the skill block's under-fire side does not rely on Max noticing a skipped step. The signal must be **independent of the action→step classifier** (FR-C2) that the deviation recognizer uses, or it inherits that classifier's blind spot — an action *misclassified as a valid step* would read as "step done" to both. So FR-C4 reads both whether a step was **due** and whether it was **done** from repo/store state, never from that classifier: a step is **done** when its **observable post-condition** (FR-C1) is present, produced after this run's activation; it is **due** once a later declared step's post-condition is present (declared order, FR-C1) or once the run reaches a completion claim, and a conditional step only when its declared condition holds in repo/store state. A step that was due, whose post-condition is **absent**, and on which no deny fired is a **missed skill-block**, feeding the missed-skill-block rate (FR-M2/FR-M4). Because the rate is diagnostic, misses are settled at the end of the session, so a step completed after a mistaken completion claim is not counted. This *omission-of-outcome* check catches the misclassified-as-done case a commission-based check hides, and keeps the err-toward-restraint bias (FR-B5) from ratcheting OL-C2 enforcement silently to never-firing. **Limit:** a step with no checkable post-condition, or whose condition cannot be read from repo/store state, is not monitored this way (FR-C1a); such steps are counted and shown in `status` as unmonitored beside the rate, never estimated from the classifier. Distinct from answer-drift, whose under-fire guard is the human channel (FR-L6) because Max *does* see his own unanswered question. Existence required."
**Owner or engineering:** engineering line; goes to Max Cogar under M38 as a change to his signed document. It stands subject to part a E-58's owner question on whether the automated checker is built.
**Owner question:** none (part a E-58's question decides whether this detector exists)

### E-10
**Ruling:** Both reviews remove the test-bed sentences (L757–766) and send their subject to Max
Cogar; they differ on what he is asked. The facts are agreed: the sentences were added on
2026-09-04, after the 2026-08-28 sign-off; they rest on `docs/IDEAS.md` #14, marked "Unvalidated";
they skip the promotion path CLAUDE.md sets (IDEAS → §13 → requirement with owner sign-off); and
they make a spec requirement depend on an architecture ID (`AD-24`). The signed text before them
requires only an exit run "on a real repo" and stays. The second opinion is right that his question
must be about what is new, not about real repos in general, but it leaves out one new thing: the
signed text says "a real repo", while the added sentence says "the owner's real repos". So three
things are new and his: (a) running Phase A on his own projects, (b) using the records of his own
Claude Code conversations as test material, and (c) designing Phase B and the regression fixtures
from that replay. No ledger entry covers any of them. His only recorded words on running things on
his projects were said about a different proposal (testing tool assumptions before building) and,
under OL-C7, decide nothing here; they do show the question is live. The sentence about faked
mechanisms corrupting measurement restates the collapse-log 2026-09-04 lesson, whose home is
CLAUDE.md rule 3; it is not a requirement and goes with the rest. Consequences in other parts: part
a's settled E-80 calibration line names "agent-reviewed replay of real sessions (§11.5 …)" as a
Phase A input, and part b's C-6 fix covers "the owner's repositories"; both rest on this answer
(see E-22 and E-77).
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L755-L757]] "Exits by producing measured whisper/block"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L757-L759]] "**Phase A is also the build's test bed.** It is run on the"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L758-L759]] "owner's real repos and Claude Code transcripts to *discover* how the honest"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L760-L761]] "replay), and Phase B and the `AD-24` regression fixtures are **designed from that"
- [[middleware/context-oracle/docs/IDEAS.md@ec3b057:L92-L92]] "**Unvalidated.**"
- [[middleware/context-oracle/CLAUDE.md@ec3b057:L270-L271]] "Promotion: IDEAS.md → spec §13 (grounded by research) → requirement with owner"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L72-L72]] "Max, in chat, 2026-08-28"
- [[/tmp/claude-0/-home-user-agent-armory/779c0f74-86b0-5e8f-b02d-811e78ed3f66/scratchpad/audit/owner-messages.md@FILE:L565-L565]] "test the group's assumptions about outside tools on your real repos first"
- [[/tmp/claude-0/-home-user-agent-armory/779c0f74-86b0-5e8f-b02d-811e78ed3f66/scratchpad/audit/owner-messages.md@FILE:L583-L583]] "AND WHY DO YOU NEED TO TEST SHIT ON MY ACTUAL PROJECTS????"
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-a-adjudication.md@HEAD:L558-L558]] "Phase A's calibration inputs are agent-reviewed replay of real sessions (§11.5; verification is the agents', OL-11)"
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-b.md@HEAD:L655-L655]] "covers the owner's repositories"
**Final verdict:** replace — Phase A's content and real-repo exit stay; the test-bed sentences are removed until Max Cogar decides the three new points and IDEAS #14 is promoted.
**Correct line:** L745–757 unchanged, ending "… including how little the conservative recognizer catches before Phase B."; L757–766 ("**Phase A is also the build's test bed.** … into apparent completeness.") deleted until Max Cogar answers the question below and IDEAS #14 is promoted through §13; a promoted sentence then states exactly what he approved.
**Owner or engineering:** owner decision — goes to Max Cogar. No ledger entry covers this; the signed spec line's own words are "Exits by producing measured whisper/block + false-fire **and regret** data on a real repo".
**Owner question:** The spec you signed says the first version of the tool must finish with a test run "on a real repo". After you signed it, an agent added three things you have not approved: that this run is done on your own projects, that the records of your own Claude Code conversations are used as test material, and that the later versions are designed from what that run shows. Do you want the test run done on your own projects? Do you want the records of your Claude Code conversations used as test material? Do you want the later versions designed from what those runs show?

### E-12
**Ruling:** Both reviews replace the Phase C bullet: "A/B delivery" is defined nowhere, and the
bullet bundles two features' dependencies. The second opinion adds two points, both correct. (1)
The demotion+promotion ladder is itself Phase C's learning-loop content (§5.2 puts automated
demotion/promotion in Phase C), so listing it as something Phase C "needs" is circular; it is what
Phase C builds, from Phase A/B exit data. (2) The corrective feature's real input from earlier
phases is Phase A's deny and whisper delivery, which its steer (a whisper) and its block (a deny)
use. Its phase is set by FR-A2's model-dependence rule once FR-C2's trigger is settled (E-6).
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L777-L777]] "skill structures encoded and A/B delivery in place, plus the demotion+promotion ladder."
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L255-L255]] "automated demotion/promotion is Phase C `[D-6bar]`."
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L183-L184]] "Model-free vs model-dependent, and therefore build phase, is fixed in §11."
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-c.md@HEAD:L200-L200]] "drop the undefined \"A/B delivery\""
**Final verdict:** replace — each Phase C part states its real inputs; the undefined term and the circular dependency go.
**Correct line:** "- **Phase C — Automated learning loop + the corrective/skill feature (FR-C1–C4, the skill non-conformance steer-then-block with its automated missed-block detector).** The learning loop's automated demotion and promotion (FR-L3/FR-L3b) are built from Phase A/B exit data. The corrective feature needs Max's skill structures encoded (FR-C1) and uses Phase A's whisper and deny delivery; its phase follows FR-A2's model-free/model-dependent rule once FR-C2's trigger is settled."
**Owner or engineering:** engineering line; goes to Max Cogar under M38 as a change to his signed document. Its phase depends on E-6's owner answer.
**Owner question:** none (E-6's question decides the phase)

### E-19
**Ruling:** Both reviews replace D-6/D-6bar and agree that the recursion guard's derivation must be
written: the model call is a headless `claude -p` run in the same repository, and configured hooks
fire in such runs (executed by the 2026-09-28 branch audit and again in the second opinion's X1/X3),
so an unguarded call re-enters the oracle. They differ on "ships high". Part a's settled E-80 already
replaced §5.2's "The bar ships high" with "the initial operating point is the architect's, recorded
with its reason, and reset from Phase A data", and D-6bar is the judgment behind that sentence, so
D-6bar must follow it. The second opinion's backing does not change that. Tricorder enforces a low
false-positive rate for results shown to human developers at code review, and Johnson et al. found
false positives drive human developers away from static-analysis tools; both are real, and both
are about human reviewers, so for an agent consumer they back a neighbouring decision (BRIEF test
item 4), as the second opinion itself concedes by calling them an analogy. They are also a reason an
architect may give for a chosen initial operating point, which part a's line requires to be
recorded. The second opinion's concern that dropping the words leaves the initial operating point
unstated is met by that requirement. OL-C1 makes the bar (importance / marginal value) the sole
arbiter, and OL-C4 chose to voice uncertain hazards flagged, so a spec-level lean toward silence has
no owner backing either.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L793-L794]] "combinator, \"ships high\", and calibration policy stated as properties."
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L595-L596]] "illustratively a non-interactive single-turn CLI call (e.g. `claude -p --model … --max-turns"
- [[middleware/context-oracle/docs/reviews/2026-09-28-branch-audit-hook-context-permission-denial.md@HEAD:L28-L29]] "All runs used Claude Code 2.1.283, `claude -p`, in a throwaway `/tmp`"
- [[middleware/context-oracle/docs/reviews/2026-09-28-branch-audit-hook-context-permission-denial.md@HEAD:L34-L34]] "| Bash allowed (control) | 2 | yes, both | success | in transcript, both |"
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-c-second-opinion.md@HEAD:L373-L373]] "`PreToolUse 'echo hi' agent=None transcript_has_answer=yes`"
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-a-adjudication.md@HEAD:L558-L558]] "The initial operating point is the architect's, recorded with its reason, and reset from Phase A data"
- [[https://research.google.com/pubs/archive/43322.pdf]] "We still enforce a very low effective false positive rate here"
- [[https://research.google.com/pubs/archive/43322.pdf]] "Given that all developers at Google use code review"
- [[https://petertsehsun.github.io/soen7481/papers/icse13b.pdf]] "Our results confirmed that false positives and developer"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L67-L67]] "the bar (importance / marginal value) is the sole arbiter"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L70-L70]] "(B) also voice uncertain warnings clearly flagged, letting the learning loop demote ones that keep being wrong"
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-c.md@HEAD:L298-L298]] "drops \"ships high\""
**Final verdict:** replace — D-6 records the recursion derivation; D-6bar states the bar and combinator as properties with the initial operating point left to the architect, recorded with its reason, as part a E-80 settled; "ships high" goes.
**Correct line:** "- **D-6 / D-6bar — Recursion guard, and the bar-as-quality-filter, are properties.** The recursion guard is required because the oracle's model call goes through the host CLI (OL-2, §10), a headless Claude Code run in the same repository, and configured hooks fire in such a run, so an unguarded call would re-enter the oracle (FR-J4, AC-21). The bar's numeric combinator and its initial operating point are the architect's, each recorded with its reason and reset from Phase A data; the bar is calibrated against measured false-fire and value (§5.2)."
**Owner or engineering:** engineering line; goes to Max Cogar under M38 as a change to his signed document.
**Owner question:** none

### E-21
**Ruling:** Both reviews rule D-9 undetermined; they name different missing items, and neither
item is needed to write the correct line. D-9 is an engineering judgment with no reasoning (it and
P8 cite each other). Its backing is now settled by part a's E-29: least privilege — the oracle
observes and injects context, which needs read access to the tree and no write — and part a found
that the line permits, and does not require, in-tree wiring. What the §12 entry must add is when the
permitted write is needed, and the sources settle that: Claude Code reads hooks from a user-level
file outside every repository and from a git-excluded project-local file, but an Anthropic-hosted
cloud session runs hooks only "from the repository" and from managed settings, and "User-level
settings stay on your machine". So the least write is the one the target environments need:
committed repository wiring if the oracle must run in cloud sessions, none in the committed tree
otherwise. That is a complete requirement now; which case applies is part b E-38's owner question
(what OL-4's "sandbox" means), and the choice among the permitted scopes, with its costs (the first
audit's start-up cost of a user-scope hook in every project; the second opinion's X6 measured a bare
Node start at 56–67 ms), is the architect's. Neither is missing from the spec line.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L796-L796]] "**D-9 — The one in-tree write is `init` wiring** (P8)."
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L147-L147]] "except explicit `init` wiring `[D-9]`"
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-a-adjudication.md@HEAD:L197-L198]] "The line permits, and does not require, the in-tree wiring"
- [[https://genai.owasp.org/llmrisk/llm062025-excessive-agency/]] "Limit the permissions that LLM extensions are granted to other systems to the minimum necessary in order to limit the scope of undesirable actions."
- [[https://code.claude.com/docs/en/settings.md]] "You, in every project on this machine"
- [[https://code.claude.com/docs/en/settings.md]] "You, in this one project only. Claude Code keeps it out of git when it creates the file"
- [[https://code.claude.com/docs/en/cloud-environments.md]] "User-level settings stay on your machine."
- [[https://code.claude.com/docs/en/cloud-environments.md]] "Claude Code runs hooks from the repository and from your organization's"
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-c.md@HEAD:L328-L328]] "missing: a written comparison of the three wiring scopes"
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-c-second-opinion.md@HEAD:L216-L216]] "missing: which environments the oracle must run in"
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-b-second-opinion.md@HEAD:L301-L301]] "which environments that means (his own computer, Claude Code cloud sessions, an offline machine)"
**Final verdict:** replace — D-9 records least privilege and ties the one permitted in-tree write to the environments that need it; the scope choice is the architect's once part b E-38 is answered.
**Correct line:** "- **D-9 — The oracle never mutates the repository; the only write it may make in the tree is hook wiring by an explicit `init` (P8).** *Job:* least privilege — the oracle observes and injects context, which needs read access to the tree and no write. The wiring goes only where the environments the oracle must run in (C-3, OL-4) require it: a user-level or git-excluded project-local settings file leaves the committed tree untouched, while an Anthropic-hosted cloud session runs hooks only from the repository and managed settings, so there the wiring must be in the repository's committed settings. `init` makes the smallest write those environments need, and `deinit` restores the tree to its pre-`init` state (AC-7)."
**Owner or engineering:** engineering line; goes to Max Cogar under M38 as a change to his signed document. Which environments apply is part b E-38's owner question.
**Owner question:** none (part b E-38's question, on what "Sandbox compatibility is required." covers, decides which case applies)

### E-22
**Ruling:** Both reviews find the same flaw in D-12: Phase A's only calibration input is the human
CLI correction, which assumes Max Cogar reads and judges whispers that do not appear in his chat,
while OL-11 assigns verification to the agents. Both rule it undetermined pending his answer; the
second opinion narrows his part to whether he will supply corrections at all. Part a's settled E-80
ruled the same flaw on §5.2 and wrote the correct line from the spec itself, because the agent-side
inputs are already required: Phase A exits with "measured whisper/block + false-fire **and regret**
data on a real repo" (§11.5, signed), the seeded-fact run is AC-18, the regret proxy is FR-L4, and
reviewing the logged whispers is verification, the agents' job. So D-12's correct line does not
wait on Max Cogar; only his own participation does, and part a asks him that. One correction to part
a's wording: its line names "agent-reviewed replay of real sessions (§11.5 …)", which rests on the
test-bed sentences E-10 removes until he answers. The input that stands without that answer is the
agents' review of the whispers logged on Phase A's own runs, including the signed real-repository
exit run; replay of his Claude Code conversation records is added only if he says yes to E-10.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L797-L798]] "calibration input"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L798-L798]] "is the human CLI correction."
- [[https://code.claude.com/docs/en/hooks.md]] "Claude reads the reminder on the next model request, but it doesn't appear as a chat message in the interface."
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L49-L49]] "design/build/verification/docs/roadmap are the agents'. You are a non-programmer by design."
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L755-L757]] "Exits by producing measured whisper/block"
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-a-adjudication.md@HEAD:L558-L558]] "Phase A's calibration inputs are agent-reviewed replay of real sessions (§11.5; verification is the agents', OL-11), the seeded-fact run (AC-18) and the regret proxy (FR-L4)"
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-c.md@HEAD:L346-L346]] "who supplies Phase A's calibration signal"
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-c-second-opinion.md@HEAD:L224-L224]] "whether he will supply corrections at all"
**Final verdict:** replace — D-12's calibration inputs are the agents' review of Phase A's logged runs, the seeded-fact run and the regret proxy, with a human correction outranking them when given; Max Cogar's participation is asked once (part a E-80).
**Correct line:** "- **D-12 — Phase A logs uptake but makes no automated uptake judgment.** Its calibration inputs are the agents' review of the whispers logged on Phase A's runs, including the real-repository exit run (§11.5; verification is the agents', OL-11), the seeded-fact run (AC-18) and the regret proxy (FR-L4); a human CLI correction (FR-D4/FR-L6) outranks them when given." — and part a E-80's §5.2 line reads "the agents' review of the whispers logged on Phase A's runs" in place of "agent-reviewed replay of real sessions" unless Max Cogar answers yes to E-10's transcript question.
**Owner or engineering:** engineering line (goes to Max Cogar under M38), with an owner part: whether he will supply corrections at all. OL-11's exact words: "The project is agent-led; you start/end sessions, suggest features, speed up testing; design/build/verification/docs/roadmap are the agents'."
**Owner question:** none new — part a E-80's question covers it and is asked once: [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-a-adjudication.md@HEAD:L560-L560]] "The spec assumed you would read them afterwards and mark the wrong ones, and nothing you have said asks you to. Do you want to do that?"

### E-26
**Ruling:** Both reviews replace D-20: it states a slogan with no reasoning, and FR-A4's `compact`
rule keeps the delivered-set although compaction may have removed those whispers from the agent's
context. The first audit's fix clears both sets; the second opinion allows clearing or reconciling
against the compaction summary. Part a's settled E-74 decided this for FR-A4, the line D-20 backs:
the premise rests on the context-window page (hook-added context is "Summarized with the rest of the
conversation"; up to five recently modified files are re-read), not on the `SubagentStart` sentence
both reviews cite, which covers only that hook's own copy in a subagent; and the requirement is the
property — after compaction the sets hold what the compacted context still carries — with clearing
both sets one implementation the architect may choose and record. D-20 takes that reasoning.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L806-L806]] "**D-20 — Session boundaries are not context boundaries** (FR-A4)."
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L222-L224]] "`compact` (clear read-set)"
- [[https://code.claude.com/docs/en/hooks.md]] "Claude Code replays the saved text rather than re-running the hook for past turns"
- [[https://code.claude.com/docs/en/context-window.md]] "Context that hooks added earlier | Summarized with the rest of the conversation"
- [[https://code.claude.com/docs/en/context-window.md]] "Files Claude read or edited | Claude Code re-reads up to five, most recently modified first"
- [[https://code.claude.com/docs/en/hooks.md]] "The compact_summary field contains the conversation summary generated by the compact operation"
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-a-adjudication.md@HEAD:L510-L510]] "both sets are reconciled to what the compacted context still carries"
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-c.md@HEAD:L409-L409]] "so on `compact` both the read-set and the delivered-set are cleared"
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-c-second-opinion.md@HEAD:L251-L251]] "(or reconciled against the compaction summary, the architect's choice)"
**Final verdict:** replace — D-20 states its reasoning, and on `compact` both sets are reconciled to what the compacted context still carries (part a E-74).
**Correct line:** "- **D-20 — Session boundaries are not context boundaries (FR-A4).** Dedup follows what the consumer's context still holds, not the session boundary. On `resume`/`fork` Claude Code replays the saved hook text, so earlier whispers are still held and the sets are reseeded. On `compact` the context keeps a summary of earlier hook-added context and up to five re-read files, so both the delivered-set and the read-set are reconciled to what the compacted context still carries, and a fact the summary dropped can be delivered again when next relevant (clearing both sets is one way to meet this; the architect records the choice). `clear`/`startup` start a clean context."
**Owner or engineering:** engineering line; goes to Max Cogar under M38 as a change to his signed document.
**Owner question:** none

### E-34
**Ruling:** The first audit keeps D-32; the second opinion replaces it, and the second opinion is
right on the defect. OL-C5 covers any next move after Max Cogar's question. D-32 realises the block
only as a `PreToolUse` deny, so a turn that ends with text that does not answer fires no deny, and
the spec's only handling is FR-B4's best-effort Stop whisper, "delivery, not a block" — the narrowing OL-R5
records as the agent's, not his (the silent end-of-turn case described as out of scope). A `Stop`
hook can prevent the stop, and it fires only after the agent has ended its turn with the question
open, so it is reactive, not the pre-emptive gate. Part a's settled E-19 and part b's second opinion
(its E-26) reach the same finding. The line below is the one part a settled, with three points
ruled here.
1. *Release and bound.* The second opinion writes "bounded by `stop_hook_active` and the harness
   cap". Part a settled that `stop_hook_active` is an input, not a release: releasing when it is true
   would let the agent stop after one continuation with the question still open, a one-cycle
   narrowing of OL-C3's "until it stops ignoring me and actually answers". The block is re-evaluated
   at every `Stop` and re-applies while the question is open; the answer releases it; the harness's
   consecutive-continuation cap, which the oracle never raises, is the outer bound; a cap-hit with
   the question open is an FR-M2 fault. Part b's second opinion agrees ("re-issued while the question
   stays unanswered").
2. *The continuation form.* Part a's line names `decision: "block"`; part b's second opinion leaves
   the form to the architect. The reference says both forms prevent the stop under the same loop
   protections, and recommends `additionalContext` "when the hook is working as designed and giving
   Claude guidance", `decision: "block"` being shown as a hook error. Both meet the requirement, and
   the spec leaves mechanisms to the architect unless a constraint is itself a requirement (L15–17).
   So the one consistent line names the property and lists both forms; part a's `decision: "block"`
   is one of them and conflicts with nothing.
3. *The skill block has the same gap — a finding neither review made.* OL-C2 blocks an agent that
   skips a step without a stated reason. A skill's last step, such as `expert-implement`'s hand-off to
   independent review, can only be skipped by ending the turn without it, which no `PreToolUse` deny
   can catch; FR-C4 would count the miss after the fact, but no block would fire. By the same
   reasoning as answer-drift, a turn that ends with a due step skipped and no reason stated (after
   the steer) is the deviating move, and the `Stop` block is its reactive landing. The rule is Max
   Cogar's (OL-C2); the landing point is engineering. Parts a and b's skill-block lines (§2.1, FR-B1's
   skill clause) follow this, and AC-2b (E-59) and AC-2 (E-55) test it.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L816-L818]] "**D-32 — The blocking model is exactly Max's two cases, realised as a `PreToolUse`"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L426-L426]] "It is **delivery, not a block**"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L71-L71]] "if i ask a question and their next move isnt a direct answer or them taking actions to provide an answer, then then need corrected"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L69-L69]] "the oracle should block that motherfucker until it stops ignoring me and actually answers."
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L60-L60]] "case described as out of scope"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L68-L68]] "IF THEY CANT PROVIDE A REASON FOR SKIPPING A STEP OR SOMETHING, OR STEERING ISNT WORKING, THEN THEY SHOULD BE FUCKING BLOCKED."
- [[https://code.claude.com/docs/en/hooks.md]] "\"block\" prevents Claude from stopping. Omit to allow Claude to stop"
- [[https://code.claude.com/docs/en/hooks.md]] "It keeps the conversation going through the same loop protections as decision: \"block\", namely the stop_hook_active input and the 8-consecutive-continuation cap"
- [[https://code.claude.com/docs/en/hooks.md]] "Use additionalContext when the hook is working as designed and giving Claude guidance"
- [[https://code.claude.com/docs/en/hooks.md]] "after stop hooks have continued the turn eight times in a row, Claude Code overrides the next block and ends the turn"
- [[https://code.claude.com/docs/en/hooks.md]] "Does not run if the stoppage occurred due to a user interrupt."
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-a-adjudication.md@HEAD:L182-L182]] "a turn that ends unanswered (`Stop` block that re-applies while the question is open, bounded by the answer and the harness cap)"
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-b-second-opinion.md@HEAD:L186-L186]] "continuation form the architect's"
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-c-second-opinion.md@HEAD:L306-L306]] "judged from `last_assistant_message` and bounded by `stop_hook_active` and the harness cap"
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-c.md@HEAD:L524-L524]] "keep — the ledger's two blocks on a documented mechanism."
- [[claude-plugins/expert-dev-tools/skills/expert-implement/SKILL.md@ec3b057:L187-L187]] "## Hand off to independent review"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L15-L17]] "Component boundaries, storage engines, IPC, algorithms, and the exact"
**Final verdict:** replace — both blocks land on the deviating move, which is a tool action or the end of the turn; the `Stop` landing re-applies while its condition holds, bounded by the harness cap, form left to the architect.
**Correct line:** "- **D-32 — The blocking model is exactly Max's two cases, each blocking the deviating move itself, always reactive and self-clearing (§8, FR-B1–B3).** The deviating move is a tool action or the end of the turn. A tool action that is not answer-directed (answer-drift) or that skips a due skill step without a stated reason (skill non-conformance) is denied at `PreToolUse` (`permissionDecision: "deny"`). A turn that ends with Max's question unanswered, or with a due skill step skipped and no reason stated after the steer, is blocked at `Stop`: the hook prevents the stop and continues the turn with the reason (`decision: "block"` or the `Stop` `additionalContext` continuation; the form is the architect's). A `Stop` block is re-evaluated at every `Stop`, re-applies while its condition holds, and releases as soon as the agent answers, performs the step, or states a reason; its outer bound is the harness's consecutive-continuation cap, which the oracle never raises, and a cap-hit with the condition still open is a self-detected fault (FR-M2) shown in `status`. *Job (an owner-objective, not a mission derivation — see §8's opening paragraphs):* enforce owner authority in the two situations Max confirmed `[OL-C2, OL-C3, OL-C5]` without becoming the pre-emptive gate he rejected: every block lands only after the agent has deviated, and OL-C5 makes ending the turn without an answer such a deviation (OL-R5 rejects scoping it out). Blocking is a second owner-set objective beside the mission. What is rejected — the pre-emptive "pass a test to proceed" gate `[OL-C2]` and the generated-file block `[OL-R4]` — stays structurally impossible (FR-B3)."
**Owner or engineering:** engineering line (the mechanism; the rules are Max Cogar's OL-C2, OL-C3 and OL-C5, unchanged); goes to Max Cogar under M38 as a change to his signed document.
**Owner question:** none

### E-35
**Ruling:** Both reviews rule D-33 undetermined and agree its two stated reasons fail; they name
different missing items. What exactly is missing, settled against the sources:
1. *Known now, and must go.* (a) "The language the Claude Code tooling ecosystem already assumes" is
   false: the npm package "downloads a native binary that doesn't use your Node.js at runtime", so
   Claude Code's presence does not imply a Node runtime. (b) C-1's "weaker … store options" for
   Python is not shown: stdlib `sqlite3` creates an FTS5 table here with no toolchain (re-run below).
   Part b's second opinion adds the fact that keeps (b) from being a clean win for Python: Python's
   module uses the runtime SQLite library it is linked against, so FTS5 depends on the platform's
   build, while `node:sqlite` compiles its own SQLite with `SQLITE_ENABLE_FTS5`, but only from
   v22.16.0 on the 22.x line (re-checked below; the spec's v22.13.0 floor is wrong) and still marked
   "Active development" in the v22 docs.
2. *A differentiator neither the spec nor the first audit states* (second opinion, re-checked): the
   indexer's parser. In Node it runs from WebAssembly — `web-tree-sitter` and prebuilt `.wasm`
   grammars, with no native module in the installed tree. Python's `tree-sitter` 0.26.0 ships 40
   per-platform compiled wheels and one source archive that needs a C compiler.
3. *Missing, and not obtainable from sources:* (a) Max Cogar's answer to part b E-38 — which
   environments OL-4's "Sandbox compatibility is required." covers. That answer decides what C-3's
   "no prebuilt-binary download" forbids (a registry-delivered platform wheel is a prebuilt binary
   downloaded at install) and so whether item 2 is a real advantage. (b) For those environments:
   which runtimes and versions are present or installable within C-3, and whether the SQLite library
   Python links there has FTS5. (c) A written comparison of the candidate runtimes on (a)–(b) against
   C-2, C-3 and C-6. The first audit named only (b)'s first half; the second opinion named (a) and
   (b)'s first half; the FTS5-linkage fact and the written comparison complete the list.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L826-L827]] "using the language the Claude Code tooling ecosystem already assumes."
- [[https://code.claude.com/docs/en/setup.md]] "the package downloads a native binary that doesn't use your Node.js at runtime"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L519-L520]] "they are rejected for weaker cold-start/no-toolchain store options"
- [[ran]] `python3 -c "import sqlite3;c=sqlite3.connect(':memory:');c.execute('create virtual table t using fts5(x)');print('py fts5 ok', sqlite3.sqlite_version)"` → `py fts5 ok 3.45.1`
- [[https://docs.python.org/3/library/sqlite3.html]] "Version number of the runtime SQLite library as a string"
- [[ran]] `for t in v22.13.0 v22.15.0 v22.16.0; do printf "%s " $t; curl -sSL https://raw.githubusercontent.com/nodejs/node/$t/deps/sqlite/sqlite.gyp | grep -c SQLITE_ENABLE_FTS5; done` → `v22.13.0 0` / `v22.15.0 0` / `v22.16.0 1`
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L517-L518]] "unflagged from **v22.13.0 / v23.4.0**"
- [[https://nodejs.org/docs/latest-v22.x/api/sqlite.md]] "Stability: 1.1 - Active development."
- [[middleware/context-oracle/ctxoracle/package.json@ec3b057:L22-L23]] "\"web-tree-sitter\": \"0.25.10\","
- [[ran]] `cd middleware/context-oracle/ctxoracle/node_modules; find web-tree-sitter tree-sitter-wasms -name "*.wasm" | wc -l; find web-tree-sitter tree-sitter-wasms -name "*.node" | wc -l` → `39` / `0`
- [[ran]] `curl -sSL https://pypi.org/pypi/tree-sitter/json -o pypi-ts.json; python3 -c "import json;d=json.load(open('pypi-ts.json'));v=d['info']['version'];fs=[u['filename'] for u in d['releases'][v]];print(v,len(fs),sum(f.endswith('.whl') for f in fs),[f for f in fs if f.endswith('.tar.gz')])"` → `0.26.0 41 40 ['tree_sitter-0.26.0.tar.gz']`
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L530-L532]] "no prebuilt-binary download"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L42-L42]] "Sandbox compatibility is required."
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-c.md@HEAD:L540-L540]] "missing: the runtimes and versions present in Max Cogar's target environments"
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-c-second-opinion.md@HEAD:L319-L319]] "missing: the meaning of C-3's \"no prebuilt-binary download\""
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-b-second-opinion.md@HEAD:L281-L281]] "missing: a written runtime comparison against C-2/C-3 and the parser path"
**Final verdict:** undetermined — D-33's two stated reasons are false and must go; missing: part b E-38's owner answer on the environments, the per-environment runtime and SQLite-FTS5 facts, and the written runtime comparison against C-2, C-3 and C-6.
**Correct line:** not yet writable. Known now: delete "using the language the Claude Code tooling ecosystem already assumes" and the "weaker … store options" rejection it pairs with at C-1; the line is written from the comparison once the three missing items exist.
**Owner or engineering:** engineering line, gated on an owner answer; its eventual change goes to Max Cogar under M38.
**Owner question:** none of its own (part b E-38's question, on what "Sandbox compatibility is required." covers, is the one it waits on)

### E-37
**Ruling:** The first audit keeps D-35; the second opinion replaces its skill-block premise, and the
second opinion is right. The cost-asymmetry reasoning and the two-guard design stand. The premise
"(Max cannot see a skipped step, OL-11)" puts on OL-11 a claim it does not make: OL-11 says he is a
non-programmer and assigns verification to the agents; OL-C2 records him noticing agents not
following his skills. Part a's settled E-58 and E-84 replaced the same attribution in FR-A2k and
FR-M2 with the derivation that checking skill conformance is verification, the agents' job, so it
must not rely on him noticing; D-35 takes the same premise. The answer-drift premise ("Max sees his
own unanswered question") is backed by OL-C3's own words and stands. Two dependencies, not changes:
the automated check exists only if Max Cogar keeps it (part a E-58's owner question), and the human
channel's form (FR-L6 corrections) follows part a E-80's owner question.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L840-L841]] "(Max cannot see a skipped step,"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L838-L839]] "the **human channel** for answer-drift (Max sees his own unanswered question)"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L49-L49]] "design/build/verification/docs/roadmap are the agents'. You are a non-programmer by design."
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L68-L68]] "IF THE AGENTS ARENT FOLLOWING MY SKILLS, THEN THAT SHIT NEEDS TO BE BLOCKED AT SOME POINT."
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L69-L69]] "if i ask a question, then it needs to be answered."
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-a-adjudication.md@HEAD:L395-L395]] "the detector's justification is derived from OL-11's assignment of verification to the agents, not attributed to Max Cogar's abilities"
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-c.md@HEAD:L569-L569]] "keep — a stated cost asymmetry grounded in OL-11 and OL-C3."
**Final verdict:** replace — D-35's skill-block premise is the agents' verification role under OL-11, not an attribution to Max Cogar's abilities; the rest stands.
**Correct line:** "- **D-35 — The two blocks have different cost functions, so precision is calibrated per-block, not with one shared posture (FR-B5).** *Job:* keep each enforcement block from both halting a *compliant* agent and decaying to never-firing, using the guard that actually operates for that block — the **human channel** for answer-drift (Max sees his own unanswered question) and an **automated post-condition check** for skill non-conformance (checking whether an agent followed a skill step is verification, which OL-11 assigns to the agents, so it must not rely on Max noticing a skipped step), on a signal independent of the recognizer it guards. This is the collapse-log's one-way-ratchet-to-silence trap the whisper loop escaped (FR-L3b + FR-L4); each block inherits the half of that discipline its own visibility demands. Recognizer mechanisms (model-assisted → Phase B/C) are the architect's."
**Owner or engineering:** engineering line; goes to Max Cogar under M38 as a change to his signed document.
**Owner question:** none (part a E-58's and E-80's questions bear on the two guards)

### E-40
**Ruling:** The first audit keeps D-38; the second opinion replaces its lean, and the second opinion
is right. The harness fact (`last_assistant_message` carries the final text) and the framing as a
classification both stand. The stated lean, "errs toward silence", was never tested against its
costs, which is what the spec itself does for the blocks (FR-B5). A false fire at an ordinary stop
delivers a true fact (a covering test exists and was not run) in one Stop-time continuation and
releases (FR-B4); a miss lets an agent stop with unverified work, the failure OL-12 calls a
must-have to catch. The cited reasons do not support silence: P5 concerns the fact's marginal value,
and one informative whisper is not the ritual P3 bars. Part a's settled E-53 made the same change to
FR-A2g and corrected the cost of a false fire (one forced continuation, not "one sentence") and the
Phase A measurement (recorded and reported; automated demotion is Phase C). D-38 follows that line.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L855-L856]] "The recognizer is a property that errs toward silence"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L50-L50]] "having the oracle speak when an agent claims it's done is a must-have feature in my mind"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L412-L415]] "both forms are bounded by `stop_hook_active`"
- [[https://code.claude.com/docs/en/hooks.md]] "The conversation continues so Claude can act on it"
- [[https://code.claude.com/docs/en/hooks.md]] "The last_assistant_message field contains the text content of Claude's final response, so hooks can access it without parsing the transcript file."
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-a-adjudication.md@HEAD:L373-L373]] "a false fire costs one Stop-time continuation carrying a true fact (FR-B4)"
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-c.md@HEAD:L611-L611]] "keep — correct harness fact, correctly framed as a classification."
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-c-second-opinion.md@HEAD:L355-L355]] "errs toward firing when a covering test for the changed region exists and was not run"
**Final verdict:** replace — D-38 leans toward firing when a covering test exists and was not run, with the real false-fire cost and its Phase A measurement stated (part a E-53).
**Correct line:** "- **D-38 — Completion-claim recognition is a classification with error modes, not a field read (FR-A2g).** `last_assistant_message` is an input to the recognizer, not the recognizer itself. The recognizer errs toward firing when a covering test for the changed region exists and was not run: a false fire costs one Stop-time continuation carrying a true fact (FR-B4), while a miss lets an unverified done-claim pass, the failure OL-12 requires the oracle to catch. Its false-fire rate is recorded and reported (FR-M1, FR-M4); automated demotion is Phase C (P7). Whether it is a heuristic (Phase A) or model-assisted (Phase B) is the architect's."
**Owner or engineering:** engineering line (`[D-38]`); goes to Max Cogar under M38 as a change to his signed document.
**Owner question:** none

### E-42
**Ruling:** Both reviews keep D-41's phasing and replace "a wrongful hold self-recovers in one
round-trip" with measured hold durations; they differ on the answer-text source. The first audit
writes `MessageDisplay` into the spec as the source; the second opinion requires a source verified
per mode and leaves the choice to the architect. The second opinion is right, for four reasons that
the sources and the executed logs settle.
1. *The first audit's experiment does not discriminate.* It recorded that `MessageDisplay` fired
   before the next `PreToolUse` in three headless runs, but not whether the transcript already held
   the text. The second opinion's X1 re-ran it with that check: in all three runs the transcript held
   the answer at `PreToolUse` too (its log, read for this ruling, shows `transcript_has_answer=yes`
   on every line). So headless evidence shows no lag for either source.
2. *The mode Max Cogar works in is untested.* Interactively, `MessageDisplay` runs per batch of
   lines, "the final batch … may end mid-line", and nothing documents where the final batch falls
   relative to the next `PreToolUse`; the transcript "may lag" with no stated bound. X2 (interactive)
   could not be run. Neither source is verified for the interactive case.
3. *`MessageDisplay` has its own silent failure for this use.* It is display-only: if the hook fails
   or times out (default 10 s), "Claude Code displays the original text" and the oracle never
   receives it — a silent loss the fail-fast rule forbids unless recorded; its `message_id` cannot be
   correlated with transcript messages.
4. *Mechanism is the architect's.* The spec reserves mechanisms to the architect unless a constraint
   is itself a requirement (L15–17). The requirement is a property: the block reads the agent's text
   from a source verified, in every mode the oracle runs in, to hold that text before the agent's
   next `PreToolUse`. That property is the correct line; which source meets it is the §13 spike's
   result (E-44). This is not a narrowing: it states what the block needs, not a fallback.
The hold stays for whatever lag remains (a source's, or the Phase B classifier's). "Self-recovers in
one round-trip" is unbacked: a Phase B classification is a model call of about 4 s (X5), and the
agent's next move after a deny is itself a model turn, so which finishes first is not given.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L871-L873]] "The cached state is eventually-consistent; in its lag window the block holds"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L873-L873]] "a wrongful hold self-recovers in one round-trip, a missed drifter does not"
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-c.md@HEAD:L644-L644]] "the answer text is taken from `MessageDisplay`"
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-c-second-opinion.md@HEAD:L373-L373]] "`MessageDisplay 'ANSWER-TEXT-7 is my answer.' idx=0 final=True agent=None transcript_has_answer=yes`"
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-c-second-opinion.md@HEAD:L31-L34]] "**Not run.** Interactive ordering is unverified here."
- [[https://code.claude.com/docs/en/hooks.md]] "may not yet include the current turn's most recent messages when a hook fires"
- [[https://code.claude.com/docs/en/hooks.md]] "Always whole lines, except the final batch which may end mid-line."
- [[https://code.claude.com/docs/en/hooks.md]] "The single call arrives after the message completes and carries the full message text"
- [[https://code.claude.com/docs/en/hooks.md]] "Claude Code holds each batch until your hook returns, so keep the hook fast. If the hook fails or times out, Claude Code displays the original text."
- [[https://code.claude.com/docs/en/hooks.md]] "The default timeout for this event is 10 seconds"
- [[https://code.claude.com/docs/en/hooks.md]] "so it can't be correlated with transcript message ids"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L15-L17]] "Component boundaries, storage engines, IPC, algorithms, and the exact"
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-c-second-opinion.md@HEAD:L145-L145]] "`run 1 3.86 s 'OK'` / `run 2 4.23 s 'OK'` / `run 3 3.85 s 'OK'`"
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-c-second-opinion.md@HEAD:L380-L380]] "the choice between `transcript_path` and `MessageDisplay` (each with the caveats above) is the architect's"
**Final verdict:** replace — D-41 keeps the phasing and the clear-axis hold; the answer text comes from a source spike-verified per run mode to hold it before the next `PreToolUse` (interactive ordering unverified for both candidates); holds are measured, not asserted to self-recover.
**Correct line:** "- **D-41 — Recognizing "is this move answer-directed?" is a comprehension judgment, so the block is phased.** *Job:* keep the spec from treating the model-free increment as the working block when its precision needs the model. Judging whether a move is a direct answer or an action to provide the answer (OL-C5) is not deterministically decidable, so **Phase A** ships the block plumbing plus a conservative recognizer (clearly-non-answer-directed moves only — safe, low-coverage) and **Phase B** lifts it to OL-C5 precision by model-maintaining the question/answer state off the synchronous deny path (§11.5). The block reads the agent's answer text from a source verified, in every mode the oracle runs in (interactive and non-interactive), to hold that text before the agent's next `PreToolUse` (§13 spike); which source is the architect's. Text not yet visible or not yet classified (a source's lag, or the Phase B classifier's) is the lag window, in which the block holds rather than pre-clears (FR-B1's lag clause — clear-axis only, answer-directed moves still run freely). Every hold is recorded with its duration, and a hold on text later classified as an answer is recorded as a wrongful hold (FR-M1, FR-M2), so the cost of this lean is measured, not assumed. AC-12 claims only the deterministic plumbing model-free; the substantive-answer discrimination (AC-2a-ii) is a Phase-B criterion. Whether the model answers rather than retrying after a deny is model behavior, measured (FR-M4), not contract-guaranteed."
**Owner or engineering:** engineering line; goes to Max Cogar under M38 as a change to his signed document.
**Owner question:** none

### E-44
**Ruling:** Both reviews replace §13's lead: it lists no live item while a harness behaviour gates
Phase A's answer-drift design, and it files a stated behaviour (thin history) as an unknown. They
differ on how the open item is stated, and the second opinion is right for E-42's reasons: the first
audit states it as "interactive-mode ordering of `MessageDisplay` before `PreToolUse`", which
presumes the source; the open question is whether any source — the transcript or `MessageDisplay`
— holds the agent's text before the next `PreToolUse` in interactive mode, where neither is
documented, while headless runs showed both in time (X1). The same item bears on the `Stop` block's
reading of earlier assistant text in the turn (part a E-19). CLAUDE.md requires such an item to be
spiked before design-freeze.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L882-L883]] "gates v1's design."
- [[middleware/context-oracle/CLAUDE.md@ec3b057:L212-L213]] "a spec-§13 assumption that gates the phase"
- [[https://code.claude.com/docs/en/hooks.md]] "may not yet include the current turn's most recent messages when a hook fires"
- [[https://code.claude.com/docs/en/hooks.md]] "Claude Code holds each batch until your hook returns, so keep the hook fast."
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-c.md@HEAD:L673-L673]] "interactive-mode ordering of `MessageDisplay` before `PreToolUse` unverified"
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-c-second-opinion.md@HEAD:L394-L394]] "which source makes the agent's answer text visible before the next `PreToolUse` in interactive mode (transcript or `MessageDisplay`)"
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-a-adjudication.md@HEAD:L183-L183]] "earlier messages from the oracle's record of assistant text or the transcript (which may lag)"
**Final verdict:** replace — §13's lead lists the one open harness item gating Phase A: whether a source holds the agent's answer text before its next `PreToolUse` in interactive mode, to be spiked before design-freeze; resolved items and stated behaviour are not listed.
**Correct line:** (the lead paragraph, L880–883; the heading is unchanged) "**One harness behaviour gates Phase A and is spiked before design-freeze.** The answer-drift block reads the agent's answer text (FR-B1, D-41): before the agent's next `PreToolUse`, and, at a `Stop`, for the turn's earlier messages. The hooks reference documents two candidate sources and guarantees neither in interactive sessions: `transcript_path` "may lag the in-memory conversation" with no stated bound, and `MessageDisplay` delivers interactive text in batches whose timing relative to the next `PreToolUse` is not documented (and on hook failure or timeout the text is displayed without reaching the hook). In non-interactive `claude -p` runs on Claude Code 2.1.284 both held the text before the next `PreToolUse` in three runs (second-opinion experiment X1, 2026-09-29). The spike establishes, for each mode the oracle runs in, which source holds the text in time; the architect chooses from that result. The paragraph below records the harness facts re-verified for C-4, including the subagent-propagation question resolved 2026-08-29; thin-history behaviour is stated at FR-A6, not here."
**Owner or engineering:** engineering line; goes to Max Cogar under M38 as a change to his signed document.
**Owner question:** none

### E-46
**Ruling:** Both reviews find the defect: the paragraph lists "consequence" among behaviours that
survive thin history, but FR-A2d's headline (historically-coupled tests) is history-derived; only
its zone flag is structural. The fix does not narrow a requirement: nothing makes Consequence
history-free, and the correction matches FR-A2d as written. They differ on the form, and the second
opinion is right that the paragraph goes. §13 holds open items; this paragraph states behaviour, and
the same behaviour is already specified at FR-A6, which part a corrects in the same words (its
E-79: Consequence's zone flag operates, its coupled-tests headline thins). The D-27 clause restates
FR-A2g's limit. The first audit's "move it to FR-A6" leaves nothing to move, since FR-A6 already
carries it; keeping a second copy fails "one fact, one home".
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L903-L904]] "reuse, consequence, conformance, and answer-drift behaviours still operate"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L168-L168]] "**historically-coupled tests** this edit tends to break, and a vendored/build-**zone** flag"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L250-L252]] "the structural, reuse, consequence, conformance, and answer-drift"
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-a.md@HEAD:L1104-L1104]] "Consequence's coupled-tests headline is history-derived and thins with the corpus"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L171-L171]] "the general \"did not finish\" case (OL-12) is model-dependent"
- [[middleware/context-oracle/CLAUDE.md@ec3b057:L81-L82]] "**One fact, one home**"
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-c.md@HEAD:L704-L704]] "move the statement out of \"genuinely open\" to FR-A6"
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-c-second-opinion.md@HEAD:L411-L411]] "delete the §13 thin-history paragraph"
**Final verdict:** remove — the §13 thin-history paragraph is deleted; its content lives at FR-A6 (as part a E-79 corrects it) and FR-A2g.
**Correct line:** deleted
**Owner or engineering:** engineering line; the deletion goes to Max Cogar under M38 as a change to his signed document.
**Owner question:** none

### E-47
**Ruling:** Both reviews find "No owner question is open" false: a wording sign-off from the branch
audit is pending with Max Cogar, and this audit adds several more. They differ on the fix, and the
second opinion is right. The first audit replaces the sentence with a list, in the spec, of the lines
awaiting his decision. That list is project state: it changes each time he answers, fails the spec's
membership test (a requirement, constraint or acceptance criterion) and passes STATUS's ("would this
have been different a week ago?"); CLAUDE.md also makes STATUS the only file that states what to do
next. The rest of the unit (answer-drift blocks, uncertain hazards voiced flagged, language coverage)
restates decisions whose home is §2.1, FR-A5a and C-6, so nothing is lost by deleting it.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L907-L908]] "No owner question is open"
- [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B8-verification.md@HEAD:L191-L191]] "Still open: his sign-off on the FR-O2 / FR-A2d / AC-1c wording."
- [[middleware/context-oracle/CLAUDE.md@ec3b057:L72-L74]] "Would this have been different a week ago?"
- [[middleware/context-oracle/CLAUDE.md@ec3b057:L83-L83]] "**Only `STATUS.md` states what to do next.**"
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-c.md@HEAD:L718-L718]] "state which spec lines await Max Cogar's decision"
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-c-second-opinion.md@HEAD:L419-L419]] "delete the sentence; the open owner questions"
**Final verdict:** remove — the paragraph is deleted; the open owner questions (the FR-O2/FR-A2d/AC-1c wording, and this audit's questions in parts a, b and c) are stated in `docs/STATUS.md`.
**Correct line:** deleted
**Owner or engineering:** engineering line; the deletion goes to Max Cogar under M38 as a change to his signed document.
**Owner question:** none

### E-49
**Ruling:** Both reviews replace §14's lead on the same three defects: two test conditions for the
same criteria ("all use fixture repositories" and "passes on a real repository"), an undefined
"clean session", and "every criterion" covering Phase B/C criteria not yet written. They differ on
where the real-repository demand goes, and neither placement is right. The first audit puts it on
"the AC-18 exit run", but AC-18 is defined on "a rich fixture seeded with known decision-changing
facts", so the demand would vanish into a fixture. The second opinion puts it on §11.5's Phase A
exit run, but the lead is v1's completion rule, and v1 includes Phases B and C; a run made at the end
of Phase A does not show that the complete v1 works on a real repository. The signed requirement is
that v1, complete, is shown on a real repository with a clean `status`; the correct line keeps that
and makes each part decidable: criteria pass on their own fixtures, the unwritten criteria are named,
and "clean" means no self-detected failure class (FR-M2) for that session.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L914-L916]] "all use fixture repositories and replay. **v1 is"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L915-L916]] "complete when every criterion passes on a real repository and `ctxoracle status` reports a"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L1085-L1086]] "On a rich fixture seeded"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L755-L757]] "Exits by producing measured whisper/block"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L1128-L1129]] "their genre-specific acceptance criteria are authored with the Phase B architecture"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L265-L265]] "Self-detected failure classes**: hooks not firing, latency breaches, store"
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-c.md@HEAD:L745-L745]] "the AC-18 exit run is on a real repository"
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-c-second-opinion.md@HEAD:L433-L433]] "v1 completion also requires the §11.5 exit run on a real repository"
**Final verdict:** replace — criteria pass on their fixtures; v1 completion also requires a session of the complete v1 on a real repository with no self-detected failure class; the Phase B/C criteria still to be written are named.
**Correct line:** "Each criterion names the requirements it verifies and passes on its own fixture repository or replay. **v1 is complete when every criterion in this section passes — including the Phase B and Phase C criteria still to be written here (for FR-A2h, FR-A2i, FR-A2j, FR-A2m and the model-assisted recognizers) — and a session of the complete v1 on a real repository ends with `ctxoracle status` reporting no self-detected failure class (FR-M2) for that session.**"
**Owner or engineering:** engineering line; goes to Max Cogar under M38 as a change to his signed document. Which real repository is used bears on E-10's owner question.
**Owner question:** none (E-10's question covers whether his own projects are used)

### E-51
**Ruling:** The first audit keeps AC-1a as "FR-A2a's own range"; the second opinion replaces it, and
the second opinion is right. AC-1a requires the whisper to headline "the **2–4 entry-point files and
the one binding invariant**". A correct oracle with five entry points that clear the bar, or two
binding invariants, fails it. FR-A5 says no count limit suppresses a candidate that clears the bar,
and OL-C1 bars an arbitrary limit on how the oracle speaks; nothing in the spec, §9 or §12 sources
"2–4" or "one". Keeping it because FR-A2a has the same numbers is consistency with an unbacked line
(BRIEF: never backing). Part a replaced FR-A2a's counts (its E-47, first-audit fix: "the structural
entry-point files for the task and the invariants that will bind, each clearing the bar"); AC-1a
tests that line.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L924-L924]] "Orientation whisper headlines the **2–4 entry-point files and the one binding invariant**;"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L236-L237]] "**No *volume, count, or budget* limit suppresses a"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L67-L67]] "at no point should an arbitrary limit influence how that operates."
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-a.md@HEAD:L673-L673]] "The structural entry-point files for the task and the invariants that will bind, each clearing the bar (FR-A5)"
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-c.md@HEAD:L770-L770]] "keep — tests FR-A2a and D-26."
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-c-second-opinion.md@HEAD:L447-L447]] "binding invariant(s) that clear the bar (FR-A5)"
**Final verdict:** replace — AC-1a tests the entry points and binding invariants that clear the bar, with no count, and keeps the D-26 exclusion.
**Correct line:** "- **AC-1a (orientation → FR-A2a, FR-A5, D-26).** On a prompt for a task with known structure, the Orientation whisper headlines the task's **structural entry-point files and the invariants that will bind**, delivering each one that clears the bar and withholding none for a count (FR-A5); it does **not** deliver task-shape landmines (those belong at the edit, FR-A2e)."
**Owner or engineering:** engineering line; goes to Max Cogar under M38 as a change to his signed document.
**Owner question:** none

### E-53
**Ruling:** Both reviews replace AC-1c's "on an edit about to run": `PreToolUse` context is added
"alongside the tool result" and read on the next model request, so the whisper reaches the agent
with the edit's result, and delivering it before the edit would take a deny, the rejected
pre-emptive gate. The first audit writes "computed at the edit's `PreToolUse`" into the criterion;
part a's settled E-50 and E-70 ruled on FR-A2d and §5.1 that the event is the architect's (a
permission denial also fires `PreToolUse`, so a `PreToolUse`-bound whisper can arrive for an edit
that never ran) and that the wording is "the edit it has just attempted (its whisper arrives with
the edit's result)"; part a explicitly asks AC-1c to follow. Part a's E-39 also replaces P5's
"one grep" test, so "grep-able" goes from the fail clause, which keeps its substance (a raw call-site
count is not the headline). The second opinion's added point is about FR-O2, not AC-1c, and it
holds: the "preserved even if the tool call later fails" clause is sourced by the Claude Code
changelog, 2.1.110 (April 15, 2026), "Fixed `PreToolUse` hook `additionalContext` being dropped when
the tool call fails", and was confirmed by execution on 2.1.284 (X3). The 2026-09-28 ruling that
called it unsourced, and part b's first audit that deletes it (its E-33), are contradicted; part b's
second opinion keeps it with that citation. That is part b's line to settle; nothing in AC-1c
carries it.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L929-L929]] "On an edit about to run in a file with known"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L931-L931]] "a whisper whose headline is a raw grep-able call-site count fails."
- [[https://code.claude.com/docs/en/hooks.md]] "String added to Claude's context alongside the tool result"
- [[https://code.claude.com/docs/en/hooks.md]] "Permission denials fire PreToolUse"
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-a-adjudication.md@HEAD:L328-L328]] "Part c's E-53 (AC-1c) writes `PreToolUse` into the criterion; it should follow this line."
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-a-adjudication.md@HEAD:L426-L426]] "the edit it has just attempted (its whisper arrives with the edit's result)"
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-a-adjudication.md@HEAD:L255-L255]] "AC-1, AC-1c and AC-8, must be restated against this test"
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-c.md@HEAD:L799-L799]] "computed at the edit's `PreToolUse`"
- [[https://code.claude.com/docs/en/changelog.md]] "Fixed PreToolUse hook additionalContext being dropped when the tool call fails"
- [[ran]] `awk 'NR<=4735 && /<Update label/ {l=NR": "$0} NR==4735{print l}' changelog.md` (the fetched changelog, whose line 4735 is the fix note) → `4708: <Update label="2.1.110" description="April 15, 2026">`
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-c-second-opinion.md@HEAD:L462-L462]] "final replies end `CTXMARK-4417: the file notes.txt is generated.` (both runs)"
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-b.md@HEAD:L508-L508]] "delete \"and that text is preserved even if the tool call later fails\""
**Final verdict:** replace — AC-1c states that the whisper reaches the agent with the edit's result, leaves the carrying event to the architect (part a E-50), and drops "grep-able" (part a E-39); FR-O2's preservation clause is sourced and is part b's to keep.
**Correct line:** "- **AC-1c (consequence → FR-A2d, P5, HERZIG).** On an edit attempted in a file with known historically-coupled tests, the Consequence whisper, reaching the agent with the edit's result, headlines those **coupled tests and the zone flag**; a whisper whose headline is a raw call-site count fails."
**Owner or engineering:** engineering line; goes to Max Cogar under M38 as a change to his signed document (with the FR-O2 / FR-A2d wording the branch audit left for his sign-off).
**Owner question:** none

### E-55
**Ruling:** Both reviews replace AC-2's mutation clause, which read literally fails the sanctioned
`init` write. The second opinion adds that once answer-drift also lands at `Stop` (E-34), the
control-flow assertion must cover the `Stop` call sites too, or a `Stop` block elsewhere would pass
it; part b's second opinion makes the same point about FR-B3 and adds that a `Stop` continuation has
two forms (`decision: "block"` and `additionalContext`), both of which keep the turn going, so both
must be bounded. Both additions hold, and with E-34 the skill block's `Stop` landing is one of the
permitted sites.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L939-L940]] "and no code path mutates the repo or an"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L942-L943]] "the deny's only call sites are the two FR-B1 recognizers"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L587-L587]] "at minimum `init` (the only repo-tree write)"
- [[https://code.claude.com/docs/en/hooks.md]] "It keeps the conversation going through the same loop protections as decision: \"block\", namely the stop_hook_active input and the 8-consecutive-continuation cap"
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-b-second-opinion.md@HEAD:L226-L226]] "A Stop-time continuation, in either form"
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-c.md@HEAD:L826-L826]] "no code path other than `init`/`deinit` hook wiring (D-9) mutates the repo"
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-c-second-opinion.md@HEAD:L477-L477]] "the control-flow assertion covers every deny and every `Stop` block call site"
**Final verdict:** replace — the mutation clause carries D-9's exception, and the control-flow assertion bounds every deny and every `Stop` continuation in either form.
**Correct line:** "- **AC-2 (no pre-emptive gate / no mutation, structurally → FR-B3, D-9, OL-C2, OL-R4).** No code path emits a `permissionDecision: "deny"` or a `Stop` block *pre-emptively* — before the agent has made a move that violates one of the two confirmed conditions (FR-B1) — nor gates on a plan/test, nor blocks a generated-file edit; no code path other than `init`/`deinit` hook wiring (D-9) mutates the repo, and none mutates an action's input (`updatedInput`/`updatedToolOutput` never used to change what a tool does). A deny or a `Stop` block is reachable **only** on the FR-B1 answer-drift and skill-non-conformance paths, and a `Stop` continuation in either form (`decision: "block"` or `additionalContext`) only there and in FR-B4's single-cycle whisper delivery. A control-flow assertion (the only call sites of a deny or a `Stop` continuation are the two FR-B1 recognizers and FR-B4's delivery), not a field-scan."
**Owner or engineering:** engineering line; goes to Max Cogar under M38 as a change to his signed document.
**Owner question:** none

### E-56
**Ruling:** The first audit keeps AC-2a; the second opinion replaces it, and the second opinion is
right for E-34's reason. The plumbing test is well built for tool actions, but it asserts "The deny
never lands on a `Stop`" and "no `stop_hook_active`", which certify the gap E-34 closes: OL-C5 covers
a turn that ends without an answer, OL-R5 rejects leaving that case out, and the `Stop` block is its
reactive landing. With the question state fixture-controlled, the plumbing criterion must exercise
that landing too, including re-application while the question stays open and the cap-hit fault
(part a E-19's line). The rest of the criterion — answer-directed actions allowed, a substantive text
answer clears, misrecognition is the FR-M2 fault — stands.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L956-L956]] "The deny never lands on a `Stop`"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L950-L951]] "so it holds \"until it actually answers\" with no counter, no `stop_hook_active`, no held"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L60-L60]] "Agent's narrow proxy + negative-space padding, not Max's rule."
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L71-L71]] "if i ask a question and their next move isnt a direct answer or them taking actions to provide an answer, then then need corrected"
- [[https://code.claude.com/docs/en/hooks.md]] "\"block\" prevents Claude from stopping. Omit to allow Claude to stop"
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-c.md@HEAD:L840-L840]] "keep — a discriminating plumbing test that respects OL-C5."
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-c-second-opinion.md@HEAD:L484-L484]] "a turn that ends without answering is blocked at `Stop` with the reason naming the question"
**Final verdict:** replace — AC-2a tests both landings of the block (tool action at `PreToolUse`, turn end at `Stop`), with re-application and the cap-hit fault; "The deny never lands on a Stop" is deleted.
**Correct line:** "- **AC-2a (answer-drift *block plumbing* — blocks a non-answer-directed move, not an action-to-provide-the-answer — given a known state → FR-A2l, FR-B1, FR-B2, OL-C3, OL-C5, D-41).** This exercises the Phase-A **plumbing** with the question/answer state **fixture-controlled** (the *recognizer's precision* — correctly judging answer-directedness — is separately AC-2a-ii, Phase B). In a fixture where a question is marked outstanding: (1) when the agent's next move is a tool action **clearly not directed at answering** (it goes off to unrelated work), that action's `PreToolUse` is **denied** with a reason naming the outstanding question, and a further non-answer-directed action is denied the same way, with no counter and no held turn; (2) when the agent **ends its turn without answering**, the `Stop` is **blocked** with a reason naming the question, and a further unanswered turn end is blocked again, so the block holds "until it actually answers"; a fixture that keeps the turn unanswered up to the harness's consecutive-continuation cap shows the cap-hit as a self-detected fault (FR-M2) in `status`. **Actions to provide the answer are not denied:** in the same state, a `Read`/search **and a command run to get the answer** (running the test to see if it passes) are **allowed** (OL-C5) — so the block never deadlocks the path to an answer nor forces a fabricated completion claim. Once the agent **answers in text substantively** (never a tool action, so never itself denied), its next tool action is **allowed** and its next stop proceeds. The block clears the instant the question is answered — a complying agent is never stranded *when compliance is correctly recognized* (a misrecognition is the FR-M2 "deny outlives its condition" fault, FR-B2)."
**Owner or engineering:** engineering line; goes to Max Cogar under M38 as a change to his signed document.
**Owner question:** none

### E-59
**Ruling:** Both reviews replace AC-2b's last sentence; they differ on whether the link to Max Cogar
stays. "Enforcement Max cares about" is an owner attribution with no CONFIRMED entry naming these
steps (first audit, right). But OL-C2 does back the substance: he wants his skills' steps known to
the oracle and agents that skip them blocked, and the independent-review hand-off and read-before-plan
are declared steps of his `expert-implement` and `expert-plan` skills (E-5). So the correct line
cites that, rather than deleting the connection to the requirement the test certifies (second
opinion, right). With E-34, AC-2b must also exercise the skill block's `Stop` landing: the review
hand-off is the last step of `expert-implement`, so skipping it is ending the turn without it.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L981-L982]] "so a passing AC certifies enforcement Max cares"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L977-L979]] "that action's `PreToolUse` is **denied** with a reason naming the skipped step"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L68-L68]] "I wanted their structures to be programmed into the oracle so the oracle would know when they're activated, what steps are within the expert skill being used"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L12-L14]] "If it is not there, you may not write it as authority."
- [[claude-plugins/expert-dev-tools/skills/expert-implement/SKILL.md@ec3b057:L187-L187]] "## Hand off to independent review"
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-c.md@HEAD:L879-L879]] "dropping the attribution to Max Cogar"
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-c-second-opinion.md@HEAD:L504-L504]] "so a pass certifies the enforcement OL-C2 asks for"
**Final verdict:** replace — the fixture is anchored to a declared step of one of Max Cogar's skills, cited to OL-C2; the skill block's `Stop` landing is tested.
**Correct line:** "- **AC-2b (skill non-conformance steer→block → FR-A2k, FR-C3, FR-B1, FR-C1a, OL-C2).** With a fixture skill structure loaded **whose deviated step is a declared step of one of Max's skills with an observable required action (FR-C1a) — e.g. `expert-implement`'s independent-review hand-off, or `expert-plan`'s read-before-plan — not a toy step with a trivial post-condition**: when the agent deviates, the oracle first steers by whisper; when the agent then takes an action that skips that step **without a stated reason** (or steering hasn't worked), that action's `PreToolUse` is **denied** with a reason naming the skipped step; when the agent instead ends its turn with that step skipped and no reason stated, the `Stop` is **blocked** with the same reason; when the agent gives a reason or performs the step, its next action is **allowed** and its next stop proceeds. It never blocks pre-emptively (before a deviation) and never as a "pass a test to proceed" gate. Anchoring the fixture to a declared step of one of Max's skills is required so a pass certifies the enforcement OL-C2 asks for, not an abstract fixture skill structure."
**Owner or engineering:** engineering line (cited to OL-C2); goes to Max Cogar under M38 as a change to his signed document.
**Owner question:** none

### E-60
**Ruling:** The first audit keeps AC-2c; the second opinion replaces one parenthesis, and it is
right. The criterion discriminates in both directions for both blocks and its human correction is
fixture-injected, so it holds whatever Max Cogar answers on corrections. But it carries the same
unbacked premise as FR-C4 and D-35, "(automated — Max is blind here, OL-11)"; per part a E-58/E-84
and E-37 here, the premise is corrected and the test is not.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L993-L993]] "(automated — Max is blind here, OL-11)"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L49-L49]] "design/build/verification/docs/roadmap are the agents'."
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-c.md@HEAD:L892-L892]] "keep — discriminating on both error directions for both blocks."
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-c-second-opinion.md@HEAD:L511-L511]] "conformance checking is the agents' verification work, OL-11"
**Final verdict:** replace — the parenthesis states the agents' verification role under OL-11 in place of "Max is blind here"; the criterion is otherwise unchanged.
**Correct line:** "… *Under-fire, skill block (automated — checking skill conformance is verification, which OL-11 assigns to the agents):* …" in place of "*Under-fire, skill block (automated — Max is blind here, OL-11):*"; the rest of AC-2c unchanged.
**Owner or engineering:** engineering line; goes to Max Cogar under M38 as a change to his signed document.
**Owner question:** none

### E-64
**Ruling:** Both reviews replace AC-5's `compact` case to follow D-20; the first audit asserts both
sets are cleared, the second opinion "cleared (or reconciled per E-26)". AC-5 tests FR-A4, and part
a's settled E-74 fixed FR-A4's `compact` rule as a property: both sets hold what the compacted
context still carries, so a fact the summary dropped can be delivered again. E-26 applies the same
line to D-20. A criterion that asserts "cleared" would fail a correct reconciling implementation, and
one that asserts only the read-set would certify the defect; the criterion tests the property in
both directions.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L1014-L1015]] "`compact`"
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-a-adjudication.md@HEAD:L511-L511]] "so a fact the summary dropped can be delivered again"
- [[https://code.claude.com/docs/en/context-window.md]] "Context that hooks added earlier | Summarized with the rest of the conversation"
- [[https://code.claude.com/docs/en/hooks.md]] "The compact_summary field contains the conversation summary generated by the compact operation"
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-c.md@HEAD:L944-L944]] "both the read-set and the delivered-set are cleared"
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-c-second-opinion.md@HEAD:L535-L535]] "(or reconciled per E-26)"
**Final verdict:** replace — AC-5's `compact` case tests the reconciliation property in both directions.
**Correct line:** "- **AC-5 (session boundaries → FR-A4, D-20).** `resume`/`fork` reseed dedup; after `compact`, a fact delivered, or a file read, before compaction that the compacted context no longer carries (the fixture's compaction summary omits it and it is not among the re-read files) is delivered again when next relevant, while one the compacted context still carries is not repeated; `clear`/`startup` clean."
**Owner or engineering:** engineering line; goes to Max Cogar under M38 as a change to his signed document.
**Owner question:** none

### E-68
**Ruling:** Both reviews replace AC-8a. The first audit fixes only the undefined term
("interpreter-write", which appears nowhere else in the project's docs); the second opinion also
changes what the criterion certifies, and it is right. AC-8a certifies that an unanswered question at
a done-claim gets "delivery, not a block (the stop still proceeds)". Under E-34 (and part a E-19,
part b's E-26/E-29), a turn that ends with Max Cogar's question unanswered is blocked at `Stop`; part
b's first audit replaces FR-B4's outstanding-question sub-bullet with exactly that, keeping the
`status`/`log` record of done-claims reached with an outstanding question (FR-M4). So AC-8a becomes
the done-claim case of the `Stop` block, and keeps an honest statement of the live limit in plain
words: in Phase A the answered-recognizer is conservative and leans toward clearing on substance
(FR-B5, D-41), so a reply it misjudges as an answer is not caught. The second opinion's limit ("a
question the agent moved past through actions the recognizer allowed") describes the `PreToolUse`
recognizer, not the `Stop` judgment, so the wording below states the `Stop`-side limit.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L1036-L1036]] "the common Phase-A case (interpreter-write, never-answered) it may **not** fire"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L1032-L1032]] "it is **delivery, not a block** (the stop still proceeds)"
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-c-second-opinion.md@HEAD:L559-L559]] "only `spec-context-oracle.md:1036`"
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-b.md@HEAD:L441-L441]] "An unanswered Max question at any Stop is handled by the answer-drift Stop block (FR-B1)"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L438-L439]] "and **toward clearing** on a substantive answer"
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-c.md@HEAD:L995-L995]] "a question never answered, where the agent moved on through actions the conservative recognizer did not deny"
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-c-second-opinion.md@HEAD:L561-L561]] "so a question the agent moved past through actions the recognizer allowed may not be caught"
**Final verdict:** replace — AC-8a tests the `Stop` block at a done-claim with an outstanding question, plus the owner-facing record, and states the Phase A limit without the undefined term.
**Correct line:** "- **AC-8a (unanswered question at a done-claim → FR-B1, FR-B4, FR-M4, D-41, OL-12, OL-C5).** In a fixture where a Max question is marked outstanding (fixture-controlled state) at a completion-claim stop, the `Stop` is **blocked** with a reason naming the unanswered question (FR-B1), the completion whisper (FR-B4) is still delivered, and `status`/`log` record a done-claim reached with an outstanding question (FR-M4); once the agent answers in text, its next stop proceeds. Where no question is outstanding, neither the block nor the record appears. In live use the block depends on the answered-recognizer, which is Phase-A conservative until the Phase-B model-maintained state (D-41): it leans toward clearing on substantive-looking text (FR-B5), so a reply it misjudges as an answer is not caught."
**Owner or engineering:** engineering line; goes to Max Cogar under M38 as a change to his signed document.
**Owner question:** none

### E-77
**Ruling:** Both reviews replace AC-17: "broad" cannot fail, and "a fixed three" tests one wrong
number. The first audit keeps only the extensibility test and anchors the shipped set on "the one
D-15 records"; D-15 records no set, so that criterion would test extensibility alone, dropping C-6's
breadth — a narrowing. The second opinion anchors breadth on C-6's stated coverage set, which part
b's fix supplies ("every language present in the repositories Phase A runs on"); that gives the test
something to fail. Which repositories those are bears on E-10's owner question.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L1082-L1084]] "nothing is hardcoded to a fixed three."
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L799-L799]] "**D-15 / C-6 — Language coverage is broad and extensible, not a hardcoded short list.**"
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-b.md@HEAD:L655-L655]] "It must cover every language present in the repositories Phase A runs on"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L82-L84]] "it is not his to decide"
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-c.md@HEAD:L1114-L1114]] "the shipped language set is the one D-15 records"
- [[middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-c-second-opinion.md@HEAD:L616-L616]] "every language in C-6's stated coverage set is indexed and mined on a fixture"
**Final verdict:** replace — AC-17 tests C-6's stated coverage set and extensibility by configuration.
**Correct line:** "- **AC-17 (language breadth → C-6, D-15).** On a fixture containing source in every language of C-6's coverage set, the oracle indexes and mines each through the language-agnostic interface; and a language outside that set is added in the fixture by configuration alone (no code change) and is then indexed and mined."
**Owner or engineering:** engineering line; goes to Max Cogar under M38 as a change to his signed document.
**Owner question:** none (E-10's question bears on which repositories set C-6's coverage)

## Entries neither review disputes (not re-ruled)

Both reviews reach the same verdict and the same fix (differences only in wording or added
evidence); the first audit's entry stands as written.
- **keep (44):** E-1, E-2, E-7, E-9, E-11, E-13, E-14, E-15, E-16, E-18, E-20, E-24, E-28, E-29,
  E-30, E-31, E-39, E-41, E-43, E-48, E-50, E-52, E-54, E-57, E-58, E-61, E-62, E-63, E-65, E-67,
  E-69, E-71, E-72, E-74, E-75, E-76, E-78, E-79, E-80, E-81, E-82, E-83, E-84, E-85.
- **replace (14), fix as the first audit states it:** E-3, E-17, E-23, E-25, E-27, E-32, E-36,
  E-38, E-45, E-66, E-70, E-73, E-86, E-87. All are engineering lines that go to Max Cogar under M38.
- **undetermined (1):** E-33 (NF-1's 1.5 s / 3 s values; missing: per-event overhead measured
  against real tool-call durations, or a cited source).

Cross-part consequences on these, not disputes between this part's reviewers: part a's settled E-39
replaces P5's "one grep" test and asks that AC-1 (E-50) and AC-8 (E-67) be restated against it when
that ruling is applied; E-17's correction channel (FR-L6) follows E-22; E-66 (AC-7, pre-`init` tree)
holds whichever wiring scope E-21's D-9 line leads to.

## Summary

| Entry | First audit | Second opinion | Final verdict | Owner or engineering | What was settled |
|---|---|---|---|---|---|
| E-4 | keep | keep | replace | engineering | backing is FR-B5's independence, not OL-11; FR-C1 adds step order and conditions for E-8 |
| E-5 | replace | replace | replace | both | `Agent` with alias status; anchors are declared steps of Max Cogar's skills; OL-11 dropped; limit put to him |
| E-6 | replace | replace | replace | owner | his exact words ("a more deterministic trigger"); no pre-selected answer |
| E-8 | replace | replace | replace | engineering | "due" read from state (order, completion claim, state conditions), settled at session end; no classifier fallback |
| E-10 | replace | replace | replace | owner | three new points asked: his projects, his conversation records, designing later phases from them |
| E-12 | replace | replace | replace | engineering | real inputs per Phase C part; ladder is Phase C's own work |
| E-19 | replace | replace | replace | engineering | recursion derivation written; "ships high" goes, per part a E-80 |
| E-21 | undetermined | undetermined | replace | engineering | D-9 backed by least privilege; in-tree write only where the target environments need it |
| E-22 | undetermined | undetermined | replace | both | agent-side calibration inputs per part a E-80, without relying on transcript replay |
| E-26 | replace | replace | replace | engineering | `compact` reconciles both sets (part a E-74) |
| E-34 | keep | replace | replace | engineering | both blocks land on the deviating move, tool action or turn end; `Stop` re-applies, cap-bounded, form the architect's |
| E-35 | undetermined | undetermined | undetermined | engineering | missing: part b E-38 answer, per-environment runtime and FTS5 facts, written comparison |
| E-37 | keep | replace | replace | engineering | skill-guard premise is OL-11's verification role |
| E-40 | keep | replace | replace | engineering | done-claim recognizer leans toward firing (part a E-53) |
| E-42 | replace | replace | replace | engineering | answer-text source spike-verified per mode; architect chooses; holds measured |
| E-44 | replace | replace | replace | engineering | §13 lists the interactive answer-text item for both candidate sources |
| E-46 | replace | remove | remove | engineering | duplicate of FR-A6 (part a E-79) |
| E-47 | replace | remove | remove | engineering | open owner questions belong in STATUS |
| E-49 | replace | replace | replace | engineering | v1 completion keeps a real-repository session of the complete v1 |
| E-51 | keep | replace | replace | engineering | no "2–4"/"one" counts (part a E-47) |
| E-53 | replace | replace | replace | engineering | event left to the architect (part a E-50); "grep-able" dropped; FR-O2 clause sourced (part b's line) |
| E-55 | replace | replace | replace | engineering | assertion bounds every deny and every `Stop` continuation in either form |
| E-56 | keep | replace | replace | engineering | AC-2a tests the `Stop` landing, re-application and cap-hit |
| E-59 | replace | replace | replace | engineering | anchored to a declared step of his skills, cited to OL-C2; skill `Stop` landing tested |
| E-60 | keep | replace | replace | engineering | OL-11 premise corrected |
| E-64 | replace | replace | replace | engineering | AC-5 tests the reconciliation property |
| E-68 | replace | replace | replace | engineering | AC-8a is the done-claim case of the `Stop` block, with its Phase A limit |
| E-77 | replace | replace | replace | engineering | breadth tested on C-6's stated set |

**Counts, recounted from the sections above.** Ruled here: 28 entries — keep 0, replace 25 (E-4,
E-5, E-6, E-8, E-10, E-12, E-19, E-21, E-22, E-26, E-34, E-37, E-40, E-42, E-44, E-49, E-51, E-53,
E-55, E-56, E-59, E-60, E-64, E-68, E-77), remove 2 (E-46, E-47), undetermined 1 (E-35). Not
re-ruled: 59 entries — keep 44, replace 14, undetermined 1. **Whole part c (87 entries): keep 44,
replace 39, remove 2, undetermined 2.** Owner questions for Max Cogar raised here: 3 (E-5, E-6,
E-10); E-22 relies on part a E-80's question, and E-21/E-35 on part b E-38's. Every replace and
remove, owner or engineering, goes to Max Cogar before it changes the spec (M38).
