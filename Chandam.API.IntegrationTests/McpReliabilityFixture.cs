using Chandam.API.IntegrationTests.Models;
using Chandam.API.Services;
using Chandam.Dictionary.Cache;
using Chandam.Dictionary.Services;
using Chandam.MCP.Tools;
using Chandam.Rules;

namespace Chandam.API.IntegrationTests;

public class McpReliabilityFixture : IDisposable
{
    public ChandamTools Tools { get; }
    public RuleLoaderService RuleLoader { get; }
    public BaselineReport Baseline { get; }
    public List<(Rule Rule, Example Example, int Index)> TestCases { get; }

    public McpReliabilityFixture()
    {
        var projectRoot = FindProjectRoot();
        var rulesPath = Path.Combine(projectRoot!, "Chandam.Config", "Rules");

        RuleLoader = new RuleLoaderService(rulesPath);
        RuleLoader.LoadAllRuleSets();
        RuleLoader.SetActiveRuleSet("chandam");

        var service = new ChandamService(RuleLoader);
        var searchService = new SearchService(RuleLoader);
        var dictionaryService = new DictionaryService([], new DiskCache("reliability-cache"));
        Tools = new ChandamTools(service, RuleLoader, dictionaryService, searchService);

        var baselinePath = Path.Combine(projectRoot!, "Chandam.Config", "Baselines", "baseline-results.yaml");
        Baseline = BaselineGenerator.LoadBaseline(baselinePath)!;

        TestCases = new List<(Rule, Example, int)>();
        foreach (var rule in RuleLoader.GetAllRules(RuleLanguage.Telugu))
        {
            if (rule.Examples2 == null || rule.Examples2.Length == 0) continue;
            for (int i = 0; i < rule.Examples2.Length; i++)
                TestCases.Add((rule, rule.Examples2[i], i));
        }
    }

    public static string CleanPoemText(string rawText)
    {
        var tildeIndex = rawText.IndexOf('~');
        return tildeIndex >= 0 ? rawText.Substring(0, tildeIndex).Trim() : rawText;
    }

    private static string? FindProjectRoot()
    {
        var assemblyLocation = typeof(McpReliabilityFixture).Assembly.Location;
        var current = Path.GetDirectoryName(assemblyLocation);
        while (current != null)
        {
            if (Directory.Exists(Path.Combine(current, "Chandam.Config", "Rules")))
                return current;
            current = Directory.GetParent(current)?.FullName;
        }
        return null;
    }

    public void Dispose() { }
}
