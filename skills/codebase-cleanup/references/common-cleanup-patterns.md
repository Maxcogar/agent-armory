# Common Cleanup Patterns and Anti-Patterns

## Safe Cleanup Patterns

### Pattern: Gradual Dead Code Elimination
```bash
# Step 1: Identify unused exports
npx ts-unused-exports tsconfig.json --showLineNumber

# Step 2: Comment out with date marker
// DEPRECATED: 2024-11-20 - Marked for removal

# Step 3: Remove after verification period (e.g., 2 weeks)
```

### Pattern: Backup Before Delete
```bash
# Always create a backup branch
git checkout -b pre-cleanup-backup
git push origin pre-cleanup-backup

# Or create archive
tar -czf backup-$(date +%Y%m%d).tar.gz src/ --exclude=node_modules
```

### Pattern: Incremental Migration
Instead of massive reorganization:
1. Create new structure
2. Move files gradually
3. Update imports incrementally
4. Delete old structure only when empty

## Dangerous Anti-Patterns to Avoid

### Anti-Pattern: Bulk Deletion Without Analysis
❌ WRONG:
```bash
find . -name "*.old" -delete  # Don't do this!
```

✅ RIGHT:
```bash
find . -name "*.old" > files-to-review.txt
# Review list first, then delete individually
```

### Anti-Pattern: Assuming File Purpose from Name
❌ WRONG: "utils.old.js looks old, let's delete it"

✅ RIGHT: Check for:
- Import statements
- Git history
- Comments explaining purpose
- Related documentation

### Anti-Pattern: Moving Files Without Updating Imports
❌ WRONG:
```bash
mv src/OldComponent.jsx src/components/NewComponent.jsx
```

✅ RIGHT:
```bash
# Use git mv to preserve history
git mv src/OldComponent.jsx src/components/NewComponent.jsx
# Then update all imports
grep -r "OldComponent" --include="*.js" --include="*.jsx" .
```

## Code Smell Detection Patterns

### Identifying Dead Code

1. **Unused Variables/Functions**
```javascript
// Look for:
const unusedVar = 'something';  // Never referenced
function unusedFunc() {}        // Never called
```

2. **Commented Code Blocks**
```javascript
// More than 10 lines of commented code
/* 
  Old implementation - if older than 3 months,
  likely safe to remove
*/
```

3. **Unreachable Code**
```javascript
return result;
console.log('never runs');  // After return
```

### Identifying Duplicates

1. **Similar Function Names**
- `formatDate()` vs `dateFormat()` vs `getFormattedDate()`
- Check if they do the same thing

2. **Copy-Paste Indicators**
- Files with similar names: `UserList.jsx` vs `UserList2.jsx`
- Comments like "based on", "copied from", "similar to"

3. **Import Pattern Mismatches**
```javascript
// File A
import { formatDate } from './utils/date';
// File B  
import { formatDate } from '../helpers/formatting';
// Might be duplicates
```

## Dependency Cleanup Patterns

### Pattern: Identify Unused Dependencies
```bash
# Use depcheck
npx depcheck

# Manual check - search for imports
grep -r "from 'package-name'" src/
grep -r "require('package-name')" src/
```

### Pattern: Find Duplicate Functionality
Common duplicates:
- `moment` + `date-fns` (choose one)
- `axios` + `fetch` (choose one)
- `lodash` + `ramda` (choose one)
- Multiple form libraries
- Multiple styling solutions

## Configuration Consolidation

### Pattern: Merge Split Configs
```javascript
// Instead of:
// - .eslintrc
// - .eslintrc.prod
// - .eslintrc.dev

// Use one with environment conditions:
module.exports = {
  extends: process.env.NODE_ENV === 'production' 
    ? ['production-rules']
    : ['development-rules']
};
```

### Pattern: Centralize Environment Variables
```bash
# Instead of scattered .env files:
.env.local
.env.development.local  
.env.test.local

# Use single source of truth:
.env                    # Shared
.env.development       # Dev-specific
.env.production        # Prod-specific
```

## Testing Before Removal

### Pattern: Verify Import Usage
```bash
# Before removing a file, check all imports
FILE="src/utils/helper.js"
grep -r "from '$FILE'" . 
grep -r "from '.*/helper'" .
grep -r "require.*helper" .
```

### Pattern: Test Build After Changes
```bash
# After each cleanup phase:
npm run build
npm test
npm run lint

# If anything fails, rollback
git stash  # or git reset --hard
```

## Documentation Update Patterns

### Pattern: Update README Incrementally
```markdown
<!-- Mark sections during cleanup -->
## Setup Instructions
> ⚠️ UPDATED: 2024-11-20 - Verified working

## Old Setup (Deprecated)
> ❌ DEPRECATED: No longer works as of 2024-11-20
```

### Pattern: Document Decisions
```markdown
<!-- Create CLEANUP-DECISIONS.md -->
# Cleanup Decisions Log

## 2024-11-20: Removed legacy authentication
- **What**: Old auth system in src/auth-old/
- **Why**: Replaced by new OAuth implementation
- **Impact**: None - unused for 6 months
- **Rollback**: Available in git history at commit abc123
```

## Red Flags - When NOT to Clean

### Critical Files Often Misidentified
- `.env.production` - May look like duplicate of `.env`
- `config.old.js` - May be fallback for compatibility
- `backup.sql` - May be only database schema
- `legacy-api.js` - May still have active consumers
- `deprecated-component.jsx` - May be used in lazy-loaded routes

### Hidden Dependencies
- Dynamic imports: `import(\`./views/${view}.js\`)`
- String-based requires: `require(moduleName)`
- Config-driven imports
- Webpack magic comments
- Build-time file generation

### Signs a File Is Still Important
- Recent git commits (last 3 months)
- Production error logs reference it
- External services depend on it
- Customer-specific customizations
- Regulatory/compliance requirements
- Contains TODO/FIXME for upcoming sprint
