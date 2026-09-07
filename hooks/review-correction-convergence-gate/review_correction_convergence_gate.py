#!/usr/bin/env python3
"""Stop + PreToolUse hook - Review-Correction Convergence Gate.

Detects a stalled review/correction loop - a fix batch that doesn't
address the root cause, so the next round shows no real progress, round
after round. This is documented, not theorized: hooks/skill-observations
in this repo's own history record exactly this pattern (Obs 9, 15, 16, 18,
21 in skill-observations/log.md) - most importantly Obs 18/21, which show
that a MECHANICAL, ARITHMETIC tripwire held in a session where every
prose rule against patching got rationalized past within minutes. That is
why detection here is a computed count, never a fresh LLM opinion on
"is this fix good enough" - that class of control is the one already
shown not to hold.

Independent of hooks/stop-completeness-gate/ and
hooks/stop-instruction-adherence-gate/ - reads nothing from them, sets no
dependency on them, and does not require them to be installed. Three
self-contained round-count signals, tried in order:

  1. An active GitHub PR (found via a pull_request-shaped tool call in the
     transcript): unresolved review threads + failing checks, recounted
     via `gh` if it is present on PATH. Best-effort - see README.
  2. A `ReportFindings` tool call this round: length of its findings list.
  3. Plain conversation, no structured review data: the set of files
     touched by Edit/Write/MultiEdit/NotebookEdit since the last real user
     message. The trigger is the SAME file(s) recurring across
     consecutive rounds, not text similarity - a shallow fix can cause a
     *different* regression each round in the same file (Obs 16's actual
     documented case: round 3 caused 3 new regressions, round 4 caused 6
     more, all different findings each time), so tracking the file, not
     the wording of the complaint, is what catches that shape too.

Tripwire: for count-mode signals (1/2), fires when the last two
round-over-round transitions both fail to strictly decrease (Obs 18's
exact condition). For file-mode (3), fires when the same file appears in
every one of the last N (default 3) consecutive rounds.

On firing: the Stop message stops asking for "a better fix" and instead
requires a shared-root statement (Obs 9/15: findings that cluster usually
share one root; patching each instance leaves the root untouched) and a
traversal of every place that references or is referenced by the affected
file(s) (Obs 16: a fix reviewed only at the point of the edit cannot
detect that it contradicts something it depends on or that depends on it).
PreToolUse denies further edits to those files - a real block, not a
prompt - until a later Stop firing confirms the statement actually has
substance. That confirmation is the one place this gate uses an LLM at
all, and only to grade the CONTENT of a forced statement, never to decide
whether to trigger. If the same file stalls again after that unlock,
escalation goes to level 2: total lockout on those files pending a written
report to the user, not a third automated attempt.
"""
import json
import os
import re
import shutil
import subprocess
import sys

_OWN_GUARD_ENV = "CONVERGENCE_GATE_JUDGE_RUN"
_SIBLING_GUARD_ENVS = ["STOP_COMPLETENESS_GATE_JUDGE_RUN", "STOP_ADHERENCE_GATE_JUDGE_RUN"]

DEFAULT_MODEL = os.environ.get("CONVERGENCE_GATE_MODEL", "claude-sonnet-5")
MAX_BUDGET_USD = os.environ.get("CONVERGENCE_GATE_MAX_BUDGET_USD", "0.50")
TIMEOUT_SECONDS = int(os.environ.get("CONVERGENCE_GATE_TIMEOUT_SECONDS", "60"))
SAME_FILE_ROUNDS_THRESHOLD = int(os.environ.get("CONVERGENCE_GATE_SAME_FILE_ROUNDS_THRESHOLD", "3"))

STATE_DIR_NAME = ".claude/hook-state/convergence-gate"
LOCKS_FILENAME = "locks.json"


def _emit(payload):
    print(json.dumps(payload))
    sys.exit(0)


def allow():
    sys.exit(0)


