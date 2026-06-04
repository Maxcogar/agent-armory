using System.Text.Json;
using System.Threading;
using PowerMillMcpServer.Mcp;
using PowerMillMcpServer.Tests.Fakes;
using PowerMillMcpServer.Tools;
using Xunit;

namespace PowerMillMcpServer.Tests.Tools
{
    [Collection("EnvVar")]
    public class CreateToolpathToolTests
    {
        private static (CreateToolpathTool tool, FakePowerMillSession session) BuildTool()
        {
            var (deps, session, _, _) = TestDeps.Build();
            return (new CreateToolpathTool(deps), session);
        }

        private static ProgressReporter NoProgress() => ProgressReporter.NoOp;

        [Theory]
        [InlineData("raster")]
        [InlineData("offset_area_clear")]
        [InlineData("profile")]
        [InlineData("drill")]
        [InlineData("constantz")]
        [InlineData("RASTER")] // case-insensitive allowlist
        [InlineData(" raster ")] // leading/trailing whitespace tolerated by Validate.Trim
        public async System.Threading.Tasks.Task KnownStrategy_ReachesSession(string strategy)
        {
            var (tool, session) = BuildTool();
            var args = JsonDocument.Parse("{\"strategy\":\"" + strategy + "\"}").RootElement;
            var result = await tool.InvokeAsync(args, NoProgress(), CancellationToken.None);
            Assert.Equal(1, session.WithPowerMillCalls);
            Assert.False(result.IsError, "Expected success for known strategy: " + strategy);
        }

        [Fact]
        public async System.Threading.Tasks.Task UnknownStrategy_RejectsWithoutSessionCall()
        {
            var (tool, session) = BuildTool();
            var args = JsonDocument.Parse("{\"strategy\":\"definitely_not_a_strategy\"}").RootElement;
            var result = await tool.InvokeAsync(args, NoProgress(), CancellationToken.None);
            Assert.True(result.IsError);
            Assert.Contains("Unknown strategy", result.Content[0].Text);
            Assert.Equal(0, session.WithPowerMillCalls);
        }

        [Fact]
        public async System.Threading.Tasks.Task NewlineInjection_RejectsWithoutSessionCall()
        {
            var (tool, session) = BuildTool();
            var args = JsonDocument.Parse("{\"strategy\":\"raster\\nDELETE TOOLPATH ALL\"}").RootElement;
            var result = await tool.InvokeAsync(args, NoProgress(), CancellationToken.None);
            Assert.True(result.IsError);
            Assert.Contains("invalid character", result.Content[0].Text);
            Assert.Equal(0, session.WithPowerMillCalls);
        }

        [Fact]
        public async System.Threading.Tasks.Task SemicolonInjection_RejectsWithoutSessionCall()
        {
            var (tool, session) = BuildTool();
            var args = JsonDocument.Parse("{\"strategy\":\"raster;DELETE\"}").RootElement;
            var result = await tool.InvokeAsync(args, NoProgress(), CancellationToken.None);
            Assert.True(result.IsError);
            Assert.Equal(0, session.WithPowerMillCalls);
        }

        [Fact]
        public async System.Threading.Tasks.Task DoubleQuoteInjection_RejectsWithoutSessionCall()
        {
            var (tool, session) = BuildTool();
            var args = JsonDocument.Parse("{\"strategy\":\"raster\\\"injected\"}").RootElement;
            var result = await tool.InvokeAsync(args, NoProgress(), CancellationToken.None);
            Assert.True(result.IsError);
            Assert.Equal(0, session.WithPowerMillCalls);
        }

        [Fact]
        public async System.Threading.Tasks.Task BackslashInjection_RejectsWithoutSessionCall()
        {
            var (tool, session) = BuildTool();
            var args = JsonDocument.Parse("{\"strategy\":\"raster\\\\injected\"}").RootElement;
            var result = await tool.InvokeAsync(args, NoProgress(), CancellationToken.None);
            Assert.True(result.IsError);
            Assert.Equal(0, session.WithPowerMillCalls);
        }

