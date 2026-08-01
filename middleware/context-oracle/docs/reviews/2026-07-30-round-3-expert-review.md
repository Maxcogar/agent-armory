/root/.claude/skills/expert-review/SKILL.md — Version: R1.2 (2026-07-18)

# Expert Review — Context Oracle architecture, Round 3 (Post-fix)

**Artifact:** `middleware/context-oracle/docs/architecture-context-oracle.md` (2,738 lines) at working-tree HEAD (`4ef7e63`, branch `claude/context-oracle-query-core-szgyq5`).
**Review date:** 2026-07-30. **Round:** 3 (second Post-fix round).
**Prior rounds:** R1 = two independent passes over `e0343e7`, fixes at `c82ab2f`. R2 = two independent passes over `6dee4a7`, preserved in full at `docs/reviews/2026-07-30-round-2-expert-review.md` and `docs/reviews/2026-07-30-round-2-collapse-hunt.md`; 19 findings applied across `0e90cd3`, `fc3e710`, `c560ac7`, `56f1dbe`, `77c9d09`, `ae462fa`, `bffd089` (plus `4ef7e63`, STATUS only).

---

## Scope and Inventory

### Methodology overrides applied (recorded, at the project owner's direction)

Two overrides to SKILL.md were given with this invocation and are applied throughout. Both are recorded here so the delivered review's evidence standard is auditable.

**Override 1 — grep is not verification; search locates, reading verifies.** SKILL.md Step 2 permits a "Grep-verified" check-off, Step 6 prescribes grep for absence claims, and Gate B requires a grep query + result count as the evidence for absence findings. Those are **not** followed as written. Every absence or completeness claim below was established by **reading the relevant region**, with the read cited by file:line. Grep is used only to locate candidate regions, and where a count is quoted it is labelled as a locator, never as the evidence. Per finding, the review states whether the premise was *located-then-read* or *counted only*; no finding in this review rests on a count alone.

The override's own worked examples were re-confirmed rather than taken on report: the sentence *"the only relevance metric that matters"* is verbatim present at `RETHINK.md`:58–59, wrapping the line break (*"Marginal value over the agent's own abilities is the only relevance / metric that matters."*) — Read, not grepped.

**Override 2 — determine tool availability yourself.** No statement about instrument availability was accepted from the brief. The roster below was established by attempting each instrument. See the Step 3 tool plan.

### Round accounting and the artifact actually reviewed

The artifact is the current working-tree file, not any fix commit. `git log --oneline 6dee4a7..HEAD` returns eight commits; of these, six touched the architecture document (`fc3e710`, `c560ac7`, `56f1dbe`, `77c9d09`, `ae462fa`, `bffd089`), one touched only `RETHINK.md` + the spec (`0e90cd3`), and one touched only `docs/STATUS.md` (`4ef7e63`). **That distribution is itself load-bearing for finding R3-1** and was established by reading `git show --stat` for each commit, not inferred from the commit subjects.

### File inventory

Constructed by SKILL.md Step 2's Post-fix rule. All four sources exist this round. Round 2's inventory is inherited in full and extended.

**Source 1 — the prior reviews' inventories (inherited from `docs/reviews/2026-07-30-round-2-*.md`), re-verified this round:**

- [x] `docs/architecture-context-oracle.md` — **Read in full**, 2,738 lines across five contiguous passes (1–804, 805–1364, 1365–1924, 1925–2484, 2485–2738). Cited by line throughout.
- [x] `docs/specs/spec-context-oracle.md` — Read in full (1–500, 500–976). Premise source for Step 7.
- [x] `RETHINK.md` — Read in full (387 lines), including §12, the 2026-07-15 addendum, and the **2026-07-30 addendum (OWNER-12)** at lines 361–387.
- [x] `middleware/context-oracle/CLAUDE.md` — Read in full (auto-loaded, and re-read after an in-session modification added the "Don't hand the owner a decision that is already written" section at lines 83–110).
- [x] `docs/collapse-log.md` — 2026-07-30 entry Read in full at lines 226–347; entry located by reading the section headers.
- [x] `docs/IDEAS.md` — entry 13 Read at lines 72–79 (closure item for F9b).
- [x] `docs/STATUS.md` — 2026-07-30 entry Read in full at lines 1–95.
- [x] `docs/reviews/2026-07-30-round-2-expert-review.md` — Read in full (505 lines): findings F1–F9 + S1, Closure Ledger, Convergence Record.
- [x] `docs/reviews/2026-07-30-round-2-collapse-hunt.md` — Read in full (593 lines): collapses C1–C9, survivals S1–S4 incl. S2's correction.
- [x] `docs/reviews/README.md` — Read in full (39 lines); authority for round numbering.
- [x] `docs/reviews/2026-07-22-round-1-findings-RECONSTRUCTED.md` — provenance warning + header Read (lines 1–40).
- [x] `docs/judgment-layer-corrected-foundation.md` — not re-read this round; **no finding in this review rests on it**. Recorded as a scope limit rather than a silent omission. Its five criteria enter only via C1's closure, which is verified against D10 step 5a's text directly.

**Source 2 — the fix-diff file set** (`git log --oneline 6dee4a7..HEAD`, then `git show --stat` per commit):

- [x] `docs/architecture-context-oracle.md` (six commits) — the artifact; Read in full.
- [x] `RETHINK.md`, `docs/specs/spec-context-oracle.md` (`0e90cd3`) — Read in full.
- [x] `docs/collapse-log.md`, `docs/IDEAS.md` (`bffd089`), `docs/STATUS.md` (`4ef7e63`) — Read at the changed sections.

**Source 3 — dependents.** Not applicable: no code exists. Verified by directory listing of `middleware/context-oracle/` — `.claude/`, `.mcp.json`, `CLAUDE.md`, `RETHINK.md`, `docs/`; no `src/`, no `package.json`.

**Source 4 — prior findings as closure items.** All 19 round-2 findings (C1–C9, F1–F9, S1) re-derived from current source; see the Closure Ledger.

**External premise sources re-derived by execution this session (never accepted from the document):**

- [x] `claude --version` → **2.1.220**; `node --version` → **v22.22.2**; `ANTHROPIC_API_KEY` **not set**; host-managed markers present (`CLAUDE_CODE_PROVIDER_MANAGED_BY_HOST`, `CLAUDE_CODE_REMOTE`).
- [x] `claude --help` — `--tools`, `--disallowedTools`, `--bare` help text read verbatim.
- [x] **13 live `claude -p` invocations** across six configurations, outputs pasted in findings R3-2, R3-3, R3-8, R3-9 and in What's Actually Good.
- [x] `git rev-list --max-parents=0 HEAD`, `git rev-parse --is-shallow-repository`, `.git/shallow` on `Maxcogar/agent-armory`; plus a purpose-built full-vs-`--depth 1` clone pair.

No inventory item remains `[ ]` except the one scope limit named above, which is repeated in Tentative Findings.

### Step 3 tool plan

Instruments were established by attempting them, per Override 2.

| Claim type in scope | Required instrument | Available | Used |
|---|---|---|---|
| Absence / completeness claims | **Read of the region** (Override 1) | Yes | Every absence finding cites the region Read; grep used only to locate |
| Literal-content claims | Read at file:line | Yes | Read at drafting time, cited |
| CLI / harness-behaviour claims | Live execution | Yes (Bash) | 13 `claude -p` runs; `claude --help`; `claude --version` |
| Behavioural claims | Reproduction | Yes (Bash) | model-command matrix; git clone pair; tool-enumeration runs |
| Library-behaviour claims | Context7 | **Yes** (`mcp__Context7__resolve-library-id` / `query-docs` schemas loaded via ToolSearch) | **Not needed** — no finding this round rests on third-party library behaviour; `node:sqlite` claims were re-derived by round 2 and are not contested here |
| Structural / blast-radius claims | CodeGraph | **No** | **Not needed — no code exists.** Step 3 bright line applied, not assumed: zero source files, so no load-bearing claim category is stranded. No halt condition. |
| Claims imported from prior documents | Re-derivation via the underlying claim's instrument | Yes | Every closure item re-derived; see Closure Ledger |
| Claims written inside the artifact | Re-derivation from source — never accepted | Yes | Re-derived; **six failed** (R3-1, R3-2, R3-4, R3-5, R3-7, and the attestation block in R3-S1) |

**Structured-reasoning tools — availability determined by me.** `ToolSearch` was queried three times: `"metacognitivemonitoring collaborativereasoning clear thought structured reasoning"` → returned only `mcp__CORE_Memory__get_integration_actions`; `"+clear-thought reasoning"` → *"No matching deferred tools found"*; `"metacognitive monitoring knowledge assessment claim status"` → returned `Monitor`, `TaskStop`, `WebSearch`, `mcp__Asana__get_task_stories`, `mcp__github__enable_pr_auto_merge`. **No Clear Thought tool exists in this session.** Both mandatory invocations were therefore performed manually per SKILL.md line 84, and the tool's absence is recorded as a procedural observation.

*Manual `metacognitivemonitoring`, performed after scope was identified and before any finding was drafted.* Everything I "knew" about this document at review start came from the brief and the document's own text — all of it on the **inferred** side of the line, including every claim the document says it established this session. Consequence adopted for the whole pass: no premise from the artifact, the prior reviews, the collapse-log, or STATUS enters a finding without re-derivation. Specifically flagged as inferred-not-known at baseline, and each subsequently re-derived: (i) that the 19 round-2 findings were applied *to the architecture* — false for two of them; (ii) that Spike 1's pasted evidence reproduces — it does not; (iii) that the S1 attestation blocks were removed — three of the four survive in summary; (iv) that `--tools ""` empties the tool set — true, verified; (v) that `--bare` breaks auth — true, verified.

*Manual multi-perspective check (`collaborativereasoning` substitute), run before the Compliance Gates.* What each seat changed is recorded in Observations 2.

**Rigor waivers.** None. No compression of the process was requested; two methodology *overrides* were directed, both of which raise the evidence bar rather than lower it, and both are recorded above.

---

## Summary

**This review returns NEEDS FIXES.** The round-2 fixes are largely real and several are excellent — `--tools ""` is verified live to empty the judgment child's tool set, `--bare` is verified live to break host auth while its absence succeeds, the non-obviousness factor that C1 collapsed is now a computed quantity with a fixture, and the cross-consumer allocator, the model-call budget, the entailment bound and the trust-conditioned composition rule are all genuinely designed rather than named. But two of the nineteen findings were not applied to the artifact at all, and the document's three-round failure mode has survived the structural fix built to end it. The Critical is that **OWNER-12 — the owner's own ruling this session, the widened AC-3, and the new FR-O4a continuation bound — exist only in `RETHINK.md` and the spec; commit `0e90cd3` never touched the architecture**, so the artifact the implementation plan will consume still describes a shim with no `stop_hook_active` gate, an event envelope with no field to carry it, an audit record with no continuation entry, and an AC-3 fixture the spec itself now says "cannot see the continuation axis." Alongside it, Spike 1's headline evidence — the pasted command that the S1 replacement rule designates as the new foundation of the document's credibility — **does not reproduce**: run as pasted, with the `--system-prompt` the paste includes, `--max-turns 1` succeeded 6/6; `error_max_turns` reproduces only when that flag is omitted. That is the fourth consecutive round in which a load-bearing empirical certification in this document fails on re-derivation, and this time it is inside the evidence the fix pointed at as the replacement for the attestations it deleted.

