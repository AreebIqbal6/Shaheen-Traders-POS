const fs = require('fs');
const path = require('path');
const PNG = require('pngjs').PNG;
const { 
  MultiFormatReader, 
  RGBLuminanceSource, 
  BinaryBitmap, 
  HybridBinarizer,
  GlobalHistogramBinarizer,
  DecodeHintType,
  BarcodeFormat
} = require('@zxing/library');

const imagePath = 'C:\\Users\\Noman Traders\\.gemini\\antigravity\\brain\\611fb8ae-eb0b-42e8-8ab6-0768780782e2\\uploaded_media_1782585188338.png';

console.log('Loading image:', imagePath);

fs.createReadStream(imagePath)
  .pipe(new PNG())
  .on('parsed', function() {
    const width = this.width;
    const height = this.height;
    const data = this.data; // RGBA

    console.log(`Loaded ground-truth image: ${width}x${height}`);

    // 1. Detect the blue scan box in the screenshot
    // Restrict the search to the center-right region (where the camera view is)
    // to avoid matching blue elements in the sidebar or tabs.
    let minX = width;
    let maxX = 0;
    let minY = height;
    let maxY = 0;
    let bluePixelsCount = 0;

    for (let y = Math.floor(height * 0.15); y < Math.floor(height * 0.85); y++) {
      for (let x = Math.floor(width * 0.3); x < Math.floor(width * 0.8); x++) {
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        
        // Match Tailwind blue-500 (#3b82f6) or general scanner blue (high B, moderate G, low R)
        if (b > 200 && g > 100 && g < 160 && r < 100) {
          bluePixelsCount++;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    let boxX = minX;
    let boxY = minY;
    let boxW = maxX - minX;
    let boxH = maxY - minY;

    if (bluePixelsCount === 0 || boxW <= 0 || boxH <= 0) {
      console.log('Could not automatically detect blue scan box in center region. Using fallback center crop.');
      boxW = 250;
      boxH = 250;
      boxX = Math.floor((width - boxW) / 2);
      boxY = Math.floor((height - boxH) / 2);
    } else {
      console.log(`Detected blue scan box: x=${boxX}, y=${boxY}, w=${boxW}, h=${boxH} (based on ${bluePixelsCount} blue pixels)`);
    }

    // Prepare the reader with TRY_HARDER and EAN_13 format
    const hints = new Map();
    hints.set(DecodeHintType.TRY_HARDER, true);
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.EAN_13,
      BarcodeFormat.UPC_A,
      BarcodeFormat.CODE_128,
      BarcodeFormat.QR_CODE,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_E,
      BarcodeFormat.CODE_39,
      BarcodeFormat.ITF
    ]);
    const reader = new MultiFormatReader();
    reader.setHints(hints);

    // Let's implement image preprocessing configurations to try
    const configs = [];
    
    // We will scan with various:
    // - laserRemoval: true/false
    // - contrast: 1.0, 1.5, 2.0, 2.5
    // - cropInset: 0, 5, 10, 15, 20 pixels (cropping slightly inside the detected box to avoid border brackets)
    // - rotationAngle: -15 to 15 in steps of 1 degree
    
    for (const laserRemoval of [true, false]) {
      for (const contrast of [1.0, 1.5, 2.0, 2.5]) {
        for (const cropInset of [0, 5, 10, 15, 20]) {
          configs.push({ laserRemoval, contrast, cropInset });
        }
      }
    }

    console.log(`Starting execution over ${configs.length} preprocessing configurations...`);

    // Helper function to rotate a grayscale buffer
    function rotateGrayscale(buffer, w, h, angleDegrees) {
      if (angleDegrees === 0) return { buffer, w, h };
      const angleRad = (angleDegrees * Math.PI) / 180;
      const cos = Math.cos(angleRad);
      const sin = Math.sin(angleRad);
      const newW = Math.floor(Math.abs(w * cos) + Math.abs(h * sin));
      const newH = Math.floor(Math.abs(w * sin) + Math.abs(h * cos));
      const rotated = new Uint8ClampedArray(newW * newH);
      const cx = w / 2;
      const cy = h / 2;
      const ncx = newW / 2;
      const ncy = newH / 2;

      for (let y = 0; y < newH; y++) {
        for (let x = 0; x < newW; x++) {
          const dx = x - ncx;
          const dy = y - ncy;
          const srcX = Math.round(dx * cos + dy * sin + cx);
          const srcY = Math.round(-dx * sin + dy * cos + cy);
          let val = 255;
          if (srcX >= 0 && srcX < w && srcY >= 0 && srcY < h) {
            val = buffer[srcY * w + srcX];
          }
          rotated[y * newW + x] = val;
        }
      }
      return { buffer: rotated, w: newW, h: newH };
    }

    let success = false;
    let decodedValue = null;
    let successfulConfig = null;

    // Run the preprocessing combinations
    for (const config of configs) {
      if (success) break;

      const inset = config.cropInset;
      const cx = boxX + inset;
      const cy = boxY + inset;
      const cw = boxW - 2 * inset;
      const ch = boxH - 2 * inset;

      if (cw <= 0 || ch <= 0) continue;

      // Extract and preprocess pixels
      const tempRGBA = new Uint8ClampedArray(cw * ch * 4);
      for (let y = 0; y < ch; y++) {
        for (let x = 0; x < cw; x++) {
          const srcIdx = ((cy + y) * width + (cx + x)) * 4;
          const destIdx = (y * cw + x) * 4;
          tempRGBA[destIdx] = data[srcIdx];     // R
          tempRGBA[destIdx + 1] = data[srcIdx + 1]; // G
          tempRGBA[destIdx + 2] = data[srcIdx + 2]; // B
          tempRGBA[destIdx + 3] = data[srcIdx + 3]; // A
        }
      }

      // Red laser line removal
      if (config.laserRemoval) {
        for (let y = 0; y < ch; y++) {
          for (let x = 0; x < cw; x++) {
            const idx = (y * cw + x) * 4;
            const r = tempRGBA[idx];
            const g = tempRGBA[idx + 1];
            const b = tempRGBA[idx + 2];
            // Detect bright red laser pixels (R is high, G & B are relatively low)
            if (r > 150 && g < 100 && b < 100) {
              // Replace red laser pixel with pixel from 5 rows above
              const replaceY = Math.max(0, y - 5);
              const replaceIdx = (replaceY * cw + x) * 4;
              tempRGBA[idx] = tempRGBA[replaceIdx];
              tempRGBA[idx + 1] = tempRGBA[replaceIdx + 1];
              tempRGBA[idx + 2] = tempRGBA[replaceIdx + 2];
            }
          }
        }
      }

      // Grayscale and Contrast Boost
      const grayBuffer = new Uint8ClampedArray(cw * ch);
      for (let i = 0; i < cw * ch; i++) {
        const r = tempRGBA[i * 4];
        const g = tempRGBA[i * 4 + 1];
        const b = tempRGBA[i * 4 + 2];
        let gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;

        // Apply contrast boost
        if (config.contrast !== 1.0) {
          gray = 128 + (gray - 128) * config.contrast;
          gray = Math.max(0, Math.min(255, gray));
        }

        grayBuffer[i] = Math.round(gray);
      }

      // Try different rotation angles to handle curved surface tilt
      for (let angle = -15; angle <= 15; angle += 1) {
        const { buffer, w, h } = rotateGrayscale(grayBuffer, cw, ch, angle);

        // Try both Hybrid and Global binarizers
        for (const binarizerClass of [HybridBinarizer, GlobalHistogramBinarizer]) {
          try {
            const luminanceSource = new RGBLuminanceSource(buffer, w, h);
            const bitmap = new BinaryBitmap(new binarizerClass(luminanceSource));
            const result = reader.decode(bitmap);
            
            decodedValue = result.getText();
            success = true;
            successfulConfig = {
              laserRemoval: config.laserRemoval,
              contrast: config.contrast,
              cropInset: config.cropInset,
              rotationAngle: angle,
              binarizer: binarizerClass.name
            };
            
            console.log(`\n======================================================`);
            console.log(`DECODE SUCCESS!`);
            console.log(`Decoded Value: ${decodedValue}`);
            console.log(`Barcode Format: ${result.getBarcodeFormat()}`);
            console.log(`Config used:`, successfulConfig);
            console.log(`======================================================\n`);

            // Save the successful cropped and processed image as a PNG file for validation
            const outPng = new PNG({ width: w, height: h });
            for (let y = 0; y < h; y++) {
              for (let x = 0; x < w; x++) {
                const val = buffer[y * w + x];
                const idx = (y * w + x) * 4;
                outPng.data[idx] = val;
                outPng.data[idx + 1] = val;
                outPng.data[idx + 2] = val;
                outPng.data[idx + 3] = 255;
              }
            }
            const debugFilename = path.join(__dirname, 'debug-success-preprocessed.png');
            outPng.pack().pipe(fs.createWriteStream(debugFilename));
            console.log('Saved success preprocessed debug image to:', debugFilename);

            break;
          } catch (e) {
            // Decoded failed for this specific parameter combination
          }
        }
        if (success) break;
      }
    }

    if (!success) {
      console.error('Failed to decode barcode using any configuration.');
      process.exit(1);
    }
  })
  .on('error', function(err) {
    console.error('Failed to parse ground-truth PNG:', err);
    process.exit(1);
  });
