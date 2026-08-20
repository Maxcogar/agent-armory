# Diagnosis — "opining-without-reading-source / pattern-matching instead of verifying"

Corrections cycle 0.4.0. Signature state `open`, verdict `systemic_defect`, 5 occurrences
dated 2026-08-17, responsible component "expert-standard verification discipline"
(`C:\Users\maxco\.claude\plugins\data\expert-dev-tools\defect-history.json`, entries at
lines 104–116). The per-turn journal cited there (`wf_61b4beae-97b`) is not on this
machine's disk (`~\.claude\plugins\data\expert-dev-tools\` holds only
`defect-history.json`); the diagnosis below rests on the canonical live occurrence in the
session transcript, the acceptance record, and the current v0.3.0 source.

## 1. The failure mode, from evidence

Canonical occurrence, session transcript
`C:\Users\maxco\.claude\projects\C--Users-maxco-Documents-agent-armory\5071adeb-79e9-4b22-a2ab-fc4f5e03565a.jsonl`:

- **Line 1504 (assistant, command tier):** "**G-1 fails the live check.** … This is exactly
  why G-1 was held as a gap — **it could only be proven live** …" — a confident
  negative-capability claim ("this question is live-only") plus a live-test verdict.
- **Line 1507 (owner):** "I CALL BULLSHIT ON THAT. I KEEP GETTING TOLD OVER AND OVER AGAIN
  THAT SHIT HAS TO BE VERIFIED LIVE WHEN ALL YOU EVER HAD TO DO WAS JUST LOOK IT UP."
- **Line 1514 (assistant, conceding):** the load-bearing premise — *how Claude Code decides
  two plugin MCP servers are duplicates* — "was never looked up. The investigation inferred
  it from observing that one plugin's copy got skipped, and the fix was pattern-matched from
  agentboard's `.mcp.json` … it survived eight review rounds because every reviewer checked
  the claim was *cited*, not that anyone had consulted the actual documentation."
- **Line 1538 (assistant, after finally looking):** "It was on disk the whole time, in a
  JSON file anyone could have read: … `installed_plugins.json` shows expert-dev-tools
  resolves to a **cached copy installed July 24** (commit `8e2b9b3`) … Your
  `/reload-plugins` reloaded the *stale cache*, not the working tree. My 'G-1 fails the
  live check' was me testing a deployment that provably couldn't contain the fix —
  **knowable in one `cat` of a config file**, before asking you to reload anything."

So the concrete shape, generalized:

1. **An unverified claim about evidence availability.** "X can only be proven live" is
   itself an empirical claim, and it was stated from memory/pattern, never checked. The
   static tiers — official docs, on-disk config (`installed_plugins.json`, the cache's
   `.mcp.json`), cheap command probes — were skipped, not exhausted.
