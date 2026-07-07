const jsQR = require('jsqr');
const fs = require('fs');
const PNG = require('pngjs').PNG;

const imagePath = 'C:\\Users\\Noman Traders\\.gemini\\antigravity\\brain\\611fb8ae-eb0b-42e8-8ab6-0768780782e2\\uploaded_media_1782585188338.png';

fs.createReadStream(imagePath)
  .pipe(new PNG())
  .on('parsed', function() {
    console.log(`Image size: ${this.width}x${this.height}`);
    
    // jsQR expects Uint8ClampedArray representing RGBA
    const code = jsQR(this.data, this.width, this.height);
    
    if (code) {
      console.log("jsQR SUCCESS:", code.data);
    } else {
      console.log("jsQR FAILED");
    }
  });
