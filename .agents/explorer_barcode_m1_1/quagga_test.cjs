const Quagga = require('@ericblade/quagga2').default || require('@ericblade/quagga2');
const path = require('path');

const imagePath = 'C:\\Users\\Noman Traders\\.gemini\\antigravity\\brain\\611fb8ae-eb0b-42e8-8ab6-0768780782e2\\uploaded_media_1782585188338.png';

Quagga.decodeSingle({
  src: imagePath,
  numOfWorkers: 0,  // Needs to be 0 when in Node.js
  inputStream: {
    size: 1024  // Match image width or make it large enough
  },
  decoder: {
    readers: ["ean_reader", "ean_8_reader", "upc_reader", "upc_e_reader", "code_128_reader", "code_39_reader", "i2of5_reader"]
  },
  locate: true // Try to locate the barcode in the image
}, function(result) {
  if (result && result.codeResult) {
    console.log("Quagga DECODE SUCCESS:", result.codeResult.code, "Format:", result.codeResult.format);
  } else {
    console.log("Quagga DECODE FAILED");
  }
});
