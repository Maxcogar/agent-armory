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

## ✅ CONFIRMED — RETHINK §12 decisions, confirmed by Max Cogar 2026-08-13

Max confirmed these are accurately his (*"the rest look good"*), with OL-12
reworded and separately approved. Load-bearing phrases quoted verbatim; full
rationale in `RETHINK.md` §12. Nothing owner-attributed remains pending.

| ID | Claim (confirmed his) | Source |
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
| OL-12 | The oracle speaking when an agent claims it's done is a must-have — **to catch a completion claim the work doesn't back**: an agent reporting "done" without having actually finished or verified. (*"having the oracle speak when an agent claims it's done is a must-have feature in my mind"*; concrete need = agents that *"did not finish their work but still stopped anyway."*) *What the oracle does to catch it is design, not owner wording.* Reworded & approved by Max 2026-08-13; the earlier "not ranked above the others" clause dropped — the no-primary-feature principle is held by the mission and OL-C2. | RETHINK §12.12; Max 2026-08-13 |

## ❌ REJECTED — attributed to Max in this project but NOT his; never reintroduce

| ID | The false attribution | What's actually true | Caught |
|---|---|---|---|
| OL-R1 | "At most one whisper per event." | Not yours. An agent hardened an **invented budget** into a count of one, manufacturing a false dilemma about which whisper "wins." The budget it was hardened from is **also not yours** (OL-R3); your actual rule is OL-C1 — importance alone decides, no arbitrary limit. | Max, 2026-08-12 (count); 2026-08-13 (budget) |
| OL-R2 | "The core problem the tool exists to solve." | Not your words — an agent's superlative wrapped around your quote; it propagated to four documents and a review pass. | Max, 2026-08-01 (see collapse-log.md) |
| OL-R3 | Any per-session or per-trigger token/whisper budget that limits the oracle's operation. | Not yours. An agent introduced it in `RETHINK.md` §5 rationale — never one of your `RETHINK.md` §12 decisions — and it was treated as settled through every review round until you ruled it out (OL-C1). | Max, 2026-08-13 |

## ✅ CONFIRMED — signed off by Max

| ID | Decision (your words) | Confirmed |
|---|---|---|
| OL-C1 | **No arbitrary limit gates the oracle's operation.** Whether to speak is decided solely by whether the information is important: *"either the information its giving the agent is important, or its not. at no point should an arbitrary limit influence how that operates."* Every per-session / per-trigger token or count budget is removed as an operational gate; the bar (importance / marginal value) is the sole arbiter, and a malfunction is surfaced by diagnostics, never by suppressing whispers. | Max, in chat, 2026-08-13 |
| OL-C2 | **A corrective / steering feature — small, personal, and NOT a primary feature or the oracle's primary role** (his emphasis: *"THIS IS JUST A SMALL FEATURE FOR MY OWN PERSONAL BENEFIT… NOT THE PRIMARY ROLE OF THE ORACLE, NOR… A PRIMARY FEATURE."*). In his words: not fully against corrective actions; the prior hard-no was because agents *"got absolutely fucking obsessed with 'gates'"* and *"making the working agent take a goddamn test to see if it had a good enough plan to proceed,"* which *"was terrible and didn't work."* What he wanted: *"structured steering/correcting with a more deterministic trigger,"* and *"NOT trying to code in piles of rules and shit for when it should trigger."* The trigger is deterministic because the oracle is *"aware of my expert dev tools that I use,"* with *"their structures programmed into the oracle so the oracle would know when they're activated, what steps are within the expert skill being used, what actions the agent should be taking if they actually follow the skills, and so on."* This is the precise version of what the vague OL-9 (process conformance) was reaching for; OL-9's separate "answer drift" element still awaits his ruling. | Max, in chat, 2026-08-13 |

*(All owner claims are now confirmed: the RETHINK §12 decisions (OL-1…OL-12,
OL-5 superseded) plus OL-C1 and OL-C2. Nothing owner-attributed remains pending.
If any entry misstates your words, say so and I'll correct it — they are recorded
from your messages, not my interpretation.)*
