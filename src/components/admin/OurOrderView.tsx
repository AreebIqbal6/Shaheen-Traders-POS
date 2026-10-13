import React, { useState, useMemo, useEffect } from 'react';
import {
  AlertTriangle,
  Wallet,
  Sparkles,
  Plus,
  ShoppingCart,
  Clock,
  CheckCircle2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { safeSupabaseInsert, safeSupabaseUpdate } from '../../utils/safeSync';
import { generateUUID } from '../../utils/uuid';
import { generateSKU } from '../../views/ProductsView';
import type { Product, OurOrderItem, ConfirmedPurchaseOrder, UOMType, VendorLedgerEntry } from '../../types/index';
import { calculateTotalBasePieces } from '../../utils/accounting';

// Modular Sub-components & Modals
import { AddChoiceModal } from './our-order/AddChoiceModal';
import { LowStockWizardModal, type LowStockWizardItem } from './our-order/LowStockWizardModal';
import { AddExistingProductModal } from './our-order/AddExistingProductModal';
import { AddNewProductModal } from './our-order/AddNewProductModal';
import { ReceiveItemModal } from './our-order/ReceiveItemModal';
import { ReceiveAllModal } from './our-order/ReceiveAllModal';
import { PrintPOModal } from './our-order/PrintPOModal';
import { VendorLedgerModal } from './our-order/VendorLedgerModal';
import { OrderDraftTab } from './our-order/OrderDraftTab';
import { PlacedOrdersTab } from './our-order/PlacedOrdersTab';
import { ReceivedHistoryTab } from './our-order/ReceivedHistoryTab';

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

  // Suppliers & Vendor Ledgers
  const [savedSuppliers, setSavedSuppliers] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('shaheen_suppliers');
      return saved
        ? JSON.parse(saved)
        : [
            'National Foods',
            'Shan Foods',
            'Unilever Pakistan',
            'Habib Oil Mills',
            'English Biscuit Manufacturers (EBM)',
            'Tapal Tea',
            'Nestle Pakistan',
            'Engro Foods',
            'Local Market Wholesaler'
          ];
    } catch {
      return ['National Foods', 'Shan Foods', 'Unilever Pakistan', 'Habib Oil Mills', 'General Wholesaler'];
    }
  });

  const [draftSupplier, setDraftSupplier] = useState({ name: '', phone: '' });
  const [supplierFilter, setSupplierFilter] = useState<string>('ALL');

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

  // Modal States
  const [isAddChoiceModalOpen, setIsAddChoiceModalOpen] = useState(false);
  const [isLowStockWizardOpen, setIsLowStockWizardOpen] = useState(false);
  const [isAddExistingModalOpen, setIsAddExistingModalOpen] = useState(false);
  const [isAddNewProductModalOpen, setIsAddNewProductModalOpen] = useState(false);
  const [isVendorLedgerModalOpen, setIsVendorLedgerModalOpen] = useState(false);
  const [printOrderModal, setPrintOrderModal] = useState<ConfirmedPurchaseOrder | null>(null);

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

  const [expandedHistoryOrderIds, setExpandedHistoryOrderIds] = useState<Record<string, boolean>>({});

  const [wizardItems, setWizardItems] = useState<LowStockWizardItem[]>([]);

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
    return products.filter((p) => {
      const min = minStockDict[p.id] ?? 5;
      return (p.stock ?? 0) <= min;
    });
  }, [products, minStockDict]);

  // Wizard Handlers
  const handleOpenLowStockWizard = () => {
    if (lowStockProducts.length === 0) {
      toast.success('All items have healthy inventory stock!', { icon: '🎉' });
      return;
    }

    const items: LowStockWizardItem[] = lowStockProducts.map((p) => {
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
    setIsLowStockWizardOpen(true);
    setIsAddChoiceModalOpen(false);
  };

  const handleConfirmWizard = () => {
    const selected = wizardItems.filter((i) => i.selected && i.unitQuantity > 0);
    if (selected.length === 0) {
      toast.error('Please select at least one item to order.');
      return;
    }

    setOurOrderList((prev) => {
      const updated = [...prev];
      selected.forEach((item) => {
        const totalPcs = calculateTotalBasePieces(
          item.unit,
          item.unitQuantity,
          item.product.pcsPerBox,
          item.product.boxPerCtn
        );
        const cost = item.costPrice * totalPcs;

        const existingIdx = updated.findIndex((u) => u.id === item.product.id);
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

  // Add Existing Item Handler
  const handleAddExistingProduct = (
    product: Product,
    unit: UOMType,
    quantity: number,
    costPrice: number
  ) => {
    const totalPcs = calculateTotalBasePieces(unit, quantity, product.pcsPerBox, product.boxPerCtn);
    const totalCost = (costPrice || 0) * totalPcs;

    const newItem: OurOrderItem = {
      id: product.id,
      name: product.name,
      barcode: product.barcode || '',
      sku: product.sku,
      unit,
      unitQuantity: quantity,
      quantityNeeded: totalPcs,
      costPrice,
      totalCost,
      pcsPerBox: product.pcsPerBox,
      boxPerCtn: product.boxPerCtn,
      retailPrice: product.retail_price,
      category: product.category,
      itemType: product.item_type || 'Local',
      isNewProduct: false,
      status: 'PENDING'
    };

    setOurOrderList((prev) => {
      const idx = prev.findIndex((i) => i.id === newItem.id);
      if (idx !== -1) {
        const copy = [...prev];
        copy[idx] = newItem;
        return copy;
      }
      return [...prev, newItem];
    });

    setActiveTab('draft');
    toast.success(`Added ${product.name} to Our Order draft!`);
  };

  // Add New Product Handler
  const handleAddNewProduct = (newItem: OurOrderItem) => {
    setOurOrderList((prev) => [...prev, newItem]);
    setActiveTab('draft');
    toast.success(`New product "${newItem.name}" added to Our Order draft!`);
  };

  // Financial Ledger Recording Helper
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
      setVendorLedgers((prev) => [newBill, ...prev]);
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
    const bill = vendorLedgers.find((b) => b.id === billId);
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

    setVendorLedgers((prev) => prev.filter((b) => b.id !== billId));
    toast.success(`Bill of Rs ${bill.amount.toLocaleString()} for ${bill.vendorName} settled!`);
  };

  // Draft Calculation
  const draftTotalCost = useMemo(() => {
    return ourOrderList.reduce((acc, item) => {
      return acc + (item.totalCost || item.quantityNeeded * (item.costPrice || 0));
    }, 0);
  }, [ourOrderList]);

  // Confirm Purchase Order
  const handleConfirmPurchaseOrder = () => {
    if (ourOrderList.length === 0) {
      toast.error('No items in the draft to order.');
      return;
    }

    toast(
      (t) => (
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
                  items: ourOrderList.map((item) => ({
                    ...item,
                    supplierName: supName || undefined,
                    status: 'ORDERED' as const,
                    receivedUnitQuantity: 0,
                    receivedQuantityNeeded: 0
                  })),
                  totalAmount: draftTotalCost,
                  status: 'PENDING'
                };

                setConfirmedOrders((prev) => [newOrder, ...prev]);
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
      ),
      { duration: 8000, position: 'top-center' }
    );
  };

  // WhatsApp Share Generator
  const handleShareWhatsApp = (order: ConfirmedPurchaseOrder) => {
    const supplierText = order.supplierName ? `🏢 *Vendor:* ${order.supplierName}\n` : '';
    let itemsText = '';
    order.items.forEach((it, idx) => {
      const unitText = `${it.unitQuantity || 1} ${it.unit || 'Pcs'} (${it.quantityNeeded} Pcs)`;
      const rateText = it.costPrice ? ` @ Rs. ${it.costPrice.toLocaleString()}/pc` : '';
      const lineTotalText = it.totalCost ? ` -> Rs. ${it.totalCost.toLocaleString()}` : '';
      const statusText =
        it.status === 'RECEIVED'
          ? ' [✓ Received]'
          : it.status === 'PARTIALLY_RECEIVED'
          ? ` [Partial: ${it.receivedUnitQuantity || 0}/${it.unitQuantity || 0}]`
          : '';
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

  // Execute Item Reception Helper
  const executeItemReception = async (
    item: OurOrderItem,
    receivedPieces: number = item.quantityNeeded,
    updateMasterCost: boolean = true
  ) => {
    const existing = products.find((p) => p.id === item.id || (p.barcode && p.barcode === item.barcode));

    if (item.isNewProduct || !existing) {
      const newProduct: Product = {
        id: item.id || generateUUID(),
        name: item.name,
        barcode: item.barcode || 'BC-' + generateUUID().slice(0, 8).toUpperCase(),
        sku: item.sku || generateSKU(item.name, item.barcode),
        price: item.costPrice && item.costPrice > 0 ? item.costPrice : 0,
        stock: receivedPieces,
        pcsPerBox: item.pcsPerBox || 12,
        boxPerCtn: item.boxPerCtn || 6,
        retail_price: item.retailPrice,
        item_type: item.itemType || 'Local'
      };

      if (setProducts) {
        setProducts((prev) => {
          const updated = [newProduct, ...prev.filter((p) => p.id !== newProduct.id)];
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
      const newStock = (existing.stock || 0) + receivedPieces;
      const newPrice =
        updateMasterCost && item.costPrice && item.costPrice > 0 ? item.costPrice : existing.price;

      if (setProducts) {
        setProducts((prev) => {
          const updated = prev.map((p) => (p.id === existing.id ? { ...p, stock: newStock, price: newPrice } : p));
          localStorage.setItem('shaheen_products', JSON.stringify(updated));
          return updated;
        });
      }

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

  // Single Item Reception Opener
  const handleOpenReceiveItem = (orderId: string, item: OurOrderItem) => {
    const order = confirmedOrders.find((o) => o.id === orderId) || null;
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

  const handleConfirmItemReception = async () => {
    const { orderId, item, order, qtyToReceive, markShortShipped, updateMasterCost, paymentMethod } = receiveItemModal;
    if (!item) return;

    const arrivedPieces = calculateTotalBasePieces(
      item.unit || 'Pcs',
      qtyToReceive,
      item.pcsPerBox,
      item.boxPerCtn
    );
    const lineCost = arrivedPieces * (item.costPrice || 0);

    await executeItemReception(item, arrivedPieces, updateMasterCost);

    if (paymentMethod !== 'NONE' && lineCost > 0) {
      recordFinancialTransaction(
        order?.orderNumber || 'DIRECT',
        order?.supplierName || item.supplierName || 'Vendor',
        lineCost,
        paymentMethod
      );
    }

    setConfirmedOrders((prev) =>
      prev.map((po) => {
        if (po.id !== orderId) return po;

        const updatedItems = po.items.map((it) => {
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

        const allReceived = updatedItems.every((it) => it.status === 'RECEIVED');

        return {
          ...po,
          items: updatedItems,
          status: allReceived ? ('RECEIVED' as const) : ('PARTIALLY_RECEIVED' as const)
        };
      })
    );

    toast.success(`Received +${arrivedPieces} pcs of "${item.name}" into inventory!`, { icon: '📦' });
    setReceiveItemModal((prev) => ({ ...prev, isOpen: false, item: null }));
  };

  // Bulk Receive All Opener & Confirm
  const handleOpenReceiveAll = (order: ConfirmedPurchaseOrder) => {
    const unreceived = order.items.filter((i) => i.status !== 'RECEIVED');
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

  const handleConfirmReceiveAll = async () => {
    const { order, updateMasterCost, paymentMethod } = receiveAllModal;
    if (!order) return;

    const unreceived = order.items.filter((i) => i.status !== 'RECEIVED');
    let totalPiecesReceived = 0;
    let totalReceivedCost = 0;

    for (const it of unreceived) {
      const remainingPieces = Math.max(0, it.quantityNeeded - (it.receivedQuantityNeeded || 0));
      await executeItemReception(it, remainingPieces, updateMasterCost);
      totalPiecesReceived += remainingPieces;
      totalReceivedCost += remainingPieces * (it.costPrice || 0);
    }

    if (paymentMethod !== 'NONE' && totalReceivedCost > 0) {
      recordFinancialTransaction(
        order.orderNumber,
        order.supplierName || 'Vendor',
        totalReceivedCost,
        paymentMethod
      );
    }

    setConfirmedOrders((prev) =>
      prev.map((po) => {
        if (po.id !== order.id) return po;
        return {
          ...po,
          items: po.items.map((it) => ({
            ...it,
            receivedUnitQuantity: it.unitQuantity || 1,
            receivedQuantityNeeded: it.quantityNeeded,
            status: 'RECEIVED' as const,
            receivedAt: new Date().toISOString()
          })),
          status: 'RECEIVED',
          paymentMethod: paymentMethod !== 'NONE' ? paymentMethod : po.paymentMethod
        };
      })
    );

    toast.success(
      `All items from Order #${order.orderNumber} (+${totalPiecesReceived} pcs) successfully received!`,
      { icon: '✅' }
    );
    setReceiveAllModal({ isOpen: false, order: null, updateMasterCost: true, paymentMethod: 'NONE' });
  };

  // Order Deletion
  const handleDeleteOrder = (orderId: string, orderNumber: string) => {
    toast(
      (t) => (
        <div className="flex flex-col gap-2 p-1">
          <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
            Delete Order #{orderNumber}?
          </span>
          <span className="text-xs text-slate-500">This will permanently remove this order from history.</span>
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
                setConfirmedOrders((prev) => prev.filter((o) => o.id !== orderId));
                toast.success(`Order #${orderNumber} deleted.`);
              }}
            >
              Yes, Delete
            </button>
          </div>
        </div>
      ),
      { duration: 6000 }
    );
  };

  // Filtering Placed Orders
  const activePlacedOrders = useMemo(() => {
    return confirmedOrders.filter((po) => {
      const isNotReceived = po.status !== 'RECEIVED';
      if (!isNotReceived) return false;
      if (supplierFilter === 'ALL') return true;
      return po.supplierName === supplierFilter;
    });
  }, [confirmedOrders, supplierFilter]);

  const historyPlacedOrders = useMemo(() => {
    return confirmedOrders.filter((po) => {
      const isReceived = po.status === 'RECEIVED';
      if (!isReceived) return false;
      if (supplierFilter === 'ALL') return true;
      return po.supplierName === supplierFilter;
    });
  }, [confirmedOrders, supplierFilter]);

  const activeSuppliersInOrders = useMemo(() => {
    const set = new Set<string>();
    confirmedOrders.forEach((po) => {
      if (po.supplierName) set.add(po.supplierName);
    });
    return Array.from(set);
  }, [confirmedOrders]);

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
          <button
            onClick={() => setIsVendorLedgerModalOpen(true)}
            className={`flex items-center gap-1.5 px-3.5 py-2 font-bold text-xs rounded-lg shadow-sm transition-all border ${
              totalVendorPayables > 0
                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-900/50'
                : 'bg-white hover:bg-slate-50 text-slate-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-slate-300 border-slate-200 dark:border-zinc-700'
            }`}
            title="View vendor credit ledgers and unpaid supplier bills"
          >
            <Wallet
              size={14}
              className={totalVendorPayables > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500'}
            />
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
        <div className="max-w-6xl mx-auto">
          {activeTab === 'draft' && (
            <OrderDraftTab
              ourOrderList={ourOrderList}
              onRemoveItem={(id) => setOurOrderList((prev) => prev.filter((i) => i.id !== id))}
              onClearDraft={() => setOurOrderList([])}
              onConfirmOrder={handleConfirmPurchaseOrder}
              draftSupplier={draftSupplier}
              setDraftSupplier={setDraftSupplier}
              savedSuppliers={savedSuppliers}
              onOpenLowStockWizard={handleOpenLowStockWizard}
              onOpenAddChoiceModal={() => setIsAddChoiceModalOpen(true)}
              lowStockCount={lowStockProducts.length}
            />
          )}

          {activeTab === 'placed' && (
            <PlacedOrdersTab
              activePlacedOrders={activePlacedOrders}
              confirmedOrders={confirmedOrders}
              supplierFilter={supplierFilter}
              setSupplierFilter={setSupplierFilter}
              activeSuppliersInOrders={activeSuppliersInOrders}
              onShareWhatsApp={handleShareWhatsApp}
              onPrintPO={(order) => setPrintOrderModal(order)}
              onReceiveAll={handleOpenReceiveAll}
              onReceiveItem={handleOpenReceiveItem}
              onDeleteOrder={handleDeleteOrder}
              onSwitchToDraft={() => setActiveTab('draft')}
            />
          )}

          {activeTab === 'history' && (
            <ReceivedHistoryTab
              historyPlacedOrders={historyPlacedOrders}
              activePlacedOrdersCount={activePlacedOrders.length}
              expandedHistoryOrderIds={expandedHistoryOrderIds}
              onToggleExpand={(orderId) =>
                setExpandedHistoryOrderIds((prev) => ({ ...prev, [orderId]: !prev[orderId] }))
              }
              onShareWhatsApp={handleShareWhatsApp}
              onPrintPO={(order) => setPrintOrderModal(order)}
              onDeleteOrder={handleDeleteOrder}
              onSwitchToPlaced={() => setActiveTab('placed')}
              onSwitchToDraft={() => setActiveTab('draft')}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      <AddChoiceModal
        isOpen={isAddChoiceModalOpen}
        onClose={() => setIsAddChoiceModalOpen(false)}
        onChooseExisting={() => setIsAddExistingModalOpen(true)}
        onChooseNew={() => setIsAddNewProductModalOpen(true)}
        onChooseLowStock={handleOpenLowStockWizard}
        lowStockCount={lowStockProducts.length}
      />

      <LowStockWizardModal
        isOpen={isLowStockWizardOpen}
        onClose={() => setIsLowStockWizardOpen(false)}
        wizardItems={wizardItems}
        setWizardItems={setWizardItems}
        onConfirm={handleConfirmWizard}
      />

      <AddExistingProductModal
        isOpen={isAddExistingModalOpen}
        onClose={() => setIsAddExistingModalOpen(false)}
        products={products}
        onAdd={handleAddExistingProduct}
      />

      <AddNewProductModal
        isOpen={isAddNewProductModalOpen}
        onClose={() => setIsAddNewProductModalOpen(false)}
        onAdd={handleAddNewProduct}
        existingProducts={products}
      />

      <ReceiveItemModal
        isOpen={receiveItemModal.isOpen}
        onClose={() => setReceiveItemModal((prev) => ({ ...prev, isOpen: false, item: null }))}
        orderId={receiveItemModal.orderId}
        item={receiveItemModal.item}
        order={receiveItemModal.order}
        qtyToReceive={receiveItemModal.qtyToReceive}
        setQtyToReceive={(val) =>
          setReceiveItemModal((prev) => ({
            ...prev,
            qtyToReceive: typeof val === 'function' ? val(prev.qtyToReceive) : val
          }))
        }
        markShortShipped={receiveItemModal.markShortShipped}
        setMarkShortShipped={(val) =>
          setReceiveItemModal((prev) => ({
            ...prev,
            markShortShipped: typeof val === 'function' ? val(prev.markShortShipped) : val
          }))
        }
        updateMasterCost={receiveItemModal.updateMasterCost}
        setUpdateMasterCost={(val) =>
          setReceiveItemModal((prev) => ({
            ...prev,
            updateMasterCost: typeof val === 'function' ? val(prev.updateMasterCost) : val
          }))
        }
        paymentMethod={receiveItemModal.paymentMethod}
        setPaymentMethod={(val) =>
          setReceiveItemModal((prev) => ({
            ...prev,
            paymentMethod: typeof val === 'function' ? val(prev.paymentMethod) : val
          }))
        }
        onConfirm={handleConfirmItemReception}
      />

      <ReceiveAllModal
        isOpen={receiveAllModal.isOpen}
        onClose={() => setReceiveAllModal((prev) => ({ ...prev, isOpen: false, order: null }))}
        order={receiveAllModal.order}
        updateMasterCost={receiveAllModal.updateMasterCost}
        setUpdateMasterCost={(val) =>
          setReceiveAllModal((prev) => ({
            ...prev,
            updateMasterCost: typeof val === 'function' ? val(prev.updateMasterCost) : val
          }))
        }
        paymentMethod={receiveAllModal.paymentMethod}
        setPaymentMethod={(val) =>
          setReceiveAllModal((prev) => ({
            ...prev,
            paymentMethod: typeof val === 'function' ? val(prev.paymentMethod) : val
          }))
        }
        onConfirm={handleConfirmReceiveAll}
      />

      <PrintPOModal order={printOrderModal} onClose={() => setPrintOrderModal(null)} />

      <VendorLedgerModal
        isOpen={isVendorLedgerModalOpen}
        onClose={() => setIsVendorLedgerModalOpen(false)}
        vendorLedgers={vendorLedgers}
        onSettleBill={handleSettleVendorBill}
      />
    </div>
  );
}
