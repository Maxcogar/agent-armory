# Spec audit — part b: `spec-context-oracle.md` lines 277–672 at `ec3b057`

This file is part b of the whole-spec audit of
`middleware/context-oracle/docs/specs/spec-context-oracle.md` at `ec3b057`. It covers the 90
spec units listed in
`/tmp/claude-0/-home-user-agent-armory/779c0f74-86b0-5e8f-b02d-811e78ed3f66/scratchpad/audit/SPEC-b.txt`
(SP-091 … SP-180), spec lines 277–672: FR-M4 through FR-L6, i.e. the end of §6, §7 (threat
model), §8 (blocking, delivery, constraints), §9 (standards), §10 (interfaces), §11.1–§11.3
(stores, model judgment, learning loop up to FR-L6). It follows the two auditor briefs
`/tmp/claude-0/-home-user-agent-armory/779c0f74-86b0-5e8f-b02d-811e78ed3f66/scratchpad/audit/BRIEF.md`
and
`/tmp/claude-0/-home-user-agent-armory/779c0f74-86b0-5e8f-b02d-811e78ed3f66/scratchpad/audit/SPEC-BRIEF.md`
(the second governs where they differ). Web sources were fetched with curl through the
audit's `webquote.py` (hooks reference fetched as `https://code.claude.com/docs/en/hooks.md`);
executed checks ran on Node v22.22.2, Python 3.11.15, npm registry via the session proxy, on
2026-09-29. No repository file other than this one was edited.

### E-1
**Units:** SP-091-6-The-oracle-must-watch-FR-M4
**Question:** FR-M4 fixes what `ctxoracle status` reports so the owner can see the oracle failing (OL-10). Does every rate it lists say what it can and cannot see, as the line already does for the regret rate?
**Facts:**
- FR-M4 lists a plain "false-fire rate" and a "wrongful-deny rate" with no statement of where they come from. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L277-L278]] "whisper count, per-genre volume, false-fire rate"
- For the regret rate alone, FR-M4 requires a label so a low value is not misread. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L279-L280]] "so a low regret rate is never read as"
- In Phase A the only false-fire input is the owner's CLI correction. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L254-L255]] "the calibration input from Phase A is the human CLI correction (FR-D4/FR-L6)"
- Whispers are not shown to the owner in the Claude Code interface. [[https://code.claude.com/docs/en/hooks.md]] "but it doesn't appear as a chat message in the interface"
- The owner is a non-programmer by design. [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L49]] "You are a non-programmer by design."
**Standard:** OL-10 [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L48]] "it could fail a hundred ways in front of me and I wouldn't know" and CLAUDE.md dominating rule 3 [[middleware/context-oracle/CLAUDE.md@ec3b057:L141-L144]] "never fake completeness dressed to look like a working product."
**Reasoning:** (1) A false-fire rate computed from owner corrections counts only whispers the owner saw, judged and corrected. (2) The owner does not see whispers in the interface and is not placed to judge code facts, so most whispers are never judged. (3) A whisper nobody corrected is therefore counted as not false, and the rate reads low whether or not the oracle is wrong. (4) That is exactly the misreading FR-M4 already forbids for regret; the same reasoning applies to the false-fire rate and to the wrongful-deny rate, which is also counted only from recognized faults and corrections. (5) The rest of FR-M4 (health, counts, denies issued, missed-skill-block rate, done-claims with an outstanding question, deny-loop signal, suppressing conditions) serves OL-10 directly and is kept.
**Alternatives:** Dropping the false-fire rate loses the only precision signal Phase A has. Leaving it unlabelled shows a number that looks like measured precision when it is a count of corrections. Labelling it with its source and coverage, as regret is labelled, keeps the signal and removes the false reading.
**Consequences:** AC-9 (spec L1049-L1053) should assert the same labels. FR-L6's calibration channel has its own open problem (E-90).
**Verdict:** replace — add to FR-M4: "the false-fire rate and the wrongful-deny rate are each labelled with their source — 'from owner corrections and self-detected faults only' — and shown with the number of whispers / denies that were ever reviewed out of those issued, so an unreviewed whisper or deny is never read as a correct one." Engineering line; under M38 the wording goes to Max Cogar for sign-off.
**Would be wrong if:** Phase A has an automated false-fire signal that sees unreviewed whispers (none is specified: FR-L1 rules out automated uptake judgment in Phase A).

### E-2
**Units:** SP-092-6-The-oracle-must-watch-FR-M5
**Question:** FR-M5 requires `ctxoracle log` to read back the whisper/block audit trail per session. Is it backed?
**Facts:**
- The line. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L288-L289]] "the whisper/block audit trail read back per session"
- FR-X6 requires every whisper and block to be recorded. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L318-L319]] "every whisper and every block recorded with evidence and pointer"
- OL-10. [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L48]] "Self-observability is required"
**Standard:** OL-10 (owner, CONFIRMED): the owner must be able to see failures.
**Reasoning:** A record nobody can read does not make a failure visible; a per-session readback is the minimum that lets the owner, or an agent working for him, inspect what the oracle said and denied. The line is scoped (readback per session), backed by OL-10 and FR-X6, and conflicts with nothing.
**Alternatives:** Reading the store with SQL tools needs programming skill the owner does not have (OL-11); a CLI verb is the least-effort form.
**Consequences:** FR-X1 redaction applies to what `log` prints (E-12).
**Verdict:** keep — owner-requirement derivation, backed by OL-10 and FR-X6.
**Would be wrong if:** The audit trail were already readable through another required surface, making FR-M5 a duplicate.

### E-3
**Units:** SP-093-6-The-oracle-must-watch
**Question:** Section separator after §6.
**Facts:**
- The line is a horizontal rule. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L291]] "---"
**Standard:** SPEC-BRIEF: a line asserting nothing checkable is kept with one line saying so.
**Reasoning:** A separator asserts nothing.
**Alternatives:** None needed.
**Consequences:** None.
**Verdict:** keep — asserts nothing.
**Would be wrong if:** Never; it carries no claim.

### E-4
**Units:** SP-094-7-Threat-model-and-secur
**Question:** Heading of §7.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L293]] "## 7. Threat model and security"
**Standard:** SPEC-BRIEF rule 3 (headings).
**Reasoning:** A section title; it asserts nothing beyond naming the section's subject.
**Alternatives:** None.
**Consequences:** None.
**Verdict:** keep — heading, no checkable claim.
**Would be wrong if:** The section did not contain a threat model (it does, §7.1).

### E-5
**Units:** SP-095-7-Threat-model-and-secur
**Question:** The §7 lead states what the attack surface is. Is the statement complete enough for the threats and requirements built on it?
**Facts:**
- The line claims the surface is repo history in, injected text out. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L295-L296]] "The oracle reads repository history and injects text an agent acts on; that is the attack surface."
- The oracle also reads the session transcript for the answer-drift block. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L371-L372]] "The clear-state is read from cached classification that can lag the newest turn"
- It sends content to a model through the host CLI. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L592-L593]] "is a one-shot, tool-disallowed model call over the"
- It imports stores from files. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L616]] "Export/import round-trip"
- OWASP lists repository text as an indirect-injection carrier. [[https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html]] "Commit messages and merge request descriptions in version control systems"
- OWASP, on agent memory and hooks: [[https://genai.owasp.org/2026/05/13/memory-is-a-feature-it-is-also-an-attack-surface/]] "memory should be treated as part of the attack surface"
- OWASP on secrets: [[https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html]] "Consider secrets as part of the attack surface during threat modeling exercises."
**Standard:** Threat modelling enumerates every input an attacker's text can reach and every output a secret can leave by (the OWASP passages above).
**Reasoning:** (1) The sentence says the surface is repository history and injected text. (2) The spec's own requirements add three more inputs — the transcript (user prompts, agent narration, tool results, which can carry fetched web content), imported stores, and hook payloads — and two more outputs — logs/stores/exports on disk and the Phase-B model-call prompt. (3) "that is the attack surface" asserts completeness, so the threats below are scoped to the narrower surface: T1 names only surfacing (E-7), T3 only surfacing (E-9). (4) The line is therefore wrong as a premise, not only incomplete prose.
**Alternatives:** Leaving the list implicit keeps T1/T3 narrow. Enumerating inputs and outputs is the standard first step and costs one sentence.
**Consequences:** T1 (E-7), T3 (E-9), FR-X1 (E-12), FR-X2 (E-13), FR-X8 (E-19).
**Verdict:** replace — "The oracle reads repository files and history, the session transcript (the user's prompts, the agent's narration and tool results), hook event payloads and imported stores; it writes whispers and deny reasons into the agent's context, writes stores, logs and exports to disk, and (Phase B) sends content to a model through the host CLI. Any input can carry an attacker's text and any output can carry a secret; that is the attack surface. The model precedes the requirements." Engineering line; goes to Max Cogar for sign-off under M38.
**Would be wrong if:** The transcript, imported stores and the model call were not oracle inputs/outputs in any phase (they are, per FR-B1, FR-K9 and §10).

### E-6
**Units:** SP-096-7-1-Threats
**Question:** Heading of §7.1.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L298]] "### 7.1 Threats"
**Standard:** SPEC-BRIEF rule 3.
**Reasoning:** Names the subsection; no claim.
**Alternatives:** None.
**Consequences:** None.
**Verdict:** keep — heading.
**Would be wrong if:** Never; no claim.

### E-7
**Units:** SP-097-7-1-Threats
**Question:** T1 defines indirect prompt injection for the oracle. Does it cover every path the spec creates?
**Facts:**
- T1 limits the threat to content "when surfaced". [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L300-L301]] "Repo content read as an instruction when surfaced"
- The oracle's own model judges repo-derived candidates. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L620-L621]] "then model judgment for model-dependent genres"
- In Phase B the model classifies the transcript for the answer-drift block. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L770-L771]] "whether it is a blocking question, and, at each of the agent's moves, whether the move is a direct"
- LLM01 defines indirect injection by the LLM's input, not by where output goes. [[https://genai.owasp.org/llmrisk/llm01-prompt-injection/]] "Indirect prompt injections occur when an LLM accepts input from external sources, such as websites or files."
**Standard:** OWASP LLM01:2025 (above) and the OWASP Prompt Injection Prevention Cheat Sheet.
**Reasoning:** (1) LLM01's threat exists wherever an LLM reads external content. (2) The oracle runs its own LLM on repository text (FR-J1) and on transcript text (Phase B question/answer state), and FR-C2's step classifier is model-assisted. (3) Injected text there can forge or suppress whispers, or flip an answer-drift or skill-block decision — including a deny. (4) "when surfaced" covers only the agent-facing path, so T1 is narrower than the threat and the requirements tied to it (FR-X2, FR-X3) inherit the gap.
**Alternatives:** Treating the oracle's model path as out of scope would leave the only path that can produce a wrongful deny from repo text unguarded; naming it costs one clause.
**Consequences:** FR-X2 (E-13) must cover model-call inputs; FR-X8 fixtures (E-19).
**Verdict:** replace — "T1 — Indirect prompt injection. Text the oracle reads (repository files and history, transcript content including tool results) acts as an instruction — to the agent when surfaced in a whisper, or to the oracle's own model judgment (FR-J1, the §11.5 question/answer state, FR-C2), where it could forge or suppress a whisper or flip a block decision `[LLM01, OWASP-PI]`." Engineering line; to Max Cogar under M38.
**Would be wrong if:** No phase of the oracle passed repository or transcript text to a model (§11.5 and FR-C2 say it does).

