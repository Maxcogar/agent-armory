\# Orchestration Patterns for Claude Code Solutions



This reference documents proven patterns for orchestrating multi-agent systems, workflows, and complex Claude Code solutions. Each pattern includes use cases, implementation guidance, and context management considerations.



\## Pattern Selection Matrix



| Pattern | Complexity | Context Usage | Best For | Avoid When |

|---------|-----------|---------------|----------|------------|

| Specialized Subagent | Low | Low | Single focused tasks | Complex multi-domain problems |

| Sequential Workflow | Medium | Medium | Step-by-step processes | Need parallelism or consensus |

| Parallel Consensus | High | High | Validation \& risk reduction | Simple obvious problems |

| Hierarchical Orchestration | High | High | Complex multi-domain | Well-defined single-domain |

| Context-Managed Pipeline | Very High | Extreme | Long investigations | Quick fixes |

| Enforcement Framework | Medium | Low | Process compliance | Trusted simple workflows |



---



\## 1. Specialized Subagent Pattern



\### Overview

Single subagent with focused expertise for a specific, repeatable task. Simplest pattern.



\### When to Use

\- Task is well-defined and bounded

\- Expertise domain is narrow

\- No need for multiple perspectives

\- Context requirements are manageable

\- Quick turnaround is important



\### Architecture

```

Main Claude (Orchestrator)

&nbsp;   │

&nbsp;   └─→ Specialized Subagent

&nbsp;          ├─ Input: Specific context

&nbsp;          ├─ Processing: Focused analysis

&nbsp;          └─ Output: Structured result

```



\### Implementation Template

```markdown

---

name: specialized-task-agent

description: Handles \[specific task] when \[trigger conditions]

tools: \[minimal necessary tools]

model: sonnet

---



You are a \[role] specializing in \[narrow domain].



\*\*Single Responsibility\*\*: \[One clear task]



\*\*Input Contract\*\*:

\- \[What you receive]



\*\*Output Contract\*\*:

\- \[What you produce]



\*\*Process\*\*:

1\. \[Step 1]

2\. \[Step 2]

3\. \[Step 3]

```



\### Context Management

\- \*\*Input\*\*: Minimal, only what's needed for the task

\- \*\*Output\*\*: Structured, concise result

\- \*\*Preservation\*\*: Not needed - single pass

\- \*\*Token Budget\*\*: ~5k-15k tokens typical



\### Examples

\- Code reviewer for specific language

\- Security scanner for known vulnerabilities

\- Performance profiler for specific bottlenecks

\- Documentation generator for API endpoints



---



\## 2. Sequential Workflow Pattern



\### Overview

Multi-phase process with checkpoints between phases. Each phase builds on the previous.



\### When to Use

\- Clear sequential dependencies

\- Need checkpoints for safety

\- Phases have different requirements

\- Some phases need human input

\- Rollback capability is critical



\### Architecture

```

Main Claude (Orchestrator)

&nbsp;   │

&nbsp;   ├─→ Phase 1: Investigation

&nbsp;   │      ├─ Checkpoint (git commit)

&nbsp;   │      └─ Output: Analysis

&nbsp;   │

&nbsp;   ├─→ Phase 2: Planning

&nbsp;   │      ├─ Checkpoint (state file)

&nbsp;   │      └─ Output: Plan

&nbsp;   │

&nbsp;   ├─→ Phase 3: Implementation

&nbsp;   │      ├─ Checkpoint (git commit)

&nbsp;   │      └─ Output: Changes

&nbsp;   │

&nbsp;   └─→ Phase 4: Validation

&nbsp;          └─ Output: Verification

```



\### Implementation Template

