const { 
  MultiFormatReader, 
  RGBLuminanceSource, 
  BinaryBitmap, 
  HybridBinarizer,
  GlobalHistogramBinarizer,
  DecodeHintType, 
  BarcodeFormat 
} = require('@zxing/library');
const fs = require('fs');
const PNG = require('pngjs').PNG;

const imagePath = 'C:\\Users\\Noman Traders\\.gemini\\antigravity\\brain\\611fb8ae-eb0b-42e8-8ab6-0768780782e2\\uploaded_media_1782585188338.png';

fs.createReadStream(imagePath)
  .pipe(new PNG())
  .on('parsed', function() {
    const width = this.width;
    const height = this.height;
    const data = this.data; // RGBA

    console.log(`Image size: ${width}x${height}`);

    // Create grayscale buffer for 0 degrees
    const grayBuffer = new Uint8ClampedArray(width * height);
    for (let i = 0; i < width * height; i++) {
      const r = data[i * 4];
      const g = data[i * 4 + 1];
      const b = data[i * 4 + 2];
      grayBuffer[i] = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);
    }

    const hints = new Map();
    hints.set(DecodeHintType.TRY_HARDER, true);
    
    const reader = new MultiFormatReader();
    reader.setHints(hints);

    // Function to try decoding a grayscale buffer
    function tryDecode(buffer, w, h, angleName) {
      const source = new RGBLuminanceSource(buffer, w, h);
      
      // Try HybridBinarizer
      try {
        const bitmap = new BinaryBitmap(new HybridBinarizer(source));
        const result = reader.decode(bitmap);
        console.log(`SUCCESS at ${angleName} (Hybrid): ${result.getText()} (${result.getBarcodeFormat()})`);
        return true;
      } catch (e) {
        // Failed
      }

      // Try GlobalHistogramBinarizer
      try {
        const bitmap = new BinaryBitmap(new GlobalHistogramBinarizer(source));
        const result = reader.decode(bitmap);
        console.log(`SUCCESS at ${angleName} (Global): ${result.getText()} (${result.getBarcodeFormat()})`);
        return true;
      } catch (e) {
        // Failed
      }

      return false;
    }

    // 1. Try 0 degrees
    if (tryDecode(grayBuffer, width, height, "0 deg")) return;

    // 2. Try 90 degrees (rotate right)
    const rot90 = new Uint8ClampedArray(width * height);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const newX = height - 1 - y;
        const newY = x;
        rot90[newY * height + newX] = grayBuffer[y * width + x];
      }
    }
    if (tryDecode(rot90, height, width, "90 deg")) return;

    // 3. Try 180 degrees (rotate 180)
    const rot180 = new Uint8ClampedArray(width * height);
    for (let i = 0; i < width * height; i++) {
      rot180[i] = grayBuffer[width * height - 1 - i];
    }
    if (tryDecode(rot180, width, height, "180 deg")) return;

    // 4. Try 270 degrees (rotate left)
    const rot270 = new Uint8ClampedArray(width * height);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const newX = y;
        const newY = width - 1 - x;
        rot270[newY * height + newX] = grayBuffer[y * width + x];
      }
    }
    if (tryDecode(rot270, height, width, "270 deg")) return;

    console.log("All standard angles failed.");
  });
