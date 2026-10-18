# Independent review — round 5 — expert-dev-tools plugin

**Date:** 2026-07-26. **Reviewer:** independent session under the `expert-review` skill.
**Target:** `claude-plugins/expert-dev-tools/` at commit `8e2b9b3`.

---

## Scope and Inventory

**Round:** 5. Post-fix review. Inventory constructed per Step 2's post-fix rule from four
sources: the round-1 review's full inventory (`docs/review-round-1.md`), the fix-diff files
(commits `20255c3`, `4279859`), those files' dependents, and the prior findings as closure items.
In practice the union is the entire plugin tree, which is the inventory below.

### Tool plan (Step 3)

| Claim type | Instrument | Available |
|---|---|---|
| Absence claims | `grep` over stated scope | yes |
| Literal-content claims | `Read` at file:line | yes |
| Library/platform-behavior claims | Context7 `/websites/code_claude` | yes |
| Behavioral claims | execution (`node`, the plugin's own suites) | yes |
| Structural / blast-radius | CodeGraph | **not connected** |
| Structured reasoning | Clear Thought MCP | **not connected** |

**Unavailability disposition.** CodeGraph is absent. It is not load-bearing here: no finding in
this review is a structural or blast-radius claim, and the two claim categories that carry the
review — literal content and behavior — have their instruments. Not a halt condition per Step 3.
Clear Thought is a reasoning-support tool, not a verification instrument; the two mandatory
invocations (`metacognitivemonitoring` at start, `collaborativereasoning` before delivery) were
performed manually with the same personas, recorded as a procedural observation below.

**Scope limit (recorded, not waived by the reviewer).** The *content* of the nine packaged
skills is excluded by the artifact's own spec §2 ("Rewriting or improving the content of any
Expert skill" — out of scope; the content is the owner's). Their **packaging** is in scope and
was verified: frontmatter parses, directory flattening, `references/` carriage, and residual
escape corruption. Finding M-3 comes from that packaging check.

**Rigor waivers:** none. The user requested the full process.

### Inventory checklist

- [x] `.claude-plugin/plugin.json` — Read, full (25 lines)
- [x] `.mcp.json` — Read, full (11 lines)
- [x] `agents/expert-acceptance.md` — Read, full
- [x] `agents/expert-architect.md` — Read, full
- [x] `agents/expert-closeout.md` — Read, full
- [x] `agents/expert-diagnostician.md` — Read, full
- [x] `agents/expert-implementer.md` — Read, full
- [x] `agents/expert-planner.md` — Read, full
- [x] `agents/expert-reviewer.md` — Read, full
- [x] `agents/expert-spec-writer.md` — Read, full
- [x] `agents/expert-verifier.md` — Read, full
- [x] `commands/expert.md` — Read, lines 1–181 (full)
- [x] `workflows/expert-lifecycle.js` — Read, lines 1–493 (full)
- [x] `scripts/ledger.schema.json` — Read, lines 1–191 (full)
- [x] `scripts/validate-ledger.mjs` — Read, lines 1–123 (full)
- [x] `scripts/extract-owner-turns.mjs` — Read, lines 1–126 (full)
- [x] `docs/specs/spec-expert-dev-tools.md` — Read, lines 1–417 (full)
- [x] `docs/arch/architecture-expert-dev-tools.md` — Read lines 838–876 (amendment block);
      grep-verified for D8/D11 decision text (`^\*\*D8|^\*\*D11`, 2 hits) and the least-privilege
      claim (4 hits at lines 452–456, 844–857)
- [x] `docs/review-round-1.md` — Read, lines 1–182 (full) — closure items
- [x] `docs/plans/plan-expert-dev-tools-remediation-r3.md` — Read lines 1–40 (goal/scope)
- [x] `docs/plans/plan-expert-dev-tools.md`, `…-r1.md`, `…-r2.md` — grep-verified for the
      round-2/3 finding register and out-of-scope authority
- [x] `tests/structural/check-structure.mjs` — Read, lines 1–113 (full) + executed (25/25 pass)
- [x] `tests/unit/run-unit-tests.mjs` — executed (16/16 pass); grep-verified for fresh-ledger
      coverage (`intake|fresh|initial`, **0 hits** — basis for C-1)
- [x] `tests/ACCEPTANCE.md` — Read, lines 1–116 (full)
- [x] `tests/fixture/agents/forced-fabricating-implementer.md` — Read (plant-index section);
      claim verified by executing `sampleIndices(5,1)`
- [x] `tests/fixture/agents/forced-fail-reviewer.md`, `forced-unauthorized-implementer.md` —
      grep-verified via the structural suite's frontmatter parse (both parse)
- [x] `tests/fixture/spec/spec-contradictory.md`, `tests/fixture/project/TASK.md`,
      `greeter.js`, `tests/fixture/transcripts/session-{1,2}.jsonl` — existence and parse
      verified via the structural suite and the unit suite's T-U2 cases (6/6 over these
      transcripts)
- [x] `skills/*/SKILL.md` (9) + `references/*.md` (8) — grep-verified for packaging properties:
      frontmatter `name` (9/9 present), nested-directory flatten (0 nested dirs), `references/`
      carriage (4/4 files), residual escapes (`\\(##|---|\*\*)` → **1 file**, see M-3)

---

## Summary

**This review returns NEEDS FIXES.** The plugin is a serious, unusually well-architected piece of
work — the spec, architecture, ledger schema, and the two automated test tiers are of a standard
well above what this codebase or most codebases contain, and both suites pass (25/25 structural,
16/16 unit). But the automated tiers only cover what can be checked without spending tokens, and
the plugin has never been run. The gap between those two facts is where the defects live: the
single most consequential one is that `/expert` writes a fresh ledger that fails the plugin's own
validator, so the very next `/expert resume` hard-halts at preflight — and since advancing past
the intent gate *requires* a resume, the lifecycle cannot reach architecture, plan, implement, or
anything downstream. I verified that by construction and execution, not by reading. Beneath it sit
five Serious defects in the workflow's data flow and the agents' capability boundaries, and one
systemic pattern in the test suite: a majority of the structural assertions check the literal
string the implementation wrote rather than the property that string is supposed to guarantee,
which is precisely why a suite at 25/25 green did not catch a lifecycle that cannot advance.

