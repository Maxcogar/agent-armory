---
name: verify
description: Execute verification phase for current step
---

# Verification Phase Executor

Execute the verification phase for the current step (auto-detected from STATUS.md).

## Instructions

1. **Read STATUS.md** to determine current step and phase
```bash
cat Planning/STATUS.md
```

2. **Validate** we're in verification phase (implementation complete)
   - If not in right phase, show error and correct command to run

3. **Read the verification guide** for the current step:
```bash
cat Planning/PHASE3_verification.md  # (or appropriate step)
```

4. **Read implementation handoff:**
```bash
cat Planning/HANDOFF_implementation-complete.md
```

5. **Checkout implementation branch:**
```bash
git checkout step1-implementation  # (or appropriate step)
```

6. **Run automated verification:**
```bash
node scripts/verification/verify-step1.js  # (or appropriate step)
```
   - Mark TodoWrite task #19 as completed
   - If any check fails, document and proceed to rollback

7. **Execute manual verification steps:**
   - Follow all 8 verification steps from guide
   - Mark each TodoWrite task (20-27) as completed
   - Document any failures

8. **Code review:**
   - Review git diff
   - Check for unintended changes
   - Verify commit quality
   - Mark TodoWrite task #28 as completed

9. **Decision point:**

   **If all checks passed:**
   - Update STATUS.md to "Verification Complete"
   - Mark TodoWrite task #29 as completed (29/29)
   - Create completion commit
   - Tag as step1-complete
   - Merge to main (or create PR)
   - Show: "Step X complete! Ready for next step."

   **If any checks failed:**
   - Document failures in Planning/VERIFICATION_FAILED.md
   - Restore database backup
   - Reset code to step0-complete
   - Update STATUS.md to "Verification Failed"
   - Show: "Verification failed. See VERIFICATION_FAILED.md for details."

10. **Show next action** based on outcome
