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
   *(Refined and partly corrected by #14, 2026-08-29: this entry conflates two
   different tools — the reproducible **synthetic planted-history fixtures**
   AD-24 already specifies, and **real-transcript replay** (#14), whose ground
   truth is not planted. And "sanitized" is too broad; #14 narrows it to
   shape-preserving secret substitution only. Read #14 with this.)*
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

Added 2026-07-17 (architecture session):

11. **Subagent orientation at spawn.** **Researched.** The current hooks
    contract (verified 2026-07-17) documents `additionalContext` on
    `SubagentStart`, delivered into the subagent's own transcript — a
    direct channel for a small task-scoped orientation whisper the moment
    a subagent starts, before its first tool call. Adopted as an optional
    path in architecture D15; the idea worth exploring further is
    task-shape matching: using the parent's Task prompt (visible in the
    parent transcript) to pick which facts the subagent gets.
12. **Warm-spare judgment process.** **Researched** (flag verified in CLI
    v2.1.212: `--input-format stream-json` with `-p`). Keep one pre-spawned
    judgment process ready to cut the measured ~2 s spawn overhead from
    Lane 2 latency. Rejected for v1 in architecture D10 (cross-judgment
    context contamination in one growing session; benefit unmeasured —
    P7 says tune from measurement). Revisit once the D26 replay harness
    can measure Lane 2 turnaround against real sessions.
13. **Embedding-based recall for the Answer genre.** **Unvalidated.** D12's
    Move-A0 sub-turn widens retrieval by letting the model propose query
    terms, but the honest cap stands: an answer living in code no query term
    reaches resolves to "I don't know" (FR-S3). A local embedding index over
    indexed symbols and doc-comments would give semantic recall without a
    network dependency (C-1 forbids native toolchains, so any candidate must
    ship as WASM or pure JS). Worth measuring only once the D26 replay
    harness can quantify how often Answer misses for want of reach — P7,
    tune from measurement. *Entered 2026-07-30: the architecture's
    Limitations section already cited this as an IDEAS candidate while the
    ledger had no such entry (finding F9b) — the cross-reference now
    resolves.*

Added 2026-08-29 (testing-methodology discussion with Max Cogar):

14. **Discovery-mode real-transcript replay.** **Unvalidated.** Replay Max
    Cogar's *real, unmodified* Claude Code session transcripts through the
    oracle's real handler binary to observe how it behaves — reconstructing the
    hook-event stream (`UserPromptSubmit`, `PreToolUse`/`PostToolUse`/
    `PostToolUseFailure`, `Stop`, subagent events) and the `transcript_path`
    state from the stored transcript, then watching what the oracle fires,
    stays silent on, and how fast. This is a **distinct tool** from AD-24's
    synthetic fixtures and from #6's framing, and the distinction is the whole
    point of the entry:

    - **Vs. AD-24 synthetic fixtures:** those are generated repos with *planted*
      history (a known coupling pair, a revert chain, a planted secret) where
      ground truth is known because it was planted — a reproducible correctness
      test of *known* properties. Real-transcript replay has *no planted ground
      truth*; its job is the opposite — **discovery**, surfacing behaviour and
      failure classes nobody thought to plant. The two are complementary and
      feed each other: discovery finds what the fixtures should later pin.

    **What it can measure (and where volume genuinely pays off):**
    - **Classifier/recognizer boundary behaviour against real phrasings.** The
      question/request, info/request, and done-claim recognizers are where this
      design has repeatedly collapsed under review (STATUS / collapse-log
      2026-08-29: communicative-verb, lexicon, artifact-object-mechanism). A
      large real corpus is how you exercise those boundaries against phrasings
      no one would think to author. Highest-value use.
    - **Silence/chattiness rate, and tail latency** (p95/p99 need volume — the
      tail only appears over many events; ties to NF-1 / the AD-23 watchdog).
    - **Rare transcript modes** (e.g. the marker-absent `claude -p` shape, V12)
      — rare per session, so coverage is a volume problem; and one of the two
      named build-time verifications (marker presence on Max Cogar's *real*
      interactive transcripts; whether platform-injected turns fire
      `UserPromptSubmit`, AD-24 / L11) can only be answered from this corpus.
    - **Pipeline robustness** on messy real input (real transcripts are the mess
      that breaks parsers; synthetic fixtures are too clean to find it).
    - **Regret ground-truth mining** — real agent mistakes that became reverts /
      fix-of-a-fix commits are the ground truth for "a whisper here would have
      helped," feeding both AD-18's regret proxy and future fixtures.

    **What it structurally CANNOT measure — the off-policy / counterfactual
    limit (state this so no one over-claims):** these transcripts are from
    sessions where the oracle was *absent*. The recorded agent never received a
    whisper, so it never reacts to one. Therefore **hit rate, whisper efficacy,
    confidence calibration, and the value of the two blocks** (RETHINK §10's
    outcome metrics) are **unmeasurable from replay, and no amount of volume
    changes that** — the blind spot is structural, not a sample-size problem. A
    *block*, especially, would rewrite the trajectory, so the replayed remainder
    is fiction from the block onward. **Guard:** a green replay run never means
    "the oracle works"; optimizing the oracle to score well on replayed logs is
    a Goodhart trap, because you are tuning its firing distribution against
    trajectories it cannot influence. Outcome validation needs a small number of
    real closed-loop sessions; replay is a pre-filter, not a substitute.

    **On volume (recorded because it was contested and resolved):** volume *is*
    valuable — for everything in the "can measure" list above. Its payoff lives
    in **taxonomy-blind, anomaly-surfacing capture**, NOT in filtering the
    corpus to problem types you already know to look for. Narrowing the
    discovery corpus to known-queryable problems is a logged **reduction**
    collapse (collapse-log 2026-08-29, "narrowing the discovery-test corpus")
    and defeats the tool's own unknown-unknowns purpose. Discovery stays wide
    and un-pre-classified; the only admissible structure is
    divergence/outlier/self-announcing-failure signals that presuppose no
    failure class.

    **On sanitization (corrects #6's blanket "(sanitized)"):** for a corpus that
    lives on Max Cogar's own machine, feeding his own tooling, replayed by him,
    there is no party to sanitize *from* — broad redaction (customer names,
    source, business data) only costs realism, removing session opportunities
    the oracle should see, and blanking a secret would additionally break the
    AC-11 secret-detection path (the detector needs to *see* a secret-shaped
    token). The one warranted pass is a **secret-scan with shape-preserving
    substitution**: replace any live credential that landed in a transcript with
    a syntactically valid *fake* of the same shape — liability hygiene for a
    durable archive, at near-zero realism cost because the detector still sees
    the shape. Everything else stays untouched.

    **The two-phase model this implies:** (1) discovery — this, wide and
    taxonomy-blind — produces the problem taxonomy; (2) regression — AD-24's
    synthetic fixtures — pins each named class reproducibly. Opposite
    relationships to the taxonomy; do not conflate (collapse-log 2026-08-29).

    **Promotion note.** This is an *idea*, unvalidated, and it is deliberately
    the "cheap idea" tier. Making the discovery-breadth rule *binding* on future
    agents (so a later session cannot narrow it away) requires promoting it to a
    spec §14 requirement with Max Cogar's explicit sign-off — a decision only he
    makes. Until then the collapse-log entry is the guardrail; this entry is the
    proposal.
