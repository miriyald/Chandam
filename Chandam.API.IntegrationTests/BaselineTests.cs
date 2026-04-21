using Chandam.API.Services;
using Chandam.Rules;
using Xunit;
using Xunit.Abstractions;

namespace Chandam.API.IntegrationTests;

/// <summary>
/// Integration tests that verify examples match their baseline results
/// </summary>
public class BaselineTests
{
    private readonly ITestOutputHelper _output;
    private readonly ChandamService _service;
    private readonly RuleLoaderService _ruleLoader;
    private readonly BaselineGenerator _generator;

    private const string BaselineFilePath = "baseline-results.yaml";

    public BaselineTests(ITestOutputHelper output)
    {
        _output = output;

        // Initialize services
        var projectRoot = FindProjectRoot();
        var rulesPath = projectRoot != null ? Path.Combine(projectRoot, "Chandam.Config", "Rules") : null;

        _ruleLoader = new RuleLoaderService(rulesPath);
        _ruleLoader.LoadAllRuleSets();

        _service = new ChandamService(_ruleLoader);
        _generator = new BaselineGenerator(_service, _ruleLoader);
    }

    /// <summary>
    /// Generate baseline results (run this when intentionally updating baseline)
    /// </summary>
    [Fact(Skip = "Manual execution only - generates baseline")]
    public void GenerateBaselineResults()
    {
        _output.WriteLine("Generating baseline results for all examples...");

        var baseline = _generator.GenerateBaseline(RuleLanguage.Telugu);

        var outputPath = Path.Combine(FindProjectRoot() ?? ".", "Chandam.Config", "Baselines", BaselineFilePath);
        Directory.CreateDirectory(Path.GetDirectoryName(outputPath)!);

        BaselineGenerator.SaveBaseline(baseline, outputPath);

        _output.WriteLine($"Baseline generated: {baseline.TotalExamples} examples from {baseline.TotalRules} rules");
        _output.WriteLine($"Average match: {baseline.Summary.AverageMatchPercentage:F2}%");
    }

    /// <summary>
    /// Verify all examples match their baseline results
    /// </summary>
    [Fact]
    public void AllExamples_ShouldMatchBaseline()
    {
        // Load baseline
        var baselinePath = Path.Combine(FindProjectRoot() ?? ".", "Chandam.Config", "Baselines", BaselineFilePath);

        if (!File.Exists(baselinePath))
        {
            _output.WriteLine($"Baseline file not found at: {baselinePath}");
            _output.WriteLine("Run GenerateBaselineResults test to create baseline first");
            Assert.Fail("Baseline file not found. Generate baseline first.");
            return;
        }

        var baseline = BaselineGenerator.LoadBaseline(baselinePath);
        Assert.NotNull(baseline);

        _output.WriteLine($"Loaded baseline: {baseline.TotalExamples} examples");
        _output.WriteLine($"Baseline generated: {baseline.GeneratedAt:yyyy-MM-dd HH:mm:ss} UTC");

        // Generate current results
        var current = _generator.GenerateBaseline(RuleLanguage.Telugu);

        // Compare results
        var regressions = new List<string>();
        var improvements = new List<string>();

        foreach (var currentResult in current.Results)
        {
            var baselineResult = baseline.Results.FirstOrDefault(b =>
                b.RuleIdentifier == currentResult.RuleIdentifier &&
                b.ExampleIndex == currentResult.ExampleIndex &&
                b.PoemHash == currentResult.PoemHash);

            if (baselineResult == null)
            {
                _output.WriteLine($"New example found: {currentResult.RuleIdentifier}[{currentResult.ExampleIndex}]");
                continue;
            }

            // Check for ANY regression (match percentage decreased)
            // This domain is rigid and demanding - no tolerance for regressions
            var percentageDiff = currentResult.MatchPercentage - baselineResult.MatchPercentage;

            if (percentageDiff < -0.01) // Allow only 0.01% floating point tolerance
            {
                regressions.Add(
                    $"{currentResult.RuleIdentifier}[{currentResult.ExampleIndex}]: " +
                    $"{baselineResult.MatchPercentage}% → {currentResult.MatchPercentage}% " +
                    $"({percentageDiff:+#.##;-#.##;0}%)");
            }
            else if (percentageDiff > 0.01)
            {
                improvements.Add(
                    $"{currentResult.RuleIdentifier}[{currentResult.ExampleIndex}]: " +
                    $"{baselineResult.MatchPercentage}% → {currentResult.MatchPercentage}% " +
                    $"({percentageDiff:+#.##;-#.##;0}%)");
            }
        }

        // Report results
        _output.WriteLine($"\n=== Baseline Comparison Results ===");
        _output.WriteLine($"Total Examples Tested: {current.TotalExamples}");
        _output.WriteLine($"Average Match (Baseline): {baseline.Summary.AverageMatchPercentage:F2}%");
        _output.WriteLine($"Average Match (Current): {current.Summary.AverageMatchPercentage:F2}%");

        if (improvements.Count > 0)
        {
            _output.WriteLine($"\n✓ Improvements ({improvements.Count}):");
            foreach (var improvement in improvements.Take(10))
            {
                _output.WriteLine($"  {improvement}");
            }
            if (improvements.Count > 10)
                _output.WriteLine($"  ... and {improvements.Count - 10} more");
        }

        if (regressions.Count > 0)
        {
            _output.WriteLine($"\n✗ Regressions ({regressions.Count}):");
            foreach (var regression in regressions)
            {
                _output.WriteLine($"  {regression}");
            }

            Assert.Fail($"Found {regressions.Count} regressions in match percentages");
        }

        _output.WriteLine($"\n✓ All examples match baseline (no regressions detected)");
    }

