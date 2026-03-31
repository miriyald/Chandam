# YAML Editing Workflow

## Quick Reference for Managing Rules and Examples

---

## Workflow: Edit YAML → Generate JSON

### 1. Edit YAML Files (Human-Friendly)

**Location**: `Chandam.Config/Rules/`

**Files**:
- `chandam-rules.yaml` - Frequent rules (14 rules)
- `telugu-complete.yaml` - All Telugu rules (379 rules)
- `chandam-examples.yaml` - Frequent examples (14 rules)
- `telugu-complete-examples.yaml` - All Telugu examples (317 rules)

**Why YAML?**
- ✅ Better for Telugu text editing
- ✅ More readable format with `|-` literal block scalars
- ✅ Human-friendly for community contributions

**Example YAML Format**:
```yaml
examples:
  iMdravajramu:
  - text: |-
      సామర్థ్యలీలన్ తతజద్విగంబుల్
      భూమిధ్రవిశ్రాంతుల బొంది యొప్పున్
      ప్రేమంబుతో నైందవబింబవక్త్రున్
      హేమాంబురుం బాడుదు రింద్రవజ్రన్
    author: మహానుభావుడు.
    date: తెలియదు
```

---

### 2. Convert YAML to JSON (For Deployment)

**Method 1: Via Program.cs**

Edit `Chandam.Tasks/Program.cs`:
```csharp
// Comment out Play(), uncomment ConvertYamlToJson()
// new PlayGround().Play();
new PlayGround().ConvertYamlToJson();
```

Run:
```bash
cd Chandam.Tasks
dotnet run
```

**Method 2: Programmatic**
```csharp
using Verifier;

var converter = new ConvertYamlToJson();
converter.ConvertAll();  // Convert all *.yaml files

// Or convert specific file
converter.ConvertFile("chandam-rules.yaml");
```

**Output**:
```
=== Converting YAML to JSON ===

Converting chandam-rules.yaml → chandam-rules.json...
  ✓ chandam-rules.json (19,456 bytes, +9,656 bytes vs YAML)

Converting telugu-complete.yaml → telugu-complete.json...
  ✓ telugu-complete.json (491,234 bytes, +244,234 bytes vs YAML)

=== Conversion Complete ===
  ✓ Success: 4
```

---

### 3. Regenerate All Files from Source

If you've modified Rule classes in `Chandam.Rules/`:

Edit `Chandam.Tasks/Program.cs`:
```csharp
// Uncomment Play(), comment out ConvertYamlToJson()
new PlayGround().Play();
// new PlayGround().ConvertYamlToJson();
```

Run:
```bash
cd Chandam.Tasks
dotnet run
```

This generates:
- ✅ Rules JSON (no examples)
- ✅ Rules YAML (human-editable)
- ✅ Examples JSON (dictionary by identifier)
- ✅ Examples YAML (literal block scalars)

---

## File Sizes

| File | JSON | YAML | Format |
|------|------|------|--------|
| Frequent rules | 19KB | 9.8KB | Compact |
| Telugu rules | 481KB | 247KB | Complete |
| Frequent examples | 41KB | 37KB | 14 rules |
| Telugu examples | 325KB | 283KB | 317 rules |

**Total**: 806KB JSON, 577KB YAML (28% smaller)

---

## YAML Format Details

### Rules YAML Structure
```yaml
identifier: default
name: సాధారణ ఛందస్సులు
description: Most frequently used meters
rules:
- identifier: iMdravajramu
  name: ఇంద్రవజ్రము
  language: Telugu
  padyamType: Vruttam
  lines: 4
  threshold: 3
  rules:
  - - త
    - త
    - జ
    - గా
  yati:
  - - 8
  yatiMode: CharPosition
  prasa: true
  shortName: ఇంద్రవజ్రము  # Trimmed!
  chandamName: త్రిష్టుప్పు
  charLength: 11
  examples: null  # Examples in separate file
```

### Examples YAML Structure
```yaml
identifier: default-examples
name: సాధారణ ఛందస్సుల ఉదాహరణలు
description: Examples for frequently used meters
examples:
  iMdravajramu:  # Key = rule identifier
  - text: |-     # Literal block scalar
      సామర్థ్యలీలన్ తతజద్విగంబుల్
      భూమిధ్రవిశ్రాంతుల బొంది యొప్పున్
      ప్రేమంబుతో నైందవబింబవక్త్రున్
      హేమాంబురుం బాడుదు రింద్రవజ్రన్
    author: మహానుభావుడు.
    date: తెలియదు
  - text: |-
      ఈతాజగానిర్మితి నింద్రవజ్రా
      నీతాఖ్య వర్తించు వినిర్మలోక్తిన్
```

