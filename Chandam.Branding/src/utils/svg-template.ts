import { KeyframePoint, ShapeConfig } from './svg-keyframes';

const TOTAL_DURATION = 26;
const ACTOR_COUNT = 6;

function formatPercent(p: number): string {
  return p.toFixed(3).replace(/\.?0+$/, '');
}

function generateCircleKeyframesCSS(keyframes: KeyframePoint[], actorIndex: number, prefix: string): string {
  const lines: string[] = [];
  lines.push(`  @keyframes ${prefix}${actorIndex} {`);

  for (const kf of keyframes) {
    const actor = kf.actors[actorIndex];
    const percent = formatPercent(kf.percent);
    const r = Math.min(actor.width, actor.height) / 2;
    lines.push(`    ${percent}% { cx: ${actor.x.toFixed(1)}px; cy: ${actor.y.toFixed(1)}px; r: ${r.toFixed(1)}px; fill: ${actor.color}; opacity: ${actor.opacity.toFixed(3)}; }`);
  }

  lines.push(`  }`);
  return lines.join('\n');
}

function generateRectKeyframesCSS(keyframes: KeyframePoint[], actorIndex: number, prefix: string): string {
  const lines: string[] = [];
  lines.push(`  @keyframes ${prefix}${actorIndex} {`);

  for (const kf of keyframes) {
    const actor = kf.actors[actorIndex];
    const percent = formatPercent(kf.percent);
    const x = actor.x - actor.width / 2;
    const y = actor.y - actor.height / 2;
    const rx = actor.rx ?? 4;
    lines.push(`    ${percent}% { x: ${x.toFixed(1)}px; y: ${y.toFixed(1)}px; width: ${actor.width.toFixed(1)}px; height: ${actor.height.toFixed(1)}px; rx: ${rx}px; fill: ${actor.color}; opacity: ${actor.opacity.toFixed(3)}; }`);
  }

  lines.push(`  }`);
  return lines.join('\n');
}

function generateTeluguKeyframesCSS(keyframes: KeyframePoint[], actorIndex: number, prefix: string): string {
  const lines: string[] = [];
  lines.push(`  @keyframes ${prefix}${actorIndex} {`);

  for (const kf of keyframes) {
    const actor = kf.actors[actorIndex];
    const percent = formatPercent(kf.percent);
    const x = actor.x - actor.width / 2;
    const y = actor.y - actor.height / 2;
    const isCircle = actor.width === actor.height;
    const rx = isCircle ? actor.width / 2 : (actor.rx ?? actor.height / 2);
    lines.push(`    ${percent}% { x: ${x.toFixed(1)}px; y: ${y.toFixed(1)}px; width: ${actor.width.toFixed(1)}px; height: ${actor.height.toFixed(1)}px; rx: ${rx.toFixed(1)}px; fill: ${actor.color}; opacity: ${actor.opacity.toFixed(3)}; }`);
  }

  lines.push(`  }`);
  return lines.join('\n');
}

function generateCircleSVG(keyframes: KeyframePoint[], prefix: string): string {
  const lines: string[] = [];

  lines.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">`);
  lines.push(`<style>`);
  lines.push(`  .actor { animation-duration: ${TOTAL_DURATION}s; animation-iteration-count: infinite; animation-timing-function: linear; }`);
  for (let i = 0; i < ACTOR_COUNT; i++) {
    lines.push(`  .${prefix}${i} { animation-name: ${prefix}${i}; }`);
  }
  for (let i = 0; i < ACTOR_COUNT; i++) {
    lines.push(generateCircleKeyframesCSS(keyframes, i, prefix));
  }
  lines.push(`</style>`);

  const initActors = keyframes[0].actors;
  for (let i = 0; i < ACTOR_COUNT; i++) {
    const a = initActors[i];
    const r = Math.min(a.width, a.height) / 2;
    lines.push(`<circle class="actor ${prefix}${i}" cx="${a.x.toFixed(1)}" cy="${a.y.toFixed(1)}" r="${r.toFixed(1)}" fill="${a.color}" opacity="${a.opacity.toFixed(3)}"/>`);
  }

  lines.push(`</svg>`);
  return lines.join('\n');
}

function generateSquaresSVG(keyframes: KeyframePoint[], prefix: string): string {
  const lines: string[] = [];

  lines.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">`);
  lines.push(`<style>`);
  lines.push(`  .actor { animation-duration: ${TOTAL_DURATION}s; animation-iteration-count: infinite; animation-timing-function: linear; }`);
  for (let i = 0; i < ACTOR_COUNT; i++) {
    lines.push(`  .${prefix}${i} { animation-name: ${prefix}${i}; }`);
  }
  for (let i = 0; i < ACTOR_COUNT; i++) {
    lines.push(generateRectKeyframesCSS(keyframes, i, prefix));
  }
  lines.push(`</style>`);

  const initActors = keyframes[0].actors;
  for (let i = 0; i < ACTOR_COUNT; i++) {
    const a = initActors[i];
    const x = a.x - a.width / 2;
    const y = a.y - a.height / 2;
    const rx = a.rx ?? 4;
    lines.push(`<rect class="actor ${prefix}${i}" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${a.width.toFixed(1)}" height="${a.height.toFixed(1)}" rx="${rx}" fill="${a.color}" opacity="${a.opacity.toFixed(3)}"/>`);
  }

  lines.push(`</svg>`);
  return lines.join('\n');
}

