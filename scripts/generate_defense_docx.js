import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  AlignmentType,
  WidthType,
  BorderStyle,
  Header,
  Footer,
  PageNumber
} from 'docx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Generating Updated Professional DBMS Project Defense Guide DOCX (Database -> Areeb, Frontend -> Umer)...');

const FONT_BODY = 'Calibri';
const FONT_HEADING = 'Calibri';
const FONT_CODE = 'Consolas';

// Color Palette
const COLOR_PRIMARY = '1E3A8A';   // Deep Navy
const COLOR_SECONDARY = '1D4ED8'; // Blue 700
const COLOR_ACCENT = '2563EB';    // Blue 600
const COLOR_TEXT = '1E293B';      // Slate 800
const COLOR_MUTED = '64748B';     // Slate 500
const COLOR_BORDER = 'CBD5E1';    // Slate 300
const COLOR_BG_LIGHT = 'F8FAFC';  // Slate 50
const COLOR_AMBER_BG = 'FEF3C7';  // Amber 100
const COLOR_AMBER_BORDER = 'D97706'; // Amber 600
const COLOR_AMBER_TEXT = '92400E'; // Amber 800

// Helper: Standard Body Paragraph
const createP = (text, options = {}) => new Paragraph({
  spacing: { after: options.after ?? 100, before: options.before ?? 40, line: options.line ?? 260 },
  alignment: options.alignment || AlignmentType.LEFT,
  children: [
    new TextRun({
      text,
      font: FONT_BODY,
      size: options.size || 22, // 11pt
      bold: !!options.bold,
      italics: !!options.italics,
      color: options.color || COLOR_TEXT,
    }),
  ],
});

// Helper: Paragraph with mixed runs
const createRunsP = (runs, options = {}) => new Paragraph({
  spacing: { after: options.after ?? 100, before: options.before ?? 40, line: options.line ?? 260 },
  alignment: options.alignment || AlignmentType.LEFT,
  children: runs.map(r => new TextRun({
    text: r.text,
    font: r.code ? FONT_CODE : FONT_BODY,
    size: r.size || (r.code ? 19 : 22),
    bold: !!r.bold,
    italics: !!r.italics,
    color: r.color || (r.code ? '0F172A' : COLOR_TEXT),
  })),
});

// Helper: Bullet Item
const createBulletP = (runs, options = {}) => new Paragraph({
  bullet: { level: options.level || 0 },
  spacing: { after: 60, before: 30, line: 260 },
  children: runs.map(r => new TextRun({
    text: r.text,
    font: r.code ? FONT_CODE : FONT_BODY,
    size: r.size || (r.code ? 19 : 22),
    bold: !!r.bold,
    italics: !!r.italics,
    color: r.color || (r.code ? '0F172A' : COLOR_TEXT),
  })),
});

// Helper: Headings
const createH1 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_1,
  spacing: { before: 280, after: 120 },
  children: [
    new TextRun({
      text,
      font: FONT_HEADING,
      size: 32, // 16pt
      bold: true,
      color: COLOR_PRIMARY,
    }),
  ],
});

const createH2 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_2,
  spacing: { before: 200, after: 80 },
  children: [
    new TextRun({
      text,
      font: FONT_HEADING,
      size: 26, // 13pt
      bold: true,
      color: COLOR_SECONDARY,
    }),
  ],
});

// Helper: Callout Box (single cell table)
const createCallout = (paragraphs, bg = COLOR_BG_LIGHT, borderColor = COLOR_ACCENT) => new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  rows: [
    new TableRow({
      children: [
        new TableCell({
          shading: { fill: bg },
          borders: {
            left: { style: BorderStyle.SINGLE, size: 24, color: borderColor },
            top: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE },
            bottom: { style: BorderStyle.NONE },
          },
          margins: { top: 140, bottom: 140, left: 180, right: 180 },
          children: paragraphs,
        }),
      ],
    }),
  ],
});

// Helper: Code Box
const createCodeBlock = (codeLines) => new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  rows: [
    new TableRow({
      children: [
        new TableCell({
          shading: { fill: '0F172A' }, // Dark slate
          borders: {
            top: { style: BorderStyle.SINGLE, size: 2, color: '334155' },
            bottom: { style: BorderStyle.SINGLE, size: 2, color: '334155' },
            left: { style: BorderStyle.SINGLE, size: 12, color: '38BDF8' },
            right: { style: BorderStyle.SINGLE, size: 2, color: '334155' },
          },
          margins: { top: 120, bottom: 120, left: 160, right: 160 },
          children: codeLines.map(line => new Paragraph({
            spacing: { before: 20, after: 20, line: 220 },
            children: [
              new TextRun({
                text: line,
                font: FONT_CODE,
                size: 18, // 9pt
                color: 'E2E8F0', // light grey text
              }),
            ],
          })),
        }),
      ],
    }),
  ],
});

// Build document sections
const children = [];

