# To investigate — expert-dev-tools

> **Remediation status — updated 2026-08-09.** The defects this investigation
> confirmed have been remediated by
> [`plan-expert-dev-tools-behavioral-remediation.md`](../plans/plan-expert-dev-tools-behavioral-remediation.md). This document is the **investigation
> record** — what was examined, what was confirmed, what was corrected, and the
> owner rulings of 2026-07-28 and 2026-07-31. It is not rewritten to describe the
> current code.
>
> | Section | Closed by | What changed |
> |---|---|---|
> | §1, §1a (no working documentation tool) | S1, S2, S3 | the bundled `context7` invocation no longer collides on command/URL; all six allowlisted agents hold both documentation paths; both facts asserted structurally |
> | §2 (no revision guidance in `expert-spec`) | S4, S5 | correction moved out of the authoring skill into `expert-correct` + `expert-corrector` |
> | §3, §6 (the "flag it once" clause is invalid) | S16 | all six clauses **deleted, not replaced**, across the packaged skills |
> | §4a, §5a–§5c (the ruler varies per round) | S8, S9 | every review dispatch names its ruler and excludes the authoring skill's process rules |
> | §4g (eleven `Write` calls, zero `Edit`) | S5 | the corrector's grant omits `Write`, so an artifact cannot be replaced wholesale |
> | §6 (the artifact convention) | S10, S11 | one fixed convention in the skills; the workflow consumes the returned `artifact_path`; nine sources of truth reduced to one |
> | §7 (the starved `diagnose()` dispatch) | S12, S13, S14, S15 | a third `failureRecord` parameter, populated at every call site, with the ledger honestly labelled stale, the diagnostician's input contract reconciled, and a structural arity guard |
>
> §5d and the eight other plugin load errors remain **out of scope** by owner
> ruling (2026-07-31); §1c's proportionality question is deferred until it can be
> measured against the repaired loop.


## 1. The spec-writer may have no working Context7 (documentation-fetch) tool

**Why this matters most:** the `expert-spec` skill makes documentation verification a hard
requirement and makes missing information a **stop condition**:

- Step 3: *"Anything the spec references from outside — a protocol, a standard, a library's
  behavior — gets verified against its current docs via Context7 or the authoritative source
  before writing requirements against it."*
- *"When you're missing something the spec needs"*: get the information, bound it out of scope, or
  report the spec cannot be completed. *"There is no fourth path where a known gap stays inside
  the requirements wearing a 'resolve later.'"*

If the spec-writer cannot reach a documentation-fetch tool, that requirement is **unsatisfiable**.
The writer then cites standards it cannot verify, the reviewer correctly flags the unverified
citations, and the same class of finding recurs every round. **No correction discipline converges
that loop** — the finding is not fixable by better editing, because the instrument needed to fix
it is absent. This would explain the A-3 non-convergence directly.

**Observed evidence (A-3 run, 2026-07-27):** the spec the writer delivered contained, and the
round-1 reviewer quoted, these self-flagged holes:

- *"the syllabus text was not fetched in this session (no documentation-fetch tool was reachable
  from this dispatch)"* — re: the ISTQB Foundation syllabus
- *"Cited from knowledge; not re-verified against the current specification text in this session"*
  — re: ECMA-262
- *"Stated from knowledge; not re-verified against Node.js documentation in this session."*
  — re: Node.js module resolution

The round-1 reviewer classified the resulting Sources-table defect **Serious-Systemic**, noting a
grep for `context7` across the delivered spec returned **0 hits** — no Context7 library ID was
recorded anywhere in the document.

Note the writer's own stated cause: *"no documentation-fetch tool was reachable from this
dispatch."* That is a claim made inside the artifact under review, not verified — it is the thing
to check, not to accept.

**Specific reason to suspect it is true:** the `expert-spec-writer` agent was given the tool
allowlist `Read, Grep, Glob, Write, Skill, mcp__plugin_expert-dev-tools_context7` during the
round-1 remediation (step R2). Two things could make that fail:

1. The server-level pattern `mcp__plugin_expert-dev-tools_context7` may not resolve to the
   underlying tools (`…__resolve-library-id`, `…__query-docs`) as intended.
2. The plugin's bundled MCP servers may not have started at all — `/reload-plugins` reported
   **"9 errors during load"** and those errors were never inspected.

**What to check:**

