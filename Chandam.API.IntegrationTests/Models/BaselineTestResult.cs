using System.Security.Cryptography;
using System.Text;
using System.Text.Json.Serialization;

namespace Chandam.API.IntegrationTests.Models;

/// <summary>
/// Baseline test result for a single example
/// </summary>
public class BaselineTestResult
{
    [JsonPropertyName("ruleIdentifier")]
    public string RuleIdentifier { get; set; } = string.Empty;

    [JsonPropertyName("ruleName")]
    public string RuleName { get; set; } = string.Empty;

    [JsonPropertyName("exampleIndex")]
    public int ExampleIndex { get; set; }

    [JsonPropertyName("poemText")]
    public string PoemText { get; set; } = string.Empty;

    [JsonPropertyName("poemHash")]
    public string PoemHash { get; set; } = string.Empty;

    [JsonPropertyName("matchPercentage")]
    public double MatchPercentage { get; set; }

    [JsonPropertyName("isMatch")]
    public bool IsMatch { get; set; }

    [JsonPropertyName("yatiMatched")]
    public bool YatiMatched { get; set; }

    [JsonPropertyName("prasaMatched")]
    public bool PrasaMatched { get; set; }

    [JsonPropertyName("matchedLines")]
    public int MatchedLines { get; set; }

    [JsonPropertyName("totalLines")]
    public int TotalLines { get; set; }

    [JsonPropertyName("mismatchCount")]
    public int MismatchCount { get; set; }

    [JsonPropertyName("timestamp")]
    public DateTime Timestamp { get; set; }

    [JsonPropertyName("remarks")]
    public string? Remarks { get; set; }

    /// <summary>
    /// Calculate SHA256 hash of poem text for comparison
    /// </summary>
    public static string CalculateHash(string text)
    {
        if (string.IsNullOrEmpty(text))
            return string.Empty;

        using var sha256 = SHA256.Create();
        var bytes = Encoding.UTF8.GetBytes(text);
        var hash = sha256.ComputeHash(bytes);
        return Convert.ToBase64String(hash);
    }
}

/// <summary>
/// Baseline report for all tests
/// </summary>
public class BaselineReport
{
    [JsonPropertyName("version")]
    public string Version { get; set; } = "1.0";

    [JsonPropertyName("generatedAt")]
    public DateTime GeneratedAt { get; set; }

    [JsonPropertyName("totalRules")]
    public int TotalRules { get; set; }

    [JsonPropertyName("totalExamples")]
    public int TotalExamples { get; set; }

    [JsonPropertyName("results")]
    public List<BaselineTestResult> Results { get; set; } = new();

    [JsonPropertyName("summary")]
    public BaselineSummary Summary { get; set; } = new();
}

/// <summary>
/// Summary statistics for baseline report
/// </summary>
public class BaselineSummary
{
    [JsonPropertyName("perfectMatches")]
    public int PerfectMatches { get; set; }

    [JsonPropertyName("highMatches")]
    public int HighMatches { get; set; } // >= 90%

    [JsonPropertyName("mediumMatches")]
    public int MediumMatches { get; set; } // 70-89%

    [JsonPropertyName("lowMatches")]
    public int LowMatches { get; set; } // < 70%

    [JsonPropertyName("averageMatchPercentage")]
    public double AverageMatchPercentage { get; set; }

    [JsonPropertyName("minMatchPercentage")]
    public double MinMatchPercentage { get; set; }

    [JsonPropertyName("maxMatchPercentage")]
    public double MaxMatchPercentage { get; set; }
}
