# Plan - React POS Application Bug Fixes

This plan outlines the approach to address the workflow and data-handling bugs across the Admin and Booker portals.

## Objectives
1. **R1. Restrict Booker Details in Checkout**: Make "Booker Name" and "Payment Terms" fields read-only or disabled in the Checkout UI. Ensure they automatically populate.
2. **R2. Separate Phone Number Field**: Ensure the client's phone number is captured, validated, and displayed in its own dedicated field/column, not appended to the client's name.
3. **R3. Streamline Downloads & Add PDF Support**: Consolidate receipt/invoice export to exactly one PDF file. Remove Excel, SQL, and JSON export/download features from the receipt flow.
4. **R4. Fix "Automake" Workflow**: Ensure incoming orders do not disappear upon "Auto Make" click, and navigate the admin to the Register page pre-filled with the order's products and quantities.

---

## Plan & Milestones

### Milestone 1: Exploration & Database Schema Check
- **Objective**: Inspect the Supabase database schema for the `orders` table to determine if columns like `contact_number`, `payment_terms`, `area`, `booker_name` exist, and check the existing React components and test files.
- **Verification**: Handoff report listing the exact database columns and code locations.

### Milestone 2: Restrict Booker Details (R1) & Separate Phone Number Field (R2)
- **Objective**:
  - Update `B2BCheckout.tsx` and `AdminPOSView.tsx` to set "Booker Name" and "Payment Terms" fields as read-only/disabled.
  - Implement phone number validation (e.g. format and length validation) in `B2BCheckout.tsx`.
  - Save the phone number separately in the order object and send it to Supabase as `contact_number` (or appropriate column). Stop appending it to `client_name`.
  - Update `AdminPOSView.tsx` case `'Orders'` UI to render the phone number in its own dedicated line/field.
- **Verification**: Inspect components, check code diffs, verify no string concatenation on client name.

### Milestone 3: Streamline Downloads (R3)
- **Objective**:
  - Remove all `.xlsx`, `.sql`, and `.json` download trigger logic in `AdminPOSView.tsx`, `OrderPreviewModal.tsx`, `ReceiptView.tsx`, and `DispatchHistory.tsx`.
  - Consolidate receipt exports to a single PDF download using the existing `exportReceiptToPDF` function.
- **Verification**: Clicking download triggers exactly one `.pdf` file download. No Excel, SQL, or JSON files are created or downloaded in the receipt flows.

### Milestone 4: Fix Automake Workflow (R4)
- **Objective**:
  - Modify `handleAcceptOrder` in `AdminPOSView.tsx` so that it doesn't filter/delete the order from the local incoming orders array.
  - Update `fetchOrders` query to include `PROCESSING` status so the order doesn't disappear when its status transitions to `PROCESSING`.
  - Add router navigation / state update (`setActiveMenu('Register')`) to redirect the admin to the Register view.
  - Ensure the Register cart state (`cart`) is pre-filled with all items and exact quantities from the order.
- **Verification**: Run/manual test click on "Auto Make" navigates to Register, fills the cart, and the order remains in the Orders tab.

### Milestone 5: E2E Test Suite and QA Final Review
- **Objective**: Run and verify all playwright E2E tests, review code quality, and produce the final QA report.
- **Verification**: All Playwright E2E tests pass, Forensic Auditor approves the integrity.
