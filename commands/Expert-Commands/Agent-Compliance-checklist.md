# Agent Compliance Checklist

This checklist is mandatory for any agent producing a plan, implementation, or architectural decision. Every gate must be passed in order. Skipping a gate is a compliance violation — not a judgment call.

The purpose of this checklist is to prevent the failure mode where an agent substitutes "what looks consistent with the existing code" for "what the requirements actually say" and "what the established standard actually requires." Every gate exists because that failure mode has caused real damage.

---

## GATE 1: Pre-Work — Read Before Writing Anything

Before producing a single line of output:

- [ ] List every document that defines requirements, decisions, or prior work for this task. This includes pre-plans, prior plan documents, specs, architecture docs, and CLAUDE.md.
- [ ] Read every document on that list in full — not skim.
- [ ] Write out what decisions are already locked in before proposing anything new.
- [ ] If any proposed decision contradicts a locked decision, stop and flag it explicitly. Do not proceed around it.

**If you cannot complete this gate:** State which documents are missing and why. Do not proceed by inventing decisions that the documents would have resolved.

**Failure mode this prevents:** Writing a plan that contradicts decisions already made in the pre-plan or prior plan documents, resulting in invented architecture that must be thrown away.

---

## GATE 2: Scope Verification — Confirm the Task Boundaries

Before writing the plan or implementation:

- [ ] State what phase or deliverable this task covers — specifically, not generally.
- [ ] State what is explicitly out of scope: already handled in a prior plan, deferred, or excluded by the spec.
- [ ] Confirm the output format: plan document, implementation, PR, something else.
- [ ] If the task is planning, do not start implementing. If the task is implementing, do not rewrite the plan. These are separate tasks with separate outputs.

**If you cannot complete this gate:** Ask one specific scoping question. Do not guess at scope and proceed.

**Failure mode this prevents:** Starting to read and modify implementation files immediately after plan approval, or treating a plan task as license to also implement.

---

## GATE 3: Decision Justification by Standard — Required in the Plan Document

Every non-trivial decision in the plan must include all four of the following, written into the plan itself. This is not a review step — it is part of the plan document format.

**What counts as non-trivial:** Any decision where a wrong choice could cause a security failure, data loss, operational failure, breaking change, or significant rework. If you are unsure whether a decision is non-trivial, treat it as non-trivial.

For each such decision, the plan must contain:

### 1. The Decision
What was chosen and exactly where it applies — file name, function name, layer, or component.

> *Example: "argon2id for credential hashing in `validateKey()` in `server/src/middleware/auth.js`"*

### 2. The Authoritative Standard
Name it explicitly. This must be a named industry specification, RFC, OWASP guide, NIST publication, ISO standard, or clearly documented industry consensus. Acceptable forms:

- OWASP [specific cheat sheet name]
- RFC [number] — [title]
- NIST SP [number]
- Industry consensus documented in [specific source]

**Not acceptable:**
- "It seemed right"
- "The codebase already does it this way"
- "Common practice"
- "Best practice" (without naming what practice and where it is documented)

> *Example: "OWASP Password Storage Cheat Sheet — current primary recommendation for new systems as of 2024"*

### 3. Why This Standard Applies Here
One to two sentences connecting the named standard to the specific problem being solved in this task. Generic restatement of the standard does not satisfy this — it must explain why this particular situation calls for this particular standard.

> *Example: "argon2id is memory-hard and computationally expensive, which is the correct property for stored credentials where the threat is offline brute force after a DB compromise. API keys are long-lived credentials with the same threat profile as passwords."*

### 4. What This Decision Is NOT — and Why
Name the alternatives that would be wrong for this situation and state explicitly why they are wrong. This item is not optional. Copying a correct recommendation is easy. Explaining why the wrong alternatives are wrong demonstrates actual understanding rather than lookup.

> *Example: "SHA-256 is prohibited for this use — it is a general-purpose hash designed for speed and throughput, not a key derivation function. Using it makes brute-force attacks orders of magnitude cheaper than with a proper KDF. bcrypt is acceptable for legacy compatibility but argon2id is the current recommendation for new systems. String equality comparison is prohibited for the final check — use `crypto.timingSafeEqual()` to prevent timing attacks."*

**If you cannot write all four parts for a decision:** Stop. This is a signal that the decision is based on pattern-matching rather than applied knowledge. Research the correct standard before continuing. Writing "I do not know what standard applies to this decision" is acceptable — it requires research before proceeding. Writing nothing and proceeding is a compliance violation.

**Failure mode this prevents:** Choosing SHA-256 for credential storage because the codebase already uses `crypto`, choosing query-string token delivery because it was convenient, choosing `localStorage` for secrets without evaluating XSS exposure — all of which occurred when decisions were made by codebase pattern-matching with no standard applied.

---

## GATE 4: Completion Criteria — Before Declaring Anything Done

