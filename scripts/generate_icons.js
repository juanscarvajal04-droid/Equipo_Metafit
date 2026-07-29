const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SVG_PATH = path.resolve(__dirname, '../frontend_web/public/favicon.svg');
const ASSETS_DIR = path.resolve(__dirname, '../movil/assets/images');

fs.mkdirSync(ASSETS_DIR, { recursive: true });

async function generateIcon(name, width, height, extraOpts = {}) {
  const out = path.join(ASSETS_DIR, `${name}.png`);
  await sharp(SVG_PATH)
    .resize(width, height)
    .png()
    .toFile(out);
  const stat = fs.statSync(out);
  console.log(`  ${name}.png: ${width}x${height} -> ${(stat.size / 1024).toFixed(0)} KB`);
}

(async () => {
  console.log('Generando íconos desde favicon.svg...\n');

  await generateIcon('icon', 1024, 1024);
  await generateIcon('adaptive-icon-foreground', 1024, 1024);
  await generateIcon('splash-icon', 1284, 2778);

  console.log('\nTodos los íconos generados correctamente.');
})();
