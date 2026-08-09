> **Reconstructed record.** This file was not written by the round-3 reviewer session.
> It was recovered on 2026-08-08 from the prior session transcript
> `~/.claude/projects/C--Users-maxco-Documents-agent-armory/62bbd33e-5d92-4e16-851f-aa6285e2907a.jsonl`
> (JSONL record 1086, the `plan-reviewer-r3` teammate message), and is reproduced verbatim from
> that message with the transport wrapper removed. Nothing else was added, removed, or reworded.
> Recovery was prompted by round 4 finding F4, which recorded the round-3 record as unreachable
> while the plan cited its findings S-1, S-5 and S-6 as sources.

---

# Plan Review — Round 3 (second post-fix round)

**Artifact:** `C:\Users\maxco\Documents\agent-armory\claude-plugins\expert-dev-tools\docs\plans\plan-expert-dev-tools-behavioral-remediation.md`
**Round:** 3 · **Date:** 2026-07-31 · Independent; dispatched with artifact + prior-round records + input pointers only.

The review was completed in full. Resending as-is.

## Scope and Inventory

**Post-fix inventory, from the four required sources.** (1) Round 2's record states "36 files, all read or grepped" but does not enumerate them; the set was reconstructed from the plan's §5 files-affected table plus the five declared inputs. (2) Fix-diff: the artifact itself (2221 lines), read in full across three paginated reads plus six targeted content greps. (3) Fix-diff dependents: the plan is a document; its consumers are the implementer and the review gate, both represented by the output contract, which is on the inventory. (4) All 13 round-2 findings re-derived from current source as closure items.

| File | Status | Verification |
|---|---|---|
| `docs/plans/plan-expert-dev-tools-behavioral-remediation.md` | [x] | Read 1–856, 856–1555, 1555–2221; re-Read at drafting: 74–91, 152–171, 494–533, 598–667, 1992–2022, 2117–2156 |
| `~/.claude/skills/expert-plan/references/output-contract.md` | [x] | Read in full (83 lines) |
| `docs/reviews/plan-behavioral-remediation-round-01.md` | [x] | Read in full (167 lines) |
| `docs/reviews/plan-behavioral-remediation-round-02.md` | [x] | Read in full (68 lines) |
| `workflows/expert-lifecycle.js` | [x] | Read :1–130, :220–350, :350–493; `wc -l` → 493 |
| `tests/structural/check-structure.mjs` | [x] | Read in full (114 lines) |
| `agents/expert-verifier.md` | [x] | Read in full (32 lines) |
| `agents/expert-diagnostician.md` | [x] | Grep `journal` → 1 hit, `:19` |
| `agents/` (9 files) | [x] | `ls` → 9; grep sweep of 8 schema field names; `grep -rn "one of "` → 2 hits |
| `skills/` (9 dirs) | [x] | `ls` → 9; grep sweep (4 flag-once patterns → 6 hits; 8 schema fields → 0) |
| `skills/expert-architecture/SKILL.md` | [x] | `grep -c "^#"` → 0; `sed -n 66p` → `Output contract` |
| `skills/expert-spec/SKILL.md` | [x] | `sed -n 345p` → `## Output` |
| `skills/expert-implement/SKILL.md` | [x] | `grep -n "^#"` → 12 headings enumerated |
| `commands/expert.md` | [x] | Read `:58–68`, `:94–99`, `:106–119` |
| `scripts/ledger.schema.json` | [x] | Read `:157–171` |
| `docs/specs/spec-expert-dev-tools.md` | [x] | `grep -c "WebFetch\|WebSearch"` → 0 |
| `docs/arch/architecture-expert-dev-tools.md` | [x] | `sed -n 863p`, `sed -n 750p` |
| `.mcp.json` | [x] | Read in full |
| `tests/ACCEPTANCE.md` | [x] | `grep -n "A-8"` → `:90` |
| `tests/fixture/spec/spec-contradictory.md` | [x] | Grep contradiction framing → `:1–27` |
| `docs/behavioral-tier-findings.md` | [x] | Grep B3/B4/B9c → `:127, :220, :231, :268, :276, :306` |
| `docs/investigate.md` | [x] | Grep §5c gate table → `:428` |
| `docs/HANDOFF.md` | [x] | Grep B3/B4/owner-owned → `:66` |
| Plugin root (README absence) | [x] | `find . -iname "readme*"` → 0 results |
| `mcp-servers/aps-fusion-mcp-server/HANDOFF.md` @ `755bf9b`, `cd2f27b` | [x] | `git show <commit>:<path> \| grep -c` → 1 and 1 |
| Context7 `/websites/code_claude` | [x] | "Write subagent files > Supported frontmatter fields"; "Plugin Agent Configuration Markdown", 2026-07-31 |

