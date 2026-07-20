import fs from 'fs';
import sharp from 'sharp';

const svgWidth = 1024;
const svgHeight = 1024;

const svgData = `
<svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0f172a;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1e293b;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#2563eb;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- Background Circle (For standard logo) -->
  <circle cx="512" cy="512" r="512" fill="url(#grad1)" />

  <!-- Abstract Bird/Eagle Shape for 'Shaheen' -->
  <path d="M512 250 Q 700 150, 850 350 Q 650 400, 512 600 Q 374 400, 174 350 Q 324 150, 512 250 Z" fill="url(#grad2)" />
  <path d="M512 400 Q 600 450, 650 600 Q 512 800, 374 600 Q 424 450, 512 400 Z" fill="#60a5fa" opacity="0.8" />

  <!-- Text -->
  <text x="512" y="750" font-family="Arial, Helvetica, sans-serif" font-size="85" font-weight="bold" text-anchor="middle" fill="#ffffff" letter-spacing="2">SHAHEEN</text>
  <text x="512" y="830" font-family="Arial, Helvetica, sans-serif" font-size="50" font-weight="bold" text-anchor="middle" fill="#94a3b8" letter-spacing="5">GLOBAL TRADERS</text>
</svg>
`;

const transparentSvgData = `
<svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#2563eb;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <path d="M512 250 Q 700 150, 850 350 Q 650 400, 512 600 Q 374 400, 174 350 Q 324 150, 512 250 Z" fill="url(#grad2)" />
  <path d="M512 400 Q 600 450, 650 600 Q 512 800, 374 600 Q 424 450, 512 400 Z" fill="#60a5fa" opacity="0.8" />

  <text x="512" y="750" font-family="Arial, Helvetica, sans-serif" font-size="85" font-weight="bold" text-anchor="middle" fill="#0f172a" letter-spacing="2">SHAHEEN</text>
  <text x="512" y="830" font-family="Arial, Helvetica, sans-serif" font-size="50" font-weight="bold" text-anchor="middle" fill="#475569" letter-spacing="5">GLOBAL TRADERS</text>
</svg>
`;

async function generateLogos() {
  try {
    // Generate standard logo (with background)
    await sharp(Buffer.from(svgData))
      .png()
      .toFile('public/logo.png');
    
    console.log('Successfully generated public/logo.png');

    // Generate transparent logo
    await sharp(Buffer.from(transparentSvgData))
      .png()
      .toFile('public/logo_transparent.png');
      
    console.log('Successfully generated public/logo_transparent.png');
  } catch (error) {
    console.error('Error generating logos:', error);
  }
}

generateLogos();
