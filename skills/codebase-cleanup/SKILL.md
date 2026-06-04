---
name: codebase-cleanup
description: Methodical codebase analysis and cleanup for React/Vite web applications using subagent orchestration. Use when performing comprehensive codebase cleanup, identifying outdated files, validating deployment workflows, or reorganizing project structure. Employs multi-phase analysis with approval checkpoints to prevent accidental deletion of important files. Handles distinction between development/production files, validates server startup methods, database migrations, and deployment workflows.
---

# Codebase Cleanup with Subagent Orchestration

A methodical, multi-phase approach to cleaning and organizing React/Vite web applications without accidentally purging important files.

## Core Principles

1. **Never delete or move without explicit approval**
2. **Document everything before changing anything**
3. **Use subagents for parallel analysis**
4. **Create comprehensive audit reports at each phase**
5. **Maintain rollback capability**

## Phase Structure Overview

The cleanup process is divided into 5 sequential phases, each with approval gates:

1. **Discovery & Inventory** - Map the entire codebase
2. **Analysis & Classification** - Identify file purposes and issues
3. **Validation & Testing** - Verify critical workflows
4. **Planning & Proposal** - Generate cleanup plan
5. **Execution** - Implement approved changes

## Phase 1: Discovery & Inventory

### Primary Agent Tasks

```bash
# Create analysis workspace
mkdir -p .cleanup-audit/{reports,backups,proposals}
echo "$(date): Cleanup audit started" > .cleanup-audit/audit.log

# Generate initial inventory
find . -type f -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" \
  -o -name "*.json" -o -name "*.md" -o -name "*.yml" -o -name "*.yaml" \
  -o -name "*.env*" -o -name "*.config.*" | sort > .cleanup-audit/file-inventory.txt
```

### Subagent Assignments

Deploy 3 subagents for parallel discovery:

**Subagent A - Project Structure Mapper**
```
Task: Map the project structure and identify organizational patterns
Output: structure-analysis.md

1. Analyze directory structure
2. Identify naming conventions
3. Document folder purposes
4. Note deviations from standard React/Vite structure
5. List all configuration files and their purposes
```

**Subagent B - Dependency Analyzer**
```
Task: Analyze package.json and dependencies
Output: dependency-analysis.md

1. List all dependencies with versions
2. Identify unused dependencies (use depcheck)
3. Find outdated packages
4. Check for security vulnerabilities
5. Identify duplicate functionality packages
6. Document dev vs production dependencies
```

**Subagent C - Documentation Scanner**
```
Task: Scan all documentation and comments
Output: documentation-status.md

1. List all README/doc files
2. Check for outdated documentation
3. Find TODO/FIXME comments
4. Identify missing documentation
5. Note conflicting instructions
```

### Phase 1 Deliverable

Generate `phase1-discovery-report.md`:
```markdown
# Phase 1: Discovery Report
Generated: [timestamp]

## Project Statistics
- Total files: X
- Total directories: Y
- Project size: Z MB
- Last modified: [date]

## Structure Overview
[From Subagent A]

## Dependency Status
[From Subagent B]

## Documentation Status
[From Subagent C]

## Initial Observations
- [Key findings]
- [Potential issues]
- [Quick wins identified]

## Proceed to Phase 2? [YES/NO]
```

## Phase 2: Analysis & Classification

### Subagent Assignments

Deploy 4 subagents for deep analysis:

**Subagent D - Dead Code Detective**
```
Task: Identify potentially unused code
Output: dead-code-analysis.md

1. Find unused components (no imports)
2. Identify orphaned files
3. Detect unreachable code
4. Find commented-out code blocks
5. List deprecated features still in codebase

Use scripts/find-unused-exports.js for analysis
```

**Subagent E - Duplicate Finder**
```
Task: Find duplicate and similar code
Output: duplicate-analysis.md

1. Identify duplicate components
2. Find similar utility functions
3. Detect copy-pasted code blocks
4. List redundant configuration files
5. Find multiple implementations of same feature

Use jscpd for duplicate detection
```