```markdown

\# Sequential Workflow Command



\## Phase 1: \[Name]

\*\*Goal\*\*: \[What this achieves]

\*\*Input\*\*: \[What's needed]

\*\*Process\*\*:

1\. \[Action]

2\. \[Action]

\*\*Checkpoint\*\*: `git commit -m "Phase 1: \[name]"`

\*\*Output\*\*: \[What's produced]

\*\*Validation\*\*: \[How to verify success]



\## Phase 2: \[Name]

\[Same structure...]



\## Human Decision Point

Present findings to user, wait for approval before proceeding to next phase.



\## Rollback Strategy

If phase N fails:

1\. `git reset --hard \[previous checkpoint]`

2\. Document failure in `.workflow/failures/phase-N.md`

3\. Return to Phase N-1 with enriched context

```



\### Context Management

\- \*\*Between Phases\*\*: Checkpoint files contain essential context

\- \*\*Progressive\*\*: Each phase inherits only relevant context from previous

\- \*\*Compression\*\*: Summarize findings at each checkpoint

\- \*\*Handoff Protocol\*\*:

&nbsp; 1. Phase completes

&nbsp; 2. Write checkpoint file (`.workflow/phase-N-output.md`)

&nbsp; 3. Extract only necessary context for next phase

&nbsp; 4. Next phase reads checkpoint, not full history



\### Token Budget Planning

```

Phase 1 (Investigation): 30k tokens

&nbsp; - Read relevant files: 15k

&nbsp; - Analysis: 10k

&nbsp; - Output: 5k

&nbsp; - Checkpoint file: 2k (compressed)



Phase 2 (Planning): 20k tokens

&nbsp; - Read checkpoint: 2k

&nbsp; - Planning: 15k

&nbsp; - Output: 3k

&nbsp; - Checkpoint file: 2k



Total: 50k (vs 80k without compression)

```



\### Examples

\- Systematic debugging workflow (investigate → plan → implement → validate)

\- Feature development (design → prototype → test → deploy)

\- Refactoring process (analyze → plan → migrate → verify)



---



\## 3. Parallel Consensus Pattern



\### Overview

Multiple independent analyses of the same problem, then merge/vote on the best approach. Reduces single-point-of-failure risk.



\### When to Use

\- High-stakes decisions

\- Need validation/verification

\- Multiple valid approaches exist

\- Want to catch blind spots

\- Time is available for thorough analysis



\### Architecture

```

Main Claude (Orchestrator)

&nbsp;   │

&nbsp;   ├─→ Subagent 1 (Worktree 1)

&nbsp;   │      └─ Independent Analysis

&nbsp;   │

&nbsp;   ├─→ Subagent 2 (Worktree 2)

&nbsp;   │      └─ Independent Analysis

&nbsp;   │

&nbsp;   ├─→ Subagent 3 (Worktree 3)

&nbsp;   │      └─ Independent Analysis

&nbsp;   │

&nbsp;   ├─→ Subagent 4 (Worktree 4)

&nbsp;   │      └─ Independent Analysis

&nbsp;   │

&nbsp;   ├─→ Subagent 5 (Worktree 5)

&nbsp;   │      └─ Independent Analysis

&nbsp;   │

&nbsp;   └─→ Consensus Engine

&nbsp;          ├─ Compare solutions

&nbsp;          ├─ Vote on best approach

&nbsp;          └─ Merge insights

```



\### Implementation Pattern

```bash

\# Setup: Create git worktrees for isolation

git worktree add ../analysis-01 HEAD

git worktree add ../analysis-02 HEAD

git worktree add ../analysis-03 HEAD

git worktree add ../analysis-04 HEAD

git worktree add ../analysis-05 HEAD



\# Execute: Launch subagents in parallel

\# Each gets identical starting context

\# Each produces structured output



\# Consensus: Analyze results

For each solution proposed:

&nbsp; - Group similar approaches

&nbsp; - Count subagent votes

&nbsp; - Calculate weighted confidence

&nbsp; - Identify consensus (threshold = 3/5)



\# Cleanup

git worktree remove ../analysis-01 --force

\# ... etc

```



\### Context Management

\*\*Critical\*\*: Each subagent must start with IDENTICAL context



\*\*Setup\*\*:

1\. Package complete problem context

2\. Save to `.consensus/problem-context.md`

