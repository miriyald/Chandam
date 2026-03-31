# Dependency Versions

## Version Policy

**All versions are pinned exactly** (no `^` or `~` prefixes) for:
- **Production stability**: No surprise breaking changes
- **Security**: Explicit control over what's deployed
- **Reproducibility**: Same build every time

## Current Versions (as of 2026-03-31)

| Package | Version | Notes |
|---------|---------|-------|
| vite | 8.0.3 | ✨ Latest stable - Build tool and dev server |
| typescript | 6.0.2 | ✨ Latest stable - TypeScript compiler |
| eslint | 10.1.0 | ✨ Latest stable - JavaScript/TypeScript linter |
| @eslint/js | 10.0.1 | ESLint JavaScript rules (required for ESLint 10+) |
| @typescript-eslint/eslint-plugin | 8.58.0 | TypeScript-specific linting rules |
| @typescript-eslint/parser | 8.58.0 | TypeScript parser for ESLint |
| typescript-eslint | 8.58.0 | Unified TypeScript-ESLint config helper |

## Node.js Requirements

- **Node.js**: >=20.0.0 (LTS)
- **npm**: >=10.0.0

## Updating Dependencies

### Security Updates

For security patches within the same major version:

```bash
# Check for security vulnerabilities
npm audit

# Update specific package to latest patch version
npm install <package>@<version> --save-exact

# Example: Update vite to 5.4.22 (hypothetical security patch)
npm install vite@5.4.22 --save-exact
```

### Major Version Updates

**Before upgrading major versions:**

1. Check release notes and breaking changes
2. Test in development environment
3. Run full test suite
4. Update this VERSIONS.md file

**Major version changes applied:**

- ✅ **Vite 5 → 8**: Updated successfully, using latest stable
- ✅ **TypeScript 5 → 6**: Requires explicit `rootDir` in tsconfig.json
- ✅ **ESLint 8 → 10**: Flat config format (already implemented)
  - Requires `@eslint/js` and `typescript-eslint` packages
  - Updated `eslint.config.js` to use new unified config API

### Checking for Updates

```bash
# List outdated packages
npm outdated

# View specific package versions
npm view vite versions --json | jq '.[-5:]'
```

## Security Monitoring

- **npm audit**: Run before each deployment
- **Dependabot**: Enabled on GitHub for automated security alerts
- **Snyk**: Optional - for continuous security monitoring

## Rebuild Lock File

If you need to regenerate `package-lock.json` from scratch:

```bash
rm package-lock.json
npm install
```

**Note**: This will install the exact versions specified in `package.json` since all versions are pinned.
