# Part III: Examples

Practical illustrations of the workflow concepts. Reference these when working through the phases.

---

## Example 1: Meter-Theme Feasibility (లలితగతి)

**Meter:** లలితగతి (న న న జ స) — 15 chars per line, 13/15 positions laghu.

**Problem:** The word "పరాభవ" (ప(1) రా(2) భ(1) వ(1) = 5 matras) has a guru syllable (రా) that can only land on position 11 — the sole interior guru position.

**Discovery:** This was found during drafting, costing multiple iteration rounds. A 2-minute feasibility check upfront would have flagged it immediately.

**Resolution:** Shortened to "పరభవ" — acceptable poetic license in a meter where 13/15 positions are laghu.

---

## Example 2: Laghu Word Bank (Ego/Pride Theme)

For a laghu-dominant meter (e.g., లలితగతి), pre-build a bank of all-laghu words:

| Syllables | Words |
|-----------|-------|
| 2 | చెడు, మది, అరి, తన |
| 3 | అహము, మదము, మనసు, కనుము, తొలగు, అలరు, పలుకు, తలచి, నిలువు, సుఖము, వరము |
| 4 | వినయము, తమసము, కలుషము, సరసము, మలినము, కలకలన |
| 5 | పరభవము (shortened from పరాభవము) |

Words with guru syllables (పరాభవ, ఉగాది, సంవత్సరం) can only appear where their guru syllable lands on a guru-allowed position.

---

## Example 3: ప్రాస Consonant Selection (కందం)

**Theme:** Ego/pride. Core word "పరాభవ" → 2nd syllable ర → ప్రాస = ర candidate.

**Problem:** "పరా" creates a జ (`|U|`) pattern at line start, which కందం forbids at odd positions (OddNonJa rule).

**Alternative:** ప్రాస = హ → line starters అహ, సహ, మహి, బహు — all natural, no constraint violations.

**Decision:** హ — this single choice saved 3 iterations.

---

## Example 4: యతి Anchor Pairs (కందం with ప్రాస = హ)

For కందం: Lines 1, 3 (odd) have no యతి. Lines 2, 4 (even) have యతి at 4th గణం.

| Line | Start Word | 1st Letter | Has యతి? | యతి Letter Needed | Strategy |
|------|-----------|------------|----------|-------------------|----------|
| 1 | అహమునకు | అ | No | — | Free |
| 2 | సహజముగ | స | Yes (4th గణం) | స or ఊష్మ group (శ,ష,స) or సరసయతి (చ,ఛ,జ,ఝ,శ,ష,స) | Wide options. Plan for స/శ/చ-వర్గ at the 13th matra |
| 3 | మహిలో | మ | No | — | Free |
| 4 | బహుళముగ | బ | Yes (4th గణం) | బ or ప-వర్గ (ప,ఫ,భ,మ) | Place a ప-వర్గ letter at the 13th matra |

**Pre-check skeleton:**
```
Line 2:  స___ ___ ___ స/సం___ ___
         [grp1] [grp2] [grp3] [grp4=యతి] [grp5]
         <-- 12 matras --> ^ యతి here

Line 4:  బ___ ___ ___ బ/ప-వర్గ___ ___
         [grp1] [grp2] [grp3] [grp4=యతి] [grp5]
```

---

## Example 5: యతి Anchor Pairs (లలితగతి వృత్తం with ప్రాస = ల)

In a వృత్తం, ALL lines have యతి (fixed character position). No "free" lines — strategy shifts to which pairs give the most word flexibility.

| Line | Start Word | 1st Letter | యతి Position | యతి Letter Needed | Strategy |
|------|-----------|------------|-------------|-------------------|----------|
| 1 | కలకలన | క | 11th char (guru) | క-వర్గ (క,గ,ఘ) with long vowel | గా from ఉగాది at pos 10-12 |
| 2 | మలినమగు | మ | 11th char (guru) | మ or ప-వర్గ (ప,ఫ,బ,భ) — ensure finish group matches | మా — e.g., "మాయ" |
| 3 | వలసినది | వ | 11th char (guru) | Exact వ | వా — e.g., "వాసి" |
| 4 | తలచి | త | 11th char (guru) | త-వర్గ (త,ద,ధ,న) | దా — e.g., "దారి" |

---

## Example 6: Word-to-Group Alignment

| Word | Breakdown | Total Matras | Fits in 4-matra group? |
|------|-----------|-------------|----------------------|
| పరాభవ | ప(1) రా(2) భ(1) వ(1) | 5 | No — spans 2 groups |
| అహము | అ(1) హ(1) ము(1) | 3 | No — needs 1 more matra |
| గర్వం | గర్(2) వం(2) | 4 | Yes — perfect fit |
| ఉగాది | ఉ(1) గా(2) ది(1) | 4 | Yes — perfect fit |

