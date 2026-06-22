using System.Text.Json;
using System.Text.Json.Nodes;
using System.Threading;
using System.Threading.Tasks;
using PowerMillMcpServer.Mcp;
using PowerMillMcpServer.Util;

namespace PowerMillMcpServer.Tools
{
    /// Universal escape hatch. Executes one or more raw PowerMill macro
    /// commands in sequence. Because the command space is unbounded and the
    /// MCP can't know intent, every call requires explicit confirmation.
    public sealed class RunMacroTool : Tool
    {
        private readonly ToolDeps _deps;
        public RunMacroTool(ToolDeps deps) { _deps = deps; }

        public override string Name => "run_macro";
        public override string Description =>
            "Execute one or more PowerMill macro commands in sequence. " +
            "This is the escape hatch for operations not covered by typed tools. " +
            "Because PowerMill commands can do anything (including data loss), every call requires confirm_destructive: true. " +
            "Each command is a complete PowerMill macro statement (e.g. 'PROJECT SAVE', 'EDIT TOOL \"T1\" DIAMETER 10').";
        public override JsonObject InputSchema => new JsonObject
        {
            ["type"] = "object",
            ["properties"] = new JsonObject
            {
                ["commands"] = new JsonObject
                {
                    ["type"] = "array",
                    ["items"] = new JsonObject { ["type"] = "string" },
                    ["minItems"] = 1,
                    ["description"] = "Ordered list of PowerMill macro command strings.",
                },
                ["confirm_destructive"] = new JsonObject
                {
                    ["type"] = "boolean",
                    ["description"] = "Required true. Acknowledges that this call may modify or delete project data.",
                },
                ["capture_last_response"] = new JsonObject
                {
                    ["type"] = "boolean",
                    ["default"] = true,
                    ["description"] = "If true, the final command is run via DoCommandEx and its response returned. If false, all commands are fire-and-forget.",
                },
            },
            ["required"] = new JsonArray { "commands", "confirm_destructive" },
            ["additionalProperties"] = false,
        };
        public override JsonObject Annotations => Schemas.Action(destructive: true, title: "Run PowerMill Macro Commands");

        public override async Task<ToolResult> InvokeAsync(JsonElement? args, ProgressReporter progress, CancellationToken ct)
        {
            var validation = ValidateArgs(args, out var commands, out var captureLast);
            if (validation != null) return validation;

            var result = await _deps.Session.WithPowerMillAsync(pm =>
            {
                if (captureLast && commands.Count > 1)
                {
                    var head = commands.GetRange(0, commands.Count - 1).ToArray();
#pragma warning disable CS0618 // Execute/ExecuteEx are the public surface for raw commands
                    pm.Execute(head);
                    var response = pm.ExecuteEx(commands[commands.Count - 1]);
#pragma warning restore CS0618
                    return new JsonObject
                    {
                        ["executed"] = commands.Count,
                        ["response"] = OutputCap.Apply(response?.ToString() ?? ""),
                    };
                }
                else if (captureLast)
                {
#pragma warning disable CS0618
                    var response = pm.ExecuteEx(commands[0]);
#pragma warning restore CS0618
                    return new JsonObject
                    {
                        ["executed"] = 1,
                        ["response"] = OutputCap.Apply(response?.ToString() ?? ""),
                    };
                }
                else
                {
#pragma warning disable CS0618
                    pm.Execute(commands.ToArray());
#pragma warning restore CS0618
                    return new JsonObject { ["executed"] = commands.Count };
                }
            }, ct).ConfigureAwait(false);

            return ToolResult.Json(result);
        }

        /// Validation extracted so it can be unit-tested without a live session.
        /// Returns a ToolResult on rejection; null when args are valid (and
        /// outputs `commands` and `captureLast`).
        public static ToolResult? ValidateArgs(JsonElement? args, out System.Collections.Generic.List<string> commands, out bool captureLast)
        {
            commands = new System.Collections.Generic.List<string>();
            captureLast = true;

            if (args == null || args.Value.ValueKind != JsonValueKind.Object)
                return ToolResult.Error("Invalid arguments: expected an object");

            // confirm_destructive must be present and true.
            if (!args.Value.TryGetProperty("confirm_destructive", out var confirm) ||
                confirm.ValueKind != JsonValueKind.True)
            {
                return ToolResult.Error(
                    "run_macro requires confirm_destructive: true on every call. " +
                    "PowerMill macros can modify or delete project data; explicit confirmation is mandatory.");
            }

            if (!args.Value.TryGetProperty("commands", out var cmdEl) || cmdEl.ValueKind != JsonValueKind.Array)
                return ToolResult.Error("Missing required parameter: commands (array of strings)");

            foreach (var c in cmdEl.EnumerateArray())
            {
                if (c.ValueKind != JsonValueKind.String) return ToolResult.Error("commands must contain only strings");
                var s = c.GetString();
                if (!string.IsNullOrEmpty(s)) commands.Add(s!);
            }
            if (commands.Count == 0) return ToolResult.Error("commands is empty");

            if (args.Value.TryGetProperty("capture_last_response", out var cl) &&
                (cl.ValueKind == JsonValueKind.True || cl.ValueKind == JsonValueKind.False))
                captureLast = cl.ValueKind == JsonValueKind.True;

            return null;
        }
    }
}
