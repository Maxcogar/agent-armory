# Expert Review — Architecture, Context Oracle · Round 4 (Post-fix)

**Skill file loaded:** `/root/.claude/skills/expert-review/SKILL.md` — `Version: R1.2 (2026-07-18)`
**Artifact:** `middleware/context-oracle/docs/architecture-context-oracle.md` (3,007 lines, design-document review; no code exists)
**Round:** 4 (third Post-fix round). Fix commits under review: `2ec8804`, `f7ae987`, `b5ebe9c`, `a506f35`.
**Date:** 2026-07-31

---

## Scope and Inventory

### Methodology overrides applied (recorded, at the project owner's direction)

Two overrides were given, both raising the bar. Both were applied as written.

1. **Grep is not verification. Search locates; reading verifies.** SKILL.md Step 2's
   "Grep-verified" check-off, Step 6's grep-for-absence, and Gate B's grep-evidence
   requirement are **not** followed as written in this pass. Every absence claim and
   every completeness claim below was established by **reading the region**, cited by
   `file:line`. Where a grep was used, it was used to *locate* candidate regions,
   and the finding states so explicitly ("located by grep, established by reading
   `file:lines`"). The demonstration the owner supplied holds: a grep for
   `only relevance metric` against `RETHINK.md` returns zero hits, while the sentence
   *"Marginal value over the agent's own abilities is the only relevance metric that
   matters"* is verbatim at **RETHINK.md:58–59**, wrapping a line break — Read this
   session, and it is the standard R4-4 is judged against.
2. **Tool availability determined independently.** Nothing was assumed about the
   instrument roster. It was searched, attempted, and recorded — see the tool plan.

No rigor was waived. Both overrides increase the verification burden; neither reduces it.

### Round accounting and the artifact actually reviewed

Round numbering follows `docs/reviews/README.md` (Read this session): rounds count
passes over the *current* artifact, rebuilt 2026-07-22. This is the third Post-fix
round. The four prior review files exist in full and were used as closure sources —
`2026-07-30-round-2-expert-review.md` (10 findings), `2026-07-30-round-2-collapse-hunt.md`
(9), `2026-07-30-round-3-expert-review.md` (14), `2026-07-30-round-3-collapse-hunt.md` (15).

### File inventory (Step 2 post-fix rule — all four sources)

**Source 1 — the prior review's full inventory.**

- [x] `docs/architecture-context-oracle.md` — **Read in full**, 1–3007, in seven
      contiguous passes (1–400, 400–850, 850–1300, 1300–1750, 1750–2200, 2200–2649,
      2649–3007). Every finding below cites the lines it rests on.
- [x] `docs/specs/spec-context-oracle.md` — Read: §13 acceptance criteria in full
      (856–945), FR-A2 genre table (405–426), FR-K2 (355–375), §14 opening (946–949),
      section index (Read via header enumeration). AC identifier set established by
      reading §13 end to end: **AC-1 … AC-22, no suffixed identifiers**.
- [x] `RETHINK.md` — Read 55–62 for the §2.3 relevance-metric sentence (the standard
      for R4-4). Not read in full; recorded as a scope limit below.
- [x] `CLAUDE.md` (project, auto-loaded) — Read in full; the run-it rule, the
      collapse-test rule and the apply-all-findings rule are cited as standards below.
- [x] `docs/collapse-log.md` — Read 60–75, 190–215 (F1/OWNER-12 entry) for R3-11 closure.
- [x] `docs/STATUS.md` — Read 1–60 for the owner-facing restatement of Spike 1.
- [x] `docs/reviews/README.md` — Read 1–39 (round-numbering and provenance rules).
- [x] `docs/IDEAS.md` — **not re-read this round.** Recorded as a scope limit; no
      finding below rests on it.
- [x] `docs/judgment-layer-corrected-foundation.md` — **not re-read this round.**
      Recorded as a scope limit, carried forward from round 3's identical limit; no
      finding below rests on it.

**Source 2 — every file in the fix diff.** `git diff --stat f8216c2..a506f35`, run
this session, returns exactly four files:

- [x] `docs/architecture-context-oracle.md` (+380/−…) — Read in full, above.
- [x] `docs/STATUS.md` — Read 1–60.
- [x] `docs/collapse-log.md` — Read at the F1 entry.
- [x] `docs/reviews/2026-07-30-round-3-expert-review.md` (added by the diff) — Read
      in full at the findings, Convergence Record, Closure Ledger and Recommended
      Priority sections (11–557 across three passes).

**Source 3 — dependents of the fix-diff files.** No structural graph tool is
available (see tool plan) and the artifact is prose, not code, so dependents were
established by reading the artifact's own cross-reference targets. The dependent set
is the set of decisions and sections the changed text names: **D5, D6, D7, D10, D10a,
D11, D12, D13, D14, D15, D17, D18, D20, D21, D24, D26, the threat model T1/T4, the
ASVS mapping, the build order, the traceability matrix, the Limitations section, and
the Self-verification record.** All were Read at the cited lines. That traversal is
what produced R4-1 through R4-6 and R4-9.

**Source 4 — prior findings as closure items.** Round 3's 14 expert-review findings
and the six round-3 collapse-hunt items whose subject matter the fixes touched (C1,
C7, C8, C9, C12, C15) were each re-derived from current source. The Closure Ledger
below records the verification method per item. The remaining nine round-3
collapse-hunt items were not systematically re-derived — recorded as a scope limit.

### Step 3 tool plan

**Instruments enumerated by search and attempt, not assumption.**

| Claim type | Required instrument | Availability, as observed |
|---|---|---|
| Literal-content claims ("line N says Z") | Read at file:line | **Available**, used for every such claim |
| Absence / completeness claims | Read of the whole region (override 1) | **Available**; grep used only to locate |
| Behavioral claims about the shipped CLI command | Execution of the design's own command | **Available** — `which claude` → `/opt/node22/bin/claude`; `claude --version` → **2.1.220**; `node --version` → **v22.22.2**; `git --version` → 2.43.0; environment has `CLAUDE_CODE_PROVIDER_MANAGED_BY_HOST`, `CLAUDE_CODE_REMOTE`, and **no `ANTHROPIC_API_KEY`** (checked by enumerating `CLAUDE*`/`ANTHROPIC*` env names). 26 live invocations run. |
| Repo-identity premises | Execution of the design's own git commands | **Available**, run on `Maxcogar/agent-armory` |
| Library-behavior claims | Context7 | **Available but not required** — no finding below rests on third-party library behavior; the CLI claims were established by executing the CLI itself, which is stronger. |
| Structural / blast-radius claims | CodeGraph | **Not available** (searched; absent from the roster). **Disposition: no halt.** The artifact is a design document with no code; the blast-radius question is "which decisions cite this text", answered by reading the cross-reference targets. No claim category is stranded. |
| Structured reasoning | Clear Thought MCP (`metacognitivemonitoring`, `collaborativereasoning`) | **Not available** — searched the deferred-tool roster; the only MCP servers present are CORE Memory, Context7, GitHub, Asana and Claude Code Remote. **Disposition:** both mandatory invocations performed manually with the same personas, per SKILL.md's documented fallback; recorded as a procedural observation. |

**Live re-derivation performed (override 2 + Step 6's "run the command the design ships,
flags and all").** 26 invocations of D11's command block as written at arch:1407–1414,
with a real judgment payload, a real inline verdict schema, a fresh `--session-id` per
run, and `CLAUDE_CODE_*` scrubbed per D11's recursion guard. Configurations and counts
are stated inside R4-7 and R4-8 rather than summarized here, so each finding carries its
own evidence.

### Scope limits (recorded so the gaps are auditable)

1. `RETHINK.md` read only at §2.3 (55–62). Every RETHINK-derived standard below is
   that one sentence, Read verbatim.
2. `docs/IDEAS.md` and `docs/judgment-layer-corrected-foundation.md` not re-read.
   No finding rests on either.
3. Nine of round 3's fifteen collapse-hunt items not systematically re-derived (the
   six whose subject matter the fixes touched were). The Convergence Record's flow
   counts are taken over round 3's **expert-review** finding set, consistently with
   rounds 2 and 3, and this is stated in the arithmetic.
4. **A concurrent sibling pass exists.** A grep run for cross-reference targets
   incidentally returned two lines from
   `docs/reviews/2026-07-30-round-4-collapse-hunt.md` — a file that did not exist when
   this pass began its inventory. It was **not read**, deliberately: the project's own
   independence rule (`CLAUDE.md`, "the collapse-hunt is adversarial and independent …
   a different axis") and SKILL.md Step 6's prior-document rule both make importing its
   candidates a defect. Every finding below was derived before and independently of
   that exposure; the two lines seen concerned AC-20 and a Phase 0 exit list, and R4-16
   (which touches AC-20) was derived from reading spec:934–936 against arch:1973–1978,
   not from it.

---

## Summary

**This review returns NEEDS FIXES.** Sixteen findings: eight Serious, one Systemic,
five Moderate, two Minor. Eleven of round 3's fourteen findings are genuinely closed
against their originally named standards, and the closures are real — D5's
repo-identity evidence re-derives on this repository *exactly*, `stop_hook_active`
and the continuation accounting now exist end to end, and `--tools ""` is empirically
the correct control. But **D10a — the genre pipeline table, the artifact built this
round specifically to stop defects living at the joints between decisions — is itself
the largest single source of joint defects in the document.** Six of its cells assert
a store table, a pointer shape, a durability class, a lane, or a build status that the
decision named in the cell does not carry, and in one case asserts the opposite of it.
Separately, the two evidence blocks round 3 sent back for re-running were re-run
against a configuration the design does not ship: re-derivation by execution of D11's
own command shows the corrected Spike 1 mechanism does not hold under the shipped
flags (10/10 successes where the document certifies 10/10 failures), and the 30 s kill
timeout is exceeded by 2 of 10 timed runs of the shipped command. The systemic pattern —
load-bearing claims certified without the check being run — is on its **fifth
consecutive round**, and this round it has taken a third form: cross-references to
sections that do not carry what is cited.

---

## Upstream Contract Verification

The upstream artifacts are the spec (`docs/specs/spec-context-oracle.md`) and the
owner-locked decisions (`RETHINK.md` §12 + addendum, surfaced through `CLAUDE.md`).
Both exist, so no attestation of absence applies.

### Spec acceptance criteria (§13, Read in full at spec:856–945)

| AC | Status | Verification method |
|---|---|---|
| AC-1 coupling ratio + git pointer | **Fail** | Read arch:1333, 2156. The whisper must carry "a git-history pointer"; D10a binds Coupling's grounding pointer to a **commit hash** that `cochange_file_pairs` (Read arch:813–814) has no column for and D17 (Read arch:2148–2149) refuses to store. → **R4-6** |
| AC-2 silence ≤10% | Pass | Read arch:885, 1311, 2473 — replay fixture named in D26, silence rate measured. |
| AC-3 no deny + widened continuation | Pass | Read arch:2479–2482 against spec:867–876. `stop_hook_active: true` → silence and the one-continuation bound are both asserted. |
| AC-4 pristine tree | Pass | Read arch:2314–2319, 387–399 (the per-hook `timeout` byte is included in AC-4's accounting and `deinit`'s removal set). |
| AC-5 warning not block | Pass | Read arch:1810–1814, 1882. |
| AC-6 provenance resolves | **Fail** | Read arch:1613–1618 (Move C requires the pointer resolve) against arch:1333, 1337 (commit-hash pointers) and arch:830 (`open_questions` has no provenance columns). Two genres cannot satisfy it. → **R4-6**, **R4-12** |
| AC-7 injection | Pass | Read arch:2483–2485, 1681–1704 — the carrier with the flagger configured to miss is specified. |
| AC-8 zero ceremony | Pass | Read arch:2320–2323, 2337. |
| AC-9 false-fire learning | Pass | Read arch:2314, 2711. |
| AC-10 degraded mode | Pass | Read arch:2226–2233, 2718–2723. |
| AC-11 recursion guard | Pass | Read arch:2486–2489 — the fixture now cites D11's command block by reference. |
| AC-12 secrets | Pass | Read arch:2192–2197, 2690–2693. |
| AC-13 trust origin | Pass | Read arch:842–845. |
| AC-14 locality | Pass | Read arch:2485, 2632–2637. |
| AC-15 export round-trip | Pass | Read arch:782, 2712. |
| AC-16 attention discipline | Pass | Read arch:2474, 1044–1058. |
| AC-17 staleness | Pass | Read arch:2474, 2742. |
| AC-18 self-detection | Pass | Read arch:2266–2286, 2491–2492. |
| AC-19 process conformance | **Fail** | Read arch:1573–1576 — the Process genre's grounding facts are not in Move A1's retrieval enumeration, so the model cannot bind a claim to them. → **R4-2** |
| AC-20 answer drift, question **verbatim** | **Fail** | Read spec:934–936 (*"whispers the open question verbatim with its location"*) against arch:1973–1978 (*"does not … re-quote the question as if the agent lacked it"*). → **R4-16**; and the fact is unbindable → **R4-12** |
| AC-21 subagent delivery | Pass | Read arch:2034–2036, 2489–2490. |
| AC-22 self-report | Pass | Read arch:2288–2289, 2712. |

**Architecture-invented criteria.** AC-11a, AC-16a and AC-21a appear nowhere in the
spec — established by reading §13 end to end (spec:856–945), whose identifier set is
AC-1…AC-22 with no suffixed forms. Their disposition inside the architecture is a
finding in its own right → **R4-9 instance 9**.

### Owner-locked decisions and project hard rules

| Contract | Status | Verification method |
|---|---|---|
| No gates / no deny path (OWNER-3, P2) | Honored | Read arch:986–989 — the shim response type carries no decision fields. |
| No separate credentials (OWNER-7) | Honored | Read arch:1457–1470; re-derived by execution — 26 invocations succeeded with no `ANTHROPIC_API_KEY` present in the environment. |
| No writes in the repo tree except `init` wiring (P8) | Honored | Read arch:2314–2319. |
| No compiled context package / no agent ritual (P3) | Honored | Read arch:550–551, 2320–2323. |
| OWNER-12: Stop-time whispers, bounded to one continuation | Honored | Read arch:942–952, 1060–1076, 826, 2276–2281. This is round 3's Critical, genuinely closed. |
| OWNER-9: conduct genres enabled by default | Honored in posture, **violated in buildability** | Read arch:1910–1923 (posture) against arch:1573–1576, 1940–1946, 2384–2399. → **R4-1**, **R4-2**, **R4-3** |
| `CLAUDE.md`: never claim something works without having run it | **Violated** | Re-derived by execution — see R4-7, R4-8. |
| `CLAUDE.md`: apply *all* findings from a review | **Violated** | R3-2's directed fix ("fill the matrix's missing cell") was not applied; R3-13's timeout basis was restated rather than re-measured. Read arch:115–118, 168–177, 1421–1426 against the round-3 review's Recommended Priority items 3 and 9. |

---

## Critical & Serious Findings

### R4-1 — SERIOUS (recurring). The session-evidence pointer has two incompatible shapes; the decision that owns the fact class still carries the wrong one

**What the document does now.** D6's schema comment, Read at arch:793–796, states the
rule: `prov_ref` form `'transcript:<session>:<from>..<to>?predicate=…'`, and — verbatim
— *"A NEGATIVE claim's pointer is the bounded re-runnable scan, never a point offset —
re-reading one offset shows what IS there, not what is absent."* D10a's Process row,
Read at arch:1344, matches it: grounding pointer *"**bounded transcript scan** (never a
point offset)"*. **D14, the decision that creates the session-evidence fact class, still
specifies the opposite.** Read at arch:1940–1946: *"`prov_kind='session'`,
`prov_ref='transcript:<session>:<offset>'`, `trust='mechanical'`, with a resolver that
**re-reads that transcript offset**. The pointer is checkable in P4's sense."*

**How that claim was verified.** Located by grep for `session_evidence` and `prov_ref`;
**established by reading** arch:786–845 (D6's full schema block, including the comment)
and arch:1926–1971 (D14's three changes, in full). Both regions read this session at
finding-drafting time. The two texts are 1,150 lines apart and neither cites the other.

**Which standard it violates and why.** ISO/IEC/IEEE 42010 requires an architecture
description to be internally consistent and to record correspondences between its
elements; two decisions specifying incompatible representations of one artifact is the
canonical inconsistency it names. The document states the same rule itself, at
arch:1826–1831: *"Two rules for one behaviour in adjacent decisions is a defect on its
own: an implementer picks one, and whichever they pick, the choice is unreviewable."*
The consequence is not cosmetic. Process's load-bearing claim is *"no matching tool call
observed"* — an **absence**. A point-offset resolver cannot verify an absence, which is
exactly why D6's comment forbids it. An implementer building D14's resolver ships a
Process genre whose pointer does not check the claim, and P4 ("every whisper carries a
verifiable pointer") is false for the owner's own requested genre.

**What correct implementation looks like.** Delete the point-offset form from D14 and
replace it with the bounded-scan form D6 now carries, including the resolver contract
(*re-run the bounded scan over `[from,to]` with `predicate`, assert zero matches*).
State once, in D6 beside the `prov_kind` CHECK, that this governs every negative fact
class, and have D14 cite it rather than restate it — a restatement is what drifted.

**Provenance: recurring.** Round 3's collapse-hunt C7 (Read
`2026-07-30-round-3-collapse-hunt.md`:515–546) named this exact defect at this exact
location, against P4. The fix was applied to D6 and to the new D10a and not to D14.

---

### R4-2 — SERIOUS (recurring). The Process genre's facts never reach the model, so D10a's Lane-2 cell asserts a pipeline the owning decision cannot execute

**What the document does now.** D10a's Process row, Read at arch:1344, places Process in
**Lane 2** with store sources `skill_expectations` and `session_evidence`. D12 Move A1,
Read at arch:1573–1576, enumerates what deterministic retrieval assembles into the
grounded fact set: *"FTS + co-change + exemplars + landmines/invariants + open questions,
shaped by A0 where used"*. Neither `skill_expectations` nor `session_evidence` is in that
enumeration. D12 Move B, Read at arch:1605–1609, permits binding **only** to supplied
facts: *"every claim sentence must carry a `grounding_id` naming a supplied fact"*.

**How that claim was verified.** Located by grep for `skill_expectations` and
`session_evidence`, which return exactly three and two hits respectively across the whole
document (arch:831, 1344, 1947 and arch:834, 1344) — but the absence claim is
**established by reading** D12 in full at arch:1552–1806, including Move A0, Move A1,
Move B and Move C. The enumeration at 1573–1576 is the only retrieval specification in
the decision, and it is closed-form.

**Which standard it violates and why.** The governing standard is the spec's own
AC-19 (spec:929–933), which requires a Process whisper *"naming the skipped step with a
pointer to the governing skill line"* — an acceptance criterion the architecture must
make mechanically satisfiable, which is D26's stated contract (arch:2497–2499: *"Spec
§13's ACs are the governing contract — each is a named fixture"*). It is unsatisfiable
as written: a Lane 2 genre whose facts are never retrieved produces a verdict with no
bindable `grounding_id`, and Move C drops the whole whisper. This is the same structural
preclusion that round 1 found for the `Unknown` genre and round 2 found for the conduct
genres — the third recurrence of one shape.

**What correct implementation looks like.** Extend Move A1's enumeration to name
`skill_expectations` and `session_evidence`, with the retrieval predicate stated (for
this consumer, registered before the completion claim, unsatisfied). Because that
enumeration is the step that decides what the model may see, state the addition there
rather than in D14 — D14 asserting that D12 retrieves them is the exact shape R3-5
found and this finding repeats.

**Provenance: recurring.** Round 3's collapse-hunt C8 (Read
`2026-07-30-round-3-collapse-hunt.md`:547–575) named this against the same
supplied-facts rule. The round-3 fixes built the table (`skill_expectations` now exists
in D6, closing R3-5) and left the enumeration untouched.

---

### R4-3 — SERIOUS (recurring). D10a asserts "durable" for every genre; D24 classifies neither the conduct genres' grounding writes nor candidate persistence

**What the document does now.** D10a's Durability column, Read at arch:1331–1345, reads
`durable` in all thirteen rows. D24, Read at arch:2365–2399, defines exactly two write
classes and enumerates their members:

- Event-path writes enumerated at arch:2368–2372: *"session_log, whisper_log, Tier-3
  flushes, suppressions, candidate persistence"*.
- **Durable class** at arch:2384: *"the whisper audit record (FR-X6) and `suppressions`
  (FR-L3)"* — two members.
- **Disposable class** at arch:2397: *"`session_log` candidate traces, Tier-3 flushes"* —
  two members. *"May be dropped on contention beyond `busy_timeout` with a diagnostic."*

`skill_expectations`, `session_evidence` and `open_questions` — written by the narration
reader on the event path (D14 change 2, Read at arch:1947–1951) — appear in neither
class, and neither does `candidate persistence`, which is enumerated as an event-path
write and then classified nowhere.

**How that claim was verified.** **Established by reading** D24 in full (arch:2363–2444)
and D6's schema block in full (arch:786–845); the class memberships above are quoted
from the read, not inferred. Grep was used only to confirm that `skill_expectations` and
`session_evidence` appear nowhere in D24's line range.

**Which standard it violates and why.** The standard is D10a's own maintenance rule,
arch:1395–1400: *"Any change that adds or alters a fact class, a store table, a bar
factor, a trigger, or a genre updates this table first, and the change is not 'applied'
until every one of its cells is filled and the row has been walked end to end."* A cell
filled with a value the owning decision does not carry is worse than a blank cell,
because the blank is a build-time error by that same rule and the wrong value is not.
The consequence is concrete: if the conduct genres' grounding writes fall to the
disposable class by default — which is where an implementer reading D24's two named
durable members will put them — a dropped `session_evidence` write leaves the Process
whisper's `grounding_id` dangling, and Move C (arch:1613–1618) drops the whole whisper.
The genre then fails **silently and intermittently under load**, which is the failure
signature D10 step 9 and D21 exist to make impossible.

**What correct implementation looks like.** Classify every event-path write class
explicitly in D24, including `candidate persistence`, and put the conduct genres'
grounding facts in the durable class with the same logged-before-used ordering D24
already applies to the audit record — a grounding fact that may vanish before its
whisper is delivered is not a grounding fact. Then re-derive D10a's Durability column
from D24 rather than asserting it.

**Provenance: recurring.** Round 3's collapse-hunt C9 (Read
`2026-07-30-round-3-collapse-hunt.md`:576–607) named this against FR-X6/P4. The round-3
fixes added the column and filled it with the answer the finding said was wrong.

---

### R4-4 — SERIOUS (recurring). D20 still deletes `self_serve_cost` from the bar, so Phase 0 ships the bar round 2 collapsed

**What the document does now.** D10 step 5a, Read at arch:1092, fixes the bar:
**`decision-impact` = `materiality × structural_weight × self_serve_cost`**, and
arch:1093–1094 states `self_serve_cost` is *"deterministic and derived from the fact's
own provenance class plus what this consumer has already done"* — no model input. D10
step 5, Read at arch:1052–1054, adds that for the mechanical Lane 1 genres *"`materiality`
defaults to the genre's base weight, so degraded mode still ranks"*. **D20 contradicts
both.** Read at arch:2236–2238: *"its restraint is the **raised-bar rarity knob** keyed
to file structure, and `decision-impact` (D10) falls back to `structural_weight` alone."*

**How that claim was verified.** **Established by reading** D10 step 5 and 5a in full
(arch:1042–1169) and D20 in full (arch:2216–2255), both at drafting time. The two
sentences are quoted verbatim above.

**Which standard it violates and why.** The named standard is **RETHINK §2.3**, Read
verbatim at RETHINK.md:58–59: *"Marginal value over the agent's own abilities is the only
relevance metric that matters."* `self_serve_cost` is the only term in the bar that
measures it — D10 step 5a says so explicitly at arch:1080–1084. D20 removes it for
degraded mode, and degraded mode **is** Phase 0: D20 itself says so at arch:2234
(*"do not overclaim Phase 0"*) and the build order confirms it at arch:2700–2703, where
Lane 1 is complete and the model client does not yet exist. So the product the owner
runs first, for months, ships with a bar that has no term for whether the agent could
have got the fact in one tool call — and step 5a names the resulting output verbatim at
arch:1088–1090: *"there is a helper for the symbol you just grepped for"*, which RETHINK
§2.3 calls the noise that *"crowds out the signal"*. This also makes D10a's entire
`self_serve_class` column inert for the seven Lane 1 rows, which are precisely the rows
Phase 0 delivers.

**What correct implementation looks like.** State the formula once, in D10 step 5a, as
invariant across modes: only `materiality` degrades (to the genre's base weight) when no
model path exists; `structural_weight` and `self_serve_cost` are deterministic and apply
in both modes. Rewrite D20's sentence to say that, and run AC-16a's grepped-symbol
fixture in degraded mode as well as model mode — degraded mode is where the failure it
tests actually ships.

**Provenance: recurring.** Round 3's collapse-hunt C1 (Read
`2026-07-30-round-3-collapse-hunt.md`:259–291) named this against RETHINK §2.3 and
supplied the fix text. D20's sentence is unchanged.

---

### R4-5 — SERIOUS (regression, introduced by the D10a fix). The Orientation row asserts "no v1 writer (D18)"; D18 names two v1 writers, one of them built explicitly for Orientation

**What the document does now.** D10a's Orientation row, Read at arch:1339, gives its
store source as *"entry points + `landmines`/`invariants` — **no v1 writer (D18)**"* and
marks the row ⛔ *known-unbuildable*. Note 1, Read at arch:1353–1357, elaborates:
*"**Orientation ships structural-only in v1**, with its landmine and invariant arms dark
until D18's mining lands."* **D18 states the opposite.** Read at arch:2160–2166:
*"v1's only writers are: `human_facts` promotion (FR-L6 — a human statement naming a
landmine/invariant recorded with human provenance immediately) and **the literal-match
landmine path for orientation (FR-J3's degraded set needs literal-match landmines)**."*

**How that claim was verified.** **Established by reading** D18 in full (arch:2158–2179)
and D10a in full (arch:1313–1400). Corroborated by reading D10 step 4's Lane 1
enumeration at arch:1032–1033, which lists *"prompt → structural entry points + **literal
landmine matches** (orientation)"* — a third place stating that Orientation's landmine arm
ships in Lane 1, i.e. in Phase 0.

**Which standard it violates and why.** ISO/IEC/IEEE 42010's consistency requirement
again, and here the inconsistency is an inversion rather than a divergence: the cell
asserts the negation of what its cited decision says. The consequence runs the wrong way
for the project. D18's literal-match landmine path exists *because* FR-J3's degraded set
needs it — that is the sentence's stated reason — so D10a darkens the one Orientation arm
that Phase 0 depends on, and note 1's "dark until D18's mining lands" defers to Phase 2 a
writer D18 assigns to Phase 0. An implementer following D10a's maintenance rule
("traversed, not inspected") descopes a Phase 0 capability on the authority of a cell
that contradicts its own citation.

**What correct implementation looks like.** Correct the Orientation row: the landmine arm
has a v1 writer (literal-match, D18) and the invariant arm has one (`human_facts`
promotion, FR-L6); what is Phase 2 is *automated mining*, which is a different claim.
Remove the ⛔ from the landmine arm, keep it on automated-mining content only, and correct
note 1's "dark until D18's mining lands". Then re-check the interaction with R4-4: with
`self_serve_cost` restored in degraded mode, the landmine arm is the Orientation content
that clears the bar, and the structural arm is the content that does not.

**Provenance: regression.** D10a did not exist before `f7ae987`. The row and note were
introduced by the round-3 fix batch.

---

### R4-6 — SERIOUS (regression, introduced by the D10a fix). "Commit hash" is not a derivable grounding pointer for co-change, and D17 refuses to store what would make it one

**What the document does now.** D10a, Read at arch:1333 and arch:1337, gives both the
Coupling row and the Completeness row the grounding pointer **`commit hash`**, over store
source `cochange_file_pairs`. D6's definition of that table, Read at arch:813–814, is:
`cochange_file_pairs(a→files, b→files, pair_count, a_count, b_count, last_ts, PRIMARY
KEY(a,b))`. There is no commit column, no commit-list column, and no foreign key to the
`commits` table. D17, Read at arch:2148–2149, **rejects** the storage that would supply
one: *"Rejected. Storing full per-commit transaction lists as the query model (unbounded
growth; every lookup becomes an aggregation)."*

