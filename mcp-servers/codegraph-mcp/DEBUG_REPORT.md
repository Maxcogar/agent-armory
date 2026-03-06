# Code Graph MCP - Debug Report: Missing Node.js Backend Files

**Date:** 2026-03-05
**Issue:** Code graph MCP not picking up Node.js backend files

---

## Executive Summary

The code graph MCP **does discover** backend `.js`/`.ts` files during its scan phase. The real problem is that **backend files appear disconnected/isolated in the graph** because the JavaScript parser only tracks **relative imports** — it silently drops all non-relative imports (package imports, path aliases, absolute imports). This makes backend files look like they have no connections, giving the impression they aren't being picked up at all.

There is also a secondary issue: if your backend output lives in `dist/` or `build/`, those directories are hardcoded into the ignore list and will be completely skipped.

---

## Root Cause Analysis

### Issue 1 (Primary): JavaScript parser drops non-relative imports

**File:** `src/parsers/javascript.ts`, lines 76-89

```typescript
function addIfRelative(
  importPath: string,
  dir: string,
  sourceFile: string,
  result: Set<string>
): void {
  // Skip node_modules, absolute paths, URLs
  if (!importPath.startsWith(".") && !importPath.startsWith("..")) return;  // <-- HERE
  ...
}
```

**Every** import extracted by the parser flows through `addIfRelative()`, which immediately returns (discards the import) if the path doesn't start with `.` or `..`.

**What this drops in a typical Node.js backend:**

| Import Style | Example | Tracked? |
|---|---|---|
| Relative | `import { db } from './db'` | Yes |
| Relative (parent) | `import { auth } from '../middleware/auth'` | Yes |
| Package/bare specifier | `import express from 'express'` | No |
| TypeScript path alias | `import { User } from '@/models/User'` | No |
| Absolute path | `import { config } from '/src/config'` | No |
| Monorepo workspace | `import { shared } from '@myapp/shared'` | No |

Node.js backends tend to use **path aliases** (`@/`, `@src/`, etc.) and **barrel exports** through `index.ts` files more heavily than frontends. If the backend project uses TypeScript path aliases configured in `tsconfig.json` (e.g., `"paths": { "@/*": ["src/*"] }`), then **every aliased import between backend files is invisible to the graph**.

### Issue 2 (Secondary): Hardcoded directory exclusions

**File:** `src/graph.ts`, lines 48-60

```typescript
const IGNORE_PATTERNS = [
  "**/node_modules/**",
  "**/.git/**",
  "**/dist/**",      // <-- Backend build output often lives here
  "**/build/**",     // <-- Backend build output often lives here
  ...
];
```

If the user is pointing the scanner at a directory where the backend has been compiled to `dist/` or `build/`, those files will be entirely excluded from discovery. This is generally correct behavior (you want source, not compiled output), but it's worth noting.

### Issue 3: Python parser has regex bugs that could cause silent failures

**File:** `src/parsers/python.ts`, lines 32 and 42

```typescript
const absoluteFromImport = /^from\s+([\w][[\w.]*)\s+import\s+/gm;
//                                      ^^ malformed character class: [[\w.]
const directImport = /^import\s+([\w][[\w.,\s]*)/gm;
//                                     ^^ malformed character class: [[\w.,\s]
```

Both regexes contain `[[\w.` which is a malformed character class (unescaped `[` inside `[]`). While JavaScript's regex engine may tolerate this, the behavior is implementation-dependent and may cause some absolute Python imports to be silently missed.

---

## How the Scan Pipeline Works

```
1. discoverFiles()          -- glob for *.js, *.ts, etc.
   ✅ Backend files ARE found here

2. First pass: create nodes -- FileNode for every discovered file
   ✅ Backend files ARE added as nodes

3. Second pass: parse deps  -- run language-specific parser on each file
   ⚠️ parseJavaScriptDependencies() extracts imports via regex
   ❌ addIfRelative() DROPS anything that isn't ./  or ../

4. Filter valid deps        -- rawDeps.filter(dep => nodes.has(dep))
   ⚠️ Even if non-relative imports survived, they'd be filtered
      here because bare specifiers like 'express' won't match
      any absolute file path in the nodes map
```

**Net result:** Backend files exist in the graph as **isolated nodes** (0 dependencies, 0 dependents), making them appear missing from any dependency/impact/subgraph query.

---

## How to Verify

Run `codegraph_scan` on your project, then:

1. **`codegraph_list_files` with `language: "javascript"` or `language: "typescript"`**
   - If backend files appear here, they ARE discovered (Issue 1 is confirmed)
   - If they don't appear, check if they're in `dist/` or `build/` (Issue 2)

2. **`codegraph_get_dependencies` on a backend file**
   - If it returns `dependencyCount: 0` despite the file clearly having imports, Issue 1 is confirmed

3. **`codegraph_get_stats`**
   - Check `mostConnected` and `mostDependedOn` — backend files will likely be absent from these lists

---

## Recommended Fixes

### Fix 1: Support TypeScript path alias resolution (High Impact)

Read `tsconfig.json` `compilerOptions.paths` and `baseUrl` to resolve aliased imports. This would catch `@/models/User` → `src/models/User.ts` etc.

**Where to change:** `src/parsers/javascript.ts` — add a `resolveAliasImport()` function alongside `addIfRelative()`, and update `parseJavaScriptDependencies()` to attempt alias resolution before discarding non-relative imports.

### Fix 2: Support `baseUrl` resolution (Medium Impact)

TypeScript projects often set `"baseUrl": "src"` allowing `import { db } from 'db'` without `./`. The parser should attempt resolution relative to `baseUrl` for non-relative, non-package imports.

**Where to change:** Same as Fix 1 — `src/parsers/javascript.ts`.

### Fix 3: Make ignore patterns configurable (Low Impact)

Allow users to pass custom ignore patterns or override the defaults via the `codegraph_scan` tool's input schema.

**Where to change:** `src/graph.ts` `discoverFiles()` and `src/index.ts` `codegraph_scan` tool registration.

### Fix 4: Fix Python parser regex bugs (Low Impact)

Replace `[[\w.]` with `[\w.]` in the two regex patterns in `src/parsers/python.ts`.

---

## Files Referenced

| File | Lines | Issue |
|---|---|---|
| `src/parsers/javascript.ts` | 76-89 | `addIfRelative()` drops non-relative imports |
| `src/graph.ts` | 48-60 | Hardcoded `IGNORE_PATTERNS` exclude `dist/` and `build/` |
| `src/graph.ts` | 134-135 | `validDeps` filter further removes unresolved paths |
| `src/parsers/python.ts` | 32, 42 | Malformed regex character classes |
