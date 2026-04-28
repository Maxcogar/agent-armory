# Database Schema Contract

**Last Updated**: [DATE]
**File**: `[server/src/db/schema.js]`
**Database**: [SQLite / PostgreSQL / etc.] (`[db_filename_or_connection]`)

---

## Overview

[Brief description of the database. File location, engine, migration approach.]

**Location**: [Where the DB file lives, or connection string approach]
**Engine**: [DB engine + driver library]
**Migration Strategy**: [How migrations are handled]

---

## Table: `[table_name]`

[What this table stores. One sentence.]

### Schema

```sql
CREATE TABLE [table_name] (
  id TEXT PRIMARY KEY,
  [field1] TEXT NOT NULL,
  [field2] TEXT,
  [field3] TEXT NOT NULL CHECK([field3] IN ('[val1]','[val2]')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Optional index:
CREATE INDEX idx_[table_name]_[field] ON [table_name]([field]);
```

### Fields

| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | TEXT | NO | - | UUID primary key |
| `[field1]` | TEXT | NO | - | [Description] |
| `[field2]` | TEXT | YES | NULL | [Description] |
| `[field3]` | TEXT | NO | - | One of: `[val1]`, `[val2]` |
| `created_at` | TEXT | NO | NOW | ISO 8601 timestamp |
| `updated_at` | TEXT | NO | NOW | ISO 8601 timestamp |

---

## Table: `[table_name_2]`

[What this table stores.]

### Schema

```sql
CREATE TABLE [table_name_2] (
  id TEXT PRIMARY KEY,
  [parent_id] TEXT NOT NULL REFERENCES [table_name](id),
  [status] TEXT NOT NULL DEFAULT '[default_status]'
    CHECK([status] IN ('[s1]','[s2]','[s3]')),
  [json_field] TEXT DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_[table_name_2]_[parent_id] ON [table_name_2]([parent_id]);
```

### Fields

| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | TEXT | NO | - | UUID primary key |
| `[parent_id]` | TEXT | NO | - | Foreign key to [table_name] |
| `[status]` | TEXT | NO | `'[default]'` | Current state |
| `[json_field]` | TEXT | NO | `'[]'` | JSON array (stored as TEXT) |
| `created_at` | TEXT | NO | NOW | Creation timestamp |
| `updated_at` | TEXT | NO | NOW | Last update timestamp |

### JSON Fields

Fields that store JSON as TEXT:

**`[json_field]`**: Array of [items]
```json
["item1", "item2"]
```

**`[notes_field]`**: Array of note objects
```json
[
  {
    "text": "Note content",
    "timestamp": "[ISO8601]",
    "author": "[actor-id]"
  }
]
```

---

## [Repeat for additional tables]

---

## Database Connection

File: `[server/src/db/connection.js]`

```javascript
import Database from 'better-sqlite3'; // or your driver

const db = new Database('[db_filename]');
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export default db;
```

**Configuration**:
- **WAL mode**: Write-Ahead Logging for better concurrency (SQLite)
- **Foreign keys**: Enabled explicitly (SQLite default is OFF)

---

## Query Modules

| Table | Module | Key Functions |
|-------|--------|---------------|
| `[table1]` | `db/[table1].js` | `create[Table1]`, `getAll[Table1]`, `get[Table1]ById`, `update[Table1]`, `delete[Table1]` |
| `[table2]` | `db/[table2].js` | `create[Table2]`, `get[Table2]ById`, `get[Table2]sBy[Parent]`, `update[Table2]` |

---

## Schema Initialization & Migrations

File: `[server/src/db/schema.js]`
Function: `initSchema(db)`
**Called from**: `[server/src/index.js]` on server startup

**Migrations** (run automatically, idempotent):
1. [Migration 1 description]
2. [Migration 2 description]

---

## Files That Depend on Schema

| File | Dependents |
|------|------------|
| `[server/src/db/connection.js]` | [N] files |
| `[server/src/db/[table].js]` | [N] files |

---

## Modifying the Schema

### Adding a Field

1. **Update schema.js**: Add field to `CREATE TABLE` statement
2. **Add migration**: `ALTER TABLE` in `initSchema()` with try/catch
3. **Update query modules**: Add field to INSERT/UPDATE statements
4. **Update API contracts**: Document new field in `docs/contracts/api-endpoints.md`
5. **Update this doc**: Add field to the table above

### Changing Constraints

**WARNING**: SQLite doesn't support `ALTER TABLE` for constraints.

To change constraints:
1. Create new table with updated schema
2. Copy data from old table
3. Drop old table
4. Rename new table
5. Recreate indexes
