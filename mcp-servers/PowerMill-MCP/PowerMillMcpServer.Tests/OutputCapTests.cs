using PowerMillMcpServer.Util;
using Xunit;

namespace PowerMillMcpServer.Tests
{
    public class OutputCapTests
    {
        [Fact]
        public void Apply_Short_Unchanged()
        {
            var s = new string('a', 100);
            Assert.Equal(s, OutputCap.Apply(s));
        }

        [Fact]
        public void Apply_AtLimit_Unchanged()
        {
            var s = new string('a', OutputCap.DefaultMax);
            Assert.Equal(s, OutputCap.Apply(s));
        }

        [Fact]
        public void Apply_Over_Truncated()
        {
            var s = new string('a', OutputCap.DefaultMax + 500);
            var capped = OutputCap.Apply(s);
            Assert.True(capped.Length < s.Length);
            Assert.Contains("[truncated, 500 more chars omitted]", capped);
        }

        [Fact]
        public void Apply_Null_EmptyString()
        {
            Assert.Equal("", OutputCap.Apply(null!));
        }

        [Fact]
        public void Apply_CustomMax_Respected()
        {
            var capped = OutputCap.Apply(new string('x', 50), max: 10);
            Assert.Contains("[truncated, 40 more chars omitted]", capped);
            Assert.True(capped.StartsWith("xxxxxxxxxx"));
        }
    }
}
