# Chandam API - HTTP Server

Simple HTTP wrapper around Chandam.API for testing and deployment.

## Features

- 5 core endpoints: `/api/determine`, `/api/try-match`, `/api/scores`, `/api/rules/{id}`, `/api/rules/{id}/samples`
- Rule set selection via `CHANDAM_RULESET` environment variable
- Health check endpoint at `/health`
- Unicode/Telugu text support
- CORS enabled for development

## Endpoints

### POST /api/determine
Auto-detect best matching Chandam for a poem.

**Request:**
```json
{
  "poemText": "సామర్థ్యలీలన్ తతజద్విగంబుల్...",
  "language": 0,
  "matchYati": true,
  "matchPrasa": true,
  "topMatches": 5
}
```

### POST /api/try-match
Match poem against specific Chandam rule.

**Request:**
```json
{
  "poemText": "సామర్థ్యలీలన్ తతజద్విగంబుల్...",
  "ruleIdentifier": "iMdravajramu",
  "matchYati": true,
  "matchPrasa": true
}
```

### POST /api/scores
Calculate match scores for all rules.

**Request:**
```json
{
  "poemText": "సామర్థ్యలీలన్ తతజద్విగంబుల్...",
  "language": 0,
  "matchYati": true,
  "matchPrasa": true,
  "minimumMatchPercentage": 50
}
```

### GET /api/rules/{identifier}
Get detailed information about a Chandam rule.

**Example:** `GET /api/rules/iMdravajramu`

### GET /api/rules/{identifier}/samples
Get example poems for a Chandam.

**Example:** `GET /api/rules/iMdravajramu/samples?maxExamples=3`

### GET /api/rules
List all available rules (optionally filtered by language).

**Example:** `GET /api/rules?language=0`

### GET /health
Health check endpoint showing loaded rule sets.

## Running Locally

```bash
dotnet run
# API available at http://localhost:5000
```

## Running with Docker

### Build and run:
```bash
cd Chandam3
docker build -f Chandam.API.WebApi/Dockerfile -t chandam-api:latest .
docker run -p 8080:8080 -v $(pwd)/config/rules:/app/config/rules chandam-api:latest
```

### Using docker-compose:
```bash
# Start with default rule set
docker-compose up

# Start with complete Telugu rules
docker-compose --profile complete up chandam-api-complete

# Run in background
docker-compose up -d
```

### Environment Variables:
- `CHANDAM_RULESET`: Rule set identifier (default: "default")
- `ASPNETCORE_URLS`: Listen URLs (default: "http://+:8080")

## Testing

```bash
# Health check
curl http://localhost:8080/health

# Determine Chandam
curl -X POST http://localhost:8080/api/determine \
  -H "Content-Type: application/json" \
  -d '{
    "poemText": "సామర్థ్యలీలన్ తతజద్విగంబుల్\nభూమిధ్రవిశ్రాంతుల బొంది యొప్పున్\nప్రేమంబుతో నైందవబింబవక్త్రున్\nహేమాంబురుం బాడుదు రింద్రవజ్రన్",
    "language": 0,
    "matchYati": true,
    "matchPrasa": true
  }'

# Get rule info
curl http://localhost:8080/api/rules/iMdravajramu

# List all rules
curl http://localhost:8080/api/rules
```

## Configuration

Edit `appsettings.json`:
```json
{
  "Chandam": {
    "RulesPath": "config/rules",
    "RuleSet": "default"
  }
}
```
