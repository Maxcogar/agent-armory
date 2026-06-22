using System;
using System.IO;

namespace PowerMillMcpServer.Util
{
    /// Append-only file logger. Daily-rotated file in
    /// %LOCALAPPDATA%\PowerMillMcp\logs\powermill-mcp-{date}.log.
    /// Thread-safe. First-write failure is captured to stderr; subsequent
    /// failures are silenced to avoid recursive logging cascades.
    public sealed class FileLogger : ILogger
    {
        private readonly object _lock = new object();
        private readonly string _logDir;
        private string? _failureNote;

        public FileLogger() : this(DefaultDirectory()) { }

        public FileLogger(string logDirectory)
        {
            _logDir = logDirectory ?? throw new ArgumentNullException(nameof(logDirectory));
        }

        public static string DefaultDirectory()
        {
            var localAppData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
            return Path.Combine(localAppData, "PowerMillMcp", "logs");
        }

        public string LogDirectory => _logDir;

        public void Info(string format, params object[] args) => Write(LogLevel.Info, format, args);
        public void Warn(string format, params object[] args) => Write(LogLevel.Warn, format, args);
        public void Error(string format, params object[] args) => Write(LogLevel.Error, format, args);
        public void Error(Exception ex, string format, params object[] args) => Write(LogLevel.Error, format + " | " + ex, args);

        private void Write(LogLevel level, string format, object[] args)
        {
            string formatted;
            try { formatted = args != null && args.Length > 0 ? string.Format(format, args) : format; }
            catch { formatted = format; }

            var line = string.Format(
                "{0:yyyy-MM-ddTHH:mm:ss.fffK} [{1}] {2}{3}",
                DateTimeOffset.Now,
                level.ToString().ToUpperInvariant(),
                formatted,
                Environment.NewLine);

            try
            {
                lock (_lock)
                {
                    if (!Directory.Exists(_logDir)) Directory.CreateDirectory(_logDir);
                    var path = Path.Combine(_logDir, "powermill-mcp-" + DateTime.Now.ToString("yyyy-MM-dd") + ".log");
                    File.AppendAllText(path, line);
                }
            }
            catch (Exception ex)
            {
                if (_failureNote == null)
                {
                    _failureNote = ex.Message;
                    try { Console.Error.WriteLine("[FileLogger] failed: " + ex.Message); } catch { }
                }
            }
        }
    }
}
