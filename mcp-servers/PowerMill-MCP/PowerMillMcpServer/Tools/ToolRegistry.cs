using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Threading;
using System.Threading.Tasks;
using PowerMillMcpServer.Mcp;

namespace PowerMillMcpServer.Tools
{
    public sealed class UnknownToolException : Exception
    {
        public UnknownToolException(string name) : base("Unknown tool: " + name) { }
    }

    public sealed class ToolResult
    {
        public List<ToolContent> Content { get; } = new List<ToolContent>();
        public bool IsError { get; private set; }

        public static ToolResult Text(string text)
        {
            var r = new ToolResult();
            r.Content.Add(new ToolContent { Type = "text", Text = text });
            return r;
        }

        public static ToolResult Json(JsonNode node) => Text(node.ToJsonString());

        public static ToolResult Error(string message)
        {
            var r = new ToolResult { IsError = true };
            r.Content.Add(new ToolContent { Type = "text", Text = message });
            return r;
        }

        public JsonObject ToJson()
        {
            var arr = new JsonArray();
            foreach (var c in Content)
                arr.Add(new JsonObject { ["type"] = c.Type, ["text"] = c.Text });
            var o = new JsonObject { ["content"] = arr };
            if (IsError) o["isError"] = true;
            return o;
        }
    }

    public sealed class ToolContent
    {
        public string Type { get; set; } = "text";
        public string Text { get; set; } = "";
    }

    public abstract class Tool
    {
        public abstract string Name { get; }
        public abstract string Description { get; }
        public abstract JsonObject InputSchema { get; }
        public virtual JsonObject? Annotations => null;
        public abstract Task<ToolResult> InvokeAsync(JsonElement? args, ProgressReporter progress, CancellationToken ct);

        protected static string? GetString(JsonElement? args, string name)
        {
            if (args == null || args.Value.ValueKind != JsonValueKind.Object) return null;
            if (!args.Value.TryGetProperty(name, out var v)) return null;
            return v.ValueKind == JsonValueKind.String ? v.GetString() : null;
        }

        protected static bool GetBool(JsonElement? args, string name, bool fallback)
        {
            if (args == null || args.Value.ValueKind != JsonValueKind.Object) return fallback;
            if (!args.Value.TryGetProperty(name, out var v)) return fallback;
            return v.ValueKind == JsonValueKind.True ? true
                 : v.ValueKind == JsonValueKind.False ? false
                 : fallback;
        }
    }

    public sealed class ToolRegistry
    {
        private readonly Dictionary<string, Tool> _tools = new Dictionary<string, Tool>(StringComparer.Ordinal);
        private readonly SemaphoreSlim _executionLock = new SemaphoreSlim(1, 1);

        public void Register(Tool tool) => _tools[tool.Name] = tool;

        public JsonArray DescribeAll()
        {
            var arr = new JsonArray();
            foreach (var t in _tools.Values)
            {
                var desc = new JsonObject
                {
                    ["name"] = t.Name,
                    ["description"] = t.Description,
                    ["inputSchema"] = t.InputSchema.DeepClone(),
                };
                if (t.Annotations != null) desc["annotations"] = t.Annotations.DeepClone();
                arr.Add(desc);
            }
            return arr;
        }

        public async Task<ToolResult> InvokeAsync(string name, JsonElement? args, ProgressReporter progress, CancellationToken ct)
        {
            if (!_tools.TryGetValue(name, out var tool)) throw new UnknownToolException(name);

            // Serialize all tool execution. PowerMill is one process; concurrent
            // mutating calls would corrupt state.
            await _executionLock.WaitAsync(ct).ConfigureAwait(false);
            try
            {
                return await tool.InvokeAsync(args, progress, ct).ConfigureAwait(false);
            }
            finally
            {
                _executionLock.Release();
            }
        }
    }
}
