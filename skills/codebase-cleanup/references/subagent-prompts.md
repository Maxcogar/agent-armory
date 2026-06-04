# Subagent Prompts for Codebase Cleanup

## Subagent A: Project Structure Mapper

You are analyzing a React/Vite project structure. Your task is to map the complete project organization and identify patterns.

**Your objectives:**
1. Create a hierarchical map of all directories
2. Identify the purpose of each major directory
3. Note naming conventions (camelCase, kebab-case, PascalCase)
4. Find deviations from standard React/Vite structure
5. List all configuration files and their roles

**Output format (structure-analysis.md):**
```markdown
# Project Structure Analysis

## Directory Hierarchy
[Tree structure with annotations]

## Naming Conventions
- Components: [PascalCase/camelCase/etc]
- Files: [conventions observed]
- Directories: [conventions observed]

## Directory Purposes
- /src: [description]
- /src/components: [description]
[etc...]

## Configuration Files Found
- package.json: [purpose]
- vite.config.js: [purpose]
[etc...]

## Deviations from Standard
1. [Deviation]: [Impact/Risk]

## Recommendations
1. [Specific organizational improvement]
```

## Subagent B: Dependency Analyzer

You are analyzing npm dependencies for a React/Vite project. Focus on identifying redundancy, security issues, and optimization opportunities.

**Your objectives:**
1. Catalog all dependencies with versions
2. Identify unused dependencies using depcheck
3. Find outdated packages
4. Check for known vulnerabilities  
5. Identify duplicate functionality
6. Clearly separate dev vs production dependencies

**Commands to run:**
```bash
npx depcheck --json > depcheck-results.json
npm outdated --json > outdated.json
npm audit --json > audit.json
```

**Output format (dependency-analysis.md):**
```markdown
# Dependency Analysis

## Statistics
- Total dependencies: X
- Production dependencies: Y
- Development dependencies: Z
- Outdated packages: A
- Vulnerabilities: B

## Unused Dependencies
[List with last import date if available]

## Duplicate Functionality
- Date handling: [moment, date-fns, dayjs]
- HTTP clients: [axios, fetch, got]

## Security Issues
[CVE list with severity]

## Update Recommendations
[Package]: [Current] → [Latest] [Breaking changes?]

## Dependencies to Remove
1. [Package]: [Reason]

## Dependencies to Keep
[Critical dependencies with justification]
```

## Subagent C: Documentation Scanner

You are auditing documentation completeness and accuracy in a React/Vite project.

**Your objectives:**
1. Find all documentation files
2. Check documentation accuracy against actual code
3. Find TODO/FIXME/HACK/NOTE comments
4. Identify missing critical documentation
5. Find conflicting instructions

**Search patterns:**
```bash
# Find all docs
find . -type f \( -name "*.md" -o -name "*.txt" -o -name "README*" -o -name "CONTRIBUTING*" -o -name "CHANGELOG*" \)

# Find code comments
grep -r "TODO\|FIXME\|HACK\|XXX\|NOTE\|OPTIMIZE\|REFACTOR" --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx"
```

**Output format (documentation-status.md):**
```markdown
# Documentation Status

## Documentation Files
- README.md: [last updated]
- [Other docs]: [status]

## Code Comments Analysis
### TODO Comments: X total
[File:Line]: [Comment]

### FIXME Comments: Y total
[File:Line]: [Comment]

## Accuracy Issues
1. README says: [instruction]
   Reality: [actual behavior]

## Missing Documentation
- [ ] API documentation
- [ ] Deployment guide
- [ ] Environment setup

## Conflicting Instructions
1. File A says: [X]
   File B says: [Y]
```

## Subagent D: Dead Code Detective

You are identifying potentially unused code in a React/Vite project. Be conservative - flag as "potentially unused" rather than "definitely unused".

