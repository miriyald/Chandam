# Chandam - Docker & Package Guide

Pre-built Docker images and NuGet packages are published automatically on every merge to the `beta` branch.

## Docker Images (GitHub Container Registry)

| Image | Description | Port |
|-------|-------------|------|
| `ghcr.io/miriyald/chandam-wasm` | Web UI (nginx + Blazor WASM) | 80 |
| `ghcr.io/miriyald/chandam-api` | REST API server | 8080 |
| `ghcr.io/miriyald/chandam-mcp-http` | MCP HTTP/SSE server (for remote AI agents) | 3001 |
| `ghcr.io/miriyald/chandam-mcp-stdio` | MCP Stdio server (for Claude Desktop) | stdin/stdout |

### Tags

| Tag | Description |
|-----|-------------|
| `latest` | Most recent build from beta |
| `beta` | Same as latest (explicit channel) |
| `YYYYMMdd.HHmmss` | Immutable version (UTC build timestamp) |

---

## Quick Start

### Web UI

```bash
docker run -d -p 8082:80 ghcr.io/miriyald/chandam-wasm:latest
```

Open http://localhost:8082 — analyze Telugu poetry in your browser.

### REST API

```bash
docker run -d -p 8080:8080 ghcr.io/miriyald/chandam-api:latest
```

Test it:

```bash
curl http://localhost:8080/health

curl -X POST http://localhost:8080/api/determine \
  -H "Content-Type: application/json" \
  -d '{
    "poemText": "శ్రీవాణీగిరిజాశ్చిరాయ దధతో వక్షోముఖాంగేషు యే",
    "language": "te",
    "matchYati": true,
    "matchPrasa": true
  }'
```

### MCP HTTP Server (Remote AI Agents)

```bash
docker run -d -p 3001:3001 ghcr.io/miriyald/chandam-mcp-http:latest
```

Connect your MCP client to `http://localhost:3001/sse`.

### MCP Stdio Server (Claude Desktop)

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "chandam": {
      "command": "docker",
      "args": ["run", "-i", "--rm", "ghcr.io/miriyald/chandam-mcp-stdio:latest"]
    }
  }
}
```

---

## Running All Services Together

```bash
# Pull all images
docker pull ghcr.io/miriyald/chandam-wasm:latest
docker pull ghcr.io/miriyald/chandam-api:latest
docker pull ghcr.io/miriyald/chandam-mcp-http:latest

# Run
docker run -d -p 8082:80 --name chandam-wasm ghcr.io/miriyald/chandam-wasm:latest
docker run -d -p 8080:8080 --name chandam-api ghcr.io/miriyald/chandam-api:latest
docker run -d -p 3001:3001 --name chandam-mcp-http ghcr.io/miriyald/chandam-mcp-http:latest
```

Or use docker-compose (for local builds):

```bash
docker-compose up -d
```

---

## Configuration

### Environment Variables (API & MCP Http)

| Variable | Default | Description |
|----------|---------|-------------|
| `CHANDAM_RULESET` | `default` | Rule set to load (`default`, `chandam-rules`, `telugu-complete`) |
| `ASPNETCORE_URLS` | `http://+:8080` | Listen URL |
| `ASPNETCORE_ENVIRONMENT` | `Production` | Environment |

### Custom Rule Files

Mount your own rule YAML/JSON files:

```bash
docker run -d -p 8080:8080 \
  -v $(pwd)/my-rules:/app/Chandam.Config/Rules:ro \
  -e CHANDAM_RULESET=telugu-complete \
  ghcr.io/miriyald/chandam-api:latest
```

### Available Rule Sets

| Identifier | Rules | Description |
|------------|-------|-------------|
| `default` | 379 | Compiled Telugu rules (no volume needed) |
| `chandam-rules` | 14 | Frequent Telugu Chandams |
| `telugu-complete` | 379 | All Telugu rules (from YAML) |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/api/determine` | Auto-detect meter |
| POST | `/api/try-match` | Match against specific rule |
| POST | `/api/scores` | Ranked scores for all rules |
| GET | `/api/rules` | List all rules |
| GET | `/api/rules/{id}` | Get rule details |
| GET | `/api/rules/{id}/samples` | Get example poems |

### Example: Determine Meter

```bash
curl -X POST http://localhost:8080/api/determine \
  -H "Content-Type: application/json" \
  -d '{
    "poemText": "తేనెలేని తేటతేనె దొరకునె ధరణిపై\nజానకీవరుండు లేని జగమందు నెవ్వరున్",
    "language": "te",
    "matchYati": true,
    "matchPrasa": true,
    "topMatches": 5
  }'
