const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SVG_PATH = path.resolve(__dirname, '../frontend_web/public/favicon.svg');
const ASSETS_DIR = path.resolve(__dirname, '../movil/assets/images');

fs.mkdirSync(ASSETS_DIR, { recursive: true });

const svgContent = fs.readFileSync(SVG_PATH, 'utf-8');
const foregroundSvg = svgContent.replace(
  '<rect x="0" y="0" width="64" height="64" rx="14" fill="#7c3aed"/>',
  ''
);

async function generate(name, width, height, useForeground = false) {
  const src = useForeground ? foregroundSvg : svgContent;
  const out = path.join(ASSETS_DIR, `${name}.png`);
  await sharp(Buffer.from(src))
    .resize(width, height)
    .png()
    .toFile(out);
  const stat = fs.statSync(out);
  console.log(`  ${name}.png: ${width}x${height} -> ${(stat.size / 1024).toFixed(0)} KB`);
}

(async () => {
  console.log('Generando íconos desde favicon.svg...\n');
  await generate('icon', 1024, 1024);
  await generate('adaptive-icon-foreground', 1024, 1024, true);
  await generate('splash-icon', 1284, 2778);
  console.log('\nTodos los íconos generados correctamente.');
})();
