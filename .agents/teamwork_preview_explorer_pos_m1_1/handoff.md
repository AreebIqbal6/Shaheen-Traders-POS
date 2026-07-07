# Handoff Report — Preview Explorer (POS Module Phase 1)

## 1. Observation

### Supabase Table Schema & Columns
- Checked `supabase/schema.sql` (lines 40-49) where the `public.orders` table is defined as:
```sql
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    receipt_number TEXT UNIQUE NOT NULL,
    idempotency_key UUID UNIQUE NOT NULL, -- CRITICAL: Prevent Replay Attacks from offline clients
    booker_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    client_name TEXT NOT NULL,
    total_amount NUMERIC(12, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'dispatched',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```
- In `src/components/B2BCheckout.tsx` (lines 58-73):
```typescript
      // Remove extra fields that are likely missing from the Supabase schema
      const { 
        contact_number, 
        b2b_user_id, 
        idempotency_key, 
        source, 
        receipt_number,
        payment_terms,
        ...supabasePayload 
      } = orderPayload;

      // Pack contact number into client_name so it's not lost
      const finalPayload = {
        ...supabasePayload,
        client_name: supabasePayload.client_name + (contact_number ? ` (Phone: ${contact_number})` : '')
      };
```
This confirms that currently, the `orders` table in the database lacks a dedicated `client_phone` (or `contact_number`) column, and the application packs it as a string concatenation inside `client_name` on order submission.

### File Structure & Download/Print Features
- **Checkout Fields & Booker Name / Payment Terms**:
  - Booker Name is read-only in `src/components/B2BCheckout.tsx` only if `activeBooker.name` exists (line 148).
  - Payment Terms select menu is fully interactive in both `src/components/B2BCheckout.tsx` (line 177) and `src/views/AdminPOSView.tsx` (line 996).
  - Booker Name input in Admin Checkout `src/views/AdminPOSView.tsx` (line 1016) is fully editable.
- **Receipt Downloads**:
  - `src/components/OrderPreviewModal.tsx` exports receipt to Excel, JSON, and PDF simultaneously, saving them automatically (lines 95-112, 140-155, 170).
  - `src/views/ReceiptView.tsx` has three buttons in the navigation header (lines 140-176) for Excel export, PDF export, and Print.
  - `src/views/DispatchHistory.tsx` detail drawer has three buttons (lines 319-363) for Excel download, PDF download, and JSON database download.
- **Automake Workflow**:
  - `handleAcceptOrder` in `src/views/AdminPOSView.tsx` (lines 308-339) populates cart details using a simple spread (`...item`) of incoming items, which can drop matching catalog attributes like `stock`, `barcode`, `sku`, or `category`.
  - `handleAcceptOrder` updates the mobile tab via `setMobileActiveTab('cart')` but does NOT update the desktop/overall navigation `activeMenu` tab, leaving the user on the `Orders` dashboard screen instead of navigating to the `Register` view.

---

## 2. Logic Chain

1. **R1 (Read-Only Booker Name & Payment Terms)**:
   - To make these fields read-only and disable edit options in both checkouts:
     - In `B2BCheckout.tsx`, the Booker Name input should have `disabled={true}` and the Payment Terms `select` element should be `disabled={true}`.
     - In `AdminPOSView.tsx`, the Booker Name input should be `disabled={true}` and the Payment Terms `select` element should be `disabled={true}`.
     
2. **R2 (Dedicated Client Phone & Validation)**:
   - To store the phone separately in the database, we must propose a database migration:
     `ALTER TABLE public.orders ADD COLUMN client_phone TEXT;`
   - In `B2BCheckout.tsx` and `B2BShopView.tsx`, we must map `contact_number` directly to the `client_phone` column without concatenating it into `client_name`.
   - In `AdminPOSView.tsx`, `handleAcceptOrder`, `ReceiptView.tsx`, and `DispatchHistory.tsx`, we must retrieve `client_phone` directly from the database row and display it in a dedicated field or column (using the `Phone` icon from `lucide-react`).
   - We must introduce a phone validation regex `/^((\+92)|(92))?3\d{9}$|^03\d{9}$/` in both checkouts before dispatching or submitting orders.

3. **R3 (Streamlined Receipt PDF Download)**:
   - In `OrderPreviewModal.tsx`, we must remove Excel and JSON file generation/download and delete the secondary "Browse & Close" directory picker button, unifying the dispatch flow under a single "Download PDF & Dispatch" button.
   - In `ReceiptView.tsx`, we must delete the "Export Excel" button.
   - In `DispatchHistory.tsx`, we must delete the "Download as Excel" and "Download as Database" buttons, renaming the section to "Download Receipt" and keeping only "Download as PDF".

4. **R4 (Correct Automake Workflow)**:
   - In `AdminPOSView.tsx`'s `handleAcceptOrder`, we must map the incoming order items to full local product specifications (looking up catalog attributes in `products` state by product ID) to avoid losing barcodes or category data.
   - We must call `setActiveMenu('Register')` and `setMobileActiveTab('cart')` to automatically redirect the user to the register screen with the pre-filled cart visible.

---

## 3. Caveats
- Since the live Supabase environment command check timed out due to non-interactive mode, we assume the current live schema matches `schema.sql` (where `orders` table does not contain `client_phone`, `payment_terms`, `area`, or `booker_name`).
- Adding `client_phone` to the database requires executing the migration script. If `payment_terms`, `area`, or `booker_name` also need dedicated DB columns, they should be added as well; otherwise, they remain stored in the local offline cache.

---

## 4. Conclusion
The proposed code changes are comprehensive, addressing B2B Checkout, Admin POS, Receipt View, and Dispatch History. Implementing these modifications will cleanly separate the client's phone number, validate phone numbers, restrict checkout edits, streamline downloads to exactly PDF, and ensure the Automake button redirects the user to the Register page.

---

## 5. Verification Method

### Test Commands
Run the frontend development build and the linter to verify syntactical correctness:
```powershell
npm run lint
npm run build
```

### Files to Inspect
- `src/components/B2BCheckout.tsx`: Verify the contact number validation, `client_phone` payload mapping, and disabled Booker/Terms inputs.
- `src/views/AdminPOSView.tsx`: Verify the disabled inputs, phone validation in dispatch, `setActiveMenu('Register')` call in `handleAcceptOrder`, and item mapping logic.
- `src/components/OrderPreviewModal.tsx`: Verify the removal of Excel/JSON downloads and the unified action button.
- `src/views/ReceiptView.tsx` and `src/views/DispatchHistory.tsx`: Verify the removal of Excel and Database/JSON downloads.
