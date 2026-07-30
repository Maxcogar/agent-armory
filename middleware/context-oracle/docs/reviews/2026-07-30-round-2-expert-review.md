/root/.claude/skills/expert-review/SKILL.md — Version: R1.2 (2026-07-18)

# Expert Review — Context Oracle architecture, Round 2 (Post-fix)

**Artifact:** `middleware/context-oracle/docs/architecture-context-oracle.md` (2,249 lines) at working-tree HEAD (`6dee4a7`).
**Review date:** 2026-07-30. **Round:** 2 (first Post-fix round; round 1 = two independent passes over `e0343e7`, fixes applied at `c82ab2f`).

---

## Scope and Inventory

### Round accounting and the artifact actually reviewed

This is a **Post-fix review, round 2**. Round 1's two passes (adversarial collapse-hunt + `/expert-review`) reviewed the document as rebuilt at `e0343e7`; their findings were applied at `c82ab2f`.

**The artifact under review is not `c82ab2f`.** Two further commits modified it after the fix commit and are inside this review's scope (`git log --oneline c82ab2f..HEAD -- docs/architecture-context-oracle.md`):

- `edbd8e6` — "Correct conduct-genre overcorrection: enabled by default, not an owner on/off" (68 lines changed in the architecture)
- `a1e0dad` — "Resolve the four 'open' items: look them up or fix the design" (124 lines changed in the architecture)

The review is performed against the current file, not against the fix commit.

### Inventory-source substitution (recorded per instruction)

SKILL.md Step 2's Post-fix rule names four inventory sources. Source 1 — *the prior review's full inventory* — **is not preserved**: neither round-1 pass wrote its output to a file, and `docs/reviews/2026-07-22-round-1-findings-RECONSTRUCTED.md` states explicitly that round 1's Scope and Inventory section is among what was lost. **Substitution applied and recorded here:** source 1 is replaced by the SKILL.md Step 2 *Architecture review* rule — the architecture document itself, plus every file it cites as a Source / Verified-by premise in its decisions section. The remaining three post-fix sources are used unchanged (fix-diff files; dependents — not applicable, no code; prior findings as closure items).

A second consequence of the loss is recorded honestly rather than papered over: SKILL.md Gate A requires each prior finding be closed **against its originally named standard**. The reconstruction records "**standard not recorded**" for the round-1 expert-review CRITICAL and for every Moderate/Minor it lists. For those items closure against the originally named standard **cannot be performed as Gate A specifies**. They are closed below against the *claim* the reconstruction preserves, and each such closure is marked **tentative**. `docs/collapse-log.md` (2026-07-22 section) preserves the six collapse-hunt findings' questions verbatim, so those six close non-tentatively against the mission-fidelity question they were raised under.

### File inventory

Project files (all verified):

- [x] `docs/architecture-context-oracle.md` — Read in full, 4 passes: 1–400, 400–849, 849–1298, 1299–1768, 1768–2249. Cited throughout by line.
- [x] `docs/specs/spec-context-oracle.md` — Read 1–240, 240–540, 540–913 (full). Premise source for every decision's element 5.
- [x] `RETHINK.md` — §12 + addendum Read via `sed -n '/## 12/,$p'` (OWNER-1..OWNER-11 verbatim).
- [x] `CLAUDE.md` (project) — Read in full (auto-loaded); hard rules, collapse test, lifecycle.
- [x] `docs/judgment-layer-corrected-foundation.md` — Read in full (134 lines); the D10/D12/D13 anchor.
- [x] `docs/collapse-log.md` — Read in full (222 lines); authority for the 6 collapse-hunt closure items.
- [x] `docs/IDEAS.md` — Read in full (71 lines); Grep-verified `embed` → **0 hits**.
- [x] `docs/STATUS.md` — Read in full (161 lines).
- [x] `docs/reviews/2026-07-22-round-1-findings-RECONSTRUCTED.md` — Read in full; provenance warning read first.
- [x] `docs/handoffs/2026-07-22-architecture-complete-next-is-plan.md` — Read in full; treated as candidate claims per SKILL.md line 44, each re-derived below.
- [x] Fix-diff file set — `git show --stat c82ab2f`, `edbd8e6`, `a1e0dad`: `docs/architecture-context-oracle.md`, `docs/STATUS.md`, `docs/collapse-log.md`, `docs/handoffs/2026-07-22-...md`. All four on this inventory and verified.

External premise sources the decisions cite (all re-derived, not accepted from the document):

- [x] Claude Code hooks reference — `curl https://code.claude.com/docs/en/hooks.md` (242,078 bytes, fetched 2026-07-30), Read at lines 66, 231, 343, 700–740, 765, 825–882, 985, 1102, 1158, 2031, 2069, 2240–2300, 2661–2693.
- [x] Claude Code CLI surface — `claude --version` → **2.1.220** (document claims v2.1.218); `claude --help` captured in full and Read.
- [x] Live `claude -p` invocations — 10 runs, outputs pasted in findings F2/F3 and in closure evidence.
- [x] `node:sqlite` on Node **v22.22.2** — script executed (WAL, STRICT, CHECK, FTS5, `busy_timeout`, `integrity_check`, sync-return).
- [x] OWASP ASVS 5.0.0 chapter list — `OWASP_Application_Security_Verification_Standard_5.0.0_en.csv` fetched and parsed; V1–V17 enumerated.
- [x] Anthropic Help Center — "Use the Claude Agent SDK with your Claude plan" — located and content confirmed via WebSearch.
- [x] `web-tree-sitter@0.26.11` / `tree-sitter-wasms@0.1.13` — `npm view` + `npm pack` + `tar tzf`: 4 grammars present, **0** `.node`/`binding.gyp` entries.
- [x] `git rev-list --max-parents=0` behaviour — executed on this repository and on a purpose-built full-vs-shallow clone pair.

No inventory item remains `[ ]`.

### Step 3 tool plan

| Claim type in scope | Required instrument | Available | Used |
|---|---|---|---|
| Absence claims ("the document never bounds X") | Grep/Read over the named file | Yes | Grep with query + count recorded per finding |
| Literal-content claims ("line N says Z") | Read at file:line | Yes | Read at drafting time, cited |
| Library/CLI/harness-behaviour claims | Current primary docs + live execution | Yes (WebFetch, curl, Bash) | hooks.md re-fetched; `claude --help`; ASVS CSV |
| Behavioural claims ("this command does W") | Execution / reproduction | Yes (Bash) | 10 live `claude -p` runs; node:sqlite script; git clone experiment |
| Claims imported from prior documents (handoff, collapse-log, reconstruction) | Re-derivation via the underlying claim's instrument | Yes | Every one re-derived; see Closure Ledger |
| Claims written inside the artifact (Spike PASS verdicts, Phase 8 attestation, Gates A/B/C) | Re-derivation from source — never accepted | Yes | Re-derived; two failed (F2, F3, F9) |
| Structural / blast-radius claims | CodeGraph | **No** | **Not needed — no code exists.** Not a load-bearing claim category for a design-document review; no halt condition triggered. |

**Instrument unavailability and disposition.** `codebase RAG` and `CodeGraph` are unavailable. Per the Step 3 bright line this is *not* a halt: the scope contains zero source files, so no load-bearing claim category is stranded. The bright line was applied, not assumed.

**Structured-reasoning tools — availability determined by me, not taken on report.** I searched with `ToolSearch` twice: `select:metacognitivemonitoring,collaborativereasoning` → *"No matching deferred tools found"*; keyword search `clear thought structured reasoning metacognitive monitoring collaborative reasoning personas` → returned only `DesignSync`, `Monitor`, `mcp__CORE_Memory__get_integration_actions`, `mcp__github__unsubscribe_pr_activity` — no Clear Thought tool. Both mandatory invocations were therefore **performed manually** per SKILL.md line 84, with the same personas. This is recorded as a procedural observation in Observations. My coordinator asserted the same unavailability up front; I did not rely on that assertion — the searches above are the basis.

**Rigor waivers.** None. No compression of the process was requested or applied.

---

## Summary