3\. Each subagent reads same file

4\. No cross-subagent communication during analysis



\*\*Output Format\*\* (must be standardized):

```json

{

&nbsp; "subagent\_id": "analysis-03",

&nbsp; "root\_cause": "detailed analysis",

&nbsp; "solutions": \[

&nbsp;   {

&nbsp;     "id": 1,

&nbsp;     "approach": "solution description",

&nbsp;     "confidence": 85,

&nbsp;     "rationale": "why this works",

&nbsp;     "risks": \["risk 1", "risk 2"]

&nbsp;   }

&nbsp; ],

&nbsp; "recommended": 1

}

```



\### Consensus Algorithm

```python

def find\_consensus(analyses, threshold=3):

&nbsp;   # Group similar solutions

&nbsp;   groups = group\_by\_similarity(analyses)

&nbsp;   

&nbsp;   # For each group, count votes

&nbsp;   for group in groups:

&nbsp;       if len(group.solutions) >= threshold:

&nbsp;           # Calculate weighted confidence

&nbsp;           avg\_confidence = mean(\[s.confidence for s in group.solutions])

&nbsp;           

&nbsp;           # This is consensus solution

&nbsp;           return {

&nbsp;               "consensus": True,

&nbsp;               "solution": group.representative,

&nbsp;               "confidence": avg\_confidence,

&nbsp;               "votes": len(group.solutions),

&nbsp;               "alternatives": other\_groups

&nbsp;           }

&nbsp;   

&nbsp;   # No consensus - present all options to user

&nbsp;   return {"consensus": False, "options": all\_groups}

```



\### Token Budget

```

Per Subagent:

&nbsp; - Initial context: 20k tokens (shared)

&nbsp; - Analysis: 25k tokens

&nbsp; - Output: 5k tokens

&nbsp; Total per subagent: 50k tokens



5 Subagents: 250k tokens total



Consensus Analysis: 15k tokens



Grand Total: 265k tokens



Note: Parallelism doesn't help token cost, only wall-clock time

&nbsp;     Use this pattern when correctness > cost

```



\### Examples

\- Enhanced systematic debugging (5 parallel analyses)

\- Critical architectural decisions

\- Security vulnerability assessment

\- Deployment risk analysis



---



\## 4. Hierarchical Orchestration Pattern



\### Overview

Coordinator agent delegates to multiple specialist agents, synthesizes results. Like a project manager with domain experts.



\### When to Use

\- Problem spans multiple domains

\- Need coordination between specialists

\- Specialists have different tool requirements

\- Want expert perspectives integrated

\- Complex synthesis required



\### Architecture

```

Main Claude

&nbsp;   │

&nbsp;   └─→ Coordinator Agent

&nbsp;          ├─→ Security Specialist

&nbsp;          │      └─ Security analysis

&nbsp;          │

&nbsp;          ├─→ Performance Specialist

&nbsp;          │      └─ Performance analysis

&nbsp;          │

&nbsp;          ├─→ Architecture Specialist

&nbsp;          │      └─ Architecture analysis

&nbsp;          │

&nbsp;          └─→ \[Synthesizes all perspectives]

```



\### Implementation Pattern

```markdown

\## Coordinator Agent



Your role: Orchestrate multiple specialist agents to solve complex problem.



\*\*Process\*\*:

1\. \*\*Problem Analysis\*\*: Understand full scope

2\. \*\*Agent Selection\*\*: Determine which specialists needed

3\. \*\*Delegation\*\*: Invoke specialists with focused questions

4\. \*\*Synthesis\*\*: Integrate findings into coherent solution

5\. \*\*Validation\*\*: Ensure no conflicts or gaps



\*\*Specialist Roster\*\*:

\- Security: Authentication, authorization, data protection

\- Performance: Scalability, optimization, resource usage

\- Architecture: Design patterns, system structure, maintainability

\- QA: Testing strategy, edge cases, validation



\*\*Delegation Protocol\*\*:

```

For each specialist:

