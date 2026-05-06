import * as fs from 'fs';
import * as path from 'path';
import { computeKeyframes, CIRCLES_CONFIG, SQUARES_CONFIG, TELUGU_CONFIG } from './utils/svg-keyframes';
import { generateSVG, generatePreviewHTML } from './utils/svg-template';

const OUTPUT_DIR = path.resolve(__dirname, '../../Chandam.Wasm/wwwroot/branding');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log('Computing keyframes for Circles...');
const circlesKeyframes = computeKeyframes(CIRCLES_CONFIG);
const circlesSVG = generateSVG(circlesKeyframes, CIRCLES_CONFIG);

console.log('Computing keyframes for Squares...');
const squaresKeyframes = computeKeyframes(SQUARES_CONFIG);
const squaresSVG = generateSVG(squaresKeyframes, SQUARES_CONFIG);

console.log('Computing keyframes for Telugu...');
const teluguKeyframes = computeKeyframes(TELUGU_CONFIG);
const teluguSVG = generateSVG(teluguKeyframes, TELUGU_CONFIG);

console.log('Writing SVG files...');
fs.writeFileSync(path.join(OUTPUT_DIR, 'chandam-circles.svg'), circlesSVG);
fs.writeFileSync(path.join(OUTPUT_DIR, 'chandam-squares.svg'), squaresSVG);
fs.writeFileSync(path.join(OUTPUT_DIR, 'chandam-telugu.svg'), teluguSVG);

console.log('Generating preview page...');
const previewHTML = generatePreviewHTML(circlesSVG, squaresSVG, teluguSVG);
fs.writeFileSync(path.join(OUTPUT_DIR, 'preview.html'), previewHTML);

console.log(`Done! Output written to: ${OUTPUT_DIR}`);
console.log('  - chandam-circles.svg');
console.log('  - chandam-squares.svg');
console.log('  - chandam-telugu.svg');
console.log('  - preview.html');
