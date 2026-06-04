using System;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using PowerMillMcpServer.Mcp;
using PowerMillMcpServer.Tools;
using Xunit;

namespace PowerMillMcpServer.Tests.Mcp
{
    /// #10: SendRequestAsync must time out if the host never sends a response.
    public class OutboundRequestTimeoutTests
    {
        [Fact]
        public async Task SendRequestAsync_TimesOut_WhenNoResponse()
        {
            // Input stream is empty / never produces frames. Output is unread.
            var input = new MirrorStream(new MemoryStream());
            var output = new MemoryStream();
            var transport = new StdioTransport(input, output);
            var registry = new ToolRegistry();
            var roots = new RootsRegistry();
            var shutdown = new CancellationTokenSource();
            var server = new McpServer(transport, registry, roots, "test", "0.0.0", shutdown.Token);

            // Compress the timeout for fast tests.
            server.SetOutboundTimeoutForTesting(TimeSpan.FromMilliseconds(200));

            // Run server in background so it's reading the (empty) input.
            var runTask = server.RunAsync();

            var sendTask = server.SendRequestAsync("roots/list", null, CancellationToken.None);
            var sw = System.Diagnostics.Stopwatch.StartNew();
            // ThrowsAnyAsync allows TaskCanceledException (which derives from OperationCanceledException).
            await Assert.ThrowsAnyAsync<OperationCanceledException>(async () => await sendTask);
            sw.Stop();

            Assert.True(sw.ElapsedMilliseconds < 2000, "Should have timed out near 200ms, took " + sw.ElapsedMilliseconds + "ms");

            // Cleanup.
            input.SignalEnd();
            await TestExtensions.WithTimeout(runTask, TimeSpan.FromSeconds(2));
        }
    }
}
