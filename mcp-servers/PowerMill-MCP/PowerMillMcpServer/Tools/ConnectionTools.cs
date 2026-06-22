using System.Text.Json;
using System.Text.Json.Nodes;
using System.Threading;
using System.Threading.Tasks;
using PowerMillMcpServer.Mcp;

namespace PowerMillMcpServer.Tools
{
    public sealed class ConnectPowerMillTool : Tool
    {
        private readonly ToolDeps _deps;
        public ConnectPowerMillTool(ToolDeps deps) { _deps = deps; }

        public override string Name => "connect_powermill";
        public override string Description =>
            "Attach to a running PowerMill instance, or start a new one. " +
            "Call this once before any other PowerMill tool. " +
            "Provide spawn_new=false (default) to attach to a running session, or spawn_new=true to launch one (requires with_gui=false). " +
            "Returns connection status with version, units, busy state, GUI visibility, and active project name. " +
            "When NOT to use: a second call is a no-op — use get_status to check connection state instead.";
        public override JsonObject InputSchema => new JsonObject
        {
            ["type"] = "object",
            ["properties"] = new JsonObject
            {
                ["spawn_new"] = new JsonObject
                {
                    ["type"] = "boolean",
                    ["description"] = "If true, spawn a new PowerMill instance instead of attaching to an existing one. Spawn-new requires with_gui=false (PowerMill restriction).",
                    ["default"] = false,
                },
                ["with_gui"] = new JsonObject
                {
                    ["type"] = "boolean",
                    ["description"] = "Show the PowerMill GUI. Default true.",
                    ["default"] = true,
                },
            },
            ["additionalProperties"] = false,
        };
        public override JsonObject Annotations => new JsonObject
        {
            ["title"] = "Connect to PowerMill",
            ["readOnlyHint"] = false,
            ["destructiveHint"] = false,
            ["idempotentHint"] = true,
            ["openWorldHint"] = true,
        };

        public override async Task<ToolResult> InvokeAsync(JsonElement? args, ProgressReporter progress, CancellationToken ct)
        {
            var spawnNew = GetBool(args, "spawn_new", false);
            var withGui = GetBool(args, "with_gui", true);
            var status = await _deps.Session.ConnectAsync(spawnNew, withGui, ct).ConfigureAwait(false);
            return ToolResult.Text(status);
        }
    }

    public sealed class GetStatusTool : Tool
    {
        private readonly ToolDeps _deps;
        public GetStatusTool(ToolDeps deps) { _deps = deps; }

        public override string Name => "get_status";
        public override string Description =>
            "Get the current PowerMill connection status. " +
            "Safe to call any time, including before connect_powermill. " +
            "No parameters. " +
            "Returns connected:false if no session, otherwise version/units/busy/visible/active_project. " +
            "When NOT to use: skip this if you just successfully called connect_powermill — its return shape is the same.";
        public override JsonObject InputSchema => new JsonObject
        {
            ["type"] = "object",
            ["properties"] = new JsonObject(),
            ["additionalProperties"] = false,
        };
        public override JsonObject Annotations => new JsonObject
        {
            ["title"] = "Get PowerMill Status",
            ["readOnlyHint"] = true,
            ["openWorldHint"] = false,
        };

        public override async Task<ToolResult> InvokeAsync(JsonElement? args, ProgressReporter progress, CancellationToken ct)
        {
            var status = await _deps.Session.DescribeAsync(ct).ConfigureAwait(false);
            return ToolResult.Text(status);
        }
    }
}
