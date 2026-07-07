# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: receipt_challenger.spec.ts >> Challenger Receipt Layout and PDF Export stress tests >> 25 items (short names) - check for overflow or clipping
- Location: e2e\receipt_challenger.spec.ts:43:3

# Error details

```
Error: locator.boundingBox: Error: strict mode violation: locator('.receipt-page') resolved to 2 elements:
    1) <div class="receipt-page bg-white text-black font-sans w-[210mm] h-[297mm] mx-auto p-[10mm] print:w-[210mm] print:h-[297mm] print:p-[10mm] print:m-0 print:break-after-page shadow-sm border border-slate-200 print:border-none print:shadow-none flex flex-col [print-color-adjust:exact] [-webkit-print-color-adjust:exact]">…</div> aka getByText('stress-25-shortSHAHEEN').first()
    2) <div class="receipt-page bg-white text-black font-sans w-[210mm] h-[297mm] mx-auto p-[10mm] print:w-[210mm] print:h-[297mm] print:p-[10mm] print:m-0 print:break-after-page shadow-sm border border-slate-200 print:border-none print:shadow-none flex flex-col [print-color-adjust:exact] [-webkit-print-color-adjust:exact]">…</div> aka getByText('stress-25-shortSHAHEEN').nth(1)

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
          - generic [ref=e83]: stress-25-short
        - img "Shaheen Logo" [ref=e85]
        - img [ref=e87]
      - generic [ref=e90]:
        - heading "SHAHEEN WHOLESALE" [level=1] [ref=e91]
        - generic [ref=e92]:
          - generic [ref=e93]: Main Samnabad, Lahore
          - generic [ref=e94]: •
          - generic [ref=e95]: 0318 2345703
          - generic [ref=e96]: •
          - generic [ref=e97]: INFO@SHAHEENTRADERS.COM
      - generic [ref=e99]:
        - generic [ref=e100]:
          - generic [ref=e101]: "SHOP NAME:"
          - generic [ref=e102]: Stress Test Shop 25
        - generic [ref=e103]:
          - generic [ref=e104]: "AREA:"
          - generic [ref=e105]: Samnabad, Lahore
        - generic [ref=e106]:
          - generic [ref=e107]: "DATE OF DELIVERY:"
          - generic [ref=e108]: 06/07/2026
        - generic [ref=e109]:
          - generic [ref=e110]: "BOOKER NAME:"
          - generic [ref=e111]: Mock Booker
        - generic [ref=e112]:
          - generic [ref=e113]: "CONTACT NUMBER:"
          - generic [ref=e114]: "-"
        - generic [ref=e115]:
          - generic [ref=e116]: "ORDER ID:"
          - generic [ref=e117]: stress-25-short
      - table [ref=e119]:
        - rowgroup [ref=e120]:
          - row "S.No SKU Prod ID Product Name Quantity Rate Amount" [ref=e121]:
            - columnheader "S.No" [ref=e122]
            - columnheader "SKU" [ref=e123]
            - columnheader "Prod ID" [ref=e124]
            - columnheader "Product Name" [ref=e125]
            - columnheader "Quantity" [ref=e126]
            - columnheader "Rate" [ref=e127]
            - columnheader "Amount" [ref=e128]
        - rowgroup [ref=e129]:
          - row "1 SKU-000 1000000 Product 0 2 Pcs 100.00 200.00" [ref=e130]:
            - cell "1" [ref=e131]
            - cell "SKU-000" [ref=e132]
            - cell "1000000" [ref=e133]
            - cell "Product 0" [ref=e134]
            - cell "2 Pcs" [ref=e135]
            - cell "100.00" [ref=e136]
            - cell "200.00" [ref=e137]
          - row "2 SKU-001 1000001 Product 1 2 Pcs 200.00 400.00" [ref=e138]:
            - cell "2" [ref=e139]
            - cell "SKU-001" [ref=e140]
            - cell "1000001" [ref=e141]
            - cell "Product 1" [ref=e142]
            - cell "2 Pcs" [ref=e143]
            - cell "200.00" [ref=e144]
            - cell "400.00" [ref=e145]
          - row "3 SKU-002 1000002 Product 2 2 Pcs 300.00 600.00" [ref=e146]:
            - cell "3" [ref=e147]
            - cell "SKU-002" [ref=e148]
            - cell "1000002" [ref=e149]
            - cell "Product 2" [ref=e150]
            - cell "2 Pcs" [ref=e151]
            - cell "300.00" [ref=e152]
            - cell "600.00" [ref=e153]
          - row "4 SKU-003 1000003 Product 3 2 Pcs 400.00 800.00" [ref=e154]:
            - cell "4" [ref=e155]
            - cell "SKU-003" [ref=e156]
            - cell "1000003" [ref=e157]
            - cell "Product 3" [ref=e158]
            - cell "2 Pcs" [ref=e159]
            - cell "400.00" [ref=e160]
            - cell "800.00" [ref=e161]
          - row "5 SKU-004 1000004 Product 4 2 Pcs 500.00 1000.00" [ref=e162]:
            - cell "5" [ref=e163]
            - cell "SKU-004" [ref=e164]
            - cell "1000004" [ref=e165]
            - cell "Product 4" [ref=e166]
            - cell "2 Pcs" [ref=e167]
            - cell "500.00" [ref=e168]
            - cell "1000.00" [ref=e169]
          - row "6 SKU-005 1000005 Product 5 2 Pcs 600.00 1200.00" [ref=e170]:
            - cell "6" [ref=e171]
            - cell "SKU-005" [ref=e172]
            - cell "1000005" [ref=e173]
            - cell "Product 5" [ref=e174]
            - cell "2 Pcs" [ref=e175]
            - cell "600.00" [ref=e176]
            - cell "1200.00" [ref=e177]
          - row "7 SKU-006 1000006 Product 6 2 Pcs 700.00 1400.00" [ref=e178]:
            - cell "7" [ref=e179]
            - cell "SKU-006" [ref=e180]
            - cell "1000006" [ref=e181]
            - cell "Product 6" [ref=e182]
            - cell "2 Pcs" [ref=e183]
            - cell "700.00" [ref=e184]
            - cell "1400.00" [ref=e185]
          - row "8 SKU-007 1000007 Product 7 2 Pcs 800.00 1600.00" [ref=e186]:
            - cell "8" [ref=e187]
            - cell "SKU-007" [ref=e188]
            - cell "1000007" [ref=e189]
            - cell "Product 7" [ref=e190]
            - cell "2 Pcs" [ref=e191]
            - cell "800.00" [ref=e192]
            - cell "1600.00" [ref=e193]
          - row "9 SKU-008 1000008 Product 8 2 Pcs 900.00 1800.00" [ref=e194]:
            - cell "9" [ref=e195]
            - cell "SKU-008" [ref=e196]
            - cell "1000008" [ref=e197]
            - cell "Product 8" [ref=e198]
            - cell "2 Pcs" [ref=e199]
            - cell "900.00" [ref=e200]
            - cell "1800.00" [ref=e201]
          - row "10 SKU-009 1000009 Product 9 2 Pcs 1000.00 2000.00" [ref=e202]:
            - cell "10" [ref=e203]
            - cell "SKU-009" [ref=e204]
            - cell "1000009" [ref=e205]
            - cell "Product 9" [ref=e206]
            - cell "2 Pcs" [ref=e207]
            - cell "1000.00" [ref=e208]
            - cell "2000.00" [ref=e209]
          - row "11 SKU-0010 10000010 Product 10 2 Pcs 1100.00 2200.00" [ref=e210]:
            - cell "11" [ref=e211]
            - cell "SKU-0010" [ref=e212]
            - cell "10000010" [ref=e213]
            - cell "Product 10" [ref=e214]
            - cell "2 Pcs" [ref=e215]
            - cell "1100.00" [ref=e216]
            - cell "2200.00" [ref=e217]
          - row "12 SKU-0011 10000011 Product 11 2 Pcs 1200.00 2400.00" [ref=e218]:
            - cell "12" [ref=e219]
            - cell "SKU-0011" [ref=e220]
            - cell "10000011" [ref=e221]
            - cell "Product 11" [ref=e222]
            - cell "2 Pcs" [ref=e223]
            - cell "1200.00" [ref=e224]
            - cell "2400.00" [ref=e225]
          - row "13 SKU-0012 10000012 Product 12 2 Pcs 1300.00 2600.00" [ref=e226]:
            - cell "13" [ref=e227]
            - cell "SKU-0012" [ref=e228]
            - cell "10000012" [ref=e229]
            - cell "Product 12" [ref=e230]
            - cell "2 Pcs" [ref=e231]
            - cell "1300.00" [ref=e232]
            - cell "2600.00" [ref=e233]
          - row "14 SKU-0013 10000013 Product 13 2 Pcs 1400.00 2800.00" [ref=e234]:
            - cell "14" [ref=e235]
            - cell "SKU-0013" [ref=e236]
            - cell "10000013" [ref=e237]
            - cell "Product 13" [ref=e238]
            - cell "2 Pcs" [ref=e239]
            - cell "1400.00" [ref=e240]
            - cell "2800.00" [ref=e241]
          - row "15 SKU-0014 10000014 Product 14 2 Pcs 1500.00 3000.00" [ref=e242]:
            - cell "15" [ref=e243]
            - cell "SKU-0014" [ref=e244]
            - cell "10000014" [ref=e245]
            - cell "Product 14" [ref=e246]
            - cell "2 Pcs" [ref=e247]
            - cell "1500.00" [ref=e248]
            - cell "3000.00" [ref=e249]
          - row "16 SKU-0015 10000015 Product 15 2 Pcs 1600.00 3200.00" [ref=e250]:
            - cell "16" [ref=e251]
            - cell "SKU-0015" [ref=e252]
            - cell "10000015" [ref=e253]
            - cell "Product 15" [ref=e254]
            - cell "2 Pcs" [ref=e255]
            - cell "1600.00" [ref=e256]
            - cell "3200.00" [ref=e257]
          - row "17 SKU-0016 10000016 Product 16 2 Pcs 1700.00 3400.00" [ref=e258]:
            - cell "17" [ref=e259]
            - cell "SKU-0016" [ref=e260]
            - cell "10000016" [ref=e261]
            - cell "Product 16" [ref=e262]
            - cell "2 Pcs" [ref=e263]
            - cell "1700.00" [ref=e264]
            - cell "3400.00" [ref=e265]
          - row "18 SKU-0017 10000017 Product 17 2 Pcs 1800.00 3600.00" [ref=e266]:
            - cell "18" [ref=e267]
            - cell "SKU-0017" [ref=e268]
            - cell "10000017" [ref=e269]
            - cell "Product 17" [ref=e270]
            - cell "2 Pcs" [ref=e271]
            - cell "1800.00" [ref=e272]
            - cell "3600.00" [ref=e273]
          - row "19 SKU-0018 10000018 Product 18 2 Pcs 1900.00 3800.00" [ref=e274]:
            - cell "19" [ref=e275]
            - cell "SKU-0018" [ref=e276]
            - cell "10000018" [ref=e277]
            - cell "Product 18" [ref=e278]
            - cell "2 Pcs" [ref=e279]
            - cell "1900.00" [ref=e280]
            - cell "3800.00" [ref=e281]
          - row "20 SKU-0019 10000019 Product 19 2 Pcs 2000.00 4000.00" [ref=e282]:
            - cell "20" [ref=e283]
            - cell "SKU-0019" [ref=e284]
            - cell "10000019" [ref=e285]
            - cell "Product 19" [ref=e286]
            - cell "2 Pcs" [ref=e287]
            - cell "2000.00" [ref=e288]
            - cell "4000.00" [ref=e289]
      - generic [ref=e291]: PAGE 1 OF 2
    - generic [ref=e292]:
      - generic [ref=e293]:
        - generic [ref=e294]:
          - img [ref=e295]
          - generic [ref=e353]: stress-25-short
        - img "Shaheen Logo" [ref=e355]
        - img [ref=e357]
      - generic [ref=e360]:
        - heading "SHAHEEN WHOLESALE" [level=1] [ref=e361]
        - generic [ref=e362]:
          - generic [ref=e363]: Main Samnabad, Lahore
          - generic [ref=e364]: •
          - generic [ref=e365]: 0318 2345703
          - generic [ref=e366]: •
          - generic [ref=e367]: INFO@SHAHEENTRADERS.COM
      - generic [ref=e369]:
        - generic [ref=e370]:
          - generic [ref=e371]: "SHOP NAME:"
          - generic [ref=e372]: Stress Test Shop 25
        - generic [ref=e373]:
          - generic [ref=e374]: "AREA:"
          - generic [ref=e375]: Samnabad, Lahore
        - generic [ref=e376]:
          - generic [ref=e377]: "DATE OF DELIVERY:"
          - generic [ref=e378]: 06/07/2026
        - generic [ref=e379]:
          - generic [ref=e380]: "BOOKER NAME:"
          - generic [ref=e381]: Mock Booker
        - generic [ref=e382]:
          - generic [ref=e383]: "CONTACT NUMBER:"
          - generic [ref=e384]: "-"
        - generic [ref=e385]:
          - generic [ref=e386]: "ORDER ID:"
          - generic [ref=e387]: stress-25-short
      - table [ref=e389]:
        - rowgroup [ref=e390]:
          - row "S.No SKU Prod ID Product Name Quantity Rate Amount" [ref=e391]:
            - columnheader "S.No" [ref=e392]
            - columnheader "SKU" [ref=e393]
            - columnheader "Prod ID" [ref=e394]
            - columnheader "Product Name" [ref=e395]
            - columnheader "Quantity" [ref=e396]
            - columnheader "Rate" [ref=e397]
            - columnheader "Amount" [ref=e398]
        - rowgroup [ref=e399]:
          - row "21 SKU-0020 10000020 Product 20 2 Pcs 2100.00 4200.00" [ref=e400]:
            - cell "21" [ref=e401]
            - cell "SKU-0020" [ref=e402]
            - cell "10000020" [ref=e403]
            - cell "Product 20" [ref=e404]
            - cell "2 Pcs" [ref=e405]
            - cell "2100.00" [ref=e406]
            - cell "4200.00" [ref=e407]
          - row "22 SKU-0021 10000021 Product 21 2 Pcs 2200.00 4400.00" [ref=e408]:
            - cell "22" [ref=e409]
            - cell "SKU-0021" [ref=e410]
            - cell "10000021" [ref=e411]
            - cell "Product 21" [ref=e412]
            - cell "2 Pcs" [ref=e413]
            - cell "2200.00" [ref=e414]
            - cell "4400.00" [ref=e415]
          - row "23 SKU-0022 10000022 Product 22 2 Pcs 2300.00 4600.00" [ref=e416]:
            - cell "23" [ref=e417]
            - cell "SKU-0022" [ref=e418]
            - cell "10000022" [ref=e419]
            - cell "Product 22" [ref=e420]
            - cell "2 Pcs" [ref=e421]
            - cell "2300.00" [ref=e422]
            - cell "4600.00" [ref=e423]
          - row "24 SKU-0023 10000023 Product 23 2 Pcs 2400.00 4800.00" [ref=e424]:
            - cell "24" [ref=e425]
            - cell "SKU-0023" [ref=e426]
            - cell "10000023" [ref=e427]
            - cell "Product 23" [ref=e428]
            - cell "2 Pcs" [ref=e429]
            - cell "2400.00" [ref=e430]
            - cell "4800.00" [ref=e431]
          - row "25 SKU-0024 10000024 Product 24 2 Pcs 2500.00 5000.00" [ref=e432]:
            - cell "25" [ref=e433]
            - cell "SKU-0024" [ref=e434]
            - cell "10000024" [ref=e435]
            - cell "Product 24" [ref=e436]
            - cell "2 Pcs" [ref=e437]
            - cell "2500.00" [ref=e438]
            - cell "5000.00" [ref=e439]
      - generic [ref=e440]:
        - generic [ref=e441]:
          - generic [ref=e442]:
            - generic [ref=e443]: "GRAND TOTAL:"
            - generic [ref=e444]: Rs. 65,000.00
          - generic [ref=e445]: "Amount in Words: sixty-five thousand Rupees Only"
        - generic [ref=e446]:
          - paragraph [ref=e448]: Authorized Sign
          - generic [ref=e449]:
            - generic [ref=e450]: PAGE 2 OF 2
            - generic [ref=e451]: SOFTWARE BY AREEB IQBAL
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
> 60  |     const pageBox = await page.locator('.receipt-page').boundingBox();
      |                                                         ^ Error: locator.boundingBox: Error: strict mode violation: locator('.receipt-page') resolved to 2 elements:
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
  94  |     const pageBox = await page.locator('.receipt-page').boundingBox();
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
```