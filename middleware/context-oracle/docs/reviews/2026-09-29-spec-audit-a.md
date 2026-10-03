# Spec audit — part a (spec lines 1–276)

This file audits part a of the whole-spec audit: the 90 unit ids listed in
`/tmp/claude-0/-home-user-agent-armory/779c0f74-86b0-5e8f-b02d-811e78ed3f66/scratchpad/audit/SPEC-a.txt`,
covering lines 1–276 of `middleware/context-oracle/docs/specs/spec-context-oracle.md` at
`ec3b057` (§§1–6 up to FR-M3). It follows
`/tmp/claude-0/-home-user-agent-armory/779c0f74-86b0-5e8f-b02d-811e78ed3f66/scratchpad/audit/BRIEF.md`
(the acceptable-decision test, entry format, citation rules) and
`/tmp/claude-0/-home-user-agent-armory/779c0f74-86b0-5e8f-b02d-811e78ed3f66/scratchpad/audit/SPEC-BRIEF.md`,
which governs where the two differ. Every spec
change proposed here is a change to a document Max Cogar signed; per the M38 exchange it
goes to him before it replaces the old line. "Owner decision" marks a line whose content
is his (a ledger CONFIRMED entry); everything else is an engineering line.

Web sources were fetched with `curl` (through the checker's `webquote.py` cache) on
2026-09-29. Scratch work: `/tmp/claude-0/-home-user-agent-armory/779c0f74-86b0-5e8f-b02d-811e78ed3f66/scratchpad/specaudit/a/`.

### E-1
**Units:** SP-001-Spec-Context-Oracle-ctxo
**Question:** The title names the tool and CLI and marks the document as v1.
**Facts:**
- The title [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L1-L1]] "Spec: Context Oracle (`ctxoracle`) — v1"
- The name is an owner decision [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L39-L39]] "Name is **Context Oracle**, CLI `ctxoracle`."
**Standard:** Owner decision OL-1 (ledger CONFIRMED).
**Reasoning:** The title restates OL-1 exactly and asserts nothing else checkable.
**Alternatives:** None needed; the name is Max Cogar's.
**Consequences:** None.
**Verdict:** keep — the title matches OL-1.
**Would be wrong if:** OL-1 named the tool or CLI differently.

### E-2
**Units:** SP-002-Spec-Context-Oracle-ctxo
**Question:** The status paragraph states the document's authority: reviewed, signed off by Max Cogar, and fully traced ("every requirement traces to" an owner decision, a verified standard, or a recorded judgment).
**Facts:**
- The paragraph claims full traceability [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L5-L6]] "Every requirement traces to a CONFIRMED owner decision"
- The provenance key promises reasoning for every judgment [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L9-L10]] "judgment made while writing this spec (reasoning in §12)"
- Several §12 entries restate the decision with no reasoning: D-4 [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L790-L790]] "subtype declarative, corrected via CLI"
- D-9 [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L796-L796]] "The one in-tree write is `init` wiring"
- D-20 [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L806-L806]] "Session boundaries are not context boundaries"
- The sign-off was given without a line read [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L72-L72]] "He did not line-read the document"
**Standard:** BRIEF.md test item 2 (backing written down and checkable) and CLAUDE.md "Engineering standard": [[middleware/context-oracle/CLAUDE.md@HEAD:L222-L224]] "Every non-trivial requirement carries a source annotation (named standard, `[OL-n]`, or `[D-n]` with reasoning in spec §12)."
**Reasoning:** (1) The paragraph says every requirement traces to a recorded judgment with reasoning in §12. (2) D-4, D-9 and D-20 in §12 carry only a restatement, so the requirements tagged with them trace to no reasoning. (3) The traceability claim is therefore false as written. (4) The paragraph also reports the OL-C6 sign-off without the condition the ledger records (no line read), so a reader takes the signature as a check of every line, which the ledger says it is not.
**Alternatives:** Deleting the traceability sentence would narrow the claim instead of making it true. The correct fix is to write the missing reasoning into §12 (part c's units) and state OL-C6 as the ledger states it.
**Consequences:** Depends on part c's verdicts for the D-n entries in §12. Every provenance tag in lines 1–276 that points at a reasoning-free D-n inherits this gap (noted per entry below).
**Verdict:** replace — state the sign-off as the ledger records it ("signed off by Max Cogar 2026-08-28 without a line-by-line read, OL-C6") and keep the traceability sentence only once every D-n in §12 carries its reasoning. Engineering line; goes to Max Cogar as a change to his signed document.
**Would be wrong if:** reasoning for D-4, D-9 and D-20 exists in §12 or elsewhere in the spec and the provenance key points to it.

### E-3
**Units:** SP-003-Spec-Context-Oracle-ctxo
**Question:** The provenance paragraph defines the keys and asserts that every external source in §9 was verified against its current primary source on the dates shown.
**Facts:**
- The claim [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L11-L12]] "Every external source in §9 was verified against its current primary/authoritative"
- §9 dates the interruption paper to CHI 2007 [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L568-L568]] "*Leveraging characteristics of task structure to predict the cost of interruption*, CHI 2007"
- The publisher record says CHI 2006 [[https://experts.illinois.edu/en/publications/leveraging-characteristics-of-task-structure-to-predict-the-cost-]] "CHI 2006: Conference on Human Factors in Computing Systems - Montreal"
- `[MSR]` is "verified" through a different paper [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L559-L559]] "2026-08-25 (via HERZIG)"
- A hooks claim the spec marks as confirmed against the reference [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L480-L481]] "that text is preserved even if the tool call later fails"
- That phrase is not on the hooks page [[ran]] `python3 /tmp/claude-0/-home-user-agent-armory/779c0f74-86b0-5e8f-b02d-811e78ed3f66/scratchpad/audit/webquote.py https://code.claude.com/docs/en/hooks.md "preserved even if"` → exit 1 (not found)
**Standard:** BRIEF.md test item 3 (the backing is real: the source says what is claimed).
**Reasoning:** (1) The sentence asserts that each §9 source was checked against its primary source. (2) The primary record of the Iqbal & Bailey paper gives CHI 2006; §9 gives CHI 2007, so that entry was not checked against it. (3) `[MSR]` is a practice "verified" by citing a different paper, which is not verification of the practice against its own source. (4) FR-O2's "preserved" clause, marked confirmed against the hooks reference, is absent from it (also found by the branch audit, B2/B3 verification). (5) The blanket verification claim is false.
**Alternatives:** Dropping the claim would hide the gap. The correct fix is to re-verify each §9 row against its primary source, correct the rows (CHI year, MSR source, FR-O2 wording), and keep the sentence true.
**Consequences:** §9 rows and FR-O2 are part c/b units; FR-O5 (E-72) cites `[CHI]`.
**Verdict:** replace — re-verify and correct the §9 rows (at least `[CHI]` → CHI 2006, `[MSR]` given its own source) so that "every source was verified" is true, with dates of the new check. Engineering line; goes to Max Cogar as a change to his signed document.
**Would be wrong if:** the CHI 2007 proceedings contain this paper (a second publication), and MSR practice has a primary source matching §9.

### E-4
**Units:** SP-004-Spec-Context-Oracle-ctxo
**Question:** The paragraph separates what the spec decides (what the oracle must do) from what the architect decides (components, storage, IPC, algorithms, exact thresholds), and fixes requirement IDs as stable mnemonics `[D-23]`.
**Facts:**
- The split [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L15-L17]] "Component boundaries, storage engines, IPC, algorithms, and the exact"
- The ID rule [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L18-L18]] "Requirement IDs are stable mnemonics `[D-23]`."
- Why stability matters is shown in the spec itself: older documents cite IDs that must still resolve [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L467-L468]] "Older documents (`RETHINK.md`, the"
**Standard:** Derivation: a requirement ID is a reference key; documents written earlier (architecture, plan, reviews) cite it, so renumbering breaks every earlier citation. The project's own merge gate enforces this: [[middleware/context-oracle/CLAUDE.md@HEAD:L256-L258]] "fails the PR** on cross-document rot: a cited requirement or ledger key"
**Reasoning:** (1) The what/how split is a scope statement that the rest of the spec follows (e.g. "mechanism is the architect's" in C-2). (2) Stable IDs are required for cross-document citations to resolve, which the CI checker enforces. (3) Both claims are backed by the derivation; the exception "where a constraint is itself a requirement (§8)" covers NF-1's numbers.
**Alternatives:** Sequential renumbering would break citations; no better option.
**Consequences:** D-23's §12 entry (L810) has no reasoning; that is part c's unit, and the derivation above is the reasoning it needs.
**Verdict:** keep — the scope split and stable IDs are backed by the derivation.
**Would be wrong if:** the spec fixes an algorithm or component boundary outside §8 constraints without calling it a requirement.

### E-5
**Units:** SP-005-Spec-Context-Oracle-ctxo, SP-014-1-Problem-and-mission, SP-035-2-3-Explicit-N-A, SP-046-3-Product-principles, SP-070-4-What-the-oracle-says-a, SP-085-5-2-The-quality-bar-whic
**Question:** Horizontal-rule section separators.
**Facts:**
- Separator [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L20-L20]] "---"
- Separator [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L64-L64]] "---"
- Separator [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L126-L126]] "---"
- Separator [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L152-L152]] "---"
- Separator [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L200-L200]] "---"
- Separator [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L257-L257]] "---"
**Standard:** SPEC-BRIEF.md item 3: a line that asserts nothing checkable is kept.
**Reasoning:** Markdown separators assert nothing.
**Alternatives:** None.
**Consequences:** None.
**Verdict:** keep — structural markup only.
**Would be wrong if:** a separator hid content (it does not; each is a lone `---`).

### E-6
**Units:** SP-006-1-Problem-and-mission
**Question:** Section heading for §1.
**Facts:**
- Heading [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L22-L22]] "## 1. Problem and mission"
**Standard:** SPEC-BRIEF.md item 3.
**Reasoning:** The heading names the section's content and asserts nothing further.
**Alternatives:** None.
**Consequences:** None.
**Verdict:** keep — a heading that asserts nothing checkable.
**Would be wrong if:** §1 did not contain the problem and mission.

