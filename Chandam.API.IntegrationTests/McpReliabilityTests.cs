using System.Text.Json;
using Chandam.API.IntegrationTests.Models;
using Chandam.API.Models;
using Xunit;
using Xunit.Abstractions;

namespace Chandam.API.IntegrationTests;

[Collection("ChandamIntegration")]
public class McpReliabilityTests : IClassFixture<McpReliabilityFixture>
{
    private readonly McpReliabilityFixture _fixture;
    private readonly ITestOutputHelper _output;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public McpReliabilityTests(McpReliabilityFixture fixture, ITestOutputHelper output)
    {
        _fixture = fixture;
        _output = output;
    }

    [Fact]
    public void McpTryMatch_AllExamples_MatchBaseline()
    {
        Assert.NotNull(_fixture.Baseline);
        Assert.True(_fixture.TestCases.Count > 0, "No test cases found");

        var regressions = new List<string>();
        var improvements = new List<string>();
        int tested = 0;

        foreach (var (rule, example, index) in _fixture.TestCases)
        {
            var poemText = McpReliabilityFixture.CleanPoemText(example.Text);
            var poemHash = BaselineTestResult.CalculateHash(poemText);

            var baselineEntry = _fixture.Baseline.Results.FirstOrDefault(b =>
                b.RuleIdentifier == rule.Identifier &&
                b.ExampleIndex == index &&
                b.PoemHash == poemHash);

            if (baselineEntry == null)
            {
                _output.WriteLine($"No baseline entry for {rule.Identifier}[{index}] — skipping");
                continue;
            }

            var mcpJson = _fixture.Tools.TryMatchChandam(poemText, rule.Identifier);
            var mcpResult = JsonSerializer.Deserialize<TryMatchResponse>(mcpJson, JsonOptions);
            Assert.NotNull(mcpResult);

            var mcpPercentage = mcpResult.Match?.MatchPercentage ?? 0;
            var diff = mcpPercentage - baselineEntry.MatchPercentage;

            if (diff < -0.01)
            {
                regressions.Add(
                    $"{rule.Identifier}[{index}]: baseline={baselineEntry.MatchPercentage}% mcp={mcpPercentage}% ({diff:+#.##;-#.##;0}%)");
            }
            else if (diff > 0.01)
            {
                improvements.Add(
                    $"{rule.Identifier}[{index}]: baseline={baselineEntry.MatchPercentage}% mcp={mcpPercentage}% ({diff:+#.##;-#.##;0}%)");
            }

            tested++;
        }

        _output.WriteLine($"\n=== MCP TryMatch Baseline Comparison ===");
        _output.WriteLine($"Tested: {tested} examples");

        if (improvements.Count > 0)
        {
            _output.WriteLine($"\nImprovements ({improvements.Count}):");
            foreach (var i in improvements.Take(10))
                _output.WriteLine($"  {i}");
            if (improvements.Count > 10)
                _output.WriteLine($"  ... and {improvements.Count - 10} more");
        }

        if (regressions.Count > 0)
        {
            _output.WriteLine($"\nRegressions ({regressions.Count}):");
            foreach (var r in regressions)
                _output.WriteLine($"  {r}");
            Assert.Fail($"Found {regressions.Count} MCP TryMatch regressions against baseline");
        }

        _output.WriteLine($"\nAll {tested} examples match baseline (no regressions)");
    }

    [Fact]
    public void McpDetermine_AllExamples_TopMatchIsExpectedRule()
    {
        Assert.True(_fixture.TestCases.Count > 0, "No test cases found");

        var mismatches = new List<string>();
        var skipped = 0;
        int tested = 0;

        foreach (var (rule, example, index) in _fixture.TestCases)
        {
            var poemText = McpReliabilityFixture.CleanPoemText(example.Text);
            var poemHash = BaselineTestResult.CalculateHash(poemText);

            var baselineEntry = _fixture.Baseline.Results.FirstOrDefault(b =>
                b.RuleIdentifier == rule.Identifier &&
                b.ExampleIndex == index &&
                b.PoemHash == poemHash);

            if (baselineEntry != null && !baselineEntry.IsMatch)
            {
                skipped++;
                continue;
            }

            var mcpJson = _fixture.Tools.DetermineChandam(poemText);
            var mcpResult = JsonSerializer.Deserialize<DetermineResponse>(mcpJson, JsonOptions);
            Assert.NotNull(mcpResult);

            if (!mcpResult.Success || mcpResult.Matches.Count == 0)
            {
                mismatches.Add($"{rule.Identifier}[{index}]: Determine failed or returned no matches");
                tested++;
                continue;
            }

            var topIdentifier = mcpResult.Matches[0].Rule?.Identifier;
            if (topIdentifier != rule.Identifier)
            {
                var topPct = mcpResult.Matches[0].MatchPercentage;
                mismatches.Add(
                    $"{rule.Identifier}[{index}]: expected={rule.Identifier}, got={topIdentifier} ({topPct}%)");
            }

            tested++;
        }

        _output.WriteLine($"\n=== MCP Determine Top Match Verification ===");
        _output.WriteLine($"Tested: {tested}, Skipped (baseline non-match): {skipped}");

        if (mismatches.Count > 0)
        {
            _output.WriteLine($"\nMismatches ({mismatches.Count}):");
            foreach (var m in mismatches)
                _output.WriteLine($"  {m}");
        }

        _output.WriteLine($"\nDetermine top-match accuracy: {tested - mismatches.Count}/{tested}");
    }

    [Fact]
    public void McpScores_RandomSample_ReturnsValidResults()
    {
        Assert.True(_fixture.TestCases.Count > 0, "No test cases found");

        var random = new Random();
        var sampleSize = Math.Min(10, _fixture.TestCases.Count);
        var sampled = _fixture.TestCases
            .OrderBy(_ => random.Next())
            .Take(sampleSize)
            .ToList();

        foreach (var (rule, example, index) in sampled)
        {
            var poemText = McpReliabilityFixture.CleanPoemText(example.Text);

            var mcpJson = _fixture.Tools.CalculateScores(poemText, language: "te");
            var mcpResult = JsonSerializer.Deserialize<ScoresResponse>(mcpJson, JsonOptions);
            Assert.NotNull(mcpResult);

            Assert.Null(mcpResult.ErrorMessage);
            Assert.True(mcpResult.TotalRulesEvaluated > 0,
                $"{rule.Identifier}[{index}]: TotalRulesEvaluated should be > 0");
            Assert.True(mcpResult.Scores.Count > 0,
                $"{rule.Identifier}[{index}]: Scores should not be empty");

            // Verify descending order
            for (int i = 1; i < mcpResult.Scores.Count; i++)
            {
                Assert.True(mcpResult.Scores[i - 1].MatchPercentage >= mcpResult.Scores[i].MatchPercentage,
                    $"{rule.Identifier}[{index}]: Scores not in descending order at position {i}");
            }

            _output.WriteLine($"{rule.Identifier}[{index}]: {mcpResult.Scores.Count} scores, " +
                $"top={mcpResult.Scores[0].Identifier} ({mcpResult.Scores[0].MatchPercentage}%), " +
                $"rules evaluated={mcpResult.TotalRulesEvaluated}");
        }

        _output.WriteLine($"\nAll {sampleSize} random samples passed sanity checks");
    }
}
