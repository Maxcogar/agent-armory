# Handoff — Context Oracle architecture rebuild

**To:** the next session. **Job:** rebuild the architecture document,
verification-first. No build before it.

## The situation, in one paragraph

The spec (`docs/specs/spec-context-oracle.md`) is sound, and the two
design-gating validation spikes are done and passed. An architecture document
was written (`docs/architecture-context-oracle.md`) and then found, by an
`/expert-review` pass, to be untrustworthy: 11 findings sharing **one root
cause — correctness and completeness were *asserted but never established*.**
It cannot be built from. Your job is to rebuild it so every claim is
*established from source*, with the collapse test (`CLAUDE.md`) active from the
first decision. This is **not** patching the 11 findings; it is re-deriving the
document.

## Read first, in this order

1. `docs/STATUS.md` — plain-language state.
2. `CLAUDE.md` — the whole file, especially **"no hollow decisions — the
   collapse test"** and the lifecycle. This is the discipline that was missing
   the first time.
3. `docs/collapse-log.md` — the specific ways this project has gone hollow.
   Read it before designing so you don't repeat them.
4. `docs/judgment-layer-corrected-foundation.md` — the corrected core, anchored
   on spec **FR-A1**. The judgment layer rebuilds from this.
5. `docs/specs/spec-context-oracle.md` (all of it) and `RETHINK.md` §12 +
   addendum — the sound foundation and the owner's locked decisions.

## The one thing that must not repeat: *asserted, not established*

Every finding below is the same failure — a property claimed true without the
check that makes it true. In the rebuild: compute every number, enumerate every
"all/every" claim, tie every "verified" to the actual source read, and derive
every design from the mission (FR-A1) — never from what *sounds* complete. Run
the collapse test on every load-bearing decision, and dispatch the independent
collapse-hunt: a fresh subagent whose only job is to try to collapse each
decision against the mission (not to check citations). Use `/expert-review`
before delivery.

## Keep (verified / grounded) — but still collapse-test each before trusting it

- **Both validation spikes** — piggyback credential inheritance (PASS in the
  cloud environment; local subscription-login inheritance is a Phase-1 runtime
  check) and subagent context injection (PASS), plus the measured
  transcript-lag. Evidence is in the architecture doc's "Validation spikes"
  section. Real; keep them.
- **The FR-A1 corrected judgment foundation** — the anchor for D10/D12/D13.
- **Grounded decisions likely to survive:** store schemas (D6/D7, provenance
  made structural), the harness-neutral event contract (D8), the indexer and
  miner (D16/D17). Do not assume they survive — pass each through the collapse
  test first.

## Re-derive from scratch

- **The judgment core (D10/D12/D13)** on FR-A1 — grounded generation: the model
  composes and judges; every factual claim is verified against store provenance
  before delivery; output is validated to informative, non-imperative form. The
  old select-from-a-list + existence-check design was rejected by the owner as
  unusable.
- **Everything that depended on the old judgment design:** threat T1, ASVS
  chapters V1/V2, delivery (D15), the Phase 8 attestation, and the build-order
  sequencing of the model lane.

## The 11 findings — the punch-list the rebuild must clear

1. **(Critical / Systemic)** Judgment layer (D10/D12/D13) hollow — select-only +
   existence-check; fails the collapse test; contradicts FR-A1. Propagates into
   T1 and ASVS V1/V2.
2. **(Serious)** "Tools disallowed" is asserted in D11/D12/T4, but the `claude
   -p` invocation carries no tool-restriction flag. Add `--disallowedTools` (or
   an empty `--allowedTools`) — verified to exist in the CLI — and point the
   claim at it.
3. **(Serious)** Concurrency (D24): synchronous `node:sqlite` per-event writes
   can busy-wait up to `busy_timeout=2000ms` on the event-loop thread, blocking
   the *next* event — an NF-1 breach during indexing. Route event-loop writes to
   the writer worker, or use a busy_timeout well below the NF-1 budget with
   drop-on-contention.
4. **(Moderate)** D2 matrix totals are wrong: the cells give 8.7 / 6.2 / 7.0,
   not 8.8 / 6.4 / 6.1 (and 7.0 > 6.2 inverts the two losers' order).
5. **(Moderate)** ASVS V15 (Secure Coding and Architecture) is omitted while the
   doc claims "V1–V17 verified." Add it: dependency hygiene (D3), fail-open
   discipline, DAO trust constraints (D6).
6. **(Moderate)** Phase 8 attestation misnames which decisions carry
   matrices/chains — it credits D11/D12/D16/D17 (which have neither) and omits
   D3/D4 (which have full matrices).
7. **(Moderate)** D13 claims `systemMessage` is "verified: not shown to the
   model" — only user-visibility was established, not the negative that AC-10 /
   FR-D4 / FR-M4 depend on. Downgrade to a Phase-1 check or verify it.
8. **(Moderate)** The secret scanner (D19) is missing from the build order,
   though AC-12 is a Phase 0 exit and scanning must precede indexer ingestion.
9. **(Moderate)** Threat T1 misses the `zone_evidence` path — the generated-file
   warning quotes raw file-head repo text verbatim without running it through
   the injection-suspect flagger first.
10. **(Minor)** AC-10 is double-listed in the build order and placed in Phase 1;
    spec §12 assigns it to Phase 2 only.
11. **(Minor)** The ASVS row in the Standards table governs a table, not a
    decision — a borderline exception to "no decorative standards."

## Method

Rebuild via the architecture command with the collapse test in force from
decision 1. Establish every fact against source (spec at file:line, library
behavior via Context7, runtime facts via the spikes). Dispatch the independent
collapse-hunt. Run `/expert-review` before delivery, and verify every citation
line-range against the actual spec text — several were wrong in the first
draft. The old architecture document is a reference for the grounded parts and
for what *not* to trust — not a base to patch.