**This review returns NEEDS FIXES.** The round-1 findings are all closed and the fixes are real — the judgment core, the concurrency model, the audit-durability guarantee, and the `--bare` removal each re-derive correctly from source, and the matrix arithmetic, ASVS chapter mapping, `node:sqlite` capability claims, WASM-grammar packaging, and phase-exit AC assignments are all accurate. What has *not* changed is the failure mode this document was rebuilt to eliminate. Round 1's own recorded lesson — *"never trust a premise whose validating command differs from the design's"* (`collapse-log.md`, 2026-07-22, closing paragraph) — was written down and then not applied: the Spike-1 evidence still exercises a command that is not D11's command, and running D11's actual command falsifies three of the document's stated properties. Two of this round's findings are Critical, and both are properties the document asserts are true **"by construction"**: the model child's tool set is *not* empty under `--disallowedTools` (31 tools remain, including task-creation and message-sending tools), and delivering a whisper on `Stop`/`SubagentStop` via `additionalContext` is a documented **continuation control** that prevents the agent from stopping — a deny path re-entering through the one channel the design treats as inert, in a project whose highest-authority rule is that no deny path exists structurally.

---

## Upstream Contract Verification

Upstream artifacts exist: `docs/specs/spec-context-oracle.md` (FR-*, D-1..D-20, AC-1..AC-22, NF/C/P) and `RETHINK.md` §12 + addendum (OWNER-1..OWNER-11), plus the project `CLAUDE.md` hard rules. The architecture is the artifact under review, so its own decisions are the *object*, not a second reference.

### Spec acceptance criteria — coverage and integrity

Each AC is checked for (a) an assigned mechanism in the architecture and (b) whether that mechanism can actually establish the criterion.

| AC | Status | Verification method |
|---|---|---|
| AC-1 coupling | **Pass** | D17 storage + D13 FR-D5 ratio render; Read arch:1358–1386, 1147–1152 |
| AC-2 silence ≤10% | **Pass** | D26 replay layer 2; Read arch:1688–1692 |
| AC-3 no deny | **FAIL** | D9 claims the shim response type carries no decision fields (arch:787–788). Re-derived against current hooks reference: `additionalContext` on `Stop`/`SubagentStop` "keeps the conversation going through the same loop protections as `decision: block`" (hooks.md:2271, fetched 2026-07-30). AC-3 as specified cannot detect it. → **F1** |
| AC-4 pristine tree | **Pass** | D22 wiring-only write + command-path matching; Read arch:1530–1535 |
| AC-5 warning not block | **Pass** | D13 FR-D3 render; Read arch:1149–1151 |
| AC-6 provenance | **Pass** | D13 shared pointer-resolution gate; Read arch:1155–1158 |
| AC-7 injection | **Pass (as scoped)** | D26 adversarial pack incl. `zone_evidence` carriers; Read arch:1696–1699 |
| AC-8 zero ceremony | **Pass** | D22 skill optional; Read arch:1536–1539 |
| AC-9 false-fire | **Pass** | D22 `suppress`/`unsuppress`; Read arch:1530 |
| AC-10 degraded | **Pass** | D20 + AC-10/18 runtime check; Read arch:1446–1459 |
| AC-11 recursion guard | **Weakened** | Retargeted to the non-`--bare` child (arch:1700–1702) — correct as far as it goes, but AC-11 counts *oracle hook firings*, not the child's tool authority; the tool-set property T4 asserts is not covered by any AC. → **F2** |
| AC-12 secrets | **Pass** | D19 enumerated call sites; Read arch:1418–1427 |
| AC-13 trust origin | **Pass** | D6 DAO constraint; empirically CHECK/NOT NULL enforce on `node:sqlite` v22.22.2 (script run) |
| AC-14 locality | **Pass** | D26 network-refusing spawn wrapper; Read arch:1698 |
| AC-15 export round-trip | **FAIL (mechanism defect)** | Depends on stable repo identity (D5). `git rev-list --max-parents=0 HEAD` returns **6** commits on this repository, and yields a *different* commit in a `--depth 1` clone. → **F5** |
| AC-16 attention discipline | **Pass** | D26 replay; Read arch:1690 |
| AC-17 staleness | **Pass** | D16/D21; Read arch:1497–1498 |
| AC-18 self-detection | **Pass** | D21 seven self-checks; Read arch:1492–1505 |
| AC-19 process conformance | **Pass** | D14 Lane 2 extraction; Read arch:1252–1257 |
| AC-20 answer drift | **Pass** | D14 deterministic bookkeeping; Read arch:1252 |
| AC-21 subagent delivery | **Pass** | D15 + Spike 2; hooks.md:2031 confirms SubagentStart `additionalContext` reaches the subagent's own context |
| AC-22 self-report | **Pass** | D21 findings as FR-M3 input; Read arch:1503–1505 |

### Owner-locked decisions and project hard rules

| Locked decision | Status | Verification method |
|---|---|---|
| OWNER-3 / P2 / FR-O4 — **no gates, no deny paths, no blocking** | **VIOLATED** | hooks.md:2262, 2271 Read 2026-07-30; architecture registers `Stop`/`SubagentStop` (arch:250, 737) and routes completeness/verification genres to `stop` (arch:819). Grep of the architecture + spec for `continu(e\|es\|ation)\|keeps the conversation\|stop_hook_active\|prevent.*stopping` → **0 hits**: the contract fact is nowhere acknowledged. → **F1** |
| OWNER-7 — **no separate credentials, ever** | **Honored** | `--bare` absent from D11's command block (Grep `--bare` in the architecture → 20 hits, all rejection prose); reproduced independently: `--bare` → `is_error:true, "Authentication error"`; no `ANTHROPIC_API_KEY` in env |
| OWNER-6 / P8 — **stores out of tree, no in-tree writes but init wiring** | **Honored** | D5, D22, D23 Read arch:588–624, 1520–1554, 1556–1577 |
| No compiled context packages / no agent rituals (P3) | **Honored** | D8 (no agent-facing surface), D22 (skill optional); Read arch:727–774, 1536–1539 |
| OWNER-9 — conduct genres in scope, advisory | **Honored** | D14 arch:1240–1261 states "enabled by default"; matches the owner's 2026-07-22 correction in `collapse-log.md`:128–164 |
| OWNER-10 — self-observability | **Honored** | D14 `subagent_narration_unavailable` + D21 self-check 7; Read arch:1224–1231, 1500–1502 |
| CLAUDE.md — collapse test in writing on load-bearing decisions | **Honored** | Read: D10 element 4 (arch:881–897), D12 element 5 (arch:1106–1136), D24 element 5 (arch:1642–1654). All three present. |
| Spec §12 phase exits | **Honored** | Architecture build order arch:1956, 1963–1967 matches spec:786–799 exactly, AC-10 in Phase 2 only |

### Design decisions of the *spec* that govern the architecture

`[spec D-6]` (guard mechanism assigned to architect) — supplied by D11. `[spec D-13]` (store layout) — confirmed by D5, but see F5. `[spec D-16]` (subagent delivery) — confirmed by D15 and re-derived against hooks.md:2031. Verification method: Read of spec:716–719, 743–746, 755–762 and the corresponding architecture decisions.

---

## Critical & Serious Findings

### F1 — CRITICAL (new). Whispering on `Stop`/`SubagentStop` is a continuation control, so the design does contain a deny-shaped path

