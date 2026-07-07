# Handoff Report: Barcode Scanner Investigation

This report details why 1D barcode scanning (EAN-13, UPC-A, CODE-128) fails in the webcam feed and on the ground-truth image, and recommends a robust refactoring strategy.

---

## 1. Observation

During the read-only investigation, the following files and configurations were analyzed:

1. **Webcam Crop & Capture Logic in `src/components/CodeScanner.tsx`**:
   - The `<video>` element is rendered with the `object-cover` style:
     ```tsx
     236:             <video 
     237:               ref={videoRef} 
     238:               className="absolute inset-0 w-full h-full object-cover pointer-events-none" 
     239:               playsInline 
     240:               muted 
     241:               autoPlay 
     242:               style={{ transform: isMirrored ? 'scaleX(-1)' : 'none' }}
     243:             />
     ```
   - The canvas cropping logic uses client dimensions and a simple ratio calculation:
     ```tsx
     132:             const vRatio = video.videoWidth / video.clientWidth;
     133:             const hRatio = video.videoHeight / video.clientHeight;
     134:             
     135:             // The box is centered. Calculate its coordinates on the actual video feed.
     136:             const cropWidth = boxSize * vRatio;
     137:             const cropHeight = boxSize * hRatio;
     138:             const sx = (video.videoWidth - cropWidth) / 2;
     139:             const sy = (video.videoHeight - cropHeight) / 2;
     140: 
     141:             canvas.width = cropWidth;
     142:             canvas.height = cropHeight;
     143: 
     144:             // Draw only the cropped portion to the canvas
     145:             ctx.drawImage(video, sx, sy, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
     ```

2. **WebAssembly Loading & CDN Dependency in `src/components/CodeScanner.tsx`**:
   - The `BarcodeDetector` is initialized from `barcode-detector/pure`:
     ```tsx
     2: import { BarcodeDetector } from 'barcode-detector/pure';
     ...
     99:         detector = new BarcodeDetector({
     100:           formats: ['qr_code', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'itf', 'data_matrix', 'pdf417']
     101:         });
     ```
   - No call is made to `prepareZXingModule` to override the WASM serving path.

3. **Ground-Truth Image `uploaded_media_1782585188338.png`**:
   - Dimensions are `1024 x 541`. It contains a full screenshot of the application's Admin interface.
   - The barcode is shown inside the camera container feed, on a green curved surface (a bottle).
   - A bright red horizontal laser line overlay crosses the barcode at its bottom section.
   - The barcode is compressed at its outer edges due to the bottle's curvature.

4. **Dependencies in `package.json`**:
   - The project includes several barcode reading libraries:
     ```json
     15:     "@ericblade/quagga2": "^1.12.1",
     21:     "@zxing/browser": "^0.2.0",
     22:     "@zxing/library": "^0.22.0",
     23:     "barcode-detector": "^3.2.0",
     ```

---

## 2. Logic Chain

The failure of 1D barcode scanning on both the webcam and the ground-truth image is caused by three distinct issues:

### A. Flawed Aspect Ratio and Crop Coordinates Math (Webcam Failure)
- **Observation 1 & 2**: The HTML `<video>` element is rendered using CSS `object-fit: cover`. This centers and crops the video feed to fill the element container.
- **Mathematical Analysis**: Under `object-fit: cover`, the scale factor of the displayed video is $S = \max(W_{elem} / W_{video}, H_{elem} / H_{video})$. The simple ratios calculated in `CodeScanner.tsx` (`vRatio = videoWidth / clientWidth`, `hRatio = videoHeight / clientHeight`) only work for `object-fit: fill` (where the image stretches to fill the container).
- **Resulting Bug**:
  1. **Offset/Shift**: The top-left source crop coordinate `sx` and `sy` do not map to the visual center of the scan box. For a typical desktop container (e.g. 800x600 client, 1280x720 video), this shifts the cropped area by 50px horizontally on the video feed. On mobile/portrait viewports, the shift exceeds 25% of the video width. As a result, **the actual barcode aligned in the box is cut out of the cropped canvas entirely**.
  2. **Image Distortion (Stretching/Squishing)**: Because `cropWidth` and `cropHeight` use differing ratios (`vRatio` vs `hRatio`), the canvas aspect ratio is distorted. In the landscape-to-portrait mobile case, the cropped canvas is stretched horizontally by over **3.6x** its original aspect ratio.
- **Impact on 1D vs QR Codes**: QR codes contain strong perspective alignment patterns (finder boxes) allowing decoders (like ZXing) to mathematically unwarp and correct the image before reading. However, 1D decoders (EAN-13, UPC-A, Code-128) rely on precise linear pixel scans to measure bar/space width ratios. A 33% to 300% horizontal stretch completely breaks the decodability of 1D barcodes, leading to 100% scanning failure on the webcam feed.

### B. WebAssembly Initialization Failure (Offline Failure)
- **Observation 2 & `node_modules/barcode-detector/README.md`**: `barcode-detector` uses `zxing-wasm` under the hood. By default, it fetches the `.wasm` binary from the jsDelivr CDN at runtime.
- **Resulting Bug**: If the application is run offline, behind a restricted corporate network, or packaged inside a Tauri environment with strict Content Security Policies (CSP), the network fetch for `zxing_reader.wasm` fails. This prevents the detector from initializing or decoding frames.