---

## Upstream Contract Verification

Upstream artifacts exist: `docs/specs/spec-context-oracle.md` (FR-*, D-1..D-20, AC-1..AC-22, NF/C/P), `RETHINK.md` §12 + both addenda (OWNER-1..OWNER-12), and the project `CLAUDE.md` hard rules. The architecture is the object under review, not a second reference.

### Spec acceptance criteria

Only criteria whose status changed this round, or whose mechanism is contested, are re-derived in full; the remainder carry round 2's verified status, re-confirmed by Read at the cited architecture lines.

| AC | Status | Verification method |
|---|---|---|
| AC-1 coupling | Pass | Read arch:1564–1568 (FR-D5 ratio render), 1882–1896 (D17 storage) |
| AC-2 silence ≤10% | Pass | Read arch:2211–2215 (D26 replay layer 2) |
| **AC-3 no deny** | **FAIL — unchanged mechanism against a widened criterion** | Spec AC-3 Read at spec:867–876: widened 2026-07-30 to additionally assert (a) `stop_hook_active: true` → **silence** and (b) no extension beyond one continuation. The architecture's AC-3 is unchanged: Read arch:918–919 ("*no `permissionDecision`, no `decision`, no exit-2 path — the fields do not exist in the shim's response type*"), arch:2217–2218 ("*the shim response type contains no decision fields — compile-time + runtime scan*"), arch:2431 ("*AC-3's structural property established here*"). None covers the control-flow axis. → **R3-1** |
| AC-4 pristine tree | Pass | Read arch:2054–2059; the `SessionEnd` per-hook `timeout` byte is accounted for at arch:358–362 |
| AC-5 warning not block | Pass | Read arch:1566–1568 |
| AC-6 provenance | Pass | Read arch:1572–1576 (shared pointer-resolution gate) |
| AC-7 injection | Pass (as scoped) | Read arch:2219–2222; the C5 carrier (flagger configured to miss) is added at arch:1454–1458 |
| AC-8 zero ceremony | Pass | Read arch:2060–2063 |
| AC-9 false-fire | Pass | Read arch:2053–2054 |
| AC-10 degraded | Pass | Read arch:1970–1983, 2454–2459 |
| **AC-11 recursion guard** | **FAIL (fixture targets a superseded command)** | Read arch:2223–2225: the fixture is *"a real non-`--bare` `--disallowedTools` child call — **the actual shipped command**"*. Read arch:1186–1191: the shipped command is `--tools "" --disallowedTools …`. The fixture verifies the guard against a command the design does not ship — the exact defect R2's F3 named. → **R3-3** |
| **AC-11a tool emptiness** | **Weak instrument** | Read arch:1309–1314: the fixture asks the child *"to enumerate its own tools"* and fails if any name is returned. Re-derived live: the identical command returned **32** names on one run and **8** on the next. A model's self-description is not the harness's tool grant. → **R3-9** |
| AC-12 secrets | Pass | Read arch:1943–1951 (enumerated call sites) |
| AC-13 trust origin | Pass | Read arch:786–789 (DAO trust constraint) |
| AC-14 locality | Pass | Read arch:2222 |
| **AC-15 export round-trip** | **FAIL (mechanism still indeterminate on the dominant branch)** | Read arch:687–716. Rule 1 is now single and deterministic. Rule 2 is a **disjunction** — *"either `git fetch --unshallow` once … or falls back to `path-keyed` mode"* — and the two branches yield different store identities for the same repository. → **R3-6** |
| AC-16 / AC-16a | Pass | Read arch:1032–1036 (the non-obviousness replay fixture) |
| AC-17 staleness | Pass | Read arch:2021–2022 |
| AC-18 self-detection | Pass | Read arch:2016–2029 (seven self-checks) |
| AC-19 process conformance | **FAIL (no bindable store fact)** | Read arch:1701–1703: D14 states *"**`skill_expectations` table in D6**"*. Read D6's complete schema block, arch:744–782 — twenty tables, `skill_expectations` is **not among them**. → **R3-5** |
| AC-20 answer drift | Pass | Read arch:1726–1731 (deterministic bookkeeping, `open_questions` present at arch:780) |
| AC-21 / AC-21a subagent delivery | Pass | Read arch:1789–1818 (per-consumer dedup; six-consumer fan-out fixture) |
| AC-22 self-report | Pass | Read arch:2027–2029 |

### Owner-locked decisions and project hard rules

