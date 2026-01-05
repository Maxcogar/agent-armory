# Claude Armory

A marketplace of Claude Code plugins for cloud development, IoT, and beyond.

## Installation

### 1. Add the Marketplace

```
/plugin marketplace add Maxcogar/claude-armory
```

### 2. Install a Plugin

```
/plugin install gcp-iot@claude-armory
```

### 3. Update Plugins

```
/plugin marketplace update claude-armory
```

## Available Plugins

| Plugin | Description |
|--------|-------------|
| [gcp-iot](./gcp-iot/) | GCP IoT toolkit for ESP32 sensors, Cloud Run, Pub/Sub, and Firebase |

## Plugin Details

### gcp-iot

Comprehensive Google Cloud Platform IoT development toolkit featuring:

- **6 Specialized Agents**: IoT telemetry tracing, Cloud Run debugging, Pub/Sub inspection, WebSocket debugging, ESP32 diagnostics, and GCP architecture review
- **8 Commands**: `/gcp:diagnose`, `/gcp:trace`, `/gcp:logs`, `/gcp:deploy`, `/gcp:status`, `/gcp:pubsub`, `/gcp:test-sensor`, `/gcp:websocket`
- **4 Skills**: GCP IoT patterns, Cloud Run debugging, Pub/Sub troubleshooting, ESP32 integration

[View full documentation](./gcp-iot/README.md)

## Contributing

To add a plugin to this marketplace:

1. Create a folder for your plugin with this structure:
   ```
   your-plugin/
   ├── .claude-plugin/
   │   └── plugin.json
   ├── agents/       (optional)
   ├── commands/     (optional)
   ├── hooks/        (optional)
   ├── skills/       (optional)
   └── README.md
   ```

2. Add an entry to `.claude-plugin/marketplace.json`

3. Submit a pull request

## License

MIT