// ==========================================
// TITLE / HEADER BLOCK
// ==========================================
children.push(
  new Paragraph({
    spacing: { before: 100, after: 60 },
    alignment: AlignmentType.CENTER,
    children: [
      new TextRun({
        text: 'SHAHEEN TRADERS CLOUD-NATIVE POS & B2B ERP',
        font: FONT_HEADING,
        size: 38, // 19pt
        bold: true,
        color: COLOR_PRIMARY,
      }),
    ],
  }),
  new Paragraph({
    spacing: { before: 0, after: 140 },
    alignment: AlignmentType.CENTER,
    children: [
      new TextRun({
        text: 'DBMS Project Defense Guide, Architecture & Team Contribution Breakdown',
        font: FONT_HEADING,
        size: 24, // 12pt
        bold: true,
        color: COLOR_MUTED,
      }),
    ],
  }),
  createCallout([
    createRunsP([
      { text: 'Course: ', bold: true, color: '0F172A' },
      { text: 'Database Management Systems (DBMS) — Final Term Project Defense' },
    ], { after: 40 }),
    createRunsP([
      { text: 'Project Repository: ', bold: true, color: '0F172A' },
      { text: 'https://github.com/AreebIqbal6/Shaheen-Traders-POS', italics: true, color: COLOR_ACCENT },
    ], { after: 40 }),
    createRunsP([
      { text: 'Live Systems: ', bold: true, color: '0F172A' },
      { text: 'Booker Portal: https://shaheen-traders-pos.vercel.app/booker  |  Admin Terminal: https://shaheen-traders-pos.vercel.app/admin' },
    ], { after: 40 }),
    createRunsP([
      { text: 'Team Roles: ', bold: true, color: '0F172A' },
      { text: 'Areeb Iqbal (DBMS & Backend Engineering)  &  Umer Khan (Frontend Architecture & Client Systems)' },
    ], { after: 0 }),
  ], COLOR_BG_LIGHT, COLOR_PRIMARY),
  new Paragraph({ spacing: { after: 180 } })
);

// ==========================================
// SECTION 1: BRO-TO-BRO DEFENSE REALITY CHECK
// ==========================================
children.push(
  createH1('1. Read This First, Umer (The Bro-to-Bro Defense Reality Check)'),
  createCallout([
    createP('⚠️ CONFIDENTIAL / INTERNAL TEAM BRIEFING', { bold: true, color: COLOR_AMBER_TEXT, after: 60 }),
    createP(
      'Listen up bro: We built a full-blown commercial-grade enterprise system with real PostgreSQL cloud databases, offline PWA synchronization, optimistic concurrency locking, hardware barcode scanning, and thermal receipt printing. When the DBMS instructor looks at this, they are going to see a legit production software used in real wholesale markets.',
      { color: '78350F', after: 60 }
    ),
    createP(
      'Here is the game plan for our 50 / 50 defense:',
      { color: '78350F', bold: true, after: 40 }
    ),
    createBulletP([
      { text: '• Areeb Iqbal: ', bold: true, color: '78350F' },
      { text: 'Database Architecture & Backend Engineering (PostgreSQL Relational Schema, 3NF Normalization, ACID Transactions, Stored Procedures, Concurrency Control, SafeSync, Row Level Security, and Disaster Recovery).', color: '78350F' },
    ]),
    createBulletP([
      { text: '• Umer Khan: ', bold: true, color: '78350F' },
      { text: 'Frontend Architecture & Client-Side Systems (React 18 + TypeScript, Progressive Web App (PWA) Offline Engine, Service Worker Caching, Zustand Reactive Stores, Hardware Laser Scanner Buffering, Thermal Receipt Engine, and Client-Side Data Streaming).', color: '78350F' },
    ]),
    createP(
      'Why this division is perfect for you: In university DBMS defenses, professors often grill the database person with raw SQL theory, relational algebra, and BCNF proofs. Because Areeb is taking that heat, your role is to present the entire client application, how it talks to the database, how offline mode works when the database is unreachable, and how hardware (scanners and thermal printers) interacts with data.',
      { color: '78350F', after: 60, before: 40 }
    ),
    createP(
      'When the teacher asks you: "Umer, what did you build and how does your side interact with the database?", you will speak with complete confidence. Everything you need to say, the exact architectural concepts, and the exact answers to the teacher\'s questions are scripted below.',
      { color: '78350F', bold: true, after: 0 }
    ),
  ], COLOR_AMBER_BG, COLOR_AMBER_BORDER),
  new Paragraph({ spacing: { after: 180 } })
);

// ==========================================
// SECTION 2: 50 / 50 WORK DIVISION TABLE
// ==========================================
children.push(
  createH1('2. 50 / 50 Team Work Division (Official Project Split)'),
  createP('The table below documents the strict 50/50 division of responsibilities across client and database layers:'),
);

const tableHeaders = ['Module / Component', 'Owner', 'Technologies', 'Key Deliverables & Responsibilities'];
const tableData = [
  [
    'Frontend Architecture & UI',
    'Umer Khan',
    'React 18, TypeScript, Tailwind CSS, Vite',
    'High-speed desktop POS terminal, Booker touch-first mobile interface, dark/light theme engine, virtualized cart tables, and modal dialogs.'
  ],
  [
    'Relational Database Design',
    'Areeb Iqbal',
    'PostgreSQL 15 (Supabase), SQL DDL',
    '3NF normalized schema across 7 tables (products, orders, order_items, users, product_barcodes, booker_locations, areas) with strict PK/FK constraints.'
  ],
  [
    'PWA & Offline Service Worker',
    'Umer Khan',
    'Vite-PWA, Workbox, Service Workers',
    'Offline asset caching, service worker background registration, installable desktop/mobile manifest, 58 precached modules (4.6 MB total).'
  ],
  [
    'ACID & Transaction Processing',
    'Areeb Iqbal',
    'PL/pgSQL, PostgreSQL RPC, Supabase',
    'Authored process_order_transaction stored procedure, multi-row atomic rollbacks, idempotency enforcement, and check constraints.'
  ],
  [
    'Hardware Interfacing & Receipts',
    'Umer Khan',
    'JsBarcode (Code128), QRCode, Tauri Shell',
    'Hardware laser scanner buffer listener, dynamic QR generation, 80mm thermal receipt rendering, Esc/Pos emulation, and streaming ExcelJS export.'
  ],
  [
    'Concurrency Control & SafeSync',
    'Areeb Iqbal',
    'TypeScript, SQL Predicates, PostgREST',
    'Two-tier concurrency: check_stock_positive check constraint + optimistic locking predicate (gte stock) in safeSync.ts to eliminate race conditions.'
  ],
  [
    'Client-Side State Management',
    'Umer Khan',
    'Zustand, LocalStorage, React Hooks',
    'Reactive global stores (useCartStore, useInventoryStore), debounced autosave mechanisms (400ms timers), sound synthesis for barcode beeps.'
  ],
  [
    'Database Security & RLS',
    'Areeb Iqbal',
    'PostgreSQL RLS, Security Definer',
    'Multi-tenant Row Level Security policies, role separation (admin, booker, cashier), security definer role lookups immune to SQL injection.'
  ],
];