&nbsp; 1. Craft specific focused question

&nbsp; 2. Invoke specialist agent

&nbsp; 3. Capture their analysis

&nbsp; 4. Check for conflicts with other specialists

```



\*\*Synthesis\*\*: Create unified solution considering all perspectives

```



\### Context Management Strategy



\*\*Coordinator's Context\*\*:

```

Problem description: 3k tokens

Specialist summaries: 2k tokens each

Synthesis: 5k tokens

Total: 3k + (2k \* N specialists) + 5k



For 5 specialists: 18k tokens (manageable)

```



\*\*Specialist's Context\*\*:

```

Focused question from coordinator: 1k tokens

Relevant code/context: 10k tokens

Analysis: 8k tokens

Output: 2k tokens

Total per specialist: 21k tokens

```



\*\*Key\*\*: Coordinator uses SUMMARIES of specialist findings, not full details



\### Handoff Protocol

```markdown

\## Coordinator → Specialist



\*\*Question\*\*: \[Specific focused question]

\*\*Context\*\*: \[Minimal necessary context]

\*\*Expected Output\*\*: \[What coordinator needs back]

\*\*Token Budget\*\*: \[Limit for this specialist]



\## Specialist → Coordinator



\*\*Answer\*\*: \[Direct response to question]

\*\*Key Findings\*\*: \[Bullet points, no fluff]

\*\*Risks Identified\*\*: \[Concerns]

\*\*Recommendations\*\*: \[Specific actionable items]

\*\*Confidence\*\*: \[Score with rationale]

```



\### Examples

\- Strategic planning system (architect, QA, risk analysts)

\- Complex feature implementation (frontend, backend, database specialists)

\- System design (security, performance, reliability experts)



---



\## 5. Context-Managed Pipeline Pattern



\### Overview

Long-running investigation with aggressive context preservation and compression. For extreme cases where token budget is primary concern.



\### When to Use

\- Investigation will be very long (hours)

\- Context WILL exhaust without management

\- Multiple deep dives required

\- Can't parallelize (dependencies between phases)

\- Accuracy more important than speed



\### Architecture

```

Main Claude (Orchestrator)

&nbsp;   │

&nbsp;   ├─→ Phase 1: Broad Investigation

&nbsp;   │      ├─ Output: Summary (compressed)

&nbsp;   │      └─ Checkpoint: Key findings only

&nbsp;   │

&nbsp;   ├─→ Phase 2: Deep Dive Area A

&nbsp;   │      ├─ Reads: Phase 1 summary (not full context)

&nbsp;   │      ├─ Output: Detailed findings (compressed)

&nbsp;   │      └─ Checkpoint: Essentials only

&nbsp;   │

&nbsp;   ├─→ Phase 3: Deep Dive Area B

&nbsp;   │      ├─ Reads: Phase 1 + 2 summaries

&nbsp;   │      └─ Checkpoint: Essentials only

&nbsp;   │

&nbsp;   └─→ Final Synthesis

&nbsp;          ├─ Reads: All phase summaries

&nbsp;          └─ Output: Complete solution

```



\### Compression Strategy



\*\*After each phase, compress using this formula\*\*:



```python

def compress\_context(full\_analysis):

&nbsp;   """Aggressive compression while preserving critical info"""

&nbsp;   

&nbsp;   compressed = {

&nbsp;       "key\_findings": extract\_top\_N\_findings(full\_analysis, N=5),

&nbsp;       "root\_causes": identify\_root\_causes(full\_analysis),

&nbsp;       "critical\_evidence": extract\_evidence(full\_analysis, top\_N=3),

&nbsp;       "open\_questions": list\_unresolved(full\_analysis),

&nbsp;       "context\_for\_next\_phase": minimal\_essentials(full\_analysis)

&nbsp;   }

&nbsp;   

&nbsp;   # Full analysis: 30k tokens

&nbsp;   # Compressed: 3k tokens

&nbsp;   # Compression ratio: 10:1

&nbsp;   

&nbsp;   return compressed

```