def block_stop(reason):
    _emit({"decision": "block", "reason": reason})


def deny_tool(reason):
    _emit({"hookSpecificOutput": {
        "hookEventName": "PreToolUse",
        "permissionDecision": "deny",
        "permissionDecisionReason": reason,
    }})


def read_stdin_json():
    try:
        return json.load(sys.stdin)
    except (json.JSONDecodeError, ValueError):
        return {}


def find_repo_root(cwd):
    try:
        proc = subprocess.run(
            ["git", "-C", cwd or ".", "rev-parse", "--show-toplevel"],
            capture_output=True, text=True, timeout=10,
        )
        if proc.returncode == 0:
            return proc.stdout.strip()
    except (OSError, subprocess.TimeoutExpired):
        pass
    return cwd or "."


def _state_dir(cwd):
    d = os.path.join(find_repo_root(cwd), STATE_DIR_NAME)
    os.makedirs(d, exist_ok=True)
    return d


def _safe_key(key):
    return re.sub(r"[^A-Za-z0-9_.-]", "_", key)[:150]


def load_json(path, default):
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError, OSError):
        return default


def save_json(path, data):
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
    os.replace(tmp, path)


def _extract_text(content):
    if isinstance(content, str):
        return content.strip() or None
    if isinstance(content, list):
        parts = [c.get("text", "") for c in content if isinstance(c, dict) and c.get("type") == "text"]
        joined = "\n".join(p for p in parts if p).strip()
        return joined or None
    return None


def read_transcript_entries(transcript_path):
    if not transcript_path or not os.path.isfile(transcript_path):
        return []
    entries = []
    try:
        with open(transcript_path, "r", encoding="utf-8", errors="replace") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    entries.append(json.loads(line))
                except json.JSONDecodeError:
                    continue
    except OSError:
        return []
    return entries


def find_last_user_index(entries):
    for i in range(len(entries) - 1, -1, -1):
        entry = entries[i]
        if entry.get("type") != "user":
            continue
        message = entry.get("message") or {}
        if _extract_text(message.get("content")):
            return i
    return None


def tool_uses_since(entries, start_index):
    calls = []
    for entry in entries[start_index:]:
        if entry.get("type") != "assistant":
            continue
        content = (entry.get("message") or {}).get("content")
        if not isinstance(content, list):
            continue
        for c in content:
            if isinstance(c, dict) and c.get("type") == "tool_use":
                calls.append(c)
    return calls


def files_touched(tool_calls):
    files = set()
    for c in tool_calls:
        if c.get("name") in ("Edit", "Write", "MultiEdit", "NotebookEdit"):
            fp = (c.get("input") or {}).get("file_path")
            if fp:
                files.add(fp)
    return files


def report_findings_count(tool_calls):
    count = None
    for c in tool_calls:
        if c.get("name") == "ReportFindings":
            findings = (c.get("input") or {}).get("findings")
            if isinstance(findings, list):
                count = len(findings)
    return count


def find_active_pr(entries):
    for entry in reversed(entries):
        if entry.get("type") != "assistant":
            continue
        content = (entry.get("message") or {}).get("content")
        if not isinstance(content, list):
            continue
        for c in content:
            if not (isinstance(c, dict) and c.get("type") == "tool_use"):
                continue
            name = c.get("name", "")
            inp = c.get("input") or {}
            if "pull_request" in name.lower() or name.endswith("create_pull_request"):
                owner, repo = inp.get("owner"), inp.get("repo")
                number = inp.get("pullNumber") or inp.get("pull_number")
                if owner and repo and number:
                    return (owner, repo, number)
    return None