**How that claim was verified.** **Established by reading** D6's schema block in full
(arch:786–845), D17 in full (arch:2126–2156) and D10a's table in full (arch:1331–1345).
The column list above is quoted from the read.

**Which standard it violates and why.** The governing standard is spec **AC-1**
(spec:860–863), which requires a coupling whisper *"stating its evidence ratio, with a
git-history pointer"*, and **AC-6** (spec:883–885), which requires that *"every pointer
resolves to a real location/commit in the fixture"* — reinforced by D12 Move C's own
resolution rule at arch:1614–1616 (*"whose pointer resolves against the current store
(file exists at indexed hash / commit exists)"*). Two things are wrong and they compound.
First, the pointer is **not derivable**: nothing in the store holds a commit hash for a
pair. Second, even if one were retained, a single commit hash is the **wrong pointer for
an aggregate claim** — FR-D5 renders "16 of the last 20 commits" (arch:1814), and
pointing at one of those sixteen does not let the agent check the ratio, which is what P4
requires the pointer to do. This is the same class of error as R4-1: a pointer shape
chosen for a positive point-fact, applied to a claim of a different kind.

**What correct implementation looks like.** Decide the co-change pointer shape explicitly
and add the column that carries it. The shape that matches the claim is a **bounded,
re-runnable history query** — the same form D6 now mandates for negative claims —
e.g. `git:<repo>@<horizon>:pairs(a,b)`, resolved by re-running the mining query over the
recorded horizon and reproducing the counts. If a representative commit is wanted as a
human convenience it is metadata, not the grounding pointer. Update D6, D17's storage
model, and D10a's cells together, and re-verify AC-1's fixture against the new shape.

**Provenance: regression.** The cells were introduced by `f7ae987`/`b5ebe9c`. The
underlying gap (no commit provenance on the pair tables) predates D10a, but no prior
round asserted a pointer for it; the assertion is what makes it a finding now.

---

### R4-7 — SERIOUS (recurring). Spike 1's corrected mechanism was established under a configuration the design does not ship, and re-derivation under the shipped flags falsifies it

**What the document does now.** Spike 1 block 1, Read at arch:106–131, is titled
*"`--max-turns 1` is prompt-dependent, and therefore not robust"* and certifies, in a
table at arch:115–118, that the variable is *"the system-prompt's **content**, not its
presence"*:

| configuration (as the document states it) | runs | result |
|---|---|---|
| `--max-turns 1` + inline schema + **deny-list**, thin prompt | 10 | 10/10 `error_max_turns`, no `structured_output` |
| `--max-turns 1` + inline schema + **deny-list**, rich prompt | 5 | 5/5 success |

The fix matrix at arch:171–177 repeats both rows as **deny-list** rows and contains no
row for `--max-turns 1` + `--tools ""`. D11 restates the conclusion at arch:1444–1456.

**How that claim was verified — by execution of D11's own command block, this session.**
CLI **2.1.220**, Node **v22.22.2**, no `ANTHROPIC_API_KEY`, `CLAUDE_CODE_*` scrubbed,
fresh `--session-id` per run, real judgment payload, real inline verdict schema, real
oracle system prompt. The thin prompt was a single sentence (`"You are the oracle. Answer
FR-A1."`), matching the document's description at arch:117.

| configuration | runs | `is_error` | `subtype` | `num_turns` | `structured_output` |
|---|---|---|---|---|---|
| `--max-turns 1` + **deny-list**, thin prompt (the document's row) | 5 | 4 True / 1 False | `error_max_turns` ×4 | 2 | absent ×4 |
| `--max-turns 1` + **`--tools ""`**, thin prompt — **the missing cell** | **10** | **0 True / 10 False** | `success` ×10 | 2 | **present ×10** |

Two results, both load-bearing. **(a)** The document's own row does not reproduce at the
rate certified: 4/5, not 10/10, and the document reports no variance for a claim it
derived precisely from having *"run both to a distribution"*. **(b)** More seriously, the
cell the design actually ships — `--tools ""`, adopted at arch:1409 and defended at
arch:1430–1442 — succeeds **10/10 under the thin prompt**, with `permission_denials: []`.
So the discriminating variable is not the system prompt's content; it is the **tool
configuration**, and the document's own text already predicts this at arch:179–182:
*"with no tools to consider, the child reaches the structured-output turn directly,
costing one fewer turn."* The mechanism sentence and the data contradict each other
inside one section.

**Which standard it violates and why.** `CLAUDE.md`'s dominating rule — *"Never claim
something works without having run it; paste the actual command and its actual output"* —
in the form the document itself wrote into the collapse log after round 1 and quotes at
arch:96–99: *"a re-run spike must exercise the **actual** design command, flags and all;
never trust a premise whose validating command differs from the design's."* Round 3's
R3-2 found this rewrite had reproduced that error on the flag axis and directed, in
writing (round-3 review, Recommended Priority item 3): *"Fill the matrix's missing cell
(`--max-turns 1` + `--tools \"\"`), which is the configuration the design would actually
have shipped after the F2 fix."* The cell is still missing, and it is the cell that
falsifies the certified mechanism. `CLAUDE.md`'s apply-all-findings rule is violated
alongside the run-it rule. The certified mechanism has also propagated to the
owner-facing record: `STATUS.md`:20–28, Read this session, tells the owner *"with a short
instruction block it failed 10 out of 10; with a realistic one it succeeded 5 out of 5"*
— a false report of the kind `CLAUDE.md` calls "strictly worse than no work at all."

**What correct implementation looks like.** Re-run the matrix with the shipped tool
control (`--tools ""`) in **every** row, since that is what D11 ships, and record for each
row: the full flag set, the run count, and the observed spread — not a single
representative figure. Restate the conclusion in the form the data supports:
`--max-turns 2` is adopted as margin, not because one turn is prompt-dependent under the
shipped flags. Correct `STATUS.md`, and correct D11:1444–1456. Note the design conclusion
(`--max-turns 2`) is unaffected and remains correct — the defect is the certified
mechanism, not the shipped value.

**Provenance: recurring.** Round 2's F3, round 3's R3-2 — same standard (`CLAUDE.md`'s
run-it rule), same location (Spike 1 / D11 element 5). Third consecutive round.

---

### R4-8 — SERIOUS (recurring). D11's 30 s kill timeout cites a maximum its named source does not contain, and the shipped command exceeds the timeout in 2 of 10 timed runs

**What the document does now.** D11, Read at arch:1421–1426: *"Timeout: **30 s** process
kill — sized against the **observed maximum**, not the mean: 17.4 s max over the runs
recorded in Spike 1 (mean 13.3 s across the wider set), so 30 s is ≈1.7× the tail."*
D10 step 1a (arch:1015–1019) and step 8b (arch:1201–1213) size the model-call budget on
*"≈$0.005 and ~10.5 s per judgment"*.

**How that claim was verified — two ways, both this session.**

*First, by reading the cited source.* Spike 1 was Read in full (arch:80–261). The wall
figures it records are 12.1, ~12, 19.1, 11.4, 10.6 s (fix matrix, arch:173–177) and
11.43, 10.06, 10.14 s (latency block, arch:188–190). **Neither 17.4 s nor 13.3 s appears
anywhere in Spike 1** — a grep across the whole document returns exactly one hit for each,
both inside D11:1422 where they are attributed to Spike 1. Spike 1's own recorded maximum
is **19.1 s**, higher than the "observed maximum" D11 cites it for. The 17.4/13.3 figures
are the round-3 *reviewer's* measurements; the fix imported them and attributed them to
the artifact's own evidence.

*Second, by execution of D11's adopted configuration* (`--tools "" --max-turns 2`, inline
schema, rich system prompt, fresh `--session-id`, `CLAUDE_CODE_*` scrubbed), **10 runs with
shell-measured wall clock**, paired with the CLI's own reported cost per run:

```
wall (s): 10.65  11.32  13.19  14.95  16.81  17.18  21.36  28.72  32.52  33.84
cost ($): 0.0058 0.0064 0.0070 0.0070 0.0086 0.0094 0.0107 0.0138 0.0168 0.0172
n = 10   mean wall 20.05 s   max wall 33.84 s   mean cost $0.0103   max cost $0.0172
```

An 11th run of the same configuration was captured for its structured output rather than
its timing; it reported CLI duration 15.66 s and cost $0.0090 — consistent with the above,
and stated separately because its wall was not shell-measured. The distinction is recorded
rather than smoothed, because reporting a derived figure as a measured one is the defect
class this finding is about.

**2 of the 10 timed runs (20%) exceed the 30 s process kill.** Mean wall is 1.9× the
document's 10.5 s; mean cost is 2.1× the document's $0.005.

**Which standard it violates and why.** Two named standards. (i) Standard practice for
sizing a process-kill timeout — derive it from the latency distribution's tail plus
margin, over a stated sample size — which round 3 named at R3-13 for this same location.
The document restated the basis without re-measuring it, and the restated basis is a
figure its cited source does not contain. (ii) `CLAUDE.md`'s source-annotation rule
(*"Numbers without sources don't go in"*): a number attributed to a section that does not
carry it is worse than an unsourced number, because it survives a citation review. The
consequence is specific and the document states it itself: a Lane 2 timeout is a failure
(arch:1180), and three consecutive failures enter degraded mode (arch:2218–2220). At a
20% timeout rate the oracle enters degraded mode on a live-quota API episode rather than
riding it out, and the announced transition (arch:1217–1220) fires on a self-inflicted
cause. The cost figure matters independently: D10 step 8b's whole argument is that the
oracle spends the agent's own subscription quota, and it is sized on a figure that is
half the measured mean.

**What correct implementation looks like.** Re-measure the adopted configuration over a
stated n, record the distribution (not a representative run), size the kill at the
observed maximum plus margin — on the evidence above, 60 s, since Lane 2 is off the hook
path and the timeout trades only judgment freshness — and re-base D10 step 1a and step 8b
on the measured mean cost. State n and the spread inline at every location, so the next
round can re-derive rather than re-attribute. Fold the ongoing measurement into D26's
delivery-lag instrumentation (arch:2002–2005), which is already tasked with it.

**Provenance: recurring.** Round 3's R3-13, same location (D11's timeout), same named
standard (tail-based timeout sizing). The fix changed the sentence and not the
measurement.

