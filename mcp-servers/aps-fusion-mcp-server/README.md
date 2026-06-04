# APS Fusion MCP Server

MCP server for browsing and accessing Autodesk Fusion 3D models through APS APIs.

## What it does

- **Find designs by name** — single GraphQL query across all hubs/projects (no folder walking)
- **Browse** hubs, projects, folders via REST (Data Management API)
- **Component hierarchy** — Fusion-native assembly tree via Manufacturing Data Model GraphQL
- **Physical properties** — mass, volume, density, bounding box per component
- **Object properties** — dimensions, materials via Model Derivative API
- **Export** — STEP download URLs via GraphQL, or translate to STL/IGES/OBJ/FBX via Model Derivative
- **Thumbnails** — model and per-component thumbnails

## Prerequisites

- **Node.js 18+**
- **APS App** in a **Developer Hub** at [aps.autodesk.com](https://aps.autodesk.com)
  - App type: **Traditional Web App**
  - API Access: **Data Management API**, **Model Derivative API**, **Manufacturing Data Model API**
  - Callback URL: `http://localhost:8080/auth/callback` (local) or your Cloud Run URL

## Setup

```bash
git clone <your-repo-url>
cd aps-fusion-mcp-server
npm install
cp .env.example .env
# Edit .env with your APS credentials
npm run build
npm start
```

Visit `http://localhost:8080/auth/login` to authenticate with Autodesk.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `APS_CLIENT_ID` | Yes | App Client ID from developer hub |
| `APS_CLIENT_SECRET` | Yes | App Client Secret |
| `APS_CALLBACK_URL` | Yes | OAuth callback (must match app config exactly) |
| `PORT` | No | Server port (default: 8080) |

## Deploy to Google Cloud Run

```bash
gcloud builds submit --tag gcr.io/YOUR_PROJECT/aps-fusion-mcp
gcloud run deploy aps-fusion-mcp \
  --image gcr.io/YOUR_PROJECT/aps-fusion-mcp \
  --platform managed --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "APS_CLIENT_ID=xxx,APS_CLIENT_SECRET=xxx,APS_CALLBACK_URL=https://YOUR_URL/auth/callback"
```

Update the Callback URL in your APS app settings after deploying.

## MCP Tools (19 total)

### Manufacturing Data Model (GraphQL — recommended for Fusion)

These collapse multi-step REST traversals into single queries.

| Tool | Description |
|---|---|
| `aps_find_design` | Find designs by name across all hubs/projects in one query |
| `aps_get_design_hierarchy` | Full Fusion component tree (assembly → subcomponents) |
| `aps_get_physical_properties` | Mass, volume, density, bounding box for a component |
| `aps_generate_step` | Get STEP download URL for a component |
| `aps_get_component_thumbnail` | Thumbnail for a specific component |

### Data Management (REST — browsing)

| Tool | Description |
|---|---|
| `aps_auth_status` | Check auth, get login URL if needed |
| `aps_list_hubs` | List accessible hubs |
| `aps_list_projects` | List projects in a hub |
| `aps_list_top_folders` | List top-level folders in a project |
| `aps_list_folder_contents` | List folder contents (subfolders + items) |
| `aps_get_item_versions` | Get versions of an item (tip = latest) |
| `aps_search_folder` | Recursive name search within a folder |

### Model Derivative (REST — metadata + export)

| Tool | Description |
|---|---|
| `aps_get_model_views` | Get viewable components (3D/2D views) |
| `aps_get_object_tree` | Object hierarchy with IDs |
| `aps_get_properties` | Properties for specific objects |
| `aps_get_manifest` | Translation status and derivatives |
| `aps_translate_model` | Export to STL, STEP, IGES, OBJ, FBX, etc. |
| `aps_get_thumbnail` | Model thumbnail (PNG) |
| `aps_get_formats` | Supported format combinations |

### Two ways to find a design

**Fast path (GraphQL — 1 call):**
```
aps_find_design(design_name: "engine block")
→ returns hub ID, project ID, item ID, root component version ID
```

**Manual path (REST — 3-5 calls):**
```
aps_list_hubs → aps_list_projects → aps_list_top_folders → aps_search_folder("engine block")
→ aps_get_item_versions → version URN for Model Derivative
```

### Typical workflow

```
1. aps_find_design("my part")           → find it
2. aps_get_design_hierarchy(...)        → see component tree
3. aps_get_physical_properties(...)     → mass, volume, bbox
4. aps_generate_step(...)               → download STEP file
```

## Architecture

```
┌──────────────────────────────────────────┐
│  MCP Client (Claude, Claude Code, etc.)  │
└─────────────────┬────────────────────────┘
                  │ POST /mcp
┌─────────────────▼────────────────────────┐
│  Express Server (Cloud Run)              │
│  ├── /mcp           → MCP transport      │
│  ├── /auth/login    → Redirect to ADSK   │
│  ├── /auth/callback → Token exchange     │
│  └── /auth/status   → Auth check         │
└─────────────────┬────────────────────────┘
                  │
    ┌─────────────┼─────────────┐
    │             │             │
    ▼             ▼             ▼
Data Mgmt    Mfg Data Model  Model Deriv
(REST)       (GraphQL)       (REST)
hubs/        hubs/projects/  metadata/
projects/    components/     properties/
folders      properties/     export
             STEP/thumbnails
```

## Using with Claude

### Claude Code / Claude Desktop
```json
{
  "mcpServers": {
    "aps-fusion": {
      "type": "url",
      "url": "https://your-service.run.app/mcp"
    }
  }
}
```

## Notes

- **Auth tokens are in memory.** Cloud Run cold starts require re-auth via `/auth/login`. For production, persist the refresh token to Secret Manager or Firestore.
- **Fusion Team auto-translates to SVF2**, so Model Derivative metadata tools work on most saved designs without manual translation.
- **Manufacturing Data Model API** requires your app to have that API enabled in the developer hub. If you get 403s on the GraphQL tools, check your app's API Access settings.
- **GraphQL pagination**: `aps_get_design_hierarchy` fetches the first page of occurrences. Very large assemblies may need cursor-based pagination (noted in output).