**What the document does now.** The shim is registered for eight events including `Stop` and `SubagentStop` (arch:249–250, and the contract's `"stop" | "subagent_stop"` event types at arch:737). D10's Lane 1 routes two genres to that event: *"stop → untouched partners + verify command (completeness, verification)"* (arch:819). D9 states the shim's uniform output for a whisper is `hookSpecificOutput.additionalContext` (arch:783), and the data-flow step 4 prints exactly that (arch:292). D13 confirms *"Whispers → `additionalContext` only"* (arch:1180).

**How that claim was verified.** Read of `docs/architecture-context-oracle.md` at lines 249–250, 292, 737, 783, 819, 1180 on 2026-07-30. The harness contract was re-derived from the current primary source, not from the document's summary of it: `curl https://code.claude.com/docs/en/hooks.md` (242,078 bytes, 2026-07-30), Read at lines 2258–2280. Verbatim:

> `hookSpecificOutput.additionalContext` — Non-error feedback for Claude. **The conversation continues so Claude can act on it**, but unlike `decision: "block"` it is shown in the transcript as hook feedback rather than a hook error

and

> Use `additionalContext` when the hook is working as designed and giving Claude guidance, such as "run the test suite before finishing". **It keeps the conversation going through the same loop protections as `decision: "block"`**, namely the `stop_hook_active` input and the 8-consecutive-continuation cap…

Absence claim verified by Grep over both `docs/architecture-context-oracle.md` and `docs/specs/spec-context-oracle.md` for `continu(e|es|ation)|keeps the conversation|stop_hook_active|prevent(s)? .* stopping` — **0 results**. Neither document acknowledges the semantics. The architecture cites this same reference for D8/D9/D13/D15 and quotes only the generic `additionalContext` description (arch:386–392, 1194–1197), which is the SessionStart-class description, not the Stop-class one.

**Which standard it violates and why.** RETHINK §12 decision 3 (`OWNER-3`), the project's highest authority and restated as a hard rule in `CLAUDE.md`: *"No gates. No deny paths, no blocking… Every intervention is an advisory whisper."* Spec P2: *"The oracle never blocks a tool call, never denies an action… Its worst possible outcome is a wasted sentence."* Spec FR-O4: *"No deny path exists, structurally."* A Stop-event whisper does not merely waste a sentence — it **prevents the agent from ending its turn** and forces continuation, under the harness's own block-class loop protections. Completeness ("you haven't touched the paired file") and Verification ("run this command") are precisely the genres whose continuation effect reads as a gate: the agent cannot finish until it has burned continuations or hit the 8-consecutive cap. This is the gatekeeper posture the entire rethink removed, re-entering through a channel the design classified as inert. It also violates spec C-5, which obliges the implementation to re-verify the hooks contract against current docs — the document claims that re-verification was done on 2026-07-22 and the fact was not carried.

**Why AC-3 does not catch it.** AC-3 is specified as *"No shim code path can return a blocking decision (no `permissionDecision`/`decision` fields, no exit 2)"* (spec:812–814), and D9/D26 implement exactly that as a type-level and runtime scan (arch:787–788, 1695–1696). A `Stop` whisper emits none of those fields, so the fixture passes while the deny-shaped behaviour occurs.

**What correct implementation looks like.** Three admissible resolutions, all requiring the document to first record the contract fact:
1. **Remove `Stop`/`SubagentStop` from the whisper-opportunity set** and re-key Completeness and Verification to the last `PostToolUse` of an edit, where `additionalContext` is inert. This contradicts spec FR-A2 (which names "stop" as the trigger for both genres) and spec §6.1 (which names `Stop` a whisper opportunity), so under `CLAUDE.md`'s rule — *"If new evidence genuinely contradicts a locked decision, surface it to the owner as a question with the evidence"* — the evidence goes to the owner, and the spec changes.
2. **Route Stop-genre output to the human channel only** (`systemMessage`), accepting that the agent never hears completeness/verification facts.
3. Keep it and accept that the oracle continues turns — **not admissible** under OWNER-3.

Independently of which is chosen, **AC-3 must be widened** from "no decision fields" to "no oracle output can prevent a turn from ending or extend the agentic loop," and the seven-event/eight-event wiring in D22 must record per-event output legality.

---

### F2 — CRITICAL (new). `--disallowedTools` does not empty the judgment child's tool set; 31 tools remain, including task-creation and message-sending

**What the document does now.** D11 ships `--disallowedTools "Bash,Read,Write,Edit,Glob,Grep,WebFetch,WebSearch,Task,NotebookEdit"` and asserts: *"`--disallowedTools` naming the agent tool set makes the tool-restriction claim in §6.2/FR-X5/T4 **mechanical**, not asserted; `--max-turns 1` bounds it to a single generate-no-tool turn"* (arch:919–921). T4's conclusion states: *"the model child's tool set is **empty by flag**, so the property is enforced by construction and asserted by fixture rather than policy"* (arch:1900–1903). D11 element 4 rejects the allow-list alternative on the reasoning that *"a deny-list stated by name is the more legible least-privilege posture and **denies newly-introduced tool names by default**"* (arch:967–970).

**How that claim was verified.** Executed the design's exact deny list against the same CLI the design targets (`claude --version` → **2.1.220**), 2026-07-30:

```
$ claude -p "List the exact names of every tool you currently have available, one per line, nothing else. If you have none, reply NONE." \
    --model claude-haiku-4-5 --output-format json --max-turns 1 \
    --disallowedTools "Bash,Read,Write,Edit,Glob,Grep,WebFetch,WebSearch,Task,NotebookEdit" \
    --system-prompt "Answer literally." --session-id <uuid>
is_error= False num_turns= 1 stop= end_turn
Artifact / ReportFindings / ScheduleWakeup / SendUserFile / ShowOnboardingRolePicker /
Skill / ToolSearch / Workflow / CronCreate / CronDelete / CronList / DesignSync /
EnterWorktree / ExitWorktree / ListConnectors / ListPlugins / ListSkills / Monitor /
PushNotification / SearchMcpRegistry / SearchPlugins / SearchSkills / SendMessage /
SuggestConnectors / SuggestPluginInstall / SuggestSkills / TaskCreate / TaskGet /
TaskList / TaskOutput / TaskStop / TaskUpdate
```

**31 tools remain available**, among them `TaskCreate`/`TaskStop`/`TaskUpdate` (agent spawning and control), `SendMessage`, `SendUserFile`, `PushNotification` (outbound communication), `CronCreate` (scheduled execution), `Skill`, `Workflow`, `ToolSearch`, `EnterWorktree`/`ExitWorktree` (filesystem-affecting), `Monitor` (long-running process). The control the design names is a **default-allow** enumeration, so the rationale that it "denies newly-introduced tool names by default" is not merely unsupported — it is inverted; a deny list is definitionally incapable of denying a name it does not enumerate, and the run above is that inversion made concrete.

Counter-mechanism verified in the same session: `--tools ""` is documented in the same `claude --help` the document says it captured — *"Specify the list of available tools from the built-in set. Use `\"\"` to disable all tools"* — and executing it returns:

```
$ claude -p "List the exact names of every tool you currently have available…" \
    --model claude-haiku-4-5 --output-format json --max-turns 1 --tools "" …
is_error= False num_turns= 1 stop= end_turn
'NONE'
```

**Which standard it violates and why.** Spec FR-X5 (T4): *"the oracle holds… **no tool-invocation authority** in the agent's session, and **no network access beyond the §6.2 model call**."* OWASP LLM01 least-privilege and ASVS 5.0.0 **V15 Secure Coding and Architecture** — both named by D11 itself as governing (arch:954–957). Least privilege in every one of those sources is default-deny with an allow-list; an enumerated deny-list is the anti-pattern. `TaskCreate` in particular is a *spawning* capability inside a component whose entire recursion-guard design (D11's three layers) exists to prevent oracle-initiated activity from multiplying, and `PushNotification`/`SendMessage`/`CronCreate` are egress and persistence surfaces the T4 analysis states do not exist.

**What correct implementation looks like.** Make the tool set structurally empty rather than enumerated: `--tools ""` as the primary control (verified above to yield `NONE` with no loss of structured output), with `--disallowedTools` retained only as defence in depth. D11 element 4's rejection paragraph must be rewritten — the allow-list is not the weaker posture, it is the required one — and T4's "empty by flag" claim must be re-derived after the change rather than restated. An AC must assert the emptiness property directly (AC-11 counts oracle hook firings, not the child's tool inventory, so no current AC covers it).

---

### F3 — SERIOUS (new). The validating spike still is not the design's command; running the design's command falsifies the latency and turn-count premises

**What the document does now.** The Spike-1 evidence block pastes this command and calls it a re-run "with the tool-restriction flag applied" (arch:96–103):

```
claude -p "Reply with exactly the word ORACLE-SPIKE-OK and nothing else" \
    --model claude-haiku-4-5 --output-format json --max-turns 1 \
    --disallowedTools "Bash,Read,Write,Edit,Glob,Grep,WebFetch,WebSearch"
… duration_api_ms=2792 num_turns=1  real 0m5.733s
```

From that measurement the document derives its load-bearing latency premise — *"measured cold-spawn wall time ≈ 5.7 s"* (arch:119–121), restated as step 1 of D10's reasoning chain (arch:807–808) — and D11 sets *"Timeout: 20 s process kill"* (arch:921).

D11's actual command (arch:908–914) differs by four elements: `--json-schema '<inline verdict-schema JSON>'`, `--system-prompt '<fixed instruction block, D12>'`, `--session-id <fresh uuid4>`, and a **ten**-name deny list (adds `Task`, `NotebookEdit`).

**How that claim was verified.** Both commands executed three times each, 2026-07-30, same machine, same CLI (2.1.220):

| | Spike-1 command | D11's actual command |
|---|---|---|
| wall | 5.37 s / 6.41 s / 5.62 s | **16.45 s / 13.54 s / 14.77 s** |
| `duration_api_ms` | 3651 / 2614 / 3061 | 13576 / 10888 / 11614 |
| `num_turns` | 1 / 1 / 1 | **2 / 2 / 2** |
| `stop_reason` | `end_turn` ×3 | **`tool_use` ×3** |

An earlier fourth run of D11's command (the first, cold) measured 16.95 s wall, `num_turns: 2`, `stop_reason: "tool_use"`, `cache_creation_input_tokens: 12932`. The Spike-1 figures reproduce the document's 5.7 s exactly; the design's command does not.

**Which standard it violates and why.** The project's own dominating rule (`CLAUDE.md`): *"Never claim something works without having run it; paste the actual command and its actual output."* And the durable lesson round 1 recorded in `collapse-log.md` (2026-07-22, closing paragraph, Read 2026-07-30): *"a re-run spike must exercise the **actual** design command, flags and all… never trust a premise whose validating command differs from the design's."* That lesson was written into the record and then not applied to the very command it was written about. Two concrete consequences follow:

1. **D11's stated turn bound is false.** *"`--max-turns 1` bounds it to a single generate-no-tool turn"* (arch:920–921) — the shipped command produces two turns and terminates on `tool_use` in 3/3 runs, because `--json-schema` structured output is delivered through a tool call. The invocation is not tool-free, and the T4/D11 security narrative rests on it being so (compounding F2).
2. **The 20 s process kill has no real margin.** Measured mean of the shipped command is ~15 s against a 20 s kill — a ~25% headroom on a first-party API call, on one machine, with a one-fact prompt. D10's entire two-lane derivation is anchored on a 5.7 s figure that belongs to a different command.

**What correct implementation looks like.** Re-run Spike 1 as D11's command verbatim — inline schema, system prompt, fresh session-id, ten-name deny list — and paste that output as the spike evidence. Re-derive the D10 step-1 figure and the D11 timeout from it. Correct or delete the "single generate-no-tool turn" sentence. If the ~15 s figure holds, state the queue-depth consequence for Lane 2 explicitly (a judgment result arrives several event boundaries later, not one), because D10 step 7's delivery-time supersession re-check is sized against a very different latency.

---

### F4 — SERIOUS (new). Move C's anti-fabrication guarantee is an existence check on the *fact*, not an entailment check on the *claim* — the wrong-check class recurring at a new layer

**What the document does now.** D12 Move C: *"Every `claims[].grounding_id` must reference a supplied fact whose pointer *resolves against the current store* (file exists at indexed hash / commit exists). A claim with a missing, unknown, or dangling `grounding_id` → the whole whisper is dropped"* (arch:1047–1052). On that basis D12 asserts *"it never invents *what counts as true* — each factual assertion is bound by id to a store fact"* (arch:1042–1043), and its collapse test answers the skeptic with *"nothing the model writes is trusted as fact — Move C drops any whisper whose claims don't each bind to a supplied store fact whose pointer resolves"* (arch:1113–1116).

**How that claim was verified.** Read of arch:1042–1052 and 1106–1136 on 2026-07-30, then reproduced against the shipped judgment shape. Supplying exactly one fact —

```json
{"id":1,"genre":"coupling","claim_text":"src/state/store.ts co-changed with src/routes/SettingsPage.tsx in 16 of last 20 commits","evidence_pointer":"git log since 2025-01","support_numbers":{"support":16,"total":20},"trust":"mechanical"}
```

— the model returned (run 1, `structured_output` verbatim):

```json
{"claims":[
 {"text":"store.ts co-changes with SettingsPage.tsx in 80% of recent commits (16/20); adding a settings flag likely requires a corresponding SettingsPage update","grounding_id":1},
 {"text":"The observed coupling is mechanical and stable (since 2025-01), indicating this is a standard pattern in the codebase, not accidental","grounding_id":1}]}
```

The second claim asserts *stability*, *standardness*, and *non-accidentality*. None of these is in fact 1; `[HERZIG-13]`, which the spec adopts precisely to forbid this framing ("co-change edges are never certainties"), says up to 15% of fixes are tangled. `grounding_id: 1` resolves, the pointer resolves, and Move C passes the whisper.

**Which standard it violates and why.** Spec P4 and FR-J5 as the architecture itself states them, plus `docs/judgment-layer-corrected-foundation.md` §"What was wrong" (Read in full, 2026-07-30): *"**Existence is the wrong test.** Checking that a co-change edge exists in the store answers 'did the oracle hallucinate this?'… It does **not** answer 'is this worth putting in front of the agent?'"* — and `collapse-log.md` item 1 (2026-07-17), collapsed by the owner with *"why is existence the right check?"*. The corrected foundation relocated existence to "the floor beneath" the send criterion, which the architecture honors at the *gating* layer (materiality + bar). But the same wrong-check has reappeared one layer down, at the *claim* layer: binding-by-id verifies that a referenced fact exists and resolves; it does not verify that the sentence is entailed by that fact. So the two properties D12 asserts are not the same property, and the document conflates them exactly as its own T1 analysis warns against for injection ("the earlier draft conflated the two", arch:1862–1864) — without noticing the identical conflation in the anti-fabrication claim it makes three sections earlier. Spec FR-D5 is also at risk: a claim can pass Move C while stating a co-change relationship *without* its ratio, or with the ratio re-framed as certainty.

**What correct implementation looks like.** Move C must add an entailment bound between the claim text and the bound fact, not merely a reference check. Concretely, and buildable deterministically: (a) constrain each claim to a per-genre slot-filled template whose numeric and identifier slots are copied from the bound fact's `support_numbers` / `evidence_pointer` (the model chooses phrasing within the template, not free sentences); (b) reject any claim containing a number, file path, symbol name, or date that does not appear in the bound fact; (c) reject epistemic-strength lexemes ("standard", "always", "stable", "not accidental") that assert a property the fact does not carry. Then restate D12's guarantee in the narrower form it actually holds — *"every claim references a resolvable fact"* — and stop asserting *"it never invents what counts as true"* until (a)–(c) exist. Record the collapse in `docs/collapse-log.md` per `CLAUDE.md`: the class is **wrong-check**, and it is the second recurrence of collapse-log 2026-07-17 item 1.

---

### F5 — SERIOUS (new). The repository-identity mechanism is self-contradictory and not stable across the clone shapes it claims to survive

**What the document does now.** D5: *"`<repo-key>` = first 12 hex of SHA-256 over the repo's **root-commit hash** (`git rev-list --max-parents=0 HEAD`, **first line**) — stable across clones, worktrees, and container rebuilds, which is what makes export/import (FR-K9) land in the same identity. Fallbacks: no git → SHA-256 of the realpath…; **multiple root commits → lexicographically first**"* (arch:602–610). Its premise-verification element states: *"`git rev-list --max-parents=0` is standard git (verified locally this session — **returns the root commit on this repo**)"* (arch:621–623).

**How that claim was verified.** Executed on this very repository, 2026-07-30:

```
$ cd /home/user/agent-armory && git rev-list --max-parents=0 HEAD
99818db05321a46c1552d69a577ac48be45e113a
225ea0f084305c15dc174ab092e151de865cbb5f
512f40af87c1ac9309df0f3246d3878e8cc2a034
5eb12be25c4ac07f3bc137b159001dbb9a39b5f4
1e3bc14c993012ad74cebf91950aadde87e0d628
375de4b53d4c23196d6feff329e535be8a624c8c
$ git rev-list --max-parents=0 HEAD | sort | head -1
1e3bc14c993012ad74cebf91950aadde87e0d628
```

Six root commits. The primary rule ("first line" → `99818db…`) and the document's own multiple-root fallback ("lexicographically first" → `1e3bc14…`) select **different commits**, so an implementer following D5 gets a different store per reading. The premise sentence "returns the root commit on this repo" is false as written on the repository it was allegedly checked against.

Shallow-clone behaviour, verified with a purpose-built pair:

```
$ git init full && (5 commits) && git clone --depth 1 file://…/full shallow
FULL root:    133344377daf1cc09c8049f95bf36a9e86f6d051
SHALLOW root: a25c4df14b39744282d8c8abb750f907c082c737
shallow file exists: shallow/.git/shallow → yes
```

In a `--depth 1` clone the command returns the *shallow boundary* commit, not the root. Git is present and a commit is returned, so **no D5 fallback fires** — the oracle silently keys a different store for the same repository.

**Which standard it violates and why.** Spec FR-K9 and `[spec D-13]` as D5 itself invokes them: *"`export`/`import` round-trips a project store… so learned knowledge survives ephemeral containers"* and AC-15's `export → wipe → import → equivalent whispers`. D5's own first-principles anchor is *"the goal is knowledge that survives ephemeral checkouts (FR-K9); path- or URL-derived keys break exactly when containers rebuild"* — shallow cloning is the dominant way containers rebuild, and the chosen key breaks under it exactly as the rejected alternatives do. It also violates the `CLAUDE.md` engineering-standard rule that external facts are "verified against current primary sources before you build on them": the verification sentence records a result the command does not produce.

**What correct implementation looks like.** Make the selection deterministic and shallow-aware in D5's decision element, not left to an implementer choosing between two contradictory sentences:
1. Single rule: **lexicographically smallest** root commit hash (delete "first line"), so traversal order can never change the key.
2. Detect shallowness explicitly — `git rev-parse --is-shallow-repository` — and either `git fetch --unshallow` once at `init` (a one-time cost that D22's preflight is already the place for) or refuse to derive a commit-based key and fall back to the `path-keyed` mode already defined, with `status` saying so plainly as the fallback already promises.
3. State the residual honestly in Limitations: a repository with unrelated histories merged after `init` changes its root set.

---

### F6 — SERIOUS (new). Nothing bounds Lane 2 model-call volume, and the design never accounts for the oracle spending the same subscription quota as the agent it observes

**What the document does now.** D10 step 4 feeds Lane 2 from *"an intent queue fed by transcript deltas, loaded-skill texts, and open questions"* with no stated call cap; step 8's only bound is on the *candidate pool* (*"the pool is bounded (default 64/consumer)"*, arch:858–860). D20 caps *probes* ("at most once per 30 min") and D10 caps *injected tokens* (FR-A3, 2,000/session; per-consumer 600). The document's own Limitations section (arch:2076–2081) records as an established fact that headless `claude -p` **draws from the owner's Pro/Max subscription**.

**How that claim was verified.** Absence claim: Grep (case-insensitive) over `docs/architecture-context-oracle.md` for `rate.?limit|quota|usage limit|cost|spend|tokens per|call volume|throttl|per-session model|model call budget` → **20 matches**, every one of which I Read: they are injected-token budgets (arch:368, 1285, 1294, 1311, 2032), latency/dependency costs (arch:536, 618, 714, 1190, 1272, 1380, 1477, 1610, 1635, 1728, 1737), or prose ("cost" in "at the cost of", arch:1058, 1085, 1172, 1759–1764, 1856). **Zero** bound the number of `claude -p` invocations per session or the quota they consume. The subscription-sharing premise was re-derived independently (WebSearch, 2026-07-30, Anthropic Help Center "Use the Claude Agent SDK with your Claude plan"): Agent SDK / `claude -p` usage continues to draw from Pro/Max/Team subscription limits; the 15 June 2026 separate-credit change is paused. Per-call cost measured on the shipped command (F3's runs): 12,932–15,749 cache-creation input tokens plus ~1k output, `total_cost_usd` 0.0061–0.0361 per judgment.

**Which standard it violates and why.** This is a **first-principles articulation**, marked as such — no published standard governs "an assistant must not exhaust its host's rate limit." *The goal:* the oracle's worst case is a wasted sentence (P2), and it must never become "a gate by another name" (RETHINK §5, the sentence that generated NF-1). *The shortcut:* Lane 2's call volume is left unbounded because it is off the hook path, so it cannot hurt latency. *Why the shortcut fails the goal:* latency is not the only way to gate. OWNER-7 forces the oracle onto the *same* credential — and therefore the same 5-hour and weekly rate limits — the working agent is spending. An oracle issuing one ~13k-token judgment per transcript delta, per skill load, and per open question, in a session where a subagent fan-out multiplies consumers, can exhaust the quota that the agent it is helping needs. When that happens the oracle has blocked the work outright, which is a strictly worse outcome than the latency stall NF-1 exists to prevent — and the failure surfaces as the *agent's* rate-limit error, not as an oracle diagnostic, so OWNER-10's self-observability does not catch it either.

**What correct implementation looks like.** Add an explicit Lane 2 call budget alongside the existing token budget: a per-session cap on judgment invocations and a minimum inter-call interval, both as `tuning` rows (D23) so the learning loop can move them; a hard degrade to Lane 1 when the cap is hit, announced once on the human channel exactly as D20 announces degraded mode. Add a diagnostics counter (D21) for calls issued/cap remaining, and a `status` line in plain language ("the oracle used N model calls this session"). Add a self-check for the specific failure: a `claude -p` result carrying a rate-limit error must enter degraded mode immediately and surface an FR-M2 finding, because that error means the oracle is now competing with its own consumer. Record the accounting in Limitations.

---

## Systemic Patterns

### S1 — SYSTEMIC (new). Load-bearing properties are asserted in the document as established, with the check that would establish them not run — third consecutive round

**The proactive grep across the full inventory scope.** Run over `docs/architecture-context-oracle.md`, 2026-07-30:

| Query | Result count |
|---|---|
| `by construction` | 9 |
| `established (live )?this session\|verified (live )?this session\|pasted this session\|empirical(ly)? this session\|verified empirically this session` | 12 |
| `is total over\|complete set\|every .* accounted for\|No premise rests on memory\|each verified to exist\|verified present in the body` | 7 (arch:1735, 1756, 1781, 1790, 1883, 2169, 2242) |

Each of the 7 totality attestations and a sample of the "by construction" and "this session" claims were re-derived against source. Instances that fail:

1. **arch:1900–1903** — *"the model child's tool set is **empty by flag**… enforced by construction"*. 31 tools remain. (F2)
2. **arch:920–921** — *"`--max-turns 1` bounds it to a single generate-no-tool turn"*. 2 turns, `stop_reason: tool_use`, 3/3. (F3)
3. **arch:96–121** — Spike 1 presented as validating the design's model call. Its command is not D11's command; the design's command measures ~3× slower. (F3)
4. **arch:621–623** — *"verified locally this session — returns the root commit on this repo"*. Returns six commits on this repo. (F5)
5. **arch:1042–1043 / 1113–1116** — *"it never invents what counts as true"* / *"nothing the model writes is trusted as fact"*. Reproduced a fabricated interpretation passing Move C. (F4)
6. **arch:2169** — *"the traceability matrix is total over FRs, NFs, constraints, principles, **spec judgments**, §14 items, and ACs"*. The matrix carries 3 of the spec's 20 `[D-n]` judgments; per-judgment Grep across the whole document shows **6 appear zero times** (`spec D-1`, `D-2`, `D-9`, `D-11`, `D-18`, `D-20`). (F9a)
7. **arch:2104** — *"Embedding-based recall for the Answer genre is an IDEAS-ledger candidate"*. Grep `embed` in `docs/IDEAS.md` → **0 hits**. (F9b)
8. **arch:1790** — *"No premise rests on memory."* Falsified by items 1–7; also the CLI version it certifies (v2.1.218) is not the installed one (2.1.220).

Claims that **hold** on re-derivation, so the pattern is not universal: FR-X6 "logged-before-sent … true by construction" (arch:1605–1612, design-level and coherent); FR-K6 provenance "unrepresentable" (arch:670–675 — CHECK and NOT NULL verified to fire on `node:sqlite` v22.22.2); T1's explicit refusal to claim elimination (arch:1848–1864); the D2/D3/D4 matrix arithmetic (all four recomputed, all correct); the ASVS chapter mapping (CSV parsed, V1–V17 titles match); the phase-exit AC assignments (spec:786–799 vs arch:1956–1967, exact).

**The named standard.** The project's own dominating rule in `CLAUDE.md` — *"Never claim something works without having run it… A falsely reported success is the worst failure this project can have"* — together with the `expert-standard` observation axis (a factual claim stated from memory or from the artifact's own commentary is not a verified premise).

**Why this is systemic rather than isolated.** The document's own revision note (arch:3–12) states that the 2026-07-17 draft was condemned for *"11 findings sharing one root cause — correctness and completeness were **asserted but never established**"*, and that this rebuild exists to end that. Round 1 then found the same class again (a Phase-8/Gate-C attestation of a D24 collapse test that did not exist; the `--bare` command self-certified but never run). Round 2 finds eight further instances, two of them Critical. Three consecutive rounds, one root cause, in a project whose owner is explicitly incapable of catching it. The instances are not independent slips: they cluster in exactly the sections whose purpose is to certify (Spike verdicts, Phase 8 attestation, Gate B/C outcomes, Status), which are the sections a downstream reader trusts most and re-derives least.

**What correct looks like.** Every attestation sentence in the document must carry, inline, the artifact that proves it: the pasted command *as shipped*, the grep query and count, the file:line, or the fetched-doc quotation with its date. Attestations that cannot carry one are deleted, not softened. Concretely for this document: delete the Phase 8 / Gate B / Gate C / five-trap self-assessment blocks or reduce each bullet to a citation; re-run every "this session" check against the artifact the design ships; and add the pattern to `docs/collapse-log.md` as a recurring trap so the next round inherits it — the class name being **unverified**, per that file's own legend.

---

## Moderate & Minor Findings

### F7 — MODERATE (new). The documented `SessionEnd` hook budget is 1.5 s; the design's shim deadline is 2.5 s and its margin arithmetic ignores it

**What the document does now.** D2's data flow sets the shim's client-side deadline at *"default 1,200 ms, hard 2,500 ms — inside FR-O3's 3 s with margin"* (arch:286–287), uniformly across all eight registered events. Service teardown hangs off `SessionEnd` (*"Lifetime: exits on SessionEnd"*, arch:466–468) and so does the distiller (*"ctxoracle-distiller (post-session, spawned at SessionEnd)"*, arch:275–276). The document does account for one harness timeout — *"UserPromptSubmit lowers command-hook timeout to 30 s"* (arch:392) — so the omission is selective, not a blanket absence.

**How that claim was verified.** `hooks.md` (fetched 2026-07-30) Read at line 343 and 2693: *"`SessionEnd` hooks share a **1.5-second budget**; if your settings set a longer per-hook `timeout`, Claude Code raises the budget to match, up to 60 seconds"* and *"SessionEnd hooks have a default timeout of 1.5 seconds. This applies to session exit, `/clear`, and switching sessions via interactive `/resume`."* Absence claim: Grep of `docs/architecture-context-oracle.md` and `docs/specs/spec-context-oracle.md` for `1.5|1,500|SessionEnd.*timeout|SessionEnd.*budget` — no match records this fact.

**Standard.** Spec C-5 (*"the hooks contract facts in §6.1 are version-bound; implementation re-verifies against current docs"*) and the general engineering practice that a client deadline must be derived from, not merely compared against, the caller's own timeout. The design's hard 2,500 ms exceeds the 1.5 s the harness grants, so on `SessionEnd` the shim can be killed mid-await; the "inside FR-O3's 3 s with margin" reasoning does not apply to this event at all.

**Correct implementation.** Per-event deadlines rather than one global pair, with `SessionEnd` set below 1.5 s; D22's `init` must additionally write an explicit per-hook `timeout` for its `SessionEnd` entry if teardown or distiller spawn genuinely needs longer (the docs' own escape hatch), and record that write in the AC-4 accounting since it changes the settings bytes deinit must remove.

### F8 — MODERATE (regression — introduced by round 1's `so_what` fix). The Move-C validator drops the whole whisper, and the shipped judgment reliably emits imperative `so_what` clauses

**What the document does now.** Round 1's Minor fix extended Move-C validation to `so_what`: *"This validation covers all model-composed free text — every `claims[].text` **and** the optional `so_what` clause (Minor-2)… **Any failure → drop**"* (arch:1059–1062), where the validator is *"an imperative-construction deny-lexicon [that] rejects commands"* (arch:1054–1056). Before the fix, `so_what` was unvalidated, so no drop path existed; the fix created it.

**How that claim was verified.** Read of arch:1054–1062. Then observed the shipped judgment's natural output across the four D11-command runs of 2026-07-30 — every one produced an imperative or directive `so_what`:

- *"**Verify** whether this settings flag edit requires a parallel SettingsPage update…"*
- *"**Check** that file after store changes are complete."*
- *"**Plan to review or update** src/routes/SettingsPage.tsx as part of this store.ts edit."*
- *"Adding a settings flag to the store **without planning simultaneous UI updates** … will likely result in incomplete…"*

4/4 would be rejected by an imperative deny-lexicon, and under "any failure → drop" the entire whisper — including its two correctly-pointered claims — is discarded.

**Standard.** Spec FR-D2 is correctly applied (tone must never be imperative); the defect is the *remedy*, judged against fail-soft design practice: a validator whose expected trigger rate is high must degrade the output, not discard it. The interaction is with D10 step 9, the anti-silence-ratchet the round-1 HIGH fix added: a high hidden drop rate is indistinguishable at the measurement layer from "the bar is correctly high," which is precisely the failure step 9 exists to make visible.

**Correct implementation.** `so_what` carries no factual claim (D12 says so explicitly at arch:1060–1062), so its failure must degrade rather than drop: strip the clause, keep the pointered claims, and emit a diagnostic. Reserve whole-whisper drop for grounding and injection-suspect failures, where the content itself is unsafe. Instrument the drop rate per cause in D21 and surface it in `status`, so a validator eating the judgment lane is visible rather than silent.

### F9 — MINOR (new). Two self-attestations name artifacts that do not contain what is claimed

(a) **arch:2169** claims the traceability matrix is *"total over … spec judgments."* Verified by per-judgment Grep of the whole architecture for `spec D-n]`, n = 1..20: counts are D-1:0, D-2:0, D-3:1, D-4:1, D-5:2, D-6:4, D-7:1, D-8:5, D-9:0, D-10:2, D-11:0, D-12:2, D-13:4, D-14:1, D-15:1, D-16:4, D-17:3, D-18:0, D-19:2, D-20:0. The matrix itself carries three rows (`[spec D-6]`, `[spec D-13]`, `[spec D-16]`); six judgments appear nowhere in the document. Note the matrix's own header (arch:1982) does *not* claim judgment coverage — only the Status paragraph overclaims, so the fix is to the Status sentence or to the matrix, whichever the author intends.

(b) **arch:2104** claims *"Embedding-based recall for the Answer genre is an IDEAS-ledger candidate, deferred to measurement."* Grep `embed` in `docs/IDEAS.md` → 0 hits; the ledger's 12 entries were Read in full and none concerns embeddings. The comparable claim at arch:852 (warm-spare → IDEAS) **does** hold: `docs/IDEAS.md` entry 12 exists and matches.

**Standard.** `CLAUDE.md`'s ideation rule (*"`docs/IDEAS.md` is the ledger: add entries whenever the work suggests one"*) and the general documentation-integrity practice that a cross-reference must resolve. **Correct:** add the embedding-recall entry to `docs/IDEAS.md` with its evidence status, and either extend the matrix to the spec's judgments or narrow the Status sentence to what the matrix actually covers.

---

## Tentative Findings

**No tentative findings** — every candidate finding's premise was verified per Compliance Gate B: by Read at a cited file:line, by Grep with the query and result count recorded, by fetch of the current primary source with its date, or by live execution with the command and output pasted. Nothing in this review's findings section rests on an unexercised claim.

One *closure* item is marked tentative rather than a finding, and is recorded in the Closure Ledger below: collapse-hunt item 6 named `D6` among its targets, and the negative-evidence fact is constructed at retrieval time rather than persisted, so no D6 schema element corresponds to it. I judged this correct (an ephemeral fact needs no table) rather than a gap, but the round-1 finding's own target list is not fully satisfied and I record that rather than smooth it over.

---

## Observations

*(No standard violation and no severity classification attaches to any entry here.)*

1. **Procedural — the two mandatory structured-reasoning tools are not present in this session.** `ToolSearch` with `select:metacognitivemonitoring,collaborativereasoning` returned *"No matching deferred tools found"*; a keyword search for Clear Thought / structured reasoning returned only unrelated tools. Both invocations were therefore performed manually per SKILL.md line 84. The metacognitive baseline was drawn before any finding was drafted: everything I "knew" about this document at review start came from the brief and the document's own text, which placed *all* of it on the inferred side of the line — hence every premise in this review was re-derived from source or from execution, including the ones the document says it established. The pre-delivery multi-perspective pass was run with the three named personas; what it changed is recorded in observation 2.

2. **What the pre-delivery multi-perspective pass changed.** *Standards-discipline seat:* required me to separate F4 (a genuine wrong-check) from a merely stylistic complaint about model output, which is why F4 carries a reproduced example rather than an assertion. *Downstream-consumer seat* (the agent that will act on the verdict): required F1 and F2 to state a concrete admissible remedy each, and required F1 to name the `CLAUDE.md` escalation path explicitly, since resolving it touches a locked spec decision and an agent must not resolve that alone. *Implementer seat:* required F5 to give a single deterministic rule rather than a list of considerations, and required F3 to say what to do if the ~15 s figure holds, not only that the figure is wrong.

3. **The document's honesty about its own limits is unusually good where it is good.** The T1 conclusion explicitly refuses "eliminated by construction" and states a named residual (arch:1859–1864); D20's Caveat 6 refuses to let Phase 0 claim the mission (arch:1460–1469); the Answer-genre retrieval cap is stated rather than buried (arch:1022–1026); Limitations names Windows as designed-not-tested. This is worth recording because it makes the S1 pattern more specific than "the document overclaims": overclaiming clusters in the *certification* sections, not in the design prose.

4. **CLI version drift.** The document certifies against `claude` v2.1.218; the installed CLI is v2.1.220. Every flag the document names is present in 2.1.220 and every quoted help string matches verbatim, so no claim is invalidated — recorded only because C-5 makes drift the expected condition and the next round should re-check rather than inherit.

5. **The round-1 record's loss is a process gap worth closing.** Neither round-1 pass wrote its output to a file; `docs/reviews/` is currently untracked in git (`git status --short` → `?? docs/reviews/`). The reconstruction exists only because `CLAUDE.md` mandates `docs/collapse-log.md`. Committing review outputs would make Gate A closure performable in future rounds instead of tentative.

---

## What's Actually Good

Each entry names the property, the standard it is good by, and how the property was verified.

1. **The `--bare` removal is complete and independently reproducible.** *Property:* the Critical round-1 finding is closed at the mechanism, not merely narrated. *Standard:* OWNER-7 (no separate credentials) and the `CLAUDE.md` run-it rule. *Verified:* Grep `--bare` across the architecture → 20 hits, all rejection prose; D11's command block (arch:908–914) carries none; and I reproduced the failure independently — `claude -p --bare … --model claude-haiku-4-5` → `is_error: true, "Authentication error"`, while the same command without it succeeds.

2. **Every weighted decision matrix is arithmetically correct.** *Property:* the scores in D2/D3/D4 are the stated weights times the stated cells. *Standard:* ISO/IEC 25010 quality-attribute weighting is only meaningful if the arithmetic holds; round 1's predecessor failed exactly here. *Verified:* recomputed all ten totals — PM-A 8.70, PM-B 6.20, PM-C 7.00; RT-A 8.10, RT-B 6.05, RT-C 6.45, RT-D 6.50; ST-A 8.60, ST-B 6.70, ST-C 7.00 — every one matches the printed value.

3. **The `node:sqlite` capability claims are exactly right, including the subtle one.** *Property:* WAL, STRICT, CHECK, FTS5, low `busy_timeout`, `integrity_check`, and — the load-bearing one for D24 — synchronous returns. *Standard:* spec C-1's demand that the architecture not be unable to fall back, and the Expert Standard's rule that library behaviour is checked, not remembered. *Verified:* script executed on Node v22.22.2 — `journal_mode: 'wal'`; STRICT table created; `CHECK constraint failed: b IN ('x','y')`; FTS5 `MATCH` returned a row as a plain object with `instanceof Promise === false`; `busy_timeout` set to 50; `integrity_check: 'ok'`; ExperimentalWarning observed exactly as the document reports.

4. **The zero-native-dependency stack claim survives inspection.** *Property:* the only substantive runtime deps ship no native code and cover the declared language scope. *Standard:* spec C-1 (no native toolchain, no prebuilt-binary download) and ASVS V15 dependency hygiene, both named by D3/D16. *Verified:* `npm pack tree-sitter-wasms@0.1.13` then `tar tzf` — 39 files, containing `tree-sitter-{javascript,python,tsx,typescript}.wasm`, and `grep -c '\.node$|binding.gyp'` → **0**.

5. **The phase-exit AC assignments match the spec exactly.** *Property:* the build order's bracketed exits reproduce spec §12 without drift, including the round-1 correction that placed AC-10 in Phase 2 only. *Standard:* the upstream spec as the validation reference (SKILL.md Step 7). *Verified:* spec:786–799 read against arch:1956, 1963–1967 — Phase 0 `AC-1..5, 12, 14, 17, 18`; Phase 1 `AC-6..8, 11, 16, 19, 20` (+21 contingent); Phase 2 `AC-9, 10, 13, 15, 22`. Identical.

6. **The ASVS 5.0.0 mapping uses real chapter titles.** *Property:* every chapter number/title pair in the mapping table is the actual ASVS 5.0.0 one, including V15 = Secure Coding and Architecture. *Standard:* OWASP ASVS 5.0.0 itself. *Verified:* fetched and parsed `OWASP_Application_Security_Verification_Standard_5.0.0_en.csv`; V1–V17 enumerated and compared row by row against arch:1914–1927 — all match.

---

## Convergence Record

**Round number:** 2 (first Post-fix round), matching Scope and Inventory.

**Trajectory.**

- **R1: 12 distinct findings** — 6 collapse-hunt (mission fidelity) + 1 CRITICAL + 5 Moderate/Minor unique to the expert-review pass; the 2 HIGH the reconstruction records duplicate collapse-hunt items 1 and 2 and are not double-counted. **This count is reconstructed, not R1's own breakdown**: `docs/reviews/2026-07-22-round-1-findings-RECONSTRUCTED.md` states under "Not preserved" that R1's verdict line and finding-count breakdown are lost. The count is derived by de-duplicating the reconstruction's tables against `docs/collapse-log.md` (2026-07-22). Anyone re-deriving it may reasonably arrive at 11 or 18 depending on overlap treatment; the arithmetic below is shown so a different R1 number can be substituted without redoing it.
- **R2: 10 findings** — 2 Critical, 4 Serious, 1 Systemic, 2 Moderate, 1 Minor.
- **R1: 12 → R2: 10.**

**Flow counts for this round.**

- **Prior findings closed: 12** (all of them). Six close non-tentatively against the collapse question `docs/collapse-log.md` preserves verbatim; six close **tentatively** because the reconstruction records "standard not recorded" and Gate A's closure-against-the-originally-named-standard therefore cannot be performed as specified. Closure evidence is in the ledger below.
- **New findings: 9** (F1, F2, F3, F4, F5, F6, F7, F9, S1).
- **Regressions: 1** (F8 — the drop path exists only because round 1's Minor fix extended Move-C validation to `so_what`).

**Tripwire evaluation — NOT FIRED. Arithmetic shown.**

- *Condition (a): new + regression ≥ closed, for two consecutive Post-fix rounds.* This round: 9 + 1 = 10 versus 12 closed → 10 ≥ 12 is **false**, so the condition does not hold even once. Two consecutive Post-fix rounds are additionally required and only one Post-fix round exists (this one). **Not fired.**
- *Condition (b): total findings has not strictly decreased, for two consecutive Post-fix rounds.* 12 → 10 is a strict decrease, so the condition does not hold this round; and again, only one Post-fix round exists. **Not fired.**

**Reading of the trajectory.** The tripwire does not fire, and the count moved in the right direction — but the arithmetic understates the situation and should be read alongside it. R1's Critical count was 1; R2's is 2, and both R2 Criticals are properties the document certifies as true "by construction." The systemic root cause named by the 2026-07-17 review, found again by round 1, and now found again with eight fresh instances, is on its third consecutive round without closing. Convergence in *count* is not convergence in *cause*.

---

## Closure Ledger — round-1 findings re-derived from current source

| # | R1 finding | Status | Closure evidence (re-derived 2026-07-30) |
|---|---|---|---|
| CH-1 | `decision-impact` undefined; silence-only ratchet | **Closed** | Read arch:836–846 — `decision-impact = materiality × structural_weight`; Read arch:1033–1039 — `materiality` present in the Move-B schema; Read arch:861–875 — explore budget (~2%) + computable regret proxy. Closes against the collapse question preserved at `collapse-log.md`:96–111. |
| CH-2 | Answer genre collapsed to FTS-phrasing | **Closed** | Read arch:998–1006 — A0 retrieval-shaping sub-turn, tool-free, parameterizes a deterministic query; Read arch:1022–1026 and 2101–2105 — the reach cap is stated. Closes against `collapse-log.md`:113–126. |
| CH-3 | Conduct genres wrongly framed as policing | **Closed** | Read arch:1240–1261 — "enabled by default", advisory, OWNER-9; Read `STATUS.md`:48–59 — the misframed owner yes/no is removed and the correction recorded. Closes against `collapse-log.md`:128–164. |
| CH-4 | FR-X6 audit log in the droppable class | **Closed** | Read arch:1593–1615 — two write classes; audit appended to a JSONL spool **before** the whisper returns to the shim; disposable class limited to `session_log` traces and Tier-3 flushes. Closes against `collapse-log.md`:166–174. |
| CH-5 | T1 overclaimed "bounded by construction" | **Closed** | Read arch:1848–1864 — defence-in-depth, grounding bounds fabrication not injection-freeness, residual named; Read arch:1165–1179 — pointer-only default for **all** repo-derived spans. Closes against `collapse-log.md`:176–186. |
| CH-6 | `Unknown` genre neither mechanized nor deferred | **Closed (with note)** | Read arch:1010–1017 — negative-evidence fact with `evidence_pointer:'query:<terms> → 0 results'`, bindable, P4-satisfying. Note: the finding also targeted `D6`; the fact is constructed at retrieval time and never persisted, so no D6 element corresponds. Judged correct, recorded rather than smoothed. |
| ER-C | CRITICAL — `--bare` breaks the piggyback | **Closed (tentative — standard not recorded)** | Grep `--bare` in the architecture → 20 hits, all rejection prose; D11's command block (arch:908–914) carries none. Independently reproduced: with `--bare` → `is_error:true, "Authentication error"`; without → success. AC-11 retargeted to the non-`--bare` child (arch:1700–1702). **The finding is closed; its root cause is not — see F3.** |
| ER-H1 | HIGH — impact undefined + ratchet | **Closed (tentative)** | Same evidence as CH-1. |
| ER-H2 | HIGH — Answer genre / retrieval unspecified | **Closed (tentative)** | Same evidence as CH-2. |
| ER-M1 | FR-X6 audit durable | **Closed (tentative)** | Same evidence as CH-4. |
| ER-M2 | Conduct genres scoped (later owner-corrected) | **Closed (tentative)** | Same evidence as CH-3. |
| ER-M3 | `Unknown` genre mechanized | **Closed (tentative)** | Same evidence as CH-6. |
| ER-M4 | D24 collapse test attested but absent | **Closed (tentative)** | Read arch:1642–1654 — D24 element 5 is a full collapse test (job sentence, hardest question, cited answer, steers-toward, survives verdict). Phase 8 attestation's claim that D10/D12/D24 each carry one re-derived: arch:881–897, 1106–1136, 1642–1654 — all three present. |
| ER-M5 | `--json-schema` takes inline JSON, not a file path | **Closed (tentative)** | Read arch:918–921. Reproduced live: `--json-schema /path/to/sch.json` → `Error: --json-schema is not valid JSON: JSON Parse error: Unrecognized token '/'` — matching the document's quoted error verbatim; inline JSON accepted in 4/4 runs. |
| ER-M6 | `so_what` added to Move-C validation | **Closed (tentative)** | Read arch:1059–1062. **Closed, and the fix introduced F8.** |
| ER-M7 | T1 → defence-in-depth, pointer-only default | **Closed (tentative)** | Same evidence as CH-5. |
| ER-M8 | SubagentStart orientation gated on a real task signal | **Closed (tentative)** | Read arch:1294–1304 — fires only on a derivable task signal yielding a high-confidence pool match; otherwise deferred to the subagent's first narration event. |
| ER-M9 | Degraded-mode scope stated honestly | **Closed (tentative)** | Read arch:1460–1469 — Caveat 6: no intent signal, `decision-impact` falls back to `structural_weight`, and an explicit statement that Phase 0 does not realize the mission. |

Ledger closure count used in the Convergence Record: **12 distinct** (the tentative ER items ER-H1/H2/M1/M2/M3/M7 duplicate CH-1/2/4/3/6/5 and are not counted twice).

---

## Open Findings Ledger

Not applicable — the operator has not directed a cycle stop with open findings. No ledger is required and none is presented.

---

## Recommended Priority

The tripwire did not fire, so another fix round is the indicated path rather than foundational rework. Order by impact on correctness, not by ease:

1. **F1 (Critical) — the Stop/SubagentStop continuation path.** This is first because it is the only finding that breaks the project's highest-authority rule, and because its resolution may require the owner: two of the three admissible fixes contradict spec FR-A2 and §6.1, and `CLAUDE.md` forbids an agent resolving a locked-decision contradiction alone. Take the evidence (the verbatim hooks.md wording) to the owner as a question, per that rule. Widen AC-3 regardless of which fix is chosen.
2. **F2 (Critical) — the tool set is not empty.** Second because the fix is small and certain (`--tools ""`, verified to return `NONE`) but the property it restores is a security invariant the threat model states as enforced by construction. Rewrite D11 element 4's inverted deny-list rationale in the same pass, and add an AC that asserts the emptiness directly.
3. **S1 (Systemic) — the assert-don't-establish pattern.** Third, and above the remaining Serious items, because it is the generator of F2, F3, F5, and F9 and is on its third consecutive round. Fixing the instances without fixing the pattern is what the last two rounds already did. Re-run every "this session" check against the artifact the design ships; delete or citation-back every attestation block; log the pattern in `docs/collapse-log.md` under class **unverified** so the next round inherits it rather than rediscovering it.
4. **F3 (Serious) — re-run Spike 1 as D11's command.** Directly closes three S1 instances and re-bases D10's latency derivation and D11's timeout on real numbers.
5. **F4 (Serious) — entailment bound in Move C.** The judgment core's central safety claim; the remedy is deterministic and buildable, and it should land before the plan freezes the Move-C interface.
6. **F5 (Serious) — repo identity.** Cheap to fix, and it silently corrupts FR-K9/AC-15 if it reaches the build.
7. **F6 (Serious) — Lane 2 call budget.** Design-level addition; the plan should not begin without it, since the budget shapes the Lane 2 worker's interface.
8. **F7, F8 (Moderate), then F9 (Minor).** F8 before F7 if the judgment lane is being touched anyway for F4.

Two notes for whoever applies these. First, `CLAUDE.md` requires **all** findings applied, not a prioritized subset — the ordering above is sequencing, not triage. Second, this review's own output should be committed: `docs/reviews/` is currently untracked, which is how round 1's inventory was lost and why six closures in this round could only be tentative.

---

Verdict: NEEDS FIXES (10 findings: 2 Critical, 4 Serious, 1 Systemic, 2 Moderate, 1 Minor)