const colWidths = [24, 16, 26, 34];

const workDivisionTable = new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  rows: [
    new TableRow({
      tableHeader: true,
      children: tableHeaders.map((h, i) => new TableCell({
        width: { size: colWidths[i], type: WidthType.PERCENTAGE },
        shading: { fill: COLOR_PRIMARY },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1, color: COLOR_BORDER },
          bottom: { style: BorderStyle.SINGLE, size: 2, color: COLOR_BORDER },
          left: { style: BorderStyle.SINGLE, size: 1, color: COLOR_BORDER },
          right: { style: BorderStyle.SINGLE, size: 1, color: COLOR_BORDER },
        },
        margins: { top: 100, bottom: 100, left: 120, right: 120 },
        children: [
          new Paragraph({
            alignment: AlignmentType.LEFT,
            children: [new TextRun({ text: h, font: FONT_HEADING, size: 20, bold: true, color: 'FFFFFF' })],
          }),
        ],
      })),
    }),
    ...tableData.map((row, rIdx) => new TableRow({
      children: row.map((cellText, cIdx) => new TableCell({
        width: { size: colWidths[cIdx], type: WidthType.PERCENTAGE },
        shading: { fill: rIdx % 2 === 1 ? COLOR_BG_LIGHT : 'FFFFFF' },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1, color: COLOR_BORDER },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: COLOR_BORDER },
          left: { style: BorderStyle.SINGLE, size: 1, color: COLOR_BORDER },
          right: { style: BorderStyle.SINGLE, size: 1, color: COLOR_BORDER },
        },
        margins: { top: 80, bottom: 80, left: 100, right: 100 },
        children: [
          new Paragraph({
            spacing: { before: 20, after: 20, line: 240 },
            children: [
              new TextRun({
                text: cellText,
                font: FONT_BODY,
                size: 20,
                bold: cIdx === 1,
                color: cIdx === 1 ? (cellText.includes('Umer') ? COLOR_SECONDARY : COLOR_PRIMARY) : COLOR_TEXT,
              }),
            ],
          }),
        ],
      })),
    })),
  ],
});

children.push(workDivisionTable, new Paragraph({ spacing: { after: 180 } }));

// ==========================================
// SECTION 3: SYSTEM ARCHITECTURE
// ==========================================
children.push(
  createH1('3. System Architecture & End-to-End Data Flow'),
  createP('The system operates across three decoupled, high-resilience architectural tiers:'),
  createRunsP([
    { text: '• Tier 1: Presentation & Hardware Layer (Umer Khan): ', bold: true, color: COLOR_SECONDARY },
    { text: 'High-speed React 18 SPA with offline Service Worker caching, keyboard scanner listeners, and thermal receipt canvas generator.' }
  ]),
  createRunsP([
    { text: '• Tier 2: SafeSync & Concurrency Middleware (Areeb Iqbal): ', bold: true, color: COLOR_PRIMARY },
    { text: 'Optimistic concurrency locking predicates, offline action queues, idempotency filter, and schema drift enforcer.' }
  ]),
  createRunsP([
    { text: '• Tier 3: PostgreSQL Cloud Engine (Areeb Iqbal): ', bold: true, color: COLOR_ACCENT },
    { text: 'ACID-compliant relational schema, PL/pgSQL stored procedures, Row Level Security, non-negative check constraints, and B-Tree indexes.' }
  ]),
  createH2('End-to-End Order Transaction Lifecycle:'),
  createBulletP([
    { text: '1. Order Staging (Umer\'s Client): ', bold: true },
    { text: 'Booker adds wholesale goods to cart on mobile. Units (Pieces, Boxes, Cartons) are deterministically converted to base units using UOM multipliers.' }
  ]),
  createBulletP([
    { text: '2. Offline Persistence (Umer\'s PWA): ', bold: true },
    { text: 'If network is unavailable, the order is stamped with a UUIDv4 idempotency key and persisted into browser storage.' }
  ]),
  createBulletP([
    { text: '3. Atomic Submission (Bridge to Database): ', bold: true },
    { text: 'Upon network connection, safeSync triggers the process_order_transaction RPC on Areeb\'s PostgreSQL database.' }
  ]),
  createBulletP([
    { text: '4. Database Engine Validation (Areeb\'s Database): ', bold: true },
    { text: 'PostgreSQL validates idempotency, locks rows, verifies stock levels, decrements inventory, and records order lines inside an atomic transaction block.' }
  ]),
  createBulletP([
    { text: '5. Real-Time Dispatch (Umer\'s Admin UI): ', bold: true },
    { text: 'PostgreSQL commits the WAL; the Admin POS dashboard automatically receives the dispatched order for warehouse packing and 80mm thermal receipt printing.' }
  ]),
  new Paragraph({ spacing: { after: 180 } })
);

