# Context Oracle — status

*Plain-language project status, rewritten each session (not appended). It states
the current state and what to do next; evidence lives in `docs/reviews/`, durable
lessons in `docs/collapse-log.md`, ideas in `docs/IDEAS.md`, and everything
attributed to Max Cogar in `OWNER-LEDGER.md`.*

## The Phase A goal (the north star — read this first)

Phase A is the **honest deterministic foundation, and the measurement of its own
floor.** It stands up the genuinely-deterministic core on Max's real repos — the
stores, the index, the miner, the model-free whisper genres, the deny plumbing,
the self-observability — runs cleanly with no incident, and tells Max the truth
about what that core does and does not do. The spec (§11.5) defines the Phase A
exit as a *measurement*, not a finished feature: it "exits by producing measured
whisper/block, false-fire, and regret data on a real repo — **including how
little the conservative recognizer catches** before Phase B." The deliverable is
honest capability plus honest measurement, with clean seams the later phases plug
into — **never fake completeness dressed to look like a working product.** Judge
every Phase A decision against this goal (`CLAUDE.md` dominating rule 3).

## Where the project stands (2026-09-04)

The spec (`docs/specs/spec-context-oracle.md`) is signed off (`OL-C6`,
2026-08-28). The Phase A architecture's answer-drift block **`AD-9` has been
rebuilt to the honest deterministic skeleton the spec asks for**, replacing the
coverage-maximizing question classifier that ten review rounds had elaborated into
fake completeness — the goal-loss Max Cogar caught, now `docs/collapse-log.md`
2026-09-04 and `CLAUDE.md` dominating rule 3. (The round-10 expert review had
passed the old classifier *clean*; a clean correctness pass is exactly what hid
the defect, because review checks correctness, not goal-service.)

**What the rebuilt `AD-9` (in `docs/architecture-phase-a.md`) is.** The
info/request question taxonomy is gone entirely — no `kind` column, no
communicative/information/artifact lexicons, no base-noun-phrase head extraction,
no wh-complement precedence, no coordinated-ask handling. In its place, three
minimal deterministic recognizers:

- **open** a question on a `?`-terminated interrogative outside code/quotes, minus
  a small rhetorical stoplist — no classification of the question;
- **deny** only repo-mutating file tools (`Write`/`Edit`/`NotebookEdit`) while any
  question is open; allow every read/search/run/spawn (`D-39`'s protected class);
- **clear** all open questions on any substantive, non-deferral assistant text.

The over-fire this creates — denying an edit that *is* the answer to an action
request ("can you fix X?") — is deliberately **not** solved by machinery: it is
owned as one property-defined class, escapable in one clearing turn, and
**measured on the wrongful-deny rate at Phase A exit** — the whole point of Phase
A as the build's test bed (spec §11.5). The genuinely-real parts rounds 1–10 built
are kept unchanged: the single-producer deny confinement (`AD-10`), the
`questions`/`classify_state` tables (minus `kind`), the `FR-M2`/`FR-M4`
self-observability detectors, and the `qa/state.ts` Phase B seam.

**How it is grounded.** The taxonomy-drop rests on the spec, not on freelancing:
§11.5 ("ships the honest minimum … never by reviewing an imagined-phrasing
classifier into apparent completeness") and `D-41` (answer-directedness is a
comprehension judgment → Phase A is a *skeleton*, precision is Phase B). It is
carried in the architecture as an explicit collapse test and a numbered reasoning
chain (Chain 2), with the blast radius applied across the schema (`AD-4`),
`AD-18`, `AD-20`, the `AD-24` fixtures, the Gate-A review, Limitations `L1`, the
traceability matrix, and the Status changelog. The doc-consistency checker
(`tools/check_docs.py`) passes; rounds 1–9 history is retained as an accurate
record of what each round did at the time.

**Review status.** A fresh independent pair — an **expert review** and a
**collapse-hunt**, blind to each other and judged **goal-first** per `CLAUDE.md`
rule 3 ("does this serve the Phase A goal, or is it machinery that only passes
review?") — has been dispatched against the reworked `AD-9` (never the author, per
rule 2). **As of this write their findings are pending**; when they land, every
finding is applied in full before `AD-9` is trusted, and the review outputs are
recorded in `docs/reviews/2026-09-04-ad9-rework-*.md`.

## What to do next (agent-owned)

1. **Apply every finding** from the independent expert-review + collapse-hunt on
   the reworked `AD-9`, goal-first. If a review surfaces that the rebuild is still
   over- or under-built, correct it at the architecture layer and re-review — the
   terminal condition is a pair that finds nothing real, not a single pass.
2. **On a clean pair, `AD-9` is trusted and the Phase A architecture is
   approved.** Then write the **Phase A implementation plan** (greenfield
   expert-plan, consuming the spec + this corrected architecture), built against
   §11.5's Phase A exit and the §14 Phase A acceptance criteria.

## Open items

- The two **build-time verifications** the architecture names (`L11`): human-turn
  marker presence on Max's real interactive transcripts, and whether
  platform-injected turns fire `UserPromptSubmit`. Neither gates the design; both
  resolve with real captured sessions during the build.
- The pre-rework round-10 collapse-hunt (never run) is **moot** — `AD-9` was
  reworked and carries its own fresh review; the rest of the architecture stands
  on the round-10 expert-review PASS.

No owner question is open. The answer-drift *design principle* is settled (honest
skeleton + clean seam, over-fire owned and measured, never fake completeness); the
specific rebuilt `AD-9` is agent-owned architecture work, reviewed before it is
trusted.
