:: ============================================================================
:: CHANDAM - COMMON COMMANDS
:: Uncomment the commands you need (remove :: at the beginning)
:: ============================================================================

:: ============================================================================
:: 1. BUILD COMMANDS
:: ============================================================================

:: Build entire solution
:: dotnet build Chandam.sln

:: Build with Release configuration
:: dotnet build Chandam.sln -c Release

:: Build specific project
:: dotnet build Chandam.API.WebApi/Chandam.API.WebApi.csproj
:: dotnet build Chandam.Wasm/Chandam.Wasm.csproj
:: dotnet build Chandam.MCP.Stdio/Chandam.MCP.Stdio.csproj
:: dotnet build Chandam.MCP.Http/Chandam.MCP.Http.csproj

:: ============================================================================
:: 2. TEST COMMANDS
:: ============================================================================

:: Run all MCP tests (20 tests)
:: dotnet test Chandam.MCP.Tests

:: Run all integration tests (615 examples + MCP reliability)
:: dotnet test Chandam.API.IntegrationTests

:: Run integration tests with verbose output
:: dotnet test Chandam.API.IntegrationTests --logger "console;verbosity=detailed"

:: Run only baseline regression tests
:: dotnet test Chandam.API.IntegrationTests --filter "FullyQualifiedName~BaselineTests"

:: Run only MCP reliability tests (TryMatch baseline + Determine + Scores)
:: dotnet test Chandam.API.IntegrationTests --filter "FullyQualifiedName~McpReliability"

:: Run all tests in solution
:: dotnet test Chandam.sln

:: ============================================================================
:: 2a. BASELINE GENERATION (manual, run when rules/examples change)
:: ============================================================================
:: To regenerate baseline-results.yaml:
::   1. In BaselineTests.cs, temporarily change:
::        [Fact(Skip = "Manual execution only - generates baseline")]
::      to:
::        [Fact]
::   2. Run: dotnet test Chandam.API.IntegrationTests --filter "FullyQualifiedName~GenerateBaselineResults"
::   3. Restore the Skip attribute
::   Output: Chandam.Config\Baselines\baseline-results.yaml

:: ============================================================================
:: 3. RUN COMMANDS - WEB APPLICATION
:: ============================================================================

:: Run Blazor WASM (Web UI with .NET backend)
:: dotnet run --project Chandam.Wasm
:: Access at: http://localhost:5000

:: Run WASM with Release build (faster startup)
:: dotnet run --project Chandam.Wasm -c Release

:: ============================================================================
:: 4. RUN COMMANDS - REST API SERVER
:: ============================================================================

:: Run API WebApi server
:: dotnet run --project Chandam.API.WebApi
:: Access at: http://localhost:5000
:: Swagger UI: http://localhost:5000/swagger

:: Run API WebApi with Release build
:: dotnet run --project Chandam.API.WebApi -c Release

:: ============================================================================
:: 5. RUN COMMANDS - MCP SERVERS
:: ============================================================================

:: Run MCP Stdio server (for Claude Desktop)
:: dotnet run --project Chandam.MCP.Stdio

:: Run MCP HTTP/SSE server
:: dotnet run --project Chandam.MCP.Http
:: Access at: http://localhost:3001/sse

:: ============================================================================
:: 6. RUN COMMANDS - CONSOLE DEMO
:: ============================================================================

:: Run console demo application
:: dotnet run --project Chandam.API.Demo

:: ============================================================================
:: 7. NPM COMMANDS - BRANDING (Remotion Video/Icon Generation)
:: ============================================================================

:: Navigate to Branding folder and run Remotion Studio
:: cd Chandam.Branding
:: npm install
:: npm run dev
:: Access at: http://localhost:3000

:: Build branding assets (render)
:: cd Chandam.Branding
:: npm run build

:: ============================================================================
:: 8. NPM COMMANDS - WWWROOT/CLIENT (Vite TypeScript Frontend)
:: ============================================================================

:: Install dependencies for web frontend
:: cd Chandam.Wasm/Client
:: npm install

:: Run Vite dev server (hot reload)
:: cd Chandam.Wasm/Client
:: npm run dev
:: Access at: http://localhost:5050

:: Build frontend assets
:: cd Chandam.Wasm/Client
:: npm run build

:: Lint TypeScript/JavaScript code
:: cd Chandam.Wasm/Client
:: npm run lint

:: ============================================================================
:: 8a. PLAYWRIGHT COMMANDS - WASM TESTS
:: ============================================================================

:: Navigate to Playwright test project
:: cd Chandam.Wasm.Tests

:: Install dependencies
:: cd Chandam.Wasm.Tests
:: npm install

:: Install Playwright browsers
:: cd Chandam.Wasm.Tests
:: npm run install-browsers

