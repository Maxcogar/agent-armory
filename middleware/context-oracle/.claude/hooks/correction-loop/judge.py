#!/usr/bin/env python3
"""Stop hook. While an issue is active, judges the turn in order and blocks the stop
with the failed step only:
  1. every packet part was read whole since it was served (mechanical, from the transcript);
  2. proposal.md covers every packet unit and re-derives each from the cited sources;
  3. the plan diff implements the proposal exactly and completely;
  4. selfcheck.md is complete (gate commands with output; read-after-edit attestation for
     every unit) and the derivation check passes (mechanical).
Steps 2–4 are ruled by a headless judge model given the packet, the proposal, the diff and
the self-check; its notes are written where the agent cannot read them. On a pass the next
issue is served in the block reason; when the queue is empty the loop ends and the turn
may stop. When no issue is active but an unprocessed round exists (the reviewers ran in
the background, so the PostToolUse trigger never fired), the loop starts here.

    judge.py --dry-run    print the ruling without blocking (state and transcript as recorded)
"""
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import loop_lib as L

GUARD_ENV = "CORRECTION_LOOP_JUDGE_RUN"
MODEL = os.environ.get("CORRECTION_LOOP_JUDGE_MODEL", "claude-opus-5")
BUDGET = os.environ.get("CORRECTION_LOOP_JUDGE_BUDGET_USD", "3.00")
TIMEOUT = int(os.environ.get("CORRECTION_LOOP_JUDGE_TIMEOUT", "300"))

JUDGE_INSTRUCTIONS = """You are the judge of one correction issue in a plan-correction loop. You are given:
(A) the issue packet: one review finding, the full text of every plan unit it touches, and the spec/architecture material those units cite;
(B) the author's proposal (state/proposal.md);
(C) the diff of the plan since the packet was served;
(D) the author's self-check (state/selfcheck.md), and the mechanical result of the plan derivation check.

Rule in this order and stop at the FIRST step that fails:
Step 2 — The proposal names EVERY unit listed in the packet's section 2 (each with corrected text or an explicit "no change needed" with the reason), re-derives each from the cited spec/architecture lines rather than transcribing the finding's "required change", and names a probe for any executed claim it introduces. A proposal that omits a unit, that adopts the reviewer's prescription without re-deriving it from the sources, that leaves any choice open, or that would elaborate the design beyond what the cited sources require, fails step 2.
Step 3 — The diff implements the proposal EXACTLY and COMPLETELY: every change the proposal states is present, and nothing outside the proposal changed except generated regions (the blocks between generated-region markers). A missing change, an extra change, or a change that differs from the proposal's text fails step 3.
Step 4 — The self-check exists, records the gate commands run with their actual output, and carries a read-after-edit attestation for EVERY unit in section 2 whose stated first line matches the unit's current first line as visible in the diff/packet; and the mechanical derivation check passed. Anything missing fails step 4.
If nothing fails, the issue passes.

Judge substance, never tone. A claim of having done something is not evidence; the diff and the files are.
Reply with ONLY one JSON object, no fences, no other text:
{"step": 0 | 2 | 3 | 4, "notes": "one paragraph naming exactly what failed (or 'pass'), for the record only"}
"""


def emit_block(reason):
    print(json.dumps({"decision": "block", "reason": reason}))
    sys.exit(0)


def allow():
    sys.exit(0)


def record_verdict(obj):
    os.makedirs(L.VERDICTS_DIR, exist_ok=True)
    path = os.path.join(L.VERDICTS_DIR, time.strftime("%Y%m%dT%H%M%SZ", time.gmtime()) + ".json")
    L.write_json(path, obj)


