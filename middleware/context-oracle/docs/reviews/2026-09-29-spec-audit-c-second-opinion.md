# Spec audit — part c: second opinion

This file is the second opinion on
`middleware/context-oracle/docs/reviews/2026-09-29-spec-audit-c.md` (E-1 to E-87), the first
audit of spec lines 673–1142 of `middleware/context-oracle/docs/specs/spec-context-oracle.md`
at `ec3b057`. This auditor wrote neither the spec nor the first audit. The test applied is the
auditor brief and the spec-audit brief
(`/tmp/claude-0/-home-user-agent-armory/779c0f74-86b0-5e8f-b02d-811e78ed3f66/scratchpad/audit/BRIEF.md`,
`/tmp/claude-0/-home-user-agent-armory/779c0f74-86b0-5e8f-b02d-811e78ed3f66/scratchpad/audit/SPEC-BRIEF.md`). Every entry of the first audit is judged below, because the
owner/engineering classification of every entry is in scope; keeps of headings, separators and
owner lines that hold are judged in one or two lines. Part a's and part b's first audits
(`2026-09-29-spec-audit-a.md`, `-b.md`) were read for shared dependencies and are cited where a
part c line depends on a line they judged.

**How the work was done.** `$W` = `/tmp/claude-0/-home-user-agent-armory/779c0f74-86b0-5e8f-b02d-811e78ed3f66/scratchpad/specaudit/so-c`.
Web sources were fetched with `curl` into `$W` on 2026-09-29 (`hooks.md`, `changelog.md`,
`setup.md`, `tools-reference.md`, `settings.md`, `sub-agents.md`, `whats-new/2026-w23.md` from
`code.claude.com/docs/en/`; the Tricorder and Fail Fast PDFs; the PyPI and npm package metadata;
`deps/sqlite/sqlite.gyp` at three Node tags) and read as text; every web quote below is from
that text. Claude Code is 2.1.284 (`claude --version`). The experiments, all in throwaway
directories under `$W`, with hooks that write to a log file so what ran does not depend on the
model's answer:

- **X1 — answer text vs `PreToolUse`, headless.** `$W/mdi`: `MessageDisplay`, and
  `PreToolUse`/`PostToolUse` on `Bash`, run `$W/mdi/log.sh`, which appends the event, the text or
  command, and whether an `"type":"assistant"` line of the transcript at `transcript_path`
  already contains the answer text. Three runs of `claude -p --permission-mode acceptEdits
  --allowedTools "Bash(echo:*)" --output-format stream-json --verbose "In one single response:
  first write the plain-text sentence 'ANSWER-TEXT-7 is my answer.' and then, in that same
  response, call the Bash tool with the command: echo hi" </dev/null`.
- **X2 — the same, interactive.** Attempted with `$W/mdi/drive2.py` (a pty driver). With a fresh
  `CLAUDE_CONFIG_DIR` the interactive client stops at "Select login method" and an OAuth URL; reading
  the session's own configuration to skip onboarding was refused by the permission system as
  credential exploration. **Not run.** Interactive ordering is unverified here.
- **X3 — `PreToolUse` `additionalContext` when the tool call fails.** `$W/failctx`: a
  `PreToolUse` hook on `Bash` returns `additionalContext` "CTXMARK-4417: the file notes.txt is
  generated." Two runs of `claude -p --permission-mode acceptEdits --allowedTools "Bash(ls:*)" --output-format stream-json
  --verbose "Run exactly this Bash command once: ls ./no-such-file-xyz . Then, in your reply, quote
  verbatim any text starting with CTXMARK that you received after the tool call, or say NONE if you
  received none."`.
- **X4 — the `Task` name.** `$W/taskname`: two `PreToolUse` hooks, matcher `Task` and matcher
  `Agent`, each logging its matcher and the input `tool_name`; one run asking for one `Agent`
  subagent that replies PONG.
- **X5 — one-shot model call latency.** `$W/lat`: `echo "Reply with the single word OK." | claude
  -p --max-turns 1 --tools ""`, wall-clock timed, three runs.
- **X6 — bare Node start.** `node -e ""` timed five times.

### E-1
**Agree/Disagree:** Verdict: agree (keep). Reasoning: FR-L7 is owner content. The ledger confirms the RETHINK §12 decisions and points to §12.6 for OL-6's rationale, and §12.6 assigns whisper-efficacy statistics to the per-user global store. Classification (owner) is correct.
**Evidence:**
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L44-L44]] "Two stores — per-project and per-user global — both outside the repo tree; solo scope, no team sharing."
- [[middleware/context-oracle/RETHINK.md@ec3b057:L345-L346]] "whisper-efficacy statistics, threshold tuning, general conventions"
**Correct verdict:** keep — owner decision (OL-6 with its confirmed §12.6 rationale).

### E-2
**Agree/Disagree:** Verdict: agree (keep). Reasoning: a heading whose two assertions are OL-C2's content.
**Evidence:**
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L68-L68]] "This **steers/corrects AND escalates to a BLOCK** when the agent won't follow the skill."
**Correct verdict:** keep — heading restating OL-C2.

### E-3
**Agree/Disagree:** Verdict: agree (replace). Reasoning: agree that a review finding is not backing and that "machinery-heavy" is not the spec's phasing rule. One addition: by FR-A2's own rule the Phase C placement is already explained by FR-C2 as written (the action→step mapping is "model-assisted, consistent with Phase C"), so the paragraph's phase reason should point at FR-C2, and it moves if E-6's owner answer changes FR-C2. Classification (engineering, with an owner premise) is correct.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L680-L683]] "It is the most machinery-heavy"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L183-L184]] "Model-free vs model-dependent, and therefore build phase, is fixed in §11."
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L712-L712]] "actions onto a skill's steps is a judgment (model-assisted, consistent with Phase C), not a"
**Correct verdict:** replace — cite OL-C2 (non-primary) and FR-B5/D-35 (precision investment) instead of review finding M1, and state the phase by FR-A2's rule via FR-C2's model-assisted mapping (revisited if E-6's owner answer changes FR-C2).

### E-4
**Agree/Disagree:** Verdict: agree (keep). Reasoning: agree with the verdict, not with one step of the reasoning. The line itself cites only OL-C2, and the post-condition field is justified without any owner premise: an under-fire guard that reuses the recognizer's classifier cannot see that classifier's misses, so an independent signal is needed (FR-B5's own argument). The first audit instead backs it with "Max Cogar cannot see a skipped step (OL-11)". OL-11 says he is a non-programmer and that verification is the agents' job; it does not say he cannot see a skipped step, and OL-C2 records him noticing agents not following his skills. Part a raised the same attribution (its E-58, E-84). FR-C1 does not carry it, so FR-C1 stands.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L688-L689]] "which the under-fire detector (FR-C4) verifies directly"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L49-L49]] "design/build/verification/docs/roadmap are the agents'. You are a non-programmer by design."
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L68-L68]] "IF THE AGENTS ARENT FOLLOWING MY SKILLS, THEN THAT SHIT NEEDS TO BE BLOCKED AT SOME POINT."
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L449-L452]] "or it inherits that classifier's blind spot"
**Correct verdict:** keep — OL-C2's structure plus a post-condition field backed by FR-B5's independence argument (engineering).

