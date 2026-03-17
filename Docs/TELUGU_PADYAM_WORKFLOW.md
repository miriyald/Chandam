# Telugu Padyam Writing Workflow

A step-by-step guide for composing a Telugu padyam (poem) using the Chandam MCP tools.

---

## Phase 1: Brainstorm

**Goal:** Understand the theme and intent, explore ideas, and pick a target chandam.

1. Discuss the **theme** - What is the poem about? What emotion or message should it carry?
2. Explore **narrative ideas** - What imagery, metaphors, or story arc will the poem use?
3. **Select a target chandam** (meter) that suits the theme and tone.

### Tools to Use

- **`list_rules`** - Browse all available meters for the chosen language.
  ```
  list_rules(language="te")
  ```
- **`get_rule_info`** - Read a short description of candidate meters to understand their character (e.g., utpalamaala for grand themes, kandam for compact expression).
  ```
  get_rule_info(rule_identifier="utpalamaala")
  ```

### Output
- A clear theme statement
- 2-3 candidate meters with brief rationale
- One selected chandam to proceed with

---

## Phase 2: Plan

**Goal:** Lock the high-level idea and build a vocabulary palette.

1. **Finalize the core idea** - Write a one-line summary of what each line/section of the padyam will convey.
2. **Identify key words** - List the essential words that carry the poem's meaning.
3. **Explore alternatives** - Use the dictionary tool to find synonyms, related forms, or verify meanings.

### Tools to Use

- **`get_word_meaning`** - Look up a Telugu word across multiple dictionary sources.
  ```
  get_word_meaning(word="వసంతము")
  ```

### Important Constraints
- The dictionary tool queries external sources. It is **rate-limited and expensive**.
- Use it **only when you genuinely need** to explore a word's meaning, find alternatives, or verify a root form.
- Do not use it for words you already know well.

### Output
- A structured outline (what each line will say)
- A vocabulary palette of candidate words with syllable counts

---

## Phase 2B: Design Constraints

**Goal:** Make the structural decisions that constrain every line of the poem — ప్రాస, యతి anchors, and word-to-group alignment — BEFORE drafting.

These are the highest-leverage decisions in padyam writing. Getting them wrong costs multiple iteration rounds; getting them right makes drafting almost mechanical.

### Step 1: Choose the ప్రాస Consonant

The 2nd syllable of every line must share the same consonant. This is not something to discover during drafting — it must be a deliberate upfront choice.

**Process:**
1. List the key words from your vocabulary palette (Phase 2).
2. For each word, note its 2nd syllable's consonant.
3. Identify which consonant gives you the most line-starting options across all 4 lines.
4. Verify: can you find at least 4 natural line-starters (one per line) using this consonant?

**Example from practice:**
- Core word "పరాభవ" → 2nd syllable ర → ప్రాస = ర candidate
- But "పరా" creates a జ (|U|) pattern at line start, which కందం forbids at odd positions
- Alternative: ప్రాస = హ → line starters అహ, సహ, మహి, బహు — all natural, no constraint violations
- **Decision: హ** (this single choice saved 3 iterations)

**Output:** One confirmed ప్రాస consonant with 4+ viable line-starter words.

### Step 2: Plan యతి Anchors

యతి is the caesura — a sound-match between the line's first letter and a letter at a specific position within the line. Failing to plan for it is the #1 cause of iteration waste.

#### 2a: Identify యతి type for your meter

| Meter Type | యతి Position | What Must Match |
|------------|-------------|-----------------|
| **వృత్తం** (e.g., ఉత్పలమాల) | Fixed character position (e.g., 10th syllable) | Letter at that position ↔ line's 1st letter |
| **జాతి** (e.g., కందం) | Start of a specific గణం (e.g., 4th గణం) | Letter at గణం boundary ↔ line's 1st letter |
| **ఉపజాతి** (e.g., ఆటవెలది) | Varies by line | Check `get_rule_info` for each line's rule |

Use `get_rule_info` to find the exact యతి position. For కందం:
- Lines 1, 3 (odd): **No యతి** requirement
- Lines 2, 4 (even): యతి at **1st letter of the 4th గణం** (i.e., after 12 మాత్రలు / 3 groups of 4)

#### 2b: Understand యతి compatibility

Two letters are యతి-compatible if they satisfy any of these:

| Match Type | Rule | Examples |
|------------|------|----------|
| **Exact** | Same letter | స ↔ స, బ ↔ బ |
| **Same వర్గ** | Same consonant group | ప-ఫ-బ-భ-మ are all compatible |
| **Same vowel** | Vowel sound matches | అ ↔ అ, ఆ ↔ ఆ |
| **GaNA category** | Both at boundary are same Surya/Indra/Chandra class | See Appendix |

The **వర్గ groups** (critical for planning):

| వర్గ | Letters (all mutually compatible) |
|------|----------------------------------|
| క-వర్గ | క, ఖ, గ, ఘ, ఙ |
| చ-వర్గ | చ, ఛ, జ, ఝ, ఞ |
| ట-వర్గ | ట, ఠ, డ, ఢ, ణ |
| త-వర్గ | త, థ, ద, ధ, న |
| ప-వర్గ | ప, ఫ, బ, భ, మ |

**Sandhi effect:** When words join, consonants change (e.g., కు + ప → కుఁ బ). The letter at యతి position may be the sandhi form (బ), not the original (ప). Since ప and బ are same వర్గ, this is still valid — but you must be aware of it.

#### 2c: Build యతి anchor pairs

For each line that requires యతి, plan a **pair**: the line-start letter and the యతి-position letter.

**Process:**
1. From Step 1, you know each line's starting word (for ప్రాస).
2. Note the first letter of each line.
3. For lines with యతి, determine what letter must appear at the యతి boundary.
4. Build pairs and verify compatibility.

**Example (కందం with ప్రాస = హ):**

| Line | Start Word | 1st Letter | Has యతి? | యతి Letter Needed | Strategy |
|------|-----------|------------|----------|-------------------|----------|
| 1 | అహమునకు | అ | No | — | Free |
| 2 | సహజముగ | స | Yes (4th గణం) | స or same-వర్గ (చ,ఛ,జ,ఝ,ఞ — no, స is not in a వర్గ!) | స must match exactly or by vowel. Plan for స/సం at the 13th matra |
| 3 | మహిలో | మ | No | — | Free |
| 4 | బహుళముగ | బ | Yes (4th గణం) | బ or ప-వర్గ (ప,ఫ,భ,మ) | Wider options — place a ప-వర్గ letter at the 13th matra |

> **Key insight:** Lines with యతి are harder to write. Plan them first. Lines without యతి give you freedom — save them for carrying the meaning.

#### 2d: Pre-check feasibility

Before moving to Phase 3, verify your design works by sketching rough line shapes:

```
Line 2 skeleton:  స___ ___ ___ స/సం___ ___
                  [grp1] [grp2] [grp3] [grp4=యతి] [grp5]
                  ←— 12 matras —→ ↑ యతి here

Line 4 skeleton:  బ___ ___ ___ బ/ప-వర్గ___ ___
                  [grp1] [grp2] [grp3] [grp4=యతి] [grp5]
```

If you can't imagine words fitting these skeletons, revisit Step 1 (change ప్రాస) or even Phase 1 (change meter) **now** — before writing a single line.

### Step 3: Analyze Word-to-Group Alignment

Key vocabulary words must fit cleanly within or across the meter's group boundaries. A word that straddles a boundary awkwardly will cause matra mismatches.

**Process:**
1. For each key word, compute the **guru/laghu breakdown**:
   - Long vowels (ఆ, ఈ, ఊ, ఏ, ఐ, ఓ, ఔ) → guru (2 మాత్రలు)
   - Short vowels (అ, ఇ, ఉ, ఋ) → laghu (1 మాత్ర)
   - Anusvara (ం) makes the syllable guru
   - Visarga (ః) makes the syllable guru
   - A syllable followed by a conjunct consonant → guru

2. Check the **total matra count** against your meter's group size:

   | Word | Breakdown | Total Matras | Fits in 4-matra group? |
   |------|-----------|-------------|----------------------|
   | పరాభవ | ప(1) రా(2) భ(1) వ(1) | 5 | No — spans 2 groups |
   | అహము | అ(1) హ(1) ము(1) | 3 | No — needs 1 more matra |
   | గర్వం | గర్(2) వం(2) | 4 | Yes — perfect fit |
   | ఉగాది | ఉ(1) గా(2) ది(1) | 4 | Yes — perfect fit |

