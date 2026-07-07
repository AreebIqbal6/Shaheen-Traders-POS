const { 
  EAN13Reader,
  Code128Reader,
  ITFReader,
  Code39Reader,
  Code93Reader,
  RGBLuminanceSource, 
  BinaryBitmap, 
  HybridBinarizer,
  GlobalHistogramBinarizer
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

    const gray = new Uint8ClampedArray(width * height);
    for (let i = 0; i < width * height; i++) {
      const r = data[i * 4];
      const g = data[i * 4 + 1];
      const b = data[i * 4 + 2];
      gray[i] = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);
    }

    const readers = [
      { name: "EAN-13", reader: new EAN13Reader() },
      { name: "Code-128", reader: new Code128Reader() },
      { name: "ITF", reader: new ITFReader() },
      { name: "Code-39", reader: new Code39Reader() },
      { name: "Code-93", reader: new Code93Reader() }
    ];

    for (const rInfo of readers) {
      for (const invert of [false, true]) {
        const buffer = new Uint8ClampedArray(width * height);
        for (let i = 0; i < width * height; i++) {
          buffer[i] = invert ? 255 - gray[i] : gray[i];
        }

        const source = new RGBLuminanceSource(buffer, width, height);

        for (const binarizerClass of [HybridBinarizer, GlobalHistogramBinarizer]) {
          try {
            const bitmap = new BinaryBitmap(new binarizerClass(source));
            const result = rInfo.reader.decode(bitmap);
            console.log(`SUCCESS: Reader: ${rInfo.name}, Invert: ${invert}, Binarizer: ${binarizerClass.name} -> Text: ${result.getText()}`);
            return;
          } catch (e) {
            // fail silently
          }
        }
      }
    }

    console.log("All specific readers failed on raw image.");
  });
