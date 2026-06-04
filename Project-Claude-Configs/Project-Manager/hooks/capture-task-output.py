#!/usr/bin/env python3
"""
Expert Standard — Task Output Capture (TaskCompleted)

Fires when any task is marked complete. Saves the full hook input
to a timestamped file so the main agent cannot filter, soften, or
drop findings when it summarizes the results.
"""

import json
import os
import sys
from datetime import datetime

def main():
    try:
        input_data = json.load(sys.stdin)
    except (json.JSONDecodeError, EOFError):
        sys.exit(0)

    project_dir = os.environ.get("CLAUDE_PROJECT_DIR", ".")
    log_dir = os.path.join(project_dir, ".claude", "hooks", "task-logs")
    os.makedirs(log_dir, exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    log_file = os.path.join(log_dir, f"task-{timestamp}.json")

    with open(log_file, "w") as f:
        json.dump(input_data, f, indent=2, default=str)

    sys.exit(0)

if __name__ == "__main__":
    main()
