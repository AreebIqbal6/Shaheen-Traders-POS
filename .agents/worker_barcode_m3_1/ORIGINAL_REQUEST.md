# Worker M3 Request — 2026-06-28T00:10:46Z

## Objective
Implement the barcode and QR scanner fixes in `src/components/CodeScanner.tsx` (Milestone M3) to achieve robust EAN-13, UPC-A, and CODE-128 barcode scanning under webcam feed and ground-truth image, while maintaining QR scanning and custom resizable UI.

## Requirements
1. **Migration to `@zxing/library`**:
   - Remove imports from `barcode-detector/pure`.
   - Import necessary classes from `@zxing/library`: `MultiFormatReader`, `BarcodeFormat`, `DecodeHintType`, `RGBLuminanceSource`, `BinaryBitmap`, `HybridBinarizer`.
   - Initialize and configure the `MultiFormatReader` in the component (or in `useEffect`). Configure hints with `TRY_HARDER` enabled and possible formats set to `QR_CODE`, `EAN_13`, `EAN_8`, `UPC_A`, `UPC_E`, `CODE_128`, `CODE_39`, and `ITF`.
2. **Aspect Ratio and Cropping Fix**:
   - Re-implement the crop coordinates calculation in the scan loop.
   - Calculate uniform scale factor for `object-fit: cover` and map the centered box size back to the native stream resolution without stretching/squishing.
   - Scale/upscale the crop canvas to a fixed high resolution (e.g. 480x480 or 640x640) to prevent sub-pixel aliasing.
3. **Canvas Preprocessing Filters**:
   - Apply a grayscale/contrast filter before or after drawing the crop frame to the canvas (e.g. via `ctx.filter` or image pixel manipulation).
   - Implement the red laser line removal filter by scanning for red-dominant pixels in the crop canvas and replacing them with nearby pixels from a few rows above.
4. **Error Handling & State Preservation**:
   - Keep the existing state: resizable box (using `boxSize`), torch toggle, camera flip (isMirrored), close, error notifications, etc.
   - Ensure the component layout, styles, custom elements (corner brackets, drag handle, laser line CSS animation) are completely untouched.

## Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Output Requirements
Write your final findings as a handoff report at:
`C:\Users\Noman Traders\.gemini\antigravity\scratch\pos-app\.agents\worker_barcode_m3_1\handoff.md`
Verify the application compiles and passes standard builds/lints, and describe the implementation details.

## 2026-06-27T19:27:39Z
<USER_REQUEST>
You are Worker 2 (M3). Your working directory is C:\Users\Noman Traders\.gemini\antigravity\scratch\pos-app\.agents\worker_barcode_m3_1. Read original request in C:\Users\Noman Traders\.gemini\antigravity\scratch\pos-app\.agents\worker_barcode_m3_1\ORIGINAL_REQUEST.md. Modify `src/components/CodeScanner.tsx` to implement the barcode and QR scanner fixes (migration to `@zxing/library`, crop math correction, canvas upscaling, preprocessing/laser removal). Verify the changes compile successfully. Save your handoff report at C:\Users\Noman Traders\.gemini\antigravity\scratch\pos-app\.agents\worker_barcode_m3_1\handoff.md.
</USER_REQUEST>
<ADDITIONAL_METADATA>
The current local time is: 2026-06-28T00:27:39+05:00.
</ADDITIONAL_METADATA>

## 2026-06-27T19:40:10Z
**Context**: Barcode scanner engine fix (Milestone M3).
**Content**: I noticed that your progress.md file has not been updated since 19:27:39Z, and it has been more than 12 minutes.
**Action**: Please let me know your current status, whether you are blocked, and when you expect to complete the code changes in `CodeScanner.tsx`.