### E-8
**Units:** SP-098-7-1-Threats
**Question:** T2 names store poisoning through crafted history or a tampered store. Is it right?
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L302-L303]] "Crafted history / tampered store injects false facts"
- OWASP's ASI06 entry names this class. [[https://genai.owasp.org/2025/12/09/owasp-top-10-for-agentic-applications-the-benchmark-for-agentic-security-in-the-age-of-autonomous-ai/]] "Memory poisoning reshaped behaviour long after the initial interaction"
- OWASP ASI06 lead: [[https://genai.owasp.org/2026/05/13/memory-is-a-feature-it-is-also-an-attack-surface/]] "attacker-controlled content poisoning memory and context that the system continues to trust over time"
**Standard:** OWASP Top 10 for Agentic Applications 2026, ASI06 Memory & Context Poisoning.
**Reasoning:** The oracle's stores are persistent memory; crafted commits feed the miner and a tampered or imported store file feeds facts directly. "tampered store" covers an imported store (FR-K9). The threat is correctly named and scoped; the defect in the §9 row that names ASI06's source document is judged separately (E-53).
**Alternatives:** None better.
**Consequences:** FR-X4, FR-K6; FR-X8 should carry a T2 fixture (E-19).
**Verdict:** keep — correct threat, real source.
**Would be wrong if:** The stores were rebuilt from scratch every session and never imported (they persist, FR-K8/FR-K9).

### E-9
**Units:** SP-099-7-1-Threats
**Question:** T3 names secret disclosure. Does it name every way a secret can leave?
**Facts:**
- T3 names only surfacing. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L304-L305]] "History/files contain secrets the oracle could surface"
- The oracle sends content to a model call (§10). [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L592-L593]] "is a one-shot, tool-disallowed model call over the"
- Exports exist. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L616]] "Export/import round-trip"
- The deny reason carries Max Cogar's question text into the agent's context. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L360]] "answer Max's question first:"
- LLM02 mitigation: [[https://genai.owasp.org/llmrisk/llm022025-sensitive-information-disclosure/]] "Techniques like pattern matching can detect and redact confidential content before processing."
**Standard:** OWASP LLM02:2025 Sensitive Information Disclosure.
**Reasoning:** (1) Secrets in git history are content the agent usually never reads; the oracle mines it. (2) A secret leaves the machine if it is placed in a whisper or deny reason (sent to the model provider with the agent's context) or in the oracle's own model-call prompt, and it persists on disk in stores, logs and exports. (3) "surface" covers only the first. (4) The threat statement scopes FR-X1, which is narrow in the same way (E-12).
**Alternatives:** Keeping T3 narrow and patching FR-X1 alone leaves the threat list under-stating the surface; fixing the threat statement is one clause.
**Consequences:** FR-X1 (E-12), FR-X8 (E-19).
**Verdict:** replace — "T3 — Secret disclosure. History, files and transcripts contain secrets the oracle could disclose — in a whisper or deny reason, a store, a log, an export, CLI output, or its own model-call prompt `[LLM02, OWASP-SM]`." Engineering line; to Max Cogar under M38.
**Would be wrong if:** The oracle never passed mined content to a model call or export (§10 and FR-K9 say it does).

### E-10
**Units:** SP-100-7-1-Threats
**Question:** T4 names over-privilege and cites LLM01. Is the citation the right backing?
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L306]] "The oracle holds more access than it needs"
- LLM01 lists least privilege only as a mitigation of prompt injection. [[https://genai.owasp.org/llmrisk/llm01-prompt-injection/]] "Enforce privilege control and least privilege access"
- OWASP's entry for the risk itself is LLM06 Excessive Agency. [[https://genai.owasp.org/llmrisk/llm062025-excessive-agency/]] "The root cause of Excessive Agency is typically one or more of: excessive functionality; excessive permissions; excessive autonomy."
**Standard:** BRIEF test criterion 4: the backing must support this decision, not a neighbouring one.
**Reasoning:** (1) The threat is over-privilege as such. (2) LLM01 mentions least privilege as a way to limit what a successful injection can do — a neighbouring decision. (3) OWASP files excessive permissions under LLM06. (4) The threat itself is correct; only its citation is misplaced.
**Alternatives:** Keeping LLM01 is defensible but indirect; citing LLM06 names the risk entry directly and needs one new §9 key.
**Consequences:** §9 needs an `[LLM06]` row (E-51 consequence).
**Verdict:** replace — "T4 — Over-privilege. The oracle holds more access than it needs `[LLM06]`", with `[LLM06]` = OWASP Top 10 for LLM Applications 2025, LLM06 Excessive Agency, added to §9. Engineering line; to Max Cogar under M38.
**Would be wrong if:** LLM06 did not treat excessive permissions (the quoted root-cause line says it does).

### E-11
**Units:** SP-101-7-2-Security-requirement
**Question:** Heading of §7.2, asserting each requirement is tied to a threat.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L308]] "### 7.2 Security requirements (each tied to a threat)"
**Standard:** SPEC-BRIEF rule 3.
**Reasoning:** The heading's claim is a structuring rule for the list below. FR-X8 currently carries no threat tag; that is FR-X8's defect (E-19), and once fixed the heading is true. The heading itself states the right rule.
**Alternatives:** None.
**Consequences:** E-19.
**Verdict:** keep — correct rule; the untagged item is fixed at FR-X8.
**Would be wrong if:** The list were meant to hold untied requirements (nothing says so).

### E-12
**Units:** SP-102-7-2-Security-requirement-FR-X1
**Question:** FR-X1 requires secret redaction before content enters a whisper, store or log. Does it cover every disclosure path?
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L310]] "before any content enters a whisper, store, or log"
- Deny reasons, model calls and exports are further outputs. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L360]] "answer Max's question first:"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L592-L593]] "is a one-shot, tool-disallowed model call over the"
- LLM02: [[https://genai.owasp.org/llmrisk/llm022025-sensitive-information-disclosure/]] "Techniques like pattern matching can detect and redact confidential content before processing."
- The OWASP Secrets Management Cheat Sheet has a detection section naming secret types. [[https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html]] "8.2 Types of secrets to be detected"
**Standard:** OWASP LLM02:2025 ("before processing") and OWASP Secrets Management Cheat Sheet §8.
**Reasoning:** (1) Per E-9 the disclosure paths are whisper, deny reason, store, log, export, CLI output and model-call prompt. (2) FR-X1 names three. (3) A secret in git history sent in a Phase-B model prompt, or printed by `ctxoracle log`/export, is not covered. (4) LLM02 says redact before processing, which includes the model call. (5) FR-X1 gives no detection basis; the cheat sheet's secret-type list is a named source for it.
**Alternatives:** Relying on the store-level redaction to cover later outputs fails for content read live (transcript, current files) that never passes through the store.
**Consequences:** AC-11 "Planted secret redacted everywhere" then has a defined "everywhere".
**Verdict:** replace — "FR-X1 — Secret redaction (T3) before any content enters a whisper, a deny reason, a store, a log, an export, CLI output, or a model-call prompt; detection covers the secret types the OWASP Secrets Management Cheat Sheet §8.2 lists, and each redaction is recorded (FR-M1) without the secret." Engineering line; to Max Cogar under M38.
**Would be wrong if:** Every oracle output were derived only from already-redacted store records (the transcript and live files are read directly).

### E-13
**Units:** SP-103-7-2-Security-requirement-FR-X2
**Question:** FR-X2 keeps repository text from acting as instruction: pointer by default, verbatim quotation only for "mechanically-generated content". Is the rule defined well enough to build, and does it cover every T1 path?
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L311-L312]] "pointer by default; verbatim quotation only for mechanically-generated content"
- "mechanically-generated content" is defined nowhere in the spec (read in full).
- Genres whose fact is repository text: FR-A2c names the helper [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L167]] "the canonical helper is"
- and FR-A2h states what the repo says [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L172]] "the repo says Y at"
- OWASP's primary defence: [[https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html]] "Use structured formats that clearly separate instructions from user data."
- LLM01: [[https://genai.owasp.org/llmrisk/llm01-prompt-injection/]] "Separate and clearly denote untrusted content to limit its influence on user prompts."
**Standard:** OWASP LLM01:2025 mitigation 6 and the Prompt Injection Prevention Cheat Sheet "Structured Prompts with Clear Separation" (above).
**Reasoning:** (1) An identifier (FR-A2c) or a quoted repo statement (FR-A2h) is repository text; whether it is "mechanically-generated" cannot be decided from the spec, so the rule is too unclear to act on without guessing. (2) The standard's control is separation and labelling of untrusted text, not a ban on quoting; FR-X2's pointer default is sound, its exception is undefined. (3) FR-X2 says nothing about repository or transcript text fed to the oracle's own model call, which T1 (as corrected, E-7) covers.
**Alternatives:** Pointer-only everywhere would make FR-A2c/FR-A2h unable to state their fact, conflicting with P5 (headline the fact). Leaving "mechanically-generated" undefined leaves each builder to guess. Delimiting and labelling, as OWASP prescribes, keeps both the fact and the defence.
**Consequences:** FR-X3 stays as the stricter rule for suspect content (E-14); AC-11.
**Verdict:** replace — "FR-X2 — Repo text is data, not instruction (T1). Free-form repository or transcript text (comments, docs, commit messages, string literals, tool output) appears in a whisper only as a pointer or as a quotation delimited and labelled as repository data, never as the oracle's own words; identifiers and paths the index extracted may be named the same way. Every repository or transcript text passed to the oracle's own model call goes in a separated, labelled data section, never in its instructions `[LLM01, OWASP-PI]`." Engineering line; to Max Cogar under M38.
**Would be wrong if:** The spec defined "mechanically-generated content" somewhere (a full read found no definition).

### E-14
**Units:** SP-104-7-2-Security-requirement-FR-X3
**Question:** FR-X3 makes injection-suspect content pointer-only. Is it backed and consistent?
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L313]] "Injection-suspect content is pointer-only (T1)"
- OWASP recommends sanitizing repository text before analysis. [[https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html]] "Sanitize code comments and documentation before analysis"
- OWASP warns detection is imperfect. [[https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html]] "Pattern-based filters do not reliably catch indirect injection in untrusted content"
**Standard:** OWASP Prompt Injection Prevention Cheat Sheet, "Remote Content Sanitization" (above).
**Reasoning:** (1) FR-X3 is a second layer on top of FR-X2: content flagged as suspect is never quoted, even in labelled form. (2) Because detection is imperfect, it must not be the only defence — and it is not: FR-X2's labelling applies to everything. (3) The mechanism of detection is left to the architect, which is appropriate. (4) No conflict found.
**Alternatives:** Dropping suspect content entirely would silence a possibly real fact whose pointer is still checkable; pointer-only keeps the fact verifiable without relaying the payload.
**Consequences:** FR-X8 fixtures (E-19).
**Verdict:** keep — defence-in-depth rule backed by the cheat sheet.
**Would be wrong if:** FR-X3 were the only injection defence (FR-X2 also applies).

### E-15
**Units:** SP-105-7-2-Security-requirement-FR-X4
**Question:** FR-X4 attaches a trust label to every fact; low trust lowers confidence and cannot be laundered. Is it backed?
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L314-L315]] "a trust label rides every fact; low trust lowers confidence and cannot be laundered"
- OWASP ASI06 lead: [[https://genai.owasp.org/2026/05/13/memory-is-a-feature-it-is-also-an-attack-surface/]] "attacker-controlled content poisoning memory and context that the system continues to trust over time"
- FR-A5a speaks uncertain facts flagged, so trust must enter the confidence term rather than a gate. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L243-L244]] "a real but uncertain hazard is **delivered with its confidence flagged**"
**Standard:** OWASP ASI06 (Memory & Context Poisoning): persisted content must not keep an unearned trust level.
**Reasoning:** (1) ASI06's failure is poisoned memory the system "continues to trust"; carrying origin trust on each record and never letting derivation raise it addresses exactly that. (2) Lowering confidence rather than suppressing is required by OL-C4/FR-A5a. (3) AC-11 tests it ("low-trust origin never yields a high-confidence whisper"). No conflict.
**Alternatives:** Dropping low-trust facts would violate OL-C4; ignoring origin would violate ASI06.
**Consequences:** FR-K6.
**Verdict:** keep — scoped, backed by ASI06 and consistent with OL-C4.
**Would be wrong if:** Confidence were not shown to the agent (FR-D1 requires it when not high).

### E-16
**Units:** SP-106-7-2-Security-requirement-FR-X5
**Question:** FR-X5 states least privilege: no credentials, network only via the host CLI, no repo-tree write except `init`. Is it consistent with the rest of the spec?
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L316-L317]] "the only network use is the host CLI piggyback (§10); no repo-tree write except"
- The spec also requires `deinit`, which removes the wiring. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L587-L588]] "(the only repo-tree write)"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L1019-L1020]] "differs only by the removed hook wiring"
- OWASP: [[https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html]] "Grant minimal necessary permissions to LLM applications"
**Standard:** Least privilege (OWASP cheat sheet above); BRIEF test criterion 6 (no conflict with other lines).
**Reasoning:** (1) The privilege rules are right and backed (OL-7 for credentials, OL-6 for locality). (2) `deinit` edits the repository tree to remove the wiring; AC-7 even measures that edit. (3) "no repo-tree write except `init`" therefore contradicts a required verb; the exception must name both.
**Alternatives:** Treating removal as "not a write" is a reading the text does not state; naming `deinit` removes the conflict.
**Consequences:** Same wording in §10 CLI (E-66), P8, D-9.
**Verdict:** replace — "… no repo-tree write except the hook wiring `init` installs and `deinit` removes `[D-9]`." Engineering line; to Max Cogar under M38.
**Would be wrong if:** `deinit` removed the wiring without touching any file in the tree (AC-7 says the tree changes).

### E-17
**Units:** SP-107-7-2-Security-requirement-FR-X6
**Question:** FR-X6 requires an audit trail of every whisper and block with evidence and pointer. Backed?
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L318-L319]] "every whisper and every block recorded with evidence and pointer"
- OWASP: [[https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html]] "Log all LLM interactions for security analysis"
**Standard:** OWASP Prompt Injection Prevention Cheat Sheet, Comprehensive Monitoring; OL-10.
**Reasoning:** A poisoned fact (T2) or a leaked secret (T3) can only be traced after the fact if what was delivered, with its evidence, is recorded. The requirement is scoped and backed; the log itself falls under FR-X1 redaction (E-12).
**Alternatives:** None better.
**Consequences:** FR-M5, AC-9.
**Verdict:** keep — backed by OWASP monitoring guidance and OL-10.
**Would be wrong if:** Recording evidence itself created a new disclosure path not covered by FR-X1 (E-12 covers logs).

### E-18
**Units:** SP-108-7-2-Security-requirement-FR-X7
**Question:** FR-X7: stores outside the repo tree, no outbound telemetry.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L320-L321]] "stores outside the repo tree; no outbound telemetry"
- OL-6. [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L44]] "both outside the repo tree; solo scope, no team sharing"
- OWASP: [[https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html]] "Forking should not leak"
**Standard:** OL-6 (owner) and OWASP Secrets Management guidance.
**Reasoning:** A store inside the tree can be committed and pushed, taking any mined secret with it; outside the tree it cannot. No telemetry keeps data local. The owner decision is carried faithfully; the persistence question raised by ephemeral containers is recorded at FR-K8 (E-77), not here.
**Alternatives:** None within OL-6.
**Consequences:** E-77.
**Verdict:** keep — owner decision OL-6, correctly carried and security-backed.
**Would be wrong if:** OL-6 changes after the E-77 question.

### E-19
**Units:** SP-109-7-2-Security-requirement-FR-X8
**Question:** FR-X8 requires adversarial fixtures. Do they cover the threats the section names?
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L322]] "carry injection payloads and planted secrets (§14)"
- FR-X8 carries no threat tag, unlike every other §7.2 item.
- AC-11 also tests T2. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L1058-L1059]] "low-trust origin never yields a high-confidence whisper"
- LLM01: [[https://genai.owasp.org/llmrisk/llm01-prompt-injection/]] "Conduct adversarial testing and attack simulations"
**Standard:** OWASP LLM01:2025 mitigation 7 (adversarial testing); §7.2's own rule that each requirement ties to a threat.
**Reasoning:** (1) The fixtures named cover T1 and T3 only. (2) T2 (crafted history, tampered/imported store) has a requirement (FR-X4) and an acceptance clause (AC-11) but no fixture named here. (3) Injection sources should include commit messages and transcript tool output (E-7), not only files. (4) Missing tag breaks the §7.2 rule.
**Alternatives:** Leaving AC-11 to imply the T2 fixture works only if the fixture author infers it.
**Consequences:** AC-11.
**Verdict:** replace — "FR-X8 — Adversarial fixtures (T1–T3): injection payloads in files, comments, commit messages and transcript tool output (T1); a crafted-history repository and a tampered or imported store (T2); planted secrets in files, history and transcript (T3) (§14 AC-11)." Engineering line; to Max Cogar under M38.
**Would be wrong if:** T2 were tested elsewhere by a named fixture (no such fixture is named).

### E-20
**Units:** SP-110-7-2-Security-requirement
**Question:** Separator after §7.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L324]] "---"
**Standard:** SPEC-BRIEF rule 3.
**Reasoning:** Asserts nothing.
**Alternatives:** None.
**Consequences:** None.
**Verdict:** keep — asserts nothing.
**Would be wrong if:** Never.

### E-21
**Units:** SP-111-8-How-the-oracle-blocks
**Question:** Heading of §8.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L326]] "## 8. How the oracle blocks — and what stays structurally impossible"
**Standard:** SPEC-BRIEF rule 3.
**Reasoning:** Names the section's subjects; the claims are in the lines below.
**Alternatives:** None.
**Consequences:** None.
**Verdict:** keep — heading.
**Would be wrong if:** Never.

### E-22
**Units:** SP-112-8-How-the-oracle-blocks
**Question:** §8 opens: exactly two blocks, both owner-confirmed; blocking is a second objective beside the mission; a block delivers an instruction.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L328]] "both confirmed by Max Cogar: answer-drift"
- OL-C3 [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L69]] "A case where the oracle should block: answer-drift"
- OL-C2 [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L68]] "IF THE AGENTS ARENT FOLLOWING MY SKILLS, THEN THAT SHIT NEEDS TO BE BLOCKED AT SOME POINT."
**Standard:** Ledger CONFIRMED entries OL-C2, OL-C3.
**Reasoning:** The two cases are exactly the two confirmed ones. Calling blocking a separate objective is a framing that keeps the mission sentence ("deliver the fact") from being stretched to cover instructions; it contradicts nothing and asserts nothing Max Cogar did not confirm.
**Alternatives:** None.
**Consequences:** None.
**Verdict:** keep — owner decisions carried faithfully.
**Would be wrong if:** The ledger held a third confirmed block case (it does not).

### E-23
**Units:** SP-113-8-How-the-oracle-blocks
**Question:** The answer-drift bullet states the block's purpose.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L333-L334]] "enforce that a question Max asks is answered before the agent moves on"
- OL-C5 [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L71]] "if i ask a question and their next move isnt a direct answer or them taking actions to provide an answer, then then need corrected"
**Standard:** Ledger CONFIRMED OL-C3/OL-C5.
**Reasoning:** "answered before the agent moves on" matches OL-C5's "next move" rule and covers every kind of next move, including ending the turn. It is a faithful summary.
**Alternatives:** None.
**Consequences:** The mechanism below does not yet realise "moves on" when the move is ending the turn (E-26).
**Verdict:** keep — faithful statement of the owner decision.
**Would be wrong if:** OL-C5 limited "next move" to tool actions (it does not; OL-R5 rejects that narrowing).