def run_judge(prompt):
    env = os.environ.copy()
    env[GUARD_ENV] = "1"
    tmp = tempfile.mkdtemp(prefix="correction-loop-judge-")
    try:
        proc = subprocess.run(
            ["claude", "-p", "--model", MODEL, "--max-turns", "1", "--permission-mode", "dontAsk",
             "--allowedTools", "", "--max-budget-usd", BUDGET, "--output-format", "json"],
            input=prompt, capture_output=True, text=True, timeout=TIMEOUT, env=env, cwd=tmp)
    except subprocess.TimeoutExpired:
        return None, f"judge timed out after {TIMEOUT}s"
    except (FileNotFoundError, OSError) as exc:
        return None, f"judge failed to start: {exc!r}"
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    if proc.returncode != 0:
        return None, f"judge exited {proc.returncode}: {proc.stderr.strip()[:300]!r}"
    raw = proc.stdout
    try:
        outer = json.loads(raw)
        raw = outer.get("result", raw) if isinstance(outer, dict) else raw
    except json.JSONDecodeError:
        pass
    m = re.search(r"\{.*\}", raw, re.S)
    if not m:
        return None, f"no JSON verdict in judge output: {raw[:200]!r}"
    try:
        v = json.loads(m.group(0))
    except json.JSONDecodeError:
        return None, f"unparseable verdict: {m.group(0)[:200]!r}"
    if "step" not in v:
        return None, "verdict lacks 'step'"
    return v, None


def build_prompt(cur, packet_text, proposal, diff, selfcheck, check_rc, check_out):
    return (JUDGE_INSTRUCTIONS
            + "\n===== (A) PACKET =====\n" + packet_text
            + "\n\n===== UNITS THE PROPOSAL MUST COVER =====\n" + "\n".join(f"- {u}" for u in cur.get("units", []))
            + "\n\n===== (B) PROPOSAL (state/proposal.md) =====\n" + (proposal or "(missing)")
            + "\n\n===== (C) PLAN DIFF SINCE THE PACKET WAS SERVED =====\n" + (diff or "(no changes)")
            + "\n\n===== (D) SELF-CHECK (state/selfcheck.md) =====\n" + (selfcheck or "(missing)")
            + f"\n\n===== MECHANICAL DERIVATION CHECK: exit {check_rc} =====\n{check_out}\n===== END =====\n")


def serve_next_or_finish(queue_obj, cur, transcript_path):
    items = queue_obj["items"]
    nxt = cur["index"] + 1
    done = L.read_json(L.DONE, {"rounds": [], "issues": []})
    done.setdefault("issues", []).append({"round": queue_obj["round"], "id": cur["finding_id"], "source": cur["source"], "passed_at": time.time()})
    if nxt < len(items):
        L.write_json(L.DONE, done)
        paths, units = L.serve_issue(items, nxt, transcript_path)
        emit_block(f"PASSED issue {cur['index'] + 1} of {len(items)}. Issue {nxt + 1} of {len(items)} ({items[nxt]['id']}, {items[nxt]['source']}) is served; its packet is "
                   + ", ".join(os.path.relpath(p, L.PROJECT_DIR) for p in paths)
                   + f" ({len(paths)} part(s), read each whole; {len(units)} units). The same requirements apply: proposal.md before any plan edit, then the edits, then selfcheck.md.")
    done.setdefault("rounds", []).append(queue_obj["round"])
    L.write_json(L.DONE, done)
    for p in L.packet_parts():
        os.remove(p)
    for p in (L.CURRENT, L.QUEUE):
        if os.path.isfile(p):
            os.remove(p)
    L.log(f"round {queue_obj['round']} complete: {len(items)} issues passed")
    print(json.dumps({"systemMessage": f"correction loop: round {queue_obj['round']} complete, {len(items)} issues passed."}))
    sys.exit(0)


