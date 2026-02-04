# Scripts Before Reading

<context>
Apply when any task requires understanding code that has not been read yet.
This includes: planning features, debugging, refactoring, adding to existing code, or answering "how does X work" questions.
</context>

<rules>
1. Before reading any source file, run a targeted script to confirm it's relevant
2. Use grep/find to locate symbols before opening files that might contain them
3. Map dependencies and imports before reading implementation details
4. Check git history for recently changed files before assuming code is stable
5. Read test files to understand expected behavior before reading implementation
6. Limit file reads to 5 files maximum before synthesizing and asking for direction
</rules>

<script_priority>
When you need to understand something, use scripts in this order:

1. **Locate first:** `grep -rn "SYMBOL"` or `find . -name "PATTERN"`
2. **Map dependencies:** `grep -roh "from.*import\|require(" | sort | uniq -c | sort -rn`
3. **Check history:** `git log --oneline -10 -- "path/to/file"`
4. **Then read:** Only the specific files scripts pointed you to
</script_priority>

<efficient_patterns>
Instead of reading files to find X, use:
- Function definition: `grep -rn "function X\|def X\|const X =" --include="*.ts"`
- All usages of X: `grep -rn "X(" --include="*.ts" | grep -v "function X"`
- Files importing X: `grep -rl "import.*X\|from.*X" --include="*.ts"`
- Most-imported modules: `grep -roh "from ['\"]\..*['\"]" | sort | uniq -c | sort -rn | head -10`
- Entry points: `grep -rl "main(\|createServer\|app.listen" --include="*.ts"`
- Recent hot files: `git log --pretty=format: --name-only --since="1 month ago" | sort | uniq -c | sort -rn | head -10`
</efficient_patterns>

<error_handling>
IF asked to understand a function but its location is unknown:
  DO run `grep -rn "function FUNCNAME\|def FUNCNAME"` first
  DO NOT open files hoping to find it

IF asked about code structure but haven't mapped it:
  DO run `find . -type f -name "*.EXT" | head -30` to see what exists
  DO NOT start reading from an assumed entry point

IF reading a file and it imports many other files:
  DO note the imports but do not chase them all
  DO ask user which dependency chain to follow

IF task requires understanding more than 5 files:
  DO pause after 5 and synthesize what you've learned
  DO ask user for direction on where to focus next
</error_handling>

<verification>
Before reading any source file, confirm:
- [ ] A script has indicated this file is relevant
- [ ] OR the user explicitly requested this file
- [ ] You have not exceeded 5 files without pausing to synthesize
</verification>

<constraint>
Never open a file just to "see what's in there."
Never read more than 5 files without synthesizing findings and checking direction.
Always prefer a 1-second grep over a 30-second file read.
</constraint>