---

## Systemic Patterns

### R4-9 — SYSTEMIC (recurring, **fifth consecutive round**). Cross-references certify what their targets do not carry

**The pattern.** A decision states that another section of the document carries a
mechanism, a number, a fixture, or a limitation; the target does not carry it. This is
the same root cause named on 2026-07-17, found in rounds 1, 2 and 3 (R3-S1) — *claims
certified without the check being run* — in its third distinct form. Round 2's form was
summary attestation blocks; those were deleted. Round 3's form was inline evidence;
R4-7 and R4-8 show that form persisting. **This round's form is the cross-reference**,
which is harder to catch than either, because the citation is specific, the target
exists, and only reading the target reveals the gap.

**The proactive scan.** Per SKILL.md Step 8 a systemic claim requires a scan across the
full inventory scope. The pattern's signature is not expressible as a single grep — a
cross-reference is only wrong relative to its target — so it was decomposed: every
cross-reference in the changed regions and their dependents was **located by grep on the
cited identifier** and then **established by reading the cited target in full** (override
1). The identifiers scanned and their document-wide hit counts: `Limitations` (3
in-decision citations), `genre_dark` (1), `self-check` (8), `AC-11a` (3), `AC-16a` (1),
`AC-21a` (1), `17.4`/`13.3` (1 each), `--disallowedTools` (7). Nine instances survived
reading:

1. **D5:760** — *"Recorded in Limitations rather than hidden"* (the merged-histories
   residual). Limitations Read in full at arch:2797–2870: **15 bullets, none is this**.
2. **D14:1962–1965** — the Process genre's narrowing to the mechanically-decidable
   subset, *"recorded in Limitations"*. **Not in the 15 bullets.**
3. **D10a:1379–1380** — answer-drift's narrowing, *"recorded in Limitations, exactly as
   Process was narrowed."* **Not in the 15 bullets** — and the comparison it draws is to
   instance 2, which is also absent.
4. **D10a:1355** — *"D21's `genre_dark` check must **not** flag it."* D21 Read in full at
   arch:2257–2302: it enumerates nine self-checks (wiring, latency, model path, store
   integrity, staleness, delivery reconciliation, subagent narration, continuation
   accounting, delivery confirmation). **There is no `genre_dark` check.** The only other
   occurrence of the identifier in the repository is in round 3's collapse-hunt, where it
   was *proposed*.
5. **Traceability matrix:2767** — *"FR-M2 | D21 (**six** self-checks)"*. D21 enumerates
   **nine**; checks 8 and 9 were added by this round's own fixes and the matrix was not
   updated.
6. **D14:2006** — *"Supersession-drop rate becomes an FR-M2 self-check with its own
   finding code."* **Not among D21's nine.**