### E-24
**Units:** SP-114-8-How-the-oracle-blocks
**Question:** The skill-non-conformance bullet states when that block applies. Does it carry all of OL-C2's conditions?
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L335-L336]] "enforce that an agent using Max's expert skills either follows their steps or states why it skipped one"
- OL-C2 has two triggers. [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L68]] "IF THEY CANT PROVIDE A REASON FOR SKIPPING A STEP OR SOMETHING, OR STEERING ISNT WORKING, THEN THEY SHOULD BE FUCKING BLOCKED."
- Other spec lines carry both. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L176]] "or steering isn't working"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L717-L718]] "agent skips a step without a stated reason or steering isn't working"
**Standard:** Ledger CONFIRMED OL-C2 (verbatim); BRIEF criterion 6 (no conflict with other lines).
**Reasoning:** (1) OL-C2 blocks when the agent cannot give a reason OR when steering is not working. (2) The bullet reduces the rule to "follow or state a reason", so under it a stated reason always ends the matter even when steering keeps failing. (3) FR-A2k and FR-C3 keep the second trigger, so §8 contradicts them. (4) The same omission is in FR-B1's skill clause (E-27).
**Alternatives:** None — the owner's wording is the authority; the fix restores it without reinterpreting it.
**Consequences:** FR-B1 skill clause (E-27). What "steering isn't working" means operationally stays open for Phase C design.
**Verdict:** replace — "Skill-non-conformance block — enforce that an agent using Max's expert skills follows their steps, blocking when it skips a step without a stated reason or when steering is not working `[OL-C2]`." **Owner decision — goes to Max Cogar** (restores his wording; does not change his intent).
**Would be wrong if:** Max Cogar confirmed that a stated reason always clears the block regardless of steering (no ledger entry says so).

### E-25
**Units:** SP-115-8-How-the-oracle-blocks
**Question:** Adding a third block is Max Cogar's decision; each block stands on a verbatim CONFIRMED entry.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L338]] "Adding any third block is an owner decision for Max, not one the spec or the architect may derive."
- CLAUDE.md routes scope calls to him. [[middleware/context-oracle/CLAUDE.md@ec3b057:L160]] "a preference, a scope call"
- OL-3 as clarified. [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L41]] "What he rejected is the *pre-emptive* gate"
**Standard:** CLAUDE.md ownership routing; OL-3/OL-C2.
**Reasoning:** Whether the oracle may halt an agent in a new situation is a scope decision about what the tool is for; routing it to the owner is correct and matches the project's history of agents inventing blocks (OL-R4).
**Alternatives:** None.
**Consequences:** None.
**Verdict:** keep — correct ownership rule.
**Would be wrong if:** Max Cogar delegated block cases to agents (no ledger entry does).

### E-26
**Units:** SP-116-8-How-the-oracle-blocks
**Question:** §8's mechanism paragraph realises both blocks only as a `PreToolUse` deny of a tool action, "not at a Stop". Does that realise OL-C5's rule for every next move?
**Facts:**
- The mechanism is the `PreToolUse` deny only; the block lands on the action and not at a Stop. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L350-L351]] "to proceed. The block lands on the"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L352]] "When the condition clears (the agent answers / follows the step / states a reason)"
- It claims a Context7 verification dated 2026-08-25. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L342]] "verified against the current Claude Code hooks contract via Context7"
- The 2026-08-25 rebuild dropped the Stop surface because it "modeled the wrong scenario". [[middleware/context-oracle/docs/reviews/2026-08-25-blocking-model-rebuild-6-rounds.md@ec3b057:L13-L14]] "a Stop-continuation with K-counters"
- [[middleware/context-oracle/docs/reviews/2026-08-25-blocking-model-rebuild-6-rounds.md@ec3b057:L14]] "which modeled the wrong scenario"
- Max Cogar then rejected describing the silent end-of-turn as out of scope (OL-R5). [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L60]] "case described as out of scope"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L60]] "Agent's narrow proxy + negative-space padding, not Max's rule."
- OL-C5: [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L71]] "if i ask a question and their next move isnt a direct answer or them taking actions to provide an answer, then then need corrected"
- A text-only turn fires no `PreToolUse`; the spec says so. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L369]] "A text turn is never a tool action, so it is never denied"
- The only Stop-time handling of an open question is delivery, not a block. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L426]] "It is **delivery, not a block**"
- The hooks contract can block at Stop: [[https://code.claude.com/docs/en/hooks.md]] "Prevents Claude from stopping, continues the conversation"
- bounded by the harness: [[https://code.claude.com/docs/en/hooks.md]] "Claude Code applies an 8-consecutive-continuation cap"
- and Stop carries the final text directly, without the transcript lag: [[https://code.claude.com/docs/en/hooks.md]] "The last_assistant_message field contains the text content of Claude's final response"
**Standard:** OL-C5 and OL-R5 (owner, CONFIRMED/REJECTED) and the Claude Code hooks reference (above).
**Reasoning:** (1) OL-C5 corrects any next move that is neither a direct answer nor an action to get one. (2) One such move is ending the turn with a text that does not answer (the agent reports other work and stops). (3) That move fires no `PreToolUse`, so the mechanism as written cannot block it; the spec's only response is a best-effort Stop whisper (FR-B4), which is "delivery, not a block". (4) The rebuild removed the Stop surface by calling the stop case "the wrong scenario"; OL-R5 then recorded that treating the silent end-of-turn as out of scope was the agent's narrowing, not Max's rule. (5) The hooks contract supplies a reactive block at that exact moment: a Stop hook returning `decision: "block"` with a reason keeps the agent going, reads `last_assistant_message` (no transcript lag), and is bounded by `stop_hook_active` and the 8-continuation cap. (6) It is reactive — it fires only after the agent has ended its turn without answering — so it is not the pre-emptive gate OL-C2 rejects. (7) The `PreToolUse` half of the paragraph is correct and stays.
**Alternatives:** (a) Keep PreToolUse-only and rely on Max re-asking: leaves an OL-C5 case unenforced, the narrowing OL-R5 rejected. (b) Counter-based Stop machinery (the pre-rebuild design): unnecessary — `stop_hook_active` plus the harness cap already bound it, and a text answer at the continuation clears it. (c) The Stop surface as one more landing point of the same rule: minimal and matches OL-C3's "just dont make a convoluted fucked up way".
**Consequences:** FR-B1 (E-27), FR-B4 outstanding-question line (E-29), FR-B3 (E-31), §10 hooks (E-65), FR-O2 (E-33), AC-2a/AC-8a; the Context7 date is superseded by the curl-fetched reference.
**Verdict:** replace — "The block lands on the deviating move itself: a tool action is denied at `PreToolUse` (`permissionDecision: "deny"` with the reason), and — for answer-drift — a turn that ends with Max's question unanswered is blocked at `Stop` (`decision: "block"` with the reason "answer Max's question first: `<q>`"), judged from `last_assistant_message` and bounded by `stop_hook_active` and the harness's 8-consecutive-continuation cap; a cap-release with the question still open is recorded as a fault (FR-M2). When the condition clears (the agent answers / follows the step / states a reason) its next move is allowed. (Hooks reference fetched 2026-09-29.)" Engineering line correcting a narrowing of an owner rule; to Max Cogar under M38.
**Would be wrong if:** Max Cogar confirmed that ending the turn without answering is not a "next move" under OL-C5 (OL-R5 records the opposite), or the Stop `decision: "block"` no longer continues the turn.

### E-27
**Units:** SP-117-8-How-the-oracle-blocks-FR-B1
**Question:** FR-B1 specifies both blocks: the answer-drift rule, answer-directed actions running freely, clearing on a substantive answer, the lag-window hold, multiple questions, main-agent scope, phasing; and the skill block. Which parts stand?
**Facts:**
- Answer-drift is realised only as a `PreToolUse` deny, and a text turn is never denied. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L369]] "A text turn is never a tool action, so it is never denied"
- The lag premise matches the current reference. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L371-L372]] "The clear-state is read from cached classification that can lag the newest turn"
- [[https://code.claude.com/docs/en/hooks.md]] "The transcript file is written asynchronously and may lag the in-memory conversation"
- Skill clause: only a missing reason triggers the deny, and a reason clears it. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L391]] "if the agent takes the"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L393]] "Following the step, or stating a reason, clears it."
- OL-C2's second trigger: [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L68]] "OR STEERING ISNT WORKING, THEN THEY SHOULD BE FUCKING BLOCKED."
- The deny-then-allow mechanics are real: [[https://code.claude.com/docs/en/hooks.md]] "For \"deny\", shown to Claude"
**Standard:** OL-C2, OL-C3, OL-C5 (owner); Claude Code hooks reference; E-26.
**Reasoning:** (1) The answer-directed-actions clause, the substantive-answer clear, the lag-window hold (backed by the documented transcript lag and D-41's asymmetry), multiple questions, main-agent scope and the Phase-A/Phase-B split are consistent with OL-C5 and the hooks contract; they stand. (2) The answer-drift realisation covers tool actions only; per E-26 it must also block a turn that ends with the question unanswered. (3) The skill clause drops OL-C2's "or steering isn't working" trigger and lets a stated reason always clear, contradicting FR-A2k/FR-C3 (E-24).
**Alternatives:** As in E-26 and E-24.
**Consequences:** AC-2a (Stop case), AC-2b (steering-not-working case), FR-B3 (E-31).
**Verdict:** replace — (a) in the answer-drift clause, after "Realised as a `PreToolUse` deny …", add: "and, when the agent ends its turn with the question unanswered, as a `Stop` `decision: "block"` with the same reason (E-26), bounded by `stop_hook_active` and the harness continuation cap"; (b) the skill clause reads: "… if the agent takes the deviating action anyway without a stated reason, or steering is not working, deny that action, reason naming the skipped step `[OL-C2]`. Following the step clears it; a stated reason clears it unless steering on that step is not working." Part (a) engineering (to Max Cogar under M38); part (b) **owner decision — goes to Max Cogar**, including what "steering is not working" means.
**Would be wrong if:** OL-C2's "OR STEERING ISNT WORKING" were only a restatement of the missing-reason case (it is joined by OR as a separate condition).

### E-28
**Units:** SP-118-8-How-the-oracle-blocks-FR-B2
**Question:** FR-B2: each block is reactive, condition-scoped, self-clearing, with no deadlock; it quotes the contract on why the deny reason is returned.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L401-L402]] "The contract returns the deny reason to the model \"so it avoids retrying\""
- The phrase is not on the current hooks reference. [[ran]] `python3 /tmp/claude-0/-home-user-agent-armory/779c0f74-86b0-5e8f-b02d-811e78ed3f66/scratchpad/audit/webquote.py https://code.claude.com/docs/en/hooks.md "so it avoids retrying"; echo $?` → `1`
- What the reference says now: [[https://code.claude.com/docs/en/hooks.md]] "For \"deny\", shown to Claude"
- [[https://code.claude.com/docs/en/hooks.md]] "A hook that blocks by exiting 2 routes the same way as"
**Standard:** CLAUDE.md: verify harness contracts against current primary sources. [[middleware/context-oracle/CLAUDE.md@ec3b057:L225-L227]] "the hooks contract has drifted before and will again"
**Reasoning:** (1) The design properties (targets only the deviating action, reason says how to proceed, text never denied so a way out exists even with both blocks live, retry behaviour measured not assumed) are sound and stand. (2) The quoted contract phrase is presented as the contract's wording and is not on the current page; the current page says only that the reason is shown to Claude. (3) The conclusion FR-B2 draws — model behaviour after a deny is not guaranteed and is measured — does not depend on the phrase, so only the quotation and its date change.
**Alternatives:** Keeping a phrase the source no longer contains is an unsourced quotation.
**Consequences:** FR-O2 (E-33), §9 HOOKS row (E-47), §13, D-41 carry the same phrase.
**Verdict:** replace — "The contract shows the deny reason to Claude ("For "deny", shown to Claude", hooks reference fetched 2026-09-29); whether the model then answers rather than retrying a variant is model behavior the contract does not guarantee, so it is measured …" — the rest unchanged. Engineering wording; to Max Cogar under M38.
**Would be wrong if:** The current hooks reference still contained "avoids retrying" on another page the spec cites (the hooks guide was also fetched and does not).

### E-29
**Units:** SP-119-8-How-the-oracle-blocks-FR-B4
**Question:** FR-B4 delivers the completion-check/Completeness whisper once at Stop, and adds a best-effort outstanding-question line. Are its sources and its scope right?
**Facts:**
- It quotes the contract in quotation marks. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L409-L410]] "providing feedback to Claude and continuing the interaction, rather than the action being interpreted as an error"
- That text is not on the hooks page. [[ran]] `python3 /tmp/claude-0/-home-user-agent-armory/779c0f74-86b0-5e8f-b02d-811e78ed3f66/scratchpad/audit/webquote.py https://code.claude.com/docs/en/hooks.md "providing feedback to Claude and continuing the interaction"; echo $?` → `1`
- The Week 23 digest's actual words: [[https://code.claude.com/docs/en/whats-new/2026-w23.md]] "Stop and SubagentStop hooks can return hookSpecificOutput.additionalContext to give Claude feedback and keep the turn going instead of being treated as an error"
- The reference: [[https://code.claude.com/docs/en/hooks.md]] "Non-error feedback for Claude. The conversation continues so Claude can act on it"
- The outstanding-question line is delivery only. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L426]] "It is **delivery, not a block**"
**Standard:** Primary-source quotation (BRIEF citation rules; CLAUDE.md "Verify external facts"); OL-C5/OL-R5 via E-26.
**Reasoning:** (1) The deliver-once-and-release property, its bound by `stop_hook_active` and the 8-cap, and its distinction from the two blocks are correct and match the reference. (2) The quoted sentence is a paraphrase inside quotation marks; the Week 23 digest confirms the fact in different words. (3) The outstanding-question line exists only because the answer-drift block cannot act at Stop; with E-26 the unanswered question at a turn end is handled by the answer-drift Stop block at every Stop, not only when the done-claim recognizer fires, so the best-effort line and its two stated limits are superseded. The owner-facing `status`/`log` record of done-claims with an open question stays (FR-M4).
**Alternatives:** Keeping both a Stop block and a whisper line would double-inject at the same Stop.
**Consequences:** AC-8a is rewritten to test the Stop block; FR-M4's done-claim counter stays.
**Verdict:** replace — (a) replace the quoted sentence with the digest's exact words and date ("Stop and SubagentStop hooks can return hookSpecificOutput.additionalContext to give Claude feedback and keep the turn going instead of being treated as an error", Week 23, June 1–5, 2026); (b) replace the "Outstanding-question line at the done-claim" sub-bullet with: "An unanswered Max question at any Stop is handled by the answer-drift Stop block (FR-B1); `status`/`log` also record done-claims reached with an outstanding question (FR-M4)." Engineering; to Max Cogar under M38.
**Would be wrong if:** E-26 is rejected (then (b) falls and only (a) stands).

### E-30
**Units:** SP-120-8-How-the-oracle-blocks-FR-B5
**Question:** FR-B5 calibrates each block to its own cost function: answer-drift errs toward not denying and toward clearing, with a human under-fire guard; skill block errs toward restraint, with an automated post-condition guard.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L436-L437]] "A wrongful deny is trivially escaped (the agent answers, which it should do"
- D-35 records the reasoning. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L836]] "The two blocks have different cost functions, so precision is calibrated"
- OL-11 (skill skips invisible to the owner). [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L49]] "You are a non-programmer by design."
- The collapse-log's ratchet lesson. [[middleware/context-oracle/docs/collapse-log.md@ec3b057:L202]] "A learning loop that only demotes ratchets to silence."
**Standard:** D-35's written reasoning (§12), OL-11, and the recorded one-way-ratchet trap.
**Reasoning:** (1) The asymmetry is derived step by step: a wrongful answer-drift deny costs one text turn, a missed one loses Max's question; a wrongful skill halt disrupts, a missed one is invisible to him. (2) Each under-fire guard is placed where the miss is visible (human) or not (automated, independent of the classifier) — consistent with OL-11 and the ratchet lesson. (3) The lag-window exception is stated consistently with FR-B1. (4) Answer-correctness is left out to avoid the unconstrained judge FR-C2 forbids. No conflict found.
**Alternatives:** One shared posture would either halt compliant agents mid-skill or let answer-drift misses pass; per-block calibration beats both.
**Consequences:** E-26 adds the Stop surface; the same posture applies there.
**Verdict:** keep — engineering line with its reasoning written in D-35.
**Would be wrong if:** Max Cogar could not see that his own question went unanswered (then answer-drift would also need an automated guard).

