# Agent Instructions

## Before Making Changes

1. Always check `ARCHITECTURE.yml` before modifying any file
2. Review the dependency map to understand import relationships
3. Check the constraints section for rules that apply to the file you're editing

## Code Patterns

### Backend
- See `docs/patterns/api-endpoints.md` for the pattern to add new API endpoints
- All routes use the middleware stack: `auth`, `validate(schema)`, `handler`
- All responses follow: `{ success: true/false, data/error: ... }`
- Business logic belongs in `services/`, not in route handlers
- Database access belongs in `models/` and `services/`, never in routes

### Frontend
- See `docs/patterns/react-components.md` for the pattern to add new components
- Use custom hooks (`useAuth`, `useApi`) for all API interactions
- Never use `fetch()` or `axios` directly in components
- Import from `@/hooks/`, `@/services/`, `@/components/` paths

## Architecture Rules
- Routes -> Services -> Models (never skip layers)
- Middleware is applied at the route level
- Frontend components use hooks, hooks use services
- See ARCHITECTURE.yml for the full constraint list
