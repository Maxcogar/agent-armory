using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using PowerMillMcpServer.IntegrationTests.Fixtures;
using PowerMillMcpServer.Mcp;
using PowerMillMcpServer.Tools;
using Xunit;
using Xunit.Abstractions;

namespace PowerMillMcpServer.IntegrationTests
{
    /// One-off probes against the live PowerMill to discover macro syntax we
    /// don't have docs for. Runs read-only commands (PRINT VERSION, PRINT TERMS,
    /// PRINT VALUE, etc.) and dumps the responses. Use to learn syntax before
    /// wrapping it in a typed tool.
    [Collection("Live")]
    public class T13_MacroProbeTests
    {
        private readonly LiveSessionFixture _f;
        private readonly ITestOutputHelper _out;
        public T13_MacroProbeTests(LiveSessionFixture f, ITestOutputHelper output) { _f = f; _out = output; }

        private async Task<string> Probe(string cmd)
        {
            var args = JsonDocument.Parse(
                "{\"commands\":[\"" + cmd.Replace("\\", "\\\\").Replace("\"", "\\\"") + "\"]," +
                "\"confirm_destructive\":true,\"capture_last_response\":true}").RootElement;
            var result = await new RunMacroTool(_f.Deps).InvokeAsync(args, ProgressReporter.NoOp, CancellationToken.None);
            using var doc = JsonDocument.Parse(result.Content[0].Text);
            if (result.IsError) return "ERROR: " + result.Content[0].Text;
            return doc.RootElement.TryGetProperty("response", out var r) ? (r.GetString() ?? "") : "(no response field)";
        }

        [IntegrationFact]
        public async Task PrintVersion_Sanity()
        {
            var r = await Probe("PRINT VERSION");
            _out.WriteLine("PRINT VERSION -> [" + r + "]");
        }

        [IntegrationFact]
        public async Task PrintTerms_FromGrammarRoot()
        {
            // Try a few known-introspective commands to find what reflection
            // PowerMill exposes.
            foreach (var cmd in new[] { "PRINT TERMS", "TERMS", "HELP", "PRINT FORMAT FEATURESET" })
            {
                var r = await Probe(cmd);
                _out.WriteLine($"{cmd,-32} -> [{r}]");
            }
        }

        [IntegrationFact]
        public async Task QueryParameter_DrillEntity()
        {
            // The parameter tree is reflective. Read existing project state
            // for hints about the drill/featureset shape.
            var qp = new QueryParameterTool(_f.Deps);
            foreach (var path in new[]
            {
                "powermill.version",
                "project_pathname(false)",
                "extract(folder('FeatureSet'),'name')",
                "extract(folder('Toolpath'),'name')",
                "components(folder('FeatureSet'))",
            })
            {
                var args = JsonDocument.Parse("{\"path\":\"" + path.Replace("\"", "\\\"") + "\"}").RootElement;
                var r = await qp.InvokeAsync(args, ProgressReporter.NoOp, CancellationToken.None);
                using var doc = JsonDocument.Parse(r.Content[0].Text);
                var val = r.IsError ? "ERROR: " + r.Content[0].Text :
                    (doc.RootElement.TryGetProperty("value", out var v) ? v.GetString() : "(no value)");
                _out.WriteLine($"{path,-50} -> [{val}]");
            }
        }

        [IntegrationFact]
        public async Task InspectActualProject_WhatsThereForDrilling()
        {
            // Read what's actually in Max's open project — model name, hierarchy
            // sample, existing featuresets if any, what surfaces look like.
            // No guessing about workflow until I see what he's working with.
            var qp = new QueryParameterTool(_f.Deps);
            string[] paths = {
                "project_pathname(false)",
                "size(folder('Model'))",
                "size(folder('FeatureSet'))",
                "size(folder('Boundary'))",
                "size(folder('Pattern'))",
                "size(folder('Toolpath'))",
                "extract(folder('Model'),'name')",
                "extract(folder('FeatureSet'),'name')",
                "extract(folder('Toolpath'),'strategy')",
                "extract(folder('Toolpath'),'name')",
                "entity('model','').Hierarchy.Name",
                "entity('model','').Hierarchy.num_children",
                "entity('model','').num_components",
            };
            foreach (var p in paths)
            {
                var args = JsonDocument.Parse("{\"path\":\"" + p.Replace("\"", "\\\"") + "\"}").RootElement;
                var r = await qp.InvokeAsync(args, ProgressReporter.NoOp, CancellationToken.None);
                using var doc = JsonDocument.Parse(r.Content[0].Text);
                var val = r.IsError ? "ERR: " + r.Content[0].Text :
                    (doc.RootElement.TryGetProperty("value", out var v) ? v.GetString() : "(no value)");
                _out.WriteLine(p.PadRight(56) + " -> " + (string.IsNullOrEmpty(val) ? "(empty)" : val));
            }
        }

        [IntegrationFact]
        public async Task InspectModelHierarchy_FindHoleNamedNodes()
        {
            // The official Autodesk macro guide shows walking model.Hierarchy
            // and checking node names for "Hole". See if his Turbine Housing
            // model has nodes named anything hole-related.
            var qp = new QueryParameterTool(_f.Deps);
            // Try several path forms to see what works on his actual model.
            string[] paths = {
                "entity('model','').Hierarchy",
                "entity('model','1').Hierarchy.Children",
                "extract(entity('model','').Hierarchy.Children,'Name')",
                "entity('model','').num_components",
            };
            foreach (var p in paths)
            {
                var args = JsonDocument.Parse("{\"path\":\"" + p.Replace("\"", "\\\"") + "\"}").RootElement;
                var r = await qp.InvokeAsync(args, ProgressReporter.NoOp, CancellationToken.None);
                using var doc = JsonDocument.Parse(r.Content[0].Text);
                var val = r.IsError ? "ERR: " + r.Content[0].Text :
                    (doc.RootElement.TryGetProperty("value", out var v) ? v.GetString() : "(no value)");
                _out.WriteLine(p.PadRight(60) + " -> " + (string.IsNullOrEmpty(val) ? "(empty)" : val.Length > 200 ? val.Substring(0, 200) + "..." : val));
            }
        }

