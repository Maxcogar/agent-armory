---
description: Rapid codebase understanding using targeted scripts instead of brute-force file reading
---

1. Ask the user what they need to understand:
   - The whole codebase (new project)?
   - A specific feature or area?
   - How a specific function/component works?
   - The impact of a potential change?

2. Run Project Discovery:
// turbo
   - Detect project type and config files
   - Get file type census (what languages/frameworks)
   - Measure codebase size

3. Report project profile:
   - Type: [detected stack]
   - Size: [approximate line count]
   - Structure: [monorepo / single app / library]

4. Based on user's goal, select recon strategy:

   **IF whole codebase understanding:**
   - Run Entry Points script
   - Run Dependency Map (find most-imported files)
   - Run API Surface scripts
   - Run Data Layer scripts
   
   **IF specific feature/area:**
   - Run Symbol Search for key terms
   - Run grep for the feature name across codebase
   - Run git log for that directory
   
   **IF specific function/component:**
   - Run Symbol Search (definition)
   - Run Symbol Search (usages)
   - Run git blame on the file
   
   **IF change impact analysis:**
   - Run Symbol Search (usages of thing being changed)
   - Map the dependency chain outward
   - Find tests that cover this area

5. Execute the selected scripts and collect results.

6. Synthesize findings into a context map:
   ```
   CODEBASE CONTEXT MAP
   ====================
   Project: [type and stack]
   
   Entry Points:
   - [file]: [purpose]
   
   Core Abstractions (most-imported):
   - [file]: [what it provides]
   
   Relevant Files for This Task:
   - [file]: [why it matters]
   - [file]: [why it matters]
   
   Data Flow:
   [entry] → [processing] → [storage/output]
   
   Key Dependencies:
   - [external lib]: [what it's used for]
   ```

7. Present the context map to the user.

8. Ask: "Which files should I read in detail to help with your task?"

9. Read ONLY the files the user confirms (or the top 3-5 most relevant if user says "your choice").

10. Now proceed with the user's original task, using the context gathered.

<error_handling>
IF a script fails or returns empty:
  DO note the failure and try an alternative approach
  DO NOT assume the pattern doesn't exist — the script may need adaptation

IF the codebase is very large (>100k lines):
  DO focus on the specific area relevant to the task
  DO NOT attempt to map the entire codebase at once

IF project type cannot be detected:
  DO ask the user what stack they're using
  DO NOT guess and run wrong scripts
</error_handling>

<constraint>
Never read files before running recon scripts.
Never read more than 5 files without script-based justification for each.
Always present the context map before deep-diving into files.
</constraint>
