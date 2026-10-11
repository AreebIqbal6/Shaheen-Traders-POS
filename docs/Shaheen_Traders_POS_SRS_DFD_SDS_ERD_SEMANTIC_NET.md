# Shaheen Traders POS & B2B Distribution System
## Comprehensive Software Engineering Specification Master Document
**SRS | DFD | SDS | ERD | SEMANTIC.NET**

---

### Executive Document Summary

| Document Attribute | Specification Detail |
| :--- | :--- |
| **Document Title** | Comprehensive Software Architecture & Engineering Blueprint |
| **Software Version** | Release v0.5.84 (Shaheen Traders POS & B2B Distribution Platform) |
| **Target Platforms** | Windows Desktop (`.exe` via Tauri v2) & PWA Mobile Client (Field Bookers) |
| **Backend Technology** | Supabase Cloud (PostgreSQL 15), PostgREST, Realtime WebSockets, RLS |
| **Local Runtime** | Tauri Rust Core, IndexedDB/LocalStorage Cache, Leaflet GPS Telemetry |
| **Hardware Integration** | ESC/POS Thermal Receipt Printers (TCP 9100 / USB), Cash Drawer, Scanners |
| **Visual Models** | 6 Vectorized Engineering Diagrams (DFD 0/1/2, SDS, ERD, SEMANTIC.NET) |
| **Document Format** | Microsoft Word (`.docx`) with embedded 300-DPI visual graphics & GitHub Markdown (`.md`) |
| **Status** | Approved for Production & Formal Release Tracking |

---

## 1. Executive Summary

**Shaheen Traders POS** is an enterprise-grade wholesale distribution, field sales management, and high-throughput Point of Sale (POS) platform specifically engineered for FMCG (Fast Moving Consumer Goods) distributors, bulk merchants, and commercial trade networks. The platform bridges the divide between mobile field sales bookers taking on-site shop orders and central warehouse POS cashiers fulfilling and printing delivery orders in real time.

Key architectural innovations in Shaheen Traders POS include:
1. **Ultra-Responsive B2B Booker Portal**: An optimized mobile interface operating reliably on low-bandwidth cellular connections.
2. **Automake Live Order Queue**: An automated workflow that transforms incoming field booker orders into live POS checkout registers with a single click or zero-latency trigger.
3. **Live Leaflet GPS Telemetry**: Real-time tracking of booker coordinates across designated commercial market territories.
4. **Direct ESC/POS Thermal Printing**: Raw binary streaming over network TCP port 9100 without intermediate print dialogs.
5. **Realtime Cloud Synchronization**: Instant bi-directional synchronization powered by Supabase PostgreSQL 15 and WebSocket channels.

---

## 2. Software Requirements Specification (SRS)

### 2.1 Business Scope
In large-scale wholesale and FMCG distribution, operational bottlenecks frequently occur when field sales bookers manually write paper order slips or communicate via unstandardized messaging channels, resulting in billing errors, delayed warehouse packing, inventory stockouts, and ledger reconciliation disputes. Shaheen Traders POS replaces paper workflows with a digital, bi-directional pipeline connecting field bookers, warehouse managers, cashiers, commercial shop clients, and vendor suppliers into a singular synchronized system.

### 2.2 User Personas & Authorization Roles
- **System Administrator / Superuser (Admin)**: Full administrative authority; manages product master catalog, configures trade areas, monitors live booker GPS coordinates, inspects financial ledgers, and controls system backups.
- **POS Cashier / Counter Operator**: Operates central warehouse POS terminal; scans barcodes, reviews incoming field orders, triggers the Automake workflow, accepts payment tenders (Cash, Credit, Split), kicks cash drawers, and prints thermal delivery bills.
- **Field Sales Booker**: Mobile agent operating in commercial markets; visits assigned retail shops, books B2B orders with negotiated quantities, inspects live shop debt ledgers, and transmits periodic GPS pings for route audit.
- **Commercial Shop Client**: Wholesale store owner registered under a specific trade area; receives goods, reviews delivery bills, and settles credit accounts receivable balances.
- **Vendor / FMCG Manufacturer**: External supplier providing bulk merchandise; receives automated procurement replenishment orders ("Our Orders") based on minimum warehouse reorder thresholds.

### 2.3 Functional Requirements (FR)

