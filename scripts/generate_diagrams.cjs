const puppeteer = require('puppeteer');
const fs = require('fs');

const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
  <script>
    mermaid.initialize({ startOnLoad: true, theme: 'default' });
  </script>
  <style>
    body { background: white; padding: 20px; font-family: sans-serif; }
    .diagram-container { padding: 20px; display: inline-block; background: white; margin-bottom: 50px; }
  </style>
</head>
<body>

<div class="diagram-container" id="erd">
  <h2>Database ERD / Schema</h2>
  <div class="mermaid">
    erDiagram
        USERS ||--o{ ORDERS : places
        PRODUCTS ||--o{ ORDER_ITEMS : "included in"
        ORDERS ||--|{ ORDER_ITEMS : contains
        USERS {
            string id PK
            string role
            string email
        }
        PRODUCTS {
            string id PK
            string sku
            string name
            float price
            int stock
        }
        ORDERS {
            string id PK
            string user_id FK
            float total
        }
        ORDER_ITEMS {
            string id PK
            string order_id FK
            string product_id FK
            int quantity
        }
  </div>
</div>

<div class="diagram-container" id="dfd-context">
  <h2>Level 0 Context DFD</h2>
  <div class="mermaid">
    graph LR
        User((User)) -- Inputs items & payment --> System[Shaheen POS System]
        System -- Generates Receipt --> User
        System -- Syncs Data <--> CloudDB[(Supabase Cloud DB)]
  </div>
</div>

<div class="diagram-container" id="dfd-level1">
  <h2>Level 1 DFD</h2>
  <div class="mermaid">
    graph TD
        User((User)) -- Scan/Add Product --> P1(1. Process Sale)
        P1 -- Read Stock --> DB1[(Local IndexedDB)]
        P1 -- Confirm Checkout --> P2(2. Record Transaction)
        P2 -- Write Order --> DB1
        DB1 -- Background Sync --> P3(3. Sync Manager)
        P3 -- Push Data --> DB2[(Supabase PostgreSQL)]
  </div>
</div>

<div class="diagram-container" id="semantic">
  <h2>Semantic Network</h2>
  <div class="mermaid">
    graph TD
        Cashier[Cashier] -- IS A --> User[User]
        Admin[Admin] -- IS A --> User
        Customer[Customer] -- IS A --> Person[Person]
        User -- OPERATES --> POS[POS System]
        POS -- PROCESSES --> Order[Order]
        Order -- CONTAINS --> Product[Product]
        POS -- MANAGES --> Inventory[Inventory]
        Inventory -- STORES --> Product
        POS -- SYNCS WITH --> DB[Cloud Database]
  </div>
</div>

</body>
</html>
`;

fs.writeFileSync('diagrams.html', htmlContent);

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Users\\ESHOP\\.cache\\puppeteer\\chrome\\win64-152.0.7977.54\\chrome-win64\\chrome.exe',
    defaultViewport: { width: 1200, height: 2000 }
  });
  const page = await browser.newPage(); page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  await page.goto('file://' + __dirname + '/diagrams.html', { waitUntil: 'networkidle0' });
  
  // Wait a bit extra for mermaid to render
  await new Promise(r => setTimeout(r, 2000));

  const erd = await page.$('#erd');
  await erd.screenshot({ path: 'erd.png' });

  const dfd0 = await page.$('#dfd-context');
  await dfd0.screenshot({ path: 'dfd-context.png' });

  const dfd1 = await page.$('#dfd-level1');
  await dfd1.screenshot({ path: 'dfd-level1.png' });

  const semantic = await page.$('#semantic');
  await semantic.screenshot({ path: 'semantic.png' });

  await browser.close();
  console.log("Diagrams generated successfully.");
})();