3. For words that **don't fit** (like పరాభవ = 5 matras), find where they can **span across** two groups cleanly:
   ```
   పరాభవముగ = ప(1)రా(2)భ(1) | వ(1)ము(1)గ(1)...
                [group: 4]     [continues into next group]
   ```
   Verify: does the split point create valid group types? (e.g., |U| = జ — check if that's allowed at that position)

4. Flag **problem words** that can't be placed without violating constraints. Find alternatives from the vocabulary palette.

### Step 4: Compile the Constraint Sheet

Before moving to drafting, write a single reference that captures all design decisions:

```
Chandam:     కందం
ప్రాస:       హ
Line starters: అహ- / సహ- / మహ- / బహ-

Line 1: 3 groups × 4 matras = 12 | No యతి | Odd groups ≠ జ
Line 2: 5 groups × 4 matras = 20 | యతి at grp 4 (స↔స) | Grp 3 must be జ or నల | Odd groups ≠ జ
Line 3: 3 groups × 4 matras = 12 | No యతి | Odd groups ≠ జ
Line 4: 5 groups × 4 matras = 20 | యతి at grp 4 (బ↔ప-వర్గ) | Grp 3 must be జ or నల | Odd groups ≠ జ

Key word placement:
- "పరాభవ" (5 matras): place spanning groups 2→3 of line 1
- "ఉగాది" (4 matras): fits one group exactly
- "మదమ్ము" (4 matras): fits one group exactly
```

This sheet becomes your drafting blueprint in Phase 4.

### Output
- Confirmed ప్రాస consonant with line-starter words
- యతి anchor pairs for each line that requires యతి
- Word-group alignment analysis for all key vocabulary
- A complete constraint sheet ready for drafting

---

## Phase 3: Understand the Chandam Rules

**Goal:** Deeply understand the chosen meter's structure and extract ALL constraints — especially meter-specific rules that the engine validates but that aren't obvious from the basic description.

1. **Study the rule definition** - Read the gaNA pattern (sequence of guru/laghu syllables), line count, and syllables per line.
2. **Verify yati and prasa** - Confirm the decisions from Phase 2B match the rule definition.
3. **Extract meter-specific constraints** - These are the hidden rules that cause most validation failures (see below).
4. **Read classical examples** - Study how master poets handled yati transitions and ప్రాస placement.

### Tools to Use

- **`get_rule_info`** with examples enabled:
  ```
  get_rule_info(rule_identifier="utpalamaala", include_examples=true)
  ```
- **`get_examples`** for additional examples with author attributions:
  ```
  get_examples(rule_identifier="utpalamaala", max_examples=5)
  ```

### Meter-Specific Constraints to Extract

Run `get_rule_info` and look for these constraints. They are NOT always obvious from the basic description but the validation engine WILL check them:

| Constraint | Applies To | What It Means | Validation Error Type |
|------------|-----------|---------------|----------------------|
| **OddNonJa** | కందం, other జాతి | Odd-positioned గణాలు (1st, 3rd, 5th within a line) must NOT be జ (|U|) | `OddNonJa` |
| **Sixth rule** | కందం even lines | The 3rd గణం in even lines (6th overall from the odd+even pair) must be జ or నల only | `Sixth` |
| **GCount** | All meters | Each line must have exactly the specified number of గణాలు | `GCount` |
| **Weight** | జాతి meters | Each గణం must have exactly the specified matra count (typically 4) | `Weight` |
| **Character count** | వృత్తం meters | Each line must have exactly N syllables (e.g., 20 for ఉత్పలమాల) | `Weight` or `GCount` |

**Action:** After reading the rule info, update your constraint sheet from Phase 2B Step 4 to include any meter-specific constraints discovered here.

### Output
- A cheat sheet: gaNA pattern, line structure, yati position, prasa rule
- Meter-specific constraints added to the constraint sheet
- 2-3 annotated examples showing how the rules apply in practice — pay special attention to how examples handle యతి transitions

---

## Phase 4: Draft

**Goal:** Compose the first draft of the padyam.

1. **Write line by line**, keeping the gaNA pattern in mind.
2. **Prioritize meaning and flow** - Get the poetry right first; syllable adjustments come next.
3. **Apply yati and prasa** as you write, using the cheat sheet from Phase 3.
4. **Use the vocabulary palette** from Phase 2 to swap words for better metrical fit.

### Guidelines
- **Draft యతి lines first** (even lines in కందం). These are the most constrained — write them before the free lines.
- **Use the constraint sheet** from Phase 2B as your blueprint. Check each group's matra count as you write.
- **Validate early.** Don't write all 4 lines blind. After drafting 2 lines, run `try_match_chandam` to catch issues before they compound.
- Mark lines you're unsure about for revision in Phase 6.
- Aim for a complete draft, even if imperfect.

### Output
- A full first draft of the padyam

---

## Phase 5: Validate

**Goal:** Check the draft against the target chandam and get a concrete score.

### Tools to Use

- **`try_match_chandam`** - Test the draft against the specific chosen meter:
  ```
  try_match_chandam(
    poem_text="<your padyam text>",
    rule_identifier="utpalamaala",
    match_yati=true,
    match_prasa=true
  )
  ```

### What to Review in Results
- **Overall match score** - How closely does the poem follow the meter?
- **Per-line results** - Which lines match and which don't?
- **Yati compliance** - Are pauses at the correct positions?
- **Prasa compliance** - Do the rhyme patterns hold?

### Output
- Match score and detailed per-line breakdown
- A list of lines that need revision, with specific issues noted

---

## Phase 6: Iterate

**Goal:** Revise problem lines and re-validate until the score is strong.

### Error Interpretation Guide

The validation engine returns specific error types. Use this table to diagnose and fix issues:

| Error Type | Meaning | Fix Strategy |
|------------|---------|-------------|
| `Weight` | A గణం has wrong matra count | Add/remove syllables, swap guru↔laghu words, or shift a word to an adjacent group |
| `Yati` | Letter at యతి position doesn't match line start | Restructure so the right letter falls at యతి position. Check sandhi effects. Refer to Phase 2B యతి anchor pairs |
| `OddNonJa` | Odd-positioned గణం is జ (laghu-guru-laghu / |U|) | Rearrange the group so it becomes భ (U||), స (||U), నల (||||), or గగ (UU) |
| `Sixth` | Even-line 3rd group isn't జ or నల | Force that specific group to be |U| or |||| pattern |
| `GCount` | Wrong number of groups in the line | Line is too long or short — add/remove matras to hit the target |
| `Prasa` | 2nd syllable consonant doesn't match | Change the starting word of the offending line |

### Process
1. **Classify the error** — Is it an incremental fix (Weight, Yati) or a structural problem (Prasa, GCount)?
2. **For incremental fixes:** Swap words, rearrange phrases, or adjust sandhi to fix the specific line.
3. **For structural problems:** Consider looping back to Phase 2B to change ప్రాస or యతి anchors. This is a reset — expect temporary score regression.
4. **Re-run validation** using `try_match_chandam` after each round of changes.
5. **If score regresses**, revert the change immediately and try a different approach.
6. **Repeat** for a reasonable number of rounds.

### Stopping Criteria
- **Stop when:** The score is clear and strong (high match percentage, yati and prasa pass).
- **Also stop when:** You've done 3-5 rounds and further changes would compromise the poem's meaning or beauty.
- **Never sacrifice quality for score.** A poem with minor metrical liberty but powerful meaning is better than a metrically perfect but lifeless verse.

### Output
- Revised padyam after each iteration
- Corresponding match scores showing improvement

---

## Phase 7: Final Result

**Goal:** Present the finished padyam with a complete summary.

### Deliverables

1. **The final padyam** - Clean text, properly formatted.
2. **Summary table:**

   | Item              | Detail                        |
   |-------------------|-------------------------------|
   | Chandam           | Name of the meter used        |
   | Language          | te / sa / kn / etc.           |
   | Match Score       | Final percentage              |
   | Yati              | Pass / Fail (with notes)      |
   | Prasa             | Pass / Fail (with notes)      |
   | Iterations        | Number of revision rounds     |

3. **Notes on deviations** - If any intentional metrical liberties were taken, explain the poetic justification.
4. **Verdict** - Is the padyam ready, or does it need further expert review?

### Save Results

Save each run to **`results/<YYYY-MM-DD>T<HH-MM-SS>.md`** using the current date-time. This preserves a history of all composition attempts.

```
results/
  2026-03-17T14-30-00.md    ← first attempt
  2026-03-17T15-45-12.md    ← second attempt, different theme
  2026-03-18T09-00-00.md    ← next day
```

Create the `results/` directory if it doesn't exist. Use the format `YYYY-MM-DDTHH-MM-SS` (hyphens instead of colons for filesystem safety).

Each file should follow this structure:

```markdown
# Padyam Results — <YYYY-MM-DD>T<HH-MM-SS>

## Theme
<One-line theme description>

## Chandam
<Name of the chosen meter>

## Final Padyam
<The final poem text>

## Design Constraints (from Phase 2B)
| Constraint | Decision |
|------------|----------|
| ప్రాస       | <consonant and line starters> |
| యతి        | <anchor pairs per line> |
| Key words  | <word-group alignment notes> |

## Score Summary
| Item              | Detail                        |
|-------------------|-------------------------------|
| Chandam           | ...                           |
| Language          | ...                           |
| Match Score       | ...                           |
| Yati              | Pass / Fail (with notes)      |
| Prasa             | Pass / Fail (with notes)      |
| Iterations        | ...                           |

## Iteration History
| Round | Key Changes Made                  | Score |
|-------|-----------------------------------|-------|
| 1     | Initial draft                     | ...   |
| 2     | Fixed lines X, Y                  | ...   |
| ...   | ...                               | ...   |

## Deviations & Notes
<Any intentional metrical liberties and their justification>

## Verdict
<Final assessment: Ready / Needs expert review>
```

Each file serves as a persistent, timestamped record of one composition session and its outcome.

---

## Appendix: GaNA Classification Reference

Understanding how syllable groups (gaNAlu) are classified is fundamental to working with any chandam. The engine categorizes syllable patterns into types based on their weight.

### Basic Syllable Units

| Telugu Symbol | Binary Pattern | Name | Description |
|---------------|----------------|------|-------------|
| గ | `U` | **Guruvu** (guru) | Heavy/long syllable |
| ల | `\|` | **Laghuvu** (laghu) | Light/short syllable |

### GaNA Symbol Mapping

Each Telugu letter in a chandam rule represents a specific pattern of guru (U) and laghu (|) syllables. This is the core alphabet of Telugu prosody.

#### Tri-syllable GaNAs (3 aksharas each)

These are the 8 fundamental gaNAs. Every chandam rule is built from combinations of these.

| Telugu Symbol | Name | Binary Pattern | Mnemonic |
|---------------|------|----------------|----------|
| న | na-gaNamu | `\|\|\|` | all light |
| స | sa-gaNamu | `\|\|U` | light-light-heavy |
| య | ya-gaNamu | `\|UU` | light-heavy-heavy |
| జ | ja-gaNamu | `\|U\|` | light-heavy-light |
| భ | bha-gaNamu | `U\|\|` | heavy-light-light |
| ర | ra-gaNamu | `U\|U` | heavy-light-heavy |
| త | ta-gaNamu | `UU\|` | heavy-heavy-light |
| మ | ma-gaNamu | `UUU` | all heavy |

#### Sub-units (1-2 aksharas)

| Telugu Symbol | Binary Pattern | Description |
|---------------|----------------|-------------|
| గ | `U` | Single guru |
| ల | `\|` | Single laghu |
| వ | `\|U` | laghu + guru (2 syllables) |
| హ | `U\|` | guru + laghu (2 syllables) |
| గా | `UU` | Two gurus |
| లల | `\|\|` | Two laghus |

#### Compound GaNAs (4 syllables) - Indra class

| Telugu Symbol | Name | Binary Pattern | Derivation |
|---------------|------|----------------|------------|
| నల | nala-gaNamu | `\|\|\|\|` | న + ల (na + laghu) |
| నగ | naga-gaNamu | `\|\|\|U` | న + గ (na + guru) |
| సల | sala-gaNamu | `\|\|U\|` | స + ల (sa + laghu) |

#### Compound GaNAs (5 syllables) - Chandra class

| Telugu Symbol | Name | Binary Pattern | Derivation |
|---------------|------|----------------|------------|
| నగగ | nagaga-gaNamu | `\|\|\|UU` | న + గా (na + two gurus) |
| నహ | naha-gaNamu | `\|\|\|U\|` | న + హ (na + ha) |
| సలల | salala-gaNamu | `\|\|U\|\|` | స + లల (sa + two laghus) |
| భల | bhala-gaNamu | `U\|\|\|` | భ + ల (bha + laghu) |
| భగురు | bhaguru-gaNamu | `U\|\|U` | భ + గ (bha + guru) |
| మలఘు | malaghu-gaNamu | `UUU\|` | మ + ల (ma + laghu) |
| సవ | sava-gaNamu | `\|\|U\|U` | స + వ reversed / స + హ variant |
| సహ | saha-gaNamu | `\|\|UU\|` | స + హ with guru |
| తల | tala-gaNamu | `UU\|\|` | త + ల (ta + laghu) |
| రల | rala-gaNamu | `U\|U\|` | ర + ల (ra + laghu) |
| నవ | nava-gaNamu | `\|\|\|\|U` | నల + గ (nala + guru) |
| నలల | nalala-gaNamu | `\|\|\|\|\|` | నల + ల (nala + laghu) |
| రగురు | raguru-gaNamu | `U\|UU` | ర + గ (ra + guru) |
| తగ | taga-gaNamu | `UU\|U` | త + గ (ta + guru) |

### Reading a Chandam Rule Pattern

When a chandam rule says the pattern is `భ ర న భ భ ర ల గ`, expand it using the table above:

```
భ  = U||
ర  = U|U
న  = |||
భ  = U||
భ  = U||
ర  = U|U
ల  = |
గ  = U
```

Full line pattern: `U|| U|U ||| U|| U|| U|U | U` (20 syllables per line)

Multi-character symbols in rules are read left to right. For example, `నగగ` is a single 5-syllable gaNa (`|||UU`), not three separate symbols.

### GaNA Categories

Syllable groups are classified into categories that determine **yati compatibility**. Two gaNAs at a yati boundary must belong to the same category for yati to be valid.

#### Surya (సూర్య) - Solar

| GaNAs | Patterns |
|-------|----------|
| హ (ha) | `U\|` |
| న (na) | `\|\|\|` |
| Raw patterns | `U\|`, `\|\|\|` |

#### Indra (ఇంద్ర) - Balanced

| GaNAs | Patterns |
|-------|----------|
| భ, ర, త | `U\|\|`, `U\|U`, `UU\|` |
| నల, నగ, సల | `\|\|\|\|`, `\|\|\|U`, `\|\|U\|` |
| Raw 4-syllable patterns | `\|\|\|\|`, `\|\|\|U`, `\|\|U\|`, `U\|\|`, `U\|U`, `UU\|` |

#### Chandra (చంద్ర) - Lunar

| GaNAs | Patterns |
|-------|----------|
| నగగ, నహ, సలల, భల, భగురు, మలఘు | 5-syllable compounds |
| సవ, సహ, తల, రల, నవ, నలల, రగురు, తగ | 5-syllable compounds |
| Raw 5-syllable patterns | `\|\|\|UU`, `\|\|\|U\|`, `\|\|U\|\|`, `U\|\|\|`, `U\|\|U`, `UUU\|`, etc. |

### SubCategories

Some gaNAs have further sub-classification:

| Pattern | Telugu Name | SubCategory |
|---------|-------------|-------------|
| `\|\|\|` | న (na) | **LaghuSurya** - All-laghu surya group |
| `\|\|\|\|\|` | నలల (nalala) | **Laghu5** - Five consecutive laghus |

### How This Applies to Writing

1. **During Phase 3** - When studying a chandam's rule, the gaNA pattern tells you the exact sequence of these groups each line must follow. For example, a rule might require: `భ ర న భ భ ర ల గ` - meaning bhagaNa, ragaNa, nagaNa, bhagaNa, bhagaNa, ragaNa, laghuvu, guruvu in sequence.

2. **During Phase 4** - When drafting, think of each word's syllable weight. Telugu vowels like ఆ, ఈ, ఊ, ఏ, ఐ, ఓ, ఔ are guru (long). Short vowels అ, ఇ, ఉ, ఋ are laghu (short). A consonant followed by a conjunct also makes the preceding syllable guru.

3. **During Phase 6** - When fixing mismatches, the category system helps with yati. If the engine reports a yati failure, check that the gaNAs at the yati boundary belong to the same category (both Surya, both Indra, or both Chandra).

---

## Quick Tool Reference

| Tool                   | Purpose                                    | When to Use                        |
|------------------------|--------------------------------------------|------------------------------------|
| `list_rules`           | Browse all available meters                | Phase 1: choosing a chandam        |
| `get_rule_info`        | Detailed meter rules and pattern           | Phase 1 & 3: understanding meters  |
| `get_examples`         | Classical example poems                    | Phase 3: studying the form         |
| `get_word_meaning`     | Telugu dictionary lookup (multi-source)    | Phase 2: word exploration (sparse) |
| `try_match_chandam`    | Validate poem against a specific meter     | Phase 5 & 6: scoring and iteration |
| `determine_chandam`    | Auto-detect the meter of a poem            | Ad-hoc: if meter is unknown        |
| `calculate_scores`     | Score against all meters (ranked)          | Ad-hoc: exploring best-fit meters  |
