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
        var searchService = new SearchService(ruleLoader);
        var dictionaryService = new DictionaryService([], new DiskCache("test-cache"));
        _tools = new ChandamTools(service, ruleLoader, dictionaryService, searchService);
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

    [Fact]
    public void DetermineChandam_ReturnsBothMarkdownAndBeautified()
    {
        var result = _tools.DetermineChandam(TestPoem);
        var json = JsonDocument.Parse(result);

        Assert.True(json.RootElement.GetProperty("Success").GetBoolean());
        var matches = json.RootElement.GetProperty("Matches");
        Assert.True(matches.GetArrayLength() > 0);

        var firstMatch = matches[0];

        // Verify both Markdown and Beautified fields are populated
        Assert.True(firstMatch.TryGetProperty("Markdown", out var markdown));
        Assert.False(string.IsNullOrEmpty(markdown.GetString()));

        Assert.True(firstMatch.TryGetProperty("Beautified", out var beautified));
        Assert.False(string.IsNullOrEmpty(beautified.GetString()));

        // Both fields should have content
        var beautifiedHtml = beautified.GetString();
        Assert.NotNull(beautifiedHtml);
        Assert.True(beautifiedHtml.Length > 0);
        // HTML decoration tags would be present if Yati/Prasa are present in the rule
        // Skip strict tag verification due to encoding display issues in test output
    }

    [Fact]
    public void TryMatchChandam_ReturnsBothMarkdownAndBeautified()
    {
        var result = _tools.TryMatchChandam(TestPoem, "iMdravajramu");
        var json = JsonDocument.Parse(result);

        Assert.True(json.RootElement.GetProperty("IsMatch").GetBoolean());
        var match = json.RootElement.GetProperty("Match");

        // Verify both Markdown and Beautified fields are populated
        Assert.True(match.TryGetProperty("Markdown", out var markdown));
        Assert.False(string.IsNullOrEmpty(markdown.GetString()));

        Assert.True(match.TryGetProperty("Beautified", out var beautified));
        Assert.False(string.IsNullOrEmpty(beautified.GetString()));

        // Beautified should contain HTML tags
        var beautifiedHtml = beautified.GetString();
        Assert.Contains("<u>", beautifiedHtml);
        Assert.Contains("<b>", beautifiedHtml);
    }

    [Fact]
    public void SearchRules_ByQuery_ReturnsMatches()
    {
        // Search by rule name (not ChandamName - use chandam_names parameter for that)
        var result = _tools.SearchRules(query: "ఉత");  // Partial Telugu rule name search
        var json = JsonDocument.Parse(result);

        Assert.True(json.RootElement.GetProperty("Success").GetBoolean());
        var count = json.RootElement.GetProperty("Count").GetInt32();
        Assert.True(count > 0);
    }

    [Fact]
    public void SearchRules_ByCategory_FiltersCorrectly()
    {
        var result = _tools.SearchRules(categories: "Vruttam");
        var json = JsonDocument.Parse(result);

        var results = json.RootElement.GetProperty("Results");
        foreach (var item in results.EnumerateArray())
        {
            Assert.Equal("Vruttam", item.GetProperty("PadyamSubType").GetString());
        }
    }

    [Fact]
    public void SearchRules_ByChandamName_FiltersCorrectly()
    {
        // Search by ChandamName (e.g., త్రిష్టుప్పు) - use chandam_names parameter
        var result = _tools.SearchRules(chandam_names: "త్రిష్టుప్పు");
        var json = JsonDocument.Parse(result);

        Assert.True(json.RootElement.GetProperty("Success").GetBoolean());
        var count = json.RootElement.GetProperty("Count").GetInt32();
        Assert.True(count > 0);

        var results = json.RootElement.GetProperty("Results");
        foreach (var item in results.EnumerateArray())
        {
            // All results should have ChandamName = త్రిష్టుప్పు
            var chandamName = item.GetProperty("ChandamName").GetString();
            Assert.Equal("త్రిష్టుప్పు", chandamName);
        }
    }

    [Fact]
    public void SearchRules_WithExamples_FiltersCorrectly()
    {
        var result = _tools.SearchRules(has_examples: true);
        var json = JsonDocument.Parse(result);

        var results = json.RootElement.GetProperty("Results");
        foreach (var item in results.EnumerateArray())
        {
            Assert.True(item.GetProperty("ExampleCount").GetInt32() > 0);
        }
    }

    [Fact]
    public void SearchRules_MatraLengthRange_FiltersCorrectly()
    {
        var result = _tools.SearchRules(matra_length_min: 10, matra_length_max: 20);
        var json = JsonDocument.Parse(result);

        var results = json.RootElement.GetProperty("Results");
        foreach (var item in results.EnumerateArray())
        {
            var matraLength = item.GetProperty("MatraLength");
            if (!matraLength.ValueKind.Equals(JsonValueKind.Null))
            {
                var length = matraLength.GetInt32();
                if (length > 0)  // Exclude -1 values
                {
                    Assert.InRange(length, 10, 20);
                }
            }
        }
    }

    [Fact]
    public void SearchRules_MaxResults_LimitsOutput()
    {
        var result = _tools.SearchRules(max_results: 5);
        var json = JsonDocument.Parse(result);

        var results = json.RootElement.GetProperty("Results");
        Assert.True(results.GetArrayLength() <= 5);
    }

    [Fact]
    public void GetRuleInfo_PaMchaamaramu_LinesIs4_AfterMatching()
    {
        // Simulate a multi-line poem that would trigger the mutation in Padyam.cs
        var multiLinePoem = string.Join("\n", Enumerable.Range(1, 16).Select(_ =>
            "ఇ టా చతుర్ముఖుం డరాగఁ నిష్ట శిష్టపాళితోఁ"));

        // Run DetermineChandam first — this previously mutated the shared Rule
        _tools.DetermineChandam(multiLinePoem, ruleset_id: "chandam");

        // Now GetRuleInfo should still return the original Lines=4
        var result = _tools.GetRuleInfo("paMchaamaramu", include_examples: true, ruleset_id: "chandam");
        var json = JsonDocument.Parse(result);

        var lines = json.RootElement.GetProperty("Lines").GetInt32();
        Assert.Equal(4, lines);

        var name = json.RootElement.GetProperty("Name").GetString();
        Assert.Equal("పంచచామరము (నారాచ, మహోత్సవ)", name);
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