---

## Upstream Contract Verification

Upstream artifacts exist: `docs/specs/spec-expert-dev-tools.md` (§9 acceptance criteria) and
`docs/arch/architecture-expert-dev-tools.md` (decisions D5/D8/D9/D11/D12 + the 2026-07-23
amendment).

### Spec §9 acceptance criteria

| ID | Criterion | Status | Verification method |
|---|---|---|---|
| A-1 | Nine skills load-clean | **pass** | Executed structural suite: 10/10 T-A1 assertions green. Caveat: T-A1 checks frontmatter only — see M-3. |
| A-2 | Workflow passes workflow-creator linter; **structure passes plugin-dev's validator** | **fail (partial)** | Linter half: executed, green. Validator half: `grep -rn "plugin-dev\|validate-plugin\|plugin validator"` across the plugin → **0 hits**. Unimplemented. → M-1 |
| A-3 | End-to-end fixture run | **fail** | Never run (owner statement, corroborated by `tests/ACCEPTANCE.md` line 114: behavioral criteria "green only when their runs above are observed to pass"). Independently, C-1 makes A-3 unreachable: segment 2 halts at preflight. |
| A-4 a–d | Forced failures caught | **not executed** | Behavioral tier, unrun. Fixtures exist and parse; A-4b's plant-index claim verified computationally (see What's Actually Good). |
| A-5 | Resume from ledger | **fail** | Behavioral tier unrun, and C-1 is a direct contradiction: the resume path is the one that halts. Verified by execution. |
| A-6 | Owner-language at gates | **not executed** | Requires observed gates. |
| A-7 | Diagnosis quality | **not executed** | Property of the A-4 runs. |
| A-8 | Feedback loop | **not executed** | Behavioral tier unrun. S-4 additionally threatens its correctness. |
| A-9 a–c | Cross-project recurrence / failed correction | **not executed** | Behavioral tier unrun. |

Two of nine criteria are verified pass; two verify **fail**; five are unexecuted.

### Architecture decisions

| Decision | Status | Verification method |
|---|---|---|
| D8 — MCP split: Context7 + Clear Thought declared, CodeGraph preflighted | **honored** | Read `.mcp.json` (both declared under `mcpServers`); structural assertions at `check-structure.mjs:100–101` green. |
| D9 — artifact hash anchoring / approval invalidation | **violated** | `grep -n "artifact_path" workflows/expert-lifecycle.js` → 1 hit, schema declaration only (line 63); never read. Artifacts registered from guessed defaults at lines 344/357/375. → S-1 |
| D11 — least privilege as a capability boundary | **violated** | Read `agents/expert-reviewer.md:6` — denylist omits every MCP server; `mcp__github__create_or_update_file` / `push_files` / `merge_pull_request` exist in this environment and are not denied. → S-5 |
| D11 amendment (hybrid allowlist/denylist; plugin MCP naming) | **honored** | Context7 `/websites/code_claude`, sub-agents page, 2026-07-26: "Both `tools` and `disallowedTools` fields accept MCP server-level patterns like `mcp__<server>` or `mcp__<server>__*`." The allowlists' `mcp__plugin_expert-dev-tools_context7` is a valid server-level pattern under the documented plugin scoping format. |
| D12/RV — review results persisted, never a bare count | **honored in the artifact** | Read `commands/expert.md:82–88` — per-round records to `.claude/expert/reviews/<phase>.md`, registered as `role:"review"`; schema enum carries `"review"` (`ledger.schema.json:55`). Not honored in the project's own record — see Mn-2. |
| D5/D11 amendment — reviewer retains Bash | **honored as written** | Read `architecture…:858–863`. Owner-directed; not re-litigated here. The MCP gap in S-5 is separate and was not covered by that amendment. |

---

## Critical & Serious Findings

### C-1 (Critical, **new**) — `/expert` writes a ledger that fails the plugin's own validator, so the lifecycle cannot advance past the first segment

**What the code does.** `commands/expert.md:37–39` instructs: "If the ledger is missing,
initialize a fresh one at `intake` (revision 0, empty arrays, `budget.total_tokens` 0,
`feedback_marker` `{session_file:null, line:0}`)". That enumeration omits `task`, which
`scripts/ledger.schema.json:8–19` lists as required. On the next invocation,
`commands/expert.md:27–31` (preflight) validates the ledger and states "A non-zero exit is a
structured halt … never proceed on an invalid ledger."

**How that claim was verified.** By execution, not inference. I constructed the ledger exactly as
step 2 dictates and ran the plugin's own validator:

```
$ node scripts/validate-ledger.mjs fresh-ledger.json
INVALID ledger (1 error):
  - $: missing required property 'task'
EXIT=1
```

Supporting reads: `commands/expert.md:37–39`, `scripts/ledger.schema.json:8–19`,
`commands/expert.md:27–31`. Absence of coverage verified by
`grep -n "intake\|fresh\|initial" tests/unit/run-unit-tests.mjs` → **0 hits**.

**Standard violated.** Internal contract consistency between the command tier and the schema it
writes against; and ISO/IEC/IEEE 29119 test-design — the unit tier tests the validator against
hand-authored fixtures but never against the artifact the system actually produces, which is the
one input guaranteed to occur on every first run.

**Why it matters.** This is not a corner case; it is the happy path. Run 1 creates the ledger and
halts at the intent gate. Advancing past the intent gate requires the owner to approve and the
command to re-invoke `/expert resume` (`commands/expert.md:166–177`). That resume runs preflight,
which rejects the ledger. Architecture, plan, implement, review, ground truth, and closeout are
unreachable. Spec A-3 and A-5 cannot pass.

**Correct implementation.** In `commands/expert.md` step 2, specify the fresh ledger field by
field against the schema's `required` list — `revision: 0`, `task: "$ARGUMENTS"`,
`phase: "intake"`, `artifact_index: []`, `gate_history: []`, `amendments: []`,
`escalations: []`, `budget: {total_tokens: 0}`, `feedback_marker: {session_file: null, line: 0}`,
`signature_history: []` — rather than the prose shorthand "empty arrays". Then add a unit case
that builds the fresh ledger exactly as the command specifies it and asserts
`validate-ledger.mjs` exits 0. That test is what makes the contract enforceable rather than
aspirational.