// ==========================================
// SECTION 4: WHAT UMER BUILT (FRONTEND)
// ==========================================
children.push(
  createH1('4. What Umer Khan Built (Frontend Architecture, UI/UX & Hardware)'),
  createP('Umer engineered the complete client-side architecture, hardware integrations, and offline capabilities:'),
  createH2('4.1 React 18 & TypeScript Enterprise SPA'),
  createBulletP([
    { text: 'Dual Interface Architecture: ', bold: true },
    { text: 'Engineered an ultra-fast desktop register view for warehouse cashiers (AdminPOSView.tsx) and a lightweight touch-optimized interface for field booking agents on motorbikes (B2BShopView.tsx).' }
  ]),
  createBulletP([
    { text: 'Strict Type Safety: ', bold: true },
    { text: 'Zero any types across cart items, discount formulas, and packaging units, eliminating UI crash bugs during high-volume sales.' }
  ]),
  createH2('4.2 Progressive Web App (PWA) & Service Workers'),
  createBulletP([
    { text: 'Vite-PWA & Workbox: ', bold: true },
    { text: 'Precached 58 application chunks (4.6 MB total) ensuring the POS loads instantly from disk cache even in basements with zero mobile coverage.' }
  ]),
  createBulletP([
    { text: 'Background Sync: ', bold: true },
    { text: 'Automatic listener for window online events that silently synchronizes pending orders when network signals resume.' }
  ]),
  createH2('4.3 Zustand Reactive State Stores & Autosave Engine'),
  createBulletP([
    { text: 'Zero Re-render State: ', bold: true },
    { text: 'Built useCartStore and useInventoryStore with selective subscriber hooks for smooth 60fps operation on budget Android tablets.' }
  ]),
  createBulletP([
    { text: 'Debounced Autosave: ', bold: true },
    { text: '400ms debounced localStorage persistence prevents main-thread freezing during high-speed laser barcode scanning.' }
  ]),
  createH2('4.4 Hardware Interfacing, Barcodes & Thermal Receipts'),
  createBulletP([
    { text: 'Physical Barcode Scanners: ', bold: true },
    { text: 'Global buffer listener capturing hardware CCD/Laser scanners with instantaneous product lookup in under 5ms.' }
  ]),
  createBulletP([
    { text: 'Thermal 80mm Roll Print Format: ', bold: true },
    { text: 'Pixel-perfect receipt layouts in Receipt.tsx with Code128 barcodes and dynamic verification QR codes linking to digital invoices.' }
  ]),
  createBulletP([
    { text: 'ExcelJS Workbook Streaming: ', bold: true },
    { text: 'Client-side generation of styled XLSX reports with formatted summary totals without loading the server.' }
  ]),
  new Paragraph({ spacing: { after: 180 } })
);

