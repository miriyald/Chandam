# Chandam Project - Agent Instructions

## What This Project Is

Chandam (ఛందం) is a Telugu/Sanskrit/Kannada **poetry meter analysis system**. It analyzes poems and identifies their metrical patterns (like iambic pentameter, but for Indian languages). The codebase contains **379 Telugu rules** with **554 tested examples** achieving **96.09% accuracy**.

**Website**: https://chandamu.github.io/

## Critical Rules - Read These First

### 1. DO NOT MODIFY Core Business Logic

The following projects contain undocumented domain knowledge built over 10+ years. **Never edit these files**:

- `Chandam.Core/` — Matching engine, scoring, pattern recognition
- `Chandam.Rules/` — 343+ rule data classes
- `Chandam.Util/` — Contracts, enums, Manager classes
- `Chandam.Indic/` — Indic script processing (Telugu, Devanagari, Kannada)
- `Chandam.Samples/` — Sample poem datasets

If you think a bug is in core logic, **report it — don't fix it**.

### 2. Preserve Telugu Authenticity

- Never force English translations of Telugu terms
- Maintain full Unicode support in all layers
- Test with actual Telugu text, not transliterated placeholders
- Domain terms: Chandam=Meter, Padyam=Verse, Gana=Foot, Yati=Caesura, Prasa=Rhyme

### 3. Keep It Simple (KISS)

- No future-proofing or speculative features
- Small, focused functions with mandatory parameters
- Less "clean" is acceptable if understandable
- Solve the current problem only

## Architecture

```
Core/                          # Domain layer (READ-ONLY)
  Chandam.Util                 # Contracts, enums, Manager
  Chandam.Indic                # Indic script processing
  Chandam.Rules                # 343+ rule data classes
  Chandam.Samples              # Sample poems
  Chandam.Core                 # Business logic (matching, scoring)
  Chandam.Dictionary           # Word meaning lookup (3 sources + cache)

API/                           # Service layer
  Chandam.API                  # ChandamService, RuleLoader (wrapper over Core)
  Chandam.API.WebApi           # HTTP REST API (8 endpoints)
  Chandam.API.Demo             # Console demo
  Chandam.API.Tests            # Unit tests
  Chandam.API.IntegrationTests # 554-example integration tests

MCP/                           # AI agent integration
  Chandam.MCP.Tools            # 7 shared MCP tool definitions
  Chandam.MCP.Stdio            # MCP server for Claude Desktop
  Chandam.MCP.Http             # MCP HTTP/SSE server
  Chandam.MCP.Tests            # 13 MCP integration tests

Web/
  Chandam.Wasm                 # Blazor WebAssembly app

Tasks/
  Chandam.Tasks                # Rule generation, verification utilities

Config/
  Chandam.Config/Rules/        # JSON & YAML rule files
  Chandam.Config/Baselines/    # Baseline test data
```

### Dependency Flow

```
Chandam.Util        <- no dependencies
Chandam.Indic       <- Util
Chandam.Rules       <- Util (data classes only)
Chandam.Samples     <- standalone
Chandam.Core        <- Util, Indic (NO Rules/Samples dependency)
Chandam.API         <- Core, Util, Indic (NO Rules/Samples dependency)
Chandam.Dictionary  <- standalone (HTTP clients + disk cache)
```

Rules and Samples are loaded at **runtime** via JSON/YAML config files — not compiled in.

## Tech Stack

- **Language**: C# / .NET 8.0
- **Core projects**: Originally net4.8, converted to net8.0 SDK-style
- **Web**: Blazor WebAssembly (standalone, no server)
- **MCP**: Model Context Protocol (stdio + HTTP/SSE transports)
- **Config**: JSON and YAML (YAML preferred for Telugu text — YamlDotNet)
- **Testing**: xUnit
- **Containers**: Docker + docker-compose

## How to Build and Test

```bash
# Build everything
dotnet build Chandam.sln

# Run API server
dotnet run --project Chandam.API.WebApi
# -> http://localhost:5000

# Run MCP stdio server
dotnet run --project Chandam.MCP.Stdio

# Run MCP HTTP server
dotnet run --project Chandam.MCP.Http
# -> http://localhost:3001/sse

# Run tests
dotnet test Chandam.MCP.Tests              # 13 MCP tests
dotnet test Chandam.API.IntegrationTests   # 554 examples across 379 rules

# Build WASM (exclude YAML to reduce size)
dotnet publish Chandam.Wasm -c Release -p:ExcludeYaml=true

# Docker
dotnet publish Chandam.API.WebApi/Chandam.API.WebApi.csproj -c Release -o Publish/chandam-api
docker compose up chandam-api
```

## Language Codes

The API accepts multiple formats for language specification:

| Language  | ISO 639-1 | ISO 639-2 | Numeric | Name      |
|-----------|-----------|-----------|---------|-----------|
| Telugu    | te        | tel       | 0       | Telugu    |
| Kannada   | kn        | kan       | 1       | Kannada   |
| Sanskrit  | sa        | san       | 2       | Sanskrit  |
| Hindi     | hi        | hin       | 3       | Hindi     |
| Malayalam | ml        | mal       | 4       | Malayalam |

## File Placement Rules

- **Documentation**: `Docs/plans/` for plans, `Docs/execution/` for status reports
- **Agent plans**: `Docs/plans/` — all implementation plans saved here (not in temp/hidden dirs)
- **Scripts**: `Docs/Scripts/` — all .sh, .ps1, .bat files go here
- **Baselines**: `Chandam.Config/Baselines/`
- **Rule configs**: `Chandam.Config/Rules/` (JSON and YAML)
- **Root**: Only `README.md`, `PROJECT_RULES.md`, `CLAUDE.md` allowed

## Coding Standards

- **N-Layer**: Interface -> Service -> Data Access + Data Contracts
- **No business logic in data access** — only talks to store
- **Services orchestrate** use cases, depend on data access interfaces
- **Small functions** with single purpose and mandatory parameters
- **Constants** in constants folder; secrets in `.env`
- **Commit format**: `[Phase#] Category: Description`

## Known Gotchas

1. **ExcludeYaml flag**: `-p:ExcludeYaml=true` must be a command-line property (not in csproj) to propagate globally. Used for WASM builds to exclude YamlDotNet.
2. **Multi-targeting**: Core projects were net4.8, now net8.0 SDK-style. Docker Linux builds require single-target.
3. **HybridGlobalization**: Used in WASM to reduce ICU data (~400KB saved).
4. **Rule loading**: Rules are loaded at runtime via JSON/YAML — Chandam.Core has no compile-time dependency on Chandam.Rules.

## Validating Changes

Before considering work complete:

1. `dotnet build Chandam.sln` — must compile clean
2. `dotnet test Chandam.MCP.Tests` — all 13 MCP tests pass
3. `dotnet test Chandam.API.IntegrationTests` — 554 examples, no regressions >5%
4. Test with actual Telugu text (not English placeholders)
5. Files placed in correct directories per PROJECT_RULES.md