7. **T4:2635** — *"AC-11a (the child enumerates its own tools and returns none)"*, and
   at 2637 *"an empty tool inventory in the model child."* This is exactly the instrument
   R3-9 deleted: D11:1540–1549, Read, now specifies that AC-11a asserts on *"the harness's
   own output, not the model's narration"* precisely because the self-report *"reported 32
   names and then 8 — a 4× swing."* The threat model still certifies T4 on the deleted
   instrument.
8. **T4:2633** — *"the model call, now tools-disallowed by an actual `--disallowedTools`
   flag, D11"*. D11:1430–1442, Read, demotes the deny-list to *"defence in depth"* behind
   `--tools ""`. **And inside D11 itself, element 5 at arch:1519–1520 still cites the
   eight-tool self-report as premise verification** (*"the child enumerates eight
   remaining tools — hence the demotion"*) while element 5's own AC-11a note at 1545–1549
   states that this figure's source is the unstable self-report and *"is also how the
   'eight tools' figure entered this document."* One decision uses a measurement as
   evidence and disavows the instrument that produced it, twelve lines apart.
9. **AC-11a, AC-16a, AC-21a** — three acceptance criteria invented by the architecture
   (established by reading spec §13 in full at spec:856–945: the identifier set is
   AC-1…AC-22 with no suffixed forms). Each appears **only** in the decision that invented
   it: AC-11a at D11:1540 (plus the two stale T4 mentions), AC-16a at D10:1165, AC-21a at
   D15:2064. D26 Read in full at arch:2469–2509 — none is among its fixtures. The build
   order's phase exits Read at arch:2701, 2708–2712 — none appears. The traceability
   matrix Read at arch:2795 — the row reads *"AC-1..AC-22"*. So three criteria the
   document introduces to stop three specific defects from drifting back to prose have no
   fixture, no phase, and no traceability row — the exact fate each was written to prevent.

**Which standard it violates and why.** ISO/IEC/IEEE 42010's requirement that an
architecture description record correspondences between its elements and identify
inconsistencies; and `CLAUDE.md`'s Engineering Standard, *"Keep documents in sync"* plus
*"Numbers without sources don't go in."* This is a systemic failure rather than nine
isolated slips because the instances share one generator: a fix is applied at the point
of the finding and its cross-references are asserted rather than traversed. D10a exists
to stop exactly that (arch:1395–1400, *"a fix must be **traversed, not inspected**"*),
and four of the nine instances are inside D10a or created by the same commit batch. The
countermeasure reproduced the disease.

**What correct looks like.** Not another instance sweep — rounds 2 and 3 each swept the
instances and each declared the pattern addressed. What is different to do is make the
cross-reference *mechanically checkable*: every cited identifier (`AC-n`, `D-n`,
`finding_code`, a table name, a section name) becomes a resolvable token, and a check
enumerates the tokens and their definition sites and fails on any token with no
definition or with more than one incompatible definition. In a prose document that is a
short script over the markdown; it is also exactly the artifact that would have caught
all nine instances above, plus R4-1, R4-2, R4-3 and R4-5. Until such a check exists, the
document has no mechanism that distinguishes a citation from a claim.

**Provenance: recurring.** Fifth consecutive round: 2026-07-17 (11 findings, one root
cause), round 1 (Gate-C attestation of a nonexistent collapse test), round 2 (F9/S1,
eight false attestations), round 3 (R3-S1), round 4 (this).

---

## Moderate & Minor Findings

### R4-10 — MODERATE (regression, introduced by the D10a fix). The turn-spending count contradicts the table it summarizes, and Process's delivery cost is determined by no decision

**What the document does now.** D10a note 3, Read at arch:1385–1389: *"**Two genres spend
a turn** (Completeness, Verification) and Process fires at the same moment."* The table
itself, Read at arch:1331–1345, marks **three** rows *"spends a turn"*: Completeness
(1337), Verification (1338) and Process (1344, *"spends a turn (fires at completion)"*).

**How that claim was verified.** **Established by reading** D10a in full (arch:1313–1400)
and counting the Delivery-cost column cell by cell; and by reading D10 step 5's stop-class
rules in full (arch:1060–1076), which key the continuation gate and `stop_bar_delta` on
the **event type** `stop`/`subagent_stop`. Process's trigger, per its own row, is *"completion
claim vs `skill_expectations`"* — a narration event, not a stop event. So no decision
determines whether a Process whisper rides an existing boundary or spends a turn; the cell
asserts a cost the pipeline does not fix.

**Standard.** D10a's own maintenance rule (arch:1395–1400) — a row is not applied until it
has been walked end to end — and OWNER-12's audited bound, whose accounting is D21
self-check 8 (arch:2276–2281, *"Stop-class deliveries per session, counted from
`whisper_log.continuation`"*). An undercount in the summary and an undetermined cost in the
row are the two halves of the same gap: the owner's accepted cost cannot be audited
against a number the document states two different ways.

**Correct implementation.** Decide Process's delivery event explicitly (the natural
answer, given it fires on a completion claim, is that it is stop-class and therefore
turn-spending), correct note 3 to three, and state in D10 step 5 that the stop-class rules
apply to *any candidate delivered on a stop-class event*, not only to genres triggered by
one.

**Provenance: regression.** Both the note and the row were introduced by `f7ae987`.

---

### R4-11 — MODERATE (regression, introduced by the D10a fix). Answer-drift is Lane 1 in one decision and Lane 2 in another, and Lane 1 has no narration input

**What the document does now.** D10a, Read at arch:1345, places Answer drift in
**"1 (deterministic; in the FR-J3 degraded set)"**, and note 2 (arch:1366–1383) argues the
case at length; D20's degraded set was correspondingly updated (arch:2228–2231). **D10 step
4 was not.** Read at arch:1040–1041, the Lane 2 candidate pool is enumerated as
*"(assumption-check, steering, answer, process, **drift**, orientation-enrichment)"*, and
Lane 1's enumeration at arch:1027–1033 lists four triggers, none of them a user question.

**How that claim was verified.** **Established by reading** D10 step 4 in full
(arch:1027–1041) and D10a note 2 in full (arch:1366–1383). Both regions read at drafting
time.

**Standard.** ISO/IEC/IEEE 42010 consistency. There is a second, substantive half:
Lane 1 is defined at arch:1027–1028 as *"store **read** lookups keyed by event facts"*
running in under 100 ms, and the narration reader that produces `open_questions` feeds the
**intent queue**, which D10 step 4 assigns to Lane 2 (arch:1034–1036). Moving answer-drift
to Lane 1 without giving Lane 1 a narration input path leaves the genre with no specified
producer in the lane it is now assigned to — and it is a Phase 0 genre, so the gap lands in
the first shipped product.

**Correct implementation.** Update D10 step 4's two enumerations together with D10a and
D20, and state Lane 1's narration input explicitly: the narration reader writes
`open_questions` off the event path, Lane 1 reads the table on the event path. That is
consistent with Lane 1's read-only rule and makes the assignment buildable.

**Provenance: regression.** D10a note 2 moved the genre and updated D20; D10 step 4 was left
as it was, so the contradiction was created by the round-3 fix batch.

---

### R4-12 — MODERATE (recurring). Answer-drift's grounding fact has no provenance columns, so it cannot pass the gates the same round fixed for Process

**What the document does now.** D10a, Read at arch:1345, gives Answer drift the store
source `open_questions` and the grounding pointer *"bounded transcript scan"*. D6's
definition, Read at arch:830, is `open_questions(session, consumer, question, asked_loc,
resolved INTEGER)` — with no `…prov` block, unlike `skill_expectations` (831–833) and
`session_evidence` (834–836), which were given one this round. D6's own rule at
arch:842–845: *"the DAO refuses any record without `prov_kind`+`prov_ref`+`trust`"*.

**How that claim was verified.** **Established by reading** D6's schema block in full
(arch:786–845), comparing the `…prov` markers table by table.

**Standard.** Spec **FR-K6** (provenance mandatory) as D6 implements it, and **AC-20**
(spec:934–936), which requires the whisper to carry the question *"with its location"* —
a pointer that must resolve through D13's assembly gate (arch:1818–1820, *"every pointer
must resolve against the store at assembly time or the whisper is dropped"*). A record the
DAO refuses to write cannot ground a whisper.

**Correct implementation.** Give `open_questions` the provenance block, with the same
bounded-scan `prov_ref` form R4-1 requires for `session_evidence` — `unaddressed for 2
turns` is an absence claim and needs the same pointer shape. Round 3's Recommended Priority
item 4 directed exactly this check (*"Check the sibling resolver gap
(`open_questions.asked_loc`) in the same pass"*); it was not performed.

**Provenance: recurring** — the sibling half of R3-5/C2, explicitly assigned and not done.

---

### R4-13 — MODERATE (recurring). Five uptake predicates are named without a producer, and the Warning predicate inverts the one producer that exists

**What the document does now.** D10 step 9b, Read at arch:1276–1285, specifies exactly one
uptake detector: *"uptake detection is specified here and owned by the distiller — the
whisper's **subject** being subsequently edited, tested, or referenced by **any** route
counts."* D10a's Uptake-predicate column, Read at arch:1331–1345, names predicates that
detector cannot produce for five rows:

- **Warning** (1336): *"edit abandoned or zone respected"* — the subject **not** being
  edited. Under 9b's detector this scores as zero uptake, which is the precise failure C6
  named: *"That scores the tool's **best** outcome as a failure."*
- **Assumption check** (1340): *"narration corrected"* — a transcript event, not subject
  interaction.
- **Answer** (1342): *"question not re-asked"* — an absence.
- **Unknown** (1343): *"gap named in a later user turn"* — a transcript event.
- **Process** (1344): *"claim retracted"* — a transcript event.

**How that claim was verified.** **Established by reading** D10 step 9b in full
(arch:1267–1285) and D10a's table in full, row by row.

**Standard.** Spec §9.2's effective-false-positive metric and its ladder, as D10 step 9b
scopes them, plus the standard 9b itself invokes ([TRICORDER-15] via the spec) that a
quality signal must have a validated producer. D10a note 4 claims at arch:1390–1393 that
*"Every uptake predicate is now **named**"* — but C6's finding was not that predicates were
unnamed; it was that `uptake` *"existed only as a schema column and a statistic with no
named **producer**."* Naming five predicates the sole producer cannot compute leaves the
original gap in place under a table that reports it closed.

**Correct implementation.** Extend 9b's producer specification to the two additional
detector families the table now requires — a **transcript-event detector** (narration
correction, claim retraction, gap naming, question re-ask) and an **explicit
negative-uptake detector** for Warning, where non-interaction is the success signal and
must be scored with the opposite polarity. State the polarity per genre in D10a, since
polarity is now a pipeline joint. Where a family is not built for v1, mark those rows
*"no uptake detector"* and take the §9.2 exclusion note 4 already describes — that path
currently exists in prose with nothing routed to it.

**Provenance: recurring.** Round 2's C6 (uptake measures compliance, not influence) and
round 3's collapse-hunt C15 (four genres have no detector), same standard, now reasserted as
closed by D10a note 4.

---

### R4-14 — MODERATE (regression, introduced by the D10a fix). Note 1 says the darkened genres "degrade to a working genre"; its own `self_serve_class` cells say those working halves are near-worthless

**What the document does now.** D10a note 1, Read at arch:1358–1360: *"**Coupling's helper
half** and **Consequence's breakage half** stay dark for the same reason. Both degrade to a
working genre rather than a dead one (co-change carries Coupling; **call-sites carry
Consequence**)."* The table's own cells say otherwise. Consequence's `self_serve_class`
at arch:1335 is *"**trivial** (call-sites)"*; Coupling's helper half at arch:1334 is
*"trivial"*; Orientation's shipping arm at arch:1339 is *"trivial (entry points)"*. D10
step 5a, Read at arch:1095–1097, defines that class as **Low (≈0.15) — one tool call away**,
and names its examples verbatim: *"call-site counts, 'there is a helper at Z'"* — the very
content note 1 says carries the genre.

**How that claim was verified.** **Established by reading** D10 step 5a in full
(arch:1078–1169) and D10a's table and notes in full.

**Standard.** RETHINK §2.3 as operationalized by `self_serve_cost` (the R4-4 standard), and
the collapse test `CLAUDE.md` mandates for load-bearing claims: note 1's job is to state
what the ⛔ marks cost, and it states the opposite of what the table computes. Coupling's
co-change half is genuinely `invisible` (arch:1333) and does carry the genre; **Consequence
and Orientation do not** — with `self_serve_cost` applied they are at 0.15, which is the
suppression the bar exists to perform. Note 1 reports a degradation that its own table
scores as effective silence, which is precisely the "correctly quiet vs broken and quiet"
ambiguity D10 step 9 exists to eliminate.

**Correct implementation.** State per ⛔ row what the *shipping* half's `self_serve_class`
implies for its expected fire rate, and say plainly which genres are effectively dark in v1
(on current evidence: Consequence and Orientation, until D18's landmine writer is
acknowledged per R4-5 and the breakage arm lands). D21's dark-genre expectation — which
D10a wants at arch:1355 and D21 does not have (R4-9 instance 4) — then has real content to
record.

**Provenance: regression.** Note 1 was introduced by `f7ae987`; no prior round could have
reported it.

---

### R4-15 — MINOR (regression, introduced by the D10a fix). The Unknown row fills a store-source cell with something that is not in the store, and calls it durable

**What the document does now.** D10a, Read at arch:1343, gives the Unknown genre the store
source *"negative-evidence fact"* and durability *"durable"*. D12 Move A1, Read at
arch:1577–1584, constructs that fact **at judgment time** from a query that returned
nothing: `{genre:'unknown', claim_text:'no repo artifact determines X',
evidence_pointer:'query:<terms> → 0 results', trust:'mechanical'}`. There is no table for
it in D6 (schema block Read in full at arch:786–845) and nothing persists it.

**How that claim was verified.** **Established by reading** D12 Move A1 and D6's schema
block in full.

**Standard.** D10a's own rule that a blank or `NONE` cell is a build-time error
(arch:1326). Filling a cell with a value that does not answer the column's question is the
evasion that rule exists to prevent — the column asks which store table the genre reads,
and the honest answer for Unknown is *none; the fact is synthesized from an empty query
result*, which is a legitimate and interesting answer that the table should be able to
carry.

**Correct implementation.** Add an explicit `synthesized (no table)` value to the
Store-source column's vocabulary, use it here, and set Durability to `ephemeral —
regenerated per judgment` with a note that the pointer's durability comes from the query's
re-runnability, not from storage.

**Provenance: regression.** The row was introduced by `f7ae987`.

---

### R4-16 — MINOR (new). AC-20 requires the question verbatim; D14 says the whisper does not re-quote it

**What the document does now.** Spec AC-20, Read at spec:934–936: *"the oracle whispers the
open question **verbatim** with its location."* D14, Read at arch:1973–1978, describes the
answer-drift whisper as naming *"the specific conflict with its pointer"* — example
*"question Q asked at `loc`, unaddressed for 2 turns"* — and then states it *"does **not**
recite a checklist step-by-step or **re-quote the question** as if the agent lacked it (that
would be noise, not a new fact)."*

**How that claim was verified.** **Established by reading** spec §13 at 934–936 and D14's
conduct-genre passage in full at arch:1910–1982. Whether `Q` in D14's template stands for
the question text or a reference to it is not stated anywhere in the document; D13's
rendering format (arch:1811–1812) does not settle it, and D13's pointer-only rule covers
*repo*-derived spans only (arch:1837–1846), so it neither permits nor forbids quoting a
transcript-derived question.

**Standard.** D26's governing contract, arch:2497–2499: *"Spec §13's ACs are the governing
contract — each is a named fixture."* A criterion whose satisfaction depends on resolving an
undocumented ambiguity in the governing decision is not mechanically satisfiable, and both
prior expert-review rounds recorded AC-20 as passing on the strength of D14's
"deterministic bookkeeping" sentence without reaching this one.

**Correct implementation.** State it explicitly in D14: the answer-drift whisper carries the
question text verbatim (AC-20's requirement) plus `asked_loc`, and the "does not re-quote"
clause applies to the Process genre's skill-step recitation only. One sentence, and the
fixture becomes writable.

**Provenance: new.** D14's sentence predates the round-3 fixes; both prior expert-review
rounds recorded AC-20 as passing, so no prior round reported it.

---

## Tentative Findings

**No tentative findings — every candidate finding's premise was verified per Compliance
Gate B**, with two premise categories established by execution rather than reading (R4-7,
R4-8: 26 live invocations of D11's command block) and every other premise established by
reading the cited region at drafting time, per methodology override 1.

Three candidates were **dropped** rather than delivered as tentative, and are recorded so
the reader knows they were considered and why they are not findings:

1. *"D20's claim that generated-file warnings are cold-checkout-invisible is false."*
   D20:2238–2241 does claim it; D10a:1336 glosses the Warning row as invisible *"on the
   consequence, not the classification"*. The gloss is not a class D10 step 5a defines,
   but the underlying design question (is a zone consequence self-servable?) is a genuine
   judgment call the document is entitled to make. Not delivered — it would be a
   disagreement, not a defect.
2. *"The `…prov` markers are inconsistently applied across D6's tables."* Established by
   reading arch:786–845: nine tables carry the marker and nine do not. But D6's preamble
   says *"every knowledge table carries"* the block and the schema is explicitly *"abridged
   to load-bearing columns"*, so the omissions may be abridgement. Only `open_questions` is
   delivered as a finding (R4-12), because there the omission has a demonstrated downstream
   consequence.
3. *"D10a's `self_serve_class` vocabulary (`invisible`/`trivial`) does not match D10 step
   5a's (`High ≈1.0` / `Low ≈0.15`)."* Real, but a naming divergence with no downstream
   break. Recorded here rather than inflated into a finding.

---

## Observations

Non-finding notes only; none carries a standard violation or a severity.

1. **Clear Thought MCP is not available in this session.** The roster was searched; the
   MCP servers present are CORE Memory, Context7, GitHub, Asana and Claude Code Remote.
   SKILL.md's two mandatory structured-reasoning invocations were therefore performed
   manually with the same personas: the metacognitive baseline was drawn before any finding
   was drafted (everything about the artifact was on the *inferred* side and passed through
   Step 6 verification), and the pre-delivery multi-perspective check was run from the
   project's standards discipline, the downstream consumer acting on the verdict, and the
   implementer receiving the findings. Recorded as the procedural observation the skill
   requires.
2. **A concurrent round-4 collapse-hunt exists and was deliberately not read** — see scope
   limit 4. Its finding set is unknown to this review, by design. When both passes land,
   the union is the round-4 finding set for the project's purposes; this review's
   Convergence Record counts only its own, consistently with rounds 2 and 3.
3. **The a506f35 commit message documents three defects the fixers caught in their own
   fix batch by traversal** (Verification bound the wrong table; Steering bound a fact with
   no table; a degraded-set change asserted and not made), and the corrections are written
   into the artifact in place at arch:1120–1125 and 1135–1143. That is the maintenance rule
   working as intended, in the same commit that produced R4-5, R4-6, R4-10, R4-11, R4-14
   and R4-15 — which is the datum the Convergence Record turns on.

---

## What's Actually Good

Three items, each with the property named, the standard it is good by, and how the
property was verified.

1. **`--tools ""` as the primary tool control, with the deny-list demoted behind it
   (D11, arch:1430–1442).** *Property:* default-deny with an explicit allow-set, rather
   than default-allow with an enumerated block-list. *Standard:* least privilege as OWASP
   LLM01 and ASVS V15 define it — a control whose failure mode is over-restriction, not
   silent over-permission. *Verified:* by execution this session — 10 runs of the shipped
   configuration returned `permission_denials: []` with the run completing on the
   structured-output turn, and D11 element 4 (arch:1496–1510) explicitly names and reverses
   its own prior position rather than quietly replacing it. Reversing a documented decision
   *in the decision*, with the disqualifying evidence, is the behavior the project's
   collapse-test rule is trying to produce.

2. **Logged-before-sent for the FR-X6 audit record (D24, arch:2384–2396).** *Property:*
   the durable audit append is ordered **before** delivery, so the failure mode is an
   unspoken whisper rather than an unlogged one. *Standard:* fail-secure ordering for audit
   controls — ASVS V16 (security logging) and the general write-ahead discipline that an
   audit record must not be able to lag the event it audits. *Verified:* Read at
   arch:2391–2396, where the ordering is stated as a structural guarantee with its cost
   named (*"a persistence failure costs at most one unspoken whisper, never an oversight
   hole"*), and the mechanism chosen (an `fs` append, not a WAL write) is justified against
   the NF-1 constraint it would otherwise threaten. The reasoning is complete in both
   directions, which is rare in this document.

3. **D5's repo-identity evidence is the one evidence block that re-derives exactly.**
   *Property:* every empirical claim in D5 element 5 reproduces on the repository it names.
   *Standard:* `CLAUDE.md`'s run-it rule — the premise is checkable and it checks out.
   *Verified by execution this session on `Maxcogar/agent-armory`:
   `git rev-list --max-parents=0 HEAD` returns **six** commits;
   `git rev-parse --is-shallow-repository` returns **true**; traversal-first is
   `99818db05321…` and lexicographically-smallest is `1e3bc14c9930…` — both hashes matching
   arch:731–732 to the digit, and the two rules selecting different commits exactly as the
   decision states. Against a document whose recurring failure is exactly this, a block that
   survives independent re-execution unchanged deserves to be named.

---

## Convergence Record

**Round number:** 4 (third Post-fix round), matching Scope and Inventory.

**Trajectory** (findings by severity, from each round's mechanical verdict breakdown,
counting the expert-review pass consistently with rounds 2 and 3):

- **R1: 12** — reconstructed and de-duplicated by round 2's Convergence Record.
- **R2: 10** — 2 Critical, 4 Serious, 1 Systemic, 2 Moderate, 1 Minor.
- **R3: 14** — 1 Critical, 4 Serious, 1 Systemic, 6 Moderate, 2 Minor.
- **R4: 16** — 0 Critical, 8 Serious, 1 Systemic, 5 Moderate, 2 Minor.
- **R1: 12 → R2: 10 → R3: 14 → R4: 16.**

**Flow counts for this round.** Provenance classifications from Step 9 are the source; the
Closure Ledger below carries the per-item verification.

- **Prior findings closed: 11 of round 3's 14** — R3-1, R3-3, R3-4, R3-5, R3-6, R3-7, R3-8,
  R3-9, R3-10, R3-11, R3-12. **Not closed: 3** — R3-2 (→ R4-7), R3-13 (→ R4-8), R3-S1
  (→ R4-9).
- **New findings: 1** — R4-16.
- **Regressions: 6** — R4-5, R4-6, R4-10, R4-11, R4-14, R4-15, all introduced by the
  round-3 fix batch that created D10a.
- **Recurring findings: 9** — R4-1 (C7), R4-2 (C8), R4-3 (C9), R4-4 (C1), R4-7 (F3/R3-2),
  R4-8 (R3-13), R4-9 (S1/R3-S1), R4-12 (R3-5 sibling), R4-13 (C6/C15).

### Tripwire evaluation — **FIRED**. Arithmetic shown, both conditions, both rounds.

**Condition (a): new + regression ≥ closed, for two consecutive Post-fix rounds.**

- **R3:** new 6 + regression 3 = **9**; closed **15**. → `9 ≥ 15` is **false**. Condition
  does not hold at R3.
- **R4:** new 1 + regression 6 = **7**; closed **11**. → `7 ≥ 11` is **false**. Condition
  does not hold at R4.
- Consecutive rounds holding: **0 of 2 required. Condition (a): NOT FIRED.**

**Condition (b): the total findings count has not strictly decreased, for two consecutive
Post-fix rounds.**

- **R3:** prior total 10, this total 14. → `14 < 10` is **false**; no strict decrease.
  Condition **HOLDS at R3**. *(This is round 3's own recorded arithmetic, re-derived here
  from its Convergence Record and from its verdict line, Read this session.)*
- **R4:** prior total 14, this total 16. → `16 < 14` is **false**; no strict decrease.
  Condition **HOLDS at R4**.
- Consecutive rounds holding: **2 of 2 required. Condition (b): FIRED.**

**The non-convergence tripwire has FIRED on condition (b).** Round 3 recorded the tripwire
as armed and stated the threshold explicitly: *"If round 4's total does not come in strictly
below 14, condition (b) holds for two consecutive Post-fix rounds and the tripwire fires,
routing the work to foundational rework."* Round 4's total is **16**, which is not strictly
below 14. The count is mechanical: it was neither softened to avoid the firing nor inflated
to force it — the three candidates that would have padded it are recorded, with reasons, in
Tentative Findings.

**Reading of the trajectory — what the composition says that the count does not.** The
count rose again, but the shape of the rise is the diagnostic. Round 3's rise was explained
by three regressions out of fourteen and a large fix batch; that explanation predicted the
regression share would fall this round. It did the opposite: **6 of this round's 16 are
regressions, and all six live in the single artifact this round built to stop regressions
at the joints.** D10a's stated purpose (arch:1313–1324) is that *"no decision owns a genre"*
and that every collapse both prior rounds found *"lived exactly there"*, at the joints. The
table was the countermeasure. Six of its cells now assert a table, a pointer, a durability
class, a lane, or a build status that the cited decision does not carry — one of them
(R4-5) asserting the negation of its citation. Meanwhile the four unclosed collapse-hunt
items this round's fixes were supposed to resolve (C1, C7, C8, C9) are unclosed at exactly
the joints D10a was built to expose, **while D10a's own rows assert that they are resolved.**
That is not a large batch applied under time pressure; it is a countermeasure reproducing
the failure it was designed to catch, which is the field signature the tripwire exists to
name. Add the systemic root cause now on its **fifth consecutive round**, having taken a
third distinct form after two structural fixes aimed at it, and the evidence is that this
document cannot be brought to correctness by continued patching.

---

## Open Findings Ledger

Not applicable — the operator has not directed a cycle stop with open findings. No ledger
is required and none is presented.

---

## Closure Ledger — round-3 findings re-derived from current source

| # | R3 finding (originally named standard) | Status | Closure evidence (re-derived 2026-07-31) |
|---|---|---|---|
| R3-1 | OWNER-12/FR-O4a/widened AC-3 absent from the architecture (OWNER-12, FR-O4, P2) | **Closed** | Read arch:942–952 (`stop_hook_active` in the D8 envelope, with the fail-safe `true` default), arch:1060–1076 (the unconditional silence gate and `stop_bar_delta`), arch:826 (`whisper_log.continuation NOT NULL DEFAULT 0`), arch:2276–2281 (D21 self-check 8), arch:2479–2482 (D26's widened AC-3), arch:2735 (matrix row). All seven sub-changes present. |
| R3-2 | Spike 1's evidence does not reproduce (`CLAUDE.md` run-it rule) | **NOT CLOSED** | Spike 1 Read in full at arch:80–261; the directed missing cell (`--max-turns 1` + `--tools ""`) is absent from the matrix at arch:171–177. Re-derived by execution: that cell succeeds 10/10, falsifying the certified mechanism. → **R4-7** |
| R3-3 | The F2 fix did not propagate to three places (LLM01 / ASVS V15) | **Closed** | Read arch:2222–2224 (D20's probe now names `--tools ""` with the deny-list behind it), arch:2702 (build order 9), arch:2486–2489 (D26's AC-11 cites D11's command block by reference). The three named locations are corrected. *(A fourth location, T4:2633, still names the demoted control — filed under R4-9 instance 8 rather than reopening this finding, since the standard is satisfied at every location R3-3 named.)* |
| R3-4 | The Knowledge-state baseline certifies facts stated false elsewhere (premise-correctness) | **Closed** | Read arch:489–541: CLI corrected to v2.1.220, *"≈ 10.5 s wall, two turns"*, and the explicit deletion note *"'Single-turn' and the 5.7 s figure are deleted."* Spike 1's two global corrections are enumerated by location at arch:199–208 rather than claimed globally. *(The 10.5 s figure is now falsified by fresh measurement — that is R4-8, a new premise failure, not a reopening of this one.)* |
| R3-5 | `skill_expectations` asserted to be in D6 and absent from it (FR-A8/AC-19) | **Closed** | Read arch:831–833 — `skill_expectations(id, session, consumer, skill_ref, step_text, required_activity, registered_at, satisfied, …prov)` is present in D6's schema block, with the `…prov` block. `session_evidence` likewise at arch:834–836. |
| R3-6 | D5's shallow branch is a two-rule disjunction (determinism / FR-K9) | **Closed** | Read arch:744–756: *"applies **one rule, not a choice**: do not derive a commit key from a shallow history"*, with `git fetch --unshallow` strictly optional and path-keyed fallback on any failure. The disjunction is gone and no network fetch is load-bearing. |
| R3-7 | D5's motivating evidence demonstrates the shallow case, not the multiple-root case (evidence attribution) | **Closed** | Read arch:728–735 — the six commits are now identified as *"the clone's **shallow-boundary** commits … *not* roots, so this repo demonstrates rule 2's case and not rule 1's."* Re-derived by execution: 6 commits, `is-shallow` → true, the two rules select `99818db…` vs `1e3bc14…`. Matches to the digit. |
| R3-8 | Deny-lexicons are load-bearing one decision after D11 rejects the shape (LLM01 / least privilege) | **Closed** | Read arch:1655–1667 — *"**Control (1), the slot-filled template, is the primary bound**"*, with the lexicon explicitly demoted to defence in depth and the observed escalation (*"will almost certainly require"*) cited as the reason. The residual is stated. |
| R3-9 | AC-11a asserts tool-emptiness from the model's self-report (instrument validity) | **Closed** | Read arch:1540–1549 — AC-11a now asserts on *"the harness's own output, not the model's narration"* (no `tool_use` iteration, no `permission_denials` entry), with the 32→8 swing recorded as the reason. *(T4:2635 still describes the deleted instrument — R4-9 instance 7; and D11's own element 5 still cites the derived figure — R4-9 instance 8. Neither reopens R3-9, whose named location is corrected.)* |
| R3-10 | Self-check 6 cannot distinguish a lost ack from an undelivered whisper (FR-M2 actionability) | **Closed** | Read arch:2281–2286 — self-check 9, `delivery_confirmed` from the shim ack, unconfirmed records rendering distinctly in `ctxoracle log`, ack retried once. |
| R3-11 | The collapse-log omits F1 and mis-grades F3 (`CLAUDE.md` collapse-log rule) | **Closed** | Read `docs/collapse-log.md`:197–209 — the F1 entry is present as CRITICAL with `stop_hook_active`, the 8-continuation cap, OWNER-12, spec §6.1, FR-O4a and the widened AC-3. |
| R3-12 | Two different finding sets both labelled "Round 2" (documentation integrity) | **Closed** | Read arch:2959–2962 — the relabelling note is present and the inline fix notes throughout consistently use "round 2" for the 2026-07-30 findings; spot-checked at arch:387, 724, 883, 1079, 1431, 1619, 1926, 1991, 2039. |
| R3-13 | The 30 s kill is sized against the mean; the tail is 1.7× under it (tail-based timeout sizing) | **NOT CLOSED** | Read arch:1421–1426 — the *sentence* now says "observed maximum", but the cited figures (17.4 s max, 13.3 s mean) appear nowhere in Spike 1, whose own recorded max is 19.1 s; and re-derivation gives max 33.84 s with 2/11 runs over the 30 s kill. → **R4-8** |
| R3-S1 | Assert-without-establish, systemic (`CLAUDE.md` run-it rule) | **NOT CLOSED** | Fifth consecutive round; new form (cross-references), nine instances enumerated with the target read in each case. → **R4-9** |

**Round-3 collapse-hunt items re-derived** (the six whose subject matter the fixes touched):
C1 **not closed** (→ R4-4), C7 **not closed** (→ R4-1), C8 **not closed** (→ R4-2), C9
**not closed** (→ R4-3), C12 partially addressed by a gloss that D10 step 5a does not define
(recorded in Tentative Findings, dropped candidate 1), C15 addressed in name only (→ R4-13).
The remaining nine were not systematically re-derived — recorded as scope limit 3.

---

## Recommended Priority

**The tripwire has fired. The indicated path is foundational rework, not another fix
round.** SKILL.md is explicit that recommending another fix round over a fired tripwire is
forbidden, and on this evidence it would also be wrong on the merits: round 3 built D10a
precisely as the structural countermeasure to joint defects, applied it across every genre,
and it produced six joint defects of its own while asserting that four unclosed ones were
resolved. Two prior rounds each applied a structural remedy to the systemic root cause and
each failed to end it. A fifth patch pass has no mechanism available to it that the third
and fourth did not.

**What foundational rework means here, concretely — re-read the sources, re-derive the
approach, do not carry the failed attempt forward.**

1. **Re-derive from the three authorities, not from the 3,007-line draft.** `RETHINK.md`
   §12 + addendum, `docs/specs/spec-context-oracle.md`, and
   `docs/judgment-layer-corrected-foundation.md` are the inputs. The current architecture
   document is evidence about what has been tried and where it broke — the collapse-log and
   the four review files in `docs/reviews/` are the durable product of these rounds — but it
   is not the base to edit. Every round that edited it introduced defects at the joints
   between the sections it did not edit.

2. **Fix the structural cause of the joint defects, which is that the design is expressed
   as 26 prose decisions with hand-maintained cross-references.** Nine of this round's
   findings (R4-1, R4-2, R4-3, R4-5, R4-6, R4-9, R4-10, R4-11, R4-15) exist only because a
   citation and its target are maintained by hand in different places. The genre pipeline
   is not prose-shaped: it is a **table with a schema**, where store table, pointer shape,
   durability class, lane, trigger, bar factors and uptake polarity are typed fields whose
   values must resolve against a defined vocabulary and against the decisions that own them.
   Make that machine-checkable — a short script over the markdown that enumerates every
   cited identifier (`AC-n`, `D-n`, table names, `finding_code`s, section names) and fails
   on any token with no definition site or with two incompatible ones. That single artifact
   would have caught nine of this round's sixteen findings and all nine instances of R4-9
   at authoring time, which is the test of whether a countermeasure is real.

3. **Re-run the evidence base from scratch, under the shipped configuration, with
   distributions.** Every empirical claim in the rebuilt document records the full command,
   the run count, and the observed spread — never a representative run. This round's
   re-derivation shows why: the two figures the design is dimensioned on (10.5 s, $0.005)
   are each about half the measured mean over 11 runs, and the certified failure mechanism
   inverts under the flags the design ships. Round 3 asked for exactly this and it was not
   done; making it a property of the artifact's format rather than an instruction to the
   author is the difference.

4. **Carry forward what re-derived clean, and only that.** Three things earned it this
   round and should survive rework by re-verification, not by import: D5's repo-identity
   mechanism (re-executed, exact), D11's `--tools ""` default-deny control (re-executed,
   10/10), and D24's logged-before-sent audit ordering (read, complete in both directions).
   OWNER-12's continuation bound (R3-1, closed) is owner-locked and carries forward as a
   requirement, not as prose to copy.

5. **The scope question this raises is the owner's, and only this one.** Whether to rework
   the architecture document or to reduce v1's genre set is a **scope call** — the kind
   `CLAUDE.md` says goes to Max Cogar with the evidence. Everything above is design,
   sequencing and process, which `CLAUDE.md` assigns to the agent and which must not be
   escalated. The evidence to hand him is the one sentence this round establishes: twelve
   genres across nine pipeline joints is 108 cells that four rounds of review have not been
   able to keep true by hand, and six of them were wrong within one commit of the table
   being built.

---

Verdict: NEEDS FIXES (16 findings: 8 Serious, 1 Systemic, 5 Moderate, 2 Minor)
