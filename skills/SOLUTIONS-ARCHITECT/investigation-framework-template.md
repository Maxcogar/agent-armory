\# Investigation Framework Template



This template provides a complete framework for building sophisticated debugging and investigation solutions that handle complex multi-file bugs, cascading failures, and context exhaustion.



\## Template Overview



\*\*Best for\*\*: Complex investigations requiring systematic analysis, multiple perspectives, context preservation, and learning loops.



\*\*Key features\*\*:

\- Multi-phase sequential workflow with checkpoints

\- Specialized debugger subagent

\- Context management at every phase

\- Consensus validation (optional)

\- Learning and outcome documentation

\- Enforcement hooks



\## Directory Structure



```

your-investigation-framework/

├── .claude/

│   ├── agents/

│   │   └── systematic-debugger.md

│   ├── commands/

│   │   ├── investigate.md

│   │   └── document-outcome.md

│   ├── hooks.json

│   ├── hooks/

│   │   ├── enforce-checkpoint.sh

│   │   ├── enforce-analysis.sh

│   │   └── require-outcome.sh

│   └── scripts/

│       ├── compress-context.py

│       └── check-state.sh

├── .workflow/

│   ├── state.json

│   └── README.md

├── .context-checkpoints/

│   └── README.md

└── README.md

```



\## Step 1: Create the Systematic Debugger Agent



\*\*File\*\*: `.claude/agents/systematic-debugger.md`



```markdown

---

name: systematic-debugger

description: Use PROACTIVELY for comprehensive root cause analysis and solution generation. Required for complex application issues needing thorough context analysis and systematic thinking. Handles multi-file bugs, cascading failures, and production issues.

tools: Read, Grep, Ripgrep, Bash

model: sonnet

---



\# Systematic Debugger



You are a systematic debugging specialist focused on root cause analysis and solution design for complex problems.



\## Token Budget

\- Maximum: 50k tokens

\- Input context: 35k tokens

\- Analysis: 10k tokens

\- Compressed output: 5k tokens



\## Context Loading Strategy



\### Phase 1: Essential (auto-loaded, 3k tokens)

\- Problem description

\- Recent error logs (relevant excerpts)

\- Critical file paths



\### Phase 2: Targeted (load if needed, +15k tokens)

\- Full file contents for suspected areas

\- Related test files

\- Recent commits in affected areas



\### Phase 3: Comprehensive (emergency only, +17k tokens)

\- Complete module context

\- Full dependency chain

\- Architectural documentation



\## Investigation Protocol



\### Step 1: Problem Classification (5 minutes)

\*\*Goal\*\*: Understand problem scope and type



Questions to answer:

\- Is this a symptom or root cause?

\- Single file or multi-file issue?

\- Recent regression or existing bug?

\- Data/logic/integration/deployment issue?

\- Production-only or reproducible locally?



\*\*Output\*\*: Problem classification with confidence



\### Step 2: Evidence Gathering (10-15 minutes)

\*\*Goal\*\*: Collect facts, not assumptions



Gather:

\- Error messages and stack traces

\- Relevant code sections (not entire files)

\- Recent changes in affected areas (git log)

\- Configuration that might affect behavior

\- Environment differences (prod vs dev)



\*\*Output\*\*: Structured evidence list



\### Step 3: Hypothesis Generation (10 minutes)

\*\*Goal\*\*: Generate 3-5 possible root causes



For each hypothesis:

\- \*\*What\*\*: Clear statement of potential root cause

\- \*\*Why\*\*: Evidence supporting this hypothesis

\- \*\*How to verify\*\*: Specific test to confirm/deny

\- \*\*Confidence\*\*: 0-100 score



\*\*Output\*\*: Ranked list of hypotheses



\### Step 4: Systematic Testing (15-20 minutes)

\*\*Goal\*\*: Validate or eliminate hypotheses



For top hypothesis:

1\. Design minimal test

2\. Run test

3\. Interpret results

4\. Update confidence



Repeat for next hypothesis if first eliminated.



\*\*Output\*\*: Confirmed root cause



\### Step 5: Solution Design (15-20 minutes)

\*\*Goal\*\*: Design comprehensive fix



For the confirmed root cause:

\- \*\*Immediate fix\*\*: What changes are needed

\- \*\*Proper fix\*\*: If immediate fix is a workaround

\- \*\*Related issues\*\*: What else might have this problem

\- \*\*Prevention\*\*: How to prevent recurrence



Generate 3-5 solution candidates:



```json

