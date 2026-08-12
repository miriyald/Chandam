using Chandam.API.Services;
using Xunit;

namespace Chandam.API.IntegrationTests;

/// <summary>
/// Guards the generated .min.json rule sets consumed by the WASM client.
/// A generator that emits scalars as strings ("lines":"8") deserializes to null here.
/// </summary>
public class RuleSetJsonTests
{
    public static TheoryData<string> RuleSetFiles()
    {
        var data = new TheoryData<string>();
        foreach (var path in Directory.GetFiles(RulesDirectory(), "*.min.json"))
        {
            if (!Path.GetFileName(path).Contains("-examples"))
            {
                data.Add(path);
            }
        }
        return data;
    }

    [Theory]
    [MemberData(nameof(RuleSetFiles))]
    public void MinifiedRuleSet_Deserializes(string path)
    {
        var rules = new RuleLoaderService().LoadFromJsonString(File.ReadAllText(path));

        Assert.NotNull(rules);
        Assert.NotEmpty(rules);
    }

    private static string RulesDirectory()
    {
        var current = Directory.GetCurrentDirectory();
        while (current != null)
        {
            var candidate = Path.Combine(current, "Chandam.Config", "Rules");
            if (Directory.Exists(candidate))
            {
                return candidate;
            }
            current = Directory.GetParent(current)?.FullName;
        }

        throw new DirectoryNotFoundException("Chandam.Config/Rules not found from " + Directory.GetCurrentDirectory());
    }
}
