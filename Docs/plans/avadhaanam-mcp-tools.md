# Plan: Avadhaanam MCP Tools for Chandam

## Context

The `lg-wf-engine` project (padyam-generic workflow) needs deterministic validation tools for Avadhaanam (అవధానం) literary techniques. Currently Chandam MCP only validates **prosody** (meter, yati, prasa) but not **content-level constraints** (forbidden letters, required words at positions, syllable-position matching). These tools will serve as the "safety net" for AI-composed Telugu poetry.

## What We Can Reuse

The heavy lifting is already done in the existing Chandam libraries:

| Existing Code | What It Gives Us |
|---|---|
| `Chandam.Indic/IndicParser.Split(text)` | Telugu text → `IndicAkshar[]` (syllable segmentation with conjunct handling) |
| `IndicAkshar.Chars` (`IndicChar[]`) | Inspect individual characters **inside** conjuncts (for nisheddhakshari) |
| `IndicChar.BaseChar`, `.IsHallu` | Identify base consonant within any akshar |
| `Chandam.Core/GanaVibhajana(text, lang)` | Full syllable split + guru/laghu + line handling |
| `IndicAkshar.GetSymbol()` | Returns "U" (guru) or "\|" (laghu) per syllable |
| `GanaVibhajana.GetLangCharSet()` | Language-aware charset selection (Telugu/Kannada) |

**Key insight**: `GanaVibhajana` extends `IndicParser`. For `split_syllables` we use `GanaVibhajana` (full analysis). For constraint checks we use `IndicParser.Split()` directly (lighter, just segmentation).

## Implementation Approach

### New Files (all in `Chandam.MCP.Tools/`)

| File | Purpose |
|---|---|
| `AvadhaanamTools.cs` | MCP tool methods (7 tools, `[McpServerToolType]`) |
| `AvadhaanamService.cs` | Constraint validation logic |
| `Models/AvadhaanamModels.cs` | Request/Response DTOs |

Plus test file: `Chandam.MCP.Tests/AvadhaanamToolsTests.cs`

### Registration Changes

**`ServiceRegistration.cs`** — add:
```csharp
services.AddSingleton<AvadhaanamService>();
```

**`Chandam.MCP.Stdio/Program.cs`** and **`Chandam.MCP.Http/Program.cs`** — add:
```csharp
.WithTools<AvadhaanamTools>();
```

### Tool Definitions

All 7 tools follow the existing pattern: `[McpServerTool]` method → JSON response.

#### Phase 1 (MVP)

1. **`split_syllables`** — Split text into syllables with guru/laghu
   - Uses `new GanaVibhajana(text, lang)` 
   - Returns: `{ syllables: [...], count, guru_laghu: [...], weights: [...] }`

2. **`check_text_constraints`** — Composite validator (all constraint types in one call)
   - Accepts array of typed constraints
   - Internally dispatches to individual check methods in `AvadhaanamService`
   - Returns: `{ valid, score, total, passed, failed, results: [...] }`

#### Phase 2 (Individual tools)

3. **`check_nisheddhakshari`** — Forbidden letters (including in conjuncts)
4. **`check_nirdishTakshari`** — Line start/end prescribed aksharas
5. **`check_nyastakshari`** — Akshar at exact syllable position
6. **`check_dattapadi`** — Words in assigned lines
7. **`check_samasyaa_line`** — Exact line match

### Core Logic (`AvadhaanamService`)

```
AvadhaanamService
├── SplitSyllables(text, lang) → uses GanaVibhajana
├── CheckNisheddhakshari(text, forbidden[], mode, lang) → Split() → check Chars[0].BaseChar of each akshar
├── CheckNirdishTakshari(text, constraints, lang) → Split() → compare aksharas[0] / aksharas[^1].ToString()
├── CheckNyastakshari(text, placements, lang) → Split() → resolve position → compare aksharas[idx].ToString()
│     Position supports Python-style negative indexing: -1 = last, -2 = second-to-last
│     Resolution: idx = position < 0 ? count + position : position - 1
├── CheckDattapadi(text, words, lang) → substring search in assigned lines
├── CheckSamasyaaLine(text, lineNum, expected) → normalize whitespace + compare
└── CheckAll(text, constraints[], lang) → dispatches to above methods
```

**Nisheddhakshari — syllable-level check** (traditional rule):

The traditional rule forbids a letter from being the **primary (starting) consonant** of any syllable.
A subordinate consonant inside a conjunct does NOT count as a violation.