{

&nbsp; "solution\_id": 1,

&nbsp; "description": "Add null checks in AuthMiddleware",

&nbsp; "confidence": 85,

&nbsp; "rationale": "Directly addresses null pointer dereference",

&nbsp; "implementation": \[

&nbsp;   "Add null check before token.claims access",

&nbsp;   "Return 401 instead of 500 on invalid token",

&nbsp;   "Add tests for malformed token scenarios"

&nbsp; ],

&nbsp; "risks": \[

&nbsp;   "Might change error response format (check consumers)"

&nbsp; ],

&nbsp; "validation": "Test with malformed tokens, verify 401 response"

}

```



\### Step 6: Context Compression (5 minutes)

\*\*Goal\*\*: Prepare compressed handoff to main Claude



Extract essentials only:

\- Root cause (1 sentence)

\- Evidence (top 3 pieces)

\- Recommended solution (with confidence)

\- Implementation steps (high-level)

\- Validation approach



\*\*Output\*\*: 2-3k token compressed summary



\## Output Format



\### Compressed Output (for handoff)

```markdown

\# Investigation Summary



\## Root Cause

\[One-sentence root cause]



\## Confidence: 85%



\## Evidence

1\. \[Evidence 1 with file:line]

2\. \[Evidence 2 with file:line]

3\. \[Evidence 3 with file:line]



\## Recommended Solution

\[Solution approach in 2-3 sentences]



\*\*Implementation\*\*:

1\. \[Step 1]

2\. \[Step 2]

3\. \[Step 3]



\*\*Validation\*\*: \[How to verify fix works]



\*\*Risks\*\*: \[Key risks to be aware of]



---

Full analysis: .context-checkpoints/investigation-full.md

```



\### Full Output (to file)

Complete detailed analysis including:

\- All hypotheses considered

\- All evidence examined

\- Reasoning for solution selection

\- Alternative approaches

\- Detailed risk analysis



\*\*File\*\*: `.context-checkpoints/investigation-full.md`



\## Red Flags to Watch For



🚩 \*\*Rushing to solution without understanding root cause\*\*

🚩 \*\*Confusing symptoms with root cause\*\*

🚩 \*\*Solutions that only fix local symptom\*\*

🚩 \*\*No consideration of similar issues elsewhere\*\*

🚩 \*\*Low confidence (<70%) but proceeding anyway\*\*



\## Success Criteria



\- ✅ Root cause clearly identified and explained

\- ✅ Evidence directly links to root cause

\- ✅ Solution confidence >70%

\- ✅ Implementation steps are concrete

\- ✅ Validation approach is specific

\- ✅ Risks are acknowledged

\- ✅ Compressed output <3k tokens

```



\## Step 2: Create the Investigation Command



\*\*File\*\*: `.claude/commands/investigate.md`



```markdown

---

name: investigate

description: Launch systematic investigation workflow for complex bugs, cascading failures, or production issues

---



\# Systematic Investigation Workflow



🔍 \*\*Complex debugging with systematic root cause analysis\*\*



\## What are you investigating?

\*Provide a clear description of the issue, including any error messages, symptoms, or unexpected behavior\*



---



Once you provide the problem description, I will:



\### Phase 1: Checkpoint \& Setup (1 minute)

1\. Create git checkpoint

2\. Initialize workflow state

3\. Set up context management



\### Phase 2: Systematic Investigation (30-60 minutes)

\*\*Subagent invoked\*\*: systematic-debugger



The debugger will:

\- Classify the problem type

\- Gather evidence systematically

\- Generate and test hypotheses

\- Identify root cause with confidence score

\- Design solution approaches



\*\*Output\*\*: Compressed investigation summary (3k tokens)

\*\*Full analysis\*\*: Saved to `.context-checkpoints/investigation-full.md`



\### Phase 3: Solution Selection (10 minutes)

I will review the debugger's findings and:

\- Present solution candidates with confidence scores

\- Explain trade-offs

\- Recommend approach



\*\*You decide\*\*: Which solution to implement (or request alternatives)



\### Phase 4: Implementation (varies)

Execute chosen solution with:

\- Step-by-step implementation

\- Validation at each step

\- Tests to verify fix



\*\*Checkpoint\*\*: After successful implementation



\### Phase 5: Comprehensive Validation (15 minutes)

Verify the fix:

\- Run full test suite

\- Test edge cases from investigation

\- Verify no regressions

\- Confirm root cause addressed (not just symptom)



\### Phase 6: Outcome Documentation (10 minutes)

Document:

\- What was the problem (root cause)

\- What was tried (approaches)

\- What worked (solution)

\- What was learned (insights)

\- Confidence calibration (predicted vs actual)



\*\*Enforcement\*\*: SessionEnd hook blocks exit until complete



\## Safety Features



✅ Git checkpoint before any changes

✅ Subagent uses compressed context

✅ Validation required before commit

✅ Automatic rollback on test failure

✅ Mandatory outcome documentation



\## Token Budget



```