### E-5
**Agree/Disagree:** Verdict: agree (replace). Reasoning: agree on the three defects, with two corrections to the first audit's evidence and one addition.
1. The rename is real, but the first audit's consequence is overstated. X4: a `PreToolUse` matcher written as `Task` still fires on an `Agent` dispatch (the alias the sub-agents page documents). What does break is code that compares the input `tool_name` to `Task`: the input carries `Agent`. The first audit's own "would be wrong if" (Task still accepted in hook matchers) is met, but the replace still stands on the `tool_name` ground.
2. The replacement reason the first audit proposes, "CLAUDE.md makes the collapse-hunt mandatory", is a project rule, not a step of one of Max Cogar's skills, and FR-C1a is about skill structure (OL-C2). The verifiable reason is that an independent-review subagent hand-off is a declared step of `expert-implement`.
3. Addition: L705 attributes "not Max — OL-11" as a detection limit. OL-11 does not say that (see E-4); the limit of a pure cognitive step is that it leaves no artifact and no distinguishing action, which holds without the owner premise.
**Evidence:**
- [[https://code.claude.com/docs/en/sub-agents.md]] "In version 2.1.63, the Task tool was renamed to Agent. Existing Task(...) references in settings and agent definitions still work as aliases."
- [[ran]] X4, `$W/taskname`, one run → `names.log`: `matcher=Task tool_name=Agent` / `matcher=Agent tool_name=Agent`; result `The subagent replied: **PONG**`
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L694-L696]] "a `Task` subagent, whose absence"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L695-L696]] "is the single most-cited process failure on this very project"
- [[claude-plugins/expert-dev-tools/skills/expert-implement/SKILL.md@ec3b057:L187-L187]] "## Hand off to independent review"
- [[claude-plugins/expert-dev-tools/skills/expert-implement/SKILL.md@ec3b057:L189-L189]] "The review that decides whether the work is done is performed by a **separate general-purpose subagent**"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L705-L705]] "not Max — OL-11"
- [[https://code.claude.com/docs/en/hooks.md]] "The transcript file is written asynchronously and may lag the in-memory conversation"
**Correct verdict:** replace — name the `Agent` tool (input `tool_name` `Agent`; `Task` survives only as a matcher/settings alias); give the dispatch's reason as a declared step of `expert-implement` ("Hand off to independent review"), not a ranking; read-before-plan is observed from the oracle's own recorded `Read` tool events; drop "not Max — OL-11" from the cognitive-step limit (engineering).

### E-6
**Agree/Disagree:** Verdict: agree (replace, owner decision). Reasoning: agree that the meaning of Max Cogar's trigger wording is his, and that FR-C2 may not settle it by redefinition. Disagree with the framing the first audit sends to him. His words are "a **more** deterministic trigger", a comparison (with the gate-and-test attempts he describes in the same sentence), not "deterministic". FR-C2 errs by quoting "Deterministic" as if he had used it absolutely and then redefining it; the first audit repeats the dropped "more" in its reasoning ("the opposite of what 'deterministic' ordinarily means") and offers alternative (a), "deterministic over observable tool events", as the one that "matches his words". It does not: a model-assisted mapping bounded by the encoded skill's declared steps may well be "more deterministic" than a free judge or a plan test. Alternative (a) also narrows enforcement to steps whose tool event alone shows completion, which FR-C1a does not require. The question to him must quote his words exactly and not pre-select an answer.
**Evidence:**
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L68-L68]] "what i actually wanted was structured steering/correcting with a more deterministic trigger. and NOT trying to code in piles of rules and shit for when it should trigger."
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L710-L711]] "**\"Deterministic\" here means"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L73-L73]] "a statement Max makes about one specific thing, in specific context, must never be written down as a broader project rule than what he actually said"
**Correct verdict:** replace — owner decision, goes to Max Cogar: FR-C2 quotes his words exactly (the OL-C2 sentence above, "a more deterministic trigger" included) and he is asked, without a pre-selected answer, whether a mapping of the agent's actions onto the encoded skill's declared steps that uses a model (bounded by those steps, off the deny path) is the "more deterministic trigger" he meant, or whether he meant a trigger from tool events alone.

### E-7
**Agree/Disagree:** Verdict: agree (keep). Reasoning: each clause is OL-C2 or OL-3 as confirmed. (Part b's E-27 asks Max Cogar what "steering isn't working" means; FR-C3 quotes that trigger as he said it, so it stands either way.)
**Evidence:**
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L68-L68]] "IF THEY CANT PROVIDE A REASON FOR SKIPPING A STEP OR SOMETHING, OR STEERING ISNT WORKING, THEN THEY SHOULD BE FUCKING BLOCKED."
**Correct verdict:** keep — owner decision stated as confirmed.

### E-8
**Agree/Disagree:** Verdict: agree (replace). Reasoning: agree on the defect: limit (2) keeps the detector running on the action classifier's output, the very signal FR-C4 exists to be independent of, and the result flows unmarked into the `status` rate. Disagree with the fix. "Report the step as unmonitored and exclude it from the rate" is an exclusion put in place of the requirement (independent, automated under-fire detection), which the spec-audit brief forbids. The correct line is derivable, step by step:
1. FR-C4 feeds a rate (FR-M2/FR-M4); it is a diagnostic, not a deny. So "was step N due?" need not be known at the moment of the skip; it may be settled afterwards.
2. FR-C1 encodes a skill's steps with their expected order. If a later declared step's post-condition is present, every earlier step was due. That fact is read from repo/store state, with no action classification.
3. When the skill's run ends in a completion claim, every declared step with a post-condition was due. (A run abandoned without a completion claim skipped nothing the agent then relied on.)
4. A conditional step is due when its declared condition holds; that condition is read from the state it names, not from the agent's actions, so it does not inherit the action classifier's blind spot ("an action misclassified as the step reads as done").
5. So every step that has a checkable post-condition can be monitored classifier-free; the only unmonitorable steps are those with no post-condition, which limit (1) already states (and which FR-C1a shows no mechanism can check). Limit (2), its fallback and its "weakest exactly where the miss matters most" caveat go away.
The cost is detection latency (a miss is counted when the later artifact or the done-claim appears), which a rate tolerates. Separately, L722–723 gives "Max cannot see a skipped skill step himself (OL-11)" as the reason; OL-11 does not say that (E-4). The automated guard's reason is that verification is the agents' job under OL-11, not the owner's.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L735-L738]] "falls back to action-classification"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L729-L729]] "missed-skill-block rate (FR-M2/FR-M4)"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L686-L687]] "the steps it defines"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L722-L723]] "cannot see a skipped skill step himself (OL-11)"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L49-L49]] "design/build/verification/docs/roadmap are the agents'."
- [[https://martinfowler.com/ieeeSoftware/failFast.pdf]] "The program continues working right after an error but fails in strange ways later on."
**Correct verdict:** replace — FR-C4 derives "due" without the action classifier: a step is due once a later declared step's post-condition is present, or once the skill's run ends in a completion claim, and a conditional step when its declared condition holds in store/repo state; the post-condition check then runs as written, a miss may be counted after the skip (the rate tolerates it), and the fallback to action-classification and its caveat are deleted; the OL-11 reason at L722–723 becomes: verification is the agents' job (OL-11) (engineering).

### E-9
**Agree/Disagree:** Verdict: agree (keep). Reasoning: the heading's single claim matches CLAUDE.md's single-spec rule.
**Evidence:**
- [[middleware/context-oracle/CLAUDE.md@ec3b057:L54-L57]] "There is never a separate"
**Correct verdict:** keep — heading.

### E-10
**Agree/Disagree:** Verdict: agree (replace, owner decision). Reasoning: agree that the test-bed sentences were added after the sign-off, rest on an idea `docs/IDEAS.md` marks "Unvalidated", skip the promotion path CLAUDE.md sets (which ends in owner sign-off), and cite an architecture ID from the spec. There are no ledger words on this subject, and the first audit correctly does not attribute any: its only owner quote (M30) is flagged as about a different context. One refinement of the question put to him: a run on "a real repo" at Phase A's exit is already in the signed text (L755–757) and stays; what is new, and his to decide, is (a) using his real Claude Code session transcripts as data and (b) designing Phase B and the regression fixtures from that replay. The question should be asked about those two, not about real repos in general.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L755-L757]] "Exits by producing measured whisper/block"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L758-L759]] "owner's real repos and Claude Code transcripts to *discover* how the honest"
- [[middleware/context-oracle/docs/IDEAS.md@ec3b057:L92-L92]] "**Unvalidated.**"
- [[middleware/context-oracle/CLAUDE.md@ec3b057:L270-L271]] "Promotion: IDEAS.md → spec §13 (grounded by research) → requirement with owner"
- [[/tmp/claude-0/-home-user-agent-armory/779c0f74-86b0-5e8f-b02d-811e78ed3f66/scratchpad/audit/owner-messages.md@FILE:L583-L583]] "AND WHY DO YOU NEED TO TEST SHIT ON MY ACTUAL PROJECTS????"
**Correct verdict:** replace — keep Phase A's content and real-repo exit; remove L757–766 until IDEAS #14 is promoted — owner decision, goes to Max Cogar: whether his Claude Code session transcripts are used as test data and whether Phase B and the regression fixtures are designed from replaying them.

### E-11
**Agree/Disagree:** Verdict: agree (keep). Reasoning: the "model on the deny path is too slow" premise now has an executed result: a one-shot, tool-less `claude -p` call (the spec's illustrative model path) took 3.85–4.23 s, well over NF-1's ceiling whatever NF-1's final values.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L772-L774]] "the `PreToolUse` deny stays"
- [[ran]] X5, `cd $W/lat; echo "Reply with the single word OK." | claude -p --max-turns 1 --tools ""`, timed, 3 runs → `run 1 3.86 s 'OK'` / `run 2 4.23 s 'OK'` / `run 3 3.85 s 'OK'`
**Correct verdict:** keep — Phase B content; the off-path rule is backed by measured model-call latency (engineering).

### E-12
**Agree/Disagree:** Verdict: agree (replace). Reasoning: "A/B delivery" is undefined (its likeliest reading, "delivery built in Phases A and B", is still a guess). Also, the demotion+promotion ladder is itself Phase C content (§5.2: automated demotion/promotion is Phase C), so listing it as something Phase C "needs" is circular rather than a dependency of the corrective feature.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L777-L777]] "skill structures encoded and A/B delivery in place, plus the demotion+promotion ladder."
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L255-L255]] "automated demotion/promotion is Phase C `[D-6bar]`."
**Correct verdict:** replace — state each Phase C part's real inputs: the learning loop builds the FR-L3/L3b ladder from Phase A/B exit data; the corrective feature needs the encoded skill structures and the Phase A deny/whisper delivery, its phase set by FR-A2's rule once FR-C2 is resolved (E-6) (engineering).

