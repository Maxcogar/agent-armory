\# Enforcement Mechanisms for Claude Code Solutions



Don't hope the LLM remembers to do things - enforce correct behavior mechanically using Claude Code's hook system, state files, and validation scripts.



\## Hook System Overview



Claude Code provides hooks that execute at specific lifecycle points:

\- \*\*PreToolUse\*\*: Before any tool executes (can block execution)

\- \*\*PostToolUse\*\*: After tool completes (can perform cleanup/logging)

\- \*\*SessionStart\*\*: When Claude Code session begins

\- \*\*SessionEnd\*\*: When session ends (can enforce completion requirements)



\## Hook Configuration



\*\*File\*\*: `.claude/hooks.json`

```json

{

&nbsp; "hooks": {

&nbsp;   "PreToolUse": \[

&nbsp;     {

&nbsp;       "matcher": "Write|Edit|Bash",

&nbsp;       "hooks": \[{"type": "command", "command": "script.sh"}]

&nbsp;     }

&nbsp;   ],

&nbsp;   "PostToolUse": \[

&nbsp;     {

&nbsp;       "matcher": "Write",

&nbsp;       "hooks": \[{"type": "command", "command": "log.sh"}]

&nbsp;     }

&nbsp;   ],

&nbsp;   "SessionEnd": \[

&nbsp;     {

&nbsp;       "hooks": \[{"type": "command", "command": "require-doc.sh"}]

&nbsp;     }

&nbsp;   ]

&nbsp; }

}

```



\## Common Enforcement Patterns



\### Pattern 1: Mandatory Checkpoint Before Changes



\*\*Hook\*\*: `.claude/hooks/enforce-checkpoint.sh`

```bash

\#!/bin/bash

\# BLOCK all changes until git checkpoint exists



if \[ ! -f .workflow/checkpoint-exists ]; then

&nbsp;   echo "❌ ERROR: No checkpoint found"

&nbsp;   echo "Run: git commit -m 'Checkpoint: \[description]'"

&nbsp;   exit 1

fi



\# Verify checkpoint is recent

checkpoint\_age=$(( $(date +%s) - $(stat -f %m .workflow/checkpoint-exists 2>/dev/null || stat -c %Y .workflow/checkpoint-exists) ))

if \[ $checkpoint\_age -gt 3600 ]; then

&nbsp;   echo "❌ ERROR: Checkpoint too old (>1 hour)"

&nbsp;   echo "Create fresh checkpoint before continuing"

&nbsp;   exit 1

fi



exit 0

```



\*\*Hooks config\*\*:

```json

{

&nbsp; "hooks": {

&nbsp;   "PreToolUse": \[{

&nbsp;     "matcher": "Write|Edit|Bash",

&nbsp;     "hooks": \[{

&nbsp;       "type": "command",

&nbsp;       "command": ".claude/hooks/enforce-checkpoint.sh"

&nbsp;     }]

&nbsp;   }]

&nbsp; }

}

```



\### Pattern 2: Required Analysis Before Implementation



\*\*State file\*\*: `.workflow/state.json`

```json

{

&nbsp; "phase": "investigation",

&nbsp; "required\_outputs": \[

&nbsp;   "root\_cause\_analysis",

&nbsp;   "solution\_confidence\_score",

&nbsp;   "risk\_assessment"

&nbsp; ],

&nbsp; "completed\_outputs": \[],

&nbsp; "can\_implement": false

}

```



\*\*Hook\*\*: `.claude/hooks/enforce-analysis.sh`

```bash

\#!/bin/bash

\# BLOCK implementation until analysis complete



STATE\_FILE=".workflow/state.json"



\# Check if analysis phase complete

phase=$(jq -r '.phase' $STATE\_FILE)

if \[ "$phase" != "analysis\_complete" ]; then

&nbsp;   required=$(jq -r '.required\_outputs\[]' $STATE\_FILE)

&nbsp;   completed=$(jq -r '.completed\_outputs\[]' $STATE\_FILE)

&nbsp;   

&nbsp;   echo "❌ ERROR: Analysis incomplete"

&nbsp;   echo "Required outputs:"

&nbsp;   echo "$required"

&nbsp;   echo ""

&nbsp;   echo "Completed:"

&nbsp;   echo "$completed"

&nbsp;   exit 1

fi



exit 0

```



\### Pattern 3: Comprehensive Validation Required



\*\*Hook\*\*: `.claude/hooks/enforce-validation.sh`

