using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.Json.Serialization;

namespace PowerMillMcpServer.Mcp
{
    public sealed class JsonRpcRequest
    {
        [JsonPropertyName("jsonrpc")] public string JsonRpc { get; set; } = "2.0";
        [JsonPropertyName("id")] public JsonElement? Id { get; set; }
        [JsonPropertyName("method")] public string Method { get; set; } = "";
        [JsonPropertyName("params")] public JsonElement? Params { get; set; }

        public bool IsNotification => Id == null || Id.Value.ValueKind == JsonValueKind.Null || Id.Value.ValueKind == JsonValueKind.Undefined;
    }

    public sealed class JsonRpcResponse
    {
        [JsonPropertyName("jsonrpc")] public string JsonRpc { get; set; } = "2.0";
        [JsonPropertyName("id")] public JsonElement? Id { get; set; }
        [JsonPropertyName("result"), JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] public JsonNode? Result { get; set; }
        [JsonPropertyName("error"), JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] public JsonRpcError? Error { get; set; }
    }

    public sealed class JsonRpcError
    {
        [JsonPropertyName("code")] public int Code { get; set; }
        [JsonPropertyName("message")] public string Message { get; set; } = "";
        [JsonPropertyName("data"), JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] public JsonNode? Data { get; set; }

        public const int ParseError = -32700;
        public const int InvalidRequest = -32600;
        public const int MethodNotFound = -32601;
        public const int InvalidParams = -32602;
        public const int InternalError = -32603;
        // MCP-specific: per spec, server returns this when a non-initialize
        // request arrives before notifications/initialized.
        public const int ServerNotInitialized = -32002;
    }

    public sealed class JsonRpcNotification
    {
        [JsonPropertyName("jsonrpc")] public string JsonRpc { get; set; } = "2.0";
        [JsonPropertyName("method")] public string Method { get; set; } = "";
        [JsonPropertyName("params"), JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] public JsonNode? Params { get; set; }
    }
}