**Subagent F - Environment Classifier**
```
Task: Classify development vs production files
Output: environment-classification.md

1. Identify development-only files
2. List production-critical files
3. Find test files and fixtures
4. Classify build artifacts
5. Document environment-specific configs

Mark each file as: PROD | DEV | TEST | BUILD | UNKNOWN
```

**Subagent G - Import/Export Analyzer**
```
Task: Analyze import statements and module structure
Output: import-analysis.md

1. Find circular dependencies
2. Identify broken imports
3. List unused exports
4. Find inconsistent import patterns
5. Document import aliases and paths
```

### Phase 2 Deliverable

Generate `phase2-analysis-report.md` with:
- File classification matrix
- Risk assessment for each file category
- Dependency graph visualization
- Code quality metrics

## Phase 3: Validation & Testing

### Critical Workflow Validation

**Primary Agent coordinates validation of:**

1. **Local Development Startup**
   ```bash
   # Document all methods found
   echo "=== Development Server Methods ===" > .cleanup-audit/server-methods.md
   
   # Test each method and record results
   npm run dev     # Test 1
   npm start       # Test 2
   vite           # Test 3
   yarn dev       # Test 4
   ```

2. **Database Migration Methods**
   ```bash
   # Find all migration scripts
   find . -name "*migrate*" -o -name "*seed*" -o -name "*schema*"
   
   # Document gcloud/other migration approaches
   ```

3. **Production Deployment**
   ```bash
   # Identify deployment configs
   find . -name "*.yml" -o -name "*.yaml" | xargs grep -l "deploy"
   
   # Check for CI/CD files
   ls -la .github/workflows/ 2>/dev/null
   ls -la .gitlab-ci.yml 2>/dev/null
   ```

### Subagent Assignments

**Subagent H - Script Validator**
```
Task: Test all package.json scripts
Output: script-validation.md

For each script in package.json:
1. Document purpose
2. Test execution (dry-run if destructive)
3. Note dependencies
4. Check for errors
5. Mark as: WORKING | BROKEN | DEPRECATED | DANGEROUS
```

**Subagent I - Config Validator**
```
Task: Validate all configuration files
Output: config-validation.md

1. Check vite.config.js/ts
2. Validate tsconfig.json
3. Test babel config
4. Verify ESLint/Prettier configs
5. Check environment variables
```

### Phase 3 Deliverable

Generate `phase3-validation-report.md` with:
- Working vs broken features matrix
- Correct startup/deployment commands
- Critical file preservation list
- Risk warnings for any changes

## Phase 4: Planning & Proposal

### Generate Cleanup Proposal

Based on Phases 1-3, create `cleanup-proposal.md`:

```markdown
# Cleanup Proposal

## Safe to Remove (Low Risk)
- [ ] Empty files
- [ ] .DS_Store files  
- [ ] node_modules (will reinstall)
- [ ] Build artifacts in wrong locations

## Requires Confirmation (Medium Risk)
- [ ] Commented-out code (over 6 months old)
- [ ] Unused components (no imports found)
- [ ] Duplicate implementations
- [ ] Old backup files (*_old.js, *.backup)

## Suggested Reorganization (With Mapping)
- [ ] Move /components/old → /archive/components
- [ ] Consolidate config files
- [ ] Standardize file naming

## Must Preserve (Critical)
- [List all critical files identified]

## Validation Scripts to Update
- [ ] Update README with correct commands
- [ ] Fix package.json scripts
- [ ] Update deployment docs

## Estimated Impact
- Files to remove: X
- Space to recover: Y MB
- Code reduction: Z%
```

### Rollback Plan

```bash
# Create backup before any changes
tar -czf .cleanup-audit/backup-$(date +%Y%m%d-%H%M%S).tar.gz \
  --exclude=node_modules --exclude=.git .

# Generate restoration script
cat > .cleanup-audit/rollback.sh << 'EOF'
#!/bin/bash
# Restoration script if cleanup goes wrong
tar -xzf $1
echo "Restored from backup: $1"
EOF
chmod +x .cleanup-audit/rollback.sh
```

## Phase 5: Execution

### Execution Strategy

Only proceed after explicit approval of Phase 4 proposal.