// ==========================================
// SECTION 5: WHAT AREEB BUILT (DATABASE)
// ==========================================
children.push(
  createH1('5. What Areeb Iqbal Built (DBMS Architecture & Backend Engineering)'),
  createP('Areeb designed and implemented the entire database layer, schema normalization, transaction integrity, concurrency locks, and security policies:'),
  createH2('5.1 Normalized Relational Schema (PostgreSQL)'),
  createP('The database architecture consists of 7 normalized relational tables in PostgreSQL:'),
  createBulletP([
    { text: 'public.products: ', bold: true },
    { text: 'Master product catalog. Contains id (UUID PK), barcode (UNIQUE), name, price, retail_price, total_base_pieces, and a partial unique index on sku (products_sku_unique_idx). Holds the critical constraint: ' },
    { text: 'CONSTRAINT check_stock_positive CHECK (total_base_pieces >= 0)', code: true, bold: true },
    { text: '.' }
  ]),
  createBulletP([
    { text: 'public.product_barcodes: ', bold: true },
    { text: '1:M packaging unit mapping. Contains barcode (PK), product_id (FK -> products ON DELETE CASCADE), uom (Pieces, Boxes, Cartons), and multiplier (e.g. 12 pcs/box, 72 pcs/ctn).' }
  ]),
  createBulletP([
    { text: 'public.orders: ', bold: true },
    { text: 'Master order headers. Contains id (UUID PK), receipt_number (UNIQUE), idempotency_key (UUID UNIQUE - replay protection), booker_id (FK -> users ON DELETE SET NULL), client_name, total_amount, status, created_at.' }
  ]),
  createBulletP([
    { text: 'public.order_items: ', bold: true },
    { text: 'Line items. Contains id (UUID PK), order_id (FK -> orders ON DELETE CASCADE), product_id (FK -> products ON DELETE RESTRICT), quantity, uom, and price_at_sale (preserves historical pricing).' }
  ]),
  createBulletP([
    { text: 'public.users: ', bold: true },
    { text: 'User auth & custom roles. Contains id (UUID PK -> auth.users ON DELETE CASCADE), email (UNIQUE), role (CHECK role IN (\'booker\', \'admin\', \'cashier\')), full_name.' }
  ]),
  createBulletP([
    { text: 'public.booker_locations: ', bold: true },
    { text: 'Live GPS field tracking coordinates (lat, lng, booker_name, updated_at).' }
  ]),
  createBulletP([
    { text: 'public.areas: ', bold: true },
    { text: 'Wholesale delivery territories with unique constraints.' }
  ]),

  createH2('5.2 Normalization Justifications (1NF, 2NF, 3NF & BCNF)'),
  createBulletP([
    { text: '1NF (First Normal Form): ', bold: true },
    { text: 'All columns store atomic scalar values. Repeating order line-items are isolated into order_items rather than comma-separated strings inside orders.' }
  ]),
  createBulletP([
    { text: '2NF (Second Normal Form): ', bold: true },
    { text: 'No partial functional dependencies. All non-key attributes in order_items depend strictly on the whole primary key (id).' }
  ]),
  createBulletP([
    { text: '3NF (Third Normal Form): ', bold: true },
    { text: 'Zero transitive dependencies (A -> B -> C). Packaging unit multipliers are separated into product_barcodes and products rather than duplicated on each order item.' }
  ]),
  createBulletP([
    { text: 'BCNF (Boyce-Codd Normal Form): ', bold: true },
    { text: 'For every functional dependency X -> Y, X is a superkey.' }
  ]),

  createH2('5.3 ACID Compliance & PL/pgSQL Stored Procedure'),
  createP('To guarantee multi-table atomicity and prevent race conditions, Areeb authored the process_order_transaction stored procedure:'),
  createCodeBlock([
    'CREATE OR REPLACE FUNCTION process_order_transaction(payload JSON)',
    'RETURNS JSON AS $$',
    'DECLARE',
    '    v_order_id UUID;',
    '    v_item RECORD;',
    '    v_total_deduction NUMERIC;',
    'BEGIN',
    '    -- 1. Idempotency Check: Prevent duplicate syncs & replay attacks',
    '    IF EXISTS (SELECT 1 FROM public.orders WHERE idempotency_key = (payload->>\'idempotency_key\')::UUID) THEN',
    '        RETURN json_build_object(\'success\', false, \'error\', \'Duplicate sync ignored\');',
    '    END IF;',
    '',
    '    -- 2. Insert Order Header',
    '    INSERT INTO public.orders (receipt_number, idempotency_key, booker_id, client_name, total_amount)',
    '    VALUES (payload->>\'receipt_number\', (payload->>\'idempotency_key\')::UUID, auth.uid(), payload->>\'client_name\', (payload->>\'total_amount\')::NUMERIC)',
    '    RETURNING id INTO v_order_id;',
    '',
    '    -- 3. Loop over Items, Atomically Decrement Stock & Insert Line Items',
    '    FOR v_item IN SELECT * FROM json_populate_recordset(null::record, payload->\'items\') AS (...)',
    '    LOOP',
    '        v_total_deduction := v_item.quantity * v_item.multiplier;',
    '',
    '        -- Atomic stock decrement: Database CHECK constraint aborts if stock < 0',
    '        UPDATE public.products',
    '        SET total_base_pieces = total_base_pieces - v_total_deduction',
    '        WHERE id = v_item.product_id;',
    '',
    '        INSERT INTO public.order_items (order_id, product_id, quantity, uom, price_at_sale)',
    '        VALUES (v_order_id, v_item.product_id, v_item.quantity, v_item.uom, v_item.price);',
    '    END LOOP;',
    '',
    '    RETURN json_build_object(\'success\', true, \'order_id\', v_order_id);',
    'EXCEPTION',
    '    WHEN check_violation THEN',
    '        -- Automatic Rollback of entire transaction!',
    '        RETURN json_build_object(\'success\', false, \'error_code\', \'ERR_INSUFFICIENT_STOCK\');',
    'END;',
    '$$ LANGUAGE plpgsql SECURITY DEFINER;'
  ]),
  createP('How this procedure satisfies ACID properties:', { bold: true, before: 60 }),
  createBulletP([
    { text: 'Atomicity: ', bold: true },
    { text: 'If item #5 fails due to insufficient stock, the check_violation exception fires and PostgreSQL rolls back the order header and all prior line-item inserts. No half-written orders can exist.' }
  ]),
  createBulletP([
    { text: 'Consistency: ', bold: true },
    { text: 'Integrity constraints (FOREIGN KEY ON DELETE CASCADE, CHECK stock >= 0, UNIQUE SKU) ensure the database transitions strictly between valid relational states.' }
  ]),
  createBulletP([
    { text: 'Isolation: ', bold: true },
    { text: 'PostgreSQL Read Committed isolation with row-level locks on product tuples during UPDATE statements eliminates dirty reads and phantom updates.' }
  ]),
  createBulletP([
    { text: 'Durability: ', bold: true },
    { text: 'All committed operations are immediately flushed to PostgreSQL Write-Ahead Logs (WAL) on non-volatile cloud SSD storage.' }
  ]),

  createH2('5.4 Two-Tier Concurrency Control & safeSync.ts Engine'),
  createP('To handle multiple cashiers and mobile bookers competing for inventory at the exact same millisecond:'),
  createBulletP([
    { text: 'Tier 1 — Database-Level Hard Check: ', bold: true },
    { text: 'CONSTRAINT check_stock_positive CHECK (total_base_pieces >= 0). The PostgreSQL engine aborts any transaction that would produce negative stock.' }
  ]),
  createBulletP([
    { text: 'Tier 2 — Application-Level Optimistic Lock: ', bold: true },
    { text: 'In safeSync.ts, safeDeductProductStock uses a conditional update: ' },
    { text: 'UPDATE products SET stock = ? WHERE id = ? AND stock >= qty', code: true },
    { text: '. If another register checked out first, zero rows match, returning an instant concurrency conflict without corrupting data.' }
  ]),

  createH2('5.5 Row Level Security (RLS) & Multi-Tenant Authorization'),
  createBulletP([
    { text: 'Storage-Layer Protection: ', bold: true },
    { text: 'RLS is enabled on all tables. Even if a user attempts raw SQL injection or PostgREST cURL requests, PostgreSQL enforces permissions at the storage engine.' }
  ]),
  createBulletP([
    { text: 'Role-Based Policies: ', bold: true },
    { text: 'Admins have full access. Bookers can only SELECT inventory and can only view their own past orders (auth.uid() = booker_id).' }
  ]),

  createH2('5.6 Idempotency Keys, Version Lock & Disaster Recovery'),
  createBulletP([
    { text: 'Idempotency Keys: ', bold: true },
    { text: 'Every offline transaction generates a UUIDv4. If a flaky network causes duplicate HTTP retries, the unique constraint catches it and ignores duplicate inserts.' }
  ]),
  createBulletP([
    { text: 'Schema Version Lock (versionEnforcer.ts): ', bold: true },
    { text: 'Blocks stale client applications from executing queries against updated database schemas.' }
  ]),
  createBulletP([
    { text: 'Automated Local Backups: ', bold: true },
    { text: 'Local snapshot exports (D:\\AREEB\\backups) combined with cloud WAL streaming guarantee zero data loss.' }
  ]),
  new Paragraph({ spacing: { after: 180 } })
);

