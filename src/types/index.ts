export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  barcode: string;
  item_type?: 'Local' | 'Imported';
  sku?: string;
  pcsPerBox?: number;
  boxPerCtn?: number;
  retail_price?: number;
}

export interface CartItem extends Product {
  cartId: string;
  quantity: number;
  uom?: string;
  basePrice?: number;
}

export interface Order {
  receiptNumber: string | number;
  date: Date;
  items: CartItem[];
  total: number;
  clientName: string;
  area: string;
  address?: string;
  bookerName?: string;
  status: 'Acknowledged' | 'Pending' | 'Rejected' | 'Dispatched';
  idempotency_key?: string;
  id?: string | number;
  shopName?: string;
  phone?: string;
}

export type UOMType = 'Pcs' | 'Box' | 'Ctn';

export interface OurOrderItem {
  id: string;
  name: string;
  barcode: string;
  quantityNeeded: number;
  sku?: string;
  unit?: UOMType;
  unitQuantity?: number;
  costPrice?: number;
  totalCost?: number;
  pcsPerBox?: number;
  boxPerCtn?: number;
  retailPrice?: number;
  category?: string;
  itemType?: 'Local' | 'Imported';
  minStock?: number;
  isNewProduct?: boolean;
  status?: 'PENDING' | 'ORDERED' | 'RECEIVED';
  receivedAt?: string;
}

export interface ConfirmedPurchaseOrder {
  id: string;
  orderNumber: string;
  date: string;
  items: OurOrderItem[];
  totalAmount: number;
  status: 'PENDING' | 'PARTIALLY_RECEIVED' | 'RECEIVED';
}

export interface Booker {
  id?: string;
  booker_number: string;
  name: string;
  username: string;
  phone: string;
  target?: number;
  target_start_date?: string;
  target_end_date?: string;
  auth_token?: string;
}

export interface LedgerPayment {
  id: string;
  clientName: string;
  amount: number;
  date: string;
  notes: string;
}

export interface BookerLocation {
  id: string;
  booker_name: string;
  lat: number;
  lng: number;
  updated_at: string;
}