```bash

\#!/bin/bash

\# BLOCK commit until all validations pass



echo "Running mandatory validations..."



\# 1. Tests must pass

if ! npm test \&> /dev/null; then

&nbsp;   echo "❌ Tests failed"

&nbsp;   echo "Run: npm test"

&nbsp;   exit 1

fi



\# 2. Linting must pass

if ! npm run lint \&> /dev/null; then

&nbsp;   echo "❌ Linting failed"

&nbsp;   exit 1

fi



\# 3. Type checking must pass

if ! npm run type-check \&> /dev/null; then

&nbsp;   echo "❌ Type errors found"

&nbsp;   exit 1

fi



\# 4. No console.logs in production code

if grep -r "console.log" src/ --exclude-dir=node\_modules \&> /dev/null; then

&nbsp;   echo "❌ console.log found in src/"

&nbsp;   exit 1

fi



echo "✅ All validations passed"

exit 0

```



\### Pattern 4: Outcome Documentation Mandatory



\*\*Hook\*\*: `.claude/hooks/require-outcome-doc.sh`

```bash

\#!/bin/bash

\# SessionEnd hook - require outcome documentation



OUTCOME\_FILE=".workflow/outcome.md"



if \[ ! -f $OUTCOME\_FILE ]; then

&nbsp;   echo "❌ ERROR: Session ending without outcome documentation"

&nbsp;   echo ""

&nbsp;   echo "You must document what happened:"

&nbsp;   echo "  • What was the problem?"

&nbsp;   echo "  • What did you try?"

&nbsp;   echo "  • What was the result (success/failure)?"

&nbsp;   echo "  • What did you learn?"

&nbsp;   echo ""

&nbsp;   echo "Create: $OUTCOME\_FILE"

&nbsp;   echo "Or run: /document-outcome"

&nbsp;   exit 1

fi



\# Verify outcome file has minimum content

word\_count=$(wc -w < $OUTCOME\_FILE)

if \[ $word\_count -lt 50 ]; then

&nbsp;   echo "❌ ERROR: Outcome documentation too brief ($word\_count words)"

&nbsp;   echo "Provide meaningful documentation (minimum 50 words)"

&nbsp;   exit 1

fi



echo "✅ Outcome documented"

exit 0

```



\## State File Patterns



\### Sequential Phase Enforcement



\*\*State\*\*: `.workflow/phase-state.json`

```json

{

&nbsp; "phases": \[

&nbsp;   {"name": "investigation", "required": true, "complete": false},

&nbsp;   {"name": "planning", "required": true, "complete": false},

&nbsp;   {"name": "implementation", "required": true, "complete": false},

&nbsp;   {"name": "validation", "required": true, "complete": false}

&nbsp; ],

&nbsp; "current\_phase": 0,

&nbsp; "can\_skip": false

}

```



\*\*Enforcement script\*\*:

```python

\#!/usr/bin/env python3

import json

import sys



def check\_phase\_progression():

&nbsp;   with open('.workflow/phase-state.json') as f:

&nbsp;       state = json.load(f)

&nbsp;   

&nbsp;   current = state\['current\_phase']

&nbsp;   phases = state\['phases']

&nbsp;   

&nbsp;   # Check if current phase is complete

&nbsp;   if not phases\[current]\['complete']:

&nbsp;       print(f"❌ Current phase '{phases\[current]\['name']}' not complete")

&nbsp;       print(f"Complete current phase before proceeding")

&nbsp;       sys.exit(1)

&nbsp;   

&nbsp;   # Check if trying to skip phases

&nbsp;   if not state\['can\_skip']:

&nbsp;       for i in range(current):

&nbsp;           if not phases\[i]\['complete']:

&nbsp;               print(f"❌ Cannot skip phase '{phases\[i]\['name']}'")

&nbsp;               sys.exit(1)

&nbsp;   

&nbsp;   print(f"✅ Phase progression valid")

&nbsp;   sys.exit(0)



if \_\_name\_\_ == "\_\_main\_\_":

&nbsp;   check\_phase\_progression()

```



\## Validation Gates



\### Pre-Implementation Gate



