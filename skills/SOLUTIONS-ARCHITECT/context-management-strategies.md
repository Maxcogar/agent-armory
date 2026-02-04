\# Context Management Strategies for Claude Code Solutions



Context exhaustion is the #1 failure mode in complex agentic workflows. Agents run out of tokens mid-investigation, lose critical insights, or subsequent agents break things because they lack full context. This reference provides battle-tested strategies for managing context across long-running investigations.



\## The Context Exhaustion Problem



\### Symptoms

\- Agent stops mid-analysis saying "token limit reached"

\- Subsequent agent asks questions already answered

\- Agent makes changes that contradict earlier decisions

\- Loss of architectural insights discovered earlier

\- Repeated investigation of same areas

\- Breaking previously working code



\### Root Causes

1\. \*\*Cumulative Context\*\*: Each phase adds context, eventually hitting limits

2\. \*\*No Compression\*\*: Full conversation history carried forward

3\. \*\*Redundant Information\*\*: Same data repeated across phases

4\. \*\*Poor Handoffs\*\*: Next agent doesn't get distilled essentials

5\. \*\*Monolithic Analysis\*\*: Trying to do everything in one pass



---



\## Strategy 1: Checkpoint-Based Preservation



\### Concept

Save critical context at key junctures in files, not just in conversation memory.



\### Implementation



\*\*Checkpoint Structure\*\*:

```

.context-checkpoints/

├── 00-initial-problem.md       # Problem description

├── 01-investigation-findings.md # Phase 1 summary

├── 02-solution-candidates.md    # Phase 2 options

├── 03-implementation-plan.md    # Phase 3 decisions

└── 04-validation-results.md     # Phase 4 outcomes

```



\*\*Checkpoint Template\*\*:

```markdown

\# Phase N: \[Name] - Checkpoint



\## Status

\- Phase: \[N]

\- Timestamp: \[ISO 8601]

\- Token Budget Used: \[Xk / Yk available]

\- Next Phase: \[N+1]



\## Key Findings (Top 5 Only)

1\. \[Finding 1]

2\. \[Finding 2]

3\. \[Finding 3]

4\. \[Finding 4]

5\. \[Finding 5]



\## Critical Decisions Made

\- \[Decision 1]: \[Rationale]

\- \[Decision 2]: \[Rationale]



\## Context for Next Phase

\[ONLY essentials needed for next phase - be ruthless]



\## Full Details

\[Link to full analysis if needed: .context-checkpoints/phase-N-full.md]

```



\### Token Budget

```

Checkpoint file: 2-3k tokens (compressed)

vs

Full conversation: 30-50k tokens (uncompressed)



Savings: ~90% reduction

```



\### Usage Pattern

```python

\# After each phase completes:



1\. Write comprehensive analysis to full file

&nbsp;  `.context-checkpoints/phase-N-full.md` (30k tokens)



2\. Extract ONLY essentials for next phase

&nbsp;  `.context-checkpoints/phase-N-checkpoint.md` (3k tokens)



3\. Next phase reads checkpoint file, not full history

&nbsp;  

4\. If next phase needs more detail, it can read full file,

&nbsp;  but default is checkpoint only

```



\### Example Checkpoint

```markdown

\# Phase 1: Investigation - Checkpoint



\## Status

\- Phase: 1 (Investigation)

\- Tokens Used: 28k / 200k

\- Next: Planning Phase



\## Key Findings

1\. Root cause: Null pointer in AuthMiddleware.validateToken()

2\. Triggers when token header is malformed

3\. No validation before dereferencing token.claims

4\. Error propagates as 500 instead of proper 401

5\. Affects ~12% of failed login attempts



\## Critical Decisions

\- Focus on middleware layer, not auth service

\- Backward compatible fix required (API contract)

\- Need comprehensive test coverage for edge cases



\## Context for Next Phase

Problem isolated to 1 file: `src/middleware/AuthMiddleware.ts`

Lines 45-67 need null-safe handling.

Must maintain existing API contract.



\## Full Details

See: .context-checkpoints/phase-1-investigation-full.md

```



---



