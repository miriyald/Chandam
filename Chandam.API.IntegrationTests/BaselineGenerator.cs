using Chandam.API.IntegrationTests.Models;
using Chandam.API.Models;
using Chandam.API.Services;
using Chandam.Rules;
using YamlDotNet.Serialization;
using YamlDotNet.Serialization.NamingConventions;

namespace Chandam.API.IntegrationTests;

/// <summary>
/// Generates baseline test results for all rule examples
/// </summary>
public class BaselineGenerator
{
    private readonly ChandamService _service;
    private readonly RuleLoaderService _ruleLoader;

    public BaselineGenerator(ChandamService service, RuleLoaderService ruleLoader)
    {
        _service = service;
        _ruleLoader = ruleLoader;
    }

    /// <summary>
    /// Generate baseline report for all rules and examples
    /// </summary>
    public BaselineReport GenerateBaseline(RuleLanguage? language = null)
    {
        Console.WriteLine("Generating baseline test results...");

        var report = new BaselineReport
        {
            GeneratedAt = DateTime.UtcNow,
            Results = new List<BaselineTestResult>()
        };

        var rules = _ruleLoader.GetAllRules(language);
        report.TotalRules = rules.Count;

        int totalExamples = 0;
        int processedExamples = 0;

        foreach (var rule in rules)
        {
            if (rule.Examples2 == null || rule.Examples2.Length == 0)
                continue;

            Console.WriteLine($"Testing rule: {rule.Name} ({rule.Identifier}) - {rule.Examples2.Length} examples");

            for (int i = 0; i < rule.Examples2.Length; i++)
            {
                var example = rule.Examples2[i];
                totalExamples++;

                try
                {
                    var result = TestExample(rule, example, i);
                    report.Results.Add(result);
                    processedExamples++;

                    if (processedExamples % 10 == 0)
                    {
                        Console.WriteLine($"  Processed {processedExamples}/{totalExamples} examples...");
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"  Error testing example {i} for rule {rule.Identifier}: {ex.Message}");
                }
            }
        }

        report.TotalExamples = totalExamples;
        report.Summary = CalculateSummary(report.Results);

        Console.WriteLine($"\nBaseline generation complete:");
        Console.WriteLine($"  Total Rules: {report.TotalRules}");
        Console.WriteLine($"  Total Examples: {report.TotalExamples}");
        Console.WriteLine($"  Perfect Matches (100%): {report.Summary.PerfectMatches}");
        Console.WriteLine($"  High Matches (>=90%): {report.Summary.HighMatches}");
        Console.WriteLine($"  Medium Matches (70-89%): {report.Summary.MediumMatches}");
        Console.WriteLine($"  Low Matches (<70%): {report.Summary.LowMatches}");
        Console.WriteLine($"  Average Match: {report.Summary.AverageMatchPercentage:F2}%");

        return report;
    }

    /// <summary>
    /// Test a single example against its rule
    /// </summary>
    private BaselineTestResult TestExample(Rule rule, Example example, int index)
    {
        // Separate poem text from remarks (~ notation)
        var poemText = example.Text;
        string? remarks = null;

        var tildeIndex = poemText.IndexOf('~');
        if (tildeIndex >= 0)
        {
            remarks = poemText.Substring(tildeIndex + 1).Trim();
            poemText = poemText.Substring(0, tildeIndex).Trim();
        }

        var request = new TryMatchRequest
        {
            PoemText = poemText,
            RuleIdentifier = rule.Identifier,
            MatchYati = true,
            MatchPrasa = true,
            SoundexSandhi = true
        };

        var response = _service.TryMatch(request);

        var result = new BaselineTestResult
        {
            RuleIdentifier = rule.Identifier,
            RuleName = rule.Name,
            ExampleIndex = index,
            PoemText = poemText,
            PoemHash = BaselineTestResult.CalculateHash(poemText),
            MatchPercentage = response.Match?.MatchPercentage ?? 0,
            IsMatch = response.IsMatch,
            Timestamp = DateTime.UtcNow,
            Remarks = remarks
        };

        if (response.Match != null)
        {
            var errors = response.Match.Errors;
            result.YatiMatched = !(errors?.Any(e => e.MismatchType == "Yati" || e.MismatchType == "PrasaYati") ?? false);
            result.PrasaMatched = !(errors?.Any(e =>
                e.MismatchType == "Prasa" || e.MismatchType == "AnthyaPrasa" ||
                e.MismatchType == "PrasaYati" || e.MismatchType == "PrasaPoorva" ||
                e.MismatchType == "AnthyaPrasaPoorva" || e.MismatchType == "PrasaPoorvaBindu" ||
                e.MismatchType == "AnthyaPrasaPoorvaBindu" || e.MismatchType == "PrasaPoorvaVisarga" ||
                e.MismatchType == "AnthyaPrasaPoorvaVisarga") ?? false);
            var linesWithErrors = errors?.Select(e => e.Line).Distinct().Count() ?? 0;
            result.TotalLines = response.Match.Total > 0 ? response.Match.Total : 0;
            result.MatchedLines = Math.Max(0, result.TotalLines - linesWithErrors);
            result.MismatchCount = errors?.Count ?? 0;
        }

        return result;
    }

    /// <summary>
    /// Calculate summary statistics
    /// </summary>
    private BaselineSummary CalculateSummary(List<BaselineTestResult> results)
    {
        if (results.Count == 0)
        {
            return new BaselineSummary();
        }

        var summary = new BaselineSummary
        {
            PerfectMatches = results.Count(r => r.MatchPercentage == 100),
            HighMatches = results.Count(r => r.MatchPercentage >= 90),
            MediumMatches = results.Count(r => r.MatchPercentage >= 70 && r.MatchPercentage < 90),
            LowMatches = results.Count(r => r.MatchPercentage < 70),
            AverageMatchPercentage = results.Average(r => r.MatchPercentage),
            MinMatchPercentage = results.Min(r => r.MatchPercentage),
            MaxMatchPercentage = results.Max(r => r.MatchPercentage)
        };

        return summary;
    }

    /// <summary>
    /// Save baseline report to YAML file
    /// </summary>
    public static void SaveBaseline(BaselineReport report, string filePath)
    {
        var serializer = new SerializerBuilder()
            .WithNamingConvention(CamelCaseNamingConvention.Instance)
            .ConfigureDefaultValuesHandling(DefaultValuesHandling.OmitNull)
            .Build();

        var yaml = serializer.Serialize(report);
        File.WriteAllText(filePath, yaml);
        Console.WriteLine($"\nBaseline saved to: {filePath}");
    }

    /// <summary>
    /// Load baseline report from YAML file
    /// </summary>
    public static BaselineReport? LoadBaseline(string filePath)
    {
        if (!File.Exists(filePath))
            return null;

        var yaml = File.ReadAllText(filePath);
        var deserializer = new DeserializerBuilder()
            .WithNamingConvention(CamelCaseNamingConvention.Instance)
            .Build();

        return deserializer.Deserialize<BaselineReport>(yaml);
    }
}
