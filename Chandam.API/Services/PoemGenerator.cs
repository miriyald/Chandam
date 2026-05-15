using Chandam.Rules;
using Library.Chandam.Labs;

namespace Chandam.API.Services;

public static class PoemGenerator
{
    public static bool CanGenerate(Rule? rule)
    {
        return rule != null
            && rule.PadyamType == PadyamType.Vruttam
            && !rule.InfiniteLength
            && rule.Rules != null
            && rule.Rules.Length > 0;
    }

    public static string? Generate(Rule rule)
    {
        // YAML-loaded rules may have null Yati — MachinePoem expects non-null
        rule.Yati ??= new int[0][];

        // MachinePoem.Build uses Manager.FetchRule internally — ensure rule is registered
        var existing = Manager.FetchRule(rule.Identifier);
        if (existing == null)
            Manager.AddRule(rule);

        try
        {
            var machine = new MachinePoem();
            return machine.Build(rule.Identifier);
        }
        catch
        {
            return null;
        }
    }
}