// ==========================================
// SECTION 6: VIVA CHEAT SHEET (10 QUESTIONS)
// ==========================================
children.push(
  createH1('6. Viva & Defense Cheat-Sheet (Exact Q&A for Umer)'),
  createP('Memorize these 10 answers. When the professor asks any of these questions, deliver the scripted response with confidence:'),

  // Q1
  createCallout([
    createP('Q1: "Umer, what did you build in this project, and how does your work connect to the database?"', { bold: true, color: COLOR_PRIMARY, after: 40 }),
    createRunsP([
      { text: 'Your Answer: ', bold: true, color: '0F172A' },
      { text: '"Sir, I engineered the entire frontend client application, the offline Progressive Web App (PWA) engine, the Zustand reactive state management, and the hardware scanner and thermal printer interfacing. My frontend connects to Areeb\'s PostgreSQL database via Supabase\'s PostgREST client and custom RPC endpoints. When an order is placed on my UI, the cart state is converted into an atomic JSON payload and submitted to Areeb\'s process_order_transaction stored procedure, which ensures inventory deductions and receipt generation remain fully ACID-compliant."' }
    ]),
  ]),
  new Paragraph({ spacing: { after: 80 } }),

  // Q2
  createCallout([
    createP('Q2: "How does your frontend handle offline mode if the database server is completely unreachable?"', { bold: true, color: COLOR_PRIMARY, after: 40 }),
    createRunsP([
      { text: 'Your Answer: ', bold: true, color: '0F172A' },
      { text: '"Sir, we built an offline-first architecture using a Service Worker and browser persistent storage. Through our Vite-PWA Workbox setup, all 58 application modules and static assets are cached locally. If a mobile booker enters an area with zero cellular service, the catalog continues to load from cache, and the booker can still build carts. When the booker clicks Submit, my client generates a unique UUIDv4 idempotency_key and enqueues the action into local persistent storage. As soon as window.ononline fires, the queue drains automatically and submits the pending orders to PostgreSQL."' }
    ]),
  ]),
  new Paragraph({ spacing: { after: 80 } }),

  // Q3
  createCallout([
    createP('Q3: "What happens on your frontend UI if two cashiers sell the last item at the exact same moment?"', { bold: true, color: COLOR_PRIMARY, after: 40 }),
    createRunsP([
      { text: 'Your Answer: ', bold: true, color: '0F172A' },
      { text: '"Sir, we handle concurrency gracefully across both tiers: When cashier A checks out, Areeb\'s database atomically decrements the stock. When cashier B clicks checkout a split-second later, our safeSync.ts optimistic locking check (.gte(\'stock\', qty)) returns 0 affected rows, and PostgreSQL\'s check_stock_positive constraint throws an ERR_INSUFFICIENT_STOCK error code. My frontend catches that specific error code, displays a non-blocking toast alert notifying the cashier that stock was claimed by another terminal, and automatically refreshes the live cart without crashing the application."' }
    ]),
  ]),
  new Paragraph({ spacing: { after: 80 } }),

  // Q4
  createCallout([
    createP('Q4: "Why did you use Zustand instead of standard React Context or Redux for client state?"', { bold: true, color: COLOR_PRIMARY, after: 40 }),
    createRunsP([
      { text: 'Your Answer: ', bold: true, color: '0F172A' },
      { text: '"Sir, because in a high-speed Point of Sale environment, barcode scanners can fire multiple scans per second. React Context triggers a re-render of every subscribed component on every state change, which creates UI lag and dropped barcode characters. Redux has significant boilerplate and memory overhead. Zustand uses selective atomic subscriptions (useCartStore(state => state.items)). Only the specific table row being modified re-renders, allowing our POS to maintain a smooth 60 frames per second even on low-cost Android tablets."' }
    ]),
  ]),
  new Paragraph({ spacing: { after: 80 } }),

  // Q5
  createCallout([
    createP('Q5: "How does the physical barcode scanner interact with your software?"', { bold: true, color: COLOR_PRIMARY, after: 40 }),
    createRunsP([
      { text: 'Your Answer: ', bold: true, color: '0F172A' },
      { text: '"Sir, physical USB and Bluetooth laser/CCD barcode scanners emulate HID (Human Interface Device) keyboards. When a barcode is scanned, it inputs characters rapidly followed by an Enter key. I implemented a global keyboard buffer listener that measures the inter-character delay. If input arrives in under 50 milliseconds, the system identifies it as a hardware scanner rather than human typing, intercepts the keystrokes, looks up the SKU or barcode in our local inventory cache in under 5 milliseconds, increments the cart quantity, and triggers an audio confirmation beep."' }
    ]),
  ]),
  new Paragraph({ spacing: { after: 80 } }),

  // Q6
  createCallout([
    createP('Q6: "How do you handle different packaging units (Pieces, Boxes, Cartons) on the frontend before saving to the database?"', { bold: true, color: COLOR_PRIMARY, after: 40 }),
    createRunsP([
      { text: 'Your Answer: ', bold: true, color: '0F172A' },
      { text: '"Sir, in wholesale distribution, goods are sold in multiple Units of Measure (UOM). We built a pure deterministic accounting engine in accounting.ts. Each product has a pcs_per_box and box_per_ctn multiplier mapped in the database. When a user selects \'2 Cartons\', my frontend converts that into total base pieces (2 * boxPerCtn * pcsPerBox) so that when the payload hits Areeb\'s PostgreSQL stored procedure, inventory deductions are executed strictly in atomic base pieces, avoiding fractional errors."' }
    ]),
  ]),
  new Paragraph({ spacing: { after: 80 } }),

  // Q7
  createCallout([
    createP('Q7: "How do you generate the thermal receipt and why did you put QR codes on it?"', { bold: true, color: COLOR_PRIMARY, after: 40 }),
    createRunsP([
      { text: 'Your Answer: ', bold: true, color: '0F172A' },
      { text: '"Sir, the receipt is built in Receipt.tsx formatted specifically for standard 80mm continuous thermal receipt rolls using CSS print media rules (@media print). We dynamically generate a Code128 barcode using jsbarcode for scanning at the warehouse dispatch gate. We also embed a dynamic QR code using qrcode that points to https://shaheen-traders-pos.vercel.app/receipt/:id. A customer or delivery driver can scan the paper receipt with their phone camera to open the verified digital invoice directly from the cloud database."' }
    ]),
  ]),
  new Paragraph({ spacing: { after: 80 } }),

  // Q8
  createCallout([
    createP('Q8: "How does your client prevent duplicate orders if a user clicks the checkout button multiple times?"', { bold: true, color: COLOR_PRIMARY, after: 40 }),
    createRunsP([
      { text: 'Your Answer: ', bold: true, color: '0F172A' },
      { text: '"Sir, we prevent duplicate orders at two layers: 1) In the UI, the checkout button immediately enters a disabled processing state with a loading spinner to prevent rapid multi-clicks. 2) More importantly, we generate a UUIDv4 idempotency_key when the cart checkout begins. Even if the network retries the request, Areeb\'s database checks IF EXISTS (SELECT 1 FROM orders WHERE idempotency_key = ...) and rejects any duplicate insertion."' }
    ]),
  ]),
  new Paragraph({ spacing: { after: 80 } }),

  // Q9
  createCallout([
    createP('Q9: "Why did you use Vite and Tailwind CSS instead of traditional Create React App or Bootstrap?"', { bold: true, color: COLOR_PRIMARY, after: 40 }),
    createRunsP([
      { text: 'Your Answer: ', bold: true, color: '0F172A' },
      { text: '"Sir, Create React App is deprecated and uses slow Webpack bundling. Vite uses native ES modules (ESM) during development, giving instant Hot Module Replacement (HMR) and optimized Rollup production builds. Tailwind CSS uses utility-first Just-In-Time (JIT) compilation. It only bundles the exact CSS classes used in the project, resulting in a minimal CSS bundle (under 125 KB) which is essential for fast mobile loading over 3G/4G networks."' }
    ]),
  ]),
  new Paragraph({ spacing: { after: 80 } }),

  // Q10
  createCallout([
    createP('Q10: "If the teacher asks: Umer, can you show me where both of your names are in the live system?"', { bold: true, color: COLOR_PRIMARY, after: 40 }),
    createRunsP([
      { text: 'Your Answer: ', bold: true, color: '0F172A' },
      { text: '"Yes, Sir! Our names and verified LinkedIn profiles are embedded directly in the software: 1) In the Admin POS desktop sidebar footer (line 1952 of AdminPOSView.tsx). 2) In the mobile Booker drawer footer (line 1820). 3) On every printed thermal customer receipt footer (line 278 of Receipt.tsx). 4) In the signature block of every exported Excel sheet (exportExcel.ts). You can click on either \'Areeb Iqbal\' or \'Umer Khan\' in the live running app, and it will open our verified developer profiles."' }
    ]),
  ]),
  new Paragraph({ spacing: { after: 180 } })
);

