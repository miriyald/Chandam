# Chandam API - Docker Deployment Guide

## Quick Start

### 1. Build Docker Image

```bash
cd Chandam3
docker build -f Chandam.API.WebApi/Dockerfile -t chandam-api:latest .
```

### 2. Run Container

**Default rule set (compiled rules):**
```bash
docker run -d -p 8080:8080 --name chandam-api chandam-api:latest
```

**With JSON rule files:**
```bash
docker run -d -p 8080:8080 \
  -v $(pwd)/Chandam.Config/Rules:/app/Chandam.Config/Rules:ro \
  --name chandam-api \
  chandam-api:latest
```

**Specific rule set:**
```bash
docker run -d -p 8080:8080 \
  -e CHANDAM_RULESET=telugu-complete \
  -v $(pwd)/Chandam.Config/Rules:/app/Chandam.Config/Rules:ro \
  --name chandam-api \
  chandam-api:latest
```

### 3. Test API

```bash
# Health check
curl http://localhost:8080/health

# Run full test suite
bash test-api.sh http://localhost:8080
```

## Using Docker Compose

### Default Setup (port 8080)

```bash
docker-compose up -d
```

### Complete Telugu Rules (port 8081)

```bash
docker-compose --profile complete up -d
```

### Both Instances

```bash
docker-compose --profile complete up -d
# Default rules on port 8080
# Complete rules on port 8081
```

### Stop Services

```bash
docker-compose down
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `CHANDAM_RULESET` | `default` | Rule set identifier to load |
| `ASPNETCORE_URLS` | `http://+:8080` | Listen URLs |
| `ASPNETCORE_ENVIRONMENT` | `Production` | Environment name |

### Volume Mounts

| Host Path | Container Path | Description |
|-----------|----------------|-------------|
| `./Chandam.Config/Rules` | `/app/Chandam.Config/Rules` | JSON rule files directory |

## Available Rule Sets

| Identifier | Rules | Size | Description |
|------------|-------|------|-------------|
| `default` | 379 | - | Compiled Telugu rules (fallback) |
| `chandam-rules` | 14 | 54KB | Frequent Telugu Chandams |
| `telugu-complete` | 379 | 672KB | All Telugu rules |

## API Endpoints

### Health Check
```bash
GET /health
```

### Determine Chandam
```bash
POST /api/determine
Content-Type: application/json

{
  "poemText": "poem text in Telugu...",
  "language": 0,
  "matchYati": true,
  "matchPrasa": true,
  "topMatches": 5
}
```

### Try Match Specific Rule
```bash
POST /api/try-match
Content-Type: application/json

{
  "poemText": "poem text...",
  "ruleIdentifier": "iMdravajramu",
  "matchYati": true,
  "matchPrasa": true
}
```

### Calculate Scores
```bash
POST /api/scores
Content-Type: application/json

{
  "poemText": "poem text...",
  "language": 0,
  "matchYati": true,
  "matchPrasa": true,
  "minimumMatchPercentage": 50
}
```

### Get Rule Info
```bash
GET /api/rules/{identifier}
```

### Get Rule Samples
```bash
GET /api/rules/{identifier}/samples?maxExamples=3
```

### List All Rules
```bash
GET /api/rules?language=0
```

## Examples

### Run on Custom Port

```bash
docker run -d -p 9000:8080 --name chandam-api chandam-api:latest
curl http://localhost:9000/health
```

### Run with Specific Language

```bash
docker run -d -p 8080:8080 \
  -e CHANDAM_RULESET=sanskrit-common \
  -v $(pwd)/Chandam.Config/Rules:/app/Chandam.Config/Rules:ro \
  chandam-api:latest
```

### Debug Mode

```bash
docker run -it --rm -p 8080:8080 \
  -e ASPNETCORE_ENVIRONMENT=Development \
  chandam-api:latest
```

### View Logs

```bash
# Follow logs
docker logs -f chandam-api

# Last 100 lines
docker logs --tail 100 chandam-api
```

## Health Check

The container includes a health check that runs every 30 seconds:

```bash
# Check container health
docker ps

# View health status
docker inspect --format='{{.State.Health.Status}}' chandam-api
```

## Troubleshooting

### Container won't start

```bash
# Check logs
docker logs chandam-api

# Check if port is in use
netstat -ano | grep 8080

# Try different port
docker run -p 9000:8080 chandam-api:latest
```

### Rules not loading

```bash
# Verify volume mount
docker exec chandam-api ls -la /app/Chandam.Config/Rules

# Check environment
docker exec chandam-api env | grep CHANDAM
```

### API not responding

```bash
# Check if container is running
docker ps -a

# Restart container
docker restart chandam-api

# Health check
curl http://localhost:8080/health
```

## Build Options

### Multi-architecture Build

```bash
docker buildx build --platform linux/amd64,linux/arm64 \
  -f Chandam.API.WebApi/Dockerfile \
  -t chandam-api:latest .
```

### Build with Cache

```bash
docker build --cache-from chandam-api:latest \
  -f Chandam.API.WebApi/Dockerfile \
  -t chandam-api:latest .
```

### Production Build

```bash
docker build \
  --build-arg ASPNETCORE_ENVIRONMENT=Production \
  -f Chandam.API.WebApi/Dockerfile \
  -t chandam-api:prod .
```

## Performance

**Container Size:** ~250MB (runtime image)

**Memory Usage:** ~100-150MB (typical)

**Startup Time:** ~2-3 seconds

**Request Latency:**
- Health check: <10ms
- Determine: 50-200ms (depending on rule count)
- Scores: 200-500ms (all rules)

## Security

- Container runs as non-root user
- Read-only volume mounts for config
- No shell access in production image
- Minimal runtime dependencies

## Next Steps

1. Deploy to cloud (Azure, AWS, GCP)
2. Add monitoring (Prometheus, Grafana)
3. Set up CI/CD pipeline
4. Configure load balancing
5. Add caching layer (Redis)