**Your objectives:**
1. Find components with no imports
2. Find orphaned files
3. Detect unreachable code
4. Find large commented-out blocks
5. Identify deprecated features

**Analysis approach:**
```javascript
// Track all exports and imports
// Flag exports with no corresponding imports
// Check for dynamic imports
// Consider lazy loading and code splitting
```

**Output format (dead-code-analysis.md):**
```markdown
# Dead Code Analysis

## Potentially Unused Components
[Component]: 
  - Last modified: [date]
  - No imports found
  - Confidence: [High/Medium/Low]

## Orphaned Files
[File]: [Reason for classification]

## Commented Code Blocks
[File:Lines]: [Date if available] [Size]

## Unreachable Code
[File:Line]: [Code after return/throw]

## Deprecated Features
[Feature]: [Marked deprecated on: date]

## Verification Needed
[List items needing manual verification]
```

## Subagent E: Duplicate Finder

You are finding duplicate and near-duplicate code. Focus on identifying redundancy that can be consolidated.

**Your objectives:**
1. Find exact duplicate files
2. Find similar components/functions
3. Detect copy-pasted code blocks
4. Find redundant utilities
5. Identify multiple implementations of same feature

**Tools to use:**
```bash
# Install and run jscpd
npx jscpd src --min-lines 5 --min-tokens 50 --format "json" > duplicates.json
```

**Output format (duplicate-analysis.md):**
```markdown
# Duplicate Code Analysis

## Exact Duplicates
File A: [path]
File B: [path]
[Diff summary if any]

## Similar Components
[ComponentA] ≈ [ComponentB]
Similarity: X%
Differences: [List]

## Duplicate Utilities
Function: formatDate()
Found in: [List of files]
Recommendation: [Consolidation approach]

## Copy-Paste Blocks
[File:Lines] ≈ [File:Lines]
Size: X lines
[Code snippet]

## Consolidation Opportunities
1. [What]: [How to consolidate]
Priority: [High/Medium/Low]
```

## Subagent F: Environment Classifier

You are classifying files by environment (development/production/test/build). This is critical for ensuring production files aren't accidentally removed.

**Your objectives:**
1. Classify each file type by environment
2. Identify production-critical files
3. Find test-only files
4. Identify build artifacts
5. Flag uncertain classifications

**Classification rules:**
- *.test.js, *.spec.js → TEST
- *.stories.js → DEV
- Mock data → DEV/TEST
- Build output → BUILD
- Core business logic → PROD
- Configuration → Depends on specific file

**Output format (environment-classification.md):**
```markdown
# Environment Classification

## Production Critical (MUST PRESERVE)
[File/Directory]: [Reason]

## Development Only
[File/Directory]: [Safe to exclude from prod]

## Test Files
[File/Directory]: [Test type]

## Build Artifacts
[File/Directory]: [Can regenerate]

## Uncertain Classification
[File/Directory]: [Why uncertain] [Needs review]

## Environment-Specific Configs
.env.development: [Contents summary]
.env.production: [Contents summary]

## Recommendations
1. [Environment separation improvement]
```

## Subagent G: Import/Export Analyzer

You are analyzing the module import/export structure to find issues and optimization opportunities.

**Your objectives:**
1. Find circular dependencies
2. Identify broken imports
3. Find unused exports
4. Detect inconsistent import patterns
5. Document import aliases and path mappings

**Analysis approach:**
```javascript
// Parse all import/export statements
// Build dependency graph
// Detect cycles
// Verify import paths resolve
```

**Output format (import-analysis.md):**
```markdown
# Import/Export Analysis

## Circular Dependencies
Cycle 1: A → B → C → A
[Files involved]

## Broken Imports
[File:Line]: Cannot resolve '[path]'

## Unused Exports
[File]: Export '[name]' has no imports

## Import Pattern Issues
- Mixing default/named exports
- Inconsistent paths (../ vs @/)
- Mixing require/import

## Path Aliases
@ → src/
~ → root/
[Other mappings]

## Optimization Opportunities
1. [Convert to dynamic import]: [Files]
2. [Bundle together]: [Related files]
```