- Run `/plugin` and read the 9 load errors — determine whether any concern expert-dev-tools'
  MCP servers.
- Confirm whether the plugin's `context7` and `clear-thought` servers actually start and register
  tools under the `mcp__plugin_expert-dev-tools_*` namespace.
- Dispatch `expert-dev-tools:expert-spec-writer` and have it report the documentation-fetch tools
  actually available to it (an enumeration, not a claim about whether it "could" fetch).
- If the allowlist is the cause, determine the correct grant — e.g. the explicit tool names, or
  the `mcp__<server>__*` form — rather than assuming the server-level name suffices.

**Applies beyond the spec-writer.** The same allowlist form was given to `expert-implementer`,
`expert-verifier`, and `expert-diagnostician` in the same remediation step. If the grant does not
resolve, every one of those agents is silently missing Context7 too. `expert-architect` and
`expert-planner` use denylists and inherit host MCP, so they are likely unaffected — worth
confirming, since their skills also hard-require documentation verification.

**Status:** not investigated. No change has been made.

### 1a. CONFIRMED DEFECT — the spec-writer has no documentation fallback at all

This is not a question to investigate; it is verifiable from the agent file and is the more
serious half of the problem above.

`expert-spec-writer`'s tool allowlist is exactly:

```
tools: Read, Grep, Glob, Write, Skill, mcp__plugin_expert-dev-tools_context7
```

**No `WebFetch`. No `WebSearch`.** The agent therefore has exactly one path to any external
documentation, and no fallback if it fails.

But `expert-spec` step 3 names **two** acceptable paths, not one: *"gets verified against its
current docs **via Context7 or the authoritative source**."* Reaching "the authoritative source"
requires finding the page (WebSearch) and reading it (WebFetch). The spec-writer was given the
first path only.

**Owner ruling on the skill's stop condition (2026-07-28):** when information is missing, the
agent must **go find it**. Stopping is correct *only* for genuinely missing information that
depends on an opinion the owner holds — not for a document the agent could have fetched. That
matches the skill's own first bucket (*"You haven't finished the work… The response is to do the
work — find the standard, dig, build the model"*). So the writer's behavior in the A-3 run —
shipping a flagged hole — was wrong. But it was also **structurally unable to comply**: it was
ordered to verify every external reference and given no instrument capable of reaching an
authoritative source if Context7 was unavailable.

**Provenance — this defect was introduced during the round-1 remediation (step R2), by the
assistant.** In that same step the assistant explicitly refused to deny `WebFetch`/`WebSearch` to
`expert-architect` and `expert-planner`, reasoning that `expert-plan` Step 4 offers Context7 *or*
direct fetch-and-read and that denying those tools would degrade the agent. The identical clause
exists in `expert-spec` step 3, and the same reasoning was not applied to the spec-writer.

**What to decide:** which documentation instruments each allowlisted agent must hold so that
"go find the information" is actually executable — and whether the same omission affects
`expert-implementer`, `expert-verifier`, and `expert-closeout`, which were given allowlists in the
same step.

### 1b. Corroboration from the run's own artifacts — the reviewer could fetch docs, the writer could not

Found by reading the delivered spec (`scratchpad/e2e/docs/specs/spec-greeter-farewell.md`) against
the round-1 review findings. This is evidence from the artifacts, obtained without probing the
tooling, and it points the same direction as 1a.

- **The writer stated its citations from memory.** The delivered spec cites the Node.js v22.x API
  documentation repeatedly (`LOOKUP_PACKAGE_SCOPE`, *Determining module system → Syntax
  detection*, *Command-line API → Options*) while separately recording *"no documentation-fetch
  tool was reachable from this dispatch"* and *"Stated from knowledge; not re-verified against
  Node.js documentation in this session."*
- **The reviewer fetched live documentation in the same run.** Round 1 falsified the spec's
  module-resolution premise (C-1) citing *"Context7 library `/websites/nodejs_latest-v24_x_api`,
  fetched 2026-07-27"*, and additionally reproduced the behavior by executing Node v22.16.0.

**The asymmetry matches the two agents' tool configurations exactly.** `expert-reviewer` runs on a
**denylist** and therefore inherits the full host MCP surface, including a working Context7.
`expert-spec-writer` runs on an **allowlist** naming only `mcp__plugin_expert-dev-tools_context7`.
One agent verified against current documentation; the other stated from knowledge — which is
precisely the failure mode `expert-spec` step 3 exists to prevent, and which the reviewer then
correctly caught.

