# Synthesis of Explorer Findings (Milestone M1)

## Consensus
1. **Aspect Ratio & Crop Math Distortion**: The webcam video is styled with `object-fit: cover` to fill the container. The current cropping math uses independent `vRatio` and `hRatio` scaling, which distorts the aspect ratio of the cropped frame and shifts the coordinates. This causes 1D barcodes to be stretched/squished and offset from the center scan box, making them completely un-decodable.
2. **Offline Dependency**: The `barcode-detector/pure` polyfill attempts to load its underlying ZXing WASM module from a public CDN (jsDelivr) at runtime, which fails in offline, restricted network, or Tauri desktop container environments.
3. **Ground-Truth Image Noise**: The ground-truth image contains curvature distortion (bottle shape), camera grain, reflections/glare, and a red horizontal laser line overlay. These elements interfere with standard thresholding/binarization.
4. **ZXing and Quagga2 Suitability**: Both `@zxing/library` and `@ericblade/quagga2` are already installed in `package.json`. `@zxing/library` is preferred because it runs completely client-side (offline-safe) and provides a `TRY_HARDER` hint that enables robust search for skewed, rotated, or low-contrast barcodes.

## Resolved Conflicts
- **Engine Strategy**:
  - Explorer 2 proposed a hybrid approach combining `@zxing/library` with a fallback to `@ericblade/quagga2` for curved surfaces.
  - Explorer 3 proposed using `@zxing/library` directly combined with canvas filters (grayscale, contrast, and red-laser pixel removal).
  - *Resolution*: We will implement `@zxing/library` as the main scanning engine with custom canvas preprocessing (grayscale, contrast, and laser removal). We will configure ZXing with `TRY_HARDER` and `TRY_ROTATE` (or try all rotations). If needed, we can also evaluate if Quagga2 provides additional robustness for EAN-13, but ZXing with `TRY_HARDER` and preprocessing should be the first choice.

## Dissenting Views
- None. Both active explorers (Explorer 2 and 3) arrived at the same mathematical and architectural conclusions.

## Gaps
- **E2E/Unit testing setup**: We need to implement a automated test script that loads the ground-truth image, simulates the canvas crop, applies preprocessing, and verifies that the barcode is successfully decoded. This script will serve as the verification for M2.