**Tool plan (Step 3).** Instruments available: Read, Grep, Bash (grep/sed/git/find/wc), Context7, Clear Thought. Mapping — absence claims → grep/`find` over stated scope; literal-content claims → Read or `sed -n Np` at the cited line; library-behavior claims → Context7 `/websites/code_claude`; structural claims → not required (the artifact is prose; the one structural claim in scope, claim 25's zero importers, supports no finding here); prior-document claims (both review records and their disposition columns) → re-derived from current source. CodeGraph was unavailable this session and was needed for no claim, so no halt condition fired.

**Rigor waivers:** none.

## Summary

**This review returns NEEDS FIXES.** The plan's premise work is excellent — I re-executed twelve of its §11 claims against current source and every one reproduced exactly, including all six flag-once line numbers, the seven-field absence sweep, the eight `diagnose()` call-site line numbers, and both `git show` commit pins. Round 2's eight closable findings are genuinely closed. The defects are concentrated almost entirely in the two mechanisms round 2 introduced — **S2b** and **detector (b)** — where the round-2 corrections closed their named sites and were not swept through the schema, the obligation chain, the test specifications, or the restating sections. Three of the seven Serious findings would turn the structural tier red at CP-2 with no authorized remedy, or leave a control inert in production while its test passes green. That is the same failure shape the plan's own D-1 table identifies as dominant, occurring inside the machinery built to detect it.

## Upstream Contract Verification

Governing upstream artifact: `expert-plan/references/output-contract.md`. All sixteen required sections present.

| Contract item | Status | Verification method |
|---|---|---|
| §2 coverage reconciliation maps every requested element | Pass | Read `:50–66`; all 15 element rows carry steps or an approved exclusion |
| §3 is the registry every step's Source points back to | **Fail** | Read `:74–91`; 7 standards invoked in step Gate-3 blocks have no row (SYS-1) |
| §5 lists every created/modified/deleted file | **Fail** | Read `:104–182`; §5 self-contradicts on `EVIDENCE` and `ACCEPTANCE.md` (SYS-1) |
| §7: no step defers a decision | **Fail** | Read `:598–667`, `:344–399`; S6b defers the `class_sweep` shape, S2b defers the parser design (S-2, S-5) |
| §11 every claim carries read-level evidence | Pass (1 stale entry) | 12 of 31 claims independently re-executed; all reproduced. Claim 31 supports a withdrawn design (Mi-1) |
| §12 one specification per test, five fields each | **Fail** | Grep `^\*\*T-[0-9a-z]+ —` → 22 specs; S2b's `T-2b` absent (S-4); T-22's detector-(b) fields describe a rejected design (S-3) |
| §14 every bin-2 entry shows the user's answer and where incorporated | **Fail** | Read `:2090`; Q-12's recorded answer contradicts S22 (S-7) |
| §15 every gap carries attempt evidence | Pass | Read `:2156–2187`; G-1/G-2/G-3 each carry attempt evidence |
| §16 includes `codegraph_diff_surface` | Pass | Read `:2198–2201` |
| **Gate A** — executable without on-the-fly decisions | **Fail** | S-1, S-2, S-5 |
| **Gate B** — compliance auditable from the document | **Fail** | §3 cannot answer "what governs each step" (SYS-1) |
| **Gate C** — final checklist | **Fail** | Deferred decisions (S-2, S-5); self-corrections retained (M-1); bin-2 answer stale (S-7) |

## Critical & Serious Findings

No Critical findings — every defect below is recoverable by editing the plan, and none corrupts state or misroutes the owner at execution time.

### S-1 (Serious, **recurring** — round 2 C-1) — S2b's binding assertion fails against `expert-corrector`, and no step can fix it

**Standard:** Output contract Gate A ("Can an implementer execute this step by step…") and Gate C zero-tolerance.
**Location:** S2b `:363–366`; S5 `:501–511`; §5 `:117`, `:124`.
**What the plan does.** S2b edit 3 instructs: "assert every field the workflow reads from an agent's return appears in that agent's `returns:`, and that `jobs:` equals the count of distinct dispatch labels targeting it." S6b edit 2 (`:618–620`) has the workflow read `out.sections_rederived` from the corrector's return.
**Premise evidence.** Grep `returns:|\`jobs:\`|jobs: ` over the complete plan → 9 hits at `:126, :133, :356, :357, :365, :366, :377, :397, :399, :741` — none adds either key to `agents/expert-corrector.md`. Read of S5's frontmatter block at `:501–511`: complete and `---`-delimited, containing exactly `name`, `description`, `skills`, `tools`, `disallowedTools`. §5's Created table (`:117`) assigns the corrector to S5 only; §5's Modified—agents block (`:124`) explicitly excludes it ("the tenth, `expert-corrector.md`, is under Created").
**Why it matters.** This is the identical defect round 2's C-1 raised against S7's guard, whose stated reason for withdrawal (`:736–741`) was that it "would have failed against `expert-planner`, `expert-implementer`, `expert-reviewer` and `expert-corrector`, none of which any step edits, turning CP-2 and CP-3 red with no authorized remedy." S2b reproduces that outcome for the one agent whose return contract the new detectors consume.
**Correct implementation.** Add `returns:` (naming `status`, `artifact_path`, `sections_rederived`) and `jobs:` to S5's literal frontmatter block, and list `agents/expert-corrector.md` under S2b in §5.

### S-2 (Serious, **regression** — introduced by round 2's detector-(b) rebuild) — detector (b)'s inputs exist in no schema and are obliged by no producer

**Standard:** Output contract Gate C zero-tolerance on deferred decisions; Design by Contract (Meyer), named in the plan's own §3.
**Location:** S6b `:604–613`, `:628–637`, `:657–660`; S5 `:521–524`.
**What the plan does.** S6b part 3(b) makes detector (b) fire on `finding.location ∈ (class_sweep.found ∖ corrected locations)`, requiring the corrector to emit `class_sweep.searched` and `class_sweep.found`.
**Premise evidence.** Grep `class_sweep` over the complete plan → **2 hits, both at `:631` and `:635`, inside S6b's own prose.** The literal `PHASE_SCHEMA` block the step instructs the implementer to insert (Read `:604–613`) declares `properties: { location: S_STR, source: S_STR, finding_addressed: S_STR }` — no `class_sweep`. S6b part 4's three obligation edits (Read `:657–660`) name only "`location` and `source`". S5's corrector return contract (Read `:521–524`) names only `location` and `source`.
**Why it matters.** The implementer is handed a literal schema block, then told two paragraphs later that the items "gain two fields" whose type and nesting are never given, and must invent them. S6b part 4 (`:662–664`) states the exact failure it is reproducing one level down: "Without all three, `lastRederived` is `[]` on every round and **both detectors are inert while their test passes green** — the double supplying the very input whose real-world absence is the defect."
**Correct implementation.** Add `class_sweep: { type: 'object', properties: { searched: S_STR, found: { type: 'array', items: S_STR } } }` to the `sections_rederived` items block, and extend all three of S6b part 4's paired edits to oblige its emission.

### S-3 (Serious, **regression** — introduced by round 2's detector-(b) rebuild) — T-22 specifies the detector-(b) design S6b explicitly rejected

**Standard:** Output contract §12 ("behavior verified, traced to spec requirement or step") and Gate A ("Can a reviewer check a build against this… including whether each test was built to its specification?").
**Location:** T-22 `:2009–2011`, `:2012–2016`, `:2020–2021`; S6b `:639–646`.
**What the plan does.** S6b rejects matching on the `standard` field because "a standard recurring at a new location is the **normal** shape of iterative review, not churn… the detector would have escalated `CORRECTION_FAILED` on a healthy round and stopped a converging gate."
**Premise evidence.** Read of T-22 at `:1992–2022` at drafting time. Its *Technique* (`:2009–2011`) reads "equivalence partitioning for detector (b) — same `standard` at a different location (fires)…"; its *Second executed case* (`:2012–2016`) supplies "the **same** standard at `plan.md:900` — a location the corrector never touched… and **it must fire**"; its *Fails when* (`:2020–2021`) reads "a repeated `standard` at an untouched location does not produce `kind: 'unclosed_class'`". All three describe the rejected rule. The test data supplies no `class_sweep` at all — the remediate stub only "reports re-deriving `plan.md:35-45`" — so under the rebuilt set-membership rule `class_sweep.found` is empty, the set difference is empty, and the case T-22 asserts **must fire** cannot fire.
**Why it matters.** T-22's second executed case is not merely wrong — S6b classifies that exact scenario as the false positive the rebuild exists to eliminate, so building to T-22 reintroduces the defect round 2 removed.
**Correct implementation.** Re-derive T-22's detector-(b) half from S6b's current rule: data supplying `class_sweep.found` with a location the sweep found and the corrector did not correct (fires), a location the sweep never found (does not fire), and a repeated `standard` at a location absent from `class_sweep.found` (does **not** fire).

### S-4 (Serious, **recurring** — round 2 C-1) — S2b has no test specification

**Standard:** Output contract §12 ("Plan-step Verification fields reference these specifications by ID") and Gate C ("Every test specification has all five fields").
**Location:** S2b `:395`; §12 `:1834–2028`.
**Premise evidence.** Grep `T-2b` over the complete plan → **1 hit, `:395`** — the reference itself. Grep `^\*\*T-[0-9a-z]+ —` over §12 → 22 specifications, `T-1` … `T-22`, with no `T-2b`. Cross-checking every step's Verification field against that set: all referenced IDs resolve except `T-2b`, so this is the sole instance of the class, not a sample.
**Why it matters.** Round 2's C-1 named "No test specification" as one of two reasons for withdrawing S7's guard; its replacement carries the same defect. S2b is the plan's largest new mechanism — 10 agent files plus a new structural assertion — and is the class fix for a defect class that has produced findings in two consecutive rounds.
**Correct implementation.** Write a `T-2b` specification with all five fields covering both halves of S2b's assertion, including a must-fail case where an agent's `returns:` omits a field the workflow reads.

### S-5 (Serious, **new**) — S2b's binding assertion is specified at a level the implementer cannot build from

**Standard:** Output contract Gate A and Gate C.
**Location:** S2b `:363–366`, `:360–361`; `tests/structural/check-structure.mjs:78, 88, 91`.
**Premise evidence.** Read of `check-structure.mjs` in full: the file's entire JS-inspection capability is `execFileSync(node --check)` at `:78`, an external linter at `:88`, and one regex `/^export const meta = \{/` at `:91`. It never parses the workflow's contents structurally. Read of `workflows/expert-lifecycle.js:1–130` and `:220–493`: the agent↔schema correspondence exists only inside each `agent()` call's options object (e.g. `:330` pairs `AGENT.reviewer` with `VERDICT_SCHEMA`), and determining which fields the workflow *reads* off a return requires tracking the receiving variable and its property accesses across the file — `out.sections_rederived` (`:618`, planned), `impl.stop_report` (`:394`), `vr.checks` (`:424`), `acc.criteria` (`:446`), `co.core_draft` (`:468`). That is dataflow analysis, not pattern matching.
**Why it matters.** The plan's claim at `:360–361` — "the existing `frontmatter()` parser… reads them with no new parsing machinery" — is true of the *agent* side only and does not reach the *workflow* side, where all the new machinery lives. S15 shows the level the contract expects and this plan can hit: "Implement by matching `diagnose(` occurrences and counting top-level commas in the argument list, skipping the `async function diagnose` declaration."
**Correct implementation.** Specify the oracle concretely — extract each `agent(` call's `{ agentType, schema }` pair by literal match, map schema identifier → declared property names by matching the `const <NAME>_SCHEMA = {` blocks, assert `returns:` ⊇ that property set — or narrow the assertion to the declared-schema surface and say so.

### S-6 (Serious, **recurring** — round 2 S-1 and SYS-2) — detector (a) parses a field that is optional and format-free; round 2's stated remedy was never written into any step

**Standard:** Design by Contract (Meyer), named in the plan's own §3.
**Location:** S6b `:624–626`; `workflows/expert-lifecycle.js:96–112`; §5 `:146`, `:155`.
**Premise evidence.** Read of `workflows/expert-lifecycle.js:96–112` at drafting time: `VERDICT_SCHEMA.findings.items` declares `required: ['classification', 'standard']` and `properties: { classification: S_STR, standard: S_STR, premise_evidence: S_STR, location: S_STR }`. `location` is therefore **optional** and an unconstrained string. Round 2's S-1 disposition states the remedy as "`findings[].location` gains a format obligation in `VERDICT_SCHEMA`, `agents/expert-reviewer.md` and `skills/expert-review/SKILL.md`, all listed in §5." Re-derived from the current plan: grep `location` over the complete plan → 36 hits, none adding a format constraint to `VERDICT_SCHEMA`; §5's workflow row (`:155`) does not list S2b; §5's skills table (`:146`) lists `skills/expert-review/SKILL.md` under S16 only. The plan's `:522` and `:615` both defer to "the same `location` shape reviewers use" — a shape source shows does not exist.
**Why it matters.** S2b's `returns:` mechanism names field *presence*; it cannot constrain field *format*, so it does not subsume this even for `expert-reviewer`. Detector (a) is the plan's primary correction-failure control and the only one with an observed instance behind it (claim 28, the R4→R5 regression).
**Correct implementation.** Make `location` required on `findings.items` with a stated grammar (`path:start-end` or `path#section`), paired with matching statements in `agents/expert-reviewer.md` and `skills/expert-review/SKILL.md`, all three listed in §5.

### S-7 (Serious, **new**) — Q-12's recorded owner answer contradicts the step it points at, and the superseding ruling appears nowhere in the plan

**Standard:** Output contract Gate C ("Every bin-2 entry shows the user's answer and where the plan incorporates it. No bin-2 entry is 'noted' without an answer").
**Location:** Q-12 `:2090`; S22 `:1377–1416`; §14 `:2117–2152`.
**Premise evidence.** Read `:2090` and `:1377–1416` at drafting time. Q-12 reads "**Owner scoped 2026-07-31: surface, do not resolve.** Incorporated as S22 and guarded by T-20"; S22 reads "*Decision.* Resolve both rather than surfacing them." Grep `owner-owned|surface, do not resolve|without deciding|ACCEPTANCE\.md` over the plan → 12 hits; the superseded framing survives at `:19`, `:65`, `:159`, `:164–165`, `:2090`. The authorizing ruling exists only in `docs/reviews/plan-behavioral-remediation-round-02.md:34–39`. Grep `[Rr]ound 2|R2` over the plan → 10 hits, none a round-2 record; §14's "Review rounds" subsection contains a Round 1 block only. `docs/behavioral-tier-findings.md:220` and `:231` independently label B3 and B4 "(Minor, owner-owned)", confirming the original scoping was real and a superseding ruling is required to depart from it.
**Why it matters.** §14 is what the contract calls "the completeness proof of the output contract," and the plan is executing a scope change against a source-document label of "owner-owned" with no recorded authorization anywhere in it.
**Correct implementation.** Rewrite Q-12's disposition to record the round-2 owner ruling with date and reasoning, keeping the superseded answer visible per the register's own convention, and add a Round 2 block to §14 — which the plan itself declares (`:2126`) is "the trajectory baseline the tripwire is computed from."

## Systemic Patterns

### SYS-1 (Systemic, **recurring** — round 1 S-6/M-2, round 2 M-2/M-3) — round-2 corrections were applied at their named sites and not swept through the plan's restating sections

**Proactive scan.** Grep `owner-owned|surface, do not resolve|without deciding|ACCEPTANCE\.md` over the complete plan → **12 hits**; grep `class_sweep` → 2; grep `T-2b` → 1; grep `returns:|\`jobs:\`|jobs: ` → 9; grep `[Rr]ound 2|R2` → 10; Read of `:74–91`, `:152–171`, `:2117–2152`. Instances enumerated:

1. **§1 Goal `:19`** — "surfaces the two owner-owned items without deciding them." S22 decides them.
2. **§2 coverage `:65`** — "(8) B3, B4 owner-owned — surface, do not resolve | S22". S22 resolves both.
3. **§5 `:159`** — "`tests/ACCEPTANCE.md` | **S23 only**". S22 edit 1 (`:1381`) modifies its A-8 section. §23's own Group 2 (`:1446`) contradicts §5 by listing "`tests/ACCEPTANCE.md` (S22)".
4. **§5 `:164–168`** — "**Not modified by S22** — S22's content is the act of *not* changing `tests/ACCEPTANCE.md`'s A-8 section or `workflows/expert-lifecycle.js`'s `EVIDENCE` schema… T-20 asserts the scoped exclusion." Three contradictions in five lines: against §5's own workflow row `:155` ("**S22** (`EVIDENCE` split)"); against S22 `:1381–1388`; and against T-20 `:1986`, which states "*Must NOT assert:* that `tests/ACCEPTANCE.md` and `EVIDENCE` are untouched — S22 now edits both."
5. **§2 coverage table** — no row maps to **S2b**, the plan's largest new step (10 agent files + a structural assertion).
6. **§14 class analysis `:2146`** — "**Twelve findings**, five classes," sitting 26 lines below a header corrected to 13 (`:2120`) and immediately below a 13-row table, enumerating only 11 findings (S-5 and Mi-3 belong to no class). Round 2's M-3 corrected the header and left this.
7. **§3 registry `:74–91`** — seven standards invoked in step Gate-3 blocks have no row: S4's APS-Fusion re-derivation discipline and SRP/SOLID, S6's architecture D6, S8's `expert-review/SKILL.md:111`, S15b's OWASP fail-safe defaults (verified present at `architecture-expert-dev-tools.md:750` but absent from §3), S22's correction doctrine, S2b's generation rule. Three further rows affirmatively mis-scope: Design by Contract → "S14" though S9 rests on it; NIST AC-6 → "S2 and S5" though S20 rests on it; ISO 29148 §5.2.6 → "S10, S11" though S17 rests on it.

**Standard violated.** ISO/IEC/IEEE 29148:2018 §5.2.6 "Consistent" — named in the plan's own §3 — plus the plan's own §7 maintenance rule 3 ("Editing a step re-derives the restating sections; it never patches them") and rule 4 ("A finding in any restating section is a class signal, not an instance").

**Why systemic rather than isolated.** Two structural causes, both inside the plan. First, §7 maintenance rule 3 enumerates the sections to re-derive as "§2, §5, §11, §12 and §14" and D-8 (`:1604–1608`) enumerates the drift surfaces as exactly six — **both omit §3**, which is itself a restating surface (standard → step IDs) and has drifted at ten cells. The plan's own maintenance mechanism structurally cannot catch instance 7. Second, the S22 redesign propagated to six sites and missed five; the §14 count correction propagated to the header and missed the class analysis. That is the "re-derive the section, sweep the class incompletely" row of the plan's own D-1 table — the row D-1 identifies as dominant — occurring in the plan itself.

**Correct implementation.** Re-derive §1's Goal sentence, §2's coverage table (including an S2b row), §5's ACCEPTANCE row and the "Not modified by S22" paragraph, §14's class analysis, and §3's registry from the current 26-step set in one pass; and add §3 to §7 maintenance rule 3's enumeration and to D-8's surface list.

## Moderate & Minor Findings

### M-1 (Moderate, **new**) — drafting-history self-corrections are retained throughout, which Gate C forbids

**Standard:** Output contract Gate C: "No internal reasoning artifacts, self-corrections, or scratchpad content remain in the document" — which names self-corrections as a category distinct from scratchpad content.
**Premise evidence.** Proactive grep (`earlier draft|first draft|prior version|Corrected 2026|Count corrected|Counts corrected|corrected after|re-scored|is \*\*withdrawn\*\*|first attempt|prior framing|An earlier|The first pass`) over the complete plan → **22 hits across 8 of the 16 output sections**: `:224, :385, :532, :639, :734, :736, :891, :1413, :1512, :1523, :1674, :1679, :1694, :1714, :1720, :1723, :1774, :1987, :2081, :2095, :2098, :2104, :2122`.
**Why it matters.** The plan argues the contrary at `:2112–2115` ("a register that hides its own corrections is not an audit trail"), and that reasoning has force. What defeats it is that the convention is applied inconsistently: Q-3, Q-17 and Q-20 carry correction notes while Q-12, §2's row `:65` and §1's Goal `:19` silently retain superseded framing (SYS-1). An audit convention applied to some superseded states and not others produces a document where the reader cannot tell whether an uncorrected passage is current or merely un-swept. Several entries carry no forward value: claim 12's "*the first draft said 494 lines and two occurrences*" tells an implementer nothing and adds one more hand-maintained reference to a state that no longer exists — a seventh drift surface, and the only one the contract does not require.
**Correct implementation.** Move the drafting history into the round records in `docs/reviews/`, which exist for exactly this; keep in the plan only the current state of each decision, claim, and disposition.

### Mi-1 (Minor, **regression** — introduced by round 2's detector-(b) rebuild) — claim 31 verifies a property of the withdrawn detector design

**Standard:** Output contract §11 ("One entry per factual claim the plan depends on"), which the contract calls "the premise-correctness proof."
**Premise evidence.** Read `:1820–1824`: claim 31 asserts "`VERDICT_SCHEMA.findings.items.required` is `['classification', 'standard']`, so `standard` is schema-required and **detector (b) can never read undefined**." Verified true at source (`workflows/expert-lifecycle.js:103–110`). But S6b's rebuilt detector (b) (`:635`) matches on `location` set membership and never reads `standard`; the `standard`-matching rule is explicitly rejected at `:639–646`.
**Correct implementation.** Re-derive claim 31 against the current detectors — that `location` is present and parseable on every finding (requires the S-6 remedy) and that `class_sweep.found` is emitted (requires the S-2 remedy).

## Tentative Findings

No tentative findings — every candidate's premise was verified against current source per Compliance Gate B. One candidate was investigated and **dropped**: that S2b's `returns:`/`jobs:` keys might be rejected by the Claude Code agent loader, since Context7 (`/websites/code_claude`, "Write subagent files > Supported frontmatter fields" and "Plugin Agent Configuration Markdown", read 2026-07-31) enumerates `name`, `description`, `tools`, `disallowedTools`, `model`, `effort`, `maxTurns`, `permissionMode` and not these. Read of `agents/expert-verifier.md:4–5` shows the existing agents already carry an undocumented `skills:` key and they load and dispatch today — sufficient evidence the loader tolerates unrecognized keys. The candidate does not reach finding status.

## Observations

- Round 1's record (`docs/reviews/plan-behavioral-remediation-round-01.md`) retains its own pre-correction count at `:148` ("Disposition — all 12 applied") and `:162` ("**Round 1:** 12 findings") while its header and blockquote were corrected to 13. Round 2's M-3 disposition claims the record was corrected; the correction reached two of four sites. This is context on a prior-round record, not a finding against the artifact under review, and §23 correctly forbids modifying historical records — but a future round computing the trajectory from that file will read 12 in two places.
- `mcp__clear-thought__collaborativereasoning` rejected its first invocation on an input-schema enum violation (`communication.style` / `communication.tone`); it succeeded unmodified in substance on retry. The multi-perspective check ran as specified via the tool, with no disagreements recorded.

## What's Actually Good

- **§11's premise discipline is exact, not approximately exact.** Twelve claims independently re-executed. Claim 18's six flag-once sites reproduced at every named path *and* line number (`expert-architecture:90`, `expert-architecture-portable:150`, `expert-mcp-overhaul:32`, `expert-review:147`, `expert-spec:163`, `expert-standard:40`), with the three skills named clean returning zero across the full nine-skill population. Claim 14's eight `diagnose()` call sites reproduced at `:310, 336, 396, 426, 435, 448, 456, 490`. Claim 12's 493-line count and single `artifact_path` occurrence reproduced. Claim 6's `grep -c` over the spec returned 0. Claim 23's `occurrences[]` required fields reproduced verbatim at `ledger.schema.json:157–171`. Claim 13's sixth path source reproduced verbatim at `commands/expert.md:63–64`. **Standard:** output contract §11 and Gate C ("File paths and function names are confirmed against the current codebase, not assumed").
- **Claim 27 is third-party verifiable by commit, which is the correct class fix for what round 1 killed it over.** `git show 755bf9b:mcp-servers/aps-fusion-mcp-server/HANDOFF.md | grep -c "patch-style corrections"` → 1; `git show cd2f27b:…` contains the replacement trajectory record → 1. **Standard:** output contract §11's evidence requirement plus the §11 citation preamble's own rule that "a claim citing a mutable file by path alone is stale the moment that file is edited."
- **S9's output-contract table is verified per row rather than asserted.** `grep -c "^#"` over `skills/expert-architecture/SKILL.md` → **0** headings, with `sed -n 66p` returning exactly `Output contract`, which is why the plan cites it by line; `sed -n 345p` over `skills/expert-spec/SKILL.md` → `## Output`; `grep -n "^#"` over `skills/expert-implement/SKILL.md` → 12 headings, none an Output section, nearest `## Step 6 — Final report` at `:171`. **Standard:** Design by Contract (Meyer), named in §3 — S9 cites only contracts that exist and scopes out the gate that has none, with Q-21 recording why.

## Convergence Record

**Round:** 3 (second post-fix round).
**Trajectory:** R1 = 13 → R2 = 13 → **R3 = 10**.
**Flow counts, round 3** — closed **8** · new **3** · regressions **3** · recurring **4**.

*Closed (re-derived from current source this round, not accepted from round 2's disposition column):* R2 S-2 (detector (b)'s match rule now defined as set membership, `:635`); R2 S-3 (S9 cites literal verified paths; Q-21 records the implementation-gate exclusion; T-8's fail condition covers both halves at `:1898–1901`); R2 S-4 (claim 13 re-derived to six sources, precedence inverted at `:877–881`, command defaults clause targeted); R2 M-1 (`grep -c` over the spec → 0); R2 M-4 (`codegraph_find_related_docs` run at plan time, 3 + 9 + 11 = 23, no wildcard row); R2 Mi-1 (rule 2's §12 clause withdrawn, `:224–230`); R2 Mi-2 (Q-20 reads `CORRECTION_FAILED`, `:2098`); R2 Mi-3 (S18's Verification names T-16 **and** T-17, `:1282–1283`).

*Not closed:* R2 C-1 (recurs as S-1 and S-4); R2 SYS-2 and R2 S-1 (both recur as S-6); R2 M-2 (recurs in SYS-1); R2 M-3 (recurs in SYS-1).

**Tripwire evaluation — NOT FIRED. Both conditions disarmed this round.**
- *(a) new + regression ≥ closed:* 3 + 3 = **6**; closed = **8**. 6 ≥ 8 is **false** → does not hold. Consecutive count resets from 1 to **0**.
- *(b) total not strictly decreasing:* 13 → **10** is a strict decrease → does not hold. Consecutive count resets from 1 to **0**.

**Severity trajectory:** R1 had 1 Critical and 6 Serious; R2 had 1 Critical and 4 Serious; R3 has **0 Critical** and 7 Serious. The Critical class is gone and the total fell for the first time.

**Countervailing signal.** Six of this round's ten findings sit inside S2b and detector (b) — the two mechanisms round 2 introduced — and three are regressions the rebuild created. The cycle is closing old defects at a good rate while manufacturing new ones in its newest machinery. That meets neither tripwire condition and does not warrant foundational rework, but if round 4's findings again concentrate in whatever round 3 introduces, the arithmetic will change.

## Recommended Priority

The tripwire did not fire, so another fix round is the indicated path, not foundational rework.

1. **S-1, S-2, S-6 first — the three that leave a control broken or inert.** S-1 turns CP-2 red with no authorized remedy; S-2 and S-6 leave both detectors unable to fire in production while T-22 passes green. Shipping them non-functional reproduces the exact defect the plan exists to remove.
2. **S-3 and S-4 next — the verification layer for those controls.** S-3 currently instructs the implementer to build the false positive round 2 removed; S-4 leaves the largest new step untested. Fix with 1, since the correct tests are derivable only from the corrected designs.
3. **S-5 and S-7 — executability and authorization.**
4. **SYS-1 last, but as a class.** Re-derive all seven restating surfaces in one pass from the current step set, and add §3 to maintenance rule 3's enumeration and to D-8's surface list. Per the plan's own rule 4, fixing the seven named instances without closing the class is the failure mode this project has now recorded three times.
5. **M-1 and Mi-1** are cheap and can ride along with 4.

One structural note for whoever applies these: the plan's own §7 maintenance rule 3 requires that editing a step re-derives the restating sections rather than patching them. Six of this round's ten findings exist because that rule was not followed after round 2. Applying these fixes by locating and amending the lines this review names — rather than re-deriving each section from the corrected step set — will produce round 4's findings the same way.

Verdict: NEEDS FIXES (10 findings: 1 Systemic, 7 Serious, 1 Moderate, 1 Minor)
