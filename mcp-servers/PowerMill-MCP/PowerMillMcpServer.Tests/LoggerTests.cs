using System;
using System.IO;
using PowerMillMcpServer.Util;
using Xunit;

namespace PowerMillMcpServer.Tests
{
    public class FileLoggerTests
    {
        [Fact]
        public void Info_WritesLine_FileExists()
        {
            var dir = Path.Combine(Path.GetTempPath(), "powermill-logger-tests-" + Guid.NewGuid().ToString("N"));
            try
            {
                var logger = new FileLogger(dir);
                logger.Info("hello {0}", "world");
                Assert.True(Directory.Exists(dir));
                var files = Directory.GetFiles(dir, "*.log");
                Assert.Single(files);
                var content = File.ReadAllText(files[0]);
                Assert.Contains("hello world", content);
                Assert.Contains("[INFO]", content);
            }
            finally
            {
                if (Directory.Exists(dir)) Directory.Delete(dir, recursive: true);
            }
        }

        [Fact]
        public void Levels_AreEmittedSeparately()
        {
            var dir = Path.Combine(Path.GetTempPath(), "powermill-logger-tests-" + Guid.NewGuid().ToString("N"));
            try
            {
                var logger = new FileLogger(dir);
                logger.Info("info-line");
                logger.Warn("warn-line");
                logger.Error("error-line");
                var content = File.ReadAllText(Directory.GetFiles(dir, "*.log")[0]);
                Assert.Contains("[INFO] info-line", content);
                Assert.Contains("[WARN] warn-line", content);
                Assert.Contains("[ERROR] error-line", content);
            }
            finally
            {
                if (Directory.Exists(dir)) Directory.Delete(dir, recursive: true);
            }
        }

        [Fact]
        public void Error_WithException_IncludesExceptionInLine()
        {
            var dir = Path.Combine(Path.GetTempPath(), "powermill-logger-tests-" + Guid.NewGuid().ToString("N"));
            try
            {
                var logger = new FileLogger(dir);
                logger.Error(new InvalidOperationException("boom"), "context");
                var content = File.ReadAllText(Directory.GetFiles(dir, "*.log")[0]);
                Assert.Contains("context", content);
                Assert.Contains("InvalidOperationException", content);
                Assert.Contains("boom", content);
            }
            finally
            {
                if (Directory.Exists(dir)) Directory.Delete(dir, recursive: true);
            }
        }
    }

    public class InMemoryLoggerTests
    {
        [Fact]
        public void Info_AppendsToAllLines()
        {
            var logger = new InMemoryLogger();
            logger.Info("hello {0}", "world");
            Assert.Single(logger.AllLines);
            Assert.Contains("hello world", logger.AllLines[0]);
            Assert.Contains("[INFO]", logger.AllLines[0]);
        }

        [Fact]
        public void Multiple_Levels_Recorded()
        {
            var logger = new InMemoryLogger();
            logger.Warn("w");
            logger.Error("e");
            Assert.Equal(2, logger.AllLines.Count);
        }

        [Fact]
        public void AllLines_IsSnapshot()
        {
            var logger = new InMemoryLogger();
            logger.Info("first");
            var snap = logger.AllLines;
            logger.Info("second");
            Assert.Single(snap); // snapshot at time of read
            Assert.Equal(2, logger.AllLines.Count); // fresh read shows both
        }
    }
}
