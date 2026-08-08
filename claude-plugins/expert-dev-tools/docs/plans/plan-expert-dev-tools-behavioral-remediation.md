# Implementation Plan — expert-dev-tools behavioral-tier remediation

**Date:** 2026-07-31
**Inputs:** `docs/investigate.md` §1–§7 (authoritative), `docs/behavioral-tier-findings.md`
(amended 2026-07-31), `docs/HANDOFF.md` (owner rulings), `docs/specs/spec-expert-dev-tools.md`,
`docs/arch/architecture-expert-dev-tools.md`
**Plugin version at plan time:** 0.1.0

---

## 1. Goal

Repair the three interacting mechanisms that made the expert-dev-tools spec review loop fail to
converge on a trivial task, plus the seven other defects the first behavioral run surfaced. The
convergence failure is now fully diagnosed: each round, a **freshly rewritten** document met a
**fresh reviewer holding a different ruler**, and the writer **could not reach any documentation**
to satisfy citation findings. This plan removes all three — restores the documentation
instruments, makes correction structural rather than instructional, and binds every review gate to
a named ruler — then closes B1, B2, B5, B6, B8, and resolves B3 and B4 in the strengthening
direction only. Success is a plugin whose spec gate can converge on the `farewell()` fixture, with
every change verified by the structural tier and the behavioral tier re-run from A-3 segment 1.

---

## 2. Scope

### In scope

Every item in the requested scope, mapped in the coverage reconciliation below.

### Out of scope

