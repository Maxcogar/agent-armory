using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;

namespace PowerMillMcpServer.Util
{
    /// Thread-safe in-memory logger for tests. Captures every emitted line
    /// (already formatted) so assertions can inspect what was logged.
    public sealed class InMemoryLogger : ILogger
    {
        private readonly object _lock = new object();
        private readonly List<string> _lines = new List<string>();

        public IReadOnlyList<string> AllLines
        {
            get { lock (_lock) { return new ReadOnlyCollection<string>(new List<string>(_lines)); } }
        }

        public string LogDirectory => "<in-memory>";

        public void Info(string format, params object[] args) => Append("INFO", format, args, null);
        public void Warn(string format, params object[] args) => Append("WARN", format, args, null);
        public void Error(string format, params object[] args) => Append("ERROR", format, args, null);
        public void Error(Exception ex, string format, params object[] args) => Append("ERROR", format, args, ex);

        private void Append(string level, string format, object[] args, Exception? ex)
        {
            string formatted;
            try { formatted = args != null && args.Length > 0 ? string.Format(format, args) : format; }
            catch { formatted = format; }
            if (ex != null) formatted = formatted + " | " + ex;
            var line = "[" + level + "] " + formatted;
            lock (_lock) { _lines.Add(line); }
        }
    }
}
