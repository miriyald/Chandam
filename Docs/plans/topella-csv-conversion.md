# Topella CSV to JSON/YAML Conversion Plan

## Context

The Topella.csv file contains 2,337 Telugu meter rules compiled by శ్రీతోపెల్ల బాలసుబ్రహ్మణ్య శర్మ. These are rare/comprehensive Telugu Vruttam meters that need to be converted into the Chandam JSON/YAML format and integrated into the WASM application. This expands the rule database from the current ~379 rules to over 2,700 total rules.

The existing infrastructure (GenerateRulesJSON.cs, Rule.cs, RuleDto) already supports all required fields. Rule.cs has a References field (string array) that can store the source citations from the CSV.

## CSV Structure

```csv
No,Rules,PrasaYati,Yathi,Reference,Name,Identifier,Full Name
1,భభభభభమ,,"7,13",చాంద్ బీబీ కో.శ్రీ,అంగన,aMgana,అంగన 
2,భభభభగ,,5,"హేమఛంసా 2-196",అంగరుచి,aMgaruchi,అంగరుచి
```

## Field Mappings

| CSV Column | JSON Field | Transformation |
|------------|------------|----------------|
| Rules | Rules (string[][]) | Split each Telugu character: "భభభభభమ" → [["భ", "భ", "భ", "భ", "భ", "మ"]] |
| Yathi | Yati (int[][]) | Parse numbers: "7,13" → [[7, 13]], "No" → [] |
| Name | Name, ShortName | Telugu name (log warning if Full Name before comma doesn't match) |
| Identifier | Identifier | Transliterated identifier |
| Full Name | Alias | Extract text after first comma |
| Reference | References (string[]) | Store as single-element array: [reference_text] |
| PrasaYati | PrasaYati | Always false (column empty in CSV) |

**Fixed Values for All Rules:**
- Language: Telugu
- PadyamType: Vruttam
- PadyamSubType: Vruttam  
- Lines: 4
- RuleType: Name
- Frequency: Rare
- YatiMode: CharPosition
- Prasa: true
- Threshold: 3 if charLength >= 3, else charLength
- Examples: null

## Implementation Steps

### Step 1: Extend GenerateRulesJSON.cs

**File:** `Chandam.Tasks\GenerateRulesJSON.cs`

Add new methods to the existing class to parse CSV and generate Topella rules:

```csharp
/// <summary>
/// Generate topella.json - All rules from Topella CSV (2337 Telugu Vruttam meters)
/// </summary>
public void GenerateTopellaRules()
{
    Console.WriteLine("\nGenerating topella.json (Topella's 2337 Telugu meters)...");
    
    var csvPath = Path.Combine(_outputDirectory, "Topella.csv");
    var rules = ParseTopellaCSV(csvPath);
    
    var ruleSet = new RuleSetDto
    {
        Identifier = "topella",
        Name = "తోపెల్ల వృత్తములు",
        Description = "శ్రీతోపెల్ల బాలసుబ్రహ్మణ్య శర్మగారి 2337 తెలుగు వృత్తములు (Topella's comprehensive collection of 2337 Telugu Vruttam meters)",
        Rules = ConvertRulesToDto(rules)
    };
    
    SaveRuleSet(ruleSet, "topella.json");
    SaveRuleSetYaml(ruleSet, "topella.yaml");
    Console.WriteLine($"  ✓ Generated {rules.Length} Topella rules (JSON + YAML)");
}

/// <summary>
/// Parse Topella CSV and convert to Rule objects
/// </summary>
private Rule[] ParseTopellaCSV(string csvPath)
{
    var rules = new List<Rule>();
    var lines = File.ReadAllLines(csvPath, Encoding.UTF8);
    
    // Skip header row
    for (int i = 1; i < lines.Length; i++)
    {
        try
        {
            var rule = ParseTopellaCsvRow(lines[i], i + 1);
            if (rule != null)
                rules.Add(rule);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"  ! Error parsing row {i + 1}: {ex.Message}");
        }
    }
    
    return rules.ToArray();
}

/// <summary>
/// Parse single CSV row into Rule object
/// </summary>
private Rule ParseTopellaCsvRow(string line, int rowNumber)
{
    var fields = ParseCsvLine(line);
    
    // CSV columns: No, Rules, PrasaYati, Yathi, Reference, Name, Identifier, Full Name
    var rulesText = fields[1];
    var yatiText = fields[3];
    var reference = fields[4];
    var name = fields[5];
    var identifier = fields[6];
    var fullName = fields[7];
    
    var rule = new Rule
    {
        Identifier = identifier,
        Name = name,
        Language = RuleLanguage.Telugu,
        PadyamType = PadyamType.Vruttam,
        PadyamSubType = PadyamSubType.Vruttam,
        RuleType = RuleType.Name,
        Frequency = Frequency.Rare,
        Lines = 4,
        YatiMode = YatiMode.CharPosition,
        Prasa = true,
        PrasaYati = false,
        
        Rules = ParseRulesColumn(rulesText),
        Yati = ParseYatiColumn(yatiText),
        References = string.IsNullOrWhiteSpace(reference) ? null : new string[] { reference }
    };
    
    // Extract alias from Full Name (text after first comma)
    rule.Alias = ParseAliasFromFullName(fullName);
    rule.ShortName = name;
    
    // Calculate threshold based on gana count
    var charLength = rule.Rules[0].Length;
    rule.Threshold = charLength >= 3 ? 3 : charLength;
    
    // Validate ShortName matches Name before first comma
    ValidateShortName(name, fullName, rowNumber);
    
    return rule;
}

/// <summary>
/// Parse CSV line handling quoted fields with commas
/// </summary>
private string[] ParseCsvLine(string line)
{
    var fields = new List<string>();
    var inQuotes = false;
    var field = new StringBuilder();
    
    for (int i = 0; i < line.Length; i++)
    {
        if (line[i] == '"')
        {
            inQuotes = !inQuotes;
        }
        else if (line[i] == ',' && !inQuotes)
        {
            fields.Add(field.ToString());
            field.Clear();
        }
        else
        {
            field.Append(line[i]);
        }
    }
    fields.Add(field.ToString());
    
    return fields.ToArray();
}

/// <summary>
/// Split Telugu gana string into individual characters
/// </summary>
private object[][] ParseRulesColumn(string rulesText)
{
    if (string.IsNullOrWhiteSpace(rulesText))
        return new object[0][];
    
    var ganas = new List<string>();
    var si = new System.Globalization.StringInfo(rulesText);
    
    for (int i = 0; i < si.LengthInTextElements; i++)
    {
        ganas.Add(si.SubstringByTextElements(i, 1));
    }
    
    // Return as single row (Lines=4 handles repetition)
    return new object[][] { ganas.ToArray() };
}

/// <summary>
/// Parse Yati column into int array
/// </summary>
private int[][] ParseYatiColumn(string yatiText)
{
    if (yatiText == "No" || string.IsNullOrWhiteSpace(yatiText))
        return new int[0][];
    
    var numbers = yatiText.Split(',')
        .Select(s => int.Parse(s.Trim()))
        .ToArray();
    
    return new int[][] { numbers };
}

/// <summary>
/// Extract alias from Full Name (text after first comma)
/// </summary>
private string ParseAliasFromFullName(string fullName)
{
    if (string.IsNullOrWhiteSpace(fullName))
        return null;
    
    var commaIndex = fullName.IndexOf(',');
    if (commaIndex > 0 && commaIndex < fullName.Length - 1)
    {
        return fullName.Substring(commaIndex + 1).Trim();
    }
    
    return null;
}

/// <summary>
/// Validate ShortName matches Name before first comma in Full Name
/// </summary>
private void ValidateShortName(string name, string fullName, int rowNumber)
{
    if (string.IsNullOrWhiteSpace(fullName))
        return;
    
    var commaIndex = fullName.IndexOf(',');
    var mainName = commaIndex > 0 ? fullName.Substring(0, commaIndex).Trim() : fullName.Trim();
    
    if (name != mainName)
    {
        Console.WriteLine($"  ! Row {rowNumber}: Name '{name}' doesn't match Full Name main part '{mainName}'");
    }
}
```

**Key Implementation Details:**

1. **CSV Parsing:** Handle quoted fields with commas (important for References column with multiple sources)
2. **Rule Object Creation:** Create Rule objects first (not DTO), then use existing ConvertRulesToDto()
3. **Telugu Character Splitting:** Use `System.Globalization.StringInfo` for proper Unicode grapheme handling
   - Add using: `using System.Globalization;`
   - Handles combined Telugu characters (gunintam) correctly
4. **Yati Parsing:** Handle three cases:
   - "7,13" → [[7, 13]]
   - "7" → [[7]]
   - "No" or empty → []
5. **Threshold Calculation:** 
   - Count ganas in Rules[0]
   - If count >= 3, use 3; otherwise use count
6. **Reuse Infrastructure:** Use existing SaveRuleSet(), SaveRuleSetYaml(), CompressToBrotli() methods
7. **Encoding:** UTF-8 throughout for proper Telugu text handling

### Step 2: Update Program.cs to Call GenerateTopellaRules()

**File:** `Chandam.Tasks\Program.cs`

Modify the GenerateRules() method to also call GenerateTopellaRules():

```csharp
static int GenerateRules(string[] options)
{
    var outputDir = options.Length > 0 ? options[0] : @"Chandam.Config\Rules";
    
    var generator = new GenerateRulesJSON(outputDir);
    generator.GenerateAllRuleSets();  // Existing frequent + telugu-complete
    
    // NEW: Generate Topella rules from CSV
    generator.GenerateTopellaRules();
    
    return 0;
}
```

**OR** add a separate command if you want granular control:

```csharp
int exitCode = command switch
{
    "generate" or "gen" => GenerateRules(options),
    "topella" => GenerateTopellaOnly(options),  // NEW - Topella only
    "convert" or "yaml2json" => ConvertYamlToJson(options),
    "help" or "--help" or "-h" or "/?" => ShowHelp(),
    _ => ShowUnknownCommand(command)
};

static int GenerateTopellaOnly(string[] options)
{
    Console.WriteLine("=== Generating Topella Rules ===\n");
    
    var outputDir = options.Length > 0 ? options[0] : @"Chandam.Config\Rules";
    new GenerateRulesJSON(outputDir).GenerateTopellaRules();
    
    Console.WriteLine("\n=== Topella Generation Complete ===");
    return 0;
}
```

Choose approach based on preference: include in "generate" command or separate "topella" command.

### Step 3: Generate Output Files

Run the generator to create:
- `Chandam.Config\Rules\topella.json` (pretty-printed, ~550KB)
- `Chandam.Config\Rules\topella.min.json` (minified, ~380KB)
- `Chandam.Config\Rules\topella.min.json.br` (Brotli compressed, ~25-30KB)
- `Chandam.Config\Rules\topella.yaml` (human-editable)
- `Chandam.Config\Rules\topella.yaml.br` (compressed YAML)

**RuleSetDto Structure:**
```json
{
  "Identifier": "topella",
  "Name": "తోపెల్ల వృత్తములు",
  "Description": "శ్రీతోపెల్ల బాలసుబ్రహ్మణ్య శర్మగారి 2337 తెలుగు వృత్తములు (Topella's comprehensive collection of 2337 Telugu Vruttam meters)",
  "Rules": [ /* 2337 RuleDto objects */ ]
}
```

### Step 4: Deploy to WASM

**Files to Deploy:**  
Copy to `Chandam.Wasm\wwwroot\data\`:
- `topella.min.json`
- `topella.min.json.br` (optional, for servers with Brotli support)

**Loading Strategy:**  
Use lazy loading - don't load topella.json by default. Add UI control to load on demand:

```csharp
await WasmRuleLoaderService.LoadRuleSetAsync("data/topella.min.json", null);
```

**Why Lazy Loading:**
- 2,337 rules is ~4.4x larger than telugu-complete (528 rules)
- Estimated compressed size: 25-30KB (acceptable but not needed initially)
- Most users only need the frequent 15 rules (~1.5KB)
- Advanced users can opt-in to load the comprehensive set

**Alternative (if immediate loading desired):**  
Modify `Chandam.Wasm\Program.cs` initialization to load topella.json instead of chandam-rules.json, but this will slow down initial app load.

## Critical Files

**Modified Files:**
- `Chandam.Tasks\GenerateRulesJSON.cs` - Add CSV parsing methods and GenerateTopellaRules()
- `Chandam.Tasks\Program.cs` - Add topella command OR include in generate command

**Input Files:**
- `Chandam.Config\Rules\Topella.csv` - Source data (2337 rules)

**Output Files (Generated):**
- `Chandam.Config\Rules\topella.json` - Pretty-printed (~550KB)
- `Chandam.Config\Rules\topella.min.json` - Minified (~380KB)
- `Chandam.Config\Rules\topella.yaml` - Human-editable YAML
- `Chandam.Config\Rules\topella.min.json.br` - Brotli compressed (~25-30KB)
- `Chandam.Config\Rules\topella.yaml.br` - YAML compressed

**Deployment Files:**
- `Chandam.Wasm\wwwroot\data\topella.min.json` - Copy for WASM loading

**Reference Files:**
- `Chandam.Util\Rule.cs` - Domain model (References field already exists at line 117-127)
- `Chandam.Tasks\GenerateRulesJSON.cs` - Existing methods to reuse (ConvertRulesToDto, SaveRuleSet, etc.)

## Verification Steps

After implementation:

1. **Build & Generate:**
   ```bash
   dotnet build Chandam.Tasks
   # If added to generate command:
   dotnet run --project Chandam.Tasks generate
   
   # OR if separate command:
   dotnet run --project Chandam.Tasks topella
   ```

2. **Verify Output Files:**
   - Check all 5 files created in `Chandam.Config\Rules\`:
     - topella.json
     - topella.min.json
     - topella.yaml
     - topella.min.json.br
     - topella.yaml.br
   - Verify file sizes (JSON ~550KB, min ~380KB, br ~25-30KB)
   - Spot-check 10-15 rules in JSON for correct Telugu encoding

3. **Test JSON Structure:**
   ```bash
   # Quick check: count rules in JSON
   cat Chandam.Config/Rules/topella.json | grep '"Identifier"' | wc -l
   # Should output: 2337
   ```
   - Deserialize topella.json back to RuleSetDto
   - Verify rule count = 2,337
   - Check random rules for proper field mapping (Rules, Yati, References)

4. **Test WASM Loading:**
   - Copy topella.min.json to `Chandam.Wasm\wwwroot\data\`
   - Add test code to load rule set:
     ```csharp
     await WasmRuleLoaderService.LoadRuleSetAsync("data/topella.min.json", null);
     Console.WriteLine($"Rules loaded: {Manager.Rules().Length}");
     ```
   - Verify Manager.Rules() contains 2,337 additional rules
   - Test meter identification with a topella-specific rule

5. **Integration Test:**
   - Run Telugu poems through the API/WASM
   - Verify topella rules are being matched correctly
   - Check for any performance issues (<200ms parse time)

## Expected Outcomes

1. **Generation:** 2,337 rules successfully converted from CSV to JSON/YAML
2. **File Sizes:** Compressed output ~25-30KB (acceptable for lazy loading)
3. **WASM Integration:** Rules loadable on-demand via UI control
4. **Data Quality:** All Telugu text preserved, no encoding issues
5. **Performance:** Parse time <200ms, memory usage ~5-8MB

## Risk Mitigation

- **Telugu Encoding:** Use UTF-8 throughout, test with StringInfo for grapheme clusters
- **CSV Parsing:** Handle quoted fields with commas in References column
- **Large Dataset:** Use Brotli compression + lazy loading strategy
- **Validation:** Log warnings but continue processing for individual row issues
- **Testing:** Spot-check 10-15 rules manually, run automated count verification
