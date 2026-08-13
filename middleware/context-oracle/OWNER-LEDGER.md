# Owner Ledger — Context Oracle

**The single source of truth for every claim attributed to Max Cogar in this
project.** An agent may treat an owner-attributed claim — *"the owner
wants/decided/said/requires"*, `[OWNER-n]`, *"per your instruction"*, *"as you
said"* — as authoritative **only** if it appears under **CONFIRMED** below with
Max's sign-off. This file is the reference of record; where a longer rationale
exists it is pointed to, not copied.

## Rules (meant to be enforced, not trusted)

1. **Before writing any claim attributed to Max into any durable document**
   (spec, decision log, requirements, architecture), find it under CONFIRMED
   here. If it is not there, you may not write it as authority.
2. **To propose a new owner claim**, add it under PENDING with the exact words
   and where they came from, then **stop and get Max's explicit sign-off.** Do
   not build on a PENDING claim.
3. **Only Max moves an entry to CONFIRMED**, by saying so explicitly
   ("confirmed", "signed off", "yes that's mine"). An agent may never
   self-confirm, and "follow the process" is not a sign-off.
4. **A claim Max rejects goes to REJECTED** with the correction, so it can never
   be quietly reintroduced.

Legend: ✅ CONFIRMED (Max signed) · ⏳ PENDING (awaiting Max) · ❌ REJECTED (not his)

---

## ⏳ PENDING — on record in `RETHINK.md` §12 as "resolved by the owner", awaiting your explicit confirmation they are accurately yours

Listed terse with a pointer to the verbatim source; nothing here is authoritative
until you confirm it. Load-bearing phrases are quoted verbatim.

| ID | Claim (yours?) | Source |
|---|---|---|
| OL-1 | Name is **Context Oracle**, CLI `ctxoracle`. | RETHINK §12.1 (2026-07-13) |
| OL-2 | Model in the loop, via the host CLI's own model access (no separate key); a deterministic degraded mode is mandatory for air-gap. | RETHINK §12.2 |
| OL-3 | **"No hard blocks. None, anywhere."** Every intervention is a loud warning whisper; the oracle "never mutates the repo and never prevents an action; its worst case is a wasted sentence." | RETHINK §12.3 |
| OL-4 | Sandbox compatibility is required. | RETHINK §12.4 |
| OL-5 | *(superseded by OL-8)* Main agent only in v1. | RETHINK §12.5 |
| OL-6 | Two stores — per-project and per-user global — both outside the repo tree; solo scope, no team sharing. | RETHINK §12.6 |
| OL-7 | **"No separate credentials, ever."** | RETHINK §12.7 (2026-07-15) |
| OL-8 | Subagent whisper delivery is in v1 scope (revises OL-5). | RETHINK §12.8 |
| OL-9 | Session-conduct genres (process conformance, answer drift) are in scope, advisory only. | RETHINK §12.9 |
| OL-10 | Self-observability is required — **"it could fail a hundred ways in front of me and I wouldn't know."** | RETHINK §12.10 |
| OL-11 | The project is agent-led; you start/end sessions, suggest features, speed up testing; design/build/verification/docs/roadmap are the agents'. You are a non-programmer by design. | RETHINK §12.11 |
| OL-12 | Speaking when an agent claims it's done is a must-have — **"having the oracle speak when an agent claims it's done is a must-have feature in my mind"** — and this is **not** a ranking of that moment above the others. | RETHINK §12.12 (2026-07-30, corrected 2026-08-01) |

## ❌ REJECTED — attributed to Max in this project but NOT his; never reintroduce

| ID | The false attribution | What's actually true | Caught |
|---|---|---|---|
| OL-R1 | "At most one whisper per event." | Not yours. Your rule is a per-trigger / per-session **budget, hard caps** (RETHINK:175–176, verbatim: *"Per-trigger and per-session whisper budgets. Hard caps."* — no denomination stated), **not a count**. An agent hardened "budget" into "one"; it manufactured a false dilemma about which whisper "wins." The token denomination the Phase 0 spec uses is a derived document judgment (`[P0-D-28]`), explicitly **not** attributed to you. | Max, 2026-08-12 (see P0-D-27, P0-D-28) |
| OL-R2 | "The core problem the tool exists to solve." | Not your words — an agent's superlative wrapped around your quote; it propagated to four documents and a review pass. | Max, 2026-08-01 (see collapse-log.md) |

## ✅ CONFIRMED — signed off by Max

*(none yet — the PENDING list above is awaiting your review. Nothing is treated
as authoritative until it moves here.)*
