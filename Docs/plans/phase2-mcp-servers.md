# Phase 2: MCP Servers (Stdio + HTTP) - COMPLETE

## Goal

Expose Chandam analysis to AI agents via MCP (Model Context Protocol) servers using the official .NET MCP SDK. Two transport modes: stdio (for Claude Desktop) and HTTP/SSE (for remote/web clients).

## Prerequisites

- Phase 1 complete: `Chandam.API` with `ChandamService` (5 core functions) and `RuleLoaderService`
- Rule sets available in `Config/Rules/` (optional, falls back to compiled rules)
- .NET 8 SDK

## Scope

| In Scope | Out of Scope |
|----------|-------------|
| Stdio MCP Server (Claude Desktop) | Authentication/Authorization |
| HTTP/SSE MCP Server (remote access) | Rate limiting / Caching |
| 6 MCP tools | Public rule set documentation |
| Rule set selection (CLI args + config) | Production deployment |
| Integration tests (13 tests) | Customer-facing UI |
| Claude Desktop config | Blazor WASM (Phase 3) |

---

## Technology Choice: Official MCP .NET SDK

**Package**: `ModelContextProtocol` v1.1.0 (NuGet)

**Key packages used**:
- `ModelContextProtocol` - Core SDK (stdio transport, tool registration)
- `ModelContextProtocol.AspNetCore` - HTTP/SSE transport for ASP.NET Core

**Key features used**:
- `[McpServerToolType]` / `[McpServerTool]` attributes for tool registration
- `WithStdioServerTransport()` - stdio transport
- `WithHttpTransport()` / `MapMcp()` - HTTP/SSE transport
- `WithTools<T>()` - type-safe tool registration
- Automatic JSON schema generation from method parameters
- DI integration with `IServiceCollection`

---

## MCP Tools (6 Total)

### 1. `determine_chandam`
Auto-detect the best matching Chandam for a poem.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `poem_text` | string | yes | - | Poem to analyze |
| `match_yati` | bool | no | true | Check caesura matching |
| `match_prasa` | bool | no | true | Check rhyme matching |
| `language` | string | no | "te" | Language code (te/kn/sa/hi/ml) |

**Returns**: Best match with name, percentage, description, details.

### 2. `try_match_chandam`
Match a poem against a specific Chandam rule.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `poem_text` | string | yes | - | Poem to analyze |
| `rule_identifier` | string | yes | - | Rule ID (e.g., "kandam") |
| `match_yati` | bool | no | true | Check caesura |
| `match_prasa` | bool | no | true | Check rhyme |

**Returns**: Match result with percentage, details, mismatches.

### 3. `calculate_scores`
Calculate match scores against all rules.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `poem_text` | string | yes | - | Poem to analyze |
| `match_yati` | bool | no | true | Check caesura |
| `match_prasa` | bool | no | true | Check rhyme |
| `language` | string | no | "te" | Language code |
| `min_percentage` | double | no | 0 | Minimum match % to include |

**Returns**: Ranked list of all matching rules with scores.

### 4. `get_rule_info`
Get detailed information about a specific Chandam rule.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `rule_identifier` | string | yes | - | Rule ID |
| `include_examples` | bool | no | false | Include example poems |

**Returns**: Rule definition, patterns, description, optionally examples.

### 5. `get_examples`
Get example poems for a specific Chandam.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `rule_identifier` | string | yes | - | Rule ID |
| `max_examples` | int | no | 5 | Max examples to return |

**Returns**: Example poems with author, reference, notes.

### 6. `list_rules`
List all available Chandam rules.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `language` | string | no | "te" | Language filter |

**Returns**: List of rule summaries (id, name, type, frequency, lines).

---

## Implementation

### Part A: Shared Tool Definitions (`Chandam.MCP.Tools`)

Shared class library containing MCP tool definitions and DI registration.

```
Chandam.MCP.Tools/
├── Chandam.MCP.Tools.csproj    # net8.0, refs ModelContextProtocol + Chandam.API
├── ChandamTools.cs             # All 6 [McpServerTool] methods
└── ServiceRegistration.cs      # AddChandamServices() extension method
```

**Key design decisions**:
- `ChandamTools` takes `ChandamService` + `RuleLoaderService` via constructor injection
- All tool methods return `string` (JSON-serialized results)
- Uses `JavaScriptEncoder.UnsafeRelaxedJsonEscaping` to preserve Telugu characters in output
- `ServiceRegistration.AddChandamServices()` handles rule loading and DI setup for both servers

### Part B: Stdio MCP Server (`Chandam.MCP.Stdio`)

Console app for Claude Desktop integration.

```
Chandam.MCP.Stdio/
├── Chandam.MCP.Stdio.csproj    # net8.0, refs ModelContextProtocol + MCP.Tools
└── Program.cs                  # 16 lines
```

**Important**: The stdio transport uses stdout for JSON-RPC protocol. `RuleLoaderService` uses `Console.WriteLine` for logging during init. `Program.cs` temporarily redirects `Console.Out` to `Console.Error` during service registration to prevent corrupting the MCP protocol stream.

