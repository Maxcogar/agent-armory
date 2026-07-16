# Context Oracle — ideas ledger

Agent-maintained, per `CLAUDE.md`. Each entry: the idea, why it would
matter, and its evidence status (**unvalidated** → **researched** →
**prototyped**). Promotion path: here → spec §14 with grounding → spec
requirement with owner sign-off. Ideas are welcome; ungrounded requirements
are not — this ledger is where the difference lives.

Seeded 2026-07-15, all entries **unvalidated** unless noted.

1. **Lights-out watchdog.** For long unattended runs: detect stuck loops
   (same failing command re-run N times), runaway token burn against a
   stated budget, and goal drift from the original prompt — whisper the
   pattern back to the agent, and record it for the owner's digest. Extends
   FR-A9's "conduct" family to autonomous-run pathologies, which is where
   the owner says this tool matters most.
2. **Owner digest.** A per-session plain-language summary written for the
   non-programmer owner: what the agent did, what the oracle said, which
   whispers were heeded/ignored, anomalies. The lights-out counterpart of
   `docs/STATUS.md` — the owner reads outcomes without reading transcripts.
3. **Pre-mortem whisper.** At plan/intent time, before the first edit: "the
   last three attempts at this task shape failed at X" — regret mining
   turned proactive. Needs recipe/failure history from Phase 2 first.
4. **Oracle self-test on init.** `ctxoracle init` ends by replaying a
   canned session against the freshly built index and reporting whether
   whispers actually flow end-to-end (hook → service → injection), so a
   broken install is caught at minute zero, not silently during real work.
   Cheap, directly serves OWNER-10.
5. **Confidence calibration tracking.** Compare each whisper's stated
   confidence against measured uptake over time; a genre whose 0.9 claims
   land like 0.5 claims gets its scores rescaled. Turns the §9.2 ladder
   from binary probation into continuous calibration.
6. **Synthetic replay harness.** Record real session event streams
   (sanitized) and replay them against candidate oracle changes — every
   tuning change gets scored against history before it ships. This is the
   agent-led project's substitute for a human QA team; likely the highest
   leverage item here.
7. **Unknowns ledger.** When the oracle names an unknown ("nothing in the
   repo determines which screen this belongs on"), persist it; surface the
   accumulating list to the owner asynchronously. The repo's ambiguity
   becomes a visible, owner-answerable queue instead of a per-session
   rediscovery.
8. **Cross-project lesson transfer.** The global store already collects
   per-user lessons; test whether whisper-efficacy tuning learned on one
   repo transfers to a new repo's cold start (better first impressions per
   FR-A7, faster warm-up per FR-A6).
9. **Verification-gap radar.** Track which changed regions were never
   exercised by any test/verification command before session end, and say
   so in the completeness whisper — merges FR-K1's test topology with
   stop-time whispers.
10. **Whisper A/B self-tuning.** Where volume permits, vary phrasing (with
    fixed facts) and measure uptake, letting the oracle learn how to be
    heeded, not just when to speak. Long-horizon; needs FR-L7 data first.

Added 2026-07-16 (architecture-phase session):

11. **Async observation profile.** *(researched)* Claude Code command hooks
    now document an `async: true` mode — the hook runs in the background
    and cannot inject context for that event (hooks reference, fetched
    2026-07-16). If a real environment ever breaches the FR-O3 latency
    budget despite the warm-service design, a per-event-type fallback
    profile could mark pure-observation events async (zero added latency,
    observation preserved) while keeping delivery-capable events
    synchronous. Costs whisper opportunities; worth having on the shelf
    only as a measured response to a real breach, never as a default.
