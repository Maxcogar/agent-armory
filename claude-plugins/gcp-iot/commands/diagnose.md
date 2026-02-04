---
name: gcp:diagnose
description: Run comprehensive diagnostic across all GCP IoT layers (ESP32, Cloud Run, Pub/Sub, Frontend)
argument-hint: "[--layer <layer>] [--project <project-id>]"
allowed-tools:
  - Bash
  - Read
  - Grep
  - Task
---

# GCP IoT Diagnostic Command

Run a comprehensive diagnostic across the entire IoT pipeline to identify issues.

## What This Command Does

1. **Check GCP Authentication** - Verify gcloud is authenticated
2. **Cloud Run Health** - Check service status and recent errors
3. **Pub/Sub Flow** - Verify topics, subscriptions, and message delivery
4. **Recent Logs** - Pull error logs from all services
5. **Connectivity Test** - Verify endpoints are reachable

## Execution Steps

### Step 1: Parse Arguments
- `--layer`: Optional filter (cloud-run, pubsub, all). Default: all
- `--project`: GCP project ID. If not provided, ask user.

### Step 2: Verify Prerequisites
```bash
# Check gcloud is installed and authenticated
gcloud auth list --filter=status:ACTIVE --format="value(account)"
```

If no active account, inform user to run `gcloud auth login`.

### Step 3: Run Layer Diagnostics

#### Cloud Run Diagnostic
```bash
# List services and their status
gcloud run services list --project=[PROJECT_ID] --format="table(SERVICE,REGION,URL,LAST_DEPLOYED)"

# Check for recent errors (last hour)
gcloud logging read "resource.type=cloud_run_revision AND severity>=ERROR AND timestamp>=\"$(date -u -d '1 hour ago' '+%Y-%m-%dT%H:%M:%SZ')\"" --project=[PROJECT_ID] --limit=10
```

#### Pub/Sub Diagnostic
```bash
# List topics and subscriptions
gcloud pubsub topics list --project=[PROJECT_ID]
gcloud pubsub subscriptions list --project=[PROJECT_ID]

# Check for unacked messages (backlog)
gcloud pubsub subscriptions describe [SUBSCRIPTION] --project=[PROJECT_ID] --format="yaml(ackDeadlineSeconds,messageRetentionDuration)"
```

#### Connectivity Test
```bash
# Test Cloud Run endpoint
curl -s -o /dev/null -w "%{http_code}" https://[SERVICE_URL]/health
```

### Step 4: Generate Report

Present findings in this format:

```
## GCP IoT Diagnostic Report

### Authentication
✅ Authenticated as: [email]
✅ Project: [project-id]

### Cloud Run Services
| Service | Region | Status | Last Deploy |
|---------|--------|--------|-------------|
| [name] | [region] | ✅ OK | [date] |

### Pub/Sub
| Topic | Subscriptions | Status |
|-------|---------------|--------|
| [topic] | [count] | ✅ OK |

### Recent Errors (Last Hour)
[List any errors found, or "No errors found"]

### Recommendations
1. [Any issues to address]
```

## Error Handling

- If gcloud not found: Inform user to install Google Cloud SDK
- If not authenticated: Guide user to run `gcloud auth login`
- If project not found: Ask user to verify project ID
- If no permissions: List required IAM roles

## Example Usage

```
/gcp:diagnose
/gcp:diagnose --project my-iot-project
/gcp:diagnose --layer cloud-run
```