```
Example: forbidden letter = "ర"

"కర్మ" → aksharas: ["క", "ర్మ"]
  - "ర్మ" starts with ర (Chars[0].BaseChar == 'ర') → VIOLATION

"క్రోధము" → aksharas: ["క్రో", "ధ", "ము"]
  - "క్రో" starts with క (Chars[0].BaseChar == 'క') → ర is subordinate, NO violation
```

Implementation:
```
parser.Split(line) → IndicAkshar[]
For each akshar: check akshar.Chars[0].BaseChar against forbidden set
→ Only the leading consonant triggers a violation
```

**Two modes** via `mode` parameter:
- `"syllable"` (default, traditional nisheddhakshari) — checks first hallu of each akshar
- `"anywhere"` — simple substring check on raw text (for stricter variants)

### Dependency Chain (already works)

```
Chandam.MCP.Tools → Chandam.API → Chandam.Core → Chandam.Indic
                                    (GanaVibhajana)  (IndicParser, TeluguCharSet)
```

No new project references needed. `AvadhaanamService` can directly instantiate `GanaVibhajana` and `TeluguParser`.

### Parameter Design for `check_text_constraints`

The composite tool accepts a JSON `constraints` parameter:
```json
[
  {"type": "not_contains", "letters": ["ర"], "mode": "syllable"},
  {"type": "line_starts_with", "line": 1, "akshar": "క"},
  {"type": "line_ends_with", "line": 4, "akshar": "తి"},
  {"type": "contains_word", "word": "వంకాయ", "line": 2},
  {"type": "line_equals", "line": 4, "text": "రావణుడు మంచివాడు"},
  {"type": "akshar_at_position", "line": 2, "position": 3, "akshar": "ము"},
  {"type": "akshar_at_position", "line": 4, "position": -1, "akshar": "డు"}
]
```

MCP tool parameter will be a single JSON string that gets deserialized internally.

## Error Handling

**No exceptions from MCP tools.** These tools are consumed by LLM agents — exceptions kill the agent's chain. Always return structured JSON with meaningful messages the agent can understand and act on.

- Out-of-bounds position → `{ "passed": false, "error": "Position 12 exceeds syllable count of 8 in line 3" }`
- Line number exceeds poem → `{ "passed": false, "error": "Line 6 does not exist (poem has 4 lines)" }`
- Empty text → `{ "valid": false, "score": 0, "error": "Empty poem text" }`
- Empty constraints → `{ "valid": true, "score": 100, "results": [] }`
- Invalid negative index → `{ "passed": false, "error": "Position -9 exceeds syllable count of 8 in line 2" }`

Every error includes: what went wrong + actual state (line count, syllable count) so the agent can self-correct.

Applies to **all** Avadhaanam MCP tools.

## Verification

1. `dotnet build Chandam.sln` — compiles clean
2. `dotnet test Chandam.MCP.Tests` — new Avadhaanam tests pass
3. Manual test via MCP stdio: call `split_syllables` with "శోభిల్లు సప్తస్వర" → verify ["శో", "భి", "ల్లు", "స", "ప్త", "స్వ", "ర"]
4. Test nisheddhakshari with conjunct: forbidden "ర", text containing "స్త్ర" → must detect violation
5. All existing 13 MCP tests still pass (no regression)

## Critical Files to Modify

- `Chandam.MCP.Tools/ServiceRegistration.cs` (add singleton registration)
- `Chandam.MCP.Stdio/Program.cs` (add `.WithTools<AvadhaanamTools>()`)
- `Chandam.MCP.Http/Program.cs` (add `.WithTools<AvadhaanamTools>()`)

## Critical Files to Create

- `Chandam.MCP.Tools/AvadhaanamTools.cs`
- `Chandam.MCP.Tools/AvadhaanamService.cs`
- `Chandam.MCP.Tools/Models/AvadhaanamModels.cs`
- `Chandam.MCP.Tests/AvadhaanamToolsTests.cs`

## Existing Code to Reuse (verified accessible)

- `Chandam.Indic/IndicParser.cs:29` — `Split(string s)` method
- `Chandam.Core/Chandam/GSplitter.cs` — `GanaVibhajana(string str, RuleLanguage Lang)` constructor
- `Chandam.Indic/IndicAkshar2.cs` — `GetSymbol()`, `IsGuruvu`, `IsLaghuvu` properties
- `Chandam.Indic/IndicChar.cs` — `BaseChar`, `IsHallu` properties
- `Chandam.Indic/TeluguBase/TeluguCharSet.cs` — Telugu Unicode character definitions
- `Chandam.API/Helpers/LanguageCodeMapper.cs` — `ParseLanguage(string)` for language code parsing