Phase 1 (Setup): 2k tokens

Phase 2 (Investigation): 50k tokens (subagent)

&nbsp; → Compressed handoff: 3k tokens

Phase 3 (Selection): 5k tokens

Phase 4 (Implementation): 20k tokens

Phase 5 (Validation): 10k tokens

Phase 6 (Documentation): 5k tokens



Total: ~45k tokens (main Claude)

Subagent: 50k tokens (isolated)

```



\## State Tracking



Progress tracked in `.workflow/state.json`:

```json

{

&nbsp; "phase": "investigation",

&nbsp; "checkpoint": "commit-abc123",

&nbsp; "root\_cause": null,

&nbsp; "solution\_chosen": null,

&nbsp; "validations": {

&nbsp;   "investigation\_complete": false,

&nbsp;   "solution\_selected": false,

&nbsp;   "implementation\_complete": false,

&nbsp;   "validation\_passed": false,

&nbsp;   "outcome\_documented": false

&nbsp; }

}

```



Ready to begin investigation?

```



\## Step 3: Create Enforcement Hooks



\*\*File\*\*: `.claude/hooks.json`



```json

{

&nbsp; "hooks": {

&nbsp;   "PreToolUse": \[

&nbsp;     {

&nbsp;       "matcher": "Write|Edit",

&nbsp;       "hooks": \[

&nbsp;         {

&nbsp;           "type": "command",

&nbsp;           "command": ".claude/hooks/enforce-checkpoint.sh"

&nbsp;         },

&nbsp;         {

&nbsp;           "type": "command",

&nbsp;           "command": ".claude/hooks/enforce-analysis.sh"

&nbsp;         }

&nbsp;       ]

&nbsp;     }

&nbsp;   ],

&nbsp;   "PostToolUse": \[

&nbsp;     {

&nbsp;       "matcher": "Write|Edit",

&nbsp;       "hooks": \[

&nbsp;         {

&nbsp;           "type": "command",

&nbsp;           "command": ".claude/scripts/check-tests.sh"

&nbsp;         }

&nbsp;       ]

&nbsp;     }

&nbsp;   ],

&nbsp;   "SessionEnd": \[

&nbsp;     {

&nbsp;       "hooks": \[

&nbsp;         {

&nbsp;           "type": "command",

&nbsp;           "command": ".claude/hooks/require-outcome.sh"

&nbsp;         }

&nbsp;       ]

&nbsp;     }

&nbsp;   ]

&nbsp; }

}

```



\*\*File\*\*: `.claude/hooks/enforce-checkpoint.sh`



```bash

\#!/bin/bash

\# Ensure checkpoint exists before changes



if \[ ! -f .workflow/checkpoint-exists ]; then

&nbsp;   echo "❌ No checkpoint found - run /investigate to start"

&nbsp;   exit 1

fi



exit 0

```



\*\*File\*\*: `.claude/hooks/enforce-analysis.sh`



```bash

\#!/bin/bash

\# Ensure investigation complete before implementation



STATE=$(cat .workflow/state.json)

PHASE=$(echo "$STATE" | jq -r '.phase')



if \[ "$PHASE" != "implementation" ] \&\& \[ "$PHASE" != "validation" ]; then

&nbsp;   echo "❌ Investigation not complete"

&nbsp;   echo "Complete systematic investigation first"

&nbsp;   exit 1

fi



exit 0

```



