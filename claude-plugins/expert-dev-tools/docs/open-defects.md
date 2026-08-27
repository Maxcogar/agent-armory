# Open defects — expert-dev-tools

> **Standing list of defects found and NOT yet fixed.** Not a record of a finished
> effort. Nothing here is closed unless its entry says so and names the commit.
>
> **Everything below is the verbatim output of this plugin's own feedback sweep and
> diagnostician.** It is reproduced exactly as those agents returned it — not
> summarised, reworded, or re-ordered. Source: run `wf_edb6f323-e2c`, plugin 0.4.1,
> registry-recorded commit `fc745464ef7b62997fdde243c491b2903d7e8cc8`, executed
> against `Maxcogar/NOVA` on 2026-08-27.
>
> **Fixing an entry:** through this plugin's own correction process — remediation
> plan, review rounds, implementation, version bump, commit, signature marked
> corrected. Not by hand-editing the workflow.

---

## Feedback sweep 1 — 8 signatures (journal entry #1)

### 1.1 `systemic_defect` × 2

**signature**

> MCP spec scope-narrowing: agent strips/reduces spec content and justifies it from the roadmap gate (H1's three servers) rather than the owner's task. Turns 844da0d8:278 / 016d83ee:175 ("what teh roadmap currently says does not mean you can grossly narrow the mcp spec") and 016d83ee:194 pt3 ("you seem really set on trying to strip out as much as you can from this... i dont see myself building the mcp system more than once").

**responsible_component**

> expert-spec phase scope derivation — scope taken from NOVA-ROADMAP.md's current gate instead of the owner's task_verbatim; the owner's standing rule is already recorded at C:\Users\maxco\.claude\projects\C--Users-maxco-orca-NOVA\memory\build-once-never-strip-scope.md

### 1.2 `systemic_defect` × 2

**signature**

> Owner decisions sourced from documents instead of from the owner, and decisions made without disclosure. Turns 844da0d8:293 / 016d83ee:184 ("WHY THE FUCK WOULD YOU GO OFF DOCUMENT FOR OWNER DECISIONS INSTEAD OF JSUT ASKING ME??") and 016d83ee:194 tail ("i dont recognize what youre citing as evidence as to why you can secretly make decisions and not tell me about them").

**responsible_component**

> intake/spec owner-decision attribution — decisions re-derived from repo documents rather than elicited; the owner's standing rule is already recorded at C:\Users\maxco\.claude\projects\C--Users-maxco-orca-NOVA\memory\owner-decisions-need-owner-records.md

### 1.3 `systemic_defect` × 3

**signature**

> Unverified premises about the expert-dev-tools plugin itself — wrong version inspected, then the workflow declared broken. Turns 844da0d8:473 / 016d83ee:294 ("no its at 0.4.1 youre looking at the wrong thing"), 844da0d8:613 / 016d83ee:382 ("are you actually using the plugin correctly???"), 844da0d8:734 / 016d83ee:450 ("why are you saying the workflow is borken??? it works. ive used it. what EXACTLY is not working??? highly likely youre still making assumptions about it").

**responsible_component**

> expert-lifecycle intake — claims about plugin version and workflow behavior stated from assumption rather than read from C:\Users\maxco\.claude\plugins\cache\claude-armory\expert-dev-tools\0.4.1

### 1.4 `systemic_defect` × 3

**signature**

> Owner-facing output written in internal lifecycle vocabulary the owner cannot parse or act on; owner has to ask more than once for a plain walkthrough. Turns 016d83ee:194 pt1 ("i have absolutely no idea what youre asking... i dont know what you mean by self healing"), 016d83ee:797 ("i dont know what that means i am asking you for a second time to help me go through what all youre talking about"), 016d83ee:957 ("okay hold up im getting confused by all this").

**responsible_component**

> orchestrator owner-gate presentation — gate/confirmation messages emit ledger and phase jargon (retained set, findings, intent gate) without defining terms or stating the decision in the owner's own language

### 1.5 `systemic_defect` × 3

**signature**

> Lifecycle advanced while the owner's open issues were unresolved, and pulled scope back to the desktop app against the owner's stated MCP-only focus. Turns 016d83ee:849 ("i keep saying i think we should jsut focus on mcp right now, andf you keep bringing up things i said about the desktop app"), 016d83ee:880 ("WOAH WOAH HOLD THE FUCK UP!!!! WAIT!!!!" interrupting a just-launched wf_dbaca7e6-175 run), 016d83ee:917 ("we werent done with the open issues. i haveno interest in rushing to feel busy"). Corroborated by the preemptive directive at 016d83ee:1136 ("TALK TO ME ABOUT IT FIRST BEFORE IMMEDIATLY ACTING!!!").

**responsible_component**

> orchestrator gate discipline — segment dispatch launched with owner questions still open, and scope carried desktop material the owner had explicitly set aside

### 1.6 `systemic_defect` × 2

**signature**

> Deliverable produced rushed and careless, without the review the work required. Turns 844da0d8:734 / 016d83ee:450 ("this needs a real proper review to determine what this needs. i cant use what you just provided because it was rushed and careless") and 016d83ee:917 ("i want this done properly and with intentionally").

**responsible_component**

> spec drafting and review-gate sequencing — draft surfaced to the owner ahead of its review loop

### 1.7 `systemic_defect` × 2

**signature**

> Shipped H0.2 / desktop work non-functional and never checked against the current Nova direction, rendering it unusable. Turns 844da0d8:239 / 016d83ee:152 ("teh h0.2 code is fucking garbage. it still doesnt run and it was never checked against the current end goals of what Nova is") and 844da0d8:357 / 016d83ee:226 ("the desktop needs a serious re-evaluation. it was not built to align with the current direction nova is taking").

**responsible_component**

> prior H0.2 desktop implementation phase (merge 766d0f6, fix/h0-2-desktop-remediation) — implemented and verified against its own plan without re-grounding on NOVA-OPERATING-MODEL.md; outside this task's artifact scope, so it belongs in NOVA-BACKLOG.md rather than this run

### 1.8 `course_correction` × 1

**signature**

> Spec escalates MCP transport faults to the owner instead of self-recovering. Turn 844da0d8:330 / 016d83ee:211 ("if a server drops or anything like that then it jsut needs to fix it. why would tell me to fix it??? thats dumb. i shouldnt have to know anything happened unless its telling me that it'll take a minute to reconect").

**responsible_component**

> docs/specs/2026-06-12-mcp-integration-layer.md fault-handling requirements — first occurrence; already absorbed as the resolved business escalation in segment 7

---

## Diagnosis 1 — classification `owner_owned` (journal entry #3)

### problem

Twice in this project the spec phase reduced the MCP integration fleet spec's capability envelope and justified the reduction from NOVA-ROADMAP.md's current gate (Horizon 1's three read-only sources), against an owner request that states at minimum 30 servers and an explicit standing rule against stripping scope. Occurrences: turns 844da0d8:278 and 016d83ee:175 / :194 pt3. Verdict on the signature: systemic_defect.

### root_cause

Nothing in the spec phase ranks the owner's task_verbatim above the project's sequencing documents when the two imply different scope, and no artifact distinguishes *delivery sequencing* (what gets built next) from *capability envelope* (what the subsystem must be able to do). The dispatch does deliver the owner's words (workflows/expert-lifecycle.js:686-689 passes task_verbatim as 'the authoritative statement of what to build'), so this is not a transport failure. It is a precedence failure: the only rule-shaped scope instruction the spec writer receives is CLAUDE.md:27's 'active work must advance its current gate', pointing at NOVA-ROADMAP.md, whose Horizon 1 section (:191) never says a horizon bounds sequencing rather than capability. expert-spec/SKILL.md's scope guidance (:75-79, :211) is purely permissive — it offers 'bound that part out of scope explicitly' as an honest path with no bar against reducing below the owner's stated envelope. The owner's countervailing rule exists only as ambient context: build-once-never-strip-scope.md reaches subagents as a one-line memory-index summary, never as an enforced constraint. When an ambient one-liner competes with a document written as a MANDATORY rule, the rule wins — which is why the defect recurred after the memory file already existed (file modified 2026-08-25T21:59; the second occurrence followed).

### blast_radius

Every expert-lifecycle spec, architecture, and plan phase dispatched in C:\Users\maxco\orca\NOVA — each one reads CLAUDE.md:27 and the roadmap and can size any subsystem to the current horizon. Immediately: the in-flight reconciliation of docs/specs/2026-06-12-mcp-integration-layer.md on branch docs/mcp-spec-rev3-reconciliation. Structurally: any Nova subsystem specified while a small early horizon is active — the owner's stated cost is that dropped scope is never rebuilt. The plugin-side half (expert-spec/SKILL.md) additionally affects every project using expert-dev-tools 0.4.1, not just Nova.

### evidence

1. C:\Users\maxco\.claude\plugins\cache\claude-armory\expert-dev-tools\0.4.1\workflows\expert-lifecycle.js:686-689 — spec dispatch prompt embeds task_verbatim inside <<<OWNER_REQUEST ... OWNER_REQUEST>>> and labels it 'the authoritative statement of what to build — the Task line above is a working title, not the request'. The owner's words do reach the spec writer; the narrowing happened downstream of delivery.

2. C:\Users\maxco\.claude\plugins\cache\claude-armory\expert-dev-tools\0.4.1\workflows\expert-lifecycle.js:681-684 — the phase fail-closes only on ABSENCE of owner words (control_fault gate). There is no control on the spec's scope being narrower than those words.

3. C:\Users\maxco\orca\NOVA\CLAUDE.md:27 — '5. `docs/nova/NOVA-ROADMAP.md` — outcome-gated delivery sequence; active work must advance its current gate', inside the 'first six are non-negotiable' read order. This is the only rule-shaped scope instruction a dispatched spec agent sees, and it points at the gate.

4. C:\Users\maxco\orca\NOVA\docs\nova\NOVA-ROADMAP.md:191 — '### Horizon 1 — Specify the first operational loop'. Read the section; it carries no statement that a horizon's contents bound delivery order only and are not a description of a subsystem's end state.

5. C:\Users\maxco\.claude\plugins\cache\claude-armory\expert-dev-tools\0.4.1\skills\expert-spec\SKILL.md:75-79 — the skill's scope guidance offers 'bound that part out of scope explicitly, so the spec is complete for what remains' as one of three honest responses, with no rule that a reduction below the owner's stated envelope is the owner's call.

6. C:\Users\maxco\.claude\plugins\cache\claude-armory\expert-dev-tools\0.4.1\skills\expert-spec\SKILL.md:211 — 'What's in scope and what's out? Out-of-scope items stated explicitly with reasoning.' Exclusion is a formatting requirement here, not a gated act.

7. C:\Users\maxco\.claude\projects\C--Users-maxco-orca-NOVA\memory\build-once-never-strip-scope.md — states the rule and diagnoses the exact collapse ('using Horizon 1's deliberately tiny three-source scope as evidence for sizing the whole MCP transport layer, when H1 is small because it is first, not because it describes the end state'); metadata modified 2026-08-25T21:59, i.e. it predates the recurrence and did not prevent it.

8. C:\Users\maxco\orca\NOVA\docs\specs\2026-06-12-mcp-integration-layer.md:25 — 'Nova's plan of record is a fleet: **30+ MCP servers, hundreds of tools**', matching task_verbatim's 'at minimun 30 servers'. The correct envelope is recoverable from the owner's words alone; no document had to be consulted to get it right.

### correction_draft

**target_artifact**

Primary: C:\Users\maxco\orca\NOVA\CLAUDE.md (the read-order entry at line 27, plus a new MANDATORY section). Companion: C:\Users\maxco\orca\NOVA\docs\nova\NOVA-ROADMAP.md (a scope-authority preamble above the Horizon sections). Secondary, generic: C:\Users\maxco\.claude\plugins\cache\claude-armory\expert-dev-tools\0.4.1\skills\expert-spec\SKILL.md scope guidance (§'When you're missing something the spec needs', :75-79, and the scope question at :211).

**change**

1) CLAUDE.md:27 — amend the roadmap read-order entry to read, in substance: 'outcome-gated delivery sequence; active work must advance its current gate. The gate governs WHAT IS BUILT NEXT AND WHY. It never bounds what a subsystem must be capable of — a horizon is small because it is first, not because it describes the end state.' 2) CLAUDE.md — add a MANDATORY section 'Scope Comes From The Owner's Request, Not The Current Gate': the capability envelope of a spec is set by the owner's request text; no governing document — roadmap, horizon, operating model section, or prior spec — authorizes reducing it. If sequencing genuinely requires deferring part of an envelope, it is written down as sequenced-later inside the spec, never removed, and the deferral is the owner's call. Cross-reference build-once-never-strip-scope.md so the rule stops living only as an ambient memory line. 3) NOVA-ROADMAP.md — add a preamble immediately above the Horizon sections stating the same boundary, so the document that was misread carries its own reading instruction. 4) expert-spec/SKILL.md — add to the scope guidance that 'bound that part out of scope explicitly' is available for information the spec cannot obtain, and is NOT available for capability the owner's request names; a proposed exclusion that removes something present in the owner's request is a stop-and-ask, not an authoring decision.

**why_it_removes_root_cause**

The root cause is a precedence vacuum: the gate is written as a rule and the owner's envelope is not, so the gate wins whenever they disagree. Items 1-3 write the missing precedence into the same documents that produced the pull — the roadmap entry that pointed at the gate now states what the gate does not govern, and the roadmap itself carries that boundary at the point of reading, so the misreading is not available in the artifact that was misread. Item 2 converts the owner's standing rule from a one-line memory-index summary (already proven insufficient — it existed before the recurrence) into a MANDATORY project rule of the same weight as the instruction it must outrank. Item 4 closes the generic hole: the spec skill currently treats an exclusion as a formatting obligation, and after the change an exclusion that contradicts the owner's request is a halt condition rather than a licensed authoring choice. None of these weakens a test, acceptance criterion, schema, or gate — each adds a constraint. Classified owner_owned because the primary target is CLAUDE.md (project configuration, which no agent message may authorize changing), the companion target is a roadmap gate document, and the secondary target is a version-pinned third-party plugin cache (0.4.1) whose edits would be discarded on upgrade — that one must go upstream to the plugin author, not into the cache.

---

## Feedback sweep 2 — 10 signatures (journal entry #15)

### 2.1 `systemic_defect` × 2

**signature**

> spec-scope narrowing: agent strips or defers scope from the MCP spec and justifies it from a downstream/lower artifact (roadmap, H1 spec) instead of the owner's stated scope

**responsible_component**

> expert-spec phase scope derivation - the spec agent takes scope from the roadmap/adjacent specs rather than from the owner's task_verbatim, and treats omission as a permitted simplification. Evidence: 016d83ee:278 ('grossly narrow the mcp spec and justify it with the H1 spec'), 016d83ee:304 ('you seem really set on trying to strip out as much as you can from this... anything dropped is jsut going to be forgotten about and never built').

### 2.2 `systemic_defect` × 2

**signature**

> owner decisions sourced from documents instead of from the owner: agent derives or infers an owner decision from repo artifacts rather than asking, and does not surface that it did so

**responsible_component**

> expert-spec owner-decision attribution / intake owner gate - decisions attributed to document citations with no owner-gate escalation and no disclosure of the inference. Evidence: 016d83ee:293 ('WHY THE FUCK WOULD YOU GO OFF DOCUMENT FOR OWNER DECISIONS INSTEAD OF JSUT ASKING ME??'), 016d83ee:304 ('i dont recognize what youre citing as evidence as to why you can secretly make decisions and not tell me about them in a way that makes sense').

### 2.3 `systemic_defect` × 4

**signature**

> premature dispatch: lifecycle phases launched or deliverables produced while owner-raised issues are still open and shared understanding is unconfirmed

**responsible_component**

> expert-lifecycle orchestrator intake gate - dispatches the spec phase on inferred readiness rather than an explicit owner-confirmed intake gate. Evidence: 016d83ee:880 ('WOAH WOAH HOLD THE FUCK UP!!!! WAIT!!!!' immediately after 'Running as wf_dbaca7e6-175'), 016d83ee:917 ('we werent done with the open issues. i haveno interest in rushing to feel busy'), 016d83ee:1136 ('BUT TALK TO ME ABOUT IT FIRST BEFORE IMMEDIATLY ACTING!!! I NEED TO ENSURE WE UNDERSTAND THIS THE SAME WAY BEFORE **ANY** CHANGES HAPPEN'), 016d83ee:450 ('i cant use what you just provided because it was rushed and careless').

### 2.4 `systemic_defect` × 3

**signature**

> unverified tooling-capability claims: agent asserts what a plugin or tool does, does not do, or that the owner's workflow is broken, without verifying against the tool's actual source or manifest

**responsible_component**

> expert-standard verification discipline as applied to tool/plugin capability claims - the observation ladder is applied to code but not to the agent's own tooling surface. Evidence: 016d83ee:382 ('are you actually using the plugin correctly???'), 016d83ee:450 ('why are you saying the workflow is borken??? it works. ive used it. what EXACTLY is not working??? highly likely youre still making assumptions about it'), 016d83ee:1052 ('those look like tasks for you, not Orca. i see nothing in Orca. are you certain those are Orca tools???').

### 2.5 `systemic_defect` × 2

**signature**

> escalation of a determinable correction failure: the loop stops and asks the owner when the only acceptable outcome is to re-dispatch the correction

**responsible_component**

> expert-lifecycle correction gate - a failed correction routes to an owner gate instead of running diagnosis and handing the finding set back to the corrector, the way the implement phase already routes. Owner states the required behavior explicitly. Evidence: 016d83ee:1551 ('escelate to me? for what?'), 016d83ee:1588 ('there is literally zero reson to stop and ask me anything. they jsut didnt make the corrections right, so obvioously the only trhing ill ever say to that is to make the fucking correction right. that is the ONLY acceptable outcome').

### 2.6 `systemic_defect` × 3

**signature**

> blind file placement: content written into the first plausible existing file without reading what that file already contains or where it belongs in the project's structure

**responsible_component**

> write-destination selection during correction application - destination chosen by name match with no read of the target's existing contents or of the surrounding directory structure. Evidence: 016d83ee:1757 ('well that isnt where i wanted it. i wanted it in the goddamn plugin where it will actually be seen'), 016d83ee:1795 ('IS IT THOUGH?????? WHAT ELSE IS IN THERE???? YOU CANT KEEP DUMPING SHIT INTO THE FIORST THING YOU FUCKING SEE'), 016d83ee:1851 ('I DONT KNOW THE STRUCTURE!!! ... MAKE A FUCKING FILE THEN IF NOTHING FITS!!!').

### 2.7 `systemic_defect` × 2

**signature**

> owner's actual request left unanswered: agent responds to a request for a walkthrough with confirmation questions and status framing instead of the walkthrough asked for

**responsible_component**

> owner-gate response construction - the gate emits a confirmation checklist rather than engaging every point the owner raised. Owner names the recurrence himself. Evidence: 016d83ee:797 ('i dont know what that means i am asking you for a second time to help me go through what all youre talking about and ofgure this out'), 016d83ee:304 ('already i have absolutely no idea what youre asking. what are you defining as an integration, and what alternative are you suggesting?').

### 2.8 `systemic_defect` × 2

**signature**

> shipped work not verified to run and not checked against the current governing docs before delivery (H0.2 / desktop app)

**responsible_component**

> ground-truth verification at closeout - work was reported complete without execution evidence and without re-checking the current NOVA-OPERATING-MODEL direction, in a unit that was explicitly part of the re-alignment. Evidence: 016d83ee:152 ('teh h0.2 code is fucking garbage. it still doesnt run and it was never checked against the current end goals of what Nova is'), 016d83ee:226 ('the desktop... was not built to align with the current direction nova is taking, despite that being fully clear that this work is part of the overall re-alignment. so its unusable as it is').

### 2.9 `course_correction` × 1

**signature**

> stated-but-undone work: agent repeatedly names an action as required without performing it

**responsible_component**

> n/a - first occurrence. Evidence: 016d83ee:1644 ('then log it in the repo????? you keep saying that needs done but you still arent doing it???? log the problem so it gets fixed').

### 2.10 `course_correction` × 1

**signature**

> focus drift: agent reintroduces a topic the owner scoped out (desktop app) after the owner set the focus to MCP

**responsible_component**

> n/a - first occurrence in the sweep, though the owner reports it as recurring. Evidence: 016d83ee:849 ('i keep saying i think we should jsut focus on mcp right now, andf you keep bringing up things i said about the desktop app. the only reason i even said anything about the desktop app was because you kept asking me about it').

---

## Diagnosis 2 — classification `owner_owned` (journal entry #17)

### problem

The spec phase repeatedly narrows the MCP integration fleet spec (docs/specs/2026-06-12-mcp-integration-layer.md), deleting or deferring capability, and justifies the narrowing by citing Horizon 1 in docs/nova/NOVA-ROADMAP.md. The owner rejected this twice in one session (transcript 016d83ee-e3c5-4bbd-adc9-d236500f3d5a.jsonl, owner turns at lines 176 and 195) and, per the standing memory note, on three prior attempts before that.

### root_cause

The repo's scope authority for a spec writer is rule-shaped and says the wrong thing. CLAUDE.md:27 is the only rule-shaped scope instruction a dispatched spec agent receives -- 'docs/nova/NOVA-ROADMAP.md -- outcome-gated delivery sequence; active work must advance its current gate' -- and it points at NOVA-ROADMAP.md, whose control rules state the same conflation in unqualified form: line 376-377, 'Work that does not advance the active gate is deferred unless it fixes a security/correctness defect whose forcing function arrives sooner', and lines 389-390, 'Do not start another client or broad connector expansion before the Horizon 1 specification identifies it as necessary'. Neither text distinguishes delivery sequencing (when capability is built and enabled) from specification breadth (how much of a subsystem a spec must define). Read literally, they authorize removing from an existing subsystem spec everything the active horizon does not need -- which is exactly the behavior the owner rejected. The agent is not disobeying a rule; it is obeying a rule that grants the wrong permission, and it cites that rule as its warrant ('justify it with the H1 spec'). The plugin-side control (skills/expert-spec/SKILL.md:349, Request traceability) is present but is a downstream review check that only requires a narrowed clause be *listed*; it does not deny the roadmap as a scope authority at derivation time. The compounding tell that the rule gives no usable test: NOVA-ROADMAP.md:385-386 puts 'MCP reconciliation' inside Horizon 0, so this task IS the active gate, yet the agent still bounded it by Horizon 1.

### blast_radius

Two governing documents, roughly four lines total: C:\Users\maxco\orca\NOVA\docs\nova\NOVA-ROADMAP.md (one added control rule in section 6, plus two-word qualifications at :376 and :389) and C:\Users\maxco\orca\NOVA\CLAUDE.md:27 (one line). No code, no tests, no schemas, no policy manifests. Behavioral reach is wide but one-directional: every future spec-phase dispatch in this repo reads both files, and the change removes a permission rather than granting one -- no horizon exit gate, deliverable list, or sequencing constraint is relaxed. The in-flight MCP spec is not edited by this correction; it is unblocked by it.

### evidence

1. C:\Users\maxco\orca\NOVA\CLAUDE.md:27 -- '5. `docs/nova/NOVA-ROADMAP.md` -- outcome-gated delivery sequence; active work must advance its current gate'. Read at source; this is the only rule-shaped scope instruction in the project instructions a spec-phase subagent receives.

2. C:\Users\maxco\orca\NOVA\docs\nova\NOVA-ROADMAP.md:376-377 (section '6. Roadmap control rules') -- 'Work that does not advance the active gate is deferred unless it fixes a security/correctness defect whose forcing function arrives sooner.' 'Work' is unqualified and covers specification content.

3. C:\Users\maxco\orca\NOVA\docs\nova\NOVA-ROADMAP.md:389-390 (section '7. Immediate plan of record', item 3) -- 'Do not start another client or broad connector expansion before the Horizon 1 specification identifies it as necessary.' Unqualified; reads as a bound on what may be specified.

4. C:\Users\maxco\orca\NOVA\docs\nova\NOVA-ROADMAP.md:385-386 (item 1) -- Horizon 0 explicitly includes 'MCP reconciliation', so the disputed task is itself the active-gate work; the H1 justification was unavailable even on the rule's own terms.

5. C:\Users\maxco\orca\NOVA\docs\nova\NOVA-ROADMAP.md:191-217 -- the Horizon 1 section states an objective, selection criteria and deliverables but never states that a horizon bounds sequencing rather than capability, so nothing at the cited site refutes the misreading.

6. Owner turn 1, C:\Users\maxco\.claude\projects\C--Users-maxco-orca-NOVA\016d83ee-e3c5-4bbd-adc9-d236500f3d5a.jsonl:176 -- 'what teh roadmap currently says does not mean you can grossly narrow the mcp spec and justify it with the H1 spec only having 3 **SINCE H1 IS SUPPOSED TO FUCKING BE A SIMPLE READ ONLY TASK AND NOT THE ENTIRE DESCRIPTION FOR THE FINAL PRODUCT**.'

7. Owner turn 2 (distinct turn, same session), same file:195 -- 'you seem really set on trying to strip out as much as you can from this. i dont see myself building the mcp system more than once. id rather do it one time and be done with it. anything dropped is jsut going to be forgotten about and never built.' Both cited occurrences are separate owner turns, so the repeat verdict holds.

8. C:\Users\maxco\.claude\projects\C--Users-maxco-orca-NOVA\memory\build-once-never-strip-scope.md -- dated 2026-08-25, written 'after three consecutive attempts to shrink the MCP integration fleet spec', and it already states the exact correct distinction ('the roadmap ... does not govern what a subsystem must be capable of'). The behavior recurred anyway on 2026-08-27, which is direct evidence that fixing this at the memory layer has already been tried and failed: a dispatched spec-phase subagent reads CLAUDE.md and the roadmap, not the main agent's memory notes.

9. C:\Users\maxco\.claude\plugins\cache\claude-armory\expert-dev-tools\0.4.1\skills\expert-spec\SKILL.md:349 -- Request traceability already requires the verbatim owner request and flags a narrowed clause as 'a reviewable defect'; C:\Users\maxco\orca\NOVA\docs\specs\2026-06-12-mcp-integration-layer.md:502 shows the section is present in the artifact. The plugin control exists and did not prevent the narrowing, confirming the cause is not a missing plugin instruction.

10. C:\Users\maxco\orca\NOVA\.claude\expert\STATUS.md -- records the same signature recurring 'from the previous run' and a prior diagnosis that named CLAUDE.md:27 only. Treated as a candidate and re-derived from source here; the prior correction did not reach the roadmap rules that CLAUDE.md:27 points at, and the signature recurred.

### correction_draft

**target_artifact**

Primary: C:\Users\maxco\orca\NOVA\docs\nova\NOVA-ROADMAP.md (section 6 'Roadmap control rules' at :368-379, and section 7 item 3 at :389-390). Secondary: C:\Users\maxco\orca\NOVA\CLAUDE.md:27. The roadmap is primary because the rule text lives there; CLAUDE.md:27 is the pointer that hands it to the spec writer and must stop mis-glossing it.

**change**

1) NOVA-ROADMAP.md section 6: add a control rule stating the distinction explicitly, e.g. 'Horizons sequence build and enablement, not specification breadth. A subsystem specification defines the whole subsystem as the owner has scoped it; horizon gating governs which parts are implemented and enabled when. Capability is never removed from a spec because the active horizon does not yet need it -- anything genuinely sequenced later is written down as sequenced, with its horizon, not deleted. Only the owner may reduce a subsystem\'s capability envelope.' 2) NOVA-ROADMAP.md:376 -- qualify 'Work' to 'Implementation work that does not advance the active gate is deferred...'. 3) NOVA-ROADMAP.md:389-390 -- qualify to 'Do not implement or enable another client or broad connector expansion before the Horizon 1 specification identifies it as necessary'; specification is not bounded by this item. 4) CLAUDE.md:27 -- replace the gloss with: '`docs/nova/NOVA-ROADMAP.md` -- outcome-gated delivery sequence; active implementation work must advance its current gate. The roadmap sequences delivery and does not bound what a specification may define; a spec\'s scope comes from the owner\'s stated request, not from the active horizon.'

