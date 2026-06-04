using System.Text.Json;
using PowerMillMcpServer.Tools;
using Xunit;

namespace PowerMillMcpServer.Tests
{
    /// Verifies B4: run_macro requires confirm_destructive: true on every call,
    /// and the validation rejects malformed input *before* any session call.
    public class RunMacroConfirmTests
    {
        [Fact]
        public void Validate_NoConfirm_RejectsWithMessage()
        {
            var args = JsonDocument.Parse("{\"commands\":[\"PRINT VERSION\"]}").RootElement;
            var result = RunMacroTool.ValidateArgs(args, out var cmds, out var captureLast);
            Assert.NotNull(result);
            Assert.True(result!.IsError);
            Assert.Contains("confirm_destructive: true", result.Content[0].Text);
            Assert.Empty(cmds);
        }

        [Fact]
        public void Validate_ConfirmFalse_Rejects()
        {
            var args = JsonDocument.Parse("{\"commands\":[\"PRINT VERSION\"],\"confirm_destructive\":false}").RootElement;
            var result = RunMacroTool.ValidateArgs(args, out _, out _);
            Assert.NotNull(result);
            Assert.True(result!.IsError);
        }

        [Fact]
        public void Validate_ConfirmTrue_Passes()
        {
            var args = JsonDocument.Parse("{\"commands\":[\"PRINT VERSION\"],\"confirm_destructive\":true}").RootElement;
            var result = RunMacroTool.ValidateArgs(args, out var cmds, out var captureLast);
            Assert.Null(result);
            Assert.Single(cmds);
            Assert.Equal("PRINT VERSION", cmds[0]);
            Assert.True(captureLast);
        }

        [Fact]
        public void Validate_MissingCommands_Rejects()
        {
            var args = JsonDocument.Parse("{\"confirm_destructive\":true}").RootElement;
            var result = RunMacroTool.ValidateArgs(args, out _, out _);
            Assert.NotNull(result);
            Assert.Contains("commands", result!.Content[0].Text);
        }

        [Fact]
        public void Validate_EmptyCommands_Rejects()
        {
            var args = JsonDocument.Parse("{\"commands\":[],\"confirm_destructive\":true}").RootElement;
            var result = RunMacroTool.ValidateArgs(args, out _, out _);
            Assert.NotNull(result);
        }

        [Fact]
        public void Validate_CaptureLastFalse_Honored()
        {
            var args = JsonDocument.Parse("{\"commands\":[\"X\"],\"confirm_destructive\":true,\"capture_last_response\":false}").RootElement;
            var result = RunMacroTool.ValidateArgs(args, out _, out var captureLast);
            Assert.Null(result);
            Assert.False(captureLast);
        }

        [Fact]
        public void Validate_NonStringInArray_Rejects()
        {
            var args = JsonDocument.Parse("{\"commands\":[\"X\",42],\"confirm_destructive\":true}").RootElement;
            var result = RunMacroTool.ValidateArgs(args, out _, out _);
            Assert.NotNull(result);
        }
    }
}
