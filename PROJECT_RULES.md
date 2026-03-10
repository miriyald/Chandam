# Chandam Project Rules & Organization

## Folder Structure

This project follows a strict organization pattern. **All new files MUST be placed in the appropriate directories.**

### Directory Organization

```
Chandam3/
├── docs/                          # All documentation
│   ├── plans/                     # Phase planning documents
│   ├── execution/                 # Status tracking and completion reports
│   ├── CODING_PREFERENCES.md      # Coding standards
│   ├── DOCKER-KNOWN-ISSUES.md     # Docker-related documentation
│   └── DOCKER.md                  # Docker usage guide
├── scripts/                       # All executable scripts
│   ├── test-api.sh               # API testing script
│   ├── test-language-codes.sh    # Language code testing
│   └── build-docker.sh           # Docker build script
├── tests/                         # Test infrastructure
│   └── baselines/                # Baseline test results (JSON)
├── Config/                        # Configuration files
│   └── Rules/                    # Rule definition files (JSON/YAML)
├── Chandam.API/                   # API layer (Phase 1)
├── Chandam.API.WebApi/           # HTTP REST API (Phase 1)
├── Chandam.API.IntegrationTests/ # Integration tests
├── Core/                         # Business logic (DO NOT MODIFY)
├── Rules/                        # Rule definitions (DO NOT MODIFY)
└── ...
```

## File Placement Rules

### Documentation (.md files)
- **Plans**: `docs/plans/` - Phase planning, architecture decisions
- **Status/Execution**: `docs/execution/` - Status reports, completion summaries
- **General Docs**: `docs/` - Coding standards, guidelines, known issues
- **Project Root**: Only `README.md` and `PROJECT_RULES.md` allowed

### Scripts (.sh, .ps1, .bat)
- **ALL scripts**: `scripts/` - No exceptions
- Include:
  - Test scripts (test-*.sh)
  - Build scripts (build-*.sh)
  - Deployment scripts (deploy-*.sh)
  - Utility scripts

### Tests
- **Baseline data**: `Tests/Baselines/` - JSON baseline reports
- **Test projects**: Root level with `.Tests` suffix (e.g., `Chandam.API.IntegrationTests/`)

### Configuration
- **Rule files**: `Config/Rules/` - JSON and YAML rule definitions (YAML preferred for human editing)
- **App settings**: Project-specific (e.g., `Chandam.API.WebApi/appsettings.json`)
- **YAML Format**: Used for multi-line Telugu text, easier manual editing (YamlDotNet library)

## Naming Conventions

### Files
- **Markdown**: Use `UPPERCASE_WITH_UNDERSCORES.md` for important docs, `lowercase-with-dashes.md` for others
- **Scripts**: Use `lowercase-with-dashes.sh` (e.g., `test-api.sh`)
- **Code**: Follow C# conventions (PascalCase for classes/files)

### Folders
- Use lowercase for infrastructure folders: `docs/`, `scripts/`, `tests/`, `config/`
- Use PascalCase for project folders: `Chandam.API/`, `Chandam.API.WebApi/`

## Phase-Specific Rules

### Phase 1 (API Layer) - CURRENT
- ✅ API wrapper layer complete
- ✅ HTTP REST API functional
- ✅ Docker containerization working
- ✅ Integration tests with baseline reports
- ✅ Logging and monitoring

### Phase 2 (MCP Servers) - FUTURE
- Location: `Chandam.MCP.Server/`, `Chandam.MCP.WebApi/`
- Documentation: `docs/plans/phase2-mcp-servers.md`

### Phase 3 (Blazor WASM) - FUTURE
- Location: `Chandam.Wasm/`
- Documentation: `docs/plans/phase3-wasm.md`

## Critical Constraints

### DO NOT MODIFY
- **Core/**: Business logic - contains undocumented domain knowledge
- **Rules/**: Rule definitions - validated and tested
- **Util/**: Utility classes - shared across layers

### Preserve Telugu Authenticity
- No forced English translations
- Maintain Unicode support in all layers
- Test with actual Telugu text

### No Backward Compatibility Concerns
- Building from scratch - clean slate
- Can remove multi-targeting if needed
- Focus on Linux deployment

## Code Quality Standards

### Architecture
- **N-Layer**: Interface → Service → Data Access
- **No business logic in data access** - only data retrieval
- **Services orchestrate** use cases
- **Keep it simple** - KISS principle

### Functions
- **Small and focused** - single responsibility
- **Mandatory parameters** - avoid optionals
- **Clear naming** - intention-revealing

### Configuration
- **Use .env** for secrets (not committed)
- **Constants in constants folder**
- **appsettings.json** for application config

## Testing Standards

### Baseline Testing
- All rule examples must have baseline results
- Baseline stored in `Tests/Baselines/baseline-results.json`
- Tests verify no regressions (>5% match decrease)
- Generate baseline: Run `GenerateBaselineResults` test

### Integration Tests
- Test against actual business logic (not mocks)
- Verify match percentages
- Track timing metrics
- Compare against baseline

### API Tests
- Test all endpoints
- Verify Unicode/Telugu support
- Test language code variations (ISO 639-1, ISO 639-2, names, numeric)
- Scripts in `scripts/` folder

## Documentation Requirements

### New Features
- Update relevant plan document in `docs/plans/`
- Add to execution status in `docs/execution/`
- Update this file if organizational changes needed

### Known Issues
- Document in appropriate doc file
- Provide workarounds if available
- Mark with status: ⚠️ (investigating), ✅ (resolved), ❌ (blocking)

### Code Changes
- Add logging for transparency
- Update baseline tests if behavior changes
- Document breaking changes

## Commit Messages
- Format: `[Phase#] Category: Description`
- Examples:
  - `[Phase1] API: Add request logging middleware`
  - `[Phase1] Tests: Create baseline integration tests`
  - `[Phase1] Docs: Reorganize folder structure`

## Before Committing
- [ ] Files in correct directories
- [ ] Scripts in `scripts/` folder
- [ ] Docs in `docs/` structure
- [ ] Tests passing
- [ ] Baseline tests passing
- [ ] Docker builds successfully
- [ ] Logging added for transparency
- [ ] Documentation updated

---

**Remember**: Complete each phase thoroughly before moving to the next. No known issues should remain unresolved.
