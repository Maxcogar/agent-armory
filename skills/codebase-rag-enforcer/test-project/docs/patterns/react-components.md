# Pattern: Adding a New React Component

## Import Style
Use `@/` for project imports.

## Rules
- Use custom hooks for API calls (never use fetch/axios directly)
- Handle loading, error, and data states
- Use the project's routing solution for navigation

## Template
```jsx
import { useApi } from '@/hooks/useApi';

export default function MyComponent() {
  const { data, loading, error, execute } = useApi(apiCall);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  return <div>{/* Render data */}</div>;
}
```
