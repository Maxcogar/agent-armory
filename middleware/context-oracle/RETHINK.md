# The Context Oracle — a fundamental rethink of the codebase context compiler

**Status**: foundational rethink. The open decisions in §12 were resolved by the
owner on 2026-07-13; the spec derived from them is `SPEC.md` in this directory.
This document deliberately sets aside
the existing implementation (`middleware/codebase-context-compiler-sandbox/`) and
its spec/architecture docs. Nothing in them is treated as presumptively correct.
The old material was consulted only far enough to name what it was reaching for.

---

## 1. What this tool broadly is

Stripped of every implementation decision, the tool exists to solve one failure
mode of coding agents:

> Agents under-read the codebase, don't know when their context is sufficient,
> and fill the gaps with plausible inventions.

The intended product category is therefore: **a repository-resident intelligence
that hands a working agent the knowledge it wouldn't find on its own, so the
agent never has to guess.** The downstream consumer is the agent; the human must
be able to see why anything was said.

That mission is sound and is the only thing carried forward. Everything below is
derived from it fresh.

## 2. Why the compiled-package-plus-gates conception cannot work

This is category-level reasoning about the *shape* of the old design, not a code
review. Five structural reasons that shape of tool fails regardless of build
quality:

**2.1 — It compiles context at the moment of maximum ignorance.**
A package built from the user's prompt, before the agent has touched anything,
is built when the least is known about what the task will actually need.
Relevance is discovered mid-task: the agent greps, reads, revises its hypothesis,
and the real question emerges halfway in. A front-loaded briefing is therefore
mostly-irrelevant at the start and missing what's needed later — and the only
escape hatch is a ceremonial "expansion request." Right info, wrong time, is
wrong info.

**2.2 — Gates buy compliance, not understanding.**
Blocking edit tools until a magic-tagged plan passes a firewall does not make an
agent more grounded; it makes the agent optimize for passing the gate. The plan
block becomes a format tax. Denials mid-flow destroy the agent's working state
and burn tokens on negotiating with the gatekeeper. There is an economics of
trust here: advice that has cost the agent time gets discounted; guidance that
costs nothing keeps its influence. A guiding tool must make the right move
*easier*, never make every move *conditional*.

**2.3 — It competes with what agents are already good at.**
Modern agents grep, glob, and read well. Handing them thousands of tokens of
material they could surface themselves in three tool calls is noise that crowds
out the signal. The scarce, valuable knowledge is precisely what the agent
*cannot* discover from a cold checkout: invisible coupling, non-local
conventions, historical landmines, the second write-site, the test that always
breaks. Marginal value over the agent's own abilities is the only relevance
metric that matters.

**2.4 — The briefing binder is the wrong unit of delivery.**
Attention inside a context window is a budget. One large structured document,
delivered once, decays in salience as the session grows and pays its full token
cost regardless of what fraction was needed. The natural unit for
right-info-right-time is small and moment-keyed: a note about the file the agent
just opened, the symbol it just searched, the edit it is about to make.

**2.5 — It inverts the relationship.**
Plan tags, JSON expansion requests, JSON human overrides — the agent works for
the tool. A passive oracle works for the agent: zero required agent actions,
zero new formats, zero blocked tools. The word "compiler" itself encodes the
wrong model — batch, one-shot, artifact-centric — for a job that is continuous
and conversational. Hence the rename proposed here: **Context Oracle**.

One idea from the original intent survives on its own merits: epistemic honesty.
Facts should carry provenance, and unknowns should be named rather than papered
over. But its role flips — provenance exists so the *agent* can weigh and verify
a claim, not so a firewall can police the agent. The counter to guessing is not
blocking the guess; it is supplying the fact, or naming the unknown, *before the
guess forms*.

## 3. The oracle, defined

> **The oracle's job is to deliver the fact that would change the agent's next
> decision, at the moment of that decision, without being asked.**

Everything else — indexes, graphs, stores, hooks — is substrate in service of
that sentence. Note what the definition excludes: it is not search (that is
agent-initiated), not RAG (that is query-shaped), not a linter (that is
post-hoc), not a gate (that is adversarial). An oracle, in the classical sense,
answers the question you didn't know to ask. That is exactly the
unknown-unknowns mission.

