# Chandam Project - GitHub Copilot Instructions

## Project Overview

Chandam (ఛందం) is a Telugu/Sanskrit/Kannada poetry meter analysis system. It identifies metrical patterns in Indian language poems. The codebase has 379 Telugu rules with 554 tested examples at 96.09% accuracy.

## Rules for Code Generation

### Never Modify Core Projects

These contain undocumented domain knowledge. Do not generate edits for:

- `Chandam.Core/` — Matching, scoring, pattern recognition
- `Chandam.Rules/` — 343+ rule data classes
- `Chandam.Util/` — Contracts, enums, Manager
- `Chandam.Indic/` — Indic script processing
- `Chandam.Samples/` — Sample poem data

### Telugu Text Handling

- Always preserve Unicode — never escape or transliterate Telugu characters
- Do not translate Telugu terms to English (Chandam, Padyam, Gana, Yati, Prasa are domain terms)
- String comparisons involving Telugu text should be culture-aware

### Code Style

- C# / .NET 8.0
- Small, focused functions — single responsibility
- Mandatory parameters — avoid optionals
- N-Layer: Interface -> Service -> Data Access + Contracts
- No business logic in data access layers
- KISS — no future-proofing, no speculative abstractions

### Architecture Context

```
Chandam.Util        <- no dependencies (contracts, enums)
Chandam.Indic       <- Util
Chandam.Core        <- Util, Indic (NO dependency on Rules/Samples)
Chandam.API         <- Core, Util, Indic (NO dependency on Rules/Samples)
```

Rules and Samples are loaded at runtime via JSON/YAML config files.

### When Generating Tests

- Use xUnit
- Test with actual Telugu text, not English placeholders
- Integration tests verify match percentages against baselines
- Baseline data lives in `Chandam.Config/Baselines/`

### Configuration

- Rule files: `Chandam.Config/Rules/` (YAML preferred for Telugu text)
- App settings: project-specific `appsettings.json`
- Secrets: `.env` files (never hardcode)
- Constants: dedicated constants folder

### Language Codes

The API supports multiple formats: ISO 639-1 (te, kn, sa), ISO 639-2 (tel, kan, san), numeric (0-4), and full names.