\*\*File\*\*: `.claude/hooks/require-outcome.sh`



```bash

\#!/bin/bash

\# Require outcome documentation before session ends



if \[ ! -f .workflow/outcome.md ]; then

&nbsp;   echo "❌ Outcome documentation required"

&nbsp;   echo "Run: /document-outcome"

&nbsp;   exit 1

fi



exit 0

```



\## Step 4: Context Management Scripts



\*\*File\*\*: `.claude/scripts/compress-context.py`



```python

\#!/usr/bin/env python3

"""Compress investigation output to essentials"""



import sys

import re



def extract\_root\_cause(text):

&nbsp;   # Find root cause statement

&nbsp;   pattern = r'(?:root cause|caused by|the problem is):\\s\*(.+?)(?:\\n\\n|$)'

&nbsp;   match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)

&nbsp;   if match:

&nbsp;       return match.group(1).strip()

&nbsp;   return "\[Not clearly identified]"



def extract\_evidence(text, n=3):

&nbsp;   # Extract top evidence

&nbsp;   evidence = \[]

&nbsp;   # Look for file:line references

&nbsp;   refs = re.findall(r'\[\\w/.]+:\\d+', text)

&nbsp;   evidence.extend(refs\[:n])

&nbsp;   return evidence



def extract\_solution(text):

&nbsp;   # Find recommended solution

&nbsp;   pattern = r'(?:recommended|solution):\\s\*(.+?)(?:\\n\\n|$)'

&nbsp;   match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)

&nbsp;   if match:

&nbsp;       return match.group(1).strip()

&nbsp;   return "\[Not specified]"



def compress(full\_text):

&nbsp;   root\_cause = extract\_root\_cause(full\_text)

&nbsp;   evidence = extract\_evidence(full\_text)

&nbsp;   solution = extract\_solution(full\_text)

&nbsp;   

&nbsp;   compressed = f"""# Investigation Summary (Compressed)



\## Root Cause

{root\_cause}



\## Key Evidence

{chr(10).join(f'{i+1}. {e}' for i, e in enumerate(evidence))}



\## Recommended Solution

{solution}



---

Full details: .context-checkpoints/investigation-full.md

"""

&nbsp;   

&nbsp;   return compressed



if \_\_name\_\_ == "\_\_main\_\_":

&nbsp;   full\_text = sys.stdin.read()

&nbsp;   print(compress(full\_text))

```



\## Step 5: State Management



\*\*File\*\*: `.workflow/state.json`



```json

{

&nbsp; "workflow\_version": "1.0",

&nbsp; "phase": "initialized",

&nbsp; "checkpoint": null,

&nbsp; "root\_cause": null,

&nbsp; "solution\_chosen": null,

&nbsp; "confidence\_score": null,

&nbsp; "validations": {

&nbsp;   "checkpoint\_created": false,

&nbsp;   "investigation\_complete": false,

&nbsp;   "solution\_selected": false,

&nbsp;   "implementation\_complete": false,

&nbsp;   "tests\_passed": false,

&nbsp;   "outcome\_documented": false

&nbsp; },

&nbsp; "token\_usage": {

&nbsp;   "investigation": 0,

&nbsp;   "implementation": 0,

&nbsp;   "total": 0

&nbsp; },

&nbsp; "timestamps": {

&nbsp;   "started": null,

&nbsp;   "checkpoint\_created": null,

&nbsp;   "investigation\_complete": null,

&nbsp;   "implementation\_complete": null,

&nbsp;   "validation\_complete": null,

&nbsp;   "session\_end": null

&nbsp; }

}

```



\## Step 6: Documentation Files



\*\*File\*\*: `README.md`



```markdown

\# Investigation Framework



Systematic debugging workflow for complex multi-file bugs, cascading failures, and production issues.



\## Quick Start



```bash

\# Start investigation

/investigate \[problem description]



\# Document outcome (required before session end)

/document-outcome