### E-7
**Units:** SP-007-1-Problem-and-mission
**Question:** The problem statement: agents under-read, misjudge sufficiency and invent; the missing knowledge lives in history and structure the agent does not consult; front-loaded briefings cost full tokens and "decay in salience as the session grows", backed by `RETHINK.md` §2.4.
**Facts:**
- The salience claim and its backing [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L29-L30]] "decay in salience as the session grows (`RETHINK.md` §2.4)"
- RETHINK §2.4 asserts it with no source [[middleware/context-oracle/RETHINK.md@ec3b057:L63-L65]] "One large structured document,"
- RETHINK is not authority for anything but owner decisions [[middleware/context-oracle/CLAUDE.md@HEAD:L58-L60]] "agent-contaminated in places, so only"
- Primary evidence exists for the claim [[https://arxiv.org/abs/2307.03172]] "significantly degrades when models must access relevant information in the middle of long contexts, even for explicitly long-context models"
**Standard:** BRIEF.md test item 2: backing must be a named standard, primary documentation, executed result or derivation; an agent's say-so is never backing.
**Reasoning:** (1) The salience-decay claim is empirical. (2) Its only cited backing is RETHINK §2.4, agent-written rationale with no source. (3) Liu et al., "Lost in the Middle" (TACL 2023/24), shows that information a model must retrieve from the middle of a long context is used significantly worse, which is exactly what happens to a briefing delivered at session start as the session grows. (4) The claim is right; its written backing is not real backing. (5) "Pay their full token cost regardless of what fraction is needed" follows by definition of a front-loaded briefing.
**Alternatives:** Keeping the RETHINK pointer leaves an unsourced empirical premise in a line that anchors the whole design.
**Consequences:** P6 and the whisper-at-the-moment design (§5.1) rest on this premise.
**Verdict:** replace — cite Liu et al., "Lost in the Middle: How Language Models Use Long Contexts" (arXiv 2307.03172, TACL) for the salience claim, in place of `RETHINK.md` §2.4. Engineering line; goes to Max Cogar as a change to his signed document.
**Would be wrong if:** RETHINK §2.4 or §9 already cites a primary source for the claim.

### E-8
**Units:** SP-008-1-Problem-and-mission
**Question:** Labels the next quote as the verbatim mission and the anchor for every requirement.
**Facts:**
- The label [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L32-L32]] "**Mission (verbatim, the anchor for every requirement):**"
- The source sentence [[middleware/context-oracle/RETHINK.md@ec3b057:L85-L86]] "deliver the fact that would change the agent's next"
- The project instructions carry the same sentence as the mission [[middleware/context-oracle/CLAUDE.md@HEAD:L273-L276]] "Deliver the fact that would change the agent's next decision, at the"
**Standard:** SPEC-BRIEF.md: the mission is the audit's test of whether a line belongs.
**Reasoning:** (1) The quoted sentence matches RETHINK §3 word for word after its "The oracle's job is to" prefix, and matches CLAUDE.md. (2) Making it the anchor is what the audit brief itself does.
**Alternatives:** None.
**Consequences:** Every line judged below is tested against it.
**Verdict:** keep — the label is accurate.
**Would be wrong if:** the mission sentence differs between RETHINK §3, CLAUDE.md and the spec.

### E-9
**Units:** SP-009-1-Problem-and-mission
**Question:** The mission sentence.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L34-L35]] "Deliver the fact that would change the agent's next decision, at the moment of"
- SPEC-BRIEF.md gives the same sentence as the audit's test of whether a line belongs [[middleware/context-oracle/CLAUDE.md@HEAD:L278-L279]] "If a proposed change doesn't serve that sentence, it doesn't belong in this"
**Standard:** SPEC-BRIEF.md "Mission" paragraph.
**Reasoning:** The line is the standard this audit applies; it is quoted identically in every governing document.
**Alternatives:** None.
**Consequences:** None.
**Verdict:** keep — it is the audit's own test.
**Would be wrong if:** the spec's wording differed from the mission used by SPEC-BRIEF.md.

### E-10
**Units:** SP-010-1-Problem-and-mission
**Question:** Defines the oracle: passive, "repository-resident", observes through hooks, injects one-fact whispers with a pointer, advisory by default, and "never mutates the repository" `[D-9]`.
**Facts:**
- The definition [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L37-L37]] "The Context Oracle is a passive, repository-resident intelligence."
- The absolute no-mutation claim [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L41-L42]] "never mutates the"
- The spec's own exception two sections later [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L115-L116]] "except the hook-wiring `ctxoracle init`"
- The stores are outside the tree [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L44-L44]] "both outside the repo tree"
- The no-mutation property's recorded rationale (OL-3's RETHINK §12.3) [[middleware/context-oracle/RETHINK.md@ec3b057:L326-L327]] "it never mutates the repo and never prevents an action"
**Standard:** BRIEF.md test item 6 (no conflict with the spec or ledger); raise-flaws rule: an input that "contradicts another requirement" is a flaw.
**Reasoning:** (1) L41–42 says the oracle never mutates the repository. (2) §2.2 and P8 allow one in-tree write, the `init` hook wiring. (3) Both cannot be true; the unqualified sentence is the one the architect reads first. (4) "Repository-resident" says the intelligence lives in the repository, while OL-6 puts both stores outside the tree; only the hook wiring is in the tree. (5) The rest of the paragraph (hooks, whisper, pointer, advisory) matches §4, FR-D1 and P2.
**Alternatives:** Removing the `init` exception instead would make the sentence true but is a separate design question (E-29); the minimum correct fix is to make this sentence state the property the rest of the spec states.
**Consequences:** P8 (E-42), §2.2 (E-29), FR-X5, AC-7.
**Verdict:** replace — "a passive, per-repository intelligence whose stores live outside the repository tree `[OL-6]` … never mutates the repository except the hook wiring `ctxoracle init` installs `[D-9]`". Engineering line; goes to Max Cogar as a change to his signed document.
**Would be wrong if:** "repository-resident" and "never mutates" are defined elsewhere in the spec to exclude the `init` wiring.

### E-11
**Units:** SP-011-1-Problem-and-mission
**Question:** States the second, owner-set objective: blocking in exactly the two cases Max Cogar confirmed, reactive only, delivering an instruction.
**Facts:**
- The line [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L45-L45]] "in exactly the two cases Max Cogar confirmed"
- Answer-drift [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L69-L69]] "the oracle should block that motherfucker until it stops ignoring me and actually answers"
- Skill non-conformance [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L68-L68]] "THEN THEY SHOULD BE FUCKING BLOCKED"
- The pre-emptive gate is what he rejected [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L68-L68]] "What he rejected is the **pre-emptive** gate"
**Standard:** Owner decisions OL-C2, OL-C3 (ledger CONFIRMED).
**Reasoning:** (1) Both cases, the reactive-only condition and the rejection of the pre-emptive gate are his words in the ledger. (2) "Exactly two" matches OL-3's "cases on record so far" read together with §8 L338, which makes any third case his decision, so it does not close off his scope. (3) No flaw by engineering standard in the objective itself; the mechanism is judged in E-19/E-59.
**Alternatives:** None; the objective is his.
**Consequences:** §2.1, §8.
**Verdict:** keep — owner decision stated as confirmed.
**Would be wrong if:** the ledger recorded a third confirmed block case.

### E-12
**Units:** SP-012-1-Problem-and-mission
**Question:** Names the user (Max Cogar, solo, his own repos, through Claude Code) and makes thin commit history (new repos, shallow clones) a design condition bounded by the corpus floor `[D-7, D-8]`.
**Facts:**
- The user [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L52-L53]] "A single developer (Max Cogar) working solo across his own"
- Solo scope [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L44-L44]] "solo scope, no team sharing"
- The thin-history condition [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L54-L55]] "(new repos, shallow clones) as a design condition"
- Sandbox compatibility is required [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L42-L42]] "Sandbox compatibility is required."
- This Claude Code cloud sandbox runs on a shallow clone [[ran]] `git -C /home/user/agent-armory rev-parse --is-shallow-repository` → `true`
**Standard:** Owner decisions OL-6, OL-4; executed result for the thin-history premise.
**Reasoning:** (1) The user and solo scope are OL-6. (2) OL-4 requires sandbox operation, and the executed check shows a sandbox session's checkout is shallow, so thin history is a real operating condition, not a hypothetical. (3) Bounding behaviour there by an evidentiary floor rather than a claim about typical repos follows: with little history, history-derived facts have little evidence.
**Alternatives:** Assuming rich history would fail OL-4 sandboxes.
**Consequences:** D-7/D-8 in §12 (L795) carry no reasoning; the executed result above is the reasoning they need (part c). FR-A6 (E-79).
**Verdict:** keep — owner scope plus a premise confirmed by execution.
**Would be wrong if:** Claude Code sandbox sessions were full clones in general (this one is not).

### E-13
**Units:** SP-013-1-Problem-and-mission
**Question:** Why the tool is worth building: the valuable knowledge is what an agent "cannot surface from a cold checkout with its own tools", and delivery at the decision point is what makes guidance used rather than ignored (`RETHINK.md` §2.3).
**Facts:**
- The claim [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L60-L60]] "cannot surface from a cold checkout with its own tools"
- Its backing [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L61-L62]] "is the difference between guidance that is used and a binder"
- The spec's own problem statement says the agent does not consult that knowledge, not that it cannot [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L28-L28]] "from history and structure the agent does not consult at the moment it decides"
- Primary evidence for decision-point delivery [[https://research.google.com/pubs/archive/43322.pdf]] "We have repeatedly found that when developers have to navigate to a dashboard or run a standalone command line tool, analysis usage drops off"
- And for timing [[https://research.google.com/pubs/archive/43322.pdf]] "Some tools displayed results too late, making developers less likely to fix problems after they had submitted their code"
**Standard:** BRIEF.md test item 2–3 (real, checkable backing); item 6 (no conflict with other lines).
**Reasoning:** (1) A checkout with history lets an agent run `git log`; co-change and landmine history are surfaceable, only costly. The spec's own L28 and P5 ("could not cheaply surface") say "does not consult" / "cheaply", so "cannot" overstates and conflicts with them. (2) The decision-point claim cites agent-written RETHINK §2.3; Sadowski et al., Tricorder (ICSE 2015), gives the primary evidence that out-of-workflow delivery loses use and that mistimed results lose uptake.
**Alternatives:** Keep as is: leaves an overstatement and an unsourced premise.
**Consequences:** P5 (E-39), P6.
**Verdict:** replace — "is what an agent cannot cheaply surface with its own tools and does not consult at the moment it decides" and cite `[TRICORDER]` (already in §9) for decision-point delivery in place of `RETHINK.md` §2.3. Engineering line; goes to Max Cogar as a change to his signed document.
**Would be wrong if:** the agent's checkout had no git history in all supported environments (then "cannot" would be literal).

### E-14
**Units:** SP-015-2-Scope
**Question:** Section heading for §2.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L66-L66]] "## 2. Scope"
**Standard:** SPEC-BRIEF.md item 3.
**Reasoning:** Names the section; asserts nothing further.
**Alternatives:** None.
**Consequences:** None.
**Verdict:** keep — heading only.
**Would be wrong if:** §2 did not hold scope.

### E-15
**Units:** SP-016-2-1-In-scope-v1
**Question:** Sub-heading for the in-scope list.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L68-L68]] "### 2.1 In scope (v1)"
**Standard:** SPEC-BRIEF.md item 3.
**Reasoning:** Names the list; asserts nothing further.
**Alternatives:** None.
**Consequences:** None.
**Verdict:** keep — heading only.
**Would be wrong if:** the list below were not v1 scope.

### E-16
**Units:** SP-017-2-1-In-scope-v1
**Question:** Puts the `ctxoracle` CLI and the hook shims that wire it into Claude Code in scope `[OL-1]`.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L70-L70]] "A CLI, `ctxoracle`, and the hook shims that wire it into a Claude Code session"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L39-L39]] "Name is **Context Oracle**, CLI `ctxoracle`."
- Hooks are the harness's lifecycle interface [[https://code.claude.com/docs/en/hooks.md]] "Before a tool call executes. Can block it"
**Standard:** OL-1; the Claude Code hooks reference.
**Reasoning:** The CLI and name are OL-1; observing a session requires hooks, which the reference documents as the lifecycle interface. The line asserts scope, not a component design.
**Alternatives:** An MCP server would be agent-initiated (pull), not passive observation; hooks are the only passive observation path documented.
**Consequences:** FR-O1, §10.
**Verdict:** keep — owner name plus the harness's documented interface.
**Would be wrong if:** the harness offered passive session observation other than hooks.

### E-17
**Units:** SP-018-2-1-In-scope-v1
**Question:** Puts passive observation and whisper delivery to the main agent and subagents in scope `[OL-8]`.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L72-L72]] "Passive observation of the session, and delivery of whispers as injected context,"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L46-L46]] "Subagent whisper delivery is in v1 scope"
- Hooks fire inside subagents [[https://code.claude.com/docs/en/hooks.md]] "the input carries the `agent_id` and `agent_type`"
**Standard:** OL-8; the hooks reference.
**Reasoning:** Owner scope, and the harness makes it feasible (hooks fire in subagents with identifying fields).
**Alternatives:** None; scope is his.
**Consequences:** FR-O6 (E-73).
**Verdict:** keep — owner decision, feasible per the reference.
**Would be wrong if:** subagent hook context could not reach the subagent.

### E-18
**Units:** SP-019-2-1-In-scope-v1
**Question:** Points the genre scope at §4 and the relevance machinery at §5.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L74-L74]] "delivered under the relevance machinery of §5"
**Standard:** SPEC-BRIEF.md item 3.
**Reasoning:** A pointer; the content is judged at §4 and §5.
**Alternatives:** None.
**Consequences:** None.
**Verdict:** keep — pointer only.
**Would be wrong if:** §4/§5 did not hold the genres and relevance machinery.

