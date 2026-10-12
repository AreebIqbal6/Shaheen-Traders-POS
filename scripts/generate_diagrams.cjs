const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

const DIAGRAMS_DIR = path.join(__dirname, '../docs/diagrams');
if (!fs.existsSync(DIAGRAMS_DIR)) {
  fs.mkdirSync(DIAGRAMS_DIR, { recursive: true });
}

console.log('Rendering vectorized architectural diagrams for Shaheen Traders POS specification document...');

const svgHeader = (width, height) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" style="background-color: #FAFAF7; font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <defs>
    <linearGradient id="amberGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F59E0B" />
      <stop offset="100%" stop-color="#D97706" />
    </linearGradient>
    <linearGradient id="slateGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#334155" />
      <stop offset="100%" stop-color="#1E293B" />
    </linearGradient>
    <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3B82F6" />
      <stop offset="100%" stop-color="#1D4ED8" />
    </linearGradient>
    <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10B981" />
      <stop offset="100%" stop-color="#047857" />
    </linearGradient>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="115%" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.08" />
    </filter>
    <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#475569" />
    </marker>
    <marker id="arrowAmber" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#D97706" />
    </marker>
    <marker id="arrowBlue" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#2563EB" />
    </marker>
  </defs>
`;

const renderAndSave = (filename, svgContent, zoom = 2) => {
  const resvg = new Resvg(svgContent, { fitTo: { mode: 'zoom', value: zoom } });
  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();
  const destPath = path.join(DIAGRAMS_DIR, filename);
  fs.writeFileSync(destPath, pngBuffer);
  console.log(`Saved ${filename} (${pngBuffer.length} bytes, zoom ${zoom}x)`);
  return destPath;
};

// =========================================================================
// 1. DFD LEVEL 0 (Context Diagram)
// =========================================================================
const generateDFDLevel0 = () => {
  const w = 1200;
  const h = 760;
  let svg = svgHeader(w, h);

  svg += `
    <rect x="30" y="24" width="1140" height="60" rx="10" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5" filter="url(#shadow)"/>
    <text x="50" y="60" font-size="20" font-weight="bold" fill="#B45309">Data Flow Diagram (DFD Level 0) — Context Boundary Model</text>
    <text x="1150" y="60" font-size="13" font-weight="600" fill="#64748B" text-anchor="end">System: Shaheen Global Traders POS Platform (v0.5.85)</text>

    <!-- Central Process 0.0 -->
    <circle cx="600" cy="420" r="140" fill="url(#amberGrad)" stroke="#B45309" stroke-width="4" filter="url(#shadow)"/>
    <circle cx="600" cy="420" r="125" fill="#FFFFFF" stroke="#FDE68A" stroke-width="2"/>
    <text x="600" y="375" font-size="13" font-weight="bold" fill="#B45309" text-anchor="middle" letter-spacing="1">PROCESS 0.0</text>
    <text x="600" y="410" font-size="21" font-weight="800" fill="#1E293B" text-anchor="middle">SHAHEEN TRADERS</text>
    <text x="600" y="435" font-size="16" font-weight="700" fill="#475569" text-anchor="middle">POS &amp; B2B CORE</text>
    <text x="600" y="470" font-size="11.5" font-weight="600" fill="#94A3B8" text-anchor="middle">Wholesale &amp; Retail Field Distribution</text>
  `;

  const entities = [
    { id: 'E1', name: 'STORE ADMIN / CASHIER', sub: 'POS Checkout, Automake, Drawer, Inventory', x: 80, y: 150, w: 270, h: 90, color: '#1E293B' },
    { id: 'E2', name: 'FIELD SALES BOOKER', sub: 'Mobile B2B Orders, GPS Ping, Shop Visit', x: 850, y: 150, w: 270, h: 90, color: '#2563EB' },
    { id: 'E3', name: 'COMMERCIAL SHOP CLIENT', sub: 'Wholesale Accounts, Credit Debt, Invoices', x: 80, y: 580, w: 270, h: 90, color: '#7C3AED' },
    { id: 'E4', name: 'ESC/POS THERMAL PRINTER', sub: 'Raw TCP 9100 Receipts, Cash Drawer Kick', x: 850, y: 580, w: 270, h: 90, color: '#B45309' },
    { id: 'E5', name: 'SUPABASE POSTGRES CLOUD', sub: 'Realtime Order Broadcast, RLS Vault, DB', x: 465, y: 110, w: 270, h: 80, color: '#047857' },
  ];

  entities.forEach(ent => {
    svg += `
      <g filter="url(#shadow)">
        <rect x="${ent.x}" y="${ent.y}" width="${ent.w}" height="${ent.h}" rx="8" fill="#FFFFFF" stroke="${ent.color}" stroke-width="2.5"/>
        <rect x="${ent.x}" y="${ent.y}" width="45" height="24" rx="4" fill="${ent.color}"/>
        <text x="${ent.x + 22.5}" y="${ent.y + 16}" font-size="11" font-weight="bold" fill="#FFFFFF" text-anchor="middle">${ent.id}</text>
        <text x="${ent.x + 55}" y="${ent.y + 36}" font-size="12.5" font-weight="bold" fill="#0F172A">${ent.name}</text>
        <text x="${ent.x + 18}" y="${ent.y + 65}" font-size="11" fill="#64748B">${ent.sub}</text>
      </g>
    `;
  });

  // Flows
  svg += `
    <path d="M 350 180 C 440 180, 470 330, 500 370" fill="none" stroke="#2563EB" stroke-width="2" marker-end="url(#arrowBlue)"/>
    <text x="360" y="270" font-size="10.5" font-weight="600" fill="#1D4ED8" transform="rotate(35 360 270)">Barcode Input, Automake Orders</text>

    <path d="M 480 430 C 420 420, 370 300, 350 240" fill="none" stroke="#64748B" stroke-width="2" marker-end="url(#arrow)"/>
    <text x="340" y="360" font-size="10" font-weight="600" fill="#475569">Session State &amp; Stock Alerts</text>

    <!-- Booker E2 <-> Core -->
    <path d="M 850 190 C 760 190, 720 320, 690 360" fill="none" stroke="#2563EB" stroke-width="2" marker-end="url(#arrowBlue)"/>
    <text x="730" y="260" font-size="10.5" font-weight="600" fill="#1D4ED8">Field Orders, GPS Coordinates</text>

    <path d="M 720 410 C 780 410, 810 280, 850 230" fill="none" stroke="#64748B" stroke-width="2" marker-end="url(#arrow)"/>
    <text x="750" y="340" font-size="10" font-weight="600" fill="#475569">Assigned Areas &amp; Shop Catalog</text>

    <!-- Customer E3 <-> Core -->
    <path d="M 350 620 C 440 620, 480 540, 510 500" fill="none" stroke="#7C3AED" stroke-width="2" marker-end="url(#arrow)"/>
    <text x="360" y="580" font-size="10.5" font-weight="600" fill="#6D28D9">Debt Settlement, Payment Cash</text>

    <path d="M 500 470 C 430 490, 380 540, 350 590" fill="none" stroke="#D97706" stroke-width="2" marker-end="url(#arrowAmber)"/>
    <text x="340" y="520" font-size="10" font-weight="600" fill="#B45309">Dispatch Invoices, Ledger Slips</text>

    <!-- Core -> Printer E4 -->
    <path d="M 700 480 C 750 510, 800 580, 850 610" fill="none" stroke="#D97706" stroke-width="2.5" marker-end="url(#arrowAmber)"/>
    <text x="720" y="560" font-size="11" font-weight="bold" fill="#B45309">ESC/POS Thermal Bytes (Port 9100)</text>

    <!-- Core <-> Supabase E5 -->
    <path d="M 570 300 L 570 190" fill="none" stroke="#059669" stroke-width="2.5" marker-end="url(#arrow)"/>
    <text x="515" y="240" font-size="10" font-weight="bold" fill="#047857">Sync Queue</text>

    <path d="M 630 190 L 630 300" fill="none" stroke="#059669" stroke-width="2.5" marker-end="url(#arrow)"/>
    <text x="640" y="240" font-size="10" font-weight="bold" fill="#047857">Realtime Orders</text>
  `;

  svg += `</svg>`;
  return renderAndSave('dfd_level_0.png', svg);
};

// =========================================================================
// 2. DFD LEVEL 1 (System Decomposition)
// =========================================================================
const generateDFDLevel1 = () => {
  const w = 1300;
  const h = 880;
  let svg = svgHeader(w, h);

  svg += `
    <rect x="30" y="20" width="1240" height="55" rx="8" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5" filter="url(#shadow)"/>
    <text x="50" y="55" font-size="20" font-weight="bold" fill="#B45309">Data Flow Diagram (DFD Level 1) — Functional Process Decomposition</text>
    <text x="1250" y="55" font-size="13" font-weight="600" fill="#64748B" text-anchor="end">Subsystems 1.0 through 7.0 &amp; Relational Stores D1 - D6</text>
  `;

  const stores = [
    { id: 'D1', name: 'Users &amp; Booker PINs', x: 50, y: 120, w: 220, h: 50 },
    { id: 'D2', name: 'Products &amp; Stock Cache', x: 540, y: 120, w: 250, h: 50 },
    { id: 'D3', name: 'Orders &amp; Incoming Queue', x: 1000, y: 120, w: 250, h: 50 },
    { id: 'D4', name: 'Shops &amp; Ledger Balances', x: 50, y: 520, w: 230, h: 50 },
    { id: 'D5', name: 'GPS &amp; Route Telemetry', x: 540, y: 520, w: 250, h: 50 },
    { id: 'D6', name: 'Shift Cash &amp; Audit Logs', x: 1000, y: 520, w: 250, h: 50 },
  ];

  stores.forEach(s => {
    svg += `
      <g filter="url(#shadow)">
        <rect x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}" fill="#F8FAFC" stroke="#94A3B8" stroke-width="1.5" />
        <line x1="${s.x}" y1="${s.y}" x2="${s.x + s.w}" y2="${s.y}" stroke="#334155" stroke-width="2.5" />
        <line x1="${s.x}" y1="${s.y + s.h}" x2="${s.x + s.w}" y2="${s.y + s.h}" stroke="#334155" stroke-width="2.5" />
        <line x1="${s.x + 45}" y1="${s.y}" x2="${s.x + 45}" y2="${s.y + s.h}" stroke="#CBD5E1" stroke-width="1.5" />
        <text x="${s.x + 22.5}" y="${s.y + 32}" font-size="13" font-weight="bold" fill="#B45309" text-anchor="middle">${s.id}</text>
        <text x="${s.x + 55}" y="${s.y + 32}" font-size="13" font-weight="bold" fill="#1E293B">${s.name}</text>
      </g>
    `;
  });

  const processes = [
    { id: '1.0', name: 'Auth &amp; Booker Gate', cx: 160, cy: 320, r: 65, color: '#2563EB' },
    { id: '2.0', name: 'Admin POS &amp; Automake', cx: 660, cy: 320, r: 75, color: '#D97706' },
    { id: '3.0', name: 'Inventory &amp; Stock', cx: 1120, cy: 320, r: 65, color: '#059669' },
    { id: '4.0', name: 'B2B Field Booking', cx: 160, cy: 720, r: 65, color: '#7C3AED' },
    { id: '5.0', name: 'Live GPS Telemetry', cx: 660, cy: 720, r: 65, color: '#0284C7' },
    { id: '6.0', name: 'Cash &amp; Ledger Settle', cx: 1120, cy: 720, r: 65, color: '#E11D48' },
    { id: '7.0', name: 'Offline Sync Engine', cx: 660, cy: 500, r: 50, color: '#059669' },
  ];

  processes.forEach(p => {
    svg += `
      <g filter="url(#shadow)">
        <circle cx="${p.cx}" cy="${p.cy}" r="${p.r}" fill="#FFFFFF" stroke="${p.color}" stroke-width="3"/>
        <circle cx="${p.cx}" cy="${p.cy}" r="${p.r - 8}" fill="#F8FAFC" stroke="${p.color}" stroke-width="1" stroke-opacity="0.3"/>
        <text x="${p.cx}" y="${p.cy - 12}" font-size="12" font-weight="bold" fill="${p.color}" text-anchor="middle">PROCESS ${p.id}</text>
        <text x="${p.cx}" y="${p.cy + 12}" font-size="12.5" font-weight="bold" fill="#0F172A" text-anchor="middle">${p.name}</text>
      </g>
    `;
  });

  svg += `
    <path d="M 160 255 L 160 170" fill="none" stroke="#2563EB" stroke-width="2" marker-end="url(#arrowBlue)"/>
    <text x="170" y="215" font-size="10" font-weight="600" fill="#2563EB">Verify PIN</text>

    <path d="M 640 245 L 640 170" fill="none" stroke="#475569" stroke-width="2" marker-end="url(#arrow)"/>
    <text x="560" y="210" font-size="10" font-weight="600" fill="#475569">Stock &amp; Price Check</text>

    <path d="M 735 320 L 1000 160" fill="none" stroke="#D97706" stroke-width="2" marker-end="url(#arrowAmber)"/>
    <text x="820" y="240" font-size="10.5" font-weight="bold" fill="#B45309">Automake to Sales Order</text>

    <path d="M 735 320 L 1055 320" fill="none" stroke="#059669" stroke-width="2" marker-end="url(#arrow)"/>
    <text x="830" y="310" font-size="10" font-weight="bold" fill="#047857">Stock Decrement</text>

    <path d="M 225 720 L 595 720" fill="none" stroke="#0284C7" stroke-width="2" marker-end="url(#arrow)"/>
    <text x="360" y="710" font-size="10" font-weight="bold" fill="#0369A1">Booker Coordinates -> GPS D5</text>

    <path d="M 160 655 L 160 570" fill="none" stroke="#7C3AED" stroke-width="2" marker-end="url(#arrow)"/>
    <text x="170" y="615" font-size="10" font-weight="600" fill="#6D28D9">Record Shop Debt</text>

    <path d="M 1120 655 L 1120 570" fill="none" stroke="#E11D48" stroke-width="2" marker-end="url(#arrow)"/>
    <text x="1130" y="615" font-size="10" font-weight="600" fill="#BE123C">Cash Shift Audit</text>

    <path d="M 660 450 L 660 395" fill="none" stroke="#059669" stroke-width="2" stroke-dasharray="4,4" marker-end="url(#arrow)"/>
    <text x="670" y="430" font-size="9.5" font-weight="bold" fill="#047857">Replay Queue</text>
  `;

  svg += `</svg>`;
  return renderAndSave('dfd_level_1.png', svg);
};

// =========================================================================
// 3. DFD LEVEL 2 (Automake & POS Dispatch Detail)
// =========================================================================
const generateDFDLevel2 = () => {
  const w = 1200;
  const h = 760;
  let svg = svgHeader(w, h);

  svg += `
    <rect x="30" y="20" width="1140" height="55" rx="8" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5" filter="url(#shadow)"/>
    <text x="50" y="55" font-size="20" font-weight="bold" fill="#B45309">Data Flow Diagram (DFD Level 2) — Field Booker Automake &amp; POS Flow</text>
    <text x="1150" y="55" font-size="13" font-weight="600" fill="#64748B" text-anchor="end">Sub-process execution from Mobile Order to Thermal Print</text>
  `;

  const steps = [
    { num: '4.1', title: 'Booker Selects Shop &amp; Adds Items', x: 80, y: 150, w: 220, h: 80, fill: '#EFF6FF', stroke: '#2563EB' },
    { num: '4.2', title: 'Broadcast Order to Supabase Realtime', x: 370, y: 150, w: 220, h: 80, fill: '#EFF6FF', stroke: '#2563EB' },
    { num: '2.1', title: 'Admin Receives Live Incoming Order', x: 660, y: 150, w: 220, h: 80, fill: '#FEF3C7', stroke: '#D97706' },
    { num: '2.2', title: 'One-Click Automake &amp; Pre-Fill Cart', x: 930, y: 150, w: 220, h: 80, fill: '#FEF3C7', stroke: '#D97706' },

    { num: '2.3', title: 'Validate Inventory Stock &amp; Pricing', x: 80, y: 450, w: 220, h: 80, fill: '#F1F5F9', stroke: '#475569' },
    { num: '2.4', title: 'Dispatch ESC/POS TCP:9100 Print Job', x: 370, y: 450, w: 220, h: 80, fill: '#ECFDF5', stroke: '#059669' },
    { num: '2.5', title: 'Decrement Warehouse Stock Quantity', x: 660, y: 450, w: 220, h: 80, fill: '#ECFDF5', stroke: '#059669' },
    { num: '6.1', title: 'Post Credit to Shop Ledger Balance', x: 930, y: 450, w: 220, h: 80, fill: '#FAF5FF', stroke: '#7C3AED' },
  ];

  steps.forEach(s => {
    svg += `
      <g filter="url(#shadow)">
        <rect x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}" rx="10" fill="${s.fill}" stroke="${s.stroke}" stroke-width="2"/>
        <rect x="${s.x + 10}" y="${s.y + 10}" width="40" height="20" rx="4" fill="${s.stroke}"/>
        <text x="${s.x + 30}" y="${s.y + 24}" font-size="10.5" font-weight="bold" fill="#FFFFFF" text-anchor="middle">${s.num}</text>
        <text x="${s.x + 60}" y="${s.y + 25}" font-size="12" font-weight="bold" fill="#1E293B">Sub-Process</text>
        <text x="${s.x + 15}" y="${s.y + 55}" font-size="11.5" font-weight="600" fill="#334155">${s.title}</text>
      </g>
    `;
  });

  svg += `
    <line x1="300" y1="190" x2="370" y2="190" stroke="#2563EB" stroke-width="2.5" marker-end="url(#arrowBlue)" />
    <line x1="590" y1="190" x2="660" y2="190" stroke="#2563EB" stroke-width="2.5" marker-end="url(#arrowBlue)" />
    <line x1="880" y1="190" x2="930" y2="190" stroke="#D97706" stroke-width="2.5" marker-end="url(#arrowAmber)" />

    <path d="M 1040 230 C 1040 340, 200 340, 190 450" fill="none" stroke="#D97706" stroke-width="2.5" stroke-dasharray="5,5" marker-end="url(#arrowAmber)"/>
    <text x="480" y="325" font-size="11" font-weight="bold" fill="#B45309">Automake switches to Register View with items loaded</text>

    <line x1="300" y1="490" x2="370" y2="490" stroke="#475569" stroke-width="2.5" marker-end="url(#arrow)" />
    <line x1="590" y1="490" x2="660" y2="490" stroke="#059669" stroke-width="2.5" marker-end="url(#arrow)" />
    <line x1="880" y1="490" x2="930" y2="490" stroke="#059669" stroke-width="2.5" marker-end="url(#arrow)" />
  `;

  svg += `</svg>`;
  return renderAndSave('dfd_level_2.png', svg);
};

// =========================================================================
// 4. SDS (System Design Specification - 4-Tier Model)
// =========================================================================
const generateSDSArchitecture = () => {
  const w = 1200;
  const h = 880;
  let svg = svgHeader(w, h);

  svg += `
    <rect x="30" y="20" width="1140" height="55" rx="8" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5" filter="url(#shadow)"/>
    <text x="50" y="55" font-size="20" font-weight="bold" fill="#B45309">Software Design Specification (SDS) — 4-Tier Hybrid Architecture</text>
    <text x="1150" y="55" font-size="13" font-weight="600" fill="#64748B" text-anchor="end">Offline-First Field Booker &amp; Admin Topology</text>
  `;

  const layers = [
    {
      num: 'TIER 1',
      title: 'PRESENTATION &amp; APPLICATION LAYER (React 19 + TypeScript + Tailwind CSS)',
      sub: 'Wharf Terminal Tokens | DM Sans Universal Font | Booker &amp; Admin Split Views',
      y: 100,
      h: 140,
      fill: '#EFF6FF',
      stroke: '#3B82F6',
      boxes: [
        'Admin POS Register', 'B2B Booker Shop View', 'Incoming Orders Live Queue', 'Inventory &amp; Stock',
        'Customer Shop Ledgers', 'GPS Telemetry Map', 'Dispatch History &amp; PDF', 'System Settings'
      ]
    },
    {
      num: 'TIER 2',
      title: 'DESKTOP CONTAINER &amp; HARDWARE ABSTRACTION LAYER (Tauri v2 Rust Core)',
      sub: 'Zero-Overhead Memory Footprint | Native Win32 Subsystem Bindings | Ed25519 Auto-Updater',
      y: 280,
      h: 140,
      fill: '#FEF3C7',
      stroke: '#D97706',
      boxes: [
        'ESC/POS TCP:9100 Driver', 'Raw Cash Drawer Kick', 'USB Barcode Hook', 'Offline LocalStorage Persist',
        'Ed25519 Signed Updater', 'Local Excel/JSON Exporter', 'Cross-Platform WebView', 'Security Boundary'
      ]
    },
    {
      num: 'TIER 3',
      title: 'CACHE, PERSISTENCE &amp; RESILIENT MUTATION LAYER (Zustand + IndexedDB)',
      sub: 'Idempotent Replay Bus | Optimistic State Updates | Offline Salted Credential Vault',
      y: 460,
      h: 140,
      fill: '#F1F5F9',
      stroke: '#64748B',
      boxes: [
        'useCart &amp; useAuth Stores', 'Offline Mutations Queue', 'Idempotency Replay Key', 'Silent Rolling Backups',
        'Local JSON Serializer', 'IndexedDB Storage Engine', 'Conflict Resolution', 'GPS Cache Buffer'
      ]
    },
    {
      num: 'TIER 4',
      title: 'CLOUD DATABASE &amp; ENTERPRISE BACKEND LAYER (Supabase PostgreSQL 15 + RLS)',
      sub: 'TLS 1.3 Transmission | Tenant Row-Level Security Policies | Realtime Change Data Capture',
      y: 640,
      h: 140,
      fill: '#ECFDF5',
      stroke: '#059669',
      boxes: [
        'PostgreSQL 15 Relational DB', 'Row-Level Security (RLS)', 'PostgREST API Engine', 'Realtime WebSockets CDC',
        'Booker Location Lat/Lng', 'Automake Notification Bus', 'Audit Logs Table', 'Database Indexes'
      ]
    },
  ];

  layers.forEach(l => {
    svg += `
      <g filter="url(#shadow)">
        <rect x="50" y="${l.y}" width="1100" height="${l.h}" rx="12" fill="${l.fill}" stroke="${l.stroke}" stroke-width="2"/>
        <rect x="70" y="${l.y + 12}" width="65" height="22" rx="4" fill="${l.stroke}"/>
        <text x="102.5" y="${l.y + 27}" font-size="11" font-weight="bold" fill="#FFFFFF" text-anchor="middle">${l.num}</text>
        <text x="145" y="${l.y + 28}" font-size="13" font-weight="bold" fill="#0F172A">${l.title}</text>
        <text x="1000" y="${l.y + 28}" font-size="10.5" font-weight="600" fill="#64748B" text-anchor="end">${l.sub}</text>
    `;

    l.boxes.forEach((box, i) => {
      const bx = 70 + (i % 4) * 260;
      const by = l.y + 48 + Math.floor(i / 4) * 40;
      const safeBox = String(box).replace(/&/g, '&amp;');
      svg += `
        <rect x="${bx}" y="${by}" width="245" height="32" rx="6" fill="#FFFFFF" stroke="${l.stroke}" stroke-width="1.2" stroke-opacity="0.5"/>
        <text x="${bx + 12}" y="${by + 20}" font-size="11.5" font-weight="600" fill="#1E293B">${safeBox}</text>
      `;
    });

    svg += `</g>`;
  });

  svg += `
    <line x1="600" y1="240" x2="600" y2="280" stroke="#3B82F6" stroke-width="3" marker-end="url(#arrow)" />
    <line x1="600" y1="420" x2="600" y2="460" stroke="#D97706" stroke-width="3" marker-end="url(#arrow)" />
    <line x1="600" y1="600" x2="600" y2="640" stroke="#059669" stroke-width="3" marker-end="url(#arrow)" />
    <text x="615" y="265" font-size="10" font-weight="bold" fill="#2563EB">IPC Commands &amp; Events</text>
    <text x="615" y="445" font-size="10" font-weight="bold" fill="#B45309">Persistent Cache Queries</text>
    <text x="615" y="625" font-size="10" font-weight="bold" fill="#047857">Encrypted Sync Over TLS 1.3</text>
  `;

  svg += `</svg>`;
  return renderAndSave('sds_architecture.png', svg);
};

// =========================================================================
// 5. ERD (Entity Relationship Diagram)
// =========================================================================
const generateERDDiagram = () => {
  const w = 1400;
  const h = 950;
  let svg = svgHeader(w, h);

  svg += `
    <rect x="30" y="20" width="1340" height="55" rx="8" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5" filter="url(#shadow)"/>
    <text x="50" y="55" font-size="20" font-weight="bold" fill="#B45309">Entity-Relationship Diagram (ERD) — Shaheen Relational Model (3NF)</text>
    <text x="1350" y="55" font-size="13" font-weight="600" fill="#64748B" text-anchor="end">Supabase PostgreSQL 15 Relational Entities &amp; Foreign Keys</text>
  `;

  const tables = [
    {
      name: 'USERS / BOOKERS',
      pk: 'id: UUID (PK)',
      cols: ['email: TEXT (UNIQUE)', 'role: TEXT (admin/booker)', 'full_name: TEXT', 'contact_number: TEXT'],
      x: 60, y: 110, w: 260, h: 170, color: '#1E293B'
    },
    {
      name: 'BOOKER_LOCATIONS',
      pk: 'id: UUID (PK)',
      cols: ['booker_id: UUID (FK)', 'latitude: NUMERIC', 'longitude: NUMERIC', 'recorded_at: TIMESTAMP'],
      x: 60, y: 340, w: 260, h: 170, color: '#0284C7'
    },
    {
      name: 'SHOPS / CUSTOMERS',
      pk: 'id: UUID (PK)',
      cols: ['name: TEXT', 'phone: TEXT', 'area: TEXT', 'balance_due: NUMERIC', 'credit_limit: NUMERIC'],
      x: 60, y: 580, w: 260, h: 185, color: '#7C3AED'
    },
    {
      name: 'ORDERS',
      pk: 'id: UUID (PK)',
      cols: ['receipt_number: TEXT (UNIQUE)', 'shop_id: UUID (FK)', 'booker_id: UUID (FK)', 'total_amount: NUMERIC', 'payment_status: TEXT', 'status: TEXT'],
      x: 420, y: 300, w: 280, h: 210, color: '#D97706'
    },
    {
      name: 'ORDER_ITEMS',
      pk: 'id: UUID (PK)',
      cols: ['order_id: UUID (FK)', 'product_id: UUID (FK)', 'quantity: NUMERIC', 'unit_price: NUMERIC', 'subtotal: NUMERIC'],
      x: 770, y: 300, w: 270, h: 190, color: '#D97706'
    },
    {
      name: 'PRODUCTS',
      pk: 'id: UUID (PK)',
      cols: ['name: TEXT', 'sku: TEXT (UNIQUE)', 'barcode: TEXT (UNIQUE)', 'price: NUMERIC', 'retail_price: NUMERIC', 'stock: NUMERIC'],
      x: 1090, y: 300, w: 260, h: 210, color: '#059669'
    },
    {
      name: 'CATEGORIES',
      pk: 'id: UUID (PK)',
      cols: ['name: TEXT', 'description: TEXT'],
      x: 1090, y: 110, w: 260, h: 125, color: '#059669'
    },
    {
      name: 'AREAS',
      pk: 'id: UUID (PK)',
      cols: ['name: TEXT (UNIQUE)', 'city: TEXT', 'route_code: TEXT'],
      x: 60, y: 810, w: 260, h: 125, color: '#7C3AED'
    },
    {
      name: 'EXPENSES',
      pk: 'id: UUID (PK)',
      cols: ['category: TEXT', 'amount: NUMERIC', 'recorded_by: UUID (FK)', 'notes: TEXT'],
      x: 420, y: 720, w: 280, h: 160, color: '#DC2626'
    },
    {
      name: 'OUR_ORDERS (PROCUREMENT)',
      pk: 'id: UUID (PK)',
      cols: ['product_id: UUID (FK)', 'quantity_needed: NUMERIC', 'status: TEXT'],
      x: 770, y: 720, w: 270, h: 160, color: '#0284C7'
    },
  ];

  tables.forEach(t => {
    svg += `
      <g filter="url(#shadow)">
        <rect x="${t.x}" y="${t.y}" width="${t.w}" height="${t.h}" rx="8" fill="#FFFFFF" stroke="${t.color}" stroke-width="2"/>
        <path d="M ${t.x} ${t.y} L ${t.x + t.w} ${t.y} L ${t.x + t.w} ${t.y + 30} L ${t.x} ${t.y + 30} Z" fill="${t.color}"/>
        <text x="${t.x + 12}" y="${t.y + 20}" font-size="12" font-weight="bold" fill="#FFFFFF">${t.name}</text>
        <rect x="${t.x + 8}" y="${t.y + 36}" width="${t.w - 16}" height="22" rx="4" fill="#FEF3C7"/>
        <text x="${t.x + 14}" y="${t.y + 51}" font-size="11" font-weight="bold" fill="#B45309">${t.pk}</text>
    `;

    t.cols.forEach((col, i) => {
      svg += `
        <text x="${t.x + 14}" y="${t.y + 80 + i * 22}" font-size="11" font-weight="500" fill="#334155">${col}</text>
      `;
    });

    svg += `</g>`;
  });

  svg += `
    <!-- USERS 1 -> N ORDERS -->
    <path d="M 320 200 L 420 340" fill="none" stroke="#475569" stroke-width="2" marker-end="url(#arrow)"/>
    <text x="360" y="260" font-size="10" font-weight="bold" fill="#1E293B">1:N (booker_id)</text>

    <!-- USERS 1 -> N BOOKER_LOCATIONS -->
    <path d="M 190 280 L 190 340" fill="none" stroke="#0284C7" stroke-width="2" marker-end="url(#arrow)"/>
    <text x="200" y="310" font-size="10" font-weight="bold" fill="#0284C7">1:N (booker_id)</text>

    <!-- AREAS 1 -> N SHOPS -->
    <path d="M 190 810 L 190 765" fill="none" stroke="#7C3AED" stroke-width="2" marker-end="url(#arrow)"/>
    <text x="200" y="790" font-size="10" font-weight="bold" fill="#7C3AED">1:N (area_id)</text>

    <!-- SHOPS 1 -> N ORDERS -->
    <path d="M 320 630 L 420 460" fill="none" stroke="#7C3AED" stroke-width="2" marker-end="url(#arrow)"/>
    <text x="350" y="540" font-size="10" font-weight="bold" fill="#7C3AED">1:N (shop_id)</text>

    <!-- ORDERS 1 -> N ORDER_ITEMS -->
    <path d="M 700 390 L 770 390" fill="none" stroke="#D97706" stroke-width="2" marker-end="url(#arrowAmber)"/>
    <text x="725" y="380" font-size="10" font-weight="bold" fill="#B45309">1:N (order_id)</text>

    <!-- PRODUCTS 1 -> N ORDER_ITEMS -->
    <path d="M 1090 390 L 1040 390" fill="none" stroke="#059669" stroke-width="2" marker-end="url(#arrow)"/>
    <text x="1055" y="380" font-size="10" font-weight="bold" fill="#047857">1:N (product_id)</text>

    <!-- CATEGORIES 1 -> N PRODUCTS -->
    <path d="M 1220 235 L 1220 300" fill="none" stroke="#059669" stroke-width="2" marker-end="url(#arrow)"/>
    <text x="1230" y="270" font-size="10" font-weight="bold" fill="#047857">1:N (category_id)</text>

    <!-- USERS 1 -> N EXPENSES -->
    <path d="M 320 250 C 380 260, 420 680, 430 720" fill="none" stroke="#DC2626" stroke-width="2" marker-end="url(#arrow)"/>
    <text x="365" y="700" font-size="10" font-weight="bold" fill="#DC2626">1:N (recorded_by)</text>

    <!-- PRODUCTS 1 -> N OUR_ORDERS -->
    <path d="M 1150 510 C 1140 640, 1070 750, 1040 770" fill="none" stroke="#0284C7" stroke-width="2" marker-end="url(#arrow)"/>
    <text x="1075" y="670" font-size="10" font-weight="bold" fill="#0284C7">1:N (product_id)</text>
  `;

  svg += `</svg>`;
  return renderAndSave('erd_diagram.png', svg);
};

// =========================================================================
// 6. SEMANTIC.NET (Knowledge Ontology Graph)
// =========================================================================
const generateSemanticNet = () => {
  const w = 1260;
  const h = 880;
  let svg = svgHeader(w, h);

  svg += `
    <rect x="30" y="20" width="1200" height="55" rx="8" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5" filter="url(#shadow)"/>
    <text x="50" y="55" font-size="20" font-weight="bold" fill="#B45309">SEMANTIC.NET — Conceptual Knowledge Ontology &amp; Domain Graph</text>
    <text x="1210" y="55" font-size="13" font-weight="600" fill="#64748B" text-anchor="end">Taxonomical (is-a), Structural (has-part), and Behavioral (triggers/owes) Relations</text>
  `;

  const nodes = [
    { id: 'SYS', label: 'Shaheen POS System', sub: 'Root Enterprise Platform', cx: 630, cy: 120, rx: 115, ry: 38, fill: '#FEF3C7', stroke: '#D97706' },
    { id: 'USER', label: 'System User', sub: 'Authenticated Employee', cx: 240, cy: 220, rx: 90, ry: 35, fill: '#EFF6FF', stroke: '#3B82F6' },
    { id: 'ADMIN', label: 'Store Administrator', sub: 'Role: Admin / Superuser', cx: 100, cy: 370, rx: 80, ry: 32, fill: '#EFF6FF', stroke: '#1E40AF' },
    { id: 'BOOKER', label: 'Field Sales Booker', sub: 'Role: Mobile Agent', cx: 280, cy: 370, rx: 85, ry: 32, fill: '#EFF6FF', stroke: '#2563EB' },
    { id: 'GPS', label: 'GPS Coordinates', sub: 'Field Telemetry Ping', cx: 110, cy: 550, rx: 90, ry: 34, fill: '#EFF6FF', stroke: '#0284C7' },
    { id: 'SHOP', label: 'Commercial Shop', sub: 'B2B Client Account', cx: 580, cy: 360, rx: 95, ry: 35, fill: '#FAF5FF', stroke: '#7C3AED' },
    { id: 'ORDER', label: 'Sales Order', sub: 'Transaction Document', cx: 580, cy: 530, rx: 100, ry: 38, fill: '#FEF3C7', stroke: '#B45309' },
    { id: 'AUTOMAKE', label: 'Automake Action', sub: 'Instant POS Pre-Fill', cx: 580, cy: 730, rx: 85, ry: 32, fill: '#FEF3C7', stroke: '#D97706' },
    { id: 'RECEIPT', label: 'ESC/POS Receipt', sub: 'Thermal Print Document', cx: 860, cy: 730, rx: 85, ry: 32, fill: '#F8FAFC', stroke: '#475569' },
    { id: 'DEBT', label: 'Receivable Balance', sub: 'Shop Credit Ledger', cx: 340, cy: 700, rx: 90, ry: 35, fill: '#FFF1F2', stroke: '#E11D48' },
    { id: 'PROD', label: 'Catalog Product', sub: 'FMCG Wholesale SKU', cx: 1000, cy: 400, rx: 90, ry: 35, fill: '#F0FDF4', stroke: '#059669' },
    { id: 'STOCK', label: 'Inventory Stock', sub: 'Warehouse Physical Qty', cx: 1000, cy: 600, rx: 90, ry: 35, fill: '#F0FDF4', stroke: '#047857' },
  ];

  nodes.forEach(n => {
    svg += `
      <g filter="url(#shadow)">
        <ellipse cx="${n.cx}" cy="${n.cy}" rx="${n.rx}" ry="${n.ry}" fill="${n.fill}" stroke="${n.stroke}" stroke-width="2.5"/>
        <text x="${n.cx}" y="${n.cy - 5}" font-size="13" font-weight="bold" fill="#0F172A" text-anchor="middle">${n.label}</text>
        <text x="${n.cx}" y="${n.cy + 14}" font-size="10.5" font-weight="600" fill="#64748B" text-anchor="middle">${n.sub}</text>
      </g>
    `;
  });

  const links = [
    { from: 'ADMIN', to: 'USER', label: 'is-a', x: 165, y: 295 },
    { from: 'BOOKER', to: 'USER', label: 'is-a', x: 265, y: 295 },
    { from: 'SYS', to: 'USER', label: 'authenticates', x: 420, y: 165 },
    { from: 'BOOKER', to: 'GPS', label: 'transmits-ping', x: 180, y: 470 },
    { from: 'BOOKER', to: 'ORDER', label: 'books-for', x: 410, y: 460 },
    { from: 'SHOP', to: 'ORDER', label: 'places', x: 590, y: 445 },
    { from: 'ORDER', to: 'PROD', label: 'contains', x: 810, y: 460 },
    { from: 'PROD', to: 'STOCK', label: 'tracks-via', x: 1010, y: 500 },
    { from: 'ORDER', to: 'STOCK', label: 'decrements', x: 810, y: 575 },
    { from: 'ORDER', to: 'AUTOMAKE', label: 'triggers', x: 590, y: 640 },
    { from: 'AUTOMAKE', to: 'RECEIPT', label: 'dispatches-print', x: 720, y: 730 },
    { from: 'SHOP', to: 'DEBT', label: 'owes (credit)', x: 445, y: 580 },
    { from: 'ORDER', to: 'DEBT', label: 'increments', x: 450, y: 650 },
  ];

  links.forEach(l => {
    const fNode = nodes.find(n => n.id === l.from);
    const tNode = nodes.find(n => n.id === l.to);
    svg += `
      <line x1="${fNode.cx}" y1="${fNode.cy}" x2="${tNode.cx}" y2="${tNode.cy}" stroke="#64748B" stroke-width="1.8" stroke-dasharray="${l.label.includes('is-a') ? '4,4' : '0'}" marker-end="url(#arrow)"/>
      <rect x="${l.x - 46}" y="${l.y - 10}" width="92" height="20" rx="4" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1"/>
      <text x="${l.x}" y="${l.y + 4}" font-size="10" font-weight="bold" fill="#0F172A" text-anchor="middle">${l.label}</text>
    `;
  });

  svg += `</svg>`;
  return renderAndSave('semantic_net.png', svg);
};

console.log('Generating Diagram 1/6: DFD Level 0...');
generateDFDLevel0();

console.log('Generating Diagram 2/6: DFD Level 1...');
generateDFDLevel1();

console.log('Generating Diagram 3/6: DFD Level 2...');
generateDFDLevel2();

console.log('Generating Diagram 4/6: SDS Architecture...');
generateSDSArchitecture();

console.log('Generating Diagram 5/6: ERD Relational Diagram...');
generateERDDiagram();

console.log('Generating Diagram 6/6: SEMANTIC.NET Ontology Graph...');
generateSemanticNet();

console.log('All 6 vectorized diagram images successfully generated in docs/diagrams/ for Shaheen Traders POS');
