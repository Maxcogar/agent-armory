---
name: gcp:test-sensor
description: Send test telemetry to verify the entire IoT pipeline is working
argument-hint: "[--device <device-id>] [--endpoint <url>]"
allowed-tools:
  - Bash
  - Read
---

# Test Sensor Command

Simulate ESP32 sensor telemetry to test the entire pipeline without needing physical hardware.

## What This Command Does

1. Send a test telemetry packet to Cloud Run (simulating ESP32)
2. Verify Cloud Run received and processed it
3. Check if Pub/Sub received the message
4. Verify frontend would receive the update
5. Report end-to-end success/failure

## Arguments

- `--device`: Device ID to simulate (default: test-device-001)
- `--endpoint`: Cloud Run API endpoint (auto-detected if not provided)
- `--project`: GCP project ID
- `--data`: Custom JSON payload

## Execution Steps

### Step 1: Detect Cloud Run Endpoint
```bash
# Find the API service URL
gcloud run services list --project=[PROJECT_ID] \
  --format="value(URL)" \
  --filter="metadata.name~api OR metadata.name~backend"
```

### Step 2: Generate Test Payload

```json
{
  "deviceId": "[DEVICE_ID]",
  "timestamp": "[ISO_TIMESTAMP]",
  "type": "test",
  "readings": {
    "temperature": 25.5,
    "humidity": 60.0,
    "pressure": 1013.25
  },
  "meta": {
    "source": "gcp-iot-plugin-test",
    "firmware": "test-1.0.0"
  }
}
```

### Step 3: Send Test Telemetry
```bash
# Send POST request to Cloud Run
curl -X POST "[ENDPOINT]/api/telemetry" \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "[DEVICE_ID]",
    "timestamp": "'$(date -Iseconds)'",
    "type": "test",
    "readings": {
      "temperature": 25.5,
      "humidity": 60.0
    }
  }' \
  -w "\n\nHTTP Status: %{http_code}\nTime: %{time_total}s\n"
```

### Step 4: Verify Cloud Run Processing
```bash
# Check Cloud Run logs for the test message
sleep 2
gcloud logging read "resource.type=cloud_run_revision AND textPayload:[DEVICE_ID] AND timestamp>=\"$(date -u -d '1 minute ago' '+%Y-%m-%dT%H:%M:%SZ')\"" \
  --project=[PROJECT_ID] \
  --limit=5
```

### Step 5: Verify Pub/Sub Delivery
```bash
# Check if message was published
gcloud logging read "resource.type=pubsub_topic AND timestamp>=\"$(date -u -d '1 minute ago' '+%Y-%m-%dT%H:%M:%SZ')\"" \
  --project=[PROJECT_ID] \
  --limit=5
```

### Step 6: Generate Report

```
## Test Sensor Report

### Test Parameters
- Device ID: [DEVICE_ID]
- Endpoint: [URL]
- Timestamp: [TIME]

### Results

#### 1️⃣ Cloud Run API
- Status: ✅ 200 OK
- Response Time: 0.15s
- Response: {"status": "received"}

#### 2️⃣ Cloud Run Processing
- Log Entry Found: ✅ Yes
- Processing Time: 12ms

#### 3️⃣ Pub/Sub Publishing
- Message Published: ✅ Yes
- Message ID: abc123

#### 4️⃣ Subscription Delivery
- Delivered: ✅ Yes / ⏳ Pending / ❌ Failed

### End-to-End Status: ✅ SUCCESS

### Test Payload Sent
```json
{
  "deviceId": "test-device-001",
  "temperature": 25.5,
  ...
}
```

### What to Check on Frontend
1. Open browser DevTools → Network → WS
2. Look for incoming message with deviceId: [DEVICE_ID]
3. Check React state for updated sensor data
```

## Troubleshooting

If test fails at any stage:

| Stage | Failure | Likely Cause |
|-------|---------|--------------|
| Cloud Run | Connection refused | Wrong URL or service down |
| Cloud Run | 401/403 | Authentication required |
| Cloud Run | 500 | Backend error (check logs) |
| Pub/Sub | Not published | Cloud Run not publishing |
| Delivery | Not delivered | Push endpoint failing |

## Example Usage

```
/gcp:test-sensor
/gcp:test-sensor --device esp32-living-room
/gcp:test-sensor --endpoint https://my-api.run.app
/gcp:test-sensor --data '{"custom": "payload"}'
```