### E-19
**Units:** SP-020-2-1-In-scope-v1
**Question:** Puts the two blocks in scope and fixes their mechanism: "a reactive `PreToolUse` deny of the agent's deviating action". For answer-drift, OL-C5's rule — the agent's next move after Max's question must be a direct answer or an action to provide one, "if it is neither, the oracle denies that action … until the agent answers".
**Facts:**
- The mechanism [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L75-L75]] "via a reactive `PreToolUse` deny of the agent's"
- The rule as stated here [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L78-L78]] "agent's next move must be a **direct answer**"
- Max Cogar's rule [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L71-L71]] "if i ask a question and their next move isnt a direct answer or them taking actions to provide an answer, then then need corrected"
- He rejected treating the silent end of turn as out of scope [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L60-L60]] "Superseded by **OL-C5**; define the block positively, never by exclusion."
- §8 puts the block only on tool actions, never at Stop [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L351-L351]] "The block lands on the *action taken in violation of the condition*"
- A non-answer text turn is never corrected [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L369-L369]] "A text turn is never a tool action, so it is never denied"
- The uncaught case is left to Max [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L427-L427]] "is the recourse for every uncaught case"
- The 2026-08-25 review that set the mechanism called silent stops irreducible [[middleware/context-oracle/docs/reviews/2026-08-25-blocking-model-rebuild-6-rounds.md@ec3b057:L94-L94]] "silent stops, the substantive-vs-verified-correct clear bar, the eventually-"
- [[middleware/context-oracle/docs/reviews/2026-08-25-blocking-model-rebuild-6-rounds.md@ec3b057:L95-L95]] "are **irreducible truths** about enforcing an"
- The harness can block a stop [[https://code.claude.com/docs/en/hooks.md]] "prevents Claude from stopping. Omit to allow Claude to stop"
- It is bounded [[https://code.claude.com/docs/en/hooks.md]] "Claude Code applies an 8-consecutive-continuation cap: after stop hooks have continued the turn eight times in a row, Claude Code overrides the next block and ends the turn"
- At Stop the final text is available without transcript lag [[https://code.claude.com/docs/en/hooks.md]] "The `last_assistant_message` field contains the text content of Claude's final response, so hooks can access it without parsing the transcript file"
**Standard:** Owner decisions OL-C3/OL-C5 and rejection OL-R5 (what must be enforced); the Claude Code hooks reference (what can enforce it). BRIEF.md test items 4–6.
**Reasoning:** (1) OL-C5 covers any next move. After Max's question an agent can (a) call a tool that is not answer-directed, or (b) end its turn without answering. (2) The spec's only mechanism is a `PreToolUse` deny, which fires only in (a). (3) In (b) nothing fires; the spec leaves it to a best-effort Stop whisper and to Max re-asking, which is the "agent silently ends its turn" case OL-R5 refused to let the spec scope out. (4) The review's reason for dropping Stop was that stopping is "the wrong scenario" and silent stops are "irreducible". The hooks reference shows both are false: a `Stop` hook returning `decision: "block"` with a reason prevents the stop, the loop is bounded by `stop_hook_active` and the 8-continuation cap, and `last_assistant_message` gives the final text without the transcript lag that forces the `PreToolUse` clear-axis to guess. (5) A Stop block is reactive (the agent has already ended without answering), so it is not the pre-emptive gate. (6) So the mechanism narrows OL-C5 without backing. The skill-block part of the unit (L84–91) matches OL-C2 and stands.
**Alternatives:** (a) Keep `PreToolUse`-only and the best-effort whisper: leaves OL-C5's (b) case unenforced. (b) Add the Stop block: enforces both cases with documented harness behaviour; cost is at most one bounded continuation per unanswered stop. (b) is better.
**Consequences:** §8 L351–353 and FR-B1/FR-B2/FR-B4 (part b), D-32/D-39/D-41 (part c), AC-2a and AC-8a (part c) change with it. The FR-B4 outstanding-question line becomes the Stop block's reason rather than a best-effort whisper.
**Verdict:** replace — the answer-drift block is realised as a `PreToolUse` deny of a non-answer-directed tool action **and** a `Stop` `decision: "block"` (reason "answer Max's question first: <q>") when the turn ends with the question unanswered per `last_assistant_message`, bounded by `stop_hook_active` and the harness continuation cap. Engineering line (the rule is Max Cogar's; the mechanism is not); goes to Max Cogar as a change to his signed document.
**Would be wrong if:** Max Cogar's "next move" in OL-C5 excludes ending the turn — which OL-R5 contradicts.

### E-20
**Units:** SP-021-2-1-In-scope-v1
**Question:** Two persistent stores, per-project and per-user-global, both outside the repository tree `[OL-6]`.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L92-L93]] "Two persistent **stores** — per-project and per-user-global — both **outside** the"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L44-L44]] "Two stores — per-project and per-user global — both outside the repo tree"
**Standard:** Owner decision OL-6.
**Reasoning:** The line restates OL-6 exactly; no engineering flaw (out-of-tree stores keep the tree clean, consistent with OL-3's rationale).
**Alternatives:** None; his decision.
**Consequences:** FR-K8.
**Verdict:** keep — owner decision.
**Would be wrong if:** OL-6 said otherwise.

### E-21
**Units:** SP-022-2-1-In-scope-v1
**Question:** Puts a history miner and a structural indexer in scope to populate the stores.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L94-L94]] "that populate the stores"
- A genre that needs history [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L166-L166]] "Co-change partners of that file, with the evidence ratio and a history pointer."
- A genre that needs structure [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L165-L165]] "The 2–4 structural entry-point files for the task"
**Standard:** Derivation from the genre set.
**Reasoning:** Coupling needs mined co-change history; orientation and reuse need a structural index. Both components follow from genres already in scope.
**Alternatives:** Computing on every event from raw git and files would miss NF-1 latency; precomputed stores are the standard answer.
**Consequences:** §11.1.
**Verdict:** keep — derived from the genres.
**Would be wrong if:** no in-scope genre needed history or structure.

### E-22
**Units:** SP-023-2-1-In-scope-v1
**Question:** Model-in-the-loop judgment through the host CLI's own access, with a deterministic degraded mode when the model path is unavailable `[OL-2, OL-7]`.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L95-L97]] "with a **deterministic degraded mode** when the model path is"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L40-L40]] "a deterministic degraded mode is mandatory for air-gap"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L45-L45]] "No separate credentials, ever."
**Standard:** Owner decisions OL-2, OL-7; BRIEF.md names this as the one spec-required degraded mode.
**Reasoning:** Restates OL-2 and OL-7. The degraded mode is required, specified, and (FR-M2 "model path down") visible, so it meets the fail-fast exception.
**Alternatives:** None; his decision.
**Consequences:** FR-J2, FR-J3.
**Verdict:** keep — owner decision.
**Would be wrong if:** OL-2 did not require a degraded mode.

### E-23
**Units:** SP-024-2-1-In-scope-v1
**Question:** Self-observability: the oracle detects, logs and surfaces its own failures and announces correct silence `[OL-10]`.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L98-L99]] "announces correct silence so it is not mistaken for a broken tool"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L48-L48]] "it could fail a hundred ways in front of me and I wouldn't know."
**Standard:** Owner decision OL-10.
**Reasoning:** Surfacing failures is OL-10 directly. Announcing silence follows: to an owner who cannot inspect internals, a silent working tool and a silent broken one look the same, which is the failure OL-10 names.
**Alternatives:** None.
**Consequences:** §6.
**Verdict:** keep — owner decision and its direct consequence.
**Would be wrong if:** OL-10 were about something other than the oracle's own failures.

### E-24
**Units:** SP-025-2-1-In-scope-v1
**Question:** Puts the completion-claim capability in scope `[OL-12]`, pointing to "§4 FR-A2g".
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L100-L101]] "to catch a completion claim the work does not back `[OL-12]` (§4 FR-A2g)."
- OL-12's concrete need [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L50-L50]] "did not finish their work but still stopped anyway."
- FR-A2g covers only the unverified case; FR-A2m carries the need [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L175-L175]] "OL-12's concrete case"
**Standard:** OL-12; BRIEF.md test item 1 (states what it applies to).
**Reasoning:** (1) The capability is OL-12's. (2) The pointer names only FR-A2g, which by its own "Limit" catches unrun covering tests, not unfinished work. (3) FR-A2m is where OL-12's stated need is realised. (4) A reader following the pointer sees only the partial realisation.
**Alternatives:** None needed beyond the pointer.
**Consequences:** None beyond §4.
**Verdict:** replace — "(§4 FR-A2g, FR-A2m)". Engineering line (a pointer on an owner decision); goes to Max Cogar as a change to his signed document.
**Would be wrong if:** FR-A2g covered unfinished work.

### E-25
**Units:** SP-026-2-2-Out-of-scope-v1-each
**Question:** Sub-heading promising a reason for each out-of-scope item.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L103-L103]] "### 2.2 Out of scope (v1), each with its reason"
**Standard:** SPEC-BRIEF.md item 3.
**Reasoning:** Each item below carries a key (E-26–E-30).
**Alternatives:** None.
**Consequences:** None.
**Verdict:** keep — heading; its promise holds.
**Would be wrong if:** an item below had no reason.

### E-26
**Units:** SP-027-2-2-Out-of-scope-v1-each
**Question:** The pre-emptive gate is permanently out, quoting Max Cogar `[OL-C2]`.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L107-L107]] "making the working agent take a goddamn tests to see if it had a good"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L68-L68]] "making the working agent take a goddamn tests to see if it had a good enough plan to proceed. literally every bit if it was terrible and didnt work"
**Standard:** Owner decision OL-C2.
**Reasoning:** The quote matches the ledger verbatim; the scope line matches his rejection.
**Alternatives:** None.
**Consequences:** FR-B3.
**Verdict:** keep — owner decision, quoted exactly.
**Would be wrong if:** the quote differed from the ledger.

### E-27
**Units:** SP-028-2-2-Out-of-scope-v1-each
**Question:** The generated-file block is permanently out `[OL-R4]`.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L111-L113]] "Permanently out; it was an agent fixation Max never asked for"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L59-L59]] "Not his — agent fixation."
**Standard:** Ledger REJECTED OL-R4.
**Reasoning:** Matches the ledger.
**Alternatives:** None.
**Consequences:** FR-B3.
**Verdict:** keep — owner rejection recorded.
**Would be wrong if:** OL-R4 were not a rejection.

### E-28
**Units:** SP-029-2-2-Out-of-scope-v1-each-OL-7
**Question:** Separate credentials are permanently out `[OL-7]`.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L114-L114]] "Separate credentials of any kind"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L45-L45]] "No separate credentials, ever."
**Standard:** Owner decision OL-7.
**Reasoning:** Restates OL-7.
**Alternatives:** None.
**Consequences:** FR-X5.
**Verdict:** keep — owner decision.
**Would be wrong if:** OL-7 allowed credentials.

