---
name: gcp:trace
description: Trace telemetry data flow end-to-end from ESP32 through Cloud Run, Pub/Sub, to Frontend
argument-hint: "[--device <device-id>] [--time <minutes>]"
allowed-tools:
  - Bash
  - Read
  - Grep
  - Task
---

# Telemetry Trace Command

Trace the flow of telemetry data through the entire pipeline to identify where data is being lost or delayed.

## What This Command Does

1. **Identify Recent Messages** - Find telemetry from specific device or time range
2. **Trace Through Cloud Run** - Find the incoming request and response
3. **Trace Through Pub/Sub** - Verify message was published and delivered
4. **Check Frontend Delivery** - Verify websocket/push delivery
5. **Generate Flow Diagram** - Visual representation of data flow

## Execution Steps

### Step 1: Parse Arguments
- `--device`: Optional device ID to filter by
- `--time`: Minutes to look back (default: 30)
- `--project`: GCP project ID (ask if not provided)

### Step 2: Trace Cloud Run Ingestion

```bash
# Find incoming telemetry requests
gcloud logging read "resource.type=cloud_run_revision AND httpRequest.requestMethod=POST AND timestamp>=\"$(date -u -d '[TIME] minutes ago' '+%Y-%m-%dT%H:%M:%SZ')\"" \
  --project=[PROJECT_ID] \
  --limit=20 \
  --format="table(timestamp,httpRequest.status,httpRequest.latency,textPayload)"
```

If `--device` provided:
```bash
gcloud logging read "resource.type=cloud_run_revision AND textPayload:[DEVICE_ID]" \
  --project=[PROJECT_ID] \
  --limit=10
```

### Step 3: Trace Pub/Sub Publishing

```bash
# Check Pub/Sub publish logs
gcloud logging read "resource.type=pubsub_topic AND timestamp>=\"$(date -u -d '[TIME] minutes ago' '+%Y-%m-%dT%H:%M:%SZ')\"" \
  --project=[PROJECT_ID] \
  --limit=20

# Check subscription delivery
gcloud logging read "resource.type=pubsub_subscription" \
  --project=[PROJECT_ID] \
  --limit=20
```

### Step 4: Pull Sample Message (Optional)

If backlog exists:
```bash
# Pull without acking to inspect message content
gcloud pubsub subscriptions pull [SUBSCRIPTION_NAME] \
  --project=[PROJECT_ID] \
  --limit=1 \
  --format=json
```

### Step 5: Check Push Delivery (if push subscription)

```bash
# Push delivery logs
gcloud logging read "resource.type=pubsub_subscription AND resource.labels.subscription_id=[SUBSCRIPTION_NAME] AND textPayload:push" \
  --project=[PROJECT_ID] \
  --limit=10
```

### Step 6: Generate Trace Report

```
## Telemetry Trace Report

### Query Parameters
- Device: [device-id or "all"]
- Time Range: Last [N] minutes
- Project: [project-id]

### Data Flow Trace

#### 1️⃣ ESP32 → Cloud Run
| Timestamp | Device | Status | Latency |
|-----------|--------|--------|---------|
| [time] | [device] | ✅ 200 | 45ms |

**Verdict**: ✅ Cloud Run receiving telemetry

#### 2️⃣ Cloud Run → Pub/Sub
| Timestamp | Topic | Message ID |
|-----------|-------|------------|
| [time] | [topic] | [msg-id] |

**Verdict**: ✅ Messages being published

#### 3️⃣ Pub/Sub → Subscriber
| Subscription | Type | Delivery Status |
|--------------|------|-----------------|
| [sub-name] | PUSH | ✅ Delivered |

**Verdict**: [Status based on findings]

### Flow Visualization

```
ESP32 ──200 OK──▶ Cloud Run ──Published──▶ Pub/Sub ──Push──▶ Frontend
  ✅              ✅                        ✅              [?]
```

### Issues Found
- [Any issues identified during trace]

### Recommended Actions
1. [Actions to resolve issues]
```

## Example Usage

```
/gcp:trace
/gcp:trace --device esp32-001
/gcp:trace --time 60 --project my-project
```