    /// <summary>
    /// Verify high-confidence examples maintain high match percentage
    /// </summary>
    [Fact]
    public void HighConfidenceExamples_ShouldMaintainHighMatchRate()
    {
        var current = _generator.GenerateBaseline(RuleLanguage.Telugu);

        var lowMatches = current.Results.Where(r => r.MatchPercentage < 90).ToList();

        if (lowMatches.Any())
        {
            _output.WriteLine($"Found {lowMatches.Count} examples with <90% match:");
            foreach (var result in lowMatches.Take(10))
            {
                _output.WriteLine($"  {result.RuleName}[{result.ExampleIndex}]: {result.MatchPercentage}%");
            }
        }

        // This is informational - we expect some examples to have lower matches
        // But we want to track if this number changes significantly
        _output.WriteLine($"\nSummary:");
        _output.WriteLine($"  Perfect (100%): {current.Summary.PerfectMatches}");
        _output.WriteLine($"  High (>=90%): {current.Summary.HighMatches}");
        _output.WriteLine($"  Medium (70-89%): {current.Summary.MediumMatches}");
        _output.WriteLine($"  Low (<70%): {current.Summary.LowMatches}");

        // Assert that at least 30% of examples have >= 90% match (informational - actual rate varies based on rule set)
        // (This includes both "Perfect" and "High" categories)
        var highMatchRate = (double)current.Summary.HighMatches / current.TotalExamples;
        Assert.True(highMatchRate >= 0.30,
            $"Expected at least 30% of examples to have >=90% match, but only {highMatchRate:P} do");
    }

    private static string? FindProjectRoot()
    {
        // Start from the test assembly location instead of current directory
        // This is more reliable when running tests from different working directories
        var assemblyLocation = typeof(BaselineTests).Assembly.Location;
        var current = Path.GetDirectoryName(assemblyLocation);
        
        while (current != null)
        {
            var configPath = Path.Combine(current, "Chandam.Config", "Rules");
            if (Directory.Exists(configPath))
            {
                return current;
            }

            var parent = Directory.GetParent(current);
            current = parent?.FullName;
        }
        
        return null;
    }
}
