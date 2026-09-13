# Architecture Journal: Shaheen Traders POS

This document explains the architectural decisions, structural patterns, and technology stack choices that power the Shaheen Traders POS system. It serves as a living guide for developers (current and future) to understand *why* things were built this way, not just *what* they are.

---

## 1. The Offline-First Strategy
**Why?** Field bookers traveling to diverse areas often experience spotty 3G/4G connectivity. If the app blocked them from adding to their cart or submitting an order during a network drop, business would halt.
**How?**
- **IndexedDB (`idb-keyval`):** We chose IndexedDB over `localStorage` because IndexedDB is asynchronous and can store hundreds of megabytes of JSON data without blocking the UI thread.
- **Service Workers (PWA):** `vite-plugin-pwa` precaches the HTML/CSS/JS so the app loads instantly, even in airplane mode.
- **The Sync Flow:** When a booker submits an order offline, it is saved locally to a queue. The app silently attempts to push the queue to Supabase whenever the network connects.

## 2. State Management Transition (Zustand & React Query)
**Why?** Historically, the `AdminPOSView` was a massive 120KB monolith with over 40 local `useState` hooks drilled down through dozens of components. This caused unnecessary re-renders, complex prop chains, and massive technical debt.
**How?**
- **Zustand (`src/store/`):** We extracted local UI state (like the Cart, Auth, and Search Queries) into global Zustand stores. Zustand is lightweight, avoids React Context re-render hell, and features built-in `persist` middleware to automatically save the cart to `localStorage`/`IndexedDB` without writing boilerplate.
- **React Query (`src/queries/`):** We replaced manual `useEffect` data fetching with `@tanstack/react-query`. This provides automatic caching, background refetching, and dedupes requests to Supabase, dramatically lowering our database read costs.

## 3. Database Security (Supabase RLS & Zod)
**Why?** We have multiple client types (Admins on desktop, Bookers on mobile) interacting with the same Supabase database. If a Booker's phone was compromised, they could theoretically wipe the `orders` table.
**How?**
- **Row Level Security (RLS):** Supabase runs PostgreSQL RLS. We have strict policies ensuring that `booker_id` must match `auth.uid()` for insertions. `anon` (unauthenticated) users can read products but absolutely cannot view or insert orders.
- **Zod Schemas (`src/schema/`):** Before data is ever sent to Supabase, it is strictly validated against Zod schemas. This prevents silent database drops (e.g., Supabase dropping a row because `retail_price` was sent as an empty string instead of a valid number).

## 4. The Tauri Desktop Wrapper
**Why?** The Admin needs access to local hardware capabilities (Receipt Printers, File System Backups) that web browsers explicitly block for security reasons.
**How?**
- **Tauri v2:** We wrapped the exact same React codebase in Tauri (Rust). Tauri provides a native Windows `.exe` that connects to the local file system (`src/utils/exportManager.ts`) to dump Excel ledgers and JSON backups silently to the `D:\` drive.
- **Security Implications:** To prevent XSS vulnerabilities from escaping the webview and executing Rust IPC commands on the Admin's PC, the app should be strictly audited to prevent `dangerouslySetInnerHTML`.

## 5. UI and UX Patterns
- **Tailwind CSS v4:** Utility-first styling ensures we ship a tiny CSS bundle. We maintain a Dark/Light mode using standard `dark:` prefixes.
- **React Virtuoso:** Used to render massive lists (e.g., thousands of past orders or products) using virtual scrolling, keeping the DOM extremely light and the memory footprint low.

---

### Conclusion
By decoupling State (Zustand) from UI (React), Server Cache (React Query) from Client State, and Desktop Hardware APIs (Tauri) from Web APIs (PWA), the Shaheen POS is built to scale smoothly as trading volume increases over the next decade.
