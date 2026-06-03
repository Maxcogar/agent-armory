using System.Text.Json;
using System.Text.Json.Nodes;
using PowerMillMcpServer.Mcp;
using Xunit;

namespace PowerMillMcpServer.Tests
{
    public class JsonRpcEnvelopeTests
    {
        private static readonly JsonSerializerOptions Opts = new JsonSerializerOptions
        {
            DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull,
            PropertyNamingPolicy = null,
        };

        [Fact]
        public void Response_OmitsErrorWhenResultSet()
        {
            var resp = new JsonRpcResponse
            {
                Id = JsonDocument.Parse("1").RootElement,
                Result = new JsonObject { ["ok"] = true },
            };
            var json = JsonSerializer.Serialize(resp, Opts);
            Assert.Contains("\"result\"", json);
            Assert.DoesNotContain("\"error\"", json);
        }

        [Fact]
        public void Response_OmitsResultWhenErrorSet()
        {
            var resp = new JsonRpcResponse
            {
                Id = JsonDocument.Parse("\"abc\"").RootElement,
                Error = new JsonRpcError { Code = -32600, Message = "bad" },
            };
            var json = JsonSerializer.Serialize(resp, Opts);
            Assert.Contains("\"error\"", json);
            Assert.Contains("\"code\":-32600", json);
            Assert.DoesNotContain("\"result\"", json);
        }

        [Fact]
        public void Notification_HasNoId()
        {
            var note = new JsonRpcNotification
            {
                Method = "notifications/progress",
                Params = new JsonObject { ["progress"] = 0.5 },
            };
            var json = JsonSerializer.Serialize(note, Opts);
            Assert.DoesNotContain("\"id\"", json);
            Assert.Contains("\"method\":\"notifications/progress\"", json);
        }

        [Fact]
        public void Notification_OmitsParamsWhenNull()
        {
            var note = new JsonRpcNotification { Method = "ping" };
            var json = JsonSerializer.Serialize(note, Opts);
            Assert.DoesNotContain("\"params\"", json);
        }

        [Fact]
        public void Request_RoundTrip()
        {
            var raw = "{\"jsonrpc\":\"2.0\",\"id\":7,\"method\":\"tools/call\",\"params\":{\"name\":\"x\"}}";
            var req = JsonSerializer.Deserialize<JsonRpcRequest>(raw, Opts);
            Assert.NotNull(req);
            Assert.Equal("tools/call", req!.Method);
            Assert.False(req.IsNotification);
        }

        [Fact]
        public void Request_NoIdIsNotification()
        {
            var raw = "{\"jsonrpc\":\"2.0\",\"method\":\"notifications/initialized\"}";
            var req = JsonSerializer.Deserialize<JsonRpcRequest>(raw, Opts);
            Assert.True(req!.IsNotification);
        }

        [Fact]
        public void Error_Codes_AreSpec()
        {
            Assert.Equal(-32700, JsonRpcError.ParseError);
            Assert.Equal(-32600, JsonRpcError.InvalidRequest);
            Assert.Equal(-32601, JsonRpcError.MethodNotFound);
            Assert.Equal(-32602, JsonRpcError.InvalidParams);
            Assert.Equal(-32603, JsonRpcError.InternalError);
            Assert.Equal(-32002, JsonRpcError.ServerNotInitialized);
        }
    }
}
