# Verification Procedures

Read in full at Phase 8; skim at Phase 6 so each plan step's own verification aligns with what this file will demand. This is the bar the whole skill exists to reach: a server is done when a real client has exercised every tool and the observed behavior matched a stated expectation — not when it compiles, not when it starts, not when unit tests pass. Those are build statuses (failure mode 6). This is verification.

## The two questions Phase 8 answers

- **Verification** — was the server built *right*? Does it match the plan and the Phase-5 target spec?
- **Validation** — was the *right* server built? Does it do what the user said they rely on it for, back in Phase-0 intake?

Both get answered explicitly. A server can conform perfectly to its spec and still not do what the user needed; a server can do what the user wanted while violating the protocol in ways that break other clients. Keep the two questions separate in the log.

## Standing up the server in its real shape

The transport is part of the system under test — verify the server in the transport and deployment shape it actually runs in, on the actual host OS from Phase 0. A stdio server verified only through in-process function calls has not been verified as an MCP server; the transport boundary is where a whole class of defects lives (stdout pollution, framing, encoding).

**stdio servers:** launch the server as a subprocess exactly as its real client does — same command, same working directory, same environment. The harness speaks JSON-RPC over the subprocess's stdin/stdout. Critically, capture the subprocess's stdout and stderr *separately*, because Domain A2/E1 conformance ("stdout carries nothing but protocol messages") can only be verified by inspecting the raw stdout stream for non-protocol bytes — a single stray log line or startup banner on stdout is a Critical protocol finding, and it is invisible if the harness only parses the messages it expects.

**Streamable HTTP servers:** start the server bound as it is really bound, POST/GET against the real MCP endpoint, and drive the initialize → operate lifecycle over HTTP. Verify the transport-security items directly here — send a request with a disallowed `Origin` header and confirm the documented rejection (Domain C6), send without the `MCP-Protocol-Version` header and confirm the spec-defined behavior, exercise session handling if the server is stateful. These are protocol behaviors, so the expectation for each is cited to the spec revision fetched in Phase 2, not to memory.

**The host-OS caveat:** every command in this procedure is the command that runs on the server's actual host. A server that runs on Windows is stood up with Windows process and path semantics, and its service-persistence behavior (surviving a reboot without an interactive login, if it is meant to be always-on) is verified on Windows. Commands that "would work on Linux" are not evidence about a Windows deployment.

## The client harness

Drive the server with a **scripted client built on the official MCP SDK** for the server's language, not by hand and not (for the record) through the MCP Inspector. The Inspector is a fine exploratory tool for eyeballing a server during development, but Phase 8's output is a reproducible record, and a reproducible record needs a script another session can re-run to get the same rows. Build the harness against the SDK's *current* client API — verify that API against the SDK docs fetched in Phase 2 rather than writing it from memory of a past SDK version; the same premise-correctness rule that governs the server's SDK usage governs the harness's.

The harness must be able to: complete the initialize handshake and read the negotiated capabilities; list tools (and resources/prompts if present); call any tool with an arbitrary payload, including deliberately malformed payloads the SDK's own typing might resist constructing; and capture the full raw response — result or error — for the log. If the SDK's client makes it awkward to send a schema-violating payload, send that case at the transport level (raw JSON-RPC) so the invalid-input rows are real.

## Protocol lifecycle checks

