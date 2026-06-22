using System.Text.Json;
using System.Text.Json.Nodes;
using System.Threading;
using System.Threading.Tasks;
using PowerMillMcpServer.Mcp;
using PowerMillMcpServer.Util;

namespace PowerMillMcpServer.Tools
{
    /// Universal introspection. Wraps PMAutomation.GetPowerMillParameter.
    /// PowerMill's parameter tree exposes nearly all live state via dotted
    /// paths and entity() lookups (e.g. entity('toolpath','op1').strategy).
    /// Anything the typed tools don't cover is reachable here.
    public sealed class QueryParameterTool : Tool
    {
        private readonly ToolDeps _deps;
        public QueryParameterTool(ToolDeps deps) { _deps = deps; }

        public override string Name => "query_parameter";
        public override string Description =>
            "Query any value from PowerMill's parameter tree. Universal introspection escape hatch. " +
            "Use when no typed tool surfaces the data you need — the parameter tree exposes nearly all live state. " +
            "Provide path. Examples: 'powermill.export.OutputMetricSTL' (config flag), 'project_pathname(false)' (current project path), 'entity(\\'toolpath\\',\\'op1\\').strategy' (entity property). " +
            "Returns path and value (capped at 100K chars). " +
            "When NOT to use: use the typed list_* and get_*_details tools when one exists — they're easier and structured.";
        public override JsonObject InputSchema => new JsonObject
        {
            ["type"] = "object",
            ["properties"] = new JsonObject
            {
                ["path"] = new JsonObject { ["type"] = "string", ["description"] = "Parameter expression to evaluate." },
            },
            ["required"] = new JsonArray { "path" },
            ["additionalProperties"] = false,
        };
        public override JsonObject Annotations => Schemas.ReadOnly("Query PowerMill Parameter");

        public override async Task<ToolResult> InvokeAsync(JsonElement? args, ProgressReporter progress, CancellationToken ct)
        {
            var path = GetString(args, "path");
            if (string.IsNullOrEmpty(path)) return ToolResult.Error("Missing required parameter: path");

            var value = await _deps.Session.WithPowerMillAsync(pm => pm.GetPowerMillParameter(path!) ?? "", ct).ConfigureAwait(false);
            return ToolResult.Json(new JsonObject
            {
                ["path"] = path,
                ["value"] = OutputCap.Apply(value),
            });
        }
    }
}
