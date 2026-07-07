const fs = require('fs');
const file = 'src/views/AdminPOSView.tsx';
let content = fs.readFileSync(file, 'utf8');

const splitToken = '      </main>';
const idx = content.indexOf(splitToken);

if (idx === -1) {
  console.log("Could not find </main>!");
  process.exit(1);
}

// Keep everything up to </main>
let newContent = content.substring(0, idx + splitToken.length);

const correctTail = `

      {/* Mobile Bottom Nav */}
      <div className="md:hidden bg-white dark:bg-zinc-900/60 backdrop-blur-md border-t border-slate-200 dark:border-zinc-800/50 flex justify-around items-center p-2 pb-safe shrink-0 z-40">
          <button 
            onClick={() => { setActiveMenu('Register'); setMobileActiveTab('catalog'); }}
            className={\`flex flex-col items-center p-2 transition-colors \${activeMenu === 'Register' && mobileActiveTab === 'catalog' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-300'}\`}
          >
            <Grid size={20} />
            <span className="text-[10px] font-bold mt-1">Catalog</span>
          </button>
          <button 
            onClick={() => { setActiveMenu('Register'); setMobileActiveTab('cart'); }}
            className={\`flex flex-col items-center p-2 relative transition-colors \${activeMenu === 'Register' && mobileActiveTab === 'cart' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-300'}\`}
          >
            <div className="relative">
               <ShoppingCart size={20} />
               {cart.length > 0 && <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">{cart.length}</span>}
            </div>
            <span className="text-[10px] font-bold mt-1">Cart</span>
          </button>
          <button 
            onClick={() => { setActiveMenu('Register'); setMobileActiveTab('checkout'); }}
            className={\`flex flex-col items-center p-2 transition-colors \${activeMenu === 'Register' && mobileActiveTab === 'checkout' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-300'}\`}
          >
            <CreditCard size={20} />
            <span className="text-[10px] font-bold mt-1">Checkout</span>
          </button>
          <button 
            onClick={() => setIsMobileMenuOpen(true)} 
            className="flex flex-col items-center p-2 transition-colors text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-300"
          >
            <Menu size={20} />
            <span className="text-[10px] font-bold mt-1">Menu</span>
          </button>
        </div>

        {/* Order Preview Modal */}
        <OrderPreviewModal 
          isOpen={isReceiptOpen}
          onClose={handleCloseReceipt}
          onDispatch={handleDispatch}
          onBackupSuccess={() => {
             // 1. Immediately remove from incomingOrders local state
             setIncomingOrders(prev => prev.filter(o => o.id !== activeSupabaseId && o.receipt_number !== draftOrderId));
             // 2. Add to permanent blocklist to prevent fetchOrders from ever resurrecting it
             setPermanentlyHiddenOrders(prev => [...prev, activeSupabaseId || draftOrderId]);
             
             setIsReceiptOpen(false); // Optional: Auto close on success
             
             // Reset form after successful backup
             setCart([]);
             setClientName('');
             setArea('');
             setBookerName((() => { const n = localStorage.getItem('shaheen_bookerName'); return (n && n.includes('@')) ? 'Admin' : (n || ''); })());
             setContactNumber('');
             setPaymentTerms('CASH');
             setIsCheckoutSuccess(false);
             toast.success('Order Completed and Removed from Queue!');
          }}
          cart={cart}
          total={total}
          subTotal={subTotal}
          clientName={clientName}
          paymentTerms={paymentTerms as string}
          area={area}
          bookerName={bookerName}
          contactNumber={contactNumber}
          draftOrderId={draftOrderId}
          isSubmitting={isSubmitting}
          isDispatched={isCheckoutSuccess}
        />

        {/* View Order Modal */}
        <SimpleOrderViewModal 
          isOpen={!!viewOrderDetails}
          onClose={() => setViewOrderDetails(null)}
          order={viewOrderDetails}
        />

        {/* Receipt Order Modal */}
        {receiptOrderDetails && (
          <OrderPreviewModal
            isOpen={true}
            isDispatched={true}
            onClose={() => setReceiptOrderDetails(null)}
            cart={receiptOrderDetails.items || []}
            total={receiptOrderDetails.total || receiptOrderDetails.total_amount || 0}
            clientName={receiptOrderDetails.client_name || receiptOrderDetails.clientName || receiptOrderDetails.shop_name || 'Walk-in'}
            paymentTerms={receiptOrderDetails.payment_terms || 'CASH'}
            draftOrderId={receiptOrderDetails.receipt_number || receiptOrderDetails.id}
            area={receiptOrderDetails.area || 'N/A'}
            bookerName={receiptOrderDetails.booker_name || receiptOrderDetails.bookerName || 'Self'}
            contactNumber={receiptOrderDetails.client_phone || receiptOrderDetails.contact_number || receiptOrderDetails.contactNumber || 'N/A'}
            subTotal={receiptOrderDetails.subTotal || receiptOrderDetails.total || receiptOrderDetails.total_amount || 0}
          />
        )}
      </div>

      {/* Hidden Print Receipt Component (A4 Format) */}
      <Receipt 
        className="hidden print:block w-full m-0 p-0 text-black bg-white"
        data={{
          id: receiptOrderDetails ? (receiptOrderDetails.receipt_number || receiptOrderDetails.id) : (lastReceiptNumber || draftOrderId || 'ORD-123'),
          clientName: receiptOrderDetails ? (receiptOrderDetails.client_name || receiptOrderDetails.clientName || receiptOrderDetails.shop_name || 'Walk-in') : (clientName || 'General Cash Sale'),
          area: receiptOrderDetails ? (receiptOrderDetails.area || 'N/A') : (area || ''),
          contactNumber: receiptOrderDetails ? (receiptOrderDetails.client_phone || receiptOrderDetails.contact_number || receiptOrderDetails.contactNumber || 'N/A') : (contactNumber || '-'),
          bookerName: receiptOrderDetails ? (receiptOrderDetails.booker_name || receiptOrderDetails.bookerName || 'Self') : (bookerName || 'Admin'),
          createdAt: receiptOrderDetails ? (receiptOrderDetails.created_at || new Date().toISOString()) : new Date().toISOString(),
          items: receiptOrderDetails ? (receiptOrderDetails.items || []) : cart,
          total: receiptOrderDetails ? (receiptOrderDetails.total || receiptOrderDetails.total_amount || 0) : total
        }}
      />
    </>
  );
}
`;

fs.writeFileSync(file, newContent + correctTail, 'utf8');
console.log("AdminPOSView.tsx FIXED COMPLETELY!");
