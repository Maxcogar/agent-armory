# Pattern: Adding a New React Component

## Import Style
Use relative imports (`../`) for project files.

## Rules
- Use custom hooks for all API calls — never use fetch/axios directly in a component
- Handle loading, error, and data states explicitly
- Use the project's routing solution for navigation
- Subscribe to WebSocket events via `useWSSubscription` when data can change in real-time
- Never update state directly from WebSocket payloads — always refetch from API

## Component Template

```jsx
import { use[Resource] } from '../hooks/use[Resource]';
import { useWSSubscription } from '../hooks/useWSSubscription';

export default function [Component]() {
  const { data, loading, error, refetch } = use[Resource]();

  useWSSubscription((payload) => {
    if (payload.event === '[resource_updated]') {
      refetch();
    }
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {/* Render data */}
    </div>
  );
}
```

## Hook Template

```javascript
import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../api/client';

export function use[Resource](id) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const result = await apiFetch(`/api/[resources]${id ? `/${id}` : ''}`);
      setData(result);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
```
