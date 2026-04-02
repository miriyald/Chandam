# Chandam WASM Editor UI Redesign - Summary

**Date:** 2026-04-01  
**Status:** Ready for implementation

---

## Documents Created

1. **Technical Implementation Plan:** `.claude/plans/composed-mapping-kernighan.md`
   - Detailed HTML/CSS/TypeScript implementation steps
   - Event handler logic
   - Responsive breakpoints
   - Testing plan
   - Effort: 6-8 hours

2. **Design Review Document:** `Docs/plans/ui-redesign-design-review.md`
   - Non-technical presentation for external design team
   - Current vs proposed state comparison
   - Design rationale
   - Incorporates design team feedback

3. **Backup:** `Docs/plans/ui-redesign-design-review.md.backup`
   - Original version preserved

---

## Final Design (Approved)

### Visual Layout

**Rule Set Page - Auto-detect ON:**
```
┌──────────────────────────────────────────────────────┐
│ Auto-detecting best match...          🎲 Random 🧹 Clear │ ← Subtle context
│ ┌──────────────────────────────────────────────────┐ │
│ │ పద్యం ఇక్కడ టైప్ చేయండి...                      │ │ ← Full-width editor
│ │ (line-height: 1.8 for Telugu script)            │ │
│ └──────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────┤
│ Yati [⚪──]  Prasa [⚪──]  Auto-detect [⚪──]  [Analyze] │ ← All options
└──────────────────────────────────────────────────────┘
```

**Rule Set Page - Auto-detect OFF:**
```
┌──────────────────────────────────────────────────────┐
│ Matching with: Utpalamala ▼           🎲 Random 🧹 Clear │ ← Rule picker
│ ┌──────────────────────────────────────────────────┐ │
│ │ పద్యం...                                        │ │
│ └──────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────┤
│ Yati [⚪──]  Prasa [⚪──]  Auto-detect [──⚪]  [Analyze] │
└──────────────────────────────────────────────────────┘
```

**Single Rule Page:**
```
┌──────────────────────────────────────────────────────┐
│ Matching with: Utpalamala             🎲 Random 🧹 Clear │ ← Static
│ ┌──────────────────────────────────────────────────┐ │
│ │ పద్యం...                                        │ │
│ └──────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────┤
│ Yati [⚪──]  Prasa [⚪──]              [Analyze Poem] │ ← No auto-detect
└──────────────────────────────────────────────────────┘
```

### Key Elements

1. **Editor Toolbar (Above Editor)**
   - **Subtle context label**: "Auto-detecting..." or "Matching with: Rule"
   - **Rule picker**: Integrated when auto-detect OFF
   - **Utilities**: Random / Clear (top-right)
   - Future: keyboard selector, copy, paste, font size

2. **Content Area (Middle)**
   - Full-width textarea
   - Generous spacing for Telugu script
   - Min-height: 200px, line-height: 1.8

3. **Controls Bar (Bottom)**
   - **All toggles together**: Yati, Prasa, Auto-detect
   - **Analyze button**: Right-aligned
   - Single rule page: No auto-detect toggle

---

## Design Principles Established

1. **Content First** - Editor gets maximum space
2. **Progressive Disclosure** - Rule picker hidden until needed
3. **Consistent Interactions** - All toggles use same pattern
4. **Visual Grouping** - Related controls in logical sections
5. **Extensibility** - Editor toolbar can grow (keyboard, copy, paste, etc.)
6. **Touch-Friendly** - 44px+ touch targets throughout

---

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Tabs → Toggle in controls bar | Mode is preference, not navigation; grouped with other options |
| Checkboxes → Toggles | Larger targets (44px+), clearer state |
| Context in editor toolbar | Subtle indication, no separate header, saves vertical space |
| Rule picker integrated | Shows in editor toolbar when needed, not separate section |
| Random/Clear in editor toolbar | Utilities belong with content they modify |
| Full-width editor | Maximize space for Telugu text |
| All options in controls bar | Single location to scan, easy to understand |
| Single "Analyze" button | Context-aware, consistent label |
| Both pages identical structure | Easier maintenance, shared components |

---

## Design Team Feedback (Incorporated)

✓ **Editor toolbar placement** - Random/Clear moved from mode controls to editor toolbar  
✓ **Telugu script spacing** - Line-height 1.8, generous padding  
✓ **Hidden rule risk** - Rule picker completely hidden when auto-detect ON  
✓ **Extensibility** - Editor toolbar designed for future tools  
✓ **Performance visibility** - Roadmap includes "Analyzed in Xms" display  
✓ **Real-time analysis** - Phase 2 feature, debounced
✓ **Context label subtlety** - Light gray, smaller font, italic
✓ **Component sharing** - Both pages use identical structure
✓ **Future rule details** - Deferred to Phase 5 (not now)

---

## Implementation Phases

### Phase 1 (This Redesign) - 6-8 hours
- Remove tabbed interface
- Implement toggle switches (Auto-detect, Yati, Prasa)
- Create editor toolbar component
- Full-width editor with Telugu-friendly spacing
- Grouped controls bar
- Mobile responsive layout

### Phase 2 (Quick Wins) - 4-6 hours
- Rule set visibility in header
- Performance timing display
- Keyboard shortcuts

### Phase 3 (Advanced UX) - 12-16 hours
- Real-time analysis (debounced)
- Inline prosody highlighting
- Editor toolbar extensions

### Phase 4 (Power User) - 20+ hours
- Command palette
- Analysis history
- Export features

---

## Files Modified (Implementation)

### TypeScript
- `Chandam.Wasm/Client/src/ui/rule-set-page.ts` - Remove tabs, add toggles
- `Chandam.Wasm/Client/src/ui/rule-page.ts` - Apply same pattern
- `Chandam.Wasm/Client/src/ui/rule-picker.ts` - Support `<details>` element
- `Chandam.Wasm/Client/src/ui/actions.ts` - Update event handlers

### CSS
- `Chandam.Wasm/wwwroot/css/chandam.css` - Remove `.mode-tabs`, add:
  - `.mode-header` - Mode controls
  - `.editor-toolbar` - Editor utilities
  - `.toggle-switch` - Toggle component
  - `.controls-bar` - Bottom controls
  - Responsive breakpoints

---

## Verification Checklist

After implementation:

- [ ] Build succeeds: `dotnet build Chandam.Wasm`
- [ ] Navigate to `/compute/telugu-frequent`
- [ ] Auto-detect toggle shows/hides rule picker
- [ ] Rule picker uses `<details>` element
- [ ] Editor has line-height: 1.8
- [ ] Random button fills editor
- [ ] Clear button empties editor
- [ ] Yati/Prasa toggles work
- [ ] Analyze button calls correct function based on auto-detect state
- [ ] Mobile layout stacks vertically
- [ ] Keyboard navigation works (Tab through controls)
- [ ] Screen reader announces toggle states

---

## Success Criteria

### Quantitative
- Reduce clicks to analyze: 3-4 → 2-3 clicks
- Mode switching: 2 seconds → <1 second
- Reduce "no rule selected" errors
- Lighthouse accessibility: 100 score

### Qualitative
- Users say "simpler" or "cleaner"
- No confusion about modes
- Positive mobile feedback

---

## Related Documents

- Project rules: `CLAUDE.md`
- Future UI polish: `Docs/plans/phase5b-ui-polish-FUTURE.md`
- Technical plan: `.claude/plans/composed-mapping-kernighan.md`
- Design review: `Docs/plans/ui-redesign-design-review.md`

---

*Ready for implementation - all design decisions finalized*