| Locked decision | Status | Verification method |
|---|---|---|
| **OWNER-12 (RETHINK §12 addendum, 2026-07-30) — Stop-time whispers kept, continuation bounded to one** | **NOT REFLECTED IN THE ARTIFACT** | OWNER-12 Read verbatim at `RETHINK.md`:361–387. The architecture was then **read in full**, all 2,738 lines: it contains no statement of the ruling, no `stop_hook_active` gate, no continuation bound, no raised Stop-grade bar, and no continuation record. The single token `FR-O4a` occurs once, at arch:1092, where it is mis-cited in support of a `StopFailure` contract fact. → **R3-1** |
| OWNER-3 / P2 / FR-O4 — no gates, no deny paths | **Honored in the deny-field sense; unbounded in the continuation sense** | Read arch:918–919: `decision`/`permissionDecision`/exit-2 are structurally absent — correct and unchanged. The continuation axis the spec now names is not bounded anywhere in the architecture. → **R3-1** |
| OWNER-7 — no separate credentials | **Honored** | `--bare` absent from D11's command block (Read arch:1186–1191). Reproduced independently: `--bare` → `is_error: true`, `"Authentication error"`; identical command without it → `is_error: false`, `'ORACLE-OK'`. No `ANTHROPIC_API_KEY` in env. |
| OWNER-6 / P8 — stores out of tree | Honored | Read arch:668–679, 2054–2063 |
| P3 — zero ceremony | Honored | Read arch:2060–2063 |
| OWNER-8 — subagents in v1 | Honored, and strengthened | Read arch:1792–1818 (allocator with reservation, reclamation, cross-consumer preemption) |
| OWNER-9 — conduct genres advisory, enabled | Honored in posture; **undeliverable in mechanism** | Read arch:1662–1677 (advisory, enabled by default) against arch:744–782 (no `skill_expectations`). → **R3-5** |
| OWNER-10 — self-observability | Honored, with one gap | Read arch:2016–2029. Self-check 6 compares whispers produced against **fire-and-forget** acks (Read arch:372) with no `delivery_confirmed` marking. → **R3-10** |
| CLAUDE.md — collapse test in writing on load-bearing decisions | **Honored** | Read: D10 element 4 (arch:1158–1174), D12 element 5 (arch:1516–1553), D24 element 5 (arch:2166–2178). All three are full collapse tests. |
| CLAUDE.md — "Keep documents in sync: a change to behavior updates the spec" | **VIOLATED in the reverse direction** | The spec and RETHINK were updated by `0e90cd3`; the architecture was not. Established by reading `git show --stat 0e90cd3`: two files, `RETHINK.md` and `docs/specs/spec-context-oracle.md`. → **R3-1** |
| CLAUDE.md — "Record every collapse in `docs/collapse-log.md` … cumulative across sessions" | **VIOLATED** | 2026-07-30 entry Read in full at collapse-log:226–347. Round 2's F1 — the finding that produced OWNER-12 and a spec change — appears nowhere in it; F3 is recorded as CRITICAL where round 2 classified it SERIOUS. → **R3-11** |
| CLAUDE.md — "When a review surfaces findings, apply **all** of them" | **VIOLATED** | Two of 19 not applied to the artifact (F1, and C2's D6 half). → R3-1, R3-5 |

### Spec design decisions governing the architecture

`[spec D-6]` (guard mechanism) — supplied by D11, Read arch:1242–1255. `[spec D-13]` (store layout) — confirmed by D5 but see R3-6. `[spec D-16]` (subagent delivery) — confirmed by D15, Read arch:1780–1790.

---

## Critical & Serious Findings

### R3-1 — CRITICAL (recurring). OWNER-12, FR-O4a and the widened AC-3 never entered the architecture; the artifact still specifies a design that cannot implement them

**What the document does now.** The architecture registers the shim for all eight events including `Stop` and `SubagentStop` (arch:313–314, 909–910), routes two Lane 1 genres to that event (*"stop → untouched partners + verify command (completeness, verification)"*, arch:961–962), states *"Whispers → `additionalContext` only"* (arch:1606), and asserts the no-deny property purely as field absence (arch:918–919). Nowhere does it acknowledge that `additionalContext` on those two events is a continuation control, gate emission on `stop_hook_active`, bound the continuation, raise the Stop-grade bar, or record the continuation.

**How that claim was verified — located-then-read, and read in full.** The absence is established by a **complete read of all 2,738 lines** of `docs/architecture-context-oracle.md`, performed in five contiguous passes this session, not by a grep count. The specific structural gaps were each confirmed by reading the region:

- **The envelope cannot carry the field.** D8's contract, Read at arch:863–882, enumerates the per-type payloads: `prompt: { text }`, `tool_pre/tool_post: { tool, input_summary, output_digest? }`, `session_start: { repo_root, transcript_path, harness }`, `subagent_start: { transcript_hint? }`. **There is no `stop` payload at all**, and no field anywhere in the envelope for `stop_hook_active`. The service therefore cannot observe the value FR-O4a gates on, so FR-O4a is not merely unstated — it is *unimplementable* in the contract as specified.
- **The shim has no gate.** D9's ordered behaviour list, Read at arch:909–919, is: guard var → parse → translate → connect/spawn → send → print if a whisper came back → exit 0. No per-event output-legality step.
- **The bar has no Stop grade.** D10 step 5's floor list, Read at arch:984–988: warn-grade floors, suggestion floor, cold-start floor, first-sessions clamp, §9.2 ladder state. Spec §6.1 requires *"A Stop-grade whisper must clear a **raised bar**"* (spec:228–230). Absent.
- **The audit record has no continuation entry.** D6's `whisper_log`, Read at arch:776–777: `(id, session, consumer, genre, ts, text, evidence_json, confidence, uptake, false_fire)`. Spec §6.1 requires *"Every Stop delivery is recorded as a continuation event in the FR-X6 audit record and counted in `ctxoracle status`"* (spec:231–233). Neither D6, D24's audit spool (arch:2124–2136), nor D22's `status` (arch:2050–2051) carries it.
- **The AC is the old one.** Read arch:918–919, 2217–2218, 2431 — three statements of AC-3, all the deny-field scan. Spec AC-3 (Read spec:867–876) now additionally requires the `stop_hook_active: true` → silence assertion and the one-continuation assertion, and says explicitly *"A criterion that scans only for the deny fields cannot see the continuation axis."*
- **The traceability matrix has no FR-O4a row.** Read arch:2465–2472: the rows run FR-O1, FR-O2, FR-O3, FR-O4, FR-O5, FR-O6. FR-O4a is absent, under a header that reads *"Every spec requirement, constraint, principle, §14 item, and AC accounted for"* (arch:2463).
- **The one occurrence is a mis-citation.** Read arch:1088–1092: *"Per the hooks contract that event fires instead of `Stop` … and has its output ignored — so it is a pure observation with no continuation risk (FR-O4a)."* The "output is ignored" fact is a §6.1 contract fact (spec:255–261). FR-O4a is the *continuation bound on `Stop` emission* (spec:327–334). The citation attaches the requirement's number to a different fact, which is how a requirement can appear present while being absent.
- **The cause.** `git show --stat 0e90cd3` Read: two files changed, `middleware/context-oracle/RETHINK.md` and `middleware/context-oracle/docs/specs/spec-context-oracle.md`. The architecture is not among them.

**Which standard it violates and why.** Three, all upstream and all named: **RETHINK §12 addendum decision 12 (OWNER-12)**, the owner's own ruling made this session, Read verbatim at RETHINK:361–387 — *"the oracle stays silent whenever `stop_hook_active` is true, so it can never chain continuations."* **Spec FR-O4a** (spec:327–334) and **spec AC-3 as widened** (spec:867–876). And the project `CLAUDE.md` engineering rule *"Keep documents in sync."* This matters more than a documentation lapse because of what the architecture is *for*: `CLAUDE.md`'s lifecycle makes the architecture the sole input to the plan (*"No implementation work before an approved architecture document … then a plan (executable steps consuming spec + architecture)"*). A planner consuming this document builds a shim with no continuation gate and an AC-3 fixture that passes while the oracle extends turns — which is precisely the state round 2 found, restored one artifact downstream. The owner accepted a **bounded** cost; the architecture as written implements an **unbounded** one.

**What correct implementation looks like.** All of this is agent work, not an owner question — `CLAUDE.md` lines 83–110 are explicit that a decision already written is not a question, and OWNER-12 is written. Concretely:
1. **D8** — add a `stop`/`subagent_stop` payload carrying `stop_hook_active: boolean`, and record it in the shim's Claude-Code field mapping (the shim is the only component permitted to know the harness field name, C-3).
2. **D9** — add the gate as an ordered step: on `stop`/`subagent_stop`, if `stop_hook_active` is true, emit silence unconditionally, before the whisper is even requested.
3. **D10 step 5** — add the Stop-grade raised bar to the floor list, with its default as a `tuning` row (D23) and its derivation stated.
4. **D6 + D24** — add `continuation INTEGER` (or an event-kind column) to `whisper_log` and to the audit spool record; D22's `status` reports the count in plain language.
5. **D26** — replace the AC-3 fixture description with the spec's widened form: a `Stop` event with `stop_hook_active: true` asserts silence, and no oracle output extends the loop by more than one continuation per stop.
6. **Traceability matrix** — add the FR-O4a row; correct the mis-citation at arch:1092 to cite §6.1 rather than FR-O4a.
7. Record the finding in `docs/collapse-log.md` (see R3-11), so the trap — *a channel the design classifies as inert is a control-flow axis* — is inherited rather than rediscovered.

**Provenance: recurring.** Round 2's F1, same standard (OWNER-3/FR-O4 no-deny, now sharpened into FR-O4a), same location (the Stop/SubagentStop delivery path). It was closed at the spec and owner level and never at the architecture level.

---

### R3-2 — SERIOUS (recurring). Spike 1's headline evidence does not reproduce; the pasted command and the pasted output do not correspond

**What the document does now.** Spike 1 point 1, Read at arch:106–123, is titled *"**The command as designed does not work at all.**"* It pastes:

```
$ claude -p '<judgment payload>' --model claude-haiku-4-5 --output-format json \
    --max-turns 1 --json-schema '<inline schema>' --system-prompt '<oracle block>' \
    --session-id <uuid> --disallowedTools "Bash,Read,Write,Edit,Glob,Grep,WebFetch,WebSearch,Task,NotebookEdit"
is_error = True    subtype = 'error_max_turns'    num_turns = 2
structured_output present: False
```

and concludes *"So `--max-turns 1` **guarantees** `error_max_turns` and returns **no verdict**. Had this shipped, every Lane 2 call would have failed."* The fix matrix (arch:144) records the same as a row labelled **(as designed)**. D11 restates it at arch:1218–1227 (*"the previously shipped command would have failed 100% of Lane 2 calls"*), the collapse-log repeats it at collapse-log:290–295, and `STATUS.md`:16–25 reports it to the owner as *"It fails. It returns an error and no answer, every time."*

**How that claim was verified — re-derivation by execution, running the command the design actually ships, flags and all.** Same CLI (`claude --version` → **2.1.220**), same environment class, same day. A real judgment payload (intent + one grounded co-change fact), a real inline verdict schema, a real oracle system-prompt block, a fresh `--session-id` per run.

| configuration | runs | `is_error` | `subtype` | `num_turns` | `structured_output` |
|---|---|---|---|---|---|
| `--max-turns 1` + `--tools ""` + deny-list + `--system-prompt` | 3 | **False** | `success` | 2 | **present** |
| `--max-turns 1` + deny-list only + `--system-prompt` — **the matrix's "as designed" row** | 3 | **False** | `success` | 2 | **present** |
| `--max-turns 1` + deny-list only, **`--system-prompt` omitted** | 2 | **True** | `error_max_turns` | 2 | **absent** |
| `--max-turns 2` + `--tools ""` + deny-list (the adopted config) | 4 | False | `success` | 2 | present |

Six of six runs of the command **as the document pastes it** — including its `--system-prompt` — succeeded and returned a verdict. `error_max_turns` reproduced only, and reliably, when `--system-prompt` was dropped: the one flag whose presence the paste asserts. The document's own italicised note that the *superseded* 2026-07-22 spike had "no `--system-prompt`" (arch:93–95) identifies exactly the variable that discriminates the two outcomes.

**Which standard it violates and why.** The project's dominating rule, `CLAUDE.md`: *"Never claim something works without having run it; paste the actual command and its actual output."* Its symmetrical form is what fails here — a claim that something *fails*, with a pasted command that does not produce the pasted failure. And the durable lesson round 1 wrote into `docs/collapse-log.md` and Spike 1's own rewrite quotes at arch:96–99: *"a re-run spike must exercise the **actual** design command, flags and all; never trust a premise whose validating command differs from the design's."* The rewrite applied that lesson to the flag set and then reproduced the same error on a different axis. Three specific claims are not established: *"does not work at all"*, *"`--max-turns 1` **guarantees** `error_max_turns`"*, and *"the invocation is structurally two turns **because** the verdict arrives as a tool call"* — the last is the stated mechanism, and it is contradicted by six successful two-turn runs under a one-turn cap.

This is not a defect in what the design **ships**: `--max-turns 2` works in 4/4 runs and is the safe choice regardless. The defect is that the document's most prominently rewritten evidence block, the one the Self-verification record names first as *"where the evidence for this round's re-derivations lives"* (arch:2281–2285), is not reproducible from what it prints — and it has already propagated verbatim into the collapse-log and into the owner-facing STATUS.

**What correct implementation looks like.** Re-run the matrix with `--system-prompt` present in every row, since the shipped command carries it, and record the system-prompt text (or its length and shape) alongside the flags — the discriminating variable must appear in the evidence. Fill the matrix's missing cell (`--max-turns 1` + `--tools ""`), which is the configuration the design would actually have shipped after the F2 fix. Then restate the conclusion in the form the evidence supports: *"`--max-turns 2` is adopted because the invocation consumes two turns and a one-turn cap is not robust across prompt shapes"* — not *"guarantees error_max_turns."* Correct the derived sentences at arch:1218–1227, collapse-log:290–295, and `STATUS.md`:16–25, since a false report to the owner is the failure `CLAUDE.md` calls "strictly worse than no work at all."

**Provenance: recurring.** Round 2's F3 and S1, same standard (`CLAUDE.md`'s run-it rule / premise-correctness), same location (Spike 1 / D11 element 5).

---

### R3-3 — SERIOUS (new). The F2 Critical fix did not propagate; three places still specify the demoted control, and the AC-11 fixture calls it "the actual shipped command"

**What the document does now.** D11 adopts `--tools ""` as the primary tool control with the deny-list behind it (Read arch:1186–1191, 1204–1216), and T4 is corrected accordingly (Read arch:2374–2384). Three other places were not updated:

- **D20's probe**, Read arch:1975–1977: *"The probe = the **D11 model-call shape (no `--bare`, with `--disallowedTools`)** with a trivial prompt."* This is the pre-fix shape. The probe is what decides whether the session runs in model mode at all, and it is specified to run a command with a non-empty tool set.
- **Build order element 9**, Read arch:2438–2439: *"Model client + recursion guard (**incl. `--disallowedTools`**) + degraded state machine (D11, D20)."* The build order names the demoted control as the thing to build.
- **D26's AC-11 fixture**, Read arch:2223–2225: *"recursion (AC-11: diagnostics counter during a real non-`--bare` `--disallowedTools` child call — **the actual shipped command**, since a non-`--bare` child does not skip hooks)."*

**How that claim was verified — located-then-read.** `--tools ""` was located across the document and **every occurrence read**: arch:135, 146, 147, 149, 155 (Spike 1), 1187, 1204, 1212, 1276, 1288, 1294, 1313 (D11), 2375 (T4). Thirteen occurrences, confined to three sections. The three regions above were then read in place and contain no reference to it.

**Which standard it violates and why.** **OWASP LLM01 least privilege** and **ASVS 5.0.0 V15**, the standards D11 element 4 itself names (Read arch:1256–1259, 1267–1281), where the document's own reasoning is that a deny-list *"permits every name it does not list, so each new tool the CLI ships is granted to the oracle's judgment child silently."* A probe specified to run the deny-list-only shape opens exactly that surface on every session start and on every `status --probe`. Worse, D26's phrase **"the actual shipped command"** is false as written — the shipped command is at arch:1186–1191 and carries `--tools ""` — and it re-creates round 2's F3 in the one acceptance criterion whose purpose is to verify the guard: *a fixture that validates a command the design does not ship*. Round 2's F3 was raised because the validating command differed from the design's; the fix rewrote the spike and left the fixture.