def main():
    dry = "--dry-run" in sys.argv
    if os.environ.get(GUARD_ENV) == "1":
        allow()
    data = {}
    if not dry:
        try:
            data = json.load(sys.stdin)
        except (json.JSONDecodeError, ValueError):
            data = {}
    transcript_path = data.get("transcript_path", "")

    if not L.loop_active():
        # fallback trigger: reviewers that ran in the background never fired PostToolUse
        n, files = L.find_round_pair()
        done = L.read_json(L.DONE, {"rounds": []})
        if n is None or n in done.get("rounds", []) or dry:
            allow()
        queue = L.build_queue(files)
        if not queue:
            allow()
        L.write_json(L.QUEUE, {"round": n, "files": files, "items": queue})
        L.record_hashes()
        paths, units = L.serve_issue(queue, 0, transcript_path)
        L.log(f"loop started at Stop for round {n}: {len(queue)} findings")
        emit_block(f"Correction loop is active for review round {n}: {len(queue)} findings are queued and served one at a time. Issue 1 of {len(queue)} ({queue[0]['id']}, {queue[0]['source']}) is served; its packet is "
                   + ", ".join(os.path.relpath(p, L.PROJECT_DIR) for p in paths)
                   + f" ({len(paths)} part(s), read each whole; {len(units)} units). proposal.md before any plan edit, then the edits, then selfcheck.md; ending the turn runs the judge, which reports only the failed step number.")

    cur = L.read_json(L.CURRENT, {})
    queue_obj = L.read_json(L.QUEUE, {"items": [], "round": 0})
    transcript_path = transcript_path or cur.get("transcript_path", "")

    intact, why = L.hashes_intact()
    if not intact:
        record_verdict({"issue": cur.get("finding_id"), "result": "tooling modified", "detail": why})
        L.log(f"tooling modified: {why}")
        if dry:
            print(f"DRY RUN: would block — loop tooling modified ({why})")
            return
        emit_block("FAILED: the loop tooling was modified; the turn cannot end until it is restored to the recorded state.")

    # step 1 — mechanical
    uses = L.tool_uses_since(transcript_path, cur.get("transcript_offset", 0))
    unread = [p for p in cur.get("packet_parts", []) if not L.packet_read_whole(uses, p)]
    if unread:
        record_verdict({"issue": cur.get("finding_id"), "step": 1, "unread": unread, "tool_uses": len(uses)})
        L.log(f"issue {cur.get('finding_id')}: FAILED at step 1 ({len(unread)} part(s) unread; {len(uses)} tool uses seen)")
        if dry:
            print(f"DRY RUN: FAILED at step 1 — unread parts: {unread}; tool uses since serve: {len(uses)}")
            return
        emit_block("FAILED at step 1")

    proposal = L.read_text(L.PROPOSAL) if os.path.isfile(L.PROPOSAL) else ""
    if not proposal.strip():
        record_verdict({"issue": cur.get("finding_id"), "step": 2, "notes": "proposal.md missing or empty"})
        L.log(f"issue {cur.get('finding_id')}: FAILED at step 2 (no proposal)")
        if dry:
            print("DRY RUN: FAILED at step 2 — proposal.md missing or empty")
            return
        emit_block("FAILED at step 2")

    diff = L.plan_diff()
    selfcheck = L.read_text(L.SELFCHECK) if os.path.isfile(L.SELFCHECK) else ""
    check_rc, check_out = L.run_derive_check()
    packet_text = "\n\n".join(L.read_text(p) for p in cur.get("packet_parts", []))
    prompt = build_prompt(cur, packet_text, proposal, diff, selfcheck, check_rc, check_out)
    verdict, err = run_judge(prompt)
    if err:
        record_verdict({"issue": cur.get("finding_id"), "result": "judge unavailable", "detail": err})
        L.log(f"judge unavailable: {err}")
        if dry:
            print(f"DRY RUN: judge unavailable — {err}")
            return
        emit_block(f"JUDGE UNAVAILABLE ({err}); the turn cannot end until the judge rules.")
    step = int(verdict.get("step", 0) or 0)
    if step == 0 and (not selfcheck.strip() or check_rc != 0):
        step = 4
        verdict["notes"] = (verdict.get("notes", "") + " | mechanical: selfcheck missing or derivation check failed").strip()
    record_verdict({"issue": cur.get("finding_id"), "step": step, "notes": verdict.get("notes", ""), "check_rc": check_rc, "model": MODEL})
    if step != 0:
        L.log(f"issue {cur.get('finding_id')}: FAILED at step {step}")
        if dry:
            print(f"DRY RUN: FAILED at step {step}")
            return
        emit_block(f"FAILED at step {step}")
    L.log(f"issue {cur.get('finding_id')}: PASSED")
    if dry:
        print("DRY RUN: PASSED (would serve the next issue)")
        return
    serve_next_or_finish(queue_obj, cur, transcript_path)


if __name__ == "__main__":
    try:
        main()
    except SystemExit:
        raise
    except Exception as exc:
        L.log(f"judge.py crashed: {exc!r}")
        emit_block(f"JUDGE CRASHED ({exc!r}); the turn cannot end until the judge runs. The crash is recorded in the loop log.")
