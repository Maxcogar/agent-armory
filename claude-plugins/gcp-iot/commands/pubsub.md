---
name: gcp:pubsub
description: Inspect and manage Pub/Sub topics, subscriptions, and messages
argument-hint: "<action> [topic/subscription] [options]"
allowed-tools:
  - Bash
  - Read
---

# GCP Pub/Sub Command

Inspect and manage Pub/Sub resources for IoT telemetry.

## Actions

- `list`: List all topics and subscriptions
- `describe <name>`: Get detailed info about topic or subscription
- `pull <subscription>`: Pull messages from subscription
- `publish <topic>`: Publish a test message
- `backlog <subscription>`: Check message backlog
- `test`: End-to-end publish/subscribe test

## Execution Steps

### Action: list
```bash
echo "=== Topics ===" && \
gcloud pubsub topics list --project=[PROJECT_ID] --format="table(name.basename())" && \
echo -e "\n=== Subscriptions ===" && \
gcloud pubsub subscriptions list --project=[PROJECT_ID] \
  --format="table(name.basename(),topic.basename(),pushConfig.pushEndpoint:label=PUSH)"
```

### Action: describe
```bash
# For topic
gcloud pubsub topics describe [NAME] --project=[PROJECT_ID]

# For subscription
gcloud pubsub subscriptions describe [NAME] --project=[PROJECT_ID]
```

### Action: pull
```bash
# Pull without acknowledging (inspect only)
gcloud pubsub subscriptions pull [SUBSCRIPTION] \
  --project=[PROJECT_ID] \
  --limit=5 \
  --format=json

# Pull and acknowledge
gcloud pubsub subscriptions pull [SUBSCRIPTION] \
  --project=[PROJECT_ID] \
  --limit=5 \
  --auto-ack
```

### Action: publish
```bash
# Publish test message
gcloud pubsub topics publish [TOPIC] \
  --message='{"test": true, "timestamp": "'$(date -Iseconds)'", "source": "gcp-iot-plugin"}' \
  --project=[PROJECT_ID]
```

Output:
```
Published test message to [TOPIC]
Message ID: [id]
Timestamp: [time]

To verify delivery, check:
- For PUSH: Cloud Run logs at push endpoint
- For PULL: /gcp:pubsub pull [subscription]
```

### Action: backlog
```bash
# Get subscription metrics
gcloud pubsub subscriptions describe [SUBSCRIPTION] \
  --project=[PROJECT_ID] \
  --format="yaml(ackDeadlineSeconds,messageRetentionDuration,expirationPolicy)"

# Pull to check pending count
gcloud pubsub subscriptions pull [SUBSCRIPTION] \
  --project=[PROJECT_ID] \
  --limit=1 \
  --format="value(ackId)" | wc -l
```

### Action: test

Full end-to-end test:

```bash
# 1. Create test subscription if needed
TEST_SUB="test-sub-$(date +%s)"
gcloud pubsub subscriptions create $TEST_SUB \
  --topic=[TOPIC] \
  --project=[PROJECT_ID] \
  --expiration-period=1d

# 2. Publish test message
MSG_ID=$(gcloud pubsub topics publish [TOPIC] \
  --message='{"test": true}' \
  --project=[PROJECT_ID] \
  --format="value(messageIds)")

# 3. Pull and verify
sleep 2
gcloud pubsub subscriptions pull $TEST_SUB \
  --project=[PROJECT_ID] \
  --auto-ack

# 4. Cleanup
gcloud pubsub subscriptions delete $TEST_SUB --project=[PROJECT_ID] --quiet
```

## Output Format

### List Output
```
## Pub/Sub Resources

### Topics
| Topic | Subscriptions |
|-------|---------------|
| telemetry | 2 |
| events | 1 |

### Subscriptions
| Name | Topic | Type | Endpoint |
|------|-------|------|----------|
| telemetry-push | telemetry | PUSH | https://... |
| telemetry-pull | telemetry | PULL | - |
```

### Describe Output
```
## Subscription: telemetry-push

- **Topic**: projects/[project]/topics/telemetry
- **Type**: PUSH
- **Endpoint**: https://service.run.app/pubsub
- **Ack Deadline**: 10s
- **Retention**: 7 days
- **Dead Letter**: [topic or none]
- **Filter**: [filter or none]
```

## Example Usage

```
/gcp:pubsub list
/gcp:pubsub describe telemetry-push
/gcp:pubsub pull telemetry-pull --limit 10
/gcp:pubsub publish telemetry
/gcp:pubsub backlog telemetry-push
/gcp:pubsub test --topic telemetry
```
