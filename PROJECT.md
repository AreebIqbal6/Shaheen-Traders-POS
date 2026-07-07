# Project: React POS Application Bug Fixes (Admin & Booker portals)

## Architecture
- **Admin POS View (`AdminPOSView.tsx`)**: The primary dashboard for admins. Manages inventory, registers cash sales, lists incoming B2B orders from bookers, and processes checkouts.
- **Booker Shop View (`B2BShopView.tsx`)**: The mobile-friendly portal for field bookers to place orders offline/online.
- **B2B Checkout Component (`B2BCheckout.tsx`)**: Shared or independent checkout UI utilized in the Booker portal.
- **Order Preview Modal (`OrderPreviewModal.tsx`)**: Dialog in Admin portal displaying receipt details before dispatch and supporting export.
- **Receipt View (`ReceiptView.tsx`)**: Page optimized for displaying and printing orders/receipts to PDF.
- **Dispatch History (`DispatchHistory.tsx`)**: Panel to review historical transactions and print/export receipts.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | M1: Fix Automake Workflow | Ensure orders do not disappear on Automake; navigate to Register view with cart pre-filled. | None | PLANNED |
| 2 | M2: Verification and Audit | Verify correctness via Playwright E2E tests, reviews, challenger checks, and forensic audit. | M1 | PLANNED |

## Interface Contracts
### Automake Transition
- `handleAcceptOrder(order)` updates order state and navigates to `Register` tab.
- Pre-fills Register cart with items (`CartItem[]`) mapping product ID, name, quantity, price, and UOM.

## Code Layout
- `src/views/AdminPOSView.tsx`: Admin panel, incoming orders list, admin checkout, register view.