### E-13
**Agree/Disagree:** Verdict: agree (keep). Reasoning: restates the lifecycle rule; defers numbers to the data that can source them.
**Evidence:**
- [[middleware/context-oracle/CLAUDE.md@ec3b057:L205-L205]] "No implementation before an approved architecture document for the phase"
**Correct verdict:** keep — lifecycle restated (engineering).

### E-14
**Agree/Disagree:** Verdict: agree (keep). Reasoning: separators assert nothing.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L910-L910]] "---"
**Correct verdict:** keep — markup.

### E-15
**Agree/Disagree:** Verdict: agree (keep). Reasoning: a section title.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L784-L784]] "## 12. Decisions made while writing this spec"
**Correct verdict:** keep — heading.

### E-16
**Agree/Disagree:** Verdict: agree (keep). Reasoning: OL-3 as clarified, OL-C2, OL-C3; owner classification correct.
**Evidence:**
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L41-L41]] "What he rejected is the *pre-emptive* gate (\"pass a test to proceed\" / generated-file), not blocking as such."
**Correct verdict:** keep — owner decision.

### E-17
**Agree/Disagree:** Verdict: agree (replace). Reasoning: the entry carries no reasoning and FR-D4 points back to it; OL-C4 is the real backing for declarative, flagged, demotable hazard whispers. OL-C4 does not name the correction channel, so pointing it at FR-L6 (whose operability E-22 questions) is right.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L790-L790]] "**D-4 — ⚠ subtype declarative, corrected via CLI** (feeds FR-L3/FR-L3b)."
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L70-L70]] "(B) also voice uncertain warnings clearly flagged, letting the learning loop demote ones that keep being wrong"
**Correct verdict:** replace — D-4 cites OL-C4 and routes corrections through FR-L6, whose form follows E-22 (engineering on an owner premise).

### E-18
**Agree/Disagree:** Verdict: agree (keep). Reasoning: OL-C4 recorded with its date.
**Evidence:**
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L70-L70]] "Max answered *\"B\"* (2026-08-16)"
**Correct verdict:** keep — owner decision.

### E-19
**Agree/Disagree:** Verdict: agree (replace). Reasoning: agree that the recursion guard needs its derivation written down; X1 and X3 add two more executed instances of project hooks firing inside a headless `claude -p` run. Disagree with dropping "ships high". It is not unbackable: the spec's own evidence base holds the source. Tricorder, which the spec cites for delivery and demotion, enforces a very low false-positive rate for results pushed into the developer's workflow, and Johnson et al., cited for FR-D1, found false positives drive developers away from such tools. That is the standard practice of starting a push-mode analysis precise and loosening it on measured value. Two caveats belong with the citation: those sources study human developers, so for an agent consumer they are an analogy; and FR-A5a/OL-C4 exempt uncertain hazards from any high-confidence floor, so "ships high" cannot mean a confidence floor on hazards. The claimed conflict with D-36 dissolves once D-36's unbacked "silence is costlier" ranking goes (E-38): a precise starting point with a regret signal to lower it is one consistent policy. Dropping the line would leave the initial operating point unstated, with nothing gained.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L793-L794]] "combinator, \"ships high\", and calibration policy stated as properties."
- [[https://research.google.com/pubs/archive/43322.pdf]] "We still enforce a very low effective false positive rate here"
- [[https://petertsehsun.github.io/soen7481/papers/icse13b.pdf]] "Our results confirmed that false positives and developer"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L243-L243]] "warning/hazard genres fire without requiring high confidence"
- [[ran]] X1 and X3 (header): the project's `PreToolUse`/`MessageDisplay` hooks fired in every headless `claude -p` run (`order.log`, `marker.log` entries per run)
**Correct verdict:** replace — D-6 records the recursion derivation (the model call is a headless Claude Code run whose configured hooks fire, X1/X3), and D-6bar backs "ships high" with `[TRICORDER]`/`[JOHNSON]` (an analogy from human developers, stated as such), scoped so it never becomes a confidence floor on FR-A5a hazards, and calibrated on measured false-fire and regret (engineering).

### E-20
**Agree/Disagree:** Verdict: agree (keep). Reasoning: the adoption window is the arbitrary gate OL-C1 bars; the corpus floor is evidentiary, with its reason written at FR-A6.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L249-L250]] "**No first-N-sessions / adoption window** (that would be the"
**Correct verdict:** keep — engineering, backed by OL-C1 and FR-A6's evidentiary reason.

### E-21
**Agree/Disagree:** Verdict: agree (undetermined). Reasoning: agree that the in-tree exception has no written comparison. Disagree on what is missing. The deciding fact is not a start-up measurement (bare Node starts in 56–67 ms here, X6, which is small beside a tool call, E-33); it is where the oracle must run. The cloud-environments page says an Anthropic-hosted cloud session runs hooks from the repository and from server-managed settings, and that user-level settings stay on the local machine. So if Claude Code cloud sessions are a target environment, the hook wiring must be in the repository's committed `.claude/settings.json`, an in-tree write that D-9 would then have its reason for; if only local machines are, user-scope or git-excluded local wiring leaves the tree untouched and is the better choice. Which environments count is the open owner question part b raised on C-3/OL-4 (its E-38).
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L796-L796]] "**D-9 — The one in-tree write is `init` wiring** (P8)."
- [[https://code.claude.com/docs/en/cloud-environments.md]] "User-level settings stay on your machine."
- [[https://code.claude.com/docs/en/cloud-environments.md]] "Claude Code runs hooks from the repository and from your organization's"
- [[https://code.claude.com/docs/en/settings.md]] "You, in this one project only. Claude Code keeps it out of git when it creates the file"
- [[ran]] X6, `node -e ""` timed 5 times → `56ms 56ms 61ms 67ms 59ms`
**Correct verdict:** undetermined — missing: which environments the oracle must run in (cloud sessions or local only; the C-3/OL-4 owner question, part b E-38). Cloud sessions make committed in-tree wiring necessary and give D-9 its reason; local-only makes user-scope or git-excluded wiring the correct line (engineering, gated on that owner answer).

### E-22
**Agree/Disagree:** Verdict: agree (undetermined, with an owner part). Reasoning: agree that the line conflicts with the ledger: it makes Phase A's only calibration input depend on Max Cogar judging whisper correctness, when whispers do not appear as chat messages and OL-11 assigns verification to the agents. The engineering flaw is established; what is not is the replacement, and the part that is his (whether he wants to supply labels at all) is correctly framed as a yes/no he can answer. Part a reached the same place on §5.2 (its E-80).
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L797-L798]] "calibration input"
- [[https://code.claude.com/docs/en/hooks.md]] "Claude reads the reminder on the next model request, but it doesn't appear as a chat message in the interface."
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L49-L49]] "design/build/verification/docs/roadmap are the agents'. You are a non-programmer by design."
**Correct verdict:** undetermined — owner decision, goes to Max Cogar: whether he will supply corrections at all (and in chat or by CLI); the engineering replacement (deterministic uptake proxies, or corrections by the consuming agent) is chosen after his answer; missing: his answer.

### E-23
**Agree/Disagree:** Verdict: agree (replace). Reasoning: OL-C1 was said about arbitrary limits on whether the oracle speaks; applying it to language coverage widens it (OL-C7). The ledger's own note records the language answer and hands the choice to the agents. Part b's C-6 fix (its E-42) is consistent.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L802-L802]] "anti-arbitrary-limit principle `[OL-C1]`."
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L82-L84]] "it is not his to decide"
**Correct verdict:** replace — ground D-15/C-6 on the ledger's language note and the mission; drop `[OL-C1]` (engineering).