**Execution Order:**
1. Create comprehensive backup
2. Remove approved "Safe to Remove" items
3. Process "Requires Confirmation" items one by one
4. Implement reorganization with git mv
5. Update documentation
6. Run validation tests
7. Generate final report

### Subagent Execution Tasks

**Subagent J - Safe Cleanup**
```bash
# Execute safe removals
while IFS= read -r file; do
  echo "Removing: $file"
  rm -f "$file"
  echo "$(date): Removed $file" >> .cleanup-audit/audit.log
done < approved-safe-removal.txt
```

**Subagent K - Reorganization**
```bash
# Execute approved moves
while IFS='→' read -r source dest; do
  mkdir -p "$(dirname "$dest")"
  git mv "$source" "$dest" 2>/dev/null || mv "$source" "$dest"
  echo "$(date): Moved $source → $dest" >> .cleanup-audit/audit.log
done < approved-moves.txt
```

### Final Report

Generate `cleanup-complete-report.md`:
- Files removed: X
- Files moved: Y  
- Space recovered: Z MB
- Updated configurations: [list]
- Updated documentation: [list]
- Validation test results: PASS/FAIL

## Scripts for Subagents

### scripts/find-unused-exports.js
```javascript
const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

// Find all exports that are never imported
function findUnusedExports(directory) {
  const exports = new Map();
  const imports = new Set();
  
  // Parse all files
  function parseFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    try {
      const ast = parser.parse(content, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript']
      });
      
      traverse(ast, {
        ExportNamedDeclaration(path) {
          // Track exports
        },
        ImportDeclaration(path) {
          // Track imports
        }
      });
    } catch (e) {
      console.error(`Parse error in ${filePath}: ${e.message}`);
    }
  }
  
  // Walk directory
  function walkDir(dir) {
    // Implementation
  }
  
  walkDir(directory);
  return { exports, imports };
}

// Execute
const results = findUnusedExports(process.argv[2] || '.');
console.log(JSON.stringify(results, null, 2));
```

### scripts/validate-imports.js
```javascript
const fs = require('fs');
const path = require('path');

// Validate all import statements resolve correctly
function validateImports(projectRoot) {
  const errors = [];
  
  function checkFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const importRegex = /import\s+.*\s+from\s+['"](.+)['"]/g;
    
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1];
      if (!resolveImport(filePath, importPath)) {
        errors.push({
          file: filePath,
          import: importPath,
          line: content.substring(0, match.index).split('\n').length
        });
      }
    }
  }
  
  function resolveImport(fromFile, importPath) {
    // Check if import resolves
    // Handle aliases, node_modules, relative paths
    return true; // placeholder
  }
  
  // Walk and validate
  walkDirectory(projectRoot, checkFile);
  return errors;
}

console.log(JSON.stringify(validateImports('.'), null, 2));
```

## Coordination Protocol

### Communication Between Agents

```markdown
## Subagent Status Format
AGENT: [A-K]
PHASE: [1-5]
STATUS: [WORKING|COMPLETE|BLOCKED|ERROR]
PROGRESS: [0-100]%
OUTPUT: [filename]
NOTES: [any issues or findings]
```

### Primary Agent Coordination Tasks

1. Monitor subagent progress
2. Resolve blocking issues
3. Merge subagent outputs
4. Generate phase reports
5. Get user approval at gates
6. Coordinate rollback if needed

## Emergency Stop

If at any point the cleanup seems to be going wrong:

```bash
# EMERGENCY STOP
touch .cleanup-audit/STOP
echo "CLEANUP HALTED: $(date)" >> .cleanup-audit/audit.log

# Check for STOP file in all operations
if [ -f .cleanup-audit/STOP ]; then
  echo "Emergency stop triggered"
  exit 1
fi
```

## Important Warnings

1. **NEVER** delete without explicit approval
2. **NEVER** move files without user confirmation  
3. **ALWAYS** preserve .git directory
4. **ALWAYS** backup before destructive operations
5. **ALWAYS** validate critical workflows remain functional

## References

For detailed patterns and examples, see:
- references/react-vite-structure.md - Standard React/Vite project structures
- references/common-cleanup-patterns.md - Common cleanup patterns and anti-patterns
- references/subagent-prompts.md - Detailed prompts for each subagent role