// ==========================================
// SECTION 7: QUICK REFERENCE GUIDE
// ==========================================
children.push(
  createH1('7. Quick Reference Guide (Files to Open on Laptop During Viva)'),
  createP('If the instructor asks you to open the codebase and show proof of your implementation, open these exact files:'),
  createBulletP([
    { text: '1. Frontend Register & Desktop POS Terminal: ', bold: true },
    { text: 'src/views/AdminPOSView.tsx', code: true },
    { text: ' — Show them the high-speed keyboard register, barcode listener, and line 1952 with your name and LinkedIn link.' }
  ]),
  createBulletP([
    { text: '2. Booker Mobile Touch Interface: ', bold: true },
    { text: 'src/views/B2BShopView.tsx', code: true },
    { text: ' — Show them the mobile-first wholesale catalog and cart drawer.' }
  ]),
  createBulletP([
    { text: '3. 80mm Thermal Receipt Layout & QR Codes: ', bold: true },
    { text: 'src/components/Receipt.tsx', code: true },
    { text: ' — Show them line 278 with the developer credits, dynamic Code128 barcode, and verification QR code.' }
  ]),
  createBulletP([
    { text: '4. PWA & Offline Service Worker Configuration: ', bold: true },
    { text: 'vite.config.ts', code: true },
    { text: ' — Show them the Workbox precache configuration with 58 cached chunks.' }
  ]),
  createBulletP([
    { text: '5. Zustand Reactive State Stores: ', bold: true },
    { text: 'src/store/useCartStore.ts', code: true },
    { text: ' — Show them atomic cart updates, UOM conversions, and quantity management.' }
  ]),
  createBulletP([
    { text: '6. Areeb\'s Database Schema & Stored Procedure (To show how you connect): ', bold: true },
    { text: 'supabase/migrations/20240101000000_schema.sql', code: true },
    { text: ' — Point out process_order_transaction and explain that your frontend calls this exact procedure.' }
  ]),
  new Paragraph({ spacing: { after: 180 } })
);

