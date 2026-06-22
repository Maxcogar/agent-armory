using System.Text.Json.Nodes;

namespace PowerMillMcpServer.Tools
{
    /// Small helpers for the most common tool schema shapes — keeps tool
    /// boilerplate down and the actual semantics readable.
    public static class Schemas
    {
        public static JsonObject Empty() => new JsonObject
        {
            ["type"] = "object",
            ["properties"] = new JsonObject(),
            ["additionalProperties"] = false,
        };

        public static JsonObject ReadOnly(string? title = null)
        {
            var o = new JsonObject { ["readOnlyHint"] = true, ["openWorldHint"] = false };
            if (title != null) o["title"] = title;
            return o;
        }

        public static JsonObject Action(bool idempotent = false, bool destructive = false, string? title = null)
        {
            var o = new JsonObject
            {
                ["readOnlyHint"] = false,
                ["destructiveHint"] = destructive,
                ["idempotentHint"] = idempotent,
                ["openWorldHint"] = true,
            };
            if (title != null) o["title"] = title;
            return o;
        }
    }
}
