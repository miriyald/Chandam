# Command-Line Interface Support - Implementation Complete

## Date
2026-03-31

## Summary
Added command-line argument support to Chandam.Tasks for performing various operations without editing code.

---

## Changes Made

### 1. ✅ Updated Program.cs

**File**: [Chandam.Tasks/Program.cs](../../Chandam.Tasks/Program.cs)

**Changes**:
- Replaced hardcoded task execution with command-line argument parser
- Added `Main(string[] args)` with exit codes
- Implemented command routing with pattern matching
- Added help system
- Removed `Console.ReadKey()` to support non-interactive execution

**Supported Commands**:
1. `generate` or `gen` - Generate rules and examples from class files
2. `convert` or `yaml2json` - Convert YAML files to JSON
3. `help`, `--help`, `-h`, `/?` - Show usage information

---

## Usage

### Command Format

```bash
dotnet run --project Chandam.Tasks -- <command> [options]
```

Or after building:
```bash
Chandam.Tasks.exe <command> [options]
```

---

### 1. Generate Rules and Examples

**Generate from class files** (creates JSON + YAML):

```bash
# Default output directory (Chandam.Config\Rules)
dotnet run --project Chandam.Tasks -- gen

# Custom output directory
dotnet run --project Chandam.Tasks -- generate C:\Output\Rules
```

**Output Files**:
- `chandam-rules.json/yaml` - 14 frequent rules
- `telugu-complete.json/yaml` - 379 Telugu rules
- `chandam-examples.json/yaml` - Examples for 14 frequent rules
- `telugu-complete-examples.json/yaml` - Examples for 317 rules

**Example Output**:
```
=== Generating Rules and Examples ===

Generating chandam-rules.json (frequent rules only)...
  ✓ Saved JSON: Chandam.Config\Rules\chandam-rules.json
  ✓ Saved YAML: Chandam.Config\Rules\chandam-rules.yaml
  ✓ Generated 14 frequent rules (JSON + YAML)

Generating telugu-complete.json (all Telugu rules)...
  ✓ Generated 379 Telugu rules (JSON + YAML)

=== Generation Complete ===
```

---

### 2. Convert YAML to JSON

**Convert all YAML files** to JSON:

```bash
# Convert in same directory
dotnet run --project Chandam.Tasks -- convert

# Specify input directory
dotnet run --project Chandam.Tasks -- yaml2json C:\Rules

# Specify input and output directories
dotnet run --project Chandam.Tasks -- convert C:\Rules C:\Output
```

**Example Output**:
```
=== Converting YAML to JSON ===

Converting chandam-rules.yaml → chandam-rules.json...
  ✓ chandam-rules.json (14,784 bytes, +4,815 bytes vs YAML)

Converting telugu-complete.yaml → telugu-complete.json...
  ✓ telugu-complete.json (383,276 bytes, +130,867 bytes vs YAML)

=== Conversion Complete ===
  ✓ Success: 4
```

---

### 3. Get Help

```bash
# Show help
dotnet run --project Chandam.Tasks -- help

# Alternative help commands
dotnet run --project Chandam.Tasks -- --help
dotnet run --project Chandam.Tasks -- -h
dotnet run --project Chandam.Tasks -- /?

# No arguments also shows help
dotnet run --project Chandam.Tasks
```

---

## Convenience Scripts

Created wrapper scripts for easier execution:

### Windows Batch File

**File**: [Docs/Scripts/chandam-tasks.bat](../../Docs/Scripts/chandam-tasks.bat)

**Usage**:
```cmd
cd Docs\Scripts
chandam-tasks.bat gen
chandam-tasks.bat convert
chandam-tasks.bat help
```

### Linux/Mac Shell Script

**File**: [Docs/Scripts/chandam-tasks.sh](../../Docs/Scripts/chandam-tasks.sh)

**Setup**:
```bash
chmod +x Docs/Scripts/chandam-tasks.sh
```

**Usage**:
```bash
cd Docs/Scripts
./chandam-tasks.sh gen
./chandam-tasks.sh convert
./chandam-tasks.sh help
```

---

## Integration Examples

### Build Scripts

**PowerShell** (build.ps1):
```powershell
# Build solution
dotnet build Chandam.sln

# Generate rules and examples
dotnet run --project Chandam.Tasks --no-build -- gen

# Convert YAML to JSON for deployment
dotnet run --project Chandam.Tasks --no-build -- convert
```

**Bash** (build.sh):
```bash
#!/bin/bash
# Build solution
dotnet build Chandam.sln

# Generate rules and examples
dotnet run --project Chandam.Tasks --no-build -- gen

# Convert YAML to JSON for deployment
dotnet run --project Chandam.Tasks --no-build -- convert
```

### CI/CD Pipeline

**GitHub Actions**:
```yaml
- name: Generate Rules
  run: dotnet run --project Chandam.Tasks -- gen

- name: Convert YAML to JSON
  run: dotnet run --project Chandam.Tasks -- convert

- name: Copy JSON files to WASM
  run: cp Chandam.Config/Rules/*.json Chandam.Wasm/wwwroot/data/
```

