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
rationale in `RETHINK.md` §12. (OL-3's blocking question was resolved 2026-08-16:
the generated-file block is **rejected** as agent fixation (OL-R4); the one block
Max wants is **answer-drift** (OL-C3).)

| ID | Claim (confirmed his) | Source |
|---|---|---|
| OL-1 | Name is **Context Oracle**, CLI `ctxoracle`. | RETHINK §12.1 (2026-07-13) |
| OL-2 | Model in the loop, via the host CLI's own model access (no separate key); a deterministic degraded mode is mandatory for air-gap. | RETHINK §12.2 |
| OL-3 | **"No hard blocks. None, anywhere."** (`RETHINK.md` §12.3). Max clarified 2026-08-16 that he said this specifically to **kill the generated-file-blocking idea agents kept fixating on** — *"THIS SHIT IS THE ONLY REASON I SAID NO BLOCKS. I KNEW YOU ALL WOULD GET ABSOLUTELY OBSESSED WITH THAT IDEA AND BUILD A BUNCH OF BULLSHIT I DONT WANT"* — not as a literal ban on everything. That generated-file block is **REJECTED as not his (OL-R4)**. The **one** block/correction Max actually wants is **answer-drift (OL-C3)**, which he says he told us plainly and which got buried. | RETHINK §12.3; Max 2026-08-16 |
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
| OL-R4 | Blocking a hand-edit of a "provably auto-generated / build-output" file (the *"single permitted hard intervention,"* formerly `RETHINK.md` §6). | **Not his — agent fixation.** Max 2026-08-16: *"thats not my example. thats the example you guys have been fixating on and i honestly dont even know what it means."* His *"No hard blocks"* (OL-3) was the rejection of exactly this. **REMOVED from `RETHINK.md` (§6 subsection and the §12.3 phrase) on 2026-08-16** so it cannot re-poison future sessions. Never reintroduce. | Max, 2026-08-16 |

## ✅ CONFIRMED — signed off by Max

| ID | Decision (your words) | Confirmed |
|---|---|---|
| OL-C1 | **No arbitrary limit gates the oracle's operation.** Whether to speak is decided solely by whether the information is important: *"either the information its giving the agent is important, or its not. at no point should an arbitrary limit influence how that operates."* Every per-session / per-trigger token or count budget is removed as an operational gate; the bar (importance / marginal value) is the sole arbiter, and a malfunction is surfaced by diagnostics, never by suppressing whispers. | Max, in chat, 2026-08-13 |
| OL-C2 | **The corrective / steering feature — Max's exact words, recorded verbatim (NOT summarized), a small / personal / explicitly non-primary feature.** His statement, in full: *"ill probably regret saying this, but im not fully against corrective actions. the ONLY reason I put a hard no on it before was because the other 3 or 4 times I tries building this the agents kept putting way too much focus on that parts and got absolutely fucking obsessed with "gates" and like making the working agent take a goddamn tests to see if it had a good enough plan to proceed. literally every bit if it was terrible and didnt work. what i actually wanted was structured steering/correcting with a more deterministic trigger. and NOT trying to code in piles of rules and shit for when it should trigger. I wanted it to be aware of my expert dev tools that I use, and I wanted their structures to be programmed into the oracle so the oracle would know when they're activated, what steps are within the expert skill being used, what actions the agent should be taking if they actually follow the skills, and so on. BUT I CANNOT STRESS ENOUGG THAT THIS IS JUST A SMALL FEATURE FOR MY OWN PERSONAL BENEFIT!!!!! THIS IS NOT THE PRINARY ROLE OF THE ORACLE, NOR WOULD I EVEN CONSIDER IT A PRIMARY FEATURE!!!!"* — This is **steering / correcting (advisory)**, and explicitly **NOT a gate or a "take a test to proceed"** mechanism (he rejected that). Re-affirmed emphatically 2026-08-16 that it was being ignored. | Max, in chat, 2026-08-13; re-affirmed 2026-08-16 |
| OL-C3 | **The one case where the oracle should block/correct: answer-drift.** In his words (2026-08-16): *"if i ask a question, then it needs to be answered. the oracle should block that motherfucker until it stops ignoring me and actually answers. just dont make a convoluted fucked up way that its done."* Max says this is the exact, genuinely useful blocking case he gave — and it must not be buried under the rejected generated-file idea (OL-R4). | Max, 2026-08-16 |
| OL-C4 | **Uncertain hazards: option B.** Asked to choose between (A) warn only when quite sure and (B) also voice uncertain warnings clearly flagged, letting the learning loop demote ones that keep being wrong, Max answered *"B"* (2026-08-16). The wording of B is Claude's; Max's input is the selection. | Max, 2026-08-16 |

*(Confirmed: the RETHINK §12 decisions (OL-1…OL-12, OL-5 superseded) plus OL-C1,
OL-C2, OL-C3, OL-C4. Nothing owner-attributed is pending. If any entry misstates
your words, say so and I'll correct it — recorded from your messages, not my
interpretation.)*
