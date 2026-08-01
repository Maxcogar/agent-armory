# Reviews

Review output of record for the Context Oracle project. **Every review pass
writes its full output here as a file** — collapse-hunt and expert-review alike.

## Why this folder exists

`expert-review`'s post-fix protocol (SKILL.md R1.2, Step 2) builds round N's
inventory from four sources, one of which is *"the prior review's findings as
closure items"* — each prior finding re-derived from source and closed only
against **its originally named standard**.

That is impossible if the prior review's output was never written down. Through
round 1 it wasn't: the collapse-hunt findings survived because `collapse-log.md`
is mandated by `CLAUDE.md`, but the expert-review's finding set survived only as
a commit message (`c82ab2f`) that records severities and fixes without the named
standard per finding. Round 2 therefore has to open some closures as *tentative*
— not because the work is uncertain, but because the record was lost.

Losing the record costs a round. Hence: write the review to a file, always.

## Naming

`YYYY-MM-DD-round-N-<pass>.md` — e.g. `2026-07-30-round-2-expert-review.md`,
`2026-07-30-round-2-collapse-hunt.md`.

## Round numbering

Rounds count passes over **the current artifact**. The architecture document was
rebuilt from scratch on 2026-07-22 (`e0343e7`); the pre-rebuild document and its
2026-07-17 review are not in this chain, because the artifact they reviewed no
longer exists. Round 1 is the first pass over the rebuilt document.

## Provenance labelling

A file reconstructed after the fact from secondary sources says so in its title
and header, and names its sources. A reconstruction is a prior-document claim
like any other — a reviewer re-derives from source rather than trusting it
(`expert-review` SKILL.md Step 6).
