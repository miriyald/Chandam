# Chandam API - Docker Multi-Stage Build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy project files
COPY ["Chandam.API.WebApi/Chandam.API.WebApi.csproj", "Chandam.API.WebApi/"]
COPY ["Chandam.API/Chandam.API.csproj", "Chandam.API/"]
COPY ["Core/Chandam.Core.csproj", "Core/"]
COPY ["Rules/Chandam.Rules.csproj", "Rules/"]
COPY ["Util/Chandam.Util.csproj", "Util/"]
COPY ["Strings/Chandam.Indic.csproj", "Strings/"]
COPY ["Samples/Chandam.Samples.csproj", "Samples/"]

# Restore dependencies
RUN dotnet restore "Chandam.API.WebApi/Chandam.API.WebApi.csproj"

# Copy source code
COPY Chandam.API.WebApi/ Chandam.API.WebApi/
COPY Chandam.API/ Chandam.API/
COPY Core/ Core/
COPY Rules/ Rules/
COPY Util/ Util/
COPY Strings/ Strings/
COPY Samples/ Samples/

# Build and publish
WORKDIR "/src/Chandam.API.WebApi"
RUN dotnet build "Chandam.API.WebApi.csproj" -c Release -o /app/build
RUN dotnet publish "Chandam.API.WebApi.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime image
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# Install required dependencies for .NET Framework 4.8 assemblies
RUN apt-get update && apt-get install -y \
    libc6-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy published app
COPY --from=build /app/publish .

# Copy config files (if they exist)
COPY --from=build /src/config ./config

# Create volume mount point for rule files
VOLUME ["/app/config/rules"]

# Expose port
EXPOSE 8080

# Set environment
ENV ASPNETCORE_URLS=http://+:8080
ENV CHANDAM_RULESET=default

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

ENTRYPOINT ["dotnet", "Chandam.API.WebApi.dll"]
