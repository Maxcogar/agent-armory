# Open defects — expert-dev-tools

> **Standing list of defects found and NOT yet fixed.** Not a record of a finished
> effort. Nothing here is closed unless its entry says so and names the commit.
>
> **Everything below is the verbatim output of this plugin's own feedback sweep and
> diagnostician agents.** Reproduced exactly as they returned it — not summarised,
> reworded, or re-ordered. Generated directly from the run journals.
>
> Source: three consecutive runs against `Maxcogar/NOVA` on 2026-08-27, plugin
> 0.4.1, registry-recorded commit `fc745464ef7b62997fdde243c491b2903d7e8cc8`.
>
> **Fixing an entry:** through this plugin's own correction process — remediation
> plan, review rounds, implementation, version bump, commit, signature marked
> corrected. Not by hand-editing the workflow.

---

# Run `wf_edb6f323-e2c`

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

# Run `wf_a480c37f-da5`

## Feedback sweep 3 — 14 signatures (journal entry #1)

### 3.1 `systemic_defect` × 2

**signature**

> Spec scope narrowed — MCP capability stripped, cut, or deferred instead of specified once in full; Horizon 1's deliberately small three-source scope used as evidence for sizing the whole MCP transport layer

**responsible_component**

> expert-dev-tools:expert-spec (scope-envelope setting during spec authoring)

### 3.2 `systemic_defect` × 2

**signature**

> Owner-owned decision resolved by deriving it from documents or from an assistant's prior transcription instead of asking the owner; changes proposed before confirming a shared understanding of the request

**responsible_component**

> expert-dev-tools:expert-spec (requirement provenance / owner-decision sourcing)

### 3.3 `systemic_defect` × 4

**signature**

> Artifact mutated without authorization — fast edits made to land a change before reading the situation, content appended to the first file that looked plausible, plugin source damaged and a branch destroyed

**responsible_component**

> main agent under expert-dev-tools:expert-standard (authorization axis)

### 3.4 `systemic_defect` × 4

**signature**

> Plugin defect patched by hand in the local plugin cache or via an ad hoc PR instead of routed through the plugin's own correction path so the fix survives the next plugin update

**responsible_component**

> expert-dev-tools:expert-lifecycle (correction application and routing to plugin source)

### 3.5 `systemic_defect` × 4

**signature**

> Known-defect record not logged when instructed, logged to a location the owner did not want, then deleted along with the branch that carried it

**responsible_component**

> expert-dev-tools:expert-lifecycle (defect-record persistence outside branch lifetime)

### 3.6 `systemic_defect` × 3

**signature**

> Owner asked to decide something the system was built to correct itself — escalation raised on a failed correction where the only acceptable outcome is redoing the correction

**responsible_component**

> expert-dev-tools:expert-lifecycle correction gate (CORRECTION_FAILED routes to owner rather than back to the corrector)

### 3.7 `systemic_defect` × 2

**signature**

> Turn ended and work halted while the owner was actively issuing direction, instead of continuing on the instruction already given

**responsible_component**

> expert-dev-tools:expert-lifecycle halt behavior with hooks/continuation-gate.mjs

### 3.8 `systemic_defect` × 2

**signature**

> Diagnostic-system output paraphrased into the agent's own wording when recording issues, rather than written down verbatim as the diagnosis produced it

**responsible_component**

> expert-dev-tools:expert-lifecycle (diagnosis-to-record fidelity)

### 3.9 `systemic_defect` × 4

**signature**

> Claim about the plugin or tooling stated from assumption rather than verified — wrong plugin version read, workflow declared broken when it works, tools presented as Orca tools that are not

**responsible_component**

> main agent under expert-dev-tools:expert-standard (unverified-premise axis)

### 3.10 `systemic_defect` × 2

**signature**

> Focus drifted off the stated unit of work — a topic the owner had closed (the desktop app) repeatedly re-raised, and open intake issues left unresolved while moving on

**responsible_component**

> expert-dev-tools:expert-lifecycle intake

### 3.11 `systemic_defect` × 2

**signature**

> Work product delivered rushed and careless, unusable as given, without the proper review the workflow requires

**responsible_component**

> main agent (deliverable quality before hand-off)

### 3.12 `systemic_defect` × 2

**signature**

> Owner's direct question not answered — a different or adjacent question answered instead

**responsible_component**

