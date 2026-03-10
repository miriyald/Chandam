# Language Code Support

The Chandam API now supports **ISO 639-1 language codes** in addition to numeric enum values.

## Supported Language Codes

| Language | ISO 639-1 | ISO 639-2 | Full Name | Numeric | Native |
|----------|-----------|-----------|-----------|---------|---------|
| Telugu | `te` | `tel` | `Telugu` | `0` | తెలుగు |
| Kannada | `kn` | `kan` | `Kannada` | `1` | ಕನ್ನಡ |
| Sanskrit | `sa` | `san` | `Sanskrit` | `2` | संस्कृतम् |
| Hindi | `hi` | `hin` | `Hindi` | `3` | हिन्दी |
| Malayalam | `ml` | `mal` | `Malayalam` | `4` | മലയാളം |

## Usage Examples

### List Supported Languages

```bash
GET /api/languages
```

**Response:**
```json
{
  "supportedLanguages": [
    { "code": "te", "name": "Telugu", "numericValue": 0 },
    { "code": "kn", "name": "Kannada", "numericValue": 1 },
    { "code": "sa", "name": "Sanskrit", "numericValue": 2 },
    { "code": "hi", "name": "Hindi", "numericValue": 3 },
    { "code": "ml", "name": "Malayalam", "numericValue": 4 }
  ]
}
```

### Filtering Rules by Language

All these are equivalent:

```bash
# ISO 639-1 code (recommended)
GET /api/rules?language=te

# ISO 639-2 code
GET /api/rules?language=tel

# Full name
GET /api/rules?language=Telugu

# Numeric value
GET /api/rules?language=0
```

### POST Requests with Language Codes

**Option 1: ISO 639-1 code (recommended)**
```json
{
  "poemText": "సామర్థ్యలీలన్...",
  "language": "te",
  "matchYati": true,
  "matchPrasa": true
}
```

**Option 2: Numeric value (backward compatible)**
```json
{
  "poemText": "సామర్థ్యలీలన్...",
  "language": 0,
  "matchYati": true,
  "matchPrasa": true
}
```

**Option 3: Full name**
```json
{
  "poemText": "సామర్థ్యలీలన్...",
  "language": "Telugu",
  "matchYati": true,
  "matchPrasa": true
}
```

## API Endpoints with Language Support

### 1. Determine

```bash
POST /api/determine
```

**With language code:**
```bash
curl -X POST http://localhost:8080/api/determine \
  -H "Content-Type: application/json" \
  -d '{
    "poemText": "your poem here",
    "language": "te",
    "matchYati": true,
    "matchPrasa": true
  }'
```

### 2. Scores

```bash
POST /api/scores
```

**Filter by language:**
```bash
curl -X POST http://localhost:8080/api/scores \
  -H "Content-Type: application/json" \
  -d '{
    "poemText": "your poem here",
    "language": "te",
    "minimumMatchPercentage": 50
  }'
```

### 3. List Rules

```bash
GET /api/rules?language={code}
```

**Examples:**
```bash
# Telugu rules
curl http://localhost:8080/api/rules?language=te

# Kannada rules
curl http://localhost:8080/api/rules?language=kn

# Sanskrit rules
curl http://localhost:8080/api/rules?language=sa

# All rules (no filter)
curl http://localhost:8080/api/rules
```

## Response Format

API responses now include both the enum name AND the language code:

```json
{
  "language": "Telugu",
  "languageCode": "te",
  "rules": [
    {
      "identifier": "iMdravajramu",
      "name": "ఇంద్రవజ్రము",
      "language": "Telugu",
      "languageCode": "te"
    }
  ]
}
```

## Testing

Use the provided test script to verify language code support:

```bash
bash test-language-codes.sh http://localhost:8080
```

## Backward Compatibility

✅ **Fully backward compatible** - existing numeric values (0, 1, 2, 3, 4) still work!

All existing API clients using numeric values will continue to work without changes. The API accepts BOTH numeric and string language codes.

## Best Practices

### ✅ Recommended
```json
{ "language": "te" }    // ISO 639-1 (standard, concise)
```

### ✔️ Acceptable
```json
{ "language": 0 }         // Numeric (backward compatible)
{ "language": "Telugu" }  // Full name (readable)
{ "language": "tel" }     // ISO 639-2 (also valid)
```

### ❌ Not Supported
```json
{ "language": "telgu" }   // Typo
{ "language": "te-IN" }   // Locale codes not supported
{ "language": 99 }        // Invalid numeric value
```

## Implementation Details

The API uses a custom JSON converter that:
1. Accepts numeric values (0-4)
2. Accepts ISO 639-1 codes ("te", "kn", etc.)
3. Accepts ISO 639-2 codes ("tel", "kan", etc.)
4. Accepts full language names ("Telugu", "Kannada", etc.)
5. Returns ISO 639-1 codes in responses
6. Defaults to Telugu if parsing fails

See `Chandam.API.Helpers.LanguageCodeMapper` and `Chandam.API.Converters.LanguageJsonConverter` for implementation.
