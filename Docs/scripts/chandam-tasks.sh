#!/bin/bash
# Chandam Tasks - Convenience wrapper for Linux/Mac
# Usage: ./chandam-tasks.sh <command> [options]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/../.."
dotnet run --project Chandam.Tasks --no-build -- "$@"
