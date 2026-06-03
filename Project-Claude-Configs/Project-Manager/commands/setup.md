---
name: setup
description: Execute setup phase for current step
---

# Setup Phase Executor

Execute the setup phase for the current step (auto-detected from STATUS.md).

## Instructions

1. **Read STATUS.md** to determine current step (1-4):
```bash
cat Planning/STATUS.md
```

2. **Read PLAN file** for this step to understand what needs verification:
```bash
cat Planning/PLAN_step[N]-*.md
```

3. **CREATE verification script** `scripts/verification/verify-step[N].js`:
   - Generate automated checks based on PLAN
   - Check schema changes, migrations, function additions/removals
   - Validate all edits landed correctly
   - Use verify-step1.js as template

4. **CREATE pre-flight checklist** `scripts/verification/PRE_FLIGHT_CHECKLIST_step[N].md`:
   - Git safety checks (branch, clean tree, checkpoint tag)
   - Database backup creation
   - Line number validation for all files in PLAN
   - Dependencies installed check

5. **CREATE implementation protocol** `scripts/verification/IMPLEMENTATION_PROTOCOL_step[N].md`:
   - Document 5-layer safety system
   - Edit-by-edit verification protocol
   - Rollback procedures
   - Success criteria for this step

6. **Initialize TodoWrite** with all tasks:
   - Count total edits from PLAN file
   - 1 pre-flight task
   - N edit tasks (one per edit in PLAN)
   - 1 automated verification task
   - M manual verification tasks
   - 1 final review task

7. **Create database backup:**
```bash
mkdir -p ~/.agentboard
cp ~/.agentboard/agentboard.db ~/.agentboard/agentboard.db.backup-step[N]-$(date +%Y%m%d-%H%M%S)
```

8. **Create git checkpoint:**
```bash
git tag step[N-1]-complete  # Tag end of previous step
```

9. **Validate all files** exist at line numbers specified in PLAN

10. **Update STATUS.md:**
    - Set current step to N
    - Set phase to "Setup Complete → Implementation Pending"
    - Update TodoWrite count (1/X complete)
    - Add setup completion timestamp

11. **Commit setup infrastructure:**
```bash
git add scripts/ Planning/STATUS.md
git commit -m "build: Add Step [N] verification infrastructure"
git push origin review
```

12. **Show summary:**
    - Verification script created
    - TodoWrite initialized (X tasks)
    - Database backup location
    - Git checkpoint tag
    - **Next command: /implement**