Against the fetched spec revision, confirm: initialization completes and version negotiation resolves correctly; declared capabilities match what the server actually implements (call the things it claims, confirm the absence of what it doesn't claim); `tools/list` output matches the Phase-1 inventory exactly — every inventoried tool present, no undeclared tools appearing, no declared tool missing (Domain A8); tool-result semantics distinguish protocol errors from tool-execution errors as the fetched spec's tools page requires (Domain A6). Each check's expected behavior is cited to the spec, with the revision identifier.

## The per-tool matrix

Every tool — no exceptions, no "representative sample," no stopping when the pattern seems clear — is exercised with at least these cases:

| Case type | What to send | Expectation |
|---|---|---|
| **Valid / realistic** | An input a real caller would send, within schema | The documented success behavior; correct, well-formed result; side effects as specified |
| **Schema-violating** | Wrong types, missing required fields, out-of-range values, one case per meaningful constraint in the schema | A structured validation error the model can act on — never a crash, an unhandled exception, a hang, or a silent wrong answer |
| **Edge** | Empty values, maximum/oversized values, Unicode and encoding edge cases, boundary numerics | Bounded, correct handling; oversized input is rejected or bounded, not turned into a memory or downstream incident (Domain D6) |
| **Dependency-failure injection** *(where feasible)* | Make a dependency the tool needs fail — unreachable service, timeout, auth rejection, disk full | The failure surfaces as a structured tool error with an actionable message; the server process stays alive; no secret leaks into the error (Domains D1, D2, B5, C12) |

Dependency-failure injection is marked "where feasible" because some dependencies cannot be safely failed in the available environment. When an injection is infeasible, that is a Gap in the closeout (stated, with what would be required to test it), not a row silently skipped — silent omission here is the same failure as the stabilized stop.

## Security-fix replay

For every security finding from Phase 3 that the work claims to have fixed, demonstrate the fix by **replaying the exact input that would have exploited the original defect** and recording the rejection. A security fix asserted without a replayed attack is an unverified premise about the most consequential class of finding in the audit. The replay row shows: the attack input, what it would have done against the unfixed server (with the Phase-3 finding ID), and the observed rejection against the fixed server. This applies to every Domain C finding disposition marked "fixed" — injection inputs, path-traversal inputs, SSRF targets, oversized payloads, auth-bypass attempts.

## Operability checks

- **Log destination.** For stdio: inspect the separately-captured stdout stream and confirm it contains only protocol messages — zero log lines, zero banners, zero debug prints (Domain A2/E1). For HTTP: confirm logs go where the docs say.
- **Log content.** Trigger a tool failure and confirm the log carries enough to diagnose it — tool name, sanitized arguments, the error — and that it carries no secrets (Domains E2, C12).
- **Configuration errors.** Start the server with a broken configuration (missing required value, malformed value) and confirm it fails loudly at startup with an actionable message, rather than starting and failing silently during a later tool call (Domain D7, E3).
- **Restart recovery.** Stop and restart the server; confirm it comes back to a working state and, if it is meant to be always-on, that it survives the host's reboot per its service wrapper (Domain E5).
- **Resource stability.** Invoke tools repeatedly (a loop of realistic calls) while watching for growth that does not level off — file handles, connections, memory. A leak that only shows under repetition is a real reliability finding (Domain D4).

## The verification log

The record of Phase 8 is a table with **one row per tool per case**, plus rows for each protocol check, each security replay, and each operability check. Every row has:

| Field | Content |
|---|---|
| Target | Tool name / protocol check / operability check |
| Case | valid / schema-violating / edge / dependency-failure / replay / lifecycle / operability |
| Input | The actual input sent — the real bytes, not a description of them |
| Expectation + source | What should happen and where that expectation comes from (spec section + revision, target-spec requirement, or Phase-3 finding ID) |
| Observed | The actual output that came back — pasted, not paraphrased, not summarized as "worked" |
| Result | PASS / FAIL |

A row whose Observed field says "passed" or "looks correct" instead of the actual output is not a verification row — it is failure mode 6 in a table, and it fails Completion Test line 3. The observed output is the evidence; without it there is no verification, only a claim of one.

Any FAIL row means the work is not done: the defect returns to Phase 6 (plan a fix) or Phase 7 (execute a fix), then Phase 8 re-runs the affected rows. A FAIL row does not get "noted" and shipped — that is the invented-middle-verdict failure (mode 12) reaching into the verification log.

## What Phase 8 hands to Phase 9

The completed verification log is the primary evidence the closeout's delta report and after-contract are built on. Every "fixed" disposition in the delta report points at a PASS row here; every security-fix claim points at a replay row; every load-bearing behavioral claim in the after-contract's Claims section points at an Observed output here. If a claim in Phase 9 cannot point at a row in this log, it is not verified, and it belongs in the Gaps section rather than stated as fact.