- **Raising `ROUND_CAP` or softening the binary verdict enum.** Owner ruling (HANDOFF, "strictness
  is not the suspect") and the recovered correction draft both place these out of bounds. Not a
  deferral — a prohibition.
- **Giving the reviewer a prescribed-fix field.** Owner ruling, 2026-07-28.
- **Re-asking the round-cap / zero-findings calibration question.** `behavioral-tier-findings.md`
  defers this until measured against the repaired loop; asking it now would be answered against
  the machinery this plan replaces.
- **The eight other plugin load errors.** Owner ruling 2026-07-31: not relevant, other plugins.

### Where this plan ends

At a plugin whose structural tier is green and whose behavioral tier is ready to re-run. The
re-run itself is Post-completion (§16), not a step — it costs ~1.5 M subagent tokens and is the
owner's call to spend.

### Coverage reconciliation

| Requested element | Steps | Or approved exclusion |
|---|---|---|
| (1) context7 collision + 6 agents' documentation grants | S1, S2, S3 | — |
| (2) B9b correction discipline, revise path | S4, S5, S6, S6b, S7 | implementation gate excluded — D-2 |
| (2a) B9c — a finding the corrector cannot satisfy has no escape hatch | **S15b** (the `CORRECTOR_HALTED` path) | — |
| (2b) correction failed — regressed at its fix site, or left its class open | S6b (detects), S15b (routes) | — |
| (3) review dispatch names no ruler, 4 gates (subsumes B10) | S8, S9 | — |
| (4) `diagnose()` failure-record channel, 8 call sites | S12, S13, S14, S15 | — |
| (5) delete six "flag once then comply" sites | S16 | — |
| (6) one artifact-path convention (subsumes B7) | S10, S11 | — |
| (7) B1 | S18 | — |
| (7) B6 | S17 | — |
| (7) B2 | S19 | — |
| (7) B8 | S20 | — |
| (7) B5 | S21 | — |
| (8) B3, B4 | S22 — **resolved**, not surfaced (Q-12, superseded disposition) | — |
| Agent return contracts bound to the schemas the workflow reads (review r2 SYS-2, r3 S-1/S-5) | S2b | — |
| `findings[].location` required with a grammar (review r3 S-6) | S6b part 5 | — |
| Documentation sync | S23 | — |

No element maps to nothing. No exclusion above removes requested work: the four out-of-scope items
are owner prohibitions and a deferral the source document already records, not planner-chosen
narrowing.

---

## 3. Standards that govern this plan

**Re-derived from §7's 26 Source annotations, 2026-07-31.** §3 is a restating surface: it is rebuilt
from the steps, never appended to (§7 maintenance rule 3).

| Standard | Steps it governs, and what it governs there |
|---|---|
| **Observed Claude Code runtime behaviour** (`/plugin` dedupe message, reproduced 2026-07-31) | **S1** — MCP servers are deduplicated on command/URL, so a distinct invocation string is the only property that restores registration. |
| **Claude Code sub-agents documentation** (code.claude.com/docs/en/sub-agents, Context7 2026-07-31) | **S2, S2b, S5** — `tools`/`disallowedTools` semantics (both may coexist; `disallowedTools` applies first), and that `tools` is a hard allowlist so omission is enforcement. |
| **Principle of least privilege** (NIST SP 800-53 AC-6) | **S2, S5, S20** — minimum instruments per role; `Write` withheld from the corrector; write-scope control extended to the document phases. |
| **architecture D5/D11 refinement** (`docs/arch/…:863`, owner directive) | **S2** — the reviewer's WebFetch/WebSearch denial, which excludes it from S2's grant. Asserted at `check-structure.mjs:71`, whose `(F3)` label is the test author's attribution, not the spec's text (claim 6). |
| **Design by Contract (Meyer)** | **S2b, S6b, S9, S14, S20** — caller and agent must agree. S14 fixes agent-promises-more; S2b and S6b fix caller-expects-more; S9 cites only contracts that exist; S20 pairs a new dispatch with the agent's job list. |
| **The generation rule** (claim 27, `cd2f27b`: "Scripts that *generate* a derived surface are the fix; scripts that *audit* prose are the problem") | **S2b** — `returns:`/`jobs:` is a derived surface with a generator. D-8 records the surfaces where generation is unavailable. |
| **Regression-detection principle** (`testing-standards.md`: every fixed defect gets a check that would have caught it) | **S3, S6b, S7, S15, T-2b** — each correction carries the assertion that would have caught it. |
| **APS Fusion re-derivation discipline** (`mcp-servers/aps-fusion-mcp-server/HANDOFF.md` @ `755bf9b`, `cd2f27b` — claim 27) | **S4, S5, S6b** — the correction method, and the evidence that patching *and* re-authoring both fail. |
| **Single Responsibility Principle (SOLID)** | **S4** — authoring and correcting are different disciplines; one document serving both serves one badly. |
| **Architecture D6** | **S6, S6b, S15b** — the implementation gate remediates via amend-plan through the planner, which is why the corrector and both detectors are scoped away from it. |
| **`skills/expert-review/SKILL.md:111`** | **S8** — "The plan, spec, or architecture is the validation reference, **not the quality standard**" — the clause the dispatches failed to carry. |
| **ISO/IEC/IEEE 29148:2018** requirement characteristics | **S8** (the spec gate's external ruler), **S10, S11, S17** (§5.2.6 Consistent — one artifact-path convention against six sources; one registration point across three phases). |
| **Single Source of Truth** (Beck, *Once and Only Once*) | **S10, S11** — the artifact path is stated once and derived everywhere else. |
| **Owner rulings** (`docs/HANDOFF.md`; `docs/investigate.md` §6) | **S10, S11** (the skill's convention wins; the workflow consumes `artifact_path`), **S16** (deletion, no replacement), and §2's scope exclusions. |
| **spec F-13 + architecture C3** | **S12, S13** — the approved contract requiring "failure record + ledger snapshot + journal excerpt"; the workflow is brought into compliance, the contract is not bent to the code. |
| **Fail-fast / explicit-contract principle** (OWASP Logging Cheat Sheet: silent loss is a detection gap) | **S12, S13** — evidence live in lexical scope and discarded at the dispatch boundary. |
| **OWASP fail-safe defaults** (named at `docs/arch/…:750` for D6 STOP routing) | **S15b** — a new `runGate` state must fail closed, never fall through to the success path. |
| **spec F-14 + architecture D15** | **S18, S19** — the four feedback verdicts and the corrected/stale split. |
| **Idempotence of a recorded observation** | **S19** — re-reading the same transcript is not a new occurrence; dedupe on `(project, session_file)`. |
| **The plugin's correction doctrine** (`docs/behavioral-tier-findings.md`) | **S22** — the machine may not *weaken* its own ruler; every change there strengthens it. |
| **`expert-plan/references/testing-standards.md`** | **S21** (test data must describe the state it represents) and **§12** — per-type requirements and the fake-test anti-pattern catalog. |
| **ISO/IEC/IEEE 29119-4:2021 test design techniques** | **§12** — every specification names its technique. |
| **Software Engineering at Google** (Unit Testing / Test Doubles) | **§12** — real-by-default, state over interactions, never double the subject. |
| **expert-plan Step 8 documentation-sync requirement** | **S23** — if the code changes and the docs do not, the docs are now wrong. |

---

## 4. Spec issues

None. Planning surfaced no conflict between the governing spec/architecture and reality. The one
apparent conflict — the workflow supplying two of the four channels spec F-13 mandates, and the
structured evidence at only three of eight sites — is a
**code-versus-contract divergence**, not a spec defect: the contract is correct and the code
diverges from it. S12–S13 bring the code into compliance. Recorded as register entry Q-7.

---

## 5. Files affected

**Re-derived from §7's step set** (§7 maintenance rule 1 — this section restates, it never
originates). **Last re-derived: 2026-07-31, against the current 26-step set.** The **five**
sublists below are jointly "§5's file list" for T-21's purposes: Created, Modified—configuration,
Modified—agents, Modified—skills, Modified—workflow/command/tests/docs. There is no wildcard row;
S23's document set was enumerated at plan time.

**Created (3)**
| Path | Steps |
|---|---|
| `skills/expert-correct/SKILL.md` | S4 (creates, incl. the corrector's return contract) |
| `agents/expert-corrector.md` | S5 (creates, frontmatter **and** body) |
| `README.md` | S1 (records the `.mcp.json` invocation reason), S23 (writes it) — **does not exist today**; `find -iname "readme*"` over the plugin returns nothing, so this is a creation, not a modification |

**Modified — configuration (1)**
| Path | Steps |
|---|---|
| `.mcp.json` | S1 |

**Modified — agents (9; the tenth, `expert-corrector.md`, is under Created)**

S2b adds `returns:` and `jobs:` frontmatter plus the matching body statement to **every** agent, so
the three denylist agents are modified too — they were untouched before S2b existed.

| Path | Steps |
|---|---|
| `agents/expert-spec-writer.md` | S2 (grant), S2b (contract) |
| `agents/expert-implementer.md` | S2 (grant), S2b |
| `agents/expert-verifier.md` | S2 (grant), S2b, **S20 (jobs: 3 → 4)** |
| `agents/expert-diagnostician.md` | S2 (grant), S2b, S14 (contract text) |
| `agents/expert-acceptance.md` | S2 (grant), S2b |
| `agents/expert-closeout.md` | S2 (grant), S2b |
| `agents/expert-reviewer.md` | **S2b only** — no grant change (`arch:863` denies it WebFetch/WebSearch); it emits `findings[].location`, so it needs the contract |
| `agents/expert-architect.md` | **S2b only** |
| `agents/expert-planner.md` | **S2b only** |

**Modified — skills (7)**
| Path | Steps |
|---|---|
| `skills/expert-spec/SKILL.md` | S11, S16 |
| `skills/expert-standard/SKILL.md` | S16 |
| `skills/expert-review/SKILL.md` | S16 |
| `skills/expert-architecture/SKILL.md` | S11, S16 |
| `skills/expert-architecture-portable/SKILL.md` | S11, S16 |
| `skills/expert-mcp-overhaul/SKILL.md` | S16 |
| `skills/expert-plan/SKILL.md` | S11 |

**Modified — workflow, command, tests, docs (7)**
| Path | Steps |
|---|---|
| `workflows/expert-lifecycle.js` | S6, S6b, S8, S9, S10, S12, S13, S15b, S17, S18, S20, **S22** (`EVIDENCE` split) |
| `commands/expert.md` | **S10** (the sixth artifact-path source), S18, S19 |
| `tests/structural/check-structure.mjs` | S3, S7, S15, **S2b** (the contract-binding assertion) |
| `tests/fixture/spec/spec-contradictory.md` | S21 |
| `tests/ACCEPTANCE.md` | **S22** (A-8 corrected to match spec F-14) |
| `docs/investigate.md` | S23 (mark remediated items) |
| `docs/behavioral-tier-findings.md` | S23 (mark remediated items) |
| `README.md` | S1 (created), S23 |

**What S22 does and does not touch.** S22 **edits both** `tests/ACCEPTANCE.md` (A-8) and
`workflows/expert-lifecycle.js` (the `EVIDENCE` split plus the cross-entry consistency check), in
the strengthening direction only. What it must not do is *weaken* a verification mechanism: the
spot-check sampling constant `max(2, ceil(0.1n))` is unchanged, no existing check is removed, and
the schema split is additive. T-20 asserts those properties; T-21 asserts the file set.


**Dependents requiring verification after change.** `codegraph_get_dependents` on
`workflows/expert-lifecycle.js` returns **0** — nothing imports it; it is loaded by the Workflow
tool by path, not by module resolution. Same for `tests/structural/check-structure.mjs` (0). The
JS blast radius is therefore contained to the edited files themselves. The real coupling in this
plugin is **by string reference, not by import** — the workflow names agents by
`expert-dev-tools:<name>` and the command names paths — which is why S3/S7/S15 add structural
assertions to cover what the dependency graph cannot see.

**Documentation files to review (S23).** `codegraph_find_related_docs` is run in S23 over the full
modified set; the known-affected docs are `docs/investigate.md`, `docs/behavioral-tier-findings.md`,
`tests/ACCEPTANCE.md`, and `README.md`.

---

## 6. Foundation corrections

Three, all ordered before the work depending on them.

**F-1 — the bundled context7 server never starts (S1).** Standard violated: the plugin's own
dependency declaration is inert. Cannot be deferred: four agents' only documentation grant names
a namespace that registers zero tools, so any step that assumes an agent can verify a citation is
building on a false premise.

**F-2 — six agents cannot reach documentation at all (S2).** Standard violated: `expert-spec`
step 3 requires verification "via Context7 **or** the authoritative source" — two paths — and
these agents hold neither after F-1. Cannot be deferred: it is one of the three convergence
mechanisms, and the corrector created in S5 inherits the same requirement.

**F-3 — `diagnose()` has no evidence channel (S12–S13).** Standard violated: spec F-13 and
architecture C3 mandate four input channels. The ledger is supplied at all eight sites and the
failing output at three (`:310`, `:396`, `:448`, which interpolate the disposition, the stop report
and the failed criteria); the run journal and the artifacts at none; and the **structured** evidence
is discarded at five of eight — the shape that matters, because those five are where the evidence
lives in a collection rather than a single object. Ordered early because it is what
lets the system diagnose its own future failures rather than requiring hand reconstruction from
transcripts — the labour this session performed manually.

---

## 7. Plan

**Maintenance rule for this section — read before editing any step (D-8).** Six sections duplicate
information that originates here: §2's coverage table, §5's file list, §11's claims, §12's test IDs,
§14's register, and each step's own dependency list. None of them is generated, so each is a drift
site, and drift in exactly this shape is what fired the APS Fusion tripwire (claim 27).

Therefore:

1. **§7 is the origin.** A step's "What changes" and "Dependencies" fields are authoritative for
   which files it touches and what it follows. The other five sections restate; they never
   originate.
2. **References run one way where the contract permits it.** §11 claims name the steps that depend
   on them; steps do not carry claim numbers.

   **This does not extend to §12.** The output contract requires test specifications to trace to
   their step ("behavior verified, traced to spec requirement **or step**"), so specifications name
   their steps *and* step Verification fields name their test IDs. That pair is bidirectional by
   contract; rule 3 is what keeps it consistent. Do not one-way it.
3. **Editing a step re-derives the restating sections; it never patches them.** Adding, removing,
   renaming or re-scoping any step means walking **§1's Goal sentence, §2, §3, §5, §11, §12, §13
   and §14** and re-deriving each from the current step set — not locating and amending the lines
   that mention that step. A step rename that is grep-and-replaced through the restating sections is
   the failure this rule exists to prevent.

   **Keep this enumeration complete.** A maintenance rule blind to one of the surfaces it governs
   cannot catch that surface drifting, and the enumeration is itself hand-maintained. When a section
   restating step data is added to the plan, add it here in the same edit.
4. **A finding in any restating section is a class signal, not an instance.** If a reviewer finds
   one drifted entry, all six sections are re-derived before the finding is reported closed.
5. **Any step that changes what the workflow expects of an agent carries a paired edit to that
   agent's governing document, listed in §5.** Agent markdown is a *contract*, not configuration.
   Round 1 of review found this violated three times — a corrector with no body, a required return
   field nothing obliges the agent to emit, and a fourth job dispatched to a verifier whose contract
   enumerates three — while §3 named Design by Contract as governing and S14 applied it in the other
   direction. The rule is symmetric: caller and agent must agree, whichever side moves. S15's
   sibling assertion (added in S7) pairs every `AGENT.<x>` dispatch label in the workflow against a
   job enumerated in that agent's file, so the class cannot recur silently.

### S1 — Break the context7 command collision

**What changes.** In `.mcp.json`, change the `context7` server's invocation from
`{"command": "npx", "args": ["-y", "@upstash/context7-mcp"]}` to
`{"command": "cmd", "args": ["/c", "npx", "-y", "@upstash/context7-mcp"]}`, matching the form
`agentboard`'s `.mcp.json` uses for its clear-thought server. Add a comment-bearing sibling key is
not possible in JSON; instead record the reason in `README.md` (S23) and in the structural
assertion added by S3, so the unusual form is not "cleaned up" later.

The server **key stays `context7`** — the collision is on command/URL, not on name.

**Source.** `docs/investigate.md` §1 (confirmed defect) and §5d (the host's own message).

**Why this approach.**

1. *Decision.* Make the plugin's context7 invocation string distinct from the standalone context7
   plugin's, leaving the server name unchanged.
2. *Authoritative standard.* Observed Claude Code runtime behaviour, reproduced 2026-07-31:
   `/plugin` reports `MCP server "context7" skipped — same command/URL as server provided by plugin
   "context7"`. Corroborated by the natural experiment on this machine — three `clear-thought`
   servers with **different** command strings all register, while two `context7` servers with
   **byte-identical** command strings produce one skip.
3. *Why it applies here.* The deduplication key is the command/URL, so distinctness of that string
   is the only property that restores registration. Nothing else in the declaration matters.
4. *What this is NOT — and why.* **Not a rename of the server key**: the key is not the dedupe key,
   so renaming changes nothing, and it would additionally break
   `tests/structural/check-structure.mjs:100`, which asserts the declared server set contains
   `context7`. **Not removal of the bundled server in favour of the host's**: a distributed plugin
   cannot depend on what the user happens to have installed — that is precisely the coupling that
   produced this defect. **Not `@upstash/context7-mcp@latest`**: a floating version tag changes
   resolution semantics to get a string difference, coupling an unrelated behaviour to a
   workaround.

**Dependencies.** None. Unblocks S2 (the grant in S2 is only meaningful once the namespace exists).

**Verification.** T-1. Additionally: after `/reload-plugins`, `mcp__plugin_expert-dev-tools_context7__resolve-library-id`
resolves. This is an owner-run check — the implementer records the expectation; the reload is not
scriptable from inside a session.

**Impact if wrong.** Contained and immediately visible: the namespace stays empty and S2's grant
still resolves to nothing. No data loss, fully reversible.

---

### S2 — Grant documentation instruments to the six allowlisted agents

**What changes.** In each of the six agent files, extend the `tools:` allowlist with `WebFetch,
WebSearch`, and — for the two that hold no documentation tool at all — add
`mcp__plugin_expert-dev-tools_context7`:

| File | Current `tools:` | After |
|---|---|---|
| `agents/expert-spec-writer.md` | `Read, Grep, Glob, Write, Skill, mcp__plugin_expert-dev-tools_context7` | + `WebFetch, WebSearch` |
| `agents/expert-implementer.md` | `Read, Grep, Glob, Write, Edit, NotebookEdit, Bash, Skill, mcp__plugin_expert-dev-tools_context7` | + `WebFetch, WebSearch` |
| `agents/expert-verifier.md` | `Read, Grep, Glob, Bash, Skill, mcp__plugin_expert-dev-tools_context7` | + `WebFetch, WebSearch` |
| `agents/expert-diagnostician.md` | `Read, Grep, Glob, Bash, Skill, mcp__plugin_expert-dev-tools_context7` | + `WebFetch, WebSearch` |
| `agents/expert-acceptance.md` | `Read, Grep, Glob, Bash, Skill` | + `mcp__plugin_expert-dev-tools_context7, WebFetch, WebSearch` |
| `agents/expert-closeout.md` | `Read, Grep, Glob, Write, Bash, Skill` | + `mcp__plugin_expert-dev-tools_context7, WebFetch, WebSearch` |

`agents/expert-reviewer.md`, `agents/expert-architect.md`, `agents/expert-planner.md` are **not
touched** — they run denylists and already inherit a working host Context7.

**Source.** `expert-spec/SKILL.md:163` requires verification "via Context7 or the authoritative
source"; owner ruling (HANDOFF): "When information is missing, the agent goes and finds it."
`docs/investigate.md` §1a, §4e.

**Why this approach.**

1. *Decision.* Give every allowlisted agent both documentation paths the skills require — a
   Context7 grant and a fetch/search fallback — rather than only the Context7 grant.
2. *Authoritative standard.* Claude Code sub-agents documentation (read via Context7 2026-07-31):
   `tools` is an allowlist granting only what it names; NIST SP 800-53 AC-6 (least privilege) sets
   the ceiling at what the role needs.
3. *Why it applies here.* `expert-spec` step 3 names **two** acceptable verification paths.
   Reaching "the authoritative source" requires locating the page (`WebSearch`) and reading it
   (`WebFetch`). An agent ordered to verify every external reference and given one path has an
   unsatisfiable instruction the moment that path fails — which is exactly what happened, and what
   made R5's Systemic Traceable finding unfixable.
4. *What this is NOT — and why.* **Not a denylist conversion for these six**: the structural tier
   (`check-structure.mjs:64-66`) asserts these agents carry allowlists, and a denylist would grant
   them the full host MCP surface including `Agent`/`Task`, breaking the dispatch topology.
   **Not extended to `expert-reviewer`**: the architecture denies it WebFetch/WebSearch
   (`arch:863`, D5/D11 refinement, owner directive), mechanically asserted at
   `check-structure.mjs:71`; the reviewer already reaches documentation through inherited MCP,
   which is how R1/R5 fetched Node.js pages. **Not "rely on S1 alone"**: a bundled
   server can always be skipped by something the user installs, so no agent may depend on it as
   its only route — that is the lesson of F-1, not merely its symptom.

**Dependencies.** S1 (the Context7 grant is inert until the namespace exists). Unblocks S3, S5.

**Verification.** T-2.

**Impact if wrong.** Contained. A malformed frontmatter line makes the agent fail to load, caught
by `check-structure.mjs` T-A2b before any dispatch. Reversible.

---

### S2b — Bind each agent's output contract to the schema the workflow reads

**What changes.** The workflow consumes structured returns whose contract exists **only** in
`workflows/expert-lifecycle.js`'s schema objects. No agent document states any of it. Swept over
the complete plugin, 2026-07-31: `artifact_path`, `sections_rederived`, `finding_addressed`,
`premise_evidence`, `files_changed`, `correction_draft` and `responsible_component` are named in
**zero** files under `agents/` and **zero** under `skills/`; only `stop_report` appears in one agent
file. Separately, 7 of 9 agents enumerate no jobs at all (only `expert-verifier` "one of three" and
`expert-diagnostician` "one of two").

Three edits:

1. **Each agent's frontmatter gains a machine-readable `returns:` sequence** naming the schema
   fields that agent must emit, and a `jobs:` integer naming how many distinct dispatches it
   answers. Both are frontmatter, so the existing `frontmatter()` parser at
   `tests/structural/check-structure.mjs:14–34` reads them with no new parsing machinery — it
   already handles YAML block sequences (`:22–28`).
2. **Each agent's body states the same contract in prose**, generated from the frontmatter rather
   than written independently, so the two cannot disagree.
3. **`tests/structural/check-structure.mjs` gains the binding assertion.** Oracle, stated at the
   level S15 uses, all by literal match on the workflow's source text — no dataflow analysis:
   - Parse the `const AGENT = { … }` block (`:22–32`) into `key → 'expert-dev-tools:<file>'`.
   - Collect every `agent(` call's options object; from each, capture `agentType: AGENT.<key>`,
     `schema: <NAME>_SCHEMA`, and `label: '<literal>'`.
   - Parse each `const <NAME>_SCHEMA = { … }` block for its top-level `properties:` key names.
   - Assert, per agent: its `returns:` ⊇ the union of the property names of every schema it is
     dispatched with; and `jobs:` equals the count of distinct `label` values targeting it.

   **Scope, stated rather than implied: this asserts against the *declared schema surface*, not
   against what the workflow actually reads.** Determining the latter means tracking each receiving
   variable's property accesses across the file — `impl.stop_report` (`:394`), `vr.checks` (`:424`),
   `acc.criteria` (`:446`), `co.core_draft` (`:468`) — which is dataflow analysis and beyond what
   this suite does anywhere. The declared surface is a superset of what is read, so the assertion is
   conservative: it can demand a field the workflow ignores, never miss one it consumes. Note that
   `frontmatter()` suffices for the **agent** side only; the workflow side above is new parsing and
   is specified as such.

**Source.** Review round 2, SYS-2 and C-1; round 1 SYS-1 (the same class at three earlier sites);
Design by Contract (Meyer), named in §3.

**Why this approach.**

1. *Decision.* Declare the contract in machine-readable frontmatter and assert the binding
   mechanically, rather than pairing seven fields across nine agents by hand.
2. *Authoritative standard.* The generation rule this plan already adopts at D-8, sourced from the
   APS Fusion record (claim 27, commit `cd2f27b`): "Scripts that **generate** a derived surface are
   the fix; scripts that **audit** prose are the problem." A `returns:` sequence is a derived
   surface with a generator — the schema — and is therefore inside the rule rather than outside it.
3. *Why it applies here.* This class has now produced findings in two consecutive review rounds at
   six distinct sites. Hand-pairing closes the named sites and re-arms on the next schema change,
   which is the mechanism D-1's third row describes and the reason round 1's three paired edits did
   not prevent round 2's three.
4. *What this is NOT — and why.* **Not seven paired prose edits**: that is the fix that already
   failed once, at this exact class. **Not an assertion that counts jobs enumerated in prose** — the
   the two agents that do enumerate use different formats (numbered list vs bold-headed paragraphs)
   and `check-structure.mjs` has no prose parser, so that oracle is undecidable. Frontmatter is decidable with the parser that already exists.
   **Not a change to the schemas themselves**: they are correct; nothing states them to the agents
   that must satisfy them.

**Dependencies.** S2 (frontmatter is already being edited for the same six agents; this extends that
edit). **Unblocks S6b** (`sections_rederived` becomes obliged), **S10/S17/S20** (`artifact_path`
becomes obliged), and **replaces S7's prose-counting class guard**, which is withdrawn.

**Verification.** T-2b.

**Impact if wrong.** Loud and contained. A wrong `returns:` entry fails the binding assertion in the
structural tier before any dispatch. The risk in the permissive direction — an under-specified
`returns:` — leaves a field unobliged, which is the status quo, not a new harm.

---

### S3 — Assert the documentation grants structurally

**What changes.** In `tests/structural/check-structure.mjs`, after the existing `readonlyAllow`
block (line 66), add: for every agent in `allowlist`, assert `tools` contains `WebFetch`,
`WebSearch`, and `mcp__plugin_expert-dev-tools_context7`. Add a matching assertion that the
`.mcp.json` `context7` entry's `args` array contains `@upstash/context7-mcp` **and** that its
`command` is not the bare `npx` form — with an inline comment naming the dedupe reason, so S1's
unusual invocation is protected from a future tidy-up.

**Source.** `docs/investigate.md` §1a — the grant defect was silent for the whole A-3 run because
nothing asserted it. A correction with no regression guard is a correction that recurs.

**Why this approach.** Trivial-plus: the standard is the general regression-test principle
(`testing-standards.md`, Regression tests — every fixed bug gets a test that would have caught it).
The four-part expansion is not required for adding an assertion to an existing suite whose shape is
already fixed.

**Dependencies.** S1, S2. Unblocks nothing.

**Verification.** T-3.

**Impact if wrong.** A wrong assertion fails the structural tier loudly. No runtime effect.

---

### S4 — Create the correction skill

**What changes.** Create `skills/expert-correct/SKILL.md` — a skill governing *re-derivation of an
artifact's affected sections against a finding set*, distinct from authoring. The discipline, in
order, per finding:

1. **Identify the section the finding lands in, and that section's sources** — the requirement, the
   standard, the upstream artifact, the read of code or documentation it was derived from.
2. **Re-derive the section from those sources.** Go back to what the section was built from and
   build it again correctly. Do **not** edit the sentence the finding points at.
3. **Sweep the finding's class across the whole artifact.** The finding is one instance; every
   other passage of the same class is corrected in the same pass.
4. **Re-read what the re-derivation made stale.** Every passage that referenced the rewritten
   section, whether or not the edit touched it.
5. **Verify the whole record, not the half that supports the edit.** Where the finding asserts a
   relation, every term of that relation must be bounded somewhere in the artifact. Where a worked
   example and a normative reference disagree, the normative reference is the contract.

The skill states explicitly that **patching is forbidden** — editing the symptom at the fix site
without re-deriving is the failure mode this discipline exists to remove — and that **re-authoring
the artifact from the task is equally forbidden**, because it discards the sections no finding
touched and regenerates a fresh defect surface. The edit's *size* is whatever re-derivation
produces; size is not the discipline. A finding whose named standard the corrector cannot verify is
reported back, never guessed at.

**Source.** `docs/behavioral-tier-findings.md` B9b; `docs/investigate.md` §4g (11 Writes, 0 Edits);
the correction discipline recorded in `mcp-servers/aps-fusion-mcp-server/HANDOFF.md` ("re-derive the
affected section from its sources, sweep the finding's class, re-read what the edit touched"),
which is the same discipline proven over rounds 13–19 of that project.

**Why this approach.**

1. *Decision.* Author a dedicated correction skill rather than adding a revision mode to each
   authoring skill.
2. *Authoritative standard.* The re-derivation discipline recorded in
   `mcp-servers/aps-fusion-mcp-server/HANDOFF.md`, "Process record — why twenty rounds, and what to
   keep": **rounds 1–11 failed on patch-style corrections**; rounds 13–19 applied "re-derive the
   affected section from its sources, sweep the finding's class, re-read what the edit touched" and
   **every closure was verified by the following round**. That is a measured result over nineteen
   rounds on a second project, not a preference. Reinforced by SRP (SOLID) applied to instruction
   documents: authoring and correcting are different disciplines, and a document serving both serves
   one badly.
3. *Why it applies here.* `expert-spec/SKILL.md` opens "You are writing a specification" and
   contains no revision guidance (`docs/investigate.md` §2). Dispatching correction work into it
   produced eleven full re-authorings. The A-3 run also produced the *other* failure in the same
   place: R5's Minor was a **fix-site regression** — the writer added a `scratch-note.txt` paragraph
   to close R4's finding and the new paragraph contradicted itself (`docs/investigate.md` §4b).
   Both failure modes appeared in one five-round run, which is why the skill forbids both.
4. *What this is NOT — and why.* **Not a patching discipline.** Patching — editing the passage the
   finding names, at the fix site, without returning to that passage's sources — is the failure the
   APS Fusion cycle spent eleven rounds proving, and it recurred three times (rounds 15, 16, 19)
   even after the discipline was adopted, each time from verifying only the half of the record that
   supported the edit. A skill that optimises for small edits selects for exactly this.
   **Not re-authoring from the task**: that is what the A-3 writer did, and it discards every
   section no finding touched. **Not a per-gate skill**: the discipline is artifact-agnostic and
   three copies would drift. **Not a plan document per failed round**: rejected by owner ruling.

**Dependencies.** None. Unblocks S5, S6.

**Verification.** T-4.

**Impact if wrong.** A weak correction skill degrades correction quality but cannot corrupt an
artifact beyond what a review round catches. Recoverable.

---

### S5 — Create the corrector agent with no `Write`

**What changes.** Create `agents/expert-corrector.md` — frontmatter **and body**, matching the shape
of the nine existing agent files (all nine verified: `---`-delimited frontmatter, `skills:` before
`tools:`, and a role body; e.g. `expert-architect.md:11` opens "Your first action: invoke
`Skill(…)`"):

```markdown
---
name: expert-corrector
description: Re-derives an artifact's affected sections against a review finding set. Never
  authors from the task, never replaces the artifact wholesale.
skills:
  - expert-dev-tools:expert-correct
tools: Read, Grep, Glob, Edit, Skill, mcp__plugin_expert-dev-tools_context7, WebFetch, WebSearch
disallowedTools: mcp__claude_ai_CORE_Memory__memory_ingest
jobs: 1
returns:
  - status
  - artifact_path
  - sections_rederived
  - halt
---
```

`returns:` and `jobs:` are S2b's contract keys, present here because S2b's binding assertion runs
against **every** agent including this one. Omitting them turns the structural tier red at CP-2 with
no authorized remedy — the exact outcome that withdrew S7's earlier guard. `agents/expert-corrector.md`
is therefore listed under **both** S5 (created) and S2b (contract keys) in §5.

The body states, at minimum:

- **Skill-invocation-first.** "Your first action: invoke `Skill(expert-dev-tools:expert-correct)`
  and follow it." Without this the agent holds a tool grant and no discipline — the skill is where
  the method lives.
- **The role boundary.** It re-derives sections of an existing artifact against findings. It does
  not author, does not decide scope, and does not act on a finding whose named standard it cannot
  verify.
- **The structured return contract**, which S6b's detectors consume: `status`; `artifact_path`;
  and **`sections_rederived`** — every section re-derived, each with `location` (in the grammar
  S6b part 5 fixes: `path:start-end` or `path#section`), `source` (what it was re-derived from),
  and **`class_sweep`** (`searched` — what the sweep looked for; `found` — every location the
  search returned, corrected or not). Emitting all three is not optional: `location` feeds detector
  (a), and `class_sweep.found` minus the corrected locations *is* detector (b).
- **The halt path.** A finding whose named standard cannot be verified returns `status: 'halted'`
  with the reason in `halt.detail` — consumed by S15b. It is never guessed at and never silently
  skipped.

`Write` is deliberately absent from the grant.

**Source.** `docs/investigate.md` §4g; Clear Thought decision `b9b-correction-discipline`
(recorded in §10, D-1).

**Why this approach.**

1. *Decision.* Omit `Write` so the corrector cannot replace the artifact wholesale, while leaving
   `Edit` unconstrained in size so a re-derived section can be written back at whatever length
   re-derivation produces.
2. *Authoritative standard.* NIST SP 800-53 AC-6 (least privilege), applied to the *specific*
   capability that caused the observed failure: whole-file replacement. Claude Code sub-agents
   documentation (Context7, 2026-07-31) — `tools` is a hard allowlist, so omission is enforcement.
3. *Why it applies here.* Whole-file replacement is what discards the sections no finding touched.
   Eleven `Write` calls across six dispatches is exactly that, and it is why each round's reviewer
   met a document with a fresh defect surface rather than a narrowing one. `Edit` imposes no size
   limit — a re-derived section can be one sentence or forty — so removing `Write` removes the
   re-authoring failure without pushing toward the patching failure.
4. *What this is NOT — and why.* **NOT a device to make edits small.** Small, symptom-local edits
   are *patching*, which is the failure mode with the longest evidence trail in this repo — eleven
   failed rounds on APS Fusion, plus three fix-site regressions after the discipline was adopted.
   The tool grant is silent on edit size by design; §S4's skill governs method, and method is where
   patching is forbidden. **Not `Write` retained for "a legitimate full rewrite"**: at a review gate
   the artifact exists and its untouched sections are correct by the prior round's review; replacing
   them wholesale destroys reviewed work. **Not a denylist**: `check-structure.mjs:64` partitions
   agents into allowlist and denylist sets, and a denylist grants `Agent`/`Task`.

**Dependencies.** S2 (grant pattern), S4 (the skill it references). Unblocks S6, S7.

**Verification.** T-5.

**Impact if wrong.** A misconfigured corrector fails to load and the gate cannot remediate — loud,
immediate, caught by the structural tier. No silent degradation.

---

### S6 — Route the three document gates' `remediateFn` to the corrector

**What changes.** In `workflows/expert-lifecycle.js`: add `corrector: NS + 'expert-corrector'` to
the `AGENT` map (line 22–32). Change the `remediateFn` at lines 331 (spec), 360 (architecture), and
378 (plan) to dispatch `AGENT.corrector` with a correction-shaped prompt naming the artifact path,
the findings, and the instruction to correct only what the findings require. The implementation
gate's `remediateFn` (line 411) is **unchanged**.

**Source.** B9b; Clear Thought `b9b-correction-discipline` sensitivity note 2.

**Why this approach.**

1. *Decision.* Replace the authoring-agent dispatch with the corrector at the three document gates
   only.
2. *Authoritative standard.* Architecture D6 already specifies the implementation gate's remediation
   path as amend-plan-then-re-implement; that path is the approved design, not the defect.
3. *Why it applies here.* The rewrite defect was measured at the document gates, where remediation
   dispatches an authoring skill. The implementation gate dispatches the **planner** to amend a plan
   — a different shape that the run did not exercise and that D6 governs.
4. *What this is NOT — and why.* **Not applied to the implementation gate**: forcing `Edit`-only
   there would break amend-plan, which legitimately produces plan revisions. **Not a change to
   `runGate`**: the loop's structure is correct; only what it dispatches on `NEEDS_FIXES` is wrong.
   **Not removal of the authoring agents from the gate**: they still author the first version.

**Dependencies.** S4, S5. Unblocks S7.

**Verification.** T-6.

**Impact if wrong.** Cascading but caught early: a bad dispatch means remediation does nothing and
every gate runs to `ROUND_CAP`. Highly visible on the first behavioral run; no data loss.

---

### S6b — Detect failed corrections (fix-site regression and unclosed class) and escalate them

**What changes.** Three coordinated edits in `workflows/expert-lifecycle.js`:

1. **Schema.** Add to `PHASE_SCHEMA.properties` (after `artifact_path`, line 63):

   ```js
   sections_rederived: {
     type: 'array',
     items: {
       type: 'object',
       required: ['location', 'class_sweep'],
       properties: {
         location: S_STR,
         source: S_STR,
         finding_addressed: S_STR,
         class_sweep: {
           type: 'object',
           required: ['searched', 'found'],
           properties: {
             searched: S_STR,                              // what the sweep searched for
             found: { type: 'array', items: S_STR },       // every location the search returned
           },
         },
       },
     },
   },
   ```

   The corrector reports every section it re-derived, in the same `location` shape reviewers use
   (path plus line range, or path plus section identifier), with the source it re-derived from.

2. **`runGate` retains it.** Capture `remediateFn`'s return value (currently discarded — line 240
   is a bare `await`). Store `lastRederived = (out && out.sections_rederived) || []` per round, and
   carry it into the next iteration.

3. **Two detectors, run at the top of each round after the first, once `findings` are back.**

   **(a) Fix-site regression** — a finding lands inside what the last round re-derived. Match:
   **same file** AND (**overlapping line ranges** OR **equal section identifier**) against
   `lastRederived`.

   **(b) Incomplete class sweep** — the corrector declared a sweep, and a later finding lands at a
   location that sweep **found and did not correct**. This requires the corrector to report the
   sweep, so `sections_rederived` items gain two fields (S2b obliges their emission):
   `class_sweep.searched` (what was searched for) and `class_sweep.found` (the locations the search
   returned). The corrected locations are already the `location` values of the
   `sections_rederived` entries themselves.

   Match: the new finding's `location` ∈ (`class_sweep.found` ∖ corrected locations). **Set
   membership, not string similarity.** A location the sweep never found is a *new* class, not an
   unclosed one, and correctly does not fire.

   **Rejected alternative — matching on the `standard` field.** Normalised equality of `standard`
   across rounds is wrong on its own evidence: a standard recurring at a new location is the
   **normal** shape of iterative review, not churn. Round 1 of this plan cited ISO/IEC/IEEE
   29148:2018 §5.2.6 at two locations and the output contract's §11 at four, so that rule escalates
   `CORRECTION_FAILED` on a healthy round and stops a converging gate. It also leaves "normalised"
   undefined — a deferred decision — and substitutes "the prior round's findings" for the semantics
   it states, "findings the corrector reported corrected", a set nothing records. Do not reinstate
   it.

   Either match stops the loop and returns
   `{ verdict: 'CORRECTION_FAILED', kind: 'fix_site_regression' | 'unclosed_class', rounds: round,
   history, detail: {finding, prior} }`. **Wiring the callers to that verdict is S15b, not this
   step** — the escalation calls `diagnose()`, which must be three-parameter first (S12/S13).
   Splitting there is what keeps this step free of a forward dependency.

4. **Create the obligation to emit the field.** `sections_rederived` is optional in
   `PHASE_SCHEMA` (`required` is `['status']` only), so a consumer that reads it without a producer
   obligated to write it has no contract. Three paired edits, all listed in §5:
   - `skills/expert-correct/SKILL.md` (S4) states the structured return contract: every section
     re-derived, each with `location`, `source`, and **`class_sweep` — what the sweep searched for
     and every location it found**. The sweep is step 3 of the skill's own discipline, so reporting
     it is reporting work the skill already requires.
   - `agents/expert-corrector.md` (S5) states the same in its body as the agent's output contract,
     and names all three in its `returns:` frontmatter.
   - S6's dispatch prompt restates it, so the obligation is present at dispatch time.

5. **Make `findings[].location` required and give it a grammar.** Detector (a) parses it, and today
   `VERDICT_SCHEMA.findings.items` has `required: ['classification', 'standard']` — `location` is
   **optional and format-free** (`workflows/expert-lifecycle.js:96–112`). Add `location` to
   `required` and constrain it to `path:start-end` or `path#section`, with matching statements in
   `agents/expert-reviewer.md` and `skills/expert-review/SKILL.md`. Both files are listed in §5
   under this step.

   S2b does **not** subsume this: `returns:` names field *presence*, not *format*, and detector (a)
   needs a parseable range. The plan previously deferred to "the same `location` shape reviewers
   use" — a shape that source shows does not exist.

   Without all three, `lastRederived` is `[]` on every round and **both detectors are inert while
   their test passes green** — the double supplying the very input whose real-world absence is the
   defect.

   **Both detectors run at the three document gates only.** `runGate` is one shared function
   (`:224`, called at `:329`, `:358`, `:376`, `:409`), so the detectors take a flag and are enabled
   for the spec, architecture and plan gates and disabled for the implementation gate. Two reasons,
   both structural: D-2 excludes the implementation gate from the corrector entirely — its
   `remediateFn` dispatches the **planner** for amend-plan per architecture D6 (`:411`), so no
   corrector runs and no `sections_rederived` is produced; and that gate is multi-lens, flattening
   three lenses' findings per round (`:229–232`, `results.flatMap((v) => v.findings || [])`), so
   per-round finding identity is not comparable there.

   **Detector (b) is the one the evidence weights heavier.** The A-3 run produced one instance of
   (a). The APS Fusion plan cycle produced **six** instances of (b) — three of round 5's findings
   manufactured by round 4's fixes, three of round 6's by round 5's — and its own diagnosis names
   the mechanism: "Each fix round corrected the named instances; the next round found the class
   elsewhere" (claim 27, commit `cd2f27b`). A detector matching only on location would miss every
   one of those six, because "elsewhere" is the definition of the failure.

**Source.** `docs/behavioral-tier-findings.md` B9c (a finding the corrector cannot satisfy has no
escape hatch — restated on evidence that exists, unlike its original claim);
`docs/investigate.md` §4b (the A-3 run's one fix-site regression, R4→R5);
`mcp-servers/aps-fusion-mcp-server/HANDOFF.md` (three fix-site regressions across rounds 15, 16,
19, after the discipline was adopted).

**Why this approach.**

1. *Decision.* Have the corrector report the sections it re-derived, and escalate when the next
   round's finding lands inside one of them.
2. *Authoritative standard.* Regression-detection principle (`testing-standards.md`: every fixed
   defect gets a check that would have caught it), applied to the correction loop itself. The
   loop currently counts rounds, not per-finding progress, so a correction that made things worse
   at its own fix site is invisible to it.
3. *Why it applies here.* This is the one failure mode the plan's central mechanism cannot guard
   statically — no tool grant and no structural assertion distinguishes a re-derived section from a
   patch. It is, however, **observable after the fact**, and it is the highest-value signal in the
   loop: a correction that regressed where it edited is the strongest evidence that the corrector
   does not know what would satisfy the finding, which is precisely when continuing to burn rounds
   is wasted. Both source projects produced instances — APS Fusion three times, A-3 once.
4. *What this is NOT — and why.* **Not a round-over-round comparison of finding locations.** That
   is the cheaper design and it **fails on the observed case**: R4's finding located
   `scratch-note.txt` itself, while R5's landed at spec lines 271–273 — different locations, so a
   findings-to-findings match misses it entirely. Comparing findings against *what the corrector
   touched* catches it, because the corrector touched the paragraph R5's finding is in. This is why
   the schema field is necessary rather than convenient. **Not a warning that lets the loop
   continue.** A regression means the next round starts from a worse artifact; spending the
   remaining rounds on it is the exhaustion this gate exists to prevent. **Not a change to
   `ROUND_CAP` or the verdict enum** — both out of bounds by owner ruling; this adds a new exit
   *before* the cap, it does not move the cap.

**Dependencies.** S4 and S5 (the return contract lives in the skill and the agent body), S6 (the
dispatch restates it). **No dependency on S12/S13** — this step's `runGate` changes call nothing;
the escalation that does is S15b, which follows S13. Unblocks S15b.

**Verification.** T-22.

**Impact if wrong.** Bounded in both directions. A false positive stops a gate that might have
converged — recoverable, and the owner sees the regression detail and can resume. A missed
detection returns the loop to its current behaviour, which is the status quo, not a new harm. No
data loss; nothing is discarded.

---

### S7 — Update the exact-count structural assertions

**What changes.** In `tests/structural/check-structure.mjs`: line 39
`skills.length === 9` → `=== 10`; line 54 `agents.length === 9` → `=== 10`; add
`'expert-corrector'` to the `allowlist` set at line 48. Do **not** add it to `readonlyAllow`
(line 49) — that set asserts no `Write` **and no `Edit`**, and the corrector requires `Edit`.
Add an assertion that `expert-corrector`'s `tools` contains `Edit` and does **not** contain `Write`.

**The class guard is not here — S2b carries it.** A guard asserting that "the count of jobs
enumerated in that agent's body is at least the number of distinct dispatch labels targeting it"
is **not buildable**: it has no decidable oracle, because the two agents that enumerate use
different prose formats — a numbered list at `expert-verifier.md:13–22` versus bold-headed
paragraphs at `expert-diagnostician.md:16,28` — and `check-structure.mjs` has only a frontmatter
parser. It would also fail against `expert-planner`, `expert-implementer`, `expert-reviewer` and
`expert-corrector`, turning CP-2 and CP-3 red. S2b asserts against machine-readable `returns:` and
`jobs:` frontmatter instead, which the existing parser already reads.

**Source.** Direct read of `tests/structural/check-structure.mjs:39,48,49,54,66` — these are exact
equality assertions that S4 and S5 break.

**Why this approach.** Trivial: mechanical update of counts that the new files invalidate, plus the
regression guard for S5's load-bearing property (the absent `Write`).

**Dependencies.** S4, S5, S6. Unblocks nothing.

**Verification.** T-7.

**Impact if wrong.** Structural tier fails loudly. No runtime effect.

---

### S8 — Name the governing standards in every review dispatch

**What changes.** In `workflows/expert-lifecycle.js`, replace the trailing "and named standards" in
each `reviewFn` with an explicit ruler. Introduce a module-level constant:

```js
// The standards each artifact type is judged against. The reviewer names a standard per
// finding (expert-review SKILL.md:561); leaving the choice open let three of five spec
// reviewers grade against expert-spec/SKILL.md's process clauses instead — an unbounded
// ruler that varies per round. See docs/investigate.md §5a, §5b.
const RULER = {
  spec: 'ISO/IEC/IEEE 29148:2018 requirement characteristics (Complete, Consistent, ' +
        'Unambiguous, Verifiable, Traceable) and the standards the spec itself names',
  architecture: "the spec's requirements and the standards the architecture itself names",
  plan: "the spec, the architecture, and the plan's own output contract",
  implementation: 'the plan, and the named external standards each changed file is subject to',
}
```

**Then apply it per gate — the four are not the same edit.** Three dispatches carry the trailing
phrase "and named standards" and one does not (claim 9):

- **Lines 330, 359, 377 — replacement.** Substitute `RULER.spec` / `RULER.architecture` /
  `RULER.plan` for the trailing "and named standards".
- **Line 410 — insertion, not replacement.** The implementation dispatch reads
  `` `Review the implementation diff against the plan at ${planPath}${lens ? ` through the ${lens} lens` : ''}. Round ${round}.` ``
  and contains no such phrase. Replace the whole template with
  `` `Review the implementation diff against the plan at ${planPath}, judged against ${RULER.implementation}${lens ? `, through the ${lens} lens` : ''}. Round ${round}.` ``
  — the ruler precedes the lens clause so the lens narrows the reading rather than replacing the
  standard, and the lens clause keeps its existing conditional shape.

Each dispatch additionally states explicitly: *"The authoring skill's process rules are not the
standard — judge the artifact, not the process that produced it."*

**Source.** `docs/investigate.md` §5a (the correlation), §5b (`expert-review/SKILL.md:111` already
states the authoring artifact is not the quality standard), §5c (all four gates).

**Why this approach.**

1. *Decision.* Name the governing standard per artifact type in the dispatch, and explicitly
   exclude the authoring skill as a ruler.
2. *Authoritative standard.* `expert-review/SKILL.md:111`, read 2026-07-31: *"The plan, spec, or
   architecture is the validation reference, **not the quality standard**. Named external standards
   judge whether the work is built right."* The skill already forbids what the reviewers did; the
   dispatch simply never told them what to use instead. ISO/IEC/IEEE 29148:2018 supplies the spec
   gate's missing external ruler.
3. *Why it applies here.* Three of five reviewers read `expert-spec/SKILL.md` and graded against its
   clauses; the two that did not graded against ISO 29148 — a perfect correlation. The reviewer must
   name a standard per finding (`expert-review/SKILL.md:561`), is told nothing about which, and has
   a long normative-sounding document available. Naming the ruler removes the discretion that made
   the bar vary between rounds.
4. *What this is NOT — and why.* **Not a lowering of the bar**: the owner's ruling that the
   strictness is earned stands; this fixes *which* ruler is applied, not how strict it is.
   **Not a fixed finding checklist**: that would cap what a reviewer may find, which genuinely would
   weaken the gate. **Not a change to `expert-review/SKILL.md`**: the skill is already correct; the
   dispatch is what fails to carry it.

**Dependencies.** None. Unblocks S9.

**Verification.** T-8.

**Impact if wrong.** Cascading and expensive if wrong in the permissive direction — a too-narrow
ruler would let defects through the gate. Not destructive; caught by the behavioral re-run.

---

### S9 — Name each artifact's own output contract in its review dispatch (subsumes B10)

**What changes.** Extend each `reviewFn` dispatch to cite the artifact's own output contract **by
literal path**, for the three gates where one exists. Verified against current source 2026-07-31:

| Gate | Contract cited | Verified |
|---|---|---|
| spec | `skills/expert-spec/SKILL.md` § Output | `## Output` at `:345` |
| architecture | `skills/expert-architecture/SKILL.md`, the "Output contract" block | `:66` — an **unheaded** line; that file contains **zero** markdown headings, so it must be cited by line, not by section name |
| plan | `skills/expert-plan/references/output-contract.md` (whole file) | the strongest case — a dedicated contract document |
| implementation | **none — dropped from this step** | `skills/expert-implement/SKILL.md` has 12 headings, none an Output section; its nearest, `## Step 6 — Final report`, governs the implementer's report to the orchestrator, not the diff under review |

**The implementation gate is deliberately out of S9's scope.** A diff has no output contract
distinct from the plan authorising it, and S8 already binds that gate to "the plan, and the named
external standards each changed file is subject to". Citing a nonexistent section there would make
the step unexecutable, which is the defect this correction removes — not reproduce it at a different
address. Register entry Q-21.

The dispatch instructs the reviewer to check the artifact against that contract's required structure
— distinct from S8's quality ruler, which judges content.

**Source.** `docs/behavioral-tier-findings.md` B10; `docs/investigate.md` §5c — B10 is one instance
of a four-gate defect, remediated at all four.

**Why this approach.**

1. *Decision.* Cite the artifact's own output contract in the dispatch at every gate that has one.
2. *Authoritative standard.* Design by Contract (Meyer): a contract that no party checks is not
   enforced. The plan's "no step may defer a decision" rule is stated four times, all four inside
   the planner (B10), making a planner self-audit miss structurally unobservable.
3. *Why it applies here.* The independent gate exists to catch what the self-audit misses. It cannot
   catch a contract violation it is never told to look for.
4. *What this is NOT — and why.* **Not fixing only the plan gate**: `docs/investigate.md` §5c shows
   all four gates share the defect, and partial correction is the pattern that made B1 and B6
   incomplete. **Not moving the contract check into the authoring skill**: it is already there; being
   there is the problem.

**Dependencies.** S8. Unblocks nothing.

**Verification.** T-8 (same assertion set).

**Impact if wrong.** Contained — a mis-cited contract path makes the reviewer report it as
unreadable, visibly.

---

### S10 — The workflow consumes `artifact_path`; delete the three path defaults (subsumes B7)

**What changes.** In `workflows/expert-lifecycle.js`:
- Delete the `|| 'docs/specs/spec.md'`, `|| 'docs/arch/architecture.md'`, and
  `|| 'docs/plans/plan.md'` fallbacks at lines 281–283. The values become
  `input.spec_path || (input.artifacts && input.artifacts.spec) || null`.
- Convert `specPath`/`archPath`/`planPath` from `const` to `let`.
- **After each authoring dispatch (lines 320, 354, 372), the returned
  `PHASE_SCHEMA.artifact_path` overwrites the path unconditionally when present — it does not
  merely fill a gap.** Precedence is: the agent's returned path, then the ledger's
  `artifact_index`, then escalate. `input.spec_path` is **not** a source of truth; it is a resume
  hint.
- If, after the authoring dispatch, the path is still `null`, escalate `spec_traceable` with
  "the phase produced no artifact path" rather than proceeding against a guess.
- **Sixth source, in `commands/expert.md:61–64`** — "artifact paths from the ledger's
  `artifact_index`, **or the project defaults under `docs/`**". Delete the defaults clause. This one
  **outranks** the workflow: on a fresh run `artifact_index` is empty, the command supplies its own
  `docs/` default into `input.spec_path`, and with the original precedence order the returned
  `artifact_path` would never be consulted — so B7 would survive S10 untouched. The file is listed
  in §5 under this step.

**Why precedence, not fallback.** Reading the returned path only "if present" — leaving
`input.spec_path` ahead of it — is a no-op combined with the command's default: the guess always
wins because it is always supplied. Precedence is what makes `artifact_path` authoritative in fact
rather than in prose, and S2b is what obliges the agents to emit it at all.

**Source.** Owner ruling, `docs/investigate.md` §6: the skill's convention is the standard and the
workflow consumes `artifact_path`. B7.

**Why this approach.**

1. *Decision.* Make the agent's returned `artifact_path` the single source of truth for each
   artifact's location, and remove the workflow's competing defaults.
2. *Authoritative standard.* Single Source of Truth (Beck, *Once and Only Once*); ISO/IEC/IEEE
   29148:2018 §5.2.6 (Consistent) — a system with five sources of truth for one filename is
   internally inconsistent.
3. *Why it applies here.* `PHASE_SCHEMA.artifact_path` already exists (line 63) and is never read.
   The skills name files `spec-[kebab-case-name].md`; the workflow's fallback was `spec.md`. Those
   two conventions can never agree, and in the A-3 run every review dispatch cited a path that did
   not exist for the whole run.
4. *What this is NOT — and why.* **Not making the workflow dictate the path**: that is the current
   behaviour and it produced the mismatch; the skill owns the convention by owner ruling.
   **Not silently defaulting when the agent returns nothing**: a guessed path is what caused B7, so
   the absence escalates instead. **Not deriving the path from the task string**: that is exactly how
   `spec-farewell.md` was produced against the writer's `spec-greeter-farewell.md`.

**Dependencies.** None. Unblocks S11, S17.

**Verification.** T-9.

**Impact if wrong.** Cascading — every downstream dispatch and the artifact registration read these
paths. Not destructive: a wrong path produces a loud "file does not exist" from the reviewer, which
is how round 4 caught it. Recoverable.

---

### S11 — One artifact-location convention across the four skills

**What changes.** In `skills/expert-spec/SKILL.md:349`, `skills/expert-architecture/SKILL.md:456–458`,
`skills/expert-architecture-portable/SKILL.md:302`, and `skills/expert-plan/SKILL.md:390`: remove the
"where the project already keeps X if there's an established location" escape and the
"propose a location and get confirmation" / "propose a location to the user and stop" clauses. Each
becomes a single fixed statement: the artifact is written to `docs/specs/` /
`docs/architectures/` / `docs/plans/` respectively, named `spec-` / `architecture-` /
`plan-[kebab-case-name].md`, creating the directory if absent.

**Source.** Owner ruling (HANDOFF): "Artifact locations are standardized, not proposed. One fixed
convention, applied without asking." `docs/investigate.md` §6.

**Why this approach.**

1. *Decision.* Replace the conditional location logic in all four skills with one fixed convention.
2. *Authoritative standard.* The owner ruling is the governing authority here, reinforced by Single
   Source of Truth.
3. *Why it applies here.* Five sources of truth existed for one filename. Removing four leaves one.
   The "propose and get confirmation" clauses additionally create an owner interrupt for a decision
   the owner has already made once, globally.
4. *What this is NOT — and why.* **Not keeping the "established location" escape for
   already-conventional projects**: that escape is what makes the location unpredictable to the
   workflow, and the workflow now consumes the returned path anyway (S10), so the skill's job is to
   be deterministic. **Not a workflow-side normalisation**: normalising a path the skill chose
   freely re-creates two sources of truth.

**Dependencies.** S10. Unblocks nothing.

**Verification.** T-10.

**Impact if wrong.** Contained — a wrong directory name puts artifacts somewhere unexpected but
`artifact_path` still carries the truth to the workflow.

---

### S12 — Add the failure-record channel to `diagnose()`

**What changes.** In `workflows/expert-lifecycle.js`, change `diagnose(failureDescription, ledger)`
(lines 247–254) to `diagnose(failureDescription, ledger, failureRecord)`, and rebuild the prompt to
carry three labelled channels, with the ledger honestly labelled as stale:

```js
async function diagnose(failureDescription, ledger, failureRecord) {
  const out = await agent(
    `Failure mode. Diagnose this non-routine failure and draft a correction.\n` +
      `Failure: ${failureDescription}\n` +
      `Failure record (evidence from THIS segment; not yet in the ledger): ` +
      `${JSON.stringify(failureRecord || {})}\n` +
      `Segment-start ledger snapshot (predates this segment; does NOT contain these rounds): ` +
      `${JSON.stringify(ledger)}`,
    { agentType: AGENT.diagnostician, schema: DIAGNOSIS_SCHEMA, phase: 'Review', label: 'diagnose' }
  )
  return out && out.diagnosis ? out.diagnosis : null
}
```

**Source.** `docs/investigate.md` §7, draft 2 — the recovered machine-applicable correction draft
produced by the plugin's own diagnostician, classified `machine_applicable`, specified line by line.
Spec F-13 and architecture C3 mandate the input set.

**Why this approach.**

1. *Decision.* Create a third parameter carrying the failure record, and relabel the ledger to state
   its staleness.
2. *Authoritative standard.* Spec F-13 requires the diagnostic pass gather "the evidence (ledger, run
   journal, artifacts, the failing output)"; architecture C3 specifies dispatch "with the failure
   record + ledger snapshot + journal excerpt". This is compliance with an already-owner-approved
   contract.
3. *Why it applies here.* The workflow delivers two of four mandated channels, and the structured
   evidence at only three of eight sites. Because no parameter
   exists, evidence passing is ad-hoc string interpolation, omitted wherever the evidence is a
   structured collection.
4. *What this is NOT — and why.* **Not a ledger-schema change**: the failure record is a dispatch-time
   payload, never persisted, so `ledger.schema.json` is untouched. **Not threading a current ledger
   instead**: `ledger.schema.json:68-87` gives `gate_history` entries `findings_count` only — a
   current ledger still could not carry what the reviewer objected to. **Not widening
   `DIAGNOSIS_SCHEMA`**: the diagnostician's *output* contract is correct; its *input* is starved.

**Dependencies.** None. Unblocks S13, S14, S15.

**Verification.** T-11.

**Impact if wrong.** Contained. A malformed prompt degrades diagnosis quality; it cannot corrupt
state, because `diagnose()` writes nothing.

---

### S13 — Populate the failure record at all eight call sites

**What changes.** Pass a third argument at every `diagnose()` call, moving the three existing ad-hoc
interpolations into the same parameter so one mechanism carries evidence everywhere:

| Line | Site | `failureRecord` |
|---|---|---|
| 310 | systemic defect | `{ disposition: sysDefect }` |
| 336 | spec non-convergence | `{ gate: 'spec', artifact: specPath, rounds: gate.history }` |
| 396 | implementer STOP | `{ stop_report: impl.stop_report, plan: planPath }` |
| 426 | fabrication catch | `{ checks: vr.checks, sampled_indices: idx, cited: sample, seed }` |
| 435 | diff-vs-plan | `{ checks: dvp.checks, plan: planPath }` |
| 448 | ground-truth failure | `{ failed_criteria: failed }` |
| 456 | reconciliation | `{ checks: recon.checks, spec: specPath, plan: planPath }` |
| 490 | `maybeNonConvergence` | `{ gate: resumePhase, artifact: artifactPath, rounds: gate.history }` |

`maybeNonConvergence` gains an `artifactPath` parameter (call sites at 364, 382, 415 pass
`archPath`, `planPath`, `planPath`). `rounds` carries each round's `verdict` **and** `findings[]`.

**Source.** `docs/investigate.md` §7, draft 2 — this is the draft's own enumeration, verified
against the current file.

**Why this approach.** Non-trivial by consequence, and the four parts are inherited from S12: the
decision is to populate every site from data already in lexical scope; the standard is spec F-13
/ architecture C3; it applies because at line 336 `lastFindings` is computed from `gate.history` one
line *after* `diagnose()` returns — for the owner gate, never for the diagnostician; and it is
**not** a new collection pass (no new I/O — every value is already computed) and **not** a
partial fix at the non-convergence sites only, because the fabrication, diff-vs-plan, and
reconciliation sites are three of the four A-4 acceptance paths.

**Dependencies.** S12. Unblocks S15.

**Verification.** T-11, T-12.

**Impact if wrong.** Contained per site; a missed site silently returns to the starved behaviour,
which is why S15 asserts arity mechanically.

---

### S14 — Reconcile the diagnostician's agent contract with what the caller sends

**What changes.** In `agents/expert-diagnostician.md`, replace the promise of a "run-journal excerpt"
with "failure record", matching what S12/S13 actually supply.

**Source.** `docs/investigate.md` §7 — the agent contract promises an input the caller never sends.

**Why this approach.** Trivial: Design by Contract (Meyer) — the stated precondition must match the
caller's behaviour. The alternative (wiring the real transcript directory through) is a larger
change whose value the failure record already delivers; recorded as D-4 in §10.

**Dependencies.** S12, S13.

**Verification.** T-13.

**Impact if wrong.** Documentation-only; no runtime effect.

---

### S15 — Assert `diagnose()` arity structurally

**What changes.** In `tests/structural/check-structure.mjs`, add a check that parses
`workflows/expert-lifecycle.js` and asserts every `diagnose(` **call** site (excluding the
declaration) passes three arguments. Implement by matching `diagnose(` occurrences and counting
top-level commas in the argument list, skipping the `async function diagnose` declaration.

**Source.** `docs/investigate.md` §7, draft 2, item 4 — "add a structural assertion that every
`diagnose(` call site passes three arguments, so the omission cannot silently return."

**Why this approach.**

1. *Decision.* Guard the evidence channel with a mechanical arity assertion.
2. *Authoritative standard.* Regression-test principle (`testing-standards.md`): every fixed defect
   gets a test that would have caught it. `check-structure.mjs:76-91` asserts only that the workflow
   parses and passes the linter — which is exactly why the starved dispatch survived the automated
   tiers and round-1 review.
3. *Why it applies here.* The defect's signature is a *missing argument*, which is syntactically
   valid JavaScript and therefore invisible to both the parser and the linter.
4. *What this is NOT — and why.* **Not a runtime assertion inside `diagnose()`**: a throw at
   escalation time converts a degraded diagnosis into a lost segment, on the path that only fires
   when something has already gone wrong. **Not a type system**: the plugin is plain JS by design
   (workflow scripts are not TypeScript).

**Dependencies.** S12, S13.

**Verification.** T-12.

**Impact if wrong.** A false-positive assertion blocks the structural tier — loud, no runtime
effect.

---

### S15b — Wire every caller to the two new `runGate` states

**What changes.** `runGate` can now return two states its callers do not test for. Both are wired
here, in `workflows/expert-lifecycle.js`:

1. **`CORRECTION_FAILED`** (from S6b). Line 335 currently reads
   `if (gate.verdict === 'NON_CONVERGENCE') {`; line 488 reads
   `if (gate.verdict !== 'NON_CONVERGENCE') return null`. Both test the exact string. Change each to
   admit the new state, and give the escalation its own `what_happened` text naming the `kind`
   (`fix_site_regression` — "a correction broke the section it edited"; `unclosed_class` — "a
   correction closed the named instance and the same standard was violated elsewhere"), carrying
   `gate.detail` and a `diagnose()` call with failure record
   `{ kind, finding, prior, rounds: gate.history }`.

2. **`CORRECTOR_HALTED`** (B9c's escape hatch). S6b's `runGate` change reads only
   `out.sections_rederived` from the corrector's return, so a corrector reporting
   `status: 'halted'` — the case S4 specifies for a finding whose named standard it cannot verify —
   is discarded and the loop runs to `ROUND_CAP` in silence. Add: if the corrector returns
   `status: 'halted'`, stop and return
   `{ verdict: 'CORRECTOR_HALTED', rounds: round, history, halt: out.halt }`, and wire both callers
   to escalate it as `GATE.non_convergence` carrying the corrector's stated reason.

**Source.** Review round 1, findings S-2 and S-5; `docs/behavioral-tier-findings.md` B9c (a finding
the corrector cannot act on has no escape hatch — this is that hatch, and S6b is not).

**Why this approach.**

1. *Decision.* Wire both new states at both caller sites in one step, rather than alongside the step
   that introduced each state.
2. *Authoritative standard.* Fail-safe defaults (OWASP secure design; the architecture already names
   this standard for D6 STOP routing at `docs/arch/architecture-expert-dev-tools.md:750`): a new
   state must fail closed. An unhandled state that falls through to the success path is the
   canonical fail-open defect.
3. *Why it applies here.* The fall-through is not merely a gap. At the spec gate, an unhandled
   `CORRECTION_FAILED` misses line 335 and control reaches lines 343–345, which return
   `GATE.intent` — **the owner is told the specification passed independent review.** At the other
   three gates `maybeNonConvergence` returns `null` at line 488 and the phase advances. The control
   built to stop a degrading loop would certify it instead.
4. *What this is NOT — and why.* **Not folded into S6b**: its escalation calls `diagnose()`, which
   must be three-parameter first, and S6b precedes S12/S13; splitting at the caller boundary is what
   removes that forward dependency rather than papering over it. **Not a new gate type**: the six in
   spec 3.4 are fixed, and `non_convergence` is the correct existing one — a correction that failed
   is a loop that will not converge. **Not silent continuation with a logged warning**: the next
   round starts from a worse artifact, which is the exhaustion this exit exists to prevent.
   **Not a change to `ROUND_CAP` or `VERDICT_SCHEMA.verdict`** — both out of bounds by owner ruling;
   these are `runGate` return values, which already carry a non-enum third state
   (`'NON_CONVERGENCE'`).

**Dependencies.** S6b (defines `CORRECTION_FAILED` and the halted path), S12 and S13 (the
`diagnose()` calls here are written three-argument from the start, so no ninth site is retrofitted
and S15's arity assertion — which counts every call site rather than a fixed number — covers them).
Unblocks nothing.

**Verification.** T-22, extended to assert the caller path at all four gates, not merely that the
verdict exists.

**Impact if wrong.** This is the step whose failure is worst in the whole plan: wired wrongly in the
permissive direction, a failed correction reads as a PASS at the intent gate and the owner approves
a spec that a review loop was actively degrading. Wired wrongly in the strict direction, gates
escalate spuriously — loud, recoverable, and visible on the first run.

---

### S16 — Delete the six "flag once, then comply" clauses

**What changes.** Delete the clause at each site, with **no replacement**:

| File | Line | Clause |
|---|---|---|
| `skills/expert-spec/SKILL.md` | 163 | "Flag it once, then write the spec they asked for…" |
| `skills/expert-standard/SKILL.md` | 40 | "Flag the concern once… Then do what they asked." |
| `skills/expert-review/SKILL.md` | 147 | "The discipline is: flag once, then comply…" |
| `skills/expert-architecture/SKILL.md` | 90 | "The discipline is: flag once, then comply…" |
| `skills/expert-architecture-portable/SKILL.md` | 150 | same construction |
| `skills/expert-mcp-overhaul/SKILL.md` | 32 | "flag once before complying… not to refuse it" |

Where the surrounding paragraph exists only to host the clause, the paragraph goes with it.

**Source.** Owner ruling (HANDOFF): *"'Flag it once, then do what they asked' is 100% invalid. Not
following the instructions is never an available option, and no skill may suggest it is."*
Owner ruling 2026-07-31 (`docs/investigate.md` §6): deletion, **not** replacement — there is no gap
to fill, because the answer to "what does an agent do when pushed to skip a step" is that it does
the work.

**Why this approach.**

1. *Decision.* Remove all six occurrences and write nothing in their place.
2. *Authoritative standard.* Owner ruling, which is the governing authority for this package's
   doctrine.
3. *Why it applies here.* `expert-review:147` is the most consequential — it lets the independent
   gate waive premise verification on request, which is the gate ceasing to be a gate.
   `expert-mcp-overhaul:32` states the rejected doctrine most explicitly ("your job is to make the
   trade visible, not to refuse it").
4. *What this is NOT — and why.* **Not a replacement clause describing correct behaviour under
   pressure**: the owner ruled explicitly that no such clause is needed, and `investigate.md` §3's
   earlier note to the contrary is withdrawn in §6. **Not confined to `expert-spec`**: an agent
   denied permission in one skill would find it in another — the reason the owner called it a
   cross-skill sweep.

**Dependencies.** None.

**Verification.** T-14.

**Impact if wrong.** Contained. An over-broad deletion removing adjacent guidance is caught by
T-14's re-read; skills are prose, so no runtime break.

---

### S17 — Register the spec artifact before the non-convergence return (B6)

**What changes.** In `workflows/expert-lifecycle.js`, move
`delta.artifacts.push({ role: 'spec', path: specPath })` from line 344 to immediately after the
spec authoring dispatch succeeds and `specPath` is resolved from `artifact_path` (S10) — i.e.
before `runGate` at line 329, matching what the architecture (line 357) and plan (line 375) phases
already do.

**Source.** `docs/behavioral-tier-findings.md` B6.

**Why this approach.**

1. *Decision.* Register the spec artifact at the same point in the phase as architecture and plan.
2. *Authoritative standard.* Internal consistency (ISO/IEC/IEEE 29148 §5.2.6) applied to the
   implementation: three phases performing the same operation should perform it at the same point.
3. *Why it applies here.* **Refinement to B6 as written.** B6 states artifacts are not registered
   when a phase escalates. Read at source, that is true only of the **spec** phase: architecture
   (357) and plan (375) push *before* their gates and so do register on non-convergence. The spec
   phase pushes at 344, after the escalation return at 335–340. So the defect is a spec-phase
   inconsistency, not a general one — and D9 hash anchoring misses the artifact precisely when the
   owner most needs it.
4. *What this is NOT — and why.* **Not adding a second push on the escalation path**: that would
   double-register on the PASS path. **Not moving architecture/plan to match spec**: spec is the
   outlier, and the other two are already correct.

**Dependencies.** S10 (`specPath` must be resolved from `artifact_path` before the push).

**Verification.** T-15.

**Impact if wrong.** Contained — a double push produces a duplicate `artifact_index` upsert, which
the command's upsert-by-path (expert.md:74–80) collapses.

---

### S18 — Give `stale_deployment` a path to the owner (B1)

**What changes.** Three coordinated edits:
- `workflows/expert-lifecycle.js` lines 304–312: add a `staleDeploy` branch after `sysDefect`,
  building `feedbackEsc = { kind: 'stale_deployment', disposition: staleDeploy,
  responsible_component: staleDeploy.responsible_component, remediation: 'none' }`.
- `commands/expert.md` step 4 STATUS predicate (lines 106–119): add the third branch — a
  `corrected` record whose most recent occurrence's `plugin_version` is **below**
  `correction.fixed_in_version` is a `stale_deployment` and is surfaced as an open item reading
  "your plugin is behind; update it".
- `commands/expert.md` step 5: present the plain `feedback` dispositions array, not only
  `feedback_escalation`.

**Source.** `docs/behavioral-tier-findings.md` B1; spec F-14; architecture D15.

**Why this approach.**

1. *Decision.* Route `stale_deployment` through the same escalation channel as the other two
   actionable verdicts, and widen the STATUS predicate to match.
2. *Authoritative standard.* Spec F-14 defines four verdicts; architecture D15 defines the
   corrected-versus-stale split by version comparison. A verdict the system computes and then
   discards is a partially-implemented requirement.
3. *Why it applies here.* A-9(c) computes the verdict correctly and it goes nowhere: the workflow
   builds no escalation for it, and the STATUS predicate matches neither branch because a stale
   record's occurrences sit *below* `fixed_in_version`. "Update the plugin" is the entire action the
   verdict exists to produce.
4. *What this is NOT — and why.* **Not auto-updating the plugin**: the machine does not modify its
   own deployment. **Not a new gate type**: the six gate types are fixed by spec 3.4, and
   `feedback_escalation` already rides alongside them rather than being one. **Not a schema change**:
   `ledger.schema.json` already carries `plugin_version` on occurrences and `fixed_in_version` on
   `correction`.

**Dependencies.** None.

**Verification.** T-16 (the workflow half) **and T-17** (the command half — the STATUS predicate and
the dispositions presentation, which T-16 explicitly excludes from its own scope).

**Impact if wrong.** Contained — a wrong predicate either over-surfaces (noise) or under-surfaces
(the current state). Not destructive.

---

### S19 — Give occurrence recording a dedupe key (B2)

**What changes.** In `commands/expert.md` step 4, change the occurrence-append instruction to
**upsert on `(project, session_file)`**: append only when no existing occurrence on that signature
record shares both values; otherwise update the existing entry's `date` and `plugin_version` in
place. State that a `feedback_marker` reset must not double-count already-recorded history.

**Source.** `docs/behavioral-tier-findings.md` B2 — one diagnostician reported `occurrences: 4`
while another correctly deduped to 2 for identical input.

**Why this approach.** Trivial-plus: `ledger.schema.json:157-171` already requires `project`,
`session_file`, and `date` on every occurrence, so the key exists in the stored data and no schema
change is needed. The standard is idempotence of a recorded observation — re-reading the same
transcript is not a new occurrence.

**Dependencies.** None.

**Verification.** T-17.

**Impact if wrong.** Contained — an over-aggressive key under-counts recurrences, which weakens the
`failed_correction` signal. Recoverable by re-sweeping.

---

### S20 — Mechanical scope control for the document phases (B8)

**What changes.** Two paired edits (§7 maintenance rule 5 — the caller and the agent move together):

1. **`workflows/expert-lifecycle.js`** — after each document phase's gate reaches PASS (spec,
   architecture, plan), dispatch the verifier with a scope check: compare git-changed files against
   the single artifact the phase was authorized to write, and report any other changed file. On a
   violation, escalate `spec_traceable` with the offending path, reusing the existing diff-vs-plan
   escalation shape at lines 434–438.
2. **`agents/expert-verifier.md`** — its body currently reads "The orchestrator dispatches you for
   **one of three mechanical jobs**, named in your prompt:" followed by an enumerated 1/2/3. Change
   the count to four and enumerate the document-phase scope check as job 4, stating its authorized
   set is a single artifact path rather than a plan's Files-affected list. Without this the workflow
   dispatches a job the agent's contract does not define — the same violation S14 fixes in the
   opposite direction.

**Source.** `docs/behavioral-tier-findings.md` B8 — the spec phase created a stray
`scratch-note.txt` in the project tree.

**Why this approach.**

1. *Decision.* Extend mechanical scope control from the implementation phase to the three document
   phases.
2. *Authoritative standard.* Least privilege applied to write scope (NIST SP 800-53 AC-6); the
   plugin's own architecture already treats diff-vs-plan as the mechanical scope control for
   implementation.
3. *Why it applies here.* A reviewer *did* catch the stray file (round 4, Moderate), so the review
   loop is not blind — but the mechanical control runs only after implementation, leaving document
   phases dependent on a reviewer noticing. Mechanical checks belong at every phase that writes.
4. *What this is NOT — and why.* **Not reusing the full diff-vs-plan agent**: there is no plan yet
   at the spec phase; the authorized set is one path. **Not a hard failure that discards the
   artifact**: a stray file is an escalation, not a reason to lose the phase's work.
   **Not a filesystem sandbox**: the plugin cannot constrain an agent's tool calls at runtime.

**Dependencies.** S10 (the authorized path comes from `artifact_path`).

**Verification.** T-18.

**Impact if wrong.** Contained — a false positive escalates unnecessarily; visible and recoverable.

---

### S21 — Correct the A-4c fixture's self-description (B5)

**What changes.** In `tests/fixture/spec/spec-contradictory.md`, correct the framing from a two-way
contradiction (R-1 uppercase vs R-2 lowercase) to the **three-way** one the planner found: the same
spec's "mirrors `greet`" clause and `TASK.md` both imply mixed case, so R-1 and R-2 each contradict
those as well.

**Source.** `docs/behavioral-tier-findings.md` B5.

**Why this approach.** Trivial: the fixture still triggers the control it exists to trigger; its
self-description is simply inaccurate, and an inaccurate fixture misleads whoever reads it next.
Standard: `testing-standards.md` — test data must describe the state it actually represents.

**Dependencies.** None.

**Verification.** T-19.

**Impact if wrong.** Contained to a test fixture.

---

### S22 — Resolve B3 and B4 in the strengthening direction

**What changes.** Two edits, both of which *strengthen* verification.

1. **B3 — `tests/ACCEPTANCE.md` A-8.** Correct its expectation: the single "ok run the tests now"
   turn is **discarded**, not classified `course_correction`. Spec F-14 scopes the sweep to
   statements where the owner flagged a problem, and that turn flags none.
2. **B4 — `workflows/expert-lifecycle.js`'s `EVIDENCE` schema and the spot-check gate.** Split each
   evidence item's free-form `result` into `observed` (verbatim tool output) and `asserted` (the
   claimed outcome), and add a cross-entry consistency check to the spot re-run: before
   re-executing anything, compare entries describing the same subject and fail on a
   self-contradiction. **The sampling rate is unchanged** at `max(2, ceil(0.1n))`.

**Source.** `docs/behavioral-tier-findings.md` B3, B4.

**Why this approach.**

1. *Decision.* Resolve both rather than surfacing them, because neither is actually owner-owned.
2. *Authoritative standard.* The plugin's correction doctrine states the machine may never
   **weaken** its own ruler. Every change here strengthens it: A-8 stops asserting something the
   spec never required; the schema split makes a fabrication lie in a named field rather than in
   prose; the consistency check adds a detection path at zero re-execution cost. Prohibited would
   be lowering the sampling rate or removing a check — neither is done.
3. *Why it applies here.* For B3, the spec is the contract and the acceptance criterion is derived
   from it; a derived document contradicting its source is a defect in the derived document. Two
   independent diagnosticians read both and followed the spec, explicitly refusing A-8's
   expectation. For B4, the A-4b fabrication was **self-refuting** — one entry's claimed value
   contradicted another entry's accurate description of the same function — and that contradiction
   was free to detect and nothing looked.
4. *What this is NOT — and why.* **Not amending F-14 to sweep non-complaints**: that widens the
   sweep to turns carrying no complaint, diluting the repeat-complaint signal the requirement
   exists to produce. **Not raising the sampling rate**: it spends tokens on every implementation
   phase to reduce what escapes a sample, while the consistency check catches the observed shape
   for free and independently of sample size. **Not deleting or relaxing any check** — that is the
   one thing the doctrine actually forbids.

**Scope note.** "May not weaken its own ruler" is not "may not touch its own ruler." The doctrine
bars removing checks, relaxing gates, and lowering sampling; it does not bar corrections that make
fabrication harder to hide or align a test with the requirement it tests. Q-12 records the
disposition and its supersession.

**Dependencies.** None. Owner may override either decision; both are recorded here with their
reasoning so an override has something to act against.

**Verification.** T-20, re-specified: assert the sampling constant is unchanged and that no check is
removed — the properties the doctrine actually protects — rather than asserting the files are
untouched.

**Impact if wrong.** B3 wrong means one acceptance criterion tests the wrong expectation, caught by
the next behavioural run. B4 wrong in the strict direction produces false fabrication escalations —
loud and recoverable; in the permissive direction it leaves detection where it is today.

---

### S23 — Documentation sync

**What changes.** `codegraph_find_related_docs` was run **at plan time** (2026-07-31, over the five
JS files in the blast radius) rather than deferred to execution, so this step's scope is a closed
enumeration and T-21 has a decidable membership test. It returned **23 of the plugin's 44 docs**,
falling into three groups — only the first is edited here:

**Group 1 — updated by this step (3):**
| Doc | Change |
|---|---|
| `README.md` | created by S1; records the `.mcp.json` invocation form and why it is not the bare `npx` shape |
| `docs/investigate.md` | mark the items this plan remediates |
| `docs/behavioral-tier-findings.md` | mark the items this plan remediates |

**Group 2 — already edited by an earlier step; not touched again here (9):**
`commands/expert.md` (S10, S18, S19), `tests/ACCEPTANCE.md` (S22),
`tests/fixture/spec/spec-contradictory.md` (S21), and the six agent files (S2, S2b, S14, S20).

**Group 3 — historical records and governing artifacts; must NOT be modified (11):**
`docs/plans/plan-expert-dev-tools.md`, `…-remediation-r1.md`, `…-r2.md`, `…-r3.md`,
`docs/review-round-1.md`, `docs/specs/spec-expert-dev-tools.md`,
`docs/arch/architecture-expert-dev-tools.md`, `tests/fixture/project/TASK.md`,
`tests/fixture/agents/forced-fabricating-implementer.md`, and the two remaining fixture docs.

The prior plans and the round-1 review are **records of what was true when written**; updating them
to match current source falsifies the audit trail, the same defect as rewriting a commit message.
The spec and architecture are governing artifacts — amending either has its own approval path and is
out of scope. The fixtures are inputs; changing them changes what the acceptance tier measures.

**Source.** expert-plan Step 8 documentation-sync requirement — if the code changes and the docs do
not, the docs are now wrong.

**Dependencies.** All prior steps.

**Verification.** `codegraph_verify_doc` on each updated document; T-21.

**Impact if wrong.** Stale docs mislead the next session — the failure this plan's own investigation
spent hours undoing.

---

## 8. Divergences from existing patterns

**D-A — S1's `cmd /c` wrapper diverges from the plugin's own direct-`npx` form.** Justified by the
observed dedupe behaviour: the plugin's existing form collides with an installed plugin's identical
string. The divergence is toward the form `agentboard/.mcp.json` already uses. Guarded by S3's
assertion so it is not "corrected" back.

**D-B — S5's corrector agent holds `Edit` without `Write`, unlike every other allowlisted agent.**
Justified by NIST SP 800-53 AC-6 and by the measured failure. The existing pattern (authoring agents
hold `Write`) is correct *for authoring* and wrong for correction.

**D-C — S8 names a per-artifact ruler in the dispatch, where the existing pattern delegates.** The
existing pattern is the defect (`docs/investigate.md` §5b).

---

## 9. Checkpoints

**CP-1 — after S3** (foundation corrections F-1 and F-2 complete, before any new machinery). Verify:
structural tier green; the plugin's context7 namespace resolves after reload. This is the boundary
between "the agents can reach documentation" and everything built on that.

**CP-2 — after S7** (the corrector exists and is wired; exact-count assertions updated). Verify:
structural tier green with 10 skills and 10 agents; corrector holds `Edit` and not `Write`. This is
an integration point — a new agent, a new skill, and three dispatch sites connecting.

**CP-3 — after S15** (the workflow's three structural changes — ruler, path, diagnose — are all in).
Verify: `node --check` passes, the workflow-creator linter passes, all structural assertions pass.
This is the boundary between structural changes to the workflow and the behavioural corrections
that follow.

**CP-4 — after S21** (all code and fixture changes complete, before documentation sync). Verify:
full structural + unit tiers green; `git diff --stat` matches §5's file list exactly, in both
directions.

---

## 10. Decisions made during planning

**D-1 — Correction is re-derivation; the tool grant blocks re-authoring and the skill forbids
patching.** **Do not score this decision on "removes rewrite behaviour."** That criterion treats
the rewrite/patch axis as the relevant one and thereby selects patching as the goal, and the
evidence against it is in this repository. `mcp-servers/aps-fusion-mcp-server/HANDOFF.md` records that
**rounds 1–11 failed on patch-style corrections**, and that what ended the failure was
"re-derive the affected section from its sources, sweep the finding's class, re-read what the edit
touched" — after which every closure was verified by the following round. Three fix-site
regressions still occurred (rounds 15, 16, 19), each from verifying only the half of the record
that supported the edit. Patching is the most-evidenced failure mode available.

The correct axis is **derived-from-sources versus not**, across **four** observed behaviours. The
third row is the one most easily mistaken for success — it has a failure mode, and it is the
dominant one:

| Behaviour | Failure | Observed |
|---|---|---|
| Re-author from the task | discards untouched sections; fresh defect surface each round | A-3 run: 11 `Write`, 0 `Edit` (claim 26) |
| Patch the fix site | sources unconsulted, class unswept | APS Fusion architecture cycle rounds 1–11 (claim 27) |
| **Re-derive the section, sweep the class incompletely** | the named instances close; the **class resurfaces elsewhere** next round | APS Fusion plan cycle: three of round 5's findings manufactured by round 4's fixes, three of round 6's by round 5's; tripwire fired (claim 27) |
| Re-derive **and** close the class at its source | — | the residual target; not yet observed converging |

**The load-bearing half of the discipline is the class sweep, not the re-derivation.** Re-derivation
without a complete sweep is not a milder failure than patching — over six rounds it produced a
*rising* finding count (9 → 10 → 9 → 8 → 8 → 11) while severity fell to zero Critical and zero
Serious. The count rose because one defect *shape* kept reappearing in new locations: a
hand-maintained cross-reference or enumeration with no generator, drifting on the next edit, found
in ten distinct locations across six rounds.

**And the sweep cannot be completed by discipline alone on an artifact that carries such surfaces.**
That is the decisive inference: correcting ten instances of a drifting enumeration one round at a
time is unbounded work, because each correction edits the surface and re-arms it. The APS Fusion
project's resolution was to **convert the maintained surfaces to derived ones**, which is a change
to the artifact's construction, not to the corrector's method. S4 therefore requires the corrector
to escalate — not silently absorb — a finding whose class lives in a hand-maintained surface,
because closing that class is an authoring decision the corrector is not authorised to make.

Re-scored on "produces re-derivation **and** closes the class": corrector agent + correction skill
that escalates unclosable classes **0.9**; corrector agent + correction skill without the escalation
0.7 (converges only on artifacts with no maintained surfaces — a condition nothing checks);
correction skill alone 0.6 (nothing prevents whole-file replacement); revision mode per authoring
skill 0.5; enriched dispatch string 0.3. Enforcement splits across three mechanisms because no one
of them reaches: **the grant blocks re-authoring** (no `Write`), **the skill forbids patching and
requires the class sweep** (method), **S6b detects when the class was not closed** (outcome).

Sensitivity: if a correction ever legitimately required replacing an entire artifact, the grant
would block it. At a review gate the artifact exists and its untouched sections carry the prior
round's review, so replacing all of it is never correct.

**What this decision does not claim.** No observed cycle has converged on the fourth row. The APS
Fusion architecture cycle (rounds 13–19) closed every finding the following round verified, but it
was ended by owner direction rather than by a PASS, and its successor plan cycle then failed on the
class-sweep mode. This plan's correction design is therefore the **best-evidenced** available, not a
demonstrated one, and S6b exists precisely because it has not been demonstrated.

**D-2 — The implementation gate is excluded from S6.** Its `remediateFn` routes findings through a
plan amendment, which architecture D6 specifies as the correct path. The rewrite defect was measured
at the document gates only. Applying `Edit`-only there would break amend-plan. This is a judgment
about scope, and it is the one place where a reader might reasonably expect uniformity.

**D-3 — B10 is remediated as a four-gate defect, not as its own item.** `docs/investigate.md` §5c
establishes that every `reviewFn` delegates the ruler without naming one; B10 is the plan gate's
instance. Fixing only the plan gate would repeat the partial-correction pattern that left B1 and B6
incomplete after the round-1 remediation.

**D-4 — S14 reconciles the diagnostician contract by narrowing the promise, not by wiring the
journal.** The alternative — threading the run's transcript directory into the dispatch — delivers
information the failure record now carries, at the cost of a new input channel and a path
dependency. Chosen: narrow the promise. Recorded because the reverse choice is defensible if the
journal later proves necessary for a class the failure record cannot cover.

**D-5 — B6 is narrower than recorded.** Read at source, architecture (line 357) and plan (line 375)
push their artifacts *before* their gates and therefore do register on escalation; only the spec
phase (line 344) pushes after. S17 corrects the spec phase to match the other two rather than
treating all three as broken.

**D-6 — The spec gate's external ruler is ISO/IEC/IEEE 29148:2018.** The spec gate is the one gate
with no upstream artifact, so `expert-review` Step 7 is vacuous there and no ruler was bound. ISO
29148 is the standard the two reviewers who did *not* read the authoring skill reached for
unprompted (R2, R5), which is evidence it is the natural fit rather than a planner invention.

**D-7 — S20 escalates rather than reverts a stray file.** A stray artifact is an owner-visible scope
question, not a reason to discard a phase's work. The plugin cannot sandbox an agent's writes, so
detection-and-escalation is the available control.

**D-8 — This plan carries the defect class that fired the APS Fusion tripwire, and cannot eliminate
it.** Round 1 of this plan's own review found drift in three of its cross-reference surfaces. That
is the same shape APS Fusion hit in ten locations across six rounds: *a hand-maintained
cross-reference or enumeration with no generator, drifting on the next edit* (claim 27, commit
`cd2f27b`). Naming it here rather than only fixing the three instances is the whole point — fixing
instances and leaving the class is what manufactured three findings in each of that project's last
two rounds.

**The surfaces this plan carries**, all of them required by the output contract rather than chosen:
§1's Goal sentence (scope → steps), §2's coverage reconciliation (requested item → step IDs),
**§3's standards registry (standard → step IDs)**, §5's file list (path → step IDs), §11's claims
(claim → step IDs), §12's test IDs (referenced from every step's Verification field), §13's counts,
§14's register (question → step IDs), and §7's per-step dependency lists (step → step IDs). **Nine
surfaces**, every one a duplicate of information that lives in §7's steps.

**This list is itself a hand-maintained enumeration with no generator** — the class describing
itself. It and maintenance rule 3's enumeration are the same set and must be edited together; a
surface missing from either is a surface nothing checks.

**Generation is the documented fix and it is unavailable here.** APS Fusion's rule is "scripts that
*generate* a derived surface are the fix; scripts that *audit* prose are the problem" — and this
plan is prose with no build step. A script that parsed the steps and regenerated §2 and §5 would
require every step to carry machine-readable file and coverage declarations, which is a different
document format and a change to the output contract, not a plan edit. **So the class cannot be
closed at its source by this plan**, and claiming otherwise would be the "fix note is not evidence
of a fix" failure.

**What is available, and what is therefore adopted:** make every cross-reference **one-directional**
so only one side can drift, and state the maintenance rule in a preamble so an editor meets it
before editing rather than after — the mechanism the APS Fusion plan itself uses (its §7 and §11
preambles). §11 already carries its citation preamble; §7 gains the cross-reference preamble. This
reduces the drift surface; it does not remove it, and the residual is recorded in §15 as a gap
rather than presented as closed.

**Why this is recorded as a decision rather than silently applied:** the honest reading is that the
output contract mandates six duplicated surfaces on a prose artifact and supplies no generator,
which makes drift a property of the format. That is a finding about the *contract*, and it is not
this plan's to change.

---

## 11. Verification of factual claims

**Citation rule for this section (class fix, 2026-07-31).** Claim 27 went stale mid-authoring
because it cited a mutable file by path alone and that file was rewritten by another session four
hours later. Path-only citation of anything editable is therefore forbidden here:

- **Files inside this plugin** — cited by path and line range. They are the artifact under change;
  the plan's own steps are what move them, and every step that does so is listed in §5.
- **Files elsewhere in the repository** — cited by path **and commit**. `755bf9b`, `cd2f27b`.
- **Files outside version control** (run transcripts under `~/.claude/projects/`, plugin caches) —
  cited by path and date, with a note that they are outside version control and cannot be pinned.
  Run transcripts are append-only and were not rewritten; the caches are read-only inputs.
- **Documentation** — Context7 library ID with the date of lookup, or a fetched URL with its date.

A reviewer can check any entry below without trusting that the cited file still reads as it did.

1. **`mcp__plugin_expert-dev-tools_context7__*` registers zero tools** (S1, S2). *Evidence — test
   reproduction:* `ToolSearch` with `select:mcp__plugin_expert-dev-tools_context7__resolve-library-id,mcp__plugin_expert-dev-tools_context7__query-docs`
   returned "No matching deferred tools found", 2026-07-31; a second keyword search biased toward
   context7/docs/library within that namespace returned only the nine
   `mcp__plugin_expert-dev-tools_clear-thought__*` tools.
2. **The cause is command/URL deduplication** (S1). *Evidence — test reproduction:* `/plugin` output,
   2026-07-31: `MCP server "context7" skipped — same command/URL as server provided by plugin
   "context7"`.
3. **The plugin's and the standalone plugin's context7 commands are byte-identical; the three
   clear-thought commands differ** (S1). *Evidence — file reads:*
   `claude-plugins/expert-dev-tools/.mcp.json` (`npx` / `["-y","@upstash/context7-mcp"]`);
   `~/.claude/plugins/cache/claude-plugins-official/context7/unknown/.mcp.json` (identical);
   `claude-plugins/agentboard/.mcp.json` (clear-thought as `cmd` / `["/c","npx","-y","-p",…]`),
   all read 2026-07-31.
4. **The six agents' current tool grants** (S2). *Evidence — file reads:* frontmatter `tools:` line
   of each of `agents/expert-spec-writer.md`, `expert-implementer.md`, `expert-verifier.md`,
   `expert-diagnostician.md`, `expert-acceptance.md`, `expert-closeout.md`, read 2026-07-31.
   Spec-writer: `Read, Grep, Glob, Write, Skill, mcp__plugin_expert-dev-tools_context7`.
5. **`tools` and `disallowedTools` may coexist; `disallowedTools` applies first** (S2, S5).
   *Evidence — documentation read:* Context7 `/websites/code_claude`, section "Control subagent
   capabilities > Available tools", read 2026-07-31: "If both are set, `disallowedTools` is applied
   first, then `tools` is resolved against the remaining pool."
6. **The reviewer's WebFetch/WebSearch denial is an *architecture* decision, not a spec
   requirement** (S2). *Evidence — file read:* `docs/arch/architecture-expert-dev-tools.md:863` —
   "…edit the artifact it judges; the nameable WebFetch/WebSearch, outside its instrument roster,
   are also denied", a refinement of D5/D11 adopted per owner directive. *Mechanically asserted at:*
   `tests/structural/check-structure.mjs:71`, whose `(F3)` parenthetical is **not** an authority for
   this claim. Spec F-3
   (`docs/specs/spec-expert-dev-tools.md:155–158`, read) is "Context provisioning… Reviewer packages
   are blinded and mechanical-only" and contains no tool denial. **Content absence, scope = the
   complete spec:** `grep -c "WebFetch\|WebSearch"` over `docs/specs/spec-expert-dev-tools.md`
   returns **0**, re-executed 2026-07-31. A test file's own label is the test author's attribution,
   not the spec's text — accepting it as evidence is the comment-as-verification failure. **Consequence for the plan:** revisiting this constraint later is an
   architecture amendment, not a spec change.
7. **`skills.length === 9` and `agents.length === 9` are exact-equality assertions** (S7).
   *Evidence — file read:* `tests/structural/check-structure.mjs:39` and `:54`.
8. **`readonlyAllow` asserts no `Write` **and** no `Edit`** (S7). *Evidence — file read:*
   `tests/structural/check-structure.mjs:49,66`.
9. **Three of four `reviewFn` dispatches carry the phrase "and named standards" without naming one;
   the implementation gate names no standard at all** (S8, S9). *Evidence — file read plus counted
   search:* `grep -c "named standards" workflows/expert-lifecycle.js` → **3**, at `:330`, `:359`,
   `:377`. Line `:410` read verbatim: `` `Review the implementation diff against the plan at
   ${planPath}${lens ? ` through the ${lens} lens` : ''}. Round ${round}.` `` — the phrase is
   absent. `docs/investigate.md` §5c records the implementation gate's "Standard named" cell as
   "not mentioned", distinct from the other three rows' "no" — a distinction that must survive into
   any restatement of that table. **Consequence:** S8's implementation-gate edit is an insertion,
   not a replacement — see S8.
10. **`expert-review/SKILL.md` already forbids using the authoring artifact as the quality
    standard** (S8). *Evidence — file read:* `skills/expert-review/SKILL.md:111` — "The plan, spec,
    or architecture is the validation reference, not the quality standard."
11. **Three of five spec reviewers read `expert-spec/SKILL.md`, and it predicts their ruler
    exactly** (S8). *Evidence — file reads of run transcripts:* `Read` tool `file_path` values
    extracted from `agent-af32986659fe5d14f` (R1), `a7b7f0b272f9d424b` (R2),
    `ab671ae6128426040` (R3), `ae17bbc3a73b389d7` (R4), `a1a27e6d54a51b65e` (R5) under
    `~/.claude/projects/…/819ec7c6…/subagents/workflows/wf_f5f5ff93-f13/`, read 2026-07-31;
    cross-referenced against each reviewer's structured-output `standard` fields.
12. **The workflow's path fallbacks and the unread `artifact_path`** (S10). *Evidence — file read:*
    `workflows/expert-lifecycle.js:281–283` (`|| 'docs/specs/spec.md'` etc.) and `:63`
    (`artifact_path: S_STR` in `PHASE_SCHEMA`); no read of `artifact_path` occurs anywhere in the
    file (content absence, scope = the complete file: `grep -c artifact_path` over the **493**-line
    file returns **1**, the schema declaration at `:63`; there is no read in the body).
13. **Six sources of truth for the artifact path, one of which outranks the workflow** (S10, S11).
    *Evidence — file reads, re-derived by a scan over the complete plugin 2026-07-31:*
    `skills/expert-spec/SKILL.md:349`, `skills/expert-architecture/SKILL.md:456,458`,
    `skills/expert-architecture-portable/SKILL.md:302`, `skills/expert-plan/SKILL.md:390`,
    `workflows/expert-lifecycle.js:281`, and `commands/expert.md:61–64`, which supplies "the project
    defaults under `docs/`" into `input.spec_path`. **The sixth is the load-bearing one:** because
    `:281` reads `input.spec_path` first, the command's default wins on every fresh run and the
    agent's returned `artifact_path` is never reached, so any fix that does not invert that
    precedence leaves B7 open.
14. **`diagnose()` is two-parameter with eight call sites** (S12, S13). *Evidence — file read:*
    `workflows/expert-lifecycle.js:247` (declaration) and call sites at `:310, 336, 396, 426, 435,
    448, 456, 490`.
15. **`lastFindings` is computed from `gate.history` two lines after `diagnose()` returns** (S13).
    *Evidence — file read:* `workflows/expert-lifecycle.js:336–338` — `:336` is the `diagnose`
    call, `:337` is `delta.phase = 'spec'`, `:338` is the `lastFindings` assignment. The findings
    reach the owner gate and never the diagnostician.
16. **`gate_history` entries carry `findings_count`, never `findings`** (S12). *Evidence — file
    read:* `scripts/ledger.schema.json:68–87`.
17. **The command applies the ledger delta only after the segment returns** (S12). *Evidence — file
    read:* `commands/expert.md:46–50` (step 3, invoke) and `:70–105` (step 4, write) — the write
    step follows the invoke step.
18. **The six "flag once" sites and their line numbers** (S16). *Evidence — file reads:*
    `skills/expert-spec/SKILL.md:163`, `skills/expert-standard/SKILL.md:40`,
    `skills/expert-review/SKILL.md:147`, `skills/expert-architecture/SKILL.md:90`,
    `skills/expert-architecture-portable/SKILL.md:150`, `skills/expert-mcp-overhaul/SKILL.md:32`.
    Content absence for the remaining three skills (`expert-implement`, `expert-plan`,
    `frontend-standards`): searched all nine `skills/*/SKILL.md` for
    `flag once|flag it once|then comply|flag the concern` case-insensitively — scope is the complete
    packaged skill set — and read every hit; the three named returned no hit.
19. **Spec artifact registration occurs after the non-convergence return; architecture and plan
    register before their gates** (S17). *Evidence — file read:*
    `workflows/expert-lifecycle.js:335–340` (escalation return), `:344` (spec push), `:357`
    (architecture push, before `runGate` at `:358`), `:375` (plan push, before `runGate` at `:376`).
20. **`feedbackEsc` is built only for `failed_correction` and `systemic_defect`** (S18).
    *Evidence — file read:* `workflows/expert-lifecycle.js:304–312`.
21. **The STATUS predicate matches neither branch for a stale record** (S18). *Evidence — file
    read:* `commands/expert.md:106–119` — surfaces `state: "open"`, or `corrected` with an
    occurrence at/above `fixed_in_version`; a stale record's occurrences sit below it.
22. **The occurrence-append instruction carries no dedupe key** (S19). *Evidence — file read:*
    `commands/expert.md:94–99`.
23. **`occurrences[]` already requires `project`, `session_file`, `date`** (S19). *Evidence — file
    read:* `scripts/ledger.schema.json:157–171`.
24. **The structural tier asserts only that the workflow parses and passes the linter** (S15).
    *Evidence — file read:* `tests/structural/check-structure.mjs:76–91`.
25. **Nothing imports `workflows/expert-lifecycle.js`** (§5, blast radius). *Evidence — structural
    trace:* `codegraph_get_dependents` returns 0 dependents; scan scope
    `claude-plugins/expert-dev-tools`, `force: true`, 2026-07-31, 6 JS files, 0 parse errors.
26. **The A-3 run's spec-writer dispatches made 11 `Write` calls and 0 `Edit` calls** (S5, D-1).
    *Evidence — test reproduction:* counted `"name":"Write"` / `"name":"Edit"` tool_use occurrences
    across the six spec-writer transcripts `ab14786f659fbc3c3`, `a773e5b6c5281367e`,
    `a207133ceb263f4eb`, `a31346bc8b7538e63`, `ae1997d599d30d0b5`, `ae6b165ce27acca6d`,
    2026-07-31 — 2/0, 1/0, 4/0, 1/0, 2/0, 1/0.
27. **The four correction behaviours and their observed outcomes** (S4, S5, S6b, D-1 — the claim the
    entire correction discipline rests on). **Cited by commit, not by path: the source file changed
    during this plan's authoring.**

    *Evidence — file read at `mcp-servers/aps-fusion-mcp-server/HANDOFF.md`, commit `755bf9b`*
    section "Process record — why twenty rounds, and what to keep" (present at that commit; **removed
    at `cd2f27b`**, which is why this claim is pinned rather than cited by path): "Rounds 1–11 failed on patch-style corrections";
    "Rounds 13–19 applied the corrected discipline — re-derive the affected section from its
    sources, sweep the finding's class, re-read what the edit touched — and every closure was
    verified by the following round"; "Three fix-site regressions still occurred (rounds 15, 16,
    19)". This is the **architecture** cycle.

    *Evidence — file read at the same path, commit `cd2f27b`* ("Update handoff: plan complete as
    artifact, tripwire fired on round 6", authored 2026-07-31 11:05 — **after** the first read;
    verified by `git log` and by `git show HEAD:<path>` not matching the quoted string while
    `git show 755bf9b:<path>` does). The section above is gone, replaced by the **plan** cycle's
    record: "Findings by round: 9 → 10 → 9 → 8 → 8 → 11. Condition (b) fired at round 6";
    "**No round has ever found missing work, a wrong design decision, or a defect in the build
    order**"; "one defect *shape* kept reappearing somewhere new: a hand-maintained cross-reference
    or enumeration with no generator, drifting on the next edit. Ten distinct locations across six
    rounds"; "Three of round 5's findings were manufactured by round 4's fixes; three of round 6's
    by round 5's"; "**Correct the class, not the instance.**"

    *What the two together support:* re-derivation closes findings the next round verifies
    (architecture cycle) **but does not converge when the artifact carries hand-maintained derived
    surfaces** (plan cycle), because each correction re-arms the surface it edits. Both readings are
    load-bearing and D-1's four-row table states both.

    *Method note carried into this plan:* a claim citing a mutable file by path alone is stale the
    moment that file is edited. Every claim in §11 that cites a document outside this plugin now
    carries a commit. This is a **class fix**, not a repair of claim 27 — see the §11 preamble.
28. **The A-3 run contains one fix-site regression, R4→R5** (D-1, §13, S6b). *Evidence — file reads
    of run transcripts:* reviewer `ae17bbc3a73b389d7` (R4) returned a Moderate finding that
    `scratch-note.txt` is unaccounted for in the spec; reviewer `a1a27e6d54a51b65e` (R5) returned a
    Minor ISO/IEC/IEEE 29148 "Consistent" finding whose `premise_evidence` cites spec lines 271–273
    stating the file's classification was "established by reading it in full" while the same
    paragraph states the work "neither delivers, modifies, nor reads it" — the contradiction sits
    inside the paragraph added to close R4's finding. Both read 2026-07-31 from
    `~/.claude/projects/…/819ec7c6…/subagents/workflows/wf_f5f5ff93-f13/`. **The two locations
    differ**, which is what makes a findings-to-findings comparison insufficient (S6b part 4).
29. **`runGate` discards `remediateFn`'s return value, and `PHASE_SCHEMA` has no field for what a
    correction touched** (S6b). *Evidence — file read:* `workflows/expert-lifecycle.js:240` —
    `await remediateFn(findings, round)` is a bare await, the return value unassigned; and
    `:58–75`, the complete `PHASE_SCHEMA` property list (`status`, `artifact_path`, `evidence`,
    `halt`) contains no field naming edited or re-derived locations. Both are prerequisites for
    S6b: the field must be added and the return captured.
30. **`CORRECTION_FAILED` does not touch the prohibited constants** (S6b, Q-20).
    *Evidence — file read:* `workflows/expert-lifecycle.js:96–112` — `VERDICT_SCHEMA.verdict` is
    `enum: ['PASS', 'NEEDS_FIXES']`, a schema for the *reviewer's* output; and `:224–243` —
    `runGate`'s return `verdict` is a separate internal value already carrying a third state
    (`'NON_CONVERGENCE'`). `ROUND_CAP` at `:33` is unchanged by S6b.
31. **`findings[].location` is optional and format-free today; the detectors require it required and
    parseable** (S6b parts 3 and 5). *Evidence — file read:*
    `workflows/expert-lifecycle.js:96–112` — `VERDICT_SCHEMA.findings.items` declares
    `required: ['classification', 'standard']` and `properties: { …, location: S_STR }` with
    `S_STR = { type: 'string' }` (`:49`). `location` is therefore neither required nor constrained,
    while detector (a) parses it as a range and detector (b) tests it for set membership. S6b part 5
    adds it to `required` and gives it a grammar; S2b cannot substitute, because `returns:` names
    field presence and not format.

---

## 12. Test specifications

All tests below are additions to or runs of the existing **structural tier**
(`tests/structural/check-structure.mjs`), which dispatches no agents and spends no tokens. The
behavioural tier is re-run in Post-completion, not here.

**T-1 — `.mcp.json` declares a non-colliding context7 invocation.**
*Behavior verified:* S1's change is present and the server key is unchanged.
*Level:* unit (static configuration assertion). Rationale: the property is a pure function of one
file's contents.
*Real/double boundary:* no doubles. The real `.mcp.json` is read from disk.
*Data:* the repository's own `.mcp.json`.
*Must NOT assert:* that the server actually started — that requires a reload and is an owner-run
check, not a test. *Fails when:* the `context7` entry's `command` is the bare `npx` form, or the
`context7` key is absent.

**T-2 — every allowlisted agent holds both documentation paths.**
*Behavior verified:* S2 — each of the six agents' `tools` contains
`mcp__plugin_expert-dev-tools_context7`, `WebFetch`, and `WebSearch`.
*Level:* unit. Rationale: a frontmatter property of six files.
*Real/double boundary:* no doubles; real files parsed by the suite's existing `frontmatter()`.
*Data:* the six real agent files.
*Must NOT assert:* anything about `expert-reviewer`, whose F3 denial is asserted separately at
line 71. *Fails when:* any of the six omits any of the three grants.

**T-2b — every agent declares the return contract the workflow reads from it.**
*Behavior verified:* S2b — each of the ten agent files carries `returns:` and `jobs:` frontmatter;
every field the workflow reads off that agent's structured return appears in its `returns:`; and
`jobs:` equals the count of distinct dispatch labels targeting it.
*Level:* unit (static assertion over agent frontmatter and workflow source). Rationale: the property
is a relation between two files' literal contents, with no runtime component.
*Real/double boundary:* no doubles. The real agent files are parsed by the suite's existing
`frontmatter()` at `check-structure.mjs:14–34`, which already handles YAML block sequences; the real
workflow source supplies the consumption map by literal match on `agent(` call options and
`const <NAME>_SCHEMA = {` blocks (S2b names this oracle explicitly).
*Data:* the ten real agent files and the real workflow. No fixtures — a fixture agent would verify
the fixture.
*Technique:* equivalence partitioning — {field read and declared} (passes), {field read and not
declared} (fails), {field declared and not read} (passes; over-declaration is not an error),
{`jobs:` mismatched against dispatch-label count} (fails).
*Must NOT assert:* that any agent *behaves* according to its `returns:` — that is the behavioural
tier. And no assertion may be satisfied by the corrector alone; the check runs over all ten.
*Fails when:* any agent omits `returns:` or `jobs:`; any field the workflow reads is absent from the
owning agent's `returns:`; or `jobs:` disagrees with the dispatch-label count. **Must-fail case,
executed:** temporarily remove `sections_rederived` from `expert-corrector.md`'s `returns:` and
confirm the suite goes red — without it the assertion has never demonstrated it can fail, which is
the defect that left round 2's controls green over a dead path.

**T-3 — the S1 invocation form is guarded.**
*Behavior verified:* S3's assertion exists and the `.mcp.json` form matches it.
*Level:* unit. *Real/double boundary:* none. *Data:* real `.mcp.json`.
*Must NOT assert:* the specific wrapper (`cmd /c`) as the only valid distinct form — assert only
that it is not the bare colliding form, so a future correct change is not blocked.
*Fails when:* the invocation reverts to `npx` with exactly `["-y","@upstash/context7-mcp"]`.

**T-4 — the correction skill loads clean.**
*Behavior verified:* S4 — `skills/expert-correct/SKILL.md` has parseable frontmatter and a `name`.
*Level:* unit. Covered by the existing per-skill loop at `check-structure.mjs:40–43` once the count
is updated. *Real/double boundary:* none. *Data:* the real skill file.
*Must NOT assert:* the skill's prose content. *Fails when:* frontmatter is malformed or `name` is
absent.

**T-5 — the corrector agent is granted `Edit` and denied `Write`.**
*Behavior verified:* S5's load-bearing property.
*Level:* unit. *Real/double boundary:* none. *Data:* the real agent file.
*Must NOT assert:* that the agent behaves correctly at runtime — that is the behavioural tier.
*Fails when:* `tools` contains `Write`, or omits `Edit`.

**T-6 — the three document gates dispatch the corrector.**
*Behavior verified:* S6 — the `remediateFn` at the spec, architecture, and plan gates names
`AGENT.corrector`; the implementation gate's still names `AGENT.planner`.
*Level:* unit (static source assertion over the workflow text).
*Real/double boundary:* none — the workflow source is read, not executed.
*Data:* the real `workflows/expert-lifecycle.js`.
*Must NOT assert:* dispatch behaviour at runtime. *Fails when:* any document gate still names an
authoring agent in `remediateFn`, or the implementation gate names the corrector.

**T-7 — counts and set membership updated.**
*Behavior verified:* S7 — 10 skills, 10 agents, `expert-corrector` in `allowlist` and not in
`readonlyAllow`. *Level:* unit. *Real/double boundary:* none. *Data:* real directory listings.
*Must NOT assert:* a hard-coded list of skill names, which would need editing on every addition.
*Fails when:* a file is added or removed without updating the counts.

**T-8 — every review dispatch names a ruler and a contract.**
*Behavior verified:* S8, S9 — each of the four `reviewFn` template strings **interpolates a `RULER`
entry** and cites an output contract. Asserted as a **presence** check per gate, not as absence of
"and named standards": line 410 satisfies the absence form today without any edit, so an
absence-only assertion cannot catch an omission at the one gate that most needs it.
*Level:* unit (static source assertion). *Real/double boundary:* none.
*Data:* the real workflow source. *Technique:* decision table — one row per gate × {ruler present,
contract present}, four rows. The implementation row's contract cell is **N/A by S9's stated scope**
(no output contract exists for a diff), and the table records that rather than leaving it blank.
*Must NOT assert:* the exact wording of a ruler, which will be refined.
*Fails when:* any of the four gates' dispatches lacks a `RULER` interpolation, **or** any of the
three gates in S9's scope (spec, architecture, plan) lacks its contract citation. Both halves are
asserted, because a fail condition covering only the ruler leaves half the technique table
unfalsifiable — which is what let S9's defect through.

**T-9 — the workflow consumes `artifact_path` and has no path defaults.**
*Behavior verified:* S10. *Level:* unit (static source assertion).
*Real/double boundary:* none. *Data:* real workflow source.
*Must NOT assert:* the runtime value of any path. *Fails when:* any of the three literal defaults
(`'docs/specs/spec.md'`, `'docs/arch/architecture.md'`, `'docs/plans/plan.md'`) remains, or
`artifact_path` is never read.

**T-10 — the four skills state one fixed location.**
*Behavior verified:* S11 — none of the four contains "propose a location", "get confirmation", or
"if there's an established location".
*Level:* unit (content absence over a bounded, enumerated file set).
*Real/double boundary:* none. *Data:* the four real skill files.
*Must NOT assert:* the presence of specific replacement prose. *Fails when:* any of the three
phrases survives in any of the four files.

**T-11 — `diagnose()` takes three parameters and labels the ledger as stale.**
*Behavior verified:* S12. *Level:* unit (static source assertion). *Real/double boundary:* none.
*Data:* real workflow source. *Must NOT assert:* prompt wording beyond the staleness label.
*Fails when:* the declaration has two parameters, or the prompt omits the staleness statement.

**T-12 — every `diagnose(` call site passes three arguments.**
*Behavior verified:* S13, S15 — the arity guard.
*Level:* unit. *Real/double boundary:* none. *Data:* real workflow source.
*Technique:* equivalence partitioning — {declaration, 3-arg call, <3-arg call}; the declaration is
excluded, 3-arg calls pass, anything else fails.
*Must NOT assert:* the content of the failure record — that is per-site and covered by T-11's
sibling reads. *Fails when:* any call site passes fewer than three arguments.

**T-13 — the diagnostician's contract matches the caller.**
*Behavior verified:* S14 — `agents/expert-diagnostician.md` no longer promises a run-journal
excerpt. *Level:* unit (content absence, single file). *Real/double boundary:* none.
*Data:* the real agent file. *Must NOT assert:* replacement wording.
*Fails when:* "run-journal excerpt" survives.

**T-14 — the six clauses are gone from all nine skills.**
*Behavior verified:* S16. *Level:* unit (content absence over the complete packaged skill set —
scope is all nine `skills/*/SKILL.md`, which is the full population, so the scope is credibly
covered). *Real/double boundary:* none. *Data:* the nine real skill files.
*Must NOT assert:* that any replacement text exists — the owner ruled deletion without replacement.
*Fails when:* `flag once`, `flag it once`, `then comply`, or `flag the concern` matches in any
packaged skill.

**T-15 — the spec artifact registers before the gate.**
*Behavior verified:* S17 — the `role: 'spec'` push precedes the `runGate` call in source order.
*Level:* unit (static source assertion). *Real/double boundary:* none.
*Data:* real workflow source. *Must NOT assert:* runtime registration.
*Fails when:* the push appears after the non-convergence return.

**T-16 — `stale_deployment` builds an escalation.**
*Behavior verified:* S18's workflow half — a `stale_deployment` branch exists alongside
`failed_correction` and `systemic_defect`.
*Level:* unit (static source assertion). *Real/double boundary:* none.
*Data:* real workflow source. *Must NOT assert:* the STATUS predicate, which lives in a markdown
command file and is checked by T-17's sibling read.
*Fails when:* no `stale_deployment` branch exists.

**T-17 — the command carries a dedupe key and the stale branch.**
*Behavior verified:* S18's command half and S19. *Level:* unit (content presence, single file).
*Real/double boundary:* none. *Data:* real `commands/expert.md`.
*Must NOT assert:* prose wording beyond the key `(project, session_file)` and the stale branch.
*Fails when:* either is absent.

**T-18 — document phases carry a scope check.**
*Behavior verified:* S20 — a scope-check dispatch exists after each document gate's PASS.
*Level:* unit (static source assertion). *Real/double boundary:* none.
*Data:* real workflow source. *Must NOT assert:* the check's runtime verdict.
*Fails when:* fewer than three document phases carry the check.

**T-19 — the A-4c fixture describes a three-way contradiction.**
*Behavior verified:* S21. *Level:* unit (content assertion, single file).
*Real/double boundary:* none. *Data:* the real fixture. *Must NOT assert:* that the fixture triggers
the control — that is A-4c's job in the behavioural tier.
*Fails when:* the fixture still frames the conflict as two-way.

**T-20 — no verification mechanism is weakened.**
*Behavior verified:* S22 — the properties the correction doctrine actually protects: the spot-check
sampling constant `max(2, ceil(0.1n))` is unchanged; no existing check is deleted; every schema
field present before the change is still present after it (the `result` split is additive —
`observed` and `asserted` are added, nothing is removed).
*Level:* integration (spans the diff and the source, not one file). Rationale: "nothing was
weakened" is a property of the change set, which no single-file assertion expresses.
*Real/double boundary:* no doubles — the real git diff and real source.
*Data:* the real working tree against the pre-implementation baseline.
*Must NOT assert:* that `tests/ACCEPTANCE.md` and `EVIDENCE` are untouched — S22 edits both,
deliberately and in the strengthening direction, so an untouched-assertion fails on correct
execution.
*Fails when:* the sampling constant changes, any check present at baseline is absent after, or any
schema field is removed rather than added alongside.

**T-22 — the fix-site-regression control is wired end to end.**
*Behavior verified:* S6b — `PHASE_SCHEMA` declares `sections_rederived`; `runGate` captures
`remediateFn`'s return rather than discarding it; **both** detectors fire; a `CORRECTION_FAILED`
verdict exists and is handled by the caller at all four gates.
*Level:* unit (static source assertion over the workflow), plus one **executed** case below.
*Real/double boundary:* for the static half, none. For the executed half, `runGate` is exercised
directly with hand-supplied `reviewFn` and `remediateFn` **stubs** (Meszaros: stub — canned returns
supplying the inputs that drive the asserted verdict). Justified: the real functions dispatch
subagents, which is neither fast nor deterministic, and the subject under test is `runGate`'s
comparison logic, not the agents. `runGate` itself runs real — it is the subject and is never
doubled.
*Data:* forward-derived from the observed A-3 case, not fabricated to pass. Round 1's stub returns a
finding at `spec.md:271-273`; the remediate stub returns
`sections_rederived: [{location: 'spec.md:265-280'}]`; round 2's stub returns a finding at
`spec.md:273`. The ranges are the real R4→R5 shape — a finding landing *inside* a re-derived
section at a line the original finding did not name.
*Technique:* boundary value analysis on range overlap for detector (a) — fully inside, partially
overlapping, exactly adjacent (no overlap), different file; **equivalence partitioning on set
membership for detector (b)** — a finding at a location in `class_sweep.found` that is not among
the corrected locations (fires); at a location in `class_sweep.found` that *was* corrected (does not
fire as (b); fires as (a)); at a location absent from `class_sweep.found` entirely (does not fire).
*Second executed case, for detector (b), forward-derived from the APS Fusion plan cycle:* round 1's
stub returns a finding at `plan.md:40`; the remediate stub reports
`sections_rederived: [{location: 'plan.md:35-45', class_sweep: {searched: 'hand-maintained
cross-reference tables', found: ['plan.md:35-45', 'plan.md:900', 'plan.md:1200']}}]`; round 2's stub
returns a finding at `plan.md:900` — found by the sweep, not corrected. That is the "class found
elsewhere" shape, and it must fire.
*Third executed case — the false positive the rebuild exists to prevent:* round 2's stub returns a
finding citing the **same `standard`** as round 1's, at `plan.md:1700`, a location absent from
`class_sweep.found`. It **must not fire** — a standard recurring where the sweep never looked is a
new class, and the rejected string-matching rule would have escalated it and stopped a converging
gate.
*Must NOT assert:* that any real correction was a patch — the control detects a signal, not an
intent; and no assertion targets the stubs' call counts.
*Fails when:* a finding inside a re-derived range does not produce `CORRECTION_FAILED` with
`kind: 'fix_site_regression'`; or a finding at a swept-but-uncorrected location does not produce
`kind: 'unclosed_class'`; or **a finding at a location absent from `class_sweep.found` produces
either verdict** (the false-positive guard); or an adjacent-but-non-overlapping finding produces
`fix_site_regression`.

**T-21 — the changed-file set matches the plan.**
*Behavior verified:* `git diff --stat` equals §5's file list, in both directions.
*Level:* integration. *Real/double boundary:* none — the real diff.
*Data:* the real working tree. *Must NOT assert:* line counts, which vary legitimately.
*Fails when:* any file is changed that §5 does not list, or any listed file is unchanged.

---

## 13. Risks

- **The correction discipline is not statically verifiable — and is guarded at runtime instead.**
  S5's grant blocks re-authoring and T-5 asserts that. **No structural assertion can distinguish a
  re-derived section from a patch**, because the difference is method, not artefact shape. Patching
  is the failure mode with the longest evidence trail in this repo (APS Fusion rounds 1–11, plus
  fix-site regressions at 15, 16, 19).

  **S6b closes this at runtime, on both shapes.** Detector (a) catches the correction that broke
  its own fix site; detector (b) catches the correction that closed the named instance and left the
  class, which is the shape that fired the APS Fusion tripwire six times. Residual risk after S6b:
  a correction that satisfies its finding, breaks nothing adjacent, and whose class genuinely does
  not recur — which is indistinguishable from a correct correction by any observable, and is
  therefore not a risk the loop needs to price.

  **The larger residual is on the artifact, not the corrector.** APS Fusion's diagnosis is that the
  class kept recurring because the artifact carried ten hand-maintained enumerations with no
  generator; no correction discipline converges against that substrate, which is why S4 makes the
  corrector escalate rather than absorb such a class. **This plan is itself such an artifact** —
  see D-8 — and that is the finding that outranks any individual step here.
- **Second: S8's ruler wording.** Too narrow and the gate lets defects through; too broad and
  nothing changes. The wording is the one part of this plan whose correctness cannot be settled
  statically — only the behavioural re-run measures it. Mitigated by naming standards that two
  independent reviewers already reached for unprompted (D-6), not planner inventions.
- **Hardest step: S13.** Eight call sites, each with a different evidence shape, one of them inside
  a shared helper that three phases call. A missed site silently restores the starved behaviour;
  S15's arity guard is the mitigation and is why it is a separate step.
- **Assumption that could fail: S1's fix restores registration.** The dedupe key is *stated* by the
  host as "command/URL" and corroborated by the clear-thought natural experiment, but the fix has
  not been executed. **Validate early** — CP-1 is placed immediately after S3 precisely so this is
  confirmed before anything is built on it. If it fails, S2's WebFetch/WebSearch grants still give
  every agent a working documentation path, so the plan degrades rather than blocks.
- **Coupling hotspot touched:** `workflows/expert-lifecycle.js` is modified by **twelve of the
  twenty-six** steps (§5, re-derived 2026-07-31). It has zero import-dependents, so the graph blast radius is nil — but it is
  the plugin's single point of orchestration, and every behavioural property runs through it. CP-3
  exists for this.
- **Irreversibility:** none. Every change is to a text file under version control; no migration, no
  persisted-state change, no schema change. Recoverable from any point.
- **What this plan does not de-risk:** whether the repaired loop converges. That is measured, not
  planned, and the measurement costs ~1.5 M subagent tokens.

---

## 14. Question register

| # | Question | Arose | Bin | Disposition |
|---|---|---|---|---|
| Q-1 | Does renaming the plugin's context7 server key fix the collision? | S1 | 1 | No — the host's message names command/URL as the key, and `check-structure.mjs:100` asserts the key is `context7`. Closed by claim 2, 3, and 6. |
| Q-2 | Should the bundled context7 be dropped in favour of the host's? | S1 | 1 | No — a distributed plugin cannot depend on the user's installed set; that coupling is the defect. Recorded in S1 part 4. |
| Q-3 | Does `expert-reviewer` need WebFetch/WebSearch too? | S2 | 1 | No — it reaches documentation through inherited MCP. The denial's authority is `docs/arch/…:863` (D5/D11 refinement, owner directive), **not** spec F-3, which contains no tool denial; amending it is therefore an architecture change. Closed by claim 6. Supersession recorded in the round-01 review. |
| Q-4 | Can `tools` and `disallowedTools` coexist on one agent? | S5 | 1 | Yes — `disallowedTools` applies first. Closed by claim 5 (Context7 documentation read). |
| Q-5 | Does adding a skill and an agent break the structural tier? | S4, S5 | 1 | Yes — both are exact-equality count assertions. S7 added. Closed by claim 7. |
| Q-6 | Should the implementation gate also use the corrector? | S6 | 1 | No — architecture D6 makes amend-plan its correct path, and the rewrite defect was measured at document gates only. Recorded as D-2. |
| Q-7 | Is the workflow's one-of-four-channels dispatch a spec defect? | S12 | 1 | No — a code-versus-contract divergence. Spec F-13 and architecture C3 are correct; the code diverges. Recorded in §4 and §7 S12 part 2. |
| Q-8 | Is B6 general or spec-specific? | S17 | 1 | Spec-specific. Architecture and plan push before their gates. Closed by claim 19; recorded as D-5. |
| Q-9 | Does B2 need a ledger-schema change? | S19 | 1 | No — `occurrences[]` already requires `project` and `session_file`. Closed by claim 23. |
| Q-10 | What replaces the deleted "flag once" clauses? | S16 | 2 | **Owner answered 2026-07-31: nothing.** Deletion without replacement; there is no legitimate skip path to describe. Incorporated in S16 and `docs/investigate.md` §6. |
| Q-11 | Which artifact-path convention wins? | S10, S11 | 2 | **Owner answered 2026-07-31: the skill's.** `spec-[kebab-case-name].md` under `docs/specs/`; the workflow consumes `artifact_path`. Incorporated in S10, S11. |
| Q-12 | Should B3/B4 be resolved in this plan? | S22 | 2 | **Owner ruling 2026-07-31: resolve both, strengthening direction only.** The correction doctrine bars *weakening* a verification mechanism, not touching one. B3 corrects A-8 to match spec F-14; B4 adds an observed/asserted split and a cross-entry consistency check, sampling constant unchanged. Incorporated in S22; T-20 asserts *nothing was weakened*. Owner may override — the reasoning is in S22 for that purpose. Supersession recorded in the round-02 review. |
| Q-13 | Are the other eight plugin load errors in scope? | S1 | 2 | **Owner answered 2026-07-31: not relevant.** Recorded in `docs/investigate.md` §5d. |
| Q-14 | Does the corrector need documentation tools? | S5 | 1 | Yes — a citation finding is unfixable without them, which is exactly why R5's Traceable finding survived. Grant included in S5. |
| Q-15 | Can `Edit`-only break if a correction must create a file? | S5 | 1 | No — at a review gate the artifact exists by definition. Recorded as D-1's sensitivity note. |
| Q-16 | Is the round-cap question re-asked here? | §2 | 1 | No — `behavioral-tier-findings.md` defers it until measured against the repaired loop; asking now would answer against replaced machinery. Recorded as a scope exclusion. |
| Q-17 | Is correction patching, or re-derivation from sources? | S4, S5 | 2 | **Owner answered 2026-07-31: never patching.** Re-derivation is the discipline; both patching and re-authoring are forbidden, per claim 27. Incorporated in S4 (method), S5 (grant), D-1 (the four-behaviour table), §13 (risk). Supersession recorded in the round-01 review. |
| Q-18 | Should this plan build the fix-site-regression control? | §13 | 1 | **Yes — S6b.** First disposed of as out-of-scope follow-up; that was effort-based deferral wearing a scope label, which this skill names as non-compliance, and it left the plan's own largest stated risk unguarded. Re-derived: the control is fully specifiable now. Its one apparent blocker — that comparing findings round-over-round misses the observed R4→R5 case — is what *forces* the `sections_rederived` field, not what blocks the design. |
| Q-19 | Does the corrector need to report what it touched, or can findings be compared round-over-round? | S6b | 1 | It must report. R4's finding located `scratch-note.txt`; R5's landed at `spec.md:271-273` — different locations, so a findings-to-findings comparison misses the one real instance in the run. Closed by claim 28 and S6b part 4. |
| Q-20 | Does S6b's new verdict violate the ROUND_CAP / verdict-enum prohibition? | S6b | 1 | No. `CORRECTION_FAILED` (with `kind`) is a `runGate` return value, not a member of `VERDICT_SCHEMA.verdict` (which stays `PASS` \| `NEEDS_FIXES`), and it adds an exit *before* the cap without moving it. `runGate` already returns a third non-enum state, `'NON_CONVERGENCE'`. Closed by file read of `workflows/expert-lifecycle.js:96–112`, `:224–243`, `:33`. |
| Q-21 | Does every gate have an output contract S9 can cite? | S9 | 1 | No — three of four. `skills/expert-implement/SKILL.md` has 12 headings and no Output section; its nearest governs the implementer's report to the orchestrator, not the diff under review. A diff has no output contract distinct from the plan authorising it, which S8 already binds. The implementation gate is scoped out of S9 rather than pointed at a section that does not exist. |

**Reconciliation sweep.** Eight passes, the last over the document as it stands after review round
3, adding **zero** entries. Passes 1–3 built Q-1…Q-16 from the steps, decisions, test
specifications, risks and coverage table; passes 4–5 followed the owner's rulings on the correction
discipline and the fix-site-regression control (Q-17…Q-20 plus claims 27–29); passes 6–8 followed
review rounds 1–3 (Q-21, plus the supersessions on Q-3 and Q-12).

**Zero entries are open:** seventeen bin-1 entries closed with evidence pointers, four bin-2 entries
closed with the owner's answer and the step incorporating it, zero bin-3. Four dispositions were
superseded after first being written — Q-3, Q-12, Q-17, Q-18. Each states its current answer here;
the superseded version and the reasoning that overturned it are in the corresponding
`docs/reviews/plan-behavioral-remediation-round-0N.md` record, which is where drafting history
belongs.

### Review rounds

**Round 1 — independent, blinded (pointers only, no author-supplied checklist). Verdict: NEEDS
FIXES, 13 findings (1 Critical, 1 Systemic, 6 Serious, 2 Moderate, 3 Minor). All 13 applied.**

The thirteen are C-1, SYS-1, S-1…S-6, M-1, M-2, Mi-1, Mi-2, Mi-3 — SYS-1 carrying Serious severity
alongside the six S-numbered findings. **This record is the trajectory baseline the tripwire is
computed from**, so the count is load-bearing: it is counted from the body, never from a header.

| Finding | Where it landed |
|---|---|
| C-1 — the load-bearing claim no longer verifies; current source contradicts the generalization | D-1 re-derived with a four-row table and an explicit non-convergence admission; claim 27 re-derived and pinned to `755bf9b`/`cd2f27b`; §11 citation preamble added as the class fix |
| SYS-1 — workflow expects agent behaviour no step writes into the agent's document (3 instances) | §7 maintenance rule 5 (the standing rule); S5 gains a body; S6b edit 4 creates the return obligation; S20 gains the paired `expert-verifier.md` edit; S7 gains the dispatch↔job pairing assertion |
| S-1 — S6b's control cannot fire; its test passes on a stub | S6b edit 4; §5 lists the paired files; T-22 gains the must-fail case |
| S-2 — the new verdict is unhandled and falls through as PASS | **S15b** (new step) |
| S-3 — S6b precedes its declared dependencies | dependency split at the caller boundary: S6b sheds S12/S13; S15b carries them |
| S-4 — S8 unexecutable at the implementation gate; claim 9 flattened its source | S8 split into replacement (×3) and insertion (×1); claim 9 corrected; T-8 converted to a presence check |
| S-5 — B9c mapped to a step implementing something else | coverage row moved to S15b's `CORRECTOR_HALTED` path |
| S-6 — §5 omits modified files; T-21 fails by construction | §5 re-derived in full from the step set; sublists named for T-21 |
| M-1 — reviewer denial attributed to spec F-3, which lacks it | §3 registry row, S2 part 4, Q-3, claim 6 |
| M-2 — §5 omits S6b from the workflow annotation | subsumed by §5's re-derivation |
| Mi-1 — counting errors in claims 12 and 15 | corrected, both independently re-verified (493 lines, 1 occurrence, 2 lines after) |
| Mi-2 — "one of four channels" undercounts what the code supplies | §4, §6 F-3, S12 part 3 |
| Mi-3 — S5's frontmatter block omits `---` | S5's block now `---`-delimited, `skills:` before `tools:` |

**Class analysis — thirteen findings, seven classes.** Every finding belongs to exactly one class,
and every class carries a mechanism:

| Class | Findings | Mechanism added |
|---|---|---|
| Claim imported from a secondary source without re-derivation | C-1, S-4, M-1, Mi-2 | §11 citation preamble — in-repo files cited by commit |
| Cross-reference drift | S-6, M-2 | D-8 + §7 maintenance rules 1–4 |
| Agent contract not paired with a workflow change | SYS-1, S-1 | §7 rule 5; superseded at round 3 by S2b's `returns:`/`jobs:` binding |
| A new state not swept through its consumers | S-2, S-3 | S15b wires both new `runGate` states at both caller sites |
| Coverage mapping points at a step doing something else | S-5 | B9c re-mapped to S15b's `CORRECTOR_HALTED` path |
| Executability defect in a literal block | Mi-3 | S5's frontmatter `---`-delimited, key order matched to the existing nine |
| Counting error | Mi-1 | every numeric claim independently re-executed |

Each class carries a mechanism, not only its instances, because fixing instances and leaving the
class is what produced three findings in each of the APS Fusion plan cycle's last two rounds
(claim 27).

---

## 15. Gaps acknowledged

**G-1 — S1's fix is not executed-verified.** The claim that a distinct command string restores
registration rests on the host's own stated dedupe key ("same command/URL") plus the corroborating
natural experiment (three clear-thought servers with different command strings all register; two
byte-identical context7 servers produce one skip). *Attempt evidence:* queried Context7
`/websites/code_claude` for plugin `.mcp.json` deduplication behaviour, 2026-07-31 — the returned
sections cover how plugin MCP servers are declared and started but do not document deduplication;
the behaviour is undocumented. Confirming it requires editing `.mcp.json` and running
`/reload-plugins`, which is the implementation of S1 itself, not a pre-verification available to
the planner. *What would resolve it:* CP-1, placed immediately after S3 for this reason.

**G-2 — the eight other load errors are unexamined.** Owner-ruled out of scope 2026-07-31, so this
is a bounded gap rather than an open question. *Attempt evidence:* `/plugin` surfaced exactly one
message; on-disk MCP logs under `%LOCALAPPDATA%\claude-cli-nodejs` for this project are stale
(December). *What would resolve it:* the full plugin diagnostic view, if the owner ever wants it.

**G-3 — the cross-reference drift class is reduced, not closed.** Six sections of this plan restate
information originating in §7, none of them generated (D-8). Round 1 of review found drift in three
of them. *Attempt evidence:* the documented fix is generation, not auditing — APS Fusion HANDOFF,
commit `cd2f27b`: "Scripts that *generate* a derived surface are the fix; scripts that *audit* prose
are the problem." Generation was evaluated and is unavailable: it requires every step to carry
machine-readable file and coverage declarations, which changes the output contract's document
format rather than this plan's content, and the contract is not this plan's to amend. What was
applied instead — one-directional references and the §7 maintenance rule — reduces the number of
drift sites and makes the surviving ones single-sided. *What would resolve it:* a change to
`expert-plan/references/output-contract.md` specifying a machine-readable step declaration from
which §2, §5 and §12 are generated. That is a change to the planning skill, surfaced here because
this plan is evidence for it, and left to the owner.

Every other decision in this plan is grounded in a named standard from §3, and every factual claim
carries an entry in §11.

---

## 16. Post-completion

**Verify after all steps:**
- Structural tier green: `node tests/structural/check-structure.mjs` (run from the agent-armory
  checkout so the workflow-creator linter resolves, per `check-structure.mjs:82–85`).
- Unit tier green: `node tests/unit/run-unit-tests.mjs`.
- `git diff --stat` reconciles to §5 in both directions (T-21).
- **Exported-surface check:** `codegraph_diff_surface` against the pre-implementation baseline. The
  expected surface delta is **empty** — this plan adds no exported symbol; the workflow is a script
  with no exports beyond `meta`, and the new agent and skill are markdown. Any reported change is an
  unplanned breaking-change candidate to investigate.
- Owner-run: `/reload-plugins`, then confirm `mcp__plugin_expert-dev-tools_context7__*` resolves.

**Follow-up work this plan creates:**
1. **Re-run the behavioural tier from A-3 segment 1.** This is the measurement the whole plan
   exists to enable, and it is the owner's spend decision (~1.5 M subagent tokens, ~2 h).
2. **Re-run A-4a and A-4b.** Their diagnosis-quality PASSes are unverified — the starved dispatch
   was common to three of the four A-4 runs (`docs/investigate.md` §7).
3. **Owner rulings on B3 and B4**, surfaced by S22.
4. **Re-ask the round-cap and zero-findings calibration question** — only after 1 and 2, measured
   against the repaired loop.
5. **Bump `plugin.json` version** on commit, so the `failed_correction` / `stale_deployment` split
   (D15) has a correct `fixed_in_version` for anything corrected here.
6. **Confirm S6b fired, or confirm it had nothing to fire on.** Both detectors are built by S6b and
   unit-verified by T-22, but neither has run against live corrections. On the behavioural re-run,
   record whether any gate returned `CORRECTION_FAILED` and with which `kind`. Every result is
   informative: `fix_site_regression` proves the corrector is still patching; `unclosed_class`
   proves the sweep is incomplete and points at the surface that needs converting; a clean run
   across a converging gate is the first positive evidence that the fourth row of D-1's table is
   reachable, which no cycle on either project has yet demonstrated.
