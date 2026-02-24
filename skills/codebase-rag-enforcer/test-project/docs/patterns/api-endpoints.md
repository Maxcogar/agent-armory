# Pattern: Adding a New API Endpoint

## Middleware Stack
Apply in order: `auth`, `rateLimit`, `validate`

## Response Format
```json
{ "success": true, "data": { ... } }
{ "success": false, "error": "message" }
```

## Steps
1. Create/update model if needed
2. Add business logic in services layer
3. Add validation schema
4. Create route handler with middleware stack
5. Register route in main app

## Rules
- No business logic in route handlers
- All input must be validated
- Use consistent error handling
