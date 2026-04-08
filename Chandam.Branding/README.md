# Chandam.Branding

> Animated brand icons for the Chandam (ఛందం) project

## Overview

This project contains animated GIF assets that visualize the core concept of Telugu/Sanskrit prosody: combinations of **laghu (1)** and **guru (2)** syllabic units. The animations show all 13 unique ways to sum to 6 using these units.

## What Was Created

Three animated GIF variants showing different ways to sum 6 using combinations of 1 (laghu) and 2 (guru):

### 1. Minimalist Circles (`chandam-icon-circles.gif`) - 64 KB
- Small blue circles for 1 (laghu)
- Large orange circles for 2 (guru)
- Clean, modern look
- **Recommended for general use**

### 2. Rounded Squares (`chandam-icon-squares.gif`) - 52 KB (smallest!)
- Small blue squares for 1
- Large orange squares for 2
- Geometric, contemporary feel
- Most compact file size

### 3. Telugu-Inspired (`chandam-icon-telugu.gif`) - 55 KB
- Blue dots for 1 (laghu)
- Orange vertical lines for 2 (guru)
- Traditional manuscript style
- Cultural authenticity

## Animation Features

✅ **Biological transitions**: Cell-like splitting and merging with organic spring physics  
✅ **Progressive order**: Starts with all small (1,1,1,1,1,1) → ends with all big (2,2,2)  
✅ **Squash & stretch**: Natural deformation mimicking biological cells  
✅ **Color coding**: Blue (#3B82F6) for laghu, Amber (#F59E0B) for guru  
✅ **Smooth 26-second loop**: 13 unique combinations at 30 FPS  
✅ **Web-optimized**: All under 70KB for fast loading  
✅ **128×128px**: Perfect for favicon and brand icons

## Installation

The GIFs have been copied to:
```
../Chandam.Wasm/wwwroot/images/
├── chandam-icon-circles.gif
├── chandam-icon-squares.gif
└── chandam-icon-telugu.gif
```

The favicon has been updated in `../Chandam.Wasm/wwwroot/index.html` to use the circles variant.

## Preview

Open `out/preview.html` in a browser to see all three variants side by side.

## Usage Options

### As Favicon
```html
<link rel="icon" type="image/gif" href="/images/chandam-icon-circles.gif" />
```

### As Logo
```html
<img src="/images/chandam-icon-circles.gif" alt="Chandam" width="128" height="128" />
```

### In CSS
```css
background-image: url('/images/chandam-icon-circles.gif');
```

## Technical Details

- **Dimensions**: 128×128px
- **Format**: Animated GIF
- **Frames**: 765 (26 seconds at 30 FPS)
- **Loop**: Infinite
- **Total combinations**: 13 ways to sum to 6 using 1s and 2s

## Development

### Project Structure
```
src/
├── Root.tsx                  # Composition definitions
├── ChandamIconCircles.tsx    # Circles variant
├── ChandamIconSquares.tsx    # Squares variant
├── ChandamIconTelugu.tsx     # Telugu variant
└── utils/
    ├── combinations.ts       # Generate 13 combinations
    ├── animations.ts         # Position calculations
    └── transitions.ts        # Transition analysis
```

### Commands
```bash
# Preview
npm run dev

# Render GIFs
npx remotion render src/index.ts ChandamIconCircles out/chandam-icon-circles.gif --codec gif
npx remotion render src/index.ts ChandamIconSquares out/chandam-icon-squares.gif --codec gif
npx remotion render src/index.ts ChandamIconTelugu out/chandam-icon-telugu.gif --codec gif

# Render different sizes
npx remotion render src/index.ts ChandamIconCircles out/icon-256.gif --codec gif --width 256 --height 256
npx remotion render src/index.ts ChandamIconCircles out/icon-64.gif --codec gif --width 64 --height 64 --scale 0.5
```

### Customization

Edit constants in component files:
- Dot sizes: `SMALL_DOT_SIZE`, `LARGE_DOT_SIZE`
- Colors: `LAGHU_COLOR`, `GURU_COLOR`
- Timing: `DISPLAY_DURATION`, `TRANSITION_DURATION` in Root.tsx
- Spring physics: `damping`, `mass`, `stiffness` in Transition functions

## Next Steps

1. **Choose your favorite style** from the preview
2. **Generate additional sizes** if needed (64×64, 256×256, 512×512)
3. **Update website** with animated logo in header
4. **Create static fallback** for users with reduced motion preferences
5. **Explore variations**: Different numbers (5, 7, 8), different color schemes

## Color Palette

- **Laghu (1)**: `#3B82F6` - Blue (Chandam brand color)
- **Guru (2)**: `#F59E0B` - Amber/Orange (warm contrast)
- **Background**: White or `#F8FAFC` (light slate)

## Credits

Created with:
- **Remotion** - Video generation in React
- **Claude Code** - AI-powered development
- **Remotion Skills** - Best practices for animation

---

**Concept**: Visualizing the mathematical beauty of Telugu/Sanskrit prosody through laghu-guru combinations summing to 6.
