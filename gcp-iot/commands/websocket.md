---
name: gcp:websocket
description: Debug websocket connections and realtime data flow to frontend
argument-hint: "[--service <service-name>] [--check-code]"
allowed-tools:
  - Bash
  - Read
  - Grep
  - Glob
---

# Websocket Debug Command

Debug websocket connections between the backend and React frontend.

## What This Command Does

1. Check Cloud Run websocket configuration
2. Find websocket connection code in frontend
3. Analyze connection patterns and potential issues
4. Verify Pub/Sub push configuration (if applicable)
5. Provide debugging guidance

## Arguments

- `--service`: Cloud Run service name for websocket
- `--check-code`: Analyze frontend code for websocket usage
- `--project`: GCP project ID

## Execution Steps

### Step 1: Check Cloud Run Websocket Support
```bash
# Verify service configuration
gcloud run services describe [SERVICE_NAME] --region=[REGION] \
  --format="yaml(spec.template.metadata.annotations)" \
  --project=[PROJECT_ID]

# Check for session affinity (required for socket.io)
gcloud run services describe [SERVICE_NAME] --region=[REGION] \
  --format="value(spec.template.metadata.annotations.'run.googleapis.com/sessionAffinity')" \
  --project=[PROJECT_ID]
```

### Step 2: Check Websocket Logs
```bash
# Look for websocket-related logs
gcloud logging read "resource.type=cloud_run_revision AND (textPayload:websocket OR textPayload:socket OR textPayload:upgrade OR textPayload:ws)" \
  --project=[PROJECT_ID] \
  --limit=20
```

### Step 3: Analyze Frontend Code (if --check-code)

Search for websocket patterns:
```bash
# Find websocket connections
grep -r "new WebSocket\|socket\.io\|io(\|createConnection" \
  --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" \
  [SOURCE_DIR]

# Find event handlers
grep -r "\.on\('message'\|\.on\('connect'\|\.on\('telemetry'\|onmessage" \
  --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" \
  [SOURCE_DIR]

# Find Firebase realtime
grep -r "onSnapshot\|onValue\|firebase.*realtime" \
  --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" \
  [SOURCE_DIR]
```

### Step 4: Check Pub/Sub Push Config
```bash
# If using Pub/Sub push to websocket service
gcloud pubsub subscriptions list --project=[PROJECT_ID] \
  --format="table(name.basename(),pushConfig.pushEndpoint)"
```

### Step 5: Generate Debug Report

```
## Websocket Debug Report

### Cloud Run Configuration
- Service: [name]
- Session Affinity: ✅ Enabled / ❌ Disabled (required for socket.io)
- HTTP/2: [status]

### Connection Type Detected
Based on code analysis: [socket.io / native WebSocket / Firebase Realtime]

### Frontend Code Analysis
| File | Pattern | Line |
|------|---------|------|
| App.js | socket.io connection | 45 |
| hooks/useSocket.js | event handlers | 12 |

### Potential Issues Found
1. ❌ Session affinity not enabled (required for socket.io)
2. ⚠️ No reconnection logic found
3. ⚠️ Missing error handlers

### Recommendations

#### Enable Session Affinity (if using socket.io)
```bash
gcloud run services update [SERVICE] --session-affinity --region=[REGION]
```

#### Add Reconnection Logic
```javascript
socket.on('disconnect', (reason) => {
  if (reason === 'io server disconnect') {
    socket.connect();
  }
});
```

#### Add Error Handling
```javascript
socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
  // Implement retry logic
});
```

### Browser Debugging Steps
1. Open DevTools (F12)
2. Go to Network tab → Filter by "WS"
3. Look for:
   - ✅ 101 Switching Protocols (connection success)
   - Messages being exchanged
   - Close codes if disconnecting

### Test Connection
Send test message from backend:
```bash
/gcp:test-sensor --device test-ws
```
Then verify frontend receives it.
```

## Common Issues Matrix

| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| Connection refused | Wrong URL | Check service URL |
| Immediate disconnect | No session affinity | Enable session affinity |
| Works then drops | Timeout | Implement heartbeat |
| CORS error | Missing headers | Add CORS to backend |
| 502 error | Cold start | Set min instances |

## Example Usage

```
/gcp:websocket
/gcp:websocket --service my-ws-service
/gcp:websocket --check-code
/gcp:websocket --service ws-api --check-code --project my-project
```