```

### Example: Try Specific Rule

```bash
curl -X POST http://localhost:8080/api/try-match \
  -H "Content-Type: application/json" \
  -d '{
    "poemText": "శ్రీవాణీగిరిజాశ్చిరాయ దధతో వక్షోముఖాంగేషు యే",
    "ruleIdentifier": "Sardulavikreeditamu",
    "matchYati": true,
    "matchPrasa": true
  }'
```

---

## NuGet Package (GitHub Packages)

The `Chandam` package bundles the core analysis engine for use in .NET applications.

**Package:** `Chandam`  
**Feed:** `https://nuget.pkg.github.com/miriyald/index.json`  
**Contents:** Chandam.Core, Chandam.Util, Chandam.Indic, Chandam.Rules

### Setup

Add the GitHub Packages feed to your `nuget.config`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <packageSources>
    <add key="nuget.org" value="https://api.nuget.org/v3/index.json" />
    <add key="chandam" value="https://nuget.pkg.github.com/miriyald/index.json" />
  </packageSources>
</configuration>
```

GitHub Packages requires authentication. Create a [Personal Access Token](https://github.com/settings/tokens) with `read:packages` scope:

```bash
dotnet nuget update source chandam \
  --username YOUR_GITHUB_USERNAME \
  --password YOUR_GITHUB_PAT \
  --store-password-in-clear-text
```

### Install

```bash
dotnet add package Chandam --prerelease
```

### Usage

```csharp
using Chandam.API;

// Load rules from JSON/YAML files
var ruleLoader = new RuleLoader();
var rules = ruleLoader.LoadRules("path/to/rules.yaml");

// Create the service
var service = new ChandamService(rules);

// Analyze a poem
var result = service.Determine(
    poemText: "తేనెలేని తేటతేనె దొరకునె ధరణిపై",
    language: Language.Telugu,
    matchYati: true,
    matchPrasa: true
);

if (result.Success)
{
    Console.WriteLine($"Meter: {result.Matches[0].Rule.Name}");
    Console.WriteLine($"Match: {result.Matches[0].MatchPercentage}%");
}
```

---

## Health Checks

All containers (except MCP Stdio) include built-in health checks:

```bash
# Check container health status
docker inspect --format='{{.State.Health.Status}}' chandam-api

# API health endpoint
curl http://localhost:8080/health

# MCP HTTP health endpoint
curl http://localhost:3001/health
```

---

## Pinning a Version

To avoid unexpected updates, pin to a specific build:

```bash
# Docker
docker run -d -p 8080:8080 ghcr.io/miriyald/chandam-api:20260511.143022

# NuGet
dotnet add package Chandam --version 20260511.143022-beta
```

---

## Troubleshooting

### Container won't start

```bash
docker logs chandam-api
```

### Port already in use

```bash
docker run -d -p 9000:8080 ghcr.io/miriyald/chandam-api:latest
```

### Rules not loading

```bash
docker exec chandam-api ls -la /app/Chandam.Config/Rules
docker exec chandam-api env | grep CHANDAM
```

### Authentication error pulling images

GHCR public images don't require auth. If the repo is private:

```bash
echo $GITHUB_PAT | docker login ghcr.io -u YOUR_USERNAME --password-stdin
```

---

## Building Locally

If you prefer to build images yourself:

```bash
# API (multi-stage, self-contained)
docker build -f Chandam.API.WebApi/Dockerfile -t chandam-api .

# MCP Http (requires pre-build)
dotnet publish Chandam.MCP.Http/Chandam.MCP.Http.csproj -c Release -o Publish/chandam-mcp-http
docker build -f Chandam.MCP.Http/Dockerfile -t chandam-mcp-http .

# MCP Stdio (requires pre-build)
dotnet publish Chandam.MCP.Stdio/Chandam.MCP.Stdio.csproj -c Release -o Publish/chandam-mcp-stdio
docker build -f Chandam.MCP.Stdio/Dockerfile -t chandam-mcp-stdio .

# WASM (multi-stage, self-contained)
docker build -f Chandam.Wasm/Dockerfile -t chandam-wasm .
```
