# Round 1 findings — RECONSTRUCTED, not the original review output

**Artifact reviewed:** `docs/architecture-context-oracle.md` as rebuilt at
`e0343e7` (2026-07-22).
**Passes run:** adversarial collapse-hunt (mission fidelity) + `/expert-review`
(premise + standards), dispatched independently and in parallel before any
finding was applied, per `CLAUDE.md`.
**Fixes applied at:** `c82ab2f` — *"Apply collapse-hunt + expert-review findings
to Context Oracle architecture"*.

> **Provenance warning — read before using this file.**
> This is a **reconstruction assembled on 2026-07-30**, not the output either
> review pass produced. Neither pass's output was written to a file at the time.
> It is assembled from exactly two secondary sources:
>
> 1. `docs/collapse-log.md`, section *"2026-07-22 — architecture rebuild
>    collapse-hunt"* — complete for the collapse-hunt findings (mandated by
>    `CLAUDE.md`, so it survived), and carrying a compressed *"Also caught by
>    expert-review"* subsection.
> 2. The commit message of `c82ab2f` (`git show c82ab2f`).
>
> **What is therefore missing:** the expert-review's per-finding **named
> standard**, its file:line premise-verification evidence, its inventory, and its
> verdict breakdown. Post-fix closure requires closing each prior finding against
> *its originally named standard* (`expert-review` SKILL.md Gate A). For the
> items below marked **standard not recorded**, that closure cannot be performed
> as specified — the honest disposition is a **tentative closure** with this gap
> named, not a confident one.
>
> This file is a prior-document claim. Re-derive every item from current source
> before treating it as a finding (SKILL.md Step 6, line 44).

---

## Collapse-hunt findings (mission-fidelity axis) — 6

Fully preserved in `docs/collapse-log.md`; that file is the authority for these,
including each collapse question verbatim. Summarised here as closure items only.

| # | Decision | Class | Fix applied | Targets |
|---|----------|-------|-------------|---------|
| 1 | `decision-impact` left undefined; learning loop can only ratchet toward silence | mechanism-not-mission + wrong-check | `decision-impact` = model-emitted `materiality` × structural weight; explore budget; computable regret proxy | D10, D12, D21 |
| 2 | Answer genre re-collapsed to "nicely-phrased FTS"; retrieval was the unacknowledged author | reduction + decision-hiding | Move-A retrieval promoted to first-class with a bounded tool-free retrieval-shaping sub-turn; retrieval-reach cap stated honestly | D10, D12 |
| 3 | Conduct genres framed as "policing posture" — **the hunt itself was wrong here** | overcorrection/reduction (the author's error, not the design's) | D14 reframed: advisory, mission-aligned, **enabled by default**; misframed owner yes/no removed from STATUS | D14, FR-A8/A9 |
| 4 | FR-X6 audit log placed in the droppable "bookkeeping" class | wrong-check | `whisper_log` + `suppressions` made non-droppable — if a whisper cannot be logged it is not sent | D24 |
| 5 | T1 overclaimed "bounded by construction"; grounding does not inspect fact text | unverified/overclaim | T1 corrected to defense-in-depth; default pointer-only for all repo-derived spans | T1, D13 |
| 6 | `Unknown` genre neither mechanized nor deferred; grounding-id rule structurally precluded it | reduction | Mechanized via a negative-evidence fact (bounded determining-query returning empty is bindable; pointer = query + empty result) | D12, D6 |

**Finding 3 is a standing caution, not just a closed item.** The hunt collapsed
an owner-approved feature in the *wrong direction*, and Max Cogar overturned it.
The durable lesson is recorded in `collapse-log.md` and must be inherited by any
future hunt: a "posture" collapse distinguishes *blocking* (removed by the
rethink) from *observing/informing* (the mission), and never converts an
owner-approved feature into an owner-facing "should we keep it?" question.

---

## Expert-review findings (premise + standards axis) — partially preserved

### CRITICAL — `--bare` breaks the piggyback

**Preserved in full** (`collapse-log.md`; `c82ab2f`).

- **Claim:** the D11 model command carried `--bare`, whose `claude --help` states
  "OAuth and keychain are never read."
- **Verification recorded:** run live in the credential-less host-managed
  environment — **3/3 Authentication error**; the same command *without* `--bare`
  succeeds.
- **Root cause:** the Spike-1 re-run omitted `--bare`, so it never exercised the
  design's real command — a load-bearing premise self-certified but never run.
- **Fix:** `--bare` removed (incompatible with OWNER-7); recursion guard
  re-derived on cwd-isolation + `CTXORACLE_INTERNAL` env-guard + fresh session-id
  + env-scrub; AC-11 retargeted to assert zero oracle-hook firings for the
  **non-`--bare`** child.
- **Standard:** not recorded. *(Closure tentative.)*

### HIGH — two, from `c82ab2f`

| Finding | Fix applied | Targets | Standard |
|---------|-------------|---------|----------|
| `decision-impact` undefined + silence-only ratchet | materiality × structural_weight, materiality emitted in the Move-B verdict; explore budget + regret proxy as real up-signals | D10, D12 | not recorded |
| Answer genre collapsed; retrieval unspecified | retrieval first-class, bounded tool-free shaping sub-turn, retrieval-reach cap stated | D12 | not recorded |

*(Both overlap collapse-hunt findings 1 and 2 — both passes found them
independently.)*

### Moderate / Minor — from `c82ab2f`

All fixes applied; **no named standard recorded for any of these**, so all
closures are tentative:

- FR-X6 audit record made durable, logged-before-sent → D24
- Conduct genres scoped to present-conflict form → D14 *(later corrected by the
  owner, see collapse finding 3)*
- `Unknown` genre mechanized via negative-evidence fact → D12, D6
- D24 collapse test added *(round-1 review found the Phase-8/Gate-C attestation
  claimed a D24 collapse test that **did not exist** — a false self-attestation)*
- `--json-schema` corrected to inline JSON, not a file path → D11
- `so_what` added to Move-C validation → D12
- T1 corrected to defense-in-depth, pointer-only default for repo spans → T1, D13
- **SubagentStart orientation gated on a real task signal → D15** *(recorded only
  in the commit message; absent from `collapse-log.md`)*
- **Degraded-mode scope stated honestly → D20** *(recorded only in the commit
  message; absent from `collapse-log.md`)*

### Not preserved

- The expert-review's **verdict line and finding-count breakdown**.
- Its **Scope and Inventory** section, so round 1's inventory cannot be inherited
  as round 2's first post-fix inventory source. Round 2 must construct that
  source from the architecture-review rule instead (the document plus every file
  it cites as a Source / Verified-by premise) and record the substitution.
