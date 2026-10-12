# Shaheen Global Traders POS

A modern, offline-first Point of Sale (POS) and B2B ordering system designed specifically for wholesale and retail trading. Built with performance, reliability, and ease of use in mind.

![Shaheen POS](https://img.shields.io/badge/Version-0.5.85-blue)
![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6?logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Database-3ecf8e?logo=supabase&logoColor=white)
![Tauri](https://img.shields.io/badge/Tauri-v2-ffc131?logo=tauri&logoColor=black)

## 🚀 Features

### Core Modules
* **Admin Dashboard (Desktop First):** Complete control over inventory, pricing, past orders, and ledgers.
* **Booker Portal (Mobile First):** A streamlined, touch-friendly B2B shop interface for field agents to submit orders instantly.
* **Offline-First Resilience:** Continues working even without internet. Data is cached locally via IndexedDB and syncs to the cloud automatically when connectivity is restored.
* **Barcode Scanning:** Built-in hardware scanner support alongside a WebAssembly (WASM) camera scanner fallback for mobile devices.

### Business & Operations
* **Advanced Cart System:** Dynamic cart logic with automatic stock validation, multi-tier pricing, and retail/cost tracking.
* **Export & Reporting:** Generate thermal receipts, print A4 invoices, and export financial ledgers to PDF and Excel dynamically.
* **Real-time Syncing:** Powered by Supabase real-time channels to notify the admin terminal immediately when a field booker submits a new order.
* **Security & RLS:** Built-in PostgreSQL Row-Level Security (RLS) ensures that field agents only see what they are authorized to see.

---

## 📚 System Architecture & Engineering Specification (IEEE Std 830 / 1016)

A complete, formal software engineering specification conforming to **IEEE Std 830-1998 (SRS)** and **IEEE Std 1016-2009 (SDD/SDS)** is available in both Microsoft Word (`.docx`) and GitHub Markdown (`.md`) formats:

* **IEEE Master Document (MS Word with 6 Embedded Diagrams):** [`docs/Shaheen_Traders_POS_IEEE_SRS_DFD_SDS_ERD_SEMANTIC_NET.docx`](docs/Shaheen_Traders_POS_IEEE_SRS_DFD_SDS_ERD_SEMANTIC_NET.docx) (or root [`Shaheen_Traders_POS_IEEE_SRS_DFD_SDS_ERD_SEMANTIC_NET.docx`](Shaheen_Traders_POS_IEEE_SRS_DFD_SDS_ERD_SEMANTIC_NET.docx))
* **Specification (Markdown):** [`docs/Shaheen_Traders_POS_SRS_DFD_SDS_ERD_SEMANTIC_NET.md`](docs/Shaheen_Traders_POS_SRS_DFD_SDS_ERD_SEMANTIC_NET.md)
* **Architectural Diagrams (300 DPI Vector-Rendered PNGs):**
  1. **DFD Level 0 (Context):** [`docs/diagrams/dfd_level_0.png`](docs/diagrams/dfd_level_0.png)
  2. **DFD Level 1 (Decomposition):** [`docs/diagrams/dfd_level_1.png`](docs/diagrams/dfd_level_1.png)
  3. **DFD Level 2 (Booker to Automake Workflow):** [`docs/diagrams/dfd_level_2.png`](docs/diagrams/dfd_level_2.png)
  4. **SDS Architecture (4-Tier Topology):** [`docs/diagrams/sds_architecture.png`](docs/diagrams/sds_architecture.png)
  5. **ERD (Relational 3NF Database Schema):** [`docs/diagrams/erd_diagram.png`](docs/diagrams/erd_diagram.png)
  6. **SEMANTIC.NET (Domain Ontology Knowledge Graph):** [`docs/diagrams/semantic_net.png`](docs/diagrams/semantic_net.png)

---

## 🛠️ Tech Stack

* **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4
* **State & Data Fetching:** Zustand, TanStack Query (React Query)
* **Validation:** React Hook Form + Zod
* **Database & Auth:** Supabase (PostgreSQL)
* **Offline Storage:** IndexedDB (`idb-keyval`)
* **Desktop Wrapper:** Tauri v2 (Rust-based native shell)
* **Icons & UI Components:** Lucide React, React Hot Toast, React Virtuoso

---

## ⚙️ Local Development Setup

### Prerequisites
* **Node.js** (v20+ recommended)
* **Git**
* *(Optional)* **Rust** (If you want to compile the Tauri desktop app)

### 1. Clone & Install
```bash
git clone https://github.com/AreebIqbal6/Shaheen-Traders-POS.git
cd Shaheen-Traders-POS
npm install
```

### 2. Environment Variables
Create a `.env` file in the root directory and add your Supabase credentials:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Run Development Server
```bash
npm run dev
```
The app will be available at `http://localhost:5173`.

### 4. Build for Production (Web)
```bash
npm run build
```

### 5. Build Desktop App (Tauri)
To build the native `.exe` or `.app` wrapper:
```bash
npm run tauri build
```

---

## 🔒 Security

* **GitHub Actions:** The repository enforces an `Automated Security Gate` on push, validating all Supabase database migrations, checking RLS policies via `pgTAP`, and scanning the codebase for vulnerabilities.
* **Data Loss Prevention:** Built-in silent local backups write to the local file system on the host PC to prevent critical data loss during network outages.

---

## 📝 License

Proprietary Software. All rights reserved.
