const { MultiFormatReader, RGBLuminanceSource, BinaryBitmap, HybridBinarizer } = require('@zxing/library');
const fs = require('fs');
const PNG = require('pngjs').PNG;

const imagePath = 'C:\\Users\\Noman Traders\\.gemini\\antigravity\\brain\\611fb8ae-eb0b-42e8-8ab6-0768780782e2\\uploaded_media_1782585188338.png';

fs.createReadStream(imagePath)
  .pipe(new PNG())
  .on('parsed', function() {
    console.log(`Image parsed successfully. Dimensions: ${this.width}x${this.height}`);
    
    const width = this.width;
    const height = this.height;
    const data = this.data; // RGBA buffer

    // Convert RGBA to grayscale luminance
    const luminanceBuffer = new Uint8ClampedArray(width * height);
    for (let i = 0; i < width * height; i++) {
      const r = data[i * 4];
      const g = data[i * 4 + 1];
      const b = data[i * 4 + 2];
      luminanceBuffer[i] = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);
    }

    const luminanceSource = new RGBLuminanceSource(luminanceBuffer, width, height);
    const binarizer = new HybridBinarizer(luminanceSource);
    const bitmap = new BinaryBitmap(binarizer);

    const reader = new MultiFormatReader();
    try {
      const result = reader.decode(bitmap);
      console.log('ZXing DECODE SUCCESS:', result.getText(), 'Format:', result.getBarcodeFormat());
    } catch (err) {
      console.error('ZXing DECODE FAILED:', err.message || err);
    }
  })
  .on('error', function(err) {
    console.error('Error reading PNG:', err);
  });
