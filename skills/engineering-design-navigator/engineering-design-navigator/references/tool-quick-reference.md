# Tool Quick Reference

All 16 Design Navigator MCP tools with parameters and return values.

---

## Project Management

### `open_project(name, display_name?)`

**When:** Once per session, after CORE-Memory orientation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| name | string | yes | Unique project identifier (e.g., "jet-engine") |
| display_name | string | no | Human-readable name. Only needed on first creation. |

**Returns:** Project phase and metadata. Stats (total nodes, tentative/invalidated/needs-review counts, open branches, failing constraints). All flagged nodes with component, name, status, reason. Open branches with trigger descriptions. Creates the project if it doesn't exist.

### `promote_project(name, target_phase)`

**When:** Project is ready to advance phases.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| name | string | yes | Project identifier |
| target_phase | enum | yes | `design` or `build_ready` |

**Returns on success:** Phase promoted, summary of what was verified.
**Returns on failure:** Every blocker organized by category — unverified parts, calcs without scripts, assumptions without bounds, needs_review nodes with edge chains, failing constraints with values, open branches. Each item specific and actionable.

---

## Node Operations

### `record_decision(project, component, name, type, properties, rationale, ...)`

**When:** Every time a design decision is made.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| project | string | yes | Project identifier |
| component | string | yes | Logical grouping (e.g., "gear_pump") |
| name | string | yes | Decision name (e.g., "gear_spec") |
| type | enum | yes | `part_selection`, `calculated_value`, `assumption`, `requirement` |
| properties | object | yes | Key-value map. Each value: `{value, unit, confidence, source, verified_at}` |
| rationale | string | yes | Why this decision was made |

**Optional by type:**

| Type | Parameter | Description |
|------|-----------|-------------|
| part_selection | catalog_link | URL to catalog listing |
| part_selection | operating_limits | `{limit_name: {rated, application, unit}}` |
| calculated_value | script_ref | Path to calculation script |
| assumption | uncertainty | Bounds string (e.g., "±20%") |

**Returns:** Six-section response — storage confirmation, enforcement warnings/gates, value conflicts, cascade of flagged downstream nodes, constraint evaluation results, relevant resources (2-3).

Creates if new, updates if existing.

### `get_decision(project, component, name)`

**When:** Before recording (check what exists), reviewing a decision, or reading a value from the graph.

| Parameter | Type | Required |
|-----------|------|----------|
| project | string | yes |
| component | string | yes |
| name | string | yes |

**Returns:** All properties with values/units/confidence/source/verified_at. Rationale. Status. Full change log. Upstream and downstream edges. Constraints involving this node with status. Relevant resources (2-3).

### `query_decisions(project, filters)`

**When:** Finding decisions by status, type, component, confidence, or modification date.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| project | string | yes | Project identifier |
| filters | object | yes | Any combination of the filter fields below |

**Filter fields:** `component` (string), `status` (enum: tentative/invalidated/needs_review/resolved), `type` (enum: part_selection/calculated_value/assumption/requirement), `unverified` (boolean), `modified_since` (datetime), `confidence` (enum: verified/calculated/estimated/assumed).

**Returns:** Summary list (not full nodes): component, name, type, status, one-line reason.

### `get_component_summary(project, component)`

**When:** Starting work on a component, reviewing component state.

| Parameter | Type | Required |
|-----------|------|----------|
| project | string | yes |
| component | string | yes |

**Returns:** All nodes with statuses (summary level). All edges in/out. All constraints with status. All resources tagged to this component. Resolved/tentative/invalidated/needs-review counts.

---

## Dependency Operations

### `set_dependency(project, from_node, from_property, to_node, to_property)`

**When:** After recording decisions that depend on each other.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| project | string | yes | Project identifier |
| from_node | string | yes | Upstream node ID |
| from_property | string | yes | Upstream property key |
| to_node | string | yes | Downstream node ID |
| to_property | string | yes | Downstream property key |

**Returns:** Confirmation. Chain depth. Warning if circular dependency (modeling error).

