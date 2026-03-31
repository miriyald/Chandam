# Dependency Versions

## Version Policy

**All versions are pinned exactly** (no `^` or `~` prefixes) for:
- **Production stability**: No surprise breaking changes
- **Security**: Explicit control over what's deployed
- **Reproducibility**: Same build every time

## Current Versions (as of 2026-03-31)

| Package | Version | Notes |
|---------|---------|-------|
| vite | 5.4.21 | Build tool and dev server |
| typescript | 5.9.3 | TypeScript compiler |
| @typescript-eslint/eslint-plugin | 6.21.0 | TypeScript linting rules |
| @typescript-eslint/parser | 6.21.0 | TypeScript parser for ESLint |
| eslint | 8.57.1 | ⚠️ **Deprecated** - consider upgrading to v9.x |

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

**Known upgrade paths:**

- **ESLint 8 → 9**: Major breaking changes in config format (flat config mandatory)
  - Requires updating `eslint.config.js` to new format
  - Update `@typescript-eslint/*` to v7.x or v8.x
  - See: https://eslint.org/docs/latest/use/migrate-to-9.0.0

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