2. **The claim then licensed an expensive, wrong test.** The live reload tested a
   deployment that on-disk state proved could not contain the fix, and its failure was
   misattributed to the fix. The owner paid the cost (a reload cycle plus a false "fix
   failed" report).
3. **Eight review rounds did not catch it** because reviewers verified
   *citation-presence*, not *consultation*: the claim carried a citation slot, and nobody
   re-executed the lookup behind it.

The occurrence sits in the **command tier** — the `/expert` main-agent conversation —
outside every workflow-dispatched, verifier-checked phase. That location is not
incidental; it is the coverage hole (section 2).

## 2. Audit of current v0.3.0 source — what verification enforcement exists, and what it covers

### Exists (verified in source)

- **Anti-fabrication spot re-run** — `workflows/expert-lifecycle.js:647–693`: deterministic
  sample of the *implement phase's* cited verifications is re-executed by
  `expert-verifier`; mismatch ⇒ diagnose + gate. Cross-entry contradiction check at :650–:679.
- **Diff-vs-plan** (`:695`), **whole-chain reconciliation** (`:736`), **document-phase
  scope-check verifier with artifact-hash pinning** (`:828–:852`), all failing closed via
  `verifierUnderCovered` (`:465–468`) into `control_fault` gates.
- **Reviewer premise discipline** — every review finding requires `premise_evidence`
  (`expert-lifecycle.js:182`); `skills/expert-review/SKILL.md` bright line at :99/:297
  (unverifiable premise ⇒ tentative section, never a confirmed finding), tentative-findings
  section contract at :427, Gate B at :585 (library claims must record their Context7
  source).
- **Ambient discipline** — `skills/expert-standard/SKILL.md` observation axis (:16, :26,
  :40, :50): claims about code verified against current source before becoming findings.

### Does NOT cover (verified by absence)

- **Command-tier factual claims.** `commands/expert.md` governs intake classification
  (step 0), preflight (step 1), ledger writes (steps 2/4), write authority at gates (4b),
  and presentation (step 5). **No clause anywhere constrains the factual claims the
  command tier makes to the owner**, and no executable machinery can: every spot-check,
  verifier dispatch, and schema validation attaches to workflow-dispatched agents. The 0.2.1
  self-diagnosis closed the command tier as "the one ungated **writer**"
  (ACCEPTANCE-RESULTS-2026-08-17.md, defect 5 → 4b); it remains an ungated **claimer**.
- **No evidence ladder anywhere in the plugin.** A repo-wide grep for lookup-before-live
  language (`live`, `lookup`, `on-disk`) finds no rule ordering static evidence tiers ahead
  of live tests, and no rule treating "this is live-only" as a claim requiring
  verification. The lesson currently lives only in the operator's auto-memory
  (`feedback_lookup_before_live_verification.md`) — i.e., outside the shipped plugin, which
  is exactly why the signature is still `open`.
- **Preflight ignores deployment provenance.** Step 1 (F-2) probes that required MCPs
  *answer*; nothing determines **which deployment answers** — installed cache vs working
  tree, installed commit vs HEAD. The canonical occurrence is precisely this class: a live
  test run against a provably-stale cache, when `installed_plugins.json` held the answer.
- **Document-phase platform-behavior claims are never re-executed.** The spot re-run
  samples only implement-phase evidence; Gate B requires a citation be *recorded*. A
  platform-behavior premise in a spec/architecture (like the MCP dedup rule) can survive
  every round with a citation nobody re-executes — the eight-round survival, in machinery
  terms.

## 3. Correction draft — classification: **machine_applicable**

Two parts; the executable part carries the recurring concrete class, the prose part carries
the general class on the only surface that can reach conversational claims.

### Part A (executable, structural) — deployment-provenance preflight script

New `scripts/preflight-deployment.mjs` (deterministic, no agent, no tokens):

- Input: plugin name (default `expert-dev-tools`) and optional working-tree path.
- Reads `~/.claude/plugins/installed_plugins.json` (honoring `CLAUDE_CONFIG_DIR`), resolves
  the plugin's installed cache path, commit, and cached `plugin.json` version.
- When a working-tree path is given: compares cached `plugin.json` version and byte-diffs
  the cache's `.mcp.json` and manifest against the working tree.
- Emits a machine-readable report: `{cache_path, installed_commit, installed_version,
  worktree_version, stale: true|false, diffs: [...]}`; exit 0 always (it reports, the
  caller decides).

Wire-up in `commands/expert.md` step 1 (Preflight, F-2): run the script and include its
report in the preflight record. Bright line added to step 1: **no claim about the running
plugin's behavior, and no request that the owner reload/update/re-test, is made without
quoting this report** — if `stale: true`, the finding is `stale_deployment` (D15), not a
live-test verdict. This converts the canonical occurrence class from a judgment call into
a script output; the existing D15/stale-deployment presentation path in step 5 already
consumes the conclusion.

### Part B (prose on the skill, with justification) — the evidence ladder in `expert-standard`

Amend `skills/expert-standard/SKILL.md`, observation axis:

- **Evidence ladder:** for any empirical question, the tiers are (1) authoritative
  documentation, (2) on-disk configuration and state files, (3) cheap read-only command
  probes, (4) live execution. Live execution is the *last* tier, never the first.
- **Bright line:** "X can only be verified live / by running it" is itself an empirical
  claim. It may be stated only alongside the named lower tiers that were checked and what
  each returned. A live-only declaration without a lookup trail is the unverified-premise
  failure mode.
- Add to the "How to Know This Skill is Failing" signals: *live-only declarations without a
  lookup trail*, and *citation-presence standing in for consultation* (a recorded citation
  nobody executed is memory wearing a badge).
- Frontmatter `description` gains the activation trigger: "…or about to state that
  something can only be verified live or by running it."

**Why prose is justified here (per the hard constraint):** the residual surface is
natural-language claims in the main-agent conversation. There is no interception point — no
hook parses an owner-facing sentence, no schema validates it, and no verifier is in the
loop. Every mechanizable slice of the class is taken by Part A (deployment/config
provenance — the measured recurring slice); the skill amendment is the only instrument that
reaches the rest, and it is loaded by the command tier and every phase agent alike.
Convergence of the prose half is measurable by the machinery that already exists: the
feedback sweep's recurrence counting on this very signature.

### Noted candidate, not committed (owner-decidable scope)

Extend the spot re-run's deterministic sampling to document-phase evidence entries whose
`claim_type` is platform/library behavior (re-execute the cited lookup, not just record
it). This closes the eight-round-survival hole at the reviewer tier but widens verifier
cost per document round; flagged for the owner rather than bundled.

## 4. Verification — structural tier (`tests/structural/check-structure.mjs`)

Add checks (same style as existing `check(label, cond)` assertions):

1. `scripts/preflight-deployment.mjs` exists and parses (`node --check` via
   `execFileSync`, pattern already used in the file).
2. Run the script against a fixture `tests/fixture/installed_plugins.json` (one stale and
   one current entry) and assert the report's `cache_path`, `installed_version`, and
   `stale` verdicts — deterministic, no tokens.
3. `commands/expert.md` step 1 references `preflight-deployment.mjs` and contains the
   no-claim-without-report bright line (anchor-phrase grep).
4. `skills/expert-standard/SKILL.md` contains the evidence-ladder anchor ("can only be
   verified live") in body **and** frontmatter description (frontmatter parse already
   exists in the harness).

Behavioral convergence (the prose half) is not provable structurally; it is measured by
the existing recurrence machinery — the signature's `occurrences[]` under versions ≥ the
`fixed_in_version` this correction ships in, surfaced by the STATUS `failed_correction`
predicate (`commands/expert.md` step 4).