**What correct implementation looks like.** D20's probe: *"the D11 model-call shape (no `--bare`, `--tools ""` with the `--disallowedTools` deny-list behind it)."* Build order element 9: *"incl. `--tools ""` + deny-list."* D26's AC-11: describe the fixture as running the D11 command block **verbatim**, by reference to arch:1186–1191 rather than by re-listing flags — a fixture that re-lists flags will drift from the command again. Add the same by-reference discipline to AC-11a, which already gets this right (*"the fixture runs the shipped command verbatim"*, arch:1311–1313) — make AC-11 match it.

**Provenance: new.** No prior round reported it; it is created by the F2 fix's incomplete propagation.

---

### R3-4 — SERIOUS (new). The Knowledge-state baseline still certifies three facts the same document elsewhere states are false, and both of Spike 1's stated global corrections are unapplied

**What the document does now.** The section headed *"Knowledge-state baseline (metacognitive monitoring, 2026-07-22)"* — the document's own record of what is verified versus inferred — Read at arch:454–504:

- arch:456: *"**Facts (verified this session, with mechanism).** CLI **v2.1.218**"* — and again at arch:1557 (*"present in CLI v2.1.218 (captured)"*) and arch:2620 (*"Claude Code CLI surface (v2.1.218 `--help` + live invocations, captured 2026-07-22)"*).
- arch:459–460: *"Piggyback **with `--disallowedTools`** succeeds **single-turn** with no `ANTHROPIC_API_KEY` (Spike 1 re-run, pasted; **≈ 5.7 s wall**)."*
- arch:474–475: *"**Inferences (derived).** Synchronous model calls cannot fit NF-1 (**5.7 s measured** vs 1.5 s p95) → judgment is async."*
- arch:498–499: *"recency bias toward **v2.1.218's** observed contract."*

**How that claim was verified — located-then-read, then checked against the document's own corrections read in place.** Spike 1's rewrite, Read at arch:167–173, states two corrections in absolute terms:

> *"**The judgment call costs ≈ 10.5 s wall and ≈ $0.005, not 5.7 s.** **Every** derivation anchored on 5.7 s is re-based on 10.5 s"* … *"the 'single generate-no-tool turn' claim is **deleted wherever it appears**"*

D11 element 5, Read at arch:1282–1286, states: *"CLI is **v2.1.220**; the previous certification named v2.1.218, so the version drifted between rounds exactly as C-5 anticipates — every flag named here was re-checked against the installed help, not inherited."* I re-derived the version independently: `claude --version` → **2.1.220**. So the document contains, simultaneously, a section certifying v2.1.218 as a verified fact and a section stating that certification was superseded; a "5.7 s wall" fact and a statement that every 5.7 s derivation was re-based; and a "succeeds single-turn" fact and a statement that the single-turn claim was deleted wherever it appears. Neither global correction was applied to this section, and it was not touched by any of the six architecture commits.

**Which standard it violates and why.** This is a **first-principles articulation**, marked as such — no published standard governs "a design document's knowledge-state section must be internally consistent." *The goal:* the Knowledge-state baseline exists to separate what has been established from what is inferred, so a downstream reader can tell which premises need re-checking; the Self-verification record (arch:2273–2279) makes that separation the document's whole replacement for the deleted attestations — *"the per-decision element 5s are the only verification record, and they are auditable one claim at a time."* *The shortcut:* the corrections were applied at the point of the fix (Spike 1, D11) and stated as global, without walking the document for the other occurrences. *Why the shortcut fails the goal:* a reader who consults the section built to tell them what is verified is told three things that are false, in a section labelled "Facts (verified this session, with mechanism)" — which inverts the section's function. It is also the exact failure the Self-verification record diagnoses: the certifying sections are *"the sections a downstream reader trusts most and re-derives least."* Deleting four such blocks does not help if a fifth remains, uncorrected, under a different heading.

**What correct implementation looks like.** Update arch:456, 459–460, 474–475, 498–499, 1557 and 2620 to v2.1.220 and 10.5 s (or whatever figure survives R3-2's re-run), and delete "succeeds single-turn" as Spike 1 says it did. Re-date the section heading, which still reads 2026-07-22. Then — because "every X is re-based" is itself an attestation of the kind this document keeps getting wrong — replace both global sentences with the enumerated list of locations actually changed, so the claim carries its own audit.

**Provenance: new** as a finding; **the class is R3-S1's**, fourth consecutive round.

---

### R3-5 — SERIOUS (recurring). C2's fix is not closed at its load-bearing point: `skill_expectations` exists only as a sentence in D14 asserting that D6 contains it

**What the document does now.** D14's C2 fix, Read at arch:1694–1706, lists three changes, the second of which is:

> *"2. **`skill_expectations` table in D6** — `(session, consumer, skill_ref, step_text, required_activity, prov_*)`, written by the narration reader. Process now has a bindable, auditable, evictable fact, and its evidence appears in the FR-X6 audit record like every other whisper's."*

**How that claim was verified — located-then-read.** `skill_expectations` was located in the document: **one occurrence, arch:1701**, the sentence above. I then **read D6's complete schema block at arch:744–782** rather than relying on the count. The block declares twenty relations: `schema_meta`, `files`, `symbols`, `ref_edges`, `test_map`, `verify_commands`, `commits`, `cochange_file_pairs`, `cochange_symbol_pairs`, `exemplars`, `landmines`, `invariants`, `invariant_members`, `recipes`, `human_facts`, `session_log`, `whisper_log`, `suppressions`, `open_questions`, and the `fts_*` virtual tables. **`skill_expectations` is not among them.** D15's Tier 3 list (Read arch:1780–1785) does mention "skill expectations" as in-memory state — which is the condition C2 identified as the problem, not its fix.

**Which standard it violates and why.** The upstream contract is **spec FR-A8 and AC-19** (Read spec:448–456, 929–933), which require a Process whisper *"naming the specific step, with a pointer to the governing line."* The architecture's own rules make that undeliverable without the table: D12 Move C drops any whisper whose claim does not bind to *a supplied fact whose pointer resolves against the current store* (Read arch:1377–1382), and D13's assembly gate repeats it (*"every pointer must resolve against the store at assembly time or the whisper is dropped"*, Read arch:1572–1574). Beyond the requirement, this is the **document-integrity** standard that a cross-reference must resolve — the same standard round 2's F9b applied to the IDEAS-ledger citation, which *was* fixed (IDEAS entry 13 Read at IDEAS:72–79). Here the cross-reference points at the schema that will be built: build order element 2 is *"`stores/` adapter + schemas + DAOs + writer worker (D4–D7, D24) — provenance constraints in from the first migration"* (Read arch:2421–2423). An implementer building D6's schema creates twenty tables. The Process genre then fails at fixture time and gets *"quietly descoped or forced through by an implementer inventing a grounding exception inline"* — which is the collapse-hunt's own predicted outcome for C2, verbatim (collapse-hunt:167–171).

It is also, precisely, the pattern the collapse-log's 2026-07-30 entry tells the next round to hunt for (collapse-log:328–332): *"a citation that lands on a design intent, a schema column, or a component name rather than on a per-candidate computation with named inputs is an unfilled requirement wearing a reference."* The fix for C2 is itself an instance of C2's class.

**What correct implementation looks like.** Add the relation to D6's schema block, beside `open_questions`, in the same DDL style and under the same provenance rules:

```
skill_expectations(id, session, consumer, skill_ref, step_text,
        required_activity, registered_at, satisfied INTEGER DEFAULT 0, …prov)
```

with `prov_kind='session'`, `prov_ref='transcript:<session>:<offset>'`, `trust='mechanical'` per D14's session-evidence fact class (arch:1695–1700), and add the transcript-offset resolver to D13's assembly gate explicitly — D14 says it does, so verify that D13's gate text names it (Read arch:1572–1576: it currently names pointer resolution generically and does not enumerate the resolvers; naming them there is the cheap fix). Then re-check the same seam for the sibling case: `open_questions.asked_loc` is a transcript location in a store table whose resolver is likewise unnamed at D13.

**Provenance: recurring.** Round 2's collapse-hunt C2, same standard (FR-A8/AC-19 deliverability through the grounding gates), same location (D14/D6). The fix was applied in D14 and not in D6.

---

## Systemic Patterns

### R3-S1 — SYSTEMIC (recurring, **fourth consecutive round**). Load-bearing claims are certified without the check being run — and the pattern has now survived the structural fix built to end it

**The proactive scan across the full inventory scope.** Per Override 1, grep was used **only to locate candidates**; every instance below was then **read in place** and re-derived. The locators run over `docs/architecture-context-oracle.md`: `by construction` → 9 candidate sites; session-verification phrasing (`verified/established/pasted/captured … this session`, `reproduced 3/3|4/4`) → 18 candidate sites; totality phrasing (`is total over`, `Every spec requirement`, `complete set`, `accounted for`, `each verified`, `verified present`) → 8 candidate sites. All 35 candidate sites were read. The instances that **fail** on re-derivation:

1. **arch:2727–2730 — a summary attestation block survives, byte-identical to the pre-fix baseline, in direct contradiction of the fix's own standing instruction.** Read in place:

   > *"**Before-delivery gates (re-run after Round-2 fixes):** Gate A (three-role review) — pass; Gate B (auditability) — pass; Gate C (structural checklist) — pass; five-trap audit — clean; the load-bearing decisions (D10, D12, D24) carry a written collapse test, each verified present in the body."*

   The Self-verification record installed by the S1 fix, Read at arch:2249–2292, states that four blocks were removed — *"a Phase 8 attestation, Gate B (auditability), Gate C (structural checklist), and a five-trap binary audit"* — that *"there is deliberately **no block here that certifies the document as a whole**"*, and closes with: *"**Standing instruction for the next round.** Do not restore a summary attestation block. **If one appears in a future draft, treat it as a finding on sight.**"* Three of the four named blocks are re-attested, in summary, three sections later. I verified it was untouched by the fix rather than newly written: the same four lines Read from `git show 6dee4a7:middleware/context-oracle/docs/architecture-context-oracle.md` at its line 2239 are **character-for-character identical** to the current arch:2727–2730. The S1 fix deleted the blocks and left the certificate. Its final clause — *"each verified present in the body"* — is the exact sentence shape round 1 caught (a Gate-C attestation of a D24 collapse test that did not exist); the three collapse tests do in fact exist (Read arch:1158–1174, 1516–1553, 2166–2178), so the claim happens to be true, which is what makes the format the problem rather than the author.

2. **arch:106–123, 144 — Spike 1's headline evidence does not reproduce.** Six of six runs of the pasted command succeeded. (R3-2, evidence pasted there.)

3. **arch:454–504, 1557, 2620 — the Knowledge-state baseline certifies v2.1.218, "succeeds single-turn", and 5.7 s**, all three of which the same document states elsewhere are superseded. (R3-4.)

4. **arch:2463 — *"Every spec requirement, constraint, principle, §14 item, and AC accounted for."*** Read the matrix rows at arch:2465–2530 against the spec's requirement list Read at spec:310–348: **FR-O4a has no row**. The header claim is false, and it is false about the requirement that encodes the owner's own ruling. Note the exact recurrence: round 2's F9a corrected the *Status* sentence's totality claim and explicitly observed that *"the matrix's own header does not claim judgment coverage"* — the header's other totality claim was left standing and is now the false one.

5. **arch:128–137, 1290–1291, 2378–2380 — "eight remaining tools" understates the deny-list's residual by 4×, and omits its worst members.** Read in place: Spike 1 point 2 pastes eight names (`Artifact / ReportFindings / ScheduleWakeup / SendUserFile / ShowOnboardingRolePicker / Skill / ToolSearch / Workflow`); D11 element 5 repeats *"the child enumerates **eight remaining tools**"*; T4 repeats *"that deny list left eight tools available"*; D11 element 4 calls it *"The empirical form of the error."* Re-derived by execution, D11's exact ten-name deny list, two consecutive runs: **32 names** then **8 names**. The 32-name run:

   ```
   Artifact, ReportFindings, ScheduleWakeup, SendUserFile, ShowOnboardingRolePicker,
   Skill, ToolSearch, Workflow, CronCreate, CronDelete, CronList, DesignSync,
   EnterWorktree, ExitWorktree, ListConnectors, ListPlugins, ListSkills, Monitor,
   PushNotification, SearchMcpRegistry, SearchPlugins, SearchSkills, SendMessage,
   SuggestConnectors, SuggestPluginInstall, SuggestSkills, TaskCreate, TaskGet,
   TaskList, TaskOutput, TaskStop, TaskUpdate
   ```

   Round 2's F2 pasted 31 and named the categories that made it Critical — agent spawning (`TaskCreate`/`TaskStop`/`TaskUpdate`), scheduled execution (`CronCreate`), outbound messaging (`SendMessage`, `PushNotification`), filesystem-affecting (`EnterWorktree`/`ExitWorktree`). The architecture, in applying F2, recorded a single low sample and dropped every one of those categories. The consequence is not cosmetic: D11 element 4 justifies retaining the deny-list *"so that a future CLI change to `--tools` semantics degrades to a partial control rather than to none"* (Read arch:1214–1216), and a deny-list that leaves `TaskCreate` and `CronCreate` is not partial control against T4's stated threats.

6. **arch:687–696, 727–736 — "six root commits" are six *shallow-boundary* commits.** Read in place: D5 argues the multiple-root case is *"not an edge case: run on `Maxcogar/agent-armory` itself, `git rev-list --max-parents=0 HEAD` returns **six** commits."* Re-derived: `git rev-parse --is-shallow-repository` → **true**; `.git/shallow` contains six hashes; the set is **identical** to the `rev-list --max-parents=0` output (verified by `diff` of both sorted sets → no differences). (R3-7.)

7. **arch:1701 — a cross-reference to a D6 table that D6 does not contain.** (R3-5.)

**Instances that hold on re-derivation**, so the pattern is emphatically not universal: `--tools ""` returns `NONE` under the shipped flag pair (executed); `--bare` fails auth 2/2 and the identical command without it succeeds (executed); `--json-schema` rejects a file path with the exact quoted error `Unrecognized token '/'` (executed); the `--tools` help string is verbatim as quoted (*"Use `""` to disable all tools"*, read from `claude --help`); the three collapse tests are present; the D2/D3/D4 matrix arithmetic and the phase-exit AC assignments were verified by round 2 and are unchanged by the fix diff; T1's explicit refusal to claim elimination (Read arch:2320–2336) is honest and correct.

**The named standard.** The project's dominating rule in `CLAUDE.md`: *"Never claim something works without having run it; paste the actual command and its actual output… A falsely reported success is the worst failure this project can have — strictly worse than no work at all, because it poisons every decision built on it."* Together with the `expert-standard` observation axis: a factual claim stated from the artifact's own commentary is not a verified premise.

**Why this is systemic rather than isolated, and why it is worse this round.** The document's own record, Read at arch:2262–2271, states the pattern's history: 2026-07-17 condemned for eleven findings sharing this root cause; round 1 found it again; round 2 found eight instances. Round 2's remedy was explicitly **structural rather than another attestation** — delete the certifying blocks, attach evidence inline at the point of use, and treat any future summary attestation as a finding on sight. This round finds seven instances, and their distribution is the diagnosis: one is a summary attestation block that the fix *did not remove* (instance 1); three are in the inline evidence the fix designates as the replacement (instances 2, 5, 6 — Spike 1's runs, the tool count, the git runs); one is in the section whose job is to record what is verified (instance 3); two are cross-references that do not resolve (instances 4, 7). **The fix relocated the pattern from the certification sections into the evidence sections.** That is a strictly harder failure to catch, because inline evidence is what a reader checks *instead of* re-running, and it is why this round's instances required thirteen live invocations and a git experiment to surface rather than a reading of one section.