This does not by itself prove the plugin-namespaced grant is broken (the writer's claim about its
own tools is still a claim), but it is independent corroboration from a second source, and it
raises the priority of the checks in section 1.

---

## 1c. Proportionality — the volume of verified assertions is itself review surface

Observation from reading the delivered spec. Recorded as a candidate mechanism for the
round-1–3 churn; not established as the cause.

**Scale:** the spec is **386 lines / 32 KB**, specifying a ~6-line function added to an 11-line
file.

**It is not padding.** The length comes from genuine, executed verification work:

- **C-1 (≈48 lines)** — whether `greeter.js` loads as an ES module: an upward walk of **all 11
  filesystem levels** from the project directory to `C:\`, each probed individually for a
  `package.json`; the `LOOKUP_PACKAGE_SCOPE` walk rule; the closed definition of "ambiguous
  input"; and corroboration by executing Node v22.16.0.
- **C-2 (≈28 lines)** — packages reachable by bare specifier: located `C:\Users\maxco\node_modules`,
  counted **204 top-level installed packages** (197 unscoped, 7 scoped, each named), derived from
  `.package-lock.json` (215 keys, 11 nested), and established by search that **no third-party test
  runner** (`jest`, `mocha`, `vitest`, `ava`, `tape`, `jasmine`, `uvu`, `tap`) is present.

Some of this is genuinely load-bearing — "no test runner is installed" directly constrains the
"and a unit test for it" half of the task.

**The candidate mechanism:** every verified fact the spec states is an independently checkable
**claim**. The skill pushes hard for grounding ("Name the specific source"), the writer complies by
asserting dozens of such facts, and each one is something a reviewer can check and find wrong —
which round 1 did, falsifying C-1's module-resolution premise. Under this reading, diligence
directly manufactures review surface, and because the revise path re-runs an authoring skill
(section 2), each round produces a *fresh* set of deeply-investigated claims rather than a
narrowing one. That would account for novel findings each round without requiring any
correction-discipline explanation.

**What this does not establish:** whether the churn is caused by assertion volume, by the rewrite
behavior, by the writer's inability to verify (1a/1b), or by some combination. These are not yet
separated. The reviewers were finding *real* errors, so "too many assertions" cannot be the whole
account.

---

## 2. Related, noticed while reading `expert-spec/SKILL.md` — not yet investigated

These came out of the same read and are recorded so they are not lost. Neither has been acted on.

- **The skill has no revision mode.** It opens *"You are writing a specification"* and contains no
  mention of revising an existing spec, handling review findings, or iterating. On a review round
  the workflow dispatches `Revise the spec at <path> to resolve these findings…` to the
  spec-writer agent, whose first action is to invoke this authoring skill — so the agent re-enters
  the full authoring process (find the need → read context → identify standards → write) rather
  than making targeted corrections.
- **The skill and the workflow both claim ownership of the spec's file path.** The skill's Output
  section instructs the writer to name the file itself (`spec-[kebab-case-name].md`, placed in
  `docs/specs/`). The workflow separately passes a `spec_path` and interpolates it into every
  downstream reviewer dispatch. In the A-3 run these diverged for the entire run: the writer
  produced `docs/specs/spec-greeter-farewell.md` while the workflow told every reviewer to
  *"Review the spec at …/docs/specs/spec-farewell.md"*.

  **Owner ruling (2026-07-28): standardize where artifacts go.** One fixed convention, applied
  without asking. This also disposes of the skill's *"If the project has no docs directory,
  propose a location and get confirmation rather than creating structure silently"* — there is
  nothing to propose and nothing to confirm once the location is standard. Currently there are
  three sources of truth for one filename (the skill's naming rule, the skill's location rule, and
  the workflow's `spec_path`); the standard must leave exactly one.

---

## 3. OWNER RULING — the "flag it once, then do it anyway" clause is invalid

`expert-spec` step 3 currently contains:

> **When the user wants to skip this step** — they want a quick spec, they want to replicate the
> current system's behavior, they don't want to wait for standard research — note what's being
> skipped and what the risk is. … **Flag it once, then write the spec they asked for.** They make
> the final call with full information.

**Owner ruling (2026-07-28): 100% invalid.** Not following the instructions is not an available
option, and the skills must not suggest it is.

**This pattern is not confined to `expert-spec`.** The same construction appears in
`expert-standard` ("When the user says 'just make it work'" — flag the concern once, then do what
they asked). Any sweep should cover every skill in the package, not just the spec skill, so an
agent cannot find permission to skip in one skill after being denied it in another.

**To determine:** the full set of locations carrying this pattern across the nine packaged skills,
and what replaces it — since the clause currently doubles as the guidance for how an agent
responds to owner pressure, removing it leaves that situation unaddressed unless something takes
its place.

**DETERMINED (2026-07-31) — six sites, not two.** Swept all nine packaged skills:

| Skill | Line | What it offers to waive |
|---|---|---|
| `expert-spec` | 163 | standard research before writing requirements |
| `expert-standard` | 40 | whatever "just make it work" covers |
| `expert-review` | 147 | the inventory and premise verification — *"just give me the verdict"* |
| `expert-architecture` | 90 | codebase survey, Context7 verification, structured reasoning |
| `expert-architecture-portable` | 150 | same construction |
| `expert-mcp-overhaul` | 32 | any step — *"your job is to make the trade visible, not to refuse it"* |

Clean: `expert-implement`, `expert-plan`, `frontend-standards`. Every instance ends with a
"don't repeat the flag after acknowledgment" clause, so a waiver is silent thereafter.
`expert-review:147` is the most consequential — it lets the independent gate waive premise
verification, which is the gate's entire function.

**Section 2's location question, DETERMINED — five sources of truth, not three:**
`expert-spec:349`, `expert-architecture:456` and `:458`, `expert-architecture-portable:302`,
`expert-plan:390`, plus `workflows/expert-lifecycle.js:281`
(`input.spec_path || … || 'docs/specs/spec.md'`). The skills name files
`spec-[kebab-case-name].md`; the workflow's fallback is `spec.md`. The two conventions cannot
agree. That is B7's root, in source.

---

## 4. The 24 findings, read from the run journal (2026-07-31)

**Method.** The A-3 run is workflow `wf_f5f5ff93-f13`, under
`~/.claude/projects/C--Users-maxco-Documents-agent-armory/819ec7c6…/subagents/workflows/`.
Fourteen agent transcripts plus `journal.jsonl`. Agent order by timestamp gives the round
mapping: R1 `af32986659fe5d14f`, R2 `a7b7f0b272f9d424b`, R3 `ab671ae6128426040`,
R4 `ae17bbc3a73b389d7`, R5 `a1a27e6d54a51b65e`. Findings extracted from each reviewer's
structured output. Counts 7/6/6/3/2 = 24, matching `behavioral-tier-findings.md`.

### 4a. CONFIRMED — the reviewer grades against the authoring skill, not the spec's own standards

Section 1 listed this as an unproven candidate. It is now evidenced. **All six R3 findings cite
`expert-spec/SKILL.md` clauses** — the source test, "no line describes the document itself",
"File paths and external references are confirmed", the abstraction test, "State version
assumptions explicitly", "Verify against current documentation". R1 is predominantly the same
(SKILL.md 155, 199, 235, 255, 261, 269, 281).

`expert-spec/SKILL.md` is long prose with dozens of quotable clauses. Used as the ruler it is an
**unbounded finding source**: a fresh reviewer can always locate another clause the document does
not perfectly satisfy. This is the same mechanism the APS Fusion architecture cycle recorded over
twenty rounds — "each fresh blinded reviewer added new mechanical scan classes beyond the prior
round's… the verification frontier expanded about as fast as findings closed"
(`mcp-servers/aps-fusion-mcp-server/HANDOFF.md`). Two unrelated projects, one failure mode.

### 4b. CORRECTION — B9's "stall (rounds 4–5)" account is factually wrong

`behavioral-tier-findings.md` states: *"the same two findings appear twice — ISO/IEC/IEEE 29148
'Traceable' (Systemic) and 'Consistent' (Minor), identical in both rounds. The writer received
them and did not fix them across two consecutive rounds."*

**R4 and R5 share no finding.** R4's three: (a) **Serious** — the dispatched review path resolves
to nothing; (b) **Moderate** — `.claude/expert/` is empty, no review record persisted;
(c) **Moderate** — `scratch-note.txt` unaccounted for in the spec. R5's two: **Systemic**
Traceable (quotation fidelity) and **Minor** Consistent (`scratch-note.txt` described as both read
and not-read).

R5's Minor is a **fix-site regression from R4(c)**: the writer added a `scratch-note.txt`
paragraph to close R4(c), and the new paragraph contradicted itself. That is the same regression
class the APS Fusion cycle hit three times — verifying only the half of the record that supports
the edit.

**Consequence: B9c's evidence does not exist.** B9c rests on "rounds 4 and 5 prove a finding can
persist unfixed." No finding persisted. The defect B9c describes may still be real, but this run
does not demonstrate it, and the claim must not be carried forward as observed.

### 4c. CORRECTION — "almost entirely novel each round" is overstated

Recurrence across R1–R3: unstated version assumptions **three times** (R1 Moderate, R2 Moderate,
R3 Moderate); the document describing itself **twice** (R1 Moderate, R3 Systemic-Moderate);
Context7/current-documentation verification **twice** (R1 Serious-Systemic, R3 Minor). The churn
is real but partial — several classes were handed back repeatedly.

### 4d. CORRECTION — B7 was not masked; the machinery caught it

`behavioral-tier-findings.md` says of the path mismatch: *"The reviewers adapted and found the
real file — masking the defect."* R4's **Serious** finding is precisely this defect, raised
explicitly: *"round 4 was dispatched against a path that resolves to nothing."* Evidence recorded:
the dispatched path returned "File does not exist"; the directory holds exactly one entry,
`spec-greeter-farewell.md`. The reviewer surfaced it; nothing downstream consumed it.

### 4e. CONFIRMED — the final blocking finding is documentation-dependent

R5's Systemic finding is ISO 29148 "Traceable" **compounded by quotation fidelity** (Chicago
Manual of Style): matter in quotation marks must reproduce the source's exact words. Its evidence:
the reviewer *"extracted all 10 externally-attributed quotations… fetched all four cited primary
pages from nodejs.org"* and found they do not match.

The writer had no fetch capability (§1, §1a). Reproducing exact wording **requires** fetching, so
the writer was structurally unable to satisfy this finding. Its post-R5 revision shows the
workaround rather than a fix: the delivered spec's Sources table now records that the four pages
were fetched *"in independent review of this specification"* and that every drawn statement
*"appears here in this document's own words"* — all direct quotation eliminated, provenance
attributed to its own reviewer.

**This closes the loop from §1a to the terminal finding.** The Context7 defect is not confined to
rounds 1–3's citation churn; it is implicated in the Systemic finding the run ended on.

### 4f. §1c DETERMINED — verified assertions are the dominant finding surface

Categorising all 24 findings by the section they target:

| Target | Findings | Of which Systemic / Serious-Systemic |
|---|---|---|
| C-1, C-2, C-3, Sources table (the verification-heavy surface) | **10 of 24** | **4 of 5** |
| Requirements and acceptance criteria (FR/NFR/AC) | 5 | 0 |
| Decisions (D-1…D-5) | 3 | 0 |
| Source annotations | 2 | 0 |
| Document-wide / infrastructure | 4 | 1 |

The passages carrying the heaviest verification work — C-1's eleven-level ancestor walk, C-2's
204-package count, the Sources-and-confirmation table — drew ten of twenty-four findings and four
of the five systemic-class ones. §1c's candidate mechanism is **supported**: every verified fact
the spec states is an independently checkable claim, and the more of them it states the larger the
surface a fresh reviewer can falsify.

**But the mechanism is not "verification is bad."** The findings were correct — R1 and R2 falsified
C-1's module-resolution premise, one reviewer by fetching the Node.js pages and another by
executing the runtime. The real shape is §1c **interlocked with §1a**: the writer was required to
assert verified external facts, given no instrument to verify them, and asserted them anyway in
great detail. Unverifiable assertions at high volume is what produced the surface. Restore the
instrument and the volume becomes defensible; leave it broken and volume is actively harmful.

### 4g. B9b CONFIRMED BY BEHAVIOUR — the writer never once patched

`behavioral-tier-findings.md` inferred B9b from the dispatch line ("an authoring skill rewrites; it
does not patch"). Measured across all six spec-writer dispatches in `wf_f5f5ff93-f13`:

| Dispatch | Write | Edit | Read |
|---|---|---|---|
| initial | 2 | **0** | 4 |
| revise 1 | 1 | **0** | 5 |
| revise 2 | 4 | **0** | 25 |
| revise 3 | 1 | **0** | 11 |
| revise 4 | 2 | **0** | 6 |
| revise 5 | 1 | **0** | 14 |

**Eleven `Write` calls, zero `Edit` calls.** Not one targeted correction was attempted in the
entire run. Every revise round replaced the document wholesale.

Combined with §4a this is the convergence failure in one sentence: **each round a freshly rewritten
document meets a fresh reviewer holding an unbounded ruler.** Neither side is stable, so there is
nothing for the loop to converge on. B9b is the more tractable half — a correction discipline that
edits rather than rewrites removes the "freshly rewritten" term without touching the review bar.

---

## 5. Why the ruler varies — determined 2026-07-31

### 5a. The ruler is chosen per round, and the choice predicts the findings exactly

Which files each reviewer read, from the run transcripts:

| Round | Read `expert-spec/SKILL.md` | Findings graded against |
|---|---|---|
| R1 | **yes** | `expert-spec` SKILL.md clauses 155, 199, 235, 255, 261, 269, 281 |
| R2 | no | Node.js v22.x docs, ISO/IEC/IEEE 29148, Feathers, Nygard ADR |
| R3 | **yes** | `expert-spec` SKILL.md — **all six findings** |
| R4 | **yes** | marked first-principles + `commands/expert.md` as named project contract |
| R5 | no | ISO/IEC/IEEE 29148, Chicago Manual of Style |

**The correlation is exact.** Every reviewer that read the authoring skill graded against its
clauses; every reviewer that did not graded against external standards. The effective review
standard therefore **changed between rounds**, and a document that satisfies one round's ruler is
judged by a different one the next.

That is non-convergence by construction, independent of the bar's height. It is not that the bar is
too high — the owner's ruling that the strictness is earned stands untouched. It is that **there is
no single bar**.

### 5b. Nothing instructs this, and nothing prevents it

`expert-review/SKILL.md:111` is explicit: *"The plan, spec, or architecture is the validation
reference, **not the quality standard**. Named external standards judge whether the work is built
right; the upstream contracts judge whether the right thing was built."* The authoring skill was
never intended as the ruler.

The dispatch does not supply one either — `expert-lifecycle.js:330` sends *"Review the spec at
`${specPath}` against the task and named standards"*, delegating the choice.

**The structural cause is that `expert-review` is written for reviewing implementation against
upstream artifacts.** Step 7 ("Verify against the upstream contracts") is the mechanism that binds a
review to something fixed. **A spec is the first artifact in the chain — it has no upstream**, so
Step 7 is vacuous and `SKILL.md:383` reduces it to an attestation. What remains is
`SKILL.md:561`'s requirement that *every* finding name the standard it was evaluated against, with
no statement anywhere of which standards govern a specification.

So the reviewer must name a standard per finding, is told nothing about which, and has a long,
normative-sounding, quotable document — the authoring skill — sitting in the plugin it can read.
Three of five did.

**This generalises beyond the spec gate.** The architecture gate has the spec upstream and the plan
gate has both, so Step 7 binds them. The spec gate is the one with nothing upstream, which is why
it is where the loop stalled — and it is also the first gate, so nothing downstream is ever
reached. The same unbounded-ruler dynamic is what the APS Fusion **architecture** cycle recorded
over twenty rounds, so the exposure is not unique to specs; the spec gate is merely where it is
worst.

---

### 5c. B10 is one instance of a four-gate defect

Every `reviewFn` in `expert-lifecycle.js` delegates the ruler and names none:

| Gate | Line | Dispatch | Upstream named | Standard named | Artifact's own contract named |
|---|---|---|---|---|---|
| spec | 330 | "against the task and named standards" | — (none exists) | no | no |
| architecture | 359 | "against the spec at `${specPath}` and named standards" | yes | no | no |
| plan | 377 | "against the spec and architecture and named standards" | yes | no | **no** ← B10 |
| implementation | 410 | "against the plan at `${planPath}` through the `${lens}` lens" | yes | not mentioned | no |

**B10 should not be tracked as a separate finding.** It is the plan gate's instance of one root
defect: *the review dispatch never names what the artifact is judged against.* The plan's contract
(`expert-plan/references/output-contract.md`) exists and is never cited; likewise no gate cites the
governing standard for its artifact type.

The gates with an upstream artifact are partially protected — `expert-review` Step 7 binds the
review to the upstream as a *validation reference*. The spec gate has no upstream, so nothing binds
it at all, which is why the variance in §5a is worst there and why the loop stalled at the first
gate. Fixing this at one gate and not the others repeats the incomplete-correction pattern that
produced B1 and B6.

### 5d. CLOSED — the remaining load errors are out of scope

`/plugin` surfaced exactly one message: *"MCP server 'context7' skipped — same command/URL as
server provided by plugin 'context7'."* That settles §1. The reload originally reported nine
errors; **owner ruling 2026-07-31: the rest are not relevant** — they concern other plugins. §1's
checklist is closed.

---

## 6. Owner rulings, 2026-07-31

- **On §3 — the clause is deleted, not replaced.** There is no gap to fill. Not following the
  instructions is never an available option, so the question "what should an agent do when the
  owner pushes to skip a step" has no answer to write: it does the work. §3's earlier note that
  removing the clause "leaves that situation unaddressed unless something takes its place" is
  **withdrawn** — it presumed a legitimate skip path exists. All six sites are removals.

- **On §2 — the skill's convention is the standard.** `spec-[kebab-case-name].md` under
  `docs/specs/`, as `expert-spec/SKILL.md:349` states. The workflow does not dictate the path: it
  must consume the agent's returned `PHASE_SCHEMA.artifact_path`, which already exists and is
  simply not read. `expert-lifecycle.js:281`'s `'docs/specs/spec.md'` fallback is removed, and the
  skills' "propose a location and get confirmation" clauses go with it — the location is standard,
  so there is nothing to propose.

---

## 7. The two correction drafts from the run — recovered 2026-07-31

Both are recovered from `wf_f5f5ff93-f13` and neither needs re-deriving.

**Draft 1 — the plan gate's missing output contract.** This is B10, and §5c establishes it is one
instance of a four-gate defect rather than its own item. Remediate at all four gates or repeat the
partial-correction pattern that made B1 and B6 incomplete.

**Draft 2 — the evidence-starved diagnosis dispatch** (diagnostician `a5d7dc351234edbc3`).
Classified `machine_applicable`, with the change specified line-by-line:

- **Root cause:** `expert-lifecycle.js:247-254` defines `diagnose(failureDescription, ledger)` — a
  two-parameter signature with **no channel for the failure record**. Evidence is therefore left to
  ad-hoc string interpolation per call site and is omitted at **five of eight**, in every case where
  the evidence lives in a structured collection: spec non-convergence (335-339) and the shared
  `maybeNonConvergence` helper (487-492) discard `gate.history`; the fabrication catch (424-428)
  discards `vr.checks`; diff-vs-plan (434-437) discards `dvp.checks`; reconciliation (455-458)
  discards `recon.checks`. At 335-339 `lastFindings` is computed **from `gate.history` one line
  after `diagnose()` returns** — for the owner gate, never for the diagnostician.
- **Compounding:** the one input that is passed cannot carry evidence either. `/expert` is the sole
  ledger writer and applies deltas *after* the segment returns, so the segment-start ledger
  predates every failure diagnosed inside it. And `ledger.schema.json:68-87` gives `gate_history`
  entries `findings_count` only — never the findings.
- **Contract divergence, not design defect:** spec F-13 and architecture C3 already mandate
  "failure record + ledger snapshot + journal excerpt". The workflow delivers one of four channels.
  `agents/expert-diagnostician.md:16-20` promises the agent a run-journal excerpt the caller never
  sends.
- **Explicitly out of bounds** per the draft: raising `ROUND_CAP`, softening the binary verdict
  enum, or relaxing A-7. Each weakens the mechanism that caught the failure.

**Consequence not recorded anywhere else — three recorded PASSes are unverified.** The dispatch
defect is common to three of the four A-4 runs, so any A-4a / A-4b result recorded as PASS *on
diagnosis quality* must be treated as unverified until re-run after the fix.

**Note on the diagnostician's own behaviour.** Handed "Spec review did not converge in 5 rounds"
plus a fresh-intake ledger, it **refused to root-cause it**, stating that producing a cause from
that payload would be fabrication. That is the machine working correctly — and it is precisely why
the cause had to be reconstructed by hand from the run transcripts in this session. Repair the
dispatch and the system diagnoses this class itself.
