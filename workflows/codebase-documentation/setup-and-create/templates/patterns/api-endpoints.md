# Pattern: Adding a New API Endpoint

## Middleware Stack
Apply in order: [list your middleware, e.g. auth, validate, agentId]

## Response Format
Follow the existing response format in the codebase. See `docs/contracts/api-endpoints.md`.

## Steps
1. Create/update DB query function in `[server/src/db/[resource].js]`
2. Add route handler in `[server/src/routes/[resource].js]`
3. Emit WebSocket event after DB write (if data changes)
4. Register route in `[server/src/index.js]` if new file
5. Create/update frontend hook in `[client/src/hooks/use[Resource].js]`
6. Update `docs/contracts/api-endpoints.md`

## Rules
- No business logic in route handlers — logic goes in service/db layer
- All input must be validated before use
- Emit WebSocket event AFTER DB update, never before
- Use consistent error handling (400 for validation, 422 for business rules, 404 for not found)
- Notes and array fields use APPEND semantics (merge, not replace)