### E-24
**Agree/Disagree:** Verdict: agree (keep). Reasoning: OL-8 plus the documented `agent_id` field.
**Evidence:**
- [[https://code.claude.com/docs/en/hooks.md]] "Present only when the hook fires inside a subagent call. Use this to distinguish subagent hook calls from main-thread calls."
**Correct verdict:** keep — owner scope on a documented field.

### E-25
**Agree/Disagree:** Verdict: agree (replace). Reasoning: the no-intent-term half is reasoned; the equal-weight half is not, and its real reason is the absence of any owner ranking plus the logged failure of agent-made rankings.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L804-L805]] "**D-18 — Equal genre base weight; decision-impact carries no intent term because intent"
**Correct verdict:** replace — add the equal-weight reason (no CONFIRMED ranking; collapse-log 2026-08-01; OL-C2 for the corrective feature) (engineering).

### E-26
**Agree/Disagree:** Verdict: agree (replace). Reasoning: agree. The harness treats compaction as discarding injected context (it re-injects `SubagentStart` context after auto-compaction), so the delivered-set, like the read-set, can no longer be assumed held. Part a's FR-A4 fix (its E-74) allows reconciling both sets against the compaction summary instead of clearing them; that is available (`PostCompact` receives `compact_summary`) and is a legitimate architect refinement of the same property. The spec-level property is: after `compact`, neither set counts a fact as held unless it can be shown to be still in context.
**Evidence:**
- [[https://code.claude.com/docs/en/hooks.md]] "discards that copy, Claude Code injects the next run's context again."
- [[https://code.claude.com/docs/en/hooks.md]] "The compact_summary field contains the conversation summary generated by the compact operation."
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L222-L224]] "`compact` (clear read-set)"
**Correct verdict:** replace — D-20 states its reasoning; on `compact` both the read-set and the delivered-set are cleared (or reconciled against the compaction summary, the architect's choice) (engineering).

### E-27
**Agree/Disagree:** Verdict: agree (replace). Reasoning: the reason is derivable from OL-2 and unwritten; D-21b is backed where it points.
**Evidence:**
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L40-L40]] "a deterministic degraded mode is mandatory for air-gap."
**Correct verdict:** replace — D-21 records that OL-2's degraded mode answers a runtime condition possible in every phase (engineering).

### E-28
**Agree/Disagree:** Verdict: agree (keep). Reasoning: OL-10, reasoned at FR-M3.
**Evidence:**
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L48-L48]] "it could fail a hundred ways in front of me and I wouldn't know."
**Correct verdict:** keep — engineering, from OL-10.

### E-29
**Agree/Disagree:** Verdict: agree (keep). Reasoning: stable IDs keep citations valid; the retired-ID paragraph and CI checker apply it.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L467-L468]] "**Retired requirement IDs (citation resolution) `[D-23]`.** Older documents"
**Correct verdict:** keep — engineering, reasoned where applied.

### E-30
**Agree/Disagree:** Verdict: agree (keep). Reasoning: the no-evidence-without-delivery derivation is shown at FR-L3b.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L650-L652]] "channel is periodically re-admitted to re-measure value and re-promoted when earned;"
**Correct verdict:** keep — engineering, derived.

### E-31
**Agree/Disagree:** Verdict: agree (keep). Reasoning: right-moment reasoning at FR-A2a; the 2026-09-28 timing ruling (settled) kept the edit as the decision point.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L165-L165]] "Task-shape landmines are NOT delivered here — they belong at the edit (FR-A2e) `[D-26]`."
**Correct verdict:** keep — engineering, from the mission's timing clause.

### E-32
**Agree/Disagree:** Verdict: agree (replace). Reasoning: the split is right by FR-A2's rule; the entry omits the reason and does not say that OL-12's concrete need is the deferred part.
**Evidence:**
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L50-L50]] "did not finish their work but still stopped anyway."
**Correct verdict:** replace — D-27 records the comprehension reason and that OL-12's concrete need is Phase B (engineering on an owner premise).

### E-33
**Agree/Disagree:** Verdict: agree (undetermined). Reasoning: agree: the budget's existence is backed (the model call must stay off the path, X5; fail-open needs a ceiling), the values are not, and part b reached the same result on NF-1 (its E-41). The executed data here sharpens what is missing rather than supplying it: a trivial `echo` tool call took 0.51–0.61 s from `PreToolUse` to `PostToolUse` (X1, hooks included), so a 1.5 s p95 would add up to about three times a small tool call's own duration on every event. The values have to come from measured tool-call durations in real sessions against a stated tolerable overhead, or from a cited source; neither exists.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L535-L536]] "added latency per event **p95 ≤"
- [[middleware/context-oracle/CLAUDE.md@ec3b057:L223-L224]] "Numbers without sources"
- [[ran]] X1, three headless runs, `order.log` → `1790683767.851 MessageDisplay` / `1790683768.021 PreToolUse 'echo hi'` / `1790683768.629 PostToolUse 'echo hi'`; `1790683774.174 PreToolUse` / `1790683774.784 PostToolUse`; `1790683780.111 PreToolUse` / `1790683780.707 PostToolUse`
**Correct verdict:** undetermined — missing: per-event tool-call durations measured on real sessions and a stated tolerable overhead (or a cited source) from which 1.5 s/3 s are derived (engineering).