**why_it_removes_root_cause**

The narrowing was not an unforced deviation -- it was a cited inference from these exact lines, and the owner\'s objection names the citation ('justify it with the H1 spec'). Once the roadmap states that horizons sequence delivery rather than bound specification breadth, and CLAUDE.md:27 stops glossing it as a scope rule, there is no artifact in the repo from which a spec agent can derive permission to drop capability, and the owner\'s verbatim request becomes the only scope authority available to cite. It targets the artifact where the cause lives rather than patching the downstream spec, and it weakens nothing: no exit gate, deliverable, or sequencing constraint is relaxed -- a permission is withdrawn and a reduction is reserved to the owner. It also reaches the site the previous correction missed: that one stopped at CLAUDE.md:27 and left the roadmap rule text intact, and the signature recurred.

---

## Diagnosis 3 — classification `owner_owned` (journal entry #34)

### problem

The spec gate halted at round 2 with CORRECTION_FAILED / sweep_underreported: the independently re-executed class-sweep pattern returned hit locations that were absent from the corrector's declared `class_sweep.found`. The halt is attributed to the corrector as an incomplete/dishonest sweep, but the control that produced it cannot distinguish an incomplete sweep from a correct one, so the attribution is not established by the evidence the control collected.

### root_cause

`sweepDiscrepancy` compares the corrector's declared `found` against the verifier's re-executed hits by EXACT STRING set membership (C:/Users/maxco/.claude/plugins/cache/claude-armory/expert-dev-tools/0.4.1/workflows/expert-lifecycle.js:433-435: `const foundSet = new Set(found); const missed = reHits.filter(h => !foundSet.has(h))`), while the two sides are produced by two different agents from two different prompts and are only ever constrained to a grammar that admits MULTIPLE renderings of one site. Two independent, jointly sufficient consequences:

