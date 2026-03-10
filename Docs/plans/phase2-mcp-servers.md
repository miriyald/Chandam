# Phase 2: MCP Servers (Stdio + HTTP)

## Goal
Create MCP servers that expose Chandam functions to AI agents via stdio (for Claude Desktop) and HTTP (for web/API clients). Support hidden rule set selection feature.

## Prerequisites
- ✅ Phase 1 complete (Chandam.API with RuleLoaderService and ChandamService)
- ✅ Rule sets available in Config/Rules/

## Scope
- ✅ Stdio MCP Server (console app, JSON-RPC over stdin/stdout)
- ✅ HTTP MCP Server (ASP.NET Core Web API)
- ✅ 6 MCP tools exposed (determine, try_match, scores, get_rule, get_examples, list_rules)
- ✅ Hidden rule set selection via command-line/headers
- ✅ Configuration support (appsettings.json)
- ✅ Integration tests
- ❌ No authentication/authorization (out of scope)
- ❌ No public documentation of rule set feature (internal only)

## MCP Tools Definition

### 1. determine_chandam
**Description**: Auto-detect the best matching Chandam (meter/prosody) for a Telugu or Sanskrit poem.

**Input**:
- `poem_text` (string, required) - The poem to analyze
- `match_yati` (boolean, default: true) - Check caesura matching
- `match_prasa` (boolean, default: true) - Check rhyme matching
- `allow_santi_prasa` (boolean, default: false) - Allow alternative rhyme pattern
- `quick_match` (boolean, default: true) - Use optimized matching
- `language` (string, default: "Telugu") - "Telugu" or "Sanskrit"

**Output**: DetermineResponse with best match, top 5 candidates, English explanation

### 2. try_match_chandam
**Description**: Match a poem against a specific Chandam rule.

**Input**:
- `poem_text` (string, required)
- `rule_identifier` (string, required) - e.g., "kandam", "utpalamaala"
- `match_yati` (boolean, default: true)
- `match_prasa` (boolean, default: true)
- `language` (string, default: "Telugu")

**Output**: TryMatchResponse with detailed match analysis

### 3. calculate_chandam_scores
**Description**: Calculate match scores for all Chandam rules.

**Input**: Same as determine_chandam

**Output**: ScoresResponse with ranked list of all rules

### 4. get_chandam_rule
**Description**: Get detailed information about a specific rule.

**Input**:
- `rule_identifier` (string, required)

**Output**: RuleInfoResponse with patterns, examples, description

### 5. get_chandam_examples
**Description**: Get example poems for a specific rule.

**Input**:
- `rule_identifier` (string, required)

**Output**: SamplesResponse with example poems

### 6. list_chandam_rules
**Description**: List all available Chandam rules.

**Input**:
- `language` (string, default: "Telugu") - "Telugu", "Sanskrit", or "All"
- `frequency` (string, default: "All") - "All", "Frequent", or "Rare"

**Output**: List of RuleInfo objects

## Implementation Plan

### Part A: Stdio MCP Server (Chandam.MCP.Server)

**Project**: Console app targeting .NET 8

**Structure**:
```
Chandam.MCP.Server/
├── Chandam.MCP.Server.csproj
├── Program.cs
├── StdioMcpServer.cs
├── ToolHandlers/
│   ├── DetermineHandler.cs
│   ├── TryMatchHandler.cs
│   ├── ScoresHandler.cs
│   ├── RuleInfoHandler.cs
│   ├── ExamplesHandler.cs
│   └── ListRulesHandler.cs
├── Models/
│   ├── McpRequest.cs
│   ├── McpResponse.cs
│   └── McpToolDefinition.cs
└── appsettings.json
```

**Implementation**:

**Program.cs**:
```csharp
static async Task Main(string[] args)
{
    // Parse command-line args
    var config = ParseArguments(args);
    // --ruleset=<identifier>
    // --rules-dir=<path>

    // Initialize services
    var ruleLoader = new RuleLoaderService();
    ruleLoader.LoadAllRuleSets(config.RulesDirectory ?? "Config/Rules");

    if (!string.IsNullOrEmpty(config.RuleSetId))
    {
        ruleLoader.SetActiveRuleSet(config.RuleSetId);
    }

    var chandamService = new ChandamService(ruleLoader);

    // Start MCP server
    var server = new StdioMcpServer(chandamService);
    await server.RunAsync();
}
```

**StdioMcpServer.cs**:
```csharp
public class StdioMcpServer
{
    private ChandamService _service;

    public async Task RunAsync()
    {
        // Read JSON-RPC requests from stdin
        // Route to appropriate handler
        // Write JSON-RPC responses to stdout
        // Handle errors with proper error codes
    }

    private async Task<McpResponse> HandleToolCall(McpRequest request)
    {
        return request.Method switch
        {
            "tools/list" => ListTools(),
            "tools/call" => await CallTool(request),
            _ => Error("Unknown method")
        };
    }
}
```

**Configuration** (appsettings.json):
```json
{
  "RuleSet": {
    "DefaultRuleSetId": "default",
    "RulesDirectory": "Config/Rules",
    "AllowRuleSetSwitch": true
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft": "Warning"
    }
  }
}
```

**Usage**:
```bash
# Use default rule set
dotnet run --project Chandam.MCP.Server

# Use specific rule set (hidden feature)
dotnet run --project Chandam.MCP.Server -- --ruleset=telugu-complete

# Custom rules directory
dotnet run --project Chandam.MCP.Server -- --rules-dir=/path/to/rules
```

### Part B: HTTP MCP Server (Chandam.MCP.WebApi)