### E-34
**Agree/Disagree:** Verdict: disagree (keep → replace). Reasoning: the two cases and the no-pre-emptive-gate exclusion are the ledger, and a `PreToolUse` deny is real. But D-32 realises answer-drift **only** as a `PreToolUse` deny, and that misses one of OL-C5's non-answer next moves: ending the turn with text that does not answer. That move fires no `PreToolUse`, so D-32 as written cannot block it; the spec's only handling is FR-B4's best-effort Stop whisper, "delivery, not a block". OL-R5 records that treating the silent end-of-turn as outside the trigger was the agent's narrowing, not Max Cogar's rule. The contract has the reactive tool for exactly that moment: a `Stop` hook's block prevents the stop and continues the conversation, bounded by `stop_hook_active` and the continuation cap, and `Stop` carries the final text in `last_assistant_message`. It fires only after the turn ended unanswered, so it is not a pre-emptive gate. This is part b's E-26 finding, checked here independently against OL-C5, OL-R5 and the current reference; it applies to D-32 as much as to §8.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L816-L818]] "**D-32 — The blocking model is exactly Max's two cases, realised as a `PreToolUse`"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L71-L71]] "if i ask a question and their next move isnt a direct answer or them taking actions to provide an answer, then then need corrected"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L60-L60]] "case described as out of scope"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L426-L426]] "It is **delivery, not a block**"
- [[https://code.claude.com/docs/en/hooks.md]] "Prevents Claude from stopping, continues the conversation"
- [[https://code.claude.com/docs/en/hooks.md]] "Claude Code applies an 8-consecutive-continuation cap"
**Correct verdict:** replace — D-32 realises answer-drift on the deviating move itself: a non-answer-directed tool action is denied at `PreToolUse`, and a turn that ends with Max Cogar's question unanswered is blocked at `Stop` (`decision: "block"`, reason naming the question), judged from `last_assistant_message` and bounded by `stop_hook_active` and the harness cap, a cap release with the question open recorded as an FR-M2 fault; the skill block stays a `PreToolUse` deny (engineering realisation of OL-C3/OL-C5; the spec change goes to Max Cogar with the others).

### E-35
**Agree/Disagree:** Verdict: agree (undetermined). Reasoning: agree that both of D-33's stated reasons fail. (1) The "ecosystem assumes Node" premise is false: Claude Code's npm package installs a native binary that does not use Node at runtime. (2) C-1's "weaker store options" for Python is contradicted by execution: stdlib `sqlite3` creates an FTS5 table here with no toolchain. Part b adds two facts about the Node side, re-checked here: `node:sqlite` is still marked active development in the v22 docs, and `SQLITE_ENABLE_FTS5` enters `deps/sqlite/sqlite.gyp` only at v22.16.0 (the built code already requires `>=22.16.0`). Asked whether sources settle the choice: they do not, but the missing item is not only "which runtimes the target machines carry". A real differentiator exists that neither the spec nor the first audit states: the indexer's broad-language parsing (C-6). In Node it runs from WASM (`web-tree-sitter` plus prebuilt `.wasm` grammars, no native module); Python's `tree-sitter` binding ships as per-platform compiled wheels (or an sdist that needs a C compiler). Whether that difference matters depends on what C-3's "no prebuilt-binary download" means, which part b sent to Max Cogar as an owner question (its E-38): if registry-delivered platform wheels are allowed, the differentiator vanishes. So the choice is genuinely undetermined, gated on that answer, plus which runtime the target environments carry.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L826-L827]] "using the language the Claude Code tooling ecosystem already assumes."
- [[https://code.claude.com/docs/en/setup.md]] "the package downloads a native binary that doesn't use your Node.js at runtime"
- [[ran]] `python3 --version; python3 -c "import sqlite3;c=sqlite3.connect(':memory:');c.execute('create virtual table t using fts5(x)');print('py fts5 ok', sqlite3.sqlite_version)"` → `Python 3.11.15` / `py fts5 ok 3.45.1`
- [[https://nodejs.org/docs/latest-v22.x/api/sqlite.md]] "Stability: 1.1 - Active development."
- [[ran]] `for t in v22.13.0 v22.15.0 v22.16.0; do curl -sSL https://raw.githubusercontent.com/nodejs/node/$t/deps/sqlite/sqlite.gyp | grep -c SQLITE_ENABLE_FTS5; done` → `0` / `0` / `1`
- [[middleware/context-oracle/ctxoracle/package.json@ec3b057:L10-L10]] "\"node\": \">=22.16.0\""
- [[ran]] `curl -sSL https://pypi.org/pypi/tree-sitter/json` then listing the release files → version `0.26.0`, 41 files; distinct platform tags include `macosx_11_0_arm64.whl`, `manylinux2014_x86_64.manylinux_2_17_x86_64.manylinux_2_28_x86_64.whl`, `musllinux_1_2_x86_64.whl` and `win_amd64.whl`; the only sdist is `tree_sitter-0.26.0.tar.gz`
- [[ran]] `cd middleware/context-oracle/ctxoracle/node_modules; find web-tree-sitter tree-sitter-wasms -name "*.wasm" | wc -l; find web-tree-sitter tree-sitter-wasms -name "*.node" | wc -l` → `39` / `0` (36 grammar `.wasm` files plus 3 runtime copies; no native module)
**Correct verdict:** undetermined — D-33's two stated reasons are false and must go; missing: the meaning of C-3's "no prebuilt-binary download" (owner question, part b E-38), which decides whether Node's WASM parsing path is a real advantage over Python's compiled `tree-sitter` wheels, and which runtimes and versions the target environments carry (engineering, gated on the owner answer).

### E-36
**Agree/Disagree:** Verdict: agree (replace). Reasoning: the decision is sound; the quoted words are in no source, while the Week 23 digest has exact words to quote. Part b made the same finding on FR-B4 (its E-29).
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L832-L833]] "\"feedback, continuing the interaction, not an error\""
- [[https://code.claude.com/docs/en/whats-new/2026-w23.md]] "can return hookSpecificOutput.additionalContext to give Claude feedback and keep the turn going instead of being treated as an error"
**Correct verdict:** replace — quote the digest exactly or drop the quotation marks (engineering).

### E-37
**Agree/Disagree:** Verdict: disagree (keep → replace). Reasoning: the cost-asymmetry reasoning is sound and the two-guard design stands. The flaw is its premise as written: "(Max cannot see a skipped step, OL-11)". OL-11 records that he is a non-programmer and that verification is the agents' job; it does not say he cannot see a skipped step, and OL-C2 records him noticing agents not following his skills. Part a found the same attribution defective in FR-A2k and FR-M2 (its E-58, E-84). The correct premise keeps the design: an unanswered question is something Max Cogar meets in ordinary use of his own session, so the human channel works for answer-drift; checking skill conformance is verification work, which OL-11 assigns to the agents, so that guard must be automated.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L840-L841]] "(Max cannot see a skipped step,"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L49-L49]] "design/build/verification/docs/roadmap are the agents'. You are a non-programmer by design."
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L68-L68]] "IF THE AGENTS ARENT FOLLOWING MY SKILLS, THEN THAT SHIT NEEDS TO BE BLOCKED AT SOME POINT."
**Correct verdict:** replace — D-35's skill-block premise reads "checking skill conformance is verification work, which OL-11 assigns to the agents, not to Max" in place of "Max cannot see a skipped step, OL-11"; the rest stands (engineering).

### E-38
**Agree/Disagree:** Verdict: agree (replace). Reasoning: the regret requirement stands on its derivation (a loop fed only by spoken-whisper signals can cut its error by going quiet and still read healthy); the "silence is costlier" ranking is not derived from the mission and adds a claim nothing backs. With the ranking gone, "ships high" (E-19) and regret are one consistent policy.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L847-L848]] "The silence-is-costlier asymmetry is a **mission-derived judgment**."
**Correct verdict:** replace — keep the regret requirement on its derivation; drop the ranking here and at FR-L4 (engineering).

### E-39
**Agree/Disagree:** Verdict: agree (keep). Reasoning: derived from the mission's timing clause; X5's measured model latency confirms the whisper is necessarily late, which is why the bound is needed.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L851-L853]] "deliver at the next relevant"
**Correct verdict:** keep — engineering, derived.

### E-40
**Agree/Disagree:** Verdict: disagree (keep → replace). Reasoning: the harness fact is right (`last_assistant_message` is the text on `Stop`) and framing recognition as a classification is right. The first audit kept the stated lean, "errs toward silence", without testing it against the costs, which is what FR-B5 does for the blocks. The two errors: a false fire at an ordinary stop injects a true fact (a covering test exists and was not run) once and releases (FR-B4, bounded by `stop_hook_active`), costing one extra model turn; a miss lets an agent stop with unverified work, the failure OL-12 calls a must-have to catch. The cited reasons do not support silence: P5 is about marginal value (the covering-test mapping has it) and P3 bans rituals, not one informative whisper. So the lean is backwards. Part a reached the same conclusion on FR-A2g (its E-53).
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L855-L856]] "The recognizer is a property that errs toward silence"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L50-L50]] "having the oracle speak when an agent claims it's done is a must-have feature in my mind"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L413-L415]] "both forms are bounded by `stop_hook_active`"
- [[https://code.claude.com/docs/en/hooks.md]] "The last_assistant_message field contains the text content of Claude's final response, so hooks can access it without parsing the transcript file."
**Correct verdict:** replace — D-38: the recognizer is a classification that errs toward firing when a covering test for the changed region exists and was not run (a false fire delivers a true fact once and releases; a miss defeats OL-12), with its false-fire rate measured (FR-M4) (engineering).

### E-41
**Agree/Disagree:** Verdict: agree (keep). Reasoning: OL-C5's second acceptable move preserved explicitly; defined positively (OL-R5).
**Evidence:**
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L71-L71]] "their next move isnt a direct answer or them taking actions to provide an answer"
**Correct verdict:** keep — owner definition.

