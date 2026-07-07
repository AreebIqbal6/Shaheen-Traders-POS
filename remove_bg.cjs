const sharp = require('sharp');
const fs = require('fs');

async function removeBg() {
  const input = 'public/logo.png';
  const output = 'public/logo_transparent.png';

  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // If pixel is very bright/white, set alpha to 0
    if (r > 240 && g > 240 && b > 240) {
      data[i + 3] = 0;
    }
  }

  await sharp(data, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4
    }
  }).png().toFile(output);
  
  // replace original
  fs.copyFileSync(output, input);
  fs.unlinkSync(output);
  console.log("Background removed successfully using sharp!");
}

removeBg().catch(console.error);