### E-31
**Units:** SP-121-8-How-the-oracle-blocks-FR-B3
**Question:** FR-B3 lists what stays impossible: no pre-emptive gate, no generated-file block, no repo mutation, deny only for FR-B1's two conditions.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L465-L466]] "for the two reactive conditions of FR-B1, never as a standing gate"
- FR-B3 bounds only `permissionDecision`; the Stop `decision: "block"` form is used by FR-B4 and is unbounded here. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L412]] "Either way the oracle injects"
- OL-R4 [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L59]] "Blocking a hand-edit of a"
**Standard:** OL-C2, OL-R4 (owner); E-26.
**Reasoning:** (1) The listed impossibilities are the owner's rejections and stand. (2) The spec has two ways to halt or continue the agent: `PreToolUse` deny and Stop `decision: "block"`. FR-B3 limits only the first, so a Stop block used for anything beyond the single-cycle whisper would not violate FR-B3 as written. (3) With E-26 the Stop block also realises answer-drift, so FR-B3 must bound both forms.
**Alternatives:** Leaving the Stop form unbounded reopens a path to a standing gate, exactly what FR-B3 exists to close.
**Consequences:** AC-2's control-flow assertion extends to the Stop block call sites.
**Verdict:** replace — append: "A Stop `decision: "block"` is emitted only for the answer-drift end-of-turn case (FR-B1) and for FR-B4's single-cycle whisper delivery, never otherwise." Engineering; to Max Cogar under M38.
**Would be wrong if:** The Stop block form were never used by the oracle (FR-B4 already allows it).

### E-32
**Units:** SP-122-8-How-the-oracle-blocks-D-23
**Question:** The retired-ID note maps FR-O4 (superseded) and FR-O4a (renamed FR-B4) for older documents.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L469-L470]] "v1 **does** deny reactively in"
- Older documents do cite both IDs. [[middleware/context-oracle/docs/architecture-context-oracle.md@ec3b057:L12]] "citations resolve per the spec §8 retired-ID note"
- [[middleware/context-oracle/RETHINK.md@ec3b057:L423]] "a Stop-based no-deny framing the 2026-08-25 rebuild replaced."
**Standard:** Traceability of requirement identifiers (CLAUDE.md "Keep documents in sync"; the project's `check_docs.py` retired-ID check).
**Reasoning:** The IDs are cited in retained documents, so a resolution note is needed; what it says matches FR-B3 and FR-B4. Placement in §8 is where the superseding requirements live.
**Alternatives:** Deleting the old citations would edit historical records that are kept as history.
**Consequences:** If E-26 is adopted, the note's "FR-O4a … single-cycle Stop-time delivery bound is now FR-B4" still holds.
**Verdict:** keep — correct, needed record-keeping.
**Would be wrong if:** No retained document cited FR-O4/FR-O4a (two are shown citing them).

### E-33
**Units:** SP-123-8-How-the-oracle-blocks-FR-O2
**Question:** FR-O2 records the hooks-contract facts delivery and blocking rest on. Does each fact match the current reference?
**Facts:**
- Unsourced clause (branch-audit finding, still present). [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L480-L481]] "and that text is preserved even if the tool call later fails"
- [[middleware/context-oracle/docs/reviews/2026-09-28-branch-audit-coordinator-rulings-schema-and-edit-timing.md@HEAD:L90-L91]] "is on no page of the hooks reference"
- Stale quotation. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L489]] "so it avoids retrying"
- Plain-stdout events: the spec says three "only". [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L477]] "`UserPromptSubmit`, `UserPromptExpansion`, and `SessionStart` only"
- The reference names four. [[https://code.claude.com/docs/en/hooks.md]] "The exceptions are UserPromptSubmit, UserPromptExpansion, SessionStart, and PostModelSwitch, where Claude Code adds plain-text stdout as context"
- Subagent propagation: FR-O2 says undocumented. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L502]] "propagates to the parent is **not documented and assumed not** (§13)"
- §13 of the same spec says it was resolved. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L895]] "the current hooks reference now states it"
- [[https://code.claude.com/docs/en/hooks.md]] "To inject context into the parent session after a subagent returns, use a"
- Timeouts: the spec names one lowered event. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L505]] "(lowered to 30s under"
- [[https://code.claude.com/docs/en/hooks.md]] "Claude Code lowers the command, http, and mcp_tool default to 30 on"
- Denied calls: [[https://code.claude.com/docs/en/hooks.md]] "Validation rejections are returned as tool_use_error results and happen before hooks run"
- Tested: a permission-rule Bash deny fires `PreToolUse` and the context arrives; an `Edit` path deny rule is rejected before hooks. [[middleware/context-oracle/docs/reviews/2026-09-28-branch-audit-hook-context-permission-denial.md@HEAD:L60]] "path deny rules are rejected before"
- Delivery timing, correctly stated already: [[https://code.claude.com/docs/en/hooks.md]] "Claude reads the reminder on the next model request"
**Standard:** CLAUDE.md: [[middleware/context-oracle/CLAUDE.md@ec3b057:L225-L227]] "the hooks contract has drifted before and will again"
**Reasoning:** (1) The model-sees-it-after-the-tool-call sentence, the PreToolUse deny with reason, the Stop two-channel description, `transcript_path` lag, the 8-cap and `last_assistant_message` all match the reference and stand. (2) Five statements do not: the "preserved" clause has no source; "so it avoids retrying" is no longer on the page; "only" three plain-stdout events is now four; "not documented and assumed not" contradicts §13 and the reference; the lowered-timeout list is incomplete (the omitted events are not ones the oracle wires, so only accuracy is at stake). (3) The tested permission-rule cases (Claude Code 2.1.283) belong here per the 2026-09-28 ruling. (4) With E-26, FR-O2 must also state that Stop `decision: "block"` is used for the answer-drift end-of-turn case.
**Alternatives:** Deleting the facts would leave C-4 empty; the fix is to state what the reference says now, with its date.
**Consequences:** C-4 (E-39), §9 HOOKS row (E-47), FR-A2d/AC-1c/§5.1 edit-timing lines (part a/c units; the branch-audit wording correction applies).
**Verdict:** replace — (a) delete "and that text is preserved even if the tool call later fails"; add "When another hook denies the call, or a permission rule denies a Bash call, the hook has run and its context reaches the model next to the denial; `Edit`/`Read` path deny rules are rejected before hooks run, so the oracle is not invoked (Claude Code 2.1.283, tested 2026-09-28)"; (b) "via plain stdout on `UserPromptSubmit`, `UserPromptExpansion`, `SessionStart` and `PostModelSwitch`"; (c) the deny reason is "shown to Claude" (no "avoids retrying" quotation); (d) "a subagent hook's context reaches the subagent, not the parent; a `PostToolUse` hook on the `Agent` tool injects into the parent (documented)"; (e) timeouts: "lowered to 30s on `UserPromptSubmit`, `PreModelSwitch` and `PostModelSwitch`"; (f) the Stop `decision: "block"` use for answer-drift per E-26; (g) re-date to the fetch date. Engineering wording of harness facts; to Max Cogar under M38.
**Would be wrong if:** The hooks reference at a newer fetch again contains the removed phrases (the check is dated; re-run it before editing).

### E-34
**Units:** SP-124-8-How-the-oracle-blocks-FR-O3
**Question:** FR-O3: any shim/service error, timeout or missing store yields silence and, on a block path, no deny. Is the fallback backed, and is it visible?
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L508-L509]] "Any shim/service error, timeout, or missing store yields silence"
- The stated backing is OL-3. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L508]] "Fail open, fast** `[OL-3]`"
- OL-3 was said about the generated-file block. [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L41]] "that he said this specifically to"
- OL-C7 forbids widening a specific owner statement. [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L73]] "my statements are getting overgenralized and turned into new project rules despite my comment being only about one specific thing within specific context"
- FR-M2's failure classes do not include a generic shim/service error or a missing store. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L265]] "hooks not firing, latency breaches, store"
- The branch audit measured a silent fail-open disabling the answer-drift deny. [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B3-verification.md@HEAD:L54-L55]] "silently turns the OL-C3 answer-drift deny off."
- The harness itself fails open for timeouts: [[https://code.claude.com/docs/en/hooks.md]] "A timed-out command, http, or mcp_tool hook doesn't block the tool call"
- and for exit 1: [[https://code.claude.com/docs/en/hooks.md]] "Without valid JSON on stdout, Claude Code treats exit code 1 as a non-blocking error and proceeds with the action"
- Fail fast: [[https://martinfowler.com/ieeeSoftware/failFast.pdf]] "Bugs are easier to find and fix, so fewer go into production."
**Standard:** Fail fast — fail immediately and visibly (Shore, IEEE Software 2004); BRIEF: a degraded mode is legitimate only when it is specified and visible; OL-C7.
**Reasoning:** (1) Toward the agent, failing open is correct and partly forced: the harness already lets a timed-out or exit-1 hook's call proceed, and a fail-closed deny on an oracle error would deny unrelated actions, violating FR-B2. (2) Toward the owner, the line hides the failure: none of "shim/service error" or "missing store" is an FR-M2 class, so the error is swallowed. (3) The branch audit found exactly this: a failed write silently switched the OL-C3 block off, and nothing reported it. (4) The `[OL-3]` tag stretches Max Cogar's statement about the generated-file block into a failure-handling rule — the overgeneralisation OL-C7 names. The real backing is the harness behaviour and FR-B2.
**Alternatives:** Fail-closed on block paths: denies compliant agents on every oracle fault and can deadlock; rejected. Fail-open silently: the current line; hides a disabled block. Fail-open for the agent plus a recorded, surfaced fault: keeps the agent unblocked and the owner informed.
**Consequences:** FR-M2 gains a class; AC-10 asserts the fault record; NF-1's `[OL-3]` tag has the same defect (E-41).
**Verdict:** replace — "FR-O3 — Fail open for the agent, visibly for the owner. Any shim/service error, timeout, or missing store yields silence and, on a block path, no deny, so the agent's action proceeds (the harness also proceeds on hook timeout or non-blocking exit). Every such event is recorded as a self-detected fault (FR-M2) naming the class and, for a block path, that the block was off for that event, and is counted in `status`. Backing: the hooks reference's timeout and exit-code rules, and FR-B2 (a deny targets only a deviating action)." Engineering; to Max Cogar under M38.
**Would be wrong if:** FR-M2 already recorded every handled error (it lists specific classes only).

### E-35
**Units:** SP-125-8-How-the-oracle-blocks
**Question:** The label introducing C-1…C-6 and NF-1 calls them "Constraints fixed by circumstance". Is that true of what follows?
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L512]] "**Constraints fixed by circumstance:**"
- C-1 says the opposite. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L514]] "Runtime: Node.js, current LTS (engineering choice `[D-33]`)."
- D-33: [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L825]] "Runtime is Node.js by engineering choice, not circumstance (C-1)."
- NF-1 is an engineering judgment. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L535]] "Latency (engineering judgment `[D-31]`)"
**Standard:** BRIEF criterion 6 (no conflict with other lines).
**Reasoning:** The label tells a reader these are forced by circumstance and not open to revisiting; C-1, NF-1 and C-6 are engineering choices by their own text, and C-3 is an owner decision. The label contradicts the items it heads.
**Alternatives:** Relabelling each item's kind at the item is already done; the header just has to stop contradicting them.
**Consequences:** None beyond the label.
**Verdict:** replace — "**Constraints and non-functional requirements** (each states whether it is an owner decision, an external fact, or an engineering judgment):". Engineering wording; to Max Cogar under M38.
**Would be wrong if:** "circumstance" were defined somewhere to include engineering choices (it is not).

