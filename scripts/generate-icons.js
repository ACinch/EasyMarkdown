const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, '../assets');
const svgPath = path.join(assetsDir, 'icon.svg');

// Sizes needed for electron-builder
const sizes = [16, 32, 48, 64, 128, 256, 512, 1024];

async function generateIcons() {
  console.log('Generating icons from SVG...');

  const svgBuffer = fs.readFileSync(svgPath);

  // Generate main icon (512x512 for electron-builder)
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(assetsDir, 'icon.png'));
  console.log('Created icon.png (512x512)');

  // Generate 1024x1024 for macOS
  await sharp(svgBuffer)
    .resize(1024, 1024)
    .png()
    .toFile(path.join(assetsDir, 'icon@2x.png'));
  console.log('Created icon@2x.png (1024x1024)');

  // Generate various sizes for Linux
  for (const size of sizes) {
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(path.join(assetsDir, `icon-${size}.png`));
    console.log(`Created icon-${size}.png`);
  }

  console.log('All icons generated successfully!');
}

generateIcons().catch(console.error);