**What correct looks like.** Three changes, in order:
1. **Delete arch:2727–2730 outright**, per the document's own standing instruction, and add a one-line pointer to `docs/reviews/` as the review record of record. Any "gates passed" statement belongs in the review file, which is signed by the reviewer, not in the artifact, which is signed by the author.
2. **Make each pasted evidence block self-auditing**: record the *full* command including every flag and the environment scrub, the number of runs, and the observed variance — not a single representative sample. Instances 2, 5 and 6 would all have been caught at authoring time by "run it three times and print all three."
3. **Convert the two global correction sentences** at arch:167–173 (*"every derivation … is re-based"*, *"deleted wherever it appears"*) into enumerated location lists. A global claim about a 2,700-line document is an attestation; a list of line references is evidence.

---

## Moderate & Minor Findings

### R3-6 — MODERATE (regression, introduced by the F5 fix). D5's shallow branch is a two-rule disjunction — the same defect F5 raised, reintroduced on the branch D5 itself calls dominant

**What the document does now.** Read arch:698–711. Rule 1 is now single and determinate (*"**One rule: the lexicographically smallest root-commit hash.** 'First line' is deleted."*) — F5's primary defect is correctly closed. Rule 2 is not: *"`init` runs `git rev-parse --is-shallow-repository` and, when true, **either** `git fetch --unshallow` once … **or** falls back to `path-keyed` mode with `status` saying so plainly."*

**How that claim was verified — read in place**, arch:698–711, and the two branches' consequences re-derived by execution: on `Maxcogar/agent-armory`, `is-shallow` → **true**, so this is the branch that fires on the repository D5 uses as its own example. The branches are not equivalent: `--unshallow` yields a commit-keyed store; `path-keyed` yields a path-keyed store, which D5 element 4 rejects as *"breaks on every container rebuild."* Two implementers reading the same sentence produce different store identities for the same repository — which is exactly what F5 said must not happen (*"an implementer following D5 got a different store depending on which sentence they read"*, arch:694–696).

**Standard.** Spec **FR-K9** and **AC-15** (Read spec:394–397, 915–916) — the round-trip must land in the same identity — plus the general engineering standard that an architecture resolves the choices a plan would otherwise make inline (`CLAUDE.md` lifecycle: *"Writing code straight from the spec means the builder invents architecture inline"*). A secondary conflict: `git fetch --unshallow` is a network fetch, and **C-1** (Read spec:708–715) and **NF-3** (spec:675–677) permit *"no network beyond what the harness already has"* — the document does not say what happens when the unshallow fails offline, which is the sandbox case C-1 exists for.

**Correct implementation.** Pick one rule and state its failure branch. The rule that satisfies C-1 unconditionally: **on a shallow repository, do not derive a commit key** — attempt `git fetch --unshallow` only if a remote is reachable *and* the fetch is already permitted, and on any failure or refusal fall back to `path-keyed` with `status` saying so. That is one rule with a deterministic outcome, and it keeps the network step optional rather than load-bearing.

### R3-7 — MODERATE (new). D5's motivating evidence demonstrates the shallow case, not the multiple-root case it is cited for

**What the document does now.** Read arch:689–696: *"two different commits whenever a repository has more than one root, **which is not an edge case**: run on `Maxcogar/agent-armory` itself, `git rev-list --max-parents=0 HEAD` returns **six** commits."* Read arch:727–736: the premise-verification element repeats it as *"returns **six** commits, not one."*

**How that claim was verified — by execution.** `git rev-parse --is-shallow-repository` → `true`. `.git/shallow` contains six hashes. `diff <(sort .git/shallow) <(git rev-list --max-parents=0 HEAD | sort)` → **no differences**: the six commits are precisely the shallow-boundary set. `Maxcogar/agent-armory` has **zero demonstrated true roots**; its root set is unobservable from this clone. I re-derived the shallow behaviour independently on a purpose-built pair (5-commit full repo, `--depth 1` clone): full root `20d0e606…`, shallow-clone result `044da9ab…` — different, `is-shallow` true only on the clone. D5's shallow premise is correct; its multiple-root premise is not evidenced.

**Standard.** `CLAUDE.md`'s engineering rule that *"external facts … are verified against current primary sources before you build on them"* — the observation was made but mis-attributed to the wrong cause. It matters because the mis-attribution sets the priority: it presents the multiple-root rule as addressing a common case ("not an edge case") when the observed case is shallowness, which rule 2 handles and which R3-6 leaves indeterminate. A reader allocating scrutiny follows the argument's emphasis.

**Correct implementation.** Restate: *"On `Maxcogar/agent-armory`, `git rev-list --max-parents=0 HEAD` returns six commits — these are the clone's shallow-boundary commits (`.git/shallow`, `is-shallow-repository` → true), not roots. This demonstrates rule 2's case. The multiple-root case that rule 1 addresses is real but is not evidenced here."* Keep rule 1 — it is correct on its own merits (traversal order is not a specified property of `git rev-list`) — but source it to that argument rather than to this observation.

### R3-8 — MODERATE (new). Deny-lexicons are load-bearing safety boundaries in D12, one decision after D11 concludes deny-lists are the wrong shape for exactly this job

**What the document does now.** Move C's content bound, Read arch:1409–1421, rests on three controls, of which two are enumerated deny-lists: *"**Epistemic-strength lexicon.** Reject claims asserting a property the fact does not carry — *stable, standard, always, never, not accidental, proven, guaranteed*"*, and (Read arch:1427–1430) *"an imperative-construction **deny-lexicon** rejects commands."*

**How that claim was verified — read in place, then reproduced.** Running D11's shipped judgment command with a single supplied fact (*"src/state/store.ts co-changed with src/routes/SettingsPage.tsx in 16 of last 20 commits"*, `trust: mechanical`), the model returned, both claims bound to `grounding_id: 1`:

