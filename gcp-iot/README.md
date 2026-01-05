# GCP IoT Plugin for Claude Code

Comprehensive Google Cloud Platform IoT development toolkit for debugging, building, and deploying ESP32 sensor systems with Cloud Run backends, Pub/Sub messaging, and Firebase frontends.

## Features

### Specialized Agents

| Agent | Purpose |
|-------|---------|
| `iot-telemetry-tracer` | End-to-end tracing from ESP32 → Cloud Run → Pub/Sub → Frontend |
| `cloud-run-debugger` | Backend API debugging, log analysis, deployment issues |
| `pubsub-inspector` | Pub/Sub message flow, subscription health, dead letters |
| `websocket-debugger` | Websocket/realtime connection debugging |
| `esp32-diagnostics` | ESP32 firmware, WiFi, HTTPS troubleshooting |
| `gcp-architect` | Architecture review and optimization recommendations |

### Commands

| Command | Description |
|---------|-------------|
| `/gcp:diagnose` | Run comprehensive diagnostic across all layers |
| `/gcp:trace` | Trace telemetry end-to-end |
| `/gcp:logs <service>` | Fetch and analyze GCP logs |
| `/gcp:deploy <target>` | Deploy to Cloud Run or Firebase |
| `/gcp:status` | Quick health check of all services |
| `/gcp:pubsub <action>` | Inspect Pub/Sub topics and subscriptions |
| `/gcp:test-sensor` | Simulate ESP32 telemetry to test pipeline |
| `/gcp:websocket` | Debug websocket connections |

### Skills

- **GCP IoT Patterns**: Architecture patterns and best practices
- **Cloud Run Debugging**: Troubleshooting techniques for Cloud Run
- **Pub/Sub Troubleshooting**: Message delivery debugging guide
- **ESP32 GCP Integration**: Sensor-to-cloud integration patterns

## Installation

### From Claude Armory Marketplace

```
/plugin marketplace add Maxcogar/claude-armory
/plugin install gcp-iot@claude-armory
```

### Manual Installation

Clone and install locally:
```
git clone https://github.com/Maxcogar/claude-armory.git
/plugin install ./claude-armory/gcp-iot
```

## Prerequisites

1. **Google Cloud SDK**: Install from https://cloud.google.com/sdk/docs/install
2. **Authentication**: Run `gcloud auth login`
3. **Project**: Set default project with `gcloud config set project YOUR_PROJECT_ID`
4. **Firebase CLI** (optional): `npm install -g firebase-tools && firebase login`

## Quick Start

### Check System Status
```
/gcp:status --project your-project-id
```

### Run Diagnostics
```
/gcp:diagnose
```

### Trace Telemetry (Your Current Issue)
```
/gcp:trace --device esp32-001
```

### Test the Pipeline
```
/gcp:test-sensor --endpoint https://your-service.run.app
```

## Typical Debugging Workflow

1. **Check Status**: `/gcp:status` - See overall health
2. **Run Trace**: `/gcp:trace` - Follow data through pipeline
3. **Check Logs**: `/gcp:logs errors` - Find error messages
4. **Test Pipeline**: `/gcp:test-sensor` - Inject test data
5. **Debug Layer**: Use specific agent for problematic layer

## Architecture Supported

```
ESP32 Sensors ──HTTPS──► Cloud Run API ──► Pub/Sub Topic
                                               │
                         ┌─────────────────────┼─────────────────────┐
                         │                     │                     │
                         ▼                     ▼                     ▼
                   Push to              Cloud Function         BigQuery
                   WebSocket                  │               (optional)
                   Service                    │
                         │                    ▼
                         │              Firestore
                         │                    │
                         └────────────────────┘
                                   │
                                   ▼
                            React Frontend
                            (Firebase Hosting)
```

## Common Issues This Plugin Helps Debug

### "Sensor Not Detected"
Even though backend receives telemetry:
- Check Pub/Sub subscription configuration
- Verify push endpoint is correct
- Test websocket connection
- Check frontend event listeners

### Cold Start Latency
```
/gcp:logs cloud-run --service your-api
```

### Messages Not Delivered
```
/gcp:pubsub describe your-subscription
```

### WebSocket Disconnections
```
/gcp:websocket --check-code
```

## Configuration

### Project Settings

Create `.claude/gcp-iot.local.md` in your project for persistent settings:

```yaml
---
project_id: your-project-id
region: us-central1
services:
  api: your-api-service
  websocket: your-ws-service
topics:
  telemetry: telemetry-topic
subscriptions:
  frontend: telemetry-frontend-push
---
```

### Environment Variables

The plugin uses your gcloud CLI authentication. Ensure:
- `gcloud auth list` shows your account
- `gcloud config get-value project` returns your project

## Tips

1. **Always check authentication first**: The SessionStart hook will remind you
2. **Use trace for mystery issues**: When data "disappears", trace it
3. **Check all layers**: Issues often span multiple services
4. **Test with injected data**: `/gcp:test-sensor` bypasses ESP32 to test backend

## Troubleshooting the Plugin

If commands aren't working:
1. Verify gcloud is installed: `gcloud version`
2. Verify authentication: `gcloud auth list`
3. Check project: `gcloud config get-value project`

## Version

1.0.0

## Author

Created for GCP IoT development with ESP32 sensors, Cloud Run backends, and Firebase frontends.