### E-29
**Units:** SP-030-2-2-Out-of-scope-v1-each
**Question:** Writes inside the repository tree are out, except the hook wiring `ctxoracle init` installs `[D-9]`.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L115-L116]] "except the hook-wiring `ctxoracle init`"
- The no-mutation property is OL-3's recorded rationale [[middleware/context-oracle/RETHINK.md@ec3b057:L326-L328]] "the oracle must be safe to run on real projects *by"
- The ledger says OL-3's full rationale is RETHINK §12 [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L31-L32]] "Load-bearing phrases quoted verbatim; full"
- Hooks are read from settings files [[https://code.claude.com/docs/en/hooks.md]] "Hooks from settings files, managed policy settings, and plugins also run inside"
**Standard:** OL-3's confirmed rationale (never mutates the repo); least privilege for the one write that wiring needs.
**Reasoning:** (1) No-mutation is the confirmed OL-3 rationale. (2) The oracle cannot run without being wired into Claude Code's settings; an explicit, owner-invoked `init` is the one write, and `deinit` removes it (AC-7). (3) The line scopes the exception to that single act. Whether the wiring could live in user-scope settings (outside the tree) instead is an architecture choice the line permits.
**Alternatives:** Zero in-tree writes via user-scope settings plus an enrollment check would also satisfy the property; the line does not forbid it.
**Consequences:** D-9's §12 entry (L796) carries no reasoning (part c); OL-3's rationale above is the reasoning it needs. E-10.
**Verdict:** keep — backed by OL-3's rationale and scoped to one explicit act.
**Would be wrong if:** OL-3's rationale were not confirmed by Max Cogar with the rest of RETHINK §12.

### E-30
**Units:** SP-031-2-2-Out-of-scope-v1-each-OL-6
**Question:** Team features are out `[OL-6]`.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L117-L117]] "sharing, multi-user access control, server sync"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L44-L44]] "solo scope, no team sharing"
**Standard:** Owner decision OL-6.
**Reasoning:** Restates OL-6.
**Alternatives:** None.
**Consequences:** FR-K9.
**Verdict:** keep — owner decision.
**Would be wrong if:** OL-6 allowed sharing.

### E-31
**Units:** SP-032-2-3-Explicit-N-A
**Question:** Sub-heading for explicit not-applicable items.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L119-L119]] "### 2.3 Explicit N/A"
**Standard:** SPEC-BRIEF.md item 3.
**Reasoning:** Heading only.
**Alternatives:** None.
**Consequences:** None.
**Verdict:** keep — heading only.
**Would be wrong if:** n/a.

### E-32
**Units:** SP-033-2-3-Explicit-N-A
**Question:** No user-facing UI: the interface is injected context plus a terminal CLI for the owner.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L121-L122]] "the interface is injected context plus a"
- Injected context is not a chat UI [[https://code.claude.com/docs/en/hooks.md]] "Claude reads the reminder on the next model request, but it doesn't appear as a chat message in the interface"
- The CLI is OL-1 [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L39-L39]] "CLI `ctxoracle`"
**Standard:** OL-1; hooks reference.
**Reasoning:** The two surfaces named are the ones OL-1 and the hooks contract give; nothing else is in scope.
**Alternatives:** None required by any ledger entry.
**Consequences:** The fact that whispers are not shown in the chat interface matters for owner-side calibration (E-80, SP-084).
**Verdict:** keep — accurate scope statement.
**Would be wrong if:** a ledger entry required a UI.

### E-33
**Units:** SP-034-2-3-Explicit-N-A
**Question:** Authentication and multi-tenant access control are N/A (solo, local `[OL-6]`); the only trust boundaries are §7's.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L123-L124]] "solo, single-user, local"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L44-L44]] "solo scope, no team sharing"
**Standard:** OL-6.
**Reasoning:** With one user and local stores there is no tenant boundary; §7 carries the injection, poisoning and secret boundaries that remain.
**Alternatives:** None.
**Consequences:** §7.
**Verdict:** keep — follows from OL-6.
**Would be wrong if:** stores were shared across users.

### E-34
**Units:** SP-036-3-Product-principles
**Question:** Section heading for §3.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L128-L128]] "## 3. Product principles"
**Standard:** SPEC-BRIEF.md item 3.
**Reasoning:** Heading only.
**Alternatives:** None.
**Consequences:** None.
**Verdict:** keep — heading only.
**Would be wrong if:** n/a.

### E-35
**Units:** SP-037-3-Product-principles
**Question:** P1: silence is the default, yielding when the oracle knows a decision-changing fact the agent lacks; a posture, not a target.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L130-L132]] "A starting posture, never"
- RETHINK §5 states the per-event question the principle comes from [[middleware/context-oracle/RETHINK.md@ec3b057:L169-L171]] "given what the agent"
- Primary evidence that noise costs use [[https://research.google.com/pubs/archive/43322.pdf]] "Developers do not like false positives"
**Standard:** Derivation from the mission; Tricorder (ICSE 2015) for the cost of noise.
**Reasoning:** (1) The mission delivers only a fact that would change the next decision; at an event with no such fact, the mission says nothing, so silence is the default by derivation. (2) "Never a target" keeps silence from becoming a goal that would suppress real facts, consistent with OL-C1. (3) Tricorder supports the cost of unwanted output.
**Alternatives:** A volume target would conflict with OL-C1.
**Consequences:** FR-A1.
**Verdict:** keep — derived from the mission.
**Would be wrong if:** the mission required speaking at every event.

### E-36
**Units:** SP-038-3-Product-principles
**Question:** P2: advisory by default; blocking only reactively, in the two confirmed cases, never pre-emptive `[OL-3, OL-C2, OL-C3, D-2]`.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L135-L136]] "non-conformance (§2.1), and never as a *pre-emptive* gate"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L41-L41]] "What he rejected is the *pre-emptive* gate"
**Standard:** Owner decisions OL-3 (as clarified), OL-C2, OL-C3.
**Reasoning:** Restates the ledger. "Ignored advice is de-noised empirically (P7)" is the learning loop, judged at P7.
**Alternatives:** None.
**Consequences:** The mechanism gap for answer-drift is judged at SP-020 (E-19), not here.
**Verdict:** keep — owner decisions.
**Would be wrong if:** the ledger confirmed a pre-emptive block.

### E-37
**Units:** SP-039-3-Product-principles
**Question:** P3: zero ceremony — no required ritual, no format tax, no "pass a test to proceed" (`RETHINK.md` §6).
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L137-L138]] "no required ritual, no format"
- RETHINK §6's channel requires no agent action [[middleware/context-oracle/RETHINK.md@ec3b057:L188-L189]] "ambient, requiring"
- "Pass a test" is OL-C2's rejection [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L68-L68]] "making the working agent take a goddamn tests to see if it had a good enough plan to proceed"
**Standard:** OL-C2; derivation (a passive tool that requires agent actions is no longer passive).
**Reasoning:** The "pass a test" clause is OL-C2; "no ritual" follows from the passive-injection channel. The blocks' "state a reason" escape is OL-C2's own words, so it is not a ceremony P3 bars.
**Alternatives:** None.
**Consequences:** None.
**Verdict:** keep — owner rejection plus derivation.
**Would be wrong if:** some requirement made the agent emit a format to receive whispers.

### E-38
**Units:** SP-040-3-Product-principles
**Question:** P4: provenance on everything (`RETHINK.md` §4).
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L139-L139]] "Provenance on everything"
- [[middleware/context-oracle/RETHINK.md@ec3b057:L143-L144]] "so the agent can verify before relying"
- [[https://petertsehsun.github.io/soen7481/papers/icse13b.pdf]] "it would be helpful to have links to more details or examples in the error reports"
**Standard:** Johnson et al., ICSE 2013; derivation (a fact the agent cannot check cannot be weighed).
**Reasoning:** Provenance lets the agent check a claim; Johnson et al. found developers want pointers to more detail in tool reports.
**Alternatives:** None better.
**Consequences:** FR-D1.
**Verdict:** keep — backed.
**Would be wrong if:** provenance could not be attached to some genre's facts.

### E-39
**Units:** SP-041-3-Product-principles
**Question:** P5: marginal value is the only relevance that counts — the oracle speaks only about what the agent "could not cheaply surface itself; a fact one `grep` returns is not a whisper" (`RETHINK.md` §2.3).
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L140-L142]] "about what the agent could not cheaply surface itself; a fact one `grep` returns is"
- Its backing is an unsourced agent assertion [[middleware/context-oracle/RETHINK.md@ec3b057:L54-L54]] "Modern agents grep, glob, and read well."
- The spec's own premise says agents under-read [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L24-L24]] "Coding agents under-read the codebase, misjudge when their context is sufficient,"
- The mission tests whether the fact would change the next decision [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L34-L35]] "Deliver the fact that would change the agent's next decision"
**Standard:** BRIEF.md test items 2 (backing) and 6 (no conflict); the mission.
**Reasoning:** (1) The mission's test is *would* the fact change the agent's next decision. P5 substitutes *could* the agent get it cheaply. (2) These differ exactly when the agent has not run the one `grep` and would decide wrongly without the fact — the case SP-007 says is common ("under-read"). (3) P5's backing is RETHINK §2.3's unsourced "Modern agents grep, glob, and read well", which contradicts SP-007. (4) One of the two premises is wrong, and no source in the spec settles which. (5) What would settle it is a measurement: how often agents act without a one-grep fact that would have changed the decision. The spec already plans that kind of data (Phase A regret and seeded-fact runs, FR-L4/AC-18). Until then the correct line cannot be written from sources.
**Alternatives:** (a) Keep P5: risks silence on decision-changing cheap facts, a mission failure. (b) Replace "could" with "has not already got it (read-set/delivered-set) and it would change the decision": risks noise. Tricorder's evidence on false positives favours restraint for humans; there is no cited evidence for agents.
**Consequences:** FR-A5(c), the §4 genre headlines (FR-A2c, FR-A2d, FR-A2g), AC-1, AC-1c, AC-8 content assertions rest on P5.
**Verdict:** undetermined — P5 conflicts with SP-007's premise and rests on an unsourced claim; the correct line needs evidence on whether agents obtain one-grep facts before deciding. Tried: the spec, RETHINK, ledger, §9 sources; none measures it. Engineering line.
**Would be wrong if:** a cited study shows coding agents reliably retrieve single-search facts before acting (then P5 stands and SP-007's "under-read" narrows), or shows the opposite (then P5 is replaced).

### E-40
**Units:** SP-042-3-Product-principles
**Question:** P6: right fact, right moment (`RETHINK.md` §2.4).
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L143-L143]] "Right fact, right moment"
- [[https://research.google.com/pubs/archive/43322.pdf]] "Some tools displayed results too late, making developers less likely to fix problems after they had submitted their code"
**Standard:** The mission ("at the moment of that decision"); Tricorder.
**Reasoning:** P6 restates the mission's timing clause; Tricorder is primary evidence that timing governs uptake.
**Alternatives:** None.
**Consequences:** §5.1.
**Verdict:** keep — restates the mission.
**Would be wrong if:** n/a.

### E-41
**Units:** SP-043-3-Product-principles
**Question:** P7: the tool learns in both directions — false-firers demoted, demoted channels re-explored and re-promoted; the loop must not converge to silence `[D-25]`.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L144-L146]] "the loop must not"
- Demotion practice [[https://research.google.com/pubs/archive/43322.pdf]] "Developers may ignore findings they do not plan to fix, rather than clicking NOT USEFUL"
**Standard:** Derivation: a demoted-to-silent channel emits nothing, so it produces no feedback, so its measured value cannot rise again; demotion alone is an absorbing state. Re-exploration is the only way out.
**Reasoning:** The derivation shows re-exploration is necessary for any loop that demotes on measured false fires; Tricorder shows such measurement is standard.
**Alternatives:** Demotion-only converges to silence (the derivation).
**Consequences:** D-25's §12 entry (L811) has no reasoning; the derivation above is it (part c).
**Verdict:** keep — backed by the derivation.
**Would be wrong if:** a demoted channel still produced value measurements while silent.

### E-42
**Units:** SP-044-3-Product-principles-D-9
**Question:** P8: the repository tree stays pristine except explicit `init` wiring `[D-9]`.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L147-L147]] "The repository tree stays pristine"
- [[middleware/context-oracle/RETHINK.md@ec3b057:L326-L327]] "it never mutates the repo and never prevents an action"
**Standard:** OL-3's confirmed rationale.
**Reasoning:** Same decision as SP-030 (E-29), stated as a principle; consistent with it.
**Alternatives:** As E-29.
**Consequences:** E-10 (SP-010) must be made consistent with this line.
**Verdict:** keep — backed as in E-29.
**Would be wrong if:** as E-29.