The interaction loop is: **watch → match → whisper → shut up.**

Silence is the default. An oracle that talks constantly becomes wallpaper — the
documented fate of every over-eager guidance system (linter walls, IDE hint
storms, security-scanner fatigue). Its currency is influence-per-token, and it
spends only when confidence × impact clears a high bar.

Three models fully specify the design: what it knows, when it speaks, how it
speaks.

## 4. What it knows — the knowledge model

Ranked by marginal value over what the agent can trivially self-discover.

### Tier 1 — knowledge invisible from a cold checkout (the reason to exist)

- **Co-change graph.** Mined from git history: which files and symbols change
  together, how often, how recently. The single highest-value signal and nearly
  free to compute. It directly predicts the classic agent failure: the second
  write-site nobody told you about. "Files that changed alongside this one in
  80% of its last 20 commits: X, Y."
- **Convention & pattern registry.** "How X is done here," expressed as
  *pointers to canonical exemplars* — the blessed example of a new route, a new
  migration, a new component — not as extracted abstract rules. Existing
  behavior is evidence of convention, not automatically a requirement; the
  registry records which exemplars are load-bearing.
- **Landmine memory.** Places where changes historically went wrong: revert
  chains, fix-of-a-fix commits, flaky tests, footgun APIs, deprecated-but-not-
  deleted modules, "everyone trips on this" spots. Sources: git archaeology plus
  accumulated observation of past agent sessions.
- **Invariants & cross-file contracts.** Things that must stay in sync: enum ↔
  switch, schema ↔ generated types, config key ↔ reader, API handler ↔ client
  stub. Partly derivable statically, partly learned, always stated with the
  files involved.

### Tier 2 — structural substrate (cheap; used for orientation and to power Tier 1)

Import/reference graph, symbol map, directory topology and ownership boundaries,
generated/vendored/build-output zones, entry points, test topology (which tests
exercise which regions), build/verification commands per region.

### Tier 3 — live session state

What the agent has already read (never tell it what it has seen), the current
intent hypothesis, which whispers were sent and whether they were acted on.

### Properties of all stored knowledge

- **Provenance on every fact** — `file:line`, commit hash, or
  "learned from session on <date>" — so the agent can verify before relying.
