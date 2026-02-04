---
name: gcp:deploy
description: Deploy to Cloud Run or Firebase with validation and rollback support
argument-hint: "<target> [--source <path>] [--region <region>]"
allowed-tools:
  - Bash
  - Read
  - Glob
---

# GCP Deploy Command

Deploy applications to Cloud Run or Firebase with pre-deployment validation.

## Arguments

- `<target>`: Required. One of: cloud-run, firebase, both
- `--source`: Path to source code (default: current directory)
- `--region`: Cloud Run region (default: us-central1)
- `--service`: Cloud Run service name
- `--project`: GCP project ID
- `--no-promote`: Deploy without promoting to production (Cloud Run)

## Execution Steps

### Step 1: Pre-Deployment Validation

#### Check Authentication
```bash
gcloud auth list --filter=status:ACTIVE --format="value(account)"
```

#### Validate Source
- For Cloud Run: Check for Dockerfile or package.json
- For Firebase: Check for firebase.json

#### Check Current State
```bash
# Get current revision for potential rollback
gcloud run revisions list --service=[SERVICE_NAME] --region=[REGION] --limit=1 \
  --format="value(REVISION)" --project=[PROJECT_ID]
```

### Step 2: Deploy to Cloud Run

```bash
# Deploy with source
gcloud run deploy [SERVICE_NAME] \
  --source=[SOURCE_PATH] \
  --region=[REGION] \
  --project=[PROJECT_ID] \
  --allow-unauthenticated  # or --no-allow-unauthenticated based on config

# Or deploy from image
gcloud run deploy [SERVICE_NAME] \
  --image=[IMAGE_URL] \
  --region=[REGION] \
  --project=[PROJECT_ID]
```

### Step 3: Deploy to Firebase

```bash
# Deploy hosting only
firebase deploy --only hosting --project=[PROJECT_ID]

# Deploy specific target
firebase deploy --only hosting:[TARGET] --project=[PROJECT_ID]
```

### Step 4: Verify Deployment

#### Cloud Run Verification
```bash
# Check new revision is serving
gcloud run services describe [SERVICE_NAME] --region=[REGION] \
  --format="value(status.url)" --project=[PROJECT_ID]

# Health check
curl -s -o /dev/null -w "%{http_code}" [SERVICE_URL]/health
```

#### Firebase Verification
```bash
# Get hosting URL
firebase hosting:sites:list --project=[PROJECT_ID]
```

### Step 5: Report Results

```
## Deployment Report

### Target: [Cloud Run / Firebase / Both]
### Status: ✅ SUCCESS / ❌ FAILED

### Cloud Run
- Service: [service-name]
- Region: [region]
- URL: [url]
- Revision: [new-revision]
- Previous: [old-revision] (for rollback)

### Firebase
- Site: [site-name]
- URL: [url]
- Version: [version-id]

### Post-Deployment Checks
- Health Check: ✅ 200 OK
- Response Time: 150ms

### Rollback Command (if needed)
```bash
gcloud run services update-traffic [SERVICE_NAME] --to-revisions=[OLD_REVISION]=100 --region=[REGION]
```
```

## Rollback Support

If deployment fails or user requests rollback:

```bash
# Cloud Run rollback
gcloud run services update-traffic [SERVICE_NAME] \
  --to-revisions=[PREVIOUS_REVISION]=100 \
  --region=[REGION] \
  --project=[PROJECT_ID]

# Firebase rollback
firebase hosting:rollback --project=[PROJECT_ID]
```

## Example Usage

```
/gcp:deploy cloud-run --service my-api
/gcp:deploy firebase
/gcp:deploy both --project my-project
/gcp:deploy cloud-run --source ./backend --region us-east1
```
