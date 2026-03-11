using Chandam.API.Services;
using Microsoft.Extensions.DependencyInjection;

namespace Chandam.MCP.Tools;

public static class ServiceRegistration
{
    public static IServiceCollection AddChandamServices(
        this IServiceCollection services, string? rulesDirectory = null)
    {
        var ruleLoader = new RuleLoaderService();
        ruleLoader.LoadAllRuleSets(rulesDirectory ?? "Config/Rules");
        services.AddSingleton(ruleLoader);
        services.AddSingleton<ChandamService>();
        return services;
    }
}