> *"Any edit to src/state/store.ts adding a settings flag will **almost certainly** require paired updates to src/routes/SettingsPage.tsx to wire the flag into the UI"* · *"The agent's intent states 'wire it up' but the plan only mentions editing the store file, not the SettingsPage component"*

and `so_what`: *"The agent **should** plan to edit both … **rather than** discovering mid-implementation…"*. **"almost certainly"** is an epistemic-strength escalation over an 80% frequency and is **not in the enumerated lexicon**. (The `so_what` is directive as F8 predicted; the F8 fix — strip the clause, keep the claims — is correctly in place at arch:1459–1473 and handles it.)

**Standard.** **OWASP LLM01 least privilege** and **ASVS 5.0.0 V15**, both named by the document itself, and the document's own reasoning at arch:1267–1281: *"a deny-list permits every name it does not list… Least privilege in every source this decision cites — OWASP LLM01, ASVS V15 — is default-deny with an explicit allow-set."* That reasoning is correct and is applied to the CLI's tool surface; the identical shape is then adopted, one decision later, as the control on what the model may assert. A deny-lexicon is definitionally incapable of rejecting an epistemic intensifier it does not enumerate, and natural language has an open set of them.

**Correct implementation.** The document already contains the default-deny form and should lean on it: control (1), the **slot-filled per-genre template**, is an allow-list — the model chooses phrasing *within* the template. Make it the primary control and state the lexicons explicitly as defence in depth, mirroring D11's own `--tools ""`/deny-list layering, and say so in the same words so the parallel is visible. Then state the residual honestly: within a slot, wording is model-chosen and the lexicon is heuristic — the same honesty T1 already applies to the injection residual.

### R3-9 — MODERATE (regression, introduced by the F2 fix). AC-11a asserts the tool-emptiness property from the model's self-report, and the self-report is demonstrably unstable

**What the document does now.** Read arch:1309–1314: *"**AC-11a**: the judgment child, **asked to enumerate its own tools**, returns none; the fixture runs the shipped command verbatim, including `--tools ""`, and fails if any tool name is returned."* T4 restates it at arch:2371–2373.

**How that claim was verified — by execution.** Two consecutive runs of the identical enumeration prompt under D11's deny list returned **32 names** and then **8 names**. The measurement varies by 4× with no change to the command. Under `--tools ""` the child returned `'NONE'` — which is the desired answer, but from the same instrument.

**Standard.** A **first-principles articulation**, marked as such. *The goal:* AC-11a exists because, as D11 puts it, *"without it, T4's 'empty by flag' claim has no test and would drift back to prose"* — the criterion must observe the property. *The shortcut:* ask the child what tools it has. *Why the shortcut fails the goal:* the child's answer is model-generated text about its own configuration, not the configuration. A model that under-reports passes a fixture over a non-empty tool set — which is, precisely, how "eight tools" came to be recorded when 32 were available (R3-S1 instance 5). The test and the defect share a root cause.

**Correct implementation.** Assert on the harness's own output rather than the model's narration. The `claude -p --output-format json` envelope carries `permission_denials` (observed empty in all runs this session) and per-iteration usage; a fixture that instructs the child to *use* a named tool and asserts the run completes with no `tool_use` iteration and no denial observes the mechanism. Keep the enumeration prompt as a secondary signal, and state in AC-11a that it is a self-report — an AC that names its own instrument's limits is the honest form.

### R3-10 — MODERATE (recurring). The round-2 collapse-hunt's S2 correction was not applied; self-check 6 still cannot distinguish a lost ack from an undelivered whisper

**What the document does now.** Read arch:372: the shim *"writes a **fire-and-forget** delivery ack to the service."* Read arch:2022–2023: self-check *"(6) *delivery reconciliation* — whispers produced vs shim acks; missing acks ⇒ 'produced but not delivered'."* `whisper_log`, Read at arch:776–777, carries no `delivery_confirmed` column, and D24's audit spool record (arch:2124–2136) carries none either.

**How that claim was verified — located-then-read.** `delivery_confirmed` was located across the document: **no occurrences**; `delivery ack` / `shim acks` located at arch:372 and 2023, and both regions read in place. The round-2 collapse-hunt's correction was read at collapse-hunt:515–524: *"mark audit records `delivery_confirmed` from the ack, render unconfirmed records distinctly in `ctxoracle log`, and retry the ack once — otherwise self-check #6 generates findings the owner cannot act on."*

**Standard.** Spec **FR-M2** (Read spec:584–589) — `status` must surface *"current health and recent anomalies in plain language readable by a non-programmer"* — and **OWNER-10**. A self-check whose instrument (a fire-and-forget ack) fails in the same way as the condition it monitors (undelivered whisper) produces findings that cannot be acted on, in the one channel the owner reads. In a project whose first rule is that the owner cannot catch mistakes, a false-positive generator on the owner's channel degrades the only signal he has.

**Correct implementation.** Apply the correction as written: mark the audit record `delivery_confirmed` from the ack; render unconfirmed records distinctly in `ctxoracle log`; retry the ack once. Note this correction sat outside round 2's counted 19 — it appears under a decision the collapse-hunt marked SURVIVES — which is how it was missed; state in the collapse-log that corrections attached to survivals are apply-items too.

### R3-11 — MODERATE (new). The collapse-log's 2026-07-30 entry omits round 2's F1 entirely and mis-grades F3

**What the document does now.** The entry was **Read in full** at collapse-log:226–347. Its *"Also caught by expert-review"* subsection (collapse-log:289–303) lists five items: `--max-turns 1` (labelled **CRITICAL**), `--disallowedTools` (CRITICAL), repo identity, `SessionEnd`'s budget, and the `so_what` regression. **F1 — the Stop/SubagentStop continuation finding — is not in the entry.** Round 2's own classification, Read at review:138 and 202, is F1 **CRITICAL**, F2 **CRITICAL**, F3 **SERIOUS**.

**How that claim was verified — read in full**, not counted: the entire 2026-07-30 entry, all 122 lines.

**Standard.** `CLAUDE.md`: *"**Record every collapse in `docs/collapse-log.md`** — the decision, the question that collapsed it, the class of hollowness, the fix. It is **cumulative across sessions**; read it before designing, so the recurring traps are inherited, not rediscovered."* F1 is the single most consequential finding of round 2 by the project's own accounting: it went to the owner as a question, produced OWNER-12, and changed the spec in four places. Its omission means the next agent designing in this area inherits neither the trap nor the ruling — and this round's Critical is that exact outcome, one artifact over.

**Correct implementation.** Add F1 to the 2026-07-30 entry with its collapse question (the verbatim hooks.md wording), its class (**unverified/overclaim** — a channel classified as inert is a control-flow axis), its resolution (OWNER-12, with the link to `RETHINK.md`:361–387), and the residual that R3-1 names. Correct F3's grade to SERIOUS. Add the standing lesson: *when a finding produces an owner ruling, the ruling lands in every artifact the lifecycle consumes, not only in the one where the question was raised.*

### R3-12 — MINOR (new). Two different finding sets are both labelled "Round 2" inside the same document

**What the document does now.** Read arch:14–22: *"**Round 2 (2026-07-22, applied).** … They found a **Critical** (the D11 model command used `--bare`…)"*, and arch:2694–2725: *"**What the independent Round-2 passes changed (2026-07-22, all applied).**"* Both describe the 2026-07-22 passes. Meanwhile the inline fix notes label the 2026-07-30 findings *"round 2"* throughout — Read at arch:352 (*"finding F7, round 2"*), arch:827 (*"Collapse C7, round 2"*), arch:1204 (*"Critical F2, round 2"*), arch:1383 (*"finding F4, round 2"*), arch:1435, 1462, 1680, 1745, 1792.

**How that claim was verified — located-then-read**, both header regions and a sample of nine inline labels read in place. The authority is `docs/reviews/README.md`, Read in full: *"Rounds count passes over the current artifact… **Round 1 is the first pass over the rebuilt document**"* — i.e. the 2026-07-22 passes are round 1.

**Standard.** The project's own review-of-record convention (`docs/reviews/README.md`), whose stated purpose is that a later round can perform closure against the prior round's findings. A document in which "round 2" denotes two disjoint finding sets defeats that.

**Correct implementation.** Relabel arch:14 and arch:2694 to "Round 1 (2026-07-22)" and the inline notes stay "round 2", matching `docs/reviews/`. One pass, purely mechanical.

### R3-13 — MINOR (regression, introduced by the F3 fix). D11's 30 s kill is sized against the mean, and the measured tail is 1.7× under it

**What the document does now.** Read arch:1199–1202: *"Timeout: **30 s** process kill — measured mean is 10.5 s (Spike 1, 2026-07-30), so 30 s is ~3× headroom."*

**How that claim was verified — by execution.** Six runs of the adopted configuration (`--max-turns 2 --tools "" --disallowedTools …`, inline schema, system prompt, fresh session-id), three with the environment scrubbed per D11: wall **13.1, 17.4, 11.4, 11.8, 12.2, 14.0 s**; mean **13.3 s**, max **17.4 s**. The document's own three runs (10.06–11.43 s) sit at the low end of that spread. At the observed max, headroom is **1.7×**, not 3×.

**Standard.** Standard practice for sizing a process-kill timeout: derive it from the latency distribution's tail (p99 or observed max plus margin), not its mean — the timeout's whole job is to bound the tail. The consequence here is specific and stated by the document itself: a Lane 2 timeout counts as a failure (Read arch:1047–1048, *"Lane 2 failures increment the degraded counter (D20)"*), and three consecutive failures enter degraded mode (Read arch:1972–1974). A timeout sized on the mean converts a slow-API episode into a mode transition.

**Correct implementation.** State the timeout's basis as the observed maximum plus margin over a run count that is recorded (e.g. *"max observed 17.4 s over n runs; 30 s ≈ 1.7× the tail"*), or raise it. Either is fine; asserting 3× from a mean is not. This also feeds D14's delivery-lag measurement, which D26 is already tasked with (arch:1756–1759) — fold the timeout's basis into that measurement rather than fixing it by hand.

---

## Tentative Findings

**One scope limit, no tentative findings.** `docs/judgment-layer-corrected-foundation.md` was on round 2's inventory and was **not re-read this round**. No finding in this review rests on it: C1's closure is verified against D10 step 5a's own text (arch:990–1036) and against the RETHINK sentence it cites, Read at RETHINK:58–59. The verification that would close this gap is a full read of that file to confirm that D10 step 5a's rendering of criterion 2 ("non-obvious: something a cold checkout can't reveal and the agent can't trivially self-serve") is faithful to the anchor's wording; the architecture quotes it and the quotation is consistent with RETHINK §2.3, which is why the gap is recorded rather than left open as a finding.