```bash

\#!/bin/bash

\# Comprehensive pre-implementation checks



echo "Pre-implementation validation gate..."



\# 1. Root cause must be identified

if ! grep -q "Root Cause:" .workflow/analysis.md; then

&nbsp;   echo "❌ Root cause not documented"

&nbsp;   exit 1

fi



\# 2. Solution confidence must be high

confidence=$(grep "Confidence:" .workflow/plan.md | grep -oP '\\d+')

if \[ "$confidence" -lt 70 ]; then

&nbsp;   echo "❌ Solution confidence too low ($confidence%)"

&nbsp;   echo "Minimum required: 70%"

&nbsp;   exit 1

fi



\# 3. Risk assessment must exist

if \[ ! -f .workflow/risk-assessment.md ]; then

&nbsp;   echo "❌ Risk assessment missing"

&nbsp;   exit 1

fi



\# 4. Rollback plan must be defined

if ! grep -q "Rollback:" .workflow/plan.md; then

&nbsp;   echo "❌ No rollback plan defined"

&nbsp;   exit 1

fi



echo "✅ Pre-implementation checks passed"

exit 0

```



\### Post-Implementation Gate



```bash

\#!/bin/bash

\# Verification before marking complete



echo "Post-implementation validation gate..."



\# 1. All tests must pass

./scripts/run-tests.sh || {

&nbsp;   echo "❌ Tests failed"

&nbsp;   exit 1

}



\# 2. Original issue must be resolved

echo "Manual verification required:"

echo "1. Does the original issue still occur?"

echo "2. Are there any regressions?"

echo "3. Do edge cases work correctly?"

echo ""

read -p "Confirm all checks passed (yes/no): " confirm



if \[ "$confirm" != "yes" ]; then

&nbsp;   echo "❌ Manual verification not confirmed"

&nbsp;   exit 1

fi



\# 3. Success criteria must be documented

if ! grep -q "Success Criteria Met:" .workflow/outcome.md; then

&nbsp;   echo "❌ Success criteria not documented"

&nbsp;   exit 1

fi



echo "✅ Post-implementation checks passed"

exit 0

```



\## Automatic Rollback on Failure



```bash

\#!/bin/bash

\# PostToolUse hook for Write/Edit tools

\# Automatically rollback if changes break tests



TOOL\_NAME=$(echo "$CLAUDE\_TOOL\_RESULT" | jq -r '.tool\_name')



if \[\[ "$TOOL\_NAME" == "Write" || "$TOOL\_NAME" == "Edit" ]]; then

&nbsp;   # Run tests

&nbsp;   if ! npm test \&> /dev/null; then

&nbsp;       echo "⚠️  Changes broke tests - AUTOMATIC ROLLBACK"

&nbsp;       

&nbsp;       # Revert changes

&nbsp;       git checkout HEAD -- $(echo "$CLAUDE\_TOOL\_RESULT" | jq -r '.file\_path')

&nbsp;       

&nbsp;       # Document failure

&nbsp;       cat >> .workflow/failures.log << EOF

\[$(date)] Automatic rollback triggered

Tool: $TOOL\_NAME

File: $(echo "$CLAUDE\_TOOL\_RESULT" | jq -r '.file\_path')

Reason: Tests failed after changes

EOF

&nbsp;       

&nbsp;       echo "❌ Changes reverted. Review .workflow/failures.log"

&nbsp;       exit 1

&nbsp;   fi

fi



exit 0

```



\## Command Enforcement Patterns



\### Mandatory Commands Before Proceeding



```markdown

---

name: debug-systematic

description: Systematic debugging with enforcement

---



\# Systematic Debug Workflow



⚠️  \*\*ENFORCEMENT ACTIVE\*\*: Steps cannot be skipped



\## Step 1: Create Checkpoint (MANDATORY)

Run: `/checkpoint "Pre-debug"`



\*Hook will block all changes until checkpoint exists\*



\## Step 2: Investigation (MANDATORY)

\[Investigation work]



\*Must complete before Step 3. State file enforced.\*



\## Step 3: Planning (MANDATORY)

\[Planning work]



\*Confidence score >70% required. Hook enforced.\*



\## Step 4: Implementation

\[Implementation work]



\*All validations must pass. Hook enforced.\*



\## Step 5: Documentation (MANDATORY)

\*SessionEnd hook will block exit until complete\*

```



\## Audit Trail Enforcement



```bash

\#!/bin/bash

\# PostToolUse hook - log all actions



LOG\_FILE=".workflow/audit-trail.log"



TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

TOOL=$(echo "$CLAUDE\_TOOL\_RESULT" | jq -r '.tool\_name')

RESULT=$(echo "$CLAUDE\_TOOL\_RESULT" | jq -r '.result\_summary')



\# Log entry

cat >> $LOG\_FILE << EOF

---

timestamp: $TIMESTAMP

tool: $TOOL

result: $RESULT

user\_approved: ${CLAUDE\_USER\_APPROVED:-false}

---

EOF



\# Ensure log is committed

git add $LOG\_FILE

git commit --amend --no-edit --no-verify \&> /dev/null || true



exit 0

```



