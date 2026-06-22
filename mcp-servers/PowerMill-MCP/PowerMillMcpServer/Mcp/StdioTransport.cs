using System;
using System.IO;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

namespace PowerMillMcpServer.Mcp
{
    /// MCP stdio transport: newline-delimited JSON. One message per line, UTF-8.
    public sealed class StdioTransport : IDisposable
    {
        private readonly StreamReader _reader;
        private readonly StreamWriter _writer;
        private readonly SemaphoreSlim _writeLock = new SemaphoreSlim(1, 1);

        public StdioTransport()
        {
            var stdin = Console.OpenStandardInput();
            var stdout = Console.OpenStandardOutput();
            _reader = new StreamReader(stdin, new UTF8Encoding(false));
            _writer = new StreamWriter(stdout, new UTF8Encoding(false)) { AutoFlush = false, NewLine = "\n" };
        }

        /// Test-only constructor: drive the transport from in-process streams
        /// so end-to-end protocol behavior can be exercised without forking
        /// the exe.
        internal StdioTransport(Stream input, Stream output)
        {
            _reader = new StreamReader(input, new UTF8Encoding(false));
            _writer = new StreamWriter(output, new UTF8Encoding(false)) { AutoFlush = false, NewLine = "\n" };
        }

        public async Task<string?> ReadMessageAsync(CancellationToken ct)
        {
            while (!ct.IsCancellationRequested)
            {
                var line = await _reader.ReadLineAsync().ConfigureAwait(false);
                if (line == null) return null;
                if (string.IsNullOrWhiteSpace(line)) continue;
                return line;
            }
            return null;
        }

        public async Task WriteMessageAsync<T>(T message, JsonSerializerOptions options, CancellationToken ct)
        {
            var json = JsonSerializer.Serialize(message, options);
            await _writeLock.WaitAsync(ct).ConfigureAwait(false);
            try
            {
                await _writer.WriteLineAsync(json).ConfigureAwait(false);
                await _writer.FlushAsync().ConfigureAwait(false);
            }
            finally
            {
                _writeLock.Release();
            }
        }

        public void Dispose()
        {
            _writeLock.Dispose();
            _reader.Dispose();
            _writer.Dispose();
        }
    }
}