### E-42
**Agree/Disagree:** Verdict: agree (replace). Reasoning: agree that the phasing stands and that "a wrongful hold self-recovers in one round-trip" is unbacked. It is also doubtful on the numbers: a Phase B classification is a model call of about 4 s (X5), and the agent's next move after a deny is itself a model turn, so which finishes first is not given. Disagree with the fix, which writes `MessageDisplay` into the spec as the answer-text source.
1. **The experiment does not discriminate.** X1 re-ran the first audit's headless experiment three times and added the check it lacked: whether the transcript already held the assistant's answer when `PreToolUse` fired. It did, in all three runs, exactly when `MessageDisplay` had it. So the executed evidence shows no lag for either source in headless mode; the case for `MessageDisplay` rests on the documented "may lag" alone.
2. **The mode that matters is untested.** Max Cogar works interactively. There the documented behaviour is batch-by-batch display with a final batch that may end mid-line, and nothing documents where the final batch falls relative to the next `PreToolUse`. X2 could not be run (interactive login required). The first audit states this limit, but its verdict adopts the source anyway.
3. **`MessageDisplay` fails silently for this use.** It is a display event: if the hook fails or times out, Claude Code displays the original text, and the oracle simply never receives the answer, a silent failure the fail-fast rule forbids. Its `message_id` cannot be matched to transcript messages, and nothing documents it firing for a subagent's text.
4. **Which mechanism supplies the text is the architect's.** The spec's own rule leaves mechanism to the architect except where a constraint is itself a requirement (L15–17). The requirement is a property: the source must hold the agent's text before the next `PreToolUse`, verified in the modes the oracle runs in.
The first audit's other parts stand: keep a hold for the Phase B classifier lag, and measure hold durations as an FR-M2 signal instead of asserting a recovery time.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L873-L873]] "a wrongful hold self-recovers in one round-trip, a missed drifter does not"
- [[https://code.claude.com/docs/en/hooks.md]] "may not yet include the current turn's most recent messages when a hook fires"
- [[ran]] X1, `$W/mdi`, 3 runs → each run: `MessageDisplay 'ANSWER-TEXT-7 is my answer.' idx=0 final=True agent=None transcript_has_answer=yes`, then `PreToolUse 'echo hi' agent=None transcript_has_answer=yes`, then `PostToolUse 'echo hi' agent=None transcript_has_answer=yes` (gaps MessageDisplay→PreToolUse 0.17 s, 0.16 s, 0.14 s)
- [[ran]] X2, `timeout 200 python3 $W/mdi/drive2.py $W/mdi i2` → the interactive client stops at `Select login method:` with an OAuth URL; no hook fired (`order.log` has no entry after `--- interactive i2`)
- [[https://code.claude.com/docs/en/hooks.md]] "If the hook fails or times out, Claude Code displays the original text."
- [[https://code.claude.com/docs/en/hooks.md]] "so it can't be correlated with transcript message ids"
- [[https://code.claude.com/docs/en/hooks.md]] "The single call arrives after the message completes and carries the full message text"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L15-L17]] "Component boundaries, storage engines, IPC, algorithms, and the exact"
- [[ran]] X5 (E-11) → one-shot model call 3.85–4.23 s
**Correct verdict:** replace — D-41 keeps the phasing and the clear-axis hold; "self-recovers in one round-trip" is replaced by hold durations recorded as an FR-M2 signal (a hold that outlives its bound is the "deny that outlives its condition" fault); the answer text must come from a source verified by the §13 spike (E-44) to hold the agent's text before the next `PreToolUse` in the modes the oracle runs in, and the choice between `transcript_path` and `MessageDisplay` (each with the caveats above) is the architect's (engineering).

### E-43
**Agree/Disagree:** Verdict: agree (keep). Reasoning: a section title.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L878-L878]] "## 13. What is genuinely open"
**Correct verdict:** keep — heading.

### E-44
**Agree/Disagree:** Verdict: agree (replace). Reasoning: agree that the lead lists nothing live while a harness behaviour gates Phase A's answer-drift design, and that the thin-history paragraph is not an unknown. The open item must be stated as E-42 finds it, not as "`MessageDisplay` ordering": whether the answer text is visible to the oracle before the next `PreToolUse` in interactive mode is undocumented for both candidate sources (`transcript_path` "may lag"; `MessageDisplay` batching vs `PreToolUse` unstated), and headless runs showed both fresh (X1).
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L882-L883]] "gates v1's design."
- [[middleware/context-oracle/CLAUDE.md@ec3b057:L212-L213]] "a spec-§13 assumption that gates the phase"
- [[https://code.claude.com/docs/en/hooks.md]] "Claude Code holds each batch until your hook returns, so keep the hook fast."
**Correct verdict:** replace — §13's lead lists the open item gating Phase A: which source makes the agent's answer text visible before the next `PreToolUse` in interactive mode (transcript or `MessageDisplay`), to be spiked before design-freeze; resolved items and stated behaviour are not listed (engineering).

### E-45
**Agree/Disagree:** Verdict: agree (replace). Reasoning: both quoted phrases are absent from the current reference; the deny reason is documented as shown to Claude, and the parent-injection sentence now names the `Agent` tool.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L887-L888]] "the docs' \"avoids retrying\" is a design intent"
- [[https://code.claude.com/docs/en/hooks.md]] "For \"deny\", shown to Claude."
- [[https://code.claude.com/docs/en/hooks.md]] "To inject context into the parent session after a subagent returns"
**Correct verdict:** replace — re-quote from the current reference with the fetch date (engineering).

### E-46
**Agree/Disagree:** Verdict: agree on the defect, disagree on the form of the fix (replace → remove). Reasoning: the paragraph lists "consequence" among behaviours that survive thin history, but FR-A2d's headline (historically-coupled tests) is history-derived; only its zone flag is structural. Checked whether the first audit's fix narrows a requirement: it does not. No requirement makes Consequence history-free, and §1 already bounds thin-history behaviour by the corpus floor. The fix corrects a false description to match FR-A2d as written. (Making Consequence history-free, for instance from a structural covering-test map, would be a change to FR-A2d in part a, not a fix to this sentence.) But "say X and move it to FR-A6" leaves nothing to say here: FR-A6 already carries the same list, which part a corrects in the same words (its E-79), and the D-27 clause restates FR-A2g. The paragraph is a duplicate in a section it does not belong to.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L903-L904]] "reuse, consequence, conformance, and answer-drift behaviours still operate"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L168-L168]] "**historically-coupled tests** this edit tends to break, and a vendored/build-**zone** flag"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L250-L252]] "the structural, reuse, consequence, conformance, and answer-drift"
- [[middleware/context-oracle/CLAUDE.md@ec3b057:L81-L82]] "**One fact, one home**"
**Correct verdict:** remove — delete the §13 thin-history paragraph; its content lives at FR-A6 (corrected per part a E-79: Consequence's zone flag operates, its coupled-tests headline thins) and FR-A2g (engineering).

### E-47
**Agree/Disagree:** Verdict: agree on the defect, disagree on the fix (replace → remove). Reasoning: "No owner question is open" is false. But the first audit's replacement, a list in the spec of which lines await Max Cogar's decision, is project state: it changes as he answers, fails the spec's membership test (a requirement, constraint or acceptance criterion) and passes STATUS's ("would this have been different a week ago?"). The first audit notices the routing rule and keeps a spec copy anyway. The false sentence goes; the questions live in STATUS.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L907-L907]] "No owner question is open"
- [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B8-verification.md@HEAD:L191-L191]] "Still open: his sign-off on the FR-O2 / FR-A2d / AC-1c wording."
- [[middleware/context-oracle/CLAUDE.md@ec3b057:L72-L74]] "Would this have been different a week ago?"
**Correct verdict:** remove — delete the sentence; the open owner questions (FR-O2/FR-A2d/AC-1c wording, E-6, E-10, E-22, the C-3 environments) are stated in `docs/STATUS.md` (engineering).

### E-48
**Agree/Disagree:** Verdict: agree (keep). Reasoning: a section title.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L912-L912]] "## 14. Acceptance criteria"
**Correct verdict:** keep — heading.

### E-49
**Agree/Disagree:** Verdict: agree (replace). Reasoning: agree on the three defects: two test conditions for the same criteria, an undefined "clean session", and "every criterion" including criteria not yet written. Disagree with one part of the fix: it names "the AC-18 exit run" as the real-repository run, but AC-18 is defined on "a rich fixture seeded with known decision-changing facts", not on a real repository. The real-repository run the spec actually requires is §11.5's Phase A exit ("measured whisper/block + false-fire and regret data on a real repo"). Moving the real-repo demand onto a seeded fixture would drop it, a narrowing of the completion rule.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L914-L916]] "all use fixture repositories and replay. **v1 is"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L1085-L1086]] "On a rich fixture seeded"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L755-L757]] "Exits by producing measured whisper/block"
**Correct verdict:** replace — each criterion passes on its fixture; v1 completion also requires the §11.5 exit run on a real repository, with `status` showing no self-detected FR-M2 failure class for it (the definition of "clean"); and it names the Phase B/C criteria still to be written into §14 (engineering).

### E-50
**Agree/Disagree:** Verdict: agree (keep). Reasoning: discriminating on fact, evidence, pointer and P5; "within latency" follows NF-1.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L920-L922]] "a coupling whisper about an obvious same-directory,"
**Correct verdict:** keep — engineering.

### E-51
**Agree/Disagree:** Verdict: disagree (keep → replace). Reasoning: AC-1a requires the Orientation whisper to headline "the 2–4 entry-point files and the one binding invariant". Those are counts. A correct oracle with five bar-clearing entry points, or two binding invariants, fails this criterion. FR-A5 states that no count limit suppresses a candidate that clears the bar, and OL-C1 bars an arbitrary limit on how the oracle speaks. Nothing in the spec, §9 or §12 sources "2–4" or "one". The first audit kept it as "FR-A2a's own range", which is consistency with an unbacked line; part a found FR-A2a's counts defective for the same reason (its E-47).
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L924-L924]] "Orientation whisper headlines the **2–4 entry-point files and the one binding invariant**;"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L236-L237]] "**No *volume, count, or budget* limit suppresses a"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L67-L67]] "at no point should an arbitrary limit influence how that operates."
**Correct verdict:** replace — AC-1a: on a prompt for a task with known structure, the Orientation whisper headlines the task's structural entry-point files and binding invariant(s) that clear the bar (FR-A5), and does not deliver task-shape landmines (FR-A2e) (engineering).

