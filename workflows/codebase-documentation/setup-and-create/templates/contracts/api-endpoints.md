# API Endpoints Contract

**Last Updated**: [DATE]
**Backend**: `[server/src/routes/*.js]`
**Frontend**: `[client/src/hooks/*.js]` + `[client/src/api/client.js]`

---

## Overview

[Brief description of the API. What does it expose? Who consumes it?]

**Base URL (dev)**: `http://localhost:[PORT]`
**Base URL (proxied)**: `http://localhost:[CLIENT_PORT]/api` -> proxies to `:[PORT]/api`

---

## Global Conventions

### Request Headers
- `Content-Type: application/json` (for POST/PUT/PATCH)
- `[X-Custom-Header]`: [description if applicable]

### Response Format

**Success**:
```json
{ /* resource data */ }
```

**Error** (4xx/5xx):
```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE"
}
```

### Timestamps
All timestamps in ISO 8601 format.

---

## Health

### GET `/api/health`

**Description**: Health check endpoint

**Response**: `200 OK`
```json
{
  "status": "ok",
  "timestamp": "[ISO8601]"
}
```

**Implementation**: `[file path]`

---

## [Resource Group 1 — e.g. Projects]

### GET `/api/[resources]`

**Description**: List all [resources]

**Response**: `200 OK`
```json
[
  {
    "id": "uuid",
    "[field1]": "[value]",
    "[field2]": "[value]",
    "created_at": "[ISO8601]",
    "updated_at": "[ISO8601]"
  }
]
```

**Implementation**: `[file path]`
**Frontend Hook**: `[hooks/useResources.js]`

---

### GET `/api/[resources]/:id`

**Description**: Get a single [resource] by ID

**Path Params**:
- `id`: string (UUID)

**Response**: `200 OK` or `404 Not Found`

**Implementation**: `[file path]`

---

### POST `/api/[resources]`

**Description**: Create a new [resource]

**Request Body**:
```json
{
  "[field1]": "[required]",
  "[field2]": "[optional]"
}
```

**Required Fields**: `[field1]`

**Response**: `201 Created` ([resource] object)

**Side Effects**:
- Emits WebSocket event: `[resource_created]`
- [Other side effects]

**Implementation**: `[file path]`

---

### PATCH `/api/[resources]/:id`

**Description**: Update a [resource]

**Request Body** (all fields optional):
```json
{
  "[field1]": "[new value]",
  "[field2]": "[new value]"
}
```

**Response**: `200 OK`

**Side Effects**:
- Emits WebSocket event: `[resource_updated]`

**Implementation**: `[file path]`

---

### DELETE `/api/[resources]/:id`

**Description**: Delete a [resource]

**Response**: `200 OK`
```json
{ "success": true }
```

**Side Effects**:
- Emits WebSocket event: `[resource_deleted]`
- [Cascade deletes if applicable]

**Implementation**: `[file path]`

---

## [Resource Group 2 — e.g. Tasks]

<!-- Repeat the pattern above for each resource group -->

---

## Error Handling

### Common HTTP Status Codes

- `200 OK` - Success (GET, PATCH, PUT)
- `201 Created` - Resource created (POST)
- `400 Bad Request` - Validation error (missing required field)
- `404 Not Found` - Resource doesn't exist
- `422 Unprocessable Entity` - Business rule violation (e.g. state machine)
- `500 Internal Server Error` - Server error (check logs)

### [State Machine / Business Rule Errors] (if applicable)

Example error response (422):
```json
{
  "valid": false,
  "error": "Cannot move from \"[state1]\" to \"[state3]\"",
  "code": "INVALID_TRANSITION",
  "from": "[state1]",
  "to": "[state3]",
  "allowed": ["[state2]"],
  "missing_fields": []
}
```

---

## Endpoint-to-File Map

| Endpoint | Backend File | Frontend Consumer |
|----------|--------------|-------------------|
| `GET /api/health` | `[server/src/index.js]` | - |
| `GET /api/[resources]` | `routes/[resource].js` | `hooks/use[Resource].js` |
| `POST /api/[resources]` | `routes/[resource].js` | `components/[Resource]CreateForm.jsx` |
| `GET /api/[resources]/:id` | `routes/[resource].js` | `hooks/use[Resource].js` |
| `PATCH /api/[resources]/:id` | `routes/[resource].js` | `components/[Resource]Detail.jsx` |
| `DELETE /api/[resources]/:id` | `routes/[resource].js` | - |

---

## Testing Endpoints

### Using curl

```bash
# Health check
curl http://localhost:[PORT]/api/health

# List resources
curl http://localhost:[PORT]/api/[resources]

# Create resource
curl -X POST http://localhost:[PORT]/api/[resources] \
  -H "Content-Type: application/json" \
  -d '{"[field1]":"[value]"}'

# Update resource
curl -X PATCH http://localhost:[PORT]/api/[resources]/<uuid> \
  -H "Content-Type: application/json" \
  -d '{"[field1]":"[new_value]"}'
```