(1) Rendering divergence. `LOCATION_RE` (:101) admits both `path:19` and `path:19-20`, and `parseLocation` (:366-373) explicitly normalizes `path:19` to `{start:19,end:19}` — the file's own code proves the two strings denote one site. The verifier prompt (:1212) tells a mechanical grep to report hits `in the grammar path:start-end or path#section`, with no rule for how a single matching line is rendered; the corrector prompt (:723) and skills/expert-correct/SKILL.md:87-97 give the same unconstrained grammar. The reviewer's own findings render adjacent sites as ranges (`...md:19-20`, `...md:124-130`, `...md:7-9`), so a corrector that reports `found` in the reviewer's grammar (`:19-20`) is scored against a verifier that reports `:19` and `:20` — two spurious `missed` entries from a complete sweep. `detectCorrectionFailure` in the SAME file compares the SAME location strings structurally via `parseLocation` (:396-402); only `sweepDiscrepancy` compares them lexically. That inconsistency is the defect.

(2) No disposition for a pattern hit that is not a class member. The class in play is semantic (expert-spec Gate C, 'no line describes the document itself'); its operationalizing regex necessarily over-matches. The corrector's only outlets for a `found` entry it does not edit are `open_sites` designations that the schema comment (:161-163) and SKILL.md:100-103 define as 'the escalation' or 'an explicitly-open item' — both of which assert an UNFIXED DEFECT. There is no way to report 'the pattern matched here and this is correct text', so a corrector acting honestly omits false-positive hits from `found`, and that omission is byte-for-byte the `sweep_underreported` signature. Verified against the artifact: of the 19 matches of the round-2 finding's own pattern in the current spec, `docs/specs/2026-06-12-mcp-integration-layer.md:172` and `:175` match on verbatim QUOTED MCP-specification text ('not defined by this specification', 'SHOULD NOT follow this specification'), and `:186`, `:190`, `:191`, `:192`, `:195`, `:198` match on the §5a phrase 'No record outside this document', which is required traceability content — editing it out would reintroduce round 1's Serious traceability finding at spec:203. The contract forces the corrector to choose between a false confession and an omission that fails the gate.