### E-52
**Agree/Disagree:** Verdict: agree (keep). Reasoning: fails a bare-existence whisper; tests the convention.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L926-L928]] "a whisper that only states a symbol exists fails."
**Correct verdict:** keep — engineering.

### E-53
**Agree/Disagree:** Verdict: agree (replace). Reasoning: agree with the AC-1c rewording (the whisper reaches the agent with the edit's result, not before the edit). On the changelog claim the coordinator asked about: the Claude Code changelog entry for 2.1.110 (April 15, 2026) reads, verbatim, "Fixed `PreToolUse` hook `additionalContext` being dropped when the tool call fails". That says that since 2.1.110 the context is kept when the tool call fails, which is what FR-O2's "preserved even if the tool call later fails" asserts. X3 confirms it by execution on 2.1.284: a `Bash` call that failed (exit code 2, `is_error: true`) still carried the hook's text, recorded in the transcript as `hook_additional_context` and quoted back by the model, 2 of 2 runs. So the first audit is right that the 2026-09-28 ruling was wrong to call the clause unsourced, and part b's first audit, which deletes the clause (its E-33), is contradicted by source and execution. One precision: the changelog is a fix note, not the hooks reference, so the citation should name the version it holds from.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L929-L929]] "On an edit about to run in a file with known"
- [[https://code.claude.com/docs/en/hooks.md]] "String added to Claude's context alongside the tool result."
- [[https://code.claude.com/docs/en/changelog.md]] "Fixed PreToolUse hook additionalContext being dropped when the tool call fails"
- [[ran]] `awk 'NR<=4735 && /<Update label/ {l=NR": "$0} NR==4735{print l}' $W/changelog.md` → `4708: <Update label="2.1.110" description="April 15, 2026">`
- [[ran]] X3, `$W/failctx`, runs 3 and 4 → tool result `Exit code 2\nls: cannot access './no-such-file-xyz': No such file or directory`, `is_error: True`; transcript attachment `{"type": "hook_additional_context", "content": ["CTXMARK-4417: the file notes.txt is generated."], "hookName": "PreToolUse:Bash"`; final replies end `CTXMARK-4417: the file notes.txt is generated.` (both runs)
- [[middleware/context-oracle/docs/reviews/2026-09-28-branch-audit-coordinator-rulings-schema-and-edit-timing.md@HEAD:L94-L95]] "FR-A2d, AC-1c and L211 say the warning is delivered with the edit's result,"
**Correct verdict:** replace — AC-1c as the first audit states it; FR-O2's "preserved even if the tool call later fails" is kept with the citation "Claude Code changelog 2.1.110 (2026-04-15), confirmed by execution on 2.1.284" (engineering).

### E-54
**Agree/Disagree:** Verdict: agree (keep). Reasoning: tests the unchanged partner, its ratio and the single self-releasing Stop injection on a documented channel.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L933-L935]] "delivered at the stop via a single self-releasing Stop-time injection"
**Correct verdict:** keep — engineering.

### E-55
**Agree/Disagree:** Verdict: agree (replace). Reasoning: agree that the mutation clause, read literally, fails the sanctioned `init` write. Addition: if answer-drift also lands at `Stop` (E-34), AC-2's control-flow assertion ("the deny's only call sites are the two FR-B1 recognizers") must also cover the `Stop` block's call site, or a Stop block elsewhere would pass it (part b E-31 makes the same point about FR-B3).
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L939-L940]] "and no code path mutates the repo or an"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L942-L942]] "the deny's only call sites are the two FR-B1 recognizers"
**Correct verdict:** replace — "no code path other than `init`/`deinit` hook wiring (D-9) mutates the repo, and none mutates an action's input"; the control-flow assertion covers every deny and every `Stop` block call site (only the FR-B1 recognizers and FR-B4's single-cycle delivery) (engineering).

### E-56
**Agree/Disagree:** Verdict: disagree (keep → replace). Reasoning: the plumbing test is well built for tool actions. But it asserts "The deny never lands on a `Stop`", which is the gap E-34 finds: OL-C5 covers a turn that ends with a non-answer, OL-R5 rejected leaving that case out, and the contract's `Stop` block is the reactive way to catch it. With the question state fixture-controlled, the plumbing criterion must include that landing.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L956-L956]] "The deny never lands on a `Stop`"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L60-L60]] "Agent's narrow proxy + negative-space padding, not Max's rule."
**Correct verdict:** replace — AC-2a adds: with a question marked outstanding, a turn that ends without answering is blocked at `Stop` with the reason naming the question, and a substantive text answer at the continuation clears it; "The deny never lands on a Stop" is deleted (engineering).

### E-57
**Agree/Disagree:** Verdict: agree (keep). Reasoning: per-consumer scope on the documented `agent_id`.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L960-L961]] "a **subagent's** `PreToolUse` is **not** denied for it"
**Correct verdict:** keep — engineering, from OL-C5 and FR-O6.

### E-58
**Agree/Disagree:** Verdict: agree (keep). Reasoning: discriminating; phased by D-41.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L971-L972]] "**This discrimination is a comprehension judgment, so it is a"
**Correct verdict:** keep — engineering.

### E-59
**Agree/Disagree:** Verdict: agree (replace). Reasoning: agree the sentence attributes a preference to Max Cogar without a citation. Disagree with dropping the owner link: OL-C2 does back the substance. He wants the oracle aware of his skills' steps and wants agents that skip them blocked. The independent-review hand-off is a declared step of his `expert-implement` skill (E-5). So a fixture anchored on a declared step of one of his skills certifies enforcement OL-C2 asks for; the fix is to cite that, not to delete the connection to the owner's requirement.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L981-L982]] "so a passing AC certifies enforcement Max cares"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L68-L68]] "I wanted their structures to be programmed into the oracle so the oracle would know when they're activated, what steps are within the expert skill being used"
- [[claude-plugins/expert-dev-tools/skills/expert-implement/SKILL.md@ec3b057:L187-L187]] "## Hand off to independent review"
**Correct verdict:** replace — "Anchoring the fixture to a declared step of one of Max's skills with an observable required action (FR-C1a; e.g. `expert-implement`'s independent-review hand-off) is required so a pass certifies the enforcement OL-C2 asks for, not an abstract fixture skill structure" (engineering, cited to OL-C2).

### E-60
**Agree/Disagree:** Verdict: disagree (keep → replace). Reasoning: the criterion discriminates in both directions for both blocks, and its human-correction clause is fixture-injected. But it carries the same unbacked premise as FR-C4 and D-35: "(automated — Max is blind here, OL-11)". Per E-37 the premise is corrected, not the test.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L993-L993]] "(automated — Max is blind here, OL-11)"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L49-L49]] "design/build/verification/docs/roadmap are the agents'."
**Correct verdict:** replace — "(automated — conformance checking is the agents' verification work, OL-11)" in place of "Max is blind here, OL-11"; the criterion is otherwise unchanged (engineering).

### E-61
**Agree/Disagree:** Verdict: agree (keep). Reasoning: fails a per-event count cap (OL-R1) directly.
**Evidence:**
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L56-L56]] "\"At most one whisper per event.\""
**Correct verdict:** keep — tests OL-C1 against OL-R1.

### E-62
**Agree/Disagree:** Verdict: agree (keep). Reasoning: both directions of OL-C4.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L1008-L1010]] "hazard fires **with its confidence flagged**, not silence"
**Correct verdict:** keep — tests an owner decision.

### E-63
**Agree/Disagree:** Verdict: agree (keep). Reasoning: three cases, three defects.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L1011-L1013]] "a high-quality fact about a file the"
**Correct verdict:** keep — engineering.

### E-64
**Agree/Disagree:** Verdict: agree (replace). Reasoning: follows E-26.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L1014-L1015]] "`compact`"
**Correct verdict:** replace — the compact case asserts both sets are cleared (or reconciled per E-26), so a fact delivered before compaction is delivered again when next relevant (engineering).

### E-65
**Agree/Disagree:** Verdict: agree (keep). Reasoning: fails an adoption window; tests the evidentiary floor.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L1016-L1018]] "a rich-history session fires regardless of how few sessions have"
**Correct verdict:** keep — engineering.

