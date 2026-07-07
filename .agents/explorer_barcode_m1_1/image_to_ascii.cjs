const fs = require('fs');
const PNG = require('pngjs').PNG;

const imagePath = 'C:\\Users\\Noman Traders\\.gemini\\antigravity\\brain\\611fb8ae-eb0b-42e8-8ab6-0768780782e2\\uploaded_media_1782585188338.png';
const outputPath = 'C:\\Users\\Noman Traders\\.gemini\\antigravity\\scratch\\pos-app\\.agents\\explorer_barcode_m1_1\\image_ascii.txt';

fs.createReadStream(imagePath)
  .pipe(new PNG())
  .on('parsed', function() {
    const width = this.width;
    const height = this.height;
    const data = this.data;

    const asciiWidth = 150;
    const asciiHeight = 75;
    const cellW = width / asciiWidth;
    const cellH = height / asciiHeight;

    const chars = [" ", ".", ":", "-", "=", "+", "*", "#", "%", "@"];
    let output = `Image size: ${width}x${height}\n`;
    
    for (let ay = 0; ay < asciiHeight; ay++) {
      let line = "";
      const yStart = Math.floor(ay * cellH);
      const yEnd = Math.floor((ay + 1) * cellH);
      for (let ax = 0; ax < asciiWidth; ax++) {
        const xStart = Math.floor(ax * cellW);
        const xEnd = Math.floor((ax + 1) * cellW);
        
        let sum = 0;
        let count = 0;
        for (let y = yStart; y < yEnd; y++) {
          for (let x = xStart; x < xEnd; x++) {
            const idx = (y * width + x) * 4;
            const r = data[idx];
            const g = data[idx+1];
            const b = data[idx+2];
            const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;
            sum += gray;
            count++;
          }
        }
        const avg = count > 0 ? sum / count : 255;
        const charIdx = Math.max(0, Math.min(9, 9 - Math.floor(avg / 25.6)));
        line += chars[charIdx];
      }
      output += line + "\n";
    }

    fs.writeFileSync(outputPath, output);
    console.log("ASCII art written to:", outputPath);
  });
