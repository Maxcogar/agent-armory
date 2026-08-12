# expert-dev-tools — known defects

Standing list of defects found in the shipped plugin and not yet fixed. Same discipline as
`NOVA-BACKLOG.md` in the Nova repo: every entry carries **evidence read at `file:line`**, a
**forcing function** (the thing that must not happen until it closes), and a **stable ID** so a
later plan cites `EDT-2` instead of re-describing it.

Closing an item: strike it through, move it to `## Closed`, record the commit. Never delete.

**Found**: 2026-08-12, during a live `/expert` run on `Maxcogar/NOVA` (architecture phase, MCP
integration fleet layer). All evidence below re-verified against this repo at `f9cbdbf`, which is
the commit the running plugin (v0.2.1) was installed from — the marketplace clone at
`~/.claude/plugins/marketplaces/claude-armory` is at that same commit.

---

| ID | Item | Severity | Forcing function | Status |
|---|---|---|---|---|
| EDT-1 | Lifecycle opening on an already-approved artifact still routes through the earlier phase | Serious | Any `/expert` run that resumes mid-lifecycle | OPEN |
| EDT-2 | Feedback sweep returns occurrence *counts*; the ledger schema requires occurrence *records* | Serious | Any attempt to persist `signature_history` | OPEN |
| EDT-3 | `feedback_marker` is never returned, so it can never be advanced | Moderate | Second and every subsequent sweep on a project | OPEN |
| EDT-4 | `failed_correction` / `stale_deployment` verdicts are emitted without a store lookup | Moderate | Any sweep on a project with no prior correction records | OPEN |
| EDT-5 | Shipped `.js` is delivered CRLF on Windows; the Workflow tool refuses to launch it | Serious | Any Windows install of the plugin | OPEN |

---

## EDT-1 — A lifecycle that opens with an already-approved artifact still runs the earlier phase

**Evidence.** `commands/expert.md:37-39` instructs the command tier: *"If the ledger is missing,
initialize a fresh one at `intake`."* `workflows/expert-lifecycle.js:487` then takes that verbatim —
`let cursor = ledger.phase || 'intake'` — and runs forward from it. Nothing consults
`artifact_index[].approved_by_owner` when choosing the opening phase, even though the ledger already
carries it and `scripts/ledger.schema.json:51,63` make it a required field on every artifact.