\## Strategy 2: Progressive Context Filtering



\### Concept

Each phase filters context to only what's relevant for next phase. Aggressive pruning.



\### Filtering Rules



\*\*What to ALWAYS Keep\*\*:

\- Root cause identification

\- Critical architectural insights

\- Decisions made and rationale

\- Constraints discovered

\- Known failure modes



\*\*What to USUALLY Keep\*\*:

\- Solution approaches considered

\- Trade-offs identified

\- Code snippets directly relevant



\*\*What to PRUNE\*\*:

\- Exploratory tangents that led nowhere

\- Detailed debugging steps (keep conclusions only)

\- Redundant evidence (keep best example)

\- Conversation meta-commentary

\- Questions that were answered



\### Implementation



\*\*Filtering Function\*\*:

```python

def filter\_context\_for\_next\_phase(full\_context, next\_phase):

&nbsp;   """Extract only relevant context"""

&nbsp;   

&nbsp;   if next\_phase == "planning":

&nbsp;       return {

&nbsp;           "root\_cause": extract\_root\_cause(full\_context),

&nbsp;           "constraints": extract\_constraints(full\_context),

&nbsp;           "architectural\_insights": extract\_insights(full\_context),

&nbsp;           "critical\_evidence": top\_N\_evidence(full\_context, N=3)

&nbsp;       }

&nbsp;   

&nbsp;   elif next\_phase == "implementation":

&nbsp;       return {

&nbsp;           "chosen\_solution": extract\_chosen\_solution(full\_context),

&nbsp;           "implementation\_steps": extract\_steps(full\_context),

&nbsp;           "validation\_criteria": extract\_validation(full\_context),

&nbsp;           "rollback\_plan": extract\_rollback(full\_context)

&nbsp;       }

&nbsp;   

&nbsp;   elif next\_phase == "validation":

&nbsp;       return {

&nbsp;           "changes\_made": extract\_changes(full\_context),

&nbsp;           "test\_cases": extract\_tests(full\_context),

&nbsp;           "success\_criteria": extract\_criteria(full\_context)

&nbsp;       }

```



\### Token Savings

```

Before Filtering:

&nbsp; Phase 1 → Phase 2: 30k tokens context

&nbsp; Phase 2 → Phase 3: 30k + 25k = 55k tokens

&nbsp; Phase 3 → Phase 4: 55k + 30k = 85k tokens

&nbsp; Total: 170k tokens (approaching limit)



After Filtering:

&nbsp; Phase 1 → Phase 2: 3k tokens (filtered)

&nbsp; Phase 2 → Phase 3: 3k + 3k = 6k tokens

&nbsp; Phase 3 → Phase 4: 6k + 3k = 9k tokens

&nbsp; Total: 48k tokens (comfortable margin)

```



---



\## Strategy 3: Worktree Isolation



\### Concept

Use git worktrees to create completely isolated environments for parallel or sequential analysis. Each starts fresh.



\### Setup

```bash

\# Create worktrees for parallel analysis

git worktree add ../analysis-01 HEAD

git worktree add ../analysis-02 HEAD

git worktree add ../analysis-03 HEAD



\# Each worktree is isolated:

\# - Separate working directory

\# - Independent file changes

\# - No shared conversation context

```



\### Context Benefits

1\. \*\*Zero Context Leakage\*\*: Each analysis starts fresh

2\. \*\*Parallel Execution\*\*: Multiple agents work simultaneously without interference

3\. \*\*Clean Slate\*\*: No accumulation of context from previous attempts

4\. \*\*Independent Validation\*\*: True independent analyses



\### Usage Pattern



\*\*For Consensus Analysis\*\*:

```bash

\# 1. Package problem description

cat > .context/problem.md << EOF

\[Problem description]

\[Relevant files]

\[Constraints]

EOF



\# 2. Launch subagents in worktrees

for i in {1..5}; do

&nbsp;   cd ../analysis-0$i

&nbsp;   claude --subagent systematic-debugger \\

&nbsp;          --input .context/problem.md \\

&nbsp;          --output .context/solution-0$i.json

done



\# 3. Collect results (no accumulated context)

\# Each analysis is ~25k tokens

\# Total: 5 × 25k = 125k (parallel, not sequential)

\# Consensus analysis: +10k

\# Total: 135k tokens (manageable)

```