- **Unknowns are speakable.** When the repo genuinely does not determine
  something ("nothing here says which screen this belongs on — that is a product
  decision"), that is itself a whisper, not a schema section.
- **It learns.** A one-shot indexer yields Tier 2 forever. The oracle's edge
  compounds from Tier 1 accumulation — including learning from watching agents
  work: which files a task-shape actually ended up needing is training data for
  the next task of that shape.

## 5. When it speaks — the attention model

This is the core inversion. Agent-harness hooks were previously used as *gates*
(deny). The oracle uses them as *senses and a voice*: observe everything, block
(almost) nothing, inject small.

The session is a stream of intent signals:

| Signal | What it reveals | Whisper genre |
|---|---|---|
| Prompt submitted | The task, in the user's words | **Orientation**: 2–4 entry-point files, the one invariant that will matter, landmines matching the task's shape. ~150–400 tokens. Not a binder. |
| Agent narration between tool calls | The richest signal: the agent's current hypothesis and assumptions, in prose | **Assumption check**: "your narration assumes X; the repo says Y at `file:line`." **Steering**: "what you're describing lives in `src/…`, not where you're looking." |
| Read / Grep / Glob observed | What the agent is looking at and for | **Coupling**: co-change partners of the file just opened. **Reuse**: "the thing you grepped for has a canonical helper at Z; most call sites use it." |
| Edit / Write about to run | What is about to change — the golden moment, the last cheap point to alter course | **Consequence**: "14 call sites in 3 packages; 2 in generated code." "Edits here historically break `tests/settings.test.ts`." "An existing implementation of what this adds is at `src/utils/x.ts` — consider reuse." Advisory, injected as context — never a denial. |
| Edit completed / session stopping | The change so far | **Completeness**: "you changed the reducer but not the selector it pairs with in 9 of its last 10 changes." **Verification**: "the suite for this region is `npm test -- settings`." |

At every signal the oracle answers one internal question: *given what the agent
is doing right now, do I know something it almost certainly doesn't that would
change what it does next?* If not — and usually not — it says nothing.

Discipline rules:

- **Per-trigger and per-session whisper budgets.** Hard caps; the orientation
  whisper decays out of consideration once the agent is deep in the work.
- **Dedup.** Never repeat a whisper whose content the agent has visibly
  incorporated (opened the pointed file, used the named helper).
- **Latency budget.** A hook that slows the agent is a gate by another name.
  Answer within ~1–2s or stay silent this round; precompute aggressively; keep
  session state warm rather than cold-starting per event.

## 6. How it speaks — the delivery model

- **Channel**: hook context injection (`additionalContext`) — ambient, requiring
  no agent action. This *is* the passive channel.
- **Unit**: the **whisper** — one topic, one to five sentences, always with a
  verifiable pointer (`file:line`, commit). Never a document. A whisper the
  agent can't check is a rumor.
- **Tone**: informative, never imperative. "Note: this function has 14 call
  sites" — not "You must review all call sites before editing." The agent stays
  the decision-maker. This is what makes it guidance rather than gating, and
  what makes it robust: an ignored whisper costs nothing; a wrong gate blocks
  real work.
- **Identifiable**: every whisper carries a stable prefix (e.g. `[oracle]`) so
  the agent and the human reviewing the transcript know its source, and carries
  its confidence when confidence is not high.
- **Confidence-gated**: speak only when confidence × decision-impact clears the
  bar. Ship with the bar set high and lower it against measured hit rate.

### The single permitted hard intervention

A block is allowed only where wrongness is **objective and machine-checkable**
— e.g. hand-editing a file that is provably build output. Anything
judgment-shaped is a whisper, always. Even the objective cases should prefer a
loud whisper with a one-keystroke override path over a wall. (Whether generated
file edits block or loudly whisper is an owner decision — see §11.)

## 7. The one deliberate bit of activeness — the companion skill

The oracle stays passive, but the agent can be taught to be a better patient.
A small skill, loaded at session start, tells the working agent:

1. **The oracle exists and how to read it.** Short `[oracle]` notes will appear
   in context; treat them as margin notes from a colleague who knows this repo's
   history — verify the pointer before relying on the claim.
2. **Narrate to be helped.** The oracle reads narration as its best intent
   signal. Say what you're looking for before a burst of tool calls ("looking
   for where settings are persisted"); name the task's nouns early; state
   assumptions out loud — an assumption the oracle can hear is an assumption it
   can confirm or refute with evidence.
3. **You may address it, cheaply.** No JSON, no tags: address it in narration
   ("oracle: where do notification preferences live?") and the next injection
   answers if it can, or says it can't. Asking is optional; the default remains
   that the oracle volunteers.

This is symbiosis, not ceremony: the narration the agent would ideally produce
anyway is the API. Nothing is required of the agent, nothing is blocked, and an
oracle-unaware agent still gets full passive value.

## 8. The learning loop

The oracle improves between sessions or it plateaus at Tier 2 usefulness.

- **Post-session distillation.** After a session: what did the agent end up
  needing that the oracle didn't know or didn't say (regret)? What did it say
  that was ignored (noise)? Which task-shape mapped to which files (recipe
  learning)? Distilled results update the knowledge store with provenance.
- **Git archaeology refresh.** Co-change and landmine mining re-run
  incrementally on new history.
- **Human corrections are first-class facts.** When the user states intent in
  chat ("SettingsPage stays the target screen"), the oracle records it as a
  session fact with human provenance — no override ritual; the user saying it
  *is* the authority.

## 9. What the oracle deliberately is not

Dropped from the old conception, each with the reason:

- **The plan gate / assumption firewall as blockers** → replaced by advisory
  assumption-check whispers. Grounding is achieved by supplying facts at
  decision time, not by refusing tool calls after the guess has formed. (§2.2)
- **The compiled Context Package as the central agent-facing artifact** →
  replaced by the whisper stream; orientation survives as the small task-start
  whisper. A rendered on-demand summary may persist as a *human review*
  artifact, but it is not the agent interface. (§2.1, §2.4)
- **Expansion-request JSON ritual** → the agent just looks, or asks in
  narration. (§7)
- **Human-override JSON ritual** → user statements in chat are already
  authoritative; record them. (§8)
- **Blocking `Task`/`Explore` delegation** → how an agent organizes its own
  work is harness policy, not the oracle's business.
- **Patch review as a product pillar** → verification and completeness
  whispers at stop-time, yes; a full reviewer is a different product, and the
  harness already has one.

## 10. Health metrics that match the mission

The old acceptance criteria measured package validity and gate compliance — the
tool grading its own paperwork. An oracle is measured on:

- **Hit rate**: fraction of whispers the agent visibly acts on.
- **Silence rate**: fraction of observed events producing no whisper (should be
  high; a falling silence rate with flat hit rate means it's getting chatty).
- **Regret rate**: post-hoc, from diffs and review — cases where the store
  contained a fact that would have prevented a wrong edit and the oracle stayed
  silent.
- **Ceremony count**: number of actions the tool requires from the agent.
  Must be **zero** (the skill is guidance, not protocol).
- **Overhead**: p95 hook latency and total injected tokens per session.

## 11. Architecture sketch (shape only — not an implementation plan)

- **Per-repo knowledge store** (persistent): Tier 2 structural index feeding
  Tier 1 registries — co-change graph, exemplar/pattern registry, landmine
  memory, invariants — every record with provenance. Built incrementally,
  enriched by the learning loop.
- **Session daemon** (warm, per-session): holds Tier 3 live state — files seen,
  intent hypothesis, whispers sent/acted-on — and does the match-and-rank per
  event within the latency budget.
- **Thin hook shims**: forward harness events to the daemon; relay whispers
  back as injected context. Shims contain no logic.
- **Judgment layer**: the "would this change the agent's next decision?" call is
  a language-understanding task. Deterministic substrate (graphs, FTS,
  embeddings) proposes candidates; a small fast model (Haiku-class) tracks
  intent from narration, ranks candidates, and drafts the whisper. Whether a
  model call is acceptable on the hook path — cost, latency, offline sandboxes —
  is an owner decision (§12); a deterministic-only degraded mode should exist
  regardless.
- **Companion skill**: §7.
- **Distiller**: §8, runs post-session.

## 12. Decisions — resolved by the owner, 2026-07-13

1. **Name**: **Context Oracle**, CLI name `ctxoracle`.
2. **Model in the loop**: yes — and the sandbox concern dissolves, because the
   oracle piggybacks on the host harness's own model access instead of needing
   its own API key. Wherever the oracle runs, Claude Code is by definition
   already talking to a model with working credentials; the judgment layer uses
   that same path (Agent SDK / headless CLI with a small fast model). MCP
   sampling is the protocol-level version of the same idea, to adopt if/when
   host support is solid. A deterministic-only degraded mode remains mandatory
   for true air-gap.
3. **No hard blocks. None, anywhere.** The owner's explicit position: the
   gatekeeper design was never wanted — prior agent sessions fixated on
   armoring against specific past failure cases, and the result blocked
   legitimate work half the time while solving nothing worthwhile. Every
   intervention, including generated-file protection, is a **loud warning
   whisper**. False fires are tracked (warning emitted → agent proceeded →
   outcome, plus narration corrections) and warnings are tuned from that data.
   Corollary: the oracle must be safe to run on real projects *by
   construction* — it never mutates the repo and never prevents an action; its
   worst case is a wasted sentence.
4. **Sandbox compatibility is required.** The old sandbox build is archived as
   read-only reference; the new spec and data model are written with it closed,
   and specific functions may be cherry-picked during implementation only where
   they fit the new model — never the reverse.
5. **Main agent only in v1.** Subagent whispers are a natural follow-on once
   whisper quality is measured.
6. **Two stores, no team scope** (the owner works solo): a **per-project
   store** — co-change graph, exemplars, landmines, invariants, task recipes
   for that repo — and a **per-user global store** — cross-project lessons,
   whisper-efficacy statistics, threshold tuning, general conventions. Both
   live outside the repo tree. Team sharing is out of scope.