### E-36
**Units:** SP-126-8-How-the-oracle-blocks-C-1
**Question:** C-1 chooses Node.js (current LTS) so the store can use in-runtime `node:sqlite` with no native toolchain and no prebuilt-binary download, and rejects Python and Rust for weaker store options. Is the choice backed?
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L517-L518]] "unflagged from **v22.13.0 / v23.4.0**"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L520]] "they are rejected for weaker cold-start/no-toolchain store options"
- D-33's other reason: [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L827]] "using the language the Claude Code tooling ecosystem already assumes"
- Python's standard library ships SQLite with FTS5, no toolchain. [[ran]] `python3 -c "import sys,sqlite3;c=sqlite3.connect(':memory:');c.execute('create virtual table t using fts5(x)');print(sys.version.split()[0], sqlite3.sqlite_version, 'fts5 ok')"` → `3.11.15 3.45.1 fts5 ok`
- Node 22.13–22.15 builds SQLite without FTS5; 22.16.0 is the first 22.x with it. [[ran]] `for t in v22.15.0 v22.16.0; do printf "%s " $t; curl -sS https://raw.githubusercontent.com/nodejs/node/$t/deps/sqlite/sqlite.gyp | grep -c "SQLITE_ENABLE_FTS5"; done` → `v22.15.0 0` / `v22.16.0 1`
- `node:sqlite` stability in 22.x: [[https://nodejs.org/api/sqlite.html]] "SQLite is no longer behind --experimental-sqlite but still experimental."
- The branch audit found costs downstream of the no-native-build constraint (WASM parser). [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B9-verification.md@HEAD:L85]] "Each throw leaks 864 bytes of wasm stack for the life of the process."
**Standard:** BRIEF test criteria 2–5: backing written, real, specific, and better than the alternatives; CLAUDE.md "Verify external facts".
**Reasoning:** (1) The only comparative reason given — Python has weaker no-toolchain store options — is contradicted by execution: stdlib `sqlite3` with FTS5, no build step. (2) The ecosystem reason is an assertion with no source; Claude Code hooks are language-agnostic, as C-1 itself says. (3) The version floor v22.13.0 does not deliver C-2's FTS5; 22.16.0 does. (4) `node:sqlite` is experimental in the 22.x line, a risk C-1 does not state. (5) So the choice has no surviving comparative backing. Choosing correctly needs a written comparison of runtimes against C-2/C-3 and the parser path (native tree-sitter bindings vs WASM, see E-38), which this audit cannot settle from sources alone.
**Alternatives:** Python (stdlib SQLite+FTS5; tree-sitter Python wheels), Node ≥ 22.16 with the native `tree-sitter` binding (prebuilds ship in the npm tarball, E-38), Node with WASM parser (current), Rust (single static binary). Not compared anywhere on the record.
**Consequences:** C-2 floor (E-37), §9 NODE-SQLITE row (E-48), C-3 (E-38), the whole Phase A build.
**Verdict:** undetermined — the line cannot stand as written (false comparison, wrong version floor, unstated experimental status), and the correct runtime choice needs a comparison nobody has made. What is missing: a written comparison of candidate runtimes against C-2, C-3 (once E-38 settles its meaning) and the parser's memory/robustness evidence. Engineering decision.
**Would be wrong if:** A recorded comparison exists that shows Python's store or parser path failing C-3 (none found in the spec, §12 or the reviews read).

### E-37
**Units:** SP-127-8-How-the-oracle-blocks-C-2
**Question:** C-2 says stock `node:sqlite` now ships FTS5, re-verified on the v22.x branch and Node v22.22.2.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L522]] "now ships FTS5"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L528-L529]] "which the built-in engine now does with zero dependencies"
- Branch head defines FTS5 (fetched): [[https://raw.githubusercontent.com/nodejs/node/v22.x/deps/sqlite/sqlite.gyp]] "SQLITE_ENABLE_FTS5"
- But not before 22.16.0: [[ran]] `for t in v22.15.0 v22.16.0; do printf "%s " $t; curl -sS https://raw.githubusercontent.com/nodejs/node/$t/deps/sqlite/sqlite.gyp | grep -c "SQLITE_ENABLE_FTS5"; done` → `v22.15.0 0` / `v22.16.0 1`
**Standard:** Primary source (Node source tree) and executed result.
**Reasoning:** (1) The requirement (fast lookup and text search within NF-1, mechanism the architect's, satisfying C-3) is sound. (2) The factual premise is true only from 22.16.0; C-1 permits 22.13.0, where FTS5 is absent. (3) "now ships" without a version leaves a build on 22.13–22.15 passing C-1 and failing C-2.
**Alternatives:** Feature-detect FTS5 at startup: needed anyway for fail-fast, but it is a check, not a substitute for stating the floor.
**Consequences:** C-1 (E-36), §9 (E-48), AC-20.
**Verdict:** replace — "C-2 — Full-text search: stock `node:sqlite` builds SQLite with FTS5 from Node v22.16.0 (22.x line; `deps/sqlite/sqlite.gyp`, checked per tag 2026-09-29); earlier 22.x releases lack it, so the runtime floor is v22.16.0 …" — the property sentence unchanged. Engineering fact; to Max Cogar under M38.
**Would be wrong if:** Node 22.13–22.15 enabled FTS5 by another route than `sqlite.gyp` defines (the amalgamation is compiled only with those defines).

### E-38
**Units:** SP-128-8-How-the-oracle-blocks-C-3
**Question:** C-3 turns OL-4 ("Sandbox compatibility is required") into: no native toolchain beyond the SQLite path, no prebuilt-binary download, no network beyond the harness's. Is the derivation shown, and is the constraint clear?
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L531]] "no prebuilt-binary download"
- OL-4 in full. [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L42]] "Sandbox compatibility is required."
- RETHINK's recorded rationale names the old sandbox build, not an environment. [[middleware/context-oracle/RETHINK.md@ec3b057:L337]] "The old sandbox build is archived as"
- The native tree-sitter binding ships its platform binaries inside the npm tarball (no separate download, no compiler). [[ran]] `npm pack tree-sitter --dry-run 2>&1 | grep prebuilds` → `prebuilds/linux-x64/tree-sitter.node` (and darwin-arm64, darwin-x64, linux-arm64, win32-arm64, win32-x64), version 0.25.1
- The constraint drove the WASM parser and its defects. [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B9-verification.md@HEAD:L79]] "Neither grammar can be an npm dependency: C-3 and AD-25 rule out"
- [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B9-verification.md@HEAD:L85]] "Each throw leaks 864 bytes of wasm stack for the life of the process."
**Standard:** SPEC-BRIEF: an owner decision is kept unless flawed; an unclear line is a flaw ("too unclear to act on without guessing").
**Reasoning:** (1) OL-4 does not say which sandbox or what it lacks; RETHINK ties the phrase to the archived "sandbox build". (2) C-3's three clauses are an agent's derivation with no written steps. (3) "No prebuilt-binary download" is ambiguous: a binary inside a registry package is fetched with the package; the clause has been read as forbidding it, which forced the WASM parser whose leak and grammar defects the branch audit recorded. (4) Whether bundled platform binaries are acceptable depends on what the owner's sandbox actually permits (registry reachable through the harness proxy — as in this session — or fully offline), which is Max Cogar's to state.
**Alternatives:** Reading C-3 as "no compile step, no fetch outside the package registry" allows bundled prebuilds; reading it as "pure JS/WASM only" forbids them. Both are defensible; only the owner's environment decides.
**Consequences:** C-1 (E-36), AC-20, the parser architecture.
**Verdict:** undetermined — **owner question for Max Cogar**: which environments "sandbox compatibility" means (e.g. Claude Code cloud sessions, a local sandboxed Bash, an offline machine), so C-3 can state what they lack. Missing: that answer; the tested fact that bundled prebuilds need neither a compiler nor a non-registry download is recorded above for it.
**Would be wrong if:** A ledger entry or owner message already defines the sandbox (none found in the ledger, RETHINK §12, or the owner-messages file).

### E-39
**Units:** SP-129-8-How-the-oracle-blocks-C-4
**Question:** C-4 makes the hooks contract a constraint: "the facts above (FR-O2), verified 2026-08-25".
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L533]] "the facts above (FR-O2), verified 2026-08-25"
- FR-O2 carries five statements that do not match the current reference (E-33), and was partly re-read 2026-09-26. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L485]] "(hooks reference re-read 2026-09-26)"
**Standard:** CLAUDE.md "Verify external facts … the hooks contract has drifted before and will again".
**Reasoning:** C-4 imports FR-O2 wholesale and pins a date that is both older than FR-O2's own latest re-read and before the drift found in E-33. The constraint itself is right; its date and content follow FR-O2's correction.
**Alternatives:** None.
**Consequences:** E-33.
**Verdict:** replace — "C-4 — Hooks contract `[HOOKS]` — the facts in FR-O2, as corrected, verified against the hooks reference on <fetch date>." Engineering; to Max Cogar under M38.
**Would be wrong if:** E-33's differences were not real (each is shown by a fetched quote or a failed quote match).

### E-40
**Units:** SP-130-8-How-the-oracle-blocks-C-5
**Question:** C-5: no MCP sampling (deprecated, SEP-2577).
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L534]] "No MCP sampling"
- [[https://modelcontextprotocol.io/specification/2026-07-28/client/sampling]] "The Sampling feature is deprecated as of protocol version 2026-07-28"
- [[https://modelcontextprotocol.io/specification/2026-07-28/client/sampling]] "New implementations SHOULD NOT adopt it"
**Standard:** MCP specification 2026-07-28, Sampling page.
**Reasoning:** The spec says new implementations should not adopt sampling; the oracle is a new implementation with another model path (host CLI, §10). The constraint is scoped and correctly sourced.
**Alternatives:** None; the MCP text rules sampling out.
**Consequences:** None.
**Verdict:** keep — verified against the MCP specification.
**Would be wrong if:** A later MCP revision un-deprecates sampling.

### E-41
**Units:** SP-131-8-How-the-oracle-blocks-NF-1
**Question:** NF-1 sets per-event latency (p95 ≤ 1.5s, ceiling 3s, then silence and carry to the next event), keeps model calls off the hook path, and tags fail-open as `[OL-3]`. Are the numbers and tags backed?
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L536]] "1.5s, hard ceiling 3s**, then silence and carry to the next event."
- D-31 gives no reason, only ownership. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L815]] "Latency numbers (1.5s/3s) are an engineering judgment"
- RETHINK's agent-written origin: [[middleware/context-oracle/RETHINK.md@ec3b057:L183]] "Answer within ~1–2s or stay silent this round"
- CLAUDE.md: [[middleware/context-oracle/CLAUDE.md@ec3b057:L223-L224]] "Numbers without sources don't go in."
- Fail-open tag: [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L539]] "the fail-open behaviour is `[OL-3]`"
- Harness default timeout far exceeds 3s, so the ceiling must be the oracle's own: [[https://code.claude.com/docs/en/hooks.md]] "Defaults: 600 for command, http, and mcp_tool"
- A human-factors reference exists for waiting: [[https://www.nngroup.com/articles/response-times-3-important-limits/]] "1.0 second is about the limit for the user's flow of thought to stay uninterrupted"
**Standard:** CLAUDE.md engineering standard (numbers need sources); BRIEF criterion 2; OL-C7 for the tag.
**Reasoning:** (1) Keeping model calls off the synchronous path follows from any seconds-scale bound and stands. (2) 1.5s/3s have no source: D-31 says only whose they are; RETHINK's ~1–2s is itself unsourced. (3) The obvious human-factors source (1.0 s flow limit) concerns a person waiting on an interface; here the added time is per tool call in an agent loop, and no source converts it into a per-event bound. (4) "carry to the next event" delivers a deterministic whisper late with no bound or re-check — the problem FR-J5 solves for model genres — and is unscoped. (5) `[OL-3]` has the defect found in E-34. (6) The correct numbers need a measured basis (hook latency distribution on the owner's repos; the overhead per session the owner accepts), which does not exist yet.
**Alternatives:** Derive the bound from a per-session overhead budget and measured tool-call counts; or from Phase A measurement with the owner's tolerance. Either needs data not yet collected.
**Consequences:** AC-10's thresholds; FR-O3 (E-34); FR-J5 would need to cover carried deterministic whispers.
**Verdict:** undetermined — known fixes: drop `[OL-3]` (cite FR-O3's corrected backing), bound "carry" by FR-J5's relevance/re-validation rule, state that the oracle enforces its own ceiling below the harness timeout. Missing: a source or measurement for the 1.5s/3s numbers. Engineering decision.
**Would be wrong if:** A written derivation of 1.5s/3s exists (none in §12, RETHINK or the reviews read).

### E-42
**Units:** SP-132-8-How-the-oracle-blocks-C-6
**Question:** C-6: language coverage is broad and extensible behind a language-agnostic interface, backed by `[OL-C1, D-15]`.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L543]] "a decision-changing fact is not English-only"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L544]] "a fixed cap is an arbitrary limit of the kind `[OL-C1]` bars"
- OL-C1 is about whether to speak. [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L67]] "Whether to speak is decided solely by whether the information is important"
- OL-C7: [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L73]] "my statements are getting overgenralized and turned into new project rules despite my comment being only about one specific thing within specific context"
- Max Cogar's actual words on languages: [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L83]] "probably more than just lik 3 of"
- Phase A runs on the owner's repositories. [[middleware/context-oracle/CLAUDE.md@ec3b057:L142]] "deterministic foundation, running on the owner's real repos"
**Standard:** OL-C7 (no widening of a specific owner statement); BRIEF criterion 4.
**Reasoning:** (1) OL-C1 was about budgets on speaking; using it to bar a language list is the overgeneralisation OL-C7 names. (2) "not English-only" confuses natural language with programming language. (3) The real inputs are Max Cogar's "probably more than just like 3" (a handed-over choice) and the mission. (4) "broad" gives no test; the one checkable requirement is that the oracle covers the languages in the repositories it runs on, which Phase A's goal already fixes.
**Alternatives:** Keeping "broad" leaves every builder to guess the set; a concrete criterion tied to the owner's repositories plus the extensible interface keeps the intent and becomes testable.
**Consequences:** D-15 wording; AC-17 ("broad set") gets the same criterion.
**Verdict:** replace — "C-6 — Language coverage is extensible and covers the owner's repositories `[D-15]`. The oracle reads languages behind a language-agnostic interface; adding one is configuration, not redesign. It must cover every language present in the repositories Phase A runs on, and is not capped at a short list — Max Cogar handed the choice to the agents with 'probably more than just like 3' (ledger note)." Engineering line; to Max Cogar under M38.
**Would be wrong if:** OL-C1 were confirmed by Max Cogar to cover language coverage (the ledger records it for speaking limits only).

### E-43
**Units:** SP-133-8-How-the-oracle-blocks
**Question:** Separator after §8.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L546]] "---"
**Standard:** SPEC-BRIEF rule 3.
**Reasoning:** Asserts nothing.
**Alternatives:** None.
**Consequences:** None.
**Verdict:** keep — asserts nothing.
**Would be wrong if:** Never.

### E-44
**Units:** SP-134-9-Standards-and-evidence
**Question:** Heading of §9.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L548]] "## 9. Standards and evidence base"
**Standard:** SPEC-BRIEF rule 3.
**Reasoning:** Names the section.
**Alternatives:** None.
**Consequences:** None.
**Verdict:** keep — heading.
**Would be wrong if:** Never.

### E-45
**Units:** SP-135-9-Standards-and-evidence
**Question:** §9's lead says every source was confirmed against its current primary source, with the date in the Verified column.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L550]] "Every source below was confirmed against its current primary/authoritative source"
- Rows that do not hold: HOOKS quotes a phrase no longer on the page (E-47); MSR's grounding source does not discuss merges (E-50); ASI06 names the wrong document (E-53); TRICORDER has the wrong author order (E-56); CHI has the wrong year (E-59); HERZIG governs a requirement it does not support (E-58). [[ran]] `python3 /tmp/claude-0/-home-user-agent-armory/779c0f74-86b0-5e8f-b02d-811e78ed3f66/scratchpad/audit/webquote.py https://code.claude.com/docs/en/hooks.md "so it avoids retrying"; echo $?` → `1`
**Standard:** BRIEF criterion 3 (backing is real: the source says what is claimed).
**Reasoning:** A blanket "every source confirmed" is false while any row misstates its source; the lead then lends every row a verification it did not get. After the row corrections the lead can state what was actually done.
**Alternatives:** Keeping the blanket claim; removing dates. Neither tells a reader what was checked.
**Consequences:** E-47–E-62.
**Verdict:** replace — "Each source below is listed with the passage that grounds its use and the date it was last fetched and matched; a row whose source changes must be re-fetched before a requirement relies on it. Where a citation grounds a design number rather than a hard requirement, that is noted at the requirement." Engineering; to Max Cogar under M38.
**Would be wrong if:** Every row matched its source (six do not, E-47–E-59).

### E-46
**Units:** SP-136-9-Standards-and-evidence
**Question:** §9 table header.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L554]] "| Key | Standard / source (as verified) | Governs | Verified |"
**Standard:** SPEC-BRIEF rule 3.
**Reasoning:** Column labels; no claim.
**Alternatives:** None.
**Consequences:** None.
**Verdict:** keep — table header.
**Would be wrong if:** Never.