### E-43
**Units:** SP-045-3-Product-principles
**Question:** P9: no feature is primary; elevating any genre, the completion-claim moment or the corrective feature included, "is the recurring failure this project exists to prevent" `[OL-C2]`.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L149-L150]] "the corrective feature included — is the recurring failure this project exists to"
- What OL-C2 says [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L68-L68]] "THIS IS NOT THE PRINARY ROLE OF THE ORACLE, NOR WOULD I EVEN CONSIDER IT A PRIMARY FEATURE"
- A rejected superlative of the same shape [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L57-L57]] "an agent's superlative wrapped around your quote"
- The ledger's OL-12 row on the general principle [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L50-L50]] "the no-primary-feature principle is held by the mission and OL-C2"
- Owner writing discipline [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L73-L73]] "must never be written down as a broader project rule than what he actually said"
**Standard:** Ledger rules (owner claims only as CONFIRMED), OL-R2, OL-C7.
**Reasoning:** (1) OL-C2 says the corrective feature is not primary. (2) The general "no feature is primary" is supported by the ledger's OL-12 row and by the mission, which ranks facts by decision impact, not by genre. (3) "The recurring failure this project exists to prevent", attributed to OL-C2, is not in OL-C2: it is an agent superlative around his words, the pattern OL-R2 rejected, and it over-generalises one statement into the project's purpose (OL-C7). (4) The project exists to serve the mission.
**Alternatives:** None; the attribution must match the ledger.
**Consequences:** §4 intro, FR-A2k.
**Verdict:** replace — "P9 — No feature is primary: relevance is per fact, by decision impact, not by genre (mission; OL-12 row); in particular the corrective/skill feature is small, personal and non-primary `[OL-C2]`", dropping "the recurring failure this project exists to prevent". Owner decision — goes to Max Cogar.
**Would be wrong if:** Max Cogar's words in the ledger said this failure is what the project exists to prevent.

### E-44
**Units:** SP-047-4-What-the-oracle-says-a
**Question:** Section heading for §4, naming that two rows block.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L154-L154]] "## 4. What the oracle says (and, in two cases, blocks)"
**Standard:** SPEC-BRIEF.md item 3.
**Reasoning:** Heading; its claim (two blocking rows) matches FR-A2k/FR-A2l.
**Alternatives:** None.
**Consequences:** None.
**Verdict:** keep — accurate heading.
**Would be wrong if:** §4 had a different number of blocking rows.

### E-45
**Units:** SP-048-4-What-the-oracle-says-a
**Question:** §4 intro: each whisper genre is keyed to an intent signal and "headlined by the fact the agent could not cheaply get itself" (P5); no genre is primary; "Grounded as a push-mode recommendation surface `[RSSE]`"; FR-A2k/FR-A2l are blocks, not whispers.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L156-L157]] "fact the agent could not cheaply get itself"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L157-L158]] "Grounded as a"
- RSSE's delivery chapter is about delivery, not a genre set [[https://link.springer.com/chapter/10.1007/978-3-642-45135-5_9]] "the recommendations must be delivered with a user interface that allows the user to become aware that recommendations are available"
**Standard:** BRIEF.md test items 2–4.
**Reasoning:** (1) The block/whisper separation and the no-primary statement are sound (see E-43 for P9). (2) The headline rule is P5 applied to every genre, so it stands or falls with P5, which is undetermined (E-39). (3) RSSE supports treating the whispers as recommendation delivery; it does not ground this genre set, so "grounded" is a framing claim, not backing for the rows.
**Alternatives:** As E-39.
**Consequences:** Every §4 row's headline and AC-1/AC-1c/AC-8.
**Verdict:** undetermined — the headline rule depends on P5 (E-39); the rest of the paragraph would stand. Engineering line.
**Would be wrong if:** P5 is settled either way; then this paragraph follows it.

### E-46
**Units:** SP-049-4-What-the-oracle-says-a
**Question:** Table header for the genre table.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L163-L163]] "| Genre | Fires on | The decision-changing fact / action |"
**Standard:** SPEC-BRIEF.md item 3.
**Reasoning:** Column labels only.
**Alternatives:** None.
**Consequences:** None.
**Verdict:** keep — table markup.
**Would be wrong if:** n/a.

### E-47
**Units:** SP-050-4-What-the-oracle-says-a-FR-A2a
**Question:** FR-A2a Orientation: on prompt submit, "the 2–4 structural entry-point files for the task and the one invariant that will bind"; landmines go to the edit `[D-26]`.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L165-L165]] "The 2–4 structural entry-point files for the task and the one invariant that will bind."
- The counts come from agent-written RETHINK §5 [[middleware/context-oracle/RETHINK.md@ec3b057:L163-L163]] "2–4 entry-point files, the one invariant that will matter"
- Max Cogar's rule [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L67-L67]] "at no point should an arbitrary limit influence how that operates."
- Project rule [[middleware/context-oracle/CLAUDE.md@HEAD:L223-L224]] "Numbers without sources"
**Standard:** OL-C1 (owner); CLAUDE.md engineering standard (no unsourced numbers).
**Reasoning:** (1) "2–4" and "the one" are counts with no source beyond RETHINK. (2) Read as the content of the whisper, they cap how many entry points or invariants are delivered: a task with five real entry points or two binding invariants loses the rest, which is an arbitrary count limit OL-C1 forbids. (3) D-26 (landmines at the edit, not at the prompt) follows from the mission's timing clause: a landmine matters when the agent is about to change that file. (4) Orientation at prompt submission is sound: `UserPromptSubmit` delivers context alongside the prompt.
**Alternatives:** Keep the counts as "illustrative": still an unsourced number, and the text states them as the fact, not as an illustration.
**Consequences:** AC-1a repeats "2–4 … one binding invariant" (part c).
**Verdict:** replace — "The structural entry-point files for the task and the invariants that will bind, each clearing the bar (FR-A5); task-shape landmines are delivered at the edit (FR-A2e) `[D-26]`." Engineering line; goes to Max Cogar as a change to his signed document.
**Would be wrong if:** a cited source fixed 2–4 entry points as the decision-relevant set.

