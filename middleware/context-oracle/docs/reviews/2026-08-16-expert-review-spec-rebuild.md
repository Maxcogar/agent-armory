# Independent expert review — rebuilt v1 spec

**Date:** 2026-08-16
**Target:** `docs/specs/spec-context-oracle.md` (the 2026-08-16 ground-up rebuild).
**Method:** one independent reviewer (not the author), Gate A/B/C plus consistency
with the confirmed foundation. Companion collapse-hunt: `2026-08-16-collapse-hunt-
spec-rebuild.md`.
**Verdict:** NEEDS FIXES — 1 Critical, 1 Serious, 5 Moderate, 5 Minor. All applied.

## Findings and disposition (all applied in the same-day revision)

- **C1 (Critical) — FR-O3 attributed a latency rule to the owner through
  `RETHINK.md` §5 rationale** (`[OL, RETHINK §5]`), the *same* poisoned channel that
  produced REJECTED OL-R3. No CONFIRMED ledger entry backs any owner latency
  preference. **Applied:** NF-1's 1.5s/3s are now a recorded engineering judgment
  `[D-31]` with reasoning; the owner attribution and the bare `[OL]` key are gone;
  only the fail-open *behavior* cites `[OL-3]`.
- **S1 (Serious) — FR-A2l "answer drift" asserted `[OL-9]` scope, but OL-C2 says
  answer-drift "still awaits his ruling"** — a ledger self-contradiction the spec
  resolved silently. **Applied:** answer-drift is removed from the built genre set,
  deferred in §2.2 `[D-24]`, and raised as owner question Q1 in §13.
- **M1 (Moderate) — FR-A5 fixed a multiplicative `×` while §13 called the numeric
  form architecture-owned** (contradiction + smuggled design). **Applied:** FR-A5 is
  now a *conjunction requirement* (all three factors jointly high, none laundered);
  the combinator/normalization is explicitly the architect's `[D-6bar]`.
- **M2 (Moderate) — FR-A6's first-few-sessions window is an adoption limit, not a
  relevance one, in tension with OL-C1.** **Applied:** the first-sessions window is
  removed; only the *evidentiary* corpus floor remains (it feeds the confidence
  term), with AC-6 asserting a rich-history session fires regardless of session count
  `[D-7, D-8]`.
- **M3 (Moderate) — dangling keys `[MSR]`, `[HH]`, `[D-6-bar]` resolved to nothing.**
  **Applied:** `[MSR]` and `[HH]` added to the §9 table; `[D-6-bar]` replaced with a
  real `[D-6bar]` decision entry.
- **M4 (Moderate) — FR-M5 mis-cited `[D-21]`** (degraded mode). **Applied:**
  re-sourced to `[OL-10]`/FR-X6, with `[D-21b]`.
- **M5 (Moderate) — NF-1 latency numbers cited `[RETHINK §5, OL-3]`** with no owner
  figure behind them. **Applied:** same fix as C1 — `[D-31]` judgment.
- **m1 (Minor) — figures stated as sourced (1–5 sentences, ~30 entities, ~15%
  tangled)** were tunable/illustrative. **Applied:** each marked illustrative/tunable
  in §4/§9, pending §13 re-confirmation.
- **m2 (Minor) — hooks specifics beyond the independently-verified set**
  (`PostToolUseFailure`, `PermissionRequest`, timeout numbers, 10k cap) stamped
  verified. **Applied:** footnoted in C-4 as not-individually-pinned, routed to §13
  Gate-B re-confirm.
- **m3 (Minor) — the 10k-char substrate cap vs "deliver all bar-clearing whispers"**
  could silently truncate (violating OL-C1). **Applied:** new FR-O2a — overflow
  defers the remainder to the next event and logs it, never truncates; AC-19 verifies
  it `[D-30]`.
- **m4 (Minor) — non-contiguous FR numbering with no note.** **Applied:** `[D-23]`
  states IDs are stable mnemonics with intentional gaps.
- **m5 (Minor) — MCP-DEP currency.** **Applied:** marked "prior pass; re-confirm at
  build" and routed to §13.

## Axes the reviewer found clean (recorded so the next round need not re-litigate)
- ROSE sourcing (Gate B): correct TSE-2005 figures, ICSE-2004 figures disclaimed,
  warn-floor labelled a tunable default — no over-claim.
- `node:sqlite`/FTS5 (C-1/C-2): matches ground truth; C-2 handled as property +
  constraint with mechanism deferred — no smuggling.
- No surviving budget / count-cap / rate-throttle anywhere (OL-C1): clean.
- Corrective feature non-primacy (OL-C2) and completion-claim non-primacy (P9):
  clean.
- No gate/deny/mutation path (OL-3): structural absence, verified by AC-2 control-flow
  assertion.
- Threat model precedes security requirements (Gate C): clean.
