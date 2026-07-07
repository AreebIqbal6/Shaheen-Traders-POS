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

    // Grayscale
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

    // Grid search parameters
    const winWidths = [300, 500, 700, 900];
    const winHeights = [80, 150, 250];
    const stepX = 100;
    const stepY = 50;

    console.log("Starting subregion grid search...");

    for (const winW of winWidths) {
      for (const winH of winHeights) {
        if (winW > width || winH > height) continue;
        
        for (let y = 0; y <= height - winH; y += stepY) {
          for (let x = 0; x <= width - winW; x += stepX) {
            
            // Extract crop
            const cropped = new Uint8ClampedArray(winW * winH);
            for (let cy = 0; cy < winH; cy++) {
              for (let cx = 0; cx < winW; cx++) {
                cropped[cy * winW + cx] = gray[(y + cy) * width + (x + cx)];
              }
            }

            for (const invert of [false, true]) {
              const buffer = new Uint8ClampedArray(winW * winH);
              for (let i = 0; i < winW * winH; i++) {
                buffer[i] = invert ? 255 - cropped[i] : cropped[i];
              }

              const source = new RGBLuminanceSource(buffer, winW, winH);

              for (const binarizerClass of [HybridBinarizer, GlobalHistogramBinarizer]) {
                try {
                  const bitmap = new BinaryBitmap(new binarizerClass(source));
                  const result = reader.decode(bitmap);
                  console.log(`SUCCESS: Crop at x=${x}, y=${y}, w=${winW}, h=${winH}, Invert=${invert}, Binarizer=${binarizerClass.name} -> Text: ${result.getText()} (${result.getBarcodeFormat()})`);
                  return;
                } catch (e) {
                  // fail silently
                }
              }
            }

          }
        }
      }
    }

    console.log("Grid search finished. No codes found.");
  });
