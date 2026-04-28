# WebSocket Events Contract

**Last Updated**: [DATE]
**Event Bus**: `[server/src/events.js]`
**WS Relay**: `[server/src/ws.js]`
**Frontend Context**: `[client/src/contexts/WebSocketContext.jsx]`
**Subscription Hook**: `[client/src/hooks/useWSSubscription.js]`

---

## Overview

[Project name] uses WebSocket for real-time synchronization across all clients. When data changes on the backend, an event is emitted to the event bus, which ws.js relays to all connected WebSocket clients.

**Port**: WebSocket server runs on same port as HTTP server (`[PORT]`)
**Protocol**: `ws://`
**Path**: `/ws`

---

## Event Flow (Event Bus Pattern)

```
Route Handler -> DB Update -> bus.emit('mutation', payload) -> ws.js relays -> All WS Clients -> Refetch
```

**Critical Rules**:
- Events are emitted **AFTER** database changes succeed, never before
- Routes emit to the event bus (`bus.emit`), NEVER broadcast directly to WebSocket
- `ws.js` is the only subscriber that relays bus events to WebSocket clients

---

## Event Bus Architecture

### Backend

**`[server/src/events.js]`** - Central event bus:
```javascript
import { EventEmitter } from 'events';
const bus = new EventEmitter();
export default bus;
```

**`[server/src/ws.js]`** - WebSocket relay:
```javascript
import bus from './events.js';

export function setupWebSocket(server) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  bus.on('mutation', (payload) => {
    const message = JSON.stringify(payload);
    for (const client of wss.clients) {
      if (client.readyState === 1) {
        client.send(message);
      }
    }
  });
}
```

### Emitting Events (Route Handlers)

```javascript
import bus from '../events.js';

// After DB update in any route handler:
bus.emit('mutation', { event: '[event_name]', data: updatedResource });
```

---

## Event Registry

### `connected`

**Emitted By**: `ws.js` on new WebSocket connection
**Payload**:
```json
{
  "event": "connected",
  "data": { "timestamp": "[ISO8601]" }
}
```

---

### `[resource_created]`

**Emitted By**: POST `/api/[resources]` (after successful creation)
**File**: `[server/src/routes/[resource].js]`

**Payload**:
```json
{
  "event": "[resource_created]",
  "data": { /* full [resource] object */ }
}
```

**Listeners**: `[client files that subscribe]`
**Purpose**: Notify all clients that a new [resource] exists

---

### `[resource_updated]`

**Emitted By**:
- PATCH `/api/[resources]/:id` (after successful update)
- [Other routes that modify this resource]

**Payload**:
```json
{
  "event": "[resource_updated]",
  "data": { /* full [resource] object */ }
}
```

**Listeners**: `[client files that subscribe]`
**Purpose**: Sync [resource] changes across all clients

---

### `[resource_deleted]`

**Emitted By**: DELETE `/api/[resources]/:id` (after successful deletion)
**File**: `[server/src/routes/[resource].js]`

**Payload**:
```json
{
  "event": "[resource_deleted]",
  "data": { "[resourceId]": "uuid" }
}
```

**Listeners**: `[client files that subscribe]`
**Purpose**: Remove [resource] from views when deleted

---

<!-- Repeat for each event in your system -->

---

## Payload Structure

**ALL events include**:
- `event`: string (event name)
- `data`: object (full updated resource or minimal identifier)

---

## Frontend WebSocket System

### WebSocketContext (`[client/src/contexts/WebSocketContext.jsx]`)

Wraps the application and manages WebSocket connection:

```jsx
<WebSocketProvider>
  <App />
</WebSocketProvider>
```

### useWSSubscription Hook (`[client/src/hooks/useWSSubscription.js]`)

Components subscribe to WebSocket events:

```javascript
useWSSubscription((payload) => {
  if (payload.event === '[resource_updated]') {
    refetch[Resource]();
  }
});
```

**Features**:
- **Debounced by event name** ([N]ms) - prevents rapid-fire refetches
- Uses `useRef` for stable handler reference

---

## Frontend Refetch Pattern

**DO**: Refetch data on events

```javascript
useWSSubscription((payload) => {
  if (payload.event === '[resource_updated]') {
    refetch(); // Let API provide fresh data
  }
});
```

**DON'T**: Update state directly from payloads

```javascript
// BAD - leads to state inconsistency
useWSSubscription((payload) => {
  if (payload.event === '[resource_updated]') {
    setItems(items => items.map(i =>
      i.id === payload.data.id ? payload.data : i
    ));
  }
});
```

**Rationale**: API is source of truth. Payloads just signal "something changed, go fetch it".

---

## Adding a New Event

### Step 1: Emit from Backend

```javascript
import bus from '../events.js';

// After DB update:
bus.emit('mutation', { event: '[new_event_name]', data: updatedResource });
```

### Step 2: Subscribe in Frontend

```javascript
useWSSubscription((payload) => {
  if (payload.event === '[new_event_name]') {
    refetchData();
  }
});
```

### Step 3: Update This Doc

Add the event to the Event Registry above with:
- Event name
- Emitted by (file + route)
- Payload structure
- Listeners (files)
- Purpose

---

## Testing WebSocket Events

### Manual Test Checklist

- [ ] Trigger action that should emit event
- [ ] Check browser Network -> WS tab for message
- [ ] Verify payload has `event` and `data` fields
- [ ] Open second browser window, trigger action, verify both update
- [ ] Check debounce: rapid actions should coalesce

### Common Issues

**Event emitted but UI doesn't update**:
- Check if component subscribes via `useWSSubscription`
- Check if `payload.event` matches expected string (case-sensitive)
- Check if refetch function is actually called

**Events not being emitted**:
- Check that `bus.emit('mutation', ...)` is called AFTER the DB update
- Check server console for errors in the route handler

---

## Files That Depend on WebSocket

| File | Role |
|------|------|
| `[server/src/events.js]` | Event bus |
| `[server/src/ws.js]` | WebSocket relay |
| `[server/src/index.js]` | Initializes WebSocket with HTTP server |
| `[server/src/routes/[resource].js]` | Emits `[resource_created]`, `[resource_updated]`, `[resource_deleted]` |
| `[client/src/contexts/WebSocketContext.jsx]` | Client connection + dispatch |
| `[client/src/hooks/useWSSubscription.js]` | Subscription hook |
| `[client/src/pages/[Page].jsx]` | Subscribes to relevant events |