### E-66
**Agree/Disagree:** Verdict: agree (replace). Reasoning: "differs only by the removed hook wiring" has two readings; the correct end state is the pre-`init` tree. If E-21 resolves to committed wiring for cloud sessions, `deinit` must still restore a pre-existing settings file byte for byte.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L1019-L1020]] "differs only by the removed hook wiring."
**Correct verdict:** replace — after `init`/`index`/session/`deinit` the tree is identical to its pre-`init` state (engineering).

### E-67
**Agree/Disagree:** Verdict: agree (keep). Reasoning: fails a run-state-only whisper; checks the delivery form. Unaffected by E-40's lean correction (the criterion starts at a recognised completion claim).
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L1024-L1027]] "a whisper whose headline is only the run-state (\"your test was not run\"), with no"
**Correct verdict:** keep — engineering.

### E-68
**Agree/Disagree:** Verdict: agree (replace), but the first audit's fix is not enough. Reasoning: agree "interpreter-write" is undefined anywhere in the project's docs. More: AC-8a certifies that an unanswered question at a done-claim is "delivery, not a block (the stop still proceeds)". Under E-34 (and part b's E-26/E-29), a turn that ends with Max Cogar's question unanswered is blocked at `Stop`, so this criterion would certify the gap. It becomes the `Stop`-landing test of the block, keeping its honest best-effort caveat in plain words.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L1036-L1036]] "the common Phase-A case (interpreter-write, never-answered) it may **not** fire"
- [[ran]] `git grep -n -i "interpreter-write" ec3b057 -- middleware/context-oracle/docs` → only `spec-context-oracle.md:1036`
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L1032-L1032]] "it is **delivery, not a block** (the stop still proceeds)"
**Correct verdict:** replace — AC-8a: at a stop where an outstanding Max question is recognised as unanswered, the `Stop` is blocked with the reason naming it (E-34), and the stop proceeds once it is answered; the criterion records that the answered-recognizer is Phase-A conservative, so a question the agent moved past through actions the recognizer allowed may not be caught (no undefined term) (engineering).

### E-69
**Agree/Disagree:** Verdict: agree (keep). Reasoning: every FR-M2 class is induced and must surface; E-8's corrected "due" derivation does not change what it checks.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L1039-L1042]] "**a stale index** each appear in the log and `status` as a self-detected failure class"
**Correct verdict:** keep — engineering, from OL-10.

### E-70
**Agree/Disagree:** Verdict: agree (replace). Reasoning: a second copy of NF-1's undetermined numbers.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L1054-L1056]] "p95 ≤ 1.5s, none"
**Correct verdict:** replace — "within NF-1's latency budget" (engineering).

### E-71
**Agree/Disagree:** Verdict: agree (keep). Reasoning: each clause maps to a threat.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L1057-L1059]] "Planted secret redacted everywhere; injection-"
**Correct verdict:** keep — engineering.

### E-72
**Agree/Disagree:** Verdict: agree (keep). Reasoning: tests OL-2's degraded mode without over-claiming.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L1064-L1066]] "**not** assert \"the block works,\""
**Correct verdict:** keep — tests an owner decision.

### E-73
**Agree/Disagree:** Verdict: agree (replace). Reasoning: "~30" cannot decide a pass; the cap is tunable.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L1067-L1068]] "Merge commit, >~30-entity transaction"
**Correct verdict:** replace — "a transaction larger than the configured cap (FR-K2)" (engineering).

### E-74
**Agree/Disagree:** Verdict: agree (keep). Reasoning: checkable per whisper; the no-imperative clause matches the harness's own guidance.
**Evidence:**
- [[https://code.claude.com/docs/en/hooks.md]] "Write the text as factual statements rather than imperative system instructions."
**Correct verdict:** keep — engineering.

### E-75
**Agree/Disagree:** Verdict: agree (keep). Reasoning: tests OL-8 on the documented field.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L1073-L1074]] "A subagent tool event draws a whisper into"
**Correct verdict:** keep — tests an owner decision.

### E-76
**Agree/Disagree:** Verdict: agree (keep). Reasoning: decidable once Phase A data sets N/M; fails a ratchet.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L1077-L1078]] "(**N events or M sessions**, the values set from"
**Correct verdict:** keep — engineering.

### E-77
**Agree/Disagree:** Verdict: agree (replace). Reasoning: agree "broad" cannot fail and "a fixed three" tests one wrong number. Disagree with the fix's anchor: it says the shipped set is "the one D-15 records", but D-15 records no set. A criterion that also drops the breadth assertion would test only extensibility, a narrowing of C-6. Breadth becomes decidable when C-6 states its coverage set; part b's C-6 fix (its E-42) proposes "every language present in the repositories Phase A runs on", which gives the test something to check.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L1082-L1084]] "nothing is hardcoded to a fixed three."
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L799-L799]] "**D-15 / C-6 — Language coverage is broad and extensible, not a hardcoded short list.**"
**Correct verdict:** replace — AC-17: every language in C-6's stated coverage set is indexed and mined on a fixture, and a language outside that set is added by configuration alone (no code change) and then indexed and mined; C-6 (part b) states the set (engineering).

### E-78
**Agree/Disagree:** Verdict: agree (keep). Reasoning: seeded-pointer matching fails a quiet tool and refuses count-padding.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L1088-L1090]] "not** hitting a"
**Correct verdict:** keep — engineering, from the mission.

### E-79
**Agree/Disagree:** Verdict: agree (keep). Reasoning: record identity and no egress.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L1091-L1093]] "**record-identical** to the originals"
**Correct verdict:** keep — engineering.

### E-80
**Agree/Disagree:** Verdict: agree (keep). Reasoning: it tests C-3 as a property and restates C-3's terms, so it follows whatever C-3 becomes when its environment question (part b E-38) is answered; it carries no flaw of its own. With FTS5 absent from `node:sqlite` before v22.16.0 (E-35), the "C-2 mechanism functions" clause is exactly what catches a too-old runtime.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L1094-L1096]] "Install + first index in a"
**Correct verdict:** keep — engineering, tracking C-3.

### E-81
**Agree/Disagree:** Verdict: agree (keep). Reasoning: the recursion hazard is real: in X1, X3 and X4 the project's hooks fired in every headless `claude -p` run.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L1098-L1100]] "no unbounded hook→model→hook chain"
- [[ran]] X4, `$W/taskname` → `names.log`: `matcher=Task tool_name=Agent` / `matcher=Agent tool_name=Agent` (project `PreToolUse` hooks fired inside `claude -p`)
**Correct verdict:** keep — engineering.

### E-82
**Agree/Disagree:** Verdict: agree (keep). Reasoning: idle-then-event fails a timer path. The `[CHI]` key it names is corrected in §9 (part a E-72, part b); the test itself stands.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L1102-L1104]] "Verified by holding a session"
**Correct verdict:** keep — engineering.

### E-83
**Agree/Disagree:** Verdict: agree (keep). Reasoning: both properties are checked from stored state; the correction is fixture-injected.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L1105-L1108]] "verified by inspecting the two stores after a session."
**Correct verdict:** keep — engineering.

### E-84
**Agree/Disagree:** Verdict: agree (keep). Reasoning: true-positive and does-not-inflate fixtures; paired with AC-18.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L1113-L1114]] "*Does not inflate:* on a fixture where a held"
**Correct verdict:** keep — engineering.

### E-85
**Agree/Disagree:** Verdict: agree (keep). Reasoning: each clause fails a distinct lateness or staleness defect.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L1122-L1124]] "the whisper is **dropped, not delivered** (a now-false"
**Correct verdict:** keep — engineering.

### E-86
**Agree/Disagree:** Verdict: agree (replace). Reasoning: acceptance criteria belong in the spec by the routing table; deferring their writing to Phase A data is right, housing them in the architecture is not.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L1128-L1129]] "their genre-specific acceptance criteria are authored with the Phase B architecture"
- [[middleware/context-oracle/CLAUDE.md@ec3b057:L72-L72]] "A requirement, constraint, or acceptance criterion?"
**Correct verdict:** replace — Phase B/C criteria are written into §14 when the Phase B architecture is drafted (engineering).

### E-87
**Agree/Disagree:** Verdict: agree (replace). Reasoning: the key range omits OL-C6 (the sign-off the status line cites) and later keys, and the dates duplicate §9 and are already stale.
**Evidence:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L1138-L1139]] "(OL-1…OL-12, OL-C1…OL-C5;"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L72-L72]] "**The v1 spec is signed off — good to go.**"
**Correct verdict:** replace — the footer names `OWNER-LEDGER.md` CONFIRMED and the mission as the foundation and points to §9 for verification dates (engineering).

