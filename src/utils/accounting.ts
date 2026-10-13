import type { UOMType } from '../types/index';

/**
 * Domain-specific accounting and inventory calculation helpers for Shaheen Global Traders POS.
 * All functions are pure, deterministic, and safe against NaN, negative values, and zero division.
 */

export interface PackagingBreakdown {
  cartons: number;
  boxes: number;
  pieces: number;
  formatted: string;
}

export interface PricingSummary {
  grossTotal: number;
  discountAmount: number;
  netTotal: number;
  totalCost: number;
  estimatedProfit: number;
  profitMarginPercent: number;
}

export interface CashDrawerSummary {
  openingBalance: number;
  cashSales: number;
  cashIn: number;
  cashOut: number;
  expenses: number;
  expectedClosingBalance: number;
  actualClosingBalance: number;
  variance: number;
}

/**
 * Converts a given quantity in Cartons, Boxes, or Pieces to total base pieces.
 * 
 * Rules:
 * - 1 Carton = (boxPerCtn || 6) * (pcsPerBox || 12) base pieces
 * - 1 Box    = (pcsPerBox || 12) base pieces
 * - 1 Piece  = 1 base piece
 */
export function calculateTotalBasePieces(
  unit: UOMType,
  quantity: number,
  pcsPerBox: number = 12,
  boxPerCtn: number = 6
): number {
  const safeQty = Math.max(0, Math.floor(Number(quantity) || 0));
  const safePcsPerBox = Math.max(1, Math.floor(Number(pcsPerBox) || 12));
  const safeBoxPerCtn = Math.max(1, Math.floor(Number(boxPerCtn) || 6));

  switch (unit) {
    case 'Ctn':
      return safeQty * safeBoxPerCtn * safePcsPerBox;
    case 'Box':
      return safeQty * safePcsPerBox;
    case 'Pcs':
    default:
      return safeQty;
  }
}

/**
 * Decomposes a total count of base pieces into human-friendly Cartons, Boxes, and loose Pieces.
 * Useful for warehouse dispatch notes and bulk picking tickets.
 */
export function decomposeBasePieces(
  totalPieces: number,
  pcsPerBox: number = 12,
  boxPerCtn: number = 6
): PackagingBreakdown {
  const safeTotal = Math.max(0, Math.floor(Number(totalPieces) || 0));
  const safePcsPerBox = Math.max(1, Math.floor(Number(pcsPerBox) || 12));
  const safeBoxPerCtn = Math.max(1, Math.floor(Number(boxPerCtn) || 6));

  const piecesPerCarton = safeBoxPerCtn * safePcsPerBox;

  const cartons = Math.floor(safeTotal / piecesPerCarton);
  const remainingAfterCartons = safeTotal % piecesPerCarton;

  const boxes = Math.floor(remainingAfterCartons / safePcsPerBox);
  const pieces = remainingAfterCartons % safePcsPerBox;

  const parts: string[] = [];
  if (cartons > 0) parts.push(`${cartons} Ctn`);
  if (boxes > 0) parts.push(`${boxes} Box`);
  if (pieces > 0 || parts.length === 0) parts.push(`${pieces} Pcs`);

  return {
    cartons,
    boxes,
    pieces,
    formatted: parts.join(' + ')
  };
}

/**
 * Calculates line total given quantity, unit price, and optional line discount.
 */
export function calculateLineTotal(
  quantity: number,
  pricePerUnit: number,
  discount: number = 0
): number {
  const safeQty = Math.max(0, Number(quantity) || 0);
  const safePrice = Math.max(0, Number(pricePerUnit) || 0);
  const safeDiscount = Math.max(0, Number(discount) || 0);

  const subtotal = safeQty * safePrice;
  return Math.max(0, Math.round(subtotal - safeDiscount));
}

/**
 * Calculates profit and margin percent for an item.
 */
export function calculateProfitMetrics(
  costPrice: number,
  retailPrice: number
): { profitPerPiece: number; marginPercent: number } {
  const safeCost = Math.max(0, Number(costPrice) || 0);
  const safeRetail = Math.max(0, Number(retailPrice) || 0);

  if (safeRetail === 0) {
    return { profitPerPiece: 0, marginPercent: 0 };
  }

  const profitPerPiece = safeRetail - safeCost;
  const marginPercent = (profitPerPiece / safeRetail) * 100;

  return {
    profitPerPiece: Math.round(profitPerPiece * 100) / 100,
    marginPercent: Math.round(marginPercent * 10) / 10
  };
}

/**
 * Reconciles customer Khata credit balance after a new transaction or payment.
 */
export function calculateCustomerKhataBalance(
  previousBalance: number,
  invoiceAmount: number,
  amountPaid: number
): number {
  const prev = Number(previousBalance) || 0;
  const invoice = Math.max(0, Number(invoiceAmount) || 0);
  const paid = Math.max(0, Number(amountPaid) || 0);

  // Positive balance means customer owes money
  return prev + invoice - paid;
}

/**
 * Reconciles daily cash register balance from transaction tallies.
 */
export function reconcileCashDrawer(
  openingBalance: number,
  cashSales: number,
  cashIn: number,
  cashOut: number,
  expenses: number,
  actualCountedCash?: number
): CashDrawerSummary {
  const open = Number(openingBalance) || 0;
  const sales = Math.max(0, Number(cashSales) || 0);
  const cin = Math.max(0, Number(cashIn) || 0);
  const cout = Math.max(0, Number(cashOut) || 0);
  const exp = Math.max(0, Number(expenses) || 0);

  const expectedClosingBalance = open + sales + cin - cout - exp;
  const actualClosingBalance = actualCountedCash !== undefined ? Number(actualCountedCash) : expectedClosingBalance;
  const variance = actualClosingBalance - expectedClosingBalance;

  return {
    openingBalance: open,
    cashSales: sales,
    cashIn: cin,
    cashOut: cout,
    expenses: exp,
    expectedClosingBalance,
    actualClosingBalance,
    variance
  };
}

/**
 * Format currency in Pakistani Rupees (PKR) with standard commas.
 */
export function formatPKR(amount: number): string {
  const safe = Number(amount) || 0;
  return `Rs ${safe.toLocaleString('en-PK')}`;
}