\*\*For Sequential Investigation\*\*:

```bash

\# Phase 1 in main worktree

claude \[phase 1 analysis]



\# Phase 2 in clean worktree

git worktree add ../phase-02 HEAD

cd ../phase-02

\# Copy ONLY the checkpoint, not full history

cp ../main/.context-checkpoints/phase-1-checkpoint.md .context/

claude \[phase 2 analysis starting from checkpoint]

```



\### Token Math

```

Without Worktrees (Sequential in Same Session):

&nbsp; Phase 1: 30k tokens

&nbsp; Phase 2: 30k (Phase 1) + 35k (Phase 2) = 65k

&nbsp; Phase 3: 65k + 40k = 105k

&nbsp; Phase 4: 105k + 30k = 135k

&nbsp; Total Accumulated: 135k



With Worktrees (Clean Slate Each Phase):

&nbsp; Phase 1: 30k tokens (fresh)

&nbsp; Phase 2: 3k (checkpoint) + 35k = 38k (fresh)

&nbsp; Phase 3: 3k (checkpoint) + 40k = 43k (fresh)

&nbsp; Phase 4: 3k (checkpoint) + 30k = 33k (fresh)

&nbsp; Total: No accumulation - each phase is independent

```



---



\## Strategy 4: Summary Compression



\### Concept

After each significant work unit, compress findings into structured summaries.



\### Compression Templates



\*\*Investigation Summary\*\*:

```markdown

\# Investigation Summary (Compressed)



\## Root Cause (1 sentence)

\[One-line root cause]



\## Evidence (Top 3)

1\. \[Evidence 1 - file:line]

2\. \[Evidence 2 - file:line]

3\. \[Evidence 3 - file:line]



\## Architectural Context (Key points only)

\- \[Point 1]

\- \[Point 2]

\- \[Point 3]



\## Next Steps

\[What needs to happen next]



---

Full investigation: .context/investigation-full.md (30k tokens)

This summary: 1.5k tokens

Compression ratio: 20:1

```



\*\*Solution Analysis Summary\*\*:

```markdown

\# Solution Analysis (Compressed)



\## Recommended Solution

\[One paragraph description]



\## Confidence: \[Score]/100



\## Why This Works

1\. \[Reason 1]

2\. \[Reason 2]

3\. \[Reason 3]



\## Implementation Approach

1\. \[Step 1]

2\. \[Step 2]

3\. \[Step 3]



\## Validation Plan

\[How to verify it works]



---

Full analysis: .context/solution-analysis-full.md (25k tokens)

This summary: 1k tokens

Compression ratio: 25:1

```



\### Compression Script



\*\*File\*\*: `.claude/scripts/compress-output.py`

