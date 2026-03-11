# Chandam MCP Stdio Server
# Build on Windows first: dotnet publish Chandam.MCP.Stdio/Chandam.MCP.Stdio.csproj -c Release -o Publish/chandam-mcp-stdio
# Usage: docker run -i chandam-mcp-stdio (stdin/stdout for JSON-RPC)

FROM mcr.microsoft.com/dotnet/runtime:8.0 AS runtime
WORKDIR /app

COPY Publish/chandam-mcp-stdio .
COPY Chandam.Config ./Chandam.Config

VOLUME ["/app/Chandam.Config/Rules"]

ENTRYPOINT ["dotnet", "Chandam.MCP.Stdio.dll"]