### E-48
**Units:** SP-051-4-What-the-oracle-says-a-FR-A2b
**Question:** FR-A2b Coupling: when a file is read or searched, name its co-change partners with the evidence ratio and a history pointer.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L166-L166]] "Co-change partners of that file, with the evidence ratio and a history pointer."
- [[https://thomas-zimmermann.com/publications/files/zimmermann-tse-2005.pdf]] "show up item coupling that is undetectable by program analysis"
**Standard:** `[ROSE]` Zimmermann et al., TSE 2005.
**Reasoning:** ROSE shows mined co-change reveals coupling program analysis cannot, which is the non-obvious fact the mission targets. Delivering it when the file is read lets it shape the plan before the edit; FR-A2f covers the post-edit case. Evidence ratio and pointer follow FR-D1/FR-D3.
**Alternatives:** Coupling only after an edit (ROSE's own trigger) arrives after the plan is formed; FR-A2f already covers that moment.
**Consequences:** AC-1.
**Verdict:** keep — backed by ROSE and the mission's timing.
**Would be wrong if:** read-time coupling whispers were shown to be ignored relative to edit-time ones.

### E-49
**Units:** SP-052-4-What-the-oracle-says-a-FR-A2c
**Question:** FR-A2c Reuse: on a search or read for functionality, deliver the usage fact "the canonical helper is `X`; most call sites use it" — the convention, not bare existence.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L167-L167]] "the convention, not bare existence"
- RETHINK's convention registry [[middleware/context-oracle/RETHINK.md@ec3b057:L116-L117]] "*pointers to canonical exemplars*"
**Standard:** Derivation from the mission.
**Reasoning:** Whether a helper exists does not tell the agent to use it; that it is the convention does, so the convention is the fact that changes the decision (write new code vs reuse).
**Alternatives:** Bare existence: does not change the decision on its own.
**Consequences:** AC-1b.
**Verdict:** keep — derived from the mission, independent of P5.
**Would be wrong if:** agents reliably reuse any helper they learn exists.

### E-50
**Units:** SP-053-4-What-the-oracle-says-a-FR-A2d
**Question:** FR-A2d Consequence: fires on "an edit / write about to run", delivering historically-coupled tests and a zone flag; a raw call-site count never stands alone.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L168-L168]] "An edit / write about to run"
- `PreToolUse` context arrives with the result [[https://code.claude.com/docs/en/hooks.md]] "String added to Claude's context alongside the tool result"
- [[https://code.claude.com/docs/en/hooks.md]] "Claude reads the reminder on the next model request, but it doesn't appear as a chat message in the interface"
- The branch audit's ruling on the same line [[middleware/context-oracle/docs/reviews/2026-09-28-branch-audit-coordinator-rulings-schema-and-edit-timing.md@HEAD:L73-L75]] "A `PreToolUse` hook runs before the edit, but"
- Its proposed correction [[middleware/context-oracle/docs/reviews/2026-09-28-branch-audit-coordinator-rulings-schema-and-edit-timing.md@HEAD:L94-L95]] "FR-A2d, AC-1c and L211 say the warning is delivered with the edit's result"
**Standard:** Claude Code hooks reference; the mission's timing clause.
**Reasoning:** (1) "About to run" implies the agent sees the fact before the edit. (2) The reference says `PreToolUse` `additionalContext` is added alongside the tool result and read on the next model request, i.e. after the edit ran. (3) The only pre-execution channel is a deny, which here would be a pre-emptive gate (rejected, OL-C2/OL-R4). (4) After the edit the agent's next decision is to keep, revise, or run the coupled tests, and the whisper arrives exactly then, so the genre serves the mission; only the wording misstates when it lands. I checked the ruling's quotes against the reference (above) and they hold. (5) The "raw call-site count never stands alone" clause rests on P5 (E-39).
**Alternatives:** Deny-to-deliver-first: a pre-emptive gate. Read-time delivery: merges this genre with FR-A2b.
**Consequences:** AC-1c, §5.1 L211 (E-70) change with it; the call-site clause follows E-39.
**Verdict:** replace — "Fires on an edit/write (`PreToolUse`); the whisper reaches the agent with the edit's result, at its next decision (keep, revise, run the coupled tests) `[HOOKS]`", rest unchanged. Engineering line; goes to Max Cogar as a change to his signed document.
**Would be wrong if:** the hooks reference documented a non-deny `PreToolUse` channel the model reads before the tool runs.

### E-51
**Units:** SP-054-4-What-the-oracle-says-a-FR-A2e
**Question:** FR-A2e Warning: on an edit in a landmine zone, a history- or invariant-derived hazard flagged with its confidence; advisory.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L169-L169]] "An edit in a landmine zone"
- Flagged uncertain warnings are Max Cogar's choice [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L70-L70]] "also voice uncertain warnings clearly flagged"
**Standard:** OL-C4; hooks reference (timing as in E-50).
**Reasoning:** The row does not claim pre-edit delivery; with the hazard (e.g. edits here broke test X) arriving alongside the edit result, the agent's next decision (run that test, revise) is served. Confidence flagging is OL-C4.
**Alternatives:** Read-time delivery is noisier (reads far outnumber edits) and fires where no edit follows.
**Consequences:** The coordinator ruling's line "Delivery at read time is FR-A2e / D-26's job" (`2026-09-28-branch-audit-coordinator-rulings-schema-and-edit-timing.md` L85) contradicts this row and D-26, which put the warning at the edit; that ruling line is wrong as written.
**Verdict:** keep — owner-backed flagging, edit-time trigger sound.
**Would be wrong if:** landmine warnings delivered after the edit were shown not to change the next decision.

### E-52
**Units:** SP-055-4-What-the-oracle-says-a-FR-A2f
**Question:** FR-A2f Completeness: at edit-completed or stop, name the paired partner the agent did not change.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L170-L170]] "You changed the reducer but not the selector it pairs with in 9 of its last 10 changes."
- [[https://thomas-zimmermann.com/publications/files/zimmermann-tse-2005.pdf]] "can prevent errors due to incomplete changes"
- A stop-time channel exists [[https://code.claude.com/docs/en/hooks.md]] "Non-error feedback for Claude. The conversation continues so Claude can act on it"
**Standard:** `[ROSE]`; hooks reference.
**Reasoning:** ROSE shows co-change mining prevents incomplete changes; the Stop channel delivers the fact while the agent can still act.
**Alternatives:** None better.
**Consequences:** AC-1d, FR-B4.
**Verdict:** keep — backed.
**Would be wrong if:** n/a.

### E-53
**Units:** SP-056-4-What-the-oracle-says-a-FR-A2g
**Question:** FR-A2g Verification: at a recognised done-claim stop, deliver which test covers the changed region and that it was not run; the done-claim recognizer "errs toward not firing (P5, no ceremony)".
**Facts:**
- The error posture [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L171-L171]] "errs toward not firing"
- Its stated reasons [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L171-L171]] "(P5, no ceremony)"
- The capability is a must-have [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L50-L50]] "having the oracle speak when an agent claims it's done is a must-have feature in my mind"
- The whisper delivers once and releases [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L415-L415]] "gates on nothing, never repeats, and always releases (AC-8)"
- The spec's own rule sets posture by cost [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L431-L431]] "Each block's precision is calibrated to its own cost function."
- For uncertain hazards Max Cogar chose to speak, flagged [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L70-L70]] "also voice uncertain warnings clearly flagged"
**Standard:** Decision under asymmetric error costs (the spec's own FR-B5 method); OL-12; OL-C4 by analogy.
**Reasoning:** (1) A false fire of the done-claim recognizer delivers, once, a statement that is still true (a covering test exists and was not run) and then releases; its cost is one advisory sentence. (2) A miss lets an unverified done-claim pass, which is the failure OL-12 calls a must-have to catch. (3) By the spec's own cost-function rule the posture should lean toward firing. (4) The stated reasons do not support the lean: P5 is about marginal value of the fact, not recognizer error; a whisper is not ceremony (P3 concerns required agent actions). (5) So the posture is unbacked and points the wrong way. The covering-test headline (vs run-state alone) is P5-based (E-39).
**Alternatives:** Lean to firing with the false-fire rate measured and demoted by the loop (P7): cheap errors, visible, correctable. Lean to silence: invisible misses of a must-have.
**Consequences:** D-38 (L854–857, part c), FR-B4 outstanding-question limit (a) (part b), AC-8/AC-8a.
**Verdict:** replace — "a classification … that errs toward firing when a covering test exists and was not run (a false fire delivers a true fact once and releases; a miss defeats OL-12), its false-fire rate measured (FR-M4) and demoted by the loop (P7)". Engineering line; goes to Max Cogar as a change to his signed document.
**Would be wrong if:** a false-fired verification whisper carried a false statement or blocked the stop.

### E-54
**Units:** SP-057-4-What-the-oracle-says-a-FR-A2h
**Question:** FR-A2h Assumption check on agent narration (model-dependent, Phase B).
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L172-L172]] "Your narration assumes X; the repo says Y at `file:line`."
- Narration is observable [[https://code.claude.com/docs/en/hooks.md]] "While assistant message text is displayed"
**Standard:** Derivation from the mission; hooks reference.
**Reasoning:** A narrated assumption the repository contradicts is a decision-changing fact; narration is observable (message display, transcript); judging it needs a model, hence Phase B off the hook path (FR-J5).
**Alternatives:** None.
**Consequences:** FR-J5.
**Verdict:** keep — mission-derived, feasible.
**Would be wrong if:** narration were not observable to hooks.

### E-55
**Units:** SP-058-4-What-the-oracle-says-a-FR-A2i
**Question:** FR-A2i Steering whisper on narration (model-dependent, Phase B).
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L173-L173]] "What you're describing lives in `src/…`, not where you're looking."
**Standard:** Derivation from the mission.
**Reasoning:** Where the described thing actually lives changes where the agent looks next; model judgment is needed to match narration to code.
**Alternatives:** None.
**Consequences:** FR-J5.
**Verdict:** keep — mission-derived.
**Would be wrong if:** n/a.

### E-56
**Units:** SP-059-4-What-the-oracle-says-a-FR-A2j
**Question:** FR-A2j Answer: a repo-answerable question in narration gets the repo-grounded answer with a pointer (Phase B).
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L174-L174]] "The repo-grounded answer with a pointer."
**Standard:** Derivation from the mission ("without being asked").
**Reasoning:** An open question the repository answers is exactly a fact the agent lacks at its next decision.
**Alternatives:** None.
**Consequences:** FR-J5.
**Verdict:** keep — mission-derived.
**Would be wrong if:** n/a.

### E-57
**Units:** SP-060-4-What-the-oracle-says-a-FR-A2m
**Question:** FR-A2m Unfinished-work check: at a done-claim, judge "incomplete" against a named scope referent (prompt, approved plan, or active skill's steps); Phase B.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L175-L175]] "OL-12's concrete case"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L50-L50]] "did not finish their work but still stopped anyway."
**Standard:** OL-12.
**Reasoning:** It realises OL-12's stated need; anchoring the judgment to a named referent keeps it checkable; it is model-dependent, so Phase B, and v1 includes Phase B.
**Alternatives:** An unanchored "is it done" judgment would be uncheckable.
**Consequences:** SP-025 pointer (E-24).
**Verdict:** keep — realises OL-12 with a checkable referent.
**Would be wrong if:** v1 excluded Phase B.

### E-58
**Units:** SP-061-4-What-the-oracle-says-a-FR-A2k
**Question:** FR-A2k Process conformance → BLOCK: steer first, deny on a skipped step without a stated reason or when steering fails `[OL-C2]`; errs toward restraint, with an automated missed-skill-block detector because "Max cannot see a skipped step himself (OL-11)"; block precision "still gets full investment".
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L176-L176]] "Max cannot see a skipped step himself (OL-11)"
- What OL-11 says [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L49-L49]] "You are a non-programmer by design."
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L176-L176]] "block-precision still gets full investment"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L68-L68]] "BUT I CANNOT STRESS ENOUGG THAT THIS IS JUST A SMALL FEATURE FOR MY OWN PERSONAL BENEFIT"
- The same feature is the heaviest in the spec [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L680-L681]] "It is the most machinery-heavy"
**Standard:** Ledger rule 1 (owner-attributed claims only as CONFIRMED); OL-C2; OL-C7.
**Reasoning:** (1) Steer-then-block matches OL-C2. (2) "Max cannot see a skipped step himself" is attributed to OL-11; OL-11 says he is a non-programmer, and contains nothing about seeing skipped skill steps. It is an agent inference presented as his. (3) That inference is the stated reason for the automated detector. (4) OL-C2 stresses the feature is small; the spec makes it the most machinery-heavy behaviour. Whether full-investment machinery fits "just a small feature" is a scope call only he can make.
**Alternatives:** State the premise as an engineering judgment with evidence (none found in the spec or ledger) or drop the detector; either way the attribution goes.
**Consequences:** FR-B5, FR-C4, FR-M2 (E-84), AC-2c, AC-9 repeat the OL-11 attribution (parts b/c).
**Verdict:** replace — remove "(OL-11)" as the source of "Max cannot see a skipped step"; state it as an engineering premise with evidence or drop the detector's justification. Owner decision part — goes to Max Cogar: whether the automated missed-block detector and "full investment" fit his "JUST A SMALL FEATURE".
**Would be wrong if:** a CONFIRMED ledger entry says Max Cogar cannot see skipped skill steps.

### E-59
**Units:** SP-062-4-What-the-oracle-says-a-FR-A2l
**Question:** FR-A2l Answer-drift → BLOCK: deny the non-answer-directed action (`PreToolUse`) until the agent answers `[OL-C3, OL-C5]`.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L177-L177]] "**Denies that non-answer-directed action** (`PreToolUse`)"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L71-L71]] "if i ask a question and their next move isnt a direct answer or them taking actions to provide an answer, then then need corrected"
- [[https://code.claude.com/docs/en/hooks.md]] "prevents Claude from stopping. Omit to allow Claude to stop"
**Standard:** OL-C3/OL-C5; hooks reference.
**Reasoning:** Same defect as SP-020 (E-19): the row realises the rule only for tool actions; a next move that ends the turn unanswered is not corrected, though the harness can block the stop. The provenance note (OL-9 superseded by OL-C3/OL-C5) matches the ledger.
**Alternatives:** As E-19.
**Consequences:** As E-19.
**Verdict:** replace — add the `Stop` `decision: "block"` path for a turn that ends with the question unanswered, as in E-19. Engineering line; goes to Max Cogar as a change to his signed document.
**Would be wrong if:** as E-19.

### E-60
**Units:** SP-063-4-What-the-oracle-says-a-FR-A1
**Question:** FR-A1: per event, ask whether the oracle knows something the agent almost certainly does not that would change what it does next; default silence.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L179-L181]] "do I know something it almost certainly does not that would"
**Standard:** The mission.
**Reasoning:** The question is the mission restated per event.
**Alternatives:** None.
**Consequences:** P1.
**Verdict:** keep — the mission per event.
**Would be wrong if:** n/a.

### E-61
**Units:** SP-064-4-What-the-oracle-says-a-FR-A2
**Question:** FR-A2: the oracle produces the genres above; model-free vs model-dependent and build phase fixed in §11.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L183-L184]] "Model-free vs"
**Standard:** SPEC-BRIEF.md item 3.
**Reasoning:** A pointer; the genres are judged row by row.
**Alternatives:** None.
**Consequences:** §11.5.
**Verdict:** keep — pointer.
**Would be wrong if:** n/a.

