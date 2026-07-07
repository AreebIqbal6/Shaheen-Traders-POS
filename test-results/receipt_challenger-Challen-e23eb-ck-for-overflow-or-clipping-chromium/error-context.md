# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: receipt_challenger.spec.ts >> Challenger Receipt Layout and PDF Export stress tests >> 25 items (long names causing wrapping) - check for overflow or clipping
- Location: e2e\receipt_challenger.spec.ts:79:3

# Error details

```
Error: locator.boundingBox: Error: strict mode violation: locator('.receipt-page') resolved to 2 elements:
    1) <div class="receipt-page bg-white text-black font-sans w-[210mm] h-[297mm] mx-auto p-[10mm] print:w-[210mm] print:h-[297mm] print:p-[10mm] print:m-0 print:break-after-page shadow-sm border border-slate-200 print:border-none print:shadow-none flex flex-col [print-color-adjust:exact] [-webkit-print-color-adjust:exact]">…</div> aka getByText('stress-25-longSHAHEEN').first()
    2) <div class="receipt-page bg-white text-black font-sans w-[210mm] h-[297mm] mx-auto p-[10mm] print:w-[210mm] print:h-[297mm] print:p-[10mm] print:m-0 print:break-after-page shadow-sm border border-slate-200 print:border-none print:shadow-none flex flex-col [print-color-adjust:exact] [-webkit-print-color-adjust:exact]">…</div> aka getByText('stress-25-longSHAHEEN').nth(1)

Call log:
  - waiting for locator('.receipt-page')

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e4]:
    - link "Back" [ref=e5] [cursor=pointer]:
      - /url: /booker
      - img [ref=e6]
      - generic [ref=e8]: Back
    - generic [ref=e9]:
      - button "Print" [ref=e10]:
        - img [ref=e11]
        - text: Print
      - button "Save Backup" [ref=e15]:
        - img [ref=e16]
        - text: Save Backup
  - generic [ref=e21]:
    - generic [ref=e22]:
      - generic [ref=e23]:
        - generic [ref=e24]:
          - img [ref=e25]
          - generic [ref=e80]: stress-25-long
        - img "Shaheen Logo" [ref=e82]
        - img [ref=e84]
      - generic [ref=e87]:
        - heading "SHAHEEN WHOLESALE" [level=1] [ref=e88]
        - generic [ref=e89]:
          - generic [ref=e90]: Main Samnabad, Lahore
          - generic [ref=e91]: •
          - generic [ref=e92]: 0318 2345703
          - generic [ref=e93]: •
          - generic [ref=e94]: INFO@SHAHEENTRADERS.COM
      - generic [ref=e96]:
        - generic [ref=e97]:
          - generic [ref=e98]: "SHOP NAME:"
          - generic [ref=e99]: Stress Test Shop 25
        - generic [ref=e100]:
          - generic [ref=e101]: "AREA:"
          - generic [ref=e102]: Samnabad, Lahore
        - generic [ref=e103]:
          - generic [ref=e104]: "DATE OF DELIVERY:"
          - generic [ref=e105]: 06/07/2026
        - generic [ref=e106]:
          - generic [ref=e107]: "BOOKER NAME:"
          - generic [ref=e108]: Mock Booker
        - generic [ref=e109]:
          - generic [ref=e110]: "CONTACT NUMBER:"
          - generic [ref=e111]: "-"
        - generic [ref=e112]:
          - generic [ref=e113]: "ORDER ID:"
          - generic [ref=e114]: stress-25-long
      - table [ref=e116]:
        - rowgroup [ref=e117]:
          - row "S.No SKU Prod ID Product Name Quantity Rate Amount" [ref=e118]:
            - columnheader "S.No" [ref=e119]
            - columnheader "SKU" [ref=e120]
            - columnheader "Prod ID" [ref=e121]
            - columnheader "Product Name" [ref=e122]
            - columnheader "Quantity" [ref=e123]
            - columnheader "Rate" [ref=e124]
            - columnheader "Amount" [ref=e125]
        - rowgroup [ref=e126]:
          - row "1 SKU-000 1000000 Product 0 Super Extra Long Name that will definitely wrap to multiple lines on the receipt table row 2 Pcs 100.00 200.00" [ref=e127]:
            - cell "1" [ref=e128]
            - cell "SKU-000" [ref=e129]
            - cell "1000000" [ref=e130]
            - cell "Product 0 Super Extra Long Name that will definitely wrap to multiple lines on the receipt table row" [ref=e131]
            - cell "2 Pcs" [ref=e132]
            - cell "100.00" [ref=e133]
            - cell "200.00" [ref=e134]
          - row "2 SKU-001 1000001 Product 1 Super Extra Long Name that will definitely wrap to multiple lines on the receipt table row 2 Pcs 200.00 400.00" [ref=e135]:
            - cell "2" [ref=e136]
            - cell "SKU-001" [ref=e137]
            - cell "1000001" [ref=e138]
            - cell "Product 1 Super Extra Long Name that will definitely wrap to multiple lines on the receipt table row" [ref=e139]
            - cell "2 Pcs" [ref=e140]
            - cell "200.00" [ref=e141]
            - cell "400.00" [ref=e142]
          - row "3 SKU-002 1000002 Product 2 Super Extra Long Name that will definitely wrap to multiple lines on the receipt table row 2 Pcs 300.00 600.00" [ref=e143]:
            - cell "3" [ref=e144]
            - cell "SKU-002" [ref=e145]
            - cell "1000002" [ref=e146]
            - cell "Product 2 Super Extra Long Name that will definitely wrap to multiple lines on the receipt table row" [ref=e147]
            - cell "2 Pcs" [ref=e148]
            - cell "300.00" [ref=e149]
            - cell "600.00" [ref=e150]
          - row "4 SKU-003 1000003 Product 3 Super Extra Long Name that will definitely wrap to multiple lines on the receipt table row 2 Pcs 400.00 800.00" [ref=e151]:
            - cell "4" [ref=e152]
            - cell "SKU-003" [ref=e153]
            - cell "1000003" [ref=e154]
            - cell "Product 3 Super Extra Long Name that will definitely wrap to multiple lines on the receipt table row" [ref=e155]
            - cell "2 Pcs" [ref=e156]
            - cell "400.00" [ref=e157]
            - cell "800.00" [ref=e158]
          - row "5 SKU-004 1000004 Product 4 Super Extra Long Name that will definitely wrap to multiple lines on the receipt table row 2 Pcs 500.00 1000.00" [ref=e159]:
            - cell "5" [ref=e160]
            - cell "SKU-004" [ref=e161]
            - cell "1000004" [ref=e162]
            - cell "Product 4 Super Extra Long Name that will definitely wrap to multiple lines on the receipt table row" [ref=e163]
            - cell "2 Pcs" [ref=e164]
            - cell "500.00" [ref=e165]
            - cell "1000.00" [ref=e166]
          - row "6 SKU-005 1000005 Product 5 Super Extra Long Name that will definitely wrap to multiple lines on the receipt table row 2 Pcs 600.00 1200.00" [ref=e167]:
            - cell "6" [ref=e168]
            - cell "SKU-005" [ref=e169]
            - cell "1000005" [ref=e170]
            - cell "Product 5 Super Extra Long Name that will definitely wrap to multiple lines on the receipt table row" [ref=e171]
            - cell "2 Pcs" [ref=e172]
            - cell "600.00" [ref=e173]
            - cell "1200.00" [ref=e174]
          - row "7 SKU-006 1000006 Product 6 Super Extra Long Name that will definitely wrap to multiple lines on the receipt table row 2 Pcs 700.00 1400.00" [ref=e175]:
            - cell "7" [ref=e176]
            - cell "SKU-006" [ref=e177]
            - cell "1000006" [ref=e178]
            - cell "Product 6 Super Extra Long Name that will definitely wrap to multiple lines on the receipt table row" [ref=e179]
            - cell "2 Pcs" [ref=e180]
            - cell "700.00" [ref=e181]
            - cell "1400.00" [ref=e182]
          - row "8 SKU-007 1000007 Product 7 Super Extra Long Name that will definitely wrap to multiple lines on the receipt table row 2 Pcs 800.00 1600.00" [ref=e183]:
            - cell "8" [ref=e184]
            - cell "SKU-007" [ref=e185]
            - cell "1000007" [ref=e186]
            - cell "Product 7 Super Extra Long Name that will definitely wrap to multiple lines on the receipt table row" [ref=e187]
            - cell "2 Pcs" [ref=e188]
            - cell "800.00" [ref=e189]
            - cell "1600.00" [ref=e190]
          - row "9 SKU-008 1000008 Product 8 Super Extra Long Name that will definitely wrap to multiple lines on the receipt table row 2 Pcs 900.00 1800.00" [ref=e191]:
            - cell "9" [ref=e192]
            - cell "SKU-008" [ref=e193]
            - cell "1000008" [ref=e194]
            - cell "Product 8 Super Extra Long Name that will definitely wrap to multiple lines on the receipt table row" [ref=e195]
            - cell "2 Pcs" [ref=e196]
            - cell "900.00" [ref=e197]
            - cell "1800.00" [ref=e198]
          - row "10 SKU-009 1000009 Product 9 Super Extra Long Name that will definitely wrap to multiple lines on the receipt table row 2 Pcs 1000.00 2000.00" [ref=e199]:
            - cell "10" [ref=e200]
            - cell "SKU-009" [ref=e201]
            - cell "1000009" [ref=e202]
            - cell "Product 9 Super Extra Long Name that will definitely wrap to multiple lines on the receipt table row" [ref=e203]
            - cell "2 Pcs" [ref=e204]
            - cell "1000.00" [ref=e205]
            - cell "2000.00" [ref=e206]
          - row "11 SKU-0010 10000010 Product 10 Super Extra Long Name that will definitely wrap to multiple lines on the receipt table row 2 Pcs 1100.00 2200.00" [ref=e207]:
            - cell "11" [ref=e208]
            - cell "SKU-0010" [ref=e209]
            - cell "10000010" [ref=e210]
            - cell "Product 10 Super Extra Long Name that will definitely wrap to multiple lines on the receipt table row" [ref=e211]
            - cell "2 Pcs" [ref=e212]
            - cell "1100.00" [ref=e213]
            - cell "2200.00" [ref=e214]
          - row "12 SKU-0011 10000011 Product 11 Super Extra Long Name that will definitely wrap to multiple lines on the receipt table row 2 Pcs 1200.00 2400.00" [ref=e215]:
            - cell "12" [ref=e216]
            - cell "SKU-0011" [ref=e217]
            - cell "10000011" [ref=e218]
            - cell "Product 11 Super Extra Long Name that will definitely wrap to multiple lines on the receipt table row" [ref=e219]
            - cell "2 Pcs" [ref=e220]
            - cell "1200.00" [ref=e221]
            - cell "2400.00" [ref=e222]
          - row "13 SKU-0012 10000012 Product 12 Super Extra Long Name that will definitely wrap to multiple lines on the receipt table row 2 Pcs 1300.00 2600.00" [ref=e223]:
            - cell "13" [ref=e224]
            - cell "SKU-0012" [ref=e225]
            - cell "10000012" [ref=e226]
            - cell "Product 12 Super Extra Long Name that will definitely wrap to multiple lines on the receipt table row" [ref=e227]
            - cell "2 Pcs" [ref=e228]
            - cell "1300.00" [ref=e229]
            - cell "2600.00" [ref=e230]
          - row "14 SKU-0013 10000013 Product 13 Super Extra Long Name that will definitely wrap to multiple lines on the receipt table row 2 Pcs 1400.00 2800.00" [ref=e231]:
            - cell "14" [ref=e232]
            - cell "SKU-0013" [ref=e233]
            - cell "10000013" [ref=e234]
            - cell "Product 13 Super Extra Long Name that will definitely wrap to multiple lines on the receipt table row" [ref=e235]
            - cell "2 Pcs" [ref=e236]
            - cell "1400.00" [ref=e237]
            - cell "2800.00" [ref=e238]
          - row "15 SKU-0014 10000014 Product 14 Super Extra Long Name that will definitely wrap to multiple lines on the receipt table row 2 Pcs 1500.00 3000.00" [ref=e239]:
            - cell "15" [ref=e240]
            - cell "SKU-0014" [ref=e241]
            - cell "10000014" [ref=e242]
            - cell "Product 14 Super Extra Long Name that will definitely wrap to multiple lines on the receipt table row" [ref=e243]
            - cell "2 Pcs" [ref=e244]
            - cell "1500.00" [ref=e245]
            - cell "3000.00" [ref=e246]
          - row "16 SKU-0015 10000015 Product 15 Super Extra Long Name that will definitely wrap to multiple lines on the receipt table row 2 Pcs 1600.00 3200.00" [ref=e247]:
            - cell "16" [ref=e248]
            - cell "SKU-0015" [ref=e249]
            - cell "10000015" [ref=e250]
            - cell "Product 15 Super Extra Long Name that will definitely wrap to multiple lines on the receipt table row" [ref=e251]
            - cell "2 Pcs" [ref=e252]
            - cell "1600.00" [ref=e253]
            - cell "3200.00" [ref=e254]
          - row "17 SKU-0016 10000016 Product 16 Super Extra Long Name that will definitely wrap to multiple lines on the receipt table row 2 Pcs 1700.00 3400.00" [ref=e255]:
            - cell "17" [ref=e256]
            - cell "SKU-0016" [ref=e257]
            - cell "10000016" [ref=e258]
            - cell "Product 16 Super Extra Long Name that will definitely wrap to multiple lines on the receipt table row" [ref=e259]
            - cell "2 Pcs" [ref=e260]
            - cell "1700.00" [ref=e261]
            - cell "3400.00" [ref=e262]
          - row "18 SKU-0017 10000017 Product 17 Super Extra Long Name that will definitely wrap to multiple lines on the receipt table row 2 Pcs 1800.00 3600.00" [ref=e263]:
            - cell "18" [ref=e264]
            - cell "SKU-0017" [ref=e265]
            - cell "10000017" [ref=e266]
            - cell "Product 17 Super Extra Long Name that will definitely wrap to multiple lines on the receipt table row" [ref=e267]
            - cell "2 Pcs" [ref=e268]
            - cell "1800.00" [ref=e269]
            - cell "3600.00" [ref=e270]
          - row "19 SKU-0018 10000018 Product 18 Super Extra Long Name that will definitely wrap to multiple lines on the receipt table row 2 Pcs 1900.00 3800.00" [ref=e271]:
            - cell "19" [ref=e272]
            - cell "SKU-0018" [ref=e273]
            - cell "10000018" [ref=e274]
            - cell "Product 18 Super Extra Long Name that will definitely wrap to multiple lines on the receipt table row" [ref=e275]
            - cell "2 Pcs" [ref=e276]
            - cell "1900.00" [ref=e277]
            - cell "3800.00" [ref=e278]
          - row "20 SKU-0019 10000019 Product 19 Super Extra Long Name that will definitely wrap to multiple lines on the receipt table row 2 Pcs 2000.00 4000.00" [ref=e279]:
            - cell "20" [ref=e280]
            - cell "SKU-0019" [ref=e281]
            - cell "10000019" [ref=e282]
            - cell "Product 19 Super Extra Long Name that will definitely wrap to multiple lines on the receipt table row" [ref=e283]
            - cell "2 Pcs" [ref=e284]
            - cell "2000.00" [ref=e285]
            - cell "4000.00" [ref=e286]
      - generic [ref=e288]: PAGE 1 OF 2
    - generic [ref=e289]:
      - generic [ref=e290]:
        - generic [ref=e291]:
          - img [ref=e292]
          - generic [ref=e347]: stress-25-long
        - img "Shaheen Logo" [ref=e349]
        - img [ref=e351]
      - generic [ref=e354]:
        - heading "SHAHEEN WHOLESALE" [level=1] [ref=e355]
        - generic [ref=e356]:
          - generic [ref=e357]: Main Samnabad, Lahore
          - generic [ref=e358]: •
          - generic [ref=e359]: 0318 2345703
          - generic [ref=e360]: •
          - generic [ref=e361]: INFO@SHAHEENTRADERS.COM
      - generic [ref=e363]:
        - generic [ref=e364]:
          - generic [ref=e365]: "SHOP NAME:"
          - generic [ref=e366]: Stress Test Shop 25
        - generic [ref=e367]:
          - generic [ref=e368]: "AREA:"
          - generic [ref=e369]: Samnabad, Lahore
        - generic [ref=e370]:
          - generic [ref=e371]: "DATE OF DELIVERY:"
          - generic [ref=e372]: 06/07/2026
        - generic [ref=e373]:
          - generic [ref=e374]: "BOOKER NAME:"
          - generic [ref=e375]: Mock Booker
        - generic [ref=e376]:
          - generic [ref=e377]: "CONTACT NUMBER:"
          - generic [ref=e378]: "-"
        - generic [ref=e379]:
          - generic [ref=e380]: "ORDER ID:"
          - generic [ref=e381]: stress-25-long
      - table [ref=e383]:
        - rowgroup [ref=e384]:
          - row "S.No SKU Prod ID Product Name Quantity Rate Amount" [ref=e385]:
            - columnheader "S.No" [ref=e386]
            - columnheader "SKU" [ref=e387]
            - columnheader "Prod ID" [ref=e388]
            - columnheader "Product Name" [ref=e389]
            - columnheader "Quantity" [ref=e390]
            - columnheader "Rate" [ref=e391]
            - columnheader "Amount" [ref=e392]
        - rowgroup [ref=e393]:
          - row "21 SKU-0020 10000020 Product 20 Super Extra Long Name that will definitely wrap to multiple lines on the receipt table row 2 Pcs 2100.00 4200.00" [ref=e394]:
            - cell "21" [ref=e395]
            - cell "SKU-0020" [ref=e396]
            - cell "10000020" [ref=e397]
            - cell "Product 20 Super Extra Long Name that will definitely wrap to multiple lines on the receipt table row" [ref=e398]
            - cell "2 Pcs" [ref=e399]
            - cell "2100.00" [ref=e400]
            - cell "4200.00" [ref=e401]
          - row "22 SKU-0021 10000021 Product 21 Super Extra Long Name that will definitely wrap to multiple lines on the receipt table row 2 Pcs 2200.00 4400.00" [ref=e402]:
            - cell "22" [ref=e403]
            - cell "SKU-0021" [ref=e404]
            - cell "10000021" [ref=e405]
            - cell "Product 21 Super Extra Long Name that will definitely wrap to multiple lines on the receipt table row" [ref=e406]
            - cell "2 Pcs" [ref=e407]
            - cell "2200.00" [ref=e408]
            - cell "4400.00" [ref=e409]
          - row "23 SKU-0022 10000022 Product 22 Super Extra Long Name that will definitely wrap to multiple lines on the receipt table row 2 Pcs 2300.00 4600.00" [ref=e410]:
            - cell "23" [ref=e411]
            - cell "SKU-0022" [ref=e412]
            - cell "10000022" [ref=e413]
            - cell "Product 22 Super Extra Long Name that will definitely wrap to multiple lines on the receipt table row" [ref=e414]
            - cell "2 Pcs" [ref=e415]
            - cell "2300.00" [ref=e416]
            - cell "4600.00" [ref=e417]
          - row "24 SKU-0023 10000023 Product 23 Super Extra Long Name that will definitely wrap to multiple lines on the receipt table row 2 Pcs 2400.00 4800.00" [ref=e418]:
            - cell "24" [ref=e419]
            - cell "SKU-0023" [ref=e420]
            - cell "10000023" [ref=e421]
            - cell "Product 23 Super Extra Long Name that will definitely wrap to multiple lines on the receipt table row" [ref=e422]
            - cell "2 Pcs" [ref=e423]
            - cell "2400.00" [ref=e424]
            - cell "4800.00" [ref=e425]
          - row "25 SKU-0024 10000024 Product 24 Super Extra Long Name that will definitely wrap to multiple lines on the receipt table row 2 Pcs 2500.00 5000.00" [ref=e426]:
            - cell "25" [ref=e427]
            - cell "SKU-0024" [ref=e428]
            - cell "10000024" [ref=e429]
            - cell "Product 24 Super Extra Long Name that will definitely wrap to multiple lines on the receipt table row" [ref=e430]
            - cell "2 Pcs" [ref=e431]
            - cell "2500.00" [ref=e432]
            - cell "5000.00" [ref=e433]
      - generic [ref=e434]:
        - generic [ref=e435]:
          - generic [ref=e436]:
            - generic [ref=e437]: "GRAND TOTAL:"
            - generic [ref=e438]: Rs. 65,000.00
          - generic [ref=e439]: "Amount in Words: sixty-five thousand Rupees Only"
        - generic [ref=e440]:
          - paragraph [ref=e442]: Authorized Sign
          - generic [ref=e443]:
            - generic [ref=e444]: PAGE 2 OF 2
            - generic [ref=e445]: SOFTWARE BY AREEB IQBAL
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('Challenger Receipt Layout and PDF Export stress tests', () => {
  4   |   const mockBooker = {
  5   |     id: 'mock-booker-id',
  6   |     booker_number: 'BKR-001',
  7   |     name: 'Mock Booker',
  8   |     username: 'booker',
  9   |     auth_token: btoa('pass')
  10  |   };
  11  | 
  12  |   // Helper to generate items
  13  |   const generateItems = (count: number, nameLength: 'short' | 'long' = 'short') => {
  14  |     return Array.from({ length: count }, (_, i) => ({
  15  |       id: `prod-${i}`,
  16  |       sku: `SKU-00${i}`,
  17  |       barcode: `100000${i}`,
  18  |       name: nameLength === 'short' ? `Product ${i}` : `Product ${i} Super Extra Long Name that will definitely wrap to multiple lines on the receipt table row`,
  19  |       price: 100 * (i + 1),
  20  |       quantity: 2,
  21  |       uom: 'Pcs'
  22  |     }));
  23  |   };
  24  | 
  25  |   const createOrder = (id: string, itemsCount: number, nameLength: 'short' | 'long' = 'short') => {
  26  |     const items = generateItems(itemsCount, nameLength);
  27  |     const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  28  |     return {
  29  |       id,
  30  |       client_name: 'Stress Test Shop ' + itemsCount,
  31  |       area: 'Samnabad, Lahore',
  32  |       booker_name: 'Mock Booker',
  33  |       payment_terms: 'Cash on Delivery',
  34  |       items,
  35  |       total,
  36  |       status: 'PENDING',
  37  |       source: 'BOOKER_APP',
  38  |       b2b_user_id: 'mock-booker-id',
  39  |       created_at: new Date().toISOString()
  40  |     };
  41  |   };
  42  | 
  43  |   test('25 items (short names) - check for overflow or clipping', async ({ page }) => {
  44  |     const order = createOrder('stress-25-short', 25, 'short');
  45  |     
  46  |     await page.goto('/booker');
  47  |     await page.evaluate((data) => {
  48  |       localStorage.clear();
  49  |       localStorage.setItem('shaheen_active_booker', JSON.stringify(data.bkr));
  50  |       localStorage.setItem('shaheen_offline_orders', JSON.stringify([data.order]));
  51  |     }, { bkr: mockBooker, order });
  52  | 
  53  |     await page.goto('/receipt/stress-25-short');
  54  |     
  55  |     // Wait for the receipt page to load
  56  |     await expect(page.getByText('Stress Test Shop 25').first()).toBeVisible();
  57  | 
  58  |     // Check if the receipt-page container height is exactly 297mm
  59  |     // 297mm in pixels is approximately 1122px (at 96 DPI)
  60  |     const pageBox = await page.locator('.receipt-page').boundingBox();
  61  |     expect(pageBox).not.toBeNull();
  62  |     console.log(`Page Box 25 short: width=${pageBox?.width}, height=${pageBox?.height}`);
  63  | 
  64  |     // Check if the totals/signatures are within the receipt page bounding box.
  65  |     // Specifically, the bottom-most element (like the authorized sign or software signature)
  66  |     // should not exceed the page height.
  67  |     const signatureBox = await page.getByText('Authorized Sign').boundingBox();
  68  |     expect(signatureBox).not.toBeNull();
  69  |     
  70  |     const pageBottom = pageBox!.y + pageBox!.height;
  71  |     const signatureBottom = signatureBox!.y + signatureBox!.height;
  72  |     
  73  |     console.log(`Page bottom: ${pageBottom}, Signature bottom: ${signatureBottom}`);
  74  |     
  75  |     // If signature bottom > page bottom, it has overflowed and is clipped due to overflow-hidden!
  76  |     expect(signatureBottom).toBeLessThanOrEqual(pageBottom);
  77  |   });
  78  | 
  79  |   test('25 items (long names causing wrapping) - check for overflow or clipping', async ({ page }) => {
  80  |     const order = createOrder('stress-25-long', 25, 'long');
  81  |     
  82  |     await page.goto('/booker');
  83  |     await page.evaluate((data) => {
  84  |       localStorage.clear();
  85  |       localStorage.setItem('shaheen_active_booker', JSON.stringify(data.bkr));
  86  |       localStorage.setItem('shaheen_offline_orders', JSON.stringify([data.order]));
  87  |     }, { bkr: mockBooker, order });
  88  | 
  89  |     await page.goto('/receipt/stress-25-long');
  90  |     
  91  |     // Wait for the receipt page to load
  92  |     await expect(page.getByText('Stress Test Shop 25').first()).toBeVisible();
  93  | 
> 94  |     const pageBox = await page.locator('.receipt-page').boundingBox();
      |                                                         ^ Error: locator.boundingBox: Error: strict mode violation: locator('.receipt-page') resolved to 2 elements:
  95  |     expect(pageBox).not.toBeNull();
  96  |     console.log(`Page Box 25 long: width=${pageBox?.width}, height=${pageBox?.height}`);
  97  | 
  98  |     const signatureBox = await page.getByText('Authorized Sign').boundingBox();
  99  |     expect(signatureBox).not.toBeNull();
  100 |     
  101 |     const pageBottom = pageBox!.y + pageBox!.height;
  102 |     const signatureBottom = signatureBox!.y + signatureBox!.height;
  103 |     
  104 |     console.log(`Page bottom: ${pageBottom}, Signature bottom: ${signatureBottom}`);
  105 |     
  106 |     // Check if it overflows!
  107 |     expect(signatureBottom).toBeLessThanOrEqual(pageBottom);
  108 |   });
  109 | 
  110 |   test('mobile viewport - check if receipt page is clipped horizontally', async ({ page }) => {
  111 |     // Set viewport to mobile size
  112 |     await page.setViewportSize({ width: 375, height: 667 });
  113 | 
  114 |     const order = createOrder('stress-mobile', 5, 'short');
  115 |     
  116 |     await page.goto('/booker');
  117 |     await page.evaluate((data) => {
  118 |       localStorage.clear();
  119 |       localStorage.setItem('shaheen_active_booker', JSON.stringify(data.bkr));
  120 |       localStorage.setItem('shaheen_offline_orders', JSON.stringify([data.order]));
  121 |     }, { bkr: mockBooker, order });
  122 | 
  123 |     await page.goto('/receipt/stress-mobile');
  124 |     
  125 |     // Wait for the receipt page to load
  126 |     await expect(page.getByText('Stress Test Shop 5')).toBeVisible();
  127 | 
  128 |     const pageBox = await page.locator('.receipt-page').boundingBox();
  129 |     expect(pageBox).not.toBeNull();
  130 |     console.log(`Mobile viewport receipt-page: width=${pageBox?.width}, height=${pageBox?.height}`);
  131 | 
  132 |     // The receipt page width is set to w-[210mm] (approx 794px)
  133 |     // On a 375px wide mobile screen, if there is no scaling, it will overflow the screen width.
  134 |     // Let's verify if the parent container clips it.
  135 |     const parentBox = await page.locator('.bg-white.shadow-xl.border.border-slate-200').boundingBox();
  136 |     expect(parentBox).not.toBeNull();
  137 |     console.log(`Mobile viewport parent container: width=${parentBox?.width}, height=${parentBox?.height}`);
  138 | 
  139 |     // The receipt page should not overflow or be clipped by the parent container because the parent is now at least the same width
  140 |     expect(pageBox!.width).toBeLessThanOrEqual(parentBox!.width);
  141 |     
  142 |     // Let's check if the QR code (which is on the right side of the receipt header) is within the parent container's visible bounds.
  143 |     // The QR code is a svg element inside the receipt-page.
  144 |     const qrCode = page.locator('.receipt-page svg').nth(1); // the second svg should be the QR code (first is barcode)
  145 |     const qrBox = await qrCode.boundingBox();
  146 |     expect(qrBox).not.toBeNull();
  147 |     
  148 |     const parentRight = parentBox!.x + parentBox!.width;
  149 |     const qrRight = qrBox!.x + qrBox!.width;
  150 |     console.log(`Parent Right: ${parentRight}, QR Code Right: ${qrRight}`);
  151 |     
  152 |     // Since horizontal scrolling is enabled, the QR code is fully contained within the parent's layout
  153 |     expect(qrRight).toBeLessThanOrEqual(parentRight);
  154 | 
  155 |     // Verify that the wrapper container has scroll overflow active
  156 |     const scrollContainer = page.locator('.overflow-x-auto');
  157 |     const scrollWidth = await scrollContainer.evaluate(el => el.scrollWidth);
  158 |     const clientWidth = await scrollContainer.evaluate(el => el.clientWidth);
  159 |     expect(scrollWidth).toBeGreaterThan(clientWidth);
  160 |   });
  161 | });
  162 | 
  163 | 
```