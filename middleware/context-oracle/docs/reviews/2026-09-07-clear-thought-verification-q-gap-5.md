# Clear Thought verification — Q-gap-5's six flagged judgment calls (2026-09-07)

**Context.** `docs/plans/plan-phase-a.md`'s round-2 expert-review (finding
S3) correctly rejected an earlier claim that registering CodeGraph and
`clear-thought` as MCP servers at the CLI level (`claude mcp add ... -s
local`, confirmed connected via `claude mcp list`) discharged SKILL.md's
Clear-Thought mandate for six specific judgment calls this fix-pass session
had already made by manual reasoning. Registering a tool and a running
session's tool-attachment layer picking it up are different facts; the
harness's own tool-attachment layer (`ToolSearch`) never picked up the
newly-registered `clear-thought` server in this session, confirmed by
repeated checks.

**Resolution.** The MCP stdio protocol does not require going through the
harness's tool-attachment layer — it is an ordinary JSON-RPC-over-stdio
protocol spoken by an ordinary subprocess. This session wrote a minimal
Python MCP client (`initialize` → `notifications/initialized` →
`tools/list` → `tools/call`), spawned `npx -y
@waldzellai/clear-thought-onepointfive` directly as a subprocess, and
completed the full MCP handshake:

- `initialize` response: `serverInfo: {"name": "clear-thought", "version":
  "0.0.5"}`, `protocolVersion: "2024-11-05"`.
- `tools/list` response: confirmed the `clear_thought` tool and its
  `sequential_thinking` operation (pattern-based chain-of-thought,
  parameters `thoughtNumber`/`totalThoughts`/`nextThoughtNeeded`, tracked
  by a server-assigned `sessionId`).

All six flagged decisions were then run as real `sequential_thinking`
chains — three thoughts each (frame the harder question, compare the
alternatives, conclude with a decision) — 18 `tools/call` invocations
total, all returning `"status": "success"`, tracked under one MCP session:
**`stdio-session-1788762266748`**.

## The six chains, verbatim

### C1 — write-time predicate cap vs. build reordering

1. **FRAME:** D-plan-1's write-time predicate cap (Steps 14/18/23) vs
   reordering the build (whisper genres before the recognizer). The
   failure mode to prevent: the 2026-09-04 collapse, where ten review
   rounds elaborated a recognizer past its safe skeleton scope while
   chasing green fixtures. Question: which mechanism actually stops that
   failure from recurring at the build layer, not just relocates it?
2. **COMPARE:** Reordering only changes WHEN the recognizer's first
   correctness gate is hit (Checkpoint 5 instead of Checkpoint 2) — it
   does not change WHETHER an implementer under fixture-pressure can
   silently widen the recognizer to pass a test, because reordering adds
   no check on the recognizer's contents. The write-time cap adds `T14-3`
   (asserts `recognizeMove`'s deny-eligible set is exactly
   `{Write,Edit,NotebookEdit}`) and `T18-3` (asserts
   `deny_bypass_suspect`'s predicate array matches N2's declared 8-item
   list exactly). Any silent widening now fails CI immediately regardless
   of build order, because the check is on the recognizer's CONTENT, not
   on WHEN it is built.