---

### S-1 (Serious, **recurring** — round-1 S-4, closed only in part) — the agent's returned `artifact_path` is discarded; artifacts are registered at guessed default paths, so D9 hash integrity anchors to the wrong file

**What the code does.** `PHASE_SCHEMA` declares `artifact_path` (`workflows/expert-lifecycle.js:63`)
and every phase agent is instructed to return it (`agents/expert-spec-writer.md`,
`agents/expert-architect.md`, `agents/expert-planner.md`). The workflow never reads it. Artifacts
are registered from module-level defaults instead:

- line 344: `delta.artifacts.push({ role: 'spec', path: specPath })`
- line 357: `delta.artifacts.push({ role: 'architecture', path: archPath })`
- line 375: `delta.artifacts.push({ role: 'plan', path: planPath })`

where `specPath`/`archPath`/`planPath` fall back to `'docs/specs/spec.md'`,
`'docs/arch/architecture.md'`, `'docs/plans/plan.md'` (lines 281–283).

**How that claim was verified.** `grep -n "artifact_path" workflows/expert-lifecycle.js` → **1
hit**, line 63, the schema declaration. `grep -n "delta.artifacts.push"` → **3 hits**, lines 344,
357, 375, all pushing the default-derived variable. Read of lines 281–283 for the fallback values.

**Standard violated.** OWASP ASVS V8 data integrity, as instantiated by the architecture's own D9
(hash anchoring and approval invalidation), and the SEGMENT_REPORT protocol the architecture
defines.

**Why it matters.** The agents write where their skills tell them — `expert-spec` writes to
`docs/specs/` with a task-derived filename (`spec-<name>.md`), not `docs/specs/spec.md`. So the
command's step-4 hashing (`commands/expert.md:74–80`) computes SHA-256 of a path that need not
exist, and step 2's re-hash loop compares hashes of the wrong file. Amendment detection (F-8),
approval invalidation on drift, and the spec-hash → `spec_traceable` escalation (D9) all operate
on a phantom. Round 1 fixed the *plumbing* (the delta now carries `artifacts[]`); the *source of
the path* is still a guess.

**Correct implementation.** Capture each phase agent's return and register what it reports:
`const specOut = await agent(...)`, then
`delta.artifacts.push({ role: 'spec', path: specOut.artifact_path || specPath })`, and the same
for architecture (`out.artifact_path`) and plan. Where the agent returns no `artifact_path`, that
is a dispatch defect under spec F-4 ("Free-text returns are a dispatch defect") and should halt
rather than silently fall back.

---

### S-2 (Serious, **new**) — a dead reviewer agent is indistinguishable from a NEEDS_FIXES verdict, producing no-op remediation rounds and a false non-convergence escalation

**What the code does.** In `runGate` (`workflows/expert-lifecycle.js:224–243`):

```js
const v = await reviewFn(round, null)
verdict = v && v.verdict === 'PASS' ? 'PASS' : 'NEEDS_FIXES'
findings = (v && v.findings) || []
```

and for the multi-lens panel (lines 229–232), `parallel(...)` results are `.filter(Boolean)`-ed,
then `allPass` requires `results.length === LENSES.length`. A `null` from a dead agent therefore
becomes `NEEDS_FIXES` with `findings = []`, and line 240 dispatches
`remediateFn([], round)` — an agent told to "resolve these findings: `[]`".

**How that claim was verified.** Read of `workflows/expert-lifecycle.js:224–243` at drafting time.
The `null` semantics are from the Workflow tool contract in force for this runtime: `agent()`
"Returns null if the user skips the agent mid-run or the subagent dies on a terminal API error
after retries"; `parallel()` — "A thunk that throws (or whose agent errors) resolves to `null` in
the result array."

**Standard violated.** The artifact's own spec F-12 (`spec-…:194–197`): "dead/stalled agents
retried once then escalated; MCP loss mid-phase is a structured halt, **not silent degradation**."
Verified by Read of the spec at those lines. More generally, the fail-safe principle that an
infrastructure failure must not be encoded as a domain verdict.

**Why it matters.** If the reviewer dies — API error, MCP loss, budget exhaustion — the workflow
reports that the artifact failed review. It then burns up to five rounds dispatching a remediation
agent an empty findings list, and finally escalates `non_convergence` to the owner with
`what_happened: "<Phase> review did not converge."` That statement is false: nothing was reviewed.
The owner, who by the spec's own framing is not a developer (`spec-…:22–26`), is handed a
diagnosis of the wrong problem — the exact failure mode D10 exists to prevent.

**Correct implementation.** Distinguish the three outcomes. Treat `null` (and a non-null result
missing `verdict`) as a dispatch failure, not a verdict: retry once per F-12, and on a second
failure return a distinct `{ verdict: 'DISPATCH_FAILED' }` that the caller routes to an
`ENVIRONMENT-BLOCKED`-flavoured owner gate carrying the true cause. In the multi-lens branch,
check `results.length === LENSES.length` *before* computing a verdict and route the shortfall the
same way, rather than folding it into `allPass`.

---

### S-3 (Serious, **new**) — after an automatic amend-plan, the re-implementation's result is discarded: a second STOP is swallowed and the anti-fabrication spot-check samples the abandoned first attempt's evidence

**What the code does.** `workflows/expert-lifecycle.js:402–405`:

```js
await agent(`Amend the plan at ${planPath} per this diagnosis, then re-verify: ...`, {...})
await agent(`Execute the amended plan at ${planPath}.`, { agentType: AGENT.implementer, ... })
```

Neither return value is bound. Fourteen lines later, line 419:
`const cited = (impl && impl.evidence) || []` — where `impl` is the **first**, halted
implementation (line 390).

**How that claim was verified.** Read of lines 390–419 at drafting time, plus
`grep -n "re-implement\|const impl\|impl\." workflows/expert-lifecycle.js`, which returns hits
only at lines 390, 394, 395, 396, 400, 405, 411, 419 — confirming `impl` is assigned once (390)
and that line 405's result is bound to nothing.