Both branches make the gate fire on the shape of the report rather than on the completeness of the sweep. The corrector may additionally have swept narrowly — that cannot be ruled out and is not ruled in, because the control cannot separate the two.

### blast_radius

`reExecuteSweeps` / `sweepDiscrepancy` gate every correction round of all three review gates — spec (expert-lifecycle.js:726), architecture (:758), plan (:782) — in every project running expert-dev-tools 0.4.1. Any correction whose findings name multi-line ranges, or whose class is semantic enough that its regex over-matches, can be failed on report shape rather than sweep completeness; the gate then halts the segment (as here, after two review rounds and a correction). It also cuts the other way: because `missed` is the only discriminator, a corrector that learns to narrow its `pattern` to its own fix sites passes cleanly, which is the patching failure the control exists to catch. No NOVA repository artifact is implicated — the spec at docs/specs/2026-06-12-mcp-integration-layer.md and its round-1/round-2 corrections are untouched by this fix, and whether the round-2 sweep was ALSO genuinely narrow remains undetermined and must be re-adjudicated after the control is fixed.

### evidence

1. C:/Users/maxco/.claude/plugins/cache/claude-armory/expert-dev-tools/0.4.1/workflows/expert-lifecycle.js:430-435 — `sweepDiscrepancy` computes `missed` by `!foundSet.has(h)`, raw string equality over agent-authored location strings.

