# Two-Mode Result Rendering for Chandam WASM (CLEAN APPROACH)

## Context

This plan implements conditional result rendering based on match percentage, inspired by the legacy C# implementation in `Obsolete/Client/API/Business4.cs`.

**Why this change is needed:**
- **100% matches** deserve celebration - show the decorated/beautified poem prominently alongside technical analysis
- **< 100% matches** need debugging - show technical analysis (gana vibhajana table) alongside errors
- Current implementation shows the same layout (table + errors) for all matches regardless of quality
- **Clean up API confusion**: Current `RenderFormat.Text` is misleading - it returns decorated HTML, not plain text

**Problem being solved:**
1. Current implementation always displays gana vibhajana table with errors, regardless of match quality
2. For perfect 100% matches, users want to see their beautifully crafted poem with yati underlines and prasa bold marks
3. `RenderFormat.Text` naming is confusing - sounds like plain text but returns decorated HTML via Build2()→BuildText()
4. No explicit API for "beautified poem" output

**Intended outcome:**
- **100% matches**: Beautified poem (left, 45% width) + Gana vibhajana table (right, 50% width)
- **< 100% matches**: Gana vibhajana table (left, 55% width) + Errors (right, 40% width) — existing behavior
- **Clean API**: Remove `RenderFormat.Text`, add explicit `Beautify()` method and API endpoints
- **WASM gets both**: Frontend receives both table and beautified poem to support conditional rendering
- Modern flexbox CSS with legacy class names (`.padyam`, `.poem`, `.ganaVibhajana`)
- Mobile-responsive with vertical stacking

---

## Technical Approach

### 1. Core: Add Beautify() Method

**Current situation:**
- `Build(MatchResult)` → generates gana vibhajana HTML table
- `Build2(MatchResult)` → calls `BuildText()` which creates decorated HTML with `<u>` (yati) and `<b>` (prasa) tags
- `Build2()` name doesn't clearly indicate it returns decorated HTML

**Solution:** Add explicit `Beautify()` method to Padyam class for decorated poem output. Deprecate or remove `Build2()`.

### 2. API: Remove RenderFormat.Text, Add Explicit Beautify Methods

**Current RenderFormat enum:**
```csharp
public enum RenderFormat {
    None = 0,
    Html = 1,     // Gana vibhajana table
    Text = 2,     // Confusing! Actually returns decorated HTML
    Markdown = 3
}
```

**New RenderFormat enum:**
```csharp
public enum RenderFormat {
    None = 0,
    Html = 1,      // Gana vibhajana table only
    Markdown = 2   // Markdown summary
    // Text removed!
}
```

**Add new dedicated methods:**
- `service.DetermineWithBeautified()` - returns match with BOTH table and beautified poem
- `service.TryMatchWithBeautified()` - returns match with BOTH table and beautified poem

### 3. WASM: Call New Combined Methods

**Current behavior:**
- `JsBridge.Determine()` calls API with `RenderFormat.Html` → only gets table
- Frontend can't show beautified poem (data not available)

**New behavior:**
- `JsBridge.Determine()` calls new combined service method → gets BOTH table and beautified poem
- `JsBridge.TryMatch()` calls new combined service method → gets BOTH table and beautified poem
- Frontend has data for conditional rendering based on match percentage

### 4. MCP: Return Multiple Formats (Like WASM)

**Current MCP tools** (in Chandam.MCP.Tools/ChandamTools.cs):
- `DetermineChandam()` - uses `RenderFormat.Text` (line 44)
- `TryMatchChandam()` - uses `RenderFormat.Text` (line 63)

**New approach:** Just like WASM gets both Html and Beautified, MCP tools should get both Markdown and Beautified.

