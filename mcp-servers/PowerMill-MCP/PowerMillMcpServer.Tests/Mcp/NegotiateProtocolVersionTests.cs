using System.Text.Json;
using PowerMillMcpServer.Mcp;
using Xunit;

namespace PowerMillMcpServer.Tests.Mcp
{
    public class NegotiateProtocolVersionTests
    {
        private static JsonElement Params(string json) => JsonDocument.Parse(json).RootElement;

        [Fact]
        public void Echoes_Latest()
        {
            var p = Params("{\"protocolVersion\":\"2025-06-18\"}");
            Assert.Equal("2025-06-18", McpServer.NegotiateProtocolVersion(p));
        }

        [Fact]
        public void Echoes_Older_Supported()
        {
            var p = Params("{\"protocolVersion\":\"2024-11-05\"}");
            Assert.Equal("2024-11-05", McpServer.NegotiateProtocolVersion(p));
        }

        [Fact]
        public void Unknown_Version_Returns_Latest()
        {
            var p = Params("{\"protocolVersion\":\"1999-01-01\"}");
            Assert.Equal("2025-06-18", McpServer.NegotiateProtocolVersion(p));
        }

        [Fact]
        public void Null_Params_Returns_Latest()
        {
            Assert.Equal("2025-06-18", McpServer.NegotiateProtocolVersion(null));
        }

        [Fact]
        public void Missing_Field_Returns_Latest()
        {
            var p = Params("{}");
            Assert.Equal("2025-06-18", McpServer.NegotiateProtocolVersion(p));
        }

        [Fact]
        public void NonString_Field_Returns_Latest()
        {
            var p = Params("{\"protocolVersion\":42}");
            Assert.Equal("2025-06-18", McpServer.NegotiateProtocolVersion(p));
        }
    }
}
