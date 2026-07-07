const fs = require('fs');
const PNG = require('pngjs').PNG;

const imagePath = 'C:\\Users\\Noman Traders\\.gemini\\antigravity\\brain\\611fb8ae-eb0b-42e8-8ab6-0768780782e2\\uploaded_media_1782585188338.png';

fs.createReadStream(imagePath)
  .pipe(new PNG())
  .on('parsed', function() {
    const width = this.width;
    const height = this.height;
    const data = this.data; // RGBA

    // Convert to 2D array of brightness (0-255)
    const gray = [];
    for (let y = 0; y < height; y++) {
      gray[y] = [];
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx+1];
        const b = data[idx+2];
        gray[y][x] = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      }
    }

    // Analyze transitions per row
    // A transition is defined when brightness changes by more than 50
    const rowTransitions = [];
    for (let y = 0; y < height; y++) {
      let transitions = 0;
      let isDark = gray[y][0] < 128;
      for (let x = 1; x < width; x++) {
        const currentDark = gray[y][x] < 128;
        if (currentDark !== isDark) {
          transitions++;
          isDark = currentDark;
        }
      }
      rowTransitions.push({ y, transitions });
    }

    // Print rows with significant number of transitions (e.g. > 20 transitions, which is typical for 1D barcodes)
    console.log("Image dimensions:", width, "x", height);
    console.log("Analyzing rows with high transition count (potential 1D barcodes):");
    let inBarcodeRegion = false;
    let regionStart = -1;
    let totalTransitions = 0;
    let regionCount = 0;

    for (let y = 0; y < height; y++) {
      const t = rowTransitions[y].transitions;
      if (t >= 20) {
        if (!inBarcodeRegion) {
          inBarcodeRegion = true;
          regionStart = y;
          totalTransitions = 0;
          regionCount = 0;
        }
        totalTransitions += t;
        regionCount++;
      } else {
        if (inBarcodeRegion) {
          const avgTransitions = Math.round(totalTransitions / regionCount);
          console.log(`Region: Row ${regionStart} to ${y - 1} (${regionCount} rows), Avg Transitions: ${avgTransitions}`);
          inBarcodeRegion = false;
        }
      }
    }
    if (inBarcodeRegion) {
      const avgTransitions = Math.round(totalTransitions / regionCount);
      console.log(`Region: Row ${regionStart} to ${height - 1} (${regionCount} rows), Avg Transitions: ${avgTransitions}`);
    }

    // Also let's print a small ASCII-like visualization of the center of the image to see what it is.
    console.log("\nASCII preview of center region (rows 250-270, columns 400-600):");
    for (let y = Math.max(0, Math.floor(height/2) - 10); y < Math.min(height, Math.floor(height/2) + 10); y += 2) {
      let line = "";
      for (let x = Math.max(0, Math.floor(width/2) - 100); x < Math.min(width, Math.floor(width/2) + 100); x += 4) {
        line += gray[y][x] < 128 ? "#" : " ";
      }
      console.log(`${y}: ${line}`);
    }
  });
