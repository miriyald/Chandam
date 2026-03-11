using Chandam.API.Services;
using Chandam.Dictionary.Cache;
using Chandam.Dictionary.Services;
using Chandam.Dictionary.Sources;
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

        // Dictionary services
        services.AddSingleton(new DiskCache("cache"));

        // Named HTTP clients with per-source timeouts + SSL bypass
        services.AddHttpClient("andhrabharati", client =>
        {
            client.Timeout = TimeSpan.FromSeconds(15);
            client.DefaultRequestHeaders.Add("User-Agent",
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36");
            client.DefaultRequestHeaders.Add("X-Requested-With", "XMLHttpRequest");
            client.DefaultRequestHeaders.Add("Origin", "https://andhrabharati.com");
            client.DefaultRequestHeaders.Add("Referer", "https://andhrabharati.com/dictionary/");
            client.DefaultRequestHeaders.Add("X-Ps-Ext", "2024");
        }).ConfigurePrimaryHttpMessageHandler(() => CreateHandler());

        services.AddHttpClient("wiktionary", client =>
        {
            client.Timeout = TimeSpan.FromSeconds(10);
            client.DefaultRequestHeaders.Add("User-Agent",
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
        }).ConfigurePrimaryHttpMessageHandler(() => CreateHandler());

        services.AddHttpClient("shabdkosh", client =>
        {
            client.Timeout = TimeSpan.FromSeconds(10);
            client.DefaultRequestHeaders.Add("User-Agent",
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
        }).ConfigurePrimaryHttpMessageHandler(() => CreateHandler());

        // Register dictionary sources
        services.AddSingleton<IDictionarySource, AndhrabharatiSource>();
        services.AddSingleton<IDictionarySource, WiktionarySource>();
        services.AddSingleton<IDictionarySource, ShabdkoshSource>();
        services.AddSingleton<DictionaryService>();

        return services;
    }

    private static HttpClientHandler CreateHandler() => new()
    {
        ServerCertificateCustomValidationCallback = (_, _, _, _) => true
    };
}
