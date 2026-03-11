# Chandam WASM - Multi-Stage Build
# Builds Blazor WASM app and serves as static files via nginx
# Compatible with GitHub Pages-style static hosting

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy project files for restore
COPY ["Chandam.Wasm/Chandam.Wasm.csproj", "Chandam.Wasm/"]
COPY ["Chandam.API/Chandam.API.csproj", "Chandam.API/"]
COPY ["Core/Chandam.Core.csproj", "Core/"]
COPY ["Rules/Chandam.Rules.csproj", "Rules/"]
COPY ["Util/Chandam.Util.csproj", "Util/"]
COPY ["Strings/Chandam.Indic.csproj", "Strings/"]
COPY ["Samples/Chandam.Samples.csproj", "Samples/"]

# Restore
RUN dotnet restore "Chandam.Wasm/Chandam.Wasm.csproj" -p:ExcludeYaml=true

# Copy source code
COPY Chandam.Wasm/ Chandam.Wasm/
COPY Chandam.API/ Chandam.API/
COPY Core/ Core/
COPY Rules/ Rules/
COPY Util/ Util/
COPY Strings/ Strings/
COPY Samples/ Samples/

# Publish with YamlDotNet excluded
RUN dotnet publish "Chandam.Wasm/Chandam.Wasm.csproj" -c Release -p:ExcludeYaml=true -o /app/publish

# Serve with nginx
FROM nginx:alpine AS runtime

# Copy published static files
COPY --from=build /app/publish/wwwroot /usr/share/nginx/html

# nginx config for Blazor WASM SPA routing + correct MIME types
COPY Chandam.Wasm/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost/ || exit 1