```python

\#!/usr/bin/env python3

"""Compress agent output to essentials"""



import re

import sys



def extract\_key\_findings(text, n=5):

&nbsp;   """Extract top N findings"""

&nbsp;   # Pattern match findings, conclusions, key points

&nbsp;   findings = \[]

&nbsp;   patterns = \[

&nbsp;       r'(?:finding|conclusion|key point):\\s\*(.+?)(?:\\n|$)',

&nbsp;       r'(?:\\d+\\.\\s\*)(.+?)(?:\\n|$)',

&nbsp;       r'(?:- )(.+?)(?:\\n|$)'

&nbsp;   ]

&nbsp;   

&nbsp;   for pattern in patterns:

&nbsp;       matches = re.findall(pattern, text, re.IGNORECASE)

&nbsp;       findings.extend(matches)

&nbsp;   

&nbsp;   # Deduplicate and take top N

&nbsp;   unique = list(dict.fromkeys(findings))

&nbsp;   return unique\[:n]



def extract\_root\_cause(text):

&nbsp;   """Find root cause statement"""

&nbsp;   patterns = \[

&nbsp;       r'root cause\[:\\s]+(.+?)(?:\\n\\n|$)',

&nbsp;       r'caused by\[:\\s]+(.+?)(?:\\n\\n|$)',

&nbsp;       r'the problem is\[:\\s]+(.+?)(?:\\n\\n|$)'

&nbsp;   ]

&nbsp;   

&nbsp;   for pattern in patterns:

&nbsp;       match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)

&nbsp;       if match:

&nbsp;           return match.group(1).strip()

&nbsp;   

&nbsp;   return "\[Root cause not clearly stated]"



def extract\_evidence(text, n=3):

&nbsp;   """Extract top N pieces of evidence"""

&nbsp;   # Look for code references, file paths, line numbers

&nbsp;   evidence = \[]

&nbsp;   

&nbsp;   # Pattern: file:line or `file.ext`

&nbsp;   code\_refs = re.findall(r'`\[^`]+`|\[\\w/.]+:\\d+', text)

&nbsp;   evidence.extend(code\_refs)

&nbsp;   

&nbsp;   # Pattern: Evidence/proof statements

&nbsp;   proof\_pattern = r'(?:evidence|proof|shows that):\\s\*(.+?)(?:\\n|$)'

&nbsp;   proofs = re.findall(proof\_pattern, text, re.IGNORECASE)

&nbsp;   evidence.extend(proofs)

&nbsp;   

&nbsp;   # Deduplicate and take top N

&nbsp;   unique = list(dict.fromkeys(evidence))

&nbsp;   return unique\[:n]



def compress(full\_text):

&nbsp;   """Main compression function"""

&nbsp;   

&nbsp;   root\_cause = extract\_root\_cause(full\_text)

&nbsp;   findings = extract\_key\_findings(full\_text, n=5)

&nbsp;   evidence = extract\_evidence(full\_text, n=3)

&nbsp;   

&nbsp;   compressed = f"""# Compressed Output



\## Root Cause

{root\_cause}



\## Key Findings

{chr(10).join(f'{i+1}. {f}' for i, f in enumerate(findings))}



\## Evidence

{chr(10).join(f'{i+1}. {e}' for i, e in enumerate(evidence))}



\## Next Steps

\[Extract next steps from original]



---

Full output available in source file.

Compression ratio: ~20:1

"""

&nbsp;   

&nbsp;   return compressed



if \_\_name\_\_ == "\_\_main\_\_":

&nbsp;   full\_text = sys.stdin.read()

&nbsp;   compressed = compress(full\_text)

&nbsp;   print(compressed)

&nbsp;   

&nbsp;   # Print token estimate to stderr

&nbsp;   estimated\_tokens = len(compressed.split()) \* 1.3

&nbsp;   print(f"\\nCompressed to ~{int(estimated\_tokens)} tokens", file=sys.stderr)

```



\### Usage

```bash

\# After phase completes with long output

cat .context/phase-1-full.md | \\

&nbsp;   python .claude/scripts/compress-output.py \\

&nbsp;   > .context/phase-1-compressed.md



\# Next phase reads compressed version

claude --input .context/phase-1-compressed.md \[phase 2 work]

```



---



\## Strategy 5: Staged Context Handoff



\### Concept

Transfer context between phases in stages, not all at once. Only load additional context when needed.



\### Stages



\*\*Stage 1: Essential Context Only\*\*

```

Next phase starts with:

\- Problem description (500 tokens)

\- Previous phase conclusion (1k tokens)

\- Critical constraints (500 tokens)



Total: 2k tokens

```



\*\*Stage 2: On-Demand Details\*\*

```

IF next phase needs more details:

\- Load relevant sections from previous full analysis

\- Add specific evidence

\- Include particular code snippets



Additional: 5-10k tokens (targeted)

```



\*\*Stage 3: Full Context (Rare)\*\*

```

IF something unexpected happens:

\- Load complete previous phase analysis

\- Only when absolutely necessary



Additional: 30k+ tokens

```



\### Implementation Pattern



\*\*Command Structure\*\*:

```markdown

\# Phase N Command



\## Initial Context (Auto-loaded)

```bash

cat .context/phase-{N-1}-essential.md

```



\## Optional Detailed Context (Load if needed)

```bash

\# Only run if you need more details:

cat .context/phase-{N-1}-details.md

```



\## Full Context (Emergency only)

```bash

\# Only if unexpected situation:

cat .context/phase-{N-1}-full.md

```



\## Your Task

\[Phase N work description]

```



\### Decision Tree for Loading Context



```

START Phase N



├─ Load Essential Context (2k tokens)

│  └─ Can you complete the task?

│     ├─ YES → Proceed (saved 28k tokens!)

│     └─ NO → Need more context

│

├─ Load Detailed Context (+8k tokens)

│  └─ Can you complete the task now?

│     ├─ YES → Proceed (saved 20k tokens)

│     └─ NO → Need full context

│

└─ Load Full Context (+30k tokens)

&nbsp;  └─ Proceed with complete information

```



\### Token Savings

```

Typical Case (Essential only):

&nbsp; Context loaded: 2k tokens

&nbsp; Savings: 28k tokens (93%)



Common Case (Essential + Details):

&nbsp; Context loaded: 10k tokens

&nbsp; Savings: 20k tokens (67%)



Rare Case (Full context):

&nbsp; Context loaded: 30k tokens

&nbsp; Savings: 0 tokens (but only when necessary)

```



---



\## Strategy 6: Context-Aware Agent Design



\### Concept

Design agents with explicit token budgets and context strategies from the start.



\### Agent Template with Context Strategy



```markdown

---

name: context-aware-agent

description: \[When to use]

tools: \[Tools needed]

model: sonnet

---



\# Context-Aware Agent



\## Token Budget

\- Maximum context: 40k tokens

\- Reserved for output: 10k tokens

\- Available for input: 30k tokens



\## Context Loading Strategy



\### Phase 1: Essential Context (2k tokens)

Load from: `.context/essential.md`

Contains:

\- Problem summary

\- Previous decisions

\- Critical constraints



\### Phase 2: Targeted Context (if needed, +10k tokens)

Load from: `.context/targeted/`

Contains:

\- Relevant code sections

\- Specific evidence

\- Domain details



\### Phase 3: Full Context (emergency, +20k tokens)

Load from: `.context/full.md`

Only if phases 1-2 insufficient.



\## Context Management During Work



1\. \*\*Track token usage\*\*

&nbsp;  - Check remaining budget before loading more

&nbsp;  - Compress own findings as work progresses



2\. \*\*Output compression\*\*

&nbsp;  - Write full analysis to file

&nbsp;  - Return compressed summary to main Claude

&nbsp;  - Ratio target: 10:1 compression



3\. \*\*Emergency protocols\*\*

&nbsp;  - If approaching token limit:

&nbsp;    - Save current state

&nbsp;    - Return compressed findings

&nbsp;    - Signal need for continuation in fresh session



\## Output Format



\### Compressed Output (to main Claude)

\[2-3k tokens max]



\### Full Output (to file)

\[No limit, for reference]

```



\### Context Budget Calculator



```python

def calculate\_context\_budget(agent\_type, problem\_complexity):

&nbsp;   """Calculate appropriate context budget"""

&nbsp;   

&nbsp;   base\_budgets = {

&nbsp;       "specialized": 20\_000,    # Focused agents

&nbsp;       "general": 40\_000,        # General purpose

&nbsp;       "investigator": 60\_000,   # Deep analysis

&nbsp;       "coordinator": 30\_000     # Orchestration

&nbsp;   }

&nbsp;   

&nbsp;   complexity\_multipliers = {

&nbsp;       "simple": 0.5,

&nbsp;       "moderate": 1.0,

&nbsp;       "complex": 1.5,

&nbsp;       "extreme": 2.0

&nbsp;   }

&nbsp;   

&nbsp;   base = base\_budgets\[agent\_type]

&nbsp;   multiplier = complexity\_multipliers\[problem\_complexity]

&nbsp;   

&nbsp;   total\_budget = base \* multiplier

&nbsp;   

&nbsp;   return {

&nbsp;       "total": total\_budget,

&nbsp;       "input": total\_budget \* 0.7,    # 70% for input

&nbsp;       "output": total\_budget \* 0.3    # 30% for output

&nbsp;   }



\# Examples:

specialized\_simple = calculate\_context\_budget("specialized", "simple")

\# => {total: 10k, input: 7k, output: 3k}



investigator\_extreme = calculate\_context\_budget("investigator", "extreme")

\# => {total: 120k, input: 84k, output: 36k}

```



---



\## Strategy 7: Emergency Context Recovery



\### Concept

When context exhaustion happens mid-work, gracefully recover instead of failing.



\### Detection



\*\*Signs of Impending Exhaustion\*\*:

\- Responses getting shorter

\- Forgetting earlier decisions

\- Asking previously answered questions

\- Output quality degrading



\*\*Monitoring\*\* (in agent):

```markdown

Every N interactions:

1\. Check approximate token usage

2\. If > 80% budget used:

&nbsp;  - Save current state immediately

&nbsp;  - Compress findings so far

&nbsp;  - Signal need for context reset

```



\### Recovery Protocol



\*\*Step 1: Emergency Save\*\*

```bash

\# Agent detects context near limit

cat << EOF > .context/emergency-save.md

\# Emergency Context Save - $(date)



\## Work Completed

\[What was accomplished]



\## Current State

\[Where we are in the process]



\## Findings So Far

\[Compressed findings]



\## What's Next

\[What still needs to be done]



\## Token Budget

\- Used: ~${TOKENS\_USED}

\- Remaining: ~${TOKENS\_REMAINING}

EOF

```



\*\*Step 2: Compress and Reset\*\*

```python

\# Compress full context down to essentials

full\_context = read\_conversation\_history()

compressed = compress\_to\_essentials(full\_context)



\# Write to file

write\_file(".context/compressed-state.md", compressed)



\# Start new session with compressed context

new\_session\_context = load\_compressed\_state()

```



\*\*Step 3: Resume\*\*

```markdown

\# New Session Prompt



Previous session hit context limit.



\## Recovered State (from .context/compressed-state.md):

\[Compressed findings, decisions, current state]



\## Your Task:

Continue where previous session left off.

Focus on: \[Next steps from emergency save]

```



\### Prevention is Better Than Recovery



\*\*Proactive Context Management\*\*:

```markdown

\## At Start of Each Phase



1\. \*\*Budget Check\*\*

&nbsp;  Current token usage: \[estimate]

&nbsp;  Budget remaining: \[calculate]

&nbsp;  

2\. \*\*Risk Assessment\*\*

&nbsp;  - Will this phase fit in remaining budget? 

&nbsp;  - Should we compress previous context first?

&nbsp;  - Do we need to offload to worktree?



3\. \*\*Mitigation\*\*

&nbsp;  IF risk is high:

&nbsp;  - Compress now, before starting

&nbsp;  - Use worktree for clean slate

&nbsp;  - Split phase into sub-phases

```



---



\## Strategy 8: The Context Budget Pattern



\### Concept

Treat token budget like a resource in resource-constrained optimization. Explicit accounting.



\### Budget Allocation



\*\*Example: 200k Token Budget Investigation\*\*



```

Phase 1: Investigation (40k tokens)

&nbsp; - Load relevant files: 20k

&nbsp; - Analysis: 15k

&nbsp; - Output: 5k



Phase 2: Planning (30k tokens)

&nbsp; - Load Phase 1 compressed: 3k

&nbsp; - Planning analysis: 20k

&nbsp; - Output: 7k



Phase 3: Implementation (50k tokens)

&nbsp; - Load plan: 5k

&nbsp; - Code changes: 30k

&nbsp; - Testing: 15k



Phase 4: Validation (30k tokens)

&nbsp; - Load changes: 10k

&nbsp; - Verification: 15k

&nbsp; - Output: 5k



Phase 5: Documentation (20k tokens)

&nbsp; - Synthesis: 15k

&nbsp; - Output: 5k



Reserve: 30k tokens (buffer)



Total: 200k tokens

```



\### Budget Tracking



\*\*File\*\*: `.context/token-budget.json`

```json

{

&nbsp; "total\_budget": 200000,

&nbsp; "allocated": {

&nbsp;   "phase\_1": 40000,

&nbsp;   "phase\_2": 30000,

&nbsp;   "phase\_3": 50000,

&nbsp;   "phase\_4": 30000,

&nbsp;   "phase\_5": 20000,

&nbsp;   "reserve": 30000

&nbsp; },

&nbsp; "spent": {

&nbsp;   "phase\_1": 38500,

&nbsp;   "phase\_2": 28000

&nbsp; },

&nbsp; "remaining": 133500,

&nbsp; "current\_phase": "phase\_3",

&nbsp; "projected\_total": 186500

}

```



\### Budget Enforcement



\*\*Script\*\*: `.claude/scripts/check-budget.sh`

```bash

\#!/bin/bash



BUDGET\_FILE=".context/token-budget.json"

PHASE=$1

ESTIMATED\_USAGE=$2



\# Read current budget state

REMAINING=$(jq -r '.remaining' $BUDGET\_FILE)

ALLOCATED=$(jq -r ".allocated.$PHASE" $BUDGET\_FILE)



\# Check if we can proceed

if \[ $ESTIMATED\_USAGE -gt $ALLOCATED ]; then

&nbsp;   echo "ERROR: Phase $PHASE estimated usage ($ESTIMATED\_USAGE) exceeds allocation ($ALLOCATED)"

&nbsp;   echo "Options:"

&nbsp;   echo "  1. Compress previous phases to free up budget"

&nbsp;   echo "  2. Split $PHASE into sub-phases"

&nbsp;   echo "  3. Use worktree for clean slate"

&nbsp;   exit 1

fi



if \[ $ESTIMATED\_USAGE -gt $REMAINING ]; then

&nbsp;   echo "ERROR: Total budget exhausted"

&nbsp;   echo "Must compress or restart with fresh context"

&nbsp;   exit 1

fi



echo "Budget check passed: $ESTIMATED\_USAGE / $ALLOCATED allocated, $REMAINING remaining"

exit 0

```



---



\## Combining Strategies



Real-world solutions combine multiple strategies:



\### Example 1: Long Investigation

```

Primary: Context-Managed Pipeline

\+ Checkpoint-Based Preservation (after each phase)

\+ Progressive Filtering (between phases)

\+ Summary Compression (all outputs)

\+ Emergency Recovery (just in case)

```



\### Example 2: Parallel Consensus

```

Primary: Worktree Isolation

\+ Context-Aware Agent Design (each subagent)

\+ Budget Pattern (allocate tokens per subagent)

\+ Summary Compression (consensus synthesis)

```



\### Example 3: Sequential Workflow

```

Primary: Staged Context Handoff

\+ Checkpoint-Based Preservation (safety net)

\+ Progressive Filtering (phase transitions)

\+ Budget Tracking (monitor usage)

```



---



\## Quick Reference: Strategy Selection



| Problem | Strategy | Why |

|---------|----------|-----|

| Will take >3 phases | Checkpoint-Based | Can't carry full context forward |

| Each phase independent | Worktree Isolation | Clean slate prevents accumulation |

| Long analysis per phase | Summary Compression | Distill 30k → 3k between phases |

| Parallel consensus | Worktree + Budget | Isolated + tracked resources |

| Risk of hitting limits | Emergency Recovery | Graceful degradation |

| Complex orchestration | Context-Aware Agents | Explicit budgets prevent overruns |

| Very long investigation | All strategies | Kitchen sink approach |



\## Context Management Checklist



Before building a solution, verify:



\- \[ ] Estimated total token usage calculated

\- \[ ] Context handoff points identified

\- \[ ] Compression strategy defined

\- \[ ] Budget allocated per phase

\- \[ ] Emergency recovery protocol in place

\- \[ ] Checkpoint locations specified

\- \[ ] Agent token budgets assigned

\- \[ ] Worktree usage planned (if needed)

\- \[ ] Monitoring approach defined



\*\*Remember\*\*: Context management isn't optional for complex solutions - it's the difference between success and failure.