### `get_cascade(project, node, property)`

**When:** BEFORE changing a property — to see the blast radius.

| Parameter | Type | Required |
|-----------|------|----------|
| project | string | yes |
| node | string | yes |
| property | string | yes |

**Returns:** Full downstream tree — each node/property that would be flagged `needs_review`, with current value, status, edge path back to queried property, and whether it has further dependents.

---

## Constraint Operations

### `register_constraint(project, name, description, involved_properties, condition, validation_type, validation_expression)`

**When:** A physical relationship between nodes is identified that should be checked automatically.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| project | string | yes | Project identifier |
| name | string | yes | Human-readable name |
| description | string | yes | What it checks and why |
| involved_properties | array | yes | `[{node, property}, ...]` |
| condition | string | yes | When it applies, or `"always"` |
| validation_type | enum | yes | `numeric` or `manual` |
| validation_expression | string | yes | Arithmetic expression (numeric) or check description (manual) |

**Returns:** Confirmation. Immediate evaluation result (passing/failing/condition_not_met). Current values of all input properties.

### `check_constraints(project, component?)`

**When:** Reviewing constraint health.

| Parameter | Type | Required |
|-----------|------|----------|
| project | string | yes |
| component | string | no |

**Returns:** Each constraint with name, status, description. For failures: current values and what's wrong. For manual: description and values for Claude to evaluate.

---

## Branch Operations

### `start_branch(project, trigger_description, category, main_line_position)`

**When:** Design hits a dead end requiring a detour.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| project | string | yes | Project identifier |
| trigger_description | string | yes | What caused the branch |
| category | enum | yes | `part_not_found`, `operating_limit_exceeded`, `geometric_interference`, `manufacturing_constraint`, `dependency_conflict` |
| main_line_position | string | yes | Bookmark of current main-line state |

**Returns:** Branch ID. Category. Main line position bookmarked. Any already-flagged nodes relevant to the trigger.

### `resolve_branch(project, branch_id, resolution_summary)`

**When:** Branch work complete, ready to close.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| project | string | yes | Project identifier |
| branch_id | string | yes | Branch to resolve |
| resolution_summary | string | yes | What was decided and why |

**Returns on success:** Branch closed. Diff from pre-branch: nodes changed, property values old → new, summary.
**Returns on failure:** Resolution blocked. Outstanding items: invalidated nodes not re-resolved, unwalked cascades, failing constraints on affected nodes.

### `get_branches(project, status?)`

**When:** Reviewing branch history or checking open branches.

| Parameter | Type | Required |
|-----------|------|----------|
| project | string | yes |
| status | enum | no |

**Status values:** `open`, `resolved`, `all` (default).
**Returns:** Each branch with ID, trigger, category, timestamps, affected nodes, resolution summary (if resolved).

---

## Resource Operations

### `register_resource(project, component, type, name, path_or_url, description)`

**When:** A relevant document, calculator, catalog, lesson, or datasheet is created or discovered.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| project | string | yes | Project identifier |
| component | string | yes | Which component it's relevant to |
| type | enum | yes | `calculator`, `reference_document`, `catalog_source`, `lesson_learned`, `datasheet` |
| name | string | yes | Human-readable name |
| path_or_url | string | yes | File path or URL |
| description | string | yes | What it is and when it's useful |

**Returns:** Confirmation. Resource count for the component.

### `get_resources(project, component?, type?)`

**When:** Full resource list needed beyond what's passively surfaced.

| Parameter | Type | Required |
|-----------|------|----------|
| project | string | yes |
| component | string | no |
| type | enum | no |

**Returns:** Full resource list matching filters.

---

## Session Utility

### `get_session_handoff(project)`

**When:** End of session, before CORE-Memory ingestion.

| Parameter | Type | Required |
|-----------|------|----------|
| project | string | yes |

**Returns:** Decisions made/modified this session (timestamps vs. open_project call). Property diffs (old/new with reasons). Branches opened/resolved. All open items. Unverified items. Failing constraints with values. Suggested next priorities (upstream blockers first).