function generateTeluguSVG(keyframes: KeyframePoint[], prefix: string): string {
  const lines: string[] = [];

  lines.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">`);
  lines.push(`<style>`);
  lines.push(`  .actor { animation-duration: ${TOTAL_DURATION}s; animation-iteration-count: infinite; animation-timing-function: linear; }`);
  for (let i = 0; i < ACTOR_COUNT; i++) {
    lines.push(`  .${prefix}${i} { animation-name: ${prefix}${i}; }`);
  }
  for (let i = 0; i < ACTOR_COUNT; i++) {
    lines.push(generateTeluguKeyframesCSS(keyframes, i, prefix));
  }
  lines.push(`</style>`);

  const initActors = keyframes[0].actors;
  for (let i = 0; i < ACTOR_COUNT; i++) {
    const a = initActors[i];
    const x = a.x - a.width / 2;
    const y = a.y - a.height / 2;
    const isCircle = a.width === a.height;
    const rx = isCircle ? a.width / 2 : (a.rx ?? a.height / 2);
    lines.push(`<rect class="actor ${prefix}${i}" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${a.width.toFixed(1)}" height="${a.height.toFixed(1)}" rx="${rx.toFixed(1)}" fill="${a.color}" opacity="${a.opacity.toFixed(3)}"/>`);
  }

  lines.push(`</svg>`);
  return lines.join('\n');
}

export function generateSVG(keyframes: KeyframePoint[], config: ShapeConfig): string {
  switch (config.variant) {
    case 'circles': return generateCircleSVG(keyframes, 'c');
    case 'squares': return generateSquaresSVG(keyframes, 's');
    case 'telugu': return generateTeluguSVG(keyframes, 't');
  }
}

