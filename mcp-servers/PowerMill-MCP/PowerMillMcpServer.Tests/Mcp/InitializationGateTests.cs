using System;
using System.IO;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using PowerMillMcpServer.Mcp;
using PowerMillMcpServer.Tools;
using Xunit;

namespace PowerMillMcpServer.Tests.Mcp
{
    /// End-to-end protocol tests using in-process streams — verifies the
    /// initialization gate refuses non-init/ping requests until
    /// notifications/initialized has arrived.
    public class InitializationGateTests
    {
        private static (Stream input, MemoryStream output, Func<string[]> readResponses, Action<string> writeFrame, Func<Task> close)
            BuildStreams()
        {
            // Use AnonymousPipes via in-memory streams. The "input" stream is
            // what the server reads from — we write to a separate end of it.
            var inputBuffer = new MemoryStream();
            var inputReadable = new MirrorStream(inputBuffer);
            var output = new MemoryStream();

            void WriteFrame(string json)
            {
                var bytes = Encoding.UTF8.GetBytes(json + "\n");
                lock (inputBuffer) { inputBuffer.Write(bytes, 0, bytes.Length); inputBuffer.Flush(); }
            }
            string[] ReadResponses()
            {
                lock (output)
                {
                    output.Flush();
                    var bytes = output.ToArray();
                    return Encoding.UTF8.GetString(bytes).Split(new[] { '\n' }, StringSplitOptions.RemoveEmptyEntries);
                }
            }
            Task Close()
            {
                inputReadable.SignalEnd();
                return Task.CompletedTask;
            }

            return (inputReadable, output, ReadResponses, WriteFrame, Close);
        }

        [Fact]
        public async Task ToolsList_BeforeInitialized_ReturnsServerNotInitialized()
        {
            var (input, output, readResponses, writeFrame, close) = BuildStreams();
            var transport = new StdioTransport(input, output);
            var registry = new ToolRegistry();
            var roots = new RootsRegistry();
            var cts = new CancellationTokenSource();
            var server = new McpServer(transport, registry, roots, "test", "0.0.0", cts.Token);

            writeFrame("{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"initialize\",\"params\":{\"protocolVersion\":\"2025-06-18\",\"capabilities\":{},\"clientInfo\":{\"name\":\"t\",\"version\":\"0\"}}}");
            writeFrame("{\"jsonrpc\":\"2.0\",\"id\":2,\"method\":\"tools/list\"}");
            await close();

            await TestExtensions.WithTimeout(server.RunAsync(), TimeSpan.FromSeconds(5));
            // Give async handlers a moment to drain into the output buffer.
            await Task.Delay(150);

            var lines = readResponses();
            Assert.Equal(2, lines.Length);
            // First line: initialize result — has protocolVersion.
            Assert.Contains("\"protocolVersion\"", lines[0]);
            // Second line: tools/list before initialized → error -32002.
            Assert.Contains("-32002", lines[1]);
            Assert.Contains("Server not initialized", lines[1]);
        }

        [Fact]
        public async Task ToolsList_AfterInitialized_Succeeds()
        {
            var (input, output, readResponses, writeFrame, close) = BuildStreams();
            var transport = new StdioTransport(input, output);
            var registry = new ToolRegistry();
            var roots = new RootsRegistry();
            var cts = new CancellationTokenSource();
            var server = new McpServer(transport, registry, roots, "test", "0.0.0", cts.Token);

            writeFrame("{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"initialize\",\"params\":{\"protocolVersion\":\"2025-06-18\",\"capabilities\":{},\"clientInfo\":{\"name\":\"t\",\"version\":\"0\"}}}");
            writeFrame("{\"jsonrpc\":\"2.0\",\"method\":\"notifications/initialized\"}");
            writeFrame("{\"jsonrpc\":\"2.0\",\"id\":2,\"method\":\"tools/list\"}");
            await close();

            await TestExtensions.WithTimeout(server.RunAsync(), TimeSpan.FromSeconds(5));
            // Give async handlers a moment to drain into the output buffer.
            await Task.Delay(150);

            var lines = readResponses();
            Assert.Equal(2, lines.Length);
            Assert.Contains("\"tools\"", lines[1]);
            Assert.DoesNotContain("-32002", lines[1]);
        }

        [Fact]
        public async Task Ping_BeforeInitialized_Allowed()
        {
            var (input, output, readResponses, _, close) = BuildStreams();
            var transport = new StdioTransport(input, output);
            var registry = new ToolRegistry();
            var roots = new RootsRegistry();
            var cts = new CancellationTokenSource();
            var server = new McpServer(transport, registry, roots, "test", "0.0.0", cts.Token);

            // Manually write a single ping frame.
            void WriteRaw(string s)
            {
                var rawBytes = Encoding.UTF8.GetBytes(s + "\n");
                ((MirrorStream)input).WriteForServerToRead(rawBytes);
            }
            WriteRaw("{\"jsonrpc\":\"2.0\",\"id\":99,\"method\":\"ping\"}");
            await close();

            await TestExtensions.WithTimeout(server.RunAsync(), TimeSpan.FromSeconds(5));
            // Give async handlers a moment to drain into the output buffer.
            await Task.Delay(150);

            var lines = readResponses();
            Assert.Single(lines);
            Assert.Contains("\"result\"", lines[0]);
            Assert.DoesNotContain("error", lines[0]);
        }
    }

    internal static class TestExtensions
    {
        public static async Task WithTimeout(Task task, TimeSpan timeout)
        {
            var done = await Task.WhenAny(task, Task.Delay(timeout));
            if (done != task) throw new TimeoutException("Operation exceeded " + timeout);
            await task;
        }
    }

    /// MemoryStream-like stream that the server reads from. Test code writes
    /// frames into it, then SignalEnd() to end the read loop. Internal usage
    /// only — do not use in production.
    internal sealed class MirrorStream : Stream
    {
        private readonly MemoryStream _buffer;
        private readonly object _lock = new object();
        private int _readPos;
        private bool _ended;
        private readonly System.Threading.ManualResetEventSlim _dataReady = new System.Threading.ManualResetEventSlim();

        public MirrorStream(MemoryStream buffer) { _buffer = buffer; }

        public void WriteForServerToRead(byte[] data)
        {
            lock (_lock) { _buffer.Position = _buffer.Length; _buffer.Write(data, 0, data.Length); }
            _dataReady.Set();
        }

        public void SignalEnd() { _ended = true; _dataReady.Set(); }

        public override bool CanRead => true;
        public override bool CanSeek => false;
        public override bool CanWrite => false;
        public override long Length => _buffer.Length;
        public override long Position { get => _readPos; set => throw new NotSupportedException(); }
        public override void Flush() { }
        public override long Seek(long offset, SeekOrigin origin) => throw new NotSupportedException();
        public override void SetLength(long value) => throw new NotSupportedException();
        public override void Write(byte[] buffer, int offset, int count) => throw new NotSupportedException();

        public override int Read(byte[] buffer, int offset, int count)
        {
            while (true)
            {
                lock (_lock)
                {
                    long available = _buffer.Length - _readPos;
                    if (available > 0)
                    {
                        int toRead = (int)Math.Min(available, count);
                        _buffer.Position = _readPos;
                        int n = _buffer.Read(buffer, offset, toRead);
                        _readPos += n;
                        return n;
                    }
                }
                if (_ended) return 0; // EOF
                _dataReady.Wait(50);
                _dataReady.Reset();
            }
        }
    }
}
