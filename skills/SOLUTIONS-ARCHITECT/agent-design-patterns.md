\# Agent Design Patterns



Quick reference for designing effective Claude Code agents and subagents.



\## Key Principles



1\. \*\*Single Responsibility\*\*: Each agent should have one clear purpose

2\. \*\*Explicit Context Strategy\*\*: Define token budget and loading strategy

3\. \*\*Structured Output\*\*: Use templates for consistent format

4\. \*\*Compression Mindset\*\*: Output should be compact for handoffs



\## YAML Frontmatter Requirements



```yaml

---

name: agent-name

description: When to invoke (be specific and comprehensive)

tools: Read, Grep, Bash, Ripgrep

model: sonnet

---

```



\## Agent Anatomy



```markdown

---

\[frontmatter]

---



\# Agent Name



\## Token Budget

\- Maximum: \[limit]

\- Input: \[allocation]

\- Output: \[allocation]



\## Context Loading Strategy

\### Phase 1: Essential (Xk tokens)

\### Phase 2: Detailed (if needed, +Yk tokens)



\## Process

1\. \[Step 1]

2\. \[Step 2]



\## Output Format

\[Structured template]



\## Red Flags

🚩 \[Things to watch for]

```



\## Examples



See your existing agents:

\- `systematic-debugger.md` - Investigation specialist

\- `systems-architect.md` - Architecture analysis

\- `risk-analyst.md` - Risk assessment

\- `qa-strategist.md` - Testing strategy



\## Token Budget Guidelines



| Agent Type | Typical Budget | Use Case |

|------------|----------------|----------|

| Specialized | 20k tokens | Single focused task |

| Investigator | 50k tokens | Deep analysis |

| Coordinator | 30k tokens | Orchestration |



\## Context Handoff Pattern



```markdown

\## Output Format



\### Compressed (to main Claude): 2-3k tokens

\[Essentials only]



\### Full (to file): No limit

\[Complete details for reference]

```