export function generatePreviewHTML(
  circlesSVG: string,
  squaresSVG: string,
  teluguSVG: string
): string {
  return `<!DOCTYPE html>
<html lang="te">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Chandam Icon Variants</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Telugu:wght@400;500;700&display=swap" rel="stylesheet">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: 'Noto Sans Telugu', sans-serif;
  background: #faf8f5;
  color: #1a1a1a;
  line-height: 1.6;
}

.page-header {
  padding: 24px 32px;
  border-bottom: 1px solid #d4cfc8;
}

.page-header h1 {
  font-size: 1.25rem;
  font-weight: 500;
  color: #1a3a5c;
}

section {
  padding: 32px;
}

.section-label {
  font-size: 0.85rem;
  font-weight: 500;
  color: #5c5c5c;
  letter-spacing: 0.02em;
  margin-bottom: 16px;
}

.showcase {
  display: flex;
  gap: 48px;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
}

.variant {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.variant svg, .variant object {
  width: var(--icon-size, 128px);
  height: var(--icon-size, 128px);
  transition: width 0.3s ease-out, height 0.3s ease-out;
}

.variant-label {
  font-size: 0.9rem;
  color: #5c5c5c;
}

.size-presets {
  display: flex;
  gap: 8px;
  justify-content: center;
  padding: 24px 32px;
  border-top: 1px solid #e8e4de;
  border-bottom: 1px solid #e8e4de;
}

.size-btn {
  font-family: 'Noto Sans Telugu', sans-serif;
  font-size: 0.85rem;
  padding: 6px 14px;
  border: 1px solid #d4cfc8;
  border-radius: 3px;
  background: #ffffff;
  color: #1a3a5c;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}

.size-btn:hover {
  background: #f4f1ec;
  border-color: #1a3a5c;
}

.size-btn.active {
  background: #1a3a5c;
  color: #f5f3f0;
  border-color: #1a3a5c;
}

.context-dark {
  background: #1a1a1a;
  border-radius: 6px;
  padding: 24px 32px;
  margin-bottom: 24px;
}

.context-dark .section-label {
  color: #a0a0a0;
}

.context-row {
  display: flex;
  gap: 48px;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
}

.context-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.context-item object {
  width: 40px;
  height: 40px;
}

.context-item .brand-text {
  font-size: 1.25rem;
  font-weight: 400;
}

.context-dark .brand-text {
  color: #f5f3f0;
}

.context-light {
  background: #faf8f5;
  border: 1px solid #d4cfc8;
  border-radius: 6px;
  padding: 24px 32px;
}

.context-light .context-item object {
  width: 64px;
  height: 64px;
}

.context-light .brand-text {
  font-size: 1.5rem;
  color: #1a3a5c;
}

.favicon-row {
  display: flex;
  gap: 32px;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
}

.favicon-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.favicon-pair {
  display: flex;
  gap: 12px;
  align-items: center;
}

.favicon-dark {
  background: #1a1a1a;
  padding: 8px;
  border-radius: 3px;
}

.favicon-light {
  background: #faf8f5;
  border: 1px solid #d4cfc8;
  padding: 8px;
  border-radius: 3px;
}

.favicon-pair object {
  display: block;
}

.favicon-label {
  font-size: 0.75rem;
  color: #5c5c5c;
}
</style>
</head>
<body>

<header class="page-header">
  <h1>Chandam Icon Variants</h1>
</header>

<section>
  <div class="section-label">Main Showcase</div>
  <div class="showcase" id="showcase">
    <div class="variant">
      ${circlesSVG}
      <span class="variant-label">వృత్తాలు (Circles)</span>
    </div>
    <div class="variant">
      ${squaresSVG}
      <span class="variant-label">చతురస్రాలు (Squares)</span>
    </div>
    <div class="variant">
      ${teluguSVG}
      <span class="variant-label">తెలుగు (Telugu)</span>
    </div>
  </div>
</section>

<div class="size-presets">
  <button class="size-btn" data-size="16">16px</button>
  <button class="size-btn" data-size="32">32px</button>
  <button class="size-btn" data-size="64">64px</button>
  <button class="size-btn active" data-size="128">128px</button>
  <button class="size-btn" data-size="256">256px</button>
  <button class="size-btn" data-size="512">512px</button>
</div>

<section>
  <div class="section-label">In Context</div>

  <div class="context-dark">
    <div class="section-label">Dark Header</div>
    <div class="context-row">
      <div class="context-item">
        <object type="image/svg+xml" data="chandam-circles.svg"></object>
        <span class="brand-text">ఛందం</span>
      </div>
      <div class="context-item">
        <object type="image/svg+xml" data="chandam-squares.svg"></object>
        <span class="brand-text">ఛందం</span>
      </div>
      <div class="context-item">
        <object type="image/svg+xml" data="chandam-telugu.svg"></object>
        <span class="brand-text">ఛందం</span>
      </div>
    </div>
  </div>

  <div class="context-light">
    <div class="section-label">Light Page</div>
    <div class="context-row">
      <div class="context-item">
        <object type="image/svg+xml" data="chandam-circles.svg"></object>
        <span class="brand-text">ఛందం</span>
      </div>
      <div class="context-item">
        <object type="image/svg+xml" data="chandam-squares.svg"></object>
        <span class="brand-text">ఛందం</span>
      </div>
      <div class="context-item">
        <object type="image/svg+xml" data="chandam-telugu.svg"></object>
        <span class="brand-text">ఛందం</span>
      </div>
    </div>
  </div>
</section>

<section>
  <div class="section-label">Favicon Sizes</div>
  <div class="favicon-row">
    <div class="favicon-group">
      <div class="favicon-pair">
        <div class="favicon-dark"><object type="image/svg+xml" data="chandam-circles.svg" style="width:32px;height:32px"></object></div>
        <div class="favicon-light"><object type="image/svg+xml" data="chandam-circles.svg" style="width:32px;height:32px"></object></div>
        <div class="favicon-dark"><object type="image/svg+xml" data="chandam-circles.svg" style="width:16px;height:16px"></object></div>
        <div class="favicon-light"><object type="image/svg+xml" data="chandam-circles.svg" style="width:16px;height:16px"></object></div>
      </div>
      <span class="favicon-label">Circles</span>
    </div>
    <div class="favicon-group">
      <div class="favicon-pair">
        <div class="favicon-dark"><object type="image/svg+xml" data="chandam-squares.svg" style="width:32px;height:32px"></object></div>
        <div class="favicon-light"><object type="image/svg+xml" data="chandam-squares.svg" style="width:32px;height:32px"></object></div>
        <div class="favicon-dark"><object type="image/svg+xml" data="chandam-squares.svg" style="width:16px;height:16px"></object></div>
        <div class="favicon-light"><object type="image/svg+xml" data="chandam-squares.svg" style="width:16px;height:16px"></object></div>
      </div>
      <span class="favicon-label">Squares</span>
    </div>
    <div class="favicon-group">
      <div class="favicon-pair">
        <div class="favicon-dark"><object type="image/svg+xml" data="chandam-telugu.svg" style="width:32px;height:32px"></object></div>
        <div class="favicon-light"><object type="image/svg+xml" data="chandam-telugu.svg" style="width:32px;height:32px"></object></div>
        <div class="favicon-dark"><object type="image/svg+xml" data="chandam-telugu.svg" style="width:16px;height:16px"></object></div>
        <div class="favicon-light"><object type="image/svg+xml" data="chandam-telugu.svg" style="width:16px;height:16px"></object></div>
      </div>
      <span class="favicon-label">Telugu</span>
    </div>
  </div>
</section>

<script>
const buttons = document.querySelectorAll('.size-btn');
const showcase = document.getElementById('showcase');

buttons.forEach(btn => {
  btn.addEventListener('click', () => {
    buttons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    showcase.style.setProperty('--icon-size', btn.dataset.size + 'px');
  });
});
</script>

</body>
</html>`;
}