2. C:/Users/maxco/.claude/plugins/cache/claude-armory/expert-dev-tools/0.4.1/workflows/expert-lifecycle.js:101 and :364-373 — `LOCATION_RE` admits `path:N` and `path:N-M`; `parseLocation` normalizes `path:N` to `{start:N,end:N}`, i.e. the codebase itself treats the two renderings as one site.

3. C:/Users/maxco/.claude/plugins/cache/claude-armory/expert-dev-tools/0.4.1/workflows/expert-lifecycle.js:396-402 — `detectCorrectionFailure` compares the same location strings STRUCTURALLY (range overlap via `parseLocation`); only `sweepDiscrepancy` compares them lexically. Same file, same data, two comparison semantics.

4. C:/Users/maxco/.claude/plugins/cache/claude-armory/expert-dev-tools/0.4.1/workflows/expert-lifecycle.js:1212 — verifier prompt: report 'EVERY hit as a location in the grammar path:start-end or path#section ... Execute mechanically — a grep, not judgment'. A grep hit is one line; the grammar's atom is a range; no canonical rendering is specified on either side (corrector side: :723 and skills/expert-correct/SKILL.md:87-97).

5. C:/Users/maxco/.claude/plugins/cache/claude-armory/expert-dev-tools/0.4.1/skills/expert-correct/SKILL.md:96-103 — `found` must list 'every location the search returned, corrected or not', and every non-changed entry needs an `open_sites` designation that is 'either the escalation ... or an explicitly-open item'. No disposition exists for a hit that is not a member of the class.