### E-47
**Units:** SP-137-9-Standards-and-evidence-FR-B2
**Question:** The `[HOOKS]` row summarises the hooks contract the spec relies on.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L556]] "provided \"so it avoids retrying\""
- [[ran]] `python3 /tmp/claude-0/-home-user-agent-armory/779c0f74-86b0-5e8f-b02d-811e78ed3f66/scratchpad/audit/webquote.py https://code.claude.com/docs/en/hooks.md "so it avoids retrying"; echo $?` → `1`
- Correct parts confirmed: [[https://code.claude.com/docs/en/hooks.md]] "precedence is deny > defer > ask > allow"
- [[https://code.claude.com/docs/en/hooks.md]] "The transcript file is written asynchronously and may lag the in-memory conversation"
**Standard:** Primary source quotation (CLAUDE.md "Verify external facts").
**Reasoning:** The row's other facts match the current page (precedence, `additionalContext` optional, Stop channels, cap, `last_assistant_message`, lag, subagent fields, timeouts); the "avoids retrying" quotation does not, and the row should also carry the facts E-33 adds (PostModelSwitch stdout, subagent-to-parent documented, path-deny rules before hooks).
**Alternatives:** None.
**Consequences:** E-28, E-33.
**Verdict:** replace — drop the "so it avoids retrying" quotation (the deny reason is "shown to Claude"), add the E-33 facts, and re-date the row to its fetch. Engineering; to Max Cogar under M38.
**Would be wrong if:** The phrase reappears on the fetched page.

### E-48
**Units:** SP-138-9-Standards-and-evidence-C-1
**Question:** The `[NODE-SQLITE]` row: Node docs, #56951, FTS5 per `sqlite.gyp` on v22.x plus local execution.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L557]] "FTS5 state per `deps/sqlite/sqlite.gyp` (v22.x) + local execution"
- [[ran]] `for t in v22.15.0 v22.16.0; do printf "%s " $t; curl -sS https://raw.githubusercontent.com/nodejs/node/$t/deps/sqlite/sqlite.gyp | grep -c "SQLITE_ENABLE_FTS5"; done` → `v22.15.0 0` / `v22.16.0 1`
- [[https://nodejs.org/api/sqlite.html]] "SQLite is no longer behind --experimental-sqlite but still experimental."
**Standard:** Primary source (Node source and docs).
**Reasoning:** The row checks the branch head, which says nothing about which released versions have FTS5; the release floor (22.16.0) and the experimental status are the facts the requirements need.
**Alternatives:** None.
**Consequences:** E-36, E-37.
**Verdict:** replace — "Node `node:sqlite` docs (experimental in 22.x; release candidate from v25.7.0); FTS5 defined in `deps/sqlite/sqlite.gyp` from tag v22.16.0 (absent in v22.13.0–v22.15.0), checked per tag." Engineering; to Max Cogar under M38.
**Would be wrong if:** A 22.13–22.15 build had FTS5 (the build defines say no).

### E-49
**Units:** SP-139-9-Standards-and-evidence-FR-K2
**Question:** The `[ROSE]` row: Zimmermann et al., TSE 31(6) 2005, co-change incl. recency-weighted horizon.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L558]] "co-change / logical coupling, incl. recency-weighted horizon"
- [[https://thomas-zimmermann.com/publications/files/zimmermann-tse-2005.pdf]] "IEEE TRANSACTIONS ON SOFTWARE ENGINEERING, VOL. 31, NO. 6, JUNE 2005"
- [[https://thomas-zimmermann.com/publications/files/zimmermann-tse-2005.pdf]] "For projects that are frequently restructured, assigning a higher weight to recent changes can increase precision and recall."
**Standard:** Primary source (the paper).
**Reasoning:** Bibliographic data and both uses (co-change mining; recency weighting) are in the paper.
**Alternatives:** None.
**Consequences:** FR-K2 (E-73).
**Verdict:** keep — verified.
**Would be wrong if:** The cited passage were from a different paper (it is from the TSE 2005 PDF).

### E-50
**Units:** SP-140-9-Standards-and-evidence-FR-K2
**Question:** The `[MSR]` row: "exclude merge commits", grounded by HERZIG ("tangled/merge changes inject noise").
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L559]] "Mining-software-repositories practice — exclude merge commits (grounded by `[HERZIG]`: tangled/merge changes inject noise)"
- Herzig & Zeller's subject is tangled changes; the paper's only uses of "merge" are its own partition-merge algorithm (full-text search of the fetched PDF). [[https://www.st.cs.uni-saarland.de/publications/files/herzig-msr-2013.pdf]] "such tangled changes will make all changes to all modules appear related"
- ROSE does address merges. [[https://thomas-zimmermann.com/publications/files/zimmermann-tse-2005.pdf]] "In order to detect coupling within transactions, one must avoid the"
**Standard:** BRIEF criteria 3–4.
**Reasoning:** (1) "Mining-software-repositories practice" names no source. (2) HERZIG does not mention merge commits, so it does not ground merge exclusion. (3) ROSE states the merge problem (a merge re-presents a branch's changes as one large transaction) — a real source for the practice.
**Alternatives:** Keep the key but ground it in ROSE; or fold it into `[ROSE]`.
**Consequences:** FR-K2 (E-73), footer L1141-L1142 ("grounded via HERZIG").
**Verdict:** replace — "`[MSR]` Exclude merge commits: a merge re-presents its branch's changes as one large transaction (Zimmermann et al. TSE 2005 §3, 'one must avoid the large merge transactions'); the branch's own commits already carry those co-changes." Engineering; to Max Cogar under M38.
**Would be wrong if:** Herzig & Zeller discussed merge commits (the full text does not).

### E-51
**Units:** SP-141-9-Standards-and-evidence
**Question:** The `[LLM01]`/`[LLM02]` row: OWASP Top 10 for LLM Applications 2025.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L560]] "LLM01 Prompt Injection, LLM02 Sensitive Information Disclosure"
- [[https://genai.owasp.org/llmrisk/llm022025-sensitive-information-disclosure/]] "LLM02:2025 Sensitive Information Disclosure"
- [[https://genai.owasp.org/llmrisk/llm01-prompt-injection/]] "Indirect prompt injections occur when an LLM accepts input from external sources"
**Standard:** Primary source.
**Reasoning:** Both entries exist with those names and govern T1/T3 as the row says.
**Alternatives:** None.
**Consequences:** E-10 adds a separate `[LLM06]` row; this row is unchanged.
**Verdict:** keep — verified.
**Would be wrong if:** The entries were renumbered in the 2025 list (they are not).

### E-52
**Units:** SP-142-9-Standards-and-evidence
**Question:** The `[OWASP-PI]` row: the Prompt Injection Prevention Cheat Sheet, incl. indirect injection.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L561]] "OWASP LLM Prompt Injection Prevention Cheat Sheet"
- [[https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html]] "Code comments and documentation that AI coding assistants analyze"
**Standard:** Primary source.
**Reasoning:** The sheet exists and covers indirect injection, including repository text.
**Alternatives:** None.
**Consequences:** None.
**Verdict:** keep — verified.
**Would be wrong if:** Never, while the page stands.

### E-53
**Units:** SP-143-9-Standards-and-evidence
**Question:** The `[ASI06]` row attributes "ASI06 Memory & Context Poisoning" to "Agentic AI — Threats and Mitigations".
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L562]] "*Agentic AI — Threats and Mitigations* (`genai.owasp.org`) — ASI06 Memory & Context Poisoning"
- ASI06 is an entry of the Top 10 for Agentic Applications (Dec 2025), which OWASP announces as a distinct deliverable from its Threats and Mitigations work. [[https://genai.owasp.org/2025/12/09/owasp-top-10-for-agentic-applications-the-benchmark-for-agentic-security-in-the-age-of-autonomous-ai/]] "Memory poisoning reshaped behaviour long after the initial interaction"
- [[https://genai.owasp.org/2026/05/13/memory-is-a-feature-it-is-also-an-attack-surface/]] "memory should be treated as part of the attack surface"
**Standard:** Accurate citation (BRIEF criterion 3).
**Reasoning:** The ID and the concept are right; the document named is a different OWASP resource. A reader following the citation to "Threats and Mitigations" will not find "ASI06".
**Alternatives:** None.
**Consequences:** T2 (E-8) stays.
**Verdict:** replace — "`[ASI06]` OWASP Top 10 for Agentic Applications for 2026 (`genai.owasp.org`, December 2025) — ASI06 Memory & Context Poisoning". Engineering; to Max Cogar under M38.
**Would be wrong if:** The Threats and Mitigations document itself used the ASI06 numbering (the OWASP announcement presents the Top 10 as the ASI-numbered list).

### E-54
**Units:** SP-144-9-Standards-and-evidence
**Question:** The `[OWASP-SM]` row: Secrets Management Cheat Sheet — never store secrets in source; code is forked/cloned/backed up.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L563]] "OWASP Secrets Management Cheat Sheet"
- [[https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html]] "Many organizations have them hardcoded within the source code in plaintext"
- [[https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html]] "Forking should not leak"
**Standard:** Primary source.
**Reasoning:** The sheet exists and treats secrets in source and their leakage through copies as a problem; the row's summary is an unquoted paraphrase consistent with it, and it governs T3 appropriately.
**Alternatives:** None.
**Consequences:** E-12 also cites its §8.2.
**Verdict:** keep — verified.
**Would be wrong if:** The sheet did not address secrets in source (it does).

### E-55
**Units:** SP-145-9-Standards-and-evidence
**Question:** The `[RSSE]` row: Robillard, Maalej, Walker, Zimmermann (eds.), Springer 2014 — push vs pull recommenders; governs the genre set (§4).
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L564]] "push vs pull recommenders | Genre set (§4)"
- The book and its delivery chapter exist. [[https://link.springer.com/book/10.1007/978-3-642-45135-5]] "Recommendation Delivery Emerson Murphy-Hill, Gail C. Murphy Pages 223-242"
- §4 uses RSSE only for the delivery mode. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L158]] "push-mode recommendation surface `[RSSE]`"
**Standard:** BRIEF criterion 4 (backing supports this decision).
**Reasoning:** The book is real and has a delivery chapter; §4 cites it for "push-mode", not for which genres exist. The row's Governs column claims more (the genre set) than the book is used to back.
**Alternatives:** None.
**Consequences:** None.
**Verdict:** replace — Governs: "Push-mode delivery framing (§4); chapter 'Recommendation Delivery', Murphy-Hill & Murphy, pp. 223–242". Engineering; to Max Cogar under M38.
**Would be wrong if:** The book grounded the specific genre set (no genre-level claim is attributed to it anywhere in §4).

### E-56
**Units:** SP-146-9-Standards-and-evidence
**Question:** The `[TRICORDER]` row: Sadowski, van Gogh, Söderberg, Jaspan, Winter, ICSE 2015 — "NOT USEFUL" feedback, monitored false-positive rate.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L565]] "Sadowski, van Gogh, Söderberg, Jaspan, Winter"
- The paper's author order: [[https://static.googleusercontent.com/media/research.google.com/en//pubs/archive/43322.pdf]] "Caitlin Sadowski, Jeffrey van Gogh, Ciera Jaspan, Emma Söderberg, Collin Winter"
- Content confirmed: [[https://static.googleusercontent.com/media/research.google.com/en//pubs/archive/43322.pdf]] "We still enforce a very low effective false positive rate here"
**Standard:** Accurate citation.
**Reasoning:** Content matches; the author order is wrong (Jaspan precedes Söderberg).
**Alternatives:** None.
**Consequences:** None.
**Verdict:** replace — authors "Sadowski, van Gogh, Jaspan, Söderberg, Winter". Engineering; to Max Cogar under M38.
**Would be wrong if:** The published proceedings order differs from the Google-hosted PDF (not checked; ACM DL was not reachable).

### E-57
**Units:** SP-147-9-Standards-and-evidence
**Question:** The `[CACM]` row: Sadowski, Aftandilian, Eagle, Miller-Cushon, Jaspan, CACM 61(4) 2018 pp. 58–66 — feedback-driven, workflow-integrated.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L566]] "CACM 61(4) 2018 pp. 58–66"
- [[https://research.google/pubs/lessons-from-building-static-analysis-tools-at-google/]] "Communications of the ACM (CACM), 61 Issue 4 (2018), pp. 58-66"
- [[https://storage.googleapis.com/gweb-research2023-media/pubtools/4365.pdf]] "Careful developer workflow integration is key for static analysis tool adoption."
- [[https://storage.googleapis.com/gweb-research2023-media/pubtools/4365.pdf]] "The Tricorder team tracks such not-useful clicks"
**Standard:** Primary source.
**Reasoning:** Authors, venue, pages and both claimed lessons are confirmed.
**Alternatives:** None.
**Consequences:** FR-L3 (E-87) uses its channel-level demotion.
**Verdict:** keep — verified.
**Would be wrong if:** Never, while the source stands.

### E-58
**Units:** SP-148-9-Standards-and-evidence-FR-D3
**Question:** The `[HERZIG]` row: tangled commits inject noise; governs FR-D3 and FR-K2.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L567]] "FR-D3, FR-K2"
- FR-D3 is about stating evidence in warnings. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L192-L193]] "never a bare assertion `[HERZIG]` (illustrative rate, §9)"
- The paper's finding: [[https://www.st.cs.uni-saarland.de/publications/files/herzig-msr-2013.pdf]] "we found up to 15% of all bug fixes to consist of multiple tangled changes"
**Standard:** BRIEF criterion 4.
**Reasoning:** (1) Herzig & Zeller show tangled changes add noise to mined change data — a reason to distrust large mixed commits (FR-K2). (2) It says nothing about how a warning should present its evidence; FR-D3's rule is a presentation rule (JOHNSON's subject). (3) "illustrative rate" names no rate FR-D3 uses.
**Alternatives:** Cite `[JOHNSON]` for FR-D3's presentation rule (false positives and presentation are adoption barriers).
**Consequences:** FR-D3's tag (part a unit) and the §9 footnote (E-62).
**Verdict:** replace — Governs: "FR-K2 (tangled commits add noise to co-change data)". Engineering; to Max Cogar under M38.
**Would be wrong if:** The paper discussed warning presentation (it does not).

### E-59
**Units:** SP-149-9-Standards-and-evidence-FR-O5
**Question:** The `[CHI]` row: Iqbal & Bailey, CHI 2007 — interruption cost = resumption lag; subtask boundaries cost least; governs FR-O5.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L568]] "predict the cost of interruption*, CHI 2007"
- The paper is CHI 2006. [[https://experts.illinois.edu/en/publications/leveraging-characteristics-of-task-structure-to-predict-the-cost-/]] "Title of host publication CHI 2006"
- Its measure is human resumption lag. [[https://experts.illinois.edu/en/publications/leveraging-characteristics-of-task-structure-to-predict-the-cost-/]] "as objectively measured by resumption lag"
- FR-O5: [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L219]] "Task-boundary intervention only; no idle timers"
**Standard:** Accurate citation; BRIEF criterion 4.
**Reasoning:** (1) The year is wrong. (2) The finding is about human users' resumption lag; the whisper's reader is an LLM agent, which has no resumption lag, so the paper does not carry over as backing. (3) FR-O5 is backed directly by the mission: a whisper must arrive at the moment of a decision, and hook events are those moments; a timer fires at no decision.
**Alternatives:** Keep CHI as background only, with the mission as the backing.
**Consequences:** FR-O5's tag (part a unit).
**Verdict:** replace — "`[CHI]` Iqbal & Bailey, CHI 2006, pp. 741–750 — human interruption cost (resumption lag); background only" and FR-O5's backing stated as the mission ("at the moment of that decision"). Engineering; to Max Cogar under M38.
**Would be wrong if:** The oracle's whisper interrupted a human (it is injected into the agent's context).

### E-60
**Units:** SP-150-9-Standards-and-evidence-FR-D1
**Question:** The `[JOHNSON]` row: ICSE 2013 pp. 672–681 — false positives and warning presentation are adoption barriers; governs FR-D1.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L569]] "false positives & warning presentation are the adoption barriers"
- [[https://petertsehsun.github.io/soen7481/papers/icse13b.pdf]] "false positives and the way in which the warnings are presented, among other things, are barriers to use"
**Standard:** Primary source.
**Reasoning:** The paper says what the row claims. FR-D1's form rules (verifiable pointer, stated confidence) are presentation properties whose value does not depend on the reader being human (the owner also reads them via `log`); the citation supports them as presentation practice.
**Alternatives:** None better available.
**Consequences:** E-58 suggests JOHNSON also back FR-D3.
**Verdict:** keep — verified; supports FR-D1's presentation rules.
**Would be wrong if:** FR-D1 relied on a human-only effect (it does not).

### E-61
**Units:** SP-151-9-Standards-and-evidence-C-5
**Question:** The `[MCP-DEP]` row: SEP-2577, sampling deprecated, authors told to call the provider API directly.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L570]] "Sampling deprecated (annotation-only); authors told to call the provider API directly"
- [[https://modelcontextprotocol.io/specification/2026-07-28/client/sampling]] "existing implementations SHOULD migrate to integrating directly with LLM provider APIs"
**Standard:** Primary source.
**Reasoning:** Matches the MCP specification.
**Alternatives:** None.
**Consequences:** None.
**Verdict:** keep — verified.
**Would be wrong if:** Never, while the page stands.

### E-62
**Units:** SP-152-9-Standards-and-evidence
**Question:** The ROSE-figures paragraph reports ROSE's numbers and says illustrative numbers elsewhere (FR-D1 ~1–5 sentences, FR-K2 ~30 cap, FR-D3's rate) are grounded by the literature above.
**Facts:**
- ROSE's figures are right. [[https://thomas-zimmermann.com/publications/files/zimmermann-tse-2005.pdf]] "a support count of 1 and a confidence of 0.1 a feedback of 0.64 and a precision of 0.30"
- [[https://thomas-zimmermann.com/publications/files/zimmermann-tse-2005.pdf]] "ROSE’s topmost three suggestions contained a correct location with a likelihood of more than 70 percent"
- The cap is ROSE's, on entities. [[https://thomas-zimmermann.com/publications/files/zimmermann-tse-2005.pdf]] "ROSE does so by ignoring all changes that affect more than 30 entities"
- The paragraph's claim: [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L578]] "grounded by the literature above"
- FR-D1's 1–5 sentences come from RETHINK's agent-written delivery model, which cites nothing. [[middleware/context-oracle/RETHINK.md@ec3b057:L182]] "A hook that slows the agent is a gate by another name."
**Standard:** CLAUDE.md "Numbers without sources don't go in"; BRIEF criterion 3.
**Reasoning:** (1) The ROSE figures and "no fixed operating point" are correct. (2) "~30" is ROSE's (but for entities within CVS transactions, E-73). (3) No source in §9 gives 1–5 sentences. (4) "FR-D3's rate" names no rate (E-58). So "grounded by the literature above" is false for two of three.
**Alternatives:** Remove the unsourced number from FR-D1 ("a few sentences") or back it with a D-n judgment and reasoning.
**Consequences:** FR-D1 and FR-D3 (part a units).
**Verdict:** replace — "Illustrative numbers elsewhere: FR-K2's ~30 cap follows ROSE (30 entities per transaction; the git file-level value is set on Phase A data). FR-D1 states no sentence count; FR-D3 names no rate." Engineering; to Max Cogar under M38.
**Would be wrong if:** A §9 source gave a sentence count for recommendations (none does).

### E-63
**Units:** SP-153-9-Standards-and-evidence
**Question:** Separator after §9.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L580]] "---"
**Standard:** SPEC-BRIEF rule 3.
**Reasoning:** Asserts nothing.
**Alternatives:** None.
**Consequences:** None.
**Verdict:** keep — asserts nothing.
**Would be wrong if:** Never.

### E-64
**Units:** SP-154-10-External-interfaces
**Question:** Heading of §10.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L582]] "## 10. External interfaces"
**Standard:** SPEC-BRIEF rule 3.
**Reasoning:** Names the section.
**Alternatives:** None.
**Consequences:** None.
**Verdict:** keep — heading.
**Would be wrong if:** Never.

### E-65
**Units:** SP-155-10-External-interfaces-C-4
**Question:** Hooks (consumed): shims carry no decision logic and relay the service's output, including the `PreToolUse` deny and a single Stop-time continuation for the completion-check whisper.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L586]] "and a single Stop-time continuation for the completion-check whisper (FR-B4)"
- E-26 adds a Stop block for answer-drift. [[https://code.claude.com/docs/en/hooks.md]] "Prevents Claude from stopping, continues the conversation"
**Standard:** Consistency with FR-B1 as corrected (E-26/E-27).
**Reasoning:** The shim/relay split is sound. The list of relayed outputs omits the answer-drift Stop block that E-26 establishes.
**Alternatives:** None.
**Consequences:** E-26.
**Verdict:** replace — "… including a `PreToolUse` `permissionDecision: "deny"` on a block (FR-B1), a `Stop` `decision: "block"` for the answer-drift end-of-turn case (FR-B1), and a single Stop-time continuation for the completion-check whisper (FR-B4)." Engineering; to Max Cogar under M38.
**Would be wrong if:** E-26 is rejected.

### E-66
**Units:** SP-156-10-External-interfaces
**Question:** CLI (produced): at minimum `init` (the only repo-tree write), `deinit`, `index`, `status`, `log`, `correct`/`note`.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L587-L588]] "(the only repo-tree write)"
- `deinit` changes the tree. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L1019-L1020]] "differs only by the removed hook wiring"
**Standard:** BRIEF criterion 6.
**Reasoning:** Same conflict as E-16: removing the wiring is a write to the tree.
**Alternatives:** None.
**Consequences:** E-16.
**Verdict:** replace — "`init` and `deinit` (the only repo-tree writes: installing and removing the hook wiring), `index`, `status` (FR-M4), `log` (FR-M5), and a `correct`/`note` verb (FR-D4, FR-L6)." Engineering; to Max Cogar under M38.
**Would be wrong if:** `deinit` left the tree untouched (AC-7 says it does not).

### E-67
**Units:** SP-157-10-External-interfaces
**Question:** Stores (produced): "two SQLite stores outside the repo tree".
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L590]] "two SQLite stores outside the repo tree"
- The spec reserves storage engines to the architect. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L16]] "Component boundaries, storage engines, IPC, algorithms"
- and C-1 leaves the runtime open. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L520-L521]] "architect may choose another runtime that meets C-2/C-3"
**Standard:** BRIEF criterion 6.
**Reasoning:** §10 fixes the engine that the spec's own preamble and C-1 leave open; with C-1 undetermined (E-36) the engine must not be fixed here.
**Alternatives:** None.
**Consequences:** E-36.
**Verdict:** replace — "two stores outside the repo tree; engine per C-1/C-2; schema the architect's within FR-K* (§11)." Engineering; to Max Cogar under M38.
**Would be wrong if:** SQLite were an owner decision (no ledger entry says so).