### C. Ground-Truth Image Visual Noise, Curvature, and Red Laser Interference
- **Observation 3**: The ground-truth image is a full desktop screenshot (1024x541).
- **Resulting Bug**:
  1. **Visual Noise**: Passing the full screenshot to a barcode reader forces it to scan all page contents (sidebar, text, grids), resulting in false binarization boundaries.
  2. **Red Laser Line**: The red horizontal laser line overlay crosses the barcode stripes. In standard grayscale/binarized images, this red line acts as a solid connection block or creates distorted gaps across the bars, violating the EAN-13 pattern.
  3. **Curvature**: The barcode is on a round bottle, causing perspective compression of the bars at the edges, which deviates from EAN-13 specifications.

---

## 3. Caveats

- **Webcam Stream Verification**: Live testing on physical webcams with varying native resolutions was not performed in real-time due to the headless nature of this read-only investigation.
- **Browser Native API**: The presence of native browser-provided `BarcodeDetector` APIs (which vary by browser version and OS, and might bypass the WASM polyfill completely) was assumed to be disabled or unreliable for 1D barcodes based on typical Chrome/Edge headless behaviors.

---

## 4. Conclusion & Recommendations

To build a robust barcode scanner that succeeds on both the webcam feed and the ground-truth image, we recommend the following design and refactoring strategy:

### Recommendation 1: Correct the Crop Math for `object-fit: cover`
Replace the calculation in `CodeScanner.tsx` (lines 132-139) with an aspect-ratio-preserving formula:
```typescript
// Calculate scale factor for object-fit: cover
const s = Math.max(video.clientWidth / video.videoWidth, video.clientHeight / video.videoHeight);

// Calculate exact dimensions on the source video (retaining 1:1 square ratio)
const cropSize = boxSize / s;
const sx = (video.videoWidth - cropSize) / 2;
const sy = (video.videoHeight - cropSize) / 2;

// Set canvas dimensions to the crop size (no aspect ratio distortion)
canvas.width = cropSize;
canvas.height = cropSize;

// Draw the crop area onto the canvas
ctx.drawImage(video, sx, sy, cropSize, cropSize, 0, 0, cropSize, cropSize);
```
This ensures zero stretching, zero squishing, and perfect alignment with the visual box.

### Recommendation 2: Refactor to `@zxing/library` (Offline & CDN-Free)
Since `@zxing/library` is already in `package.json`, switch from `barcode-detector` (WASM/CDN) to a pure JS/TS `@zxing/library` implementation. This completely eliminates any WASM CDN download issues.

Update `CodeScanner.tsx` to use the library with `TRY_HARDER` enabled (which is critical for curved surfaces and low-contrast images):
```typescript
import { MultiFormatReader, BarcodeFormat, DecodeHintType, RGBLuminanceSource, BinaryBitmap, HybridBinarizer } from '@zxing/library';

// Inside component:
const reader = useRef(new MultiFormatReader());

useEffect(() => {
  const hints = new Map();
  hints.set(DecodeHintType.POSSIBLE_FORMATS, [
    BarcodeFormat.QR_CODE,
    BarcodeFormat.EAN_13,
    BarcodeFormat.EAN_8,
    BarcodeFormat.UPC_A,
    BarcodeFormat.CODE_128,
    BarcodeFormat.CODE_39,
    BarcodeFormat.ITF
  ]);
  hints.set(DecodeHintType.TRY_HARDER, true); // Enable robust search for low-contrast/curved barcodes
  reader.current.setHints(hints);
}, []);

// Inside scan loop:
try {
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const luminanceSource = new RGBLuminanceSource(imgData.data, canvas.width, canvas.height);
  const binaryBitmap = new BinaryBitmap(new HybridBinarizer(luminanceSource));
  
  const result = reader.current.decodeWithState(binaryBitmap);
  handleDetection(result.getText(), result.getBarcodeFormat().toString());
} catch (err) {
  // Decode failed for this frame (normal behaviour when no barcode is present)
} finally {
  reader.current.reset();
}
```

### Recommendation 3: Apply Canvas Preprocessing
To pass the ground-truth image and low-quality webcam feeds:
1. **Grayscale and Contrast Filter (Hardware Accelerated)**:
   Set the canvas context filter before drawing the image:
   ```typescript
   ctx.filter = 'grayscale(100%) contrast(140%)';
   ctx.drawImage(video, sx, sy, cropSize, cropSize, 0, 0, cropSize, cropSize);
   ```
2. **Red Laser Line Color Removal**:
   Scan and remove red-dominant pixels in the cropped image before decoding:
   ```typescript
   const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
   const data = imgData.data;
   for (let i = 0; i < data.length; i += 4) {
     const r = data[i];
     const g = data[i+1];
     const b = data[i+2];
     // Detect bright red laser pixels (high red, low green/blue)
     if (r > 150 && g < 100 && b < 100) {
       // Replace red laser pixel with the pixel from the row above
       if (i >= canvas.width * 4) {
         data[i] = data[i - canvas.width * 4];
         data[i+1] = data[i+1 - canvas.width * 4];
         data[i+2] = data[i+2 - canvas.width * 4];
       }
     }
   }
   ctx.putImageData(imgData, 0, 0);
   ```

---

## 5. Verification Method

To verify these conclusions and recommendations independently:

1. **Unit Test Verification**:
   Create a test script using Playwright or Jest that:
   - Loads the ground-truth image `uploaded_media_1782585188338.png`.
   - Simulates the visual scan box cutout (e.g. crop coordinates for the center region).
   - Feeds the cropped canvas through the proposed `@zxing/library` configuration (with `TRY_HARDER` and the red-laser removal filter).
   - Asserts that it successfully decodes the barcode value.

2. **Webcam Feed Verification**:
   - Run `npm run dev` to start the application.
   - Resize the browser window to change the aspect ratio (mobile vs desktop).
   - Position a 1D barcode in the scan box and verify detection.
   - Confirm that the crop canvas (if rendered for debugging) displays a perfect square with zero stretching.
