# Learning Journal: Shaheen POS & de-Ledgers

## 1. Why this project exists
The system was designed as a modern, offline-first Point of Sale (POS) and inventory management tool. It aims to solve the problem of unreliable internet connections in wholesale and retail environments by leveraging local caching (IndexedDB) combined with background synchronization to a remote database (Supabase).

## 2. Architecture & Design Choices
- **React + TailwindCSS + Vite**: Selected for rapid UI development, robust ecosystem, and high performance.
- **Tailwind v4 (Wharf Theme)**: The UI is custom-styled utilizing the Wharf design system mapping, providing a sleek, modern, and highly legible interface for cashiers.
- **TanStack React Query / Zustand**: Used for aggressive client-side caching, data fetching, and optimistic updates.
- **Supabase**: Chosen for its PostgreSQL foundation, real-time capabilities, and built-in authentication.

## 3. Security Enhancements (The "How")
During development, the following critical security measures were integrated:
- **Row Level Security (RLS)**: Enforced at the database level to ensure tenants/users can only access their respective records.
- **No LocalStorage Sensitive Data**: Auth tokens and sensitive keys are managed by Supabase's secure session handler rather than naked local storage.
- **Custom 404 Error Pages**: Prevents information leakage and provides a safe fallback for invalid routing.

## 4. UI / UX Best Practices
- **Framer Motion**: Integrated for fluid, non-blocking animations (like the 404 page) to enhance perceived performance.
- **Unique Page Titles & Alt Text**: Implemented for accessibility (a11y) and SEO/indexability, ensuring screen readers can correctly interpret the interface.
- **Error Boundaries**: React Error Boundaries wrap all major modules so a crash in one view (e.g., Inventory) doesn't bring down the entire POS.