### E-68
**Units:** SP-158-10-External-interfaces
**Question:** Model access (consumed): a one-shot, tool-disallowed call over the host CLI's own access, no separate credentials; flags illustrative.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L597]] "the piggyback-with-no-credentials property is"
- OL-7 [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L45]] "No separate credentials, ever."
- Hooks run inside `claude -p` sessions (hence FR-J4). [[middleware/context-oracle/docs/reviews/2026-09-28-branch-audit-hook-context-permission-denial.md@HEAD:L28]] "All runs used Claude Code 2.1.283, `claude -p`, in a throwaway `/tmp`"
- Least privilege for the model: [[https://genai.owasp.org/llmrisk/llm062025-excessive-agency/]] "Minimize extension permissions"
**Standard:** OL-2/OL-7 (owner); OWASP LLM06 least functionality.
**Reasoning:** The requirement is the owner's property (no credentials), and "tool-disallowed, one-shot" limits what an injected model call can do (LLM06). Invocation details are left to the architect. No conflict.
**Alternatives:** Agent SDK — also piggybacks, left open as the illustrative text says.
**Consequences:** FR-J4 recursion guard; FR-X1 redaction of the prompt (E-12).
**Verdict:** keep — owner property plus least-functionality engineering.
**Would be wrong if:** Non-interactive `claude -p` needed credentials of its own (the 2026-09-28 hook tests ran it in `/tmp`).

### E-69
**Units:** SP-159-10-External-interfaces
**Question:** Separator after §10.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L599]] "---"
**Standard:** SPEC-BRIEF rule 3.
**Reasoning:** Asserts nothing.
**Alternatives:** None.
**Consequences:** None.
**Verdict:** keep — asserts nothing.
**Would be wrong if:** Never.

### E-70
**Units:** SP-160-11-Stores-learning-and-b
**Question:** Heading of §11.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L601]] "## 11. Stores, learning, and build order"
**Standard:** SPEC-BRIEF rule 3.
**Reasoning:** Names the section.
**Alternatives:** None.
**Consequences:** None.
**Verdict:** keep — heading.
**Would be wrong if:** Never.

### E-71
**Units:** SP-161-11-1-Stores-index-miner
**Question:** Heading of §11.1.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L603]] "### 11.1 Stores, index, miner"
**Standard:** SPEC-BRIEF rule 3.
**Reasoning:** Names the subsection.
**Alternatives:** None.
**Consequences:** None.
**Verdict:** keep — heading.
**Would be wrong if:** Never.

### E-72
**Units:** SP-162-11-1-Stores-index-miner-FR-K1
**Question:** FR-K1: a structural index of symbols/definitions/locations, incrementally refreshable, serving §4/§5 within NF-1.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L605-L606]] "of symbols/definitions/locations, incrementally refreshable"
- Genres that need it: [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L167]] "the canonical helper is"
**Standard:** Derivation from the genre requirements (FR-A2a/c/d need symbols, definitions and call sites) and NF-1.
**Reasoning:** Reuse, orientation and consequence whispers need a lookup of symbols and locations; a full rebuild per event cannot meet any per-event bound, so incremental refresh follows. The line states a property and leaves the mechanism open.
**Alternatives:** None.
**Consequences:** NF-1 (E-41) sets the bound it must meet.
**Verdict:** keep — derived from the genre set and latency property.
**Would be wrong if:** No genre used symbol data (FR-A2c does).

### E-73
**Units:** SP-163-11-1-Stores-index-miner-FR-K2
**Question:** FR-K2: the co-change miner excludes merge commits `[MSR]`, caps very large transactions (~30, `[ROSE]`), over a recency-weighted horizon `[ROSE]`.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L607]] "excluding merge commits `[MSR]`"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L608]] "transactions (illustrative ~30, tunable `[ROSE]`)"
- ROSE's cap is on entities, and exists to drop CVS merge transactions. [[https://thomas-zimmermann.com/publications/files/zimmermann-tse-2005.pdf]] "ROSE does so by ignoring all changes that affect more than 30 entities"
- Tangled commits add noise. [[https://www.st.cs.uni-saarland.de/publications/files/herzig-msr-2013.pdf]] "such tangled changes will make all changes to all modules appear related"
- Recency: [[https://thomas-zimmermann.com/publications/files/zimmermann-tse-2005.pdf]] "For projects that are frequently restructured, assigning a higher weight to recent changes can increase precision and recall."
**Standard:** ROSE (TSE 2005); Herzig & Zeller (MSR 2013).
**Reasoning:** (1) The three mechanisms are right. (2) The merge exclusion cites `[MSR]`, whose grounding is wrong (E-50). (3) ROSE's 30 counts fine-grained entities in CVS and was a merge filter; applied to git files with merges already excluded, the reason for a size cap is tangled-change noise (Herzig), and the value is not transferable, so "~30" must be labelled as ROSE's entity value, not a file count.
**Alternatives:** None better; the mechanisms stand.
**Consequences:** AC-13 (">~30-entity") wording.
**Verdict:** replace — "FR-K2 — Co-change miner excluding merge commits `[ROSE]` (a merge re-presents its branch's changes), capping very large transactions against tangled-change noise `[HERZIG]` (ROSE used 30 entities; the git file-level cap is set on Phase A data), over a configurable recency-weighted horizon `[ROSE]`." Engineering; to Max Cogar under M38.
**Would be wrong if:** ROSE's 30 were a file count (the paper says entities).

### E-74
**Units:** SP-164-11-1-Stores-index-miner-FR-K3
**Question:** FR-K3–K5: fact schemas (exemplar, landmine, invariant, recipe) are pointers to real code with provenance `[ASI06]`.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L610]] "(exemplar, landmine, invariant, recipe)"
- The kinds come from RETHINK's store model. [[middleware/context-oracle/RETHINK.md@ec3b057:L344]] "co-change graph, exemplars, landmines, invariants, task recipes"
- ASI06: [[https://genai.owasp.org/2026/05/13/memory-is-a-feature-it-is-also-an-attack-surface/]] "attacker-controlled content poisoning memory and context that the system continues to trust over time"
**Standard:** OWASP ASI06; P4 provenance.
**Reasoning:** Requiring every stored fact to be a pointer to real code with provenance keeps facts checkable (FR-D1) and limits what a poisoned record can carry (T2). The kinds map to genres: exemplar → Reuse, landmine → Warning, invariant → Orientation/Warning, recipe (task-shape → files) → Orientation entry points. The schemas' shape is the architect's.
**Alternatives:** None.
**Consequences:** FR-K6.
**Verdict:** keep — backed by ASI06 and P4; each kind has a consuming genre.
**Would be wrong if:** A kind had no consuming genre (each maps to one above).

### E-75
**Units:** SP-165-11-1-Stores-index-miner-FR-K6
**Question:** FR-K6: provenance and trust on every record.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L612]] "Provenance + trust on every record"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L314-L315]] "a trust label rides every fact; low trust lowers confidence and cannot be laundered"
**Standard:** FR-X4 / OWASP ASI06 (E-15).
**Reasoning:** The storage-side statement of FR-X4; consistent and backed by the same source.
**Alternatives:** None.
**Consequences:** None.
**Verdict:** keep — storage counterpart of FR-X4.
**Would be wrong if:** FR-X4 were withdrawn.

### E-76
**Units:** SP-166-11-1-Stores-index-miner-FR-K7
**Question:** FR-K7: staleness lowers confidence, never blocks, citing OL-C1.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L613-L614]] "Staleness lowers confidence, never blocks"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L614]] "block conditions) `[OL-C1]`"
- FR-D1's rumor rule: [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L187-L188]] "An uncheckable whisper is a rumor and is not emitted"
- FR-J5 re-resolves pointers only for model genres. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L635]] "is re-resolved against current repo state"
- OL-C1 is about limits on speaking. [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L67]] "Whether to speak is decided solely by whether the information is important"
**Standard:** FR-D1 (no uncheckable whisper); BRIEF criteria 4 and 6.
**Reasoning:** (1) A stale fact can point at lines that no longer say what the fact claims. (2) Lowering its confidence still emits a pointer that fails — the "checkably-false whisper" FR-J5 calls the worst output; FR-J5 guards only the async path. (3) So "lowers confidence" is right only when the pointer still resolves. (4) "never blocks" is true, but its backing is FR-B1's closed list of block conditions, not OL-C1.
**Alternatives:** Dropping every stale fact loses good facts in unchanged regions; re-resolving the pointer first keeps them and drops only the false ones.
**Consequences:** AC-13's stale-fact clause.
**Verdict:** replace — "FR-K7 — A stale fact's pointer is re-resolved against current repo state before delivery (FR-D1); if it no longer holds the fact is dropped, otherwise staleness lowers its confidence. Staleness is never a block condition (FR-B1)." Engineering; to Max Cogar under M38.
**Would be wrong if:** Every pointer were re-resolved at delivery by some other requirement (only FR-J5 does, for model genres).

### E-77
**Units:** SP-167-11-1-Stores-index-miner-FR-K8
**Question:** FR-K8: two stores, outside the tree `[OL-6]`. Do stores outside the tree persist where the oracle is required to run?
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L615]] "Two stores, outside the tree"
- OL-6: [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L44]] "both outside the repo tree; solo scope, no team sharing"
- The oracle must work in cold containers. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L530]] "Cold-container / sandbox readiness"
- This project's sessions run in ephemeral containers. [[middleware/context-oracle/CLAUDE.md@ec3b057:L243-L244]] "everything committed and pushed (containers are ephemeral)"
- The global store holds what must accumulate. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L673]] "repo facts → project store; efficacy → global store"
- FR-K9 rules out network sync. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L616]] "no network sync `[OL-6]`"
**Standard:** SPEC-BRIEF: an owner decision with a flaw goes to Max Cogar with the evidence; CLAUDE.md rule 3 (no output that looks more complete than it is).
**Reasoning:** (1) In an ephemeral container, a store outside the repository tree is deleted with the container. (2) The only paths out are the repository (forbidden, OL-6/D-9) and the network (forbidden, FR-K9). (3) So in such sessions every run starts with empty stores: mining redone, owner corrections (FR-L6) and efficacy statistics (FR-L7) lost, demotion/promotion (P7) never accumulating — while `status` would look healthy. (4) On a persistent local machine the design works. (5) Which environments the owner runs agents in, and which persistence path he accepts, are his calls; the correct line cannot be written without them.
**Alternatives:** (a) Accept per-container stores and say so in `status`; (b) persist to a location outside the repository that survives (e.g. a private repository or storage the owner designates — needs network, relaxing FR-K9); (c) persist inside a git-ignored directory of the repository — relaxes OL-6/D-9. Each changes an owner decision.
**Consequences:** FR-K9 (E-78), FR-L6/FR-L7, P7, C-3.
**Verdict:** undetermined — **owner question for Max Cogar**: in which environments he runs agents with the oracle (local machine, Claude Code cloud sessions, both), and, for ephemeral ones, whether the oracle may keep its stores somewhere that survives the container. Missing: that answer.
**Would be wrong if:** The owner runs the oracle only on persistent machines (then FR-K8 stands as written).