```



\## Features



\- ✅ Systematic root cause analysis

\- ✅ Multi-phase workflow with checkpoints

\- ✅ Context management (no exhaustion)

\- ✅ Subagent isolation

\- ✅ Enforcement hooks

\- ✅ Learning documentation



\## Workflow



1\. \*\*Checkpoint\*\*: Git commit before any changes

2\. \*\*Investigation\*\*: Systematic debugger subagent analyzes

3\. \*\*Selection\*\*: Choose solution approach

4\. \*\*Implementation\*\*: Execute with validation

5\. \*\*Verification\*\*: Comprehensive testing

6\. \*\*Documentation\*\*: Capture outcomes and learnings



\## Safety



\- Git checkpoints prevent data loss

\- Enforcement hooks ensure process compliance

\- Automatic rollback on test failures

\- Mandatory outcome documentation



\## Context Management



\- Investigation uses dedicated subagent (50k token budget)

\- Context compressed between phases (30k → 3k)

\- Full details preserved in `.context-checkpoints/`

\- Main Claude stays within budget



\## Files



\- `.claude/agents/systematic-debugger.md` - Investigation subagent

\- `.claude/commands/investigate.md` - Main workflow command

\- `.claude/hooks.json` - Enforcement configuration

\- `.workflow/state.json` - Progress tracking

\- `.context-checkpoints/` - Context preservation

```



\## Customization Points



\### Adjust for Your Needs



1\. \*\*Token Budgets\*\*: Modify based on typical problem complexity

2\. \*\*Validation\*\*: Add/remove validation steps

3\. \*\*Enforcement\*\*: Enable/disable hooks as needed

4\. \*\*Consensus\*\*: Add parallel analyses for high-stakes bugs

5\. \*\*Tools\*\*: Add MCP tools if needed (claude\_context, memory\_bank, etc.)



\### Optional Enhancements



\*\*Add Consensus Validation\*\*:

```markdown

\### Phase 2b: Consensus Validation (optional)

\- Launch 5 parallel analyses in git worktrees

\- Merge findings via consensus algorithm

\- Increases reliability for critical bugs

```



\*\*Add Learning System\*\*:

```python

\# Track patterns in outcomes

def update\_learning\_db(outcome):

&nbsp;   # Record what worked/didn't work

&nbsp;   # Build pattern database

&nbsp;   # Improve confidence calibration

```



\*\*Add Deployment Checks\*\*:

```bash

\# Hook for production deployments

if \[ "$ENV" == "production" ]; then

&nbsp;   # Extra validation for prod

&nbsp;   ./scripts/production-checks.sh

fi

```



\## Usage Tips



1\. \*\*Use for complex problems\*\*: Don't use this for simple bugs

2\. \*\*Trust the process\*\*: Let each phase complete fully

3\. \*\*Document outcomes\*\*: Learning loop is critical

4\. \*\*Adjust confidently\*\*: Customize for your workflow

5\. \*\*Monitor token usage\*\*: Watch for context exhaustion signs



\## Troubleshooting



\*\*Investigation taking too long\*\*:

\- Check if loading too much context

\- Consider splitting into sub-investigations

\- Use worktree isolation



\*\*Context exhaustion\*\*:

\- Review compression ratios

\- Ensure checkpoint files are lean

\- Consider parallel worktree approach



\*\*Enforcement too strict\*\*:

\- Modify hooks as needed

\- Add emergency override (documented)

\- Balance safety vs friction



\## Next Steps



1\. Copy this template structure to your project

2\. Customize agent expertise for your domain

3\. Adjust validation requirements

4\. Test with a real complex bug

5\. Iterate based on outcomes



---



\*\*Remember\*\*: This is a last-resort framework for when simpler approaches fail. Use it for the truly difficult problems.

```



\## Complete Example Usage



```bash

\# Start complex bug investigation

$ /investigate "Users getting 500 errors on login after deployment"



\# Framework creates checkpoint

✅ Git checkpoint: commit-abc123



\# Launches systematic debugger subagent

🔍 Systematic investigation starting...



\# After 45 minutes of analysis

📊 Investigation complete



Root Cause: Null pointer in AuthMiddleware.validateToken()

Confidence: 85%

Recommended: Add null-safe validation



\# User approves solution

$ proceed with recommended solution



\# Implementation with validation

✅ Changes implemented

✅ Tests passing

✅ Edge cases verified



\# Mandatory documentation

$ /document-outcome

📝 Outcome documented



✅ Investigation complete

```



This template provides everything needed for sophisticated debugging workflows while managing context carefully.

