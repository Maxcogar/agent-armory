---
name: implement
description: Execute implementation phase for current step
---

# Implementation Phase Executor

Execute the implementation phase for the current step (auto-detected from STATUS.md).

## Instructions

1. **Read STATUS.md** to determine current step and phase
```bash
cat Planning/STATUS.md
```

2. **Validate** we're in implementation phase (setup complete, verification pending)
   - If not in right phase, show error and correct command to run

3. **Read the implementation guide** for the current step:
```bash
cat Planning/PHASE2_implementation.md  # (or appropriate step)
```

4. **Read the plan** for detailed edits:
```bash
cat Planning/PLAN_step1-schema-and-db.md  # (or appropriate step)
```

5. **Create implementation branch:**
```bash
git checkout -b step1-implementation  # (or appropriate step)
```

6. **Execute ALL edits systematically:**
   - For each file:
     - Mark TodoWrite task as in_progress
     - Execute edit using Edit tool
     - Read back section to verify
     - Mark TodoWrite task as completed
     - Commit changes

7. **Verify no syntax errors:**
```bash
cd server && npm run lint
```

8. **Test server starts:**
```bash
cd server && npm run dev
# Check for errors, then stop
```

9. **Update STATUS.md** to mark implementation complete, verification pending

10. **Create handoff document:**
```bash
# Create Planning/HANDOFF_implementation-complete.md
```

11. **Commit all changes:**
```bash
git add .
git commit -m "feat: Complete implementation phase for Step X"
git push origin step1-implementation
```

12. **Show next action:** "Implementation complete. Next: run /verify"