\*\*Storage Structure\*\*:

```

.context-managed-pipeline/

├── phase-01-full.md         (30k tokens - for reference only)

├── phase-01-compressed.md   (3k tokens - for next phase)

├── phase-02-full.md         (35k tokens)

├── phase-02-compressed.md   (3k tokens)

├── phase-03-full.md         (40k tokens)

├── phase-03-compressed.md   (3k tokens)

└── synthesis-input.md       (9k tokens = all compressed)

```



\### Token Budget Planning



\*\*Without Context Management\*\*:

```

Phase 1: 30k tokens

Phase 2: 30k + 35k = 65k tokens (includes Phase 1 full context)

Phase 3: 30k + 35k + 40k = 105k tokens (includes all previous)

Total: 200k+ tokens = FAILS

```



\*\*With Context Management\*\*:

```

Phase 1: 30k tokens

Phase 2: 3k (compressed Phase 1) + 35k = 38k tokens

Phase 3: 3k + 3k + 40k = 46k tokens

Total: 114k tokens = SUCCESS

```



\### Compression Implementation



\*\*Script\*\*: `.claude/scripts/compress-phase-output.py`

```python

import json

import sys



def compress(full\_text):

&nbsp;   """Extract only essentials"""

&nbsp;   

&nbsp;   # Extract structured data

&nbsp;   findings = extract\_findings(full\_text)

&nbsp;   root\_causes = identify\_causes(full\_text)

&nbsp;   evidence = critical\_evidence(full\_text)

&nbsp;   

&nbsp;   # Format compressed output

&nbsp;   compressed = f"""

\# Phase Output (Compressed)



\## Key Findings

{format\_bullet\_points(findings\[:5])}



\## Root Causes

{format\_bullet\_points(root\_causes)}



\## Critical Evidence

{format\_code\_snippets(evidence\[:3])}



\## Context for Next Phase

{extract\_minimal\_essentials(full\_text)}

"""

&nbsp;   

&nbsp;   return compressed



if \_\_name\_\_ == "\_\_main\_\_":

&nbsp;   full\_analysis = sys.stdin.read()

&nbsp;   compressed = compress(full\_analysis)

&nbsp;   print(compressed)

```



\### Handoff Protocol



\*\*Phase N Completion\*\*:

```bash

\# 1. Write full output (for reference)

cat << EOF > .context-managed-pipeline/phase-N-full.md

$FULL\_OUTPUT

EOF



\# 2. Compress

python .claude/scripts/compress-phase-output.py \\

&nbsp; < .context-managed-pipeline/phase-N-full.md \\

&nbsp; > .context-managed-pipeline/phase-N-compressed.md



\# 3. Next phase reads ONLY compressed versions

CONTEXT=$(cat .context-managed-pipeline/phase-\*-compressed.md)

```



\### Examples

\- Multi-day debugging investigation

\- Full codebase architectural analysis

\- Comprehensive security audit

\- Complete system documentation generation



---



\## 6. Enforcement Framework Pattern



\### Overview

Use Claude Code's hook system to MANDATE correct behavior. Don't hope the LLM remembers - enforce it mechanically.



\### When to Use

\- Process compliance is critical

\- Mistakes are costly

\- Team members have varying discipline

\- Need audit trail

\- Shortcuts would be tempting but dangerous



\### Architecture

```

Claude Code Lifecycle

&nbsp;   │

&nbsp;   ├─→ PreToolUse Hook

&nbsp;   │      ├─ Validate preconditions

&nbsp;   │      ├─ Check state files

&nbsp;   │      └─ BLOCK if not ready

&nbsp;   │

&nbsp;   ├─→ Tool Execution

&nbsp;   │      

&nbsp;   ├─→ PostToolUse Hook

&nbsp;   │      ├─ Verify postconditions

&nbsp;   │      ├─ Update state files

&nbsp;   │      └─ Log actions

&nbsp;   │

&nbsp;   └─→ SessionEnd Hook

&nbsp;          ├─ Ensure cleanup

&nbsp;          └─ Require outcome documentation

```