**Project**: ASP.NET Core Web API targeting .NET 8

**Structure**:
```
Chandam.MCP.WebApi/
├── Chandam.MCP.WebApi.csproj
├── Program.cs
├── Controllers/
│   ├── McpToolsController.cs
│   └── AdminController.cs (internal, not public)
├── Middleware/
│   └── RuleSetSelectorMiddleware.cs
├── Models/ (same as stdio)
└── appsettings.json
```

**Implementation**:

**RuleSetSelectorMiddleware.cs**:
```csharp
public class RuleSetSelectorMiddleware
{
    public async Task InvokeAsync(HttpContext context, RuleLoaderService ruleLoader)
    {
        // Check for X-Chandam-RuleSet header
        if (context.Request.Headers.TryGetValue("X-Chandam-RuleSet", out var ruleSetId))
        {
            ruleLoader.SetActiveRuleSet(ruleSetId);
        }

        await _next(context);
    }
}
```

**McpToolsController.cs**:
```csharp
[ApiController]
[Route("api/mcp/tools")]
public class McpToolsController : ControllerBase
{
    private ChandamService _service;

    [HttpGet("list")]
    public IActionResult ListTools()

    [HttpPost("determine")]
    public async Task<IActionResult> Determine([FromBody] DetermineRequest request)

    [HttpPost("try-match")]
    public async Task<IActionResult> TryMatch([FromBody] TryMatchRequest request)

    [HttpPost("scores")]
    public async Task<IActionResult> CalculateScores([FromBody] ScoresRequest request)

    [HttpGet("rule/{identifier}")]
    public async Task<IActionResult> GetRule(string identifier)

    [HttpGet("examples/{identifier}")]
    public async Task<IActionResult> GetExamples(string identifier)

    [HttpGet("list-rules")]
    public async Task<IActionResult> ListRules([FromQuery] string language = "Telugu")
}
```

**AdminController.cs** (internal, not documented publicly):
```csharp
[ApiController]
[Route("api/admin")]
public class AdminController : ControllerBase
{
    // Internal endpoints for development/testing
    // Do NOT document in public API docs

    [HttpGet("rulesets")]
    public IActionResult ListRuleSets()

    [HttpPost("rulesets/reload")]
    public IActionResult ReloadRuleSets()

    [HttpGet("health")]
    public IActionResult Health()
}
```

**Usage**:
```bash
# Start server
dotnet run --project Chandam.MCP.WebApi

# Use default rule set
curl -X POST http://localhost:5000/api/mcp/tools/determine \
  -H "Content-Type: application/json" \
  -d '{"poem_text": "..."}'

# Use specific rule set (hidden feature via header)
curl -X POST http://localhost:5000/api/mcp/tools/determine \
  -H "Content-Type: application/json" \
  -H "X-Chandam-RuleSet: telugu-complete" \
  -d '{"poem_text": "..."}'
```

**Swagger/OpenAPI**:
- Configure Swagger for API documentation
- Document public endpoints only
- Do NOT document X-Chandam-RuleSet header (internal feature)
- Do NOT document /api/admin/* endpoints (internal only)

### Testing Strategy

**Integration Tests** (Chandam.MCP.Tests):
```csharp
// Stdio server tests
[Fact]
public async Task StdioServer_DetermineTool_ReturnsValidResponse()

[Fact]
public async Task StdioServer_WithRuleSetArg_UsesCorrectRules()

// HTTP API tests
[Fact]
public async Task HttpApi_DetermineEndpoint_ReturnsOk()

[Fact]
public async Task HttpApi_WithRuleSetHeader_UsesCorrectRules()

[Fact]
public async Task HttpApi_ListTools_ReturnsAllSixTools()

// Admin endpoint tests
[Fact]
public async Task Admin_ListRuleSets_ReturnsAvailableSets()

[Fact]
public async Task Admin_Health_ReturnsHealthy()
```

**Manual Testing with Claude Desktop**:
1. Build stdio server
2. Configure Claude Desktop MCP settings
3. Test all 6 tools
4. Verify responses are JSON with English descriptions

**Manual Testing with Postman**:
1. Start HTTP API server
2. Import Swagger/OpenAPI spec
3. Test all endpoints
4. Test rule set header (hidden feature)

## Deliverables

✅ **Chandam.MCP.Server** - Stdio console app with JSON-RPC support

✅ **Chandam.MCP.WebApi** - HTTP API with 6 endpoints

✅ **Rule Set Selection** - Via command-line args (stdio) or headers (HTTP)

✅ **Configuration** - appsettings.json for both servers

✅ **Integration Tests** - 10+ tests validating server functionality

✅ **Internal Documentation** - README.md explaining hidden rule set feature

## Success Criteria

1. ✅ Stdio server responds to all 6 tool calls correctly
2. ✅ HTTP API returns proper JSON responses with 200 status codes
3. ✅ Rule set selection works via command-line args
4. ✅ Rule set selection works via HTTP header
5. ✅ Swagger documentation generated correctly (public endpoints only)
6. ✅ Integration tests pass (10+ tests)
7. ✅ Can test with Claude Desktop (if available)

## Out of Scope (Future Phases)

- ❌ Blazor WASM (Phase 3)
- ❌ Authentication/Authorization
- ❌ Rate limiting
- ❌ Caching layer
- ❌ Production deployment
- ❌ Public documentation of rule set feature
- ❌ Customer-facing UI

## Next Phase Preview

**Phase 3** will create a Blazor WebAssembly app that runs the Chandam analysis entirely in the browser using WASM, with optional backend API integration.