| ID | Module | Requirement Description | Priority |
| :--- | :--- | :--- | :--- |
| **FR-01** | High-Speed POS Checkout | Scan barcodes via USB scanner or camera and populate cart in under 50ms with live total calculations. | Critical |
| **FR-02** | B2B Field Booker Portal | Dedicated mobile view to select shops in assigned area, build order carts, and dispatch to warehouse. | Critical |
| **FR-03** | Automake Live Queue | Incoming field orders immediately appear in an interactive queue where a single click converts them into active POS register carts. | Critical |
| **FR-04** | Live GPS Telemetry Tracking | Booker mobile devices transmit GPS coordinates periodically; Admin panel renders active locations on an interactive Leaflet map. | High |
| **FR-05** | Multi-Tier Rate Engine | Dynamically calculate item pricing based on Wholesale, Retail, Carton, Box, and loose piece units of measure. | Critical |
| **FR-06** | Accounts Receivable Ledger | Maintain real-time shop credit balances, enforce credit limits, and process one-click cash debt settlement vouchers. | Critical |
| **FR-07** | Procurement & Our Orders | Track vendor purchase orders, warehouse arrival checks, supplier balances owed, and calculate replenishment needs. | High |
| **FR-08** | Offline-First Local Sync | Store transactions during cellular disconnects in local persistence and sync via idempotent keys upon reconnection. | Critical |
| **FR-09** | Direct TCP ESC/POS Printing | Dispatch raw ESC/POS binary sequences directly to thermal receipt printers over TCP port 9100 without browser dialogs. | High |
| **FR-10** | Ed25519 Auto-Updates | Windows desktop client polls GitHub Releases for signed binary patches and performs transparent self-updating on startup. | High |

### 2.4 Non-Functional Requirements (NFR)
- **NFR-01: Performance & Latency**: Barcode scanning and cart recalculations execute in under 50ms. Booker order dispatch completes in under 500ms on 4G cellular links.
- **NFR-02: Zero Data Loss Offline Reliability**: Every field order and POS transaction is committed to local persistence before network transmission.
- **NFR-03: Security & Tenant Isolation**: Cloud database operations protected by Supabase Row-Level Security (RLS) with TLS 1.3 transit encryption.
- **NFR-04: Mobile Battery & Bandwidth Optimization**: Booker location telemetry utilizes throttled watchPosition listeners and compact JSON payloads (<200 bytes per ping).
- **NFR-05: Typography & Design Consistency**: Universal clean typography and high-contrast color scheme across mobile booker portals and desktop registers.

---

## 3. Data Flow Diagrams (DFD)

### 3.1 DFD Level 0 (Context Diagram)
The Level 0 Context Diagram establishes the global boundary of the Shaheen Traders POS platform and its operational interfaces with system administrators, field bookers, commercial shops, thermal printers, and cloud database infrastructure:

![Figure 3.1: DFD Level 0 Context Diagram](diagrams/dfd_level_0.png)

### 3.2 DFD Level 1 (System Decomposition)
The Level 1 diagram decomposes Process 0.0 into seven primary functional subsystems (1.0 through 7.0) and six relational data stores (D1 through D6):

![Figure 3.2: DFD Level 1 System Decomposition](diagrams/dfd_level_1.png)

- **Process 1.0 (Auth & Role Gate)**: Validates credentials against Store D1 (Users & Bookers) and issues active session tokens.
- **Process 2.0 (Booker Mobile Order Processing)**: Queries Store D4 (Shops & Areas) and Store D2 (Products Catalog) to build sales orders in Store D3 (Orders Queue).
- **Process 3.0 (Booker GPS Telemetry Pipeline)**: Captures real-time coordinates and writes sequential pings into Store D5 (Booker Locations).
- **Process 4.0 (Automake & POS Register Engine)**: Ingests queued orders from Store D3, populates active register carts, decrements Store D2 (Products), and records sales.
- **Process 5.0 (Accounts Receivable)**: Maintains shop ledger accounts in Store D4, tracks balance_due, and handles cash debt settlement vouchers.
- **Process 6.0 (Procurement & Our Orders)**: Tracks supplier purchase orders in Store D6, calculates warehouse replenishment thresholds, and audits goods received.
- **Process 7.0 (Realtime WebSocket & Sync Controller)**: Broadcasts instant order updates and location changes to connected desktop clients.

### 3.3 DFD Level 2 (Field Booker to Automake POS Workflow)
The Level 2 diagram provides an exhaustive inspection of the core business pipeline: from on-site field order capture to instant warehouse Automake pre-fill, thermal bill printing, and shop debt ledger settlement:

![Figure 3.3: DFD Level 2 Detailed Workflow](diagrams/dfd_level_2.png)

---

## 4. Software Design Specification (SDS)

