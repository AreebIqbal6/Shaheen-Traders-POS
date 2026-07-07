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

    console.log(`Image parsed: ${width}x${height}`);

    const hints = new Map();
    hints.set(DecodeHintType.TRY_HARDER, true);
    const reader = new MultiFormatReader();
    reader.setHints(hints);

    function testBuffer(buffer, w, h, label) {
      const source = new RGBLuminanceSource(buffer, w, h);
      
      // Try Hybrid
      try {
        const bitmap = new BinaryBitmap(new HybridBinarizer(source));
        const result = reader.decode(bitmap);
        console.log(`DECODE SUCCESS [${label}] (Hybrid):`, result.getText(), result.getBarcodeFormat());
        return true;
      } catch (e) {}

      // Try Global
      try {
        const bitmap = new BinaryBitmap(new GlobalHistogramBinarizer(source));
        const result = reader.decode(bitmap);
        console.log(`DECODE SUCCESS [${label}] (Global):`, result.getText(), result.getBarcodeFormat());
        return true;
      } catch (e) {}

      return false;
    }

    // 1. Standard grayscale
    const gray = new Uint8ClampedArray(width * height);
    for (let i = 0; i < width * height; i++) {
      const r = data[i * 4];
      const g = data[i * 4 + 1];
      const b = data[i * 4 + 2];
      gray[i] = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);
    }
    if (testBuffer(gray, width, height, "Standard Grayscale")) return;

    // 2. Inverted grayscale
    const inverted = new Uint8ClampedArray(width * height);
    for (let i = 0; i < width * height; i++) {
      inverted[i] = 255 - gray[i];
    }
    if (testBuffer(inverted, width, height, "Inverted")) return;

    // 3. High contrast (binarized at threshold 128)
    const binarized128 = new Uint8ClampedArray(width * height);
    for (let i = 0; i < width * height; i++) {
      binarized128[i] = gray[i] < 128 ? 0 : 255;
    }
    if (testBuffer(binarized128, width, height, "Binarized 128")) return;

    // 4. Binarized at threshold 100
    const binarized100 = new Uint8ClampedArray(width * height);
    for (let i = 0; i < width * height; i++) {
      binarized100[i] = gray[i] < 100 ? 0 : 255;
    }
    if (testBuffer(binarized100, width, height, "Binarized 100")) return;

    // 5. Binarized at threshold 180
    const binarized180 = new Uint8ClampedArray(width * height);
    for (let i = 0; i < width * height; i++) {
      binarized180[i] = gray[i] < 180 ? 0 : 255;
    }
    if (testBuffer(binarized180, width, height, "Binarized 180")) return;

    // 6. Cropped middle region (barcode is usually centered)
    // Crop 80% width and 80% height
    const cropW = Math.floor(width * 0.8);
    const cropH = Math.floor(height * 0.8);
    const startX = Math.floor((width - cropW) / 2);
    const startY = Math.floor((height - cropH) / 2);
    const cropped = new Uint8ClampedArray(cropW * cropH);
    for (let y = 0; y < cropH; y++) {
      for (let x = 0; x < cropW; x++) {
        cropped[y * cropW + x] = gray[(startY + y) * width + (startX + x)];
      }
    }
    if (testBuffer(cropped, cropW, cropH, "Cropped 80% Center")) return;

    // 7. Cropped narrow horizontal stripe (good for 1D barcodes)
    // Crop 100% width, but only 40% height around center
    const stripeH = Math.floor(height * 0.4);
    const stripeY = Math.floor((height - stripeH) / 2);
    const stripe = new Uint8ClampedArray(width * stripeH);
    for (let y = 0; y < stripeH; y++) {
      for (let x = 0; x < width; x++) {
        stripe[y * width + x] = gray[(stripeY + y) * width + x];
      }
    }
    if (testBuffer(stripe, width, stripeH, "Narrow Center Stripe")) return;

    console.log("All image prep tests failed.");
  });
