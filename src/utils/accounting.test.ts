import { describe, it, expect } from 'vitest';
import {
  calculateTotalBasePieces,
  decomposeBasePieces,
  calculateLineTotal,
  calculateProfitMetrics,
  calculateCustomerKhataBalance,
  reconcileCashDrawer,
  formatPKR
} from './accounting';

describe('Accounting & Packaging Domain Logic', () => {
  describe('calculateTotalBasePieces', () => {
    it('calculates pieces for Pcs unit', () => {
      expect(calculateTotalBasePieces('Pcs', 25)).toBe(25);
      expect(calculateTotalBasePieces('Pcs', 0)).toBe(0);
    });

    it('calculates base pieces for Box unit', () => {
      // 5 boxes * 12 pcs/box = 60
      expect(calculateTotalBasePieces('Box', 5, 12)).toBe(60);
      // 3 boxes * 24 pcs/box = 72
      expect(calculateTotalBasePieces('Box', 3, 24)).toBe(72);
    });

    it('calculates base pieces for Carton unit', () => {
      // 2 cartons * 6 boxes/ctn * 12 pcs/box = 144
      expect(calculateTotalBasePieces('Ctn', 2, 12, 6)).toBe(144);
      // 1 carton * 10 boxes/ctn * 20 pcs/box = 200
      expect(calculateTotalBasePieces('Ctn', 1, 20, 10)).toBe(200);
    });

    it('gracefully handles zero or negative inputs', () => {
      expect(calculateTotalBasePieces('Ctn', -5, 12, 6)).toBe(0);
      expect(calculateTotalBasePieces('Box', 0, 12)).toBe(0);
    });
  });

  describe('decomposeBasePieces', () => {
    it('decomposes pieces into cartons, boxes, and pieces', () => {
      // 150 pieces with 12 pcs/box and 6 boxes/ctn (72 pcs/ctn)
      // 150 / 72 = 2 cartons (144 pcs)
      // 6 remaining / 12 = 0 boxes, 6 pcs
      const res = decomposeBasePieces(150, 12, 6);
      expect(res.cartons).toBe(2);
      expect(res.boxes).toBe(0);
      expect(res.pieces).toBe(6);
      expect(res.formatted).toBe('2 Ctn + 6 Pcs');
    });

    it('formats pure boxes cleanly', () => {
      // 36 pieces with 12 pcs/box and 6 boxes/ctn (72 pcs/ctn)
      // 0 cartons, 3 boxes, 0 pieces
      const res = decomposeBasePieces(36, 12, 6);
      expect(res.cartons).toBe(0);
      expect(res.boxes).toBe(3);
      expect(res.pieces).toBe(0);
      expect(res.formatted).toBe('3 Box');
    });

    it('handles 0 pieces', () => {
      const res = decomposeBasePieces(0);
      expect(res.cartons).toBe(0);
      expect(res.boxes).toBe(0);
      expect(res.pieces).toBe(0);
      expect(res.formatted).toBe('0 Pcs');
    });
  });

  describe('calculateLineTotal', () => {
    it('multiplies quantity and unit price', () => {
      expect(calculateLineTotal(5, 250)).toBe(1250);
    });

    it('applies discount correctly', () => {
      expect(calculateLineTotal(10, 100, 50)).toBe(950);
    });

    it('never returns negative line total if discount exceeds total', () => {
      expect(calculateLineTotal(2, 50, 200)).toBe(0);
    });
  });

  describe('calculateProfitMetrics', () => {
    it('computes profit and margin correctly', () => {
      const metrics = calculateProfitMetrics(80, 100);
      expect(metrics.profitPerPiece).toBe(20);
      expect(metrics.marginPercent).toBe(20);
    });

    it('safely handles zero retail price', () => {
      const metrics = calculateProfitMetrics(50, 0);
      expect(metrics.profitPerPiece).toBe(0);
      expect(metrics.marginPercent).toBe(0);
    });
  });

  describe('calculateCustomerKhataBalance', () => {
    it('adds new credit invoice to previous debt', () => {
      // Previous debt: 5,000. New invoice: 10,000. Paid: 2,000.
      expect(calculateCustomerKhataBalance(5000, 10000, 2000)).toBe(13000);
    });

    it('handles full payment', () => {
      // Previous debt: 5,000. New invoice: 10,000. Paid: 15,000.
      expect(calculateCustomerKhataBalance(5000, 10000, 15000)).toBe(0);
    });

    it('handles customer credit advance (overpayment)', () => {
      // Customer pays extra 2,000
      expect(calculateCustomerKhataBalance(0, 5000, 7000)).toBe(-2000);
    });
  });

  describe('reconcileCashDrawer', () => {
    it('reconciles daily cash movements accurately', () => {
      // Opening: 10,000
      // Sales: 50,000
      // Cash In: 5,000 (deposit)
      // Cash Out: 2,000
      // Expenses: 3,000 (chai / lunch)
      // Expected = 10k + 50k + 5k - 2k - 3k = 60,000
      const summary = reconcileCashDrawer(10000, 50000, 5000, 2000, 3000, 60000);
      expect(summary.expectedClosingBalance).toBe(60000);
      expect(summary.actualClosingBalance).toBe(60000);
      expect(summary.variance).toBe(0);
    });

    it('detects cash shortages and overages', () => {
      // Expected 50,000, but only 49,500 in drawer -> shortage of 500
      const short = reconcileCashDrawer(10000, 40000, 0, 0, 0, 49500);
      expect(short.variance).toBe(-500);

      // Expected 50,000, but 50,200 in drawer -> overage of 200
      const over = reconcileCashDrawer(10000, 40000, 0, 0, 0, 50200);
      expect(over.variance).toBe(200);
    });
  });

  describe('formatPKR', () => {
    it('formats Pakistani rupees with symbol and commas', () => {
      expect(formatPKR(150000)).toBe('Rs 150,000');
      expect(formatPKR(0)).toBe('Rs 0');
    });
  });
});