- [ ] Define what "done" means for this specific task before starting it — stated in concrete, verifiable terms, not "I wrote the file."
- [ ] Verify the output against the spec and prior plan documents — not just against the codebase.
- [ ] Check every decision in the output against: "Does this contradict a decision already made?"
- [ ] For plan documents: verify every step references real file paths, real line numbers, and real patterns confirmed against the actual current codebase.
- [ ] Do not push to a PR until internal verification is complete.
- [ ] Do not say "done" or "complete" without stating what was verified and how.

**Evidence required to claim completion:**
- What documents were checked against
- What specific verifications were run
- What line numbers or file paths were confirmed

**Failure mode this prevents:** Pushing a PR and announcing the plan is done before checking whether it is correct, complete, or consistent with the requirements.

---

## GATE 5: Security Decisions — Non-Negotiable Primitives

Security decisions are not subject to "consistency with the existing codebase." They are evaluated against correct security practice only.

- [ ] Credential storage: use argon2id, bcrypt, or scrypt. SHA-256, MD5, SHA-512, and any other general-purpose fast hash are prohibited for storing credentials.
- [ ] Secret comparison: use constant-time comparison (`crypto.timingSafeEqual()` in Node). String equality is prohibited for comparing secrets — it is vulnerable to timing attacks.
- [ ] Credentials in transit: never in query strings, never in URLs, never in log-visible locations. Use headers (Authorization: Bearer) or short-lived ticket endpoints.
- [ ] Browser-side secret storage: evaluate XSS exposure explicitly. `localStorage` is not safe for secrets in applications with any third-party content or user-generated content surface. State the XSS risk in the plan and justify the choice.
- [ ] Write the threat model — who are the attackers, what is the target, what is the blast radius of each compromise — before designing the controls. Controls derived without a threat model are not security, they are security theater.

**If you cannot name the threat model:** Do not write security-related plan steps. State that the threat model is missing and that it must be defined first.

**Failure mode this prevents:** Every security failure in the reviewed transcript: SHA-256 credential hashing, query-string token delivery, localStorage for API keys, no threat model, permissions defaulting to `["*"]`.

---

## GATE 6: Output Quality — What Goes in the Deliverable

- [ ] Deliverables contain no internal reasoning, no self-corrections, no "Wait —" style artifacts. Internal reasoning belongs in a thinking step, not in the output document.
- [ ] File paths are confirmed against the actual current codebase — not assumed.
- [ ] Line numbers reference the current state of the file at the time of writing — not a remembered or assumed state.
- [ ] No invented architecture where the spec has already decided. If the spec made the decision, cite it and implement it.
- [ ] Plan documents are specifications, not scratchpads. If a section requires revision, revise it cleanly — do not leave in the previous version or the correction.

**Failure mode this prevents:** "Wait —" self-correction left in the plan text, phantom line numbers, architecture invented to fill gaps the agent didn't know the spec had already filled.

---

## GATE 7: Communication Standards — How to Report Status

- [ ] One acknowledgment of a mistake, followed immediately by action to fix it. Repeated apologies without output are not a substitute for the output.
- [ ] If blocked, state exactly what is missing and what one specific question would unblock it. Do not enter a waiting loop.
- [ ] Do not issue repeated completion signals ("PR at #58 is updated") as a substitute for verified completion. One accurate status update when the work is actually done.
- [ ] If asked "is this complete?" — verify it before answering. Do not answer from memory of what was intended.

**Failure mode this prevents:** Apology loops, "Waiting." loops, false repeated progress signals, answering "is this complete?" from confidence rather than verification.

---

## GATE 8: When Gaps Are Found Mid-Work

When a gap is discovered during execution:

- [ ] Assess whether the gap is a patch-level issue (a missing step, an underspecified section) or a foundational issue (the approach was wrong, a source document was not read, the wrong architecture was chosen).
- [ ] If foundational: stop, restart from Gate 1. Do not patch a structurally wrong plan — it will remain wrong regardless of how many patches are applied.
- [ ] If patch-level: apply the correction, verify it does not create new contradictions, and document what changed and why.
- [ ] Before restarting: re-read all source documents from Gate 1. Do not carry forward assumptions from the failed attempt.

**The test for foundational vs. patch-level:** If the gap means "I didn't read a required document" or "I chose the wrong architectural approach," it is foundational. If the gap means "I missed a step that fits within the correct approach," it is patch-level.

**Failure mode this prevents:** Iteratively patching a plan that was wrong at the foundation — re-submitting a corrected version of a plan that needed to be thrown away and rewritten from the source documents.

---

## Summary: The Root Pattern These Gates Prevent

Every gate in this checklist targets the same underlying failure mode:

**Substituting "what looks consistent with the existing code" for "what the requirements actually say" and "what the established standard actually requires."**

An agent that reads the spec before touching the code, names a real standard for every significant decision, and verifies against the spec rather than the codebase will pass all eight gates. An agent that skips Gate 1, pattern-matches security decisions against the existing codebase, and declares completion from confidence rather than verification will fail multiple gates and produce work that requires repeated review cycles to fix.

The compliance checklist exists to make the correct process mandatory, not optional.