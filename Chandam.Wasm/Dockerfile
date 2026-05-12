# Chandam WASM - Multi-Stage Build
# Builds Blazor WASM app with TypeScript/Vite frontend and serves as static files via nginx
# Compatible with GitHub Pages-style static hosting

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Install Node.js for TypeScript/Vite build
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs

# Copy project files for restore
COPY ["Chandam.Wasm/Chandam.Wasm.csproj", "Chandam.Wasm/"]
COPY ["Chandam.API/Chandam.API.csproj", "Chandam.API/"]
COPY ["Chandam.Core/Chandam.Core.csproj", "Chandam.Core/"]
COPY ["Chandam.Rules/Chandam.Rules.csproj", "Chandam.Rules/"]
COPY ["Chandam.Util/Chandam.Util.csproj", "Chandam.Util/"]
COPY ["Chandam.Indic/Chandam.Indic.csproj", "Chandam.Indic/"]
COPY ["Chandam.Samples/Chandam.Samples.csproj", "Chandam.Samples/"]

# Restore
RUN dotnet restore "Chandam.Wasm/Chandam.Wasm.csproj" -p:ExcludeYaml=true

# Copy source code
COPY Chandam.Wasm/ Chandam.Wasm/
COPY Chandam.API/ Chandam.API/
COPY Chandam.Config/Rules/ Chandam.Config/Rules/
COPY Chandam.Core/ Chandam.Core/
COPY Chandam.Rules/ Chandam.Rules/
COPY Chandam.Util/ Chandam.Util/
COPY Chandam.Indic/ Chandam.Indic/
COPY Chandam.Samples/ Chandam.Samples/

# Build TypeScript/Vite (MSBuild will handle this, but copy Client separately for clarity)
WORKDIR /src/Chandam.Wasm/Client
RUN npm install && npm run build

# Publish with YamlDotNet excluded (npm build already ran above)
WORKDIR /src
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
