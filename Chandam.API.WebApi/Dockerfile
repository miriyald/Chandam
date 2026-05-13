# Chandam API - Docker Multi-Stage Build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy project files
COPY ["Chandam.API.WebApi/Chandam.API.WebApi.csproj", "Chandam.API.WebApi/"]
COPY ["Chandam.API/Chandam.API.csproj", "Chandam.API/"]
COPY ["Chandam.Core/Chandam.Core.csproj", "Chandam.Core/"]
COPY ["Chandam.Util/Chandam.Util.csproj", "Chandam.Util/"]
COPY ["Chandam.Indic/Chandam.Indic.csproj", "Chandam.Indic/"]

# Restore dependencies (will restore for all targets)
RUN dotnet restore "Chandam.API.WebApi/Chandam.API.WebApi.csproj"

# Copy source code
COPY Chandam.API.WebApi/ Chandam.API.WebApi/
COPY Chandam.API/ Chandam.API/
COPY Chandam.Core/ Chandam.Core/
COPY Chandam.Util/ Chandam.Util/
COPY Chandam.Indic/ Chandam.Indic/
COPY Chandam.Config/ Chandam.Config/

# Build and publish
WORKDIR "/src/Chandam.API.WebApi"
RUN dotnet build "Chandam.API.WebApi.csproj" -c Release -o /app/build
RUN dotnet publish "Chandam.API.WebApi.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime image
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# Install curl for healthcheck
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Copy published app
COPY --from=build /app/publish .

# Copy config files (if they exist)
COPY --from=build /src/Chandam.Config ./Chandam.Config

# Create volume mount point for rule files
VOLUME ["/app/Chandam.Config/Rules"]

# Expose port
EXPOSE 8080

# Set environment
ENV ASPNETCORE_URLS=http://+:8080
ENV CHANDAM_RULESET=default

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

ENTRYPOINT ["dotnet", "Chandam.API.WebApi.dll"]
