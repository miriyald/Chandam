# Chandam API & MCP Servers

> Telugu/Sanskrit/Kannada poetry meter (Chandam/ఛందం) analysis system with AI-friendly APIs

[![Phase 1](https://img.shields.io/badge/Phase%201-Complete-brightgreen)](docs/execution/PHASE1-COMPLETION-SUMMARY.md)
[![Phase 2](https://img.shields.io/badge/Phase%202-Planned-blue)](docs/plans/phase2-mcp-servers.md)
[![Phase 3](https://img.shields.io/badge/Phase%203-Planned-blue)](docs/plans/phase3-wasm.md)

**Website**: https://chandamu.github.io/

## What is Chandam?

Chandam (ఛందం) is the prosody/meter system used in Telugu, Sanskrit, and Kannada poetry. This project provides:

- **API Layer** for programmatic access to Chandam analysis
- **MCP Servers** for AI agent integration (Claude, etc.) - *Planned*
- **Blazor WASM** for browser-based offline usage - *Planned*

### Key Features

✅ **Dual Format Support** - JSON & YAML config files (YAML preferred for editing)
✅ **Multi-line Telugu Text** - Readable poems without Unicode escapes
✅ **Comprehensive Testing** - 554 examples tested across 379 rules
✅ **High Accuracy** - 96.09% average match across all examples
✅ **Docker Ready** - Containerized API with health checks
✅ **Language Flexibility** - ISO 639-1, ISO 639-2, full names, numeric codes
✅ **Request Logging** - Timing metrics and structured logging
✅ **Baseline Testing** - Regression detection with 5% tolerance

## Quick Start

### Run API Locally

```bash
cd Chandam.API.WebApi
dotnet run
# API available at http://localhost:5000
```

### Run API in Docker

```bash
# Build
dotnet publish Chandam.API.WebApi/Chandam.API.WebApi.csproj -c Release -o Publish/chandam-api
docker build -t chandam-api -f Chandam.API.WebApi/Dockerfile.simple .

# Run
docker run -d -p 8080:8080 --name chandam-api chandam-api

# Check health
curl http://localhost:8080/health

# Test
bash scripts/test-api.sh http://localhost:8080
```

### Test API

```bash
# Health check
curl http://localhost:5000/health

# Auto-detect meter
curl -X POST http://localhost:5000/api/determine \
  -H "Content-Type: application/json" \
  -d '{"poemText":"తెలుగు poem...","language":"te","matchYati":true,"matchPrasa":true}'

# Run full test suite
bash scripts/test-api.sh http://localhost:5000
bash scripts/test-language-codes.sh http://localhost:5000
```

## Project Status

### ✅ Phase 1: API Layer (COMPLETE)
**Status**: Production Ready - All tests passing (100%)

- [x] 5 core Chandam analysis functions
- [x] HTTP REST API with 8 endpoints
- [x] JSON & YAML rule loading (379 Telugu rules, dual format)
- [x] ISO 639 language code support (te, tel, Telugu, numeric)
- [x] Docker containerization
- [x] Request/response logging with timing metrics
- [x] Integration tests with baseline reports (554 examples tested)
- [x] 96.09% average match accuracy across all examples
- [x] YAML format for human-editable multi-line Telugu text
- [x] Tilde (~) notation handling for example attribution

**Documentation**: [Phase 1 Completion Summary](docs/execution/PHASE1-COMPLETION-SUMMARY.md)

### 🔵 Phase 2: MCP Servers (PLANNED)
- [ ] Stdio MCP server (Claude Desktop integration)
- [ ] HTTP MCP server (remote access)
- [ ] 6 MCP tools
- [ ] Integration tests

**Documentation**: [Phase 2 Plan](docs/plans/phase2-mcp-servers.md)

### 🔵 Phase 3: Blazor WASM (PLANNED)
- [ ] Browser-based WASM app
- [ ] Offline usage
- [ ] Embedded rule sets
- [ ] Static site deployment

**Documentation**: [Phase 3 Plan](docs/plans/phase3-wasm.md)

## API Endpoints

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

All formats accepted in API requests.

## Core Functions

1. **Determine** - Auto-detect best matching Chandam for a poem
2. **TryMatch** - Match poem against specific Chandam rule
3. **Scores** - Calculate match scores for all Chandam rules
4. **GetRuleInfo** - Get rule details (patterns, examples, description)
5. **GetSamples** - Get example poems for a specific Chandam

## Rule Sets

Two rule sets available:

| Rule Set | Rules | Format | Size | Description |
|----------|-------|--------|------|-------------|
| `chandam-rules` | 14 | JSON/YAML | 54KB/42KB | Frequent Telugu Chandams |
| `telugu-complete` | 379 | JSON/YAML | 672KB/433KB | All Telugu Chandam rules |

**YAML Benefits**:
- Multi-line Telugu poem text (readable without Unicode escapes)
- Human-editable for manual rule customization
- Smaller file size (~35% compression)
- Version control friendly

## Project Structure

See [PROJECT_RULES.md](PROJECT_RULES.md) for detailed organization.

```
Chandam3/
├── docs/                          # Documentation
│   ├── plans/                     # Phase planning
│   ├── execution/                 # Status tracking
│   └── *.md                       # Guidelines, known issues
├── scripts/                       # All scripts
├── Tests/                         # Test infrastructure
│   └── Baselines/                # Baseline test results (YAML)
├── Config/                        # Configuration
│   └── Rules/                    # Rule definitions (JSON/YAML)
├── Chandam.API/                   # API layer
├── Chandam.API.WebApi/           # HTTP REST API
├── Chandam.API.IntegrationTests/ # Integration tests
├── Chandam.API.Tests/            # Unit tests (placeholder)
├── Core/                         # Business logic (DO NOT MODIFY)
└── Rules/                        # Rule definitions (DO NOT MODIFY)
```

## Development

### Prerequisites
- .NET 8.0 SDK
- Docker (optional)
- Git Bash (Windows) or Bash (Linux/Mac)

### Running Tests

```bash
# Integration tests (baseline verification)
cd Chandam.API.IntegrationTests
dotnet test
# Tests 554 examples across 379 rules
# Perfect matches (100%): 335 (60.5%)
# High matches (>=90%): 503 (90.8%)
# Average accuracy: 96.09%

# API tests
bash scripts/test-api.sh http://localhost:5000
bash scripts/test-language-codes.sh http://localhost:5000

# Unit tests
cd Chandam.API.Tests
dotnet test
# Note: Placeholder project (deferred to Phase 2)
```

### Generating Baseline

```bash
cd Chandam.API.IntegrationTests
dotnet test --filter "GenerateBaselineResults"
# Baseline saved to: Tests/Baselines/baseline-results.yaml
```

### Config Files

Rule definitions available in dual format:
- **JSON**: Machine-optimized (672KB for 379 rules)
- **YAML**: Human-editable with multi-line Telugu text (433KB)

**YAML takes precedence** when both formats exist. Regenerate config files:

```bash
cd Verifier
dotnet run -- --generate-json
# Generates both JSON and YAML files in Config/Rules/
```

### Logging & Monitoring

API includes comprehensive request/response logging:
- Request method, path, body
- Response status, body
- Duration (ms)
- Structured logging to console

## Documentation

- **Project Rules**: [PROJECT_RULES.md](PROJECT_RULES.md) - Organization standards
- **Coding Preferences**: [docs/CODING_PREFERENCES.md](docs/CODING_PREFERENCES.md)
- **Docker Guide**: [docs/DOCKER.md](docs/DOCKER.md) - Docker deployment guide
- **Phase Plans**: [docs/plans/](docs/plans/) - Detailed phase planning
- **Execution Status**: [docs/execution/](docs/execution/) - Progress tracking
- **API Documentation**: [Chandam.API.WebApi/README.md](Chandam.API.WebApi/README.md) - API endpoint reference

## Key Constraints

- **DO NOT modify** Core/ or Rules/ - contains undocumented domain knowledge
- **Preserve Telugu authenticity** - no forced English translations
- **No backward compatibility concerns** - building from scratch
- **Complete each phase fully** - no known issues before moving forward

## Contributing

See [PROJECT_RULES.md](PROJECT_RULES.md) for:
- Folder organization rules
- Code quality standards
- Testing requirements
- Commit message format

## License

Copyright © 2013-2026 Chandam-ఛందం (http://chandam.apphb.com)

---

**Current Focus**: Phase 1 Complete ✅ - Ready for Phase 2

For questions or issues: https://github.com/anthropics/claude-code/issues
