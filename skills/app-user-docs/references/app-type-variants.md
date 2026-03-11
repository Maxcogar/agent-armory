# App-Type Variant Instructions

Read only the section matching the app type from the App Profile. Inject that section into the Phase 2 prompt.

---

## voice-first

**Primary emphasis:** Voice commands are the main interface. The voice command inventory is the most important section in the document — it must be exhaustive.

**Sections to include (in this order after the pipeline section):**

### Voice Commands
This is the centerpiece section. Organize commands by domain (e.g., Email, Calendar, Jobs, Files, CAD). For each domain:
- List every command or command pattern the user can speak
- Describe what it does and what feedback/response they get
- Flag status per command if mixed (some working, some not)

Format as a table per domain:
| Command | What it does | Status |
|---------|-------------|--------|

If command phrasing is flexible (not exact-match), describe the intent pattern instead: *"Ask to reschedule any calendar item by saying its name and a new time."*

### Panels & Sections
For each visible panel: what it shows, what manual interactions exist, sync behavior, status flag.
Keep this section secondary to Voice Commands — the UI panels support the voice interface, not the other way around.

### Integrations
Table format:
| System | Data flowing IN | Actions pushed OUT | Sync method | Status |
|--------|----------------|-------------------|-------------|--------|

### File & Media Access
If the app can open files, prints, or drawings: how the user accesses them (voice command, click, or both), what viewer is available, what the user can do in the viewer.

### CAD / 3D Model Interface
If present: how models are loaded, what voice commands work on them, what manipulation is possible, status.

**Reference example:** CNC Syndicate Hub
- Voice-first command center for a manufacturing business
- Core pipeline: Email → RFQ → Job Board → Invoice
- Integrations: ERPNext, Gmail, Google Calendar, Microsoft To-Do, Autodesk
- Voice engine: Gemini Voice (real-time, context-aware)
- Special capabilities: in-app print viewer (zoom/pan/discuss), 3D CAD viewer with voice manipulation

---

## standard-web

**Primary emphasis:** UI navigation and feature inventory. Document what the user sees and what they can do on each screen.

**Sections to include:**

### Getting Started
How the user first accesses the app, any onboarding or setup required, login/auth flow.

### Navigation & Layout
How the app is structured (sidebar, tabs, top nav), persistent UI elements, how to move between sections.

### Features by Section
For each major section or page: what it shows, all available actions, any important rules or constraints, status flag.

### Data Management
What data the user creates, views, edits, and deletes. Import/export capabilities if any.

### Settings & Account
User-configurable options, profile management, preferences.

---

## iot-embedded

**Primary emphasis:** Physical states, sensor readings, and hardware control. Document what the user monitors and what they can control.

**Sections to include:**

### Dashboard & Monitoring
What readings, states, and statuses the user can see. Update frequency. What normal vs. alert states look like.

### Controls & Actuators
What the user can physically trigger or adjust (via the app). How they do it. Any confirmation steps or safety interlocks.

### Automations & Rules
What the system does on its own. What triggers automations. How the user configures or overrides them.

### Alerts & Notifications
What conditions trigger alerts, how the user is notified, what actions are available from an alert.

### Hardware Status
Device connectivity, sensor health, calibration status. What a user does when something is offline or out of range.

### Data Logging & History
What gets logged, how far back the user can see, any export options.

---

## hub-integrations

**Primary emphasis:** The integrations are the product. Document each connected system as a first-class feature, with clear two-way data flow.

**Sections to include:**

### Core Pipeline / Workflow
If a pipeline exists, this is the primary section. Document end-to-end from the user's perspective.

### Integrations
Each integration gets its own subsection:
- What data comes in and how it's displayed
- What actions the user can push back out
- Sync method and frequency
- Status flag

### Unified Views
Any views that aggregate data across multiple integrations (e.g., a combined inbox, a master calendar, a job board pulling from multiple sources).

### Manual Actions vs. Automatic Sync
Be explicit about what happens automatically vs. what the user must trigger.

---

## mixed

Combine the most relevant sections from the matching types above. Use the App Profile's "Primary interface" field to determine which type gets the heavier treatment. If voice + hub-integrations, lead with the Voice Commands section and include the Integrations table from hub-integrations.