**Standard violated.** First-principles articulation (no published standard names this
precisely): the goal the code serves is that every implementation reaching the gate has been
executed and its cited evidence spot-checked. The shortcut is discarding the second dispatch's
result on the assumption it succeeded. It fails the goal in two independent ways, both silent.

**Why it matters.** Two concrete failures. (1) If the re-implementation also halts — a plausible
outcome, since the amended plan is machine-drafted from a diagnosis — the STOP is never inspected
and control falls through to the review gate as though implementation completed. (2) The spot
re-run at lines 419–429, the plugin's central anti-fabrication control and the mechanism spec A-4b
tests, samples `impl.evidence` — the evidence of the run that was *abandoned*. The work actually
under review is never spot-checked at all. This is the failure the control exists to catch,
reintroduced upstream of the control.

**Correct implementation.** Bind both results:
`const reImpl = await agent('Execute the amended plan…', …)`, route `reImpl.stop_report` through
the same STOP-category dispatch (escalating rather than looping if a second STOP arrives), and
set the evidence source to the run that produced the reviewed state:
`const cited = ((reImpl || impl) || {}).evidence || []`.

---

### S-4 (Serious, **new**) — the transcript reader orders sessions by mtime, which is not stable under session append, so previously-processed owner turns are re-read and manufacture false repeat-complaint signatures

**What the code does.** `scripts/extract-owner-turns.mjs:37–40` sorts transcripts by filesystem
mtime (`.sort((a, b) => a.mtime - b.mtime)`). The resume marker is a single
`{session_file, line}` pair; `startIdx` is the marked file's index **in that freshly-sorted list**
(lines 44–49), and every file after it is read from line 0 (`const fromLine = fi === startIdx ? startLine : 0;`,
line 59).

**How that claim was verified.** Read of `scripts/extract-owner-turns.mjs:36–60` at drafting time.

**Standard violated.** First-principles articulation: the goal is exactly-once processing of each
owner turn, since the feature's entire semantics rest on occurrence counting. The shortcut is
using a mutable filesystem attribute as a stable total order over an append-mutable set. It fails
the goal because mtime is not stable: Claude Code appends to a session's `.jsonl` as the session
continues, which moves that file's mtime to the end of the order.

**Why it matters.** Concretely: sessions A and B are both fully processed, marker = `(A, N)`.
The owner resumes session B; B's mtime now exceeds A's, so the sorted order becomes `[…, A, B]`.
`startIdx` lands on A, B is now *after* it, and B is re-read **from line 0** — every owner turn in
B is emitted a second time. Spec F-14 (`spec-…:217–225`) defines a signature occurring more than
once as a systemic defect. A single re-read therefore converts every one-off complaint in B into a
fabricated `systemic_defect`, which under `workflows/expert-lifecycle.js:309–312` triggers a
diagnostician dispatch and an owner escalation about a defect that does not exist. That inverts
the design's central promise — that the owner is interrupted only when it is irreplaceably his
call. Spec A-8's negative half ("a single-occurrence complaint … is correctly classified as a
course correction") fails on this path.

**Correct implementation.** Sort by a stable key — the session filename (Claude Code session files
are UUID- or timestamp-named and immutable once created) — and make the marker a set of per-file
consumed-line counts (`{ [session_file]: line }`) rather than one global position. That way an
appended older session resumes from its own recorded offset regardless of ordering, and files are
never re-read from zero. If a single marker must be kept for schema reasons, at minimum record the
processed file list alongside it and skip any file already at its recorded length.

---

### S-5 (Serious, Systemic-adjacent, **recurring** — round-1 S-2, closed for six of nine agents) — the three denylist agents retain host MCP write capability, so "read-only reviewer" remains an instruction, not a capability boundary

**What the code does.** Three agents scope tools by denylist only:

```
agents/expert-reviewer.md:6  disallowedTools: Write, Edit, NotebookEdit, WebFetch, WebSearch, Agent, Task, mcp__claude_ai_CORE_Memory__memory_ingest
agents/expert-architect.md:6 disallowedTools: Agent, Task, mcp__claude_ai_CORE_Memory__memory_ingest
agents/expert-planner.md:6   disallowedTools: Agent, Task, mcp__claude_ai_CORE_Memory__memory_ingest
```

A denylist inherits every tool not named. No MCP server other than the CORE one is denied.

**How that claim was verified.** `grep -n "disallowedTools" agents/expert-reviewer.md
agents/expert-architect.md agents/expert-planner.md` → the three lines above, verified at drafting
time. The inheritance semantics are from Context7 `/websites/code_claude`, sub-agents page,
retrieved 2026-07-26: "To restrict tools, use the `tools` field as an allowlist or the
`disallowedTools` field as a denylist… `disallowedTools` is applied first, then `tools` is
resolved against the remaining pool." Write-capable MCP tools present in this environment and not
denied: `mcp__github__create_or_update_file`, `mcp__github__push_files`,
`mcp__github__merge_pull_request`, `mcp__github__delete_file`.

**Standard violated.** OWASP ASVS V1 least privilege / deny-by-default — the standard the
architecture itself names at `architecture-…:456` ("least privilege per agent (ASVS V1 trust
boundaries)") and whose guarantee D11 states as turning "reviewer is read-only" from instruction
into capability boundary.

**Why it matters.** `agents/expert-reviewer.md` tells the reviewer "You are read-only: you analyze
and verify; you change nothing." Its capability set says otherwise: it can commit files to the
repository, push branches, and merge pull requests through the GitHub MCP server, and it retains
Bash (an owner-directed decision, not challenged here) which can write any file. The IEEE 1028
reviewer-independence control the architecture builds on is enforced by prompt text alone for the
one agent whose independence matters most.

The 2026-07-23 amendment's reasoning is sound as far as it goes — these three agents genuinely
cannot enumerate the host CodeGraph/codebase-RAG servers in an allowlist — but it concludes that
D11's intent "is preserved" because CORE-ingest and Agent/Task are denied. That conclusion does
not follow: those are two capabilities out of an unbounded inherited set.