\## Implementation Guidelines



\### When to Add Enforcement



\*\*Do enforce when\*\*:

\- ✅ Mistakes are very costly

\- ✅ Process used by multiple people

\- ✅ Safety is critical

\- ✅ Compliance/audit required

\- ✅ Previous failures from skipped steps



\*\*Don't enforce when\*\*:

\- ❌ Simple one-off tasks

\- ❌ Just you using it

\- ❌ Enforcement friction > value

\- ❌ Trusted simple workflows



\### How to Add Enforcement



1\. \*\*Identify critical decision points\*\*

&nbsp;  - Where mistakes happen

&nbsp;  - Where steps get skipped

&nbsp;  - Where validation is essential



2\. \*\*Choose appropriate hooks\*\*

&nbsp;  - PreToolUse: Prevent actions

&nbsp;  - PostToolUse: Verify actions

&nbsp;  - SessionEnd: Ensure completion



3\. \*\*Implement enforcement scripts\*\*

&nbsp;  - Make them fast (<1 second)

&nbsp;  - Give clear error messages

&nbsp;  - Suggest remediation steps



4\. \*\*Test enforcement\*\*

&nbsp;  - Try to bypass it

&nbsp;  - Verify error messages are clear

&nbsp;  - Ensure legitimate work isn't blocked



5\. \*\*Document enforcement\*\*

&nbsp;  - Why it exists

&nbsp;  - How to satisfy requirements

&nbsp;  - Emergency overrides if needed



\### Emergency Override



Sometimes enforcement needs to be temporarily disabled:



```bash

\# Disable enforcement for this session

export CLAUDE\_DISABLE\_ENFORCEMENT=true



\# Or for specific hooks

export CLAUDE\_DISABLE\_CHECKPOINT\_HOOK=true



\# Document why in audit log

echo "\[$(date)] Enforcement disabled by $USER: $REASON" >> .workflow/audit-trail.log

```



\*\*Important\*\*: Emergency overrides should be rare and always documented.



\## Quick Reference



| Need | Hook | Pattern |

|------|------|---------|

| Checkpoint before changes | PreToolUse on Write/Edit | State file check |

| Sequential phases | PreToolUse on phase transitions | Phase state JSON |

| Tests must pass | PostToolUse on Write/Edit | Run tests, rollback if fail |

| Documentation required | SessionEnd | Check file exists |

| Audit trail | PostToolUse on all tools | Append to log |

| Validation gates | PreToolUse on critical tools | Multi-check script |



\## Complete Example: Enforced Debug Workflow



\*\*Directory structure\*\*:

```

.claude/

├── hooks.json

└── hooks/

&nbsp;   ├── enforce-checkpoint.sh

&nbsp;   ├── enforce-analysis.sh

&nbsp;   ├── enforce-validation.sh

&nbsp;   └── require-outcome.sh

.workflow/

├── state.json

├── checkpoint-exists

├── analysis.md

├── plan.md

├── risk-assessment.md

└── outcome.md

```



\*\*hooks.json\*\*:

```json

{

&nbsp; "hooks": {

&nbsp;   "PreToolUse": \[

&nbsp;     {

&nbsp;       "matcher": "Write|Edit",

&nbsp;       "hooks": \[

&nbsp;         {"type": "command", "command": ".claude/hooks/enforce-checkpoint.sh"},

&nbsp;         {"type": "command", "command": ".claude/hooks/enforce-analysis.sh"}

&nbsp;       ]

&nbsp;     },

&nbsp;     {

&nbsp;       "matcher": "Bash.\*git commit",

&nbsp;       "hooks": \[

&nbsp;         {"type": "command", "command": ".claude/hooks/enforce-validation.sh"}

&nbsp;       ]

&nbsp;     }

&nbsp;   ],

&nbsp;   "SessionEnd": \[

&nbsp;     {

&nbsp;       "hooks": \[

&nbsp;         {"type": "command", "command": ".claude/hooks/require-outcome.sh"}

&nbsp;       ]

&nbsp;     }

&nbsp;   ]

&nbsp; }

}

```



This creates an unbreakable enforcement chain:

1\. Can't change code without checkpoint

2\. Can't change code without analysis

3\. Can't commit without validation

4\. Can't end session without documentation



\*\*Result\*\*: Guaranteed process compliance

