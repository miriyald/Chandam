# Chandam Tasks CLI - Quick Reference

## Quick Start

```bash
# Show help
dotnet run --project Chandam.Tasks -- help

# Generate rules and examples from class files
dotnet run --project Chandam.Tasks -- gen

# Convert YAML to JSON
dotnet run --project Chandam.Tasks -- convert
```

---

## All Commands

### 1. Generate Rules and Examples

**Aliases**: `generate`, `gen`

```bash
# Default directory (Chandam.Config\Rules)
dotnet run --project Chandam.Tasks -- gen

# Custom output directory
dotnet run --project Chandam.Tasks -- generate C:\Output\Rules
```

**Generates**:
- chandam-rules.json/yaml (14 frequent rules)
- telugu-complete.json/yaml (379 Telugu rules)
- chandam-examples.json/yaml (14 rule examples)
- telugu-complete-examples.json/yaml (317 rule examples)

---

### 2. Convert YAML to JSON

**Aliases**: `convert`, `yaml2json`

```bash
# Same directory
dotnet run --project Chandam.Tasks -- convert

# Specify input directory
dotnet run --project Chandam.Tasks -- yaml2json C:\Rules

# Specify input and output directories
dotnet run --project Chandam.Tasks -- convert C:\Rules C:\Output
```

**Converts**: All `*.yaml` files to `*.json`

---

### 3. Help

**Aliases**: `help`, `--help`, `-h`, `/?`

```bash
dotnet run --project Chandam.Tasks -- help
```

---

## Convenience Scripts

### Windows

```cmd
cd Docs\Scripts
chandam-tasks.bat gen
chandam-tasks.bat convert
```

### Linux/Mac

```bash
cd Docs/Scripts
chmod +x chandam-tasks.sh
./chandam-tasks.sh gen
./chandam-tasks.sh convert
```

---

## Common Workflows

### Edit YAML → Deploy JSON

```bash
# 1. Edit YAML files in Chandam.Config/Rules/

# 2. Convert to JSON
dotnet run --project Chandam.Tasks -- convert

# 3. Copy to WASM
cp Chandam.Config/Rules/*.json Chandam.Wasm/wwwroot/data/
```

### Modify Rules → Regenerate Everything

```bash
# 1. Edit Rule classes in Chandam.Rules/

# 2. Build
dotnet build Chandam.sln

# 3. Generate rules and examples
dotnet run --project Chandam.Tasks -- gen
```

### CI/CD Pipeline

```yaml
- name: Generate Rules
  run: dotnet run --project Chandam.Tasks -- gen

- name: Convert YAML to JSON
  run: dotnet run --project Chandam.Tasks -- convert

- name: Deploy to WASM
  run: cp Chandam.Config/Rules/*.json Chandam.Wasm/wwwroot/data/
```

---

## Tips

1. **Build first**: Run `dotnet build Chandam.Tasks` before using `--no-build` flag
2. **Default directories**: Most commands use `Chandam.Config\Rules` by default
3. **Exit codes**: Commands return 0 on success, 1 on error
4. **Help anytime**: Run without args or with `help` to see usage

---

## Full Documentation

See [CLI-SUPPORT-COMPLETE.md](execution/CLI-SUPPORT-COMPLETE.md) for detailed documentation.