**Correct implementation.** Extend the three denylists to cover the write capabilities that are
nameable, which is most of them: add `mcp__github`, `Workflow`, `TaskCreate`/`TaskUpdate`, and any
other write-capable server present in the deployment, using the documented server-level pattern
(`mcp__<server>`) confirmed above. Better, invert the residual risk: since the *only* servers
these agents need from the host are CodeGraph and codebase-RAG, deny `mcp__*` and then allow those
two by name via `tools` — the docs confirm both fields may coexist and that `disallowedTools`
resolves first, so the pair yields a genuine allowlist without needing to enumerate built-ins.
Whichever form is chosen, the property to assert in the test is "cannot reach any write-capable
tool," not "denies these four strings."

---

### S-6 (Serious, **new**) — the CORE-ingest prohibition names a tool that does not exist under that name in this environment, so the plugin's one absolute rule is unenforced

**What the code does.** All nine agents deny `mcp__claude_ai_CORE_Memory__memory_ingest`
(9 occurrences, one per agent file).

**How that claim was verified.** `grep -rn "mcp__claude_ai_CORE_Memory" agents/` → **9 hits**.
The CORE Memory ingest tool available in this session is named
`mcp__CORE_Memory__memory_ingest` — no `claude_ai_` segment. The denylist string does not match
it. Verified against the live tool roster, not from memory.

**Standard violated.** OWASP ASVS V1 least privilege, and the artifact's own spec §3.4.6
(`spec-…:134–135`): "CORE ingestion approval — the drafted ingestion message. Never
auto-ingested. **No exceptions, ever.**"

**Why it matters.** Two of the nine agents — reviewer, architect, planner — have no `tools`
allowlist, so this denylist entry is the *only* thing standing between them and the ingest tool.
If the deployed name differs from the string (as it does here), those agents inherit CORE-ingest
and the "no exceptions, ever" rule is enforced by nothing but the sentence in
`agents/expert-closeout.md` that says "you have no CORE-ingest tool" — a statement that would be
false. For the six allowlist agents the entry is harmless belt-and-suspenders, because the
allowlist already excludes it.

This is compounded by the structural test at `check-structure.mjs:63`, which asserts
`dis.includes(CORE)` where `CORE` is defined **in the same file** at line 50 as the identical
literal. The test can only ever confirm that two copies of one string match; it has no visibility
into the deployed tool name. See the systemic pattern below.

**Correct implementation.** The tool's MCP server key varies by how CORE is connected (claude.ai
connector vs. `claude mcp` vs. plugin-bundled). Deny the server, not one tool, and cover the known
name variants: `disallowedTools: mcp__CORE_Memory, mcp__claude_ai_CORE_Memory, …`. Since
server-level patterns are documented as supported on the deny side, this removes every CORE tool
regardless of which ingest verb is exposed. Then replace the tautological assertion with a
deployment-time preflight check in `commands/expert.md` step 1: enumerate the session's available
MCP servers, and halt if any server matching `/CORE|memory/i` is not covered by the agents'
denylists. That converts a string comparison into a check of the actual property.

---

## Systemic Patterns

### SYS-1 (Systemic) — the structural suite predominantly asserts the literal string the implementation wrote, not the property that string is meant to guarantee

**Proactive scan.** `grep -nE "check\(" tests/structural/check-structure.mjs` → **25 assertions**
total. `grep -nE "check\(.*(includes|test\()"` → **10 assertions** whose predicate is a
string-`includes` or regex over text the plugin itself authored. Instances enumerated:

| Line | Assertion | Why it does not establish the property |
|---|---|---|
| 63 | `cannot CORE-ingest` | Compares frontmatter text to `CORE`, a constant defined at line 50 of the same file. Confirms two copies of a string match; blind to the deployed tool name. → S-6 |
| 70 | `reviewer: independence-locked (… KEEPS Bash)` | Asserts three names appear in the denylist and that Bash does not. Encodes the gap in S-5 as a passing condition; says nothing about what the reviewer can actually reach. |
| 66 | `allowlist excludes write tools` | `!tools.includes('Write') && !tools.includes('Edit')`. `Bash` is in all three of those agents' allowlists and writes files; NotebookEdit is not checked. |
| 69 | `denies Agent + Task` | Substring match; `dis.includes('Agent')` also matches a hypothetical `AgentBoard` entry. |
| 65 | `tools allowlist incl Skill` | Presence of a substring, not that the skill loads. |
| 100 | `mcp: mcpServers wrapper declares context7 + clear-thought` | Reads keys from JSON. No probe that either server starts — the exact thing preflight depends on. |
| 101 | `does NOT declare codegraph/codebase-rag` | Asserts an absence the author chose; correct but self-referential. |
| 91 | `meta is the first statement` | Regex over the file's own first line. |
| 95 | `manifest: kebab-case name` | Regex over a literal the author wrote. |
| 71 | `reviewer: denies WebFetch + WebSearch` | Substring match. |

Add to these the two genuine coverage gaps the pattern produced: T-A1 (lines 40–43) checks skill
frontmatter only and therefore passes on a skill body full of escaped-markdown corruption
(→ M-3), and the unit tier never constructs the ledger the command actually writes (→ C-1).

**Standard violated.** ISO/IEC/IEEE 29119-4 — test cases must derive from the specified behaviour,
independently of the implementation. A test whose oracle is a string the implementation supplied is
a change-detector, not a verification: it fails when the code changes and passes when the code is
wrong.

**Why this is systemic rather than isolated.** Ten of twenty-five assertions share the defect, it
spans every test group in the file (T-A1 skills, T-A2b agents, T-A2c manifest/MCP), and it is
causally responsible for at least three findings in this review surviving four prior review rounds
with the suite reporting 25/25 green. The suite's greenness was, reasonably, treated as evidence
the structural properties held. It was not evidence of that.

**What correct looks like.** Assert properties against an external oracle wherever one exists:
resolve the agent frontmatter through the same parser Claude Code uses and assert over the
*resulting effective tool set* (does it contain any write-capable tool?) rather than over the
source string; probe that the declared MCP servers actually start; parse each SKILL.md body and
assert it contains no escaped ATX headings; and construct the command's fresh ledger from the
command document's own specification and run it through the validator. Where no external oracle
exists, at minimum stop defining the expected literal in the test file that checks for it — read
it from the schema or the spec so the two can disagree.