For words that span groups, verify the split creates valid group types:
```
పరాభవముగ = ప(1)రా(2)భ(1) | వ(1)ము(1)గ(1)...
             [group: 4]     [continues into next group]
```
Check: does `|U|` = జ? Is జ allowed at that position?

---

## Example 7: Constraint Sheet (కందం)

```
Chandam:     కందం
ప్రాస:       హ
Line starters: అహ- / సహ- / మహ- / బహ-

Line 1: 3 groups x 4 matras = 12 | No యతి | Odd groups != జ
Line 2: 5 groups x 4 matras = 20 | యతి at grp 4 (స<->స) | Grp 3 must be జ or నల | Odd groups != జ
Line 3: 3 groups x 4 matras = 12 | No యతి | Odd groups != జ
Line 4: 5 groups x 4 matras = 20 | యతి at grp 4 (బ<->ప-వర్గ) | Grp 3 must be జ or నల | Odd groups != జ

Key word placement:
- "పరాభవ" (5 matras): place spanning groups 2->3 of line 1
- "ఉగాది" (4 matras): fits one group exactly
- "మదమ్ము" (4 matras): fits one group exactly
```

---

## Example 8: Constraint Sheet (వృత్తం — లలితగతి)

```
Chandam:     లలితగతి (వృత్తం)
Pattern:     న న న జ స = ||| ||| ||| |U| ||U (15 chars per line)
ప్రాస:       ల
Line starters: కల- / మలి- / వల- / తల-
Guru positions: 11 and 15 ONLY (all others laghu)

Line 1: 15 chars | యతి at 11 (క<->గా, క-వర్గ) | ఉగాది at pos 10-12
Line 2: 15 chars | యతి at 11 (మ<->మా, exact)  | "మాయ" at pos 11-12
Line 3: 15 chars | యతి at 11 (వ<->వా, exact)  | "వాసి" at pos 11-12
Line 4: 15 chars | యతి at 11 (త<->దా, త-వర్గ) | "దారి" at pos 11-12

Theme word adaptations:
- "పరాభవ" -> "పరభవ" (shortened — laghu-dominant meter liberty)
- "అహంకారము" -> "అహము" (all-laghu synonym)
- "ఉగాది" -> place at pos 10-12 so గా hits the guru at pos 11
```

---

# Part IV: Learnings

Insights from practice. These patterns have been validated across multiple composition sessions.

---

## L1: Feasibility Check Prevents Wasted Iteration

A 2-minute check of whether key theme words can physically fit the meter saves hours of drafting iteration. లలితగతి (13/15 laghu) was nearly unusable for "పరాభవ" — discovered only during drafting. Always check guru positions against the meter's guru-allowed positions BEFORE committing to a meter.

## L2: ప్రాస Choice is the Highest-Leverage Decision

The ప్రాస consonant constrains every line's opening. A bad choice (e.g., ర for కందం when it forces జ at odd positions) costs 3+ iterations. A good choice (e.g., హ with starters అహ/సహ/మహి/బహు) makes the rest almost mechanical. Spend time here.

## L3: Finish Group Mismatch is the #1 Yati Failure Cause

A yati failure on a consonant match almost always means the **finish groups don't match**, not that the consonants are wrong. Example: కి↔గు fails not because క and గ are incompatible (they are — same వర్గ), but because ి (ఇ-group) and ు (ఉ-group) are in different finish groups. Fix: కి↔గి or కు↔గు.

## L4: PrasaGroups are Stricter than ConsoGroups

యతి treats full వర్గs as groups (క-ఖ-గ-ఘ all match), but ప్రాస uses individual **pairs** within the వర్గ (క-గ, ఖ-ఘ, etc. as స్వవర్గజ). So ప్రాస matching is generally stricter than యతి matching for consonant compatibility. Don't assume that because a consonant pair works for యతి, it also works for ప్రాస.

## L5: Draft Most Constrained Lines First

- **కందం / జాతి:** Even lines have యతి + special rules (like the sixth rule). Draft them first; odd lines have more freedom for carrying meaning.
- **వృత్తం:** ALL lines have యతి. Prioritize lines where యతి + ప్రాస + theme word placement all intersect — those have the least freedom.

## L6: Laghu-Dominant Meters Need a Word Bank

Meters with >70% laghu positions (like లలితగతి with 13/15) make most Telugu words unusable in the laghu zone. Build a dedicated laghu word bank before drafting. Theme words with guru syllables need careful position planning.

## L7: Sandhi Effects at యతి Position

When words join, consonants change (e.g., కు + ప → కుఁ బ). The letter at the యతి position may be the sandhi form (బ), not the original (ప). Since ప and బ are same వర్గ, this is still valid — but be aware of it during planning.

## L8: The Engine's వర్గ Groups Exclude Nasals

The standard 5 వర్గ groups in the engine do **not** include the 5th letter (nasal): ఙ, ఞ, ణ, న, మ are handled separately via బిందు యతులు and other special rules. This differs from classical prosody where the nasal is part of the వర్గ.