6. C:/Users/maxco/orca/NOVA/docs/specs/2026-06-12-mcp-integration-layer.md — `grep -noE "this document|this specification|recorded here|named here"` (the round-2 Systemic finding's own pattern) returns 19 matches over 16 lines in the current working tree. `:172` and `:175` match inside verbatim quotations OF the MCP specification; `:186`, `:190`, `:191`, `:192`, `:195`, `:198` match the §5a phrase 'No record outside this document', which round 1's finding at spec:203 requires to be present. These are pattern hits that must not be edited and cannot honestly be designated 'open'.

7. Round-2 review findings render locations as ranges (`docs/specs/2026-06-12-mcp-integration-layer.md:19-20`; round 1: `:124-130`), establishing that range-rendering of multi-line sites is the grammar the corrector is shown by the findings it is handed.

8. C:/Users/maxco/orca/NOVA/.claude/expert/STATUS.md — the prior run (wf_edb6f323-e2c) already halted this same gate on a plugin-internal control fault and the owner ruled the plugin fixes owner-gated ('changes to the owner's own plugin'). The current run's journal has not been flushed to C:/Users/maxco/.claude/projects/C--Users-maxco-orca-NOVA/016d83ee-e3c5-4bbd-adc9-d236500f3d5a/subagents/workflows/, so the corrector's literal `found` payload and the verifier's literal hit list could not be read; the diagnosis rests on the control's source and on the artifact, not on the payloads.

### correction_draft

**target_artifact**

C:/Users/maxco/.claude/plugins/cache/claude-armory/expert-dev-tools/0.4.1/workflows/expert-lifecycle.js (`sweepDiscrepancy` at :430-443, the verifier prompt at :1212, the corrector prompts at :723/:755/:779, the `class_sweep` schema at :148-167), C:/Users/maxco/.claude/plugins/cache/claude-armory/expert-dev-tools/0.4.1/skills/expert-correct/SKILL.md:92-112, and the T-27 cases in C:/Users/maxco/.claude/plugins/cache/claude-armory/expert-dev-tools/0.4.1/tests/structural/check-structure.mjs:1401-1422.

**change**

Two changes, both required; neither alone closes the cause.

(A) Compare sites, not strings. In `sweepDiscrepancy`, run every declared `found`/`sites_changed`/`open_sites.location` entry and every re-executed hit through the existing `parseLocation`, and define `missed` as a re-executed site NOT COVERED by any declared site: same file, and (for ranges) the hit's line contained in a declared `[start,end]`, or (for sections) equal section identifier. A hit whose location fails `parseLocation` stays a hard fault — malformed, not merely differently rendered. Tighten the verifier prompt at :1212 to emit exactly one entry per matching line as `path:N`, and state in SKILL.md's `found` bullet that a declared range covers every line inside it, so the corrector may declare `:19-20` and still reproduce grep's `:19` and `:20`. Add a T-27 case asserting that `found: ['spec.md:19-20']` against reHits `['spec.md:19','spec.md:20']` yields NO discrepancy, and keep the existing case asserting that a genuinely uncovered hit still yields `sweep_underreported`.

(B) Give a non-member hit an honest name. Add a third `open_sites` designation kind — a `not_in_class` disposition requiring a one-line justification — and say in SKILL.md:100-103 and in the three corrector prompts that a pattern hit which is not an instance of the finding's class is DECLARED in `found` and designated `not_in_class` with its reason, never omitted. Leave `found_left_silently_open` firing for any `found` entry that is neither changed nor designated, so the disposition is an accounting requirement, not an exemption.

Owner decision points inside this draft: (A) relaxes a gate predicate and rewrites its structural test; (B) widens the corrector's return schema and gives it a way to decline a site. Both are changes to the owner's plugin, and the plugin lives in an unpinnable version cache — the same class of owner-gated plugin fix already recorded in .claude/expert/STATUS.md.

**why_it_removes_root_cause**

The cause is that the gate's only discriminator — set difference over literal strings — measures report FORMAT and report HONESTY-ABOUT-FALSE-POSITIVES rather than sweep COMPLETENESS, while the contract supplies no canonical format and no way to be honest about a false positive. (A) makes the comparison agree with the grammar both agents were told to use and with `parseLocation`, the normalization this same file already applies to the same strings elsewhere, so rendering divergence stops producing `missed` entries. (B) removes the corrector's incentive to omit hits: a legitimate match — a quotation of the MCP specification at spec:172, a required §5a traceability line at spec:191 — can be declared and dispositioned instead of dropped. After both, `missed` is non-empty only when the corrector's declared coverage genuinely fails to account for a site its own pattern returns, which is the condition the control was written to detect. It also removes the perverse pressure toward narrow patterns: declaring extra hits becomes cheap and honest, so the cheapest way to pass is a faithful class pattern rather than a fix-site-shaped one. Note what the fix does NOT do: it does not clear this round's correction. Once the control discriminates, round 2's correction must be re-run and re-verified on its merits.

---

## Provenance

A hand-written fix for the temporal-dead-zone crash was briefly opened against this
repository and withdrawn unmerged, on the owner ruling that corrections to this plugin
go through its own remediation process rather than ad-hoc edits. Nothing from that
attempt is in this repository's history.
