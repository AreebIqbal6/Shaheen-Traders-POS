# Handoff Report: Barcode Scanner Investigation (Milestone M1)

## 1. Observation

### Codebase Analysis (`CodeScanner.tsx`)

1. **WASM / Online Dependency**:
   - At line 2, `CodeScanner.tsx` imports the pure ponyfill:
     ```typescript
     import { BarcodeDetector } from 'barcode-detector/pure';
     ```
   - This implementation relies on `zxing-wasm` which attempts to download a WebAssembly binary (`.wasm`) at runtime from `jsDelivr` CDN by default.
   - If the application is offline or restricted by Content Security Policy (CSP) (which is common in **Tauri** desktop applications), loading fails, triggering the fallback error:
     ```typescript
     setError(err?.message || 'Camera permission denied or WASM failed to load.');
     ``` (lines 163-168).

2. **Square Crop Box Restriction**:
   - The UI defines a square scan box:
     ```typescript
     const [boxSize, setBoxSize] = useState(250); // Initial box size
     ...
     style={{ width: `${boxSize}px`, height: `${boxSize}px` }}
     ``` (lines 22, 260).
   - The canvas is cropped to this square dimensions:
     ```typescript
     const cropWidth = boxSize * vRatio;
     const cropHeight = boxSize * hRatio;
     ...
     canvas.width = cropWidth;
     canvas.height = cropHeight;
     ctx.drawImage(video, sx, sy, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
     ``` (lines 136-145).
   - This forces users to pull the camera far away to fit a wide horizontal 1D barcode inside the square, which drastically reduces the resolution of the individual barcode bars and causes detection to fail. If they get closer, the edges of the barcode are cut off.

3. **Incorrect Cropping Mathematics (Aspect Ratio Distortion)**:
   - The camera stream is styled using `object-fit: cover`:
     ```typescript
     className="absolute inset-0 w-full h-full object-cover pointer-events-none"
     ``` (line 238).
   - The cropping code calculates separate scaling factors for width and height:
     ```typescript
     const vRatio = video.videoWidth / video.clientWidth;
     const hRatio = video.videoHeight / video.clientHeight;
     ``` (lines 132-133).
   - Under `object-fit: cover`, the browser scales the video stream uniformly (preserving aspect ratio) to cover the element. Calculating horizontal and vertical ratios independently and applying them to a square scan box results in a non-square, stretched, or squashed crop on the canvas. Because 1D barcodes rely on precise relative widths of vertical bars, this distortion prevents decoders from recognizing the pattern.

### Ground-Truth Image Analysis (`uploaded_media_1782585188338.png`)

- Tested the ground-truth image (dimensions 1024x541) using:
  - Injected `barcode-detector` polyfill (WASM) inside Playwright Chromium.
  - `@zxing/library` (MultiFormatReader, with `TRY_HARDER` and individual format readers) in Node.
  - `@ericblade/quagga2` in Node and in Playwright Chromium.
- **Results**: All decoders failed to decode the raw image.
- **Pixel Analysis**:
  - Reconstructing the pixels via ASCII downsampling showed that the target is a curved/cylindrical surface (likely a bottle or can package) in the center of the image (rows 250-370, columns 400-600) with a low-contrast, potentially out-of-focus surface.
  - Linear 1D decoders fail on this due to curvature distortion, background noise (text/graphics around the barcode), and out-of-focus blur.

---

## 2. Logic Chain

1. **Premise A**: 1D barcodes (EAN-13, UPC-A, CODE-128) are wide and require the entire horizontal structure (including start/stop guards and quiet zones) to be resolved with high contrast and without distortion.
2. **Premise B**: The current `CodeScanner.tsx` implementation crops the canvas to a square box using incorrect coordinate mapping math (lines 132-145).
3. **Inference 1**: The square crop forces the user to choose between losing resolution (moving the camera away) or cutting off the barcode's sides (moving closer). The aspect ratio mapping stretches/squashes the cropped frame. This directly prevents 1D barcodes from being decoded on the webcam feed.
4. **Premise C**: The `barcode-detector/pure` library fetches its WASM files from an external CDN at runtime (line 2).
5. **Inference 2**: In a local desktop app built with Tauri, this fetch fails when offline or blocked by CSP, rendering the scanner completely non-functional.
6. **Premise D**: The ground-truth image contains significant perspective/curvature distortion and out-of-focus blur.
7. **Inference 3**: Standard decoders fail on the raw ground-truth image because they require a rectangular region of interest (ROI) and image preprocessing (such as binarization or contrast enhancement) to handle the noise and curvature.

---

## 3. Caveats

- **No Code Modifications**: No source code was modified during this investigation. Verification was done via independent scripts running in the `.agents/explorer_barcode_m1_1/` directory.
- **Real Camera Feed**: Real-world camera performance may vary depending on lighting, camera auto-focus speed, and device processing power.

---

## 4. Conclusion

1D barcode scanning fails due to three main causes:
1. **Aspect Ratio Distortion**: Stretches/squashes the canvas representation of the video feed.
2. **Square Field-of-View Truncation**: Prevents the wide 1D barcode from fitting inside the high-resolution zone of the crop box.
3. **Runtime CDN Dependency**: Causes complete scanner failure in offline Tauri environments.

### Refactor Strategy & Recommendations

1. **Correct Visual-to-Canvas Crop Math**:
   Update `CodeScanner.tsx` to handle uniform `object-fit: cover` scaling and offset calculation:
   ```typescript
   const videoRatio = video.videoWidth / video.videoHeight;
   const elementRatio = video.clientWidth / video.clientHeight;

   let scale = 1;
   let offsetX = 0;
   let offsetY = 0;

   if (videoRatio > elementRatio) {
     scale = video.videoHeight / video.clientHeight;
     offsetX = (video.videoWidth - video.clientWidth * scale) / 2;
   } else {
     scale = video.videoWidth / video.clientWidth;
     offsetY = (video.videoHeight - video.clientHeight * scale) / 2;
   }

   const cropWidth = boxWidth * scale;
   const cropHeight = boxHeight * scale;
   const sx = offsetX + (video.clientWidth - boxWidth) / 2 * scale;
   const sy = offsetY + (video.clientHeight - boxHeight) / 2 * scale;
   ```

2. **Redesign the Scan Overlay UI**:
   - Change the scan box from a square to a wide rectangular frame (e.g., width-to-height ratio of 3:1 or 4:1) which matches the physical profile of 1D barcodes.
   - Adjust the animated laser line to scan vertically across this horizontal slit.

3. **Migrate Scanner Engine**:
   - **Recommended Approach**: Migrate from `barcode-detector` to `@zxing/library` (already in `package.json`). Configure it to run entirely offline (pure JS/TS) and pass the `TRY_HARDER` hint.
   - **Alternative High-Performance 1D Approach**: If 1D barcode recognition on curved/cylindrical items is the primary target, use `@ericblade/quagga2` (for 1D barcodes) alongside `jsqr` (for QR codes), utilizing Quagga2's localization engine to locate and rectify skewed barcodes.

---

## 5. Verification Method

To verify the scanner implementation:
1. Write a test suite (using Playwright E2E or Vitest) to check:
   - Visual aspect ratio of the canvas crop matches the scan overlay.
   - Offline load capability (simulate offline state and ensure scanner starts).
2. Test the updated `CodeScanner.tsx` against the ground-truth image using the following command to verify decoding:
   ```bash
   node .agents/explorer_barcode_m1_1/decode_test.cjs
   ```
