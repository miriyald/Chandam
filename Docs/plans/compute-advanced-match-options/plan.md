# Plan: Expose Santi Prasa / Soundex Sandhi as explicit match options

## Scope

**In scope**
- Two new flags (`AllowSantiPrasa`, `SoundexSandhi`, both defaulting to `false`) on the four `Chandam.API` request DTOs.
- Yati gating enforced in `ChandamService`.
- Exposure through WebApi (automatic), MCP tools, and the WASM bridge.
- An **Advanced** disclosure row on the Compute page (both `/compute/*` routes).
- Tests: MCP unit tests, Playwright E2E.

**Also in scope (added during implementation)**
- Tests run with Soundex Sandhi **on** (unit + integration), while production defaults stay **off**.
- Regenerating `Chandam.Config/Baselines/baseline-results.yaml` to match.

**Out of scope**
- Any change to `Chandam.Core`, `Chandam.Rules`, `Chandam.Util`, `Chandam.Indic`, `Chandam.Samples`.
- Persisting advanced-toggle state across navigation (`EditorState` already has unused `matchYati`/`matchPrasa` fields; not wired up here).

## Steps

- [x] 1. Add `AllowSantiPrasa` / `SoundexSandhi` (default `false`) to `DetermineRequest`, `TryMatchRequest`, `TryMatchCustomRequest`, `ScoresRequest`.
- [x] 2. Add `ChandamService.CreatePadyam(matchYati, matchPrasa, allowSantiPrasa, soundexSandhi)` applying the `matchYati &&` gate; route all six `Padyam` construction sites through it; mirror the gate on the `MatchOptions` path in `Determine`.
- [x] 3. Add `match_santi_prasa` / `match_soundex_sandhi` optional params to `DetermineChandam`, `TryMatchChandam`, `CalculateScores` in `ChandamTools.cs`.
- [x] 4. Append `allowSantiPrasa` / `soundexSandhi` params to `JsBridge.Determine`, `TryMatch`, `GetScores` (appended, not inserted — JS interop is positional).
- [x] 5. Add `MatchFlags` to `types.ts` and `readMatchFlags()` to `shared-components.ts`; switch the three `WasmBridge` methods to take `MatchFlags`; replace the five duplicated DOM-read sites.
- [x] 6. Add the `<details id="advanced-options">` row to `renderEditorCard()` plus `attachAdvancedOptionsToggle()`; call it from both compute pages' `attachEventHandlers`.
- [x] 7. Add `editor_advanced`, `editor_santi_prasa`, `editor_soundex_sandhi` to the `Translations` interface and both `en` and `te` maps.
- [x] 8. Add `.advanced-options` and `.toggle-group.stacked` CSS; add `flex-wrap: wrap` to `.toggle-group`; add tablet/mobile overrides.
- [x] 9. Add MCP tests: the Yati-gate invariant (3 endpoints) and that Soundex Sandhi still changes the Yati verdict.
- [x] 9b. Run all tests with Soundex Sandhi on — `BaselineSoundexSandhi` constant in the MCP unit tests, `SoundexSandhi = true` in `BaselineGenerator`, `match_soundex_sandhi: true` in `McpReliabilityTests` — then regenerate `baseline-results.yaml` and re-verify at 0 diffs.
- [x] 10. Extend `03-compute-workflow.spec.ts` with default-state and Yati-gating assertions.
- [x] 10b. Refresh the two desktop compute visual baselines (`--update-snapshots=all`, since `changed` mode is masked by the 8% tolerance); revert the three snapshots whose diffs were pre-existing drift rather than this change.
- [x] 10c. Add a dedicated element-scoped snapshot for the **expanded** Advanced row (desktop + mobile) — the full-page baselines only capture it collapsed, and on mobile it is below the fold.
- [x] 11. Author this documentation set; update the `SoundexSandhi` rows in `Docs/workflows/*`.

### Follow-up round (requested after first delivery)

- [x] 12. Move the Advanced row **above** the primary action: `.main-actions` leaves `.controls-bar` and becomes its own row after the `<details>`, so document order is toggles → Advanced → Analyze at every width.
- [x] 13. Persist the match flags in `localStorage`, like the editor text: `matchSantiPrasa` / `matchSoundexSandhi` added to `EditorState` and `StorageService`, and the two pre-existing but dead `matchYati` / `matchPrasa` fields wired up at the same time.
- [x] 14. Surface an in-force hint: the row reopens **expanded** when a restored advanced flag is active, and the summary carries a count badge so an active flag stays visible once collapsed.
- [x] 14b. Fold restore + persist + gate into one `initMatchOptions()` (replacing `attachAdvancedOptionsToggle`) so restore cannot race the Yati gate.

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| **Auto-detect regresses on canonical verse.** `SoundexSandhi=false` makes Yati stricter, so `MostProbable2` can fall through to `GenricVruttam`. | **Materialised, not mitigated** — measured and documented in `status.md`. MCP unit tests opt in via `BaselineSoundexSandhi = true` so their expectations are preserved. Flagged to the requester as an open product decision. |
| Baseline moves | Deliberate: tests now run at Soundex Sandhi `true`, so the baseline was regenerated (95.95% → 96.89%, 603 → 612 entries). Re-verified afterwards at 0 improvements / 0 regressions. See `status.md` for before/after. |
| Positional JS interop drift | New params appended after existing ones; TS side passes a `MatchFlags` object destructured at one call site per method. |
| MCP param insertion breaks callers | New params inserted before `language`, but every existing C# caller uses named or leading-only args (verified across `Chandam.MCP.Tests`, `Chandam.API.IntegrationTests`). MCP itself dispatches by name. |
| Long Telugu labels break the row | Toggles stack vertically (`.toggle-group.stacked`); `flex-wrap: wrap` added to `.toggle-group`; font sizes reduced at mobile breakpoint. |

## Verification / acceptance criteria

| Check | Result |
|---|---|
| `dotnet build Chandam.sln` | 0 errors (20 pre-existing NU1900 / vite warnings) |
| `dotnet test Chandam.MCP.Tests` | 26/26 pass (was 22; +4 new) |
| `dotnet test Chandam.API.IntegrationTests` | 118 pass, 4 skipped, 0 fail — exact match vs regenerated baseline |
| `npm run lint` (Client) | 43 errors, identical to pre-change baseline — no new findings |
| `npm run test` (Client) | 163/163 pass |
| `npm run build` (Client) | Succeeds (runs as part of the WASM csproj build) |
| Playwright `03-compute-workflow.spec.ts` | 26/26 pass across desktop + mobile (13 each, was 10); 2 pre-existing mobile flakes pass on retry |
| Playwright visual baselines (`01-links-and-baselines`) | 20/20 pass; 2 desktop compute snapshots refreshed |
| New `advanced-options-expanded.png` (desktop + mobile) | Stable across 3 consecutive runs at `maxDiffPixelRatio: 0.02` |
| `te`-locale layout at desktop + mobile | No horizontal overflow; toggles stack; longest label fits one line |