def pr_finding_count(owner, repo, number):
    if not shutil.which("gh"):
        return None
    try:
        proc = subprocess.run(
            ["gh", "pr", "view", str(number), "--repo", f"{owner}/{repo}",
             "--json", "reviewThreads,statusCheckRollup"],
            capture_output=True, text=True, timeout=30,
        )
        if proc.returncode != 0:
            return None
        data = json.loads(proc.stdout)
        threads = data.get("reviewThreads") or []
        unresolved = sum(1 for t in threads if not t.get("isResolved"))
        checks = data.get("statusCheckRollup") or []
        failing = sum(
            1 for c in checks
            if str(c.get("conclusion") or "").upper() not in ("SUCCESS", "NEUTRAL", "SKIPPED", "")
        )
        return unresolved + failing
    except (OSError, subprocess.TimeoutExpired, json.JSONDecodeError, ValueError):
        return None


def count_tripwire(counts):
    if len(counts) < 3:
        return False
    c1, c2, c3 = counts[-3], counts[-2], counts[-1]
    return not (c1 > c2 > c3)


def file_tripwire(file_rounds, threshold):
    if len(file_rounds) < threshold:
        return False
    last_n = [set(s) for s in file_rounds[-threshold:]]
    common = last_n[0]
    for s in last_n[1:]:
        common = common & s
    return bool(common)


def run_content_judge(statement_text, files_expected):
    env = os.environ.copy()
    env[_OWN_GUARD_ENV] = "1"
    for v in _SIBLING_GUARD_ENVS:
        env[v] = "1"
    prompt = (
        "You are checking ONE narrow thing: does the text below actually state "
        "(1) a specific underlying mechanism/root cause - not a restatement of "
        "the symptom - and (2) specific file(s) or locations that were opened "
        "and checked for agreement with the change (a traversal), not just the "
        "edited lines. A vague, generic, or placeholder statement fails even if "
        "it uses the right words.\n\n"
        f"Files involved in this round: {sorted(files_expected)}\n\n"
        "--- TEXT TO CHECK ---\n"
        f"{statement_text.strip()}\n"
        "--- END ---\n\n"
        'Reply with ONLY: {"adequate": true or false, "reason": "one sentence"}'
    )
    try:
        proc = subprocess.run(
            ["claude", "-p", prompt, "--model", DEFAULT_MODEL, "--max-turns", "1",
             "--permission-mode", "dontAsk", "--allowedTools", "",
             "--max-budget-usd", MAX_BUDGET_USD],
            capture_output=True, text=True, timeout=TIMEOUT_SECONDS, env=env,
        )
    except (subprocess.TimeoutExpired, OSError):
        return False
    if proc.returncode != 0:
        return False
    match = re.search(r"\{.*\}", proc.stdout, re.DOTALL)
    if not match:
        return False
    try:
        verdict = json.loads(match.group(0))
    except json.JSONDecodeError:
        return False
    return verdict.get("adequate") is True


def update_locks(cwd, files, level, reason, round_key):
    path = os.path.join(_state_dir(cwd), LOCKS_FILENAME)
    locks = load_json(path, {})
    for f in files:
        locks[f] = {"level": level, "reason": reason, "round_key": round_key}
    save_json(path, locks)


def clear_locks(cwd, files):
    path = os.path.join(_state_dir(cwd), LOCKS_FILENAME)
    locks = load_json(path, {})
    for f in files:
        locks.pop(f, None)
    save_json(path, locks)


def handle_pretooluse(data):
    tool_name = data.get("tool_name")
    if tool_name not in ("Edit", "Write", "MultiEdit", "NotebookEdit"):
        allow()
    file_path = (data.get("tool_input") or {}).get("file_path")
    if not file_path:
        allow()
    path = os.path.join(_state_dir(data.get("cwd")), LOCKS_FILENAME)
    locks = load_json(path, {})
    lock = locks.get(file_path)
    if not lock:
        allow()
    level = lock.get("level", 0)
    reason = lock.get("reason", "")
    if level >= 2:
        deny_tool(
            f"REVIEW-CORRECTION CONVERGENCE GATE (lockout level 2): {file_path} "
            "has stalled through automated remediation twice. No further "
            "automated edits to this file - write a report to the user "
            f"describing the actual problem instead. ({reason})"
        )
    elif level == 1:
        deny_tool(
            f"REVIEW-CORRECTION CONVERGENCE GATE: {file_path} is locked pending "
            "the shared-root-cause + traversal statement required by the last "
            f"Stop block. Produce that first; this file cannot be edited again "
            f"until it does. ({reason})"
        )
    else:
        allow()


