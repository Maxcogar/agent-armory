---
name: gcp:logs
description: Fetch and analyze GCP logs for Cloud Run, Pub/Sub, and other services
argument-hint: "<service> [--severity <level>] [--limit <n>] [--since <duration>]"
allowed-tools:
  - Bash
  - Read
---

# GCP Logs Command

Fetch and analyze logs from GCP services with smart filtering and analysis.

## Arguments

- `<service>`: Required. One of: cloud-run, pubsub, all, errors
- `--severity`: Log level filter (DEBUG, INFO, WARNING, ERROR, CRITICAL)
- `--limit`: Number of logs to fetch (default: 50)
- `--since`: Time range (e.g., "1h", "30m", "1d"). Default: 1h
- `--service-name`: Specific Cloud Run service name
- `--project`: GCP project ID

## Execution Steps

### Step 1: Parse Arguments and Build Query

Map service to log filter:
- `cloud-run`: `resource.type=cloud_run_revision`
- `pubsub`: `resource.type=pubsub_topic OR resource.type=pubsub_subscription`
- `errors`: `severity>=ERROR`
- `all`: No resource filter

### Step 2: Build Time Filter

Convert `--since` to timestamp:
- `30m` → 30 minutes ago
- `1h` → 1 hour ago
- `1d` → 1 day ago

### Step 3: Execute Log Query

#### Cloud Run Logs
```bash
gcloud logging read "resource.type=cloud_run_revision AND timestamp>=\"[TIMESTAMP]\"" \
  --project=[PROJECT_ID] \
  --limit=[LIMIT] \
  --format="table(timestamp,severity,textPayload)"
```

#### With Service Filter
```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=[SERVICE_NAME] AND timestamp>=\"[TIMESTAMP]\"" \
  --project=[PROJECT_ID] \
  --limit=[LIMIT]
```

#### Pub/Sub Logs
```bash
gcloud logging read "(resource.type=pubsub_topic OR resource.type=pubsub_subscription) AND timestamp>=\"[TIMESTAMP]\"" \
  --project=[PROJECT_ID] \
  --limit=[LIMIT]
```

#### Errors Only
```bash
gcloud logging read "severity>=ERROR AND timestamp>=\"[TIMESTAMP]\"" \
  --project=[PROJECT_ID] \
  --limit=[LIMIT] \
  --format="table(timestamp,resource.type,severity,textPayload)"
```

### Step 4: Analyze and Present

Present logs in a readable format:

```
## GCP Logs: [Service]

**Time Range**: [start] to now
**Severity Filter**: [level]
**Results**: [count] logs

### Log Entries

| Time | Severity | Message |
|------|----------|---------|
| 10:45:23 | ERROR | Connection refused to database |
| 10:45:20 | INFO | Request received from 192.168.1.1 |

### Analysis

**Error Summary**:
- [Error type]: [count] occurrences
- [Error type]: [count] occurrences

**Patterns Detected**:
- [Any patterns in the logs]

**Recommendations**:
- [Based on log analysis]
```

## Smart Analysis Features

When presenting logs, look for:
1. **Error patterns** - Repeated errors
2. **Latency spikes** - Slow requests
3. **Failed requests** - 4xx/5xx status codes
4. **Authentication failures** - 401/403 errors
5. **Connection issues** - Timeouts, refused connections

## Example Usage

```
/gcp:logs cloud-run
/gcp:logs cloud-run --severity ERROR --since 2h
/gcp:logs pubsub --limit 100
/gcp:logs errors --since 1d
/gcp:logs cloud-run --service-name my-api --project my-project
```
