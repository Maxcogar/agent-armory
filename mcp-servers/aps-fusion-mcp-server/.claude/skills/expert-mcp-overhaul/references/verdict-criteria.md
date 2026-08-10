# Verdict Criteria: Repair or Rebuild

Read at Phase 4. This file turns the Phase-3 findings into one determination — repair the existing server, or rebuild it — by an evidenced rule rather than a gut call. The verdict is an engineering conclusion the agent reaches and defends; the user ratifies the direction (a type 3 decision, because it is expensive to reverse), but they ratify a recommendation, not a coin flip.

## The governing distinction

The determination rests on one test, drawn from this project's patch-vs-foundational gate (agent-compliance-checklist.md, Gate 8): **is the defect a wrong or missing step within a sound approach, or is the approach itself wrong?**

- A defect *within* a sound approach is **patch-level**: the skeleton is right, a step is missing or wrong. Repair territory.
- A defect *in* the approach is **foundational**: fixing it means changing the shape of the thing, not adding a step. Rebuild territory.

Gate 8's own examples map directly: "I chose the wrong architectural approach" is foundational; "I missed a step that fits within the correct approach" is patch-level. For an MCP server, the "approach" is its transport generation, its trust model, its shared plumbing (the config/auth/error substrate every tool inherits), and its structural testability. When those are sound, defects are patches on a good frame. When one of those is wrong, patches accumulate on a frame that stays wrong — the exact failure Gate 8 names: "re-submitting a corrected version of a plan that needed to be thrown away."

## Rebuild indicators

Any one of these, established by Phase-3 findings with evidence, is a serious rebuild indicator. Two or more make rebuild the default that repair has to argue its way out of.

- **R1 — Unsound trust model by design.** The server's architecture has no place to put the missing security control — validation isn't absent from one handler, it's absent from a design that assumed the model was trusted. Retrofitting a trust boundary means re-architecting the request path. *Evidence:* the Domain C findings show the gap is structural, not per-handler.
- **R2 — Deprecated protocol generation.** The server is built on a transport or SDK generation the current spec has superseded, and migrating forward is a breaking structural change, not a version bump. The clearest case: built on the deprecated HTTP+SSE transport when the current spec is Streamable HTTP. *Evidence:* Domain A4/F1 findings, cited to the fetched spec revision and the installed SDK version.
- **R3 — Shared-plumbing defect with broad blast radius.** A foundational defect lives in code that most tools inherit — the shared config parser, the shared auth check, the shared error wrapper — so the same defect is present in a majority of tools by construction. Fixing it per-tool is patching around a broken foundation; fixing it at the root may mean rebuilding the substrate the tools sit on. *Evidence:* a systemic finding grep'd across the inventory (Phase 3) showing the instance count and the shared origin.
- **R4 — Abandoned or compromised substrate.** A core dependency is unmaintained, or carries an unpatched vulnerability with no fixed version available, and it is load-bearing rather than peripheral. *Evidence:* the Domain C11 vulnerability-audit output plus the dependency's maintenance status.
- **R5 — Repair cost provably exceeds rebuild.** The count and spread of foundational findings is large enough that repairing each one, in sequence, with verification, costs more than building correctly from the spec — and the repaired result would carry lower confidence because the frame it patches was never sound. *Evidence:* the foundational-finding count from Phase 3 and the reasoning for why they do not localize.

R5 is a judgment call and must be labeled as one in the output — it is the one indicator not reducible to a single binary observation. State the finding counts it rests on so the user can check the judgment.

## Repair indicators

Repair is the right call when the frame is sound and the defects sit on top of it:

- **P1 — Defects localize.** Findings are confined to specific handlers or specific code paths, not woven through a shared foundation. Each fix touches a bounded area.
- **P2 — Current generation.** The server uses a current-generation transport and a supported SDK version; no structural migration is pending. *Evidence:* Domain A/F findings show conformance, cited to the fetched spec and installed SDK.
- **P3 — Trust model has a home.** The architecture has a coherent place to add the missing controls — a boundary layer, a middleware seam, a validation point — even if that place is currently under-used. The control is missing from a structure that can hold it, not from a structure that assumed it away.
- **P4 — Testable structure exists.** Handlers are separable from transport; dependencies can be faked or injected. The repaired server can be verified without rebuilding it to make it testable. *Evidence:* Domain G findings.
- **P5 — Sound substrate.** Core dependencies are current, maintained, and clean on the vulnerability audit.

## The scoring table

Produce this table in the Phase-4 output. One row per indicator that the findings trigger; every row cites the finding IDs behind it. The table is the visible reasoning, not decoration.

| Indicator | Fires? | Finding IDs | What the evidence shows |
|---|---|---|---|
| R1 unsound trust model | yes/no | … | … |
| R2 deprecated generation | yes/no | … | … |
| R3 shared-plumbing blast radius | yes/no | … | … |
| R4 abandoned/compromised substrate | yes/no | … | … |
| R5 repair cost > rebuild (judgment) | yes/no | … | … |
| P1 defects localize | yes/no | … | … |
| P2 current generation | yes/no | … | … |
| P3 trust model has a home | yes/no | … | … |
| P4 testable structure | yes/no | … | … |
| P5 sound substrate | yes/no | … | … |

**Reading the table.** The verdict is not a tally of yes-counts — one R-indicator can outweigh five P-indicators, because a single foundational defect means patches accumulate on a wrong frame. Weigh the rebuild indicators first: if any R fires, the burden is on repair to show the foundational defect is genuinely containable. If no R fires and the P-indicators hold, repair is correct. State the weighing in prose beneath the table, not just the table.

## Output format

The Phase-4 verdict output contains, in order:

1. **The scoring table** above, every row cited to findings.
2. **The verdict**, stated plainly: `Verdict: REPAIR` or `Verdict: REBUILD`. No third option — a server that is "mostly salvageable with some rewriting" is one or the other, decided by whether the rewriting is patch-level or foundational, and this file's whole purpose is to make that call rather than dodge it. (The soft-middle failure is failure mode 12 in the main skill; it applies to this verdict as much as to the completion verdict.)
3. **The reasoning** — the prose weighing of R against P, naming why the deciding indicators decide.
4. **The reversal condition** — the specific discovery that would flip this verdict. "If Phase-5 spec work reveals the shared config parser can be replaced without touching the handlers, R3 downgrades and this becomes REPAIR." A verdict with no stated reversal condition has not been thought through hard enough to know what it depends on.
5. **The scope implication** — one line on what the verdict means for Phase 5: a REPAIR spec targets the specific findings; a REBUILD spec targets the full target-state from the empty directory.

## A note on partial rebuild

Occasionally the honest answer is "rebuild this subsystem, keep the rest" — the auth layer is foundationally wrong (R1) but the tool handlers are sound (P1, P4). This is a valid verdict, stated as `Verdict: REPAIR with foundational replacement of [subsystem]`, with the scoring table run twice: once for the subsystem (which scores rebuild) and once for the remainder (which scores repair). Do not use this as an escape from the binary — it is only valid when the subsystem boundary is a real architectural seam the findings can point at, not a convenient way to avoid committing. If the "subsystem" is really the shared plumbing every tool inherits, that is R3 and the verdict is REBUILD.