def active_level1_round_keys(cwd):
    """Every distinct round_key currently locked at escalation level 1 -
    read from locks.json, not inferred from this round's activity, so the
    unlock check runs even on a turn that (correctly) avoids touching the
    locked file at all."""
    path = os.path.join(_state_dir(cwd), LOCKS_FILENAME)
    locks = load_json(path, {})
    keys = set()
    for entry in locks.values():
        if entry.get("level") == 1 and entry.get("round_key"):
            keys.add(entry["round_key"])
    return keys


def handle_stop(data):
    if any(os.environ.get(v) == "1" for v in [_OWN_GUARD_ENV] + _SIBLING_GUARD_ENVS):
        allow()

    assistant_text = (data.get("last_assistant_message") or "").strip()
    if not assistant_text:
        allow()
    if data.get("background_tasks"):
        allow()

    cwd = data.get("cwd")
    entries = read_transcript_entries(data.get("transcript_path"))
    if not entries:
        allow()

    state_dir = _state_dir(cwd)

    # --- Unlock check FIRST, independent of what this round touched. ---
    # Escalation is tracked per round_key in locks.json; this must run
    # every firing while a level-1 lock is active, or a turn that
    # correctly investigates without editing the locked file (e.g. Read,
    # Grep) would never get its statement evaluated and the lock would
    # never lift. Verified directly: an earlier version of this script
    # skipped straight to an early allow() on exactly that turn shape.
    for round_key in active_level1_round_keys(cwd):
        state_path = os.path.join(state_dir, f"rounds-{_safe_key(round_key)}.json")
        state = load_json(state_path, {"counts": [], "file_rounds": [], "escalation_level": 0, "escalated_files": [], "prior_escalations": 0})
        if state.get("escalation_level") != 1:
            continue
        expected_files = set(state.get("escalated_files", []))
        if run_content_judge(assistant_text, expected_files):
            # A validated diagnosis resets the recurrence window - the
            # rounds that led to this escalation must not still be sitting
            # in counts/file_rounds ready to re-fire the instant this same
            # file is touched again. What carries forward is only the fact
            # that this round_key has been through escalation once, so a
            # SECOND stall skips straight to level 2 instead of repeating
            # level 1 as if this were the first time.
            state["escalation_level"] = 0
            state["escalated_files"] = []
            state["counts"] = []
            state["file_rounds"] = []
            state["prior_escalations"] = state.get("prior_escalations", 0) + 1
            save_json(state_path, state)
            clear_locks(cwd, expected_files)
        else:
            block_stop(
                "REVIEW-CORRECTION CONVERGENCE GATE: still waiting on the "
                "required statement for " + ", ".join(sorted(expected_files)) +
                " - name the actual shared mechanism behind the recurring "
                "problem (not a restatement of the symptom), and list the "
                "specific files/locations you opened to check they still "
                "agree with the change. Nothing else unlocks these files."
            )
            return

    last_user_idx = find_last_user_index(entries)
    start = (last_user_idx or 0) + 1
    tool_calls = tool_uses_since(entries, start)
    touched = files_touched(tool_calls)

    pr = find_active_pr(entries)
    round_key = None
    mode = None
    value = None

    if pr:
        owner, repo, number = pr
        c = pr_finding_count(owner, repo, number)
        if c is not None:
            round_key = f"pr-{owner}-{repo}-{number}"
            mode, value = "count", c

    if mode is None:
        rf_count = report_findings_count(tool_calls)
        if rf_count is not None:
            round_key = f"session-{data.get('session_id', 'unknown')}-findings"
            mode, value = "count", rf_count

    if mode is None and touched:
        round_key = f"session-{data.get('session_id', 'unknown')}-files"
        mode, value = "files", touched

    if mode is None:
        allow()

    state_path = os.path.join(state_dir, f"rounds-{_safe_key(round_key)}.json")
    state = load_json(state_path, {"counts": [], "file_rounds": [], "escalation_level": 0, "escalated_files": [], "prior_escalations": 0})

    if mode == "count":
        state["counts"].append(value)
        fired = count_tripwire(state["counts"])
    else:
        state["file_rounds"].append(sorted(value))
        fired = file_tripwire(state["file_rounds"], SAME_FILE_ROUNDS_THRESHOLD)

    if not fired:
        save_json(state_path, state)
        allow()

    escalated_files = sorted(touched) if touched else state.get("escalated_files", [])
    prior = state.get("prior_escalations", 0)

    if prior == 0:
        # First stall on this round_key - escalate to level 1: forced
        # diagnosis + traversal, edits locked until it's produced.
        state["escalation_level"] = 1
        state["escalated_files"] = escalated_files
        save_json(state_path, state)
        update_locks(
            cwd, escalated_files, 1,
            f"convergence tripwire fired on {round_key}", round_key,
        )
        detail = (
            "the outstanding-item count didn't strictly decrease for two "
            "consecutive rounds"
            if mode == "count" else
            f"the same file(s) ({', '.join(escalated_files)}) have now "
            f"been touched in {SAME_FILE_ROUNDS_THRESHOLD} consecutive "
            "correction rounds"
        )
        block_stop(
            "REVIEW-CORRECTION CONVERGENCE GATE: this round did not show real "
            f"progress over the last two - {detail}. Do not propose or apply "
            "another isolated patch. Before touching "
            f"{', '.join(escalated_files) or 'these files'} again: "
            "(1) state the actual shared mechanism behind what keeps "
            "recurring here - not the symptom, the reason it keeps happening; "
            "(2) open every place that references or is referenced by this "
            "code and confirm it still agrees with the change. Those files "
            "are locked against further edits until that statement is "
            "produced."
        )
        return

    # prior >= 1: this round_key already went through escalation once, was
    # validated and unlocked, and has now stalled again. The automated
    # remediation step has failed twice - skip straight to full lockout
    # rather than asking for a diagnosis a second time.
    state["escalation_level"] = 2
    state["escalated_files"] = escalated_files
    save_json(state_path, state)
    update_locks(
        cwd, escalated_files, 2,
        f"stall #{prior + 1} on {round_key} after a prior validated escalation", round_key,
    )
    block_stop(
        "REVIEW-CORRECTION CONVERGENCE GATE (escalation level 2): "
        f"{round_key} already went through the diagnosis-and-unlock step "
        "once and has now stalled again. The automated remediation has "
        "failed twice - do not attempt another automated fix. Write a "
        "plain report to the user describing what actually keeps happening "
        f"here and why the validated fix didn't hold, and stop there. "
        f"{', '.join(escalated_files)} are locked."
    )
    return


def main():
    data = read_stdin_json()
    event = data.get("hook_event_name")
    if event == "PreToolUse":
        handle_pretooluse(data)
    else:
        handle_stop(data)


if __name__ == "__main__":
    try:
        main()
    except SystemExit:
        raise
    except Exception as exc:
        # Fail OPEN, unlike the sibling gates - deliberately different.
        # Those gates' worst case on failure is one annoying extra block
        # that clears next turn. This gate's worst case, if it fails
        # closed, is a persistent cross-turn file lock a bug can't clear -
        # a much worse failure mode than letting one turn through
        # unchecked while the crash gets fixed.
        sys.stderr.write(f"convergence-gate crashed: {exc!r}\n")
        sys.exit(0)
