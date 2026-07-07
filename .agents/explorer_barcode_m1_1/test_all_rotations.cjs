const { 
  MultiFormatReader, 
  RGBLuminanceSource, 
  BinaryBitmap, 
  HybridBinarizer,
  GlobalHistogramBinarizer,
  DecodeHintType 
} = require('@zxing/library');
const fs = require('fs');
const PNG = require('pngjs').PNG;

const imagePath = 'C:\\Users\\Noman Traders\\.gemini\\antigravity\\brain\\611fb8ae-eb0b-42e8-8ab6-0768780782e2\\uploaded_media_1782585188338.png';

fs.createReadStream(imagePath)
  .pipe(new PNG())
  .on('parsed', function() {
    const width = this.width;
    const height = this.height;
    const data = this.data;

    // Convert to grayscale first
    const gray = new Uint8ClampedArray(width * height);
    for (let i = 0; i < width * height; i++) {
      const r = data[i * 4];
      const g = data[i * 4 + 1];
      const b = data[i * 4 + 2];
      gray[i] = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);
    }

    const hints = new Map();
    hints.set(DecodeHintType.TRY_HARDER, true);
    const reader = new MultiFormatReader();
    reader.setHints(hints);

    // Rotate function using bilinear or simple nearest-neighbor interpolation
    // We will rotate the image around its center.
    // For safety, the rotated image will have dimensions that fit the rotated bounding box.
    function rotateImage(angleDegrees, invert) {
      const angleRad = (angleDegrees * Math.PI) / 180;
      const cos = Math.cos(angleRad);
      const sin = Math.sin(angleRad);

      // New dimensions to avoid cropping corners
      const newWidth = Math.floor(Math.abs(width * cos) + Math.abs(height * sin));
      const newHeight = Math.floor(Math.abs(width * sin) + Math.abs(height * cos));
      
      const rotated = new Uint8ClampedArray(newWidth * newHeight);
      
      const cx = width / 2;
      const cy = height / 2;
      const ncx = newWidth / 2;
      const ncy = newHeight / 2;

      for (let y = 0; y < newHeight; y++) {
        for (let x = 0; x < newWidth; x++) {
          // Translate to center
          const dx = x - ncx;
          const dy = y - ncy;
          
          // Rotate back
          const srcX = Math.round(dx * cos + dy * sin + cx);
          const srcY = Math.round(-dx * sin + dy * cos + cy);

          let val = 255; // default white
          if (srcX >= 0 && srcX < width && srcY >= 0 && srcY < height) {
            val = gray[srcY * width + srcX];
          }
          if (invert) {
            val = 255 - val;
          }
          rotated[y * newWidth + x] = val;
        }
      }

      return { buffer: rotated, w: newWidth, h: newHeight };
    }

    console.log("Starting rotation scanning...");
    // Try every 5 degrees from 0 to 180 (since 180+ is symmetric for 1D barcodes/QR codes mostly)
    for (let angle = 0; angle < 180; angle += 5) {
      for (const invert of [false, true]) {
        const { buffer, w, h } = rotateImage(angle, invert);
        const source = new RGBLuminanceSource(buffer, w, h);
        
        // Try Hybrid
        try {
          const bitmap = new BinaryBitmap(new HybridBinarizer(source));
          const result = reader.decode(bitmap);
          console.log(`SUCCESS: Angle ${angle} deg, Invert: ${invert} -> ${result.getText()} (${result.getBarcodeFormat()})`);
          return;
        } catch (e) {}

        // Try Global
        try {
          const bitmap = new BinaryBitmap(new GlobalHistogramBinarizer(source));
          const result = reader.decode(bitmap);
          console.log(`SUCCESS: Angle ${angle} deg, Invert: ${invert} -> ${result.getText()} (${result.getBarcodeFormat()})`);
          return;
        } catch (e) {}
      }
    }

    console.log("All rotations failed.");
  });