> main agent under expert-dev-tools:expert-standard (engage every point of the owner's turn)

### 3.13 `systemic_defect` × 2

**signature**

> H0.2 desktop deliverable does not run and was never checked against Nova's current direction despite realignment being the stated frame of that work

**responsible_component**

> NOVA H0.2 desktop implementation (prior lifecycle run)

### 3.14 `course_correction` × 1

**signature**

> Spec places failure recovery on the owner — a dropped MCP server is reported as the owner's task instead of self-healing silently, with notification only when reconnection will take noticeable time

**responsible_component**

> expert-dev-tools:expert-spec (drafted MCP spec recovery requirement A5)

---

## Diagnosis 4 — classification `owner_owned` (journal entry #3)

### problem

Across at least two owner turns in this task, spec authoring narrowed the MCP integration layer's capability envelope — stripping, cutting, or deferring capability — and justified the smaller size with Horizon 1's deliberately three-source read-only scope. The owner rejected this each time ('what teh roadmap currently says does not mean you can grossly narrow the mcp spec and justify it with the H1 spec only having 3'; 'i dont see myself building the mcp system more than once... anything dropped is jsut going to be forgotten about and never built'). The repeat is the failure, not the narrowing itself: guardrails against exactly this already existed in the project and in project memory before the recurrence.

### root_cause

expert-spec's authoring procedure never names the moment at which the subject system's capability envelope is set, and never names who owns it. C:\Users\maxco\.claude\plugins\cache\claude-armory\expert-dev-tools\0.4.1\skills\expert-spec\SKILL.md runs 362 lines and contains no occurrence of 'owner', 'authoriz', 'roadmap', 'milestone', or 'MVP'. Three properties of the procedure combine into the defect: (1) line 119 licenses resolving ambiguity from 'the project's existing context' without asking — a roadmap horizon table is project context, so H1's three sources become admissible evidence for sizing the whole layer; (2) lines 75 and 227 hand the author 'bound that part out of scope explicitly, so the spec is complete for what remains' as a first-class resolution path for anything it cannot ground, making narrowing the cheapest way to finish, and line 211 asks only that exclusions carry 'reasoning' — never an owner citation; (3) the one owner-binding control, the Request traceability section at line 349, binds the spec to the clauses of the owner's verbatim request. An envelope narrowed by inference drops no request clause, so it produces no traceability entry and passes the gate looking complete. Because the decision point is unnamed, the author fills it from whichever project document is most available. The existing guardrails all sit downstream of that point — NOVA-OPERATING-MODEL.md:722 ('Reducing the scope of an approved specification... is an owner decision'), NOVA-OPERATING-MODEL.md:749 ('Roadmap horizons... never establish what a subsystem must be capable of'), the spec's own §0/§5a O-8, and the user memory note build-once-never-strip-scope.md — and none of them is a step inside the authoring procedure a fresh spec dispatch executes. That is why the correction from the first occurrence (recorded 2026-08-25, itself already after 'three consecutive attempts to shrink the MCP integration fleet spec') did not prevent the second: it landed in artifact prose, a governing document, and personal memory, none of which changes what the authoring agent does at the moment it picks a size.

### blast_radius

The root-cause artifact is C:\Users\maxco\.claude\plugins\cache\claude-armory\expert-dev-tools\0.4.1\skills\expert-spec\SKILL.md — a vendored, version-pinned plugin outside this repository. Editing it changes the behavior of every spec dispatch in every project on this machine, not just NOVA, and the edit is silently reverted on the next expert-dev-tools upgrade. The optional project-local mirror (CLAUDE.md plus the spec review gate) is repo-scoped and affects all future NOVA specs. No source code, test, or schema is touched by either.

### evidence

1. C:\Users\maxco\.claude\plugins\cache\claude-armory\expert-dev-tools\0.4.1\skills\expert-spec\SKILL.md:75 and :227 — 'bound that part out of scope explicitly, so the spec is complete for what remains' offered as an author-side resolution path, with no owner authorization required

2. C:\Users\maxco\.claude\plugins\cache\claude-armory\expert-dev-tools\0.4.1\skills\expert-spec\SKILL.md:119 — ambiguity may be resolved from 'the input, referenced files, or the project's existing context' without asking; a roadmap horizon table qualifies

3. C:\Users\maxco\.claude\plugins\cache\claude-armory\expert-dev-tools\0.4.1\skills\expert-spec\SKILL.md:211 — "What's in scope and what's out? Out-of-scope items stated explicitly with reasoning" — reasoning, not owner citation, is the whole bar

4. C:\Users\maxco\.claude\plugins\cache\claude-armory\expert-dev-tools\0.4.1\skills\expert-spec\SKILL.md:349 — Request traceability binds clauses of the verbatim request only; a capability envelope narrowed by inference drops no clause and so generates no entry

5. grep over the full 362-line SKILL.md for 'owner|authoriz|roadmap|milestone|incremental|later phase|first version|v1|MVP' returns exactly one hit (line 349) — the skill has no concept of scope authority and no named prohibition on sequencing-as-sizing

6. C:\Users\maxco\orca\NOVA\NOVA-OPERATING-MODEL.md:722 — 'Reducing the scope of an approved specification — cutting, narrowing, or deferring a requirement... is an owner decision, recorded in the specification as sequenced, never removed from it' (already present; downstream of authoring)

7. C:\Users\maxco\orca\NOVA\NOVA-OPERATING-MODEL.md:749 — 'Roadmap horizons sequence what is built next and why. They never establish what a subsystem must be capable of.' (already present; downstream of authoring)

8. C:\Users\maxco\orca\NOVA\docs\specs\2026-06-12-mcp-integration-layer.md:15, :18, :197, :519-520 — the artifact already carries the anti-narrowing rule and quotes O-8 verbatim, i.e. the first correction was fully absorbed into the artifact and the complaint recurred anyway

9. C:\Users\maxco\.claude\projects\C--Users-maxco-orca-NOVA\memory\build-once-never-strip-scope.md — first correction recorded 2026-08-25 as user memory after 'three consecutive attempts to shrink the MCP integration fleet spec'; states the exact mechanism ('using Horizon 1's deliberately tiny three-source scope as evidence for sizing the whole MCP transport layer'). A memory note is not a step in the authoring procedure.

10. C:\Users\maxco\orca\NOVA\CLAUDE.md — no anti-narrowing or scope-authority rule anywhere in the project instruction file that every dispatched agent does load

11. C:\Users\maxco\orca\NOVA\.claude\expert\ledger.json — signature_history is empty and feedback_marker is {session_file: null, line: 0}: the first occurrence of this complaint signature was never recorded in the ledger, so no mechanism existed to detect the repeat before the owner did

### correction_draft

**target_artifact**

C:\Users\maxco\.claude\plugins\cache\claude-armory\expert-dev-tools\0.4.1\skills\expert-spec\SKILL.md (primary — where the cause lives). Durable mirror, if the owner prefers repo scope over editing vendored plugin content: a MANDATORY section in C:\Users\maxco\orca\NOVA\CLAUDE.md plus a spec-gate review criterion.

**change**

Add a named step to the authoring procedure, before requirements are written, and extend two existing controls.

(A) New step — 'Establish the capability envelope', placed with steps 1-2 (SKILL.md ~line 100-125):
  1. The subject system's capability envelope — how much it must be able to do — is owner-owned. The author never sets it, never reduces it, and never derives it by inference.
  2. Admissible evidence for the envelope, exhaustively: the owner's verbatim words; a prior owner-approved version of the same spec; an explicit owner-recorded sequencing decision.
  3. Inadmissible evidence, named so it cannot be reached for: delivery-sequence artifacts (roadmaps, horizons, phases, milestones, 'plan of record'), the scope of a smaller adjacent spec, and the author's own effort or feasibility judgment. Sequencing states what is built next and why; it never states what a subsystem must be capable of.
  4. When the input is a revision, reconciliation, or re-grounding of an existing spec, the prior version's envelope carries forward unchanged unless the owner's verbatim request removes something. Re-layering, re-wording, or re-grounding a requirement is permitted; shrinking the envelope is not.

(B) Close the escape hatch at :75 and :227 — 'bound that part out of scope explicitly' becomes available only for something the owner has bounded out, cited verbatim. Otherwise the honest paths are the two that remain: ask once, or stop. Amend :211 so every out-of-scope entry carries an owner citation, not merely 'reasoning'.

(C) Extend Request traceability at :349 with a mandatory envelope block: state the envelope, quote the owner evidence that set it, and list every capability present in a prior version of the spec and absent now, each with the owner authorization for its removal. A missing or unquoted entry is a reviewable defect, and the spec-gate reviewer is instructed to check this block first.

**why_it_removes_root_cause**

The narrowing occurs at a decision the current procedure never names — the moment the author picks a size for the subject system. Unnamed, that decision gets filled from the most available project document, which is why a roadmap horizon ended up sizing a transport layer, twice. (A) names the decision and restricts its admissible evidence, converting the specific inference the owner rejected into an explicitly forbidden move. (B) removes the incentive: narrowing is currently the cheapest sanctioned way to finish a spec the author cannot fully ground. (C) makes the envelope visible to the gate, which today only checks request clauses — so an inferred narrowing produces no defect marker and reaches the owner looking complete. The existing guardrails at NOVA-OPERATING-MODEL.md:722 and :749 already state the rule correctly and still failed to prevent occurrence 2, because a rule stated in a governing document is not a step the authoring agent executes; this correction puts the rule inside the procedure. Secondary, and separable: ledger.json's empty signature_history and null feedback_marker meant the first occurrence was never recorded, so the repeat was detected by the owner rather than by the lifecycle — worth the orchestrator's attention independently of this fix.

---

## Diagnosis 5 — classification `machine_applicable` (journal entry #11)

### problem

The spec-gate correction round halted at round 1 with 6 of 7 findings corrected. Finding 7 (output-contract-deviation) says the artifact's filename lacks the `spec-` prefix that expert-spec's Output section fixes. Closing it requires a filesystem rename, and the corrector's tool grant (Read, Grep, Glob, Edit, Skill, WebFetch, WebSearch, Context7) contains no tool that can create, move, or rename a file. The corrector was right to halt rather than patch a filename defect at a text site.

### root_cause

A capability/finding-class mismatch built into the lifecycle, not a corrector failure. The review phase is permitted to emit findings whose only valid remedy is a repository-level path operation (output-contract-deviation on the artifact's own filename), while the correction phase is deliberately scoped to in-document re-derivation and is granted no filesystem-mutation tool. Nothing in the loop routes a path-level finding to a party that can execute a path-level change, so any such finding halts the loop at round 1 deterministically, regardless of corrector competence. The upstream enabler: this pre-existing artifact was adopted into the lifecycle and registered in the ledger's artifact_index at `docs/specs/2026-06-12-mcp-integration-layer.md` — a path the expert-spec output contract forbids — with no intake step that normalizes the artifact path to the contract before the review gate opens. The naming deviation was baked in at ledger-registration time and was guaranteed to surface as an uncorrectable finding at the first review round.

### blast_radius

18 files, in two classes that must be treated differently. LIVE-AUTHORITY references that must be updated with the rename: .claude/expert/ledger.json (artifact_index[0].path — the path the orchestrator itself holds for this gate), .claude/expert/STATUS.md (lines 6 and 66), NOVA-BACKLOG.md:19, docs/arch/architecture-2026-06-12-mcp-integration-layer.md:4 ('Derived from'), and the two .claude/plans/ documents if either is still active. HISTORICAL RECORDS that must NOT be rewritten: docs/reviews/2026-06-12-mcp-integration-layer/review-01-of-8028a04.md, review-02-of-d3665cb.md, dispatch-prompt.md, docs/reviews/t7-plan-derived-anchor/review-02 and review-03a, the four .claude/handoffs/ files, docs/audits/2026-06-18/cnc-hub-fabrication-findings.md, and .claude/skill-observations/log.md — per docs/reviews/README.md these are verbatim evidence of what was reviewed at that path. One sub-decision is not purely mechanical: docs/reviews/README.md specifies 'One directory per artifact under review, named after the artifact', so the review directory should be `git mv`'d alongside the artifact; a directory move preserves the round files' bytes and therefore does not violate the verbatim rule. Latent same-defect neighbours (out of scope for this gate, flag for the architecture gate): docs/arch/architecture-2026-06-12-mcp-integration-layer.md and the two other non-prefixed specs in docs/specs/ carry the same intake defect.

### evidence

1. C:\Users\maxco\.claude\plugins\cache\claude-armory\expert-dev-tools\0.4.1\skills\expert-spec\SKILL.md, '## Output' section, read directly: 'Write the spec as a markdown document named `spec-[kebab-case-name].md` under `docs/specs/`, creating that directory if it does not exist. This location is fixed, not conditional.' The contract the finding names is real and verbatim as quoted.

2. `ls docs/specs/` returns 2026-05-06-phase5-desktop-client.md, 2026-05-13-nova-skill-system.md, 2026-06-12-mcp-integration-layer.md, spec-operational-briefing-commitment-risk-loop.md, spec-phase2-persistence-context.md. The artifact does not carry the prefix; two siblings do, so this is not a uniform project convention that could be argued as superseding — but two other siblings also deviate, showing the defect is latent across pre-lifecycle specs, not unique to this artifact.

3. `grep -rl "2026-06-12-mcp-integration-layer" . --exclude-dir=.git` returns 18 paths (the artifact plus 17 referencing files), confirming the corrector's count exactly: .claude/expert/ledger.json, .claude/expert/STATUS.md, 4 files under .claude/handoffs/, 2 under .claude/plans/, .claude/skill-observations/log.md, docs/arch/architecture-2026-06-12-mcp-integration-layer.md, docs/audits/2026-06-18/cnc-hub-fabrication-findings.md, 4 files under docs/reviews/2026-06-12-mcp-integration-layer/ and docs/reviews/t7-plan-derived-anchor/, NOVA-BACKLOG.md.

4. C:\Users\maxco\orca\NOVA\docs\reviews\README.md, '## Rules': 'Verbatim. The reviewer's output is copied unedited' and 'One file per round. Never overwrite a prior round'. This makes a blind repo-wide find/replace across the 17 referents wrong: the persisted review rounds, dispatch prompt, handoffs, and the 2026-06-18 audit are historical records of what was reviewed at a named path, and editing their text corrupts the record the README exists to protect.

5. Segment-start ledger snapshot: artifact_index[0].path is the old path and sha256 is all zeros, so no recorded content hash is invalidated by a path change; the ledger edit is a path-string edit only. artifact_index[0].approved_by_owner is false, so no owner approval is attached to the old path.

### correction_draft

**target_artifact**

Primary (this segment): the artifact path itself plus the ledger entry that records it — C:\Users\maxco\orca\NOVA\docs\specs\2026-06-12-mcp-integration-layer.md and C:\Users\maxco\orca\NOVA\.claude\expert\ledger.json. Secondary (removes the recurrence): the lifecycle's gate-entry step in expert-lifecycle, which registers an artifact in artifact_index without checking its path against the producing skill's output contract.

**change**

Orchestrator-executed, in one commit: (1) `git mv docs/specs/2026-06-12-mcp-integration-layer.md docs/specs/spec-mcp-integration-layer.md`; (2) `git mv docs/reviews/2026-06-12-mcp-integration-layer docs/reviews/spec-mcp-integration-layer` (directory move only — round file contents untouched, satisfying the verbatim rule); (3) update the live-authority references only: ledger.json artifact_index[0].path, .claude/expert/STATUS.md:6 and :66, NOVA-BACKLOG.md:19, docs/arch/architecture-2026-06-12-mcp-integration-layer.md:4, and the two .claude/plans/ files if active — leaving the persisted reviews, dispatch prompt, handoffs, audit, and skill-observations log byte-identical as historical record; (4) re-dispatch the round-1 correction with the single remaining finding scoped to 'verify the artifact now satisfies the expert-spec Output contract', or dispatch the round-2 review directly against the new path. Do NOT take the third option the corrector listed (owner waives the filename contract) without routing it to the owner — a waiver of a named contract is owner_owned by definition and is not the recommended route, since two siblings already conform and the rename is cheap. Recurrence fix: at gate entry, the orchestrator validates the candidate artifact path against the producing skill's output contract and normalizes it before the first review dispatch, so a path-level deviation can never enter the review loop as a finding the corrector is structurally unable to close.

**why_it_removes_root_cause**

The halt was caused by a finding whose remedy lies outside the correction phase's granted capability. Executing the move at the orchestrator level — the one participant that holds both filesystem tools and the ledger — closes the finding at the artifact where the defect actually lives (the filename), not at a downstream text site, and keeps the ledger's path coherent with the artifact in the same commit so the gate does not resume against a stale path. Adding the gate-entry path check removes the class: the deviation is normalized at intake, before any review round can raise it, so no future correction round can be handed a finding it has no tool to act on. Neither change touches a test, acceptance criterion, schema, or gate — the rename enforces an existing contract rather than weakening one, which is why this is machine_applicable rather than owner_owned.

---

# Run `wf_a7bf9684-c26`

## Feedback sweep 4 — 10 signatures (journal entry #1)

### 4.1 `failed_correction` × 4

**signature**

> instruction-reinterpretation: owner's stated request is silently narrowed, redefined, or replaced with an assumed intent

**responsible_component**

> orchestrator intake / expert-standard fidelity clause + task_verbatim interpolation (fixed_in_version 0.4.0, present in running 0.4.1)

### 4.2 `failed_correction` × 5

**signature**

> questions-treated-as-work-orders: owner asks a question or wants discussion and the agent starts editing/changing artifacts without authorization

**responsible_component**

> expert-standard skill authorization axis + commands/expert.md section 0 INTERROGATIVE/DIRECTIVE classification and section 4b gate-discussion rule (fixed_in_version 0.3.0, present in running 0.4.1)

### 4.3 `failed_correction` × 5

**signature**

> agent-quits-midtask: session stops or stalls awaiting owner input instead of continuing the assigned investigation/correction

**responsible_component**

> expert-lifecycle continuation/halt policy + hooks/continuation-gate.mjs (fixed_in_version 0.4.0, present and observed firing 10x in-session on 0.4.1 without changing the behavior)

### 4.4 `failed_correction` × 4

**signature**

> opining-without-reading-source / pattern-matching instead of verifying

**responsible_component**

> expert-standard verification discipline + scripts/preflight-deployment.mjs quote-before-claim rule (fixed_in_version 0.4.0, present in running 0.4.1)

### 4.5 `failed_correction` × 2

**signature**

> premature-completion-claims: incomplete work declared complete, deliverables hedged, unresolved items relocated instead of resolved

**responsible_component**

> expert-implement / expert-plan completeness gates (fixed_in_version 0.4.0); recurred at the command tier, which the implementationCompleteness() gate does not cover

### 4.6 `systemic_defect` × 5

**signature**

> correction-not-landed-in-durable-plugin-source: defect fixes applied to the ephemeral plugin cache or to session-local files instead of the versioned plugin source, so the owner must re-fix the same defect on the next use

**responsible_component**

> expert-lifecycle machinery-defect routing in commands/expert.md — the architecture amendment of 2026-07-22 prohibits cache-copy fixes but no gate enforces the prohibition

### 4.7 `systemic_defect` × 2

**signature**

> diagnostic-output-paraphrased-instead-of-recorded: the diagnostician's structured diagnoses and feedback signatures are re-rendered into the agent's own prose and only partially persisted

**responsible_component**

> expert-lifecycle diagnosis-persistence path — no defined durable verbatim sink for diagnostician correction_draft / signature objects

### 4.8 `systemic_defect` × 2

**signature**

> destructive-cleanup-of-owner-mandated-records: an unrequested cleanup (branch deletion) destroyed the known-problems log the owner had explicitly ordered logged

**responsible_component**

> command-tier git operations / blast-radius discipline in commands/expert.md

### 4.9 `systemic_defect` × 2

**signature**

> rushed-careless-deliverable: output produced outside the reviewed phases without the process's rigor, unusable to the owner as delivered

**responsible_component**

> command-tier ad-hoc work performed outside the gated phase dispatches

### 4.10 `course_correction` × 1

**signature**

> owner-decision-derived-from-documents-instead-of-asked: an owner decision was reconstructed by inference from repo documents rather than by asking the owner

**responsible_component**

> expert-spec-writer grounding rules / expert-spec owner-decision sourcing

---

## Diagnosis 6 — classification `owner_owned` (journal entry #11)

### problem

The spec gate at docs/specs/spec-mcp-integration-layer.md halted at round 1 with kind `sweep_underreported`: the independent re-execution of a correction's declared `class_sweep` pattern returned hits absent from the correction's self-reported `found` list. The orchestrator attributes this to the corrector as a fabricated/incomplete sweep and burns the round. This is the third restarted review sequence on this artifact (ledger gate_history: rounds 1,2 / 1,2 / 1, findings 9->7, 5->4, then back UP to 7), i.e. the loop is not converging.

### root_cause

The sweep-integrity contract compares two lists that are produced under two incompatible rules, and treats any difference as corrector misconduct.

(1) The verifier's list is defined as pure mechanism: agents/expert-verifier.md:45 — "Execute mechanically — a grep, not judgment — and report every hit, corrected or not."

(2) The corrector's `found` is nominally the same mechanical output (skills/expert-correct/SKILL.md:97, "**every** location the search returned, corrected or not"), but every downstream field forces each `found` entry into one of exactly two dispositions, and BOTH assert the site is a genuine member of the defect class: `sites_changed` (SKILL.md:98-99) or `open_sites` with a `designation` that is "either the escalation under 'When the class cannot be closed' above, or an explicitly-open item" (SKILL.md:100-103). There is no disposition for "regex hit that is not an instance of the class." SKILL.md:102-103 then makes the absence punitive: "A found site neither changed nor designated is a class site left silently open, and fails the gate."

(3) Every defect class at this gate is semantic, not lexical — all seven round-1 findings are ISO/IEC/IEEE 29148:2018 Complete / Verifiable / Consistent properties (a conditional whose antecedent is uncarried; a negotiated-down control set left undefined; a criterion disjunct that holds when the deliverable was not produced; an audit field undefined for one capability class; a coverage claim the cited criterion's text does not discharge). No regex selects only members of such a class. The only expressible patterns are broad topical ones, and the review's own premise_evidence shows exactly that: `actor` -> 9 hits of which 1 is the defect; `2025-11-25|backward|downgrade|earlier revision` -> 11 hits; `60 second|60-second|below the threshold|shorter than` -> 5 hits.

So the corrector faces a forced choice on every non-instance hit: report it in `found` and then be compelled to label it an unclosed class site (false, and it fails the gate under SKILL.md:102), or omit it from `found`. Omission is the only representable honest-ish move, and omission is precisely what the orchestrator detects as `sweep_underreported`. The failure is structurally produced by the contract, not by corrector carelessness.

A second, independent generator compounds it: `found` locations are line-anchored (`path:start-end`, SKILL.md:88 / expert-corrector.md:42) and are recorded against a file whose line numbers the correction's own edits shift. SKILL.md:111 says "Run the sweep after your edits" but the correction is multi-section (7 findings this round) and any edit that changes line count moves every subsequent hit. A faithfully reported sweep therefore still fails equality against a post-edit re-execution. On a 543-line prose spec where single requirements are 600-word paragraphs (A5 at :272, CN10 at :74), this fires on essentially every correction pass.

Note on what I could NOT verify: the failure record handed to me contains only round 1's seven review findings. It carries no `class_sweep` record, no `pattern`, no `re_execution` output, and no list of the diverging sites. I therefore diagnosed the generating mechanism from the contract text and the ledger's non-convergence signature, not from the specific diverging hits. That the failure record for a `sweep_underreported` event omits the sweep and the re-execution that produced the verdict is itself a defect in the failure-record payload and should be fixed alongside the root cause — without those two lists the diagnosis of any future instance is unfalsifiable.

### blast_radius

Not specific to this spec or this project. The defect is in the shared correction/verification contract of expert-dev-tools 0.4.1 and fires at every review gate of every phase (spec, architecture, plan, implement) in every project using the plugin, whenever a defect class is semantic rather than lexical — which is the normal case for standards-grounded findings. Concretely, it converts an improving artifact into an unconvergeable loop: each round the corrector fixes real defects, the sweep-equality check fails on non-instance hits or line drift, the round is scored as corrector misconduct, and the sequence restarts. This ledger shows three such restarts and five consumed rounds against a budget of 2,842,861 tokens. It also degrades the anti-fabrication gate itself: a check that fires on correct behaviour trains the orchestrator (and the owner) to discount it, so a genuine fabricated sweep would be indistinguishable from the noise.

### evidence

1. C:\Users\maxco\.claude\plugins\cache\claude-armory\expert-dev-tools\0.4.1\skills\expert-correct\SKILL.md:97 — `found` is defined as "**every** location the search returned, corrected or not".

2. C:\Users\maxco\.claude\plugins\cache\claude-armory\expert-dev-tools\0.4.1\skills\expert-correct\SKILL.md:100-103 — the only dispositions for a `found` entry outside `sites_changed` are `open_sites` with a designation that is "either the escalation under 'When the class cannot be closed' above, or an explicitly-open item"; both assert class membership. "A found site neither changed nor designated is a class site left silently open, and fails the gate." No `not_in_class` disposition exists.

3. C:\Users\maxco\.claude\plugins\cache\claude-armory\expert-dev-tools\0.4.1\skills\expert-correct\SKILL.md:107-112 — "the orchestrator re-executes `pattern` over `scope` ... executing it must reproduce `found`. A sweep whose re-execution returns sites you did not report ... fails the gate that dispatched you." Exact equality is the pass condition.

4. C:\Users\maxco\.claude\plugins\cache\claude-armory\expert-dev-tools\0.4.1\agents\expert-corrector.md:45-57 — the mirrored contract, same two dispositions, same equality rule; two copies of one rule that must be changed together.

5. C:\Users\maxco\.claude\plugins\cache\claude-armory\expert-dev-tools\0.4.1\agents\expert-verifier.md:40-48 — the counterpart list is explicitly mechanical: "Execute mechanically — a grep, not judgment — and report every hit, corrected or not." Judgment-filtered list compared for equality against unfiltered list.

6. C:\Users\maxco\.claude\plugins\cache\claude-armory\expert-dev-tools\0.4.1\skills\expert-correct\SKILL.md:88 and agents\expert-corrector.md:42 — location grammar is `path:start-end`, line-anchored, against a file the correction itself edits.

7. Failure record, finding 3 premise_evidence — the sweep method in use is verbatim keyword grep: "Grep 'not yet run|until it has run|has been run' over the spec: 4 hits — 281, 288, 424, 430 ... no third instance." Findings 1, 2, 4 use the same method with broad topical patterns returning mostly non-instances (`actor` -> 9 hits; `2025-11-25|backward|downgrade|earlier revision` -> 11 hits).

8. C:\Users\maxco\orca\NOVA\.claude\expert\ledger.json (on-disk, revision 11) — gate_history holds five spec rounds across three sequences that each restart at round 1 (1,2 / 1,2 / 1) with findings_count 9, 7, 5, 4, 7. The count rises again after a restart; the gate is consuming rounds without converging. The segment-start snapshot I was handed shows gate_history empty, so this history was written during/after this segment.

9. C:\Users\maxco\orca\NOVA\docs\specs\spec-mcp-integration-layer.md — I independently re-executed three of the round-1 class sweeps against the current working tree. All three now read as closed: the AC22/AC28 escape-hatch disjuncts are gone (:438, :444 now state "there is no branch of this criterion that a build satisfies by never running it"); A5's sub-threshold silence is stated (:272); A1b (:259-267) states the negotiated-down control set; B2c (:281) defines `actor` for the gateway-state class; §12 (:406) makes eight coverage claims (AC1, AC11, AC16, AC18, AC22, AC24, AC25, AC28) and I read each cited row — every one now carries the clause §12 attributes to it, including AC1's new "Inspection half (S7's pinning and update review)". The requirement-to-criterion population is also complete: D5b, the one requirement absent from the AC table's numbered rows, is covered by AC8a (:424). The artifact's content is materially improving; what is failing is the sweep-reporting protocol, not the corrections.

10. C:\Users\maxco\orca\NOVA\docs\specs\spec-mcp-integration-layer.md is 543 lines with individual requirement paragraphs exceeding 600 words (A5 at :272, CN10 at :74, B2c at :281), so any multi-section correction shifts line numbers under later sweep hits.

### correction_draft

**target_artifact**

C:\Users\maxco\.claude\plugins\cache\claude-armory\expert-dev-tools\0.4.1\skills\expert-correct\SKILL.md (lines 92-112), with the mirrored contract at C:\Users\maxco\.claude\plugins\cache\claude-armory\expert-dev-tools\0.4.1\agents\expert-corrector.md (lines 45-57) and the comparison rule at C:\Users\maxco\.claude\plugins\cache\claude-armory\expert-dev-tools\0.4.1\agents\expert-verifier.md (lines 40-48). All three must change in the same pass; two of them are duplicate statements of one rule and will drift otherwise. NOT docs/specs/spec-mcp-integration-layer.md — the cause does not live in the spec, and patching the spec would be a downstream patch.

**change**

Three changes, one to each of the three failure generators.

1. Add a third `found` disposition, `not_in_class`. Every `found` entry is dispositioned as exactly one of `sites_changed`, `open_sites` (with designation), or `not_in_class` (with a one-line reason the hit is not an instance of the swept class). Amend SKILL.md:102-103 so the gate-failing condition is "a found site with no disposition", not "a found site neither changed nor designated". This does not relax the gate: the site is still reported, still counted, still visible to the verifier and the orchestrator, and the reason is on the record and auditable.

2. Make `found` explicitly mechanical and post-edit. Restate SKILL.md:97 and 111-112 as: `found` is the verbatim, unfiltered output of running `pattern` over `scope` after ALL edits for the round are complete — transcribed, never curated. State the failure condition directly: a `found` list shorter than the mechanical output fails the gate regardless of whether the omitted hits were class members. Pair this with the new `not_in_class` slot, which is what makes honest transcription possible.

3. Replace line-equality with drift-immune anchors. Require each `found` and each `re_execution` hit to be reported as `path#<nearest enclosing requirement or criterion identifier>` plus the matched line's text, with `path:line` as advisory only. Amend the comparison rule (SKILL.md:107-109, expert-corrector.md:53-56, expert-verifier.md:43-44) so equality is computed over the anchor set, not the line set.

Suggested fourth item, separable: amend the orchestrator's failure-record payload for `kind: sweep_underreported` to carry the declared `class_sweep` (searched, pattern, scope, found) and the verifier's `re_execution` output and the set difference between them. The record handed to this diagnosis carried none of these, which made the specific diverging sites unrecoverable.

**why_it_removes_root_cause**

The root cause is that the contract offers no truthful representation for a regex hit that is not an instance of the swept class, so omission from `found` is the corrector's only representable move — and omission is definitionally the `sweep_underreported` trigger. Change 1 supplies that representation, so the corrector can transcribe the mechanical output in full and still be truthful; the incentive to omit disappears. Change 2 removes the residual ambiguity about whether `found` is a judgment product or a mechanical one, aligning it with the verifier's already-mechanical rule (expert-verifier.md:45) so the two lists are generated under one rule and equality is a meaningful test. Change 3 removes the second, independent generator: with anchors instead of line numbers, the correction's own line-count changes can no longer make a faithfully reported hit read as an unreported one. After all three, a re-execution difference means what the gate intends it to mean — the corrector reported a sweep it did not run — and nothing else. The gate's discriminating power increases; nothing about the sweep obligation, the artifact, or any acceptance criterion is relaxed.

Classification note: this is `owner_owned` and cannot be machine-applied, for two reasons. First, the correction doctrine reserves any change targeting a gate for the owner by definition, and this change edits an anti-fabrication gate's return schema and its pass condition — adding a `not_in_class` disposition is, on its face, adding an escape hatch to a fabrication check. My judgment that it restores rather than weakens the gate is exactly the judgment the doctrine reserves. Second, the target files live under C:\Users\maxco\.claude\plugins\cache\claude-armory\, a vendored plugin cache outside the NOVA repo; edits there are outside the segment's authorized artifact path (docs/specs/spec-mcp-integration-layer.md), are not version-controlled by this project, and would be destroyed by a plugin cache refresh. The owner should decide whether to carry this upstream to the claude-armory/expert-dev-tools source or pin a local override.

Interim disposition for the current gate, for the owner's decision: the artifact itself is improving and the three class sweeps I re-executed against the working tree all read as closed. Failing this round as corrector misconduct is not supported by what is on disk. The reasonable interim move is to not charge this round against the corrector, and to resume the spec gate at the next review round rather than restarting the sequence a fourth time.

---

## Provenance

A hand-written fix for the temporal-dead-zone crash was briefly opened against this
repository and withdrawn unmerged, on the owner ruling that corrections to this plugin
go through its own remediation process rather than ad-hoc edits. Nothing from that
attempt is in this repository's history.