**Key Features**:
- `|-` literal block scalar preserves line breaks
- No extra blank lines between poem lines
- All string fields auto-trimmed (no trailing spaces)
- Dictionary structure for fast identifier lookup

---

## Common Tasks

### Add New Examples

1. Edit `telugu-complete-examples.yaml`
2. Find the rule identifier (e.g., `iMdravajramu`)
3. Add new example:
   ```yaml
   iMdravajramu:
   - text: |-
       Your new poem here
       Line 2
       Line 3
       Line 4
     author: Author Name
     date: Year or తెలియదు
     reference: Source reference (optional)
   ```
4. Convert to JSON: `new PlayGround().ConvertYamlToJson()`
5. Test: `dotnet test Chandam.API.IntegrationTests`

### Fix String Trimming Issues

If you see trailing spaces in generated YAML:

1. Check source `Rule` class in `Chandam.Rules/`
2. Fix in source OR rely on auto-trimming in `GenerateRulesJSON.cs`
3. Regenerate: `new PlayGround().Play()`

All string fields are auto-trimmed:
- `ShortName`
- `Alias`
- `ChandamName`
- `Sequence`
- `MatraSeries`

### Deploy to WASM

```bash
# 1. Ensure JSON files are up-to-date
cd Chandam.Tasks
dotnet run  # Generates or converts YAML → JSON

# 2. Copy to WASM data directory
cp Chandam.Config/Rules/telugu-complete*.json Chandam.Wasm/wwwroot/data/

# 3. Build WASM
dotnet publish Chandam.Wasm -c Release -p:ExcludeYaml=true

# 4. Optional: Compress for production
cd Chandam.Wasm/bin/Release/net8.0/publish/wwwroot/data
brotli -q 11 -k *.json  # Creates .json.br files (80% smaller!)
```

---

## Tips

### 1. YAML Editing in VS Code

Install extensions:
- **YAML** by Red Hat
- **Telugu Language Support** (if available)

Settings:
```json
{
  "yaml.schemas": {
    "Chandam.API/Models/Config/RuleSetDto.cs": "chandam-rules.yaml",
    "Chandam.API/Models/Config/ExampleSetDto.cs": "chandam-examples.yaml"
  }
}
```

### 2. Validate YAML

```bash
# Install yamllint
pip install yamllint

# Validate YAML files
yamllint Chandam.Config/Rules/*.yaml
```

### 3. Version Control

- **Commit**: YAML files (human-readable diffs)
- **Ignore**: JSON files (generated, can be regenerated)

`.gitignore`:
```
# Keep YAML (source of truth)
# Ignore JSON (generated)
*.json
!package.json
```

### 4. Compression for Production

```bash
# Brotli (best compression)
brotli -q 11 -k telugu-complete.json  # Creates .br file

# Gzip (fallback)
gzip -9 -k telugu-complete.json  # Creates .gz file

# Results:
# telugu-complete.json      481KB
# telugu-complete.json.br    96KB (80% reduction!)
# telugu-complete.json.gz   145KB (70% reduction)
```

---

## Troubleshooting

### "Rules directory not found"

Make sure you're running from solution root:
```bash
cd c:\Working\Experiments\Chandam3
dotnet run --project Chandam.Tasks
```

### "YAML deserialization error"

Check YAML syntax:
- Proper indentation (2 spaces)
- No tabs (use spaces)
- Quoted strings with special characters
- Validate with yamllint

### "Examples not showing in API"

1. Verify example file exists and has correct name pattern:
   - `*-examples.json` or `*-examples.yaml`
2. Check identifier matches rule identifier exactly
3. Verify examples loaded: Check console output for "Loaded example set"

---

## Summary

**Edit → Convert → Deploy**

1. ✏️ Edit YAML files (human-friendly)
2. 🔄 Convert to JSON (`ConvertYamlToJson()`)
3. 🚀 Deploy JSON to WASM/API (optimized)

**Why this workflow?**
- 📝 YAML for humans (editing, reviewing, community contributions)
- ⚡ JSON for machines (parsing, loading, performance)
- 🗜️ Brotli compression for production (80% smaller!)
