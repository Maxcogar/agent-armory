# Correction handling: a whole component is missing because the spec never asked for it

## The first move is to name what kind of problem this actually is

This is not "the architecture has a bug." The architecture faithfully built what the
spec said. The spec is missing a requirement. That distinction decides everything about
how the correction flows, because correcting the wrong layer is exactly how this drift
got introduced in the first place.

Concretely, there are three layers in play and the defect lives at the top:

1. **Spec layer** — the contract of intent. It never says the system needs offline
   sync. This is the *root* defect.
2. **Architecture layer** — derived from the spec. It has no offline-sync component
   because nothing upstream demanded one. This is a *consequence*, not a cause.
3. **Card layer** — workspace cards derived from the architecture. None of them cover
   offline sync, and some in-flight cards may have been built on assumptions
   (always-online, server-authoritative state, no local write queue) that offline sync
   will overturn.

So the correction has to travel **backward to the spec first, then forward again**
through architecture and into cards. If you patch only the architecture ("just add an
offline-sync component"), you re-create the original failure: an architecture decision
with no spec to anchor it, no acceptance criteria, and nothing that will catch the same
omission next time. You would be drifting in the opposite direction.

The one thing to *not* do is open a card titled "add offline sync" and start building.
That treats a requirements gap as an implementation task and skips every gate that
exists to keep intent and execution aligned.

## Step 0 — Stop and confirm the requirement is real before touching anything

The report is "the system needs offline sync, but the spec never says that." Two things
have to be nailed down before any correction, because they change the size of the fix:

- **Is offline sync genuinely required, or is it one plausible solution to an
  underlying need?** The real requirement might be "users keep working through network
  loss" or "field devices reconcile after reconnecting." Offline sync is *an*
  architecture answer to that, not the requirement itself. Capture the **need** in the
  spec; let the architecture phase choose the mechanism. Putting "offline sync"
  straight into the spec as a mandate risks baking an architecture decision into the
  contract — the same smearing of design into spec that the pipeline is built to avoid.
- **Who is the authority for this?** A missing requirement is a scope change. It needs
  the spec owner / requester to confirm it, not an inference made mid-build. Get that
  confirmation explicitly. "It looks like it got dropped" is a hypothesis; the owner
  decides whether it's in scope, and that decision is what the rest of the flow rests
  on.

Also do a quick root-cause note while it's fresh: was the requirement raised earlier and
lost, or never elicited at all? You don't need a post-mortem, but one line ("offline
operation was assumed by stakeholders but never written down") tells the foundation
phase what gap to close so the next spec doesn't repeat it.

## Step 1 — Amend the spec (the correction enters at the top, with provenance)

Reopen the spec and add the requirement properly — not as a patch in the margins but as
a first-class entry held to the same bar as every other requirement:

- State the **need**, grounded ("must support read/write while disconnected and
  reconcile on reconnect"), with the concrete conditions that triggered it (the usage
  this build surfaced).
- Give it **acceptance criteria** that are testable — what "offline sync works" means
  (conflict resolution policy, data scoped for offline, staleness bounds, reconnect
  behavior).
- Record it as a **correction with provenance**: a dated entry that says this was added
  mid-build, by whom, why it was missing, and that downstream architecture/cards must be
  re-derived. This is the audit trail. Without it, the next reader sees offline sync in
  the spec and has no idea it was a late insertion that rippled through the build.
- Keep it **architecturally silent**: describe the need and its constraints, not the
  component. The mechanism is the architecture phase's job.

The spec is now the corrected source of truth. Everything downstream re-derives from it.

## Step 2 — Re-run architecture against the amended spec, scoped to the delta

Now push the correction forward. Re-enter the architecture pipeline, but scope it to the
new requirement and its blast radius rather than regenerating the whole document from
scratch:

- **Research / classification audit** on the offline-sync need. The classification
  audit matters here — adding offline sync almost certainly changes the *level* of the
  affected slices. A feature that was a simple L1 server-backed flow may become L2/L3
  once you introduce a local store, a sync engine, conflict resolution, and a
  reconnect/merge path. Let the audit re-classify; don't assume the old level holds.
- **Compose** the new component(s) at the level the audit assigns: the offline data
  store, the sync/reconciliation engine, conflict-resolution policy, the boundary
  changes to existing components (anything that assumed always-online now needs a
  local-first or queue-and-sync path).
- Critically, **re-examine the components that already exist**. Offline sync is rarely
  additive. It changes data ownership, write paths, caching, auth/session handling, and
  error semantics across components that are already built or in flight. The architecture
  pass must mark those as **impacted**, not just append a new box to the diagram.
- **Design review** the result, with explicit attention to the seam between the existing
  online architecture and the new offline path — that seam is where this kind of late
  addition breaks.

## Step 3 — Reconcile cards: new work AND invalidated in-flight work

The architecture delta now drives card changes. There are three buckets, and the middle
one is the dangerous one teams forget:

- **New cards** for the offline-sync component(s) — one per Card Slice the architecture
  produced, with their (re-classified) levels and acceptance criteria tracing back to the
  amended spec.
- **Invalidated / rework cards** — every in-flight or completed card whose assumptions
  the new architecture overturned. A card that built an always-online write path is now
  *wrong*, not just incomplete. These need to be reopened with a clear note of what
  changed and why, linked to the spec correction. Silently leaving "done" cards that are
  now inconsistent is how you ship a half-offline system.
- **Unaffected cards** — confirm they're genuinely untouched by the new data/sync
  boundaries and leave them alone. Don't re-do work the correction didn't reach.

For anything already merged that the change invalidates, treat it as rework with the
correction as its provenance, so the history shows *why* finished work was reopened.

## Step 4 — Sequencing and the in-flight build

Because you're "partway through building," handle the live work deliberately:

- **Pause or fence** the cards in the offline-sync blast radius so people don't keep
  building on the now-invalid always-online assumption. Cards outside the radius can
  continue.
- **Order the rework** so the offline data/sync foundation lands before, or alongside,
  the cards that depend on it — otherwise you'll rework the same surfaces twice.
- Re-enter the normal pipeline (plan → review → implement → audit) for the new and
  reopened cards. They go through the same gates as everything else; nothing about being
  a correction lets them skip review or audit.

## Why route it this way (the principle in one line)

A missing component caused by a missing requirement is a **spec defect that manifested in
architecture**, so the correction must re-enter at the spec, carry provenance, and
re-derive downward — not be patched in at the architecture or card layer where it would
have no anchor, no acceptance criteria, and no record. Patching forward-only is what
produced the drift; correcting backward-then-forward is what closes it.

## What the correction flow should produce, concretely

- An amended spec with the offline-capability requirement, acceptance criteria, and a
  dated correction entry recording why it was missing and that downstream must re-derive.
- A re-run architecture delta: new offline component(s) at audited levels, plus existing
  components explicitly marked impacted, passed through design review.
- A reconciled card set: new cards for the new slices, reopened rework cards for
  invalidated in-flight/done work, and untouched cards confirmed.
- A short root-cause note fed back to foundation so the elicitation gap that dropped this
  requirement doesn't recur.

## Quick checklist

- [ ] Confirm the requirement is real and in scope **with the spec owner** before any
      change.
- [ ] Capture it as a **need**, not as the word "offline sync," keeping the spec
      architecturally silent.
- [ ] Amend the **spec first**, with testable acceptance criteria and a dated correction
      entry (provenance).
- [ ] Re-run **architecture** scoped to the delta; let the classification audit
      **re-level** affected slices.
- [ ] Mark **existing components impacted**, not just add a new one.
- [ ] Create **new cards** and **reopen invalidated** in-flight/done cards; leave
      genuinely unaffected cards alone.
- [ ] **Fence and re-sequence** in-flight work so nothing keeps building on the broken
      assumption.
- [ ] Send a **root-cause note** to foundation so the gap doesn't recur.