### E-62
**Units:** SP-065-4-What-the-oracle-says-a-FR-D1
**Question:** FR-D1 whisper form: one topic, "a few sentences (illustrative ~1–5, tunable)", `[oracle]` prefix and genre, confidence when not high, at least one verifiable pointer `[JOHNSON, P4]`; an uncheckable whisper is not emitted.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L185-L185]] "One topic, a few sentences (illustrative ~1–5, tunable)"
- The number's only origin is agent-written RETHINK §6 [[middleware/context-oracle/RETHINK.md@ec3b057:L190-L190]] "one topic, one to five sentences"
- [[middleware/context-oracle/CLAUDE.md@HEAD:L223-L224]] "Numbers without sources"
- Johnson et al. support the pointer and the information content [[https://petertsehsun.github.io/soen7481/papers/icse13b.pdf]] "do not present their results in a way that gives enough information for them to assess what the problem is, why it is a problem and what they should be doing differently"
**Standard:** Johnson et al., ICSE 2013; CLAUDE.md engineering standard (numbers need sources).
**Reasoning:** (1) Pointer, prefix, confidence flag and the no-rumor rule are backed by JOHNSON and P4. (2) "~1–5" has no source; Johnson's finding argues for enough information to assess the problem, not for a sentence count. (3) "Illustrative" does not exempt a number from the project's no-unsourced-numbers rule, and an architect will build to it.
**Alternatives:** Keep "a few sentences" as the property and let the architecture set length from Phase A data.
**Consequences:** §9 L577 lists this number among illustrative defaults (part c).
**Verdict:** replace — drop "(illustrative ~1–5, tunable)"; keep "one topic, a few sentences" and the rest. Engineering line; goes to Max Cogar as a change to his signed document.
**Would be wrong if:** a cited source fixes whisper length.

### E-63
**Units:** SP-066-4-What-the-oracle-says-a-FR-D2
**Question:** FR-D2: whispers are informative, never imperative `[P3]`; blocks are a separate mechanism.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L190-L190]] "Whispers are informative, never imperative"
- P3 is about required agent rituals, not tone [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L137-L138]] "no required ritual, no format"
- The harness vendor's guidance [[https://code.claude.com/docs/en/hooks.md]] "Write the text as factual statements rather than imperative system instructions"
- [[https://code.claude.com/docs/en/hooks.md]] "Text framed as out-of-band system commands can trigger Claude's prompt-injection defenses"
**Standard:** Claude Code hooks reference (primary documentation).
**Reasoning:** (1) The rule is right. (2) Its cited backing, P3, concerns rituals imposed on the agent, not the tone of injected text. (3) The hooks reference gives the real reason: imperative injected text can be treated as prompt injection and surfaced to the user instead of used as context.
**Alternatives:** None.
**Consequences:** AC-14.
**Verdict:** replace — cite `[HOOKS]` ("write the text as factual statements rather than imperative system instructions") in place of `[P3]`. Engineering line; goes to Max Cogar as a change to his signed document.
**Would be wrong if:** P3 were defined to cover injected-text tone.

### E-64
**Units:** SP-067-4-What-the-oracle-says-a-FR-D3
**Question:** FR-D3: warnings state their evidence (support/confidence or call-site counts), never a bare assertion `[HERZIG]` "(illustrative rate, §9)".
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L193-L193]] "never a bare assertion `[HERZIG]` (illustrative rate, §9)."
- What Herzig & Zeller study [[https://www.st.cs.uni-saarland.de/publications/files/herzig-msr-2013.pdf]] "such tangled changes will make all changes to all modules appear related, possibly compromising the resulting analyses through noise and bias"
- What supports stating evidence [[https://petertsehsun.github.io/soen7481/papers/icse13b.pdf]] "do not present their results in a way that gives enough information for them to assess what the problem is, why it is a problem and what they should be doing differently"
**Standard:** BRIEF.md test item 4 (the backing supports this decision, not a neighbour).
**Reasoning:** (1) The rule is right. (2) HERZIG shows mined change data is noisy, which is a reason confidence matters, not evidence that users need the evidence stated. (3) JOHNSON is direct evidence that reports lacking the information to assess them are a barrier to use. (4) FR-D3 states no rate, so "(illustrative rate, §9)" points at nothing.
**Alternatives:** None.
**Consequences:** §9 `[HERZIG]` row's "Governs" (part c).
**Verdict:** replace — "never a bare assertion `[JOHNSON]`; history-derived evidence is noisy, so its support/confidence is stated `[HERZIG]`", dropping "(illustrative rate, §9)". Engineering line; goes to Max Cogar as a change to his signed document.
**Would be wrong if:** Herzig & Zeller studied the presentation of warnings.

### E-65
**Units:** SP-068-4-What-the-oracle-says-a-FR-D4
**Question:** FR-D4: the ⚠ subtype is declarative, may be wrong and says so; CLI corrections feed the learning loop `[D-4]`.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L194-L195]] "records that it may be"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L70-L70]] "letting the learning loop demote ones that keep being wrong"
**Standard:** OL-C4.
**Reasoning:** Flagging possible false fires and demoting through the loop is OL-C4's option B; a CLI correction path is one input to that loop. Whether that path can be Phase A's calibration input is judged at SP-084 (E-80).
**Alternatives:** None.
**Consequences:** D-4's §12 entry (L790) has no reasoning; OL-C4 is its reasoning (part c).
**Verdict:** keep — owner-backed.
**Would be wrong if:** n/a.

### E-66
**Units:** SP-069-4-What-the-oracle-says-a-FR-D5
**Question:** FR-D5: whispers are deduplicated per consumer against what it has been told or has visibly incorporated (FR-A4).
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L197-L198]] "per consumer against what that consumer has been"
**Standard:** Derivation from the mission.
**Reasoning:** A fact the consumer already has cannot change its decision again; repeating it is noise.
**Alternatives:** None.
**Consequences:** Depends on FR-A4's reset rules being correct (E-74).
**Verdict:** keep — mission-derived.
**Would be wrong if:** n/a.

### E-67
**Units:** SP-071-5-When-the-oracle-speaks
**Question:** Section heading for §5.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L202-L202]] "## 5. When the oracle speaks — relevance, and the quality bar"
**Standard:** SPEC-BRIEF.md item 3.
**Reasoning:** Heading only.
**Alternatives:** None.
**Consequences:** None.
**Verdict:** keep — heading only.
**Would be wrong if:** n/a.

### E-68
**Units:** SP-072-5-When-the-oracle-speaks
**Question:** One decision procedure in two parts; the two block cases are separate and triggered by their own conditions.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L204-L205]] "One decision procedure for whether to speak, in two parts."
**Standard:** SPEC-BRIEF.md item 3.
**Reasoning:** Framing consistent with §5.1/§5.2 and §8.
**Alternatives:** None.
**Consequences:** None.
**Verdict:** keep — accurate framing.
**Would be wrong if:** n/a.

### E-69
**Units:** SP-073-5-1-Relevance-comes-from
**Question:** Sub-heading: relevance comes from the moment.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L207-L207]] "### 5.1 Relevance comes from the moment (the trigger)"
**Standard:** SPEC-BRIEF.md item 3.
**Reasoning:** Heading; content judged in E-70.
**Alternatives:** None.
**Consequences:** None.
**Verdict:** keep — heading only.
**Would be wrong if:** n/a.

### E-70
**Units:** SP-074-5-1-Relevance-comes-from
**Question:** Relevance is established by when a candidate fires; each genre is bound to the intent signal, including "the edit it is about to run"; decision-impact carries no intent term because intent enters here `[D-18]`.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L211-L211]] "the edit it is about to run"
- [[https://code.claude.com/docs/en/hooks.md]] "String added to Claude's context alongside the tool result"
- The branch audit names this line [[middleware/context-oracle/docs/reviews/2026-09-28-branch-audit-coordinator-rulings-schema-and-edit-timing.md@HEAD:L89-L89]] "L211 and L929 (AC-1c)"
**Standard:** Hooks reference.
**Reasoning:** The trigger-as-relevance design is sound (the event reveals what the agent is working on). "About to run" misstates when an edit-triggered whisper reaches the model, as in E-50.
**Alternatives:** As E-50.
**Consequences:** FR-A2d (E-50), AC-1c.
**Verdict:** replace — "the edit it has just made (its whisper arrives with the edit's result)". Engineering line; goes to Max Cogar as a change to his signed document.
**Would be wrong if:** as E-50.

### E-71
**Units:** SP-075-5-1-Relevance-comes-from-FR-O1
**Question:** FR-O1: observed events via the hooks contract; "which of the ~31 hook events are wired is architecture".
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L217-L217]] "which of the ~31 hook events are wired is architecture"
- [[ran]] `curl -sSL https://code.claude.com/docs/en/hooks.md | awk '/^## Hook events/{p=1} /^## Prompt-based hooks/{p=0} p && /^### /' | wc -l` → `33`
**Standard:** CLAUDE.md "Verify external facts … the hooks contract has drifted before and will again."
**Reasoning:** The count is stale (33 today) and does no work: the requirement is that the mapping is the architect's. An undated count of a drifting contract becomes false silently.
**Alternatives:** Update to 33 with a date: still drifts. Drop the count.
**Consequences:** None.
**Verdict:** replace — "which of the hook events the current contract defines are wired is architecture". Engineering line; goes to Max Cogar as a change to his signed document.
**Would be wrong if:** the count were load-bearing somewhere (it is not cited elsewhere in lines 1–276).