### 4.1 System Architecture Overview (4-Tier Model)
Shaheen Traders POS utilizes a robust 4-tier hybrid architecture engineered to withstand erratic mobile connectivity in congested wholesale markets while delivering high-speed desktop performance in the central warehouse:

![Figure 4.1: SDS 4-Tier Hybrid Architecture](diagrams/sds_architecture.png)

- **Tier 1: Presentation & Mobile Web Layer**: React 19, TypeScript, Tailwind CSS, Framer Motion. Dual responsive views for mobile bookers and desktop cashiers.
- **Tier 2: Desktop Container & Hardware Abstraction Layer**: Tauri v2 (Rust). Native OS bindings for raw TCP socket thermal printing (port 9100), serial USB barcode scanner listeners, and Ed25519 auto-updater signatures.
- **Tier 3: Cache, State & Offline Replay Bus**: Zustand state stores and IndexedDB caching ensure instant UI response. Offline mutation queues buffer pending orders and replay them with idempotency keys upon reconnection.
- **Tier 4: Cloud Database & Realtime Infrastructure**: Supabase Cloud hosting PostgreSQL 15, PostgREST API engine, Realtime WebSockets pub/sub, and Row-Level Security policies.

### 4.2 Hardware Integration & ESC/POS Printing Engine
Direct thermal receipt printing is implemented via native TCP sockets without requiring browser print dialogues. When an order is completed, the Tauri Rust backend opens a TCP socket to the configured printer IP (default 192.168.1.100, port 9100) and writes raw ESC/POS binary sequences: header alignment, font enlargement, separator lines, dynamic QR code render, cash drawer kick code (`0x1B 0x70`), and paper cut (`0x1D 0x56 0x41`).

### 4.3 Live GPS Telemetry Pipeline
Field booker devices utilize the HTML5 Geolocation API with high-accuracy GPS mode enabled. The client polls position updates, computes delta movement to avoid redundant pings, and commits records to `booker_locations`. On the Admin dashboard, the Leaflet geospatial map renders active bookers with distinct color-coded markers, movement trails, and time-since-last-ping indicators.

---

## 5. Entity Relationship Diagram (ERD) & Data Dictionary

### 5.1 Relational Schema
The database follows third normal form (3NF) relational architecture with strict foreign key constraints and referential integrity across all operational tables:

![Figure 5.1: ERD Relational Schema](diagrams/erd_diagram.png)

### 5.2 Data Dictionary Summary

| Table | Field Name | Data Type | Constraints & Descriptions |
| :--- | :--- | :--- | :--- |
| `users` | `id` | UUID | PRIMARY KEY, Default `gen_random_uuid()` |
| `users` | `username` | TEXT | UNIQUE, NOT NULL. Login identifier |
| `users` | `role` | TEXT | CHECK (`admin`, `cashier`, `booker`) |
| `booker_locations` | `id` | UUID | PRIMARY KEY, Default `gen_random_uuid()` |
| `booker_locations` | `booker_id` | UUID | FOREIGN KEY -> `users.id` |
| `booker_locations` | `latitude` | DOUBLE PRECISION | NOT NULL. WGS84 GPS latitude |
| `booker_locations` | `longitude` | DOUBLE PRECISION | NOT NULL. WGS84 GPS longitude |
| `booker_locations` | `recorded_at` | TIMESTAMPTZ | Default `NOW()`. Timestamp of ping |
| `shops` | `id` | UUID | PRIMARY KEY, Default `gen_random_uuid()` |
| `shops` | `name` | TEXT | NOT NULL. Commercial retail shop name |
| `shops` | `area_id` | UUID | FOREIGN KEY -> `areas.id` |
| `shops` | `balance_due` | NUMERIC(15,2) | Default `0.00`. Outstanding accounts receivable debt |
| `orders` | `id` | UUID | PRIMARY KEY, Default `gen_random_uuid()` |
| `orders` | `order_number` | TEXT | UNIQUE, NOT NULL. Sequential order code |
| `orders` | `shop_id` | UUID | FOREIGN KEY -> `shops.id` |
| `orders` | `booker_id` | UUID | FOREIGN KEY -> `users.id` |
| `orders` | `total_amount` | NUMERIC(15,2) | NOT NULL. Final gross order total |
| `orders` | `status` | TEXT | CHECK (`pending`, `confirmed`, `delivered`, `cancelled`) |
| `order_items` | `id` | UUID | PRIMARY KEY, Default `gen_random_uuid()` |
| `order_items` | `order_id` | UUID | FOREIGN KEY -> `orders.id` (CASCADE DELETE) |
| `order_items` | `product_id` | UUID | FOREIGN KEY -> `products.id` |
| `order_items` | `quantity` | NUMERIC(10,2) | NOT NULL. Units or cartons ordered |
| `order_items` | `unit_price` | NUMERIC(12,2) | NOT NULL. Negotiated wholesale rate applied |
| `products` | `id` | UUID | PRIMARY KEY, Default `gen_random_uuid()` |
| `products` | `name` | TEXT | NOT NULL. Brand product title |
| `products` | `barcode` | TEXT | UNIQUE. Standard EAN-13/UPC barcode number |
| `products` | `price` | NUMERIC(12,2) | NOT NULL. Standard retail price |
| `products` | `wholesale_price` | NUMERIC(12,2) | Discounted price for commercial shop accounts |
| `products` | `stock_quantity` | NUMERIC(12,2) | NOT NULL. Available on-hand quantity |
| `our_orders` | `id` | UUID | PRIMARY KEY, Default `gen_random_uuid()` |
| `our_orders` | `product_id` | UUID | FOREIGN KEY -> `products.id` |
| `our_orders` | `quantity_needed` | NUMERIC(10,2) | Quantity required from FMCG vendor |