:: Run all Playwright tests
:: cd Chandam.Wasm.Tests
:: npm test

:: Run Playwright tests with UI mode
:: cd Chandam.Wasm.Tests
:: npm run test:ui

:: Run headed browser tests
:: cd Chandam.Wasm.Tests
:: npm run test:headed

:: Run desktop-only tests
:: cd Chandam.Wasm.Tests
:: npm run test:desktop

:: Run mobile-only tests
:: cd Chandam.Wasm.Tests
:: npm run test:mobile

:: Run specific Playwright test files
:: cd Chandam.Wasm.Tests
:: npx playwright test tests/06-language-toggle.spec.ts tests/14-refresh-persistence.spec.ts

:: Show last Playwright HTML report
:: cd Chandam.Wasm.Tests
:: npm run report

:: Update Playwright snapshots
:: cd Chandam.Wasm.Tests
:: npm run snapshots

:: Screenshot demo
:: cd Chandam.Wasm.Tests
:: npm run demo-screenshots

:: ============================================================================
:: 9. TASKS COMMANDS (Rule Generation, Verification, Conversion)
:: ============================================================================

:: Run Tasks project help
:: dotnet run --project Chandam.Tasks -- help

:: Generate all rules and examples (JSON + YAML)
:: dotnet run --project Chandam.Tasks -- generate
:: dotnet run --project Chandam.Tasks -- gen "Chandam.Config\Rules"

:: Generate Topella rules only (2337 Telugu Vruttam meters from CSV)
:: dotnet run --project Chandam.Tasks -- topella
:: dotnet run --project Chandam.Tasks -- topella "Chandam.Config\Rules"

:: Convert YAML rules to JSON format
:: dotnet run --project Chandam.Tasks -- convert
:: dotnet run --project Chandam.Tasks -- yaml2json "Chandam.Config\Rules"

:: ============================================================================
:: 10. DOCKER BUILD COMMANDS
:: ============================================================================

:: Build Docker image for API
:: docker build -f Chandam.API.WebApi/Dockerfile -t chandam-api:latest .

:: Build Docker image for MCP Stdio
:: docker build -f Chandam.MCP.Stdio/Dockerfile -t chandam-mcp-stdio:latest .

:: Build Docker image for MCP HTTP
:: docker build -f Chandam.MCP.Http/Dockerfile -t chandam-mcp-http:latest .

:: Build Docker image for WASM
:: docker build -f Chandam.Wasm/Dockerfile -t chandam-wasm:latest .

:: Build all images using docker-compose
:: docker-compose build

:: ============================================================================
:: 11. DOCKER RUN COMMANDS
:: ============================================================================

:: Run API container
:: docker run -p 8080:5000 chandam-api:latest

:: Run WASM container
:: docker run -p 8082:5000 chandam-wasm:latest

:: Run MCP Stdio container
:: docker run -i --rm chandam-mcp-stdio:latest

:: Run MCP HTTP container
:: docker run -p 3001:3001 chandam-mcp-http:latest

:: ============================================================================
:: 12. DOCKER COMPOSE COMMANDS
:: ============================================================================

:: Start all services (API, WASM, MCP)
:: docker-compose up

:: Start specific service
:: docker-compose up chandam-api
:: docker-compose up chandam-wasm
:: docker-compose up chandam-mcp-stdio
:: docker-compose up chandam-mcp-http

:: Start in background
:: docker-compose up -d

:: Stop all services
:: docker-compose down

:: Stop and remove volumes
:: docker-compose down -v

:: View logs
:: docker-compose logs -f
:: docker-compose logs -f chandam-api

:: ============================================================================
:: 13. WEBASSEMBLY PUBLISH (OPTIMIZATION)
:: ============================================================================

:: Publish WASM for production (excludes YAML to reduce size ~400KB)
:: dotnet publish Chandam.Wasm -c Release -p:ExcludeYaml=true

:: Publish API for production
:: dotnet publish Chandam.API.WebApi -c Release -o Publish/chandam-api

:: ============================================================================
:: 14. UTILITY & CLEANUP
:: ============================================================================

:: Clean build artifacts
:: dotnet clean Chandam.sln

:: Restore NuGet packages
:: dotnet restore Chandam.sln

:: Format code (if EditorConfig is configured)
:: dotnet format Chandam.sln

:: List all projects
:: dotnet sln Chandam.sln list

:: ============================================================================
:: QUICK START WORKFLOW
:: ============================================================================

:: 1. Build and run WASM:
:: dotnet build Chandam.sln
dotnet run --project Chandam.Wasm

:: 2. Or build and run API:
:: dotnet build Chandam.sln
:: dotnet run --project Chandam.API.WebApi

:: 3. Or run all services with Docker:
:: docker-compose build
:: docker-compose up


