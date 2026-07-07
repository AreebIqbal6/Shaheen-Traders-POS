import sharp from 'sharp';

const generateIcons = async () => {
  const sizes = [192, 512];
  for (const size of sizes) {
    await sharp('./public/favicon.svg')
      .resize(size, size)
      .png()
      .toFile(`./public/pwa-${size}x${size}.png`);
    console.log(`Generated pwa-${size}x${size}.png`);
  }
};

generateIcons();
