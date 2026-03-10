#!/bin/bash
# Build script for Chandam API Docker image

set -e

echo "=== Building Chandam API Docker Image ==="
echo

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed or not in PATH"
    exit 1
fi

# Build the image
echo "Building chandam-api:latest..."
docker build \
  -f Chandam.API.WebApi/Dockerfile \
  -t chandam-api:latest \
  --progress=plain \
  .

echo
echo "✓ Build complete!"
echo
echo "Image details:"
docker images chandam-api:latest

echo
echo "To run the container:"
echo "  docker run -d -p 8080:8080 --name chandam-api chandam-api:latest"
echo
echo "With custom rules:"
echo "  docker run -d -p 8080:8080 -v \$(pwd)/Config/Rules:/app/Config/Rules chandam-api:latest"
echo
echo "Using docker-compose:"
echo "  docker-compose up -d"