**Update existing tools:**
- Call the new combined service methods (`DetermineWithBeautified`, `TryMatchWithBeautified`)
- Response includes BOTH Markdown (for Claude's analysis) AND Beautified (for display)
- No new MCP tool needed - existing tools are sufficient

### 5. Frontend: Conditional Rendering

**Current:** Always shows table + errors

**New:** Branch on `match.matchPercentage === 100`:
- If 100%: Show `match.renderedBeautified` (left) + `match.renderedHtml` (right)
- If < 100%: Show `match.renderedHtml` (left) + errors (right)

### 6. CSS: Add Legacy Classes with Modern Flexbox

Add `.padyam`, `.poem`, `.ganaVibhajana` classes with modern flexbox styling (no floats).

---

## Implementation Steps

### Phase 1: Core Changes

#### File 1: `Chandam.Core/Chandam/Padyam.cs`

**Location:** After Build2() method (after line 1668)

**Add new method:**
```csharp
/// <summary>
/// Returns beautified/decorated poem HTML with yati (caesura) underlines and prasa (rhyme) bold marks.
/// </summary>
/// <param name="_MR">Match result containing yati/prasa information</param>
/// <returns>HTML string with decorated poem using &lt;u&gt; and &lt;b&gt; tags</returns>
public string Beautify(MatchResult _MR)
{
    if (_MR == null)
    {
        throw new Exception("Matching object can't be null..");
    }
    else
    {
        MR = _MR;
    }
    return BuildText(R);  // Uses existing BuildText() method
}
```

**Optional: Deprecate Build2()** (can be done later)
- Add `[Obsolete("Use Beautify() instead")]` attribute to Build2()
- Or keep Build2() as-is for now

---

### Phase 2: API Model Changes

#### File 2: `Chandam.API/Models/RenderFormat.cs`

**Change:** Remove `Text = 2` enum value, renumber Markdown

**Before:**
```csharp
public enum RenderFormat
{
    None = 0,
    Html = 1,
    Text = 2,
    Markdown = 3
}
```

**After:**
```csharp
public enum RenderFormat
{
    None = 0,
    Html = 1,      // Gana vibhajana table
    Markdown = 2   // Markdown summary (renumbered from 3)
}
```

#### File 3: `Chandam.API/Models/ChandamMatch.cs`

**Rename all rendered fields - drop "Rendered" prefix for cleaner API:**

**Before:**
```csharp
public class ChandamMatch
{
    // ... other fields ...
    public string? Html { get; set; }
    public string? RenderedText { get; set; }
    public string? Markdown { get; set; }
}
```

**After:**
```csharp
public class ChandamMatch
{
    // ... other fields ...
    public string? Html { get; set; }           // Gana vibhajana table
    public string? Markdown { get; set; }       // Structured summary
    public string? Beautified { get; set; }     // Decorated poem HTML
    // Remove RenderedText - not needed
}
```

**Why:** Shorter, cleaner property names. "Rendered" prefix is redundant.

---

### Phase 3: API Service Changes

#### File 4: `Chandam.API/Services/ChandamService.cs`

**Change 1: Update BuildChandamMatch (lines 462-467)**

**Before:**
```csharp
if (renderFormat == RenderFormat.Html )
    match.Html = padyam.Build(matchResult);
if (renderFormat == RenderFormat.Text )
    match.RenderedText = padyam.Build2(matchResult);
if (renderFormat == RenderFormat.Markdown)
    match.Markdown = BuildMarkdown(matchResult, rule);
```

**After:**
```csharp
if (renderFormat == RenderFormat.Html)
    match.Html = padyam.Build(matchResult);
if (renderFormat == RenderFormat.Markdown)
    match.Markdown = BuildMarkdown(matchResult, rule);
// Text format removed!
```

**Change 2: Add new DetermineWithBeautified method**

**Location:** After existing `Determine()` method

**Add:**
```csharp
/// <summary>
/// Determine best matching chandam and return BOTH requested format (Html/Markdown) AND beautified.
/// Used by WASM frontend (Html + Beautified) and MCP tools (Markdown + Beautified).
/// </summary>
public DetermineResponse DetermineWithBeautified(DetermineRequest request)
{
    var response = Determine(request);  // Get standard response with requested format
    
    // Also populate beautified HTML for all matches
    foreach (var match in response.Matches)
    {
        // Get the rule and create padyam
        var rule = _ruleLoader.GetRule(match.Rule.Identifier);
        if (rule != null)
        {
            var padyam = CreatePadyam(request);
            var matchResult = padyam.Match(request.PoemText, rule);
            match.Beautified = padyam.Beautify(matchResult);
        }
    }
    
    return response;
}
```

**Why:** 
- WASM calls this with `RenderFormat.Html` → gets Html + Beautified
- MCP calls this with `RenderFormat.Markdown` → gets Markdown + Beautified
- Single method serves both use cases

**Change 3: Add new TryMatchWithBeautified method**

**Location:** After existing `TryMatch()` method

**Add:**
```csharp
/// <summary>
/// Try match against specific rule and return BOTH requested format (Html/Markdown) AND beautified.
/// Used by WASM frontend (Html + Beautified) and MCP tools (Markdown + Beautified).
/// </summary>
public TryMatchResponse TryMatchWithBeautified(TryMatchRequest request)
{
    var response = TryMatch(request);  // Get standard response with requested format
    
    // Also populate beautified HTML if match exists
    if (response.Match != null)
    {
        var rule = _ruleLoader.GetRule(request.RuleIdentifier);
        if (rule != null)
        {
            var padyam = CreatePadyam(request);
            var matchResult = padyam.Match(request.PoemText, rule);
            response.Match.Beautified = padyam.Beautify(matchResult);
        }
    }
    
    return response;
}
```

**Why:** 
- WASM calls this with `RenderFormat.Html` → gets Html + Beautified
- MCP calls this with `RenderFormat.Markdown` → gets Markdown + Beautified
- Single method serves both use cases

**Helper method:** May need to extract padyam creation logic into a private helper method if `CreatePadyam()` doesn't exist.

---

### Phase 4: WebAPI Endpoint Changes

#### File 5: `Chandam.API.WebApi/Program.cs`

**Change:** Update existing endpoints to use new methods

**Before (line 80):**
```csharp
app.MapPost("/api/determine", (DetermineRequest request, ChandamService service) =>
{
    var response = service.Determine(request);
    return Results.Ok(response);
});
```

**After:**
```csharp
app.MapPost("/api/determine", (DetermineRequest request, ChandamService service) =>
{
    // Use new method that returns BOTH table and beautified
    var response = service.DetermineWithBeautified(request);
    return Results.Ok(response);
});
```

**Before (line 86):**
```csharp
app.MapPost("/api/try-match", (TryMatchRequest request, ChandamService service) =>
{
    var response = service.TryMatch(request);
    return Results.Ok(response);
});
```

**After:**
```csharp
app.MapPost("/api/try-match", (TryMatchRequest request, ChandamService service) =>
{
    // Use new method that returns BOTH table and beautified
    var response = service.TryMatchWithBeautified(request);
    return Results.Ok(response);
});
```

**Why:** All API consumers now get both formats by default. Simplifies frontend logic.

**Alternative (if you want to keep separate endpoints):**
- Keep existing endpoints as-is
- Add NEW endpoints: `/api/determine-beautified` and `/api/try-match-beautified`
- WASM calls the new endpoints
- Other consumers can use either

---

### Phase 5: WASM Bridge Changes

#### File 6: `Chandam.Wasm/JsBridge.cs`

**Change: Remove RenderFormat parameter (lines 74, 89)**

**Before (line 74 in Determine):**
```csharp
var request = new DetermineRequest {
    PoemText = poemText,
    MatchYati = matchYati,
    MatchPrasa = matchPrasa,
    Language = langEnum,
    RenderFormat = RenderFormat.Html
};
```

**After:**
```csharp
var request = new DetermineRequest {
    PoemText = poemText,
    MatchYati = matchYati,
    MatchPrasa = matchPrasa,
    Language = langEnum,
    RenderFormat = RenderFormat.Html  // Keep Html for table
    // Backend now returns BOTH table and beautified via new method
};
```

**Or remove RenderFormat entirely if backend always returns both:**
```csharp
var request = new DetermineRequest {
    PoemText = poemText,
    MatchYati = matchYati,
    MatchPrasa = matchPrasa,
    Language = langEnum
    // No RenderFormat needed - backend returns both by default
};
```

**Same for TryMatch (line 89).**

---

### Phase 6: MCP Tool Changes

#### File 7: `Chandam.MCP.Tools/ChandamTools.cs`

**Change: Update existing tools to return both Markdown and Beautified (lines 30-67)**

Just like WASM gets both Html and Beautified, MCP tools should get both Markdown and Beautified. No new tool needed!

**Before (DetermineChandam method, lines 30-48):**
```csharp
[McpServerTool, Description("Auto-detect the best matching Chandam (meter/prosody) for a Telugu/Sanskrit poem. Returns the closest matching meter with confidence percentage.")]
public string DetermineChandam(
    [Description("The poem text to analyze (Telugu/Sanskrit/Kannada)")] string poem_text,
    [Description("Check caesura (yati) matching")] bool match_yati = true,
    [Description("Check rhyme (prasa) matching")] bool match_prasa = true,
    [Description("Language code: te (Telugu), kn (Kannada), sa (Sanskrit), hi (Hindi), ml (Malayalam)")] string language = "te")
{
    var lang = LanguageCodeMapper.ParseLanguage(language) ?? Rules.RuleLanguage.Telugu;
    var request = new DetermineRequest
    {
        PoemText = poem_text,
        MatchYati = match_yati,
        MatchPrasa = match_prasa,
        Language = lang,
        RenderFormat = RenderFormat.Text  // OLD: Only gets one format
    };
    var result = _service.Determine(request);
    return JsonSerializer.Serialize(result, JsonOptions);
}
```

**After:**
```csharp
[McpServerTool, Description("Auto-detect the best matching Chandam (meter/prosody) for a Telugu/Sanskrit poem. Returns matches with both Markdown summary and beautified HTML for display.")]
public string DetermineChandam(
    [Description("The poem text to analyze (Telugu/Sanskrit/Kannada)")] string poem_text,
    [Description("Check caesura (yati) matching")] bool match_yati = true,
    [Description("Check rhyme (prasa) matching")] bool match_prasa = true,
    [Description("Language code: te (Telugu), kn (Kannada), sa (Sanskrit), hi (Hindi), ml (Malayalam)")] string language = "te")
{
    var lang = LanguageCodeMapper.ParseLanguage(language) ?? Rules.RuleLanguage.Telugu;
    var request = new DetermineRequest
    {
        PoemText = poem_text,
        MatchYati = match_yati,
        MatchPrasa = match_prasa,
        Language = lang,
        RenderFormat = RenderFormat.Markdown  // Request Markdown format
    };
    // Call new combined method that returns BOTH Markdown and Beautified
    var result = _service.DetermineWithBeautified(request);
    return JsonSerializer.Serialize(result, JsonOptions);
}
```

**Before (TryMatchChandam method, lines 50-67):**
```csharp
[McpServerTool, Description("Match a poem against a specific Chandam rule. Use this when you know which meter to test against.")]
public string TryMatchChandam(
    [Description("The poem text to analyze")] string poem_text,
    [Description("Rule identifier (e.g., 'kandam', 'utpalamaala', 'iMdravajramu')")] string rule_identifier,
    [Description("Check caesura (yati) matching")] bool match_yati = true,
    [Description("Check rhyme (prasa) matching")] bool match_prasa = true)
{
    var request = new TryMatchRequest
    {
        PoemText = poem_text,
        RuleIdentifier = rule_identifier,
        MatchYati = match_yati,
        MatchPrasa = match_prasa,
        RenderFormat = RenderFormat.Text  // OLD: Only gets one format
    };
    var result = _service.TryMatch(request);
    return JsonSerializer.Serialize(result, JsonOptions);
}
```

**After:**
```csharp
[McpServerTool, Description("Match a poem against a specific Chandam rule. Returns match with both Markdown summary and beautified HTML for display.")]
public string TryMatchChandam(
    [Description("The poem text to analyze")] string poem_text,
    [Description("Rule identifier (e.g., 'kandam', 'utpalamaala', 'iMdravajramu')")] string rule_identifier,
    [Description("Check caesura (yati) matching")] bool match_yati = true,
    [Description("Check rhyme (prasa) matching")] bool match_prasa = true)
{
    var request = new TryMatchRequest
    {
        PoemText = poem_text,
        RuleIdentifier = rule_identifier,
        MatchYati = match_yati,
        MatchPrasa = match_prasa,
        RenderFormat = RenderFormat.Markdown  // Request Markdown format
    };
    // Call new combined method that returns BOTH Markdown and Beautified
    var result = _service.TryMatchWithBeautified(request);
    return JsonSerializer.Serialize(result, JsonOptions);
}
```

**Why:** 
- MCP tools get both Markdown (for Claude to analyze) and Beautified (for display to user)
- Claude can choose which field to use based on context
- No need for separate beautification tool - existing tools do everything
- Consistent with WASM approach (both get multiple formats)

---

### Phase 7: Frontend TypeScript Changes

#### File 8: `Chandam.Wasm/Client/src/ui/results.ts` (lines 30-74)

**Change:** Update `renderMatchCard()` to use conditional rendering

**Current structure:**
- Always shows `match.renderedHtml` (table)
- Shows errors when present

**New structure:**
```typescript
function renderMatchCard(match: ChandamMatch, ruleSet?: string): string {
  const statusClass = match.isMatched ? 'match-success' : 'match-failure';
  const statusIcon = match.isMatched ? '✓' : '✗';

  const scoreHtml = match.matchPercentage < 100
    ? `<span class="match-score match-score-${getScoreLevel(match.matchPercentage)}">${match.matchPercentage}%</span>`
    : '';

  const ruleLink = ruleSet && match.rule.identifier
    ? `<a href="${makeUrl(`/learn/${ruleSet}/${match.rule.identifier}/`)}" class="rule-details-link" target="_blank" rel="noopener noreferrer">View Rule Details ↗</a>`
    : '';

  const errorsHtml = (match.errors && match.errors.length > 0)
    ? renderErrorsTable(match.errors)
    : '';

  // CONDITIONAL RENDERING based on match percentage
  let bodyHtml = '';
  
  if (match.matchPercentage === 100 && match.beautified) {
    // 100% match: Show beautified poem (left) + gana vibhajana table (right)
    bodyHtml = `
      <div class="match-body-split">
        <div class="padyam">
          <div class="poem">
            ${match.beautified}
          </div>
        </div>
        <div class="ganaVibhajana">
          ${match.html || ''}
        </div>
      </div>
    `;
  } else {
    // < 100% match: Show gana vibhajana table (left) + errors (right) — EXISTING BEHAVIOR
    const hasErrors = match.errors && match.errors.length > 0;
    bodyHtml = `
      <div class="match-body-split">
        <div class="match-table-container">
          ${match.html || ''}
        </div>
        ${hasErrors ? `<div class="match-errors-container">${errorsHtml}</div>` : ''}
      </div>
    `;
  }

  return `
    <div class="match-card ${statusClass}">
      <div class="match-header">
        <div class="match-title-group">
          <span class="match-icon">${statusIcon}</span>
          <h3 class="meter-name">${match.rule.name}</h3>
          ${scoreHtml}
        </div>
        ${ruleLink}
      </div>
      ${bodyHtml}
    </div>
  `;
}
```

**Key changes:**
1. Check `match.matchPercentage === 100` and presence of `match.beautified`
2. 100% path: Use `.padyam`, `.poem`, `.ganaVibhajana` legacy classes with `match.beautified` and `match.html`
3. < 100% path: Keep existing `.match-table-container` and `.match-errors-container` with `match.html`

---

### Phase 8: TypeScript Types Update

#### File 9: `Chandam.Wasm/Client/src/types.ts` (line 34-36)

**Change:** Rename fields to match C# model (drop "rendered" prefix, match C# casing)

**Before:**
```typescript
export interface ChandamMatch {
  rule: RuleInfo;
  score: number;
  total: number;
  matchPercentage: number;
  isMatched: boolean;
  errors?: MatchError[];
  renderedHtml?: string;      // OLD
  renderedText?: string;      // OLD (unused)
  renderedMarkdown?: string;  // OLD
}
```

**After:**
```typescript
export interface ChandamMatch {
  rule: RuleInfo;
  score: number;
  total: number;
  matchPercentage: number;
  isMatched: boolean;
  errors?: MatchError[];
  html?: string;        // Gana vibhajana table (lowercase for TypeScript convention)
  markdown?: string;    // Structured summary
  beautified?: string;  // Decorated poem HTML
}
```

**Why:** 
- Matches C# property names (Html, Markdown, Beautified) but lowercase for TypeScript convention
- Removes redundant "rendered" prefix
- Clearer, shorter names

---

### Phase 9: CSS Changes

#### File 10: `Chandam.Wasm/wwwroot/css/chandam.css`

**Location 1: After line 517** (after `.error-description em`, before `.btn-primary`)

**Add legacy classes:**

```css
/* ========================================
   LEGACY CLASSES FOR 100% MATCH VIEW
   (Beautified poem + Gana vibhajana side-by-side)
   ======================================== */

/* Outer wrapper for decorated poem section */
.padyam {
  flex: 1 1 45%;
  min-width: 350px;
  padding: 1rem;
  background: #fafff9;         /* Light green tint */
  border: 1px solid #d8f3dc;
  border-radius: 8px;
  overflow-x: auto;
}

/* Inner poem text container */
.poem {
  font-family: var(--font-editor);  /* Suranna serif for poetry */
  font-size: 1.15rem;
  line-height: 1.9;
  color: #1a1a1a;
  white-space: normal;
  word-wrap: break-word;
}

/* Preserve decorations from Beautify() method */
.poem u {
  text-decoration: underline;
  text-decoration-color: #ff8000;  /* Yati underline - orange */
  text-underline-offset: 2px;
  text-decoration-thickness: 1.5px;
}

.poem b {
  font-weight: 700;
  color: #6a4c93;  /* Prasa bold - purple */
}

/* Gana vibhajana table wrapper (100% match scenario) */
.ganaVibhajana {
  flex: 1 1 50%;
  min-width: 400px;
  overflow-x: auto;
  border-radius: 8px;
}

/* Ensure table inside ganaVibhajana has proper styling */
.ganaVibhajana .tab {
  margin: 0;  /* Remove default margin when inside wrapper */
}
```

**Location 2: Inside mobile media query** (after line 1339, inside `@media (max-width: 768px)` block)

**Add mobile responsive styles:**

```css
/* ========================================
   LEGACY CLASSES MOBILE RESPONSIVE
   ======================================== */

.padyam {
  min-width: 100%;
  flex: 1 1 100%;
  padding: 0.75rem;
  margin-bottom: 1rem;  /* Space between stacked items */
}

.poem {
  font-size: 1.05rem;
  line-height: 1.8;
}

.ganaVibhajana {
  min-width: 100%;
  flex: 1 1 100%;
}
```

**Why:**
- `.padyam` gets light green background to highlight poem section
- `.poem` uses Suranna serif font for elegant poetry display
- Yati underlines styled orange, prasa bold styled purple
- Flexbox layout: 45%/50% split on desktop, 100% stacked on mobile

---

## Critical Files Summary

1. **`Chandam.Core/Chandam/Padyam.cs`** - Add `Beautify()` method (after line 1668)
2. **`Chandam.API/Models/RenderFormat.cs`** - Remove `Text = 2`, renumber `Markdown` to 2
3. **`Chandam.API/Models/ChandamMatch.cs`** - Rename fields: Html, Markdown, Beautified (drop "Rendered" prefix)
4. **`Chandam.API/Services/ChandamService.cs`** - Update BuildChandamMatch, add `DetermineWithBeautified()` and `TryMatchWithBeautified()` methods
5. **`Chandam.API.WebApi/Program.cs`** - Update endpoints to use new combined methods (lines 80, 86)
6. **`Chandam.Wasm/JsBridge.cs`** - Keep as-is (already uses RenderFormat.Html)
7. **`Chandam.MCP.Tools/ChandamTools.cs`** - Update existing tools to use Markdown and call combined methods (NO new tool needed)
8. **`Chandam.Wasm/Client/src/ui/results.ts`** - Add conditional rendering logic with lowercase field names
9. **`Chandam.Wasm/Client/src/types.ts`** - Rename fields: html, markdown, beautified (lowercase)
10. **`Chandam.Wasm/wwwroot/css/chandam.css`** - Add legacy classes (after line 517) and mobile styles (after line 1339)
11. **`Chandam.MCP.Tests/ChandamToolsTests.cs`** - Add tests for combined Markdown + Beautified output (after line 146)

---

## Edge Cases Handled

1. **No renderedBeautified available**: Falls back to existing table + errors layout
2. **Very long poems**: `.padyam` has `overflow-x: auto` for horizontal scroll
3. **No errors but < 100% match**: Shows only table container (existing behavior)
4. **Exactly 100% with errors**: Impossible - backend ensures 100% = no errors
5. **Mobile screens**: Both layouts stack vertically via flexbox `min-width: 100%`

---

### Phase 10: Test Updates

#### Test Assessment

**Good news:** Existing tests don't use the fields being renamed!
- `Chandam.MCP.Tests/ChandamToolsTests.cs` - Tests MCP tools but only checks basic properties (Success, IsMatch, MatchPercentage)
- `Chandam.API.IntegrationTests/BaselineTests.cs` - Tests match accuracy but doesn't check rendered output
- No tests currently use `RenderedHtml`, `RenderedText`, or `RenderedMarkdown` fields

**What needs updating:**

#### File 11: `Chandam.MCP.Tests/ChandamToolsTests.cs`

**Add new tests for combined output:**

**Location:** After existing tests (after line 146)

**Add:**
```csharp
[Fact]
public void DetermineChandam_ReturnsBothMarkdownAndBeautified()
{
    var result = _tools.DetermineChandam(TestPoem);
    var json = JsonDocument.Parse(result);

    Assert.True(json.RootElement.GetProperty("Success").GetBoolean());
    var matches = json.RootElement.GetProperty("Matches");
    Assert.True(matches.GetArrayLength() > 0);
    
    var firstMatch = matches[0];
    
    // Verify both Markdown and Beautified fields are populated
    Assert.True(firstMatch.TryGetProperty("Markdown", out var markdown));
    Assert.False(string.IsNullOrEmpty(markdown.GetString()));
    
    Assert.True(firstMatch.TryGetProperty("Beautified", out var beautified));
    Assert.False(string.IsNullOrEmpty(beautified.GetString()));
    
    // Beautified should contain HTML tags for decorations
    var beautifiedHtml = beautified.GetString();
    Assert.Contains("<u>", beautifiedHtml);  // Yati underlines
    Assert.Contains("<b>", beautifiedHtml);  // Prasa bold marks
}

[Fact]
public void TryMatchChandam_ReturnsBothMarkdownAndBeautified()
{
    var result = _tools.TryMatchChandam(TestPoem, "iMdravajramu");
    var json = JsonDocument.Parse(result);

    Assert.True(json.RootElement.GetProperty("IsMatch").GetBoolean());
    var match = json.RootElement.GetProperty("Match");
    
    // Verify both Markdown and Beautified fields are populated
    Assert.True(match.TryGetProperty("Markdown", out var markdown));
    Assert.False(string.IsNullOrEmpty(markdown.GetString()));
    
    Assert.True(match.TryGetProperty("Beautified", out var beautified));
    Assert.False(string.IsNullOrEmpty(beautified.GetString()));
    
    // Beautified should contain HTML tags
    var beautifiedHtml = beautified.GetString();
    Assert.Contains("<u>", beautifiedHtml);
    Assert.Contains("<b>", beautifiedHtml);
}
```

**Why:** Verify that MCP tools now return both formats after calling the combined service methods.

#### File 12: `Chandam.API.Tests/` (new test file if needed)

If API.Tests needs updating, add tests for:
- `DetermineWithBeautified()` method returns both Html and Beautified
- `TryMatchWithBeautified()` method returns both Html and Beautified
- Field name changes (Html, Markdown, Beautified)

**Optional:** Add API endpoint tests for `/api/determine` and `/api/try-match` to verify response JSON structure.

---

## Verification Steps

### Build & Test Commands

```bash
# 1. Build core library
dotnet build Chandam.Core

# 2. Build API
dotnet build Chandam.API
dotnet build Chandam.API.WebApi

# 3. Run API server for testing
dotnet run --project Chandam.API.WebApi
# -> http://localhost:5000

# 4. Test API endpoints
curl -X POST http://localhost:5000/api/determine \
  -H "Content-Type: application/json" \
  -d '{"poemText":"కారాచరణం కమలం భజే కరుణాపూరం","matchYati":true,"matchPrasa":true,"language":"te"}'

# Verify response has BOTH renderedHtml and renderedBeautified

# 5. Build WASM
dotnet build Chandam.Wasm

# 6. Build MCP tools
dotnet build Chandam.MCP.Tools
dotnet build Chandam.MCP.Stdio

# 7. Run MCP tests
dotnet test Chandam.MCP.Tests

# 8. Run integration tests
dotnet test Chandam.API.IntegrationTests
```

### Visual Testing

1. **100% match scenario:**
   - Input: Perfect poem (e.g., "కారాచరణం కమలం భజే కరుణాపూరం")
   - Expected: Beautified poem on left, gana vibhajana table on right
   - Check: No score badge, green checkmark icon

2. **< 100% match scenario:**
   - Input: Imperfect poem with 2-3 errors
   - Expected: Gana vibhajana table on left, errors table on right
   - Check: Score badge visible (e.g., "95%"), red X icon

3. **Mobile responsive:**
   - Resize browser to < 768px width
   - Expected: Both scenarios stack vertically

### API Testing

1. **Test /api/determine endpoint:**
   - Verify response has `Beautified` field populated
   - Verify response has `Html` field populated (or `Markdown` depending on request)
   - Verify both fields contain expected content

2. **Test /api/try-match endpoint:**
   - Same as above

3. **Test RenderFormat.Text removal:**
   - Verify enum only has None(0), Html(1), Markdown(2) values
   - Verify no compiler errors

### MCP Testing

1. **Test existing tools:**
   - `DetermineChandam()` should return BOTH Markdown and Beautified fields
   - `TryMatchChandam()` should return BOTH Markdown and Beautified fields
   - Verify Markdown field has structured summary text
   - Verify Beautified field has decorated HTML with `<u>` and `<b>` tags

---

## Implementation Sequence

**Recommended order:**

1. **Core first** (File 1) - Add `Beautify()` method to Padyam.cs
2. **API models** (Files 2-3) - Remove Text from RenderFormat, add Beautified field
3. **API service** (File 4) - Update BuildChandamMatch, add new combined methods
4. **API endpoints** (File 5) - Update WebAPI to use new methods
5. **Test backend** - Verify API returns both formats via Postman/curl
6. **WASM bridge** (File 6) - Update JsBridge to handle new response structure
7. **MCP tools** (File 7) - Update existing tools, add BeautifyPoem tool
8. **Test MCP** - Verify MCP tools work with new enum
9. **CSS** (File 10) - Add legacy classes and mobile responsive styles
10. **Test CSS** - Static HTML mockup to verify layout
11. **Frontend** (Files 8-9) - Update results.ts with conditional rendering, update types
12. **Integration test** - Full end-to-end with WASM app
13. **MCP integration test** - Test new BeautifyPoem tool via Claude Desktop

---

## Rollback Strategy

If issues arise:

1. **Frontend rollback**: Revert `results.ts` to always show `renderedHtml` in table container
2. **Backend rollback**: Revert endpoints to use `Determine()` instead of `DetermineWithBeautified()`
3. **RenderFormat rollback**: Re-add `Text = 2` enum value if needed
4. **CSS rollback**: Remove legacy classes (no impact on existing functionality)

**Low-risk changes:**
- Adding `Beautify()` method doesn't break existing code
- Adding new service methods doesn't break existing methods
- Removing `Text` enum value is safe (no external users)
- Adding new CSS classes doesn't affect existing elements

---

## Expected Outcomes

✅ **100% matches**: Beautified poem prominently displayed on left, technical analysis on right  
✅ **< 100% matches**: Technical analysis on left, errors on right (existing behavior)  
✅ **Mobile responsive**: Vertical stacking for both scenarios  
✅ **Legacy class names**: `.padyam`, `.poem`, `.ganaVibhajana` with modern flexbox CSS  
✅ **Clean API**: No more confusing `RenderFormat.Text` - explicit `Beautify()` method instead  
✅ **Cleaner field names**: Dropped "Rendered" prefix (Html, Markdown, Beautified)  
✅ **MCP enhanced**: Existing tools return BOTH Markdown + Beautified (no new tool needed)  
✅ **WASM gets both**: Html + Beautified for conditional rendering  
✅ **Performance**: Minimal impact - Beautify() is fast, only called when needed  
✅ **Type safety**: TypeScript types match C# models exactly (lowercase convention)

---

## Why This Approach (Clean Removal of RenderFormat.Text)

**User requirement:** Remove `RenderFormat.Text` entirely - it's a new product with no existing users.

**Rationale:**
1. **Clarity over compatibility** - `Text` sounds like plain text but returns decorated HTML
2. **Explicit is better than implicit** - `Beautify()` method name clearly indicates decorated output
3. **Separation of concerns:**
   - `Html` format = technical analysis (gana vibhajana table)
   - `Beautify()` = artistic output (decorated poem)
   - `Markdown` = documentation format
4. **MCP tool clarity** - New `BeautifyPoem()` tool explicitly indicates beautification use case
5. **No backward compatibility burden** - New product means we can make breaking changes

**Benefits:**
- Cleaner enum with clear purpose for each value
- Explicit method names (`Beautify()`) vs. ambiguous names (`Build2()`, `Text`)
- Dedicated MCP tool for beautification
- Future maintainability - new developers won't be confused by "Text" returning HTML

**Trade-offs:**
- More code changes across multiple layers
- Need to update all RenderFormat.Text usages (but there aren't many)
- But this is one-time pain for long-term clarity

---

## Future Enhancements (Out of Scope)

These are explicitly NOT part of this implementation:

1. **Toggle view** - Add button to switch between poem/table for 100% matches
2. **User preference** - Remember preferred view mode in localStorage
3. **Animation** - Smooth transitions between modes
4. **Print styling** - Print-specific CSS for beautified poems
5. **Export** - Download beautified poem as image/PDF
6. **Inline editing** - Edit poem inline and see live results
7. **Syntax highlighting** - Color-code different types of errors
