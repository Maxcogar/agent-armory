using System;
using System.IO;
using System.Security;
using PowerMillMcpServer.Util;
using Xunit;

namespace PowerMillMcpServer.Tests
{
    public class SafePathTests
    {
        private static readonly string Root = Path.GetFullPath(Path.Combine(Path.GetTempPath(), "powermill-test-root"));

        public SafePathTests()
        {
            Directory.CreateDirectory(Root);
        }

        [Fact]
        public void Resolve_UnderRoot_Returns()
        {
            var sub = Path.Combine(Root, "project");
            Directory.CreateDirectory(sub);
            var result = SafePath.Resolve(new[] { Root }, sub);
            Assert.Equal(sub, result, ignoreCase: true);
        }

        [Fact]
        public void Resolve_RootItself_Returns()
        {
            var result = SafePath.Resolve(new[] { Root }, Root);
            Assert.Equal(Root, result, ignoreCase: true);
        }

        [Fact]
        public void Resolve_TraversalEscape_Throws()
        {
            var escape = Path.Combine(Root, "..", "..", "Windows");
            Assert.Throws<SecurityException>(() => SafePath.Resolve(new[] { Root }, escape));
        }

        [Fact]
        public void Resolve_AbsoluteOutsideRoot_Throws()
        {
            Assert.Throws<SecurityException>(() => SafePath.Resolve(new[] { Root }, @"C:\Windows\System32"));
        }

        [Fact]
        public void Resolve_NoRoots_Throws()
        {
            Assert.Throws<SecurityException>(() => SafePath.Resolve(Array.Empty<string>(), Path.Combine(Root, "x")));
        }

        [Fact]
        public void Resolve_EmptyPath_Throws()
        {
            Assert.Throws<ArgumentException>(() => SafePath.Resolve(new[] { Root }, ""));
        }

        [Fact]
        public void Resolve_SiblingNamePrefix_DoesNotEscape()
        {
            // Root is "C:\...\powermill-test-root". A sibling "powermill-test-root-evil"
            // shares a name prefix but must NOT be considered contained.
            var sibling = Path.GetFullPath(Path.Combine(Path.GetTempPath(), "powermill-test-root-evil", "stuff"));
            Assert.Throws<SecurityException>(() => SafePath.Resolve(new[] { Root }, sibling));
        }

        [Fact]
        public void Resolve_CaseInsensitiveOnWindows_Allowed()
        {
            var sub = Path.Combine(Root, "Project");
            Directory.CreateDirectory(sub);
            var lower = sub.ToLowerInvariant();
            var result = SafePath.Resolve(new[] { Root }, lower);
            Assert.True(result.Length > 0);
        }

        [Fact]
        public void IsContained_ExactRoot_True()
        {
            Assert.True(SafePath.IsContained(Root, Root));
        }

        [Fact]
        public void IsContained_SiblingPrefix_False()
        {
            var sibling = Path.GetFullPath(Path.Combine(Path.GetTempPath(), "powermill-test-root-evil"));
            Assert.False(SafePath.IsContained(Root, sibling));
        }
    }
}
