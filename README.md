# Chandam API & MCP Servers

> Telugu/Sanskrit/Kannada poetry meter (Chandam/ఛందం) analysis system with AI-friendly APIs

[![Phase 1](https://img.shields.io/badge/Phase%201-Complete-brightgreen)](Docs/execution/PHASE1-COMPLETION-SUMMARY.md)
[![Phase 2](https://img.shields.io/badge/Phase%202-Complete-brightgreen)](Docs/plans/phase2-mcp-servers.md)
[![Phase 3](https://img.shields.io/badge/Phase%203-Planned-blue)](Docs/plans/phase3-wasm.md)
[![Phase 4](https://img.shields.io/badge/Phase%204-Complete-brightgreen)](Docs/plans/phase4-dictionary.md)

**Website**: https://chandamu.github.io/

## What is Chandam?

Chandam (ఛందం) is the prosody/meter system used in Telugu, Sanskrit, and Kannada poetry. This project provides:

- **API Layer** for programmatic access to Chandam analysis
- **MCP Servers** for AI agent integration (Claude Desktop, remote agents)
- **Blazor WASM** for browser-based offline usage - *Planned*

### Key Features

- **379 Telugu Chandam rules** with 554 tested examples
- **96.09% average match accuracy** across all examples
- **7 MCP tools** for AI agent integration (stdio + HTTP/SSE)
- **REST API** with 8 endpoints and ISO 639 language code support
- **Docker containers** for API, MCP HTTP, and MCP Stdio servers
- **Dual format config** - JSON & YAML (YAML preferred for Telugu text)

## Quick Start

### MCP Server (Claude Desktop)

Add to `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "chandam": {
      "command": "dotnet",
      "args": ["run", "--project", "C:/path/to/Chandam.MCP.Stdio"]
    }
  }
}
```

Or with Docker:
```json
{
  "mcpServers": {
    "chandam": {
      "command": "docker",
      "args": ["run", "-i", "--rm", "chandam-mcp-stdio"]
    }
  }
}
```

### MCP Server (HTTP/SSE)

```bash
dotnet run --project Chandam.MCP.Http
# SSE endpoint: http://localhost:3001/sse
```

Or with Docker:
```bash
docker compose up chandam-mcp-http
# SSE endpoint: http://localhost:3001/sse
```

### REST API

```bash
dotnet run --project Chandam.API.WebApi
# API at http://localhost:5000

# Auto-detect meter
curl -X POST http://localhost:5000/api/determine \
  -H "Content-Type: application/json" \
  -d '{"poemText":"సామర్థ్యలీలన్ తతజద్విగంబుల్\nభూమిధ్రవిశ్రాంతుల బొంది యొప్పున్\nప్రేమంబుతో నైందవబింబవక్త్రున్\nహేమాంబురుం బాడుదు రింద్రవజ్రన్","language":"te","matchYati":true,"matchPrasa":true}'
```

### Docker

```bash
# Publish first (required - core projects target net4.8)
dotnet publish Chandam.MCP.Http/Chandam.MCP.Http.csproj -c Release -o Publish/chandam-mcp-http
dotnet publish Chandam.MCP.Stdio/Chandam.MCP.Stdio.csproj -c Release -o Publish/chandam-mcp-stdio
dotnet publish Chandam.API.WebApi/Chandam.API.WebApi.csproj -c Release -o Publish/chandam-api

# Build & run
docker compose up chandam-mcp-http    # MCP HTTP/SSE on port 3001
docker compose up chandam-api         # REST API on port 8080
docker run -i chandam-mcp-stdio       # MCP Stdio (interactive)
```

## MCP Tools

7 tools available via both stdio and HTTP/SSE transports:

| Tool | Description |
|------|-------------|
| `determine_chandam` | Auto-detect best matching meter for a poem |
| `try_match_chandam` | Match poem against a specific Chandam rule |
| `calculate_scores` | Score poem against all rules (ranked list) |
| `get_rule_info` | Get rule details, patterns, description |
| `get_examples` | Get example poems for a Chandam |
| `list_rules` | List all available rules (with language filter) |
| `get_word_meaning` | Look up Telugu word meanings from multiple dictionaries |

## REST API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check + loaded rule sets |
| `/api/languages` | GET | List supported languages with ISO codes |
| `/api/rules` | GET | List all rules (with language filter) |
| `/api/rules/{id}` | GET | Get rule details + examples |
| `/api/rules/{id}/samples` | GET | Get example poems only |
| `/api/determine` | POST | Auto-detect best matching Chandam |
| `/api/try-match` | POST | Match against specific rule |
| `/api/scores` | POST | Calculate match scores for all rules |

## Language Support

| Language | ISO 639-1 | ISO 639-2 | Numeric | Native |
|----------|-----------|-----------|---------|--------|
| Telugu | `te` | `tel` | 0 | తెలుగు |
| Kannada | `kn` | `kan` | 1 | ಕನ್ನಡ |
| Sanskrit | `sa` | `san` | 2 | संस्कृतम् |
| Hindi | `hi` | `hin` | 3 | हिन्दी |
| Malayalam | `ml` | `mal` | 4 | മലയാളം |

All formats accepted in API and MCP requests.

## Project Status

### Phase 1: API Layer - COMPLETE
- 5 core Chandam analysis functions
- HTTP REST API with 8 endpoints
- 379 Telugu rules (JSON & YAML formats)
- ISO 639 language code support
- Docker containerization
- Integration tests (554 examples, 96.09% accuracy)

### Phase 2: MCP Servers - COMPLETE
- Stdio MCP server (Claude Desktop)
- HTTP/SSE MCP server (remote access)
- 7 MCP tools with full JSON schemas
- 13 integration tests (all passing)
- Docker containers for both servers
- Telugu text preserved in all responses

### Phase 4: Dictionary/Word Meanings - COMPLETE
- Word meaning lookup from 3 external sources (Andhrabharati, Wiktionary, Shabdkosh)
- Disk-based caching (one JSON file per word)
- New MCP tool: `get_word_meaning`
- Ported from existing Python implementations

### Phase 3: Blazor WASM - PLANNED
- Browser-based WASM app
- Offline usage with embedded rules
- Static site deployment

## Project Structure

### Solution Groups

```
Core/
  Chandam.Util                    # Contracts, enums, Manager (Rule, Example, RuleLanguage)
  Chandam.Indic                   # Indic script processing (Telugu, Devanagari, Kannada)
  Chandam.Rules                   # 343+ Chandam rule data classes + RuleHelper/SortHelper
  Chandam.Samples                 # Sample poems (Bhaskara, Vemana, Sumati, etc.)
  Chandam.Core                    # Business logic — matching, scoring (DO NOT MODIFY)
  Chandam.Dictionary              # Word meaning lookup (3 sources + disk cache)

API/
  Chandam.API                     # Service layer (ChandamService, RuleLoader)
  Chandam.API.WebApi              # HTTP REST API (8 endpoints)
  Chandam.API.Demo                # Console demo app
  Chandam.API.Tests               # API unit tests
  Chandam.API.IntegrationTests    # Integration tests (554 examples)

MCP/
  Chandam.MCP.Tools               # Shared MCP tool definitions (7 tools)
  Chandam.MCP.Stdio               # MCP Stdio server (Claude Desktop)
  Chandam.MCP.Http                # MCP HTTP/SSE server (remote access)
  Chandam.MCP.Tests               # MCP integration tests (13 tests)

Web/
  Chandam.Wasm                    # Blazor WASM app (planned)

Tasks/
  Chandam.Tasks                   # Rule generation, verification, utilities
```

### Project Dependencies

```
Chandam.Util        ← no dependencies (contracts, Manager, RuleHelper, SortHelper)
Chandam.Indic       ← Util
Chandam.Rules       ← Util                    (343+ data classes only)
Chandam.Samples     ← (standalone)             (sample poem data)
Chandam.Core        ← Util, Indic              (business logic — no Rules/Samples)
Chandam.API         ← Core, Util, Indic        (service layer — no Rules/Samples)
Chandam.Tasks       ← Core, Rules, Samples, Util, Indic
```

### Config & Docs

```
Chandam.Config/Rules/             # Rule config files (JSON/YAML)
Chandam.Config/Baselines/         # Baseline test data
Docs/                             # Documentation & plans
Docs/Scripts/                     # Test & utility scripts
```

## Development

### Prerequisites
- .NET 8.0 SDK
- Docker (optional)

### Running Tests

```bash
# MCP tool tests (13 tests)
dotnet test Chandam.MCP.Tests

# API integration tests (554 examples across 379 rules)
dotnet test Chandam.API.IntegrationTests

# API endpoint tests
bash scripts/test-api.sh http://localhost:5000
```

## Key Constraints

- **DO NOT modify** Core/ or Rules/ - contains undocumented domain knowledge
- **Preserve Telugu authenticity** - no forced English translations
- **No backward compatibility concerns** - building from scratch

## Documentation

- [PROJECT_RULES.md](PROJECT_RULES.md) - Organization standards
- [Phase 2 Plan](Docs/plans/phase2-mcp-servers.md) - MCP server details
- [Phase 4 Plan](Docs/plans/phase4-dictionary.md) - Dictionary/word meanings
- [Docker Guide](Docs/DOCKER.md) - Docker deployment
- [API Reference](Chandam.API.WebApi/README.md) - REST API docs

## License

Copyright 2013-2026 Chandam-ఛందం (http://chandam.apphb.com)
