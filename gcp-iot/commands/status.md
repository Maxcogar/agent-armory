---
name: gcp:status
description: Check health and status of all GCP IoT services at a glance
argument-hint: "[--project <project-id>]"
allowed-tools:
  - Bash
---

# GCP Status Command

Quick health check of all GCP IoT services showing current status at a glance.

## What This Command Does

1. Check GCP authentication status
2. List Cloud Run services with health
3. Show Pub/Sub topics and subscriptions
4. Display recent error count
5. Show overall system health

## Execution Steps

### Step 1: Authentication Check
```bash
gcloud auth list --filter=status:ACTIVE --format="value(account)"
gcloud config get-value project
```

### Step 2: Cloud Run Services
```bash
gcloud run services list --project=[PROJECT_ID] \
  --format="table(SERVICE,REGION,LAST_DEPLOYED,URL)"
```

### Step 3: Pub/Sub Resources
```bash
# Topics
gcloud pubsub topics list --project=[PROJECT_ID] --format="value(name)"

# Subscriptions with key info
gcloud pubsub subscriptions list --project=[PROJECT_ID] \
  --format="table(name.basename(),topic.basename(),pushConfig.pushEndpoint:label=PUSH_ENDPOINT)"
```

### Step 4: Error Count (Last Hour)
```bash
gcloud logging read "severity>=ERROR AND timestamp>=\"$(date -u -d '1 hour ago' '+%Y-%m-%dT%H:%M:%SZ')\"" \
  --project=[PROJECT_ID] \
  --format="value(severity)" | wc -l
```

### Step 5: Generate Status Dashboard

```
## GCP IoT Status Dashboard

**Project**: [project-id]
**Account**: [email]
**Checked**: [timestamp]

### 🟢 Overall Health: HEALTHY / 🟡 DEGRADED / 🔴 UNHEALTHY

---

### Cloud Run Services
| Service | Region | Status | URL |
|---------|--------|--------|-----|
| api-service | us-central1 | 🟢 Running | https://... |
| ws-service | us-central1 | 🟢 Running | https://... |

### Pub/Sub
| Topic | Subscriptions | Status |
|-------|---------------|--------|
| telemetry | 2 | 🟢 OK |
| events | 1 | 🟢 OK |

### Subscriptions
| Name | Type | Endpoint/Status |
|------|------|-----------------|
| telemetry-push | PUSH | https://ws-service... |
| telemetry-pull | PULL | Active |

### Recent Activity
- Errors (1h): [count]
- Warnings (1h): [count]

---

### Quick Actions
- View logs: `/gcp:logs errors`
- Run diagnostic: `/gcp:diagnose`
- Trace telemetry: `/gcp:trace`
```

## Health Determination

**🟢 HEALTHY**:
- All Cloud Run services responding
- No errors in last hour
- Pub/Sub subscriptions active

**🟡 DEGRADED**:
- Some errors present
- High latency detected
- Subscription backlog building

**🔴 UNHEALTHY**:
- Services not responding
- High error rate
- Critical failures

## Example Usage

```
/gcp:status
/gcp:status --project my-iot-project
```