**Azure DevOps**:
```yaml
- task: DotNetCoreCLI@2
  displayName: 'Generate Rules'
  inputs:
    command: run
    projects: Chandam.Tasks/Chandam.Tasks.csproj
    arguments: '-- gen'

- task: DotNetCoreCLI@2
  displayName: 'Convert YAML to JSON'
  inputs:
    command: run
    projects: Chandam.Tasks/Chandam.Tasks.csproj
    arguments: '-- convert'
```

---

## Command Reference

### generate / gen

**Purpose**: Generate rules and examples from C# class files

**Syntax**: `gen [output-directory]`

**Default**: `Chandam.Config\Rules`

**Generates**:
- Rules (JSON + YAML)
- Examples (JSON + YAML)
- 8 files total

**Use When**:
- Rule classes modified in `Chandam.Rules/`
- Need to regenerate from source

---

### convert / yaml2json

**Purpose**: Convert YAML files to JSON

**Syntax**: `convert [input-dir] [output-dir]`

**Default**: `Chandam.Config\Rules` (same directory)

**Converts**:
- All `*.yaml` files in input directory
- Preserves Telugu Unicode
- Normalizes data structures

**Use When**:
- Edited YAML files manually
- Need JSON for deployment/WASM
- YAML is source of truth

---

### help / --help / -h / /?

**Purpose**: Display usage information

**Syntax**: `help`

**Shows**:
- Available commands
- Command syntax
- Examples
- Generated file list

---

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Error (exception or unknown command) |

**Usage in scripts**:
```bash
dotnet run --project Chandam.Tasks -- gen
if [ $? -ne 0 ]; then
  echo "Generation failed!"
  exit 1
fi
```

---

## Error Handling

### Unknown Command

```bash
$ dotnet run --project Chandam.Tasks -- invalid

Unknown command: invalid

Chandam Tasks - Rule and Example Generation Utilities
======================================================
[Help text displayed...]
```

### Exception Handling

```bash
$ dotnet run --project Chandam.Tasks -- gen /invalid/path

Error: Could not find a part of the path '/invalid/path'
[Stack trace...]
```

---

## Comparison: Before vs After

### Before (Edit Code)

```csharp
// Edit Program.cs
// new PlayGround().Play();
new PlayGround().ConvertYamlToJson();

// Rebuild
// Run
```

### After (Command Line)

```bash
# No code editing needed
dotnet run --project Chandam.Tasks -- convert

# Or
dotnet run --project Chandam.Tasks -- gen
```

---

## Benefits

### 1. No Code Editing Required
- ✅ Switch tasks via command line
- ✅ No need to rebuild
- ✅ Faster workflow

### 2. Scriptable
- ✅ Integrate with build scripts
- ✅ Use in CI/CD pipelines
- ✅ Automate workflows

### 3. User-Friendly
- ✅ Built-in help system
- ✅ Clear error messages
- ✅ Exit codes for scripting

### 4. Future-Ready
- ✅ Easy to add new commands
- ✅ Extensible pattern
- ✅ Consistent interface

---

## Testing

All commands tested and verified:

```bash
# ✅ Help command
dotnet run --project Chandam.Tasks -- help

# ✅ Generate rules
dotnet run --project Chandam.Tasks -- gen

# ✅ Convert YAML
dotnet run --project Chandam.Tasks -- convert

# ✅ No arguments (shows help)
dotnet run --project Chandam.Tasks

# ✅ Invalid command (shows error + help)
dotnet run --project Chandam.Tasks -- invalid
```

**Results**: All commands execute successfully with proper output and exit codes.

---

## Future Enhancements (Optional)

### Additional Commands

1. **`validate`** - Validate YAML/JSON structure
   ```bash
   dotnet run --project Chandam.Tasks -- validate
   ```

2. **`stats`** - Show statistics about rules/examples
   ```bash
   dotnet run --project Chandam.Tasks -- stats
   ```

3. **`compress`** - Compress JSON files with Brotli
   ```bash
   dotnet run --project Chandam.Tasks -- compress
   ```

4. **`merge`** - Merge multiple example files
   ```bash
   dotnet run --project Chandam.Tasks -- merge example1.yaml example2.yaml -o merged.yaml
   ```

### Options/Flags

- `--verbose` - Verbose output
- `--quiet` - Suppress output
- `--format json|yaml` - Specify output format
- `--minify` - Minify JSON output

---

## Summary

✅ **Command-line interface implemented**
- `generate` / `gen` - Generate from class files
- `convert` / `yaml2json` - Convert YAML to JSON
- `help` - Show usage information

✅ **Convenience scripts created**
- Windows batch file
- Linux/Mac shell script

✅ **Documentation complete**
- Usage examples
- Integration guides
- Error handling

✅ **Testing verified**
- All commands working
- Proper exit codes
- Error handling functional

**Result**: No more code editing required - all tasks accessible via simple commands!