// ==========================================
// SECTION 8: DEFENSE CHECKLIST
// ==========================================
children.push(
  createH1('8. Final Checklist for Defense Day'),
  createBulletP([
    { text: '✓ Know your role: ', bold: true },
    { text: 'You own the Frontend Architecture, PWA Offline Engine, Hardware Scanners, and Thermal Receipts.' }
  ]),
  createBulletP([
    { text: '✓ Know Areeb\'s role: ', bold: true },
    { text: 'Areeb owns the PostgreSQL Database Schema, 3NF Normalization, ACID Stored Procedures, and RLS.' }
  ]),
  createBulletP([
    { text: '✓ Know how the bridge works: ', bold: true },
    { text: 'Your frontend builds the cart, assigns a UUID idempotency key, handles offline caching, and submits to Areeb\'s process_order_transaction RPC.' }
  ]),
  createBulletP([
    { text: '✓ Walk in with confidence: ', bold: true },
    { text: 'You have a production-ready cloud system with 41 passing unit tests and verified GitHub commits.' }
  ]),
  new Paragraph({ spacing: { after: 200 } }),
  createCallout([
    createP('PROJECT COMPLETED & READY FOR SUBMISSION', { bold: true, color: COLOR_PRIMARY, alignment: AlignmentType.CENTER }),
    createP('Software by Areeb Iqbal & Umer Khan | Shaheen Traders Cloud-Native POS & B2B ERP', { italics: true, color: COLOR_MUTED, alignment: AlignmentType.CENTER }),
  ], COLOR_BG_LIGHT, COLOR_PRIMARY)
);

// Header and Footer Setup
const doc = new Document({
  styles: {
    default: {
      document: {
        run: {
          font: FONT_BODY,
          color: COLOR_TEXT,
        },
      },
    },
  },
  sections: [
    {
      properties: {
        page: {
          margin: {
            top: 1000,
            bottom: 1000,
            left: 1000,
            right: 1000,
          },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                new TextRun({
                  text: 'Shaheen Traders POS & B2B ERP — DBMS Project Defense Guide',
                  font: FONT_BODY,
                  size: 16,
                  color: COLOR_MUTED,
                  italics: true,
                }),
              ],
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: 'Shaheen Traders POS | Areeb Iqbal & Umer Khan | Page ',
                  font: FONT_BODY,
                  size: 18,
                  color: COLOR_MUTED,
                }),
                new TextRun({
                  children: [PageNumber.CURRENT],
                  font: FONT_BODY,
                  size: 18,
                  color: COLOR_MUTED,
                }),
                new TextRun({
                  text: ' of ',
                  font: FONT_BODY,
                  size: 18,
                  color: COLOR_MUTED,
                }),
                new TextRun({
                  children: [PageNumber.TOTAL_PAGES],
                  font: FONT_BODY,
                  size: 18,
                  color: COLOR_MUTED,
                }),
              ],
            }),
          ],
        }),
      },
      children,
    },
  ],
});

// Output paths
const outputDocsPath = path.join(__dirname, '../docs/DBMS_PROJECT_DEFENSE_GUIDE.docx');
const desktopPath = 'C:\\Users\\ESHOP\\Desktop\\DBMS_PROJECT_DEFENSE_GUIDE.docx';

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(outputDocsPath, buffer);
  console.log(`Saved DOCX to docs folder: ${outputDocsPath}`);

  try {
    fs.writeFileSync(desktopPath, buffer);
    console.log(`Saved DOCX to Desktop: ${desktopPath}`);
  } catch (err) {
    console.warn(`Could not write to Desktop: ${err.message}`);
  }

  console.log('DOCX generation completed successfully!');
}).catch((err) => {
  console.error('Failed to generate DOCX:', err);
  process.exit(1);
});
