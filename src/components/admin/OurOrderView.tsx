import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Package, Plus, Check, CheckCheck, AlertTriangle, Trash2, Search, 
  ScanLine, Sparkles, Clock, ArrowRight, Edit2, ShoppingCart, Boxes, 
  FileText, ChevronRight, Download, RefreshCw, X, Loader2, CheckCircle2, 
  ChevronDown, ChevronUp, Layers, ArrowUpRight, Filter, Building2, Share2, Printer, 
  Phone, Wallet, CreditCard, DollarSign, ExternalLink, HelpCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import CameraScanner from '../CameraScanner';
import { safeSupabaseInsert, safeSupabaseUpdate } from '../../utils/safeSync';
import { generateUUID } from '../../utils/uuid';
import { getNextSKU, generateSKU } from '../../views/ProductsView';
import type { Product, OurOrderItem, ConfirmedPurchaseOrder, UOMType, VendorLedgerEntry } from '../../types/index';

interface OurOrderViewProps {
  ourOrderList: OurOrderItem[];
  setOurOrderList: React.Dispatch<React.SetStateAction<OurOrderItem[]>>;
  products?: Product[];
  setProducts?: React.Dispatch<React.SetStateAction<Product[]>>;
}

export default function OurOrderView({
  ourOrderList,
  setOurOrderList,
  products = [],
  setProducts
}: OurOrderViewProps) {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'draft' | 'placed' | 'history'>('draft');

  // Confirmed orders stored in localStorage
  const [confirmedOrders, setConfirmedOrders] = useState<ConfirmedPurchaseOrder[]>(() => {
    try {
      const saved = localStorage.getItem('shaheen_confirmed_purchase_orders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('shaheen_confirmed_purchase_orders', JSON.stringify(confirmedOrders));
  }, [confirmedOrders]);

  // ----------------------------------------------------
  // VENDOR / SUPPLIERS & ACCOUNTS PAYABLE STATE
  // ----------------------------------------------------
  const [savedSuppliers, setSavedSuppliers] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('shaheen_suppliers');
      return saved ? JSON.parse(saved) : [
        'National Foods', 'Shan Foods', 'Unilever Pakistan', 'Habib Oil Mills',
        'English Biscuit Manufacturers (EBM)', 'Tapal Tea', 'Nestle Pakistan', 
        'Engro Foods', 'Local Market Wholesaler'
      ];
    } catch {
      return ['National Foods', 'Shan Foods', 'Unilever Pakistan', 'Habib Oil Mills', 'General Wholesaler'];
    }
  });

  const [draftSupplier, setDraftSupplier] = useState({ name: '', phone: '' });
  const [supplierFilter, setSupplierFilter] = useState<string>('ALL');

  // Vendor Credit Ledgers (Accounts Payable)
  const [vendorLedgers, setVendorLedgers] = useState<VendorLedgerEntry[]>(() => {
    try {
      const saved = localStorage.getItem('shaheen_vendor_ledgers');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('shaheen_vendor_ledgers', JSON.stringify(vendorLedgers));
  }, [vendorLedgers]);

  // Modals for partial receiving, bulk receiving, printing, and vendor ledger
  const [receiveItemModal, setReceiveItemModal] = useState<{
    isOpen: boolean;
    orderId: string;
    item: OurOrderItem | null;
    order: ConfirmedPurchaseOrder | null;
    qtyToReceive: number;
    markShortShipped: boolean;
    updateMasterCost: boolean;
    paymentMethod: 'CASH' | 'BANK' | 'VENDOR_CREDIT' | 'NONE';
  }>({
    isOpen: false,
    orderId: '',
    item: null,
    order: null,
    qtyToReceive: 1,
    markShortShipped: false,
    updateMasterCost: true,
    paymentMethod: 'NONE'
  });

  const [receiveAllModal, setReceiveAllModal] = useState<{
    isOpen: boolean;
    order: ConfirmedPurchaseOrder | null;
    updateMasterCost: boolean;
    paymentMethod: 'CASH' | 'BANK' | 'VENDOR_CREDIT' | 'NONE';
  }>({
    isOpen: false,
    order: null,
    updateMasterCost: true,
    paymentMethod: 'NONE'
  });

  const [printOrderModal, setPrintOrderModal] = useState<ConfirmedPurchaseOrder | null>(null);
  const [isVendorLedgerModalOpen, setIsVendorLedgerModalOpen] = useState(false);
  const [expandedHistoryOrderIds, setExpandedHistoryOrderIds] = useState<Record<string, boolean>>({});

  const toggleHistoryOrderExpand = (orderId: string) => {
    setExpandedHistoryOrderIds(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  const handleDeleteOrder = (orderId: string, orderNumber: string) => {
    toast((t) => (
      <div className="flex flex-col gap-2 p-1">
        <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
          Delete Order #{orderNumber}?
        </span>
        <span className="text-xs text-slate-500">
          This will permanently remove this order from history.
        </span>
        <div className="flex gap-2 justify-end mt-2">
          <button 
            className="px-3 py-1 bg-slate-200 text-xs font-semibold rounded text-slate-800"
            onClick={() => toast.dismiss(t.id)}
          >
            Cancel
          </button>
          <button 
            className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded"
            onClick={() => {
              toast.dismiss(t.id);
              setConfirmedOrders(prev => prev.filter(o => o.id !== orderId));
              toast.success(`Order #${orderNumber} deleted.`);
            }}
          >
            Yes, Delete
          </button>
        </div>
      </div>
    ), { duration: 6000 });
  };

  // Minimum stock threshold dictionary
  const minStockDict = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('shaheen_min_stock') || '{}');
    } catch {
      return {};
    }
  }, []);

  // Compute products that are low or zero in stock
  const lowStockProducts = useMemo(() => {
    return products.filter(p => {
      const min = minStockDict[p.id] ?? 5;
      return (p.stock ?? 0) <= min;
    });
  }, [products, minStockDict]);

  // Modals state
  const [isLowStockWizardOpen, setIsLowStockWizardOpen] = useState(false);
  const [isAddExistingModalOpen, setIsAddExistingModalOpen] = useState(false);
  const [isAddNewProductModalOpen, setIsAddNewProductModalOpen] = useState(false);
  const [isAddChoiceModalOpen, setIsAddChoiceModalOpen] = useState(false);

  // ----------------------------------------------------
  // 1. AUTO-SUGGEST LOW STOCK WIZARD STATE
  // ----------------------------------------------------
  interface LowStockWizardItem {
    product: Product;
    selected: boolean;
    unit: UOMType;
    unitQuantity: number;
    costPrice: number;
  }

  const [wizardItems, setWizardItems] = useState<LowStockWizardItem[]>([]);
  const [wizardSearch, setWizardSearch] = useState('');

  const handleOpenLowStockWizard = () => {
    if (lowStockProducts.length === 0) {
      toast.success('All items have healthy inventory stock!', { icon: '🎉' });
      return;
    }

    const items: LowStockWizardItem[] = lowStockProducts.map(p => {
      const defaultUnit: UOMType = p.pcsPerBox ? 'Box' : 'Pcs';
      return {
        product: p,
        selected: true,
        unit: defaultUnit,
        unitQuantity: defaultUnit === 'Box' ? 2 : 12,
        costPrice: p.price || 0
      };
    });

    setWizardItems(items);
    setWizardSearch('');
    setIsLowStockWizardOpen(true);
    setIsAddChoiceModalOpen(false);
  };

  const calculatePieces = (unit: UOMType, qty: number, pcsPerBox?: number, boxPerCtn?: number) => {
    if (unit === 'Ctn') {
      const box = boxPerCtn || 6;
      const pcs = pcsPerBox || 12;
      return qty * box * pcs;
    }
    if (unit === 'Box') {
      const pcs = pcsPerBox || 12;
      return qty * pcs;
    }
    return qty;
  };

  const handleConfirmWizard = () => {
    const selected = wizardItems.filter(i => i.selected && i.unitQuantity > 0);
    if (selected.length === 0) {
      toast.error('Please select at least one item to order.');
      return;
    }

    setOurOrderList(prev => {
      const updated = [...prev];
      selected.forEach(item => {
        const totalPcs = calculatePieces(
          item.unit,
          item.unitQuantity,
          item.product.pcsPerBox,
          item.product.boxPerCtn
        );
        const cost = item.costPrice * totalPcs;

        const existingIdx = updated.findIndex(u => u.id === item.product.id);
        const newItemData: OurOrderItem = {
          id: item.product.id,
          name: item.product.name,
          barcode: item.product.barcode || '',
          sku: item.product.sku,
          unit: item.unit,
          unitQuantity: item.unitQuantity,
          quantityNeeded: totalPcs,
          costPrice: item.costPrice,
          totalCost: cost,
          pcsPerBox: item.product.pcsPerBox,
          boxPerCtn: item.product.boxPerCtn,
          retailPrice: item.product.retail_price,
          category: item.product.category,
          itemType: item.product.item_type || 'Local',
          isNewProduct: false,
          status: 'PENDING'
        };

        if (existingIdx !== -1) {
          updated[existingIdx] = newItemData;
        } else {
          updated.push(newItemData);
        }
      });
      return updated;
    });

    setIsLowStockWizardOpen(false);
    setActiveTab('draft');
    toast.success(`Added ${selected.length} low-stock items to Our Order draft!`);
  };

  // ----------------------------------------------------
  // 2. ADD EXISTING PRODUCT MODAL STATE
  // ----------------------------------------------------
  const [selectedExistingId, setSelectedExistingId] = useState('');
  const [existingSearch, setExistingSearch] = useState('');
  const [existingUnit, setExistingUnit] = useState<UOMType>('Pcs');
  const [existingQuantity, setExistingQuantity] = useState<number>(1);
  const [existingPrice, setExistingPrice] = useState<number>(0);

  const selectedExistingProduct = useMemo(() => {
    return products.find(p => p.id === selectedExistingId);
  }, [products, selectedExistingId]);

  const filteredExistingProducts = useMemo(() => {
    if (!existingSearch.trim()) return products.slice(0, 50);
    const q = existingSearch.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(q) || 
      p.barcode?.toLowerCase().includes(q) || 
      p.sku?.toLowerCase().includes(q)
    ).slice(0, 50);
  }, [products, existingSearch]);

  const handleSelectExisting = (p: Product) => {
    setSelectedExistingId(p.id);
    setExistingPrice(p.price || 0);
    const defUnit: UOMType = p.pcsPerBox ? 'Box' : 'Pcs';
    setExistingUnit(defUnit);
    setExistingQuantity(defUnit === 'Box' ? 2 : 12);
  };

  const handleAddExistingToDraft = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExistingProduct) {
      toast.error('Please select a product from the list.');
      return;
    }
    if (existingQuantity <= 0) {
      toast.error('Quantity must be greater than zero.');
      return;
    }

    const totalPcs = calculatePieces(
      existingUnit,
      existingQuantity,
      selectedExistingProduct.pcsPerBox,
      selectedExistingProduct.boxPerCtn
    );
    const totalCost = (existingPrice || 0) * totalPcs;

    const newItem: OurOrderItem = {
      id: selectedExistingProduct.id,
      name: selectedExistingProduct.name,
      barcode: selectedExistingProduct.barcode || '',
      sku: selectedExistingProduct.sku,
      unit: existingUnit,
      unitQuantity: existingQuantity,
      quantityNeeded: totalPcs,
      costPrice: existingPrice,
      totalCost,
      pcsPerBox: selectedExistingProduct.pcsPerBox,
      boxPerCtn: selectedExistingProduct.boxPerCtn,
      retailPrice: selectedExistingProduct.retail_price,
      category: selectedExistingProduct.category,
      itemType: selectedExistingProduct.item_type || 'Local',
      isNewProduct: false,
      status: 'PENDING'
    };

    setOurOrderList(prev => {
      const idx = prev.findIndex(i => i.id === newItem.id);
      if (idx !== -1) {
        const copy = [...prev];
        copy[idx] = newItem;
        return copy;
      }
      return [...prev, newItem];
    });

    setIsAddExistingModalOpen(false);
    setSelectedExistingId('');
    setExistingSearch('');
    setActiveTab('draft');
    toast.success(`Added ${selectedExistingProduct.name} to Our Order draft!`);
  };

  // ----------------------------------------------------
  // 3. ADD NEW PRODUCT MODAL STATE (Matching ProductsView)
  // ----------------------------------------------------
  const [newProdName, setNewProdName] = useState('');
  const [newProdBarcode, setNewProdBarcode] = useState('');
  const [newProdItemType, setNewProdItemType] = useState<'Local' | 'Imported'>('Local');
  const [newProdPrice, setNewProdPrice] = useState<number>(0);
  const [newProdRetailPrice, setNewProdRetailPrice] = useState<number | undefined>(undefined);
  const [newProdPcsPerBox, setNewProdPcsPerBox] = useState<number | undefined>(12);
  const [newProdBoxPerCtn, setNewProdBoxPerCtn] = useState<number | undefined>(6);
  const [newProdMinStock, setNewProdMinStock] = useState<number>(5);
  const [newProdOrderUnit, setNewProdOrderUnit] = useState<UOMType>('Box');
  const [newProdOrderQty, setNewProdOrderQty] = useState<number>(2);
  const [isScannerActive, setIsScannerActive] = useState(false);

  const newProdAutoSku = useMemo(() => {
    return getNextSKU(products);
  }, [products]);

  const handleOpenAddNewProduct = () => {
    setNewProdName('');
    setNewProdBarcode('BC-' + Date.now().toString(36).toUpperCase());
    setNewProdItemType('Local');
    setNewProdPrice(0);
    setNewProdRetailPrice(undefined);
    setNewProdPcsPerBox(12);
    setNewProdBoxPerCtn(6);
    setNewProdMinStock(5);
    setNewProdOrderUnit('Box');
    setNewProdOrderQty(2);
    setIsAddNewProductModalOpen(true);
    setIsAddChoiceModalOpen(false);
  };

  const handleAddNewProductToDraft = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim()) {
      toast.error('Product Name is required.');
      return;
    }
    if (newProdOrderQty <= 0) {
      toast.error('Order quantity must be greater than zero.');
      return;
    }

    const totalPcs = calculatePieces(newProdOrderUnit, newProdOrderQty, newProdPcsPerBox, newProdBoxPerCtn);
    const totalCost = (newProdPrice || 0) * totalPcs;
    const tempId = generateUUID();

    const newItem: OurOrderItem = {
      id: tempId,
      name: newProdName.trim(),
      barcode: newProdBarcode.trim(),
      sku: newProdAutoSku,
      unit: newProdOrderUnit,
      unitQuantity: newProdOrderQty,
      quantityNeeded: totalPcs,
      costPrice: newProdPrice,
      totalCost,
      pcsPerBox: newProdPcsPerBox,
      boxPerCtn: newProdBoxPerCtn,
      retailPrice: newProdRetailPrice,
      category: 'General',
      itemType: newProdItemType,
      minStock: newProdMinStock,
      isNewProduct: true,
      status: 'PENDING'
    };

    setOurOrderList(prev => [...prev, newItem]);
    setIsAddNewProductModalOpen(false);
    setActiveTab('draft');
    toast.success(`New product "${newItem.name}" added to Our Order draft!`);
  };

  // ----------------------------------------------------
  // FINANCIAL LEDGER & CASH MANAGEMENT RECORDING HELPER
  // ----------------------------------------------------
  const recordFinancialTransaction = (
    orderNumber: string,
    vendorName: string,
    amount: number,
    method: 'CASH' | 'BANK' | 'VENDOR_CREDIT' | 'NONE'
  ) => {
    if (method === 'NONE' || amount <= 0) return;

    if (method === 'CASH') {
      try {
        const cashTxs = JSON.parse(localStorage.getItem('shaheen_cash_transactions') || '[]');
        const newTx = {
          id: generateUUID(),
          type: 'EXPENSE',
          category: 'SUPPLIER_PURCHASE',
          amount,
          description: `Stock Purchase: PO #${orderNumber} (${vendorName || 'Supplier'})`,
          date: new Date().toISOString(),
          cashier: 'Admin'
        };
        localStorage.setItem('shaheen_cash_transactions', JSON.stringify([newTx, ...cashTxs]));
      } catch (e) {
        console.warn('Failed to record cash drawer transaction:', e);
      }
    } else if (method === 'VENDOR_CREDIT') {
      const newBill: VendorLedgerEntry = {
        id: generateUUID(),
        vendorName: vendorName || 'General Supplier',
        orderNumber,
        amount,
        type: 'BILL',
        date: new Date().toISOString(),
        paymentMethod: 'VENDOR_CREDIT',
        notes: `Stock purchase invoice for PO #${orderNumber}`
      };
      setVendorLedgers(prev => [newBill, ...prev]);
    } else if (method === 'BANK') {
      try {
        const cashTxs = JSON.parse(localStorage.getItem('shaheen_cash_transactions') || '[]');
        const newTx = {
          id: generateUUID(),
          type: 'BANK_TRANSFER',
          category: 'SUPPLIER_PURCHASE',
          amount,
          description: `Bank transfer payment for PO #${orderNumber} (${vendorName || 'Supplier'})`,
          date: new Date().toISOString(),
          cashier: 'Admin'
        };
        localStorage.setItem('shaheen_cash_transactions', JSON.stringify([newTx, ...cashTxs]));
      } catch (e) {}
    }
  };

  const handleSettleVendorBill = (billId: string, payFromCash: boolean = false) => {
    const bill = vendorLedgers.find(b => b.id === billId);
    if (!bill) return;

    if (payFromCash) {
      try {
        const cashTxs = JSON.parse(localStorage.getItem('shaheen_cash_transactions') || '[]');
        const newTx = {
          id: generateUUID(),
          type: 'EXPENSE',
          category: 'VENDOR_PAYABLE_SETTLEMENT',
          amount: bill.amount,
          description: `Settled Vendor Bill for ${bill.vendorName} (PO #${bill.orderNumber})`,
          date: new Date().toISOString(),
          cashier: 'Admin'
        };
        localStorage.setItem('shaheen_cash_transactions', JSON.stringify([newTx, ...cashTxs]));
      } catch (e) {}
    }

    setVendorLedgers(prev => prev.filter(b => b.id !== billId));
    toast.success(`Bill of Rs ${bill.amount.toLocaleString()} for ${bill.vendorName} settled!`);
  };

  // ----------------------------------------------------
  // 4. CONFIRM & PLACE PURCHASE ORDER
  // ----------------------------------------------------
  const handleConfirmPurchaseOrder = () => {
    if (ourOrderList.length === 0) {
      toast.error('No items in the draft to order.');
      return;
    }

    toast((t) => (
      <div className="flex flex-col gap-2 p-1">
        <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
          Confirm and place this purchase order?
        </span>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {ourOrderList.length} items • Total Estimated Cost: Rs {draftTotalCost.toLocaleString()}
          {draftSupplier.name && ` • Vendor: ${draftSupplier.name}`}
        </span>
        <div className="flex gap-2 justify-end mt-2">
          <button 
            className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded text-xs font-semibold"
            onClick={() => toast.dismiss(t.id)}
          >
            Review More
          </button>
          <button 
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold shadow-sm"
            onClick={() => {
              toast.dismiss(t.id);
              const orderNum = `PO-${Date.now().toString().slice(-5)}`;
              
              // Persist supplier if new
              const supName = draftSupplier.name.trim();
              if (supName && !savedSuppliers.includes(supName)) {
                const updated = [...savedSuppliers, supName];
                setSavedSuppliers(updated);
                localStorage.setItem('shaheen_suppliers', JSON.stringify(updated));
              }

              const newOrder: ConfirmedPurchaseOrder = {
                id: generateUUID(),
                orderNumber: orderNum,
                date: new Date().toISOString(),
                supplierName: supName || undefined,
                supplierPhone: draftSupplier.phone.trim() || undefined,
                items: ourOrderList.map(item => ({ 
                  ...item, 
                  supplierName: supName || undefined,
                  status: 'ORDERED' as const,
                  receivedUnitQuantity: 0,
                  receivedQuantityNeeded: 0
                })),
                totalAmount: draftTotalCost,
                status: 'PENDING'
              };

              setConfirmedOrders(prev => [newOrder, ...prev]);
              setOurOrderList([]);
              setDraftSupplier({ name: '', phone: '' });
              setActiveTab('placed');
              toast.success(`Purchase Order #${orderNum} confirmed and awaiting reception!`, { duration: 5000 });
            }}
          >
            Yes, Place Order
          </button>
        </div>
      </div>
    ), { duration: 8000, position: 'top-center' });
  };

  // ----------------------------------------------------
  // WHATSAPP SHARE GENERATOR
  // ----------------------------------------------------
  const handleShareWhatsApp = (order: ConfirmedPurchaseOrder) => {
    const supplierText = order.supplierName ? `🏢 *Vendor:* ${order.supplierName}\n` : '';
    let itemsText = '';
    order.items.forEach((it, idx) => {
      const unitText = `${it.unitQuantity || 1} ${it.unit || 'Pcs'} (${it.quantityNeeded} Pcs)`;
      const rateText = it.costPrice ? ` @ Rs. ${it.costPrice.toLocaleString()}/pc` : '';
      const lineTotalText = it.totalCost ? ` -> Rs. ${it.totalCost.toLocaleString()}` : '';
      const statusText = it.status === 'RECEIVED' 
        ? ' [✓ Received]' 
        : (it.status === 'PARTIALLY_RECEIVED' ? ` [Partial: ${it.receivedUnitQuantity || 0}/${it.unitQuantity || 0}]` : '');
      itemsText += `${idx + 1}. *${it.name}*\n   • Qty: ${unitText}${rateText}${lineTotalText}${statusText}\n`;
    });

    const message = 
      `📦 *PURCHASE REQUISITION ORDER*\n` +
      `🏢 *Shaheen Global Traders*\n` +
      `📋 *PO Ref:* #${order.orderNumber}\n` +
      supplierText +
      `📅 *Date:* ${new Date(order.date).toLocaleDateString()}\n` +
      `----------------------------------------\n` +
      itemsText +
      `----------------------------------------\n` +
      `📦 *Total Line Items:* ${order.items.length}\n` +
      `💰 *Total Estimated Value:* Rs. ${order.totalAmount.toLocaleString()}\n\n` +
      `_Please confirm dispatch schedule and delivery ETA._`;

    let phone = order.supplierPhone ? order.supplierPhone.replace(/[^0-9]/g, '') : '';
    if (phone.startsWith('0')) {
      phone = '92' + phone.slice(1);
    }
    const url = phone 
      ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;

    window.open(url, '_blank');
  };

  // ----------------------------------------------------
  // 5. RECEIVE SINGLE ITEM INTO INVENTORY (Modal Opener)
  // ----------------------------------------------------
  const handleReceiveItem = (orderId: string, item: OurOrderItem) => {
    const order = confirmedOrders.find(o => o.id === orderId) || null;
    const remainingUnits = (item.unitQuantity || 1) - (item.receivedUnitQuantity || 0);

    setReceiveItemModal({
      isOpen: true,
      orderId,
      item,
      order,
      qtyToReceive: Math.max(1, remainingUnits),
      markShortShipped: false,
      updateMasterCost: true,
      paymentMethod: 'NONE'
    });
  };

  // Confirm Single Item Reception from Modal
  const confirmItemReception = async () => {
    const { orderId, item, order, qtyToReceive, markShortShipped, updateMasterCost, paymentMethod } = receiveItemModal;
    if (!item) return;

    const multiplier = item.unit === 'Ctn' ? ((item.pcsPerBox || 12) * (item.boxPerCtn || 6)) : (item.unit === 'Box' ? (item.pcsPerBox || 12) : 1);
    const arrivedPieces = qtyToReceive * multiplier;
    const lineCost = arrivedPieces * (item.costPrice || 0);

    // 1. Add Stock into Inventory
    await executeItemReception(item, arrivedPieces, updateMasterCost);

    // 2. Financial settlement record
    if (paymentMethod !== 'NONE' && lineCost > 0) {
      recordFinancialTransaction(
        order?.orderNumber || 'DIRECT',
        order?.supplierName || item.supplierName || 'Vendor',
        lineCost,
        paymentMethod
      );
    }

    // 3. Update Order Item Status
    setConfirmedOrders(prev => prev.map(po => {
      if (po.id !== orderId) return po;

      const updatedItems = po.items.map(it => {
        if (it.id !== item.id) return it;

        const newReceivedUnits = (it.receivedUnitQuantity || 0) + qtyToReceive;
        const newReceivedPieces = (it.receivedQuantityNeeded || 0) + arrivedPieces;
        const isFull = newReceivedUnits >= (it.unitQuantity || 1);
        const isCompleted = isFull || markShortShipped;

        return {
          ...it,
          receivedUnitQuantity: newReceivedUnits,
          receivedQuantityNeeded: newReceivedPieces,
          status: isCompleted ? ('RECEIVED' as const) : ('PARTIALLY_RECEIVED' as const),
          receivedAt: new Date().toISOString(),
          shortShippedReason: markShortShipped ? 'Short-shipped / Closed by operator' : undefined
        };
      });

      const allReceived = updatedItems.every(it => it.status === 'RECEIVED');

      return {
        ...po,
        items: updatedItems,
        status: allReceived ? ('RECEIVED' as const) : ('PARTIALLY_RECEIVED' as const)
      };
    }));

    toast.success(`Received +${arrivedPieces} pcs of "${item.name}" into inventory!`, { icon: '📦' });
    setReceiveItemModal(prev => ({ ...prev, isOpen: false, item: null }));
  };

  // ----------------------------------------------------
  // 6. RECEIVE ALL ITEMS FROM AN ORDER (Modal Opener)
  // ----------------------------------------------------
  const handleReceiveAll = (order: ConfirmedPurchaseOrder) => {
    const unreceived = order.items.filter(i => i.status !== 'RECEIVED');
    if (unreceived.length === 0) {
      toast.success('All items in this order have already been received.');
      return;
    }

    setReceiveAllModal({
      isOpen: true,
      order,
      updateMasterCost: true,
      paymentMethod: 'NONE'
    });
  };

  // Confirm Bulk Reception from Modal
  const confirmReceiveAll = async () => {
    const { order, updateMasterCost, paymentMethod } = receiveAllModal;
    if (!order) return;

    const unreceived = order.items.filter(i => i.status !== 'RECEIVED');
    let totalPiecesReceived = 0;
    let totalReceivedCost = 0;

    for (const it of unreceived) {
      const remainingUnits = (it.unitQuantity || 1) - (it.receivedUnitQuantity || 0);
      const multiplier = it.unit === 'Ctn' ? ((it.pcsPerBox || 12) * (it.boxPerCtn || 6)) : (it.unit === 'Box' ? (it.pcsPerBox || 12) : 1);
      const remainingPieces = Math.max(0, it.quantityNeeded - (it.receivedQuantityNeeded || 0));

      await executeItemReception(it, remainingPieces, updateMasterCost);
      totalPiecesReceived += remainingPieces;
      totalReceivedCost += (remainingPieces * (it.costPrice || 0));
    }

    // Record Financial Transaction
    if (paymentMethod !== 'NONE' && totalReceivedCost > 0) {
      recordFinancialTransaction(
        order.orderNumber,
        order.supplierName || 'Vendor',
        totalReceivedCost,
        paymentMethod
      );
    }

    setConfirmedOrders(prev => prev.map(po => {
      if (po.id !== order.id) return po;
      return {
        ...po,
        items: po.items.map(it => ({
          ...it,
          receivedUnitQuantity: it.unitQuantity || 1,
          receivedQuantityNeeded: it.quantityNeeded,
          status: 'RECEIVED' as const,
          receivedAt: new Date().toISOString()
        })),
        status: 'RECEIVED',
        paymentMethod: paymentMethod !== 'NONE' ? paymentMethod : po.paymentMethod
      };
    }));

    toast.success(`All items from Order #${order.orderNumber} (+${totalPiecesReceived} pcs) successfully received!`, { icon: '✅' });
    setReceiveAllModal({ isOpen: false, order: null, updateMasterCost: true, paymentMethod: 'NONE' });
  };

  // Helper to apply product reception to state, localStorage, and Supabase
  const executeItemReception = async (
    item: OurOrderItem, 
    receivedPieces: number = item.quantityNeeded, 
    updateMasterCost: boolean = true
  ) => {
    const existing = products.find(p => p.id === item.id || (p.barcode && p.barcode === item.barcode));

    if (item.isNewProduct || !existing) {
      // Create brand new product
      const newProduct: Product = {
        id: item.id || generateUUID(),
        name: item.name,
        barcode: item.barcode || ('BC-' + generateUUID().slice(0, 8).toUpperCase()),
        sku: item.sku || generateSKU(item.name, item.barcode),
        price: (item.costPrice && item.costPrice > 0) ? item.costPrice : 0,
        stock: receivedPieces,
        pcsPerBox: item.pcsPerBox || 12,
        boxPerCtn: item.boxPerCtn || 6,
        retail_price: item.retailPrice,
        item_type: item.itemType || 'Local'
      };

      if (setProducts) {
        setProducts(prev => {
          const updated = [newProduct, ...prev.filter(p => p.id !== newProduct.id)];
          localStorage.setItem('shaheen_products', JSON.stringify(updated));
          return updated;
        });
      }

      if (item.minStock) {
        try {
          const msDict = JSON.parse(localStorage.getItem('shaheen_min_stock') || '{}');
          msDict[newProduct.id] = item.minStock;
          localStorage.setItem('shaheen_min_stock', JSON.stringify(msDict));
        } catch {}
      }
      if (item.retailPrice) {
        try {
          const rpDict = JSON.parse(localStorage.getItem('shaheen_retail_prices') || '{}');
          rpDict[newProduct.id] = item.retailPrice;
          localStorage.setItem('shaheen_retail_prices', JSON.stringify(rpDict));
        } catch {}
      }

      // Sync to Cloud / Offline queue
      try {
        await safeSupabaseInsert('products', {
          id: newProduct.id,
          name: newProduct.name,
          barcode: newProduct.barcode,
          sku: newProduct.sku,
          price: newProduct.price,
          stock: newProduct.stock,
          total_base_pieces: newProduct.stock,
          pcs_per_box: newProduct.pcsPerBox,
          box_per_ctn: newProduct.boxPerCtn,
          retail_price: newProduct.retail_price,
          item_type: newProduct.item_type
        });
      } catch (err) {
        console.warn('Failed to insert new product to Supabase, queued offline:', err);
      }
    } else {
      // Restock existing product
      const newStock = (existing.stock || 0) + receivedPieces;
      const newPrice = (updateMasterCost && item.costPrice && item.costPrice > 0) ? item.costPrice : existing.price;

      if (setProducts) {
        setProducts(prev => {
          const updated = prev.map(p => p.id === existing.id ? { ...p, stock: newStock, price: newPrice } : p);
          localStorage.setItem('shaheen_products', JSON.stringify(updated));
          return updated;
        });
      }

      // Sync to Cloud
      try {
        await safeSupabaseUpdate('products', existing.id, {
          stock: newStock,
          total_base_pieces: newStock,
          ...(updateMasterCost && item.costPrice && item.costPrice > 0 ? { price: newPrice } : {})
        });
      } catch (err) {
        console.warn('Failed to update product stock on Supabase:', err);
      }
    }
  };

  // Draft calculations
  const draftTotalCost = useMemo(() => {
    return ourOrderList.reduce((acc, item) => {
      return acc + (item.totalCost || (item.quantityNeeded * (item.costPrice || 0)));
    }, 0);
  }, [ourOrderList]);

  const draftTotalPieces = useMemo(() => {
    return ourOrderList.reduce((acc, item) => acc + item.quantityNeeded, 0);
  }, [ourOrderList]);

  // Placed orders filtering by status and supplier
  const activePlacedOrders = useMemo(() => {
    return confirmedOrders.filter(po => {
      const isNotReceived = po.status !== 'RECEIVED';
      if (!isNotReceived) return false;
      if (supplierFilter === 'ALL') return true;
      return po.supplierName === supplierFilter;
    });
  }, [confirmedOrders, supplierFilter]);

  const historyPlacedOrders = useMemo(() => {
    return confirmedOrders.filter(po => {
      const isReceived = po.status === 'RECEIVED';
      if (!isReceived) return false;
      if (supplierFilter === 'ALL') return true;
      return po.supplierName === supplierFilter;
    });
  }, [confirmedOrders, supplierFilter]);

  // Unique list of suppliers in current placed orders
  const activeSuppliersInOrders = useMemo(() => {
    const set = new Set<string>();
    confirmedOrders.forEach(po => {
      if (po.supplierName) set.add(po.supplierName);
    });
    return Array.from(set);
  }, [confirmedOrders]);

  // Total outstanding unpaid vendor bills
  const totalVendorPayables = useMemo(() => {
    return vendorLedgers.reduce((acc, b) => acc + (b.amount || 0), 0);
  }, [vendorLedgers]);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-[#0a0a0c] overflow-y-auto">
      {/* Top Header */}
      <div className="bg-white dark:bg-zinc-900/60 border-b border-slate-200 dark:border-zinc-800/50 px-6 py-4 shrink-0 z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Purchase / Our Order</h1>
            {lowStockProducts.length > 0 && (
              <span className="bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 text-xs font-bold px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800/50 flex items-center gap-1">
                <AlertTriangle size={12} /> {lowStockProducts.length} low stock
              </span>
            )}
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium">
            Manage purchasing, stock requisitions, and receive supplier deliveries directly into inventory.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Vendor Payables Ledger Button */}
          <button
            onClick={() => setIsVendorLedgerModalOpen(true)}
            className={`flex items-center gap-1.5 px-3.5 py-2 font-bold text-xs rounded-lg shadow-sm transition-all border ${
              totalVendorPayables > 0
                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-900/50'
                : 'bg-white hover:bg-slate-50 text-slate-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-slate-300 border-slate-200 dark:border-zinc-700'
            }`}
            title="View vendor credit ledgers and unpaid supplier bills"
          >
            <Wallet size={14} className={totalVendorPayables > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500'} />
            Vendor Payables
            {totalVendorPayables > 0 && (
              <span className="bg-rose-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                Rs {totalVendorPayables.toLocaleString()}
              </span>
            )}
          </button>

          <button 
            onClick={handleOpenLowStockWizard}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-lg shadow-sm transition-all"
          >
            <Sparkles size={14} /> Auto-Scan Low Stock
          </button>

          <button 
            onClick={() => setIsAddChoiceModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm transition-all"
          >
            <Plus size={15} /> Add to Order
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-slate-100/60 dark:bg-zinc-900/40 border-b border-slate-200 dark:border-zinc-800/50 px-6 py-2 flex items-center gap-2 shrink-0">
        <button
          onClick={() => setActiveTab('draft')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
            activeTab === 'draft' 
              ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/80 dark:border-zinc-700' 
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <ShoppingCart size={14} />
          Current Draft
          {ourOrderList.length > 0 && (
            <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
              {ourOrderList.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('placed')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
            activeTab === 'placed' 
              ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/80 dark:border-zinc-700' 
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Clock size={14} />
          Placed Orders (Awaiting Delivery)
          {activePlacedOrders.length > 0 && (
            <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
              {activePlacedOrders.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
            activeTab === 'history' 
              ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/80 dark:border-zinc-700' 
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <CheckCircle2 size={14} />
          Received History ({historyPlacedOrders.length})
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
        {/* ==================================================== */}
        {/* TAB 1: CURRENT DRAFT ORDER                           */}
        {/* ==================================================== */}
        {activeTab === 'draft' && (
          <div className="max-w-6xl mx-auto flex flex-col gap-6">
            {ourOrderList.length === 0 ? (
              <div className="bg-white dark:bg-zinc-900/60 rounded-xl border border-slate-200 dark:border-zinc-800/50 p-12 flex flex-col items-center justify-center text-center shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
                  <Package size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-1">Your Order Draft is Empty</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6">
                  Add items to your purchase requisition by scanning low stock items, restocking existing products, or defining new items.
                </p>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={handleOpenLowStockWizard}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-lg shadow-sm transition-all flex items-center gap-1.5"
                  >
                    <Sparkles size={14} /> Auto-Scan Low Stock ({lowStockProducts.length})
                  </button>
                  <button 
                    onClick={() => setIsAddChoiceModalOpen(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm transition-all flex items-center gap-1.5"
                  >
                    <Plus size={14} /> Add Items Manually
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {/* Draft Actions & Summary Bar */}
                <div className="bg-white dark:bg-zinc-900/60 p-4 rounded-xl border border-slate-200 dark:border-zinc-800/50 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-6">
                    <div>
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Total Items</span>
                      <span className="text-lg font-bold text-slate-900 dark:text-slate-50">{ourOrderList.length}</span>
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Total Base Pieces</span>
                      <span className="text-lg font-bold text-slate-900 dark:text-slate-50">{draftTotalPieces.toLocaleString()} pcs</span>
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Estimated Total Cost</span>
                      <span className="text-xl font-black text-blue-600 dark:text-blue-400">Rs {draftTotalCost.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button 
                      onClick={() => {
                        toast((t) => (
                          <div className="flex flex-col gap-2 p-1">
                            <span className="font-bold text-slate-900 text-sm">Clear entire draft list?</span>
                            <div className="flex gap-2 justify-end mt-2">
                              <button className="px-3 py-1 bg-slate-200 text-xs font-semibold rounded" onClick={() => toast.dismiss(t.id)}>Cancel</button>
                              <button className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded" onClick={() => { toast.dismiss(t.id); setOurOrderList([]); toast.success('Draft cleared'); }}>Yes, Clear</button>
                            </div>
                          </div>
                        ));
                      }}
                      className="px-3.5 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-bold rounded-lg border border-red-200 dark:border-red-900/40 transition-colors"
                    >
                      Clear Draft
                    </button>
                    <button 
                      onClick={handleConfirmPurchaseOrder}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-md transition-all flex items-center gap-1.5"
                    >
                      <Check size={16} /> Confirm & Place Order
                    </button>
                  </div>
                </div>

                {/* Vendor / Supplier Tagging Card */}
                <div className="bg-white dark:bg-zinc-900/60 p-4 rounded-xl border border-slate-200 dark:border-zinc-800/50 shadow-sm flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                      <Building2 size={15} className="text-blue-600" /> Vendor / Supplier Tagging (Optional)
                    </span>
                    <span className="text-[11px] text-slate-400 hidden sm:inline">
                      Tag orders to distributors for automatic WhatsApp routing & ledger billing
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                        Distributor / Supplier Name
                      </label>
                      <input
                        type="text"
                        list="supplier-suggestions"
                        placeholder="e.g. National Foods, Unilever, Habib Oil..."
                        value={draftSupplier.name}
                        onChange={e => setDraftSupplier(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                      />
                      <datalist id="supplier-suggestions">
                        {savedSuppliers.map(s => (
                          <option key={s} value={s} />
                        ))}
                      </datalist>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                        Supplier WhatsApp / Phone (Optional)
                      </label>
                      <div className="relative">
                        <Phone size={14} className="absolute left-3 top-2.5 text-slate-400" />
                        <input
                          type="text"
                          placeholder="e.g. 03001234567"
                          value={draftSupplier.phone}
                          onChange={e => setDraftSupplier(prev => ({ ...prev, phone: e.target.value }))}
                          className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-slate-900 dark:text-white outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Quick Clickable Supplier Pills */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quick Select:</span>
                    {savedSuppliers.slice(0, 6).map(sup => (
                      <button
                        key={sup}
                        type="button"
                        onClick={() => setDraftSupplier(prev => ({ ...prev, name: sup }))}
                        className={`text-[11px] px-2.5 py-0.5 rounded-full border transition-all ${
                          draftSupplier.name === sup
                            ? 'bg-blue-600 text-white border-blue-600 font-bold'
                            : 'bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-zinc-700 font-medium'
                        }`}
                      >
                        {sup}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Draft Items Table */}
                <div className="bg-white dark:bg-zinc-900/60 rounded-xl border border-slate-200 dark:border-zinc-800/50 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="bg-slate-100/80 dark:bg-zinc-800/50 border-b border-slate-200 dark:border-zinc-800">
                          <th className="py-3 px-4 font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">Product Name</th>
                          <th className="py-3 px-4 font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">Barcode / SKU</th>
                          <th className="py-3 px-4 font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 text-center">Unit & Qty</th>
                          <th className="py-3 px-4 font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 text-center">Total Pieces</th>
                          <th className="py-3 px-4 font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 text-right">Cost / Pc</th>
                          <th className="py-3 px-4 font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 text-right">Total Cost</th>
                          <th className="py-3 px-4 font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ourOrderList.map((item) => (
                          <tr key={item.id} className="border-b border-slate-100 dark:border-zinc-800/40 hover:bg-slate-50/80 dark:hover:bg-zinc-800/30 transition-colors">
                            <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-100">
                              <div className="flex items-center gap-2">
                                <span>{item.name}</span>
                                {item.isNewProduct && (
                                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                                    NEW PRODUCT
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-xs font-mono text-slate-500 dark:text-slate-400">
                              <div>{item.barcode || '-'}</div>
                              {item.sku && <div className="text-[10px] text-slate-400">SKU: {item.sku}</div>}
                            </td>
                            <td className="py-3.5 px-4 text-center font-bold text-slate-800 dark:text-slate-200">
                              <span className="bg-slate-100 dark:bg-zinc-800 px-2.5 py-1 rounded text-xs">
                                {item.unitQuantity || 1} {item.unit || 'Pcs'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-center font-bold text-blue-600 dark:text-blue-400">
                              {item.quantityNeeded} pcs
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono font-medium text-slate-700 dark:text-slate-300">
                              Rs {(item.costPrice || 0).toLocaleString()}
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-slate-50">
                              Rs {(item.totalCost || (item.quantityNeeded * (item.costPrice || 0))).toLocaleString()}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <button 
                                onClick={() => setOurOrderList(prev => prev.filter(i => i.id !== item.id))}
                                className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                                title="Remove item"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 2: PLACED ORDERS (AWAITING DELIVERY)             */}
        {/* ==================================================== */}
        {activeTab === 'placed' && (
          <div className="max-w-6xl mx-auto flex flex-col gap-6">
            {/* Supplier Filter Bar */}
            {activeSuppliersInOrders.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 bg-white dark:bg-zinc-900/60 p-3 rounded-xl border border-slate-200 dark:border-zinc-800/50 shadow-sm">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1 shrink-0">
                  <Filter size={13} /> Filter Vendor:
                </span>
                <button
                  onClick={() => setSupplierFilter('ALL')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all shrink-0 ${
                    supplierFilter === 'ALL'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  All Vendors ({confirmedOrders.filter(o => o.status !== 'RECEIVED').length})
                </button>
                {activeSuppliersInOrders.map(sup => {
                  const count = confirmedOrders.filter(o => o.status !== 'RECEIVED' && o.supplierName === sup).length;
                  return (
                    <button
                      key={sup}
                      onClick={() => setSupplierFilter(sup)}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 shrink-0 ${
                        supplierFilter === sup
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <Building2 size={12} /> {sup} ({count})
                    </button>
                  );
                })}
              </div>
            )}

            {activePlacedOrders.length === 0 ? (
              <div className="bg-white dark:bg-zinc-900/60 rounded-xl border border-slate-200 dark:border-zinc-800/50 p-12 flex flex-col items-center justify-center text-center shadow-sm">
                <CheckCircle2 size={40} className="text-emerald-500 mb-3" />
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-1">No Orders Awaiting Delivery</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-4">
                  All placed orders have been received into inventory. Create a new order draft to request stock.
                </p>
                <button 
                  onClick={() => setActiveTab('draft')}
                  className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-lg shadow-sm"
                >
                  Go to Order Draft
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {activePlacedOrders.map((order) => {
                  const unreceivedCount = order.items.filter(i => i.status !== 'RECEIVED').length;
                  return (
                    <div 
                      key={order.id} 
                      className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800/50 rounded-xl shadow-sm overflow-hidden"
                    >
                      {/* Order Card Header */}
                      <div className="bg-slate-100/70 dark:bg-zinc-800/40 p-4 border-b border-slate-200 dark:border-zinc-800 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                            PO
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-base text-slate-900 dark:text-slate-50">
                                Order #{order.orderNumber}
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                order.status === 'PARTIALLY_RECEIVED' 
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200' 
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200'
                              }`}>
                                {order.status === 'PARTIALLY_RECEIVED' ? 'PARTIALLY RECEIVED' : 'AWAITING DELIVERY'}
                              </span>
                              {order.supplierName && (
                                <span className="bg-slate-200/80 dark:bg-zinc-700 text-slate-800 dark:text-slate-200 text-[11px] font-bold px-2.5 py-0.5 rounded-md flex items-center gap-1">
                                  <Building2 size={12} className="text-blue-600 dark:text-blue-400" /> {order.supplierName}
                                </span>
                              )}
                              {order.supplierPhone && (
                                <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 font-mono">
                                  <Phone size={11} /> {order.supplierPhone}
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              Placed on {new Date(order.date).toLocaleDateString()} at {new Date(order.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {order.items.length} items
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end lg:self-auto flex-wrap">
                          <div className="text-right mr-2">
                            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Estimated Value</span>
                            <span className="text-base font-black text-slate-900 dark:text-slate-50 font-mono">
                              Rs {order.totalAmount.toLocaleString()}
                            </span>
                          </div>

                          {/* 1-Click WhatsApp Share */}
                          <button
                            onClick={() => handleShareWhatsApp(order)}
                            className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/60 font-bold text-xs rounded-lg border border-emerald-200 dark:border-emerald-900/50 flex items-center gap-1.5 transition-colors shadow-sm"
                            title="Share Purchase Order details via WhatsApp to supplier"
                          >
                            <Share2 size={14} className="text-emerald-600" /> Share WhatsApp
                          </button>

                          {/* Printable PO Voucher */}
                          <button
                            onClick={() => setPrintOrderModal(order)}
                            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-slate-300 font-bold text-xs rounded-lg border border-slate-200 dark:border-zinc-700 flex items-center gap-1.5 transition-colors shadow-sm"
                            title="Print Purchase Requisition slip / voucher"
                          >
                            <Printer size={14} /> Print P.O.
                          </button>

                          <button 
                            onClick={() => handleReceiveAll(order)}
                            disabled={unreceivedCount === 0}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-1.5"
                          >
                            <CheckCheck size={16} /> Received All ({unreceivedCount})
                          </button>

                          {/* Cancel / Delete Order */}
                          <button
                            onClick={() => handleDeleteOrder(order.id, order.orderNumber)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-900/50"
                            title="Cancel / Delete Purchase Order"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>

                      {/* Items List in this Purchase Order */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-sm">
                          <thead>
                            <tr className="border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-800/20 text-xs text-slate-500 uppercase tracking-wider">
                              <th className="py-2.5 px-4 font-semibold">Item</th>
                              <th className="py-2.5 px-4 font-semibold">Barcode / SKU</th>
                              <th className="py-2.5 px-4 font-semibold text-center">Ordered Unit</th>
                              <th className="py-2.5 px-4 font-semibold text-center">Base Pieces</th>
                              <th className="py-2.5 px-4 font-semibold text-center">Receiving Status</th>
                              <th className="py-2.5 px-4 font-semibold text-right">Cost / Pc</th>
                              <th className="py-2.5 px-4 font-semibold text-right">Line Total</th>
                              <th className="py-2.5 px-4 font-semibold text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {order.items.map((item) => {
                              const isReceived = item.status === 'RECEIVED';
                              const isPartial = item.status === 'PARTIALLY_RECEIVED';
                              return (
                                <tr 
                                  key={item.id} 
                                  className={`border-b border-slate-100 dark:border-zinc-800/40 ${isReceived ? 'bg-emerald-50/20 dark:bg-emerald-950/10' : ''}`}
                                >
                                  <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                                    <div className="flex items-center gap-2">
                                      <span>{item.name}</span>
                                      {item.isNewProduct && (
                                        <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 px-1.5 py-0.2 rounded border border-emerald-300">
                                          NEW PRODUCT
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 text-xs font-mono text-slate-500 dark:text-slate-400">
                                    {item.barcode || item.sku || '-'}
                                  </td>
                                  <td className="py-3 px-4 text-center font-bold text-slate-800 dark:text-slate-200">
                                    {item.unitQuantity || 1} {item.unit || 'Pcs'}
                                  </td>
                                  <td className="py-3 px-4 text-center font-bold text-blue-600 dark:text-blue-400 font-mono">
                                    {item.quantityNeeded} pcs
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    {isReceived ? (
                                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                                        <Check size={12} strokeWidth={3} /> Fully Received
                                      </span>
                                    ) : isPartial ? (
                                      <div className="flex flex-col items-center">
                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/50 px-2 py-0.5 rounded-full border border-amber-200">
                                          Partial: {item.receivedUnitQuantity || 0}/{item.unitQuantity || 1} {item.unit}
                                        </span>
                                        <span className="text-[10px] text-slate-400 mt-0.5">
                                          ({item.receivedQuantityNeeded || 0}/{item.quantityNeeded} pcs)
                                        </span>
                                        {item.shortShippedReason && (
                                          <span className="text-[9px] text-rose-500 font-medium">{item.shortShippedReason}</span>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="text-[11px] font-medium text-slate-400">
                                        Awaiting (0/{item.unitQuantity || 1})
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-3 px-4 text-right font-mono text-slate-700 dark:text-slate-300">
                                    Rs {(item.costPrice || 0).toLocaleString()}
                                  </td>
                                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                                    Rs {(item.totalCost || (item.quantityNeeded * (item.costPrice || 0))).toLocaleString()}
                                  </td>
                                  <td className="py-3 px-4 text-right">
                                    {isReceived ? (
                                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/40 px-2.5 py-1 rounded-md">
                                        <Check size={13} strokeWidth={3} /> Received
                                      </span>
                                    ) : (
                                      <button 
                                        onClick={() => handleReceiveItem(order.id, item)}
                                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-md shadow-sm transition-colors inline-flex items-center gap-1"
                                        title="Receive stock (supports partial quantities & short delivery)"
                                      >
                                        <Check size={14} /> Receive {isPartial ? 'More' : ''}
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 3: RECEIVED HISTORY                              */}
        {/* ==================================================== */}
        {activeTab === 'history' && (
          <div className="max-w-6xl mx-auto flex flex-col gap-6">
            {historyPlacedOrders.length === 0 ? (
              <div className="bg-white dark:bg-zinc-900/60 rounded-xl border border-slate-200 dark:border-zinc-800/50 p-12 flex flex-col items-center justify-center text-center shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-1">No Completed Purchase Orders in History Yet</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6">
                  When you receive stock from the <strong>Placed Orders (Awaiting Delivery)</strong> tab, completed orders will automatically appear here with their receiving history, item breakdowns, and printable vouchers.
                </p>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setActiveTab('placed')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm transition-all flex items-center gap-1.5"
                  >
                    <Clock size={14} /> View Placed Orders ({activePlacedOrders.length})
                  </button>
                  <button 
                    onClick={() => setActiveTab('draft')}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-lg shadow-sm transition-all flex items-center gap-1.5"
                  >
                    <Plus size={14} /> Create Order Draft
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {historyPlacedOrders.map((order) => {
                  const isExpanded = !!expandedHistoryOrderIds[order.id];
                  return (
                    <div 
                      key={order.id} 
                      className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800/50 rounded-xl shadow-sm overflow-hidden transition-all"
                    >
                      <div className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/50 dark:bg-zinc-800/30">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 dark:text-white">Order #{order.orderNumber}</span>
                            <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                              FULLY RECEIVED
                            </span>
                            {order.supplierName && (
                              <span className="bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                                <Building2 size={12} className="text-blue-600" /> {order.supplierName}
                              </span>
                            )}
                            {order.paymentMethod && order.paymentMethod !== 'UNPAID' && (
                              <span className="bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-200">
                                {order.paymentMethod === 'CASH' ? 'Paid: Cash Register' : order.paymentMethod === 'VENDOR_CREDIT' ? 'Vendor Credit Ledger' : 'Bank Transfer'}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            Completed on {new Date(order.date).toLocaleDateString()} at {new Date(order.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {order.items.length} items
                          </p>
                        </div>

                        <div className="flex items-center gap-2 self-end md:self-auto flex-wrap">
                          <div className="text-right mr-2">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Total Invoiced</span>
                            <span className="font-black text-slate-900 dark:text-slate-100 text-base font-mono">
                              Rs {order.totalAmount.toLocaleString()}
                            </span>
                          </div>

                          {/* Toggle Expand Items */}
                          <button
                            onClick={() => toggleHistoryOrderExpand(order.id)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-zinc-700 text-xs font-semibold flex items-center gap-1 transition-colors"
                            title="Inspect received items table"
                          >
                            {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                            {isExpanded ? 'Hide' : `Items (${order.items.length})`}
                          </button>

                          <button
                            onClick={() => handleShareWhatsApp(order)}
                            className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 rounded-lg border border-emerald-200 text-xs font-semibold flex items-center gap-1 transition-colors"
                            title="Share voucher via WhatsApp"
                          >
                            <Share2 size={13} /> WhatsApp
                          </button>

                          <button
                            onClick={() => setPrintOrderModal(order)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-slate-300 rounded-lg border border-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors"
                            title="Print Purchase Slip"
                          >
                            <Printer size={13} /> Print
                          </button>

                          <button
                            onClick={() => handleDeleteOrder(order.id, order.orderNumber)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-900/50"
                            title="Delete this order from history"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Expanded Items Breakdown */}
                      {isExpanded && (
                        <div className="border-t border-slate-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/80 overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50 dark:bg-zinc-800/40 text-slate-500 uppercase tracking-wider">
                                <th className="py-2.5 px-4 font-semibold">Item</th>
                                <th className="py-2.5 px-4 font-semibold">Barcode / SKU</th>
                                <th className="py-2.5 px-4 font-semibold text-center">Unit Received</th>
                                <th className="py-2.5 px-4 font-semibold text-center">Base Pieces</th>
                                <th className="py-2.5 px-4 font-semibold text-right">Cost / Pc</th>
                                <th className="py-2.5 px-4 font-semibold text-right">Line Total</th>
                                <th className="py-2.5 px-4 font-semibold text-center">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {order.items.map((it) => (
                                <tr key={it.id} className="border-b border-slate-100 dark:border-zinc-800/40 hover:bg-slate-50/50 dark:hover:bg-zinc-800/20">
                                  <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-slate-100">
                                    <div className="flex items-center gap-1.5">
                                      <span>{it.name}</span>
                                      {it.isNewProduct && (
                                        <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 px-1.5 py-0.2 rounded border border-emerald-300">
                                          NEW PRODUCT
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-2.5 px-4 font-mono text-slate-500 dark:text-slate-400">
                                    {it.barcode || it.sku || '-'}
                                  </td>
                                  <td className="py-2.5 px-4 text-center font-bold text-slate-800 dark:text-slate-200">
                                    {it.receivedUnitQuantity || it.unitQuantity || 1} {it.unit || 'Pcs'}
                                  </td>
                                  <td className="py-2.5 px-4 text-center font-bold text-blue-600 dark:text-blue-400 font-mono">
                                    +{it.receivedQuantityNeeded || it.quantityNeeded} pcs
                                  </td>
                                  <td className="py-2.5 px-4 text-right font-mono text-slate-700 dark:text-slate-300">
                                    Rs {(it.costPrice || 0).toLocaleString()}
                                  </td>
                                  <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                                    Rs {(it.totalCost || (it.quantityNeeded * (it.costPrice || 0))).toLocaleString()}
                                  </td>
                                  <td className="py-2.5 px-4 text-center">
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200">
                                      <Check size={11} strokeWidth={3} /> Received
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ==================================================== */}
      {/* MODAL 0: ADD METHOD SELECTOR (Choice Dialog)        */}
      {/* ==================================================== */}
      {isAddChoiceModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsAddChoiceModalOpen(false)}>
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Add Items to Our Order</h2>
              <button onClick={() => setIsAddChoiceModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Choose how you would like to requisition stock:
            </p>

            <div className="flex flex-col gap-3">
              <button 
                onClick={() => { setIsAddChoiceModalOpen(false); setIsAddExistingModalOpen(true); }}
                className="flex items-center gap-3 p-4 border border-slate-200 dark:border-zinc-800 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 rounded-xl transition-all text-left group"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Boxes size={20} />
                </div>
                <div className="flex-1">
                  <span className="font-bold text-sm text-slate-900 dark:text-white block group-hover:text-blue-600">
                    Restock Existing Product
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Choose from items already listed in your inventory and specify quantity & purchase cost.
                  </span>
                </div>
              </button>

              <button 
                onClick={handleOpenAddNewProduct}
                className="flex items-center gap-3 p-4 border border-slate-200 dark:border-zinc-800 hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20 rounded-xl transition-all text-left group"
              >
                <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Plus size={20} />
                </div>
                <div className="flex-1">
                  <span className="font-bold text-sm text-slate-900 dark:text-white block group-hover:text-emerald-600">
                    Add a Brand New Product
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Define a new product with full specifications (name, barcode, SKU, packaging). Added to inventory upon reception.
                  </span>
                </div>
              </button>

              <button 
                onClick={handleOpenLowStockWizard}
                className="flex items-center gap-3 p-4 border border-slate-200 dark:border-zinc-800 hover:border-amber-500 hover:bg-amber-50/50 dark:hover:bg-amber-900/20 rounded-xl transition-all text-left group"
              >
                <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Sparkles size={20} />
                </div>
                <div className="flex-1">
                  <span className="font-bold text-sm text-slate-900 dark:text-white block group-hover:text-amber-600">
                    Auto-Scan Low / Zero Stock ({lowStockProducts.length})
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Automatically inspects inventory and asks item-wise to order items at or below critical levels.
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 1: LOW STOCK WIZARD                           */}
      {/* ==================================================== */}
      {isLowStockWizardOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsLowStockWizardOpen(false)}>
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-200 dark:border-zinc-800 flex justify-between items-center bg-slate-50 dark:bg-zinc-800/50">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles size={18} className="text-amber-500" /> Low & Zero Stock Restock Wizard
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Found {wizardItems.length} products with stock below threshold. Review item-wise and set quantities.
                </p>
              </div>
              <button onClick={() => setIsLowStockWizardOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            {/* Quick Filter */}
            <div className="px-6 py-2.5 bg-slate-100/60 dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 flex-1 max-w-xs bg-white dark:bg-zinc-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700">
                <Search size={14} className="text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Filter low stock items..." 
                  value={wizardSearch} 
                  onChange={e => setWizardSearch(e.target.value)}
                  className="bg-transparent text-xs outline-none w-full text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setWizardItems(prev => prev.map(i => ({ ...i, selected: true })))}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Select All
                </button>
                <span className="text-slate-300">|</span>
                <button 
                  onClick={() => setWizardItems(prev => prev.map(i => ({ ...i, selected: false })))}
                  className="text-xs font-semibold text-slate-500 hover:underline"
                >
                  Deselect All
                </button>
              </div>
            </div>

            {/* Wizard Items Table */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              <div className="flex flex-col gap-3">
                {wizardItems
                  .filter(item => !wizardSearch.trim() || item.product.name.toLowerCase().includes(wizardSearch.toLowerCase()))
                  .map((item, idx) => {
                    const totalPcs = calculatePieces(item.unit, item.unitQuantity, item.product.pcsPerBox, item.product.boxPerCtn);
                    const totalCost = item.costPrice * totalPcs;

                    return (
                      <div 
                        key={item.product.id} 
                        className={`p-3.5 rounded-xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                          item.selected 
                            ? 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/60 shadow-sm' 
                            : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input 
                            type="checkbox" 
                            checked={item.selected} 
                            onChange={e => {
                              const checked = e.target.checked;
                              setWizardItems(prev => prev.map((it, i) => i === idx ? { ...it, selected: checked } : it));
                            }}
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{item.product.name}</span>
                              <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${
                                item.product.stock <= 0 
                                  ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400' 
                                  : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                              }`}>
                                Stock: {item.product.stock} pcs
                              </span>
                            </div>
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                              Barcode: {item.product.barcode || '-'} • SKU: {item.product.sku || '-'}
                            </span>
                          </div>
                        </div>

                        {/* Order Inputs */}
                        {item.selected && (
                          <div className="flex items-center gap-3 w-full md:w-auto justify-end flex-wrap">
                            <div className="flex items-center gap-1.5">
                              <label className="text-[11px] font-semibold text-slate-500">Unit:</label>
                              <select 
                                value={item.unit}
                                onChange={e => {
                                  const u = e.target.value as UOMType;
                                  setWizardItems(prev => prev.map((it, i) => i === idx ? { ...it, unit: u } : it));
                                }}
                                className="bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded px-2 py-1 text-xs font-semibold"
                              >
                                <option value="Pcs">Pieces</option>
                                <option value="Box">Boxes ({item.product.pcsPerBox || 12} pcs)</option>
                                <option value="Ctn">Cartons ({(item.product.pcsPerBox || 12) * (item.product.boxPerCtn || 6)} pcs)</option>
                              </select>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <label className="text-[11px] font-semibold text-slate-500">Qty:</label>
                              <input 
                                type="number" 
                                min={1}
                                value={item.unitQuantity}
                                onChange={e => {
                                  const q = parseInt(e.target.value) || 0;
                                  setWizardItems(prev => prev.map((it, i) => i === idx ? { ...it, unitQuantity: q } : it));
                                }}
                                className="w-16 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded px-2 py-1 text-xs font-bold font-mono text-center"
                              />
                            </div>

                            <div className="flex items-center gap-1.5">
                              <label className="text-[11px] font-semibold text-slate-500">Cost/Pc:</label>
                              <input 
                                type="number"
                                min={0}
                                value={item.costPrice}
                                onChange={e => {
                                  const cp = parseFloat(e.target.value) || 0;
                                  setWizardItems(prev => prev.map((it, i) => i === idx ? { ...it, costPrice: cp } : it));
                                }}
                                className="w-20 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded px-2 py-1 text-xs font-bold font-mono text-right"
                              />
                            </div>

                            <div className="text-right min-w-[90px]">
                              <span className="text-[10px] text-slate-400 block">{totalPcs} pcs</span>
                              <span className="text-xs font-bold text-slate-900 dark:text-white">Rs {totalCost.toLocaleString()}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Wizard Footer */}
            <div className="px-6 py-4 border-t border-slate-200 dark:border-zinc-800 flex justify-between items-center bg-slate-50 dark:bg-zinc-800/50">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Selected: {wizardItems.filter(i => i.selected).length} items
              </span>
              <div className="flex gap-2">
                <button onClick={() => setIsLowStockWizardOpen(false)} className="px-4 py-2 text-slate-600 text-xs font-semibold">
                  Cancel
                </button>
                <button onClick={handleConfirmWizard} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm">
                  Add Selected to Order Draft
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 2: RESTOCK EXISTING PRODUCT                   */}
      {/* ==================================================== */}
      {isAddExistingModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsAddExistingModalOpen(false)}>
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Boxes size={18} className="text-blue-600" /> Restock Existing Product
              </h2>
              <button onClick={() => setIsAddExistingModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddExistingToDraft} className="flex flex-col gap-4 overflow-y-auto custom-scrollbar flex-1">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 block">
                  Select Product from Inventory
                </label>
                <div className="relative mb-2">
                  <Search size={16} className="absolute left-3 top-3 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search by name, barcode or SKU..." 
                    value={existingSearch} 
                    onChange={e => setExistingSearch(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-zinc-700 rounded-lg divide-y divide-slate-100 dark:divide-zinc-800 custom-scrollbar">
                  {filteredExistingProducts.map(p => (
                    <div 
                      key={p.id}
                      onClick={() => handleSelectExisting(p)}
                      className={`p-2.5 text-xs flex justify-between items-center cursor-pointer transition-colors ${
                        selectedExistingId === p.id 
                          ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-900 dark:text-blue-200 font-bold' 
                          : 'hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <div>
                        <div>{p.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{p.barcode || 'No barcode'} • SKU: {p.sku || '-'}</div>
                      </div>
                      <div className="text-right">
                        <span className="bg-slate-100 dark:bg-zinc-700 px-1.5 py-0.5 rounded text-[10px] font-bold">
                          Stock: {p.stock || 0}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedExistingProduct && (
                <div className="bg-slate-50 dark:bg-zinc-800/40 p-4 rounded-xl border border-slate-200 dark:border-zinc-700 flex flex-col gap-3">
                  <div className="font-bold text-sm text-slate-900 dark:text-white">
                    {selectedExistingProduct.name}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 block mb-1">Unit of Measure</label>
                      <select 
                        value={existingUnit}
                        onChange={e => setExistingUnit(e.target.value as UOMType)}
                        className="w-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs font-semibold"
                      >
                        <option value="Pcs">Pieces</option>
                        <option value="Box">Boxes ({selectedExistingProduct.pcsPerBox || 12} pcs/box)</option>
                        <option value="Ctn">Cartons ({(selectedExistingProduct.pcsPerBox || 12) * (selectedExistingProduct.boxPerCtn || 6)} pcs/ctn)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 block mb-1">Order Quantity</label>
                      <input 
                        type="number" 
                        min={1}
                        value={existingQuantity}
                        onChange={e => setExistingQuantity(parseInt(e.target.value) || 0)}
                        className="w-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs font-bold font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 block mb-1">Set Purchase Price / Pc (PKR)</label>
                    <input 
                      type="number" 
                      min={0}
                      value={existingPrice}
                      onChange={e => setExistingPrice(parseFloat(e.target.value) || 0)}
                      className="w-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs font-bold font-mono text-blue-600"
                    />
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-200 dark:border-zinc-700 flex justify-between items-center text-xs">
                    <span className="text-slate-500">Total Base Pieces:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {calculatePieces(existingUnit, existingQuantity, selectedExistingProduct.pcsPerBox, selectedExistingProduct.boxPerCtn)} pcs
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-bold">
                    <span className="text-slate-700 dark:text-slate-300">Total Line Cost:</span>
                    <span className="text-blue-600 dark:text-blue-400 font-mono">
                      Rs {(existingPrice * calculatePieces(existingUnit, existingQuantity, selectedExistingProduct.pcsPerBox, selectedExistingProduct.boxPerCtn)).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-slate-200 dark:border-zinc-800">
                <button type="button" onClick={() => setIsAddExistingModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600">
                  Cancel
                </button>
                <button type="submit" disabled={!selectedExistingProduct} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-sm">
                  Add to Order Draft
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 3: ADD NEW PRODUCT (Matches ProductsView)      */}
      {/* ==================================================== */}
      {isAddNewProductModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsAddNewProductModalOpen(false)}>
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-200 dark:border-zinc-800 flex justify-between items-center bg-slate-50 dark:bg-zinc-800/50">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus size={18} className="text-emerald-600" /> Add New Product to Our Order
              </h2>
              <button onClick={() => setIsAddNewProductModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddNewProductToDraft} className="p-6 flex flex-col md:flex-row gap-6 overflow-y-auto custom-scrollbar flex-1">
              {/* Left Column: Product Definition */}
              <div className="flex-1 flex flex-col gap-4">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1.5">Product Name</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Ariel Washing Powder 1kg" 
                    value={newProdName} 
                    onChange={e => setNewProdName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1.5">Barcode</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={newProdBarcode} 
                      onChange={e => setNewProdBarcode(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2.5 text-xs font-mono text-slate-900 dark:text-white outline-none focus:border-blue-500 pr-10"
                    />
                    <button 
                      type="button"
                      onClick={() => setIsScannerActive(!isScannerActive)}
                      className="absolute right-2 top-2 p-1 text-slate-400 hover:text-slate-600"
                    >
                      <ScanLine size={16} />
                    </button>
                  </div>
                  {isScannerActive && (
                    <CameraScanner 
                      onClose={() => setIsScannerActive(false)} 
                      onScan={(val) => { setNewProdBarcode(val); setIsScannerActive(false); }}
                    />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1.5">Item Type</label>
                    <select 
                      value={newProdItemType}
                      onChange={e => setNewProdItemType(e.target.value as 'Local' | 'Imported')}
                      className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2.5 text-xs font-medium"
                    >
                      <option value="Local">Local</option>
                      <option value="Imported">Imported</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1.5">SKU Code</label>
                    <input 
                      type="text" 
                      disabled
                      readOnly
                      value={newProdAutoSku}
                      className="w-full bg-slate-100 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2.5 text-xs font-mono font-bold text-slate-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1.5">Pcs/Box</label>
                    <input 
                      type="number" 
                      value={newProdPcsPerBox || ''} 
                      onChange={e => setNewProdPcsPerBox(parseInt(e.target.value) || undefined)}
                      placeholder="12"
                      className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1.5">Box/Ctn</label>
                    <input 
                      type="number" 
                      value={newProdBoxPerCtn || ''} 
                      onChange={e => setNewProdBoxPerCtn(parseInt(e.target.value) || undefined)}
                      placeholder="6"
                      className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1.5">Min Stock</label>
                    <input 
                      type="number" 
                      value={newProdMinStock} 
                      onChange={e => setNewProdMinStock(parseInt(e.target.value) || 5)}
                      className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Pricing & Order Requisition */}
              <div className="flex-1 flex flex-col gap-4">
                <div className="bg-slate-50 dark:bg-zinc-800/40 p-4 rounded-xl border border-slate-200 dark:border-zinc-700 flex flex-col gap-4">
                  <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <FileText size={14} className="text-blue-500" /> Pricing & Initial Order
                  </span>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1">Cost / Pc (PKR)</label>
                      <input 
                        type="number" 
                        min={0}
                        value={newProdPrice === 0 ? '' : newProdPrice} 
                        onChange={e => setNewProdPrice(parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="w-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs font-bold font-mono text-blue-600"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1">Retail Price (PKR)</label>
                      <input 
                        type="number" 
                        value={newProdRetailPrice === undefined ? '' : newProdRetailPrice} 
                        onChange={e => setNewProdRetailPrice(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                        placeholder="Optional"
                        className="w-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs font-bold font-mono"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 dark:border-zinc-700 flex flex-col gap-3">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Requisition Quantity</span>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Unit</label>
                        <select 
                          value={newProdOrderUnit}
                          onChange={e => setNewProdOrderUnit(e.target.value as UOMType)}
                          className="w-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded px-2.5 py-1.5 text-xs font-semibold"
                        >
                          <option value="Pcs">Pieces</option>
                          <option value="Box">Boxes ({newProdPcsPerBox || 12} pcs/box)</option>
                          <option value="Ctn">Cartons ({(newProdPcsPerBox || 12) * (newProdBoxPerCtn || 6)} pcs/ctn)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Amount</label>
                        <input 
                          type="number" 
                          min={1}
                          value={newProdOrderQty}
                          onChange={e => setNewProdOrderQty(parseInt(e.target.value) || 0)}
                          className="w-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded px-2.5 py-1.5 text-xs font-mono font-bold"
                        />
                      </div>
                    </div>

                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex justify-between items-center text-xs">
                      <span className="text-blue-700 dark:text-blue-300">Total Base Pieces:</span>
                      <span className="font-bold text-blue-900 dark:text-blue-100 font-mono">
                        {calculatePieces(newProdOrderUnit, newProdOrderQty, newProdPcsPerBox, newProdBoxPerCtn)} pcs
                      </span>
                    </div>

                    <div className="flex justify-between items-center font-bold text-sm">
                      <span className="text-slate-700 dark:text-slate-300">Order Cost:</span>
                      <span className="text-blue-600 dark:text-blue-400 font-mono">
                        Rs {(newProdPrice * calculatePieces(newProdOrderUnit, newProdOrderQty, newProdPcsPerBox, newProdBoxPerCtn)).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-auto flex justify-end gap-2 pt-4">
                  <button type="button" onClick={() => setIsAddNewProductModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600">
                    Cancel
                  </button>
                  <button type="submit" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm">
                    Add to Our Order Draft
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 4: PARTIAL QUANTITY & SHORT DELIVERY RECEIVING */}
      {/* ==================================================== */}
      {receiveItemModal.isOpen && receiveItemModal.item && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setReceiveItemModal(prev => ({ ...prev, isOpen: false, item: null }))}>
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl flex flex-col gap-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-zinc-800 pb-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Package size={18} className="text-emerald-600" /> Receive Stock Delivery
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Record physical stock arrival into your live inventory.
                </p>
              </div>
              <button onClick={() => setReceiveItemModal(prev => ({ ...prev, isOpen: false, item: null }))} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            {/* Product & Order Details */}
            <div className="bg-slate-50 dark:bg-zinc-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-zinc-700/60 flex flex-col gap-2">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-bold text-sm text-slate-900 dark:text-white block">{receiveItemModal.item.name}</span>
                  <span className="text-xs font-mono text-slate-400">
                    Barcode: {receiveItemModal.item.barcode || '-'} • SKU: {receiveItemModal.item.sku || '-'}
                  </span>
                </div>
                {receiveItemModal.item.isNewProduct && (
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    NEW PRODUCT
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/80 dark:border-zinc-700/60 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Ordered:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {receiveItemModal.item.unitQuantity || 1} {receiveItemModal.item.unit || 'Pcs'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Previously Rcvd:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {receiveItemModal.item.receivedUnitQuantity || 0} {receiveItemModal.item.unit || 'Pcs'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Remaining:</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">
                    {Math.max(0, (receiveItemModal.item.unitQuantity || 1) - (receiveItemModal.item.receivedUnitQuantity || 0))} {receiveItemModal.item.unit || 'Pcs'}
                  </span>
                </div>
              </div>
            </div>

            {/* Arrived Quantity Input */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Quantity Arrived Today (in {receiveItemModal.item.unit || 'Pcs'})
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={1}
                  value={receiveItemModal.qtyToReceive}
                  onChange={e => {
                    const val = parseInt(e.target.value) || 1;
                    const maxRem = Math.max(1, (receiveItemModal.item?.unitQuantity || 1) - (receiveItemModal.item?.receivedUnitQuantity || 0));
                    setReceiveItemModal(prev => ({
                      ...prev,
                      qtyToReceive: val,
                      markShortShipped: val < maxRem ? prev.markShortShipped : false
                    }));
                  }}
                  className="w-28 bg-white dark:bg-zinc-800 border-2 border-emerald-500 rounded-lg px-3 py-2 text-base font-bold font-mono text-center text-slate-900 dark:text-white outline-none"
                />
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  <span>Converts to: </span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                    +{calculatePieces(
                      receiveItemModal.item.unit || 'Pcs',
                      receiveItemModal.qtyToReceive,
                      receiveItemModal.item.pcsPerBox,
                      receiveItemModal.item.boxPerCtn
                    )} base pieces
                  </span>
                  <div className="text-[11px] font-mono text-slate-400">
                    Valued at Rs {(
                      calculatePieces(
                        receiveItemModal.item.unit || 'Pcs',
                        receiveItemModal.qtyToReceive,
                        receiveItemModal.item.pcsPerBox,
                        receiveItemModal.item.boxPerCtn
                      ) * (receiveItemModal.item.costPrice || 0)
                    ).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Short Delivery Checkbox if receiving less than remaining */}
            {receiveItemModal.qtyToReceive < Math.max(1, (receiveItemModal.item.unitQuantity || 1) - (receiveItemModal.item.receivedUnitQuantity || 0)) && (
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 p-3 rounded-lg flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="markShortShipped"
                  checked={receiveItemModal.markShortShipped}
                  onChange={e => setReceiveItemModal(prev => ({ ...prev, markShortShipped: e.target.checked }))}
                  className="mt-0.5 rounded text-amber-600 focus:ring-amber-500"
                />
                <label htmlFor="markShortShipped" className="text-xs text-amber-900 dark:text-amber-200 font-medium cursor-pointer">
                  <span className="font-bold block">Mark Remaining Balance as Short-Shipped / Closed</span>
                  Check this if the supplier cannot deliver the remaining units and this order item should be marked complete.
                </label>
              </div>
            )}

            {/* Master Cost Update Toggle */}
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-zinc-800/40 rounded-lg border border-slate-200 dark:border-zinc-700">
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  Update Master Product Cost Price
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Set master inventory price to Rs {receiveItemModal.item.costPrice || 0}/pc
                </span>
              </div>
              <input
                type="checkbox"
                checked={receiveItemModal.updateMasterCost}
                onChange={e => setReceiveItemModal(prev => ({ ...prev, updateMasterCost: e.target.checked }))}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
            </div>

            {/* Financial Settlement & Accounts Payable */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Payment & Financial Settlement
              </label>
              <select
                value={receiveItemModal.paymentMethod}
                onChange={e => setReceiveItemModal(prev => ({ ...prev, paymentMethod: e.target.value as any }))}
                className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white"
              >
                <option value="NONE">Stock Only (No cash or ledger movement)</option>
                <option value="CASH">Cash Drawer Out (Deduct from Daily Cash Balance)</option>
                <option value="VENDOR_CREDIT">Vendor Credit Bill (Record in Accounts Payable Ledger)</option>
                <option value="BANK">Bank Transfer (Record as bank expense)</option>
              </select>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setReceiveItemModal(prev => ({ ...prev, isOpen: false, item: null }))}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmItemReception}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5"
              >
                <Check size={15} /> Confirm Reception
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 5: BULK RECEIVE ALL CONFIRMATION               */}
      {/* ==================================================== */}
      {receiveAllModal.isOpen && receiveAllModal.order && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setReceiveAllModal(prev => ({ ...prev, isOpen: false, order: null }))}>
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl flex flex-col gap-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-zinc-800 pb-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <CheckCheck size={20} className="text-emerald-600" /> Receive All Order Items
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Order #{receiveAllModal.order.orderNumber} • {receiveAllModal.order.supplierName || 'General Vendor'}
                </p>
              </div>
              <button onClick={() => setReceiveAllModal(prev => ({ ...prev, isOpen: false, order: null }))} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              This will receive all unreceived line items in this order directly into live inventory at their set purchase rates.
            </p>

            {/* Unreceived Summary */}
            <div className="bg-slate-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-slate-200 dark:border-zinc-700/60 flex flex-col gap-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Unreceived Line Items:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {receiveAllModal.order.items.filter(i => i.status !== 'RECEIVED').length} items
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Total Unreceived Base Pieces:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  +{receiveAllModal.order.items.filter(i => i.status !== 'RECEIVED').reduce((acc, i) => acc + Math.max(0, i.quantityNeeded - (i.receivedQuantityNeeded || 0)), 0)} pcs
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold pt-2 border-t border-slate-200 dark:border-zinc-700">
                <span className="text-slate-700 dark:text-slate-300">Total Value:</span>
                <span className="text-blue-600 dark:text-blue-400 font-mono">
                  Rs {receiveAllModal.order.items.filter(i => i.status !== 'RECEIVED').reduce((acc, i) => {
                    const remPieces = Math.max(0, i.quantityNeeded - (i.receivedQuantityNeeded || 0));
                    return acc + (remPieces * (i.costPrice || 0));
                  }, 0).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Master Cost Update Toggle */}
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-zinc-800/40 rounded-lg border border-slate-200 dark:border-zinc-700">
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  Update Master Product Cost Prices
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Update master inventory price for all received products
                </span>
              </div>
              <input
                type="checkbox"
                checked={receiveAllModal.updateMasterCost}
                onChange={e => setReceiveAllModal(prev => ({ ...prev, updateMasterCost: e.target.checked }))}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
            </div>

            {/* Financial Settlement */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Payment & Settlement Method
              </label>
              <select
                value={receiveAllModal.paymentMethod}
                onChange={e => setReceiveAllModal(prev => ({ ...prev, paymentMethod: e.target.value as any }))}
                className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white"
              >
                <option value="NONE">Stock Only (No cash or ledger movement)</option>
                <option value="CASH">Deduct from Cash Register Drawer (Cash Out / Expense)</option>
                <option value="VENDOR_CREDIT">Record as Vendor Credit Bill (Accounts Payable)</option>
                <option value="BANK">Bank Transfer (Record as bank expense)</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setReceiveAllModal(prev => ({ ...prev, isOpen: false, order: null }))}
                className="px-4 py-2 text-xs font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmReceiveAll}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5"
              >
                <CheckCheck size={16} /> Confirm & Receive All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 6: PRINTABLE PURCHASE ORDER SLIP (P.O. Slip)   */}
      {/* ==================================================== */}
      {printOrderModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setPrintOrderModal(null)}>
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-200 dark:border-zinc-800 flex justify-between items-center bg-slate-50 dark:bg-zinc-800/50 print:hidden">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Printer size={18} className="text-blue-600" /> Purchase Requisition Voucher / P.O. Slip
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5"
                >
                  <Printer size={14} /> Print Slip
                </button>
                <button onClick={() => setPrintOrderModal(null)} className="text-slate-400 hover:text-slate-600 p-1">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Print Content Area */}
            <div className="p-8 overflow-y-auto custom-scrollbar flex-1 bg-white text-slate-900" id="po-slip-print-content">
              {/* Slip Header */}
              <div className="border-b-2 border-slate-900 pb-4 mb-6 flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-slate-900">SHAHEEN GLOBAL TRADERS</h1>
                  <p className="text-xs font-semibold text-slate-600">FMCG Wholesale & General Distribution</p>
                  <p className="text-xs text-slate-500">Shaheen Market, Quetta, Pakistan • Tel: +92 81 2824567</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded uppercase">
                    Purchase Order (PO)
                  </span>
                  <div className="text-lg font-black font-mono mt-1">#{printOrderModal.orderNumber}</div>
                  <div className="text-xs text-slate-500">{new Date(printOrderModal.date).toLocaleDateString()}</div>
                </div>
              </div>

              {/* Vendor & Order Details */}
              <div className="grid grid-cols-2 gap-4 mb-6 text-xs bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div>
                  <span className="font-bold text-slate-500 uppercase tracking-wider block mb-1">Supplier / Vendor:</span>
                  <div className="font-black text-sm text-slate-900">{printOrderModal.supplierName || 'General Wholesaler / Distributor'}</div>
                  {printOrderModal.supplierPhone && (
                    <div className="text-slate-600 font-mono mt-0.5">Phone: {printOrderModal.supplierPhone}</div>
                  )}
                </div>
                <div>
                  <span className="font-bold text-slate-500 uppercase tracking-wider block mb-1">Requisition Status:</span>
                  <div className="font-bold text-slate-800">{printOrderModal.status === 'RECEIVED' ? 'Fully Received & Stocked' : 'Awaiting Delivery'}</div>
                  <div className="text-slate-600 mt-0.5">Total Line Items: {printOrderModal.items.length}</div>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-left border-collapse text-xs mb-6">
                <thead>
                  <tr className="border-b-2 border-slate-800 bg-slate-100">
                    <th className="py-2 px-3 font-bold">#</th>
                    <th className="py-2 px-3 font-bold">Item Description</th>
                    <th className="py-2 px-3 font-bold">Barcode / SKU</th>
                    <th className="py-2 px-3 font-bold text-center">Ordered Unit</th>
                    <th className="py-2 px-3 font-bold text-center">Total Pcs</th>
                    <th className="py-2 px-3 font-bold text-right">Cost / Pc</th>
                    <th className="py-2 px-3 font-bold text-right">Total (PKR)</th>
                  </tr>
                </thead>
                <tbody>
                  {printOrderModal.items.map((it, idx) => (
                    <tr key={it.id} className="border-b border-slate-200">
                      <td className="py-2 px-3 font-mono text-slate-500">{idx + 1}</td>
                      <td className="py-2 px-3 font-bold text-slate-900">{it.name}</td>
                      <td className="py-2 px-3 font-mono text-slate-600">{it.barcode || it.sku || '-'}</td>
                      <td className="py-2 px-3 text-center font-bold">{it.unitQuantity || 1} {it.unit || 'Pcs'}</td>
                      <td className="py-2 px-3 text-center font-bold text-blue-700">{it.quantityNeeded} pcs</td>
                      <td className="py-2 px-3 text-right font-mono">Rs {(it.costPrice || 0).toLocaleString()}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold">
                        Rs {(it.totalCost || (it.quantityNeeded * (it.costPrice || 0))).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Summary Totals */}
              <div className="flex justify-end mb-10">
                <div className="w-64 bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-col gap-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Total Items:</span>
                    <span className="font-bold">{printOrderModal.items.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Total Pieces:</span>
                    <span className="font-bold font-mono">
                      {printOrderModal.items.reduce((acc, i) => acc + i.quantityNeeded, 0)} pcs
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-black pt-2 border-t border-slate-300">
                    <span>Grand Total:</span>
                    <span className="text-blue-700 font-mono">Rs {printOrderModal.totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-3 gap-6 pt-8 border-t border-dashed border-slate-300 text-center text-xs text-slate-600">
                <div>
                  <div className="border-b border-slate-400 mb-2 h-10"></div>
                  <span className="font-bold">Prepared / Authorized By</span>
                </div>
                <div>
                  <div className="border-b border-slate-400 mb-2 h-10"></div>
                  <span className="font-bold">Vendor Delivery Agent</span>
                </div>
                <div>
                  <div className="border-b border-slate-400 mb-2 h-10"></div>
                  <span className="font-bold">Warehouse Stock Received</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 7: VENDOR CREDIT & ACCOUNTS PAYABLE LEDGER     */}
      {/* ==================================================== */}
      {isVendorLedgerModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsVendorLedgerModalOpen(false)}>
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-200 dark:border-zinc-800 flex justify-between items-center bg-slate-50 dark:bg-zinc-800/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
                  <Wallet size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Vendor Accounts Payable Ledger</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Track unpaid supplier invoices and credit deliveries.
                  </p>
                </div>
              </div>
              <button onClick={() => setIsVendorLedgerModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            {/* Total Balance Card */}
            <div className="p-6 border-b border-slate-200 dark:border-zinc-800 bg-slate-100/50 dark:bg-zinc-800/30 flex justify-between items-center">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Total Outstanding Vendor Payables
                </span>
                <span className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">
                  Rs {totalVendorPayables.toLocaleString()}
                </span>
              </div>
              <span className="bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-xs font-bold px-3 py-1 rounded-full border border-rose-200 dark:border-rose-900">
                {vendorLedgers.length} Unpaid Bills
              </span>
            </div>

            {/* Ledger Bills List */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              {vendorLedgers.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <CheckCircle2 size={40} className="mx-auto mb-2 text-emerald-500 opacity-80" />
                  <p className="font-bold text-slate-700 dark:text-slate-300">No Outstanding Vendor Payables</p>
                  <p className="text-xs mt-1">All supplier credit bills have been settled.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {vendorLedgers.map(bill => (
                    <div key={bill.id} className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/40 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                            <Building2 size={14} className="text-blue-600" /> {bill.vendorName}
                          </span>
                          <span className="text-xs font-mono font-semibold bg-slate-100 dark:bg-zinc-700 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">
                            PO #{bill.orderNumber}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400 block mt-1">
                          Bill recorded on {new Date(bill.date).toLocaleDateString()} at {new Date(bill.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {bill.notes && ` • ${bill.notes}`}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-auto">
                        <span className="text-base font-black text-rose-600 dark:text-rose-400 font-mono">
                          Rs {bill.amount.toLocaleString()}
                        </span>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleSettleVendorBill(bill.id, true)}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm transition-colors"
                            title="Pay from register cash drawer"
                          >
                            Pay Cash
                          </button>
                          <button
                            onClick={() => handleSettleVendorBill(bill.id, false)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-lg transition-colors"
                            title="Mark as paid / settled externally"
                          >
                            Mark Settled
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-slate-200 dark:border-zinc-800 flex justify-end bg-slate-50 dark:bg-zinc-800/50">
              <button
                onClick={() => setIsVendorLedgerModalOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-zinc-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
