## 2026-06-28T14:17:52Z
Your identity is teamwork_preview_worker_pos_m2_1.
Your working directory is C:\Users\Noman Traders\.gemini\antigravity\scratch\pos-app\.agents\teamwork_preview_worker_pos_m2_1.
Your task is to implement the fixes for all the workflow and data-handling bugs.

Please follow these instructions:
1. Review the explorer findings in C:\Users\Noman Traders\.gemini\antigravity\scratch\pos-app\.agents\teamwork_preview_explorer_pos_m1_1\handoff.md and the proposed changes in C:\Users\Noman Traders\.gemini\antigravity\scratch\pos-app\.agents\teamwork_preview_explorer_pos_m1_1\proposed_changes.patch.
2. Implement the changes across these files:
   - `src/components/B2BCheckout.tsx`: Make Booker Name and Payment Terms disabled/readOnly unconditionally. Separate contactNumber from clientName (save to client_phone in db without appending to client_name). Add Pakistani phone number validation format regex.
   - `src/views/B2BShopView.tsx`: Map contact_number to client_phone and stop appending to client_name during sync.
   - `src/views/AdminPOSView.tsx`: Make Booker Name and Payment Terms disabled/readOnly. Add Phone icon and render phone number separately in orders list. Implement phone number validation on dispatch. In handleAcceptOrder, do not filter/splice the order, map items to preserve full metadata, and call setActiveMenu('Register') and setMobileActiveTab('cart'). Also update fetchOrders query to fetch status in ['PENDING', 'ACCEPTED', 'PROCESSING'] so processing orders do not disappear from the incoming list.
   - `src/components/OrderPreviewModal.tsx`: Remove Excel/JSON download buttons and logic. Unify dispatch button under 'Download PDF & Dispatch' and trigger only the PDF download.
   - `src/views/ReceiptView.tsx`: Remove the Excel export button. Retrieve and show client_phone as phone number.
   - `src/views/DispatchHistory.tsx`: Remove Excel and Database JSON export buttons from details slide-over, keeping only 'Download as PDF'. Show Phone number separately in details.
3. Update `e2e/admin.spec.ts` (specifically line 172) and any other test spec files to expect the new button name 'Download PDF & Dispatch' and handle the PDF download verification.
4. Run linter and build to make sure the app compiles cleanly:
   - `npm run lint`
   - `npm run build`
5. Run the Playwright E2E tests:
   - `npm run test:e2e`
6. Write your handoff.md detailing what you modified, lint output, build outcomes, and E2E test results, and message the parent agent (conversation ID: 004d9256-1adc-40a6-a85d-70a70190e727) when complete.