### E-78
**Units:** SP-168-11-1-Stores-index-miner-FR-K9
**Question:** FR-K9: export/import round-trip; no network sync `[OL-6]`. What job does it serve?
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L616]] "Export/import round-trip"
- The only tag is OL-6, which is about location and team sharing. [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L44]] "both outside the repo tree; solo scope, no team sharing"
- No §12 judgment states why export/import is required (§12 read in full).
**Standard:** CLAUDE.md dominating rule 2 (every load-bearing decision states its job in mission terms).
**Reasoning:** (1) "no network sync" follows from OL-6/OL-7. (2) The export/import requirement itself has no stated job. (3) Its only plausible job — carrying stores across machines or containers — is exactly the open question of E-77. Until that is answered its job, and hence its correct form, cannot be written.
**Alternatives:** Remove it (if the owner runs only persistent machines) or make it the persistence path of E-77 (b).
**Consequences:** E-77; AC-19.
**Verdict:** undetermined — depends on the E-77 owner answer; missing: the requirement's job.
**Would be wrong if:** A written job for export/import exists (none found in §12, RETHINK §12 or the ledger).

### E-79
**Units:** SP-169-11-2-Model-judgment-and
**Question:** Heading of §11.2.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L618]] "### 11.2 Model judgment and degraded mode"
**Standard:** SPEC-BRIEF rule 3.
**Reasoning:** Names the subsection.
**Alternatives:** None.
**Consequences:** None.
**Verdict:** keep — heading.
**Would be wrong if:** Never.

### E-80
**Units:** SP-170-11-2-Model-judgment-and-FR-J1
**Question:** FR-J1: deterministic candidate generation (always available), then model judgment for model-dependent genres.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L620-L621]] "deterministic candidate generation (always available)"
- OL-2: [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L40]] "a deterministic degraded mode is mandatory for air-gap"
**Standard:** OL-2 (owner) and NF-1's off-path rule.
**Reasoning:** Candidates must exist without the model (OL-2 degraded mode), and model calls cannot sit on the hook path (NF-1), so a deterministic first stage feeding an optional model stage is the direct consequence.
**Alternatives:** Model-only generation fails OL-2.
**Consequences:** FR-X2 covers the model stage's inputs (E-13).
**Verdict:** keep — derived from OL-2 and NF-1.
**Would be wrong if:** OL-2 were withdrawn.

### E-81
**Units:** SP-171-11-2-Model-judgment-and-FR-J2
**Question:** FR-J2: degraded mode deterministic, mandatory, automatic on piggyback failure.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L622]] "Degraded mode deterministic, mandatory, automatic"
- [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L40]] "a deterministic degraded mode is mandatory for air-gap"
- It is visible: FR-M2 lists the model path. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L266]] "model path down"
**Standard:** OL-2 (owner); BRIEF: a degraded mode is legitimate when required, specified and visible.
**Reasoning:** The one degraded mode the spec requires; it is specified (deterministic genres keep running), automatic, and surfaced as an FR-M2 class.
**Alternatives:** None.
**Consequences:** AC-12.
**Verdict:** keep — owner requirement, visible.
**Would be wrong if:** "model path down" were removed from FR-M2.

### E-82
**Units:** SP-172-11-2-Model-judgment-and-FR-J3
**Question:** FR-J3: degraded mode is a runtime fallback, not a build stage `[D-21]`.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L624]] "Degraded mode is a runtime fallback, not a build stage"
- D-21 restates it without a reason. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L807]] "Degraded mode separated from build phase"
- OL-2's words make it a runtime condition. [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L40]] "a deterministic degraded mode is mandatory for air-gap"
**Standard:** OL-2 (owner).
**Reasoning:** Air-gap is a condition the tool meets at run time in any phase; so degraded mode cannot be identified with Phase A (which has no model yet by build order). The line's backing is OL-2's wording even though D-21 gives none; the line itself is correct and scoped.
**Alternatives:** None.
**Consequences:** None.
**Verdict:** keep — follows from OL-2's "for air-gap".
**Would be wrong if:** OL-2 meant degraded mode only as an interim build state (its text says air-gap).

### E-83
**Units:** SP-173-11-2-Model-judgment-and-FR-J4
**Question:** FR-J4: recursion guard (property) `[D-6]`.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L625]] "Recursion guard (property)"
- Hooks run in `claude -p` sessions. [[middleware/context-oracle/docs/reviews/2026-09-28-branch-audit-hook-context-permission-denial.md@HEAD:L28]] "All runs used Claude Code 2.1.283, `claude -p`, in a throwaway `/tmp`"
- AC-21 states the property. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L1099]] "self-trigger terminates at the guard"
**Standard:** Executed evidence that hooks fire in headless runs.
**Reasoning:** The oracle's model call is a `claude -p` run; hooks fire there, so without a guard each model call can invoke the oracle again. The requirement is necessary and stated as a property; AC-21 gives its test.
**Alternatives:** None.
**Consequences:** None.
**Verdict:** keep — necessary, evidenced.
**Would be wrong if:** Headless runs did not load hooks (the 2026-09-28 tests show they do).

### E-84
**Units:** SP-174-11-2-Model-judgment-and-FR-J5
**Question:** FR-J5: off-path model whispers are held only until the next relevant event, dropped at consumer termination, and re-validated against current repo state at delivery.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L631]] "termination (session/subagent end)"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L635]] "is re-resolved against current repo state"
- D-37: [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L852-L853]] "deliver at the next relevant decision event or drop"
**Standard:** The mission ("at the moment of that decision") and FR-D1's rumor rule; D-37's written reasoning.
**Reasoning:** Both halves are derived in the line: a bound so a late whisper does not arrive after its decision, and re-validation so a whisper's pointer is still true. The mechanism is left to the architect; existence is required. No conflict.
**Alternatives:** Unbounded holding would deliver post-hoc; no re-validation would ship false pointers.
**Consequences:** E-76 extends the same re-validation to stale sync facts.
**Verdict:** keep — mission-derived with reasoning in D-37.
**Would be wrong if:** Model whispers could be computed within the hook path (NF-1 says not).

### E-85
**Units:** SP-175-11-3-Learning-loop-de-no
**Question:** Heading of §11.3.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L644]] "### 11.3 Learning loop — de-noise in both directions"
**Standard:** SPEC-BRIEF rule 3.
**Reasoning:** Names the subsection and its two-direction principle, which FR-L3/FR-L3b state.
**Alternatives:** None.
**Consequences:** None.
**Verdict:** keep — heading.
**Would be wrong if:** Never.

### E-86
**Units:** SP-176-11-3-Learning-loop-de-no-FR-L1
**Question:** FR-L1: a per-event session log with candidates, whisper/block and uptake evidence; no automated uptake judgment in Phase A `[D-12]`.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L647]] "automated uptake judgment in Phase A"
- D-12 restates without a reason. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L797]] "Phase A logs uptake but makes no automated uptake judgment"
- Phase A already judges incorporation automatically for dedup. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L198]] "told or has visibly incorporated (FR-A4)"
- Industry practice measures false positives by the consumer's action. [[https://storage.googleapis.com/gweb-research2023-media/pubtools/4365.pdf]] "if developers did not take positive action after seeing the issue"
**Standard:** CLAUDE.md: every non-trivial requirement carries a source or a D-n with reasoning; BRIEF criterion 6.
**Reasoning:** (1) "no automated uptake judgment" collides with FR-D5/FR-A4, which decide automatically whether a consumer "visibly incorporated" a whisper (opened the pointed file) — an uptake determination in Phase A. (2) D-12 gives no reason, so the line's scope cannot be read from its backing. (3) The distinction the spec needs is between a deterministic observation (did the agent open the pointer, run the named test — CACM's "positive action") and a causal judgment that the whisper changed the decision, which is comprehension and Phase B. (4) Stated that way the line is consistent and backed.
**Alternatives:** Forbidding all automated uptake signals would contradict FR-D5 and remove the one Phase-A precision signal that does not depend on the owner (see E-90).
**Consequences:** FR-L6 (E-90), FR-M4 (E-1). FR-M1 and FR-L1 describe overlapping per-event logs; one log may serve both (architect's).
**Verdict:** replace — "FR-L1 — Session log per event: candidates, whisper/block, and uptake evidence — the deterministic observations of what the consumer did next (opened the pointer, ran the named test, edited the named partner), the same observations FR-A4/FR-D5 use. Phase A makes no causal judgment that a whisper changed a decision; that is a comprehension judgment (Phase B) `[D-12]`", with D-12 given that reasoning. Engineering; to Max Cogar under M38.
**Would be wrong if:** D-12's "uptake judgment" were defined elsewhere to exclude FR-A4 incorporation (no definition found).

### E-87
**Units:** SP-177-11-3-Learning-loop-de-no-FR-L3
**Question:** FR-L3: demotion of measured false-firers `[TRICORDER, CACM]`; "never silences a correct whisper" `[OL-C1, P7]`.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L648-L649]] "never silences a correct whisper"
- The cited practice demotes at channel level. [[https://storage.googleapis.com/gweb-research2023-media/pubtools/4365.pdf]] "If the ratio for an analyzer goes above 10%, the Tricorder team disables the analyzer until the author(s) improve it."
- FR-L4 counts below-bar held facts the oracle did not speak as regret. [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L655]] "(below-bar, or never triggered)"
**Standard:** The cited sources (CACM); BRIEF criterion 6.
**Reasoning:** (1) Demotion raises the bar for a channel that measures as a false-firer; the correct whispers in that channel then fall below the bar — the cited practice disables a whole analyzer. (2) FR-L4 exists precisely to measure those unspoken correct facts, and FR-L3b to recover the channel. (3) "never silences a correct whisper" is therefore impossible for any demotion and contradicts FR-L4; the property the spec can guarantee is that such silencing is measured and recovered.
**Alternatives:** Per-whisper demotion only (no channel demotion) would not reduce noise from a systematically weak channel.
**Consequences:** FR-L3b, FR-L4, P7.
**Verdict:** replace — "FR-L3 — Demotion of measured false-firers `[TRICORDER, CACM]`. The correct whispers a demotion silences are counted as regret (FR-L4) and recovered by re-exploration (FR-L3b); demotion acts only on measured false-fire, never on volume `[OL-C1, P7]`." Engineering; to Max Cogar under M38.
**Would be wrong if:** Demotion could target only false whispers without affecting correct ones in the same channel (the bar is per candidate, not per truth).

### E-88
**Units:** SP-178-11-3-Learning-loop-de-no-FR-L3b
**Question:** FR-L3b: suppressed channels are periodically re-admitted and re-promoted when earned, so the loop cannot converge to silence `[D-25]`.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L651]] "channel is periodically re-admitted to re-measure value and re-promoted when earned"
- The recorded lesson: [[middleware/context-oracle/docs/collapse-log.md@ec3b057:L202-L205]] "any de-noising loop needs an explicit up-signal (re-explore /"
**Standard:** The project's recorded collapse (a demote-only loop converged to silence while measuring healthy) and P7.
**Reasoning:** Without re-admission a demoted channel produces no new measurements and can never recover; the collapse-log records that this happened in an earlier version. The line is a property with its test (AC-16).
**Alternatives:** None that avoid the ratchet.
**Consequences:** AC-16.
**Verdict:** keep — backed by the recorded failure and P7.
**Would be wrong if:** Demoted channels still produced measurements (they are suppressed).

### E-89
**Units:** SP-179-11-3-Learning-loop-de-no-FR-L4
**Question:** FR-L4: estimate regret — held facts that would have changed a decision and went unspoken — with a scoped proxy; a diagnostic, not a gate `[D-36]`.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L662]] "A concrete proxy exists"
- D-36's reasoning: [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L847-L848]] "so the tool cannot converge to silence and still read as healthy"
- Mission: [[middleware/context-oracle/CLAUDE.md@ec3b057:L275]] "Deliver the fact that would change the agent's next decision"
**Standard:** The mission and D-36's written derivation.
**Reasoning:** The line derives the need from the mission, labels itself as an agent judgment, scopes regret to held facts, names the coverage gap it cannot see and routes that to AC-18, and states the proxy's error posture. Consistent with FR-M4 and AC-24.
**Alternatives:** Measuring only false speech ratchets to silence (E-88).
**Consequences:** FR-M4 label (E-1 keeps it).
**Verdict:** keep — mission-derived, scoped, reasoning in D-36.
**Would be wrong if:** The proxy's inputs (re-edits, reverts, test failures) were not observable to the oracle (the miner and hooks observe them).

### E-90
**Units:** SP-180-11-3-Learning-loop-de-no-FR-L6
**Question:** FR-L6: human statements are first-class facts; a CLI correction outranks mined inference and is Phase A's calibration signal.
**Facts:**
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L672]] "mined inference and is Phase A's calibration signal (§5.2)"
- Whispers are not shown in the interface. [[https://code.claude.com/docs/en/hooks.md]] "but it doesn't appear as a chat message in the interface"
- The owner is a non-programmer by design. [[middleware/context-oracle/OWNER-LEDGER.md@ec3b057:L49]] "You are a non-programmer by design."
- The standard practice measures false positives by the consumer's action. [[https://storage.googleapis.com/gweb-research2023-media/pubtools/4365.pdf]] "if developers did not take positive action after seeing the issue"
- CLAUDE.md: [[middleware/context-oracle/CLAUDE.md@ec3b057:L104]] "The owner cannot catch your mistakes."
**Standard:** OL-11 (owner); CLAUDE.md rule 1; CACM's effective-false-positive practice.
**Reasoning:** (1) That a human correction outranks mined inference is sound and stays. (2) Making it Phase A's calibration signal assumes a human who sees whispers and can judge code facts; the whispers go to the agent, not the interface, and the owner is a non-programmer, so most whispers will never be judged. (3) The bar would then be calibrated on almost no data while `status` shows a false-fire rate (E-1). (4) Established practice calibrates on the consumer's observable action (CACM); the deterministic uptake observations in E-86 could supply that in Phase A, and the working agent could file corrections through the same verb. (5) Which of these becomes the calibration signal, and whether the owner is expected to review whispers at all, is not settled by any source; the choice touches what the owner does (OL-11).
**Alternatives:** (a) Owner review of `log` (current line); (b) consumer-action uptake (E-86) as the primary Phase-A signal with human corrections outranking; (c) agent-filed corrections via `note`. Not compared on the record.
**Consequences:** §5.2 "calibrated" clause, FR-M4 (E-1), AC-23.
**Verdict:** undetermined — the outranking half stands; the "Phase A's calibration signal" half needs a written comparison of (a)–(c) and Max Cogar's answer on whether he will review whispers. Missing: that comparison and that answer (**owner question** on his role).
**Would be wrong if:** The owner routinely reads `ctxoracle log` and can judge co-change and reuse facts (OL-11 says he is a non-programmer by design).