**Claude Desktop Configuration** (`claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "chandam": {
      "command": "dotnet",
      "args": [
        "run",
        "--project",
        "C:/Working/Experiments/Chandam3/Chandam.MCP.Stdio"
      ]
    }
  }
}
```

Or with a published executable:
```json
{
  "mcpServers": {
    "chandam": {
      "command": "C:/path/to/Chandam.MCP.Stdio.exe",
      "args": ["--rules-dir=C:/path/to/Config/Rules"]
    }
  }
}
```

### Part C: HTTP/SSE MCP Server (`Chandam.MCP.Http`)

ASP.NET Core server for remote access.

```
Chandam.MCP.Http/
├── Chandam.MCP.Http.csproj     # Web SDK, refs ModelContextProtocol.AspNetCore + MCP.Tools
├── Program.cs                  # 10 lines
└── appsettings.json            # Port 3001, rules directory config
```

**Endpoints**:
- `GET /sse` - SSE endpoint (client connects here to establish session)
- `POST /message?sessionId=...` - JSON-RPC message endpoint

**Usage**:
```bash
dotnet run --project Chandam.MCP.Http
# Server at http://localhost:3001/sse
```

### Part D: Integration Tests (`Chandam.MCP.Tests`)

```
Chandam.MCP.Tests/
├── Chandam.MCP.Tests.csproj    # xUnit, refs MCP.Tools
└── ChandamToolsTests.cs        # 13 tests
```

---

## Project Structure (Final)

```
Chandam3/
├── Chandam.MCP.Tools/          # Shared: Tool definitions + DI
│   ├── ChandamTools.cs         # 6 MCP tools
│   └── ServiceRegistration.cs  # AddChandamServices()
├── Chandam.MCP.Stdio/          # Stdio server (Claude Desktop)
│   └── Program.cs
├── Chandam.MCP.Http/           # HTTP/SSE server (remote)
│   ├── Program.cs
│   └── appsettings.json
├── Chandam.MCP.Tests/          # Integration tests
│   └── ChandamToolsTests.cs
├── Chandam.API/                # (Phase 1 - unchanged)
├── Chandam.API.WebApi/         # (Phase 1 - unchanged)
└── Config/Rules/               # Rule YAML/JSON files
```

---

## Test Results

### Integration Tests: 13/13 Passed

```
Passed ChandamToolsTests.DetermineChandam_WithValidPoem_ReturnsBestMatch
Passed ChandamToolsTests.DetermineChandam_EmptyPoem_ReturnsError
Passed ChandamToolsTests.DetermineChandam_AllLanguageCodes_Work(lang: "te")
Passed ChandamToolsTests.DetermineChandam_AllLanguageCodes_Work(lang: "tel")
Passed ChandamToolsTests.DetermineChandam_AllLanguageCodes_Work(lang: "Telugu")
Passed ChandamToolsTests.DetermineChandam_ResultContainsTelugu
Passed ChandamToolsTests.TryMatchChandam_WithCorrectRule_ReturnsMatch
Passed ChandamToolsTests.TryMatchChandam_InvalidRule_ReturnsError
Passed ChandamToolsTests.CalculateScores_ReturnsRankedResults
Passed ChandamToolsTests.GetRuleInfo_ReturnsRuleDetails
Passed ChandamToolsTests.GetRuleInfo_WithExamples_IncludesExamples
Passed ChandamToolsTests.GetExamples_ReturnsExamplePoems
Passed ChandamToolsTests.ListRules_Telugu_ReturnsRules
```

### Stdio Server: Verified

```bash
# Initialize + tools/list returns all 6 tools
printf '{"jsonrpc":"2.0","id":1,"method":"initialize",...}\n...\n' | dotnet run --project Chandam.MCP.Stdio

# Response: 6 tools with full JSON schemas
# determine_chandam, try_match_chandam, calculate_scores,
# get_rule_info, get_examples, list_rules
```

### HTTP Server: Verified

```
GET /sse → 200 OK, Content-Type: text/event-stream
  Returns: event: endpoint, data: /message?sessionId=...

POST /message?sessionId=... (initialize) → Accepted
  SSE: event: message, data: {protocolVersion, capabilities, serverInfo}

POST /message?sessionId=... (tools/list) → Accepted
  SSE: event: message, data: {tools: [6 tools with schemas]}
```

---

## Known Issues

1. **Console.WriteLine in RuleLoaderService**: The existing `RuleLoaderService` uses `Console.WriteLine` for logging. In the stdio server, this would corrupt the JSON-RPC protocol on stdout. Mitigated by temporarily redirecting `Console.Out` to `Console.Error` during service init.

2. **Config/Rules directory**: When running from project directory, the rules directory path may not resolve. Falls back to compiled rules (379 rules) automatically.

---

## Success Criteria - All Met

1. All 6 tools registered and callable via stdio transport
2. All 6 tools registered and callable via HTTP/SSE transport
3. Claude Desktop config provided for local testing
4. Telugu text handled correctly (Unicode preserved, verified in test)
5. Integration tests pass (13/13)
6. Language codes (te/tel/Telugu) all work
7. Error responses are clear and helpful

## Architecture Notes

- **No business logic changes** - MCP tools are thin wrappers around `ChandamService`
- **Shared tools** - Both servers use the same `ChandamTools` class
- **Official SDK v1.1.0** - No custom JSON-RPC code needed
- **DI-based** - Standard .NET dependency injection throughout
- Tools return JSON strings (the MCP SDK wraps these in proper MCP responses)

---

## Next Phase Preview

**Phase 3** will create a Blazor WebAssembly app that runs Chandam analysis entirely in the browser.
