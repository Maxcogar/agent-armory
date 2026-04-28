# [PROJECT_NAME] Architecture Overview

**Last Updated**: [DATE]
**System**: [PROJECT_NAME] v[VERSION]

---

## System Purpose

[One paragraph describing what this system does and who it's for.]

---

## High-Level Architecture

```
+-------------------------------------------------------------+
|                    [FRONTEND_NAME]                           |
|  +--------------+  +---------------+  +-----------------+   |
|  | UI Components|  |  Data Layer   |  |  Real-time      |   |
|  |              |--|               |--|  (WS/SSE/etc)   |   |
|  +--------------+  +---------------+  +-----------------+   |
|                            |                                 |
|                   HTTP/WS over [PORT]                        |
+----------------------------|---------------------------------+
                             |
+----------------------------|---------------------------------+
|                            v                                 |
|              [BACKEND_NAME]                                  |
|  +--------------+  +---------------+  +-----------------+   |
|  |   REST API   |  |  Business     |  |   Event Bus     |   |
|  |   Routes     |--|  Logic        |--|   + WebSocket    |   |
|  +--------------+  +---------------+  +-----------------+   |
|                            |                                 |
|                  +---------+---------+                       |
|                  |    [DATABASE]     |                       |
|                  +-------------------+                       |
+--------------------------------------------------------------+
```

---

## Technology Stack

### Frontend
- **[Framework]**: [version + purpose]
- **[Build Tool]**: [version + purpose]
- **[CSS]**: [version + purpose]
- **[Router]**: [purpose]

### Backend
- **[Server]**: [purpose]
- **[Database]**: [purpose]
- **[WS Library]**: [purpose]

### Development
- **[Dev Tools]**: [purpose]

---

## Core Components

### 1. **[Major Component/System Name]**

[Description of this component and what it does.]

**Rules**:
- [Rule 1]
- [Rule 2]

**Implementation**: `[file path]`
**Contract**: `docs/contracts/[relevant-contract].md`

---

### 2. **[State Machine / Workflow Name]**

[Description of how entities move through states.]

```
[state1] -> [state2] -> [state3] -> [final]
    |            |           |
 [blocked] <-----+-----------+
```

**Guard Conditions**:
- `[state1] -> [state2]`: Requires `[field]`
- `[state2] -> [state3]`: Requires `[field]`

**Special Rules**:
- [Rule about final states]
- [Rule about blocked/paused states]

**Implementation**: `[file path]`
**Contract**: `docs/contracts/state-machine.md`

---

### 3. **[Real-Time / Event System]**

[Description of how real-time updates work.]

**Event Flow**:
```
[Route Handler] -> [DB Update] -> [bus.emit] -> [relay] -> [All Clients] -> [Refetch]
```

**Key Events**:
- `[event_name]` - [what triggers it]
- `[event_name]` - [what triggers it]

**Implementation**:
- Event bus: `[file path]`
- WS relay: `[file path]`
- Frontend: `[file path]`

**Contract**: `docs/contracts/websocket-events.md`

---

### 4. **[Database Schema]**

[Brief description of the data model.]

**Tables**:
- **`[table1]`**: [purpose]
- **`[table2]`**: [purpose]
- **`[table3]`**: [purpose]

**Implementation**: `[file path]`
**Contract**: `docs/contracts/database-schema.md`

---

## Data Flow Patterns

### [Key Workflow 1 — e.g. Creating a Resource]

```
1. [User action]
2. [HTTP request]
3. [Server logic]
4. [DB write]
5. [Event emit]
6. [Client update]
```

### [Key Workflow 2 — e.g. Agent/Automated Action]

```
1. [Trigger]
2. [Request]
3. [Validation]
4. [Response]
```

---

## File Organization

```
[project-root]/
├── [client-dir]/               # [Frontend framework + build tool]
│   └── src/
│       ├── api/                # HTTP client wrapper
│       ├── components/         # UI components
│       ├── contexts/           # React context providers
│       ├── hooks/              # Custom data hooks
│       ├── pages/              # Route targets
│       └── utils/              # Shared utilities
│
├── [server-dir]/               # [Backend framework]
│   └── src/
│       ├── db/                 # Database connection + queries
│       ├── middleware/         # Request middleware
│       ├── routes/             # API route handlers
│       ├── [feature]/          # Feature-specific logic
│       └── index.js            # Server entry point
│
└── docs/                       # Documentation
    ├── contracts/              # API, schema, and behavior contracts
    └── patterns/               # Coding patterns for LLMs
```

---

## Design Decisions

### [Decision 1 — e.g. Why SQLite?]
- [Reason 1]
- [Reason 2]

### [Decision 2 — e.g. Why strict state machine?]
- [Reason 1]
- [Reason 2]

### [Decision 3 — e.g. Why event bus pattern?]
- [Reason 1]
- [Reason 2]

---

## Critical Invariants

These rules CANNOT be violated:

1. [Invariant 1]
2. [Invariant 2]
3. [Invariant 3]
4. [Invariant 4]

---

## Further Reading

- `docs/contracts/state-machine.md`
- `docs/contracts/websocket-events.md`
- `docs/contracts/api-endpoints.md`
- `docs/contracts/database-schema.md`