\### Hook Implementation



\*\*File\*\*: `.claude/hooks.json`

```json

{

&nbsp; "hooks": {

&nbsp;   "PreToolUse": \[

&nbsp;     {

&nbsp;       "matcher": "Bash|Write|Edit",

&nbsp;       "hooks": \[

&nbsp;         {

&nbsp;           "type": "command",

&nbsp;           "command": ".claude/scripts/enforce-checkpoint.sh"

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

&nbsp;           "command": ".claude/scripts/log-change.sh"

&nbsp;         }

&nbsp;       ]

&nbsp;     }

&nbsp;   ],

&nbsp;   "SessionEnd": \[

&nbsp;     {

&nbsp;       "hooks": \[

&nbsp;         {

&nbsp;           "type": "command",

&nbsp;           "command": ".claude/scripts/require-outcome-doc.sh"

&nbsp;         }

&nbsp;       ]

&nbsp;     }

&nbsp;   ]

&nbsp; }

}

```



\*\*Enforcement Script\*\*: `.claude/scripts/enforce-checkpoint.sh`

```bash

\#!/bin/bash



\# BLOCK all changes until checkpoint exists

if \[ ! -f .workflow/checkpoint-active ]; then

&nbsp;   echo "ERROR: No checkpoint found. Run /checkpoint first."

&nbsp;   exit 1

fi



\# Verify checkpoint is recent (< 1 hour old)

checkpoint\_time=$(stat -c %Y .workflow/checkpoint-active)

current\_time=$(date +%s)

age=$((current\_time - checkpoint\_time))



if \[ $age -gt 3600 ]; then

&nbsp;   echo "ERROR: Checkpoint is stale (>1 hour). Create new checkpoint."

&nbsp;   exit 1

fi



\# Allow tool execution

exit 0

```



\*\*State Tracking\*\*: `.workflow/state.json`

```json

{

&nbsp; "phase": "investigation",

&nbsp; "checkpoint": "commit-abc123",

&nbsp; "mandatory\_validations": \[

&nbsp;   "root\_cause\_documented",

&nbsp;   "solution\_confidence\_scored",

&nbsp;   "risk\_assessment\_completed"

&nbsp; ],

&nbsp; "completed\_validations": \[

&nbsp;   "root\_cause\_documented"

&nbsp; ],

&nbsp; "blocked\_until": \[

&nbsp;   "solution\_confidence\_scored",

&nbsp;   "risk\_assessment\_completed"

&nbsp; ]

}

```



\### Enforcement Patterns



\*\*Pattern 1: Mandatory Sequencing\*\*

```bash

\# Enforce: Can't implement until analysis is complete



\# Hook checks state file

if \[ $(jq -r '.phase' .workflow/state.json) != "analysis\_complete" ]; then

&nbsp;   echo "ERROR: Complete analysis phase first"

&nbsp;   exit 1

fi

```



\*\*Pattern 2: Required Documentation\*\*

```bash

\# Enforce: Can't close session without outcome documentation



\# Hook checks for outcome file

if \[ ! -f .workflow/outcome.md ]; then

&nbsp;   echo "ERROR: Document outcome before closing session"

&nbsp;   echo "Run: /document-outcome"

&nbsp;   exit 1

fi

```



\*\*Pattern 3: Validation Requirements\*\*

```bash

\# Enforce: Changes must pass all checks



\# Run checks

./scripts/run-tests.sh || {

&nbsp;   echo "ERROR: Tests failed. Reverting changes."

&nbsp;   git reset --hard HEAD~1

&nbsp;   exit 1

}



./scripts/lint.sh || {

&nbsp;   echo "ERROR: Linting failed. Fix issues."

&nbsp;   exit 1

}

```



\### Examples

\- Systematic debugging framework (enforce analysis before implementation)

\- Deployment guardian (enforce checklist completion)

\- Code review automation (enforce standards)

