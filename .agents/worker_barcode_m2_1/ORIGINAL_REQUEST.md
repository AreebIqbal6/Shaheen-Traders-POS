# Worker M2 Request — 2026-06-28T00:10:46Z

## Objective
Establish the test suite (Milestone M2) by writing a standalone script or unit test to decode the ground-truth barcode from `uploaded_media_1782585188338.png`.

## Requirements
1. Create a script (e.g. `test-barcode-decoding.cjs` at project root or a playwright test) that:
   - Loads the ground-truth image: `C:\Users\Noman Traders\.gemini\antigravity\brain\611fb8ae-eb0b-42e8-8ab6-0768780782e2\uploaded_media_1782585188338.png`.
   - Simulates the scanner cropping. (Note: the barcode is located around the center of the image. The visual scan box has a size of 250px inside a container).
   - Feeds the image (or cropped portion) into the `@zxing/library` engine.
   - You must enable `TRY_HARDER` and other hints.
   - If decoding fails, implement the image preprocessing steps recommended by the explorers (e.g. grayscaling, contrast boosting, and replacing red-dominant pixels from the laser line).
   - Verify that it successfully decodes the barcode value (EAN-13 format) and print the decoded value.
2. Run the script and check if it succeeds or fails. Document the results.
3. Make sure the script can be executed using a simple command (e.g. `node test-barcode-decoding.cjs`).

## Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Output Requirements
Write your final findings as a handoff report at:
`C:\Users\Noman Traders\.gemini\antigravity\scratch\pos-app\.agents\worker_barcode_m2_1\handoff.md`
Include the path to the test script and command to run it.
