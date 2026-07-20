const sharp = require('sharp');

async function editLogo() {
  const originalLogo = 'public/logo.png';
  const newLogoPath = 'public/logo_edited.png';
  
  // Create an SVG overlay to cover the old text and add new text
  // Assuming 1024x1024 logo. The text is probably at the bottom, e.g., y=800 to 1024.
  // We'll create a white rectangle to cover y=750 to 1024.
  // And draw "Shaheen Global Traders" in a nice font.
  
  const svgOverlay = `
    <svg width="1024" height="1024">
      <!-- White rectangle to cover old text -->
      <rect x="0" y="700" width="1024" height="324" fill="white" />
      
      <!-- New text -->
      <text x="512" y="850" 
            font-family="Arial, Helvetica, sans-serif" 
            font-size="65" 
            font-weight="bold" 
            fill="#1e293b" 
            text-anchor="middle"
            dominant-baseline="middle">
        SHAHEEN GLOBAL TRADERS
      </text>
    </svg>
  `;

  await sharp(originalLogo)
    .composite([
      {
        input: Buffer.from(svgOverlay),
        top: 0,
        left: 0,
      },
    ])
    .png()
    .toFile(newLogoPath);
    
  console.log("Logo edited successfully.");
}

editLogo().catch(console.error);