---

## 6. Semantic Network (SEMANTIC.NET)

### 6.1 Conceptual Knowledge Ontology Graph
The Semantic Network formally models the enterprise business domain of Shaheen Traders POS as a conceptual knowledge ontology graph:

![Figure 6.1: SEMANTIC.NET Conceptual Ontology Graph](diagrams/semantic_net.png)

### 6.2 Relational Predicates & Business Rules

| Source Node | Predicate / Relation | Target Node | Semantic Meaning & Business Rule |
| :--- | :--- | :--- | :--- |
| `System` | `authenticates` | `System User` | The security subsystem verifies user credentials and permissions. |
| `Booker` | `transmits-ping` | `GPS Coordinates` | Mobile device emits geolocation updates to the tracking server. |
| `Booker` | `books-for` | `Sales Order` | Field sales agent generates an order on behalf of a shop. |
| `Commercial Shop` | `places` | `Sales Order` | A registered shop is the recipient and billing party for the order. |
| `Sales Order` | `contains` | `Catalog Product` | An order consists of specific inventory SKU items with quantities. |
| `Sales Order` | `decrements` | `Inventory Stock` | Completing an order reduces available physical stock in warehouse. |
| `Sales Order` | `triggers` | `Automake Action` | Incoming order creates an instant queue item on the POS register. |
| `Automake Action` | `dispatches-print`| `ESC/POS Receipt`| Executing Automake sends raw ESC/POS commands to printer. |
| `Commercial Shop` | `owes (credit)` | `Receivable Balance` | Unpaid orders increase the commercial debt balance of the shop. |
| `Sales Order` | `increments` | `Receivable Balance` | Credit transactions add directly to outstanding customer ledger. |

---

## 7. Traceability Matrix & Deployment Verification

| Requirement ID | Specification Component | Codebase Implementation File | Verification Status |
| :--- | :--- | :--- | :--- |
| **FR-01** | High-Speed POS Barcode Engine | `src/views/AdminPOSView.tsx` | Verified (Pass) |
| **FR-02** | B2B Field Booker Mobile Portal | `src/views/B2BShopView.tsx` | Verified (Pass) |
| **FR-03** | Automake Live Order Queue | `src/views/IncomingOrdersView.tsx` | Verified (Pass) |
| **FR-04** | Live Booker GPS Tracking Map | `src/components/TrackingMap.tsx` | Verified (Pass) |
| **FR-05** | Multi-Tier Wholesale Rate Engine | `src/views/AdminPOSView.tsx` | Verified (Pass) |
| **FR-06** | Accounts Receivable & Ledger | `src/views/ShopsView.tsx` | Verified (Pass) |
| **FR-07** | Procurement & Vendor Our Orders | `src/views/OurOrderView.tsx` | Verified (Pass) |
| **FR-08** | Offline-First Sync & Storage | `src/utils/safeSync.ts` | Verified (Pass) |
| **FR-09** | Direct TCP 9100 ESC/POS Printing | `src-tauri/src/printer.rs` | Verified (Pass) |
| **FR-10** | Ed25519 Auto-Updates Pipeline | `src/App.tsx`, `tauri.conf.json` | Verified (Pass) |

---
*Official master specification approved for Shaheen Traders POS Release v0.5.84.*