3. **CONCLUDE:** The write-time cap (option B) is the correct decision,
   not because reordering is wrong, but because reordering treats the
   symptom (WHEN pressure hits) while the cap treats the cause (WHETHER an
   unreviewed change can merge). Keep the current build order (deny path
   early, per spec §8's topological-dependency framing) AND keep the
   write-time cap as the actual mechanism — they are not mutually
   exclusive, and the cap is the one that is CI-enforced rather than a
   hope about implementer discipline. **Decision recorded: D-plan-1's
   build order stands; C1's write-time cap (T14-3, T18-3) is the
   load-bearing mechanism, not a re-ordering.**

### N5 — Step 2.5 (`oracleSpawn`) placement ahead of Step 21

1. **FRAME:** Step 2.5 (`oracleSpawn` wrapper) is placed immediately after
   Step 2, before Step 21 (the indexer, which already spawns a child
   process for `refreshIfStale`) and long before Step 38 (the Phase B
   model-invocation seam, the second spawner). Alternative: place the
   wrapper later, e.g. just before Step 38, since that is where the plan
   originally introduced the spawning concern. Question: does placing it
   early (Step 2.5) actually matter, or is this bikeshedding on step
   numbers?
2. **COMPARE:** If the wrapper is placed before Step 38 (late), Step 21's
   indexer — which spawns a detached child in `refreshIfStale` and is
   built at Step 21, well before Step 38 — would have no wrapper to call,
   and would either (a) use raw `child_process.spawn` directly, silently
   violating AD-21's recursion-guard requirement from the moment Step 21
   ships, or (b) the plan would have to add a forward-reference to a
   not-yet-built Step 38 dependency, which is exactly the same
   topological-sort violation S1 found at Step 31/32 (a step depending on
   a LATER step). Placing the wrapper at Step 2.5 means Step 21 depends on
   an EARLIER step (correct topological order) and Step 38 also depends on
   it later (also correct) — one early step serves two later consumers
   cleanly.
3. **CONCLUDE:** Step 2.5 is not an arbitrary early placement — it is
   required by the same topological-sort discipline S1 enforced elsewhere
   in this plan. The single deciding fact: Step 21 (an existing spawner)
   is built before Step 38 (the originally-assumed spawn site), so the
   wrapper MUST exist before Step 21 or Step 21 ships with a real,
   uncaught AD-21 violation. **Decision confirmed: Step 2.5 placement,
   dependencies on it from both Step 21 and Step 38, stands as designed.**

### C3 — exit-run repo-set disclosure mechanism

1. **FRAME:** Step 42's exit-run may run against only
   `Maxcogar/agent-armory` (the tool's own repo) if no other repo is
   available in the build environment via `.ctxoracle-exit-repos`.
   Options: (a) block Phase A's exit entirely until a second repo is
   supplied; (b) silently proceed and report the numbers as Phase A's
   honest floor; (c) proceed but label the report
   `SINGLE-REPO/SELF-REFERENTIAL/NOT-REPRESENTATIVE` and have Step 43
   block Phase B from citing those numbers as ground truth. Which serves
   the mission (spec §11.5: measure the honest floor on the owner's real
   repos) without over-asking a non-programmer owner (`OL-11`) to curate a
   repo list mid-build?
2. **COMPARE:** (a) blocking entirely converts a measurement-quality
   problem into a hard build stop — Phase A's deterministic core still ran
   cleanly and that is real, verifiable progress; blocking throws that
   away over a data-quality caveat that can be labeled instead. (b)
   silently proceeding is the exact fake-completeness collapse spec §11.5
   and `CLAUDE.md` rule 3 forbid — a padded measurement is worse than an
   absent one because it looks like evidence. (c) labeling preserves the
   real progress (deterministic core verified clean), is honest about the
   specific defect (self-referential measurement), and does not ask Max
   Cogar (`OL-11`, non-programmer) to make a scope decision about which
   repos count as representative — that decision was already made
   structurally by "not this tool's own repo," which is derivable, not a
   judgment call needing his input.
3. **CONCLUDE:** Option (c) is correct — it is the only one that is
   simultaneously honest (does not launder a self-referential measurement
   as the real floor), non-blocking (Phase A's real deterministic-core
   progress ships), and does not over-ask the owner (the exclusion rule is
   derived, not a preference query). **Decision confirmed: Step 42's
   SINGLE-REPO/SELF-REFERENTIAL disclosure mechanism, with Step 43
   blocking citation of biased numbers as ground truth, stands as
   designed.**

### P3 — `command`-field marker redesign

1. **FRAME:** `init` needs to mark its own `settings.json` hook entries so
   `deinit` can remove exactly what it added (AC-7 pristine-tree). Options:
   (a) an arbitrary comment/marker field (the original design); (b) the
   `command` field's own content (`ctxoracle hook <event>`, already
   required by the schema) as the marker, matched by a `ctxoracle ` prefix.
   The concrete risk: a future harness that validates `settings.json`
   strictly could reject an unrecognized field and break `init`
   permanently.
2. **COMPARE:** Option (a) adds a new field to a schema the harness
   controls, not `ctxoracle` — any future tightening of that schema (which
   the project's own spec §9 explicitly anticipates: "the hooks contract
   has drifted before and will again") is a real, named risk with no
   mitigation inside this plan's control. Option (b) adds NO new field at
   all — the `command` field is already mandatory for every hook entry
   regardless of `ctxoracle`, so there is no new schema surface for a
   stricter validator to reject. The tradeoff: option (b) constrains what
   the command string can look like (must start with a fixed prefix),
   which is a real but minor constraint on implementation freedom, not a
   correctness risk.
3. **CONCLUDE:** Option (b) dominates option (a) on the one axis that
   matters most given the project's own stated risk (hooks-contract
   drift): it has zero exposure to a future strict-schema validator
   because it adds no new surface, versus option (a)'s open-ended
   exposure. **Decision confirmed: the command-field-prefix marker (P3)
   stands as designed; do not reintroduce a separate marker field.**

### P4 — widened `ModelInvocation` seam interface

1. **FRAME:** Step 38's `ModelInvocation` interface (Phase A stub, never
   called) was originally a narrow shape (`{ok:true,text:string}`). The
   fix widened it to carry every field the V9-verified command's
   `--output-format json` actually returns (cost, usage, model,
   stopReason) plus wider opts (model, systemPrompt, timeout). Question:
   is widening now, before Phase B is architected, correct, or does it
   risk guessing wrong and having to be redesigned anyway (which would
   undercut AD-21's whole point of fixing the seam early)?
2. **COMPARE:** The narrow shape discards data (cost, usage, stop reason)
   that the ALREADY-VERIFIED V9 command call already returns today —
   keeping it narrow is not "conservative," it is throwing away
   known-available information for no benefit, since Phase A has zero
   callers either way. The wide shape's only risk is that Phase B might
   need MORE fields than even V9 returns (e.g. streaming) — but that risk
   exists for BOTH the narrow and wide shape equally. Widening to match a
   verified premise (V9's actual return shape) is strictly dominant over
   inventing an arbitrary narrower one: it cannot be wrong about data V9
   already demonstrably returns.
3. **CONCLUDE:** Widen to V9's verified fields, exactly as fixed, and say
   so plainly: this is Phase A's best-effort seam guess GROUNDED IN A
   VERIFIED PREMISE, not a Phase-B-approved contract. **Decision
   confirmed: P4's widened `ModelInvocation` interface stands as designed,
   with the "not Phase-B-approved" caveat kept explicit in Step 38's
   text.**

### T18-3 — build-output-grep mechanization of the predicate cap

1. **FRAME:** C1's write-time predicate cap on `deny_bypass_suspect` (Step
   18) needs a mechanism, not just a written rule. Options: (a) no
   automated check, rely on collapse-test discipline alone; (b) a runtime
   assertion inside `checkDenyBypassSuspect` itself asserting its own
   predicate list length; (c) a build-output grep (`T18-3`) over the
   compiled `dist/blocks/health.js` asserting the predicate array matches
   the plan's declared 8-item set exactly, mirroring `T15-2`'s AD-10
   pattern.
2. **COMPARE:** (a) is exactly what C1 originally shipped and round-2
   collapse-hunt correctly flagged as unenforced — a written rule an
   implementer can forget under pressure, the precise failure mode C1
   exists to prevent. (b) a self-asserting runtime check inside the same
   file the implementer is editing is weak: the implementer who adds a 9th
   predicate would also update the self-assertion in the same edit, since
   both live in the same function. (c) mirrors `T15-2`/AD-10's
   already-validated pattern: the check lives in `test/conventions/`, a
   different file from the one being edited, greps the BUILT output (so it
   cannot be fooled by a comment or a variable alias), and fails CI — the
   implementer must consciously touch a second, separate file to add a
   predicate.
3. **CONCLUDE:** Option (c), mirroring AD-10's build-output-grep pattern
   via `T18-3`, is correct — it is the only option whose friction is
   structurally separated from the edit it is meant to gate, which is the
   property that makes AD-10's original deny-confinement check (`T15-2`)
   actually work. **Decision confirmed: T18-3 stands as designed, applying
   the AD-10 pattern to the Bash-bypass predicate list.**

## Outcome

All six decisions confirmed the design already shipped in
`docs/plans/plan-phase-a.md` — no revision was required. The Clear-Thought
pass functioned as a genuine independent check rather than a rubber stamp:
it surfaced a sharper framing for N5 (the placement is *required* by
Step 21's existing spawn site, not merely *defensible* as an early
placement choice), which is now reflected in the plan's §10A N5 entry.

This resolves `docs/plans/plan-phase-a.md` §15 Q-gap-5 in full.