\- Compliance audit trail (log all actions)



---



\## Hybrid Pattern Combinations



Real-world solutions often combine multiple patterns:



\### Example 1: Enforced Sequential Workflow with Consensus Validation

```

Sequential Workflow (investigation → plan → implement)

&nbsp;   ├─ Enforcement hooks at each phase transition

&nbsp;   └─ Parallel consensus validation before implementation

```



\*\*Use Case\*\*: Critical system changes that must be thorough and validated



\### Example 2: Hierarchical Orchestration with Context Management

```

Coordinator Agent

&nbsp;   ├─ Multiple Specialists (each with context budgets)

&nbsp;   └─ Context compression between specialist consultations

```



\*\*Use Case\*\*: Complex analysis that spans multiple domains and takes time



\### Example 3: Parallel Consensus with Enforcement

```

Parallel Consensus (5 independent analyses)

&nbsp;   ├─ Enforcement: Each analysis must complete required sections

&nbsp;   └─ Enforcement: Consensus threshold before proceeding

```



\*\*Use Case\*\*: High-stakes decisions requiring both validation and compliance



---



\## Pattern Selection Guide



\### Decision Tree



```

START: What's the problem?



├─ "Single well-defined task"

│  └─ USE: Specialized Subagent

│

├─ "Multi-step process with dependencies"

│  └─ USE: Sequential Workflow

│     └─ IF "mistakes are costly"

│        └─ ADD: Enforcement Framework

│

├─ "Need validation/verification"

│  └─ USE: Parallel Consensus

│     └─ IF "also has phases"

│        └─ COMBINE WITH: Sequential Workflow

│

├─ "Multiple domains involved"

│  └─ USE: Hierarchical Orchestration

│     └─ IF "will take a long time"

│        └─ ADD: Context Management

│

└─ "Very long investigation"

&nbsp;  └─ USE: Context-Managed Pipeline

&nbsp;     └─ IF "need process compliance"

&nbsp;        └─ ADD: Enforcement Framework

```



\### Quick Reference



| Problem Type | Primary Pattern | Add-Ons |

|--------------|----------------|---------|

| Focused task | Specialized Subagent | - |

| Step-by-step process | Sequential Workflow | Enforcement if critical |

| Need validation | Parallel Consensus | - |

| Multi-domain | Hierarchical | Context Mgmt if long |

| Very long investigation | Context-Managed Pipeline | Enforcement for compliance |

| Process compliance | Enforcement Framework | Any other pattern |



---



\## Additional Considerations



\### Cost vs Quality Trade-offs



\*\*Token Cost\*\*:

\- Specialized Subagent: ~10k tokens

\- Sequential Workflow: ~50k tokens

\- Parallel Consensus: ~250k tokens

\- Hierarchical: ~100k tokens

\- Context-Managed: ~120k tokens



\*\*Quality\*\*:

\- Simple patterns: Good for well-defined problems

\- Complex patterns: Better for ambiguous/risky situations



\*\*Rule of Thumb\*\*: Use simplest pattern that will reliably solve the problem



\### When to Add Enforcement



Add enforcement when:

\- ✅ Mistakes are very costly

\- ✅ Process is being used by team (not just you)

\- ✅ There's temptation to skip steps

\- ✅ Need audit trail for compliance

\- ✅ Previous failures happened due to shortcuts



Skip enforcement when:

\- ❌ Just you using it

\- ❌ Problem is obvious and simple

\- ❌ Cost of enforcement > cost of mistakes

\- ❌ Adds friction that would discourage use



\### When to Add Context Management



Add context management when:

\- ✅ Investigation will likely exceed 50k tokens

\- ✅ Multiple deep dives required

\- ✅ You've previously hit context limits on similar problems

\- ✅ Correctness is more important than speed



Skip context management when:

\- ❌ Problem is bounded and well-defined

\- ❌ Analysis fits comfortably in token budget

\- ❌ Speed is critical

\- ❌ Adds complexity without clear benefit

