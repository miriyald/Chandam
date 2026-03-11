using System;
using System.Net.Http;
using System.Threading.Tasks;
using Chandam.API.Services;
using Chandam.Rules;

namespace Chandam.Wasm.Services;

/// <summary>
/// Loads rules via HttpClient for WASM (no file system access in browser)
/// </summary>
public class WasmRuleLoaderService
{
    private readonly HttpClient _httpClient;
    private readonly RuleLoaderService _ruleLoader;
    private bool _initialized;

    public WasmRuleLoaderService(HttpClient httpClient, RuleLoaderService ruleLoader)
    {
        _httpClient = httpClient;
        _ruleLoader = ruleLoader;
    }

    public async Task InitializeAsync()
    {
        if (_initialized) return;

        try
        {
            var json = await _httpClient.GetStringAsync("data/telugu-complete.json");
            var rules = _ruleLoader.LoadFromJsonString(json);

            if (rules != null && rules.Length > 0)
            {
                Manager.Clear();
                Manager.Register(rules);
                Console.WriteLine($"WASM: Loaded {rules.Length} rules from JSON");
            }
            else
            {
                Console.WriteLine("WASM: JSON rules empty, using compiled rules");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"WASM: Failed to load JSON rules ({ex.Message}), using compiled rules");
        }

        _initialized = true;
    }
}