---

## Moderate & Minor Findings

### M-1 (Moderate, **new**) — half of acceptance criterion A-2 is unimplemented

A-2 requires "`expert-lifecycle.js` passes the workflow-creator linter; **plugin structure passes
plugin-dev's validator**" (`spec-…:371–372`). The linter half runs
(`check-structure.mjs:82–89`). The validator half has no implementation.
**Verified:** `grep -rn "plugin-dev\|validate-plugin\|plugin validator"` across all `.mjs`, `.js`,
and `.md` files outside `docs/` → **0 hits**. **Standard:** spec §9 deliverable completeness.
**Fix:** invoke the plugin-dev validator in the structural tier, or amend A-2 through the spec if
the validator is unavailable — silently dropping half a criterion is the failure mode the ledger
and gate machinery exist to prevent.

### M-2 (Moderate, **new**) — the shipped test suite hard-depends on a file outside the plugin and *fails* rather than skips when it is absent

`check-structure.mjs:82` resolves the linter at
`join(ROOT, '../../skills/workflow-creator/scripts/validate-workflow.mjs')` — i.e.
`/home/user/agent-armory/skills/workflow-creator/…`, outside the plugin tree. Lines 83–85 then
call `check(…, false)`, which increments `failures` and exits non-zero.
**Verified:** `ls` confirms the linter exists only at the repo root, not under
`claude-plugins/expert-dev-tools/`. **Standard:** package self-containment — a distributable
artifact's test suite must run from the artifact alone. **Why it matters:** the plugin is now
registered in the marketplace (commit `4279859`), so it can be installed into a plugin cache
directory where that relative path resolves to nothing; the suite then reports FAILED for a
correct plugin. **Fix:** vendor the linter under `scripts/`, or degrade to a recorded skip
(`console.log` + no `failures++`) with the reason stated, rather than a hard fail.

### M-3 (Moderate, **new**) — `expert-architecture/SKILL.md` still carries the escaped-markdown corruption R-1 was written to repair

Spec R-1 (`spec-…:273–275`) scopes the unescape repair to `expert-spec` and `expert-review`.
`expert-architecture` has the same corruption and was not repaired: twelve escaped ATX headings
(`\## Goal — what this architecture serves`, `\## Scope`, `\## Design decisions`, … at lines
382–452) plus `&#x20;` entities and `\*\*`/`\*` escapes in the surrounding prose.
**Verified:** `grep -rlnE '\\(##|---|\*\*)' skills/` → **1 file**, `skills/expert-architecture/SKILL.md`;
`grep -nE` on that file → 12 numbered hits; context read confirms they are body prose, not fenced
code. **Standard:** R-1 completeness — the repair was scoped by enumerating known-bad files rather
than by scanning for the defect class. **Why it matters:** that section is the skill's output
contract; rendered, it reads as literal `\## Goal` text instead of a heading structure, degrading
the very document template the architect agent is told to follow. T-A1 passes because it parses
frontmatter only (see SYS-1). **Fix:** apply the same unescape to `expert-architecture`, and add a
structural assertion that no packaged SKILL.md body matches `/^\\#{1,6} /m`.

### M-4 (Moderate, **new**) — the feedback sweep silently degrades to unusable defaults instead of halting

`workflows/expert-lifecycle.js:285–286` defaults `readerScript` to the relative
`'scripts/extract-owner-turns.mjs'` and `transcriptDir` to `''`. `feedbackSweep` (lines 256–265)
interpolates both into the dispatch prompt unconditionally, so a command that fails to resolve the
transcript directory dispatches an agent told to read `the transcript directory ""`.
**Verified:** Read of lines 256–265 and 285–286 at drafting time. **Standard:** the artifact's own
spec F-12 (`spec-…:194–197`) — "not silent degradation"; fail-fast. **Why it matters:** the sweep
no-ops or hallucinates a directory, F-14/A-8 quietly stop working, and nothing reports it. This is
round-1 Mn-1 re-entering as a default rather than an omission. **Fix:** treat a missing
`transcript_dir` as an `ENVIRONMENT-BLOCKED` halt returned to the owner, or skip the sweep and
record the skip in `delta` so STATUS.md shows the feature is dormant — never dispatch on empty.

### M-5 (Moderate, **new**) — no README or prerequisite documentation, while preflight hard-requires an MCP server the plugin does not ship

The plugin root contains no `README.md` or install/prerequisite document
(**verified:** `ls -la` of the plugin root — `.claude-plugin`, `.mcp.json`, `agents`, `commands`,
`docs`, `scripts`, `skills`, `tests`; no README). Meanwhile `commands/expert.md:23–26` hard-requires
CodeGraph, which D8 deliberately does not bundle, and instructs the agent to report "how to enable
it" — guidance that exists nowhere in the plugin. **Standard:** distributable-package documentation
convention; every consumer-facing package states its prerequisites. **Why it matters:** now that
the plugin is marketplace-registered, a fresh install hard-fails at preflight with no documented
remedy. **Fix:** add a README covering install, the CodeGraph prerequisite and how to obtain it,
the two bundled MCP servers, how to run the two automated tiers, and the behavioral tier's token
cost.

### M-6 (Moderate, **new**) — the ledger's budget figure is a session-wide counter, not the segment's spend

`finish()` (`workflows/expert-lifecycle.js:296`) sets
`delta.budget.total_tokens = budget.spent()`, and `commands/expert.md:93` instructs "add
`budget.total_tokens` into the per-phase and total budget." Per the Workflow tool contract,
`budget.spent()` "returns output tokens spent this turn **across the main loop and all
workflows** — the pool is shared, not per-workflow." **Verified:** Read of line 296 and
`commands/expert.md:93` against that contract. **Standard:** spec F-11 (`spec-…:192–193`) —
"Token spend tracked **per phase and per round**"; and measurement validity generally. **Why it
matters:** the figure counts main-loop output tokens too and omits input tokens, then gets summed
across segments into a total the owner is shown at every gate — spec §8 "Budget transparency."
The number is not the thing it is labelled. **Fix:** either record per-phase deltas by sampling
`budget.spent()` before and after each phase's dispatches, or relabel the field honestly
(`session_output_tokens_observed`) and drop the per-phase claim from F-11 through a spec
amendment.