Every other candidate finding's premise was verified per Compliance Gate B — by Read at a cited file:line, by reading the full region for absence and completeness claims per Override 1, or by live execution with the command and output recorded.

---

## Observations

*(No standard violation and no severity classification attaches to any entry here.)*

1. **Procedural — the two mandatory structured-reasoning tools are not present in this session.** Determined by three `ToolSearch` queries (recorded in the Step 3 tool plan), not taken on report. Both invocations were performed manually per SKILL.md line 84; the metacognitive baseline is written out in the tool plan, before any finding was drafted.

2. **What the manual multi-perspective pass changed.** *Standards-discipline seat:* required R3-2 to be stated as "the pasted command does not produce the pasted output, and the discriminating variable is `--system-prompt`" rather than "the document's conclusion is wrong" — the shipped choice (`--max-turns 2`) is safe either way, and conflating an evidence defect with a design defect would have overstated it. It also required R3-8 to rest on a reproduced example rather than on the abstract shape argument alone. *Downstream-consumer seat (the agent that will act on this verdict):* required R3-1 to state explicitly that **it is not an owner question** — OWNER-12 is already ruled, and `CLAUDE.md`:83–110 names re-asking a written decision as the project's most persistent failure, repeated three times in one session on 2026-07-30. Without that sentence the most likely response to a Critical touching an owner decision is to escalate it. *Implementer seat:* required R3-5 to give the DDL, R3-3 to name the three exact lines, and R3-6 to name **one** rule rather than a menu — and surfaced the C-1 conflict in the `--unshallow` branch, which changes which rule is correct.

3. **The document's honesty remains unusually good where it is good, and the fixes are not cosmetic.** D20's Caveat 6 still refuses to let Phase 0 claim the mission (arch:1984–1993); T1 still refuses "eliminated by construction" and names its residual (arch:2320–2336); D12's entailment fix explicitly narrows its own guarantee — *"Until (1)–(3) exist, the guarantee this decision may state is the narrow, true one"* (arch:1423–1426) — which is the correct move and the opposite of the S1 pattern; D14 restates its ship recommendation as **provisional** (arch:1764–1768). The C1, C3, C4, C5, C6, C7, C8 fixes are all real mechanisms with named inputs, not prose. This is worth recording because it sharpens R3-S1: the overclaiming is not diffuse, it is concentrated in evidence and certification text, and the design prose has largely stopped doing it.

4. **The environment scrub does not break the piggyback — a premise the document never tested.** D11's guard layer 3 specifies running the child with the environment *"scrubbed of `CLAUDE_CODE_*`/`CLAUDECODE`"* (arch:1249–1252), while Spike 1 explicitly ran with `CLAUDE_CODE_PROVIDER_MANAGED_BY_HOST=1` present (arch:101–103). In a host-managed environment with no `ANTHROPIC_API_KEY`, whether auth survives that scrub is a real question and the document does not answer it. I ran it: 30 `CLAUDE_CODE_*` variables plus `CLAUDECODE` unset, `CTXORACLE_INTERNAL=1` set, cwd a directory with no `.claude/` — **3/3 `is_error: false` with structured output**. The guard is safe on this axis. Recorded as an observation rather than a positive finding because it is a premise the document does not currently claim.

5. **CLI version drift, again.** The installed CLI is 2.1.220, as D11 records. C-5 makes drift the expected condition; round 4 should re-check rather than inherit any flag claim in this review, including mine.

---

## What's Actually Good

Each entry names the property, the standard it is good by, and how the property was verified.

1. **`--tools ""` is the right control and it works under the shipped flag pair.** *Property:* the judgment child's tool set is empty when the design's *combined* flags are used, not merely when `--tools ""` is used alone. *Standard:* OWASP LLM01 least privilege and ASVS 5.0.0 V15 — default-deny with an explicit allow-set, which is what `--tools ""` is and what a deny-list is not. *Verified:* executed the shipped pair (`--tools "" --disallowedTools "Bash,Read,…,NotebookEdit"`) with the enumeration prompt → `is_error: False`, result `'NONE'`. The document's D11 element 4 rewrite, which inverts the prior draft's deny-list rationale in exactly these terms (Read arch:1267–1281), is correct reasoning correctly sourced.

2. **The `--bare` removal is complete and independently reproducible.** *Property:* the Critical from round 1 is closed at the mechanism. *Standard:* OWNER-7 (no separate credentials) and `CLAUDE.md`'s run-it rule. *Verified:* `--bare` → `is_error: true`, `"Authentication error · This may be a temporary network issue, please try again"`; the identical command without `--bare` → `is_error: false`, `'ORACLE-OK'`. `--bare`'s help text read from `claude --help`: *"Minimal mode: skip hooks, LSP, plugin sync, attribution, auto-memory, background prefetches, **keychain reads**…"* — consistent with the document's account. D11's command block carries no `--bare` (Read arch:1186–1191).

3. **The non-obviousness factor closes C1 with a computation, a data-flow change, and a fixture — not prose.** *Property:* the criterion RETHINK calls the only one that matters is now a per-candidate quantity with named inputs. *Standard:* RETHINK §2.3, Read verbatim at RETHINK:58–59 — *"Marginal value over the agent's own abilities is the only relevance metric that matters"* — and spec P5. *Verified:* Read arch:990–1036 — `decision-impact = materiality × structural_weight × self_serve_cost`, with `self_serve_cost` deterministic and provenance-keyed, driven to ≈0 by demonstrated reach from Tier 3's read/search set; the consumer's read/search set added to Move A's data field; `non_obviousness` added to the Move-B schema; the two combined by **minimum** (silence is the safe direction, P1); and AC-16a fixtures the negative case. Every element the collapse-hunt's concrete fix asked for (collapse-hunt:93–109) is present, and the "why it was invisible" note is preserved honestly.

4. **D12's entailment fix states the guarantee it can currently support, and no more.** *Property:* the document narrows its own safety claim rather than restating the stronger one. *Standard:* the `expert-standard` observation axis, and spec P4/FR-J5 as D12 invokes them. *Verified:* Read arch:1423–1426 — *"Until (1)–(3) exist, the guarantee this decision may state is the narrow, true one — 'every claim references a resolvable fact' — **not** 'it never invents what counts as true.' The stronger sentence is deleted from element 5's collapse answer"* — and the collapse answer at arch:1523–1536 was read to confirm the deletion. In a document whose systemic failure is overclaiming, an author deleting their own stronger sentence is the behaviour that ends the pattern.

---

## Convergence Record

**Round number:** 3 (second Post-fix round), matching Scope and Inventory.

