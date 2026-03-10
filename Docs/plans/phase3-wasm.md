# Phase 3: Blazor WebAssembly App

## Goal
Create a Blazor WebAssembly application that runs Chandam analysis entirely in the browser, with all processing happening client-side. This enables offline usage and eliminates server costs for basic functionality.

## Prerequisites
- ✅ Phase 1 complete (Chandam.API)
- ✅ Phase 2 complete (MCP servers) - optional, can be standalone

## Scope
- ✅ Blazor WebAssembly app targeting .NET 8
- ✅ Compile Chandam.API to WASM
- ✅ Basic functional UI for 3 main functions (Determine, TryMatch, Scores)
- ✅ Embed default rule set in WASM
- ✅ Deploy as static site
- ❌ Fancy UI/UX (defer to Goal 3 - fresh UI)
- ❌ Telugu keyboard input (defer to Goal 3)
- ❌ Rule customization UI (out of scope)

## Implementation Plan

### Project Structure
```
Chandam.Wasm/
├── Chandam.Wasm.csproj
├── Program.cs
├── App.razor
├── Pages/
│   ├── Index.razor
│   ├── Determine.razor
│   ├── TryMatch.razor
│   ├── Scores.razor
│   └── RulesExplorer.razor
├── Components/
│   ├── PoemInput.razor
│   ├── MatchResultDisplay.razor
│   └── RuleCard.razor
├── Services/
│   └── WasmChandamService.cs (wrapper around ChandamService)
└── wwwroot/
    ├── index.html
    ├── css/
    └── data/
        └── embedded-rules.json
```

### Implementation

**Program.cs**:
```csharp
var builder = WebAssemblyHostBuilder.CreateDefault(args);

// Configure services
var ruleLoader = new RuleLoaderService();
// Load embedded rules or fetch from server
ruleLoader.LoadAllRuleSets("wwwroot/data");
builder.Services.AddSingleton(ruleLoader);
builder.Services.AddScoped<ChandamService>();

await builder.Build().RunAsync();
```

**Determine.razor** (Example):
```razor
@page "/determine"
@inject ChandamService Service

<h3>Auto-Detect Chandam</h3>

<div class="poem-input">
    <textarea @bind="poemText" rows="10" cols="80"
              placeholder="Enter Telugu or Sanskrit poem..."></textarea>
    <button @onclick="AnalyzePoem">Determine Chandam</button>
</div>

@if (result != null)
{
    <MatchResultDisplay Result="result" />
}

@code {
    private string poemText = "";
    private DetermineResponse result;

    private async Task AnalyzePoem()
    {
        var request = new DetermineRequest
        {
            PoemText = poemText,
            MatchYati = true,
            MatchPrasa = true,
            Language = "Telugu"
        };

        result = Service.Determine(request);
    }
}
```

### Embedded Rules Strategy
- Embed `chandam-rules.json` (default rule set) in wwwroot/data/
- Loaded at startup into WASM memory
- No server calls needed for basic functionality
- Optional: Fetch additional rule sets from API if available

### Deployment
- Build: `dotnet publish -c Release`
- Output: Static files in bin/Release/net8.0/publish/wwwroot/
- Deploy to:
  - GitHub Pages (recommended)
  - Azure Static Web Apps
  - Netlify
  - Any static file hosting

### Testing
- Run locally: `dotnet run`
- Test in browser: https://localhost:5001
- Verify WASM loads and functions work offline
- Test with sample poems

## Deliverables

✅ **Chandam.Wasm** - Blazor WebAssembly app

✅ **3 Main Pages** - Determine, TryMatch, Scores

✅ **Embedded Rules** - Default rule set bundled in WASM

✅ **Deployment** - Static site ready to deploy

✅ **README.md** - Deployment instructions

## Success Criteria

1. ✅ App loads in browser and runs offline
2. ✅ Determine function works with embedded rules
3. ✅ Can analyze Telugu poems client-side
4. ✅ Results display correctly with English descriptions
5. ✅ WASM bundle size is reasonable (<10MB)
6. ✅ Can deploy to GitHub Pages successfully

## Out of Scope (Future: Goal 3 - Fresh UI)

- ❌ Modern/fancy UI design
- ❌ Telugu keyboard input
- ❌ Advanced features (save poems, history, etc.)
- ❌ Rule customization UI
- ❌ Mobile-responsive design (basic responsive OK)
- ❌ Performance optimizations

## Future Enhancements

These would be part of Goal 3 (Fresh UI focused on major functions):
- Beautiful, modern UI
- Telugu keyboard support
- Poem library/history
- Advanced visualization of meter patterns
- Mobile-first responsive design
- Progressive Web App (PWA) features