### Mn-1 (Minor, **new**) — the spot-check sampler's stated unpredictability property does not hold

`workflows/expert-lifecycle.js:202–204` comments that the stride is "seeded by ledger revision so
an agent cannot predict which citations are re-run." `sampleIndices` is a pure function of `n` and
`seed`, `seed = ledger.revision + 1` (line 284), and the ledger is a readable project file at
`.claude/expert/ledger.json` — the implementer holds `Read` (`agents/expert-implementer.md:6`).
**Verified:** Read of lines 202–218 and 284; Read of the implementer's `tools` line;
`commands/expert.md:13` for the ledger path. Demonstrated by executing the function:
`sampleIndices(5,1)` → `[1,3]`, which is exactly the computation
`tests/fixture/agents/forced-fabricating-implementer.md:15` performs by hand. **Standard:**
first-principles — the goal is that a fabricating agent cannot place its fabrication outside the
sampled set; the shortcut is deriving unpredictability from determinism over readable state.
Classified Minor because the control still catches non-adversarial fabrication, which is the
realistic case. **Fix:** drop the unpredictability claim from the comment (the determinism is
required for resume and is correct), or raise the sample rate so evasion requires fabricating
below the rate rather than at a predicted index.

### Mn-2 (Minor, **new**) — rounds 2–4 review records are absent, so the "independent-review PASS" claim cannot be audited

`docs/` contains `review-round-1.md` and remediation plans r1/r2/r3, but no round-2, round-3, or
round-4 review record; `plan-…-r3.md:2` cites "the round-3 independent review (verdict NEEDS
FIXES; **relayed in session**)" and commit `20255c3` claims remediation "to independent-review
PASS." **Verified:** `ls docs/` → `arch`, `plans`, `review-round-1.md`, `specs`; Read of
`plan-…-r3.md:1–6`. **Standard:** first-principles — the artifact's own RV principle
(`architecture-…:864–867`, `commands/expert.md:82–88`) holds that review results are never
discarded and never reduced to a summary, because a verdict without its findings cannot be
re-derived. The plugin's own development did not meet the bar the plugin enforces. **Fix:** commit
the round-2/3/4 finding sets if they are recoverable from the session records; otherwise state in
`docs/` that the PASS at `20255c3` rests on records that were not retained.

### Mn-3 (Minor, **new**) — marketplace registration contradicts the spec's out-of-scope list and a repo standing rule

Commit `4279859` adds a 19-line entry to `.claude-plugin/marketplace.json`. Spec §2
(`spec-…:57–58`, `65–67`) puts both "Marketplace publication and installs outside the owner's
machines" and "Changes to other plugins, **marketplace configs**" explicitly out of scope, "Per
repo standing rules"; the repo `CLAUDE.md` states "Don't touch other plugins or marketplace
configs unless explicitly scoped in." **Verified:** `git show --stat 4279859`; Read of
`spec-…:57–58, 65–67`. **Standard:** spec scope conformance; the artifact's own F-8/D9 amendment
discipline (a scope change is an amendment, recorded with cause). Classified Minor because the
change is small, plainly beneficial, and almost certainly what the owner wants. **Fix:** amend
spec §2 to bring marketplace registration in scope with the owner's approval recorded, so the
scope statement and the tree agree.

---

## Tentative Findings

**No tentative findings** — every candidate finding's premise was verified per Compliance Gate B.

Two candidates were investigated and **dropped** because verification refuted them, recorded here
so they are not re-raised:

1. *"The `tools` allowlists' `mcp__plugin_expert-dev-tools_context7` entry is malformed (missing
   the `__<tool>` segment), so four agents lose Context7."* Refuted. Context7
   `/websites/code_claude`, sub-agents page, retrieved 2026-07-26: "Both `tools` and
   `disallowedTools` fields accept MCP server-level patterns like `mcp__<server>` or
   `mcp__<server>__*` to grant or remove all tools from a named server." The entry is a valid
   server-level pattern and the plugin-scoped server name matches the documented format
   `mcp__plugin_<plugin-name>_<server-name>`.
2. *"`report()` reads `dispositions`/`feedbackEsc`/`reviewRecords` before their `const`/`let`
   declarations — temporal dead zone."* Refuted by Read: `report` is a hoisted declaration but its
   first call site is line 327, after the initializations at lines 289, 300, and 304.

---

## Observations

- **Clear Thought MCP was not connected in this session.** The `expert-review` skill mandates
  `metacognitivemonitoring` at review start and `collaborativereasoning` before delivery. Both
  were performed manually with the same personas (standards discipline, downstream consumer,
  implementer), per the skill's documented infrastructure-failure fallback. Recorded as the skill
  requires. The consumer perspective changed the delivered output: it moved the "green suites are
  not evidence of a working plugin" point into the Summary's first paragraph.
- The plugin declares `clear-thought` in its own `.mcp.json`, so an installed copy would supply
  what this review session lacked.
- Round-1 findings S-1 (`.mcp.json` wrapper), S-3 (dead `feedbackEscalation` variable), S-5
  (`spec_ready` never consumed), M-1 (real linter, strict `.mcp.json` read), M-2 (`phase` enum
  value), M-3 (missing A-4b/A-4c fixtures), and T-1 (`skills:` sequence form) are **closed**, each
  verified against the standard originally cited: `.mcp.json` read (wrapper present);
  `workflows/…:304–312` (escalation now routed and threaded onto the report);
  `commands/expert.md:166–177` (command advances `phase` to `architecture` on approval);
  `check-structure.mjs:82–89, 99` (real linter invoked, strict `mcpServers` read);
  `maybeNonConvergence` now writes `resumePhase`, all values in the schema enum; both fixtures
  present and parsing; all nine agents use the YAML sequence form.

---

## What's Actually Good

