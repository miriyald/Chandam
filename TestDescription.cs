using System;
using Chandam.API.Services;
using Library.Chandam;

class TestDescription
{
    static void Main()
    {
        // Load rules
        var loader = new RuleLoaderService("Chandam.Config/Rules");
        loader.LoadAllRuleSets();
        loader.SetActiveRuleSet("telugu");

        // Get a rule
        var rule = Manager.FetchRule("iMdravajramu");

        if (rule != null)
        {
            // Test markdown description
            Console.WriteLine("=== MARKDOWN DESCRIPTION ===");
            var markdownDesc = DescriptionBuilder.BuildDescription(rule);
            Console.WriteLine(markdownDesc);

            Console.WriteLine("\n\n=== HTML DESCRIPTION (first 500 chars) ===");
            var htmlDesc = DescriptionBuilder.BuildDescriptionHtml(rule);
            Console.WriteLine(htmlDesc.Substring(0, Math.Min(500, htmlDesc.Length)));
        }
        else
        {
            Console.WriteLine("Rule not found!");
        }
    }
}
