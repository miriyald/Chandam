using System.Text.Json;
using Chandam.API.Services;
using Chandam.Dictionary.Cache;
using Chandam.Dictionary.Services;
using Chandam.MCP.Tools;

namespace Chandam.MCP.Tests;

public class ChandamToolsTests
{
    private readonly ChandamTools _tools;

    // Indravajramu test poem (97% match expected)
    private const string TestPoem = @"సామర్థ్యలీలన్ తతజద్విగంబుల్
భూమిధ్రవిశ్రాంతుల బొంది యొప్పున్
ప్రేమంబుతో నైందవబింబవక్త్రున్
హేమాంబురుం బాడుదు రింద్రవజ్రన్";

    public ChandamToolsTests()
    {
        var rulesPath = FindRulesDirectory();
        var ruleLoader = new RuleLoaderService(rulesPath);
        ruleLoader.LoadAllRuleSets();
        var service = new ChandamService(ruleLoader);
        var dictionaryService = new DictionaryService([], new DiskCache("test-cache"));
        _tools = new ChandamTools(service, ruleLoader, dictionaryService);
    }

    [Fact]
    public void DetermineChandam_WithValidPoem_ReturnsBestMatch()
    {
        var result = _tools.DetermineChandam(TestPoem);
        var json = JsonDocument.Parse(result);

        Assert.True(json.RootElement.GetProperty("Success").GetBoolean());
        var matches = json.RootElement.GetProperty("Matches");
        Assert.True(matches.GetArrayLength() > 0);
    }

    [Fact]
    public void DetermineChandam_EmptyPoem_ReturnsError()
    {
        var result = _tools.DetermineChandam("");
        var json = JsonDocument.Parse(result);

        Assert.False(json.RootElement.GetProperty("Success").GetBoolean());
    }

    [Fact]
    public void TryMatchChandam_WithCorrectRule_ReturnsMatch()
    {
        var result = _tools.TryMatchChandam(TestPoem, "iMdravajramu");
        var json = JsonDocument.Parse(result);

        Assert.True(json.RootElement.GetProperty("IsMatch").GetBoolean());
        var match = json.RootElement.GetProperty("Match");
        Assert.True(match.GetProperty("MatchPercentage").GetInt32() > 80);
    }

    [Fact]
    public void TryMatchChandam_InvalidRule_ReturnsError()
    {
        var result = _tools.TryMatchChandam(TestPoem, "nonexistent_rule");
        var json = JsonDocument.Parse(result);

        Assert.False(json.RootElement.GetProperty("IsMatch").GetBoolean());
    }

    [Fact]
    public void CalculateScores_ReturnsRankedResults()
    {
        var result = _tools.CalculateScores(TestPoem, language: "te", min_percentage: 50);
        var json = JsonDocument.Parse(result);

        var scores = json.RootElement.GetProperty("Scores");
        Assert.True(scores.GetArrayLength() > 0);

        // Should be ordered by match percentage descending
        var firstScore = scores[0].GetProperty("MatchPercentage").GetDouble();
        Assert.True(firstScore >= 50);
    }

    [Fact]
    public void GetRuleInfo_ReturnsRuleDetails()
    {
        var result = _tools.GetRuleInfo("iMdravajramu");
        var json = JsonDocument.Parse(result);

        Assert.Equal("iMdravajramu", json.RootElement.GetProperty("Identifier").GetString());
        Assert.False(string.IsNullOrEmpty(json.RootElement.GetProperty("Name").GetString()));
    }

    [Fact]
    public void GetRuleInfo_WithExamples_IncludesExamples()
    {
        var result = _tools.GetRuleInfo("iMdravajramu", include_examples: true);
        var json = JsonDocument.Parse(result);

        Assert.True(json.RootElement.TryGetProperty("Examples", out var examples));
        Assert.True(examples.GetArrayLength() > 0);
    }

    [Fact]
    public void GetExamples_ReturnsExamplePoems()
    {
        var result = _tools.GetExamples("iMdravajramu", max_examples: 3);
        var json = JsonDocument.Parse(result);

        var examples = json.RootElement.GetProperty("Examples");
        Assert.True(examples.GetArrayLength() > 0);
        Assert.True(examples.GetArrayLength() <= 3);
    }

    [Fact]
    public void ListRules_Telugu_ReturnsRules()
    {
        var result = _tools.ListRules("te");
        var json = JsonDocument.Parse(result);

        // Response is now grouped by Type > SubType > ChandamName
        Assert.True(json.RootElement.GetArrayLength() > 0);
        var firstType = json.RootElement[0];
        Assert.True(firstType.TryGetProperty("Type", out _));
        Assert.True(firstType.TryGetProperty("SubTypes", out _));
    }

    [Theory]
    [InlineData("te")]
    [InlineData("tel")]
    [InlineData("Telugu")]
    public void DetermineChandam_AllLanguageCodes_Work(string lang)
    {
        var result = _tools.DetermineChandam(TestPoem, language: lang);
        var json = JsonDocument.Parse(result);

        Assert.True(json.RootElement.GetProperty("Success").GetBoolean());
    }

    [Fact]
    public void DetermineChandam_ResultContainsTelugu()
    {
        var result = _tools.DetermineChandam(TestPoem);

        // Verify Telugu text is preserved (not replaced with English)
        Assert.Contains("ఇంద్రవజ్ర", result);
    }

    /// <summary>
    /// Walk up from test bin directory to find Chandam.Config/Rules
    /// </summary>
    private static string? FindRulesDirectory()
    {
        var current = Directory.GetCurrentDirectory();
        while (current != null)
        {
            var configPath = Path.Combine(current, "Chandam.Config", "Rules");
            if (Directory.Exists(configPath))
                return configPath;
            current = Directory.GetParent(current)?.FullName;
        }
        return null;
    }
}