- **The ledger schema and its dependency-free validator.** `scripts/ledger.schema.json` is a
  precise draft-2020-12 schema with `additionalProperties: false` throughout, and
  `validate-ledger.mjs` implements exactly the keyword subset that schema uses — no more, no
  less — with a documented list of what it supports (lines 3–6). *Property:* the validator's
  capability is bounded to and matched with its input language, so it cannot silently pass a
  construct it does not understand. *Standard:* JSON Schema draft-2020-12 conformance for the
  declared subset, and YAGNI for the omitted keywords. *Verified:* Read of both files in full,
  plus execution — 11 T-U1 cases green, including the negative cases for wrong type, bad enum,
  below-minimum, additional property, bad `sha256` pattern, and non-integer revision.
- **The A-4b fabrication fixture is a genuinely well-built test.** It places its plant at an index
  derived from the sampler rather than a hand-picked one, documents the derivation, tells a future
  maintainer how to recompute it if `n` or the revision changes, and specifies the negative
  control ("Removing the plant → the spot re-run finds nothing"). *Property:* the test's positive
  result is causally attributable to the plant. *Standard:* ISO/IEC/IEEE 29119-4 — a test with a
  negative control distinguishes a working oracle from a vacuous one. *Verified:* Read of
  `tests/fixture/agents/forced-fabricating-implementer.md:12–47`, and I executed `sampleIndices(5, 1)`
  independently — it returns `[1, 3]`, confirming the fixture's stated derivation and that the
  plant at index 1 sits inside the sampled set.
- **The workflow's determinism constraints are honored.** No `Date.now()`, `Math.random()`,
  filesystem, or Node API appears in the orchestrator; the sampler is seeded from ledger revision
  precisely so a resume reproduces the same choice. *Standard:* the Workflow tool's own
  resume contract, which requires those APIs to be absent. *Verified:* the canonical
  `validate-workflow.mjs` linter executes clean against the file (structural suite line 89, green),
  and `sampleIndices`'s comment at lines 204–205 documents the constraint it is honoring.
- **The escalation surface is genuinely closed.** `GATE` (lines 37–44) enumerates exactly the six
  owner-gate types spec §3.4 defines, the schema's `escalations.gate_type` enum
  (`ledger.schema.json:110–113`) carries the identical six, and the command's step 5 presents
  exactly those six. *Property:* there is no path by which a new owner interruption can be
  introduced without changing all three in concert. *Standard:* the spec's own "exhaustive list"
  requirement (`spec-…:119–121`), enforced structurally rather than by convention. *Verified:*
  Read of all three locations and set comparison.

---

## Convergence Record

- **Round number:** 5.
- **Trajectory:** R1: 10 findings (5 Serious incl. 1 Systemic, 3 Moderate, 1 Minor, 1 Tentative) →
  R2: 3 → R3: 4 → R4: 0 (PASS, claimed) → **R5: 17**. R2 and R3 counts are taken from
  `plan-…-r3.md:12–20`, which is a prior-document claim; the underlying review records are not in
  the repo (Mn-2), so the middle of this trajectory is not independently auditable.
- **Flow counts for this round:** prior findings closed — **7** (round-1 S-1, S-3, S-5, M-1, M-2,
  M-3, T-1; each re-derived from source, see Observations). New — **15**. Recurring — **2**
  (S-1 here continues round-1 S-4's D9 failure at a different point in the data flow; S-5 here
  continues round-1 S-2 for the three agents the hybrid left on denylists). Regressions — **0**.
- **Tripwire evaluation — NOT FIRED.** Arithmetic shown for both conditions:
  - *(a) new + regression ≥ closed for two consecutive post-fix rounds.* This round:
    15 + 0 = 15 ≥ 7 — condition holds. Prior round (R4): 0 new + 0 regression = 0 ≥ 0 closed —
    at a claimed zero-finding PASS the condition is degenerate and is not counted as holding.
    Two consecutive rounds not established. **Does not fire.**
  - *(b) total findings has not strictly decreased for two consecutive post-fix rounds.*
    R3 (4) did not decrease from R2 (3) — one round. R4 (0) strictly decreased from R3 (4),
    breaking the streak. R5 (17) did not decrease from R4 (0) — one round. Two consecutive not
    established. **Does not fire.**

  The tripwire not firing is the correct mechanical result, but it should not be read as
  reassurance. The R5 count jumps from a claimed 0 to 17 because this round applied instruments
  the prior rounds did not: execution of the command-specified ledger against the validator, and
  Context7 verification of the live tool-name and inheritance semantics. The trajectory measures
  review depth here at least as much as artifact quality.

---

## Recommended Priority

1. **C-1 first, alone.** Nothing else in the plugin can be exercised until the lifecycle can
   advance past segment 1. Fix the fresh-ledger specification in `commands/expert.md` step 2 *and*
   add the unit case that builds the ledger from that specification and validates it — the test is
   the deliverable, not the fix.
2. **SYS-1 next, before the remaining fixes.** This is out of order by severity and deliberately
   so: the systemic test weakness is what allowed C-1, M-3, S-5, and S-6 to survive four review
   rounds at 25/25 green. Repairing the assertions first means the S-series fixes land against a
   suite that can actually detect whether they worked. Fixing S-1..S-6 against the current suite
   reproduces the condition that produced this review.
3. **S-2, S-3, S-1** — the workflow data-flow trio. All three are cases of a value computed and
   dropped, they sit in the same 100 lines, and they are the difference between the gate machinery
   working and appearing to work.
4. **S-5 and S-6 together** — both are capability-boundary defects on the same three agent files,
   both are fixed by the same mechanism (server-level deny patterns, verified against the
   documented semantics rather than assumed), and S-6 is the one place the plugin has an absolute
   rule.
5. **S-4** — the transcript reader. Serious but isolated to one feature whose behavioral tier has
   never run; correctness here matters most once F-14 is actually exercised.
6. **M-1 through M-6, then Mn-1 through Mn-3.**
7. **Then run the behavioral tier.** A-3 through A-9 are five unexecuted acceptance criteria and
   two verified failures. The automated tiers passing is not evidence the plugin works — that is
   the plugin's own "works ≠ correct" bar (`agents/expert-acceptance.md`), and it applies to the
   plugin itself.

Verdict: NEEDS FIXES (17 findings: 1 Critical, 6 Serious, 1 Systemic, 6 Moderate, 3 Minor)