**Trajectory** (findings by severity, from each round's mechanical verdict breakdown):

- **R1: 12 findings** — as reconstructed and de-duplicated by round 2's Convergence Record (6 collapse-hunt + 1 Critical + 5 Moderate/Minor unique to the expert-review pass). Carried forward with round 2's own caveat that R1's breakdown is reconstructed, not original.
- **R2: 10 findings** — 2 Critical, 4 Serious, 1 Systemic, 2 Moderate, 1 Minor. *(Note: the round-2 pair comprised 19 findings across both passes — 9 collapse-hunt + 10 expert-review. The trajectory uses the expert-review pass's own breakdown, consistently with R2's Convergence Record, which counted its own 10; all 19 are used as closure items.)*
- **R3: 14 findings** — 1 Critical, 4 Serious, 1 Systemic, 6 Moderate, 2 Minor.
- **R1: 12 → R2: 10 → R3: 14.**

**Flow counts for this round.** Provenance classifications from Step 9 are the source.

- **Prior findings closed: 15 of 19.** Collapse-hunt: C1, C3, C4, C5, C6, C7, C8, C9 closed (8 of 9); **C2 not closed** (R3-5). Expert-review: F2, F4, F5, F6, F7, F8, F9 closed (7 of 10); **F1 not closed** (R3-1), **F3 not closed** (R3-2), **S1 not closed** (R3-S1). Closure evidence per item is in the Closure Ledger below.
- **New findings: 6** — R3-3, R3-4, R3-7, R3-8, R3-11, R3-12.
- **Recurring findings: 5** — R3-1 (F1), R3-2 (F3/S1 class), R3-5 (C2), R3-S1 (S1), R3-10 (collapse-hunt S2 correction).
- **Regressions: 3** — R3-6 (introduced by the F5 fix's new shallow-handling text), R3-9 (introduced by the F2 fix's new AC-11a), R3-13 (introduced by the F3 fix's new 30 s timeout basis).

**Tripwire evaluation — NOT FIRED. Arithmetic shown.**

- **Condition (a): new + regression ≥ closed, for two consecutive Post-fix rounds.**
  - R2: new 9 + regression 1 = 10, closed 12 → **10 ≥ 12 is false**. Condition does not hold at R2.
  - R3: new 6 + regression 3 = 9, closed 15 → **9 ≥ 15 is false**. Condition does not hold at R3.
  - Zero consecutive rounds. **Not fired.**
- **Condition (b): total findings has not strictly decreased, for two consecutive Post-fix rounds.**
  - R2: 12 → 10. **10 < 12, a strict decrease.** Condition does not hold at R2.
  - R3: 10 → 14. **14 is not < 10 — no strict decrease.** Condition **holds at R3**.
  - One consecutive round, two required. **Not fired.**

**The tripwire is now armed on condition (b).** If round 4's total does not come in strictly below 14, condition (b) holds for two consecutive Post-fix rounds and the tripwire fires, routing the work to foundational rework. That is the arithmetic the next round inherits, stated so it need not be re-derived.

**Reading of the trajectory.** The count rose, and the composition explains why in a way the count alone does not. Criticals fell 2 → 1 and the surviving Critical is not a design error but an **unapplied** one: OWNER-12 landed in the spec and RETHINK and never reached the architecture. Three of this round's fourteen are **regressions introduced by the round-2 fixes themselves**, which is the signature of a large fix batch applied under time pressure rather than of a foundational defect. Against that, the systemic root cause named on 2026-07-17, found in round 1, found in round 2, is now on its **fourth consecutive round** — and this round it survived a fix that was designed structurally rather than as another attestation, by relocating from the certification sections into the evidence sections. Convergence in count was never the question; the cause has not closed, and the two rounds' remedies (delete the blocks; attach evidence inline) have both been applied without ending it.

---

## Closure Ledger — round-2 findings re-derived from current source

| # | R2 finding (originally named standard) | Status | Closure evidence (re-derived 2026-07-30) |
|---|---|---|---|
| C1 | Bar has no non-obviousness term (RETHINK §2.3 / P5) | **Closed** | Read arch:990–1036: `self_serve_cost` third factor with provenance classes and demonstrated-reach decay; read/search set into Move A; `non_obviousness` in the Move-B schema; combined by minimum; AC-16a fixture. RETHINK:58–59 Read verbatim. |
| C2 | Conduct genres undeliverable through the grounding gates (FR-A8/AC-19) | **NOT CLOSED** | Session-evidence fact class present (arch:1695–1700); Process detector scoped (arch:1707–1719). But D6's full schema block Read at arch:744–782 does **not** contain `skill_expectations`, which D14:1701 asserts is "in D6". → **R3-5** |
| C3 | Lane 2 unbounded on the shared subscription (RETHINK §5 / P2) | **Closed** | Read arch:1051–1099: intent queue designed (one in-flight per consumer, coalescing, explicit overflow with FR-M2 diagnostic, depth exported); per-session call cap + inter-call interval as `tuning` rows; announced degradation; `StopFailure`/`rate_limit` detector; `status` reporting. |
| C4 | Cross-consumer allocation by arrival order (OWNER-8) | **Closed** | Read arch:1792–1818: per-consumer reservation with reclamation at `subagent_stop`, ceiling scaling with active consumers, cross-consumer warn preemption, FR-M2 finding on budget denial, AC-21a six-consumer fixture. |
| C5 | Pointer-only default does not cover paraphrase (T1 / FR-X2) | **Closed** | Read arch:1435–1458: `untrusted_repo` facts supplied without `claim_text`; whispers grounded only in them render deterministically; AC-7 carrier with the flagger configured to miss. Read arch:1577–1585: D13 is the single authority on quotation and the permissive Move-C sentence is removed. Read arch:2320–2336: T1 restated. |
| C6 | Uptake measures compliance, not influence (§9.2 / TRICORDER-15) | **Closed** | Read arch:1134–1152: uptake detection specified and owned by the distiller (any-route subject interaction); auto-suppression restricted to explicitly contradicted warnings; `status` reports hit rate with its detection method named. |
| C7 | Degraded-mode stats tune the model-mode rows (FR-A7 / COVERITY-10) | **Closed** | Read arch:813–841: `mode ∈ {model,degraded}` in the key of both `whisper_stats` and `genre_state`; per-mode ladder and bar; D20 states Phase 0 rates are evidence about the deterministic lane only. |
| C8 | Anti-ratchet excludes warn-grade (spec D-8) | **Closed** | Read arch:1115–1132: candidates failing **only** an evidence floor are logged with `(genre, subject, support, confidence)`; floor lowering permitted only from that evidence; explore delivery stays excluded from warn-grade; below-floor near-miss count in `status`. |
| C9 | Reading lag conflated with delivery lag (mission's "moment") | **Closed** | Read arch:1744–1768: delivery lag is a quantity D26 measures (inter-event intervals, motivation-to-delivery boundary count, supersession survival rate per genre); supersession-drop rate is an FR-M2 self-check; the ship recommendation is restated as **provisional**. |
| F1 | Stop/SubagentStop is a continuation control (OWNER-3 / FR-O4 / P2) | **NOT CLOSED in the artifact** | Owner-level and spec-level closure verified: RETHINK:361–387 (OWNER-12), spec:204–233 (§6.1 continuation paragraph), spec:327–334 (FR-O4a), spec:867–876 (AC-3 widened). Architecture **Read in full**: no OWNER-12, no `stop_hook_active`, no continuation bound, no Stop-grade bar, no continuation record, AC-3 unchanged, FR-O4a absent from the matrix. `git show --stat 0e90cd3`: two files, architecture not among them. → **R3-1** |
| F2 | `--disallowedTools` does not empty the tool set (LLM01 / ASVS V15 / FR-X5) | **Closed, with propagation gaps** | Primary control verified by execution: shipped flag pair → `'NONE'`. D11 element 4 rationale inverted correctly (arch:1267–1281); T4 corrected (arch:2374–2384); AC-11a added (arch:1309–1314). Gaps: D20 probe, build order 9, D26 AC-11 still name the deny-list shape → **R3-3**; the "eight tools" figure understates → R3-S1 instance 5; AC-11a's instrument is a self-report → **R3-9**. |
| F3 | The validating spike is not the design's command (CLAUDE.md run-it rule) | **NOT CLOSED** | Spike 1 was rewritten and the command's flags now match D11's. But the rewritten evidence does not reproduce: 6/6 successes under `--max-turns 1` with the pasted `--system-prompt`; `error_max_turns` only when that flag is dropped (2/2). → **R3-2** |
| F4 | Move C checks reference, not entailment (P4 / FR-J5 / corrected foundation) | **Closed** | Read arch:1383–1426: the reproduced failure is quoted; Move C now binds content via slot-filled per-genre templates, token provenance, and an epistemic-strength lexicon; the guarantee is explicitly narrowed until (1)–(3) exist; the stronger sentence is deleted from the collapse answer (verified at arch:1523–1536). Residual on the lexicon's shape filed separately → R3-8. |
| F5 | Repo identity self-contradictory and shallow-unsafe (FR-K9 / AC-15) | **Closed on rule 1; regression on rule 2** | Read arch:698–711: "first line" deleted, one rule (lexicographically smallest). Shallow detection added. Re-derived: `is-shallow` → true on this repo; full-vs-shallow pair yields different commits. But rule 2 is a disjunction → **R3-6**, and the motivating evidence is mis-attributed → **R3-7**. |
| F6 | No Lane 2 call budget on the shared quota (first-principles) | **Closed** | Read arch:1068–1099 — see C3; the two findings resolve to the same text and both are satisfied by it. |
| F7 | `SessionEnd`'s 1.5 s budget breaks the global deadline (C-5) | **Closed** | Read arch:352–365: deadlines are per-event; `SessionEnd` set below 1.5 s; `init` writes an explicit per-hook `timeout` where teardown needs longer; AC-4's accounting and `deinit`'s removal set both include it. Spec side confirmed at spec:246–254. |
| F8 | Whole-whisper drop on `so_what` failure (fail-soft design) | **Closed** | Read arch:1459–1473: `so_what` failure strips the clause and keeps the claims, with a diagnostic; whole-whisper drop reserved for grounding, entailment, and injection-suspect failures; drop and strip rates counted per cause and surfaced in `status`. Independently observed: the shipped judgment emitted a directive `so_what` in my run, so the trigger rate is real. |
| F9a | Status overclaims matrix totality over spec judgments (documentation integrity) | **Closed** | Read arch:2653–2659: the sentence is corrected in place and names the six absent judgments. *(The matrix's other totality claim is now the false one → R3-S1 instance 4.)* |
| F9b | Limitations cites an IDEAS entry that does not exist (CLAUDE.md ideation rule) | **Closed** | Read `docs/IDEAS.md`:72–79 — entry 13, "Embedding-based recall for the Answer genre", **Unvalidated**, with the C-1 WASM/pure-JS constraint on any candidate. Matches the citation at arch:2582–2586. |
| S1 | Assert-without-establish, systemic (CLAUDE.md run-it rule) | **NOT CLOSED** | The four self-assessment blocks are gone and the Self-verification record is in place (Read arch:2249–2292) — that half is real. But a summary attestation survives byte-identical at arch:2727–2730 (verified against `6dee4a7`), and the pattern reappears in the inline evidence the fix designates as its replacement. Fourth consecutive round. → **R3-S1** |
| *(uncounted)* | Collapse-hunt S2 correction — `delivery_confirmed` | **Not applied** | Read arch:372, 776–777, 2022–2023, 2124–2136: no `delivery_confirmed`, ack still fire-and-forget. → **R3-10** |

---

## Open Findings Ledger

Not applicable — the operator has not directed a cycle stop with open findings. No ledger is required and none is presented.

---

## Recommended Priority

The tripwire did **not** fire, so another fix round is the indicated path rather than foundational rework. It is armed on condition (b), which makes this round's ordering consequential: a round 4 that does not come in below 14 findings routes the work to rework.

`CLAUDE.md` requires **all** findings applied, not a prioritized subset — the ordering below is sequencing, not triage.

1. **R3-1 (Critical) — carry OWNER-12, FR-O4a and the widened AC-3 into the architecture.** First because it is the only finding that leaves the artifact contradicting an owner ruling made this session, and because it is a pure carry: no design question is open, and — stated explicitly so the next agent does not escalate it — **this is not an owner question**. `CLAUDE.md`:83–110 names re-asking a written decision as the project's most persistent failure. The seven sub-changes are enumerated in the finding; D8's envelope change is the load-bearing one, because without it the requirement is unimplementable rather than merely unstated.

2. **R3-S1 (Systemic) — second, above the remaining Serious items, because it is the generator of R3-2, R3-4, R3-7 and R3-S1's own instances 4–7, and because it is on its fourth consecutive round.** The last two rounds each fixed the instances and each declared the pattern addressed. What is different to try this time is named in the finding: delete the surviving attestation block per the document's own standing instruction, and make every pasted evidence block record the full command, the run count, and the observed variance — three of this round's instances were single-sample claims that a three-run paste would have caught at authoring time.

3. **R3-2 (Serious) — re-run Spike 1's matrix with `--system-prompt` in every row and fill the missing cell.** Directly closes the largest S1 instance and corrects three downstream restatements, one of which (`STATUS.md`) is the owner-facing record.

4. **R3-5 (Serious) — add `skill_expectations` to D6.** Cheap, and it is the difference between the owner's two requested genres being buildable and being descoped at fixture time. Check the sibling resolver gap (`open_questions.asked_loc`) in the same pass.

5. **R3-3 (Serious) — propagate the `--tools ""` fix to D20, build order 9, and D26's AC-11**, converting AC-11's fixture description to a by-reference citation of D11's command block so it cannot drift again.

6. **R3-4 (Serious) — update the Knowledge-state baseline** and convert Spike 1's two global correction sentences into enumerated location lists.

7. **R3-6, R3-7 (Moderate) — D5**, together: one determinate shallow rule that does not make a network fetch load-bearing, and the corrected attribution of the six-commit observation.

8. **R3-8, R3-9 (Moderate) — the two deny-list-shaped controls**: make the slot-filled template the primary epistemic bound with the lexicons as defence in depth, and re-base AC-11a on the harness's output rather than the child's self-report. Both are the same lesson D11 already learned about `--tools ""`, applied one decision over.

9. **R3-10, R3-11 (Moderate), then R3-12, R3-13 (Minor).** R3-11 first among these: the collapse-log is the mechanism by which round 4 inherits this round's traps, and it currently omits the finding that produced an owner ruling.

Two notes for whoever applies these. First, **three of this round's fourteen findings are regressions introduced by the round-2 fixes** — after applying this round's set, re-read the new text against the finding it was written to close, because that is where the last batch's defects landed. Second, this review is written to `docs/reviews/2026-07-30-round-3-expert-review.md` per the project's review-of-record rule, so round 4's closures can be performed against named standards rather than tentatively.

---

Verdict: NEEDS FIXES (14 findings: 1 Critical, 4 Serious, 1 Systemic, 6 Moderate, 2 Minor)