        [IntegrationFact]
        public async Task ProbeGrammar_BasedOnVocabFinds()
        {
            // Tokens taken from sys/hci/powermill.ndb/source/table/vocab.
            string[] partials = {
                "RECOGNISE",
                "EDIT FEATURESET ; RECOGNISE",
                "CREATE FEATURESET RECOGNISE",
                "HOLECREATION",
                "HOLEFACTORY",
                "HOLESEL",
                "FORM HOLECREATION",
                "FORM HOLEFACTORY",
                "FORM HOLE_TAGGING",
                "EDIT FEATURESET ; HOLE",
                "EDIT FEATURESET ; HOLES",
                "EDIT FEATURESET ; HOLES RECOGNISE",
                "EDIT FEATURESET ; CIRCLES",
                "EDIT FEATURESET ; FROM",
                "EDIT FEATURESET ; FROM SELECTION",
            };
            foreach (var cmd in partials)
            {
                var r = await Probe(cmd);
                _out.WriteLine("==== " + cmd + " ====");
                // Just last 2KB of response so output isn't enormous
                if (r.Length > 2000) r = "..." + r.Substring(r.Length - 2000);
                _out.WriteLine(r);
                _out.WriteLine("");
            }
        }

        [IntegrationFact]
        public async Task ProbeGrammar_WithEcho_TriggerParserErrors()
        {
            // Turn echo on so parser feedback flows into ExecuteEx responses,
            // then send commands followed by a sentinel garbage token. The
            // garbage forces a mid-rule rejection which dumps the valid
            // continuations from THAT context (not the top-level grammar).
            await Probe("ECHO ON DCPDEBUG TRACE COMMAND ACCEPT");
            string[] partials = {
                "CREATE FEATURESET ZZZSENTINEL",
                "EDIT FEATURESET ; ZZZSENTINEL",
                "EDIT FEATURESET ; HOLES ZZZSENTINEL",
                "EDIT FEATURESET ; FEATURE ZZZSENTINEL",
                "EDIT FEATURESET ; ADD ZZZSENTINEL",
                "EDIT FEATURESET ; INSERT ZZZSENTINEL",
                "EDIT FEATURESET ; CREATE ZZZSENTINEL",
                "FEATURE ZZZSENTINEL",
                "DRILL ZZZSENTINEL",
                "DRILLMAIN ZZZSENTINEL",
                "FEATURESELECT ZZZSENTINEL",
                "EDIT MODEL ; SELSURFACE ZZZSENTINEL",
                "PRINT SELFEATURES ZZZSENTINEL",
                "PRINT SELSURFACE ZZZSENTINEL",
            };
            foreach (var cmd in partials)
            {
                var r = await Probe(cmd);
                _out.WriteLine("==== " + cmd + " ====");
                _out.WriteLine(r);
                _out.WriteLine("");
            }
            await Probe("ECHO OFF DCPDEBUG UNTRACE COMMAND ACCEPT");
        }

        [IntegrationFact]
        public async Task ProbeGrammar_FeatureSet_Drill_Pick()
        {
            // PowerMill's parser dumps "Commands available after [...]" on
            // partial input. Use it to discover the actual grammar.
            string[] partials = {
                "CREATE",
                "CREATE FEATURESET",
                "CREATE FEATURE",
                "EDIT",
                "EDIT FEATURESET",
                "EDIT FEATURESET ;",
                "FEATURE",
                "FEATURESELECT",
                "DRILL",
                "DRILLMAIN",
                "PICK",
                "SELECT",
                "SELECT FEATURE",
                "IMPORT",
                "PMILLHELP",
                "EDIT DRILL",
            };
            foreach (var cmd in partials)
            {
                var r = await Probe(cmd);
                _out.WriteLine("==== " + cmd + " ====");
                // Extract just the "Commands available after ..." section so
                // output is readable.
                var idx = r.IndexOf("Commands available", System.StringComparison.Ordinal);
                _out.WriteLine(idx >= 0 ? r.Substring(idx) : r);
                _out.WriteLine("");
            }
        }

        [IntegrationFact]
        public async Task RecordMacro_OneSecondSnapshot()
        {
            // Start recording, do nothing, stop. Tests the recording plumbing.
            var path = System.IO.Path.Combine(_f.TempProjectsRoot, "probe_empty.mac");
            var start = await new StartMacroRecordingTool(_f.Deps).InvokeAsync(
                JsonDocument.Parse("{\"output_path\":\"" + path.Replace("\\", "\\\\") + "\"}").RootElement,
                ProgressReporter.NoOp, CancellationToken.None);
            _out.WriteLine("start -> " + start.Content[0].Text);

            await Task.Delay(500);

            var stop = await new StopMacroRecordingTool(_f.Deps).InvokeAsync(
                JsonDocument.Parse("{\"output_path\":\"" + path.Replace("\\", "\\\\") + "\"}").RootElement,
                ProgressReporter.NoOp, CancellationToken.None);
            _out.WriteLine("stop -> " + stop.Content[0].Text);
        }
    }
}