## Subagent H: Script Validator

You are testing and documenting all npm scripts to determine which ones work, which are broken, and which are obsolete.

**Your objectives:**
1. Test each package.json script
2. Document what each script does
3. Identify broken scripts
4. Find deprecated/unused scripts
5. Check script dependencies

**Testing approach:**
```bash
# For each script, try:
npm run [script] --dry-run  # If supports dry-run
timeout 5 npm run [script]   # With timeout for hanging scripts
```

**Output format (script-validation.md):**
```markdown
# Script Validation Report

## Working Scripts
"dev": 
  - Purpose: Start development server
  - Command: vite
  - Status: ✅ WORKING
  - Dependencies: vite

## Broken Scripts
"test":
  - Purpose: Run tests
  - Command: jest
  - Status: ❌ BROKEN
  - Error: jest not installed

## Deprecated Scripts
"old-build":
  - Status: ⚠️ DEPRECATED
  - Replacement: Use 'build' instead

## Script Dependencies
[Script]: Requires [packages/files]

## Recommendations
1. Remove: [script] - [reason]
2. Fix: [script] - [how]
3. Add: [suggested script] - [purpose]
```

## Subagent I: Config Validator

You are validating all configuration files to ensure they're correct, consistent, and not conflicting.

**Your objectives:**
1. Validate syntax of all config files
2. Check for conflicting configurations  
3. Find outdated config patterns
4. Verify environment variables
5. Test config effectiveness

**Files to check:**
- vite.config.js/ts
- tsconfig.json
- .eslintrc.*
- .prettierrc.*
- babel.config.*
- jest.config.*
- postcss.config.*

**Output format (config-validation.md):**
```markdown
# Configuration Validation

## Config File Status
vite.config.js:
  - Syntax: ✅ Valid
  - Features: [List]
  - Issues: [None/List]

## Conflicts Found
ESLint vs Prettier:
  - Rule: [rule name]
  - ESLint says: [X]
  - Prettier says: [Y]

## Environment Variables
Required but missing:
- VITE_API_URL: Not in .env.example

Defined but unused:
- OLD_API_KEY: No references found

## Outdated Patterns
[Config]: Using deprecated [pattern]
Recommendation: [Modern approach]

## Validation Results
1. [Config]: [PASS/FAIL] [Reason]
```

## Primary Agent Coordination Prompts

### Phase Transition Prompt
```
I have completed Phase [X] with the following subagents:
- Subagent [A]: [Status]
- Subagent [B]: [Status]

Key findings:
[Summary]

The full report is available at: [path]

Shall we proceed to Phase [X+1]? This will involve:
[Next phase description]

Please review the report and confirm before proceeding.
```

### Conflict Resolution Prompt
```
Subagents have reported conflicting information:

Subagent [X] says: [Finding]
Subagent [Y] says: [Different finding]

This needs resolution before proceeding. Options:
1. Trust Subagent [X] because [reason]
2. Trust Subagent [Y] because [reason]  
3. Require manual verification
4. Deploy Subagent [Z] for tie-breaking analysis

How should we proceed?
```

### Final Approval Prompt
```
# Cleanup Plan Ready for Execution

Based on all phases of analysis, here is the final cleanup plan:

## Safe Removals (X files, Y MB)
[List]

## Requires Your Confirmation (Z files)
[List with reasons]

## Will Be Preserved
[Critical files list]

## Execution Order
1. Create backup
2. Remove safe items
3. Process confirmations
4. Update documentation
5. Run validation

This is a DESTRUCTIVE operation. Please confirm:
- [ ] I have reviewed the plan
- [ ] I have backed up important work
- [ ] I accept the changes

Type "EXECUTE CLEANUP" to proceed or "ABORT" to cancel.
```
