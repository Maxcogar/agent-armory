using System;
using System.IO;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Threading;
using System.Threading.Tasks;
using PowerMillMcpServer.Mcp;
using PowerMillMcpServer.Tools;
using Xunit;

namespace PowerMillMcpServer.Tests.Mcp
{
    /// Verifies the cancellation race fix from #9 — a notifications/cancelled
    /// frame arriving while the tool is still running causes the tool's
    /// CancellationToken to fire.
    public class McpServerCancellationTests
    {
        private sealed class BlockingTool : Tool
        {
            public TaskCompletionSource<bool> Started { get; } = new TaskCompletionSource<bool>(TaskCreationOptions.RunContinuationsAsynchronously);
            public CancellationToken? ObservedToken { get; private set; }
            public override string Name => "blocking";
            public override string Description => "blocks until cancelled";
            public override JsonObject InputSchema => new JsonObject();
            public override async Task<ToolResult> InvokeAsync(JsonElement? args, ProgressReporter progress, CancellationToken ct)
            {
                ObservedToken = ct;
                Started.TrySetResult(true);
                try
                {
                    await Task.Delay(Timeout.Infinite, ct).ConfigureAwait(false);
                    return ToolResult.Text("completed unexpectedly");
                }
                catch (OperationCanceledException)
                {
                    return ToolResult.Error("cancelled");
                }
            }
        }

        [Fact]
        public async Task NotificationsCancelled_CancelsRunningTool()
        {
            var input = new MirrorStream(new MemoryStream());
            var output = new MemoryStream();
            var transport = new StdioTransport(input, output);
            var registry = new ToolRegistry();
            var tool = new BlockingTool();
            registry.Register(tool);
            var roots = new RootsRegistry();
            var serverShutdown = new CancellationTokenSource();
            var server = new McpServer(transport, registry, roots, "test", "0.0.0", serverShutdown.Token);

            void Send(string s) => input.WriteForServerToRead(Encoding.UTF8.GetBytes(s + "\n"));

            // Initialize, then trigger the blocking tool with id 99.
            Send("{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"initialize\",\"params\":{\"protocolVersion\":\"2025-06-18\",\"capabilities\":{},\"clientInfo\":{\"name\":\"t\",\"version\":\"0\"}}}");
            Send("{\"jsonrpc\":\"2.0\",\"method\":\"notifications/initialized\"}");
            Send("{\"jsonrpc\":\"2.0\",\"id\":99,\"method\":\"tools/call\",\"params\":{\"name\":\"blocking\",\"arguments\":{}}}");

            var runTask = server.RunAsync();

            // Wait for the tool to start.
            await tool.Started.Task.WaitAsync(TimeSpan.FromSeconds(3));

            // Now cancel.
            Send("{\"jsonrpc\":\"2.0\",\"method\":\"notifications/cancelled\",\"params\":{\"requestId\":99}}");
            input.SignalEnd();

            await TestExtensions.WithTimeout(runTask, TimeSpan.FromSeconds(5));

            Assert.NotNull(tool.ObservedToken);
            Assert.True(tool.ObservedToken!.Value.IsCancellationRequested,
                "Expected the tool's CancellationToken to be cancelled by notifications/cancelled.");
        }
    }

    internal static class TaskExtensions
    {
        public static async Task WaitAsync(this Task task, TimeSpan timeout)
        {
            var done = await Task.WhenAny(task, Task.Delay(timeout));
            if (done != task) throw new TimeoutException("Operation exceeded " + timeout);
            await task;
        }
        public static async Task<T> WaitAsync<T>(this Task<T> task, TimeSpan timeout)
        {
            var done = await Task.WhenAny(task, Task.Delay(timeout));
            if (done != task) throw new TimeoutException("Operation exceeded " + timeout);
            return await task;
        }
    }
}