### E-72
**Units:** SP-076-5-1-Relevance-comes-from-FR-O5
**Question:** FR-O5: task-boundary intervention only; no idle timers `[CHI]`.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L219-L219]] "Task-boundary intervention only; no idle timers"
- `[CHI]` studies human users' resumption lag [[https://experts.illinois.edu/en/publications/leveraging-characteristics-of-task-structure-to-predict-the-cost-]] "users were interrupted during task execution at various boundaries to collect a large sample of resumption lag values"
- and is CHI 2006, not the CHI 2007 §9 gives [[https://experts.illinois.edu/en/publications/leveraging-characteristics-of-task-structure-to-predict-the-cost-]] "CHI 2006: Conference on Human Factors in Computing Systems - Montreal"
- The harness only admits context where a hook fired [[https://code.claude.com/docs/en/hooks.md]] "inserts it into the conversation at the point where the hook fired"
**Standard:** BRIEF.md test item 4 (backing supports this decision).
**Reasoning:** (1) The property is right. (2) `[CHI]` measures human resumption lag; nothing in it shows an LLM agent has a resumption cost, so it is an analogy, not backing. (3) The operative reason is the contract: injected context enters only at a hook event, so an idle timer has no channel, and task boundaries are the events where the agent's next decision forms (mission). (4) The §9 citation is also misdated (E-3).
**Alternatives:** None.
**Consequences:** AC-22; §9 `[CHI]` row (part c).
**Verdict:** replace — back FR-O5 with `[HOOKS]` (context enters only where a hook fired) and the mission; `[CHI]`, if kept, as an analogy with the corrected year. Engineering line; goes to Max Cogar as a change to his signed document.
**Would be wrong if:** a source shows LLM agents incur interruption costs that task boundaries minimise.

### E-73
**Units:** SP-077-5-1-Relevance-comes-from-FR-O6
**Question:** FR-O6: per-consumer delivery "keyed by `agent_id`/`agent_type`" `[HOOKS, OL-8, D-16]`.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L220-L220]] "keyed by `agent_id`/`agent_type`"
- [[https://code.claude.com/docs/en/hooks.md]] "Unique identifier for the subagent. Present only when the hook fires inside a subagent call"
- `agent_type` is a name, also set on the main thread under `--agent` [[https://code.claude.com/docs/en/hooks.md]] "Present when the session uses `--agent` or the hook fires inside a subagent"
**Standard:** Hooks reference.
**Reasoning:** (1) A consumer key must be unique per consumer. (2) `agent_id` is unique per subagent and absent on the main thread. (3) `agent_type` is shared by every subagent of the same type and can also appear on the main thread, so keying by it would merge the delivered/read sets of distinct consumers and suppress whispers wrongly (FR-A4/FR-D5). (4) The slash leaves the key ambiguous.
**Alternatives:** Key by `agent_id` (absent = main agent); keep `agent_type` as a descriptive field.
**Consequences:** FR-A4, AC-15 (which already says "keyed by `agent_id`").
**Verdict:** replace — "keyed by `agent_id` (absent ⇒ the main agent); `agent_type` is descriptive only". Engineering line; goes to Max Cogar as a change to his signed document.
**Would be wrong if:** `agent_type` were unique per subagent instance.

### E-74
**Units:** SP-078-5-1-Relevance-comes-from-FR-A4
**Question:** FR-A4 never repeat: per-consumer delivered-set and read-set, reconciled across `resume`/`fork` (reseed), `compact` (clear read-set), `clear`/`startup` (clean) `[HOOKS, D-20]`.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L223-L224]] "reconciled across `resume`/`fork` (reseed) / `compact` (clear read-set) /"
- The session sources exist [[https://code.claude.com/docs/en/hooks.md]] "`\"fork\"` for a new session forked from an existing one"
- Compaction replaces the conversation with a summary [[https://code.claude.com/docs/en/hooks.md]] "The `compact_summary` field contains the conversation summary generated by the compact operation"
- Resume replays injected text [[https://code.claude.com/docs/en/hooks.md]] "Claude Code replays the saved text rather than re-running the hook for past turns"
**Standard:** Hooks reference; derivation from the mission.
**Reasoning:** (1) Resume replays injected text, so reseeding the delivered-set is right. (2) After compaction the agent holds a generated summary, not the earlier messages; the spec clears the read-set for that reason. (3) The same holds for earlier whispers: they were injected text that the summary may drop. (4) Keeping the delivered-set across `compact` means a decision-changing fact the summary dropped is never delivered again, a mission failure; clearing it costs at most one repeat. (5) The event names match the current contract.
**Alternatives:** Reconcile the delivered-set against `compact_summary` (keep only what the summary retains) — also correct, more work; clearing is the simple correct default.
**Consequences:** AC-5 (part c); D-20 has no reasoning in §12 (L806), and this derivation is it.
**Verdict:** replace — "`compact` (clear the read-set and the delivered-set, or reconcile both against the compaction summary)". Engineering line; goes to Max Cogar as a change to his signed document.
**Would be wrong if:** compaction were documented to preserve injected hook context verbatim.

### E-75
**Units:** SP-079-5-2-The-quality-bar-whic
**Question:** Sub-heading for the quality bar.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L226-L226]] "### 5.2 The quality bar — which real candidates are worth the sentence"
**Standard:** SPEC-BRIEF.md item 3.
**Reasoning:** Heading only.
**Alternatives:** None.
**Consequences:** None.
**Verdict:** keep — heading only.
**Would be wrong if:** n/a.

### E-76
**Units:** SP-080-5-2-The-quality-bar-whic
**Question:** Frames the bar as a quality/marginal-value filter among trigger-relevant candidates, not a relevance oracle `[D-6bar]`.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L229-L229]] "a **quality/marginal-value filter, not a relevance oracle**"
**Standard:** Derivation (relevance already comes from the trigger, §5.1).
**Reasoning:** Separating relevance (trigger) from worth (bar) keeps the bar from re-deriving intent; consistent with §5.1. The "marginal-value" word inherits P5's open question only as far as FR-A5(c) does.
**Alternatives:** None.
**Consequences:** FR-A5.
**Verdict:** keep — framing consistent with §5.1.
**Would be wrong if:** n/a.

### E-77
**Units:** SP-081-5-2-The-quality-bar-whic-FR-A5
**Question:** FR-A5: a candidate is spoken when jointly (a) confident, (b) decision-impactful (no genre term), (c) not cheaply self-serve `[P5]`; no volume/count/budget cap `[OL-C1]`; dedup still applies.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L235-L235]] "and (c) **not cheaply self-serve** (**marginal value** `[P5]`)."
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L236-L237]] "No *volume, count, or budget* limit suppresses a"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L67-L67]] "the bar (importance / marginal value) is the sole arbiter"
**Standard:** OL-C1; P5 (open, E-39).
**Reasoning:** (1) The no-cap clause and dedup carve-out are OL-C1 and the never-repeat property. (2) (a) and (b) are backed (confidence per ROSE; impact from edit/read, blast radius, zone). (3) (c) is P5 as a hard conjunct; since P5 is undetermined (E-39), whether (c) should be "not cheaply self-serve" or "not already held" cannot be settled yet. OL-C1's "marginal value" names the concept, not P5's "cheaply" test.
**Alternatives:** As E-39.
**Consequences:** AC-3, AC-4.
**Verdict:** undetermined — the rest stands; conjunct (c) follows the P5 resolution (E-39). Engineering line.
**Would be wrong if:** P5 is settled.

### E-78
**Units:** SP-082-5-2-The-quality-bar-whic-FR-A5a
**Question:** FR-A5a: uncertain hazards are spoken with confidence flagged; only a noise floor `[OL-C4, D-28]`.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L243-L244]] "a real but uncertain hazard"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L70-L70]] "also voice uncertain warnings clearly flagged, letting the learning loop demote ones that keep being wrong"
**Standard:** Owner decision OL-C4.
**Reasoning:** Restates his choice B; the noise floor (real vs coincidental evidence) is what "real" in "uncertain hazard" requires.
**Alternatives:** None.
**Consequences:** None.
**Verdict:** keep — owner decision.
**Would be wrong if:** n/a.

### E-79
**Units:** SP-083-5-2-The-quality-bar-whic-FR-A6
**Question:** FR-A6: corpus floor only, no adoption window `[D-7, D-8, OL-C1]`; on thin history "the structural, reuse, consequence, conformance, and answer-drift behaviours still operate".
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L251-L251]] "are thinner; the structural, reuse, consequence, conformance, and answer-drift"
- Consequence's headline is history-derived [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L168-L168]] "historically-coupled tests** this edit tends to break"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L67-L67]] "at no point should an arbitrary limit influence how that operates."
**Standard:** OL-C1; BRIEF.md test item 6.
**Reasoning:** (1) An evidentiary floor is backed (below it there is no signal; confidence is low) and an adoption window is an arbitrary limit OL-C1 bars. (2) FR-A2d's headline fact is historically-coupled tests, which a thin history cannot supply; only its zone flag is structural. (3) Listing "consequence" as still operating overstates what thin-history repositories get, which CLAUDE.md rule 3 counts as fake completeness.
**Alternatives:** None.
**Consequences:** §13 L903–904 repeats the list (part c).
**Verdict:** replace — "…the structural, reuse, conformance and answer-drift behaviours, and Consequence's zone flag, still operate; Consequence's coupled-tests headline is history-derived and thins with the corpus". Engineering line; goes to Max Cogar as a change to his signed document.
**Would be wrong if:** coupled tests were derived structurally (e.g. from imports) rather than from history.

### E-80
**Units:** SP-084-5-2-The-quality-bar-whic
**Question:** The bar ships high and is calibrated; Phase A's calibration input is the human CLI correction; automated demotion/promotion is Phase C `[D-6bar]`.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L254-L254]] "value — the calibration input from Phase A is the human CLI correction (FR-D4/FR-L6);"
- Whispers are not shown to Max Cogar in the chat [[https://code.claude.com/docs/en/hooks.md]] "Claude reads the reminder on the next model request, but it doesn't appear as a chat message in the interface"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L49-L49]] "design/build/verification/docs/roadmap are the agents'"
- Phase A makes no automated uptake judgment [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L797-L797]] "Phase A logs uptake but makes no automated uptake judgment"
- The spec also calls unspoken held facts the costliest failure [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L656-L656]] "makes an unspoken *held* fact the"
**Standard:** OL-11; hooks reference; BRIEF.md test item 6.
**Reasoning:** (1) Phase A's only calibration input is Max Cogar correcting whispers through the CLI. (2) He does not see whispers in the chat interface, and OL-11 assigns verification to agents and says he is a non-programmer, so judging whether a technical whisper was a false fire is not his role. (3) With D-12 excluding automated uptake judgment, Phase A has no realistic calibration signal, while "ships high" biases toward silence that FR-L4 calls the costliest failure. (4) The flaw is established; the replacement calibration source (for example seeded-fact runs, regret proxies, or agent-side signals) is a design choice the sources here do not settle.
**Alternatives:** Seeded-fixture calibration (AC-18) or the FR-L4 regret proxy as Phase A inputs; keeping "ships high" only for non-hazard genres (OL-C4 already exempts hazards).
**Consequences:** FR-L6, FR-D4 (E-65), D-6bar, D-12 (part c).
**Verdict:** undetermined — the named Phase A calibration input is not realistically available and "ships high" conflicts with FR-L4's ranking; the correct calibration source needs a design decision with evidence. Tried: spec, ledger, RETHINK, hooks reference. Engineering line.
**Would be wrong if:** Max Cogar has stated he will review `ctxoracle log` and correct whispers (no ledger entry says so).

### E-81
**Units:** SP-086-6-The-oracle-must-watch
**Question:** Section heading for §6.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L259-L259]] "## 6. The oracle must watch itself — self-observability"
**Standard:** SPEC-BRIEF.md item 3.
**Reasoning:** Heading only.
**Alternatives:** None.
**Consequences:** None.
**Verdict:** keep — heading only.
**Would be wrong if:** n/a.

### E-82
**Units:** SP-087-6-The-oracle-must-watch-OL-10
**Question:** `[OL-10]`: the owner is a non-programmer and cannot catch a silent failure.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L261-L261]] "The owner is a non-programmer and cannot catch a silent failure."
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L48-L48]] "it could fail a hundred ways in front of me and I wouldn't know."
**Standard:** OL-10, OL-11.
**Reasoning:** Both halves are his words in substance (OL-11 non-programmer; OL-10 cannot see failures).
**Alternatives:** None.
**Consequences:** §6.
**Verdict:** keep — owner decisions.
**Would be wrong if:** n/a.

### E-83
**Units:** SP-088-6-The-oracle-must-watch-FR-M1
**Question:** FR-M1: diagnostic log per event (candidates, bar outcome, delivery, blocks, latency).
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L263-L264]] "candidates, bar outcome, what was delivered,"
**Standard:** OL-10; derivation.
**Reasoning:** Each field is what is needed to see why the oracle spoke, stayed silent, blocked, or was slow; without it failures are invisible.
**Alternatives:** None.
**Consequences:** FR-M2–M5.
**Verdict:** keep — follows from OL-10.
**Would be wrong if:** n/a.

### E-84
**Units:** SP-089-6-The-oracle-must-watch-FR-M2
**Question:** FR-M2 self-detected failure classes, including "a deny that outlives its condition" and "a missed skill-block", the latter justified as a miss "Max cannot see himself, OL-11".
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L271-L271]] "the misclassified-as-done miss Max cannot see himself, OL-11"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L49-L49]] "You are a non-programmer by design."
**Standard:** Ledger rule 1; OL-10.
**Reasoning:** (1) The failure classes serve OL-10. (2) The missed-skill-block class repeats the OL-11 attribution found wrong in E-58.
**Alternatives:** As E-58.
**Consequences:** Follows E-58's owner question on the detector.
**Verdict:** replace — remove "(… Max cannot see himself, OL-11)" as an owner attribution, per E-58; the class itself stands or falls with the owner decision raised there. Engineering line (attribution fix); goes to Max Cogar as a change to his signed document.
**Would be wrong if:** a CONFIRMED ledger entry supports the attribution.

### E-85
**Units:** SP-090-6-The-oracle-must-watch-FR-M3
**Question:** FR-M3: correct silence is announced to the owner-facing surface only, never injected into the agent's context `[D-22]`.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L275-L276]] "it is **never injected into the agent's context**"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L48-L48]] "it could fail a hundred ways in front of me and I wouldn't know."
**Standard:** OL-10; the mission.
**Reasoning:** Announcing silence to the owner serves OL-10; telling the agent "nothing to say" is not a decision-changing fact, so keeping it out of context follows from the mission.
**Alternatives:** None.
**Consequences:** D-22's §12 entry (L809) has no reasoning; this is it (part c).
**Verdict:** keep — follows from OL-10 and the mission.
**Would be wrong if:** n/a.