The command tier does have a phase transition (`commands/expert.md`, step 5, *"Advancing past the
intent gate (S-5)"*), but it fires **only after** an `owner_gate` round-trip. There is no path for a
lifecycle whose spec was approved *before* the ledger existed.

**Observed.** A fresh ledger was initialized at `intake` with the spec registered
`approved_by_owner: true` and the architecture `false`. The workflow dispatched
`expert-spec-writer`, which correctly halted with `wrong_phase_dispatch` and wrote nothing — its
own halt text cites the ledger's approval flags as one of three grounds. **Cost: 58,079 tokens for
no artifact.** The correct opening phase was fully determined by data already in the ledger.

**Fix direction.** Derive the opening phase from artifact approval state rather than hard-coding
`intake` — the first phase whose output artifact is not registered-and-approved. The rule the
spec-writer applied to reject the dispatch is the same rule that should have selected the phase.

**Why it matters beyond the token cost.** The halt was graceful here only because
`expert-spec-writer` is well-built. A phase agent that instead "did its best" would have forked an
owner-approved artifact — precisely what `approved_by_owner` exists to anchor against.

---

## EDT-2 — Feedback sweep returns occurrence counts; the ledger requires occurrence records

**Evidence.** `workflows/expert-lifecycle.js:243`, inside `FEEDBACK_SCHEMA`:

```js
occurrences: { type: 'integer' },
```

`scripts/ledger.schema.json:157-165`, inside `$defs.signature_record`:

```json
"occurrences": {
  "type": "array",
  "minItems": 1,
  "items": {
    "required": ["project", "session_file", "date"],
```

An integer cannot be expanded into that array without inventing `session_file` and `date`.

**Consequence.** `signature_history` can never be written truthfully, so the repeat-complaint
detector — the plugin's entire cross-session learning loop — has no memory. Worse,
`commands/expert.md:100-116` instructs the command tier to upsert signatures **keyed on
`(project, session_file)`** and warns at length against double-counting. Both key fields are
required by the schema and neither is ever returned, so the de-duplication rule it describes cannot
execute at all.

**Observed.** The sweep returned 18 dispositions with counts up to 9. None could be persisted. The
findings were written to a human-readable record in the consuming project instead
(`.claude/expert/reviews/feedback-sweep.md` in `Maxcogar/NOVA`), which is a workaround, not a fix —
the next sweep has no way to know they were already found.

**Fix direction.** The diagnostician necessarily identified specific sessions in order to count
them; that detail is discarded on the way out. Return the occurrence records and let the count be
derived from `occurrences.length`.

---

## EDT-3 — `feedback_marker` is never returned, so it can never be advanced

**Evidence.** `FEEDBACK_SCHEMA` (`workflows/expert-lifecycle.js:232-247`) declares no marker
property. Line `:414` returns `(out && out.feedback_dispositions) || []` — dispositions only. The
`report()` builder at `:417-422` assembles
`{ ledger_delta, review_records, feedback, feedback_escalation }` with no marker field anywhere.

Meanwhile `commands/expert.md:99` instructs the command tier to *"Persist the advanced
`feedback_marker`"*, and `:111` warns that *"a `feedback_marker` reset re-reads history that is
already recorded; it **must not** double-count it."* The command is told to persist a value the
report never carries.

**Consequence.** Every sweep re-reads the project's entire transcript history from
`{session_file: null, line: 0}`.

**Observed cost.** 127,010 tokens for one sweep over 41 transcript files (~60 MB). That is the
floor, and it grows with every session the project accumulates.

**Fix direction.** Same subsystem as EDT-2 — add the marker to `FEEDBACK_SCHEMA` and thread it
through `report()`. Fix together.

---

## EDT-4 — `failed_correction` and `stale_deployment` are emitted without a store lookup

**Evidence.** `workflows/expert-lifecycle.js:244` admits both verdicts by enum alone:

```js
verdict: { type: 'string', enum: ['course_correction', 'systemic_defect', 'failed_correction', 'stale_deployment'] },
```

Nothing requires a matching signature record carrying a `correction` block. But both verdicts are
*defined* by one: `scripts/ledger.schema.json:176-186` makes `correction.fixed_in_version` the field
that, per `commands/expert.md`, drives the `failed_correction` vs `stale_deployment` split.

**Observed.** The sweep returned `failed_correction` for the hook-config signature (8 occurrences)
and the workflow raised a `feedback_escalation` on it. **No backing record existed in either
store**: the project ledger's `signature_history` was empty (first sweep), and the shared store at
`~/.claude/plugins/data/expert-dev-tools-claude-armory/defect-history.json` holds exactly one
record — a different signature, project `agent-armory`, `state: "open"`, no `correction` block.

A `failed_correction` means "a recorded fix did not hold." With nothing recorded as fixed, the
verdict asserts something no stored data supports, and it reaches the owner through the one
escalation path explicitly forbidden from auto-remediation.

**Fix direction.** Gate both verdicts on an actual lookup. With no matching record carrying a
`correction`, cap the verdict at `systemic_defect`.

---

## EDT-5 — Shipped `.js` is delivered CRLF on Windows; the Workflow tool refuses to launch it

**Evidence.** The source blob is clean — `workflows/expert-lifecycle.js` at `f9cbdbf` contains **no
CRLF** (25,516 bytes at v0.1.0; 44,763 at v0.2.1, LF-normalized). The delivered copy at
`~/.claude/plugins/cache/claude-armory/expert-dev-tools/0.2.1/workflows/expert-lifecycle.js` **does**
(45,530 bytes). The marketplace clone at `~/.claude/plugins/marketplaces/claude-armory` has
`core.autocrlf=true`, so checkout converts LF→CRLF on delivery.

**Consequence.** `Workflow({scriptPath})` is rejected before it runs:

> `script contains control characters that would be hidden in the approval dialog`

The `\r` is counted as a hidden control character. **On Windows the plugin cannot launch its own
workflow from its installed path.** Byte-level scan confirmed CRLF is the only control character
present — there is nothing else wrong with the file.

**Fix direction.** Add `.gitattributes` at the repo root pinning line endings for shipped scripts:

```gitattributes
*.js text eol=lf
```

`.gitattributes` overrides `core.autocrlf`, so the marketplace clone checks out LF on every machine.
**No `git add --renormalize` is needed** — nothing CRLF is committed; the conversion happens at
install-time checkout, not in the repo.

**Workaround used.** An LF-normalized copy was run from a scratchpad path, verified
content-identical ignoring `\r`, with the installed plugin left untouched. The script has no
`__dirname`, no Node APIs and no self-relative path resolution, so relocation is behaviour-preserving.

---

## Closed

*(none yet)*
