# Chandam MCP HTTP Server
# Build on Windows first: dotnet publish Chandam.MCP.Http/Chandam.MCP.Http.csproj -c Release -o Publish/chandam-mcp-http

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

COPY Publish/chandam-mcp-http .
COPY Chandam.Config/Rules/*.yaml ./Chandam.Config/Rules/

VOLUME ["/app/Chandam.Config/Rules"]

EXPOSE 3001

ENV ASPNETCORE_URLS=http://+:3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health -m 2 || exit 1

ENTRYPOINT ["dotnet", "Chandam.MCP.Http.dll"]