        [Fact]
        public async System.Threading.Tasks.Task ToolNameWithQuote_RejectsWithoutSessionCall()
        {
            var (tool, session) = BuildTool();
            var args = JsonDocument.Parse("{\"strategy\":\"raster\",\"tool_name\":\"x\\\"y\"}").RootElement;
            var result = await tool.InvokeAsync(args, NoProgress(), CancellationToken.None);
            Assert.True(result.IsError);
            Assert.Contains("tool_name", result.Content[0].Text);
            Assert.Equal(0, session.WithPowerMillCalls);
        }

        [Fact]
        public async System.Threading.Tasks.Task BoundaryNameWithNewline_RejectsWithoutSessionCall()
        {
            var (tool, session) = BuildTool();
            var args = JsonDocument.Parse("{\"strategy\":\"raster\",\"boundary_name\":\"x\\ny\"}").RootElement;
            var result = await tool.InvokeAsync(args, NoProgress(), CancellationToken.None);
            Assert.True(result.IsError);
            Assert.Contains("boundary_name", result.Content[0].Text);
            Assert.Equal(0, session.WithPowerMillCalls);
        }
    }

    public class ToolpathStrategyAllowlistTests
    {
        [Fact]
        public void All56StrategiesAccepted()
        {
            string[] strategies =
            {
                "raster", "radial", "spiral", "pattern", "com_pattern", "com_boundary",
                "constantz", "offset_3d", "pencil_corner", "stitch_corner",
                "automatic_corner", "along_corner", "multi_pencil_corner", "rotary",
                "point_projection", "line_projection", "plane_projection", "curve_projection",
                "profile", "opti_constz", "inter_constz", "swarf", "surface_proj",
                "embedded", "raster_area_clear", "offset_area_clear", "profile_area_clear",
                "drill", "wireframe_swarf", "raster_flat", "offset_flat", "plunge",
                "parametric_offset", "surface_machine", "port_area_clear", "port_plunge",
                "port_spiral", "method", "blisk", "blisk_hub", "blisk_blade",
                "disc_profile", "curve_profile", "curve_area_clear", "face", "chamfer",
                "wireframe_profile", "corner_clear", "edge_break", "flowline",
                "parametric_spiral", "adaptive_area_clear", "rib", "blade",
                "feature_face", "feature_chamfer",
            };
            Assert.Equal(56, strategies.Length);
            foreach (var s in strategies)
                Assert.Null(ToolpathStrategyAllowlist.Validate(s));
        }

        [Fact]
        public void Empty_Rejected() => Assert.NotNull(ToolpathStrategyAllowlist.Validate(""));

        [Fact]
        public void Whitespace_Rejected() => Assert.NotNull(ToolpathStrategyAllowlist.Validate("   "));

        [Fact]
        public void Null_Rejected() => Assert.NotNull(ToolpathStrategyAllowlist.Validate(null));

        [Fact]
        public void Tab_Rejected() => Assert.NotNull(ToolpathStrategyAllowlist.Validate("raster\tinjected"));

        [Fact]
        public void EntityNameValidator_AcceptsClean()
        {
            Assert.Null(EntityNameValidator.Validate("normal_name", "name"));
            Assert.Null(EntityNameValidator.Validate("", "name")); // empty is "not provided" — caller decides
            Assert.Null(EntityNameValidator.Validate(null, "name"));
        }

        [Fact]
        public void EntityNameValidator_RejectsInjection()
        {
            Assert.NotNull(EntityNameValidator.Validate("x\"y", "name"));
            Assert.NotNull(EntityNameValidator.Validate("x\\y", "name"));
            Assert.NotNull(EntityNameValidator.Validate("x\ny", "name"));
            Assert.NotNull(EntityNameValidator.Validate("x\rz", "name"));
        }
    }
}
